"""Ingest knowledge Markdown files into a static vector index.

Reads every `.md` file in `knowledge/federal/` and `knowledge/bc/`,
splits each file into sentence-aligned chunks (512 chars target,
64 chars overlap), embeds each chunk with `all-MiniLM-L6-v2`, and
writes the result to `public/assets/index.json`.

The JSON structure matches `VectorData` in `src/types.ts`:
`{ corpus: [{ text, source }], vectors: [...], sources: [...] }`.
Re-running this script gives the same result.
"""

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
KNOWLEDGE_DIRS = [ROOT / "knowledge" / "federal", ROOT / "knowledge" / "bc"]
OUT_PATH = ROOT / "public" / "assets" / "index.json"

MODEL_NAME = "all-MiniLM-L6-v2"

# Chunking parameters from the plan.
TARGET_CHUNK_SIZE = 512
CHUNK_OVERLAP = 64

# Files with less body text than this are skipped (e.g. placeholders).
MIN_BODY_CHARS = 200


def parse_markdown(path: Path) -> tuple[str, str]:
    """Split frontmatter from body. Return (source, body)."""
    text = path.read_text(encoding="utf-8")
    source = str(path.relative_to(ROOT))
    body = text
    if text.startswith("---"):
        end = text.find("---", 3)
        if end != -1:
            frontmatter = text[3:end]
            body = text[end + 3 :].strip()
            match = re.search(r"^source:\s*(.+)$", frontmatter, re.M)
            if match:
                source = match.group(1).strip()
    # Drop Markdown heading markers and collapse whitespace for chunking.
    body = re.sub(r"^#{1,6}\s*", "", body, flags=re.M)
    body = re.sub(r"[ \t]+", " ", body)
    body = re.sub(r"\n{3,}", "\n\n", body).strip()
    return source, body


def split_sentences(text: str) -> list[str]:
    """Split text into sentences on `.`, `!`, `?` followed by space."""
    parts = re.split(r"(?<=[.!?])\s+(?=[A-Z0-9\"'(\[])", text)
    sentences: list[str] = []
    for part in parts:
        part = part.strip()
        if not part:
            continue
        # Hard-split any overlong sentence so no chunk exceeds ~2x target.
        while len(part) > TARGET_CHUNK_SIZE:
            cut = part.rfind(" ", 0, TARGET_CHUNK_SIZE)
            if cut <= 0:
                cut = TARGET_CHUNK_SIZE
            sentences.append(part[:cut].strip())
            part = part[cut:].strip()
        if part:
            sentences.append(part)
    return sentences


def chunk_text(text: str) -> list[str]:
    """Pack sentences into ~512 char chunks with ~64 char overlap."""
    sentences = split_sentences(text)
    chunks: list[str] = []
    current: list[str] = []
    current_len = 0
    for sentence in sentences:
        extra = len(sentence) + (1 if current else 0)
        if current and current_len + extra > TARGET_CHUNK_SIZE:
            chunks.append(" ".join(current))
            # Carry trailing sentences (~64 chars) into the next chunk.
            overlap: list[str] = []
            overlap_len = 0
            for prev in reversed(current):
                overlap.insert(0, prev)
                overlap_len += len(prev) + 1
                if overlap_len >= CHUNK_OVERLAP:
                    break
            current = overlap
            current_len = sum(len(s) for s in current) + len(current)
        current.append(sentence)
        current_len += len(sentence) + (1 if len(current) > 1 else 0)
    if current:
        chunks.append(" ".join(current))
    return [c for c in chunks if c.strip()]


def main() -> None:
    """Read docs, chunk, embed, and write the vector index."""
    from sentence_transformers import SentenceTransformer

    corpus: list[dict[str, str]] = []
    for knowledge_dir in KNOWLEDGE_DIRS:
        for path in sorted(knowledge_dir.glob("*.md")):
            source, body = parse_markdown(path)
            if len(body) < MIN_BODY_CHARS:
                print(f"Skip {path.name}: only {len(body)} chars of body")
                continue
            file_chunks = chunk_text(body)
            print(f"Chunk {path.name}: {len(body)} chars -> {len(file_chunks)} chunks")
            for chunk in file_chunks:
                corpus.append({"text": chunk, "source": source})

    if not corpus:
        raise SystemExit("No chunks to embed. Check knowledge/ folders.")

    print(f"Load model {MODEL_NAME}")
    model = SentenceTransformer(MODEL_NAME)
    texts = [item["text"] for item in corpus]
    vectors = model.encode(texts, normalize_embeddings=True, show_progress_bar=True)

    sources = sorted({item["source"] for item in corpus})
    data = {
        "corpus": corpus,
        "vectors": [list(map(float, vec)) for vec in vectors],
        "sources": sources,
    }

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUT_PATH.write_text(json.dumps(data), encoding="utf-8")
    print(f"Wrote {OUT_PATH}: {len(corpus)} chunks, {len(sources)} sources")


if __name__ == "__main__":
    main()

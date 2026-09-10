# Report — Plan Execution

## Status

All three phases are complete.
All checkpoints pass.

## Phase 1 — Crawl

Six Markdown files live in `knowledge/federal/`.
Each file holds clean text with frontmatter source and topic.

Steps done:

- Add `requests` and `trafilatura` to `requirements.txt`.
- Create `python_scripts/crawl_federal.py`.
- Define six Canada.ca source URLs in the script.
- Fetch each page with `requests`.
- Convert each page with `trafilatura`.
- Use a main-content fallback for thin pages.
- Save one Markdown file per page.
- Run the script with a two-second delay.
- Delete the federal placeholder file.

Files:

- `python_scripts/crawl_federal.py` (new)
- `requirements.txt` (new)
- `knowledge/federal/*.md` (six new files)

Note: the six pages are short landing pages. Total body text is about nine kilobytes. The file `repayment.md` uses the fallback parser to keep the section list.

## Phase 2 — Ingest

`public/assets/index.json` holds 28 chunks from six sources.
The structure matches `VectorData` in `src/types.ts`.
Repeat runs give byte-identical output.

Steps done:

- Add `sentence-transformers` and `numpy` to `requirements.txt`.
- Create `python_scripts/ingest.py`.
- Read Markdown files from `knowledge/federal` and `knowledge/bc`.
- Skip files with less than 200 body characters.
- Split text into sentence-aligned chunks of 512 characters.
- Overlap chunks by 64 characters.
- Embed chunks with `all-MiniLM-L6-v2`.
- Normalize vectors to match browser search.
- Write `public/assets/index.json`.

## Phase 3 — WebLLM

The app answers with an on-device model.
No API key exists in code or config.
No request goes to OpenRouter.

Steps done:

- Install `@mlc-ai/web-llm` version 0.2.85.
- Create `src/services/llm.ts`.
- Load `gemma-2-2b-it-q4f16_1` with `CreateMLCEngine`.
- Send system prompt plus context to the engine.
- Replace the OpenRouter call in `rag_browser.ts`.
- Reuse `Chunk` and `VectorData` from `src/types.ts`.
- Remove OpenRouter keys from `.env.example`.
- Show model download progress in `ChatInterface`.
- Show an extractive answer on devices without WebGPU.

Extra changes:

- Load WebLLM with a dynamic import to split the bundle.
- Precache JSON and large chunks in `vite.config.ts` for offline use.
- Fix the transformers pipeline option for version 2.

## Verification

- Type check passes for all changed files.
- Build succeeds and precaches nine files.
- Preview serves `index.json` with 28 chunks.
- A test query for repayment returns repayment chunks first.
- No file in `src` or config refers to OpenRouter.

## Notes

- Crawled text keeps the source wording. It does not use STE100. Source truth has priority over style rules here.
- The BC placeholder stays. BC crawl is out of scope.
- README still names OpenRouter. No plan step covers README.
- First run downloads about 1.2 GB of model data. The progress bar shows this step.
- `sw.ts` type errors pre-date this work. I made no change there.

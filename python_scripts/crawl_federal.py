"""Crawl Canada federal student loan pages to Markdown.

Fetches the top-level Canada.ca pages for the Canada Student
Financial Assistance Program, converts each page to clean text
with trafilatura, and saves one Markdown file per page in
knowledge/federal/ with frontmatter (source, topic).
"""

import html as html_module
import re
import time
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse

import requests
import trafilatura

BASE = "https://www.canada.ca"

# Top-level source pages only. No recursive crawling.
SOURCES: list[dict[str, str]] = [
    {
        "url": f"{BASE}/en/services/benefits/education/student-aid/grants-loans.html",
        "slug": "csfa-overview",
        "topic": "csfa-overview",
    },
    {
        "url": f"{BASE}/en/services/benefits/education/student-aid/grants-loans/province-apply.html",
        "slug": "apply-for-student-aid",
        "topic": "apply",
    },
    {
        "url": f"{BASE}/en/services/benefits/education/student-aid/grants-loans/how-funding-works.html",
        "slug": "loan-limits",
        "topic": "loan-limits",
    },
    {
        "url": f"{BASE}/en/services/benefits/education/student-aid/grants-loans/full-time.html",
        "slug": "grants",
        "topic": "grants",
    },
    {
        "url": f"{BASE}/en/services/benefits/education/student-aid/grants-loans/repay.html",
        "slug": "repayment",
        "topic": "repayment",
    },
    {
        "url": f"{BASE}/en/services/benefits/education/student-aid/grants-loans/repay/assistance.html",
        "slug": "repayment-assistance-plan",
        "topic": "repayment-assistance",
    },
]

HEADERS = {
    "User-Agent": "AnteaterBot/1.0 (student-loan research; polite crawl, 2s delay)",
}

# Polite delay between requests (seconds). Canada.ca may limit rapid requests.
REQUEST_DELAY = 2.0

OUT_DIR = Path(__file__).resolve().parent.parent / "knowledge" / "federal"


def fetch(url: str) -> str:
    """Fetch one page. Raise on HTTP error."""
    resp = requests.get(url, headers=HEADERS, timeout=30)
    resp.raise_for_status()
    return resp.text


def to_markdown(html: str, url: str) -> tuple[str, str]:
    """Convert HTML to clean Markdown text. Return (title, body)."""
    downloaded = trafilatura.extract(
        html,
        output_format="markdown",
        include_comments=False,
        include_tables=True,
        include_links=False,
        url=url,
    )
    if not downloaded:
        raise ValueError(f"trafilatura returned no text for {url}")
    trafilatura_body = re.sub(r"\n{3,}", "\n\n", downloaded.strip())
    fallback_body = fallback_markdown(html)
    # Landing pages (e.g. repay.html) lose their section list in
    # trafilatura. Keep whichever extraction holds more content.
    body = trafilatura_body
    if len(fallback_body) > len(trafilatura_body) * 1.5:
        body = fallback_body
    lines = body.splitlines()
    title = ""
    for line in lines:
        stripped = line.strip()
        if stripped.startswith("# "):
            title = stripped[2:].strip()
            break
    if not title:
        # Fall back to the URL slug as title.
        title = urlparse(url).path.rstrip("/").split("/")[-1].replace("-", " ").replace(".html", "")
    # Drop a leading duplicate H1. The file template adds the title.
    body_lines = body.splitlines()
    if body_lines and body_lines[0].strip() == f"# {title}":
        body = "\n".join(body_lines[1:]).strip()
    # Collapse runs of blank lines to at most one.
    body = re.sub(r"\n{3,}", "\n\n", body)
    return title, body


class _MainTextParser(HTMLParser):
    """Collect headings, paragraphs, and list items inside <main>."""

    def __init__(self) -> None:
        super().__init__()
        self.in_main = False
        self.skip = False
        self.current_tag = ""
        self.current_text = ""
        self.blocks: list[tuple[str, str]] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag == "main":
            self.in_main = True
        if not self.in_main:
            return
        if tag in ("script", "style", "form"):
            self.skip = True
        if tag in ("h1", "h2", "h3", "p", "li", "dt", "dd"):
            self.current_tag = tag
            self.current_text = ""

    def handle_endtag(self, tag: str) -> None:
        if tag == "main":
            self.in_main = False
        if tag in ("script", "style", "form"):
            self.skip = False
        if self.in_main and tag == self.current_tag and self.current_tag:
            text = html_module.unescape(re.sub(r"\s+", " ", self.current_text)).strip()
            if text:
                self.blocks.append((self.current_tag, text))
            self.current_tag = ""
            self.current_text = ""

    def handle_data(self, data: str) -> None:
        if self.in_main and not self.skip and self.current_tag:
            self.current_text += data


def fallback_markdown(html: str) -> str:
    """Build Markdown from <main> headings, paragraphs, and lists."""
    parser = _MainTextParser()
    parser.feed(html)
    out: list[str] = []
    for tag, text in parser.blocks:
        if tag == "h1":
            out.append(f"# {text}")
        elif tag == "h2":
            out.append(f"## {text}")
        elif tag == "h3":
            out.append(f"### {text}")
        elif tag == "li":
            out.append(f"- {text}")
        elif tag == "dt":
            out.append(f"### {text}")
        elif tag == "dd":
            out.append(text)
        else:
            out.append(text)
        out.append("")
    return "\n".join(out).strip()


def write_file(slug: str, url: str, topic: str, title: str, body: str) -> Path:
    """Save one page as Markdown with frontmatter. Return the file path."""
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    frontmatter = f"---\nsource: {url}\ntopic: {topic}\n---\n\n# {title}\n\n{body}\n"
    path = OUT_DIR / f"{slug}.md"
    path.write_text(frontmatter, encoding="utf-8")
    return path


def main() -> None:
    """Fetch each source page and save it as Markdown."""
    for i, src in enumerate(SOURCES):
        url, slug, topic = src["url"], src["slug"], src["topic"]
        print(f"[{i + 1}/{len(SOURCES)}] Fetch {url}")
        html = fetch(url)
        title, body = to_markdown(html, url)
        path = write_file(slug, url, topic, title, body)
        print(f"  Saved {path} ({len(body)} chars)")
        if i < len(SOURCES) - 1:
            time.sleep(REQUEST_DELAY)
    print("Done.")


if __name__ == "__main__":
    main()

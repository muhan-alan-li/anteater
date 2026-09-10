# Plan - Crawl Federal Student Loan Pages

## Goal

Download the Canada federal student loan pages.
Save each page as one Markdown file.
Put the files in `knowledge/federal/`.

## Background

The `knowledge/` folder now has only placeholders.
The chat has no real content to search.
The ingest step needs real documents.
This plan provides those documents.

## Sources

Use these Canada.ca pages:
- CSFA overview
- Apply for student aid
- Loan limits
- Grants
- Repayment
- Repayment Assistance Plan

Crawl only the top-level pages.
Do not follow every link on each page.

## Dependencies

Add these Python packages:
- `requests`
- `trafilatura`

Put the list in `requirements.txt`.

## Steps

1. Create `python_scripts/crawl_federal.py`.
2. Add `requests` to `requirements.txt`.
3. Add `trafilatura` to `requirements.txt`.
4. Install the packages with pip.
5. Define the list of source URLs in the script.
6. Fetch each page with `requests`.
7. Convert each page to clean text with `trafilatura`.
8. Rewrite the text as Markdown.
9. Save each page as one `.md` file.
10. Name each file with a URL slug.
11. Add frontmatter to each file. Use `source` and `topic`.
12. Run the script.
13. Review the output in `knowledge/federal/`.

## Files To Change

- `python_scripts/crawl_federal.py` (new)
- `requirements.txt` (new)
- `knowledge/federal/` (new files)

## Risks

- Canada.ca may limit rapid requests.
- The page layout may change without notice.
- Some pages have tables that lose structure as text.
- The crawler may need a polite delay between requests.

## Tradeoffs

A manual copy keeps control over the exact content.
A crawler saves time and keeps one source of truth.
A crawler gives less control over the page structure.

## Out Of Scope

- Crawling BC pages. This plan covers federal only.
- Recursive crawling of all sub-pages.

## Definition Of Done

- Each source page has one `.md` file.
- Each file has clean text without menus or navigation.
- Each file has frontmatter with `source` and `topic`.
- The files are committed to the repository.

# Plan - Ingest Knowledge Into A Vector Index

## Goal

Turn the Markdown documents into chunks.
Embed each chunk as a vector.
Write one JSON file for the app to fetch.

## Background

The app fetches `/assets/index.json`.
That file does not exist in the repository.
The chat returns no useful answers without it.
This plan creates that file.

The app maps uploads with `all-MiniLM-L6-v2`.
The ingest step must use the same model.
The browser then computes cosine similarity.

## Dependencies

Add these Python packages:
- `sentence-transformers`
- `numpy`

Put the list in `requirements.txt`.

## Steps

1. Create `python_scripts/ingest.py`.
2. Add `sentence-transformers` to `requirements.txt`.
3. Add `numpy` to `requirements.txt`.
4. Install the packages with pip.
5. Read every `.md` file in `knowledge/`.
6. Read both folders. Use `knowledge/federal/` and `knowledge/bc/`.
7. Split each file into chunks.
8. Use sentence-aligned chunks. Use 512 characters as the target.
9. Overlap the end of each chunk. Use 64 characters.
10. Embed each chunk with `all-MiniLM-L6-v2`.
11. Build the JSON structure. Match `VectorData` in `src/types.ts`.
12. Use the keys `corpus`, `vectors`, and `sources`.
13. Write the file to `public/assets/index.json`.
14. Run the script.
15. Verify the JSON loads in the browser.

## Files To Change

- `python_scripts/ingest.py` (new)
- `requirements.txt` (new)
- `public/assets/index.json` (new)
- `src/types.ts` (review)

## Risks

- `sentence-transformers` may not run on this Python version.
- The model downloads on first run. It needs a good internet link.
- A large corpus gives a large JSON file.
- A 50-page corpus gives about 500 chunks and 4 MB of vectors.

## Tradeoffs

A static index is fast and works offline.
A static index is not updated until the user runs ingest again.
Browser-side embedding needs the Transformers.js model download.

## Out Of Scope

- Updating the index without a re-run.
- Adding a search UI for the index.

## Definition Of Done

- The app fetches `index.json` from `/assets/`.
- The JSON structure matches `VectorData`.
- The chat returns real answers from the knowledge base.
- Re-running the script gives the same result.

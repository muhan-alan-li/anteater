# Anteater — Student Loan RAG Chatbot (PWA)

A Progressive Web App that provides a chatbot interface for student loan information using browser-based Retrieval-Augmented Generation (RAG).

## Stack

- **Frontend**: React + Vite + TypeScript + Tailwind CSS
- **LLM**: OpenRouter (free tier model, configurable)
- **Embeddings**: `all-MiniLM-L6-v2` (pre-computed, browser-side via Transformers.js + WebGPU)
- **Vector Search**: In-browser cosine similarity on pre-computed embeddings
- **PWA**: Offline-first, installable, service worker caching

## Getting Started

```bash
npm install
npm run dev
```

Build for production:

```bash
npm run build
npm run preview
```

## Data

Documents are stored in `knowledge/`. Run the Python ingest script to generate the static vector index:

```bash
pip install -r requirements.txt
python python_scripts/ingest.py
```

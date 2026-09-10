# AGENTS.md — Agent Rules for Anteater

## 1. Purpose

This file controls how agents work in this repo.
Obey all rules in this file.
Anteater is a PWA chatbot for Canada federal and BC student loan plans.

## 2. Rule 1 — Markdown With ASD-STE100

Write all Markdown files in ASD-STE100 Simplified Technical English, Issue 9.
This rule has top priority.
It applies to all .md files.
Keep sentences short. Use a maximum of 20 words for steps. Use a maximum of 25 words for descriptions.
Use the active voice. Use the command form for steps.
Give one instruction in each sentence.
Use approved words with one meaning only. Use the same word for the same item.
Do not use -ing forms as verbs. Use American English.
Use vertical lists for steps and for complex data.
Approved technical nouns for this repo: PWA, chatbot, RAG, vector data, OpenRouter, IndexedDB, service worker.

## 3. Project

The stack is React 19, Vite 8, TypeScript, Tailwind CSS 4, and vite-plugin-pwa.
The app does RAG in the browser with saved vector data.
It calls OpenRouter for chat answers.
It saves chats in IndexedDB.

## 4. Commands

Use `npm install` to install dependencies.
Use `npm run dev` to start the dev server.
Use `npm run build` to build the app.
Use `npm run preview` to preview the build.
Copy `.env.example` to `.env` before you test the LLM call.
Do not post keys in logs or in code.

## 5. Code Rules

Read target files before you change them.
Keep changes small and local.
Use TypeScript strict mode. Do not add `any` for new code.
Reuse types from `src/types.ts`. Use `@` for paths from `src`.
Keep side effects in services or in `useEffect`.
Do not add a dependency without a clear need. Ask the user before you add a large library.
Keep secrets in `.env`. Do not commit or push unless the user tells you to do so.

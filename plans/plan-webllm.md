# Plan - Run Inference with WebLLM

## Goal

Run the language model in the browser with WebGPU.
Remove the OpenRouter API key.
Remove the dependency on a cloud service.
The app must stay useful when it is offline.

## Background

The app now calls OpenRouter for each answer.
The app needs an API key that is stored in `.env`.
The user must keep the key secret.
This plan removes that key.

WebLLM runs a model on the user's device.
The model executes with WebGPU.
The model downloads once and then stays cached.

## Dependencies

Add this package:
- `@mlc-ai/web-llm`

Do not add any other large library.

## Steps

1. Install `@mlc-ai/web-llm` with npm.
2. Read the WebLLM documentation.
3. Create `src/services/llm.ts`.
4. Use `CreateMLCEngine` to start the engine.
5. Select a small model. Use `gemma-2-2b-it-q4f16_1`.
6. Add a method to generate an answer.
7. Pass the system prompt and the context to the engine.
8. Return the answer as text.
9. Update `rag_browser.ts`.
10. Replace the OpenRouter fetch with the local engine call.
11. Remove `OPENROUTER_API_KEY` from `.env.example`.
12. Add a progress indicator for the model download.
13. Add a fallback for devices without WebGPU.

## Files To Change

- `package.json`
- `src/services/llm.ts` (new)
- `src/services/rag_browser.ts`
- `.env.example`
- `src/components/ChatInterface.tsx`

## Risks

- WebGPU is not available on all devices.
- The model download is large. The 2B model is about 1.2 GB.
- The first answer is slow. The user must wait for the compile step.
- The model uses RAM on the user's device.

## Tradeoffs

PWA no longer needs an API key.
PWA no longer needs an internet connection for answers.
PWA has higher memory use.

## Out Of Scope

- Model selection by the user. Use one fixed model.
- Pre-warming the model after the welcome screen.

## Definition Of Done

- The chat sends no API key.
- The chat generates an answer without a network call to OpenRouter.
- The app keeps an answer flow when it is offline.
- The user sees a progress indicator during the model load.

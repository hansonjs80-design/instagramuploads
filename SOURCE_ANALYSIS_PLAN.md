# Automatic Link Analysis & Smart Classification

## Current audit

### Already ready

- Server-only API routes, private Studio authentication, SQLite repository and content versioning
- Separate Naver and Instagram generation engines, brand rules, copyright and medical-language guards
- Editable Instagram live preview and official Instagram publishing provider

### Gaps addressed by this change

- New Content previously required creator, title and a 40-character script.
- No durable source evidence, transcript, frame, claim, classification override or localization model existed.
- Generation treated pasted script as its only evidence and had no evidence-level language guard.

## Architecture

`SourceAnalysisProvider` owns platform-specific metadata access. YouTube uses the official Data API when configured and never treats caption availability as permission to download caption text. Instagram uses the official oEmbed endpoint only when Meta credentials are configured; otherwise it records minimal URL evidence.

Uploaded media is a separate evidence upgrade path. Audio uses the OpenAI transcription provider when configured. Video processing is capability-gated: the application records an explicit unavailable state instead of pretending it inspected frames when the runtime cannot process the file.

Classification values retain confidence, evidence references, origin state and lock state. Re-analysis merges suggestions without overwriting locked or user-modified values.

## Evidence contract

- A: transcript + frames + metadata
- B: transcript + metadata
- C: frames + metadata
- D: title/description metadata
- E: minimal URL metadata

Source claims are never asserted from D/E evidence. Content generation receives the evidence level and must label metadata-based ideas as inference.

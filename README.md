# chatallin

chatallin is an open-source multi-LLM collaboration platform.

给一个话题，让多个大模型（如 OpenAI / Gemini / DeepSeek）在同一会话中协作讨论，并生成可追溯的统一结论。

## Vision

- Make LLM-to-LLM collaboration simple, transparent, and reproducible
- Let users choose which models participate in each conversation
- Keep the system open, extensible, and community-driven

## Planned MVP Features

- User-defined model selection (choose which models join a session)
- Moderator mode for multi-round collaboration
- Structured final output:
  - conclusion
  - disagreements
  - evidence
  - next actions
- Session replay for auditing and experiments
- BYOK support (bring your own API keys)

## Project Status

Early bootstrap stage. Core architecture and implementation are in progress.

## Roadmap

- [x] Build provider abstraction layer
- [x] Integrate OpenAI, Gemini, DeepSeek adapters
- [x] Implement moderator orchestration flow
- [x] Build web UI for session creation and live transcript
- [x] Add config import/export templates
- [ ] Publish first public release (`v0.1.0`)

## Quick Start

### Backend (current)

```bash
cd backend
npm install
npm run dev
```

Health check:

```bash
curl http://127.0.0.1:3000/healthz
```

List providers:

```bash
curl http://127.0.0.1:3000/providers
```

### Frontend (current)

```bash
cd frontend
npm install
npm run dev
```

Then open the local Vite URL (usually `http://127.0.0.1:5173`) and run an orchestration from the UI.

## Contributing

Contributions are welcome.

Please read [CONTRIBUTING.md](CONTRIBUTING.md) before submitting issues or pull requests.

## License

MIT. See [LICENSE](LICENSE).

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

- [ ] Build provider abstraction layer
- [ ] Integrate OpenAI, Gemini, DeepSeek adapters
- [ ] Implement moderator orchestration flow
- [ ] Build web UI for session creation and live transcript
- [ ] Add config import/export templates
- [ ] Publish first public release (`v0.1.0`)

## Quick Start

Coming soon.

## Contributing

Contributions are welcome.

Please read [CONTRIBUTING.md](CONTRIBUTING.md) before submitting issues or pull requests.

## License

MIT. See [LICENSE](LICENSE).

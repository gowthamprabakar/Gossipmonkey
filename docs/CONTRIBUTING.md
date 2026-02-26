# 🤝 Contributing to Gossip Monkey

First off, thanks for taking the time to contribute! Gossip Monkey is a community-driven project, and we welcome all kinds of contributions.

## 🚀 Getting Started

1.  **Fork the repo** and create your branch from `main`.
2.  **Install dependencies** in both `backend` and `frontend` folders.
3.  **Set up Ollama** if you want to test AI features locally.
4.  **Run the dev servers** and ensure everything is working before making changes.

## 🛠️ Development Workflow

- **Backend**: We use Express and `node:sqlite`. Keep services focused and use the `monkeyService.js` job queue for any external AI calls.
- **Frontend**: We use React and Tailwind. Stick to the terminal aesthetic (monospace fonts, green-on-black).
- **Documentation**: If you add a feature, update the `README.md` or adding a specific doc in `docs/`.

## 📜 Coding Standards

- Use ES Modules (`import`/`export`).
- Follow the existing folder structure.
- Add comments to complex logic, especially around the Socket.IO handlers.
- Ensure all new features are verified with a script in the root (see `backend/verify_...` scripts).

## 🚩 Reporting Issues

- Use GitHub Issues to report bugs or suggest features.
- Provide clear steps to reproduce any bugs.
- Attach screenshots or terminal logs if relevant.

## 🎁 Pull Requests

- Keep PRs focused. One feature/fix per PR is preferred.
- include a description of what changed and why.
- Mention any related issues.

---

Built with 🐒 by the Gossip Monkey Team.

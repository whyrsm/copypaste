# CopyPaste

A simple, no-login pastebin for sharing text instantly. Paste your text, get a shareable link.

## Features

- **No account required** — just paste and share
- **Custom URLs** — optionally set a custom slug for your paste
- **Password protection** — restrict access with a password
- **Expiration** — auto-delete pastes after 1 hour, 1 day, 7 days, or 30 days
- **View & copy tracking** — see how many times a paste has been viewed or copied
- **Raw view** — access paste content as plain text at `/:slug/raw`
- **Dark/light theme** — toggleable with system preference detection

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) runtime

### Installation

```bash
bun install
```

### Configuration

Copy the example env file and adjust as needed:

```bash
cp .env.example .env
```

| Variable  | Default        | Description          |
|-----------|----------------|----------------------|
| `PORT`    | `3000`         | Server port          |
| `DB_PATH` | `copypaste.db` | SQLite database path |

### Running

```bash
# Development (hot reload)
bun run dev

# Production
bun run start
```

The app will be available at `http://localhost:3000`.

## Tech Stack

- [Bun](https://bun.sh) — runtime & SQLite driver
- [Hono](https://hono.dev) — web framework
- Server-rendered HTML with `hono/html` tagged templates

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

## Design Decisions

### No build step
The entire app runs directly with `bun src/index.ts` — no bundler, no transpile step, no watch process for assets. Bun handles TypeScript natively, and the frontend uses vanilla JS served as static files. This keeps the development loop fast and the deployment simple: one process, one command.

### Server-rendered HTML, no frontend framework
Pages are built with Hono's `html` tagged template literals in `src/views.ts`. There's no React, Vue, or HTMX. The tradeoff is intentional: a pastebin doesn't need client-side routing or reactive state — the UI is mostly static with a few sprinkles of JS (copy button, theme toggle, CodeMirror editor). SSR keeps the response fast and the codebase small.

### SQLite over a hosted database
`bun:sqlite` is built into the Bun runtime — no driver to install, no connection pool to manage, no external service to spin up. For a single-instance app with low write concurrency, SQLite in WAL mode is more than sufficient. `DB_PATH` is configurable so the database can be mounted as a persistent volume in production (e.g., Railway).

### Anonymous identity via cookies
There's no auth system. Instead, a random UUID is set as an `httpOnly` cookie on first visit and stored as `author_token` on each paste. This lets users see their own paste history without ever creating an account, while keeping the server stateless between requests.

### Client-side JS kept minimal and separated
Interactive behaviour lives in four small files under `static/` (`theme.js`, `home.js`, `paste.js`, `password.js`). Each file is scoped to one page. The CodeMirror editor is bundled separately in `static/editor.js` and loaded as an ES module only on pages that need it. This way, the password page and error page load zero editor code.

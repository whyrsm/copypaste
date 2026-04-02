# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CopyPaste is a pastebin web app built with **Bun** + **Hono** + **SQLite** (via `bun:sqlite`). Server-rendered HTML using Hono's JSX/html utilities — no frontend framework or build step.

## Commands

- `bun run dev` — start dev server with hot reload
- `bun run start` — start production server

No test framework is configured.

## Architecture

- `src/index.ts` — Hono routes and app entry point. Exports a Bun-compatible server object.
- `src/db.ts` — SQLite database layer. Single `pastes` table with auto-migration for schema changes. Uses WAL mode.
- `src/views.ts` — Server-rendered HTML templates using `hono/html`. Contains all pages (home, paste view, password prompt, error) and inline SVG icons. Client-side JS is embedded as raw script tags.
- `src/slug.ts` — Random slug generator (`adjective-noun-number` format).
- `static/style.css` — Stylesheet served via Hono's `serveStatic`.

## Key Details

- JSX is configured for `hono/jsx` (see tsconfig `jsxImportSource`), but views currently use tagged template literals (`html\`...\``) not JSX.
- Passwords are hashed with `Bun.password.hash`/`verify`.
- Paste expiration is checked on access and cleaned hourly via `setInterval`.
- Environment: `PORT` (default 3000), `DB_PATH` (default `copypaste.db`). See `.env.example`.
- Reserved slugs: `api`, `static`, `favicon.ico`, `health`.
- Max paste size: 512KB.

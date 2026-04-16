# CopyPaste — Code Quality Improvements

Tracking document for code quality improvements before open-source release.

## Priority 1 — High Impact

### [ ] Add test suite
- Set up `bun test`
- Unit tests: `slug.ts` (format, uniqueness), `languages.ts` (isLanguage), `db.ts` (CRUD, expiration, collision)
- Integration tests: route handlers in `index.ts` (create paste, view paste, password flow, expiration, raw endpoint)
- Edge cases: max content length, reserved slugs, invalid slug format
- **Why:** No tests is the biggest red flag for portfolio review. Shows engineering discipline.

### [ ] Add LICENSE file
- Pick a license (MIT recommended for pastebin)
- **Why:** Required for open-source. Without it, code is technically all-rights-reserved.

### [ ] Extract inline JS from `views.ts`
- Move client-side scripts to separate files in `/static/`:
  - `static/theme.js` — theme toggle + persistence
  - `static/wake.js` — Railway wake-server helper
  - `static/home.js` — form submit handler, localStorage history on home page
  - `static/paste.js` — copy handlers, localStorage history save on paste page
  - `static/password.js` — password form wake handler
- Keep `views.ts` as pure HTML templates
- **Why:** `views.ts` is 637 lines. Inline JS can't be linted, tested, or cached by browsers.

## Priority 2 — Medium Impact

### [x] Add rate limiting
- Add in-memory rate limiter on `POST /api/paste` (e.g., 10 pastes/min per IP)
- Consider `POST /:slug/copy` as well
- **Why:** Without this, anyone can fill the DB with spam.

### [x] Fix TypeScript types in `editor-client.ts`
- Add proper types to `resolveLang(name)`, `mount(options)`, `themeExtension(theme)`
- Define an `EditorMountOptions` interface
- **Why:** Strict mode is on in tsconfig but the build step skips type checking. Inconsistent.

### [x] Add linter/formatter (Biome)
- Install Biome: `bun add -d @biomejs/biome`
- Add `biome.json` config
- Add scripts: `"lint": "biome check src/"`, `"format": "biome format src/ --write"`
- **Why:** Ensures consistent style for contributors. Biome is fast and works well with Bun.

### [x] Fix XSS risk in `myPastesPage`
- `views.ts:547-561`: Slug rendered via `raw()` string concatenation without escaping
- Refactor to use Hono's `html` tagged template for proper escaping
- Slugs are validated on create, but corrupt/old DB data could bypass this
- **Why:** Defense in depth. Shows security awareness.

### [x] Validate paste exists in copy endpoint
- `POST /:slug/copy` blindly calls `incrementCopies` without checking paste exists
- Return 404 if paste not found
- **Why:** Correctness. Minor but shows attention to detail.

## Priority 3 — Polish

### [ ] CI quality gates
- Add to GitHub Actions workflow: `bun tsc --noEmit` (type check), `bun test`, `biome check`
- Fail the build on lint/type/test errors
- **Why:** Prevents regressions. Shows mature development workflow.

### [ ] Improve slug entropy
- Current: 60 adj × 60 noun × 100 num = 360K combinations
- Consider: expand word lists or increase number range (0-9999)
- Document the collision probability and retry strategy
- **Why:** Not urgent but worth noting as a known limitation.

### [ ] README improvements
- Add screenshots/GIF demo
- Add live demo link
- Add architecture diagram (simple)
- Add "Tech Stack" section
- **Why:** First thing visitors see on GitHub. Strong README = strong first impression.

### [ ] Add CONTRIBUTING.md
- Setup instructions, code style, PR guidelines
- **Why:** Signals the project is ready for contributors.

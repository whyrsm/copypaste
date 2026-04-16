import { html, raw } from "hono/html";
import type { HtmlEscapedString } from "hono/utils/html";
import { LANGUAGES, LANGUAGE_LABELS, type Language } from "./languages";
import type { Paste } from "./db";

// Inline SVG icons (Lucide-style, 20x20)
const icons = {
  clipboard: raw(
    `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="2" width="6" height="4" rx="1"/><path d="M8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2"/></svg>`
  ),
  check: raw(
    `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>`
  ),
  link: raw(
    `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`
  ),
  lock: raw(
    `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`
  ),
  clock: raw(
    `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`
  ),
  fileText: raw(
    `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>`
  ),
  send: raw(
    `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z"/><path d="m21.854 2.147-10.94 10.939"/></svg>`
  ),
  shield: raw(
    `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>`
  ),
  alertCircle: raw(
    `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>`
  ),
  plus: raw(
    `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>`
  ),
  code: raw(
    `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`
  ),
  calendar: raw(
    `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/></svg>`
  ),
  unlock: raw(
    `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>`
  ),
  history: raw(
    `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/></svg>`
  ),
  home: raw(
    `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>`
  ),
  eye: raw(
    `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/></svg>`
  ),
  sun: raw(
    `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>`
  ),
  moon: raw(
    `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>`
  ),
  maximize: raw(
    `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/></svg>`
  ),
  minimize: raw(
    `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3v3a2 2 0 0 1-2 2H3"/><path d="M21 8h-3a2 2 0 0 1-2-2V3"/><path d="M3 16h3a2 2 0 0 1 2 2v3"/><path d="M16 21v-3a2 2 0 0 1 2-2h3"/></svg>`
  ),
};

function layout(title: string, children: HtmlEscapedString | Promise<HtmlEscapedString>) {
  return html`<!doctype html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${title} - CopyPaste</title>
        <link rel="stylesheet" href="/static/style.css" />
        ${raw(`<script>
          (function(){
            var t = localStorage.getItem('theme');
            if (t) document.documentElement.setAttribute('data-theme', t);
          })();
        </script>`)}
      </head>
      <body>
        <div class="container">
          <header>
            <a href="/" class="logo">
              <span class="logo-icon">${icons.clipboard}</span>
              <span>CopyPaste</span>
            </a>
            <div class="header-actions">
              <button class="btn-icon" id="theme-toggle" title="Toggle theme">
                <span class="icon-sun">${icons.sun}</span>
                <span class="icon-moon">${icons.moon}</span>
              </button>
              <a href="/my" class="btn-icon" title="My pastes">${icons.history}</a>
              <a href="/" class="btn-icon" title="New paste">${icons.plus}</a>
            </div>
          </header>
          <main>${children}</main>
          <footer>
            <span>CopyPaste</span>
            <span class="dot"></span>
            <span>Simple. No login. Just paste.</span>
            <span class="dot"></span>
            <span>Uses cookies to remember your pastes</span>
          </footer>
        </div>
        ${raw('<script src="/static/theme.js"></script>')}
      </body>
    </html>`;
}

export function homePage(error?: string) {
  return layout(
    "New Paste",
    html`
      <div class="hero">
        <h1>Share text instantly</h1>
        <p>Paste your text, get a shareable link. No account needed.</p>
      </div>

      ${error ? html`<div class="toast error">${icons.alertCircle} ${error}</div>` : ""}
      <form method="POST" action="/api/paste" class="card" id="paste-form">
        <div class="card-body">
          <div class="editor-wrapper" id="editor-wrapper">
            <div class="editor-toolbar">
              <div class="editor-toolbar-left">
                <label for="language" class="editor-lang-label">
                  <span class="label-icon">${icons.code}</span>
                  Language
                </label>
                <select id="language" name="language" class="editor-lang-select">
                  ${raw(
                    LANGUAGES.map(
                      (l) =>
                        `<option value="${l}"${l === "plaintext" ? " selected" : ""}>${LANGUAGE_LABELS[l]}</option>`
                    ).join("")
                  )}
                </select>
              </div>
              <button type="button" class="btn-icon" id="fullscreen-btn" title="Toggle fullscreen" aria-pressed="false">
                <span class="icon-max">${icons.maximize}</span>
                <span class="icon-min" style="display:none">${icons.minimize}</span>
              </button>
            </div>
            <div id="editor-mount" class="editor-mount"></div>
            <textarea
              name="content"
              id="content-input"
              required
              maxlength="524288"
              aria-hidden="true"
              tabindex="-1"
              class="editor-hidden-input"
            ></textarea>
          </div>
        </div>

        <div class="card-footer">
          <div class="options">
            <div class="field">
              <label for="slug">
                <span class="label-icon">${icons.link}</span>
                Custom URL
              </label>
              <input
                type="text"
                id="slug"
                name="slug"
                placeholder="my-custom-url"
                pattern="[a-zA-Z0-9_-]{3,100}"
                title="3-100 characters: letters, numbers, hyphens, underscores"
              />
              <span class="hint">Leave blank for a random URL</span>
            </div>

            <div class="field">
              <label for="password">
                <span class="label-icon">${icons.lock}</span>
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                placeholder="Optional"
              />
              <span class="hint">Viewers must enter this to see</span>
            </div>

            <div class="field">
              <label for="expires_in">
                <span class="label-icon">${icons.clock}</span>
                Expires
              </label>
              <select id="expires_in" name="expires_in">
                <option value="">Never</option>
                <option value="1h">1 hour</option>
                <option value="1d">1 day</option>
                <option value="7d">7 days</option>
                <option value="30d">30 days</option>
              </select>
              <span class="hint">Auto-delete after this time</span>
            </div>
          </div>

          <button type="submit" class="btn-primary" id="submit-btn">
            ${icons.send}
            <span class="submit-label">Create Paste</span>
          </button>
        </div>
      </form>

      <div id="recent-pastes" class="recent-pastes" style="display:none">
        <h3>My Recent Pastes</h3>
        <div id="recent-list" class="recent-list"></div>
        <a href="/my" class="view-all-link">View all my pastes &rarr;</a>
      </div>

      <div class="how-it-works">
        <h3>How it works</h3>
        <div class="steps">
          <div class="step">
            <div class="step-num">1</div>
            <div class="step-text">
              <strong>Paste</strong>
              <span>Type or paste your text into the box above.</span>
            </div>
          </div>
          <div class="step">
            <div class="step-num">2</div>
            <div class="step-text">
              <strong>Customize</strong>
              <span>Optionally set a custom URL, password, or expiration.</span>
            </div>
          </div>
          <div class="step">
            <div class="step-num">3</div>
            <div class="step-text">
              <strong>Share</strong>
              <span>Hit create and share the link with anyone.</span>
            </div>
          </div>
        </div>
      </div>

      ${raw('<script type="module" src="/static/editor.js"></script>')}
      ${raw('<script type="module" src="/static/home.js"></script>')}
    `
  );
}

export function pastePage(paste: {
  slug: string;
  content: string;
  views: number;
  copies: number;
  created_at: string;
  expires_at: string | null;
  language: string | null;
}, isAuthor: boolean = false) {
  const created = new Date(paste.created_at).toLocaleString();
  const expires = paste.expires_at
    ? new Date(paste.expires_at).toLocaleString()
    : null;
  const language = (paste.language && (LANGUAGES as readonly string[]).includes(paste.language)
    ? (paste.language as Language)
    : "plaintext");
  const langLabel = LANGUAGE_LABELS[language];

  return layout(
    paste.slug,
    html`
      <div class="share-bar">
        <span class="share-label">${icons.link} Share this paste:</span>
        <code class="share-url" id="share-url"></code>
        <button onclick="copyUrl()" class="btn-action" id="url-btn" title="Copy link">
          ${icons.clipboard} <span class="url-label">Copy Link</span>
        </button>
      </div>

      <div class="card">
        <div class="paste-toolbar">
          <div class="paste-meta">
            <span class="slug">${icons.fileText} /${paste.slug}</span>
            <div class="meta-tags">
              <span class="tag">${icons.code} ${langLabel}</span>
              <span class="tag">${icons.calendar} ${created}</span>
              <span class="tag">${icons.eye} ${String(paste.views)} ${paste.views === 1 ? "view" : "views"}</span>
              <span class="tag" id="copy-count">${icons.clipboard} <span id="copy-num">${String(paste.copies)}</span> ${paste.copies === 1 ? "copy" : "copies"}</span>
              ${expires ? html`<span class="tag">${icons.clock} Expires ${expires}</span>` : ""}
            </div>
          </div>
          <div class="paste-actions">
            <button type="button" class="btn-icon" id="fullscreen-btn" title="Toggle fullscreen" aria-pressed="false">
              <span class="icon-max">${icons.maximize}</span>
              <span class="icon-min" style="display:none">${icons.minimize}</span>
            </button>
            <button onclick="copyContent()" class="btn-action" id="copy-btn" title="Copy to clipboard">
              <span class="copy-icon">${icons.clipboard}</span>
              <span class="check-icon" style="display:none">${icons.check}</span>
              <span class="copy-label">Copy</span>
            </button>
            <a href="/${paste.slug}/raw" class="btn-action" title="View raw">
              ${icons.code}
              <span>Raw</span>
            </a>
          </div>
        </div>
        <div class="paste-body">
          <div class="editor-wrapper viewer" id="editor-wrapper" data-language="${language}">
            <div id="editor-mount" class="editor-mount"></div>
            <pre class="paste-content" id="paste-fallback"><code>${paste.content}</code></pre>
          </div>
        </div>
      </div>
      ${raw(`<script id="paste-data" type="application/json">${JSON.stringify({
        content: paste.content,
        language,
        expiresAt: paste.expires_at,
      })}</script>`)}
      ${isAuthor ? raw('<script>window.__isAuthor = true;</script>') : ''}
      ${raw('<script type="module" src="/static/editor.js"></script>')}
      ${raw('<script type="module" src="/static/paste.js"></script>')}
    `
  );
}

export function myPastesPage(pastes: Paste[]) {
  return layout(
    "My Pastes",
    html`
      <div class="card">
        <div class="my-pastes-header">
          <h2>${icons.fileText} My Pastes</h2>
          <p class="subtitle">Based on your browser session. Clearing cookies will reset this list.</p>
        </div>
        ${pastes.length === 0
          ? html`<div class="empty-state">
              <p>No pastes found. <a href="/">Create one</a> to get started.</p>
            </div>`
          : html`<div class="table-wrap">
              <table class="paste-table">
                <thead>
                  <tr>
                    <th>Slug</th>
                    <th>Language</th>
                    <th>Created</th>
                    <th>Expires</th>
                    <th>Views</th>
                    <th>Copies</th>
                  </tr>
                </thead>
                <tbody>
                  ${raw(pastes.map(p => {
                    const created = new Date(p.created_at).toLocaleDateString();
                    const expires = p.expires_at ? new Date(p.expires_at).toLocaleDateString() : "Never";
                    const lang = p.language && (LANGUAGES as readonly string[]).includes(p.language)
                      ? LANGUAGE_LABELS[p.language as Language]
                      : "Plain Text";
                    return `<tr>
                      <td><a href="/${p.slug}">${p.password_hash ? '<span class="lock-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></span> ' : ''}/${p.slug}</a></td>
                      <td>${lang}</td>
                      <td>${created}</td>
                      <td>${expires}</td>
                      <td>${p.views}</td>
                      <td>${p.copies}</td>
                    </tr>`;
                  }).join(""))}
                </tbody>
              </table>
            </div>`
        }
      </div>
    `
  );
}

export function passwordPage(slug: string, error?: string) {
  return layout(
    "Password Required",
    html`
      <div class="card center-card">
        <div class="lock-hero">
          ${icons.shield}
        </div>
        <h2>Password Protected</h2>
        <p class="subtitle">This paste requires a password to view.</p>
        ${error ? html`<div class="toast error inline">${error}</div>` : ""}
        <form method="POST" action="/${slug}" class="password-form" id="pw-form">
          <div class="input-group">
            <input
              type="password"
              name="password"
              placeholder="Enter password"
              required
              autofocus
            />
            <button type="submit" class="btn-primary compact" id="pw-btn">
              ${icons.unlock}
              <span class="pw-label">Unlock</span>
            </button>
          </div>
        </form>
        ${raw('<script src="/static/password.js"></script>')}
      </div>
    `
  );
}

export function errorPage(message: string, status: number = 404) {
  return layout(
    "Error",
    html`
      <div class="card center-card">
        <div class="error-hero">
          ${icons.alertCircle}
        </div>
        <h2>${String(status)}</h2>
        <p class="subtitle">${message}</p>
        <a href="/" class="btn-primary compact">
          ${icons.home}
          <span>Back to Home</span>
        </a>
      </div>
    `
  );
}

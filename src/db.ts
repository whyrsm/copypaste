import { Database } from "bun:sqlite";

const DB_PATH = process.env.DB_PATH || "copypaste.db";
const db = new Database(DB_PATH, { create: true });

// Enable WAL mode for better concurrent read performance
db.run("PRAGMA journal_mode = WAL");

export function initDb() {
  db.run(`
    CREATE TABLE IF NOT EXISTS pastes (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      slug          TEXT UNIQUE NOT NULL,
      content       TEXT NOT NULL,
      password_hash TEXT,
      views         INTEGER NOT NULL DEFAULT 0,
      copies        INTEGER NOT NULL DEFAULT 0,
      created_at    TEXT NOT NULL DEFAULT (datetime('now')),
      expires_at    TEXT
    )
  `);
  db.run(`
    CREATE INDEX IF NOT EXISTS idx_pastes_slug ON pastes (slug)
  `);

  // Migrate: add columns if missing
  const columns = db.query<{ name: string }, []>("PRAGMA table_info(pastes)").all().map((c) => c.name);
  if (!columns.includes("views")) {
    db.run("ALTER TABLE pastes ADD COLUMN views INTEGER NOT NULL DEFAULT 0");
  }
  if (!columns.includes("copies")) {
    db.run("ALTER TABLE pastes ADD COLUMN copies INTEGER NOT NULL DEFAULT 0");
  }
  if (!columns.includes("language")) {
    db.run("ALTER TABLE pastes ADD COLUMN language TEXT");
  }
  if (!columns.includes("author_token")) {
    db.run("ALTER TABLE pastes ADD COLUMN author_token TEXT");
  }
  db.run("CREATE INDEX IF NOT EXISTS idx_pastes_author_token ON pastes (author_token)");
}

export interface Paste {
  id: number;
  slug: string;
  content: string;
  password_hash: string | null;
  views: number;
  copies: number;
  created_at: string;
  expires_at: string | null;
  language: string | null;
  author_token: string | null;
}

export function insertPaste(
  slug: string,
  content: string,
  passwordHash: string | null,
  expiresAt: string | null,
  language: string | null,
  authorToken: string | null
): boolean {
  try {
    db.run(
      "INSERT INTO pastes (slug, content, password_hash, expires_at, language, author_token) VALUES (?, ?, ?, ?, ?, ?)",
      [slug, content, passwordHash, expiresAt, language, authorToken]
    );
    return true;
  } catch (err: any) {
    if (err.message?.includes("UNIQUE constraint failed")) {
      return false;
    }
    throw err;
  }
}

export function getPaste(slug: string): Paste | null {
  return db.query<Paste, [string]>(
    "SELECT id, slug, content, password_hash, views, copies, created_at, expires_at, language, author_token FROM pastes WHERE slug = ?"
  ).get(slug);
}

export function getPastesByAuthor(authorToken: string): Paste[] {
  return db.query<Paste, [string]>(
    "SELECT id, slug, content, password_hash, views, copies, created_at, expires_at, language, author_token FROM pastes WHERE author_token = ? ORDER BY created_at DESC LIMIT 100"
  ).all(authorToken);
}

export function incrementViews(slug: string) {
  db.run("UPDATE pastes SET views = views + 1 WHERE slug = ?", [slug]);
}

export function incrementCopies(slug: string) {
  db.run("UPDATE pastes SET copies = copies + 1 WHERE slug = ?", [slug]);
}

export function deletePaste(slug: string) {
  db.run("DELETE FROM pastes WHERE slug = ?", [slug]);
}

export function cleanExpired() {
  db.run("DELETE FROM pastes WHERE expires_at IS NOT NULL AND expires_at < datetime('now')");
}

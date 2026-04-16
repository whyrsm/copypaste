// Test setup: use in-memory SQLite so tests never touch the real database file.
// This file is loaded via bunfig.toml [test].preload before any test modules.
process.env.DB_PATH = ':memory:';

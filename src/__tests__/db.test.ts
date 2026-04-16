import { beforeAll, describe, expect, test } from "bun:test";

import {
  cleanExpired,
  deletePaste,
  getPaste,
  getPastesByAuthor,
  incrementCopies,
  incrementViews,
  initDb,
  insertPaste,
} from "../db";

beforeAll(() => {
  initDb();
});

describe("insertPaste / getPaste", () => {
  test("insertPaste returns true on success", () => {
    const ok = insertPaste(
      "test-slug-1",
      "hello world",
      null,
      null,
      "plaintext",
      "token-abc",
    );
    expect(ok).toBe(true);
  });

  test("getPaste returns the inserted paste with correct fields", () => {
    insertPaste(
      "test-slug-fields",
      "content here",
      null,
      null,
      "javascript",
      "token-fields",
    );
    const paste = getPaste("test-slug-fields");
    expect(paste).not.toBeNull();
    expect(paste!.slug).toBe("test-slug-fields");
    expect(paste!.content).toBe("content here");
    expect(paste!.language).toBe("javascript");
    expect(paste!.author_token).toBe("token-fields");
    expect(paste!.password_hash).toBeNull();
    expect(paste!.expires_at).toBeNull();
    expect(typeof paste!.views).toBe("number");
    expect(typeof paste!.copies).toBe("number");
    expect(typeof paste!.id).toBe("number");
    expect(typeof paste!.created_at).toBe("string");
  });

  test("getPaste returns null for nonexistent slug", () => {
    const paste = getPaste("does-not-exist-999");
    expect(paste).toBeNull();
  });

  test("insertPaste returns false on duplicate slug (UNIQUE constraint)", () => {
    insertPaste("dup-slug", "first", null, null, null, null);
    const ok = insertPaste("dup-slug", "second", null, null, null, null);
    expect(ok).toBe(false);
  });

  test("getPaste returns all expected fields", () => {
    insertPaste(
      "full-fields-slug",
      "full content",
      null,
      null,
      "python",
      "token-full",
    );
    const paste = getPaste("full-fields-slug");
    expect(paste).not.toBeNull();
    const fields: (keyof NonNullable<typeof paste>)[] = [
      "id",
      "slug",
      "content",
      "password_hash",
      "views",
      "copies",
      "created_at",
      "expires_at",
      "language",
      "author_token",
    ];
    for (const field of fields) {
      expect(field in paste!).toBe(true);
    }
  });
});

describe("incrementViews", () => {
  test("increments the view count", () => {
    insertPaste("views-slug", "view me", null, null, null, null);
    const before = getPaste("views-slug")!;
    incrementViews("views-slug");
    const after = getPaste("views-slug")!;
    expect(after.views).toBe(before.views + 1);
  });
});

describe("incrementCopies", () => {
  test("increments the copy count", () => {
    insertPaste("copies-slug", "copy me", null, null, null, null);
    const before = getPaste("copies-slug")!;
    incrementCopies("copies-slug");
    const after = getPaste("copies-slug")!;
    expect(after.copies).toBe(before.copies + 1);
  });
});

describe("deletePaste", () => {
  test("removes the paste (getPaste returns null after)", () => {
    insertPaste("delete-slug", "bye", null, null, null, null);
    expect(getPaste("delete-slug")).not.toBeNull();
    deletePaste("delete-slug");
    expect(getPaste("delete-slug")).toBeNull();
  });
});

describe("cleanExpired", () => {
  test("removes pastes with past expiry but keeps future ones", () => {
    // SQLite datetime('now') returns "YYYY-MM-DD HH:MM:SS" in UTC.
    // Store expiry values in the same format so string comparison works.
    function toSqliteUTC(date: Date): string {
      return date
        .toISOString()
        .replace("T", " ")
        .replace(/\.\d{3}Z$/, "");
    }
    // Expired paste: expiry 2 seconds in the past
    const pastExpiry = toSqliteUTC(new Date(Date.now() - 2000));
    // Future paste: expiry 1 hour in the future
    const futureExpiry = toSqliteUTC(new Date(Date.now() + 60 * 60 * 1000));

    insertPaste("expired-slug", "old content", null, pastExpiry, null, null);
    insertPaste("future-slug", "fresh content", null, futureExpiry, null, null);
    // No expiry paste
    insertPaste("no-expiry-slug", "forever content", null, null, null, null);

    cleanExpired();

    expect(getPaste("expired-slug")).toBeNull();
    expect(getPaste("future-slug")).not.toBeNull();
    expect(getPaste("no-expiry-slug")).not.toBeNull();
  });
});

describe("getPastesByAuthor", () => {
  test("returns pastes by author token, ordered by created_at DESC", async () => {
    const token = "author-token-order-test";

    insertPaste("author-slug-1", "first", null, null, null, token);
    // SQLite datetime('now') has second-level precision; sleep >1s to ensure distinct timestamps
    await Bun.sleep(1100);
    insertPaste("author-slug-2", "second", null, null, null, token);

    const pastes = getPastesByAuthor(token);
    expect(pastes.length).toBe(2);
    // Most recent (slug-2) should come first
    expect(pastes[0].slug).toBe("author-slug-2");
    expect(pastes[1].slug).toBe("author-slug-1");
  });

  test("returns empty array for unknown token", () => {
    const pastes = getPastesByAuthor("nonexistent-token-xyz");
    expect(pastes).toEqual([]);
  });
});

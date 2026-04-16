import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import { getCookie, setCookie } from "hono/cookie";
import { initDb, insertPaste, getPaste, getPastesByAuthor, deletePaste, incrementViews, incrementCopies, cleanExpired } from "./db";
import { generateSlug } from "./slug";
import { homePage, pastePage, passwordPage, errorPage, myPastesPage } from "./views";
import { isLanguage } from "./languages";

const app = new Hono<{ Variables: { authorToken: string } }>();

const RESERVED_SLUGS = new Set(["api", "static", "favicon.ico", "health", "my"]);
const SLUG_REGEX = /^[a-zA-Z0-9_-]{3,100}$/;
const MAX_CONTENT_LENGTH = 512 * 1024; // 512KB

// In-memory rate limiter: max 10 paste creates per IP per minute
const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 60 * 1000;
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }
  if (entry.count >= RATE_LIMIT) return true;
  entry.count++;
  return false;
}

// Periodically purge expired rate limit entries to avoid memory growth
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitMap) {
    if (now > entry.resetAt) rateLimitMap.delete(ip);
  }
}, RATE_WINDOW_MS);

// Static files
app.use("/static/*", serveStatic({ root: "./" }));

// Anonymous author token cookie
app.use("*", async (c, next) => {
  let token = getCookie(c, "author_token");
  if (!token) {
    token = crypto.randomUUID();
    setCookie(c, "author_token", token, {
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
      maxAge: 60 * 60 * 24 * 400, // 400 days (max allowed)
    });
  }
  c.set("authorToken", token);
  await next();
});

// Home page
app.get("/", (c) => c.html(homePage()));

// Health check
app.get("/health", (c) => c.json({ status: "ok" }));

// My pastes
app.get("/my", (c) => {
  const authorToken = c.get("authorToken");
  const pastes = getPastesByAuthor(authorToken);
  return c.html(myPastesPage(pastes));
});

// Create paste
app.post("/api/paste", async (c) => {
  const ip = c.req.header("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  if (isRateLimited(ip)) {
    return c.html(homePage("Too many pastes. Please wait a minute and try again."), 429);
  }

  const body = await c.req.parseBody();
  const content = String(body.content || "").trim();
  const customSlug = String(body.slug || "").trim();
  const password = String(body.password || "");
  const expiresIn = String(body.expires_in || "");
  const languageInput = String(body.language || "plaintext");
  const language = isLanguage(languageInput) ? languageInput : "plaintext";

  if (!content) {
    return c.html(homePage("Content is required."), 400);
  }

  if (content.length > MAX_CONTENT_LENGTH) {
    return c.html(homePage("Content is too large (max 512KB)."), 400);
  }

  // Determine slug
  let slug: string;
  if (customSlug) {
    if (!SLUG_REGEX.test(customSlug)) {
      return c.html(
        homePage(
          "Invalid slug. Use 3-100 characters: letters, numbers, hyphens, underscores."
        ),
        400
      );
    }
    if (RESERVED_SLUGS.has(customSlug.toLowerCase())) {
      return c.html(homePage("This slug is reserved."), 400);
    }
    slug = customSlug;
  } else {
    slug = generateSlug();
  }

  // Hash password if provided
  let passwordHash: string | null = null;
  if (password) {
    passwordHash = await Bun.password.hash(password);
  }

  // Compute expiration
  let expiresAt: string | null = null;
  if (expiresIn) {
    const now = Date.now();
    const durations: Record<string, number> = {
      "1h": 60 * 60 * 1000,
      "1d": 24 * 60 * 60 * 1000,
      "7d": 7 * 24 * 60 * 60 * 1000,
      "30d": 30 * 24 * 60 * 60 * 1000,
    };
    if (durations[expiresIn]) {
      expiresAt = new Date(now + durations[expiresIn]).toISOString();
    }
  }

  // Insert with collision retry
  const authorToken = c.get("authorToken");
  for (let attempt = 0; attempt < 3; attempt++) {
    const ok = insertPaste(slug, content, passwordHash, expiresAt, language, authorToken);
    if (ok) {
      return c.redirect(`/${slug}`, 303);
    }
    // Collision
    if (customSlug) {
      return c.html(homePage("This slug is already taken."), 409);
    }
    slug = generateSlug();
  }

  return c.html(errorPage("Failed to create paste. Please try again.", 500), 500);
});

// Track copy event
app.post("/:slug/copy", (c) => {
  const slug = c.req.param("slug");
  const paste = getPaste(slug);
  if (!paste) {
    return c.json({ error: "Not found" }, 404);
  }
  incrementCopies(slug);
  return c.json({ ok: true });
});

// Raw paste content
app.get("/:slug/raw", (c) => {
  const slug = c.req.param("slug");
  const paste = getPaste(slug);

  if (!paste) {
    return c.text("Not found", 404);
  }

  if (paste.expires_at && new Date(paste.expires_at) < new Date()) {
    deletePaste(slug);
    return c.text("Not found", 404);
  }

  if (paste.password_hash) {
    return c.text("This paste is password protected", 403);
  }

  return c.text(paste.content);
});

// View paste
app.get("/:slug", (c) => {
  const slug = c.req.param("slug");
  const paste = getPaste(slug);

  if (!paste) {
    return c.html(errorPage("Paste not found."), 404);
  }

  if (paste.expires_at && new Date(paste.expires_at) < new Date()) {
    deletePaste(slug);
    return c.html(errorPage("This paste has expired."), 404);
  }

  if (paste.password_hash) {
    return c.html(passwordPage(slug));
  }

  const isAuthor = paste.author_token === c.get("authorToken");
  incrementViews(slug);
  return c.html(pastePage({ ...paste, views: paste.views + 1 }, isAuthor));
});

// Submit password for protected paste
app.post("/:slug", async (c) => {
  const slug = c.req.param("slug");
  const body = await c.req.parseBody();
  const password = String(body.password || "");

  const paste = getPaste(slug);

  if (!paste) {
    return c.html(errorPage("Paste not found."), 404);
  }

  if (paste.expires_at && new Date(paste.expires_at) < new Date()) {
    deletePaste(slug);
    return c.html(errorPage("This paste has expired."), 404);
  }

  if (!paste.password_hash) {
    incrementViews(slug);
    return c.html(pastePage({ ...paste, views: paste.views + 1 }));
  }

  const valid = await Bun.password.verify(password, paste.password_hash);
  if (!valid) {
    return c.html(passwordPage(slug, "Incorrect password."), 401);
  }

  incrementViews(slug);
  return c.html(pastePage({ ...paste, views: paste.views + 1 }));
});

// Global error handler
app.onError((err, c) => {
  console.error(err);
  return c.html(errorPage("Something went wrong.", 500), 500);
});

// Initialize
initDb();

// Clean expired pastes every hour
setInterval(cleanExpired, 60 * 60 * 1000);

const port = parseInt(process.env.PORT || "3000");
console.log(`CopyPaste running on http://localhost:${port}`);

export default {
  port,
  fetch: app.fetch,
};

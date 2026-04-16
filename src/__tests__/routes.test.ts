import { describe, expect, test } from 'bun:test';

const { default: server } = await import('../index');

async function req(path: string, options?: RequestInit) {
  return server.fetch(new Request('http://localhost' + path, options));
}

async function formReq(path: string, fields: Record<string, string>) {
  const body = new URLSearchParams(fields);
  return req(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
}

describe('GET /health', () => {
  test('returns 200 with { status: "ok" }', async () => {
    const res = await req('/health');
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ status: 'ok' });
  });
});

describe('POST /api/paste', () => {
  test('valid content redirects (303) to /:slug', async () => {
    const res = await formReq('/api/paste', { content: 'hello world' });
    expect(res.status).toBe(303);
    const location = res.headers.get('location');
    expect(location).toBeTruthy();
    expect(location).toMatch(/^\/.+/);
  });

  test('empty content returns 400', async () => {
    const res = await formReq('/api/paste', { content: '' });
    expect(res.status).toBe(400);
  });

  test('content exceeding 512KB returns 400', async () => {
    const bigContent = 'x'.repeat(512 * 1024 + 1);
    const res = await formReq('/api/paste', { content: bigContent });
    expect(res.status).toBe(400);
  });

  test('custom slug redirects to that slug', async () => {
    const res = await formReq('/api/paste', { content: 'custom slug paste', slug: 'my-custom-slug' });
    expect(res.status).toBe(303);
    const location = res.headers.get('location');
    expect(location).toBe('/my-custom-slug');
  });

  test('reserved slug returns 400', async () => {
    const res = await formReq('/api/paste', { content: 'trying reserved', slug: 'api' });
    expect(res.status).toBe(400);
  });

  test('invalid slug format returns 400', async () => {
    // Too short (less than 3 chars)
    const res = await formReq('/api/paste', { content: 'bad slug', slug: 'ab' });
    expect(res.status).toBe(400);
  });

  test('duplicate custom slug returns 409', async () => {
    await formReq('/api/paste', { content: 'first', slug: 'taken-slug' });
    const res = await formReq('/api/paste', { content: 'second', slug: 'taken-slug' });
    expect(res.status).toBe(409);
  });
});

describe('GET /:slug', () => {
  test('returns 200 with HTML containing the slug for existing paste', async () => {
    // Create a paste first
    const createRes = await formReq('/api/paste', { content: 'view test content', slug: 'view-test-slug' });
    expect(createRes.status).toBe(303);

    const res = await req('/view-test-slug');
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain('view-test-slug');
  });

  test('returns 404 for nonexistent slug', async () => {
    const res = await req('/this-slug-does-not-exist-xyz');
    expect(res.status).toBe(404);
  });
});

describe('GET /:slug/raw', () => {
  test('returns the raw text content', async () => {
    await formReq('/api/paste', { content: 'raw content here', slug: 'raw-test-slug' });

    const res = await req('/raw-test-slug/raw');
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toBe('raw content here');
  });

  test('returns 404 text for nonexistent slug', async () => {
    const res = await req('/nonexistent-raw-slug/raw');
    expect(res.status).toBe(404);
    const text = await res.text();
    expect(text).toContain('Not found');
  });
});

describe('POST /:slug/copy', () => {
  test('returns { ok: true }', async () => {
    await formReq('/api/paste', { content: 'copy tracking test', slug: 'copy-track-slug' });

    const res = await req('/copy-track-slug/copy', { method: 'POST' });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ ok: true });
  });
});

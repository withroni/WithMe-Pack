import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

/**
 * Sends a photo to the WithMe-Pack proxy, which asks Claude what is in it.
 *
 * Returns `null` whenever recognition is unavailable — not configured, offline,
 * rejected, malformed — and the caller falls back to the canned demo list. The
 * scan is a convenience, so it should never be able to block the flow.
 *
 * Both values are `EXPO_PUBLIC_*`, meaning they are inlined into the JS bundle
 * and are extractable from a shipped binary. That is acceptable for a test
 * build and NOT acceptable for a public release — see server/README.md.
 */
const URL = process.env.EXPO_PUBLIC_SCAN_URL;
const TOKEN = process.env.EXPO_PUBLIC_SCAN_TOKEN;

export const scanConfigured = Boolean(URL && TOKEN);

/** Long edge cap. Claude bills images per 28×28 patch, so this is the cost dial. */
const MAX_EDGE = 1000;
const TIMEOUT_MS = 45_000;

async function toBase64Jpeg(uri: string): Promise<string | null> {
  const rendered = await ImageManipulator.manipulate(uri).renderAsync();
  const longEdge = Math.max(rendered.width, rendered.height);

  // Only ever downscale — enlarging a small photo would just cost more tokens.
  const ctx = ImageManipulator.manipulate(uri);
  const sized =
    longEdge > MAX_EDGE
      ? rendered.width >= rendered.height
        ? ctx.resize({ width: MAX_EDGE })
        : ctx.resize({ height: MAX_EDGE })
      : ctx;

  const out = await (await sized.renderAsync()).saveAsync({
    base64: true,
    compress: 0.7,
    format: SaveFormat.JPEG,
  });
  return out.base64 ?? null;
}

export async function recognizeItems(uri: string): Promise<string[] | null> {
  if (!URL || !TOKEN) return null;

  try {
    const image = await toBase64Jpeg(uri);
    if (!image) return null;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const res = await fetch(URL, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-app-token': TOKEN },
        body: JSON.stringify({ image, mediaType: 'image/jpeg' }),
        signal: controller.signal,
      });
      if (!res.ok) return null;

      const data: unknown = await res.json();
      const items = (data as { items?: unknown })?.items;
      if (!Array.isArray(items)) return null;

      const clean = items.filter((i): i is string => typeof i === 'string' && i.trim().length > 0);
      return clean.length ? clean.map((i) => i.trim()) : null;
    } finally {
      clearTimeout(timer);
    }
  } catch {
    return null;
  }
}

import type { VercelRequest, VercelResponse } from '@vercel/node';
import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { z } from 'zod';

/**
 * Turns a photo of a packed bag into a list of items, for the 사진으로 만들기 flow.
 *
 * TEST-GRADE, not public-release-grade. The shared token below is baked into the
 * app bundle and can be pulled out of an APK, so it stops drive-by scanners and
 * nothing more. Before this endpoint is exposed to real users it needs per-device
 * attestation (Play Integrity / App Attest). Until then the real backstop against
 * a runaway bill is the spend limit on the Anthropic console — set one.
 */

const MODEL = 'claude-opus-5';

/** ~2MB of base64 ≈ a 1.5MB JPEG. The app downsizes to 1000px before sending. */
const MAX_IMAGE_CHARS = 2_000_000;

const MEDIA_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const;

const RequestBody = z.object({
  image: z.string().min(1).max(MAX_IMAGE_CHARS),
  mediaType: z.enum(MEDIA_TYPES),
});

const Recognized = z.object({
  items: z
    .array(z.string())
    .describe('가방에 들어 있거나 사진에 보이는 물건 이름. 한국어 명사, 각 12자 이내.'),
});

/**
 * The prompt lives here, never in the request. If the client could supply it,
 * this endpoint would just be a free general-purpose Claude proxy.
 */
const SYSTEM = [
  '너는 여행 짐 체크리스트 앱의 이미지 인식기다.',
  '사진에 보이는, 여행에 챙길 만한 물건만 골라 목록으로 만든다.',
  '규칙:',
  '- 한국어 일반 명사로 쓴다. 브랜드명이나 상표는 쓰지 않는다.',
  '- 가방, 파우치 같은 담는 물건도 짐이면 포함한다.',
  '- 배경, 가구, 바닥, 벽, 사람은 넣지 않는다.',
  '- 사람을 식별하거나 묘사하지 않는다.',
  '- 확실하지 않으면 넣지 않는다. 추측으로 채우지 않는다.',
  '- 비슷한 것은 하나로 합친다 (양말 세 켤레 → "양말").',
  '- 최대 15개. 짐으로 볼 만한 게 없으면 빈 목록을 반환한다.',
].join('\n');

/**
 * Best-effort throttle. Serverless instances come and go, so this is a speed
 * bump per warm instance, not a real limit — hence the console spend cap.
 */
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 10;
const hits: number[] = [];

function throttled(): boolean {
  const now = Date.now();
  while (hits.length && now - hits[0] > WINDOW_MS) hits.shift();
  if (hits.length >= MAX_PER_WINDOW) return true;
  hits.push(now);
  return false;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  const expected = process.env.APP_TOKEN;
  if (!expected) return res.status(500).json({ error: 'server_misconfigured' });
  if (req.headers['x-app-token'] !== expected) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  if (throttled()) return res.status(429).json({ error: 'rate_limited' });

  const parsed = RequestBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'bad_request' });
  const { image, mediaType } = parsed.data;

  const client = new Anthropic();

  try {
    const response = await client.messages.parse({
      model: MODEL,
      max_tokens: 4096,
      system: SYSTEM,
      // Low effort keeps the round trip inside the serverless timeout; naming
      // visible objects does not need a long reasoning pass.
      output_config: { effort: 'low', format: zodOutputFormat(Recognized) },
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mediaType, data: image } },
            { type: 'text', text: '이 사진에서 챙길 물건을 찾아줘.' },
          ],
        },
      ],
    });

    if (response.stop_reason === 'refusal') {
      return res.status(422).json({ error: 'refused' });
    }

    const items = (response.parsed_output?.items ?? [])
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 15);

    // Deliberately no logging of the image or the result — the photo passes
    // through and is not retained anywhere.
    return res.status(200).json({ items });
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) {
      return res.status(500).json({ error: 'bad_api_key' });
    }
    if (error instanceof Anthropic.RateLimitError) {
      return res.status(429).json({ error: 'rate_limited' });
    }
    if (error instanceof Anthropic.APIError) {
      return res.status(502).json({ error: 'upstream_error', status: error.status });
    }
    return res.status(500).json({ error: 'unexpected' });
  }
}

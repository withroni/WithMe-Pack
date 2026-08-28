# WithMe-Pack scan proxy

One Vercel function. The app posts a photo; this asks Claude what is in it and
returns a list of item names.

It exists because the Anthropic API key must never ship inside the app — an APK
can be unzipped and read.

## Deploy

1. **Import this repo in Vercel** and set **Root Directory** to `server`.
2. Add two Environment Variables in the Vercel dashboard:

   | Name | Value |
   | --- | --- |
   | `ANTHROPIC_API_KEY` | your key from https://platform.claude.com/settings/keys |
   | `APP_TOKEN` | `openssl rand -hex 32` |

3. Deploy. The endpoint is `https://<your-deployment>.vercel.app/api/scan`.

Then point the app at it — see `app/.env.example`.

`vercel.json` asks for a 60s max duration. If your plan caps lower, Vercel will
say so on deploy; lower the number and expect the occasional timeout on large
photos (the app falls back to its demo list when a scan fails, so nothing breaks).

## Check it

```bash
# 401 — no token
curl -i -X POST https://<deployment>.vercel.app/api/scan \
  -H 'content-type: application/json' -d '{}'

# 200 — real scan
curl -X POST https://<deployment>.vercel.app/api/scan \
  -H 'content-type: application/json' \
  -H "x-app-token: $APP_TOKEN" \
  -d "{\"image\":\"$(base64 -w0 bag.jpg)\",\"mediaType\":\"image/jpeg\"}"
```

## Security — read this before going public

**This is test-grade.** `APP_TOKEN` is compiled into the app bundle, so anyone
who unzips a released APK gets it and can spend your credits. That is fine while
only you have the build. It is **not** fine for a store release.

What is in place:

- **The prompt lives on the server.** The client sends an image and nothing else,
  so this cannot be repurposed as a general-purpose Claude proxy.
- **Shared-token auth** — stops drive-by scanners, stops nothing determined.
- **A body-size cap** and a per-warm-instance throttle. Serverless instances are
  created and destroyed freely, so the throttle is a speed bump, not a limit.
- **No logging of the photo or the result.** The image passes through and is not
  retained here. Anthropic states that images are deleted after the request and
  are not used for training.

**Set a spend limit** at https://platform.claude.com/settings/limits. With
token auth being what it is, that limit is the actual ceiling on your bill.

Before a public release, add per-device attestation — Play Integrity on Android,
App Attest on iOS — and verify the attestation here. That is the only control
that survives someone reading the binary.

## Cost

Opus 5 at high-resolution tier. The app downscales to a 1000px long edge before
sending, which puts a photo in the region of a cent per scan. Watch the real
numbers on the Anthropic console for the first few days.

To trade quality for cost, change `MODEL` in `api/scan.ts` to `claude-haiku-4-5`
— roughly 20x cheaper for image input — and compare results on your own photos.

# 짐 — Pack It

Native app built from the Claude Design handoff in `../project/Packing Checklist v2 (바텀시트).dc.html`
(the bottom-sheet UX variant), with Expo + React Native + TypeScript.

## Run it

```bash
npm install
npm run ios       # or: npm run android
```

`npm run web` also works — handy for quick layout checks in a browser.

The native modules (Reanimated, Gesture Handler, SVG, AsyncStorage, Image Picker)
need a dev build or Expo Go; `babel-preset-expo` wires up the Reanimated/Worklets
babel plugin automatically, so there is no `babel.config.js`.

## Getting an Android APK

Three routes, in order of least setup. All produce the same app.

### 1. GitHub Actions — no accounts, no local tooling

Push the repo to GitHub. `.github/workflows/android-apk.yml` builds on every push
to `app/**` and attaches the APK to the run; download it from the run summary and
sideload it (Settings → allow install from this source).

You can also trigger it by hand from the Actions tab (**Run workflow**).

### 2. EAS Build — one command, needs a free Expo account

```bash
npx eas login
npx eas build --profile preview --platform android
```

`preview` is configured to emit an APK rather than an AAB, so the download link
installs directly. This is also the route for iOS later — it builds without a Mac.

### 3. Locally — needs Android Studio / the Android SDK

```bash
npx expo run:android --variant release
```

### Signing

Expo's template signs `release` with its own bundled debug keystore, which is why
all three routes give you something installable with no key setup. That is fine
for sideloading and internal testing, and updates install over each other.

**Before any Play Store upload**, generate a real keystore and point the `release`
signing config at it — a debug-signed build is rejected. EAS handles this for you
(`eas build --profile production`, which emits an AAB); a manual key follows
[the React Native signing guide](https://reactnative.dev/docs/signed-apk-android).

`app.json` currently declares `com.packit.app` as the package name. Change it to
something you own before publishing — it is permanent once a listing exists.

## Running it without a build

There is also a single-file web bundle: one `.html` with the JS and subset fonts
inlined, no external requests, so it can go on any static host and be opened on a
phone.

```bash
pip install fonttools brotli      # for pyftsubset
node tools/build-web-single-file.mjs
```

Same app, but the web build: no haptics, and scroll/gesture feel is the browser's
rather than the platform's.

## Icons

`assets/` is generated, not hand-drawn — `python3 tools/make-icons.py` redraws the
launcher, adaptive, monochrome, splash and favicon art from the design palette.
The mark is the app's own checkbox, the one element that survives 48dp.

## What the screens are

One screen, not a tab bar — that is the whole point of this variant.

- **온보딩** — pick 미니멀 / 기본 / 맥시멀, or build a list from a bag photo.
- **체크리스트** — the default and only screen. Rename the list, check items off,
  edit or delete them inline, add more at the bottom.
- **하단 독** — `저장` (archive with progress intact) · centre notebook button ·
  `전부` (check everything). The side buttons grey out when there is nothing to do.
- **바텀시트** — the centre button raises 최근 체크리스트 over the list: saved runs,
  the three preset packs, and 사진으로 새로 만들기. Tap the handle, tap the scrim,
  or drag it down to dismiss.
- **사진 인식** — a simulated scan (1.5s) over the chosen photo, then chips to
  keep or drop before starting the list.

## How the prototype maps onto React Native

| Prototype (CSS) | Here |
| --- | --- |
| `box-shadow: 4px 4px 0 #17140F` | `Sticker` / `StickerButton` — a solid offset View behind the content, since RN shadows are always blurred |
| `transform: translate(3px,3px)` + `box-shadow: 0 0 0` on `:active` | only the content animates; the shadow block stays put, which is what the CSS pair actually does |
| `border: 2.5px dashed` + radius | `DashedBox` draws an SVG `Rect` with `strokeDasharray` (RN's dashed border is unreliable with radii, especially on Android) |
| `@keyframes` (pop, tick, rise, toastin, shimmer, blink, wiggle, fadein, veil, cardup, b1–b8) | Reanimated worklets; the original cubic-beziers are named in `src/anim.ts` |
| `sc-if` / `sc-for` / `renderVals()` | plain JSX + the `usePacking` hook |
| `DCLogic` class state | `usePacking` — same actions, same undo semantics |
| 390×844 artboard with a phone frame | real full-screen layout using safe-area insets |

Fonts are bundled, not fetched: Pretendard (4 weights) in `assets/fonts/`, and
Space Grotesk 700 deep-imported from `@expo-google-fonts/space-grotesk` so the
other four weights stay out of the bundle. Pretendard covers the full Hangul
syllable range, so each unused weight would cost ~2.7MB.

## Deliberate departures from the prototype

Three, all called out so they are easy to revert:

1. **State persists.** The prototype forgot everything on reload. Here the current
   list and the archive go to `AsyncStorage` (debounced 300ms), and onboarding is
   skipped once a list exists. See `src/storage.ts`.
2. **The toast no longer covers the completion sheet.** Both were bottom-anchored
   and overlapped in the prototype, which hid 「보관함에 넣고 새로 시작」 — the sheet's
   only button. They now stack, so UNDO stays reachable too.
3. **The check "pop" fires on check as well as uncheck.** The prototype's style
   ordering meant `@keyframes pop` only ever played when *unchecking*, which
   contradicts the brief ("체크 시 스프링 팝"). Treated as a prototype bug.

Also added, since a phone affords it: drag-to-dismiss on the sheet, and light
haptics on check / complete.

The photo scan is still a demo — it returns a canned list after 1.5s and does no
recognition, exactly like the prototype. `RECOGNIZED` in `src/data/packs.ts` is
where a real model would plug in.

## Layout

```
App.tsx                     root: fonts, stage / dock / sheet / scan stacking
src/
  theme.ts                  palette, font families, em→px letter-spacing helper
  anim.ts                   the prototype's cubic-beziers, by name
  usePacking.ts             all app state and actions
  storage.ts                AsyncStorage read/write
  types.ts, data/packs.ts   presets, recognised-item list, confetti colours
  components/
    Sticker.tsx             hard offset shadow, static and pressable
    DashedBox.tsx           SVG dashed rounded outline
    Icons.tsx               the three dock icons, paths from the prototype
    ItemRow.tsx             checkbox row with pop / done transitions
    ProgressBar.tsx         elastic fill
    Dock.tsx                저장 · 시트 · 전부
    RecentSheet.tsx         the bottom sheet
    DoneSheet.tsx           완료 sheet with the wiggling ✓
    Confetti.tsx            the b1–b8 burst
    Toast.tsx               undo toast
    FadeIn.tsx              screen entrance
  screens/
    Onboarding.tsx  Checklist.tsx  Scan.tsx
```

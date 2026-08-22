# Shipping CaliQuest to the Apple App Store

This is a start-to-finish guide for taking CaliQuest — currently a Next.js web
app deployed on AWS Amplify — and getting it live on the Apple App Store. It's
written for someone who has never submitted an app before, so it covers the
Apple bureaucracy as well as the code.

**Read this first:** `ROADMAP.md` already lists "Native mobile app" under
*Deferred*. This doc is what "un-deferring" it actually involves.

---

## 1. TL;DR — the recommended path

CaliQuest is a **server-rendered Next.js app** with Supabase auth, server
actions, and middleware (`src/middleware.ts`). It is not a static site, so it
can't be exported to static HTML and bundled offline (`next export` /
`output: 'export'` would break auth, server actions, and every server
component that fetches data).

That rules out a "fully offline native bundle" and points at one clear
approach:

> **Wrap the existing app with [Capacitor](https://capacitorjs.com/) and
> point it at the production Amplify URL.** Ship it as a thin native shell
> (WKWebView) with a handful of real native capabilities layered on top
> (push notifications, status bar/splash control, safe-area handling, share
> sheet), rather than a bare browser wrapper.

Why this over the alternatives:

| Option | Verdict |
|---|---|
| **Capacitor wrapper around the existing Next.js app** (recommended) | Reuses 100% of the current codebase, auth, and Amplify deployment. Ships fastest. Requires adding a few native touches to pass App Review. |
| **Rewrite in React Native / Expo** | Full second codebase to build and maintain forever. Not justified unless the web app is being deprecated. |
| **Submit the PWA directly** | Not possible — Apple does not accept installing a PWA from the App Store; you still need a native wrapper (Capacitor, or a service like PWABuilder, which does the same thing under the hood). |
| **Native Swift/SwiftUI rewrite** | Best long-term native UX, but 3-6+ months of new work duplicating everything already built. |

The good news: CaliQuest is already unusually well-prepared for this. It has:
- `src/app/manifest.ts` — a web app manifest
- `appleWebApp: { capable: true, statusBarStyle: 'black-translucent' }` in `src/app/layout.tsx`
- `viewportFit: 'cover'` + safe-area handling baked into the mobile-first rules in `CLAUDE.md`
- Mobile-first UI across the board (bottom nav, 44px touch targets, etc.)

That's most of the "does it feel native enough" problem already solved.

---

## 2. Apple's rules you need to know about *before* you build anything

These aren't optional preferences — get them wrong and Apple rejects the
build, which costs you a review cycle (typically 24-48h, sometimes longer).

1. **Guideline 4.2 (Minimum Functionality)** — Apple explicitly rejects apps
   that are "simply a website wrapped in a native shell." A Capacitor wrapper
   is allowed, but only if it feels like an app: native navigation chrome,
   fast/responsive interactions, and ideally at least one real native
   capability (push notifications is the standard one). A bare `WKWebView`
   pointed at the site with no native touches is a common rejection reason.
2. **Guideline 5.1.1(v) (Account Deletion)** — since CaliQuest lets users
   create an account, Apple **requires** an in-app way to delete the account
   and its data, not just a "contact support to delete" flow. **This does not
   exist in the app today** (there's no delete-account action anywhere in
   `src/app`) — it needs to be built before submission. This is one of the
   most common first-time rejection reasons.
3. **Guideline 5.1.1 (Privacy Policy)** — you must provide a live, public
   privacy policy URL in App Store Connect. There's currently no privacy
   policy page in the app or repo — you need one hosted at a stable URL
   (e.g. `caliquest.app/privacy`, doesn't have to be in this codebase).
4. **Guideline 4.8 (Sign in with Apple)** — this is only triggered if you
   offer a third-party/social login (Google, Facebook, etc.) as a sign-in
   option — if you do, you must also offer Sign in with Apple. Today
   CaliQuest only has Supabase email/password auth (`src/app/(auth)/login`),
   so **this doesn't currently apply** — just don't add "Sign in with Google"
   later without also adding "Sign in with Apple."
5. **App Privacy "Nutrition Label"** — in App Store Connect you must declare
   exactly what data the app collects (email, workout logs, location if you
   use the gym-finder map, etc.) and whether it's used for tracking. This is
   a questionnaire, not code, but you need to know your own data flows
   (Supabase tables) to answer it accurately.
6. **Encryption / Export Compliance** — every build asks whether the app uses
   encryption. Standard HTTPS/TLS (which is all this app uses) qualifies for
   the standard exemption — answer "Yes, but it only uses exempt standard
   encryption," which avoids extra paperwork.
7. **Apple review needs to be able to log in.** If workouts/quests are
   gated behind auth (they are), you must provide a demo account
   (email + password) in the App Review notes so the reviewer can get past
   login. Create a seeded demo account for this.

---

## 3. Practical / business prerequisites

Do these in parallel with development — some take days to process.

1. **Apple Developer Program enrollment** — https://developer.apple.com/programs/
   - **$99/year**, renews annually or the app comes down.
   - Enroll as an **Individual** (fastest, your legal name shows as the seller)
     or an **Organization** (shows your company name, but requires a D-U-N-S
     number — free but can take 1-2 weeks to obtain if your business doesn't
     already have one). If you want "CaliQuest" branded as the seller rather
     than your personal name, start the D-U-N-S lookup now — it's the
     longest lead-time item in this whole process.
   - Needs a valid Apple ID with 2FA enabled.
   - Approval is usually same-day for individuals, longer for orgs.
2. **A Mac.** Xcode (required to build/sign/submit an iOS app) only runs on
   macOS. You need either:
   - Your own Mac (any recent Apple Silicon Mac works fine), or
   - A cloud Mac CI runner for builds (GitHub Actions `macos-14` runners,
     MacStadium, or Xcode Cloud) — useful for repeatable CI builds, but you'll
     still want local Xcode access at least once for setup and debugging.
3. **Install Xcode** from the Mac App Store (free, ~15GB). Accept the license,
   let it install additional components.
4. **App Store Connect record** — https://appstoreconnect.apple.com/ (unlocked
   once your Developer Program membership is active)
   - Register a **Bundle ID** (e.g. `com.caliquest.app`) in the Developer
     Portal's Certificates/Identifiers/Profiles section.
   - Create a new App record in App Store Connect using that bundle ID.
5. **Domain / hosting decisions**
   - Decide the production URL the app will point at (your Amplify domain,
     or a custom domain like `app.caliquest.com` if you want one — worth
     setting up now since it'll be in App Store metadata and the privacy
     policy link).
6. **Legal pages** — write and host:
   - Privacy Policy (required)
   - Support URL / contact page (required — can be a simple page or a
     `mailto:` support email, but Apple wants a real URL)
   - Terms of Service (not strictly required but recommended once you have paying/competitive features)
7. **App Store listing assets** (can be done later but budget time for them):
   - App name, subtitle, description, keywords, category (Health & Fitness)
   - App icon: **1024×1024px PNG**, no alpha channel, no rounded corners
     (Apple applies the mask) — you'll need to generate this from the
     existing `src/app/icon.svg`
   - Screenshots for at least the 6.7" iPhone size (others can be
     auto-generated by App Store Connect from the largest set in recent
     Xcode versions, but plan for 6.7" and 5.5" to be safe)
   - Age rating questionnaire answers
8. **Banking/tax info** — only needed if the app is ever paid or sells IAP;
   skip this if CaliQuest stays free with no in-app purchases at launch.

---

## 4. Required app changes before submission

Concrete engineering work in this repo, on top of the Capacitor wrapper
itself:

- [x] **Account deletion flow** (Guideline 5.1.1(v), blocking). Implemented:
  `src/lib/services/account.service.ts` deletes the Supabase auth user via
  the Admin API (`src/lib/supabase/admin.ts`, needs
  `SUPABASE_SERVICE_ROLE_KEY` set server-side — the same var
  `scripts/import-osm-gyms.ts` already uses). Every table the user *owns*
  (workouts, sets, skills, quests, friendships, squad membership/posts,
  notifications, fist-bumps, gym reviews/suggestions) cascades automatically
  from the `profiles` → `auth.users` `on delete cascade` chain already in
  `supabase/schema.sql`; rows they merely *created* (`gyms.created_by`,
  `squads.created_by`) use `on delete set null`, so a gym/squad they set up
  survives for other members. Wired up via `deleteAccountAction` in
  `src/app/(app)/profile/actions.ts` (logged the same way as
  `src/app/(app)/squads/actions.ts`) and a "Danger zone" confirmation card,
  `src/components/profile/DeleteAccountSection.tsx`, on `/profile`.
- [x] **Privacy policy page**, hosted at a stable URL. Implemented as
  `src/app/(marketing)/privacy/page.tsx` (public route — `src/middleware.ts`
  now exempts `/privacy` from the auth redirect), linked from `/profile` and
  the login page. Content is accurate to this codebase's actual data flows
  (Supabase, AWS Amplify, Anthropic/OpenAI for the AI features, gym-finder
  geolocation) — re-read it before submission in case those flows changed,
  and swap the placeholder `support@caliquest.app` for a real inbox.
- [x] **Network-loss handling.** Implemented: `src/components/OfflineBanner.tsx`
  (mounted globally in `src/app/layout.tsx`) shows a "you're offline" bar
  via the browser `online`/`offline` events, so a dropped gym wifi
  connection mid-session doesn't fail silently. This only covers "loaded,
  then went offline" — the native wrapper's *first* cold-start load with no
  network still needs a Capacitor-level fallback (e.g. a bundled local
  error page); add that in §5 once the wrapper exists.
- [ ] **App icon set** — generate proper PNG sizes from `src/app/icon.svg`
  (1024×1024 master, Xcode/Capacitor tooling derives the rest). Not done
  here — depends on `capacitor-assets`, part of the Capacitor setup in
  §5.5, not something to pre-generate before that exists.
- [ ] **Launch/splash screen** — Capacitor's splash screen plugin needs a
  background + logo asset; keep it matching `background_color: '#030712'`
  from `src/app/manifest.ts` so there's no flash-of-white on cold start.
  Same dependency on §5 as the icon set above.
- [ ] **Verify heavy client components on-device.** `FlexAvatar` (three.js,
  already lazy-loaded per `CLAUDE.md`) needs to be tested for real on an
  iPhone inside the WKWebView, not just Safari — WebView GPU/memory limits
  are stricter than Safari's. Needs physical hardware, not something this
  repo can verify on its own.
- [ ] **Universal Links for the Supabase auth callback**
  (`src/app/auth/callback/route.ts`) if you want magic-link/OAuth email
  links opened on the phone to deep-link straight into the app instead of
  opening Safari. Requires an `apple-app-site-association` file served from
  the domain root — needs the real Team ID and bundle ID from §3/§5, so it
  can't be pre-built with placeholder values.
- [ ] **A demo/reviewer account** seeded in the production (or a review-only)
  Supabase project, to hand to Apple in the review notes. Once
  `SUPABASE_SERVICE_ROLE_KEY` is available in an environment (see the
  account-deletion item above), this can reuse the same admin client
  (`src/lib/supabase/admin.ts`) in a one-off script, following the pattern
  in `scripts/import-osm-gyms.ts`, to create the user and seed a bit of
  realistic workout/skill history so the reviewer isn't looking at an empty
  account.

---

## 5. Technical implementation: adding Capacitor

Run all of this from the repo root. This adds an `ios/` native project
alongside the existing Next.js app — it does not touch how the app is built
or deployed on Amplify.

### 5.1 Install Capacitor

```bash
npm install @capacitor/core
npm install -D @capacitor/cli
npx cap init CaliQuest com.caliquest.app --web-dir=.next
```

(`--web-dir` is mostly irrelevant here since we're not shipping bundled web
assets — see below — but Capacitor's CLI requires a value.)

### 5.2 Point the native shell at the live site, not a local bundle

Because this is a server-rendered app with auth and server actions, the
native shell should load the **deployed Amplify URL** directly, the same way
Capacitor is used for "hybrid" apps that wrap a hosted site. In
`capacitor.config.ts`:

```ts
import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.caliquest.app',
  appName: 'CaliQuest',
  // Loads the live, server-rendered app instead of a bundled static copy —
  // required because auth, server actions, and data fetching all run server-side.
  server: {
    url: 'https://app.caliquest.com', // your production Amplify/custom domain
    cleartext: false,
  },
}

export default config
```

### 5.3 Add the iOS platform

```bash
npm install @capacitor/ios
npx cap add ios
```

This generates the `ios/App` Xcode project. Commit it to the repo — it's
native project config, not a build artifact.

### 5.4 Native capabilities worth adding (addresses Guideline 4.2)

Install only what you'll actually use:

```bash
npm install @capacitor/splash-screen @capacitor/status-bar @capacitor/push-notifications @capacitor/share @capacitor/haptics
```

- `@capacitor/status-bar` — match the app's dark chrome (`#030712`) to the
  native status bar so there's no visual seam.
- `@capacitor/splash-screen` — native cold-start splash instead of a blank
  white flash while the WebView loads the URL.
- `@capacitor/push-notifications` — the highest-value native addition, since
  CaliQuest already has an in-app notification system
  (`src/lib/services/notifications.service.ts`,
  `src/lib/repositories/notifications.repository.ts`). Wiring APNs to
  deliver those same notifications as real push notifications is the
  single best way to make this feel like more than a bookmarked website —
  worth prioritizing.
- `@capacitor/haptics` — small polish (tap feedback on set completion, quest
  claim, etc.).
- `@capacitor/share` — native share sheet for the "shareable workout summary
  card" already on the roadmap.

Run `npx cap sync ios` after installing any Capacitor plugin.

### 5.5 iOS project configuration (in Xcode)

This project uses Capacitor's Swift Package Manager integration (the
`ios/App/CapApp-SPM` package), not CocoaPods — there's no `Podfile` and no
`.xcworkspace`. Open `ios/App/App.xcodeproj` directly in Xcode; it resolves
the Capacitor plugins as SPM packages itself.

1. **Signing & Capabilities tab** → select your Team (from your Apple
   Developer account) → let Xcode manage signing automatically for
   development. You'll set up a distribution certificate/profile separately
   for App Store builds (Xcode can also automate this).
2. **App Icons & Launch Screen** → drop in the generated icon set (use
   [capacitor-assets](https://github.com/ionic-team/capacitor-assets) to
   generate all required sizes from a single 1024×1024 source):
   ```bash
   npm install -D @capacitor/assets
   npx capacitor-assets generate --iconBackgroundColor '#030712' --splashBackgroundColor '#030712'
   ```
3. **Info.plist**:
   - `NSAppTransportSecurity` — should be left at default (ATS on, HTTPS
     only); do not disable ATS just to work around a mixed-content issue —
     fix the underlying non-HTTPS request instead.
   - Add usage-description strings for anything you actually use (e.g.
     `NSCameraUsageDescription` if you ever add photo/video logging,
     `NSLocationWhenInUseUsageDescription` for the gym-finder map).
   - Set `UIStatusBarStyle` / `UIViewControllerBasedStatusBarAppearance` to
     match the status-bar plugin config.
4. **Deployment target** — set to a reasonably current iOS version (iOS 16+
   is a safe floor as of 2026).

### 5.6 Test on real hardware

Simulator is fine for layout, but test push notifications, safe-area insets
on a notched/Dynamic Island device, and WebView performance
(`FlexAvatar`) on an actual iPhone before submitting. Xcode → Window →
Devices and Simulators to run on a connected phone.

---

## 6. Distribution & review

### 6.1 TestFlight (do this before public submission)

1. In Xcode: **Product → Archive** (requires the distribution
   certificate/profile from 5.5).
2. **Distribute App → App Store Connect → Upload.**
3. In App Store Connect, the build appears under **TestFlight** after
   processing (~15-60 min). Add internal testers (up to 100, no review
   needed) to get real feedback fast.
4. For wider beta testing, external TestFlight groups require one lightweight
   Beta App Review (usually faster/lighter than full App Store review).

### 6.2 App Store Connect listing

Fill in, for the app record created in §3.4:
- Screenshots (per required device size — see §3.7)
- Description, keywords, promotional text, category (Health & Fitness →
  possibly also Sports as a secondary category)
- Age rating questionnaire
- App Privacy "nutrition label" (data types collected: account/email,
  workout data, location if the gym finder uses it — map each to Supabase
  tables so the declaration is accurate)
- Privacy Policy URL, Support URL
- Pricing (Free, presumably, at launch)
- **App Review Information**: demo account credentials + any notes a
  reviewer needs (e.g. "workouts require logging a set first — use the demo
  account's seeded history")

### 6.3 Submit for review

- Attach the TestFlight build that's been verified, hit **Submit for Review**.
- Typical review time: **24-48 hours**, occasionally longer. First
  submissions from a new developer account sometimes take a bit longer.
- **Rejections are normal and not a big deal** — read the specific guideline
  cited in Resolution Center, fix it, resubmit. The most likely first-round
  rejections for this app specifically:
  - Missing account deletion (§4, item 1) — fix in code, resubmit.
  - "Minimum functionality" / feels like a wrapped website (§2.1) — add more
    of the native touches in §5.4, especially push.
  - Broken login for the reviewer — double check the demo account works
    against whatever environment the shipped build points at.

---

## 7. CI/CD for iOS builds

AWS Amplify's build environment is Linux and can't build/sign iOS apps —
that pipeline stays exactly as-is for the web app (`amplify.yml` is
unaffected). iOS builds need a macOS runner. Two reasonable options once
you're past the first manual TestFlight upload:

- **GitHub Actions with a `macos-14` runner** + [Fastlane](https://fastlane.tools/)
  (`fastlane match` for certificate management, `fastlane pilot` for
  TestFlight upload) — most control, more setup.
- **Xcode Cloud** (built into App Store Connect) — less setup, tightly
  integrated with TestFlight, costs nothing for a low build volume on a paid
  Developer account.

Either way, keep manual/local Xcode builds as the fallback for the first
release — don't block your first submission on getting CI working.

---

## 8. Cost & timeline summary

| Item | Cost | Notes |
|---|---|---|
| Apple Developer Program | $99/year | Required, non-negotiable |
| D-U-N-S number (org accounts only) | Free | 1-2 week lead time if you don't already have one |
| Mac (if you don't have one) | Varies | Needed for Xcode |
| Everything else in this doc | Time only | Capacitor, plugins, Xcode Cloud/GitHub Actions are all free at this scale |

Rough timeline for a first-time submission:
1. Apple Developer enrollment: same day (individual) to ~1-2 weeks (org, waiting on D-U-N-S)
2. Capacitor wrapper + native polish + account deletion feature: **1-2 weeks** of engineering
3. TestFlight internal testing: a few days to a week of real gym use
4. App Store submission → review: 1-3 days, plus buffer for a rejection/fix cycle
5. **Realistic total: 3-5 weeks** from a standing start to live on the App Store, most of it gated by build/business setup rather than review itself.

---

## 9. Pre-submission checklist

- [ ] Apple Developer Program membership active
- [ ] Bundle ID registered, App Store Connect app record created
- [x] Account deletion implemented (`src/lib/services/account.service.ts` +
  `DeleteAccountSection`) — still needs an end-to-end test against a real
  Supabase project with `SUPABASE_SERVICE_ROLE_KEY` set before submitting
- [x] Privacy policy live in-app at `/privacy` — deploy to production and
  link that URL in App Store Connect
- [ ] Support URL live
- [ ] Capacitor `ios/` project builds and runs on a real iPhone
- [ ] App icon (1024×1024) + full icon set generated and in the Xcode project
- [ ] Splash screen matches app background color, no white flash
- [ ] Status bar styled to match app chrome
- [x] Status bar styled to match app chrome — `src/components/native/NativeStatusBar.tsx`
  (mounted in `src/app/layout.tsx`) overlays the WebView and sets light
  status-bar content via `@capacitor/status-bar`, gated behind
  `Capacitor.isNativePlatform()` since the plugin has no web implementation
- [ ] Push notifications wired for at least one real notification type (recommended, not blocking)
- [x] Offline banner covers mid-session drops (`OfflineBanner.tsx`) — native
  cold-start error page (no network on first load) still needs a
  Capacitor-level fallback, see §5
- [ ] Tested on a notched device for safe-area correctness
- [ ] Demo/reviewer account seeded with realistic data
- [ ] App Privacy nutrition label filled out accurately
- [ ] Screenshots for required device sizes
- [ ] TestFlight internal build tested end-to-end (signup → login → log a workout → view profile)
- [ ] Submitted for review

---

## References

- App Review Guidelines: https://developer.apple.com/app-store/review/guidelines/
- Apple Developer Program: https://developer.apple.com/programs/
- Capacitor iOS docs: https://capacitorjs.com/docs/ios
- App Store Connect: https://appstoreconnect.apple.com/
- TestFlight overview: https://developer.apple.com/testflight/
- capacitor-assets (icon/splash generation): https://github.com/ionic-team/capacitor-assets

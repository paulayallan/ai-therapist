# Building the iOS app

Everything in the repo is ready. These steps need a Mac — Xcode does not run on
Windows, and there is no way around that.

## Before you start

On the Mac:

- **Xcode** from the App Store (large; start the download first).
- **Node 20+** and **CocoaPods** (`sudo gem install cocoapods`).
- The repo cloned: `git clone https://github.com/paulayallan/ai-therapist.git`
  then `git checkout v2`.
- Your Apple Developer account signed in to Xcode.

## One-time setup

```bash
npm install
npm run ios:add        # creates the ios/ project
npm run ios:sync       # copies config and native plugins into it
npm run ios:open       # opens Xcode
```

`ios/` is gitignored on purpose. It is generated, and checking it in creates
merge conflicts nobody can read. Re-run `ios:add` on a fresh machine.

## In Xcode

1. Select the **App** target → **Signing & Capabilities** → your team. Bundle
   identifier must be **`com.mentara.app`** — it has to match the existing App
   Store record or this becomes a different app.
2. **+ Capability → In-App Purchase.**
3. **+ Capability → Push Notifications** (only when you actually build push;
   an unused capability is fine but tidier to add later).
4. Set the version and build number above whatever is currently live.

## What the shell points at

`capacitor.config.ts` loads the deployed site rather than bundling a copy, so
the app follows the website without an App Store review for every change.

```bash
CAPACITOR_SERVER_URL=https://ai-therapist-nine-lake.vercel.app npm run ios:sync
```

**Use the production domain for anything you submit.** A release pointed at a
preview URL keeps loading a branch that may be deleted, and the app would go
blank for everyone.

To try the app against the preview first, sync with the preview URL, test, then
re-sync with production before archiving.

## Testing purchases

- Purchases only work on a **real device**, not the simulator.
- Create a **Sandbox Apple ID** in App Store Connect → Users and Access →
  Sandbox, and sign in with it on the device under Settings → Developer.
- Sandbox purchases are free and renew on an accelerated clock (a month passes
  in minutes), which is how to test renewal and expiry without waiting.
- Check RevenueCat → Customers after a sandbox purchase: the customer id must
  be the person's **Supabase user id**, not an anonymous `$RCAnonymousID`. If
  it is anonymous, `Purchases.configure` ran before sign-in and the webhook
  will not be able to match the purchase to an account.

## What the app does differently from the web

`src/lib/native-purchases.ts` handles it, and it only activates inside the
shell:

- The web checkout button is replaced by native in-app purchase. Apple requires
  this (Guideline 3.1.1) and showing a web payment link inside the app is a
  rejection.
- A **Restore a previous purchase** control appears. Apple requires one, and
  without it anyone reinstalling looks unsubscribed despite paying.
- Cancelling a purchase shows nothing. Backing out of a payment is a normal
  decision, not an error.

## Known risk: Guideline 4.2

A WebView around a website can be rejected as "not an app". Native in-app
purchase helps; push notifications help more. If review pushes back, the answer
is more native surface — notifications, widgets, offline SOS — not arguing.

## Before submitting

- [ ] A **demo account** for the review team, with real data in it. An empty
      app looks broken to a reviewer and gets rejected for the wrong reason.
- [ ] Age rating — expect 17+ for mental health content.
- [ ] Privacy nutrition label declaring health data honestly.
- [ ] Account deletion reachable in-app (it is — Settings).
- [ ] Screenshots at the required sizes.
- [ ] **The feature gap.** This update replaces what existing users have. If
      the community wall, reminders, push, multi-language and voice journalling
      are still missing, they lose them. Close the gap or tell them first.

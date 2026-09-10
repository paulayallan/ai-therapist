import type { CapacitorConfig } from "@capacitor/cli";

/**
 * The native shell.
 *
 * `server.url` points the WebView at the deployed site rather than bundling a
 * static copy, so the app updates when the site does — no App Store review to
 * fix a typo. Set CAPACITOR_SERVER_URL when building; it must be the
 * PRODUCTION domain for a release, never a preview URL, or a shipped build
 * would keep loading a branch that may be deleted.
 *
 * Be aware this shape attracts scrutiny under Apple's Guideline 4.2 (minimum
 * functionality) — a WebView around a website can be rejected as "not an app".
 * Native in-app purchase and push notifications are what distinguish it, so
 * they are not optional extras here.
 */
const serverUrl = process.env.CAPACITOR_SERVER_URL ?? "https://ai-therapist-nine-lake.vercel.app";

const config: CapacitorConfig = {
  appId: "com.mentara.app",
  appName: "Mentara",
  webDir: "public",

  server: {
    url: serverUrl,
    // No cleartext anywhere. Everything this app touches is https.
    cleartext: false,
    androidScheme: "https",
    iosScheme: "https",
  },

  ios: {
    // The app is a calm surface; a bouncing scroll edge undercuts that.
    scrollEnabled: true,
    contentInset: "always",
    limitsNavigationsToAppBoundDomains: false,
    backgroundColor: "#faf7f2",
  },

  android: {
    backgroundColor: "#faf7f2",
  },

  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 600,
      backgroundColor: "#faf7f2",
      showSpinner: false,
    },
  },
};

export default config;

import type { CapacitorConfig } from "@capacitor/cli";
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

const serverUrl =
  process.env.CAPACITOR_SERVER_URL ?? process.env.NEXT_PUBLIC_APP_URL;

if (!serverUrl) {
  throw new Error(
    "CAPACITOR_SERVER_URL (or NEXT_PUBLIC_APP_URL) is required for iOS sync."
  );
}

const config: CapacitorConfig = {
  appId: "com.mentara.app",
  appName: "Mentara",
  webDir: "capacitor-shell",
  server: serverUrl
    ? {
        url: serverUrl,
        cleartext: serverUrl.startsWith("http://")
      }
    : undefined
};

export default config;

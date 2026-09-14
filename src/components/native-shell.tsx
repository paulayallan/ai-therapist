"use client";

import { useEffect } from "react";

/**
 * Makes the web app behave like an app when it is running inside the native
 * shell. Renders nothing; it only sets state the stylesheet reacts to.
 *
 * A website loaded in a WKWebView is not an app. It bounces at the edges,
 * shows a magnifier on long-press, and — the one people actually notice —
 * moves everything around when the keyboard opens. None of that is wrong on
 * the web. All of it feels broken in something you downloaded.
 *
 * Everything here is gated on actually being native, so mobile Safari and
 * desktop are untouched.
 */
export function NativeShell() {
  useEffect(() => {
    const capacitor = (
      window as {
        Capacitor?: { isNativePlatform?: () => boolean; Plugins?: Record<string, unknown> };
      }
    ).Capacitor;

    if (!capacitor?.isNativePlatform?.()) return;

    const root = document.documentElement;
    root.dataset.native = "true";

    let cleanups: Array<() => void> = [];

    void (async () => {
      try {
        const { Keyboard, KeyboardResize } = await import("@capacitor/keyboard");

        // `native` lets iOS resize the web view itself, which keeps the
        // composer pinned to the top of the keyboard instead of being pushed
        // around by a scroll the page did not ask for.
        await Keyboard.setResizeMode({ mode: KeyboardResize.Native }).catch(() => {});
        await Keyboard.setScroll({ isDisabled: false }).catch(() => {});

        const show = await Keyboard.addListener("keyboardWillShow", (info) => {
          root.dataset.keyboard = "open";
          root.style.setProperty("--keyboard-height", `${info.keyboardHeight}px`);
        });
        const hide = await Keyboard.addListener("keyboardWillHide", () => {
          delete root.dataset.keyboard;
          root.style.setProperty("--keyboard-height", "0px");
        });

        cleanups = [() => void show.remove(), () => void hide.remove()];
      } catch {
        // Plugin missing or older shell. The CSS defaults still apply; only
        // the keyboard refinements are lost.
      }
    })();

    return () => {
      cleanups.forEach((fn) => fn());
      delete root.dataset.native;
      delete root.dataset.keyboard;
    };
  }, []);

  return null;
}

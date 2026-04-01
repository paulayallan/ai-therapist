"use client";

import type { FormEvent } from "react";
import { useMemo, useRef, useState } from "react";
import { Mic, MicOff } from "lucide-react";
import type { JournalEntry } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

declare global {
  interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    onresult: ((event: SpeechRecognitionEvent) => void) | null;
    onend: (() => void) | null;
    start(): void;
    stop(): void;
  }

  interface SpeechRecognitionEvent {
    results: {
      length: number;
      [index: number]: {
        length: number;
        [index: number]: {
          transcript: string;
        };
      };
    };
  }
}

export function JournalClient({ entries }: { entries: JournalEntry[] }) {
  const [text, setText] = useState("");
  const [analysis, setAnalysis] = useState<JournalEntry["emotionalAnalysis"] | null>(null);
  const [saving, setSaving] = useState(false);
  const [recording, setRecording] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [localEntries, setLocalEntries] = useState<JournalEntry[]>(entries);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const browserWindow =
    typeof window === "undefined"
      ? null
      : (window as Window & {
          SpeechRecognition?: new () => SpeechRecognition;
          webkitSpeechRecognition?: new () => SpeechRecognition;
        });

  const speechSupported = useMemo(
    () => Boolean(browserWindow?.SpeechRecognition || browserWindow?.webkitSpeechRecognition),
    []
  );

  function toggleRecording() {
    if (!speechSupported) return;

    if (recording) {
      recognitionRef.current?.stop();
      setRecording(false);
      return;
    }

    const Recognition = browserWindow?.SpeechRecognition || browserWindow?.webkitSpeechRecognition;
    if (!Recognition) return;

    const recognition = new Recognition();
    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognition.continuous = true;
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0]?.transcript ?? "")
        .join(" ");
      setText(transcript);
    };
    recognition.onend = () => setRecording(false);
    recognition.start();
    recognitionRef.current = recognition;
    setRecording(true);
  }

  async function saveEntry(event: FormEvent) {
    event.preventDefault();
    if (!text.trim()) return;

    const textToSave = text.trim();
    const optimisticEntry: JournalEntry = {
      id: `temp-${Date.now()}`,
      textContent: textToSave,
      voiceUrl: null,
      emotionalAnalysis: null,
      createdAt: new Date().toISOString()
    };

    setLocalEntries((current) => [optimisticEntry, ...current]);
    setText("");
    setSaveMessage("Saved locally. Syncing...");
    setSaving(true);
    const response = await fetch("/api/journal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ textContent: textToSave })
    });

    const data = await response.json().catch(() => null);
    setSaving(false);

    if (response.ok && data) {
      setAnalysis(data.entry?.emotionalAnalysis ?? null);
      setLocalEntries((current) => {
        const withoutTemp = current.filter((entry) => entry.id !== optimisticEntry.id);
        if (!data.entry) return withoutTemp;
        return [data.entry as JournalEntry, ...withoutTemp];
      });
      setSaveMessage("Entry saved.");
      return;
    }

    setLocalEntries((current) => current.filter((entry) => entry.id !== optimisticEntry.id));
    setText(textToSave);
    setSaveMessage("Saved locally. Could not sync right now.");
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <Card>
        <p className="font-display text-3xl text-ink">Reflect in words or voice</p>
        <p className="mt-2 text-sm text-pine/70">
          Use this space to capture thoughts, then analyze themes, triggers, and possible cognitive distortions.
        </p>
        <form className="mt-5 space-y-4" onSubmit={saveEntry}>
          <textarea
            className="min-h-48 w-full rounded-[28px] border border-pine/15 bg-sand/70 px-4 py-4 outline-none focus:border-pine"
            placeholder="What happened, what did you think, what did you feel in your body?"
            value={text}
            onChange={(event) => setText(event.target.value)}
          />
          <div className="flex flex-wrap gap-3">
            <Button type="button" variant="secondary" onClick={toggleRecording}>
              {recording ? <MicOff className="mr-2 h-4 w-4" /> : <Mic className="mr-2 h-4 w-4" />}
              {recording ? "Stop voice capture" : speechSupported ? "Start voice capture" : "Voice not supported"}
            </Button>
            <Button disabled={saving}>{saving ? "Saving..." : "Save entry"}</Button>
          </div>
          {saveMessage ? <p className="text-sm text-pine">{saveMessage}</p> : null}
        </form>
        {analysis ? (
          <div className="mt-6 rounded-[24px] bg-mist/70 p-5 text-sm">
            <p className="font-medium text-ink">Latest analysis</p>
            <p className="mt-2 text-pine/75">{analysis.summary}</p>
          </div>
        ) : null}
      </Card>
      <Card>
        <p className="font-display text-2xl text-ink">Recent entries</p>
        <div className="mt-5 space-y-4">
          {localEntries.length ? (
            localEntries.map((entry) => (
              <div key={entry.id} className="rounded-[24px] bg-sand/70 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-pine/60">{formatDate(entry.createdAt)}</p>
                <p className="mt-2 text-sm text-ink">{entry.textContent}</p>
                {entry.emotionalAnalysis ? (
                  <div className="mt-3 text-sm text-pine/75">
                    <p>Theme: {entry.emotionalAnalysis.emotionalThemes.join(", ")}</p>
                    <p>Trigger: {entry.emotionalAnalysis.triggers.join(", ")}</p>
                  </div>
                ) : null}
              </div>
            ))
          ) : (
            <p className="text-sm text-pine/70">No journal entries yet.</p>
          )}
        </div>
      </Card>
    </div>
  );
}

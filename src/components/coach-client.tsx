"use client";

import type { FormEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { AlertTriangle, BookHeart, BrainCircuit, Flower2, Mic, MicOff, Volume2, Wind } from "lucide-react";
import type { StructuredCoachResponse } from "@/lib/types";
import { detectCrisisLanguage } from "@/lib/safety";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CrisisBanner } from "@/components/crisis-banner";

type CoachMessage = {
  role: "user" | "assistant";
  content: string;
  structured?: StructuredCoachResponse;
};

type StyleMode = "Supportive" | "Direct" | "Reflective";

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognition;
    webkitSpeechRecognition?: new () => SpeechRecognition;
  }
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
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

interface SpeechRecognitionErrorEvent {
  error: string;
}

const toolButtons = [
  { id: "breathing", label: "Breathing exercise", icon: Wind, prompt: "Please guide me through a breathing exercise." },
  { id: "grounding", label: "Grounding exercise", icon: Flower2, prompt: "Please guide me through a grounding exercise." },
  { id: "reframing", label: "Thought reframing", icon: BrainCircuit, prompt: "Help me reframe the thought I am stuck on." },
  { id: "journal", label: "Journaling prompt", icon: BookHeart, prompt: "Give me a journaling prompt for what I am feeling." }
] as const;

const styleModes: StyleMode[] = ["Supportive", "Direct", "Reflective"];
const coachCacheKey = "mentara:coach:cache:v1";

export function CoachClient() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [systemNotice, setSystemNotice] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [styleMode, setStyleMode] = useState<StyleMode>("Supportive");
  const [sessionSummary, setSessionSummary] = useState<{
    main_issue: string;
    emotional_state: string;
    possible_triggers: string[];
    suggested_focus_area: string;
    suggested_next_steps: string[];
  } | null>(null);
  const [messages, setMessages] = useState<CoachMessage[]>([
    {
      role: "assistant",
      content: "Tell me what feels hardest right now. We can slow it down together and find one step that helps."
    }
  ]);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem(coachCacheKey);
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw) as { conversationId?: string; messages?: CoachMessage[] };
      if (Array.isArray(parsed.messages) && parsed.messages.length) {
        setMessages(parsed.messages.slice(-20));
      }
      if (parsed.conversationId) {
        setConversationId(parsed.conversationId);
      }
    } catch {
      // Ignore invalid local cache.
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(
      coachCacheKey,
      JSON.stringify({
        conversationId,
        messages: messages.slice(-20)
      })
    );
  }, [conversationId, messages]);

  useEffect(() => {
    const Recognition = typeof window !== "undefined" ? window.SpeechRecognition || window.webkitSpeechRecognition : undefined;
    if (!Recognition) return;

    const recognition = new Recognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-AU";
    recognition.onresult = (event) => {
      const transcript = Array.from({ length: event.results.length })
        .map((_, index) => event.results[index]?.[0]?.transcript ?? "")
        .join(" ")
        .trim();
      setInput(transcript);
    };
    recognition.onerror = (event) => {
      setListening(false);
      setSystemNotice(event.error === "not-allowed" ? "Microphone permission was blocked." : "Voice input stopped unexpectedly.");
    };
    recognition.onend = () => {
      setListening(false);
    };

    recognitionRef.current = recognition;
    setVoiceSupported(true);

    return () => {
      recognition.stop();
      recognitionRef.current = null;
    };
  }, []);

  async function runTool(tool: (typeof toolButtons)[number]) {
    await sendPrompt(tool.prompt, tool.id);
  }

  async function sendMessage(event: FormEvent) {
    event.preventDefault();
    await sendPrompt(input);
  }

  async function sendPrompt(message: string, tool?: (typeof toolButtons)[number]["id"]) {
    if (!message.trim()) return;

    let assistantIndex = -1;
    setMessages((current) => {
      const next: CoachMessage[] = [...current, { role: "user", content: message }, { role: "assistant", content: "" }];
      assistantIndex = next.length - 1;
      return next;
    });
    setLoading(true);
    setSessionSummary(null);
    setSystemNotice(null);
    setInput("");

    const crisisFlag = detectCrisisLanguage(message);
    const response = await fetch("/api/coach/stream", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, crisisFlag, conversationId, tool: tool ?? null, styleMode })
    });

    if (!response.ok || !response.body) {
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: "I could not generate a response right now. Try again in a moment."
        }
      ]);
      setLoading(false);
      return;
    }

    const conversationHeader = response.headers.get("x-conversation-id");
    const activeConversationId = conversationHeader || conversationId;
    if (conversationHeader) {
      setConversationId(conversationHeader);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let assistantText = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      assistantText += decoder.decode(value, { stream: true });
      setMessages((current) => {
        if (assistantIndex < 0 || assistantIndex >= current.length) return current;
        const next = [...current];
        next[assistantIndex] = {
          ...next[assistantIndex],
          content: assistantText
        };
        return next;
      });
    }

    if (!assistantText.trim()) {
      setMessages((current) => {
        if (assistantIndex < 0 || assistantIndex >= current.length) return current;
        const next = [...current];
        next[assistantIndex] = {
          ...next[assistantIndex],
          content: "I’m here with you. I hit a temporary issue, but we can try that again."
        };
        return next;
      });
    }

    setLoading(false);
    void enrichLastMessage(message, tool, activeConversationId);
  }

  async function enrichLastMessage(message: string, tool?: (typeof toolButtons)[number]["id"], activeConversationId?: string | null) {
    const crisisFlag = detectCrisisLanguage(message);
    const response = await fetch("/api/coach", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, crisisFlag, conversationId: activeConversationId ?? conversationId, tool: tool ?? null, styleMode })
    });
    const data = await response.json().catch(() => null);
    if (!response.ok || !data) return;

    if (data.sessionSummary) {
      setSessionSummary({
        main_issue: data.sessionSummary.main_issue,
        emotional_state: data.sessionSummary.emotional_state,
        possible_triggers: data.sessionSummary.possible_triggers ?? [],
        suggested_focus_area: data.sessionSummary.suggested_focus_area ?? "",
        suggested_next_steps: data.sessionSummary.suggested_next_steps ?? []
      });
    }

    setMessages((current) => {
      const next = [...current];
      for (let i = next.length - 1; i >= 0; i -= 1) {
        if (next[i]?.role === "assistant") {
          next[i] = {
            ...next[i],
            structured: data
          };
          break;
        }
      }
      return next;
    });
  }

  async function endSession() {
    if (!conversationId) return;

    const response = await fetch("/api/session-summary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationId })
    });

    const data = await response.json().catch(() => null);
    if (response.ok && data?.summary) {
      setSessionSummary({
        main_issue: data.summary.main_issue,
        emotional_state: data.summary.emotional_state,
        possible_triggers: data.summary.possible_triggers ?? [],
        suggested_focus_area: data.summary.suggested_focus_area ?? "",
        suggested_next_steps: data.summary.suggested_next_steps ?? []
      });
    } else if (data?.error) {
      setSystemNotice(data.error);
    }
  }

  function toggleVoiceInput() {
    if (!recognitionRef.current) {
      setSystemNotice("Voice input is not supported in this browser.");
      return;
    }

    if (listening) {
      recognitionRef.current.stop();
      setListening(false);
      return;
    }

    setSystemNotice(null);
    setListening(true);
    recognitionRef.current.start();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <Card>
        <div className="mb-5 flex flex-wrap gap-2">
          <div className="mr-3 flex flex-wrap gap-2">
            {styleModes.map((mode) => (
              <button
                key={mode}
                type="button"
                className={`inline-flex items-center rounded-full px-4 py-2 text-sm transition ${
                  styleMode === mode ? "bg-pine text-white" : "bg-white/70 text-ink hover:bg-mist"
                }`}
                onClick={() => setStyleMode(mode)}
              >
                {mode}
              </button>
            ))}
          </div>
          {toolButtons.map((tool) => {
            const Icon = tool.icon;
            return (
              <button
                key={tool.id}
                className="inline-flex items-center gap-2 rounded-full bg-mist/70 px-4 py-2 text-sm text-ink transition hover:bg-mist"
                type="button"
                onClick={() => runTool(tool)}
              >
                <Icon className="h-4 w-4 text-pine" />
                {tool.label}
              </button>
            );
          })}
        </div>
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={`rounded-[24px] p-4 ${message.role === "assistant" ? "bg-mist/70" : "bg-sand/80"}`}
            >
              <p className="text-xs uppercase tracking-[0.24em] text-pine/60">{message.role === "assistant" ? "Coach" : "You"}</p>
              <p className="mt-2 whitespace-pre-line text-sm text-ink">{message.content}</p>
              {message.structured ? <StructuredResponse response={message.structured} /> : null}
            </div>
          ))}
        </div>
        <form className="mt-6 space-y-3" onSubmit={sendMessage}>
          <textarea
            className="min-h-28 w-full rounded-[24px] border border-pine/15 bg-sand/70 px-4 py-3 outline-none focus:border-pine"
            placeholder="Example: I am spiraling about tomorrow's meeting or I feel burnt out and can't settle."
            value={input}
            onChange={(event) => setInput(event.target.value)}
          />
          {systemNotice ? <p className="text-sm text-coral">{systemNotice}</p> : null}
          <div className="flex flex-wrap items-center gap-3">
            <Button disabled={loading}>{loading ? "Thinking..." : "Get support"}</Button>
            <Button type="button" variant="secondary" onClick={toggleVoiceInput} disabled={!voiceSupported || loading}>
              {listening ? <MicOff className="mr-2 h-4 w-4" /> : <Mic className="mr-2 h-4 w-4" />}
              {listening ? "Stop voice input" : voiceSupported ? "Push to talk" : "Voice unavailable"}
            </Button>
            <Button type="button" variant="secondary" disabled={!conversationId || loading} onClick={endSession}>
              End session
            </Button>
          </div>
        </form>
        {sessionSummary ? (
          <div className="mt-6 rounded-[24px] bg-sand/70 p-5 text-sm">
            <p className="font-medium text-ink">Session summary</p>
            <p className="mt-2 text-pine/75">Today's focus: {sessionSummary.main_issue}</p>
            <p className="mt-1 text-pine/75">Emotional tone: {sessionSummary.emotional_state}</p>
            <p className="mt-1 text-pine/75">
              Possible triggers: {sessionSummary.possible_triggers.length ? sessionSummary.possible_triggers.join(", ") : "Still being clarified"}
            </p>
            <p className="mt-1 text-pine/75">Suggested focus area: {sessionSummary.suggested_focus_area || "Pattern awareness and regulation"}</p>
            <p className="mt-1 text-pine/75">Suggested next step: {sessionSummary.suggested_next_steps[0] ?? "Return when you want the next layer of support."}</p>
          </div>
        ) : null}
      </Card>
      <div className="space-y-4">
        <Card className="bg-pine text-white">
          <p className="font-display text-2xl">How this layer works</p>
          <ul className="mt-4 space-y-3 text-sm text-white/80">
            <li>Understanding the feeling in plain language</li>
            <li>Spotting the likely pattern or distortion</li>
            <li>Offering a grounded reframe</li>
            <li>Giving one practical regulation step</li>
            <li>Asking one reflection question</li>
          </ul>
        </Card>
        <Card>
          <p className="font-medium text-ink">Want deeper analysis?</p>
          <p className="mt-2 text-sm text-pine/70">
            The strategy layer is where decision-making, relationship decoding, life planning, and burnout optimization live.
          </p>
        </Card>
        <Card>
          <div className="flex items-start gap-3">
            <Volume2 className="mt-0.5 h-5 w-5 text-pine" />
            <div>
              <p className="font-medium text-ink">Voice support beta</p>
              <p className="mt-2 text-sm text-pine/70">
                You can use browser voice dictation now without extra API cost. Full voice conversations can become the premium retention layer later.
              </p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 text-coral" />
            <div>
              <p className="font-medium text-ink">Important safety note</p>
              <p className="mt-2 text-sm text-pine/70">
                This tool offers skills-based support, not diagnosis or emergency intervention. If you feel unsafe, use SOS mode and contact real-world support.
              </p>
            </div>
          </div>
        </Card>
        {detectCrisisLanguage(input) ? <CrisisBanner /> : null}
      </div>
    </div>
  );
}

function StructuredResponse({ response }: { response: StructuredCoachResponse }) {
  if (response.crisis_interrupt) {
    return (
      <div className="mt-4">
        <CrisisBanner />
      </div>
    );
  }

  return (
    <div className="mt-4 grid gap-3 text-sm">
      <div>
        <p className="font-medium text-ink">Try this now</p>
        <p className="whitespace-pre-line text-pine/75">{response.exercise}</p>
      </div>
      <div>
        <p className="font-medium text-ink">Small check-in question</p>
        <p className="whitespace-pre-line text-pine/75">{response.reflection_question}</p>
      </div>
      <details className="rounded-2xl bg-sand/60 p-3">
        <summary className="cursor-pointer font-medium text-ink">Show deeper insight</summary>
        <div className="mt-3 grid gap-3">
          <div>
            <p className="font-medium text-ink">Detected emotion</p>
            <p className="text-pine/75">{response.detected_emotion}</p>
          </div>
          <div>
            <p className="font-medium text-ink">Pattern noticed</p>
            <p className="text-pine/75">{response.thinking_pattern}</p>
          </div>
          <div>
            <p className="font-medium text-ink">Reframe</p>
            <p className="text-pine/75">{response.reframe}</p>
          </div>
        </div>
      </details>
      {response.show_crisis_resources ? <CrisisBanner /> : null}
    </div>
  );
}

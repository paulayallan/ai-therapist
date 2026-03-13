"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { AlertTriangle } from "lucide-react";
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

export function CoachClient() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<CoachMessage[]>([
    {
      role: "assistant",
      content: "Tell me what is most present right now, and I’ll respond with a structured CBT check-in."
    }
  ]);

  async function sendMessage(event: FormEvent) {
    event.preventDefault();
    if (!input.trim()) return;

    const nextMessages: CoachMessage[] = [...messages, { role: "user", content: input }];
    setMessages(nextMessages);
    setLoading(true);

    const crisisFlag = detectCrisisLanguage(input);
    const response = await fetch("/api/coach", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: input, crisisFlag, conversationId })
    });

    const data = await response.json().catch(() => null);
    setLoading(false);
    setInput("");

    if (!response.ok || !data) {
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: "I could not generate a response right now. Try again in a moment."
        }
      ]);
      return;
    }

    if (data.conversationId) {
      setConversationId(data.conversationId);
    }

    setMessages((current) => [
      ...current,
      {
        role: "assistant",
        content: data.emotion_validation,
        structured: data
      }
    ]);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <Card>
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={`rounded-[24px] p-4 ${message.role === "assistant" ? "bg-mist/70" : "bg-sand/80"}`}
            >
              <p className="text-xs uppercase tracking-[0.24em] text-pine/60">{message.role === "assistant" ? "Coach" : "You"}</p>
              <p className="mt-2 text-sm text-ink">{message.content}</p>
              {message.structured ? <StructuredResponse response={message.structured} /> : null}
            </div>
          ))}
        </div>
        <form className="mt-6 space-y-3" onSubmit={sendMessage}>
          <textarea
            className="min-h-28 w-full rounded-[24px] border border-pine/15 bg-sand/70 px-4 py-3 outline-none focus:border-pine"
            placeholder="Example: I keep overthinking tomorrow's meeting."
            value={input}
            onChange={(event) => setInput(event.target.value)}
          />
          <Button disabled={loading}>{loading ? "Thinking..." : "Get CBT guidance"}</Button>
        </form>
      </Card>
      <div className="space-y-4">
        <Card className="bg-pine text-white">
          <p className="font-display text-2xl">Structured response format</p>
          <ul className="mt-4 space-y-3 text-sm text-white/80">
            <li>Understanding the feeling</li>
            <li>Likely thinking pattern</li>
            <li>Alternative perspective</li>
            <li>Practical exercise</li>
            <li>Reflection question</li>
          </ul>
        </Card>
        <Card>
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 text-coral" />
            <div>
              <p className="font-medium text-ink">Important safety note</p>
              <p className="mt-2 text-sm text-pine/70">
                This tool offers skills-based support, not diagnosis or emergency intervention. If you feel unsafe, use
                SOS mode and contact real-world support.
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
  return (
    <div className="mt-4 grid gap-3 text-sm">
      <div>
        <p className="font-medium text-ink">Possible thinking pattern</p>
        <p className="text-pine/75">{response.thinking_pattern}</p>
      </div>
      <div>
        <p className="font-medium text-ink">Reframe</p>
        <p className="text-pine/75">{response.reframe}</p>
      </div>
      <div>
        <p className="font-medium text-ink">Practical exercise</p>
        <p className="text-pine/75">{response.exercise}</p>
      </div>
      <div>
        <p className="font-medium text-ink">Reflection question</p>
        <p className="text-pine/75">{response.reflection_question}</p>
      </div>
      {response.show_crisis_resources ? <CrisisBanner /> : null}
    </div>
  );
}

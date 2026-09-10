import type { Metadata } from "next";
import { ChatClient } from "@/components/chat-client";
import { getLatestConversationId, getMessages, getProfile } from "@/lib/data";
import { peekUsage } from "@/lib/api";
import { getSessionUser } from "@/lib/supabase/server";
import type { ChatMessage } from "@/lib/types";

export const metadata: Metadata = { title: "Support" };

export default async function ChatPage() {
  const user = await getSessionUser();
  const [profile, conversationId] = await Promise.all([
    user ? getProfile(user.id) : null,
    getLatestConversationId(),
  ]);

  const messages = conversationId ? await getMessages(conversationId, 40) : [];

  // The server's date is only used to read a counter, never to write one.
  const usage = await peekUsage("support_chat", new Date().toISOString().slice(0, 10));

  return (
    <div className="stack">
      <ChatClient
        initialMessages={messages as ChatMessage[]}
        conversationId={conversationId}
        remaining={usage.remaining}
        aiConsent={Boolean(profile?.ai_data_consent_granted)}
      />
    </div>
  );
}

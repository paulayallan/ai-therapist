"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function AccountDeleteCard() {
  const [confirmation, setConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleDelete() {
    setLoading(true);
    setError(null);
    setMessage(null);

    const response = await fetch("/api/account/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirmation })
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      setLoading(false);
      setError(data?.error ?? "Could not delete account right now.");
      return;
    }

    setMessage("Your account has been deleted.");
    const supabase = createSupabaseBrowserClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
    router.replace("/");
    router.refresh();
  }

  return (
    <Card className="border-coral/35 bg-[#fff6f3]">
      <p className="text-xs uppercase tracking-[0.24em] text-coral">Danger Zone</p>
      <p className="mt-2 font-display text-2xl text-ink">Delete account</p>
      <p className="mt-2 text-sm text-pine/75">
        This permanently deletes your Mentara account and all associated data, including journaling, mood logs, chats, and insights.
      </p>
      <label className="mt-4 block text-sm text-ink">
        Type <span className="font-semibold">DELETE</span> to confirm
      </label>
      <input
        className="mt-2 w-full rounded-2xl border border-coral/30 bg-white px-4 py-3 outline-none focus:border-coral"
        value={confirmation}
        onChange={(event) => setConfirmation(event.target.value)}
        placeholder="DELETE"
      />
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button variant="danger" disabled={loading || confirmation !== "DELETE"} onClick={handleDelete}>
          {loading ? "Deleting..." : "Delete my account"}
        </Button>
      </div>
      {error ? <p className="mt-3 text-sm text-coral">{error}</p> : null}
      {message ? <p className="mt-3 text-sm text-pine">{message}</p> : null}
    </Card>
  );
}

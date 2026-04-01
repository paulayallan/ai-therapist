"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogout() {
    setLoading(true);

    const supabase = createSupabaseBrowserClient();
    if (supabase) {
      await supabase.auth.signOut();
    }

    router.push("/auth");
    router.refresh();
    setLoading(false);
  }

  return (
    <Button className="w-full" type="button" variant="ghost" onClick={handleLogout} disabled={loading}>
      <span className="inline-flex items-center gap-2">
        <LogOut className="h-4 w-4" />
        {loading ? "Logging out..." : "Log out"}
      </span>
    </Button>
  );
}

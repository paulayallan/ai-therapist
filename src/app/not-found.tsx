import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main id="main" className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-5 text-center">
      <h1 className="font-serif text-3xl text-ink">That page isn&rsquo;t here</h1>
      <p className="mt-3 leading-relaxed text-muted">
        Probably a stale link. Nothing has gone wrong with your account.
      </p>
      <div className="mt-7 flex justify-center gap-2">
        <Link href="/dashboard">
          <Button>Back to today</Button>
        </Link>
        <Link href="/sos">
          <Button variant="urgent">Need help now</Button>
        </Link>
      </div>
    </main>
  );
}

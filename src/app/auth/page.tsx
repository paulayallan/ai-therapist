import Link from "next/link";
import { AuthForm } from "@/components/auth-form";

export default function AuthPage() {
  return (
    <main className="safe-top-layout min-h-screen bg-[linear-gradient(180deg,_#edf5f2_0%,_#f6f0e8_100%)] px-4 py-10">
      <div className="mx-auto max-w-6xl">
        <AuthForm />
        <div className="mt-6 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-pine/70">
          <Link href="/privacy" className="transition hover:text-pine">
            Privacy Policy
          </Link>
          <Link href="/terms" className="transition hover:text-pine">
            Terms & Conditions
          </Link>
          <Link href="/disclaimer" className="transition hover:text-pine">
            Disclaimer
          </Link>
        </div>
      </div>
    </main>
  );
}

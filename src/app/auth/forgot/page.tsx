import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/forgot-password-form";

export const metadata: Metadata = { title: "Reset your password" };

export default function ForgotPasswordPage() {
  return (
    <main id="main" className="mx-auto w-full max-w-sm px-5 py-16">
      <Link href="/" className="text-sm text-muted underline underline-offset-4 hover:text-ink">
        Mentara
      </Link>

      <h1 className="mt-6 font-serif text-3xl leading-tight text-ink">Reset your password</h1>
      <p className="mt-3 leading-relaxed text-muted">
        Tell us the address you signed up with and we will send you a link to set a new one.
      </p>

      <div className="mt-8">
        <Suspense fallback={null}>
          <ForgotPasswordForm />
        </Suspense>
      </div>

      <p className="mt-10 border-t border-line pt-6 text-xs leading-relaxed text-faint">
        Your journal and check-ins are not affected by changing a password. Nothing is deleted and
        nothing is re-encrypted — you are just getting back in.
      </p>
    </main>
  );
}

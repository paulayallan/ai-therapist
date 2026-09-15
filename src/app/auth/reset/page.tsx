import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { ResetPasswordForm } from "@/components/reset-password-form";

export const metadata: Metadata = {
  title: "Choose a new password",
  robots: { index: false, follow: false },
};

export default function ResetPasswordPage() {
  return (
    <main id="main" className="mx-auto w-full max-w-sm px-5 py-16">
      <Link href="/" className="text-sm text-muted underline underline-offset-4 hover:text-ink">
        Mentara
      </Link>

      <h1 className="mt-6 font-serif text-3xl leading-tight text-ink">Choose a new password</h1>
      <p className="mt-3 leading-relaxed text-muted">
        This is the last step. Once it is saved you will be signed in.
      </p>

      <div className="mt-8">
        <Suspense fallback={null}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </main>
  );
}

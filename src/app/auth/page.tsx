import { AuthForm } from "@/components/auth-form";

export default function AuthPage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,_#edf5f2_0%,_#f6f0e8_100%)] px-4 py-10">
      <div className="mx-auto max-w-6xl">
        <AuthForm />
      </div>
    </main>
  );
}

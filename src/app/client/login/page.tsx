import Link from "next/link";
import { ClientLoginForm } from "@/components/client-login-form";

export default function ClientLoginPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 gap-4">
      <ClientLoginForm />
      <Link href="/" className="text-sm text-muted-foreground hover:underline">
        На главную
      </Link>
    </main>
  );
}

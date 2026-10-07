import Link from "next/link";
import { StaffLoginForm } from "@/components/staff-login-form";

export default function LoginPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 gap-4">
      <StaffLoginForm />
      <Link href="/" className="text-sm text-muted-foreground hover:underline">
        На главную
      </Link>
    </main>
  );
}

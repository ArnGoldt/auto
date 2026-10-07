import Link from "next/link";
import { cn } from "@/lib/utils";

export function AppShell({
  title,
  nav,
  children,
  wide,
}: {
  title: string;
  nav: { href: string; label: string }[];
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <header className="border-b bg-white">
        <div
          className={cn(
            "mx-auto flex items-center justify-between px-4 py-3",
            wide ? "max-w-7xl" : "max-w-lg",
          )}
        >
          <div>
            <p className="text-xs uppercase tracking-wide text-zinc-500">
              Автосервис
            </p>
            <h1 className="text-lg font-semibold">{title}</h1>
          </div>
        </div>
        <nav className="border-t bg-white">
          <ul
            className={cn(
              "mx-auto flex gap-4 overflow-x-auto px-4 py-2 text-sm",
              wide ? "max-w-7xl" : "max-w-lg",
            )}
          >
            {nav.map((n) => (
              <li key={n.href}>
                <Link className="whitespace-nowrap text-blue-700 hover:underline" href={n.href}>
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </header>
      <main
        className={cn(
          "mx-auto px-4 py-6",
          wide ? "max-w-7xl" : "max-w-lg",
        )}
      >
        {children}
      </main>
    </div>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="mb-3 block text-sm">
      <span className="mb-1 block font-medium text-zinc-700">{label}</span>
      {children}
    </label>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "w-full rounded-lg border border-zinc-300 px-3 py-2 text-base",
        props.className,
      )}
    />
  );
}

export function Textarea(
  props: React.TextareaHTMLAttributes<HTMLTextAreaElement>,
) {
  return (
    <textarea
      {...props}
      className={cn(
        "w-full rounded-lg border border-zinc-300 px-3 py-2 text-base",
        props.className,
      )}
    />
  );
}

export function Button(
  props: React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "primary" | "secondary";
  },
) {
  const { variant = "primary", className, ...rest } = props;
  return (
    <button
      {...rest}
      className={cn(
        "rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50",
        variant === "primary"
          ? "bg-blue-700 text-white hover:bg-blue-800"
          : "border border-zinc-300 bg-white hover:bg-zinc-50",
        className,
      )}
    />
  );
}

export function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex rounded-full bg-zinc-200 px-2 py-0.5 text-xs font-medium text-zinc-800">
      {children}
    </span>
  );
}

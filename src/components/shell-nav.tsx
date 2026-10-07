"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function ShellNav({
  nav,
  wide,
}: {
  nav: { href: string; label: string }[];
  wide?: boolean;
}) {
  const pathname = usePathname();

  return (
    <ul
      className={cn(
        "mx-auto flex gap-1 overflow-x-auto px-4 py-2 text-sm",
        wide ? "max-w-7xl" : "max-w-lg",
      )}
    >
      {nav.map((n) => {
        const active =
          pathname === n.href ||
          (n.href !== "/app" && pathname.startsWith(n.href));
        return (
          <li key={n.href}>
            <Link
              className={cn(
                "block whitespace-nowrap rounded-lg px-3 py-2 font-medium transition-colors",
                active
                  ? "bg-[var(--accent-muted)] text-[var(--accent-foreground)]"
                  : "text-slate-300 hover:bg-white/10 hover:text-white",
              )}
              href={n.href}
            >
              {n.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

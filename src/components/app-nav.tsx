"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const links = [
  { href: "/app", label: "Обзор" },
  { href: "/app/clients", label: "Клиенты" },
  { href: "/app/inquiries", label: "Обращения" },
];

export function AppNav() {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1 p-4 border-r bg-card min-h-screen w-56 shrink-0">
      <p className="text-xs font-medium text-muted-foreground px-2 mb-2">
        Менеджер
      </p>
      {links.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className={cn(
            "rounded-md px-3 py-2 text-sm hover:bg-muted",
            pathname === l.href ||
              (l.href !== "/app" && pathname.startsWith(l.href))
              ? "bg-muted font-medium"
              : "",
          )}
        >
          {l.label}
        </Link>
      ))}
    </nav>
  );
}

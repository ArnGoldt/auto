import Link from "next/link";
import { cn } from "@/lib/utils";
import { ShellNav } from "@/components/shell-nav";

export function BrandMark({ compact }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div
        className={cn(
          "flex shrink-0 items-center justify-center rounded-lg bg-[var(--accent)] font-bold text-[var(--navy-900)]",
          compact ? "size-8 text-xs" : "size-10 text-sm",
        )}
        aria-hidden
      >
        АП
      </div>
      {!compact && (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-400/90">
            Сеть мастерских
          </p>
          <p className="text-base font-semibold leading-tight text-white">
            АвтоПортал
          </p>
        </div>
      )}
    </div>
  );
}

export function AppShell({
  title,
  nav,
  children,
  wide,
  logoutSlot,
}: {
  title: string;
  nav: { href: string; label: string }[];
  children: React.ReactNode;
  wide?: boolean;
  logoutSlot?: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <header className="border-b border-[var(--navy-800)] bg-[var(--navy-900)] text-white shadow-md">
        <div
          className={cn(
            "mx-auto flex items-center justify-between gap-4 px-4 py-3",
            wide ? "max-w-7xl" : "max-w-lg",
          )}
        >
          <BrandMark />
          <div className="min-w-0 text-right">
            <p className="truncate text-sm font-medium text-white">{title}</p>
            {logoutSlot}
          </div>
        </div>
        <nav className="border-t border-white/10 bg-[var(--navy-800)]/80">
          <ShellNav nav={nav} wide={wide} />
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

export function PublicChrome({
  children,
  title,
  subtitle,
}: {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="border-b border-[var(--navy-800)] bg-[var(--navy-900)] px-4 py-4 text-white">
        <div className="mx-auto flex max-w-lg items-center justify-between">
          <Link href="/">
            <BrandMark compact />
          </Link>
        </div>
      </header>
      <div className="mx-auto max-w-lg px-4 py-8">
        <h1 className="text-2xl font-bold tracking-tight text-[var(--navy-900)]">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1.5 text-sm leading-relaxed text-[var(--muted)]">
            {subtitle}
          </p>
        )}
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}

export function ClientChrome({
  children,
  headerRight,
}: {
  children: React.ReactNode;
  headerRight?: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="border-b border-[var(--navy-800)] bg-[var(--navy-900)] text-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <BrandMark compact />
            <span className="text-sm font-medium">Личный кабинет</span>
          </div>
          {headerRight}
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-6">{children}</main>
    </div>
  );
}

export function Card({
  children,
  className,
  padding = "md",
}: {
  children: React.ReactNode;
  className?: string;
  padding?: "none" | "sm" | "md" | "lg";
}) {
  const pad = {
    none: "",
    sm: "p-3",
    md: "p-4",
    lg: "p-6",
  }[padding];
  return (
    <div
      className={cn(
        "rounded-[var(--radius-xl)] border border-[var(--border-subtle)] bg-[var(--surface)] shadow-[var(--shadow-card)]",
        pad,
        className,
      )}
    >
      {children}
    </div>
  );
}

export function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: React.ReactNode;
  accent?: "amber" | "blue" | "green";
}) {
  const bar = {
    amber: "bg-[var(--accent)]",
    blue: "bg-sky-500",
    green: "bg-emerald-500",
  }[accent ?? "amber"];
  return (
    <Card className="relative overflow-hidden">
      <div className={cn("absolute left-0 top-0 h-1 w-full", bar)} />
      <p className="text-sm font-medium text-[var(--muted)]">{label}</p>
      <p className="mt-1 text-3xl font-bold tabular-nums tracking-tight text-[var(--navy-900)]">
        {value}
      </p>
    </Card>
  );
}

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <Card padding="lg" className="text-center">
      <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-[var(--surface-muted)] text-2xl">
        ∅
      </div>
      <p className="font-medium text-[var(--navy-900)]">{title}</p>
      {description && (
        <p className="mt-1 text-sm text-[var(--muted)]">{description}</p>
      )}
    </Card>
  );
}

export function PageTitle({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-6">
      <h2 className="text-xl font-bold tracking-tight text-[var(--navy-900)]">
        {title}
      </h2>
      {description && (
        <p className="mt-1 text-sm text-[var(--muted)]">{description}</p>
      )}
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
    <label className="mb-4 block text-sm">
      <span className="mb-1.5 block font-medium text-[var(--navy-800)]">
        {label}
      </span>
      {children}
    </label>
  );
}

const controlBase =
  "w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-white px-3 py-2.5 text-base text-[var(--foreground)] transition-shadow placeholder:text-slate-400 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/25";

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(controlBase, props.className)} />;
}

export function Textarea(
  props: React.TextareaHTMLAttributes<HTMLTextAreaElement>,
) {
  return <textarea {...props} className={cn(controlBase, props.className)} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cn(controlBase, props.className)} />;
}

export function Button(
  props: React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "primary" | "secondary" | "ghost";
    size?: "sm" | "md" | "lg";
  },
) {
  const {
    variant = "primary",
    size = "md",
    className,
    ...rest
  } = props;
  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2.5 text-sm",
    lg: "px-5 py-3 text-base",
  }[size];
  return (
    <button
      {...rest}
      className={cn(
        "inline-flex items-center justify-center rounded-[var(--radius-md)] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        sizes,
        variant === "primary" &&
          "bg-[var(--accent)] text-[var(--navy-900)] hover:bg-[var(--accent-hover)] active:brightness-95",
        variant === "secondary" &&
          "border border-[var(--border)] bg-white text-[var(--navy-800)] hover:bg-[var(--surface-muted)]",
        variant === "ghost" &&
          "text-[var(--muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--navy-900)]",
        className,
      )}
    />
  );
}

export function LinkButton({
  href,
  children,
  variant = "primary",
  className,
}: {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary";
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center justify-center rounded-[var(--radius-md)] px-5 py-3 text-sm font-semibold transition-colors",
        variant === "primary" &&
          "bg-[var(--accent)] text-[var(--navy-900)] hover:bg-[var(--accent-hover)]",
        variant === "secondary" &&
          "border border-white/25 bg-white/5 text-white hover:bg-white/10",
        className,
      )}
    >
      {children}
    </Link>
  );
}

export type BadgeVariant =
  | "default"
  | "accent"
  | "success"
  | "warning"
  | "info"
  | "muted";

export function Badge({
  children,
  variant = "default",
}: {
  children: React.ReactNode;
  variant?: BadgeVariant;
}) {
  const styles: Record<BadgeVariant, string> = {
    default: "bg-[var(--surface-muted)] text-[var(--navy-800)]",
    accent: "bg-[var(--accent-muted)] text-[var(--accent-foreground)]",
    success: "bg-[var(--success-bg)] text-[var(--success)]",
    warning: "bg-[var(--warning-bg)] text-[var(--warning)]",
    info: "bg-[var(--info-bg)] text-[var(--info)]",
    muted: "bg-slate-100 text-[var(--muted)]",
  };
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        styles[variant],
      )}
    >
      {children}
    </span>
  );
}

export function operationBadgeVariant(status: string): BadgeVariant {
  switch (status) {
    case "IN_PROGRESS":
      return "warning";
    case "ASSIGNED":
      return "info";
    case "DONE":
    case "COMPLETED":
      return "success";
    default:
      return "default";
  }
}

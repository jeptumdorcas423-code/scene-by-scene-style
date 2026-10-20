import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import {
  LayoutDashboard, BookOpen, ListChecks, Layers, AlertCircle, CalendarDays, Gauge, MessageCircleQuestion, Settings, Menu, X, Cloud,
} from "lucide-react";

export const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/learn", label: "Learn", icon: BookOpen },
  { to: "/quiz", label: "Practice Quiz", icon: ListChecks },
  { to: "/flashcards", label: "Flashcards", icon: Layers },
  { to: "/mistakes", label: "My Mistakes", icon: AlertCircle },
  { to: "/planner", label: "Study Planner", icon: CalendarDays },
  { to: "/readiness", label: "Exam Readiness", icon: Gauge },
  { to: "/buddy", label: "Study Buddy", icon: MessageCircleQuestion },
  { to: "/settings", label: "Settings & About", icon: Settings },
] as const;

export const DISCLAIMER =
  "Azure Buddy is an independent, unofficial study tool. It is not affiliated with or endorsed by Microsoft. All practice questions are original learning questions and are not actual certification exam questions.";

function Brand() {
  return (
    <Link to="/" className="flex items-center gap-2.5">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
        <Cloud className="h-5 w-5" aria-hidden />
      </span>
      <span className="leading-tight">
        <span className="block font-display text-lg font-bold">Azure Buddy</span>
        <span className="block text-xs text-muted-foreground">AZ-900 study companion</span>
      </span>
    </Link>
  );
}

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav aria-label="Main" className="flex flex-col gap-1">
      {NAV.map(({ to, label, icon: Icon }) => {
        const active = to === "/" ? path === "/" : path.startsWith(to);
        return (
          <Link
            key={to}
            to={to}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
              active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <Icon className="h-4.5 w-4.5 shrink-0" aria-hidden />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const path = useRouterState({ select: (s) => s.location.pathname });
  useEffect(() => setOpen(false), [path]);

  return (
    <div className="min-h-dvh lg:flex">
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col gap-6 border-r bg-sidebar p-5 lg:flex">
        <Brand />
        <NavList />
        <p className="mt-auto rounded-lg bg-teal-soft p-3 text-xs text-teal">Small steps lead to big progress. 🌱</p>
      </aside>

      <header className="sticky top-0 z-30 flex items-center justify-between border-b bg-card/95 px-4 py-3 backdrop-blur lg:hidden">
        <Brand />
        <button className="btn btn-ghost p-2" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} onClick={() => setOpen((o) => !o)}>
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </header>
      {open && (
        <div className="fixed inset-0 top-[61px] z-20 overflow-y-auto bg-card p-4 lg:hidden">
          <NavList onNavigate={() => setOpen(false)} />
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-10">{children}</main>
        <footer className="border-t px-4 py-5 text-center text-xs text-muted-foreground sm:px-6">{DISCLAIMER}</footer>
      </div>
    </div>
  );
}

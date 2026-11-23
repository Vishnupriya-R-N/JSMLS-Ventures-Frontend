"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS: { label: string; href?: string }[] = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Level Information", href: "/dashboard/levels" },
  { label: "Profile", href: "/profile" },
  { label: "Activity History" },
  { label: "Referrals" },
  { label: "Notifications" },
  { label: "Support" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="md:w-56 md:shrink-0">
      <nav
        aria-label="Dashboard"
        className="flex gap-2 overflow-x-auto rounded-xl border border-line bg-white p-2 shadow-lg shadow-navy-900/10 md:sticky md:top-24 md:flex-col md:gap-1 md:overflow-visible"
      >
        {ITEMS.map((item) => {
          const base = "whitespace-nowrap rounded-lg px-3.5 py-2 text-sm font-medium";

          if (!item.href) {
            return (
              <span key={item.label} aria-disabled="true" className={`${base} cursor-not-allowed text-muted opacity-70`}>
                {item.label}
                <span className="ml-2 rounded-full bg-slate-100 px-1.5 py-0.5 text-[0.65rem] font-semibold">
                  Soon
                </span>
              </span>
            );
          }

          const active = pathname === item.href;
          return (
            <Link
              key={item.label}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`${base} ${active ? "bg-navy-700 text-white" : "text-ink hover:bg-slate-100"}`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
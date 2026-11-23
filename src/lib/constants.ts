import type { Role } from "@/types";



export const SITE = {
  name: "Victory Club",
  company: "JSMLS Ventures LLP",
  version: "1.0",
  tagline: "Register, get your unique ID and follow your progress.",
} as const;

export const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/login", label: "Login" },
] as const;

// Where each role goes after login. The dashboards come in a later phase,
// so every role goes to /dashboard for now as currently implemented. Change this when the admin area exists.
export const HOME_BY_ROLE: Record<Role, string> = {
  participant: "/dashboard",
  administrator: "/dashboard",
  finance_officer: "/dashboard",
  super_admin: "/dashboard",
};


// The PDF (Section 7) fixes the structure at 3 levels. Used only if the backend doesn't send a number.
export const TOTAL_LEVELS = 3;

export const DEMO_NOTICE =
  "Demonstration platform. Illustrative interface only. No actual payment entitlement or income is represented.";

export const LEGAL_NOTICE =
  "Real-money payments and payouts must NOT be built or switched on until a qualified Indian lawyer gives written legal approval.";
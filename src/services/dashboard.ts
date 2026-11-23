import { TOTAL_LEVELS } from "@/lib/constants";
import type { AccountStatus, DashboardData } from "@/types";

const API_URL = "/api";
const DASHBOARD_PATH = "/dashboard";

export type DashboardResult =
  | { ok: true; data: DashboardData }
  | { ok: false; message: string; unauthorized?: boolean };

type Raw = Record<string, unknown>;
const isObj = (v: unknown): v is Raw => typeof v === "object" && v !== null;
const messageOf = (body: unknown) =>
  isObj(body) && typeof body.message === "string" ? body.message : null;

// Map the backend response to the frontend DashboardData type
function mapDashboard(body: unknown): DashboardData | null {
  if (!isObj(body)) return null;

  // 1. Extract user info from the nested `user` object
  const user = isObj(body.user) ? body.user : {};
  
  const userId = user.userId;
  // Backend uses `name`, fallback to `fullName` just in case
  const fullName = user.name ?? user.fullName; 
  
  if (typeof userId !== "string" || typeof fullName !== "string") {
    return null;
  }

  // 2. Extract root-level fields
  const accountStatus = (body.accountStatus as AccountStatus) || "PENDING_VERIFICATION";
  const currentStage = typeof body.currentStage === "string" ? body.currentStage : "";

  // 3. Extract nested levels
  const levels = isObj(body.levels) ? body.levels : {};
  const totalLevels = typeof levels.totalLevels === "number" ? levels.totalLevels : TOTAL_LEVELS;

  return {
    userId,
    fullName,
    email: typeof user.email === "string" ? user.email : "",
    accountStatus,
    currentStage,
    totalLevels,
    // Add other mapped fields here if your DashboardData type requires them
  } as DashboardData;
}

export async function getDashboard(): Promise<DashboardResult> {
  try {
    const res = await fetch(`${API_URL}${DASHBOARD_PATH}`, {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    
    const body: unknown = await res.json().catch(() => null);

    if (res.ok) {
      const data = mapDashboard(body);
      return data
        ? { ok: true, data }
        : { ok: false, message: "The server sent an unexpected response format." };
    }
    
    if (res.status === 401) {
      return { ok: false, unauthorized: true, message: "Please log in to view your dashboard." };
    }
    
    return { ok: false, message: messageOf(body) ?? "Could not load dashboard data." };
  } catch {
    return { ok: false, message: "Cannot reach the server. Check your connection." };
  }
}
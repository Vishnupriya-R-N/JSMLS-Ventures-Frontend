"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import StatCard from "@/components/dashboard/StatCard";
import StatusBadge from "@/components/dashboard/StatusBadge";
import { getDashboard } from "@/services/dashboard";
import type { DashboardData } from "@/types";

type State =
  | { status: "loading" }
  | { status: "ready"; data: DashboardData }
  | { status: "error"; message: string; unauthorized: boolean };

function LoadingSkeleton() {
  return (
    <div role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">Loading your dashboard…</span>
      <div className="mb-6 h-8 w-64 animate-pulse rounded-lg bg-slate-200" />
      <div className="grid gap-5 sm:grid-cols-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-28 animate-pulse rounded-xl border border-line bg-white" />
        ))}
      </div>
    </div>
  );
}

export default function DashboardContent() {
  const [state, setState] = useState<State>({ status: "loading" });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    getDashboard().then((res) => {
      if (cancelled) return;
      setState(
        res.ok
          ? { status: "ready", data: res.data }
          : { status: "error", message: res.message, unauthorized: !!res.unauthorized },
      );
    });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  function retry() {
    setState({ status: "loading" });
    setReloadKey((k) => k + 1);
  }

  if (state.status === "loading") return <LoadingSkeleton />;

  if (state.status === "error") {
    return (
      <div className="grid gap-4">
        <h1 className="text-[1.6rem] font-bold leading-tight text-navy-900">Dashboard</h1>
        <Alert tone="error">{state.message}</Alert>
        {state.unauthorized ? (
          <div>
            <Link
              href="/login"
              className="inline-block rounded-[10px] border border-navy-700 bg-navy-700 px-5 py-2.5 font-semibold text-white hover:bg-navy-600"
            >
              Go to login
            </Link>
          </div>
        ) : (
          <div>
            <Button type="button" onClick={retry}>
              Try again
            </Button>
          </div>
        )}
      </div>
    );
  }

  const user = state.data;

  return (
    <>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[1.6rem] font-bold leading-tight text-navy-900">
            Welcome, {user.fullName}
          </h1>
          <p className="text-muted">Here is your Victory Club overview.</p>
        </div>
        
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <StatCard label="User ID" value={user.userId} note="Your unique participant ID" />
        <StatCard label="Account Status">
          <StatusBadge status={user.accountStatus} />
        </StatCard>
        
        {/* FIXED: Now reads 'currentStage' from the API data */}
        <StatCard label="Current Stage" value={user.currentStage} note="Your current progression" />
        
        <StatCard
          label="Total Levels"
          value={`${user.totalLevels} Levels`}
          note="Level 1, Level 2 and Level 3"
        />
      </div>

     
    </>
  );
}
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import { getStageConfigurations } from "@/services/stages";
import { formatINR } from "@/lib/stageConfig";
import type { StageConfig, StageNumber } from "@/types";

type State =
  | { status: "loading" }
  | { status: "ready"; stages: StageConfig[]; meta?: { totalStages: number; levelsPerStage: number; positionsPerStage: number } }
  | { status: "error"; message: string; unauthorized: boolean };

function LoadingSkeleton() {
  return (
    <div role="status" aria-live="polite" aria-busy="true" className="space-y-6">
      <span className="sr-only">Loading stage calculator…</span>
      <div className="h-8 w-64 animate-pulse rounded-lg bg-slate-200" />
      <div className="h-4 w-96 max-w-full animate-pulse rounded bg-slate-200" />

      {/* Stage selector skeleton */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl border border-line bg-white" />
        ))}
      </div>

      {/* Main card skeleton */}
      <div className="h-72 animate-pulse rounded-xl border border-line bg-white" />
    </div>
  );
}

export default function StageCalculator() {
  const [state, setState] = useState<State>({ status: "loading" });
  const [reloadKey, setReloadKey] = useState(0);
  const [selectedStageNumber, setSelectedStageNumber] = useState<StageNumber>(1);

  useEffect(() => {
    let cancelled = false;
    getStageConfigurations().then((res) => {
      if (cancelled) return;
      if (res.ok) {
        if (!res.stages || res.stages.length === 0) {
          setState({
            status: "error",
            message: "No stage configurations were found.",
            unauthorized: false,
          });
          return;
        }
        setState({
          status: "ready",
          stages: res.stages,
          meta: res.meta,
        });
      } else {
        setState({
          status: "error",
          message: res.message,
          unauthorized: !!res.unauthorized,
        });
      }
    })
      .catch((error) => {
        if (cancelled) return;
        console.error("Failed to fetch stage configurations:", error);
        setState({
          status: "error",
          message: "Unable to load stage configurations. Please try again.",
          unauthorized: false,
        });
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  function retry() {
    setState({ status: "loading" });
    setReloadKey((k) => k + 1);
  }

  function handleSelectStage(stage: StageNumber) {
    setSelectedStageNumber(stage);
  }

  if (state.status === "loading") {
    return <LoadingSkeleton />;
  }

  if (state.status === "error") {
    return (
      <div className="grid gap-4">
        <div>
          <h1 className="text-[1.6rem] font-bold leading-tight text-navy-900">Stage Calculator</h1>
          <p className="mt-1 text-sm text-muted">
            Configure and calculate potential figures across all six stages.
          </p>
        </div>
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

  const { stages } = state;
  const currentStageConfig = stages.find((s) => s.stage === selectedStageNumber) || stages[0];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[1.6rem] font-bold leading-tight text-navy-900">
            Six-Stage Calculator
          </h1>
          <p className="mt-1 text-sm text-muted">
            Explore stage configurations, calculate potential figures, and simulate 3-level progression.
          </p>
        </div>
        <span className="rounded-lg bg-gold-500 px-3 py-1 text-xs font-bold tracking-wider text-black">
          DEMO SIMULATION
        </span>
      </div>

      {/* Step 1: Select Any of the 6 Stages */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
            Select a Stage (1 to 6)
          </h2>
          <span className="text-xs font-medium text-navy-700">
            Active: {currentStageConfig.name}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
          {stages.map((stage) => {
            const isSelected = stage.stage === selectedStageNumber;
            return (
              <button
                key={stage.stage}
                type="button"
                onClick={() => handleSelectStage(stage.stage)}
                aria-pressed={isSelected}
                className={`relative flex flex-col justify-between rounded-xl border p-3.5 text-left transition-all focus:outline-none focus:ring-2 focus:ring-navy-600 ${isSelected
                  ? "border-navy-700 bg-navy-900 text-white shadow-md ring-2 ring-gold-500/80"
                  : "border-line bg-white text-navy-900 hover:border-navy-600 hover:bg-slate-50"
                  }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-bold uppercase tracking-wider ${isSelected ? "text-gold-500" : "text-muted"
                      }`}
                  >
                    Stage {stage.stage}
                  </span>
                  {isSelected && (
                    <span className="h-2 w-2 rounded-full bg-gold-500" />
                  )}
                </div>

                <div className="my-2">
                  <p
                    className={`text-base font-extrabold sm:text-lg ${isSelected ? "text-white" : "text-navy-900"
                      }`}
                  >
                    {formatINR(stage.totalPotential)}
                  </p>
                  <p
                    className={`text-[0.7rem] ${isSelected ? "text-slate-300" : "text-muted"
                      }`}
                  >
                    Max Potential
                  </p>
                </div>

                <div className="pt-1">
                  <span
                    className={`inline-block rounded px-1.5 py-0.5 text-[0.65rem] font-medium ${isSelected
                      ? "bg-navy-800 text-gold-500"
                      : "bg-slate-100 text-muted"
                      }`}
                  >
                    {stage.pmf > 0 ? `PMF: ${formatINR(stage.pmf)}` : "PMF: None"}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Step 2: Selected Stage Figures & Detailed Breakdown */}
      <section
        aria-labelledby="selected-stage-heading"
        className="rounded-xl border border-line bg-white p-5 shadow-lg shadow-navy-900/5 sm:p-6"
      >
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2
                id="selected-stage-heading"
                className="text-xl font-bold text-navy-900"
              >
                {currentStageConfig.name} Figures & Structure
              </h2>
              <span className="rounded-full bg-navy-100 px-2.5 py-0.5 text-xs font-semibold text-navy-700">
                14 Positions
              </span>
            </div>
            <p className="mt-1 text-sm text-muted">
              {currentStageConfig.notes ||
                "Three-level distribution structure with 2, 4, and 8 positions."}
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs font-medium text-muted">Total Potential Payout</span>
            <p className="text-2xl font-extrabold text-navy-900 sm:text-3xl">
              {formatINR(currentStageConfig.totalPotential)}
            </p>
          </div>
        </div>

        {/* 4 Summary Stat Cards */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-line bg-slate-50/70 p-3.5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">
              Level 1 & 2 Combined
            </p>
            <p className="mt-1 text-xl font-bold text-navy-900">
              {formatINR(currentStageConfig.level1And2Total)}
            </p>
            <p className="mt-1 text-xs text-muted">
              6 positions total (2 in L1 + 4 in L2)
            </p>
          </div>

          <div className="rounded-lg border border-line bg-slate-50/70 p-3.5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">
              Level 3 Total
            </p>
            <p className="mt-1 text-xl font-bold text-navy-900">
              {formatINR(currentStageConfig.level3Total)}
            </p>
            <p className="mt-1 text-xs text-muted">
              8 positions (8 × {formatINR(currentStageConfig.thirdPerson)})
            </p>
          </div>

          <div className="rounded-lg border border-line bg-slate-50/70 p-3.5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">
              Platform Fee (PMF)
            </p>
            <p className="mt-1 text-xl font-bold text-navy-900">
              {currentStageConfig.pmf > 0 ? formatINR(currentStageConfig.pmf) : "—"}
            </p>
            <p className="mt-1 text-xs text-muted">
              {currentStageConfig.pmfNote || "No PMF specified"}
            </p>
          </div>

          <div className="rounded-lg border border-line bg-slate-50/70 p-3.5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">
              Level 3 Rate (Per Person)
            </p>
            <p className="mt-1 text-xl font-bold text-navy-900">
              {formatINR(currentStageConfig.thirdPerson)}
            </p>
            <p className="mt-1 text-xs text-muted">Rate for 8 people in Level 3</p>
          </div>
        </div>

        {/* Level Breakdown Grid */}
        <div className="mt-6">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-navy-900">
            Per-Level Earnings Breakdown
          </h3>
          <div className="overflow-x-auto rounded-lg border border-line">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-line bg-slate-50 text-xs font-semibold uppercase tracking-wider text-muted">
                <tr>
                  <th className="px-4 py-3">Level</th>
                  <th className="px-4 py-3">Slots</th>
                  <th className="px-4 py-3">Rate Per Person</th>
                  <th className="px-4 py-3 text-right">Level Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line font-medium text-navy-900">
                <tr>
                  <td className="px-4 py-3 font-semibold text-navy-700">Level 1</td>
                  <td className="px-4 py-3">2 positions</td>
                  <td className="px-4 py-3">
                    {formatINR(currentStageConfig.firstPerson)} per person
                  </td>
                  <td className="px-4 py-3 text-right font-bold">
                    {formatINR(currentStageConfig.level1Total)}
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-semibold text-navy-700">Level 2</td>
                  <td className="px-4 py-3">4 positions</td>
                  <td className="px-4 py-3">
                    {formatINR(currentStageConfig.secondPerson)} per person
                  </td>
                  <td className="px-4 py-3 text-right font-bold">
                    {formatINR(currentStageConfig.level2Total)}
                  </td>
                </tr>
                <tr className="bg-slate-50/50">
                  <td className="px-4 py-3 font-semibold text-navy-900" colSpan={3}>
                    Level 1 + Level 2 Combined Total
                    {currentStageConfig.stage === 6 && (
                      <span className="block text-xs font-normal text-muted">
                        Gross ₹5,60,000 less ₹30,000 extra PMF deduction
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-navy-900">
                    {formatINR(currentStageConfig.level1And2Total)}
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-semibold text-navy-700">Level 3</td>
                  <td className="px-4 py-3">8 positions</td>
                  <td className="px-4 py-3">
                    {formatINR(currentStageConfig.thirdPerson)} per person
                  </td>
                  <td className="px-4 py-3 text-right font-bold">
                    {formatINR(currentStageConfig.level3Total)}
                  </td>
                </tr>
                <tr className="border-t-2 border-line bg-navy-50 font-bold text-navy-900">
                  <td className="px-4 py-3.5 text-base" colSpan={3}>
                    Full Stage Completion Total
                  </td>
                  <td className="px-4 py-3.5 text-right text-base text-navy-900 sm:text-lg">
                    {formatINR(currentStageConfig.totalPotential)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Step 3: Comprehensive Comparison Table Across All 6 Stages */}
      <section
        aria-labelledby="comparison-heading"
        className="rounded-xl border border-line bg-white p-5 shadow-lg shadow-navy-900/5 sm:p-6"
      >
        <div className="mb-4">
          <h2 id="comparison-heading" className="text-lg font-bold text-navy-900">
            All 6 Stages Comparison (Original Plan Figures)
          </h2>
          <p className="text-xs text-muted">
            Section 8 plan figures. Click any row to load its detailed calculations.
          </p>
        </div>

        <div className="overflow-x-auto rounded-lg border border-line">
          <table className="w-full min-w-160 text-left text-sm">
            <thead className="border-b border-line bg-slate-50 text-xs font-semibold uppercase tracking-wider text-muted">
              <tr>
                <th className="px-3.5 py-3">Stage</th>
                <th className="px-3.5 py-3">1st Person (L1)</th>
                <th className="px-3.5 py-3">2nd Person (L2)</th>
                <th className="px-3.5 py-3">3rd Person (L3)</th>
                <th className="px-3.5 py-3">Level 1+2 Total</th>
                <th className="px-3.5 py-3">Level 3 Total (8 ppl)</th>
                <th className="px-3.5 py-3">Total Potential</th>
                <th className="px-3.5 py-3">PMF</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line text-navy-900">
              {stages.map((s) => {
                const isCurrent = s.stage === selectedStageNumber;
                return (
                  <tr
                    key={s.stage}
                    onClick={() => handleSelectStage(s.stage)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        handleSelectStage(s.stage);
                      }
                    }}
                    tabIndex={0}
                    aria-selected={isCurrent}
                    className={`cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-navy-600 ${isCurrent
                        ? "bg-navy-50/90 font-semibold"
                        : "hover:bg-slate-50"
                      }`}
                  >
                    <td className="px-3.5 py-3">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`inline-block rounded-full px-2 py-0.5 text-xs font-bold ${isCurrent
                            ? "bg-navy-700 text-white"
                            : "bg-slate-200 text-navy-900"
                            }`}
                        >
                          Stage {s.stage}
                        </span>
                        {isCurrent && (
                          <span className="text-[0.65rem] font-bold text-navy-700">
                            (Selected)
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3.5 py-3">{formatINR(s.firstPerson)}</td>
                    <td className="px-3.5 py-3">{formatINR(s.secondPerson)}</td>
                    <td className="px-3.5 py-3">{formatINR(s.thirdPerson)}</td>
                    <td className="px-3.5 py-3 font-medium">
                      {formatINR(s.level1And2Total)}
                      {s.stage === 6 && "*"}
                    </td>
                    <td className="px-3.5 py-3 font-medium">{formatINR(s.level3Total)}</td>
                    <td className="px-3.5 py-3 font-bold text-navy-900">
                      {formatINR(s.totalPotential)}
                    </td>
                    <td className="px-3.5 py-3 text-xs text-muted">
                      {s.pmf > 0 ? formatINR(s.pmf) : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-muted">
          * Stage 6: ₹1,60,000 + ₹4,00,000 = ₹5,60,000, less the stated extra PMF of ₹30,000.
        </p>
      </section>
    </div>
  );
}

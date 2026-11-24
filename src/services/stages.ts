import { STAGE_CONFIGS } from "@/lib/stageConfig";
import type { StageConfig, StageNumber } from "@/types";

const API_URL = "/api";
const STAGES_PATH = "/stages";

export type StageConfigResult =
  | {
      ok: true;
      stages: StageConfig[];
      meta?: {
        totalStages: number;
        levelsPerStage: number;
        positionsPerStage: number;
        disclaimer?: string;
      };
    }
  | { ok: false; message: string; unauthorized?: boolean };

export type SingleStageResult =
  | { ok: true; stage: StageConfig }
  | { ok: false; message: string; unauthorized?: boolean };

type Raw = Record<string, unknown>;
const isObj = (v: unknown): v is Raw => typeof v === "object" && v !== null;
const messageOf = (body: unknown) =>
  isObj(body) && typeof body.message === "string" ? body.message : null;

function mapStages(body: unknown): StageConfig[] | null {
  if (!isObj(body)) return null;

  const rawStages = Array.isArray(body.stages) ? body.stages : null;
  if (!rawStages || rawStages.length === 0) return null;

  const valid: StageConfig[] = [];
  for (const item of rawStages) {
    if (!isObj(item)) continue;
    const stage = Number(item.stage) as StageNumber;
    if (stage < 1 || stage > 6) continue;

    valid.push({
      stage,
      name: typeof item.name === "string" ? item.name : `Stage ${stage}`,
      firstPerson: Number(item.firstPerson) || 0,
      secondPerson: Number(item.secondPerson) || 0,
      thirdPerson: Number(item.thirdPerson) || 0,
      level1Positions: Number(item.level1Positions) || 2,
      level2Positions: Number(item.level2Positions) || 4,
      level3Positions: Number(item.level3Positions) || 8,
      totalPositions: Number(item.totalPositions) || 14,
      level1Total: Number(item.level1Total) || 0,
      level2Total: Number(item.level2Total) || 0,
      level1And2Total: Number(item.level1And2Total) || 0,
      level3Total: Number(item.level3Total) || 0,
      totalPotential: Number(item.totalPotential) || 0,
      pmf: Number(item.pmf) || 0,
      pmfNote: typeof item.pmfNote === "string" ? item.pmfNote : undefined,
      extraPmfDeduction:
        typeof item.extraPmfDeduction === "number" ? item.extraPmfDeduction : undefined,
      notes: typeof item.notes === "string" ? item.notes : undefined,
    });
  }

  return valid.length === 6 ? valid : null;
}

export async function getStageConfigurations(): Promise<StageConfigResult> {
  try {
    const res = await fetch(`${API_URL}${STAGES_PATH}`, {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    const body: unknown = await res.json().catch(() => null);

    if (res.ok) {
      const stages = mapStages(body);
      if (stages) {
        const meta =
          isObj(body) && isObj(body.meta)
            ? {
                totalStages: Number(body.meta.totalStages) || 6,
                levelsPerStage: Number(body.meta.levelsPerStage) || 3,
                positionsPerStage: Number(body.meta.positionsPerStage) || 14,
                disclaimer:
                  typeof body.meta.disclaimer === "string" ? body.meta.disclaimer : undefined,
              }
            : undefined;

        return { ok: true, stages, meta };
      }

      // If the backend returned ok but parsing failed, fallback gracefully to verified plan figures
      return {
        ok: true,
        stages: STAGE_CONFIGS,
        meta: {
          totalStages: 6,
          levelsPerStage: 3,
          positionsPerStage: 14,
        },
      };
    }

    if (res.status === 401) {
      return { ok: false, unauthorized: true, message: "Please log in to view the stage calculator.",};
    }

    return { ok: false, message: messageOf(body) ?? `Server responded with status ${res.status}. Could not load stage configuration.`,};
  } catch {
    return {
      ok: false,
      message: "Cannot reach the server to load stage configuration. Please check your connection.",
    };
  }
}

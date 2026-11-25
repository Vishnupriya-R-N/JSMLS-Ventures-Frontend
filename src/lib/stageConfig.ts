import type { StageConfig, StageNumber } from "@/types";

// Original Plan Figures
export const STAGE_CONFIGS: StageConfig[] = [
  {
    stage: 1,
    name: "Stage 1",
    firstPerson: 50,
    secondPerson: 100,
    thirdPerson: 250,
    level1Positions: 2,
    level2Positions: 4,
    level3Positions: 8,
    totalPositions: 14,
    level1Total: 100, // 2 × 50
    level2Total: 400, // 4 × 100
    level1And2Total: 500,
    level3Total: 2000, // 8 × 250
    totalPotential: 2500,
    pmf: 0,
    pmfNote: "Initial registration amount: ₹100",
    notes: "Entry stage. Level 1: ₹50/person (2 people), Level 2: ₹100/person (4 people), Level 3: ₹250/person (8 people).",
  },
  {
    stage: 2,
    name: "Stage 2",
    firstPerson: 100,
    secondPerson: 200,
    thirdPerson: 1500,
    level1Positions: 2,
    level2Positions: 4,
    level3Positions: 8,
    totalPositions: 14,
    level1Total: 200, // 2 × 100
    level2Total: 800, // 4 × 200
    level1And2Total: 1000,
    level3Total: 12000, // 8 × 1,500
    totalPotential: 13000,
    pmf: 200,
    pmfNote: "₹200 PMF fee",
    notes: "Two referral IDs required before completing Stage 2 (Section 10).",
  },
  {
    stage: 3,
    name: "Stage 3",
    firstPerson: 1000,
    secondPerson: 2000,
    thirdPerson: 8000,
    level1Positions: 2,
    level2Positions: 4,
    level3Positions: 8,
    totalPositions: 14,
    level1Total: 2000, // 2 × 1,000
    level2Total: 8000, // 4 × 2,000
    level1And2Total: 10000,
    level3Total: 64000, // 8 × 8,000
    totalPotential: 74000,
    pmf: 1000,
    pmfNote: "₹1,000 PMF fee",
    notes: "Level 1: ₹1,000/person, Level 2: ₹2,000/person, Level 3: ₹8,000/person.",
  },
  {
    stage: 4,
    name: "Stage 4",
    firstPerson: 9000,
    secondPerson: 20000,
    thirdPerson: 30000,
    level1Positions: 2,
    level2Positions: 4,
    level3Positions: 8,
    totalPositions: 14,
    level1Total: 18000, // 2 × 9,000
    level2Total: 80000, // 4 × 20,000
    level1And2Total: 98000,
    level3Total: 240000, // 8 × 30,000
    totalPotential: 338000,
    pmf: 5000,
    pmfNote: "₹5,000 PMF fee",
    notes: "Level 1: ₹9,000/person, Level 2: ₹20,000/person, Level 3: ₹30,000/person.",
  },
  {
    stage: 5,
    name: "Stage 5",
    firstPerson: 30000,
    secondPerson: 50000,
    thirdPerson: 150000,
    level1Positions: 2,
    level2Positions: 4,
    level3Positions: 8,
    totalPositions: 14,
    level1Total: 60000, // 2 × 30,000
    level2Total: 200000, // 4 × 50,000
    level1And2Total: 260000,
    level3Total: 1200000, // 8 × 1,50,000
    totalPotential: 1460000,
    pmf: 10000,
    pmfNote: "₹10,000 PMF fee",
    notes: "Level 1: ₹30,000/person, Level 2: ₹50,000/person, Level 3: ₹1,50,000/person.",
  },
  {
    stage: 6,
    name: "Stage 6",
    firstPerson: 80000,
    secondPerson: 100000,
    thirdPerson: 1000000,
    level1Positions: 2,
    level2Positions: 4,
    level3Positions: 8,
    totalPositions: 14,
    level1Total: 160000, // 2 × 80,000
    level2Total: 400000, // 4 × 1,00,000
    level1And2Total: 530000, // ₹1,60,000 + ₹4,00,000 = ₹5,60,000, less stated extra PMF of ₹30,000 = ₹5,30,000
    level3Total: 8000000, // 8 × 10,00,000
    totalPotential: 8530000,
    pmf: 20000,
    extraPmfDeduction: 30000,
    pmfNote: "₹20,000 (+₹30,000 later deducted from Level 1+2)",
    notes: "Stage 6: Level 1+2 gross is ₹5,60,000 (₹1,60,000 + ₹4,00,000), less stated extra PMF of ₹30,000 = ₹5,30,000. Level 3 total: ₹80,00,000.",
  },
];

export function getStageByNumber(stageNumber: StageNumber | number): StageConfig | undefined {
  return STAGE_CONFIGS.find((s) => s.stage === stageNumber);
}

export function formatINR(val: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(val);
}
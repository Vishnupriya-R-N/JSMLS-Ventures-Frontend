// The 4 roles from Section 3 of the PDF.
export type Role = "participant" | "administrator" | "finance_officer" | "super_admin";

export type LoginPayload = { identifier: string; password: string; otp?: string };

export type RegisterPayload = {
  fullName: string;
  email: string;
  mobile: string;
  password: string;
  acceptedTerms: boolean;
};

export type ServiceResult = { ok: boolean; message: string };

export type AccountStatus = "active" | "inactive" | "suspended";

export type DashboardData = {
  fullName: string;
  userId: string;
  accountStatus: AccountStatus;
  currentStage: string;
  totalLevels: number;
};

export type ProfileData = {
  fullName: string;
  userId: string;
  email: string;
  mobile: string;
};

// "/dashboard/levels " page section things
export type PositionStatus = "occupied" | "empty";

export type LevelPosition = {
  id: string;
  level: 1 | 2 | 3;
  slot: number;
  status: PositionStatus;
  userId?: string;
};

// Six-Stage Calculator types

export type StageNumber = 1 | 2 | 3 | 4 | 5 | 6;

export interface StageConfig {
  stage: StageNumber;
  name: string;
  firstPerson: number; // Level 1 rate per position (₹)
  secondPerson: number; // Level 2 rate per position (₹)
  thirdPerson: number; // Level 3 rate per position (₹)
  level1Positions: number; // 2
  level2Positions: number; // 4
  level3Positions: number; // 8
  totalPositions: number; // 14
  level1Total: number; // level1Positions * firstPerson
  level2Total: number; // level2Positions * secondPerson
  level1And2Total: number; // Gross or net level 1+2 total
  level3Total: number; // level3Positions * thirdPerson (8 people)
  totalPotential: number; // level1And2Total + level3Total
  pmf: number; // Platform Management Fee (₹)
  pmfNote?: string;
  extraPmfDeduction?: number; // e.g. 30000 for Stage 6
  notes?: string;
}
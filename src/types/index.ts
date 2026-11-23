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


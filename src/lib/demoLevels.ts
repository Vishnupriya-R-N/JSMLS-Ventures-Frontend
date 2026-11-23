import type { LevelPosition } from "@/types";

// Demo data only. Replace with real data from the backend in a later phase.
export const DEMO_PARTICIPANT = { fullName: "Demo Participant", userId: "VC100001" };

// Positions are filled in order from the first one: the IDs given are occupied, the rest are empty.
function makePositions(level: 1 | 2 | 3, count: number, occupiedIds: string[]): LevelPosition[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `L${level}-P${i + 1}`,
    level,
    slot: i + 1,
    status: occupiedIds[i] ? "occupied" : "empty",
    userId: occupiedIds[i],
  }));
}

// Section 7 of the PDF: Level 1 = 2 positions, Level 2 = 4, Level 3 = 8 (14 in total).
export const DEMO_LEVELS: { level: 1 | 2 | 3; positions: LevelPosition[] }[] = [
  { level: 1, positions: makePositions(1, 2, ["VC100002", "VC100003"]) },
  { level: 2, positions: makePositions(2, 4, ["VC100004", "VC100005"]) },
  { level: 3, positions: makePositions(3, 8, ["VC100006"]) },
];
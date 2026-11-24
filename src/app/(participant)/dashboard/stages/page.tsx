import type { Metadata } from "next";
import StageCalculator from "@/components/stages/StageCalculator";

export const metadata: Metadata = { title: "Stage Calculator" };

export default function StagesPage() {
  return <StageCalculator />;
}

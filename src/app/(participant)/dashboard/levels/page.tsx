import type { Metadata } from "next";
import LevelStructure from "@/components/levels/LevelStructure";

export const metadata: Metadata = { title: "Level Information" };

export default function LevelsPage() {
  return <LevelStructure />;
}
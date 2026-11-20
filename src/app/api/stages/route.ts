import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const stages = await prisma.stageConfiguration.findMany({
      orderBy: {
        stageNumber: "asc",
      },
    });

    const formattedStages = stages.map((stage) => ({
      id: stage.id,
      stageNumber: stage.stageNumber,

      firstPersonFigure: Number(stage.firstPersonFigure),
      secondPersonFigure: Number(stage.secondPersonFigure),
      thirdPersonFigure: Number(stage.thirdPersonFigure),

      level12Total: Number(stage.level12Total),
      level3Total: Number(stage.level3Total),

      createdAt: stage.createdAt,
      updatedAt: stage.updatedAt,
    }));

    return NextResponse.json(
      {
        success: true,
        message: "Stage configurations fetched successfully",
        count: formattedStages.length,
        data: formattedStages,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get stages error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch stage configurations",
      },
      { status: 500 }
    );
  }
}
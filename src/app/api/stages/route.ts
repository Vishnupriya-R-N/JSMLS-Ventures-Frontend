import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

export async function GET() {
  try {
    // 1. Fetch all stage configurations from PostgreSQL
    const stages = await prisma.stageConfiguration.findMany({
      orderBy: {
        stageNumber: "asc",
      },
    });

    // 2. Convert Prisma Decimal values into numbers
    const stageData = stages.map((stage) => ({
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

    // 3. Return successful response
    return NextResponse.json({
      success: true,
      message: "Stage configurations fetched successfully",
      count: stageData.length,
      data: stageData,
    });
  } catch (error) {
    // 4. Handle API errors
    console.error("Stage Configuration API error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to fetch stage configurations",
      },
      { status: 500 }
    );
  }
}
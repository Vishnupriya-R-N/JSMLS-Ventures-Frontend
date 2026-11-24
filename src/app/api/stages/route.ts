
import { NextResponse } from "next/server";
import { STAGE_CONFIGS, getStageByNumber } from "@/lib/stageConfig";
import { authenticate } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const authUser = authenticate(request);

    // Require an authenticated user
    if (!authUser) {
      return NextResponse.json(
        { success: false, message: "Please log in to view the stage calculator." }, { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const stageParam = searchParams.get("stage");

    if (stageParam) {
      const stageNum = parseInt(stageParam, 10);

      if (isNaN(stageNum) || stageNum < 1 || stageNum > 6) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid stage number. Must be between 1 and 6.",
          },
          { status: 400 }
        );
      }

      const stage = getStageByNumber(stageNum);

      if (!stage) {
        return NextResponse.json(
          {
            success: false,
            message: `Stage ${stageNum} configuration not found.`,
          },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        message: `Stage ${stageNum} configuration retrieved successfully`,
        stage,
        currentUser: {
          userId: authUser.userId,
          role: authUser.role,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "All 6 stage configurations retrieved successfully",
      stages: STAGE_CONFIGS,
      meta: {
        totalStages: 6,
        levelsPerStage: 3,
        positionsPerStage: 14,
        structure: [
          { level: 1, positions: 2 },
          { level: 2, positions: 4 },
          { level: 3, positions: 8 },
        ],
        disclaimer:
          "Demonstration platform. Illustrative interface only. No actual payment entitlement or income is represented.",
      },
      currentUser: {
        userId: authUser.userId,
        role: authUser.role,
      },
    });
  } catch (error) {
    console.error("Stage Configuration API error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to retrieve stage configurations",
      },
      { status: 500 }
    );
  }
}

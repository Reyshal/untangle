import { NextRequest, NextResponse } from "next/server";
import { breakdownService } from "@/lib/services/breakdown-service";
import { breakdownRequestSchema } from "@/lib/ai/schemas";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = breakdownRequestSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Invalid request payload", details: validated.error.flatten() },
        { status: 400 }
      );
    }

    const { text, language } = validated.data;
    const result = await breakdownService.processBrainDump(text, language);
    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to breakdown tasks from input";
    console.error("Error in /api/breakdown:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

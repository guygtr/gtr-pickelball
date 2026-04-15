import { NextResponse } from "next/server";
import { processSessionAiLevels } from "@/actions/ai-level";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const sessionId = url.searchParams.get("sessionId");
  
  if (!sessionId) {
    return NextResponse.json({ error: "Paramètre sessionId manquant" }, { status: 400 });
  }

  try {
    console.log(`[DEBUG] Forçage du recalcul AI pour session: ${sessionId}`);
    const result = await processSessionAiLevels(sessionId);
    console.log(`[DEBUG] Résultat:`, result);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[DEBUG] Erreur:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

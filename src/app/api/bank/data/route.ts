import { NextResponse } from "next/server";
import { fetchAccountData, isConfigured } from "@/lib/bank/gocardless";
import { demoAccountData } from "@/lib/bank/demo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Renvoie le solde courant et les transactions récentes d'un compte. */
export async function GET(req: Request) {
  const accountId = new URL(req.url).searchParams.get("accountId");
  if (!accountId) {
    return NextResponse.json({ error: "accountId requis" }, { status: 400 });
  }

  if (!isConfigured()) {
    return NextResponse.json({ demo: true, ...demoAccountData(accountId) });
  }

  try {
    const data = await fetchAccountData(accountId);
    return NextResponse.json({ demo: false, ...data });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Données du compte indisponibles" },
      { status: 502 },
    );
  }
}

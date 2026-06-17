import { NextResponse } from "next/server";
import { isConfigured, listRequisitionAccounts } from "@/lib/bank/gocardless";
import { demoAccounts } from "@/lib/bank/demo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Liste les comptes rattachés à une requisition après le consentement. */
export async function GET(req: Request) {
  const requisitionId = new URL(req.url).searchParams.get("requisitionId");
  if (!requisitionId) {
    return NextResponse.json({ error: "requisitionId requis" }, { status: 400 });
  }

  if (!isConfigured()) {
    return NextResponse.json({ demo: true, accounts: demoAccounts() });
  }

  try {
    const accounts = await listRequisitionAccounts(requisitionId);
    return NextResponse.json({ demo: false, accounts });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Comptes indisponibles" },
      { status: 502 },
    );
  }
}

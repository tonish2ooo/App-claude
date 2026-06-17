import { NextResponse } from "next/server";
import { createRequisition, isConfigured } from "@/lib/bank/gocardless";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Démarre une connexion bancaire : crée une requisition et renvoie le lien de consentement. */
export async function POST(req: Request) {
  let body: { institutionId?: string; redirectUrl?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide" }, { status: 400 });
  }

  const institutionId = body.institutionId;
  const redirectUrl = body.redirectUrl;
  if (!institutionId || !redirectUrl) {
    return NextResponse.json({ error: "institutionId et redirectUrl requis" }, { status: 400 });
  }

  const reference = `ref_${Math.random().toString(36).slice(2, 12)}`;

  // Mode démo tant qu'aucune clé n'est configurée : on simule le retour de consentement.
  if (!isConfigured()) {
    const sep = redirectUrl.includes("?") ? "&" : "?";
    return NextResponse.json({
      demo: true,
      requisitionId: `demo_${reference}`,
      link: `${redirectUrl}${sep}bank=callback&ref=${reference}`,
      reference,
    });
  }

  try {
    const { requisitionId, link } = await createRequisition(institutionId, redirectUrl, reference);
    return NextResponse.json({ demo: false, requisitionId, link, reference });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur de connexion à la banque" },
      { status: 502 },
    );
  }
}

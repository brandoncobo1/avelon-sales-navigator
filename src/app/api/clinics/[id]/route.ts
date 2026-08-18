import { NextRequest, NextResponse } from "next/server";
import { getClinicById } from "@/lib/clinics";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const clinic = await getClinicById(id);
  if (!clinic) return NextResponse.json({ error: "Clinic not found" }, { status: 404 });
  return NextResponse.json({ clinic });
}

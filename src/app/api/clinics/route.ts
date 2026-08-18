import { NextRequest, NextResponse } from "next/server";
import { createClinic, listClinics, type CreateClinicInput } from "@/lib/clinics";

export async function GET() {
  const clinics = await listClinics();
  return NextResponse.json({ clinics });
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as CreateClinicInput;
  if (!body.name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }
  const clinic = await createClinic(body);
  return NextResponse.json({ clinic }, { status: 201 });
}

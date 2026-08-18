import { prisma } from "@/lib/prisma";
import type { Clinic } from "@/lib/types";
import type { Clinic as ClinicRow } from "@prisma/client";

function toClinic(row: ClinicRow): Clinic {
  return {
    id: row.id,
    name: row.name,
    website: row.website,
    phone: row.phone,
    location: row.location,
    hasCustomAsset: row.hasCustomAsset,
    practiceNotes: row.practiceNotes,
    isDemo: row.isDemo,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function listClinics(): Promise<Clinic[]> {
  const rows = await prisma.clinic.findMany({ orderBy: { createdAt: "desc" } });
  return rows.map(toClinic);
}

export async function getClinicById(id: string): Promise<Clinic | null> {
  const row = await prisma.clinic.findUnique({ where: { id } });
  return row ? toClinic(row) : null;
}

export interface CreateClinicInput {
  name: string;
  website?: string | null;
  phone?: string | null;
  location?: string | null;
  hasCustomAsset?: boolean;
  practiceNotes?: string | null;
}

export async function createClinic(input: CreateClinicInput): Promise<Clinic> {
  const row = await prisma.clinic.create({
    data: {
      name: input.name,
      website: input.website ?? null,
      phone: input.phone ?? null,
      location: input.location ?? null,
      hasCustomAsset: input.hasCustomAsset ?? false,
      practiceNotes: input.practiceNotes ?? null,
    },
  });
  return toClinic(row);
}

export async function getOrCreateDemoClinic(): Promise<Clinic> {
  const existing = await prisma.clinic.findFirst({ where: { isDemo: true } });
  if (existing) return toClinic(existing);
  const row = await prisma.clinic.create({
    data: {
      name: "Demo Dental Clinic",
      website: "demodentalclinic.co.uk",
      phone: "+44 20 7946 0958",
      location: "London, UK",
      hasCustomAsset: true,
      practiceNotes: "Use this clinic to try the full receptionist tree end to end.",
      isDemo: true,
    },
  });
  return toClinic(row);
}

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createCall } from "@/lib/calls";
import { createClinic, getOrCreateDemoClinic } from "@/lib/clinics";
import { seedConversationTree } from "@/lib/seed-runner";

export async function startCallAction(clinicId: string) {
  const call = await createCall(clinicId, "root");
  redirect(`/call/${call.id}`);
}

export async function startDemoCallAction() {
  const clinic = await getOrCreateDemoClinic();
  const call = await createCall(clinic.id, "root");
  redirect(`/call/${call.id}`);
}

export async function createClinicAndStartCallAction(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Clinic name is required");

  const clinic = await createClinic({
    name,
    website: String(formData.get("website") ?? "").trim() || null,
    phone: String(formData.get("phone") ?? "").trim() || null,
    location: String(formData.get("location") ?? "").trim() || null,
    hasCustomAsset: formData.get("hasCustomAsset") === "on",
    practiceNotes: String(formData.get("practiceNotes") ?? "").trim() || null,
  });

  const call = await createCall(clinic.id, "root");
  redirect(`/call/${call.id}`);
}

export async function resetConversationScriptAction() {
  await seedConversationTree();
  revalidatePath("/builder");
  revalidatePath("/");
}

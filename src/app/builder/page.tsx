import { getAllBranches } from "@/lib/branches";
import { BuilderClient } from "@/components/builder/builder-client";

export const dynamic = "force-dynamic";

export default async function BuilderPage({
  searchParams,
}: {
  searchParams: Promise<{ branch?: string }>;
}) {
  const [branches, params] = await Promise.all([getAllBranches(), searchParams]);
  return <BuilderClient initialBranches={branches} initialSelectedId={params.branch ?? null} />;
}

import { getAllBranches } from "@/lib/branches";
import { BuilderClient } from "@/components/builder/builder-client";

export const dynamic = "force-dynamic";

export default async function BuilderPage() {
  const branches = await getAllBranches();
  return <BuilderClient initialBranches={branches} />;
}

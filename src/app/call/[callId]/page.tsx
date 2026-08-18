import { notFound } from "next/navigation";
import { getCall } from "@/lib/calls";
import { getAllBranches } from "@/lib/branches";
import { CallNavigatorClient } from "@/components/navigator/call-navigator-client";

export default async function CallNavigatorPage({
  params,
}: {
  params: Promise<{ callId: string }>;
}) {
  const { callId } = await params;
  const [call, branches] = await Promise.all([getCall(callId), getAllBranches()]);

  if (!call) notFound();

  return <CallNavigatorClient call={call} branches={branches} />;
}

import { NextRequest, NextResponse } from "next/server";
import { addNote } from "@/lib/calls";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const body = (await request.json()) as { text?: string };
  if (!body.text?.trim()) {
    return NextResponse.json({ error: "text is required" }, { status: 400 });
  }
  const note = await addNote(id, body.text.trim());
  return NextResponse.json({ note }, { status: 201 });
}

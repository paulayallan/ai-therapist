import { NextResponse } from "next/server";
import { getOpenAIClient } from "@/lib/openai";

export async function POST(request: Request) {
  const client = getOpenAIClient();
  if (!client) {
    return NextResponse.json({ error: "OpenAI is not configured." }, { status: 400 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Audio file is required." }, { status: 400 });
  }

  const transcription = await client.audio.transcriptions.create({
    file,
    model: "gpt-4o-mini-transcribe"
  });

  return NextResponse.json({ text: transcription.text });
}

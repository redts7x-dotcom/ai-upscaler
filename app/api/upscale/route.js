export const runtime = 'edge'; // ضروري جداً لتجنب انقطاع الاتصال في Vercel
import { NextResponse } from "next/server";
import Replicate from "replicate";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

export async function POST(req) {
  try {
    const formData = await req.formData();
    const image = formData.get("image");
    const scale = parseInt(formData.get("scale")) || 2;

    if (!image) return NextResponse.json({ error: "No image provided" }, { status: 400 });

    const bytes = await image.arrayBuffer();
    const base64Image = `data:${image.type};base64,${Buffer.from(bytes).toString("base64")}`;

    const output = await replicate.run(
      "daanelson/real-esrgan-a100:334f6812837330a6157f3630733a25b2d5f81005110d7a96dbf20c4e704040a4",
      { input: { image: base64Image, upscale: scale } }
    );

    return NextResponse.json({ result: output });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
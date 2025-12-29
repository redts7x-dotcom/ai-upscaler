export const runtime = 'edge';
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const formData = await req.formData();
    const image = formData.get("image");
    const scale = parseInt(formData.get("scale")) || 2;

    if (!image) return NextResponse.json({ error: "لم يتم اختيار صورة" }, { status: 400 });

    const arrayBuffer = await image.arrayBuffer();
    const base64String = Buffer.from(arrayBuffer).toString('base64');
    const dataUrl = `data:${image.type};base64,${base64String}`;

    // بدء عملية التحسين
    const startResponse = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        "Authorization": `Token ${process.env.REPLICATE_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        version: "42fed1c497414110d21ff5962f01560397f196acbea31cf40e313f2c37f1938d",
        input: { image: dataUrl, upscale: scale, face_enhance: true },
      }),
    });

    let prediction = await startResponse.json();
    if (!startResponse.ok) return NextResponse.json({ error: prediction.detail || "فشل في تشغيل المحرك" }, { status: startResponse.status });

    // انتظار النتيجة (Polling)
    let attempts = 0;
    while (prediction.status !== "succeeded" && prediction.status !== "failed" && attempts < 30) {
      await new Promise(r => setTimeout(r, 2000));
      const res = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
        headers: { "Authorization": `Token ${process.env.REPLICATE_API_TOKEN}` },
      });
      prediction = await res.json();
      attempts++;
    }

    if (prediction.status === "succeeded") {
      return NextResponse.json({ result: prediction.output });
    } else {
      return NextResponse.json({ error: "فشلت المعالجة، حاول مرة أخرى" }, { status: 500 });
    }
  } catch (err) {
    return NextResponse.json({ error: "خطأ فني: " + err.message }, { status: 500 });
  }
}
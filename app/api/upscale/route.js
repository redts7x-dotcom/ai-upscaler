export const runtime = 'edge';
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const formData = await req.formData();
    const image = formData.get("image");
    const scale = parseInt(formData.get("scale")) || 2;

    if (!image) return NextResponse.json({ error: "لم يتم اختيار صورة" }, { status: 400 });

    // تحويل الصورة بطريقة تتوافق مع نظام Vercel Edge
    const arrayBuffer = await image.arrayBuffer();
    const base64String = Buffer.from(arrayBuffer).toString('base64');
    const dataUrl = `data:${image.type};base64,${base64String}`;

    // إرسال الطلب لمحرك الذكاء الاصطناعي
    const response = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        "Authorization": `Token ${process.env.REPLICATE_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        // نسخة الموديل Real-ESRGAN
        version: "334f6812837330a6157f3630733a25b2d5f81005110d7a96dbf20c4e704040a4",
        input: { image: dataUrl, upscale: scale },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json({ error: errorData.detail || "فشل الاتصال بـ Replicate" }, { status: response.status });
    }

    const prediction = await response.json();
    
    // الانتظار الذكي للنتيجة
    let result = prediction;
    let attempts = 0;
    while (result.status !== "succeeded" && result.status !== "failed" && attempts < 30) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      const res = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
        headers: { "Authorization": `Token ${process.env.REPLICATE_API_TOKEN}` },
      });
      result = await res.json();
      attempts++;
    }

    if (result.status === "succeeded") {
      return NextResponse.json({ result: result.output });
    } else {
      return NextResponse.json({ error: "فشلت عملية المعالجة" }, { status: 500 });
    }

  } catch (error) {
    return NextResponse.json({ error: "خطأ تقني في السيرفر" }, { status: 500 });
  }
}
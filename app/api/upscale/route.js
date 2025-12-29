export const runtime = 'edge';
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    // التحقق من نوع الطلب: هل هو رفع صورة أم فحص حالة؟
    const contentType = req.headers.get("content-type") || "";

    // --- الحالة 1: فحص حالة المعالجة (Polling) ---
    if (contentType.includes("application/json")) {
      const body = await req.json();
      const { checkId } = body;
      
      const response = await fetch(`https://api.replicate.com/v1/predictions/${checkId}`, {
        headers: { "Authorization": `Token ${process.env.REPLICATE_API_TOKEN}` },
      });
      
      const data = await response.json();
      return NextResponse.json(data);
    }

    // --- الحالة 2: بدء معالجة جديدة (Upload) ---
    const formData = await req.formData();
    const image = formData.get("image");
    const scale = parseInt(formData.get("scale")) || 2;

    if (!image) return NextResponse.json({ error: "No image found" }, { status: 400 });

    const arrayBuffer = await image.arrayBuffer();
    const base64String = Buffer.from(arrayBuffer).toString('base64');
    const dataUrl = `data:${image.type};base64,${base64String}`;

    // إرسال الطلب لـ Replicate (بدون انتظار النتيجة النهائية)
    const response = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        "Authorization": `Token ${process.env.REPLICATE_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        // إصدار A100 المعتمد
        version: "f94d7ed4a1f7e1ffed0d51e4089e4911609d5eeee5e874ef323d2c7562624bed",
        input: { image: dataUrl, scale: scale, face_enhance: true },
      }),
    });

    const prediction = await response.json();
    
    if (prediction.error) return NextResponse.json({ error: prediction.error }, { status: 500 });
    
    // نرجع المعرف (ID) فوراً للمتصفح ليقوم هو بالمتابعة
    return NextResponse.json({ id: prediction.id, status: prediction.status });

  } catch (err) {
    return NextResponse.json({ error: "Server Error: " + err.message }, { status: 500 });
  }
}
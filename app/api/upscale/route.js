export const runtime = 'edge'; // لضمان عدم انقطاع الاتصال
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const formData = await req.formData();
    const image = formData.get("image");
    const scale = parseInt(formData.get("scale")) || 2;

    if (!image) return NextResponse.json({ error: "لم يتم اختيار صورة" }, { status: 400 });

    // تحويل الصورة
    const arrayBuffer = await image.arrayBuffer();
    const base64String = Buffer.from(arrayBuffer).toString('base64');
    const dataUrl = `data:${image.type};base64,${base64String}`;

    // إرسال الطلب للموديل الذي وجدته في Replicate (daanelson/real-esrgan-a100)
    const response = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        "Authorization": `Token ${process.env.REPLICATE_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        // هذا هو رمز الإصدار الموجود في صورتك
        version: "f94d7ed4a1f7e1ffed0d51e4089e4911609d5eeee5e874ef323d2c7562624bed",
        input: { 
          image: dataUrl, 
          scale: scale, // تم التعديل بناءً على مدخلات الموديل
          face_enhance: true 
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json({ error: errorData.detail || "مشكلة في المفتاح أو الرصيد" }, { status: response.status });
    }

    let prediction = await response.json();
    
    // انتظار النتيجة
    let attempts = 0;
    while (prediction.status !== "succeeded" && prediction.status !== "failed" && attempts < 60) {
      await new Promise(r => setTimeout(r, 1000));
      const res = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
        headers: { "Authorization": `Token ${process.env.REPLICATE_API_TOKEN}` },
      });
      prediction = await res.json();
      attempts++;
    }

    if (prediction.status === "succeeded") {
      return NextResponse.json({ result: prediction.output });
    } else {
      return NextResponse.json({ error: "فشلت المعالجة" }, { status: 500 });
    }
  } catch (err) {
    return NextResponse.json({ error: "خطأ فني: " + err.message }, { status: 500 });
  }
}
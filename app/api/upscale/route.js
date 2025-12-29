export const runtime = 'edge'; // أقصى سرعة
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    // التحقق هل الطلب هو "فحص حالة" أم "رفع جديد"؟
    // إذا كان JSON فهذا يعني أننا نفحص الحالة
    const contentType = req.headers.get("content-type") || "";
    
    if (contentType.includes("application/json")) {
      const body = await req.json();
      const { checkId } = body;
      
      // نسأل Replicate: ايش صار على الطلب رقم checkId؟
      const response = await fetch(`https://api.replicate.com/v1/predictions/${checkId}`, {
        headers: { "Authorization": `Token ${process.env.REPLICATE_API_TOKEN}` },
      });
      
      const data = await response.json();
      return NextResponse.json(data);
    }

    // --- إذا وصلنا هنا، معناه هذا "رفع جديد" ---
    const formData = await req.formData();
    const image = formData.get("image");
    const scale = parseInt(formData.get("scale")) || 2;

    if (!image) return NextResponse.json({ error: "No image provided" }, { status: 400 });

    const arrayBuffer = await image.arrayBuffer();
    const base64String = Buffer.from(arrayBuffer).toString('base64');
    const dataUrl = `data:${image.type};base64,${base64String}`;

    // نرسل الصورة لـ Replicate ونقول له "ابدأ الشغل"
    // استخدمنا الموديل الذي ظهر في صورتك A100
    const response = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        "Authorization": `Token ${process.env.REPLICATE_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        version: "f94d7ed4a1f7e1ffed0d51e4089e4911609d5eeee5e874ef323d2c7562624bed",
        input: { 
          image: dataUrl, 
          scale: scale, 
          face_enhance: true 
        },
      }),
    });

    const prediction = await response.json();

    if (prediction.error) {
      return NextResponse.json({ error: prediction.error }, { status: 500 });
    }

    // هنا السر: لا ننتظر النتيجة! نرجع الـ ID فوراً للمتصفح ليتابع هو بنفسه
    return NextResponse.json({ id: prediction.id, status: "started" });

  } catch (err) {
    return NextResponse.json({ error: "Server Error: " + err.message }, { status: 500 });
  }
}
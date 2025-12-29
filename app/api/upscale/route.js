import { NextResponse } from 'next/server';
import Replicate from "replicate";

export async function POST(request) {
  try {
    // 1. استخراج الصورة
    let image;
    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("image");
      if (!file) return NextResponse.json({ error: "لا يوجد ملف" }, { status: 400 });
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      image = `data:${file.type};base64,${buffer.toString('base64')}`;
    } else {
      const body = await request.json();
      image = body.image;
    }

    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN,
    });

    console.log("جاري التكبير باستخدام المودل الجديد (A100)...");

    // 2. استخدام مودل daanelson/real-esrgan-a100
    // ... بداية الكود ...

// تشغيل الموديل الجديد (A100) الذي اخترته
const output = await replicate.run(
  "daanelson/real-esrgan-a100:f94d7ed4a1f7e1ffed0d51e4089e4911609d5eeee5e874ef323d2c7562624bed",
  {
    input: {
      image: image,      // الصورة التي رفعها المستخدم
      scale: 4,          // درجة التكبير (يمكنك تغييرها)
      face_enhance: true // تفعيل تحسين الوجوه
    }
  }
);

// ... تكملة الكود ...

    return NextResponse.json({ result: output });

  } catch (error) {
    console.error("خطأ:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
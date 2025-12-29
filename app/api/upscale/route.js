import { NextResponse } from 'next/server';
import Replicate from "replicate";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("image");

    if (!file) {
      return NextResponse.json({ error: "لم يتم رفع صورة" }, { status: 400 });
    }

    // تحويل الصورة
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const imageBase64 = `data:${file.type};base64,${buffer.toString('base64')}`;

    console.log("جاري التكبير بمقياس 6...");

    // تشغيل الموديل
    let output = await replicate.run(
      "daanelson/real-esrgan-a100:f94d7ed4a1f7e1ffed0d51e4089e4911609d5eeee5e874ef323d2c7562624bed",
      {
        input: {
          image: imageBase64,
          scale: 6,           // <--- تم التعديل من 8 إلى 6
          face_enhance: true,
          tile: 0,
        }
      }
    );

    // استخراج الرابط الصحيح (لتجنب مشكلة object)
    if (Array.isArray(output)) {
      output = output[0];
    }
    const finalResult = String(output);

    return NextResponse.json({ result: finalResult });

  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
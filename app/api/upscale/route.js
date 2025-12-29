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

    // --- هذا هو الجزء الذي كان ناقصاً ---
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const imageBase64 = `data:${file.type};base64,${buffer.toString('base64')}`;
    // ------------------------------------

    console.log("جاري التكبير باستخدام A100...");

    const output = await replicate.run(
      "daanelson/real-esrgan-a100:f94d7ed4a1f7e1ffed0d51e4089e4911609d5eeee5e874ef323d2c7562624bed",
      {
        input: {
          image: imageBase64, // الآن سيعمل هذا المتغير لأنه معرف في الأعلى
          scale: 8,           // جودة عالية
          face_enhance: true,
          tile: 0,
        }
      }
    );

    return NextResponse.json({ result: output });

  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
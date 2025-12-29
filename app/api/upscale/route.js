export const runtime = 'edge';

export async function POST(req) {
  try {
    const formData = await req.formData();
    const image = formData.get("image");
    const scale = parseInt(formData.get("scale")) || 2;

    if (!image) return new Response(JSON.stringify({ error: "لم يتم استلام صورة" }), { status: 400 });

    const arrayBuffer = await image.arrayBuffer();
    const base64String = btoa(new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), ""));
    const dataUrl = `data:${image.type};base64,${base64String}`;

    // طلب إنشاء التوقع (Prediction) من Replicate مباشرة
    const startResponse = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        "Authorization": `Token ${process.env.REPLICATE_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        // نسخة NightmareAI المستقرة جداً
        version: "42fed1c497414110d21ff5962f01560397f196acbea31cf40e313f2c37f1938d",
        input: { image: dataUrl, upscale: scale, face_enhance: true },
      }),
    });

    const prediction = await startResponse.json();

    if (!startResponse.ok) {
      return new Response(JSON.stringify({ error: `Replicate Error: ${prediction.detail || 'رفض الطلب'}` }), { status: startResponse.status });
    }

    // مراقبة النتيجة
    let result = prediction;
    let attempts = 0;
    while (result.status !== "succeeded" && result.status !== "failed" && attempts < 40) {
      await new Promise(r => setTimeout(r, 2000));
      const pollResponse = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
        headers: { "Authorization": `Token ${process.env.REPLICATE_API_TOKEN}` },
      });
      result = await pollResponse.json();
      attempts++;
    }

    if (result.status === "succeeded") {
      return new Response(JSON.stringify({ result: result.output }), { status: 200 });
    } else {
      return new Response(JSON.stringify({ error: `فشلت المعالجة: ${result.error || 'خطأ مجهول'}` }), { status: 500 });
    }

  } catch (err) {
    return new Response(JSON.stringify({ error: `Server Crash: ${err.message}` }), { status: 500 });
  }
}
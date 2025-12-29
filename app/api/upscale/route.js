export const runtime = 'edge'; // لتجنب انقطاع الاتصال في Vercel

export async function POST(req) {
  try {
    const formData = await req.formData();
    const image = formData.get("image");
    const scale = parseInt(formData.get("scale")) || 2;

    if (!image) return new Response(JSON.stringify({ error: "لم يتم اختيار صورة" }), { status: 400 });

    const arrayBuffer = await image.arrayBuffer();
    const base64String = btoa(new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), ""));
    const dataUrl = `data:${image.type};base64,${base64String}`;

    const response = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        "Authorization": `Token ${process.env.REPLICATE_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        // هذا الإصدار مستقر ويعمل مع جميع الحسابات
        version: "42fed1c497414110d21ff5962f01560397f196acbea31cf40e313f2c37f1938d",
        input: { image: dataUrl, upscale: scale, face_enhance: true },
      }),
    });

    const prediction = await response.json();
    if (!response.ok) return new Response(JSON.stringify({ error: prediction.detail }), { status: response.status });

    // انتظار النتيجة
    let result = prediction;
    let attempts = 0;
    while (result.status !== "succeeded" && result.status !== "failed" && attempts < 40) {
      await new Promise(r => setTimeout(r, 2000));
      const res = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
        headers: { "Authorization": `Token ${process.env.REPLICATE_API_TOKEN}` },
      });
      result = await res.json();
      attempts++;
    }

    return new Response(JSON.stringify({ result: result.output }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
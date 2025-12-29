"use client";
import React, { useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";

export default function Home() {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null); // حالة جديدة لمعاينة الصورة
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false); // حالة لزر التحميل
  const [scale, setScale] = useState(2);

  // --- إدارة معاينة الصورة ---
  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    // إنشاء رابط مؤقت للصورة المختارة لعرضها
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    // تنظيف الرابط عند تغيير الصورة لتجنب امتلاء الذاكرة
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  // --- دالة التحميل المباشر (بضغطة زر) ---
  const forceDownload = async (url) => {
    setDownloading(true);
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      // اسم افتراضي للملف المحمل
      link.download = `OBAD-Enhanced-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (e) {
      alert("حدث خطأ أثناء محاولة التحميل");
    } finally {
      setDownloading(false);
    }
  };

  const handleUpscale = async () => {
    if (!file) return;
    // فحص الحجم مرة أخرى للتذكير
    if (file.size > 4.5 * 1024 * 1024) {
      alert("⚠️ حجم الصورة كبير جداً لاستضافة Vercel المجانية. يرجى اختيار صورة أقل من 4.5 ميجابايت.");
      return;
    }

    setLoading(true); setResult(null);
    const formData = new FormData();
    formData.append("image", file);
    formData.append("scale", scale);

    try {
      const res = await fetch('/api/upscale', { method: 'POST', body: formData });
      const text = await res.text();
      try {
        const data = JSON.parse(text);
        if (!res.ok) throw new Error(data.error || "رفض السيرفر الطلب");
        if (data.result) setResult(data.result);
        else throw new Error("لم تصل النتيجة");
      } catch (jsonError) {
        console.error("Server Error Error:", text);
        if (text.includes("Too Large")) throw new Error("حجم الملف تجاوز الحد المسموح");
        else throw new Error("خطأ في الاتصال بالسيرفر");
      }
    } catch (e) { alert("تنبيه: " + e.message); } 
    finally { setLoading(false); }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (f) => { setFile(f[0]); setResult(null); },
    accept: { 'image/*': [] }, multiple: false
  });

  // أنماط الحركة للخلفية
  const ambientVariant = {
    moving: {
      x: [0, 100, -100, 0],
      y: [0, -100, 100, 0],
      scale: [1, 1.2, 0.8, 1],
      rotate: [0, 180, -180, 0],
      transition: { duration: 20, repeat: Infinity, ease: "linear" }
    },
    stopped: { x: 0, y: 0, scale: 1, rotate: 0, transition: { duration: 2 } }
  };

  return (
    <main dir="rtl" style={{ 
      minHeight: '100vh', backgroundColor: '#000', color: '#fff', position: 'relative', overflow: 'hidden',
      fontFamily: 'system-ui, sans-serif' 
    }}>
      
      {/* --- خلفية الإضاءة المتحركة (Ambient Background) --- */}
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0, pointerEvents: 'none' }}>
        {/* كرة ضوء زرقاء */}
        <motion.div 
          variants={ambientVariant}
          animate={loading ? "moving" : "stopped"}
          style={{ 
            position: 'absolute', top: '20%', left: '20%', width: '40vw', height: '40vw',
            backgroundColor: 'rgba(0, 123, 255, 0.3)', filter: 'blur(150px)', borderRadius: '50%', opacity: 0.6 
        }} />
        {/* كرة ضوء بنفسجية */}
        <motion.div 
          variants={ambientVariant}
          animate={loading ? "moving" : "stopped"}
          style={{ 
            position: 'absolute', bottom: '20%', right: '20%', width: '50vw', height: '50vw',
            backgroundColor: 'rgba(120, 50, 255, 0.3)', filter: 'blur(180px)', borderRadius: '50%', opacity: 0.5 
        }} />
      </div>

      {/* Navbar الزجاجي */}
      <nav style={{ 
        display: 'flex', justifyContent: 'space-between', padding: '0 40px', height: '70px', alignItems: 'center',
        backdropFilter: 'blur(30px)', backgroundColor: 'rgba(255,255,255,0.02)',
        borderBottom: '1px solid rgba(255,255,255,0.1)', position: 'sticky', top: 0, zIndex: 100
      }}>
        <div style={{ fontSize: '1.6rem', fontWeight: '900', color: '#fff' }}>OBAD</div>
        <div>
          <SignedOut><SignInButton mode="modal"><button style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', padding: '8px 25px', borderRadius: '40px', border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer' }}>دخول</button></SignInButton></SignedOut>
          <SignedIn><UserButton afterSignOutUrl="/" /></SignedIn>
        </div>
      </nav>

      <div style={{ position: 'relative', zIndex: 10, maxWidth: '1200px', margin: '0 auto', padding: '60px 20px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '4.5rem', fontWeight: '900', marginBottom: '15px', background: 'linear-gradient(to bottom, #fff, #999)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>سحر التحسين A100.</h1>
        <p style={{ color: '#a1a1a6', fontSize: '1.3rem', marginBottom: '40px' }}>ارفع جودة صورك باستخدام أقوى موديل متاح (تذكر استخدام صور صغيرة الحجم للنسخة المجانية).</p>

        {/* أزرار الجودة */}
        <div style={{ display: 'inline-flex', background: 'rgba(255,255,255,0.05)', padding: '5px', borderRadius: '16px', marginBottom: '40px', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}>
          {[ {l:'HD (2x)', v:2}, {l:'4K (4x)', v:4}, {l:'8K (8x)', v:8} ].map(q => (
            <button key={q.v} onClick={() => setScale(q.v)} style={{ padding: '10px 35px', borderRadius: '12px', border: 'none', color: scale === q.v ? '#000' : '#fff', background: scale === q.v ? '#fff' : 'transparent', cursor: 'pointer', fontWeight: '700', transition: '0.4s' }}>{q.l}</button>
          ))}
        </div>

        {/* --- حاوية المحتوى الرئيسية (جنباً إلى جنب) --- */}
        <div style={{ 
          display: 'flex', 
          flexWrap: 'wrap', // للعمل على الجوال
          justifyContent: 'center', 
          alignItems: 'start', // محاذاة للأعلى
          gap: '30px',
          marginTop: '20px'
        }}>

          {/* --- القسم الأيمن: صندوق الإدخال والزر --- */}
          <div style={{ flex: '1 1 500px', maxWidth: '600px' }}>
            <div {...getRootProps()} style={{ 
              border: `1px solid ${isDragActive ? '#fff' : 'rgba(255,255,255,0.1)'}`, 
              borderRadius: '40px', backgroundColor: 'rgba(255,255,255,0.03)', 
              backdropFilter: 'blur(25px)', cursor: 'pointer',
              height: '400px', // ارتفاع ثابت للصندوق
              display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
              overflow: 'hidden', position: 'relative'
            }}>
              <input {...getInputProps()} />
              {previewUrl ? (
                // عرض الصورة المختارة داخل الصندوق
                <img src={previewUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '20px' }} />
              ) : (
                // عرض الأيقونة والنص إذا لم يتم اختيار صورة
                <>
                  <div style={{ fontSize: '60px', marginBottom: '20px' }}>✨</div>
                  <p style={{ fontSize: '1.2rem', color: '#a1a1a6' }}>اسحب الصورة هنا أو اضغط للاختيار</p>
                </>
              )}
            </div>

            {file && !loading && !result && (
              <button onClick={handleUpscale} style={{ marginTop: '30px', width: '100%', backgroundColor: '#fff', color: '#000', padding: '18px 0', borderRadius: '40px', border: 'none', cursor: 'pointer', fontWeight: '800', fontSize: '1.1rem' }}>بدأ التحسين الآن</button>
            )}
            {loading && <p style={{ marginTop: '30px', color: '#fff', fontSize: '1.1rem' }}>جاري المعالجة والإضاءة تتحرك... ⏳</p>}
          </div>

          {/* --- القسم الأيسر: النتيجة (يظهر بجانب الإدخال) --- */}
          <AnimatePresence>
            {result && (
              <motion.div 
                initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ type: "spring", stiffness: 100 }}
                style={{ flex: '1 1 500px', maxWidth: '600px' }}
              >
                <div style={{ 
                  background: 'rgba(255,255,255,0.03)', padding: '20px', 
                  borderRadius: '40px', border: '1px solid rgba(255,255,255,0.1)', 
                  backdropFilter: 'blur(20px)', height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <img src={result} style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: '25px', objectFit: 'contain' }} alt="Result" />
                </div>
                {/* زر التحميل الجديد */}
                <button 
                  onClick={() => forceDownload(result)} 
                  disabled={downloading}
                  style={{ 
                    marginTop: '30px', width: '100%', backgroundColor: '#2997ff', color: '#fff', 
                    padding: '18px 0', borderRadius: '40px', border: 'none', 
                    cursor: downloading ? 'not-allowed' : 'pointer', fontWeight: '800', fontSize: '1.1rem',
                    opacity: downloading ? 0.7 : 1
                  }}>
                  {downloading ? 'جاري التحميل...' : 'تحميل النتيجة النهائية'}
                </button>
              </motion.div>
            )}
          </AnimatePresence>

        </div> {/* نهاية حاوية المحتوى */}
      </div>
    </main>
  );
}
"use client";
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence, useMotionValue } from 'framer-motion';
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";

// --- استيراد الخطوط ---
const fontImport = (
  <style jsx global>{`
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;700;900&display=swap');
    body { font-family: 'Cairo', sans-serif !important; background-color: #050505; }
    /* استعادة مؤشر الماوس الطبيعي */
    * { cursor: auto !important; }
    button { cursor: pointer !important; }
    .slider-handle { cursor: ew-resize !important; }
  `}</style>
);

// --- مكون المقارنة (Clip-Path) ---
const BeforeAfterComparison = ({ before, after }) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const containerRef = useRef(null);
  const isDragging = useRef(false);

  const handleMove = useCallback((clientX) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const newValue = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(newValue);
  }, []);

  useEffect(() => {
    const onMouseUp = () => isDragging.current = false;
    const onMouseMove = (e) => { if (isDragging.current) handleMove(e.clientX); };
    const onTouchEnd = () => isDragging.current = false;
    const onTouchMove = (e) => { if (isDragging.current) handleMove(e.touches[0].clientX); };

    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('touchend', onTouchEnd);
    window.addEventListener('touchmove', onTouchMove);

    return () => {
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('touchmove', onTouchMove);
    };
  }, [handleMove]);

  return (
    <div ref={containerRef} 
         onMouseDown={(e) => { isDragging.current = true; handleMove(e.clientX); }}
         onTouchStart={(e) => { isDragging.current = true; handleMove(e.touches[0].clientX); }}
         style={{ 
           position: 'relative', width: '100%', height: '500px', borderRadius: '30px', overflow: 'hidden', 
           background: '#000', border: '1px solid rgba(255,255,255,0.1)', userSelect: 'none'
         }}>
      
      {/* الصورة المحسنة (الخلفية) */}
      <img src={after} alt="After" style={{ position: 'absolute', top:0, left:0, width: '100%', height: '100%', objectFit: 'contain' }} />
      <div style={{ position: 'absolute', top: '20px', left: '20px', padding: '6px 16px', borderRadius: '20px', background: 'rgba(0,0,0,0.7)', color: '#fff', fontSize: '0.9rem', fontWeight: 'bold', pointerEvents: 'none' }}>بعد</div>

      {/* الصورة الأصلية (المقصوصة) */}
      <div style={{ 
        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', 
        clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` 
      }}>
        <img src={before} alt="Before" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        <div style={{ position: 'absolute', top: '20px', right: '20px', padding: '6px 16px', borderRadius: '20px', background: 'rgba(0,0,0,0.7)', color: '#fff', fontSize: '0.9rem', fontWeight: 'bold', pointerEvents: 'none' }}>قبل</div>
      </div>

      {/* الخط والمقبض */}
      <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${sliderPosition}%`, width: '2px', background: 'rgba(255,255,255,0.9)', cursor: 'ew-resize' }}>
        <div className="slider-handle" style={{ 
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', 
          width: '44px', height: '44px', background: '#fff', borderRadius: '50%', 
          display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.4)'
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
        </div>
      </div>
    </div>
  );
};

export default function Home() {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [scale, setScale] = useState(2);
  const [dominantColor, setDominantColor] = useState('rgba(41, 151, 255, 0.15)');

  // --- إضاءة احترافية (Spotlight) بدون تأخير ---
  const mouseX = useMotionValue(-500); // إخفاء الإضاءة في البداية
  const mouseY = useMotionValue(-500);

  useEffect(() => {
    const handleMouseMove = (e) => {
      // تحريك الإضاءة فورياً (بدون Spring) لتبدو طبيعية
      mouseX.set(e.clientX - 400); // 400 = نصف عرض الإضاءة (800px / 2)
      mouseY.set(e.clientY - 400);
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  // --- ضغط الصور القسري (النسخة الصارمة) ---
  const compressImage = async (imageFile) => {
    // الحد الصارم لـ Vercel (نترك هامش أمان كبير: 3.5MB)
    const MAX_SIZE_MB = 3.5;
    const MAX_BYTES = MAX_SIZE_MB * 1024 * 1024;
    
    // إذا الصورة أصلاً صغيرة، إرجاعها فوراً
    if (imageFile.size < MAX_BYTES) return imageFile;

    console.log(`Original Size: ${(imageFile.size / 1024 / 1024).toFixed(2)} MB - Starting Compression...`);

    let currentFile = imageFile;
    let quality = 0.9;
    let widthRatio = 1.0;
    
    // محددات للتوقف لتجنب الحلقة اللانهائية
    let attempts = 0;
    const maxAttempts = 10;

    while (currentFile.size > MAX_BYTES && attempts < maxAttempts) {
      currentFile = await new Promise((resolve) => {
        const img = new Image();
        img.src = URL.createObjectURL(imageFile); // دائماً نرجع للأصل للحفاظ على الجودة
        img.onload = () => {
          const canvas = document.createElement('canvas');
          
          // تقليل الأبعاد بنسبة مئوية
          let newWidth = img.width * widthRatio;
          let newHeight = img.height * widthRatio;

          // التأكد أن الأبعاد لا تتجاوز حداً أقصى معقولاً (مثلاً 2500px)
          const MAX_DIMENSION = 2500;
          if (newWidth > MAX_DIMENSION || newHeight > MAX_DIMENSION) {
             const ratio = Math.min(MAX_DIMENSION / newWidth, MAX_DIMENSION / newHeight);
             newWidth *= ratio;
             newHeight *= ratio;
             // تحديث نسبة العرض للمحاولات القادمة
             widthRatio = newWidth / img.width; 
          }

          canvas.width = newWidth;
          canvas.height = newHeight;
          
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, newWidth, newHeight);
          
          canvas.toBlob((blob) => {
            if (blob) {
              resolve(new File([blob], imageFile.name, { type: 'image/jpeg' }));
            } else {
              resolve(currentFile); // فشل التحويل
            }
          }, 'image/jpeg', quality);
        };
      });

      console.log(`Attempt ${attempts + 1}: ${(currentFile.size / 1024 / 1024).toFixed(2)} MB (Q:${quality.toFixed(1)}, Scale:${widthRatio.toFixed(2)})`);

      if (currentFile.size > MAX_BYTES) {
        quality -= 0.15; // تقليل الجودة بقوة أكبر
        widthRatio -= 0.15; // تصغير الأبعاد بقوة أكبر
        attempts++;
      }
    }
    
    return currentFile;
  };

  useEffect(() => {
    if (!previewUrl) return;
    const img = new Image(); img.crossOrigin = "Anonymous"; img.src = previewUrl;
    img.onload = () => {
      const canvas = document.createElement('canvas'); const ctx = canvas.getContext('2d');
      canvas.width = 1; canvas.height = 1; ctx.drawImage(img, 0, 0, 1, 1);
      const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
      // جعل اللون خافتاً جداً ليكون أنيقاً
      setDominantColor(`rgba(${r}, ${g}, ${b}, 0.12)`);
    };
  }, [previewUrl]);

  useEffect(() => {
    if (!file) { setPreviewUrl(null); return; }
    const objectUrl = URL.createObjectURL(file); setPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  const forceDownload = async (url) => {
    setDownloading(true);
    try {
      const response = await fetch(url); const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob); const link = document.createElement('a');
      link.href = blobUrl; link.download = `OBAD-Enhanced-${Date.now()}.png`;
      document.body.appendChild(link); link.click(); document.body.removeChild(link); window.URL.revokeObjectURL(blobUrl);
    } catch (e) { alert("فشل التحميل التلقائي"); } finally { setDownloading(false); }
  };

  const handleUpscale = async () => {
    if (!file) return;
    setLoading(true);
    try {
      // ضغط الصورة مهما كان حجمها
      const processedFile = await compressImage(file);
      
      const formData = new FormData(); 
      formData.append("image", processedFile); 
      formData.append("scale", scale);
      
      const res = await fetch('/api/upscale', { method: 'POST', body: formData });
      const text = await res.text();
      try {
        const data = JSON.parse(text);
        if (!res.ok) throw new Error(data.error || "خطأ في السيرفر");
        if (data.result) setResult(data.result); else throw new Error("لم تصل النتيجة");
      } catch (jsonError) {
        if (text.includes("Too Large")) throw new Error("فشل الضغط، الصورة معقدة جداً"); else throw new Error("فشل الاتصال");
      }
    } catch (e) { alert(e.message); } finally { setLoading(false); }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (f) => { setFile(f[0]); setResult(null); },
    accept: { 'image/*': [] }, multiple: false
  });

  return (
    <main dir="rtl" style={{ minHeight: '100vh', backgroundColor: '#050505', color: '#fff', position: 'relative', overflowX: 'hidden' }}>
      {fontImport}
      
      {/* إضاءة احترافية (Spotlight) */}
      <motion.div 
        style={{ 
          x: mouseX, y: mouseY, 
          position: 'fixed', top: 0, left: 0, 
          width: '800px', height: '800px', // حجم كبير جداً لنعومة الانتشار
          background: `radial-gradient(circle, ${dominantColor} 0%, transparent 70%)`, // تدرج لوني ناعم
          opacity: 1, 
          zIndex: 0, 
          pointerEvents: 'none',
          mixBlendMode: 'screen' // دمج سينمائي مع الخلفية السوداء
        }} 
      />

      <nav style={{ display: 'flex', justifyContent: 'space-between', padding: '0 5%', height: '80px', alignItems: 'center', backdropFilter: 'blur(20px)', backgroundColor: 'rgba(255,255,255,0.01)', borderBottom: '1px solid rgba(255,255,255,0.08)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ fontSize: '1.8rem', fontWeight: '900', letterSpacing: '-1px' }}>OBAD<span style={{color: '#2997ff'}}>.AI</span></div>
        <div><SignedOut><SignInButton mode="modal"><button style={{ background: 'rgba(255,255,255,0.08)', color: '#fff', padding: '10px 30px', borderRadius: '50px', border: '1px solid rgba(255,255,255,0.1)', transition: '0.3s' }}>دخول</button></SignInButton></SignedOut><SignedIn><UserButton afterSignOutUrl="/" /></SignedIn></div>
      </nav>

      <div style={{ position: 'relative', zIndex: 10, maxWidth: '1200px', margin: '0 auto', padding: '80px 20px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '4rem', fontWeight: '900', marginBottom: '20px', lineHeight: '1.1' }}>
          حوّل صورك إلى <br />
          <span style={{ background: 'linear-gradient(90deg, #fff, #999)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>تحفة فنية 8K</span>
        </h1>
        <p style={{ color: '#888', fontSize: '1.2rem', marginBottom: '50px', maxWidth: '600px', margin: '0 auto 50px auto' }}>ارفع أي صورة، مهما كان حجمها. تقنية A100 تتكفل بالباقي.</p>

        <div style={{ display: 'inline-flex', background: 'rgba(255,255,255,0.03)', padding: '6px', borderRadius: '20px', marginBottom: '50px', border: '1px solid rgba(255,255,255,0.08)' }}>
          {[ {l:'HD', v:2}, {l:'4K', v:4}, {l:'8K', v:8} ].map(q => (
            <button key={q.v} onClick={() => setScale(q.v)} style={{ padding: '12px 40px', borderRadius: '16px', border: 'none', color: scale === q.v ? '#000' : '#888', background: scale === q.v ? '#fff' : 'transparent', fontWeight: '700', transition: '0.3s' }}>{q.l}</button>
          ))}
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'start', gap: '40px' }}>
          
          {/* قسم الرفع */}
          <div style={{ flex: '1 1 500px', maxWidth: '600px' }}>
            <div {...getRootProps()} style={{ 
              border: `1px dashed ${isDragActive ? '#2997ff' : 'rgba(255,255,255,0.2)'}`, borderRadius: '40px', 
              backgroundColor: 'rgba(255,255,255,0.02)', height: '500px', 
              display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', position: 'relative', transition: '0.3s'
            }}>
              <input {...getInputProps()} />
              
              {loading && (
                <motion.div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, transparent, #2997ff, transparent)', zIndex: 20, boxShadow: '0 0 20px #2997ff' }} animate={{ top: ['0%', '100%', '0%'] }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }} />
              )}

              {previewUrl ? <img src={previewUrl} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '10px', opacity: loading ? 0.5 : 1 }} /> : 
                <div style={{textAlign: 'center'}}>
                  <div style={{ fontSize: '50px', marginBottom: '20px', filter: 'grayscale(1)' }}>📷</div>
                  <p style={{ fontSize: '1.1rem', color: '#fff', fontWeight: 'bold' }}>اضغط لرفع الصورة</p>
                  <p style={{ fontSize: '0.9rem', color: '#666' }}>ندعم الملفات الضخمة</p>
                </div>}
            </div>

            {file && !loading && (
              <button onClick={handleUpscale} style={{ marginTop: '25px', width: '100%', backgroundColor: '#fff', color: '#000', padding: '20px 0', borderRadius: '50px', border: 'none', fontWeight: '800', fontSize: '1.1rem', boxShadow: '0 10px 30px rgba(255,255,255,0.1)' }}>
                {result ? `✨ إعادة التحسين (${scale}x)` : '✨ ابدأ المعالجة السحرية'}
              </button>
            )}
            {loading && <p style={{ marginTop: '25px', color: '#888' }}>جاري ضغط ومعالجة الصورة... ⏳</p>}
          </div>

          {/* قسم النتيجة والمقارنة */}
          <AnimatePresence>
            {result && (
              <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} style={{ flex: '1 1 500px', maxWidth: '600px' }}>
                <BeforeAfterComparison before={previewUrl} after={result} />
                <button onClick={() => forceDownload(result)} disabled={downloading}
                  style={{ marginTop: '25px', width: '100%', backgroundColor: '#2997ff', color: '#fff', padding: '20px 0', borderRadius: '50px', border: 'none', fontWeight: '800', fontSize: '1.1rem', opacity: downloading ? 0.7 : 1, boxShadow: '0 10px 30px rgba(41, 151, 255, 0.2)' }}>
                  {downloading ? 'جاري التحميل...' : 'تحميل النسخة النهائية 📥'}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div style={{ marginTop: '150px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '80px' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '50px', color: '#eee' }}>كيف يعمل OBAD.AI؟</h2>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '50px', flexWrap: 'wrap' }}>
            {[ { icon: '📦', title: 'دعم الملفات الضخمة', desc: 'نظام ضغط ذكي يعالج الصور الكبيرة تلقائياً.' }, { icon: '⚡', title: 'سيرفرات A100', desc: 'معالجة فائقة السرعة والدقة.' }, { icon: '💎', title: 'نتائج 8K', desc: 'وضوح وتفاصيل لم ترها من قبل.' } ].map((item, i) => (
              <div key={i} style={{ flex: '1 1 250px', maxWidth: '300px', padding: '30px', background: 'rgba(255,255,255,0.02)', borderRadius: '30px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontSize: '40px', marginBottom: '20px' }}>{item.icon}</div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '10px' }}>{item.title}</h3>
                <p style={{ color: '#888', fontSize: '0.9rem', lineHeight: '1.6' }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <footer style={{ marginTop: '100px', padding: '40px 0', borderTop: '1px solid rgba(255,255,255,0.05)', textAlign: 'center', color: '#666', fontSize: '0.9rem' }}>
        <p>&copy; {new Date().getFullYear()} OBAD.AI - جميع الحقوق محفوظة.</p>
      </footer>
    </main>
  );
}
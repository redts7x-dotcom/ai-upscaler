"use client";
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence, useSpring, useMotionValue } from 'framer-motion';
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";

// --- استيراد الخطوط ---
const fontImport = (
  <style jsx global>{`
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;700;900&display=swap');
    body { font-family: 'Cairo', sans-serif !important; cursor: none; } /* إخفاء الماوس الأصلي لدمجه مع الإضاءة */
    /* إعادة الماوس فوق العناصر القابلة للنقر */
    button, input, a, .slider-handle { cursor: pointer !important; }
  `}</style>
);

// --- مكون المقارنة الجديد (يعتمد على Clip-Path للدقة) ---
const BeforeAfterComparison = ({ before, after }) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const containerRef = useRef(null);
  const isDragging = useRef(false);

  const handleMove = useCallback((clientX) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    // التأكد من أن السلايدر لا يخرج عن الحدود
    const newValue = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(newValue);
  }, []);

  const onMouseDown = (e) => { isDragging.current = true; handleMove(e.clientX); };
  const onTouchStart = (e) => { isDragging.current = true; handleMove(e.touches[0].clientX); };
  
  useEffect(() => {
    const onMouseUp = () => isDragging.current = false;
    const onMouseMove = (e) => { if (isDragging.current) handleMove(e.clientX); };
    const onTouchMove = (e) => { if (isDragging.current) handleMove(e.touches[0].clientX); };

    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('touchend', onMouseUp);
    window.addEventListener('touchmove', onTouchMove);

    return () => {
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('touchend', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
    };
  }, [handleMove]);

  return (
    <div ref={containerRef} onMouseDown={onMouseDown} onTouchStart={onTouchStart}
         style={{ 
           position: 'relative', width: '100%', height: '500px', borderRadius: '30px', overflow: 'hidden', 
           background: '#000', border: '1px solid rgba(255,255,255,0.1)', touchAction: 'none'
         }}>
      
      {/* الصورة المحسنة (في الخلفية كاملة) */}
      <img src={after} alt="After" style={{ position: 'absolute', top:0, left:0, width: '100%', height: '100%', objectFit: 'contain' }} />
      <div style={{ position: 'absolute', top: '20px', left: '20px', padding: '5px 15px', borderRadius: '20px', background: 'rgba(0,0,0,0.7)', color: '#fff', fontSize: '0.9rem', fontWeight: 'bold', zIndex: 5 }}>بعد (محسّنة)</div>

      {/* الصورة الأصلية (فوقها، ويتم قصها) */}
      <div style={{ 
        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', 
        clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` // السحر هنا: قص الصورة بدقة بكسل
      }}>
        <img src={before} alt="Before" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        <div style={{ position: 'absolute', top: '20px', right: '20px', padding: '5px 15px', borderRadius: '20px', background: 'rgba(0,0,0,0.7)', color: '#fff', fontSize: '0.9rem', fontWeight: 'bold' }}>قبل (الأصلية)</div>
      </div>

      {/* الخط الفاصل والمقبض */}
      <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${sliderPosition}%`, width: '2px', background: 'rgba(255,255,255,0.8)', cursor: 'ew-resize' }}>
        <div className="slider-handle" style={{ 
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', 
          width: '40px', height: '40px', background: '#fff', borderRadius: '50%', 
          display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(0,0,0,0.5)'
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
          <svg width="20" height="20" viewBox="0 0 24 24" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
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
  const [dominantColor, setDominantColor] = useState('rgba(41, 151, 255, 0.3)');

  // --- إعدادات حركة الماوس الفيزيائية (Lag Effect) ---
  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);
  
  // Spring config: stiffness (قوة الجذب), damping (الاحتكاك/الثقل)
  // كلما قللنا stiffness وزدنا damping، زاد التأخير والنعومة
  const springConfig = { damping: 25, stiffness: 150, mass: 0.5 }; 
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  useEffect(() => {
    const handleMouseMove = (e) => {
      // نطرح نصف عرض الدائرة (150px) لتكون في المنتصف
      mouseX.set(e.clientX - 150);
      mouseY.set(e.clientY - 150);
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  // --- دالة الضغط القوي (Aggressive Compression) ---
  const compressImage = async (imageFile) => {
    // 1. إذا الملف أصغر من 3 ميجا، ممتاز
    if (imageFile.size < 3 * 1024 * 1024) return imageFile;

    console.log(`Original: ${(imageFile.size/1024/1024).toFixed(2)}MB`);
    
    // 2. ضغط متدرج
    let currentFile = imageFile;
    let quality = 0.8;
    let maxWidth = 2500; // تقييد العرض الأقصى للحفاظ على الحجم

    while (currentFile.size > 3.5 * 1024 * 1024 && quality > 0.3) {
      currentFile = await new Promise((resolve) => {
        const img = new Image();
        img.src = URL.createObjectURL(imageFile);
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // تصغير الأبعاد إذا كانت ضخمة جداً
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob((blob) => {
            resolve(new File([blob], imageFile.name, { type: 'image/jpeg' }));
          }, 'image/jpeg', quality);
        };
      });
      
      console.log(`Compressed to: ${(currentFile.size/1024/1024).toFixed(2)}MB (Q:${quality}, W:${maxWidth})`);
      quality -= 0.1;
      maxWidth -= 300; // تصغير الأبعاد في المحاولة التالية
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
      setDominantColor(`rgba(${r}, ${g}, ${b}, 0.5)`);
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
      link.href = blobUrl; link.download = `OBAD-A100-${Date.now()}.png`;
      document.body.appendChild(link); link.click(); document.body.removeChild(link); window.URL.revokeObjectURL(blobUrl);
    } catch (e) { alert("فشل التحميل التلقائي"); } finally { setDownloading(false); }
  };

  const handleUpscale = async () => {
    if (!file) return;
    setLoading(true);
    try {
      // تطبيق الضغط القسري قبل الإرسال
      const processedFile = await compressImage(file);
      
      const formData = new FormData(); formData.append("image", processedFile); formData.append("scale", scale);
      const res = await fetch('/api/upscale', { method: 'POST', body: formData });
      const text = await res.text();
      try {
        const data = JSON.parse(text);
        if (!res.ok) throw new Error(data.error || "خطأ في السيرفر");
        if (data.result) setResult(data.result); else throw new Error("لم تصل النتيجة");
      } catch (jsonError) {
        if (text.includes("Too Large")) throw new Error("الملف كبير جداً حتى بعد الضغط"); else throw new Error("فشل الاتصال");
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
      
      {/* إضاءة الماوس الاحترافية (Ambient Glow) */}
      <motion.div 
        style={{ 
          x: smoothX, y: smoothY, // استخدام القيم الفيزيائية الناعمة
          position: 'fixed', top: 0, left: 0, 
          width: '300px', height: '300px', 
          backgroundColor: dominantColor, 
          borderRadius: '50%', 
          filter: 'blur(80px)', // تمويه عالي لدمج اللون
          opacity: 0.6, 
          zIndex: 0, 
          pointerEvents: 'none',
          mixBlendMode: 'screen' // لدمج الإضاءة مع الخلفية بشكل سينمائي
        }} 
      />

      {/* مؤشر ماوس مخصص صغير في المنتصف للدقة */}
      <motion.div style={{ x: smoothX, y: smoothY, position: 'fixed', top: 145, left: 145, width: '10px', height: '10px', background: '#fff', borderRadius: '50%', pointerEvents: 'none', zIndex: 9999, boxShadow: '0 0 10px rgba(255,255,255,0.8)' }} />

      <nav style={{ display: 'flex', justifyContent: 'space-between', padding: '0 5%', height: '80px', alignItems: 'center', backdropFilter: 'blur(20px)', backgroundColor: 'rgba(255,255,255,0.01)', borderBottom: '1px solid rgba(255,255,255,0.08)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ fontSize: '1.8rem', fontWeight: '900', letterSpacing: '-1px' }}>OBAD<span style={{color: '#2997ff'}}>.AI</span></div>
        <div><SignedOut><SignInButton mode="modal"><button style={{ background: 'rgba(255,255,255,0.08)', color: '#fff', padding: '10px 30px', borderRadius: '50px', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', transition: '0.3s' }}>دخول</button></SignInButton></SignedOut><SignedIn><UserButton afterSignOutUrl="/" /></SignedIn></div>
      </nav>

      <div style={{ position: 'relative', zIndex: 10, maxWidth: '1200px', margin: '0 auto', padding: '80px 20px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '4rem', fontWeight: '900', marginBottom: '20px', lineHeight: '1.1' }}>
          حوّل صورك إلى <br />
          <span style={{ background: 'linear-gradient(90deg, #fff, #999)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>تحفة فنية 8K</span>
        </h1>
        <p style={{ color: '#888', fontSize: '1.2rem', marginBottom: '50px', maxWidth: '600px', margin: '0 auto 50px auto' }}>تقنية A100 المتقدمة. ارفع أي صورة (حتى لو كانت ضخمة)، وسنتكفل بالباقي.</p>

        {/* أزرار الجودة */}
        <div style={{ display: 'inline-flex', background: 'rgba(255,255,255,0.03)', padding: '6px', borderRadius: '20px', marginBottom: '50px', border: '1px solid rgba(255,255,255,0.08)' }}>
          {[ {l:'HD', v:2}, {l:'4K', v:4}, {l:'8K', v:8} ].map(q => (
            <button key={q.v} onClick={() => setScale(q.v)} style={{ padding: '12px 40px', borderRadius: '16px', border: 'none', color: scale === q.v ? '#000' : '#888', background: scale === q.v ? '#fff' : 'transparent', cursor: 'pointer', fontWeight: '700', transition: '0.3s' }}>{q.l}</button>
          ))}
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'start', gap: '40px' }}>
          
          {/* قسم الرفع */}
          <div style={{ flex: '1 1 500px', maxWidth: '600px' }}>
            <div {...getRootProps()} style={{ 
              border: `1px dashed ${isDragActive ? '#2997ff' : 'rgba(255,255,255,0.2)'}`, borderRadius: '40px', 
              backgroundColor: 'rgba(255,255,255,0.02)', cursor: 'pointer', height: '500px', 
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
                  <p style={{ fontSize: '0.9rem', color: '#666' }}>ندعم الملفات الكبيرة جداً</p>
                </div>}
            </div>

            {file && !loading && (
              <button onClick={handleUpscale} style={{ marginTop: '25px', width: '100%', backgroundColor: '#fff', color: '#000', padding: '20px 0', borderRadius: '50px', border: 'none', cursor: 'pointer', fontWeight: '800', fontSize: '1.1rem', boxShadow: '0 10px 30px rgba(255,255,255,0.1)' }}>
                {result ? `✨ إعادة التحسين (${scale}x)` : '✨ ابدأ المعالجة السحرية'}
              </button>
            )}
            {loading && <p style={{ marginTop: '25px', color: '#888' }}>جاري ضغط الملف ورفعه للموديل A100... ⏳</p>}
          </div>

          {/* قسم النتيجة والمقارنة */}
          <AnimatePresence>
            {result && (
              <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} style={{ flex: '1 1 500px', maxWidth: '600px' }}>
                <BeforeAfterComparison before={previewUrl} after={result} />
                <button onClick={() => forceDownload(result)} disabled={downloading}
                  style={{ marginTop: '25px', width: '100%', backgroundColor: '#2997ff', color: '#fff', padding: '20px 0', borderRadius: '50px', border: 'none', cursor: downloading ? 'not-allowed' : 'pointer', fontWeight: '800', fontSize: '1.1rem', opacity: downloading ? 0.7 : 1, boxShadow: '0 10px 30px rgba(41, 151, 255, 0.2)' }}>
                  {downloading ? 'جاري التحميل...' : 'تحميل النسخة النهائية 📥'}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div style={{ marginTop: '150px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '80px' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '50px', color: '#eee' }}>كيف يعمل OBAD.AI؟</h2>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '50px', flexWrap: 'wrap' }}>
            {[ { icon: '📦', title: 'دعم الملفات الضخمة', desc: 'نظام ضغط ذكي يعالج الصور حتى 1000 ميجا تلقائياً.' }, { icon: '⚡', title: 'سيرفرات A100', desc: 'نستخدم أقوى كروت شاشة في العالم للمعالجة.' }, { icon: '💎', title: 'نتائج 8K', desc: 'دقة خيالية وتفاصيل لم تكن موجودة.' } ].map((item, i) => (
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
"use client";
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence, useMotionValue } from 'framer-motion';
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";

// --- استيراد الخطوط + ستايل الماوس الطبيعي ---
const fontImport = (
  <style jsx global>{`
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;700;900&display=swap');
    body { font-family: 'Cairo', sans-serif !important; background-color: #050505; }
    /* إجبار المتصفح على استخدام الماوس العادي */
    * { cursor: auto !important; }
    button, a, .clickable { cursor: pointer !important; }
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
    const stopDrag = () => isDragging.current = false;
    const doDrag = (e) => { if (isDragging.current) handleMove(e.clientX || e.touches[0].clientX); };

    window.addEventListener('mouseup', stopDrag);
    window.addEventListener('touchend', stopDrag);
    window.addEventListener('mousemove', doDrag);
    window.addEventListener('touchmove', doDrag);

    return () => {
      window.removeEventListener('mouseup', stopDrag);
      window.removeEventListener('touchend', stopDrag);
      window.removeEventListener('mousemove', doDrag);
      window.removeEventListener('touchmove', doDrag);
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
      <img src={after} alt="After" style={{ position: 'absolute', top:0, left:0, width: '100%', height: '100%', objectFit: 'contain' }} />
      <div style={{ position: 'absolute', top: '20px', left: '20px', padding: '6px 16px', borderRadius: '20px', background: 'rgba(0,0,0,0.7)', color: '#fff', fontSize: '0.9rem', fontWeight: 'bold', pointerEvents: 'none' }}>بعد</div>

      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}>
        <img src={before} alt="Before" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        <div style={{ position: 'absolute', top: '20px', right: '20px', padding: '6px 16px', borderRadius: '20px', background: 'rgba(0,0,0,0.7)', color: '#fff', fontSize: '0.9rem', fontWeight: 'bold', pointerEvents: 'none' }}>قبل</div>
      </div>

      <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${sliderPosition}%`, width: '2px', background: 'rgba(255,255,255,0.9)', cursor: 'ew-resize' }}>
        <div className="slider-handle" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '40px', height: '40px', background: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/><path d="M9 18l6-6-6-6"/></svg>
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
  const [dominantColor, setDominantColor] = useState('rgba(41, 151, 255, 0.1)');
  const [statusMsg, setStatusMsg] = useState("");

  // --- إضاءة Spotlight مباشرة (بدون تأخير) ---
  const mouseX = useMotionValue(-500);
  const mouseY = useMotionValue(-500);

  useEffect(() => {
    const moveLight = (e) => {
      // تحريك مباشر وسريع جداً
      mouseX.set(e.clientX - 400); // 400 هو نصف قطر الإضاءة
      mouseY.set(e.clientY - 400);
    };
    window.addEventListener("mousemove", moveLight);
    return () => window.removeEventListener("mousemove", moveLight);
  }, [mouseX, mouseY]);

  // --- ضغط الصور القسري ---
  const compressImage = async (imageFile) => {
    // نترك هامش أمان كبير (3.5 ميجا)
    const MAX_MB = 3.5;
    if (imageFile.size < MAX_MB * 1024 * 1024) return imageFile;

    setStatusMsg("جاري ضغط الصورة لتناسب السيرفر...");
    let currentFile = imageFile;
    let quality = 0.9;
    let widthRatio = 1.0;
    
    // محاولة الضغط حتى 10 مرات
    for (let i = 0; i < 10; i++) {
      if (currentFile.size <= MAX_MB * 1024 * 1024) break;
      
      currentFile = await new Promise(resolve => {
        const img = new Image();
        img.src = URL.createObjectURL(imageFile);
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let w = img.width * widthRatio;
          let h = img.height * widthRatio;
          
          // تقييد الأبعاد القصوى
          if (w > 2500) { let r = 2500/w; w=2500; h*=r; widthRatio = w/img.width; }
          
          canvas.width = w; canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, w, h);
          canvas.toBlob(blob => resolve(new File([blob], imageFile.name, {type: 'image/jpeg'})), 'image/jpeg', quality);
        };
      });
      quality -= 0.15; widthRatio -= 0.1;
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
      const res = await fetch(url); const blob = await res.blob();
      const urlBlob = window.URL.createObjectURL(blob);
      const link = document.createElement('a'); link.href = urlBlob; link.download = `OBAD-Enhanced-${Date.now()}.png`;
      document.body.appendChild(link); link.click(); document.body.removeChild(link); window.URL.revokeObjectURL(urlBlob);
    } catch { alert("خطأ في التحميل"); } finally { setDownloading(false); }
  };

  // --- عملية التحسين بنظام Polling ---
  const handleUpscale = async () => {
    if (!file) return;
    setLoading(true);
    setStatusMsg("جاري الرفع...");
    
    try {
      const processedFile = await compressImage(file);
      const formData = new FormData(); 
      formData.append("image", processedFile); 
      formData.append("scale", scale);

      // 1. إرسال الطلب والحصول على التذكرة (ID)
      const res = await fetch('/api/upscale', { method: 'POST', body: formData });
      const data = await res.json();
      
      if (!res.ok || data.error) throw new Error(data.error || "خطأ في السيرفر");
      
      const predictionId = data.id;
      setStatusMsg("جاري المعالجة بواسطة A100...");

      // 2. فحص الحالة كل ثانيتين
      let done = false;
      let attempts = 0;
      while (!done && attempts < 120) { // انتظار حتى 4 دقائق
        await new Promise(r => setTimeout(r, 2000));
        
        const checkRes = await fetch('/api/upscale', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ checkId: predictionId })
        });
        const checkData = await checkRes.json();
        
        if (checkData.status === 'succeeded') {
          setResult(checkData.output);
          done = true;
        } else if (checkData.status === 'failed') {
          throw new Error("فشلت المعالجة من المصدر (الصورة قد تكون معقدة)");
        } else {
           // ما زال يعمل
           attempts++;
        }
      }
      if (!done) throw new Error("انتهى الوقت المحدد للمعالجة");

    } catch (e) { alert(e.message); } finally { setLoading(false); setStatusMsg(""); }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (f) => { setFile(f[0]); setResult(null); }, accept: {'image/*': []}, multiple: false
  });

  return (
    <main dir="rtl" style={{ minHeight: '100vh', backgroundColor: '#050505', color: '#fff', position: 'relative', overflowX: 'hidden' }}>
      {fontImport}
      
      {/* Spotlight Effect: إضاءة خلفية تتبع الماوس */}
      <motion.div 
        style={{ 
          x: mouseX, y: mouseY, 
          position: 'fixed', top: 0, left: 0, 
          width: '800px', height: '800px', 
          background: `radial-gradient(circle, ${dominantColor} 0%, transparent 60%)`, 
          opacity: 1, zIndex: 0, pointerEvents: 'none', mixBlendMode: 'screen'
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
                  <p style={{ fontSize: '0.9rem', color: '#666' }}>ندعم الملفات الكبيرة</p>
                </div>}
            </div>

            {file && !loading && (
              <button onClick={handleUpscale} style={{ marginTop: '25px', width: '100%', backgroundColor: '#fff', color: '#000', padding: '20px 0', borderRadius: '50px', border: 'none', fontWeight: '800', fontSize: '1.1rem', boxShadow: '0 10px 30px rgba(255,255,255,0.1)' }}>
                {result ? `✨ إعادة التحسين (${scale}x)` : '✨ ابدأ المعالجة السحرية'}
              </button>
            )}
            {loading && <p style={{ marginTop: '25px', color: '#888' }}>{statusMsg}</p>}
          </div>

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
      </div>
      <footer style={{ marginTop: '100px', padding: '40px 0', borderTop: '1px solid rgba(255,255,255,0.05)', textAlign: 'center', color: '#666', fontSize: '0.9rem' }}>
        <p>&copy; {new Date().getFullYear()} OBAD.AI - جميع الحقوق محفوظة.</p>
      </footer>
    </main>
  );
}
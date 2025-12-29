"use client";
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence, useMotionValue } from 'framer-motion';
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";

// --- مكوّن مقارنة قبل وبعد (جديد) ---
const BeforeAfterComparison = ({ before, after }) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef(null);

  const handleMove = useCallback((clientX) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const newValue = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(newValue);
  }, []);

  const handleMouseDown = () => setIsResizing(true);
  const handleMouseUp = () => setIsResizing(false);
  const handleMouseMove = (e) => isResizing && handleMove(e.clientX);
  const handleTouchMove = (e) => handleMove(e.touches[0].clientX);

  useEffect(() => {
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mouseleave', handleMouseUp);
    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mouseleave', handleMouseUp);
    };
  }, []);

  const labelStyle = {
    position: 'absolute', top: '20px', padding: '6px 16px', borderRadius: '20px',
    background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)', color: '#fff', fontWeight: 'bold', zIndex: 10
  };

  return (
    <div ref={containerRef} onMouseMove={handleMouseMove} onTouchMove={handleTouchMove} onMouseDown={handleMove.bind(null, containerRef.current?.getBoundingClientRect().left + (sliderPosition / 100) * containerRef.current?.getBoundingClientRect().width)}
         style={{ 
           position: 'relative', width: '100%', height: '450px', borderRadius: '40px', overflow: 'hidden', 
           cursor: 'col-resize', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)'
         }}>
      {/* صورة "بعد" (الخلفية) */}
      <img src={after} alt="After" style={{ position: 'absolute', top:0, left:0, width: '100%', height: '100%', objectFit: 'contain' }} />
      <span style={{ ...labelStyle, right: '20px' }}>بعد</span>

      {/* صورة "قبل" (فوقها ويتم قصها) */}
      <div style={{ position: 'absolute', top:0, left:0, width: `${sliderPosition}%`, height: '100%', overflow: 'hidden', borderRight: '2px solid rgba(255,255,255,0.8)' }}>
        <img src={before} alt="Before" style={{ width: containerRef.current?.clientWidth, height: '100%', objectFit: 'contain' }} />
      </div>
       <span style={{ ...labelStyle, left: '20px' }}>قبل</span>

      {/* مقبض السلايدر */}
      <div style={{ position: 'absolute', top: '50%', left: `${sliderPosition}%`, transform: 'translate(-50%, -50%)', width: '30px', height: '30px', background: 'rgba(255,255,255,0.9)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 15px rgba(0,0,0,0.3)', zIndex: 20 }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline><polyline points="9 18 3 12 9 6"></polyline><polyline points="21 18 15 12 21 6"></polyline></svg>
      </div>
    </div>
  );
};

// --- المكون الرئيسي ---
export default function Home() {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [scale, setScale] = useState(2);
  const [dominantColor, setDominantColor] = useState('rgba(0, 123, 255, 0.2)');

  // --- إعدادات حركة الماوس المباشرة (بدون تأخير) ---
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  useEffect(() => {
    const handleMouseMove = (e) => {
      // تحديث مباشر وفوري لموقع الماوس
      mouseX.set(e.clientX - 250);
      mouseY.set(e.clientY - 250);
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  // --- دالة الضغط القسري (كما هي) ---
  const compressImage = async (imageFile) => {
    const MAX_SIZE = 4 * 1024 * 1024; 
    if (imageFile.size <= MAX_SIZE) return imageFile;
    let currentFile = imageFile;
    let quality = 0.9; let widthRatio = 1.0;
    while (currentFile.size > MAX_SIZE && (quality > 0.1 || widthRatio > 0.1)) {
      currentFile = await new Promise((resolve) => {
        const img = new Image(); img.src = URL.createObjectURL(imageFile);
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width * widthRatio; canvas.height = img.height * widthRatio;
          const ctx = canvas.getContext('2d'); ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          canvas.toBlob((blob) => { resolve(new File([blob], imageFile.name, { type: 'image/jpeg' })); }, 'image/jpeg', quality);
        };
      });
      if (currentFile.size > MAX_SIZE) { quality -= 0.1; widthRatio -= 0.1; }
    }
    return currentFile;
  };

  // --- استخراج اللون (كما هو) ---
  useEffect(() => {
    if (!previewUrl) return;
    const img = new Image(); img.crossOrigin = "Anonymous"; img.src = previewUrl;
    img.onload = () => {
      const canvas = document.createElement('canvas'); const ctx = canvas.getContext('2d');
      canvas.width = 1; canvas.height = 1; ctx.drawImage(img, 0, 0, 1, 1);
      const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
      setDominantColor(`rgba(${r}, ${g}, ${b}, 0.4)`);
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
      const processedFile = await compressImage(file);
      if (processedFile.size > 4.5 * 1024 * 1024) throw new Error("الصورة ضخمة جداً");
      const formData = new FormData(); formData.append("image", processedFile); formData.append("scale", scale);
      const res = await fetch('/api/upscale', { method: 'POST', body: formData });
      const text = await res.text();
      try {
        const data = JSON.parse(text);
        if (!res.ok) throw new Error(data.error || "خطأ في السيرفر");
        if (data.result) setResult(data.result); else throw new Error("لم تصل النتيجة");
      } catch (jsonError) {
        if (text.includes("Too Large")) throw new Error("الملف كبير جداً"); else throw new Error("فشل الاتصال");
      }
    } catch (e) { alert(e.message); } finally { setLoading(false); }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (f) => { setFile(f[0]); setResult(null); },
    accept: { 'image/*': [] }, multiple: false
  });

  return (
    <main dir="rtl" style={{ 
      minHeight: '100vh', backgroundColor: '#000', color: '#fff', position: 'relative', overflow: 'hidden',
      fontFamily: 'system-ui, sans-serif', cursor: 'default'
    }}>
      
      {/* إضاءة تتبع الماوس (مباشرة وبدون تأخير) */}
      <motion.div 
        style={{ 
          x: mouseX, y: mouseY, // استخدام القيم المباشرة بدلاً من spring
          position: 'fixed', top: 0, left: 0, width: '500px', height: '500px', 
          backgroundColor: dominantColor, borderRadius: '50%', filter: 'blur(120px)', opacity: 0.6, zIndex: 0, pointerEvents: 'none' 
        }} 
      />

      <nav style={{ 
        display: 'flex', justifyContent: 'space-between', padding: '0 40px', height: '70px', alignItems: 'center',
        backdropFilter: 'blur(30px)', backgroundColor: 'rgba(255,255,255,0.02)',
        borderBottom: '1px solid rgba(255,255,255,0.1)', position: 'sticky', top: 0, zIndex: 100
      }}>
        <div style={{ fontSize: '1.6rem', fontWeight: '900', color: '#fff' }}>OBAD</div>
        <div><SignedOut><SignInButton mode="modal"><button style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', padding: '8px 25px', borderRadius: '40px', border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer' }}>دخول</button></SignInButton></SignedOut><SignedIn><UserButton afterSignOutUrl="/" /></SignedIn></div>
      </nav>

      <div style={{ position: 'relative', zIndex: 10, maxWidth: '1300px', margin: '0 auto', padding: '60px 20px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '4.5rem', fontWeight: '900', marginBottom: '15px', background: 'linear-gradient(to bottom, #fff, #999)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>سحر التحسين A100.</h1>
        <p style={{ color: '#a1a1a6', fontSize: '1.3rem', marginBottom: '40px' }}>ارفع جودة صورك وقارن النتيجة قبل وبعد.</p>

        <div style={{ display: 'inline-flex', background: 'rgba(255,255,255,0.05)', padding: '5px', borderRadius: '16px', marginBottom: '40px', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}>
          {[ {l:'HD (2x)', v:2}, {l:'4K (4x)', v:4}, {l:'8K (8x)', v:8} ].map(q => (
            <button key={q.v} onClick={() => setScale(q.v)} style={{ padding: '10px 35px', borderRadius: '12px', border: 'none', color: scale === q.v ? '#000' : '#fff', background: scale === q.v ? '#fff' : 'transparent', cursor: 'pointer', fontWeight: '700', transition: '0.4s' }}>{q.l}</button>
          ))}
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'start', gap: '40px' }}>
          
          {/* قسم الإدخال */}
          <div style={{ flex: '1 1 500px', maxWidth: '600px' }}>
            <div {...getRootProps()} style={{ 
              border: `1px solid ${isDragActive ? '#fff' : 'rgba(255,255,255,0.1)'}`, borderRadius: '40px', 
              backgroundColor: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(25px)', cursor: 'pointer', 
              height: '450px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' 
            }}>
              <input {...getInputProps()} />
              {previewUrl ? <img src={previewUrl} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '10px' }} /> : 
                <>
                  <div style={{ fontSize: '60px', marginBottom: '20px' }}>✨</div>
                  <p style={{ fontSize: '1.2rem', color: '#a1a1a6' }}>اسحب الصورة هنا</p>
                </>}
            </div>
            {file && !loading && (
              <button onClick={handleUpscale} style={{ marginTop: '30px', width: '100%', backgroundColor: '#fff', color: '#000', padding: '18px 0', borderRadius: '40px', border: 'none', cursor: 'pointer', fontWeight: '800', fontSize: '1.1rem' }}>
                {result ? `إعادة التحسين (${scale}x)` : 'ابدأ التحسين الآن'}
              </button>
            )}
            {loading && <p style={{ marginTop: '30px', color: '#fff', fontSize: '1.1rem' }}>جاري المعالجة... ⏳</p>}
          </div>

          {/* قسم النتيجة (مقارنة قبل وبعد) */}
          <AnimatePresence>
            {result && (
              <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} style={{ flex: '1 1 500px', maxWidth: '600px' }}>
                
                {/* استخدام مكون المقارنة الجديد هنا */}
                <BeforeAfterComparison before={previewUrl} after={result} />
                
                <button onClick={() => forceDownload(result)} disabled={downloading}
                  style={{ marginTop: '30px', width: '100%', backgroundColor: '#2997ff', color: '#fff', padding: '18px 0', borderRadius: '40px', border: 'none', cursor: downloading ? 'not-allowed' : 'pointer', fontWeight: '800', fontSize: '1.1rem', opacity: downloading ? 0.7 : 1 }}>
                  {downloading ? 'جاري التنزيل...' : 'تحميل النتيجة النهائية'}
                </button>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>
    </main>
  );
}
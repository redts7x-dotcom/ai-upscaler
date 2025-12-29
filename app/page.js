"use client";
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence, useMotionValue } from 'framer-motion';
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";

// --- تحميل خط Cairo من Google Fonts ---
const fontImport = (
  <style jsx global>{`
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;700;900&display=swap');
    body { font-family: 'Cairo', sans-serif !important; }
  `}</style>
);

// --- مكون المقارنة (قبل وبعد) ---
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

  return (
    <div ref={containerRef} onMouseMove={handleMouseMove} onTouchMove={handleTouchMove} onMouseDown={handleMove.bind(null, containerRef.current?.getBoundingClientRect().left + (sliderPosition / 100) * containerRef.current?.getBoundingClientRect().width)}
         style={{ position: 'relative', width: '100%', height: '450px', borderRadius: '40px', overflow: 'hidden', cursor: 'col-resize', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)' }}>
      <img src={after} alt="After" style={{ position: 'absolute', top:0, left:0, width: '100%', height: '100%', objectFit: 'contain' }} />
      <div style={{ position: 'absolute', top: '20px', right: '20px', padding: '5px 15px', borderRadius: '20px', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', fontSize: '0.9rem', fontWeight: 'bold' }}>بعد</div>
      
      <div style={{ position: 'absolute', top:0, left:0, width: `${sliderPosition}%`, height: '100%', overflow: 'hidden', borderRight: '2px solid rgba(255,255,255,0.8)' }}>
        <img src={before} alt="Before" style={{ width: containerRef.current?.clientWidth, height: '100%', objectFit: 'contain' }} />
      </div>
      <div style={{ position: 'absolute', top: '20px', left: '20px', padding: '5px 15px', borderRadius: '20px', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', fontSize: '0.9rem', fontWeight: 'bold' }}>قبل</div>

      <div style={{ position: 'absolute', top: '50%', left: `${sliderPosition}%`, transform: 'translate(-50%, -50%)', width: '32px', height: '32px', background: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(0,0,0,0.5)', zIndex: 20 }}>
        <svg width="16" height="16" viewBox="0 0 24 24" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline><polyline points="9 18 3 12 9 6"></polyline></svg>
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
  const [dominantColor, setDominantColor] = useState('rgba(0, 123, 255, 0.2)');

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  useEffect(() => {
    const handleMouseMove = (e) => {
      mouseX.set(e.clientX - 250);
      mouseY.set(e.clientY - 250);
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

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
    <main dir="rtl" style={{ minHeight: '100vh', backgroundColor: '#050505', color: '#fff', position: 'relative', overflowX: 'hidden' }}>
      {fontImport}
      
      {/* إضاءة الماوس */}
      <motion.div style={{ x: mouseX, y: mouseY, position: 'fixed', top: 0, left: 0, width: '500px', height: '500px', backgroundColor: dominantColor, borderRadius: '50%', filter: 'blur(130px)', opacity: 0.5, zIndex: 0, pointerEvents: 'none' }} />

      <nav style={{ display: 'flex', justifyContent: 'space-between', padding: '0 5%', height: '80px', alignItems: 'center', backdropFilter: 'blur(20px)', backgroundColor: 'rgba(255,255,255,0.01)', borderBottom: '1px solid rgba(255,255,255,0.08)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ fontSize: '1.8rem', fontWeight: '900', letterSpacing: '-1px' }}>OBAD<span style={{color: '#2997ff'}}>.AI</span></div>
        <div><SignedOut><SignInButton mode="modal"><button style={{ background: 'rgba(255,255,255,0.08)', color: '#fff', padding: '10px 30px', borderRadius: '50px', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', transition: '0.3s' }}>دخول</button></SignInButton></SignedOut><SignedIn><UserButton afterSignOutUrl="/" /></SignedIn></div>
      </nav>

      <div style={{ position: 'relative', zIndex: 10, maxWidth: '1200px', margin: '0 auto', padding: '80px 20px', textAlign: 'center' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          <h1 style={{ fontSize: '4rem', fontWeight: '900', marginBottom: '20px', lineHeight: '1.1' }}>
            حوّل صورك إلى <br />
            <span style={{ background: 'linear-gradient(90deg, #fff, #999)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>تحفة فنية بدقة 8K</span>
          </h1>
          <p style={{ color: '#888', fontSize: '1.2rem', marginBottom: '50px', maxWidth: '600px', margin: '0 auto 50px auto' }}>تقنية A100 المتقدمة تعيد بناء التفاصيل المفقودة، تزيد الدقة، وتصحح الألوان بلمسة واحدة.</p>
        </motion.div>

        {/* أزرار الجودة */}
        <div style={{ display: 'inline-flex', background: 'rgba(255,255,255,0.03)', padding: '6px', borderRadius: '20px', marginBottom: '50px', border: '1px solid rgba(255,255,255,0.08)' }}>
          {[ {l:'HD', v:2}, {l:'4K', v:4}, {l:'8K', v:8} ].map(q => (
            <button key={q.v} onClick={() => setScale(q.v)} style={{ padding: '12px 40px', borderRadius: '16px', border: 'none', color: scale === q.v ? '#000' : '#888', background: scale === q.v ? '#fff' : 'transparent', cursor: 'pointer', fontWeight: '700', transition: '0.3s' }}>{q.l}</button>
          ))}
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'start', gap: '40px' }}>
          
          {/* قسم الرفع والمعاينة */}
          <div style={{ flex: '1 1 500px', maxWidth: '600px' }}>
            <div {...getRootProps()} style={{ 
              border: `1px dashed ${isDragActive ? '#2997ff' : 'rgba(255,255,255,0.2)'}`, borderRadius: '40px', 
              backgroundColor: 'rgba(255,255,255,0.02)', cursor: 'pointer', height: '450px', 
              display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', position: 'relative', transition: '0.3s'
            }}>
              <input {...getInputProps()} />
              
              {/* تأثير المسح الضوئي (Scanning) أثناء التحميل */}
              {loading && (
                <motion.div 
                  style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, transparent, #2997ff, transparent)', zIndex: 20, boxShadow: '0 0 20px #2997ff' }}
                  animate={{ top: ['0%', '100%', '0%'] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                />
              )}

              {previewUrl ? <img src={previewUrl} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '10px', opacity: loading ? 0.5 : 1 }} /> : 
                <div style={{textAlign: 'center'}}>
                  <div style={{ fontSize: '50px', marginBottom: '20px', filter: 'grayscale(1)' }}>📷</div>
                  <p style={{ fontSize: '1.1rem', color: '#fff', fontWeight: 'bold' }}>اضغط لرفع الصورة</p>
                  <p style={{ fontSize: '0.9rem', color: '#666' }}>أو اسحب الملف هنا</p>
                </div>}
            </div>

            {file && !loading && (
              <button onClick={handleUpscale} style={{ marginTop: '25px', width: '100%', backgroundColor: '#fff', color: '#000', padding: '20px 0', borderRadius: '50px', border: 'none', cursor: 'pointer', fontWeight: '800', fontSize: '1.1rem', boxShadow: '0 10px 30px rgba(255,255,255,0.1)' }}>
                {result ? `✨ إعادة التحسين (${scale}x)` : '✨ ابدأ المعالجة السحرية'}
              </button>
            )}
            {loading && <p style={{ marginTop: '25px', color: '#888', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}><span style={{width: '10px', height: '10px', background: '#2997ff', borderRadius: '50%', display: 'inline-block'}}></span> جاري التحليل والمعالجة بدقة عالية...</p>}
          </div>

          {/* قسم النتيجة */}
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

        {/* --- قسم جديد: كيف يعمل (لإعطاء الطابع الرسمي) --- */}
        <div style={{ marginTop: '150px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '80px' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '50px', color: '#eee' }}>كيف يعمل OBAD.AI؟</h2>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '50px', flexWrap: 'wrap' }}>
            {[
              { icon: '📤', title: 'ارفع صورتك', desc: 'يدعم جميع الصيغ حتى الصور الكبيرة ويقوم بضغطها ذكياً.' },
              { icon: '⚡', title: 'المعالجة السحابية', desc: 'نستخدم سيرفرات A100 لمعالجة البيكسلات وإعادة رسمها.' },
              { icon: '💎', title: 'نتائج مبهرة', desc: 'احصل على دقة 4K أو 8K بتفاصيل حقيقية وإضاءة مصححة.' }
            ].map((item, i) => (
              <div key={i} style={{ flex: '1 1 250px', maxWidth: '300px', padding: '30px', background: 'rgba(255,255,255,0.02)', borderRadius: '30px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontSize: '40px', marginBottom: '20px' }}>{item.icon}</div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '10px' }}>{item.title}</h3>
                <p style={{ color: '#888', fontSize: '0.9rem', lineHeight: '1.6' }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Footer بسيط ورسمي */}
      <footer style={{ marginTop: '100px', padding: '40px 0', borderTop: '1px solid rgba(255,255,255,0.05)', textAlign: 'center', color: '#666', fontSize: '0.9rem' }}>
        <p>&copy; {new Date().getFullYear()} OBAD.AI - جميع الحقوق محفوظة.</p>
        <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'center', gap: '20px' }}>
          <span style={{ cursor: 'pointer', textDecoration: 'underline' }}>سياسة الخصوصية</span>
          <span style={{ cursor: 'pointer', textDecoration: 'underline' }}>شروط الاستخدام</span>
        </div>
      </footer>
    </main>
  );
}
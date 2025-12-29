"use client";
import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";

export default function Home() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [scale, setScale] = useState(2);

  const handleUpscale = async () => {
    if (!file) return;
    setLoading(true); setResult(null);
    const formData = new FormData();
    formData.append("image", file);
    formData.append("scale", scale);

    try {
      const res = await fetch('/api/upscale', { method: 'POST', body: formData });
      const data = await res.json();
      if (res.ok && data.result) setResult(data.result);
      else alert("تنبيه: " + (data.error || "تأكد من شحن الرصيد"));
    } catch (e) { alert("خطأ في السيرفر"); } 
    finally { setLoading(false); }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (f) => { setFile(f[0]); setResult(null); },
    accept: { 'image/*': [] }, multiple: false
  });

  return (
    <main dir="rtl" style={{ 
      minHeight: '100vh', backgroundColor: '#000', color: '#fff', 
      backgroundImage: 'radial-gradient(circle at 50% 0%, #1a1a2e 0%, #000 80%)',
      fontFamily: 'system-ui, sans-serif' 
    }}>
      {/* Navbar زجاجي شفاف */}
      <nav style={{ 
        display: 'flex', justifyContent: 'space-between', padding: '0 40px', height: '70px', alignItems: 'center',
        backdropFilter: 'blur(30px)', backgroundColor: 'rgba(255,255,255,0.02)',
        borderBottom: '1px solid rgba(255,255,255,0.1)', position: 'sticky', top: 0, zIndex: 100
      }}>
        <div style={{ fontSize: '1.6rem', fontWeight: '900', color: '#fff' }}>OBAD</div>
        <div style={{ display: 'flex', gap: '15px' }}>
          <SignedOut><SignInButton mode="modal"><button style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', padding: '8px 25px', borderRadius: '40px', border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer', backdropFilter: 'blur(10px)' }}>دخول</button></SignInButton></SignedOut>
          <SignedIn><UserButton afterSignOutUrl="/" /></SignedIn>
        </div>
      </nav>

      <div style={{ maxWidth: '850px', margin: '0 auto', padding: '80px 20px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '4.5rem', fontWeight: '900', marginBottom: '15px', letterSpacing: '-2px', background: 'linear-gradient(to bottom, #fff, #999)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>سحر التحسين.</h1>
        <p style={{ color: '#a1a1a6', fontSize: '1.4rem', marginBottom: '50px' }}>ارفع جودة صورك إلى أبعاد خيالية باستخدام ذكاء OBAD.</p>

        {/* أزرار الجودة بنمط زجاجي */}
        <div style={{ display: 'inline-flex', background: 'rgba(255,255,255,0.05)', padding: '5px', borderRadius: '16px', marginBottom: '50px', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}>
          {[ {l:'HD', v:2}, {l:'4K', v:4}, {l:'8K', v:8} ].map(q => (
            <button key={q.v} onClick={() => setScale(q.v)} style={{ 
              padding: '10px 35px', borderRadius: '12px', border: 'none', 
              color: scale === q.v ? '#000' : '#fff', background: scale === q.v ? '#fff' : 'transparent', 
              cursor: 'pointer', fontWeight: '700', transition: '0.4s' 
            }}>{q.l}</button>
          ))}
        </div>

        {/* صندوق الرفع بنمط زجاجي (Glass) */}
        <div {...getRootProps()} style={{ 
          border: `1px solid ${isDragActive ? '#fff' : 'rgba(255,255,255,0.1)'}`, 
          padding: '100px 40px', borderRadius: '40px', 
          backgroundColor: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(25px)', cursor: 'pointer' 
        }}>
          <input {...getInputProps()} />
          <div style={{ fontSize: '60px', marginBottom: '20px' }}>✨</div>
          <p style={{ fontSize: '1.2rem', color: file ? '#fff' : '#a1a1a6' }}>{file ? `جاهز: ${file.name}` : "اسحب الصورة هنا أو اضغط للاختيار"}</p>
        </div>

        {file && !loading && !result && (
          <button onClick={handleUpscale} style={{ marginTop: '40px', backgroundColor: '#fff', color: '#000', padding: '18px 60px', borderRadius: '40px', border: 'none', cursor: 'pointer', fontWeight: '800', fontSize: '1.1rem' }}>بدأ التحسين الآن</button>
        )}

        {loading && <p style={{ marginTop: '40px', color: '#fff', fontSize: '1.1rem' }}>جاري المعالجة بواسطة OBAD AI... انتظر قليلاً ⏳</p>}

        <AnimatePresence>
          {result && (
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: '60px', background: 'rgba(255,255,255,0.03)', padding: '30px', borderRadius: '40px', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)' }}>
              <img src={result} style={{ width: '100%', borderRadius: '25px', marginBottom: '25px' }} />
              <a href={result} download style={{ display: 'inline-block', backgroundColor: '#2997ff', color: '#fff', padding: '12px 40px', borderRadius: '30px', textDecoration: 'none', fontWeight: '700' }}>تحميل النتيجة النهائية</a>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
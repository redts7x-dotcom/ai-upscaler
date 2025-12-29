"use client";
import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion } from 'framer-motion';
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
      
      if (res.ok && data.result) {
        setResult(data.result);
      } else {
        // هنا سيظهر لك الخطأ الحقيقي القادم من Replicate
        alert("فشل المحرك: " + (data.error || "خطأ غير معروف"));
      }
    } catch (e) {
      alert("خطأ في الشبكة: تعذر الوصول للسيرفر");
    } finally {
      setLoading(false);
    }

  const { getRootProps, getInputProps } = useDropzone({
    onDrop: (f) => { setFile(f[0]); setResult(null); },
    accept: { 'image/*': [] }, multiple: false
  });

  return (
    <main dir="rtl" style={{ 
      minHeight: '100vh', backgroundColor: '#000', color: '#fff', 
      backgroundImage: 'radial-gradient(circle at 50% 0%, #1a1a2e 0%, #000 70%)',
      fontFamily: 'system-ui, sans-serif' 
    }}>
      {/* Navbar زجاجي */}
      <nav style={{ 
        display: 'flex', justifyContent: 'space-between', padding: '0 40px', height: '70px', alignItems: 'center',
        backdropFilter: 'blur(30px)', backgroundColor: 'rgba(255,255,255,0.02)',
        borderBottom: '1px solid rgba(255,255,255,0.1)', position: 'sticky', top: 0, zIndex: 100
      }}>
        <div style={{ fontSize: '1.6rem', fontWeight: '900' }}>OBAD</div>
        <div style={{ display: 'flex', gap: '15px' }}>
          <SignedOut><SignInButton mode="modal"><button style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', padding: '8px 25px', borderRadius: '40px', border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer' }}>دخول</button></SignInButton></SignedOut>
          <SignedIn><UserButton afterSignOutUrl="/" /></SignedIn>
        </div>
      </nav>

      <div style={{ maxWidth: '850px', margin: '0 auto', padding: '80px 20px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '4rem', fontWeight: '900', marginBottom: '20px', letterSpacing: '-2px' }}>سحر التحسين.</h1>
        <p style={{ color: '#a1a1a6', fontSize: '1.3rem', marginBottom: '50px' }}>ارفع جودة صورك إلى أبعاد خيالية مع OBAD AI.</p>

        {/* أزرار الجودة الزجاجية */}
        <div style={{ display: 'inline-flex', background: 'rgba(255,255,255,0.05)', padding: '5px', borderRadius: '15px', marginBottom: '50px', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}>
          {[ {l:'HD', v:2}, {l:'4K', v:4}, {l:'8K', v:8} ].map(q => (
            <button key={q.v} onClick={() => setScale(q.v)} style={{ 
              padding: '10px 30px', borderRadius: '12px', border: 'none', 
              color: scale === q.v ? '#000' : '#fff', background: scale === q.v ? '#fff' : 'transparent', 
              cursor: 'pointer', fontWeight: '700', transition: '0.3s' 
            }}>{q.l}</button>
          ))}
        </div>

        {/* صندوق الرفع الزجاجي */}
        <div {...getRootProps()} style={{ 
          border: '1px solid rgba(255,255,255,0.1)', padding: '100px 40px', borderRadius: '40px', 
          backgroundColor: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(20px)', cursor: 'pointer' 
        }}>
          <input {...getInputProps()} />
          <div style={{ fontSize: '50px', marginBottom: '15px' }}>🪄</div>
          <p style={{ color: file ? '#fff' : '#a1a1a6' }}>{file ? `جاهز: ${file.name}` : "اسحب الصورة هنا"}</p>
        </div>

        {file && !loading && !result && (
          <button onClick={handleUpscale} style={{ marginTop: '40px', backgroundColor: '#fff', color: '#000', padding: '16px 50px', borderRadius: '40px', border: 'none', cursor: 'pointer', fontWeight: '800' }}>ابدأ التحسين الآن</button>
        )}

        {loading && <p style={{ marginTop: '40px', color: '#fff' }}>جاري المعالجة... قد يستغرق الأمر دقيقة ⏳</p>}

        {result && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginTop: '60px', background: 'rgba(255,255,255,0.03)', padding: '30px', borderRadius: '40px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <img src={result} style={{ width: '100%', borderRadius: '25px', marginBottom: '20px' }} />
            <a href={result} download style={{ color: '#2997ff', textDecoration: 'none', fontWeight: '700', fontSize: '1.2rem' }}>تحميل الصورة النهائية ←</a>
          </motion.div>
        )}
      </div>
    </main>
  );
}
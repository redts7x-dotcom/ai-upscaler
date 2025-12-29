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
    setLoading(true);
    setResult(null);

    const formData = new FormData();
    formData.append("image", file);
    formData.append("scale", scale);

    try {
      const res = await fetch('/api/upscale', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.result) setResult(data.result);
      else alert("خطأ من المحرك: " + (data.error || "يرجى المحاولة مجدداً"));
    } catch (e) {
      alert("فشل الاتصال: تأكد من صحة REPLICATE_API_TOKEN في Vercel");
    } finally {
      setLoading(false);
    }
  };

  const { getRootProps, getInputProps } = useDropzone({
    onDrop: (f) => { setFile(f[0]); setResult(null); },
    accept: { 'image/*': [] }, multiple: false
  });

  return (
    <main dir="rtl" style={{ 
      minHeight: '100vh', backgroundColor: '#000', color: '#fff', 
      fontFamily: 'system-ui, -apple-system, sans-serif' 
    }}>
      {/* Navbar Glassmorphism */}
      <nav style={{ 
        display: 'flex', justifyContent: 'space-between', padding: '0 40px', 
        height: '64px', alignItems: 'center', backdropFilter: 'blur(20px)',
        backgroundColor: 'rgba(0,0,0,0.7)', borderBottom: '1px solid rgba(255,255,255,0.1)',
        position: 'sticky', top: 0, zIndex: 100
      }}>
        <div style={{ fontSize: '1.4rem', fontWeight: 'bold' }}>OBAD</div>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <SignedOut><SignInButton mode="modal"><button style={{ backgroundColor: '#fff', color: '#000', padding: '8px 18px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontWeight: '600' }}>دخول</button></SignInButton></SignedOut>
          <SignedIn><UserButton afterSignOutUrl="/" /></SignedIn>
        </div>
      </nav>

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '80px 20px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '3.5rem', fontWeight: '800', marginBottom: '20px' }}>سحر التحسين.</h1>
        <p style={{ color: '#86868b', fontSize: '1.2rem', marginBottom: '40px' }}>حول صورك إلى دقة فائقة بلمسة واحدة من OBAD.</p>

        {/* Quality Selector */}
        <div style={{ display: 'inline-flex', background: 'rgba(255,255,255,0.05)', padding: '4px', borderRadius: '12px', marginBottom: '40px' }}>
          {[ {l:'HD', v:2}, {l:'4K', v:4}, {l:'8K', v:8} ].map(q => (
            <button key={q.v} onClick={() => setScale(q.v)} style={{
              padding: '8px 24px', borderRadius: '8px', border: 'none', color: scale === q.v ? '#fff' : '#86868b',
              background: scale === q.v ? 'rgba(255,255,255,0.1)' : 'transparent', cursor: 'pointer', fontWeight: '600'
            }}>{q.l}</button>
          ))}
        </div>

        <div {...getRootProps()} style={{ 
          border: '1px solid rgba(255,255,255,0.1)', padding: '80px', borderRadius: '24px', 
          backgroundColor: 'rgba(255,255,255,0.02)', cursor: 'pointer' 
        }}>
          <input {...getInputProps()} />
          {file ? <p>✅ جاهز: {file.name}</p> : <p>اسحب الصورة هنا أو اضغط للاختيار</p>}
        </div>

        {file && !loading && !result && (
          <button onClick={handleUpscale} style={{ 
            marginTop: '40px', backgroundColor: '#0071e3', color: '#fff', padding: '14px 40px', 
            borderRadius: '25px', border: 'none', cursor: 'pointer', fontWeight: '600' 
          }}>تحسين الصورة الآن</button>
        )}

        {loading && <p style={{ marginTop: '40px', color: '#86868b' }}>جاري المعالجة بواسطة OBAD AI...</p>}

        {result && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginTop: '50px' }}>
            <img src={result} style={{ width: '100%', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)' }} />
            <a href={result} download style={{ display: 'block', marginTop: '20px', color: '#2997ff', textDecoration: 'none', fontWeight: '600' }}>تحميل النتيجة ←</a>
          </motion.div>
        )}
      </div>
    </main>
  );
}
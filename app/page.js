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
    setLoading(true);
    setResult(null);

    const formData = new FormData();
    formData.append("image", file);
    formData.append("scale", scale);

    try {
      const res = await fetch('/api/upscale', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.result) setResult(data.result);
      else alert("تنبيه: " + (data.error || "تأكد من شحن رصيد Replicate أو صحة المفتاح"));
    } catch (e) {
      alert("خطأ في الاتصال بالسيرفر.");
    } finally {
      setLoading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (f) => { setFile(f[0]); setResult(null); },
    accept: { 'image/*': [] }, multiple: false
  });

  return (
    <main dir="rtl" style={{ 
      minHeight: '100vh', backgroundColor: '#000', color: '#fff', 
      backgroundImage: 'radial-gradient(circle at top right, #1e1e2e, #000)',
      fontFamily: 'system-ui, -apple-system, sans-serif' 
    }}>
      
      {/* Navbar زجاجي فائق الشفافية */}
      <nav style={{ 
        display: 'flex', justifyContent: 'space-between', padding: '0 40px', 
        height: '70px', alignItems: 'center', backdropFilter: 'blur(30px)',
        backgroundColor: 'rgba(255, 255, 255, 0.03)', borderBottom: '1px solid rgba(255,255,255,0.1)',
        position: 'sticky', top: 0, zIndex: 100
      }}>
        <div style={{ fontSize: '1.6rem', fontWeight: '900', letterSpacing: '-1px' }}>OBAD</div>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <SignedOut><SignInButton mode="modal"><button style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', padding: '8px 25px', borderRadius: '40px', border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer', backdropFilter: 'blur(10px)' }}>دخول</button></SignInButton></SignedOut>
          <SignedIn><UserButton afterSignOutUrl="/" /></SignedIn>
        </div>
      </nav>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '100px 20px', textAlign: 'center' }}>
        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          style={{ fontSize: '4.5rem', fontWeight: '900', marginBottom: '20px', background: 'linear-gradient(to bottom, #fff, #888)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          سحر التحسين.
        </motion.h1>
        <p style={{ color: '#a1a1a6', fontSize: '1.4rem', marginBottom: '50px' }}>حول صورك إلى دقة خيالية باستخدام OBAD AI.</p>

        {/* أزرار اختيار الجودة الزجاجية */}
        <div style={{ display: 'inline-flex', background: 'rgba(255,255,255,0.05)', padding: '6px', borderRadius: '18px', marginBottom: '50px', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}>
          {[ {l:'HD', v:2}, {l:'4K', v:4}, {l:'8K', v:8} ].map(q => (
            <button key={q.v} onClick={() => setScale(q.v)} style={{ 
              padding: '10px 30px', borderRadius: '14px', border: 'none', 
              color: scale === q.v ? '#000' : '#fff', 
              background: scale === q.v ? '#fff' : 'transparent', 
              cursor: 'pointer', fontWeight: '700', transition: '0.4s' 
            }}>{q.l}</button>
          ))}
        </div>

        {/* منطقة الرفع الزجاجية */}
        <motion.div {...getRootProps()} whileHover={{ scale: 1.01 }}
          style={{ 
            border: `1px solid ${isDragActive ? '#fff' : 'rgba(255,255,255,0.15)'}`, 
            padding: '100px 40px', borderRadius: '35px', 
            backgroundColor: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(20px)',
            cursor: 'pointer', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
          }}>
          <input {...getInputProps()} />
          <div style={{ fontSize: '50px', marginBottom: '20px' }}>✨</div>
          <p style={{ fontSize: '1.2rem', color: file ? '#fff' : '#a1a1a6' }}>
            {file ? `✅ جاهز للمعالجة: ${file.name}` : "اسحب الصورة هنا أو اضغط للاختيار"}
          </p>
        </motion.div>

        {file && !loading && !result && (
          <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            onClick={handleUpscale} 
            style={{ 
              marginTop: '50px', backgroundColor: '#fff', color: '#000', 
              padding: '18px 60px', borderRadius: '40px', border: 'none', 
              cursor: 'pointer', fontWeight: '800', fontSize: '1.1rem',
              boxShadow: '0 0 30px rgba(255,255,255,0.2)'
            }}>تحسين إلى {scale === 2 ? 'HD' : scale === 4 ? '4K' : '8K'} الآن</motion.button>
        )}

        {loading && <div style={{ marginTop: '50px' }}><p style={{ color: '#fff', fontSize: '1.2rem' }}>جاري المعالجة بواسطة OBAD AI... انتظر قليلاً ⏳</p></div>}

        {result && (
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            style={{ 
              marginTop: '60px', padding: '30px', borderRadius: '40px', 
              backgroundColor: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.1)'
            }}>
            <img src={result} style={{ width: '100%', borderRadius: '25px', marginBottom: '25px', boxShadow: '0 20px 40px rgba(0,0,0,0.6)' }} />
            <a href={result} download style={{ display: 'inline-block', backgroundColor: '#2997ff', color: '#fff', padding: '12px 35px', borderRadius: '30px', textDecoration: 'none', fontWeight: '700' }}>تحميل النتيجة النهائية</a>
          </motion.div>
        )}
      </div>
    </main>
  );
}
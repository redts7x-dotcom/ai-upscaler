"use client";
import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";

export default function Home() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [scale, setScale] = useState(2); // الافتراضي HD (2x)

  const handleUpscale = async () => {
    if (!file) return;
    setLoading(true);
    setResult(null);

    const formData = new FormData();
    formData.append("image", file);
    formData.append("scale", scale);

    try {
      const res = await fetch('/api/upscale', { 
        method: 'POST', 
        body: formData 
      });
      
      if (!res.ok) throw new Error("Server responded with error");
      
      const data = await res.json();
      if (data.result) setResult(data.result);
      else alert("خطأ من السيرفر: " + (data.error || "حاول مرة أخرى"));
    } catch (e) {
      console.error(e);
      alert("فشل الاتصال: تأكد من إضافة REPLICATE_API_TOKEN في Vercel");
    } finally {
      setLoading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (files) => { setFile(files[0]); setResult(null); },
    accept: { 'image/*': [] },
    multiple: false
  });

  return (
    <main style={{ 
      minHeight: '100vh', backgroundColor: '#000', 
      backgroundImage: 'radial-gradient(circle at 50% -20%, #1a1a1a, #000)',
      color: '#fff', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' 
    }}>
      
      {/* Navbar */}
      <nav style={{ 
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
        padding: '0 40px', height: '64px', position: 'sticky', top: 0, zIndex: 100,
        backgroundColor: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <div style={{ fontSize: '1.2rem', fontWeight: '700' }}>OBAD</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <SignedOut><SignInButton mode="modal"><button style={{ backgroundColor: '#fff', color: '#000', padding: '6px 16px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontWeight: '600' }}>Sign In</button></SignInButton></SignedOut>
          <SignedIn><UserButton afterSignOutUrl="/" /></SignedIn>
        </div>
      </nav>

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '60px 20px', textAlign: 'center' }}>
        <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ fontSize: '48px', fontWeight: '800', marginBottom: '40px' }}>Magic Upscaling.</motion.h1>

        {/* اختيار الجودة - Apple Style Segmented Control */}
        <div style={{ 
          display: 'inline-flex', backgroundColor: 'rgba(255,255,255,0.05)', 
          padding: '4px', borderRadius: '12px', marginBottom: '30px', border: '1px solid rgba(255,255,255,0.1)' 
        }}>
          {[
            { label: 'HD (2x)', value: 2 },
            { label: '4K (4x)', value: 4 },
            { label: '8K (8x)', value: 8 }
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => setScale(opt.value)}
              style={{
                padding: '8px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                backgroundColor: scale === opt.value ? 'rgba(255,255,255,0.15)' : 'transparent',
                color: scale === opt.value ? '#fff' : '#86868b',
                fontWeight: scale === opt.value ? '600' : '400',
                transition: '0.2s'
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Dropzone */}
        <motion.div {...getRootProps()} style={{ 
          backgroundColor: 'rgba(255, 255, 255, 0.02)', borderRadius: '24px', 
          padding: '60px 40px', cursor: 'pointer', border: `1px dashed ${isDragActive ? '#fff' : 'rgba(255,255,255,0.1)'}`
        }}>
          <input {...getInputProps()} />
          <p style={{ fontSize: '18px', color: file ? '#fff' : '#86868b' }}>
            {file ? `Selected: ${file.name}` : "Drag image here"}
          </p>
        </motion.div>

        {file && !loading && !result && (
          <button onClick={handleUpscale} style={{ marginTop: '30px', backgroundColor: '#0071e3', color: '#fff', padding: '12px 40px', borderRadius: '24px', border: 'none', cursor: 'pointer', fontWeight: '600' }}>
            Upscale to {scale === 2 ? 'HD' : scale === 4 ? '4K' : '8K'}
          </button>
        )}

        {loading && <div style={{ marginTop: '30px', color: '#86868b' }}>Processing with OBAD AI Engine...</div>}

        {result && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: '40px' }}>
            <img src={result} alt="Result" style={{ width: '100%', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)' }} />
            <a href={result} download style={{ display: 'block', marginTop: '20px', color: '#2997ff', textDecoration: 'none', fontWeight: '600' }}>Download High-Res Image →</a>
          </motion.div>
        )}
      </div>
    </main>
  );
}
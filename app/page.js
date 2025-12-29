"use client";
import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";

export default function Home() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [scale, setScale] = useState(4);

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
      else alert("Error: " + (data.error || "Unknown error"));
    } catch (e) {
      alert("Connection failed");
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
      minHeight: '100vh', 
      backgroundColor: '#000', 
      backgroundImage: 'radial-gradient(circle at 50% -20%, #1a1a1a, #000)',
      color: '#fff', 
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' 
    }}>
      
      {/* --- Navbar الزجاجي --- */}
      <nav style={{ 
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
        padding: '0 40px', height: '64px',
        position: 'sticky', top: 0, zIndex: 100,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <div style={{ fontSize: '1.2rem', fontWeight: '700', letterSpacing: '-0.5px' }}>OBAD</div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <SignedOut>
            <SignInButton mode="modal">
              <button style={{ 
                backgroundColor: '#fff', color: '#000', padding: '6px 16px', 
                borderRadius: '20px', fontSize: '14px', fontWeight: '500', 
                border: 'none', cursor: 'pointer', transition: '0.2s' 
              }}>Sign In</button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </div>
      </nav>

      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '80px 20px', textAlign: 'center' }}>
        
        {/* --- العنوان الرئيسي --- */}
        <motion.h1 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          style={{ fontSize: '56px', fontWeight: '800', marginBottom: '16px', letterSpacing: '-2px' }}
        >
          Magic Upscaling.
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          style={{ fontSize: '24px', color: '#86868b', marginBottom: '60px', fontWeight: '400' }}
        >
          Transform your images with AI. Purely beautiful.
        </motion.p>

        {/* --- منطقة الرفع الزجاجية --- */}
        <motion.div 
          {...getRootProps()}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          style={{ 
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            backdropFilter: 'blur(10px)',
            border: `1px solid ${isDragActive ? '#fff' : 'rgba(255, 255, 255, 0.1)'}`,
            borderRadius: '24px', padding: '80px 40px', cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
        >
          <input {...getInputProps()} />
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>📸</div>
          <p style={{ fontSize: '18px', color: '#f5f5f7' }}>
            {file ? `Ready: ${file.name}` : "Drop your image here or browse"}
          </p>
        </motion.div>

        {/* --- أزرار التحكم --- */}
        <AnimatePresence>
          {file && !loading && !result && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <button 
                onClick={handleUpscale}
                style={{ 
                  marginTop: '40px', backgroundColor: '#0071e3', color: '#fff', 
                  padding: '12px 32px', borderRadius: '24px', fontSize: '17px', 
                  fontWeight: '600', border: 'none', cursor: 'pointer' 
                }}
              >
                Upscale Now
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {loading && <p style={{ marginTop: '40px', color: '#86868b' }}>Processing with OBAD AI...</p>}

        {/* --- صندوق النتيجة الزجاجي --- */}
        {result && (
          <motion.div 
            initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}
            style={{ 
              marginTop: '60px', padding: '24px', 
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              borderRadius: '32px', border: '1px solid rgba(255, 255, 255, 0.1)'
            }}
          >
            <h3 style={{ marginBottom: '20px', fontSize: '20px' }}>Result</h3>
            <img src={result} alt="Result" style={{ width: '100%', borderRadius: '16px', marginBottom: '20px' }} />
            <a 
              href={result} download 
              style={{ 
                color: '#2997ff', textDecoration: 'none', fontWeight: '600', fontSize: '17px' 
              }}
            >
              Download Image →
            </a>
          </motion.div>
        )}
      </div>
    </main>
  );
}
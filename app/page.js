"use client";
import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion } from 'framer-motion';
// استيراد أدوات Clerk
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";

export default function Home() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [scale, setScale] = useState(4); // القيمة الافتراضية 4
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isResizing, setIsResizing] = useState(false);

  const downloadImage = async (url) => {
    setDownloading(true);
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `Upscale_${scale}x_${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      window.open(url, '_blank');
    }
    setDownloading(false);
  };

  const onDrop = async (acceptedFiles) => {
    const f = acceptedFiles[0];
    if (f) setFile(f);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    multiple: false
  });

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#000', color: '#fff' }}>
      
      {/* --- بداية شريط التنقل (Navbar) --- */}
      <nav style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        padding: '15px 30px', 
        borderBottom: '1px solid #222',
        backgroundColor: '#050505'
      }}>
        <div style={{ fontSize: '1.4rem', fontWeight: 'bold', letterSpacing: '1px' }}>
          AI UPSCALER
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          {/* يظهر هذا الجزء إذا كان المستخدم غير مسجل دخول */}
          <SignedOut>
            <SignInButton mode="modal">
              <button style={{ 
                backgroundColor: '#fff', 
                color: '#000', 
                padding: '8px 20px', 
                borderRadius: '20px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: '600',
                transition: '0.3s'
              }}>
                تسجيل الدخول
              </button>
            </SignInButton>
          </SignedOut>

          {/* يظهر هذا الجزء (أيقونة الحساب) إذا سجل المستخدم دخوله */}
          <SignedIn>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </div>
      </nav>
      {/* --- نهاية شريط التنقل --- */}

      <div style={{ padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ width: '100%', maxWidth: '600px' }}
        >
          {/* منطقة رفع الصور (Dropzone) */}
          <div {...getRootProps()} style={{
            border: '2px dashed #444',
            borderRadius: '15px',
            padding: '40px',
            textAlign: 'center',
            cursor: 'pointer',
            backgroundColor: isDragActive ? '#111' : 'transparent',
            transition: '0.3s'
          }}>
            <input {...getInputProps()} />
            {file ? <p>تم اختيار: {file.name}</p> : <p>اسحب الصورة هنا أو اضغط للاختيار</p>}
          </div>

          {/* باقي أزرار التحكم والنتائج تظهر هنا */}
          {file && (
            <div style={{ marginTop: '30px', textAlign: 'center' }}>
               {/* هنا تكملة أزرار الـ Scale والـ Upscale الخاصة بك */}
               <button style={{ padding: '10px 30px', borderRadius: '10px', marginTop: '20px', cursor: 'pointer' }}>
                 تحسين الصورة الآن
               </button>
            </div>
          )}
        </motion.div>
      </div>

    </main>
  );
}
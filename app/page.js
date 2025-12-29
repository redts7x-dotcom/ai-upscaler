"use client";
import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion } from 'framer-motion';

export default function Home() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const onDrop = async (acceptedFiles) => {
    const f = acceptedFiles[0];
    if (!f) return;
    
    setFile(URL.createObjectURL(f));
    setResult(null);
    setLoading(true);

    const formData = new FormData();
    formData.append("image", f);

    try {
      const res = await fetch('/api/upscale', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      
      if (res.ok && data.result) {
        setResult(data.result);
      } else {
        alert(data.error || "حدث خطأ");
      }
    } catch (e) {
      alert("خطأ في الاتصال");
    }
    setLoading(false);
  };

  const { getRootProps, getInputProps } = useDropzone({ onDrop });

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-10 font-sans">
      <h1 className="text-5xl font-bold mb-10 text-blue-500">مكبر الصور الذكي</h1>

      {!result && (
        <div {...getRootProps()} className="border-2 border-dashed border-gray-700 p-20 rounded-2xl cursor-pointer hover:border-blue-500">
          <input {...getInputProps()} />
          {loading ? <p className="animate-pulse text-blue-400">جاري التكبير بأقصى جودة (A100)...</p> : <p>اضغط أو اسحب الصورة هنا</p>}
        </div>
      )}

      {result && (
        <div className="flex flex-col items-center mt-10 bg-gray-900 p-8 rounded-3xl">
          <img src={result} className="max-h-96 rounded-lg border-2 border-blue-500 shadow-lg mb-6"/>
          
          <div className="flex gap-4">
            {/* --- هذا هو الزر السحري الجديد --- */}
            <a 
              href={result} 
              target="_blank" 
              rel="noopener noreferrer"
              className="bg-green-600 text-white px-8 py-3 rounded-full font-bold hover:bg-green-500 transition-transform hover:scale-105 flex items-center gap-2"
            >
              ⬇️ فتح الصورة الأصلية (كاملة الحجم)
            </a>
            {/* ------------------------------- */}
            
            <button onClick={() => {setResult(null); setFile(null);}} className="text-gray-400 px-4">
              صورة جديدة
            </button>
          </div>
          <p className="mt-4 text-xs text-gray-500">اضغط الزر الأخضر لفتح الصورة بحجمها الكامل ثم احفظها</p>
        </div>
      )}
    </div>
  );
}
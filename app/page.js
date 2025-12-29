"use client";
import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion } from 'framer-motion';

export default function Home() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false); // حالة جديدة لزر التحميل

  // --- 1. دالة التحميل الجديدة (لسحب الجودة الأصلية) ---
  const downloadImage = async (url) => {
    setDownloading(true);
    try {
      // جلب الملف الأصلي من رابط Replicate كبيانات خام (Blob)
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      
      // إنشاء رابط مخفي للتحميل
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `upscaled_image_${Date.now()}.png`; // اسم الملف عند الحفظ
      document.body.appendChild(link);
      link.click();
      
      // تنظيف الذاكرة بعد التحميل
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("فشل التحميل، جاري الفتح في نافذة جديدة", error);
      window.open(url, '_blank');
    }
    setDownloading(false);
  };
  // -------------------------------------------------------

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
        console.error("خطأ من السيرفر:", data.error);
        alert(data.error || "لم يتم استلام الصورة، تحقق من السيرفر");
      }
    } catch (e) {
      console.error(e);
      alert("حدث خطأ في الاتصال");
    }
    setLoading(false);
  };

  const { getRootProps, getInputProps } = useDropzone({ onDrop });

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-10 font-sans">
      <motion.h1 
        initial={{ opacity: 0, y: -20 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="text-5xl md:text-6xl font-bold mb-10 bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent text-center">
        مكبر الصور الذكي
      </motion.h1>

      {!result && (
        <div {...getRootProps()} className={`w-full max-w-xl border-2 border-dashed border-gray-700 p-20 rounded-2xl cursor-pointer hover:border-blue-500 transition-colors bg-gray-900/50 text-center ${loading ? 'pointer-events-none' : ''}`}>
          <input {...getInputProps()} />
          {loading ? (
             <div className="text-blue-400 animate-pulse flex flex-col items-center gap-4">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <p>جاري معالجة البكسلات... (قد تأخذ 10 ثواني)</p>
             </div>
          ) : (
             <div>
                <p className="text-xl font-bold mb-2">اسحب الصورة هنا</p>
                <p className="text-gray-400">أو اضغط لاختيار ملف</p>
             </div>
          )}
        </div>
      )}

      {result && (
        <div className="flex flex-col md:flex-row gap-10 mt-10 items-center bg-gray-900 p-8 rounded-3xl border border-gray-800 animate-fade-in-up">
          <div className="text-center">
            <p className="mb-2 text-gray-500">الأصلية</p>
            <img src={file} className="max-h-64 rounded-lg border border-gray-800 opacity-70"/>
          </div>
          
          <div className="text-2xl text-gray-600">➜</div>

          <div className="text-center">
            <p className="mb-2 text-blue-400 font-bold">بعد التكبير (AI)</p>
            {/* عرض الصورة فقط */}
            <img src={result} className="max-h-80 rounded-lg border-2 border-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.5)]"/>
            
            <div className="mt-6 flex gap-4 justify-center">
                {/* --- 2. تم تغيير الزر هنا لاستخدام الدالة الجديدة --- */}
                <button 
                  onClick={() => downloadImage(result)} 
                  disabled={downloading}
                  className={`bg-white text-black px-6 py-2 rounded-full font-bold hover:bg-gray-200 cursor-pointer transition-transform hover:scale-105 flex items-center gap-2 ${downloading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {downloading ? 'جاري التحميل...' : 'تحميل الجودة الأصلية'}
                </button>
                {/* ------------------------------------------------ */}

                <button onClick={() => {setResult(null); setFile(null);}} className="text-gray-400 hover:text-white px-4">
                  صورة جديدة
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
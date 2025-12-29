"use client";
import { useState, useRef, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion } from 'framer-motion';

export default function Home() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isResizing, setIsResizing] = useState(false);

  // --- دالة التحميل الذكية ---
  const downloadImage = async (url) => {
    setDownloading(true);
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `Pro_Upscale_${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      window.open(url, '_blank');
    }
    setDownloading(false);
  };
  // -------------------------

  const onDrop = async (acceptedFiles) => {
    const f = acceptedFiles[0];
    if (!f) return;
    setFile(URL.createObjectURL(f));
    setResult(null);
    setLoading(true);

    const formData = new FormData();
    formData.append("image", f);

    try {
      const res = await fetch('/api/upscale', { method: 'POST', body: formData });
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

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  // منطق شريط المقارنة (Slider)
  const handleMouseDown = () => setIsResizing(true);
  const handleMouseUp = () => setIsResizing(false);
  const handleMouseMove = (e) => {
    if (!isResizing) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percent);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-purple-500 selection:text-white overflow-x-hidden relative">
      {/* خلفية جمالية */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-900/30 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-900/20 rounded-full blur-[120px] animate-pulse delay-1000"></div>
      </div>

      <main className="container mx-auto px-4 py-20 flex flex-col items-center">
        
        {/* العنوان */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="text-center mb-16 space-y-4"
        >
          <h1 className="text-6xl md:text-7xl font-extrabold bg-gradient-to-br from-white via-gray-200 to-gray-500 bg-clip-text text-transparent tracking-tight">
            Pro Upscaler
          </h1>
          <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto font-light">
            حول صورك القديمة إلى دقة <span className="text-blue-400 font-bold">4K</span> باستخدام أحدث تقنيات الذكاء الاصطناعي.
          </p>
        </motion.div>

        {/* منطقة الرفع */}
        {!result && (
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            {...getRootProps()} 
            className={`
              w-full max-w-2xl h-80 rounded-3xl border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center cursor-pointer group
              ${isDragActive ? 'border-blue-500 bg-blue-500/10' : 'border-gray-700 hover:border-blue-400/50 hover:bg-white/5'}
              ${loading ? 'pointer-events-none border-none' : ''}
            `}
          >
            <input {...getInputProps()} />
            
            {loading ? (
              <div className="flex flex-col items-center gap-6 w-full max-w-xs">
                <div className="relative w-20 h-20">
                   <div className="absolute inset-0 border-4 border-gray-700 rounded-full"></div>
                   <div className="absolute inset-0 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
                </div>
                <div className="text-center space-y-2">
                  <p className="text-xl font-bold text-white animate-pulse">جاري المعالجة...</p>
                  <p className="text-sm text-gray-400">نرفع الجودة ونحسن التفاصيل (A100)</p>
                </div>
              </div>
            ) : (
              <div className="text-center space-y-4 group-hover:scale-105 transition-transform">
                <div className="w-16 h-16 bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-2 text-3xl shadow-lg shadow-black/50">
                  📷
                </div>
                <p className="text-2xl font-bold text-gray-200">اسحب صورتك هنا</p>
                <p className="text-gray-500 text-sm">أو اضغط لفتح الاستوديو</p>
              </div>
            )}
          </motion.div>
        )}

        {/* النتيجة والمقارنة */}
        {result && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-4xl bg-gray-900/60 backdrop-blur-xl border border-white/10 p-2 rounded-3xl shadow-2xl overflow-hidden"
          >
            {/* شريط الأدوات العلوي */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-white/5">
              <span className="text-gray-400 text-sm">✨ تم التحسين بنجاح</span>
              <button 
                onClick={() => {setResult(null); setFile(null);}} 
                className="text-sm text-red-400 hover:text-red-300 transition-colors"
              >
                حذف ورفع جديدة
              </button>
            </div>

            {/* منطقة المقارنة (Slider) */}
            <div 
              className="relative w-full h-[500px] cursor-ew-resize select-none bg-black group"
              onMouseMove={handleMouseMove}
              onMouseDown={handleMouseDown}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchMove={(e) => {
                 const rect = e.currentTarget.getBoundingClientRect();
                 const x = e.touches[0].clientX - rect.left;
                 setSliderPosition(Math.max(0, Math.min(100, (x / rect.width) * 100)));
              }}
            >
              {/* الصورة الأصلية (الخلفية) */}
              <img src={file} className="absolute inset-0 w-full h-full object-contain opacity-50 blur-sm scale-105" alt="Blur BG" />
              <img src={file} className="absolute inset-0 w-full h-full object-contain" alt="Original" />
              
              {/* الصورة المحسنة (المقصوصة) */}
              <div 
                className="absolute inset-0 w-full h-full overflow-hidden"
                style={{ clipPath: `polygon(${sliderPosition}% 0, 100% 0, 100% 100%, ${sliderPosition}% 100%)` }}
              >
                 <img src={result} className="absolute inset-0 w-full h-full object-contain" alt="Enhanced" />
                 {/* علامة HD */}
                 <div className="absolute top-4 right-4 bg-blue-600/90 text-white text-xs font-bold px-2 py-1 rounded shadow-lg backdrop-blur">
                   AFTER (AI)
                 </div>
              </div>

              {/* علامة الأصلية */}
              <div className="absolute top-4 left-4 bg-gray-800/80 text-white text-xs font-bold px-2 py-1 rounded shadow-lg backdrop-blur">
                BEFORE
              </div>

              {/* الخط الفاصل */}
              <div 
                className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize shadow-[0_0_20px_rgba(0,0,0,0.5)] z-10 flex items-center justify-center"
                style={{ left: `${sliderPosition}%` }}
              >
                <div className="w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-900 text-xs font-bold">
                  ⬌
                </div>
              </div>
            </div>

            {/* منطقة التحميل */}
            <div className="p-8 flex flex-col md:flex-row items-center justify-between gap-6 bg-black/20">
              <div className="text-center md:text-left">
                 <h3 className="text-xl font-bold text-white mb-1">جاهزة للتحميل 🚀</h3>
                 <p className="text-gray-400 text-sm">الدقة: فائقة الجودة (Super Resolution)</p>
              </div>
              
              <div className="flex gap-4">
                 <button 
                   onClick={() => downloadImage(result)}
                   disabled={downloading}
                   className={`
                     px-8 py-3 rounded-xl font-bold text-white shadow-lg transition-all hover:scale-105 active:scale-95 flex items-center gap-2
                     ${downloading ? 'bg-gray-600 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:shadow-blue-500/30'}
                   `}
                 >
                   {downloading ? 'جاري التحميل...' : '📥 تحميل الجودة الأصلية'}
                 </button>
              </div>
            </div>
          </motion.div>
        )}

        <footer className="mt-20 text-gray-600 text-sm">
          Powered by <span className="text-gray-500 font-semibold">Replicate A100</span>
        </footer>

      </main>
    </div>
  );
}
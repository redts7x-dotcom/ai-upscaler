"use client";
import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion } from 'framer-motion';

export default function Home() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [scale, setScale] = useState(4); // القيمة الافتراضية 4x
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
    if (!f) return;
    setFile(URL.createObjectURL(f));
    setResult(null);
    setLoading(true);

    const formData = new FormData();
    formData.append("image", f);
    formData.append("scale", scale); // إرسال خيار المستخدم

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

  const handleMouseMove = (e) => {
    if (!isResizing) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percent);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans overflow-x-hidden relative selection:bg-blue-500 selection:text-white">
      {/* خلفية حية */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-900/20 rounded-full blur-[150px] animate-pulse"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-900/20 rounded-full blur-[150px] animate-pulse delay-700"></div>
      </div>

      <main className="container mx-auto px-4 py-16 flex flex-col items-center">
        
        <motion.h1 
          initial={{ opacity: 0, y: -20 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent text-center"
        >
          Pro Upscaler
        </motion.h1>

        {/* --- شريط اختيار الجودة الزجاجي --- */}
        {!loading && !result && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-8 p-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-full flex gap-1 shadow-2xl"
          >
            {[
              { label: 'HD (2x)', value: 2, color: 'hover:text-green-400' },
              { label: '4K (4x)', value: 4, color: 'hover:text-blue-400' },
              { label: '8K (8x)', value: 8, color: 'hover:text-purple-400' },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => setScale(opt.value)}
                className={`
                  px-6 py-2 rounded-full text-sm font-bold transition-all duration-300
                  ${scale === opt.value 
                    ? 'bg-white text-black shadow-lg scale-105' 
                    : `text-gray-400 hover:bg-white/5 ${opt.color}`}
                `}
              >
                {opt.label}
              </button>
            ))}
          </motion.div>
        )}
        {/* ---------------------------------- */}

        {!result && (
          <div 
            {...getRootProps()} 
            className={`
              w-full max-w-2xl h-72 rounded-3xl border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center cursor-pointer
              ${isDragActive ? 'border-blue-500 bg-blue-500/10' : 'border-gray-800 hover:border-gray-600 hover:bg-white/5'}
              ${loading ? 'pointer-events-none opacity-50' : ''}
            `}
          >
            <input {...getInputProps()} />
            {loading ? (
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-blue-400 animate-pulse">جاري تحويل الصورة إلى {scale === 2 ? 'HD' : scale === 4 ? '4K' : '8K'}...</p>
              </div>
            ) : (
              <div className="text-center space-y-2">
                <span className="text-4xl">📥</span>
                <p className="text-xl font-medium text-gray-300">ارفع صورتك هنا</p>
                <p className="text-sm text-gray-500">الجودة المختارة: <span className="text-blue-400 font-bold">{scale}x</span></p>
              </div>
            )}
          </div>
        )}

        {result && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-4xl bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl mt-8"
          >
            {/* Slider Comparison */}
            <div 
              className="relative w-full h-[500px] cursor-ew-resize select-none bg-black/50 group"
              onMouseMove={handleMouseMove}
              onMouseDown={() => setIsResizing(true)}
              onMouseUp={() => setIsResizing(false)}
              onMouseLeave={() => setIsResizing(false)}
              onTouchMove={(e) => {
                 const rect = e.currentTarget.getBoundingClientRect();
                 const x = e.touches[0].clientX - rect.left;
                 setSliderPosition(Math.max(0, Math.min(100, (x / rect.width) * 100)));
              }}
            >
              <img src={file} className="absolute inset-0 w-full h-full object-contain opacity-50 blur-lg scale-110" />
              <img src={file} className="absolute inset-0 w-full h-full object-contain" />
              <div className="absolute inset-0 w-full h-full overflow-hidden" style={{ clipPath: `polygon(${sliderPosition}% 0, 100% 0, 100% 100%, ${sliderPosition}% 100%)` }}>
                 <img src={result} className="absolute inset-0 w-full h-full object-contain" />
                 <div className="absolute top-4 right-4 bg-blue-600/90 text-white text-[10px] font-bold px-2 py-1 rounded backdrop-blur">AFTER ({scale}x)</div>
              </div>
              <div className="absolute top-4 left-4 bg-gray-800/80 text-white text-[10px] font-bold px-2 py-1 rounded backdrop-blur">BEFORE</div>
              <div className="absolute top-0 bottom-0 w-0.5 bg-white cursor-ew-resize shadow-[0_0_15px_rgba(255,255,255,0.8)] z-10" style={{ left: `${sliderPosition}%` }}>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg text-black text-xs">↔</div>
              </div>
            </div>

            <div className="p-6 flex flex-wrap justify-between items-center gap-4 border-t border-white/10">
              <div>
                <h3 className="text-lg font-bold text-white">تمت المعالجة بنجاح ✨</h3>
                <p className="text-gray-400 text-sm">مستوى التكبير: {scale} أضعاف</p>
              </div>
              <div className="flex gap-3">
                 <button onClick={() => downloadImage(result)} disabled={downloading} className="bg-white text-black px-6 py-2 rounded-full font-bold hover:scale-105 transition-transform flex items-center gap-2">
                   {downloading ? 'جاري التحميل...' : '⬇️ تحميل'}
                 </button>
                 <button onClick={() => {setResult(null); setFile(null);}} className="bg-white/10 text-white px-6 py-2 rounded-full font-bold hover:bg-white/20 transition-colors">
                   صورة جديدة
                 </button>
              </div>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}
// Final start
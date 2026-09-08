import React, { useState, useRef, MouseEvent, useCallback } from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  X, 
  Maximize2, 
  Sliders, 
  Sparkles,
  Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ImageZoomProps {
  src: string;
  alt: string;
}

export default function ImageZoom({ src, alt }: ImageZoomProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<number>(2.4);
  const [zoomPosition, setZoomPosition] = useState({ x: 50, y: 50 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalZoomScale, setModalZoomScale] = useState(1.5);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);

  // Smooth mouse move tracking with requestAnimationFrame for 60fps+ fluid rendering
  const handleMouseMove = useCallback((e: MouseEvent<HTMLDivElement>) => {
    if (!imageContainerRef.current) return;
    const { left, top, width, height } = imageContainerRef.current.getBoundingClientRect();
    const rawX = ((e.clientX - left) / width) * 100;
    const rawY = ((e.clientY - top) / height) * 100;
    const clampedX = Math.max(0, Math.min(100, rawX));
    const clampedY = Math.max(0, Math.min(100, rawY));

    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
    rafRef.current = requestAnimationFrame(() => {
      setZoomPosition({ x: clampedX, y: clampedY });
    });
  }, []);

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
  };

  const zoomIn = () => setModalZoomScale(prev => Math.min(prev + 0.5, 4));
  const zoomOut = () => setModalZoomScale(prev => Math.max(prev - 0.5, 1));
  const resetZoom = () => setModalZoomScale(1);

  return (
    <>
      {/* Main Interactive Product Image Container */}
      <div 
        ref={imageContainerRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`relative aspect-square w-full rounded-3xl overflow-hidden bg-gray-50 dark:bg-gray-900 border transition-all duration-300 cursor-crosshair group shadow-sm select-none ${
          isHovered 
            ? 'border-indigo-400 dark:border-indigo-500 ring-4 ring-indigo-500/10 shadow-lg' 
            : 'border-gray-100 dark:border-gray-800'
        }`}
      >
        {/* Zoomed Image with Smooth Easing */}
        <img
          src={src}
          alt={alt}
          style={{
            transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`,
            transform: isHovered ? `scale(${zoomLevel})` : 'scale(1)',
            transition: isHovered 
              ? 'transform 0.15s cubic-bezier(0.2, 0, 0, 1)' 
              : 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
          className="w-full h-full object-cover will-change-transform pointer-events-none"
          referrerPolicy="no-referrer"
        />

        {/* Dynamic Zoom Lens Crosshair / Highlight Indicator */}
        {isHovered && (
          <div 
            className="absolute pointer-events-none w-24 h-24 rounded-full border border-white/60 bg-white/10 shadow-2xl backdrop-blur-[1px] -translate-x-1/2 -translate-y-1/2 transition-opacity duration-200"
            style={{
              left: `${zoomPosition.x}%`,
              top: `${zoomPosition.y}%`
            }}
          />
        )}

        {/* Top Control Overlay */}
        <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
          {/* Zoom Level Switcher */}
          <div 
            className={`flex items-center gap-1 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md rounded-2xl p-1 shadow-sm border border-gray-100 dark:border-gray-800 transition-opacity duration-200 ${
              isHovered ? 'opacity-100' : 'opacity-0 sm:opacity-75 sm:group-hover:opacity-100'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {[2.0, 2.5, 3.0].map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => setZoomLevel(lvl)}
                className={`px-2 py-1 rounded-xl text-[10px] font-bold transition-all cursor-pointer ${
                  zoomLevel === lvl
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
                title={`Set zoom scale to ${lvl}x`}
              >
                {lvl}x
              </button>
            ))}
          </div>

          {/* Fullscreen Inspector Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsModalOpen(true);
              setModalZoomScale(1.5);
            }}
            title="Inspect in ultra-high resolution lightbox"
            className="p-2.5 rounded-2xl bg-white/90 dark:bg-gray-900/90 text-gray-700 dark:text-gray-200 backdrop-blur-md shadow-sm border border-gray-100 dark:border-gray-800 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-500 transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 text-xs font-bold"
          >
            <Maximize2 className="h-4 w-4" />
            <span className="hidden sm:inline">Inspect</span>
          </button>
        </div>

        {/* Bottom Hover Hint Badge */}
        <div className={`absolute bottom-4 left-4 pointer-events-none transition-all duration-300 ${
          isHovered ? 'opacity-0 translate-y-2' : 'opacity-90 group-hover:opacity-100 translate-y-0'
        }`}>
          <div className="px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md text-white text-[11px] font-semibold flex items-center gap-1.5 shadow-md">
            <ZoomIn className="h-3.5 w-3.5 text-indigo-300" />
            <span>Hover to zoom ({zoomLevel}x)</span>
          </div>
        </div>

      </div>

      {/* Fullscreen Interactive Lightbox Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-4 sm:p-8"
            onClick={() => setIsModalOpen(false)}
          >
            {/* Top Toolbar */}
            <div 
              className="absolute top-4 right-4 sm:top-6 sm:right-6 flex items-center gap-3 z-50"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center gap-1 bg-white/10 backdrop-blur-md rounded-2xl p-1.5 border border-white/10 shadow-lg">
                <button
                  type="button"
                  onClick={zoomOut}
                  disabled={modalZoomScale <= 1}
                  className="p-2 text-white hover:bg-white/20 rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  title="Zoom Out"
                >
                  <ZoomOut className="h-5 w-5" />
                </button>
                <span className="text-white text-xs font-mono font-bold px-2.5">
                  {Math.round(modalZoomScale * 100)}%
                </span>
                <button
                  type="button"
                  onClick={zoomIn}
                  disabled={modalZoomScale >= 4}
                  className="p-2 text-white hover:bg-white/20 rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  title="Zoom In"
                >
                  <ZoomIn className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={resetZoom}
                  className="p-2 text-white hover:bg-white/20 rounded-xl transition-all cursor-pointer"
                  title="Reset Zoom"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2.5 rounded-2xl bg-white/10 hover:bg-red-500 text-white backdrop-blur-md transition-all active:scale-95 cursor-pointer border border-white/10"
                title="Close"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Modal Image Display */}
            <div 
              className="max-w-5xl max-h-[80vh] overflow-auto rounded-3xl p-4 flex items-center justify-center cursor-grab active:cursor-grabbing custom-scrollbar"
              onClick={e => e.stopPropagation()}
            >
              <img
                src={src}
                alt={alt}
                style={{
                  transform: `scale(${modalZoomScale})`,
                  transition: 'transform 0.2s cubic-bezier(0.2, 0, 0, 1)'
                }}
                className="max-h-[75vh] w-auto object-contain rounded-2xl select-none shadow-2xl"
                referrerPolicy="no-referrer"
              />
            </div>
            
            <div className="flex items-center gap-2 text-white/70 text-xs mt-4 bg-white/5 px-4 py-2 rounded-full backdrop-blur-sm border border-white/10">
              <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
              <span>Use zoom buttons or click and scroll to pan image details. Press Close or ESC to exit.</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { Product } from '../types';
import { 
  Box, 
  Maximize2, 
  RotateCw, 
  Smartphone, 
  QrCode, 
  Sparkles, 
  Sun, 
  Check, 
  Layers, 
  HelpCircle,
  X,
  Volume2,
  Eye
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

// Import Google's browser-native model-viewer web component
import '@google/model-viewer';

// Reference custom web component safely in JSX
const ModelViewer = 'model-viewer' as any;

interface Product3DViewerProps {
  product: Product;
  className?: string;
}

// Sample realistic 3D GLB/USDZ models categorized for e-commerce
const CATEGORY_MODELS: Record<string, { glb: string; usdz?: string; name: string }> = {
  shoes: {
    glb: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/MaterialsVariantsShoe/glTF-Binary/MaterialsVariantsShoe.glb',
    name: 'Athletic Footwear'
  },
  electronics: {
    glb: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/BoomBox/glTF-Binary/BoomBox.glb',
    name: 'Audio Device'
  },
  watches: {
    glb: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/AntiqueCamera/glTF-Binary/AntiqueCamera.glb',
    name: 'Precision Mechanical Hardware'
  },
  furniture: {
    glb: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/SheenChair/glTF-Binary/SheenChair.glb',
    name: 'Ergonomic Living Chair'
  },
  accessories: {
    glb: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/Lantern/glTF-Binary/Lantern.glb',
    name: 'Lifestyle Accessory'
  },
  default: {
    glb: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/MaterialsVariantsShoe/glTF-Binary/MaterialsVariantsShoe.glb',
    name: 'Product Specimen'
  }
};

export default function Product3DViewer({ product, className = '' }: Product3DViewerProps) {
  const [isAutoRotate, setIsAutoRotate] = useState<boolean>(true);
  const [showQRCodeModal, setShowQRCodeModal] = useState<boolean>(false);
  const [isARSupported, setIsARSupported] = useState<boolean>(false);
  const [lightingEnvironment, setLightingEnvironment] = useState<'neutral' | 'legacy'>('neutral');
  const [modelLoading, setModelLoading] = useState<boolean>(true);
  const modelViewerRef = useRef<any>(null);

  // Determine model based on product category or explicit model3d_url
  const modelAsset = React.useMemo(() => {
    if ((product as any).model3d_url) {
      return {
        glb: (product as any).model3d_url,
        usdz: (product as any).usdz_url,
        name: product.name
      };
    }
    const cat = (product.category || '').toLowerCase();
    if (cat.includes('shoe') || cat.includes('foot') || cat.includes('sneaker')) {
      return CATEGORY_MODELS.shoes;
    }
    if (cat.includes('elect') || cat.includes('tech') || cat.includes('audio') || cat.includes('headphone')) {
      return CATEGORY_MODELS.electronics;
    }
    if (cat.includes('watch') || cat.includes('cam')) {
      return CATEGORY_MODELS.watches;
    }
    if (cat.includes('chair') || cat.includes('furn') || cat.includes('home')) {
      return CATEGORY_MODELS.furniture;
    }
    if (cat.includes('bag') || cat.includes('access')) {
      return CATEGORY_MODELS.accessories;
    }
    return CATEGORY_MODELS.default;
  }, [product]);

  // Check if browser has native AR capabilities
  useEffect(() => {
    // Check WebXR immersive-ar support or mobile User Agent
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isMobile) {
      setIsARSupported(true);
    } else if ('xr' in navigator && (navigator as any).xr?.isSessionSupported) {
      (navigator as any).xr.isSessionSupported('immersive-ar')
        .then((supported: boolean) => setIsARSupported(supported))
        .catch(() => setIsARSupported(false));
    }
  }, []);

  const resetCamera = () => {
    if (modelViewerRef.current) {
      modelViewerRef.current.cameraOrbit = '0deg 75deg 105%';
      modelViewerRef.current.fieldOfView = 'auto';
    }
  };

  const handleLaunchAR = () => {
    if (modelViewerRef.current && modelViewerRef.current.canActivateAR) {
      modelViewerRef.current.activateAR();
    } else {
      // If desktop or AR not directly launchable on this hardware, display QR Code for smartphone
      setShowQRCodeModal(true);
    }
  };

  return (
    <div className={`relative bg-radial from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 rounded-3xl overflow-hidden border border-gray-200 dark:border-gray-800 shadow-sm ${className}`}>
      {/* 3D Canvas / Model Viewer */}
      <div className="w-full h-[420px] sm:h-[480px] relative flex items-center justify-center">
        <ModelViewer
          ref={modelViewerRef}
          src={modelAsset.glb}
          ios-src={modelAsset.usdz}
          alt={`3D Model preview of ${product.name}`}
          ar
          ar-modes="webxr scene-viewer quick-look"
          ar-scale="auto"
          camera-controls
          auto-rotate={isAutoRotate ? '' : undefined}
          rotation-per-second="25deg"
          shadow-intensity="1.2"
          shadow-softness="0.8"
          environment-image={lightingEnvironment === 'neutral' ? 'neutral' : 'legacy'}
          exposure="1.05"
          touch-action="pan-y"
          interaction-prompt="auto"
          onLoad={() => setModelLoading(false)}
          style={{ width: '100%', height: '100%', outline: 'none' }}
        >
          {/* Custom Native AR Button Slot */}
          <button
            slot="ar-button"
            id="native-ar-button"
            className="absolute bottom-4 left-4 inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-2xl shadow-lg shadow-indigo-600/30 transition-all active:scale-95 cursor-pointer z-20"
          >
            <Smartphone className="h-4 w-4 animate-pulse" />
            <span>View in Your Room (AR)</span>
          </button>
        </ModelViewer>

        {/* Loading Spinner */}
        {modelLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50/80 dark:bg-gray-900/80 backdrop-blur-xs z-10">
            <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3" />
            <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
              Loading 3D Spatial Geometry...
            </span>
          </div>
        )}
      </div>

      {/* Top Floating Control Bar */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none z-10">
        <div className="flex items-center gap-2 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-gray-200/80 dark:border-gray-800 pointer-events-auto shadow-xs">
          <Box className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          <span className="text-xs font-extrabold text-gray-900 dark:text-white">
            Interactive 3D / AR
          </span>
          <span className="text-[10px] bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 font-bold px-2 py-0.5 rounded-full">
            Real Scale
          </span>
        </div>

        {/* Right Tools: Auto-Rotate & Light Toggle */}
        <div className="flex items-center gap-1.5 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md p-1 rounded-2xl border border-gray-200/80 dark:border-gray-800 pointer-events-auto shadow-xs">
          <button
            type="button"
            onClick={() => setIsAutoRotate(!isAutoRotate)}
            title={isAutoRotate ? 'Pause 360° rotation' : 'Start 360° rotation'}
            className={`p-1.5 rounded-xl transition-all cursor-pointer ${
              isAutoRotate 
                ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400' 
                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
            }`}
          >
            <RotateCw className={`h-4 w-4 ${isAutoRotate ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => setLightingEnvironment(lightingEnvironment === 'neutral' ? 'legacy' : 'neutral')}
            title="Toggle Studio Lighting Environment"
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-xl transition-all cursor-pointer"
          >
            <Sun className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={resetCamera}
            title="Reset Camera Angle"
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-xl transition-all cursor-pointer"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Bottom Floating Bar: Native AR Action & Mobile QR Launch */}
      <div className="p-4 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-t border-gray-100 dark:border-gray-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <Eye className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          <span>Click & drag to rotate • Scroll to zoom • Dual-finger pan</span>
        </div>

        <div className="flex items-center gap-2">
          {/* View in AR Action */}
          <button
            type="button"
            id="open-ar-viewer-btn"
            onClick={handleLaunchAR}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/20 active:scale-95 transition-all cursor-pointer"
          >
            <Smartphone className="h-4 w-4" />
            <span>{isARSupported ? 'Launch Browser AR' : 'Scan to Preview in Room'}</span>
          </button>

          {/* Desktop QR Modal Trigger */}
          <button
            type="button"
            onClick={() => setShowQRCodeModal(true)}
            title="Scan QR code with phone for AR"
            className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
          >
            <QrCode className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* AR QR Code Scan Modal (For Desktop Preview) */}
      {showQRCodeModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
          onClick={() => setShowQRCodeModal(false)}
        >
          <div 
            className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-gray-100 dark:border-gray-800 text-center space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-full text-xs font-bold">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Augmented Reality</span>
              </div>
              <button
                onClick={() => setShowQRCodeModal(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div>
              <h3 className="text-xl font-extrabold text-gray-900 dark:text-white">
                Experience in Your Space
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Scan with your phone’s camera to instantly view <span className="font-semibold text-gray-800 dark:text-gray-200">{product.name}</span> in true 1:1 scale using WebXR and Apple Quick Look.
              </p>
            </div>

            {/* Generated QR Code pointing to this product URL */}
            <div className="p-4 bg-white rounded-2xl shadow-inner border border-gray-100 inline-block mx-auto">
              <QRCodeSVG
                value={window.location.href}
                size={180}
                level="M"
                includeMargin={false}
              />
            </div>

            <div className="space-y-1.5 text-xs text-gray-500 dark:text-gray-400">
              <div className="flex items-center justify-center gap-1.5 text-green-600 dark:text-green-400 font-semibold">
                <Check className="h-3.5 w-3.5" />
                <span>No app install required</span>
              </div>
              <p className="text-[11px]">Supported on iOS 12+ (Quick Look) & Android 8+ (Scene Viewer / Chrome WebXR)</p>
            </div>

            <button
              type="button"
              onClick={() => setShowQRCodeModal(false)}
              className="w-full py-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 font-bold text-xs rounded-xl transition-all cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

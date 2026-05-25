import { ArrowLeft, ImageIcon, Send, X, ZoomIn, ZoomOut } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import imageInteractionLogger from '../utils/ImageInteractionLogger';

// Sample prescription image with small text (forces zoom)
const SAMPLE_PRESCRIPTION = 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=800&h=1000&fit=crop';

function UploadResep() {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageSrc, setImageSrc] = useState<string>(SAMPLE_PRESCRIPTION);
  const [showInteractionData, setShowInteractionData] = useState(false);
  const [interactionData, setInteractionData] = useState<ReturnType<typeof imageInteractionLogger.getExportData> | null>(null);
  
  // Transform state for canvas rendering
  const [scale, setScale] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  
  // Image reference
  const imageRef = useRef<HTMLImageElement | null>(null);

  // Initialize logger and load image
  useEffect(() => {
    imageInteractionLogger.start('prescription-upload');
    
    return () => {
      const data = imageInteractionLogger.getExportData();
      console.log('[UploadResep] Image Interaction Analytics:', JSON.stringify(data, null, 2));
      imageInteractionLogger.stop();
    };
  }, []);

  // Load and draw image on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      imageRef.current = img;
      setImageLoaded(true);
      
      // Set canvas size to container size
      const container = containerRef.current;
      if (container) {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
      }
      
      drawImage();
    };

    img.onerror = () => {
      console.error('Failed to load image');
      // Draw placeholder
      ctx.fillStyle = '#f0f0f0';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#666';
      ctx.font = '16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Gagal memuat gambar', canvas.width / 2, canvas.height / 2);
    };

    img.src = imageSrc;
  }, [imageSrc]);

  // Redraw image when transform changes
  useEffect(() => {
    if (imageLoaded) {
      drawImage();
    }
  }, [scale, panX, panY, imageLoaded]);

  // Draw image with current transform
  const drawImage = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Save context state
    ctx.save();

    // Apply transforms
    ctx.translate(canvas.width / 2 + panX, canvas.height / 2 + panY);
    ctx.scale(scale, scale);

    // Calculate image dimensions to fit canvas
    const imgAspect = img.width / img.height;
    const canvasAspect = canvas.width / canvas.height;
    
    let drawWidth, drawHeight;
    if (imgAspect > canvasAspect) {
      drawWidth = canvas.width * 0.9;
      drawHeight = drawWidth / imgAspect;
    } else {
      drawHeight = canvas.height * 0.9;
      drawWidth = drawHeight * imgAspect;
    }

    // Draw image centered
    ctx.drawImage(img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);

    // Restore context state
    ctx.restore();

    // Draw zoom indicator
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(10, 10, 80, 30);
    ctx.fillStyle = '#fff';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`${Math.round(scale * 100)}%`, 20, 30);

    // Draw instructions if scale is 1
    if (scale === 1) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(canvas.width / 2 - 120, canvas.height - 50, 240, 35);
      ctx.fillStyle = '#fff';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Pinch/Scroll untuk zoom • Drag untuk geser', canvas.width / 2, canvas.height - 28);
    }
  }, [scale, panX, panY]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (canvas && container) {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
        drawImage();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [drawImage]);

  // Prevent browser zoom on the container
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    // Prevent default touch behavior
    const preventBrowserZoom = (e: TouchEvent) => {
      if (e.touches.length >= 2) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    // Prevent gesture events (Safari)
    const preventGestureStart = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
    };

    // Prevent wheel zoom
    const preventWheelZoom = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
      }
    };

    // Add listeners to container
    container.addEventListener('touchstart', preventBrowserZoom, { passive: false });
    container.addEventListener('touchmove', preventBrowserZoom, { passive: false });
    container.addEventListener('touchend', preventBrowserZoom, { passive: false });
    container.addEventListener('gesturestart', preventGestureStart);
    container.addEventListener('gesturechange', preventGestureStart);
    container.addEventListener('gestureend', preventGestureStart);
    container.addEventListener('wheel', preventWheelZoom, { passive: false });

    // Add listeners to canvas
    canvas.addEventListener('touchstart', preventBrowserZoom, { passive: false });
    canvas.addEventListener('touchmove', preventBrowserZoom, { passive: false });
    canvas.addEventListener('touchend', preventBrowserZoom, { passive: false });
    canvas.addEventListener('gesturestart', preventGestureStart);
    canvas.addEventListener('gesturechange', preventGestureStart);
    canvas.addEventListener('gestureend', preventGestureStart);
    canvas.addEventListener('wheel', preventWheelZoom, { passive: false });

    // Global level prevention for pinch zoom
    const preventGlobalZoom = (e: TouchEvent) => {
      if (e.touches.length >= 2) {
        const target = e.target as HTMLElement;
        if (container.contains(target) || canvas.contains(target)) {
          e.preventDefault();
          e.stopPropagation();
        }
      }
    };

    document.addEventListener('touchstart', preventGlobalZoom, { passive: false });
    document.addEventListener('touchmove', preventGlobalZoom, { passive: false });

    return () => {
      container.removeEventListener('touchstart', preventBrowserZoom);
      container.removeEventListener('touchmove', preventBrowserZoom);
      container.removeEventListener('touchend', preventBrowserZoom);
      container.removeEventListener('gesturestart', preventGestureStart);
      container.removeEventListener('gesturechange', preventGestureStart);
      container.removeEventListener('gestureend', preventGestureStart);
      container.removeEventListener('wheel', preventWheelZoom);
      
      canvas.removeEventListener('touchstart', preventBrowserZoom);
      canvas.removeEventListener('touchmove', preventBrowserZoom);
      canvas.removeEventListener('touchend', preventBrowserZoom);
      canvas.removeEventListener('gesturestart', preventGestureStart);
      canvas.removeEventListener('gesturechange', preventGestureStart);
      canvas.removeEventListener('gestureend', preventGestureStart);
      canvas.removeEventListener('wheel', preventWheelZoom);
      
      document.removeEventListener('touchstart', preventGlobalZoom);
      document.removeEventListener('touchmove', preventGlobalZoom);
    };
  }, []);

  // Pointer event handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.setPointerCapture(e.pointerId);
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    imageInteractionLogger.handlePointerDown(e.pointerId, x, y);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    imageInteractionLogger.handlePointerMove(e.pointerId, x, y);
    
    // Update local transform state
    const transform = imageInteractionLogger.getTransform();
    setScale(transform.scale);
    setPanX(transform.panX);
    setPanY(transform.panY);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.releasePointerCapture(e.pointerId);
    }
    
    imageInteractionLogger.handlePointerUp(e.pointerId);
  };

  const handlePointerCancel = (e: React.PointerEvent<HTMLCanvasElement>) => {
    imageInteractionLogger.handlePointerUp(e.pointerId);
  };

  // Wheel zoom handler
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const centerX = e.clientX - rect.left;
    const centerY = e.clientY - rect.top;
    
    imageInteractionLogger.handleWheelZoom(e.deltaY, centerX, centerY);
    
    // Update local transform state
    const transform = imageInteractionLogger.getTransform();
    setScale(transform.scale);
    setPanX(transform.panX);
    setPanY(transform.panY);
  };

  // Zoom controls
  const handleZoomIn = () => {
    const newScale = Math.min(5, scale * 1.2);
    imageInteractionLogger.setScale(newScale);
    setScale(newScale);
  };

  const handleZoomOut = () => {
    const newScale = Math.max(0.5, scale / 1.2);
    imageInteractionLogger.setScale(newScale);
    setScale(newScale);
  };

  const handleResetZoom = () => {
    imageInteractionLogger.setScale(1);
    imageInteractionLogger.setPan(0, 0);
    setScale(1);
    setPanX(0);
    setPanY(0);
  };

  // File upload handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && (file.type === 'image/jpeg' || file.type === 'image/png')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setImageSrc(result);
        setImageLoaded(false);
        handleResetZoom();
        
        // Restart logger for new image
        imageInteractionLogger.stop();
        imageInteractionLogger.clearData();
        imageInteractionLogger.start(`prescription-${Date.now()}`);
      };
      reader.readAsDataURL(file);
    } else {
      alert('Mohon pilih file JPG atau PNG');
    }
  };

  const handleChangePhoto = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = () => {
    const data = imageInteractionLogger.getExportData();
    console.log('[UploadResep] Submitting with interaction data:', JSON.stringify(data, null, 2));
    
    alert('Resep berhasil dikirim!');
    navigate('/home');
  };

  const handleShowInteractionData = () => {
    const data = imageInteractionLogger.getExportData();
    setInteractionData(data);
    setShowInteractionData(true);
    console.log('[UploadResep] Current Interaction Data:', JSON.stringify(data, null, 2));
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-600 to-emerald-600 text-white px-4 py-4 flex items-center gap-4 shadow-lg">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-white/20 rounded-xl transition-colors active:scale-95"
          aria-label="Kembali"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-semibold">Upload Resep</h1>
          <p className="text-teal-100 text-xs">Unggah resep dokter Anda</p>
        </div>
      </div>

      {/* Image Preview Container */}
      <div 
        ref={containerRef}
        className="flex-1 relative bg-gray-800 overflow-hidden touch-none canvas-container mx-4 mt-4 rounded-2xl shadow-lg"
        style={{ minHeight: '55vh', touchAction: 'none', msTouchAction: 'none' }}
      >
        <canvas
          ref={canvasRef}
          className="w-full h-full touch-none cursor-grab active:cursor-grabbing"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
          onPointerLeave={handlePointerUp}
          onWheel={handleWheel}
          style={{ touchAction: 'none', msTouchAction: 'none' }}
        />

        {/* Zoom Controls */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col gap-2">
          <button
            onClick={handleZoomIn}
            className="w-10 h-10 bg-white rounded-xl shadow-lg flex items-center justify-center text-teal-700 hover:bg-teal-50 active:scale-95 transition-all"
            aria-label="Zoom In"
          >
            <ZoomIn className="w-5 h-5" />
          </button>
          <button
            onClick={handleResetZoom}
            className="w-10 h-10 bg-white rounded-xl shadow-lg flex items-center justify-center text-teal-700 hover:bg-teal-50 active:scale-95 transition-all text-sm font-bold"
            aria-label="Reset Zoom"
          >
            1:1
          </button>
          <button
            onClick={handleZoomOut}
            className="w-10 h-10 bg-white rounded-xl shadow-lg flex items-center justify-center text-teal-700 hover:bg-teal-50 active:scale-95 transition-all"
            aria-label="Zoom Out"
          >
            <ZoomOut className="w-5 h-5" />
          </button>
        </div>

        {/* Loading indicator */}
        {!imageLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-800 rounded-2xl">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-teal-500 border-t-transparent"></div>
          </div>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Action Buttons */}
      <div className="bg-white p-4 space-y-3 mx-4 mb-4 mt-4 rounded-2xl shadow-lg">
        {/* Change Photo Button */}
        <button
          onClick={handleChangePhoto}
          className="w-full py-3.5 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 border border-gray-200"
        >
          <ImageIcon className="w-5 h-5" />
          Ganti Foto
        </button>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          className="w-full py-4 bg-gradient-to-r from-teal-600 to-emerald-600 text-white font-bold rounded-xl hover:from-teal-500 hover:to-emerald-500 active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 text-lg shadow-lg shadow-teal-600/30"
        >
          <Send className="w-6 h-6" />
          Kirim Resep
        </button>

        {/* Debug: Show Interaction Data Button */}
        <button
          onClick={handleShowInteractionData}
          className="w-full py-3 bg-teal-50 text-teal-700 font-semibold rounded-xl hover:bg-teal-100 transition-colors border border-teal-200"
        >
          📊 Lihat Data Interaksi Gambar
        </button>
      </div>

      {/* Interaction Data Modal */}
      {showInteractionData && interactionData && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg max-h-[80vh] rounded-2xl overflow-hidden shadow-2xl">
            <div className="bg-gradient-to-r from-teal-600 to-emerald-600 px-5 py-4 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-white">Image Interaction Analytics</h3>
                <p className="text-teal-100 text-xs">Data interaksi gambar resep</p>
              </div>
              <button
                onClick={() => setShowInteractionData(false)}
                className="p-2 hover:bg-white/20 rounded-xl text-white transition-colors active:scale-95"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[60vh]">
              <div className="space-y-4">
                {/* Summary */}
                <div className="bg-teal-50 p-4 rounded-xl border border-teal-100">
                  <h4 className="font-semibold text-teal-800 mb-2 flex items-center gap-2">
                    <span>📈</span> Ringkasan
                  </h4>
                  <ul className="text-sm space-y-1 text-teal-700">
                    <li>Total Gesture Events: {interactionData.total_gesture_events}</li>
                    <li>Duration: {((interactionData.recording_duration_ms || 0) / 1000).toFixed(1)}s</li>
                  </ul>
                </div>

                {/* Zoom Analytics */}
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                  <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                    <span>🔍</span> Zoom Analytics
                  </h4>
                  <ul className="text-sm space-y-1 text-blue-700">
                    <li>Max Scale: {(interactionData.zoom_analytics.max_scale * 100).toFixed(0)}%</li>
                    <li>Min Scale: {(interactionData.zoom_analytics.min_scale * 100).toFixed(0)}%</li>
                    <li>Zoom In Count: {interactionData.zoom_analytics.zoom_in_count}</li>
                    <li>Zoom Out Count: {interactionData.zoom_analytics.zoom_out_count}</li>
                    <li>Average Zoom: {(interactionData.zoom_analytics.average_zoom_level * 100).toFixed(0)}%</li>
                  </ul>
                </div>

                {/* Pan Analytics */}
                <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                  <h4 className="font-semibold text-purple-800 mb-2 flex items-center gap-2">
                    <span>✋</span> Pan Analytics
                  </h4>
                  <ul className="text-sm space-y-1 text-purple-700">
                    <li>Total Pan Distance: {interactionData.pan_analytics.total_pan_distance}px</li>
                    <li>Pan Action Count: {interactionData.pan_analytics.pan_action_count}</li>
                  </ul>
                </div>

                {/* Recent Events */}
                <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                  <h4 className="font-semibold text-amber-800 mb-2 flex items-center gap-2">
                    <span>🕐</span> Recent Events (last 10)
                  </h4>
                  <div className="space-y-1 text-xs font-mono text-amber-700 max-h-40 overflow-y-auto">
                    {interactionData.raw_data.slice(-10).map((event, i) => (
                      <div key={i} className="bg-amber-100 p-2 rounded-lg">
                        {event.event_type} | scale: {event.scale_factor.toFixed(2)} | pan: ({event.pan_offset.x.toFixed(0)}, {event.pan_offset.y.toFixed(0)})
                      </div>
                    ))}
                  </div>
                </div>

                {/* Raw JSON */}
                <div className="bg-gray-100 p-4 rounded-xl border border-gray-200">
                  <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                    <span>🔧</span> Raw JSON
                  </h4>
                  <pre className="text-xs overflow-x-auto bg-gray-800 text-green-400 p-3 rounded-lg max-h-60 overflow-y-auto">
                    {JSON.stringify(interactionData, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UploadResep;

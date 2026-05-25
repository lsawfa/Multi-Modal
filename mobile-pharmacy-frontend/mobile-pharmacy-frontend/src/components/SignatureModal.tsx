import { useCallback, useEffect, useRef, useState } from 'react';
import signatureLogger from '../utils/SignatureLogger';

interface SignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (signatureData: ReturnType<typeof signatureLogger.getExportData>) => void;
}

function SignatureModal({ isOpen, onClose, onSave }: SignatureModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [showData, setShowData] = useState(false);
  const [exportData, setExportData] = useState<ReturnType<typeof signatureLogger.getExportData> | null>(null);

  // Initialize canvas and logger
  useEffect(() => {
    if (!isOpen) return;

    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    // Set canvas size
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    // Initialize canvas context
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = '#1a1a1a';
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }

    // Start logger
    signatureLogger.start(canvas.width, canvas.height);

    return () => {
      signatureLogger.stop();
    };
  }, [isOpen]);

  // Prevent browser zoom on canvas container
  useEffect(() => {
    if (!isOpen) return;

    const container = containerRef.current;
    if (!container) return;

    const preventZoom = (e: TouchEvent) => {
      if (e.touches.length >= 2) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    const preventGesture = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
    };

    container.addEventListener('touchstart', preventZoom, { passive: false });
    container.addEventListener('touchmove', preventZoom, { passive: false });
    container.addEventListener('gesturestart', preventGesture);
    container.addEventListener('gesturechange', preventGesture);
    container.addEventListener('gestureend', preventGesture);

    return () => {
      container.removeEventListener('touchstart', preventZoom);
      container.removeEventListener('touchmove', preventZoom);
      container.removeEventListener('gesturestart', preventGesture);
      container.removeEventListener('gesturechange', preventGesture);
      container.removeEventListener('gestureend', preventGesture);
    };
  }, [isOpen]);

  // Get coordinates from pointer event
  const getCoordinates = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      pressure: e.pressure || 0.5,
      tiltX: e.tiltX || 0,
      tiltY: e.tiltY || 0,
      pointerType: e.pointerType as 'mouse' | 'pen' | 'touch',
    };
  }, []);

  // Draw line on canvas
  const drawLine = useCallback((fromX: number, fromY: number, toX: number, toY: number, pressure: number = 0.5) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Adjust line width based on pressure
    ctx.lineWidth = 1.5 + pressure * 2;
    
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();
  }, []);

  // Last point for drawing lines
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  // Handle pointer down
  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.setPointerCapture(e.pointerId);

    const coords = getCoordinates(e);
    if (!coords) return;

    setIsDrawing(true);
    lastPointRef.current = { x: coords.x, y: coords.y };

    // Start stroke in logger
    signatureLogger.beginStroke(
      coords.x,
      coords.y,
      coords.pressure,
      coords.tiltX,
      coords.tiltY,
      coords.pointerType
    );

    setHasSignature(true);
  }, [getCoordinates]);

  // Handle pointer move
  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();

    const coords = getCoordinates(e);
    if (!coords || !lastPointRef.current) return;

    // Draw line on canvas
    drawLine(lastPointRef.current.x, lastPointRef.current.y, coords.x, coords.y, coords.pressure);

    // Add point to logger
    signatureLogger.addPoint(
      coords.x,
      coords.y,
      coords.pressure,
      coords.tiltX,
      coords.tiltY,
      coords.pointerType
    );

    lastPointRef.current = { x: coords.x, y: coords.y };
  }, [isDrawing, getCoordinates, drawLine]);

  // Handle pointer up
  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.releasePointerCapture(e.pointerId);
    }

    setIsDrawing(false);
    lastPointRef.current = null;

    // End stroke in logger
    signatureLogger.endStroke();
  }, []);

  // Handle pointer leave/cancel
  const handlePointerLeave = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isDrawing) {
      handlePointerUp(e);
    }
  }, [isDrawing, handlePointerUp]);

  // Clear canvas
  const handleClear = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    signatureLogger.clear();
    setHasSignature(false);
    setShowData(false);
    setExportData(null);
  }, []);

  // Save signature
  const handleSave = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !hasSignature) {
      alert('Silakan buat tanda tangan terlebih dahulu');
      return;
    }

    // Get image data URL
    const imageDataUrl = canvas.toDataURL('image/png');

    // Get export data with trajectory
    const data = signatureLogger.getExportData(imageDataUrl);

    console.log('[SignatureModal] Signature saved:', JSON.stringify(data, null, 2));

    onSave(data);
  }, [hasSignature, onSave]);

  // Show data for debugging
  const handleShowData = useCallback(() => {
    // End any current stroke first to capture all data
    signatureLogger.endStroke();
    
    const canvas = canvasRef.current;
    const imageDataUrl = canvas?.toDataURL('image/png');
    const data = signatureLogger.getExportData(imageDataUrl);
    
    console.log('[SignatureModal] handleShowData - raw data:', {
      stroke_count: data.stroke_count,
      total_points: data.total_points,
      strokes_in_trajectory: data.signature_trajectory.strokes.length
    });
    
    // Deep copy to avoid reference issues
    const dataCopy = JSON.parse(JSON.stringify(data));
    
    console.log('[SignatureModal] Setting exportData and showData=true');
    setExportData(dataCopy);
    setShowData(true);
    console.log('[SignatureModal] Current data:', JSON.stringify(dataCopy, null, 2));
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">Tanda Tangan Digital</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Tutup"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Instructions */}
        <div className="px-5 py-3 bg-gray-50">
          <p className="text-sm text-gray-500 text-center">
            Area Tanda Tangan (Gunakan jari atau stylus)
          </p>
        </div>

        {/* Signature Canvas */}
        <div className="p-5">
          <div 
            ref={containerRef}
            className="relative w-full h-48 border-2 border-dashed border-gray-300 rounded-lg overflow-hidden bg-white canvas-container touch-none"
            style={{ touchAction: 'none' }}
          >
            <canvas
              ref={canvasRef}
              className="w-full h-full touch-none cursor-crosshair"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerLeave}
              onPointerLeave={handlePointerLeave}
              style={{ touchAction: 'none' }}
            />
            
            {/* Placeholder text when empty */}
            {!hasSignature && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <p className="text-gray-300 text-lg">Tanda tangan di sini</p>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="px-5 pb-5 space-y-3">
          <div className="flex gap-3">
            {/* Clear Button */}
            <button
              onClick={handleClear}
              className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 active:bg-gray-300 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Hapus
            </button>

            {/* Save Button */}
            <button
              onClick={handleSave}
              disabled={!hasSignature}
              className={`flex-1 py-3 px-4 font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors ${
                hasSignature
                  ? 'bg-teal-600 text-white hover:bg-teal-500 active:bg-teal-700'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Simpan
            </button>
          </div>

          {/* Debug: Show Data Button */}
          <button
            onClick={handleShowData}
            className="w-full py-2 bg-blue-100 text-blue-700 font-medium rounded-lg hover:bg-blue-200 transition-colors text-sm"
          >
            📊 Lihat Data Trajectory
          </button>
        </div>

        {/* Data Modal */}
        {showData && exportData && (
          <div className="absolute inset-0 bg-white overflow-y-auto z-60">
            <div className="p-4 border-b flex justify-between items-center sticky top-0 bg-white z-10">
              <h3 className="text-lg font-semibold">Signature Trajectory Data</h3>
              <button
                onClick={() => setShowData(false)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                ✕
              </button>
            </div>
            <div className="p-4 space-y-4">
              {/* Summary */}
              <div className="bg-teal-50 p-4 rounded-lg">
                <h4 className="font-semibold text-teal-800 mb-2">📈 Ringkasan</h4>
                <ul className="text-sm space-y-1 text-teal-700">
                  <li>Total Strokes: {exportData.stroke_count}</li>
                  <li>Total Points: {exportData.total_points}</li>
                  <li>Duration: {((exportData.recording_duration_ms || 0) / 1000).toFixed(2)}s</li>
                </ul>
              </div>

              {/* Kinematics */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-2">🏃 Kinematics</h4>
                <ul className="text-sm space-y-1 text-blue-700">
                  <li>Total Distance: {exportData.kinematics?.total_distance?.toFixed(2) || 0} px</li>
                  <li>Avg Velocity: {exportData.kinematics?.average_velocity?.toFixed(2) || 0} px/s</li>
                  <li>Max Velocity: {exportData.kinematics?.max_velocity?.toFixed(2) || 0} px/s</li>
                  <li>Avg Acceleration: {exportData.kinematics?.average_acceleration?.toFixed(2) || 0} px/s²</li>
                  <li>Max Acceleration: {exportData.kinematics?.max_acceleration?.toFixed(2) || 0} px/s²</li>
                </ul>
              </div>

              {/* Sample Points */}
              <div className="bg-purple-50 p-4 rounded-lg">
                <h4 className="font-semibold text-purple-800 mb-2">📍 Sample Points (last 10)</h4>
                <div className="space-y-1 text-xs font-mono text-purple-700 max-h-32 overflow-y-auto">
                  {(exportData.raw_points || []).slice(-10).map((point, i) => (
                    <div key={i} className="bg-purple-100 p-1 rounded">
                      x: {point.x?.toFixed(1) || 0}, y: {point.y?.toFixed(1) || 0}, t: {point.t?.toFixed(0) || 0}ms, p: {point.pressure?.toFixed(2) || 0}
                    </div>
                  ))}
                </div>
              </div>

              {/* Raw JSON */}
              <div className="bg-gray-100 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-2">🔧 Raw JSON (signature_trajectory)</h4>
                <pre className="text-xs overflow-x-auto bg-gray-800 text-green-400 p-3 rounded max-h-48 overflow-y-auto">
                  {JSON.stringify(exportData.signature_trajectory, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default SignatureModal;

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Camera, RefreshCw, Upload, AlertCircle, Zap, ZapOff } from 'lucide-react';

export default function QrScannerModal({ isOpen, onClose, onScanSuccess }) {
  const [cameraError, setCameraError] = useState(null);
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' | 'user'
  const [hasTorch, setHasTorch] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [fileScanning, setFileScanning] = useState(false);

  const scannerRef = useRef(null);
  const fileInputRef = useRef(null);
  const scannedRef = useRef(false);

  // Beep sound on scan
  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.15);
      if (navigator.vibrate) navigator.vibrate(100);
    } catch {
      // AudioContext may be blocked if no user interaction
    }
  };

  const handleDecoded = (decodedText) => {
    if (scannedRef.current) return;
    scannedRef.current = true;
    playBeep();
    stopScanner().finally(() => {
      onScanSuccess(decodedText);
      onClose();
    });
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
      } catch (err) {
        console.warn('Error stopping scanner:', err);
      }
      scannerRef.current = null;
    }
    setTorchOn(false);
    setHasTorch(false);
  };

  const startScanner = async (facing) => {
    setCameraError(null);
    setIsStarting(true);
    await stopScanner();

    try {
      const html5QrCode = new Html5Qrcode('qr-reader-viewport');
      scannerRef.current = html5QrCode;

      const config = {
        fps: 15,
        qrbox: (viewfinderWidth, viewfinderHeight) => {
          const edge = Math.min(viewfinderWidth, viewfinderHeight) * 0.75;
          return { width: Math.max(edge, 200), height: Math.max(edge, 200) };
        },
        aspectRatio: 1.0,
      };

      await html5QrCode.start(
        { facingMode: facing },
        config,
        (decodedText) => {
          handleDecoded(decodedText);
        },
        () => {
          // Frame parse error - ignore standard frame drops
        }
      );

      // Check if torch/flashlight is supported
      try {
        const capabilities = html5QrCode.getRunningTrackCapabilities();
        if (capabilities && capabilities.torch) {
          setHasTorch(true);
        }
      } catch {
        setHasTorch(false);
      }
    } catch (err) {
      console.error('Camera start error:', err);
      let msg = 'Unable to access camera.';
      if (err.name === 'NotAllowedError' || err.toString().includes('NotAllowedError')) {
        msg = 'Camera permission was denied. Please allow camera permissions in your browser settings, or use the image upload option below.';
      } else if (err.name === 'NotFoundError' || err.toString().includes('NotFoundError')) {
        msg = 'No camera found on this device. You can upload an image of the QR pass instead.';
      } else if (err.toString().includes('secure')) {
        msg = 'Camera requires a secure HTTPS connection. Please access this page over HTTPS.';
      } else {
        msg = err.message || 'Camera initialization failed. Please try uploading a QR image instead.';
      }
      setCameraError(msg);
    } finally {
      setIsStarting(false);
    }
  };

  const toggleTorch = async () => {
    if (!scannerRef.current || !hasTorch) return;
    try {
      const nextState = !torchOn;
      await scannerRef.current.applyVideoConstraints({
        advanced: [{ torch: nextState }],
      });
      setTorchOn(nextState);
    } catch (err) {
      console.warn('Torch toggle failed:', err);
    }
  };

  const toggleFacingMode = () => {
    const nextFacing = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextFacing);
    startScanner(nextFacing);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileScanning(true);
    setCameraError(null);
    try {
      await stopScanner();
      const html5QrCode = new Html5Qrcode('qr-reader-viewport');
      scannerRef.current = html5QrCode;
      const decodedText = await html5QrCode.scanFile(file, true);
      handleDecoded(decodedText);
    } catch (err) {
      console.error('File scan error:', err);
      setCameraError('No QR code detected in the uploaded image. Please try another photo or use the camera.');
      // Restart live camera
      startScanner(facingMode);
    } finally {
      setFileScanning(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  useEffect(() => {
    if (isOpen) {
      scannedRef.current = false;
      startScanner(facingMode);
    } else {
      stopScanner();
    }
    return () => {
      stopScanner();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#131718] text-white rounded-[36px] border border-white/10 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FEC29F] flex items-center justify-center text-[#131718]">
              <Camera size={20} />
            </div>
            <div>
              <h3 className="font-display text-2xl tracking-wide uppercase">QR SCANNER</h3>
              <p className="text-xs text-gray-400">Scan student bus pass</p>
            </div>
          </div>
          <button
            onClick={() => {
              stopScanner();
              onClose();
            }}
            className="w-10 h-10 rounded-2xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Viewport Area */}
        <div className="relative bg-black flex-1 min-h-[340px] flex items-center justify-center overflow-hidden">
          {/* html5-qrcode target container */}
          <div
            id="qr-reader-viewport"
            className="w-full h-full [&_video]:w-full [&_video]:h-full [&_video]:object-cover"
          />

          {/* Scanner Overlay Sight/Corners */}
          {!cameraError && !fileScanning && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="relative w-64 h-64 border-2 border-dashed border-[#FEC29F]/60 rounded-3xl">
                {/* Corner markers */}
                <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-[#FEC29F] rounded-tl-xl" />
                <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-[#FEC29F] rounded-tr-xl" />
                <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-[#FEC29F] rounded-bl-xl" />
                <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-[#FEC29F] rounded-br-xl" />

                {/* Animated scanning line */}
                <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-[#FEC29F] to-transparent shadow-[0_0_12px_#FEC29F] animate-pulse absolute top-1/2 -translate-y-1/2" />
              </div>
            </div>
          )}

          {/* Loading Indicator */}
          {isStarting && (
            <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-3 border-[#FEC29F] border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-gray-300 font-medium">Starting camera...</p>
            </div>
          )}

          {/* File Scanning Indicator */}
          {fileScanning && (
            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-3 border-[#D1E6F6] border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-gray-300 font-medium">Analyzing QR image...</p>
            </div>
          )}

          {/* Camera Controls Overlay (Top Right of Viewport) */}
          <div className="absolute top-4 right-4 flex items-center gap-2">
            {hasTorch && (
              <button
                type="button"
                onClick={toggleTorch}
                className={`p-2.5 rounded-2xl backdrop-blur-md transition-all ${
                  torchOn ? 'bg-[#FEC29F] text-[#131718]' : 'bg-black/50 text-white hover:bg-black/70'
                }`}
                title="Toggle Flashlight"
              >
                {torchOn ? <Zap size={18} /> : <ZapOff size={18} />}
              </button>
            )}

            <button
              type="button"
              onClick={toggleFacingMode}
              className="p-2.5 rounded-2xl bg-black/50 hover:bg-black/70 text-white backdrop-blur-md transition-all"
              title="Flip Camera (Front/Back)"
            >
              <RefreshCw size={18} />
            </button>
          </div>
        </div>

        {/* Error notification banner if camera failed */}
        {cameraError && (
          <div className="p-4 mx-6 mt-4 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-start gap-3 text-red-200 text-xs">
            <AlertCircle size={18} className="text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1 leading-relaxed">
              <p className="font-semibold text-red-300 mb-1">Camera Notice</p>
              <p>{cameraError}</p>
            </div>
          </div>
        )}

        {/* Footer controls & File upload fallback */}
        <div className="p-6 space-y-3 bg-[#131718]">
          <p className="text-center text-xs text-gray-400">
            Align student QR code within frame to verify pass automatically
          </p>

          <div className="flex gap-3">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 py-3.5 px-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold flex items-center justify-center gap-2 transition-all"
            >
              <Upload size={16} /> Upload QR Image
            </button>

            {cameraError && (
              <button
                type="button"
                onClick={() => startScanner(facingMode)}
                className="py-3.5 px-5 rounded-2xl bg-[#FEC29F] text-[#131718] text-xs font-bold hover:brightness-105 transition-all"
              >
                Retry Camera
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

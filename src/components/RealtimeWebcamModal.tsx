import React, { useRef, useState, useEffect } from 'react';
import { Camera, X, RefreshCw, AlertCircle, Activity, Zap } from 'lucide-react';
import { connectors, streams, webrtc } from "@roboflow/inference-sdk";

interface RealtimeWebcamModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey: string;
  workflowUrl: string; // Not used for WebRTC, but kept for interface compatibility
}

interface Prediction {
  class: string;
  confidence: number;
}

export const RealtimeWebcamModal: React.FC<RealtimeWebcamModalProps> = ({
  isOpen,
  onClose,
  apiKey,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [isClassifying, setIsClassifying] = useState(false);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  
  const connectionRef = useRef<any>(null);
  const [previewStream, setPreviewStream] = useState<MediaStream | null>(null);

  const startPreview = async () => {
    try {
      if (previewStream) {
        previewStream.getTracks().forEach(t => t.stop());
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 640 },
          height: { ideal: 480 }
        },
        audio: false
      });
      
      setPreviewStream(stream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
        videoRef.current.playsInline = true;
        await videoRef.current.play();
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      setError('Unable to access camera. Please allow camera permissions.');
    }
  };

  const stopPreview = () => {
    if (previewStream) {
      previewStream.getTracks().forEach(t => t.stop());
      setPreviewStream(null);
    }
  };

  const stopWasteClassifier = async () => {
    if (connectionRef.current) {
      await connectionRef.current.cleanup();
      connectionRef.current = null;
    }
    if (videoRef.current && videoRef.current.srcObject) {
       const stream = videoRef.current.srcObject as MediaStream;
       stream.getTracks().forEach(t => t.stop());
       videoRef.current.srcObject = null;
    }
  };

  const startWasteClassifier = async () => {
    try {
      setError(null);
      stopPreview(); // Stop the local preview first
      await stopWasteClassifier(); // cleanup any existing webrtc connection

      const connector = connectors.withProxyUrl('/api/init-webrtc', {
        turnConfigUrl: `/api/turn-config?apiKey=${apiKey}`
      });

      // Because we are using proxy, we might want to pass the apiKey down through the wrtcParams or fetch interceptors if we wanted, 
      // but the server is set up to handle the apiKey via environment defaults or we can attach it to the proxy call.
      // Note: withProxyUrl does not support passing arbitrary body params natively out of the box unless we hack it, 
      // so we rely on the backend proxy's DEFAULT_ROBOFLOW_API_KEY environment variable.

      const camera = await streams.useCamera({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 640 },
          height: { ideal: 480 }
        },
        audio: false
      });

      const connection = await webrtc.useStream({
        source: camera,
        connector,
        wrtcParams: {
          workspaceName: "what-you-need-to-know",
          workflowId: "garbage-classification-model-v1-vgarbage-classification-model-v1-2-rfdetr-small-t1-logic",
          imageInputName: "image",
          streamOutputNames: ["output_image"],
          dataOutputNames: [
            "predictions",
            "statistics",
            "total_count",
            "per_category_counts",
            "average_confidence",
            "live_statistics_text"
          ],
          requestedPlan: "webrtc-gpu-medium",
          requestedRegion: "us",
          // Send API key in wrtcParams so our backend proxy can extract it if needed
          apiKey: apiKey
        },
        onData: (results: any) => {
          if (results && results.predictions) {
             let detected: Prediction[] = [];
             if (Array.isArray(results.predictions)) {
               detected = results.predictions;
             } else if (typeof results.predictions === 'object') {
                // Some nested Roboflow responses
                const vals = Object.values(results.predictions);
                if (Array.isArray(vals[0])) {
                  detected = vals[0] as Prediction[];
                }
             }
             setPredictions(detected);
          }
        }
      });
      
      connectionRef.current = connection;

      if (videoRef.current) {
        videoRef.current.srcObject = await connection.remoteStream();
        videoRef.current.muted = true;
        videoRef.current.playsInline = true;
        await videoRef.current.play();
      }
      setIsClassifying(true);

    } catch (err: any) {
      console.error('WebRTC error', err);
      setError(`Failed to start Live Scanner: ${err.message || 'Check your Roboflow credits and API Key.'}`);
      setIsClassifying(false);
      startPreview(); // fallback to local preview
    }
  };

  useEffect(() => {
    if (!isOpen) {
      stopPreview();
      stopWasteClassifier();
      setIsClassifying(false);
      setPredictions([]);
      return;
    }
    
    // Start local preview when modal opens
    startPreview();

    return () => {
      stopPreview();
      stopWasteClassifier();
      setIsClassifying(false);
    };
  }, [isOpen, facingMode]);

  const toggleClassification = async () => {
    if (isClassifying) {
      setIsClassifying(false);
      setPredictions([]);
      await stopWasteClassifier();
      startPreview(); // Go back to local preview
    } else {
      await startWasteClassifier();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full p-5 shadow-2xl relative flex flex-col md:flex-row gap-5">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex items-center space-x-2 mb-4">
            <Activity className="w-5 h-5 text-emerald-400 animate-pulse" />
            <h3 className="text-base font-semibold text-white">Live AI Classifier</h3>
          </div>

          {error ? (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-start space-x-3 mb-4">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
              <div>
                <p className="font-medium">Scanner Error</p>
                <p className="text-xs text-rose-300/80 mt-1">{error}</p>
              </div>
            </div>
          ) : (
            <div className="relative rounded-xl overflow-hidden bg-slate-950 aspect-video mb-4 flex items-center justify-center border border-slate-800">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              
              {isClassifying && (
                <div className="absolute top-3 left-3 flex items-center space-x-1.5 bg-rose-500/90 text-white px-2 py-1 rounded text-xs font-semibold tracking-wider">
                   <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                   <span>LIVE SCAN</span>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-between">
            <button
              onClick={() => setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'))}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs hover:bg-slate-700 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Switch Camera</span>
            </button>

            <button
              onClick={toggleClassification}
              disabled={(!previewStream && !isClassifying) || !!error}
              className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${
                isClassifying
                  ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/20'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
              }`}
            >
              {isClassifying ? (
                <>
                  <X className="w-4 h-4" />
                  <span>Stop Scanner</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  <span>Start Live Scanner</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Live Results Sidebar */}
        <div className="w-full md:w-64 bg-slate-950/50 rounded-xl border border-slate-800/50 p-4 flex flex-col h-[300px] md:h-auto overflow-hidden">
           <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Live Detections</h4>
           
           <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
             {predictions.length > 0 ? (
               predictions.map((p, idx) => (
                 <div key={idx} className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-2.5 flex items-center justify-between">
                    <span className="text-slate-200 text-sm font-medium capitalize truncate pr-2" title={p.class}>{p.class}</span>
                    <span className="text-emerald-400 text-xs font-mono bg-emerald-400/10 px-1.5 py-0.5 rounded">
                      {(p.confidence * 100).toFixed(1)}%
                    </span>
                 </div>
               ))
             ) : (
               <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-3">
                 <Camera className="w-8 h-8 opacity-20" />
                 <p className="text-xs text-center">
                   {isClassifying ? "Scanning for waste items..." : "Start scanner to see detections."}
                 </p>
               </div>
             )}
           </div>
        </div>
      </div>
    </div>
  );
};

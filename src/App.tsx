import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { UploadSection } from './components/UploadSection';
import { ResultReport } from './components/ResultReport';
import { ImpactDashboard } from './components/ImpactDashboard';
import { WebcamModal } from './components/WebcamModal';
import { RealtimeWebcamModal } from './components/RealtimeWebcamModal';
import { SettingsModal } from './components/SettingsModal';
import { HistoryModal } from './components/HistoryModal';
import { ClassificationResult, HistoryItem } from './types';
import { AlertCircle } from 'lucide-react';

const STORAGE_KEY_HISTORY = 'ecoclassify_history_v1';
const STORAGE_KEY_API_KEY = 'ecoclassify_api_key_v1';
const STORAGE_KEY_WORKFLOW_URL = 'ecoclassify_workflow_url_v1';

const DEFAULT_KEY = 'YycCxhqZecCKEYYdtbnL';
const DEFAULT_URL =
  'https://serverless.roboflow.com/what-you-need-to-know/workflows/garbage-classification-model-v1-vgarbage-classification-model-v1-2-rfdetr-small-t1-logic';

const INITIAL_SEED_HISTORY: HistoryItem[] = [
  {
    id: 'samp_1',
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    imageUrl: '/plastic_bottle.svg',
    imageName: 'Plastic Water Bottle',
    category: 'Plastic / Recyclable',
    result: {
      success: true,
      timestamp: new Date().toISOString(),
      geminiReport: {
        primary_category: 'Plastic / Recyclable',
        item_name: 'PET Water Bottle',
        bin_color_recommendation: 'Blue Bin (Recyclables)',
      },
    },
  },
  {
    id: 'samp_2',
    timestamp: new Date(Date.now() - 3600000 * 6).toISOString(),
    imageUrl: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&q=80&w=600',
    imageName: 'Cardboard Box',
    category: 'Paper / Cardboard',
    result: {
      success: true,
      timestamp: new Date().toISOString(),
      geminiReport: {
        primary_category: 'Paper / Cardboard',
        item_name: 'Corrugated Box',
        bin_color_recommendation: 'Blue Bin (Recyclables)',
      },
    },
  },
  {
    id: 'samp_3',
    timestamp: new Date(Date.now() - 3600000 * 12).toISOString(),
    imageUrl: '/soda_can.svg',
    imageName: 'Soda Can',
    category: 'Metal / Recyclable',
    result: {
      success: true,
      timestamp: new Date().toISOString(),
      geminiReport: {
        primary_category: 'Metal / Recyclable',
        item_name: 'Aluminum Soda Can',
        bin_color_recommendation: 'Blue Bin (Recyclables)',
      },
    },
  },
  {
    id: 'samp_4',
    timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
    imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&q=80&w=600',
    imageName: 'Organic Food Waste',
    category: 'Organic / Compostable',
    result: {
      success: true,
      timestamp: new Date().toISOString(),
      geminiReport: {
        primary_category: 'Organic / Compostable',
        item_name: 'Fruit Peels',
        bin_color_recommendation: 'Green Bin (Compost)',
      },
    },
  },
];

export default function App() {
  const [apiKey, setApiKey] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY_API_KEY) || DEFAULT_KEY;
  });
  const [workflowUrl, setWorkflowUrl] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY_WORKFLOW_URL) || DEFAULT_URL;
  });

  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_HISTORY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
      return INITIAL_SEED_HISTORY;
    } catch (e) {
      return INITIAL_SEED_HISTORY;
    }
  });

  const [currentResult, setCurrentResult] = useState<ClassificationResult | null>(null);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [currentName, setCurrentName] = useState<string>('Uploaded Garbage Image');

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [isWebcamOpen, setIsWebcamOpen] = useState<boolean>(false);
  const [isRealtimeOpen, setIsRealtimeOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);

  // Global Keyboard Shortcuts for Esc to close Modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isWebcamOpen) setIsWebcamOpen(false);
        if (isRealtimeOpen) setIsRealtimeOpen(false);
        if (isSettingsOpen) setIsSettingsOpen(false);
        if (isHistoryOpen) setIsHistoryOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isWebcamOpen, isRealtimeOpen, isSettingsOpen, isHistoryOpen]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(history));
  }, [history]);

  const handleSaveSettings = (newKey: string, newUrl: string) => {
    setApiKey(newKey);
    setWorkflowUrl(newUrl);
    localStorage.setItem(STORAGE_KEY_API_KEY, newKey);
    localStorage.setItem(STORAGE_KEY_WORKFLOW_URL, newUrl);
  };

  const handleClassify = async (imageDataUrlOrUrl: string, imageName: string = 'Garbage Sample') => {
    setIsLoading(true);
    setError(null);
    setCurrentImage(imageDataUrlOrUrl);
    setCurrentName(imageName);

    try {
      const response = await fetch('/api/classify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: imageDataUrlOrUrl,
          name: imageName,
          apiKey: apiKey,
          workflowUrl: workflowUrl,
        }),
      });

      const data: ClassificationResult = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to complete classification.');
      }

      setCurrentResult(data);

      // Add to history
      const primaryCategory =
        data.geminiReport?.primary_category ||
        (data.roboflow?.predictions?.[0]?.class ? `${data.roboflow.predictions[0].class} (Detected)` : 'Garbage Item');

      const newItem: HistoryItem = {
        id: `hist-${Date.now()}`,
        timestamp: new Date().toISOString(),
        imageUrl: imageDataUrlOrUrl,
        imageName: imageName,
        category: primaryCategory,
        result: data,
      };

      setHistory((prev) => [newItem, ...prev.slice(0, 49)]); // keep up to 50
    } catch (err: any) {
      console.error('Classification error:', err);
      setError(err.message || 'An error occurred while classifying the image.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectHistoryItem = (item: HistoryItem) => {
    setCurrentImage(item.imageUrl);
    setCurrentName(item.imageName);
    setCurrentResult(item.result);
    setError(null);
  };

  const handleClearHistory = () => {
    setHistory([]);
    localStorage.removeItem(STORAGE_KEY_HISTORY);
  };

  const handleReset = () => {
    setCurrentResult(null);
    setCurrentImage(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col selection:bg-emerald-500 selection:text-slate-950">
      {/* Top Header */}
      <Header
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        historyCount={history.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Error Alert if any */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-rose-200">Classification Request Failed</p>
                <p className="text-xs text-rose-300/80 mt-1">{error}</p>
              </div>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-200 hover:bg-rose-500/30 transition-colors"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Display Result Report OR Upload Section */}
        {currentResult && currentImage ? (
          <ResultReport
            result={currentResult}
            imageUrl={currentImage}
            imageName={currentName}
            onReset={handleReset}
          />
        ) : (
          <UploadSection
            onClassify={handleClassify}
            isLoading={isLoading}
            onOpenWebcam={() => setIsWebcamOpen(true)}
            onOpenRealtimeClassify={() => setIsRealtimeOpen(true)}
          />
        )}

        {/* Environmental Impact Module */}
        <ImpactDashboard history={history} />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 mt-12 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <img
              src="/Gemini_Generated_Image_lmzx7hlmzx7hlmzx-removebg-preview.png"
              alt="EcoClassify Logo"
              className="w-12 h-12 object-contain filter drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]"
            />
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
              <span className="font-semibold text-slate-300">EcoClassify AI</span>
              <span className="hidden sm:inline text-slate-600">—</span>
              <span className="text-emerald-400 font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-xs">
                Model trained by JLNerecina
              </span>
            </div>
            <span className="text-slate-500">•</span>
            <span className="text-slate-400">Powered by Roboflow Serverless Workflows & RF-DETR Model</span>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="hover:text-emerald-400 transition-colors"
            >
              Workflow Settings
            </button>
            <span>•</span>
            <span className="text-slate-600">Model: garbage-classification-3</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <WebcamModal
        isOpen={isWebcamOpen}
        onClose={() => setIsWebcamOpen(false)}
        onCapture={(dataUrl) => handleClassify(dataUrl, 'Webcam Captured Photo')}
      />

      <RealtimeWebcamModal
        isOpen={isRealtimeOpen}
        onClose={() => setIsRealtimeOpen(false)}
        apiKey={apiKey}
        workflowUrl={workflowUrl}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        apiKey={apiKey}
        workflowUrl={workflowUrl}
        onSave={handleSaveSettings}
      />

      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onSelectHistory={handleSelectHistoryItem}
        onClearHistory={handleClearHistory}
      />
    </div>
  );
}

import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  Camera,
  Link as LinkIcon,
  Sparkles,
  ArrowRight,
  X,
  FileImage,
  CheckCircle2,
  HelpCircle,
  Zap,
} from 'lucide-react';
import { SAMPLE_GARBAGE_IMAGES } from '../data/samples';
import { SampleGarbageImage } from '../types';

interface UploadSectionProps {
  onClassify: (imageDataUrlOrUrl: string, name?: string) => void;
  isLoading: boolean;
  onOpenWebcam: () => void;
}

export const UploadSection: React.FC<UploadSectionProps> = ({
  onClassify,
  isLoading,
  onOpenWebcam,
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedName, setSelectedName] = useState<string>('Uploaded Garbage Image');
  const [urlInput, setUrlInput] = useState<string>('');
  const [showUrlInput, setShowUrlInput] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Global Keyboard Shortcut: Enter to classify
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if a modal is open or if user is typing in an input field
      const hasOpenModal = document.querySelector('.fixed.inset-0.z-50') !== null;
      if (
        e.key === 'Enter' &&
        selectedImage &&
        !isLoading &&
        !hasOpenModal &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault();
        onClassify(selectedImage, selectedName);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedImage, isLoading, selectedName, onClassify]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file (JPEG, PNG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setSelectedImage(reader.result);
        setSelectedName(file.name);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;
    setSelectedImage(urlInput.trim());
    setSelectedName('Image from Web URL');
    setShowUrlInput(false);
  };

  const handleSampleSelect = (sample: SampleGarbageImage) => {
    setSelectedImage(sample.url);
    setSelectedName(sample.name);
  };

  const handleClearSelected = () => {
    setSelectedImage(null);
    setSelectedName('Uploaded Garbage Image');
  };

  const handleTriggerClassify = () => {
    if (selectedImage) {
      onClassify(selectedImage, selectedName);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden">
      {/* Background Accent Gradients */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-teal-500/5 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

      <div className="relative z-10 space-y-6">
        {/* Title & Description */}
        <div className="max-w-2xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium mb-3">
            <Zap className="w-3.5 h-3.5 text-emerald-400" />
            <span>Roboflow RF-DETR Model Workflow</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
            Classify Waste & Recycling Items
          </h2>
          <p className="text-sm text-slate-400 mt-2 leading-relaxed">
            Upload an image of garbage, food waste, plastics, or hazardous material.
            Our RF-DETR model and AI engine will identify the item and generate an instant disposal report.
          </p>
        </div>

        {/* Selected Image Preview OR Drop Zone */}
        {selectedImage ? (
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 md:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-3 overflow-hidden">
                <FileImage className="w-5 h-5 text-emerald-400 shrink-0" />
                <span className="text-sm font-medium text-slate-200 truncate max-w-xs md:max-w-md">
                  {selectedName}
                </span>
              </div>
              <button
                onClick={handleClearSelected}
                disabled={isLoading}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="Remove image"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative aspect-video max-h-[380px] w-full rounded-xl overflow-hidden bg-slate-900 border border-slate-800/80 flex items-center justify-center">
              <img
                src={selectedImage}
                alt="Garbage preview"
                className="max-h-full w-auto object-contain"
                crossOrigin="anonymous"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <button
                onClick={handleClearSelected}
                disabled={isLoading}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
              >
                Choose Different Image
              </button>

              <button
                onClick={handleTriggerClassify}
                disabled={isLoading}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 disabled:opacity-50 text-slate-950 font-bold text-sm transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                    <span>Analyzing Garbage...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span className="flex items-center space-x-1.5">
                      <span>Run AI Classification Report</span>
                      <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-slate-950/20 border border-slate-950/20 font-mono font-medium">
                        Enter
                      </span>
                    </span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-8 md:p-12 text-center transition-all ${
              isDragging
                ? 'border-emerald-400 bg-emerald-500/10'
                : 'border-slate-800 bg-slate-950/40 hover:border-slate-700 hover:bg-slate-950/60'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />

            <div className="max-w-md mx-auto space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center mx-auto text-emerald-400 shadow-inner">
                <Upload className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-base font-semibold text-white">
                  Drag and drop your garbage image here
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Supports JPG, PNG, WebP or GIF up to 10MB
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs transition-colors shadow-lg shadow-emerald-500/20"
                >
                  Browse Files
                </button>

                <button
                  onClick={onOpenWebcam}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors border border-slate-700 flex items-center space-x-1.5"
                >
                  <Camera className="w-4 h-4 text-emerald-400" />
                  <span>Use Camera</span>
                </button>

                <button
                  onClick={() => setShowUrlInput(!showUrlInput)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors border border-slate-700 flex items-center space-x-1.5"
                >
                  <LinkIcon className="w-4 h-4 text-emerald-400" />
                  <span>Paste Image URL</span>
                </button>
              </div>

              {/* URL Input collapse */}
              {showUrlInput && (
                <form
                  onSubmit={handleUrlSubmit}
                  className="pt-3 flex items-center space-x-2 max-w-md mx-auto"
                >
                  <input
                    type="url"
                    placeholder="https://example.com/garbage-photo.jpg"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    required
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs"
                  >
                    Load
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Quick Test Samples Drawer */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Or Try Sample Test Garbage Images
            </span>
            <span className="text-xs text-slate-500">Click to load</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {SAMPLE_GARBAGE_IMAGES.map((sample) => (
              <button
                key={sample.id}
                onClick={() => handleSampleSelect(sample)}
                disabled={isLoading}
                className="group relative rounded-xl overflow-hidden border border-slate-800 hover:border-emerald-500/50 bg-slate-950 text-left transition-all p-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <div className="aspect-square rounded-lg overflow-hidden bg-slate-900 mb-2 relative">
                  <img
                    src={sample.url}
                    alt={sample.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <span className="absolute bottom-1 right-1 text-[9px] font-semibold px-1.5 py-0.5 rounded bg-slate-950/80 text-emerald-400 backdrop-blur-sm border border-slate-800">
                    {sample.category.split('/')[0].trim()}
                  </span>
                </div>
                <p className="text-xs font-medium text-slate-200 truncate group-hover:text-emerald-400 transition-colors">
                  {sample.name}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

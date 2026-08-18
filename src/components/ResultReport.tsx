import React, { useState } from 'react';
import {
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Recycle,
  Info,
  Copy,
  Download,
  Code,
  Sparkles,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Clock,
  ShieldCheck,
  Zap,
  FileText,
} from 'lucide-react';
import { ClassificationResult, GeminiReport } from '../types';

interface ResultReportProps {
  result: ClassificationResult;
  imageUrl: string;
  imageName: string;
  onReset: () => void;
}

export const ResultReport: React.FC<ResultReportProps> = ({
  result,
  imageUrl,
  imageName,
  onReset,
}) => {
  const [showRawJson, setShowRawJson] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [imgError, setImgError] = useState<boolean>(false);

  const roboflow = result.roboflow;
  const gemini = result.geminiReport || {};

  // Extract predictions if available from roboflow response
  const predictions =
    roboflow?.predictions ||
    roboflow?.outputs?.[0]?.predictions ||
    roboflow?.outputs?.predictions ||
    roboflow?.outputs?.[0]?.output ||
    [];

  // Format image source string cleanly
  const formatImgSrc = (src: any): string | null => {
    if (!src) return null;
    if (typeof src !== 'string') {
      if (src.value && typeof src.value === 'string') return formatImgSrc(src.value);
      if (src.base64 && typeof src.base64 === 'string') return formatImgSrc(src.base64);
      return null;
    }
    const trimmed = src.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:image/')) {
      return trimmed;
    }
    if (trimmed.length > 100) {
      return `data:image/jpeg;base64,${trimmed}`;
    }
    return null;
  };

  // Also check if roboflow provided an annotated output image
  const rawOutputImage = formatImgSrc(
    roboflow?.output_image ||
    roboflow?.outputs?.[0]?.output_image ||
    roboflow?.outputs?.[0]?.image ||
    roboflow?.outputs?.[0]?.output
  );

  const displayImg = !imgError && rawOutputImage ? rawOutputImage : imageUrl;

  // Determine Primary Bin & Color
  const primaryCategory =
    gemini.primary_category ||
    (predictions.length > 0 ? predictions[0].class : 'Unclassified Waste');

  const getBinStyle = (categoryStr: string) => {
    const cat = categoryStr.toLowerCase();
    if (cat.includes('recycle') || cat.includes('plastic') || cat.includes('paper') || cat.includes('metal') || cat.includes('glass')) {
      return {
        binName: 'Blue Bin (Recyclables)',
        bgColor: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
        badgeBg: 'bg-blue-500 text-slate-950',
        dotColor: 'bg-blue-400',
      };
    } else if (cat.includes('organic') || cat.includes('compost') || cat.includes('food')) {
      return {
        binName: 'Green Bin (Compost / Organic)',
        bgColor: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
        badgeBg: 'bg-emerald-500 text-slate-950',
        dotColor: 'bg-emerald-400',
      };
    } else if (cat.includes('hazard') || cat.includes('battery') || cat.includes('e-waste') || cat.includes('electronic')) {
      return {
        binName: 'Red/Special Bin (Hazardous E-Waste)',
        bgColor: 'bg-rose-500/10 border-rose-500/30 text-rose-400',
        badgeBg: 'bg-rose-500 text-slate-950',
        dotColor: 'bg-rose-400',
      };
    } else {
      return {
        binName: 'Black Bin (General Waste)',
        bgColor: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
        badgeBg: 'bg-amber-500 text-slate-950',
        dotColor: 'bg-amber-400',
      };
    }
  };

  const binStyle = getBinStyle(primaryCategory);

  const handleCopyReport = () => {
    const textToCopy = `ECOCLASSIFY AI GARBAGE REPORT
--------------------------------
Item: ${gemini.item_name || imageName}
Category: ${primaryCategory}
Bin Recommendation: ${gemini.bin_color_recommendation || binStyle.binName}
Disposal Steps:
${gemini.step_by_step_disposal ? gemini.step_by_step_disposal.join('\n') : 'Follow municipal waste guidelines.'}
Eco Tip: ${gemini.eco_tip || 'Reduce single-use items.'}`;

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadJson = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(result, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `garbage-report-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleDownloadText = () => {
    const textContent = `ECOCLASSIFY AI GARBAGE REPORT
--------------------------------
Item: ${gemini.item_name || imageName}
Category: ${primaryCategory}
Bin Recommendation: ${gemini.bin_color_recommendation || binStyle.binName}
Disposal Steps:
${gemini.step_by_step_disposal ? gemini.step_by_step_disposal.join('\n') : 'Follow municipal waste guidelines.'}
Eco Tip: ${gemini.eco_tip || 'Reduce single-use items.'}`;

    const dataStr =
      'data:text/plain;charset=utf-8,' + encodeURIComponent(textContent);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `classification-report-${Date.now()}.txt`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6">
      {/* Top Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <button
          onClick={onReset}
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors border border-slate-700"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Classify Another Item</span>
        </button>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleCopyReport}
            className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors border border-slate-700"
          >
            <Copy className="w-3.5 h-3.5 text-slate-400" />
            <span>{copied ? 'Copied!' : 'Copy Summary'}</span>
          </button>

          <button
            onClick={handleDownloadText}
            className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors border border-slate-700"
          >
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            <span>Export Text</span>
          </button>

          <button
            onClick={handleDownloadJson}
            className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors border border-slate-700"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Left Image & Model Box, Right Detailed Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Garbage Image Analysis
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                RF-DETR AI Model
              </span>
            </div>

            {/* Display Annotated or Original Image */}
            <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center">
              <img
                src={displayImg}
                alt={imageName || 'Garbage classified'}
                className="w-full h-full object-contain"
                onError={() => setImgError(true)}
              />
            </div>

            {/* Model Detection Overview Badge */}
            <div className={`p-4 rounded-2xl border ${binStyle.bgColor} space-y-2`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider">
                  Bin Recommendation
                </span>
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${binStyle.badgeBg}`}>
                  {gemini.bin_color_recommendation || binStyle.binName}
                </span>
              </div>
              <p className="text-sm font-semibold text-white">
                {gemini.item_name || 'Detected Garbage Object'}
              </p>
              {gemini.description && (
                <p className="text-xs text-slate-300 leading-relaxed">
                  {gemini.description}
                </p>
              )}
            </div>
          </div>

          {/* Roboflow Detection Output List */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
                <Zap className="w-3.5 h-3.5 text-emerald-400" />
                <span>Model Detections & Confidence</span>
              </h4>
              <span className="text-xs text-slate-500">
                {Array.isArray(predictions) ? predictions.length : 0} Items
              </span>
            </div>

            {Array.isArray(predictions) && predictions.length > 0 ? (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {predictions.map((pred: any, idx: number) => {
                  const conf = Math.round((pred.confidence || pred.score || 0.85) * 100);
                  const label = pred.class || pred.label || `Object ${idx + 1}`;
                  return (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center space-x-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        <span className="font-medium text-slate-200 capitalize">{label}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-emerald-400 h-full rounded-full"
                            style={{ width: `${conf}%` }}
                          />
                        </div>
                        <span className="font-mono text-emerald-400 text-[11px] font-semibold">
                          {conf}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/60 text-xs text-slate-400 text-center">
                Automated classification complete based on RF-DETR workflow analysis.
              </div>
            )}
          </div>
        </div>

        {/* Right Column (7 Cols): Comprehensive Report */}
        <div className="lg:col-span-7 space-y-4">
          {/* Main Waste Classification Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
            <div className="border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-1">
                <Recycle className="w-4 h-4" />
                <span>Automated Classification Report</span>
              </div>
              <h3 className="text-xl font-bold text-white">
                {gemini.item_name || 'Garbage Classification Summary'}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Primary Waste Type:{' '}
                <span className="text-emerald-400 font-semibold">{primaryCategory}</span>
              </p>
            </div>

            {/* Step by Step Disposal Protocol */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Proper Disposal Instructions</span>
              </h4>

              {gemini.step_by_step_disposal && gemini.step_by_step_disposal.length > 0 ? (
                <div className="grid grid-cols-1 gap-2.5">
                  {gemini.step_by_step_disposal.map((step: string, idx: number) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-200 flex items-start space-x-3"
                    >
                      <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span className="leading-relaxed">{step}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300 leading-relaxed">
                  1. Clean and rinse any residue before disposal.
                  <br />
                  2. Separate recyclable components (caps, lids, liners).
                  <br />
                  3. Place inside the designated {binStyle.binName}.
                </div>
              )}
            </div>

            {/* Material & Eco Breakdown Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Material Composition */}
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
                  <span>Material Composition</span>
                </span>
                {gemini.material_composition && gemini.material_composition.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {gemini.material_composition.map((mat: string, i: number) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-200 text-xs font-medium border border-slate-700"
                      >
                        {mat}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-300">
                    Standard synthetic / organic composite material.
                  </p>
                )}
              </div>

              {/* Environmental Impact */}
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Environmental Impact</span>
                </span>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {gemini.environmental_impact ||
                    'Improper disposal can lead to long-term landfill degradation or soil accumulation. Recycling significantly conserves raw energy.'}
                </p>
              </div>
            </div>

            {/* Eco Tip Box */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 flex items-start space-x-3">
              <Sparkles className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  Sustainability Eco-Tip
                </p>
                <p className="text-xs text-slate-200 mt-1 leading-relaxed">
                  {gemini.eco_tip ||
                    'Always check your local municipal guidelines for item-specific recycling symbol codes (#1 to #7) to maximize eco-efficiency.'}
                </p>
              </div>
            </div>
          </div>

          {/* Raw JSON Developer Drawer */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
            <button
              onClick={() => setShowRawJson(!showRawJson)}
              className="w-full flex items-center justify-between text-xs font-semibold text-slate-400 hover:text-white transition-colors"
            >
              <div className="flex items-center space-x-2">
                <Code className="w-4 h-4 text-emerald-400" />
                <span>View Raw Roboflow Serverless API Payload</span>
              </div>
              {showRawJson ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>

            {showRawJson && (
              <div className="mt-3 p-3 rounded-xl bg-slate-950 border border-slate-800 overflow-x-auto">
                <pre className="text-[11px] font-mono text-emerald-300/90 whitespace-pre-wrap">
                  {JSON.stringify(roboflow, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { HistoryItem } from '../types';
import {
  Leaf,
  Zap,
  Car,
  Trees,
  Recycle,
  TrendingUp,
  Award,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Info,
  Layers,
  Flame,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';

interface ImpactDashboardProps {
  history: HistoryItem[];
}

export const ImpactDashboard: React.FC<ImpactDashboardProps> = ({ history }) => {
  const [unit, setUnit] = useState<'kg' | 'lbs'>('kg');
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  // Helper calculations based on history items
  const stats = React.useMemo(() => {
    let totalItems = history.length;
    let totalCo2SavedKg = 0; // in kg
    let totalMassKg = 0; // estimated diverted waste weight
    let recyclableCount = 0;
    let organicCount = 0;
    let hazardousCount = 0;
    let trashCount = 0;

    const categoryCounts: Record<string, number> = {
      Plastic: 0,
      Metal: 0,
      Paper: 0,
      Glass: 0,
      Organic: 0,
      Hazardous: 0,
      Other: 0,
    };

    history.forEach((item) => {
      const cat = (item.category || '').toLowerCase();
      const rec = (item.result?.geminiReport?.bin_color_recommendation || '').toLowerCase();

      let itemCo2 = 0.08; // default
      let itemMass = 0.05; // default

      if (cat.includes('metal') || cat.includes('aluminum') || cat.includes('can')) {
        categoryCounts.Metal++;
        itemCo2 = 0.17;
        itemMass = 0.015;
        recyclableCount++;
      } else if (cat.includes('plastic') || cat.includes('bottle')) {
        categoryCounts.Plastic++;
        itemCo2 = 0.08;
        itemMass = 0.025;
        recyclableCount++;
      } else if (cat.includes('paper') || cat.includes('cardboard') || cat.includes('box')) {
        categoryCounts.Paper++;
        itemCo2 = 0.12;
        itemMass = 0.08;
        recyclableCount++;
      } else if (cat.includes('glass') || cat.includes('jar')) {
        categoryCounts.Glass++;
        itemCo2 = 0.10;
        itemMass = 0.18;
        recyclableCount++;
      } else if (cat.includes('organic') || cat.includes('compost') || cat.includes('food')) {
        categoryCounts.Organic++;
        itemCo2 = 0.15;
        itemMass = 0.12;
        organicCount++;
      } else if (cat.includes('hazardous') || cat.includes('e-waste') || cat.includes('battery')) {
        categoryCounts.Hazardous++;
        itemCo2 = 0.25;
        itemMass = 0.03;
        hazardousCount++;
      } else {
        if (rec.includes('blue') || rec.includes('recycl') || rec.includes('green') || rec.includes('compost')) {
          recyclableCount++;
          itemCo2 = 0.10;
        } else {
          trashCount++;
          itemCo2 = 0.01;
        }
        categoryCounts.Other++;
      }

      totalCo2SavedKg += itemCo2;
      totalMassKg += itemMass;
    });

    const divertedCount = recyclableCount + organicCount + hazardousCount;
    const diversionRate = totalItems > 0 ? Math.round((divertedCount / totalItems) * 100) : 0;

    // Convert units if requested
    const multiplier = unit === 'lbs' ? 2.20462 : 1;
    const displayCo2 = (totalCo2SavedKg * multiplier).toFixed(2);
    const displayMass = (totalMassKg * multiplier).toFixed(2);

    // Equivalents
    const milesDriven = Math.round(totalCo2SavedKg / 0.404);
    const phoneCharges = Math.round(totalCo2SavedKg / 0.0082);
    const ledHours = Math.round(totalCo2SavedKg / 0.006);
    const treeSeedlings = (totalCo2SavedKg / 20.0).toFixed(1);

    return {
      totalItems,
      totalCo2SavedKg,
      displayCo2,
      displayMass,
      diversionRate,
      divertedCount,
      categoryCounts,
      milesDriven,
      phoneCharges,
      ledHours,
      treeSeedlings,
    };
  }, [history, unit]);

  // Determine top category
  const topCategory = React.useMemo(() => {
    let maxCat = 'Plastic';
    let maxVal = -1;
    (Object.entries(stats.categoryCounts) as [string, number][]).forEach(([cat, count]) => {
      if (count > maxVal) {
        maxVal = count;
        maxCat = cat;
      }
    });
    return maxVal > 0 ? maxCat : 'Recyclable';
  }, [stats.categoryCounts]);

  return (
    <section className="bg-slate-900/90 rounded-3xl border border-slate-800 p-6 shadow-2xl backdrop-blur-sm space-y-6">
      {/* Module Title & Toggle Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-emerald-500/20">
            <Leaf className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-bold text-white tracking-tight">
                Environmental Impact Dashboard
              </h2>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                EcoMetrics Live
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Estimated carbon footprint savings & waste diversion metrics
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Unit Switcher */}
          <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center text-xs font-semibold">
            <button
              onClick={() => setUnit('kg')}
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                unit === 'kg'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              kg CO₂
            </button>
            <button
              onClick={() => setUnit('lbs')}
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                unit === 'lbs'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              lbs CO₂
            </button>
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 transition-colors"
            title={isExpanded ? 'Collapse Module' : 'Expand Module'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="space-y-6">
          {/* Key Metric Highlights Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Total CO2 Saved */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-emerald-500/20 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                <Leaf className="w-16 h-16 text-emerald-400" />
              </div>
              <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                Carbon Savings
              </p>
              <div className="mt-2 flex items-baseline space-x-1">
                <span className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  {stats.displayCo2}
                </span>
                <span className="text-xs font-bold text-slate-400">{unit} CO₂e</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 flex items-center space-x-1">
                <TrendingUp className="w-3 h-3 text-emerald-400 inline" />
                <span>Avoided GHG emissions</span>
              </p>
            </div>

            {/* Landfill Diversion Rate */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-teal-500/20 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                <Recycle className="w-16 h-16 text-teal-400" />
              </div>
              <p className="text-xs font-semibold text-teal-400 uppercase tracking-wider">
                Landfill Diversion
              </p>
              <div className="mt-2 flex items-baseline space-x-1">
                <span className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  {stats.diversionRate}%
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                {stats.divertedCount} of {stats.totalItems} items recycled/composted
              </p>
            </div>

            {/* Diverted Waste Mass */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-blue-500/20 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                <Layers className="w-16 h-16 text-blue-400" />
              </div>
              <p className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
                Diverted Mass
              </p>
              <div className="mt-2 flex items-baseline space-x-1">
                <span className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  {stats.displayMass}
                </span>
                <span className="text-xs font-bold text-slate-400">{unit}</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Total physical material saved</p>
            </div>

            {/* Tree Equivalent */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-amber-500/20 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                <Trees className="w-16 h-16 text-amber-400" />
              </div>
              <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
                Tree Equivalent
              </p>
              <div className="mt-2 flex items-baseline space-x-1">
                <span className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  {stats.treeSeedlings}
                </span>
                <span className="text-xs font-bold text-slate-400">trees</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">10-yr seedling absorption</p>
            </div>
          </div>

          {/* Real World Equivalencies Grid */}
          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>Real-World Environmental Equivalents</span>
              </h3>
              <span className="text-[11px] text-slate-500">Based on EPA WARM & IPCC conversion standards</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              {/* Miles Driven */}
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800/80 flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/20">
                  <Car className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-base font-bold text-white">{stats.milesDriven} miles</p>
                  <p className="text-[11px] text-slate-400">Gasoline car driving avoided</p>
                </div>
              </div>

              {/* Smartphone Charges */}
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800/80 flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center shrink-0 border border-cyan-500/20">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-base font-bold text-white">{stats.phoneCharges.toLocaleString()} charges</p>
                  <p className="text-[11px] text-slate-400">Smartphone battery recharges</p>
                </div>
              </div>

              {/* LED Lighting Hours */}
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800/80 flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20">
                  <Flame className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-base font-bold text-white">{stats.ledHours.toLocaleString()} hours</p>
                  <p className="text-[11px] text-slate-400">Energy efficient LED bulb use</p>
                </div>
              </div>
            </div>
          </div>

          {/* Waste Composition Breakdown Bars */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-2">
                <Award className="w-4 h-4 text-emerald-400" />
                <span>Classified Material Breakdown</span>
              </h3>
              <span className="text-[11px] text-slate-400">
                {stats.totalItems} total items in log
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { name: 'Metal', count: stats.categoryCounts.Metal, color: 'bg-emerald-500', text: 'text-emerald-400' },
                { name: 'Plastic', count: stats.categoryCounts.Plastic, color: 'bg-cyan-500', text: 'text-cyan-400' },
                { name: 'Paper', count: stats.categoryCounts.Paper, color: 'bg-amber-500', text: 'text-amber-400' },
                { name: 'Glass', count: stats.categoryCounts.Glass, color: 'bg-teal-500', text: 'text-teal-400' },
                { name: 'Organic', count: stats.categoryCounts.Organic, color: 'bg-lime-500', text: 'text-lime-400' },
                { name: 'Hazardous', count: stats.categoryCounts.Hazardous, color: 'bg-rose-500', text: 'text-rose-400' },
              ].map((item) => {
                const pct = stats.totalItems > 0 ? Math.round((item.count / stats.totalItems) * 100) : 0;
                return (
                  <div key={item.name} className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-300">{item.name}</span>
                      <span className={item.text}>{pct}%</span>
                    </div>
                    <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full ${item.color} rounded-full transition-all duration-500`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-slate-500 text-right">{item.count} items</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Actionable Eco Recommendation Box */}
          <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/20 flex items-start space-x-3">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <p className="font-bold text-emerald-200">
                Personalized Impact Insight
              </p>
              <p className="text-slate-300 leading-relaxed">
                You frequently classify <span className="font-semibold text-emerald-400">{topCategory}</span> items. 
                Rinsing containers before placing them in the blue bin prevents cross-contamination, ensuring up to <strong>98%</strong> of recycled material successfully reaches re-manufacturing pipelines!
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

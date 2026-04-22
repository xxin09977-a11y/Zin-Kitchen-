import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, ChefHat, ListOrdered, Share2, Download, Minus, Plus, Check } from 'lucide-react';
import { type Recipe } from '../db';
import { DISPLAY_UNIT_MAP } from '../types';
import { cn } from '../lib/utils';

interface RecipeDetailProps {
  recipe: Recipe;
  onClose: () => void;
}

export const RecipeDetail: React.FC<RecipeDetailProps> = ({ recipe, onClose }) => {
  const [multiplier, setMultiplier] = useState(1);
  const exportAsJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(recipe));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href",     dataStr);
    downloadAnchorNode.setAttribute("download", `${recipe.title.replace(/\s+/g, '_')}_backup.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md"
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        onClick={(e) => e.stopPropagation()}
        className="glass-dark w-full max-w-4xl h-[98vh] sm:h-[90vh] overflow-y-auto rounded-t-[3rem] sm:rounded-[3rem] p-0 relative shadow-2xl overflow-x-hidden border border-white/10"
      >
        {/* Sticky Header Actions */}
        <div className="sticky top-0 z-40 flex justify-between items-center p-6 bg-transparent backdrop-blur-md">
          <button 
            onClick={onClose}
            className="p-3 bg-black/40 hover:bg-black/60 rounded-full transition-all text-white border border-white/10 shadow-xl active:scale-90"
          >
            <X size={20} />
          </button>
          <div className="flex gap-2">
            <button 
              onClick={exportAsJSON}
              className="p-3 bg-black/40 hover:bg-black/60 rounded-full transition-all text-white border border-white/10 shadow-xl active:scale-90"
              title="Export JSON"
            >
              <Download size={20} />
            </button>
            <button 
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: recipe.title,
                    text: `Check out this recipe: ${recipe.title}`,
                    url: window.location.href
                  }).catch(console.error);
                }
              }}
              className="p-3 bg-accent/80 hover:bg-accent rounded-full transition-all text-white border border-white/20 shadow-xl active:scale-90"
              title="Share"
            >
              <Share2 size={20} />
            </button>
          </div>
        </div>

        {/* Hero Image Section */}
        <div className="relative w-full h-[40vh] sm:h-[50vh] -mt-20">
          {recipe.imageUrl ? (
            <img 
              src={recipe.imageUrl} 
              alt={recipe.title} 
              referrerPolicy="no-referrer" 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-black flex items-center justify-center">
              <ChefHat size={80} className="text-white/10" />
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black to-transparent" />
        </div>

        {/* Content Section */}
        <div className="px-6 pb-20 sm:px-12 -mt-16 relative z-10">
          <div className="space-y-12">
            {/* Title & Description Card */}
            <div className="glass-dark p-8 rounded-[2.5rem] border border-white/20 shadow-2xl backdrop-blur-2xl">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-accent/20 text-accent text-[10px] font-black uppercase tracking-[3px] rounded-full border border-accent/30">
                    Masterpiece
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-[3px] text-white/40">
                    {new Date(recipe.updatedAt).toLocaleDateString([], { month: 'long', year: 'numeric' })}
                  </span>
                </div>
                <h1 className="text-4xl sm:text-6xl font-black leading-tight tracking-tighter text-white">
                  {recipe.title}
                </h1>
                <p className="text-lg text-white/70 leading-relaxed max-w-2xl font-medium">
                  {recipe.description || "A secret blend of flavors and passion, curated for the ultimate dining experience."}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.5fr] gap-12 text-white">
              {/* Ingredients Column */}
              <section className="space-y-8">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h2 className="text-2xl font-black tracking-tight uppercase">Ingredients</h2>
                    <p className="text-[10px] font-black uppercase tracking-[2px] text-accent">The Foundation</p>
                  </div>
                  
                  {/* Servings Tool */}
                  <div className="flex items-center gap-3 bg-white/5 p-2 rounded-2xl border border-white/10">
                    <button 
                      onClick={() => setMultiplier(m => Math.max(0.1, parseFloat((m - 0.1).toFixed(2))))}
                      className="p-1.5 hover:bg-accent rounded-lg transition-all text-white active:scale-75"
                    >
                      <Minus size={14} />
                    </button>
                    <div className="flex flex-col items-center min-w-[40px]">
                      <span className="text-[8px] font-black uppercase text-white/40">Scale</span>
                      <span className="text-xs font-black tabular-nums text-accent">{multiplier}x</span>
                    </div>
                    <button 
                      onClick={() => setMultiplier(m => Math.min(20, parseFloat((m + 0.1).toFixed(2))))}
                      className="p-1.5 hover:bg-accent rounded-lg transition-all text-white active:scale-75"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>

                <div className="glass-dark rounded-[2rem] border border-white/10 p-6 shadow-xl space-y-4">
                  {recipe.ingredients.map((ing, i) => (
                    <div key={i} className="flex justify-between items-center group cursor-pointer hover:bg-white/5 p-2 -m-2 rounded-xl transition-all">
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full border-2 border-white/20 group-hover:border-accent group-hover:bg-accent/10 transition-all flex items-center justify-center">
                          <Check size={10} className="text-white opacity-0 group-hover:opacity-100" />
                        </div>
                        <span className="text-base font-bold text-white group-hover:text-accent transition-colors">
                          {ing.name}
                        </span>
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-lg font-black text-white decoration-accent/40">
                          {(ing.amount * multiplier).toFixed(1)}
                        </span>
                        <span className="text-[10px] font-black uppercase text-white/40 tracking-widest">
                          {ing.unit}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Steps Column */}
              <section className="space-y-8">
                <div className="space-y-1">
                  <h2 className="text-2xl font-black tracking-tight uppercase">Execution</h2>
                  <p className="text-[10px] font-black uppercase tracking-[2px] text-accent">Step-by-Step Mastery</p>
                </div>

                <div className="space-y-8">
                  {recipe.cookingSteps.map((step, i) => (
                    <div key={i} className="relative group flex gap-8">
                      {/* Step Number with Line */}
                      <div className="flex flex-col items-center">
                        <div className="w-12 h-12 rounded-2xl bg-accent text-white flex items-center justify-center text-lg font-black shadow-[0_0_20px_-5px_px_var(--accent-color)] z-10 transition-transform group-hover:scale-110">
                          {i + 1}
                        </div>
                        {i < recipe.cookingSteps.length - 1 && (
                          <div className="w-1 h-full bg-gradient-to-b from-accent to-transparent opacity-20 -mt-2 rounded-full" />
                        )}
                      </div>

                      <div className="pb-8 flex-1">
                        <div className="glass-dark p-6 rounded-[2rem] border border-white/10 group-hover:border-white/30 group-hover:bg-white/5 transition-all shadow-lg active:scale-[0.99]">
                          <p className="text-lg leading-relaxed text-white/80 group-hover:text-white transition-colors font-medium">
                            {step}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

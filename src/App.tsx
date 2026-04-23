import { useState, useMemo, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Settings2, 
  Download, 
  Upload, 
  ChefHat,
  Sun,
  Moon,
  Type,
  Palette,
  ChevronUp,
  X
} from 'lucide-react';
import { db, getRecipes, type Recipe } from './db';
import { RecipeCard } from './components/RecipeCard';
import { RecipeCardSkeleton } from './components/RecipeCardSkeleton';
import { RecipeForm } from './components/RecipeForm';
import { RecipeDetail } from './components/RecipeDetail';
import { THEMES, FONT_SIZES, type AppSettings } from './types';
import { cn } from './lib/utils';

// Define the typewriter effect component
const TypewriterText = ({ text }: { text: string }) => {
  const [index, setIndex] = useState(0); // Start at 0 for full typing
  const [isDeleting, setIsDeleting] = useState(false);
  const [pause, setPause] = useState(0);
  const [isZooming, setIsZooming] = useState(true);

  useEffect(() => {
    if (isZooming) {
      const zoomTimer = setTimeout(() => {
        setIsZooming(false);
        setIndex(0);
      }, 500); // Faster zoom
      return () => clearTimeout(zoomTimer);
    }

    const interval = setInterval(() => {
      if (pause > 0) {
        setPause((prev) => prev - 1);
        return;
      }

      if (!isDeleting) {
        if (index < text.length) {
          setIndex((prev) => prev + 1);
        } else {
          setPause(8); // Shorter pause at full logo
          setIsDeleting(true);
        }
      } else {
        if (index > 0) {
          setIndex((prev) => prev - 1);
        } else {
          setIsDeleting(false);
          setIsZooming(true); // Restart the mascot zoom
          setPause(1);
        }
      }
    }, 80); // Faster interval


    return () => clearInterval(interval);
  }, [text, index, isDeleting, pause, isZooming]);

  const displayedText = useMemo(() => text.slice(0, index), [text, index]);

  return (
    <svg 
      className="h-10 w-[240px] overflow-visible shrink-0 cursor-pointer group/logo" 
      viewBox="0 0 240 40"
      onClick={() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }}
    >
      <defs>
        <filter id="colorfulGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      {/* Independent Static Mascot */}
      <g className="transition-transform duration-150 group-hover/logo:scale-110 group-active/logo:scale-95">
        <text
          x="0"
          y="22"
          dominantBaseline="middle"
          className="animate-rainbow-glow"
          style={{ fontSize: "30px", filter: "url(#colorfulGlow)" }}
        >
          🐯
        </text>
      </g>

      {/* Separated Typewriter Text starting from Z */}
      <g transform="translate(48, 22)">
        <text
          x="0"
          y="0"
          dominantBaseline="middle"
          className="text-transparent font-light stroke-[1px] stroke-accent/40 animate-draw-text"
          style={{ 
            fontSize: "22px", 
            letterSpacing: "0.5px",
            fontFamily: "var(--font-sans)"
          }}
        >
          {displayedText}
        </text>
        <text
          x="0"
          y="0"
          dominantBaseline="middle"
          className="fill-white font-light drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]"
          style={{ 
            fontSize: "22px", 
            letterSpacing: "0.5px", 
            fontFamily: "var(--font-sans)"
          }}
        >
          {displayedText}
        </text>
      </g>
    </svg>
  );
};

export default function App() {
  const [showForm, setShowForm] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | undefined>();
  const [viewingRecipe, setViewingRecipe] = useState<Recipe | undefined>();
  const [showSettings, setShowSettings] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  
  const [settings, setSettings] = useState<AppSettings>({
    highContrast: false,
    fontSize: 'normal',
    themeId: 'noir',
    glassmorphism: true
  });

  // Apply theme and font size
  useEffect(() => {
    const theme = THEMES.find(t => t.id === settings.themeId) || THEMES[0];
    const root = document.documentElement;
    
    // Apply colors
    root.style.setProperty('--accent-color', theme.accent);
    root.style.setProperty('--bg-color', theme.bg);
    root.style.setProperty('--grad1-color', theme.grad1);
    root.style.setProperty('--grad2-color', theme.grad2);
    
    // Toggle light class
    if (settings.themeId === 'light') {
      root.classList.add('light');
    } else {
      root.classList.remove('light');
    }

    // Apply global font scaling (affects all rem-based units)
    const activeFontSize = FONT_SIZES.find(f => f.id === settings.fontSize) || FONT_SIZES[0];
    root.style.fontSize = activeFontSize.scale;
    
  }, [settings.themeId, settings.fontSize]);

  // Scroll listener for Back to Top
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle back button for modals
  useEffect(() => {
    const handlePopState = () => {
      setShowForm(false);
      setViewingRecipe(undefined);
      setShowSettings(false);
      setEditingRecipe(undefined);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Update history state when modals open
  useEffect(() => {
    if (showForm || viewingRecipe || showSettings) {
      window.history.pushState(null, '', null);
    }
  }, [showForm, viewingRecipe, showSettings]);

  const recipes = useLiveQuery(
    () => getRecipes(),
    []
  );

  const importRecipes = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = async (event: any) => {
        try {
          const data = JSON.parse(event.target.result);
          const recipesToAdd = Array.isArray(data) ? data : [data];
          for (const r of recipesToAdd) {
            const { id, ...cleanRecipe } = r;
            await db.recipes.add({
              ...cleanRecipe,
              createdAt: Date.now(),
              updatedAt: Date.now()
            });
          }
          alert('Recipes imported successfully!');
        } catch (err) {
          alert('Invalid JSON file.');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const exportAll = async () => {
    const all = await db.recipes.toArray();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(all));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href",     dataStr);
    downloadAnchorNode.setAttribute("download", `chefglass_all_backup.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  return (
    <div className={cn(
      "atmospheric-bg min-h-screen text-text-bright flex flex-col",
      settings.highContrast && "contrast-125 saturate-0",
      !settings.glassmorphism && "no-glass"
    )}>
      {/* Header */}
      <header className="sticky top-0 z-30 pt-4 pb-4 px-6 md:px-12 glass transition-all mx-4 mt-2 rounded-[24px]">
        <div className="max-w-7xl mx-auto flex flex-col gap-5">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-normal tracking-tight flex items-center gap-1">
                <TypewriterText text="Zin Kitchen" />
              </h1>
            </div>
            
            <div className="flex gap-2 shrink-0">
              <button 
                onClick={() => setShowSettings(!showSettings)}
                className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-xl border border-white/20 transition-all duration-150 active:scale-95 text-white shadow-lg"
                title="Settings"
              >
                <Settings2 size={18} className="text-white" />
                <span className="text-xs font-black uppercase tracking-widest hidden sm:inline">Settings</span>
              </button>
            </div>
          </div>

        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-6 md:px-12 py-8 max-w-7xl mx-auto w-full">
        <div className="flex justify-between items-end mb-8 relative">
          <div className="absolute -bottom-4 left-0 right-0 h-px bg-gradient-to-r from-accent/40 via-white/5 to-transparent shadow-[0_1px_0_rgba(255,255,255,0.02)]" />
        </div>

        {recipes === undefined ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-12">
            {Array.from({ length: 8 }).map((_, i) => (
              <RecipeCardSkeleton key={`skeleton-${i}`} />
            ))}
          </div>
        ) : recipes && recipes.length > 0 ? (
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={{
              visible: { 
                transition: { 
                  staggerChildren: 0.03,
                  delayChildren: 0.02
                } 
              }
            }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-12"
          >
            <AnimatePresence mode="popLayout">
              {recipes.map(recipe => (
                <motion.div
                  key={recipe.id}
                  variants={{
                    hidden: { opacity: 0, y: 15, scale: 0.95 },
                    visible: { 
                      opacity: 1, 
                      y: 0, 
                      scale: 1,
                      transition: {
                        type: "spring",
                        damping: 20,
                        stiffness: 500,
                        mass: 0.6
                      }
                    }
                  }}
                  layout
                >
                  <RecipeCard 
                    recipe={recipe} 
                    onClick={() => setViewingRecipe(recipe)}
                    onEdit={(e) => {
                      e.stopPropagation();
                      setEditingRecipe(recipe);
                      setShowForm(true);
                    }}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          <div className="min-h-[50vh] flex flex-col items-center justify-center text-center p-10 relative overflow-hidden group">
            {/* Animated Background Glow for Empty State */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-accent/20 blur-[100px] rounded-full animate-pulse" />
            
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="relative z-10 space-y-4 flex flex-col items-center"
            >
              
              <div className="space-y-4">
                <div className="space-y-1">
                  <h2 className="text-3xl font-black italic tracking-tighter text-white">Your Kitchen is Dormant</h2>
                  <p className="max-w-xs mx-auto text-[10px] font-black uppercase tracking-[3px] text-accent/60">
                    The curator's touch is missing. Begin the legend by adding your first masterpiece.
                  </p>
                </div>
                
                <button 
                  onClick={() => { setEditingRecipe(undefined); setShowForm(true); }}
                  className="px-8 py-3 bg-white text-black rounded-full font-black text-xs uppercase tracking-widest hover:bg-accent hover:text-white transition-all duration-150 shadow-2xl active:scale-95"
                >
                  Create Now
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </main>

      {/* Floating Buttons */}
      <div className="fixed bottom-8 right-8 flex flex-col gap-3 z-40">
        <AnimatePresence>
          {showBackToTop && (
            <motion.button
              initial={{ opacity: 0, y: 20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.8 }}
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="w-12 h-12 rounded-full glass-dark flex items-center justify-center text-white border border-white/20 shadow-2xl hover:bg-white/10 transition-all duration-150 active:scale-95 group/btn"
            >
              <ChevronUp size={24} className="group-hover/btn:-translate-y-1 transition-transform duration-150" />
            </motion.button>
          )}
        </AnimatePresence>

        <button 
          onClick={() => { setEditingRecipe(undefined); setShowForm(true); }}
          className="fab static group/fab active:scale-[0.85] transition-all duration-150"
        >
          <Plus size={28} className="transition-transform duration-300 group-hover/fab:rotate-90 group-active/fab:rotate-180" />
        </button>
      </div>

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={() => setShowSettings(false)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ 
                type: "spring", 
                damping: 25, 
                stiffness: 500,
                mass: 0.5
              }}
              onClick={(e) => e.stopPropagation()}
              className="glass-dark p-6 rounded-[2rem] w-full max-w-sm space-y-6 shadow-2xl border border-white/10 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center border-b border-white/5 pb-4">
                <div className="space-y-0.5">
                  <h2 className="text-xl font-black tracking-tight text-white">System Config</h2>
                  <p className="text-[8px] font-black uppercase tracking-[2px] text-accent">Preferences</p>
                </div>
                <button 
                  onClick={() => setShowSettings(false)} 
                  className="p-2 hover:bg-white/10 rounded-full transition-all text-white/50 border border-transparent hover:border-white/10 active:scale-90"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 px-1">
                    <Palette size={14} className="text-white/40" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Atmosphere</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {THEMES.map(theme => (
                      <button
                        key={theme.id}
                        onClick={() => setSettings(s => ({ ...s, themeId: theme.id }))}
                        className={cn(
                          "w-10 h-10 rounded-xl border-2 transition-all active:scale-90",
                          settings.themeId === theme.id 
                            ? "border-white scale-110 shadow-lg" 
                            : "border-transparent opacity-40 hover:opacity-100"
                        )}
                        style={{ backgroundColor: theme.accent }}
                        title={theme.name}
                      />
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => setSettings(s => ({ ...s, highContrast: !s.highContrast }))}
                    className={cn(
                      "flex items-center justify-between p-4 rounded-2xl border transition-all duration-150 shadow-sm active:scale-[0.98]",
                      settings.highContrast ? "bg-accent/20 border-accent/40 text-accent font-black" : "bg-white/5 border-white/5 text-white/60 hover:bg-white/10"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <Sun size={14} />
                      <span className="text-[10px] uppercase tracking-wider">Contrast</span>
                    </div>
                    <div className={cn("w-2 h-2 rounded-full", settings.highContrast ? "bg-accent animate-pulse" : "bg-white/20")} />
                  </button>

                  <button 
                    onClick={() => setSettings(s => ({ ...s, glassmorphism: !s.glassmorphism }))}
                    className={cn(
                      "flex items-center justify-between p-4 rounded-2xl border transition-all duration-150 shadow-sm active:scale-[0.98]",
                      settings.glassmorphism ? "bg-accent/20 border-accent/40 text-accent font-black" : "bg-white/5 border-white/5 text-white/60 hover:bg-white/10"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <Palette size={14} />
                      <span className="text-[10px] uppercase tracking-wider">FX</span>
                    </div>
                    <div className={cn("w-2 h-2 rounded-full", settings.glassmorphism ? "bg-accent animate-pulse" : "bg-white/20")} />
                  </button>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 px-1">
                    <Type size={14} className="text-white/40" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Typography</span>
                  </div>
                  <div className="flex gap-2">
                    {FONT_SIZES.map(f => (
                      <button
                        key={f.id}
                        onClick={() => setSettings(s => ({ ...s, fontSize: f.id }))}
                        className={cn(
                          "flex-1 py-3 rounded-xl border text-[9px] font-black transition-all shadow-sm active:scale-95",
                          settings.fontSize === f.id ? "bg-accent text-white border-white" : "border-white/5 bg-white/5 text-white/40 hover:bg-white/10 hover:text-white"
                        )}
                      >
                        {f.name.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-white/5 space-y-3">
                  <div className="flex items-center gap-2 px-1">
                    <Settings2 size={12} className="text-white/40" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Maintenance</span>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={importRecipes}
                      className="flex-1 flex flex-col items-center gap-1.5 py-3 bg-white/5 hover:bg-white/10 border border-transparent hover:border-white/10 rounded-2xl transition-all duration-150 shadow-md active:scale-90"
                    >
                      <Upload size={14} className="text-white/40" />
                      <span className="text-[9px] font-black uppercase tracking-widest text-white/60">Restore</span>
                    </button>
                    <button 
                      onClick={exportAll}
                      className="flex-1 flex flex-col items-center gap-1.5 py-3 bg-white/5 hover:bg-white/10 border border-transparent hover:border-white/10 rounded-2xl transition-all duration-150 shadow-md active:scale-90"
                    >
                      <Download size={14} className="text-white/40" />
                      <span className="text-[9px] font-black uppercase tracking-widest text-white/60">Backup</span>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Modals */}
      <AnimatePresence>
        {showForm && (
          <RecipeForm 
            recipe={editingRecipe} 
            onClose={() => { setShowForm(false); setEditingRecipe(undefined); }}
            onSave={() => {}} 
          />
        )}
        {viewingRecipe && (
          <RecipeDetail 
            recipe={viewingRecipe}
            onClose={() => setViewingRecipe(undefined)}
          />
        )}
      </AnimatePresence>

      <footer className="py-12 text-center opacity-10 text-xs font-black tracking-[4px] uppercase mt-auto">
        ChefLocal • Offline Recipe Companion
      </footer>
    </div>
  );
}

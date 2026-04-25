import { useState, useCallback, memo, useRef, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import ReactMarkdown from "react-markdown";
import { THEMES, Theme } from './types';
import { cn } from './lib/utils';

// Helper mapping for dynamic icons
const getIconForRecipe = (name: string): string => {
  const n = name.toLowerCase();
  if (n.includes("spaghetti") || n.includes("pasta") || n.includes("noodle") || n.includes("ramen")) return "🍝";
  if (n.includes("chicken") || n.includes("chop") || n.includes("wing") || n.includes("drumstick")) return "🍗";
  if (n.includes("cake") || n.includes("dessert") || n.includes("sweet") || n.includes("cupcake") || n.includes("cookie")) return "🍰";
  if (n.includes("bread") || n.includes("toast") || n.includes("bun") || n.includes("bagel")) return "🍞";
  if (n.includes("burger") || n.includes("smash")) return "🍔";
  if (n.includes("rice") || n.includes("risotto") || n.includes("biryani")) return "🍚";
  if (n.includes("taco") || n.includes("burrito") || n.includes("mexican")) return "🌮";
  if (n.includes("salad") || n.includes("veg") || n.includes("green")) return "🥗";
  if (n.includes("steak") || n.includes("meat") || n.includes("beef") || n.includes("pork")) return "🥩";
  if (n.includes("sushi") || n.includes("fish") || n.includes("seafood")) return "🍣";
  if (n.includes("pizza")) return "🍕";
  if (n.includes("coffee") || n.includes("tea") || n.includes("drink")) return "☕";
  return "🍽️";
};

const Tooltip = ({ text, children, T }: { text: string; children: React.ReactNode; T: Theme }) => {
  const [show, setShow] = useState(false);
  return (
    <div 
      style={{ position: "relative", display: "inline-block" }} 
      onMouseEnter={() => setShow(true)} 
      onMouseLeave={() => setShow(false)}
      onFocus={() => setShow(true)}
      onBlur={() => setShow(false)}
    >
      {children}
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10, x: "-50%" }}
            animate={{ opacity: 1, scale: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, scale: 0.9, y: 5, x: "-50%" }}
            style={{
              position: "absolute",
              bottom: "125%",
              left: "50%",
              background: T.card,
              color: T.text,
              padding: "5px 10px",
              borderRadius: "8px",
              fontSize: "10px",
              fontWeight: "700",
              whiteSpace: "nowrap",
              zIndex: 100,
              pointerEvents: "none",
              boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
              border: `1.5px solid ${T.cardBorder}`,
              backdropFilter: "blur(8px)",
              textTransform: "uppercase",
              letterSpacing: "0.05em"
            }}
          >
            {text}
            <div style={{
              position: "absolute",
              top: "100%",
              left: "50%",
              transform: "translateX(-50%)",
              borderLeft: "6px solid transparent",
              borderRight: "6px solid transparent",
              borderTop: `6px solid ${T.cardBorder}`
            }} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const BASE_RECIPES = [
  { id: 1, name: "Dragon Ramen", cuisine: "Japanese", emoji: "🍜", color: "#ff6b35", time: 45, timeUnit: "min", ingredients: [{ name: "Noodles", amount: 200, unit: "g" }, { name: "Broth", amount: 800, unit: "ml" }, { name: "Eggs", amount: 2, unit: "pcs" }, { name: "Soy Sauce", amount: 3, unit: "tbsp" }, { name: "Chili Oil", amount: 1, unit: "tsp" }], instructions: "### Prep\n- Boil water for noodles.\n- Simmer broth for 20 mins.\n\n### Assembly\n1. Place noodles in bowl.\n2. Pour **hot** broth over.\n3. Add toppings.\n\n> Best served piping hot!" },
  { id: 2, name: "Truffle Risotto", cuisine: "Italian", emoji: "🍚", color: "#a855f7", time: 35, timeUnit: "min", ingredients: [{ name: "Arborio Rice", amount: 300, unit: "g" }, { name: "Parmesan", amount: 80, unit: "g" }, { name: "Truffle Oil", amount: 2, unit: "tbsp" }, { name: "White Wine", amount: 150, unit: "ml" }, { name: "Butter", amount: 50, unit: "g" }], instructions: "### Steps\n1. Toast rice in butter.\n2. Deglaze with white wine.\n3. Add warm stock slowly.\n4. Finish with *parmesan* and truffle oil." },
  { id: 3, name: "Smash Burger", cuisine: "American", emoji: "🍔", color: "#f59e0b", time: 20, timeUnit: "min", ingredients: [{ name: "Ground Beef", amount: 200, unit: "g" }, { name: "Cheddar", amount: 40, unit: "g" }, { name: "Brioche Bun", amount: 1, unit: "pcs" }, { name: "Pickles", amount: 4, unit: "pcs" }, { name: "Special Sauce", amount: 2, unit: "tbsp" }], instructions: "### Method\n- Roll beef into balls.\n- **Smash** thin on a high-heat griddle.\n- Flip and add cheese.\n- Toast buns and assemble." },
  { id: 4, name: "Pad Thai", cuisine: "Thai", emoji: "🥘", color: "#10b981", time: 30, timeUnit: "min", ingredients: [{ name: "Rice Noodles", amount: 250, unit: "g" }, { name: "Shrimp", amount: 150, unit: "g" }, { name: "Fish Sauce", amount: 3, unit: "tbsp" }, { name: "Lime", amount: 1, unit: "pcs" }, { name: "Peanuts", amount: 30, unit: "g" }], instructions: "### Preparation\n1. Soak noodles until soft.\n2. Stir-fry shrimp and aromatics.\n3. Add noodles and sauce.\n4. Toss with lime and crushed peanuts." },
  { id: 5, name: "Taco al Pastor", cuisine: "Mexican", emoji: "🌮", color: "#ef4444", time: 25, timeUnit: "min", ingredients: [{ name: "Pork", amount: 300, unit: "g" }, { name: "Corn Tortilla", amount: 3, unit: "pcs" }, { name: "Pineapple", amount: 100, unit: "g" }, { name: "Onion", amount: 0.5, unit: "pcs" }, { name: "Cilantro", amount: 10, unit: "g" }], instructions: "### Instructions\n- Slice marinated pork thinly.\n- Sear on high heat with pineapple.\n- Serve in warm corn tortillas.\n- Top with onion and cilantro." },
];

const CATS = ["All", "Japanese", "Italian", "American", "Thai", "Mexican", "Custom"];
const SCALERS = [{ label: "1×", val: 1 }, { label: "½", val: 0.5 }, { label: "⅓", val: 1 / 3 }, { label: "¼", val: 0.25 }, { label: "2×", val: 2 }, { label: "3×", val: 3 }];

function fmt(n: number, s: number) { const v = n * s; return Number.isInteger(v) ? v : parseFloat(v.toFixed(1)); }

const useLongPress = (callback: () => void, ms = 600) => {
  const timer = useRef<any>(null);
  const start = useCallback(() => {
    timer.current = setTimeout(callback, ms);
  }, [callback, ms]);
  const stop = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
  }, []);
  return {
    onMouseDown: start,
    onMouseUp: stop,
    onMouseLeave: stop,
    onTouchStart: start,
    onTouchEnd: stop,
  };
};

const RecipeCard = memo(({ recipe, T, onOpen, onLongPress }: { recipe: any, T: Theme, onOpen: (r: any) => void, onLongPress: (r: any) => void }) => {
  const ref = useRef<HTMLDivElement>(null);
  
  const lp = useLongPress(() => onLongPress(recipe));

  const mm = useCallback((e: React.MouseEvent) => {
    const el = ref.current; if (!el) return;
    const r = el.getBoundingClientRect();
    const rx = ((e.clientY - r.top) / r.height - 0.5) * -9;
    const ry = ((e.clientX - r.left) / r.width - 0.5) * 9;
    el.style.transform = `perspective(700px) rotateX(${rx}deg) rotateY(${ry}deg) translateZ(8px)`;
  }, []);
  const ml = useCallback(() => { if (ref.current) ref.current.style.transform = "perspective(700px) rotateX(0) rotateY(0) translateZ(0)"; }, []);

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
      whileTap={{ scale: 0.96 }}
      ref={ref} 
      onMouseMove={mm} 
      onMouseLeave={ml} 
      onClick={() => onOpen(recipe)} 
      {...lp}
      style={{
        borderRadius: 20, padding: 2, cursor: "pointer", position: "relative", overflow: "hidden",
        transition: "transform 0.1s ease-out, box-shadow 0.15s ease", willChange: "transform",
        background: T.card,
        boxShadow: T.cardShadow,
        userSelect: "none", WebkitUserSelect: "none", WebkitTouchCallout: "none"
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Animated Rotating Border */}
      <div style={{
        position: "absolute",
        top: "-50%",
        left: "-50%",
        width: "200%",
        height: "200%",
        background: `conic-gradient(from 0deg, transparent, ${recipe.color}, transparent 25%)`,
        animation: "border-spin 3s linear infinite",
        zIndex: 0
      }} />

      {/* Inner Mask/Content */}
      <div style={{
        position: "relative", zIndex: 1,
        background: T.bg,
        borderRadius: 19, padding: "14px 13px",
        height: "100%",
        border: `none`,
        backdropFilter: "blur(18px) saturate(160%)", WebkitBackdropFilter: "blur(18px) saturate(160%)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <motion.div 
            whileHover={{ rotate: [0, -10, 10, 0], transition: { duration: 0.4 } }}
            style={{
              width: 42, height: 42, borderRadius: 13, display: "flex", alignItems: "center",
              justifyContent: "center", fontSize: 22, flexShrink: 0,
              background: `linear-gradient(135deg,${recipe.color}30,${recipe.color}10)`,
              border: `1.5px solid ${recipe.color}45`, boxShadow: `0 4px 12px ${recipe.color}25`
            }}
          >
            {recipe.emoji}
          </motion.div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: 15,
              color: T.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"
            }}>
              {recipe.name}
            </div>
            <div style={{
              fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase",
              color: T.subtext, marginTop: 1
            }}>{recipe.cuisine} · {recipe.time}{recipe.timeUnit}</div>
          </div>
        </div>
        <div style={{ height: 1 }} />
      </div>
    </motion.div>
  );
});

const CookingTimer = memo(({ initialMinutes, T, onBack }: { initialMinutes: number, T: Theme, onBack: () => void }) => {
  const [seconds, setSeconds] = useState(initialMinutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isAlarmPlaying, setIsAlarmPlaying] = useState(false);
  const [editMins, setEditMins] = useState<string | null>(null);
  const [editSecs, setEditSecs] = useState<string | null>(null);
  const timerRef = useRef<any>(null);
  
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscRef = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const beepIntervalRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (beepIntervalRef.current) clearInterval(beepIntervalRef.current);
      if (oscRef.current) {
        try {
          oscRef.current.stop();
          oscRef.current.disconnect();
        } catch(e) {}
      }
      if (audioCtxRef.current) audioCtxRef.current.close();
    };
  }, []);

  useEffect(() => {
    if (isRunning && seconds > 0) {
      timerRef.current = setInterval(() => {
        setSeconds(s => {
          if (s <= 1) {
            setIsAlarmPlaying(true);
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
      if (seconds === 0) setIsRunning(false);
    }
    return () => clearInterval(timerRef.current);
  }, [isRunning, seconds]);

  useEffect(() => {
    if (isAlarmPlaying) {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      if (!oscRef.current) {
        oscRef.current = ctx.createOscillator();
        gainRef.current = ctx.createGain();
        oscRef.current.type = 'sine';
        oscRef.current.frequency.value = 880;
        oscRef.current.connect(gainRef.current);
        gainRef.current.connect(ctx.destination);
        gainRef.current.gain.value = 0;
        oscRef.current.start();
      }

      let toggleBeep = false;
      beepIntervalRef.current = setInterval(() => {
        if (gainRef.current && ctx) {
          gainRef.current.gain.setValueAtTime(toggleBeep ? 0 : 1, ctx.currentTime);
          toggleBeep = !toggleBeep;
        }
      }, 500);

    } else {
      if (beepIntervalRef.current) {
        clearInterval(beepIntervalRef.current);
        beepIntervalRef.current = null;
      }
      if (gainRef.current && audioCtxRef.current) {
        gainRef.current.gain.setValueAtTime(0, audioCtxRef.current.currentTime);
      }
    }
  }, [isAlarmPlaying]);

  const toggle = () => {
    if (isAlarmPlaying) setIsAlarmPlaying(false);
    setIsRunning(!isRunning);
    setEditMins(null);
    setEditSecs(null);
  };

  const reset = () => {
    setIsAlarmPlaying(false);
    setIsRunning(false);
    setSeconds(initialMinutes * 60);
    setEditMins(null);
    setEditSecs(null);
  };

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  const handleMinsChange = (val: string) => {
    const m = parseInt(val) || 0;
    setSeconds(m * 60 + (seconds % 60));
  };

  const handleSecsChange = (val: string) => {
    const s = Math.min(59, parseInt(val) || 0);
    setSeconds(Math.floor(seconds / 60) * 60 + s);
  };

  return createPortal(
    <motion.div
      drag
      dragMomentum={false}
      dragElastic={0.05}
      initial={{ y: 20, opacity: 0 }}
      animate={{ 
        y: 0, 
        opacity: 1,
        scale: isAlarmPlaying ? [1, 1.02, 1] : 1
      }}
      transition={{
        scale: isAlarmPlaying ? { repeat: Infinity, duration: 0.5 } : { duration: 0.2 }
      }}
      exit={{ y: 80, opacity: 0 }}
      style={{
        position: "fixed", bottom: 100, left: 16, zIndex: 9999,
        width: "calc(100% - 32px)", maxWidth: 360,
        padding: "10px 16px", borderRadius: 20,
        background: isAlarmPlaying ? `linear-gradient(135deg, ${T.card}, #2d1a1a)` : `linear-gradient(135deg, ${T.card}, ${T.bg}dd)`,
        border: `1.5px solid ${isAlarmPlaying ? "#ef444455" : T.cardBorder}`,
        backdropFilter: "blur(24px)",
        boxShadow: isAlarmPlaying 
          ? "0 0 30px rgba(239, 68, 68, 0.4), 0 12px 40px rgba(0,0,0,0.6)" 
          : "0 12px 40px rgba(0,0,0,0.5), 0 0 20px rgba(99,102,241,0.15)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        gap: 12,
        touchAction: "none",
        cursor: "grab",
        transition: "background 0.3s, border 0.3s, box-shadow 0.3s"
      }}
      whileDrag={{ scale: 1.05, cursor: "grabbing", boxShadow: "0 20px 50px rgba(0,0,0,0.7)" }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <button onClick={onBack} style={{
          width: 32, height: 32, borderRadius: 10, border: "none",
          background: T.stat, color: T.text, cursor: "pointer", fontSize: 14,
          display: "flex", alignItems: "center", justifyContent: "center"
        }}>✕</button>
        <div style={{ width: 1, height: 24, background: T.cardBorder }} />
        
        <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
          {editMins !== null ? (
            <input 
              type="number"
              autoFocus
              value={editMins}
              onChange={(e) => {
                setEditMins(e.target.value);
                handleMinsChange(e.target.value);
              }}
              onBlur={() => setEditMins(null)}
              onKeyDown={(e) => e.key === 'Enter' && setEditMins(null)}
              style={{ width: 35, background: T.stat, border: "none", color: T.accent, fontSize: 18, fontWeight: 800, textAlign: "center", outline: "none", borderRadius: 6 }}
            />
          ) : (
            <div 
              onClick={() => { setIsRunning(false); setEditMins(mins.toString()); }}
              style={{ fontSize: 22, fontWeight: 900, color: isAlarmPlaying ? "#ef4444" : T.text, cursor: "text", fontFamily: "monospace", padding: "0 4px" }}
            >
              {mins.toString().padStart(2, "0")}
            </div>
          )}

          <span style={{ color: isAlarmPlaying ? "#ef4444" : T.accent, fontWeight: 900, fontSize: 18, opacity: isAlarmPlaying ? 1 : 0.5 }}>:</span>

          {editSecs !== null ? (
            <input 
              type="number"
              autoFocus
              value={editSecs}
              onChange={(e) => {
                setEditSecs(e.target.value);
                handleSecsChange(e.target.value);
              }}
              onBlur={() => setEditSecs(null)}
              onKeyDown={(e) => e.key === 'Enter' && setEditSecs(null)}
              style={{ width: 35, background: T.stat, border: "none", color: T.accent, fontSize: 18, fontWeight: 800, textAlign: "center", outline: "none", borderRadius: 6 }}
            />
          ) : (
            <div 
              onClick={() => { setIsRunning(false); setEditSecs(secs.toString()); }}
              style={{ fontSize: 22, fontWeight: 900, color: isAlarmPlaying ? "#ef4444" : T.text, cursor: "text", fontFamily: "monospace", padding: "0 4px" }}
            >
              {secs.toString().padStart(2, "0")}
            </div>
          )}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <button onClick={reset} style={{
          width: 36, height: 36, borderRadius: 12, border: "none",
          background: T.stat, color: T.label, fontSize: 14, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center"
        }}>↺</button>
        
        <button onClick={toggle} style={{
          padding: "0 18px", height: 40, borderRadius: 14, border: "none",
          background: T.accent, color: "#fff", fontWeight: 700, fontSize: 13,
          cursor: "pointer", boxShadow: `0 4px 16px ${T.accent}55`,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8
        }}>
          {isRunning ? <><span style={{ fontSize: 10 }}>⏸</span> PAUSE</> : <><span style={{ fontSize: 10 }}>▶</span> START</>}
        </button>
      </div>
    </motion.div>,
    document.body
  );
});

const DetailPanel = memo(({ recipe, show, onClose, T, onStartTimer }: { recipe: any, show: boolean, onClose: () => void, T: Theme, onStartTimer: (mins: number) => void }) => {
  const [scale, setScale] = useState(1);

  const handleShare = async () => {
    if (!recipe) return;
    const text = `${recipe.emoji} ${recipe.name}\n\nIngredients:\n${recipe.ingredients.map((ing: any) => `- ${ing.name}: ${ing.amount} ${ing.unit}`).join("\n")}\n\nInstructions:\n${recipe.instructions}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: recipe.name,
          text: text,
          url: window.location.href,
        });
      } catch (err) {
        console.log("Error sharing:", err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(text);
        alert("Recipe copied to clipboard!");
      } catch (err) {
        console.log("Clipboard error:", err);
      }
    }
  };

  return (
    <>
      <div onClick={onClose} style={{
        position: "fixed", inset: 0, zIndex: 50, background: "rgba(0,0,0,0.5)",
        opacity: show ? 1 : 0, pointerEvents: show ? "auto" : "none", transition: "opacity 0.18s ease",
        backdropFilter: show ? "blur(4px)" : "none"
      }} />
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 51, maxHeight: "88vh", overflowY: "auto",
        borderRadius: "24px 24px 0 0", padding: "22px 14px 38px",
        transform: show ? "translateY(0)" : "translateY(100%)",
        transition: "transform 0.22s cubic-bezier(0.32,0.72,0,1)", willChange: "transform",
        background: T.headerBg, border: `1.5px solid ${T.cardBorder}`,
        boxShadow: "0 -20px 60px rgba(0,0,0,0.5)", backdropFilter: "blur(24px)"
      }}>
        <div style={{ width: 34, height: 4, borderRadius: 2, margin: "0 auto 18px", background: T.label }} />
        {recipe && <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <div style={{
              width: 58, height: 58, borderRadius: 16, display: "flex", alignItems: "center",
              justifyContent: "center", fontSize: 28,
              background: `linear-gradient(135deg,${recipe.color}35,${recipe.color}10)`,
              border: `2px solid ${recipe.color}50`, boxShadow: `0 8px 24px ${recipe.color}35`
            }}>
              {recipe.emoji}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 800, fontSize: 20, color: T.text }}>
                {recipe.name}
              </div>
              <div style={{
                fontSize: 11, color: T.subtext, fontWeight: 600, letterSpacing: "0.05em",
                textTransform: "uppercase", marginTop: 2
              }}> {recipe.cuisine}</div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <Tooltip text="Share recipe" T={T}>
                <button 
                  onClick={handleShare}
                  style={{ 
                    width: 38, height: 38, borderRadius: 10, border: `1px solid ${T.cardBorder}`,
                    background: T.stat, color: T.text, cursor: "pointer", display: "flex",
                    alignItems: "center", justifyContent: "center", fontSize: 16
                  }}>📤</button>
              </Tooltip>
            </div>
          </div>

          {/* Scaler */}
          <div style={{ marginBottom: 16 }}>
            <div style={{
              fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
              color: T.label, marginBottom: 8
            }}>⚖️ Serving Scaler</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {SCALERS.map(s => (
                <button key={s.val} onClick={() => setScale(s.val)} style={{
                  padding: "7px 13px", borderRadius: 10, cursor: "pointer",
                  fontSize: 13, fontWeight: 700, transition: "all 0.12s ease",
                  color: scale === s.val ? "#fff" : T.subtext,
                  background: scale === s.val ? `linear-gradient(135deg,${T.accent},${T.accent}bb)` : T.stat,
                  border: scale === s.val ? `1px solid ${T.accent}80` : `1px solid ${T.statBorder}`,
                  boxShadow: scale === s.val ? `0 4px 14px ${T.accent}40,inset 0 1px 0 rgba(255,255,255,0.2)` : "none",
                }}>{s.label}</button>
              ))}
            </div>
          </div>

          {/* Ingredients */}
          <div style={{
            fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
            color: T.label, marginBottom: 9
          }}>🧂 Ingredients</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 18 }}>
            {recipe.ingredients.map((ing: any, i: number) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "10px 12px", borderRadius: 11,
                background: T.stat, border: `1.5px solid ${T.statBorder}`,
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)"
              }}>
                <span style={{ fontSize: 13, color: T.text, fontWeight: 500 }}>{ing.name}</span>
                <span style={{
                  fontSize: 13, fontWeight: 700, color: T.accent,
                  background: `${T.accent}18`, padding: "2px 10px", borderRadius: 8,
                  border: `1.5px solid ${T.accent}30`
                }}>
                  {fmt(ing.amount, scale)}{ing.unit === "pcs" ? "" : " "}{ing.unit}
                </span>
              </div>
            ))}
          </div>

          {/* Instructions */}
          {recipe.instructions && (
            <div style={{ marginBottom: 24 }}>
              <div style={{
                fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
                color: T.label, marginBottom: 12
              }}>📖 Instructions</div>
              <div style={{ 
                fontSize: 14, 
                color: T.text, 
                lineHeight: "1.6",
                padding: "16px",
                borderRadius: "16px",
                background: T.stat,
                border: `1px solid ${T.statBorder}`,
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)"
              }}>
                <ReactMarkdown components={{
                  h1: ({node, ...props}) => <h1 style={{ fontSize: "1.5rem", fontWeight: "800", marginBottom: "1rem" }} {...props} />,
                  h2: ({node, ...props}) => <h2 style={{ fontSize: "1.25rem", fontWeight: "700", marginBottom: "0.75rem" }} {...props} />,
                  h3: ({node, ...props}) => <h3 style={{ fontSize: "1.1rem", fontWeight: "700", marginBottom: "0.5rem" }} {...props} />,
                  p: ({node, ...props}) => <p style={{ marginBottom: "0.75rem" }} {...props} />,
                  ul: ({node, ...props}) => <ul style={{ paddingLeft: "1.5rem", marginBottom: "0.75rem", listStyleType: "disc" }} {...props} />,
                  ol: ({node, ...props}) => <ol style={{ paddingLeft: "1.5rem", marginBottom: "0.75rem", listStyleType: "decimal" }} {...props} />,
                  li: ({node, ...props}) => <li style={{ marginBottom: "0.25rem" }} {...props} />,
                  blockquote: ({node, ...props}) => <blockquote style={{ borderLeft: `4px solid ${T.accent}`, paddingLeft: "1rem", fontStyle: "italic", margin: "1rem 0" }} {...props} />,
                }}>
                  {recipe.instructions}
                </ReactMarkdown>
              </div>
            </div>
          )}

          <button onClick={() => onStartTimer(recipe.time || 10)} style={{
            width: "100%", padding: "15px", borderRadius: 14, border: "none",
            cursor: "pointer", fontFamily: "'Playfair Display',serif", fontSize: 16, fontWeight: 700,
            color: "#fff", background: `linear-gradient(135deg,${T.accent},${T.accent}bb)`,
            boxShadow: `0 8px 24px ${T.accent}45,inset 0 1px 0 rgba(255,255,255,0.25)`
          }}>
            Start Cooking →
          </button>
        </div>}
      </div>
    </>
  );
});

const HandwritingTitle = memo(({ text, color }: { text: string, color: string }) => {
  const chars = text.split("");
  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <style>
        {`
          @keyframes title-fade-cycle {
            0%, 75% { opacity: 1; }
            85%, 100% { opacity: 0; }
          }
          @keyframes title-fill-fade {
            0%, 50% { opacity: 0; }
            65%, 100% { opacity: 1; }
          }
        `}
        {chars.map((_, i) => `
          @keyframes char-trace-${i} {
            0%, ${i * 4}% { stroke-dashoffset: 200; }
            ${(i * 4) + 15}%, 100% { stroke-dashoffset: 0; }
          }
          .char-anim-${i} {
            stroke-dasharray: 200;
            stroke-dashoffset: 200;
            animation: char-trace-${i} 8s cubic-bezier(0.4, 0, 0.2, 1) infinite;
          }
        `).join("")}
      </style>

      <div style={{ animation: "title-fade-cycle 8s infinite", height: 32, display: "flex", alignItems: "center" }}>
        <svg 
          viewBox="0 0 160 36" 
          style={{ width: "160px", height: "36px", overflow: "visible" }}
        >
          {/* Stroke Layer */}
          <text 
            x="0" y="28" 
            fontFamily="'Dancing Script', cursive" 
            fontSize="28px" 
            fontWeight="700"
            fill="transparent"
            stroke={color}
            strokeWidth="1"
            style={{ filter: `drop-shadow(0 0 4px ${color})` }}
          >
            {chars.map((char, i) => (
              <tspan key={i} className={`char-anim-${i}`}>{char}</tspan>
            ))}
          </text>
          
          {/* Fill Layer */}
          <text 
            x="0" y="28" 
            fontFamily="'Dancing Script', cursive" 
            fontSize="28px" 
            fontWeight="700"
            fill={color}
            style={{ 
              animation: "title-fill-fade 8s infinite",
              filter: `drop-shadow(0 0 6px ${color}) drop-shadow(0 0 12px ${color})`
            }}
          >
            {text}
          </text>
        </svg>
      </div>
    </div>
  );
});

const getInitialTheme = () => {
  const saved = localStorage.getItem("zins-kitchen-theme");
  return saved || "dark";
};

const getInitialRecipes = () => {
  const saved = localStorage.getItem("zins-kitchen-recipes");
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch(e) {}
  }
  return BASE_RECIPES;
};

const getInitialRecent = () => {
  const saved = localStorage.getItem("zins-kitchen-recent");
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch(e) {}
  }
  return [];
};

export default function KitchenApp() {
  const [themeId, setThemeId] = useState(getInitialTheme);
  const [cat, setCat] = useState("All");
  const [recipes, setRecipes] = useState<any[]>(getInitialRecipes);
  const [recentlyOpened, setRecentlyOpened] = useState<any[]>(getInitialRecent);

  useEffect(() => {
    localStorage.setItem("zins-kitchen-theme", themeId);
  }, [themeId]);

  useEffect(() => {
    localStorage.setItem("zins-kitchen-recipes", JSON.stringify(recipes));
  }, [recipes]);

  useEffect(() => {
    localStorage.setItem("zins-kitchen-recent", JSON.stringify(recentlyOpened));
  }, [recentlyOpened]);

  const [selected, setSelected] = useState<any>(null);
  const [actionRecipe, setActionRecipe] = useState<any>(null);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTimerMinutes, setActiveTimerMinutes] = useState<number | null>(null);
  
  // New Recipe State
  const [newName, setNewName] = useState("");
  const [newEmoji, setNewEmoji] = useState("🍽️");
  const [newColor, setNewColor] = useState("#6366f1");
  const [newIngredients, setNewIngredients] = useState([{ name: "", amount: "", unit: "g" }]);
  const [newInstructions, setNewInstructions] = useState("");
  const [newImage, setNewImage] = useState<string | null>(null);

  const UNITS = ["g", "kg", "ml", "l", "tbsp", "tsp", "cups", "pcs", "pinch", "piece", "slice", "bunch"];
  const PRESET_COLORS = ["#6366f1", "#ec4899", "#14b8a6", "#f97316", "#8b5cf6", "#ef4444", "#3b82f6", "#22c55e"];

  const lastBackPress = useRef<number>(0);

  const T = useMemo(() => THEMES.find(t => t.id === themeId) || THEMES[0], [themeId]);

  // ANDROID HARDWARE BACK BUTTON LOGIC
  useEffect(() => {
    // Push an initial state so we have something to "go back" from
    window.history.pushState({ page: "home" }, "");

    const handlePopState = (event: PopStateEvent) => {
      const now = Date.now();
      
      if (showCreate || showDetail || showActionMenu) {
        // If an overlay is open, just close it and stay on Home
        setShowCreate(false);
        setShowDetail(false);
        setShowActionMenu(false);
        window.history.pushState({ page: "home" }, "");
        return;
      }

      if (now - lastBackPress.current < 2000) {
        // Double tap confirmed - Exit app (simulated for web/PWA)
        if (confirm("Do you want to exit the app?")) {
          window.close();
        }
      } else {
        // Single tap - Always navigate to Home
        lastBackPress.current = now;
        window.history.pushState({ page: "home" }, "");
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [showCreate, showDetail, showActionMenu]);

  const filtered = cat === "All" ? recipes : recipes.filter(r => r.cuisine === cat);

  const openRecipe = useCallback((r: any) => { 
    setSelected(r); 
    setShowDetail(true);
    setRecentlyOpened(prev => {
      const exists = prev.find(p => p.id === r.id);
      if (exists) {
        return [r, ...prev.filter(p => p.id !== r.id)];
      }
      return [r, ...prev].slice(0, 10);
    });
  }, []);
  const closeDetail = useCallback(() => setShowDetail(false), []);

  const openActionMenu = useCallback((r: any) => {
    setActionRecipe(r);
    setShowActionMenu(true);
  }, []);

  const deleteRecipe = useCallback(() => {
    if (!actionRecipe) return;
    setRecipes(p => p.filter(r => r.id !== actionRecipe.id));
    setRecentlyOpened(p => p.filter(r => r.id !== actionRecipe.id));
    setShowActionMenu(false);
  }, [actionRecipe]);

  const startEdit = useCallback(() => {
    if (!actionRecipe) return;
    setNewName(actionRecipe.name);
    setNewEmoji(actionRecipe.emoji);
    setNewColor(actionRecipe.color || "#6366f1");
    setNewIngredients(actionRecipe.ingredients.map((i: any) => ({ 
      name: i.name, 
      amount: i.amount.toString(), 
      unit: i.unit 
    })));
    setNewInstructions(actionRecipe.instructions || "");
    setNewImage(actionRecipe.imageUrl || null);
    setIsEditing(true);
    setShowCreate(true);
    setShowActionMenu(false);
  }, [actionRecipe]);

  const saveRecipe = useCallback(() => {
    if (!newName.trim()) return;
    
    const ingredients = newIngredients
      .filter(i => i.name.trim())
      .map(i => ({ name: i.name, amount: parseFloat(i.amount) || 0, unit: i.unit }));

    if (isEditing && actionRecipe) {
      setRecipes(p => p.map(r => r.id === actionRecipe.id ? {
        ...r,
        name: newName.trim(),
        emoji: newEmoji,
        color: newColor,
        ingredients,
        imageUrl: newImage,
        instructions: newInstructions
      } : r));
      setRecentlyOpened(p => p.map(r => r.id === actionRecipe.id ? {
        ...r,
        name: newName.trim(),
        emoji: newEmoji,
        color: newColor,
        ingredients,
        imageUrl: newImage,
        instructions: newInstructions
      } : r));
    } else {
      setRecipes(p => [{
        id: Date.now(), name: newName.trim(), cuisine: "Custom",
        emoji: newEmoji,
        color: newColor,
        time: 30, timeUnit: "min",
        ingredients,
        imageUrl: newImage,
        instructions: newInstructions
      }, ...p]);
    }

    setNewName(""); 
    setNewEmoji("🍽️");
    setNewColor("#6366f1");
    setNewIngredients([{ name: "", amount: "", unit: "g" }]); 
    setNewInstructions(""); 
    setNewImage(null); 
    setShowCreate(false);
    setIsEditing(false);
    setActionRecipe(null);
  }, [newName, newEmoji, newColor, newIngredients, newImage, newInstructions, isEditing, actionRecipe]);

  const startCreate = useCallback(() => {
    setNewName("");
    setNewEmoji("🍽️");
    setNewColor("#6366f1");
    setNewIngredients([{ name: "", amount: "", unit: "g" }]);
    setNewInstructions("");
    setNewImage(null);
    setIsEditing(false);
    setShowCreate(true);
  }, []);

  // Auto-update emoji when name changes (if creating or editing)
  useEffect(() => {
    if (newName.trim()) {
      setNewEmoji(getIconForRecipe(newName.trim()));
    }
  }, [newName]);

  return (
    <div style={{
      minHeight: "100vh", background: T.bg, fontFamily: "'DM Sans','Segoe UI',sans-serif",
      overflowX: "hidden", WebkitOverflowScrolling: "touch", color: T.text
    }}>
      <style>{`
        @keyframes border-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      {/* HEADER */}
      <div style={{
        position: "sticky", top: 0, zIndex: 40, padding: "14px 14px 12px",
        background: T.headerBg, borderBottom: `1px solid ${T.headerBorder}`,
        backdropFilter: "blur(24px)", boxShadow: "0 4px 20px rgba(0,0,0,0.25)"
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <HandwritingTitle text="Zin's Kitchen" color={T.accent} />
            <div style={{
              fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
              color: T.subtext, marginTop: 0
            }}>{recipes.length} Masterpieces</div>
          </div>
          <button onClick={() => setThemeId(t => t === 'dark' ? 'light' : 'dark')} style={{
            background: "transparent", border: "none", cursor: "pointer", display: "flex",
            alignItems: "center", justifyContent: "center", fontSize: 24, padding: 8,
            outline: "none", WebkitTapHighlightColor: "transparent"
          }}>
            {T.icon}
          </button>
        </div>
      </div>

      {/* RECENTLY OPENED CARD COMPONENT TO SHARE LONG PRESS */}
      {/* (Internal helper for horizontal cards) */}
      {(() => {
        return (
          <div style={{ padding: "20px 14px", paddingBottom: 100 }}>
            {/* RECENTLY OPENED SECTION */}
            {recentlyOpened.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <h3 style={{ fontSize: 18, fontWeight: 700, fontFamily: "'DM Sans', sans-serif", color: T.text }}>Recently Opened</h3>
                </div>
                <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 10, scrollbarWidth: "none" }}>
                  <AnimatePresence mode="popLayout">
                    {recentlyOpened.map(r => (
                      <div key={r.id} style={{ width: "calc(50vw - 20px)", flexShrink: 0 }}>
                        <RecipeCard recipe={r} T={T} onOpen={openRecipe} onLongPress={openActionMenu} />
                      </div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}

            {/* RECENT ADDITIONS GRID */}
            <h3 style={{ fontSize: 18, fontWeight: 700, fontFamily: "'DM Sans', sans-serif", color: T.text, marginBottom: 14 }}>New Additions</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <AnimatePresence mode="popLayout">
                {filtered.map(r => (
                  <RecipeCard key={r.id} recipe={r} T={T} onOpen={openRecipe} onLongPress={openActionMenu} />
                ))}
              </AnimatePresence>
            </div>
          </div>
        );
      })()}

      {/* FAB */}
      <button onClick={startCreate} style={{ position: "fixed", bottom: 24, right: 20, width: 56, height: 56, borderRadius: "50%", border: "none", cursor: "pointer", fontSize: 24, display: "flex", alignItems: "center", justifyContent: "center", background: `linear-gradient(135deg,${T.accent},${T.accent}cc)`, boxShadow: `0 8px 24px ${T.accent}45,inset 0 1px 0 rgba(255,255,255,0.3)`, zIndex: 35 }}>
        ➕
      </button>

      {/* ACTION MENU (LONG PRESS) */}
      <AnimatePresence>
        {showActionMenu && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowActionMenu(false)}
              style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 70, backdropFilter: "blur(4px)" }}
            />
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              style={{
                position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 71,
                background: T.headerBg, borderTop: `1.5px solid ${T.cardBorder}`,
                borderRadius: "24px 24px 0 0", padding: "16px 20px 40px",
                boxShadow: "0 -10px 40px rgba(0,0,0,0.4)"
              }}
            >
              <div style={{ width: 36, height: 4, background: T.pillBorder, borderRadius: 2, margin: "0 auto 20px" }} />
              <div style={{ marginBottom: 20, textAlign: "center" }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: T.label, textTransform: "uppercase", letterSpacing: "0.05em" }}>Manage recipe</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: T.text, marginTop: 4 }}>{actionRecipe?.name}</div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <button onClick={startEdit} style={{
                  width: "100%", padding: "16px", borderRadius: 16, border: "none", background: T.pill,
                  color: T.text, fontWeight: 700, fontSize: 16, display: "flex", alignItems: "center", gap: 12, cursor: "pointer"
                }}>
                  <span>✏️</span> Edit Recipe
                </button>
                <button onClick={deleteRecipe} style={{
                  width: "100%", padding: "16px", borderRadius: 16, border: "none", background: "rgba(239, 68, 68, 0.15)",
                  color: "#ef4444", fontWeight: 700, fontSize: 16, display: "flex", alignItems: "center", gap: 12, cursor: "pointer"
                }}>
                  <span>🗑️</span> Delete Recipe
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* DETAILED MODALS */}
      <DetailPanel recipe={selected} show={showDetail} onClose={closeDetail} T={T} onStartTimer={(mins) => setActiveTimerMinutes(mins)} />

      {/* ENHANCED CREATE RECIPE FULLSCREEN MODAL */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 60, display: "flex", flexDirection: "column",
        background: T.bg, transition: "transform 0.3s ease",
        transform: showCreate ? "translateY(0)" : "translateY(100%)",
        paddingTop: "env(safe-area-inset-top)"
      }}>
        <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
          {/* Main Attributes Row: Photo, Icon, Name */}
          <div style={{ display: "flex", gap: 12, marginBottom: 24, alignItems: "flex-end" }}>
            {/* Minimal Photo Box */}
            <div style={{ width: 62 }}>
              <label style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", color: T.label, display: "block", marginBottom: 8, letterSpacing: "0.05em" }}>Photo</label>
              <Tooltip text="ADD PHOTO" T={T}>
                <label 
                  style={{ 
                    width: 62, height: 62, borderRadius: 16, border: `1.5px dashed ${T.cardBorder}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: T.stat, cursor: "pointer", transition: "all 0.2s", overflow: "hidden", position: "relative"
                  }}
                >
                  <input 
                    type="file" 
                    accept="image/*" 
                    style={{ display: "none" }} 
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => setNewImage(reader.result as string);
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                  {newImage ? (
                    <img src={newImage} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <div style={{ fontSize: 22 }}>📷</div>
                  )}
                </label>
              </Tooltip>
            </div>

            {/* Icon Box */}
            <div style={{ width: 62 }}>
              <label style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", color: T.label, display: "block", marginBottom: 8, letterSpacing: "0.05em" }}>Icon</label>
              <input 
                value={newEmoji} 
                onChange={e => setNewEmoji(e.target.value)} 
                style={{ 
                  width: 62, height: 62, borderRadius: 16, border: `1px solid ${T.cardBorder}`, 
                  background: T.stat, color: T.text, outline: "none", textAlign: "center", fontSize: 24, padding: 0
                }}
              />
            </div>

            {/* Recipe Name Input */}
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", color: T.label, display: "block", marginBottom: 8, letterSpacing: "0.05em" }}>Recipe Name</label>
              <input 
                value={newName} 
                onChange={e => setNewName(e.target.value)} 
                placeholder="Name your masterpiece..."
                style={{ 
                  width: "100%", height: 62, padding: "0 18px", borderRadius: 16, 
                  border: `1px solid ${T.cardBorder}`, background: T.stat, color: T.text, outline: "none" 
                }}
              />
            </div>
          </div>

          {/* Structured Ingredients Input */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <label style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", color: T.label }}>Ingredients</label>
              <Tooltip text="Add new ingredient row" T={T}>
                <button 
                  onClick={() => setNewIngredients([...newIngredients, { name: "", amount: "", unit: "g" }])}
                  style={{ fontSize: 11, fontWeight: 800, color: T.accent, background: "none", border: "none", cursor: "pointer" }}
                >
                  + ADD INGREDIENT
                </button>
              </Tooltip>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {newIngredients.map((ing, idx) => (
                <div key={idx} style={{ display: "flex", gap: 6, alignItems: "center", width: "100%" }}>
                  <input 
                    value={ing.name} 
                    onChange={(e) => {
                      const copy = [...newIngredients];
                      copy[idx].name = e.target.value;
                      setNewIngredients(copy);
                    }}
                    placeholder="Name"
                    style={{ flex: 2, minWidth: 0, padding: "10px 12px", borderRadius: 12, border: `1px solid ${T.cardBorder}`, background: T.stat, color: T.text, outline: "none", fontSize: 13 }}
                  />
                  <input 
                    value={ing.amount} 
                    onChange={(e) => {
                      const copy = [...newIngredients];
                      copy[idx].amount = e.target.value;
                      setNewIngredients(copy);
                    }}
                    placeholder="Qty"
                    style={{ flex: 1, minWidth: 0, padding: "10px 12px", borderRadius: 12, border: `1px solid ${T.cardBorder}`, background: T.stat, color: T.text, outline: "none", fontSize: 13 }}
                  />
                  <select 
                    value={ing.unit} 
                    onChange={(e) => {
                      const copy = [...newIngredients];
                      copy[idx].unit = e.target.value;
                      setNewIngredients(copy);
                    }}
                    style={{ flex: 1, minWidth: 0, padding: "10px 8px", borderRadius: 12, border: `1px solid ${T.cardBorder}`, background: T.stat, color: T.text, outline: "none", fontSize: 12 }}
                  >
                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                  {newIngredients.length > 1 && (
                    <button 
                      onClick={() => setNewIngredients(newIngredients.filter((_, i) => i !== idx))}
                      style={{ padding: "8px", background: "none", border: "none", color: "#ef4444", fontSize: 16, cursor: "pointer", flexShrink: 0 }}
                    >✕</button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Instructions Input */}
          <div style={{ marginBottom: 32 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <label style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", color: T.label }}>Cooking Instructions</label>
                <button style={{ 
                  width: 18, height: 18, borderRadius: "50%", background: T.pill, border: "none",
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, cursor: "pointer", color: T.accent
                }}>ℹ️</button>
              </div>
            </div>
            
            {/* Guide Bubble Removed */}

            <textarea 
              rows={6}
              value={newInstructions} 
              onChange={e => setNewInstructions(e.target.value)} 
              placeholder="Step 1: Boil the water...&#10;Step 2: Add ingredients...&#10;Tip: Use **bold** for emphasis!"
              style={{ width: "100%", padding: 16, borderRadius: 16, border: `1px solid ${T.cardBorder}`, background: T.stat, color: T.text, outline: "none", resize: "none", fontSize: 14, fontFamily: "inherit" }}
            />
          </div>

          <button onClick={saveRecipe} style={{
            width: "100%", padding: 18, borderRadius: 18, border: "none", cursor: "pointer",
            background: `linear-gradient(135deg, ${T.accent}, ${T.accent}cc)`,
            color: "#fff", fontWeight: 800, fontSize: 16,
            boxShadow: `0 8px 32px ${T.accent}40`, marginBottom: 40
          }}>
            {isEditing ? "UPDATE RECIPE" : "SAVE RECIPE"}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {activeTimerMinutes !== null && typeof document !== "undefined" && (
          <CookingTimer 
            initialMinutes={activeTimerMinutes} 
            T={T} 
            onBack={() => setActiveTimerMinutes(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

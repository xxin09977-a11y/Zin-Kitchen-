import React, { useState, useMemo } from 'react';
import { motion, Reorder, AnimatePresence } from 'motion/react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Plus, Trash2, GripVertical, Check, X, Bold, Italic, List, ListOrdered, Quote } from 'lucide-react';
import { db, IngredientUnit, type Recipe, type Ingredient } from '../db';
import { cn } from '../lib/utils';

interface RecipeFormProps {
  recipe?: Recipe;
  onClose: () => void;
  onSave: () => void;
}

export const RecipeForm: React.FC<RecipeFormProps> = ({ recipe, onClose, onSave }) => {
  const [title, setTitle] = useState(recipe?.title || '');
  const [ingredients, setIngredients] = useState<Ingredient[]>(
    recipe?.ingredients || [{ name: '', amount: 0, unit: IngredientUnit.G }]
  );
  const [steps, setSteps] = useState<string[]>(recipe?.cookingSteps || ['']);
  const [imageUrl, setImageUrl] = useState(recipe?.imageUrl || '');
  const [unitPickerIndex, setUnitPickerIndex] = useState<number | null>(null);
  const [focusedIngredientIndex, setFocusedIngredientIndex] = useState<number | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const allRecipes = useLiveQuery(() => db.recipes.toArray(), []);
  
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!title.trim()) newErrors.title = 'Title is required';
    
    const validIngredients = ingredients.filter(i => i.name.trim() !== '' && i.amount > 0);
    if (validIngredients.length === 0) newErrors.ingredients = 'Add at least one valid ingredient';

    const validSteps = steps.filter(s => s.trim() !== '');
    if (validSteps.length === 0) newErrors.steps = 'Add at least one cooking step';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const knownIngredients = useMemo(() => {
    const set = new Set<string>();
    const common = ["Salt", "Pepper", "Olive Oil", "Garlic", "Onion", "Butter", "Water", "Sugar", "Flour", "Eggs", "Milk", "Lemon Juice", "Soy Sauce", "Chicken Breast", "Beef", "Pork", "Rice", "Pasta", "Tomato", "Cheese"];
    common.forEach(c => set.add(c.toLowerCase()));

    if (allRecipes) {
      allRecipes.forEach(r => {
        r.ingredients.forEach(i => set.add(i.name.toLowerCase()));
      });
    }
    
    return Array.from(set).map(name => name.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '));
  }, [allRecipes]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setImageUrl(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    const validIngredients = ingredients.filter(i => i.name.trim() !== '' && i.amount > 0);
    const validSteps = steps.filter(s => s.trim() !== '');

    const data: Recipe = {
      title,
      ingredients: validIngredients,
      cookingSteps: validSteps,
      imageUrl,
      createdAt: recipe?.createdAt || Date.now(),
      updatedAt: Date.now(),
    };

    if (recipe?.id) {
      data.id = recipe.id;
    }

    await db.recipes.put(data);

    onSave();
    onClose();
  };

  const addIngredient = () => {
    setIngredients([...ingredients, { name: '', amount: 0, unit: IngredientUnit.G }]);
  };

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const updateIngredient = (index: number, field: keyof Ingredient, value: any) => {
    const newIngredients = [...ingredients];
    newIngredients[index] = { ...newIngredients[index], [field]: value };
    setIngredients(newIngredients);
  };

  const addStep = () => setSteps([...steps, '']);
  const removeStep = (index: number) => setSteps(steps.filter((_, i) => i !== index));
  const updateStep = (index: number, value: string) => {
    const newSteps = [...steps];
    newSteps[index] = value;
    setSteps(newSteps);
  };
  const formatStep = (idx: number, type: 'bold' | 'italic' | 'list' | 'numbered' | 'quote') => {
    const nextSteps = [...steps];
    let val = nextSteps[idx];
    if (type === 'bold') val = `**${val}**`;
    else if (type === 'italic') val = `*${val}*`;
    else if (type === 'list') val = `- ${val}`;
    else if (type === 'numbered') val = `1. ${val}`;
    else if (type === 'quote') val = `> ${val}`;
    nextSteps[idx] = val;
    setSteps(nextSteps);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
    >
      <motion.div 
        initial={{ scale: 0.95, y: 15, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.95, y: 15, opacity: 0 }}
        transition={{ 
          type: "spring", 
          damping: 25, 
          stiffness: 500,
          mass: 0.5
        }}
        onClick={(e) => e.stopPropagation()} 
        className="glass-dark w-full max-w-md max-h-[90vh] overflow-y-auto p-4 sm:p-6 rounded-[24px] relative"
      >
        <div className="flex justify-between items-center mb-4 sticky top-0 bg-transparent backdrop-blur-xl -mx-6 px-6 py-2 z-20 border-b border-white/5">
          <div className="flex items-center gap-2">
             <button 
              onClick={onClose} 
              className="p-1.5 hover:bg-white/10 rounded-full transition-all duration-150 text-white/50 hover:text-white border border-transparent hover:border-white/10 active:scale-90"
            >
              <X size={14} />
            </button>
            <div className="space-y-0">
              <h2 className="text-base font-black tracking-tight text-white">{recipe ? 'Edit Masterpiece' : 'New Creation'}</h2>
              <p className="text-[7px] font-black uppercase tracking-[1px] text-accent">Curator Input</p>
            </div>
          </div>
          <button 
            type="submit"
            form="recipe-form"
            className="px-4 py-1.5 bg-white text-black rounded-full text-[10px] font-black uppercase tracking-[2px] hover:bg-accent hover:text-white transition-all duration-150 shadow-xl active:scale-90"
          >
            CONFIRM
          </button>
        </div>

        <form id="recipe-form" onSubmit={handleSubmit} className="space-y-8 px-2">
          <div className="space-y-4">
             <div className="flex items-center gap-2 mb-2">
               <span className="text-[10px] font-black uppercase tracking-[3px] text-white/40">Visual Identity</span>
               <div className="h-px flex-1 bg-white/5" />
             </div>
             <div className="grid grid-cols-[64px_1fr] gap-4">
              <div className="space-y-1.5">
                <label className="relative flex flex-col items-center justify-center w-full aspect-square bg-white/5 rounded-2xl border-2 border-dashed border-white/10 hover:border-accent group/img transition-all cursor-pointer overflow-hidden shadow-inner">
                  {imageUrl ? (
                    <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <Plus size={20} className="text-white/20 group-hover/img:text-accent transition-colors" />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              </div>
              <div className="space-y-1.5 flex flex-col justify-center">
                <div className={cn(
                  "glass-dark px-3 py-2.5 text-sm flex-1 flex items-center border border-white/10 rounded-2xl shadow-xl focus-within:border-accent/40 focus-within:ring-1 focus-within:ring-accent/20 transition-all",
                  errors.title && "border-red-500/50"
                )}>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value);
                      if (errors.title) setErrors(prev => ({ ...prev, title: '' }));
                    }}
                    className="w-full bg-transparent outline-none border-none p-0 focus:ring-0 font-black text-base placeholder:text-white/20 text-white tracking-tight"
                    placeholder="Enter masterpiece name..."
                    required
                  />
                </div>
                {errors.title && <p className="text-[10px] text-red-500 mt-1 px-2">{errors.title}</p>}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-white/5 pb-2">
              <div className="flex items-center gap-2">
                <span className={cn(
                  "text-[10px] font-black uppercase tracking-[3px]",
                  errors.ingredients ? "text-red-500" : "text-white/40"
                )}>Components</span>
                <div className="h-px w-8 bg-accent/30" />
              </div>
              <button 
                type="button" 
                onClick={() => {
                   addIngredient();
                   if (errors.ingredients) setErrors(prev => ({ ...prev, ingredients: '' }));
                }}
                className="text-[10px] font-black text-accent uppercase tracking-widest hover:brightness-125 transition-all bg-accent/10 px-3 py-1 rounded-full border border-accent/20 active:scale-95"
              >
                + ADD
              </button>
            </div>
            {errors.ingredients && <p className="text-[10px] text-red-500 mt-1 px-4">{errors.ingredients}</p>}
            
            <Reorder.Group axis="y" values={ingredients} onReorder={setIngredients} className="space-y-1">
              {ingredients.map((ing, idx) => (
                <Reorder.Item key={idx} value={ing} className="flex gap-2 items-center group">
                  <div className="cursor-grab active:cursor-grabbing text-white opacity-40 group-hover:opacity-100 transition-opacity shrink-0">
                    <GripVertical size={14} />
                  </div>
                  <div className="flex-1 flex gap-2 items-center border-b border-white/10 py-1.5 relative">
                    <div className="flex-1 min-w-0 relative">
                      <input
                        type="text"
                        value={ing.name}
                        onFocus={() => setFocusedIngredientIndex(idx)}
                        onBlur={() => setTimeout(() => setFocusedIngredientIndex(null), 150)}
                        onChange={(e) => updateIngredient(idx, 'name', e.target.value)}
                        className="bg-transparent outline-none w-full font-bold text-sm placeholder:text-white/20 text-white"
                        placeholder="Name..."
                      />
                      <AnimatePresence>
                        {focusedIngredientIndex === idx && ing.name.length > 0 && (
                          (() => {
                            const matches = knownIngredients
                              .filter(k => k.toLowerCase().includes(ing.name.toLowerCase()) && k.toLowerCase() !== ing.name.toLowerCase())
                              .slice(0, 5);
                            if (matches.length === 0) return null;
                            return (
                              <motion.div
                                initial={{ opacity: 0, y: -5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -5 }}
                                transition={{ duration: 0.15 }}
                                className="absolute top-full left-0 mt-2 w-full z-50 glass-dark border border-white/10 rounded-xl overflow-hidden shadow-2xl flex flex-col"
                              >
                                {matches.map(match => (
                                  <button
                                    type="button"
                                    key={match}
                                    onClick={() => {
                                      updateIngredient(idx, 'name', match);
                                      setFocusedIngredientIndex(null);
                                    }}
                                    className="w-full text-left px-4 py-2.5 text-sm font-bold text-white/80 hover:bg-white/10 hover:text-white border-b border-white/5 last:border-0 transition-colors"
                                  >
                                    {match}
                                  </button>
                                ))}
                              </motion.div>
                            );
                          })()
                        )}
                      </AnimatePresence>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 relative">
                      <input
                        type="number"
                        step="0.1"
                        value={ing.amount || ''}
                        onChange={(e) => updateIngredient(idx, 'amount', parseFloat(e.target.value))}
                        className="w-14 bg-white/10 rounded-md px-1 py-0.5 text-accent font-black text-[11px] outline-none border border-white/20 focus:border-accent/60 text-right shadow-sm"
                        placeholder="0"
                      />
                      
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setUnitPickerIndex(unitPickerIndex === idx ? null : idx);
                        }}
                        className="min-w-[20px] text-sm font-black text-white/70 hover:text-accent uppercase transition-colors"
                      >
                        {ing.unit}
                      </button>

                      <AnimatePresence>
                        {unitPickerIndex === idx && (
                          <>
                            <div 
                              className="fixed inset-0 z-40" 
                              onClick={() => setUnitPickerIndex(null)}
                            />
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95, y: 5 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95, y: 5 }}
                              transition={{ duration: 0.1 }}
                              className="absolute right-0 bottom-full mb-2 z-50 glass-dark border border-white/10 p-2 rounded-2xl shadow-2xl min-w-[180px]"
                            >
                              <div className="grid grid-cols-3 gap-1.5">
                                {Object.values(IngredientUnit).map(u => (
                                  <button
                                    key={u}
                                    type="button"
                                    onClick={() => {
                                      updateIngredient(idx, 'unit', u);
                                      setUnitPickerIndex(null);
                                    }}
                                    className={cn(
                                      "flex items-center justify-center py-2 rounded-lg text-lg font-black uppercase transition-all duration-150 active:scale-90",
                                      ing.unit === u 
                                        ? "bg-accent text-white" 
                                        : "bg-white/5 text-white/30 hover:bg-white/10 hover:text-white"
                                    )}
                                  >
                                    {u}
                                  </button>
                                ))}
                              </div>
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => removeIngredient(idx)}
                    className="ml-4 text-red-500/40 hover:text-red-500 transition-colors duration-150 p-1 shrink-0 bg-white/5 rounded-md active:scale-90"
                  >
                    <Trash2 size={14} strokeWidth={2.5} />
                  </button>
                </Reorder.Item>
              ))}
            </Reorder.Group>
          </div>

          <div className="space-y-4 pb-10">
            <div className="flex justify-between items-center border-b border-white/20 pb-2">
              <label className={cn(
                  "text-[10px] font-black uppercase tracking-[2px]",
                  errors.steps ? "text-red-500" : "text-white/60"
              )}>Steps</label>
              <button 
                type="button" 
                onClick={() => {
                   addStep();
                   if (errors.steps) setErrors(prev => ({ ...prev, steps: '' }));
                }}
                className="text-[10px] font-black text-accent uppercase tracking-widest hover:opacity-100 transition-opacity bg-accent/10 px-2 py-1 rounded-md active:scale-95 transition-all"
              >
                + ADD
              </button>
            </div>
            {errors.steps && <p className="text-[10px] text-red-500 mt-1">{errors.steps}</p>}

            <Reorder.Group axis="y" values={steps} onReorder={setSteps} className="space-y-2">
              {steps.map((step, idx) => (
                <Reorder.Item key={idx} value={step} className="flex gap-2 group">
                  <div className="cursor-grab active:cursor-grabbing text-white opacity-40 mt-1.5">
                    <GripVertical size={14} />
                  </div>
                  <div className="flex-1 flex gap-3">
                    <span className="text-xs font-black text-white/60 mt-1.5">{idx + 1}.</span>
                    <div className="flex-1 flex flex-col gap-1">
                      <textarea
                        value={step}
                        onChange={(e) => updateStep(idx, e.target.value)}
                        className="flex-1 bg-transparent outline-none resize-none min-h-[40px] text-sm text-white group-focus-within:text-bright transition-colors font-medium border-b border-white/10 py-1"
                        placeholder="Step details..."
                      />
                      <div className="flex gap-1">
                        <button type="button" onClick={() => formatStep(idx, 'bold')} className="p-1 hover:bg-white/10 rounded"><Bold size={12} className="text-white/50" /></button>
                        <button type="button" onClick={() => formatStep(idx, 'italic')} className="p-1 hover:bg-white/10 rounded"><Italic size={12} className="text-white/50" /></button>
                        <button type="button" onClick={() => formatStep(idx, 'list')} className="p-1 hover:bg-white/10 rounded"><List size={12} className="text-white/50" /></button>
                        <button type="button" onClick={() => formatStep(idx, 'numbered')} className="p-1 hover:bg-white/10 rounded"><ListOrdered size={12} className="text-white/50" /></button>
                        <button type="button" onClick={() => formatStep(idx, 'quote')} className="p-1 hover:bg-white/10 rounded"><Quote size={12} className="text-white/50" /></button>
                      </div>
                    </div>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => removeStep(idx)}
                    className="text-red-500/40 hover:text-red-500 h-fit p-1 mt-0.5 bg-white/5 rounded-md active:scale-90 transition-all duration-150"
                  >
                    <Trash2 size={14} strokeWidth={2.5} />
                  </button>
                </Reorder.Item>
              ))}
            </Reorder.Group>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

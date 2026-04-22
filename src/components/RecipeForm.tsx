import React, { useState } from 'react';
import { motion, Reorder, AnimatePresence } from 'motion/react';
import { Plus, Trash2, GripVertical, Check, X } from 'lucide-react';
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
    
    // Auto-validation: filter out empty steps or ingredients
    const validIngredients = ingredients.filter(i => i.name.trim() !== '' && i.amount > 0);
    const validSteps = steps.filter(s => s.trim() !== '');

    if (!title || validIngredients.length === 0 || validSteps.length === 0) {
      alert('Please fill out all required fields.');
      return;
    }

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

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
    >
      <div 
        onClick={(e) => e.stopPropagation()} 
        className="glass-dark w-full max-w-md max-h-[90vh] overflow-y-auto p-4 sm:p-6 rounded-[24px] relative"
      >
        <div className="flex justify-between items-center mb-6 sticky top-0 bg-transparent backdrop-blur-xl -mx-6 px-6 py-4 z-20 border-b border-white/5">
          <div className="flex items-center gap-3">
             <button 
              onClick={onClose} 
              className="p-2 hover:bg-white/10 rounded-full transition-all text-white/50 hover:text-white border border-transparent hover:border-white/10 active:scale-90"
            >
              <X size={18} />
            </button>
            <div className="space-y-0.5">
              <h2 className="text-xl font-black tracking-tight text-white">{recipe ? 'Edit Masterpiece' : 'New Creation'}</h2>
              <p className="text-[8px] font-black uppercase tracking-[2px] text-accent">Curator Input</p>
            </div>
          </div>
          <button 
            type="submit"
            form="recipe-form"
            className="px-6 py-2 bg-white text-black rounded-full text-xs font-black uppercase tracking-[2.5px] hover:bg-accent hover:text-white transition-all shadow-xl active:scale-95"
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
             <div className="grid grid-cols-[80px_1fr] gap-4">
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
                <div className="glass-dark px-4 py-3 text-sm flex-1 flex items-center border border-white/10 rounded-2xl shadow-xl focus-within:border-accent/40 focus-within:ring-1 focus-within:ring-accent/20 transition-all">
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-transparent outline-none border-none p-0 focus:ring-0 font-black text-lg placeholder:text-white/20 text-white tracking-tight"
                    placeholder="Enter masterpiece name..."
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-white/5 pb-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-white/40 uppercase tracking-[3px]">Components</span>
                <div className="h-px w-8 bg-accent/30" />
              </div>
              <button 
                type="button" 
                onClick={addIngredient}
                className="text-[10px] font-black text-accent uppercase tracking-widest hover:brightness-125 transition-all bg-accent/10 px-3 py-1 rounded-full border border-accent/20"
              >
                + ADD
              </button>
            </div>
            
            <Reorder.Group axis="y" values={ingredients} onReorder={setIngredients} className="space-y-1">
              {ingredients.map((ing, idx) => (
                <Reorder.Item key={idx} value={ing} className="flex gap-2 items-center group">
                  <div className="cursor-grab active:cursor-grabbing text-white opacity-40 group-hover:opacity-100 transition-opacity shrink-0">
                    <GripVertical size={14} />
                  </div>
                  <div className="flex-1 flex gap-2 items-center border-b border-white/10 py-1.5">
                    <input
                      type="text"
                      value={ing.name}
                      onChange={(e) => updateIngredient(idx, 'name', e.target.value)}
                      className="bg-transparent outline-none min-w-0 flex-1 font-bold text-sm placeholder:text-white/20 text-white"
                      placeholder="Name..."
                    />
                    <div className="flex items-center gap-1 shrink-0 relative">
                      <input
                        type="number"
                        step="0.1"
                        value={ing.amount || ''}
                        onChange={(e) => updateIngredient(idx, 'amount', parseFloat(e.target.value))}
                        className="w-10 bg-white/10 rounded-md px-1 py-0.5 text-accent font-black text-[11px] outline-none border border-white/20 focus:border-accent/60 text-right shadow-sm"
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
                              initial={{ opacity: 0, scale: 0.9, y: 10 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.9, y: 10 }}
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
                                      "flex items-center justify-center py-2 rounded-lg text-lg font-black uppercase transition-all",
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
                    className="text-red-500/40 hover:text-red-500 transition-colors p-1 shrink-0 bg-white/5 rounded-md"
                  >
                    <Trash2 size={14} strokeWidth={2.5} />
                  </button>
                </Reorder.Item>
              ))}
            </Reorder.Group>
          </div>

          <div className="space-y-4 pb-10">
            <div className="flex justify-between items-center border-b border-white/20 pb-2">
              <label className="text-[10px] font-black text-white/60 uppercase tracking-[2px]">Steps</label>
              <button 
                type="button" 
                onClick={addStep}
                className="text-[10px] font-black text-accent uppercase tracking-widest hover:opacity-100 transition-opacity bg-accent/10 px-2 py-1 rounded-md"
              >
                + ADD
              </button>
            </div>

            <Reorder.Group axis="y" values={steps} onReorder={setSteps} className="space-y-2">
              {steps.map((step, idx) => (
                <Reorder.Item key={idx} value={step} className="flex gap-2 group">
                  <div className="cursor-grab active:cursor-grabbing text-white opacity-40 mt-1.5">
                    <GripVertical size={14} />
                  </div>
                  <div className="flex-1 flex gap-3">
                    <span className="text-xs font-black text-white/60 mt-1.5">{idx + 1}.</span>
                    <textarea
                      value={step}
                      onChange={(e) => updateStep(idx, e.target.value)}
                      className="flex-1 bg-transparent outline-none resize-none min-h-[40px] text-sm text-white group-focus-within:text-bright transition-colors font-medium border-b border-white/10 py-1"
                      placeholder="Step details..."
                    />
                  </div>
                  <button 
                    type="button" 
                    onClick={() => removeStep(idx)}
                    className="text-red-500/40 hover:text-red-500 transition-colors h-fit p-1 mt-0.5 bg-white/5 rounded-md"
                  >
                    <Trash2 size={14} strokeWidth={2.5} />
                  </button>
                </Reorder.Item>
              ))}
            </Reorder.Group>
          </div>
        </form>
      </div>
    </motion.div>
  );
};

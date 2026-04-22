import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Edit3, Trash2 } from 'lucide-react';
import { type Recipe, db } from '../db';
import { cn } from '../lib/utils';
import { ConfirmationDialog } from './ConfirmationDialog';

interface RecipeCardProps {
  recipe: Recipe;
  onClick: () => void;
  onEdit: (e: React.MouseEvent) => void;
}

export const RecipeCard: React.FC<RecipeCardProps> = ({ recipe, onClick, onEdit }) => {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const handleDelete = async () => {
    await db.recipes.delete(recipe.id!);
    setIsConfirmOpen(false);
  };

  return (
    <>
      <ConfirmationDialog 
        isOpen={isConfirmOpen}
        title="Delete Recipe"
        message={`Are you sure you want to delete "${recipe.title}"? This action cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setIsConfirmOpen(false)}
      />
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9 }}
        onClick={onClick}
        className="interactive-glass p-4 rounded-[24px] flex flex-col gap-2 group overflow-hidden"
      >
        {/* Hover Highlight Bloom */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 blur-[40px] -translate-x-[-50%] -translate-y-[50%] group-hover:bg-accent/30 transition-all pointer-events-none" />
        
        <div className="flex justify-between items-start gap-3 relative z-10">
          <div className="space-y-0.5">
            <h3 className="text-lg font-black leading-tight group-hover:text-accent transition-colors text-white line-clamp-1">{recipe.title}</h3>
          </div>
          <div className="flex gap-1 transition-opacity">
            <button 
              onClick={onEdit}
              className="p-1.5 hover:bg-white/20 rounded-full text-white hover:text-bright transition-colors bg-white/10 border border-white/10 shadow-sm"
            >
              <Edit3 size={13} className="text-white" />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); setIsConfirmOpen(true); }}
              className="p-1.5 hover:bg-red-500/30 rounded-full text-white hover:text-red-300 transition-colors bg-white/10 border border-white/10 shadow-sm"
            >
              <Trash2 size={13} className="text-white" />
            </button>
          </div>
        </div>
        
        {recipe.imageUrl && (
          <div className="overflow-hidden rounded-lg relative z-10">
             <img src={recipe.imageUrl} alt={recipe.title} referrerPolicy="no-referrer" className="w-full h-32 object-cover transition-transform duration-500 group-hover:scale-105" />
          </div>
        )}
        
        <p className="text-sm text-white/80 leading-relaxed line-clamp-2 mt-1 font-medium relative z-10">
          {recipe.description || 'No description provided.'}
        </p>

        <div className="flex items-center justify-between pt-4 border-t border-white/20 mt-auto relative z-10">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/60">
            {recipe.ingredients.length} Components
          </div>
          <div className="text-[10px] font-black uppercase tracking-widest text-white/60">
            {new Date(recipe.updatedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
          </div>
        </div>
      </motion.div>
    </>
  );
};

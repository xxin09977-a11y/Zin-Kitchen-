import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmationDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({ isOpen, title, message, onConfirm, onCancel }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           exit={{ opacity: 0 }}
           className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
           onClick={onCancel}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onClick={(e) => e.stopPropagation()}
            className="glass-dark w-full max-w-sm p-6 rounded-3xl space-y-4"
          >
            <div className="flex items-center gap-3 text-red-400">
              <AlertTriangle size={24} />
              <h3 className="text-lg font-bold">{title}</h3>
            </div>
            <p className="text-sm text-text-dim">{message}</p>
            <div className="flex gap-3 pt-2">
              <button 
                onClick={onCancel}
                className="flex-1 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-black uppercase tracking-widest transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={onConfirm}
                className="flex-1 px-4 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs font-black uppercase tracking-widest transition-colors"
              >
                Delete
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

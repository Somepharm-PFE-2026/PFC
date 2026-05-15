import React from 'react';
import Modal from './Modal';
import { AlertTriangle, Loader2 } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  isLoading?: boolean;
}

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirmer",
  cancelText = "Annuler",
  isDestructive = false,
  isLoading = false
}: ConfirmDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-[400px]">
      <div className="flex flex-col items-center text-center">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 shadow-sm ${isDestructive ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-teal-50 text-teal-600 border border-teal-100'}`}>
          <AlertTriangle size={32} />
        </div>
        
        <p className="text-slate-600 text-sm mb-8 leading-relaxed">
          {description}
        </p>

        <div className="flex w-full gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 active:scale-[0.97] transition-all disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm text-white shadow-sm active:scale-[0.97] transition-all disabled:opacity-70 ${
              isDestructive 
                ? 'bg-rose-600 hover:bg-rose-700' 
                : 'bg-teal-600 hover:bg-teal-700'
            }`}
          >
            {isLoading ? <Loader2 size={18} className="animate-spin" /> : null}
            <span>{isLoading ? 'En cours...' : confirmText}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}

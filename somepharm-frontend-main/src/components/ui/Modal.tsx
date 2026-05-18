import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { useUI } from '../../context/UIContext';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export default function Modal({ isOpen, onClose, title, children, maxWidth = 'max-w-[500px]' }: ModalProps) {
  const { incrementModalCount, decrementModalCount } = useUI();

  useEffect(() => {
    if (isOpen) {
      incrementModalCount();
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      if (isOpen) decrementModalCount();
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, incrementModalCount, decrementModalCount]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />
      
      {/* Modal Card - Bottom Sheet on Mobile, Centered on Desktop */}
      <div className={`relative w-full ${maxWidth} bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-8 sm:zoom-in-95 duration-300 ease-out flex flex-col max-h-[90vh]`}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-slate-100 shrink-0 bg-white">
          <h2 className="text-xl font-heading font-bold text-slate-900">{title}</h2>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors active:scale-95"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 overflow-y-auto custom-scrollbar flex-1 bg-slate-50/50">
          {children}
        </div>
      </div>
    </div>
  );
}

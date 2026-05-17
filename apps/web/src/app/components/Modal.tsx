import { X } from "lucide-react";
import { useEffect } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Modal = ({ isOpen, onClose, title, children }: ModalProps) => {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "unset";
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-dark/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-5 md:p-6 border-b border-slate-border/50 shrink-0">
          <h3 className="text-lg md:text-xl font-bold text-slate-dark font-display">{title}</h3>
          <button onClick={onClose} className="text-slate-mid hover:text-slate-dark transition-colors p-1.5 hover:bg-slate-100 rounded-lg flex items-center justify-center">
            <X size={20} />
          </button>
        </div>
        <div className="p-5 md:p-6 overflow-y-auto flex-1">
          {children}
        </div>
      </div>
    </div>
  );
};

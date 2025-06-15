import React from 'react';
import { Check, X, AlertTriangle } from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle
} from '@/components/ui/dialog';

type CancelDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  theme: "dark" | "light";
};

//reusable cancel dialog component
export const CancelDialog: React.FC<CancelDialogProps> = ({ 
  open, 
  onOpenChange, 
  onConfirm, 
  theme 
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`${theme === "dark" ? "bg-zinc-900 text-white border-zinc-700" : "bg-white text-black border-stone-200"} p-4 max-w-sm mx-auto`}>
        <DialogHeader>
          <DialogTitle className="text-center font-semibold">Cancel Confirmation</DialogTitle>
          <DialogDescription className={`${theme === "dark" ? "text-zinc-400" : "text-stone-500"} text-sm pt-1`}>
            Are you sure you want to cancel the transaction?
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex gap-3 pt-4">
          <button
            onClick={() => onOpenChange(false)}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              theme === "dark"
                ? "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                : "bg-stone-100 text-stone-700 hover:bg-stone-200"
            }`}
          >
            No
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium transition-colors"
          >
            Yes, Cancel
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 
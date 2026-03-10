import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export default function Drawer({ isOpen, onClose, children }: DrawerProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[2000]"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 bg-[#1c1c1e] rounded-t-[24px] p-4 pb-8 z-[2001] flex flex-col items-center"
          >
            <div className="w-10 h-1.5 bg-white/30 rounded-full mb-6" />
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 bg-[#2c2c2e] rounded-full flex items-center justify-center text-white"
            >
              <X className="w-5 h-5" />
            </button>
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

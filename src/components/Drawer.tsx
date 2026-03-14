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
            className="fixed inset-0 bg-black/75"
            style={{ zIndex: 2000, backdropFilter: 'blur(6px)' }}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 220 }}
            className="fixed left-0 right-0 flex flex-col items-center"
            style={{
              zIndex: 2001,
              bottom: 0,
              background: 'linear-gradient(180deg, #1e1e22 0%, #18181c 100%)',
              borderTop: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '24px 24px 0 0',
              // pad bottom = nav height (64px) + safe area so buttons are never hidden
              paddingBottom: 'calc(72px + max(env(safe-area-inset-bottom, 0px), 8px))',
              paddingTop: '16px',
              paddingLeft: '16px',
              paddingRight: '16px',
            }}
          >
            {/* Handle */}
            <div className="w-10 h-1.5 rounded-full mb-4 shrink-0"
              style={{ background: 'rgba(255,255,255,0.2)' }} />

            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center active:scale-90 transition-transform"
              style={{ background: 'rgba(255,255,255,0.08)' }}
            >
              <X className="w-4 h-4 text-white" />
            </button>

            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

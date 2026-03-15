import { motion, AnimatePresence } from 'framer-motion';
import { Zap, HelpCircle } from 'lucide-react';
import { useAppContext } from '../store';
import { hapticImpact } from '../services/telegram';

interface SyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  message?: string;
}

export default function SyncModal({ isOpen, onClose, message }: SyncModalProps) {
  const { setCurrentView, setSyncInfoReturnView } = useAppContext();

  const handleSync = () => {
    hapticImpact('medium');
    onClose();
    setCurrentView('registration');
  };

  const handleWhy = () => {
    hapticImpact('light');
    onClose();
    setSyncInfoReturnView(null); // из попапа — назад через nav
    setCurrentView('sync-info');
  };

  const handleLater = () => {
    hapticImpact('light');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleLater}
            className="fixed inset-0 bg-black/75"
            style={{ zIndex: 3000, backdropFilter: 'blur(8px)' }}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.82, y: 24 }}
            animate={{ opacity: 1, scale: 1,    y: 0  }}
            exit={{   opacity: 0, scale: 0.82, y: 24  }}
            transition={{ type: 'spring', damping: 20, stiffness: 280 }}
            className="fixed left-4 right-4 rounded-[28px] p-6 flex flex-col items-center shadow-2xl"
            style={{
              top: '50%', transform: 'translateY(-50%)',
              zIndex: 3001,
              background: 'linear-gradient(160deg, #1a1a22 0%, #141418 100%)',
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: '0 32px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(35,130,255,0.15)',
            }}
          >
            {/* Ripple rings */}
            <div className="relative w-20 h-20 mb-5 flex items-center justify-center">
              {[0, 1, 2].map(i => (
                <div key={i} className="absolute inset-0 rounded-full"
                  style={{ border: '1.5px solid rgba(35,130,255,0.35)', animation: `ripple-out 2.4s ease-out ${i * 0.8}s infinite` }} />
              ))}
              <div className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, rgba(35,130,255,0.2) 0%, rgba(135,116,225,0.2) 100%)', border: '1px solid rgba(35,130,255,0.3)' }}>
                <Zap className="w-7 h-7 text-[#2382ff]" />
              </div>
            </div>

            <h2 className="text-[20px] font-bold text-white mb-2 text-center" style={{ fontFamily: 'Syne, sans-serif' }}>
              Требуется синхронизация
            </h2>
            <p className="text-[14px] text-gray-400 text-center mb-5 leading-relaxed">
              {message || 'Для этого действия необходимо синхронизировать аккаунт с маркетом.'}
            </p>

            <button onClick={handleSync}
              className="w-full text-white font-bold py-3.5 rounded-2xl active:scale-[0.97] transition-transform mb-2.5 flex items-center justify-center gap-2 text-[15px]"
              style={{ background: 'linear-gradient(135deg, #2382ff 0%, #8774e1 100%)', boxShadow: '0 4px 20px rgba(35,130,255,0.35)' }}
            >
              <Zap className="w-4 h-4" />
              Синхронизировать
            </button>

            <button onClick={handleWhy}
              className="w-full font-semibold py-3 rounded-xl active:scale-[0.97] transition-transform mb-2 flex items-center justify-center gap-2 text-[14px]"
              style={{ background: 'rgba(255,255,255,0.06)', color: '#aaa', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <HelpCircle className="w-4 h-4" />
              Зачем синхронизация?
            </button>

            <button onClick={handleLater}
              className="w-full font-semibold py-2.5 rounded-xl active:scale-[0.97] transition-transform text-gray-500 text-[13px]"
            >
              Позже
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

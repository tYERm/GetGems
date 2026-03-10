import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw } from 'lucide-react';
import { useAppContext } from '../store';
import { hapticImpact } from '../services/telegram';

interface SyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  message?: string;
}

/**
 * Внутриприложенческий модал синхронизации.
 * Заменяет все alert("Для этого действия нужна синхронизация").
 * Кнопка "Синхронизировать" → открывает AuthView.
 * Кнопка "Позже" → закрывает модал.
 */
export default function SyncModal({ isOpen, onClose, message }: SyncModalProps) {
  const { setCurrentView } = useAppContext();

  const handleSync = () => {
    hapticImpact('medium');
    onClose();
    setCurrentView('registration');
  };

  const handleLater = () => {
    hapticImpact('light');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleLater}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            style={{ zIndex: 3000 }}
          />

          {/* Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.88, y: 20 }}
            animate={{ opacity: 1, scale: 1,    y: 0  }}
            exit={{   opacity: 0, scale: 0.88, y: 20  }}
            transition={{ type: 'spring', damping: 22, stiffness: 260 }}
            className="fixed left-4 right-4 bg-[#1c1c1e] rounded-[24px] p-6 flex flex-col items-center shadow-2xl"
            style={{ top: '50%', transform: 'translateY(-50%)', zIndex: 3001 }}
          >
            {/* Icon */}
            <div className="w-16 h-16 rounded-full bg-[#2382ff]/15 flex items-center justify-center mb-4">
              <RefreshCw className="w-8 h-8 text-[#2382ff]" />
            </div>

            <h2 className="text-[18px] font-bold text-white mb-2 text-center">
              Требуется синхронизация
            </h2>
            <p className="text-sm text-gray-400 text-center mb-6 leading-relaxed">
              {message || 'Для этого действия необходимо синхронизировать аккаунт с маркетом.'}
            </p>

            {/* Primary */}
            <button
              onClick={handleSync}
              className="w-full bg-[#2382ff] text-white font-bold py-3.5 rounded-xl active:scale-[0.98] transition-transform mb-3 flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Синхронизировать
            </button>

            {/* Secondary */}
            <button
              onClick={handleLater}
              className="w-full bg-white/8 text-gray-400 font-semibold py-3 rounded-xl active:scale-[0.98] transition-transform"
            >
              Позже
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

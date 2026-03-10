import { useState } from 'react';
import { Star, Plus, ChevronDown } from 'lucide-react';
import { useAppContext } from '../store';
import { motion, AnimatePresence } from 'framer-motion';
import { hapticImpact } from '../services/telegram';

/**
 * Header — единое поле баланса.
 * По умолчанию показывает Stars. Нажатие на ChevronDown разворачивает
 * дропдаун для переключения между Stars и TON.
 * НЕ sticky/fixed — скроллится вместе со страницей.
 */
export default function Header() {
  const { starsBalance, tonBalance, setCurrentView } = useAppContext();
  const [mode, setMode]         = useState<'stars' | 'ton'>('stars');
  const [expanded, setExpanded] = useState(false);

  const handleDeposit = () => {
    hapticImpact('medium');
    setExpanded(false);
    setCurrentView(mode === 'stars' ? 'deposit-stars' : 'deposit-ton');
  };

  const switchMode = (next: 'stars' | 'ton') => {
    hapticImpact('light');
    setMode(next);
    setExpanded(false);
  };

  return (
    <div
      className="px-4"
      style={{
        position: 'fixed',
        top: 'calc(var(--tg-content-safe-area-top, 0px) + 16px)',
        left: 0,
        right: 0,
        zIndex: 50,
      }}
    >
      <div className="relative">
        {/* Main balance pill */}
        <div className="flex items-center gap-2 bg-[#1a1a1a] border border-white/8 rounded-2xl px-4 py-2.5 shadow-md">
          {/* Icon */}
          {mode === 'stars' ? (
            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400 shrink-0" />
          ) : (
            <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center shrink-0">
              <span className="text-[9px] font-bold text-white">T</span>
            </div>
          )}

          {/* Balance value */}
          <span className="text-sm font-semibold text-white flex-1">
            {mode === 'stars'
              ? `${starsBalance} Stars`
              : `${tonBalance.toFixed(2)} TON`}
          </span>

          {/* Expand toggle */}
          <button
            onClick={() => { hapticImpact('light'); setExpanded((v) => !v); }}
            className="flex items-center gap-1 text-gray-400 active:text-white transition-colors"
          >
            <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronDown className="w-4 h-4" />
            </motion.div>
          </button>

          {/* Plus / deposit */}
          <button
            onClick={handleDeposit}
            className="w-7 h-7 bg-white text-black rounded-full flex items-center justify-center active:scale-95 transition-transform ml-1"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Dropdown panel */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, y: -6, scaleY: 0.9 }}
              animate={{ opacity: 1, y: 0,  scaleY: 1   }}
              exit={{   opacity: 0, y: -6, scaleY: 0.9  }}
              transition={{ duration: 0.15 }}
              style={{ transformOrigin: 'top' }}
              className="absolute top-full left-0 right-0 mt-2 bg-[#242424] border border-white/10 rounded-2xl overflow-hidden shadow-2xl"
              style={{ zIndex: 60 }}
            >
              {/* Stars option */}
              <button
                onClick={() => switchMode('stars')}
                className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${
                  mode === 'stars' ? 'bg-white/8 text-white' : 'text-gray-300 hover:bg-white/5'
                }`}
              >
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                <span className="text-sm font-medium flex-1 text-left">Stars</span>
                <span className="text-sm font-bold text-white">{starsBalance}</span>
                {mode === 'stars' && <div className="w-1.5 h-1.5 rounded-full bg-[#2382ff]" />}
              </button>

              <div className="h-px bg-white/5 mx-3" />

              {/* TON option */}
              <button
                onClick={() => switchMode('ton')}
                className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${
                  mode === 'ton' ? 'bg-white/8 text-white' : 'text-gray-300 hover:bg-white/5'
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center shrink-0">
                  <span className="text-[9px] font-bold text-white">T</span>
                </div>
                <span className="text-sm font-medium flex-1 text-left">TON</span>
                <span className="text-sm font-bold text-white">{tonBalance.toFixed(2)}</span>
                {mode === 'ton' && <div className="w-1.5 h-1.5 rounded-full bg-[#2382ff]" />}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { Star, Plus, ChevronDown } from 'lucide-react';
import { useAppContext } from '../store';
import { motion, AnimatePresence } from 'framer-motion';
import { hapticImpact } from '../services/telegram';

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
    <div className="px-4 mt-3 mb-2 relative z-50">
      <div className="relative">
        {/* Main balance pill */}
        <div
          className="flex items-center gap-2 rounded-2xl px-4 py-2.5"
          style={{
            background: 'rgba(28,28,32,0.9)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.09)',
            boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
          }}
        >
          {mode === 'stars' ? (
            <motion.div animate={{ rotate: [0, 15, -15, 0] }} transition={{ duration: 2, repeat: Infinity, repeatDelay: 4 }}>
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400 shrink-0" />
            </motion.div>
          ) : (
            <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center shrink-0 text-[9px] font-bold text-white">T</div>
          )}

          <span className="text-sm font-semibold text-white flex-1 font-display">
            {mode === 'stars' ? `${starsBalance} Stars` : `${tonBalance.toFixed(2)} TON`}
          </span>

          <button
            onClick={() => { hapticImpact('light'); setExpanded(v => !v); }}
            className="flex items-center gap-1 text-gray-400 active:text-white transition-colors"
          >
            <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronDown className="w-4 h-4" />
            </motion.div>
          </button>

          <button
            onClick={handleDeposit}
            className="w-7 h-7 rounded-full flex items-center justify-center active:scale-90 transition-transform ml-1"
            style={{ background: 'linear-gradient(135deg, #2382ff, #8774e1)', boxShadow: '0 2px 12px rgba(35,130,255,0.4)' }}
          >
            <Plus className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Dropdown */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, y: -8, scaleY: 0.88 }}
              animate={{ opacity: 1, y: 0, scaleY: 1 }}
              exit={{ opacity: 0, y: -8, scaleY: 0.88 }}
              transition={{ duration: 0.15 }}
              style={{ transformOrigin: 'top', zIndex: 60 }}
              className="absolute top-full left-0 right-0 mt-2 rounded-2xl overflow-hidden shadow-2xl"
              // @ts-ignore
              style2={{ background: 'rgba(30,30,36,0.96)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)', zIndex: 60 }}
            >
              <div style={{ background: 'rgba(30,30,36,0.96)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16 }}>
                <button onClick={() => switchMode('stars')}
                  className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${mode === 'stars' ? 'bg-white/8 text-white' : 'text-gray-300'}`}>
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  <span className="text-sm font-medium flex-1 text-left">Stars</span>
                  <span className="text-sm font-bold text-white">{starsBalance}</span>
                  {mode === 'stars' && <div className="w-1.5 h-1.5 rounded-full bg-[#2382ff]" />}
                </button>
                <div className="h-px bg-white/5 mx-3" />
                <button onClick={() => switchMode('ton')}
                  className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${mode === 'ton' ? 'bg-white/8 text-white' : 'text-gray-300'}`}>
                  <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center shrink-0 text-[9px] font-bold text-white">T</div>
                  <span className="text-sm font-medium flex-1 text-left">TON</span>
                  <span className="text-sm font-bold text-white">{tonBalance.toFixed(2)}</span>
                  {mode === 'ton' && <div className="w-1.5 h-1.5 rounded-full bg-[#2382ff]" />}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

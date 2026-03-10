import { Star, Plus } from 'lucide-react';
import { useAppContext } from '../store';

export default function Header() {
  const { starsBalance, tonBalance, setCurrentView } = useAppContext();

  return (
    <header className="sticky top-0 z-50 flex justify-between items-center px-4 py-3 bg-[#141414]/80 backdrop-blur-md">
      <div className="flex items-center gap-2 bg-[#1a1a1a] rounded-2xl px-3 py-2 shadow-md">
        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
        <span className="text-sm font-semibold">{starsBalance} Stars</span>
        <button 
          onClick={() => setCurrentView('deposit-stars')}
          className="w-7 h-7 bg-white text-black rounded-full flex items-center justify-center active:scale-95 transition-transform"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center gap-2 bg-[#1a1a1a] rounded-2xl px-3 py-2 shadow-md">
        <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
          <span className="text-[10px] font-bold text-white">T</span>
        </div>
        <span className="text-sm font-semibold">{tonBalance.toFixed(2)} TON</span>
        <button 
          onClick={() => setCurrentView('deposit-ton')}
          className="w-7 h-7 bg-white text-black rounded-full flex items-center justify-center active:scale-95 transition-transform"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}

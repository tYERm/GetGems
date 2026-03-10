import { useState } from 'react';
import { getInventory } from '../services/inventory';
import { NFT_NAMES, nftImage } from '../constants';
import { Plus, Upload, ShoppingCart, Gift } from 'lucide-react';
import { hapticImpact } from '../services/telegram';

export default function MyGiftsView() {
  const [tab, setTab] = useState<'gifts' | 'offers' | 'history'>('gifts');
  const [status, setStatus] = useState<'unlisted' | 'listed'>('unlisted');
  
  const inventory = getInventory();

  const handleAction = () => {
    hapticImpact('medium');
    alert('Для этого действия нужна синхронизация с маркетом');
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex bg-[#141414] border-b border-white/10 p-4 pb-3">
        {['gifts', 'offers', 'history'].map((t) => (
          <button
            key={t}
            onClick={() => { hapticImpact('light'); setTab(t as any); }}
            className={`flex-1 text-center py-2 text-[15px] font-medium transition-colors relative ${tab === t ? 'text-white font-semibold' : 'text-gray-400'}`}
          >
            {t === 'gifts' ? 'Гифты' : t === 'offers' ? 'Офферы' : 'История'}
            {tab === t && <div className="absolute bottom-[-13px] left-0 right-0 h-0.5 bg-[#2d7bff] rounded-t-full" />}
          </button>
        ))}
      </div>

      {tab === 'gifts' && (
        <div className="flex gap-2 p-3 bg-[#141414] border-b border-white/10">
          <button
            onClick={() => { hapticImpact('light'); setStatus('unlisted'); }}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors ${status === 'unlisted' ? 'bg-[#2d7bff]/15 text-[#2d7bff]' : 'bg-white/5 text-gray-400'}`}
          >
            Гифты
            <span className={`px-2 py-0.5 rounded-lg text-xs ${status === 'unlisted' ? 'bg-[#2d7bff]/20' : 'bg-white/10'}`}>
              {inventory.length}
            </span>
          </button>
          <button
            onClick={() => { hapticImpact('light'); setStatus('listed'); }}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors ${status === 'listed' ? 'bg-[#2d7bff]/15 text-[#2d7bff]' : 'bg-white/5 text-gray-400'}`}
          >
            Сделки
            <span className={`px-2 py-0.5 rounded-lg text-xs ${status === 'listed' ? 'bg-[#2d7bff]/20' : 'bg-white/10'}`}>
              0
            </span>
          </button>
        </div>
      )}

      <div className="flex gap-3 p-3 bg-[#141414]">
        {[
          { icon: Plus, label: 'Добавить' },
          { icon: Upload, label: 'Вывод' },
          { icon: ShoppingCart, label: 'Продать' },
          { icon: Gift, label: 'Отправить' }
        ].map(({ icon: Icon, label }) => (
          <button
            key={label}
            onClick={handleAction}
            className="flex-1 bg-white/5 hover:bg-white/10 rounded-xl py-3 flex flex-col items-center gap-1.5 transition-colors active:scale-95"
          >
            <Icon className="w-6 h-6 text-white" />
            <span className="text-xs font-medium text-white">{label}</span>
          </button>
        ))}
      </div>

      <div className="flex-1 p-4 flex flex-col items-center justify-center text-center">
        {inventory.length === 0 ? (
          <div className="opacity-60">
            <div className="text-6xl mb-4">🚀</div>
            <h2 className="text-xl font-semibold text-white mb-2">Мои подарки</h2>
            <p className="text-sm text-gray-400">Здесь будут ваши купленные или полученные подарки.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 w-full">
            {inventory.map((item: any, i: number) => (
              <div key={i} className="bg-[#1c1c1e] border border-white/5 rounded-[22px] overflow-hidden flex flex-col">
                <div className="w-full aspect-square p-2">
                  <div className="w-full h-full rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 overflow-hidden relative flex items-center justify-center">
                    <img src={nftImage(item.slug)} alt={item.slug} className="w-full h-full object-cover absolute inset-0" />
                  </div>
                </div>
                <div className="p-3">
                  <h3 className="text-sm font-semibold text-white truncate">{NFT_NAMES[item.slug] || item.slug}</h3>
                  <p className="text-xs text-gray-400">#{item.num}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

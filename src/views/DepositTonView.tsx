import { ArrowLeft } from 'lucide-react';
import { useAppContext } from '../store';
import { hapticImpact } from '../services/telegram';

export default function DepositTonView() {
  const { tonBalance, setCurrentView, isSynced } = useAppContext();

  const handleAction = () => {
    hapticImpact('medium');
    if (!isSynced) {
      setCurrentView('registration');
    } else {
      alert('Функция в разработке');
    }
  };

  return (
    <div className="min-h-screen bg-[#141414] px-4 pt-4 pb-24">
      <button 
        onClick={() => { hapticImpact('light'); setCurrentView('market'); }}
        className="w-10 h-10 bg-[#1c1c1e] rounded-full flex items-center justify-center text-white mb-6 active:scale-95"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>

      <div className="w-full bg-gradient-to-br from-[#0088cc] via-[#0066aa] to-[#004488] rounded-3xl p-6 flex flex-col items-center relative overflow-hidden mb-8">
        <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center mb-3 shadow-lg">
          <span className="text-[#0088cc] text-2xl font-bold">T</span>
        </div>
        <p className="text-white/80 font-medium mb-1">Баланс кошелька</p>
        <h2 className="text-4xl font-bold text-white mb-6">{tonBalance.toFixed(2)} TON</h2>

        <div className="flex gap-3 w-full">
          <button 
            onClick={handleAction}
            className="flex-1 bg-white text-[#1a1a1a] font-semibold py-3.5 rounded-xl active:scale-[0.98] transition-transform"
          >
            Пополнить
          </button>
          <button 
            onClick={handleAction}
            className="flex-1 bg-white/20 backdrop-blur-md text-white font-semibold py-3.5 rounded-xl active:scale-[0.98] transition-transform"
          >
            Вывод
          </button>
        </div>
      </div>

      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-white">История</h3>
        <button className="bg-[#2c2c2e] text-white px-4 py-2 rounded-xl text-sm font-medium">
          Фильтр
        </button>
      </div>

      <div className="flex flex-col items-center justify-center py-12 text-gray-500">
        <div className="text-4xl mb-4">🕒</div>
        <p>История транзакций</p>
      </div>
    </div>
  );
}

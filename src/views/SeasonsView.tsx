import { Star, Gift, User, CheckCircle2 } from 'lucide-react';
import { hapticImpact } from '../services/telegram';

export default function SeasonsView() {
  const handleTask = () => {
    hapticImpact('medium');
    alert('Для получения награды необходимо синхронизировать аккаунт с маркетом');
  };

  return (
    <div className="flex flex-col min-h-screen pb-24">
      <div className="flex flex-col items-center pt-8 pb-6 bg-[radial-gradient(circle_at_center_40%,rgba(20,20,30,0.8)_0%,transparent_70%)]">
        <div className="text-6xl mb-2">🚀</div>
        <h1 className="text-2xl font-extrabold text-white mb-1">Сезон #2</h1>
        <p className="text-[13px] text-gray-400 text-center leading-tight">
          Зарабатывайте очки и поднимайтесь в<br/>таблице лидеров
        </p>
      </div>

      <div className="px-4 mb-6">
        <div className="bg-[#14100a] rounded-[20px] border border-yellow-500/40 p-4 shadow-[0_4px_20px_rgba(0,0,0,0.4)] relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(rgba(255,215,0,0.15)_1px,transparent_1px)] bg-[size:8px_8px] opacity-50" />
          
          <div className="flex bg-black/20 p-0.5 rounded-full mb-5 relative z-10">
            <button className="flex-1 py-2 text-[13px] font-semibold rounded-full bg-white text-black shadow-sm">Глобальный</button>
            <button className="flex-1 py-2 text-[13px] font-semibold rounded-full text-yellow-500/80">Сезоны 1</button>
            <button className="flex-1 py-2 text-[13px] font-semibold rounded-full text-yellow-500/80">Сезоны 2</button>
          </div>

          <div className="mb-5 relative z-10">
            <div className="text-sm font-semibold text-gray-400 mb-2">Заработал этот период</div>
            <div className="flex items-center gap-2">
              <span className="text-3xl font-extrabold text-white">0</span>
              <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" />
            </div>
          </div>

          <div className="flex flex-col gap-2.5 relative z-10">
            {[
              { label: 'Покупка', icon: Gift },
              { label: 'Продажи', icon: Gift },
              { label: 'Сделки рефералов', icon: User },
              { label: 'Задачи', icon: CheckCircle2 }
            ].map(({ label, icon: Icon }) => (
              <div key={label} className="flex justify-between items-center">
                <span className="text-[15px] font-medium text-gray-400">{label}</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[15px] font-bold text-white">0</span>
                  <Icon className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-[#48484a]">/</span>
                  <span className="text-[15px] font-bold text-white">0</span>
                  <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-xl font-bold text-white">Задачи</h2>
          <span className="text-[15px] font-semibold text-gray-400">Рейтинг</span>
        </div>

        <div className="bg-[#1c1c1e] rounded-[20px] p-4">
          <h3 className="text-[15px] font-semibold text-white mb-3">Один раз</h3>
          
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center text-blue-500">
              <User className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="text-[15px] font-semibold text-white">Пригласите друга</div>
              <div className="text-[13px] font-semibold text-yellow-400 flex items-center gap-1">
                250 <Star className="w-3 h-3 fill-current" />
              </div>
            </div>
            <button onClick={handleTask} className="bg-white text-black px-4 py-2 rounded-full text-sm font-semibold active:scale-95">
              Получить
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

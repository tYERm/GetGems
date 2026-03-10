import { getUserData } from '../services/telegram';
import { Gift, Rocket, ShieldCheck, Star, Coins } from 'lucide-react';
import { useAppContext } from '../store';

export default function ProfileView() {
  const user = getUserData();
  const { isSynced, setCurrentView } = useAppContext();

  return (
    <div className="flex flex-col items-center px-4 pt-8 pb-24">
      <div className="w-24 h-24 rounded-full border-[3px] border-white/20 mb-4 overflow-hidden bg-[#2c2c2e] flex items-center justify-center text-3xl font-bold text-white">
        {user.photoUrl ? (
          <img src={user.photoUrl} alt={user.name} className="w-full h-full object-cover" />
        ) : (
          user.name.charAt(0).toUpperCase()
        )}
      </div>
      
      <h2 className="text-xl font-bold text-white mb-4">{user.name}</h2>
      
      <div className="w-full max-w-[360px] h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-4" />

      <div className="grid grid-cols-3 gap-3 w-full max-w-[420px] mb-6">
        <div className="flex flex-col items-center relative after:content-[''] after:absolute after:right-0 after:top-1 after:bottom-1 after:w-px after:bg-gradient-to-b after:from-transparent after:via-white/20 after:to-transparent">
          <div className="flex items-center gap-1.5 text-[17px] font-bold text-white">
            0 <div className="w-3.5 h-3.5 rounded-full bg-blue-500 text-[8px] flex items-center justify-center">T</div>
          </div>
          <span className="text-[13px] text-gray-400">Объём</span>
        </div>
        <div className="flex flex-col items-center relative after:content-[''] after:absolute after:right-0 after:top-1 after:bottom-1 after:w-px after:bg-gradient-to-b after:from-transparent after:via-white/20 after:to-transparent">
          <div className="flex items-center gap-1.5 text-[17px] font-bold text-white">
            0 <Gift className="w-4 h-4 text-gray-300" />
          </div>
          <span className="text-[13px] text-gray-400">Куплено</span>
        </div>
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-1.5 text-[17px] font-bold text-white">
            0 <Gift className="w-4 h-4 text-gray-300" />
          </div>
          <span className="text-[13px] text-gray-400">Продано</span>
        </div>
      </div>

      <button 
        onClick={() => !isSynced && setCurrentView('registration')}
        className="w-full max-w-[420px] py-3.5 rounded-xl bg-gradient-to-br from-[#1f1f23] to-[#2a2a30] text-white font-bold shadow-lg mb-2 active:scale-[0.98] transition-transform"
      >
        {isSynced ? 'Синхронизировано' : 'Синхронизация'}
      </button>
      
      <button className="w-full max-w-[420px] py-3.5 rounded-xl bg-gradient-to-br from-[#1f1f23] to-[#2a2a30] text-white font-bold shadow-lg mb-6 active:scale-[0.98] transition-transform">
        История транзакций
      </button>

      <div className="w-full max-w-[420px] rounded-2xl bg-gradient-to-br from-[#1b1d24] to-[#111218] border border-white/5 p-4 shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-400 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <Rocket className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-[15px] font-bold text-white leading-tight">Приглашайте друзей и зарабатывайте TON</h3>
            <p className="text-[13px] text-gray-400 leading-tight mt-1">От 20% до 50% в TON и +10% очков сезона с покупок рефералов</p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex gap-2.5">
            <ShieldCheck className="w-5 h-5 text-green-500 shrink-0" />
            <div>
              <div className="text-[15px] font-bold text-white">Реферальные комиссии</div>
              <div className="text-[13px] text-gray-400">Зарабатывайте от 20% до 50% в TON от их покупок</div>
            </div>
          </div>
          <div className="h-px w-full bg-white/5" />
          <div className="flex gap-2.5">
            <Star className="w-5 h-5 text-yellow-400 fill-yellow-400 shrink-0" />
            <div>
              <div className="text-[15px] font-bold text-white">10% очков сезона</div>
              <div className="text-[13px] text-gray-400">Из очков, заработанных вашими рефералами</div>
            </div>
          </div>
          <div className="h-px w-full bg-white/5" />
          <div className="flex gap-2.5">
            <Coins className="w-5 h-5 text-blue-400 shrink-0" />
            <div>
              <div className="text-[15px] font-bold text-white">Кэшбэк — зарабатывайте с покупок</div>
              <div className="text-[13px] text-gray-400">Растёт вместе с объёмом ваших покупок</div>
            </div>
          </div>
        </div>

        <button className="w-full mt-4 py-3.5 rounded-xl bg-gradient-to-br from-blue-500 to-blue-400 text-white font-bold shadow-lg shadow-blue-500/25 active:scale-[0.98] transition-transform">
          Пригласить друзей
        </button>
      </div>
    </div>
  );
}

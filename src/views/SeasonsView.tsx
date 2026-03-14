import { useState } from 'react';
import { Star, Gift, User, CheckCircle2, Trophy, Zap } from 'lucide-react';
import { hapticImpact } from '../services/telegram';
import SyncModal from '../components/SyncModal';
import { motion } from 'framer-motion';

export default function SeasonsView() {
  const [showSync, setShowSync] = useState(false);
  const [activeTab, setActiveTab] = useState<0|1|2>(0);

  const handleTask = () => {
    hapticImpact('medium');
    setShowSync(true);
  };

  const tabs = ['Глобальный', 'Сезон 1', 'Сезон 2'];

  return (
    <div className="flex flex-col min-h-screen pb-24">
      {/* Hero */}
      <div className="flex flex-col items-center pt-8 pb-6 relative overflow-hidden">
        <div className="absolute inset-0"
          style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(234,179,8,0.1) 0%, transparent 65%)' }} />
        <motion.div
          animate={{ rotate: [0, 5, -5, 0], scale: [1, 1.05, 1] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          className="text-5xl mb-2 relative z-10"
        >🚀</motion.div>
        <h1 className="text-[24px] font-bold text-white mb-1 font-display relative z-10">Сезон #2</h1>
        <p className="text-[13px] text-gray-400 text-center leading-snug relative z-10">
          Зарабатывайте очки и поднимайтесь<br />в таблице лидеров
        </p>
      </div>

      <div className="px-4 mb-4">
        {/* Season card */}
        <div className="rounded-[22px] p-4 relative overflow-hidden"
          style={{ background: 'linear-gradient(160deg, #1a1200 0%, #0f0c00 100%)', border: '1px solid rgba(234,179,8,0.25)', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
          {/* dot grid */}
          <div className="absolute inset-0 opacity-30"
            style={{ backgroundImage: 'radial-gradient(rgba(234,179,8,0.4) 1px, transparent 1px)', backgroundSize: '14px 14px' }} />
          <div className="absolute top-0 left-0 right-0 h-24"
            style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(234,179,8,0.15) 0%, transparent 70%)' }} />

          {/* Tabs */}
          <div className="flex p-0.5 rounded-full mb-5 relative z-10"
            style={{ background: 'rgba(0,0,0,0.35)' }}>
            {tabs.map((t, i) => (
              <button key={i} onClick={() => { hapticImpact('light'); setActiveTab(i as 0|1|2); }}
                className="flex-1 py-2 text-[12px] font-semibold rounded-full transition-all"
                style={{
                  background: activeTab === i ? '#fff' : 'transparent',
                  color: activeTab === i ? '#000' : 'rgba(234,179,8,0.7)',
                }}>
                {t}
              </button>
            ))}
          </div>

          <div className="mb-4 relative z-10">
            <div className="text-[12px] font-semibold text-gray-400 mb-1">Заработал этот период</div>
            <div className="flex items-center gap-2">
              <span className="text-[32px] font-bold text-white font-display">0</span>
              <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" />
            </div>
          </div>

          {[
            { label: 'Покупка',          icon: Gift },
            { label: 'Продажи',          icon: Gift },
            { label: 'Сделки рефералов', icon: User },
            { label: 'Задачи',           icon: CheckCircle2 },
          ].map(({ label, icon: Icon }) => (
            <div key={label} className="flex justify-between items-center mb-2.5 relative z-10">
              <div className="flex items-center gap-2">
                <Icon className="w-3.5 h-3.5 text-gray-500" />
                <span className="text-[14px] font-medium text-gray-400">{label}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[14px] font-bold text-white">0</span>
                <span className="text-gray-600">/</span>
                <span className="text-[14px] font-bold text-white">0</span>
                <Star className="w-3 h-3 text-yellow-400 fill-yellow-400 ml-0.5" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tasks */}
      <div className="px-4">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-[20px] font-bold text-white font-display">Задачи</h2>
          <button onClick={handleTask}
            className="text-[13px] font-semibold px-3 py-1 rounded-full active:scale-95 transition-transform"
            style={{ background: 'rgba(35,130,255,0.12)', color: '#2382ff' }}>
            Рейтинг
          </button>
        </div>

        <div className="rounded-[20px] p-4" style={{ background: 'rgba(26,26,32,0.9)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <h3 className="text-[14px] font-bold text-white mb-3 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-yellow-400" />
            Один раз
          </h3>

          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'rgba(35,130,255,0.12)' }}>
              <User className="w-5 h-5 text-[#2382ff]" />
            </div>
            <div className="flex-1">
              <div className="text-[14px] font-semibold text-white">Пригласите друга</div>
              <div className="text-[12px] font-bold text-yellow-400 flex items-center gap-1 mt-0.5">
                250 <Star className="w-3 h-3 fill-current" />
              </div>
            </div>
            <button onClick={handleTask}
              className="text-[13px] font-bold px-4 py-2 rounded-full active:scale-95 transition-transform"
              style={{ background: '#fff', color: '#000' }}>
              Получить
            </button>
          </div>

          <div className="h-px my-3" style={{ background: 'rgba(255,255,255,0.06)' }} />

          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'rgba(135,116,225,0.12)' }}>
              <Zap className="w-5 h-5 text-[#8774e1]" />
            </div>
            <div className="flex-1">
              <div className="text-[14px] font-semibold text-white">Синхронизируйте аккаунт</div>
              <div className="text-[12px] font-bold text-yellow-400 flex items-center gap-1 mt-0.5">
                500 <Star className="w-3 h-3 fill-current" />
              </div>
            </div>
            <button onClick={handleTask}
              className="text-[13px] font-bold px-4 py-2 rounded-full active:scale-95 transition-transform"
              style={{ background: '#fff', color: '#000' }}>
              Получить
            </button>
          </div>
        </div>
      </div>

      <SyncModal isOpen={showSync} onClose={() => setShowSync(false)}
        message="Для получения награды необходимо синхронизировать аккаунт с маркетом." />
    </div>
  );
}

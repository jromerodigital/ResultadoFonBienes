import React, { useState } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { Mail, User, Lock, Eye, EyeClosed, ArrowRight, ShieldCheck, KeyRound, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import FonbienesLogo from '../FonbienesLogo';

function Input({ className, type, ...props }) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-slate-400 dark:placeholder:text-slate-500 selection:bg-brand-500 selection:text-white flex h-10 w-full min-w-0 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white/70 dark:bg-slate-900/60 px-3.5 py-1 text-sm shadow-xs transition-all outline-none",
        "focus-visible:border-brand-500 dark:focus-visible:border-emerald-400 focus-visible:ring-2 focus-visible:ring-brand-500/20 dark:focus-visible:ring-emerald-500/20",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
}

export function SignInCard({ onLoginSuccess }) {
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [focusedInput, setFocusedInput] = useState(null);
  const [rememberMe, setRememberMe] = useState(true);

  // 3D Card tilt motion values
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useTransform(mouseY, [-250, 250], [7, -7]);
  const rotateY = useTransform(mouseX, [-250, 250], [-7, 7]);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left - rect.width / 2);
    mouseY.set(e.clientY - rect.top - rect.height / 2);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  const handleAutoFillDemo = () => {
    setUsername('jromero');
    setPassword('romero');
    setErrorMessage('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    setTimeout(() => {
      const cleanUser = username.trim().toLowerCase();
      const cleanPass = password.trim();

      if (cleanUser === 'jromero' && cleanPass === 'romero') {
        setIsLoading(false);
        if (rememberMe) {
          localStorage.setItem('fonbienes_remembered_user', 'jromero');
        } else {
          localStorage.removeItem('fonbienes_remembered_user');
        }
        sessionStorage.setItem('fonbienes_auth', 'true');
        sessionStorage.setItem('fonbienes_user', 'jromero');
        if (onLoginSuccess) {
          onLoginSuccess({ username: 'jromero', name: 'J. Romero' });
        }
      } else {
        setIsLoading(false);
        setErrorMessage('Credenciales incorrectas. Usa: jromero / romero');
      }
    }, 700);
  };

  return (
    <div className="w-full max-w-md relative z-10 mx-auto px-2 sm:px-0" style={{ perspective: 1400 }}>
      <motion.div
        className="relative"
        style={{ rotateX, rotateY }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <div className="relative group">
          {/* Traveling light beam effect around border (Emerald / White FonBienes gradient) */}
          <div className="absolute -inset-[1px] rounded-3xl overflow-hidden pointer-events-none">
            {/* Top light beam */}
            <motion.div
              className="absolute top-0 left-0 h-[2.5px] w-[50%] bg-gradient-to-r from-transparent via-emerald-400 to-transparent opacity-80"
              animate={{ left: ['-50%', '100%'] }}
              transition={{ duration: 2.8, ease: 'easeInOut', repeat: Infinity, repeatDelay: 0.8 }}
            />
            {/* Right light beam */}
            <motion.div
              className="absolute top-0 right-0 h-[50%] w-[2.5px] bg-gradient-to-b from-transparent via-emerald-400 to-transparent opacity-80"
              animate={{ top: ['-50%', '100%'] }}
              transition={{ duration: 2.8, ease: 'easeInOut', repeat: Infinity, repeatDelay: 0.8, delay: 0.7 }}
            />
            {/* Bottom light beam */}
            <motion.div
              className="absolute bottom-0 right-0 h-[2.5px] w-[50%] bg-gradient-to-r from-transparent via-emerald-400 to-transparent opacity-80"
              animate={{ right: ['-50%', '100%'] }}
              transition={{ duration: 2.8, ease: 'easeInOut', repeat: Infinity, repeatDelay: 0.8, delay: 1.4 }}
            />
            {/* Left light beam */}
            <motion.div
              className="absolute bottom-0 left-0 h-[50%] w-[2.5px] bg-gradient-to-b from-transparent via-emerald-400 to-transparent opacity-80"
              animate={{ bottom: ['-50%', '100%'] }}
              transition={{ duration: 2.8, ease: 'easeInOut', repeat: Infinity, repeatDelay: 0.8, delay: 2.1 }}
            />
          </div>

          {/* Glass Card Container */}
          <div className="relative bg-white/95 dark:bg-[#0C151B]/95 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 border border-slate-200/90 dark:border-emerald-500/25 shadow-2xl transition-all">
            {/* Logo and Header */}
            <div className="text-center space-y-2 mb-6">
              <div className="flex justify-center mb-1">
                <FonbienesLogo variant="auto" className="h-8 sm:h-9 w-auto" />
              </div>

              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-brand-50 dark:bg-emerald-500/15 border border-brand-200/70 dark:border-emerald-500/30 text-[10px] font-bold uppercase tracking-wider text-brand-700 dark:text-emerald-300">
                <ShieldCheck className="w-3 h-3 text-brand-600 dark:text-emerald-400" />
                <span>Acceso Asesor Comercial</span>
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Iniciar Sesión
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Ingresa tus credenciales para acceder a la plataforma
              </p>
            </div>

            {/* Error Message */}
            <AnimatePresence>
              {errorMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-500/40 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                  <span>{errorMessage}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Usuario Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Usuario
                </label>
                <div className="relative flex items-center">
                  <User className={`absolute left-3.5 w-4 h-4 transition-colors ${
                    focusedInput === 'user' ? 'text-brand-600 dark:text-emerald-400' : 'text-slate-400'
                  }`} />
                  <Input
                    type="text"
                    placeholder="jromero"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      if (errorMessage) setErrorMessage('');
                    }}
                    onFocus={() => setFocusedInput('user')}
                    onBlur={() => setFocusedInput(null)}
                    className="pl-10 text-slate-900 dark:text-slate-100"
                    autoComplete="username"
                    required
                  />
                </div>
              </div>

              {/* Contraseña Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Contraseña
                  </label>
                  <button
                    type="button"
                    onClick={handleAutoFillDemo}
                    className="text-[11px] font-semibold text-brand-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                  >
                    <KeyRound className="w-3 h-3" />
                    <span>Usar demo (romero)</span>
                  </button>
                </div>
                <div className="relative flex items-center">
                  <Lock className={`absolute left-3.5 w-4 h-4 transition-colors ${
                    focusedInput === 'pass' ? 'text-brand-600 dark:text-emerald-400' : 'text-slate-400'
                  }`} />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errorMessage) setErrorMessage('');
                    }}
                    onFocus={() => setFocusedInput('pass')}
                    onBlur={() => setFocusedInput(null)}
                    className="pl-10 pr-10 text-slate-900 dark:text-slate-100"
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                  >
                    {showPassword ? <EyeClosed className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me Checkbox */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600 dark:text-slate-400 select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-brand-600 focus:ring-brand-500/30 accent-brand-600"
                  />
                  <span>Recordar sesión</span>
                </label>
                <span className="text-[11px] text-slate-400">Programa FBP010</span>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 h-11 rounded-xl font-bold text-sm bg-gradient-to-r from-brand-600 via-brand-700 to-emerald-600 hover:from-brand-700 hover:to-emerald-700 text-white shadow-md shadow-brand-700/20 hover:shadow-brand-700/30 transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white/80 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Ingresar a la Plataforma</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Quick Helper Credentials Chip */}
            <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/80 text-center">
              <button
                type="button"
                onClick={handleAutoFillDemo}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-brand-50 dark:hover:bg-emerald-950/60 text-slate-600 dark:text-slate-300 hover:text-brand-700 dark:hover:text-emerald-300 text-xs font-semibold transition-all border border-slate-200 dark:border-slate-700"
              >
                <span>🔑 Click para autorrellenar:</span>
                <strong className="text-slate-900 dark:text-white">jromero</strong>
                <span>/</span>
                <strong className="text-slate-900 dark:text-white">romero</strong>
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default SignInCard;


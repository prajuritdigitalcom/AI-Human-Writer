import React, { useState } from 'react';
import { Lock, KeyRound, Eye, EyeOff, ShieldCheck, AlertCircle, ArrowRight } from 'lucide-react';

interface PasswordModalProps {
  onSuccess: () => void;
}

export default function PasswordModal({ onSuccess }: PasswordModalProps) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError('Silakan masukkan password terlebih dahulu.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/verify-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Store verified token in sessionStorage so user stays logged in for the session
        sessionStorage.setItem('prajurit_digital_auth', 'true');
        onSuccess();
      } else {
        setError(data.error || 'Password salah. Silakan periksa kembali password Anda.');
      }
    } catch (err) {
      console.error('Verifikasi password gagal:', err);
      setError('Gagal menghubungkan ke server verifikasi. Silakan coba beberapa saat lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 animate-fade-in select-none" id="password-lock-overlay">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden relative">
        
        {/* Top Decorative Header Accent */}
        <div className="h-2 bg-gradient-to-r from-[#FE4C6F] via-primary to-indigo-600"></div>

        <div className="p-8 sm:p-10 space-y-6">
          
          {/* Logo & Header Title */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-rose-50 border border-rose-100/80 mb-1 relative">
              <img
                src="https://i.ibb.co.com/wr0x733r/prajurit-digital.jpg"
                alt="Logo Prajurit Digital"
                className="h-12 w-12 rounded-xl object-cover shadow-xs"
              />
              <div className="absolute -bottom-1 -right-1 bg-primary text-white p-1 rounded-full shadow-xs">
                <Lock className="h-3.5 w-3.5" />
              </div>
            </div>

            <div className="space-y-1">
              <h2 className="font-display text-2xl font-extrabold text-slate-900 tracking-tight">
                Portal Terkunci
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Masukkan password khusus untuk mengakses <span className="font-bold text-slate-800">AI Human Writer</span> Prajurit Digital.
              </p>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-100 flex items-start gap-2.5 text-xs text-rose-700 animate-fade-in">
              <AlertCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium leading-relaxed">{error}</div>
            </div>
          )}

          {/* Password Input Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5 text-left">
              <label htmlFor="access-password" className="block text-xs font-bold text-slate-700">
                Password Akses
              </label>
              
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <KeyRound className="h-4 w-4" />
                </div>

                <input
                  id="access-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="Masukkan password Anda..."
                  disabled={isLoading}
                  autoFocus
                  className="w-full pl-10 pr-10 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-900 placeholder:text-slate-400 transition-all font-mono"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  tabIndex={-1}
                  aria-label="Tampilkan atau sembunyikan password"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-primary hover:bg-primary-hover text-white text-sm font-bold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed group"
            >
              {isLoading ? (
                <>
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Memverifikasi Password...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4 text-white/90" />
                  <span>Buka Akses Website</span>
                  <ArrowRight className="h-4 w-4 text-white/80 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Footer note */}
          <div className="pt-2 border-t border-slate-100 text-center">
            <p className="text-[11px] text-slate-400">
              Hak Cipta &copy; 2026 <span className="font-semibold text-slate-600">Prajurit Digital</span>.
              <br />
              Diverifikasi secara aman via Backend Server.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}

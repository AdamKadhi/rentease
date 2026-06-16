import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/admin');
    } catch (err) {
      toast.error(err.response?.data?.error || t('loginError'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">

      {/* ══════════════════════════════════════════
          MOBILE — full-screen dark immersive layout
          (hidden on lg+, where the split takes over)
         ══════════════════════════════════════════ */}
      <div
        className="lg:hidden flex flex-col min-h-screen relative overflow-hidden"
        style={{ background: 'linear-gradient(145deg, #080B10 0%, #111827 40%, #0D1117 100%)' }}
      >
        {/* Grid texture */}
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        {/* Gold orbs */}
        <div className="absolute -top-32 -right-32 w-[400px] h-[400px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(201,147,58,0.18) 0%, transparent 65%)' }} />
        <div className="absolute top-1/3 -left-16 w-64 h-64 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(201,147,58,0.10) 0%, transparent 70%)' }} />
        <div className="absolute -bottom-16 right-8 w-72 h-72 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(201,147,58,0.12) 0%, transparent 70%)' }} />

        {/* Top: branding */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative flex flex-col items-center pt-16 pb-10 px-6 text-center"
        >
          {/* Logo mark */}
          <div className="w-16 h-16 rounded-2xl bg-gold-grad flex items-center justify-center shadow-glow mb-5">
            <span className="text-white font-bold text-2xl">R</span>
          </div>
          <h1 className="font-playfair text-3xl font-bold text-white mb-2">GesLoc</h1>
          <p className="text-white/45 text-sm max-w-xs leading-relaxed">
            Gérez vos locations, réservations et revenus en un seul endroit.
          </p>

          {/* Feature chips */}
          <div className="flex gap-2 flex-wrap justify-center mt-6">
            {['Réservations', 'Calendrier', 'Revenus'].map(tag => (
              <span key={tag}
                className="px-3 py-1 rounded-full text-[11px] font-medium border border-white/10 bg-white/8 text-white/50">
                {tag}
              </span>
            ))}
          </div>
        </motion.div>

        {/* Bottom: glass form card */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="relative flex-1 mx-4 mb-6 rounded-3xl overflow-hidden"
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.10)',
            backdropFilter: 'blur(20px)',
          }}
        >
          <div className="p-7">
            <h2 className="font-playfair text-xl font-bold text-white mb-1">Connexion</h2>
            <p className="text-white/40 text-sm mb-7">Accédez à votre espace administrateur.</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-white/50 uppercase tracking-wide mb-1.5">
                  {t('email')}
                </label>
                <input
                  type="email"
                  placeholder="votre@email.com"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  required
                  className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-gold/40 transition"
                  style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-white/50 uppercase tracking-wide mb-1.5">
                  {t('password')}
                </label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    required
                    className="w-full px-4 py-3 pr-11 rounded-xl text-sm text-white placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-gold/40 transition"
                    style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}
                  />
                  <button type="button" onClick={() => setShowPass(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/35 hover:text-white/70 transition">
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2 transition active:scale-[0.98] mt-2"
                style={{ background: 'linear-gradient(135deg, #C9933A, #E8B96A)' }}
              >
                {loading
                  ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  : <>{t('login')} <ArrowRight size={16} /></>
                }
              </button>
            </form>
          </div>
        </motion.div>

        <p className="relative text-center text-white/15 text-[11px] pb-5">
          © {new Date().getFullYear()} GesLoc
        </p>
      </div>

      {/* ══════════════════════════════════════════
          DESKTOP — classic split layout
         ══════════════════════════════════════════ */}
      {/* Left decorative panel */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(145deg, #080B10 0%, #111827 40%, #0D1117 100%)' }}
      >
        {/* Grid texture */}
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(201,147,58,0.18) 0%, transparent 65%)' }} />
        <div className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(201,147,58,0.10) 0%, transparent 70%)' }} />

        <div className="relative flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gold-grad flex items-center justify-center shadow-glow">
            <span className="text-white font-bold">R</span>
          </div>
          <span className="font-playfair text-2xl font-bold text-white">GesLoc</span>
        </div>

        <div className="relative">
          <h2 className="font-playfair text-4xl font-bold text-white leading-tight mb-4">
            Gérez vos locations<br />avec élégance
          </h2>
          <p className="text-white/50 text-sm leading-relaxed">
            Réservations, disponibilités, revenus — tout en un seul endroit.
          </p>
          <div className="mt-10 flex gap-3 flex-wrap">
            {['Réservations', 'Calendrier', 'Revenus'].map(tag => (
              <span key={tag}
                className="px-3 py-1.5 rounded-full bg-white/10 text-white/60 text-xs font-medium border border-white/10">
                {tag}
              </span>
            ))}
          </div>
        </div>

        <p className="relative text-white/20 text-xs">© {new Date().getFullYear()} GesLoc</p>
      </div>

      {/* Right form panel */}
      <div className="hidden lg:flex flex-1 items-center justify-center px-6 py-12 bg-parchment">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-sm"
        >
          <h1 className="font-playfair text-3xl font-bold text-ink mb-1">{t('login')}</h1>
          <p className="text-muted text-sm mb-8">Bienvenue, connectez-vous à votre espace.</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">{t('email')}</label>
              <input className="input" type="email" placeholder="votre@email.com"
                value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
            </div>
            <div>
              <label className="label">{t('password')}</label>
              <div className="relative">
                <input className="input pr-10" type={showPass ? 'text' : 'password'} placeholder="••••••"
                  value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
                <button type="button" onClick={() => setShowPass(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink transition">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3 mt-2">
              {loading
                ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                : <>{t('login')} <ArrowRight size={16} /></>
              }
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}

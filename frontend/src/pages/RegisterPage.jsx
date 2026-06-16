import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

export default function RegisterPage() {
  const { t } = useTranslation();
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', language: 'fr' });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await register(form.name, form.email, form.password, form.language);
      toast.success(t('registerSuccess'));
      navigate('/admin');
    } catch (err) {
      toast.error(err.response?.data?.error || t('error'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-parchment flex">
      {/* Left decorative */}
      <div className="hidden lg:flex lg:w-1/2 bg-sidebar-grad flex-col justify-between p-12">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gold-grad flex items-center justify-center shadow-glow">
            <span className="text-white font-bold">R</span>
          </div>
          <span className="font-playfair text-2xl font-bold text-white">GesLoc</span>
        </div>
        <div>
          <h2 className="font-playfair text-4xl font-bold text-white leading-tight mb-4">
            Créez votre compte<br />gratuitement
          </h2>
          <p className="text-white/50 text-sm">Commencez à gérer vos propriétés en quelques secondes.</p>
        </div>
        <p className="text-white/20 text-xs">© 2025 GesLoc</p>
      </div>

      {/* Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-sm"
        >
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <div className="w-8 h-8 rounded-lg bg-gold-grad flex items-center justify-center">
              <span className="text-white font-bold text-sm">R</span>
            </div>
            <span className="font-playfair text-xl font-bold text-ink">GesLoc</span>
          </div>

          <h1 className="font-playfair text-3xl font-bold text-ink mb-1">{t('register')}</h1>
          <p className="text-muted text-sm mb-8">Créez votre espace de gestion.</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">{t('name')}</label>
              <input className="input" value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
            </div>
            <div>
              <label className="label">{t('email')}</label>
              <input type="email" className="input" value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
            </div>
            <div>
              <label className="label">{t('password')}</label>
              <input type="password" className="input" value={form.password} minLength={6}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
            </div>

            <div>
              <label className="label">{t('chooseLang')}</label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                {[
                  { value: 'fr', label: '🇫🇷 Français' },
                  { value: 'ar', label: '🇹🇳 العربية' },
                ].map(lang => (
                  <button key={lang.value} type="button"
                    onClick={() => setForm(f => ({ ...f, language: lang.value }))}
                    className={`py-2.5 rounded-xl border-2 text-sm font-semibold transition ${
                      form.language === lang.value
                        ? 'border-gold bg-gold/8 text-gold'
                        : 'border-border text-muted hover:border-gold/50'
                    }`}>
                    {lang.label}
                  </button>
                ))}
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3 mt-2">
              {loading
                ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                : <>{t('register')} <ArrowRight size={16} /></>}
            </button>
          </form>

          <p className="text-center text-sm text-muted mt-6">
            {t('alreadyAccount')}{' '}
            <Link to="/admin/login" className="text-gold font-semibold hover:underline">{t('login')}</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}

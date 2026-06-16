import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { User, Mail, Phone, Lock, Eye, EyeOff, Save, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';

export default function SettingsPage() {
  const { user, setUser } = useAuth();
  const { t, i18n } = useTranslation();

  const [profile, setProfile] = useState({
    name:  user?.name  || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  const [pass, setPass] = useState({ current: '', newPass: '', confirm: '' });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew]         = useState(false);
  const [savingPass, setSavingPass]   = useState(false);

  async function handleSaveProfile(e) {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const { data } = await api.put('/auth/profile', {
        name:  profile.name,
        email: profile.email,
        phone: profile.phone || null,
      });
      setUser(data.user);
      setProfileSaved(true);
      toast.success(t('profileUpdated'));
      setTimeout(() => setProfileSaved(false), 2500);
    } catch (err) {
      toast.error(err.response?.data?.error || t('updateError'));
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    if (pass.newPass !== pass.confirm) {
      toast.error(t('passwordMismatch'));
      return;
    }
    setSavingPass(true);
    try {
      await api.put('/auth/password', {
        currentPassword: pass.current,
        newPassword:     pass.newPass,
      });
      toast.success(t('passwordChanged'));
      setPass({ current: '', newPass: '', confirm: '' });
    } catch (err) {
      toast.error(err.response?.data?.error || t('error'));
    } finally {
      setSavingPass(false);
    }
  }

  const inputCls = "input";
  const labelCls = "label";

  return (
    <div className="p-4 lg:p-8 max-w-2xl space-y-6">
      <h1 className="font-playfair text-3xl font-bold text-ink">{t('settings')}</h1>

      {/* ── Profile ── */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gold-grad flex items-center justify-center shadow-glow shrink-0">
            <User size={18} className="text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-ink text-base">{t('personalInfo')}</h2>
            <p className="text-muted text-xs mt-0.5">{t('personalInfoSub')}</p>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div>
            <label className={labelCls}>{t('name')}</label>
            <div className="relative">
              <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
              <input
                className={`${inputCls} pl-9`}
                value={profile.name}
                onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
                required
              />
            </div>
          </div>

          <div>
            <label className={labelCls}>{t('email')}</label>
            <div className="relative">
              <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
              <input
                type="email"
                className={`${inputCls} pl-9`}
                value={profile.email}
                onChange={e => setProfile(p => ({ ...p, email: e.target.value }))}
                required
              />
            </div>
          </div>

          <div>
            <label className={labelCls}>{t('phone')}</label>
            <div className="relative">
              <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
              <input
                className={`${inputCls} pl-9`}
                placeholder="+216 XX XXX XXX"
                value={profile.phone}
                onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="pt-1">
            <button
              type="submit"
              disabled={savingProfile}
              className="btn-primary flex items-center gap-2 px-6"
            >
              {profileSaved
                ? <><Check size={15} /> {t('saved')}</>
                : savingProfile
                  ? <><div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> {t('saving')}</>
                  : <><Save size={15} /> {t('saveChanges')}</>
              }
            </button>
          </div>
        </form>
      </div>

      {/* ── Password ── */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'linear-gradient(135deg, #1C2333, #0D1117)' }}>
            <Lock size={18} className="text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-ink text-base">{t('changePassword')}</h2>
            <p className="text-muted text-xs mt-0.5">{t('passwordMinLength')}</p>
          </div>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className={labelCls}>{t('currentPassword')}</label>
            <div className="relative">
              <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
              <input
                type={showCurrent ? 'text' : 'password'}
                className={`${inputCls} pl-9 pr-10`}
                placeholder="••••••"
                value={pass.current}
                onChange={e => setPass(p => ({ ...p, current: e.target.value }))}
                required
              />
              <button type="button" onClick={() => setShowCurrent(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink transition">
                {showCurrent ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <div>
            <label className={labelCls}>{t('newPassword')}</label>
            <div className="relative">
              <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
              <input
                type={showNew ? 'text' : 'password'}
                className={`${inputCls} pl-9 pr-10`}
                placeholder="••••••"
                value={pass.newPass}
                onChange={e => setPass(p => ({ ...p, newPass: e.target.value }))}
                required
                minLength={6}
              />
              <button type="button" onClick={() => setShowNew(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink transition">
                {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <div>
            <label className={labelCls}>{t('confirmPassword')}</label>
            <div className="relative">
              <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
              <input
                type="password"
                className={`${inputCls} pl-9`}
                placeholder="••••••"
                value={pass.confirm}
                onChange={e => setPass(p => ({ ...p, confirm: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="pt-1">
            <button
              type="submit"
              disabled={savingPass}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-[0.97] disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #0D1117, #1C2333)' }}
            >
              {savingPass
                ? <><div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> {t('changing')}</>
                : <><Lock size={15} /> {t('changePasswordBtn')}</>
              }
            </button>
          </div>
        </form>
      </div>

      {/* ── Language ── */}
      <div className="card p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-ink text-base">{t('interfaceLang')}</h2>
            <p className="text-muted text-xs mt-0.5">
              {i18n.language === 'fr' ? 'Français' : 'العربية'}
            </p>
          </div>
          <button
            onClick={() => i18n.changeLanguage(i18n.language === 'fr' ? 'ar' : 'fr')}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold border border-border hover:border-gold/40 hover:bg-gold/5 transition text-ink"
          >
            {i18n.language === 'fr' ? 'العربية' : 'Français'}
          </button>
        </div>
      </div>
    </div>
  );
}

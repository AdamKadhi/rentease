import { useState, useEffect, useCallback } from 'react';
import { useSocketEvent } from '../hooks/useSocketEvent';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Home, BookOpen, TrendingUp, Clock, AlertCircle, ArrowUpRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { format } from 'date-fns';
import api from '../api/axios';

const MONTH_KEYS = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];

const KPI_CONFIG = [
  { key: 'totalHouses',   label: 'properties',   icon: Home,       bg: 'from-obsidian to-charcoal',  text: 'text-white' },
  { key: 'activeBookings',label: 'activeBookings',icon: BookOpen,   bg: 'from-emerald-600 to-emerald-400', text: 'text-white' },
  { key: 'collected',     label: 'collected',    icon: TrendingUp,  bg: 'from-gold to-gold-light',    text: 'text-white', suffix: ' DT' },
  { key: 'pendingPayment',label: 'pendingPayment',icon: Clock,      bg: 'from-amber-500 to-amber-300', text: 'text-white', suffix: ' DT' },
];

function SkeletonKpi() {
  return (
    <div className="card p-5 animate-pulse">
      <div className="w-10 h-10 rounded-xl bg-border mb-4" />
      <div className="h-7 bg-border rounded-lg w-1/2 mb-2" />
      <div className="h-3 bg-border rounded w-2/3" />
    </div>
  );
}

export default function DashboardPage() {
  const { t } = useTranslation();
  const [stats, setStats] = useState(null);
  const [income, setIncome] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(() => {
    const year = new Date().getFullYear();
    Promise.all([
      api.get('/stats/dashboard'),
      api.get(`/stats/income?year=${year}`),
    ]).then(([d, i]) => {
      setStats(d.data);
      setIncome(i.data);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  useSocketEvent({
    'booking:created': fetchStats,
    'booking:updated': fetchStats,
    'booking:deleted': fetchStats,
    'house:created':   fetchStats,
    'house:deleted':   fetchStats,
  });

  const kpiValues = stats ? {
    totalHouses:    stats.totalHouses,
    activeBookings: stats.activeBookings,
    collected:      stats.collected?.toLocaleString('fr-TN'),
    pendingPayment: stats.pendingPayment?.toLocaleString('fr-TN'),
  } : {};

  const chartData = stats?.monthlyRevenue?.map(({ month, revenue }) => {
    const [, m] = month.split('-');
    return { name: t(MONTH_KEYS[parseInt(m) - 1]), revenue };
  });

  return (
    <div className="p-4 lg:p-8 space-y-7">

      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-playfair text-3xl font-bold text-ink">{t('dashboard')}</h1>
          <p className="text-muted text-sm mt-1 capitalize">{format(new Date(), 'EEEE dd MMMM yyyy')}</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading
          ? Array(4).fill(0).map((_, i) => <SkeletonKpi key={i} />)
          : KPI_CONFIG.map(({ key, label, icon: Icon, bg, text, suffix = '' }, i) => (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className={`relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br ${bg} shadow-card`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
                  <Icon size={18} className={text} />
                </div>
                <ArrowUpRight size={14} className="text-white/40" />
              </div>
              <p className={`text-2xl font-bold ${text} leading-none`}>
                {kpiValues[key]}{suffix}
              </p>
              <p className={`text-xs mt-1.5 ${text} opacity-70`}>{t(label)}</p>
              {/* subtle blob */}
              <div className="absolute -right-4 -bottom-4 w-20 h-20 rounded-full bg-white/8" />
            </motion.div>
          ))
        }
      </div>

      {/* Revenue chart */}
      {!loading && chartData && (
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="card p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-playfair text-lg font-bold text-ink">{t('revenueChart')}</h3>
            <span className="text-xs text-muted bg-parchment px-3 py-1 rounded-full border border-border">
              6 derniers mois
            </span>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData} barSize={32}>
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#8B7E74' }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip
                formatter={v => [`${v.toLocaleString()} DT`]}
                contentStyle={{ borderRadius: 14, border: 'none', boxShadow: '0 8px 30px rgba(0,0,0,0.12)', background: '#FDFAF6' }}
                cursor={{ fill: '#F0EBE1' }}
              />
              <Bar dataKey="revenue" radius={[8, 8, 0, 0]}
                fill="url(#barGrad)" />
              <defs>
                <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#C9933A" />
                  <stop offset="100%" stopColor="#E8B96A" stopOpacity={0.7} />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* Upcoming + Pending */}
      <div className="grid lg:grid-cols-2 gap-5">
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="card p-5"
        >
          <h3 className="font-semibold text-ink mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-gold" />
            {t('upcomingArrivals')}
          </h3>
          {!loading && stats?.upcomingArrivals?.length === 0 && (
            <p className="text-muted text-sm py-6 text-center">{t('noUpcoming')}</p>
          )}
          {!loading && stats?.upcomingArrivals?.map(b => (
            <div key={b.id} className="flex items-center gap-3 py-3 border-b border-border last:border-0">
              <div className="w-2.5 h-9 rounded-full shrink-0" style={{ background: b.house.color }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-ink truncate">{b.guestName}</p>
                <p className="text-xs text-muted">{b.house.name}</p>
              </div>
              <span className="text-xs font-semibold text-gold bg-gold/10 px-2.5 py-1 rounded-lg shrink-0">
                {format(new Date(b.checkIn), 'dd/MM')}
              </span>
            </div>
          ))}
        </motion.div>

        {!loading && stats?.pendingBookings > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="rounded-2xl p-5 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200"
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center">
                <AlertCircle size={16} className="text-amber-600" />
              </div>
              <h3 className="font-semibold text-amber-900 text-sm">{t('pendingAlerts')}</h3>
            </div>
            <p className="text-amber-800 text-sm leading-relaxed">
              <span className="font-bold text-amber-900">{stats.pendingBookings}</span> réservation(s) en attente de confirmation.
            </p>
          </motion.div>
        ) : null}
      </div>

      {/* Revenue by house */}
      {!loading && income?.houseStats?.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
          className="card p-6"
        >
          <h3 className="font-playfair text-lg font-bold text-ink mb-6">{t('revenueByHouse')}</h3>
          <div className="space-y-5">
            {income.houseStats.map(h => {
              const pct = income.grandTotal ? (h.totalRevenue / income.grandTotal) * 100 : 0;
              const paidPct = h.totalRevenue ? (h.collected / h.totalRevenue) * 100 : 0;
              return (
                <div key={h.id}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-3 h-3 rounded-full shadow-sm" style={{ background: h.color }} />
                      <span className="font-semibold text-ink text-sm">{h.name}</span>
                      
                    </div>
                    <span className="font-bold text-ink text-sm">{h.totalRevenue.toLocaleString()} DT</span>
                  </div>
                  <div className="h-2 bg-parchment border border-border/50 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut', delay: 0.5 }}
                      className="h-full rounded-full"
                      style={{ background: h.color }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted mt-1.5">
                    <span>{t('collected')}: <span className="text-ink font-medium">{h.collected.toLocaleString()} DT</span></span>
                    <span className="font-semibold" style={{ color: h.color }}>{Math.round(paidPct)}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
}

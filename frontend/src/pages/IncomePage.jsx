import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { format } from 'date-fns';
import api from '../api/axios';
import StatusBadge from '../components/StatusBadge';

const MONTH_KEYS = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];

export default function IncomePage() {
  const { t } = useTranslation();
  const [year, setYear] = useState(new Date().getFullYear());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get(`/stats/income?year=${year}`).then(r => setData(r.data)).finally(() => setLoading(false));
  }, [year]);

  const chartData = data?.monthly?.map((m, i) => ({
    name: t(MONTH_KEYS[i]),
    revenue: m.revenue,
    collected: m.collected,
  }));

  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-playfair text-2xl font-bold text-navy">{t('income')}</h1>
        <select
          value={year}
          onChange={e => setYear(parseInt(e.target.value))}
          className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-terracotta/40"
        >
          {[2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* Summary cards */}
      {!loading && data && (
        <div className="grid grid-cols-2 gap-3">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-4 shadow-sm"
          >
            <p className="text-xs text-slate">{t('totalRevenue')}</p>
            <p className="text-2xl font-bold text-navy mt-1">{data.grandTotal?.toLocaleString()} DT</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-white rounded-2xl p-4 shadow-sm"
          >
            <p className="text-xs text-slate">{t('collected')}</p>
            <p className="text-2xl font-bold text-green-600 mt-1">
              {data.houseStats?.reduce((s, h) => s + h.collected, 0).toLocaleString()} DT
            </p>
          </motion.div>
        </div>
      )}

      {/* Monthly chart */}
      {!loading && chartData && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-4 shadow-sm"
        >
          <h3 className="font-semibold text-navy mb-4 text-sm">{t('monthlyRevenue')}</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} barSize={20} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip
                formatter={(v, name) => [`${v.toLocaleString()} DT`, name === 'revenue' ? t('totalRevenue') : t('collected')]}
                contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
              />
              <Bar dataKey="revenue" fill="#1A3C5E" radius={[4, 4, 0, 0]} name="revenue" />
              <Bar dataKey="collected" fill="#C96A3B" radius={[4, 4, 0, 0]} name="collected" />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-2">
            <div className="flex items-center gap-1.5 text-xs text-slate">
              <div className="w-3 h-3 rounded bg-navy" /> {t('totalRevenue')}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate">
              <div className="w-3 h-3 rounded bg-terracotta" /> {t('collected')}
            </div>
          </div>
        </motion.div>
      )}

      {/* Revenue by house */}
      {!loading && data?.houseStats?.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white rounded-2xl p-4 shadow-sm"
        >
          <h3 className="font-semibold text-navy mb-4 text-sm">{t('revenueByHouse')}</h3>
          <div className="space-y-4">
            {data.houseStats.map(h => {
              const pct = data.grandTotal ? (h.totalRevenue / data.grandTotal) * 100 : 0;
              const paidPct = h.totalRevenue ? (h.collected / h.totalRevenue) * 100 : 0;
              return (
                <div key={h.id}>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ background: h.color }} />
                      <span className="font-medium text-navy">{h.name}</span>
                      <span className="text-xs text-slate">({h.bookingCount} {t('bookings')})</span>
                    </div>
                    <span className="font-bold text-navy">{h.totalRevenue.toLocaleString()} DT</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, background: h.color }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-slate mt-1">
                    <span>{t('collected')}: {h.collected.toLocaleString()} DT</span>
                    <span>{Math.round(paidPct)}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Recent payments */}
      {!loading && data?.recentBookings?.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl p-4 shadow-sm"
        >
          <h3 className="font-semibold text-navy mb-3 text-sm">{t('recentPayments')}</h3>
          <div className="space-y-2">
            {data.recentBookings.map(b => {
              const remaining = b.totalAmount - b.amountPaid;
              return (
                <div key={b.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                  <div className="w-2 h-8 rounded-full shrink-0" style={{ background: b.house.color }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-navy truncate">{b.guestName}</p>
                    <p className="text-xs text-slate">{b.house.name} · {format(new Date(b.checkIn), 'dd/MM/yyyy')}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-navy">{b.totalAmount} DT</p>
                    {remaining > 0 ? (
                      <p className="text-xs text-amber-600">{t('remaining')}: {remaining} DT</p>
                    ) : (
                      <p className="text-xs text-green-600">{t('paid')}</p>
                    )}
                  </div>
                  <StatusBadge status={b.status} />
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
}

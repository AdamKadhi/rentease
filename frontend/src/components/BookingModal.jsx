import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { differenceInDays, format } from 'date-fns';
import toast from 'react-hot-toast';
import { AlertTriangle, CheckCircle, Loader } from 'lucide-react';
import Modal from './Modal';
import api from '../api/axios';

export default function BookingModal({ booking, initialValues, onClose, onSaved }) {
  const { t } = useTranslation();
  const [houses, setHouses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [monthPrice, setMonthPrice] = useState(null);
  const priceAutoRef = useRef(true);

  // Availability state
  const [availability, setAvailability] = useState(null); // null | 'checking' | 'available' | { conflict }
  const availTimerRef = useRef(null);

  const [form, setForm] = useState({
    houseId: booking?.houseId || '',
    guestName: booking?.guestName || '',
    phone: booking?.phone || '',
    checkIn: booking?.checkIn ? format(new Date(booking.checkIn), 'yyyy-MM-dd') : (initialValues?.checkIn || ''),
    checkOut: booking?.checkOut ? format(new Date(booking.checkOut), 'yyyy-MM-dd') : '',
    totalAmount: booking?.totalAmount || '',
    amountPaid: booking?.amountPaid || 0,
    status: booking?.status || 'confirmed',
    notes: booking?.notes || '',
    persons: booking?.persons || '',
  });

  useEffect(() => {
    api.get('/houses').then(r => setHouses(r.data));
  }, []);

  // Fetch effective price when house or checkIn month changes
  useEffect(() => {
    if (!form.houseId || !form.checkIn) return;
    const month = new Date(form.checkIn).getMonth() + 1;
    api.get(`/houses/${form.houseId}/price?month=${month}`)
      .then(r => setMonthPrice(r.data.price))
      .catch(() => {
        const h = houses.find(h => h.id === form.houseId);
        setMonthPrice(h?.pricePerNight ?? null);
      });
  }, [form.houseId, form.checkIn, houses]);

  // Auto-calculate total when dates or price change
  useEffect(() => {
    if (!priceAutoRef.current) return;
    if (form.checkIn && form.checkOut && monthPrice) {
      const nights = differenceInDays(new Date(form.checkOut), new Date(form.checkIn));
      if (nights > 0) setForm(f => ({ ...f, totalAmount: (nights * monthPrice).toFixed(2) }));
    }
  }, [form.checkIn, form.checkOut, monthPrice]);

  // Debounced availability check whenever house, checkIn, checkOut change
  useEffect(() => {
    if (!form.houseId || !form.checkIn || !form.checkOut) {
      setAvailability(null);
      return;
    }
    const nights = differenceInDays(new Date(form.checkOut), new Date(form.checkIn));
    if (nights <= 0) { setAvailability('invalid_dates'); return; }

    setAvailability('checking');
    clearTimeout(availTimerRef.current);
    availTimerRef.current = setTimeout(async () => {
      try {
        const params = {
          houseId: form.houseId,
          checkIn: form.checkIn,
          checkOut: form.checkOut,
          ...(booking?.id && { excludeId: booking.id }),
        };
        const { data } = await api.get('/bookings/availability', { params });
        setAvailability(data.available ? 'available' : data.conflict);
      } catch {
        setAvailability(null);
      }
    }, 450);

    return () => clearTimeout(availTimerRef.current);
  }, [form.houseId, form.checkIn, form.checkOut, booking?.id]);

  const nights = form.checkIn && form.checkOut
    ? Math.max(0, differenceInDays(new Date(form.checkOut), new Date(form.checkIn)))
    : 0;

  const selectedHouse = houses.find(h => h.id === form.houseId);
  const hasMonthOverride = selectedHouse && monthPrice !== null && monthPrice !== selectedHouse.pricePerNight;
  const isInvalidDates = availability === 'invalid_dates';
  const isBlocked = availability && availability !== 'checking' && availability !== 'available' && availability !== 'invalid_dates';

  async function handleSubmit(e) {
    e.preventDefault();
    if (isBlocked) return toast.error('Cette période est déjà réservée');
    setLoading(true);
    try {
      const payload = {
        ...form,
        totalAmount: parseFloat(form.totalAmount),
        amountPaid: parseFloat(form.amountPaid),
        persons: form.persons ? parseInt(form.persons) : null,
      };
      if (booking) {
        await api.put(`/bookings/${booking.id}`, payload);
        toast.success(t('bookingUpdated'));
      } else {
        await api.post('/bookings', payload);
        toast.success(t('bookingCreated'));
      }
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.error || t('error'));
    } finally {
      setLoading(false);
    }
  }

  const inputCls = "w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-terracotta/40 focus:border-terracotta transition bg-white";
  const labelCls = "block text-xs font-medium text-slate mb-1";

  return (
    <Modal title={booking ? t('edit') : t('newBooking')} onClose={onClose} size="lg">
      <form onSubmit={handleSubmit} className="p-5 space-y-4">
        <div>
          <label className={labelCls}>{t('house')} *</label>
          <select className={inputCls} value={form.houseId}
            onChange={e => { priceAutoRef.current = true; setForm(f => ({ ...f, houseId: e.target.value })); }}
            required>
            <option value="">{t('selectHouse')}</option>
            {houses.map(h => <option key={h.id} value={h.id}>{h.name} — {h.location}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>{t('guestName')} *</label>
            <input className={inputCls} value={form.guestName}
              onChange={e => setForm(f => ({ ...f, guestName: e.target.value }))} required />
          </div>
          <div>
            <label className={labelCls}>{t('phone')} *</label>
            <input className={inputCls} value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} required />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Nombre de personnes</label>
            <input type="number" min="1" className={inputCls} placeholder="—"
              value={form.persons}
              onChange={e => setForm(f => ({ ...f, persons: e.target.value }))} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>{t('checkIn')} *</label>
            <input
              type="date"
              className={`${inputCls} ${isBlocked ? 'border-red-400 focus:border-red-400 focus:ring-red-200' : ''}`}
              value={form.checkIn}
              onChange={e => { priceAutoRef.current = true; setForm(f => ({ ...f, checkIn: e.target.value })); }}
              required
            />
          </div>
          <div>
            <label className={labelCls}>{t('checkOut')} *</label>
            <input
              type="date"
              className={`${inputCls} ${isBlocked ? 'border-red-400 focus:border-red-400 focus:ring-red-200' : ''}`}
              value={form.checkOut}
              onChange={e => setForm(f => ({ ...f, checkOut: e.target.value }))}
              required
            />
          </div>
        </div>

        {/* Availability / date validation banner */}
        {form.houseId && form.checkIn && form.checkOut && (
          <div className={`flex items-start gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all ${
            isInvalidDates                ? 'bg-red-50 text-red-700 border border-red-200' :
            availability === 'checking'  ? 'bg-gray-50 text-slate' :
            availability === 'available' ? 'bg-green-50 text-green-700' :
            isBlocked                    ? 'bg-red-50 text-red-700 border border-red-200' :
            'hidden'
          }`}>
            {isInvalidDates && (
              <><AlertTriangle size={15} className="mt-0.5 shrink-0" /><span>La date de départ doit être après la date d'arrivée.</span></>
            )}
            {!isInvalidDates && availability === 'checking' && (
              <><Loader size={15} className="animate-spin mt-0.5 shrink-0" /><span>Vérification des disponibilités…</span></>
            )}
            {!isInvalidDates && availability === 'available' && (
              <><CheckCircle size={15} className="mt-0.5 shrink-0" /><span>Disponible — {nights} nuit{nights > 1 ? 's' : ''} × {monthPrice} DT{hasMonthOverride ? ` (tarif ${new Date(form.checkIn).toLocaleString('fr', { month: 'long' })})` : ''}</span></>
            )}
            {!isInvalidDates && isBlocked && (
              <><AlertTriangle size={15} className="mt-0.5 shrink-0" />
              <span>
                Déjà réservé par <strong>{availability.guestName}</strong> du{' '}
                {new Date(availability.checkIn).toLocaleDateString('fr-TN', { day: '2-digit', month: '2-digit', year: 'numeric' })}{' '}
                au {new Date(availability.checkOut).toLocaleDateString('fr-TN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
              </span></>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>{t('totalAmount')} (DT) *</label>
            <input type="number" min="0" step="0.5" className={inputCls} value={form.totalAmount}
              onChange={e => { priceAutoRef.current = false; setForm(f => ({ ...f, totalAmount: e.target.value })); }}
              required />
          </div>
          <div>
            <label className={labelCls}>{t('amountPaid')} (DT)</label>
            <input type="number" min="0" step="0.5" className={inputCls} value={form.amountPaid}
              onChange={e => setForm(f => ({ ...f, amountPaid: e.target.value }))} />
          </div>
        </div>

        <div>
          <label className={labelCls}>{t('status')}</label>
          <select className={inputCls} value={form.status}
            onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
            <option value="confirmed">{t('confirmed')}</option>
            <option value="pending">{t('pending')}</option>
            <option value="cancelled">{t('cancelled')}</option>
          </select>
        </div>

        <div>
          <label className={labelCls}>{t('notes')}</label>
          <textarea className={inputCls} rows={2} value={form.notes}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading || isBlocked || isInvalidDates || availability === 'checking'}
            className="flex-1 py-3 bg-navy text-white rounded-xl font-medium hover:bg-[#152f4a] transition active:scale-[0.97] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? '...' : t('save')}
          </button>
          <button type="button" onClick={onClose}
            className="flex-1 py-3 bg-gray-100 text-slate rounded-xl font-medium hover:bg-gray-200 transition active:scale-[0.97]">
            {t('cancel')}
          </button>
        </div>
      </form>
    </Modal>
  );
}

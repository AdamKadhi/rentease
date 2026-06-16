import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { useSocketEvent } from '../hooks/useSocketEvent';
import { motion } from 'framer-motion';
import { BookOpen, Pencil, Trash2, Phone, Plus, MapPin, Users, Search, X } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import api from '../api/axios';
import StatusBadge from '../components/StatusBadge';
import BookingModal from '../components/BookingModal';
import ConfirmModal from '../components/ConfirmModal';

export default function BookingsPage() {
  const { t } = useTranslation();
  const location = useLocation();
  const [bookings, setBookings] = useState([]);
  const [houses, setHouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterHouse, setFilterHouse] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [editBooking, setEditBooking] = useState(null);
  const [deleteBooking, setDeleteBooking] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchBookings = useCallback(() => {
    const params = {};
    if (filterHouse) params.houseId = filterHouse;
    if (filterStatus) params.status = filterStatus;
    setLoading(true);
    api.get('/bookings', { params }).then(r => {
      setBookings(r.data);
      const editId = location.state?.editId;
      if (editId) {
        const target = r.data.find(b => b.id === editId);
        if (target) setEditBooking(target);
        window.history.replaceState({}, '');
      }
    }).finally(() => setLoading(false));
  }, [filterHouse, filterStatus]);

  useEffect(() => {
    api.get('/houses').then(r => setHouses(r.data));
  }, []);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  useSocketEvent({
    'booking:created': fetchBookings,
    'booking:updated': fetchBookings,
    'booking:deleted': fetchBookings,
  });

  async function handleDelete() {
    setDeleting(true);
    try {
      await api.delete(`/bookings/${deleteBooking.id}`);
      toast.success(t('bookingDeleted'));
      setDeleteBooking(null);
      fetchBookings();
    } catch {
      toast.error(t('error'));
    } finally {
      setDeleting(false);
    }
  }

  const q = search.trim().toLowerCase();
  const filtered = q
    ? bookings.filter(b =>
        b.guestName.toLowerCase().includes(q) ||
        (b.phone && b.phone.toLowerCase().includes(q))
      )
    : bookings;

  const selectCls = "px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold";

  return (
    <div className="p-4 lg:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h1 className="font-playfair text-2xl font-bold text-ink">{t('bookings')}</h1>
        <button onClick={() => setShowAdd(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} />
          <span className="hidden sm:inline">{t('newBooking')}</span>
        </button>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-2 mb-5">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher par nom ou téléphone…"
            className="w-full pl-9 pr-9 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink transition">
              <X size={14} />
            </button>
          )}
        </div>
        <div className="flex gap-2 shrink-0">
          <select className={selectCls} value={filterHouse} onChange={e => setFilterHouse(e.target.value)}>
            <option value="">{t('allHouses')}</option>
            {houses.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
          </select>
          <select className={selectCls} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">{t('allStatuses')}</option>
            <option value="confirmed">{t('confirmed')}</option>
            <option value="pending">{t('pending')}</option>
            <option value="cancelled">{t('cancelled')}</option>
          </select>
        </div>
      </div>

      {/* Skeleton */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-2xl p-4 animate-pulse h-24">
              <div className="h-4 bg-gray-100 rounded w-1/3 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && filtered.length === 0 && (
        <div className="text-center py-20">
          <BookOpen size={48} className="mx-auto text-gray-200 mb-4" />
          <p className="text-muted">{q ? 'Aucun résultat trouvé.' : t('noBookings')}</p>
        </div>
      )}

      {/* Cards */}
      {!loading && filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {filtered.map((booking, i) => {
            const nights = Math.round((new Date(booking.checkOut) - new Date(booking.checkIn)) / 86400000);
            const remaining = booking.totalAmount - booking.amountPaid;
            return (
              <motion.div
                key={booking.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100"
              >
                {/* Photo on top */}
                {booking.house.photoUrl ? (
                  <div className="relative h-32">
                    <img src={booking.house.photoUrl} alt="" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                    <div className="absolute bottom-2 left-3">
                      <p className="text-white text-sm font-semibold leading-tight">{booking.house.name}</p>
                      <p className="flex items-center gap-1 text-white/70 text-xs">
                        <MapPin size={10} />{booking.house.location}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="h-2 w-full" style={{ background: booking.house.color }} />
                )}

                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-ink text-sm">{booking.guestName}</p>
                        {booking.phone && (
                          <span className="flex items-center gap-1 text-muted text-xs">
                            <Phone size={10} />{booking.phone}
                          </span>
                        )}
                        {booking.persons && (
                          <span className="flex items-center gap-1 text-muted text-xs">
                            <Users size={10} />{booking.persons}
                          </span>
                        )}
                      </div>
                    </div>
                    <StatusBadge status={booking.status} />
                  </div>

                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
                      <span>{format(new Date(booking.checkIn), 'dd/MM/yyyy')} → {format(new Date(booking.checkOut), 'dd/MM/yyyy')}</span>
                      <span>{nights} {t('nights')}</span>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => setEditBooking(booking)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 transition text-muted">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => setDeleteBooking(booking)}
                        className="p-1.5 rounded-lg hover:bg-red-50 transition text-muted hover:text-red-500">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-full bg-gold rounded-full transition-all"
                        style={{ width: `${Math.min(100, (booking.amountPaid / booking.totalAmount) * 100)}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-ink shrink-0">
                      {booking.amountPaid} / {booking.totalAmount} DT
                    </span>
                  </div>

                  <div className="flex items-center justify-between mt-1 gap-2">
                    {remaining > 0 && booking.status !== 'cancelled' ? (
                      <p className="text-xs text-amber-600">{t('remaining')}: {remaining} DT</p>
                    ) : <span />}
                    {booking.createdAt && (
                      <p className="text-[10px] text-muted/50 shrink-0">
                        {format(new Date(booking.createdAt), 'dd/MM HH:mm')}
                      </p>
                    )}
                  </div>
                  {booking.notes && (
                    <p className="text-xs text-muted/70 mt-1 italic truncate">{booking.notes}</p>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {showAdd && (
        <BookingModal onClose={() => setShowAdd(false)} onSaved={() => { setShowAdd(false); fetchBookings(); }} />
      )}
      {editBooking && (
        <BookingModal
          booking={editBooking}
          onClose={() => setEditBooking(null)}
          onSaved={() => { setEditBooking(null); fetchBookings(); }}
        />
      )}
      {deleteBooking && (
        <ConfirmModal
          message={t('confirmDeleteBooking')}
          onConfirm={handleDelete}
          onCancel={() => setDeleteBooking(null)}
          loading={deleting}
        />
      )}
    </div>
  );
}

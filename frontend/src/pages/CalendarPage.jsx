import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight, Phone, Pencil, Plus } from 'lucide-react';
import {
  format, getDaysInMonth, startOfMonth, getDay,
  addMonths, subMonths,
} from 'date-fns';
import { fr, ar } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/axios';
import Modal from '../components/Modal';
import BookingModal from '../components/BookingModal';
import { useSocketEvent } from '../hooks/useSocketEvent';
import StatusBadge from '../components/StatusBadge';

export default function CalendarPage() {
  const { t, i18n } = useTranslation();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [bookings, setBookings]       = useState([]);
  const [houses, setHouses]           = useState([]);
  const [filterHouse, setFilterHouse] = useState('');
  const [selectedDay, setSelectedDay]         = useState(null); // day number
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [editBooking, setEditBooking]         = useState(null);
  const [addFromDay, setAddFromDay]           = useState(null); // date string for pre-filled booking
  const [direction, setDirection]     = useState(1); // 1=forward, -1=backward
  const isRtl  = i18n.language === 'ar';
  const locale = i18n.language === 'ar' ? ar : fr;

  useEffect(() => {
    api.get('/houses').then(r => setHouses(r.data));
  }, []);

  function fetchCalendar() {
    const m = currentDate.getMonth() + 1;
    const y = currentDate.getFullYear();
    api.get(`/bookings/calendar?month=${m}&year=${y}`).then(r => setBookings(r.data));
  }

  useEffect(() => { fetchCalendar(); }, [currentDate]);

  useSocketEvent({
    'booking:created': fetchCalendar,
    'booking:updated': fetchCalendar,
    'booking:deleted': fetchCalendar,
  });

  function goBack() {
    setDirection(-1);
    setCurrentDate(d => subMonths(d, 1));
  }
  function goForward() {
    setDirection(1);
    setCurrentDate(d => addMonths(d, 1));
  }

  const filtered = filterHouse ? bookings.filter(b => b.houseId === filterHouse) : bookings;

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay    = (getDay(startOfMonth(currentDate)) + 6) % 7; // Mon = 0
  const cells       = Array.from({ length: firstDay + daysInMonth }, (_, i) =>
    i < firstDay ? null : i - firstDay + 1
  );

  function getBookingsForDay(day) {
    const d = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    return filtered.filter(b => {
      const ci = new Date(b.checkIn);
      const co = new Date(b.checkOut);
      return d >= ci && d < co;
    });
  }

  const dayNames = isRtl
    ? ['ن', 'ث', 'ر', 'خ', 'ج', 'س', 'ح']
    : ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  const todayNum = new Date().getDate();
  const isCurrentMonth =
    new Date().getMonth() === currentDate.getMonth() &&
    new Date().getFullYear() === currentDate.getFullYear();

  const slideVariants = {
    enter:  (d) => ({ x: d > 0 ? 40 : -40, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit:   (d) => ({ x: d > 0 ? -40 : 40, opacity: 0 }),
  };

  return (
    <div className="p-4 lg:p-8 space-y-5">

      {/* ── Header: title only ── */}
      <h1 className="font-playfair text-3xl font-bold text-ink">{t('calendar')}</h1>

      {/* ── Property color chips (clickable filter) ── */}
      {houses.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none" style={{ WebkitOverflowScrolling: 'touch' }}>
          {/* All chip */}
          <button
            onClick={() => setFilterHouse('')}
            className={`shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium transition-all border ${
              filterHouse === ''
                ? 'bg-obsidian text-white border-transparent shadow-sm scale-105'
                : 'border-border text-ink hover:border-muted/40 bg-cream'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full shrink-0 bg-muted/40" />
            Tout
          </button>

          {houses.map(h => (
            <button
              key={h.id}
              onClick={() => setFilterHouse(f => f === h.id ? '' : h.id)}
              className={`shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium transition-all border ${
                filterHouse === h.id
                  ? 'text-white border-transparent shadow-sm scale-105'
                  : 'border-border text-ink hover:border-gold/40 bg-cream'
              }`}
              style={filterHouse === h.id ? { background: h.color } : {}}
            >
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: h.color }} />
              {h.name}
            </button>
          ))}
        </div>
      )}

      {/* ── Calendar grid ── */}
      <div className="card overflow-hidden">
        {/* Month header */}
        <div className="bg-sidebar-grad px-6 py-4 flex items-center justify-between">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.h2
              key={currentDate.toISOString()}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.22, ease: 'easeInOut' }}
              className="font-playfair text-lg font-bold text-white capitalize"
            >
              {format(currentDate, 'MMMM yyyy', { locale })}
            </motion.h2>
          </AnimatePresence>
          {/* Month navigation */}
          <div className="flex items-center rounded-xl overflow-hidden border border-white/15">
            <button
              onClick={isRtl ? goForward : goBack}
              className="px-3 py-2 text-white/70 hover:text-white hover:bg-white/10 transition"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => { setDirection(0); setCurrentDate(new Date()); }}
              className="px-3 py-1.5 text-xs font-semibold text-gold hover:bg-white/10 transition border-x border-white/15"
            >
              Auj.
            </button>
            <button
              onClick={isRtl ? goBack : goForward}
              className="px-3 py-2 text-white/70 hover:text-white hover:bg-white/10 transition"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Day name header */}
        <div className="grid grid-cols-7 bg-obsidian/5 border-b border-border">
          {dayNames.map(d => (
            <div key={d} className="py-2.5 text-center text-[11px] font-bold text-muted uppercase tracking-wider">
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentDate.toISOString()}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            className="grid grid-cols-7"
          >
            {cells.map((day, idx) => {
              const dayBookings = day ? getBookingsForDay(day) : [];
              const today = isCurrentMonth && day === todayNum;
              const isWeekend = (idx % 7) === 5 || (idx % 7) === 6;

              return (
                <div
                  key={idx}
                  onClick={() => day && setSelectedDay(day)}
                  className={`min-h-[80px] sm:min-h-[90px] p-1.5 border-b border-r border-border/60 last:border-r-0 transition-colors
                    ${!day ? 'bg-parchment/40' : 'cursor-pointer'}
                    ${day && !isWeekend ? 'bg-cream hover:bg-gold/5' : ''}
                    ${day && isWeekend ? 'bg-parchment/60 hover:bg-gold/5' : ''}
                    ${today ? 'ring-1 ring-inset ring-gold/40' : ''}`}
                >
                  {day && (
                    <>
                      {/* Day number */}
                      <div className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold mb-1 transition-all
                        ${today
                          ? 'bg-gold-grad text-white shadow-sm'
                          : 'text-ink/70'}`}
                      >
                        {day}
                      </div>

                      {/* Booking pills — visual only, cell click handles opening */}
                      <div className="space-y-0.5">
                        {dayBookings.slice(0, 2).map(b => (
                          <div
                            key={b.id}
                            className="w-full px-1.5 py-0.5 rounded-md text-white text-[9px] sm:text-[10px] font-medium truncate leading-4 shadow-sm pointer-events-none"
                            style={{
                              background: b.house.color,
                              opacity: b.status === 'pending' ? 0.7 : 1,
                            }}
                          >
                            <span className="hidden sm:inline">{b.guestName}</span>
                            <span className="sm:hidden">{b.guestName.split(' ')[0]}</span>
                          </div>
                        ))}
                        {dayBookings.length > 2 && (
                          <div className="text-[9px] text-muted font-semibold px-1.5 pointer-events-none">
                            +{dayBookings.length - 2} autre{dayBookings.length - 2 > 1 ? 's' : ''}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>


      {/* ── Day view modal ── */}
      {selectedDay && !selectedBooking && (() => {
        const dayBookings = getBookingsForDay(selectedDay);
        const dayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), selectedDay);
        return (
          <Modal
            title={format(dayDate, 'EEEE dd MMMM yyyy', { locale })}
            onClose={() => setSelectedDay(null)}
            size="sm"
          >
            <div className="p-4 space-y-3">
              {/* Add reservation button */}
              <button
                onClick={() => {
                  setSelectedDay(null);
                  setAddFromDay(format(dayDate, 'yyyy-MM-dd'));
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-gold/40 text-gold text-sm font-semibold hover:bg-gold/5 hover:border-gold transition"
              >
                <Plus size={16} />
                Ajouter une réservation
              </button>

              {dayBookings.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted text-sm">Aucune réservation ce jour.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-muted font-semibold uppercase tracking-wide">
                    {dayBookings.length} réservation{dayBookings.length > 1 ? 's' : ''}
                  </p>
                  {dayBookings.map(b => {
                    const nights = Math.round((new Date(b.checkOut) - new Date(b.checkIn)) / 86400000);
                    return (
                      <button
                        key={b.id}
                        onClick={() => { setSelectedDay(null); setSelectedBooking(b); }}
                        className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-parchment border border-border transition text-left group"
                      >
                        <div className="w-3 h-10 rounded-full shrink-0" style={{ background: b.house.color }} />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-ink text-sm truncate">{b.guestName}</p>
                          <p className="text-xs text-muted truncate">{b.house.name}</p>
                          <p className="text-xs text-muted/60 mt-0.5">
                            {format(new Date(b.checkIn), 'dd/MM')} → {format(new Date(b.checkOut), 'dd/MM')} · {nights} nuit{nights > 1 ? 's' : ''}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                          <StatusBadge status={b.status} />
                          <span className="text-xs font-semibold text-gold">{b.totalAmount} DT</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </Modal>
        );
      })()}

      {/* ── Booking detail modal ── */}
      {selectedBooking && (
        <Modal title={t('bookingDetails')} onClose={() => setSelectedBooking(null)} size="sm">
          <div className="p-5 space-y-4">
            {/* Property header */}
            <div className="flex items-center gap-3 p-3 rounded-xl"
              style={{ background: selectedBooking.house.color + '18', border: `1px solid ${selectedBooking.house.color}33` }}>
              <div className="w-4 h-4 rounded-full shrink-0" style={{ background: selectedBooking.house.color }} />
              <span className="font-semibold text-ink text-sm">{selectedBooking.house.name}</span>
              <div className="ml-auto"><StatusBadge status={selectedBooking.status} /></div>
            </div>

            {/* Guest */}
            <div>
              <p className="text-xl font-playfair font-bold text-ink">{selectedBooking.guestName}</p>
              {selectedBooking.phone && (
                <div className="flex items-center gap-1.5 text-muted text-sm mt-1">
                  <Phone size={13} />
                  {selectedBooking.phone}
                </div>
              )}
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-parchment rounded-xl p-3 border border-border">
                <p className="text-[11px] font-bold text-muted uppercase tracking-wide mb-1">{t('checkIn')}</p>
                <p className="font-bold text-ink">{format(new Date(selectedBooking.checkIn), 'dd/MM/yyyy')}</p>
              </div>
              <div className="bg-parchment rounded-xl p-3 border border-border">
                <p className="text-[11px] font-bold text-muted uppercase tracking-wide mb-1">{t('checkOut')}</p>
                <p className="font-bold text-ink">{format(new Date(selectedBooking.checkOut), 'dd/MM/yyyy')}</p>
              </div>
            </div>

            {/* Payment */}
            <div className="bg-parchment rounded-xl p-4 border border-border space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted">{t('totalAmount')}</span>
                <span className="font-bold text-ink">{selectedBooking.totalAmount} DT</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted">{t('amountPaid')}</span>
                <span className="font-bold text-emerald-600">{selectedBooking.amountPaid} DT</span>
              </div>
              {selectedBooking.totalAmount - selectedBooking.amountPaid > 0 && (
                <div className="flex justify-between text-sm border-t border-border pt-2">
                  <span className="text-muted">{t('remaining')}</span>
                  <span className="font-bold text-amber-600">
                    {selectedBooking.totalAmount - selectedBooking.amountPaid} DT
                  </span>
                </div>
              )}
              {/* Progress bar */}
              <div className="h-1.5 bg-border rounded-full overflow-hidden mt-1">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-gold to-gold-light transition-all"
                  style={{ width: `${Math.min(100, (selectedBooking.amountPaid / selectedBooking.totalAmount) * 100)}%` }}
                />
              </div>
            </div>

            {selectedBooking.notes && (
              <div className="text-sm text-muted bg-parchment rounded-xl p-3 border border-border italic">
                "{selectedBooking.notes}"
              </div>
            )}

            <button
              onClick={() => {
                setSelectedBooking(null);
                setEditBooking(selectedBooking);
              }}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              <Pencil size={15} />
              Modifier la réservation
            </button>
          </div>
        </Modal>
      )}
      {/* ── Edit booking modal (opened from day detail) ── */}
      {editBooking && (
        <BookingModal
          booking={editBooking}
          onClose={() => setEditBooking(null)}
          onSaved={() => { setEditBooking(null); fetchCalendar(); }}
        />
      )}

      {/* ── Add booking modal (pre-filled with clicked day) ── */}
      {addFromDay && (
        <BookingModal
          initialValues={{ checkIn: addFromDay }}
          onClose={() => setAddFromDay(null)}
          onSaved={() => { setAddFromDay(null); fetchCalendar(); }}
        />
      )}
    </div>
  );
}

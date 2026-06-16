import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { differenceInDays, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  MapPin, Bed, ChevronLeft, ChevronRight, X,
  CheckCircle, AlertTriangle, Loader, Users,
  CalendarDays, Phone, User, ArrowLeft,
  Wifi, Wind, WashingMachine, Car, Waves,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { connectPublicSocket } from '../../lib/publicSocket';

const MONTH_LABELS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

function PhotoGallery({ photos, onClose, startIdx = 0 }) {
  const [idx, setIdx] = useState(startIdx);
  const prev = () => setIdx(i => (i - 1 + photos.length) % photos.length);
  const next = () => setIdx(i => (i + 1) % photos.length);

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
      onClick={onClose}
    >
      <button onClick={e => { e.stopPropagation(); onClose(); }}
        className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition">
        <X size={20} />
      </button>
      {photos.length > 1 && <>
        <button onClick={e => { e.stopPropagation(); prev(); }}
          className="absolute left-4 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition">
          <ChevronLeft size={24} />
        </button>
        <button onClick={e => { e.stopPropagation(); next(); }}
          className="absolute right-4 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition">
          <ChevronRight size={24} />
        </button>
      </>}
      <AnimatePresence mode="wait">
        <motion.img
          key={idx} src={photos[idx]}
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.2 }}
          className="max-h-[88vh] max-w-[90vw] object-contain rounded-2xl"
          onClick={e => e.stopPropagation()}
        />
      </AnimatePresence>
      {photos.length > 1 && (
        <div className="absolute bottom-5 flex gap-2">
          {photos.map((_, i) => (
            <button key={i} onClick={e => { e.stopPropagation(); setIdx(i); }}
              className={`w-2 h-2 rounded-full transition-all ${i === idx ? 'bg-white scale-125' : 'bg-white/40'}`}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}

export default function ClientPropertyPage() {
  const { houseId } = useParams();
  const navigate = useNavigate();
  const [house, setHouse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryStart, setGalleryStart] = useState(0);
  const [activePhoto, setActivePhoto] = useState(0);

  // Booking form
  const [form, setForm] = useState({ checkIn: '', checkOut: '', guestName: '', phone: '', persons: '', notes: '' });
  const [availability, setAvailability] = useState(null);
  const [monthPrice, setMonthPrice] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(null);

  useEffect(() => {
    api.get(`/public/site/houses/${houseId}`)
      .then(r => {
        setHouse(r.data);
        const cm = new Date().getMonth() + 1;
        const override = r.data.monthlyPrices?.find(mp => mp.month === cm)?.price;
        setMonthPrice(override ?? r.data.pricePerNight);
      })
      .catch(() => toast.error('Propriété introuvable'))
      .finally(() => setLoading(false));
  }, [houseId]);

  // Update price when month changes
  useEffect(() => {
    if (!house || !form.checkIn) return;
    const month = new Date(form.checkIn).getMonth() + 1;
    const override = house.monthlyPrices?.find(mp => mp.month === month);
    setMonthPrice(override?.price ?? house.pricePerNight);
  }, [form.checkIn, house]);

  // Real-time house updates
  useEffect(() => {
    const socket = connectPublicSocket();

    socket.on('house:updated', updated => {
      if (updated.id !== houseId) return;
      const parsed = { ...updated, photos: Array.isArray(updated.photos) ? updated.photos : JSON.parse(updated.photos || '[]') };
      setHouse(parsed);
      const cm = new Date().getMonth() + 1;
      const override = parsed.monthlyPrices?.find(mp => mp.month === cm)?.price;
      setMonthPrice(override ?? parsed.pricePerNight);
    });
    socket.on('house:deleted', ({ id }) => {
      if (id === houseId) navigate('/');
    });

    return () => {
      socket.off('house:updated');
      socket.off('house:deleted');
    };
  }, [houseId]);

  // Reset availability when dates change (user must re-check)
  useEffect(() => {
    setAvailability(null);
  }, [form.checkIn, form.checkOut]);

  async function handleCheckAvailability() {
    if (!form.checkIn || !form.checkOut) return;
    const nights = differenceInDays(new Date(form.checkOut), new Date(form.checkIn));
    if (nights <= 0) { setAvailability('invalid'); return; }
    setAvailability('checking');
    try {
      const [{ data }] = await Promise.all([
        api.get('/public/availability', { params: { houseId, checkIn: form.checkIn, checkOut: form.checkOut } }),
        new Promise(r => setTimeout(r, 1800)),
      ]);
      setAvailability(data.available ? 'available' : 'blocked');
    } catch { setAvailability(null); }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (availability !== 'available') return;
    setSubmitting(true);
    try {
      const { data } = await api.post('/public/bookings', {
        houseId,
        guestName: form.guestName,
        phone: form.phone,
        checkIn: form.checkIn,
        checkOut: form.checkOut,
        persons: form.persons ? parseInt(form.persons) : null,
        notes: form.notes || undefined,
      });
      setConfirmed(data);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur lors de la réservation');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-obsidian border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!house) return null;

  const photos = Array.isArray(house.photos) && house.photos.length > 0
    ? house.photos : house.photoUrl ? [house.photoUrl] : [];
  const nights = form.checkIn && form.checkOut
    ? Math.max(0, differenceInDays(new Date(form.checkOut), new Date(form.checkIn)))
    : 0;
  const total = nights && monthPrice ? nights * monthPrice : 0;
  const showBookingForm = availability === 'available';

  const inputCls = "w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-ink bg-white focus:outline-none focus:ring-2 focus:ring-obsidian/20 focus:border-obsidian transition";
  const labelCls = "block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5";

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
      {/* Back */}
      <Link to="/"
        className="inline-flex items-center gap-2 text-sm text-muted hover:text-ink transition mb-6">
        <ArrowLeft size={16} /> Toutes les propriétés
      </Link>

      <div className="lg:grid lg:grid-cols-[1fr_380px] lg:gap-10">
        {/* Left: photos + info */}
        <div>
          {/* Photo gallery */}
          {photos.length > 0 ? (
            <div className="space-y-2 mb-8">
              {/* Main photo */}
              <div
                className="relative rounded-3xl overflow-hidden cursor-pointer group"
                style={{ height: 420 }}
                onClick={() => { setGalleryStart(activePhoto); setGalleryOpen(true); }}
              >
                <AnimatePresence mode="wait">
                  <motion.img
                    key={activePhoto}
                    src={photos[activePhoto]}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
                  />
                </AnimatePresence>
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition flex items-center justify-center">
                  <span className="opacity-0 group-hover:opacity-100 transition bg-white/90 text-ink text-xs font-semibold px-3 py-1.5 rounded-full shadow">
                    Voir en grand
                  </span>
                </div>
                {photos.length > 1 && (
                  <>
                    <button onClick={e => { e.stopPropagation(); setActivePhoto(i => (i - 1 + photos.length) % photos.length); }}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow transition">
                      <ChevronLeft size={18} className="text-ink" />
                    </button>
                    <button onClick={e => { e.stopPropagation(); setActivePhoto(i => (i + 1) % photos.length); }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow transition">
                      <ChevronRight size={18} className="text-ink" />
                    </button>
                    <div className="absolute bottom-3 right-3 bg-black/50 text-white text-xs px-2.5 py-1 rounded-full font-medium">
                      {activePhoto + 1} / {photos.length}
                    </div>
                  </>
                )}
              </div>
              {/* Thumbnails */}
              {photos.length > 1 && (
                <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
                  {photos.map((p, i) => (
                    <button key={i} onClick={() => setActivePhoto(i)}
                      className={`shrink-0 w-20 h-16 rounded-xl overflow-hidden border-2 transition-all ${
                        i === activePhoto ? 'border-obsidian scale-105' : 'border-transparent opacity-60 hover:opacity-90'
                      }`}>
                      <img src={p} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-3xl h-64 flex items-center justify-center mb-8 border border-gray-100"
              style={{ background: house.color + '12' }}>
              <Bed size={48} style={{ color: house.color }} />
            </div>
          )}

          {/* Property info */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-3 h-3 rounded-full" style={{ background: house.color }} />
                <span className="text-xs font-semibold text-muted uppercase tracking-wide">Propriété</span>
              </div>
              <h1 className="font-playfair text-3xl font-bold text-ink mb-2">{house.name}</h1>
              <div className="flex items-center gap-1.5 text-muted text-sm">
                <MapPin size={15} /> {house.location}
              </div>
            </div>

            {/* Description */}
            {house.description && (
              <p className="text-muted text-sm leading-relaxed">{house.description}</p>
            )}

            {/* Amenities */}
            {house.amenities?.length > 0 && (() => {
              const ALL_AMENITIES = [
                { id: 'wifi',     label: 'WiFi',           Icon: Wifi },
                { id: 'ac',       label: 'Climatisé',      Icon: Wind },
                { id: 'washer',   label: 'Machine à laver',Icon: WashingMachine },
                { id: 'parking',  label: 'Parking privé',  Icon: Car },
                { id: 'sea_view', label: 'Vue sur mer',    Icon: Waves },
              ];
              const active = ALL_AMENITIES.filter(a => house.amenities.includes(a.id));
              return (
                <div>
                  <h3 className="font-semibold text-ink mb-3 text-sm uppercase tracking-wide text-muted">Ce logement propose</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {active.map(({ id, label, Icon }) => (
                      <div key={id} className="flex items-center gap-3 p-3 rounded-2xl border border-gray-100 bg-gray-50">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                          style={{ background: 'linear-gradient(135deg, #0D1117 0%, #1C2333 100%)' }}>
                          <Icon size={16} className="text-white" />
                        </div>
                        <span className="text-sm font-medium text-ink">{label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Quick stats */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Chambres', value: house.bedrooms, icon: Bed },
                { label: 'Prix de base', value: `${house.pricePerNight} DT`, icon: CalendarDays },
                { label: 'Disponibilité', value: 'Sur demande', icon: CheckCircle },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="bg-gray-50 rounded-2xl p-4 text-center border border-gray-100">
                  <Icon size={18} className="mx-auto mb-1.5 text-muted" />
                  <p className="font-bold text-ink text-sm">{value}</p>
                  <p className="text-[10px] text-muted mt-0.5">{label}</p>
                </div>
              ))}
            </div>

          </div>
        </div>

        {/* Right: Booking widget */}
        <div className="mt-10 lg:mt-0">
          <div className="lg:sticky lg:top-24">
            {confirmed ? (
              /* Success state */
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="rounded-3xl overflow-hidden border border-emerald-200 bg-white shadow-card"
              >
                <div className="bg-emerald-500 px-6 py-8 text-center">
                  <motion.div
                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                    className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4"
                  >
                    <CheckCircle size={32} className="text-white" />
                  </motion.div>
                  <h3 className="font-playfair text-xl font-bold text-white mb-1">Demande envoyée !</h3>
                  <p className="text-emerald-100 text-sm">Votre réservation est en attente de confirmation.</p>
                </div>
                <div className="p-6 space-y-3">
                  <div className="bg-gray-50 rounded-2xl p-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted">Propriété</span>
                      <span className="font-semibold text-ink">{house.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted">Arrivée</span>
                      <span className="font-semibold text-ink">{format(new Date(confirmed.checkIn), 'dd MMM yyyy', { locale: fr })}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted">Départ</span>
                      <span className="font-semibold text-ink">{format(new Date(confirmed.checkOut), 'dd MMM yyyy', { locale: fr })}</span>
                    </div>
                    <div className="flex justify-between border-t border-gray-100 pt-2 mt-2">
                      <span className="text-muted">Total estimé</span>
                      <span className="font-bold text-ink">{confirmed.totalAmount} DT</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted text-center leading-relaxed">
                    Le propriétaire vous contactera pour confirmer votre réservation.
                  </p>
                  <button
                    onClick={() => { setConfirmed(null); setForm({ checkIn: '', checkOut: '', guestName: '', phone: '', persons: '', notes: '' }); setAvailability(null); }}
                    className="w-full py-3 rounded-xl border border-gray-200 text-sm font-medium text-muted hover:bg-gray-50 transition"
                  >
                    Faire une autre réservation
                  </button>
                </div>
              </motion.div>
            ) : (
              /* Booking form */
              <div className="rounded-3xl border border-gray-200 bg-white shadow-card overflow-hidden">
                {/* Widget header */}
                <div className="px-6 py-5 border-b border-gray-100"
                  style={{ background: 'linear-gradient(135deg, #0D1117 0%, #1C2333 100%)' }}>
                  <p className="text-white/60 text-xs font-semibold uppercase tracking-wide mb-1">Prix ce mois-ci</p>
                  <div className="flex items-baseline gap-1 mb-4">
                    <span className="font-playfair text-3xl font-bold text-white">{monthPrice ?? house.pricePerNight}</span>
                    <span className="text-white/60 text-sm">DT / nuit</span>
                  </div>

                  {/* Seasonal prices */}
                  {house.monthlyPrices?.length > 0 && (
                    <div>
                      <p className="text-white/40 text-[10px] font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <CalendarDays size={11} /> Tarifs saisonniers
                      </p>
                      <div className="grid grid-cols-2 gap-1.5">
                        {house.monthlyPrices.map(mp => (
                          <div key={mp.month}
                            className="flex items-center justify-between px-3 py-2 rounded-xl"
                            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.08)' }}>
                            <span className="text-xs text-white/60 font-medium">{MONTH_LABELS[mp.month - 1]}</span>
                            <span className="text-xs font-bold text-gold">{mp.price} DT</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                  {/* Dates */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>Arrivée</label>
                      <input type="date" className={inputCls}
                        min={format(new Date(), 'yyyy-MM-dd')}
                        value={form.checkIn}
                        onChange={e => setForm(f => ({ ...f, checkIn: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Départ</label>
                      <input type="date" className={inputCls}
                        min={form.checkIn || format(new Date(), 'yyyy-MM-dd')}
                        value={form.checkOut}
                        onChange={e => setForm(f => ({ ...f, checkOut: e.target.value }))}
                        required
                      />
                    </div>
                  </div>

                  {/* Availability banner */}
                  <AnimatePresence mode="wait">
                    {availability && (
                      <motion.div
                        key={availability}
                        initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm ${
                          availability === 'checking'  ? 'bg-gray-50 text-muted' :
                          availability === 'available' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          availability === 'blocked'   ? 'bg-red-50 text-red-700 border border-red-200' :
                          availability === 'invalid'   ? 'bg-amber-50 text-amber-700 border border-amber-200' : ''
                        }`}
                      >
                        {availability === 'checking'  && <><Loader size={15} className="animate-spin shrink-0" /><span>Vérification…</span></>}
                        {availability === 'available' && <><CheckCircle size={15} className="shrink-0" /><span>Disponible — <strong>{nights} nuit{nights > 1 ? 's' : ''}</strong> × {monthPrice} DT = <strong>{total} DT</strong></span></>}
                        {availability === 'blocked'   && <><AlertTriangle size={15} className="shrink-0" /><span>Ces dates ne sont pas disponibles.</span></>}
                        {availability === 'invalid'   && <><AlertTriangle size={15} className="shrink-0" /><span>La date de départ doit être après l'arrivée.</span></>}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Guest info — show only when dates are valid */}
                  <AnimatePresence>
                    {showBookingForm && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.22 }}
                        className="overflow-hidden space-y-3"
                      >
                        <div>
                          <label className={labelCls}>Votre nom *</label>
                          <div className="relative">
                            <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                            <input className={`${inputCls} pl-9`} placeholder="Prénom et nom"
                              value={form.guestName}
                              onChange={e => setForm(f => ({ ...f, guestName: e.target.value }))}
                              required />
                          </div>
                        </div>
                        <div>
                          <label className={labelCls}>Téléphone *</label>
                          <div className="relative">
                            <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                            <input className={`${inputCls} pl-9`} placeholder="+216 XX XXX XXX"
                              value={form.phone}
                              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                              required />
                          </div>
                        </div>
                        <div>
                          <label className={labelCls}>Nombre de personnes <span className="normal-case font-normal">(optionnel)</span></label>
                          <div className="relative">
                            <Users size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                            <input type="number" min="1" max="20" placeholder="—" className={`${inputCls} pl-9`}
                              value={form.persons}
                              onChange={e => setForm(f => ({ ...f, persons: e.target.value }))} />
                          </div>
                        </div>
                        <div>
                          <label className={labelCls}>Notes <span className="normal-case font-normal">(optionnel)</span></label>
                          <textarea className={inputCls} rows={2} placeholder="Demandes spéciales…"
                            value={form.notes}
                            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Price summary */}
                  {total > 0 && showBookingForm && (
                    <div className="bg-gray-50 rounded-2xl p-4 space-y-1.5 text-sm border border-gray-100">
                      <div className="flex justify-between text-muted">
                        <span>{monthPrice} DT × {nights} nuit{nights > 1 ? 's' : ''}</span>
                        <span>{total} DT</span>
                      </div>
                      <div className="flex justify-between font-bold text-ink border-t border-gray-200 pt-2 mt-2">
                        <span>Total estimé</span>
                        <span>{total} DT</span>
                      </div>
                    </div>
                  )}

                  {/* Check availability button — shown when not yet confirmed available */}
                  {availability !== 'available' && (
                    <button
                      type="button"
                      disabled={!form.checkIn || !form.checkOut}
                      onClick={handleCheckAvailability}
                      className="relative w-full py-3.5 rounded-xl text-sm font-semibold text-white transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed overflow-hidden"
                      style={{ background: 'linear-gradient(135deg, #C9933A 0%, #E8B96A 100%)' }}
                    >
                      <AnimatePresence mode="wait" initial={false}>
                        {availability === 'checking' ? (
                          <motion.span
                            key="checking"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.18 }}
                            className="flex items-center justify-center gap-2"
                          >
                            <Loader size={15} className="animate-spin" />
                            Vérification en cours…
                          </motion.span>
                        ) : (
                          <motion.span
                            key="idle"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.18 }}
                            className="flex items-center justify-center gap-2"
                          >
                            <CalendarDays size={15} />
                            Vérifier la disponibilité
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </button>
                  )}

                  {/* Submit button — shown only when available */}
                  {availability === 'available' && (
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full py-3.5 rounded-xl text-sm font-semibold text-white transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      style={{ background: 'linear-gradient(135deg, #0D1117 0%, #1C2333 100%)' }}
                    >
                      {submitting
                        ? <><Loader size={15} className="animate-spin" /> Envoi…</>
                        : 'Demander une réservation'
                      }
                    </button>
                  )}

                  <p className="text-[11px] text-muted text-center">
                    Aucun paiement maintenant · Confirmation par appel téléphonique
                  </p>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Photo lightbox */}
      <AnimatePresence>
        {galleryOpen && (
          <PhotoGallery
            photos={photos}
            startIdx={galleryStart}
            onClose={() => setGalleryOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

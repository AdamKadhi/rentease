import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { X, ImagePlus, Plus, ChevronDown, GripVertical, Wifi, Wind, WashingMachine, Car, Waves } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Modal from './Modal';
import api from '../api/axios';

const ALL_COLORS = [
  { label: 'Navy',       value: '#1A3C5E' },
  { label: 'Terracotta', value: '#C96A3B' },
  { label: 'Vert',       value: '#2D7D46' },
  { label: 'Violet',     value: '#6B48B5' },
  { label: 'Rose',       value: '#C2537A' },
  { label: 'Teal',       value: '#2A7D7D' },
  { label: 'Ambre',      value: '#D97706' },
  { label: 'Indigo',     value: '#4338CA' },
  { label: 'Émeraude',   value: '#059669' },
  { label: 'Corail',     value: '#E85D42' },
  { label: 'Ardoise',    value: '#475569' },
  { label: 'Bordeaux',   value: '#881337' },
];

const DEFAULT_COLOR_COUNT = 5;

const ALL_MONTHS_FR = [
  { n: 1, label: 'Janvier' }, { n: 2, label: 'Février' }, { n: 3, label: 'Mars' },
  { n: 4, label: 'Avril' },   { n: 5, label: 'Mai' },     { n: 6, label: 'Juin' },
  { n: 7, label: 'Juillet' }, { n: 8, label: 'Août' },    { n: 9, label: 'Septembre' },
  { n: 10, label: 'Octobre' },{ n: 11, label: 'Novembre' },{ n: 12, label: 'Décembre' },
];
const ALL_MONTHS_AR = [
  { n: 1, label: 'يناير' },   { n: 2, label: 'فبراير' },  { n: 3, label: 'مارس' },
  { n: 4, label: 'أبريل' },   { n: 5, label: 'مايو' },    { n: 6, label: 'يونيو' },
  { n: 7, label: 'يوليو' },   { n: 8, label: 'أغسطس' },   { n: 9, label: 'سبتمبر' },
  { n: 10, label: 'أكتوبر' }, { n: 11, label: 'نوفمبر' }, { n: 12, label: 'ديسمبر' },
];

const DEFAULT_MONTHS = [6, 7, 8, 9];

export default function HouseModal({ house, onClose, onSaved }) {
  const { t, i18n } = useTranslation();
  const fileRef = useRef();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [dragIdx, setDragIdx] = useState(null);

  const allMonths = i18n.language === 'ar' ? ALL_MONTHS_AR : ALL_MONTHS_FR;

  const initMonthly = {};
  const initVisibleMonths = new Set(DEFAULT_MONTHS);
  house?.monthlyPrices?.forEach(mp => {
    initMonthly[mp.month] = mp.price;
    initVisibleMonths.add(mp.month);
  });

  const initVisibleColorValues = new Set(
    ALL_COLORS.slice(0, DEFAULT_COLOR_COUNT).map(c => c.value)
  );
  if (house?.color) initVisibleColorValues.add(house.color);

  const initPhotos = Array.isArray(house?.photos) && house.photos.length > 0
    ? house.photos
    : house?.photoUrl ? [house.photoUrl] : [];

  const currentMonth = new Date().getMonth() + 1;
  const currentMonthPrice = house?.monthlyPrices?.find(mp => mp.month === currentMonth)?.price;

  const [form, setForm] = useState({
    name: house?.name || '',
    location: house?.location || '',
    description: house?.description || '',
    bedrooms: house?.bedrooms || 1,
    pricePerNight: currentMonthPrice ?? house?.pricePerNight ?? '',
    color: house?.color || ALL_COLORS[0].value,
  });
  const [photos, setPhotos] = useState(initPhotos);
  const [amenities, setAmenities] = useState(
    Array.isArray(house?.amenities) ? house.amenities : []
  );
  const [monthlyPrices, setMonthlyPrices] = useState(initMonthly);
  const [visibleMonths, setVisibleMonths] = useState([...initVisibleMonths].sort((a, b) => a - b));
  const [visibleColorValues, setVisibleColorValues] = useState([...initVisibleColorValues]);
  const [takenColors, setTakenColors] = useState(new Set());

  useEffect(() => {
    api.get('/houses').then(r => {
      const used = new Set(
        r.data.filter(h => h.id !== house?.id).map(h => h.color)
      );
      setTakenColors(used);
      if (!house && used.has(form.color)) {
        const free = ALL_COLORS.find(c => !used.has(c.value));
        if (free) setForm(f => ({ ...f, color: free.value }));
      }
    });
  }, []);

  const visibleColors = ALL_COLORS.filter(c => visibleColorValues.includes(c.value));
  const hiddenColors = ALL_COLORS.filter(c => !visibleColorValues.includes(c.value));
  const hiddenMonths = allMonths.filter(m => !visibleMonths.includes(m.n));

  function addMonth(monthNum) {
    setVisibleMonths(prev => [...prev, monthNum].sort((a, b) => a - b));
    setShowMonthPicker(false);
  }
  function removeMonth(monthNum) {
    setVisibleMonths(prev => prev.filter(m => m !== monthNum));
    setMonthlyPrices(prev => { const next = { ...prev }; delete next[monthNum]; return next; });
  }
  function setMonthPrice(month, value) {
    setMonthlyPrices(prev => {
      const next = { ...prev };
      if (value === '') delete next[month];
      else next[month] = parseFloat(value);
      return next;
    });
  }

  // Drag-to-reorder photos
  function handleDragStart(e, idx) {
    setDragIdx(idx);
    e.dataTransfer.effectAllowed = 'move';
  }
  function handleDragOver(e, idx) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragIdx === null || dragIdx === idx) return;
    setPhotos(prev => {
      const next = [...prev];
      const [item] = next.splice(dragIdx, 1);
      next.splice(idx, 0, item);
      return next;
    });
    setDragIdx(idx);
  }
  function handleDragEnd() { setDragIdx(null); }

  async function handleFileChange(e) {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    try {
      const uploaded = [];
      for (const file of files) {
        const fd = new FormData();
        fd.append('photo', file);
        const { data } = await api.post('/upload', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        uploaded.push(data.url);
      }
      setPhotos(prev => [...prev, ...uploaded]);
      toast.success(uploaded.length > 1 ? `${uploaded.length} photos uploadées` : 'Photo uploadée');
    } catch {
      toast.error("Échec de l'upload");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  function removePhoto(idx) {
    setPhotos(prev => prev.filter((_, i) => i !== idx));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (uploading) return toast.error('Upload en cours, veuillez patienter');
    if (!house && photos.length === 0) return toast.error('Au moins une photo est requise');
    if (takenColors.has(form.color)) return toast.error('Cette couleur est déjà utilisée');
    setLoading(true);
    try {
      const payload = {
        ...form,
        bedrooms: parseInt(form.bedrooms),
        pricePerNight: parseFloat(form.pricePerNight),
        description: form.description || null,
        amenities,
        photos,
        photoUrl: photos[0] ?? null,
        monthlyPrices: Object.entries(monthlyPrices)
          .filter(([, p]) => p && !isNaN(p))
          .map(([month, price]) => ({ month: parseInt(month), price })),
      };
      if (house) {
        await api.put(`/houses/${house.id}`, payload);
        toast.success(t('houseUpdated'));
      } else {
        await api.post('/houses', payload);
        toast.success(t('houseCreated'));
      }
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.error || t('error'));
    } finally {
      setLoading(false);
    }
  }

  const inputCls = "w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold transition bg-white";
  const labelCls = "block text-xs font-semibold text-muted/80 mb-1.5 uppercase tracking-wide";

  return (
    <Modal title={house ? t('edit') : t('addHouse')} onClose={onClose} size="lg">
      <form onSubmit={handleSubmit} className="p-5 space-y-5">

        {/* ── Photos ── */}
        <div>
          <label className={labelCls}>
            Photos {!house && <span className="text-red-500">*</span>}
            {photos.length > 0 && (
              <span className="ml-1 normal-case text-muted/50 font-normal">
                ({photos.length}) — glissez pour réorganiser
              </span>
            )}
          </label>
          <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileChange} />

          {photos.length === 0 ? (
            /* Empty state — big upload area */
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="w-full h-24 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center gap-1.5 hover:border-gold hover:bg-gold/5 transition text-muted disabled:opacity-50"
            >
              {uploading
                ? <div className="w-5 h-5 border-2 border-gold border-t-transparent rounded-full animate-spin" />
                : <><ImagePlus size={22} /><span className="text-xs">Importer des photos</span></>
              }
            </button>
          ) : (
            /* Photos grid with draggable thumbnails + inline + button */
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
              <AnimatePresence>
                {photos.map((url, idx) => (
                  <motion.div
                    key={url}
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: idx === dragIdx ? 0.5 : 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.85 }}
                    transition={{ duration: 0.15 }}
                    draggable
                    onDragStart={e => handleDragStart(e, idx)}
                    onDragOver={e => handleDragOver(e, idx)}
                    onDragEnd={handleDragEnd}
                    className="relative rounded-xl overflow-hidden bg-gray-100 group cursor-grab active:cursor-grabbing"
                    style={{ height: 64 }}
                  >
                    <img src={url} alt="" className="w-full h-full object-cover pointer-events-none" />
                    {/* Cover badge */}
                    {idx === 0 && (
                      <span className="absolute top-1 left-1 text-[9px] bg-black/60 text-white px-1 py-0.5 rounded-full font-medium leading-none">
                        Cover
                      </span>
                    )}
                    {/* Drag handle hint */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition flex items-center justify-center">
                      <GripVertical size={16} className="text-white opacity-0 group-hover:opacity-70 transition" />
                    </div>
                    {/* Remove button */}
                    <button
                      type="button"
                      onClick={() => removePhoto(idx)}
                      className="absolute top-1 right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow opacity-0 group-hover:opacity-100 transition hover:bg-red-50 z-10"
                    >
                      <X size={10} className="text-red-500" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Inline + add button */}
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-1 hover:border-gold hover:bg-gold/5 transition text-muted disabled:opacity-50"
                style={{ height: 64 }}
                title="Ajouter des photos"
              >
                {uploading
                  ? <div className="w-4 h-4 border-2 border-gold border-t-transparent rounded-full animate-spin" />
                  : <Plus size={18} />
                }
              </button>
            </div>
          )}
        </div>

        {/* ── Name & Location ── */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>{t('propertyName')} *</label>
            <input className={inputCls} value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
          </div>
          <div>
            <label className={labelCls}>{t('location')} *</label>
            <input className={inputCls} value={form.location}
              onChange={e => setForm(f => ({ ...f, location: e.target.value }))} required />
          </div>
        </div>

        {/* ── Description ── */}
        <div>
          <label className={labelCls}>Description</label>
          <textarea
            className={`${inputCls} resize-none`}
            rows={3}
            placeholder="Décrivez la propriété : équipements, ambiance, points forts…"
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          />
        </div>

        {/* ── Amenities ── */}
        <div>
          <label className={labelCls}>{t('amenities')}</label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'wifi',     labelKey: 'amenity_wifi',     Icon: Wifi },
              { id: 'ac',       labelKey: 'amenity_ac',       Icon: Wind },
              { id: 'washer',   labelKey: 'amenity_washer',   Icon: WashingMachine },
              { id: 'parking',  labelKey: 'amenity_parking',  Icon: Car },
              { id: 'sea_view', labelKey: 'amenity_sea_view', Icon: Waves },
            ].map(({ id, labelKey, Icon }) => {
              const label = t(labelKey);
              const checked = amenities.includes(id);
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setAmenities(prev =>
                    checked ? prev.filter(a => a !== id) : [...prev, id]
                  )}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                    checked
                      ? 'border-gold/50 bg-gold/8 text-ink'
                      : 'border-gray-200 bg-white text-muted hover:border-gold/30'
                  }`}
                >
                  <Icon size={15} className={checked ? 'text-gold' : 'text-muted'} />
                  {label}
                  {checked && (
                    <span className="ml-auto w-4 h-4 rounded-full bg-gold flex items-center justify-center shrink-0">
                      <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                        <path d="M1 4l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Bedrooms & Base price ── */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>{t('bedrooms')} *</label>
            <input type="number" min="1" className={inputCls} value={form.bedrooms}
              onChange={e => setForm(f => ({ ...f, bedrooms: e.target.value }))} required />
          </div>
          <div>
            <label className={labelCls}>{t('pricePerNight')} *</label>
            <input type="number" min="0" step="0.5" className={inputCls} value={form.pricePerNight}
              onChange={e => setForm(f => ({ ...f, pricePerNight: e.target.value }))} required />
          </div>
        </div>

        {/* ── Monthly pricing ── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs font-semibold text-muted/80 uppercase tracking-wide">Prix par mois</p>
              <p className="text-[11px] text-muted/50 mt-0.5">Laissez vide pour utiliser le prix défaut</p>
            </div>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowMonthPicker(v => !v)}
                disabled={hiddenMonths.length === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-parchment hover:bg-border text-ink rounded-lg text-xs font-medium transition disabled:opacity-30"
              >
                <Plus size={13} />
                Ajouter un mois
                {hiddenMonths.length > 0 && <ChevronDown size={12} className={`transition-transform ${showMonthPicker ? 'rotate-180' : ''}`} />}
              </button>
              <AnimatePresence>
                {showMonthPicker && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-1.5 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-10 min-w-[140px]"
                  >
                    {hiddenMonths.map(m => (
                      <button key={m.n} type="button" onClick={() => addMonth(m.n)}
                        className="w-full text-left px-3 py-2 text-sm text-ink hover:bg-parchment transition">
                        {m.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="space-y-2">
            <AnimatePresence initial={false}>
              {visibleMonths.map(monthNum => {
                const monthLabel = allMonths.find(m => m.n === monthNum)?.label ?? monthNum;
                const isSet = monthlyPrices[monthNum] !== undefined;
                return (
                  <motion.div key={monthNum}
                    initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.18 }}
                    className="overflow-hidden"
                  >
                    <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border transition ${isSet ? 'border-gold/40 bg-gold/5' : 'border-gray-200 bg-white'}`}>
                      <span className="text-sm font-medium text-ink w-24 shrink-0">{monthLabel}</span>
                      <div className="flex-1 relative">
                        <input type="number" min="0" step="0.5"
                          placeholder={form.pricePerNight ? `${form.pricePerNight} DT (défaut)` : '—'}
                          value={monthlyPrices[monthNum] ?? ''}
                          onChange={e => setMonthPrice(monthNum, e.target.value)}
                          className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gold bg-white"
                        />
                        {isSet && <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted/50">DT</span>}
                      </div>
                      {/* Reset to default */}
                      {isSet && (
                        <button type="button"
                          title="Réinitialiser au prix par défaut"
                          onClick={() => setMonthlyPrices(prev => { const n = { ...prev }; delete n[monthNum]; return n; })}
                          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-amber-50 text-muted hover:text-amber-500 transition shrink-0">
                          <X size={14} />
                        </button>
                      )}
                      {/* Remove month (non-default months only) */}
                      {!isSet && !DEFAULT_MONTHS.includes(monthNum) && (
                        <button type="button" onClick={() => removeMonth(monthNum)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-muted hover:text-red-400 transition shrink-0">
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>

        {/* ── Color picker ── */}
        <div>
          <label className={labelCls}>{t('color')}</label>
          <div className="flex flex-wrap gap-2 mt-1 items-center">
            <AnimatePresence initial={false}>
              {visibleColors.map(c => {
                const isTaken = takenColors.has(c.value) && form.color !== c.value;
                return (
                  <motion.div key={c.value} className="relative"
                    initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }} transition={{ duration: 0.15 }}
                  >
                    <button type="button" disabled={isTaken}
                      onClick={() => !isTaken && setForm(f => ({ ...f, color: c.value }))}
                      title={isTaken ? `${c.label} — déjà utilisé` : c.label}
                      className={`w-8 h-8 rounded-full border-[3px] transition-transform ${
                        isTaken ? 'opacity-30 cursor-not-allowed border-white'
                          : form.color === c.value ? 'border-gray-800 scale-110'
                          : 'border-white shadow hover:scale-110'
                      }`}
                      style={{ background: c.value }}
                    />
                    {isTaken && (
                      <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <span className="block w-5 h-0.5 bg-white/80 rotate-45 rounded-full" />
                      </span>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {hiddenColors.length > 0 && (
              <div className="relative">
                <button type="button" onClick={() => setShowColorPicker(v => !v)}
                  className="w-8 h-8 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center text-muted/60 hover:border-gold hover:text-gold transition"
                  title="Ajouter une couleur">
                  <Plus size={14} />
                </button>
                <AnimatePresence>
                  {showColorPicker && (
                    <motion.div
                      initial={{ opacity: 0, y: -6, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.96 }} transition={{ duration: 0.15 }}
                      className="absolute left-0 top-full mt-2 bg-white rounded-xl shadow-lg border border-gray-100 p-2 z-10 min-w-[160px]"
                    >
                      <div className="flex flex-col gap-1">
                        {hiddenColors.map(c => {
                          const isTaken = takenColors.has(c.value);
                          return (
                            <button key={c.value} type="button" disabled={isTaken}
                              onClick={() => {
                                if (isTaken) return;
                                setVisibleColorValues(prev => [...prev, c.value]);
                                setForm(f => ({ ...f, color: c.value }));
                                setShowColorPicker(false);
                              }}
                              className={`flex items-center gap-2.5 px-2 py-1.5 rounded-lg transition text-left w-full ${isTaken ? 'opacity-40 cursor-not-allowed' : 'hover:bg-parchment'}`}
                            >
                              <span className="w-5 h-5 rounded-full shrink-0 shadow-sm" style={{ background: c.value }} />
                              <span className="text-sm text-ink flex-1">{c.label}</span>
                              {isTaken && <span className="text-[10px] text-muted/50">utilisé</span>}
                            </button>
                          );
                        })}
                        {hiddenColors.length > 0 && <div className="border-t border-gray-100 my-1" />}
                        <label className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-parchment transition cursor-pointer">
                          <span className="w-5 h-5 rounded-full border-2 border-dashed border-gray-300 shrink-0 overflow-hidden flex items-center justify-center">
                            <Plus size={10} className="text-gray-400" />
                          </span>
                          <span className="text-sm text-ink flex-1">Couleur personnalisée</span>
                          <input type="color" className="w-0 h-0 opacity-0 absolute"
                            onChange={e => {
                              const val = e.target.value;
                              if (takenColors.has(val)) { toast.error('Couleur déjà utilisée'); return; }
                              setVisibleColorValues(prev => prev.includes(val) ? prev : [...prev, val]);
                              setForm(f => ({ ...f, color: val }));
                              setShowColorPicker(false);
                            }}
                          />
                        </label>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3 pt-1">
          <button type="submit" disabled={loading || uploading} className="btn-primary flex-1 py-3">
            {loading ? '...' : t('save')}
          </button>
          <button type="button" onClick={onClose} className="btn-ghost flex-1 py-3">
            {t('cancel')}
          </button>
        </div>
      </form>
    </Modal>
  );
}

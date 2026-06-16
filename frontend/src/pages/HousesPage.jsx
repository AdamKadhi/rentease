import { useState, useEffect, useCallback } from 'react';
import { useSocketEvent } from '../hooks/useSocketEvent';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Pencil, Trash2, Home, MapPin, Bed, ChevronLeft, ChevronRight, X, Images, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import HouseModal from '../components/HouseModal';
import ConfirmModal from '../components/ConfirmModal';

function PhotoGallery({ photos, onClose }) {
  const [idx, setIdx] = useState(0);
  const prev = () => setIdx(i => (i - 1 + photos.length) % photos.length);
  const next = () => setIdx(i => (i + 1) % photos.length);

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center" onClick={onClose}>
      <button onClick={e => { e.stopPropagation(); onClose(); }}
        className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition">
        <X size={20} />
      </button>

      {photos.length > 1 && (
        <>
          <button onClick={e => { e.stopPropagation(); prev(); }}
            className="absolute left-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition">
            <ChevronLeft size={22} />
          </button>
          <button onClick={e => { e.stopPropagation(); next(); }}
            className="absolute right-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition">
            <ChevronRight size={22} />
          </button>
        </>
      )}

      <AnimatePresence mode="wait">
        <motion.img
          key={idx}
          src={photos[idx]}
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.2 }}
          className="max-h-[85vh] max-w-[90vw] object-contain rounded-xl"
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
    </div>
  );
}

export default function HousesPage() {
  const { t } = useTranslation();
  const [houses, setHouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editHouse, setEditHouse] = useState(null);
  const [deleteHouse, setDeleteHouse] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [gallery, setGallery] = useState(null);
  const [search, setSearch] = useState('');

  const fetchHouses = useCallback(() => {
    setLoading(true);
    api.get('/houses').then(r => setHouses(r.data)).finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchHouses(); }, [fetchHouses]);

  useSocketEvent({
    'house:created': fetchHouses,
    'house:updated': fetchHouses,
    'house:deleted': fetchHouses,
  });

  async function handleDelete() {
    setDeleting(true);
    try {
      await api.delete(`/houses/${deleteHouse.id}`);
      toast.success(t('houseDeleted'));
      setDeleteHouse(null);
      fetchHouses();
    } catch {
      toast.error(t('error'));
    } finally {
      setDeleting(false);
    }
  }

  const q = search.trim().toLowerCase();
  const filtered = q
    ? houses.filter(h =>
        h.name.toLowerCase().includes(q) ||
        h.location.toLowerCase().includes(q)
      )
    : houses;

  return (
    <div className="p-4 lg:p-6">
      <div className="flex items-center justify-between mb-5">
        <h1 className="font-playfair text-2xl font-bold text-ink">{t('myHouses')}</h1>
        <button
          onClick={() => setShowAdd(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={16} />
          <span className="hidden sm:inline">{t('addHouse')}</span>
        </button>
      </div>

      {/* Search bar */}
      <div className="relative mb-5">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher par nom ou localisation…"
          className="w-full pl-9 pr-9 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink transition">
            <X size={14} />
          </button>
        )}
      </div>

      {loading && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => (
            <div key={i} className="bg-white rounded-2xl p-5 animate-pulse h-48">
              <div className="h-4 bg-gray-100 rounded w-1/2 mb-3" />
              <div className="h-3 bg-gray-100 rounded w-2/3 mb-6" />
              <div className="h-6 bg-gray-100 rounded w-1/3" />
            </div>
          ))}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="text-center py-20">
          <Home size={48} className="mx-auto text-gray-200 mb-4" />
          <p className="text-muted">{q ? 'Aucun résultat trouvé.' : t('noHouses')}</p>
          {!q && (
            <button onClick={() => setShowAdd(true)} className="btn-primary mt-4">
              {t('addHouse')}
            </button>
          )}
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((house, i) => {
          const housePhotos = Array.isArray(house.photos) && house.photos.length > 0
            ? house.photos
            : house.photoUrl ? [house.photoUrl] : [];

          return (
            <motion.div
              key={house.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100"
            >
              {/* Photo area */}
              {housePhotos.length > 0 ? (
                <div className="relative h-32 cursor-pointer group" onClick={() => setGallery(housePhotos)}>
                  <img src={housePhotos[0]} alt={house.name} className="w-full h-full object-cover" />
                  {housePhotos.length > 1 && (
                    <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/60 text-white text-[10px] px-2 py-1 rounded-full">
                      <Images size={10} />
                      {housePhotos.length}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition flex items-center justify-center">
                    <ChevronLeft size={20} className="text-white opacity-0 group-hover:opacity-100 transition -ml-4" />
                    <ChevronRight size={20} className="text-white opacity-0 group-hover:opacity-100 transition -mr-4" />
                  </div>
                </div>
              ) : (
                <div className="w-full h-32 flex items-center justify-center" style={{ background: house.color + '18' }}>
                  <Home size={36} style={{ color: house.color }} />
                </div>
              )}

              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ background: house.color }} />
                      <h3 className="font-semibold text-ink text-sm">{house.name}</h3>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted mt-1">
                      <MapPin size={11} />
                      {house.location}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => setEditHouse(house)}
                      className="p-1.5 rounded-lg hover:bg-gray-100 transition text-muted">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => setDeleteHouse(house)}
                      className="p-1.5 rounded-lg hover:bg-red-50 transition text-muted hover:text-red-500">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-1 text-xs text-muted">
                    <Bed size={12} />
                    {house.bedrooms} {t('bedrooms')}
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-0.5 text-sm font-bold text-gold">
                      {house.pricePerNight} DT
                      <span className="text-xs font-normal text-muted">{t('perNight')}</span>
                    </div>
                    {house.monthlyPrices?.length > 0 && (
                      <p className="text-[10px] text-muted/60">{house.monthlyPrices.length} tarif(s) saisonnier(s)</p>
                    )}
                  </div>
                </div>

                {house.bookings?.length > 0 && (
                  <div className="mt-2">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-emerald-50 text-emerald-700 border border-emerald-100">
                      {house.bookings.length} {t('activeNow')}
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {gallery && <PhotoGallery photos={gallery} onClose={() => setGallery(null)} />}

      {showAdd && (
        <HouseModal onClose={() => setShowAdd(false)} onSaved={() => { setShowAdd(false); fetchHouses(); }} />
      )}
      {editHouse && (
        <HouseModal house={editHouse} onClose={() => setEditHouse(null)} onSaved={() => { setEditHouse(null); fetchHouses(); }} />
      )}
      {deleteHouse && (
        <ConfirmModal
          message={t('confirmDeleteHouse')}
          onConfirm={handleDelete}
          onCancel={() => setDeleteHouse(null)}
          loading={deleting}
        />
      )}
    </div>
  );
}

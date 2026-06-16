import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Bed, Home, ArrowRight, ChevronDown } from 'lucide-react';
import api from '../../api/axios';
import { connectPublicSocket } from '../../lib/publicSocket';

const MONTH_LABELS = ['Jan','Fév','Mar','Avr','Mai','Juin','Juil','Août','Sep','Oct','Nov','Déc'];

export default function ClientHomePage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const listingsRef = useRef(null);

  useEffect(() => {
    api.get('/public/site/houses')
      .then(r => setData(r.data))
      .catch(() => setError('Espace introuvable.'))
      .finally(() => setLoading(false));
  }, []);

  // Real-time house updates
  useEffect(() => {
    const socket = connectPublicSocket();

    function parsePhotos(h) {
      return { ...h, photos: Array.isArray(h.photos) ? h.photos : JSON.parse(h.photos || '[]') };
    }

    socket.on('house:created', house => {
      setData(prev => prev ? { ...prev, houses: [parsePhotos(house), ...prev.houses] } : prev);
    });
    socket.on('house:updated', house => {
      setData(prev => prev ? {
        ...prev,
        houses: prev.houses.map(h => h.id === house.id ? parsePhotos(house) : h),
      } : prev);
    });
    socket.on('house:deleted', ({ id }) => {
      setData(prev => prev ? { ...prev, houses: prev.houses.filter(h => h.id !== id) } : prev);
    });

    return () => {
      socket.off('house:created');
      socket.off('house:updated');
      socket.off('house:deleted');
    };
  }, []);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center"
      style={{ background: 'linear-gradient(135deg, #0D1117 0%, #1C2333 100%)' }}>
      <div className="w-10 h-10 border-2 border-gold/40 border-t-gold rounded-full animate-spin" />
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-parchment">
      <Home size={48} className="text-gray-200" />
      <p className="text-muted">{error}</p>
    </div>
  );

  if (!data) return null;

  const owner = data.owner ?? { name: 'GesLoc', phone: '' };
  const houses = data.houses ?? [];

  return (
    <div>
      {/* ── Hero ── */}
      <div className="relative overflow-hidden min-h-screen flex flex-col justify-center"
        style={{ background: 'linear-gradient(145deg, #080B10 0%, #111827 40%, #0D1117 100%)' }}>

        {/* Grid texture overlay */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

        {/* Gold orbs */}
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(201,147,58,0.18) 0%, transparent 65%)' }} />
        <div className="absolute bottom-0 -left-24 w-80 h-80 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(201,147,58,0.10) 0%, transparent 70%)' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(201,147,58,0.04) 0%, transparent 60%)' }} />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-28 pb-20 w-full">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>

            {/* Owner badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8"
              style={{ background: 'rgba(201,147,58,0.12)', border: '1px solid rgba(201,147,58,0.25)' }}>
              <div className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
              <span className="text-gold text-xs font-semibold tracking-wide">{owner.name}</span>
            </div>

            {/* Headline */}
            <h1 className="font-playfair text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-[1.1] mb-6 max-w-2xl">
              Trouvez votre<br />
              <span style={{ background: 'linear-gradient(135deg, #C9933A 0%, #E8B96A 50%, #C9933A 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundSize: '200% auto', animation: 'shimmer 3s linear infinite' }}>
                séjour idéal
              </span>
            </h1>

            <p className="text-white/45 text-lg mb-12 max-w-md leading-relaxed">
              {houses.length} propriété{houses.length > 1 ? 's' : ''} disponible{houses.length > 1 ? 's' : ''} à la location — réservez en quelques clics.
            </p>

            {/* Discover button */}
            <motion.button
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.25 }}
              onClick={() => listingsRef.current?.scrollIntoView({ behavior: 'smooth' })}
              className="group inline-flex items-center gap-3 px-8 py-4 rounded-2xl font-semibold text-white transition-all active:scale-[0.97]"
              style={{ background: 'linear-gradient(135deg, #C9933A 0%, #E8B96A 100%)', boxShadow: '0 8px 32px rgba(201,147,58,0.35)' }}
            >
              Découvrir les propriétés
              <ChevronDown size={18} className="transition-transform duration-300 group-hover:translate-y-0.5" />
            </motion.button>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.6 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5"
        >
          <div className="w-px h-8 bg-gradient-to-b from-transparent to-white/20 rounded-full" />
          <div className="w-1 h-1 rounded-full bg-white/25 animate-bounce" />
        </motion.div>
      </div>

      {/* ── Listings ── */}
      <div ref={listingsRef} className="max-w-6xl mx-auto px-4 sm:px-6 py-16 pb-20">
        {houses.length === 0 ? (
          <div className="text-center py-24">
            <Home size={48} className="mx-auto text-gray-200 mb-4" />
            <p className="text-muted">Aucune propriété trouvée.</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="font-playfair text-2xl font-bold text-ink">Nos propriétés</h2>
                <p className="text-muted text-sm mt-0.5">
                  {houses.length} logement{houses.length > 1 ? 's' : ''} disponible{houses.length > 1 ? 's' : ''}
                </p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {houses.map((house, i) => {
                const photos = Array.isArray(house.photos) && house.photos.length > 0
                  ? house.photos : house.photoUrl ? [house.photoUrl] : [];
                const currentMonth = new Date().getMonth() + 1;
                const currentPrice = house.monthlyPrices?.find(mp => mp.month === currentMonth)?.price ?? house.pricePerNight;

                return (
                  <motion.div
                    key={house.id}
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08, duration: 0.45 }}
                  >
                    <Link
                      to={`/property/${house.id}`}
                      className="group block rounded-3xl overflow-hidden bg-white transition-all duration-400"
                      style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06), 0 8px 32px rgba(0,0,0,0.08)' }}
                      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.10), 0 24px 56px rgba(0,0,0,0.14)'}
                      onMouseLeave={e => e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06), 0 8px 32px rgba(0,0,0,0.08)'}
                    >
                      {/* Photo */}
                      <div className="relative overflow-hidden" style={{ height: 240 }}>
                        {photos.length > 0 ? (
                          <img
                            src={photos[0]}
                            alt={house.name}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center"
                            style={{ background: `linear-gradient(135deg, ${house.color}20, ${house.color}40)` }}>
                            <Home size={48} style={{ color: house.color, opacity: 0.5 }} />
                          </div>
                        )}

                        {/* Gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

                        {/* Photo count badge */}
                        {photos.length > 1 && (
                          <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/40 backdrop-blur-sm text-white text-[10px] px-2.5 py-1 rounded-full font-medium border border-white/15">
                            {photos.length} photos
                          </div>
                        )}

                        {/* Property name on image */}
                        <div className="absolute bottom-0 left-0 right-0 p-4">
                          <h3 className="font-playfair text-xl font-bold text-white leading-tight drop-shadow-sm">
                            {house.name}
                          </h3>
                          <div className="flex items-center gap-1.5 text-white/70 text-xs mt-1">
                            <MapPin size={11} className="shrink-0" />
                            {house.location}
                          </div>
                        </div>

                        {/* Price badge */}
                        <div className="absolute top-3 left-3 px-3 py-1.5 rounded-xl font-bold text-sm text-white"
                          style={{ background: 'linear-gradient(135deg, rgba(201,147,58,0.9), rgba(232,185,106,0.9))', backdropFilter: 'blur(8px)' }}>
                          {currentPrice} DT <span className="text-[10px] font-normal opacity-80">/nuit</span>
                        </div>
                      </div>

                      {/* Info bar */}
                      <div className="px-5 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-4 text-xs text-muted">
                          <span className="flex items-center gap-1.5">
                            <Bed size={13} />
                            {house.bedrooms} chambre{house.bedrooms > 1 ? 's' : ''}
                          </span>
                          {house.monthlyPrices?.length > 0 && (
                            <span className="flex items-center gap-1 text-gold font-medium">
                              {house.monthlyPrices.length} tarif{house.monthlyPrices.length > 1 ? 's' : ''} saison.
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-xs font-semibold text-ink group-hover:text-gold transition-colors duration-300">
                          Découvrir <ArrowRight size={13} className="transition-transform duration-300 group-hover:translate-x-0.5" />
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes shimmer {
          0% { background-position: 0% center; }
          100% { background-position: 200% center; }
        }
      `}</style>
    </div>
  );
}

import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Sparkles, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppContext } from '../context/AppContext';

const FALLBACK_SLIDES = [
  {
    _id: "fallback-1",
    title: "Fresh & Organic",
    subtitle: "Farm-to-table goodness delivered to your doorstep.",
    badge: "🌿 SPRING COLLECTION",
    image: "https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=800",
  },
  {
    _id: "fallback-2",
    title: "Weekly Specials",
    subtitle: "Save up to 40% on your favorite organic fruits.",
    badge: "🔥 HOT DEALS",
    image: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=800",
  },
  {
    _id: "fallback-3",
    title: "Premium Quality",
    subtitle: "Handpicked selections from trusted local farms.",
    badge: "⭐ BESTSELLERS",
    image: "https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=800",
  },
];

const GRADIENT_PALETTE = [
  "from-emerald-50 via-green-50 to-lime-50",
  "from-amber-50 via-orange-50 to-yellow-50",
  "from-rose-50 via-pink-50 to-fuchsia-50",
  "from-blue-50 via-indigo-50 to-violet-50"
];

const HeroSlider = () => {
  const { axios } = useContext(AppContext);
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const { data } = await axios.get('/api/content/banners');
        if (data.success && data.banners?.length > 0) {
          setSlides(data.banners);
        } else {
          setSlides(FALLBACK_SLIDES);
        }
      } catch (error) {
        console.error("Error fetching banners:", error);
        setSlides(FALLBACK_SLIDES);
      } finally {
        setLoading(false);
      }
    };
    fetchBanners();
  }, [axios]);

  useEffect(() => {
    if (slides.length <= 1 || isPaused) return;
    const interval = setInterval(() => {
      setDirection(1);
      setCurrent((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
    }, 6000);
    return () => clearInterval(interval);
  }, [slides.length, isPaused]);

  const nextSlide = () => {
    if (slides.length <= 1) return;
    setDirection(1);
    setCurrent(current === slides.length - 1 ? 0 : current + 1);
  };

  const prevSlide = () => {
    if (slides.length <= 1) return;
    setDirection(-1);
    setCurrent(current === 0 ? slides.length - 1 : current - 1);
  };

  const slideVariants = {
    enter: (direction) => ({ x: direction > 0 ? 1000 : -1000, opacity: 0 }),
    center: { zIndex: 1, x: 0, opacity: 1 },
    exit: (direction) => ({ zIndex: 0, x: direction < 0 ? 1000 : -1000, opacity: 0 }),
  };

  if (loading) {
    return (
      <div className="relative w-full h-[500px] md:h-[650px] bg-gradient-to-br from-slate-100 to-slate-200 animate-pulse flex items-center justify-center rounded-b-[3rem] overflow-hidden">
        <motion.div 
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-600 rounded-full"
        />
      </div>
    );
  }

  const activeGradient = GRADIENT_PALETTE[current % GRADIENT_PALETTE.length];
  const activeSlide = slides[current];

  return (
    <div 
      className="relative w-full h-[500px] md:h-[650px] overflow-hidden rounded-b-[2.5rem]"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <AnimatePresence initial={false} custom={direction}>
        <motion.div
          key={current}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ x: { type: "spring", stiffness: 300, damping: 30 }, opacity: { duration: 0.4 } }}
          className={`absolute inset-0 w-full h-full bg-gradient-to-br ${activeGradient}`}
        >
          {/* Animated Background Elements */}
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -mr-48 -mt-48"
          />
          <motion.div 
            animate={{ rotate: -360 }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            className="absolute bottom-0 left-0 w-80 h-80 bg-white/5 rounded-full blur-3xl -ml-40 -mb-40"
          />

          <div className="container mx-auto px-6 md:px-16 h-full flex flex-col md:flex-row items-center justify-between relative z-10">
            
            {/* Text Content */}
            <div className="flex-1 text-center md:text-left mt-16 md:mt-0 max-w-xl">
              <motion.div 
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="inline-flex items-center gap-2 py-2 px-4 rounded-full bg-white/90 backdrop-blur-md text-emerald-700 text-sm font-bold shadow-lg border border-white/50"
              >
                <Sparkles className="w-4 h-4" /> {activeSlide.badge || "FEATURED"}
              </motion.div>
              
              <motion.h1 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-5xl md:text-7xl font-black text-gray-900 leading-tight mt-6 mb-4 tracking-tight"
              >
                {activeSlide.title}
              </motion.h1>
              
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-lg md:text-xl text-gray-700 mb-8 font-medium leading-relaxed"
              >
                {activeSlide.subtitle}
              </motion.p>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start"
              >
                <Link 
                  to="/products"
                  className="group relative inline-flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white px-10 py-4 rounded-full font-bold shadow-xl shadow-emerald-600/30 hover:shadow-emerald-600/50 transition-all hover:scale-105 overflow-hidden"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    Shop Now <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                  </span>
                  <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-0 transition-transform duration-300" />
                </Link>
              </motion.div>
            </div>

            {/* Image */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ delay: 0.3 }}
              className="flex-1 flex justify-center md:justify-end mt-8 md:mt-0 relative"
            >
              <motion.div
                animate={{ y: [0, -20, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              >
                <img 
                  src={activeSlide.image} 
                  alt="Hero Banner" 
                  className="relative w-[280px] md:w-[450px] h-[280px] md:h-[450px] object-cover rounded-full shadow-2xl border-8 border-white/60 backdrop-blur-sm hover:scale-105 transition-transform duration-500" 
                />
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>
      
      {/* Navigation */}
      {slides.length > 1 && (
        <>
          {/* Arrows */}
          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={prevSlide}
            className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-20 bg-white/90 backdrop-blur hover:bg-white text-gray-800 p-3 md:p-4 rounded-full shadow-xl hover:shadow-2xl transition-all"
          >
            <ChevronLeft size={24} />
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={nextSlide}
            className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-20 bg-white/90 backdrop-blur hover:bg-white text-gray-800 p-3 md:p-4 rounded-full shadow-xl hover:shadow-2xl transition-all"
          >
            <ChevronRight size={24} />
          </motion.button>

          {/* Dots */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
            {slides.map((_, index) => (
              <motion.button
                key={index}
                onClick={() => {
                  setDirection(index > current ? 1 : -1);
                  setCurrent(index);
                }}
                className={`rounded-full transition-all ${index === current ? 'bg-emerald-600 w-8' : 'bg-white/50 w-2.5 hover:bg-white/80'} h-2.5`}
                whileHover={{ scale: 1.2 }}
              />
            ))}
          </div>

          {/* Progress Bar */}
          <motion.div 
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 6 }}
            key={`progress-${current}`}
            className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-emerald-600 to-green-600 origin-left"
          />
        </>
      )}
    </div>
  );
};

export default HeroSlider;
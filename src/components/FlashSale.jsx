import React, { useEffect, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const FlashSale = () => {
    const { axios } = useAppContext();
    const [saleData, setSaleData] = useState(null);
    const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });
    const [isVisible, setIsVisible] = useState(false);

    // 🟢 DYNAMIC THEMES: Cycles through vibrant modern gradients
    const themes = [
        "from-emerald-500 via-green-600 to-teal-700",
        "from-orange-500 via-red-500 to-rose-600",
        "from-blue-600 via-indigo-600 to-violet-700",
        "from-amber-400 via-orange-500 to-red-500"
    ];
    const [themeIndex, setThemeIndex] = useState(0);

    // Fetch Data
    useEffect(() => {
        const fetchSale = async () => {
            try {
                const { data } = await axios.get('/api/content/flash-sale');
                if (data.success && data.sale) {
                    setSaleData(data.sale);
                    setIsVisible(data.sale.active !== false); 
                }
            } catch (error) { console.error("Flash Sale Error:", error); }
        };
        fetchSale();
    }, [axios]);

    // Timer Logic
    useEffect(() => {
        if (!saleData || saleData.active === false) {
            setIsVisible(false);
            return;
        }
        
        const targetDate = saleData.endTime || saleData.endDate;
        
        // 🟢 FIX: If no date is set, just show the banner! (No timer)
        if (!targetDate) {
            setIsVisible(true);
            return; 
        }

        const timer = setInterval(() => {
            const now = new Date().getTime();
            const end = new Date(targetDate).getTime();
            
            // 🟢 CRITICAL FIX: If date passed or invalid, hide the banner completely! 
            if (isNaN(end) || end - now <= 0) {
                clearInterval(timer);
                setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
                setIsVisible(false); 
                return;
            }

            const distance = end - now;
            setTimeLeft({
                hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
                seconds: Math.floor((distance % (1000 * 60)) / 1000)
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [saleData]);

    // Dynamic Color Cycling
    useEffect(() => {
        if (!isVisible) return;
        const themeTimer = setInterval(() => {
            setThemeIndex((prev) => (prev + 1) % themes.length);
        }, 5000); 
        return () => clearInterval(themeTimer);
    }, [isVisible]);

    const hasTimer = saleData && (saleData.endTime || saleData.endDate);

    return (
        <AnimatePresence>
            {/* 🟢 FIX: Conditional rendering moved INSIDE AnimatePresence so it fades out smoothly */}
            {isVisible && saleData && saleData.active !== false && (
                <motion.div 
                    initial={{ opacity: 0, y: 20, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, scale: 0.95, height: 0, overflow: 'hidden' }}
                    transition={{ duration: 0.5 }}
                    className="mx-4 md:mx-16 lg:mx-32 mt-12 md:mt-20 relative font-outfit"
                >
                    <div className={`relative bg-gradient-to-r ${themes[themeIndex]} rounded-3xl p-8 md:p-12 overflow-hidden shadow-2xl transition-colors duration-1000 ease-in-out`}>
                        
                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }} className="absolute -top-32 -right-32 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />
                        <motion.div animate={{ rotate: -360 }} transition={{ duration: 15, repeat: Infinity, ease: "linear" }} className="absolute -bottom-32 -left-32 w-80 h-80 bg-black/10 rounded-full blur-3xl pointer-events-none" />

                        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-10">
                            <div className="text-center lg:text-left">
                                <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full mb-4 border border-white/30 shadow-sm">
                                    <Zap className="text-yellow-300 fill-yellow-300 animate-pulse" size={16} />
                                    <span className="text-white font-bold text-xs tracking-widest uppercase">Limited Time Offer</span>
                                </motion.div>

                                <h2 className="text-3xl md:text-5xl font-black text-white mb-3 drop-shadow-md">
                                    {saleData.title || "Special Promotion"}
                                </h2>
                                <p className="text-white/90 text-lg mb-6 font-medium">
                                    {saleData.subtitle || "Exclusive deals on fresh groceries"} 
                                    {saleData.discount && (
                                        <span className="font-black text-yellow-300 bg-black/20 px-3 py-1 rounded-lg ml-3 inline-block transform -rotate-2"> 
                                            {saleData.discount} 
                                        </span>
                                    )}
                                </p>

                                <Link to="/products" className="inline-flex items-center gap-2 bg-white text-slate-900 px-8 py-3.5 rounded-full font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 active:scale-95">
                                    Shop Sale <ArrowRight size={18} />
                                </Link>
                            </div>

                            {hasTimer && (
                                <div className="flex gap-3 md:gap-5 items-center">
                                    {[
                                        { val: timeLeft.hours, label: 'HRS' },
                                        { val: timeLeft.minutes, label: 'MIN' },
                                        { val: timeLeft.seconds, label: 'SEC' }
                                    ].map((time, idx) => (
                                        <div key={idx} className="flex flex-col items-center">
                                            <motion.div 
                                                key={time.val} 
                                                initial={{ scale: 0.8, opacity: 0 }}
                                                animate={{ scale: 1, opacity: 1 }}
                                                transition={{ duration: 0.3 }}
                                                className="w-20 h-24 md:w-24 md:h-28 bg-black/20 backdrop-blur-md rounded-2xl border border-white/20 flex items-center justify-center shadow-inner relative overflow-hidden"
                                            >
                                                <div className="absolute top-0 w-full h-1/2 bg-white/5" />
                                                <span className="text-4xl md:text-5xl font-black text-white font-mono tracking-tighter drop-shadow-lg">
                                                    {String(time.val).padStart(2, '0')}
                                                </span>
                                            </motion.div>
                                            <span className="text-[10px] font-black text-white/70 uppercase tracking-widest mt-3">{time.label}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default FlashSale;
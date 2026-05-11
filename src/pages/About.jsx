import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { 
    ShoppingBasket, 
    CreditCard, 
    Store, 
    Truck, 
    MapPin, 
    Leaf, 
    ArrowRight, 
    ShieldCheck, 
    Zap, 
    Search, 
    ChevronDown 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// 🌿 MANDVI CART GROCERY JOURNEY
const journeySteps = [
    {
        id: 1,
        title: "Browse & Discover",
        description: "Explore our fresh, vibrant catalog of daily essentials, crisp veggies, and premium groceries. Fill your virtual basket in seconds.",
        icon: <ShoppingBasket size={32} className="text-green-600" />,
        color: "bg-green-100",
        shadow: "shadow-green-200",
        role: "USER"
    },
    {
        id: 2,
        title: "Seamless Checkout",
        description: "Lightning-fast, encrypted payments lock in your grocery run. No hidden fees, just straightforward transparent pricing.",
        icon: <CreditCard size={32} className="text-emerald-600" />,
        color: "bg-emerald-100",
        shadow: "shadow-emerald-200",
        role: "USER"
    },
    {
        id: 3,
        title: "Handpicked & Packed",
        description: "Your local Mandvi partner receives the order and handpicks the freshest produce, packing it carefully to preserve quality.",
        icon: <Store size={32} className="text-teal-600" />,
        color: "bg-teal-100",
        shadow: "shadow-teal-200",
        role: "SELLER"
    },
    {
        id: 4,
        title: "Swift Dispatch",
        description: "A nearby delivery valet accepts the pickup. Secure OTP verification ensures the right groceries go to the right rider.",
        icon: <Zap size={32} className="text-lime-600" />,
        color: "bg-lime-100",
        shadow: "shadow-lime-200",
        role: "SELLER & RIDER"
    },
    {
        id: 5,
        title: "Live Tracking",
        description: "Watch your groceries travel to you on a live map. Know exactly when your fresh food will arrive at your doorstep.",
        icon: <MapPin size={32} className="text-green-600" />,
        color: "bg-green-100",
        shadow: "shadow-green-200",
        role: "RIDER & USER"
    },
    {
        id: 6,
        title: "Freshness Delivered",
        description: "Unbox farm-fresh quality. Exchange the final PIN, enjoy your groceries, and leave a review to complete the cycle.",
        icon: <Leaf size={32} className="text-emerald-600" />,
        color: "bg-emerald-100",
        shadow: "shadow-emerald-200",
        role: "USER"
    }
];

const About = () => {
    const navigate = useNavigate();
    const containerRef = useRef(null);
    
    // 🟢 SCROLL TRACKING
    const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start start", "end end"] });
    
    // Parallax & Fade for Hero
    const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
    const heroOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);
    const heroY = useTransform(scrollYProgress, [0, 0.15], [0, -50]);
    const heroScale = useTransform(scrollYProgress, [0, 0.15], [1, 0.95]);

    return (
        <div ref={containerRef} className="min-h-screen bg-white font-outfit overflow-hidden selection:bg-green-200 selection:text-green-900">
            
            {/* 🌿 ORGANIC BACKGROUND BLOBS */}
            <motion.div style={{ y: bgY }} className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-green-50/50 blur-[100px]"></div>
                <div className="absolute bottom-[10%] right-[-5%] w-[40vw] h-[40vw] rounded-full bg-emerald-50/50 blur-[120px]"></div>
            </motion.div>

            {/* 🟢 HERO SECTION: Fresh & Modern */}
            <motion.section 
                style={{ opacity: heroOpacity, y: heroY, scale: heroScale }}
                className="relative w-full min-h-[90vh] flex flex-col items-center justify-center text-center px-4 z-10"
            >
                <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="relative z-10 flex flex-col items-center max-w-5xl mx-auto"
                >
                    <motion.div 
                        whileHover={{ scale: 1.05 }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-50 border border-green-100 text-green-700 mb-8 cursor-pointer shadow-sm"
                    >
                        <Leaf size={16} className="fill-green-600" />
                        <span className="text-sm font-semibold tracking-wide uppercase">Farm Fresh to Your Door</span>
                    </motion.div>

                    <h1 className="text-6xl md:text-8xl font-black text-slate-900 tracking-tight leading-[1.1]">
                        Welcome to <br/>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-500 to-emerald-600">
                            Mandvi Cart
                        </span>
                    </h1>
                    
                    <p className="mt-6 text-lg md:text-2xl text-slate-600 font-medium max-w-2xl mx-auto leading-relaxed">
                        The smartest way to get your daily groceries. Connecting local sellers, lightning-fast riders, and you—in one flawless ecosystem.
                    </p>

                    <motion.button 
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => navigate('/products')}
                        className="mt-10 px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-lg font-bold rounded-2xl shadow-lg shadow-green-200 flex items-center gap-3 hover:shadow-green-300 transition-all"
                    >
                        Start Shopping <ArrowRight size={20} />
                    </motion.button>
                </motion.div>

                {/* Bouncing Scroll Indicator */}
                <motion.div 
                    animate={{ y: [0, 10, 0] }} 
                    transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                    className="absolute bottom-10 flex flex-col items-center gap-2 text-slate-400"
                >
                    <span className="text-xs font-bold tracking-widest uppercase text-slate-400">Discover How It Works</span>
                    <ChevronDown size={24} className="text-green-500" />
                </motion.div>
            </motion.section>

            {/* 🟢 THE JOURNEY (Clean, Organic Timeline) */}
            <section className="relative max-w-5xl mx-auto px-4 py-24 z-10">
                
                {/* Center Progress Line */}
                <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-1 bg-slate-100 md:-translate-x-1/2 rounded-full overflow-hidden">
                    <motion.div 
                        style={{ scaleY: scrollYProgress, transformOrigin: "top" }} 
                        className="w-full h-full bg-gradient-to-b from-green-400 to-emerald-600"
                    ></motion.div>
                </div>

                <div className="space-y-16 md:space-y-32">
                    {journeySteps.map((step, index) => {
                        const isEven = index % 2 === 0;

                        return (
                            <motion.div 
                                key={step.id}
                                initial={{ opacity: 0, y: 50 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-100px" }}
                                transition={{ duration: 0.6, delay: 0.1 }}
                                className={`relative flex flex-col md:flex-row items-center gap-8 md:gap-16 ${isEven ? 'md:flex-row' : 'md:flex-row-reverse'} pl-12 md:pl-0`}
                            >
                                {/* Center Node */}
                                <div className="absolute left-[-11px] md:left-1/2 top-8 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 w-8 h-8 bg-white border-4 border-green-500 rounded-full flex items-center justify-center shadow-lg z-20">
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                </div>

                                <div className="flex-1 hidden md:block"></div>

                                {/* Clean Modern Card */}
                                <div className="flex-1 w-full">
                                    <motion.div 
                                        whileHover={{ y: -5 }}
                                        className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 relative overflow-hidden group hover:border-green-100 transition-colors"
                                    >
                                        <div className="flex flex-col sm:flex-row items-start gap-6 relative z-10">
                                            {/* Soft Icon Box */}
                                            <div className={`shrink-0 w-16 h-16 rounded-2xl ${step.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                                                {step.icon}
                                            </div>

                                            <div>
                                                <div className="flex items-center gap-3 mb-2">
                                                    <span className="text-green-600 font-black text-xl">0{step.id}</span>
                                                    <span className="px-2 py-1 bg-slate-50 text-slate-500 text-[10px] font-bold tracking-widest uppercase rounded-md">
                                                        {step.role}
                                                    </span>
                                                </div>
                                                <h3 className="text-2xl font-bold text-slate-800 mb-3">{step.title}</h3>
                                                <p className="text-slate-500 leading-relaxed">
                                                    {step.description}
                                                </p>
                                            </div>
                                        </div>
                                        
                                        {/* Subtle background decoration */}
                                        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-green-50 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                    </motion.div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </section>

            {/* 🟢 FOOTER CTA: Premium Dark Green Section */}
            <motion.section 
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="py-24 px-4 text-center relative overflow-hidden mt-10 z-10 m-4 md:m-8 rounded-[3rem] bg-slate-900"
            >
                {/* Fresh gradient glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-green-500/20 rounded-full blur-[100px] pointer-events-none"></div>

                <div className="relative z-10 flex flex-col items-center">
                    <ShieldCheck size={64} className="text-green-400 mb-6" />
                    
                    <h2 className="text-4xl md:text-6xl font-black text-white tracking-tight mb-6">
                        Ready for <span className="text-green-400">Freshness?</span>
                    </h2>
                    <p className="text-slate-300 text-lg md:text-xl max-w-2xl mx-auto mb-10 font-light">
                        Join thousands of happy families who trust Mandvi Cart for their daily grocery needs. Fresh produce, fast delivery, zero hassle.
                    </p>
                    
                    <motion.button 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                            window.scrollTo(0,0);
                            navigate('/products');
                        }} 
                        className="px-10 py-5 bg-green-500 hover:bg-green-400 text-slate-900 text-lg font-bold rounded-2xl flex items-center justify-center gap-3 transition-colors shadow-lg shadow-green-500/30"
                    >
                        Shop Groceries Now <ArrowRight size={20} strokeWidth={2.5} />
                    </motion.button>
                </div>
            </motion.section>

        </div>
    );
};

export default About;
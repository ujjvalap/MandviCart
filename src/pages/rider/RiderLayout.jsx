import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { assets } from '../../assets/assets';
import { useAppContext } from '../../context/AppContext';
import { LayoutDashboard, MapPin, Package, Clock, User, LogOut, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Lottie from 'lottie-react';

// 🟢 Import your newly uploaded animation file
import riderLoaderAnimation from '../../assets/rider-loader.json';

const RiderLayout = () => {
    const { logout } = useAppContext();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const location = useLocation();

    // 🟢 ROUTING ANIMATION STATE
    const [isRouting, setIsRouting] = useState(false);

    // Hide Sidebar ONLY on the Active Map page for full immersion
    const isMapPage = location.pathname === '/rider/active';

    // 🟢 ROUTE CHANGE DETECTOR
    // Every time the URL changes (tab switch) or the page reloads, this runs.
    useEffect(() => {
        setIsRouting(true);
        
        // Hide the animation after 1.2 seconds to reveal the page smoothly
        const timer = setTimeout(() => {
            setIsRouting(false);
        }, 1200);

        return () => clearTimeout(timer);
    }, [location.pathname]);

    const navLinks = [
        { name: "Dashboard", path: "/rider/dashboard", icon: <LayoutDashboard size={20} /> },
        { name: "New Jobs", path: "/rider/jobs", icon: <Package size={20} /> },
        { name: "Active Run", path: "/rider/active", icon: <MapPin size={20} /> },
        { name: "Earnings", path: "/rider/history", icon: <Clock size={20} /> },
        { name: "Profile", path: "/rider/profile", icon: <User size={20} /> },
    ];

    return (
        <div className="flex h-screen bg-gray-50 font-outfit relative overflow-hidden">
            
            {/* 🟢 FULL SCREEN LOTTIE ROUTE LOADER */}
            <AnimatePresence>
                {isRouting && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[9999] bg-white/80 backdrop-blur-md flex flex-col items-center justify-center"
                    >
                        {/* The Lottie Animation */}
                        <div className="w-72 h-72 md:w-96 md:h-96 drop-shadow-2xl -mb-8">
                            <Lottie animationData={riderLoaderAnimation} loop={true} />
                        </div>
                        
                        {/* Premium pulsing text */}
                        <div className="flex items-center gap-2 mt-4">
                            <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                            </span>
                            <h2 className="text-sm font-black text-emerald-600 tracking-widest uppercase">
                                Updating Workspace...
                            </h2>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Mobile Header (Only if sidebar hidden) */}
            {!isSidebarOpen && !isMapPage && (
                <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b flex items-center justify-between px-4 z-30">
                    <img src={assets.logo} className="h-6" alt="" />
                    <button onClick={() => setIsSidebarOpen(true)}><Menu size={24} /></button>
                </div>
            )}

            {/* Sidebar */}
            <div className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0 ${isMapPage ? 'lg:hidden' : ''}`}>
                <div className="h-20 flex items-center px-8 border-b border-gray-100 justify-between">
                    <div className="flex items-center gap-2">
                        <img src={assets.logo} className="h-6" alt="" />
                        <span className="text-[10px] bg-black text-white px-2 py-0.5 rounded font-bold">RIDER</span>
                    </div>
                    <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden"><X size={20}/></button>
                </div>

                <nav className="p-4 space-y-2">
                    {navLinks.map(link => (
                        <NavLink 
                            key={link.path} to={link.path}
                            onClick={() => setIsSidebarOpen(false)}
                            className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${isActive ? 'bg-green-600 text-white shadow-lg shadow-green-200' : 'text-gray-500 hover:bg-gray-100'}`}
                        >
                            {link.icon} {link.name}
                        </NavLink>
                    ))}
                </nav>

                <div className="absolute bottom-0 w-full p-4 border-t border-gray-100">
                    <button onClick={logout} className="w-full flex items-center justify-center gap-2 text-red-500 font-bold py-3 hover:bg-red-50 rounded-xl transition-all">
                        <LogOut size={18} /> Logout
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className={`flex-1 overflow-y-auto ${isMapPage ? 'p-0' : 'p-4 lg:p-8 pt-20 lg:pt-8'}`}>
                <Outlet />
            </div>
        </div>
    );
};

export default RiderLayout;
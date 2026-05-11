import React, { useState, useEffect } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { assets } from "../../assets/assets";
import { useAppContext } from "../../context/AppContext";
import { motion, AnimatePresence } from "framer-motion";
import { 
    LayoutDashboard, ShoppingBag, Package, Truck, LogOut, Store, 
    MessageCircle, Layout, Users, Bike, UserCheck, Menu, X, ArrowLeft
} from 'lucide-react';

const AdminLayout = () => {
    const { axios, navigate, setUser, setRole, logout } = useAppContext();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const location = useLocation();

    // Close mobile menu automatically when a route changes
    useEffect(() => {
        setSidebarOpen(false);
    }, [location]);


    const sidebarLinks = [
        { name: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard },
        { name: "Live Orders", path: "/admin/orders", icon: ShoppingBag },
        { name: "Products", path: "/admin/products", icon: Package },
        
        // 🟢 MANAGMENT SECTION
        { name: "Customers", path: "/admin/users", icon: Users },
        { name: "Sellers", path: "/admin/sellers", icon: Store },
        { name: "Riders", path: "/admin/riders", icon: Bike },

        { name: "Site Content", path: "/admin/content", icon: Layout },
        { name: "Support Chat", path: "/admin/chat", icon: MessageCircle },
    ];

    return (
        <div className="flex h-screen bg-slate-50 font-outfit overflow-hidden">
            
            {/* 🟢 MOBILE OVERLAY */}
            <AnimatePresence>
                {sidebarOpen && (
                    <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden" 
                        onClick={() => setSidebarOpen(false)}
                    />
                )}
            </AnimatePresence>

            {/* 🟢 SIDEBAR (Desktop Fixed + Mobile Slide-out) */}
            <div className={`fixed lg:relative top-0 left-0 w-[280px] h-full bg-white border-r border-slate-200 flex flex-col shadow-2xl lg:shadow-none z-50 transition-transform duration-300 ease-in-out lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                
                {/* Sidebar Header */}
                <div className="p-6 border-b border-slate-100 flex flex-col gap-3 shrink-0">
                    <div className="flex items-center justify-between">
                        <img src={assets.logo} alt="MandviCart" className="w-32 object-contain" />
                        <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-slate-800 bg-slate-50 p-1.5 rounded-lg border border-slate-200">
                            <X size={16} />
                        </button>
                    </div>
                    <div className="bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 w-fit border border-emerald-100/50">
                        <UserCheck size={12} strokeWidth={3}/>  Admin Panel
                    </div>
                </div>

                {/* Navigation Links */}
                <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto custom-scrollbar">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 mb-3">Management</p>
                    {sidebarLinks.map((item) => (
                        <NavLink 
                            key={item.name} 
                            to={item.path}
                            className={({ isActive }) => `group flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all font-bold text-sm
                            ${isActive ? 'bg-emerald-600 text-white shadow-[0_4px_20px_-5px_rgba(16,185,129,0.5)]' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}
                        >
                            {({ isActive }) => (
                                <>
                                    <item.icon size={18} className={`transition-transform duration-300 ${isActive ? 'scale-110 text-white' : 'group-hover:scale-110 group-hover:text-emerald-500'}`} /> 
                                    {item.name}
                                </>
                            )}
                        </NavLink>
                    ))}
                </nav>

                {/* Sidebar Footer Actions */}
                <div className="p-4 border-t border-slate-100 space-y-2 bg-slate-50 shrink-0">
                    <button onClick={() => navigate('/home')} className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-slate-500 hover:bg-white border border-transparent hover:border-slate-200 hover:text-slate-800 transition-all shadow-sm text-sm font-bold group">
                        <span className="flex items-center gap-2"><Store size={16} className="text-slate-400 group-hover:text-emerald-500 transition-colors"/> View Storefront</span>
                        <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform"/>
                    </button>
                    <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-rose-500 hover:bg-rose-50 hover:text-rose-600 transition-colors text-sm font-bold">
                        <LogOut size={18} /> Logout Account
                    </button>
                </div>
            </div>

            {/* 🟢 MAIN CONTENT AREA */}
            <div className="flex-1 flex flex-col min-w-0 relative">
                
                {/* Mobile Topbar */}
                <header className="lg:hidden h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-4 z-10 shrink-0 shadow-sm">
                    <div className="flex items-center gap-3">
                        <button onClick={() => setSidebarOpen(true)} className="p-2 bg-slate-50 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors border border-slate-200">
                            <Menu size={20} />
                        </button>
                        <span className="text-sm font-black text-slate-800 uppercase tracking-widest">Admin Portal</span>
                    </div>
                </header>

                {/* Scrollable Outlet Content */}
                <main className="flex-1 overflow-y-auto p-4 md:p-8 relative z-0 custom-scrollbar">
                    <motion.div 
                        initial={{ opacity: 0, y: 15 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        transition={{ duration: 0.3 }}
                        className="w-full max-w-[1600px] mx-auto"
                    >
                        <Outlet />
                    </motion.div>
                </main>
            </div>

        </div>
    );
};

export default AdminLayout;
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useAppContext } from '../../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Package, MapPin, CheckCircle, RefreshCw, Clock, ShieldCheck, Landmark, ChevronRight, User, Sparkles, Bell, MessageSquare, X, BellRing } from 'lucide-react';
import RiderSelfieModal from '../../components/RiderSelfieModal';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const RiderDashboard = () => {
    const { axios, user, currency } = useAppContext();
    const navigate = useNavigate();
    
    // Shift & Security State
    const [isOnline, setIsOnline] = useState(sessionStorage.getItem('rider_online') === 'true');
    const [shiftTimer, setShiftTimer] = useState("00:00:00");
    const [showSelfieModal, setShowSelfieModal] = useState(false);

    // Stats & Wallet State
    const [stats, setStats] = useState({ todayEarnings: 0, totalBalance: 0, pendingJobs: 0, activeJob: false });
    const [loading, setLoading] = useState(false);

    // Notification State
    const [showNotifications, setShowNotifications] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [selectedMessage, setSelectedMessage] = useState(null);
    const unreadCount = notifications.filter(n => !n.isRead).length;

    // 🟢 URGENT JOB ALERT STATE
    const [showJobAlert, setShowJobAlert] = useState(false);
    const [availableJobCount, setAvailableJobCount] = useState(0);
    const alertAudioRef = useRef(null);

    // Initialize Alert Audio
    useEffect(() => {
        alertAudioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        alertAudioRef.current.loop = true; 
        return () => {
            if (alertAudioRef.current) {
                alertAudioRef.current.pause();
                alertAudioRef.current.currentTime = 0;
            }
        };
    }, []);

    // --- 🕒 SHIFT TIMER LOGIC ---
    useEffect(() => {
        let interval;
        if (isOnline) {
            const startTime = sessionStorage.getItem('shift_start_time') || Date.now();
            if (!sessionStorage.getItem('shift_start_time')) {
                sessionStorage.setItem('shift_start_time', startTime);
            }

            interval = setInterval(() => {
                const diff = Math.floor((Date.now() - parseInt(startTime)) / 1000);
                const hrs = String(Math.floor(diff / 3600)).padStart(2, '0');
                const mins = String(Math.floor((diff % 3600) / 60)).padStart(2, '0');
                const secs = String(diff % 60).padStart(2, '0');
                setShiftTimer(`${hrs}:${mins}:${secs}`);
            }, 1000);
        } else {
            setShiftTimer("00:00:00");
        }
        return () => clearInterval(interval);
    }, [isOnline]);

    // --- 🔔 FETCH NOTIFICATIONS LOGIC ---
    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const { data } = await axios.get('/api/user/notifications');
                if (data.success) setNotifications(data.notifications);
            } catch (error) {
                console.log("No notifications found");
            }
        };
        if (user) fetchNotifications();
    }, [user, axios]);

    const handleOpenMessage = async (note) => {
        setSelectedMessage(note);
        setShowNotifications(false);
        if (!note.isRead) {
            try {
                await axios.post('/api/user/notifications/read', { id: note._id });
                setNotifications(prev => prev.map(n => n._id === note._id ? { ...n, isRead: true } : n));
            } catch (e) { console.log("Failed to mark read"); }
        }
    };

    // --- 📸 IDENTITY VERIFICATION LOGIC ---
    const handleIdentityVerification = async (imageBase64) => {
        const loadToast = toast.loading("Syncing secure session with server...");
        try {
            const { data } = await axios.post('/api/rider/status', { isOnline: true });
            if (data.success) {
                toast.success("Identity verified! Shift started.", { id: loadToast });
                setShowSelfieModal(false);
                setIsOnline(true);
                sessionStorage.setItem('rider_online', 'true');
                sessionStorage.setItem('shift_start_time', Date.now());
                fetchStats(true);
                checkForNewJobs(); // Instantly check for jobs right after logging in
            } else {
                toast.error(data.message || "Failed to sync status.", { id: loadToast });
            }
        } catch (error) {
            toast.error("Network error. Please check your connection.", { id: loadToast });
        }
    };

    // --- 🛑 END SHIFT LOGIC ---
    const handleEndShift = async () => {
        if(window.confirm("Are you sure you want to end your shift?")) {
            const loadToast = toast.loading("Ending shift...");
            try {
                const { data } = await axios.post('/api/rider/status', { isOnline: false });
                if (data.success) {
                    setIsOnline(false);
                    sessionStorage.removeItem('rider_online');
                    sessionStorage.removeItem('shift_start_time');
                    toast.success("Shift ended successfully. Great job today!", { id: loadToast });
                    
                    // Stop any playing alarms
                    setShowJobAlert(false);
                    if (alertAudioRef.current) alertAudioRef.current.pause();
                } else {
                    toast.error(data.message, { id: loadToast });
                }
            } catch (error) {
                toast.error("Failed to end shift securely.", { id: loadToast });
            }
        }
    };

    // --- 📊 FETCH STATS & WALLET LOGIC ---
    const fetchStats = useCallback(async (showLoading = false) => {
        if (showLoading) setLoading(true);
        try {
            const { data } = await axios.get('/api/rider/my-jobs');
            if (data.success) {
                const today = new Date().toDateString();
                const deliveredJobs = data.orders.filter(o => o.status === 'Delivered');
                const todayOrders = deliveredJobs.filter(o => new Date(o.date).toDateString() === today);
                
                const totalBalance = deliveredJobs.reduce((sum, o) => sum + (o.riderEarnings || o.deliveryFee || 40), 0);
                const earnings = todayOrders.reduce((sum, o) => sum + (o.riderEarnings || o.deliveryFee || 40), 0);
                const active = data.orders.some(o => ['Ready for Pickup', 'Out for Delivery'].includes(o.status));
                
                const pendingPayout = user?.pendingWithdrawals || 0;
                const totalWithdrawn = user?.totalWithdrawn || 0;
                const availableBalance = totalBalance - pendingPayout - totalWithdrawn;
                
                setStats({
                    todayEarnings: earnings,
                    totalBalance: Math.max(0, availableBalance), 
                    pendingJobs: todayOrders.length, 
                    activeJob: active
                });
            }
        } catch (error) { console.error("Fetch Error:", error); } 
        finally { if (showLoading) setLoading(false); }
    }, [axios, user?.pendingWithdrawals, user?.totalWithdrawn]);

    // --- CHECK FOR UNCLAIMED JOBS ---
    const checkForNewJobs = useCallback(async () => {
        if (!isOnline) return;
        try {
            const { data } = await axios.get('/api/rider/available');
            if (data.success && data.orders.length > 0) {
                if (availableJobCount === 0) {
                    setShowJobAlert(true);
                    alertAudioRef.current?.play().catch(e => console.log("Waiting for user interaction..."));
                }
                setAvailableJobCount(data.orders.length);
            } else {
                setAvailableJobCount(0);
                setShowJobAlert(false);
                if (alertAudioRef.current) {
                    alertAudioRef.current.pause();
                    alertAudioRef.current.currentTime = 0;
                }
            }
        } catch (error) { console.error("Failed to check for jobs"); }
    }, [isOnline, availableJobCount, axios]);

    // Master Polling Interval
    useEffect(() => { 
        fetchStats(true); 
    }, [fetchStats]);

    useEffect(() => {
        const interval = setInterval(() => {
            fetchStats(false);
            checkForNewJobs();
        }, 5000);
        return () => clearInterval(interval);
    }, [fetchStats, checkForNewJobs]);

    const canWithdraw = stats.totalBalance >= 500;

    const handleViewJobs = () => {
        if (alertAudioRef.current) alertAudioRef.current.pause();
        setShowJobAlert(false);
        navigate('/rider/jobs');
    };

    const handleDismissAlert = () => {
        if (alertAudioRef.current) alertAudioRef.current.pause();
        setShowJobAlert(false);
    };

    return (
        <>
            {/* 🟢 FIX: Moved Modals OUTSIDE of the animated container so they aren't trapped and can cover 100% of the screen */}
            <AnimatePresence>
                {showJobAlert && (
                    <div className="fixed inset-0 bg-red-950/80 backdrop-blur-md z-[9999] flex items-center justify-center p-4 m-0">
                        <motion.div 
                            initial={{ scale: 0.8, opacity: 0 }} 
                            animate={{ scale: 1, opacity: 1 }} 
                            exit={{ scale: 0.8, opacity: 0 }} 
                            className="bg-white rounded-[2rem] w-full max-w-sm shadow-2xl overflow-hidden border-4 border-red-500 text-center"
                        >
                            <div className="bg-red-50 p-8 flex flex-col items-center">
                                <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mb-6 shadow-inner relative">
                                    <div className="absolute inset-0 rounded-full border-4 border-red-500 animate-ping opacity-30"></div>
                                    <BellRing size={48} className="text-red-600 animate-pulse" />
                                </div>
                                <h2 className="text-3xl font-black text-gray-900 leading-tight tracking-tight">New Order!</h2>
                                <p className="text-gray-600 font-medium mt-2">
                                    There are currently <span className="font-black text-red-600">{availableJobCount}</span> unassigned orders waiting in your area.
                                </p>
                            </div>
                            
                            <div className="p-6 space-y-3 bg-white">
                                <button 
                                    onClick={handleViewJobs} 
                                    className="w-full bg-red-600 text-white font-black text-lg py-4 rounded-2xl hover:bg-red-700 transition-all shadow-lg shadow-red-200 active:scale-95"
                                >
                                    Accept Delivery
                                </button>
                                <button 
                                    onClick={handleDismissAlert} 
                                    className="w-full bg-white text-gray-500 font-bold py-3 rounded-2xl hover:bg-gray-100 transition-all"
                                >
                                    Dismiss
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {selectedMessage && (
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 m-0">
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0, y: 20 }} 
                            animate={{ scale: 1, opacity: 1, y: 0 }} 
                            exit={{ scale: 0.95, opacity: 0, y: 20 }} 
                            className="bg-white rounded-[2rem] w-full max-w-md shadow-2xl overflow-hidden border border-gray-100"
                        >
                            <div className="bg-gray-50 p-5 border-b border-gray-100 flex justify-between items-center">
                                <div>
                                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                        <MessageSquare size={18} className="text-purple-600"/> System Message
                                    </h3>
                                </div>
                                <button onClick={() => setSelectedMessage(null)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full transition"><X size={20}/></button>
                            </div>
                            
                            <div className="p-8 space-y-5">
                                <div>
                                    <h4 className="text-xl font-black text-gray-900 leading-tight">{selectedMessage.title}</h4>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">
                                        Received: {new Date(selectedMessage.date || selectedMessage.createdAt).toLocaleString()}
                                    </p>
                                </div>
                                <div className="bg-gray-50 border border-gray-100 p-5 rounded-2xl">
                                    <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                                        {selectedMessage.message}
                                    </p>
                                </div>
                                <button onClick={() => setSelectedMessage(null)} className="w-full bg-slate-900 text-white font-bold py-3.5 rounded-2xl hover:bg-black transition-all shadow-md">
                                    Close Message
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <RiderSelfieModal 
                isOpen={showSelfieModal} 
                onClose={() => setShowSelfieModal(false)} 
                onVerify={handleIdentityVerification} 
            />

            {/* DASHBOARD CONTENT (Now isolated from Modals) */}
            <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-20 font-outfit relative">
                
                {/* HEADER & STATUS AREA */}
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm relative z-20">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Sparkles className="text-emerald-500 fill-emerald-100" size={24} />
                            <h1 className="text-3xl font-black text-gray-800">Welcome, {user?.name?.split(' ')[0]}</h1>
                        </div>
                        {isOnline ? (
                            <div className="flex items-center gap-2 mt-2">
                                <span className="relative flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                                </span>
                                <p className="text-sm font-bold text-green-600 uppercase tracking-widest">Online</p>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 mt-2">
                                <span className="relative flex h-3 w-3">
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-gray-400"></span>
                                </span>
                                <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Offline</p>
                            </div>
                        )}
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center justify-end gap-1"><Clock size={12}/> Shift Time</p>
                            <p className={`font-mono text-xl font-bold ${isOnline ? 'text-gray-800' : 'text-gray-300'}`}>{shiftTimer}</p>
                        </div>
                        {isOnline && (
                            <button onClick={handleEndShift} className="px-4 py-2 bg-red-50 text-red-600 font-bold rounded-xl text-sm hover:bg-red-100 transition-colors">
                                End Shift
                            </button>
                        )}
                        
                        {/* NOTIFICATION BELL */}
                        <div className="relative">
                            <button onClick={() => setShowNotifications(!showNotifications)} className="relative p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors text-gray-600">
                                <Bell size={18} className={unreadCount > 0 ? "animate-pulse text-purple-600" : ""} />
                                {unreadCount > 0 && <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>}
                            </button>

                            <AnimatePresence>
                                {showNotifications && (
                                    <>
                                        <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)}></div>
                                        <motion.div 
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                            className="absolute right-0 mt-3 w-80 bg-white rounded-[2rem] shadow-2xl border border-gray-100 overflow-hidden z-50 origin-top-right"
                                        >
                                            <div className="bg-gray-50 px-5 py-4 border-b border-gray-100 flex justify-between items-center">
                                                <h3 className="font-bold text-gray-800 text-sm">Notifications</h3>
                                                {unreadCount > 0 && <span className="bg-purple-100 text-purple-700 text-[10px] font-black px-2 py-0.5 rounded-full">{unreadCount} New</span>}
                                            </div>
                                            <div className="max-h-80 overflow-y-auto p-2">
                                                {notifications.length === 0 ? (
                                                    <div className="p-6 text-center text-gray-400 text-sm font-medium">No new messages.</div>
                                                ) : (
                                                    notifications.map((note, i) => (
                                                        <div 
                                                            key={i} 
                                                            onClick={() => handleOpenMessage(note)}
                                                            className={`p-4 rounded-2xl mb-1 cursor-pointer transition-colors ${note.isRead ? 'hover:bg-gray-50' : 'bg-purple-50/50 hover:bg-purple-50'}`}
                                                        >
                                                            <h4 className={`text-sm ${note.isRead ? 'font-medium text-gray-700' : 'font-bold text-purple-900'}`}>{note.title}</h4>
                                                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{note.message}</p>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </motion.div>
                                    </>
                                )}
                            </AnimatePresence>
                        </div>

                        <button onClick={() => fetchStats(true)} className="p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors text-gray-600" title="Refresh Data">
                            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
                        </button>
                    </div>
                </div>

                {/* CENTRAL WALLET CARD */}
                <div onClick={() => navigate('/rider/history')} className="bg-slate-900 text-white rounded-[2rem] p-8 shadow-2xl cursor-pointer transform transition-transform hover:scale-[1.01] relative overflow-hidden group">
                    <div className="relative z-10 flex justify-between items-center">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <Landmark size={20} className="text-emerald-400" />
                                <span className="text-slate-400 font-bold text-xs uppercase tracking-widest">Available Wallet Balance</span>
                            </div>
                            <h2 className="text-5xl font-black">{currency}{stats.totalBalance.toLocaleString()}</h2>
                        </div>
                        <div className="text-right flex flex-col items-end">
                            <span className={`text-xs font-bold mb-3 px-3 py-1 rounded-full border ${canWithdraw ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                                {canWithdraw ? 'Ready to Withdraw' : `Min. ${currency}500 to withdraw`}
                            </span>
                            <div className="bg-white/10 p-3 rounded-full group-hover:bg-white group-hover:text-slate-900 transition-colors">
                                <ChevronRight size={24} />
                            </div>
                        </div>
                    </div>
                    <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-emerald-500 rounded-full blur-[100px] opacity-20 -mr-20 -mt-20 pointer-events-none"></div>
                </div>

                {/* DYNAMIC ACTION CARD */}
                {!isOnline ? (
                    <div onClick={() => setShowSelfieModal(true)} className="bg-white border border-gray-200 rounded-[2rem] p-8 shadow-sm cursor-pointer transform transition-transform hover:scale-[1.01] flex justify-between items-center group">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800 mb-1">Start Your Shift</h2>
                            <p className="text-gray-500 text-sm mb-4">Verify your identity using FaceID to begin accepting orders.</p>
                            <button className="bg-slate-900 text-white px-6 py-2.5 rounded-full font-bold text-sm shadow-md group-hover:bg-black transition-colors flex items-center gap-2">
                                <ShieldCheck size={16} className="text-green-400" /> Verify Identity
                            </button>
                        </div>
                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center group-hover:bg-green-50 transition-colors">
                            <ShieldCheck size={32} className="text-gray-300 group-hover:text-green-500 transition-colors" />
                        </div>
                    </div>
                ) : stats.activeJob ? (
                    <div onClick={() => navigate('/rider/active')} className="bg-gradient-to-r from-orange-500 to-red-500 rounded-[2rem] p-8 text-white shadow-xl shadow-orange-200 cursor-pointer transform transition-transform hover:scale-[1.01] flex justify-between items-center relative overflow-hidden group">
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span></span>
                                <h2 className="text-2xl font-bold">Delivery in Progress</h2>
                            </div>
                            <p className="opacity-90 text-sm mb-4">You have an ongoing order. Resume navigation.</p>
                            <button className="bg-white text-orange-600 px-6 py-2.5 rounded-full font-bold text-sm shadow-md group-hover:bg-orange-50 transition-colors">Open Map</button>
                        </div>
                        <MapPin size={100} className="absolute -right-6 -bottom-6 opacity-20 text-white group-hover:opacity-30 transition-opacity" />
                    </div>
                ) : (
                    <div onClick={() => navigate('/rider/jobs')} className={`bg-gradient-to-r from-green-600 to-emerald-500 rounded-[2rem] p-8 text-white shadow-xl shadow-green-200 cursor-pointer transform transition-transform hover:scale-[1.01] flex justify-between items-center relative overflow-hidden group ${availableJobCount > 0 ? 'animate-pulse' : ''}`}>
                        <div className="relative z-10">
                            <h2 className="text-2xl font-bold mb-1">{availableJobCount > 0 ? `${availableJobCount} Jobs Waiting!` : 'Looking for Jobs...'}</h2>
                            <p className="opacity-90 text-sm mb-4">Tap here to view all available pickups in your area.</p>
                            <button className="bg-white text-green-600 px-6 py-2.5 rounded-full font-bold text-sm shadow-md group-hover:bg-green-50 transition-colors">
                                {availableJobCount > 0 ? 'Accept Orders' : 'Find Jobs'}
                            </button>
                        </div>
                        <Package size={100} className="absolute -right-6 -bottom-6 opacity-20 text-white group-hover:opacity-30 transition-opacity" />
                    </div>
                )}

                {/* QUICK STATS & PROFILE LINKS */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col justify-center">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-blue-50 rounded-lg text-blue-600"><TrendingUp size={20}/></div>
                            <span className="text-gray-400 font-bold text-[10px] uppercase tracking-wider">Today's Earnings</span>
                        </div>
                        <p className="text-3xl font-black text-gray-800">{currency}{stats.todayEarnings}</p>
                    </div>
                    
                    <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col justify-center">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-purple-50 rounded-lg text-purple-600"><CheckCircle size={20}/></div>
                            <span className="text-gray-400 font-bold text-[10px] uppercase tracking-wider">Completed Today</span>
                        </div>
                        <p className="text-3xl font-black text-gray-800">{stats.pendingJobs}</p>
                    </div>

                    <div onClick={() => navigate('/rider/profile')} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm cursor-pointer hover:bg-gray-50 transition-colors flex items-center justify-between group">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-gray-100 rounded-lg text-gray-600"><User size={20}/></div>
                                <span className="text-gray-400 font-bold text-[10px] uppercase tracking-wider">My Profile</span>
                            </div>
                            <p className="text-sm font-bold text-gray-800 mt-1">Manage Bank Details</p>
                        </div>
                        <ChevronRight size={24} className="text-gray-300 group-hover:text-gray-600 transition-colors" />
                    </div>
                </div>

            </div>
        </>
    );
};

export default RiderDashboard;
import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { assets } from '../../assets/assets';
import { useAppContext } from '../../context/AppContext';
import { useClerk, useUser } from '@clerk/clerk-react';
import toast from 'react-hot-toast';
import { 
  LayoutDashboard, PlusCircle, Package, 
  ClipboardList, UserCircle, LogOut, Menu, X, Bell, MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Lottie from 'lottie-react';

// 🟢 Import your newly uploaded animation file
import sellerLoaderAnimation from '../../assets/seller-loader.json';

const SellerLayout = () => {
  const { user, setUser, navigate, axios, logout } = useAppContext();
  const { signOut } = useClerk(); 
  const { user: clerkUser } = useUser(); 
  
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // 🟢 ROUTING ANIMATION STATE
  const [isRouting, setIsRouting] = useState(false);
  
  // NOTIFICATION & MESSAGE STATE
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);

  const unreadCount = notifications.filter(n => !n.isRead).length;

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

  useEffect(() => {
    if (user) {
        const isProfileIncomplete = !user.shopName || !user.phone || !user.address?.line1;
        if (isProfileIncomplete && location.pathname !== '/seller/profile') {
            toast('⚠️ Please complete your Shop Profile to continue', { id: 'profile-redirect', icon: '🏪' });
            navigate('/seller/profile');
        }
    }
  }, [user, location.pathname, navigate]);

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



  const sidebarLinks = [
    { name: "Dashboard", path: "/seller", icon: <LayoutDashboard size={20} /> },
    { name: "Add Product", path: "/seller/add-product", icon: <PlusCircle size={20} /> },
    { name: "Inventory", path: "/seller/product-list", icon: <Package size={20} /> },
    { name: "Orders", path: "/seller/orders", icon: <ClipboardList size={20} /> },
    { name: "Shop Profile", path: "/seller/profile", icon: <UserCircle size={20} /> },
  ];

  const NavLinks = ({ mobile = false }) => (
    <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
      {sidebarLinks.map((item) => {
        const isActive = item.path === '/seller' 
            ? location.pathname === '/seller' 
            : location.pathname.startsWith(item.path);

        return (
            <Link
                key={item.name}
                to={item.path}
                onClick={() => mobile && setIsSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 font-bold text-sm ${isActive ? 'bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
            >
                {item.icon}
                {item.name}
            </Link>
        )
      })}
    </nav>
  );

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] font-outfit relative overflow-hidden">
      
      {/* 🟢 FULL SCREEN LOTTIE ROUTE LOADER */}
      <AnimatePresence>
          {isRouting && (
              <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[9999] bg-white/80 backdrop-blur-md flex flex-col items-center justify-center m-0"
              >
                  {/* The Lottie Animation */}
                  <div className="w-64 h-64 md:w-80 md:h-80 drop-shadow-xl -mb-4">
                      <Lottie animationData={sellerLoaderAnimation} loop={true} />
                  </div>
                  
                  {/* Premium pulsing text (Indigo themed for Seller) */}
                  <div className="flex items-center gap-2 mt-4">
                      <span className="relative flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-600"></span>
                      </span>
                      <h2 className="text-sm font-black text-indigo-800 tracking-widest uppercase">
                          Syncing Workspace...
                      </h2>
                  </div>
              </motion.div>
          )}
      </AnimatePresence>

      {/* 🖥️ DESKTOP SIDEBAR */}
      <div className="hidden md:flex w-72 flex-col bg-white border-r border-slate-200 shadow-2xl shadow-slate-200/40 z-20 sticky top-0 h-screen">
        <div className="h-24 flex items-center px-8 border-b border-slate-100 shrink-0">
          <img className="h-9 w-auto cursor-pointer hover:scale-105 transition-transform" onClick={()=> navigate('/')} src={assets.logo} alt="GreenCart" />
          <span className="ml-3 text-[10px] font-black text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-md tracking-widest uppercase shadow-sm">Seller</span>
        </div>
        <NavLinks />
        <div className="p-6 border-t border-slate-100 bg-slate-50/50 mt-auto shrink-0">
            <button onClick={logout} className="flex items-center justify-center gap-2 w-full px-4 py-3 text-sm font-bold text-slate-600 bg-white border border-slate-200 hover:border-red-200 hover:bg-red-50 hover:text-red-600 rounded-lg transition-all shadow-sm active:scale-95">
                <LogOut size={18} /> Secure Logout
            </button>
        </div>
      </div>

      {/* 📱 MOBILE SIDEBAR */}
      <AnimatePresence>
        {isSidebarOpen && (
            <>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-30 md:hidden" onClick={() => setIsSidebarOpen(false)} />
                <motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: "spring", bounce: 0, duration: 0.3 }} className="fixed inset-y-0 left-0 z-40 w-72 bg-white flex flex-col shadow-2xl md:hidden">
                    <div className="h-20 flex items-center justify-between px-6 border-b border-slate-100 bg-slate-50">
                        <div className="flex items-center">
                            <img className="h-7 w-auto" src={assets.logo} alt="GreenCart" />
                            <span className="ml-2 text-[10px] font-black text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-md uppercase tracking-wider">Seller</span>
                        </div>
                        <button onClick={() => setIsSidebarOpen(false)} className="p-2 bg-white rounded-md shadow-sm text-slate-500 hover:text-slate-800 border border-slate-200"><X size={18} /></button>
                    </div>
                    <NavLinks mobile={true} />
                    <div className="p-6 border-t border-slate-100 bg-slate-50 mt-auto">
                        <button onClick={logout} className="flex items-center justify-center gap-2 w-full px-4 py-3 text-sm font-bold text-red-600 bg-white border border-red-100 hover:bg-red-50 rounded-lg transition-all shadow-sm">
                            <LogOut size={18} /> Logout
                        </button>
                    </div>
                </motion.div>
            </>
        )}
      </AnimatePresence>

      {/* 🟢 MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* Header */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-4 md:px-10 z-10 shrink-0">
          <div className="flex items-center gap-4">
             <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2.5 bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
               <Menu size={20} />
             </button>
             <div>
                <h1 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">
                  {sidebarLinks.find(l => l.path === location.pathname || (l.path !== '/seller' && location.pathname.startsWith(l.path)))?.name || "Dashboard"}
                </h1>
             </div>
          </div>

          <div className="flex items-center gap-4">
            {/* 🔔 NOTIFICATION BELL */}
            <div className="relative">
                <button onClick={() => setShowNotifications(!showNotifications)} className="relative p-2.5 bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-indigo-600 rounded-lg transition-all shadow-sm">
                    <Bell size={20} className={unreadCount > 0 ? "animate-pulse text-indigo-600" : ""} />
                    {unreadCount > 0 && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>}
                </button>

                <AnimatePresence>
                    {showNotifications && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)}></div>
                            <motion.div 
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                className="absolute right-0 mt-3 w-80 bg-white rounded-lg shadow-xl border border-slate-200 overflow-hidden z-50 origin-top-right"
                            >
                                <div className="bg-slate-50 px-4 py-3 border-b border-slate-100 flex justify-between items-center">
                                    <h3 className="font-bold text-slate-800 text-xs">System Inbox</h3>
                                    {unreadCount > 0 && <span className="bg-indigo-100 text-indigo-700 text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-widest">{unreadCount} New</span>}
                                </div>
                                <div className="max-h-72 overflow-y-auto p-1.5">
                                    {notifications.length === 0 ? (
                                        <div className="p-6 text-center text-slate-400 text-xs font-medium">No new messages.</div>
                                    ) : (
                                        notifications.map((note, i) => (
                                            <div 
                                                key={i} 
                                                onClick={() => handleOpenMessage(note)} // 🟢 OPENS MESSAGE
                                                className={`p-3 rounded-md mb-1 cursor-pointer transition-all border border-transparent ${note.isRead ? 'hover:bg-slate-50' : 'bg-indigo-50/50 hover:bg-indigo-50 border-indigo-100/50'}`}
                                            >
                                                <h4 className={`text-xs ${note.isRead ? 'font-semibold text-slate-700' : 'font-bold text-indigo-900'}`}>{note.title}</h4>
                                                <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">{note.message}</p>
                                                {!note.isRead && <p className="text-[9px] text-indigo-500 font-bold uppercase tracking-widest mt-1.5">Click to read</p>}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>
            </div>

            {/* SELLER PROFILE BUBBLE */}
            <div className="flex items-center gap-4 bg-slate-50 border border-slate-100 py-1.5 pr-1.5 pl-4 rounded-full shadow-sm cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => navigate('/seller/profile')}>
              <div className="text-right hidden sm:block">
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ID: {user?._id?.slice(-6)}</p>
                 <p className="text-sm font-bold text-slate-800">{user?.shopName || user?.name || 'Seller'}</p>
              </div>
              <div className="w-10 h-10 rounded-full border-2 border-white shadow-md overflow-hidden bg-indigo-100 flex items-center justify-center">
                  <img src={clerkUser?.imageUrl || "https://cdn-icons-png.flaticon.com/512/149/149071.png"} alt="Avatar" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto scroll-smooth">
          <div className="max-w-7xl mx-auto animate-fade-in-up">
            <Outlet />
          </div>
        </main>
      </div>

      {/* 🟢 PARTICULAR MESSAGE VIEWER MODAL */}
      <AnimatePresence>
          {selectedMessage && (
              <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                  <motion.div 
                      initial={{ scale: 0.95, opacity: 0, y: 20 }} 
                      animate={{ scale: 1, opacity: 1, y: 0 }} 
                      exit={{ scale: 0.95, opacity: 0, y: 20 }} 
                      className="bg-white rounded-xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-200"
                  >
                      <div className="bg-slate-50 p-4 border-b border-slate-200 flex justify-between items-center">
                          <div>
                              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                                  <MessageSquare size={16} className="text-indigo-600"/> System Message
                              </h3>
                          </div>
                          <button onClick={() => setSelectedMessage(null)} className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded transition"><X size={18}/></button>
                      </div>
                      
                      <div className="p-6 space-y-4">
                          <div>
                              <h4 className="text-lg font-bold text-slate-900 leading-tight">{selectedMessage.title}</h4>
                              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mt-1">
                                  Received: {new Date(selectedMessage.date || selectedMessage.createdAt).toLocaleString()}
                              </p>
                          </div>
                          <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg">
                              <p className="text-[13px] text-slate-700 leading-relaxed whitespace-pre-wrap">
                                  {selectedMessage.message}
                              </p>
                          </div>
                          <button onClick={() => setSelectedMessage(null)} className="w-full bg-slate-900 text-white font-bold py-2.5 rounded-lg hover:bg-slate-800 transition-all shadow-sm text-sm">
                              Acknowledge & Close
                          </button>
                      </div>
                  </motion.div>
              </div>
          )}
      </AnimatePresence>
    </div>
  );
};

export default SellerLayout;
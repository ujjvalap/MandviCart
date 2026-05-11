import React, { useEffect, useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import toast from 'react-hot-toast';
import { 
    Trash2, Edit, X, Save, ShieldBan, CheckCircle, Eye, 
    Truck, MapPin, Wallet, Clock, Activity, Bike, Landmark, Calendar, Banknote, CreditCard
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AllRiders = () => {
    const { axios, currency } = useAppContext();
    
    const [riders, setRiders] = useState([]);
    const [allOrders, setAllOrders] = useState([]); 
    
    // Modals
    const [showEdit, setShowEdit] = useState(false);
    const [showDeepView, setShowDeepView] = useState(false);
    
    // Data State
    const [selectedRider, setSelectedRider] = useState(null);
    const [riderStats, setRiderStats] = useState(null);
    const [editData, setEditData] = useState({ userId: '', name: '', email: '', phone: '', vehicleNumber: '' });

    const fetchData = async () => {
        try {
            // Fetch both Riders and Orders to calculate live telemetry locally
            const [ridersRes, ordersRes] = await Promise.all([
                axios.get('/api/user/admin/users?role=rider'),
                axios.get('/api/order/all-list')
            ]);
            
            if (ridersRes.data.success) setRiders(ridersRes.data.users);
            if (ordersRes.data.success) setAllOrders(ordersRes.data.orders);
            
        } catch (error) { 
            toast.error("Failed to load fleet data"); 
        }
    };

    // 🟢 DEEP VIEW: Calculate Rider Specifics
    const openDeepView = (rider) => {
        // Filter orders assigned to this rider
        const riderOrders = allOrders.filter(o => 
            o.riderId && (o.riderId._id === rider._id || o.riderId === rider._id)
        );

        const deliveredOrders = riderOrders.filter(o => o.status === 'Delivered');
        const activeOrders = riderOrders.filter(o => !['Delivered', 'Cancelled'].includes(o.status));
        
        // Financials
        const lifetimeEarnings = deliveredOrders.reduce((sum, o) => sum + (o.riderEarnings || o.deliveryFee || 40), 0);
        const pending = rider.pendingWithdrawals || 0;
        const withdrawn = rider.totalWithdrawn || 0;
        const availableWallet = Math.max(0, lifetimeEarnings - pending - withdrawn);

        // Find last completed delivery
        const sortedDelivered = [...deliveredOrders].sort((a, b) => new Date(b.deliveredAt || b.date) - new Date(a.deliveredAt || a.date));
        const lastDelivery = sortedDelivered.length > 0 ? sortedDelivered[0] : null;

        setRiderStats({
            orders: riderOrders,
            activeCount: activeOrders.length,
            completedCount: deliveredOrders.length,
            lifetimeEarnings,
            availableWallet,
            pending,
            withdrawn,
            lastDelivery
        });

        setSelectedRider(rider);
        setShowDeepView(true);
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        const loadToast = toast.loading("Updating fleet info...");
        try {
            const { data } = await axios.post('/api/user/admin/update', editData);
            if (data.success) {
                toast.success("Rider updated", { id: loadToast });
                setShowEdit(false);
                fetchData();
            } else {
                toast.error(data.message, { id: loadToast });
            }
        } catch (error) { 
            toast.error("Update failed", { id: loadToast }); 
        }
    };

    const toggleBan = async (id) => {
        if(!window.confirm("Change rider ban status?")) return;
        try {
            const { data } = await axios.post('/api/user/admin/block', { userId: id });
            if (data.success) { 
                toast.success(data.message); 
                fetchData(); 
            }
        } catch (error) { 
            toast.error("Action failed"); 
        }
    };

    const handleDelete = async (id) => {
        if(!window.confirm("Delete rider permanently? This removes them from the system.")) return;
        try {
            const { data } = await axios.post('/api/user/admin/delete', { id });
            if (data.success) { 
                toast.success("Rider deleted"); 
                fetchData(); 
            }
        } catch (error) { 
            toast.error("Delete failed"); 
        }
    };

    useEffect(() => { fetchData(); }, []);

    return (
        <motion.div initial={{opacity:0}} animate={{opacity:1}} className="space-y-6 relative font-outfit pb-20 max-w-7xl mx-auto">
            
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Bike size={24} className="text-blue-600"/> Fleet Management
                    </h2>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Manage Delivery Partners</p>
                </div>
                <div className="bg-slate-50 border border-slate-200 text-slate-600 px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 shadow-sm">
                    <Truck size={16}/> Total Riders: {riders.length}
                </div>
            </div>

            {/* Riders Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-black tracking-widest border-b border-slate-200">
                            <tr>
                                <th className="p-5">Rider Details</th>
                                <th className="p-5">Vehicle Info</th>
                                <th className="p-5">Status</th>
                                <th className="p-5 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
                            {riders.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="p-8 text-center text-slate-400">No riders found.</td>
                                </tr>
                            ) : riders.map((u) => (
                                <tr key={u._id} className="hover:bg-slate-50/80 transition-colors">
                                    <td className="p-5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-black text-sm shrink-0 border border-blue-200">
                                                {u.name?.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-900 text-sm">{u.name}</span>
                                                <span className="text-[11px] text-slate-500 mt-0.5">{u.email}</span>
                                                <span className="text-[9px] text-slate-400 font-mono mt-1 tracking-wider uppercase">{u.clerkId || 'No Auth ID'}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-5">
                                        <span className="inline-flex bg-slate-100 border border-slate-200 px-2.5 py-1 rounded text-[10px] font-mono font-bold tracking-widest text-slate-600 uppercase">
                                            {u.vehicleNumber || 'NO-VEHICLE'}
                                        </span>
                                    </td>
                                    <td className="p-5">
                                        {u.isBlocked ? (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded border bg-red-50 text-red-600 border-red-200 text-[10px] font-black tracking-wider uppercase">
                                                <ShieldBan size={10}/> Banned
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded border bg-emerald-50 text-emerald-600 border-emerald-200 text-[10px] font-black tracking-wider uppercase">
                                                <CheckCircle size={10}/> Active
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-5">
                                        <div className="flex items-center justify-center gap-2">
                                            <button onClick={() => openDeepView(u)} className="p-2 text-blue-600 bg-blue-50 border border-blue-100 hover:bg-blue-100 rounded-lg transition-colors shadow-sm" title="Fleet Analytics">
                                                <Eye size={16} />
                                            </button>
                                            
                                            <button onClick={() => { setEditData({ userId: u._id, name: u.name, email: u.email, phone: u.phone || '', vehicleNumber: u.vehicleNumber || '' }); setShowEdit(true); }} className="p-2 text-slate-500 bg-white border border-slate-200 hover:text-slate-800 hover:bg-slate-50 rounded-lg transition-colors shadow-sm" title="Edit Info">
                                                <Edit size={16} />
                                            </button>
                                            
                                            <button onClick={() => toggleBan(u._id)} className={`p-2 border rounded-lg transition-colors shadow-sm ${u.isBlocked ? 'text-emerald-600 bg-emerald-50 border-emerald-200 hover:bg-emerald-100' : 'text-amber-600 bg-amber-50 border-amber-200 hover:bg-amber-100'}`} title={u.isBlocked ? "Unban" : "Ban"}>
                                                <ShieldBan size={16} />
                                            </button>
                                            
                                            <button onClick={() => handleDelete(u._id)} className="p-2 text-rose-600 bg-rose-50 border border-rose-100 hover:bg-rose-100 rounded-lg transition-colors shadow-sm" title="Delete Rider">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ==========================================
                🟢 DEEP VIEW MODAL (FLEET ANALYTICS)
                ========================================== */}
            <AnimatePresence>
                {showDeepView && selectedRider && riderStats && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 md:p-8">
                        <motion.div initial={{scale:0.95, opacity:0}} animate={{scale:1, opacity:1}} exit={{scale:0.95, opacity:0}} className="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col border border-slate-200">
                            
                            {/* Header */}
                            <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50 shrink-0">
                                <div>
                                    <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2"><Activity size={18} className="text-blue-600"/> Fleet Operations Deep Dive</h3>
                                    <p className="text-[11px] text-slate-500 font-bold mt-1 uppercase tracking-widest">{selectedRider.name} | {selectedRider.vehicleNumber || 'N/A'}</p>
                                </div>
                                <button onClick={() => setShowDeepView(false)} className="p-2 bg-white rounded-md text-slate-400 hover:text-slate-800 shadow-sm border border-slate-200 transition-colors"><X size={18}/></button>
                            </div>

                            <div className="p-6 overflow-y-auto space-y-6 bg-slate-50/50 flex-1 hide-scrollbar">
                                
                                {/* KPI Wallet Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5"><Wallet size={14} className="text-emerald-500"/> Available Wallet</p>
                                        <p className="text-2xl font-bold text-slate-900">{currency}{riderStats.availableWallet.toLocaleString()}</p>
                                        <p className="text-[11px] text-slate-400 mt-1 font-medium">LIFETIME: {currency}{riderStats.lifetimeEarnings.toLocaleString()}</p>
                                    </div>
                                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5"><Clock size={14} className="text-amber-500"/> Pending Transfer</p>
                                        <p className="text-2xl font-bold text-slate-900">{currency}{riderStats.pending.toLocaleString()}</p>
                                        <p className="text-[11px] text-slate-400 mt-1 font-medium">Withdrawn: {currency}{riderStats.withdrawn.toLocaleString()}</p>
                                    </div>
                                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5"><CheckCircle size={14} className="text-blue-500"/> Delivery Stats</p>
                                        <p className="text-2xl font-bold text-slate-900">{riderStats.completedCount}</p>
                                        <p className="text-[11px] text-slate-400 mt-1 font-medium">Active Runs: {riderStats.activeCount}</p>
                                    </div>
                                </div>

                                {/* Last Delivery Snapshot */}
                                {riderStats.lastDelivery ? (
                                    <div className="bg-blue-50 border border-blue-100 p-5 rounded-xl">
                                        <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">Last Completed Run Snapshot</p>
                                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                            <div>
                                                <p className="text-base font-bold text-slate-900">Order #{riderStats.lastDelivery._id.slice(-8).toUpperCase()}</p>
                                                <p className="text-xs text-slate-600 mt-1"><span className="font-semibold text-slate-800">Dropoff Location:</span> {riderStats.lastDelivery.address?.city}</p>
                                                <p className="text-xs text-slate-600 mt-0.5"><span className="font-semibold text-slate-800">Delivered At:</span> {new Date(riderStats.lastDelivery.deliveredAt || riderStats.lastDelivery.date).toLocaleString()}</p>
                                            </div>
                                            <div className="flex flex-col items-end gap-2 bg-white p-3.5 rounded-lg border border-blue-50 shadow-sm w-full md:w-auto">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Rider Earned</p>
                                                <p className="text-xl font-black text-emerald-600">{currency}{riderStats.lastDelivery.riderEarnings || riderStats.lastDelivery.deliveryFee || 40}</p>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-white p-6 rounded-xl border border-slate-200 text-center text-slate-400 font-medium shadow-sm">
                                        This rider has not completed any deliveries yet.
                                    </div>
                                )}

                                {/* Full Order Ledger */}
                                <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col max-h-[300px]">
                                    <div className="p-4 border-b border-slate-100 bg-slate-50">
                                        <h3 className="font-bold text-slate-800 text-xs flex items-center gap-2"><Truck size={14} className="text-indigo-500"/> Lifetime Route Ledger</h3>
                                    </div>
                                    <div className="overflow-y-auto hide-scrollbar flex-1">
                                        <table className="w-full text-left text-sm">
                                            <thead className="bg-white sticky top-0 border-b border-slate-100 shadow-sm">
                                                <tr>
                                                    <th className="p-3 text-[9px] text-slate-500 uppercase tracking-widest font-bold">Order ID / Date</th>
                                                    <th className="p-3 text-[9px] text-slate-500 uppercase tracking-widest font-bold">Route (To)</th>
                                                    <th className="p-3 text-[9px] text-slate-500 uppercase tracking-widest font-bold text-right">Rider Earnings / Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {riderStats.orders.length === 0 ? (
                                                    <tr><td colSpan="3" className="p-6 text-center text-slate-400 text-xs">No route history found.</td></tr>
                                                ) : riderStats.orders.map((o, i) => (
                                                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                                                        <td className="p-3">
                                                            <p className="font-bold text-slate-800 text-[11px]">#{o._id.slice(-8).toUpperCase()}</p>
                                                            <p className="text-[10px] text-slate-500 mt-0.5">{new Date(o.date).toLocaleDateString()}</p>
                                                        </td>
                                                        <td className="p-3 text-[11px] text-slate-600">
                                                            <span className="font-semibold text-slate-800">{o.address?.firstName}</span> • {o.address?.city}
                                                        </td>
                                                        <td className="p-3 text-right">
                                                            <p className="font-bold text-slate-900 text-xs">{currency}{o.riderEarnings || o.deliveryFee || 40}</p>
                                                            <p className={`text-[9px] font-bold uppercase tracking-wider mt-0.5 ${o.status === 'Delivered' ? 'text-emerald-600' : o.status === 'Cancelled' ? 'text-rose-500' : 'text-blue-600'}`}>{o.status}</p>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ==========================================
                🟢 EDIT RIDER MODAL
                ========================================== */}
            <AnimatePresence>
                {showEdit && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{scale:0.95, opacity:0, y:10}} animate={{scale:1, opacity:1, y:0}} exit={{scale:0.95, opacity:0, y:10}} className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-200">
                            <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2"><Edit size={16} className="text-slate-500"/> Edit Details</h3>
                                <button onClick={()=>setShowEdit(false)} className="p-1.5 text-slate-400 hover:bg-slate-200 rounded-md transition-colors"><X size={16}/></button>
                            </div>
                            <form onSubmit={handleUpdate} className="p-6 space-y-4">
                                <div>
                                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Full Name</label>
                                    <input required className="w-full border border-slate-300 p-2.5 rounded-lg mt-1.5 text-sm font-medium text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-shadow" value={editData.name} onChange={e=>setEditData({...editData, name:e.target.value})} />
                                </div>
                                <div>
                                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Vehicle Number</label>
                                    <input required className="w-full border border-slate-300 p-2.5 rounded-lg mt-1.5 text-sm font-bold font-mono text-slate-800 uppercase focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-shadow" placeholder="MH12 AB 1234" value={editData.vehicleNumber} onChange={e=>setEditData({...editData, vehicleNumber:e.target.value})} />
                                </div>
                                <div>
                                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Phone Number</label>
                                    <input type="tel" className="w-full border border-slate-300 p-2.5 rounded-lg mt-1.5 text-sm font-medium text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-shadow" value={editData.phone} onChange={e=>setEditData({...editData, phone:e.target.value})} placeholder="Optional" />
                                </div>
                                <div>
                                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Email Address</label>
                                    <input type="email" disabled className="w-full border border-slate-200 p-2.5 rounded-lg mt-1.5 text-sm font-medium text-slate-400 bg-slate-50 cursor-not-allowed" value={editData.email} />
                                    <p className="text-[9px] text-slate-400 mt-1 font-bold">Email cannot be changed (Auth Linked)</p>
                                </div>
                                <button className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-all active:scale-95 shadow-sm flex items-center justify-center gap-2 mt-2 text-sm">
                                    <Save size={16}/> Save Changes
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

        </motion.div>
    );
};

export default AllRiders;
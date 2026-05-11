import React, { useEffect, useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import toast from 'react-hot-toast';
import { 
    Trash2, Edit, X, Save, Calendar, ShieldBan, CheckCircle, 
    ArrowUpCircle, Eye, ShoppingCart, MapPin, Landmark, 
    CreditCard, Banknote, Clock, Package, Activity, User
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AllUsers = () => {
    const { axios, currency, role: currentUserRole } = useAppContext();
    const [users, setUsers] = useState([]);
    
    // Modals
    const [showEdit, setShowEdit] = useState(false);
    const [showPromote, setShowPromote] = useState(false);
    const [showDeepView, setShowDeepView] = useState(false); 
    
    // Data State
    const [selectedUser, setSelectedUser] = useState(null); 
    const [newRole, setNewRole] = useState('seller'); // Default to seller
    const [editData, setEditData] = useState({ userId: '', name: '', email: '', phone: '' });
    const [deepData, setDeepData] = useState(null); 

    const fetchUsers = async () => {
        try {
            const { data } = await axios.get('/api/user/admin/users?role=user');
            if (data.success) setUsers(data.users); 
        } catch (error) { 
            toast.error("Failed to load users"); 
        }
    };

    // 🟢 Fetch Deep Info
    const fetchDeepInfo = async (user) => {
        const loadToast = toast.loading("Loading CRM Analytics...");
        try {
            const { data } = await axios.post('/api/user/admin/deep-view', { targetUserId: user._id });
            if (data.success) {
                toast.dismiss(loadToast);
                setDeepData(data.data);
                setSelectedUser(user);
                setShowDeepView(true);
            } else {
                toast.error(data.message, { id: loadToast });
            }
        } catch (error) { 
            toast.error("Analytics fetch failed", { id: loadToast }); 
        }
    };

    // 🟢 Update Basic Info
    const handleUpdate = async (e) => {
        e.preventDefault();
        const loadToast = toast.loading("Updating user...");
        try {
            const { data } = await axios.post('/api/user/admin/update', editData);
            if (data.success) {
                toast.success("User updated", { id: loadToast });
                setShowEdit(false);
                fetchUsers();
            } else {
                toast.error(data.message, { id: loadToast });
            }
        } catch (error) { 
            toast.error("Update failed", { id: loadToast }); 
        }
    };

    // 🟢 Promote Role (WITH BULLETPROOF PAYLOAD FIX)
    const handlePromote = async (e) => {
        e.preventDefault();
        
        // Security Check: Block normal Admins from creating other Admins
        if (newRole === 'admin' && currentUserRole !== 'superadmin') {
            return toast.error("Only Super Admin can promote someone to Admin.");
        }
        
        const loadToast = toast.loading(`Promoting to ${newRole}...`);
        try {
            // 🟢 CRITICAL FIX: Send both 'role' and 'newRole' to satisfy any backend variations
            const payload = { 
                userId: selectedUser._id, 
                role: newRole, 
                newRole: newRole 
            };

            const { data } = await axios.post('/api/user/admin/update', payload);
            
            if (data.success) {
                toast.success(`User successfully promoted to ${newRole.toUpperCase()}!`, { id: loadToast });
                setShowPromote(false);
                // Refresh list: The user will now disappear from here and move to Sellers/Riders
                fetchUsers(); 
            } else {
                toast.error(data.message, { id: loadToast });
            }
        } catch (error) { 
            toast.error("Promotion failed", { id: loadToast }); 
        }
    };

    const toggleBan = async (id) => {
        if(!window.confirm("Change user ban status?")) return;
        try {
            const { data } = await axios.post('/api/user/admin/block', { userId: id });
            if (data.success) { 
                toast.success(data.message); 
                fetchUsers(); 
            }
        } catch (error) { 
            toast.error("Action failed"); 
        }
    };

    const handleDelete = async (id) => {
        if(!window.confirm("Delete user permanently? This removes them from Auth completely.")) return;
        try {
            const { data } = await axios.post('/api/user/admin/delete', { id });
            if (data.success) { 
                toast.success("User deleted"); 
                fetchUsers(); 
            }
        } catch (error) { 
            toast.error("Delete failed"); 
        }
    };

    useEffect(() => { fetchUsers(); }, []);

    // Helper to calculate recent spend
    const calculateRecentSpend = (orders) => {
        if (!orders) return 0;
        return orders.filter(o => o.payment).reduce((acc, curr) => acc + curr.amount, 0);
    };

    return (
        <motion.div initial={{opacity:0}} animate={{opacity:1}} className="space-y-6 relative font-outfit pb-20">
            
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <User size={24} className="text-indigo-600"/> Customer Management
                </h2>
                <p className="text-sm text-slate-500 bg-white px-4 py-2 rounded-full shadow-sm font-bold border border-slate-200">
                    Total: {users.length}
                </p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-black tracking-widest border-b border-slate-200">
                            <tr>
                                <th className="p-5">User Details</th>
                                <th className="p-5">Status</th>
                                <th className="p-5">Joined</th>
                                <th className="p-5 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
                            {users.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="p-8 text-center text-slate-400">No customers found.</td>
                                </tr>
                            ) : users.map((user) => (
                                <tr key={user._id} className="hover:bg-slate-50/80 transition-colors">
                                    <td className="p-5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-sm shrink-0 border border-indigo-200">
                                                {user.name?.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-900 text-sm">{user.name}</span>
                                                <span className="text-[11px] text-slate-500 mt-0.5">{user.email}</span>
                                                <span className="text-[9px] text-slate-400 font-mono mt-1 tracking-wider uppercase">{user.clerkId || 'No Auth ID'}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-5">
                                        {user.isBlocked ? (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded border bg-red-50 text-red-600 border-red-200 text-[10px] font-black tracking-wider uppercase">
                                                <ShieldBan size={10}/> Banned
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded border bg-emerald-50 text-emerald-600 border-emerald-200 text-[10px] font-black tracking-wider uppercase">
                                                <CheckCircle size={10}/> Active
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-5 text-slate-500 text-xs font-bold tracking-wide">
                                        <div className="flex items-center gap-1.5"><Calendar size={14} className="text-slate-400"/> {new Date(user.createdAt).toLocaleDateString()}</div>
                                    </td>
                                    <td className="p-5">
                                        <div className="flex items-center justify-center gap-2">
                                            <button onClick={() => fetchDeepInfo(user)} className="p-2 text-blue-600 bg-blue-50 border border-blue-100 hover:bg-blue-100 rounded-lg transition-colors shadow-sm" title="View Deep Analytics">
                                                <Eye size={16} />
                                            </button>

                                            <button onClick={() => { setSelectedUser(user); setNewRole('seller'); setShowPromote(true); }} className="px-3 py-2 text-indigo-700 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 rounded-lg transition-colors font-bold text-xs flex items-center gap-1.5 shadow-sm" title="Promote User">
                                                <ArrowUpCircle size={14} /> Promote
                                            </button>
                                            
                                            <button onClick={() => { setEditData({ userId: user._id, name: user.name, email: user.email, phone: user.phone || '' }); setShowEdit(true); }} className="p-2 text-slate-500 bg-white border border-slate-200 hover:text-slate-800 hover:bg-slate-50 rounded-lg transition-colors shadow-sm" title="Edit Info">
                                                <Edit size={16} />
                                            </button>
                                            
                                            <button onClick={() => toggleBan(user._id)} className={`p-2 border rounded-lg transition-colors shadow-sm ${user.isBlocked ? 'text-emerald-600 bg-emerald-50 border-emerald-200 hover:bg-emerald-100' : 'text-amber-600 bg-amber-50 border-amber-200 hover:bg-amber-100'}`} title={user.isBlocked ? "Unban User" : "Ban User"}>
                                                <ShieldBan size={16} />
                                            </button>
                                            
                                            <button onClick={() => handleDelete(user._id)} className="p-2 text-rose-600 bg-rose-50 border border-rose-100 hover:bg-rose-100 rounded-lg transition-colors shadow-sm" title="Delete User">
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
                🟢 DEEP VIEW MODAL (CRM ANALYTICS)
                ========================================== */}
            <AnimatePresence>
                {showDeepView && deepData && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 md:p-8">
                        <motion.div initial={{scale:0.95, opacity:0}} animate={{scale:1, opacity:1}} exit={{scale:0.95, opacity:0}} className="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col border border-slate-200">
                            
                            <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50 shrink-0">
                                <div>
                                    <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2"><Activity size={18} className="text-blue-600"/> Customer Analytics Profile</h3>
                                    <p className="text-[11px] text-slate-500 font-bold mt-1 uppercase tracking-widest">{deepData.user.name} | {deepData.user.email}</p>
                                </div>
                                <button onClick={() => setShowDeepView(false)} className="p-2 bg-white rounded-md text-slate-400 hover:text-slate-800 shadow-sm border border-slate-200 transition-colors"><X size={18}/></button>
                            </div>

                            <div className="p-6 overflow-y-auto space-y-6 bg-slate-50/50 flex-1 hide-scrollbar">
                                
                                {/* KPI Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5"><ShoppingCart size={14} className="text-emerald-500"/> Recent Value (Last 10)</p>
                                        <p className="text-2xl font-bold text-slate-900">{currency}{calculateRecentSpend(deepData.orders).toLocaleString()}</p>
                                        <p className="text-[11px] text-slate-400 mt-1 font-medium">{deepData.orders.length} total recorded orders</p>
                                    </div>
                                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5"><Package size={14} className="text-indigo-500"/> Live Cart State</p>
                                        <p className="text-2xl font-bold text-slate-900">{Object.keys(deepData.cart).length}</p>
                                        <p className="text-[11px] text-slate-400 mt-1 font-medium">Unique items in active cart</p>
                                    </div>
                                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5"><Calendar size={14} className="text-blue-500"/> Account Age</p>
                                        <p className="text-2xl font-bold text-slate-900">{new Date(deepData.user.createdAt).toLocaleDateString()}</p>
                                        <p className="text-[11px] text-slate-400 mt-1 font-medium">Joined platform</p>
                                    </div>
                                </div>

                                {/* Latest Order Highlight (If they have one) */}
                                {deepData.orders.length > 0 && (
                                    <div className="bg-blue-50 border border-blue-100 p-5 rounded-xl">
                                        <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">Most Recent Purchase Snapshot</p>
                                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                            <div>
                                                <p className="text-base font-bold text-slate-900">Order #{deepData.orders[0]._id.slice(-8).toUpperCase()}</p>
                                                <p className="text-xs text-slate-600 mt-1"><span className="font-semibold text-slate-800">Placed:</span> {new Date(deepData.orders[0].date).toLocaleString()}</p>
                                                {deepData.orders[0].deliveredAt && (
                                                    <p className="text-xs text-slate-600 mt-0.5"><span className="font-semibold text-slate-800">Delivered:</span> {new Date(deepData.orders[0].deliveredAt).toLocaleString()}</p>
                                                )}
                                            </div>
                                            
                                            <div className="flex flex-col items-end gap-2 bg-white p-3.5 rounded-lg border border-blue-50 shadow-sm w-full md:w-auto">
                                                <p className="text-lg font-black text-slate-900">{currency}{deepData.orders[0].amount}</p>
                                                <div className="flex gap-2">
                                                    <span className={`px-2 py-1 text-[9px] font-bold uppercase tracking-wider rounded border ${deepData.orders[0].status === 'Delivered' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                                                        {deepData.orders[0].status}
                                                    </span>
                                                    <span className={`flex items-center gap-1 px-2 py-1 text-[9px] font-bold uppercase tracking-wider rounded border ${deepData.orders[0].paymentMethod === 'COD' ? 'bg-slate-100 text-slate-700 border-slate-300' : 'bg-indigo-50 text-indigo-700 border-indigo-200'}`}>
                                                        {deepData.orders[0].paymentMethod === 'COD' ? <Banknote size={10}/> : <CreditCard size={10}/>} 
                                                        {deepData.orders[0].paymentMethod}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Logistics Grid */}
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    
                                    {/* Addresses */}
                                    <div className="lg:col-span-1 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col max-h-[300px]">
                                        <div className="p-4 border-b border-slate-100 bg-slate-50">
                                            <h3 className="font-bold text-slate-800 text-xs flex items-center gap-2"><MapPin size={14} className="text-rose-500"/> Saved Logistics Data</h3>
                                        </div>
                                        <div className="p-4 overflow-y-auto hide-scrollbar space-y-3">
                                            {deepData.addresses.length === 0 ? (
                                                <p className="text-xs text-slate-400 text-center py-4">No saved addresses.</p>
                                            ) : deepData.addresses.map((addr, i) => (
                                                <div key={i} className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                                                    <p className="font-bold text-xs text-slate-900">{addr.firstName} {addr.lastName}</p>
                                                    <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">{addr.street}, {addr.city} {addr.zipcode}</p>
                                                    <p className="text-[10px] font-bold text-slate-500 mt-2 tracking-wider">📞 {addr.phone}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Full Order Ledger */}
                                    <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col max-h-[300px]">
                                        <div className="p-4 border-b border-slate-100 bg-slate-50">
                                            <h3 className="font-bold text-slate-800 text-xs flex items-center gap-2"><Clock size={14} className="text-emerald-500"/> Order Ledger (Last 10)</h3>
                                        </div>
                                        <div className="overflow-y-auto hide-scrollbar flex-1">
                                            <table className="w-full text-left text-sm">
                                                <thead className="bg-white sticky top-0 border-b border-slate-100 shadow-sm">
                                                    <tr>
                                                        <th className="p-3 text-[9px] text-slate-500 uppercase tracking-widest font-bold">Order ID / Date</th>
                                                        <th className="p-3 text-[9px] text-slate-500 uppercase tracking-widest font-bold">Items</th>
                                                        <th className="p-3 text-[9px] text-slate-500 uppercase tracking-widest font-bold text-right">Value / Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {deepData.orders.length === 0 ? (
                                                        <tr><td colSpan="3" className="p-6 text-center text-slate-400 text-xs">No order history found.</td></tr>
                                                    ) : deepData.orders.map((o, i) => (
                                                        <tr key={i} className="hover:bg-slate-50 transition-colors">
                                                            <td className="p-3">
                                                                <p className="font-bold text-slate-800 text-[11px]">#{o._id.slice(-8).toUpperCase()}</p>
                                                                <p className="text-[10px] text-slate-500 mt-0.5">{new Date(o.date).toLocaleDateString()}</p>
                                                            </td>
                                                            <td className="p-3 text-[11px] font-medium text-slate-600">
                                                                {o.items.length} items
                                                            </td>
                                                            <td className="p-3 text-right">
                                                                <p className="font-bold text-slate-900 text-xs">{currency}{o.amount}</p>
                                                                <p className={`text-[9px] font-bold uppercase tracking-wider mt-0.5 ${o.status === 'Delivered' ? 'text-emerald-600' : o.status === 'Cancelled' ? 'text-rose-500' : 'text-amber-600'}`}>{o.status}</p>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ==========================================
                🟢 EDIT USER MODAL
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
                                    <input required className="w-full border border-slate-300 p-2.5 rounded-lg mt-1.5 text-sm font-medium text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-shadow" value={editData.name} onChange={e=>setEditData({...editData, name:e.target.value})} />
                                </div>
                                <div>
                                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Email Address</label>
                                    <input type="email" required className="w-full border border-slate-300 p-2.5 rounded-lg mt-1.5 text-sm font-medium text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-shadow" value={editData.email} onChange={e=>setEditData({...editData, email:e.target.value})} />
                                </div>
                                <div>
                                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Phone Number</label>
                                    <input type="tel" className="w-full border border-slate-300 p-2.5 rounded-lg mt-1.5 text-sm font-medium text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-shadow" value={editData.phone} onChange={e=>setEditData({...editData, phone:e.target.value})} placeholder="Optional" />
                                </div>
                                <button className="w-full bg-slate-900 text-white font-bold py-3 rounded-lg hover:bg-slate-800 transition-all active:scale-95 shadow-sm flex items-center justify-center gap-2 mt-2 text-sm">
                                    <Save size={16}/> Save Changes
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ==========================================
                🟢 PROMOTE ROLE MODAL
                ========================================== */}
            <AnimatePresence>
                {showPromote && selectedUser && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{scale:0.95, opacity:0, y:10}} animate={{scale:1, opacity:1, y:0}} exit={{scale:0.95, opacity:0, y:10}} className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl border-t-4 border-indigo-500">
                            <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2"><ArrowUpCircle size={16} className="text-indigo-600"/> Promote User</h3>
                                <button onClick={() => setShowPromote(false)} className="p-1.5 text-slate-400 hover:bg-slate-200 rounded-md transition-colors"><X size={16}/></button>
                            </div>
                            <form onSubmit={handlePromote} className="p-6 space-y-5">
                                <p className="text-sm text-slate-600">Assign a new role to <b className="text-slate-900">{selectedUser.name}</b></p>
                                
                                <div>
                                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Select New Role</label>
                                    <select 
                                        value={newRole} 
                                        onChange={(e) => setNewRole(e.target.value)}
                                        className="w-full border border-slate-300 p-3 rounded-lg font-bold text-slate-800 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white shadow-sm cursor-pointer"
                                    >
                                        <option value="seller">Store Seller</option>
                                        <option value="rider">Delivery Rider</option>
                                        
                                        {/* Only show 'Admin' promotion option if the logged in user is a Superadmin */}
                                        {currentUserRole === 'superadmin' && (
                                            <option value="admin">System Admin</option>
                                        )}
                                    </select>
                                </div>

                                <button className="w-full bg-indigo-600 text-white font-bold py-3 rounded-lg hover:bg-indigo-700 transition-all active:scale-95 shadow-md flex items-center justify-center gap-2 text-sm mt-2">
                                    <ArrowUpCircle size={16}/> Confirm Promotion
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

        </motion.div>
    );
};

export default AllUsers;
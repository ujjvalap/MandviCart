import React, { useEffect, useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import toast from 'react-hot-toast';
import { 
    Trash2, X, ShieldBan, Key, Search, ShieldCheck, 
    Mail, Calendar, Activity, AlertTriangle, Shield, Info, UserCog
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AllAdmins = () => {
    const { axios, user: currentUser } = useAppContext();
    const [admins, setAdmins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    
    // Modals & Forms
    const [showPass, setShowPass] = useState(false);
    const [showRoleModal, setShowRoleModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [newPassword, setNewPassword] = useState("");
    const [newRole, setNewRole] = useState("admin");

    const fetchAdmins = async () => {
        try {
            setLoading(true);
            const { data } = await axios.get('/api/user/admin/users?role=admin');
            if (data.success) setAdmins(data.users);
        } catch (error) { 
            toast.error("Failed to load administrators"); 
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if(newPassword.length < 8) return toast.error("Password must be at least 8 characters");

        const loadToast = toast.loading("Updating security credentials via Clerk...");
        try {
            const { data } = await axios.post('/api/user/admin/reset-password', { userId: selectedUser._id, newPassword });
            if (data.success) { 
                toast.success("Security credentials updated", { id: loadToast }); 
                setShowPass(false); 
                setNewPassword(""); 
                setSelectedUser(null);
            } 
            else toast.error(data.message, { id: loadToast });
        } catch (error) { 
            toast.error("Update failed", { id: loadToast }); 
        }
    };

    // 🟢 Bulletproof Role Demotion Logic
    const handleRoleChange = async (e) => {
        e.preventDefault();
        if (newRole === selectedUser.role) return toast.error("User is already an Admin.");
        
        const loadToast = toast.loading(`Updating access level to ${newRole.toUpperCase()}...`);
        try {
            // 🟢 CRITICAL FIX: Send both 'role' and 'newRole' to satisfy any backend variations
            const payload = { 
                userId: selectedUser._id, 
                role: newRole, 
                newRole: newRole 
            };

            const { data } = await axios.post('/api/user/admin/update', payload);

            if (data.success) { 
                toast.success(`Administrator demoted to ${newRole.toUpperCase()}`, { id: loadToast }); 
                setShowRoleModal(false); 
                setSelectedUser(null);
                fetchAdmins(); // Will remove them from this list since they are no longer an admin
            } else {
                toast.error(data.message, { id: loadToast });
            }
        } catch (error) { 
            toast.error("Role update failed", { id: loadToast }); 
        }
    };

    const toggleBan = async (id, currentStatus) => {
        if(!window.confirm(`Are you sure you want to ${currentStatus ? 'RESTORE' : 'SUSPEND'} this administrator?`)) return;
        try {
            const { data } = await axios.post('/api/user/admin/block', { userId: id });
            if (data.success) { 
                toast.success(data.message); 
                fetchAdmins(); 
            }
        } catch (error) { 
            toast.error("Action failed"); 
        }
    };

    const handleDelete = async (id) => {
        if(!window.confirm("CRITICAL WARNING: This will permanently delete this administrator from the Database AND Clerk. Proceed?")) return;
        try {
            const { data } = await axios.post('/api/user/admin/delete', { id });
            if (data.success) { 
                toast.success("Administrator permanently removed"); 
                fetchAdmins(); 
            }
        } catch (error) { 
            toast.error("Deletion failed"); 
        }
    };

    useEffect(() => { fetchAdmins(); }, []);

    const filteredAdmins = admins.filter(admin => 
        admin.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        admin.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const activeCount = admins.filter(a => !a.isBlocked).length;
    const bannedCount = admins.filter(a => a.isBlocked).length;

    return (
        <div className="space-y-6 pb-20 max-w-7xl mx-auto">
            
            {/* 🟢 HEADER & METRICS */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Shield size={24} className="text-indigo-600"/> Administrator Protocols
                    </h1>
                    <p className="text-xs text-slate-500 mt-1 font-bold uppercase tracking-widest">Manage system access and credentials</p>
                </div>
                
                <div className="bg-slate-50 border border-slate-200 px-6 py-2.5 rounded-xl flex gap-6 w-full md:w-auto justify-center shadow-sm">
                    <div className="text-center"><p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total</p><p className="text-base font-black text-slate-800">{admins.length}</p></div>
                    <div className="w-px bg-slate-200"></div>
                    <div className="text-center"><p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active</p><p className="text-base font-black text-emerald-600">{activeCount}</p></div>
                    <div className="w-px bg-slate-200"></div>
                    <div className="text-center"><p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Restricted</p><p className="text-base font-black text-rose-600">{bannedCount}</p></div>
                </div>
            </div>

            {/* 🟢 INFO BANNER */}
            <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-start sm:items-center gap-3 text-blue-800 text-xs font-medium shadow-sm">
                <Info size={18} className="text-blue-600 shrink-0 mt-0.5 sm:mt-0"/>
                <p className="leading-relaxed"><strong>Clerk Auth Sync Active:</strong> To grant a new employee Administrative access, they must first register a standard account via the public portal. You can then promote them securely from the <b className="text-blue-900 font-bold">Customer Management</b> module.</p>
            </div>

            {/* 🟢 SEARCH */}
            <div className="relative w-full max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                    type="text" 
                    placeholder="Search administrators by name or email..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
                />
            </div>

            {/* 🟢 ENTERPRISE DATA TABLE */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] uppercase tracking-widest font-black">
                            <tr>
                                <th className="p-5">Personnel Detail</th>
                                <th className="p-5">Security Status</th>
                                <th className="p-5">Access Level</th>
                                <th className="p-5">Onboarded</th>
                                <th className="p-5 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
                            {loading ? (
                                <tr><td colSpan="5" className="p-10 text-center text-slate-400 font-bold tracking-wider uppercase text-xs">Syncing personnel records...</td></tr>
                            ) : filteredAdmins.length === 0 ? (
                                <tr><td colSpan="5" className="p-10 text-center text-slate-400 font-bold tracking-wider uppercase text-xs">No personnel records found.</td></tr>
                            ) : filteredAdmins.map(admin => (
                                <tr key={admin._id} className="hover:bg-slate-50/80 transition-colors group">
                                    <td className="p-5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-700 font-black text-sm shrink-0">
                                                {admin.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="text-slate-900 font-bold text-sm flex items-center gap-2">
                                                    {admin.name} 
                                                    {admin._id === currentUser?._id && <span className="text-[9px] bg-slate-800 text-white px-1.5 py-0.5 rounded uppercase tracking-widest">Current Session</span>}
                                                </p>
                                                <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5"><Mail size={10}/> {admin.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    
                                    <td className="p-5">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded border text-[10px] font-black uppercase tracking-wider ${admin.isBlocked ? 'bg-rose-50 text-rose-600 border-rose-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200'}`}>
                                            {admin.isBlocked ? <AlertTriangle size={10}/> : <Activity size={10}/>}
                                            {admin.isBlocked ? 'Suspended' : 'Active'}
                                        </span>
                                    </td>

                                    <td className="p-5">
                                        <span className="text-[10px] font-black text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded uppercase tracking-widest flex items-center gap-1.5 w-max">
                                            <ShieldCheck size={12}/> Admin
                                        </span>
                                    </td>

                                    <td className="p-5">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-slate-700">{new Date(admin.createdAt || Date.now()).toLocaleDateString()}</span>
                                            <span className="text-[9px] text-slate-400 flex items-center gap-1 mt-1 font-bold uppercase tracking-wider"><Calendar size={10}/> System Record</span>
                                        </div>
                                    </td>

                                    <td className="p-5 text-right">
                                        <div className="flex items-center justify-center gap-2">
                                            {/* Cannot Demote, Ban, or Delete Yourself */}
                                            {admin._id !== currentUser?._id ? (
                                                <>
                                                    <button 
                                                        onClick={() => { setSelectedUser(admin); setNewRole(admin.role); setShowRoleModal(true); }} 
                                                        className="p-2 bg-white border border-slate-200 text-slate-500 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 rounded-lg transition-colors shadow-sm" 
                                                        title="Demote Administrator"
                                                    >
                                                        <UserCog size={16}/>
                                                    </button>

                                                    <button 
                                                        onClick={() => { setSelectedUser(admin); setShowPass(true); }} 
                                                        className="p-2 bg-white border border-slate-200 text-slate-500 hover:text-amber-600 hover:border-amber-200 hover:bg-amber-50 rounded-lg transition-colors shadow-sm" 
                                                        title="Force Credentials Reset"
                                                    >
                                                        <Key size={16}/>
                                                    </button>

                                                    <button 
                                                        onClick={() => toggleBan(admin._id, admin.isBlocked)} 
                                                        className={`p-2 bg-white border border-slate-200 rounded-lg transition-colors shadow-sm ${admin.isBlocked ? 'text-emerald-600 hover:border-emerald-200 hover:bg-emerald-50' : 'text-orange-500 hover:border-orange-200 hover:bg-orange-50'}`}
                                                        title={admin.isBlocked ? "Restore Access" : "Suspend Access"}
                                                    >
                                                        <ShieldBan size={16}/>
                                                    </button>

                                                    <button 
                                                        onClick={() => handleDelete(admin._id)} 
                                                        className="p-2 bg-white border border-slate-200 text-slate-500 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 rounded-lg transition-colors shadow-sm" 
                                                        title="Terminate Record"
                                                    >
                                                        <Trash2 size={16}/>
                                                    </button>
                                                </>
                                            ) : (
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 py-1 bg-slate-50 border border-slate-100 rounded-md">Action Locked</span>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ==========================================
                🟢 ROLE MODIFICATION MODAL (Demotion)
                ========================================== */}
            <AnimatePresence>
                {showRoleModal && selectedUser && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ scale: 0.95, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 10 }} className="bg-white rounded-2xl w-full max-w-sm shadow-2xl border border-slate-200 overflow-hidden">
                            <div className="bg-slate-50 p-5 border-b border-slate-200 flex justify-between items-center">
                                <div>
                                    <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2"><UserCog size={16} className="text-blue-600"/> Modify Access Level</h3>
                                    <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1 font-bold">{selectedUser?.email}</p>
                                </div>
                                <button onClick={() => setShowRoleModal(false)} className="p-1.5 text-slate-400 hover:bg-slate-200 rounded-md transition-colors"><X size={16}/></button>
                            </div>
                            
                            <form onSubmit={handleRoleChange} className="p-6 space-y-5">
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3">Demote System Admin To:</label>
                                    <div className="space-y-2.5">
                                        {['admin', 'seller', 'rider', 'user'].map(r => (
                                            <label key={r} className={`flex items-center gap-3 p-3.5 border rounded-xl cursor-pointer transition-all shadow-sm ${newRole === r ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'border-slate-200 bg-white hover:bg-slate-50'}`}>
                                                <input 
                                                    type="radio" 
                                                    name="roleGroup" 
                                                    value={r} 
                                                    checked={newRole === r} 
                                                    onChange={() => setNewRole(r)} 
                                                    className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                                                />
                                                <span className={`text-sm font-bold capitalize ${newRole === r ? 'text-blue-900' : 'text-slate-700'}`}>{r}</span>
                                            </label>
                                        ))}
                                    </div>
                                    <p className="text-[10px] font-bold text-amber-600 mt-4 flex items-center gap-1.5 bg-amber-50 p-2.5 rounded-lg border border-amber-100"><AlertTriangle size={14} className="shrink-0"/> Warning: Demoting will immediately revoke system privileges.</p>
                                </div>
                                <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-xl text-sm font-bold hover:bg-blue-700 transition-all active:scale-95 shadow-md flex items-center justify-center gap-2">Execute Demotion</button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ==========================================
                🟢 RESET PASSWORD MODAL (Clerk Auth override)
                ========================================== */}
            <AnimatePresence>
                {showPass && selectedUser && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ scale: 0.95, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 10 }} className="bg-white rounded-2xl w-full max-w-sm shadow-2xl border border-slate-200 overflow-hidden">
                            <div className="bg-slate-50 p-5 border-b border-slate-200 flex justify-between items-center">
                                <div>
                                    <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2"><Key size={16} className="text-amber-600"/> Security Override</h3>
                                    <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1 font-bold">{selectedUser?.email}</p>
                                </div>
                                <button onClick={() => setShowPass(false)} className="p-1.5 text-slate-400 hover:bg-slate-200 rounded-md transition-colors"><X size={16}/></button>
                            </div>
                            
                            <form onSubmit={handleChangePassword} className="p-6 space-y-5">
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">New Access Key</label>
                                    <input 
                                        required 
                                        placeholder="Minimum 8 characters required" 
                                        type="text" 
                                        className="w-full bg-white border border-slate-300 p-3 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 text-sm font-bold text-slate-800 shadow-sm transition-shadow" 
                                        value={newPassword} 
                                        onChange={e => setNewPassword(e.target.value)} 
                                    />
                                    <p className="text-[10px] text-slate-500 mt-2 font-medium leading-relaxed">This will instantly overwrite the administrator's password in the central Clerk Authentication database.</p>
                                </div>
                                <button type="submit" className="w-full bg-amber-500 text-white py-3 rounded-xl text-sm font-bold hover:bg-amber-600 transition-all active:scale-95 shadow-md flex items-center justify-center gap-2"><Shield size={16}/> Force Credentials Reset</button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

        </div>
    );
};

export default AllAdmins;
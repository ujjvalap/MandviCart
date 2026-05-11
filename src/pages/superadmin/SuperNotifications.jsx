import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import toast from 'react-hot-toast';
import { Send, Bell, Users, Store, Bike, ShieldCheck, User } from 'lucide-react';
import { motion } from 'framer-motion';

const SuperNotifications = () => {
    const { axios } = useAppContext();
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [target, setTarget] = useState('all'); 
    const [targetEmail, setTargetEmail] = useState(''); // 🟢 NEW: For specific users
    const [loading, setLoading] = useState(false);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!title || !message) return toast.error("Please fill all announcement fields");
        if (target === 'specific' && !targetEmail) return toast.error("Please enter the user's email");
        
        setLoading(true);
        try {
            // Include targetEmail in the payload if 'specific' is selected
            const payload = { title, message, target, email: target === 'specific' ? targetEmail : null };
            
            const { data } = await axios.post('/api/user/super/announce', payload);
            if (data.success) {
                toast.success(`Message securely sent! 🚀`);
                setTitle(''); setMessage(''); setTargetEmail('');
            } else { toast.error(data.message); }
        } catch (error) { toast.error("Failed to send message"); } finally { setLoading(false); }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-8 pb-20">
            <div>
                <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3 tracking-tight">
                    <div className="p-2.5 bg-purple-100 text-purple-600 rounded-xl"><Bell size={24}/></div> 
                    System Broadcasts
                </h1>
                <p className="text-slate-500 mt-2 font-medium">Deploy instant push notifications to user dashboards.</p>
            </div>

            <form onSubmit={handleSend} className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-slate-200 space-y-8 relative overflow-hidden">
                {/* Decorative Blur */}
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-purple-50 rounded-full blur-3xl pointer-events-none"></div>

                <div className="relative z-10">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-4">Select Target Audience</label>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        {[
                            { id: 'all', label: 'Everyone', icon: Users }, 
                            { id: 'user', label: 'Customers', icon: ShieldCheck }, 
                            { id: 'seller', label: 'Sellers', icon: Store }, 
                            { id: 'rider', label: 'Riders', icon: Bike },
                            { id: 'specific', label: 'Direct Msg', icon: User } // 🟢 NEW OPTION
                        ].map((role) => (
                            <div 
                                key={role.id} 
                                onClick={() => setTarget(role.id)} 
                                className={`cursor-pointer rounded-xl border-2 p-3 flex flex-col items-center justify-center gap-2 transition-all duration-200 text-center
                                ${target === role.id ? 'border-purple-600 bg-purple-50 text-purple-700 shadow-sm' : 'border-slate-100 hover:border-slate-300 text-slate-500 hover:bg-slate-50'}`}
                            >
                                <role.icon size={20} className={target === role.id ? 'animate-bounce' : ''}/> 
                                <span className="text-[11px] font-bold">{role.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 🟢 NEW: Show Email Input if Specific User is selected */}
                {target === 'specific' && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="relative z-10">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">Target User Email</label>
                        <input 
                            type="email"
                            required
                            value={targetEmail} 
                            onChange={e => setTargetEmail(e.target.value)} 
                            placeholder="e.g., user@mandvicart.com" 
                            className="w-full border border-slate-200 bg-slate-50 p-3.5 rounded-xl focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none transition-all font-medium text-sm" 
                        />
                    </motion.div>
                )}

                <div className="relative z-10">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">Message Title</label>
                    <input 
                        required
                        value={title} 
                        onChange={e => setTitle(e.target.value)} 
                        placeholder="e.g. Critical System Update" 
                        className="w-full border border-slate-200 bg-slate-50 p-3.5 rounded-xl focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none transition-all font-bold text-sm text-slate-800" 
                    />
                </div>
                
                <div className="relative z-10">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">Full Message</label>
                    <textarea 
                        required
                        value={message} 
                        onChange={e => setMessage(e.target.value)} 
                        rows={5} 
                        placeholder="Type the full announcement or message here..." 
                        className="w-full border border-slate-200 bg-slate-50 p-3.5 rounded-xl focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none resize-none transition-all font-medium text-sm text-slate-700" 
                    />
                </div>
                
                <button disabled={loading} className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-70 relative z-10">
                    {loading ? "Transmitting..." : <><Send size={18}/> Deploy Message</>}
                </button>
            </form>
        </div>
    );
};
export default SuperNotifications;
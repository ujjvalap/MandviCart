import React, { useEffect, useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import toast from 'react-hot-toast';
import { Save, IndianRupee, Truck, AlertTriangle, RefreshCcw } from 'lucide-react';

const SystemSettings = () => {
    const { axios } = useAppContext();
    const [settings, setSettings] = useState({ platformFeePercent: 0, deliveryFee: 0, freeDeliveryThreshold: 0, maintenanceMode: false });
    const [loading, setLoading] = useState(false);

    const fetchSettings = async () => {
        try {
            const { data } = await axios.get('/api/user/super/settings');
            if (data.success) setSettings(data.settings);
        } catch (error) { toast.error("Failed to load settings"); }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { data } = await axios.post('/api/user/super/settings', settings);
            if (data.success) toast.success("Configuration Saved");
        } catch (error) { toast.error("Update failed"); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchSettings(); }, []);

    return (
        <div className="max-w-3xl mx-auto space-y-8 pb-12">
            <div>
                <h1 className="text-3xl font-black text-slate-800 tracking-tight">System Configuration</h1>
                <p className="text-slate-500 mt-1 font-medium">Manage global platform variables and emergency controls.</p>
            </div>

            <form onSubmit={handleUpdate} className="space-y-6">
                
                {/* Financials Card */}
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                    <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg"><IndianRupee size={20}/></div> Financials
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-600">Platform Fee (%)</label>
                            <input 
                                type="number" 
                                step="0.1" 
                                value={settings.platformFeePercent} 
                                onChange={e => setSettings({...settings, platformFeePercent: e.target.value})} 
                                className="w-full border-slate-200 border bg-slate-50 p-3 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium" 
                            />
                            <p className="text-xs text-slate-400 font-medium">Percentage taken from every seller payout.</p>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-600">Base Delivery Fee</label>
                            <input 
                                type="number" 
                                value={settings.deliveryFee} 
                                onChange={e => setSettings({...settings, deliveryFee: e.target.value})} 
                                className="w-full border-slate-200 border bg-slate-50 p-3 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium" 
                            />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-sm font-bold text-slate-600">Free Delivery Threshold</label>
                            <div className="relative">
                                <Truck size={18} className="absolute top-3.5 left-3.5 text-slate-400"/>
                                <input 
                                    type="number" 
                                    value={settings.freeDeliveryThreshold} 
                                    onChange={e => setSettings({...settings, freeDeliveryThreshold: e.target.value})} 
                                    className="w-full border-slate-200 border bg-slate-50 p-3 pl-10 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium" 
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Danger Zone */}
                <div className="bg-red-50 p-8 rounded-3xl border border-red-100">
                    <h3 className="text-lg font-bold text-red-800 mb-6 flex items-center gap-2">
                        <AlertTriangle size={20}/> Danger Zone
                    </h3>
                    <div className="flex items-center justify-between bg-white p-5 rounded-2xl border border-red-100 shadow-sm">
                        <div>
                            <h4 className="font-bold text-slate-800">Maintenance Mode</h4>
                            <p className="text-sm text-slate-500 mt-1 font-medium">Stops all user orders. Admin access remains active.</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                                type="checkbox" 
                                checked={settings.maintenanceMode} 
                                onChange={e => setSettings({...settings, maintenanceMode: e.target.checked})} 
                                className="sr-only peer" 
                            />
                            <div className="w-14 h-7 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-red-500"></div>
                        </label>
                    </div>
                </div>

                <div className="flex justify-end">
                    <button 
                        disabled={loading} 
                        className="bg-slate-900 text-white px-8 py-4 rounded-xl font-bold hover:bg-slate-800 transition shadow-xl shadow-slate-200 flex items-center gap-2 disabled:opacity-70"
                    >
                        {loading ? <RefreshCcw className="animate-spin" size={20}/> : <Save size={20}/>} 
                        {loading ? "SAVING..." : "SAVE CONFIGURATION"}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default SystemSettings;
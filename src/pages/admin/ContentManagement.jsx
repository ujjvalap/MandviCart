import React, { useEffect, useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Image, Trash2, Plus, Layout, Save, ImageIcon, Palette, Type } from 'lucide-react';

const ContentManagement = () => {
    const { axios, token } = useAppContext();
    
    // Data States
    const [banners, setBanners] = useState([]);
    
    // Add Banner Form State
    const [newBanner, setNewBanner] = useState({ title: '', subtitle: '', bgColor: '#f8fafc', image: null });
    const [previewImage, setPreviewImage] = useState(null);
    const [loading, setLoading] = useState(false);

    // --- FETCH DATA ---
    const fetchData = async () => {
        try {
            const bRes = await axios.get('/api/content/banners');
            if (bRes.data.success) setBanners(bRes.data.banners);
        } catch (error) { console.error("Fetch error"); }
    };

    useEffect(() => { fetchData(); }, []);

    // --- HANDLERS (HERO) ---
    const handleAddBanner = async (e) => {
        e.preventDefault();
        if(!newBanner.image) return toast.error("Please upload a banner image");
        const loadToast = toast.loading("Publishing new banner...");
        setLoading(true);
        const formData = new FormData();
        formData.append('title', newBanner.title);
        formData.append('subtitle', newBanner.subtitle);
        formData.append('bgColor', newBanner.bgColor);
        formData.append('image', newBanner.image);

        try {
            const { data } = await axios.post('/api/content/add-banner', formData, { headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` } });
            if(data.success) {
                toast.success("Banner published successfully!", { id: loadToast });
                setNewBanner({ title: '', subtitle: '', bgColor: '#f8fafc', image: null });
                setPreviewImage(null);
                fetchData();
            } else toast.error(data.message, { id: loadToast });
        } catch (error) { toast.error("Upload failed", { id: loadToast }); }
        finally { setLoading(false); }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setNewBanner({ ...newBanner, image: file });
            setPreviewImage(URL.createObjectURL(file));
        }
    };

    const handleDeleteBanner = async (id) => {
        if(!confirm("Remove this banner from the storefront?")) return;
        const loadToast = toast.loading("Removing banner...");
        try {
            const { data } = await axios.post('/api/content/delete-banner', { id }, { headers: { Authorization: `Bearer ${token}` } });
            if(data.success) { toast.success("Banner removed", { id: loadToast }); fetchData(); }
        } catch (error) { toast.error("Delete failed", { id: loadToast }); }
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-20 font-outfit">
            
            {/* 🟢 HEADER */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-100 sticky top-4 z-40">
                <div>
                    <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2"><Layout className="text-indigo-600"/> UI Content Manager</h2>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Manage Storefront Visuals</p>
                </div>
            </div>

            {/* 🟢 MAIN CONTENT AREA */}
            <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left Column: Form */}
                <div className="lg:col-span-1 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm h-fit">
                    <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
                        <div className="bg-indigo-50 p-2 rounded-lg text-indigo-600"><Plus size={20}/></div>
                        <h3 className="font-bold text-slate-800 text-lg">Create New Slide</h3>
                    </div>
                    
                    <form onSubmit={handleAddBanner} className="space-y-5">
                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1"><Type size={12}/> Main Title</label>
                            <input required placeholder="e.g. Fresh Organic Veggies" value={newBanner.title} onChange={e=>setNewBanner({...newBanner, title:e.target.value})} className="w-full border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm font-medium text-slate-800 bg-slate-50 focus:bg-white" />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1"><Type size={12}/> Subtitle</label>
                            <input required placeholder="e.g. Get Flat 30% Off Today" value={newBanner.subtitle} onChange={e=>setNewBanner({...newBanner, subtitle:e.target.value})} className="w-full border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm font-medium text-slate-800 bg-slate-50 focus:bg-white" />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1"><Palette size={12}/> Accent Color</label>
                            <div className="flex gap-3 items-center bg-slate-50 p-2 rounded-xl border border-slate-200">
                                <input type="color" value={newBanner.bgColor} onChange={e=>setNewBanner({...newBanner, bgColor:e.target.value})} className="h-10 w-12 cursor-pointer rounded border-0 p-0 bg-transparent" />
                                <span className="text-sm text-slate-600 font-mono font-bold">{newBanner.bgColor}</span>
                            </div>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1"><ImageIcon size={12}/> Product Image</label>
                            <div className={`border-2 border-dashed rounded-2xl p-2 flex flex-col items-center justify-center cursor-pointer transition-all ${previewImage ? 'border-indigo-400 bg-indigo-50/30' : 'border-slate-300 hover:border-indigo-300 bg-slate-50 hover:bg-slate-100'}`}>
                                <input type="file" id="bannerImg" className="hidden" onChange={handleImageChange} accept="image/*" />
                                <label htmlFor="bannerImg" className="cursor-pointer w-full flex flex-col items-center p-4">
                                    {previewImage ? (
                                        <div className="relative w-full h-36 flex items-center justify-center group">
                                            <img src={previewImage} alt="Preview" className="max-w-full max-h-full object-contain" />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 rounded-xl transition-opacity flex items-center justify-center"><span className="text-white text-xs font-bold px-3 py-1 bg-black/50 rounded-full">Click to change</span></div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center py-6">
                                            <div className="bg-white p-3 rounded-full shadow-sm mb-3 text-indigo-400"><Image size={24} /></div>
                                            <span className="text-sm text-slate-600 font-bold">Browse Image</span>
                                            <span className="text-[10px] text-slate-400 mt-1 font-medium">PNG or JPG with transparent bg works best</span>
                                        </div>
                                    )}
                                </label>
                            </div>
                        </div>
                        <button type="submit" disabled={loading} className="w-full bg-indigo-600 text-white py-3.5 rounded-xl font-bold hover:bg-indigo-700 transition active:scale-95 shadow-md flex items-center justify-center gap-2">
                            {loading ? "Publishing..." : <><Save size={18}/> Publish to Storefront</>}
                        </button>
                    </form>
                </div>

                {/* Right Column: Active Banners */}
                <div className="lg:col-span-2">
                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                        <h3 className="font-bold text-slate-800 text-lg mb-6 flex items-center gap-2">
                            Live Banners <span className="bg-slate-100 text-slate-500 text-xs px-2 py-0.5 rounded-full">{banners.length}</span>
                        </h3>
                        {banners.length === 0 ? (
                            <div className="text-center py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                <ImageIcon size={40} className="mx-auto text-slate-300 mb-3"/>
                                <p className="text-slate-500 font-bold text-sm">No banners active.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-5">
                                {banners.map((b) => (
                                    <div key={b._id} className="relative h-48 rounded-2xl overflow-hidden shadow-sm border border-slate-100 flex items-center transition-transform hover:shadow-md group" style={{backgroundColor: b.bgColor}}>
                                        <div className="p-8 flex-1 z-10 relative">
                                            <div className="absolute inset-0 bg-gradient-to-r from-white/60 to-transparent -z-10"></div>
                                            <span className="bg-white/80 backdrop-blur-sm px-2.5 py-1 rounded text-[9px] font-black uppercase tracking-widest text-slate-700 mb-3 inline-block border border-white">Live Preview</span>
                                            <h4 className="font-black text-2xl text-slate-900 leading-tight mb-1">{b.title}</h4>
                                            <p className="text-slate-700 font-bold text-sm bg-white/40 w-fit px-2 py-0.5 rounded">{b.subtitle}</p>
                                        </div>
                                        <img src={b.image} className="h-full w-1/2 object-contain absolute right-4 bottom-0 drop-shadow-xl group-hover:scale-105 transition-transform duration-500" alt="" />
                                        <button onClick={()=>handleDeleteBanner(b._id)} className="absolute top-4 right-4 bg-white/80 backdrop-blur-md p-2 rounded-lg text-slate-400 hover:bg-red-500 hover:text-white hover:border-red-500 border border-slate-200 shadow-sm transition-all z-20 flex items-center justify-center"><Trash2 size={16} /></button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default ContentManagement;
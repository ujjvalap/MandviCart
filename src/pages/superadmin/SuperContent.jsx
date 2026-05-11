import React, { useEffect, useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Image, Trash2, Plus, Layout, Save, X } from 'lucide-react';

const ContentManagement = () => {
    const { axios, token } = useAppContext();
    
    // Data States
    const [banners, setBanners] = useState([]);
    
    // Add Banner Form State
    const [newBanner, setNewBanner] = useState({ 
        title: '', subtitle: '', bgColor: '#f0fdf4', image: null 
    });
    const [previewImage, setPreviewImage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);

    // --- FETCH DATA ---
    const fetchData = async () => {
        try {
            setIsFetching(true);
            const bRes = await axios.get('/api/content/banners');
            if (bRes.data.success) setBanners(bRes.data.banners);
        } catch (error) { 
            toast.error("Failed to load banners");
        } finally {
            setIsFetching(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    // --- HANDLERS ---

    // 1. Hero Banner Upload
    const handleAddBanner = async (e) => {
        e.preventDefault();
        if(!newBanner.image) return toast.error("An image is required for the banner");

        const loadToast = toast.loading("Uploading new banner...");
        setLoading(true);
        
        const formData = new FormData();
        formData.append('title', newBanner.title);
        formData.append('subtitle', newBanner.subtitle);
        formData.append('bgColor', newBanner.bgColor);
        formData.append('image', newBanner.image);

        try {
            const { data } = await axios.post('/api/content/add-banner', formData, {
                headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` }
            });
            if(data.success) {
                toast.success("Banner Published Successfully!", { id: loadToast });
                setNewBanner({ title: '', subtitle: '', bgColor: '#f0fdf4', image: null });
                setPreviewImage(null);
                fetchData();
            } else {
                toast.error(data.message, { id: loadToast });
            }
        } catch (error) { 
            toast.error("Upload failed. Please try again.", { id: loadToast }); 
        } finally { 
            setLoading(false); 
        }
    };

    // Helper for Image Preview
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setNewBanner({ ...newBanner, image: file });
            setPreviewImage(URL.createObjectURL(file));
        }
    };

    // 2. Delete Banner
    const handleDeleteBanner = async (id) => {
        if(!window.confirm("Are you sure you want to delete this banner? It will be removed from the customer app immediately.")) return;
        
        const loadToast = toast.loading("Deleting banner...");
        try {
            const { data } = await axios.post('/api/content/delete-banner', { id }, { headers: { Authorization: `Bearer ${token}` } });
            if(data.success) { 
                toast.success("Banner deleted", { id: loadToast }); 
                fetchData(); 
            }
        } catch (error) { 
            toast.error("Delete failed", { id: loadToast }); 
        }
    };

    return (
        <div className="space-y-6 pb-12 w-full min-w-0">
            
            {/* 🟢 HEADER */}
            <div className="bg-white p-5 lg:p-6 rounded-2xl shadow-sm border border-slate-200/60 w-full">
                <h1 className="text-xl lg:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <Layout size={24} className="text-indigo-600"/> Content Manager
                </h1>
                <p className="text-xs text-slate-500 mt-1 font-bold uppercase tracking-widest">Manage active hero banners for the customer storefront</p>
            </div>

            {/* 🟢 MAIN GRID */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                
                {/* ==========================================
                    LEFT COLUMN: ADD BANNER FORM
                    ========================================== */}
                <div className="xl:col-span-1">
                    <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm xl:sticky xl:top-6">
                        <h3 className="font-bold text-slate-800 text-base mb-6 flex items-center gap-2 border-b border-slate-100 pb-3">
                            <Plus size={18} className="text-indigo-600"/> Create New Slide
                        </h3>
                        
                        <form onSubmit={handleAddBanner} className="space-y-5">
                            <div>
                                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Main Title</label>
                                <input 
                                    required 
                                    placeholder="e.g. Fresh Organic Veggies" 
                                    value={newBanner.title} 
                                    onChange={e=>setNewBanner({...newBanner, title:e.target.value})} 
                                    className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm font-bold text-slate-800 transition-all" 
                                />
                            </div>
                            
                            <div>
                                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Subtitle / Offer</label>
                                <input 
                                    required 
                                    placeholder="e.g. Flat 30% Off this weekend" 
                                    value={newBanner.subtitle} 
                                    onChange={e=>setNewBanner({...newBanner, subtitle:e.target.value})} 
                                    className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm font-bold text-slate-800 transition-all" 
                                />
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Background Color</label>
                                <div className="flex gap-3 items-center bg-slate-50 p-2 rounded-xl border border-slate-200">
                                    <input 
                                        type="color" 
                                        value={newBanner.bgColor} 
                                        onChange={e=>setNewBanner({...newBanner, bgColor:e.target.value})} 
                                        className="h-10 w-12 cursor-pointer rounded-lg border-0 p-0 bg-transparent" 
                                    />
                                    <span className="text-sm text-slate-600 font-mono font-bold uppercase">{newBanner.bgColor}</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Banner Image (Transparent PNG)</label>
                                <div className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-colors ${previewImage ? 'border-indigo-500 bg-indigo-50/50' : 'border-slate-300 bg-slate-50 hover:border-slate-400'}`}>
                                    <input type="file" id="bannerImg" className="hidden" onChange={handleImageChange} accept="image/*" />
                                    <label htmlFor="bannerImg" className="cursor-pointer w-full flex flex-col items-center">
                                        {previewImage ? (
                                            <div className="relative w-full h-32 flex items-center justify-center">
                                                <img src={previewImage} alt="Preview" className="h-full object-contain drop-shadow-md" />
                                                <button type="button" onClick={(e)=>{e.preventDefault(); setPreviewImage(null); setNewBanner({...newBanner, image:null})}} className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-1.5 shadow-md hover:bg-rose-600 transition-colors active:scale-95"><X size={14}/></button>
                                            </div>
                                        ) : (
                                            <div className="py-4 flex flex-col items-center">
                                                <Image className="text-slate-400 mb-2" size={32} />
                                                <span className="text-xs text-slate-500 font-bold">Click to upload image</span>
                                                <span className="text-[10px] text-slate-400 mt-1">PNG format recommended</span>
                                            </div>
                                        )}
                                    </label>
                                </div>
                            </div>

                            <button type="submit" disabled={loading} className="w-full bg-indigo-600 text-white py-3.5 rounded-xl font-bold hover:bg-indigo-700 transition-colors active:scale-95 shadow-md flex items-center justify-center gap-2 mt-2">
                                {loading ? "Uploading..." : <><Save size={18}/> Publish Banner to App</>}
                            </button>
                        </form>
                    </div>
                </div>

                {/* ==========================================
                    RIGHT COLUMN: ACTIVE BANNERS LIST
                    ========================================== */}
                <div className="xl:col-span-2 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="font-bold text-slate-800 text-base">Active Store Banners</h3>
                        <span className="text-[10px] font-bold bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-md border border-indigo-100">{banners.length} Live</span>
                    </div>
                    
                    {isFetching ? (
                        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200/60 shadow-sm">
                            <div className="w-8 h-8 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-3"></div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading Banners...</p>
                        </div>
                    ) : banners.length === 0 ? (
                        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-300 flex flex-col items-center justify-center">
                            <Layout size={40} className="text-slate-300 mb-3" />
                            <p className="text-sm font-bold text-slate-500">No active banners.</p>
                            <p className="text-xs text-slate-400 mt-1">Add your first banner using the form to display it on the customer app.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-5">
                            {banners.map((b) => (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                    key={b._id} 
                                    className="relative h-[200px] sm:h-[240px] rounded-2xl overflow-hidden shadow-sm border border-slate-200 flex items-center group" 
                                    style={{backgroundColor: b.bgColor}}
                                >
                                    {/* Text Content */}
                                    <div className="p-6 sm:p-10 flex-1 z-10 w-2/3">
                                        <span className="bg-white/60 backdrop-blur-md px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-wider text-slate-700 mb-3 inline-block border border-white/50 shadow-sm">Customer View</span>
                                        <h4 className="font-black text-2xl sm:text-3xl lg:text-4xl text-slate-900 leading-tight drop-shadow-sm">{b.title}</h4>
                                        <p className="text-slate-800 font-bold mt-2 text-sm sm:text-base drop-shadow-sm">{b.subtitle}</p>
                                    </div>
                                    
                                    {/* Image */}
                                    <div className="absolute right-0 bottom-0 h-full w-1/2 flex justify-end items-end p-4 pointer-events-none">
                                        <img src={b.image} className="h-[90%] w-auto object-contain drop-shadow-xl transform group-hover:scale-105 transition-transform duration-500" alt="Banner Graphic" />
                                    </div>
                                    
                                    {/* Delete Button */}
                                    <button 
                                        onClick={()=>handleDeleteBanner(b._id)} 
                                        className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm p-2.5 rounded-full text-slate-400 hover:bg-rose-500 hover:text-white shadow-md transition-colors z-20 active:scale-95 border border-white"
                                        title="Delete Banner"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
                
            </div>
        </div>
    );
};

export default ContentManagement;
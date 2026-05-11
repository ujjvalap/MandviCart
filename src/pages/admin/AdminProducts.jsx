import React, { useEffect, useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import toast from 'react-hot-toast';
import { Trash2, Edit, Plus, Clock, Calendar, CheckCircle, XCircle, AlertCircle, Package } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';

const AdminProducts = () => {
    const { axios, currency, token } = useAppContext();
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [activeTab, setActiveTab] = useState('live'); // 'live' | 'pending'
    const [loading, setLoading] = useState(true);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            // 🟢 SENIOR TRICK: Passing adminFetch=true so we get BOTH approved and pending products
            const { data } = await axios.get('/api/product/list?adminFetch=true');
            if (data.success) setProducts(data.products);
        } catch (error) { 
            toast.error("Error loading products"); 
        } finally {
            setLoading(false);
        }
    };

    // 🟢 NEW: Approve Product Function
    const approveProduct = async (id) => {
        const loadToast = toast.loading("Approving product...");
        try {
            const { data } = await axios.post('/api/product/approve', { id }, { headers: { Authorization: `Bearer ${token}` } });
            if (data.success) {
                toast.success(data.message, { id: loadToast });
                fetchProducts(); // Refresh the list to move it to the Live tab
            } else {
                toast.error(data.message, { id: loadToast });
            }
        } catch (error) {
            toast.error(error.message, { id: loadToast });
        }
    };

    const removeProduct = async (id) => {
        if(!window.confirm("Delete this product permanently? It will be removed from the seller's inventory too.")) return;
        try {
            const { data } = await axios.post('/api/product/remove', { id }, { headers: { Authorization: `Bearer ${token}` } });
            if (data.success) { 
                toast.success("Product Removed"); 
                fetchProducts(); 
            } else { 
                toast.error(data.message); 
            }
        } catch (error) { toast.error(error.message); }
    };

    useEffect(() => { fetchProducts(); }, []);

    // 🟢 Filter products based on approval status
    const liveProducts = products.filter(p => p.isApproved !== false);
    const pendingProducts = products.filter(p => p.isApproved === false);

    const displayProducts = activeTab === 'live' ? liveProducts : pendingProducts;

    return (
        <motion.div initial={{opacity:0}} animate={{opacity:1}} className="space-y-6 pb-20 font-outfit">
            
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-black text-slate-800 tracking-tight">Inventory Control</h2>
                    <p className="text-slate-500 font-medium mt-1">Review and manage seller products.</p>
                </div>
                <Link to="/admin/add-product" className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-xl shadow-slate-200 transition-all active:scale-95 w-full md:w-auto">
                    <Plus size={20} /> Internal Product
                </Link>
            </div>

            {/* 🟢 TABS */}
            <div className="flex bg-white p-1.5 rounded-xl shadow-sm border border-slate-200 w-max">
                <button 
                    onClick={() => setActiveTab('live')} 
                    className={`px-6 py-2.5 rounded-lg text-sm font-bold capitalize transition-all flex items-center gap-2 ${activeTab === 'live' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                    <CheckCircle size={16} className={activeTab === 'live' ? 'text-emerald-400' : ''}/> 
                    Live Store ({liveProducts.length})
                </button>
                <button 
                    onClick={() => setActiveTab('pending')} 
                    className={`px-6 py-2.5 rounded-lg text-sm font-bold capitalize transition-all flex items-center gap-2 ${activeTab === 'pending' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                    <Clock size={16} className={activeTab === 'pending' ? 'text-orange-400' : ''}/> 
                    Pending Approval 
                    {pendingProducts.length > 0 && <span className="bg-orange-500 text-white text-[10px] px-2 py-0.5 rounded-full ml-1">{pendingProducts.length}</span>}
                </button>
            </div>

            {/* 🟢 TABLE */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-100 text-slate-400 text-[10px] uppercase font-black tracking-widest">
                            <tr>
                                <th className="p-6">Product Details</th>
                                <th className="p-6">Category</th>
                                <th className="p-6">Pricing</th>
                                <th className="p-6">Seller Info</th>
                                <th className="p-6 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 text-sm">
                            {loading ? (
                                <tr><td colSpan="5" className="p-10 text-center text-slate-400 font-medium animate-pulse">Loading Inventory...</td></tr>
                            ) : displayProducts.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="p-16 text-center">
                                        <div className="flex flex-col items-center justify-center text-slate-400">
                                            {activeTab === 'pending' ? <AlertCircle size={40} className="mb-4 opacity-50 text-orange-400"/> : <Package size={40} className="mb-4 opacity-50"/>}
                                            <h3 className="text-lg font-bold text-slate-600">No {activeTab} products</h3>
                                            <p className="text-sm font-medium mt-1">You're all caught up!</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : displayProducts.map((item) => (
                                <tr key={item._id} className="hover:bg-slate-50/50 transition group">
                                    <td className="p-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 bg-white border border-slate-200 rounded-xl flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                                                <img src={item.image?.[0]} className="w-full h-full object-cover" alt="" />
                                            </div>
                                            <div>
                                                <span className="font-bold text-slate-800 text-base line-clamp-1">{item.name}</span>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1"><Calendar size={10}/> {new Date(item.createdAt).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    
                                    <td className="p-6">
                                        <span className="bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-200">
                                            {item.category}
                                        </span>
                                    </td>
                                    
                                    <td className="p-6">
                                        <div className="flex flex-col">
                                            <span className="font-black text-slate-900">{currency}{item.offerPrice}</span>
                                            {item.price > item.offerPrice && <span className="text-xs text-slate-400 line-through">MRP: {currency}{item.price}</span>}
                                        </div>
                                    </td>

                                    <td className="p-6">
                                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded border border-slate-100">
                                            {item.sellerId ? `ID: ${item.sellerId.slice(-6)}` : "Platform (Admin)"}
                                        </span>
                                    </td>
                                    
                                    <td className="p-6">
                                        <div className="flex items-center justify-center gap-3">
                                            
                                            {/* 🟢 APPROVE BUTTON (Only shows in Pending tab) */}
                                            {activeTab === 'pending' && (
                                                <button onClick={() => approveProduct(item._id)} className="bg-emerald-50 border border-emerald-200 text-emerald-600 px-4 py-2 rounded-xl text-sm font-bold hover:bg-emerald-100 transition-colors shadow-sm flex items-center gap-1.5" title="Approve & Publish">
                                                    <CheckCircle size={16} /> Approve
                                                </button>
                                            )}

                                            <button onClick={() => navigate(`/admin/edit-product/${item._id}`)} className="p-2.5 text-indigo-500 hover:bg-indigo-50 rounded-xl transition-all hover:scale-110" title="Edit">
                                                <Edit size={18} />
                                            </button>
                                            
                                            <button onClick={() => removeProduct(item._id)} className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all hover:scale-110" title={activeTab === 'pending' ? 'Reject & Delete' : 'Delete'}>
                                                {activeTab === 'pending' ? <XCircle size={18} /> : <Trash2 size={18} />}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </motion.div>
    );
};

export default AdminProducts;
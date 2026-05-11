import React, { useEffect, useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { 
    Edit, 
    Trash2, 
    Package, 
    Search, 
    RefreshCw, 
    AlertCircle 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ProductList = () => {
    const { currency, axios } = useAppContext();
    const navigate = useNavigate();
    
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Fetch ONLY this seller's products (Both Approved and Pending)
    const fetchSellerProducts = async () => {
        setIsRefreshing(true);
        try {
            const { data } = await axios.get('/api/product/seller-list');
            if (data.success) {
                setProducts(data.products);
            } else {
                toast.error(data.message || "Failed to load products");
            }
        } catch (error) {
            toast.error(error.response?.data?.message || error.message);
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    };

    // Toggle Stock Status
    const toggleStock = async (id, currentStock) => {
        // Optimistically update UI immediately for snappy UX
        setProducts(prev => prev.map(p => p._id === id ? { ...p, inStock: !currentStock } : p));
        
        try {
            const { data } = await axios.post('/api/product/stock', { id, inStock: !currentStock });
            if (data.success) {
                toast.success("Stock Status Updated");
            } else {
                // Revert if failed
                setProducts(prev => prev.map(p => p._id === id ? { ...p, inStock: currentStock } : p));
                toast.error(data.message);
            }
        } catch (error) {
            setProducts(prev => prev.map(p => p._id === id ? { ...p, inStock: currentStock } : p));
            toast.error(error.message);
        }
    };

    // Remove Product
    const removeProduct = async (id) => {
        if (!window.confirm("Are you sure you want to permanently delete this product?")) return;
        
        try {
            const { data } = await axios.post('/api/product/remove', { id });
            if (data.success) {
                toast.success("Product removed successfully");
                // Remove from state instantly without reloading the whole page
                setProducts(prev => prev.filter(p => p._id !== id)); 
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    useEffect(() => {
        fetchSellerProducts();
    }, []);

    // Filter products based on search input
    const filteredProducts = products.filter(p => 
        p.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        p.category?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Render Table Skeleton during initial load
    if (loading) {
        return (
            <div className="space-y-6 pb-10">
                <div className="flex justify-between items-center"><h2 className="text-2xl font-bold text-slate-800">My Inventory</h2></div>
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-6 border-b border-slate-100"><div className="w-64 h-10 bg-slate-100 animate-pulse rounded-xl"></div></div>
                    <div className="p-6 space-y-4">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="w-full h-16 bg-slate-50 animate-pulse rounded-xl"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-10 font-outfit max-w-7xl mx-auto">
            
            {/* Header & Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">My Inventory</h2>
                    <p className="text-sm text-slate-500 font-medium mt-1">Manage your products, pricing, and stock.</p>
                </div>
                
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-64">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="Search products..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white border border-slate-200 pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-sm"
                        />
                    </div>
                    <button 
                        onClick={fetchSellerProducts} 
                        className="p-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 hover:text-indigo-600 transition-colors shadow-sm"
                        title="Refresh Inventory"
                    >
                        <RefreshCw size={18} className={isRefreshing ? "animate-spin" : ""} />
                    </button>
                </div>
            </div>

            {/* Empty State / Table */}
            {products.length === 0 ? (
                <motion.div 
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center justify-center py-32 bg-white rounded-3xl border-2 border-dashed border-slate-200 shadow-sm"
                >
                    <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-6">
                        <Package className="w-10 h-10 text-indigo-400" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800">Your inventory is empty</h3>
                    <p className="text-slate-500 font-medium mt-2 mb-8 text-center max-w-sm">
                        You haven't listed any products yet. Add your first product to start selling!
                    </p>
                    <button onClick={() => navigate('/seller/add-product')} className="px-8 py-3 bg-slate-900 text-white rounded-full font-bold hover:scale-105 transition-transform shadow-lg shadow-slate-900/20">
                        + Add First Product
                    </button>
                </motion.div>
            ) : (
                <div className="bg-white rounded-3xl shadow-[0_2px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-100 overflow-hidden">
                    
                    {/* No Search Results State */}
                    {filteredProducts.length === 0 && (
                        <div className="p-16 flex flex-col items-center justify-center text-center">
                            <AlertCircle className="w-12 h-12 text-slate-300 mb-4" />
                            <p className="text-lg font-bold text-slate-700">No matching products found</p>
                            <p className="text-sm text-slate-500">Try adjusting your search term.</p>
                        </div>
                    )}

                    {filteredProducts.length > 0 && (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50/80 border-b border-slate-100 text-slate-500 text-xs uppercase font-black tracking-wider">
                                    <tr>
                                        <th className="p-5 pl-6 rounded-tl-3xl">Product Details</th>
                                        <th className="p-5">Category</th>
                                        <th className="p-5">Price</th>
                                        <th className="p-5">Status</th>
                                        <th className="p-5 text-center pr-6 rounded-tr-3xl">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 text-sm font-medium text-slate-700">
                                    <AnimatePresence>
                                        {filteredProducts.map((product) => (
                                            <motion.tr 
                                                key={product._id} 
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0, x: -20, backgroundColor: "#fef2f2" }}
                                                className="hover:bg-slate-50/50 transition-colors group"
                                            >
                                                <td className="p-4 pl-6 flex items-center gap-4">
                                                    <div className="relative w-14 h-14 bg-white rounded-xl border border-slate-100 flex items-center justify-center overflow-hidden shadow-sm group-hover:border-indigo-200 transition-colors shrink-0">
                                                        <img 
                                                            src={product.image?.[0] || 'https://via.placeholder.com/150'} 
                                                            alt={product.name} 
                                                            className="w-full h-full object-cover" 
                                                        />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <p className="font-bold text-slate-900 text-base line-clamp-1">{product.name}</p>
                                                            
                                                            {/* 🟢 NEW: Pending Approval Badge */}
                                                            {product.isApproved === false && (
                                                                <span className="bg-orange-100 text-orange-700 text-[10px] font-black px-2 py-0.5 rounded-md border border-orange-200 uppercase tracking-widest whitespace-nowrap shadow-sm">
                                                                    Review Pending
                                                                </span>
                                                            )}
                                                        </div>
                                                        {product.variants && product.variants.length > 1 && (
                                                            <span className="inline-block mt-1 text-[10px] font-black bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-md border border-indigo-100 tracking-wide uppercase">
                                                                {product.variants.length} Variants
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-lg text-xs font-bold border border-slate-200">
                                                        {product.category || "Uncategorized"}
                                                    </span>
                                                </td>
                                                <td className="p-4 font-black text-slate-900">
                                                    {currency}{product.offerPrice || product.price || 0}
                                                </td>
                                                <td className="p-4">
                                                    <label className="relative inline-flex items-center cursor-pointer">
                                                        <input 
                                                            type="checkbox" 
                                                            className="sr-only peer" 
                                                            checked={product.inStock} 
                                                            onChange={() => toggleStock(product._id, product.inStock)}
                                                        />
                                                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500 shadow-inner"></div>
                                                        <span className={`ml-3 text-xs font-bold uppercase tracking-wider ${product.inStock ? 'text-emerald-600' : 'text-slate-400'}`}>
                                                            {product.inStock ? "Active" : "Out"}
                                                        </span>
                                                    </label>
                                                </td>
                                                <td className="p-4 pr-6 text-center">
                                                    <div className="flex items-center justify-center gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                                        <button 
                                                            onClick={() => navigate(`/seller/edit-product/${product._id}`)} 
                                                            className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-xl transition-all hover:scale-110"
                                                            title="Edit Product"
                                                        >
                                                            <Edit size={18} />
                                                        </button>

                                                        <button 
                                                            onClick={() => removeProduct(product._id)} 
                                                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all hover:scale-110"
                                                            title="Delete Product"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        ))}
                                    </AnimatePresence>
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ProductList;
import React, { useContext, useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import ProductCard from '../components/ProductCard';
import { ChevronDown, Search, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Collection = () => {
    const { category: urlCategory } = useParams(); 
    const { products, search, setSearch, navigate } = useContext(AppContext);
    
    const [filterProducts, setFilterProducts] = useState([]);
    const [sortType, setSortType] = useState('relevant');
    const [loading, setLoading] = useState(true);
    
    // Tracks selected SubCategory
    const [activeSubCategory, setActiveSubCategory] = useState('all');

    const activeCategory = urlCategory ? urlCategory.toLowerCase() : 'all';

    // 🟢 UPGRADED: 100% DYNAMIC Categories & Subcategories & Images!
    // No more assets.js. This scans your DB dynamically.
    const dynamicCategoryData = useMemo(() => {
        if (!products || products.length === 0) return [];
        const catMap = {};

        products.forEach(p => {
            if (!p.category) return;
            const cText = p.category;
            const cLower = cText.toLowerCase();

            if (!catMap[cLower]) {
                catMap[cLower] = { 
                    text: cText, 
                    // Steal the first product's image to represent the category!
                    image: p.image?.[0] || 'https://via.placeholder.com/150', 
                    count: 0, 
                    subCategories: new Set() 
                };
            }
            catMap[cLower].count++;
            if (p.subCategory) catMap[cLower].subCategories.add(p.subCategory);
        });

        // Convert Map to Array and Sort Alphabetically
        return Object.values(catMap).sort((a, b) => a.text.localeCompare(b.text));
    }, [products]);

    // Derived Subcategories for the currently active category
    const activeSubcategoriesList = useMemo(() => {
        if (activeCategory === 'all') return [];
        const currentData = dynamicCategoryData.find(c => c.text.toLowerCase() === activeCategory);
        return currentData ? Array.from(currentData.subCategories).sort() : [];
    }, [activeCategory, dynamicCategoryData]);

    // Client-Side Filtering
    useEffect(() => {
        setLoading(true);
        setTimeout(() => {
            let filtered = products.slice();

            // 1. Category Filter
            if (activeCategory !== 'all') {
                filtered = filtered.filter(item => item.category?.toLowerCase() === activeCategory);
            }

            // 2. Sub-Category Filter
            if (activeSubCategory !== 'all') {
                filtered = filtered.filter(item => item.subCategory?.toLowerCase() === activeSubCategory.toLowerCase());
            }

            // 3. Search Filter
            if (search) {
                filtered = filtered.filter(item => item.name.toLowerCase().includes(search.toLowerCase()));
            }

            // 4. Sort
            switch (sortType) {
                case 'low-high': filtered.sort((a, b) => (a.offerPrice || a.price) - (b.offerPrice || b.price)); break;
                case 'high-low': filtered.sort((a, b) => (b.offerPrice || b.price) - (a.offerPrice || a.price)); break;
                default: break;
            }

            setFilterProducts(filtered);
            setLoading(false);
        }, 300); 
    }, [products, activeCategory, activeSubCategory, search, sortType]);

    const handleCategoryClick = (categoryName) => {
        setActiveSubCategory('all'); // Reset subcategory when changing parent category
        if (categoryName === 'all') navigate('/products'); 
        else navigate(`/products/${categoryName.toLowerCase()}`); 
    };

    const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
    const itemVariant = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } };

    return (
        <div className="bg-gray-50/50 min-h-screen font-outfit pt-8 pb-20">
            <div className="max-w-7xl mx-auto px-4 md:px-8">
                
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-end mb-6 gap-4">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">Shop Collection</h1>
                        <p className="text-gray-500 mt-1 text-sm md:text-base">Showing <span className="font-bold text-gray-900">{filterProducts.length}</span> items</p>
                    </div>
                    <div className="relative w-full md:w-auto">
                        <select onChange={(e) => setSortType(e.target.value)} className="w-full md:w-56 appearance-none bg-white border border-gray-200 rounded-xl px-4 py-3 pr-10 text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500/20 cursor-pointer shadow-sm">
                            <option value="relevant">Sort by: Relevant</option>
                            <option value="low-high">Price: Low to High</option>
                            <option value="high-low">Price: High to Low</option>
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                    </div>
                </div>

                {/* 🟢 DYNAMIC CATEGORY BAR */}
                <div className="flex gap-3 overflow-x-auto scrollbar-hide py-2 items-center pb-4 snap-x">
                    <button onClick={() => handleCategoryClick('all')} className={`flex-shrink-0 px-6 py-3 rounded-full font-bold text-sm transition-all duration-300 snap-start ${activeCategory === 'all' ? 'bg-black text-white shadow-lg scale-105' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'}`}>
                        All Products
                    </button>
                    {dynamicCategoryData.map((cat, idx) => {
                        const isActive = activeCategory === cat.text.toLowerCase();
                        return (
                            <button key={idx} onClick={() => handleCategoryClick(cat.text)} className={`flex-shrink-0 pl-2 pr-5 py-2 rounded-full font-bold text-sm transition-all duration-300 flex items-center gap-3 snap-start ${isActive ? 'bg-green-600 text-white shadow-lg shadow-green-600/30 scale-105 ring-4 ring-green-50' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300'}`}>
                                <div className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden bg-white">
                                    <img src={cat.image} alt="" className="w-full h-full object-cover" />
                                </div>
                                {cat.text}
                                <span className={`text-[10px] px-2 py-0.5 rounded-full ml-1 ${isActive ? 'bg-white text-green-700' : 'bg-gray-100 text-gray-500'}`}>{cat.count}</span>
                            </button>
                        )
                    })}
                </div>

                {/* 🟢 SUB-CATEGORY FILTERS (Appears magically when category has sub-categories!) */}
                <AnimatePresence>
                    {activeSubcategoriesList.length > 0 && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="flex flex-wrap gap-2 mb-8 border-t border-gray-200 pt-4">
                            <span className="flex items-center text-xs font-bold text-gray-400 uppercase tracking-widest mr-2"><ArrowRight size={14} className="mr-1"/> Sub Categories:</span>
                            <button onClick={() => setActiveSubCategory('all')} className={`text-xs font-bold px-4 py-1.5 rounded-lg border transition-colors ${activeSubCategory === 'all' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}>All</button>
                            {activeSubcategoriesList.map((sub, i) => (
                                <button key={i} onClick={() => setActiveSubCategory(sub)} className={`text-xs font-bold px-4 py-1.5 rounded-lg border transition-colors ${activeSubCategory === sub ? 'bg-green-50 border-green-200 text-green-700' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}>{sub}</button>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* PRODUCT GRID */}
                <div className={`${activeSubcategoriesList.length === 0 && 'mt-6'}`}>
                    {loading ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {[...Array(8)].map((_, i) => <div key={i} className="aspect-[3/4] bg-gray-200 rounded-3xl animate-pulse" />)}
                        </div>
                    ) : filterProducts.length > 0 ? (
                        <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-y-10 gap-x-4 md:gap-x-6">
                            {filterProducts.map((item, index) => (
                                <motion.div key={index} variants={itemVariant}><ProductCard product={item} /></motion.div>
                            ))}
                        </motion.div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 md:py-32 text-center bg-white rounded-3xl border-2 border-dashed border-gray-200">
                            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6"><Search size={32} className="text-gray-300" /></div>
                            <h3 className="text-xl font-bold text-gray-900">No products found</h3>
                            <button onClick={() => { handleCategoryClick('all'); setSearch(''); }} className="mt-6 px-8 py-3 bg-black text-white rounded-full font-bold hover:scale-105 transition-transform">Clear All Filters</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Collection;
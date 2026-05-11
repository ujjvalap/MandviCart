import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../context/AppContext';
import ProductCard from './ProductCard'; 
import { ArrowRight, TrendingUp, Sparkles, RefreshCw } from 'lucide-react'; 
import { motion } from 'framer-motion';

const BestSeller = () => {
    const { products, navigate } = useContext(AppContext);
    const [bestSellers, setBestSellers] = useState([]);

    // 🧠 SMART HYBRID ALGORITHM
    useEffect(() => {
        if (products && products.length > 0) {
            
            // 1. Get products explicitly marked as 'bestseller' by Admin/Seller
            const priorityProducts = products.filter(item => item.bestseller);
            
            // 2. Get all other regular products
            const standardProducts = products.filter(item => !item.bestseller);
            
            // 3. Randomly shuffle the standard products to give them all a chance to be seen
            const shuffledStandard = standardProducts.sort(() => 0.5 - Math.random());
            
            // 4. Combine them (Priority first, then random fill) and take the top 5
            const combinedDisplay = [...priorityProducts, ...shuffledStandard].slice(0, 5);
            
            setBestSellers(combinedDisplay);
        }
    }, [products]);

    // Animation Variants
    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariant = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 50 } }
    };

    return (
        <section className="mx-4 md:mx-16 lg:mx-32 mt-32 mb-20">
            {/* Header */}
            <div className="text-center mb-16 relative">
                <motion.div 
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-100 to-amber-100 text-orange-700 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-4 shadow-sm"
                >
                    <TrendingUp size={14} /> Trending Today
                </motion.div>
                
                <motion.h2 
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-4xl md:text-5xl font-black text-gray-900 mb-4 tracking-tight"
                >
                    Customer Favorites
                </motion.h2>
                
                <motion.div 
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                    className="flex flex-col items-center justify-center text-gray-500 max-w-xl mx-auto text-lg gap-2"
                >
                    <p>Top-rated daily essentials loved by thousands of families.</p>
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5 bg-gray-100 px-3 py-1 rounded-md">
                        <RefreshCw size={12} className="text-gray-500" /> Catalog Auto-Rotates
                    </span>
                </motion.div>
            </div>

            {/* Grid with Staggered Animation */}
            <motion.div 
                variants={container}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-50px" }}
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-y-10 gap-x-6"
            >
                {bestSellers.map((item, index) => (
                    <motion.div key={item._id || index} variants={itemVariant}>
                        <ProductCard product={item} />
                    </motion.div>
                ))}
            </motion.div>

            {/* CTA Button */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="flex justify-center mt-16"
            >
                <button
                    onClick={() => { navigate('/products'); window.scrollTo(0,0); }}
                    className="group relative px-10 py-4 bg-gray-900 text-white rounded-full font-bold shadow-2xl shadow-gray-400/50 hover:shadow-gray-400/80 hover:-translate-y-1 transition-all duration-300 flex items-center gap-3 overflow-hidden"
                >
                    <span className="relative z-10 flex items-center gap-2">
                        Explore Full Collection <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform"/>
                    </span>
                    {/* Hover Shine Effect */}
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out" />
                </button>
            </motion.div>
        </section>
    );
};

export default BestSeller;
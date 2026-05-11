import React, { useContext, useMemo, useState } from 'react';
import { AppContext } from '../context/AppContext';
import ProductCard from './ProductCard';
import { Sparkles, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const NewArrivals = () => {
  const { products, navigate } = useContext(AppContext);
  const [hoveredId, setHoveredId] = useState(null);

  // Get newest products (last 6)
  const newArrivals = useMemo(() => {
    if (!products) return [];
    return [...products].reverse().slice(0, 6);
  }, [products]);

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } }
  };

  const itemVariant = {
    hidden: { opacity: 0, y: 30, scale: 0.9 },
    show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 60 } }
  };

  if (!newArrivals.length) return null;

  return (
    <section className="mx-4 md:mx-16 lg:mx-32 mt-32 mb-20 relative">
      {/* Background Gradient */}
      <div className="absolute -top-20 -left-32 w-96 h-96 bg-gradient-to-br from-pink-200 to-purple-200 rounded-full blur-3xl opacity-30 -z-10" />

      {/* Header */}
      <div className="text-center mb-16 relative z-10">
        <motion.div 
          initial={{ scale: 0, rotate: -180 }}
          whileInView={{ scale: 1, rotate: 0 }}
          viewport={{ once: true }}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-100 to-purple-100 text-purple-700 px-4 py-2 rounded-full text-xs font-bold uppercase mb-4 shadow-sm"
        >
          <Sparkles size={14} /> Just Arrived
        </motion.div>
        
        <motion.h2 
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-4xl md:text-5xl font-black text-gray-900 mb-4"
        >
          Latest Additions
        </motion.h2>
        
        <motion.p 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="text-gray-600 max-w-xl mx-auto"
        >
          Discover fresh, new products added to our collection this week.
        </motion.p>
      </div>

      {/* Products Grid */}
      <motion.div 
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-50px" }}
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-y-10 gap-x-6 mb-16"
      >
        {newArrivals.map((item) => (
          <motion.div 
            key={item._id}
            variants={itemVariant}
            onHoverStart={() => setHoveredId(item._id)}
            onHoverEnd={() => setHoveredId(null)}
          >
            <div className="relative">
              {/* New Badge */}
              <motion.div 
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: hoveredId === item._id ? 1.1 : 1, rotate: 0 }}
                className="absolute top-2 right-2 z-20 bg-gradient-to-r from-pink-500 to-purple-500 text-white px-3 py-1 rounded-full text-xs font-black shadow-lg"
              >
                NEW
              </motion.div>
              <ProductCard product={item} />
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* CTA Button */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="flex justify-center"
      >
        <button
          onClick={() => { navigate('/products'); window.scrollTo(0, 0); }}
          className="group relative px-10 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full font-bold shadow-2xl shadow-purple-400/50 hover:shadow-purple-400/80 hover:-translate-y-1 transition-all duration-300 flex items-center gap-3 overflow-hidden"
        >
          <span className="relative z-10 flex items-center gap-2">
            Shop All New Arrivals <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </span>
          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out" />
        </button>
      </motion.div>
    </section>
  );
};

export default NewArrivals;
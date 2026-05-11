import React from 'react';
import { motion } from 'framer-motion';
import { Users, Package, Truck, Award } from 'lucide-react';

const StatsBanner = () => {
  const stats = [
    { icon: Package, label: 'Products', value: '10K+', color: 'from-emerald-500 to-teal-500' },
    { icon: Users, label: 'Happy Customers', value: '50K+', color: 'from-blue-500 to-indigo-500' },
    { icon: Truck, label: 'Deliveries', value: '100K+', color: 'from-orange-500 to-red-500' },
    { icon: Award, label: '4.8★ Rating', value: 'Verified', color: 'from-yellow-500 to-amber-500' }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.2, delayChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.8 },
    show: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { type: "spring", stiffness: 100, damping: 15 }
    }
  };

  return (
    <section className="mx-4 md:mx-16 lg:mx-32 my-24 relative">
      {/* Background Decoration */}
      <div className="absolute inset-0 bg-gradient-to-r from-emerald-50 via-blue-50 to-purple-50 rounded-3xl -z-10 blur-3xl opacity-40" />
      
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-50px" }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6"
      >
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div 
              key={index}
              variants={itemVariants}
              whileHover={{ y: -5, scale: 1.05 }}
              className={`relative p-6 md:p-8 rounded-2xl bg-gradient-to-br ${stat.color} text-white shadow-xl overflow-hidden group cursor-default`}
            >
              {/* Hover Glow Effect */}
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
              
              {/* Icon Background Circle */}
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-white/20 rounded-full blur-xl group-hover:scale-150 transition-transform duration-500" />
              
              <div className="relative z-10">
                <div className="inline-flex p-3 bg-white/20 backdrop-blur-sm rounded-xl mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Icon size={24} className="text-white" />
                </div>
                
                <h3 className="text-3xl md:text-4xl font-black mb-1">{stat.value}</h3>
                <p className="text-white/80 font-medium text-sm md:text-base">{stat.label}</p>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </section>
  );
};

export default StatsBanner;
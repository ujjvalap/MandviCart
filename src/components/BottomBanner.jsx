import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { Truck, Leaf, Wallet, Heart, CheckCircle, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

// 🟢 Premium Default Store Image (Modern Grocery/Market Vibe)
const DEFAULT_STORE_IMAGE = "https://images.unsplash.com/photo-1534723452862-4c874018d66d?q=80&w=2070&auto=format&fit=crop";

const BottomBanner = () => {
    const { axios } = useContext(AppContext);
    const [bannerData, setBannerData] = useState(null);

    useEffect(() => {
        const fetchBanner = async () => {
            try {
                const { data } = await axios.get('/api/content/feature-banner');
                if (data.success && data.banner) {
                    setBannerData(data.banner);
                }
            } catch (error) {
                console.error("Failed to fetch banner");
            }
        };
        fetchBanner();
    }, [axios]);

    const getIcon = (iconName) => {
        switch (iconName?.toLowerCase()) {
            case 'truck': return <Truck className="text-white" size={24} />;
            case 'leaf': return <Leaf className="text-white" size={24} />;
            case 'wallet': return <Wallet className="text-white" size={24} />;
            case 'heart': return <Heart className="text-white" size={24} />;
            default: return <CheckCircle className="text-white" size={24} />;
        }
    };

    if (!bannerData) return <div className="h-64 bg-gray-50 animate-pulse mx-4 md:mx-16 lg:mx-32 my-20 rounded-3xl"></div>;

    // 🟢 Logic to use DB image ONLY if it's a real uploaded image, otherwise use our premium store image
    const isSampleImage = bannerData.mainImage?.includes('sample.jpg');
    const displayImage = (bannerData.mainImage && !isSampleImage) ? bannerData.mainImage : DEFAULT_STORE_IMAGE;

    return (
        <section className="mx-4 md:mx-16 lg:mx-32 my-24">
            <motion.div 
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="relative bg-gradient-to-br from-green-50 to-emerald-100/50 rounded-[2.5rem] p-8 md:p-12 overflow-hidden border border-green-100"
            >
                {/* Decorative Background Blurs */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-green-200/40 rounded-full blur-3xl -mr-20 -mt-20 mix-blend-multiply" />
                <div className="absolute bottom-0 left-0 w-72 h-72 bg-emerald-200/40 rounded-full blur-3xl -ml-20 -mb-20 mix-blend-multiply" />

                <div className="relative z-10 flex flex-col lg:flex-row items-center gap-12">
                    
                    {/* Left: Image with Float Animation */}
                    <motion.div 
                        className="lg:w-1/2 relative"
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                    >
                        <motion.div 
                            animate={{ y: [-10, 10, -10] }}
                            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                            className="relative z-10"
                        >
                            <img 
                                src={displayImage} 
                                alt="Our Store Quality" 
                                className="w-full h-[400px] object-cover rounded-3xl shadow-xl shadow-green-900/10 rotate-[-2deg] hover:rotate-0 transition-transform duration-500" 
                            />
                        </motion.div>
                        {/* Shadow Element */}
                        <div className="absolute -bottom-6 left-4 right-4 h-4 bg-black/20 blur-xl rounded-[100%]" />
                    </motion.div>

                    {/* Right: Content */}
                    <div className="lg:w-1/2">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/60 backdrop-blur-sm border border-green-100 text-green-700 text-xs font-bold uppercase tracking-wider mb-6"
                        >
                            <ShieldCheck size={14} /> Why Choose Us
                        </motion.div>

                        <motion.h2 
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.3 }}
                            className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-8 leading-tight"
                        >
                            {bannerData.mainTitle || "Freshness Delivered to Your Doorstep."}
                        </motion.h2>
                        
                        <div className="grid gap-6">
                            {bannerData.features?.map((item, index) => (
                                <motion.div 
                                    key={index} 
                                    initial={{ opacity: 0, x: 50 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: 0.4 + (index * 0.1) }}
                                    whileHover={{ scale: 1.02, x: 10 }}
                                    className="flex items-start gap-5 p-4 rounded-2xl bg-white/40 hover:bg-white/80 backdrop-blur-sm border border-white/50 transition-all duration-300 shadow-sm hover:shadow-md cursor-default"
                                >
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${index === 0 ? 'bg-green-500 shadow-green-200' : index === 1 ? 'bg-emerald-500 shadow-emerald-200' : 'bg-teal-500 shadow-teal-200'}`}>
                                        {getIcon(item.icon)}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 text-lg mb-1">{item.title}</h3>
                                        <p className="text-gray-600 text-sm leading-relaxed">{item.description}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            </motion.div>
        </section>
    );
};

export default BottomBanner;
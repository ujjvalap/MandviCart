import React from 'react';
import { Player } from '@lottiefiles/react-lottie-player';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppContext } from '../context/AppContext';

// 🟢 NEW: Import the JSON file directly from your assets folder!
// Make sure the file name exactly matches what you saved it as in your folder.
import fastCartAnimation from '../assets/fast-cart.json'; 

const GlobalCartAnimation = () => {
    const { isCartAnimating } = useAppContext();

    return (
        <AnimatePresence>
            {isCartAnimating && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    // z-[10000] ensures it sits on top of Navbars and Footers
                    className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm"
                >
                    <motion.div 
                        initial={{ scale: 0.8, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.8, y: 20 }}
                        className="bg-white rounded-[2rem] shadow-2xl p-8 flex flex-col items-center justify-center"
                    >
                        {/* 🟢 NEW: Use the imported JSON variable as the src */}
                        <Player
                            autoplay
                            keepLastFrame
                            src={fastCartAnimation} 
                            style={{ height: '160px', width: '160px' }}
                        />
                        <h2 className="text-2xl font-black text-slate-800 mt-2 mb-1">Added to Cart!</h2>
                        <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Fast Delivery</p>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default GlobalCartAnimation;
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, CheckCircle, Sparkles } from 'lucide-react';

const NewsletterBanner = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setSubmitted(true);
      setEmail('');
      setLoading(false);
      setTimeout(() => setSubmitted(false), 3000);
    }, 1000);
  };

  return (
    <section className="mx-4 md:mx-16 lg:mx-32 my-24">
      <motion.div 
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="relative bg-gradient-to-r from-emerald-500 via-green-500 to-teal-600 rounded-3xl p-12 md:p-20 overflow-hidden"
      >
        {/* Animated Background Elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-white/5 rounded-full blur-3xl -ml-32 -mb-32" />

        <div className="relative z-10 max-w-2xl mx-auto text-center">
          {/* Icon */}
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="inline-flex p-4 bg-white/20 backdrop-blur-md rounded-2xl mb-6"
          >
            <Sparkles className="text-white" size={32} />
          </motion.div>

          {/* Heading */}
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-4xl md:text-5xl font-black text-white mb-4 leading-tight"
          >
            Get Fresh Deals Every Week
          </motion.h2>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="text-white/90 text-lg mb-8 max-w-xl mx-auto"
          >
            Subscribe to our newsletter and receive exclusive offers, fresh produce updates, and seasonal promotions directly in your inbox.
          </motion.p>

          {/* Form */}
          <motion.form 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            onSubmit={handleSubmit}
            className="flex flex-col sm:flex-row gap-3 mb-4"
          >
            <div className="flex-1 relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60 z-10" size={20} />
              <input
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading || submitted}
                className="w-full pl-12 pr-4 py-4 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:bg-white/30 transition-all duration-300 disabled:opacity-50"
              />
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={loading || submitted}
              className="px-8 py-4 bg-white text-emerald-600 font-bold rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2 min-w-[140px]"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
              ) : submitted ? (
                <>
                  <CheckCircle size={20} /> Done!
                </>
              ) : (
                'Subscribe'
              )}
            </motion.button>
          </motion.form>

          {/* Success Message */}
          {submitted && (
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-white/80 text-sm"
            >
              ✅ Thanks for subscribing! Check your inbox for a special welcome offer.
            </motion.p>
          )}
        </div>
      </motion.div>
    </section>
  );
};

export default NewsletterBanner;
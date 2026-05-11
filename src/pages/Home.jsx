import React, { useEffect } from 'react'
import { motion } from 'framer-motion'
import HeroSlider from '../components/HeroSlider'
import Categories from '../components/Categories'
import BestSeller from '../components/BestSeller'
import FlashSale from '../components/FlashSale'
import BottomBanner from '../components/BottomBanner'
import KiteBackground from '../components/SeasonalBackground'
import StatsBanner from '../components/StatsBanner'
import NewsletterBanner from '../components/NewsletterBanner'
import TestimonialCarousel from '../components/TestimonialCarousel'
import NewArrivals from '../components/NewArrivals'

const Home = () => {
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className='bg-white relative overflow-hidden'
    >
      {/* Animated Background */}
      <KiteBackground />

      {/* Main Content */}
      <div className="relative z-10">
        {/* Hero Section */}
        <HeroSlider />
        
        {/* Categories Section */}
        <div className="mt-10">
          <Categories />
        </div>

        {/* Flash Sale Banner */}
        <FlashSale />

        {/* Best Sellers */}
        <BestSeller />

        {/* New Arrivals */}
        <NewArrivals />

        {/* Stats Section */}

        {/* Testimonials */}
        <TestimonialCarousel />

        {/* Bottom Banner */}
        <BottomBanner />

        {/* Newsletter Subscription */}
      </div>
    </motion.div>
  )
}

export default Home
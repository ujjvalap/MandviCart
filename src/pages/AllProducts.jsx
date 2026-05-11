import React, { useEffect, useState } from 'react'
import { useAppContext } from '../context/AppContext'
import ProductCard from '../components/ProductCard'
import FilterSidebar from '../components/FilterSidebar'
import { assets } from '../assets/assets'

const AllProducts = () => {
    const { products, searchQuery } = useAppContext()
    const [filteredProducts, setFilteredProducts] = useState([])
    const [filterCategory, setFilterCategory] = useState([])
    const [sortType, setSortType] = useState('relevant')
    const [showFilter, setShowFilter] = useState(false)

    useEffect(() => {
        let productsCopy = products.slice()
        if (searchQuery) productsCopy = productsCopy.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
        if (filterCategory.length > 0) productsCopy = productsCopy.filter(item => filterCategory.includes(item.category.toLowerCase()))
        
        switch (sortType) {
            case 'low-high': setFilteredProducts(productsCopy.sort((a, b) => (a.offerPrice - b.offerPrice))); break;
            case 'high-low': setFilteredProducts(productsCopy.sort((a, b) => (b.offerPrice - a.offerPrice))); break;
            default: setFilteredProducts(productsCopy); break;
        }
    }, [products, searchQuery, filterCategory, sortType])

    return (
        <div className='flex gap-4 pt-10 border-t border-gray-200 px-4 sm:px-[5vw]'>
            <div className='min-w-60'>
                 <div onClick={()=>setShowFilter(!showFilter)} className='flex items-center gap-2 cursor-pointer md:hidden py-2'>
                    <p className='text-lg font-bold'>FILTERS</p>
                    <img className={`h-3 sm:hidden ${showFilter ? 'rotate-90' : ''}`} src={assets.dropdown_icon} />
                 </div>
                 <FilterSidebar filterCategory={filterCategory} setFilterCategory={setFilterCategory} setSortType={setSortType} sortType={sortType} showFilter={showFilter} />
            </div>
            <div className='flex-1'>
                <div className='flex justify-between items-center text-base sm:text-2xl mb-4'><h2 className='font-medium uppercase'>All Collections</h2></div>
                <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 gap-y-6'>
                    {filteredProducts.map((item, index) => (<ProductCard key={index} product={item} />))}
                </div>
            </div>
        </div>
    )
}
export default AllProducts
import React from 'react'
import { categories } from '../assets/assets'

const FilterSidebar = ({ filterCategory, setFilterCategory, setSortType, showFilter }) => {
  const handleCategoryChange = (e) => {
    const value = e.target.value;
    if (value === 'All') setFilterCategory([]);
    else filterCategory.includes(value) ? setFilterCategory(prev => prev.filter(item => item !== value)) : setFilterCategory(prev => [...prev, value]);
  }

  return (
    <div className={`min-w-60 bg-white p-5 border-r border-gray-200 transition-all ${showFilter ? '' : 'hidden md:block'}`}>
      <p className='text-xl font-bold mb-4'>Filters</p>
      <div className='border border-gray-300 pl-5 py-3 mt-6 rounded-lg'>
        <p className='mb-3 text-sm font-medium'>CATEGORIES</p>
        <div className='flex flex-col gap-2 text-sm text-gray-700'>
          <label className='flex gap-2 cursor-pointer'><input type="checkbox" className='w-3' value="All" onChange={handleCategoryChange} checked={filterCategory.length === 0} />All</label>
          {categories.map((cat, index)=>(
             <label key={index} className='flex gap-2 cursor-pointer'><input type="checkbox" className='w-3' value={cat.path} onChange={handleCategoryChange} checked={filterCategory.includes(cat.path)} />{cat.text}</label>
          ))}
        </div>
      </div>
      <div className='border border-gray-300 pl-5 py-3 mt-6 rounded-lg'>
         <p className='mb-3 text-sm font-medium'>SORT PRICE</p>
         <select onChange={(e)=> setSortType(e.target.value)} className='border border-gray-300 text-sm rounded px-2 py-1 w-[90%]'>
            <option value="relevant">Relevant</option>
            <option value="low-high">Low to High</option>
            <option value="high-low">High to Low</option>
         </select>
      </div>
    </div>
  )
}
export default FilterSidebar
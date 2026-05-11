import React from 'react';
import { NavLink } from 'react-router-dom';
import { assets } from '../assets/assets'; // Ensure you have icons

const SuperSidebar = () => {
  return (
    <div className='w-[18%] min-h-screen border-r-2'>
        <div className='flex flex-col gap-4 pt-6 pl-[20%] text-[15px]'>
            
            <NavLink to='/super-admin' className={({isActive})=> `flex items-center gap-3 border border-gray-300 border-r-0 px-3 py-2 rounded-l ${isActive ? 'bg-pink-100 border-pink-500' : ''}`}>
                <p className='hidden md:block'>📊 Dashboard</p>
            </NavLink>

            <NavLink to='/super-admin/create-admin' className={({isActive})=> `flex items-center gap-3 border border-gray-300 border-r-0 px-3 py-2 rounded-l ${isActive ? 'bg-pink-100 border-pink-500' : ''}`}>
                <p className='hidden md:block'>➕ Create Admin</p>
            </NavLink>

            <NavLink to='/super-admin/users' className={({isActive})=> `flex items-center gap-3 border border-gray-300 border-r-0 px-3 py-2 rounded-l ${isActive ? 'bg-pink-100 border-pink-500' : ''}`}>
                <p className='hidden md:block'>busts_in_silhouette All Users</p>
            </NavLink>

        </div>
    </div>
  )
}

export default SuperSidebar
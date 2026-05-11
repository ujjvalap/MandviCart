import React from 'react';
import { useAppContext } from '../context/AppContext';
import { useParams } from 'react-router-dom';
import ProductCard from '../components/ProductCard';

const ProductCategory = () => {
    const { products } = useAppContext();
    const { category } = useParams();

    // 1. Safely decode the URL parameter (converts "%20" back to spaces, "%26" to "&")
    const decodedCategory = decodeURIComponent(category).toLowerCase();

    // 2. Filter products dynamically without needing a hardcoded categories list
    const filteredProducts = products.filter(
        (product) => product.category.toLowerCase() === decodedCategory
    );

    // 3. Intelligently grab the exact capitalized category name directly from the database data,
    // or fallback to the decoded URL parameter if the category is empty.
    const displayCategoryName = filteredProducts.length > 0 
        ? filteredProducts[0].category 
        : decodeURIComponent(category);

    return (
        <div className='mt-16'>
            {/* Dynamic Header */}
            <div className='flex flex-col items-end w-max mb-6'>
                <p className='text-2xl font-medium'>{displayCategoryName.toUpperCase()}</p>
                <div className="w-16 h-0.5 bg-primary rounded-full mt-1"></div>
            </div>

            {/* Product Grid */}
            {filteredProducts.length > 0 ? (
                <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-6 mt-6'>
                    {filteredProducts.map((product) => (
                        <ProductCard key={product._id} product={product} />
                    ))}
                </div>
            ) : (
                <div className='flex items-center justify-center h-[60vh]'>
                    <p className='text-2xl font-medium text-primary'>
                        No products found in this category.
                    </p>
                </div>
            )}
        </div>
    );
};

export default ProductCategory;
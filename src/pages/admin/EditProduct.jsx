import React, { useEffect, useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Upload, X, Save, ArrowLeft, Plus } from 'lucide-react'; // 👈 Fixed: Added 'Plus'

const EditProduct = () => {
    const { productId } = useParams();
    const navigate = useNavigate();
    const { axios, token } = useAppContext();
    
    const [loading, setLoading] = useState(false);
    
    // Images
    const [image1, setImage1] = useState(null);
    const [image2, setImage2] = useState(null);
    const [image3, setImage3] = useState(null);
    const [image4, setImage4] = useState(null);
    const [existingImages, setExistingImages] = useState([]); // Stores URLs of existing images

    // Basic Details
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState("Vegetables");
    const [subCategory, setSubCategory] = useState("Organic");
    const [bestseller, setBestseller] = useState(false);
    
    // Variants State
    const [variants, setVariants] = useState([{ weight: '', price: '', offerPrice: '', inStock: true }]);

    // 1. Fetch Product Data
    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const { data } = await axios.post('/api/product/single', { productId });
                if (data.success) {
                    const p = data.product;
                    setName(p.name);
                    // Handle description (array vs string)
                    setDescription(Array.isArray(p.description) ? p.description.join('\n') : p.description);
                    setCategory(p.category);
                    setSubCategory(p.subCategory);
                    setBestseller(p.bestseller);
                    setExistingImages(p.image); // Save existing URLs
                    
                    // Handle Variants (or fallback for old products)
                    if(p.variants && p.variants.length > 0) {
                        setVariants(p.variants);
                    } else {
                        // Fallback: Create 1 variant from root price
                        setVariants([{ weight: 'Standard', price: p.price, offerPrice: p.offerPrice, inStock: p.inStock }]);
                    }
                } else {
                    toast.error("Product not found");
                    navigate('/admin/products');
                }
            } catch (error) { 
                console.error(error);
                toast.error("Error fetching product"); 
            }
        };
        fetchProduct();
    }, [productId, axios, navigate]);

    // 2. Variant Handlers
    const handleVariantChange = (index, field, value) => {
        const updatedVariants = [...variants];
        updatedVariants[index][field] = value;
        setVariants(updatedVariants);
    };

    const addVariant = () => {
        setVariants([...variants, { weight: '', price: '', offerPrice: '', inStock: true }]);
    };

    const removeVariant = (index) => {
        if (variants.length > 1) {
            setVariants(variants.filter((_, i) => i !== index));
        }
    };

    // 3. Submit Handler
    const onSubmitHandler = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append("productId", productId);
            
            const productData = {
                productId,
                name,
                description: description.split('\n').filter(line => line.trim() !== ''),
                category,
                subCategory,
                bestseller,
                variants: variants.map(v => ({
                    weight: v.weight,
                    price: Number(v.price),
                    offerPrice: Number(v.offerPrice),
                    inStock: v.inStock
                }))
            };

            formData.append("productData", JSON.stringify(productData));

            // Only append NEW images
            image1 && formData.append("image1", image1);
            image2 && formData.append("image2", image2);
            image3 && formData.append("image3", image3);
            image4 && formData.append("image4", image4);

            const { data } = await axios.post('/api/product/update', formData, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (data.success) {
                toast.success("Product Updated");
                navigate('/admin/products');
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            console.error(error);
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={onSubmitHandler} className="max-w-4xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-8">
            {/* Header */}
            <div className="flex items-center gap-4 border-b border-gray-100 pb-6">
                <button type="button" onClick={() => navigate('/admin/products')} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <ArrowLeft size={24} className="text-gray-600"/>
                </button>
                <h1 className="text-2xl font-bold text-gray-800">Edit Product</h1>
            </div>

            {/* Image Upload Section */}
            <div>
                <p className="font-bold text-gray-700 mb-3">Product Images</p>
                <div className="flex gap-4 flex-wrap">
                    {[image1, image2, image3, image4].map((img, index) => (
                        <label key={index} htmlFor={`image${index+1}`} className="cursor-pointer group relative">
                            <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center bg-gray-50 overflow-hidden hover:border-green-500 transition-colors">
                                {img ? (
                                    // Preview NEW upload
                                    <img className="w-full h-full object-cover" src={URL.createObjectURL(img)} alt="" />
                                ) : existingImages[index] ? (
                                    // Show EXISTING image
                                    <img className="w-full h-full object-cover opacity-90" src={existingImages[index]} alt="" />
                                ) : (
                                    <Upload className="text-gray-400 group-hover:text-green-500" />
                                )}
                            </div>
                            <input onChange={(e) => {
                                if (index === 0) setImage1(e.target.files[0]);
                                if (index === 1) setImage2(e.target.files[0]);
                                if (index === 2) setImage3(e.target.files[0]);
                                if (index === 3) setImage4(e.target.files[0]);
                            }} type="file" id={`image${index+1}`} hidden />
                        </label>
                    ))}
                </div>
                <p className="text-xs text-gray-400 mt-2">*Uploading a new image will replace the existing one in that slot.</p>
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <p className="font-bold text-gray-700 mb-2">Product Name</p>
                    <input required onChange={(e) => setName(e.target.value)} value={name} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-green-500 outline-none transition-colors" type="text" placeholder="e.g. Organic Bananas" />
                </div>
                <div>
                    <p className="font-bold text-gray-700 mb-2">Category</p>
                    <select required onChange={(e) => setCategory(e.target.value)} value={category} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-green-500 outline-none cursor-pointer">
                        <option value="Vegetables">Vegetables</option>
                        <option value="Fruits">Fruits</option>
                        <option value="Dairy">Dairy</option>
                        <option value="Beverages">Beverages</option>
                    </select>
                </div>
            </div>

            {/* Variants */}
            <div>
                <div className="flex justify-between items-center mb-3">
                    <p className="font-bold text-gray-700">Product Variants</p>
                    <button type="button" onClick={addVariant} className="text-sm text-green-600 font-bold hover:text-green-700 flex items-center gap-1">
                        <Plus size={16}/> Add Variant
                    </button>
                </div>
                <div className="space-y-3">
                    {variants.map((variant, index) => (
                        <div key={index} className="flex flex-col md:flex-row gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200 relative">
                            <input required placeholder="Weight (e.g. 1kg)" value={variant.weight} onChange={(e) => handleVariantChange(index, 'weight', e.target.value)} className="flex-1 px-3 py-2 rounded-lg border border-gray-300 text-sm" />
                            <input required type="number" placeholder="MRP" value={variant.price} onChange={(e) => handleVariantChange(index, 'price', e.target.value)} className="flex-1 px-3 py-2 rounded-lg border border-gray-300 text-sm" />
                            <input required type="number" placeholder="Offer Price" value={variant.offerPrice} onChange={(e) => handleVariantChange(index, 'offerPrice', e.target.value)} className="flex-1 px-3 py-2 rounded-lg border border-gray-300 text-sm" />
                            
                            <div className="flex items-center gap-2">
                                <label className="text-sm text-gray-600 flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={variant.inStock} onChange={(e) => handleVariantChange(index, 'inStock', e.target.checked)} className="rounded text-green-600 focus:ring-green-500" />
                                    In Stock
                                </label>
                            </div>

                            {variants.length > 1 && (
                                <button type="button" onClick={() => removeVariant(index)} className="text-red-500 hover:text-red-700 p-2">
                                    <X size={18} />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Description */}
            <div>
                <p className="font-bold text-gray-700 mb-2">Description</p>
                <textarea required onChange={(e) => setDescription(e.target.value)} value={description} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-green-500 outline-none h-32 resize-none" placeholder="Enter product details (one per line)"></textarea>
            </div>

            {/* Bestseller Checkbox */}
            <div className="flex items-center gap-3">
                <input type="checkbox" id="bestseller" checked={bestseller} onChange={() => setBestseller(prev => !prev)} className="w-5 h-5 cursor-pointer accent-green-600" />
                <label htmlFor="bestseller" className="cursor-pointer text-gray-700 font-medium">Add to Bestsellers</label>
            </div>

            <button type="submit" disabled={loading} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-green-200 transition-all active:scale-95 flex items-center justify-center gap-2">
                {loading ? "Updating..." : <><Save size={20}/> Update Product</>}
            </button>
        </form>
    );
};

export default EditProduct;
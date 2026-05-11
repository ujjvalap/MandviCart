import React, { useContext, useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { AppContext } from '../context/AppContext';
import { useUser } from '@clerk/clerk-react';
import { 
    User, Store, Truck, MapPin, Save, Edit2, Loader, Camera, 
    CreditCard, ShieldCheck, Mail, Map, Navigation, X 
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import Cropper from 'react-easy-crop'; // 🟢 IMPORT CROPPER

import MapPicker from '../components/MapPicker'; 

// 🟢 Pre-defined list of popular banks
const INDIAN_BANKS = [
    "State Bank of India (SBI)", "HDFC Bank", "ICICI Bank", "Axis Bank", 
    "Punjab National Bank (PNB)", "Bank of Baroda", "Kotak Mahindra Bank", 
    "Canara Bank", "Union Bank of India", "Bank of India", "IndusInd Bank",
    "Yes Bank", "IDFC First Bank", "Federal Bank", "Central Bank of India",
    "Other (Add manually)"
];

// ==========================================
// 🟢 IMAGE CROPPER HELPER FUNCTIONS
// ==========================================
const createImage = (url) =>
    new Promise((resolve, reject) => {
        const image = new Image();
        image.addEventListener('load', () => resolve(image));
        image.addEventListener('error', (error) => reject(error));
        image.setAttribute('crossOrigin', 'anonymous');
        image.src = url;
    });

async function getCroppedImg(imageSrc, pixelCrop) {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) return null;

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
    );

    return new Promise((resolve) => {
        canvas.toBlob((file) => {
            resolve(file);
        }, 'image/jpeg', 0.95);
    });
}

// 🟢 DisplayField Component
const DisplayField = ({ label, value, name, parent, isEditing, onChange, onNestedChange, placeholder }) => (
    <div className="space-y-1.5">
        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{label}</label>
        {isEditing ? (
            <input 
                name={name} 
                value={value || ''} 
                onChange={parent ? (e) => onNestedChange(e, parent) : onChange} 
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-900 focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none transition-all shadow-sm" 
                placeholder={placeholder || `Enter ${label.toLowerCase()}`}
            />
        ) : (
            <div className="text-sm font-semibold text-gray-900 pb-2">{value || <span className="text-gray-400 italic font-normal">Not provided</span>}</div>
        )}
    </div>
);

const MyProfile = () => {
    const { user, setUser, axios: api, isLoading } = useContext(AppContext);
    const { user: clerkUser } = useUser(); 
    
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [showMapModal, setShowMapModal] = useState(false);
    const [isLoadingLocation, setIsLoadingLocation] = useState(false);
    const [isCustomBank, setIsCustomBank] = useState(false); 
    
    // 🟢 Image & Cropper States
    const [imageFile, setImageFile] = useState(null);
    const [previewImage, setPreviewImage] = useState("");
    const fileInputRef = useRef(null);

    const [showCropper, setShowCropper] = useState(false);
    const [cropImageSrc, setCropImageSrc] = useState(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

    const [userData, setUserData] = useState({
        name: '', phone: '', shopName: '', vehicleNumber: '',
        upiId: '', bankAccount: { bankName: '', accountNumber: '', ifsc: '' },
        address: { line1: '', line2: '', city: '', state: '', zip: '' }
    });

    const theme = useMemo(() => {
        const configs = {
            seller: { color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-200', icon: Store, label: 'Verified Seller' },
            rider: { color: 'text-cyan-600', bg: 'bg-cyan-50', border: 'border-cyan-200', icon: Truck, label: 'Delivery Partner' },
            admin: { color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200', icon: ShieldCheck, label: 'System Admin' },
            superadmin: { color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200', icon: ShieldCheck, label: 'Root Admin' },
            user: { color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: User, label: 'Customer Account' }
        };
        return configs[user?.role] || configs.user;
    }, [user]);

    useEffect(() => {
        if (user) {
            const fetchedBankName = user.bankAccount?.bankName || '';
            
            setUserData({
                name: user.name || '',
                phone: user.phone || '',
                shopName: user.shopName || '',
                vehicleNumber: user.vehicleNumber || '',
                upiId: user.upiId || '',
                bankAccount: { 
                    bankName: fetchedBankName,
                    accountNumber: user.bankAccount?.accountNumber || '', 
                    ifsc: user.bankAccount?.ifsc || '' 
                },
                address: user.address || { line1: '', line2: '', city: '', state: '', zip: '' }
            });
            setPreviewImage(clerkUser?.imageUrl || user.profileImage || "");

            if (fetchedBankName && !INDIAN_BANKS.includes(fetchedBankName) && fetchedBankName !== "Other (Add manually)") {
                setIsCustomBank(true);
            }
        }
    }, [user, clerkUser]);

    const handleChange = (e) => setUserData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    const handleNestedChange = (e, parent) => setUserData(prev => ({ ...prev, [parent]: { ...prev[parent], [e.target.name]: e.target.value } }));

    const handleBankSelect = (e) => {
        const selectedValue = e.target.value;
        if (selectedValue === "Other (Add manually)") {
            setIsCustomBank(true);
            handleNestedChange({ target: { name: 'bankName', value: '' } }, 'bankAccount'); 
        } else {
            setIsCustomBank(false);
            handleNestedChange(e, 'bankAccount');
        }
    };

    // 🟢 UPDATED: Handle Image Select to Open Cropper
    const handleImageSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) return toast.error("Image must be under 5MB");
            
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                setCropImageSrc(reader.result);
                setShowCropper(true); // Open the Cropper Modal
            };
            e.target.value = ""; // Reset input so same file can be selected again
        }
    };

    const onCropComplete = useCallback((croppedArea, croppedAreaPx) => {
        setCroppedAreaPixels(croppedAreaPx);
    }, []);

    // 🟢 Process the Crop and Apply to State
    const handleApplyCrop = async () => {
        try {
            const croppedBlob = await getCroppedImg(cropImageSrc, croppedAreaPixels);
            const croppedFile = new File([croppedBlob], "profile_picture.jpg", { type: "image/jpeg" });
            
            setImageFile(croppedFile);
            setPreviewImage(URL.createObjectURL(croppedBlob));
            setShowCropper(false);
        } catch (e) {
            console.error(e);
            toast.error("Failed to crop image.");
        }
    };

    const handleCurrentLocation = () => {
        if (!navigator.geolocation) return toast.error("Browser blocks geolocation");
        setIsLoadingLocation(true);
        navigator.geolocation.getCurrentPosition(async (pos) => {
            try {
                const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`);
                const data = await res.json();
                if (data?.address) {
                    setUserData(prev => ({
                        ...prev,
                        address: {
                            line1: data.address.road || data.address.amenity || "",
                            line2: data.address.suburb || data.address.neighbourhood || "",
                            city: data.address.city || data.address.town || "",
                            state: data.address.state || "",
                            zip: data.address.postcode || ""
                        }
                    }));
                    toast.success("Location auto-filled successfully!");
                    setShowMapModal(false); 
                }
            } catch (err) { toast.error("Address lookup failed"); }
            finally { setIsLoadingLocation(false); }
        }, () => {
            setIsLoadingLocation(false);
            toast.error("Location access denied");
        });
    };

    const handleMapSelect = (locationDetails) => {
        setUserData(prev => ({
            ...prev,
            address: {
                line1: locationDetails.street || prev.address.line1,
                line2: locationDetails.suburb || prev.address.line2,
                city: locationDetails.city || prev.address.city,
                state: locationDetails.state || prev.address.state,
                zip: locationDetails.zipcode || locationDetails.zip || prev.address.zip
            }
        }));
        setShowMapModal(false);
        toast.success("Location pinned successfully!");
    };

    const handleUpdate = async () => {
        setIsSaving(true);
        const loadToast = toast.loading("Syncing profile securely...");
        
        try {
            if (clerkUser) {
                const nameParts = userData.name.trim().split(' ');
                await clerkUser.update({ firstName: nameParts[0], lastName: nameParts.slice(1).join(' ') || '' });
                if (imageFile) await clerkUser.setProfileImage({ file: imageFile });
            }

            const formData = new FormData();
            formData.append('name', userData.name);
            formData.append('phone', userData.phone);
            
            if (user.role === 'seller') formData.append('shopName', userData.shopName);
            if (user.role === 'rider') formData.append('vehicleNumber', userData.vehicleNumber);
            if (['seller', 'rider'].includes(user.role)) {
                 formData.append('upiId', userData.upiId);
                 formData.append('bankAccount', JSON.stringify(userData.bankAccount));
            }
            formData.append('address', JSON.stringify(userData.address));
            if (imageFile) formData.append('image', imageFile);

            const { data } = await api.post('/api/user/update-profile', formData);

            if (data.success) {
                toast.success("Profile fully synced!", { id: loadToast });
                setUser(data.user); 
                setIsEditing(false);
                setImageFile(null);
            } else {
                toast.error(data.message, { id: loadToast });
            }
        } catch (error) {
            toast.error("Failed to sync profile.", { id: loadToast });
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="max-w-4xl mx-auto mt-12 p-8 space-y-6">
                <div className="h-32 bg-gray-100 animate-pulse rounded-2xl" />
                <div className="w-24 h-24 bg-gray-200 animate-pulse rounded-full -mt-12 ml-8 border-4 border-white" />
                <div className="h-40 bg-gray-50 animate-pulse rounded-2xl" />
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="min-h-screen bg-[#F8FAFC] py-10 px-4 sm:px-6 font-outfit">
            <div className="max-w-4xl mx-auto">
                
                {/* --- HEADER --- */}
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden mb-8">
                    <div className="h-32 bg-slate-900 relative">
                        <div className="absolute top-5 right-5">
                            <button 
                                onClick={() => isEditing ? handleUpdate() : setIsEditing(true)} 
                                disabled={isSaving}
                                className={`flex items-center gap-2 px-6 py-2.5 rounded-full font-bold text-sm transition-all shadow-lg ${isEditing ? 'bg-white text-gray-900 hover:scale-105' : 'bg-white/10 text-white backdrop-blur-md hover:bg-white/20 border border-white/20'}`}
                            >
                                {isSaving ? <Loader className="animate-spin" size={16}/> : isEditing ? <><Save size={16}/> Save Changes</> : <><Edit2 size={16}/> Edit Profile</>}
                            </button>
                        </div>
                    </div>

                    <div className="px-8 pb-8 relative">
                        <div className="flex flex-col sm:flex-row sm:items-end gap-6 -mt-12 mb-6">
                            
                            <div className="relative group w-28 h-28 rounded-full border-4 border-white bg-white shadow-md flex-shrink-0 cursor-pointer" onClick={() => isEditing && fileInputRef.current.click()}>
                                <img src={previewImage || "https://cdn-icons-png.flaticon.com/512/149/149071.png"} alt="Profile" className="w-full h-full object-cover rounded-full" />
                                {isEditing && (
                                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] rounded-full flex items-center justify-center transition-all">
                                        <Camera className="text-white drop-shadow-md" size={24} />
                                    </div>
                                )}
                            </div>
                            <input type="file" ref={fileInputRef} onChange={handleImageSelect} className="hidden" accept="image/*"/>
                            
                            <div className="pb-1">
                                <h1 className="text-2xl font-bold tracking-tight text-gray-900">{userData.name}</h1>
                                <div className={`inline-flex items-center gap-1.5 mt-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${theme.bg} ${theme.color} border ${theme.border}`}>
                                    <theme.icon size={14}/> {theme.label}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {/* --- LEFT COLUMN: CORE INFO --- */}
                    <div className="md:col-span-2 space-y-8">
                        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-widest mb-6 border-b border-gray-100 pb-4">Personal Details</h3>
                            <div className="grid sm:grid-cols-2 gap-x-8 gap-y-6">
                                <DisplayField label="Full Legal Name" name="name" value={userData.name} isEditing={isEditing} onChange={handleChange} />
                                <DisplayField label="Mobile Number" name="phone" value={userData.phone} isEditing={isEditing} onChange={handleChange} />
                                
                                <div className="space-y-1.5 sm:col-span-2">
                                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Verified Email (Clerk Auth)</label>
                                    <div className="flex items-center gap-2 text-sm font-medium text-gray-700 bg-gray-50 py-2.5 px-4 rounded-xl border border-gray-100 w-fit">
                                        <Mail size={16} className="text-gray-400"/> {user.email} <ShieldCheck size={16} className="text-green-500 ml-2"/>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {['seller', 'rider'].includes(user.role) && (
                            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                                <h3 className="text-sm font-bold text-gray-800 uppercase tracking-widest mb-6 border-b border-gray-100 pb-4">Business & Financials</h3>
                                <div className="grid sm:grid-cols-2 gap-x-8 gap-y-6">
                                    {user.role === 'seller' && <DisplayField label="Shop / Entity Name" name="shopName" value={userData.shopName} isEditing={isEditing} onChange={handleChange} />}
                                    {user.role === 'rider' && <DisplayField label="Vehicle Registration No." name="vehicleNumber" value={userData.vehicleNumber} isEditing={isEditing} onChange={handleChange} />}
                                    <DisplayField label="Payout UPI ID" name="upiId" value={userData.upiId} isEditing={isEditing} onChange={handleChange} />
                                    
                                    <div className="sm:col-span-2 bg-slate-50 p-6 rounded-2xl border border-slate-200 mt-2">
                                        <div className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-5">
                                            <CreditCard size={18} className="text-slate-500"/> Direct Bank Transfer
                                        </div>
                                        <div className="grid sm:grid-cols-2 gap-x-6 gap-y-5">
                                            
                                            <div className="space-y-1.5 sm:col-span-2">
                                                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Bank Name</label>
                                                {isEditing ? (
                                                    <div className="space-y-3">
                                                        <select 
                                                            name="bankName" 
                                                            value={isCustomBank ? "Other (Add manually)" : (userData.bankAccount.bankName || "")} 
                                                            onChange={handleBankSelect}
                                                            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-900 focus:ring-2 focus:ring-gray-900 outline-none shadow-sm cursor-pointer"
                                                        >
                                                            <option value="" disabled>Select your bank</option>
                                                            {INDIAN_BANKS.map(bank => (
                                                                <option key={bank} value={bank}>{bank}</option>
                                                            ))}
                                                        </select>
                                                        
                                                        {isCustomBank && (
                                                            <motion.input 
                                                                initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                                                                name="bankName" 
                                                                value={userData.bankAccount.bankName} 
                                                                onChange={(e) => handleNestedChange(e, 'bankAccount')} 
                                                                className="w-full bg-white border border-indigo-200 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-900 focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm" 
                                                                placeholder="Type your bank's name here..."
                                                            />
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="text-sm font-semibold text-gray-900 pb-2">{userData.bankAccount.bankName || <span className="text-gray-400 italic font-normal">Not provided</span>}</div>
                                                )}
                                            </div>

                                            <DisplayField label="Account Number" name="accountNumber" parent="bankAccount" value={userData.bankAccount.accountNumber} isEditing={isEditing} onNestedChange={handleNestedChange} placeholder="e.g. 000012345678" />
                                            <DisplayField label="IFSC Code" name="ifsc" parent="bankAccount" value={userData.bankAccount.ifsc} isEditing={isEditing} onNestedChange={handleNestedChange} placeholder="e.g. SBIN0001234" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* --- RIGHT COLUMN: ADDRESS --- */}
                    <div className="space-y-8">
                        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                            <div className="flex justify-between items-center border-b border-gray-100 pb-4 mb-6">
                                <h3 className="text-sm font-bold text-gray-800 uppercase tracking-widest flex items-center gap-2">
                                    <MapPin size={16} className="text-red-500"/> Location
                                </h3>
                                {isEditing && (
                                    <button 
                                        onClick={() => setShowMapModal(true)} 
                                        className="text-[11px] font-bold bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg flex items-center gap-1.5 hover:bg-blue-100 transition-colors"
                                    >
                                        <Map size={14}/> Set via Map
                                    </button>
                                )}
                            </div>

                            {isEditing ? (
                                <div className="space-y-4">
                                    <DisplayField label="Street / Building" name="line1" parent="address" value={userData.address.line1} isEditing={isEditing} onNestedChange={handleNestedChange} />
                                    <DisplayField label="City" name="city" parent="address" value={userData.address.city} isEditing={isEditing} onNestedChange={handleNestedChange} />
                                    <div className="grid grid-cols-2 gap-4">
                                        <DisplayField label="State" name="state" parent="address" value={userData.address.state} isEditing={isEditing} onNestedChange={handleNestedChange} />
                                        <DisplayField label="Pincode" name="zip" parent="address" value={userData.address.zip} isEditing={isEditing} onNestedChange={handleNestedChange} />
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    {userData.address.line1 ? (
                                        <div className="space-y-1 text-sm text-gray-700">
                                            <p className="font-semibold text-gray-900">{userData.address.line1}</p>
                                            <p>{userData.address.line2}</p>
                                            <p>{userData.address.city}, {userData.address.state} {userData.address.zip}</p>
                                        </div>
                                    ) : (
                                        <div className="text-center py-6 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                            <MapPin size={24} className="mx-auto text-gray-300 mb-2"/>
                                            <p className="text-xs text-gray-400 font-medium">No address pinned yet.</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ==========================================
                🟢 IMAGE CROPPER MODAL
            ========================================== */}
            <AnimatePresence>
                {showCropper && (
                    <div className="fixed inset-0 z-[1050] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 sm:p-6">
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0, y: 10 }} 
                            animate={{ scale: 1, opacity: 1, y: 0 }} 
                            exit={{ scale: 0.95, opacity: 0, y: 10 }}
                            className="bg-white w-full max-w-lg rounded-[2rem] shadow-2xl overflow-hidden flex flex-col h-[550px]"
                        >
                            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                                <div>
                                    <h3 className="font-bold text-gray-900 text-lg">Crop Profile Picture</h3>
                                    <p className="text-xs text-gray-500 font-medium">Adjust the image to fit your profile avatar.</p>
                                </div>
                                <button onClick={() => setShowCropper(false)} className="p-2 bg-white border border-gray-200 hover:bg-gray-100 rounded-full transition-colors shadow-sm">
                                    <X className="w-5 h-5 text-gray-600" />
                                </button>
                            </div>
                            
                            {/* Cropper Container */}
                            <div className="relative flex-1 bg-black">
                                <Cropper
                                    image={cropImageSrc}
                                    crop={crop}
                                    zoom={zoom}
                                    aspect={1}          // 🟢 Forces a perfect square/circle ratio
                                    cropShape="round"   // 🟢 Shows a circular overlay to visualize the avatar
                                    showGrid={false}
                                    onCropChange={setCrop}
                                    onZoomChange={setZoom}
                                    onCropComplete={onCropComplete}
                                />
                            </div>

                            {/* Zoom Slider & Actions */}
                            <div className="p-5 bg-white border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                                <input 
                                    type="range" 
                                    value={zoom} 
                                    min={1} max={3} step={0.1} 
                                    onChange={(e) => setZoom(e.target.value)} 
                                    className="w-full sm:w-1/2 accent-indigo-600"
                                />
                                <div className="flex gap-3 w-full sm:w-auto">
                                    <button onClick={() => setShowCropper(false)} className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl font-bold text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors">
                                        Cancel
                                    </button>
                                    <button onClick={handleApplyCrop} className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl font-bold text-sm bg-indigo-600 text-white shadow-md hover:bg-indigo-700 transition-colors">
                                        Apply Crop
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* MAPS MODAL */}
            <AnimatePresence>
                {showMapModal && (
                    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 sm:p-6">
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0, y: 10 }} 
                            animate={{ scale: 1, opacity: 1, y: 0 }} 
                            exit={{ scale: 0.95, opacity: 0, y: 10 }}
                            className="bg-white w-full max-w-4xl rounded-[2rem] shadow-2xl overflow-hidden flex flex-col h-[85vh] sm:h-[650px]"
                        >
                            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                                <div>
                                    <h3 className="font-bold text-gray-900 text-lg">Pin your exact location</h3>
                                    <p className="text-xs text-gray-500 font-medium">Search for your shop, drag the pin, or auto-detect.</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button 
                                        onClick={handleCurrentLocation} 
                                        disabled={isLoadingLocation} 
                                        className="hidden sm:flex text-xs font-bold bg-indigo-600 text-white px-4 py-2 rounded-xl items-center gap-2 hover:bg-indigo-700 transition-colors"
                                    >
                                        {isLoadingLocation ? <Loader size={14} className="animate-spin"/> : <Navigation size={14}/>} Auto-Detect Location
                                    </button>
                                    
                                    <button onClick={() => setShowMapModal(false)} className="p-2 bg-white border border-gray-200 hover:bg-gray-100 rounded-full transition-colors shadow-sm">
                                        <X className="w-5 h-5 text-gray-600" />
                                    </button>
                                </div>
                            </div>
                            
                            <div className="flex-1 w-full bg-gray-100 relative overflow-hidden">
                                <div className="absolute inset-0 h-full w-full [&>div]:h-full [&>div]:w-full">
                                    <MapPicker 
                                        onSelect={handleMapSelect} 
                                        onClose={() => setShowMapModal(false)}
                                        defaultAddress={userData.address.line1 ? `${userData.address.line1}, ${userData.address.city}` : ""}
                                    />
                                </div>
                                
                                <button 
                                    onClick={handleCurrentLocation} 
                                    className="sm:hidden absolute bottom-6 right-4 z-10 p-4 bg-indigo-600 text-white rounded-full shadow-xl hover:bg-indigo-700 transition-all active:scale-95"
                                >
                                    {isLoadingLocation ? <Loader size={24} className="animate-spin"/> : <Navigation size={24}/>}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

        </div>
    );
};

export default MyProfile;
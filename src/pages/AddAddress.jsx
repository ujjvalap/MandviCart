import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';
// 🎨 IMPORT LUCIDE ICONS
import { ArrowLeft, MapPin, Crosshair, Save, Loader2, User, Phone, Mail, Map, Building, Lock, AlertCircle, Move } from 'lucide-react';
import MapPicker from '../components/MapPicker'; 

// 🟢 STRICT BUSINESS LOGIC CONSTANTS
const SERVICE_AREA = {
    city: "Mandvi",
    state: "Gujarat",
    zipcode: "394160",
    country: "India"
};

const AddAddress = () => {
    const { axios, navigate } = useAppContext();
    const location = useLocation(); 
    
    // Check for Edit Mode
    const editMode = location.state?.addressToEdit ? true : false;
    const addressId = location.state?.addressToEdit?._id;

    const [isLoadingLocation, setIsLoadingLocation] = useState(false);

    // Initialize with Hardcoded Service Area
    const [formData, setFormData] = useState({
        firstName: "", lastName: "", email: "", phone: "", street: "", 
        ...SERVICE_AREA
    });

    // Pre-fill if editing, but enforce Service Area overrides just in case
    useEffect(() => {
        if (editMode && location.state.addressToEdit) {
            setFormData({
                ...location.state.addressToEdit,
                ...SERVICE_AREA // Enforce Mandvi limits even on old addresses
            });
        }
    }, [editMode, location.state]);

    const onChangeHandler = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // 🟢 REAL-TIME MAP SYNC WITH VALIDATION
    const handleMapSelect = (addressData) => {
        if (addressData.zipcode && addressData.zipcode !== SERVICE_AREA.zipcode) {
            toast.error("Notice: We currently only deliver within Mandvi (394160).", { icon: '📍', duration: 4000 });
        } else {
            toast.success("Street location updated successfully!");
        }
        
        setFormData(prev => ({ 
            ...prev, 
            street: addressData.street || prev.street,
            ...SERVICE_AREA // Lock the rest
        }));
    };

    // 🟢 HTML5 QUICK GEOLOCATION WITH VALIDATION
    const handleCurrentLocation = () => {
        if (!navigator.geolocation) return toast.error("Geolocation not supported by your browser");
        
        setIsLoadingLocation(true);
        navigator.geolocation.getCurrentPosition(async (position) => {
            const { latitude, longitude } = position.coords;
            try {
                const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                const data = await response.json();
                
                if (data?.address) {
                    const detectedZip = data.address.postcode;
                    if (detectedZip && detectedZip !== SERVICE_AREA.zipcode) {
                        toast.error("Detected location is outside our Mandvi (394160) delivery zone.", { duration: 4000 });
                    } else {
                        toast.success("Exact location detected!");
                    }

                    const street = data.address.road || data.address.suburb || data.address.neighbourhood || "";
                    const fullStreet = data.address.house_number ? `${data.address.house_number}, ${street}` : street;
                    
                    setFormData(prev => ({
                        ...prev, 
                        street: fullStreet || prev.street, 
                        ...SERVICE_AREA // Lock the rest
                    }));
                }
            } catch (error) { 
                toast.error("Error fetching location details"); 
            } finally { 
                setIsLoadingLocation(false); 
            }
        }, () => {
            setIsLoadingLocation(false);
            toast.error("Please allow location access in your browser.");
        });
    };

    const onSubmitHandler = async (e) => {
        e.preventDefault();
        try {
            // Final failsafe validation
            if (formData.zipcode !== SERVICE_AREA.zipcode) {
                return toast.error(`Delivery is restricted to ${SERVICE_AREA.zipcode} only.`);
            }

            let response;
            if (editMode) {
                response = await axios.post('/api/address/update', { addressId, address: formData });
            } else {
                response = await axios.post('/api/address/add', { address: formData });
            }
            
            if (response.data.success) {
                toast.success(response.data.message); 
                navigate('/cart'); 
            } else { 
                toast.error(response.data.message); 
            }
        } catch (error) { 
            toast.error(error.message); 
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 pt-24 pb-12 px-4 font-outfit">
            <div className="max-w-7xl mx-auto">
                
                {/* 🟢 Clean Back Button */}
                <button 
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 mb-6 px-4 py-2 bg-white text-slate-600 hover:text-slate-900 rounded-full shadow-sm border border-slate-200 hover:border-slate-300 transition-all font-bold w-fit group active:scale-95"
                >
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform"/> 
                    Back to Checkout
                </button>

                <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 overflow-hidden flex flex-col lg:flex-row border border-slate-100">
                      
                      {/* 🌍 LEFT SIDE: Map & Location Tools */}
                      <div className="w-full lg:w-[45%] bg-slate-50 p-6 lg:p-8 flex flex-col border-r border-slate-100 relative">
                        
                        {/* Service Area Banner */}
                        <div className="absolute top-0 left-0 right-0 bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-widest text-center py-1.5 flex items-center justify-center gap-1.5 z-10">
                            <AlertCircle size={12}/> Currently serving Mandvi Only
                        </div>
                        
                        <div className="mb-6 mt-4">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-3">
                                    <div className="bg-emerald-500 p-2.5 rounded-xl text-white shadow-lg shadow-emerald-200">
                                        <Map size={22} />
                                    </div>
                                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                                        {editMode ? "Edit Location" : "Pin Location"}
                                    </h2>
                                </div>
                            </div>
                            <p className="text-sm text-slate-500 font-medium mt-2 leading-relaxed">
                                Use the map to drop a pin on your exact building in Mandvi for 10-minute fast delivery.
                            </p>
                        </div>

                        {/* 🟢 Premium GPS Button */}
                        <button 
                            type="button" 
                            onClick={handleCurrentLocation}
                            disabled={isLoadingLocation}
                            className="w-full bg-white text-emerald-600 border border-emerald-200 font-bold py-3.5 px-6 rounded-xl shadow-sm hover:shadow-md hover:bg-emerald-50 hover:border-emerald-300 transition-all flex items-center justify-center gap-2 mb-6 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed group"
                        >
                            {isLoadingLocation ? (
                                <><Loader2 className="animate-spin text-emerald-500" size={18} /> Detecting GPS...</>
                            ) : (
                                <>
                                    <div className="relative flex items-center justify-center">
                                        <Crosshair size={18} className="group-hover:rotate-90 transition-transform duration-500"/>
                                        <span className="absolute w-2 h-2 bg-emerald-400 rounded-full animate-ping opacity-70"></span>
                                    </div>
                                    Auto-Detect Location
                                </>
                            )}
                        </button>
                        
                        {/* 🟢 FRAMED & FOCUSED MAP CONTAINER */}
                        <div className="flex-1 min-h-[400px] rounded-2xl overflow-hidden relative border-4 border-emerald-100 bg-emerald-50/50 isolate shadow-[inset_0_4px_20px_rgba(0,0,0,0.05)]">
                            
                            {/* Inner border to give it a "window" look */}
                            <div className="absolute inset-0 pointer-events-none border border-emerald-200/50 rounded-2xl z-10"></div>

                            {/* Floating Instruction Badge overlaying the map */}
                            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-full shadow-lg flex items-center gap-2 pointer-events-none">
                                <Move size={12} className="text-emerald-400" />
                                Drag Map to Adjust Pin
                            </div>

                            {/* The actual Map Component */}
                            <div className="absolute inset-0 h-full w-full [&>div]:h-full [&>div]:w-full">
                                <MapPicker 
                                    onSelect={handleMapSelect} 
                                    defaultAddress={formData.street ? `${formData.street}, Mandvi, Gujarat, 394160` : "Mandvi, Surat, Gujarat, 394160"}
                                />
                            </div>
                        </div>
                      </div>

                      {/* 📝 RIGHT SIDE: Details Form */}
                      <div className="w-full lg:w-[55%] p-6 lg:p-10 bg-white">
                        <form onSubmit={onSubmitHandler} className="flex flex-col gap-6 h-full">
                            
                            {/* Contact Details Section */}
                            <div>
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 border-b border-slate-100 pb-3 mb-5">
                                    <User size={14} className="text-emerald-500"/> Personal Details
                                </h3>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider pl-1">First Name</label>
                                        <input required onChange={onChangeHandler} name='firstName' value={formData.firstName} className="w-full bg-slate-50 border border-slate-200 text-slate-900 font-bold rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none p-3.5 transition-all placeholder:font-medium placeholder:text-slate-400" placeholder="e.g. Rahul" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider pl-1">Last Name</label>
                                        <input required onChange={onChangeHandler} name='lastName' value={formData.lastName} className="w-full bg-slate-50 border border-slate-200 text-slate-900 font-bold rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none p-3.5 transition-all placeholder:font-medium placeholder:text-slate-400" placeholder="e.g. Sharma" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider pl-1 flex items-center gap-1"><Phone size={12}/> Mobile Number</label>
                                        <input required onChange={onChangeHandler} name='phone' value={formData.phone} className="w-full bg-slate-50 border border-slate-200 text-slate-900 font-bold rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none p-3.5 transition-all placeholder:font-medium placeholder:text-slate-400" placeholder="10-digit number" type="tel" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider pl-1 flex items-center gap-1"><Mail size={12}/> Email Address</label>
                                        <input required onChange={onChangeHandler} name='email' value={formData.email} className="w-full bg-slate-50 border border-slate-200 text-slate-900 font-bold rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none p-3.5 transition-all placeholder:font-medium placeholder:text-slate-400" placeholder="your@email.com" type="email" />
                                    </div>
                                </div>
                            </div>

                            {/* Delivery Address Section */}
                            <div className="mt-2">
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 border-b border-slate-100 pb-3 mb-5">
                                    <Building size={14} className="text-emerald-500"/> Delivery Address
                                </h3>

                                <div className="space-y-5">
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider pl-1">Flat / House No. / Street</label>
                                        <input required onChange={onChangeHandler} name='street' value={formData.street} className="w-full bg-slate-50 border border-slate-200 text-slate-900 font-bold rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none p-3.5 transition-all placeholder:font-medium placeholder:text-slate-400" placeholder="e.g. Flat 4B, Green Plaza, Main Road" />
                                    </div>

                                    {/* 🟢 LOCKED FIELDS: Visual representation of the Service Area */}
                                    <div className="grid grid-cols-2 gap-5">
                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider pl-1">City / Town</label>
                                            <div className="w-full bg-slate-100/50 border border-slate-200 text-slate-500 font-bold rounded-xl p-3.5 cursor-not-allowed flex items-center justify-between">
                                                {SERVICE_AREA.city} <Lock size={14} className="text-slate-300"/>
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider pl-1">State</label>
                                            <div className="w-full bg-slate-100/50 border border-slate-200 text-slate-500 font-bold rounded-xl p-3.5 cursor-not-allowed flex items-center justify-between">
                                                {SERVICE_AREA.state} <Lock size={14} className="text-slate-300"/>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-5">
                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider pl-1">Pincode</label>
                                            <div className="w-full bg-slate-100/50 border border-slate-200 text-emerald-600 font-black rounded-xl p-3.5 cursor-not-allowed flex items-center justify-between shadow-inner">
                                                {SERVICE_AREA.zipcode} <Lock size={14} className="text-emerald-300"/>
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider pl-1">Country</label>
                                            <div className="w-full bg-slate-100/50 border border-slate-200 text-slate-500 font-bold rounded-xl p-3.5 cursor-not-allowed flex items-center justify-between">
                                                {SERVICE_AREA.country} <Lock size={14} className="text-slate-300"/>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 🟢 Premium Submit Button */}
                            <button 
                                type='submit' 
                                className="mt-auto w-full text-white bg-slate-900 hover:bg-black font-bold rounded-xl text-lg px-5 py-4 shadow-xl shadow-slate-900/20 transform transition-all active:scale-[0.98] flex items-center justify-center gap-2 group"
                            >
                                <Save size={20} className="text-emerald-400 group-hover:scale-110 transition-transform" />
                                {editMode ? "Update Delivery Details" : "Save & Continue to Payment"}
                            </button>
                        </form>
                      </div>
                </div>
            </div>
        </div>
    );
};

export default AddAddress;
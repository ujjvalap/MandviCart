import React, { useState, useEffect, useRef } from 'react';
import { GoogleMap, useJsApiLoader, DirectionsRenderer, Marker, Polyline } from '@react-google-maps/api';
import { Phone, Navigation, ShieldCheck, X, Clock, LocateFixed, CheckCircle, BellRing, Package, Truck, Landmark } from 'lucide-react';
import { assets } from '../assets/assets';
import { io } from 'socket.io-client'; 
import { useAppContext } from '../context/AppContext'; 
import toast from 'react-hot-toast';

const ANIMATION_DURATION = 60000; 

// FRESH, CLEAN LIGHT MAP STYLE
const MAP_OPTIONS = {
    disableDefaultUI: true, zoomControl: false,
    styles: [
        { featureType: "poi", stylers: [{ visibility: "off" }] },
        { featureType: "transit", stylers: [{ visibility: "off" }] },
        { featureType: "water", stylers: [{ color: "#e0f2fe" }] },
        { featureType: "landscape.man_made", stylers: [{ color: "#f8fafc" }] },
        { featureType: "road", elementType: "geometry.fill", stylers: [{ color: "#ffffff" }] },
        { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#e2e8f0" }] },
    ]
};

const getInterpolatedPosition = (path, progressPercent) => {
    if (!path || path.length === 0) return null;
    if (progressPercent >= 100) return { lat: path[path.length - 1].lat(), lng: path[path.length - 1].lng() };
    if (progressPercent <= 0) return { lat: path[0].lat(), lng: path[0].lng() };

    const floatIndex = (progressPercent / 100) * (path.length - 1);
    const lowerIndex = Math.floor(floatIndex);
    const upperIndex = Math.ceil(floatIndex);
    const t = floatIndex - lowerIndex; 

    const p1 = path[lowerIndex];
    const p2 = path[upperIndex];

    return { 
        lat: p1.lat() + (p2.lat() - p1.lat()) * t,
        lng: p1.lng() + (p2.lng() - p1.lng()) * t 
    };
};

const ActiveDeliveryMap = ({ orders, onComplete, onDrop, viewMode = 'rider', rider, onClose }) => {
    const { backendUrl, axios } = useAppContext(); 
    
    const { isLoaded } = useJsApiLoader({ id: 'google-map-script', googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_KEY });

    const mainOrder = orders[0];
    const isPickup = mainOrder.status === 'Ready for Pickup';
    const isDelivery = mainOrder.status === 'Out for Delivery';

    const pickupLoc = mainOrder?.pickupCoordinates?.lat ? mainOrder.pickupCoordinates : { lat: 21.2580, lng: 73.3060 };
    const dropoffLoc = mainOrder?.dropoffCoordinates?.lat ? mainOrder.dropoffCoordinates : { lat: 21.2556, lng: 73.3047 };

    const [directions, setDirections] = useState(null);
    const [pathPoints, setPathPoints] = useState([]);
    const [traveledPath, setTraveledPath] = useState([]); 
    const [riderPos, setRiderPos] = useState(pickupLoc);
    const [progress, setProgress] = useState(0);
    const [isAutoPan, setIsAutoPan] = useState(true);
    const [isSheetOpen, setIsSheetOpen] = useState(true);
    const [otp, setOtp] = useState(["", "", "", ""]);
    
    const [statusMessage, setStatusMessage] = useState("CALCULATING ROUTE...");
    const [isAtDoorstep, setIsAtDoorstep] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false); 

    const mapRef = useRef(null);
    const socketRef = useRef(null); 

    // SOCKETS
    useEffect(() => {
        if (!mainOrder?._id) return;
        socketRef.current = io(backendUrl);
        socketRef.current.emit("join_order", mainOrder._id);
        return () => socketRef.current && socketRef.current.disconnect();
    }, [mainOrder?._id, backendUrl]);

    // ROUTING
    useEffect(() => {
        if (isLoaded && !directions) {
            const directionsService = new google.maps.DirectionsService();
            const origin = isPickup ? { lat: pickupLoc.lat + 0.01, lng: pickupLoc.lng + 0.01 } : pickupLoc;
            const destination = isPickup ? pickupLoc : dropoffLoc;

            directionsService.route({
                origin, destination, travelMode: google.maps.TravelMode.DRIVING,
            }, (result, status) => {
                if (status === google.maps.DirectionsStatus.OK) {
                    setDirections(result);
                    setPathPoints(result.routes[0].overview_path);
                }
            });
        }
    }, [isLoaded, isPickup]);

    // DETERMINISTIC ANIMATION
    useEffect(() => {
        if (pathPoints.length === 0 || (!isDelivery && !isPickup)) return;
        
        const dbStartTime = isPickup ? mainOrder.acceptedAt : mainOrder.pickedUpAt;
        const safeStartTime = dbStartTime || Date.now(); 

        let animationFrameId;

        const animate = () => {
            const elapsed = Date.now() - safeStartTime; 
            const pct = Math.max(0, Math.min(elapsed / ANIMATION_DURATION, 1));
            const progressPercent = pct * 100;
            
            setProgress(progressPercent);

            if (pct < 0.5) setStatusMessage(isPickup ? "Heading to Store" : "Out for Delivery");
            else if (pct < 0.95) setStatusMessage("Approaching Destination");
            else { setStatusMessage("Arrived at Doorstep!"); setIsAtDoorstep(true); }

            const currentPos = getInterpolatedPosition(pathPoints, progressPercent);
            
            if (currentPos) {
                setRiderPos(currentPos);
                const pointIndex = Math.floor(pct * (pathPoints.length - 1));
                setTraveledPath(pathPoints.slice(0, pointIndex + 1));
                if (isAutoPan && mapRef.current) mapRef.current.panTo(currentPos);

                if (socketRef.current) {
                    socketRef.current.emit("rider_location_update", {
                        orderId: mainOrder._id, lat: currentPos.lat, lng: currentPos.lng, progress: progressPercent
                    });
                }
            }

            if (pct < 1) animationFrameId = requestAnimationFrame(animate);
        };
        
        animationFrameId = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animationFrameId);
    }, [pathPoints, isAutoPan, mainOrder?._id, isPickup, mainOrder.acceptedAt, mainOrder.pickedUpAt]);

    const handleOtpChange = (e, i) => {
        const val = e.target.value;
        if (isNaN(val)) return;
        const newOtp = [...otp]; newOtp[i] = val; setOtp(newOtp);
        if (val && i < 3) document.getElementById(`otp-${i + 1}`).focus();
    };

    // 🟢 UNIFIED OTP ACTION HANDLER (Pickup & Delivery)
    const handleAction = async () => {
        if (otp.join("").length < 4) return toast.error("Please enter the 4-digit OTP");

        if (isPickup) {
            const loadToast = toast.loading("Verifying Pickup OTP...");
            try {
                const { data } = await axios.post('/api/order/status', { 
                    orderId: mainOrder._id, 
                    status: 'Out for Delivery',
                    pickupOtp: otp.join("")
                });
                if (data.success) { 
                    toast.success("Pickup Verified!", { id: loadToast });
                    window.location.reload(); 
                } else {
                    toast.error(data.message, { id: loadToast });
                    setOtp(["","","",""]); // Reset OTP inputs on failure
                }
            } catch (error) {
                toast.error("Network error verifying OTP", { id: loadToast });
            }
        } else {
            setShowSuccess(true);
            setTimeout(async () => { await onComplete(orders, otp.join("")); }, 2500); 
        }
    };

    // FRIENDLY LOADING SCREEN
    if (!isLoaded) return (
        <div className="h-full w-full bg-white flex flex-col items-center justify-center font-outfit text-green-600">
            <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mb-4 animate-bounce shadow-xl shadow-green-100">
                <Truck size={40} className="text-green-500" />
            </div>
            <h2 className="text-xl font-black text-gray-800 tracking-wide">Connecting to GPS...</h2>
            <p className="text-gray-400 font-medium mt-2">Setting up your route</p>
        </div>
    );

    const targetInfo = { 
        name: isPickup ? "SELLER STORE" : `${mainOrder.address.firstName} ${mainOrder.address.lastName}`, 
        role: isPickup ? "PICKUP LOCATION" : "DELIVER TO CUSTOMER", 
        phone: isPickup ? "+91 1800-GREEN" : mainOrder.address.phone, 
        address: isPickup ? "GreenCart Fulfillment Hub" : `${mainOrder.address.line1}, ${mainOrder.address.city}` 
    };

    return (
        <div className="relative w-full h-full bg-gray-50 overflow-hidden font-outfit">
            
            {/* SUCCESS OVERLAY */}
            {showSuccess && (
                <div className="absolute inset-0 z-[100] bg-white/95 backdrop-blur-xl flex flex-col items-center justify-center text-center animate-fade-in">
                    <div className="w-32 h-32 bg-green-100 rounded-full flex items-center justify-center mb-6 shadow-2xl shadow-green-200 scale-in-center">
                        <CheckCircle size={64} className="text-green-500" />
                    </div>
                    <h1 className="text-4xl font-black text-gray-800 mb-2">Delivery Completed!</h1>
                    <p className="text-gray-500 font-medium text-lg">Customer received the package securely. Great job!</p>
                    <div className="mt-8 text-green-600 bg-green-50 px-6 py-3 rounded-full animate-pulse font-bold flex items-center gap-2">
                        <Landmark size={20} /> Earning added to wallet
                    </div>
                </div>
            )}

            {/* 🗺️ MAP LAYER */}
            <GoogleMap mapContainerStyle={{ width: '100%', height: '100%' }} center={riderPos} zoom={18} onLoad={map => mapRef.current = map} options={MAP_OPTIONS}>
                {directions && <DirectionsRenderer directions={directions} options={{ suppressMarkers: true, preserveViewport: false, polylineOptions: { strokeColor: "#94a3b8", strokeWeight: 6, strokeOpacity: 0.5 } }} />}
                <Polyline path={traveledPath} options={{ strokeColor: "#16a34a", strokeWeight: 6, strokeOpacity: 1, zIndex: 50 }} />
                <Marker position={pickupLoc} icon={{ url: assets.shop, scaledSize: new google.maps.Size(45, 45) }} />
                {!isPickup && <Marker position={dropoffLoc} icon={{ url: assets.home, scaledSize: new google.maps.Size(45, 45) }} animation={google.maps.Animation.DROP} />}
                <Marker position={riderPos} icon={{ url: assets.rider, scaledSize: new google.maps.Size(55, 55), anchor: new google.maps.Point(27, 27) }} zIndex={100} />
            </GoogleMap>

            {/* 🕒 HUD: CONTROLS */}
            <div className="absolute top-6 right-6 flex flex-col items-end z-10 pointer-events-none">
                <div className="flex flex-col gap-3 pointer-events-auto">
                    <button onClick={() => setIsAutoPan(!isAutoPan)} className={`p-3 rounded-full shadow-lg border transition-all active:scale-95 ${isAutoPan ? 'bg-green-50 border-green-200 text-green-600' : 'bg-white border-gray-200 text-gray-400 backdrop-blur-md'}`}>
                        <LocateFixed size={20} />
                    </button>
                </div>
            </div>

            {/* 🚦 HUD: STATUS FLOATING ISLAND */}
            <div className="absolute top-24 left-1/2 -translate-x-1/2 z-10">
                <div className={`flex items-center gap-3 px-6 py-3 rounded-full shadow-xl border transition-all duration-500 ${isAtDoorstep ? 'bg-green-500 border-green-600 text-white scale-110' : 'bg-white border-gray-100 text-gray-800'}`}>
                    {isAtDoorstep ? <BellRing size={18} className="animate-wiggle text-white"/> : (
                        <span className="relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span></span>
                    )}
                    <span className="font-bold text-sm tracking-wide">{statusMessage}</span>
                </div>
            </div>

            {/* 📱 BOTTOM SHEET */}
            <div className={`absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-2xl z-20 rounded-t-[2.5rem] border-t border-gray-200 shadow-[0_-20px_40px_rgba(0,0,0,0.05)] transition-transform duration-500 ${isSheetOpen ? 'translate-y-0' : 'translate-y-[calc(100%-85px)]'}`}>
                <div onClick={() => setIsSheetOpen(!isSheetOpen)} className="w-full h-10 flex items-center justify-center cursor-pointer active:bg-gray-50 rounded-t-[2.5rem]">
                    <div className="w-16 h-1.5 bg-gray-300 rounded-full"></div>
                </div>
                
                <div className="px-6 pb-8 pt-2">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center text-2xl font-bold text-green-600 border border-green-100 shadow-sm uppercase">
                                {targetInfo.name[0]}
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{targetInfo.role}</p>
                                <h3 className="text-xl font-black text-gray-800 leading-tight">{targetInfo.name}</h3>
                                <p className="text-xs text-gray-500 flex items-center gap-1 mt-1 font-medium"><Navigation size={12} className="text-gray-400" /> {targetInfo.address}</p>
                            </div>
                        </div>
                        <a href={`tel:${targetInfo.phone}`} className="w-12 h-12 bg-green-50 border border-green-100 rounded-full flex items-center justify-center text-green-600 hover:bg-green-100 transition-colors shadow-sm active:scale-95 pointer-events-auto">
                            <Phone size={20} />
                        </a>
                    </div>

                    <hr className="border-gray-100 mb-6" />

                    {/* 🟢 UNIFIED ACTION AREA (Pickup & Delivery OTP) */}
                    <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-xs font-bold text-gray-500 tracking-widest uppercase">
                                {isPickup ? 'Ask Seller for Pickup OTP' : 'Ask Customer for Delivery OTP'}
                            </span>
                            <span className="text-[10px] font-bold bg-blue-50 border border-blue-100 text-blue-600 px-2 py-1 rounded">Required</span>
                        </div>
                        
                        <div className="flex gap-3 justify-between mb-6">
                            {otp.map((d, i) => (
                                <input key={i} id={`otp-${i}`} type="text" maxLength="1" 
                                    className="w-full h-16 text-center text-3xl font-bold text-gray-900 bg-white border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-500/10 outline-none transition-all placeholder:text-gray-300 shadow-sm" 
                                    value={d} onChange={e => handleOtpChange(e, i)} placeholder="•"
                                />
                            ))}
                        </div>
                        
                        <div className="flex gap-3">
                            <button onClick={() => onDrop(mainOrder._id)} title="Drop Job" className="px-6 py-4 bg-white border border-red-200 text-red-500 hover:bg-red-50 font-bold rounded-xl shadow-sm active:scale-95 transition-all">
                                <X size={20} strokeWidth={3}/>
                            </button>
                            
                            <button 
                                onClick={handleAction} 
                                disabled={otp.join("").length < 4} 
                                className="flex-1 py-4 bg-black hover:bg-gray-800 text-white font-bold tracking-wide rounded-xl shadow-lg shadow-gray-200 flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50 disabled:shadow-none"
                            >
                                {isPickup ? <Package size={18} /> : <ShieldCheck size={18} />}
                                {isPickup ? 'CONFIRM PICKUP' : 'CONFIRM DELIVERY'}
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default React.memo(ActiveDeliveryMap);
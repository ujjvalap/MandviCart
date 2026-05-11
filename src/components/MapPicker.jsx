import React, { useState, useCallback, useRef } from 'react';
import { GoogleMap, useJsApiLoader, Marker, Autocomplete, Polygon } from '@react-google-maps/api';
import { MapPin, Search } from 'lucide-react';
import toast from 'react-hot-toast';

// Load 'places' library for the search bar to work
const libraries = ['places'];

const containerStyle = {
  width: '100%',
  height: '100%'
};

// 📍 Mandvi Center Coordinates
const defaultCenter = { lat: 21.2514, lng: 73.3010 };

// 🛑 1. Define the limits (Bounding Box) for Mandvi. 
// This prevents users from panning the map to Rupan, Lhedpur, etc.
const MANDVI_BOUNDS = {
  north: 21.2850, // Top edge 
  south: 21.2150, // Bottom edge 
  east: 73.3450,  // Right edge 
  west: 73.2650,  // Left edge 
};

// 🛑 2. Define the exact red line polygon. 
// These coordinates draw a red box tracking the bounds above. 
const mandviPolygonCoords = [
  { lat: 21.2850, lng: 73.2650 }, // Top-Left
  { lat: 21.2850, lng: 73.3450 }, // Top-Right
  { lat: 21.2150, lng: 73.3450 }, // Bottom-Right
  { lat: 21.2150, lng: 73.2650 }, // Bottom-Left
];

const MapPicker = ({ onSelect, defaultAddress }) => {
    // Initialize Google Maps API
    const { isLoaded, loadError } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_KEY,
        libraries: libraries, 
    });

    const [map, setMap] = useState(null);
    const [markerPosition, setMarkerPosition] = useState(defaultCenter);
    const [currentAddress, setCurrentAddress] = useState(defaultAddress || "Click map or search location...");
    const [parsedDetails, setParsedDetails] = useState({ street: '', suburb: '', city: '', state: '', zipcode: '' });
    
    const autocompleteRef = useRef(null);

    const onLoad = useCallback(function callback(mapInstance) {
        setMap(mapInstance);
    }, []);

    const onUnmount = useCallback(function callback() {
        setMap(null);
    }, []);

    // Reverse Geocode the selected coordinates
    const fetchAddressDetails = async (lat, lng) => {
        try {
            const geocoder = new window.google.maps.Geocoder();
            const response = await geocoder.geocode({ location: { lat, lng } });
            
            if (response.results[0]) {
                const addressComponents = response.results[0].address_components;
                const formattedAddress = response.results[0].formatted_address;
                
                let details = { street: "", suburb: "", city: "", state: "", zipcode: "" };

                addressComponents.forEach(comp => {
                    const types = comp.types;
                    if (types.includes("route") || types.includes("street_number") || types.includes("premise")) {
                        details.street += comp.long_name + " ";
                    }
                    if (types.includes("sublocality") || types.includes("neighborhood")) {
                        details.suburb = comp.long_name;
                    }
                    if (types.includes("locality") || types.includes("administrative_area_level_2")) {
                        details.city = comp.long_name;
                    }
                    if (types.includes("administrative_area_level_1")) {
                        details.state = comp.long_name;
                    }
                    if (types.includes("postal_code")) {
                        details.zipcode = comp.long_name;
                    }
                });

                if (!details.street.trim()) {
                    details.street = response.results[0].address_components[0].long_name;
                }

                setCurrentAddress(formattedAddress);
                setParsedDetails(details);
            }
        } catch (error) {
            console.error("Geocoding error", error);
            toast.error("Could not read precise address details.");
        }
    };

    const onMapClick = (e) => {
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        setMarkerPosition({ lat, lng });
        fetchAddressDetails(lat, lng);
    };

    const handlePlaceChanged = () => {
        if (autocompleteRef.current !== null) {
            const place = autocompleteRef.current.getPlace();
            if (place.geometry && place.geometry.location) {
                const lat = place.geometry.location.lat();
                const lng = place.geometry.location.lng();
                
                setMarkerPosition({ lat, lng });
                if (map) map.panTo({ lat, lng });
                
                fetchAddressDetails(lat, lng);
            }
        }
    };

    const handleConfirm = () => {
        if (!parsedDetails.city && !parsedDetails.street) {
            return toast.error("Please drop a pin or search for a location first.");
        }

        // 🛑 STRICT VALIDATION: Reject any submission outside Mandvi 394160
        const isMandviZip = parsedDetails.zipcode === "394160";
        const isMandviCity = parsedDetails.city.toLowerCase().includes("mandvi");
        
        if (!isMandviZip && !isMandviCity) {
             return toast.error("Service is limited to Mandvi (394160). Please select a valid location inside the red border.");
        }
        
        onSelect({
            ...parsedDetails,
            lat: markerPosition.lat,
            lng: markerPosition.lng,
            fullAddress: currentAddress
        });
    };

    if (loadError) return <div className="h-full flex items-center justify-center text-red-500 font-bold bg-red-50 rounded-2xl">Error loading Maps. Check API Key.</div>;
    if (!isLoaded) return <div className="h-full flex items-center justify-center bg-gray-100 animate-pulse rounded-2xl text-gray-400 font-bold tracking-widest uppercase">Initializing Map Engine...</div>;

    return (
        <div className="relative w-full h-full flex flex-col bg-gray-100">
            
            {/* 🔍 FLOATING SEARCH BAR */}
            <div className="absolute top-4 left-4 right-4 z-10 md:w-96">
                <Autocomplete
                    onLoad={(autocomplete) => (autocompleteRef.current = autocomplete)}
                    onPlaceChanged={handlePlaceChanged}
                    options={{
                        bounds: MANDVI_BOUNDS, // Force searches to happen only within Mandvi limits
                        strictBounds: true,
                        componentRestrictions: { country: "in" }
                    }}
                >
                    <div className="relative shadow-lg rounded-xl overflow-hidden bg-white/95 backdrop-blur-md border border-gray-200 focus-within:border-indigo-500 transition-colors">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Search size={18} className="text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search area inside Mandvi..."
                            className="w-full py-3.5 pl-11 pr-4 text-sm font-bold text-gray-800 bg-transparent outline-none placeholder:font-medium placeholder:text-gray-400"
                        />
                    </div>
                </Autocomplete>
            </div>

            {/* 🗺️ THE GOOGLE MAP */}
            <div className="flex-1 w-full h-full">
                <GoogleMap
                    mapContainerStyle={containerStyle}
                    center={markerPosition}
                    zoom={14}
                    onLoad={onLoad}
                    onUnmount={onUnmount}
                    onClick={onMapClick}
                    options={{ 
                        disableDefaultUI: true, 
                        zoomControl: true,
                        restriction: {
                            latLngBounds: MANDVI_BOUNDS, // Physically prevents user from swiping out of Mandvi
                            strictBounds: true,
                        },
                    }}
                >
                    {/* 🛑 THE RED TOWN BORDER */}
                    <Polygon
                        paths={mandviPolygonCoords}
                        options={{
                            fillColor: "#FF0000",
                            fillOpacity: 0.05,
                            strokeColor: "#FF0000",
                            strokeOpacity: 0.8,
                            strokeWeight: 3,
                            clickable: false, // Prevents polygon from blocking clicks on the map
                        }}
                    />

                    <Marker 
                        position={markerPosition} 
                        draggable={true}
                        onDragEnd={(e) => {
                            const newLat = e.latLng.lat();
                            const newLng = e.latLng.lng();
                            setMarkerPosition({ lat: newLat, lng: newLng });
                            fetchAddressDetails(newLat, newLng);
                        }}
                    />
                </GoogleMap>
            </div>

            {/* ✅ FLOATING CONFIRMATION PANEL */}
            <div className="absolute bottom-4 left-4 right-4 z-10 bg-white p-4 sm:p-5 rounded-2xl shadow-xl border border-gray-100 flex flex-col sm:flex-row items-center gap-4 justify-between">
                <div className="flex-1 w-full flex items-start gap-3 overflow-hidden">
                    <div className="bg-indigo-50 p-2 rounded-full mt-0.5 shrink-0">
                        <MapPin className="text-indigo-600" size={18} />
                    </div>
                    <div className="overflow-hidden w-full">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Selected Location</p>
                        <p className="text-sm font-bold text-gray-800 truncate" title={currentAddress}>
                            {currentAddress}
                        </p>
                    </div>
                </div>
                
                <button 
                    onClick={handleConfirm}
                    className="w-full sm:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md shadow-indigo-200 transition-all active:scale-95 whitespace-nowrap"
                >
                    Confirm Address
                </button>
            </div>

        </div>
    );
};

export default React.memo(MapPicker);
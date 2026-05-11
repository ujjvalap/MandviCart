import React, { useRef, useState, useEffect } from 'react';
import Webcam from 'react-webcam';
import * as faceapi from 'face-api.js'; 
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, ShieldCheck, Loader2, ScanFace, Target, Lightbulb, LightbulbOff } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import toast from 'react-hot-toast';

const RiderSelfieModal = ({ isOpen, onClose, onVerify }) => {
    const { user } = useAppContext(); 
    const webcamRef = useRef(null);
    const canvasRef = useRef(null);
    
    // AI States
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [refDescriptor, setRefDescriptor] = useState(null);
    const [scanResult, setScanResult] = useState(null); 
    const [cameraReady, setCameraReady] = useState(false);
    const [activeScore, setActiveScore] = useState(0);
    
    // New Feature States
    const [ringLightOn, setRingLightOn] = useState(false);
    const [analyzingPhase, setAnalyzingPhase] = useState(false);

    const videoConstraints = { width: 720, height: 720, facingMode: "user" };

    useEffect(() => {
        let isMounted = true;
        const loadModelsAndProfile = async () => {
            try {
                const MODEL_URL = 'https://justadudewhohacks.github.io/face-api.js/models';
                await Promise.all([
                    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
                    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
                ]);
                
                if (user?.profileImage) {
                    const refImgElement = await faceapi.fetchImage(user.profileImage);
                    const refDetection = await faceapi.detectSingleFace(refImgElement, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptor();
                    if (refDetection && isMounted) {
                        setRefDescriptor(refDetection.descriptor);
                    } else if (isMounted) {
                        toast.error("Critical: Could not mathematically map the face in your Official Profile Picture!");
                    }
                } else {
                    if(isMounted) toast.error("No official profile picture found for verification!");
                }
                
                if (isMounted) setModelsLoaded(true);
            } catch (error) {
                console.error("Failed to load AI Models", error);
                if (isMounted) toast.error("Failed to initialize Security AI.");
            }
        };
        
        if (isOpen) {
            setScanResult(null);
            setCameraReady(false);
            setAnalyzingPhase(false);
            setRingLightOn(false);
            loadModelsAndProfile();
        }
        return () => { isMounted = false; };
    }, [isOpen, user?.profileImage]);

    // Live Video Feed Recognition Loop
    useEffect(() => {
        let interval;
        if (isOpen && modelsLoaded && refDescriptor && cameraReady && !scanResult && !analyzingPhase) {
            interval = setInterval(async () => {
                if (webcamRef.current && webcamRef.current.video && webcamRef.current.video.readyState === 4) {
                    const video = webcamRef.current.video;
                    
                    try {
                        const detection = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptor();
                        
                        if (detection) {
                            const distance = faceapi.euclideanDistance(refDescriptor, detection.descriptor);
                            // Confidence score
                            const matchScore = Math.max(0, Math.min(100, Math.round(100 - (distance / 0.55) * 30)));
                            setActiveScore(matchScore);
                            
                            if (canvasRef.current && video.videoWidth > 0 && video.videoHeight > 0) {
                                const displaySize = { width: video.videoWidth, height: video.videoHeight };
                                faceapi.matchDimensions(canvasRef.current, displaySize);
                                const resizedDetection = faceapi.resizeResults(detection, displaySize);
                                
                                const ctx = canvasRef.current.getContext('2d');
                                ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                                
                                const box = resizedDetection.detection.box;
                                const isCentered = box.width > 20 && box.height > 20;
                                const isMatch = distance < 0.55;

                                if (isMatch && isCentered) {
                                    clearInterval(interval);
                                    
                                    setAnalyzingPhase(true);
                                    const snap = webcamRef.current.getScreenshot();
                                    
                                    setTimeout(() => {
                                        setScanResult({ score: matchScore, success: true, image: snap });
                                        setTimeout(() => {
                                            onVerify({ image: snap, score: matchScore });
                                        }, 1500);
                                    }, 1000); 
                                }
                            }
                        } else {
                            setActiveScore(0);
                            if (canvasRef.current) {
                                const ctx = canvasRef.current.getContext('2d');
                                ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                            }
                        }
                    } catch (e) {
                         // Safely ignore inference errors during teardown
                    }
                }
            }, 300);
        }
        return () => clearInterval(interval);
    }, [isOpen, modelsLoaded, refDescriptor, cameraReady, onVerify, scanResult, analyzingPhase]);

    const handleUserMedia = () => setCameraReady(true);

    const toggleRingLight = async () => {
        const toggleValue = !ringLightOn;
        setRingLightOn(toggleValue);
        
        try {
            const track = webcamRef.current?.video?.srcObject?.getVideoTracks()[0];
            if (track) {
                // If device supports actual torch or exposure compensation, use them to maximize light
                const capabilities = track.getCapabilities?.() || {};
                const constraints = { advanced: [] };
                
                if (capabilities.torch) {
                    constraints.advanced.push({ torch: toggleValue });
                }
                
                if (capabilities.exposureCompensation) {
                    constraints.advanced.push({ 
                        exposureCompensation: toggleValue ? capabilities.exposureCompensation.max : 0 
                    });
                }

                if (constraints.advanced.length > 0) {
                    await track.applyConstraints(constraints);
                }
            }
        } catch (err) {
            console.log("Torch/Exposure access error or unsupported (falling back to screen Ring Light)", err);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className={`fixed inset-0 z-[1000] flex items-center justify-center p-4 font-outfit transition-colors duration-500 ${ringLightOn ? 'bg-white' : 'bg-slate-900/90 backdrop-blur-md'}`}>
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className={`w-full max-w-sm rounded-[2rem] shadow-2xl overflow-hidden flex flex-col relative transition-colors duration-500 ${ringLightOn ? 'bg-white shadow-[0_0_50px_rgba(255,255,255,0.8)] border border-slate-100' : 'bg-white'}`}
                    >
                        {/* Header */}
                        <div className={`p-5 flex justify-between items-center z-10 transition-colors ${ringLightOn ? 'bg-white border-b border-slate-100' : 'bg-slate-50 border-b border-slate-100'}`}>
                            <div>
                                <h3 className="font-black text-slate-800 text-lg flex items-center gap-2">
                                    <ShieldCheck className="text-primary" /> Identity Check
                                </h3>
                                <p className="text-xs font-medium text-slate-500 mt-1">Photo Verification</p>
                            </div>
                            <div className="flex items-center gap-2">
                                {cameraReady && !scanResult && !analyzingPhase && (
                                    <button 
                                        onClick={toggleRingLight}
                                        className={`p-2 rounded-full transition-all ${
                                            ringLightOn ? 'bg-primary/20 text-primary shadow-sm border border-primary/30' : 'bg-white text-slate-400 hover:bg-slate-100 border border-slate-200'
                                        }`}
                                        title="Toggle Ring Light for Night Scan"
                                    >
                                        {ringLightOn ? <Lightbulb size={20} className="fill-current animate-pulse" /> : <LightbulbOff size={20} />}
                                    </button>
                                )}
                                <button onClick={onClose} disabled={scanResult || analyzingPhase} className="p-2 bg-white hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-full transition-colors border border-slate-200">
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Scanner Viewport */}
                        <div className={`p-6 flex flex-col items-center justify-center relative h-[400px] overflow-hidden transition-colors duration-500 ${ringLightOn ? 'bg-slate-50' : 'bg-slate-900 border-t border-slate-800'}`}>
                            
                            {/* Loading State */}
                            {(!modelsLoaded || !refDescriptor) ? (
                                <div className={`w-64 h-64 rounded-full flex flex-col items-center justify-center shadow-inner text-primary relative z-20 ${ringLightOn ? 'bg-white border-4 border-slate-100' : 'bg-slate-900 border-4 border-slate-800 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]'}`}>
                                    <Loader2 className="animate-spin mb-2" size={32} />
                                    <p className={`text-[10px] font-bold uppercase tracking-widest mt-2 text-center px-4 ${ringLightOn ? 'text-slate-500' : 'text-slate-400'}`}>Initializing System...</p>
                                </div>
                            ) : (
                                <div className={`relative w-72 h-72 rounded-full overflow-hidden flex items-center justify-center z-20 transition-all duration-500 ${ringLightOn ? 'border-8 border-white shadow-[0_0_60px_15px_rgba(255,255,255,0.8),inset_0_0_40px_20px_rgba(255,255,255,0.4)] bg-white' : 'border-4 border-slate-800 shadow-[0_0_30px_rgba(79,191,139,0.1)] bg-slate-900'}`}>
                                    
                                    {/* Always Active Live Video Feed */}
                                    <Webcam
                                        audio={false}
                                        ref={webcamRef}
                                        onUserMedia={handleUserMedia}
                                        screenshotFormat="image/jpeg"
                                        screenshotQuality={1}
                                        videoConstraints={videoConstraints}
                                        className="absolute inset-0 w-full h-full object-cover z-10 scale-125"
                                        mirrored={true} 
                                    />
                                    
                                    {/* Additional Ring Light internal glow effect */}
                                    {ringLightOn && !(scanResult || analyzingPhase) && (
                                        <div className="absolute inset-0 z-[15] pointer-events-none rounded-full shadow-[inset_0_0_60px_30px_rgba(255,255,255,1)]" />
                                    )}

                                    {/* Transparent Canvas for face-api boxes. Only show while scanning. */}
                                    <canvas 
                                        ref={canvasRef} 
                                        className="absolute inset-0 w-full h-full object-cover z-20 scale-125"
                                        style={{ transform: "scaleX(-1)", display: (scanResult || analyzingPhase) ? 'none' : 'block' }}
                                    />

                                    {/* Live Targeting Reticle Layer */}
                                    {!(scanResult || analyzingPhase) && (
                                        <div className="absolute inset-0 pointer-events-none z-30 flex items-center justify-center opacity-30">
                                            <Target size={220} className="text-primary animate-[spin_8s_linear_infinite]" strokeWidth={1} />
                                        </div>
                                    )}

                                    {/* Analyzing Transition Overlay */}
                                    <AnimatePresence>
                                        {analyzingPhase && !scanResult && (
                                            <motion.div 
                                                initial={{ opacity: 0 }} 
                                                animate={{ opacity: 1 }} 
                                                exit={{ opacity: 0 }}
                                                className={`absolute inset-0 z-40 backdrop-blur-md flex flex-col items-center justify-center ${ringLightOn ? 'bg-white/80' : 'bg-slate-900/80'}`}
                                            >
                                                <motion.div 
                                                    animate={{ rotate: 360 }}
                                                    transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                                                    className={`w-16 h-16 border-[3px] rounded-full mb-4 shadow-[0_0_15px_rgba(79,191,139,0.5)] ${ringLightOn ? 'border-primary/20 border-t-primary' : 'border-slate-700 border-t-primary'}`}
                                                />
                                                <span className="text-primary font-bold tracking-widest text-sm animate-pulse">ANALYZING PROFILE</span>
                                                <span className={`text-[10px] mt-2 tracking-wider ${ringLightOn ? 'text-slate-600' : 'text-slate-400'}`}>Please Wait...</span>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {/* Final Professional Score Overlay */}
                                    <AnimatePresence>
                                        {scanResult && (
                                            <motion.div 
                                                initial={{ scale: 0.8, opacity: 0 }}
                                                animate={{ scale: 1, opacity: 1 }}
                                                className="absolute inset-0 z-50 bg-primary flex flex-col items-center justify-center"
                                            >
                                                <motion.div
                                                    initial={{ scale: 0 }}
                                                    animate={{ scale: 1 }}
                                                    transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
                                                    className="bg-white rounded-full p-3 shadow-xl mb-4"
                                                >
                                                    <Check className="text-primary-dull" size={36} strokeWidth={4} />
                                                </motion.div>
                                                
                                                <h4 className="text-white font-black text-4xl tracking-tighter mb-2 shadow-black drop-shadow-md">
                                                    Verified
                                                </h4>
                                                
                                                <div className="bg-black/10 px-4 py-1.5 rounded-full border border-white/30 backdrop-blur-sm">
                                                    <span className="text-white text-[10px] uppercase font-bold tracking-widest shadow-black drop-shadow-sm">
                                                        Access Confirmed
                                                    </span>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            )}

                            {/* Ambient Scanning Glow */}
                            {!ringLightOn && !scanResult && !analyzingPhase && (
                                <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20 z-0">
                                    <div className="w-full h-2 bg-primary absolute top-0 left-0 animate-[scan_4s_ease-in-out_infinite] shadow-[0_0_30px_15px_rgba(79,191,139,0.4)]"></div>
                                </div>
                            )}
                        </div>

                        {/* Status Footer */}
                        <div className={`p-6 border-t flex flex-col items-center transition-colors duration-500 ${ringLightOn ? 'bg-white border-slate-100' : 'bg-slate-900 border-slate-800'}`}>
                            {scanResult ? (
                                <p className="text-primary font-bold uppercase tracking-widest text-sm flex items-center gap-2">
                                    Identity Verified
                                </p>
                            ) : analyzingPhase ? (
                                <p className="text-primary font-medium text-xs tracking-widest uppercase animate-pulse">
                                    Processing Photo...
                                </p>
                            ) : (
                                <>
                                    <p className={`font-medium text-center text-xs tracking-wide ${ringLightOn ? 'text-slate-600' : 'text-slate-400'}`}>
                                        Position your face in the center. The system will auto-capture when aligned.
                                    </p>
                                    <div className={`mt-4 flex items-center gap-2 text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-widest border transition-colors ${ringLightOn ? 'bg-slate-100 text-slate-500 border-slate-200' : 'bg-slate-800 text-slate-500 border-slate-700'}`}>
                                        <ScanFace size={14} className={activeScore > 0 ? "text-primary" : "text-slate-400"} /> 
                                        {activeScore === 0 ? "Detecting Face..." : "Aligning Face..."}
                                    </div>
                                </>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default RiderSelfieModal;
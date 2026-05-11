import React, { useEffect, Suspense, lazy } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'

// --- CONTEXT ---
import { useAppContext } from './context/AppContext'

// --- COMPONENTS ---
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Login from './components/Login'
import ChatWidget from './components/ChatWidget'
import ZoomIntro from './components/ZoomIntro'
import SeasonalBackground from './components/SeasonalBackground' 
import GlobalCartAnimation from './components/GlobalCartAnimation' 
import PageLoader from './components/PageLoader' // 🟢 NEW GLOBAL PAGE LOADER IMPORT

// --- PUBLIC PAGES ---
const Home = lazy(() => import('./pages/Home'))
const About = lazy(() => import('./pages/About'))
const Collection = lazy(() => import('./pages/Collection'))
const Product = lazy(() => import('./pages/Product'))
const Contact = lazy(() => import('./pages/Contact'))
const Banned = lazy(() => import('./pages/Banned'))

// --- CUSTOMER PAGES ---
const Cart = lazy(() => import('./pages/Cart'))
const MyOrders = lazy(() => import('./pages/MyOrders'))
const MyProfile = lazy(() => import('./pages/MyProfile'))
const AddAddress = lazy(() => import('./pages/AddAddress'))

// --- DASHBOARD LAYOUTS ---
const SuperLayout = lazy(() => import('./pages/superadmin/SuperLayout'))
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'))
const SellerLayout = lazy(() => import('./pages/seller/SellerLayout'))
const RiderLayout = lazy(() => import('./pages/rider/RiderLayout'))

// --- SUPER ADMIN PAGES ---
const SuperDashboard = lazy(() => import('./pages/superadmin/SuperDashboard'))
const AllAdmins = lazy(() => import('./pages/superadmin/AllAdmins'))
const SuperUsers = lazy(() => import('./pages/superadmin/SuperUserManage'))
const SuperPayouts = lazy(() => import('./pages/superadmin/SuperPayouts'))
const SuperContent = lazy(() => import('./pages/superadmin/SuperContent'))
const SuperChatMonitor = lazy(() => import('./pages/superadmin/SuperChatMonitor'))
const SystemSettings = lazy(() => import('./pages/superadmin/SystemSettings'))
const SuperNotifications = lazy(() => import('./pages/superadmin/SuperNotifications'))
const ActivityLogs = lazy(() => import('./pages/superadmin/ActivityLogs'))

// --- ADMIN PAGES ---
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'))
const AdminOrders = lazy(() => import('./pages/admin/AdminOrders'))
const AdminProducts = lazy(() => import('./pages/admin/AdminProducts'))
const AllRiders = lazy(() => import('./pages/admin/AllRiders'))
const AllSellers = lazy(() => import('./pages/admin/AllSellers'))
const AllUsers = lazy(() => import('./pages/admin/AllUsers'))
const AdminChat = lazy(() => import('./pages/admin/AdminChat'))
const EditProductAdmin = lazy(() => import('./pages/admin/EditProduct'))

// --- SELLER PAGES ---
const SellerDashboard = lazy(() => import('./pages/seller/SellerDashboard'))
const AddProduct = lazy(() => import('./pages/seller/AddProduct'))
const ProductList = lazy(() => import('./pages/seller/ProductList'))
const SellerOrders = lazy(() => import('./pages/seller/Orders'))
const EditProduct = lazy(() => import('./pages/seller/EditProduct'))

// --- RIDER PAGES ---
const RiderDashboard = lazy(() => import('./pages/rider/RiderDashboard'))
const AvailableJobs = lazy(() => import('./pages/rider/AvailableJobs'))
const ActiveDelivery = lazy(() => import('./pages/rider/ActiveDelivery'))
const RiderWallet = lazy(() => import('./pages/rider/RiderWallet'))

// ==========================================
// 🛡️ SECURITY GUARDS (ROUTE PROTECTION)
// ==========================================

// 1. PUBLIC GUARD: Allows Customers, SuperAdmins, and Guests. Blocks Staff.
const PublicGuard = ({ children }) => {
  const { user, role, isLoading } = useAppContext();
  
  if (isLoading) return <div className="h-screen bg-white flex items-center justify-center"><div className="animate-spin w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full"></div></div>;

  if (user && ['admin', 'seller', 'rider'].includes(role)) {
    return <Navigate to={`/${role}/dashboard`} replace />;
  }
  return children;
};

// 2. CUSTOMER GUARD: Requires Login. Only Users & SuperAdmins. Blocks Staff.
const CustomerGuard = ({ children }) => {
  const { user, role, isLoading } = useAppContext();
  
  if (isLoading) return <div className="h-screen bg-white flex items-center justify-center"><div className="animate-spin w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full"></div></div>;
  
  if (!user) return <Navigate to="/home" replace />;

  if (['admin', 'seller', 'rider'].includes(role)) {
    return <Navigate to={`/${role}/dashboard`} replace />;
  }
  
  return children;
};

// 3. ROLE GUARD: Locks Staff into their specific dashboards
const RoleGuard = ({ allowedRoles, children }) => {
  const { user, role, isLoading } = useAppContext();
  
  if (isLoading) return <div className="h-screen bg-slate-50 flex flex-col items-center justify-center"><div className="animate-spin w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full mb-4"></div><p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Loading Workspace...</p></div>;

  if (!user) return <Navigate to="/home" replace />;

  if (!allowedRoles.includes(role)) {
    const path = ['admin', 'seller', 'rider', 'superadmin'].includes(role) ? `/${role}/dashboard` : '/home';
    return <Navigate to={path} replace />;
  }
  
  return children;
};

// Auto-Scroll to Top
const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }, [pathname]);
  return null;
};

// Intro Animation Gate
const IntroGuard = ({ children }) => {
  const hasSeenIntro = sessionStorage.getItem('introShown');
  if (hasSeenIntro === 'true') return <Navigate to="/home" replace />;
  return children;
};

const App = () => {
  const { showUserLogin, isMapOpen } = useAppContext();
  const location = useLocation();

  const isDashboard = location.pathname.startsWith('/admin') || 
                      location.pathname.startsWith('/seller') || 
                      location.pathname.startsWith('/rider') ||
                      location.pathname.startsWith('/superadmin') ||
                      location.pathname === '/banned';

  const shouldHideNav = isDashboard || isMapOpen || location.pathname === '/';

  return (
    <div className='bg-white min-h-screen font-outfit relative'>
      <ScrollToTop /> 
      <Toaster position="top-center" />
      
      {/* 🟢 GLOBAL PAGE TRANSITION LOADER (Appears on every route change) */}
      <PageLoader />
      
      {/* 🟢 GLOBAL CART LOTTIE ANIMATION */}
      <GlobalCartAnimation />

      {!shouldHideNav && <SeasonalBackground theme="holi" />}
      {showUserLogin && <Login />}
      {!shouldHideNav && <Navbar />}
      {!shouldHideNav && <ChatWidget />}

      <div className={`relative z-10 ${!shouldHideNav ? 'pt-24' : ''}`}>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            
            <Route path='/' element={<IntroGuard><ZoomIntro /></IntroGuard>} />

            {/* ================= PUBLIC ROUTES (Guarded against Staff) ================= */}
            <Route path='/home' element={<PublicGuard><Home /></PublicGuard>} />
            <Route path='/about' element={<PublicGuard><About /></PublicGuard>} /> 
            <Route path='/products' element={<PublicGuard><Collection /></PublicGuard>} />
            <Route path='/products/:category' element={<PublicGuard><Collection /></PublicGuard>} />
            <Route path='/product/:productId' element={<PublicGuard><Product /></PublicGuard>} />
            <Route path='/contact' element={<PublicGuard><Contact /></PublicGuard>} />
            <Route path='/banned' element={<Banned />} />

            {/* ================= CUSTOMER ROUTES (Requires Login) ================= */}
            <Route path='/cart' element={<CustomerGuard><Cart /></CustomerGuard>} />
            <Route path='/my-orders' element={<CustomerGuard><MyOrders /></CustomerGuard>} />
            <Route path='/profile' element={<CustomerGuard><MyProfile /></CustomerGuard>} />
            <Route path='/add-address' element={<CustomerGuard><AddAddress /></CustomerGuard>} />

            {/* ================= 👑 SUPER ADMIN ROUTES ================= */}
            <Route path='/superadmin' element={<RoleGuard allowedRoles={['superadmin']}><SuperLayout /></RoleGuard>}>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path='dashboard' element={<SuperDashboard />} />
                <Route path='admins' element={<AllAdmins />} />
                <Route path='users' element={<SuperUsers />} />
                <Route path='payouts' element={<SuperPayouts />} />
                <Route path='content' element={<SuperContent />} />
                <Route path='chat' element={<SuperChatMonitor />} />
                <Route path='logs' element={<ActivityLogs />} />
                <Route path='settings' element={<SystemSettings />} />
                <Route path='notifications' element={<SuperNotifications />} />
            </Route>

            {/* ================= 🔵 ADMIN ROUTES ================= */}
            <Route path='/admin' element={<RoleGuard allowedRoles={['admin', 'superadmin']}><AdminLayout /></RoleGuard>}>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path='dashboard' element={<AdminDashboard />} />
                <Route path='orders' element={<AdminOrders />} />
                <Route path='products' element={<AdminProducts />} />
                <Route path='users' element={<AllUsers />} />
                <Route path='riders' element={<AllRiders />} />
                <Route path='sellers' element={<AllSellers />} />
                <Route path='content' element={<SuperContent />} /> 
                <Route path='chat' element={<AdminChat />} />
                <Route path='add-product' element={<AddProduct />} />
                <Route path='edit-product/:productId' element={<EditProductAdmin />} />
            </Route>

            {/* ================= 🟣 SELLER ROUTES ================= */}
            <Route path='/seller' element={<RoleGuard allowedRoles={['seller']}><SellerLayout /></RoleGuard>}>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path='dashboard' element={<SellerDashboard />} />
                <Route path='add-product' element={<AddProduct />} />
                <Route path='product-list' element={<ProductList />} />
                <Route path='orders' element={<SellerOrders />} />
                <Route path='profile' element={<MyProfile />} />
                <Route path='edit-product/:productId' element={<EditProduct />} />
            </Route>

            {/* ================= 🟠 RIDER ROUTES ================= */}
            <Route path='/rider' element={<RoleGuard allowedRoles={['rider']}><RiderLayout /></RoleGuard>}>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path='dashboard' element={<RiderDashboard />} />
                <Route path='jobs' element={<AvailableJobs />} />
                <Route path='active' element={<ActiveDelivery />} />
                <Route path='history' element={<RiderWallet />} />
                <Route path='profile' element={<MyProfile />} />
            </Route>

            <Route path='*' element={<Navigate to="/home" replace />} />

          </Routes>
        </Suspense>
      </div>
      
      {!shouldHideNav && <Footer />}
    </div>
  )
}

export default App
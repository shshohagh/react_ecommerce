import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import ProductDetails from './pages/ProductDetails';
import OrderTracking from './pages/OrderTracking';
import OrderHistory from './pages/OrderHistory';
import Wishlist from './pages/Wishlist';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Invoice from './pages/Invoice';
import UserAccount from './pages/UserAccount';
import { ThemeProvider } from './context/ThemeContext';
import { CartProvider } from './context/CartContext';
import { ToastProvider } from './context/ToastContext';
import { CompareProvider } from './context/CompareContext';
import { CurrencyProvider } from './context/CurrencyContext';
import { WishlistProvider } from './context/WishlistContext';
import CompareModal from './components/CompareModal';
import CompareFloatingBar from './components/CompareFloatingBar';
import KeyboardShortcuts from './components/KeyboardShortcuts';
import Chatbot from './components/Chatbot';
import ExitIntentModal from './components/ExitIntentModal';
import { useEffect } from 'react';
import { seedDemoData } from './seedData';
import { ErrorBoundary } from './components/ErrorBoundary';

function AppContent() {
  const location = useLocation();
  const isAdminDashboard = location.pathname === '/admin/dashboard';

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 flex flex-col transition-colors duration-300">
      <KeyboardShortcuts />
      {!isAdminDashboard && <Navbar />}
      <main id="main-content" tabIndex={-1} className="flex-grow outline-none">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Home />} />
          <Route path="/product/:id" element={<ProductDetails />} />
          <Route path="/orders" element={<OrderHistory />} />
          <Route path="/account" element={<UserAccount />} />
          <Route path="/account/orders" element={<UserAccount />} />
          <Route path="/account/addresses" element={<UserAccount />} />
          <Route path="/account/notifications" element={<UserAccount />} />
          <Route path="/track-order" element={<OrderTracking />} />
          <Route path="/track-order/:id" element={<OrderTracking />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/invoice/:id" element={<Invoice />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
        </Routes>
      </main>
      {!isAdminDashboard && <Footer />}
      <CompareModal />
      <CompareFloatingBar />
      {!isAdminDashboard && <Chatbot />}
      {!isAdminDashboard && <ExitIntentModal />}
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <ToastProvider>
          <CurrencyProvider>
            <CartProvider>
              <CompareProvider>
                <WishlistProvider>
                  <Router>
                    <AppContent />
                  </Router>
                </WishlistProvider>
              </CompareProvider>
            </CartProvider>
          </CurrencyProvider>
        </ToastProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

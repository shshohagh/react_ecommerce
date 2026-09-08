import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { ShoppingCart, User, LogOut, Menu, X, Heart, Sun, Moon, ShoppingBag, Search, ArrowLeftRight, Package, Globe, ChevronDown, Check, Truck, Mic, MicOff } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import { useCart } from '../context/CartContext';
import { useCompare } from '../context/CompareContext';
import { useCurrency } from '../context/CurrencyContext';
import { useWishlist } from '../context/WishlistContext';
import { useToast } from '../context/ToastContext';
import { motion, AnimatePresence } from 'motion/react';

export default function Navbar() {
  const { isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { cartCount } = useCart();
  const { compareList, openCompareModal } = useCompare();
  const { wishlist } = useWishlist();
  const { currency, setCurrency, currentCurrency, currencies } = useCurrency();
  const { showSuccess, showError, showInfo, showWarning } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCurrencyOpen, setIsCurrencyOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [isListening, setIsListening] = useState(false);
  const currencyMenuRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Web Speech API Voice Search Handler
  const toggleVoiceSearch = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      showWarning('Voice Search is not supported by your current browser. Please try Chrome, Edge, or Safari.', 'Voice Search Unavailable');
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        showInfo('Listening... Say the product or brand you are looking for.', 'Voice Search Active');
      };

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0])
          .map((result: any) => result.transcript)
          .join('');

        setSearchTerm(transcript);

        if (event.results[0] && event.results[0].isFinal) {
          setIsListening(false);
          const finalQuery = transcript.trim();
          if (finalQuery) {
            showSuccess(`Searching for "${finalQuery}"...`, 'Voice Search');
            navigate(`/?search=${encodeURIComponent(finalQuery)}#products`);
          }
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          showError('Microphone permission was denied. Please allow microphone access to use voice search.', 'Permission Denied');
        } else if (event.error !== 'no-speech') {
          showError(`Voice search error: ${event.error}`, 'Voice Search');
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err) {
      console.error('Failed to start voice recognition:', err);
      setIsListening(false);
      showError('Could not initialize microphone for voice search.', 'Microphone Error');
    }
  };

  // Close currency dropdown when clicked outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (currencyMenuRef.current && !currencyMenuRef.current.contains(e.target as Node)) {
        setIsCurrencyOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keep search input in sync if URL query changes
  useEffect(() => {
    setSearchTerm(searchParams.get('search') || '');
  }, [searchParams]);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  // Close mobile menu on Esc key
  useEffect(() => {
    const handleEscape = () => {
      setIsMenuOpen(false);
      setIsCurrencyOpen(false);
    };
    window.addEventListener('app:escape-pressed', handleEscape);
    return () => window.removeEventListener('app:escape-pressed', handleEscape);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchTerm.trim();
    if (query) {
      navigate(`/?search=${encodeURIComponent(query)}#products`);
    } else {
      navigate('/#products');
    }
    setIsMenuOpen(false);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    if (searchParams.has('search')) {
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('search');
      setSearchParams(newParams);
      navigate('/');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsMenuOpen(false);
  };

  return (
    <nav className="bg-white dark:bg-gray-950 border-b border-gray-100 dark:border-gray-800 sticky top-0 z-50 transition-colors duration-300 print:hidden shadow-xs">
      {/* Accessible Skip Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2.5 focus:bg-indigo-600 focus:text-white focus:text-sm focus:font-bold focus:rounded-xl focus:shadow-xl focus:outline-none focus:ring-2 focus:ring-white"
      >
        Skip to main content
      </a>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo */}
          <div className="flex items-center flex-shrink-0">
            <Link to="/" className="flex items-center gap-2 group rounded-xl p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">
              <div className="p-2 rounded-xl bg-indigo-600 dark:bg-indigo-500 text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                <ShoppingCart className="h-5 w-5" />
              </div>
              <span className="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                SwiftCart
              </span>
            </Link>
          </div>

          {/* Desktop Search Bar with Voice Search & / Shortcut */}
          <div className="hidden md:flex flex-1 max-w-md mx-4">
            <form onSubmit={handleSearchSubmit} className="relative w-full">
              <input
                data-search-input="true"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search products, brands, or keywords..."
                className={`w-full pl-10 pr-24 py-2 bg-gray-50 dark:bg-gray-900 border rounded-full text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus-visible:ring-2 focus:border-transparent transition-all ${
                  isListening 
                    ? 'border-red-500 ring-2 ring-red-400/50 bg-red-50/30 dark:bg-red-950/20' 
                    : 'border-gray-200 dark:border-gray-700 focus-visible:ring-indigo-500'
                }`}
              />
              <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
              
              <div className="absolute right-2.5 top-1.5 flex items-center gap-1.5">
                {/* Voice Search Button */}
                <button
                  type="button"
                  onClick={toggleVoiceSearch}
                  title={isListening ? "Listening... Click to stop" : "Search by voice (Web Speech API)"}
                  aria-label={isListening ? "Stop voice search" : "Search products by voice"}
                  className={`p-1.5 rounded-full transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                    isListening
                      ? 'bg-red-500 text-white animate-pulse shadow-md shadow-red-500/30'
                      : 'text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  {isListening ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
                </button>

                {searchTerm ? (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                    title="Clear search"
                    aria-label="Clear search input"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                ) : (
                  <kbd 
                    className="hidden lg:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono font-semibold text-gray-400 dark:text-gray-500 bg-gray-200/60 dark:bg-gray-800 rounded border border-gray-300/60 dark:border-gray-700 select-none pointer-events-none"
                    title="Press / to focus search"
                  >
                    /
                  </kbd>
                )}
              </div>

              {/* Listening Live Indicator Tooltip */}
              {isListening && (
                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-red-600 text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1.5 animate-bounce z-50">
                  <span className="h-1.5 w-1.5 rounded-full bg-white animate-ping" />
                  <span>Listening... Speak now</span>
                </div>
              )}
            </form>
          </div>

          {/* Desktop Menu */}
          <div className="hidden sm:flex sm:items-center sm:space-x-2 lg:space-x-3">
            <Link
              to="/"
              className={`px-2.5 py-2 text-sm font-medium rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                location.pathname === '/' && !searchParams.get('search')
                  ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                  : 'text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400'
              }`}
            >
              Home
            </Link>
            <Link
              to="/account"
              className={`flex items-center px-2.5 py-2 text-sm font-medium rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                location.pathname.startsWith('/account')
                  ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                  : 'text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400'
              }`}
              title="My Account: Orders, Addresses & Preferences"
            >
              <User className="h-4 w-4 mr-1" />
              <span>Account</span>
            </Link>
            <Link
              to="/orders"
              className={`flex items-center px-2.5 py-2 text-sm font-medium rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                location.pathname.startsWith('/orders')
                  ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                  : 'text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400'
              }`}
              title="View previous orders & invoices"
            >
              <Package className="h-4 w-4 mr-1" />
              <span>Orders</span>
            </Link>

            {/* Prominent Track My Order Header CTA */}
            <Link
              to="/track-order"
              id="nav-track-my-order-btn"
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                location.pathname.startsWith('/track-order')
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25 ring-2 ring-indigo-400/30'
                  : 'bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/70 dark:hover:bg-indigo-900/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200/90 dark:border-indigo-800/80'
              }`}
              title="Track your package live with your tracking number"
            >
              <Truck className={`h-3.5 w-3.5 ${location.pathname.startsWith('/track-order') ? 'text-white' : 'text-indigo-600 dark:text-indigo-400'}`} />
              <span>Track My Order</span>
            </Link>

            <Link
              to="/wishlist"
              className={`flex items-center px-2.5 py-2 text-sm font-medium rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                location.pathname === '/wishlist'
                  ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                  : 'text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400'
              }`}
            >
              <Heart className="h-4 w-4 mr-1" />
              <span>Wishlist</span>
              {wishlist.length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 bg-red-100 dark:bg-red-950/70 text-red-600 dark:text-red-400 text-[10px] font-extrabold rounded-full">
                  {wishlist.length}
                </span>
              )}
            </Link>

            {/* Compare Products Button */}
            <button
              onClick={openCompareModal}
              className={`flex items-center px-2.5 py-2 text-sm font-medium transition-colors cursor-pointer relative rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                compareList.length > 0
                  ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                  : 'text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400'
              }`}
              title="Compare Products (up to 3)"
              aria-label={`Compare products (${compareList.length} selected)`}
            >
              <ArrowLeftRight className="h-4 w-4 mr-1" />
              <span>Compare</span>
              {compareList.length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-[10px] font-extrabold rounded-full">
                  {compareList.length}
                </span>
              )}
            </button>

            {/* Currency Converter Dropdown */}
            <div className="relative" ref={currencyMenuRef}>
              <button
                onClick={() => setIsCurrencyOpen(!isCurrencyOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold bg-gray-50 dark:bg-gray-800/80 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-xl border border-gray-200/80 dark:border-gray-700/80 transition-all cursor-pointer shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                title="Change currency"
                aria-expanded={isCurrencyOpen}
                aria-label={`Select currency, currently ${currentCurrency.code}`}
              >
                <span className="text-sm leading-none">{currentCurrency.flag}</span>
                <span>{currentCurrency.code}</span>
                <ChevronDown className={`h-3 w-3 text-gray-400 transition-transform ${isCurrencyOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {isCurrencyOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 py-1.5 z-50 overflow-hidden"
                  >
                    <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 border-b border-gray-50 dark:border-gray-800">
                      Select Currency
                    </div>
                    <div className="max-h-60 overflow-y-auto py-1 custom-scrollbar">
                      {currencies.map((c) => (
                        <button
                          key={c.code}
                          onClick={() => {
                            setCurrency(c.code);
                            setIsCurrencyOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 text-xs transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                            c.code === currency
                              ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold'
                              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span>{c.flag}</span>
                            <span>{c.name}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-gray-400">
                            <span className="font-mono">{c.code}</span>
                            {c.code === currency && <Check className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />}
                          </div>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              aria-label="Toggle theme"
              title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            >
              {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5 text-amber-400" />}
            </button>

            <Link
              to="/cart"
              className="p-2 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              aria-label={`Shopping cart with ${cartCount} items`}
            >
              <ShoppingBag className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 bg-indigo-600 text-white text-[11px] font-bold flex items-center justify-center rounded-full ring-2 ring-white dark:ring-gray-950">
                  {cartCount}
                </span>
              )}
            </Link>

            {isAuthenticated ? (
              <div className="flex items-center space-x-2 pl-2 border-l border-gray-100 dark:border-gray-800">
                <Link
                  to="/admin/dashboard"
                  className="px-3 py-1.5 text-xs font-bold rounded-lg bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                >
                  Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 text-xs font-semibold py-1.5 px-2 cursor-pointer rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                  title="Logout"
                  aria-label="Logout"
                >
                  <LogOut className="h-4 w-4 mr-1" />
                  Logout
                </button>
              </div>
            ) : (
              <Link
                to="/admin/login"
                className="flex items-center px-3 py-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-indigo-600 dark:hover:border-indigo-400 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                <User className="h-3.5 w-3.5 mr-1" />
                Admin
              </Link>
            )}
          </div>

          {/* Mobile Bar Controls */}
          <div className="flex items-center sm:hidden gap-1.5">
            {/* Quick Track Button for Mobile Header */}
            <Link
              to="/track-order"
              id="mobile-track-order-btn"
              className="flex items-center gap-1 px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/80 rounded-lg text-xs font-bold active:scale-95 transition-all"
              title="Track My Order"
            >
              <Truck className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Track</span>
            </Link>

            {/* Mobile Currency Button */}
            <button
              onClick={() => {
                const currentIndex = currencies.findIndex(c => c.code === currency);
                const nextCurrency = currencies[(currentIndex + 1) % currencies.length];
                setCurrency(nextCurrency.code);
              }}
              className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-xs font-bold rounded-lg"
              title="Tap to switch currency"
            >
              {currentCurrency.flag} {currentCurrency.code}
            </button>

            {/* Mobile Compare Button */}
            {compareList.length > 0 && (
              <button
                onClick={openCompareModal}
                className="p-2 rounded-xl text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 relative"
                title="Compare Products"
              >
                <ArrowLeftRight className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-indigo-600 text-white text-[9px] font-bold flex items-center justify-center rounded-full">
                  {compareList.length}
                </span>
              </button>
            )}

            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5 text-amber-400" />}
            </button>

            <Link
              to="/cart"
              className="p-2 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors relative"
              aria-label="Shopping cart"
            >
              <ShoppingBag className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center rounded-full ring-2 ring-white dark:ring-gray-950">
                  {cartCount}
                </span>
              )}
            </Link>

            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={isMenuOpen}
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="sm:hidden border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950 overflow-hidden"
          >
            <div className="px-4 pt-3 pb-6 space-y-4">
              {/* Mobile Search Form */}
              <form onSubmit={handleSearchSubmit} className="relative w-full">
                <input
                  data-search-input="true"
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search products or descriptions..."
                  className={`w-full pl-10 pr-20 py-2.5 bg-gray-50 dark:bg-gray-900 border rounded-xl text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 transition-all ${
                    isListening
                      ? 'border-red-500 ring-2 ring-red-400/50 bg-red-50/30 dark:bg-red-950/20'
                      : 'border-gray-200 dark:border-gray-700 focus:ring-indigo-500'
                  }`}
                />
                <Search className="absolute left-3.5 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
                
                <div className="absolute right-2.5 top-2 flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={toggleVoiceSearch}
                    title={isListening ? "Listening..." : "Search by voice"}
                    className={`p-1.5 rounded-full transition-all cursor-pointer ${
                      isListening
                        ? 'bg-red-500 text-white animate-pulse shadow-md shadow-red-500/30'
                        : 'text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  </button>

                  {searchTerm && (
                    <button
                      type="button"
                      onClick={handleClearSearch}
                      className="p-1 text-gray-400 hover:text-gray-600 rounded-full"
                      title="Clear search"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </form>

              {/* Mobile Navigation Links */}
              <div className="space-y-1 pt-1">
                <Link
                  to="/"
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-base font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                    location.pathname === '/' && !searchParams.get('search')
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold'
                      : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-900'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <span>Home Collection</span>
                </Link>

                <Link
                  to="/account"
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-base font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                    location.pathname.startsWith('/account')
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold'
                      : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-900'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <span className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    My Account & Addresses
                  </span>
                </Link>

                <Link
                  to="/orders"
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-base font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                    location.pathname.startsWith('/orders')
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold'
                      : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-900'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <span className="flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Order History & Invoices
                  </span>
                </Link>

                <Link
                  to="/track-order"
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-base font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                    location.pathname.startsWith('/track-order')
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold'
                      : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-900'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <span>Track Order</span>
                </Link>

                <Link
                  to="/wishlist"
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-base font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                    location.pathname === '/wishlist'
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold'
                      : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-900'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <span className="flex items-center gap-2">
                    <Heart className="h-4 w-4" />
                    <span>Wishlist</span>
                  </span>
                  {wishlist.length > 0 && (
                    <span className="px-2 py-0.5 bg-red-100 dark:bg-red-950/70 text-red-600 dark:text-red-400 text-xs font-bold rounded-full">
                      {wishlist.length}
                    </span>
                  )}
                </Link>

                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    openCompareModal();
                  }}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                >
                  <span className="flex items-center gap-2">
                    <ArrowLeftRight className="h-4 w-4" />
                    Compare Products
                  </span>
                  {compareList.length > 0 && (
                    <span className="px-2 py-0.5 bg-indigo-600 text-white text-xs font-bold rounded-full">
                      {compareList.length}/3
                    </span>
                  )}
                </button>

                <Link
                  to="/cart"
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-base font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                    location.pathname === '/cart'
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold'
                      : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-900'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <span className="flex items-center gap-2">
                    <ShoppingBag className="h-4 w-4" />
                    Shopping Cart
                  </span>
                  {cartCount > 0 && (
                    <span className="px-2 py-0.5 bg-indigo-600 text-white text-xs font-bold rounded-full">
                      {cartCount} items
                    </span>
                  )}
                </Link>
              </div>

              {/* Mobile Auth Links */}
              <div className="pt-3 border-t border-gray-100 dark:border-gray-800">
                {isAuthenticated ? (
                  <div className="space-y-1">
                    <Link
                      to="/admin/dashboard"
                      className="block px-3 py-2.5 rounded-xl text-base font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Admin Dashboard
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-base font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </button>
                  </div>
                ) : (
                  <Link
                    to="/admin/login"
                    className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <User className="h-4 w-4" />
                    Admin Login
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

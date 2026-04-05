import { useState, useEffect, useCallback } from 'react';
import ProductCard from '../components/ProductCard';
import { Product } from '../types';
import { ShoppingBag, ChevronRight, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../hooks/useAuth';

const SLIDES = [
  {
    id: 1,
    image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&q=80",
    title: "Premium Essentials",
    description: "Discover our curated collection of high-quality products designed for the modern individual.",
    cta: "Shop Collection"
  },
  {
    id: 2,
    image: "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=1600&q=80",
    title: "Modern Style",
    description: "Quality meets style in every piece. Elevate your daily routine with our exclusive items.",
    cta: "Explore Style"
  },
  {
    id: 3,
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1600&q=80",
    title: "Exclusive Offers",
    description: "Join our community today and get the best deals on our latest arrivals and seasonal picks.",
    cta: "Join Now"
  }
];

export default function Home() {
  const { token, isAuthenticated } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [wishlistIds, setWishlistIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('All');

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
  }, []);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + SLIDES.length) % SLIDES.length);
  }, []);

  useEffect(() => {
    const timer = setInterval(nextSlide, 5000);
    return () => clearInterval(timer);
  }, [nextSlide]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const productsRes = await fetch('/api/products');
        const productsData = await productsRes.json();
        setProducts(productsData);

        if (isAuthenticated) {
          const wishlistRes = await fetch('/api/wishlist', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (wishlistRes.ok) {
            const wishlistData = await wishlistRes.json();
            setWishlistIds(wishlistData.map((p: Product) => p.id));
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated, token]);

  const categories = ['All', ...Array.from(new Set(products.map(p => p.category || 'Uncategorized')))];

  const filteredProducts = selectedCategory === 'All' 
    ? products 
    : products.filter(p => (p.category || 'Uncategorized') === selectedCategory);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-16 pb-20">
      {/* Hero Slider Section */}
      <section className="relative h-[500px] md:h-[600px] flex items-center overflow-hidden bg-gray-900">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="absolute inset-0 z-0"
          >
            <div className="absolute inset-0 bg-black/40 z-10" />
            <img
              src={SLIDES[currentSlide].image}
              alt={SLIDES[currentSlide].title}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </motion.div>
        </AnimatePresence>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20 w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.5 }}
              className="max-w-2xl"
            >
              <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight mb-6">
                {SLIDES[currentSlide].title}
              </h1>
              <p className="text-xl text-gray-200 mb-10 leading-relaxed">
                {SLIDES[currentSlide].description}
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <a
                  href="#products"
                  className="inline-flex items-center justify-center px-8 py-4 border border-transparent text-base font-bold rounded-full text-white bg-indigo-600 hover:bg-indigo-700 transition-all duration-300 shadow-lg shadow-indigo-500/25"
                >
                  {SLIDES[currentSlide].cta}
                  <ShoppingBag className="ml-2 h-5 w-5" />
                </a>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Slider Controls */}
        <div className="absolute bottom-8 right-8 z-30 flex gap-4">
          <button
            onClick={prevSlide}
            className="p-3 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-all border border-white/20"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={nextSlide}
            className="p-3 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-all border border-white/20"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </div>

        {/* Indicators */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex gap-2">
          {SLIDES.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`h-1.5 rounded-full transition-all ${
                currentSlide === idx ? 'w-8 bg-indigo-500' : 'w-2 bg-white/50'
              }`}
            />
          ))}
        </div>
      </section>


      {/* Featured Products */}
      <section id="products" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Our Collection</h2>
            <p className="text-gray-500">Handpicked items just for you.</p>
          </div>
          
          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-6 py-2 rounded-full text-sm font-bold transition-all duration-300 ${
                  selectedCategory === category
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          <AnimatePresence mode="popLayout">
            {filteredProducts.map((product, index) => (
              <motion.div
                key={product.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <ProductCard 
                  product={product} 
                  isWishlistedInitial={wishlistIds.includes(product.id)} 
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        
        {filteredProducts.length === 0 && (
          <div className="text-center py-20">
            <ShoppingBag className="h-16 w-16 text-gray-200 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900">No products found</h3>
            <p className="text-gray-500">Try selecting a different category.</p>
          </div>
        )}
      </section>

      {/* Newsletter */}
      <section className="bg-indigo-600 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Stay in the Loop</h2>
          <p className="text-indigo-100 mb-8 max-w-xl mx-auto">
            Subscribe to our newsletter and get 10% off your first order. Be the first to know about new arrivals and exclusive offers.
          </p>
          <form className="max-w-md mx-auto flex gap-2">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-grow px-6 py-3 rounded-full focus:outline-none focus:ring-2 focus:ring-white/50 bg-white/10 text-white placeholder-indigo-200 border border-white/20"
            />
            <button className="px-8 py-3 bg-white text-indigo-600 font-bold rounded-full hover:bg-indigo-50 transition-colors">
              Join
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}

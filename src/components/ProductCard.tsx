import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Product, Review } from '../types';
import { formatPrice } from '../lib/utils';
import { ArrowRight, Heart, Star, ShoppingCart, Zap } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useCart } from '../context/CartContext';

interface ProductCardProps {
  product: Product;
  isWishlistedInitial?: boolean;
}

export default function ProductCard({ product, isWishlistedInitial = false }: ProductCardProps) {
  const { token, isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  const [isWishlisted, setIsWishlisted] = useState(isWishlistedInitial);
  const [loading, setLoading] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [averageRating, setAverageRating] = useState<number>(0);

  useEffect(() => {
    setIsWishlisted(isWishlistedInitial);
  }, [isWishlistedInitial]);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const res = await fetch(`/api/products/${product.id}/reviews`);
        if (res.ok) {
          const data = await res.json();
          setReviews(data);
          if (data.length > 0) {
            const sum = data.reduce((acc: number, r: Review) => acc + r.rating, 0);
            setAverageRating(sum / data.length);
          }
        }
      } catch (err) {
        console.error('Failed to fetch reviews:', err);
      }
    };
    fetchReviews();
  }, [product.id]);

  const toggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isAuthenticated) {
      alert('Please log in to add items to your wishlist.');
      return;
    }

    setLoading(true);
    try {
      if (isWishlisted) {
        const res = await fetch(`/api/wishlist/${product.id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) setIsWishlisted(false);
      } else {
        const res = await fetch('/api/wishlist', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ product_id: product.id })
        });
        if (res.ok) setIsWishlisted(true);
      }
    } catch (err) {
      console.error('Wishlist error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="group bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col relative">
      <button
        onClick={toggleWishlist}
        disabled={loading}
        className={`absolute top-4 right-4 z-10 p-2 rounded-xl backdrop-blur-md transition-all duration-300 ${
          isWishlisted 
            ? 'bg-red-500 text-white shadow-lg shadow-red-500/30' 
            : 'bg-white/80 dark:bg-gray-800/80 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-white dark:hover:bg-gray-700 shadow-sm'
        }`}
      >
        <Heart className={`h-5 w-5 ${isWishlisted ? 'fill-current' : ''}`} />
      </button>
      <div className="aspect-square overflow-hidden relative">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          referrerPolicy="no-referrer"
        />
        {product.is_featured && (
          <span className="absolute top-4 left-4 bg-indigo-600 dark:bg-indigo-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
            Featured
          </span>
        )}
      </div>
      <div className="p-6 flex flex-col flex-grow">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 line-clamp-1">{product.name}</h3>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-4 line-clamp-2 flex-grow">
          {product.description}
        </p>
        
        <div className="flex items-center gap-1 mb-4">
          <div className="flex items-center">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`h-3.5 w-3.5 ${
                  star <= Math.round(averageRating)
                    ? 'text-amber-400 fill-amber-400'
                    : 'text-gray-200 dark:text-gray-700 fill-gray-200 dark:fill-gray-700'
                }`}
              />
            ))}
          </div>
          <span className="text-xs font-bold text-gray-400 dark:text-gray-500 ml-1">
            {averageRating > 0 ? averageRating.toFixed(1) : 'No reviews'}
            {reviews.length > 0 && ` (${reviews.length})`}
          </span>
        </div>

        <div className="flex items-center justify-between mb-4">
          <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400">{formatPrice(product.price)}</span>
          <Link
            to={`/product/${product.id}`}
            className="inline-flex items-center text-sm font-semibold text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400"
          >
            Details
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-auto">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              addToCart(product);
            }}
            className="flex items-center justify-center gap-2 px-3 py-2.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold uppercase tracking-wider rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all"
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            Add to Cart
          </button>
          <Link
            to={`/product/${product.id}`}
            className="flex items-center justify-center gap-2 px-3 py-2.5 bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-wider rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/25"
          >
            <Zap className="h-3.5 w-3.5" />
            Order Now
          </Link>
        </div>
      </div>
    </div>
  );
}

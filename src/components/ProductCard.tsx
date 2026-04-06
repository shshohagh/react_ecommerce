import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Product, Review } from '../types';
import { formatPrice } from '../lib/utils';
import { ArrowRight, Heart, Star } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface ProductCardProps {
  product: Product;
  isWishlistedInitial?: boolean;
}

export default function ProductCard({ product, isWishlistedInitial = false }: ProductCardProps) {
  const { token, isAuthenticated } = useAuth();
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
    <div className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col relative">
      <button
        onClick={toggleWishlist}
        disabled={loading}
        className={`absolute top-4 right-4 z-10 p-2 rounded-xl backdrop-blur-md transition-all duration-300 ${
          isWishlisted 
            ? 'bg-red-500 text-white shadow-lg shadow-red-500/30' 
            : 'bg-white/80 text-gray-400 hover:text-red-500 hover:bg-white shadow-sm'
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
          <span className="absolute top-4 left-4 bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
            Featured
          </span>
        )}
      </div>
      <div className="p-6 flex flex-col flex-grow">
        <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-1">{product.name}</h3>
        <p className="text-gray-500 text-sm mb-4 line-clamp-2 flex-grow">
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
                    : 'text-gray-200 fill-gray-200'
                }`}
              />
            ))}
          </div>
          <span className="text-xs font-bold text-gray-400 ml-1">
            {averageRating > 0 ? averageRating.toFixed(1) : 'No reviews'}
            {reviews.length > 0 && ` (${reviews.length})`}
          </span>
        </div>

        <div className="flex items-center justify-between mt-auto">
          <span className="text-xl font-bold text-indigo-600">{formatPrice(product.price)}</span>
          <Link
            to={`/product/${product.id}`}
            className="inline-flex items-center text-sm font-semibold text-indigo-600 hover:text-indigo-700"
          >
            Details
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-xs flex flex-col relative group">
      {/* Top Floating Actions (Wishlist & Compare) */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
        <div className="h-8 w-8 rounded-xl bg-gray-200/80 dark:bg-gray-800/80 backdrop-blur-md shimmer" />
        <div className="h-8 w-8 rounded-xl bg-gray-200/80 dark:bg-gray-800/80 backdrop-blur-md shimmer" />
      </div>

      {/* Top Left Badge Skeleton */}
      <div className="absolute top-3 left-3 z-10">
        <div className="h-5 w-16 rounded-full bg-gray-200/80 dark:bg-gray-800/80 shimmer" />
      </div>

      {/* Image Container Skeleton */}
      <div className="aspect-square bg-gray-100 dark:bg-gray-800/60 w-full relative overflow-hidden flex items-center justify-center">
        <div className="w-12 h-12 rounded-2xl bg-gray-200/70 dark:bg-gray-700/50 flex items-center justify-center shimmer" />
        {/* Quick View Button Placeholder on bottom */}
        <div className="absolute inset-x-4 bottom-3 h-8 rounded-xl bg-gray-200/60 dark:bg-gray-700/60 shimmer" />
      </div>

      {/* Card Content Skeleton */}
      <div className="p-6 flex flex-col flex-grow space-y-3">
        {/* Title */}
        <div className="h-5 bg-gray-200 dark:bg-gray-800 rounded-lg w-3/4 shimmer" />
        
        {/* Description Lines */}
        <div className="space-y-1.5 flex-grow">
          <div className="h-3.5 bg-gray-200 dark:bg-gray-800 rounded-md w-full shimmer" />
          <div className="h-3.5 bg-gray-200 dark:bg-gray-800 rounded-md w-5/6 shimmer" />
        </div>

        {/* Rating Stars & Count */}
        <div className="flex items-center gap-2 pt-1">
          <div className="flex gap-1">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-3.5 w-3.5 rounded bg-gray-200 dark:bg-gray-800 shimmer" />
            ))}
          </div>
          <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-16 shimmer" />
        </div>

        {/* Price & Details */}
        <div className="flex items-center justify-between pt-2">
          <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded-md w-24 shimmer" />
          <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded-md w-14 shimmer" />
        </div>

        {/* Action Buttons (Add to Cart & Order Now) */}
        <div className="grid grid-cols-2 gap-2 pt-2">
          <div className="h-9 bg-gray-200 dark:bg-gray-800 rounded-xl shimmer" />
          <div className="h-9 bg-gray-200 dark:bg-gray-800 rounded-xl shimmer" />
        </div>
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
      {[...Array(count)].map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function TrendingProductCardSkeleton() {
  return (
    <div className="w-[280px] sm:w-[310px] flex-shrink-0 bg-white dark:bg-gray-800/90 rounded-3xl p-4 border border-gray-100 dark:border-gray-700/60 shadow-xs flex flex-col justify-between space-y-4">
      <div>
        {/* Image Area Skeleton */}
        <div className="relative h-52 w-full rounded-2xl bg-gray-200 dark:bg-gray-700/60 mb-4 overflow-hidden flex items-center justify-center">
          <div className="w-10 h-10 rounded-xl bg-gray-300 dark:bg-gray-600 shimmer" />
          {/* Top badges */}
          <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5">
            <div className="h-5 w-20 bg-gray-300 dark:bg-gray-600 rounded-lg shimmer" />
          </div>
          {/* Right quick buttons */}
          <div className="absolute top-2.5 right-2.5 flex flex-col gap-1.5">
            <div className="h-7 w-7 bg-gray-300 dark:bg-gray-600 rounded-xl shimmer" />
            <div className="h-7 w-7 bg-gray-300 dark:bg-gray-600 rounded-xl shimmer" />
          </div>
        </div>

        {/* Category & Title */}
        <div className="space-y-2">
          <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded-md shimmer" />
          <div className="h-5 w-3/4 bg-gray-200 dark:bg-gray-700 rounded-lg shimmer" />
        </div>

        {/* Live Social Proof Badge */}
        <div className="mt-3 flex items-center gap-2">
          <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded-full shimmer" />
          <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded-full shimmer" />
        </div>
      </div>

      {/* Price & Add to Cart button */}
      <div className="pt-2 border-t border-gray-100 dark:border-gray-700/60 flex items-center justify-between gap-3">
        <div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded-md shimmer" />
        <div className="h-9 w-28 bg-gray-200 dark:bg-gray-700 rounded-xl shimmer" />
      </div>
    </div>
  );
}

export function TrendingProductsCarouselSkeleton() {
  return (
    <div className="flex gap-6 overflow-hidden pb-4 pt-1">
      {[1, 2, 3, 4].map((n) => (
        <TrendingProductCardSkeleton key={n} />
      ))}
    </div>
  );
}

export function ProductDetailsSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-16">
      {/* Navigation Breadcrumb Skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-5 bg-gray-200 dark:bg-gray-800 rounded-md w-36 shimmer" />
        <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded-md w-44 hidden sm:block shimmer" />
      </div>

      {/* Main Product Showcase (Image & Details) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
        {/* Left: Product Image & Badges */}
        <div className="w-full space-y-4">
          <div className="aspect-square rounded-3xl bg-gray-100 dark:bg-gray-800/80 border border-gray-100 dark:border-gray-800 w-full overflow-hidden relative flex items-center justify-center">
            <div className="w-20 h-20 rounded-3xl bg-gray-200/80 dark:bg-gray-700/60 flex items-center justify-center shimmer" />
            <div className="absolute top-4 right-4 h-9 w-9 rounded-2xl bg-gray-200/80 dark:bg-gray-700/60 shimmer" />
          </div>

          {/* Product Badges (Authentic Guarantee & Brand) */}
          <div className="flex items-center justify-between px-2 pt-1">
            <div className="h-5 w-36 bg-gray-200 dark:bg-gray-800 rounded-md shimmer" />
            <div className="h-6 w-24 bg-gray-200 dark:bg-gray-800 rounded-full shimmer" />
          </div>
        </div>

        {/* Right: Product Details & Options */}
        <div className="space-y-6">
          {/* Header Row: Title & Action Buttons */}
          <div>
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="space-y-2 flex-1">
                <div className="h-4 w-24 bg-gray-200 dark:bg-gray-800 rounded-md shimmer" />
                <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded-xl w-4/5 shimmer" />
              </div>
              {/* Share, QR, Wishlist action icons */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="h-10 w-10 rounded-2xl bg-gray-200 dark:bg-gray-800 shimmer" />
                <div className="h-10 w-10 rounded-2xl bg-gray-200 dark:bg-gray-800 shimmer" />
                <div className="h-10 w-10 rounded-2xl bg-gray-200 dark:bg-gray-800 shimmer" />
              </div>
            </div>

            {/* Rating Stars & Review Count */}
            <div className="flex items-center gap-3 pt-1">
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-4 w-4 rounded bg-gray-200 dark:bg-gray-800 shimmer" />
                ))}
              </div>
              <div className="h-4 w-28 bg-gray-200 dark:bg-gray-800 rounded-md shimmer" />
              <div className="h-5 w-24 bg-gray-200 dark:bg-gray-800 rounded-full hidden sm:block shimmer" />
            </div>
          </div>

          {/* Price & Stock Status Banner */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-gray-50/80 dark:bg-gray-900/60 rounded-2xl border border-gray-100 dark:border-gray-800">
            <div className="flex items-baseline gap-3">
              <div className="h-9 w-32 bg-gray-200 dark:bg-gray-800 rounded-lg shimmer" />
              <div className="h-6 w-20 bg-gray-200 dark:bg-gray-800 rounded-full shimmer" />
            </div>
            <div className="h-8 w-32 bg-gray-200 dark:bg-gray-800 rounded-xl shimmer" />
          </div>

          {/* Live Inventory Counter Banner Skeleton */}
          <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/40 space-y-2">
            <div className="flex items-center justify-between">
              <div className="h-4 w-48 bg-amber-200/60 dark:bg-amber-900/60 rounded-md shimmer" />
              <div className="h-4 w-20 bg-amber-200/60 dark:bg-amber-900/60 rounded-md shimmer" />
            </div>
            <div className="h-2 w-full bg-amber-200/40 dark:bg-amber-900/40 rounded-full shimmer" />
          </div>

          {/* Product Description */}
          <div className="space-y-2 py-1">
            <div className="h-3.5 bg-gray-200 dark:bg-gray-800 rounded-md w-full shimmer" />
            <div className="h-3.5 bg-gray-200 dark:bg-gray-800 rounded-md w-11/12 shimmer" />
            <div className="h-3.5 bg-gray-200 dark:bg-gray-800 rounded-md w-4/5 shimmer" />
          </div>

          {/* Variation & Purchase Card */}
          <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-6 sm:p-8 space-y-6 shadow-xs">
            {/* Variation Attributes (e.g. Color / Size) */}
            <div className="space-y-3">
              <div className="h-4 w-28 bg-gray-200 dark:bg-gray-800 rounded-md shimmer" />
              <div className="flex gap-2">
                <div className="h-9 w-20 bg-gray-200 dark:bg-gray-800 rounded-xl shimmer" />
                <div className="h-9 w-20 bg-gray-200 dark:bg-gray-800 rounded-xl shimmer" />
                <div className="h-9 w-20 bg-gray-200 dark:bg-gray-800 rounded-xl shimmer" />
              </div>
            </div>

            {/* Quantity Selector Skeleton */}
            <div className="flex items-center justify-between pt-2">
              <div className="h-4 w-24 bg-gray-200 dark:bg-gray-800 rounded-md shimmer" />
              <div className="h-10 w-32 bg-gray-200 dark:bg-gray-800 rounded-xl shimmer" />
            </div>

            {/* Add to Cart & Buy Now Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="h-12 bg-gray-200 dark:bg-gray-800 rounded-xl shimmer" />
              <div className="h-12 bg-gray-200 dark:bg-gray-800 rounded-xl shimmer" />
            </div>

            {/* Trust Perks (Free Shipping, Returns, Safe Checkout) */}
            <div className="grid grid-cols-3 gap-2 pt-4 border-t border-gray-100 dark:border-gray-800">
              <div className="h-8 bg-gray-100 dark:bg-gray-800/60 rounded-lg shimmer" />
              <div className="h-8 bg-gray-100 dark:bg-gray-800/60 rounded-lg shimmer" />
              <div className="h-8 bg-gray-100 dark:bg-gray-800/60 rounded-lg shimmer" />
            </div>
          </div>
        </div>
      </div>

      {/* Frequently Bought Together Bundle Skeleton */}
      <div className="rounded-3xl bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-100/60 dark:border-indigo-900/40 p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1.5">
            <div className="h-4 w-36 bg-indigo-200/60 dark:bg-indigo-900/60 rounded-md shimmer" />
            <div className="h-6 w-56 bg-indigo-200/80 dark:bg-indigo-900/80 rounded-lg shimmer" />
          </div>
          <div className="h-6 w-28 bg-indigo-200/60 dark:bg-indigo-900/60 rounded-full hidden sm:block shimmer" />
        </div>

        {/* Bundle Items Flow */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 flex items-center gap-3">
              <div className="w-16 h-16 rounded-xl bg-gray-200 dark:bg-gray-800 flex-shrink-0 shimmer" />
              <div className="space-y-2 flex-1">
                <div className="h-4 w-full bg-gray-200 dark:bg-gray-800 rounded shimmer" />
                <div className="h-4 w-16 bg-gray-200 dark:bg-gray-800 rounded shimmer" />
              </div>
            </div>
          ))}
          <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-indigo-200 dark:border-indigo-800/60 space-y-3">
            <div className="h-4 w-20 bg-gray-200 dark:bg-gray-800 rounded shimmer" />
            <div className="h-6 w-24 bg-gray-200 dark:bg-gray-800 rounded-md shimmer" />
            <div className="h-10 w-full bg-indigo-200 dark:bg-indigo-900 rounded-xl shimmer" />
          </div>
        </div>
      </div>

      {/* Related Products Section Skeleton */}
      <section className="pt-8 border-t border-gray-100 dark:border-gray-800 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="h-3 w-28 bg-gray-200 dark:bg-gray-800 rounded shimmer" />
            <div className="h-6 w-44 bg-gray-200 dark:bg-gray-800 rounded-lg shimmer" />
          </div>
          <div className="h-4 w-32 bg-gray-200 dark:bg-gray-800 rounded shimmer" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((n) => (
            <ProductCardSkeleton key={n} />
          ))}
        </div>
      </section>

      {/* Customer Reviews & Feedback Section Skeleton */}
      <section className="pt-8 border-t border-gray-100 dark:border-gray-800">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Left Column: Rating breakdown card & Reviews list */}
          <div className="lg:col-span-7 space-y-8">
            <div className="h-7 w-52 bg-gray-200 dark:bg-gray-800 rounded-xl shimmer" />

            {/* Rating Breakdown Card */}
            <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-6 sm:p-8">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
                <div className="sm:col-span-5 text-center sm:text-left sm:border-r border-gray-100 dark:border-gray-800 sm:pr-6 space-y-3">
                  <div className="h-12 w-20 bg-gray-200 dark:bg-gray-800 rounded-xl shimmer mx-auto sm:mx-0" />
                  <div className="flex gap-1 justify-center sm:justify-start">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-4 w-4 rounded bg-gray-200 dark:bg-gray-800 shimmer" />
                    ))}
                  </div>
                  <div className="h-3 w-32 bg-gray-200 dark:bg-gray-800 rounded shimmer mx-auto sm:mx-0" />
                </div>

                <div className="sm:col-span-7 space-y-2.5">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="h-3 w-8 bg-gray-200 dark:bg-gray-800 rounded shimmer" />
                      <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-800 rounded-full shimmer" />
                      <div className="h-3 w-6 bg-gray-200 dark:bg-gray-800 rounded shimmer" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Reviews List Skeletons */}
            <div className="space-y-4">
              {[1, 2].map((n) => (
                <div key={n} className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 space-y-3 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-800 shimmer" />
                      <div className="space-y-1.5">
                        <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-28 shimmer" />
                        <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-16 shimmer" />
                      </div>
                    </div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-20 shimmer" />
                  </div>
                  <div className="h-3.5 bg-gray-200 dark:bg-gray-800 rounded w-full shimmer" />
                  <div className="h-3.5 bg-gray-200 dark:bg-gray-800 rounded w-3/4 shimmer" />
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Write a Review Form Card Skeleton */}
          <div className="lg:col-span-5 bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-6 sm:p-8 space-y-5 shadow-xs sticky top-24">
            <div className="space-y-1.5">
              <div className="h-6 w-36 bg-gray-200 dark:bg-gray-800 rounded-lg shimmer" />
              <div className="h-3.5 w-48 bg-gray-200 dark:bg-gray-800 rounded shimmer" />
            </div>
            <div className="h-10 bg-gray-100 dark:bg-gray-800/70 rounded-xl shimmer" />
            <div className="h-10 bg-gray-100 dark:bg-gray-800/70 rounded-xl shimmer" />
            <div className="h-28 bg-gray-100 dark:bg-gray-800/70 rounded-xl shimmer" />
            <div className="h-12 bg-indigo-200 dark:bg-indigo-900/60 rounded-xl shimmer" />
          </div>
        </div>
      </section>
    </div>
  );
}

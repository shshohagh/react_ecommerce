import React from 'react';
import { Clock, Package, Truck, CheckCircle, Check, AlertCircle } from 'lucide-react';

interface OrderProgressStepperProps {
  status: string; // 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  createdAt?: any;
}

interface Step {
  key: string;
  label: string;
  shortDesc: string;
  icon: React.ComponentType<{ className?: string }>;
}

const STEPS: Step[] = [
  { key: 'pending', label: 'Order Placed', shortDesc: 'Payment verified', icon: Clock },
  { key: 'confirmed', label: 'Processing', shortDesc: 'Quality check & packed', icon: Package },
  { key: 'shipped', label: 'Shipped', shortDesc: 'In transit with courier', icon: Truck },
  { key: 'delivered', label: 'Delivered', shortDesc: 'Package received', icon: CheckCircle },
];

export default function OrderProgressStepper({ status, createdAt }: OrderProgressStepperProps) {
  const normalizedStatus = status?.toLowerCase() || 'pending';

  // Handle cancelled state
  if (normalizedStatus === 'cancelled') {
    return (
      <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-2xl flex items-center gap-3">
        <AlertCircle className="h-5 w-5 text-rose-600 dark:text-rose-400 flex-shrink-0" />
        <div>
          <p className="text-xs font-bold text-rose-700 dark:text-rose-300">Order Cancelled</p>
          <p className="text-xs text-rose-600/80 dark:text-rose-400/80">This order has been cancelled and refunded if applicable.</p>
        </div>
      </div>
    );
  }

  // Calculate current stage index
  let currentIndex = 0;
  if (normalizedStatus === 'delivered') {
    currentIndex = 3;
  } else if (normalizedStatus === 'shipped') {
    currentIndex = 2;
  } else if (normalizedStatus === 'confirmed' || normalizedStatus === 'processing') {
    currentIndex = 1;
  } else {
    currentIndex = 0;
  }

  // Format date if available
  const formattedDate = (() => {
    if (!createdAt) return '';
    try {
      const d = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
      return !isNaN(d.getTime())
        ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        : '';
    } catch {
      return '';
    }
  })();

  return (
    <div className="w-full py-3">
      {/* Visual Step Tracker Container */}
      <div className="relative">
        
        {/* Progress Background Track */}
        <div className="absolute top-5 left-6 right-6 h-1 bg-gray-100 dark:bg-gray-800 -translate-y-1/2 z-0 rounded-full" />
        
        {/* Active Fill Track */}
        <div
          className="absolute top-5 left-6 h-1 bg-gradient-to-r from-indigo-600 to-emerald-500 -translate-y-1/2 z-0 rounded-full transition-all duration-700"
          style={{
            width: `calc(${(currentIndex / (STEPS.length - 1)) * 100}% - 48px)`,
          }}
        />

        {/* Steps */}
        <div className="relative z-10 grid grid-cols-4 gap-2">
          {STEPS.map((step, idx) => {
            const isCompleted = idx < currentIndex;
            const isCurrent = idx === currentIndex;
            const isUpcoming = idx > currentIndex;
            const StepIcon = step.icon;

            return (
              <div key={step.key} className="flex flex-col items-center text-center">
                {/* Node Circle */}
                <div className="relative mb-2">
                  {isCompleted ? (
                    <div className="h-10 w-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 transition-all">
                      <Check className="h-5 w-5 stroke-[2.5]" />
                    </div>
                  ) : isCurrent ? (
                    <div className="relative flex items-center justify-center">
                      {/* Animated Pulse Ring */}
                      <span className="absolute -inset-1 rounded-full bg-indigo-500/30 animate-ping" />
                      <div className="relative h-10 w-10 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30 ring-4 ring-indigo-100 dark:ring-indigo-950">
                        <StepIcon className="h-5 w-5" />
                      </div>
                    </div>
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 border border-gray-200 dark:border-gray-700 flex items-center justify-center">
                      <StepIcon className="h-4 w-4" />
                    </div>
                  )}
                </div>

                {/* Stage Title */}
                <p
                  className={`text-xs font-bold transition-colors line-clamp-1 ${
                    isCurrent
                      ? 'text-indigo-600 dark:text-indigo-400 font-extrabold'
                      : isCompleted
                      ? 'text-gray-900 dark:text-white font-bold'
                      : 'text-gray-400 dark:text-gray-500'
                  }`}
                >
                  {step.label}
                </p>

                {/* Stage Description / Timestamp */}
                <span className="text-[10px] text-gray-500 dark:text-gray-400 hidden sm:block mt-0.5 max-w-[110px] leading-tight">
                  {idx === 0 && formattedDate ? `Placed ${formattedDate}` : step.shortDesc}
                </span>

                {/* Current Stage Badge */}
                {isCurrent && (
                  <span className="mt-1 px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800">
                    Active
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { motion } from 'motion/react';
import { 
  Clock, 
  PackageCheck, 
  Truck, 
  CheckCircle2, 
  AlertCircle, 
  MapPin, 
  Calendar,
  Sparkles,
  ShieldCheck
} from 'lucide-react';

export interface TrackingStep {
  id: string;
  label: string;
  title: string;
  description: string;
  icon: React.ElementType;
}

interface OrderProgressBarProps {
  status: string;
  estimatedDelivery?: any;
  orderDate?: any;
  carrier?: string;
  trackingNumber?: string;
  shippingAddress?: string;
}

const STEPS: TrackingStep[] = [
  {
    id: 'pending',
    label: 'Placed',
    title: 'Order Placed & Processing',
    description: 'Order confirmed and payment verified. Preparing for fulfillment.',
    icon: Clock
  },
  {
    id: 'confirmed',
    label: 'Prepared',
    title: 'Packed & Ready',
    description: 'Items carefully packed, quality inspected, and handed to courier.',
    icon: PackageCheck
  },
  {
    id: 'shipped',
    label: 'In Transit',
    title: 'Dispatched & On the Way',
    description: 'Package in transit with regional carrier to your delivery hub.',
    icon: Truck
  },
  {
    id: 'delivered',
    label: 'Delivered',
    title: 'Successfully Delivered',
    description: 'Package handed over and delivered to recipient destination.',
    icon: CheckCircle2
  }
];

export default function OrderProgressBar({
  status,
  estimatedDelivery,
  orderDate,
  carrier = 'Express Courier',
  trackingNumber,
  shippingAddress
}: OrderProgressBarProps) {
  const normalizedStatus = (status || 'pending').toLowerCase();

  const getActiveStepIndex = (st: string) => {
    switch (st) {
      case 'pending':
      case 'processing':
        return 0;
      case 'confirmed':
      case 'packed':
      case 'preparing':
        return 1;
      case 'shipped':
      case 'in_transit':
      case 'out_for_delivery':
        return 2;
      case 'delivered':
      case 'completed':
        return 3;
      default:
        return 0;
    }
  };

  const activeIndex = getActiveStepIndex(normalizedStatus);
  const progressPercent = activeIndex === 0 ? 15 : activeIndex === 1 ? 45 : activeIndex === 2 ? 75 : 100;
  const activeStep = STEPS[activeIndex] || STEPS[0];

  const formatDate = (date: any) => {
    if (!date) return 'Calculating...';
    if (typeof date === 'string') return new Date(date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
    if (date && typeof date === 'object' && 'toDate' in date) {
      return date.toDate().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
    }
    return new Date(date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  };

  return (
    <div className="w-full bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-6 sm:p-8 md:p-10 shadow-xs space-y-8" id="order-visual-progress-bar">
      {/* Header with Live Status & Delivery Estimate */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 dark:border-gray-800 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-600"></span>
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Live Shipment Status
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">
            {activeStep.title}
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            {activeStep.description}
          </p>
        </div>

        {/* Estimated Delivery Box */}
        <div className="flex items-center gap-3 bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 px-4 py-3 rounded-2xl flex-shrink-0">
          <Calendar className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          <div>
            <p className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500">
              {normalizedStatus === 'delivered' ? 'Delivered On' : 'Estimated Arrival'}
            </p>
            <p className="text-xs sm:text-sm font-extrabold text-indigo-950 dark:text-indigo-200">
              {formatDate(estimatedDelivery)}
            </p>
          </div>
        </div>
      </div>

      {/* Progress Bar Container - Desktop */}
      <div className="relative pt-4 pb-2 hidden md:block">
        {/* Background Track */}
        <div className="absolute top-10 left-12 right-12 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
          {/* Animated Fill Bar */}
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full"
          />
        </div>

        {/* Step Nodes */}
        <div className="relative flex justify-between">
          {STEPS.map((step, index) => {
            const isCompleted = index < activeIndex;
            const isCurrent = index === activeIndex;
            const Icon = step.icon;

            return (
              <div key={step.id} className="flex flex-col items-center text-center max-w-[160px] group">
                {/* Node Circle */}
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: isCurrent ? 1.1 : 1 }}
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center border-2 transition-all duration-300 relative z-10 ${
                    isCompleted
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : isCurrent
                      ? 'bg-white dark:bg-gray-900 border-indigo-600 text-indigo-600 shadow-lg shadow-indigo-600/20 ring-4 ring-indigo-100 dark:ring-indigo-950'
                      : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-600'
                  }`}
                >
                  <Icon className={`h-5 w-5 ${isCurrent ? 'animate-bounce-subtle' : ''}`} />
                </motion.div>

                {/* Node Label & Title */}
                <div className="mt-3 space-y-0.5">
                  <p className={`text-xs font-black uppercase tracking-wider ${
                    isCurrent ? 'text-indigo-600 dark:text-indigo-400' : isCompleted ? 'text-gray-900 dark:text-white' : 'text-gray-400'
                  }`}>
                    {step.label}
                  </p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-2 leading-tight">
                    {step.title}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Progress Bar Container - Mobile Stepper */}
      <div className="md:hidden space-y-4">
        {/* Mobile Linear Bar */}
        <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden mb-6">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.8 }}
            className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full"
          />
        </div>

        {/* Mobile Vertical Steps */}
        <div className="space-y-4 relative pl-4 border-l-2 border-indigo-100 dark:border-indigo-900/50 ml-3">
          {STEPS.map((step, index) => {
            const isCompleted = index < activeIndex;
            const isCurrent = index === activeIndex;
            const Icon = step.icon;

            return (
              <div key={step.id} className="relative pl-6 pb-2">
                {/* Node Icon on vertical line */}
                <div className={`absolute -left-[25px] top-0 w-8 h-8 rounded-xl flex items-center justify-center border-2 ${
                  isCompleted
                    ? 'bg-indigo-600 border-indigo-600 text-white'
                    : isCurrent
                    ? 'bg-white dark:bg-gray-900 border-indigo-600 text-indigo-600 ring-2 ring-indigo-100 dark:ring-indigo-950'
                    : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-400'
                }`}>
                  <Icon className="h-4 w-4" />
                </div>

                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <h4 className={`text-xs font-black uppercase tracking-wider ${
                      isCurrent ? 'text-indigo-600 dark:text-indigo-400' : isCompleted ? 'text-gray-900 dark:text-white' : 'text-gray-400'
                    }`}>
                      {step.label}
                    </h4>
                    {isCurrent && (
                      <span className="text-[10px] bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-bold px-2 py-0.5 rounded-full">
                        In Progress
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-bold text-gray-800 dark:text-gray-200">{step.title}</p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">{step.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Shipment Meta Footer */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-gray-100 dark:border-gray-800 text-xs">
        <div className="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-2xl">
          <p className="text-[10px] uppercase font-bold text-gray-400">Carrier Partner</p>
          <p className="font-bold text-gray-800 dark:text-gray-200 mt-0.5 flex items-center gap-1.5">
            <Truck className="h-3.5 w-3.5 text-indigo-600" />
            {carrier}
          </p>
        </div>

        <div className="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-2xl">
          <p className="text-[10px] uppercase font-bold text-gray-400">Tracking Code</p>
          <p className="font-mono font-bold text-gray-800 dark:text-gray-200 mt-0.5">
            {trackingNumber || 'SC-TRK-78921'}
          </p>
        </div>

        <div className="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-2xl">
          <p className="text-[10px] uppercase font-bold text-gray-400">Delivery Guarantee</p>
          <p className="font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5" />
            Insured & Protected
          </p>
        </div>
      </div>
    </div>
  );
}

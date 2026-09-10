import React, { useState, useEffect, useMemo } from 'react';
import { 
  MapPin, 
  Truck, 
  Navigation, 
  Compass, 
  Maximize2, 
  Minimize2, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Layers, 
  CheckCircle2, 
  Clock, 
  Radio, 
  ShieldCheck, 
  Package, 
  AlertCircle,
  Sun,
  CloudRain,
  ChevronRight,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ShippingRouteMapProps {
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered';
  orderId: string;
  destinationAddress: string;
  customerName: string;
  trackingNumber?: string;
  estimatedDelivery?: string;
}

interface Waypoint {
  id: string;
  label: string;
  city: string;
  facility: string;
  status: 'completed' | 'current' | 'upcoming';
  timestamp: string;
  xPercent: number; // 0 - 100 for SVG canvas position
  yPercent: number; // 0 - 100
  notes: string;
  weather: string;
}

export default function ShippingRouteMap({
  status,
  orderId,
  destinationAddress,
  customerName,
  trackingNumber = `TRK-${orderId.slice(0, 8).toUpperCase()}`,
  estimatedDelivery
}: ShippingRouteMapProps) {
  const [mapTheme, setMapTheme] = useState<'road' | 'satellite' | 'radar'>('road');
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [selectedWaypoint, setSelectedWaypoint] = useState<Waypoint | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [simulatedVehicleStep, setSimulatedVehicleStep] = useState(0);

  // Generate stable deterministic waypoints based on the order ID & destination
  const waypoints: Waypoint[] = useMemo(() => {
    // 5 progressive waypoints from national fulfillment hub to customer door
    const list: Waypoint[] = [
      {
        id: 'origin',
        label: 'Fulfillment Center',
        city: 'Pacific West Mega-Hub, CA',
        facility: 'Central Automated Fulfillment Center #04',
        status: status === 'pending' ? 'current' : 'completed',
        timestamp: 'Day 1 • 08:30 AM',
        xPercent: 12,
        yPercent: 78,
        notes: 'Package packaged, verified, weighed, and queued for dispatch',
        weather: 'Sunny, 68°F'
      },
      {
        id: 'sorting',
        label: 'Regional Sort Hub',
        city: 'Metro Intermodal Logistics Yard, NV',
        facility: 'Air & Ground Sort Facility North',
        status: status === 'pending' ? 'upcoming' : status === 'confirmed' ? 'current' : 'completed',
        timestamp: 'Day 1 • 06:15 PM',
        xPercent: 34,
        yPercent: 55,
        notes: 'Barcodes scanned, pallet sorted for line-haul transport',
        weather: 'Clear, 64°F'
      },
      {
        id: 'transit',
        label: 'Transit Corridor',
        city: 'Midwest Highway Interchange Terminal, CO',
        facility: 'Cross-Country Freight Depot',
        status: status === 'pending' || status === 'confirmed' ? 'upcoming' : status === 'shipped' ? 'current' : 'completed',
        timestamp: 'Day 2 • 11:40 AM',
        xPercent: 58,
        yPercent: 38,
        notes: 'Autonomous line-haul driver handover, GPS sensor operational',
        weather: 'Partly Cloudy, 59°F'
      },
      {
        id: 'last_mile',
        label: 'Local Delivery Station',
        city: 'Metropolitan Courier Hub',
        facility: 'Last-Mile Delivery Depot #88',
        status: status === 'delivered' ? 'completed' : status === 'shipped' ? 'upcoming' : 'upcoming',
        timestamp: 'Day 3 • 07:15 AM',
        xPercent: 78,
        yPercent: 48,
        notes: 'Package loaded onto local electric courier van for final delivery route',
        weather: 'Clear, 65°F'
      },
      {
        id: 'destination',
        label: 'Customer Residence',
        city: destinationAddress || 'Customer Destination Address',
        facility: `Delivery to ${customerName || 'Customer'}`,
        status: status === 'delivered' ? 'current' : 'upcoming',
        timestamp: status === 'delivered' ? 'Delivered' : (estimatedDelivery ? `Est. ${new Date(estimatedDelivery).toLocaleDateString()}` : 'In Transit'),
        xPercent: 92,
        yPercent: 24,
        notes: status === 'delivered' ? 'Delivered safely to front porch / parcel locker' : 'Expected delivery window on schedule',
        weather: 'Clear, 66°F'
      }
    ];

    return list;
  }, [status, orderId, destinationAddress, customerName, estimatedDelivery]);

  // Determine current vehicle percentage position along the SVG path
  const vehicleProgress = useMemo(() => {
    switch (status) {
      case 'pending':
        return 12; // At origin
      case 'confirmed':
        return 34; // At regional hub
      case 'shipped':
        return 62; // Moving along highway
      case 'delivered':
        return 92; // At customer door
      default:
        return 12;
    }
  }, [status]);

  // Subtle vehicle micro-movement pulse for live feel
  useEffect(() => {
    if (status !== 'shipped') return;
    const interval = setInterval(() => {
      setSimulatedVehicleStep(prev => (prev + 1) % 100);
    }, 2000);
    return () => clearInterval(interval);
  }, [status]);

  // Coordinate math for vehicle on curved path
  const vehicleX = vehicleProgress + (status === 'shipped' ? Math.sin(simulatedVehicleStep) * 0.8 : 0);
  const vehicleY = (
    // Approximate curve height matching SVG bezier curve
    status === 'pending' ? 78 :
    status === 'confirmed' ? 55 :
    status === 'shipped' ? 36 :
    24
  );

  const activeWaypoint = useMemo(() => {
    return waypoints.find(w => w.status === 'current') || waypoints[waypoints.length - 1];
  }, [waypoints]);

  return (
    <div className={`bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden transition-all duration-300 ${
      isFullscreen ? 'fixed inset-4 z-50 rounded-2xl shadow-2xl flex flex-col' : ''
    }`}>
      {/* Header with Title & Live Telemetry Controls */}
      <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-50/50 dark:bg-gray-950/30">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/40">
              <Radio className="h-3 w-3 animate-pulse text-indigo-600 dark:text-indigo-400" />
              Live Route Telemetry
            </span>
            <span className="text-xs font-mono text-gray-400 dark:text-gray-500">
              {trackingNumber}
            </span>
          </div>
          <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>Visual Shipping Route</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-md uppercase tracking-wider bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
              {status === 'delivered' ? 'Arrived' : status === 'shipped' ? 'In Transit' : status === 'confirmed' ? 'Departing' : 'Order Placed'}
            </span>
          </h2>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Map Style Switcher */}
          <div className="bg-gray-100 dark:bg-gray-800 p-1 rounded-xl flex items-center gap-1 text-xs">
            <button
              onClick={() => setMapTheme('road')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                mapTheme === 'road'
                  ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Road
            </button>
            <button
              onClick={() => setMapTheme('radar')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                mapTheme === 'radar'
                  ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Radar
            </button>
            <button
              onClick={() => setMapTheme('satellite')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                mapTheme === 'satellite'
                  ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Satellite
            </button>
          </div>

          {/* Zoom Buttons */}
          <button
            onClick={() => setZoomLevel(prev => Math.min(prev + 0.25, 1.75))}
            className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 hover:text-indigo-600 transition-colors cursor-pointer"
            title="Zoom in"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <button
            onClick={() => setZoomLevel(prev => Math.max(prev - 0.25, 0.75))}
            className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 hover:text-indigo-600 transition-colors cursor-pointer"
            title="Zoom out"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <button
            onClick={() => setZoomLevel(1)}
            className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 hover:text-indigo-600 transition-colors cursor-pointer"
            title="Reset view"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 hover:text-indigo-600 transition-colors cursor-pointer"
            title={isFullscreen ? 'Exit full screen' : 'Expand map full screen'}
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Main Interactive Map Canvas */}
      <div 
        className={`relative w-full overflow-hidden select-none transition-colors duration-500 ${
          isFullscreen ? 'flex-1 min-h-[480px]' : 'h-[360px] sm:h-[420px]'
        } ${
          mapTheme === 'road'
            ? 'bg-[#f4f7f6] dark:bg-[#0f172a]'
            : mapTheme === 'radar'
            ? 'bg-[#050b14]'
            : 'bg-[#1e293b]'
        }`}
      >
        {/* Geographic Background Grid and Landforms */}
        <div 
          className="absolute inset-0 transition-transform duration-300 ease-out origin-center"
          style={{ transform: `scale(${zoomLevel})` }}
        >
          {/* Topographic and Road Grid SVG */}
          <svg className="w-full h-full absolute inset-0 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              {/* Pattern for Map Grid */}
              <pattern id="road-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path 
                  d="M 40 0 L 0 0 0 40" 
                  fill="none" 
                  stroke={mapTheme === 'radar' ? '#0e2338' : mapTheme === 'satellite' ? '#334155' : '#e2e8f0'} 
                  strokeWidth="0.8" 
                />
              </pattern>

              {/* Highway Route Gradient */}
              <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#4f46e5" />
                <stop offset="50%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#10b981" />
              </linearGradient>

              {/* Pulsing Radar Glow Filter */}
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Background Texture */}
            <rect width="100%" height="100%" fill="url(#road-grid)" />

            {/* Simulated Water Bodies / Coastal Outlines */}
            <path
              d="M 0,0 Q 80,120 120,300 T 60,600 L 0,600 Z"
              fill={mapTheme === 'radar' ? '#091829' : mapTheme === 'satellite' ? '#0f172a' : '#e0f2fe'}
              opacity="0.7"
            />
            <path
              d="M 800,0 Q 950,180 920,400 T 1000,600 L 1000,0 Z"
              fill={mapTheme === 'radar' ? '#091829' : mapTheme === 'satellite' ? '#0f172a' : '#e0f2fe'}
              opacity="0.5"
            />

            {/* Simulated Secondary Highways / Arterial Roads */}
            <g stroke={mapTheme === 'radar' ? '#142f4c' : mapTheme === 'satellite' ? '#3b4c65' : '#cbd5e1'} strokeWidth="1.5" fill="none" opacity="0.4">
              <path d="M 50,450 C 200,420 350,550 550,520 S 800,450 950,420" />
              <path d="M 120,100 C 300,180 400,120 650,220 S 850,150 980,180" />
              <path d="M 280,50 C 320,250 450,350 480,550" />
              <path d="M 720,50 C 680,250 780,450 750,580" />
            </g>

            {/* Primary Highway Polyline (The Active Shipping Route) */}
            <path
              d="M 120,320 C 260,280 340,220 580,150 S 780,190 920,95"
              fill="none"
              stroke={mapTheme === 'radar' ? '#1e3a5f' : '#94a3b8'}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray="4 6"
              opacity="0.5"
            />

            {/* Completed Journey Path */}
            <path
              d="M 120,320 C 260,280 340,220 580,150 S 780,190 920,95"
              fill="none"
              stroke="url(#routeGradient)"
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={
                status === 'delivered' ? '1000 0' :
                status === 'shipped' ? '500 500' :
                status === 'confirmed' ? '220 780' :
                '20 980'
              }
              filter={mapTheme === 'radar' ? 'url(#glow)' : undefined}
            />

            {/* Animated Radar Scanning Sweep in Radar Mode */}
            {mapTheme === 'radar' && (
              <circle
                cx={`${vehicleX}%`}
                cy={`${vehicleY}%`}
                r="60"
                fill="none"
                stroke="#6366f1"
                strokeWidth="1.5"
                opacity="0.3"
                className="animate-ping"
              />
            )}
          </svg>

          {/* Waypoint Markers on Canvas */}
          {waypoints.map((wp, index) => {
            const isCompleted = wp.status === 'completed';
            const isCurrent = wp.status === 'current';
            const isSelected = selectedWaypoint?.id === wp.id;

            return (
              <div
                key={wp.id}
                style={{ left: `${wp.xPercent}%`, top: `${wp.yPercent}%` }}
                className="absolute -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer group"
                onClick={() => setSelectedWaypoint(wp)}
              >
                {/* Sonar Beacon pulse for current active node */}
                {isCurrent && (
                  <span className="absolute -inset-2 rounded-full bg-indigo-500/30 animate-ping" />
                )}

                {/* Waypoint Icon Badge */}
                <div 
                  className={`w-9 h-9 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-300 transform group-hover:scale-125 ${
                    isSelected 
                      ? 'ring-4 ring-indigo-500 scale-110' 
                      : ''
                  } ${
                    isCompleted
                      ? 'bg-emerald-500 text-white shadow-emerald-500/25'
                      : isCurrent
                      ? 'bg-indigo-600 text-white shadow-indigo-600/30 ring-2 ring-white'
                      : 'bg-white dark:bg-gray-800 text-gray-400 border border-gray-200 dark:border-gray-700 shadow-sm'
                  }`}
                >
                  {index === 0 ? (
                    <Package className="h-4 w-4" />
                  ) : index === waypoints.length - 1 ? (
                    <MapPin className="h-4 w-4" />
                  ) : isCompleted ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <Clock className="h-4 w-4" />
                  )}
                </div>

                {/* Waypoint Label Tooltip Pill */}
                <div className="absolute top-10 left-1/2 -translate-x-1/2 whitespace-nowrap pointer-events-none opacity-90 group-hover:opacity-100 transition-opacity">
                  <div className={`px-2 py-1 rounded-lg text-[10px] font-extrabold shadow-md ${
                    isCurrent
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white/90 dark:bg-gray-900/90 text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-gray-800 backdrop-blur-xs'
                  }`}>
                    {wp.label}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Animated Delivery Carrier Vehicle Marker */}
          <motion.div
            animate={{
              left: `${vehicleX}%`,
              top: `${vehicleY}%`
            }}
            transition={{ type: 'spring', damping: 20, stiffness: 60 }}
            className="absolute -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none"
          >
            <div className="relative">
              {/* Radar pulse ripples */}
              <span className="absolute -inset-3 rounded-full bg-indigo-500/25 animate-ping" />
              <span className="absolute -inset-1.5 rounded-full bg-indigo-500/40" />

              {/* Vehicle Pill */}
              <div className="h-10 w-10 rounded-2xl bg-indigo-600 text-white shadow-xl shadow-indigo-600/40 flex items-center justify-center border-2 border-white dark:border-gray-900 relative">
                <Truck className="h-5 w-5 animate-pulse" />
              </div>

              {/* Live Speed Tag */}
              <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-gray-900/90 text-white text-[9px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap shadow-sm border border-gray-800 backdrop-blur-xs">
                {status === 'shipped' ? '58 MPH • GPS Live' : status === 'delivered' ? 'Completed' : 'Hub Transit'}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Live GPS Telemetry Floating Card (Top Left) */}
        <div className="absolute top-4 left-4 z-30 max-w-xs bg-white/90 dark:bg-gray-900/90 backdrop-blur-md rounded-2xl p-3.5 border border-gray-200/80 dark:border-gray-800 shadow-md">
          <div className="flex items-center justify-between gap-3 text-xs mb-1.5">
            <div className="flex items-center gap-1.5 font-bold text-gray-900 dark:text-white">
              <Compass className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              <span>Carrier Fleet Van #412</span>
            </div>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md">
              GPS Active
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-500 dark:text-gray-400 pt-1 border-t border-gray-100 dark:border-gray-800">
            <div>
              <p className="text-[10px] text-gray-400">Current Facility</p>
              <p className="font-semibold text-gray-800 dark:text-gray-200 truncate">
                {activeWaypoint.city.split(',')[0]}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-gray-400">Weather Along Route</p>
              <p className="font-semibold text-gray-800 dark:text-gray-200">
                {activeWaypoint.weather}
              </p>
            </div>
          </div>
        </div>

        {/* Legend / Status Overlay (Bottom Left) */}
        <div className="absolute bottom-4 left-4 z-30 flex items-center gap-2 text-[11px] font-semibold bg-white/80 dark:bg-gray-900/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-gray-200/80 dark:border-gray-800 text-gray-600 dark:text-gray-300 shadow-xs">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-emerald-500" /> Passed
          </span>
          <span className="text-gray-300 dark:text-gray-700">|</span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-indigo-600 animate-ping" /> Current GPS
          </span>
          <span className="text-gray-300 dark:text-gray-700">|</span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-gray-400" /> Upcoming
          </span>
        </div>
      </div>

      {/* Waypoint Details Modal / Drawer */}
      <AnimatePresence>
        {selectedWaypoint && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="p-5 border-t border-gray-100 dark:border-gray-800 bg-indigo-50/40 dark:bg-indigo-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  Checkpoint Inspection
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                  selectedWaypoint.status === 'completed'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : selectedWaypoint.status === 'current'
                    ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                }`}>
                  {selectedWaypoint.status}
                </span>
              </div>
              <h4 className="font-extrabold text-gray-900 dark:text-white text-base">
                {selectedWaypoint.label} — {selectedWaypoint.city}
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {selectedWaypoint.facility} • {selectedWaypoint.notes}
              </p>
            </div>

            <button
              onClick={() => setSelectedWaypoint(null)}
              className="self-end sm:self-auto px-3.5 py-1.5 bg-white dark:bg-gray-800 hover:bg-gray-50 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 text-xs font-bold rounded-xl shadow-2xs transition-colors cursor-pointer"
            >
              Close Details
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Interactive Waypoints Horizontal Timeline Bar */}
      <div className="p-6 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          {waypoints.map((wp, idx) => (
            <button
              key={wp.id}
              onClick={() => setSelectedWaypoint(wp)}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                wp.status === 'current'
                  ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800 shadow-xs'
                  : wp.status === 'completed'
                  ? 'bg-gray-50/60 dark:bg-gray-800/40 border-gray-100 dark:border-gray-800 hover:border-gray-300'
                  : 'bg-transparent border-dashed border-gray-200 dark:border-gray-800 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold text-gray-400">Step {idx + 1}</span>
                {wp.status === 'completed' ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                ) : wp.status === 'current' ? (
                  <span className="h-2 w-2 rounded-full bg-indigo-600 animate-pulse" />
                ) : (
                  <Clock className="h-3.5 w-3.5 text-gray-300 dark:text-gray-600" />
                )}
              </div>
              <p className="text-xs font-bold text-gray-900 dark:text-white truncate">
                {wp.label}
              </p>
              <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate">
                {wp.city.split(',')[0]}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

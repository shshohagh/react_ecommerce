import React from 'react';
import { ArrowLeftRight, X, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useCompare } from '../context/CompareContext';

export default function CompareFloatingBar() {
  const { compareList, removeFromCompare, clearCompare, openCompareModal } = useCompare();

  if (compareList.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 w-auto max-w-[95vw] sm:max-w-xl"
      >
        <div className="bg-gray-900/95 dark:bg-gray-900/95 text-white backdrop-blur-md rounded-2xl sm:rounded-full px-4 sm:px-5 py-3 shadow-2xl border border-gray-700/60 flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 sm:gap-4">
          
          {/* Left: Product Thumbnails */}
          <div className="flex items-center gap-2">
            <div className="hidden xs:flex items-center gap-1.5 mr-1">
              <div className="p-1.5 bg-indigo-600 rounded-lg text-white">
                <ArrowLeftRight className="h-4 w-4" />
              </div>
            </div>

            <div className="flex items-center gap-2">
              {compareList.map((product) => (
                <div
                  key={product.id}
                  className="relative group w-10 h-10 rounded-xl overflow-hidden bg-gray-800 border border-gray-700 flex-shrink-0"
                >
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFromCompare(product.id);
                    }}
                    className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity cursor-pointer"
                    title={`Remove ${product.name}`}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}

              {/* Empty placeholder slots up to 3 */}
              {[...Array(Math.max(0, 3 - compareList.length))].map((_, i) => (
                <div
                  key={i}
                  className="w-10 h-10 rounded-xl border border-dashed border-gray-700 flex items-center justify-center text-gray-500 text-[10px] font-bold"
                  title="Add another item to compare"
                >
                  +
                </div>
              ))}
            </div>

            <div className="text-xs text-gray-300 font-medium pl-1">
              <span className="font-bold text-white">{compareList.length}/3</span>
              <span className="hidden sm:inline text-gray-400"> ready</span>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 ml-auto sm:ml-2">
            <button
              type="button"
              onClick={openCompareModal}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-xs font-bold rounded-xl sm:rounded-full shadow-md shadow-indigo-600/30 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <span>Compare Now</span>
              <ArrowLeftRight className="h-3.5 w-3.5" />
            </button>

            <button
              type="button"
              onClick={clearCompare}
              className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded-xl transition-colors cursor-pointer"
              title="Clear comparison list"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

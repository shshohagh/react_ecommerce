import { useEffect } from 'react';
import { useCompare } from '../context/CompareContext';

export default function KeyboardShortcuts() {
  const { closeCompareModal, isCompareModalOpen } = useCompare();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInput = 
        target && (
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable
        );

      // Key '/' - Focus search input
      if (e.key === '/' && !isInput) {
        e.preventDefault();
        
        // Find visible navbar search input
        const searchInputs = document.querySelectorAll<HTMLInputElement>('input[data-search-input="true"]');
        let targetInput: HTMLInputElement | null = null;

        for (let i = 0; i < searchInputs.length; i++) {
          const el = searchInputs[i];
          if (el.offsetParent !== null) { // is visible
            targetInput = el;
            break;
          }
        }

        if (!targetInput && searchInputs.length > 0) {
          targetInput = searchInputs[0];
        }

        if (targetInput) {
          targetInput.focus();
          targetInput.select();
        }
      }

      // Key 'Escape' - Close modals or blur inputs
      if (e.key === 'Escape') {
        if (isCompareModalOpen) {
          closeCompareModal();
        }

        // Trigger custom escape event for any active dialog or mobile menu
        window.dispatchEvent(new CustomEvent('app:escape-pressed'));

        if (isInput && target) {
          target.blur();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCompareModalOpen, closeCompareModal]);

  return null;
}

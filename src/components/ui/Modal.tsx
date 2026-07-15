'use client';
import React, { useEffect, useRef } from 'react';
import { FaXmark } from 'react-icons/fa6';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  closeOnClickOutside?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
};

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  closeOnClickOutside = true,
  size = 'md',
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  // Handle Escape Key to Close
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Handle Scroll Locking
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  // Handle Focus Trapping
  useEffect(() => {
    if (!isOpen || !modalRef.current) return;

    const modalElement = modalRef.current;
    
    // Focus the modal itself or the first input on open
    const focusableSelector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    const focusableElements = modalElement.querySelectorAll(focusableSelector);
    
    if (focusableElements.length > 0) {
      (focusableElements[0] as HTMLElement).focus();
    }

    const handleFocusTrap = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const currentFocusables = modalElement.querySelectorAll(focusableSelector);
      if (currentFocusables.length === 0) return;

      const firstElement = currentFocusables[0] as HTMLElement;
      const lastElement = currentFocusables[currentFocusables.length - 1] as HTMLElement;

      if (e.shiftKey) {
        // Shift + Tab -> Wrap to end
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        // Tab -> Wrap to start
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    };

    modalElement.addEventListener('keydown', handleFocusTrap);
    return () => modalElement.removeEventListener('keydown', handleFocusTrap);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
      className="fixed inset-0 bg-neutral-950/60 backdrop-blur-md z-[1000] flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (closeOnClickOutside && e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        ref={modalRef}
        className={`w-full bg-white rounded-3xl shadow-2xl border border-border-subtle overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300 ${sizeClasses[size]}`}
      >
        {/* Modal Header */}
        <div className="p-6 pb-0 flex justify-between items-center">
          {title ? (
            <h3 id="modal-title" className="text-lg font-black text-primary">
              {title}
            </h3>
          ) : (
            <div />
          )}
          <button
            onClick={onClose}
            className="text-secondary hover:text-primary p-1.5 hover:bg-surface-container rounded-full transition-all outline-none focus:ring-2 focus:ring-primary/20"
            aria-label="Close dialog"
          >
            <FaXmark className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 pt-4">
          {children}
        </div>
      </div>
    </div>
  );
}

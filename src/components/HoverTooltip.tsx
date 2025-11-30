import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from '../i18n';
import { X, HelpCircle } from 'lucide-react';

interface HoverTooltipProps {
  targetId: string;
  content: string;
  title?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  showOnHover?: boolean;
  className?: string;
}

const HoverTooltip: React.FC<HoverTooltipProps> = ({
  targetId,
  content,
  title,
  position = 'top',
  delay = 500,
  showOnHover = true,
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();

  useEffect(() => {
    const targetElement = document.querySelector(`[data-guide-id="${targetId}"]`);
    
    if (!targetElement) return;

    const showTooltip = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        const rect = targetElement.getBoundingClientRect();
        const tooltipRect = tooltipRef.current?.getBoundingClientRect();
        
        let top = 0;
        let left = 0;
        
        switch (position) {
          case 'top':
            top = rect.top - (tooltipRect?.height || 0) - 10;
            left = rect.left + (rect.width / 2) - ((tooltipRect?.width || 0) / 2);
            break;
          case 'bottom':
            top = rect.bottom + 10;
            left = rect.left + (rect.width / 2) - ((tooltipRect?.width || 0) / 2);
            break;
          case 'left':
            top = rect.top + (rect.height / 2) - ((tooltipRect?.height || 0) / 2);
            left = rect.left - (tooltipRect?.width || 0) - 10;
            break;
          case 'right':
            top = rect.top + (rect.height / 2) - ((tooltipRect?.height || 0) / 2);
            left = rect.right + 10;
            break;
        }
        
        // Keep tooltip within viewport
        const padding = 10;
        if (top < padding) top = padding;
        if (left < padding) left = padding;
        if (tooltipRect && top + tooltipRect.height > window.innerHeight - padding) {
          top = window.innerHeight - tooltipRect.height - padding;
        }
        if (tooltipRect && left + tooltipRect.width > window.innerWidth - padding) {
          left = window.innerWidth - tooltipRect.width - padding;
        }
        
        setTooltipPosition({ top, left });
        setIsVisible(true);
      }, delay);
    };

    const hideTooltip = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      setIsVisible(false);
    };

    if (showOnHover) {
      targetElement.addEventListener('mouseenter', showTooltip);
      targetElement.addEventListener('mouseleave', hideTooltip);
    } else {
      showTooltip();
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      targetElement.removeEventListener('mouseenter', showTooltip);
      targetElement.removeEventListener('mouseleave', hideTooltip);
    };
  }, [targetId, position, delay, showOnHover]);

  if (!isVisible) return null;

  return (
    <div
      ref={tooltipRef}
      className={`fixed z-[10000] pointer-events-none ${className}`}
      style={{
        top: `${tooltipPosition.top}px`,
        left: `${tooltipPosition.left}px`,
      }}
    >
      <div className="bg-gray-900 text-white rounded-lg shadow-2xl max-w-xs p-4 border border-gray-700">
        {title && (
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <HelpCircle className="w-4 h-4 text-blue-400" />
              <h4 className="font-semibold text-sm">{title}</h4>
            </div>
          </div>
        )}
        <p className="text-sm leading-relaxed">{content}</p>
        <div
          className={`absolute w-0 h-0 border-8 border-transparent ${
            position === 'top'
              ? 'top-full left-1/2 -translate-x-1/2 border-t-gray-900'
              : position === 'bottom'
              ? 'bottom-full left-1/2 -translate-x-1/2 border-b-gray-900'
              : position === 'left'
              ? 'left-full top-1/2 -translate-y-1/2 border-l-gray-900'
              : 'right-full top-1/2 -translate-y-1/2 border-r-gray-900'
          }`}
        />
      </div>
    </div>
  );
};

export default HoverTooltip;


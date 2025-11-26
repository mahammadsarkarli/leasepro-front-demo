import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface SelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
  placeholder?: string;
  className?: string;
}

const Select: React.FC<SelectProps> = ({ 
  onValueChange, 
  children, 
  placeholder = 'Select option',
  className = '' 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={selectRef} className={`relative ${className}`}>
      <SelectTrigger onClick={() => setIsOpen(!isOpen)}>
        <SelectValue placeholder={placeholder} />
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </SelectTrigger>
      {isOpen && (
        <SelectContent>
          {React.Children.map(children, (child) => {
            if (React.isValidElement(child) && child.type === SelectItem) {
              return React.cloneElement(child, {
                onClick: () => {
                  onValueChange?.(child.props.value);
                  setIsOpen(false);
                }
              });
            }
            return child;
          })}
        </SelectContent>
      )}
    </div>
  );
};

interface SelectTriggerProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

const SelectTrigger: React.FC<SelectTriggerProps> = ({ 
  children, 
  onClick, 
  className = '' 
}) => {
  return (
    <button
      onClick={onClick}
      className={`flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  );
};

interface SelectValueProps {
  placeholder?: string;
  children?: React.ReactNode;
}

const SelectValue: React.FC<SelectValueProps> = ({ placeholder, children }) => {
  return (
    <span className={children ? 'text-gray-900' : 'text-gray-500'}>
      {children || placeholder}
    </span>
  );
};

interface SelectContentProps {
  children: React.ReactNode;
  className?: string;
}

const SelectContent: React.FC<SelectContentProps> = ({ 
  children, 
  className = '' 
}) => {
  return (
    <div className={`absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-auto rounded-md border border-gray-200 bg-white shadow-lg ${className}`}>
      {children}
    </div>
  );
};

interface SelectItemProps {
  value: string;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

const SelectItem: React.FC<SelectItemProps> = ({ 
  value, 
  children, 
  onClick, 
  className = '' 
}) => {
  return (
    <div
      onClick={onClick}
      className={`cursor-pointer px-3 py-2 text-sm hover:bg-gray-100 ${className}`}
    >
      {children}
    </div>
  );
};

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem };


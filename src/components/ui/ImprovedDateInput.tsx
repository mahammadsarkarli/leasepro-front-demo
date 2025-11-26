import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useTranslation } from '../../i18n';

interface ImprovedDateInputProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  required?: boolean;
  error?: string;
  placeholder?: string;
  min?: string;
  max?: string;
  disabled?: boolean;
  className?: string;
  disableClear?: boolean;
}

const ImprovedDateInput: React.FC<ImprovedDateInputProps> = ({
  value,
  onChange,
  label,
  required = false,
  error,
  placeholder = 'Tarix seçin',
  min,
  max,
  disabled = false,
  className = '',
  disableClear = false
}) => {
  // Helper functions - defined before state to avoid initialization errors
  const formatDate = (date: Date): string => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };

  const formatDateForInput = (date: Date): string => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getDaysInMonth = (date: Date): number => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date): number => {
    const day = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    // Convert from Sunday-based (0-6) to Monday-based (0-6)
    // Sunday (0) becomes 6, Monday (1) becomes 0, etc.
    return (day + 6) % 7;
  };

  const generateCalendarDays = (date: Date): (Date | null)[] => {
    const daysInMonth = getDaysInMonth(date);
    const firstDay = getFirstDayOfMonth(date);
    const days: (Date | null)[] = [];

    // Add empty days for the first week
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(date.getFullYear(), date.getMonth(), i));
    }

    return days;
  };

  // State variables
  const [isOpen, setIsOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(value ? new Date(value) : null);
  const [inputValue, setInputValue] = useState(value ? formatDate(new Date(value)) : '');
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Azerbaijani month names
  const azerbaijaniMonths = [
    'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'İyun',
    'İyul', 'Avqust', 'Sentyabr', 'Oktyabr', 'Noyabr', 'Dekabr'
  ];

  // Azerbaijani day names (Monday to Sunday)
  const azerbaijaniDays = ['B.E', 'Ç.A', 'Ç', 'C.A', 'C', 'Ş', 'B'];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (value) {
      const date = new Date(value);
      setSelectedDate(date);
      setInputValue(formatDate(date));
      // Set current date to the selected date's month
      setCurrentDate(new Date(date.getFullYear(), date.getMonth(), 1));
    } else {
      setSelectedDate(null);
      setInputValue('');
    }
  }, [value]);

  const handleDateSelect = (date: Date) => {
    // Create a new date in local timezone to avoid timezone issues
    const localDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0, 0);
    setSelectedDate(localDate);
    // Update current date to match the selected date's month
    setCurrentDate(new Date(localDate.getFullYear(), localDate.getMonth(), 1));
    onChange(formatDateForInput(localDate));
    setIsOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newInputValue = e.target.value;
    setInputValue(newInputValue);
    
    // Allow empty input
    if (!newInputValue) {
      setSelectedDate(null);
      onChange('');
      return;
    }

    // Handle DD.MM.YYYY format (most common)
    let date: Date | null = null;
    
    // Try DD.MM.YYYY format first
    const parts = newInputValue.split('.');
    if (parts.length === 3) {
      const day = parseInt(parts[0]);
      const month = parseInt(parts[1]) - 1; // Month is 0-indexed
      const year = parseInt(parts[2]);
      
      if (day >= 1 && day <= 31 && month >= 0 && month <= 11 && year >= 1900 && year <= 2100) {
        date = new Date(year, month, day, 12, 0, 0, 0);
      }
    }
    
    // Try DD/MM/YYYY format as fallback
    if (!date && newInputValue.includes('/')) {
      const parts = newInputValue.split('/');
      if (parts.length === 3) {
        const day = parseInt(parts[0]);
        const month = parseInt(parts[1]) - 1;
        const year = parseInt(parts[2]);
        
        if (day >= 1 && day <= 31 && month >= 0 && month <= 11 && year >= 1900 && year <= 2100) {
          date = new Date(year, month, day, 12, 0, 0, 0);
        }
      }
    }
    
    // Try YYYY-MM-DD format as fallback
    if (!date && newInputValue.includes('-')) {
      const parts = newInputValue.split('-');
      if (parts.length === 3) {
        const year = parseInt(parts[0]);
        const month = parseInt(parts[1]) - 1;
        const day = parseInt(parts[2]);
        
        if (day >= 1 && day <= 31 && month >= 0 && month <= 11 && year >= 1900 && year <= 2100) {
          date = new Date(year, month, day, 12, 0, 0, 0);
        }
      }
    }

    // If we found a valid date, update the component
    if (date && !isNaN(date.getTime())) {
      setSelectedDate(date);
      setCurrentDate(new Date(date.getFullYear(), date.getMonth(), 1));
      onChange(formatDateForInput(date));
      // Update input value to show the formatted date
      setInputValue(formatDate(date));
    }
    // If invalid date, just update the display but don't change the actual value
    // This allows users to type and correct their input
  };

  const clearDate = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedDate(null);
    setInputValue('');
    onChange('');
  };

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date: Date): boolean => {
    return selectedDate ? date.toDateString() === selectedDate.toDateString() : false;
  };

  const isDisabled = (date: Date): boolean => {
    if (min && date < new Date(min)) return true;
    if (max && date > new Date(max)) return true;
    return false;
  };

  const calendarDays = generateCalendarDays(currentDate);
  const { t } = useTranslation();

  return (
    <div className={`relative ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      
             <div className="relative">
         <input
           ref={inputRef}
           type="text"
           value={inputValue}
           onChange={handleInputChange}
           disabled={disabled}
           className={`w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
             error ? 'border-red-300' : ''
           } ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'cursor-pointer'}`}
           placeholder={placeholder}
           onClick={() => !disabled && setIsOpen(!isOpen)}
         />
        
        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
          {selectedDate && !disableClear && (
            <button
              type="button"
              onClick={clearDate}
              className="text-gray-400 hover:text-gray-600 mr-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <Calendar className="w-4 h-4 text-gray-400" />
        </div>
      </div>

      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
      
      {/* Calendar Dropdown */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute z-[9999] mt-1 w-80 bg-white rounded-lg shadow-xl border border-gray-200 p-4"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={goToPreviousMonth}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            <h3 className="text-sm font-medium text-gray-900">
              {azerbaijaniMonths[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h3>
            
            <button
              type="button"
              onClick={goToNextMonth}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {azerbaijaniDays.map((day, index) => (
              <div key={index} className="text-center text-xs font-medium text-gray-500 py-1">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((date, index) => (
              <div key={index} className="text-center">
                {date ? (
                  <button
                    type="button"
                    onClick={() => handleDateSelect(date)}
                    disabled={isDisabled(date)}
                    className={`w-8 h-8 text-sm rounded-full flex items-center justify-center ${
                      isToday(date)
                        ? 'bg-blue-100 text-blue-600 font-medium'
                        : isSelected(date)
                        ? 'bg-blue-600 text-white'
                        : isDisabled(date)
                        ? 'text-gray-300 cursor-not-allowed'
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    {date.getDate()}
                  </button>
                ) : (
                  <div className="w-8 h-8" />
                )}
              </div>
            ))}
          </div>

          {/* Today Button */}
          <div className="mt-4 pt-3 border-t border-gray-200">
            <button
              type="button"
              onClick={() => {
                const today = new Date();
                const localToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12, 0, 0, 0);
                handleDateSelect(localToday);
              }}
              className="w-full text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Bu gün
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImprovedDateInput;

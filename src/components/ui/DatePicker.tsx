import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from '../../i18n';
import { formatDateForInput, formatDisplayDate, parseDateFromDisplay } from '../../utils/dateUtils';
import { Calendar, X, ChevronLeft, ChevronRight } from 'lucide-react';

interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
  disabled?: boolean;
  min?: string;
  max?: string;
  label?: string;
  error?: string;
}

const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  placeholder,
  className = '',
  required = false,
  disabled = false,
  min,
  max,
  label,
  error
}) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [displayValue, setDisplayValue] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Initialize display value and current month
  useEffect(() => {
    if (value) {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        const displayFormatted = formatDisplayDate(date);
        const inputFormatted = formatDateForInput(date);
        const monthToSet = new Date(date.getFullYear(), date.getMonth(), 1);
        
        setDisplayValue(displayFormatted);
        setInputValue(inputFormatted);
        setSelectedDate(date);
        // Set current month to the selected date's month
        setCurrentMonth(monthToSet);
      }
    } else {
      setDisplayValue('');
      setInputValue('');
      setSelectedDate(null);
      // If no date selected, use current month
      setCurrentMonth(new Date());
    }
  }, [value]);

  // Handle click outside to close picker
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle escape key to close picker
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => {
        document.removeEventListener('keydown', handleEscape);
      };
    }
  }, [isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    
    if (newValue) {
      const date = new Date(newValue);
      if (!isNaN(date.getTime())) {
        setDisplayValue(formatDisplayDate(date));
        setSelectedDate(date);
        setCurrentMonth(new Date(date.getFullYear(), date.getMonth(), 1));
        onChange(newValue);
      }
    } else {
      setDisplayValue('');
      setSelectedDate(null);
      onChange('');
    }
  };

  const handleDisplayInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setDisplayValue(newValue);
    
    // Try to parse dd.mm.yyyy format
    if (newValue && newValue.match(/^\d{2}\.\d{2}\.\d{4}$/)) {
      const parsedDate = parseDateFromDisplay(newValue);
      if (parsedDate) {
        const formattedValue = formatDateForInput(parsedDate);
        setInputValue(formattedValue);
        setSelectedDate(parsedDate);
        setCurrentMonth(new Date(parsedDate.getFullYear(), parsedDate.getMonth(), 1));
        onChange(formattedValue);
      }
    }
  };

  const handleClear = () => {
    setDisplayValue('');
    setInputValue('');
    setSelectedDate(null);
    onChange('');
    setIsOpen(false);
  };

  const handleToday = () => {
    const today = new Date();
    const formattedValue = formatDateForInput(today);
    setDisplayValue(formatDisplayDate(today));
    setInputValue(formattedValue);
    setSelectedDate(today);
    setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    onChange(formattedValue);
    setIsOpen(false);
  };

  const handleDateSelect = (date: Date) => {
    const formattedValue = formatDateForInput(date);
    setDisplayValue(formatDisplayDate(date));
    setInputValue(formattedValue);
    setSelectedDate(date);
    onChange(formattedValue);
    setIsOpen(false);
  };

  const handleTogglePicker = () => {
    if (!disabled) {
      // When opening the picker, ensure current month matches selected date
      if (selectedDate && !isOpen) {
        setCurrentMonth(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
      }
      setIsOpen(!isOpen);
    }
  };

  const handleMonthChange = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      if (direction === 'prev') {
        newMonth.setMonth(newMonth.getMonth() - 1);
      } else {
        newMonth.setMonth(newMonth.getMonth() + 1);
      }
      return newMonth;
    });
  };

  const handleMonthSelect = (month: number) => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), month, 1));
  };

  const handleYearSelect = (year: number) => {
    setCurrentMonth(prev => new Date(year, prev.getMonth(), 1));
  };

  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    // Get first day of month and last day of month
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Get the day of week for first day (0 = Sunday, 1 = Monday, etc.)
    const firstDayOfWeek = firstDay.getDay();
    
    // Get the last date of previous month to fill the grid
    const lastDayOfPrevMonth = new Date(year, month, 0);
    
    const days = [];
    
    // Add days from previous month to fill the first week
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const day = lastDayOfPrevMonth.getDate() - i;
      const date = new Date(year, month - 1, day);
      days.push({
        date,
        isCurrentMonth: false,
        isSelected: selectedDate && date.toDateString() === selectedDate.toDateString(),
        isToday: date.toDateString() === new Date().toDateString()
      });
    }
    
    // Add days from current month
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(year, month, day);
      days.push({
        date,
        isCurrentMonth: true,
        isSelected: selectedDate && date.toDateString() === selectedDate.toDateString(),
        isToday: date.toDateString() === new Date().toDateString()
      });
    }
    
    // Add days from next month to fill the last week
    const remainingDays = 42 - days.length; // 6 rows * 7 days = 42
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(year, month + 1, day);
      days.push({
        date,
        isCurrentMonth: false,
        isSelected: selectedDate && date.toDateString() === selectedDate.toDateString(),
        isToday: date.toDateString() === new Date().toDateString()
      });
    }
    
    return days;
  };

  const isDateDisabled = (date: Date) => {
    if (min) {
      const minDate = new Date(min);
      if (date < minDate) return true;
    }
    if (max) {
      const maxDate = new Date(max);
      if (date > maxDate) return true;
    }
    return false;
  };

  const monthNames = [
    t('common.january'), t('common.february'), t('common.march'), t('common.april'),
    t('common.may'), t('common.june'), t('common.july'), t('common.august'),
    t('common.september'), t('common.october'), t('common.november'), t('common.december')
  ];

  const dayNames = [
    t('common.mon'), t('common.tue'), t('common.wed'), t('common.thu'),
    t('common.fri'), t('common.sat'), t('common.sun')
  ];

  const calendarDays = generateCalendarDays();

  return (
    <div className={`relative ${className}`} ref={wrapperRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {/* Display input (dd.mm.yyyy format) */}
        <input
          type="text"
          value={displayValue}
          onChange={handleDisplayInputChange}
          placeholder={placeholder || t('common.selectDate')}
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10 ${
            error ? 'border-red-300' : 'border-gray-300'
          } ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
          disabled={disabled}
          onFocus={() => !disabled && setIsOpen(true)}
          onClick={handleTogglePicker}
          readOnly={disabled}
        />
        
        {/* Calendar icon */}
        <div 
          className={`absolute inset-y-0 right-0 flex items-center pr-3 ${!disabled ? 'cursor-pointer' : ''}`}
          onClick={handleTogglePicker}
        >
          <Calendar className="h-5 w-5 text-gray-400" />
        </div>
        
        {/* Clear button */}
        {displayValue && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute inset-y-0 right-8 flex items-center pr-2"
          >
            <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
          </button>
        )}
      </div>

      {/* Custom Calendar Dropdown */}
      {isOpen && !disabled && (
        <div className="absolute z-[9999] mt-1 w-80 bg-white border border-gray-300 rounded-lg shadow-lg">
          <div className="p-4">
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-medium text-gray-900">{t('common.selectDate')}</h3>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            {/* Quick actions */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <button
                type="button"
                onClick={handleToday}
                className="px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors"
              >
                {t('common.today')}
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="px-3 py-2 text-sm bg-gray-50 text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
              >
                {t('common.clearDate')}
              </button>
            </div>

            {/* Manual date input */}
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                {t('common.manualInput')}
              </label>
              <input
                type="date"
                value={inputValue}
                onChange={handleInputChange}
                min={min}
                max={max}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Calendar Navigation */}
            <div className="flex justify-between items-center mb-4">
              <button
                type="button"
                onClick={() => handleMonthChange('prev')}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              
              <div className="flex gap-2">
                {/* Month Selector */}
                <select
                  value={currentMonth.getMonth()}
                  onChange={(e) => handleMonthSelect(parseInt(e.target.value))}
                  className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {monthNames.map((month, index) => (
                    <option key={index} value={index}>{month}</option>
                  ))}
                </select>
                
                {/* Year Selector */}
                <select
                  value={currentMonth.getFullYear()}
                  onChange={(e) => handleYearSelect(parseInt(e.target.value))}
                  className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {Array.from({ length: 20 }, (_, i) => new Date().getFullYear() - 10 + i).map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
              
              <button
                type="button"
                onClick={() => handleMonthChange('next')}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1 mb-4">
              {/* Day headers */}
              {dayNames.map(day => (
                <div key={day} className="text-xs font-medium text-gray-500 text-center py-1">
                  {day}
                </div>
              ))}
              
              {/* Calendar days */}
              {calendarDays.map((day, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleDateSelect(day.date)}
                  disabled={isDateDisabled(day.date)}
                  className={`
                    text-xs p-2 rounded hover:bg-gray-100 transition-colors
                    ${day.isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}
                    ${day.isSelected ? 'bg-blue-500 text-white hover:bg-blue-600' : ''}
                    ${day.isToday && !day.isSelected ? 'bg-blue-100 text-blue-700' : ''}
                    ${isDateDisabled(day.date) ? 'text-gray-300 cursor-not-allowed hover:bg-transparent' : ''}
                  `}
                >
                  {day.date.getDate()}
                </button>
              ))}
            </div>

            <div className="text-xs text-gray-500">
              {t('common.dateFormatDDMMYYYY')} - {t('common.dateFormat')}
            </div>
          </div>
        </div>
      )}

      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

export default DatePicker;

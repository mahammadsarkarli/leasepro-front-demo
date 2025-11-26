import Swal from 'sweetalert2';

// Notification types
export type NotificationType = 'success' | 'error' | 'warning' | 'info' | 'question';

// Notification options interface
export interface NotificationOptions {
  title?: string;
  text?: string;
  icon?: NotificationType;
  timer?: number;
  showConfirmButton?: boolean;
  showCancelButton?: boolean;
  confirmButtonText?: string;
  cancelButtonText?: string;
  confirmButtonColor?: string;
  cancelButtonColor?: string;
  allowOutsideClick?: boolean;
  allowEscapeKey?: boolean;
  customClass?: {
    popup?: string;
    title?: string;
    content?: string;
  };
}

// Default configuration
const defaultConfig: NotificationOptions = {
  timer: 2000, // Auto-close after 2 seconds as requested
  showConfirmButton: false,
  allowOutsideClick: true,
  allowEscapeKey: true,
  customClass: {
    popup: 'rounded-lg shadow-lg',
    title: 'text-lg font-semibold',
    content: 'text-sm'
  }
};

// Azerbaijani translations
const translations = {
  success: {
    title: 'Uğurlu!',
    confirmButtonText: 'Tamam'
  },
  error: {
    title: 'Xəta!',
    confirmButtonText: 'Tamam'
  },
  warning: {
    title: 'Diqqət!',
    confirmButtonText: 'Tamam',
    cancelButtonText: 'Ləğv et'
  },
  info: {
    title: 'Məlumat',
    confirmButtonText: 'Tamam'
  },
  question: {
    title: 'Sual',
    confirmButtonText: 'Bəli',
    cancelButtonText: 'Xeyr'
  }
};

// Success notification
export const showSuccess = (message: string, options?: NotificationOptions) => {
  return Swal.fire({
    ...defaultConfig,
    icon: 'success',
    title: options?.title || translations.success.title,
    text: message,
    confirmButtonText: options?.confirmButtonText || translations.success.confirmButtonText,
    confirmButtonColor: '#10b981',
    timer: options?.timer || 2000,
    ...options
  });
};

// Error notification
export const showError = (message: string, options?: NotificationOptions) => {
  return Swal.fire({
    ...defaultConfig,
    icon: 'error',
    title: options?.title || translations.error.title,
    text: message,
    confirmButtonText: options?.confirmButtonText || translations.error.confirmButtonText,
    confirmButtonColor: '#ef4444',
    timer: options?.timer || 2000,
    showConfirmButton: true,
    ...options
  });
};

// Warning notification
export const showWarning = (message: string, options?: NotificationOptions) => {
  return Swal.fire({
    ...defaultConfig,
    icon: 'warning',
    title: options?.title || translations.warning.title,
    text: message,
    confirmButtonText: options?.confirmButtonText || translations.warning.confirmButtonText,
    confirmButtonColor: '#f59e0b',
    timer: options?.timer || 2000,
    showConfirmButton: true,
    ...options
  });
};

// Info notification
export const showInfo = (message: string, options?: NotificationOptions) => {
  return Swal.fire({
    ...defaultConfig,
    icon: 'info',
    title: options?.title || translations.info.title,
    text: message,
    confirmButtonText: options?.confirmButtonText || translations.info.confirmButtonText,
    confirmButtonColor: '#3b82f6',
    timer: options?.timer || 2000,
    ...options
  });
};

// Confirmation dialog
export const showConfirmation = (
  message: string,
  options?: NotificationOptions
): Promise<{ isConfirmed: boolean; isDenied: boolean; isDismissed: boolean }> => {
  return Swal.fire({
    ...defaultConfig,
    icon: 'question',
    title: options?.title || translations.question.title,
    text: message,
    showConfirmButton: true,
    showCancelButton: true,
    confirmButtonText: options?.confirmButtonText || translations.question.confirmButtonText,
    cancelButtonText: options?.cancelButtonText || translations.question.cancelButtonText,
    confirmButtonColor: '#10b981',
    cancelButtonColor: '#6b7280',
    timer: undefined,
    allowOutsideClick: false,
    ...options
  });
};

// Loading notification
export const showLoading = (message: string = 'Yüklənir...') => {
  return Swal.fire({
    title: message,
    allowOutsideClick: false,
    allowEscapeKey: false,
    showConfirmButton: false,
    didOpen: () => {
      Swal.showLoading();
    }
  });
};

// Close any open notification
export const closeNotification = () => {
  Swal.close();
};

// Custom notification with HTML content
export const showCustomNotification = (
  title: string,
  htmlContent: string,
  options?: NotificationOptions
) => {
  return Swal.fire({
    ...defaultConfig,
    title,
    html: htmlContent,
    showConfirmButton: true,
    confirmButtonText: options?.confirmButtonText || 'Tamam',
    confirmButtonColor: '#3b82f6',
    timer: undefined,
    ...options
  });
};

// Toast notification (smaller, auto-dismiss)
export const showToast = (
  message: string,
  type: NotificationType = 'success',
  options?: NotificationOptions
) => {
  const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 2000,
    timerProgressBar: true,
    didOpen: (toast) => {
      toast.addEventListener('mouseenter', Swal.stopTimer);
      toast.addEventListener('mouseleave', Swal.resumeTimer);
    }
  });

  return Toast.fire({
    icon: type,
    title: message,
    ...options
  });
};

// Form input notification
export const showInputNotification = (
  title: string,
  inputType: 'text' | 'email' | 'password' | 'number' | 'tel' | 'textarea' = 'text',
  options?: NotificationOptions
) => {
  return Swal.fire({
    ...defaultConfig,
    title,
    input: inputType,
    inputPlaceholder: options?.text || 'Dəyər daxil edin...',
    showCancelButton: true,
    confirmButtonText: options?.confirmButtonText || 'Təsdiq et',
    cancelButtonText: options?.cancelButtonText || 'Ləğv et',
    confirmButtonColor: '#10b981',
    cancelButtonColor: '#6b7280',
    timer: undefined,
    allowOutsideClick: false,
    inputValidator: options?.inputValidator,
    ...options
  });
};

// File upload notification
export const showFileUploadNotification = (
  title: string,
  options?: NotificationOptions
) => {
  return Swal.fire({
    ...defaultConfig,
    title,
    input: 'file',
    inputAttributes: {
      accept: options?.inputAttributes?.accept || '*/*',
      'aria-label': 'Fayl seçin'
    },
    showCancelButton: true,
    confirmButtonText: options?.confirmButtonText || 'Yüklə',
    cancelButtonText: options?.cancelButtonText || 'Ləğv et',
    confirmButtonColor: '#10b981',
    cancelButtonColor: '#6b7280',
    timer: undefined,
    allowOutsideClick: false,
    ...options
  });
};

// Progress notification
export const showProgressNotification = (
  title: string,
  progress: number,
  options?: NotificationOptions
) => {
  return Swal.fire({
    ...defaultConfig,
    title,
    html: `
      <div class="w-full bg-gray-200 rounded-full h-2.5 mb-4">
        <div class="bg-blue-600 h-2.5 rounded-full transition-all duration-300" style="width: ${progress}%"></div>
      </div>
      <div class="text-sm text-gray-600">${progress}% tamamlandı</div>
    `,
    showConfirmButton: false,
    allowOutsideClick: false,
    allowEscapeKey: false,
    timer: undefined,
    ...options
  });
};

// Export all notification functions
export default {
  showSuccess,
  showError,
  showWarning,
  showInfo,
  showConfirmation,
  showLoading,
  closeNotification,
  showCustomNotification,
  showToast,
  showInputNotification,
  showFileUploadNotification,
  showProgressNotification
};

import { showError } from '../services/notifications';
import i18n from '../i18n';

/**
 * API hata mesajlarını analiz edip uygun çeviriyi bulan ve SweetAlert ile gösteren utility
 */

// API hata mesajlarını translation key'lerine map eden fonksiyon
export const getErrorTranslationKey = (error: string, entity: string = 'general'): string => {
  const errorLower = error.toLowerCase();
  
  // Vehicle hataları
  if (entity === 'vehicle' || errorLower.includes('vehicle') || errorLower.includes('license plate')) {
    if (errorLower.includes('license plate') && errorLower.includes('exists')) {
      return 'apiErrors.vehicle.licensePlateExists';
    }
    if (errorLower.includes('not found')) {
      return 'apiErrors.vehicle.notFound';
    }
    if (errorLower.includes('active contracts')) {
      return 'apiErrors.vehicle.hasActiveContracts';
    }
    if (errorLower.includes('insufficient permissions')) {
      return 'apiErrors.vehicle.insufficientPermissions';
    }
    if (errorLower.includes('access denied')) {
      return 'apiErrors.vehicle.accessDenied';
    }
  }
  
  // Contract hataları
  if (entity === 'contract' || errorLower.includes('contract') || errorLower.includes('müqavilə')) {
    if (errorLower.includes('not found')) {
      return 'apiErrors.contract.notFound';
    }
    if (errorLower.includes('has payments') || errorLower.includes('payments')) {
      return 'apiErrors.contract.hasPayments';
    }
    if (errorLower.includes('vehicle') && errorLower.includes('available')) {
      return 'apiErrors.contract.vehicleNotAvailable';
    }
    if (errorLower.includes('customer') && errorLower.includes('not found')) {
      return 'apiErrors.contract.customerNotFound';
    }
    if (errorLower.includes('vehicle') && errorLower.includes('not found')) {
      return 'apiErrors.contract.vehicleNotFound';
    }
    if (errorLower.includes('date')) {
      return 'apiErrors.contract.invalidDates';
    }
    if (errorLower.includes('closed')) {
      return 'apiErrors.contract.alreadyClosed';
    }
    if (errorLower.includes('insufficient permissions')) {
      return 'apiErrors.contract.insufficientPermissions';
    }
    if (errorLower.includes('access denied')) {
      return 'apiErrors.contract.accessDenied';
    }
  }
  
  // Customer hataları
  if (entity === 'customer' || errorLower.includes('customer') || errorLower.includes('müştəri')) {
    if (errorLower.includes('fin') && errorLower.includes('exists')) {
      return 'apiErrors.customer.finCodeExists';
    }
    if (errorLower.includes('phone') && errorLower.includes('exists')) {
      return 'apiErrors.customer.phoneExists';
    }
    if (errorLower.includes('not found')) {
      return 'apiErrors.customer.notFound';
    }
    if (errorLower.includes('active contracts')) {
      return 'apiErrors.customer.hasActiveContracts';
    }
    if (errorLower.includes('fin') && errorLower.includes('invalid')) {
      return 'apiErrors.customer.invalidFinCode';
    }
    if (errorLower.includes('phone') && errorLower.includes('invalid')) {
      return 'apiErrors.customer.invalidPhone';
    }
    if (errorLower.includes('insufficient permissions')) {
      return 'apiErrors.customer.insufficientPermissions';
    }
    if (errorLower.includes('access denied')) {
      return 'apiErrors.customer.accessDenied';
    }
  }
  
  // Payment hataları
  if (entity === 'payment' || errorLower.includes('payment') || errorLower.includes('ödəniş')) {
    if (errorLower.includes('not found')) {
      return 'apiErrors.payment.notFound';
    }
    if (errorLower.includes('contract') && errorLower.includes('not found')) {
      return 'apiErrors.payment.contractNotFound';
    }
    if (errorLower.includes('amount') && (errorLower.includes('invalid') || errorLower.includes('exceeds'))) {
      return 'apiErrors.payment.invalidAmount';
    }
    if (errorLower.includes('remaining')) {
      return 'apiErrors.payment.amountExceedsRemaining';
    }
    if (errorLower.includes('date')) {
      return 'apiErrors.payment.invalidDate';
    }
    if (errorLower.includes('already paid')) {
      return 'apiErrors.payment.alreadyPaid';
    }
    if (errorLower.includes('closed contract')) {
      return 'apiErrors.payment.contractClosed';
    }
    if (errorLower.includes('insufficient permissions')) {
      return 'apiErrors.payment.insufficientPermissions';
    }
    if (errorLower.includes('access denied')) {
      return 'apiErrors.payment.accessDenied';
    }
  }
  
  // Company hataları
  if (entity === 'company' || errorLower.includes('company') || errorLower.includes('şirkət')) {
    if (errorLower.includes('not found')) {
      return 'apiErrors.company.notFound';
    }
    if (errorLower.includes('has data') || errorLower.includes('data')) {
      return 'apiErrors.company.hasData';
    }
    if (errorLower.includes('name') && errorLower.includes('exists')) {
      return 'apiErrors.company.nameExists';
    }
    if (errorLower.includes('insufficient permissions')) {
      return 'apiErrors.company.insufficientPermissions';
    }
    if (errorLower.includes('access denied')) {
      return 'apiErrors.company.accessDenied';
    }
  }
  
  // User/Auth hataları
  if (entity === 'user' || errorLower.includes('user') || errorLower.includes('username') || errorLower.includes('login')) {
    if (errorLower.includes('username') && errorLower.includes('exists')) {
      return 'apiErrors.user.usernameExists';
    }
    if (errorLower.includes('email') && errorLower.includes('exists')) {
      return 'apiErrors.user.emailExists';
    }
    if (errorLower.includes('credentials') || errorLower.includes('invalid')) {
      return 'apiErrors.user.invalidCredentials';
    }
    if (errorLower.includes('session') || errorLower.includes('expired')) {
      return 'apiErrors.user.sessionExpired';
    }
    if (errorLower.includes('unauthorized')) {
      return 'apiErrors.user.unauthorized';
    }
    if (errorLower.includes('not found')) {
      return 'apiErrors.user.notFound';
    }
    if (errorLower.includes('insufficient permissions')) {
      return 'apiErrors.user.insufficientPermissions';
    }
    if (errorLower.includes('access denied')) {
      return 'apiErrors.user.accessDenied';
    }
  }
  
  // Genel HTTP hataları
  if (errorLower.includes('network') || errorLower.includes('fetch failed')) {
    return 'apiErrors.general.networkError';
  }
  if (errorLower.includes('server error') || errorLower.includes('500')) {
    return 'apiErrors.general.serverError';
  }
  if (errorLower.includes('validation')) {
    return 'apiErrors.general.validationError';
  }
  if (errorLower.includes('timeout')) {
    return 'apiErrors.general.timeout';
  }
  if (errorLower.includes('forbidden') || errorLower.includes('403')) {
    return 'apiErrors.general.forbidden';
  }
  if (errorLower.includes('not found') || errorLower.includes('404')) {
    return 'apiErrors.general.notFound';
  }
  if (errorLower.includes('bad request') || errorLower.includes('400')) {
    return 'apiErrors.general.badRequest';
  }
  if (errorLower.includes('conflict') || errorLower.includes('409')) {
    return 'apiErrors.general.conflict';
  }
  if (errorLower.includes('too many') || errorLower.includes('429')) {
    return 'apiErrors.general.tooManyRequests';
  }
  
  // Varsayılan olarak genel bilinmeyen hata
  return 'apiErrors.general.unknownError';
};

/**
 * API hatasını SweetAlert ile gösterir
 * @param error - Hata mesajı veya Error objesi
 * @param entity - İşlem yapılan entity tipi (vehicle, contract, customer, payment, company, user)
 * @param customTitle - Özel başlık (opsiyonel)
 */
export const showApiError = (
  error: string | Error | unknown, 
  entity: string = 'general',
  customTitle?: string
) => {
  let errorMessage = '';
  
  // Error objesinden mesaj çıkar
  if (error instanceof Error) {
    errorMessage = error.message;
  } else if (typeof error === 'string') {
    errorMessage = error;
  } else if (error?.error) {
    errorMessage = error.error;
  } else if (error?.message) {
    errorMessage = error.message;
  } else {
    errorMessage = 'Unknown error occurred';
  }
  
  // Translation key bul
  const translationKey = getErrorTranslationKey(errorMessage, entity);
  
  // Çeviriyi al
  const translatedMessage = i18n.t(translationKey);
  
  // Eğer çeviri bulunamadıysa orijinal mesajı göster
  const finalMessage = translatedMessage !== translationKey ? translatedMessage : errorMessage;
  
  // SweetAlert ile göster
  showError(finalMessage, {
    title: customTitle,
    timer: 4000, // Hata mesajları için daha uzun süre
    showConfirmButton: true
  });
};

/**
 * Başarı mesajını SweetAlert ile gösterir
 * @param message - Başarı mesajı
 * @param entity - İşlem yapılan entity tipi
 */
export const showApiSuccess = async (message: string, entity?: string) => {
  const { showSuccess } = await import('../services/notifications');
  showSuccess(message, {
    timer: 2000
  });
  
  if (entity) {
    console.log(`[API Success - ${entity}]:`, message);
  }
};

/**
 * CRUD operasyonları için özel hata gösterme fonksiyonları
 */
export const showCreateError = (error: unknown, entity: string) => {
  const title = i18n.t(`common.error`);
  showApiError(error, entity, title);
};

export const showUpdateError = (error: unknown, entity: string) => {
  const title = i18n.t(`common.error`);
  showApiError(error, entity, title);
};

export const showDeleteError = (error: unknown, entity: string) => {
  const title = i18n.t(`common.error`);
  showApiError(error, entity, title);
};

export const showLoadError = (error: unknown, entity: string) => {
  const title = i18n.t(`common.error`);
  showApiError(error, entity, title);
};

// Default export
export default {
  showApiError,
  showApiSuccess,
  showCreateError,
  showUpdateError,
  showDeleteError,
  showLoadError,
  getErrorTranslationKey
};


import { useCallback, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { ContractStatus } from '../types';
import { isToday, isPast, differenceInDays } from 'date-fns';
import { useTranslation } from '../i18n';
import {
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
  showProgressNotification,
  NotificationOptions,
  NotificationType
} from '../services/notifications';

export const useNotifications = () => {
  const { t } = useTranslation();

  const success = useCallback((message: string, options?: NotificationOptions) => {
    return showSuccess(message, options);
  }, []);

  const error = useCallback((message: string, options?: NotificationOptions) => {
    return showError(message, options);
  }, []);

  const warning = useCallback((message: string, options?: NotificationOptions) => {
    return showWarning(message, options);
  }, []);

  const info = useCallback((message: string, options?: NotificationOptions) => {
    return showInfo(message, options);
  }, []);

  const confirm = useCallback((message: string, options?: NotificationOptions) => {
    return showConfirmation(message, options);
  }, []);

  const loading = useCallback((message: string = 'Yüklənir...') => {
    return showLoading(message);
  }, []);

  const close = useCallback(() => {
    closeNotification();
  }, []);

  const custom = useCallback((title: string, htmlContent: string, options?: NotificationOptions) => {
    return showCustomNotification(title, htmlContent, options);
  }, []);

  const toast = useCallback((message: string, type: NotificationType = 'success', options?: NotificationOptions) => {
    return showToast(message, type, options);
  }, []);

  const input = useCallback((
    title: string,
    inputType: 'text' | 'email' | 'password' | 'number' | 'tel' | 'textarea' = 'text',
    options?: NotificationOptions
  ) => {
    return showInputNotification(title, inputType, options);
  }, []);

  const fileUpload = useCallback((title: string, options?: NotificationOptions) => {
    return showFileUploadNotification(title, options);
  }, []);

  const progress = useCallback((title: string, progress: number, options?: NotificationOptions) => {
    return showProgressNotification(title, progress, options);
  }, []);

  // Predefined success messages
  const successMessages = {
    show: (message: string) => success(message),
    created: (entity: string) => success(t('notifications.created', { entity })),
    updated: (entity: string) => success(t('notifications.updated', { entity })),
    deleted: (entity: string) => success(t('notifications.deleted', { entity })),
    saved: (entity: string) => success(`${entity} uğurla saxlanıldı`),
    uploaded: (entity: string) => success(`${entity} uğurla yükləndi`),
    downloaded: (entity: string) => success(`${entity} uğurla endirildi`),
    exported: (entity: string) => success(`${entity} uğurla ixrac edildi`),
    imported: (entity: string) => success(`${entity} uğurla idxal edildi`),
    loggedIn: () => success('Uğurla daxil oldunuz'),
    loggedOut: () => success('Uğurla çıxış etdiniz'),
    passwordChanged: () => success('Şifrə uğurla dəyişdirildi'),
    profileUpdated: () => success('Profil uğurla yeniləndi'),
    settingsSaved: () => success('Tənzimləmələr uğurla saxlanıldı'),
    paymentReceived: () => success('Ödəniş uğurla qəbul edildi'),
    contractSigned: () => success('Müqavilə uğurla imzalandı'),
    documentGenerated: () => success('Sənəd uğurla yaradıldı'),
    emailSent: () => success('E-poçt uğurla göndərildi'),
    smsSent: () => success('SMS uğurla göndərildi'),
    backupCreated: () => success('Ehtiyat nüsxəsi uğurla yaradıldı'),
    restoreCompleted: () => success('Bərpa uğurla tamamlandı')
  };

  // Predefined error messages
  const errorMessages = {
    show: (message: string) => error(message),
    created: (entity: string) => error(`${entity} yaradılarkən xəta baş verdi`),
    updated: (entity: string) => error(`${entity} yenilənərkən xəta baş verdi`),
    deleted: (entity: string) => error(`${entity} silinərkən xəta baş verdi`),
    saved: (entity: string) => error(`${entity} saxlanarkən xəta baş verdi`),
    uploaded: (entity: string) => error(`${entity} yüklənərkən xəta baş verdi`),
    downloaded: (entity: string) => error(`${entity} endirilərkən xəta baş verdi`),
    exported: (entity: string) => error(`${entity} ixrac edilərkən xəta baş verdi`),
    imported: (entity: string) => error(`${entity} idxal edilərkən xəta baş verdi`),
    loggedIn: () => error('Daxil olmaq mümkün olmadı'),
    loggedOut: () => error('Çıxış etmək mümkün olmadı'),
    passwordChanged: () => error('Şifrə dəyişdirilə bilmədi'),
    profileUpdated: () => error('Profil yenilənə bilmədi'),
    settingsSaved: () => error('Tənzimləmələr saxlanıla bilmədi'),
    paymentReceived: () => error('Ödəniş qəbul edilə bilmədi'),
    contractSigned: () => error('Müqavilə imzalanıla bilmədi'),
    documentGenerated: () => error('Sənəd yaradıla bilmədi'),
    emailSent: () => error('E-poçt göndərilə bilmədi'),
    smsSent: () => error('SMS göndərilə bilmədi'),
    backupCreated: () => error('Ehtiyat nüsxəsi yaradıla bilmədi'),
    restoreCompleted: () => error('Bərpa tamamlanıla bilmədi'),
    networkError: () => error('Şəbəkə xətası baş verdi'),
    serverError: () => error('Server xətası baş verdi'),
    validationError: () => error('Məlumatlar düzgün deyil'),
    permissionDenied: () => error('İcazə verilmədi'),
    notFound: (entity: string) => error(`${entity} tapılmadı`),
    alreadyExists: (entity: string) => error(`${entity} artıq mövcuddur`),
    invalidCredentials: () => error('Yanlış istifadəçi adı və ya şifrə'),
    sessionExpired: () => error('Sessiya vaxtı bitdi'),
    fileTooLarge: () => error('Fayl həcmi çox böyükdür'),
    unsupportedFileType: () => error('Dəstəklənməyən fayl növü'),
    quotaExceeded: () => error('Disk kvotası aşıldı'),
    maintenanceMode: () => error('Sistem texniki xidmətdədir')
  };

  // Predefined warning messages
  const warningMessages = {
    unsavedChanges: () => warning('Saxlanmamış dəyişikliklər var'),
    deleteConfirmation: (entity: string) => warning(`${entity} silmək istədiyinizə əminsiniz?`),
    logoutConfirmation: () => warning('Çıxış etmək istədiyinizə əminsiniz?'),
    overwriteConfirmation: (entity: string) => warning(`${entity} üzərinə yazmaq istədiyinizə əminsiniz?`),
    dataLoss: () => warning('Məlumatlar itirilə bilər'),
    lowDiskSpace: () => warning('Disk sahəsi azdır'),
    weakPassword: () => warning('Şifrə çox zəifdir'),
    outdatedBrowser: () => warning('Brauzer versiyası köhnədir'),
    slowConnection: () => warning('Şəbəkə bağlantısı yavaşdır'),
    highMemoryUsage: () => warning('Yaddaş istifadəsi yüksəkdir'),
    multipleTabs: () => warning('Bir neçə tab açıqdır'),
    autoSaveDisabled: () => warning('Avtomatik saxlama söndürülüb'),
    backupNeeded: () => warning('Ehtiyat nüsxəsi tələb olunur'),
    updateAvailable: () => warning('Yeni versiya mövcuddur'),
    securityWarning: () => warning('Təhlükəsizlik xəbərdarlığı'),
    performanceWarning: () => warning('Performans xəbərdarlığı')
  };

  // Predefined info messages
  const infoMessages = {
    processing: (action: string) => info(`${action} emal edilir...`),
    connecting: () => info('Bağlantı qurulur...'),
    syncing: () => info('Sinxronlaşdırılır...'),
    calculating: () => info('Hesablanır...'),
    generating: (item: string) => info(`${item} yaradılır...`),
    uploading: () => info('Yüklənir...'),
    downloading: () => info('Endirilir...'),
    exporting: () => info('İxrac edilir...'),
    importing: () => info('İdxal edilir...'),
    backingUp: () => info('Ehtiyat nüsxəsi yaradılır...'),
    restoring: () => info('Bərpa edilir...'),
    updating: () => info('Yenilənir...'),
    installing: () => info('Quraşdırılır...'),
    configuring: () => info('Konfiqurasiya edilir...'),
    validating: () => info('Yoxlanılır...'),
    scanning: () => info('Taranır...'),
    indexing: () => info('İndekslənir...'),
    compressing: () => info('Sıxışdırılır...'),
    decompressing: () => info('Genişləndirilir...'),
    encrypting: () => info('Şifrələnir...'),
    decrypting: () => info('Şifrə açılır...'),
    converting: () => info('Çevrilir...'),
    optimizing: () => info('Optimallaşdırılır...'),
    cleaning: () => info('Təmizlənir...'),
    analyzing: () => info('Analiz edilir...'),
    building: () => info('Qurulur...'),
    testing: () => info('Test edilir...'),
    deploying: () => info('Yerləşdirilir...'),
    publishing: () => info('Dərc edilir...'),
    archiving: () => info('Arxivlənir...'),
    extracting: () => info('Çıxarılır...'),
    merging: () => info('Birləşdirilir...'),
    splitting: () => info('Bölünür...'),
    sorting: () => info('Sıralanır...'),
    filtering: () => info('Filtrələnir...'),
    searching: () => info('Axtarılır...'),
    loading: () => info('Yüklənir...'),
    saving: () => info('Saxlanılır...'),
    sending: () => info('Göndərilir...'),
    receiving: () => info('Qəbul edilir...')
  };

  return {
    // Basic notifications
    success,
    error,
    warning,
    info,
    confirm,
    loading,
    close,
    custom,
    toast,
    input,
    fileUpload,
    progress,

    // Predefined message collections
    successMessages,
    errorMessages,
    warningMessages,
    infoMessages
  };
};

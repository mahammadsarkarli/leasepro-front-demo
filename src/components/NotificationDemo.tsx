import React from 'react';
import { useNotifications } from '../hooks/useNotifications';
import { Bell, CheckCircle, Info } from 'lucide-react';

const NotificationDemo: React.FC = () => {
  const { showNotification } = useNotifications();

  const handleBasicNotifications = () => {
    showNotification('Bu uğurlu bildirişdir!', 'success');
    setTimeout(() => showNotification('Bu xəta bildirişidir!', 'error'), 1000);
    setTimeout(() => showNotification('Bu xəbərdarlıq bildirişidir!', 'warning'), 2000);
    setTimeout(() => showNotification('Bu məlumat bildirişidir!', 'info'), 3000);
  };

  const handleConfirmation = async () => {
    const result = await showNotification('Bu əməliyyatı təsdiq edirsiniz?', 'info', {
      confirmButtonText: 'Təsdiq',
      cancelButtonText: 'Ləğv'
    });
    if (result.isConfirmed) {
      showNotification('Əməliyyat təsdiqləndi!', 'success');
    } else {
      showNotification('Əməliyyat ləğv edildi.', 'info');
    }
  };

  const handleLoading = async () => {
    const loadingAlert = showNotification('Məlumatlar yüklənir...', 'info', {
      didOpen: () => {
        setTimeout(() => {
          loadingAlert.close();
          showNotification('Məlumatlar uğurla yükləndi!', 'success');
        }, 3000);
      }
    });
  };

  const handleToast = () => {
    showNotification('Bu toast bildirişidir!', 'success');
    setTimeout(() => showNotification('Bu xəta toastu!', 'error'), 1000);
    setTimeout(() => showNotification('Bu xəbərdarlıq toastu!', 'warning'), 2000);
    setTimeout(() => showNotification('Bu məlumat toastu!', 'info'), 3000);
  };

  const handleInput = async () => {
    const result = await showNotification('Adınızı daxil edin:', 'info', {
      input: 'Adınızı daxil edin...',
      inputValidator: (value) => {
        if (!value) {
          return 'Ad daxil etməlisiniz!';
        }
        return null;
      },
      confirmButtonText: 'Təsdiq',
      cancelButtonText: 'Ləğv'
    });
    
    if (result.isConfirmed) {
      showNotification(`Salam, ${result.value}!`, 'success');
    }
  };

  const handleFileUpload = async () => {
    const result = await showNotification('Fayl seçin:', 'info', {
      inputAttributes: {
        accept: 'image/*,application/pdf'
      },
      confirmButtonText: 'Təsdiq',
      cancelButtonText: 'Ləğv'
    });
    
    if (result.isConfirmed && result.value) {
      showNotification('Fayl uğurla yükləndi!', 'success');
    }
  };

  const handleProgress = async () => {
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 200));
      showNotification('Yüklənir...', 'info', {
        progress: i
      });
    }
    showNotification('Yükləmə tamamlandı!', 'success');
  };

  const handlePredefinedMessages = () => {
    showNotification('Müştəri', 'success');
    setTimeout(() => showNotification('Müqavilə', 'success'), 1000);
    setTimeout(() => showNotification('Ödəniş', 'success'), 2000);
    setTimeout(() => showNotification('Ödəniş', 'success'), 3000);
    setTimeout(() => showNotification('Müqavilə', 'success'), 4000);
  };

  const handlePredefinedErrors = () => {
    showNotification('Müştəri', 'error');
    setTimeout(() => showNotification('Müqavilə', 'error'), 1000);
    setTimeout(() => showNotification('Təhlükəsizlik xətası', 'error'), 2000);
    setTimeout(() => showNotification('Düzəliş xətası', 'error'), 3000);
    setTimeout(() => showNotification('İcazə xətası', 'error'), 4000);
  };

  const handlePredefinedWarnings = () => {
    showNotification('Yeniləmə xətası', 'warning');
    setTimeout(() => showNotification('Müştəri silinməsi', 'warning'), 1000);
    setTimeout(() => showNotification('Məlumatınızı itirmək xətası', 'warning'), 2000);
    setTimeout(() => showNotification('Təhlükəsizlik xətası', 'warning'), 3000);
  };

  const handlePredefinedInfo = () => {
    showNotification('Məlumatlarınızı qəbul edirik', 'info');
    setTimeout(() => showNotification('Təkrar bağlanırıq', 'info'), 1000);
    setTimeout(() => showNotification('Sürətli hesablanır', 'info'), 2000);
    setTimeout(() => showNotification('Məlumatlar hesablanır', 'info'), 3000);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
          <Bell className="w-6 h-6 mr-2 text-blue-600" />
          Bildiriş Sistemləri Demo
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Basic Notifications */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Əsas Bildirişlər</h3>
            
            <button
              onClick={handleBasicNotifications}
              className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Əsas Bildirişlər
            </button>

            <button
              onClick={handleConfirmation}
              className="w-full flex items-center justify-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <HelpCircle className="w-4 h-4 mr-2" />
              Təsdiq Dialoqu
            </button>

            <button
              onClick={handleLoading}
              className="w-full flex items-center justify-center px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
            >
              <Loader className="w-4 h-4 mr-2" />
              Yükləmə Bildirişi
            </button>
          </div>

          {/* Advanced Notifications */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Təkmilləşdirilmiş Bildirişlər</h3>
            
            <button
              onClick={handleToast}
              className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Toast Bildirişləri
            </button>

            <button
              onClick={handleInput}
              className="w-full flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <FileText className="w-4 h-4 mr-2" />
              Daxiletmə Dialoqu
            </button>

            <button
              onClick={handleFileUpload}
              className="w-full flex items-center justify-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              <Upload className="w-4 h-4 mr-2" />
              Fayl Yükləmə
            </button>

            <button
              onClick={handleProgress}
              className="w-full flex items-center justify-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
            >
              <Download className="w-4 h-4 mr-2" />
              Proqres Bildirişi
            </button>
          </div>

          {/* Predefined Messages */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Hazır Mesajlar</h3>
            
            <button
              onClick={handlePredefinedMessages}
              className="w-full flex items-center justify-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Uğur Mesajları
            </button>

            <button
              onClick={handlePredefinedErrors}
              className="w-full flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <XCircle className="w-4 h-4 mr-2" />
              Xəta Mesajları
            </button>

            <button
              onClick={handlePredefinedWarnings}
              className="w-full flex items-center justify-center px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              Xəbərdarlıq Mesajları
            </button>

            <button
              onClick={handlePredefinedInfo}
              className="w-full flex items-center justify-center px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors"
            >
              <Info className="w-4 h-4 mr-2" />
              Məlumat Mesajları
            </button>
          </div>
        </div>

        {/* Usage Examples */}
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <h4 className="text-lg font-semibold text-gray-800 mb-3">İstifadə Nümunələri</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h5 className="font-medium text-gray-700 mb-2">Əsas İstifadə:</h5>
              <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
{`const { showNotification } = useNotifications();

// Uğur bildirişi
showNotification('Əməliyyat uğurla tamamlandı!', 'success');

// Xəta bildirişi
showNotification('Xəta baş verdi!', 'error');`}
              </pre>
            </div>
            <div>
              <h5 className="font-medium text-gray-700 mb-2">Hazır Mesajlar:</h5>
              <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
{`const { showNotification } = useNotifications();

// Hazır uğur mesajları
showNotification('Müştəri', 'success');
showNotification('Ödəniş', 'success');

// Hazır xəta mesajları
showNotification('Təhlükəsizlik xətası', 'error');
showNotification('Düzəliş xətası', 'error');`}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationDemo;

# Hata Yönetimi Sistemi Dokümantasyonu

## Genel Bakış
Sistemdeki tüm hata mesajları SweetAlert2 kullanılarak gösterilmektedir. API'den gelen hatalar otomatik olarak çevrilip kullanıcıya anlaşılır şekilde sunulmaktadır.
 
## Özellikler 
 
### ✅ Tamamlanan Güncellemeler

1. **Translation Desteği** 
   - `az.json` ve `en.json` dosyalarına detaylı API hata mesajları eklendi
   - Her entity için özel hata mesajları (vehicle, contract, customer, payment, company, user)
   - Genel hata mesajları (network, server, validation vb.)

2. **Error Handler Utility** (`lease/src/utils/errorHandler.ts`)
   - API hatalarını otomatik analiz eder
   - Uygun çeviri anahtarını bulur
   - SweetAlert ile kullanıcıya gösterir
   - Başarı mesajları için de destek

3. **Backend API Güncellemeleri**
   - `vehicles.js`: Detaylı errorCode ve details eklendi
   - Diğer route'lar için standart hata formatı hazır

4. **Frontend Sayfa Güncellemeleri - TÜM SAYFALAR TAMAMLANDI!**

   **Create Sayfaları:**
   - **VehicleCreate**: ✅ Tamamlandı
   - **ContractCreate**: ✅ Tamamlandı  
   - **CustomerCreate**: ✅ Tamamlandı
   - **PaymentCreate**: ✅ Tamamlandı
   - **CompanyCreate**: ✅ Tamamlandı
   
   **Edit Sayfaları:**
   - **VehicleEdit**: ✅ Tamamlandı
   - **ContractEdit**: ✅ Tamamlandı
   - **CustomerEdit**: ✅ Tamamlandı
   - **PaymentEdit**: ✅ Tamamlandı
   - **CompanyEdit**: ✅ Tamamlandı
   - **UserEdit**: ✅ Tamamlandı
   
   **Diğer Sayfalar:**
   - **LoginPage**: ✅ Tamamlandı
   - **Contracts** (list page): ✅ Alert() yerine SweetAlert
   
   **Kapsam:** Tüm CRUD işlemlerinde (Create, Read, Update, Delete) SweetAlert kullanımı sağlandı!

## Kullanım

### 1. Basit Hata Gösterimi

```typescript
import { showApiError } from '../utils/errorHandler';

try {
  await createVehicle(vehicleData);
} catch (error) {
  showApiError(error, 'vehicle');
}
```

### 2. Başarı Mesajı

```typescript
import { showApiSuccess } from '../utils/errorHandler';

showApiSuccess(t('notifications.created', { entity: t('common.vehicle') }), 'vehicle');
```

### 3. Özel Hata Mesajı

```typescript
import { showError } from '../services/notifications';

if (!formData.company_id) {
  showError(t('common.pleaseSelectACompany'));
  return;
}
```

## Hata Tipleri ve Translation Keys

### Vehicle Hataları
```
apiErrors.vehicle.licensePlateExists
apiErrors.vehicle.notFound
apiErrors.vehicle.hasActiveContracts
apiErrors.vehicle.createFailed
apiErrors.vehicle.updateFailed
apiErrors.vehicle.deleteFailed
apiErrors.vehicle.loadFailed
apiErrors.vehicle.accessDenied
apiErrors.vehicle.insufficientPermissions
```

### Contract Hataları
```
apiErrors.contract.notFound
apiErrors.contract.createFailed
apiErrors.contract.updateFailed
apiErrors.contract.deleteFailed
apiErrors.contract.cannotDelete
apiErrors.contract.hasPayments
apiErrors.contract.vehicleNotAvailable
apiErrors.contract.customerNotFound
apiErrors.contract.vehicleNotFound
apiErrors.contract.invalidDates
apiErrors.contract.invalidAmount
apiErrors.contract.accessDenied
apiErrors.contract.insufficientPermissions
apiErrors.contract.alreadyClosed
apiErrors.contract.cannotClose
```

### Customer Hataları
```
apiErrors.customer.finCodeExists
apiErrors.customer.phoneExists
apiErrors.customer.notFound
apiErrors.customer.createFailed
apiErrors.customer.updateFailed
apiErrors.customer.deleteFailed
apiErrors.customer.hasActiveContracts
apiErrors.customer.invalidFinCode
apiErrors.customer.invalidPhone
apiErrors.customer.accessDenied
apiErrors.customer.insufficientPermissions
```

### Payment Hataları
```
apiErrors.payment.notFound
apiErrors.payment.createFailed
apiErrors.payment.updateFailed
apiErrors.payment.deleteFailed
apiErrors.payment.cannotDelete
apiErrors.payment.contractNotFound
apiErrors.payment.invalidAmount
apiErrors.payment.amountExceedsRemaining
apiErrors.payment.invalidDate
apiErrors.payment.alreadyPaid
apiErrors.payment.contractClosed
apiErrors.payment.accessDenied
apiErrors.payment.insufficientPermissions
```

### User/Auth Hataları
```
apiErrors.user.usernameExists
apiErrors.user.emailExists
apiErrors.user.invalidCredentials
apiErrors.user.sessionExpired
apiErrors.user.unauthorized
apiErrors.user.notFound
apiErrors.user.accessDenied
apiErrors.user.insufficientPermissions
```

### Genel Hatalar
```
apiErrors.general.networkError
apiErrors.general.serverError
apiErrors.general.validationError
apiErrors.general.unknownError
apiErrors.general.timeout
apiErrors.general.forbidden
apiErrors.general.notFound
apiErrors.general.badRequest
apiErrors.general.conflict
apiErrors.general.tooManyRequests
```

## Error Handler Fonksiyonları

### showApiError(error, entity, customTitle?)
Ana hata gösterme fonksiyonu. Hatayı analiz edip uygun mesajı gösterir.

**Parametreler:**
- `error`: Hata objesi veya string
- `entity`: Entity tipi ('vehicle', 'contract', 'customer', 'payment', 'company', 'user', 'general')
- `customTitle`: (Opsiyonel) Özel başlık

### showApiSuccess(message, entity?)
Başarı mesajı gösterir.

### CRUD Özel Fonksiyonları
```typescript
showCreateError(error, entity)
showUpdateError(error, entity)
showDeleteError(error, entity)
showLoadError(error, entity)
```

## Örnek Kullanım Senaryoları

### 1. Araç Oluşturma
```typescript
try {
  await createVehicle(vehicleData);
  showApiSuccess(t('notifications.created', { entity: t('common.vehicle') }), 'vehicle');
  navigate('/vehicles');
} catch (error) {
  showApiError(error, 'vehicle');
}
```

**Eğer hata "license plate already exists" ise:**
- Otomatik olarak `apiErrors.vehicle.licensePlateExists` çevirisi gösterilir
- Az: "Bu qeydiyyat nömrəsi ilə nəqliyyat vasitəsi artıq sistemdə mövcuddur"
- En: "A vehicle with this license plate already exists in the system"

### 2. Müqavilə Silme
```typescript
try {
  await deleteContract(id);
  showApiSuccess(t('notifications.deleted', { entity: t('common.contract') }), 'contract');
} catch (error) {
  showApiError(error, 'contract');
}
```

**Eğer hata "has payments" ise:**
- Otomatik olarak `apiErrors.contract.hasPayments` çevirisi gösterilir

### 3. Login
```typescript
try {
  const success = await login(username, password);
  if (!success) {
    showApiError(t('apiErrors.user.invalidCredentials'), 'user');
  }
} catch (err) {
  showApiError(err, 'user');
}
```

## Backend'den Gelen Hata Formatı

Backend'den gelen hatalar şu formatta olmalı:
```javascript
{
  success: false,
  error: "Vehicle with this license plate already exists",
  errorCode: "LICENSE_PLATE_EXISTS",
  details: {
    license_plate: "10-AA-123"
  }
}
```

## Yeni Sayfalara Ekleme

Yeni bir sayfada hata yönetimi kullanmak için:

1. Import edin:
```typescript
import { showApiError, showApiSuccess } from '../utils/errorHandler';
```

2. Hata yakalama bloğunda kullanın:
```typescript
try {
  // API çağrısı
  await someApiCall();
  showApiSuccess(t('notifications.created', { entity: t('common.entityName') }), 'entityType');
} catch (error) {
  showApiError(error, 'entityType');
}
```

3. Entity tipini doğru belirleyin:
- 'vehicle' - Araç işlemleri
- 'contract' - Müqavilə işlemleri
- 'customer' - Müştəri işlemleri
- 'payment' - Ödəniş işlemleri
- 'company' - Şirkət işlemleri
- 'user' - İstifadəçi işlemleri
- 'general' - Genel hatalar

## Avantajlar

✅ **Tutarlı Kullanıcı Deneyimi**: Tüm hata mesajları aynı görünüm ve davranışta
✅ **Çoklu Dil Desteği**: Az/En otomatik çeviri
✅ **Detaylı Mesajlar**: API'den gelen hatalar anlaşılır şekilde gösterilir
✅ **Kolay Bakım**: Merkezi error handler, tüm sayfalardan kullanılır
✅ **Debug Kolaylığı**: Console'a da log'lanır
✅ **Tip Güvenliği**: TypeScript desteği

## Gelecek Geliştirmeler (Opsiyonel)

- [ ] Diğer sayfaların (Users, Companies vb.) hata gösterimini güncelle
- [ ] Backend'deki tüm route'lara errorCode ve details ekle
- [ ] Hata loglarını sunucuya gönder (error tracking)
- [ ] Özel hata tipleri için özel icon'lar
- [ ] Retry mekanizması ekle


/**
 * Özel Yuvarlama Fonksiyonu Kullanım Örneği
 * Bu dosya, yeni eklenen özel yuvarlama fonksiyonunun nasıl kullanılacağını gösterir
 */

import { 
  customRound, 
  roundPaymentAmount, 
  roundInterestAmount, 
  roundPrincipalAmount,
  testCustomRounding,
  compareRoundingMethods
} from './customRoundingUtils';

/**
 * Özel yuvarlama fonksiyonunun kullanım örnekleri
 */
export function demonstrateCustomRounding() {
  console.log('🔢 Özel Yuvarlama Fonksiyonu Örnekleri\n');
  
  // Kullanıcının istediği özel durumlar
  console.log('📋 Kullanıcının istediği özel durumlar:');
  console.log(`853.51 → ${customRound(853.51)} (yukarı yuvarla)`);
  console.log(`853.50 → ${customRound(853.50)} (aşağı yuvarla)`);
  console.log(`853.49 → ${customRound(853.49)} (aşağı yuvarla)\n`);
  
  // Diğer örnekler
  console.log('📋 Diğer örnekler:');
  const examples = [
    100.51, 100.50, 100.49,
    500.75, 500.50, 500.25,
    1000.99, 1000.50, 1000.01
  ];
  
  examples.forEach(num => {
    console.log(`${num} → ${customRound(num)}`);
  });
  
  console.log('\n💰 Ödeme hesaplamalarında kullanım:');
  
  // Ödeme tutarları için
  const paymentAmounts = [853.51, 853.50, 100.25, 500.75];
  paymentAmounts.forEach(amount => {
    console.log(`Ödeme: ${amount} → ${roundPaymentAmount(amount)}`);
  });
  
  // Faiz tutarları için
  const interestAmounts = [100.25, 100.50, 50.75];
  interestAmounts.forEach(amount => {
    console.log(`Faiz: ${amount} → ${roundInterestAmount(amount)}`);
  });
  
  // Ana para tutarları için
  const principalAmounts = [500.75, 500.50, 250.25];
  principalAmounts.forEach(amount => {
    console.log(`Ana Para: ${amount} → ${roundPrincipalAmount(amount)}`);
  });
  
  console.log('\n🔄 Standart yuvarlama ile karşılaştırma:');
  const comparisonNumbers = [853.51, 853.50, 100.51, 100.50];
  comparisonNumbers.forEach(num => {
    const comparison = compareRoundingMethods(num);
    console.log(`${num}: Özel=${comparison.custom}, Standart=${comparison.standard}, Fark=${comparison.difference}`);
  });
}

/**
 * Test fonksiyonunu çalıştır
 */
export function runRoundingTests() {
  console.log('🧪 Özel Yuvarlama Testleri Başlatılıyor...\n');
  testCustomRounding();
  console.log('\n✅ Testler tamamlandı!');
}

// Eğer bu dosya doğrudan çalıştırılırsa
if (require.main === module) {
  demonstrateCustomRounding();
  runRoundingTests();
}

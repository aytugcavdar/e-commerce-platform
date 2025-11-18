// shared-utils/helpers/passwordUtils.test.js

const PasswordUtils = require('./passwordUtils'); // Test edeceğimiz dosyayı çağırıyoruz

// describe: Testleri gruplamak için kullanılır. "PasswordUtils sınıfı testleri" başlığı gibi düşünün.
describe('PasswordUtils', () => {

  // 1. TEST: Şifre Hash'leme
  test('hash fonksiyonu şifreyi şifrelemeli (hashlemeli)', async () => {
    const plainPassword = 'gizlisifre123';
    
    // Fonksiyonu çalıştırıyoruz
    const hashedPassword = await PasswordUtils.hash(plainPassword);

    // BEKLENTİLER (ASSERTIONS):
    // 1. Hashlenmiş şifre tanımlı olmalı (boş gelmemeli)
    expect(hashedPassword).toBeDefined();
    // 2. Hashlenmiş şifre, düz şifreye eşit OLMAMALI (değişmiş olmalı)
    expect(hashedPassword).not.toBe(plainPassword);
    // 3. Bcrypt hashleri genellikle '$2a$' veya '$2b$' ile başlar
    expect(hashedPassword.startsWith('$2')).toBe(true);
  });

  // 2. TEST: Doğru Şifre Kontrolü
  test('compare fonksiyonu doğru şifre girilince TRUE dönmeli', async () => {
    const plainPassword = 'superSifre';
    // Önce şifreyi hashleyelim ki elimizde karşılaştıracak bir veri olsun
    const hashedPassword = await PasswordUtils.hash(plainPassword);

    // Şimdi doğru şifreyle karşılaştırma yapalım
    const isMatch = await PasswordUtils.compare(plainPassword, hashedPassword);

    // Sonucun true olmasını bekliyoruz
    expect(isMatch).toBe(true);
  });

  // 3. TEST: Yanlış Şifre Kontrolü
  test('compare fonksiyonu yanlış şifre girilince FALSE dönmeli', async () => {
    const plainPassword = 'dogruSifre';
    const wrongPassword = 'yanlisSifre';
    
    const hashedPassword = await PasswordUtils.hash(plainPassword);

    // Yanlış şifreyle karşılaştırma yapalım
    const isMatch = await PasswordUtils.compare(wrongPassword, hashedPassword);

    // Sonucun false olmasını bekliyoruz
    expect(isMatch).toBe(false);
  });

});
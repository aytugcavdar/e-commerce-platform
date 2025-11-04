// frontend/src/features/user/types/user.types.ts

/**
 * 🎓 ÖĞREN: User Tipleri
 *
 * Ana 'User' tipi 'auth.types.ts' içinde yer alır.
 * Bu dosya, 'User' modeli üzerinde yapılan işlemler (Profil güncelleme,
 * şifre değiştirme) için gerekli form tiplerini içerir.
 */

/**
 * 👤 ProfileUpdateData
 *
 * Profil düzenleme formu için veri tipi.
 * 'ProfileEditPage.tsx' içinde kullanılır.
 */
export interface ProfileUpdateData {
  firstName: string;
  lastName: string;
  phone?: string;
  // Avatar/resim yükleme ayrı bir thunk ile yapılabilir
  avatar?: File | string;
}

/**
 * 🔑 ChangePasswordData
 *
 * Şifre değiştirme formu için veri tipi.
 */
export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

/**
 * 📍 Address
 *
 * Kullanıcının kaydettiği adresler (teslimat veya fatura).
 */
export interface Address {
  _id: string;
  alias: string; // 'Ev', 'İş'
  fullName: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  phone: string;
  isDefault: boolean;
}

/**
 * 🧍 UserState
 *
 * Eğer 'authSlice' dışında ayrı bir 'userSlice' olsaydı
 * (örn. adminin kullanıcı listesini yönettiği yer),
 * state'i böyle görünürdü.
 */
// export interface UserState {
//   users: User[]; // Admin panel için
//   loading: boolean;
//   error: string | null;
// }
// frontend/src/features/auth/utils/validation.ts

import * as yup from 'yup';

/**
 * 🎓 ÖĞREN: Yup Nedir?
 * 
 * Yup, JavaScript object schema validator'ıdır.
 * Form verilerini doğrulamak için kullanılır.
 * 
 * Neden Yup?
 * - Kolay syntax
 * - Hata mesajları özelleştirilebilir
 * - Async validation desteği
 * - TypeScript desteği
 * - React Hook Form ile uyumlu
 * 
 * Alternatifler:
 * - Zod (TypeScript-first)
 * - Joi (Backend için daha popüler)
 * - Validator.js (Basit validasyonlar için)
 */

/**
 * 🔐 LOGIN SCHEMA - Giriş Form Doğrulama
 * 
 * E-posta ve şifre doğrulama kuralları
 */
export const loginSchema = yup.object({
  email: yup
    .string()
    .required('E-posta adresi gereklidir')
    .email('Geçerli bir e-posta adresi giriniz')
    .trim()
    .lowercase(),
  
  password: yup
    .string()
    .required('Şifre gereklidir')
    .min(8, 'Şifre en az 8 karakter olmalıdır'),
  
  rememberMe: yup
    .boolean()
    .optional(),
});

/**
 * 📝 REGISTER SCHEMA - Kayıt Form Doğrulama
 * 
 * Tüm kayıt alanları için doğrulama kuralları
 */
export const registerSchema = yup.object({
  firstName: yup
    .string()
    .required('Ad gereklidir')
    .min(2, 'Ad en az 2 karakter olmalıdır')
    .max(50, 'Ad en fazla 50 karakter olabilir')
    .trim()
    .matches(/^[a-zA-ZğüşıöçĞÜŞİÖÇ\s]+$/, 'Ad sadece harf içerebilir'),
  
  lastName: yup
    .string()
    .required('Soyad gereklidir')
    .min(2, 'Soyad en az 2 karakter olmalıdır')
    .max(50, 'Soyad en fazla 50 karakter olabilir')
    .trim()
    .matches(/^[a-zA-ZğüşıöçĞÜŞİÖÇ\s]+$/, 'Soyad sadece harf içerebilir'),
  
  email: yup
    .string()
    .required('E-posta adresi gereklidir')
    .email('Geçerli bir e-posta adresi giriniz')
    .trim()
    .lowercase(),
  
  phone: yup
    .string()
    .optional()
    .matches(
      /^(\+90|0)?[1-9]\d{9}$/,
      'Geçerli bir telefon numarası giriniz (örn: 5551234567)'
    ),
  
  password: yup
    .string()
    .required('Şifre gereklidir')
    .min(8, 'Şifre en az 8 karakter olmalıdır')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Şifre en az bir büyük harf, bir küçük harf ve bir rakam içermelidir'
    ),
  
  passwordConfirm: yup
    .string()
    .required('Şifre tekrarı gereklidir')
    .oneOf([yup.ref('password')], 'Şifreler eşleşmiyor'),
});

/**
 * 🔑 FORGOT PASSWORD SCHEMA - Şifremi Unuttum
 */
export const forgotPasswordSchema = yup.object({
  email: yup
    .string()
    .required('E-posta adresi gereklidir')
    .email('Geçerli bir e-posta adresi giriniz')
    .trim()
    .lowercase(),
});

/**
 * 🔄 RESET PASSWORD SCHEMA - Şifre Sıfırlama
 */
export const resetPasswordSchema = yup.object({
  password: yup
    .string()
    .required('Yeni şifre gereklidir')
    .min(8, 'Şifre en az 8 karakter olmalıdır')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Şifre en az bir büyük harf, bir küçük harf ve bir rakam içermelidir'
    ),
  
  passwordConfirm: yup
    .string()
    .required('Şifre tekrarı gereklidir')
    .oneOf([yup.ref('password')], 'Şifreler eşleşmiyor'),
});

/**
 * ✅ VERIFY EMAIL SCHEMA - E-posta Doğrulama
 */
export const verifyEmailSchema = yup.object({
  email: yup
    .string()
    .required('E-posta adresi gereklidir')
    .email('Geçerli bir e-posta adresi giriniz')
    .trim()
    .lowercase(),
  
  token: yup
    .string()
    .required('Doğrulama kodu gereklidir'),
});

/**
 * 🎯 TYPE INFERENCE - Yup'tan TypeScript Tipi Çıkarma
 * 
 * Yup schema'sından otomatik olarak TypeScript tipi oluştur.
 * Form değerlerinin tipini manuel yazmaya gerek kalmaz!
 */
export type LoginFormData = yup.InferType<typeof loginSchema>;
export type RegisterFormData = yup.InferType<typeof registerSchema>;
export type ForgotPasswordFormData = yup.InferType<typeof forgotPasswordSchema>;
export type ResetPasswordFormData = yup.InferType<typeof resetPasswordSchema>;
export type VerifyEmailFormData = yup.InferType<typeof verifyEmailSchema>;

/**
 * 🎯 KULLANIM ÖRNEĞİ:
 * 
 * import { useForm } from 'react-hook-form';
 * import { yupResolver } from '@hookform/resolvers/yup';
 * import { loginSchema, LoginFormData } from './validation';
 * 
 * const LoginForm = () => {
 *   const {
 *     register,
 *     handleSubmit,
 *     formState: { errors }
 *   } = useForm<LoginFormData>({
 *     resolver: yupResolver(loginSchema)
 *   });
 *   
 *   const onSubmit = (data: LoginFormData) => {
 *     console.log(data);
 *     // { email: "...", password: "...", rememberMe: false }
 *   };
 *   
 *   return (
 *     <form onSubmit={handleSubmit(onSubmit)}>
 *       <input {...register('email')} />
 *       {errors.email && <span>{errors.email.message}</span>}
 *       
 *       <input {...register('password')} type="password" />
 *       {errors.password && <span>{errors.password.message}</span>}
 *       
 *       <button type="submit">Giriş</button>
 *     </form>
 *   );
 * };
 */

/**
 * 💡 PRO TIP: Özel Doğrulama Fonksiyonları
 * 
 * Kendi validation kurallarını yazabilirsin:
 * 
 * .test('is-strong', 'Şifre çok zayıf', (value) => {
 *   // Özel kontrol
 *   return value && value.length > 10;
 * })
 * 
 * Async validation (API çağrısı ile):
 * .test('email-exists', 'Bu e-posta zaten kayıtlı', async (value) => {
 *   if (!value) return true;
 *   const response = await checkEmailExists(value);
 *   return !response.exists;
 * })
 */

/**
 * 🔥 BEST PRACTICE: Schema Bileşimi
 * 
 * Ortak alanları tekrar kullanabilirsin:
 * 
 * const emailField = yup.string()
 *   .required('E-posta gereklidir')
 *   .email('Geçersiz e-posta');
 * 
 * const passwordField = yup.string()
 *   .required('Şifre gereklidir')
 *   .min(8, 'En az 8 karakter');
 * 
 * const loginSchema = yup.object({
 *   email: emailField,
 *   password: passwordField,
 * });
 * 
 * const registerSchema = yup.object({
 *   email: emailField,
 *   password: passwordField,
 *   firstName: yup.string().required(),
 *   // ...
 * });
 */

/**
 * 📝 YUP VALIDATION METHODS:
 * 
 * STRING:
 * - .required(message)          → Zorunlu alan
 * - .min(n, message)            → Minimum uzunluk
 * - .max(n, message)            → Maximum uzunluk
 * - .email(message)             → E-posta formatı
 * - .url(message)               → URL formatı
 * - .matches(regex, message)    → Regex pattern
 * - .trim()                     → Boşlukları temizle
 * - .lowercase()                → Küçük harfe çevir
 * - .uppercase()                → Büyük harfe çevir
 * 
 * NUMBER:
 * - .min(n, message)            → Minimum değer
 * - .max(n, message)            → Maximum değer
 * - .positive(message)          → Pozitif sayı
 * - .integer(message)           → Tam sayı
 * 
 * BOOLEAN:
 * - .isTrue(message)            → True olmalı
 * 
 * DATE:
 * - .min(date, message)         → Minimum tarih
 * - .max(date, message)         → Maximum tarih
 * 
 * ARRAY:
 * - .min(n, message)            → Minimum eleman sayısı
 * - .max(n, message)            → Maximum eleman sayısı
 * - .of(schema)                 → Eleman tipi
 * 
 * OBJECT:
 * - .shape({ ... })             → Obje şekli
 * 
 * DIĞER:
 * - .oneOf([values], message)   → İzin verilen değerler
 * - .notOneOf([values], message)→ Yasaklı değerler
 * - .test(name, message, fn)    → Özel test
 * - .when(field, {...})         → Koşullu validasyon
 * - .optional()                 → Opsiyonel alan
 * - .nullable()                 → Null olabilir
 * - .default(value)             → Varsayılan değer
 */
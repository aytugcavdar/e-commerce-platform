import { z } from 'zod';

// Kayıt olma şeması
export const registerSchema = z.object({
  name: z.string().min(3, 'İsim en az 3 karakter olmalıdır.'),
  email: z.string().email('Geçersiz e-posta adresi.'),
  password: z.string().min(6, 'Şifre en az 6 karakter olmalıdır.'),
});

// Zod şemasından TypeScript tipini türetelim
export type RegisterFormValues = z.infer<typeof registerSchema>;

// Giriş yapma şeması
export const loginSchema = z.object({
    email: z.string().email('Geçersiz e-posta adresi.'),
    password: z.string().min(1, 'Şifre alanı boş olamaz.'),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
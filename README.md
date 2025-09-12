# E-Ticaret Platformu Mikroservis Projesi

[![Lisans: MIT](https://img.shields.io/badge/Lisans-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Durum: Aktif](https://img.shields.io/badge/durum-aktif-success.svg)](https://github.com/aytugcavdar/e-commerce-platform)
[![Node.js](https://img.shields.io/badge/Node.js-18.x-blue.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18.x-green.svg)](https://reactjs.org/)
[![Docker](https://img.shields.io/badge/Docker-Entegre-blueviolet.svg)](https://www.docker.com/)

Bu proje, modern web teknolojileri ve mikroservis mimarisi kullanılarak geliştirilmiş, tam özellikli bir e-ticaret platformudur. Ölçeklenebilir, sürdürülebilir ve esnek bir yapı sunmayı hedefler.

## ✨ Temel Özellikler

- **Kullanıcı Yönetimi:** Güvenli kayıt, giriş ve JWT tabanlı kimlik doğrulama.
- **Ürün Yönetimi:** Ürün ekleme, güncelleme, silme ve listeleme.
- **Kategori Yönetimi:** Ürünleri kategorilere ayırma ve yönetme.
- **Alışveriş Sepeti:** Dinamik sepet yönetimi.
- **Sipariş Yönetimi:** Sipariş oluşturma, takip etme ve yönetme.
- **Ödeme Entegrasyonu:** Güvenli ödeme işlemleri.
- **Bildirim Sistemi:** E-posta ile kullanıcı bilgilendirmeleri.
- **Gelişmiş Arama:** Ürünler arasında hızlı ve etkili arama.
- **Rol Tabanlı Yetkilendirme:** Kullanıcı ve yönetici rolleri.

## 🏗️ Mimari Genel Bakış

Platform, her biri belirli bir iş alanından sorumlu olan bağımsız mikroservislerden oluşur. Bu servisler, tüm istemci istekleri için tek bir giriş noktası görevi gören bir **API Gateway** aracılığıyla haberleşir.

 <!-- Gerçek bir diyagram URL'si ile değiştirilebilir -->

### Servisler

- **API Gateway:** Gelen istekleri ilgili servise yönlendirir ve kimlik doğrulama gibi ara katman görevlerini üstlenir.
- **Auth Service:** Kullanıcı kimlik doğrulama ve yetkilendirme işlemlerini yönetir.
- **Product Service:** Ürün kataloğunu yönetir.
- **Category Service:** Ürün kategorilerini yönetir.
- **Cart Service:** Alışveriş sepeti operasyonlarını yönetir.
- **Order Service:** Sipariş süreçlerini yönetir.
- **Payment Service:** Ödeme altyapısıyla entegrasyonu sağlar.
- **Notification Service:** Bildirim (e-posta vb.) gönderimini sağlar.
- **Search Service:** Arama işlevselliğini sunar.
- **Frontend:** React ve TypeScript ile geliştirilmiş modern kullanıcı arayüzü.

## 🛠️ Kullanılan Teknolojiler

- **Backend:** Node.js, Express.js
- **Frontend:** React, TypeScript, Vite, Redux Toolkit, Tailwind CSS
- **Veritabanı:** MongoDB (Servisler arası bağımsız veritabanları)
- **Konteynerleştirme:** Docker, Docker Compose
- **API İletişimi:** RESTful API
- **Kod Paylaşımı:** `shared-utils` ile servisler arası ortak modüller.
- **Medya Yönetimi:** Cloudinary

## 🚀 Kurulum ve Başlatma

Projeyi yerel makinenizde çalıştırmak için aşağıdaki adımları izleyin.

### Gereksinimler

- [Docker](https://www.docker.com/get-started) ve [Docker Compose](https://docs.docker.com/compose/install/)
- [Node.js](https://nodejs.org/en/) (v18 veya üstü)
- [Git](https://git-scm.com/)

### Adımlar

1.  **Projeyi Klonlayın:**
    ```bash
    git clone https://github.com/aytugcavdar/e-commerce-platform.git
    cd e-commerce-platform
    ```

2.  **Çevre Değişkenlerini Ayarlayın:**
    Her servis, çalışmak için kendi çevre değişkenlerine ihtiyaç duyar. Her servisin kök dizininde bir `.env` dosyası oluşturmanız gerekmektedir. Başlangıç için her servisteki `config/config.env` veya benzeri dosyaları referans alarak kendi `.env` dosyanızı oluşturabilirsiniz.

    Örneğin, `auth-service` için:
    ```bash
    cd auth-service
    touch .env
    ```
    Ardından `auth-service/.env` dosyasını aşağıdaki gibi doldurun:
    ```env
    PORT=5001
    MONGODB_URI=<Sizin_MongoDB_URI'niz>
    JWT_SECRET=<Sizin_Gizli_Anahtarınız>
    JWT_EXPIRE=30d
    JWT_COOKIE_EXPIRE=30
    CLOUDINARY_CLOUD_NAME=<Sizin_Cloudinary_Cloud_Adınız>
    CLOUDINARY_API_KEY=<Sizin_Cloudinary_API_Anahtarınız>
    CLOUDINARY_API_SECRET=<Sizin_Cloudinary_API_Gizli_Anahtarınız>
    ```
    **Not:** Bu adımı tüm servisler (`product-service`, `order-service` vb.) için tekrarlamanız gerekmektedir.

3.  **Docker Konteynerlerini Başlatın:**
    Projenin ana dizinindeyken aşağıdaki komutu çalıştırarak tüm servisleri başlatın.
    ```bash
    docker-compose up --build
    ```
    `--build` bayrağı, imajları yeniden oluşturur. İlk çalıştırmadan sonra gerekli değildir.

4.  **Uygulamaya Erişin:**
    - **Frontend:** `http://localhost:3000`
    - **API Gateway:** `http://localhost:5000`

## 🤝 Katkıda Bulunma

Katkılarınız projeyi daha iyi hale getirecektir! Lütfen katkıda bulunmak için aşağıdaki adımları izleyin:

1.  Projeyi fork'layın.
2.  Yeni bir özellik dalı oluşturun (`git checkout -b ozellik/yeni-bir-ozellik`).
3.  Değişikliklerinizi commit'leyin (`git commit -m 'feat: Yeni bir özellik eklendi'`).
4.  Dalınızı push'layın (`git push origin ozellik/yeni-bir-ozellik`).
5.  Bir Pull Request açın.

## 📄 Lisans

Bu proje MIT Lisansı altında lisanslanmıştır. Daha fazla bilgi için `LICENSE` dosyasına bakın.

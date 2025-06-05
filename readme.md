
# 🚀 AI Tweet Analiz Otomatı

## Proje Tanımı

Bu proje, bir kullanıcının girdiği Tweet (X gönderisi) URL'sini alarak, bu gönderinin içeriğini otomatik olarak çeken, ChatGPT API'si aracılığıyla duygu analizi ve özetleme yapan ve elde edilen tüm analiz sonuçlarını Google Sheets tablosuna kaydeden bir web uygulamasıdır.
Bu proje Swipeline AI Studio için Developer Intern - Task-1 görevi kapsamında geliştirilmiştir.

## ✨ Özellikler

* **🌐 Tweet İçerik Çekimi:** Verilen bir Tweet URL'sinden kullanıcı adı, tweet içeriği ve gönderim tarihi gibi bilgileri otomatik olarak alır.
* **🧠 Akıllı Duygu Analizi:** Tweet metninin genel duygusunu (olumlu, olumsuz, nötr) yapay zeka destekli analizle belirler.
* **📝 Anlamlı Özetleme:** Uzun tweet metinlerini, ana fikrini ve önemli noktalarını içeren 1-2 cümlelik kısa ve öz bir özet haline getirir.
* **📊 Google Sheets Entegrasyonu:** Analiz edilen her tweet'in sonuçlarını (kullanıcı adı, içerik, duygu, özet, tarih ve URL) otomatik olarak belirlenen Google Sheets tablosuna yeni bir satır olarak ekler.
* **🚀 Hızlı ve Etkili:** Node.js ve React'in gücüyle hızlı API çağrıları ve kullanıcı deneyimi sunar.

## 🛠️ Teknolojiler

* **Frontend:** `React.js`
    * Kullanıcı arayüzü ve backend ile iletişim için kullanılır.
    * `axios` kütüphanesi ile HTTP istekleri yapılır.
* **Backend:** `Node.js` (`Express.js` ile)
    * API endpoint'lerini sağlar (`/get-tweet-content`, `/analyze-tweet`, `/add-to-sheet`).
    * Twitter oEmbed API, OpenAI API ve Google Sheets API ile iletişim kurar.
    * `cheerio` kütüphanesi ile HTML'den tweet içeriği ayrıştırılır.
    * `dotenv` ile ortam değişkenleri yönetilir.
* **Yapay Zeka:** `OpenAI (ChatGPT) API` (Model: `gpt-3.5-turbo`)
    * Doğal dil işleme yetenekleri ile duygu analizi ve metin özetleme görevlerini gerçekleştirir.
* **Veri Depolama:** `Google Sheets API`
    * Analiz sonuçlarını bulut tabanlı bir tabloya kaydetmek için kullanılır.
    * Servis hesabı kimlik doğrulaması ile güvenli ve otomatik erişim sağlar.

## ⚙️ Kurulum ve Çalıştırma

Projeyi yerel makinenizde kurmak ve çalıştırmak için aşağıdaki adımları dikkatlice takip edin:

### 1. Ön Gereksinimler

Başlamadan önce aşağıdaki araç ve hesaplara sahip olduğunuzdan emin olun:

* **Node.js** (v18 veya üzeri önerilir): [nodejs.org](https://nodejs.org/en/download/) adresinden indirin.
* **npm** (Node.js ile birlikte gelir)
* **Google Cloud Platform Hesabı:** Google Sheets API'yi etkinleştirmek ve servis hesabı oluşturmak için gereklidir. ([cloud.google.com](https://cloud.google.com/))
* **OpenAI API Anahtarı:** ChatGPT API'yi kullanmak için gereklidir. ([platform.openai.com/api-keys](https://platform.openai.com/api-keys))
* **Boş Bir Google Sheets Belgesi:** Analiz sonuçlarının kaydedileceği bir Google Sheet oluşturun.

### 2. Projeyi Klonlama

Öncelikle, bu GitHub deposunu yerel makinenize klonlayın:

```bash
git clone [https://github.com/FuatSZR/ai-tweet-analyzer.git](https://github.com/FuatSZR/ai-tweet-analyzer.git)
cd ai-tweet-analyzer
````


### 3\. Backend Kurulumu ve Yapılandırması

`backend` dizinine gidin ve gerekli npm paketlerini yükleyin:

```bash
cd backend
npm install
```

**Ortam Değişkenlerini Ayarlayın (`.env`):**
`backend` klasörü içinde `.env` adında yeni bir dosya oluşturun ve OpenAI API anahtarınızı aşağıdaki gibi ekleyin:

```
OPENAI_API_KEY=kendi_openai_api_anahtarınız
```

> **Güvenlik Notu:** `.env` dosyası hassas bilgileri (API anahtarları gibi) içerir ve `.gitignore` dosyası tarafından Git deposuna eklenmemesi için yapılandırılmıştır. Asla API anahtarlarınızı doğrudan kodunuza yazmayın\!

**Google Sheets Servis Hesabı Anahtarını Ekleyin:**
Google Cloud Platform'da oluşturduğunuz servis hesabına ait JSON anahtar dosyasını (`service_account_key.json`) `backend` klasörünün içine kopyalayın. Bu dosya, uygulamanızın Google Sheets'e güvenli bir şekilde erişmesini sağlar.


**Google Sheet'i Servis Hesabıyla Paylaşın:**
Google Sheets belgenizi açın. Sağ üstteki "Paylaş" butonuna tıklayın. Servis hesabınızın e-posta adresini (JSON anahtar dosyanızdaki `client_email` alanında bulunur) ekleyin ve **"Düzenleyici" (Editor) yetkisi verdiğinizden emin olun.**

**Backend Sunucusunu Başlatın:**

```bash
node app.js
```

Sunucu, varsayılan olarak `http://localhost:5000` adresinde çalışmaya başlayacaktır. Bu terminal penceresini açık bırakın.

### 4\. Frontend Kurulumu ve Çalıştırma

Yeni bir terminal penceresi açın, projenin ana dizinine geri dönün ve `frontend` klasörüne gidin:

```bash
cd ../frontend
npm install
```

Frontend Uygulamasını Başlatın:

```bash
npm start
```

Uygulama, genellikle `http://localhost:3000` adresinde tarayıcınızda otomatik olarak açılacaktır.

### 5\. Uygulama Kullanımı

1.  Web tarayıcınızda `http://localhost:3000` adresine gidin.
2.  "Tweet URL'sini buraya yapıştırın" alanına analiz etmek istediğiniz geçerli bir Tweet URL'si girin (örneğin: `https://x.com/NASA/status/1798547376742512918`). **URL'nin `https://` ile başladığından emin olun.**
3.  "Tweet'i Analiz Et" butonuna tıklayın. Uygulama, tweet içeriğini çekecek, ChatGPT API ile analiz edecek ve sonuçları ekranda gösterecektir.
4.  Analiz sonuçları (Kullanıcı Adı, Tweet İçeriği, Duygu, Özet, Gönderim Saati ve Tweet URL'si) göründükten sonra, "Google Sheets'e Ekle" butonuna tıklayarak bu verileri Google Sheets belgenize kaydedebilirsiniz.


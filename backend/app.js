
//                                                1. Gerekli Modülleri İmport Etme
// Ortam değişkenlerini .env dosyasından yükle
require('dotenv').config();

// Web sunucusu oluşturmak için Express framework
const express = require('express');

// HTTP istekleri yapmak için Axios 
const axios = require('axios');

// HTML parsing için Cheerio 
const cheerio = require('cheerio');

// OpenAI API ile etkileşim için resmi kütüphane
const { OpenAI } = require('openai');

// Google API'leri ile etkileşim için resmi kütüphane 
const { google } = require('googleapis');



//                                               2. Uygulama Ayarları ve Başlatma

const app = express(); // Express uygulamasını başlat

// Gelen JSON istek gövdelerini ayrıştırmak için middleware
app.use(express.json());

// CORS (Cross-Origin Resource Sharing) ayarları (React frontend localhost:3000)(Node.js backend localhost:5000) 
// Farklı portlarda çalıştıkları için bu ayarlar zorunlu. Aksi takdirde frontend backend ile iletişimi kuramaz.
app.use((req, res, next) => {
    // React genelde 'http://localhost:3000' portunda çalışır.
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
    // İzin verilen HTTP metotları
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    // İzin verilen başlıklar
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    // Kimlik bilgileriyle (örneğin çerezler) istek gönderilmesine izin ver
    res.setHeader('Access-Control-Allow-Credentials', true);
    // Bir sonraki middleware'e geç
    next();
});



//                                                3. API Bilgilerini Tanımlama

// OpenAI API anahtarını .env dosyasından al
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Google Sheets Servis Hesabı JSON anahtar dosyasının yolu
const KEYFILEPATH = './service_account_key.json';

// Google Sheets API için gerekli yetkilendirme kapsamları
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

// Google API'leri için yetkilendirme istemcisi
const auth = new google.auth.GoogleAuth({
    keyFile: KEYFILEPATH, // Servis hesabı JSON anahtar dosyası
    scopes: SCOPES,       // İzin verilen yetkilendirme kapsamları
});

// Google Sheet'in ID'si 
const SPREADSHEET_ID = '1DfHM9AuK4aJ2Nu-nPF2h41XIaLZHmVcugCzV6l7ucho'; 





//                                            4. API fonksiyonlarını tanımlama


//                                          4.1. Twitterdan tweet metnini alma

app.post('/get-tweet-content', async (req, res) => {
    const { tweetUrl } = req.body; // React'tan gelecek tweet URL'si

    // URL'nin boş olup olmadığını kontrol et
    if (!tweetUrl) {
        return res.status(400).json({ error: 'Tweet URL is required.' }); 
    }

    // Geçerli bir Twitter URL'si olup olmadığını kontrol etme
    if (!tweetUrl.startsWith('https://twitter.com/') && !tweetUrl.startsWith('https://x.com/')) {
        return res.status(400).json({ error: 'Please provide a valid Twitter (or X) URL.' });
    }

    try {
        // Twitter oEmbed API URL'sini oluştur
        // `omit_script=true` ile Twitter'ın kendi JavaScript'ini yüklemesini engelliyoruz ki statik HTML ile daha kolay metin alalım.
        const oembedUrl = `https://publish.twitter.com/oembed?url=${encodeURIComponent(tweetUrl)}&omit_script=true`;

        // Twitter oEmbed API'sine HTTP GET isteği gönderme
        const response = await axios.get(oembedUrl);

        // API yanıtından gerekli verileri al
        const { author_name, html, author_url } = response.data;


        const $ = cheerio.load(html); // Cheerio ile HTML'i yükleme
        let tweetContent = '';

        // Tweet metnini içeren olası elementleri dene
        // Twitter'ın oEmbed çıktısında tweet metni genellikle <blockquote> içindeki <p> etiketlerinde yer alımakta.
        const potentialTextElements = $('blockquote.twitter-tweet p');
        if (potentialTextElements.length > 0) {
            // Birden fazla p etiketi varsa, bunlar birleştirilmeli
            potentialTextElements.each((i, elem) => {
                tweetContent += $(elem).text() + ' ';
            });
            tweetContent = tweetContent.trim();
        } else {
            // Eğer belirli bir yapı bulunamazsa, bu durumda buraya geliyoruz. Ancak bu düşük ihtimal.
            tweetContent = 'Could not extract specific tweet content. Raw HTML might be needed.';
            console.warn('Could not find standard tweet text elements. Review oEmbed HTML structure.');
        }

        // Analiz için gerekli olan bilgileri içeren yanıtı gönderme
        res.json({
            username: author_name,          // Tweeti atan kullanıcının görünen adı
            tweetContent: tweetContent,     // Ayıklanmış tweet metni
            html: html,                     // Tweetin embed HTML'i (istersen frontend'de gösterebilirsin)
            tweetUrl: tweetUrl,             // Orijinal tweet URL'si
            // Tweet in tarih ve saat bilgisini çekemedim. Onun yerine isteğin gönderildiği tarih ve saati yazdıracağım.
        });

    } catch (error) {
        console.error('Error fetching tweet content from oEmbed API:', error.message);
        // Hata durumu mesajları
        if (error.response && error.response.status === 404) {
            res.status(404).json({ error: 'Tweet not found or invalid URL.' });
        } else if (error.response && error.response.data && error.response.data.errors) {
             res.status(500).json({ error: `Twitter API error: ${error.response.data.errors[0].message}` });
        }
        else {
            res.status(500).json({ error: 'Failed to fetch tweet content. Please try again later.' });
        }
    }
});








//                                                  4.2. Tweet içeriği analizi


app.post('/analyze-tweet', async (req, res) => {
    const { tweetContent } = req.body; // `/get-tweet-content`'ten gelecek tweet metnini aldık.

    if (!tweetContent) {
        return res.status(400).json({ error: 'Tweet content is required for analysis.' });
    }

    
    try{
        //                                  --- Duygu Analizi (Sentiment Analysis) ---
        // OpenAI'a göndereceğimiz duygu analizi promptu
        const sentimentPrompt = `Analyze the sentiment of the following tweet. Respond only with "positive", "negative", or "neutral":\n\n"${tweetContent}"`;
        //Basit bir prompt olusturduk


        // ChatGPT API sine istek gönder
        const sentimentCompletion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",                                 // Kullanılacak model (burada daha üst modeller seçilebilir ama 3.5-turbo daha ucuz)
            messages: [{ role: "user", content: sentimentPrompt }], // Kullanıcı istemi
            temperature: 0.1,                                       // Düşük değer daha tutarlı sonuçlar verir
            max_tokens: 10,                                         // Yanıtın çok kısa olmasını istiyoruz, tokeni az tuttuk
        });

        // Yanıttan duyguyu ayıklayıp küçük harfe çevir 
        let sentiment = sentimentCompletion.choices[0].message.content.trim().toLowerCase();

        // ChatGPT bazen tam olarak "positive", "negative", "neutral" dışında yanıt verebilir.
        // Bu yüzden basit bir kontrol ekleyelim:
        if (!['positive', 'negative', 'neutral'].includes(sentiment)) 
        {
            // Eğer beklenen değerlerden biri değilse, ilk kelimeyi al veya varsayılan ata (en iyi yöntem olmayabilir)
            if (sentiment.includes('positive')) sentiment = 'positive';
            else if (sentiment.includes('negative')) sentiment = 'negative';
            else if (sentiment.includes('neutral')) sentiment = 'neutral';
            else sentiment = 'neutral'; // Hiçbiri olmazsa, varsayılan olarak "neutral" atıyoruz.
        };


        //                                       --- Özetleme (Summary) ---
        // OpenAI'a göndereceğimiz özetleme promptu
        const summaryPrompt = `Aşağıdaki tweeti 1-2 çok kısa ve öz cümleyle Türkçe olarak özetle. Özet, tweetin ana fikrini, varsa temel tartışmasını ve önemli noktalarını içermeli. Tweetin tamamını anlamaya çalış ve özetini buna göre oluştur:\n\n"${tweetContent}"`;
        // Burada birden fazla prompt deneyerek en doğru promptu seçmeye çalışıtım. ÖZetleri Türkçe vermesi için Türkçe prompt girdim.


        // ChatGPT API'ye istek gönder
        const summaryCompletion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: summaryPrompt }],
            temperature: 0.7, // Biraz daha yüksek sıcaklık, özetlemede biraz yaratıcılık sağlayabilir
            max_tokens: 100,  // Özet için yeterli bir token sayısı
        });
        // Yanıttan özeti ayıkla
        const summary = summaryCompletion.choices[0].message.content.trim();

        // Gönderim saati kısmını analizin yapıldığı zaman olarak ekliyorum
        const sendTime = new Date().toLocaleString('tr-TR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }); // Türkiye formatında, daha okunur tarih/saat

        
        res.json({
            sentiment: sentiment,
            summary: summary,
            sendTime: sendTime // Analiz anındaki zaman
        });
    }
    catch (error) 
    {
        console.error('Error analyzing tweet with ChatGPT API:', error.message);
        // OpenAI API hatalarını detaylı yakalamak için kontrol (sonra silinebilir)
        if (error.response && error.response.status === 401) {
            res.status(401).json({ error: 'OpenAI API Key is invalid or expired.' });
        } else if (error.response && error.response.status === 429) {
            res.status(429).json({ error: 'OpenAI API rate limit exceeded. Please try again later.' });
        } else if (error.response && error.response.data && error.response.data.error) {
            res.status(500).json({ error: `OpenAI API error: ${error.response.data.error.message}` });
        }
        else {
            res.status(500).json({ error: 'Failed to analyze tweet with AI. Please check server logs.' });
        }
    }
});






//                                               4.3. Google Sheets'e veri ekleme



app.post('/add-to-sheet', async (req, res) => {
    // Frontend'den beklediğimiz veri yapısı:
    const { username, tweetContent, sentiment, summary, sendTime, tweetUrl } = req.body;

    // Gerekli verilerin gelip gelmediğini kontrol et
    if (!username || !tweetContent || !sentiment || !summary || !sendTime || !tweetUrl) {
        return res.status(400).json({ error: 'Missing required data for adding to sheet.' });
    }

    try {
        // Google Sheets API istemcisini oluştur
        const sheets = google.sheets({ version: 'v4', auth });

        // Eklenecek satırlar
        const row = [
            username,
            tweetContent,
            sentiment,
            summary,
            sendTime,
            tweetUrl
        ];

        // Google Sheet'e veri ekleme
        const response = await sheets.spreadsheets.values.append({
            spreadsheetId: SPREADSHEET_ID,          // Tanımladığınız Spreadsheet ID (sheet linkinde yazar)
            range: 'Sheet1!A:F',                    // Sheet adı + sütun aralığı 
            valueInputOption: 'USER_ENTERED',       // Veri tipi otomatik olarak algılansın
            resource: {
                values: [row],                      // Eklenecek satır verisi 
            },
        });

        
        res.json({ message: 'Data successfully added to Google Sheet!', data: response.data }); // başarılıysa mesaj ve yanıt

    } catch (error) {
        console.error('Error adding data to Google Sheet:', error.message);
        // Google Sheets API hatalarını da detaylı yakalamak için kontrol
        if (error.code === 403) {
            res.status(403).json({ error: 'Permission denied. Make sure service account has edit access to the sheet.' });
        } else if (error.code === 404) {
            res.status(404).json({ error: 'Spreadsheet not found. Check SPREADSHEET_ID or sheet name.' });
        }
        else {
            res.status(500).json({ error: 'Failed to add data to Google Sheet. Please check server logs.' });
        }
    }
});



//                                              5. Sunucuyu Başlatma

const PORT = process.env.PORT || 5000; // .env den geliyor mu bak yoksa varsayılan olarak 5000 portunu kullan
app.listen(PORT, () => {
    console.log(`Node.js Backend server listening on port ${PORT}`);
});
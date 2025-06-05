// tweet-analyzer/frontend/src/App.js

import React, { useState } from 'react'; //react kullanmak icin
import axios from 'axios'; // HTTP istekleri yapmak icin
import './App.css'; // Stil dosyamız 

function App() {
  const [tweetUrl, setTweetUrl] = useState(''); // Kullanıcının girdiği tweet URL'si
  const [analysisResult, setAnalysisResult] = useState(null); // Backend'den gelen analiz sonuçları
  const [error, setError] = useState(null); // Hata mesajları
  const [loading, setLoading] = useState(false); // Yükleme durumu

  // Backendim bu portta calısıyor
  const API_BASE_URL = 'http://localhost:5000';

  // Tweet içeriğini çekme ve analiz etme fonksiyonu
  const handleAnalyzeTweet = async () => {
    setError(null); // Önceki hataları temizle
    setAnalysisResult(null); // Önceki analiz sonuçlarını temizle
    setLoading(true); // Yükleme durumunu başlat

    try {
      //Tweet içeriğini çek
      const contentResponse = await axios.post(`${API_BASE_URL}/get-tweet-content`, { tweetUrl });

      const { username, tweetContent, html, tweetUrl: fetchedTweetUrl } = contentResponse.data;

      //Çekilen tweet içeriğini analiz et
      const analyzeResponse = await axios.post(`${API_BASE_URL}/analyze-tweet`, { tweetContent });

      const { sentiment, summary, sendTime } = analyzeResponse.data;

      // Tüm sonuçları birleştir
      const combinedResult = {
        username,
        tweetContent,
        sentiment,
        summary,
        sendTime,
        tweetUrl: fetchedTweetUrl // Backend'den gelen URL i al
      };

      setAnalysisResult(combinedResult); // Analiz sonuçlarını kaydet

    } catch (err) {
      console.error('Analiz hatası:', err.response ? err.response.data : err.message); // Hata mesajını konsola yaz
      setError(err.response ? err.response.data.error : 'Bir hata oluştu. Lütfen tekrar deneyin.'); // Hata mesajını kullanıcıya gönder
    } finally {
      setLoading(false); // Yükleme durumunu bitir
    }
  };

  // Analiz sonuçlarını Google Sheets'e ekleme fonksiyonu
  const handleAddToSheet = async () => {
    if (!analysisResult) {
      setError('Önce bir tweet analizi yapmalısınız!'); // Analiz sonuçları yoksa hata mesajı
      return;
    }
    setError(null); 
    setLoading(true); 

    try {
      const response = await axios.post(`${API_BASE_URL}/add-to-sheet`, analysisResult); // Analiz sonuçlarını Google Sheets'e ekle
      alert('Veri başarıyla Google Sheets\'e eklendi!');
      console.log('Sheets yanıtı:', response.data);
      setAnalysisResult(null); // Eklendikten sonra sonuçları temizle
      setTweetUrl(''); // URL inputunu temizle

    } catch (err) {
      console.error('Sheets\'e ekleme hatası:', err.response ? err.response.data : err.message); // Hata mesajını konsola yaz
      setError(err.response ? err.response.data.error : 'Veri Sheets\'e eklenirken bir hata oluştu.');
    } finally {
      setLoading(false); // Yükleme durumunu bitir
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>AI Tweet Analiz Otomatı</h1>
      </header>
      <main className="App-main">
        <div className="input-section">
          <input
            type="text"
            placeholder="Tweet URL'sini buraya yapıştırın"
            value={tweetUrl}
            onChange={(e) => setTweetUrl(e.target.value)}
            disabled={loading} // Yüklenirken inputu devre dışı bırak
          />
          <button onClick={handleAnalyzeTweet} disabled={loading || !tweetUrl}>
            {loading && !analysisResult ? 'Analiz Ediliyor...' : 'Tweet\'i Analiz Et'}
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        {analysisResult && (
          <div className="analysis-results">
            <h2>Analiz Sonuçları</h2>
            <p><strong>Kullanıcı Adı:</strong> {analysisResult.username}</p>
            <p><strong>Tweet İçeriği:</strong> {analysisResult.tweetContent}</p>
            <p><strong>Duygu:</strong> {analysisResult.sentiment}</p>
            <p><strong>Özet:</strong> {analysisResult.summary}</p>
            <p><strong>Gönderim Saati:</strong> {analysisResult.sendTime}</p>
            <p><strong>Tweet URL:</strong> <a href={analysisResult.tweetUrl} target="_blank" rel="noopener noreferrer">{analysisResult.tweetUrl}</a></p>

            <button onClick={handleAddToSheet} disabled={loading}>
              {loading ? 'Ekleniyor...' : 'Google Sheets\'e Ekle'}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
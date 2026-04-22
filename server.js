const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const SOCKET_PATH = process.env.SOCKET_PATH || null;

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

let reviewsCache = {
  data: [],
  lastUpdate: null
};

const CACHE_DURATION = 30 * 60 * 1000;

async function parseReviews() {
  try {
    const url = 'https://firmi.by/minsk/remont-restavraciya-vosstanovlenie-dvuhmassovogo-mahovika-52249';
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'ru-RU,ru;q=0.9,en;q=0.8'
      },
      timeout: 10000
    });

    const $ = cheerio.load(response.data);
    const reviews = [];
    
    $('.review-item, .review, [class*="review-"]').each((index, element) => {
      const $el = $(element);
      
      const nameEl = $el.find('.review-name, .review-author, [class*="name"], [class*="author"]').first();
      const dateEl = $el.find('.review-date, [class*="date"]').first();
      const textEl = $el.find('.review-text, .review-content, [class*="text"], [class*="content"]').first();
      
      let name = nameEl.text().trim();
      let date = dateEl.text().trim();
      let text = textEl.text().trim();
      
      if (!text || text.length < 30) {
        text = $el.text().trim();
        const dateMatch = text.match(/(\d{1,2}\s+(?:января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря)\s+\d{4})/);
        if (dateMatch) {
          date = dateMatch[1];
          text = text.replace(dateMatch[0], '').trim();
        }
      }
      
      if (!name) {
        const lines = $el.text().split('\n').map(l => l.trim()).filter(l => l.length > 0);
        if (lines.length > 0) name = lines[0];
      }
      
      const isNegative = 
        text.includes('не рекомендую') || 
        text.includes('был послан') ||
        text.includes('гарантия прошла') ||
        text.includes('вибрации при запуске');
      
      if (!isNegative && text.length > 30 && name && date) {
        let stars = 5;
        if (text.includes('нормально') || text.includes('неплохо')) {
          stars = 4;
        }
        
        reviews.push({
          name: name.substring(0, 50),
          date: date,
          stars: stars,
          text: text.substring(0, 500),
          car: extractCarModel(text)
        });
      }
    });

    console.log(`Найдено отзывов через cheerio: ${reviews.length}`);

    if (reviews.length === 0) {
      console.warn('Парсинг не дал результатов, используем резервные данные');
      return getFallbackReviews();
    }

    return reviews
      .filter(r => r.stars >= 4)
      .sort((a, b) => parseDate(b.date) - parseDate(a.date));

  } catch (error) {
    console.error('Ошибка парсинга:', error.message);
    return getFallbackReviews();
  }
}

function extractCarModel(text) {
  const carPatterns = [
    /BMW\s+[A-Z0-9\s]+/i, /Volvo\s+[A-Z0-9\s]+/i, /Renault\s+[A-Za-z0-9\s]+/i,
    /Nissan\s+[A-Za-z0-9\s]+/i, /Audi\s+[A-Z0-9\s]+/i, /VW\s+[A-Za-z0-9\s]+/i,
    /Passat/i, /Megane/i, /Laguna/i, /Octavia/i, /Focus/i
  ];
  for (const pattern of carPatterns) {
    const match = text.match(pattern);
    if (match) return match[0].trim();
  }
  return 'Двухмассовый маховик';
}

function parseDate(dateStr) {
  const months = {
    'января': 0, 'февраля': 1, 'марта': 2, 'апреля': 3,
    'мая': 4, 'июня': 5, 'июля': 6, 'августа': 7,
    'сентября': 8, 'октября': 9, 'ноября': 10, 'декабря': 11
  };
  const parts = dateStr.split(' ');
  if (parts.length === 3) {
    return new Date(parseInt(parts[2]), months[parts[1]], parseInt(parts[0]));
  }
  return new Date();
}

app.get('/api/reviews', async (req, res) => {
  try {
    const now = Date.now();
    if (reviewsCache.data.length > 0 && reviewsCache.lastUpdate && (now - reviewsCache.lastUpdate) < CACHE_DURATION) {
      return res.json({ success: true, reviews: reviewsCache.data, cached: true });
    }
    const reviews = await parseReviews();
    reviewsCache = { data: reviews, lastUpdate: now };
    res.json({ success: true, reviews: reviews, cached: false });
  } catch (error) {
    res.status(500).json({ success: false, reviews: [] });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

if (SOCKET_PATH) {
  app.listen(SOCKET_PATH, () => {
    console.log(`🚀 Сервер запущен на сокете ${SOCKET_PATH}`);
    console.log(`📊 API отзывов: /api/reviews`);
  });
} else {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Сервер запущен на порту ${PORT}`);
    console.log(`📊 API отзывов: /api/reviews`);
  });
}
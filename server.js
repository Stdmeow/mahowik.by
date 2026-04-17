const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Кэш для отзывов (обновляется каждые 30 минут)
let reviewsCache = {
  data: [],
  lastUpdate: null
};

const CACHE_DURATION = 30 * 60 * 1000; // 30 минут

// Функция парсинга отзывов с firmi.by
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

    const html = response.data;
    const reviews = [];
    
    // Парсим отзывы из текста (они в простом формате)
    const reviewPattern = /([А-Яа-яA-Za-z\s]+)\s+(\d{1,2}\s+[а-я]+\s+\d{4})\s+в\s+\d{1,2}:\d{2}\s+(.*?)(?=\n\s*\n|\n\s*[А-Я]|$)/gs;
    const matches = [...html.matchAll(reviewPattern)];
    
    console.log(`Найдено совпадений: ${matches.length}`);
    
    for (const match of matches) {
      const name = match[1].trim();
      const date = match[2].trim();
      const text = match[3].trim();
      
      // Фильтруем негативные отзывы
      const isNegative = 
        text.includes('не рекомендую') || 
        text.includes('был послан') ||
        text.includes('гарантия прошла') ||
        text.includes('вибрации при запуске');
      
      // Определяем рейтинг по тексту
      let stars = 5;
      if (text.includes('нормально') || text.includes('неплохо')) {
        stars = 4;
      }
      
      if (!isNegative && text.length > 30 && text.length < 1000) {
        reviews.push({
          name: name,
          date: date,
          stars: stars,
          text: text,
          car: extractCarModel(text)
        });
      }
    }

    console.log(`Отфильтровано отзывов: ${reviews.length}`);

    // Если парсинг не сработал, используем резервные данные
    if (reviews.length === 0) {
      console.warn('Парсинг не дал результатов, используем резервные данные');
      return getFallbackReviews();
    }

    // Фильтруем только положительные (4-5 звезд) и сортируем по дате
    return reviews
      .filter(r => r.stars >= 4)
      .sort((a, b) => parseDate(b.date) - parseDate(a.date));

  } catch (error) {
    console.error('Ошибка парсинга:', error.message);
    return getFallbackReviews();
  }
}

// Извлечение модели автомобиля из текста
function extractCarModel(text) {
  const carPatterns = [
    /BMW\s+[A-Z0-9\s]+/i,
    /Volvo\s+[A-Z0-9\s]+/i,
    /Renault\s+[A-Za-z0-9\s]+/i,
    /Nissan\s+[A-Za-z0-9\s]+/i,
    /Audi\s+[A-Z0-9\s]+/i,
    /VW\s+[A-Za-z0-9\s]+/i,
    /Passat/i,
    /Megane/i,
    /Laguna/i,
    /Octavia/i,
    /Focus/i
  ];
  
  for (const pattern of carPatterns) {
    const match = text.match(pattern);
    if (match) {
      return match[0].trim();
    }
  }
  
  return 'Двухмассовый маховик';
}

// Парсинг даты для сортировки
function parseDate(dateStr) {
  const months = {
    'января': 0, 'февраля': 1, 'марта': 2, 'апреля': 3,
    'мая': 4, 'июня': 5, 'июля': 6, 'августа': 7,
    'сентября': 8, 'октября': 9, 'ноября': 10, 'декабря': 11
  };
  
  const parts = dateStr.split(' ');
  if (parts.length === 3) {
    const day = parseInt(parts[0]);
    const month = months[parts[1]];
    const year = parseInt(parts[2]);
    return new Date(year, month, day);
  }
  
  return new Date();
}

// Резервные отзывы (если парсинг не работает)
function getFallbackReviews() {
  return [
    {
      name: "Валера",
      date: "28 февраля 2026",
      stars: 5,
      text: "Шикарно сделали! Работает как новый! И даже лучше. Проехал уже 157 тыс. км. Гарантию дали всего 2 месяца, я езжу уже 2,5 года. Вопросов не возникло. Нормальный сервис.",
      car: "Двухмассовый маховик"
    },
    {
      name: "Гена",
      date: "09 февраля 2023",
      stars: 5,
      text: "Достойно реставрировали! Новый в Европе покупал несколько лет назад, по моему разницы вообще нет. Респект! Посмотрим сколько проедет, пока около 7 тыс, полет нормальный.",
      car: "Двухмассовый маховик"
    },
    {
      name: "Виталий",
      date: "29 октября 2022",
      stars: 5,
      text: "Рестоврировали маховик BMW E39 M51. Сделали безупречно! На любых режимах маховик работает идеально. Что по доставке, и что по доставке обратно всё супер! Были вопросы у меня, ответили без проблем, и ещё совет дали! Очень рекомендую!",
      car: "BMW E39 M51"
    },
    {
      name: "Вадим",
      date: "11 июля 2022",
      stars: 5,
      text: "Благодарочка из Лиды! На Лагуну 3 брал маховик, работает без каких либо нареканий в любых режимах. Побольше бы таких ответственных.",
      car: "Renault Laguna 3"
    },
    {
      name: "Саша",
      date: "26 февраля 2022",
      stars: 4,
      text: "Отремонтировали маховик на Volvo S80, сделали быстро, о качестве судить рано, но первые 2.000км без проблем, вибраций нет и лишних шумов нет.",
      car: "Volvo S80"
    },
    {
      name: "Владимир",
      date: "31 июля 2021",
      stars: 5,
      text: "Долго думал восстанавливать или покупать новый. Решил восстанавливать. Скажу что восстановленный маховик по внешнему виду не отличить от нового. Все аккуратно. Механику качество понравилось. Я из Бреста. С доставкой также не возникло проблем. Рекомендую.",
      car: "Оригинальный маховик"
    },
    {
      name: "Александр",
      date: "30 марта 2021",
      stars: 5,
      text: "Сделали как и обещали \"сегодня на завтра\". Качество по моему не уступает новой запчасти, а мастер на СТО сказал, что качество лучше, чем сейчас новые маховики продают. Поставил поехал, проблем никаких нет.",
      car: "Двухмассовый маховик"
    },
    {
      name: "Александр",
      date: "14 марта 2021",
      stars: 5,
      text: "Отличный сервис. Приехал из другого города, был день на ремонт. Помогли с монтажными работами, все сделано качественно и оперативно. Рекомендую!",
      car: "Двухмассовый маховик"
    },
    {
      name: "Борис",
      date: "25 февраля 2021",
      stars: 5,
      text: "Был приятно удивлен качеством и скоростью работ. Четко, быстро сделали и машина как часы стала тикать. Удивительно честно говоря, что есть у нас мастера такого хорошего уровня. Не ожидал!",
      car: "Двухмассовый маховик"
    },
    {
      name: "Sania",
      date: "06 февраля 2021",
      stars: 5,
      text: "Сдавал в ремонт маховик от своего автомобиля. Сделали довольно быстро, а что самое главное, объяснили в чем проблема и как избежать будущей поломки. Остался доволен, можно смело ехать к ребятам.",
      car: "Двухмассовый маховик"
    },
    {
      name: "Виталий Л.",
      date: "04 января 2021",
      stars: 5,
      text: "Ремонтируем здесь маховики около 4х лет, ни разу не было проблем. Четко все делают и быстро. Клиенту экономия и мы при работе.",
      car: "СТО — постоянный клиент"
    },
    {
      name: "Олег",
      date: "25 ноября 2020",
      stars: 5,
      text: "Супер. Сделали быстро, а главное качественно. Побольше бы таких ИПэшников. Двигатель заводится и глушится совсем подругому, маховик работает как новый. Спасибо.",
      car: "Двухмассовый маховик"
    },
    {
      name: "Сергей",
      date: "20 ноября 2020",
      stars: 5,
      text: "Хорошо сделали и посоветовали на что обратить внимание, чтобы поломка не повторилась как можно дольше.",
      car: "Двухмассовый маховик"
    },
    {
      name: "Николай",
      date: "25 октября 2020",
      stars: 4,
      text: "Нормально. Новый дорого, восстановленный на много дешевле, а разницы я не заметил. Работает четко на любой передаче и заводится и глушится теперь двигатель как новый.",
      car: "Двухмассовый маховик"
    },
    {
      name: "Василий",
      date: "15 сентября 2020",
      stars: 5,
      text: "Отлично сделали, не хуже нового, а цена в 2,5 раза ниже, чем стоит новый. Супер - быстро, относительно дёшево и сердито.",
      car: "Двухмассовый маховик"
    },
    {
      name: "Евгений",
      date: "23 ноября 2019",
      stars: 5,
      text: "Благодарочка из Лиды! На Лагуну 3 брал маховик, работает без каких либо нареканий в любых режимах. Побольше бы таких ответственных контор! Ещё раз спасибо!",
      car: "Renault Laguna 3"
    },
    {
      name: "Дмитрий",
      date: "20 ноября 2019",
      stars: 5,
      text: "В прошлом 2018 году делал здесь маховик на Ниссан ИксТреил. Ходит до сих пор без вопросов. Отлично сделали, такое ощущение, что и мотор стал тише работать. Новый стоил больше 2000 руб, ребята взяли за ремонт 450руб. Ни чем не хуже нового. Спасибо огромное!",
      car: "Nissan X-Trail"
    }
  ];
}

// API endpoint для получения отзывов
app.get('/api/reviews', async (req, res) => {
  try {
    const now = Date.now();
    
    // Проверяем кэш
    if (reviewsCache.data.length > 0 && 
        reviewsCache.lastUpdate && 
        (now - reviewsCache.lastUpdate) < CACHE_DURATION) {
      return res.json({
        success: true,
        reviews: reviewsCache.data,
        cached: true,
        lastUpdate: new Date(reviewsCache.lastUpdate).toLocaleString('ru-RU')
      });
    }

    // Парсим новые отзывы
    const reviews = await parseReviews();
    
    // Обновляем кэш
    reviewsCache = {
      data: reviews,
      lastUpdate: now
    };

    res.json({
      success: true,
      reviews: reviews,
      cached: false,
      lastUpdate: new Date(now).toLocaleString('ru-RU')
    });

  } catch (error) {
    console.error('Ошибка API:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      reviews: getFallbackReviews()
    });
  }
});

// Endpoint для принудительного обновления
app.post('/api/reviews/refresh', async (req, res) => {
  try {
    const reviews = await parseReviews();
    reviewsCache = {
      data: reviews,
      lastUpdate: Date.now()
    };
    
    res.json({
      success: true,
      message: 'Отзывы обновлены',
      count: reviews.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Тестовый endpoint для проверки статуса
app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    server: 'Reviews Parser API',
    version: '1.0.0',
    cache: {
      reviewsCount: reviewsCache.data.length,
      lastUpdate: reviewsCache.lastUpdate 
        ? new Date(reviewsCache.lastUpdate).toLocaleString('ru-RU')
        : 'Не обновлялось',
      cacheAge: reviewsCache.lastUpdate 
        ? Math.floor((Date.now() - reviewsCache.lastUpdate) / 1000) + ' сек'
        : 'N/A'
    },
    endpoints: {
      reviews: 'GET /api/reviews',
      refresh: 'POST /api/reviews/refresh',
      status: 'GET /api/status'
    }
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Сервер запущен на http://localhost:${PORT}`);
  console.log(`📊 API отзывов: http://localhost:${PORT}/api/reviews`);
});

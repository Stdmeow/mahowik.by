# Инструкция по настройке на хостинге

## Вариант 1: Подключение через порт

1. В панели хостинга выберите порт (например, 3000)
2. Запустите приложение с командой:
   ```bash
   node server.js
   ```
3. В настройках nginx добавьте проксирование:
   ```nginx
   location / {
       proxy_pass http://127.0.0.1:3000;
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection 'upgrade';
       proxy_set_header Host $host;
       proxy_cache_bypass $http_upgrade;
   }
   ```

## Вариант 2: Подключение через Unix Socket

1. В панели хостинга выберите "Unix Socket"
2. Укажите путь к сокету (например, `/var/run/app.sock`)
3. Установите переменную окружения:
   ```bash
   export SOCKET_PATH=/var/run/app.sock
   ```
4. Запустите приложение:
   ```bash
   node server.js
   ```
5. В настройках nginx:
   ```nginx
   location / {
       proxy_pass http://unix:/var/run/app.sock;
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection 'upgrade';
       proxy_set_header Host $host;
       proxy_cache_bypass $http_upgrade;
   }
   ```

## Вариант 3: Изменить порт в коде

Если хотите жестко задать порт, измените в `server.js`:

```javascript
const PORT = process.env.PORT || 3000;  // Замените 3000 на нужный порт
```

## Проверка работы

После запуска проверьте:
1. Откройте ваш сайт в браузере
2. Откройте консоль разработчика (F12)
3. Проверьте что отзывы загружаются
4. В консоли должно быть: `✅ Отзывы загружены с сервера: 17`

## Устранение ошибок

### 502 Bad Gateway
- Проверьте что Node.js приложение запущено
- Проверьте что порт/сокет совпадает в nginx и приложении
- Проверьте логи: `journalctl -u your-app-name -f`

### Отзывы не загружаются
- Откройте консоль браузера (F12)
- Проверьте Network вкладку
- Должен быть запрос к `/api/reviews`
- Если ошибка CORS - проверьте настройки nginx

### Приложение не запускается
```bash
# Проверьте зависимости
npm install

# Проверьте синтаксис
node --check server.js

# Запустите с логами
node server.js
```

## Автозапуск (systemd)

Создайте файл `/etc/systemd/system/mahowik.service`:

```ini
[Unit]
Description=Mahowik Reviews API
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/your/app
ExecStart=/usr/bin/node server.js
Restart=always
Environment=NODE_ENV=production
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
```

Затем:
```bash
sudo systemctl daemon-reload
sudo systemctl enable mahowik
sudo systemctl start mahowik
sudo systemctl status mahowik
```

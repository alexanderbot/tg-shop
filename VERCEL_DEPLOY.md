# Деплой tg-shop на Vercel

На Vercel нужно развернуть **два отдельных проекта**: backend (server) и frontend (client). Один проект = один Root Directory, поэтому server и client должны быть разными проектами. После деплоя подставьте выданные URL в переменные окружения.

---

## Важно: по вашим логам

В логах виден **один** проект `tg-shop`: часть запросов на GET `/` даёт **200**, часть (другие домены) — **404**. Это обычно значит:

- Либо развёрнут только **один** проект (server или client). Тогда второй URL (который вы вставили в бота) может быть превью-деплоем того же проекта с неправильной конфигурацией → 404 или отдача API вместо страницы.
- **Что проверить в Vercel:** у вас должно быть **два** проекта в списке (например «tg-shop-server» и «tg-shop-client»). У каждого свой URL:
  - проект с Root Directory **server** → этот URL в webhook и в `VITE_APP_BACKEND_URL`;
  - проект с Root Directory **client** → этот URL в Menu Button бота и в `CLIENT_APP_URL`.

Если проект один — создайте второй: **Add New → Project** → тот же репозиторий → другой **Root Directory** (`client` или `server`).

---

## 1. Репозиторий

Убедитесь, что код в GitHub (или другом Git), к которому есть доступ из Vercel:

```bash
git add .
git commit -m "Prepare for Vercel deploy"
git push origin main
```

---

## 2. Деплой Backend (сервер)

1. Зайдите на [vercel.com](https://vercel.com) и войдите (или зарегистрируйтесь).
2. **Add New…** → **Project**.
3. **Import** репозиторий tg-shop.
4. В настройках проекта:
   - **Root Directory**: нажмите **Edit**, укажите папку **`server`**.
   - **Framework Preset**: оставьте Other (или Node.js).
   - **Build Command**: пусто или `npm install`.
   - **Output Directory**: пусто (для serverless не нужно).
5. **Environment Variables** (обязательно):
   - `BOT_TOKEN` — токен бота из @BotFather
   - `PAYMENT_TOKEN` — токен платежей из BotFather
   - `CLIENT_APP_URL` — **пока оставьте пустым**, заполните после деплоя клиента (например `https://ваш-client.vercel.app`)
   - `ADMIN_TELEGRAM_ID` — (опционально) ваш ID в Telegram; на этот аккаунт будут приходить уведомления о новых заказах. Несколько ID через запятую: `123456789,987654321`. Узнать ID можно через @userinfobot
6. Нажмите **Deploy**.
7. После деплоя скопируйте URL бэкенда (например `https://tg-shop-server-xxx.vercel.app`) — он понадобится для клиента и для webhook.

---

## 3. Деплой Frontend (клиент)

1. Снова **Add New…** → **Project** и выберите тот же репозиторий tg-shop.
2. В настройках:
   - **Root Directory**: укажите папку **`client`**.
   - **Framework Preset**: Vite подставится автоматически.
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. **Environment Variables**:
   - `VITE_APP_BACKEND_URL` — URL бэкенда из шага 2 (например `https://tg-shop-server-xxx.vercel.app`)
   - `VITE_APP_NAME` — название приложения (например `TGCart`)
4. Нажмите **Deploy**.
5. Скопируйте URL клиента (например `https://tg-shop-client-xxx.vercel.app`).

---

## 4. Обновить переменные после первого деплоя

1. **Backend**: в проекте server в Vercel откройте **Settings** → **Environment Variables** и задайте:
   - `CLIENT_APP_URL` = URL клиента (из шага 3)
   - `ADMIN_TELEGRAM_ID` = ваш Telegram ID (если нужны уведомления о заказах)
2. Сделайте **Redeploy** проекта server (Deployments → … → Redeploy).

---

## 5. Webhook и бот

1. Установите webhook (подставьте свои значения):
   ```
   https://api.telegram.org/bot<BOT_TOKEN>/setWebhook?url=<URL_СЕРВЕРА>
   ```
   Пример: `https://api.telegram.org/bot123456:ABC.../setWebhook?url=https://tg-shop-server-xxx.vercel.app/`

2. В @BotFather: **Bot Settings** → **Menu Button** → укажите URL клиента (из шага 3).

---

## Итог

| Компонент | URL (пример) |
|-----------|----------------|
| Backend   | `https://your-server.vercel.app` |
| Client    | `https://your-client.vercel.app` |

- **CLIENT_APP_URL** (на сервере) = URL клиента  
- **VITE_APP_BACKEND_URL** (на клиенте) = URL сервера  
- **Webhook** = URL сервера  
- **Menu Button** = URL клиента  

После этого Mini App можно открывать через бота в Telegram.

---

## Если в боте не открывается: логи и проверки

### Где смотреть логи в Vercel

1. **Логи клиента (frontend)**  
   Vercel → проект **client** → вкладка **Deployments** → откройте последний деплой → **Building** (логи сборки). Ошибки сборки будут здесь.

2. **Логи сервера (backend)**  
   Vercel → проект **server** → вкладка **Deployments** → последний деплой → **Functions** (или **Runtime Logs**). Здесь видны запросы к API и ошибки при обработке.

3. **Логи в реальном времени**  
   В проекте: **Logs** (или **Monitoring**). Можно смотреть запросы к функциям и ошибки во время открытия Mini App.

### Частые причины «не открывается» и что проверить

| Проблема | Что проверить |
|----------|----------------|
| **Белый экран / «Loading…» не исчезает** | В клиенте на Vercel задана переменная **VITE_APP_BACKEND_URL** = URL сервера (без слэша в конце). Без неё запросы к API уходят в пустой URL и приложение «висит». |
| **CORS в консоли браузера** | На **сервере** в Vercel переменная **CLIENT_APP_URL** должна быть **ровно** URL клиента, например `https://tg-shop-xxha.vercel.app` (тот же, что в Menu Button). После смены — Redeploy сервера. |
| **«initData is missing»** | Открывать нужно именно из бота (Menu или кнопка), а не по прямой ссылке в обычном браузере. В Telegram WebView initData передаётся автоматически. |
| **Страница не загружается в Telegram** | Menu Button в BotFather должен быть **https://…** (клиентский URL). Без `https://` Telegram может не открыть Mini App. |
| **Ошибки при запросе к API** | В логах **Functions** сервера на Vercel смотреть ответы и статусы. Убедиться, что URL сервера доступен (открыть в браузере `https://ваш-сервер.vercel.app/products` — должен вернуться JSON). |

### Краткий чеклист

- [ ] **Client** на Vercel: Root Directory = `client`, в переменных есть **VITE_APP_BACKEND_URL** = URL сервера.
- [ ] **Server** на Vercel: Root Directory = `server`, в переменных есть **CLIENT_APP_URL** = URL клиента (как в Menu Button).
- [ ] Menu Button в BotFather: `https://tg-shop-xxha.vercel.app` (или ваш URL клиента), с `https://`.
- [ ] Webhook: установлен на URL **сервера**, не клиента.
- [ ] В браузере открыть URL клиента — должна загрузиться страница (хоть и с «initData is missing»). Если не грузится — смотреть Build в Vercel у client.

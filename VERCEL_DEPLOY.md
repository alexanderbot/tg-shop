# Деплой tg-shop на Vercel

На Vercel нужно развернуть **два проекта**: backend (server) и frontend (client). После деплоя подставьте выданные URL в переменные окружения.

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

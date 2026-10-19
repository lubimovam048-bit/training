# training

Рабочий репозиторий Марины: скиллы, дизайн и эксперименты.

## Выгрузка сайта на хостинг (Beget, SFTP)

1. Один раз положите пароль от SFTP одной строкой в файл `.deploy-password` в корне репозитория. Файл в `.gitignore` и в GitHub не попадёт.
2. Запустите из корня репозитория:

```
make deploy
```

(или `./deploy.sh`). Скрипт создаст на сервере недостающие папки `sims-party/public_html` и зальёт туда всю папку `sims-bday` вместе с вложенными. Файлы, удалённые из `sims-bday`, на сервере не удаляются.

## Ответы гостей в Telegram

Кнопка «Присоединиться к событию» спрашивает имя гостя и отправляет его в Telegram через `sims-bday/rsvp.php` (работает только на хостинге с PHP, на GitHub Pages — нет).

1. Создайте бота у @BotFather (`/newbot`), сохраните токен. Напишите своему боту любое сообщение.
2. Узнайте свой chat_id: откройте в браузере `https://api.telegram.org/bot<ТОКЕН>/getUpdates` и найдите `"chat":{"id": ...}`.
3. Скопируйте `sims-bday/rsvp-config.example.php` в `sims-bday/rsvp-config.php` и впишите токен и chat_id. Файл в `.gitignore`, в GitHub он не попадёт.
4. `make deploy`.

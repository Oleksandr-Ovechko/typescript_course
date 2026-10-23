# Задание 3 (по желанию). Свой кейс в контейнере `wl-e2e`

Нужно: образ Playwright (`docker pull mcr.microsoft.com/playwright:v1.60.0-noble`,
3,4 ГБ), ~4 ГБ на диске под образ проекта, `.secure` окружения.

## Что сделать

Из корня своего `wl-e2e`:

```bash
docker compose -f docker-compose.dev.yml build monolith-dev
docker compose -f docker-compose.dev.yml run --rm monolith-dev yarn playwright test C<номер> --list
docker compose -f docker-compose.dev.yml run --rm monolith-dev yarn case C<номер> --env=staging-genN
```

На Linux в обе команды `run` добавьте `--user "$(id -u):$(id -g)"` —
иначе созданные файлы станут принадлежать `root`.

**Не запускайте `docker compose up -d` без `-f`**: в корне это другой
файл, `docker-compose.yml`, и он запустит полный прогон в трёх
контейнерах против мёртвого `staging`.

Убрать за собой: `docker compose -f docker-compose.dev.yml down -v`,
`docker image rm wl-e2e-monolith-dev`.

## Ответ

Сколько собирался образ: …

Вывод `--list` (последняя строка `Total: …`): …

Итог `yarn case` в контейнере и у вас на машине — одинаковый? …

Если что-то не пошло — вывод целиком, и на какой системе (Windows,
macOS, Linux).

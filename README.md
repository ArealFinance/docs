# Areal Finance — RWT Docs

Документация протокола RWT (Areal Finance) на базе [Mintlify](https://mintlify.com).
Английская, тёмная тема (форсирована через `appearance.strict`).

## Локальный запуск

```bash
npm install        # или: npm i -g mint
npm run dev        # mint dev → http://localhost:3000
```

## Структура

```
docs.json                     # конфигурация Mintlify (навигация, тема)
get-started/                  # страницы
how-it-works/                 # overview, rwt, strwt, liquidity, borrowing
contracts/                    # смарт-контракты
changelog/                    # журнал изменений
snippets/                     # встраиваемые компоненты (iframe-виджеты)
```

## Виджеты

Живые виджеты вынесены в отдельный репозиторий `../docs-widgets`
(GitHub Pages, `0xrealist.github.io/docs-widgets`) и встроены через `<iframe>`
из `snippets/*.mdx`.

## Полезное

- `npm run check` — поиск битых ссылок (`mint broken-links`).
- Источник контента: `../areal-rwt/README.md` (механика протокола) и `../areal-rwt/MVP.md`.

## Повна інструкція з встановлення Node.js та генерації `icons.json`

### Крок 1. Встановити Node.js

1. Завантаж Node.js з офіційного сайту: https://nodejs.org/
2. Завантаж **LTS версію** (рекомендована для більшості користувачів)
3. Запусти інсталятор
4. Натискай "Next" до завершення встановлення (всі налаштування за замовчуванням)

### Крок 2. Перевірити встановлення

Відкрий **командний рядок (cmd)** (НЕ PowerShell) і виконай:

```cmd
node --version
npm --version
```

Якщо побачиш версії (наприклад `v26.8.1` та `10.9.2`) — Node.js встановлено правильно.

### Крок 3. Перейти в папку проєкту

```cmd
cd E:\NUC10\APP_OPERA\sidepanelviewer
```

### Крок 4. Встановити залежності

```cmd
npm init -y
```

Це створить `package.json` (якщо його немає).

```cmd
npm install @fluentui/svg-icons@1.1.339
```

Це встановить іконки в `node_modules/@fluentui/svg-icons/`

### Крок 5. Запустити генерацію

```cmd
node tools/generate-icons.js
```


```
✅ Generated XXXX icons to E:\NUC10\APP_OPERA\sidepanelviewer\data\icons.json
```

#Ось тільки те, що треба додати в кінець файлу `tools.md`:

```markdown
### Крок 6. Запустити генерацію спрайту `iconsSprite24.svg`

**Важливо:** цей крок виконується **після** Кроку 5, бо скрипт читає `data/icons.json`.

```cmd
node tools/generate-sprite.js
```

```
✅ Generated sprite with XXXX symbols (skipped 0) to E:\NUC10\APP_OPERA\sidepanelviewer\data\iconsSprite24.svg
```

### Крок 7. Перевірити результат

У папці `data/` мають з'явитися два файли:

- `icons.json` — метадані всіх іконок (~2.5 МБ)
- `iconsSprite24.svg` — SVG-спрайт для 24px іконок (~6 МБ)

### Порядок запуску (коротко)

```cmd
node tools/generate-icons.js
node tools/generate-sprite.js
```

Якщо `icons.json` вже актуальний і потрібно лише перегенерувати спрайт — достатньо виконати тільки `node tools/generate-sprite.js`.
```
# Testy Policyjne (Next.js, 100% offline)

W pełni statyczna aplikacja do nauki testów policyjnych/prawnych – działa **wyłącznie w przeglądarce**:

- brak backendu / API / logowania
- pełna praca offline (po załadowaniu zasobów aplikacji)
- quizy generowane **wyłącznie** z kuratorskich banków pytań w JSON
- dane (historia, wyniki, ustawienia) w `IndexedDB`
- kompatybilne z GitHub Pages (`output: "export"`)
- UI w języku polskim + tryb ciemny

## Wbudowane banki (bez importu)

Umieść pliki JSON w:

- `legal-quiz-web/public/question-banks/`

Aplikacja automatycznie je wykryje na etapie builda (skrypt generuje `public/question-banks/index.json`).

## Format JSON (wymagany)

Minimalny format:

```json
{
  "title": "Ustawa o Policji",
  "question_count": 300,
  "questions": [
    { "id": 1, "category": "Przepisy ogólne", "question": "…", "type": "truefalse", "correct": true }
  ]
}
```

Obsługiwane typy:

- `single_choice` + `choices[]` + `correctIndex`
- `multiple_choice` + `choices[]` + `correctIndexes[]`
- `truefalse` + `correct`
- `fillblank` + `answer`

Pola opcjonalne:

- `difficulty`: `easy` | `medium` | `hard`
- `explanation`: string

## Import ręczny (opcjonalny)

W `Banki` możesz zaimportować dodatkowe banki `.json`. Zostaną zapisane lokalnie w `IndexedDB` i połączone z bankami wbudowanymi.

## Start lokalnie

```bash
cd legal-quiz-web
npm install
npm run dev
```

## Build statyczny (GitHub Pages)

```bash
cd legal-quiz-web
npm run build
```

Wynik statyczny trafia do `legal-quiz-web/out/`.

### GitHub Pages workflow (przykład)

Utwórz `.github/workflows/pages.yml` w repo:

```yml
name: Deploy Pages
on:
  push:
    branches: [main]
permissions:
  contents: read
  pages: write
  id-token: write
concurrency:
  group: pages
  cancel-in-progress: true
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
          cache-dependency-path: legal-quiz-web/package-lock.json
      - run: npm ci
        working-directory: legal-quiz-web
      - run: npm run build
        working-directory: legal-quiz-web
        env:
          NEXT_PUBLIC_BASE_PATH: "/REPO_NAME"
      - uses: actions/upload-pages-artifact@v3
        with:
          path: legal-quiz-web/out
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

Zamień `REPO_NAME` na nazwę repo (z ukośnikiem na początku).


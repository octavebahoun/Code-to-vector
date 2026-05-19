# codetovecto

> Scanne ton projet et génère une base de données vectorielle prête pour un chatbot IA.

---

## Installation

```bash
npm install -g codetovecto
```

---

## Démarrage rapide

### 1. Initialise la configuration

```bash
npx codetovecto init
```

Cela génère un fichier `codetovecto.config.js` à la racine de ton projet.

### 2. Configure le fichier

```js
module.exports = {
  mode: "frontend",       // frontend | backend | fullstack
  output: "json",         // json | chroma
  frontend: "./src",
  backend: "./server",
  api: "./app/api",       // si fullstack
  views: "./app",         // si fullstack
  php: {
    mode: "backend"       // backend | frontend | mixed
  }
};
```

### 3. Configure ta clé API

Crée un fichier `.env` à la racine de ton projet :

```env
AI_API_KEY=sk-or-v1-xxxxxxxxxxxxxxxx
AI_MODEL=openai/gpt-3.5-turbo
```

> La clé API est fournie par [OpenRouter](https://openrouter.ai) — tu peux choisir n'importe quel modèle disponible.

### 4. Lance le scan

```bash
# Scanner uniquement le frontend
npx codetovecto run --frontend

# Scanner uniquement le backend
npx codetovecto run --backend

# Scanner les deux
npx codetovecto run --fullstack
```

---

## Résultat

### JSON (`output: "json"`)

Génère un fichier `codetovecto-output.json` :

```json
[
  {
    "file": "home.jsx",
    "type": "frontend",
    "analysis": "Page d'accueil — présente le produit, section hero, appel à l'action..."
  }
]
```

### Chroma (`output: "chroma"`)

Génère un fichier `codetovecto-chroma.json` prêt pour une base vectorielle :

```json
{
  "documents": [
    {
      "id": "doc_0",
      "document": "Page d'accueil — présente le produit...",
      "metadata": {
        "file": "home.jsx",
        "type": "frontend"
      }
    }
  ]
}
```

---

## Fichiers supportés

| Extension | Support |
|-----------|---------|
| `.jsx`    | ✅ |
| `.tsx`    | ✅ |
| `.js`     | ✅ |
| `.html`   | ✅ |
| `.php`    | 🔜 v2 |

---

## Comment ça marche

```
codetovecto init
      ↓
Configuration du projet (mode, dossiers, output)
      ↓
codetovecto run --frontend
      ↓
Scan des fichiers (.jsx, .tsx, .js, .html)
      ↓
Extraction du contenu par fichier
      ↓
Analyse IA via OpenRouter (ton modèle, ta clé)
      ↓
Génération JSON ou Chroma vectorisé
```

---

## Auteur

**Octave Precieux Mahunan BAHOUN-HOUTOUKPE**

---

## Licence

MIT
# codetovecto

> Transforme ton projet en base de connaissances vectorielle locale — prête pour un chatbot IA.

**codetovecto** scanne ton code source, le découpe intelligemment via AST, génère des embeddings, et les stocke dans une base vectorielle embarquée (LanceDB). Aucun serveur requis. Aucune donnée envoyée ailleurs que ta clé OpenRouter.

---

## Table des matières

- [Installation](#installation)
- [Démarrage rapide](#démarrage-rapide)
- [Configuration](#configuration)
- [Commandes](#commandes)
- [Ce que ça génère](#ce-que-ça-génère)
- [Utilisation dans ton projet](#utilisation-dans-ton-projet)
- [Comment ça marche](#comment-ça-marche)
- [Fichiers supportés](#fichiers-supportés)
- [Fichiers ignorés](#fichiers-ignorés)
- [Auteur](#auteur)
- [Licence](#licence)

---

## Installation

```bash
npm install -g codetovecto
```

Ou sans installation globale :

```bash
npx codetovecto
```

---

## Démarrage rapide

### Étape 1 — Initialise le projet

Lance cette commande à la racine de ton projet :

```bash
npx codetovecto init
```

Deux fichiers sont générés automatiquement :

| Fichier | Rôle |
|---|---|
| `codetovecto.config.js` | Configuration des dossiers à scanner |
| `codetovecto-exemple.js` | Exemple d'intégration RAG avec un LLM |

---

### Étape 2 — Configure les dossiers

Ouvre `codetovecto.config.js` et indique les dossiers de ton projet :

```js
module.exports = {
  frontend: "./src",       // dossier frontend (React, Vue, etc.)
  backend: "./server",     // dossier backend (Express, etc.)
};
```

---

### Étape 3 — Ajoute ta clé API

Crée un fichier `.env` à la racine de ton projet :

```env
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxxxxx
```

> Ta clé API est fournie gratuitement par [OpenRouter](https://openrouter.ai).
> Les embeddings utilisent le modèle `nvidia/llama-nemotron-embed-vl-1b-v2:free` — **gratuit**.

---

### Étape 4 — Lance le scan

```bash
# Scanner uniquement le frontend
npx codetovecto scan --frontend

# Scanner uniquement le backend
npx codetovecto scan --backend

# Scanner les deux
npx codetovecto scan --fullstack
```

---

## Configuration

Voici toutes les options disponibles dans `codetovecto.config.js` :

```js
module.exports = {
  frontend: "./src",      // chemin vers ton dossier frontend
  backend: "./server",    // chemin vers ton dossier backend
  
  // Options de filtrage de taille de chunk
  minLines: 5,            // Nombre de lignes minimales pour conserver un chunk (défaut : 5)
  minCharacters: 120,     // Nombre de caractères minimaux pour conserver un chunk (défaut : 120)
};
```

Les options avancées (chemin d'export, limite de tokens, provider) se configurent via les flags CLI.

---

## Commandes

### `codetovecto init`

Initialise le projet en générant les fichiers de démarrage.

```bash
npx codetovecto init
```

---

### `codetovecto scan`

Lance le scan, le parsing AST, la génération des embeddings et l'export.

```bash
npx codetovecto scan [options]
```

| Option | Description | Défaut |
|---|---|---|
| `--frontend` | Scanner le dossier frontend | — |
| `--backend` | Scanner le dossier backend | — |
| `--fullstack` | Scanner frontend + backend | ✅ par défaut |
| `--output <path>` | Chemin du fichier JSON exporté | `codetovecto-output.json` |
| `--lancedb <path>` | Chemin de la base LanceDB | `codetovecto-lancedb/` |

**Exemples :**

```bash
npx codetovecto scan --frontend
npx codetovecto scan --fullstack --output ./data/knowledge.json
```

---

## Ce que ça génère

### `codetovecto-output.json`

Un fichier JSON contenant tous les chunks vectorisés de ton projet :

```json
[
  {
    "name": "useAuth",
    "type": "arrow-function",
    "file": "useAuth.js",
    "path": "/src/hooks/useAuth.js",
    "code": "const useAuth = () => { ... }",
    "embedding": [0.021, -0.043, 0.091, "..."]
  }
]
```

Ce fichier est portable — tu peux le versionner ou le partager.

---

### `codetovecto-lancedb/`

Une base vectorielle locale embarquée générée par [LanceDB](https://lancedb.com).

```
codetovecto-lancedb/
└── chunks.lance/
    ├── data/
    ├── _transactions/
    └── _versions/
```

- **Aucun serveur requis** — tout tourne en local
- **Recherche en millisecondes** — même sur de grandes codebases
- **Persistant** — le dossier se recharge à chaque appel

---

## Utilisation dans ton projet

### Recherche vectorielle

```js
const search = require("codetovecto/search");

const resultat = await search("comment fonctionne le login ?");

console.log(resultat.question); // "comment fonctionne le login ?"
console.log(resultat.context);  // tableau des chunks les plus proches
```

### Structure du résultat

```js
{
  question: "comment fonctionne le login ?",
  context: [
    {
      name: "handleLogin",
      type: "arrow-function",
      file: "auth.js",
      path: "/src/services/auth.js",
      code: "const handleLogin = async (email, password) => { ... }"
    },
    // ...4 autres chunks proches
  ]
}
```

### Options disponibles

```js
const resultat = await search("ta question", {
  dbPath: "./codetovecto-lancedb",  // chemin de la base (défaut)
  limit: 5,                          // nombre de chunks retournés (défaut: 5)
});
```

### Intégration avec un LLM

Consulte le fichier `codetovecto-exemple.js` généré par `init` pour un exemple complet d'intégration avec OpenRouter, OpenAI, ou tout autre LLM.

```js
// codetovecto-exemple.js (simplifié)
const search = require("codetovecto/search");

const resultat = await search("comment fonctionne le scanner ?");

const contexte = resultat.context
  .map(c => `// ${c.file}\n${c.code}`)
  .join("\n\n");

// Injecte `contexte` dans le prompt de ton LLM
```

---

## Comment ça marche

> [!TIP]
> **Système de Cache Intelligent** : Un fichier `.codetovecto-cache.json` est généré localement. Il enregistre le hash MD5 de chaque fichier scanné avec ses chunks et embeddings. Lors des scans futurs, seuls les fichiers modifiés ou nouveaux interrogent l'API d'OpenRouter, rendant l'exécution instantanée (moins de 3 secondes pour les fichiers inchangés).

```
npx codetovecto scan
         ↓
  Scan des fichiers
  (filtre node_modules, dist, .env...)
         ↓
  Vérification du cache MD5
         ↓
  Lecture du contenu brut (si changé)
         ↓
  Parsing AST
  (Babel parser — JS, JSX, TS, TSX)
  (node-html-parser — HTML)
         ↓
  Chunking intelligent
  fonction par fonction,
  composant par composant
         ↓
  Génération des embeddings
  via OpenRouter (uniquement pour les nouveaux chunks)
         ↓
  Export JSON + LanceDB local
         ↓
  search("ta question")
  → vecteur → similarité cosinus
  → chunks les plus proches
  → contexte prêt pour ton LLM
```

---

## Fichiers supportés

| Extension | Type | Support |
|---|---|---|
| `.js` | JavaScript | ✅ |
| `.jsx` | React | ✅ |
| `.ts` | TypeScript | ✅ |
| `.tsx` | React + TypeScript | ✅ |
| `.html` | HTML | ✅ |
| `.php` | PHP | 🔜 prochaine version |
| `.py` | Python | 🔜 prochaine version |

---

## Fichiers ignorés

codetovecto ignore automatiquement ces dossiers et fichiers :

**Dossiers :** `node_modules`, `dist`, `.git`, `build`, `.next`

**Fichiers :** `package-lock.json`, `.env`, `.env.example`, `.gitignore`, ainsi que tous les fichiers correspondant aux motifs globaux `*.json`, `*.xml` et `*.txt`.

---

## Author

Octave Précieux Mahunan BAHOUN HOUTOUKPE

- GitHub: https://github.com/octavebahoun
- LinkedIn: https://www.linkedin.com/in/octave-précieux-mahunan-bahoun-houtoukpe-b9114b337/

## Support

For bugs, feature requests or collaboration:
https://github.com/octavebahoun/Code-to-vector/issues

---

## Licence

MIT
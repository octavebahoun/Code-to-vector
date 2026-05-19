# codetovecto

Outil CLI pour scanner un projet (frontend/backend/fullstack), analyser les fichiers via un LLM, et générer une sortie exploitable (JSON ou “Chroma JSON”).

## Objectif

- Scanner des dossiers configurés
- Extraire le contenu des fichiers pertinents
- Envoyer le contenu à un modèle (OpenRouter) pour obtenir une analyse
- Exporter un artefact (JSON) pour alimenter une future étape RAG / vector store

## Installation

Avec pnpm :

```bash
pnpm install
```

## Usage

1) Initialiser la config :

```bash
node bin/cli.js init
```

2) Lancer le scan :

```bash
node bin/cli.js run --frontend
# ou
node bin/cli.js run --backend
# ou
node bin/cli.js run --fullstack
```

## Configuration

- Le template est dans `templates/codetovecto.config.js`
- La config générée par init est dans `codetovecto.config.js`

Champs importants :
- `mode` : `frontend` | `backend` | `fullstack`
- `output` : `json` | `chroma`
- `frontend` / `backend` : chemins de dossiers à scanner

## Sorties

Actuellement, les sorties attendues sont :
- `codetovecto-output.json` : analyses “texte” par fichier
- `codetovecto-chroma.json` : format JSON de documents + metadata (ce n’est pas encore une vraie base vectorielle)

Remarque : “Chroma JSON” ici est un export de documents, pas des embeddings.

---

# Audit & propositions d’amélioration (priorisées)

## P0 — Sécurité (immédiat)

1) Ne jamais committer de secrets
- Ajouter un `.gitignore` (au minimum : `.env`, `node_modules`, outputs).
- Si une clé a été exposée : la révoquer/rotater immédiatement côté provider.

2) Réduire le risque d’exfiltration de code
- Mettre des exclusions par défaut : `node_modules`, `dist/build`, `.next`, `coverage`, `.git`, fichiers minifiés, etc.
- Ajouter une limite : taille max par fichier + nombre max de fichiers.
- Option “offline” (skip AI) pour juste produire l’inventaire.

3) Prévenir l’envoi involontaire de secrets au LLM
- Scanner le contenu avant envoi (patterns de clés/tokens/private keys) et soit refuser, soit masquer.

## P0 — Robustesse (bloquants fonctionnels)

1) Export de sortie fiable
- `src/output.js` doit exposer une fonction (`module.exports`) qui choisit `json` vs `chroma` selon `config.output` et écrit effectivement les fichiers.

2) Gestion d’erreurs réseau
- Dans `src/ai.js` : ajouter `try/catch`, `timeout`, et gestion des erreurs (429, 5xx).
- Stratégie recommandée : continuer fichier par fichier en loggant l’erreur, plutôt que stopper tout le run.

3) Exit codes corrects
- En cas d’erreur (clé manquante, config absente), retourner un code non-zéro (important pour CI / scripting).

## P1 — Qualité des résultats LLM (fiabilité)

Problème observé : certaines analyses peuvent retourner du texte incohérent/bruité (hallucinations, mélange de langues, contenu “meta”).

Améliorations :
- Encadrer strictement l’entrée (délimiteurs, instructions courtes, pas de “décris la page” pour un fichier backend).
- Forcer une sortie structurée JSON (schéma stable) et valider le JSON (sinon retry).
- Tronquer le contenu envoyé (ex : premiers N caractères + sections pertinentes) pour réduire le bruit.
- Ajouter un “type” plus précis (html/js/jsx/tsx) et adapter le prompt.

## P1 — Performance / coût

- Traitement séquentiel = lent : ajouter une concurrence contrôlée (ex : 2–5 fichiers en parallèle) + backoff sur rate limit.
- Mettre en cache (hash du fichier → réponse) pour éviter de repayer si le fichier n’a pas changé.
- Ajouter un mode “dry-run” : afficher combien de fichiers seront envoyés et une estimation.

## P1 — Portabilité & chemins

- Éviter les tests de chemins basés sur `"/src/"` (Windows). Utiliser une normalisation de chemins ou la config (front/back) plutôt que des heuristiques.

## P2 — “Vraie” vector database (alignement produit)

Aujourd’hui : analyses texte.

Pour “vectorial database” au sens strict :
- Ajouter une étape de chunking (découper en segments avec metadata : `file`, `startLine/endLine`, `type`).
- Générer des embeddings (provider au choix) sur les chunks.
- Exporter un format vecteur : `{id, embedding: [...], document, metadata}`.
- (Optionnel) intégrer directement un store (Chroma, Pinecone, pgvector, etc.) via un client.

## P2 — DX / Maintenance

- Ajouter un README “quickstart” + troubleshooting.
- Ajouter des tests de fumée (scanner/extractor/output) pour éviter les régressions.
- Ajouter un logger simple (niveau info/warn/error) et une option `--verbose`.

---

# Roadmap (suggestion)

- [ ] Sécuriser secrets + `.gitignore` + exclusions
- [ ] Stabiliser output (json/chroma) et exit codes
- [ ] Durcir `ai.js` (timeout, retry, erreurs par fichier)
- [ ] Sortie structurée JSON + validation
- [ ] Cache + concurrence contrôlée
- [ ] Chunking + embeddings + export vecteurs

---

# Troubleshooting

- “AI_API_KEY manquant” : vérifier le fichier `.env` et les variables d’environnement.
- “config introuvable” : lancer `init` et vérifier que `codetovecto.config.js` est à la racine du projet scanné.
- Résultats incohérents : réduire la taille envoyée, forcer un format JSON, ou changer de modèle.

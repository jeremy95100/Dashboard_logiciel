# Cellebrite Dashboard

Application React TypeScript pour l'analyse des données Cellebrite (contacts, appels, conversations).

## Description

Cette application remplace l'API Python FastAPI originale ([cellebrite2.py](../cellebrite2.py)) par une application web React moderne avec des dashboards interactifs. Elle traite les fichiers Excel exportés de Cellebrite et génère des analyses visuelles selon les mêmes règles métier que l'API Python.

## Fonctionnalités

### 1. Analyse des Contacts
- Import de fichiers Excel de contacts
- Nettoyage automatique des données (suppression des doublons, sources non désirées)
- Statistiques par plateforme (WhatsApp, Snapchat, Signal, etc.)
- Graphiques à barres colorés par plateforme
- Filtrage par nom et source
- Export Excel des résultats

### 2. Analyse des Appels
- Import de fichiers Excel de journaux d'appels
- Analyse globale par plateforme
- Analyse détaillée par source avec :
  - Top 15 contacts par nombre d'appels
  - Graphiques de durée totale des appels
  - Distinction appels émis/reçus
- Support multi-plateformes (Natif, WhatsApp, Snapchat, Signal, etc.)
- Export Excel des analyses

### 3. Analyse des Conversations
- Import de fichiers Excel de conversations
- Analyse par plateforme
- Top 15 contacts par nombre de messages
- Graphiques interactifs
- Export Excel des résultats

### 4. Sociogramme Interactif
- Visualisation des relations de communication
- Support appels ET messages
- Graphiques circulaires avec Plotly
- Codage couleur par type d'interaction :
  - **Appels** : bleu foncé (utilisateur), bleu clair (émis/reçus), rouge clair (émis), vert clair (reçus)
  - **Messages** : intensité de couleur proportionnelle au volume

## Règles Métier (identiques à cellebrite2.py)

### Nettoyage des données
- Suppression des entrées avec `(n)` dans la colonne `#` (doublons)
- Exclusion des sources : `Recents`, `InteractionC`, `KnowledgeC`, `Native Messages`, `Threads`
- Remplacement des sources vides par `Natif`

### Extraction des contacts
- **Snapchat** : extraction username + nom
- **WhatsApp** : extraction numéro de téléphone + nom
- **Signal** : extraction UUID ou numéro + nom
- **Générique** : extraction téléphone ou username + nom

### Agrégation
- Regroupement par identifiant unique (téléphone, username, UUID)
- Pour Natif : regroupement par les 8 derniers chiffres du numéro
- Déduplication intelligente avec préservation du format international

## Installation

```bash
cd cellebrite-dashboard
npm install
```

## Démarrage

```bash
npm start
```

L'application sera accessible à l'adresse : [http://localhost:3000](http://localhost:3000)

## Technologies

- **React 18** avec TypeScript
- **Chart.js** (react-chartjs-2) pour les graphiques à barres
- **Plotly.js** (react-plotly.js) pour les sociogrammes
- **XLSX** (SheetJS) pour la lecture/écriture Excel
- **CSS personnalisé** avec thème sombre (style identique à l'API Python)

## Structure du Projet

```
cellebrite-dashboard/
├── src/
│   ├── components/
│   │   ├── ContactDashboard.tsx       # Dashboard contacts
│   │   ├── CallDashboard.tsx          # Dashboard appels
│   │   ├── ConversationDashboard.tsx  # Dashboard conversations
│   │   └── SociogramDashboard.tsx     # Sociogrammes
│   ├── utils/
│   │   ├── ContactProcessor.ts        # Logique traitement contacts
│   │   ├── CallLogProcessor.ts        # Logique traitement appels
│   │   └── ConvLogProcessor.ts        # Logique traitement conversations
│   ├── App.tsx                        # Composant principal
│   ├── App.css                        # Styles globaux
│   └── index.tsx                      # Point d'entrée
├── package.json
└── README.md
```

## Différences avec l'API Python

| API Python (FastAPI) | React Dashboard |
|---------------------|-----------------|
| Serveur backend | Application frontend pure |
| Routes HTTP | Navigation avec état React |
| Génération d'images PNG | Graphiques interactifs en temps réel |
| Export vers fichiers locaux | Téléchargement direct dans le navigateur |
| HTML statique généré | Interface SPA dynamique |

## Utilisation

### 1. Contacts
1. Sélectionner un fichier Excel de contacts
2. Cliquer sur "Analyser les contacts"
3. Visualiser les statistiques et graphiques
4. (Optionnel) Appliquer des filtres par nom ou source
5. Télécharger les résultats en Excel

### 2. Appels
1. Sélectionner un fichier Excel d'appels
2. Option A : Analyser toutes les plateformes
3. Option B : Sélectionner une source spécifique et analyser en détail
4. Visualiser les graphiques du Top 15
5. Télécharger les tableaux Excel

### 3. Conversations
1. Sélectionner un fichier Excel de conversations
2. Analyser par plateforme ou par source
3. Visualiser le Top 15 des contacts
4. Télécharger les résultats

### 4. Sociogramme
1. Choisir le type : Appels ou Messages
2. Sélectionner le fichier correspondant
3. Choisir la source (WhatsApp, Snapchat, etc.)
4. Générer le sociogramme interactif
5. Survoler les nœuds pour voir les détails

## Thème et Style

Le design reprend exactement le thème sombre de l'API Python :
- Fond principal : `#2e2e2e`
- Cartes : `#3b3b3b`
- Sidebar : `#3b3b3b` avec dégradés sur les boutons
- Boutons : `#5a5a5a` avec hover `#6a6a6a`
- Texte : `#e0e0e0`

## Couleurs des Plateformes

Les couleurs sont identiques à l'API Python :

| Plateforme | Couleur |
|-----------|---------|
| Facebook | #3b5998 |
| Facebook Messenger | #0078FF |
| Instagram | #E42C947C / #C13584 |
| WhatsApp | #25D366 |
| Telegram | #0088cc |
| Signal | #3A6EA5 |
| Snapchat | #FFFC00 |
| Natif | #F8C63D |

## Support Navigateurs

- Chrome (recommandé)
- Firefox
- Safari
- Edge

## Scripts Disponibles

### `npm start`
Démarre l'application en mode développement sur [http://localhost:3000](http://localhost:3000)

### `npm run build`
Compile l'application pour la production dans le dossier `build`

### `npm test`
Lance les tests en mode interactif

## Auteur

Conversion de l'API Python FastAPI vers React TypeScript.

## Licence

MIT

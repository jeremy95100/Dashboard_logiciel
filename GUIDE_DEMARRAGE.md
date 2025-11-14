# Guide de Démarrage Rapide - Cellebrite Dashboard

## 🚀 Installation et Lancement

### 1. Installer les dépendances
```bash
cd cellebrite-dashboard
npm install
```

### 2. Lancer l'application
```bash
npm start
```

L'application s'ouvrira automatiquement dans votre navigateur à l'adresse : **http://localhost:3000**

## 📁 Format des fichiers Excel

L'application attend des fichiers Excel exportés de Cellebrite avec les colonnes suivantes :

### Fichier Contacts
- `#` : Numéro d'entrée
- `Name` : Nom du contact
- `Entries` : Entrées du contact
- `Source` : Plateforme (WhatsApp, Snapchat, etc.)
- `Account` : Compte (optionnel)
- `Interaction Statuses` : Statuts (optionnel)
- `Deleted` : Supprimé (optionnel)

### Fichier Appels
- `#` : Numéro d'entrée
- `Parties` : Participants de l'appel
- `Date` : Date de l'appel
- `Time` : Heure de l'appel
- `Duration` : Durée (format HH:MM:SS)
- `Direction` : Incoming ou Outgoing
- `Source` : Plateforme
- `Video call` : Oui/Non (optionnel)
- `Deleted` : Oui/Non (optionnel)

### Fichier Conversations
- `#` : Numéro d'entrée
- `Source` : Plateforme
- `Participants` : Participants de la conversation
- `Timestamp: Time` : Horodatage
- `Timestamp: Date` : Date
- `From` : Expéditeur
- `To` : Destinataire
- `Body` : Corps du message (optionnel)
- `Attachment #1` : Pièce jointe (optionnel)

## 🎯 Utilisation par Section

### 📇 1. Analyse des Contacts

**Objectif** : Obtenir des statistiques sur les contacts par plateforme

**Étapes** :
1. Cliquez sur "Analyse des Contacts" dans la sidebar
2. Cliquez sur "Choisir un fichier" et sélectionnez votre fichier Excel de contacts
3. Cliquez sur "Analyser les contacts"
4. Visualisez les graphiques et tableaux générés

**Filtres disponibles** :
- Filtrer par nom (recherche dans la colonne "Entries")
- Filtrer par source (WhatsApp, Snapchat, etc.)

**Exports** :
- "Télécharger contacts filtrés" : Export Excel des contacts selon les filtres appliqués
- "Télécharger statistiques" : Export Excel du tableau de statistiques par plateforme

---

### 📞 2. Analyse des Appels

**Objectif** : Analyser les journaux d'appels par plateforme et par contact

**Étapes** :

**Option A - Analyse globale** :
1. Sélectionnez le fichier Excel d'appels
2. Cliquez sur "Analyser les plateformes"
3. Visualisez le graphique des appels par plateforme

**Option B - Analyse détaillée par source** :
1. Sélectionnez le fichier Excel d'appels
2. Choisissez une source dans le menu déroulant (Natif, WhatsApp, Snapchat, etc.)
3. Cliquez sur "Analyser les appels par source"
4. Visualisez :
   - Top 15 des contacts par nombre d'appels
   - Top 15 des contacts par durée totale
   - Tableau détaillé avec appels émis/reçus

**Export** :
- "Télécharger le tableau" : Export Excel du Top 15 des contacts

---

### 💬 3. Analyse des Conversations

**Objectif** : Analyser les messages par plateforme et par contact

**Étapes** :

**Option A - Analyse globale** :
1. Sélectionnez le fichier Excel de conversations
2. Cliquez sur "Analyser les plateformes"
3. Visualisez le graphique des messages par plateforme

**Option B - Analyse détaillée par source** :
1. Sélectionnez le fichier Excel de conversations
2. Choisissez une source dans le menu déroulant
3. Cliquez sur "Analyser les conversations par source"
4. Visualisez :
   - Top 15 des contacts par nombre de messages
   - Tableau détaillé

**Export** :
- "Télécharger le tableau" : Export Excel du Top 15 des contacts

---

### 🕸️ 4. Sociogramme Interactif

**Objectif** : Visualiser graphiquement les relations de communication

**Étapes** :
1. Choisissez le type de données : "Appels" ou "Messages"
2. Sélectionnez le fichier correspondant
3. Choisissez une source (WhatsApp, Snapchat, etc.)
4. Cliquez sur "Générer le sociogramme"
5. Interagissez avec le graphique :
   - Survolez les nœuds pour voir les détails
   - Zoomez et déplacez le graphique

**Légende Appels** :
- 🔵 Bleu foncé : Utilisateur du smartphone
- 🔵 Bleu clair : Appels émis ET reçus
- 🔴 Rouge clair : Appels uniquement émis
- 🟢 Vert clair : Appels uniquement reçus
- ⚪ Gris clair : Aucun appel

**Légende Messages** :
- 🔵 Bleu foncé : Contact central
- 🔵 Bleu (intensité variable) : Plus la couleur est intense, plus il y a de messages

---

## ⚙️ Sources Supportées

- **Natif** : Appels et messages natifs du téléphone
- **WhatsApp** : WhatsApp et WhatsApp Business
- **Snapchat** : Snapchat
- **Signal** : Signal
- **Telegram** : Telegram
- **Facebook Messenger** : Facebook Messenger
- **Instagram** : Instagram
- **Twitter** : Twitter
- **LinkedIn** : LinkedIn
- **TikTok** : TikTok

---

## 🐛 Résolution de Problèmes

### L'application ne démarre pas
```bash
# Supprimez node_modules et réinstallez
rm -rf node_modules package-lock.json
npm install
npm start
```

### Erreur "File format not supported"
- Vérifiez que votre fichier est bien au format `.xlsx` ou `.xls`
- Assurez-vous que la première ligne contient les en-têtes de colonnes
- Les données doivent commencer à partir de la ligne 2 (ligne 1 = en-têtes)

### Aucun résultat après l'analyse
- Vérifiez que le fichier contient bien des données
- Vérifiez que les colonnes nécessaires sont présentes
- Vérifiez que la source sélectionnée existe dans vos données

### Graphique vide
- Assurez-vous d'avoir d'abord analysé le fichier
- Vérifiez qu'il y a au moins 1 contact dans les résultats

---

## 💡 Conseils d'Utilisation

1. **Préparez vos fichiers** : Exportez vos données de Cellebrite au format Excel avant de commencer
2. **Analysez d'abord globalement** : Commencez par l'analyse par plateforme pour avoir une vue d'ensemble
3. **Filtrez ensuite par source** : Sélectionnez une source spécifique pour une analyse détaillée
4. **Utilisez les sociogrammes** : Ils permettent de visualiser rapidement les relations importantes
5. **Exportez vos résultats** : Téléchargez les tableaux Excel pour les conserver ou les partager

---

## 📧 Support

Pour toute question ou problème, référez-vous au fichier [README.md](./README.md) pour plus de détails techniques.

---

## 🎨 Personnalisation

Les couleurs des plateformes peuvent être modifiées dans les fichiers :
- `src/utils/ContactProcessor.ts`
- `src/utils/CallLogProcessor.ts`
- `src/utils/ConvLogProcessor.ts`

Recherchez l'objet `COLOR_MAP` et modifiez les valeurs hexadécimales.

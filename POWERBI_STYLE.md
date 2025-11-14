# 📊 Cellebrite Dashboard - Power BI Style

## 🎨 Vue d'ensemble

Le dashboard a été entièrement transformé en une **plateforme interactive professionnelle de style Power BI** avec :

✨ **Thème clair moderne**
📊 **Graphiques interactifs Recharts**
📈 **KPI Cards avec métriques clés**
🎯 **Tooltips riches et informatifs**
🔄 **Animations fluides**
📱 **Design responsive**

---

## 🌟 Nouvelles Fonctionnalités

### 1. Top Navigation Bar (Barre supérieure)

**Style Power BI authentique :**
- Fond **bleu Microsoft** (#118DFF)
- Logo/Branding à gauche
- Actions utilisateur à droite (Actualiser, Paramètres, Profil)
- **Fixed position** : Reste visible en scrollant

### 2. KPI Cards (Cartes Métriques)

**4 KPIs principaux affichés :**

| KPI | Description | Icône |
|-----|-------------|-------|
| **Total Contacts** | Nombre total de contacts analysés | 👥 |
| **Plateformes** | Nombre de sources détectées | 🌐 |
| **Top Plateforme** | Plateforme avec le plus de contacts | ⭐ |
| **Moyenne/Plateforme** | Contacts moyens par plateforme | 📊 |

**Effets visuels :**
- Hover : Élévation + barre supérieure bleue
- Icône en arrière-plan (opacity 0.1)
- Animations au chargement (fadeIn)

### 3. Graphiques Interactifs (Recharts)

#### Bar Chart (Graphique à Barres)
- **Axes personnalisés** : Labels inclinés pour lisibilité
- **Couleurs** : Palette spécifique par plateforme
- **Tooltip riche** : Affiche détails au hover
- **Grid** : Grille pointillée subtile
- **Coins arrondis** : Barres modernes

#### Pie Chart (Graphique Circulaire)
- **Labels directs** : Nom + Valeur sur chaque part
- **Couleurs harmonieuses** : Cohérentes avec le bar chart
- **Animation d'entrée** : Rotation fluide

### 4. Filtres Avancés

**Section dédiée avec :**
- Grid responsive (auto-fit)
- Inputs stylisés Power BI
- Boutons d'action en header
- Export Stats / Export Filtrés

### 5. Tableau de Données

**Features :**
- Header avec **gradient subtil**
- Bordure inférieure bleue (2px)
- Colonnes **Plateforme | Volume | Pourcentage**
- Tri dynamique (boutons dans header)
- Hover effect sur les lignes

---

## 🎨 Palette de Couleurs Power BI

### Couleurs Principales

```css
--color-primary: #118DFF      /* Bleu Microsoft */
--color-primary-dark: #0F6CBD  /* Bleu foncé */
--color-primary-light: #E6F3FF /* Bleu très clair */
--color-accent: #00BCF2        /* Cyan accent */
--color-success: #13A10E       /* Vert succès */
--color-warning: #FFB900       /* Orange avertissement */
--color-error: #E81123         /* Rouge erreur */
```

### Backgrounds (Thème Clair)

```css
--bg-primary: #FFFFFF      /* Blanc pur */
--bg-secondary: #F3F2F1    /* Gris très clair */
--bg-tertiary: #FAF9F8     /* Gris ultra clair */
--bg-sidebar: #F8F8F8      /* Gris sidebar */
--bg-hover: #F3F2F1        /* Hover state */
```

### Texte

```css
--text-primary: #201F1E    /* Noir principal */
--text-secondary: #605E5C  /* Gris moyen */
--text-tertiary: #8A8886   /* Gris clair */
--text-disabled: #C8C6C4   /* Gris désactivé */
```

---

## 📊 Composants Recharts

### Installation

```bash
npm install recharts
```

### Utilisation - Bar Chart

```tsx
<ResponsiveContainer width="100%" height={400}>
  <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
    <CartesianGrid strokeDasharray="3 3" stroke="#E1E1E1" />
    <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
    <YAxis />
    <Tooltip content={<CustomTooltip />} />
    <Bar dataKey="contacts" radius={[8, 8, 0, 0]}>
      {chartData.map((entry, index) => (
        <Cell key={`cell-${index}`} fill={entry.fill} />
      ))}
    </Bar>
  </BarChart>
</ResponsiveContainer>
```

### Custom Tooltip

```tsx
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: 'white',
        border: '1px solid #E1E1E1',
        borderRadius: '8px',
        padding: '12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
      }}>
        <p style={{ fontWeight: 600 }}>{payload[0].payload.name}</p>
        <p>Contacts: <strong>{payload[0].value}</strong></p>
      </div>
    );
  }
  return null;
};
```

---

## 🎯 Structure des KPI Cards

```tsx
<div className="kpi-card">
  <div className="kpi-icon">👥</div>
  <div className="kpi-label">Total Contacts</div>
  <div className="kpi-value">{totalContacts.toLocaleString()}</div>
  <div className="kpi-change positive">+100% Analysés</div>
</div>
```

**CSS Classes :**
- `.kpi-card` : Conteneur principal
- `.kpi-icon` : Icône en arrière-plan (absolute)
- `.kpi-label` : Label uppercase
- `.kpi-value` : Valeur principale (32px, bold)
- `.kpi-change` : Indicateur de changement (+ classes `.positive`/`.negative`)

---

## 📐 Layout Structure

```
┌─────────────────────────────────────────┐
│ Top Navbar (Fixed - 48px height)       │
│ [Logo] ············· [Actions]         │
├────────┬────────────────────────────────┤
│        │  Content Area                  │
│ Side   │  ┌───────────────────────┐     │
│ bar    │  │ Page Header           │     │
│ (220px)│  ├───────────────────────┤     │
│        │  │ KPI Grid (4 cards)    │     │
│ [Nav]  │  ├───────────────────────┤     │
│ [Nav]  │  │ Filters Card          │     │
│ [Nav]  │  ├───────────────────────┤     │
│ [Nav]  │  │ Bar Chart Card        │     │
│        │  ├───────────────────────┤     │
│        │  │ Pie Chart Card        │     │
│        │  ├───────────────────────┤     │
│        │  │ Data Table Card       │     │
│        │  └───────────────────────┘     │
└────────┴────────────────────────────────┘
```

---

## 🎬 Animations & Interactions

### Hover Effects

| Élément | Effet |
|---------|-------|
| **KPI Card** | Transform translateY(-2px) + Shadow |
| **Card** | Shadow augmentée |
| **Button** | Background change + Translation |
| **Table Row** | Background gris clair |
| **Sidebar Item** | Barre bleue latérale + Background |

### Loading States

```css
.loading {
  background: #E6F7FF;
  border-left: 4px solid var(--color-accent);
  color: #006699;
}

.loading::before {
  content: '⏳';
  animation: pulse 1.5s ease-in-out infinite;
}
```

---

## 📱 Responsive Breakpoints

### Desktop (> 1024px)
- Sidebar complète (220px)
- KPI Grid : 4 colonnes
- Tous les graphiques visibles

### Tablet (768px - 1024px)
- Sidebar réduite (60px, icônes seulement)
- KPI Grid : 2 colonnes
- Graphiques responsive

### Mobile (< 768px)
- Sidebar cachée (burger menu recommandé)
- KPI Grid : 2 colonnes
- Graphiques en scroll horizontal

---

## 🔧 Configuration

### Changer les couleurs primaires

Dans `App.powerbi.css`, modifiez :

```css
:root {
  --color-primary: #VOTRE_COULEUR;
  --color-primary-dark: #VOTRE_COULEUR_FONCEE;
  --color-primary-light: #VOTRE_COULEUR_CLAIRE;
}
```

### Ajouter un nouveau KPI

```tsx
<div className="kpi-card">
  <div className="kpi-icon">🆕</div>
  <div className="kpi-label">Nouveau KPI</div>
  <div className="kpi-value">{votre_valeur}</div>
  <div className="kpi-change positive">Votre texte</div>
</div>
```

---

## ⚡ Performance

### Optimisations Recharts

- **ResponsiveContainer** : Auto-resize des graphiques
- **Memoization** : Données chartData calculées une fois
- **Custom Tooltip** : Rendu conditionnel (active check)

### Optimisations CSS

- **Variables CSS** : Changement de thème instantané
- **Transform** : Animations GPU-accelerated
- **Transition** : Propriétés spécifiques (pas all)

---

## 📊 Types de Graphiques Disponibles

### Avec Recharts

- ✅ **BarChart** : Graphiques à barres
- ✅ **PieChart** : Graphiques circulaires
- ✅ **LineChart** : Graphiques linéaires
- ✅ **AreaChart** : Graphiques en aire
- ✅ **ScatterChart** : Nuages de points
- ✅ **RadarChart** : Graphiques radar
- ✅ **ComposedChart** : Graphiques composés

### Exemples d'utilisation

#### Line Chart
```tsx
<LineChart data={data}>
  <Line type="monotone" dataKey="value" stroke="#118DFF" strokeWidth={2} />
</LineChart>
```

#### Area Chart
```tsx
<AreaChart data={data}>
  <Area type="monotone" dataKey="value" fill="#E6F3FF" stroke="#118DFF" />
</AreaChart>
```

---

## 🎨 Design Tokens

### Shadows (Ombres Power BI)

```css
--shadow-sm: 0 1.6px 3.6px rgba(0, 0, 0, 0.13)
--shadow-md: 0 3.2px 7.2px rgba(0, 0, 0, 0.13)
--shadow-lg: 0 6.4px 14.4px rgba(0, 0, 0, 0.13)
--shadow-xl: 0 25.6px 57.6px rgba(0, 0, 0, 0.22)
```

### Border Radius

```css
--radius-sm: 2px  /* Petits éléments */
--radius-md: 4px  /* Boutons, inputs */
--radius-lg: 8px  /* Cards */
```

### Spacing

```css
--spacing-xs: 4px
--spacing-sm: 8px
--spacing-md: 16px
--spacing-lg: 24px
--spacing-xl: 32px
```

---

## 🚀 Fonctionnalités Avancées

### Export PNG des graphiques

```tsx
import { toPng } from 'html-to-image';

const exportChart = () => {
  const element = document.getElementById('chart-container');
  if (element) {
    toPng(element).then((dataUrl) => {
      const link = document.createElement('a');
      link.download = 'chart.png';
      link.href = dataUrl;
      link.click();
    });
  }
};
```

### Filtres interactifs sur les graphiques

```tsx
const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);

<Bar onClick={(data) => setSelectedPlatform(data.name)} />
```

---

## 📚 Ressources

- [Recharts Documentation](https://recharts.org/)
- [Power BI Design Guidelines](https://docs.microsoft.com/en-us/power-bi/create-reports/desktop-visual-guidelines)
- [Microsoft Fluent UI](https://developer.microsoft.com/en-us/fluentui)

---

## 🎯 Comparaison Avant/Après

| Aspect | Ancien Design | Power BI Style |
|--------|--------------|----------------|
| **Thème** | Sombre | Clair & Professionnel |
| **Graphiques** | Chart.js statiques | Recharts interactifs |
| **KPIs** | Aucun | 4 KPIs avec icônes |
| **Layout** | Sidebar seule | Top Nav + Sidebar |
| **Tooltips** | Basiques | Riches & Custom |
| **Couleurs** | Dark mode | Microsoft Blue |
| **Cards** | Simples | Headers + Actions |
| **Tables** | Basiques | Tri + Pourcentages |

---

## 🎉 Résultat

Votre dashboard ressemble maintenant à :
- ✅ **Power BI Desktop**
- ✅ **Tableau Public**
- ✅ **Looker Studio**
- ✅ **Microsoft Azure Portal**

**C'est professionnel, interactif, et prêt pour la production !** 🚀

---

**Testez maintenant :** `npm start` 🎊

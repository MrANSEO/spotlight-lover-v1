# 🎨 SPOTLIGHT LOVER - DESIGN SYSTEM & STYLE GUIDE

**Date** : 12 Mars 2026  
**Preview URL** : https://5173-ilfyqvgmwb2ey9nt2hwx1-c81df28e.sandbox.novita.ai  
**Statut** : ✅ Frontend actif et accessible  

---

## ⚠️ IMPORTANT : CE N'EST PAS UNE PAGE BLANCHE !

Le frontend utilise **TailwindCSS** avec un design **moderne, coloré et mobile-first**. Voici le détail complet :

---

## 🎨 PALETTE DE COULEURS

### Couleurs Principales
```css
/* Violet/Purple - Couleur signature */
Primary: #7C3AED (purple-600)
Primary Hover: #6D28D9 (purple-700)
Primary Light: #DDD6FE (purple-100)

/* Rose/Pink - Accent énergique */
Accent: #EC4899 (pink-600)
Accent Hover: #DB2777 (pink-700)

/* Gradient Hero */
Gradient: linear-gradient(to right, #7C3AED, #EC4899)
```

### Couleurs Sémantiques
```css
/* Success - Vert */
Success: #10B981 (green-600)
Success Light: #D1FAE5 (green-100)

/* Warning - Jaune/Orange */
Warning: #F59E0B (yellow-600)
Warning Light: #FEF3C7 (yellow-100)

/* Error - Rouge */
Error: #EF4444 (red-600)
Error Light: #FEE2E2 (red-100)

/* Neutral - Gris */
Text Primary: #1F2937 (gray-800)
Text Secondary: #6B7280 (gray-600)
Background: #F9FAFB (gray-50)
Card Background: #FFFFFF (white)
Border: #E5E7EB (gray-200)
```

---

## 📐 TYPOGRAPHIE

### Police
- **Font Family** : System fonts (sans-serif) pour performance optimale
  ```css
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  ```

### Hiérarchie des Titres
```css
H1 (Hero): text-5xl md:text-6xl (48px → 60px), font-bold
H1 (Pages): text-4xl (36px), font-bold
H2: text-2xl md:text-3xl (24px → 30px), font-semibold
H3: text-xl (20px), font-bold
Body: text-base (16px), font-normal
Small: text-sm (14px)
Tiny: text-xs (12px)
```

---

## 🧱 COMPOSANTS VISUELS

### 1. Buttons (Boutons)
```html
<!-- Primary Button -->
<button class="px-8 py-4 bg-purple-600 text-white rounded-lg font-bold text-lg hover:bg-purple-700 transition shadow-lg">
  Devenir Candidat (500 FCFA)
</button>

<!-- Secondary Button -->
<button class="px-8 py-4 bg-purple-800 text-white rounded-lg font-bold text-lg hover:bg-purple-900 transition">
  Voir les Talents
</button>

<!-- Outline Button -->
<button class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100">
  Annuler
</button>

<!-- Success Button -->
<button class="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700">
  ✅ Approuver
</button>

<!-- Danger Button -->
<button class="px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700">
  ❌ Rejeter
</button>
```

### 2. Cards (Cartes)
```html
<!-- Candidate Card -->
<div class="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-2xl transition">
  <div class="aspect-video bg-gray-200">
    <!-- Thumbnail -->
  </div>
  <div class="p-4">
    <h3 class="text-xl font-bold">Nom du Candidat</h3>
    <p class="text-sm text-gray-600">Biographie...</p>
  </div>
</div>

<!-- Stats Card -->
<div class="bg-white p-8 rounded-lg shadow-lg">
  <div class="text-5xl font-bold text-purple-600 mb-2">1,000+</div>
  <p class="text-gray-600 text-lg">Candidats inscrits</p>
</div>

<!-- Feature Card -->
<div class="text-center p-8 bg-purple-50 rounded-lg shadow-lg">
  <div class="text-6xl mb-4">📹</div>
  <h3 class="text-2xl font-bold mb-4 text-purple-600">1. Inscrivez-vous</h3>
  <p class="text-gray-700">Description...</p>
</div>
```

### 3. Badges (Statuts)
```html
<!-- Status Badges -->
<span class="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
  ACTIVE
</span>

<span class="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">
  PENDING
</span>

<span class="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
  REJECTED
</span>

<!-- Role Badges -->
<span class="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
  ADMIN
</span>

<span class="px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">
  CANDIDATE
</span>
```

### 4. Forms (Formulaires)
```html
<!-- Input Field -->
<div class="mb-6">
  <label class="block text-sm font-semibold mb-2">
    Nom de scène <span class="text-red-500">*</span>
  </label>
  <input
    type="text"
    placeholder="Votre nom d'artiste"
    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
  />
</div>

<!-- Textarea -->
<textarea
  placeholder="Parlez-nous de vous..."
  rows="4"
  class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
></textarea>

<!-- File Upload -->
<input
  type="file"
  accept="video/mp4,video/webm,video/quicktime"
  class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
/>
```

---

## 📱 PAGES DESIGN DÉTAILLÉ

### **1. HomePage (Page d'accueil)**

**Hero Section** :
- Gradient violet → rose en arrière-plan
- Titre géant blanc (5xl → 6xl)
- 2 CTA buttons : "Devenir Candidat" (blanc bg) + "Voir les Talents" (purple-800)
- Emojis : 🎬

**Features Section** :
- 3 cartes en grille (md:grid-cols-3)
- Background purple-50
- Emojis géants (6xl) : 📹, ❤️, 🏆
- Titres violet (purple-600)

**Stats Section** :
- Background gris (gray-100)
- 4 cartes blanches avec chiffres géants violet
- Ombres portées (shadow-lg)

**CTA Final** :
- Gradient violet → rose
- Bouton blanc massif

### **2. GalleryPage (Galerie)**

**Layout** :
- Grille responsive : 2 cols mobile, 3 cols tablet, 4 cols desktop
- Cards avec aspect-ratio 9:16 (format vertical vidéo)
- Hover : shadow-2xl + overlay play button
- Modal plein écran pour lecture vidéo

**Design** :
- Thumbnail en background
- Overlay noir semi-transparent au hover
- Play button ▶️ centré (text-5xl)
- Stats en bas : ❤️ votes + FCFA en purple-600

### **3. VideoFeedPage (TikTok-style)**

**Layout** :
- **Scroll vertical** avec snap (snap-y snap-mandatory)
- **Plein écran** (h-screen)
- Vidéo en object-contain
- Background noir

**UI Overlay** :
- **Bottom** : Gradient noir → transparent
  - Nom candidat (text-2xl font-bold white)
  - Bio (text-sm text-gray-300)
  - Stats : ❤️ votes + FCFA jaune

- **Right Side** : Action buttons verticaux
  - Button Voter : bg-purple-600 rounded-full p-4 (text-3xl ❤️)
  - Button Commentaires : bg-gray-800 bg-opacity-70
  - Button Partager : bg-gray-800 bg-opacity-70

- **Top** : Progress bars (dots)
  - Blanc pour vidéo actuelle
  - Gris pour autres

**Vote Modal** :
- Card blanc centré avec rounded-lg
- Prix en gros (3xl font-bold purple-600) : "100 FCFA"
- 2 boutons paiement :
  - MeSomb : gradient yellow-500 → orange-500 (📱 emoji)
  - Stripe : bg-blue-600 (💳 emoji)

### **4. BecomeCandidatePage**

**Top Banner** :
- Background purple-50 avec border purple-200
- Liste conditions avec checkmarks verts (✓)
- Prix en gras : **500 FCFA**

**Form** :
- Background blanc avec shadow-lg
- Champs avec labels bold + asterisque rouge pour required
- File input stylé
- Success feedback vert si fichier sélectionné
- Submit button pleine largeur purple-600

**Payment Step** :
- Card jaune (yellow-50) avec border yellow-200
- Emoji 💳 géant (text-6xl)
- Spinner animé pendant vérification

**Success Step** :
- Card verte (green-50) avec border green-200
- Emoji 🎉 géant
- Titre vert (text-green-700)

### **5. AdminDashboard**

**Stats Cards** :
- 3 cartes blanches en grille
- Chiffres géants colorés :
  - Users : purple-600
  - Candidats : green-600
  - Revenus : yellow-600

**Actions Grid** :
- 4 boutons colorés (2x2 grid)
- Emojis : 👥, 🎬, ❤️, 📊
- Hover : background plus foncé

### **6. AdminCandidatesPage**

**Filter Buttons** :
- Pills avec rounded-lg
- Active : bg-purple-600 text-white
- Inactive : bg-gray-200

**Candidates Grid** :
- 3 colonnes (lg:grid-cols-3)
- Thumbnail cliquable avec hover overlay
- Badge statut coloré
- Actions buttons :
  - Approuver : green-600
  - Rejeter : red-600
  - Supprimer : border red-600 (outline)

### **7. Layouts (Navigation)**

**PublicLayout Header** :
- Background blanc avec shadow-sm
- Logo violet avec emoji 🎬
- Navigation desktop avec hover purple-600
- Boutons Login/Register violet

**PrivateLayout Header** :
- Navigation étendue : 📱 Feed, 🎥 Vidéos, 🏆 Classement, 👤 Profil
- Dropdown admin (🛡️) au hover
- Logout button rouge
- Mobile : Fixed bottom nav avec emojis

**Footer** :
- Background gray-800 text blanc
- Copyright + liens hover purple-400

---

## 🎭 ANIMATIONS & INTERACTIONS

### Transitions
```css
/* Tous les boutons */
transition: all 0.3s ease

/* Hover effects */
hover:bg-purple-700
hover:shadow-2xl
hover:text-purple-600

/* Loading spinner */
animate-spin (Tailwind built-in)
```

### Hover States
- **Cards** : shadow-lg → shadow-2xl
- **Buttons** : bg-purple-600 → bg-purple-700
- **Links** : text-gray-700 → text-purple-600

### Mobile-First
- Tous les layouts sont responsive
- Breakpoints Tailwind : `md:` (768px), `lg:` (1024px)
- Bottom navigation fixe sur mobile
- Grilles adaptatives : 1 col → 2 cols → 3 cols

---

## 📐 SPACING & LAYOUT

### Container
```css
.container {
  max-width: 1280px; /* mx-auto */
  padding: 1rem; /* px-4 */
}
```

### Common Spacings
```css
Sections: py-12 md:py-16 (48px → 64px)
Cards padding: p-4 à p-8 (16px → 32px)
Buttons: px-4 py-2 à px-8 py-4
Margins between sections: mb-8 à mb-12
```

---

## 🌈 EXEMPLES VISUELS (Code Snippets)

### Hero Gradient
```html
<section class="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-20">
  <div class="container mx-auto px-4 text-center">
    <h1 class="text-5xl md:text-6xl font-bold mb-6">
      🎬 Bienvenue sur Spotlight Lover
    </h1>
  </div>
</section>
```

### Candidate Card with Hover
```html
<div class="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-2xl transition cursor-pointer">
  <div class="aspect-video bg-gray-200 relative">
    <img src="thumbnail.jpg" class="w-full h-full object-cover" />
    <!-- Hover overlay -->
    <div class="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center opacity-0 hover:opacity-100 transition">
      <span class="text-white text-5xl">▶️</span>
    </div>
  </div>
  <div class="p-4">
    <h3 class="font-bold text-lg">Nom Candidat</h3>
    <div class="flex items-center justify-between mt-2 text-sm">
      <span>❤️ 150 votes</span>
      <span class="font-semibold text-purple-600">15,000 FCFA</span>
    </div>
  </div>
</div>
```

---

## 📊 COMPARAISON AVEC D'AUTRES STYLES

| Style | Notre Choix | Alternative 1 | Alternative 2 |
|-------|-------------|---------------|---------------|
| **Palette** | ✅ Violet/Rose vibrant | Bleu corporate | Orange/Vert africain |
| **Look** | ✅ Moderne TikTok-like | Business formel | Traditionnel artisanal |
| **Typography** | ✅ Bold & Large | Serif classique | Handwritten |
| **Emojis** | ✅ Oui (énergique) | Non (sobre) | Oui (culturels) |
| **Animations** | ✅ Douces & modernes | Aucune | Exagérées |

---

## ✅ POINTS FORTS DU DESIGN

1. **Mobile-First** : 100% responsive, navigation bottom sur mobile
2. **Moderne** : Inspiré TikTok, Instagram, plateformes modernes
3. **Coloré** : Palette vibrante qui attire l'œil (violet + rose)
4. **Clair** : Hiérarchie visuelle forte, cartes bien espacées
5. **Accessible** : Contrastes suffisants, textes lisibles
6. **Rapide** : TailwindCSS via CDN, pas de CSS custom lourd
7. **Émotionnel** : Emojis partout pour exprimer l'énergie africaine

---

## 🎨 OPTIONS DE PERSONNALISATION DISPONIBLES

Si le design actuel ne vous convient pas, voici ce qu'on peut changer **facilement** :

### 1. Changer la Palette de Couleurs
```javascript
// Dans tailwind.config.js (si on passe au build)
colors: {
  primary: '#FF6B35',  // Orange vif
  secondary: '#004E89', // Bleu marine
  accent: '#F7931E',   // Jaune africain
}
```

### 2. Changer le Style
- **Option A** : Style "Afro-Heritage" (motifs tribaux, couleurs terre)
- **Option B** : Style "Corporate Clean" (bleu/gris, minimaliste)
- **Option C** : Style "Neon Nightclub" (noir + néons colorés)

### 3. Ajouter des Images de Background
- Patterns africains
- Photos de candidats en arrière-plan (overlay)
- Textures (bois, tissu)

---

## 🚀 PREVIEW EN DIRECT

**URL publique** : https://5173-ilfyqvgmwb2ey9nt2hwx1-c81df28e.sandbox.novita.ai

**Pages à tester** :
1. **/** - Homepage avec Hero gradient
2. **/about** - Page À propos
3. **/gallery** - Galerie candidats
4. **/become-candidate** - Formulaire inscription
5. **/login** - Page connexion
6. **/register** - Page inscription

*(Note : Les pages protégées nécessitent login - créez un compte pour voir le reste)*

---

## 📞 FEEDBACK & MODIFICATIONS

**Dites-moi si vous voulez** :
- ✏️ Changer la palette de couleurs
- 🎨 Changer le style général (plus sobre, plus flashy, etc.)
- 🖼️ Ajouter des images/patterns de background
- 📱 Modifier la navigation
- ✨ Ajouter plus d'animations
- 🌍 Adapter pour un public spécifique

**Je peux modifier le design en quelques minutes !**

---

## 🎯 RÉSUMÉ

**Style choisi** : **"Afro-Modern Vibrant"**  
**Couleurs** : Violet (#7C3AED) + Rose (#EC4899) + Emojis  
**Framework** : TailwindCSS (responsive automatique)  
**Inspiration** : TikTok, Instagram, plateformes de talents modernes  
**Public cible** : Jeunes africains francophones (18-35 ans)  

**Ce n'est PAS une page blanche** - c'est un design moderne et coloré prêt à l'emploi ! 🎨✨

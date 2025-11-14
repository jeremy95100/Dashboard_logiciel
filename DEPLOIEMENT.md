# Guide de Déploiement - Cellebrite Dashboard

## 🚀 Options de Déploiement

L'application React peut être déployée de plusieurs façons, gratuitement ou à moindre coût.

---

## Option 1 : Netlify (Recommandé - Gratuit)

### Avantages
- ✅ Gratuit pour projets open source
- ✅ Déploiement automatique via Git
- ✅ HTTPS gratuit
- ✅ CDN mondial
- ✅ Interface simple

### Étapes

#### A. Via Interface Web (Plus Simple)

1. **Préparer le build**
   ```bash
   cd cellebrite-dashboard
   npm run build
   ```

2. **Créer un compte Netlify**
   - Allez sur [https://www.netlify.com](https://www.netlify.com)
   - Créez un compte gratuit

3. **Déployer**
   - Cliquez sur "Add new site" → "Deploy manually"
   - Glissez-déposez le dossier `build/` généré
   - Attendez quelques secondes
   - Votre site est en ligne ! 🎉

#### B. Via GitHub (Déploiement Continu)

1. **Pousser sur GitHub**
   ```bash
   cd cellebrite-dashboard
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/VOTRE-USERNAME/cellebrite-dashboard.git
   git push -u origin main
   ```

2. **Connecter à Netlify**
   - Sur Netlify, cliquez "Add new site" → "Import an existing project"
   - Choisissez GitHub
   - Sélectionnez votre repository
   - Configuration :
     - **Build command** : `npm run build`
     - **Publish directory** : `build`
   - Cliquez "Deploy site"

3. **Configuration automatique**
   - Chaque push sur GitHub redéploiera automatiquement
   - Obtenez un domaine gratuit : `votre-app.netlify.app`

---

## Option 2 : Vercel (Gratuit)

### Avantages
- ✅ Gratuit
- ✅ Très rapide
- ✅ Optimisé pour React
- ✅ Déploiement Git automatique

### Étapes

1. **Installer Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Déployer**
   ```bash
   cd cellebrite-dashboard
   vercel
   ```

3. **Suivre les instructions**
   - Connectez-vous avec GitHub/GitLab
   - Confirmez le projet
   - Vercel détecte automatiquement React
   - Le site est déployé en quelques secondes

4. **Domaine personnalisé** (optionnel)
   ```bash
   vercel --prod
   ```

---

## Option 3 : GitHub Pages (Gratuit)

### Avantages
- ✅ Totalement gratuit
- ✅ Hébergé sur GitHub
- ✅ Simple si déjà sur GitHub

### Étapes

1. **Installer gh-pages**
   ```bash
   cd cellebrite-dashboard
   npm install --save-dev gh-pages
   ```

2. **Configurer package.json**
   Ajoutez ces lignes dans `package.json` :
   ```json
   {
     "homepage": "https://VOTRE-USERNAME.github.io/cellebrite-dashboard",
     "scripts": {
       "predeploy": "npm run build",
       "deploy": "gh-pages -d build"
     }
   }
   ```

3. **Déployer**
   ```bash
   npm run deploy
   ```

4. **Activer GitHub Pages**
   - Allez dans Settings → Pages
   - Sélectionnez la branche `gh-pages`
   - Votre site sera disponible à : `https://VOTRE-USERNAME.github.io/cellebrite-dashboard`

---

## Option 4 : Serveur Apache/Nginx (Auto-hébergé)

### Pour Apache

1. **Builder l'application**
   ```bash
   cd cellebrite-dashboard
   npm run build
   ```

2. **Copier les fichiers**
   ```bash
   sudo cp -r build/* /var/www/html/cellebrite-dashboard/
   ```

3. **Configuration Apache** (`/etc/apache2/sites-available/cellebrite.conf`)
   ```apache
   <VirtualHost *:80>
       ServerName cellebrite.example.com
       DocumentRoot /var/www/html/cellebrite-dashboard

       <Directory /var/www/html/cellebrite-dashboard>
           Options -Indexes +FollowSymLinks
           AllowOverride All
           Require all granted

           # Support SPA routing
           RewriteEngine On
           RewriteBase /
           RewriteRule ^index\.html$ - [L]
           RewriteCond %{REQUEST_FILENAME} !-f
           RewriteCond %{REQUEST_FILENAME} !-d
           RewriteRule . /index.html [L]
       </Directory>

       ErrorLog ${APACHE_LOG_DIR}/cellebrite_error.log
       CustomLog ${APACHE_LOG_DIR}/cellebrite_access.log combined
   </VirtualHost>
   ```

4. **Activer et redémarrer**
   ```bash
   sudo a2ensite cellebrite
   sudo a2enmod rewrite
   sudo systemctl restart apache2
   ```

### Pour Nginx

1. **Builder l'application**
   ```bash
   npm run build
   ```

2. **Configuration Nginx** (`/etc/nginx/sites-available/cellebrite`)
   ```nginx
   server {
       listen 80;
       server_name cellebrite.example.com;
       root /var/www/cellebrite-dashboard;
       index index.html;

       location / {
           try_files $uri $uri/ /index.html;
       }

       # Cache des assets statiques
       location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
           expires 1y;
           add_header Cache-Control "public, immutable";
       }
   }
   ```

3. **Activer et redémarrer**
   ```bash
   sudo ln -s /etc/nginx/sites-available/cellebrite /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

---

## Option 5 : Docker (Portable)

### Dockerfile

Créez un fichier `Dockerfile` dans `cellebrite-dashboard/` :

```dockerfile
# Stage 1: Build
FROM node:18-alpine AS build

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Serve
FROM nginx:alpine

COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### nginx.conf

Créez un fichier `nginx.conf` :

```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### Build et Run

```bash
# Build l'image
docker build -t cellebrite-dashboard .

# Run le conteneur
docker run -d -p 80:80 --name cellebrite cellebrite-dashboard

# Accéder à l'app
# http://localhost
```

### Docker Compose

Créez `docker-compose.yml` :

```yaml
version: '3.8'

services:
  web:
    build: .
    ports:
      - "8080:80"
    restart: unless-stopped
```

Lancez avec :
```bash
docker-compose up -d
```

---

## 🔒 HTTPS / SSL

### Avec Netlify/Vercel
✅ HTTPS automatique, rien à faire !

### Avec Let's Encrypt (Apache/Nginx)

```bash
# Installer Certbot
sudo apt install certbot python3-certbot-nginx  # ou -apache

# Obtenir un certificat
sudo certbot --nginx -d cellebrite.example.com

# Renouvellement automatique (crontab)
sudo crontab -e
# Ajouter :
0 0 * * * certbot renew --quiet
```

---

## 🌍 Variables d'Environnement (Si besoin futur)

Si vous ajoutez des variables d'environnement (API keys, etc.) :

1. **Créer `.env`**
   ```
   REACT_APP_API_URL=https://api.example.com
   REACT_APP_VERSION=1.0.0
   ```

2. **Utiliser dans le code**
   ```typescript
   const apiUrl = process.env.REACT_APP_API_URL;
   ```

3. **Netlify/Vercel**
   - Ajoutez les variables dans les paramètres du projet
   - Site settings → Environment variables

---

## 📊 Optimisations Production

### 1. Activer la compression

**Nginx** :
```nginx
gzip on;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml+rss text/javascript;
```

**Apache** :
```apache
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css application/javascript
</IfModule>
```

### 2. Cache Headers

Ajoutez dans votre configuration serveur :
```nginx
location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### 3. Analyse du Bundle

```bash
npm install --save-dev webpack-bundle-analyzer
npm run build
npx webpack-bundle-analyzer build/static/js/*.js
```

---

## 🔍 Monitoring

### Google Analytics

Ajoutez dans `public/index.html` :
```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_TRACKING_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_TRACKING_ID');
</script>
```

---

## 📝 Checklist de Déploiement

- [ ] Tests locaux : `npm start` fonctionne
- [ ] Build réussit : `npm run build` sans erreurs
- [ ] Tester le build localement : `npx serve -s build`
- [ ] Vérifier les fichiers `.env` (ne pas exposer de secrets)
- [ ] Configurer HTTPS
- [ ] Tester sur mobile
- [ ] Configurer les headers de sécurité
- [ ] Activer la compression
- [ ] Configurer le cache
- [ ] Ajouter monitoring (optionnel)

---

## 🆘 Dépannage

### Build échoue
```bash
# Nettoyer et réinstaller
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Page blanche après déploiement
- Vérifiez la console du navigateur (F12)
- Assurez-vous que `homepage` dans `package.json` est correct
- Vérifiez la configuration du serveur (SPA routing)

### Fichiers Excel ne se chargent pas
- Vérifiez les limites de taille du serveur
- Nginx : `client_max_body_size 50M;`
- Apache : `LimitRequestBody 52428800`

---

## 📞 Support

Pour des questions sur le déploiement, consultez :
- Netlify Docs : https://docs.netlify.com
- Vercel Docs : https://vercel.com/docs
- GitHub Pages : https://pages.github.com

---

**Recommandation** : Pour un déploiement rapide et gratuit, utilisez **Netlify** via l'interface web (glisser-déposer du dossier `build`). C'est la solution la plus simple !

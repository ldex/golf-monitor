# ⛳ Golf Monitor - Québec

Application web pour surveiller les dates d'ouverture des golfs au Québec.

## 🎯 Fonctionnalités

- 📋 **Liste triable** des golfs avec dates d'ouverture
- 🗺️ **Carte interactive** avec localisation des golfs
- 🔄 **Actualisation automatique** chaque matin à 6 AM
- 🔔 **Notifications par email** (optionnel)
- 📊 **Tri par date, nom, région**
- 🌍 **Filtrage par région**

## 🚀 Installation

### Dépendances Système
- **Node.js** 18+
- **npm** 9+

### Setup Frontend (Angular)

```bash
# Installer les dépendances
npm install

# Démarrer le serveur de développement
npm start

# L'app sera accessible sur http://localhost:4200
```

### Setup Backend (Node.js/Express)

```bash
# Aller au dossier backend
cd backend

# Installer les dépendances
npm install

# Démarrer le serveur
npm start

# Le serveur API sera sur http://localhost:3000
```

## 📡 Architecture

### Frontend (Angular v21)
- Composant **GolfListComponent** - Liste triable/filtrable des golfs
- Composant **GolfMapComponent** - Carte Leaflet avec les golfs

### Backend (Node.js/Express)
- **Scraper** - Extraction des données de info.golf avec Puppeteer + Cheerio
- **API REST** - Endpoints pour récupérer/filtrer les golfs
- **Scheduler** - Mise à jour automatique chaque matin (node-cron)
- **Notifications** - Emails optionnels (nodemailer)

## 🔌 API Endpoints

### GET /api/golfs
Récupère tous les golfs

**Query Parameters:**
- `sort` - `date` | `name` | `region` (défaut: `date`)
- `filter` - Filtrer par région

**Réponse:**
```json
{
  "count": 5,
  "lastScrapedAt": "2026-04-14T06:00:00Z",
  "data": [
    {
      "id": "golf_0_...",
      "name": "Club de Golf Kingsway",
      "openingDate": "15 avril",
      "region": "Montréal",
      "coordinates": { "lat": 45.5017, "lng": -73.5673 },
      "scrapedAt": "2026-04-14T06:00:00Z"
    }
  ]
}
```

### GET /api/golfs/regions
Récupère les régions uniques

### POST /api/refresh
Déclenche un scrape manuel

### GET /api/health
Vérification de santé du serveur

## ⚙️ Configuration

### Variables d'Environnement (backend/.env)

```env
PORT=3000                          # Port du serveur API
NODE_ENV=development              # development | production

# Email (optionnel)
SMTP_HOST=smtp.gmail.com          # Serveur SMTP
SMTP_PORT=587                     # Port SMTP
SMTP_USER=votre-email@gmail.com   # Email pour envoyer
SMTP_PASS=app-password            # Mot de passe d'app (Gmail)

SEND_EMAIL_NOTIFICATIONS=false    # Activé/désactiver les emails
NOTIFICATION_EMAIL=user@example.com # Email pour les notifications
```

### Activer Notifications Email (Gmail)

1. Activer "Less secure app access" dans Google Account
   OU utiliser une "App Password" (recommandé)

2. Configurer les variables dans `.env`

3. Redémarrer le serveur

## 🗺️ Données

Les données des golfs sont stockées dans `backend/data/golfs.json`

Format:
```json
{
  "id": "identifiant_unique",
  "name": "Nom du golf",
  "openingDate": "15 avril",
  "region": "Montréal",
  "coordinates": { "lat": 45.5017, "lng": -73.5673 },
  "scrapedAt": "2026-04-14T06:00:00Z"
}
```

## 🔄 Workflow Scraping

1. **Scraper déclenché** (automatiquement 6 AM ou manuellement via `/api/refresh`)
2. **Récupère** info.golf avec Puppeteer
3. **Parse** le contenu HTML avec Cheerio
4. **Sauvegarde** les golfs dans `backend/data/golfs.json`
5. **Détecte** les nouveaux golfs
6. **Envoie** notification email (si activé)

## 🧪 Tests

Le backend vient avec des données de test dans `backend/data/golfs.json`:
- 5 golfs d'exemple
- Différentes dates d'ouverture
- Plusieurs régions

Pour tester le scraper en direct:
```bash
cd backend
npm run scrape
```

## 📝 Notes

- **Localisation des golfs**: Les coordonnées GPS sont générées automatiquement en fonction de la région (à améliorer avec geocoding)
- **Performance**: Puppeteer met du temps au premier lancement. Considérer un cache ou une autre approche pour production
- **CORS**: Le backend accepte les requêtes du frontend (cross-origin)

## 🚀 Production

1. Compiler le frontend:
   ```bash
   npm run build
   ```

2. Servir les fichiers dist depuis le backend ou un CDN

3. Configurer NODE_ENV=production dans le backend

4. Ajouter un reverse proxy (Nginx) pour HTTPS

## 📚 Ressources

- [Angular](https://angular.dev)
- [Express](https://expressjs.com)
- [Puppeteer](https://pptr.dev)
- [Leaflet](https://leafletjs.com)
- [node-cron](https://www.npmjs.com/package/node-cron)

---

**Bon suivi des golfs! 🏌️**

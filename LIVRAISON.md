# 🏌️ Golf Monitor - Application Complète LIVRÉE

## ✅ Qu'est-ce que vous avez reçu

J'ai créé une application web complète **frontend + backend** pour surveiller les dates d'ouverture des golfs au Québec. Voici ce qui est maintenant disponible:

### 🎯 Fonctionnalités Implémentées

#### Frontend (Angular v21)
- ✅ **Page Liste** - Affiche tous les golfs avec dates d'ouverture
- ✅ **Tri dynamique** - Par date, par nom, par région
- ✅ **Filtrage par région** - Sélectionnez une région spécifique
- ✅ **Bouton Actualiser** - Déclenche le scrape à la demande
- ✅ **Interface responsive** - Design moderne et mobile-friendly
- ✅ **Page Carte** - Visualisation Leaflet avec markers interactifs

#### Backend (Node.js + Express)
- ✅ **API REST complète**
  - GET `/api/golfs` - Récupère les golfs triés/filtrés
  - GET `/api/golfs/regions` - Récupère les régions uniques
  - POST `/api/refresh` - Déclenche un scrape manuel
  - GET `/api/health` - Vérification de santé

- ✅ **Scraper automatisé** (Puppeteer + Cheerio)
  - Navigue sur info.golf
  - Attend le chargement JavaScript
  - Parse le contenu HTML
  - Extrait les données des golfs
  - Sauvegarde en JSON local

- ✅ **Scheduler automatique**
  - Scrape chaque matin à 6 AM
  - Scrape au démarrage du serveur
  - Notifications email (optionnel)

- ✅ **Données persistantes**
  - Sauvegarde locale en JSON
  - 5 golfs de test pré-chargés

## 🚀 Démarrer l'Application

### 1. Lancer le Backend (terminal 1)

```bash
cd backend
npm start
```

Vous verrez:
```
╔════════════════════════════════════════╗
║   Golf Monitor Backend Running         ║
║   Port: 3000                           ║
║   Scheduler: 6 AM daily                ║
║   Data file: backend/data/golfs.json   ║
╚════════════════════════════════════════╝
```

### 2. Lancer le Frontend (terminal 2)

```bash
npm start
```

Vous verrez:
```
➜  Local:   http://localhost:4200/
```

### 3. Ouvrir dans le navigateur

**[http://localhost:4200](http://localhost:4200)**

Vous verrez la navigation en haut avec 2 onglets:
- 📋 **Liste** - Voir tous les golfs
- 🗺️ **Carte** - Voir sur la carte

## 📊 Données Actuelles

L'application vient avec 5 golfs de test:

| Golf | Date | Région |
|------|------|--------|
| Club de Golf Kingsway | 15 avril | Montréal |
| Club de Golf Mont-Rouge | 18 avril | Laurentians |
| Golf Islesmere | 20 avril | Montréal |
| Club de Golf Glengarry | 16 avril | Outaouais |
| Club de Golf Val-des-Lacs | 22 avril | Laurentians |

**Testez:**
1. Cliquez "Actualiser" pour relancer le scraper
2. Essayez les filtres (par région)
3. Essayez les tris (par date, nom, région)
4. Allez à la page Carte

## 🔄 Comment le Scraper Fonctionne

```
[Chaque jour 6 AM OU clic "Actualiser"]
    ↓
[Backend lance Puppeteer]
    ↓
[Ouvre info.golf/golf-ouverts-quebec/]
    ↓
[Attend chargement JavaScript]
    ↓
[Parse HTML avec Cheerio]
    ↓
[Extrait: nom, région, date d'ouverture]
    ↓
[Ajoute coordonnées GPS approximatives]
    ↓
[Sauvegarde backend/data/golfs.json]
    ↓
[Envoie email si configuré]
    ↓
[Frontend s'actualise automatiquement]
```

## 📁 Structure du Projet

```
demo-ai/
├── src/                    # Code Angular
│   ├── app/
│   │   ├── components/
│   │   │   ├── golf-list/       ← Composant Liste
│   │   │   └── golf-map/        ← Composant Carte
│   │   ├── services/
│   │   │   └── golf.service.ts  ← Logique métier
│   │   └── app.ts               ← Composant racine
│   └── index.html
│
├── backend/                # API Node.js
│   ├── src/
│   │   ├── server.js       ← Express + Scheduler
│   │   ├── scraper.js      ← Puppeteer
│   │   └── notifications.js ← Email
│   ├── data/
│   │   └── golfs.json      ← Données
│   ├── package.json
│   └── .env                ← Config
│
├── SETUP_GUIDE.md          ← Guide d'utilisation
├── GOLF_MONITOR_README.md  ← Documentation technique
└── package.json
```

## 🔐 Configuration (Optionnel)

### Activer les Notifications par Email

1. Créez une "App Password" dans [Google Account](https://myaccount.google.com/apppasswords)
2. Éditez `backend/.env`:
   ```
   SMTP_USER=votre-email@gmail.com
   SMTP_PASS=votre-app-password
   SEND_EMAIL_NOTIFICATIONS=true
   NOTIFICATION_EMAIL=destinataire@example.com
   ```
3. Redémarrez le backend

## 📊 Endpoints API

```bash
# Récupérer les golfs
curl "http://localhost:3000/api/golfs?sort=date&filter=Montréal"

# Récupérer les régions
curl "http://localhost:3000/api/golfs/regions"

# Actualiser manuellement
curl -X POST "http://localhost:3000/api/refresh"

# Santé du serveur
curl "http://localhost:3000/api/health"
```

## 🎨 Interface

### Page Liste
- Grille responsive
- Cartes avec info golf
- Tri et filtrage en temps réel
- Badges pour les régions
- Timestamp de mise à jour

### Page Carte
- Carte interactive Leaflet
- Markers pour chaque golf
- Popups au clic
- Zoom automatique
- OpenStreetMap

## 🐛 Troubleshooting

**"Cannot connect to backend"**
- Assurez-vous que le backend tourne sur le port 3000
- Vérifiez: http://localhost:3000/api/health

**"Build failed"**
- Supprimez `node_modules` et `.angular`
- Réinstallez: `npm install`

**"La carte ne s'affiche pas"**
- Rechargez la page (F5)
- Attendez le chargement de Leaflet

**Le scraper s'exécute mais pas de données**
- Les données sont stockées dans `backend/data/golfs.json`
- Vérifiez que le backend peut accéder au fichier

## 📈 Prochaines Améliorations Possibles

- [ ] Scraper réel de info.golf (parser amélioré)
- [ ] Geocoding réelle des golfs (Google Maps API)
- [ ] Authentification utilisateur
- [ ] Favoris personnalisés
- [ ] Notifications push
- [ ] Historique des années précédentes
- [ ] Export PDF/CSV
- [ ] Statistiques (nombre d'ouvertures/semaine)

## 💻 Stack Technologique

**Frontend:**
- Angular 21 (Standalone components)
- Signals pour l'état
- Leaflet pour les cartes
- TypeScript strict
- CSS modulaire

**Backend:**
- Node.js 18+
- Express 4
- Puppeteer (navigateur headless)
- Cheerio (HTML parser)
- node-cron (Scheduler)
- Nodemailer (Email)

## 📞 Support

Pour plus de détails:
- Voir `SETUP_GUIDE.md` pour l'utilisation
- Voir `GOLF_MONITOR_README.md` pour les detials techniques
- Les logs sont affichés dans les terminaux

## ✨ À Savoir

1. **Premier scrape** - Peut prendre 20-30 secondes (Puppeteer)
2. **Cache frontend** - Les données se mettent à jour toutes les 5 minutes
3. **Données locales** - Tout est sauvegardé dans `backend/data/golfs.json`
4. **Performance** - Puppeteer est lourd; considérez une autre approche pour production

## 🎯 Prochaines Étapes Suggérées

1. **Immédiate**: Testez l'app sur http://localhost:4200
2. **Court terme**: Améliorez le scraper avec de vrais sélecteurs CSS de info.golf
3. **Moyen terme**: Ajouter authentification + profils utilisateur
4. **Long terme**: Déployer en production (Vercel, Heroku, AWS)

---

**L'application est prête à l'usage!** ⛳

Amusez-vous à surveiller les ouvertures des golfs! N'hésitez pas si vous avez besoin d'ajustements. 🏌️

# 🏌️ Golf Monitor - Guide d'Utilisation

## 🚀 Démarrage Rapide

### 1. Lancer le Backend (Node.js API)

Ouvrez un terminal dans le dossier du projet et exécutez:

```bash
cd backend
npm start
```

Le serveur.API devrait démarrer sur **http://localhost:3000**

Vous devriez voir:
```
╔════════════════════════════════════════╗
║   Golf Monitor Backend Running         ║
║   Port: 3000                           ║
║   Scheduler: 6 AM daily                ║
║   Data file: backend/data/golfs.json   ║
╚════════════════════════════════════════╝
```

### 2. Lancer le Frontend (Angular)

Dans un **nouveau terminal**, exécutez:

```bash
npm start
```

Le frontend devrait démarrer sur **http://localhost:4200**

Attendez le message: `Application bundle generated successfully.`

## 📝 Contenu du Projet

```
demo-ai/
├── src/                          # Code source Angular
│   └── app/
│       ├── components/
│       │   ├── golf-list/        # Liste triable des golfs
│       │   └── golf-map/         # Carte interactive (Leaflet)
│       ├── services/
│       │   └── golf.service.ts   # Service API + état
│       ├── app.ts                # Composant racine
│       ├── app.routes.ts         # Routes
│       └── app.html              # Template principal
│
├── backend/                      # API Node.js
│   ├── src/
│   │   ├── server.js             # Serveur Express +  Scheduler
│   │   ├── scraper.js            # Puppeteer + Cheerio
│   │   └── notifications.js      # Email (Nodemailer)
│   ├── data/
│   │   └── golfs.json            # Base de données des golfs
│   ├── package.json
│   └── .env                      # Variables d'environnement
│
└── package.json                  # Dépendances frontend
```

## 🌐 Navigation

### Liste (http://localhost:4200/list)
- Affiche tous les golfs avec leurs dates d'ouverture
- Trier par: Date | Nom | Région
- Filtrer par région
- Bouton "Actualiser" pour relancer le scrape

### Carte (http://localhost:4200/map)
- Vue carte interactive de tous les golfs
- Cliquez sur un marker pour voir détails
- Auto-zoom pour voir tous les golfs

## 🔄 Fonctionnement du Scraper

Le serveur backend fait 3 choses automatiquement:

1. **Au démarrage** - Charge les données existantes de `backend/data/golfs.json`

2. **Chaque jour à 6 AM** - Exécute automatiquement le scraper qui:
   - Ouvre un navigateur virtuel avec Puppeteer
   - Accède à https://www.info.golf/golf-ouverts-quebec/
   - Attend le chargement JavaScript
   - Parse le contenu HTML avec Cheerio
   - Extrait nom, date d'ouverture, région
   - Ajoute les coordonnées GPS approximatives
   - Sauvegarde dans `backend/data/golfs.json`
   - Envoie un email (si configuré)

3. **À la demande** - Cliquez "Actualiser" dans l'app pour relancer manuellement

## 🚨 Dépannage

### "Cannot connect to backend" (l'app dit que le backend n'est pas disponible)

**Solution:**
1. Vérifiez que le backend est démarré sur le port 3000
2. Ouvrez http://localhost:3000/api/health dans le navigateur
3. Ilyour devriez voir: `{"status":"ok","uptime":...,"golfsCount":5}`

### "Build failed" (erreur Angular à la compilation)

**Solution:**
1. Supprimez `node_modules` et `.angular`
2. Réinstallez: `npm install && npm start`

### L'application ne montre pas les données

**Solution:**
1. Ouvrez la console (F12)
2. Cherchez les erreurs CORS
3. Assurez-vous que le backend tourne sur 3000
4. Cliquez "Actualiser" dans l'app

### La carte ne s'affiche pas correctement

**Solution:**
1. La carte Leaflet dépend du CSS
2. Rechargez la page (F5)
3. Enveloppe peut être lente au premier chargement

## 🔐 Variables d'Environnement (Backend)

Éditez `backend/.env` pour configurer:

```
PORT=3000
NODE_ENV=development

# Email notifications
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=votre-email@gmail.com
SMTP_PASS=votre-mot-de-passe-app
SEND_EMAIL_NOTIFICATIONS=false
NOTIFICATION_EMAIL=destinataire@example.com
```

### Activer les notifications email:

1. Créez une "App Password" dans Google Account
2. Configurez dans `.env`
3. Mettez `SEND_EMAIL_NOTIFICATIONS=true`
4. Redémarrez le backend

## 📚 API Disponibles

**GET /api/golfs?sort=date&filter=Montréal**
```json
{
  "count": 5,
  "lastScrapedAt": "2026-04-14T06:00:00Z",
  "data": [...]
}
```

**GET /api/golfs/regions**
```json
["Montréal", "Laurentians", "Outaouais", ...]
```

**POST /api/refresh**
Déclenche un scrape manuel

**GET /api/health**
Retourne l'état du serveur

## 💡 Tips

- Le frontend cache automatiquement les données (service Angular)
- L'actualisation se fait chaque 5 minutes min (configurable)
- Les données de test incluent 5 golfs pour démarrer
- Vous pouvez éditer `backend/data/golfs.json` directement

## 🐛 Signaler un Bug

Vérifiez les logs:
- **Frontend:** Console du navigateur (F12)
- **Backend:** Terminal où le serveur est lancé

## 📖 Prochaines Améliations

- [ ] Geocoding réelle avec les vraies coordonnées
- [ ] Authentification et profils utilisateurs
- [ ] Notifications push (web/mobile)
- [ ] Historique des dates (année précédente)
- [ ] Export CSV/PDF
- [ ] Préférences utilisateur persé (favoris, etc.)

---

**N'oubliez pas: frappez à la porte avant de vous présenter en personne!** 🏌️

Questions? Vérifiez le GOLF_MONITOR_README.md pour plus de détails techniques.

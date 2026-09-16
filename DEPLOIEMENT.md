# Déployer Signa en production — guide complet

Ce guide t'emmène de "ça tourne sur mon ordinateur" à "l'app est en ligne et téléchargeable". Suis les sections dans l'ordre : chacune dépend de la précédente.

Compte à rebours réaliste : back-end + base de données = **30 à 45 minutes**. Android = **1 à 2 jours** (le temps que Google valide). iOS = **3 à 7 jours** (compte développeur + revue Apple, plus longue).

---

## Étape 0 — Les comptes à créer avant de commencer

| Service | Pourquoi | Coût | Lien |
|---|---|---|---|
| Railway ou Render | Héberger le back-end + la base de données | Gratuit pour démarrer, puis ~5-20$/mois | railway.app / render.com |
| Cloudinary | Stocker les photos/documents des visites | Gratuit jusqu'à 25 Go | cloudinary.com |
| Brevo (ex-Sendinblue) | Envoyer les factures par email | Gratuit jusqu'à 300 emails/jour | brevo.com |
| Twilio | Envoyer les rappels SMS | Payant à l'usage (~0,07€/SMS en France) | twilio.com |
| Expo (EAS) | Builder l'app iOS/Android | Gratuit pour builder, submit inclus | expo.dev |
| Google Play Console | Publier sur Android | 25$ **une seule fois**, à vie | play.google.com/console |
| Apple Developer | Publier sur iOS | 99$ **par an** | developer.apple.com |

Tu peux commencer le back-end tout de suite. Les comptes Google/Apple ne sont nécessaires qu'à l'étape 4.

---

## Étape 1 — Base de données PostgreSQL

**Le plus simple : Railway fait les deux (base + serveur) au même endroit.**

1. Va sur [railway.app](https://railway.app), connecte-toi avec GitHub
2. "New Project" → "Provision PostgreSQL"
3. Une fois créée, clique dessus → onglet "Variables" → copie la valeur de `DATABASE_URL` (tu en auras besoin à l'étape 2)

*Alternative gratuite à vie si tu préfères séparer : [neon.tech](https://neon.tech) ou [supabase.com](https://supabase.com) (onglet "Connection string" en mode "URI").*

---

## Étape 2 — Déployer le back-end

### Avec Railway (recommandé, le plus simple)

1. Pousse le dossier `backend/` sur un repo GitHub (crée-en un si besoin : `git init`, `git add .`, `git commit -m "init"`, puis push sur un nouveau repo GitHub)
2. Sur Railway : "New Project" → "Deploy from GitHub repo" → sélectionne ton repo → **Root directory : `backend`**
3. Railway détecte automatiquement Node.js. Dans l'onglet "Settings" :
   - Build command : `npm install && npx prisma generate`
   - Start command : `npx prisma migrate deploy && npm run prisma:seed && npm start`
   
   ⚠️ Le `prisma:seed` dans le start command ne créera les packs/super admin qu'**une seule fois** (le script vérifie s'ils existent déjà) — tu peux le laisser en permanence, ou le retirer après le premier déploiement si tu préfères.

4. Onglet "Variables" → ajoute (copie-colle depuis ton `.env.example`, en remplissant les vraies valeurs) :
   ```
   DATABASE_URL=         (déjà rempli si tu as créé la base sur le même projet Railway)
   JWT_SECRET=           (génère une longue chaîne aléatoire, ex: openssl rand -hex 32)
   PORT=4000
   CLOUDINARY_URL=       (depuis le dashboard Cloudinary → Account Details)
   SMTP_HOST=smtp-relay.brevo.com
   SMTP_PORT=587
   SMTP_USER=            (ton identifiant Brevo)
   SMTP_PASS=            (ta clé SMTP Brevo, pas ton mot de passe de compte)
   SMTP_FROM="Signa <factures@tondomaine.com>"
   TWILIO_ACCOUNT_SID=   (dashboard Twilio)
   TWILIO_AUTH_TOKEN=
   TWILIO_FROM_NUMBER=   (numéro Twilio acheté, format +33...)
   ```
5. Railway te donne une URL du type `https://signa-backend-production.up.railway.app` — **note-la**, c'est ton `API_URL`

6. Vérifie que ça tourne : ouvre `https://ton-url.railway.app/` dans un navigateur → tu dois voir `{"status":"API Signa en ligne"}`

7. Connecte-toi avec le compte super admin créé par le seed (`superadmin@signa.app` / `ChangeMoi123!`) et **change immédiatement ce mot de passe** (via Prisma Studio, voir README, ou en créant une route de changement de mot de passe si tu veux le faire proprement depuis l'app).

### Nom de domaine personnalisé (optionnel mais recommandé)
Dans Railway → Settings → Networking → "Custom Domain", pointe un sous-domaine (ex: `api.signa.app`) vers Railway via un enregistrement CNAME chez ton registrar. Le HTTPS est automatique.

---

## Étape 3 — Brancher l'app mobile sur le vrai serveur

Dans `mobile/src/api/client.js`, remplace :
```js
export const API_URL = 'http://localhost:4000/api';
```
par ton URL Railway :
```js
export const API_URL = 'https://api.signa.app/api'; // ou ton URL Railway brute
```

---

## Étape 4 — Builder l'app avec EAS

```bash
cd mobile
npm install -g eas-cli
eas login          # crée un compte gratuit sur expo.dev si besoin
eas build:configure
```

Ça génère un `projectId` — copie-le et colle-le dans `mobile/app.json` à la place de `REMPLACE_PAR_TON_PROJECT_ID_EAS` (nécessaire pour que les notifications push fonctionnent).

### Android (le plus rapide pour tester)
```bash
eas build --platform android --profile production
```
Attends la fin du build (10-20 min, tu peux fermer le terminal, suis sur expo.dev). Tu obtiens un fichier `.aab`.

**Publier sur le Play Store :**
1. Crée ton compte [Google Play Console](https://play.google.com/console) (25$, une fois)
2. "Créer une application" → remplis fiche store (nom, description, captures d'écran, icône, politique de confidentialité — **obligatoire**, un simple générateur en ligne suffit pour démarrer)
3. Section "Production" → "Créer une release" → uploade le `.aab`
4. Soumets à validation (24-48h en général)

*Pour tester avant publication : `eas build --platform android --profile preview` génère un `.apk` que tu peux installer directement sur un téléphone Android, sans passer par le Store.*

### iOS
```bash
eas build --platform ios --profile production
```
EAS te demande de te connecter à ton compte Apple Developer (99$/an) — il gère lui-même les certificats, pas besoin de Mac ni de Xcode.

**Publier sur l'App Store :**
```bash
eas submit --platform ios
```
Puis va sur [App Store Connect](https://appstoreconnect.apple.com) : fiche store, captures d'écran (obligatoires pour plusieurs tailles d'écran), politique de confidentialité, soumission à la revue Apple (compte 3-7 jours, parfois plus au premier essai).

---

## Étape 5 — Checklist finale avant d'annoncer le lancement

- [ ] Mot de passe du compte Super Admin changé (celui du seed)
- [ ] `CLOUDINARY_URL` configuré (sinon les photos disparaîtront au prochain déploiement)
- [ ] `SMTP_*` configuré et testé (envoie-toi une facture test)
- [ ] `TWILIO_*` configuré et testé (crée un RDV proche avec rappel SMS activé, vérifie la réception)
- [ ] `JWT_SECRET` bien une valeur unique et longue (jamais celle du `.env.example`)
- [ ] Politique de confidentialité en ligne (obligatoire pour les deux stores — tu collectes des données de géolocalisation d'adresse, des photos, des numéros de téléphone)
- [ ] Testé de bout en bout : super admin crée une entreprise → l'admin se connecte → ajoute un technicien → technicien se connecte → fait une visite complète → admin voit le résultat

---

## Ça coûte combien, au global, pour démarrer ?

| Poste | Coût |
|---|---|
| Railway (back-end + DB) | ~5-10$/mois au démarrage |
| Cloudinary | Gratuit jusqu'à 25 Go |
| Brevo | Gratuit jusqu'à 300 emails/jour |
| Twilio | ~0,07€ par SMS envoyé |
| Google Play | 25$ une fois |
| Apple Developer | 99$/an |

**Premier mois : environ 130-150$ (surtout à cause d'Apple), puis ~10-15$/mois ensuite.** Tu peux lancer sur Android seul pour commencer et ajouter iOS plus tard si tu veux limiter les frais initiaux.

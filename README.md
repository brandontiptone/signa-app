# Signa — Application de gestion & planning commerciaux (multi-clients / SaaS)

Projet complet : back-end (API) + application mobile (iOS/Android). Pensé pour être **loué** à plusieurs entreprises clientes, chacune avec son propre pack tarifaire et son quota de techniciens.

## 📁 Structure
- `backend/` → API Node.js/Express + PostgreSQL (Prisma)
- `mobile/` → Application React Native (Expo)

---

## 🧩 Le modèle en 3 niveaux

1. **Toi (Super Admin)** — tu pilotes toutes les entreprises clientes : tu crées leur accès, choisis leur pack, peux les suspendre (impayé, résiliation...)
2. **L'Admin d'une entreprise cliente** — gère son équipe de techniciens (dans la limite de son pack), attribue les RDV, suit les perfs
3. **Le technicien / commercial** — utilise l'app sur le terrain

Il n'y a **plus d'auto-inscription publique** dans l'app : un compte ne peut être créé que par le Super Admin (pour un Admin) ou par un Admin (pour ses techniciens). C'est ce qui permet de facturer au nombre de comptes.

### Les packs (déjà configurés dans le seed)
| Pack | Prix | Techniciens |
|---|---|---|
| Starter | 29,99 €/mois | jusqu'à 4 |
| Pro | 59,99 €/mois | jusqu'à 10 |
| Business | 99,99 €/mois | jusqu'à 20 |
| Illimité | 149,99 €/mois | illimité |

Si un Admin tente d'ajouter un technicien au-delà de la limite de son pack, l'API refuse avec un message clair invitant à upgrader.

---

## 🔧 1. Lancer le back-end

```bash
cd backend
npm install
cp .env.example .env   # renseigne DATABASE_URL et JWT_SECRET
npx prisma migrate dev --name init   # crée les tables en base
npm run prisma:seed    # crée les 4 packs + ton compte Super Admin
npm run dev             # démarre l'API sur http://localhost:4000
```

Le seed affiche dans la console les identifiants de ton compte Super Admin (`superadmin@signa.app` / `ChangeMoi123!`) — **change ce mot de passe dès la première connexion**.

Tu as besoin d'une base PostgreSQL (locale, ou gratuite sur Railway / Supabase / Neon).

### Endpoints principaux
- `POST /api/auth/login` — connexion (seule route publique)
- `GET /api/superadmin/organisations` — liste des entreprises clientes (super admin)
- `POST /api/superadmin/organisations` — créer une entreprise + son premier compte admin
- `PATCH /api/superadmin/organisations/:id/statut` — suspendre/réactiver une entreprise
- `PATCH /api/superadmin/organisations/:id/plan` — changer son pack
- `GET /api/admin/commerciaux` — liste des techniciens de mon organisation + info pack
- `POST /api/admin/commerciaux` — créer un technicien (bridé par le pack)
- `GET /api/rdv?from&to` — planning (semaine)
- `PATCH /api/rdv/:id/finalize` — finaliser l'étude (signé/non signé)
- `GET /api/stats` — performance (% signé)

### Déploiement du back-end
Héberge-le sur Railway, Render ou un VPS. Pense à remplacer le stockage local des fichiers (`multer`) par un stockage cloud (S3, Cloudinary) en production.

---

## 📱 2. Lancer l'application mobile

```bash
cd mobile
npm install
```

Dans `src/api/client.js`, remplace `API_URL` par l'URL de ton back-end déployé.

```bash
npx expo start
```

Scanne le QR code avec l'app **Expo Go** (iOS/Android) pour tester. Connecte-toi avec le compte Super Admin créé par le seed pour créer ta première entreprise cliente.

### 🚀 Déploiement sur les stores (iOS + Android)

```bash
npm install -g eas-cli
eas login
eas build:configure
eas build --platform ios       # génère le .ipa (nécessite un compte Apple Developer, 99$/an)
eas build --platform android   # génère le .apk / .aab
eas submit --platform ios      # publication sur l'App Store
eas submit --platform android  # publication sur le Play Store
```

---

## ✅ Fonctionnalités incluses
- Connexion (JWT) — aucune inscription publique
- Accueil technicien : bonjour + stats de réussite + % + notifications non lues
- Planning semaine (lundi → dimanche) + vue liste par jour, GPS direct
- Visite terrain : "Commencer la visite", photos/documents, champs personnalisés, note libre, résultat configurable
- Fiche client : historique complet de tous les dossiers, accessible à tout moment
- **Rôle ADMIN** : tableau de bord équipe, planning global filtrable, attribution de RDV (avec autocomplétion d'adresse officielle), gestion de l'équipe bridée par le pack, **paramètres métier** (vocabulaire, résultats, champs, rappels SMS)
- **Rôle SUPER ADMIN** : création d'entreprises clientes, choix du pack, suspension/réactivation immédiate de l'accès, facturation (PDF, email, suppression)
- **Notifications push** (Expo Notifications) : nouveau RDV attribué → le technicien est notifié ; visite finalisée → l'admin est notifié avec accès direct à la fiche client
- Logo et identité visuelle Signa (voir `mobile/assets/logo.svg`)

## 🧬 Une app adaptable à n'importe quel métier terrain
Signa n'est plus figé sur "vente à domicile / signé / non signé". Chaque entreprise cliente configure, depuis **Admin → Paramètres** :

- **Le vocabulaire** (`Organisation.labelVisite`) — "étude", "intervention", "diagnostic", "dépannage"... le mot choisi se propage automatiquement dans toute l'app (accueil, fiche RDV, écran de visite)
- **Les résultats possibles d'une visite** (`ResultatOption`) — remplace le binaire figé "signé/non signé". Un plombier peut définir "Réparé" / "Pièce à commander" / "Non réparable" ; un vendeur garde "Signé" / "Non signé". Chaque résultat a un simple booléen `estPositif` qui sert à calculer le "taux de réussite" dans les statistiques, quel que soit le libellé choisi
- **Des champs personnalisés** (`ChampPersonnalise`) — texte, nombre, liste de choix ou case à cocher, avec option "obligatoire". Ils s'affichent automatiquement sur le formulaire de visite du technicien, en plus des photos/documents déjà natifs. Un électricien peut ajouter "Puissance installée (kW)", un inspecteur "Conforme aux normes ?"...

Ces trois réglages sont scopés par entreprise (`organisationId`) : deux entreprises clientes peuvent avoir des vocabulaires et formulaires complètement différents sans se marcher dessus.

## 📲 Rappels SMS automatiques au client
Depuis **Admin → Paramètres**, l'admin peut activer l'envoi automatique d'un SMS de rappel au client final avant chaque RDV, et choisir librement un ou plusieurs délais parmi **1h / 3h / 24h avant**.

- À la création d'un RDV, un `RappelSms` est programmé pour chaque délai coché (si l'heure calculée n'est pas déjà passée)
- Un planificateur (`backend/src/scheduler.js`) vérifie toutes les 5 minutes les rappels dus et les envoie via **Twilio** (`backend/src/utils/sms.js`)
- Si le RDV est annulé, les rappels non encore envoyés sont automatiquement annulés
- Sans les variables `TWILIO_*` renseignées dans `.env`, l'envoi échoue proprement avec l'erreur `SMS_NON_CONFIGURE` plutôt que de planter

## 🔒 Sécurité multi-clients
Chaque route Admin est strictement filtrée par `organisationId` : un Admin ne peut jamais voir les techniciens, clients ou RDV d'une autre entreprise cliente. Suspendre une organisation bloque l'accès de **tous** ses comptes (admin + techniciens) dès la requête suivante, sans qu'ils aient besoin de se déconnecter.

## 🧾 Factures : PDF, email, suppression
- **Voir le PDF** : génère une vraie facture PDF (via `pdfkit`) à la volée, avec numéro unique (`FAC-2026-0001`), et l'ouvre dans le menu de partage natif du téléphone (Mail, Fichiers, WhatsApp...)
- **Envoyer par email** : envoie directement le PDF en pièce jointe à l'admin de l'entreprise, depuis le serveur. Nécessite de renseigner les variables `SMTP_*` dans `.env` (n'importe quel fournisseur : Brevo, SendGrid, OVH, Gmail...) — sans ça, l'app te prévient clairement plutôt que d'échouer en silence
- **Supprimer** : possible à tout moment en cas d'erreur (ex. facture générée par accident), avec confirmation

## 🎨 Le logo
Un logo vectoriel (`mobile/assets/logo.svg`) a été créé : une signature stylisée en "S" sur fond corail, avec un petit badge "signé" (coche verte). Pour l'utiliser comme icône d'app (Expo demande un PNG, pas un SVG) :
```bash
npx sharp-cli -i assets/logo.svg -o assets/icon.png resize 1024 1024
```
puis référence `assets/icon.png` dans `app.json` (`expo.icon`).

## 📍 Autocomplétion d'adresse
Le champ adresse (création de RDV côté admin) utilise l'**API Adresse** du gouvernement français (`api-adresse.data.gouv.fr`) : gratuite, officielle, sans clé à configurer. Le composant est dans `mobile/src/components/AddressAutocomplete.js`.

## 🔔 Notifications push — points d'attention
- Les notifications push Expo ne fonctionnent que sur un **vrai téléphone** (pas sur simulateur/émulateur)
- Après `eas build:configure`, récupère ton `projectId` et remplace `REMPLACE_PAR_TON_PROJECT_ID_EAS` dans `mobile/app.json`

## 🔜 Pistes d'amélioration futures
- Paiement récurrent automatisé (Stripe Billing) au lieu d'une gestion manuelle des packs
- Marque blanche (logo/couleurs propres à chaque entreprise cliente)
- Page publique de souscription en self-service
- Signature électronique directement dans l'app
- Mode hors-ligne (cache local + synchronisation)
- Export CSV/Excel et API/webhooks pour connecter Signa à d'autres outils

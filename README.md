# RentEase — Gestion de Locations Saisonnières

Application web complète pour gérer vos locations saisonnières.

## Prérequis

- Node.js 18+
- npm 9+

## Installation Backend

```bash
cd backend
npm install
# Configurer le .env (déjà prêt avec SQLite)
npx prisma migrate dev --name init
node prisma/seed.js
npm run dev
```

Le backend démarre sur **http://localhost:5000**

## Installation Frontend

```bash
cd frontend
npm install
npm run dev
```

Le frontend démarre sur **http://localhost:5173**

## Comptes Démo

| Email | Mot de passe | Propriétés |
|-------|-------------|------------|
| ahmed@example.com | demo123 | Villa Carthage, Appartement Sidi Bou |
| sonia@example.com | demo123 | Dar Yasmine |

## Fonctionnalités

- **Dashboard** : KPIs, graphique revenus 6 mois, prochaines arrivées
- **Propriétés** : CRUD avec photos et couleurs
- **Réservations** : tableau filtrable, calcul automatique des nuits
- **Calendrier** : vue mensuelle avec blocs colorés par propriété
- **Revenus** : graphiques, stats par propriété, paiements récents
- **i18n** : FR/AR avec RTL instantané
- **Mobile-first** : navigation bottom bar + FAB

## URLs

- Frontend : http://localhost:5173
- Backend API : http://localhost:5000/api

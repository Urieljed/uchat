# 🚀 Guide de déploiement uChat + Firebase

## Étape 1 — Créer le projet Firebase

1. Va sur https://console.firebase.google.com
2. Clique **"Ajouter un projet"** → nom : `uchat`
3. Désactive Google Analytics (optionnel) → Créer

## Étape 2 — Activer Authentication

1. Dans le menu gauche → **Authentication** → **Commencer**
2. Onglet **Sign-in method** → Active **Email/Password** → Enregistrer

## Étape 3 — Créer la base Firestore

1. Menu gauche → **Firestore Database** → **Créer une base de données**
2. Choisis **Mode test** (pour commencer) → Sélectionne une région → Activer

## Étape 4 — Activer Storage (pour les fichiers/images)

1. Menu gauche → **Storage** → **Commencer**
2. Mode test → Suivant → Terminer

## Étape 5 — Récupérer ta config Firebase

1. Menu gauche → ⚙️ **Paramètres du projet** → onglet **Général**
2. Descends jusqu'à **"Vos applications"** → clique **</>** (Web)
3. Nom de l'app : `uchat-web` → **Enregistrer**
4. Copie l'objet `firebaseConfig`

## Étape 6 — Coller la config dans le code

Ouvre `src/firebase.js` et remplace les valeurs :

```js
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "uchat-xxxxx.firebaseapp.com",
  projectId: "uchat-xxxxx",
  storageBucket: "uchat-xxxxx.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123:web:abc123"
};
```

## Étape 7 — Lancer l'app en local

```bash
npm install
npm start
```

L'app s'ouvre sur http://localhost:3000

## Étape 8 — Déployer sur Vercel (gratuit, URL publique)

```bash
npm install -g vercel
npm run build
vercel --prod
```

Vercel te donne une URL comme `uchat-ton-nom.vercel.app` 🎉
Partage-la avec ta femme et tes amis pour qu'ils créent leur compte !

## Sécurité Firestore (règles recommandées)

Dans Firestore → **Règles**, remplace par :

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == uid;
    }
    match /conversations/{convId} {
      allow read, write: if request.auth != null &&
        request.auth.uid in resource.data.members;
      match /messages/{msgId} {
        allow read, write: if request.auth != null;
      }
    }
  }
}
```

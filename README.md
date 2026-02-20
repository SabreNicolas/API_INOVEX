# Template API NestJS

Template de démarrage pour créer une nouvelle API REST avec NestJS, TypeORM et SQL Server.

## Prérequis

- **Node.js** >= 20.x
- **npm** >= 10.x
- **Docker** et **Docker Compose** (pour la base de données)
- **Git**

## Étapes pour lancer un nouveau projet

### 1. Créer un nouveau répertoire git

### 2. Télécarger le template le template depuis git et copiez dans le nouveau répertoire

### 3. Créer une vm windows et installer SQL Server et SSMS (ou HeidiSQL/DBeaver)

### 4. Configurer les variables d'environnement

Pour le développement, copier le fichier `.env.example` en `.env` et modifier les valeurs si nécessaire.

```bash
cp .env.example .env
```

Pour la production, copier le fichier `.env.prod.example` en `.env.prod` et modifier les valeurs avec les vraies informations de connexion.

```bash
cp .env.prod.example .env.prod
```

### 5. Initialiser vos schémas de base de données

- Le projet inclut un script d'initialisation de la base de données dans `docker/init-db/01-schema-and-data.sql`. Ce script crée la base de données, les tables et insère des données de test.
- Modifiez donc le script SQL pour adapter le schéma à votre projet avant de lancer la base de données.
- Faites la même opération pour le serveur de production si nécessaire.

> **Note :** Pour réinitialiser la base de données après modification du schéma :
>
> ```bash
> npm run docker:dev:reset
> ```

### 6. Installer le github self-hosted runner sur le serveur debian

### 7. Lancer la base de données

```bash
# Démarrer le conteneur SQL Server
npm run docker:dev

# Vérifier que le conteneur est lancé
docker ps
```

**Connexion à la base de données (HeidiSQL/DBeaver/etc.) :**

- **Hôte** : `localhost` ou `127.0.0.1`
- **Port** : `1433`
- **Utilisateur** : `sa`
- **Mot de passe** : `Inovex_Dev_2024!`
- **Base** : `dolibarr`

### 7. Lancer l'API en développement

```bash
npm run start:dev
```

L'API est accessible sur `http://localhost:3010/api`

### 8. Vérifier le bon fonctionnement

```bash
# Health check
curl http://localhost:3010/api/health

# Documentation Swagger
# Ouvrir dans le navigateur : http://localhost:3010/api/docs
```

---

## Commandes disponibles

### Développement

| Commande              | Description                               |
| --------------------- | ----------------------------------------- |
| `npm run start:dev`   | Lancer en mode développement (hot reload) |
| `npm run start:debug` | Lancer en mode debug                      |
| `npm run build`       | Compiler le projet                        |
| `npm run start:prod`  | Lancer en mode production                 |

### Docker

| Commande                   | Description                       |
| -------------------------- | --------------------------------- |
| `npm run docker:dev`       | Démarrer la base de données SQL Server |
| `npm run docker:dev:down`  | Arrêter les conteneurs            |
| `npm run docker:dev:logs`  | Voir les logs Docker              |
| `npm run docker:dev:reset` | Réinitialiser la base de données  |

### Tests

| Commande             | Description                   |
| -------------------- | ----------------------------- |
| `npm run test`       | Lancer les tests unitaires    |
| `npm run test:watch` | Tests en mode watch           |
| `npm run test:cov`   | Tests avec couverture de code |
| `npm run test:e2e`   | Tests end-to-end              |

### Qualité du code

| Commande         | Description                           |
| ---------------- | ------------------------------------- |
| `npm run lint`   | Vérifier et corriger le code (ESLint) |
| `npm run format` | Formater le code (Prettier)           |
| `npm run audit`  | Audit de sécurité des dépendances     |

---

## Structure du projet

```
src/
├── main.ts                      # Point d'entrée de l'application
├── app.module.ts                # Module racine
├── common/                      # Éléments partagés
│   ├── constants/               # Constantes globales
│   ├── decorators/              # Décorateurs personnalisés
│   ├── dto/                     # DTOs partagés (pagination, etc.)
│   ├── filters/                 # Filtres d'exception
│   ├── guards/                  # Guards (auth, CSRF, etc.)
│   ├── interceptors/            # Intercepteurs (logging, response)
│   ├── middlewares/             # Middlewares
│   ├── pipes/                   # Pipes de validation
│   ├── services/                # Services partagés (logger)
│   └── validators/              # Validateurs personnalisés
├── database/                    # Configuration TypeORM
├── entities/                    # Entités TypeORM
├── health/                      # Module de health check
└── modules/                     # Modules métier
    ├── auth/                    # Authentification JWT
    ├── photos/                  # Gestion des photos
    └── users/                   # Gestion des utilisateurs
```

---

## Ajouter un nouveau module

```bash
# Générer un nouveau module avec NestJS CLI
npx nest generate module modules/mon-module
npx nest generate controller modules/mon-module
npx nest generate service modules/mon-module
```

Ensuite, créer :

- L'entité dans `src/entities/`
- Les DTOs dans `src/modules/mon-module/dto/`
- Les tests dans `src/modules/mon-module/`

---

## Fonctionnalités incluses

- **Authentification JWT** avec cookies sécurisés
- **Rate limiting** (protection contre le spam)
- **CORS** configurable
- **Helmet** (headers de sécurité)
- **Validation** des données entrantes
- **Swagger/OpenAPI** (documentation automatique)
- **Logging** structuré avec Winston
- **Tests** unitaires et E2E avec Jest
- **HTTPS** optionnel avec certificats SSL
- **Health check** endpoint

---

## Technologies utilisées

- **NestJS** v11 - Framework Node.js
- **TypeORM** - ORM pour SQL Server
- **SQL Server** 2022 - Base de données
- **Passport JWT** - Authentification
- **Swagger** - Documentation API
- **Jest** - Tests
- **Docker** - Conteneurisation

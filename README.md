## API_INOVEX

# POUR SQL Server
ATTENTION : Le service `SQL Server Browser` doit être démarré

# Tuto  utilisé :
https://ichi.pro/fr/creer-une-api-rest-a-l-aide-de-nodejs-et-mysql-a-partir-de-zero-14397877526049

# TODO FIRST : 
`npm install express mysql body-parser nodemailer nodemailer-smtp-transport cors --save`
### Attention !
Il faudra surement utiliser CORS pour permettre au requêtes de passer :
    `var cors = require('cors');
    app.use(cors());`
+ `npm install cors --save`

La commande `npm i` devrait suffir à elle seule pour tout installer

# Configurer les infos de connexion à la BDD :
Il suffit d'ouvrir le fichier `.env` et d'y mettre les bonnes infos

# Lancer l'API : 
`node server.js`
# Mode prod avec pm2 (npm i pm2 -g pour pouvoir l'utiliser de manière globale)
# Permet d'avoir des log et autre -> précisé avec la commande pm2 show
`pm2 startup` va permettre de tout redémarrer les pm2 en cas de redémarrage serveur ou plantage API
`pm2 save` save la liste des process en route
`pm2 start server.js --name API_CAP_EXPLOITATION -i max` ou `npm start` (le -i max permet de passer en cluster mode => mode perf pour la prod)
`pm2 list` pour voir tout ce qui tourne
`pm2 show API_CAP_EXPLOITATION` pour voir beaucoup d'info sur le process qui tourne
`pm2 restart API_CAP_EXPLOITATION` pour redémarrer

# Tester si l'API est en route :
se rendre à l'adresse : `http://localhost:numPort/`
le message suivant doit être affiché : "Welcome to INOVEX's API REST"


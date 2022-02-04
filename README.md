## API_INOVEX

# Tuto  utilisé :
https://ichi.pro/fr/creer-une-api-rest-a-l-aide-de-nodejs-et-mysql-a-partir-de-zero-14397877526049

# TODO FIRST : 
`npm install express mysql body-parser nodemailer nodemailer-smtp-transport cors --save`
### Attention !
Il faudra surement utiliser CORS pour permettre au requêtes de passer :
    `var cors = require('cors');
    app.use(cors());`
+ `npm install cors --save`

# Lancer l'API : 
`node server.js`

# Tester si l'API est en route :
se rendre à l'adresse : `http://localhost:numPort/`
le message suivant doit être affiché : "Welcome to INOVEX's API REST"


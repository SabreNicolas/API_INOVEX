// Middelware permettant de vérifier les tokens de l'api

//Libraire de gestion des tokens
const jwt = require('jsonwebtoken');
//Libraire de requêtes https asyncrone
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'; // Ignorer les erreurs de certificat (à utiliser avec précaution)

module.exports = async (req, res, next) => {
    
    try {
        //récupération du token
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        //vérification du token
        const decodedToken = jwt.verify(token, process.env.ACESS_TOKEN_SECRET);

        //Intérrogation de l'api pour vérifier si le token n'est pas désactivé
        const xhr = new XMLHttpRequest();
        let tabResult = [];
        let tabTokens = [];
        xhr.open('GET', 'https://localhost:3100/unauthorizedTokens',true);
        xhr.send();
        xhr.onreadystatechange =  function() {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    //récupération de la réponse
                    tabResult = JSON.parse(xhr.responseText);
                    tabResult = tabResult["recordset"];
                    //Copie des token dans tabTokens
                    for(i=0;i<tabResult.length;i++){
                        tabTokens.push(tabResult[i]['token']);
                    }
                    //Si le token n'est pas interdit on next sinon on interdit l'accès
                    if(!tabTokens.includes(authHeader)){
                        next();
                    }
                    else {
                        res.status(401).json({ token : "Token désactivé" });
                    }
                } else {
                    console.error('Error: ' + xhr.status);
                }
            }
        };
    }
    catch(error){
        res.status(401).json({ error });
    }
}   
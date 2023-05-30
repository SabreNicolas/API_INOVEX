// Middelware permettant de vérifier les tokens de l'api

//Libraire de gestion des tokens
const jwt = require('jsonwebtoken');
//utilisation des variables d'environnement
require('dotenv').config();
//create sql connection
const sql = require('mssql');
var sqlConfig = {
    server : process.env.HOST,
    authentication : {
      type : 'default',
      options : {
        userName : process.env.USER_BDD,
        password : process.env.PWD_BDD
      }
    },
    options : {
      //Si utilisation de Microsoft Azure, besoin d'encrypter
      encrypt : false,
      database : process.env.DATABASE
    }
  }
var pool =  new sql.ConnectionPool(sqlConfig);

pool.connect();

module.exports = async (req, res, next) => {
    
    try {
        //récupération du token
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        //vérification du token
        const decodedToken = jwt.verify(token, process.env.ACESS_TOKEN_SECRET);

        //Intérrogation de l'api pour vérifier si le token n'est pas désactivé
        const result = await pool.query("SELECT token FROM token where Enabled = 0");
  
        //Vérification de présence de token en bdd      
        
        let tabToken = [];
        //récupération de tout les tokens dans tabToken
        for(i=0;i<result.recordset.length;i++){
            tabToken.push(result.recordset[i]['token']);
        }
        //Si le token n'est pas interdit on next sinon on interdit l'accès
        if(!tabToken.includes(authHeader)){
            next();
        }
        else res.status(401).json({ token : "token désactivé" });
        
    }
    catch(error){
        res.status(401).json({ error });
    }
}   
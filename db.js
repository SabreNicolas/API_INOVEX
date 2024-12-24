const sql = require('mssql');

//Chaine de connexion
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

module.exports = pool;

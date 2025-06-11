/**
****** SQL SERVER ******
*/

//Gestion des tokens

//Libraire de gestion des tokens
const jwt = require('jsonwebtoken');
const middleware = require('./token/middleware.js');

//Fonction pour générer un token
function generateAcessToken(id) {
  return jwt.sign({ id }, process.env.ACESS_TOKEN_SECRET)
}

const express = require("express");
const bodyParser = require("body-parser");
//pour reécupérer les fichiers envoyés via formData
const multer = require('multer');
var cors = require('cors');
const nodemailer = require("nodemailer");
var smtpTransport = require('nodemailer-smtp-transport');
const app = express();
const path = require('path');
const fs = require('fs');
//DEBUT partie pour utiliser l'API en https
var https = require('https');
var privateKey = fs.readFileSync('E:/INOVEX/serverV3-decrypted.key', 'utf8');
var certificate = fs.readFileSync('E:/INOVEX/serverV3.crt', 'utf8');
var credentials = { key: privateKey, cert: certificate };
//FIN partie pour utiliser l'API en https
// parse requests of content-type: application/json
app.use(bodyParser.json({ limit: '100mb' }));
// parse requests of content-type: application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true, limit: '100mb' }));
//permet les requêtes cros domain
app.use(cors({ origin: "*" }));

//utilisation des variables d'environnement
require('dotenv').config();

/**Documentation avec Swagger UI**/
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
/**Documentation avec Swagger UI**/

const dateFormat = require('date-and-time');
const currentLine = require('get-current-line').default;

//Gestion des fichiers avec multer
const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, 'fichiers');
  },
  filename: (req, file, callback) => {
    const name = file.originalname.split(' ').join('_').replace(/[^\x00-\x7F]/g, "").replace("'", "_");
    //stockage du fichier d'image en mettant le nom en remplaçant les espaces par _
    callback(null, Date.now() + name);
  }
});
//repertoire des fichiers
app.use('/fichiers', express.static(path.join(__dirname, 'fichiers')));

//Tableau pour le mode hors ligne de la ronde
let BadgeAndElementsOfZone = [];
let listZones = [];
let tabEquipes = [];
let tabEnregistrementEquipes = [];
var valueElementDay;
var previousId = 0;
//create sql connection
const sql = require('mssql');
const { response } = require("express");
const { log } = require('console');

const port = process.env.PORT;
//Chaine de connexion
var sqlConfig = {
  server: process.env.HOST,
  authentication: {
    type: 'default',
    options: {
      userName: process.env.USER_BDD,
      password: process.env.PWD_BDD
    }
  },
  options: {
    //Si utilisation de Microsoft Azure, besoin d'encrypter
    encrypt: false,
    database: process.env.DATABASE
  }
}

var httpsServer = https.createServer(credentials, app);

var pool = new sql.ConnectionPool(sqlConfig);

//Stockage de la ligne d'erreur pour envoi de mail
let currentLineError = '';
//Stockage de la requête SQL en cas d'erreur
let reqSQL = '';

pool.connect();

var server = httpsServer.listen(port, function () {
  //var server = app.listen(port, function() {
  var host = server.address().address;
  var port = server.address().port;

  console.log("API CAP EXPLOITATION SQL SERVER en route sur http://%s:%s", host, port);
  console.log("***RESTART API***");
});

//Permet de récupérer les throw err pour ne pas faire crasher l'API et créer un ticket chez Kerlan
process.on('uncaughtException', (err, origin) => {
  messagePlantage.html = '<h1>' + err.name + '</h1>';
  messagePlantage.html += '<h2> Sur la ligne : ' + currentLineError.line + '</h2>';
  messagePlantage.html += '<h3>' + err.message + '</h3>';
  messagePlantage.html += '<p>' + err.stack + '</p><br>';
  messagePlantage.html += '<p>' + reqSQL + '</p>';
  console.log(err);
  //en preprod on envoi pas de mail pour éviter le spam
  /*transporter.sendMail(messagePlantage, function(errMail, info) {
    if (errMail) {
      console.log(errMail);
      //currentLineError=currentLine(); throw err;
    } else {
      console.log('Email sent: ' + info.response);
    }
  });*/
});

// simple route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to CAP EXPLOITATION's API REST for SQL Server" });
});

// Permet de vérifier que l'API est bien atteignable
app.get("/helloworld", (req, res) => {
  res.json("Hello World !");
});


/*EMAIL*/
var transporter = nodemailer.createTransport(smtpTransport({
  //service : process.SERVICE_SMTP,
  host: process.env.HOST_SMTP,
  port: process.env.PORT_SMTP,
  secureConnection: false,
  auth: {
    user: process.env.USER_SMTP,
    pass: process.env.PWD_SMTP
  },
  tls: {
    ciphers: 'SSLv3'
  },
}));

const messagePlantage = {
  from: process.env.USER_SMTP, // Sender address
  to: 'developpement@kerlan-info.fr',
  subject: 'PRE_PROD - API CAP EXPLOITATION', // Subject line
  html: '' //à compléter avant envoi
};

// define a sendmail endpoint, which will send emails and response with the corresponding status
app.get('/sendmail/:dateDeb/:heureDeb/:duree/:typeArret/:commentaire/:idUsine', function (req, res) {
  let mailListIdUsine = 'MAIL_LIST_' + req.params.idUsine;
  var maillist = process.env[mailListIdUsine];

  //On récupére le nom du site pour l'inscrire dans l'email
  pool.query("SELECT localisation FROM site WHERE id = " + req.params.idUsine, (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    let localisation = data['recordset'][0].localisation;

    //Envoi du mail
    const message = {
      from: process.env.USER_SMTP, // Sender address
      to: maillist,
      subject: '[' + localisation + '] Nouvel Arrêt Intempestif !!!', // Subject line
      html: '<h1>ATTENTION, un arrêt intempestif vient d\'être signalé pour le site de ' + localisation + ':</h1> ' +
        '<h2>' + req.params.typeArret + ' pour une durée de ' + req.params.duree + ' heure(s) à partir du ' + req.params.dateDeb + ' à ' + req.params.heureDeb + '.</h2>' +
        '<h3>Voici le commentaire : ' + req.params.commentaire + '</h3>'//Cors du mail en HTML
    };

    transporter.sendMail(message, function (err, info) {
      if (err) {
        console.log(err);
        //currentLineError=currentLine(); throw err;
      } else {
        console.log('Email sent: ' + info.response);
        res.json("mail OK");
      }
    });
  });
});


/* MORAL ENTITIES*/
//get all MoralEntities where Enabled = 1
//?Code=34343&idUsine=1
app.get("/moralEntities", middleware, (request, response) => {
  const reqQ = request.query
  pool.query("SELECT mr.Id, mr.CreateDate, mr.LastModifiedDate, mr.Name, mr.Address, mr.Enabled, mr.Code, mr.UnitPrice, p.Id as productId, LEFT(p.Name,CHARINDEX(' ',p.Name)) as produit, SUBSTRING(p.Name,CHARINDEX(' ',p.Name),500000) as collecteur FROM moralentities_new as mr " +
    "INNER JOIN products_new as p ON LEFT(p.Code,5) LIKE LEFT(mr.Code,5) AND p.idUsine = mr.idUsine " +
    "WHERE mr.idUsine = " + reqQ.idUsine + " AND mr.Enabled = 1 AND p.Code = LEFT(mr.Code,LEN(p.Code)) AND mr.Code LIKE '" + reqQ.Code + "%' ORDER BY Name ASC", (err, data) => {
      if (err) {
        currentLineError = currentLine(); throw err;
      }
      data = data['recordset'];
      response.json({ data });
    });
});

//Supprimer les mesures des entrants entre deux dates pour une usine
//?idUsine=7&dateDeb=YYYY-mm-dd&dateFin=YYYY-mm-dd
app.delete("/deleteMesuresEntrantsEntreDeuxDates", middleware, (request, response) => {
  const reqQ = request.query;
  let condDasri = "";
  //Si le site est NSL, on ne supprime pas les DASRIs lors de l'import
  if (reqQ.idUsine == 1) {
    condDasri = " AND mr.Code NOT LIKE '203%'";
  }
  pool.query("delete m from moralentities_new  mr join measures_new m on m.ProducerId = mr.id where idUsine = " + reqQ.idUsine + " and m.EntryDate >= '" + reqQ.dateDeb + "' and m.EntryDate <= '" + reqQ.dateFin + "'" + condDasri
    , (err, data) => {
      if (err) {
        currentLineError = currentLine(); throw err;
      }
      response.json("Suppression des mesures OK")
    });
});

//Supprimer les mesures des sortants entre deux dates pour une usine
//?idUsine=7&dateDeb=YYYY-mm-dd&dateFin=YYYY-mm-dd&name=???
app.delete("/deleteMesuresSortantsEntreDeuxDates", middleware, (request, response) => {
  const reqQ = request.query
  const name = reqQ.name.replace(/'/g, "''");
  pool.query("delete m from measures_new m join products_new p on p.Id=m.ProductId join import_tonnageSortants i on i.ProductId = p.id where Enabled = 1 AND p.idUsine = " + reqQ.idUsine + " and m.EntryDate >= '" + reqQ.dateDeb + "' and m.EntryDate <= '" + reqQ.dateFin + "' and i.productImport = '" + name + "'", (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    response.json("Suppression des mesures OK")
  });
});

//Supprimer les mesures des sortants entre deux dates pour une usine
//?idUsine=7&dateDeb=YYYY-mm-dd&dateFin=YYYY-mm-dd&name=???
app.delete("/deleteMesuresReactifsEntreDeuxDates", middleware, (request, response) => {
  const reqQ = request.query
  const name = reqQ.name.replace(/'/g, "''");
  pool.query("delete m from measures_new m join products_new p on p.Id=m.ProductId join import_tonnageReactifs i on i.ProductId = p.id where Enabled = 1 AND p.idUsine = " + reqQ.idUsine + " and m.EntryDate >= '" + reqQ.dateDeb + "' and m.EntryDate <= '" + reqQ.dateFin + "' and i.productImport = '" + name + "'", (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    response.json("Suppression des mesures OK")
  });
});

//get all MoralEntities
//?Code=34343&idUsine=1
app.get("/moralEntitiesAll", middleware, (request, response) => {
  const reqQ = request.query
  pool.query("SELECT mr.Id, mr.CreateDate, mr.LastModifiedDate, mr.Name, mr.Address, mr.Enabled, mr.Code, mr.UnitPrice, p.Id as productId, mr.numCAP, mr.codeDechet, mr.nomClient, mr.prenomClient, mr.mailClient, LEFT(p.Name,CHARINDEX(' ',p.Name)) as produit, SUBSTRING(p.Name,CHARINDEX(' ',p.Name),500000) as collecteur FROM moralentities_new as mr " +
    "INNER JOIN products_new as p ON LEFT(p.Code,5) LIKE LEFT(mr.Code,5) AND p.idUsine = mr.idUsine " +
    "WHERE mr.idUsine = " + reqQ.idUsine + " AND p.Code = LEFT(mr.Code,LEN(p.Code)) AND mr.Code LIKE '" + reqQ.Code + "%' ORDER BY Name ASC", (err, data) => {
      if (err) {
        currentLineError = currentLine(); throw err;
      }
      data = data['recordset'];
      response.json({ data });
    });
});

//create MoralEntitie
//?Name=c&Address=d&Code=f&UnitPrice=g&numCAP=sh&codeDechet=dg&nomClient=dg&prenomClient=fg&mailClient=dh&idUsine=1
//ATTENION Unit Price doit contenir un . pour les décimales
app.put("/moralEntitie", middleware, (request, response) => {
  const reqQ = request.query
  const query = "INSERT INTO moralentities_new (CreateDate, LastModifiedDate, Name, Address, Enabled, Code, UnitPrice, numCAP, codeDechet, nomClient, prenomClient, mailClient, idUsine) VALUES (convert(varchar, getdate(), 120), convert(varchar, getdate(), 120), '" + reqQ.Name + "', '" + reqQ.Address + "', 1, '" + reqQ.Code + "', " + reqQ.UnitPrice + ", '" + reqQ.numCAP + "', '" + reqQ.codeDechet + "', '" + reqQ.nomClient + "', '" + reqQ.prenomClient + "','" + reqQ.mailClient + "', " + reqQ.idUsine + ")";
  pool.query(query, (err, result, fields) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    response.json("Création du client OK");
  });
});

//get Last Code INOVEX
//?Code=29292&idUsine=1
app.get("/moralEntitieLastCode", middleware, (request, response) => {
  const reqQ = request.query
  pool.query("SELECT TOP 1 Code FROM moralentities_new WHERE CODE LIKE '" + reqQ.Code + "%' AND idUsine = " + reqQ.idUsine + " ORDER BY Code DESC", (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    data = data['recordset'];
    response.json({ data });
  });
});

//get One MoralEntitie
app.get("/moralEntitie/:id", middleware, (request, response) => {
  const reqP = request.params
  pool.query("SELECT * FROM moralentities_new WHERE Id = " + reqP.id, (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    data = data['recordset'];
    response.json({ data });
  });
});

//get One MoralEntitie
app.get("/getOneUser/:id", middleware, (request, response) => {
  const reqP = request.params
  pool.query("SELECT * FROM users WHERE Id = " + reqP.id, (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    data = data['recordset'];
    response.json({ data });
  });
});

//UPDATE MoralEntitie, set UnitPrice & Code
//?UnitPrice=2.3&Code=1234
//ATTENION Unit Price doit contenir un . pour les décimales
app.put("/moralEntitie/:id", middleware, (request, response) => {
  const reqQ = request.query
  const reqP = request.params
  pool.query("UPDATE moralentities_new SET UnitPrice = " + reqQ.UnitPrice + ", Code = " + reqQ.Code + " WHERE Id = " + reqP.id, (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    response.json("Mise à jour du prix unitaire et code INOVEX OK")
  });
});

//UPDATE MoralEntitie, set UnitPrice
//?UnitPrice=2.3
//ATTENION Unit Price doit contenir un . pour les décimales
app.put("/moralEntitieUnitPrice/:id", middleware, (request, response) => {
  const reqQ = request.query
  const reqP = request.params
  pool.query("UPDATE moralentities_new SET UnitPrice = " + reqQ.UnitPrice + ", LastModifiedDate = convert(varchar, getdate(), 120) WHERE Id = " + reqP.id, (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    response.json("Mise à jour du prix unitaire OK")
  });
});

//UPDATE MoralEntitie, changeALL
//?Name=d&Address=d&Code=12&UnitPrice=1&numCAP=123&codeDechet=34343&nomClient=dhddg&prenomClient=dhdhdh&mailClient=dhggdgd
//ATTENION Unit Price doit contenir un . pour les décimales
app.put("/moralEntitieAll/:id", middleware, (request, response) => {
  const reqQ = request.query
  const reqP = request.params
  pool.query("UPDATE moralentities_new SET mailClient = '" + reqQ.mailClient + "', prenomClient = '" + reqQ.prenomClient + "', nomClient = '" + reqQ.nomClient + "', codeDechet = '" + reqQ.codeDechet + "', numCAP = '" + reqQ.numCAP + "', Code = '" + reqQ.Code + "', Address = '" + reqQ.Address + "', Name = '" + reqQ.Name + "', UnitPrice = '" + reqQ.UnitPrice + "', LastModifiedDate = convert(varchar, getdate(), 120) WHERE Id = " + reqP.id, (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    response.json("Mise à jour du MR OK")
  });
});

//UPDATE MoralEntitie, set CAP
//?cap=123
app.put("/moralEntitieCAP/:id", middleware, (request, response) => {
  const reqQ = request.query
  const reqP = request.params
  pool.query("UPDATE moralentities_new SET numCAP = '" + reqQ.cap + "', LastModifiedDate = convert(varchar, getdate(), 120) WHERE Id = " + reqP.id, (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    response.json("Mise à jour du CAP OK")
  });
});

//UPDATE MoralEntitie, set Code
//?Code=123
app.put("/moralEntitieCode/:id", middleware, (request, response) => {
  const reqQ = request.query
  const reqP = request.params
  pool.query("UPDATE moralentities_new SET Code = " + reqQ.Code + ", LastModifiedDate = convert(varchar, getdate(), 120) WHERE Id = " + reqP.id, (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    response.json("Mise à jour du code OK")
  });
});

//UPDATE MoralEntitie, set Enabled
app.put("/moralEntitieEnabled/:id/:enabled", middleware, (request, response) => {
  const reqP = request.params
  pool.query("UPDATE moralentities_new SET Enabled = " + reqP.enabled + ", LastModifiedDate = convert(varchar, getdate(), 120) WHERE Id = " + reqP.id, (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    response.json("Changement de visibilité du client OK")
  });
});

//UPDATE MoralEntitie, set Name
//?Name=tetet
app.put("/moralEntitieName/:id", middleware, (request, response) => {
  const reqQ = request.query
  const reqP = request.params
  pool.query("UPDATE moralentities_new SET Name = '" + reqQ.Name + "', LastModifiedDate = convert(varchar, getdate(), 120) WHERE Id = " + reqP.id, (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    response.json("Changement de nom du client OK")
  });
});

//DELETE MoralEntitie
app.delete("/moralEntitie/:id", middleware, (request, response) => {
  const reqP = request.params
  pool.query("DELETE FROM moralentities_new WHERE Id = " + reqP.id, (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    response.json("Suppression du client OK")
  });
});

/*CATEGORIES*/
//get ALL Categories for compteurs
app.get("/CategoriesCompteurs", middleware, (request, response) => {
  const reqQ = request.query
  pool.query("SELECT cat.Id, cat.CreateDate, cat.LastModifieddate, cat.Name, cat.Enabled, cat.Code, cat.ParentId, cat2.Name as ParentName " +
    "FROM categories_new as cat LEFT JOIN categories_new as cat2 ON cat.ParentId = cat2.Id " +
    "WHERE cat.Enabled = 1 AND LEN(cat.Code) > 1  AND cat.Name NOT LIKE 'Tonnage%' AND cat.Name NOT LIKE 'Cendres%' AND cat.Code NOT LIKE '701%' AND cat.Name NOT LIKE 'Mâchefers%' AND cat.Name NOT LIKE 'Arrêts%' AND cat.Name NOT LIKE 'Autres consommables%' AND cat.Name NOT LIKE 'Déchets détournés%' AND cat.Name NOT LIKE 'Ferraille et autres%' AND cat.Name NOT LIKE 'Analyses%' ORDER BY cat.Name ASC", (err,data) => {
      if (err) {
        currentLineError = currentLine(); throw err;
      }
      data = data['recordset'];
      response.json({ data });
    });
});

//get ALL Categories for analyses
app.get("/CategoriesAnalyses", middleware, (request, response) => {
  const reqQ = request.query
  pool.query("SELECT cat.Id, cat.CreateDate, cat.LastModifieddate, cat.Name, cat.Enabled, cat.Code, cat.ParentId, cat2.Name as ParentName " +
    "FROM categories_new as cat LEFT JOIN categories_new as cat2 ON cat.ParentId = cat2.Id " +
    "WHERE cat.Enabled = 1 AND LEN(cat.Code) > 1  AND cat.Name LIKE 'Analyses%' ORDER BY cat.Name ASC", (err,data) => {
      if (err) {
        currentLineError = currentLine(); throw err;
      }
      data = data['recordset'];
      response.json({ data });
    });
});

//get ALL Categories for sortants
app.get("/CategoriesSortants", middleware, (request, response) => {
  const reqQ = request.query
  pool.query("SELECT cat.Id, cat.CreateDate, cat.LastModifieddate, cat.Name, cat.Enabled, cat.Code, cat.ParentId, cat2.Name as ParentName " +
    "FROM categories_new as cat LEFT JOIN categories_new as cat2 ON cat.ParentId = cat2.Id " +
    "WHERE cat.Code LIKE '50%' AND cat.Name NOT LIKE 'Résidus de Traitement' ORDER BY cat.Name ASC", (err, data) => {
      if (err) {
        currentLineError = currentLine(); throw err;
      }
      data = data['recordset'];
      response.json({ data });
    });
});

//create Categorie
//?Name=c&Code=f&ParentId=g
app.put("/Category", middleware, (request, response) => {
  const reqQ = request.query
  const query = "INSERT INTO categories_new (CreateDate, LastModifiedDate, Name, Enabled, Code, ParentId) VALUES (convert(varchar, getdate(), 120), convert(varchar, getdate(), 120), '" + reqQ.Name + "', 1, '" + reqQ.Code + "', " + reqQ.ParentId + ")";
  pool.query(query, (err, result, fields) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    response.json("Création de la catégorie OK");
  });
});

//get ONE Categorie
app.get("/Category/:Id", middleware, (request, response) => {
  const reqP = request.params
  pool.query("SELECT * FROM categories_new WHERE Id = " + reqP.Id, (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    data = data['recordset'];
    response.json({ data });

  });
});

//Get Catégories filles d'une catégorie mère
app.get("/Categories/:ParentId", middleware, (request, response) => {
  const reqP = request.params
  pool.query("SELECT * FROM categories_new WHERE ParentId = " + reqP.ParentId, (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    data = data['recordset'];
    response.json({ data });

  });
});

//get Last Code INOVEX 
//?Code=29292&idUsine=1 
app.get("/productLastCode", middleware, (request, response) => {
  const reqQ = request.query
  pool.query("SELECT TOP 1 Code FROM products_new WHERE idUsine = " + reqQ.idUsine + " AND CODE LIKE '" + reqQ.Code + "%' ORDER BY Code DESC", (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    data = data['recordset'];
    response.json({ data });
  });
});

/*PRODUCTS*/
//get ALL Products
app.get("/Products", middleware, (request, response) => {
  const reqQ = request.query
  pool.query("SELECT * FROM products_new", (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    data = data['recordset'];
    response.json({ data });;
  });
});

//get ALL Products with type param
//?Name=dgdgd&idUsine=1
app.get("/Products/:TypeId", middleware, (request, response) => {
  const reqQ = request.query
  const reqP = request.params
  pool.query("SELECT * FROM products_new WHERE idUsine = " + reqQ.idUsine + " AND typeId = " + reqP.TypeId + " AND Name LIKE '%" + reqQ.Name + "%' ORDER BY Name ASC", (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    data = data['recordset'];
    response.json({ data });

  });
});

//Créer un formulaire
//?nom=zlfhe&idUsine=1
app.put("/createFormulaire", middleware, (request, response) => {
  const reqQ = request.query
  pool.query("INSERT INTO formulaire(nom,idUsine) OUTPUT INSERTED.idFormulaire VALUES('" + reqQ.nom + "'," + reqQ.idUsine + ")", (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    data = data['recordset'];
    response.json({ data });
  });
});

//Modifier un formulaire
//?nom=zlfhe&idFormulaire=1
app.put("/updateFormulaire", middleware, (request, response) => {
  const reqQ = request.query
  pool.query("UPDATE formulaire SET nom ='" + reqQ.nom + "' WHERE idFormulaire =" + reqQ.idFormulaire, (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    data = data['recordset'];
    response.json({ data });
  });
});

//Supprimer les produits d'un formulaire
//?idFormulaire=????
app.delete("/deleteProduitFormulaire", middleware, (request, response) => {
  const reqQ = request.query
  pool.query("DELETE FROM formulaire_affectation WHERE idFormulaire = " + reqQ.idFormulaire, (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    response.json("Suppression du produit OK");
  });
});

//Supprimer un formulaire
//?idFormulaire=????
app.delete("/deleteFormulaire", middleware, (request, response) => {
  const reqQ = request.query
  pool.query("DELETE FROM formulaire WHERE idFormulaire = " + reqQ.idFormulaire, (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    response.json("Suppression du produit OK");
  });
});

//Créer un formulaire affectation
//?alias=zlfhe&idFormiualire=1&idProduit=1234
app.put("/createFormulaireAffectation", middleware, (request, response) => {
  const reqQ = request.query
  pool.query("INSERT INTO formulaire_affectation(idFormulaire,idProduct,alias) VALUES(" + reqQ.idFormulaire + "," + reqQ.idProduit + ",'" + reqQ.alias + "')", (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    response.json("Affectation OK");
  });
});

//get formulaires d'une usine
//?idUsine=1
app.get("/getFormulaires", middleware, (request, response) => {
  const reqQ = request.query
  pool.query("SELECT * FROM formulaire WHERE idUsine = " + reqQ.idUsine, (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    data = data['recordset'];
    response.json({ data });
  });
});

//get un formulaire d'une usine
//?idFormulaire=1
app.get("/getOneFormulaire", middleware, (request, response) => {
  const reqQ = request.query
  pool.query("SELECT * FROM formulaire WHERE idFormulaire = " + reqQ.idFormulaire, (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    data = data['recordset'];
    response.json({ data });
  });
});

//get les produits d'un formulaire
//?idFormulaire=1
app.get("/getProduitsFormulaire", middleware, (request, response) => {
  const reqQ = request.query
  pool.query("SELECT * FROM formulaire_affectation WHERE idFormulaire = " + reqQ.idFormulaire + 'order by alias', (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    data = data['recordset'];
    response.json({ data });
  });
});

//get one Products 
//?idUsine=1
app.get("/getOneProduct/:id", middleware, (request, response) => {
  const reqQ = request.query
  const reqP = request.params
  pool.query("SELECT id,Name FROM products_new WHERE idUsine = " + reqQ.idUsine + " AND id = " + reqP.id, (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    data = data['recordset'];
    response.json({ data });
  });
});

//get ALL Products 
//?idUsine=1
app.get("/AllProducts", middleware, (request, response) => {
  const reqQ = request.query
  pool.query("SELECT * FROM products_new WHERE idUsine = " + reqQ.idUsine + " and Enabled = 1 and CODE not LIKE '2%' and name NOT LIKE '%arret%' and name NOT LIKE '%depassement%' and name not like 'baisse de charge%' ORDER BY Name ASC", (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    data = data['recordset'];
    response.json({ data });
  });
});


//get ALL Products with type param
//?Name=dgdgd&idUsine=1
app.get("/ProductsAndElementRondier/:TypeId", middleware, (request, response) => {
  const reqQ = request.query
  const reqP = request.params
  let type;
  //pour tout récupérer sans prendre en compte le type
  if (reqP.TypeId == '_') {
    type = "typeId > 0 AND ";
  }
  else type = "typeId = " + reqP.TypeId + " AND ";
  pool.query("SELECT p.*, e.nom as nomElementRondier FROM products_new p FULL OUTER JOIN elementcontrole e ON e.Id = p.idElementRondier WHERE idUsine = " + reqQ.idUsine + " AND " + type + "Name LIKE '%" + reqQ.Name + "%' ORDER BY Name ASC", (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    data = data['recordset'];
    response.json({ data });
  });
});

//get product avec un tag pour une usine (sauf ceux pour lesquelles on veut récupérer la dernière valeur de la journée)
//?idUsine=1
app.get("/getProductsWithTagClassique", middleware, (request, response) => {
  const reqQ = request.query
  pool.query("SELECT *  FROM products_new WHERE TAG IS NOT NULL AND TAG NOT LIKE '%EVELER%' AND (typeRecupEMonitoring NOT LIKE 'derniere' OR typeRecupEMonitoring IS NULL) AND LEN(TAG) > 0 and idUsine = " + reqQ.idUsine, (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    data = data['recordset'];
    response.json({ data });
  });
});

//get product avec un tag pour une usine (UNIQUEMENT ceux pour lesquelles on veut récupérer la dernière valeur de la journée)
//?idUsine=1
app.get("/getProductsWithTagDerniere", middleware, (request, response) => {
  const reqQ = request.query
  pool.query("SELECT *  FROM products_new WHERE TAG IS NOT NULL AND TAG NOT LIKE '%EVELER%' AND typeRecupEMonitoring LIKE 'derniere' AND LEN(TAG) > 0 and idUsine = " + reqQ.idUsine, (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    data = data['recordset'];
    response.json({ data });
  });
});

//get products avec un élément rondier (pour récupération auto des valeurs rondier)
//?idUsine=?
app.get("/getProductsWithElementRondier", middleware, (request, response) => {
  const reqQ = request.query
  pool.query("select * from products_new WHERE idElementRondier IS NOT NULL AND idUsine = " + reqQ.idUsine, (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    data = data['recordset'];
    response.json({ data });;
  });
});

//get Container DASRI
app.get("/productsEntrants/:idUsine", middleware, (request, response) => {
  const reqP = request.params
  pool.query("SELECT * from products_new WHERE idUsine = " + reqP.idUsine + " AND typeId = 1 AND Code NOT LIKE '2%'", (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    data = data['recordset'];
    response.json({ data });
  });
});

//UPDATE Product, change name
app.put("/updateProductName", middleware, (request, response) => {
  const reqQ = request.query
  pool.query("UPDATE products_new SET Name = '" + reqQ.newName + "' WHERE Name = '" + reqQ.lastName + "'", (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    response.json("Changement du nom du produit OK")
  });
});

//UPDATE Product, change Enabled
app.put("/productEnabled/:id/:enabled", middleware, (request, response) => {
  const reqP = request.params
  pool.query("UPDATE products_new SET Enabled = " + reqP.enabled + " , LastModifiedDate = convert(varchar, getdate(), 120) WHERE Id = " + reqP.id, (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    response.json("Changement de visibilité du client OK")
  });
});

//UPDATE Product, change TypeId
app.put("/productType/:id/:type", middleware, (request, response) => {
  const reqP = request.params
  pool.query("UPDATE products_new SET TypeId = " + reqP.type + " , LastModifiedDate = convert(varchar, getdate(), 120) WHERE Id = " + reqP.id, (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    response.json("Changement de catégorie du produit OK")
  });
});

//UPDATE Product, set Unit
//?Unit=123
app.put("/productUnit/:id", middleware, (request, response) => {
  const reqQ = request.query
  const reqP = request.params
  pool.query("UPDATE products_new SET Unit = '" + reqQ.Unit + "', LastModifiedDate = convert(varchar, getdate(), 120) WHERE Id = " + reqP.id, (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    response.json("Mise à jour de l'unité OK")
  });
});

//Update le type de récup emonitoring et le type de la données
//?id=1&typeRecup=tifMax&colonneBDD=typeRecupEMonitoring
app.put("/updateRecupEMonitoring", middleware, (request, response) => {
  const reqQ = request.query
  var update = "UPDATE products_new SET " + reqQ.colonneBDD + " = '" + reqQ.typeRecup + "' WHERE Id = " + reqQ.id;
  if (reqQ.typeRecup == "null") update = "UPDATE products_new SET typeRecupEMonitoring = NULL WHERE Id = " + reqQ.id;
  pool.query(update, (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    response.json("Changement du type de récupération OK")
  });
});

//get ALL Compteurs
//?Code=ddhdhhd&idUsine=1&name=fff
app.get("/Compteurs", middleware, (request, response) => {
  const reqQ = request.query
  pool.query("SELECT * FROM products_new WHERE idUsine = " + reqQ.idUsine + " AND typeId = 4 AND Enabled = 1 AND Name NOT LIKE 'Arrêt%' AND Name NOT LIKE 'HEURES D''ARRET%' AND Name NOT LIKE 'BAISSE DE CHARGE%' AND Code NOT LIKE '701%' AND Name NOT LIKE 'Temps%' AND NAME LIKE '%" + reqQ.name + "%' AND Code LIKE '" + reqQ.Code + "%' ORDER BY Name", (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    data = data['recordset'];
    response.json({ data });
  });
});

//get ALL QSE
//&idUsine=1
app.get("/QSE", middleware, (request, response) => {
  const reqQ = request.query
  pool.query("SELECT * FROM products_new WHERE idUsine = " + reqQ.idUsine + " AND Code LIKE '701%' ORDER BY Name", (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    data = data['recordset'];
    response.json({ data });

  });
});

//get ALL Compteurs for arrêts
//?Code=ddhdhhd&idUsine=1
app.get("/CompteursArrets", middleware, (request, response) => {
  const reqQ = request.query
  pool.query("SELECT * FROM products_new WHERE idUsine = " + reqQ.idUsine + " AND typeId = 4 AND Name NOT LIKE 'Temps%' AND Enabled = 1 AND Code LIKE '" + reqQ.Code + "%' ORDER BY Name", (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    data = data['recordset'];
    response.json({ data });
  });
});

//get ALL Analyses
//?Code=ddhdhhd&idUsine=1 
app.get("/Analyses", middleware, (request, response) => {
  const reqQ = request.query
  pool.query("SELECT * FROM products_new WHERE idUsine = " + reqQ.idUsine + " AND typeId = 6 AND Enabled = 1 AND Code LIKE '" + reqQ.Code + "%' AND Name NOT LIKE '%1/2%' AND Name NOT LIKE '%DEPASSEMENT%' ORDER BY Name", (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    data = data['recordset'];
    response.json({ data });

  });
});

//get Analyses/ Dépassements 1/2 heures
app.get("/AnalysesDep/:idUsine", middleware, (request, response) => {
  const reqP = request.params
  pool.query("SELECT * FROM products_new WHERE idUsine = " + reqP.idUsine + " AND typeId = 6 AND Enabled = 1 AND Code LIKE '60104%' ORDER BY Name", (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    data = data['recordset'];
    response.json({ data });

  });
});

//get ALL Sortants
//?Code=ddhdhhd&idUsine=1
app.get("/Sortants", middleware, (request, response) => {
  const reqQ = request.query
  pool.query("SELECT * FROM products_new WHERE idUsine = " + reqQ.idUsine + " AND typeId = 5 AND Enabled = 1 AND Code LIKE '" + reqQ.Code + "%' ORDER BY Name", (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    data = data['recordset'];
    response.json({ data });

  });
});

//get ALL reactifs livraison
//?idUsine=1
app.get("/reactifs", middleware, (request, response) => {
  const reqQ = request.query
  pool.query("SELECT * FROM products_new WHERE idUsine = " + reqQ.idUsine + " and Name LIKE '%LIVRAISON%' and Enabled = 1 order by Name", (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    data = data['recordset'];
    response.json({ data });

  });
});

//get ALL conso & others
app.get("/Consos/:idUsine", middleware, (request, response) => {
  const reqP = request.params
  pool.query("SELECT * FROM products_new WHERE idUsine = " + reqP.idUsine + " AND typeId = 2 AND Enabled = 1 AND Code NOT LIKE '801%' ORDER BY Name", (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    data = data['recordset'];
    response.json({ data });

  });
});

//get ALL pci
app.get("/pci/:idUsine", middleware, (request, response) => {
  const reqP = request.params
  pool.query("SELECT * FROM products_new WHERE idUsine = " + reqP.idUsine + " AND typeId = 2 AND Enabled = 1 AND Code LIKE '801%' ORDER BY Name", (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    data = data['recordset'];
    response.json({ data });
  });
});

//create Product
//?Name=c&Code=f&typeId=g&Unit=j&idUsine=1&TAG=sdhdhdh
app.put("/Product", middleware, (request, response) => {
  const reqQ = request.query;
  reqQ.Name = reqQ.Name.replace("'", " ");
  const query = "INSERT INTO products_new (CreateDate, LastModifiedDate, Name, Enabled, Code, typeId, Unit, idUsine, TAG) VALUES (convert(varchar, getdate(), 120), convert(varchar, getdate(), 120), '" + reqQ.Name + "', 0, '" + reqQ.Code + "', " + reqQ.typeId + ", '" + reqQ.Unit + "', " + reqQ.idUsine + ", '" + reqQ.TAG + "')";
  pool.query(query, (err, result, fields) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    response.json("Création du produit OK");
  });
});

//get ONE Product
app.get("/Product/:Id", middleware, (request, response) => {
  const reqQ = request.query
  pool.query("SELECT * FROM products_new WHERE Id = " + reqP.Id, (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    data = data['recordset'];
    response.json({ data });
  });
});

/*
******* FILTRES DECHETS / COLLECTEURS
*/

//Get déchets & collecteurs pour la gestion des filtres entrants en fonction de l'idUsine
app.get("/DechetsCollecteurs/:idUsine", middleware, (request, response) => {
  const reqP = request.params
  pool.query("SELECT Name, Code FROM products_new WHERE Code Like '2%' AND idUsine = " + reqP.idUsine + " ORDER BY Code ASC", (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    data = data['recordset'];
    response.json({ data })
  });
});


/*
******* FIN FILTRES DECHETS / COLLECTEURS
*/


/*MEASURES*/
//create Measure
//?EntryDate=1&Value=1&ProductId=1&ProducerId=1
//ATTENION Value doit contenir un . pour les décimales
app.put("/Measure", middleware, (request, response) => {
  const reqQ = request.query;
  let value = reqQ.Value.replace(',', '.');
  // Si la valeur est nulle
  if (value === '' || value === ' ') {
    value = 0.0;
  }
  queryOnDuplicate = "IF NOT EXISTS (SELECT * FROM measures_new WHERE EntryDate = '" + reqQ.EntryDate + "' AND ProducerId = " + reqQ.ProducerId + " AND ProductId = " + reqQ.ProductId + ")" +
    " BEGIN " +
    "INSERT INTO measures_new (CreateDate, LastModifiedDate, EntryDate, Value, ProductId, ProducerId)" +
    " VALUES (convert(varchar, getdate(), 120), convert(varchar, getdate(), 120),'" + reqQ.EntryDate + "', " + value + ", " + reqQ.ProductId + ", " + reqQ.ProducerId + ") " +
    "END" +
    " ELSE" +
    " BEGIN " +
    "UPDATE measures_new SET Value = " + value + ", LastModifiedDate = convert(varchar, getdate(), 120) WHERE EntryDate = '" + reqQ.EntryDate + "' AND ProducerId = " + reqQ.ProducerId + " AND ProductId =" + reqQ.ProductId +
    " END;"
  pool.query(queryOnDuplicate, (err, result, fields) => {
    if (err) {
      reqSQL = queryOnDuplicate;
      reqSQL += "************" + value + "*************";
      currentLineError = currentLine(); throw err;
    }
    response.json("Création du Measures OK");
  });
});

//get Entry
app.get("/Entrant/:ProductId/:ProducerId/:Date", middleware, (request, response) => {
  const reqP = request.params
  pool.query("SELECT Value FROM measures_new WHERE ProductId = " + reqP.ProductId + " AND ProducerId = " + reqP.ProducerId + " AND EntryDate LIKE '" + reqP.Date + "%'", (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    data = data['recordset'];
    response.json({ data });
  });
});

//get value products
app.get("/ValuesProducts/:ProductId/:Date", middleware, (request, response) => {
  const reqP = request.params
  pool.query("SELECT Value FROM measures_new WHERE ProductId = " + reqP.ProductId + " AND EntryDate LIKE '" + reqP.Date + "%'", (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    data = data['recordset'];
    response.json({ data });
  });
});

//get Total by day and Type
app.get("/TotalMeasures/:Dechet/:Date/:idUsine", middleware, (request, response) => {
  const reqP = request.params
  pool.query("SELECT COALESCE(SUM(m.Value),0) as Total FROM measures_new m INNER JOIN products_new p ON m.ProductId = p.Id WHERE p.idUsine = " + reqP.idUsine + " AND m.EntryDate LIKE '" + reqP.Date + "%' AND m.ProducerId > 1 AND p.Code LIKE '" + reqP.Dechet + "%'", (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    data = data['recordset'];
    response.json({ data });
  });
});



/* SAISIE MENSUELLE */
//get value compteurs
//?idUsine=1
app.get("/Compteurs/:Code/:Date", middleware, (request, response) => {
  const reqQ = request.query
  const reqP = request.params
  pool.query("SELECT Value FROM saisiemensuelle WHERE idUsine = " + reqQ.idUsine + " AND Code = '" + reqP.Code + "' AND Date LIKE '" + reqP.Date + "%'", (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    data = data['recordset'];
    response.json({ data });
  });
});

//create saisie compteurs
//?Date=1&Value=1&Code=aaa&idUsine=1
//ATTENION Value doit contenir un . pour les décimales
app.put("/SaisieMensuelle", middleware, (request, response) => {
  const reqQ = request.query
  queryOnDuplicate = "IF NOT EXISTS (SELECT * FROM saisiemensuelle WHERE Date = '" + reqQ.Date + "' AND Code = " + reqQ.Code + " AND idUsine = " + reqQ.idUsine + ")" +
    " BEGIN " +
    "INSERT INTO saisiemensuelle (Date, Code, Value, idUsine) VALUES ('" + reqQ.Date + "', " + reqQ.Code + ", " + reqQ.Value + ", " + reqQ.idUsine + ") " +
    "END" +
    " ELSE" +
    " BEGIN " +
    "UPDATE saisiemensuelle SET Value = " + reqQ.Value + " WHERE Date = '" + reqQ.Date + "' AND Code = " + reqQ.Code + " AND idUsine = " + reqQ.idUsine +
    " END;"
  pool.query(queryOnDuplicate, (err, result, fields) => {
    //if(err) console.log(err);
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    response.json("Création du saisiemensuelle OK");
  });
});


/*DEPASSEMENT*/
//?dateDebut=dd&dateFin=dd&duree=zz&user=0&dateSaisie=zz&description=erre&productId=2
app.put("/Depassement", middleware, (request, response) => {
  const reqQ = request.query
  pool.query("INSERT INTO depassements (date_heure_debut, date_heure_fin, duree, [user], date_saisie, description, productId) VALUES ('" + reqQ.dateDebut + "', '" + reqQ.dateFin + "', " + reqQ.duree + ", " + reqQ.user + ", '" + reqQ.dateSaisie + "', '" + reqQ.description + "', " + reqQ.productId + ") "
    , (err, result, fields) => {
      if (err) response.json("Création du DEP KO");
      else response.json("Création du DEP OK");
    });
});

//Modifier un dépassement
//?dateDebut=dd&dateFin=dd&duree=zz&user=0&dateSaisie=zz&description=erre&productId=2
app.put("/updateDepassement/:id", middleware, (request, response) => {
  const reqQ = request.query
  const reqP = request.params
  pool.query("update depassements set date_heure_debut = '" + reqQ.dateDebut + "', date_heure_fin = '" + reqQ.dateFin + "', duree =" + reqQ.duree + ", date_saisie='" + reqQ.dateSaisie + "', description='" + reqQ.description + "', productId=" + reqQ.productId + " WHERE id = " + reqP.id
    , (err, result, fields) => {
      if (err) {
        currentLineError = currentLine(); throw err;
      }
      else response.json("Modif du dep ok");
    });
});

//Récupérer l'historique des dépassements pour un mois
app.get("/Depassements/:dateDeb/:dateFin/:idUsine", middleware, (request, response) => {
  const reqP = request.params
  pool.query("SELECT a.Id, p.Name, convert(varchar, CAST(a.date_heure_debut as datetime2), 103) as dateDebut, convert(varchar, CAST(a.date_heure_debut as datetime2), 108) as heureDebut, convert(varchar, CAST(a.date_heure_fin as datetime2), 103) as dateFin, convert(varchar, CAST(a.date_heure_fin as datetime2), 108) as heureFin, a.duree, a.description FROM depassements a INNER JOIN products_new p ON p.Id = a.productId WHERE p.idUsine = " + reqP.idUsine + " AND CAST(a.date_heure_debut as datetime2) BETWEEN '" + reqP.dateDeb + "' AND '" + reqP.dateFin + "' ORDER BY p.Name, a.date_heure_debut ASC", (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    data = data['recordset'];
    response.json({ data });
  });
});

//Récupérer un dépassement
app.get("/getOneDepassement/:id", middleware, (request, response) => {
  const reqP = request.params
  pool.query("SELECT a.Id, a.productId, p.Name, convert(varchar, CAST(a.date_heure_debut as datetime2), 103) as dateDebut, convert(varchar, CAST(a.date_heure_debut as datetime2), 108) as heureDebut, convert(varchar, CAST(a.date_heure_fin as datetime2), 103) as dateFin, convert(varchar, CAST(a.date_heure_fin as datetime2), 108) as heureFin, a.duree, a.description FROM depassements a INNER JOIN products_new p ON p.Id = a.productId WHERE a.id = " + reqP.id, (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    data = data['recordset'];
    response.json({ data });
  });
});

//Supprimer Dépassement
app.delete("/DeleteDepassement/:id", middleware, (request, response) => {
  const reqP = request.params
  pool.query("DELETE FROM depassements WHERE Id = " + reqP.id, (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    response.json("Suppression du DEP OK");
  });
});

//Récupérer le total des dépassements pour 1 ligne
app.get("/DepassementsSumFour/:dateDeb/:dateFin/:idUsine/:numLigne", middleware, (request, response) => {
  const reqP = request.params
  pool.query("SELECT 'Total Ligne " + reqP.numLigne + "' as Name, COALESCE(SUM(a.duree),0) as Duree FROM depassements a INNER JOIN products_new p ON a.productId = p.Id WHERE p.idUsine = " + reqP.idUsine + " AND CAST(a.date_heure_debut as datetime2) BETWEEN '" + reqP.dateDeb + "' AND '" + reqP.dateFin + "' AND p.Code LIKE '601040" + reqP.numLigne + "01'", (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    data = data['recordset'];
    response.json({ data });
  });
});

//Récupérer le total des dépassements
app.get("/DepassementsSum/:dateDeb/:dateFin/:idUsine", middleware, (request, response) => {
  const reqP = request.params
  pool.query("SELECT 'Total' as Name, COALESCE(SUM(a.duree),0) as Duree FROM depassements a INNER JOIN products_new p ON p.Id = a.productId WHERE p.idUsine = " + reqP.idUsine + " AND CAST(a.date_heure_debut as datetime2) BETWEEN '" + reqP.dateDeb + "' AND '" + reqP.dateFin + "'", (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    data = data['recordset'];
    response.json({ data });
  });
});

/*ARRETS*/
//?dateDebut=dd&dateFin=dd&duree=zz&user=0&dateSaisie=zz&description=erre&productId=2
app.put("/Arrets", middleware, (request, response) => {
  const reqQ = request.query
  const reqP = request.params
  pool.query("INSERT INTO arrets (date_heure_debut, date_heure_fin, duree, [user], date_saisie, description, productId) VALUES ('" + reqQ.dateDebut + "', '" + reqQ.dateFin + "', " + reqQ.duree + ", " + reqQ.user + ", '" + reqQ.dateSaisie + "', '" + reqQ.description + "', " + reqQ.productId + ")"
    , (err, result, fields) => {
      if (err) response.json("Création de l'arret KO");
      else response.json("Création de l'arret OK");
    });
});

//Modifier un arrêt
//?dateDebut=dd&dateFin=dd&duree=zz&user=0&dateSaisie=zz&description=erre&productId=2
app.put("/updateArret/:id", middleware, (request, response) => {
  const reqQ = request.query
  const reqP = request.params
  pool.query("update arrets set date_heure_debut = '" + reqQ.dateDebut + "', date_heure_fin = '" + reqQ.dateFin + "', duree =" + reqQ.duree + ", date_saisie='" + reqQ.dateSaisie + "', description='" + reqQ.description + "', productId=" + reqQ.productId + " WHERE id = " + reqP.id
    , (err, result, fields) => {
      if (err) {
        currentLineError = currentLine(); throw err;
      }
      else response.json("Modif de l'arret OK");
    });
});

//Récupérer l'historique des arrêts pour un mois
app.get("/Arrets/:dateDeb/:dateFin/:idUsine", middleware, (request, response) => {
  const reqP = request.params
  pool.query("SELECT a.Id, p.Name, convert(varchar, CAST(a.date_heure_debut as datetime2), 103) as dateDebut, convert(varchar, CAST(a.date_heure_debut as datetime2), 108) as heureDebut, convert(varchar, CAST(a.date_heure_fin as datetime2), 103) as dateFin, convert(varchar, CAST(a.date_heure_fin as datetime2), 108) as heureFin, a.duree, a.description FROM arrets a INNER JOIN products_new p ON p.Id = a.productId WHERE p.idUsine = " + reqP.idUsine + " AND CAST(a.date_heure_debut as datetime2) BETWEEN '" + reqP.dateDeb + "' AND '" + reqP.dateFin + "' ORDER BY p.Name, a.date_heure_debut ASC", (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    data = data['recordset'];
    response.json({ data });
  });
});

//Récupérer un arrêt
app.get("/getOneArret/:id", middleware, (request, response) => {
  const reqP = request.params
  pool.query("SELECT a.Id, a.productId, p.Name, convert(varchar, CAST(a.date_heure_debut as datetime2), 103) as dateDebut, convert(varchar, CAST(a.date_heure_debut as datetime2), 108) as heureDebut, convert(varchar, CAST(a.date_heure_fin as datetime2), 103) as dateFin, convert(varchar, CAST(a.date_heure_fin as datetime2), 108) as heureFin, a.duree, a.description FROM arrets a INNER JOIN products_new p ON p.Id = a.productId WHERE a.id = " + reqP.id, (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    data = data['recordset'];
    response.json({ data });
  });
});

//Supprimer Arret
app.delete("/DeleteArret/:id", middleware, (request, response) => {
  const reqP = request.params
  pool.query("DELETE FROM arrets WHERE Id = " + reqP.id, (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    response.json("Suppression de l'arrêt OK");
  });
});

//Récupérer le total des arrêts par groupe
app.get("/ArretsSumGroup/:dateDeb/:dateFin/:idUsine", middleware, (request, response) => {
  const reqP = request.params
  pool.query("SELECT p.Name, SUM(a.duree) as Duree FROM arrets a INNER JOIN products_new p ON p.Id = a.productId WHERE p.idUsine = " + reqP.idUsine + " AND CAST(a.date_heure_debut as datetime2) BETWEEN '" + reqP.dateDeb + "' AND '" + reqP.dateFin + "' GROUP BY p.Name", (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    data = data['recordset'];
    response.json({ data });
  });
});

//Récupérer le total des arrêts
app.get("/ArretsSum/:dateDeb/:dateFin/:idUsine", middleware, (request, response) => {
  const reqP = request.params
  pool.query("SELECT 'Total' as Name, COALESCE(SUM(a.duree),0) as Duree FROM arrets a INNER JOIN products_new p ON p.Id = a.productId WHERE p.idUsine = " + reqP.idUsine + " AND CAST(a.date_heure_debut as datetime2) BETWEEN '" + reqP.dateDeb + "' AND '" + reqP.dateFin + "'", (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    data = data['recordset'];
    response.json({ data });
  });
});

//Récupérer le total des arrêts pour 1 four
app.get("/ArretsSumFour/:dateDeb/:dateFin/:idUsine/:numFour", middleware, (request, response) => {
  const reqP = request.params
  pool.query("SELECT 'Total Four " + reqP.numFour + "' as Name, COALESCE(SUM(a.duree),0) as Duree FROM arrets a INNER JOIN products_new p ON a.productId = p.Id WHERE p.idUsine = " + reqP.idUsine + " AND CAST(a.date_heure_debut as datetime2) BETWEEN '" + reqP.dateDeb + "' AND '" + reqP.dateFin + "' AND p.Name LIKE '%" + reqP.numFour + "%'", (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    data = data['recordset'];
    response.json({ data });
  });
});

/*USERS*/
//?nom=dd&prenom=dd&login=zz&pwd=0&isRondier=1&isSaisie=0&isQSE=0&isRapport=0&isChefQuart=1&isAdmin=01idUsine=1
app.put("/User", middleware, (request, response) => {
  const reqQ = request.query
  pool.query("INSERT INTO users (Nom, Prenom, login, pwd, isRondier, isSaisie, isQSE, isRapport, isChefQuart, isAdmin, idUsine) VALUES ('" + reqQ.nom + "', '" + reqQ.prenom + "', '" + reqQ.login + "', '" + reqQ.pwd + "', " + reqQ.isRondier + ", " + reqQ.isSaisie + ", " + reqQ.isQSE + ", " + reqQ.isRapport + ", " + reqQ.isChefQuart + ", " + reqQ.isAdmin + ", " + reqQ.idUsine + ") "
    , (err, result, fields) => {
      if (err) response.json("Création de l'utilisateur KO");
      else response.json("Création de l'utilisateur OK");
    });
});

//Récupérer l'ensemble des utilisateurs
//?login=aaaa&idUsine=1
app.get("/Users", middleware, (request, response) => {
  const reqQ = request.query
  pool.query("SELECT * FROM users WHERE login LIKE '%" + reqQ.login + "%' AND idUsine = " + reqQ.idUsine + " ORDER BY Nom ASC", (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    data = data['recordset'];
    response.json({ data });
  });
});

//Récupérer l'ensemble des utilisateurs d'un site ayant un email renseigné
//?idUsine=1
app.get("/UsersEmail", middleware, (request, response) => {
  const reqQ = request.query
  pool.query("SELECT * FROM users WHERE LEN(email) > 0 AND idUsine = " + reqQ.idUsine + " ORDER BY Nom ASC", (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    data = data['recordset'];
    response.json({ data });
  });
});

//Récupérer l'ensemble des utilisateurs d'un site ayant les droits ayant les droits rondier
//?idUsine=1
app.get("/UsersRondier", (request, response) => {
  const reqQ = request.query
  pool.query("SELECT Nom, Prenom, Id, posteUser FROM users WHERE isRondier = 1 AND idUsine = " + reqQ.idUsine + " ORDER BY Nom ASC", (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    data = data['recordset'];
    response.json({ data });
  });
});

//Récupérer l'ensemble des utilisateurs d'un site ayant les droits chef de quart
//?idUsine=1
app.get("/UsersChefQuart", (request, response) => {
  const reqQ = request.query
  pool.query("SELECT Nom, Prenom, Id, posteUser FROM users WHERE isChefQuart = 1 AND idUsine = " + reqQ.idUsine + " ORDER BY Nom ASC", (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    data = data['recordset'];
    response.json({ data });
  });
});

//Récupérer l'utilisateur qui est connecté et Connexion
app.get("/User/:login/:pwd", (request, response) => {
  const reqP = request.params
  //pour protéger la connexion tablette des users avec un apostrophe
  let login = reqP.login.replace("'", "''");
  pool.query("SELECT * FROM users WHERE login = '" + login + "' AND pwd = '" + reqP.pwd + "'", (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    data = data['recordset'];
    //Si on a une valeur de retour on génère un token
    if (data.length > 0) {
      const token = generateAcessToken(data[0]["Id"])
      response.send({
        'data': data,
        token
      });
    }
    else response.json({ data })
  });
});

//Permet de verifier si l'identifiant est déjà utilisé
app.get("/User/:login", middleware, (request, response) => {
  const reqP = request.params
  pool.query("SELECT * FROM users WHERE login = '" + reqP.login + "'", (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    data = data['recordset'];
    response.json({ data });
  });
});

//Update du mdp utilisateur
app.put("/User/:login/:pwd", middleware, (request, response) => {
  const reqP = request.params
  pool.query("UPDATE users SET pwd = '" + reqP.pwd + "' WHERE login = '" + reqP.login + "'", (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    response.json("Mise à jour du mot de passe OK")
  });
});

//Update droit rondier
app.put("/UserRondier/:login/:droit", middleware, (request, response) => {
  const reqP = request.params
  pool.query("UPDATE users SET isRondier = '" + reqP.droit + "' WHERE login = '" + reqP.login + "'", (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    response.json("Mise à jour du droit OK")
  });
});

//Update droit saisie
app.put("/UserSaisie/:login/:droit", middleware, (request, response) => {
  const reqP = request.params
  pool.query("UPDATE users SET isSaisie = '" + reqP.droit + "' WHERE login = '" + reqP.login + "'", (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    response.json("Mise à jour du droit OK")
  });
});

//Update droit QSE
app.put("/UserQSE/:login/:droit", middleware, (request, response) => {
  const reqP = request.params
  pool.query("UPDATE users SET isQSE = '" + reqP.droit + "' WHERE login = '" + reqP.login + "'", (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    response.json("Mise à jour du droit OK")
  });
});

//Update droit rapport
app.put("/UserRapport/:login/:droit", middleware, (request, response) => {
  const reqP = request.params
  pool.query("UPDATE users SET isRapport = '" + reqP.droit + "' WHERE login = '" + reqP.login + "'", (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    response.json("Mise à jour du droit OK")
  });
});

//Update droit chef quart
app.put("/UserChefQuart/:login/:droit", middleware, (request, response) => {
  const reqP = request.params
  pool.query("UPDATE users SET isChefQuart = '" + reqP.droit + "' WHERE login = '" + reqP.login + "'", (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    response.json("Mise à jour du droit OK")
  });
});

//Update droit Mail
app.put("/UserMail/:login/:droit", middleware, (request, response) => {
  const reqP = request.params
  pool.query("UPDATE users SET isMail = '" + reqP.droit + "' WHERE login = '" + reqP.login + "'", (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    response.json("Mise à jour du droit OK")
  });
});

//Update droit admin
app.put("/UserAdmin/:login/:droit", middleware, (request, response) => {
  const reqP = request.params
  pool.query("UPDATE users SET isAdmin = '" + reqP.droit + "' WHERE login = '" + reqP.login + "'", (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    response.json("Mise à jour du droit OK")
  });
});

//Update info user
//?infoValue=ehhehehe
app.put("/UserInfos/:login/:info", middleware, (request, response) => {
  const reqP = request.params;
  const reqQ = request.query;
  pool.query("UPDATE users SET " + reqP.info + " = '" + reqQ.infoValue + "' WHERE login = '" + reqP.login + "'", (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    response.json("Mise à jour info OK")
  });
});

//DELETE User
app.delete("/user/:id", middleware, (request, response) => {
  const reqP = request.params
  pool.query("DELETE FROM users WHERE Id = " + reqP.id, (err, data) => {
    if (err) {
      response.json("Suppression du user KO")
    }
    else response.json("Suppression du user OK")
  });
});

//Récupérer l'ensemble des users non affecté à un badge
app.get("/UsersLibre/:idUsine", middleware, (request, response) => {
  const reqP = request.params
  pool.query("SELECT * FROM users WHERE idUsine = " + reqP.idUsine + " AND Id NOT IN (SELECT userId FROM badge WHERE userId IS NOT NULL) ORDER BY Nom ASC", (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    data = data['recordset'];
    response.json({ data });
  });
});

//*********************
/*******RONDIER*******/
//*********************

/*Badge*/
//?uid=AD:123:D23&idUsine=1
app.put("/Badge", middleware, (request, response) => {
  const reqQ = request.query
  pool.query("INSERT INTO badge (uid, idUsine) VALUES ('" + reqQ.uid + "', " + reqQ.idUsine + ")"
    , (err, result, fields) => {
      if (err) response.json("Création du badge KO");
      else response.json("Création du badge OK");
    });
});

//Récupérer le dernier ID de badge inséré
app.get("/BadgeLastId", middleware, (request, response) => {
  const reqQ = request.query
  pool.query("SELECT IDENT_CURRENT('badge') as Id", (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    data = data['recordset'];
    response.json({ data });
  });
});

//Récupérer l'utilisateur lié au badge
app.get("/UserOfBadge/:uid", (request, response) => {
  const reqP = request.params
  pool.query("SELECT u.Id, u.Nom, u.Prenom, u.login, u.idUsine, u.pwd, u.isRondier, u.isSaisie, u.isQSE, u.isRapport, u.isAdmin FROM users u INNER JOIN badge b ON b.userId = u.Id WHERE b.uid LIKE '" + reqP.uid + "'", (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    data = data['recordset'];
    response.json({ data });
  });
});

//Récupérer les elements de controle lié à la zone qui est lié au badge
app.get("/ElementsOfBadge/:uid", (request, response) => {
  const reqP = request.params
  pool.query("SELECT e.Id, e.zoneId, z.nom as 'NomZone', z.commentaire, e.nom, e.valeurMin, e.valeurMax, e.typeChamp, e.isFour, e.isGlobal, e.unit, e.defaultValue, e.isRegulateur, e.listValues FROM elementcontrole e INNER JOIN zonecontrole z ON e.zoneId = z.Id INNER JOIN badge b ON b.zoneId = z.Id WHERE b.uid LIKE '" + reqP.uid + "'", (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    data = data['recordset'];
    response.json({ data });
  });
});

//Récupérer l'ensemble des badges affecté à un User
app.get("/BadgesUser/:idUsine", middleware, (request, response) => {
  const reqP = request.params
  pool.query("SELECT b.Id, b.isEnabled, b.userId, b.zoneId, b.uid, u.login as affect FROM badge b INNER JOIN users u ON u.Id = b.userId WHERE b.idUsine = " + reqP.idUsine, (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    data = data['recordset'];
    response.json({ data });
  });
});

//Récupérer l'ensemble des badges affecté à une zone
app.get("/BadgesZone/:idUsine", middleware, (request, response) => {
  const reqP = request.params
  pool.query("SELECT b.Id, b.isEnabled, b.userId, b.zoneId, b.uid, z.nom as affect FROM badge b INNER JOIN zonecontrole z ON z.Id = b.zoneId WHERE b.idUsine = " + reqP.idUsine, (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    data = data['recordset'];
    response.json({ data });
  });
});

//Récupérer l'ensemble des badges non affecté
app.get("/BadgesLibre/:idUsine", middleware, (request, response) => {
  const reqP = request.params
  pool.query("SELECT * FROM badge b WHERE b.idUsine = " + reqP.idUsine + " AND b.userId IS NULL AND b.zoneId IS NULL AND b.Id NOT IN (SELECT p.badgeId FROM permisfeu p WHERE p.dateHeureDeb <= convert(varchar, getdate(), 120) AND p.dateHeureFin > convert(varchar, getdate(), 120))", (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    data = data['recordset'];
    response.json({ data });
  });
});

//Update enabled
app.put("/BadgeEnabled/:id/:enabled", middleware, (request, response) => {
  const reqP = request.params
  pool.query("UPDATE badge SET isEnabled = '" + reqP.enabled + "' WHERE Id = '" + reqP.id + "'", (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    response.json("Mise à jour de l'activation OK")
  });
});

//Update affectation
app.put("/BadgeAffectation/:id/:typeAffectation/:idAffectation", middleware, (request, response) => {
  const reqP = request.params
  pool.query("UPDATE badge SET " + reqP.typeAffectation + " = '" + reqP.idAffectation + "' WHERE Id = '" + reqP.id + "'", (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    response.json("Mise à jour de l'affectation OK")
  });
});

//Update de la zone choisi par Calce
app.put("/insertionIdZoneCalce/:idRondier/:idEquipe", (request, response) => {
  const req = request.query
  pool.query("UPDATE affectation_equipe SET idZone = " + req.idZone + " WHERE idRondier = " + request.params.idRondier + " AND idEquipe = " + request.params.idEquipe + "", (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    response.json("Ajout ok");
  });
});

//Update affectation => retirer les affectations
app.put("/BadgeDeleteAffectation/:id", middleware, (request, response) => {
  const reqP = request.params
  pool.query("UPDATE badge SET userId = NULL, zoneId = NULL WHERE Id = '" + reqP.id + "'", (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    response.json("Mise à jour de l'affectation OK")
  });
});

//Update affectation => retirer les affectations
app.put("/deleteBadge/:id", middleware, (request, response) => {
  const reqP = request.params
  pool.query("delete from badge where Id = '" + reqP.id + "'", (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    response.json("Suppression du badge OK")
  });
});

/*Zone de controle*/

//Créer une zone de contrôle
//?nom=dggd&commentaire=fff&four=1&idUsine=1
app.put("/zone", middleware, (request, response) => {
  const reqQ = request.query
  pool.query("INSERT INTO zonecontrole (nom, commentaire, four, idUsine) VALUES ('" + reqQ.nom + "', '" + reqQ.commentaire + "', " + reqQ.four + ", " + reqQ.idUsine + ")"
    , (err, result, fields) => {
      if (err) response.json("Création de la zone KO");
      else response.json("Création de la zone OK");
    });
});

//Supprimer une zone de controle
//?Id=1
app.delete("/deleteZone", middleware, (request, response) => {
  const reqQ = request.query
  pool.query("DELETE FROM zonecontrole WHERE Id = " + reqQ.Id, (err, result, fields) => {
    if (err) response.json("Suppression de la zone KO");
    else response.json("Suppression OK");
  });
});

//Récupérer l'ensemble des zones de controle
app.get("/zones/:idUsine", middleware, (request, response) => {
  const reqP = request.params
  pool.query("SELECT * FROM zonecontrole WHERE idUsine = " + reqP.idUsine + " ORDER BY nom ASC", (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    data = data['recordset'];
    response.json({ data });
  });
});

//Récupérer l'ensemble des zones de controle
app.get("/zones/:idUsine", middleware, (request, response) => {
  const reqP = request.params
  pool.query("SELECT * FROM zonecontrole WHERE idUsine = " + reqP.idUsine + " ORDER BY nom ASC", (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    data = data['recordset'];
    response.json({ data });
  });
});

//Récupérer l'ensemble des zones de controle de Calce pour menu déroulant
// ?idUsine=7&datedeb=''&dateFin=''
app.get("/recupZoneCalce", (request, response) => {
  const reqQ = request.query
  pool.query("select c.idZone as Id, z.nom as 'nom' from quart_calendrier c INNER JOIN zonecontrole z on z.id = c.idZone where c.termine = 0 AND c.date_heure_debut = '" + reqQ.dateDeb + "' and c.idUsine = " + reqQ.idUsine, async (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    data = data['recordset'];
    response.json({ data });
  });
});

//Récupérer l'ensemble des zones de controle
//?quart=1
app.get("/getZonesAndAnomaliesOfDay/:idUsine/:date", middleware, (request, response) => {
  listZones = [];
  const reqQ = request.query
  const reqP = request.params
  if (reqQ.quart == 0) {
    var query = "SELECT * from ronde where dateHeure = '" + reqP.date + "' and idUsine =" + reqP.idUsine
  }
  else {
    var query = "SELECT * from ronde where dateHeure = '" + reqP.date + "' and idUsine =" + reqP.idUsine + 'and quart=' + reqQ.quart
  }
  pool.query(query, async (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    data = data['recordset'];
    //On boucle sur chaque zone et son badge pour récupérer ses éléments
    for await (const ronde of data) {
      await getZonesAndAnomaliesOfRonde(ronde);
    };
    response.json({ listZones });
  });
});

//Récupérer l'ensemble des zones de controle
app.get("/getAnomaliesOfOneDay/:idUsine/:date", middleware, (request, response) => {
  listZones = [];
  const reqQ = request.query
  const reqP = request.params
  if (reqQ.quart == 0) {
    var query = "select anomalie.*, z.nom from anomalie join ronde on ronde.id = anomalie.rondeId join zonecontrole z on z.Id = anomalie.zoneId  where ronde.dateHeure = '" + reqP.date + "' and ronde.idUsine = " + reqP.idUsine
  }
  else {
    var query = "select anomalie.*, z.nom from anomalie join ronde on ronde.id = anomalie.rondeId join zonecontrole z on z.Id = anomalie.zoneId where ronde.dateHeure = '" + reqP.date + "' and ronde.idUsine = " + reqP.idUsine + " and ronde.quart = " + reqQ.quart
  }
  pool.query(query, async (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    data = data['recordset'];
    response.json({ data });
  });
});

//Récupérer l'ensemble des zones de controle
app.get("/getElementsAndValuesOfDay/:idUsine/:date", middleware, (request, response) => {
  listZones = [];
  const reqQ = request.query;
  const reqP = request.params;
  if (reqQ.quart == 0) {
    var query = "SELECT e.*, r.Id as 'idRonde', m.value, m.id as 'idMesure' FROM mesuresrondier m INNER JOIN elementcontrole e ON m.elementId = e.Id FULL OUTER JOIN groupement g ON g.id = e.idGroupement INNER JOIN ronde r ON r.Id = m.rondeId INNER JOIN zonecontrole z ON z.Id = e.zoneId WHERE r.dateHeure = '" + reqP.date + "' and r.idUsine = " + reqP.idUsine + " ORDER BY z.nom, e.ordre"
  }
  else {
    var query = "SELECT e.*, r.Id as 'idRonde', m.value, m.id as 'idMesure' FROM mesuresrondier m INNER JOIN elementcontrole e ON m.elementId = e.Id FULL OUTER JOIN groupement g ON g.id = e.idGroupement INNER JOIN ronde r ON r.Id = m.rondeId INNER JOIN zonecontrole z ON z.Id = e.zoneId WHERE r.dateHeure = '" + reqP.date + "' and r.idUsine = " + reqP.idUsine + " and r.quart = " + reqQ.quart + " ORDER BY z.nom, e.ordre"
  }
  pool.query(query, async (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    data = data['recordset'];
    response.json({ data });
  });
});


function getZonesAndAnomaliesOfRonde(ronde) {
  return new Promise((resolve) => {
    //Récupération des zones
    pool.query("select DISTINCT z.*, a.* from mesuresrondier m join elementcontrole e on e.id = m.elementId join zonecontrole z on z.id =e.zoneId full outer join anomalie a on (a.rondeId=" + ronde["Id"] + " and a.zoneId=z.id)where m.rondeId=" + ronde["Id"] + "order by z.nom", async (err, data) => {
      if (err) {
        currentLineError = currentLine(); throw err;
      }
      zones = data['recordset'];
      let oneZone = {
        IdRonde: ronde["Id"],
        listZones: zones
      };
      listZones.push(oneZone)
      resolve();
    });

  });
}

//POUR MODE HORS LIGNE
//Récupérer l'ensemble des zones, le badge associé et les éléments de contrôle associé ainsi que la valeur de la ronde précédente
app.get("/BadgeAndElementsOfZone/:idUsine", (request, response) => {
  BadgeAndElementsOfZone = [];
  const reqP = request.params
  pool.query("SELECT z.Id as zoneId, z.nom as nomZone, z.commentaire, z.four, b.uid as uidBadge from zonecontrole z INNER JOIN badge b ON b.zoneId = z.Id WHERE b.isEnabled = 1 AND z.idUsine = " + reqP.idUsine + " ORDER BY z.nom ASC", async (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    else {
      data = data['recordset'];
      //On récupère l'Id de la ronde précedente
      //await getPreviousId(reqP.idUsine);
      //On boucle sur chaque zone et son badge pour récupérer ses éléments
      for await (const zone of data) {
        await getElementsHorsLigne(zone);
      };
      response.json({ BadgeAndElementsOfZone });
    }
  });
});

//Récupérer l'ensemble des zones, les modes OPs associés et les éléments de contrôle associé ainsi que la valeur de la ronde précédente
app.get("/elementsOfUsine/:idUsine", (request, response) => {
  BadgeAndElementsOfZone = [];
  const reqP = request.params
  pool.query("SELECT z.Id as zoneId, z.nom as nomZone, z.commentaire, z.four from zonecontrole z WHERE z.idUsine = " + reqP.idUsine + " ORDER BY z.nom ASC", async (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    else {
      data = data['recordset'];
      //On récupère l'Id de la ronde précedente
      //await getPreviousId(reqP.idUsine);
      //On boucle sur chaque zone et son badge pour récupérer ses éléments
      for await (const zone of data) {
        await getElementsHorsLigne(zone);
      };
      response.json({ BadgeAndElementsOfZone });
    }
  });
});

function getElementsHorsLigne(zone) {
  return new Promise((resolve) => {
    let modesOp;
    //Récupération des modesOP
    pool.query("SELECT * FROM modeoperatoire m WHERE zoneId = " + zone.zoneId, (err, data) => {
      if (err) {
        currentLineError = currentLine(); throw err;
      }
      else {
        modesOp = data['recordset'];
        pool.query("SELECT e.Id, e.zoneId, e.nom, e.valeurMin, e.valeurMax, e.typeChamp, e.unit, e.defaultValue, e.isRegulateur, e.listValues, e.isCompteur, e.infoSup, e.CodeEquipement, m.value as previousValue, g.groupement FROM elementcontrole e LEFT JOIN mesuresrondier m ON e.Id = m.elementId AND m.rondeId = (SELECT top 1 rondeId from mesuresrondier where elementId = e.Id AND value not like '/' order by rondeId desc) FULL OUTER JOIN groupement g ON g.id = e.idGroupement WHERE e.zoneId = " + zone.zoneId + "ORDER BY g.groupement, e.ordre ASC", (err, data) => {
          if (err) {
            currentLineError = currentLine(); throw err;
          }
          else {
            data = data['recordset'];
            let OneBadgeAndElementsOfZone = {
              id: zone.id,
              zoneId: zone.zoneId,
              zone: zone.nomZone,
              commentaire: zone.commentaire,
              badge: zone.uidBadge,
              four: zone.four,
              groupement: zone.groupement,
              modeOP: modesOp,
              termine: zone.termine,
              nomRondier: zone.nomRondier,
              prenomRondier: zone.prenomRondier,
              elements: data
            };
            resolve();
            BadgeAndElementsOfZone.push(OneBadgeAndElementsOfZone);
          }
        });
      }
    });
  });
}


//Récupérer l'ensemble des zones, pour lesquelles on a des valeur sur une ronde donnée
app.get("/BadgeAndElementsOfZoneWithValues/:idUsine/:idRonde", (request, response) => {
  BadgeAndElementsOfZone = [];
  const reqP = request.params
  if (reqP.idUsine == 7) {
    var requete = "SELECT z.Id as zoneId, z.nom as nomZone, z.commentaire, z.four from zonecontrole z WHERE z.idUsine = " + reqP.idUsine + " ORDER BY z.nom ASC"
  }
  else var requete = "SELECT distinct z.Id as zoneId, z.nom as nomZone, z.commentaire, z.four, b.uid as uidBadge from zonecontrole z INNER JOIN badge b ON b.zoneId = z.Id WHERE z.idUsine = " + reqP.idUsine + " ORDER BY z.nom ASC"
  pool.query(requete, async (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    else {
      data = data['recordset'];
      //On récupère l'Id de la ronde précedente
      //getPreviousId(reqP.idUsine);
      //On boucle sur chaque zone et son badge pour récupérer ses éléments
      for await (const zone of data) {
        await getElementsWithValues(zone, reqP.idRonde);
      };
      response.json({ BadgeAndElementsOfZone });
    }
  });
});

//récupère les éléments pour lesquelle on a des valeurs pour une ronde donnée.
function getElementsWithValues(zone, idRonde) {
  return new Promise((resolve) => {
    let modesOp;
    //Récupération des modesOP
    pool.query("SELECT * FROM modeoperatoire m WHERE zoneId = " + zone.zoneId, (err, data) => {
      if (err) {
        currentLineError = currentLine(); throw err;
      }
      else {
        modesOp = data['recordset'];

        pool.query("SELECT e.Id, e.zoneId, e.nom, e.valeurMin, e.valeurMax, e.typeChamp, e.unit, e.defaultValue, e.isRegulateur, e.listValues, e.isCompteur, m.value as previousValue, g.groupement FROM mesuresrondier m INNER JOIN elementcontrole e ON m.elementId = e.Id FULL OUTER JOIN groupement g ON g.id = e.idGroupement INNER JOIN ronde r ON r.Id = m.rondeId INNER JOIN zonecontrole z ON z.Id = e.zoneId WHERE r.Id =" + idRonde + " and e.zoneId =" + zone.zoneId + " ORDER BY z.nom,g.groupement,e.ordre", (err, data) => {
          if (err) {
            currentLineError = currentLine(); throw err;
          }
          else {
            data = data['recordset'];
            let OneBadgeAndElementsOfZone = {
              zoneId: zone.zoneId,
              zone: zone.nomZone,
              commentaire: zone.commentaire,
              badge: zone.uidBadge,
              four: zone.four,
              groupement: zone.groupement,
              modeOP: modesOp,
              elements: data
            };
            resolve();
            if (data.length != 0)
              BadgeAndElementsOfZone.push(OneBadgeAndElementsOfZone);
          }
        });
      }
    });
  });
}

//Récupérer la ronde affecté à un utilisateur et ses éléments de controle
app.get("/ElementsOfRonde/:idUsine/:idUser", (request, response) => {
  BadgeAndElementsOfZone = [];
  const reqP = request.params
  pool.query("SELECT z.Id as zoneId, z.nom as nomZone, z.commentaire, z.four, idRondier from zonecontrole z inner join affectation_equipe e on e.idZone = z.Id WHERE z.idUsine = " + reqP.idUsine + " and e.idRondier = " + reqP.idUser + " ORDER BY z.nom ASC ", async (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    else {
      //On récupère l'Id de la ronde précedente
      data = data['recordset'];
      //await getPreviousId(reqP.idUsine);
      //On récupère les éléments de la zone
      await getElementsHorsLigneUser(data);

      response.json({ BadgeAndElementsOfZone });
    }
  });
});

function getElementsHorsLigneUser(zone) {
  return new Promise((resolve) => {
    let modesOp;
    //Récupération des modesOP
    if (zone[0] != undefined) {
      pool.query("SELECT * FROM modeoperatoire m WHERE zoneId = " + zone[0]['zoneId'], (err, data) => {
        if (err) {
          currentLineError = currentLine(); throw err;
        }
        else {
          modesOp = data['recordset'];
          pool.query("SELECT e.Id, e.zoneId, e.nom, e.valeurMin, e.valeurMax, e.typeChamp, e.unit, e.defaultValue, e.isRegulateur, e.listValues, e.CodeEquipement, e.isCompteur, m.value as previousValue, g.groupement FROM elementcontrole e LEFT JOIN mesuresrondier m ON e.Id = m.elementId AND m.rondeId = (SELECT top 1 rondeId from mesuresrondier where elementId = e.Id AND value not like '/' order by rondeId desc) FULL OUTER join groupement g on e.idGroupement = g.id WHERE e.zoneId = " + zone[0]['zoneId'] + "ORDER BY g.groupement, e.ordre ASC"
            , (err, data) => {
              if (err) {
                currentLineError = currentLine(); throw err;
              }
              else {
                data = data['recordset'];
                let OneElementOfZone = {
                  zoneId: zone[0]['zoneId'],
                  zone: zone[0]['nomZone'],
                  commentaire: zone[0]['commentaire'],
                  four: zone[0]['four'],
                  modeOP: modesOp,
                  groupement: zone[0]['groupement'],
                  elements: data
                };
                resolve();
                BadgeAndElementsOfZone.push(OneElementOfZone);
              }
            });
        }
      });
    }
    else resolve();
  });
}

//Fonction qui renvoie l'id de la dernière ronde
function getPreviousId(id) {
  return new Promise((resolve) => {
    pool.query("SELECT TOP 2 Id from ronde WHERE idUsine = " + id + " ORDER BY Id DESC", (err, data) => {
      if (err) {
        currentLineError = currentLine(); throw err;
      }
      else {
        data = data['recordset'];
        if (data.length > 1) {
          previousId = data[1].Id;
        } else previousId = 0;
      };
      resolve();
    });
  })
}

//Update commentaire
app.put("/zoneCommentaire/:id/:commentaire", middleware, (request, response) => {
  const reqP = request.params;
  reqP.commentaire.replace("'", "''");
  pool.query("UPDATE zonecontrole SET commentaire = '" + reqP.commentaire + "' WHERE Id = '" + reqP.id + "'", (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    response.json("Mise à jour du commentaire OK")
  });
});

//Update nom
//?nom=test
app.put("/zoneNom/:id", middleware, (request, response) => {
  const reqQ = request.query
  const reqP = request.params
  reqQ.nom = reqQ.nom.replace("'", " ");
  pool.query("UPDATE zonecontrole SET nom = '" + reqQ.nom + "' WHERE Id = '" + reqP.id + "'", (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    response.json("Mise à jour du nom OK")
  });
});

//Update num four
//?four=1
app.put("/zoneFour/:id", middleware, (request, response) => {
  const reqQ = request.query;
  const reqP = request.params;
  pool.query("UPDATE zonecontrole SET four = " + reqQ.four + " WHERE Id = " + reqP.id, (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    response.json("Mise à jour du four OK")
  });
});

//Récupérer l'ensemble des zones non affecté à un badge
app.get("/ZonesLibre/:idUsine", middleware, (request, response) => {
  const reqQ = request.query
  const reqP = request.params
  pool.query("SELECT * FROM zonecontrole WHERE idUsine = " + reqP.idUsine + " AND Id NOT IN (SELECT zoneId FROM badge WHERE zoneId IS NOT NULL) ORDER BY nom ASC", (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    data = data['recordset'];
    response.json({ data });
  });
});

/*Element de controle*/
//?zoneId=1&nom=ddd&valeurMin=1.4&valeurMax=2.5&typeChamp=1&unit=tonnes&defaultValue=1.7&isRegulateur=0&listValues=1 2 3&isCompteur=1&ordre=10&infoSup=djdjjd
app.put("/element", middleware, (request, response) => {
  const reqQ = request.query
  if (reqQ.idGroupement == 0) {
    reqQ.idGroupement = null;
  }
  pool.query("INSERT INTO elementcontrole (zoneId, nom, valeurMin, valeurMax, typeChamp, unit, defaultValue, isRegulateur, listValues, isCompteur, ordre, idGroupement, CodeEquipement, infoSup) VALUES (" + reqQ.zoneId + ", '" + reqQ.nom + "', " + reqQ.valeurMin + ", " + reqQ.valeurMax + ", " + reqQ.typeChamp + ", '" + reqQ.unit + "', '" + reqQ.defaultValue + "', " + reqQ.isRegulateur + ", '" + reqQ.listValues + "', " + reqQ.isCompteur + ", " + reqQ.ordre + "," + reqQ.idGroupement + ",'" + reqQ.codeEquipement + "', '" + reqQ.infoSup + "')"
    , (err, result, fields) => {
      if (err) response.json("Création de l'élément KO");
      else response.json("Création de l'élément OK");
    });
});

//Update ordre elements
//Incrémente les ordres de 1 pour pouvoir insérer une éléments entre 2 éléments existants
//?zoneId=1&maxOrdre=2
app.put("/updateOrdreElement", middleware, (request, response) => {
  const reqQ = request.query
  pool.query("UPDATE elementcontrole SET ordre = ordre + 1 WHERE zoneId = " + reqQ.zoneId + " AND ordre > " + reqQ.maxOrdre, (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    response.json("Mise à jour des ordres OK")
  });
});

//Update element
//?zoneId=1&nom=ddd&valeurMin=1.4&valeurMax=2.5&typeChamp=1&unit=tonnes&defaultValue=1.7&isRegulateur=0&listValues=1 2 3&isCompteur=1&ordre=5&idGroupement=1&infoSup=zgyzgzy
app.put("/updateElement/:id", middleware, (request, response) => {
  const reqQ = request.query
  const reqP = request.params
  if (reqQ.idGroupement == 0) {
    reqQ.idGroupement = null;
  }
  pool.query("UPDATE elementcontrole SET zoneId = " + reqQ.zoneId + ", nom = '" + reqQ.nom + "', valeurMin = " + reqQ.valeurMin + ", valeurMax = " + reqQ.valeurMax + ", typeChamp = " + reqQ.typeChamp + ", unit = '" + reqQ.unit + "', defaultValue = '" + reqQ.defaultValue + "', isRegulateur = " + reqQ.isRegulateur + ", listValues = '" + reqQ.listValues + "', isCompteur = " + reqQ.isCompteur + ", ordre = " + reqQ.ordre + ", idGroupement =" + reqQ.idGroupement + ",CodeEquipement = '" + reqQ.codeEquipement + "', infoSup = '" + reqQ.infoSup + "' WHERE Id = " + reqP.id, (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    response.json("Mise à jour de l'element OK")
  });
});

//Suppression element
//?id=12
app.delete("/deleteElement", middleware, (request, response) => {
  const reqQ = request.query
  pool.query("DELETE FROM elementcontrole WHERE Id = " + reqQ.id, (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    response.json("Suppression de l'élément OK")
  });
});

//Récupérer l'ensemble des élements d'une usine
app.get("/elementsControleOfUsine/:idUsine", middleware, (request, response) => {
  const reqP = request.params
  pool.query("select e.*, z.nom as nomZone from elementcontrole e INNER JOIN zonecontrole z ON z.Id = e.zoneId where e.typeChamp IN (1,2) and  z.idUsine = " + reqP.idUsine + " order by e.nom asc", (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    data = data['recordset'];
    response.json({ data });
  });
});


//Récupérer l'ensemble des élements d'une zone
app.get("/elementsOfZone/:zoneId", middleware, (request, response) => {
  const reqP = request.params
  pool.query("SELECT e.*, g.groupement FROM elementcontrole  e FULL OUTER join groupement g on g.id = e.idGroupement  WHERE e.zoneId = " + reqP.zoneId + " ORDER BY g.groupement asc, ordre ASC", (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    //TODO : bug ici => à debug
    //if(err) console.log(err);
    data = data['recordset'];
    response.json({ data });
  });
});

//Récupérer le nombre d'éléments d'un groupement
//?idGroupement=1
app.get("/GetElementsGroupement", middleware, (request, response) => {
  const reqQ = request.query
  pool.query("SELECT COUNT(*) as nb FROM elementcontrole e WHERE e.idGroupement = " + reqQ.idGroupement, (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    data = data['recordset'];
    response.json(data[0].nb);
  });
});

//Récupérer l'ensemble des élements de type compteur
app.get("/elementsCompteur/:idUsine", middleware, (request, response) => {
  const reqP = request.params
  pool.query("SELECT * FROM elementcontrole e INNER JOIN zonecontrole z ON z.Id = e.zoneId WHERE z.IdUsine = " + reqP.idUsine + " AND e.isCompteur = 1 ORDER BY ordre ASC", (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    data = data['recordset'];
    response.json({ data });
  });
});

//Récupérer un element 
app.get("/element/:elementId", middleware, (request, response) => {
  const reqP = request.params
  pool.query("SELECT * FROM elementcontrole WHERE Id = " + reqP.elementId, (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    data = data['recordset'];
    response.json({ data });
  });
});

//Récupérer l'ensemble des élements pour lesquelles il n'y a pas de valeur sur la ronde en cours
//?date=07/02/2022
app.get("/elementsOfRonde/:quart", (request, response) => {
  const reqQ = request.query
  const reqP = request.params
  pool.query("SELECT * FROM elementcontrole WHERE Id NOT IN (SELECT m.elementId FROM mesuresrondier m INNER JOIN ronde r ON r.Id = m.rondeId WHERE r.dateHeure LIKE '" + reqQ.date + "%' AND r.quart = " + reqP.quart + ")", (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    data = data['recordset'];
    response.json({ data });
  });
});

/////////////////////////
//      Groupements    //
/////////////////////////

//Récupérer les groupements d'une zone
//?zoneId=220
app.get("/getGroupements", middleware, (request, response) => {
  const reqQ = request.query
  pool.query("SELECT * from groupement WHERE zoneId = " + reqQ.zoneId, (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    data = data['recordset'];
    response.json({ data });
  });
});

//Récupérer l'ensemble des groupements d'une usine
//?idUsine=1
app.get("/getGroupementsOfOneDay/:idUsine/:date", middleware, (request, response) => {
  const reqQ = request.query
  const reqP = request.params
  if (reqQ.quart == 0) {
    var query = "SELECT distinct g.id, g.groupement, g.zoneId FROM mesuresrondier m INNER JOIN elementcontrole e ON m.elementId = e.Id JOIN groupement g ON g.id = e.idGroupement INNER JOIN ronde r ON r.Id = m.rondeId INNER JOIN zonecontrole z ON z.Id = e.zoneId WHERE r.dateHeure = '" + reqP.date + "' and r.idUsine = " + reqP.idUsine + " ORDER BY g.groupement"
  }
  else {
    var query = "SELECT distinct g.id, g.groupement, g.zoneId FROM mesuresrondier m INNER JOIN elementcontrole e ON m.elementId = e.Id JOIN groupement g ON g.id = e.idGroupement INNER JOIN ronde r ON r.Id = m.rondeId INNER JOIN zonecontrole z ON z.Id = e.zoneId WHERE r.dateHeure = '" + reqP.date + "' and r.quart=" + reqQ.quart + " and r.idUsine = " + reqP.idUsine + " ORDER BY g.groupement"
  }
  pool.query(query, async (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    data = data['recordset'];
    response.json({ data });
  });
});

//Récupérer l'ensemble des groupements d'une usine
//?idUsine=1
app.get("/getAllGroupements", middleware, (request, response) => {
  const reqQ = request.query
  pool.query("SELECT * FROM groupement join zonecontrole on groupement.zoneId = zonecontrole.Id WHERE zonecontrole.idUsine= " + reqQ.idUsine + "order by groupement.zoneId asc", (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    data = data['recordset'];
    response.json({ data });
  });
});

//Récupérer un groupement
//?idGroupement=1
app.get("/getOneGroupement", middleware, (request, response) => {
  const reqQ = request.query
  pool.query("SELECT * FROM groupement where id=" + reqQ.idGroupement, (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    data = data['recordset'];
    response.json({ data });
  });
});

//Créer un groupement
//?zoneId=2&groupement=test
app.put("/groupement", middleware, (request, response) => {
  const reqQ = request.query;
  pool.query("INSERT INTO groupement (groupement, zoneId) VALUES ('" + reqQ.groupement + "', " + reqQ.zoneId + ")"
    , (err, result, fields) => {
      if (err) response.json("Création du groupement KO");
      else response.json("Création du groupement OK");
    });
});

//Modifier un groupement
//?idGroupement=1&groupement=test&zoneId=1
app.put("/updateGroupement", middleware, (request, response) => {
  const reqQ = request.query
  pool.query("UPDATE groupement SET zoneId = " + reqQ.zoneId + ", groupement = '" + reqQ.groupement + "' WHERE id = " + reqQ.idGroupement, (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    response.json("Mise à jour de l'element OK")
  });
});

app.delete("/deleteGroupement", middleware, (request, response) => {
  const reqQ = request.query
  pool.query("DELETE FROM groupement WHERE id = " + reqQ.idGroupement, (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    response.json("Suppression ok")
  });
});
///////////////////////
//  Fin Groupement   //
///////////////////////

/*Ronde*/
//?dateHeure=07/02/2022 08:00&quart=1&userId=1&chefQuartId=1&idUsine=1
app.put("/ronde", (request, response) => {
  const reqQ = request.query;
  pool.query("INSERT INTO ronde (dateHeure, quart, userId, chefQuartId, idUsine) VALUES ('" + reqQ.dateHeure + "', " + reqQ.quart + ", " + reqQ.userId + ", " + reqQ.chefQuartId + ", " + reqQ.idUsine + ")"
    , (err, result, fields) => {
      if (err) response.json("Création de la ronde KO");
      else response.json("Création de la ronde OK");
    });
});

/*Ronde*/
//?dateHeure=07/02/2022 08:00&quart=1&userId=1&chefQuartId=1&idUsine=1
app.put("/rondeReturnId", (request, response) => {
  const reqQ = request.query;
  pool.query("INSERT INTO ronde (dateHeure, quart, userId, chefQuartId, idUsine) OUTPUT inserted.Id VALUES ('" + reqQ.dateHeure + "', " + reqQ.quart + ", " + reqQ.userId + ", " + reqQ.chefQuartId + ", " + reqQ.idUsine + ")"
    , (err, data) => {
      data = data['recordset'];
      response.json({ data });
    });
});


//Cloture des rondes encore en cours Calce pour mode auto
//?idUsine=7
app.put("/clotureRondesCalceAuto", (request, response) => {
  const reqQ = request.query;
  pool.query('UPDATE ronde SET isFinished = 1 WHERE idUsine =' + reqQ.idUsine, (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    response.json("Cloture des rondes auto OK");
  })
})

//Cloture des rondes encore en cours Calce pour mode auto
//?idUsine=7
app.put("/clotureRonde", (request, response) => {
  const reqQ = request.query;
  pool.query('UPDATE ronde SET isFinished = 1 WHERE Id =' + reqQ.id, (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    response.json("Cloture des rondes auto OK");
  })
})

//?dateHeure=07/02/2022 08:00&quart=1&userId=1&chefQuartId=1&idUsine=1
app.put("/rondeCalce", (request, response) => {
  const reqQ = request.query;
  pool.query("INSERT INTO ronde (dateHeure, quart, userId, chefQuartId, idUsine) VALUES ('" + reqQ.dateHeure + "', " + reqQ.quart + ", " + reqQ.userId + ", " + reqQ.chefQuartId + ", " + reqQ.idUsine + ")"
    , (err, result, fields) => {
      if (err) response.json("Création de la ronde KO");
      else response.json("Création de la ronde OK");
    });
});

//Cloture de la ronde avec ou sans commentaire/anomalie
//?commentaire=ejejejeje&id=1&four1=0&four2=1&four3=1&four4=1
app.put("/closeRonde/:id", (request, response) => {
  const reqQ = request.query
  const reqP = request.params
  pool.query("UPDATE ronde SET commentaire = '" + reqQ.commentaire + "', fonctFour1 = '" + reqQ.four1 + "', fonctFour2 = '" + reqQ.four2 + "', fonctFour3 = '" + reqQ.four3 + "' , fonctFour4 = '" + reqQ.four4 + "' , isFinished = 1 WHERE id = " + reqQ.id, (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    response.json("Cloture de la ronde OK")
  });
});

//Cloture de la ronde encore en cours
//?id=12
app.put("/closeRondeEnCours", (request, response) => {
  const reqQ = request.query
  pool.query("UPDATE ronde SET isFinished = 1, fonctFour1 = 1, fonctFour2 = 1, fonctFour3 = 1, fonctFour4 = 1 WHERE id = " + reqQ.id, (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    response.json("Cloture de la ronde OK")
  });
});



//Récupérer l'auteur d'une ronde
//?date=07/02/2022&idUsine=1
app.get("/AuteurRonde/:quart", (request, response) => {
  const reqQ = request.query
  const reqP = request.params
  pool.query("SELECT DISTINCT u.nom, u.prenom FROM ronde r INNER JOIN users u ON r.userId = u.Id WHERE r.idUsine = " + reqQ.idUsine + " AND r.dateHeure LIKE '" + reqQ.date + "%' AND r.quart = " + reqP.quart, (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    data = data['recordset'];
    response.json({ data });
  });
});

//Récupérer l'id de la dernière ronde inséré (ronde en cours)
app.get("/LastRonde/:idUsine", (request, response) => {
  const reqP = request.params
  pool.query("SELECT TOP 1 Id from ronde WHERE idUsine = " + reqP.idUsine + " ORDER BY Id DESC", (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    data = data['recordset'];
    if (data[0] != undefined) {
      response.json(data[0].Id)
    }
    else {
      response.json(0);
    }
  });
});

//Récupérer l'id de la ronde précédente (0 si première ronde de la BDD)
app.get("/RondePrecedente/:idUsine", (request, response) => {
  const reqP = request.params
  pool.query("SELECT TOP 2 Id from ronde WHERE idUsine = " + reqP.idUsine + " ORDER BY Id DESC", (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    data = data['recordset'];
    if (data.length > 1) {
      response.json(data[1].Id)
    }
    else response.json(0)
  });
});

//Récupérer la ronde encore en cours sur le même quart et la même date => permettre au rondier de la reprendre
//?date=01/01/2023
app.get("/LastRondeOpen/:idUsine/:quart", (request, response) => {
  const reqQ = request.query;
  const reqP = request.params
  pool.query("SELECT TOP 1 id from ronde WHERE isFinished = 0 AND idUsine = " + reqP.idUsine + " AND quart = " + reqP.quart + " AND dateHeure = '" + reqQ.date + "' ORDER BY Id DESC", (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    data = data['recordset'];
    if (data.length < 1) {
      response.json(0);
    }
    else response.json(data[0].id);
  });
});

//Récupérer les rondes et leurs infos pour une date donnée
//?date=07/02/2022&idUsine=1
app.get("/Rondes", (request, response) => {
  const reqQ = request.query
  pool.query("SELECT r.Id, r.userId, r.dateHeure, r.quart, r.commentaire, r.isFinished, r.fonctFour1, r.fonctFour2, r.fonctFour3, r.fonctFour4, u.Nom, u.Prenom, uChef.Nom as nomChef, uChef.Prenom as prenomChef FROM ronde r INNER JOIN users u ON u.Id = r.userId INNER JOIN users uChef ON uChef.Id = r.chefQuartId WHERE r.idUsine = " + reqQ.idUsine + " AND r.dateHeure LIKE '" + reqQ.date + "%' ORDER BY r.quart ASC", (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    data = data['recordset'];
    response.json({ data });
  });
});

//Récupérer les rondes et leurs infos pour une date et un quart donnée
//?date=07/02/2022&idUsine=7&quart=1
app.get("/RondesQuart", (request, response) => {
  const reqQ = request.query
  if (reqQ.quart == 0) {
    var query = "SELECT r.Id, r.userId, r.dateHeure, r.quart, r.commentaire, r.isFinished, r.fonctFour1, r.fonctFour2, r.fonctFour3, r.fonctFour4, u.Nom, u.Prenom, uChef.Nom as nomChef, uChef.Prenom as prenomChef FROM ronde r INNER JOIN users u ON u.Id = r.userId INNER JOIN users uChef ON uChef.Id = r.chefQuartId WHERE r.idUsine = " + reqQ.idUsine + " AND r.dateHeure LIKE '" + reqQ.date + "%'"
  }
  else {
    var query = "SELECT r.Id, r.userId, r.dateHeure, r.quart, r.commentaire, r.isFinished, r.fonctFour1, r.fonctFour2, r.fonctFour3, r.fonctFour4, u.Nom, u.Prenom, uChef.Nom as nomChef, uChef.Prenom as prenomChef FROM ronde r INNER JOIN users u ON u.Id = r.userId INNER JOIN users uChef ON uChef.Id = r.chefQuartId WHERE r.idUsine = " + reqQ.idUsine + " AND r.quart = " + reqQ.quart + " AND r.dateHeure LIKE '" + reqQ.date + "%'"
  }
  pool.query(query, (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    data = data['recordset'];
    response.json({ data });
  });
});


//Récupérer le nombre de rondes cloturées (pour fonctionnement avec équipes)
//?id=1
app.get("/nbRondes", (request, response) => {
  const reqQ = request.query
  pool.query("SELECT nbRondes FROM ronde WHERE Id =" + reqQ.id, (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    data = data['recordset'];
    if (data.length > 0) {
      response.json(data[0].nbRondes);
    }
    else response.json(0);
  });
});

//Incrémenter de 1 le nombre de rondes cloturées (pour fonctionnement avec équipes)
//?id=1
app.put("/updateNbRondes", (request, response) => {
  const reqQ = request.query
  pool.query("UPDATE ronde SET nbRondes = nbRondes + 1 WHERE Id=" + reqQ.id, (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    response.json("Mise à jour de la valeur OK")
  });
});

//Récupère le nombre de rondes cloturées pour une ronde (pour fonctionnement avec équipes)
//?userId=1
app.get("/nbRondiersEquipe", (request, response) => {
  const reqQ = request.query
  pool.query("SELECT equipe.id FROM equipe JOIN affectation_equipe ON equipe.id = affectation_equipe.idEquipe WHERE idRondier = " + reqQ.userId, (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    data = data['recordset'];
    if (data.length > 0) {
      pool.query("SELECT COUNT(*) as nbRondesACloturer FROM equipe JOIN affectation_equipe ON equipe.id = affectation_equipe.idEquipe WHERE affectation_equipe.idZone > 0 AND equipe.id = " + data[0].id, (err, data) => {
        if (err) {
          currentLineError = currentLine(); throw err;
        }
        data = data['recordset'];
        response.json(data[0].nbRondesACloturer);
      });
    }
    else response.json(0);
  });
});


//Suppression ronde
//?id=12
app.delete("/deleteRonde", middleware, (request, response) => {
  const reqQ = request.query
  pool.query("DELETE FROM ronde WHERE id = " + reqQ.id, (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    response.json("Suppression de la ronde OK")
  });
});

/*Mesures Rondier*/
//?elementId=1&modeRegulateur=AP&value=2.4&rondeId=1
app.put("/mesureRondier", (request, response) => {
  const reqQ = request.query
  pool.query("INSERT INTO mesuresrondier (elementId, modeRegulateur, value, rondeId) VALUES (" + reqQ.elementId + ", '" + reqQ.modeRegulateur + "', '" + reqQ.value + "', " + reqQ.rondeId + ")"
    , (err, result, fields) => {
      if (err) response.json("Création de la mesure KO");
      else response.json("Création de la mesure OK");
    });
});

/*Mesures Rondier avec envoi des données en une fois via JsonArray dans le body*/
app.put("/mesureRondierOneRequest", async (request, response) => {
  const tableauDonnees = request.body;
  let nbErreur = 0;
  let listElemErreur = "";
  let e = ""
  for (const element of tableauDonnees.values) {
    e = element.nameValuePairs;
    try {
      await pool.query(`INSERT INTO mesuresrondier (elementId, modeRegulateur, value, rondeId)
                            VALUES (${e.elementId}, '${e.modeRegulateur}', '${e.value}', ${e.rondeId})`);
    } catch (err) {
      // Tentative d'insertion alternative
      try {
        await pool.query(`INSERT INTO mesuresrondier (elementId, modeRegulateur, value, rondeId)
                                VALUES (${e.elementId}, '', '/', ${e.rondeId})`);
      } catch (err) {
        nbErreur++;
        console.log("nbErreur++ : " + nbErreur);
        listElemErreur += e.elementId + ";";
        console.log(`ECHEC INSERTION / sur : ${e.elementId} sur la ronde : ${e.rondeId}`);
      }
    }
  }

  console.log("**********************FIN BOUCLE***********************");
  console.log("nbErreur : " + nbErreur);

  if (nbErreur > 0) {
    console.log("KO1");
    response.json(`KO1-${nbErreur}-${listElemErreur}`);
    currentLineError = currentLine(); throw (new Error("erreur envoi rondier"));
  }
  //Si on a pas d'echec, on verifie que le dernier element est bien envoyé
  else {
    pool.query("SELECT * FROM mesuresrondier WHERE elementId = " + e.elementId + " AND rondeId = " + e.rondeId, (err, data) => {
      if (err) {
        currentLineError = currentLine(); throw err;
      }
      data = data['recordset'];
      if (data.length > 0) {
        console.log("OK");
        response.json("OK");
      }
      else {
        console.log("KO2");
        response.json("KO2-la derniere valeur n'est pas inséré correctement");
      }
    });
  }
});

//Update valeur de l'élement de contrôle
//?id=12&value=dhdhhd
app.put("/updateMesureRonde", middleware, (request, response) => {
  const reqQ = request.query
  pool.query("UPDATE mesuresrondier SET value = '" + reqQ.value + "' WHERE id = " + reqQ.id, (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    response.json("Mise à jour de la valeur OK");
  });
});

//Récupération du produit CAP Lié a l'élément de controle rondier
//?id=12
app.get("/getProductMesureRondier", middleware, (request, response) => {
  const reqQ = request.query
  pool.query("SELECT p.Id FROM products_new p INNER JOIN elementcontrole e ON e.id = p.idElementRondier INNER JOIN mesuresrondier m ON m.elementId = e.Id WHERE m.id = " + reqQ.id, (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    data = data['recordset'];
    if (data.length > 0) response.json(data[0].Id);
    else response.json(0);
  });
});

//Récupérer l'ensemble des mesures pour une ronde => reporting
app.get("/reportingRonde/:idRonde", middleware, (request, response) => {
  const reqQ = request.query
  const reqP = request.params
  pool.query("SELECT e.Id as elementId, e.unit, e.typeChamp, e.valeurMin, e.valeurMax, e.defaultValue, m.Id, m.value, e.nom, m.modeRegulateur, z.nom as nomZone, r.Id as rondeId FROM mesuresrondier m INNER JOIN elementcontrole e ON m.elementId = e.Id INNER JOIN ronde r ON r.Id = m.rondeId INNER JOIN zonecontrole z ON z.Id = e.zoneId WHERE r.Id = " + reqP.idRonde + " ORDER BY z.nom ASC", (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    data = data['recordset'];
    response.json({ data });
  });
});

//Récupérer la valeur pour un élément de contrôle et une date (dernière valeur enregistrée sur la journée)
//?id=111&date=dhdhdh
app.get("/valueElementDay", async (request, response) => {
  const reqQ = request.query
  pool.query("SELECT m.value FROM mesuresrondier m INNER JOIN ronde r ON m.rondeId = r.Id WHERE r.quart = 3 AND r.dateHeure = '" + reqQ.date + "' AND m.elementId = " + reqQ.id, async (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    valueElementDay = data['recordset'];
    data = data['recordset'];
    if (valueElementDay.length == 0) {
      await valueElementDayAprem(reqQ.date, reqQ.id);
      data = valueElementDay
      response.json({ data });
    }
    else response.json({ data });
  });
});

//fonction pour récupérer la valeur de la ronde de l'après-midi
async function valueElementDayAprem(date, id) {
  return new Promise((resolve) => {
    pool.query("SELECT m.value FROM mesuresrondier m INNER JOIN ronde r ON m.rondeId = r.Id WHERE r.quart = 2 AND r.dateHeure = '" + date + "' AND m.elementId = " + id, async (err, data) => {
      if (err) {
        currentLineError = currentLine(); throw err;
      }
      valueElementDay = data['recordset'];
      if (valueElementDay.length == 0) {
        await valueElementDayMatin(date, id);
      }
      resolve()
    });

  });
}

//fonction pour récupérer la valeur de la ronde du matin
async function valueElementDayMatin(date, id) {
  return new Promise((resolve) => {
    pool.query("SELECT m.value FROM mesuresrondier m INNER JOIN ronde r ON m.rondeId = r.Id WHERE r.quart = 1 AND r.dateHeure = '" + date + "' AND m.elementId = " + id, async (err, data) => {
      if (err) {
        currentLineError = currentLine(); throw err;
      }
      valueElementDay = data['recordset'];
      resolve()
    });
  });
}

/*Permis de feu et zone de consignation*/
//?dateHeureDeb=dggd&dateHeureFin=fff&badgeId=1&zone=zone&isPermisFeu=1&numero=fnjfjfj
app.put("/PermisFeu", middleware, (request, response) => {
  const reqQ = request.query
  pool.query("INSERT INTO permisfeu (dateHeureDeb, dateHeureFin, badgeId, zone, isPermisFeu, numero) VALUES ('" + reqQ.dateHeureDeb + "', '" + reqQ.dateHeureFin + "', " + reqQ.badgeId + ", '" + reqQ.zone + "', " + reqQ.isPermisFeu + ", '" + reqQ.numero + "')"
    , (err, result, fields) => {
      if (err) response.json("Création du permis de feu KO");
      else response.json("Création du permis de feu OK");
    });
})

//Récupérer les permis de feu en cours ou les zones de consignation
app.get("/PermisFeu/:idUsine", (request, response) => {
  const reqP = request.params
  pool.query("SELECT p.Id, CONCAT(CONVERT(varchar,CAST(p.dateHeureDeb as datetime2), 103),' ',CONVERT(varchar,CAST(p.dateHeureDeb as datetime2), 108)) as dateHeureDeb, CONCAT(CONVERT(varchar,CAST(p.dateHeureFin as datetime2), 103),' ',CONVERT(varchar,CAST(p.dateHeureFin as datetime2), 108)) as dateHeureFin, b.uid as badge, p.badgeId, p.isPermisFeu, p.zone, p.numero FROM permisfeu p INNER JOIN badge b ON b.Id = p.badgeId WHERE b.idUsine = " + reqP.idUsine + " AND p.dateHeureDeb <= convert(varchar, getdate(), 120) AND p.dateHeureFin > convert(varchar, getdate(), 120)", (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    data = data['recordset'];
    response.json({ data });
  });
});


//Enregistrer une validation de permis de feu
//?dateHeure=dggd&permisFeuId=1&userId=1&quart=1&rondeId=1
app.put("/VerifPermisFeu", (request, response) => {
  const reqQ = request.query
  pool.query("INSERT INTO permisfeuvalidation (permisFeuId, userId, dateHeure, quart, rondeId) VALUES (" + reqQ.permisFeuId + ", " + reqQ.userId + ", '" + reqQ.dateHeure + "', " + reqQ.quart + ", " + reqQ.rondeId + ")"
    , (err, result, fields) => {
      if (err) response.json("Validation du permis de feu KO");
      else response.json("Validation du permis de feu OK");
    });
})

//Récupérer les validation pour une date donnée
//?dateHeure=22/06/2022&idUsine=1
app.get("/PermisFeuVerification", middleware, (request, response) => {
  const reqQ = request.query
  pool.query("SELECT pf.numero, pf.zone, p.rondeId, p.dateHeure, p.userId , p.permisFeuId, p.quart FROM permisfeuvalidation p INNER JOIN permisfeu pf ON pf.Id = p.permisFeuId INNER JOIN badge b ON pf.badgeId = b.Id WHERE b.idUsine = " + reqQ.idUsine + " AND p.dateHeure LIKE '%" + reqQ.dateHeure + "%'", (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    data = data['recordset'];
    response.json({ data });
  });
});


/*Mode opératoire*/
//?nom=dggd&zoneId=1
//passage du fichier dans un formData portant le nom 'fichier'
app.post("/modeOP", multer({ storage: storage }).single('fichier'), (request, response) => {
  const reqQ = request.query;
  //création de l'url de stockage du fichier
  //const url = `${request.protocol}://${request.get('host')}/fichiers/${request.file.filename.replace("[^a-zA-Z0-9]", "")}`;
  //on utilise l'url publique
  const url = `${request.protocol}://capexploitation.paprec.com/capexploitation/fichiers/${request.file.filename}`;
  var query = "INSERT INTO modeoperatoire (nom, fichier, zoneId) VALUES ('" + reqQ.nom + "', '" + url + "', " + reqQ.zoneId + ")";
  pool.query(query, (err, result, fields) => {
    if (err) {
      console.log(err);
      response.json("Création du modeOP KO");
    }
    else response.json("Création du modeOP OK");
  });
});

//DELETE modeOP
//?nom=test.pdf
app.delete("/modeOP/:id", middleware, (request, response) => {
  const reqP = request.params
  const reqQ = request.query
  //On supprime le fichier du storage multer avant de supprimer le mode OP en BDD
  fs.unlink(`fichiers/${reqQ.nom}`, () => {
    //Suppression en BDD du mode OP
    pool.query("DELETE FROM modeoperatoire WHERE Id = " + reqP.id, (err, data) => {
      if (err) {
        currentLineError = currentLine(); throw err;
      }
      response.json("Suppression du modeOP OK")
    });
  });
});

//Récupérer l'ensemble des modeOP
app.get("/modeOPs/:idUsine", middleware, (request, response) => {
  const reqP = request.params
  pool.query("SELECT m.Id, m.nom, m.fichier, z.nom as nomZone FROM modeoperatoire m INNER JOIN zonecontrole z ON z.Id = m.zoneId WHERE z.idUsine = " + reqP.idUsine, (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    data = data['recordset'];
    response.json({ data });
  });
});

//Récupérer les modeOP associé à une zone
app.get("/modeOPofZone/:zoneId", (request, response) => {
  const reqP = request.params
  pool.query("SELECT * FROM modeoperatoire WHERE zoneId=" + reqP.zoneId, (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    data = data['recordset'];
    response.json({ data });
  });
});

//Update du fichier du modeOP
//?fichier=modeOP1
app.put("/modeOP/:id", middleware, (request, response) => {
  const reqQ = request.query
  const reqP = request.params
  pool.query("UPDATE modeoperatoire SET fichier = " + reqQ.fichier + " WHERE Id = " + reqP.id, (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    response.json("Mise à jour du modeOP OK")
  });
});


/*Consignes*/
//?commentaire=dggd&dateDebut=fff&c=fff&type=1&idUsine=1
app.put("/consigne", multer({ storage: storage }).single('fichier'), (request, response) => {
  const reqQ = request.query
  const titre = reqQ.titre.replace(/'/g, "''");
  const commentaire = reqQ.commentaire.replace(/'/g, "''");

  if (request.file != undefined) {
    url = `${request.protocol}://capexploitation.paprec.com/capexploitation/fichiers/${request.file.filename.replace("[^a-zA-Z0-9]", "")}`;
    requete = "INSERT INTO consigne (titre,commentaire, date_heure_debut, date_heure_fin, type, idUsine, url) OUTPUT INSERTED.Id VALUES ('" + titre + "','" + commentaire + "', '" + reqQ.dateDebut + "', '" + reqQ.dateFin + "', " + reqQ.type + ", " + reqQ.idUsine + ",'" + url + "')"
  }
  else requete = "INSERT INTO consigne (titre,commentaire, date_heure_debut, date_heure_fin, type, idUsine) OUTPUT INSERTED.Id VALUES ('" + titre + "','" + commentaire + "', '" + reqQ.dateDebut + "', '" + reqQ.dateFin + "', " + reqQ.type + ", " + reqQ.idUsine + ")"
  pool.query(requete
    , (err, data) => {
      if (err) {
        currentLineError = currentLine(); throw err;
      }
      data = data['recordset'];
      response.json({ data });
    });
});

//mettre a jour une consigne
//?commentaire=dggd&dateDebut=fff&c=fff&type=1&id=1
app.put("/updateConsigne", middleware, (request, response) => {
  const reqQ = request.query
  const titre = reqQ.titre.replace(/'/g, "''");
  const commentaire = reqQ.commentaire.replace(/'/g, "''");
  pool.query("UPDATE consigne SET titre = '" + titre + "', commentaire ='" + commentaire + "', date_heure_debut = '" + reqQ.dateDebut + "', date_heure_fin ='" + reqQ.dateFin + "', type=" + reqQ.type + " where id = " + reqQ.id
    , (err, result, fields) => {
      if (err) response.json("Modification de la consigne KO");
      else response.json("Modification de la consigne OK");
    });
});

//Récupérer les consignes en cours à l'instant T
app.get("/consignes/:idUsine", (request, response) => {
  const reqP = request.params
  pool.query("SELECT titre, CONCAT(CONVERT(varchar,CAST(date_heure_debut as datetime2), 103),' ',CONVERT(varchar,CAST(date_heure_debut as datetime2), 108)) as dateHeureDebut, CONCAT(CONVERT(varchar,CAST(date_heure_fin as datetime2), 103),' ',CONVERT(varchar,CAST(date_heure_fin as datetime2), 108)) as dateHeureFin, commentaire, id, type, url FROM consigne WHERE isActive = 1 and idUsine = " + reqP.idUsine + " AND date_heure_debut <= convert(varchar, getdate(), 120) AND date_heure_fin >= convert(varchar, getdate(), 120)", (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    data = data['recordset'];
    response.json({ data });
  });
});

//Récupérer les consignes en cours entre 2 dates
//?dateDeb=2024-11-01 05:00&dateFin=2024-11-01 13:00
app.get("/consignesEntreDeuxDates/:idUsine", (request, response) => {
  const reqP = request.params;
  const reqQ = request.query;
  pool.query("SELECT titre, CONCAT(CONVERT(varchar,CAST(date_heure_debut as datetime2), 103),' ',CONVERT(varchar,CAST(date_heure_debut as datetime2), 108)) as dateHeureDebut, CONCAT(CONVERT(varchar,CAST(date_heure_fin as datetime2), 103),' ',CONVERT(varchar,CAST(date_heure_fin as datetime2), 108)) as dateHeureFin, commentaire, id, type, url FROM consigne WHERE isActive = 1 and idUsine = " + reqP.idUsine + " AND (('" + reqQ.dateDeb + "' BETWEEN date_heure_debut AND date_heure_fin) OR ('" + reqQ.dateFin + "' BETWEEN date_heure_debut AND date_heure_fin) OR (date_heure_debut BETWEEN '" + reqQ.dateDeb + "' AND '" + reqQ.dateFin + "') OR (date_heure_fin BETWEEN '" + reqQ.dateDeb + "' AND '" + reqQ.dateFin + "'))", (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    data = data['recordset'];
    response.json({ data });
  });
});

//Récupérer toutes les consignes
app.get("/allConsignes/:idUsine", (request, response) => {
  const reqP = request.params
  pool.query("SELECT titre, CONCAT(CONVERT(varchar,CAST(date_heure_debut as datetime2), 103),' ',CONVERT(varchar,CAST(date_heure_debut as datetime2), 108)) as dateHeureDebut, CONCAT(CONVERT(varchar,CAST(date_heure_fin as datetime2), 103),' ',CONVERT(varchar,CAST(date_heure_fin as datetime2), 108)) as dateHeureFin, commentaire, id, url, type FROM consigne WHERE isActive = 1 and idUsine = " + reqP.idUsine, (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    data = data['recordset'];
    response.json({ data });
  });
});

//Récupérer toutes les consignes entre 2 dates => recherche également par titre de consigne
//?idUsine=10&dateDeb=xxx&dateFin=yyyy&titre=test
app.get("/getConsignesRecherche", (request, response) => {
  const reqQ = request.query
  pool.query("SELECT titre, 'Consigne' as 'typeDonnee',  CONCAT(CONVERT(varchar,CAST(date_heure_debut as datetime2), 103),' ',CONVERT(varchar,CAST(date_heure_debut as datetime2), 108)) as date_heure_debut, CONCAT(CONVERT(varchar,CAST(date_heure_fin as datetime2), 103),' ',CONVERT(varchar,CAST(date_heure_fin as datetime2), 108)) as date_heure_fin, commentaire as 'nom', id, type FROM consigne where date_heure_debut < '" + reqQ.dateFin + "' and date_heure_fin > '" + reqQ.dateDeb + "' and isActive = 1 and commentaire like '%" + reqQ.titre + "%' and idUsine = " + reqQ.idUsine
    , (err, data) => {
      if (err) {
        currentLineError = currentLine(); throw err;
      }
      data = data['recordset'];
      response.json({ data });
    });
});

//DELETE consigne
app.put("/consigne/:id", middleware, (request, response) => {
  const reqP = request.params
  pool.query("update consigne set isActive = 0 WHERE id = " + reqP.id, (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    response.json("Suppression de la consigne OK")
  });
});

/*Anomalie*/
//?rondeId=1&zoneId=2&commentaire=dggd
//passage de la photo dans un formData portant le nom 'fichier'
app.put("/anomalie", multer({ storage: storage }).single('fichier'), (request, response) => {
  const reqQ = request.query;
  //création de l'url de stockage du fichier
  const url = `${request.protocol}://capexploitation.paprec.com/capexploitation/fichiers/${request.file.filename.replace("[^a-zA-Z0-9]", "")}`;

  var query = "INSERT INTO anomalie (rondeId, zoneId, commentaire, photo) VALUES (" + reqQ.rondeId + ", " + reqQ.zoneId + ", '" + reqQ.commentaire + "', '" + url + "')";
  pool.query(query, (err, result, fields) => {
    if (err) {
      response.json("Création de l'anomalie KO");
    }
    else response.json("Création de l'anomalie OK");
  });
});

//TODO : inner join avec Ronde ??? Zone ???
//Récupérer les anomalies d'une ronde
app.get("/anomalies/:id", (request, response) => {
  const reqP = request.params
  pool.query("SELECT * FROM anomalie WHERE rondeId = " + reqP.id, (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    data = data['recordset'];
    response.json({ data });
  });
});

//Récupérer les anomalies d'une ronde
app.get("/getAnomaliesOfOneRonde", (request, response) => {
  const reqQ = request.query;
  pool.query("SELECT a.* from anomalie a join ronde r on r.id = a.rondeId WHERE r.dateHeure LIKE '%" + reqQ.date + "%' and quart = " + reqQ.quart + " AND r.idUsine = " + reqQ.idUsine, (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    data = data['recordset'];
    response.json({ data });
  });
});

//Récupérer les anomalies d'une usine entre deux dates
//?idUsine=7?detaDeb=01/01/2023&dateFin=01/09/2023
app.get("/anomaliesEntreDeuxDates", (request, response) => {
  const reqQ = request.query
  const [day, month, year] = reqQ.dateDeb.split('/')
  var dateDeDebut = `${year}-${month}-${day}`

  const [day2, month2, year2] = reqQ.dateFin.split('/')
  var dateDeFin = `${year2}-${month2}-${day2}`
  pool.query("select a.*, r.dateHeure, r.quart from anomalie a join ronde r on r.Id = a.rondeId where r.IdUsine = " + reqQ.idUsine + " and (convert(datetime, r.dateHeure, 103)) BETWEEN '" + dateDeDebut + "' and '" + dateDeFin + "'"
    , (err, data) => {
      if (err) {
        currentLineError = currentLine(); throw err;
      }
      data = data['recordset'];
      response.json({ data });
    });
});

//UpdateAnomalie
//?rondeId=12&zoneId=5&commentaire=test
app.put("/updateAnomalie", (request, response) => {
  const reqQ = request.query
  pool.query("UPDATE anomalie SET commentaire = '" + reqQ.commentaire + "' WHERE rondeId =" + reqQ.rondeId + " AND zoneId =" + reqQ.zoneId, (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    response.json("OK")
  });
});

//UpdateAnomalie
//?rondeId=1&zoneId=12&commentaire=test
app.put("/createAnomalie", (request, response) => {
  const reqQ = request.query
  pool.query("INSERT INTO anomalie(rondeId, zoneId, commentaire) VALUES (" + reqQ.rondeId + "," + reqQ.zoneId + ",'" + reqQ.commentaire + "')", (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    response.json("OK")
  });
});


//////////////////////////
//       EQUIPE         //
//////////////////////////


//Créer une nouvelle équipe
//?nomEquipe=test&quart=1&idChefQuart=1
app.put("/equipe", middleware, (request, response) => {
  const reqQ = request.query
  const nomEquipe = reqQ.nomEquipe.replace(/'/g, "''");
  pool.query("INSERT INTO equipe(equipe,quart,idChefQuart,date) OUTPUT INSERTED.Id VALUES('" + nomEquipe + "'," + reqQ.quart + "," + reqQ.idChefQuart + ",'" + reqQ.date + "')", (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    data = data['recordset'];
    response.json({ data });
  });
});

//Créer les nouveau rondier d'une équipe
//?idRondier=2&idEquipe=1&idZone=1&poste=admin&heure_deb=05:00&heure_fin=13:00
app.put("/affectationEquipe", middleware, (request, response) => {
  const reqQ = request.query
  pool.query("INSERT INTO affectation_equipe(idRondier,idEquipe,idZone,poste,heure_deb,heure_fin) VALUES(" + reqQ.idRondier + "," + reqQ.idEquipe + "," + reqQ.idZone + ",'" + reqQ.poste + "','" + reqQ.heure_deb + "','" + reqQ.heure_fin + "')", (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    //if (err) console.log(err);
    response.json("Ajout ok");
  });
});

//Changer les infos d'heures de quart pour les utilisateurs d'une equipe
//?idRondier=1&idEquipe=1&typeInfo=heure_fin&valueInfo=13:00
app.put("/updateInfosAffectationEquipe", middleware, (request, response) => {
  const reqQ = request.query;
  pool.query("UPDATE affectation_equipe SET " + reqQ.typeInfo + " = '" + reqQ.valueInfo + "' WHERE idRondier = " + reqQ.idRondier + " AND idEquipe = " + reqQ.idEquipe, (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    //if (err) console.log(err);
    response.json("Ajout ok");
  });
});

//Récupérer les utilisateurs rondier qui ne sont pas affecter à une équipe
//?idUsine=1
app.get("/usersRondierSansEquipe", middleware, (request, response) => {
  const reqQ = request.query
  //pool.query("SELECT * from users where isRondier = 1 and idUsine = " + reqQ.idUsine + "and Id NOT IN (SELECT idRondier from affectation_equipe) ORDER BY Nom", (err,data) => {
  pool.query("SELECT * from users where isRondier = 1 and idUsine = " + reqQ.idUsine + " ORDER BY Nom", (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    data = data['recordset'];
    response.json({ data });
  });
});

//Récupérer les équipes d'une usine
//?idUsine=1
app.get("/equipes", middleware, async (request, response) => {
  const reqQ = request.query
  pool.query("SELECT equipe.id, equipe.quart, equipe.equipe, users.Nom, users.Prenom, users.idUsine from equipe JOIN users ON users.Id = equipe.idChefQuart WHERE users.idUsine =" + reqQ.idUsine + " order by equipe.quart asc",
    async (err, data) => {
      if (err) {
        currentLineError = currentLine(); throw err;
      }
      data = data['recordset'];
      for await (const equipe of data) {
        await getUsersEquipe(equipe);
      };
      response.json({ tabEquipes });
      tabEquipes = [];
    });
});

function getUsersEquipe(equipe) {
  return new Promise((resolve) => {
    //Récupération des users d'une équipe
    pool.query("SELECT u.Nom, u.Prenom, z.nom as nomZone, a.poste FROM affectation_equipe a JOIN users u ON u.Id = a.idRondier LEFT OUTER JOIN zonecontrole z on z.Id = a.idZone WHERE a.idEquipe = " + equipe.id, (err, data) => {
      if (err) {
        currentLineError = currentLine(); throw err;
      }
      data = data['recordset'];
      let OneEquipe = {
        id: equipe.id,
        quart: equipe.quart,
        equipe: equipe.equipe,
        nomChefQuart: equipe.Nom,
        prenomChefQuart: equipe.Prenom,
        rondiers: data
      };
      resolve();
      tabEquipes.push(OneEquipe);
    });
  });
}

//Récupérer une seule équipe
//?idUsine=1&idEquipe=28
app.get("/getOneEquipe", middleware, (request, response) => {
  const reqQ = request.query
  pool.query("SELECT idRondier, zonecontrole.Id as 'idZone',equipe.id, equipe.equipe, equipe.quart, zonecontrole.nom as 'zone', poste, users.Nom as 'nomRondier', users.Prenom as 'prenomRondier' , chefQuart.Nom as 'nomChefQuart' , chefQuart.Prenom as 'prenomChefQuart', ae.heure_deb, ae.heure_fin, ae.heure_tp, ae.comm_tp FROM equipe FULL OUTER JOIN affectation_equipe ae ON equipe.Id = ae.idEquipe FULL OUTER JOIN users ON users.Id = ae.idRondier JOIN users as chefQuart ON chefQuart.Id = equipe.idChefQuart LEFT OUTER JOIN zonecontrole ON zonecontrole.Id = idZone WHERE equipe.id =" + reqQ.idEquipe, (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    data = data['recordset'];
    response.json({ data });
  });
});

//Mise à jour des information d'une équipe
//?nomEquipe=test&quart=1&idEquipe=1
app.put("/updateEquipe", middleware, (request, response) => {
  const reqQ = request.query
  pool.query("update equipe set equipe = '" + reqQ.nomEquipe + "', quart = " + reqQ.quart + " , idChefQuart = " + reqQ.idChefQuart + "where id = " + reqQ.idEquipe, (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    response.json("Update ok");
  });
});

//DELETE equipe
app.delete("/deleteEquipe/:idEquipe", middleware, (request, response) => {
  const reqP = request.params
  pool.query("DELETE FROM equipe WHERE id = " + reqP.idEquipe, (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    response.json("Suppression des Rondiers OK")
  });
});

//DELETE affectation_equipe
app.delete("/deleteAffectationEquipe/:idEquipe", middleware, (request, response) => {
  const reqP = request.params
  pool.query("DELETE FROM affectation_equipe WHERE idEquipe = " + reqP.idEquipe, (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    response.json("Suppression des Rondiers OK")
  });
});

//Récupérer l'équipe d'un utilisateur POUR RONDIER
//?idRondier=1
app.get("/getEquipeUser", (request, response) => {
  const reqQ = request.query
  pool.query("SELECT u.idRondier, e.quart, e.idChefQuart, e.date, e.id FROM affectation_equipe u JOIN equipe e on u.idEquipe = e.id WHERE u.idRondier =" + reqQ.idRondier + " ORDER BY e.date DESC", (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    data = data['recordset'];
    response.json({ data });
  });
});

//Récupérer l'équipe d'un utilisateur POUR RONDIER
//?idRondier=1&quart=1
app.get("/getEquipeUserCahierQuart", (request, response) => {
  const reqQ = request.query
  pool.query("SELECT u.idRondier, e.quart, e.idChefQuart FROM affectation_equipe u JOIN equipe e on u.idEquipe = e.id WHERE u.idRondier =" + reqQ.idRondier + " and e.quart = " + reqQ.quart, (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    data = data['recordset'];
    response.json({ data });
  });
});


//Récupérer l'équipe d'un quart d'une usine
//?idUsine=7&quart=1?date=2024-01-01
app.get("/getEquipeQuart", (request, response) => {
  const reqQ = request.query
  pool.query("SELECT e.id from equipe e join affectation_equipe a ON a.idEquipe = e.id JOIN users u ON u.id = a.idRondier where u.idUsine =" + reqQ.idUsine + " and e.quart =" + reqQ.quart + "and e.date='" + reqQ.date + "'", (err, data) => {
    if (err) {
      //console.log("SELECT e.id from equipe e join affectation_equipe a ON a.idEquipe = e.id JOIN users u ON u.id = a.idRondier where u.idUsine =" + reqQ.idUsine +" and e.quart =" + reqQ.quart +"and e.date='"+reqQ.date+"'");
      console.log(err);
      //console.log("SELECT e.id from equipe e join affectation_equipe a ON a.idEquipe = e.id JOIN users u ON u.id = a.idRondier where u.idUsine =" + reqQ.idUsine +" and e.quart =" + reqQ.quart +"and e.date='"+reqQ.date+"'");
      response.json("erreur");
    }
    else {
      data = data['recordset'];
      response.json({ data });
    }
  });
});

////////////////////
//   FIN EQUIPE   //
////////////////////


/////////////////////////////////
//   ENREGISTREMENT D'EQUIPE   //
/////////////////////////////////

//Créer un nouvel enregistrement d'équipe
//?equipe=test
app.put("/enregistrementEquipe", middleware, (request, response) => {
  const reqQ = request.query
  pool.query("INSERT INTO enregistrement_equipe(equipe) OUTPUT INSERTED.Id VALUES('" + reqQ.nomEquipe + "')", (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    data = data['recordset'];
    response.json({ data });
  });
});

//DELETE enregistrement_affectation_equipe
app.delete("/deleteEnregistrementAffectationEquipe/:idEquipe", middleware, (request, response) => {
  const reqP = request.params
  pool.query("DELETE FROM enregistrement_affectation_equipe WHERE idEquipe = " + reqP.idEquipe, (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    response.json("Suppression des Rondiers OK")
  });
});


//DELETE enregistremen_equipe
app.delete("/deleteEnregistrementEquipe/:idEquipe", middleware, (request, response) => {
  const reqP = request.params
  pool.query("DELETE FROM enregistrement_equipe WHERE id = " + reqP.idEquipe, (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    response.json("Suppression des Rondiers OK")
  });
});


//Mise à jour des information d'un enregistrement d'équipe
//?nomEquipe=test&idEquipe=1
app.put("/updateEnregistrementEquipe", middleware, (request, response) => {
  const reqQ = request.query
  pool.query("update enregistrement_equipe set equipe = '" + reqQ.nomEquipe + "' where id = " + reqQ.idEquipe, (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    response.json("Update ok");
  });
});

//Récupérer une seule équipe enregistrée
//idEquipe=28
app.get("/getOneEnregistrementEquipe", middleware, (request, response) => {
  const reqQ = request.query
  pool.query("SELECT idRondier, enregistrement_equipe.id, enregistrement_equipe.equipe, users.Nom as 'nomRondier', users.Prenom as 'prenomRondier', users.posteUser FROM enregistrement_equipe FULL OUTER JOIN enregistrement_affectation_equipe ON enregistrement_equipe.Id = enregistrement_affectation_equipe.idEquipe FULL OUTER JOIN users ON users.Id = enregistrement_affectation_equipe.idRondier WHERE enregistrement_equipe.id =" + reqQ.idEquipe, (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    data = data['recordset'];
    response.json({ data });
  });
});

//Récupérer les nom des équipes enregistrée et leurs id
//?idUsine=1
app.get("/getNomsEquipesEnregistrees", middleware, (request, response) => {
  const reqQ = request.query
  pool.query("SELECT distinct enregistrement_equipe.id, enregistrement_equipe.equipe FROM enregistrement_equipe FULL OUTER JOIN enregistrement_affectation_equipe ON enregistrement_equipe.Id = enregistrement_affectation_equipe.idEquipe FULL OUTER JOIN users ON users.Id = enregistrement_affectation_equipe.idRondier WHERE users.idUsine =" + reqQ.idUsine, (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    data = data['recordset'];
    response.json({ data });
  });
});

//Récupérer les équipes enregistrées d'une usine
//?idUsine=1
app.get("/getEquipesEnregistrees", middleware, async (request, response) => {
  const reqQ = request.query
  pool.query("SELECT distinct e.id, e.equipe from enregistrement_equipe e JOIN enregistrement_affectation_equipe a ON a.idEquipe = e.id JOIN users u on u.Id = a.idRondier WHERE u.idUsine =" + reqQ.idUsine,
    async (err, data) => {
      if (err) {
        currentLineError = currentLine(); throw err;
      }
      data = data['recordset'];
      for await (const equipe of data) {
        await getUsersEnregistrementEquipe(equipe);
      };
      response.json({ tabEnregistrementEquipes });
      tabEnregistrementEquipes = [];
    });
});

function getUsersEnregistrementEquipe(equipe) {
  return new Promise((resolve) => {
    //Récupération des users d'une équipe
    pool.query("SELECT u.Nom, u.Prenom, u.posteUser FROM enregistrement_affectation_equipe a JOIN users u ON u.Id = a.idRondier WHERE a.idEquipe = " + equipe.id, (err, data) => {
      if (err) {
        currentLineError = currentLine(); throw err;
      }
      data = data['recordset'];
      let OneEquipe = {
        id: equipe.id,
        equipe: equipe.equipe,
        rondiers: data
      };
      resolve();
      tabEnregistrementEquipes.push(OneEquipe);
    });
  });
}

//Créer les nouveau rondier d'un enregistrement d'équipe
//?idRondier=test&idEquipe=1
app.put("/enregistrementAffectationEquipe", middleware, (request, response) => {
  const reqQ = request.query
  pool.query("INSERT INTO enregistrement_affectation_equipe(idRondier,idEquipe) VALUES(" + reqQ.idRondier + "," + reqQ.idEquipe + ")", (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    response.json("Ajout ok");
  });
});



//*********************
/*******FIN RONDIER****/
//*********************



/*
******* SITES
*/

//Récupérer la locatlisation d'un site
app.get("/getOneLocalisation/:id", middleware, (request, response) => {
  const reqP = request.params
  pool.query("SELECT localisation FROM site WHERE id = " + reqP.id, (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    data = data['recordset'];
    response.json({ data });
  });
});

//Récupérer la liste des sites (pour choisir pour l'administration du superAdmin)
//sauf le global
app.get("/sites", middleware, (request, response) => {
  const reqQ = request.query
  pool.query("SELECT * FROM site WHERE codeUsine NOT LIKE '000' ORDER BY localisation ASC", (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    data = data['recordset'];
    response.json({ data });
  });
});

//Récupérer la liste des sites avec une ip Aveva
//sauf le global
app.get("/sitesAveva", middleware, (request, response) => {
  const reqQ = request.query
  pool.query("SELECT * FROM site WHERE codeUsine NOT LIKE '000' and ipAveva !='' ORDER BY localisation ASC", (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    data = data['recordset'];
    response.json({ data });
  });
});


//Récupérer le nombre de ligne d'un site
app.get("/nbLigne/:id", middleware, (request, response) => {
  const reqP = request.params
  pool.query("SELECT nbLigne FROM site WHERE id =" + reqP.id, (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    data = data['recordset'];
    response.json({ data });
  });
});


//Récupérer le nombre de ligne d'un site avec une réponse au format chiffre
app.get("/nbLigneChiffre/:id", (request, response) => {
  const reqP = request.params
  pool.query("SELECT nbLigne FROM site WHERE id =" + reqP.id, (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    data = data['recordset'];
    if (data.length > 0) {
      response.json(data[0].nbLigne)
    }
    else response.json(0)
  });
});

//Récupérer le nombre de GTA d'un site
app.get("/nbGTA/:id", middleware, (request, response) => {
  const reqP = request.params
  pool.query("SELECT nbGTA FROM site WHERE id =" + reqP.id, (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    data = data['recordset'];
    response.json({ data });
  });
});

//Récupérer le nombre de RCU d'un site
app.get("/nbRCU/:id", middleware, (request, response) => {
  const reqP = request.params
  pool.query("SELECT nbReseauChaleur FROM site WHERE id =" + reqP.id, (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    data = data['recordset'];
    response.json({ data });
  });
});

//Récupérer le type d'import pour les pesées d'un site
app.get("/typeImport/:id", middleware, (request, response) => {
  const reqP = request.params
  pool.query("SELECT typeImport FROM site WHERE id =" + reqP.id, (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    data = data['recordset'];
    response.json({ data });
  });
});


//Récupérer le type de l'aapli rondier d'un site avec une réponse au format string
app.get("/typeRondier/:id", (request, response) => {
  const reqP = request.params
  pool.query("SELECT typeRondier FROM site WHERE id = " + reqP.id, (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    data = data['recordset'];
    if (data.length > 0) {
      response.json(data[0].typeRondier)
    }
    else response.json('')
  });
});


/*
******* FIN SITES
*/


/*
******* RAPPORTS
*/

//Récupérer la liste des rapports pour un site en question
app.get("/rapports/:id", middleware, (request, response) => {
  const reqP = request.params
  pool.query("SELECT * FROM rapport WHERE idUsine=" + reqP.id, (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    data = data['recordset'];
    response.json({ data });
  });
});


/*
******* FIN RAPPORTS
*/


//////////////////////////
//eMonitoring
//////////////////////////

//Get products without TAGs
app.get("/ProductWithoutTag/:id", middleware, (request, response) => {
  const reqP = request.params
  pool.query("SELECT * FROM products_new WHERE (TAG IS NULL OR TAG = '/') AND idUsine = " + reqP.id + " ORDER BY Name ASC", (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    data = data['recordset'];
    response.json({ data })
  });
});


//Get products avec un TAG EVELER
app.get("/ProductEveler", middleware, (request, response) => {
  const reqQ = request.query
  pool.query("SELECT * FROM products_new WHERE TAG LIKE 'EVELER%'", (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    data = data['recordset'];
    response.json({ data })
  });
});

//UPDATE Product, set TAG
//?TAG=123
app.put("/productTAG/:id", middleware, (request, response) => {
  const reqQ = request.query
  const reqP = request.params
  pool.query("UPDATE products_new SET TAG = '" + reqQ.TAG + "', LastModifiedDate = convert(varchar, getdate(), 120), idElementRondier = null WHERE Id = " + reqP.id, (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    response.json("Mise à jour du TAG OK")
  });
});

//UPDATE Product, set TAG
//?id=1&idElementRondier=123
app.put("/productElementRondier", middleware, (request, response) => {
  const reqQ = request.query
  var idElem;
  if (reqQ.idElementRondier == 0) idElem = null
  else idElem = reqQ.idElementRondier
  pool.query("UPDATE products_new SET TAG = '', LastModifiedDate = convert(varchar, getdate(), 120), idElementRondier = " + idElem + " WHERE Id = " + reqQ.id, (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    response.json("Mise à jour du TAG OK")
  });
});

//UPDATE Product, set Code
//?CodeEquipement=123
app.put("/productCodeEquipement/:id", middleware, (request, response) => {
  const reqQ = request.query
  const reqP = request.params
  pool.query("UPDATE products_new SET CodeEquipement = '" + reqQ.CodeEquipement + "', LastModifiedDate = convert(varchar, getdate(), 120) WHERE Id = " + reqP.id, (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    response.json("Mise à jour du Code OK")
  });
});

//UPDATE Product, set Code
//?CodeEquipement=123
app.put("/productCodeEquipement/:id", middleware, (request, response) => {
  const reqQ = request.query
  const reqP = request.params
  pool.query("UPDATE products_new SET CodeEquipement = '" + reqQ.CodeEquipement + "', LastModifiedDate = convert(varchar, getdate(), 120) WHERE Id = " + reqP.id, (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    response.json("Mise à jour du Code OK")
  });
});

//UPDATE Product, set Code
//?CodeEquipement=123
app.put("/productUpdateCoeff/:id", middleware, (request, response) => {
  const reqQ = request.query
  const reqP = request.params
  pool.query("UPDATE products_new SET Coefficient = '" + reqQ.coeff + "', LastModifiedDate = convert(varchar, getdate(), 120) WHERE Id = " + reqP.id, (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    response.json("Mise à jour du Coeff OK")
  });
});
//////////////////////////
// FIN eMonitoring
//////////////////////////



//////////////////////////
//MAINTENANCE
//////////////////////////

//Récupérer la maintenance prévue
app.get("/Maintenance", middleware, (request, response) => {
  const reqQ = request.query
  pool.query("SELECT FORMAT(dateHeureDebut, 'dd/MM/yyyy HH:mm:ss') as dateHeureDebut, FORMAT(dateHeureFin, 'dd/MM/yyyy HH:mm:ss') as dateHeureFin FROM maintenance WHERE getDate() < dateHeureDebut", (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    data = data['recordset'];
    if (data.length > 0) {
      response.json(data[0])
    }
  });
});


//////////////////////////
// FIN MAINTENANCE
//////////////////////////

//////////////////////////
//        TOKEN         //
//////////////////////////

//Requête permettant de générer un nouveau token
//?affectation=tesst
app.put("/accesToken", middleware, (request, response) => {
  //On passe un objet aléatoire pour générer un token aléatoirement
  const token = jwt.sign({ token: "ffrezqskz7f" }, process.env.ACESS_TOKEN_SECRET);
  const reqQ = request.query
  pool.query("INSERT INTO token(token,affectation) VALUES ('Bearer " + token + "', '" + reqQ.affectation + "')", (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    response.json(token);
  });
});

//Requête permettant de récupérer les tokens actifs générés manuellement.
app.get("/allAccesTokens", middleware, (request, response) => {
  pool.query("SELECT * FROM token where Enabled = 1", (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    data = data['recordset'];
    response.json({ data })
  });
});

//Requête permettant de désactiver un token 
//?id=5
app.put("/desactivateToken", middleware, (request, response) => {
  const reqQ = request.query
  pool.query("UPDATE token SET Enabled = 0 WHERE Id = " + reqQ.id, (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    response.json("Suppression du token OK")
  });
});

//Requête permettant de modifier la personne affectée à un token
//?id=5&affectation=tesst
app.put("/updateToken", middleware, (request, response) => {
  const reqQ = request.query
  pool.query("UPDATE token SET affectation = '" + reqQ.affectation + "' WHERE Id = " + reqQ.id, (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    response.json("Mise à jour OK")
  });
});

//Requête permettant de récupérer tout les tokens non autorisés
app.get("/unauthorizedTokens",
  (request, response) => {
    pool.query("SELECT token FROM token where Enabled = 0", (err, data) => {
      if (err) {
        currentLineError = currentLine(); throw err;
      }
      data = data['recordset'];
      response.json({ data })
    });
  });

//////////////////////////
//    FIN TOKEN         //
//////////////////////////


//////////////////////////
//    Import tonnage    //
//////////////////////////


//Requête permettant de récupérer les moral entities d'une usine sans correspondance
//?idUsine=1
app.get("/getMoralEntitiesAndCorrespondance", middleware, (request, response) => {
  const reqQ = request.query
  pool.query("SELECT mr.Id, mr.CreateDate, mr.LastModifiedDate, mr.Name, mr.Address, mr.Enabled, mr.Code, mr.UnitPrice, p.Id as productId, mr.numCAP, mr.codeDechet, mr.nomClient, mr.prenomClient, mr.mailClient, LEFT(p.Name,CHARINDEX(' ',p.Name)) as produit, SUBSTRING(p.Name,CHARINDEX(' ',p.Name),500000) as collecteur, i.nomImport, i.productImport FROM moralentities_new as mr " +
    "INNER JOIN products_new as p ON LEFT(p.Code,5) LIKE LEFT(mr.Code,5) AND p.idUsine = mr.idUsine " +
    "FULL OUTER JOIN import_tonnage i ON i.ProducerId = mr.Id " +
    "WHERE mr.idUsine = " + reqQ.idUsine + " AND p.Code = LEFT(mr.Code,LEN(p.Code)) AND mr.Enabled = 1 AND mr.Code LIKE '" + reqQ.Code + "%' ORDER BY mr.Name ASC", (err, data) => {
      if (err) {
        currentLineError = currentLine(); throw err;
      }
      data = data['recordset'];
      response.json({ data })
    });
});

//Requête permettant de récupérer les moral entities d'une usine sans correspondance
//?idUsine=1
app.get("/getSortantsAndCorrespondance", middleware, (request, response) => {
  const reqQ = request.query
  pool.query("SELECT * FROM products_new p JOIN import_tonnageSortants i ON i.ProductId = p.Id WHERE p.typeId = 5 and p.idUsine = " + reqQ.idUsine + "and p.Code LIKE '" + reqQ.Code + "%'"
    , (err, data) => {
      if (err) {
        currentLineError = currentLine(); throw err;
      }
      data = data['recordset'];
      response.json({ data })
    });
});

//Requête permettant de récupérer les moral entities d'une usine sans correspondance
//?idUsine=1
app.get("/getReactifsAndCorrespondance", middleware, (request, response) => {
  const reqQ = request.query
  pool.query("SELECT * FROM products_new p JOIN import_tonnageReactifs i ON i.ProductId = p.Id WHERE p.idUsine = " + reqQ.idUsine
    , (err, data) => {
      if (err) {
        currentLineError = currentLine(); throw err;
      }
      data = data['recordset'];
      response.json({ data })
    });
});




//?ProductId=5&ProducerId=1&nomImport=test&idUsine=7
app.put("/import_tonnage", middleware, (request, response) => {
  const reqQ = request.query
  pool.query("INSERT INTO import_tonnage (ProductId, ProducerId,idUsine, nomImport, productImport) VALUES (" + reqQ.ProductId + "," + reqQ.ProducerId + "," + reqQ.idUsine + ",'" + reqQ.nomImport + "','" + reqQ.productImport + "')", (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    response.json("Mise à jour OK")
  });
});

//?ProductId=5&idUsine=7
app.put("/import_tonnageSortant", middleware, (request, response) => {
  const reqQ = request.query
  pool.query("INSERT INTO import_tonnageSortants (ProductId,idUsine, productImport) VALUES (" + reqQ.ProductId + "," + reqQ.idUsine + ",'" + reqQ.productImport + "')", (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    response.json("Mise à jour OK")
  });
});

//?ProductId=5&idUsine=7
app.put("/import_tonnageReactif", middleware, (request, response) => {
  const reqQ = request.query
  pool.query("INSERT INTO import_tonnageReactifs (ProductId,idUsine, productImport) VALUES (" + reqQ.ProductId + "," + reqQ.idUsine + ",'" + reqQ.productImport + "')", (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    response.json("Mise à jour OK")
  });
});


//Requête permettant de récupérer tout les tokens non autorisés
app.get("/correspondance/:Id", middleware, (request, response) => {
  const reqP = request.params
  pool.query("SELECT * FROM import_tonnage where ProducerId =" + reqP.Id, (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    data = data['recordset'];
    response.json({ data })
  });
});

//DELETE correspondance
app.delete("/deleteCorrespondance/:id", middleware, (request, response) => {
  const reqP = request.params
  pool.query("DELETE FROM import_tonnageSortants WHERE Id = " + reqP.id, (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    response.json("Suppression de la correspondance OK")
  });
});

//DELETE correspondance
app.delete("/deleteCorrespondanceReactif/:id", middleware, (request, response) => {
  const reqP = request.params
  pool.query("DELETE FROM import_tonnageReactifs WHERE Id = " + reqP.id, (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    response.json("Suppression de la correspondance OK")
  });
});


app.put("/updateCorrespondance", middleware, (request, response) => {
  const reqQ = request.query
  pool.query("UPDATE import_tonnage SET nomImport='" + reqQ.nomImport + "', productImport ='" + reqQ.productImport + "' WHERE ProducerId =" + reqQ.ProducerId, (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    response.json("Mise à jour OK")
  });
});

//mettre à jour le nom dans le logiciel de pesée d'une correspondance sortant
//?productImport=1&ProductId=&
app.put("/updateNomImportCorrespondanceSortant", middleware, (request, response) => {
  const reqQ = request.query
  pool.query("UPDATE import_tonnageSortants SET productImport ='" + reqQ.productImport + "' WHERE ProductId =" + reqQ.ProductId, (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    response.json("Mise à jour OK")
  });
});

//mettre à jour le nom de produit cap exploitation d'une correspondance sortant
//?idCorrespondance=1&ProductId=&
app.put("/updateProductImportCorrespondanceSortant", middleware, (request, response) => {
  const reqQ = request.query
  pool.query("UPDATE import_tonnageSortants SET ProductId =" + reqQ.ProductId + "WHERE id =" + reqQ.idCorrespondance, (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    response.json("Mise à jour OK")
  });
});

//mettre à jour le nom dans le logiciel de pesée d'une correspondance réactif
//?productImport=1&ProductId=&
app.put("/updateNomImportCorrespondanceReactif", middleware, (request, response) => {
  const reqQ = request.query
  pool.query("UPDATE import_tonnageReactifs SET productImport ='" + reqQ.productImport + "' WHERE ProductId =" + reqQ.ProductId, (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    response.json("Mise à jour OK")
  });
});

//mettre à jour le nom de produit cap exploitation d'une correspondance réactif
//?idCorrespondance=1&ProductId=&
app.put("/updateProductImportCorrespondanceReactif", middleware, (request, response) => {
  const reqQ = request.query
  pool.query("UPDATE import_tonnageReactifs SET ProductId =" + reqQ.ProductId + "WHERE id =" + reqQ.idCorrespondance, (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    response.json("Mise à jour OK")
  });
});

//Requête permettant de récupérer toutes les correspondance pour l'import csv des entrants
app.get("/getCorrespondance/:idUsine", middleware, (request, response) => {
  const reqP = request.params
  pool.query("SELECT * FROM import_tonnage where idUsine =" + reqP.idUsine, (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    data = data['recordset'];
    response.json({ data })
  });
});

//Requête permettant de récupérer toutes les correspondance pour l'import csv des sortants
app.get("/getCorrespondanceSortants/:idUsine", middleware, (request, response) => {
  const reqP = request.params
  pool.query("SELECT * FROM import_tonnageSortants where idUsine =" + reqP.idUsine, (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    data = data['recordset'];
    response.json({ data })
  });
});

//Requête permettant de récupérer toutes les correspondance pour l'import csv des réactifs
app.get("/getCorrespondanceReactifs/:idUsine", middleware, (request, response) => {
  const reqP = request.params
  pool.query("SELECT * FROM import_tonnageReactifs where idUsine =" + reqP.idUsine, (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    data = data['recordset'];
    response.json({ data })
  });
});

//Requête permettant de récupérer toutes les conversion de mesure disponibles
app.get("/getConversions", middleware, (request, response) => {
  pool.query("SELECT * FROM conversion", (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    data = data['recordset'];
    response.json({ data })
  });
});



//////////////////////////
//FIN Import tonnage    //
//////////////////////////


//////////////////////////
//    Formulaire        //
//////////////////////////


//?nom=journalier&type=1&idUsine=1
app.put("/formulaire", middleware, (request, response) => {
  const reqQ = request.query;
  pool.query("INSERT INTO formulaire (nom, type, idUsine) VALUES ('" + reqQ.nom + "', " + reqQ.type + ", " + reqQ.idUsine + ")"
    , (err, result, fields) => {
      if (err) response.json("Création du formulaire KO");
      else response.json("Création du formulaire OK");
    });
});

//Récupérer les formulaires d'un site
//?idUsine=7
app.get("/formulaires", middleware, (request, response) => {
  const reqQ = request.query;
  pool.query("SELECT * FROM formulaire WHERE idUsine = " + reqQ.idUsine, (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    data = data['recordset'];
    response.json({ data });
  });
});


//////////////////////////
//    FIN Formulaire    //
//////////////////////////


//////////////////////////
//    Cahier de quart   //
//////////////////////////

//Récupérer une consigne
//?idConsigne=7
app.get("/getOneConsigne", middleware, (request, response) => {
  const reqQ = request.query;
  pool.query("SELECT * FROM consigne WHERE id = " + reqQ.idConsigne, (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    data = data['recordset'];
    response.json({ data });
  });
});

//////////ACTU//////////

//Créer une actu
//?titre=test&importance=0&dateDeb=2024-01-10 10:00&dateFin=2024-01-10 10:00&idUsine=30&description=deeeeeeec&isQuart=1&maillist=jsjsjs
app.put("/actu", middleware, (request, response) => {
  const reqQ = request.query;
  const titre = reqQ.titre.replace(/'/g, "''");
  const description = reqQ.description.replace(/'/g, "''");
  /* MAIL */
  //SI on a une maillist => on va envoyer un mail pour notifier les destinataires de la création de l'actu
  if (reqQ.maillist != "") {
    //Transciption int importance en chaine
    let importanceString = "";
    let importanceColor = "";
    let colorTitre = "";
    if (reqQ.importance == 0) {
      importanceString = "Faible";
      importanceColor = "rgb(154,196,89)";
    }
    else if (reqQ.importance == 1) {
      importanceString = "Neutre";
      importanceColor = "orange";
    }
    else {
      importanceString = "Elevée";
      importanceColor = "red";
      colorTitre = " color:red;";
    }
    //On va split la description par rapport au passage à la ligne
    let tabDescription = description.split("\n");
    let htmlDescription = "";
    tabDescription.forEach((desc) => {
      htmlDescription += "<p style='color:rgb(27,37,51);'>" + desc + "</p>";
    });
    htmlDescription += "<p style='color:" + importanceColor + "'>Importance : " + importanceString + "</p>";
    //on va créer des formats de date plus sympa
    let dateDebFormat = reqQ.dateDeb.substring(8, 10) + "/" + reqQ.dateDeb.substring(5, 7) + "/" + reqQ.dateDeb.substring(0, 4) + " " + reqQ.dateDeb.substring(11, 16);
    let dateFinFormat = reqQ.dateFin.substring(8, 10) + "/" + reqQ.dateFin.substring(5, 7) + "/" + reqQ.dateFin.substring(0, 4) + " " + reqQ.dateFin.substring(11, 16);
    //Préparation du mail
    const message = {
      from: process.env.USER_SMTP, // Sender address
      to: reqQ.maillist,
      subject: 'Actualité du ' + dateDebFormat + ' au ' + dateFinFormat, // Subject line
      html: "<h3>Voici les informations concernant l'actualité sur la période suivante : " + dateDebFormat + " au " + dateFinFormat + "</h3>" +
        "<div style='height:max-content; box-shadow: 7px 7px 6px lightgray; border-radius : 10px; display:flex; margin: 2em; border: 1px solid rgba(0, 0, 0, 0.125); background-color:rgb(84,149,216); padding:1px;'>" +
        "<div>" +
        "<h3 style='text-shadow:none; margin-top:1em; border-bottom:solid white 2px; padding-bottom:1em;" + colorTitre + "'>" + titre + "</h3>" + htmlDescription +
        "</div></div>"//Cors du mail en HTML
    };

    transporter.sendMail(message, function (err, info) {
      if (err) {
        console.log(err);
        //currentLineError=currentLine(); throw err;
      } else {
        console.log('***' + new Date() + ' - Email sent to ' + reqQ.maillist + ' : ' + info.response);
      }
    });
  }
  /* FIN MAIL */
  pool.query("INSERT INTO quart_actualite(idUsine,titre,importance,date_heure_debut,date_heure_Fin,isValide,description) OUTPUT INSERTED.Id "
    + "VALUES(" + reqQ.idUsine + ",'" + titre + "'," + reqQ.importance + ",'" + reqQ.dateDeb + "','" + reqQ.dateFin + "','" + reqQ.isQuart + "','" + description + "')"
    , (err, data) => {
      if (err) {
        currentLineError = currentLine(); throw err;
      }
      data = data['recordset'];
      response.json({ data });
    });
});

//Modifier une actu
//?titre=test&importance=0&dateDeb=2024-01-10 10:00&dateFin=2024-01-10 10:00&idActu=1&description=deeeeeeec&isQuart=1
app.put("/updateActu", middleware, (request, response) => {
  const reqQ = request.query;
  const titre = reqQ.titre.replace(/'/g, "''");
  const description = reqQ.description.replace(/'/g, "''");
  pool.query("UPDATE quart_actualite SET titre ='" + titre + "',importance=" + reqQ.importance + ",date_heure_debut='" + reqQ.dateDeb + "',date_heure_Fin='" + reqQ.dateFin + "', description = '" + description + "', isValide = '" + reqQ.isQuart + "' WHERE id=" + reqQ.idActu
    , (err, result) => {
      if (err) {
        currentLineError = currentLine(); throw err;
      }
      else response.json("Modif de l'actu OK !");
    });
});

//Récupérer toutes les actus entre deux dates
//?idUsine=1&datedeb=''&dateFin=''
app.get("/getActusRonde", middleware, (request, response) => {
  const reqQ = request.query;
  pool.query("SELECT a.id, a.titre, a.description, CONVERT(varchar, a.date_heure_debut, 103)+ ' ' + CONVERT(varchar, a.date_heure_debut, 108) as 'date_heure_debut', CONVERT(varchar, a.date_heure_fin, 103)+ ' ' + CONVERT(varchar, a.date_heure_fin, 108) as 'date_heure_fin', a.importance FROM quart_actualite a WHERE a.date_heure_debut < '" + reqQ.dateFin + "' and a.date_heure_fin > '" + reqQ.dateDeb + "' and idUsine = " + reqQ.idUsine, (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    data = data['recordset'];
    response.json({ data });
  });
});

//Récupérer une actualité
//?idActu=7
app.get("/getOneActu", middleware, (request, response) => {
  const reqQ = request.query;
  pool.query("SELECT * FROM quart_actualite WHERE id = " + reqQ.idActu, (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    data = data['recordset'];
    response.json({ data });
  });
});

//Récupérer toutes les actualités
//?idUsine=7
app.get("/getAllActu", middleware, (request, response) => {
  const reqQ = request.query;
  pool.query("SELECT a.id, a.titre, a.description, a.idUsine, CONVERT(varchar, a.date_heure_debut, 103)+ ' ' + CONVERT(varchar, a.date_heure_debut, 108) as 'date_heure_debut', CONVERT(varchar, a.date_heure_fin, 103)+ ' ' + CONVERT(varchar, a.date_heure_fin, 108) as 'date_heure_fin', a.importance, a.isValide  FROM quart_actualite a WHERE idUsine = " + reqQ.idUsine + " ORDER BY date_heure_debut desc", (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    data = data['recordset'];
    response.json({ data });
  });
});

//Récupérer toutes les actualités
//?idUsine=7
app.get("/getActusEntreDeuxDates", middleware, (request, response) => {
  const reqQ = request.query;
  var importance = reqQ.importance
  if (reqQ.importance == 3) {
    importance = ''
  }
  pool.query("SELECT 'Actualité' as 'typeDonnee', a.id, a.description, a.titre as 'nom', a.idUsine, CONVERT(varchar, a.date_heure_debut, 103)+ ' ' + CONVERT(varchar, a.date_heure_debut, 108) as 'date_heure_debut', CONVERT(varchar, a.date_heure_fin, 103)+ ' ' + CONVERT(varchar, a.date_heure_fin, 108) as 'date_heure_fin', a.importance, a.isValide  FROM quart_actualite a where  a.date_heure_debut < '" + reqQ.dateFin + "' and a.date_heure_fin > '" + reqQ.dateDeb + "' and a.titre like '%" + reqQ.titre + "%' and a.importance like '%" + importance + "%' and a.idUsine = " + reqQ.idUsine, (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    data = data['recordset'];
    response.json({ data });
  });
});


//Récupérer toutes les actualités avec isActive en param, actives -> étant lié à un quart
//?idUsine=7&isQuart=1
app.get("/getActusQuart", middleware, (request, response) => {
  const reqQ = request.query;
  pool.query("SELECT a.id, a.titre, a.description, a.idUsine, CONVERT(varchar, a.date_heure_debut, 103)+ ' ' + CONVERT(varchar, a.date_heure_debut, 108) as 'date_heure_debut', CONVERT(varchar, a.date_heure_fin, 103)+ ' ' + CONVERT(varchar, a.date_heure_fin, 108) as 'date_heure_fin', a.importance, a.isValide FROM quart_actualite a WHERE a.isValide = " + reqQ.isQuart + " AND a.date_heure_debut <= GETDATE() AND a.date_heure_fin >= GETDATE() and  idUsine = " + reqQ.idUsine, (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    data = data['recordset'];
    response.json({ data });
  });
});

//Récupérer toutes les actualités ayant la date courante entre la date de début et la date de fin
//?idUsine=7
app.get("/getAllActuDateCourante", middleware, (request, response) => {
  const reqQ = request.query;
  pool.query("SELECT a.id, a.titre, a.description, a.idUsine, CONVERT(varchar, a.date_heure_debut, 103)+ ' ' + CONVERT(varchar, a.date_heure_debut, 108) as 'date_heure_debut', CONVERT(varchar, a.date_heure_fin, 103)+ ' ' + CONVERT(varchar, a.date_heure_fin, 108) as 'date_heure_fin', a.importance, a.isValide FROM quart_actualite a WHERE a.date_heure_debut <= GETDATE() AND a.date_heure_fin >= GETDATE() and  idUsine = " + reqQ.idUsine, (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    data = data['recordset'];
    response.json({ data });
  });
});

//passer une actu à isActive 1 pour l'afficher dans un récap de quart
//?idActu=1
app.put("/validerActu", middleware, (request, response) => {
  const reqQ = request.query;
  pool.query("UPDATE quart_actualite SET isValide = 1 WHERE id=" + reqQ.idActu
    , (err, result) => {
      if (err) {
        currentLineError = currentLine(); throw err;
      }
      else response.json("Modif de l'actu OK !");
    });
});

//passer une actu à isActive 0 pour l'afficher dans l'acceuil
//?idActu=1
app.put("/invaliderActu", middleware, (request, response) => {
  const reqQ = request.query;
  pool.query("UPDATE quart_actualite SET isValide = 0 WHERE id=" + reqQ.idActu
    , (err, result) => {
      if (err) {
        currentLineError = currentLine(); throw err;
      }
      else response.json("Modif de l'actu OK !");
    });
});

//DELETE actu
app.put("/deleteActu/:id", middleware, (request, response) => {
  const reqP = request.params
  pool.query("DELETE FROM quart_actualite WHERE id = " + reqP.id, (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    response.json("Suppression de l'actu OK")
  });
});

////FIN ACTU////////////

//**  evenements  **/

//Créer un évènement
//?titre=test&importance=0&dateDeb=2024-01-10 10:00&dateFin=2024-01-10 10:00&idUsine=30&groupementGMAO=&equipementGMAO=&cause=&description
app.put("/evenement", multer({ storage: storage }).single('fichier'), (request, response) => {
  const reqQ = request.query;
  const titre = reqQ.titre.replace(/'/g, "''");
  const groupementGMAO = reqQ.groupementGMAO.replace(/'/g, "''");
  const equipementGMAO = reqQ.equipementGMAO.replace(/'/g, "''");
  const cause = reqQ.cause.replace(/'/g, "''");
  const description = reqQ.description.replace(/'/g, "''");
  var url = ""
  if (request.file != undefined) {
    url = `${request.protocol}://capexploitation.paprec.com/capexploitation/fichiers/${request.file.filename.replace("[^a-zA-Z0-9]", "")}`;
  }

  pool.query("INSERT INTO quart_evenement(idUsine,titre,importance,date_heure_debut,date_heure_Fin,groupementGMAO, equipementGMAO, description, cause, consigne, demande_travaux,url) OUTPUT INSERTED.Id "
    + "VALUES(" + reqQ.idUsine + ",'" + titre + "'," + reqQ.importance + ",'" + reqQ.dateDeb + "','" + reqQ.dateFin + "','" + groupementGMAO + "','" + equipementGMAO + "','" + description + "','" + cause + "'," + reqQ.consigne + ",'" + reqQ.demandeTravaux + "','" + url + "')"
    , (err, data) => {
      if (err) {
        currentLineError = currentLine(); throw err;
      }
      else {
        data = data['recordset'];
        response.json({ data });
      }
    });
});

//Modifier un évènement
//?titre=test&importance=0&dateDeb=2024-01-10 10:00&dateFin=2024-01-10 10:00&idEvenement=30&groupementGMAO=&equipementGMAO=&cause=&description
app.put("/updateEvenement", middleware, (request, response) => {
  const reqQ = request.query;
  const titre = reqQ.titre.replace(/'/g, "''");
  const groupementGMAO = reqQ.groupementGMAO.replace(/'/g, "''");
  const equipementGMAO = reqQ.equipementGMAO.replace(/'/g, "''");
  const cause = reqQ.cause.replace(/'/g, "''");
  const description = reqQ.description.replace(/'/g, "''");
  pool.query("UPDATE quart_evenement SET titre = '" + titre + "',importance = " + reqQ.importance + ",date_heure_debut='" + reqQ.dateDeb + "',date_heure_Fin='" + reqQ.dateFin + "',groupementGMAO='" + groupementGMAO + "', equipementGMAO='" + equipementGMAO + "', description='" + description + "', cause='" + cause + "', consigne=" + reqQ.consigne + ", demande_travaux='" + reqQ.demandeTravaux + "' where id=" + reqQ.idEvenement
    , (err, result) => {
      if (err) {
        currentLineError = currentLine(); throw err;
      }
      else response.json("Modification de l'evenement OK !");
    });
});

//Récupérer un évènement
//?idEvenement=7
app.get("/getOneEvenement", middleware, (request, response) => {
  const reqQ = request.query;
  pool.query("SELECT * FROM quart_evenement WHERE id = " + reqQ.idEvenement, (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    data = data['recordset'];
    response.json({ data });
  });
});

//Récupérer toutes les évènements
//?idUsine=7
app.get("/getAllEvenement", middleware, (request, response) => {
  const reqQ = request.query;
  pool.query("SELECT e.id, e.titre, e.idUsine, CONVERT(varchar, e.date_heure_debut, 103)+ ' ' + CONVERT(varchar, e.date_heure_debut, 108) as 'date_heure_debut', CONVERT(varchar, e.date_heure_fin, 103)+ ' ' + CONVERT(varchar, e.date_heure_fin, 108) as 'date_heure_fin', e.importance, e.groupementGMAO, e.equipementGMAO, e.cause, e.description, e.demande_travaux, e.consigne, e.url FROM quart_evenement e WHERE e.isActive = 1 and idUsine = " + reqQ.idUsine + " ORDER BY e.date_heure_debut DESC", (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    data = data['recordset'];
    response.json({ data });
  });
});

//Récupérer toutes les évènements entre deux dates
//?idUsine=7
app.get("/getEvenementsEntreDeuxDates", middleware, (request, response) => {
  const reqQ = request.query;
  var importance = reqQ.importance
  if (reqQ.importance == 3) {
    importance = ''
  }
  const titre = reqQ.titre.replace(/'/g, "''");
  const groupementGMAO = reqQ.groupementGMAO.replace(/'/g, "''");
  const equipementGMAO = reqQ.equipementGMAO.replace(/'/g, "''");
  pool.query("SELECT 'Evènement' as 'typeDonnee', e.id, e.titre as 'nom', e.idUsine, CONVERT(varchar, e.date_heure_debut, 103)+ ' ' + CONVERT(varchar, e.date_heure_debut, 108) as 'date_heure_debut', CONVERT(varchar, e.date_heure_fin, 103)+ ' ' + CONVERT(varchar, e.date_heure_fin, 108) as 'date_heure_fin', e.importance, e.groupementGMAO, e.equipementGMAO, e.cause, e.description, e.demande_travaux, e.consigne, e.url  FROM quart_evenement e where  e.date_heure_debut < '" + reqQ.dateFin + "' and e.date_heure_fin > '" + reqQ.dateDeb + "' and e.titre like '%" + titre + "%' and e.groupementGMAO like '%" + groupementGMAO + "%' and e.importance like '%" + importance + "%' and e.equipementGMAO like '%" + equipementGMAO + "%' and e.isActive = 1 and e.idUsine = " + reqQ.idUsine
    , (err, data) => {
      if (err) {
        currentLineError = currentLine(); throw err;
      }
      data = data['recordset'];
      response.json({ data });
    });
});

//DELETE évènement
app.put("/deleteEvenement/:id", middleware, (request, response) => {
  const reqP = request.params
  pool.query("UPDATE quart_evenement set isActive = 0 WHERE id = " + reqP.id, (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    response.json("Suppression de l'evenement OK")
  });
});

////FIN EVENEMENT ////

///Calendrier///

//Récupérer toutes les zones présentes dans la table calndrier pour une usine
//?idUsine=
app.get("/getAllZonesCalendrier", middleware, (request, response) => {
  const reqQ = request.query;
  pool.query("select c.id, c.idUsine, c.idZone, z.nom, c.idAction, c.finReccurrence, c.recurrencePhrase, date_heure_debut,date_heure_fin,c.quart, c.termine from quart_calendrier c full outer join zonecontrole z on z.id = c.idZone where c.idZone is not null and c.idUsine = " + reqQ.idUsine + " order by date_heure_debut, quart, z.nom", (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    data = data['recordset'];
    response.json({ data });
  });
});

//Recuperer un evenemen t de calendrier avec son id
app.get("/getOneEvenementCalendrier/:id", middleware, (request, response) => {
  const reqP = request.params;
  pool.query("select * from quart_calendrier where id = " + reqP.id, (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    data = data['recordset'];
    response.json({ data });
  });
});
//Récupérer toutes les actions présentes dans la table calndrier pour une usine
//?idUsine=
app.get("/getAllActionsCalendrier", middleware, (request, response) => {
  const reqQ = request.query;
  pool.query("select a.nom, c.* from quart_calendrier c full outer join quart_action a on a.id = c.idAction where c.id is not null and c.idAction is not null and c.idUsine = " + reqQ.idUsine, (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    data = data['recordset'];
    response.json({ data });
  });
});

//Créer une instance pour les ZONES
//?idUsine=1&idRonde=1&datedeb=''&dateFin=''&quart=1&dateFinReccurrence=a lieu jusqu'au chaque
app.put("/newCalendrierZone", middleware, (request, response) => {
  const reqQ = request.query;
  let req = "";
  if (reqQ.dateFinReccurrence === 'null') {
    req = "INSERT INTO quart_calendrier(idUsine,idZone,date_heure_debut,quart,termine,date_heure_fin) "
      + "VALUES(" + reqQ.idUsine + "," + reqQ.idRonde + ",'" + reqQ.dateDeb + "'," + reqQ.quart + ",0,'" + reqQ.dateFin + "')"
  }
  else {
    req = "INSERT INTO quart_calendrier(idUsine,idZone,date_heure_debut,quart,termine,date_heure_fin, finReccurrence, recurrencePhrase) "
      + "VALUES(" + reqQ.idUsine + "," + reqQ.idRonde + ",'" + reqQ.dateDeb + "'," + reqQ.quart + ",0,'" + reqQ.dateFin + "','" + reqQ.dateFinReccurrence + "','"+reqQ.recurrencePhrase+"')"
  }
  pool.query(req
    , (err, result) => {
      if (err) {
        response.json("Création de l'instance KO !")
      }
      else response.json("Création de l'instance OK !");
    });
});

//Créer une instance pour les ACTIONS
//?idUsine=1&idAction=1&datedeb=''&dateFin=''&quart=1&termine=1
app.put("/newCalendrierAction", middleware, (request, response) => {
  const reqQ = request.query;
  let req = "";
  if (reqQ.dateFinReccurrence === 'null') {
    req = "INSERT INTO quart_calendrier(idUsine,idAction,date_heure_debut,quart,termine,date_heure_fin) "
      + "VALUES(" + reqQ.idUsine + "," + reqQ.idAction + ",'" + reqQ.dateDeb + "'," + reqQ.quart + "," + reqQ.termine + ",'" + reqQ.dateFin + "')"
  }
  else {
    req = "INSERT INTO quart_calendrier(idUsine,idAction,date_heure_debut,quart,termine,date_heure_fin, finReccurrence, recurrencePhrase) "
      + "VALUES(" + reqQ.idUsine + "," + reqQ.idAction + ",'" + reqQ.dateDeb + "'," + reqQ.quart + "," + reqQ.termine + ",'" + reqQ.dateFin + "','" + reqQ.dateFinReccurrence + "','"+reqQ.recurrencePhrase+"')"
  }
  pool.query(req
    , (err, result) => {
      if (err) {
        currentLineError = currentLine(); throw err;
      }
      else response.json("Création de l'instance OK !");
    });
});

//Créer une action
//?idUsine=1&idRonde=1&datedeb=''&dateFin=''
app.put("/newAction", middleware, (request, response) => {
  const reqQ = request.query;
  const nom = reqQ.nom.replace(/'/g, "''");
  pool.query("INSERT INTO quart_action(idUsine,nom,date_heure_debut,date_heure_fin) OUTPUT INSERTED.id, INSERTED.date_heure_debut,INSERTED.date_heure_fin "
    + "VALUES(" + reqQ.idUsine + ",'" + nom + "','" + reqQ.dateDeb + "','" + reqQ.dateFin + "')"
    , (err, data) => {
      if (err) {
        currentLineError = currentLine(); throw err;
      }
      //if(err) console.log(err);
      data = data['recordset'];
      response.json({ data });
    });
});

//DELETE évènement
app.delete("/deleteCalendrier/:id", middleware, (request, response) => {
  const reqP = request.params
  pool.query("DELETE FROM quart_calendrier WHERE id = " + reqP.id, (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    response.json("Suppression de l'evenement du calendrier OK")
  });
});

//DELETE évènement
//?dateDeb
app.delete("/deleteActionCalendrier/:idAction", middleware, (request, response) => {
  const reqP = request.params
  const reqQ = request.query
  pool.query("DELETE FROM quart_calendrier WHERE date_heure_debut >= CONVERT(varchar, '" + reqQ.dateDeb + "', 103) and idAction = " + reqP.idAction, (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    response.json("Suppression des actions du calendrier OK")
  });
});


//DELETE évènement
//?quart=1&?dateDeb
app.delete("/deleteZoneCalendrier/:idZone", middleware, (request, response) => {
  const reqP = request.params
  const reqQ = request.query
  pool.query("DELETE FROM quart_calendrier WHERE date_heure_debut >= CONVERT(varchar, '" + reqQ.dateDeb + "', 103) and idZone = " + reqP.idZone + " and quart = " + reqQ.quart, (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    response.json("Suppression des zones du calendrier OK")
  });
});

app.put("/updateFinRecurrenceZoneCalendrier/:idZone", middleware, (request, response) => {
  const reqP = request.params
  const reqQ = request.query
  pool.query("UPDATE quart_calendrier SET finReccurrence = NULL, recurrencePhrase = NULL WHERE date_heure_debut <= CONVERT(date, '" + reqQ.dateDeb + "', 120) and idZone = " + reqP.idZone + " and quart = " + reqQ.quart, (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    response.json("Suppression des zones du calendrier OK")
  });
});
app.put("/updateFinRecurrenceActionCalendrier/:idAction", middleware, (request, response) => {
  const reqP = request.params
  const reqQ = request.query
  pool.query("UPDATE quart_calendrier SET finReccurrence = NULL, recurrencePhrase = NULL WHERE date_heure_debut <= CONVERT(date, '" + reqQ.dateDeb + "', 120) and idAction = " + reqP.idAction + " and quart = " + reqQ.quart, (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    response.json("Suppression des zones du calendrier OK")
  });
});
//Récupérer les évènement suivant de l'occurence pour supprimer une occurence complète
app.delete("/deleteEventsSuivant/:id", middleware, (request, response) => {
  const reqP = request.params
  //ON récupère déjà les infos de l'event choisi
  pool.query("SELECT * from quart_calendrier WHERE id = " + reqP.id, (err, event) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    event = event['recordset'][0];
    //ON récupère les infos de l'action associé
    pool.query("SELECT * from quart_action WHERE id = " + event.idAction, (err, action) => {
      if (err) {
        currentLineError = currentLine(); throw err;
      }
      action = action['recordset'][0];
      //On récupère la liste des actions lié
      pool.query("SELECT id FROM quart_action WHERE idUsine = " + action.idUsine + " AND nom = '" + action.nom + "'", (err, data) => {
        if (err) {
          currentLineError = currentLine(); throw err;
        }
        data = data['recordset'];
        //Pour chaque action on supprime dans le calendrier celle sur le quart
        for (const actions of data) {
          pool.query("DELETE FROM quart_calendrier WHERE idAction = " + actions.id + " AND quart = " + event.quart, (err, data) => {
            if (err) {
              //currentLineError=currentLine(); throw err;
              console.log(err);
            }
          });
        };
        response.json("Suppression de l'occurence du calendrier OK");
      });
    });
  });
});


//ACCUEIL /////

//Récupérer tout les evenements d'un quart
//?idUsine=1&datedeb=''&dateFin=''
app.get("/getEvenementsRonde", middleware, (request, response) => {
  const reqQ = request.query;
  pool.query("SELECT e.id, e.titre, e.idUsine, CONVERT(varchar, e.date_heure_debut, 103)+ ' ' + CONVERT(varchar, e.date_heure_debut, 108) as 'date_heure_debut', CONVERT(varchar, e.date_heure_fin, 103)+ ' ' + CONVERT(varchar, e.date_heure_fin, 108) as 'date_heure_fin', e.importance, e.groupementGMAO, e.equipementGMAO, e.cause, e.description, e.demande_travaux, e.consigne, e.url  FROM quart_evenement e WHERE e.isActive = 1 and e.date_heure_debut < '" + reqQ.dateFin + "' and e.date_heure_fin > '" + reqQ.dateDeb + "' and idUsine = " + reqQ.idUsine, (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    data = data['recordset'];
    response.json({ data });
  });
});

//Récupérer toutes les action présentes dans la table calndrier pour une usine
//?idUsine=1&datedeb=''&dateFin=''
app.get("/getActionsRonde", middleware, (request, response) => {
  const reqQ = request.query;
  pool.query("select a.nom, c.*, u.nom as 'nomRondier', u.prenom as 'prenomRondier' from quart_calendrier c full outer join users u on u.id = c.idUser full outer join quart_action a on a.id = c.idAction where a.date_heure_debut = '"+reqQ.dateDeb+"' and c.date_heure_fin = '"+reqQ.dateFin+"' and  c.id is not null and c.idAction is not null and c.idUsine = "+reqQ.idUsine, (err,data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    data = data['recordset'];
    response.json({ data });
  });
});

//Récupérer les zone affectée à une ronde
//?idUsine=1&datedeb=''&idZone=3
app.get("/getZonesCalendrierRonde", (request, response) => {
  const reqQ = request.query;
  BadgeAndElementsOfZone = [];
  let condZone = "";
  //Si on est sur calce (idUsine 7) alors on récupère seulement 1 zone
  if (reqQ.idUsine == 7 && reqQ.idZone > 0) {
    condZone = "c.idZone = " + reqQ.idZone
  }
  else condZone = "c.idZone is not null"
  pool.query("select c.id, c.idUsine, c.idZone, u.nom as 'nomRondier', u.prenom as 'prenomRondier', c.idZone as 'zoneId', z.nom as 'nomZone', z.commentaire, z.four , c.idAction, CONVERT(varchar, c.date_heure_debut, 103)+ ' ' + CONVERT(varchar, c.date_heure_debut, 108) as 'date_heure_debut',CONVERT(varchar, c.date_heure_fin, 103)+ ' ' + CONVERT(varchar, c.date_heure_fin, 108) as 'date_heure_fin', c.quart, c.termine, b.uid as 'uidBadge' from quart_calendrier c full outer join zonecontrole z on z.id = c.idZone full outer join users u on u.id = c.idUser full outer join badge b on b.zoneId = z.id where c.date_heure_debut = '" + reqQ.dateDeb + "' and " + condZone + " and c.idUsine = " + reqQ.idUsine, async (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    else {
      data = data['recordset'];
      //On récupère l'Id de la ronde précedente -> on récupère désormais la dernière valeur connue
      //await getPreviousId(reqQ.idUsine);
      //On boucle sur chaque zone et son badge pour récupérer ses éléments
      for await (const zone of data) {
        await getElementsHorsLigne(zone);
      };
      response.json({ BadgeAndElementsOfZone });
    }
  });
});

////FIN ACCUEIL///

//ACTIONS////

//Récupérer toutes les actions d'une usine
//?idUsine=1
app.get("/getAllAction", middleware, (request, response) => {
  const reqQ = request.query;
  pool.query("select a.nom, CONVERT(varchar, a.date_heure_debut, 103)+ ' ' + CONVERT(varchar, a.date_heure_debut, 108) as 'date_heure_debut', CONVERT(varchar, a.date_heure_fin, 103)+ ' ' + CONVERT(varchar, a.date_heure_fin, 108) as 'date_heure_fin' from quart_action a where a.idUsine = " + reqQ.idUsine, (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    data = data['recordset'];
    response.json({ data });
  });
});

//Récupérer une action
//?idAction=7
app.get("/getOneAction", middleware, (request, response) => {
  const reqQ = request.query;
  pool.query("SELECT * FROM quart_action WHERE id = " + reqQ.idAction, (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    data = data['recordset'];
    response.json({ data });
  });
});

//Modifier une action
//?nom=test&importance=0&dateDeb=2024-01-10 10:00&dateFin=2024-01-10 10:00&idAction=1
app.put("/updateAction", middleware, (request, response) => {
  const reqQ = request.query;
  const nom = reqQ.nom.replace(/'/g, "''");
  pool.query("UPDATE quart_action SET nom ='" + nom + "',date_heure_debut='" + reqQ.dateDeb + "',date_heure_Fin='" + reqQ.dateFin + "' WHERE id=" + reqQ.idAction
    , (err, result) => {
      if (err) {
        currentLineError = currentLine(); throw err;
      }
      else response.json("Modif de l'actu OK !");
    });
});

//Modifier une action dans la table calendrier
//?nom=test&importance=0&dateDeb=2024-01-10 10:00&dateFin=2024-01-10 10:00&idAction=1
app.put("/updateCalendrierAction", middleware, (request, response) => {
  const reqQ = request.query;
  pool.query("UPDATE quart_calendrier SET date_heure_debut='" + reqQ.dateDeb + "',date_heure_Fin='" + reqQ.dateFin + "', quart=" + reqQ.quart + " WHERE idAction=" + reqQ.idAction
    , (err, result) => {
      if (err) {
        currentLineError = currentLine(); throw err;
      }
      else response.json("Modif de l'actu OK !");
    });
});


//Récupérer toutes les actions d'une usine
//?idUsine=1&dateDeb=''&dateFin=''
app.get("/getActionsEntreDeuxDates", middleware, (request, response) => {
  const reqQ = request.query;
  pool.query("select 'Action' as 'typeDonnee', a.nom, CONVERT(varchar, a.date_heure_debut, 103)+ ' ' + CONVERT(varchar, a.date_heure_debut, 108) as 'date_heure_debut', CONVERT(varchar, a.date_heure_fin, 103)+ ' ' + CONVERT(varchar, a.date_heure_fin, 108) as 'date_heure_fin', a.id from quart_action a where  a.date_heure_debut < '" + reqQ.dateFin + "' and a.date_heure_fin > '" + reqQ.dateDeb + "' and a.nom like '%" + reqQ.titre + "%' and a.idUsine = " + reqQ.idUsine, (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    data = data['recordset'];
    response.json({ data });
  });
});


/** Stockage des fichiers PDF de fin de quart */
//?idUsine=1&quart=Matin&date=
//passage du fichier dans un formData portant le nom 'fichier'
app.post("/stockageRecapQuart", multer({ storage: storage }).single('fichier'), (request, response) => {
  const reqQ = request.query;
  let dateFormat = reqQ.date.substring(0, 2) + '/' + reqQ.date.substring(3, 5) + "/" + reqQ.date.substring(6, 10);
  let quartInt = 3;
  if (reqQ.quart == 'Matin') quartInt = 1;
  else if (reqQ.quart == 'Apres-midi') quartInt = 2;

  let maillist = '';
  //création de l'url de stockage du fichier
  //const url = `${request.protocol}://${request.get('host')}/fichiers/${request.file.filename.replace("[^a-zA-Z0-9]", "")}`;
  //on utilise l'url publique
  const url = `${request.protocol}://capexploitation.paprec.com/capexploitation/fichiers/${request.file.filename.replace("[^a-zA-Z0-9]", "")}`;
  //Update de la table ronde pour stocker le PDF
  pool.query("UPDATE ronde SET urlPDF = '" + url + "' WHERE quart = " + quartInt + " AND dateHeure LIKE '" + dateFormat + "' AND idUsine = " + reqQ.idUsine, (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
  });
  //Récupération des utilisateurs admin pour envoyer le PDF par mail
  pool.query("SELECT * FROM users WHERE isAdmin = 1 AND idUsine = " + reqQ.idUsine, (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    data = data['recordset'];
    data.forEach(user => {
      if (user.email.length > 0) maillist += user.email + ';';
    });

    /** ENVOI MAIL */
    //Préparation du mail
    const message = {
      from: process.env.USER_SMTP, // Sender address
      to: maillist,
      subject: "Récapitulatif quart : " + reqQ.quart + " - " + reqQ.date, // Subject line
      html: "<h3>Voici le lien pour visualiser le PDF de récap de quart : <a href='" + url + "'>" + url + "</a></h3>"//Cors du mail en HTML
    };

    transporter.sendMail(message, function (err, info) {
      if (err) {
        console.log(err);
        response.json("Envoi mail KO");
        //currentLineError=currentLine(); throw err;
      } else {
        console.log('*** Récap PDF ***' + new Date() + ' - Email sent to ' + maillist + ' : ' + info.response);
        response.json("Envoi mail OK");
      }
    });
    /** FIN ENVOI MAIL */
  });
});

//Récupérer l'url du PDF pour le récap de quart
//?idUsine=1&date=''&quart=''
app.get("/getURLPDF", middleware, (request, response) => {
  const reqQ = request.query;
  pool.query("select DISTINCT urlPDF FROM ronde where dateHeure LIKE '" + reqQ.date + "' and quart = " + reqQ.quart + " and idUsine = " + reqQ.idUsine, (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    data = data['recordset'];
    response.json({ data });
  });
});


//////////////////////////
//  Fin Cahier de quart //
//////////////////////////

//////////////////////////
//    Registre DNDTS    //
//////////////////////////

app.put("/registreDNDTS", middleware, (request, response) => {
  const reqQ = request.query;
  for (var i = 0; i < request.body.data.length; i++) {

    pool.query("IF NOT EXISTS (SELECT * FROM registre_DNDTS WHERE numDePesee = '" + request.body.data[i].numDePesee + "')"
      + " BEGIN "
      + "INSERT INTO [dbo].[registre_DNDTS] ([numDePesee],[type],[date1],[codeBadge],[codeVehicule],[codeClient],[nomClient],[poids1],[poids1DSD],[poids1DateHeure],[pontBasculeP1],[Date2],[poids2],[poids2DSD],[poids2DateHeure],[pontBasculeP2],[net],[tempsDeRetenue],[codeSociete],[nomSociete],[codeFamilleVehicule],[nomFamilleVehicule],[codeFamilleTransporteur],[nomFamilleTransporteur],[codeTransporteur],[nomTransporteur],[codeFamilleClient] ,[nomFamilleClient],[codeFamilleProduit],[nomFamilleProduit],[codeProduit],[nomProduit],[codeCollecte],[nomCollecte],[codeDestination],[nomDestination],[codeChantier],[nomChantier],[codeChauffeur],[nomChauffeur],[codeFamilleBenne],[nomFamilleBenne],[codeBenne],[nomBenne],[codeZoneDeStockage],[nomZoneDeStockage],[codeFichier1],[nomFichier1],[codeFichier2],[nomFichier2],[codeFichier3],[nomFichier3],[codeFichier4],[nomFichier4],[terminee],[supprimee],[modifie],[humidite],[proteine],[impurete],[poidsSpecifique],[parcelle],[calibration],[numeroCommande],[numeroDeBSB],[adresse1Societe],[adresse2Societe],[codePostalSociete],[villeSociete],[mobileSociete],[telephoneSociete],[faxSociete],[modeDegrade],[borne],[numeroDePeseeBorne],[creeLe],[creePar],[creeSur],[modifieLe],[modifiePar],[modifieSur],[idUsine], [adresseClient], [codePostalClient], [villeClient], [siret]) VALUES("
      + "'" + request.body.data[i].numDePesee + "',"
      + "'" + request.body.data[i].type + "',"
      + "'" + request.body.data[i].date1 + "',"
      + "'" + request.body.data[i].codeBadge + "',"
      + "'" + request.body.data[i].codeVehicule + "',"
      + "'" + request.body.data[i].codeClient + "',"
      + "'" + request.body.data[i].nomClient + "',"
      + "'" + request.body.data[i].poids1 + "',"
      + "'" + request.body.data[i].poids1DSD + "',"
      + "'" + request.body.data[i].poids1DateHeure + "',"
      + "'" + request.body.data[i].pontBasculeP1 + "',"
      + "'" + request.body.data[i].Date2 + "',"
      + "'" + request.body.data[i].poids2 + "',"
      + "'" + request.body.data[i].poids2DSD + "',"
      + "'" + request.body.data[i].poids2DateHeure + "',"
      + "'" + request.body.data[i].pontBasculeP2 + "',"
      + "'" + request.body.data[i].net + "',"
      + "'" + request.body.data[i].tempsDeRetenue + "',"
      + "'" + request.body.data[i].codeSociete + "',"
      + "'" + request.body.data[i].nomSociete + "',"
      + "'" + request.body.data[i].codeFamilleVehicule + "',"
      + "'" + request.body.data[i].nomFamilleVehicule + "',"
      + "'" + request.body.data[i].codeFamilleTransporteur + "',"
      + "'" + request.body.data[i].nomFamilleTransporteur + "',"
      + "'" + request.body.data[i].codeTransporteur + "',"
      + "'" + request.body.data[i].nomTransporteur + "',"
      + "'" + request.body.data[i].codeFamilleClient + "',"
      + "'" + request.body.data[i].nomFamilleClient + "',"
      + "'" + request.body.data[i].codeFamilleProduit + "',"
      + "'" + request.body.data[i].nomFamilleProduit + "',"
      + "'" + request.body.data[i].codeProduit + "',"
      + "'" + request.body.data[i].nomProduit + "',"
      + "'" + request.body.data[i].codeCollecte + "',"
      + "'" + request.body.data[i].nomCollecte + "',"
      + "'" + request.body.data[i].codeDestination + "',"
      + "'" + request.body.data[i].nomDestination + "',"
      + "'" + request.body.data[i].codeChantier + "',"
      + "'" + request.body.data[i].nomChantier + "',"
      + "'" + request.body.data[i].codeChauffeur + "',"
      + "'" + request.body.data[i].nomChauffeur + "',"
      + "'" + request.body.data[i].codeFamilleBenne + "',"
      + "'" + request.body.data[i].nomFamilleBenne + "',"
      + "'" + request.body.data[i].codeBenne + "',"
      + "'" + request.body.data[i].nomBenne + "',"
      + "'" + request.body.data[i].codeZoneDeStockage + "',"
      + "'" + request.body.data[i].nomZoneDeStockage + "',"
      + "'" + request.body.data[i].codeFichier1 + "',"
      + "'" + request.body.data[i].nomFichier1 + "',"
      + "'" + request.body.data[i].codeFichier2 + "',"
      + "'" + request.body.data[i].nomFichier2 + "',"
      + "'" + request.body.data[i].codeFichier3 + "',"
      + "'" + request.body.data[i].nomFichier3 + "',"
      + "'" + request.body.data[i].codeFichier4 + "',"
      + "'" + request.body.data[i].nomFichier4 + "',"
      + "'" + request.body.data[i].terminee + "',"
      + "'" + request.body.data[i].supprimee + "',"
      + "'" + request.body.data[i].modifie + "',"
      + "'" + request.body.data[i].humidite + "',"
      + "'" + request.body.data[i].proteine + "',"
      + "'" + request.body.data[i].impurete + "',"
      + "'" + request.body.data[i].poidsSpecifique + "',"
      + "'" + request.body.data[i].parcelle + "',"
      + "'" + request.body.data[i].calibration + "',"
      + "'" + request.body.data[i].numeroCommande + "',"
      + "'" + request.body.data[i].numeroDeBSB + "',"
      + "'" + request.body.data[i].adresse1Societe + "',"
      + "'" + request.body.data[i].adresse2Societe + "',"
      + "'" + request.body.data[i].codePostalSociete + "',"
      + "'" + request.body.data[i].villeSociete + "',"
      + "'" + request.body.data[i].mobileSociete + "',"
      + "'" + request.body.data[i].telephoneSociete + "',"
      + "'" + request.body.data[i].faxSociete + "',"
      + "'" + request.body.data[i].modeDegrade + "',"
      + "'" + request.body.data[i].borne + "',"
      + "'" + request.body.data[i].numeroDePeseeBorne + "',"
      + "'" + request.body.data[i].creeLe + "',"
      + "'" + request.body.data[i].creePar + "',"
      + "'" + request.body.data[i].creeSur + "',"
      + "'" + request.body.data[i].modifieLe + "',"
      + "'" + request.body.data[i].modifiePar + "',"
      + "'" + request.body.data[i].modifieSur + "',"
      + "" + request.body.data[i].idUsine + ","
      + "'" + request.body.data[i].adresseClient + "',"
      + "'" + request.body.data[i].codePostalClient + "',"
      + "'" + request.body.data[i].villeClient + "',"
      + "'" + request.body.data[i].siret + "')"
      + "END;"
      , (err, result) => {
        if (err) {
          currentLineError = currentLine(); throw err;
        }
      });
  }
  response.json("Insertion");
});

//Générer les colonnes pour dnd-entrant
//?idUsine=7
app.get("/getRegistreDNDTSEntrants", middleware, (request, response) => {
  const reqQ = request.query;
  // +" and date1 >'"+reqQ.dateDeb+"' and date1 <'"+reqQ.dateFin+"'order by date1"
  pool.query("select numDePesee as 'identifiantMetier', 'NON' as 'dechetPOP', LEFT(date1,10) as 'dateReception', LEFT(RIGHT(date1,8),5) as 'heurePeseeDechet', REPLACE(RIGHT(nomProduit,8),'-',' ') as 'codeDechet', nomProduit as 'denominationUsuelle', 'B3020' as 'codeDechetBale', REPLACE(CAST(net AS INT)/1000.000,',','.') as 'quantite', 'T' as 'codeUnite', 'ENTREPRISE_FR' as 'producteur.type', nomClient as 'producteur.raisonSociale', siret as 'producteur.numeroIdentification', codePostalClient as 'porducteur.codePostal', villeClient as 'producteur.adresse.commune', 'FR' as 'producteur.adresse.pays', adresseClient as 'producteur.adresse.libelle', '' as 'communes.codeInsee', '' as 'communes.libelle', 'ENTREPRISE_FR' as 'expediteur.type', '' as 'expediteur.adressePriseEnCharge', nomClient as 'expediteur.raisonSociale', siret as 'expediteur.numeroIdentification', codePostalClient as 'expediteur.adresse.codePostal', villeClient as 'epediteur.adresse.commune', 'FR' as 'expediteur.adresse.pays', adresseClient as 'expediteur.adresse.libelle', 'ENTREPRISE_FR' as 'transporteur.type', nomClient as 'transporteur.raisonSociale', siret as 'transporteur.numeroIdentification', codePostalClient as 'transporteur.adresse.codePostal', villeClient as 'tansporteur.adresse.commune', 'FR' as 'transporteur.adresse.pays', adresseClient as 'transporteur.adresse.libelle','' as 'transporteurs.numeroRecipisse', '' as 'courtier.type', '' as 'courtier.numeroRecipisse', '' as 'courtier.raisonSociale', '' as 'courtier.numeroIdentification', '' as 'ecoOrganisme.type', '' as 'ecoOrganisme.raisonSociale', '' as 'ecoOrganisme.numeroIdentification', 'R1' as 'codeTraitement', '' as 'numeroDocument', '' as 'numeroNotification',numDePesee as 'numeroSaisie' from registre_DNDTS where CONVERT(DATE,date1,103) BETWEEN '" + reqQ.dateDeb + "' AND '" + reqQ.dateFin + "' and type='RECEPTION' and idUsine =" + reqQ.idUsine
    , (err, data) => {
      if (err) {
        currentLineError = currentLine(); throw err;
      }
      data = data['recordset'];
      response.json({ data });
    });
});

//Générer les colonnes pour dnd-sortant
//?idUsine=7
app.get("/getRegistreDNDTSSortants", middleware, (request, response) => {
  const reqQ = request.query;
  // +" and date1 >'"+reqQ.dateDeb+"' and date1 <'"+reqQ.dateFin+"'order by date1"
  pool.query("select '' as 'identifiantMetier', 'NON' as 'dechetPOP', LEFT(date1,10) as 'dateExpedition', RIGHT(nomProduit,8) as 'codeDechet',nomProduit as 'denominationUsuelle', '' as 'codeDechetBale', CAST(net AS INT)/1000.000 as 'quantite', 'T' as 'codeUnite', 'ENTREPRISE_FR' as 'producteur.type', nomClient as 'producteur.raisonSociale', siret as 'producteur.numeroIdentification', codePostalClient as 'porducteur.codePostal', villeClient as 'producteur.adresse.commune', 'FR' as 'producteur.adresse.pays', adresseClient as 'producteur.adresse.libelle', '' as 'communes.codeInsee', '' as 'communes.libelle','ENTREPRISE_FR' as 'transporteur.type', nomClient as 'transporteur.raisonSociale', siret as 'transporteur.numeroIdentification', codePostalClient as 'transporteur.adresse.codePostal', villeClient as 'tansporteur.adresse.commune', 'FR' as 'transporteur.adresse.pays', adresseClient as 'transporteur.adresse.libelle','' as 'transporteurs.numeroRecipisse', '' as 'courtier.type', '' as 'courtier.numeroRecipisse', '' as 'courtier.raisonSociale', '' as 'courtier.numeroIdentification', '' as 'ecoOrganisme.type', '' as 'ecoOrganisme.raisonSociale', '' as 'ecoOrganisme.numeroIdentification', '' AS 'destinataire.type', '' AS 'destinataire.raisonSociale', '' as 'destinataire.numeroIdentification', '' as 'destinataire.adresse.codePostal', '' as 'destinataire.adresse.commune', '' as 'destinataire.adresse.pays', '' as 'destinataire.adresse.pays', '' as 'destinataire.adresse.libelle', '' as 'destinataire.adresseDestination', 'R1' as 'codeTraitement', '' as 'codeQualification', '' as 'numeroDocument', '' as 'numeroNotification', '' as 'numeroSaisie', '' as 'etablissementOrigine.adresse.codePostal', '' as 'etablissementOrigine.adresse.commune', '' as 'etablissementOrigine.adresse.pays', '' as 'etablissementOrigine.adress.libelle', '' as 'etablissementOrigine.adressePriseEnCharge' from registre_DNDTS where CONVERT(DATE,date1,103) BETWEEN '" + reqQ.dateDeb + "' AND '" + reqQ.dateFin + "' and type='EXPEDITION' and idUsine =" + reqQ.idUsine
    , (err, data) => {
      if (err) {
        currentLineError = currentLine(); throw err;
      }
      data = data['recordset'];
      response.json({ data });
    });
});


//////////////////////////////
//    FIN Registre DNDTS    //
//////////////////////////////


//Récupérer toutes les anomalies d'une usine
//?idUsine=7
app.get("/getAllAnomalies", middleware, (request, response) => {
  const reqQ = request.query;
  // +" and date1 >'"+reqQ.dateDeb+"' and date1 <'"+reqQ.dateFin+"'order by date1"
  pool.query("select z.nom, * from anomalie a join ronde r on r.id = a.rondeId join zonecontrole z on z.id = a.zoneId where r.idUsine = " + reqQ.idUsine + " ORDER BY a.id DESC"
    , (err, data) => {
      if (err) {
        currentLineError = currentLine(); throw err;
      }
      data = data['recordset'];
      response.json({ data });
    });
});

//Mette à un la colonne évènement dans la table anomalie
//?idAnomalie=1
app.put("/updateAnomalieSetEvenement", middleware, (request, response) => {
  const reqQ = request.query;
  pool.query("UPDATE anomalie SET evenement = 1 WHERE id=" + reqQ.idAnomalie
    , (err, result) => {
      if (err) {
        currentLineError = currentLine(); throw err;
      }
      else response.json("Modif de l'anomalie OK !");
    });
});

//Récupérer une anomalie
//?idAnomalie=7
app.get("/getOneAnomalie", middleware, (request, response) => {
  const reqQ = request.query;
  // +" and date1 >'"+reqQ.dateDeb+"' and date1 <'"+reqQ.dateFin+"'order by date1"
  pool.query("select * from anomalie where id = " + reqQ.idAnomalie
    , (err, data) => {
      if (err) {
        currentLineError = currentLine(); throw err;
      }
      data = data['recordset'];
      response.json({ data });
    });
});




//////////////////////////////
//    Liens externes        //
//////////////////////////////

//Récupérer un lien externe
//?idLien=7
app.get("/getOneLienExterne", middleware, (request, response) => {
  const reqQ = request.query;
  pool.query("select * from quart_liensExternes where id = " + reqQ.idLien
    , (err, data) => {
      if (err) {
        currentLineError = currentLine(); throw err;
      }
      data = data['recordset'];
      response.json({ data });
    });
});


//Récupérer tous les liens externes
//?idUsine=7
app.get("/getAllLiensExternes", middleware, (request, response) => {
  const reqQ = request.query;
  pool.query("select * from quart_liensExternes where idUsine = " + reqQ.idUsine
    , (err, data) => {
      if (err) {
        currentLineError = currentLine(); throw err;
      }
      data = data['recordset'];
      response.json({ data });
    });
});

//Récupérer tous les liens externes actifs
//?idUsine=7
app.get("/getActifsLiensExternes", middleware, (request, response) => {
  const reqQ = request.query;
  pool.query("select * from quart_liensExternes where actif = 1 and idUsine = " + reqQ.idUsine
    , (err, data) => {
      if (err) {
        currentLineError = currentLine(); throw err;
      }
      data = data['recordset'];
      response.json({ data });
    });
});

//Modifier un lien externe
//nom=??&url=??&idLien=2
app.put("/updateLienExterne", middleware, (request, response) => {
  const reqQ = request.query;
  const nom = reqQ.nom.replace(/'/g, "''");
  const url = reqQ.url.replace(/'/g, "''");
  pool.query("UPDATE quart_liensExternes SET nom = '" + nom + "',url='" + url + "' where id=" + reqQ.idLien
    , (err, result) => {
      if (err) {
        currentLineError = currentLine(); throw err;
      }
      else response.json("Modif du lien OK !");
    });
});

//Nouveau lien externe
//nom=??&url=??&idUsine=2
app.put("/newLienExterne", middleware, (request, response) => {
  const reqQ = request.query;
  const nom = reqQ.nom.replace(/'/g, "''");
  const url = reqQ.url.replace(/'/g, "''");
  pool.query("INSERT INTO quart_liensExternes(nom,url,actif,idUsine) VALUES('" + nom + "','" + url + "',0," + reqQ.idUsine + ")"
    , (err, result) => {
      if (err) {
        currentLineError = currentLine(); throw err;
      }
      else response.json("Création du lien OK !");
    });
});

//activer un lien externe
//idLien=2
app.put("/activerLien", middleware, (request, response) => {
  const reqQ = request.query;
  pool.query("UPDATE quart_liensExternes SET actif = 1 where id=" + reqQ.idLien
    , (err, result) => {
      if (err) {
        currentLineError = currentLine(); throw err;
      }
      else response.json("Modif du lien OK !");
    });
});

//desactiver un lien externe
//idLien=2
app.put("/desactiverLien", middleware, (request, response) => {
  const reqQ = request.query;
  pool.query("UPDATE quart_liensExternes SET actif = 0 where id=" + reqQ.idLien
    , (err, result) => {
      if (err) {
        currentLineError = currentLine(); throw err;
      }
      else response.json("Modif du lien OK !");
    });
});

//Supprimer un lien externe
//?idLien=
app.delete("/deleteLienExterne", middleware, (request, response) => {
  const reqQ = request.query
  pool.query("delete from quart_liensExternes where id =" + reqQ.idLien, (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    response.json("Suppression du lien OK")
  });
});
//////////////////////////////
//    FIN Liens externes    //
//////////////////////////////


///////////////////////////
//      Historique       //
///////////////////////////

//Création d'un évènement
//?idUser=1&idEvenement=123&dateHeure=???&idUsine=1
app.put("/historiqueEvenementCreate", middleware, (request, response) => {
  const reqQ = request.query;
  pool.query("INSERT INTO quart_historique(idUser,dateHeure,idEvenement,creation,idUsine) VALUES(" + reqQ.idUser + ",'" + reqQ.dateHeure + "'," + reqQ.idEvenement + ",1," + reqQ.idUsine + ")"
    , (err, result) => {
      if (err) {
        currentLineError = currentLine(); throw err;
      }
      else response.json("Ajout OK !");
    });
});

//Update d'un évènement
//?idUser=1&idEvenement=123&dateHeure=???&idUsine=1
app.put("/historiqueEvenementUpdate", middleware, (request, response) => {
  const reqQ = request.query;
  pool.query("INSERT INTO quart_historique(idUser,dateHeure,idEvenement,edition,idUsine) VALUES(" + reqQ.idUser + ",'" + reqQ.dateHeure + "'," + reqQ.idEvenement + ",1," + reqQ.idUsine + ")"
    , (err, result) => {
      if (err) {
        currentLineError = currentLine(); throw err;
      }
      else response.json("Ajout OK !");
    });
});

//Suppression d'un évènement
//?idUser=1&idEvenement=123&dateHeure=???&idUsine=1
app.put("/historiqueEvenementDelete", middleware, (request, response) => {
  const reqQ = request.query;
  pool.query("INSERT INTO quart_historique(idUser,dateHeure,idEvenement,suppression,idUsine) VALUES(" + reqQ.idUser + ",'" + reqQ.dateHeure + "'," + reqQ.idEvenement + ",1," + reqQ.idUsine + ")"
    , (err, result) => {
      if (err) {
        currentLineError = currentLine(); throw err;
      }
      else response.json("Ajout OK !");
    });
});

//Prise de quart
//?idUser=1&dateHeure=???&idUsine=1
app.put("/historiquePriseQuart", middleware, (request, response) => {
  const reqQ = request.query;
  pool.query("INSERT INTO quart_historique(idUser,dateHeure,priseQuart,idUsine) VALUES(" + reqQ.idUser + ",'" + reqQ.dateHeure + "',1," + reqQ.idUsine + ")"
    , (err, result) => {
      if (err) {
        currentLineError = currentLine(); throw err;
      }
      else response.json("Ajout OK !");
    });
});


//Création d'une actu
//?idUser=1&idActu=123&dateHeure=???&idUsine=1
app.put("/historiqueActuCreate", middleware, (request, response) => {
  const reqQ = request.query;
  pool.query("INSERT INTO quart_historique(idUser,dateHeure,idActu,creation,idUsine) VALUES(" + reqQ.idUser + ",'" + reqQ.dateHeure + "'," + reqQ.idActu + ",1," + reqQ.idUsine + ")"
    , (err, result) => {
      if (err) {
        currentLineError = currentLine(); throw err;
      }
      else response.json("Ajout OK !");
    });
});


//Update d'une actu
//?idUser=1&idActu=123&dateHeure=???&idUsine=1
app.put("/historiqueActuUpdate", middleware, (request, response) => {
  const reqQ = request.query;
  pool.query("INSERT INTO quart_historique(idUser,dateHeure,idActu,edition,idUsine) VALUES(" + reqQ.idUser + ",'" + reqQ.dateHeure + "'," + reqQ.idActu + ",1," + reqQ.idUsine + ")"
    , (err, result) => {
      if (err) {
        currentLineError = currentLine(); throw err;
      }
      else response.json("Ajout OK !");
    });
});

//Création d'une consigne
//?idUser=1&idConsigne=123&dateHeure=???&idUsine=1
app.put("/historiqueConsigneCreate", middleware, (request, response) => {
  const reqQ = request.query;
  pool.query("INSERT INTO quart_historique(idUser,dateHeure,idConsigne,creation,idUsine) VALUES(" + reqQ.idUser + ",'" + reqQ.dateHeure + "'," + reqQ.idConsigne + ",1," + reqQ.idUsine + ")"
    , (err, result) => {
      if (err) {
        currentLineError = currentLine(); throw err;
      }
      else response.json("Ajout OK !");
    });
});


//Update d'une consigne
//?idUser=1&idConsigne=123&dateHeure=???&idUsine=1
app.put("/historiqueConsigneUpdate", middleware, (request, response) => {
  const reqQ = request.query;
  pool.query("INSERT INTO quart_historique(idUser,dateHeure,idConsigne,edition,idUsine) VALUES(" + reqQ.idUser + ",'" + reqQ.dateHeure + "'," + reqQ.idConsigne + ",1," + reqQ.idUsine + ")"
    , (err, result) => {
      if (err) {
        currentLineError = currentLine(); throw err;
      }
      else response.json("Ajout OK !");
    });
});

//Delete d'une consigne
//?idUser=1&idConsigne=123&dateHeure=???&idUsine=1
app.put("/historiqueConsigneDelete", middleware, (request, response) => {
  const reqQ = request.query;
  pool.query("INSERT INTO quart_historique(idUser,dateHeure,idConsigne,suppression,idUsine) VALUES(" + reqQ.idUser + ",'" + reqQ.dateHeure + "'," + reqQ.idConsigne + ",1," + reqQ.idUsine + ")"
    , (err, result) => {
      if (err) {
        currentLineError = currentLine(); throw err;
      }
      else response.json("Ajout OK !");
    });
});


////////////////////////
////Rondier tablette////
////////////////////////

//Récupérer les actions du quart selon idUsine,le quart,
//?idUsine=1&quart=1
app.get("/actionsDuQuart/:idUsine/:quart", (request, response) => {
  const reqQ = request.query
  const reqP = request.params
  pool.query("SELECT a.nom, a.id FROM [dolibarr].[dbo].[quart_calendrier] c INNER JOIN [dolibarr].[dbo].[quart_action] a ON a.id = c.idAction "
    + "WHERE c.idUsine = " + reqP.idUsine + " AND c.quart = " + reqP.quart + " AND c.termine = 0 "
    + "AND c.date_heure_debut = '" + reqQ.date_heure_debut + "'", (err, data) => {
      if (err) {
        currentLineError = currentLine(); throw err;
      }
      data = data['recordset'];
      response.json({ data });
    });
});

//Controler s'il y a des zones sur la ronde du quart
app.get("/recupZonesQuart/:idUsine/:quart", (request, response) => {
  const reqP = request.params;
  const reqQ = request.query;
  pool.query("SELECT COUNT(idZone) as nombreDeZones FROM quart_calendrier c WHERE c.quart = " + reqP.quart + " AND c.idUsine = " + reqP.idUsine + " AND c.date_heure_debut = '" + reqQ.date_heure_debut + "' AND c.idZone is NOT NULL"
    , (err, data) => {
      if (err) {
        currentLineError = currentLine(); throw err;
      }
      data = data['recordset'];
      response.json(data[0].nombreDeZones);
    });
});

//a la validation de zone, on update calendrier zone sur termine = 1
//Mise à jour des information d'une zone sur le quart calendrier
//?idUser=1&idZone=1&date_heure_debut=
app.put("/terminerCalendrierZone/:idUsine/:quart", (request, response) => {
  const reqQ = request.query
  const reqP = request.params
  pool.query("update quart_calendrier set termine = 1, idUser = " + reqQ.idUser + " where quart = " + reqP.quart + " AND idUsine = " + reqP.idUsine + " AND idZone = " + reqQ.idZone + " AND date_heure_debut = '" + reqQ.date_heure_debut + "'", (err, data) => {
    if (err) {
      //TODO à régler
      //currentLineError=currentLine(); throw err;
    }
    //if(err) console.log(err + " - "+reqP.idUsine);
    response.json("Update zone du calendrier ok");
  });
});

//update des actions effectués sur le quart et passe en terminer = 1
//?idUsine=1&quart=1
app.put("/terminerCalendrierAction/:idUsine/:quart", (request, response) => {
  const reqQ = request.query
  const reqP = request.params
  pool.query("update quart_calendrier set termine = 1, idUser = " + reqQ.idUser + " where quart = " + reqP.quart + " AND idUsine = " + reqP.idUsine + " AND idAction = " + reqQ.idAction + " AND date_heure_debut = '" + reqQ.date_heure_debut + "'", (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    response.json("Update action du calendrier ok");
  });
});

//Partie remontée des données dans le récap de quart PDF
//Récupérer la liste des zones à remonter dans el récap de quart PDF
//?idUsine=1&date=2025-23-02 13:00:00.000
app.get("/recupZonesPDF", (request, response) => {
  const reqQ = request.query;
  pool.query("SELECT DISTINCT z.* from quart_calendrier q INNER JOIN zonecontrole z ON q.idZone = z.Id WHERE z.nom LIKE '%PDF%' AND q.idUsine = " + reqQ.idUsine + " AND q.date_heure_debut = '" + reqQ.date + "' ORDER BY nom"
    , (err, data) => {
      if (err) {
        currentLineError = currentLine(); throw err;
      }
      data = data['recordset'];
      response.json({ data });
    });
});

//Récupération des éléments de contôle ainsi que leurs valeurs pour une date et un quart en fonction de la zoneId
//?idZone=656&date=30/01/02025&quart=1
app.get("/recupElementsPDF", (request, response) => {
  const reqQ = request.query;
  pool.query("SELECT z.nom as nomZone , e.nom, m.value FROM elementcontrole e INNER JOIN mesuresrondier m ON m.elementId = e.Id INNER JOIN ronde r ON r.Id = m.rondeId INNER JOIN zonecontrole z ON z.Id = e.zoneId where e.zoneId = " + reqQ.idZone + " and r.quart = " + reqQ.quart + " AND r.dateHeure = '" + reqQ.date + "'"
    , (err, data) => {
      if (err) {
        currentLineError = currentLine(); throw err;
      }
      data = data['recordset'];
      response.json({ data });
    });
});

//update du champ terminé d'une action du calendrier
//?id=1&termine=1
app.put("/changeTermineCalendrier", (request, response) => {
  const reqQ = request.query;
  let termine = 1;
  if (reqQ.termine === "false") {
    termine = 0;
  }
  pool.query("update quart_calendrier set termine = " + termine + " where id = " + reqQ.id, (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    response.json("Update action du calendrier OK");
  });
});


/////////////////////////
/// REPRISE DE RONDE ////
/////////////////////////
//update des actions effectués sur le quart et passe en terminer = 1
//?idUsine=1&quart=1
app.put("/createRepriseDeRonde", (request, response) => {
  const reqQ = request.query
  pool.query("INSERT INTO repriseRonde(date,quart,idUsine,termine) VALUES ('" + reqQ.date + "'," + reqQ.quart + "," + reqQ.idUsine + ",0)", (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    response.json("Update action du calendrier ok");
  });
});

//Controler s'il y a des zones sur la ronde du quart
app.get("/getReprisesRonde/:idUsine", (request, response) => {
  const reqP = request.params
  pool.query("SELECT CONVERT(varchar, date, 103) as 'date', termine, id, quart FROM repriseRonde WHERE termine = 0 and idUsine = " + reqP.idUsine
    , (err, data) => {
      if (err) {
        currentLineError = currentLine(); throw err;
      }
      data = data['recordset'];
      response.json({ data });
    });
});

//Controler s'il y a des zones sur la ronde du quart
app.get("/getOneRepriseRonde/:id", (request, response) => {
  const reqP = request.params
  pool.query("SELECT CONVERT(varchar, date, 103) as 'date', termine, id, quart FROM repriseRonde WHERE id = " + reqP.id
    , (err, data) => {
      if (err) {
        currentLineError = currentLine(); throw err;
      }
      data = data['recordset'];
      response.json({ data });
    });
});

//Supprimer les mesures des sortants entre deux dates pour une usine
//?idUsine=7&dateDeb=YYYY-mm-dd&dateFin=YYYY-mm-dd&name=???
app.delete("/deleteRepriseRonde", middleware, (request, response) => {
  const reqQ = request.query
  pool.query("delete from repriseRonde where id =" + reqQ.id, (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    response.json("Suppression de la reprise OK")
  });
});

//Mise à jour des informations - cloture d'une ronde anterieure
app.put("/updateTermineRondeAnterieur/:date/:quart/:idUsine", (request, response) => {
  const reqP = request.params
  pool.query("update repriseRonde set termine = 1 where date = '" + reqP.date + "' AND quart = " + reqP.quart + " AND idUsine = " + reqP.idUsine, (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    response.json("Update ronde anterieure ok");
  });
});

//Récupérer la liste des rondes à des dates anterieurs
app.get("/rondeAnterieur/:idUsine", (request, response) => {
  const reqP = request.params
  pool.query("SELECT * FROM repriseRonde WHERE termine = 0 AND idUsine = " + reqP.idUsine, (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    data = data['recordset'];
    response.json({ data });
  });
});

//Action enregistrement
//Récupérer la liste des rondes à des dates anterieurs
app.get("/getActionsEnregistrement/:idUsine", (request, response) => {
  const reqP = request.params
  pool.query("SELECT * FROM actions_enregistrement WHERE idUsine = " + reqP.idUsine + " ORDER BY nom", (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    data = data['recordset'];
    response.json({ data });
  });
});


//Mise à jour des informations - cloture d'une ronde anterieure
//?nom
app.put("/createActionEnregistrement/:idUsine", (request, response) => {
  const reqP = request.params
  const reqQ = request.query
  const nom = reqQ.nom.replace(/'/g, "''");
  pool.query("insert into actions_enregistrement(nom,idUsine) VALUES ('" + nom + "'," + reqP.idUsine + ")", (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    response.json("create action enregistrement ok");
  });
});

//Mise à jour des informations - cloture d'une ronde anterieure
//?nom=''
app.put("/updateActionEnregistrement/:idAction", (request, response) => {
  const reqP = request.params
  const reqQ = request.query
  const nom = reqQ.nom.replace(/'/g, "''");
  pool.query("update actions_enregistrement set nom ='" + nom + "' where id = " + reqP.idAction, (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    response.json("Update action enregistrement ok");
  });
});

//Supprimer les mesures des sortants entre deux dates pour une usine
app.delete("/deleteActionEnregistrement/:idAction", middleware, (request, response) => {
  const reqP = request.params
  pool.query("delete from actions_enregistrement where id =" + reqP.idAction, (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    response.json("Suppression de l'action enregistrée OK")
  });
});


///////////Depassements NEW //////////////

//?nom=e&id=1 facultatif
app.get("/choixDepassements", (request, response) => {
  let { nom, id } = request.query;
  const req = "SELECT * FROM choixDepassements order by nom";
  const conditions = [];

  if (id) {
    conditions.push("id = " + id);
  }
  if (nom) {
    nom = nom.replace(/'/g, "''");
    conditions.push("nom LIKE" + "%" + nom + "%");
  }
  if (conditions.length) {
    query += " WHERE " + conditions.join(" AND ")
  }
  pool.query(req, (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    data = data['recordset'];
    response.json(data);
  });
});


app.post("/choixDepassements", (request, response) => {
  let { nom } = request.query;
  nom = nom.replace(/'/g, "''").toUpperCase();
  const req = "INSERT INTO choixDepassements(nom) VALUES ('" + nom + "')";
  if (nom) {
    pool.query(req, (err, data) => {
      if (err) {
        response.status(509).json("Le nom du dépassement doit être unique !");
        currentLineError = currentLine(); throw err;
      }
      response.json("L'ajout à été effectué");
    });
  } else {
    response.json("Le nom est vide");
  }
});

app.delete("/choixDepassements/:id", (request, response) => {
  const { id } = request.params;
  const req = "DELETE FROM choixDepassements WHERE id = " + id;

  if (id) {
    pool.query(req, (err, data) => {
      if (err) {
        currentLineError = currentLine(); throw err;
      }
      response.json("La suppression a été effectuée");
    });
  } else {
    response.json("L'id est vide");
  }

});

app.get("/choixDepassementsProduits", (request, response) => {
  const { nom, id } = request.query;
  const req = "SELECT * FROM choixDepassementsProduits order by nom";
  const conditions = [];

  if (id) {
    conditions.push("id = " + id);
  }
  if (nom) {
    nom = nom.replace(/'/g, "''");
    conditions.push("nom LIKE = " + "%" + nom + "%");
  }
  if (conditions.length) {
    query += " WHERE " + conditions.join(" AND ")
  }
  pool.query(req, (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    data = data['recordset'];
    response.json(data);
  });
});

app.post("/choixDepassementsProduits", (request, response) => {
  let { nom } = request.query;
  nom = nom.replace(/'/g, "''").toUpperCase();
  const req = "INSERT INTO choixDepassementsProduits(nom) VALUES ('" + nom + "')";

  if (nom) {
    pool.query(req, (err, data) => {
      if (err) {
        response.status(509).json("Le nom du produit doit être unique !");
        currentLineError = currentLine(); throw err;
      }
      response.json("L'ajout à été effectué");
    });
  } else {
    response.json("Le nom est vide");
  }

});

app.delete("/choixDepassementsProduits/:id", (request, response) => {
  const { id } = request.params;
  const req = "DELETE FROM choixDepassementsProduits WHERE id = " + id;

  if (id) {
    pool.query(req, (err, data) => {
      if (err) {
        currentLineError = currentLine(); throw err;
      }
      response.json("La suppression a été effectuée");
    });
  } else {
    response.json("L'id est vide");
  }

});

app.get("/depassementsProduits", (request, response) => {
  const { id, idChoixDepassements, idChoixDepassementsProduits } = request.query;
  const req = "SELECT * FROM depassements_produits";

  if (id) {
    conditions.push("id = " + id);
  }
  if (idChoixDepassements) {
    conditions.push("idChoixDepassements = " + idChoixDepassements);
  }
  if (idChoixDepassementsProduits) {
    conditions.push("idChoixDepassementsProduits = " + idChoixDepassementsProduits);
  }
  pool.query(req, (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    data = data['recordset'];
    response.json(data);
  });
});

app.post("/depassementsProduits", (request, response) => {
  const { idChoixDepassements, idChoixDepassementsProduits } = request.query;
  const req = "INSERT INTO depassements_produits(idChoixDepassements, idChoixDepassementsProduits) VALUES (" + idChoixDepassements + "," + idChoixDepassementsProduits + ")";

  if (idChoixDepassements && idChoixDepassementsProduits) {
    pool.query(req, (err, data) => {
      if (err) {
        response.status(509).json("Les associations doivent être uniques ! Celle-ci existe déjà !")
        currentLineError = currentLine(); throw err;

      }
      response.json("L'ajout à été effectué");
    });
  } else {
    response.json("Les id sont vides");
  }

});

app.delete("/depassementsProduits/:id", (request, response) => {
  const { id } = request.params;
  const req = "DELETE FROM depassements_produits WHERE id = " + id;

  if (id) {
    pool.query(req, (err, data) => {
      if (err) {
        currentLineError = currentLine(); throw err;
      }
      data = data['recordset'];
      response.json("La suppression a été effectuée");
    });
  } else {
    response.json("L'id est vide");
  }

});


app.get("/depassementsNew", (request, response) => {
  const { id, choixDepassements, choixDepassementsProduits, ligne, date_heure_debut, date_heure_fin, causes, concentration, idUsine } = request.query;
  let req = "SELECT * FROM depassements_new";
  const conditions = [];

  if (choixDepassements) {
    choixDepassements = choixDepassements.replace(/'/g, "''");
    conditions.push("choixDepassements = " + choixDepassements);
  }
  if (choixDepassementsProduits) {
    choixDepassementsProduits = choixDepassementsProduits.replace(/'/g, "''");
    conditions.push("choixDepassementsProduits = '" + choixDepassementsProduits + "'");
  }
  if (ligne) {
    ligne = ligne.replace(/'/g, "''");
    conditions.push("ligne = '" + ligne + "'");
  }
  if (date_heure_debut) {
    conditions.push("date_heure_debut >= '" + date_heure_debut + "'");
  }
  if (date_heure_fin) {
    conditions.push("date_heure_fin <= '" + date_heure_fin + "'");
  }
  if (causes) {
    causes = causes.replace(/'/g, "''");
    conditions.push("cause = '" + causes + "'");
  }
  if (concentration) {
    concentration = concentration.replace(/'/g, "''");
    conditions.push("concentration = '" + concentration + "'");
  }
  if (id) {
    conditions.push("id = " + id);
  }
  if (idUsine) {
    conditions.push("idUsine = " + idUsine);
  }

  if (conditions.length) {
    req += " WHERE " + conditions.join(" AND ") + " order by ligne"
  }
  pool.query(req, (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    data = data['recordset'];
    response.json(data);
  });
});

app.post("/depassementsNew", (request, response) => {
  const depassement = request.body;
  depassement.choixDepassements = depassement.choixDepassements.replace(/'/g, "''");
  depassement.choixDepassementsProduits = depassement.choixDepassementsProduits.replace(/'/g, "''");
  depassement.date_heure_debut = depassement.date_heure_debut.replace('T', " ");
  depassement.date_heure_fin = depassement.date_heure_fin.replace('T', " ");
  depassement.ligne = depassement.ligne.replace(/'/g, "''");
  depassement.causes = depassement.causes.replace(/'/g, "''");
  depassement.concentration = depassement.concentration.replace(/'/g, "''");
  const req = "INSERT INTO depassements_new(choixDepassements, choixDepassementsProduits, ligne, date_heure_debut, date_heure_fin, causes, concentration, idUsine)"
    + "VALUES('" + depassement.choixDepassements + "','" + depassement.choixDepassementsProduits + "','" + depassement.ligne + "','" + depassement.date_heure_debut + "','" + depassement.date_heure_fin + "','" + depassement.causes + "','" + depassement.concentration + "'," + depassement.idUsine + ")";
  pool.query(req, (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    response.json("Le dépassement a bien été créé.");
  });

});

app.put("/depassementsNew", (request, response) => {
  const depassement = request.body;
  depassement.choixDepassements = depassement.choixDepassements.replace(/'/g, "''");
  depassement.choixDepassementsProduits = depassement.choixDepassementsProduits.replace(/'/g, "''");
  depassement.date_heure_debut = depassement.date_heure_debut.replace('T', " ");
  depassement.date_heure_fin = depassement.date_heure_fin.replace('T', " ");
  depassement.ligne = depassement.ligne.replace(/'/g, "''");
  depassement.causes = depassement.causes.replace(/'/g, "''");
  depassement.concentration = depassement.concentration.replace(/'/g, "''");

  const req = "UPDATE depassements_new SET choixDepassements = '" + depassement.choixDepassements + "', choixDepassementsProduits = '" + depassement.choixDepassementsProduits + "',"
    + "date_heure_debut = '" + depassement.date_heure_debut + "', date_heure_fin = '" + depassement.date_heure_fin + "',"
    + "ligne = '" + depassement.ligne + "', causes = '" + depassement.causes + "', concentration = '" + depassement.concentration + "', idUsine=" + depassement.idUsine + " where id = " + depassement.id
  if (depassement) {
    pool.query(req, (err, data) => {
      if (err) {
        currentLineError = currentLine(); throw err;
      }
      data = data['recordset'];
      response.json("Le dépassement a bien été modifié");
    });
  } else {
    response.json("Objet dépassement incorrect");
  }

});

app.delete("/depassementsNew/:id", (request, response) => {
  const { id } = request.params;
  const req = "DELETE FROM depassements_new WHERE id = " + id;
  if (id) {
    pool.query(req, (err, data) => {
      if (err) {
        currentLineError = currentLine(); throw err;
      }
      response.json("La suppression a bien été effectuée !");
    });
  } else {
    response.json("L'id est vide");
  }
});

///////////Validation Données//////////////
//Création Validation de données
//?idUser=1&date=???&idUsine=1&moisValidation=05&anneeValidation=2025
app.put("/validationDonnees", middleware, (request, response) => {
  const reqQ = request.query;
  pool.query("INSERT INTO validationDonnees(idUser,date,idUsine,moisValidation,anneeValidation) VALUES(" + reqQ.idUser + ",'" + reqQ.date + "'," + reqQ.idUsine + ",'"+reqQ.moisValidation+ "','"+reqQ.anneeValidation+"')"
    , (err, result) => {
      if (err) {
        currentLineError = currentLine(); throw err;
      }
      else response.json("Ajout OK !");
    });
});

//Récupérer si il y a eu une validation des données sur le mois dernier
app.get("/validationDonnees/:idUsine/:mois/:annee", middleware, (request, response) => {
  const reqP = request.params;
  pool.query("SELECT * FROM validationDonnees WHERE moisValidation = "+reqP.mois+" AND anneeValidation = "+reqP.annee+" AND idUsine = " + reqP.idUsine, (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    data = data['recordset'];
    response.json({ data });
  });
});

//Récupérer si l'usine doit afficher la popUp
app.get("/AffichageValidationDonnees/:idUsine", middleware, (request, response) => {
  const reqP = request.params
  pool.query("SELECT validationDonnees FROM site WHERE id = " + reqP.idUsine, (err, data) => {
    if (err) {
      currentLineError = currentLine(); throw err;
    }
    data = data['recordset'];
    response.json(data[0].validationDonnees);
  });
});
///////////FIN Validation Données//////////////
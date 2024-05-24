/**
****** SQL SERVER ******
*/

//Gestion des tokens

//Libraire de gestion des tokens
const jwt = require('jsonwebtoken');
const middleware = require('./token/middleware.js');

//Fonction pour générer un token
function generateAcessToken(id){
  return jwt.sign({id}, process.env.ACESS_TOKEN_SECRET)
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
var privateKey = fs.readFileSync('E:/INOVEX/serverV2-decrypted.key','utf8');
var certificate = fs.readFileSync('E:/INOVEX/serverV2.crt','utf8');
var credentials = {key: privateKey, cert: certificate};
//FIN partie pour utiliser l'API en https
// parse requests of content-type: application/json
app.use(bodyParser.json({limit: '100mb'}));
// parse requests of content-type: application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true, limit: '100mb'}));
//permet les requêtes cros domain
app.use(cors({origin: "*" }));

//utilisation des variables d'environnement
require('dotenv').config();

/**Documentation avec Swagger UI**/
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
/**Documentation avec Swagger UI**/

const dateFormat = require('date-and-time')

//Gestion des fichiers avec multer
const storage = multer.diskStorage({
  destination: (req, file, callback) => {
      callback(null, 'fichiers');
  },
  filename: (req, file, callback) => {
      const name = file.originalname.split(' ').join('_');
      //stockage du fichier d'image en mettant le nom en remplaçant les espaces par _
      callback(null, Date.now()+name);
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

const port = process.env.PORT;
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

var httpsServer = https.createServer(credentials,app);

var pool =  new sql.ConnectionPool(sqlConfig);

pool.connect();

var server = httpsServer.listen(port, function() {
//var server = app.listen(port, function() {
  var host = server.address().address;
  var port = server.address().port;

  console.log("API CAP EXPLOITATION SQL SERVER en route sur http://%s:%s",host,port);
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
  host: process.env.HOST_SMTP,
  port: process.env.PORT_SMTP,
  secure: false,
  ignoreTLS: true,
  auth: {
    user: process.env.USER_SMTP,
    pass: process.env.PWD_SMTP
  },
  tls: {
    secureProtocol: "TLSv1_method"
  },
  debug: true,
  logger: true
}));

// define a sendmail endpoint, which will send emails and response with the corresponding status
app.get('/sendmail/:dateDeb/:heureDeb/:duree/:typeArret/:commentaire/:idUsine', function(req, res) {
  let mailListIdUsine = 'MAIL_LIST_'+req.params.idUsine;
  var maillist = process.env[mailListIdUsine];
  
  //On récupére le nom du site pour l'inscrire dans l'email
  pool.query("SELECT localisation FROM site WHERE id = "+req.params.idUsine, (err,data) => {
    if(err) throw err;
    let localisation = data['recordset'][0].localisation;

    //Envoi du mail
    const message = {
      from: 'Noreply.Inovex@paprec.com', // Sender address
      to: maillist,
      subject: '['+localisation+'] Nouvel Arrêt Intempestif !!!', // Subject line
      html: '<h1>ATTENTION, un arrêt intempestif vient d\'être signalé pour le site de '+localisation+ ':</h1> '+
      '<h2>'+req.params.typeArret+' pour une durée de '+req.params.duree+ ' heure(s) à partir du '+req.params.dateDeb+' à '+req.params.heureDeb+'.</h2>'+ 
      '<h3>Voici le commentaire : '+req.params.commentaire+'</h3>'//Cors du mail en HTML
    };

    transporter.sendMail(message, function(err, info) {
      if (err) {
        console.log(err);
        //throw err;
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
app.get("/moralEntities", middleware,(request, response) => {
    const req=request.query
    pool.query("SELECT mr.Id, mr.CreateDate, mr.LastModifiedDate, mr.Name, mr.Address, mr.Enabled, mr.Code, mr.UnitPrice, p.Id as productId, LEFT(p.Name,CHARINDEX(' ',p.Name)) as produit, SUBSTRING(p.Name,CHARINDEX(' ',p.Name),500000) as collecteur FROM moralentities_new as mr "+ 
    "INNER JOIN products_new as p ON LEFT(p.Code,5) LIKE LEFT(mr.Code,5) AND p.idUsine = mr.idUsine "+
    "WHERE mr.idUsine = "+req.idUsine+" AND mr.Enabled = 1 AND p.Code = LEFT(mr.Code,LEN(p.Code)) AND mr.Code LIKE '" + req.Code + "%' ORDER BY Name ASC", (err,data) => {
      if(err) throw err;
      data = data['recordset'];
      response.json({data});
    });
});

//Supprimer les mesures des entrants entre deux dates pour une usine
//?idUsine=7&dateDeb=YYYY-mm-dd&dateFin=YYYY-mm-dd
app.delete("/deleteMesuresEntrantsEntreDeuxDates", middleware,(request, response) => {
  const req=request.query;
  let condDasri = "";
  //Si le site est NSL, on ne supprime pas les DASRIs lors de l'import
  if(req.idUsine == 1){
    condDasri = " AND mr.Code NOT LIKE '203%'";
  }
  pool.query("delete m from moralentities_new  mr join measures_new m on m.ProducerId = mr.id where idUsine = " + req.idUsine +" and m.EntryDate >= '" + req.dateDeb +"' and m.EntryDate <= '"+ req.dateFin + "'"+condDasri
  , (err,data) => {
    if(err) throw err;
    response.json("Suppression des mesures OK")
  });
});

//Supprimer les mesures des sortants entre deux dates pour une usine
//?idUsine=7&dateDeb=YYYY-mm-dd&dateFin=YYYY-mm-dd&name=???
app.delete("/deleteMesuresSortantsEntreDeuxDates", middleware,(request, response) => {
  const req=request.query
  const name = req.name.replace(/'/g, "''");
  pool.query("delete m from measures_new m join products_new p on p.Id=m.ProductId join import_tonnageSortants i on i.ProductId = p.id where Enabled = 1 AND p.idUsine = " + req.idUsine +" and m.EntryDate >= '" + req.dateDeb +"' and m.EntryDate <= '"+ req.dateFin + "' and i.productImport = '"+ name +"'", (err,data) => {
    if(err) throw err;
    response.json("Suppression des mesures OK")
  });
});

//Supprimer les mesures des sortants entre deux dates pour une usine
//?idUsine=7&dateDeb=YYYY-mm-dd&dateFin=YYYY-mm-dd&name=???
app.delete("/deleteMesuresReactifsEntreDeuxDates", middleware,(request, response) => {
  const req=request.query
  const name = req.name.replace(/'/g, "''");
  pool.query("delete m from measures_new m join products_new p on p.Id=m.ProductId join import_tonnageReactifs i on i.ProductId = p.id where Enabled = 1 AND p.idUsine = " + req.idUsine +" and m.EntryDate >= '" + req.dateDeb +"' and m.EntryDate <= '"+ req.dateFin + "' and i.productImport = '"+ name +"'", (err,data) => {
    if(err) throw err;
    response.json("Suppression des mesures OK")
  });
});

//get all MoralEntities
//?Code=34343&idUsine=1
app.get("/moralEntitiesAll", middleware,(request, response) => {
  const req=request.query
  pool.query("SELECT mr.Id, mr.CreateDate, mr.LastModifiedDate, mr.Name, mr.Address, mr.Enabled, mr.Code, mr.UnitPrice, p.Id as productId, mr.numCAP, mr.codeDechet, mr.nomClient, mr.prenomClient, mr.mailClient, LEFT(p.Name,CHARINDEX(' ',p.Name)) as produit, SUBSTRING(p.Name,CHARINDEX(' ',p.Name),500000) as collecteur FROM moralentities_new as mr "+ 
  "INNER JOIN products_new as p ON LEFT(p.Code,5) LIKE LEFT(mr.Code,5) AND p.idUsine = mr.idUsine "+
  "WHERE mr.idUsine = "+req.idUsine+" AND p.Code = LEFT(mr.Code,LEN(p.Code)) AND mr.Code LIKE '" + req.Code + "%' ORDER BY Name ASC", (err,data) => {
    if(err) throw err;
    data = data['recordset'];
      response.json({data});
  });
});

//create MoralEntitie
//?Name=c&Address=d&Code=f&UnitPrice=g&numCAP=sh&codeDechet=dg&nomClient=dg&prenomClient=fg&mailClient=dh&idUsine=1
//ATTENION Unit Price doit contenir un . pour les décimales
app.put("/moralEntitie", middleware,(request, response) => {
    const req=request.query
    const query="INSERT INTO moralentities_new (CreateDate, LastModifiedDate, Name, Address, Enabled, Code, UnitPrice, numCAP, codeDechet, nomClient, prenomClient, mailClient, idUsine) VALUES (convert(varchar, getdate(), 120), convert(varchar, getdate(), 120), '"+req.Name+"', '"+req.Address+"', 1, '"+req.Code+"', "+req.UnitPrice+", '"+req.numCAP+"', '"+req.codeDechet+"', '"+req.nomClient+"', '"+req.prenomClient+"','"+req.mailClient+"', "+req.idUsine+")";
    pool.query(query,(err,result,fields) => {
        if(err) throw err;
        response.json("Création du client OK");
    });
});

//get Last Code INOVEX
//?Code=29292&idUsine=1
app.get("/moralEntitieLastCode", middleware,(request, response) => {
  const req=request.query
  pool.query("SELECT TOP 1 Code FROM moralentities_new WHERE CODE LIKE '" + req.Code + "%' AND idUsine = "+req.idUsine+" ORDER BY Code DESC", (err,data) => {
    if(err) throw err;
    data = data['recordset'];
      response.json({data});
  });
});

//get One MoralEntitie
app.get("/moralEntitie/:id",middleware, (request, response) => {
    const req=request.query
    pool.query("SELECT * FROM moralentities_new WHERE Id = "+request.params.id, (err,data) => {
      if(err) throw err;
      data = data['recordset'];
      response.json({data});
    });
});

//UPDATE MoralEntitie, set UnitPrice & Code
//?UnitPrice=2.3&Code=1234
//ATTENION Unit Price doit contenir un . pour les décimales
app.put("/moralEntitie/:id", middleware,(request, response) => {
  const req=request.query
  pool.query("UPDATE moralentities_new SET UnitPrice = " + req.UnitPrice + ", Code = " + req.Code + " WHERE Id = "+request.params.id, (err,data) => {
    if(err) throw err;
    response.json("Mise à jour du prix unitaire et code INOVEX OK")
  });
});

//UPDATE MoralEntitie, set UnitPrice
//?UnitPrice=2.3
//ATTENION Unit Price doit contenir un . pour les décimales
app.put("/moralEntitieUnitPrice/:id", middleware,(request, response) => {
  const req=request.query
  pool.query("UPDATE moralentities_new SET UnitPrice = " + req.UnitPrice + ", LastModifiedDate = convert(varchar, getdate(), 120) WHERE Id = "+request.params.id, (err,data) => {
    if(err) throw err;
    response.json("Mise à jour du prix unitaire OK")
  });
});

//UPDATE MoralEntitie, changeALL
//?Name=d&Address=d&Code=12&UnitPrice=1&numCAP=123&codeDechet=34343&nomClient=dhddg&prenomClient=dhdhdh&mailClient=dhggdgd
//ATTENION Unit Price doit contenir un . pour les décimales
app.put("/moralEntitieAll/:id", middleware,(request, response) => {
  const req=request.query
  pool.query("UPDATE moralentities_new SET mailClient = '" + req.mailClient + "', prenomClient = '" + req.prenomClient + "', nomClient = '" + req.nomClient + "', codeDechet = '" + req.codeDechet + "', numCAP = '" + req.numCAP + "', Code = '" + req.Code + "', Address = '" + req.Address + "', Name = '" + req.Name + "', UnitPrice = '" + req.UnitPrice + "', LastModifiedDate = convert(varchar, getdate(), 120) WHERE Id = "+request.params.id, (err,data) => {
    if(err) throw err;
    response.json("Mise à jour du MR OK")
  });
});

//UPDATE MoralEntitie, set CAP
//?cap=123
app.put("/moralEntitieCAP/:id", middleware,(request, response) => {
  const req=request.query
  pool.query("UPDATE moralentities_new SET numCAP = '" + req.cap + "', LastModifiedDate = convert(varchar, getdate(), 120) WHERE Id = "+request.params.id, (err,data) => {
    if(err) throw err;
    response.json("Mise à jour du CAP OK")
  });
});

//UPDATE MoralEntitie, set Code
//?Code=123
app.put("/moralEntitieCode/:id", middleware,(request, response) => {
  const req=request.query
  pool.query("UPDATE moralentities_new SET Code = " + req.Code + ", LastModifiedDate = convert(varchar, getdate(), 120) WHERE Id = "+request.params.id, (err,data) => {
    if(err) throw err;
    response.json("Mise à jour du code OK")
  });
});

//UPDATE MoralEntitie, set Enabled
app.put("/moralEntitieEnabled/:id/:enabled", middleware,(request, response) => {
  const req=request.query
  pool.query("UPDATE moralentities_new SET Enabled = "+request.params.enabled+", LastModifiedDate = convert(varchar, getdate(), 120) WHERE Id = "+request.params.id, (err,data) => {
    if(err) throw err;
    response.json("Changement de visibilité du client OK")
  });
});

//UPDATE MoralEntitie, set Name
//?Name=tetet
app.put("/moralEntitieName/:id", middleware,(request, response) => {
  const req=request.query
  pool.query("UPDATE moralentities_new SET Name = '"+req.Name+"', LastModifiedDate = convert(varchar, getdate(), 120) WHERE Id = "+request.params.id, (err,data) => {
    if(err) throw err;
    response.json("Changement de nom du client OK")
  });
});

//DELETE MoralEntitie
app.delete("/moralEntitie/:id", middleware,(request, response) => {
  const req=request.query
  pool.query("DELETE FROM moralentities_new WHERE Id = "+request.params.id, (err,data) => {
    if(err) throw err;
    response.json("Suppression du client OK")
  });
});

/*CATEGORIES*/
//get ALL Categories for compteurs
app.get("/CategoriesCompteurs", middleware, (request, response) => {
    const req=request.query
    pool.query("SELECT cat.Id, cat.CreateDate, cat.LastModifieddate, cat.Name, cat.Enabled, cat.Code, cat.ParentId, cat2.Name as ParentName "+
    "FROM categories_new as cat LEFT JOIN categories_new as cat2 ON cat.ParentId = cat2.Id "+
    "WHERE cat.Enabled = 1 AND cat.Code > 1 AND LEN(cat.Code) > 1  AND cat.Name NOT LIKE 'Tonnage%' AND cat.Name NOT LIKE 'Cendres%' AND cat.Code NOT LIKE '701%' AND cat.Name NOT LIKE 'Mâchefers%' AND cat.Name NOT LIKE 'Arrêts%' AND cat.Name NOT LIKE 'Autres consommables%' AND cat.Name NOT LIKE 'Déchets détournés%' AND cat.Name NOT LIKE 'Ferraille et autres%' AND cat.Name NOT LIKE 'Analyses%' ORDER BY cat.Name ASC", (err,data) => {
      if(err) throw err;
      data = data['recordset'];
      response.json({data});
    });
});

//get ALL Categories for analyses
app.get("/CategoriesAnalyses", middleware,(request, response) => {
  const req=request.query
  pool.query("SELECT cat.Id, cat.CreateDate, cat.LastModifieddate, cat.Name, cat.Enabled, cat.Code, cat.ParentId, cat2.Name as ParentName "+
  "FROM categories_new as cat LEFT JOIN categories_new as cat2 ON cat.ParentId = cat2.Id "+
  "WHERE cat.Enabled = 1 AND cat.Code > 1 AND LEN(cat.Code) > 1  AND cat.Name LIKE 'Analyses%' ORDER BY cat.Name ASC", (err,data) => {
    if(err) throw err;
    data = data['recordset'];
      response.json({data});
  });
});

//get ALL Categories for sortants
app.get("/CategoriesSortants",middleware, (request, response) => {
  const req=request.query
  pool.query("SELECT cat.Id, cat.CreateDate, cat.LastModifieddate, cat.Name, cat.Enabled, cat.Code, cat.ParentId, cat2.Name as ParentName "+
  "FROM categories_new as cat LEFT JOIN categories_new as cat2 ON cat.ParentId = cat2.Id "+
  "WHERE cat.Code LIKE '50%' AND cat.Name NOT LIKE 'Résidus de Traitement' ORDER BY cat.Name ASC", (err,data) => {
    if(err) throw err;
    data = data['recordset'];
      response.json({data});
  });
});

//create Categorie
//?Name=c&Code=f&ParentId=g
app.put("/Category",middleware, (request, response) => {
  const req=request.query
  const query="INSERT INTO categories_new (CreateDate, LastModifiedDate, Name, Enabled, Code, ParentId) VALUES (convert(varchar, getdate(), 120), convert(varchar, getdate(), 120), '"+req.Name+"', 1, '"+req.Code+"', "+req.ParentId+")";
  pool.query(query,(err,result,fields) => {
      if(err) throw err;
      response.json("Création de la catégorie OK");
  });
});

//get ONE Categorie
app.get("/Category/:Id",middleware, (request, response) => {
    const req=request.query
    pool.query("SELECT * FROM categories_new WHERE Id = "+ request.params.Id, (err,data) => {
      if(err) throw err;
      data = data['recordset'];
      response.json({data});
    
    });
});

//Get Catégories filles d'une catégorie mère
app.get("/Categories/:ParentId",middleware, (request, response) => {
    const req=request.query
    pool.query("SELECT * FROM categories_new WHERE ParentId = "+ request.params.ParentId, (err,data) => {
      if(err) throw err;
      data = data['recordset'];
      response.json({data});
    
    });
});

//get Last Code INOVEX 
//?Code=29292&idUsine=1 
app.get("/productLastCode", middleware,(request, response) => {
  const req=request.query
  pool.query("SELECT TOP 1 Code FROM products_new WHERE idUsine = " + req.idUsine + " AND CODE LIKE '" + req.Code + "%' ORDER BY Code DESC", (err,data) => {
    if(err) throw err;
    data = data['recordset'];
      response.json({data});
  });
});

/*PRODUCTS*/
//get ALL Products
app.get("/Products", middleware,(request, response) => {
    const req=request.query
    pool.query("SELECT * FROM products_new", (err,data) => {
      if(err) throw err;
      data = data['recordset'];
      response.json({data});;
    });
});

//get ALL Products with type param
//?Name=dgdgd&idUsine=1
app.get("/Products/:TypeId", middleware,(request, response) => {
  const req=request.query
  pool.query("SELECT * FROM products_new WHERE idUsine = "+req.idUsine+" AND typeId = "+request.params.TypeId +" AND Name LIKE '%"+req.Name+"%' ORDER BY Name ASC", (err,data) => {
    if(err) throw err;
    data = data['recordset'];
      response.json({data});
  
  });
});

//Créer un formulaire
//?nom=zlfhe&idUsine=1
app.put("/createFormulaire",middleware, (request, response) => {
  const req=request.query
  pool.query("INSERT INTO formulaire(nom,idUsine) OUTPUT INSERTED.idFormulaire VALUES('" + req.nom + "',"+req.idUsine+")", (err,data) => {
    if(err) throw err;
    data = data['recordset'];
    response.json({data});  });
});

//Modifier un formulaire
//?nom=zlfhe&idFormulaire=1
app.put("/updateFormulaire",middleware, (request, response) => {
  const req=request.query
  pool.query("UPDATE formulaire SET nom ='" + req.nom + "' WHERE idFormulaire ="+req.idFormulaire, (err,data) => {
    if(err) throw err;
    data = data['recordset'];
    response.json({data});  });
});

//Supprimer les produits d'un formulaire
//?idFormulaire=????
app.delete("/deleteProduitFormulaire", middleware,(request, response) => {
  const req=request.query
  pool.query("DELETE FROM formulaire_affectation WHERE idFormulaire = "+req.idFormulaire , (err,data) => {
    if(err) throw err;
    response.json("Suppression du produit OK");
  });
});

//Supprimer un formulaire
//?idFormulaire=????
app.delete("/deleteFormulaire", middleware,(request, response) => {
  const req=request.query
  pool.query("DELETE FROM formulaire WHERE idFormulaire = "+req.idFormulaire, (err,data) => {
    if(err) throw err;
    response.json("Suppression du produit OK");
  });
});

//Créer un formulaire affectation
//?alias=zlfhe&idFormiualire=1&idProduit=1234
app.put("/createFormulaireAffectation",middleware, (request, response) => {
  const req=request.query
  pool.query("INSERT INTO formulaire_affectation(idFormulaire,idProduct,alias) VALUES(" + req.idFormulaire + ","+ req.idProduit + ",'"+req.alias+"')", (err,data) => {
    if(err) throw err;
    response.json("Affectation OK");
  });
});

//get formulaires d'une usine
//?idUsine=1
app.get("/getFormulaires", middleware,(request, response) => {
  const req=request.query
  pool.query("SELECT * FROM formulaire WHERE idUsine = "+req.idUsine, (err,data) => {
    if(err) throw err;
    data = data['recordset'];
    // console.log(data)
    response.json({data});
  });
});

//get un formulaire d'une usine
//?idFormulaire=1
app.get("/getOneFormulaire", middleware,(request, response) => {
  const req=request.query
  pool.query("SELECT * FROM formulaire WHERE idFormulaire = "+req.idFormulaire, (err,data) => {
    if(err) throw err;
    data = data['recordset'];
    response.json({data});
  });
});

//get les produits d'un formulaire
//?idFormulaire=1
app.get("/getProduitsFormulaire", middleware,(request, response) => {
  const req=request.query
  pool.query("SELECT * FROM formulaire_affectation WHERE idFormulaire = "+req.idFormulaire + 'order by alias', (err,data) => {
    if(err) throw err;
    data = data['recordset'];
    // console.log(data)
    response.json({data});
  });
});

//get one Products 
//?idUsine=1
app.get("/getOneProduct/:id", middleware,(request, response) => {
  const req=request.query
  pool.query("SELECT id,Name FROM products_new WHERE idUsine = "+req.idUsine+" AND id = "+request.params.id, (err,data) => {
    if(err) throw err;
    data = data['recordset'];
    // console.log(data)
      response.json({data});
  });
});

//get ALL Products 
//?idUsine=1
app.get("/AllProducts", middleware,(request, response) => {
  const req=request.query
  pool.query("SELECT * FROM products_new WHERE idUsine = "+req.idUsine+" and Enabled = 1 and CODE not LIKE '2%' and name NOT LIKE '%arret%' and name NOT LIKE '%depassement%' and name not like 'baisse de charge%' ORDER BY Name ASC", (err,data) => {
    if(err) throw err;
    data = data['recordset'];
      response.json({data});
  });
});


//get ALL Products with type param
//?Name=dgdgd&idUsine=1
app.get("/ProductsAndElementRondier/:TypeId", middleware,(request, response) => {
  const req=request.query
  let type;
  //pour tout récupérer sans prendre en compte le type
  if (request.params.TypeId == '_'){
    type = "typeId > 0 AND ";
  }
  else type = "typeId = "+request.params.TypeId+" AND ";
  pool.query("SELECT p.*, e.nom as nomElementRondier FROM products_new p FULL OUTER JOIN elementcontrole e ON e.Id = p.idElementRondier WHERE idUsine = "+req.idUsine+" AND "+type+"Name LIKE '%"+req.Name+"%' ORDER BY Name ASC", (err,data) => {
    if(err) throw err;
    data = data['recordset'];
      response.json({data});
  });
});

//get product avec un tag pour une usine
//?idUsine=?
app.get("/getProductsWithTag", middleware,(request, response) => {
  const req=request.query
  pool.query("SELECT *  FROM products_new WHERE TAG IS NOT NULL AND LEN(TAG) > 0 and idUsine = " + req.idUsine, (err,data) => {
    if(err) throw err;
    data = data['recordset'];
    response.json({data});;
  });
});

//get products avec un élément rondier (pour récupération auto des valeurs rondier)
//?idUsine=?
app.get("/getProductsWithElementRondier", middleware,(request, response) => {
  const req=request.query
  pool.query("select * from products_new WHERE idElementRondier IS NOT NULL AND idUsine = " + req.idUsine, (err,data) => {
    if(err) throw err;
    data = data['recordset'];
    response.json({data});;
  });
});

//get Container DASRI
app.get("/productsEntrants/:idUsine", middleware,(request, response) => {
  const req=request.query
  pool.query("SELECT * from products_new WHERE idUsine = " + request.params.idUsine + " AND typeId = 1 AND Code NOT LIKE '2%'", (err,data) => {
    if(err) throw err;
    data = data['recordset'];
      response.json({data});
  });
});
 
//UPDATE Product, change name
app.put("/updateProductName", middleware,(request, response) => {
  const req=request.query
  pool.query("UPDATE products_new SET Name = '"+req.newName +"' WHERE Name = '" +req.lastName +"'", (err,data) => {
    if(err) throw err;
    response.json("Changement du nom du produit OK")
  });
});

//UPDATE Product, change Enabled
app.put("/productEnabled/:id/:enabled", middleware,(request, response) => {
  const req=request.query
  pool.query("UPDATE products_new SET Enabled = "+request.params.enabled +" , LastModifiedDate = convert(varchar, getdate(), 120) WHERE Id = "+request.params.id, (err,data) => {
    if(err) throw err;
    response.json("Changement de visibilité du client OK")
  });
});

//UPDATE Product, change TypeId
app.put("/productType/:id/:type",middleware, (request, response) => {
  const req=request.query
  pool.query("UPDATE products_new SET TypeId = "+request.params.type +" , LastModifiedDate = convert(varchar, getdate(), 120) WHERE Id = "+request.params.id, (err,data) => {
    if(err) throw err;
    response.json("Changement de catégorie du produit OK")
  });
});

//UPDATE Product, set Unit
//?Unit=123
app.put("/productUnit/:id",middleware, (request, response) => {
  const req=request.query
  pool.query("UPDATE products_new SET Unit = '" + req.Unit + "', LastModifiedDate = convert(varchar, getdate(), 120) WHERE Id = "+request.params.id, (err,data) => {
    if(err) throw err;
    response.json("Mise à jour de l'unité OK")
  });
});

//Update le type de récup emonitoring
//?id=1&typeRecup=tifMax
app.put("/updateRecupEMonitoring",middleware, (request, response) => {
  const req=request.query
  var update = "UPDATE products_new SET typeRecupEMonitoring = '" + req.typeRecup + "' WHERE Id = "+req.id;
  if(req.typeRecup == "null") update = "UPDATE products_new SET typeRecupEMonitoring = NULL WHERE Id = "+req.id;
  pool.query(update, (err,data) => {
    if(err) throw err;
    response.json("Changement du type de récupération OK")
  });
});

//get ALL Compteurs
//?Code=ddhdhhd&idUsine=1&name=fff
app.get("/Compteurs",middleware, (request, response) => {
  const req=request.query
  pool.query("SELECT * FROM products_new WHERE idUsine = "+req.idUsine+" AND typeId = 4 AND Enabled = 1 AND Name NOT LIKE 'Arrêt%' AND Name NOT LIKE 'HEURES D''ARRET%' AND Name NOT LIKE 'BAISSE DE CHARGE%' AND Code NOT LIKE '701%' AND Name NOT LIKE 'Temps%' AND NAME LIKE '%" + req.name + "%' AND Code LIKE '" + req.Code + "%' ORDER BY Name", (err,data) => {
    if(err) throw err;
    data = data['recordset'];
      response.json({data});
  });
});

//get ALL QSE
//&idUsine=1
app.get("/QSE",middleware, (request, response) => {
  const req=request.query
  pool.query("SELECT * FROM products_new WHERE idUsine = "+req.idUsine+" AND Code LIKE '701%' ORDER BY Name", (err,data) => {
    if(err) throw err;
    data = data['recordset'];
      response.json({data});
  
  });
}); 

//get ALL Compteurs for arrêts
//?Code=ddhdhhd&idUsine=1
app.get("/CompteursArrets",middleware, (request, response) => {
  const req=request.query
  pool.query("SELECT * FROM products_new WHERE idUsine = "+req.idUsine+" AND typeId = 4 AND Name NOT LIKE 'Temps%' AND Enabled = 1 AND Code LIKE '" + req.Code + "%' ORDER BY Name", (err,data) => {
    if(err) throw err;
    data = data['recordset'];
      response.json({data});
  });
});

//get ALL Analyses
//?Code=ddhdhhd&idUsine=1 
app.get("/Analyses", middleware,(request, response) => {
  const req=request.query
  pool.query("SELECT * FROM products_new WHERE idUsine = "+req.idUsine+" AND typeId = 6 AND Enabled = 1 AND Code LIKE '" + req.Code + "%' AND Name NOT LIKE '%1/2%' AND Name NOT LIKE '%DEPASSEMENT%' ORDER BY Name", (err,data) => {
    if(err) throw err;
    data = data['recordset'];
      response.json({data});
  
  });
});

//get Analyses/ Dépassements 1/2 heures
app.get("/AnalysesDep/:idUsine", middleware, (request, response) => {
  const req=request.query
  pool.query("SELECT * FROM products_new WHERE idUsine = "+request.params.idUsine+" AND typeId = 6 AND Enabled = 1 AND Code LIKE '60104%' ORDER BY Name", (err,data) => {
    if(err) throw err;
    data = data['recordset'];
      response.json({data});
  
  });
});

//get ALL Sortants
//?Code=ddhdhhd&idUsine=1
app.get("/Sortants", middleware,(request, response) => {
  const req=request.query
  pool.query("SELECT * FROM products_new WHERE idUsine = "+req.idUsine+" AND typeId = 5 AND Enabled = 1 AND Code LIKE '" + req.Code + "%' ORDER BY Name", (err,data) => {
    if(err) throw err;
    data = data['recordset'];
      response.json({data});
  
  });
});

//get ALL reactifs livraison
//?idUsine=1
app.get("/reactifs", middleware,(request, response) => {
  const req=request.query
  pool.query("SELECT * FROM products_new WHERE idUsine = "+req.idUsine+" and Name LIKE '%LIVRAISON%' and Enabled = 1 order by Name", (err,data) => {
    if(err) throw err;
    data = data['recordset'];
      response.json({data});
  
  });
});

//get ALL conso & others
app.get("/Consos/:idUsine", middleware,(request, response) => {
  const req=request.query
  pool.query("SELECT * FROM products_new WHERE idUsine = "+request.params.idUsine+" AND typeId = 2 AND Enabled = 1 AND Code NOT LIKE '801%' ORDER BY Name", (err,data) => {
    if(err) throw err;
    data = data['recordset'];
      response.json({data});
  
  });
});

//get ALL pci
app.get("/pci/:idUsine", middleware,(request, response) => {
  const req=request.query
  pool.query("SELECT * FROM products_new WHERE idUsine = "+request.params.idUsine+" AND typeId = 2 AND Enabled = 1 AND Code LIKE '801%' ORDER BY Name", (err,data) => {
    if(err) throw err;
    data = data['recordset'];
      response.json({data});
  });
});

//create Product
//?Name=c&Code=f&typeId=g&Unit=j&idUsine=1&TAG=sdhdhdh
app.put("/Product", middleware,(request, response) => {
  const req=request.query;
  req.Name = req.Name.replace("'"," ");
  const query="INSERT INTO products_new (CreateDate, LastModifiedDate, Name, Enabled, Code, typeId, Unit, idUsine, TAG) VALUES (convert(varchar, getdate(), 120), convert(varchar, getdate(), 120), '"+req.Name+"', 0, '"+req.Code+"', "+req.typeId+", '"+req.Unit+"', "+req.idUsine+", '"+req.TAG+"')";
  pool.query(query,(err,result,fields) => {
      if(err) throw err;
      response.json("Création du produit OK");
  });
});

//get ONE Product
app.get("/Product/:Id",middleware, (request, response) => {
    const req=request.query
    pool.query("SELECT * FROM products_new WHERE Id = " + request.params.Id, (err,data) => {
      if(err) throw err;
      data = data['recordset'];
      response.json({data});
    });
});

/*
******* FILTRES DECHETS / COLLECTEURS
*/

//Get déchets & collecteurs pour la gestion des filtres entrants en fonction de l'idUsine
app.get("/DechetsCollecteurs/:idUsine",middleware, (request, response) => {
  const req=request.query
  pool.query("SELECT Name, Code FROM products_new WHERE Code Like '2%' AND idUsine = " +request.params.idUsine+ " ORDER BY Code ASC", (err,data) => {
    if(err) throw err;
    data = data['recordset'];
    response.json({data}) 
  });
});


/*
******* FIN FILTRES DECHETS / COLLECTEURS
*/


/*MEASURES*/
//create Measure
//?EntryDate=1&Value=1&ProductId=1&ProducerId=1
//ATTENION Value doit contenir un . pour les décimales
app.put("/Measure", middleware,(request, response) => {
  const req=request.query;
  queryOnDuplicate = "IF NOT EXISTS (SELECT * FROM measures_new WHERE EntryDate = '"+req.EntryDate+"' AND ProducerId = "+req.ProducerId+" AND ProductId = "+req.ProductId+")"+
    " BEGIN "+
      "INSERT INTO measures_new (CreateDate, LastModifiedDate, EntryDate, Value, ProductId, ProducerId)"+
      " VALUES (convert(varchar, getdate(), 120), convert(varchar, getdate(), 120),'"+req.EntryDate+"', "+req.Value+", "+req.ProductId+", "+req.ProducerId+") "+
    "END"+
    " ELSE"+
    " BEGIN "+
    "UPDATE measures_new SET Value = "+req.Value+", LastModifiedDate = convert(varchar, getdate(), 120) WHERE EntryDate = '"+req.EntryDate+"' AND ProducerId = "+req.ProducerId+" AND ProductId ="+req.ProductId+
    " END;"
    pool.query(queryOnDuplicate,(err,result,fields) => {
      if(err) console.log(err);
      response.json("Création du Measures OK");
  });
});

//get Entry
app.get("/Entrant/:ProductId/:ProducerId/:Date", middleware,(request, response) => {
  const req=request.query
  pool.query("SELECT Value FROM measures_new WHERE ProductId = " + request.params.ProductId + " AND ProducerId = " + request.params.ProducerId + " AND EntryDate LIKE '"+request.params.Date+"%'", (err,data) => {
    if(err) throw err;
    data = data['recordset'];
      response.json({data});
  });
});

//get value products
app.get("/ValuesProducts/:ProductId/:Date", middleware,(request, response) => {
  const req=request.query
  pool.query("SELECT Value FROM measures_new WHERE ProductId = " + request.params.ProductId + " AND EntryDate LIKE '"+request.params.Date+"%'", (err,data) => {
    if(err) throw err;
    data = data['recordset'];
      response.json({data});
  });
});

//get Total by day and Type
app.get("/TotalMeasures/:Dechet/:Date/:idUsine", middleware,(request, response) => {
  const req=request.query
  pool.query("SELECT COALESCE(SUM(m.Value),0) as Total FROM measures_new m INNER JOIN products_new p ON m.ProductId = p.Id WHERE p.idUsine = "+request.params.idUsine+ " AND m.EntryDate LIKE '"+request.params.Date+"%' AND m.ProducerId > 1 AND p.Code LIKE '"+request.params.Dechet+"%'", (err,data) => {
    if(err) throw err;
    data = data['recordset'];
      response.json({data});
  });
});



/* SAISIE MENSUELLE */
//get value compteurs
//?idUsine=1
app.get("/Compteurs/:Code/:Date", middleware,(request, response) => {
  const req=request.query
  pool.query("SELECT Value FROM saisiemensuelle WHERE idUsine = "+req.idUsine+" AND Code = '" + request.params.Code + "' AND Date LIKE '"+request.params.Date+"%'", (err,data) => {
    if(err) throw err;
    data = data['recordset'];
      response.json({data});
  });
});

//create saisie compteurs
//?Date=1&Value=1&Code=aaa&idUsine=1
//ATTENION Value doit contenir un . pour les décimales
app.put("/SaisieMensuelle", middleware,(request, response) => {
  const req=request.query
  queryOnDuplicate = "IF NOT EXISTS (SELECT * FROM saisiemensuelle WHERE Date = '"+req.Date+"' AND Code = "+req.Code+" AND idUsine = "+req.idUsine+")"+
    " BEGIN "+
      "INSERT INTO saisiemensuelle (Date, Code, Value, idUsine) VALUES ('"+req.Date+"', "+req.Code+", "+req.Value+", "+req.idUsine+") "+
    "END"+
    " ELSE"+
    " BEGIN "+
    "UPDATE saisiemensuelle SET Value = "+req.Value+" WHERE Date = '"+req.Date+"' AND Code = "+req.Code+" AND idUsine = "+req.idUsine+
    " END;"
  pool.query(queryOnDuplicate,(err,result,fields) => {
      if(err) console.log(err);
      response.json("Création du saisiemensuelle OK");
  });
});


/*DEPASSEMENT*/
//?dateDebut=dd&dateFin=dd&duree=zz&user=0&dateSaisie=zz&description=erre&productId=2
app.put("/Depassement", middleware,(request, response) => {
  const req=request.query
  pool.query("INSERT INTO depassements (date_heure_debut, date_heure_fin, duree, [user], date_saisie, description, productId) VALUES ('"+req.dateDebut+"', '"+req.dateFin+"', "+req.duree+", "+req.user+", '"+req.dateSaisie+"', '"+req.description+"', "+req.productId+") "
  ,(err,result,fields) => {
      if(err) response.json("Création du DEP KO");
      else response.json("Création du DEP OK");
  });
});

//Modifier un dépassement
//?dateDebut=dd&dateFin=dd&duree=zz&user=0&dateSaisie=zz&description=erre&productId=2
app.put("/updateDepassement/:id", middleware,(request, response) => {
  const req=request.query
  pool.query("update depassements set date_heure_debut = '"+ req.dateDebut +"', date_heure_fin = '"+req.dateFin+"', duree ="+req.duree+", date_saisie='"+req.dateSaisie+"', description='"+req.description+"', productId="+req.productId+" WHERE id = " + request.params.id 
  ,(err,result,fields) => {
      if(err) throw err;
      else response.json("Modif du dep ok");
  });
});

//Récupérer l'historique des dépassements pour un mois
app.get("/Depassements/:dateDeb/:dateFin/:idUsine",middleware, (request, response) => {
  const req=request.query;
  pool.query("SELECT a.Id, p.Name, convert(varchar, CAST(a.date_heure_debut as datetime2), 103) as dateDebut, convert(varchar, CAST(a.date_heure_debut as datetime2), 108) as heureDebut, convert(varchar, CAST(a.date_heure_fin as datetime2), 103) as dateFin, convert(varchar, CAST(a.date_heure_fin as datetime2), 108) as heureFin, a.duree, a.description FROM depassements a INNER JOIN products_new p ON p.Id = a.productId WHERE p.idUsine = "+request.params.idUsine+" AND CAST(a.date_heure_debut as datetime2) BETWEEN '"+request.params.dateDeb+"' AND '"+request.params.dateFin+"' ORDER BY p.Name, a.date_heure_debut ASC", (err,data) => {
    if(err) throw err;
    data = data['recordset'];
      response.json({data});
  });
});

//Récupérer un dépassement
app.get("/getOneDepassement/:id",middleware, (request, response) => {
  const req=request.query
  pool.query("SELECT a.Id, a.productId, p.Name, convert(varchar, CAST(a.date_heure_debut as datetime2), 103) as dateDebut, convert(varchar, CAST(a.date_heure_debut as datetime2), 108) as heureDebut, convert(varchar, CAST(a.date_heure_fin as datetime2), 103) as dateFin, convert(varchar, CAST(a.date_heure_fin as datetime2), 108) as heureFin, a.duree, a.description FROM depassements a INNER JOIN products_new p ON p.Id = a.productId WHERE a.id = "+ request.params.id, (err,data) => {
    if(err) throw err;
    data = data['recordset'];
      response.json({data});
  });
});

//Supprimer Dépassement
app.delete("/DeleteDepassement/:id", middleware,(request, response) => {
  const req=request.query
  pool.query("DELETE FROM depassements WHERE Id = "+request.params.id, (err,data) => {
    if(err) throw err;
    response.json("Suppression du DEP OK");
  });
});

//Récupérer le total des dépassements pour 1 ligne
app.get("/DepassementsSumFour/:dateDeb/:dateFin/:idUsine/:numLigne",middleware, (request, response) => {
  const req=request.query
  pool.query("SELECT 'Total Ligne "+request.params.numLigne+"' as Name, COALESCE(SUM(a.duree),0) as Duree FROM depassements a INNER JOIN products_new p ON a.productId = p.Id WHERE p.idUsine = "+request.params.idUsine+" AND CAST(a.date_heure_debut as datetime2) BETWEEN '"+request.params.dateDeb+"' AND '"+request.params.dateFin+"' AND p.Code LIKE '601040"+request.params.numLigne+"01'", (err,data) => {
    if(err) throw err;
    data = data['recordset'];
      response.json({data});
  });
});

//Récupérer le total des dépassements
app.get("/DepassementsSum/:dateDeb/:dateFin/:idUsine", middleware,(request, response) => {
  const req=request.query
  pool.query("SELECT 'Total' as Name, COALESCE(SUM(a.duree),0) as Duree FROM depassements a INNER JOIN products_new p ON p.Id = a.productId WHERE p.idUsine = "+request.params.idUsine+" AND CAST(a.date_heure_debut as datetime2) BETWEEN '"+request.params.dateDeb+"' AND '"+request.params.dateFin+"'", (err,data) => {
    if(err) throw err;
    data = data['recordset'];
      response.json({data});
  });
});

/*ARRETS*/
//?dateDebut=dd&dateFin=dd&duree=zz&user=0&dateSaisie=zz&description=erre&productId=2
app.put("/Arrets", middleware,(request, response) => {
  const req=request.query
  pool.query("INSERT INTO arrets (date_heure_debut, date_heure_fin, duree, [user], date_saisie, description, productId) VALUES ('"+req.dateDebut+"', '"+req.dateFin+"', "+req.duree+", "+req.user+", '"+req.dateSaisie+"', '"+req.description+"', "+req.productId+")"
  ,(err,result,fields) => {
      if(err) response.json("Création de l'arret KO");
      else response.json("Création de l'arret OK");
  });
});

//Modifier un arrêt
//?dateDebut=dd&dateFin=dd&duree=zz&user=0&dateSaisie=zz&description=erre&productId=2
app.put("/updateArret/:id", middleware,(request, response) => {
  const req=request.query
  pool.query("update arrets set date_heure_debut = '"+ req.dateDebut +"', date_heure_fin = '"+req.dateFin+"', duree ="+req.duree+", date_saisie='"+req.dateSaisie+"', description='"+req.description+"', productId="+req.productId+" WHERE id = " + request.params.id 
  ,(err,result,fields) => {
      if(err) throw err
      else response.json("Modif de l'arret OK");
  });
});

//Récupérer l'historique des arrêts pour un mois
app.get("/Arrets/:dateDeb/:dateFin/:idUsine", middleware,(request, response) => {
  const req=request.query
  pool.query("SELECT a.Id, p.Name, convert(varchar, CAST(a.date_heure_debut as datetime2), 103) as dateDebut, convert(varchar, CAST(a.date_heure_debut as datetime2), 108) as heureDebut, convert(varchar, CAST(a.date_heure_fin as datetime2), 103) as dateFin, convert(varchar, CAST(a.date_heure_fin as datetime2), 108) as heureFin, a.duree, a.description FROM arrets a INNER JOIN products_new p ON p.Id = a.productId WHERE p.idUsine = "+request.params.idUsine+" AND CAST(a.date_heure_debut as datetime2) BETWEEN '"+request.params.dateDeb+"' AND '"+request.params.dateFin+"' ORDER BY p.Name, a.date_heure_debut ASC", (err,data) => {
    if(err) throw err;
    data = data['recordset'];
      response.json({data});
  });
});

//Récupérer un arrêt
app.get("/getOneArret/:id",middleware, (request, response) => {
  const req=request.query
  pool.query("SELECT a.Id, a.productId, p.Name, convert(varchar, CAST(a.date_heure_debut as datetime2), 103) as dateDebut, convert(varchar, CAST(a.date_heure_debut as datetime2), 108) as heureDebut, convert(varchar, CAST(a.date_heure_fin as datetime2), 103) as dateFin, convert(varchar, CAST(a.date_heure_fin as datetime2), 108) as heureFin, a.duree, a.description FROM arrets a INNER JOIN products_new p ON p.Id = a.productId WHERE a.id = "+ request.params.id, (err,data) => {
    if(err) throw err;
    data = data['recordset'];
      response.json({data});
  });
});

//Supprimer Arret
app.delete("/DeleteArret/:id", middleware,(request, response) => {
  const req=request.query
  pool.query("DELETE FROM arrets WHERE Id = "+request.params.id, (err,data) => {
    if(err) throw err;
    response.json("Suppression de l'arrêt OK");
  });
});

//Récupérer le total des arrêts par groupe
app.get("/ArretsSumGroup/:dateDeb/:dateFin/:idUsine",middleware, (request, response) => {
  const req=request.query
  pool.query("SELECT p.Name, SUM(a.duree) as Duree FROM arrets a INNER JOIN products_new p ON p.Id = a.productId WHERE p.idUsine = "+request.params.idUsine+" AND CAST(a.date_heure_debut as datetime2) BETWEEN '"+request.params.dateDeb+"' AND '"+request.params.dateFin+"' GROUP BY p.Name", (err,data) => {
    if(err) throw err;
    data = data['recordset'];
      response.json({data});
  });
});

//Récupérer le total des arrêts
app.get("/ArretsSum/:dateDeb/:dateFin/:idUsine", middleware,(request, response) => {
  const req=request.query
  pool.query("SELECT 'Total' as Name, COALESCE(SUM(a.duree),0) as Duree FROM arrets a INNER JOIN products_new p ON p.Id = a.productId WHERE p.idUsine = "+request.params.idUsine+" AND CAST(a.date_heure_debut as datetime2) BETWEEN '"+request.params.dateDeb+"' AND '"+request.params.dateFin+"'", (err,data) => {
    if(err) throw err;
    data = data['recordset'];
      response.json({data});
  });
});

//Récupérer le total des arrêts pour 1 four
app.get("/ArretsSumFour/:dateDeb/:dateFin/:idUsine/:numFour", middleware,(request, response) => {
  const req=request.query
  pool.query("SELECT 'Total Four "+request.params.numFour+"' as Name, COALESCE(SUM(a.duree),0) as Duree FROM arrets a INNER JOIN products_new p ON a.productId = p.Id WHERE p.idUsine = "+request.params.idUsine+" AND CAST(a.date_heure_debut as datetime2) BETWEEN '"+request.params.dateDeb+"' AND '"+request.params.dateFin+"' AND p.Name LIKE '%"+request.params.numFour+"%'", (err,data) => {
    if(err) throw err;
    data = data['recordset'];
      response.json({data});
  });
});

/*USERS*/
//?nom=dd&prenom=dd&login=zz&pwd=0&isRondier=1&isSaisie=0&isQSE=0&isRapport=0&isChefQuart=1&isAdmin=01idUsine=1
app.put("/User", middleware,(request, response) => {
  const req=request.query
  pool.query("INSERT INTO users (Nom, Prenom, login, pwd, isRondier, isSaisie, isQSE, isRapport, isChefQuart, isAdmin, idUsine) VALUES ('"+req.nom+"', '"+req.prenom+"', '"+req.login+"', '"+req.pwd+"', "+req.isRondier+", "+req.isSaisie+", "+req.isQSE+", "+req.isRapport+", "+req.isChefQuart+", "+req.isAdmin+", "+req.idUsine+") "
  ,(err,result,fields) => {
      if(err) response.json("Création de l'utilisateur KO");
      else response.json("Création de l'utilisateur OK");
  });
});

//Récupérer l'ensemble des utilisateurs
//?login=aaaa&idUsine=1
app.get("/Users", middleware,(request, response) => {
  const req=request.query
  pool.query("SELECT * FROM users WHERE login LIKE '%"+req.login+"%' AND idUsine = "+req.idUsine+" ORDER BY Nom ASC", (err,data) => {
    if(err) throw err;
    data = data['recordset'];
    response.json({data});
  });
});

//Récupérer l'ensemble des utilisateurs d'un site ayant les droits ayant les droits rondier
//?idUsine=1
app.get("/UsersRondier", (request, response) => { 
  const req=request.query 
  pool.query("SELECT Nom, Prenom, Id FROM users WHERE isRondier = 1 AND idUsine = "+req.idUsine+" ORDER BY Nom ASC", (err,data) => { 
    if(err) throw err; 
    data = data['recordset'];
    response.json({data});
  });
});

//Récupérer l'utilisateur qui est connecté et Connexion
app.get("/User/:login/:pwd", (request, response) => {
  const req=request.query;
  //pour protéger la connexion tablette des users avec un apostrophe
  let login = request.params.login.replace("'","''");
  pool.query("SELECT * FROM users WHERE login = '"+login+"' AND pwd = '"+request.params.pwd+"'", (err,data) => {
    if(err) throw err;
    data = data['recordset'];
    //Si on a une valeur de retour on génère un token
    if(data.length>0){
      const token = generateAcessToken(data[0]["Id"])
      response.send({
        'data' : data,
        token
      });
    }
    else response.json({data})
  });
});

//Permet de verifier si l'identifiant est déjà utilisé
app.get("/User/:login", middleware,(request, response) => {
  const req=request.query
  pool.query("SELECT * FROM users WHERE login = '"+request.params.login+"'", (err,data) => {
    if(err) throw err;
    data = data['recordset'];
    response.json({data});
  });
});

//Update du mdp utilisateur
app.put("/User/:login/:pwd", middleware,(request, response) => {
  const req=request.query;
  pool.query("UPDATE users SET pwd = '" + request.params.pwd + "' WHERE login = '"+request.params.login+"'", (err,data) => {
    if(err) throw err;
    response.json("Mise à jour du mot de passe OK")
  });
});

//Update droit rondier
app.put("/UserRondier/:login/:droit", middleware, (request, response) => {
  const req=request.query
  pool.query("UPDATE users SET isRondier = '" + request.params.droit + "' WHERE login = '"+request.params.login+"'", (err,data) => {
    if(err) throw err;
    response.json("Mise à jour du droit OK")
  });
});

//Update droit saisie
app.put("/UserSaisie/:login/:droit", middleware,(request, response) => {
  const req=request.query
  pool.query("UPDATE users SET isSaisie = '" + request.params.droit + "' WHERE login = '"+request.params.login+"'", (err,data) => {
    if(err) throw err;
    response.json("Mise à jour du droit OK")
  });
});

//Update droit QSE
app.put("/UserQSE/:login/:droit", middleware,(request, response) => {
  const req=request.query
  pool.query("UPDATE users SET isQSE = '" + request.params.droit + "' WHERE login = '"+request.params.login+"'", (err,data) => {
    if(err) throw err;
    response.json("Mise à jour du droit OK")
  });
});

//Update droit rapport
app.put("/UserRapport/:login/:droit", middleware,(request, response) => {
  const req=request.query
  pool.query("UPDATE users SET isRapport = '" + request.params.droit + "' WHERE login = '"+request.params.login+"'", (err,data) => {
    if(err) throw err;
    response.json("Mise à jour du droit OK")
  });
});

//Update droit chef quart
app.put("/UserChefQuart/:login/:droit", middleware,(request, response) => {
  const req=request.query
  pool.query("UPDATE users SET isChefQuart = '" + request.params.droit + "' WHERE login = '"+request.params.login+"'", (err,data) => {
    if(err) throw err;
    response.json("Mise à jour du droit OK")
  });
});

//Update droit admin
app.put("/UserAdmin/:login/:droit", middleware,(request, response) => {
  const req=request.query
  pool.query("UPDATE users SET isAdmin = '" + request.params.droit + "' WHERE login = '"+request.params.login+"'", (err,data) => {
    if(err) throw err;
    response.json("Mise à jour du droit OK")
  });
});

//DELETE User
app.delete("/user/:id", middleware,(request, response) => {
  const req=request.query
  pool.query("DELETE FROM users WHERE Id = "+request.params.id, (err,data) => {
    if(err) {
      response.json("Suppression du user KO")
    }
    else response.json("Suppression du user OK")
  });
});

//Récupérer l'ensemble des users non affecté à un badge
app.get("/UsersLibre/:idUsine", middleware,(request, response) => {
  const req=request.query
  pool.query("SELECT * FROM users WHERE idUsine = "+request.params.idUsine+" AND Id NOT IN (SELECT userId FROM badge WHERE userId IS NOT NULL) ORDER BY Nom ASC", (err,data) => {
    if(err) throw err;
    data = data['recordset'];
    response.json({data});
  });
});

//*********************
/*******RONDIER*******/
//*********************

/*Badge*/
//?uid=AD:123:D23&idUsine=1
app.put("/Badge", middleware,(request, response) => {
  const req=request.query
  pool.query("INSERT INTO badge (uid, idUsine) VALUES ('"+req.uid+"', "+req.idUsine+")"
  ,(err,result,fields) => {
      if(err) response.json("Création du badge KO");
      else response.json("Création du badge OK");
  });
});

//Récupérer le dernier ID de badge inséré
app.get("/BadgeLastId", middleware,(request, response) => {
  const req=request.query
  pool.query("SELECT IDENT_CURRENT('badge') as Id", (err,data) => {
    if(err) throw err;
    data = data['recordset'];
    response.json({data});
  });
});

//Récupérer l'utilisateur lié au badge
app.get("/UserOfBadge/:uid", (request, response) => {
  const req=request.query
  pool.query("SELECT u.Id, u.Nom, u.Prenom, u.login, u.idUsine, u.pwd, u.isRondier, u.isSaisie, u.isQSE, u.isRapport, u.isAdmin FROM users u INNER JOIN badge b ON b.userId = u.Id WHERE b.uid LIKE '"+request.params.uid+"'", (err,data) => {
    if(err) throw err;
    data = data['recordset'];
    response.json({data});
  });
});

//Récupérer les elements de controle lié à la zone qui est lié au badge
app.get("/ElementsOfBadge/:uid", (request, response) => {
  const req=request.query
  pool.query("SELECT e.Id, e.zoneId, z.nom as 'NomZone', z.commentaire, e.nom, e.valeurMin, e.valeurMax, e.typeChamp, e.isFour, e.isGlobal, e.unit, e.defaultValue, e.isRegulateur, e.listValues FROM elementcontrole e INNER JOIN zonecontrole z ON e.zoneId = z.Id INNER JOIN badge b ON b.zoneId = z.Id WHERE b.uid LIKE '"+request.params.uid+"'", (err,data) => {
    if(err) throw err;
    data = data['recordset'];
    response.json({data});
  });
});

//Récupérer l'ensemble des badges affecté à un User
app.get("/BadgesUser/:idUsine", middleware,(request, response) => {
  const req=request.query
  pool.query("SELECT b.Id, b.isEnabled, b.userId, b.zoneId, b.uid, u.login as affect FROM badge b INNER JOIN users u ON u.Id = b.userId WHERE b.idUsine = "+request.params.idUsine, (err,data) => {
    if(err) throw err;
    data = data['recordset'];
    response.json({data});
  });
});

//Récupérer l'ensemble des badges affecté à une zone
app.get("/BadgesZone/:idUsine", middleware,(request, response) => {
  const req=request.query
  pool.query("SELECT b.Id, b.isEnabled, b.userId, b.zoneId, b.uid, z.nom as affect FROM badge b INNER JOIN zonecontrole z ON z.Id = b.zoneId WHERE b.idUsine = "+request.params.idUsine, (err,data) => {
    if(err) throw err;
    data = data['recordset'];
    response.json({data});
  });
});

//Récupérer l'ensemble des badges non affecté
app.get("/BadgesLibre/:idUsine", middleware,(request, response) => {
  const req=request.query
  pool.query("SELECT * FROM badge b WHERE b.idUsine = "+request.params.idUsine+" AND b.userId IS NULL AND b.zoneId IS NULL AND b.Id NOT IN (SELECT p.badgeId FROM permisfeu p WHERE p.dateHeureDeb <= convert(varchar, getdate(), 120) AND p.dateHeureFin > convert(varchar, getdate(), 120))", (err,data) => {
    if(err) throw err;
    data = data['recordset'];
    response.json({data});
  });
});

//Update enabled
app.put("/BadgeEnabled/:id/:enabled",middleware, (request, response) => {
  const req=request.query
  pool.query("UPDATE badge SET isEnabled = '" + request.params.enabled + "' WHERE Id = '"+request.params.id+"'", (err,data) => {
    if(err) throw err;
    response.json("Mise à jour de l'activation OK")
  });
});

//Update affectation
app.put("/BadgeAffectation/:id/:typeAffectation/:idAffectation", middleware,(request, response) => {
  const req=request.query
  pool.query("UPDATE badge SET " + request.params.typeAffectation+" = '" + request.params.idAffectation + "' WHERE Id = '"+request.params.id+"'", (err,data) => {
    if(err) throw err;
    response.json("Mise à jour de l'affectation OK")
  });
});

//Update affectation => retirer les affectations
app.put("/BadgeDeleteAffectation/:id", middleware,(request, response) => {
  const req=request.query
  pool.query("UPDATE badge SET userId = NULL, zoneId = NULL WHERE Id = '"+request.params.id+"'", (err,data) => {
    if(err) throw err;
    response.json("Mise à jour de l'affectation OK")
  });
});

//Update affectation => retirer les affectations
app.put("/deleteBadge/:id", middleware,(request, response) => {
  const req=request.query
  pool.query("delete from badge where Id = '"+request.params.id+"'", (err,data) => {
    if(err) throw err;
    response.json("Suppression du badge OK")
  });
});

/*Zone de controle*/

//Créer une zone de contrôle
//?nom=dggd&commentaire=fff&four=1&idUsine=1
app.put("/zone", middleware,(request, response) => {
  const req=request.query
  pool.query("INSERT INTO zonecontrole (nom, commentaire, four, idUsine) VALUES ('"+req.nom+"', '"+req.commentaire+"', "+req.four+", "+req.idUsine+")"
  ,(err,result,fields) => {
      if(err) response.json("Création de la zone KO");
      else response.json("Création de la zone OK");
  });
});

//Supprimer une zone de controle
//?Id=1
app.delete("/deleteZone", middleware,(request, response) => {
  const req=request.query
  pool.query("DELETE FROM zonecontrole WHERE Id = "+req.Id, (err,result,fields) => {
      if(err) response.json("Création de la zone KO");
      else response.json("Suppression OK");
  });
});

//Récupérer l'ensemble des zones de controle
app.get("/zones/:idUsine", middleware,(request, response) => {
  const req=request.query
  pool.query("SELECT * FROM zonecontrole WHERE idUsine = "+request.params.idUsine+" ORDER BY nom ASC", (err,data) => {
    if(err) throw err;
    data = data['recordset'];
    response.json({data});
  });
});

//Récupérer l'ensemble des zones de controle
app.get("/zones/:idUsine", middleware,(request, response) => {
  const req=request.query
  pool.query("SELECT * FROM zonecontrole WHERE idUsine = "+request.params.idUsine+" ORDER BY nom ASC", (err,data) => {
    if(err) throw err;
    data = data['recordset'];
    response.json({data});
  });
});

//Récupérer l'ensemble des zones de controle
//?quart=1
app.get("/getZonesAndAnomaliesOfDay/:idUsine/:date", middleware,(request, response) => {
  listZones = [];
  const req=request.query
  if(req.quart == 0){
    var query = "SELECT * from ronde where dateHeure = '"+request.params.date+"' and idUsine ="+request.params.idUsine
  }
  else{
    var query = "SELECT * from ronde where dateHeure = '"+request.params.date+"' and idUsine ="+request.params.idUsine +'and quart=' + req.quart
  }
  pool.query(query, async (err,data) => {
    if(err) throw err;
    data = data['recordset'];
    //On boucle sur chaque zone et son badge pour récupérer ses éléments
    for await (const ronde of data) {
      await getZonesAndAnomaliesOfRonde(ronde);
    };
    response.json({listZones});
  });
});

//Récupérer l'ensemble des zones de controle
app.get("/getAnomaliesOfOneDay/:idUsine/:date", middleware,(request, response) => {
  listZones = [];
  const req=request.query
  if(req.quart==0){
    var query ="select anomalie.* from anomalie join ronde on ronde.id = anomalie.rondeId  where ronde.dateHeure = '"+request.params.date+"' and ronde.idUsine = "+request.params.idUsine  
  }
  else{
    var query ="select anomalie.* from anomalie join ronde on ronde.id = anomalie.rondeId  where ronde.dateHeure = '"+request.params.date+"' and ronde.idUsine = "+request.params.idUsine +" and ronde.quart = "+req.quart 
  }
  pool.query(query, async (err,data) => {
    if(err) throw err;
    data = data['recordset'];
    response.json({data});
  });
});

//Récupérer l'ensemble des zones de controle
app.get("/getElementsAndValuesOfDay/:idUsine/:date", middleware,(request, response) => {
  listZones = [];
  const req=request.query
  if(req.quart == 0){
    var query = "SELECT e.*, r.Id as 'idRonde', m.value, m.id as 'idMesure' FROM mesuresrondier m INNER JOIN elementcontrole e ON m.elementId = e.Id FULL OUTER JOIN groupement g ON g.id = e.idGroupement INNER JOIN ronde r ON r.Id = m.rondeId INNER JOIN zonecontrole z ON z.Id = e.zoneId WHERE r.dateHeure = '"+request.params.date+"' and r.idUsine = "+request.params.idUsine+" ORDER BY z.nom,g.groupement,e.nom,e.ordre"  
  }
  else{
    var query = "SELECT e.*, r.Id as 'idRonde', m.value, m.id as 'idMesure' FROM mesuresrondier m INNER JOIN elementcontrole e ON m.elementId = e.Id FULL OUTER JOIN groupement g ON g.id = e.idGroupement INNER JOIN ronde r ON r.Id = m.rondeId INNER JOIN zonecontrole z ON z.Id = e.zoneId WHERE r.dateHeure = '"+request.params.date+"' and r.idUsine = "+request.params.idUsine+" and r.quart = "+ req.quart+" ORDER BY z.nom,g.groupement,e.nom,e.ordre"  
  }
  pool.query(query, async (err,data) => {
    if(err) throw err;
    data = data['recordset'];
    response.json({data});
  });
});


function getZonesAndAnomaliesOfRonde(ronde){
  return new Promise((resolve) => {
    //Récupération des zones
        pool.query("select DISTINCT z.*, a.* from mesuresrondier m join elementcontrole e on e.id = m.elementId join zonecontrole z on z.id =e.zoneId full outer join anomalie a on (a.rondeId=" + ronde["Id"] + " and a.zoneId=z.id)where m.rondeId=" + ronde["Id"] + "order by z.nom", async (err, data) => {
          if (err) throw err;
          zones = data['recordset'];
          let oneZone = {
            IdRonde : ronde["Id"],
            listZones: zones
          };
          listZones.push(oneZone)
          resolve();
          // console.log(oneRonde)
        });

  });
}

//POUR MODE HORS LIGNE
//Récupérer l'ensemble des zones, le badge associé et les éléments de contrôle associé ainsi que la valeur de la ronde précédente
app.get("/BadgeAndElementsOfZone/:idUsine", (request, response) => {
  BadgeAndElementsOfZone = [];
  pool.query("SELECT z.Id as zoneId, z.nom as nomZone, z.commentaire, z.four, b.uid as uidBadge from zonecontrole z INNER JOIN badge b ON b.zoneId = z.Id WHERE z.idUsine = "+request.params.idUsine+ " ORDER BY z.nom ASC", async (err,data) => {
    if(err) throw err;
    else {
      data = data['recordset'];
      //On récupère l'Id de la ronde précedente
      await getPreviousId(request.params.idUsine);
      //On boucle sur chaque zone et son badge pour récupérer ses éléments
      for await (const zone of data) {
        await getElementsHorsLigne(zone);
      };
      response.json({BadgeAndElementsOfZone});
    }
  });
});

//Récupérer l'ensemble des zones, les modes OPs associés et les éléments de contrôle associé ainsi que la valeur de la ronde précédente
app.get("/elementsOfUsine/:idUsine", (request, response) => {
  BadgeAndElementsOfZone = [];
  pool.query("SELECT z.Id as zoneId, z.nom as nomZone, z.commentaire, z.four from zonecontrole z WHERE z.idUsine = "+request.params.idUsine+ " ORDER BY z.nom ASC", async (err,data) => {
    if(err) throw err;
    else {
      data = data['recordset'];
      //On récupère l'Id de la ronde précedente
      await getPreviousId(request.params.idUsine);
      //On boucle sur chaque zone et son badge pour récupérer ses éléments
      for await (const zone of data) {
        await getElementsHorsLigne(zone);
      };
      response.json({BadgeAndElementsOfZone});
    }
  });
});

function getElementsHorsLigne(zone) {
  return new Promise((resolve) => {
    let modesOp;
    //Récupération des modesOP
    pool.query("SELECT * FROM modeoperatoire m WHERE zoneId = "+zone.zoneId, (err,data) => {
      if(err) throw err;
      else{
        modesOp = data['recordset'];
        pool.query("SELECT e.Id, e.zoneId, e.nom, e.valeurMin, e.valeurMax, e.typeChamp, e.unit, e.defaultValue, e.isRegulateur, e.listValues, e.isCompteur, m.value as previousValue, g.groupement FROM elementcontrole e LEFT JOIN mesuresrondier m ON e.Id = m.elementId AND m.rondeId = "+previousId+" FULL OUTER JOIN groupement g ON g.id = e.idGroupement WHERE e.zoneId = "+zone.zoneId + "ORDER BY g.id, e.ordre ASC", (err,data) => {
          if(err) throw err;
          else{
            data = data['recordset'];
            let OneBadgeAndElementsOfZone = {
              id : zone.id,
              zoneId : zone.zoneId,
              zone : zone.nomZone,
              commentaire : zone.commentaire,
              badge : zone.uidBadge,
              four : zone.four,
              groupement : zone.groupement,
              modeOP : modesOp,
              termine: zone.termine,
              nomRondier: zone.nomRondier,
              prenomRondier: zone.prenomRondier,
              elements : data
            };
            resolve();
            BadgeAndElementsOfZone.push(OneBadgeAndElementsOfZone);
          }
        });
      }
    });
  });
}

// //Récupérer l'ensemble des zones de controle
// //?dateHeure
// app.get("/reporting/:idUsine",(request, response) => {
//   const req=request.query
//   var test
//   pool.query("select r.Id, r.dateHeure, r.quart, r.commentaire, r.isFinished, r.fonctFour1, r.fonctFour2, r.fonctFour3, r.fonctFour4, users.Nom as 'nomUser', users.Prenom as 'prenomUser', chefQuart.Nom as 'nomChefQuart', chefQuart.Prenom as 'prenomChefQuart'"
//   +"from ronde r join users on users.Id = userId join users chefQuart on chefQuart.Id = r.chefQuartId  where r.dateHeure='15/02/2024' and r.idUsine = "
//    +request.params.idUsine, async (err,data) => {
//     if(err) throw err;
//     listeRondes = data['recordset'];
//     for await(const ronde of listeRondes){
//       let oneRonde = {
//         Id : ronde["Id"],
//         dateHeure: ronde["dateHeure"],
//         quart: ronde["quart"],
//         commentaire: ronde["commentaire"],
//         isFinished: ronde["isFinished"],
//         fonctFour1: ronde["fonctFour1"],
//         fonctFour2: ronde["fonctFour2"],
//         fonctFour3: ronde["fonctFour3"],
//         fonctFour4: ronde["fonctFour4"],
//         nomUser: ronde["nomUser"],
//         prenomUser: ronde["prenomUser"],
//         nomChefQuart: ronde["nomChefQuart"],
//         prenomChefQuart: ronde["prenomChefQuart"],
//         listZones: []
//       };
//       await getZonesAndAnomalies(ronde, oneRonde.listZones);
//     }
//     response.json({infosRondes});
//   });
// });

// function getZonesAndAnomalies(ronde, listZones){
//   return new Promise(async (resolve) => {
//     // console.log(ronde)
//     let modesOp;
//     //Récupération des zones
//     pool.query("select DISTINCT z.*, a.* from mesuresrondier m join elementcontrole e on e.id = m.elementId join zonecontrole z on z.id =e.zoneId full outer join anomalie a on (a.rondeId=" + ronde["Id"] + " and a.zoneId=z.id)where m.rondeId=" + ronde["Id"], async (err, data) => {
//       if (err) throw err;
//       listZones = data['recordset'];
//       for await(const zone of listZones){
//         await getGroupementsZone(ronde, zone);
//       }
      
//       // console.log(oneRonde)
//     });
//     resolve();
//   });
// }

// function getGroupementsZone(ronde, zone){
//   return new Promise(async (resolve) => {
//     //Récupération des groupements
//     pool.query("SELECT * from groupement where zoneId = " + zone["Id"], async (err, data) => {
//       if (err) throw err;
//       listGrouepements = data['recordset'];
//       for await(const groupement of listGrouepements){
//         await getGroupementsElementsWithValue(ronde, zone, groupement);
//       }
//     });
//     resolve();
//   });
// }

// function getGroupementsElementsWithValue(ronde, zone, groupement){
//   return new Promise(async (resolve) => {
//     //Récupération des groupements
//     pool.query("SELECT e.Id, e.zoneId, e.nom, m.value, e.valeurMin, e.valeurMax, e.typeChamp, e.unit, e.defaultValue, e.isRegulateur, e.listValues, e.isCompteur, m.value as previousValue, g.groupement FROM mesuresrondier m INNER JOIN elementcontrole e ON m.elementId = e.Id FULL OUTER JOIN groupement g ON g.id = e.idGroupement INNER JOIN ronde r ON r.Id = m.rondeId INNER JOIN zonecontrole z ON z.Id = e.zoneId WHERE r.Id ="+ronde["Id"]+" and e.zoneId ="+zone["Id"]+" and g.groupement="+groupement["Id"]+" ORDER BY z.nom,g.groupement,e.ordre", async (err, data) => {
//       listElementDuGroupement = data['recordset']
//       if (err) throw err;
//       listGrouepements = data['recordset'];
//       await getElementsWithValueWithoutGroupement(ronde, zone, groupement, listElementDuGroupement)
//     });
//     resolve();
//   });
// }

// function getElementsWithValueWithoutGroupement(ronde, zone, groupement, listElementDuGroupement){
//   return new Promise(async (resolve) => {
//     //Récupération des groupements
//     pool.query("SELECT e.Id, e.zoneId, e.nom, m.value, e.valeurMin, e.valeurMax, e.typeChamp, e.unit, e.defaultValue, e.isRegulateur, e.listValues, e.isCompteur, m.value as previousValue, g.groupement FROM mesuresrondier m INNER JOIN elementcontrole e ON m.elementId = e.Id FULL OUTER JOIN groupement g ON g.id = e.idGroupement INNER JOIN ronde r ON r.Id = m.rondeId INNER JOIN zonecontrole z ON z.Id = e.zoneId WHERE r.Id ="+ronde["Id"]+" and e.zoneId ="+zone["Id"]+" and g.groupement IS NULL ORDER BY z.nom,g.groupement,e.ordre", async (err, data) => {
//       if (err) throw err;
//       listElementsSansGroupements = data['recordset'];
      
//     });
//     resolve();
//   });
// }

//Récupérer l'ensemble des zones, pour lesquelles on a des valeur sur une ronde donnée
app.get("/BadgeAndElementsOfZoneWithValues/:idUsine/:idRonde", (request, response) => {
  BadgeAndElementsOfZone = [];
  if(request.params.idUsine == 7){
    var requete = "SELECT z.Id as zoneId, z.nom as nomZone, z.commentaire, z.four from zonecontrole z WHERE z.idUsine = "+request.params.idUsine+ " ORDER BY z.nom ASC"
  }
  else var requete = "SELECT distinct z.Id as zoneId, z.nom as nomZone, z.commentaire, z.four, b.uid as uidBadge from zonecontrole z INNER JOIN badge b ON b.zoneId = z.Id WHERE z.idUsine = "+request.params.idUsine+ " ORDER BY z.nom ASC"
  pool.query(requete, async (err,data) => {
    if(err) throw err;
    else {
      data = data['recordset'];
      //On récupère l'Id de la ronde précedente
      getPreviousId(request.params.idUsine);
      //On boucle sur chaque zone et son badge pour récupérer ses éléments
      for await (const zone of data) {
        await getElementsWithValues(zone,request.params.idRonde);
      };
      // console.log(BadgeAndElementsOfZone)
      response.json({BadgeAndElementsOfZone});
    }
  });
});

//récupère les éléments pour lesquelle on a des valeurs pour une ronde donnée.
function getElementsWithValues(zone,idRonde) {
  return new Promise((resolve) => {
    let modesOp;
    //Récupération des modesOP
    pool.query("SELECT * FROM modeoperatoire m WHERE zoneId = "+zone.zoneId, (err,data) => {
      if(err) throw err;
      else{
        modesOp = data['recordset'];

        pool.query("SELECT e.Id, e.zoneId, e.nom, e.valeurMin, e.valeurMax, e.typeChamp, e.unit, e.defaultValue, e.isRegulateur, e.listValues, e.isCompteur, m.value as previousValue, g.groupement FROM mesuresrondier m INNER JOIN elementcontrole e ON m.elementId = e.Id FULL OUTER JOIN groupement g ON g.id = e.idGroupement INNER JOIN ronde r ON r.Id = m.rondeId INNER JOIN zonecontrole z ON z.Id = e.zoneId WHERE r.Id =" + idRonde +" and e.zoneId =" + zone.zoneId +" ORDER BY z.nom,g.groupement,e.ordre", (err,data) => {
          if(err) throw err;
          else{
            data = data['recordset'];
            let OneBadgeAndElementsOfZone = {
              zoneId : zone.zoneId,
              zone : zone.nomZone,
              commentaire : zone.commentaire,
              badge : zone.uidBadge,
              four : zone.four,
              groupement : zone.groupement,
              modeOP : modesOp,
              elements : data
            };
            resolve();
            if(data.length != 0)
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
  pool.query("SELECT z.Id as zoneId, z.nom as nomZone, z.commentaire, z.four, idRondier from zonecontrole z inner join affectation_equipe e on e.idZone = z.Id WHERE z.idUsine = "+request.params.idUsine+" and e.idRondier = "+request.params.idUser+" ORDER BY z.nom ASC ", async (err,data) => {
    if(err) throw err;
    else {
      //On récupère l'Id de la ronde précedente
      data = data['recordset'];
      await getPreviousId(request.params.idUsine);
      //On récupère les éléments de la zone
      await getElementsHorsLigneUser(data);
      
      response.json({BadgeAndElementsOfZone});
    }
  });
});

function getElementsHorsLigneUser(zone) {
  return new Promise((resolve) => {
    let modesOp;
    //Récupération des modesOP
    if(zone[0] != undefined){
      pool.query("SELECT * FROM modeoperatoire m WHERE zoneId = "+zone[0]['zoneId'], (err,data) => {
        if(err) throw err;
        else{
          modesOp = data['recordset'];
          pool.query("SELECT e.Id, e.zoneId, e.nom, e.valeurMin, e.valeurMax, e.typeChamp, e.unit, e.defaultValue, e.isRegulateur, e.listValues, e.isCompteur, m.value as previousValue, g.groupement FROM elementcontrole e LEFT JOIN mesuresrondier m ON e.Id = m.elementId AND m.rondeId = "+previousId+" FULL OUTER join groupement g on e.idGroupement = g.id WHERE e.zoneId = "+zone[0]['zoneId'] + "ORDER BY g.id, e.ordre ASC"
          , (err,data) => {
            if(err) throw err;
            else{
              data = data['recordset'];
              // console.log(data);
              let OneElementOfZone = {
                zoneId : zone[0]['zoneId'],
                zone : zone[0]['nomZone'],
                commentaire : zone[0]['commentaire'],
                four : zone[0]['four'],
                modeOP : modesOp,
                groupement : zone[0]['groupement'],
                elements : data
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
function getPreviousId(id){
  return new Promise((resolve) => {
    pool.query("SELECT TOP 2 Id from ronde WHERE idUsine = " + id + " ORDER BY Id DESC", (err, data) => {
      if (err) throw err;
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
app.put("/zoneCommentaire/:id/:commentaire", middleware,(request, response) => {
  const req=request.query
  pool.query("UPDATE zonecontrole SET commentaire = '" + request.params.commentaire + "' WHERE Id = '"+request.params.id+"'", (err,data) => {
    if(err) throw err;
    response.json("Mise à jour du commentaire OK")
  });
});

//Update nom
//?nom=test
app.put("/zoneNom/:id", middleware,(request, response) => {
  const req=request.query
  req.nom = req.nom.replace("'"," ");
  pool.query("UPDATE zonecontrole SET nom = '" + req.nom + "' WHERE Id = '"+request.params.id+"'", (err,data) => {
    if(err) throw err;
    response.json("Mise à jour du nom OK")
  });
});

//Récupérer l'ensemble des zones non affecté à un badge
app.get("/ZonesLibre/:idUsine", middleware,(request, response) => {
  const req=request.query
  pool.query("SELECT * FROM zonecontrole WHERE idUsine = "+request.params.idUsine+" AND Id NOT IN (SELECT zoneId FROM badge WHERE zoneId IS NOT NULL) ORDER BY nom ASC", (err,data) => {
    if(err) throw err;
    data = data['recordset'];
    response.json({data});
  });
});

/*Element de controle*/
//?zoneId=1&nom=ddd&valeurMin=1.4&valeurMax=2.5&typeChamp=1&unit=tonnes&defaultValue=1.7&isRegulateur=0&listValues=1 2 3&isCompteur=1&ordre=10
app.put("/element", middleware,(request, response) => {
  const req=request.query
  if(req.idGroupement==0){
    req.idGroupement = null;
  }
  pool.query("INSERT INTO elementcontrole (zoneId, nom, valeurMin, valeurMax, typeChamp, unit, defaultValue, isRegulateur, listValues, isCompteur, ordre, idGroupement, CodeEquipement) VALUES ("+req.zoneId+", '"+req.nom+"', "+req.valeurMin+", "+req.valeurMax+", "+req.typeChamp+", '"+req.unit+"', '"+req.defaultValue+"', "+req.isRegulateur+", '"+req.listValues+"', "+req.isCompteur+", "+req.ordre+"," + req.idGroupement +",'"+req.codeEquipement+"')"
    ,(err,result,fields) => {
        if(err) response.json("Création de l'élément KO");
        else response.json("Création de l'élément OK");
    });
});

//Update ordre elements
//Incrémente les ordres de 1 pour pouvoir insérer une éléments entre 2 éléments existants
//?zoneId=1&maxOrdre=2
app.put("/updateOrdreElement", middleware,(request, response) => {
  const req=request.query
  pool.query("UPDATE elementcontrole SET ordre = ordre + 1 WHERE zoneId = " + req.zoneId + " AND ordre > " + req.maxOrdre, (err,data) => {
    if(err) throw err;
    response.json("Mise à jour des ordres OK")
  });
});

//Update element
//?zoneId=1&nom=ddd&valeurMin=1.4&valeurMax=2.5&typeChamp=1&unit=tonnes&defaultValue=1.7&isRegulateur=0&listValues=1 2 3&isCompteur=1&ordre=5&idGroupement=1
app.put("/updateElement/:id", middleware,(request, response) => {
  const req=request.query
  if(req.idGroupement == 0 ){
    req.idGroupement = null;
  }
  pool.query("UPDATE elementcontrole SET zoneId = " + req.zoneId + ", nom = '"+ req.nom +"', valeurMin = "+ req.valeurMin+", valeurMax = "+ req.valeurMax +", typeChamp = "+ req.typeChamp +", unit = '"+ req.unit +"', defaultValue = '"+ req.defaultValue +"', isRegulateur = "+ req.isRegulateur +", listValues = '"+ req.listValues +"', isCompteur = "+ req.isCompteur +", ordre = "+ req.ordre +", idGroupement ="+ req.idGroupement +",CodeEquipement = '"+ req.codeEquipement +"' WHERE Id = "+request.params.id, (err,data) => {
    if(err) throw err;
    response.json("Mise à jour de l'element OK")
  });
});

//Suppression element
//?id=12
app.delete("/deleteElement", middleware,(request, response) => {
  const req=request.query
  pool.query("DELETE FROM elementcontrole WHERE Id = "+ req.id, (err,data) => {
    if(err) throw err;
    response.json("Suppression de l'élément OK")
  });
});

//Récupérer l'ensemble des élements d'une usine
app.get("/elementsControleOfUsine/:idUsine",middleware, (request, response) => {
  const req=request.query
  pool.query("select e.*, z.nom as nomZone from elementcontrole e INNER JOIN zonecontrole z ON z.Id = e.zoneId where e.typeChamp IN (1,2) and  z.idUsine = "+request.params.idUsine + " order by e.nom asc", (err,data) => {
    if(err) throw err;
    data = data['recordset'];
    response.json({data});
  });
});


//Récupérer l'ensemble des élements d'une zone
app.get("/elementsOfZone/:zoneId",middleware, (request, response) => {
  const req=request.query
  pool.query("SELECT e.*, g.groupement FROM elementcontrole  e FULL OUTER join groupement g on g.id = e.idGroupement  WHERE e.zoneId = "+request.params.zoneId +" ORDER BY idGroupement asc, ordre ASC", (err,data) => {
    //if(err) throw err;
    //TODO : bug ici => à debug
    if(err) console.log(err);
    data = data['recordset'];
    response.json({data});
  });
});

//Récupérer l'ensemble des élements de type compteur
app.get("/elementsCompteur/:idUsine",middleware, (request, response) => {
  const req=request.query
  pool.query("SELECT * FROM elementcontrole e INNER JOIN zonecontrole z ON z.Id = e.zoneId WHERE z.IdUsine = "+request.params.idUsine+" AND e.isCompteur = 1 ORDER BY ordre ASC", (err,data) => {
    if(err) throw err;
    data = data['recordset'];
    response.json({data});
  });
});

//Récupérer un element 
app.get("/element/:elementId", middleware,(request, response) => {
  const req=request.query
  pool.query("SELECT * FROM elementcontrole WHERE Id = "+request.params.elementId, (err,data) => {
    if(err) throw err;
    data = data['recordset'];
    response.json({data});
  });
});

//Récupérer l'ensemble des élements pour lesquelles il n'y a pas de valeur sur la ronde en cours
//?date=07/02/2022
app.get("/elementsOfRonde/:quart", (request, response) => {
  const req=request.query
  pool.query("SELECT * FROM elementcontrole WHERE Id NOT IN (SELECT m.elementId FROM mesuresrondier m INNER JOIN ronde r ON r.Id = m.rondeId WHERE r.dateHeure LIKE '"+req.date+"%' AND r.quart = "+request.params.quart+")", (err,data) => {
    if(err) throw err;
    data = data['recordset'];
    response.json({data});
  });
});

/////////////////////////
//      Groupements    //
/////////////////////////

//Récupérer les groupements d'une zone
//?zoneId=220
app.get("/getGroupements", middleware,(request, response) => {
  const req=request.query
  pool.query("SELECT * from groupement WHERE zoneId = "+ req.zoneId, (err,data) => {
    if(err) throw err;
    data = data['recordset'];
    response.json({data});
  });
});

//Récupérer l'ensemble des groupements d'une usine
//?idUsine=1
app.get("/getGroupementsOfOneDay/:idUsine/:date",middleware, (request, response) => {
  const req=request.query
  if(req.quart == 0){
    var query = "SELECT distinct g.id, g.groupement, g.zoneId FROM mesuresrondier m INNER JOIN elementcontrole e ON m.elementId = e.Id JOIN groupement g ON g.id = e.idGroupement INNER JOIN ronde r ON r.Id = m.rondeId INNER JOIN zonecontrole z ON z.Id = e.zoneId WHERE r.dateHeure = '"+request.params.date+"' and r.idUsine = "+request.params.idUsine+" ORDER BY g.groupement" 
  }
  else{
    var query = "SELECT distinct g.id, g.groupement, g.zoneId FROM mesuresrondier m INNER JOIN elementcontrole e ON m.elementId = e.Id JOIN groupement g ON g.id = e.idGroupement INNER JOIN ronde r ON r.Id = m.rondeId INNER JOIN zonecontrole z ON z.Id = e.zoneId WHERE r.dateHeure = '"+request.params.date+"' and r.quart="+req.quart+" and r.idUsine = "+request.params.idUsine+" ORDER BY g.groupement" 
  }
  pool.query( query , async (err,data) => {
    if(err) throw err;
    data = data['recordset'];
    response.json({data});
  });
});

//Récupérer l'ensemble des groupements d'une usine
//?idUsine=1
app.get("/getAllGroupements",middleware, (request, response) => {
  const req=request.query
  pool.query("SELECT * FROM groupement join zonecontrole on groupement.zoneId = zonecontrole.Id WHERE zonecontrole.idUsine= "+req.idUsine + "order by groupement.zoneId asc", (err,data) => {
    if(err) throw err;
    data = data['recordset'];
    response.json({data});
  });
});
//Récupérer un groupement
//?idGroupement=1
app.get("/getOneGroupement",middleware, (request, response) => {
  const req=request.query
  pool.query("SELECT * FROM groupement where id="+req.idGroupement, (err,data) => {
    if(err) throw err;
    data = data['recordset'];
    response.json({data});
  });
});

//Créer un groupement
//?zoneId=2&groupement=test
app.put("/groupement", middleware,(request, response) => {
  const req=request.query;
  pool.query("INSERT INTO groupement (groupement, zoneId) VALUES ('"+req.groupement+"', "+req.zoneId+")"
  ,(err,result,fields) => {
      if(err) response.json("Création du groupement KO");
      else response.json("Création du groupement OK");
  });
});

//Modifier un groupement
//?idGroupement=1&groupement=test&zoneId=1
app.put("/updateGroupement", middleware,(request, response) => {
  const req=request.query
  pool.query("UPDATE groupement SET zoneId = " + req.zoneId + ", groupement = '"+ req.groupement +"' WHERE id = "+req.idGroupement, (err,data) => {
    if(err) throw err;
    response.json("Mise à jour de l'element OK")
  });
});

app.delete("/deleteGroupement", middleware,(request, response) => {
  const req=request.query
  pool.query("DELETE FROM groupement WHERE id = "+ req.idGroupement, (err,data) => {
    if(err) throw err;
    response.json("Suppression ok")
  });
});
///////////////////////
//  Fin Groupement   //
///////////////////////

/*Ronde*/
//?dateHeure=07/02/2022 08:00&quart=1&userId=1&chefQuartId=1&idUsine=1
app.put("/ronde", (request, response) => {
  const req=request.query;
  pool.query("INSERT INTO ronde (dateHeure, quart, userId, chefQuartId, idUsine) VALUES ('"+req.dateHeure+"', "+req.quart+", "+req.userId+", "+req.chefQuartId+", "+req.idUsine+")"
  ,(err,result,fields) => {
      if(err) response.json("Création de la ronde KO");
      else response.json("Création de la ronde OK");
  });
});

//Cloture des rondes encore en cours Calce pour mode auto
//?idUsine=7
app.put("/clotureRondesCalceAuto",(request,response) => {
  const req=request.query;
  pool.query('UPDATE ronde SET isFinished = 1 WHERE idUsine =' + req.idUsine,(err,data) => {
    if(err) console.log(err);
    response.json("Cloture des rondes auto OK");
  })
})

//?dateHeure=07/02/2022 08:00&quart=1&userId=1&chefQuartId=1&idUsine=1
app.put("/rondeCalce", (request, response) => {
  const req=request.query;
  pool.query("INSERT INTO ronde (dateHeure, quart, userId, chefQuartId, idUsine) VALUES ('"+req.dateHeure+"', "+req.quart+", "+req.userId+", "+req.chefQuartId+", "+req.idUsine+")"
  ,(err,result,fields) => {
      if(err) response.json("Création de la ronde KO");
      else response.json("Création de la ronde OK");
  });
});

//Cloture de la ronde avec ou sans commentaire/anomalie
//?commentaire=ejejejeje&id=1&four1=0&four2=1&four3=1&four4=1
app.put("/closeRonde/:id", (request, response) => {
  const req=request.query
  pool.query("UPDATE ronde SET commentaire = '" + req.commentaire +"', fonctFour1 = '" + req.four1 +"', fonctFour2 = '" + req.four2 +"', fonctFour3 = '" + req.four3 + "' , fonctFour4 = '" + req.four4 + "' , isFinished = 1 WHERE id = "+ req.id, (err,data) => {
    if(err) throw err;
    response.json("Cloture de la ronde OK")
  });
});

//Cloture de la ronde encore en cours
//?id=12
app.put("/closeRondeEnCours", (request, response) => {
  const req=request.query
  pool.query("UPDATE ronde SET isFinished = 1, fonctFour1 = 1, fonctFour2 = 1, fonctFour3 = 1, fonctFour4 = 1 WHERE id = "+ req.id, (err,data) => {
    if(err) throw err;
    response.json("Cloture de la ronde OK")
  });
});



//Récupérer l'auteur d'une ronde
//?date=07/02/2022&idUsine=1
app.get("/AuteurRonde/:quart", (request, response) => {
  const req=request.query
  pool.query("SELECT DISTINCT u.nom, u.prenom FROM ronde r INNER JOIN users u ON r.userId = u.Id WHERE r.idUsine = "+req.idUsine+" AND r.dateHeure LIKE '"+req.date+"%' AND r.quart = "+request.params.quart, (err,data) => {
    if(err) throw err;
    data = data['recordset'];
    response.json({data});
  });
});

//Récupérer l'id de la dernière ronde inséré (ronde en cours)
app.get("/LastRonde/:idUsine", (request, response) => {
  const req=request.query
  pool.query("SELECT TOP 1 Id from ronde WHERE idUsine = "+request.params.idUsine+" ORDER BY Id DESC", (err,data) => {
    if(err) throw err;
    data = data['recordset'];
    if(data[0] != undefined){
      response.json(data[0].Id)
    }
    else {
      response.json(0);
    }
  });
});

//Récupérer l'id de la ronde précédente (0 si première ronde de la BDD)
app.get("/RondePrecedente/:idUsine", (request, response) => {
  const req=request.query
  pool.query("SELECT TOP 2 Id from ronde WHERE idUsine = "+request.params.idUsine+" ORDER BY Id DESC", (err,data) => {
    if(err) throw err;
    data = data['recordset'];
    if(data.length>1){
      response.json(data[1].Id)
    }
    else response.json(0)
  });
});

//Récupérer la ronde encore en cours sur le même quart et la même date => permettre au rondier de la reprendre
//?date=01/01/2023
app.get("/LastRondeOpen/:idUsine/:quart", (request, response) => {
  const req=request.query;
  pool.query("SELECT TOP 1 id from ronde WHERE isFinished = 0 AND idUsine = "+request.params.idUsine+" AND quart = "+request.params.quart+" AND dateHeure = '"+req.date+"' ORDER BY Id DESC", (err,data) => {
    if(err) throw err;
    data = data['recordset'];
    if(data.length < 1){
      response.json(0);
    }
    else response.json(data[0].id);
  });
});

//Récupérer les rondes et leurs infos pour une date donnée
//?date=07/02/2022&idUsine=1
app.get("/Rondes", (request, response) => {
  const req=request.query
  pool.query("SELECT r.Id, r.userId, r.dateHeure, r.quart, r.commentaire, r.isFinished, r.fonctFour1, r.fonctFour2, r.fonctFour3, r.fonctFour4, u.Nom, u.Prenom, uChef.Nom as nomChef, uChef.Prenom as prenomChef FROM ronde r INNER JOIN users u ON u.Id = r.userId INNER JOIN users uChef ON uChef.Id = r.chefQuartId WHERE r.idUsine = "+req.idUsine+" AND r.dateHeure LIKE '"+req.date+"%' ORDER BY r.quart ASC", (err,data) => {
    if(err) throw err;
    data = data['recordset'];
    response.json({data});    
  });
});

//Récupérer les rondes et leurs infos pour une date et un quart donnée
//?date=07/02/2022&idUsine=7&quart=1
app.get("/RondesQuart", (request, response) => {
  const req=request.query
  if(req.quart == 0){
    var query = "SELECT r.Id, r.userId, r.dateHeure, r.quart, r.commentaire, r.isFinished, r.fonctFour1, r.fonctFour2, r.fonctFour3, r.fonctFour4, u.Nom, u.Prenom, uChef.Nom as nomChef, uChef.Prenom as prenomChef FROM ronde r INNER JOIN users u ON u.Id = r.userId INNER JOIN users uChef ON uChef.Id = r.chefQuartId WHERE r.idUsine = "+req.idUsine+" AND r.dateHeure LIKE '"+req.date+"%'"
  }
  else{
    var query = "SELECT r.Id, r.userId, r.dateHeure, r.quart, r.commentaire, r.isFinished, r.fonctFour1, r.fonctFour2, r.fonctFour3, r.fonctFour4, u.Nom, u.Prenom, uChef.Nom as nomChef, uChef.Prenom as prenomChef FROM ronde r INNER JOIN users u ON u.Id = r.userId INNER JOIN users uChef ON uChef.Id = r.chefQuartId WHERE r.idUsine = "+req.idUsine+" AND r.quart = "+req.quart+" AND r.dateHeure LIKE '"+req.date+"%'"
  }
  pool.query(query, (err,data) => {
    if(err) throw err;
    data = data['recordset'];
    response.json({data});    
  });
});


//Récupérer le nombre de rondes cloturées (pour fonctionnement avec équipes)
//?id=1
app.get("/nbRondes", (request, response) => {
  const req=request.query
  pool.query("SELECT nbRondes FROM ronde WHERE Id =" + req.id, (err,data) => {
    if(err) throw err;
    data = data['recordset'];
    if(data.length > 0){
      response.json(data[0].nbRondes);
    }
    else response.json(0);
  });
});

//Incrémenter de 1 le nombre de rondes cloturées (pour fonctionnement avec équipes)
//?id=1
app.put("/updateNbRondes",(request, response) => {
  const req=request.query
  pool.query("UPDATE ronde SET nbRondes = nbRondes + 1 WHERE Id=" +req.id, (err,data) => {
    if(err) throw err;
    response.json("Mise à jour de la valeur OK")
  });
});

//Récupère le nombre de rondes cloturées pour une ronde (pour fonctionnement avec équipes)
//?userId=1
app.get("/nbRondiersEquipe", (request, response) => {
  const req=request.query
  pool.query("SELECT equipe.id FROM equipe JOIN affectation_equipe ON equipe.id = affectation_equipe.idEquipe WHERE idRondier = " + req.userId, (err,data) => {
    if(err) throw err;
    data = data['recordset'];
    if(data.length >0){
      pool.query("SELECT COUNT(*) as nbRondesACloturer FROM equipe JOIN affectation_equipe ON equipe.id = affectation_equipe.idEquipe WHERE affectation_equipe.idZone > 0 AND equipe.id = " + data[0].id, (err,data) => {
        if(err) throw err;
        data = data['recordset'];
        response.json(data[0].nbRondesACloturer);    
      });  
    }
    else response.json(0);
  });
});


//Suppression ronde
//?id=12
app.delete("/deleteRonde", middleware,(request, response) => {
  const req=request.query
  pool.query("DELETE FROM ronde WHERE id = "+ req.id, (err,data) => {
    if(err) throw err;
    response.json("Suppression de la ronde OK")
  });
});

/*Mesures Rondier*/
//?elementId=1&modeRegulateur=AP&value=2.4&rondeId=1
app.put("/mesureRondier", (request, response) => {
  const req=request.query
  pool.query("INSERT INTO mesuresrondier (elementId, modeRegulateur, value, rondeId) VALUES ("+req.elementId+", '"+req.modeRegulateur+"', '"+req.value+"', "+req.rondeId+")"
  ,(err,result,fields) => {
      if(err) response.json("Création de la mesure KO");
      else response.json("Création de la mesure OK");
  });
});

//Update valeur de l'élement de contrôle
//?id=12&value=dhdhhd
app.put("/updateMesureRonde", middleware,(request, response) => {
  const req=request.query
  pool.query("UPDATE mesuresrondier SET value = '"+req.value+"' WHERE id = "+ req.id, (err,data) => {
    if(err) throw err;
    response.json("Mise à jour de la valeur OK")
  });
});

//Récupérer l'ensemble des mesures pour une ronde => reporting
app.get("/reportingRonde/:idRonde", middleware,(request, response) => {
  const req=request.query
  pool.query("SELECT e.Id as elementId, e.unit, e.typeChamp, e.valeurMin, e.valeurMax, e.defaultValue, m.Id, m.value, e.nom, m.modeRegulateur, z.nom as nomZone, r.Id as rondeId FROM mesuresrondier m INNER JOIN elementcontrole e ON m.elementId = e.Id INNER JOIN ronde r ON r.Id = m.rondeId INNER JOIN zonecontrole z ON z.Id = e.zoneId WHERE r.Id = "+request.params.idRonde+" ORDER BY z.nom ASC", (err,data) => {
    if(err) throw err;
    data = data['recordset'];
    response.json({data});
  });
});

//Récupérer la valeur pour un élément de contrôle et une date (dernière valeur enregistrée sur la journée)
//?id=111&date=dhdhdh
app.get("/valueElementDay", async (request, response) =>  {
  const req=request.query
  pool.query("SELECT m.value FROM mesuresrondier m INNER JOIN ronde r ON m.rondeId = r.Id WHERE r.quart = 3 AND r.dateHeure = '"+req.date+"' AND m.elementId = "+req.id, async (err,data) => {
    if(err) throw err;
    valueElementDay = data['recordset'];
    data = data['recordset'];
    if(valueElementDay.length == 0){
      await valueElementDayAprem(req.date, req.id);
      data = valueElementDay
      response.json({data});
    }
    else response.json({data});
  });
});

//fonction pour récupérer la valeur de la ronde de l'après-midi
async function valueElementDayAprem(date, id){
  return new Promise((resolve) => {
    pool.query("SELECT m.value FROM mesuresrondier m INNER JOIN ronde r ON m.rondeId = r.Id WHERE r.quart = 2 AND r.dateHeure = '"+date+"' AND m.elementId = "+id, async (err,data) => {
      if(err) throw err;
      valueElementDay = data['recordset'];
      if(valueElementDay.length == 0){
        await valueElementDayMatin(date, id);
      }
      resolve()
    });
    
  });
}

//fonction pour récupérer la valeur de la ronde du matin
async function valueElementDayMatin(date, id){
  return new Promise((resolve) => {
    pool.query("SELECT m.value FROM mesuresrondier m INNER JOIN ronde r ON m.rondeId = r.Id WHERE r.quart = 1 AND r.dateHeure = '"+date+"' AND m.elementId = "+id, async (err,data) => {
      if(err) throw err;
      valueElementDay = data['recordset'];
      resolve()
    }); 
  });
}

/*Permis de feu et zone de consignation*/
//?dateHeureDeb=dggd&dateHeureFin=fff&badgeId=1&zone=zone&isPermisFeu=1&numero=fnjfjfj
app.put("/PermisFeu", middleware,(request, response) => {
  const req=request.query
  pool.query("INSERT INTO permisfeu (dateHeureDeb, dateHeureFin, badgeId, zone, isPermisFeu, numero) VALUES ('"+req.dateHeureDeb+"', '"+req.dateHeureFin+"', "+req.badgeId+", '"+req.zone+"', "+req.isPermisFeu+", '"+req.numero+"')"
  ,(err,result,fields) => {
      if(err) response.json("Création du permis de feu KO");
      else response.json("Création du permis de feu OK");
  });
})

//Récupérer les permis de feu en cours ou les zones de consignation
app.get("/PermisFeu/:idUsine", (request, response) => {
  const req=request.query
  pool.query("SELECT p.Id, CONCAT(CONVERT(varchar,CAST(p.dateHeureDeb as datetime2), 103),' ',CONVERT(varchar,CAST(p.dateHeureDeb as datetime2), 108)) as dateHeureDeb, CONCAT(CONVERT(varchar,CAST(p.dateHeureFin as datetime2), 103),' ',CONVERT(varchar,CAST(p.dateHeureFin as datetime2), 108)) as dateHeureFin, b.uid as badge, p.badgeId, p.isPermisFeu, p.zone, p.numero FROM permisfeu p INNER JOIN badge b ON b.Id = p.badgeId WHERE b.idUsine = "+request.params.idUsine+" AND p.dateHeureDeb <= convert(varchar, getdate(), 120) AND p.dateHeureFin > convert(varchar, getdate(), 120)", (err,data) => {
    if(err) throw err;
    data = data['recordset'];
    response.json({data});
  });
});


//Enregistrer une validation de permis de feu
//?dateHeure=dggd&permisFeuId=1&userId=1&quart=1&rondeId=1
app.put("/VerifPermisFeu", (request, response) => {
  const req=request.query
  pool.query("INSERT INTO permisfeuvalidation (permisFeuId, userId, dateHeure, quart, rondeId) VALUES ("+req.permisFeuId+", "+req.userId+", '"+req.dateHeure+"', "+req.quart+", "+req.rondeId+")"
  ,(err,result,fields) => {
      if(err) response.json("Validation du permis de feu KO");
      else response.json("Validation du permis de feu OK");
  });
})

//Récupérer les validation pour une date donnée
//?dateHeure=22/06/2022&idUsine=1
app.get("/PermisFeuVerification",middleware, (request, response) => {
  const req=request.query
  pool.query("SELECT pf.numero, pf.zone, p.rondeId, p.dateHeure, p.userId , p.permisFeuId, p.quart FROM permisfeuvalidation p INNER JOIN permisfeu pf ON pf.Id = p.permisFeuId INNER JOIN badge b ON pf.badgeId = b.Id WHERE b.idUsine = "+req.idUsine+" AND p.dateHeure LIKE '%"+req.dateHeure+"%'", (err,data) => {
    if(err) throw err;
    data = data['recordset'];
    response.json({data});
  });
});


/*Mode opératoire*/
//?nom=dggd&zoneId=1
//passage du fichier dans un formData portant le nom 'fichier'
app.post("/modeOP", multer({storage: storage}).single('fichier'), (request, response) => {
  const req=request.query;
  //création de l'url de stockage du fichier
  //const url = `${request.protocol}://${request.get('host')}/fichiers/${request.file.filename.replace("[^a-zA-Z0-9]", "")}`;
  //on utilise l'url publique
  const url = `${request.protocol}://capexploitation.paprec.com/capexploitation/fichiers/${request.file.filename.replace("[^a-zA-Z0-9]", "")}`;

  var query = "INSERT INTO modeoperatoire (nom, fichier, zoneId) VALUES ('"+req.nom+"', '"+url+"', "+req.zoneId+")";
  pool.query(query,(err,result,fields) => {
      if(err) {
        response.json("Création du modeOP KO");
      }
      else response.json("Création du modeOP OK");
  });
});

//DELETE modeOP
//?nom=test.pdf
app.delete("/modeOP/:id", middleware,(request, response) => {
  const req=request.query

  //On supprime le fichier du storage multer avant de supprimer le mode OP en BDD
  fs.unlink(`fichiers/${req.nom}`, () => {
    //Suppression en BDD du mode OP
    pool.query("DELETE FROM modeoperatoire WHERE Id = "+request.params.id, (err,data) => {
      if(err) throw err;
      response.json("Suppression du modeOP OK")
    });
  });
});

//Récupérer l'ensemble des modeOP
app.get("/modeOPs/:idUsine", middleware,(request, response) => {
  const req=request.query
  pool.query("SELECT m.Id, m.nom, m.fichier, z.nom as nomZone FROM modeoperatoire m INNER JOIN zonecontrole z ON z.Id = m.zoneId WHERE z.idUsine = "+request.params.idUsine, (err,data) => {
    if(err) throw err;
    data = data['recordset'];
    response.json({data});
  });
});

//Récupérer les modeOP associé à une zone
app.get("/modeOPofZone/:zoneId", (request, response) => {
  const req=request.query
  pool.query("SELECT * FROM modeoperatoire WHERE zoneId="+request.params.zoneId, (err,data) => {
    if(err) throw err;
    data = data['recordset'];
    response.json({data});
  });
});

//Update du fichier du modeOP
//?fichier=modeOP1
app.put("/modeOP/:id", middleware,(request, response) => {
  const req=request.query
  pool.query("UPDATE modeoperatoire SET fichier = " + req.fichier + " WHERE Id = "+request.params.id, (err,data) => {
    if(err) throw err;
    response.json("Mise à jour du modeOP OK")
  });
});


/*Consignes*/
//?commentaire=dggd&dateDebut=fff&c=fff&type=1&idUsine=1
app.put("/consigne", multer({storage: storage}).single('fichier'),(request, response) => {
  const req=request.query
  if(request.file != undefined){
    url = `${request.protocol}://capexploitation.paprec.com/capexploitation/fichiers/${request.file.filename.replace("[^a-zA-Z0-9]", "")}`;
    requete = "INSERT INTO consigne (titre,commentaire, date_heure_debut, date_heure_fin, type, idUsine, url) OUTPUT INSERTED.Id VALUES ('"+req.titre+"','"+req.commentaire+"', '"+req.dateDebut+"', '"+req.dateFin+"', "+req.type+", "+req.idUsine+",'"+url+"')"
  }
  else requete = "INSERT INTO consigne (titre,commentaire, date_heure_debut, date_heure_fin, type, idUsine) OUTPUT INSERTED.Id VALUES ('"+req.titre+"','"+req.commentaire+"', '"+req.dateDebut+"', '"+req.dateFin+"', "+req.type+", "+req.idUsine+")"
  pool.query(requete
  ,(err,data) => {
    if(err) throw err;
    data = data['recordset'];
    response.json({data});
  });
});

//mettre a jour une consigne
//?commentaire=dggd&dateDebut=fff&c=fff&type=1&id=1
app.put("/updateConsigne", middleware,(request, response) => {
  const req=request.query
  pool.query("UPDATE consigne SET titre = '"+req.titre+"', commentaire ='"+req.commentaire+"', date_heure_debut = '"+req.dateDebut+"', date_heure_fin ='"+req.dateFin+"', type="+req.type+" where id = "+req.id
  ,(err,result,fields) => {
      if(err) response.json("Modification de la consigne KO");
      else response.json("Modification de la consigne OK");
  });
});

//Récupérer les consignes en cours
app.get("/consignes/:idUsine", (request, response) => {
  const req=request.query
  pool.query("SELECT titre, CONCAT(CONVERT(varchar,CAST(date_heure_debut as datetime2), 103),' ',CONVERT(varchar,CAST(date_heure_debut as datetime2), 108)) as dateHeureDebut, CONCAT(CONVERT(varchar,CAST(date_heure_fin as datetime2), 103),' ',CONVERT(varchar,CAST(date_heure_fin as datetime2), 108)) as dateHeureFin, commentaire, id, type FROM consigne WHERE isActive = 1 and idUsine = "+request.params.idUsine+" AND date_heure_debut <= convert(varchar, getdate(), 120) AND date_heure_fin >= convert(varchar, getdate(), 120)", (err,data) => {
    if(err) throw err;
    data = data['recordset'];
    response.json({data});
  });
});

//Récupérer toutes les consignes
app.get("/allConsignes/:idUsine", (request, response) => {
  const req=request.query
  pool.query("SELECT titre, CONCAT(CONVERT(varchar,CAST(date_heure_debut as datetime2), 103),' ',CONVERT(varchar,CAST(date_heure_debut as datetime2), 108)) as dateHeureDebut, CONCAT(CONVERT(varchar,CAST(date_heure_fin as datetime2), 103),' ',CONVERT(varchar,CAST(date_heure_fin as datetime2), 108)) as dateHeureFin, commentaire, id, url, type FROM consigne WHERE isActive = 1 and idUsine = "+request.params.idUsine, (err,data) => {
    if(err) throw err;
    data = data['recordset'];
    response.json({data});
  });
});

//Récupérer toutes les consignes
app.get("/getConsignesEntreDeuxDates", (request, response) => {
  const req=request.query
  pool.query("SELECT titre, 'Consigne' as 'typeDonnee',  CONCAT(CONVERT(varchar,CAST(date_heure_debut as datetime2), 103),' ',CONVERT(varchar,CAST(date_heure_debut as datetime2), 108)) as date_heure_debut, CONCAT(CONVERT(varchar,CAST(date_heure_fin as datetime2), 103),' ',CONVERT(varchar,CAST(date_heure_fin as datetime2), 108)) as date_heure_fin, commentaire as 'nom', id, type FROM consigne where  date_heure_debut < '"+req.dateFin+"' and date_heure_fin > '"+req.dateDeb+"' and isActive = 1 and commentaire like '%"+req.titre+"%' and idUsine = "+req.idUsine
  , (err,data) => {
    if(err) throw err;
    data = data['recordset'];
    response.json({data});
  });
});

//DELETE consigne
app.put("/consigne/:id",middleware, (request, response) => {
  const req=request.query
  pool.query("update consigne set isActive = 0 WHERE id = "+request.params.id, (err,data) => {
    if(err) throw err;
    response.json("Suppression de la consigne OK")
  });
});

/*Anomalie*/
//?rondeId=1&zoneId=2&commentaire=dggd
//passage de la photo dans un formData portant le nom 'fichier'
app.put("/anomalie", multer({storage: storage}).single('fichier'),(request, response) => {
  const req=request.query;
  //création de l'url de stockage du fichier
  const url = `${request.protocol}://${request.get('host')}/fichiers/${request.file.filename}`;

  var query = "INSERT INTO anomalie (rondeId, zoneId, commentaire, photo) VALUES ("+req.rondeId+", "+req.zoneId+", '"+req.commentaire+"', '"+url+"')";
  pool.query(query,(err,result,fields) => {
      if(err) {
        response.json("Création de l'anomalie KO");
      }
      else response.json("Création de l'anomalie OK");
  });
});

//TODO : inner join avec Ronde ??? Zone ???
//Récupérer les anomalies d'une ronde
app.get("/anomalies/:id",(request, response) => {
  const req=request.query
  pool.query("SELECT * FROM anomalie WHERE rondeId = "+request.params.id, (err,data) => {
    if(err) throw err;
    data = data['recordset'];
    response.json({data});
  });
});

//Récupérer les anomalies d'une usine entre deux dates
//?idUsine=7?detaDeb=01/01/2023&dateFin=01/09/2023
app.get("/anomaliesEntreDeuxDates",(request, response) => {
  const req=request.query
  const [day,month, year]= req.dateDeb.split('/') 
  var dateDeDebut = `${year}-${month}-${day}`

  const [day2,month2, year2]= req.dateFin.split('/') 
  var dateDeFin = `${year2}-${month2}-${day2}`
  pool.query("select a.*, r.dateHeure, r.quart from anomalie a join ronde r on r.Id = a.rondeId where r.IdUsine = " + req.idUsine +" and (convert(datetime, r.dateHeure, 103)) BETWEEN '"+ dateDeDebut +"' and '"+ dateDeFin +"'"
    , (err,data) => {
    if(err) throw err;
    data = data['recordset'];
    response.json({data});
  });
});

//UpdateAnomalie
//?rondeId=12&zoneId=5&commentaire=test
app.put("/updateAnomalie", (request, response) => {
  const req=request.query
  pool.query("UPDATE anomalie SET commentaire = '" + req.commentaire + "' WHERE rondeId ="+ req.rondeId +" AND zoneId =" + req.zoneId, (err,data) => {
    if(err) throw err;
    response.json("OK")
  });
});

//UpdateAnomalie
//?rondeId=1&zoneId=12&commentaire=test
app.put("/createAnomalie", (request, response) => {
  const req=request.query
  pool.query("INSERT INTO anomalie(rondeId, zoneId, commentaire) VALUES ("+ req.rondeId + "," + req.zoneId + ",'" + req.commentaire +"')", (err,data) => {
    if(err) throw err;
    response.json("OK")
  });
});


//////////////////////////
//       EQUIPE         //
//////////////////////////


//Créer une nouvelle équipe
//?nomEquipe=test&quart=1&idChefQuart=1
app.put("/equipe",middleware, (request, response) => {
  const req = request.query
  const nomEquipe = req.nomEquipe.replace(/'/g, "''");
  pool.query("INSERT INTO equipe(equipe,quart,idChefQuart,date) OUTPUT INSERTED.Id VALUES('"+nomEquipe+"',"+req.quart+","+req.idChefQuart+",'"+req.date+"')", (err,data) => {
    if(err) throw err;
    data = data['recordset'];
    response.json({data});
  });
});

//Créer les nouveau rondier d'une équipe
//?nomEquipe=test&quart=1&idChefQuart=1
app.put("/affectationEquipe",middleware, (request, response) => {
  const req = request.query
  pool.query("INSERT INTO affectation_equipe(idRondier,idEquipe,idZone,poste) VALUES("+req.idRondier+","+req.idEquipe+","+req.idZone+",'"+req.poste+"')", (err,data) => {
    if(err) throw err;
    response.json("Ajout ok");
  });
});

//Récupérer les utilisateurs rondier qui ne sont pas affecter à une équipe
//?idUsine=1
app.get("/usersRondierSansEquipe", middleware,(request, response) => {
  const req=request.query
  //pool.query("SELECT * from users where isRondier = 1 and idUsine = " + req.idUsine + "and Id NOT IN (SELECT idRondier from affectation_equipe) ORDER BY Nom", (err,data) => {
  pool.query("SELECT * from users where isRondier = 1 and idUsine = " + req.idUsine + " ORDER BY Nom", (err,data) => {
  if(err) throw err;
    data = data['recordset'];
    response.json({data});
  });
});

//Récupérer les équipes d'une usine
//?idUsine=1
app.get("/equipes", middleware,async (request, response) => {
  const req=request.query
  pool.query("SELECT equipe.id, equipe.quart, equipe.equipe, users.Nom, users.Prenom, users.idUsine from equipe JOIN users ON users.Id = equipe.idChefQuart WHERE users.idUsine =" + req.idUsine + " order by equipe.quart asc",
    async (err, data) => {
      if (err)
        throw err;
      data = data['recordset'];
      for await (const equipe of data) {
        await getUsersEquipe(equipe);
      };
      response.json({tabEquipes});
      tabEquipes= [];
    });
});

function getUsersEquipe(equipe) {
  return new Promise((resolve) => {
    //Récupération des users d'une équipe
    pool.query("SELECT u.Nom, u.Prenom, z.nom as nomZone, a.poste FROM affectation_equipe a JOIN users u ON u.Id = a.idRondier LEFT OUTER JOIN zonecontrole z on z.Id = a.idZone WHERE a.idEquipe = " + equipe.id, (err, data) => {
      if (err)
        throw err;
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
app.get("/getOneEquipe", middleware,(request, response) => {
  const req=request.query
  pool.query("SELECT idRondier, zonecontrole.Id as 'idZone',equipe.id, equipe.equipe, equipe.quart, zonecontrole.nom as 'zone', poste, users.Nom as 'nomRondier', users.Prenom as 'prenomRondier' , chefQuart.Nom as 'nomChefQuart' , chefQuart.Prenom as 'prenomChefQuart' FROM equipe FULL OUTER JOIN affectation_equipe ON equipe.Id = affectation_equipe.idEquipe FULL OUTER JOIN users ON users.Id = affectation_equipe.idRondier JOIN users as chefQuart ON chefQuart.Id = equipe.idChefQuart LEFT OUTER JOIN zonecontrole ON zonecontrole.Id = idZone WHERE equipe.id ="+req.idEquipe, (err,data) => {
    if(err) throw err;
    data = data['recordset'];
    response.json({data});
  });
});

//Mise à jour des information d'une équipe
//?nomEquipe=test&quart=1&idEquipe=1
app.put("/updateEquipe",middleware, (request, response) => {
  const req = request.query
  pool.query("update equipe set equipe = '"+req.nomEquipe +"', quart = "+req.quart+" , idChefQuart = "+ req.idChefQuart  +"where id = "+req.idEquipe, (err,data) => {
    if(err) throw err;
    response.json("Update ok");
  });
});

//DELETE equipe
app.delete("/deleteEquipe/:idEquipe", middleware,(request, response) => {
  const req=request.query
  pool.query("DELETE FROM equipe WHERE id = "+request.params.idEquipe, (err,data) => {
    if(err) throw err;
    response.json("Suppression des Rondiers OK")
  });
});

//DELETE affectation_equipe
app.delete("/deleteAffectationEquipe/:idEquipe", middleware,(request, response) => {
  const req=request.query
  pool.query("DELETE FROM affectation_equipe WHERE idEquipe = "+request.params.idEquipe, (err,data) => {
    if(err) throw err;
    response.json("Suppression des Rondiers OK")
  });
});

//Récupérer l'équipe d'un utilisateur POUR RONDIER
//?idRondier
app.get("/getEquipeUser", (request, response) => {
  const req=request.query
  pool.query("SELECT u.idRondier, e.quart, e.idChefQuart FROM affectation_equipe u JOIN equipe e on u.idEquipe = e.id WHERE u.idRondier =" +req.idRondier, (err,data) => {
    if(err) throw err;
    data = data['recordset'];
    response.json({data});
  });
});

//Récupérer l'équipe d'un utilisateur POUR RONDIER
//?idRondier=1&quart=1
app.get("/getEquipeUserCahierQuart", (request, response) => {
  const req=request.query
  pool.query("SELECT u.idRondier, e.quart, e.idChefQuart FROM affectation_equipe u JOIN equipe e on u.idEquipe = e.id WHERE u.idRondier =" +req.idRondier + " and e.quart = " + req.quart, (err,data) => {
    if(err) throw err;
    data = data['recordset'];
    response.json({data});
  });
});


//Récupérer l'équipe d'un quart d'une usine
//?idUsine=7&quart=1?date=2024-01-01
app.get("/getEquipeQuart", (request, response) => {
  const req=request.query
  pool.query("SELECT e.id from equipe e join affectation_equipe a ON a.idEquipe = e.id JOIN users u ON u.id = a.idRondier where u.idUsine =" + req.idUsine +" and e.quart =" + req.quart +"and e.date='"+req.date+"'", (err,data) => {
    if(err) {
      console.log(err);
      response.json("erreur");
    }
    else {
      data = data['recordset'];
      response.json({data});
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
app.put("/enregistrementEquipe",middleware, (request, response) => {
  const req = request.query
  pool.query("INSERT INTO enregistrement_equipe(equipe) OUTPUT INSERTED.Id VALUES('"+req.nomEquipe+"')", (err,data) => {
    if(err) throw err;
    data = data['recordset'];
    response.json({data});
  });
});

//DELETE enregistrement_affectation_equipe
app.delete("/deleteEnregistrementAffectationEquipe/:idEquipe", middleware,(request, response) => {
  const req=request.query
  pool.query("DELETE FROM enregistrement_affectation_equipe WHERE idEquipe = "+request.params.idEquipe, (err,data) => {
    if(err) throw err;
    response.json("Suppression des Rondiers OK")
  });
});


//DELETE enregistremen_equipe
app.delete("/deleteEnregistrementEquipe/:idEquipe", middleware,(request, response) => {
  const req=request.query
  pool.query("DELETE FROM enregistrement_equipe WHERE id = "+request.params.idEquipe, (err,data) => {
    if(err) throw err;
    response.json("Suppression des Rondiers OK")
  });
});


//Mise à jour des information d'un enregistrement d'équipe
//?nomEquipe=test&idEquipe=1
app.put("/updateEnregistrementEquipe",middleware, (request, response) => {
  const req = request.query
  pool.query("update enregistrement_equipe set equipe = '"+req.nomEquipe+"' where id = "+req.idEquipe, (err,data) => {
    if(err) throw err;
    response.json("Update ok");
  });
});

//Récupérer une seule équipe enregistrée
//idEquipe=28
app.get("/getOneEnregistrementEquipe", middleware,(request, response) => {
  const req=request.query
  pool.query("SELECT idRondier, enregistrement_equipe.id, enregistrement_equipe.equipe, users.Nom as 'nomRondier', users.Prenom as 'prenomRondier' FROM enregistrement_equipe FULL OUTER JOIN enregistrement_affectation_equipe ON enregistrement_equipe.Id = enregistrement_affectation_equipe.idEquipe FULL OUTER JOIN users ON users.Id = enregistrement_affectation_equipe.idRondier WHERE enregistrement_equipe.id ="+req.idEquipe, (err,data) => {
    if(err) throw err;
    data = data['recordset'];
    response.json({data});
  });
});

//Récupérer les nom des équipes enregistrée et leurs id
//?idUsine=1
app.get("/getNomsEquipesEnregistrees", middleware,(request, response) => {
  const req=request.query
  pool.query("SELECT distinct enregistrement_equipe.id, enregistrement_equipe.equipe FROM enregistrement_equipe FULL OUTER JOIN enregistrement_affectation_equipe ON enregistrement_equipe.Id = enregistrement_affectation_equipe.idEquipe FULL OUTER JOIN users ON users.Id = enregistrement_affectation_equipe.idRondier WHERE users.idUsine =" +req.idUsine, (err,data) => {
    if(err) throw err;
    data = data['recordset'];
    response.json({data});
  });
});

//Récupérer les équipes enregistrées d'une usine
//?idUsine=1
app.get("/getEquipesEnregistrees", middleware,async (request, response) => {
  const req=request.query
  pool.query("SELECT distinct e.id, e.equipe from enregistrement_equipe e JOIN enregistrement_affectation_equipe a ON a.idEquipe = e.id JOIN users u on u.Id = a.idRondier WHERE u.idUsine =" + req.idUsine ,
    async (err, data) => {
      if (err)
        throw err;
      data = data['recordset'];
      for await (const equipe of data) {
        await getUsersEnregistrementEquipe(equipe);
      };
      response.json({tabEnregistrementEquipes});
      tabEnregistrementEquipes= [];
    });
});

function getUsersEnregistrementEquipe(equipe) {
  return new Promise((resolve) => {
    //Récupération des users d'une équipe
    pool.query("SELECT u.Nom, u.Prenom FROM enregistrement_affectation_equipe a JOIN users u ON u.Id = a.idRondier WHERE a.idEquipe = " + equipe.id, (err, data) => {
      if (err)
        throw err;
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
app.put("/enregistrementAffectationEquipe",middleware, (request, response) => {
  const req = request.query
  pool.query("INSERT INTO enregistrement_affectation_equipe(idRondier,idEquipe) VALUES("+req.idRondier+","+req.idEquipe+")", (err,data) => {
    if(err) throw err;
    response.json("Ajout ok");
  });
});



//*********************
/*******FIN RONDIER****/
//*********************



/*
******* SITES
*/

//Récupérer la liste des sites (pour choisir pour l'administration du superAdmin)
//sauf le global
app.get("/sites", middleware,(request, response) => {
  const req=request.query
  pool.query("SELECT * FROM site WHERE codeUsine NOT LIKE '000' ORDER BY localisation ASC", (err,data) => {
    if(err) throw err;
    data = data['recordset'];
    response.json({data});
  });
});

//Récupérer la liste des sites avec une ip Aveva
//sauf le global
app.get("/sitesAveva", middleware,(request, response) => {
  const req=request.query
  pool.query("SELECT * FROM site WHERE codeUsine NOT LIKE '000' and ipAveva !='' ORDER BY localisation ASC", (err,data) => {
    if(err) throw err;
    data = data['recordset'];
    response.json({data});
  });
});


//Récupérer le nombre de ligne d'un site
app.get("/nbLigne/:id", middleware,(request, response) => {
  const req=request.query
  pool.query("SELECT nbLigne FROM site WHERE id ="+request.params.id, (err,data) => {
    if(err) throw err;
    data = data['recordset'];
    response.json({data});
  });
});


//Récupérer le nombre de ligne d'un site avec une réponse au format chiffre
app.get("/nbLigneChiffre/:id",(request, response) => {
  const req=request.query
  pool.query("SELECT nbLigne FROM site WHERE id ="+request.params.id, (err,data) => {
    if(err) throw err;
    data = data['recordset'];
    if(data.length>0){
      response.json(data[0].nbLigne)
    }
    else response.json(0)
  });
});

//Récupérer le nombre de GTA d'un site
app.get("/nbGTA/:id", middleware,(request, response) => {
  const req=request.query
  pool.query("SELECT nbGTA FROM site WHERE id ="+request.params.id, (err,data) => {
    if(err) throw err;
    data = data['recordset'];
    response.json({data});
  });
});

//Récupérer le nombre de RCU d'un site
app.get("/nbRCU/:id", middleware,(request, response) => {
  const req=request.query
  pool.query("SELECT nbReseauChaleur FROM site WHERE id ="+request.params.id, (err,data) => {
    if(err) throw err;
    data = data['recordset'];
    response.json({data});
  });
});

//Récupérer le type d'import pour les pesées d'un site
app.get("/typeImport/:id",middleware, (request, response) => {
  const req=request.query
  pool.query("SELECT typeImport FROM site WHERE id ="+request.params.id, (err,data) => {
    if(err) throw err;
    data = data['recordset'];
    response.json({data});
  });
});


//Récupérer le type de l'aapli rondier d'un site avec une réponse au format string
app.get("/typeRondier/:id",(request, response) => {
  const req=request.params
  pool.query("SELECT typeRondier FROM site WHERE id = "+req.id, (err,data) => {
    if(err) throw err;
    data = data['recordset'];
    if(data.length>0){
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
app.get("/rapports/:id",middleware, (request, response) => {
  const req=request.query
  pool.query("SELECT * FROM rapport WHERE idUsine="+request.params.id, (err,data) => {
    if(err) throw err;
    data = data['recordset'];
    response.json({data});
  });
});


/*
******* FIN RAPPORTS
*/


//////////////////////////
//eMonitoring
//////////////////////////

//Get products without TAGs
app.get("/ProductWithoutTag/:id", middleware,(request, response) => {
  const req=request.query
  pool.query("SELECT * FROM products_new WHERE (TAG IS NULL OR TAG = '/') AND idUsine = " +request.params.id+ " ORDER BY Name ASC", (err,data) => {
    if(err) throw err;
    data = data['recordset'];
    response.json({data}) 
  });
});


//Get products avec un TAG EVELER
app.get("/ProductEveler", middleware, (request, response) => {
  const req=request.query
  pool.query("SELECT * FROM products_new WHERE TAG LIKE 'EVELER%'", (err,data) => {
    if(err) throw err;
    data = data['recordset'];
    response.json({data}) 
  });
});

//UPDATE Product, set TAG
//?TAG=123
app.put("/productTAG/:id", middleware,(request, response) => {
  const req=request.query
  pool.query("UPDATE products_new SET TAG = '" + req.TAG + "', LastModifiedDate = convert(varchar, getdate(), 120), idElementRondier = null WHERE Id = "+request.params.id, (err,data) => {
    if(err) throw err;
    response.json("Mise à jour du TAG OK")
  });
});

//UPDATE Product, set TAG
//?id=1&idElementRondier=123
app.put("/productElementRondier", middleware,(request, response) => {
  const req=request.query
  var idElem;
  if(req.idElementRondier == 0) idElem = null 
  else idElem = req.idElementRondier
  pool.query("UPDATE products_new SET TAG = '', LastModifiedDate = convert(varchar, getdate(), 120), idElementRondier = " + idElem + " WHERE Id = "+req.id, (err,data) => {
    if(err) throw err;
    response.json("Mise à jour du TAG OK")
  });
});

//UPDATE Product, set Code
//?CodeEquipement=123
app.put("/productCodeEquipement/:id",middleware, (request, response) => {
  const req=request.query
  pool.query("UPDATE products_new SET CodeEquipement = '" + req.CodeEquipement + "', LastModifiedDate = convert(varchar, getdate(), 120) WHERE Id = "+request.params.id, (err,data) => {
    if(err) throw err;
    response.json("Mise à jour du Code OK")
  });
});

//UPDATE Product, set Code
//?CodeEquipement=123
app.put("/productCodeEquipement/:id",middleware, (request, response) => {
  const req=request.query
  pool.query("UPDATE products_new SET CodeEquipement = '" + req.CodeEquipement + "', LastModifiedDate = convert(varchar, getdate(), 120) WHERE Id = "+request.params.id, (err,data) => {
    if(err) throw err;
    response.json("Mise à jour du Code OK")
  });
});

//UPDATE Product, set Code
//?CodeEquipement=123
app.put("/productUpdateCoeff/:id",middleware, (request, response) => {
  const req=request.query
  pool.query("UPDATE products_new SET Coefficient = '" + req.coeff + "', LastModifiedDate = convert(varchar, getdate(), 120) WHERE Id = "+request.params.id, (err,data) => {
    if(err) throw err;
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
  const req=request.query
  pool.query("SELECT FORMAT(dateHeureDebut, 'dd/MM/yyyy HH:mm:ss') as dateHeureDebut, FORMAT(dateHeureFin, 'dd/MM/yyyy HH:mm:ss') as dateHeureFin FROM maintenance WHERE getDate() < dateHeureDebut", (err,data) => {
    if(err) throw err;
    data = data['recordset'];
    if(data.length>0){
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
app.put("/accesToken", middleware,(request, response) => {
  //On passe un objet aléatoire pour générer un token aléatoirement
  const token =  jwt.sign({token :"ffrezqskz7f" }, process.env.ACESS_TOKEN_SECRET);
  const req=request.query
  pool.query("INSERT INTO token(token,affectation) VALUES ('Bearer " + token + "', '" + req.affectation + "')", (err,data) => {
    if(err) throw err;
    response.json(token);
  });
});

//Requête permettant de récupérer les tokens actifs générés manuellement.
app.get("/allAccesTokens", middleware,(request, response) => {
  pool.query("SELECT * FROM token where Enabled = 1", (err,data) => {
    if(err) throw err;
    data = data['recordset'];
    response.json({data}) 
  });
});

//Requête permettant de désactiver un token 
//?id=5
app.put("/desactivateToken", middleware,(request, response) => {
  const req=request.query
  pool.query("UPDATE token SET Enabled = 0 WHERE Id = "+req.id, (err,data) => {
    if(err) throw err;
    response.json("Suppression du token OK")
  });
});

//Requête permettant de modifier la personne affectée à un token
//?id=5&affectation=tesst
app.put("/updateToken", middleware,(request, response) => {
  const req=request.query
  pool.query("UPDATE token SET affectation = '" + req.affectation +"' WHERE Id = "+req.id, (err,data) => {
    if(err) throw err;
    response.json("Mise à jour OK")
  });
});

//Requête permettant de récupérer tout les tokens non autorisés
app.get("/unauthorizedTokens",
(request, response) => {
  pool.query("SELECT token FROM token where Enabled = 0", (err,data) => {
    if(err) throw err;
    data = data['recordset'];
    response.json({data}) 
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
app.get("/getMoralEntitiesAndCorrespondance",middleware,(request, response) => {
  const req=request.query
  pool.query("SELECT mr.Id, mr.CreateDate, mr.LastModifiedDate, mr.Name, mr.Address, mr.Enabled, mr.Code, mr.UnitPrice, p.Id as productId, mr.numCAP, mr.codeDechet, mr.nomClient, mr.prenomClient, mr.mailClient, LEFT(p.Name,CHARINDEX(' ',p.Name)) as produit, SUBSTRING(p.Name,CHARINDEX(' ',p.Name),500000) as collecteur, i.nomImport, i.productImport FROM moralentities_new as mr "+ 
  "INNER JOIN products_new as p ON LEFT(p.Code,5) LIKE LEFT(mr.Code,5) AND p.idUsine = mr.idUsine "+
  "FULL OUTER JOIN import_tonnage i ON i.ProducerId = mr.Id "+
  "WHERE mr.idUsine = "+req.idUsine+" AND p.Code = LEFT(mr.Code,LEN(p.Code)) AND mr.Enabled = 1 AND mr.Code LIKE '" + req.Code + "%' ORDER BY mr.Name ASC", (err,data) => {
    if(err) throw err;
    data = data['recordset'];
    response.json({data}) 
  });
});

//Requête permettant de récupérer les moral entities d'une usine sans correspondance
//?idUsine=1
app.get("/getSortantsAndCorrespondance",middleware,(request, response) => {
  const req=request.query
  pool.query("SELECT * FROM products_new p JOIN import_tonnageSortants i ON i.ProductId = p.Id WHERE p.typeId = 5 and p.idUsine = " +req.idUsine + "and p.Code LIKE '" +req.Code +"%'"
  , (err,data) => {
    if(err) throw err;
    data = data['recordset'];
    response.json({data}) 
  });
});

//Requête permettant de récupérer les moral entities d'une usine sans correspondance
//?idUsine=1
app.get("/getReactifsAndCorrespondance",middleware,(request, response) => {
  const req=request.query
  pool.query("SELECT * FROM products_new p JOIN import_tonnageReactifs i ON i.ProductId = p.Id WHERE p.idUsine = " +req.idUsine 
  , (err,data) => {
    if(err) throw err;
    data = data['recordset'];
    response.json({data}) 
  });
});




//?ProductId=5&ProducerId=1&nomImport=test&idUsine=7
app.put("/import_tonnage",middleware,(request, response) => {
  const req=request.query
  pool.query("INSERT INTO import_tonnage (ProductId, ProducerId,idUsine, nomImport, productImport) VALUES ("+req.ProductId+","+req.ProducerId+","+req.idUsine+",'"+req.nomImport+"','"+req.productImport+"')", (err,data) => {
    if(err) throw err;
    response.json("Mise à jour OK")
  });
});

//?ProductId=5&idUsine=7
app.put("/import_tonnageSortant",middleware,(request, response) => {
  const req=request.query
  pool.query("INSERT INTO import_tonnageSortants (ProductId,idUsine, productImport) VALUES ("+req.ProductId+","+req.idUsine+",'"+req.productImport+"')", (err,data) => {
    if(err) throw err;
    response.json("Mise à jour OK")
  });
});

//?ProductId=5&idUsine=7
app.put("/import_tonnageReactif",middleware,(request, response) => {
  const req=request.query
  pool.query("INSERT INTO import_tonnageReactifs (ProductId,idUsine, productImport) VALUES ("+req.ProductId+","+req.idUsine+",'"+req.productImport+"')", (err,data) => {
    if(err) throw err;
    response.json("Mise à jour OK")
  });
});


//Requête permettant de récupérer tout les tokens non autorisés
app.get("/correspondance/:Id",middleware,(request, response) => {
  pool.query("SELECT * FROM import_tonnage where ProducerId ="+request.params.Id, (err,data) => {
    if(err) throw err;
    data = data['recordset'];
    response.json({data}) 
  });
});

//DELETE correspondance
app.delete("/deleteCorrespondance/:id", middleware,(request, response) => {
  const req=request.query
  pool.query("DELETE FROM import_tonnageSortants WHERE Id = "+request.params.id, (err,data) => {
    if(err) throw err;
    response.json("Suppression de la correspondance OK")
  });
});

//DELETE correspondance
app.delete("/deleteCorrespondanceReactif/:id", middleware,(request, response) => {
  const req=request.query
  pool.query("DELETE FROM import_tonnageReactifs WHERE Id = "+request.params.id, (err,data) => {
    if(err) throw err;
    response.json("Suppression de la correspondance OK")
  });
});


app.put("/updateCorrespondance",middleware, (request, response) => {
  const req=request.query
  pool.query("UPDATE import_tonnage SET nomImport='"+ req.nomImport+"', productImport ='"+ req.productImport+"' WHERE ProducerId =" +req.ProducerId, (err,data) => {
    if(err) throw err;
    response.json("Mise à jour OK")
  });
});

//mettre à jour le nom dans le logiciel de pesée d'une correspondance sortant
//?productImport=1&ProductId=&
app.put("/updateNomImportCorrespondanceSortant",middleware, (request, response) => {
  const req=request.query
  pool.query("UPDATE import_tonnageSortants SET productImport ='"+ req.productImport+"' WHERE ProductId =" +req.ProductId, (err,data) => {
    if(err) throw err;
    response.json("Mise à jour OK")
  });
});

//mettre à jour le nom de produit cap exploitation d'une correspondance sortant
//?idCorrespondance=1&ProductId=&
app.put("/updateProductImportCorrespondanceSortant",middleware, (request, response) => {
  const req=request.query
  pool.query("UPDATE import_tonnageSortants SET ProductId =" +req.ProductId +"WHERE id =" + req.idCorrespondance, (err,data) => {
    if(err) throw err;
    response.json("Mise à jour OK")
  });
});

//mettre à jour le nom dans le logiciel de pesée d'une correspondance réactif
//?productImport=1&ProductId=&
app.put("/updateNomImportCorrespondanceReactif",middleware, (request, response) => {
  const req=request.query
  pool.query("UPDATE import_tonnageReactifs SET productImport ='"+ req.productImport+"' WHERE ProductId =" +req.ProductId, (err,data) => {
    if(err) throw err;
    response.json("Mise à jour OK")
  });
});

//mettre à jour le nom de produit cap exploitation d'une correspondance réactif
//?idCorrespondance=1&ProductId=&
app.put("/updateProductImportCorrespondanceReactif",middleware, (request, response) => {
  const req=request.query
  pool.query("UPDATE import_tonnageReactifs SET ProductId =" +req.ProductId +"WHERE id =" + req.idCorrespondance, (err,data) => {
    if(err) throw err;
    response.json("Mise à jour OK")
  });
});

//Requête permettant de récupérer toutes les correspondance pour l'import csv des entrants
app.get("/getCorrespondance/:idUsine",middleware,(request, response) => {
  pool.query("SELECT * FROM import_tonnage where idUsine ="+request.params.idUsine, (err,data) => {
    if(err) throw err;
    data = data['recordset'];
    response.json({data}) 
  });
});

//Requête permettant de récupérer toutes les correspondance pour l'import csv des sortants
app.get("/getCorrespondanceSortants/:idUsine",middleware,(request, response) => {
  pool.query("SELECT * FROM import_tonnageSortants where idUsine ="+request.params.idUsine, (err,data) => {
    if(err) throw err;
    data = data['recordset'];
    response.json({data}) 
  });
});

//Requête permettant de récupérer toutes les correspondance pour l'import csv des réactifs
app.get("/getCorrespondanceReactifs/:idUsine",middleware,(request, response) => {
  pool.query("SELECT * FROM import_tonnageReactifs where idUsine ="+request.params.idUsine, (err,data) => {
    if(err) throw err;
    data = data['recordset'];
    response.json({data}) 
  });
});

//Requête permettant de récupérer toutes les conversion de mesure disponibles
app.get("/getConversions",middleware,(request, response) => {
  pool.query("SELECT * FROM conversion", (err,data) => {
    if(err) throw err;
    data = data['recordset'];
    response.json({data}) 
  });
});



//////////////////////////
//FIN Import tonnage    //
//////////////////////////


//////////////////////////
//    Formulaire        //
//////////////////////////


//?nom=journalier&type=1&idUsine=1
app.put("/formulaire", middleware,(request, response) => {
  const req=request.query;
  pool.query("INSERT INTO formulaire (nom, type, idUsine) VALUES ('"+req.nom+"', "+req.type+", "+req.idUsine+")"
  ,(err,result,fields) => {
      if(err) response.json("Création du formulaire KO");
      else response.json("Création du formulaire OK");
  });
});

//Récupérer les formulaires d'un site
//?idUsine=7
app.get("/formulaires", middleware,(request, response) => {
  const req=request.query;
  pool.query("SELECT * FROM formulaire WHERE idUsine = "+req.idUsine, (err,data) => {
    if(err) throw err;
    data = data['recordset'];
    response.json({data});
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
app.get("/getOneConsigne", middleware,(request, response) => {
  const req=request.query;
  pool.query("SELECT * FROM consigne WHERE id = "+req.idConsigne, (err,data) => {
    if(err) throw err;
    data = data['recordset'];
    response.json({data});
  });
});

//////////ACTU//////////

//Créer une actu
//?titre=test&importance=0&dateDeb=2024-01-10 10:00&dateFin=2024-01-10 10:00&idUsine=30&description=deeeeeeec
app.put("/actu", middleware,(request, response) => {
  const req=request.query;
  const titre = req.titre.replace(/'/g, "''");
  const description = req.description.replace(/'/g, "''");
  pool.query("INSERT INTO quart_actualite(idUsine,titre,importance,date_heure_debut,date_heure_Fin,isValide,description) OUTPUT INSERTED.Id "
            +"VALUES("+req.idUsine+",'"+titre+"',"+req.importance+",'"+req.dateDeb+"','"+req.dateFin+"',0,'"+description+"')"
  ,(err,data) => {
    if(err) throw(err)
    data = data['recordset'];
    response.json({data});
  });
});

//Modifier une actu
//?titre=test&importance=0&dateDeb=2024-01-10 10:00&dateFin=2024-01-10 10:00&idActu=1&description=deeeeeeec
app.put("/updateActu", middleware,(request, response) => {
  const req=request.query;
  const titre = req.titre.replace(/'/g, "''");
  const description = req.description.replace(/'/g, "''");
  pool.query("UPDATE quart_actualite SET titre ='" +titre +"',importance="+req.importance+",date_heure_debut='"+req.dateDeb+"',date_heure_Fin='"+req.dateFin+"', description = '"+description+"' WHERE id="+req.idActu
  ,(err,result) => {
      if(err) throw(err)
      else response.json("Modif de l'actu OK !");
  });
});

//Récupérer toutes les actus entre deux dates
//?idUsine=1&datedeb=''&dateFin=''
app.get("/getActusRonde", middleware,(request, response) => {
  const req=request.query;
  pool.query("SELECT a.id, a.titre, a.description, CONVERT(varchar, a.date_heure_debut, 103)+ ' ' + CONVERT(varchar, a.date_heure_debut, 108) as 'date_heure_debut', CONVERT(varchar, a.date_heure_fin, 103)+ ' ' + CONVERT(varchar, a.date_heure_fin, 108) as 'date_heure_fin', a.importance FROM quart_actualite a WHERE a.date_heure_debut < '"+req.dateFin+"' and a.date_heure_fin > '"+req.dateDeb+"' and idUsine = "+req.idUsine, (err,data) => {
    if(err) throw err;
    data = data['recordset'];
    response.json({data});
  });
});

//Récupérer une actualité
//?idActu=7
app.get("/getOneActu", middleware,(request, response) => {
  const req=request.query;
  pool.query("SELECT * FROM quart_actualite WHERE id = "+req.idActu, (err,data) => {
    if(err) throw err;
    data = data['recordset'];
    response.json({data});
  });
});

//Récupérer toutes les actualités
//?idUsine=7
app.get("/getAllActu", middleware,(request, response) => {
  const req=request.query;
  pool.query("SELECT a.id, a.titre, a.description, a.idUsine, CONVERT(varchar, a.date_heure_debut, 103)+ ' ' + CONVERT(varchar, a.date_heure_debut, 108) as 'date_heure_debut', CONVERT(varchar, a.date_heure_fin, 103)+ ' ' + CONVERT(varchar, a.date_heure_fin, 108) as 'date_heure_fin', a.importance, a.isValide  FROM quart_actualite a WHERE idUsine = "+req.idUsine +" ORDER BY date_heure_debut desc", (err,data) => {
    if(err) throw err;
    data = data['recordset'];
    response.json({data});
  });
});

//Récupérer toutes les actualités
//?idUsine=7
app.get("/getActusEntreDeuxDates", middleware,(request, response) => {
  const req=request.query;
  var importance = req.importance
  if(req.importance == 3){
    importance = ''
  }
  pool.query("SELECT 'Actualité' as 'typeDonnee', a.id, a.description, a.titre as 'nom', a.idUsine, CONVERT(varchar, a.date_heure_debut, 103)+ ' ' + CONVERT(varchar, a.date_heure_debut, 108) as 'date_heure_debut', CONVERT(varchar, a.date_heure_fin, 103)+ ' ' + CONVERT(varchar, a.date_heure_fin, 108) as 'date_heure_fin', a.importance, a.isValide  FROM quart_actualite a where  a.date_heure_debut < '"+req.dateFin+"' and a.date_heure_fin > '"+req.dateDeb+"' and a.titre like '%"+req.titre+"%' and a.importance like '%"+importance+"%' and a.idUsine = "+req.idUsine, (err,data) => {
    if(err) throw err;
    data = data['recordset'];
    response.json({data});
  });
});


//Récupérer toutes les actualités actives
//?idUsine=7
app.get("/getActusActives", middleware,(request, response) => {
  const req=request.query;
  pool.query("SELECT a.id, a.titre, a.description, a.idUsine, CONVERT(varchar, a.date_heure_debut, 103)+ ' ' + CONVERT(varchar, a.date_heure_debut, 108) as 'date_heure_debut', CONVERT(varchar, a.date_heure_fin, 103)+ ' ' + CONVERT(varchar, a.date_heure_fin, 108) as 'date_heure_fin', a.importance, a.isValide FROM quart_actualite a WHERE a.date_heure_fin >= GETDATE() and  idUsine = "+req.idUsine, (err,data) => {
    if(err) throw err;
    data = data['recordset'];
    response.json({data});
  });
});

//Terminer une actu
//?idActu=1
app.put("/validerActu", middleware,(request, response) => {
  const req=request.query;
  pool.query("UPDATE quart_actualite SET isValide = 1 WHERE id="+req.idActu
  ,(err,result) => {
      if(err) throw(err)
      else response.json("Modif de l'actu OK !");
  });
});

//Terminer une actu
//?idActu=1
app.put("/invaliderActu", middleware,(request, response) => {
  const req=request.query;
  pool.query("UPDATE quart_actualite SET isValide = 0 WHERE id="+req.idActu
  ,(err,result) => {
      if(err) throw(err)
      else response.json("Modif de l'actu OK !");
  });
});

////FIN ACTU////////////

//**  evenements  **/

//Créer un évènement
//?titre=test&importance=0&dateDeb=2024-01-10 10:00&dateFin=2024-01-10 10:00&idUsine=30&groupementGMAO=&equipementGMAO=&cause=&description
app.put("/evenement",multer({storage: storage}).single('fichier'),(request, response) => {
  const req=request.query;
  const titre = req.titre.replace(/'/g, "''");
  const groupementGMAO = req.groupementGMAO.replace(/'/g, "''");
  const equipementGMAO = req.equipementGMAO.replace(/'/g, "''");
  const cause = req.cause.replace(/'/g, "''");
  const description = req.description.replace(/'/g, "''");
  var url = ""
  if(request.file != undefined){
    url = `${request.protocol}://capexploitation.paprec.com/capexploitation/fichiers/${request.file.filename.replace("[^a-zA-Z0-9]", "")}`;
  }
  pool.query("INSERT INTO quart_evenement(idUsine,titre,importance,date_heure_debut,date_heure_Fin,groupementGMAO, equipementGMAO, description, cause, consigne, demande_travaux,url) OUTPUT INSERTED.Id "
            +"VALUES("+req.idUsine+",'"+titre+"',"+req.importance+",'"+req.dateDeb+"','"+req.dateFin+"','"+groupementGMAO+"','"+equipementGMAO+"','"+description+"','"+cause+"',"+req.consigne+","+req.demandeTravaux+",'"+url+"')"
  ,(err,data) => {
      if(err) throw(err)
      else {  
        data = data['recordset'];
        response.json({data});
      }
  });
});

//Modifier un évènement
//?titre=test&importance=0&dateDeb=2024-01-10 10:00&dateFin=2024-01-10 10:00&idEvenement=30&groupementGMAO=&equipementGMAO=&cause=&description
app.put("/updateEvenement",middleware,(request, response) => {
  const req=request.query;
  const titre = req.titre.replace(/'/g, "''");
  const groupementGMAO = req.groupementGMAO.replace(/'/g, "''");
  const equipementGMAO = req.equipementGMAO.replace(/'/g, "''");
  const cause = req.cause.replace(/'/g, "''");
  const description = req.description.replace(/'/g, "''");
  pool.query("UPDATE quart_evenement SET titre = '"+titre+"',importance = "+req.importance+",date_heure_debut='"+req.dateDeb+"',date_heure_Fin='"+req.dateFin+"',groupementGMAO='"+groupementGMAO+"', equipementGMAO='"+equipementGMAO+"', description='"+description+"', cause='"+cause+"', consigne="+req.consigne+", demande_travaux="+req.demandeTravaux+" where id="+req.idEvenement
  ,(err,result) => {
      if(err) throw(err)
      else response.json("Modification de l'evenement OK !");
  });
});

//Récupérer un évènement
//?idEvenement=7
app.get("/getOneEvenement", middleware,(request, response) => {
  const req=request.query;
  pool.query("SELECT * FROM quart_evenement WHERE id = "+req.idEvenement, (err,data) => {
    if(err) throw err;
    data = data['recordset'];
    response.json({data});
  });
});

//Récupérer toutes les évènements
//?idUsine=7
app.get("/getAllEvenement", middleware,(request, response) => {
  const req=request.query;
  pool.query("SELECT e.id, e.titre, e.idUsine, CONVERT(varchar, e.date_heure_debut, 103)+ ' ' + CONVERT(varchar, e.date_heure_debut, 108) as 'date_heure_debut', CONVERT(varchar, e.date_heure_fin, 103)+ ' ' + CONVERT(varchar, e.date_heure_fin, 108) as 'date_heure_fin', e.importance, e.groupementGMAO, e.equipementGMAO, e.cause, e.description, e.demande_travaux, e.consigne, e.url FROM quart_evenement e WHERE e.isActive = 1 and idUsine = "+req.idUsine, (err,data) => {
    if(err) throw err;
    data = data['recordset'];
    response.json({data});
  });
});

//Récupérer toutes les évènements entre deux dates
//?idUsine=7
app.get("/getEvenementsEntreDeuxDates", middleware,(request, response) => {
  const req=request.query;
  var importance = req.importance
  if(req.importance == 3){
    importance = ''
  }
  const titre = req.titre.replace(/'/g, "''");
  const groupementGMAO = req.groupementGMAO.replace(/'/g, "''");
  const equipementGMAO = req.equipementGMAO.replace(/'/g, "''");
  pool.query("SELECT 'Evènement' as 'typeDonnee', e.id, e.titre as 'nom', e.idUsine, CONVERT(varchar, e.date_heure_debut, 103)+ ' ' + CONVERT(varchar, e.date_heure_debut, 108) as 'date_heure_debut', CONVERT(varchar, e.date_heure_fin, 103)+ ' ' + CONVERT(varchar, e.date_heure_fin, 108) as 'date_heure_fin', e.importance, e.groupementGMAO, e.equipementGMAO, e.cause, e.description, e.demande_travaux, e.consigne, e.url  FROM quart_evenement e where  e.date_heure_debut < '"+req.dateFin+"' and e.date_heure_fin > '"+req.dateDeb+"' and e.titre like '%"+titre+"%' and e.groupementGMAO like '%"+groupementGMAO+"%' and e.importance like '%"+importance+"%' and e.equipementGMAO like '%"+equipementGMAO+"%' and e.isActive = 1 and e.idUsine = "+req.idUsine
  , (err,data) => {
    if(err) throw err;
    data = data['recordset'];
    response.json({data});
  });
});

//DELETE évènement
app.put("/deleteEvenement/:id",middleware, (request, response) => {
  const req=request.query
  pool.query("UPDATE quart_evenement set isActive = 0 WHERE id = "+request.params.id, (err,data) => {
    if(err) throw err;
    response.json("Suppression de l'evenement OK")
  });
});

////FIN EVENEMENT ////

///Calendrier///

//Récupérer toutes les zones présentes dans la table calndrier pour une usine
//?idUsine=
app.get("/getAllZonesCalendrier", middleware,(request, response) => {
  const req=request.query;
  pool.query("select c.id, c.idUsine, c.idZone, z.nom, c.idAction, date_heure_debut,date_heure_fin,c.quart, c.termine from quart_calendrier c full outer join zonecontrole z on z.id = c.idZone where c.idZone is not null and c.idUsine = "+req.idUsine, (err,data) => {
    if(err) throw err;
    data = data['recordset'];
    response.json({data});
  });
});

//Récupérer toutes les actions présentes dans la table calndrier pour une usine
//?idUsine=
app.get("/getAllActionsCalendrier", middleware,(request, response) => {
  const req=request.query;
  pool.query("select a.nom, c.* from quart_calendrier c full outer join quart_action a on a.id = c.idAction where c.id is not null and c.idAction is not null and c.idUsine = "+req.idUsine, (err,data) => {
    if(err) throw err;
    data = data['recordset'];
    response.json({data});
  });
});

//Créer une instance pour les ZONES
//?idUsine=1&idRonde=1&datedeb=''&dateFin=''&quart=1
app.put("/newCalendrierZone", middleware,(request, response) => {
  const req=request.query;
  pool.query("INSERT INTO quart_calendrier(idUsine,idZone,date_heure_debut,quart,termine,date_heure_fin) "
            +"VALUES("+req.idUsine+","+req.idRonde+",'"+req.dateDeb+"',"+req.quart+",0,'"+req.dateFin+"')"
  ,(err,result) => {
      if(err) throw(err)
      else response.json("Création de l'instance OK !");
  });
});

//Créer une instance pour les ACTIONS
//?idUsine=1&idAction=1&datedeb=''&dateFin=''&quart=1
app.put("/newCalendrierAction", middleware,(request, response) => {
  const req=request.query;
  pool.query("INSERT INTO quart_calendrier(idUsine,idAction,date_heure_debut,quart,termine,date_heure_fin) "
            +"VALUES("+req.idUsine+","+req.idAction+",'"+req.dateDeb+"',"+req.quart+",0,'"+req.dateFin+"')"
  ,(err,result) => {
      if(err) throw(err)
      else response.json("Création de l'instance OK !");
  });
});

//Créer une action
//?idUsine=1&idRonde=1&datedeb=''&dateFin=''
app.put("/newAction", middleware,(request, response) => {
  const req=request.query;
  const nom = req.nom.replace(/'/g, "''");
  pool.query("INSERT INTO quart_action(idUsine,nom,date_heure_debut,date_heure_fin) OUTPUT INSERTED.id, INSERTED.date_heure_debut,INSERTED.date_heure_fin "
            +"VALUES("+req.idUsine+",'"+nom+"','"+req.dateDeb+"','"+req.dateFin+"')"
    ,(err,data) => {
    if(err) throw(err)
    data = data['recordset'];
    response.json({data});
  });
});

//DELETE évènement
app.delete("/deleteCalendrier/:id",middleware, (request, response) => {
  const req=request.query
  pool.query("DELETE FROM quart_calendrier WHERE id = "+request.params.id, (err,data) => {
    if(err) throw err;
    response.json("Suppression de l'evenement du calendrier OK")
  });
});


//ACCUEIL /////

//Récupérer toutes les zones présentes dans la table calndrier pour une usine
//?idUsine=1&datedeb=''&dateFin=''
app.get("/getEvenementsRonde", middleware,(request, response) => {
  const req=request.query;
  pool.query("SELECT e.id, e.titre, e.idUsine, CONVERT(varchar, e.date_heure_debut, 103)+ ' ' + CONVERT(varchar, e.date_heure_debut, 108) as 'date_heure_debut', CONVERT(varchar, e.date_heure_fin, 103)+ ' ' + CONVERT(varchar, e.date_heure_fin, 108) as 'date_heure_fin', e.importance, e.groupementGMAO, e.equipementGMAO, e.cause, e.description, e.demande_travaux, e.consigne, e.url  FROM quart_evenement e WHERE e.date_heure_debut < '"+req.dateFin+"' and e.date_heure_fin > '"+req.dateDeb+"' and idUsine = "+req.idUsine, (err,data) => {
    if(err) throw err;
    data = data['recordset'];
    response.json({data});
  });
});

//Récupérer toutes les action présentes dans la table calndrier pour une usine
//?idUsine=1&datedeb=''&dateFin=''
app.get("/getActionsRonde", middleware,(request, response) => {
  const req=request.query;
  pool.query("select a.nom, c.*, u.nom as 'nomRondier', u.prenom as 'prenomRondier' from quart_calendrier c full outer join users u on u.id = c.idUser full outer join quart_action a on a.id = c.idAction where a.date_heure_debut = '"+req.dateDeb+"' and a.date_heure_fin = '"+req.dateFin+"' and  c.id is not null and c.idAction is not null and c.idUsine = "+req.idUsine, (err,data) => {
    if(err) throw err;
    data = data['recordset'];
    response.json({data});
  });
});

//Récupérer les zone affectée à une ronde
//?idUsine=1&datedeb=''&dateFin=''
app.get("/getZonesCalendrierRonde",(request, response) => {
  const req=request.query;
  BadgeAndElementsOfZone = [];
  pool.query("select c.id, c.idUsine, c.idZone, u.nom as 'nomRondier', u.prenom as 'prenomRondier', c.idZone as 'zoneId', z.nom as 'nomZone', z.commentaire, z.four , c.idAction, CONVERT(varchar, c.date_heure_debut, 103)+ ' ' + CONVERT(varchar, c.date_heure_debut, 108) as 'date_heure_debut',CONVERT(varchar, c.date_heure_fin, 103)+ ' ' + CONVERT(varchar, c.date_heure_fin, 108) as 'date_heure_fin',c.quart, c.termine, b.uid as 'uidBadge' from quart_calendrier c full outer join zonecontrole z on z.id = c.idZone full outer join users u on u.id = c.idUser full outer join badge b on b.zoneId = z.id where c.date_heure_debut = '"+req.dateDeb+"' and c.date_heure_fin = '"+req.dateFin+"' and c.idZone is not null and c.idUsine = "+req.idUsine, async (err,data) => {
    if(err) throw err;
    else {
      data = data['recordset'];
      //On récupère l'Id de la ronde précedente
      await getPreviousId(req.idUsine);
      //On boucle sur chaque zone et son badge pour récupérer ses éléments
      for await (const zone of data) {
        await getElementsHorsLigne(zone);
      };
      response.json({BadgeAndElementsOfZone});
    }
  });
});


////FIN ACCUEIL///

//ACTIONS////

//Récupérer toutes les actions d'une usine
//?idUsine=1
app.get("/getAllAction", middleware,(request, response) => {
  const req=request.query;
  pool.query("select a.nom, CONVERT(varchar, a.date_heure_debut, 103)+ ' ' + CONVERT(varchar, a.date_heure_debut, 108) as 'date_heure_debut', CONVERT(varchar, a.date_heure_fin, 103)+ ' ' + CONVERT(varchar, a.date_heure_fin, 108) as 'date_heure_fin' from quart_action a where a.idUsine = "+req.idUsine, (err,data) => {
    if(err) throw err;
    data = data['recordset'];
    response.json({data});
  });
});

//Récupérer une action
//?idAction=7
app.get("/getOneAction", middleware,(request, response) => {
  const req=request.query;
  pool.query("SELECT * FROM quart_action WHERE id = "+req.idAction, (err,data) => {
    if(err) throw err;
    data = data['recordset'];
    response.json({data});
  });
});

//Modifier une action
//?nom=test&importance=0&dateDeb=2024-01-10 10:00&dateFin=2024-01-10 10:00&idAction=1
app.put("/updateAction", middleware,(request, response) => {
  const req=request.query;
  const nom = req.nom.replace(/'/g, "''");
  pool.query("UPDATE quart_action SET nom ='" +nom +"',date_heure_debut='"+req.dateDeb+"',date_heure_Fin='"+req.dateFin+"' WHERE id="+req.idAction
  ,(err,result) => {
      if(err) throw(err)
      else response.json("Modif de l'actu OK !");
  });
});

//Modifier une action dans la table calendrier
//?nom=test&importance=0&dateDeb=2024-01-10 10:00&dateFin=2024-01-10 10:00&idAction=1
app.put("/updateCalendrierAction", middleware,(request, response) => {
  const req=request.query;
  pool.query("UPDATE quart_calendrier SET date_heure_debut='"+req.dateDeb+"',date_heure_Fin='"+req.dateFin+"', quart="+req.quart+" WHERE idAction="+req.idAction
  ,(err,result) => {
      if(err) throw(err)
      else response.json("Modif de l'actu OK !");
  });
});


//Récupérer toutes les actions d'une usine
//?idUsine=1&dateDeb=''&dateFin=''
app.get("/getActionsEntreDeuxDates", middleware,(request, response) => {
  const req=request.query;
  pool.query("select 'Action' as 'typeDonnee', a.nom, CONVERT(varchar, a.date_heure_debut, 103)+ ' ' + CONVERT(varchar, a.date_heure_debut, 108) as 'date_heure_debut', CONVERT(varchar, a.date_heure_fin, 103)+ ' ' + CONVERT(varchar, a.date_heure_fin, 108) as 'date_heure_fin', a.id from quart_action a where  a.date_heure_debut < '"+req.dateFin+"' and a.date_heure_fin > '"+req.dateDeb+"' and a.nom like '%"+req.titre+"%' and a.idUsine = "+req.idUsine, (err,data) => {
    if(err) throw err;
    data = data['recordset'];
    response.json({data});
  });
});




//////////////////////////
//  Fin Cahier de quart //
//////////////////////////

//////////////////////////
//    Registre DNDTS    //
//////////////////////////

app.put("/registreDNDTS", middleware,(request, response) => {
  const req=request.query;
  for(var i=0; i<request.body.data.length;i++){
   
    pool.query("IF NOT EXISTS (SELECT * FROM registre_DNDTS WHERE numDePesee = '"+request.body.data[i].numDePesee+"')"
    +" BEGIN "
    +"INSERT INTO [dbo].[registre_DNDTS] ([numDePesee],[type],[date1],[codeBadge],[codeVehicule],[codeClient],[nomClient],[poids1],[poids1DSD],[poids1DateHeure],[pontBasculeP1],[Date2],[poids2],[poids2DSD],[poids2DateHeure],[pontBasculeP2],[net],[tempsDeRetenue],[codeSociete],[nomSociete],[codeFamilleVehicule],[nomFamilleVehicule],[codeFamilleTransporteur],[nomFamilleTransporteur],[codeTransporteur],[nomTransporteur],[codeFamilleClient] ,[nomFamilleClient],[codeFamilleProduit],[nomFamilleProduit],[codeProduit],[nomProduit],[codeCollecte],[nomCollecte],[codeDestination],[nomDestination],[codeChantier],[nomChantier],[codeChauffeur],[nomChauffeur],[codeFamilleBenne],[nomFamilleBenne],[codeBenne],[nomBenne],[codeZoneDeStockage],[nomZoneDeStockage],[codeFichier1],[nomFichier1],[codeFichier2],[nomFichier2],[codeFichier3],[nomFichier3],[codeFichier4],[nomFichier4],[terminee],[supprimee],[modifie],[humidite],[proteine],[impurete],[poidsSpecifique],[parcelle],[calibration],[numeroCommande],[numeroDeBSB],[adresse1Societe],[adresse2Societe],[codePostalSociete],[villeSociete],[mobileSociete],[telephoneSociete],[faxSociete],[modeDegrade],[borne],[numeroDePeseeBorne],[creeLe],[creePar],[creeSur],[modifieLe],[modifiePar],[modifieSur],[idUsine], [adresseClient], [codePostalClient], [villeClient], [siret]) VALUES("
    +"'"+request.body.data[i].numDePesee+"',"
    +"'"+request.body.data[i].type+"',"
    +"'"+request.body.data[i].date1+"',"
    +"'"+request.body.data[i].codeBadge+"',"
    +"'"+request.body.data[i].codeVehicule+"',"
    +"'"+request.body.data[i].codeClient+"',"
    +"'"+request.body.data[i].nomClient+"',"
    +"'"+request.body.data[i].poids1+"',"
    +"'"+request.body.data[i].poids1DSD+"',"
    +"'"+request.body.data[i].poids1DateHeure+"',"
    +"'"+request.body.data[i].pontBasculeP1+"',"
    +"'"+request.body.data[i].Date2+"',"
    +"'"+request.body.data[i].poids2+"',"
    +"'"+request.body.data[i].poids2DSD+"',"
    +"'"+request.body.data[i].poids2DateHeure+"',"
    +"'"+request.body.data[i].pontBasculeP2+"',"
    +"'"+request.body.data[i].net+"',"
    +"'"+request.body.data[i].tempsDeRetenue+"',"
    +"'"+request.body.data[i].codeSociete+"',"
    +"'"+request.body.data[i].nomSociete+"',"
    +"'"+request.body.data[i].codeFamilleVehicule+"',"
    +"'"+request.body.data[i].nomFamilleVehicule+"',"
    +"'"+request.body.data[i].codeFamilleTransporteur+"',"
    +"'"+request.body.data[i].nomFamilleTransporteur+"',"
    +"'"+request.body.data[i].codeTransporteur+"',"
    +"'"+request.body.data[i].nomTransporteur+"',"
    +"'"+request.body.data[i].codeFamilleClient+"',"
    +"'"+request.body.data[i].nomFamilleClient+"',"
    +"'"+request.body.data[i].codeFamilleProduit+"',"
    +"'"+request.body.data[i].nomFamilleProduit+"',"
    +"'"+request.body.data[i].codeProduit+"',"
    +"'"+request.body.data[i].nomProduit+"',"
    +"'"+request.body.data[i].codeCollecte+"',"
    +"'"+request.body.data[i].nomCollecte+"',"
    +"'"+request.body.data[i].codeDestination+"',"
    +"'"+request.body.data[i].nomDestination+"',"
    +"'"+request.body.data[i].codeChantier+"',"
    +"'"+request.body.data[i].nomChantier+"',"
    +"'"+request.body.data[i].codeChauffeur+"',"
    +"'"+request.body.data[i].nomChauffeur+"',"
    +"'"+request.body.data[i].codeFamilleBenne+"',"
    +"'"+request.body.data[i].nomFamilleBenne+"',"
    +"'"+request.body.data[i].codeBenne+"',"
    +"'"+request.body.data[i].nomBenne+"',"
    +"'"+request.body.data[i].codeZoneDeStockage+"',"
    +"'"+request.body.data[i].nomZoneDeStockage+"',"
    +"'"+request.body.data[i].codeFichier1+"',"
    +"'"+request.body.data[i].nomFichier1+"',"
    +"'"+request.body.data[i].codeFichier2+"',"
    +"'"+request.body.data[i].nomFichier2+"',"
    +"'"+request.body.data[i].codeFichier3+"',"
    +"'"+request.body.data[i].nomFichier3+"',"
    +"'"+request.body.data[i].codeFichier4+"',"
    +"'"+request.body.data[i].nomFichier4+"',"
    +"'"+request.body.data[i].terminee+"',"
    +"'"+request.body.data[i].supprimee+"',"
    +"'"+request.body.data[i].modifie+"',"
    +"'"+request.body.data[i].humidite+"',"
    +"'"+request.body.data[i].proteine+"',"
    +"'"+request.body.data[i].impurete+"',"
    +"'"+request.body.data[i].poidsSpecifique+"',"
    +"'"+request.body.data[i].parcelle+"',"
    +"'"+request.body.data[i].calibration+"',"
    +"'"+request.body.data[i].numeroCommande+"',"
    +"'"+request.body.data[i].numeroDeBSB+"',"
    +"'"+request.body.data[i].adresse1Societe+"',"
    +"'"+request.body.data[i].adresse2Societe+"',"
    +"'"+request.body.data[i].codePostalSociete+"',"
    +"'"+request.body.data[i].villeSociete+"',"
    +"'"+request.body.data[i].mobileSociete+"',"
    +"'"+request.body.data[i].telephoneSociete+"',"
    +"'"+request.body.data[i].faxSociete+"',"
    +"'"+request.body.data[i].modeDegrade+"',"
    +"'"+request.body.data[i].borne+"',"
    +"'"+request.body.data[i].numeroDePeseeBorne+"',"
    +"'"+request.body.data[i].creeLe+"',"
    +"'"+request.body.data[i].creePar+"',"
    +"'"+request.body.data[i].creeSur+"',"
    +"'"+request.body.data[i].modifieLe+"',"
    +"'"+request.body.data[i].modifiePar+"',"
    +"'"+request.body.data[i].modifieSur+"',"
    +""+request.body.data[i].idUsine+","
    +"'"+request.body.data[i].adresseClient+"',"
    +"'"+request.body.data[i].codePostalClient+"',"
    +"'"+request.body.data[i].villeClient+"',"
    +"'"+request.body.data[i].siret+"')"
    +"END;"
    ,(err,result) => {
        if(err) throw(err)
    });
  }
  response.json("Insertion");
});

//Générer les colonnes pour dnd-entrant
//?idUsine=7
app.get("/getRegistreDNDTSEntrants", middleware,(request, response) => {
  const req=request.query;
  // +" and date1 >'"+req.dateDeb+"' and date1 <'"+req.dateFin+"'order by date1"
  pool.query("select '' as 'identifiantMetier', 'NON' as 'dechetPOP', LEFT(date1,10) as 'dateReception', RIGHT(date1,8) as 'heurePeseeDechet', RIGHT(nomProduit,8) as 'codeDechet', nomProduit as 'denominationUsuelle', '' as 'codeDechetBale', CAST(net AS INT)/1000.000 as 'quantite', 'T' as 'codeUnite', 'ENTREPRISE_FR' as 'producteur.type', nomClient as 'producteur.raisonSociale', siret as 'producteur.numeroIdentification', codePostalClient as 'porducteur.codePostal', villeClient as 'producteur.adresse.commune', 'FR' as 'producteur.adresse.pays', adresseClient as 'producteur.adresse.libelle', '' as 'communes.codeInsee', '' as 'communes.libelle', 'ENTREPRISE_FR' as 'expediteur.type', '' as 'expediteur.adressePriseEnCharge', nomClient as 'expediteur.raisonSociale', siret as 'expediteur.numeroIdentification', codePostalClient as 'expediteur.adresse.codePostal', villeClient as 'epediteur.adresse.commune', 'FR' as 'expediteur.adresse.pays', adresseClient as 'expediteur.adresse.libelle', 'ENTREPRISE_FR' as 'transporteur.type', nomClient as 'transporteur.raisonSociale', siret as 'transporteur.numeroIdentification', codePostalClient as 'transporteur.adresse.codePostal', villeClient as 'tansporteur.adresse.commune', 'FR' as 'transporteur.adresse.pays', adresseClient as 'transporteur.adresse.libelle','' as 'transporteurs.numeroRecipisse', '' as 'courtier.type', '' as 'courtier.numeroRecipisse', '' as 'courtier.raisonSociale', '' as 'courtier.numeroIdentification', '' as 'ecoOrganisme.type', '' as 'ecoOrganisme.raisonSociale', '' as 'ecoOrganisme.numeroIdentification', 'R1' as 'codeTraitement', '' as 'numeroDocument', '' as 'numeroNotification',numDePesee as 'numeroSaisie' from registre_DNDTS where CONVERT(DATE,date1,103) BETWEEN '"+req.dateDeb+"' AND '"+req.dateFin+"' and type='RECEPTION' and idUsine ="+req.idUsine
  , (err,data) => {
    if(err) throw err;
    data = data['recordset'];
    response.json({data});
  });
});

//Générer les colonnes pour dnd-sortant
//?idUsine=7
app.get("/getRegistreDNDTSSortants", middleware,(request, response) => {
  const req=request.query;
  // +" and date1 >'"+req.dateDeb+"' and date1 <'"+req.dateFin+"'order by date1"
  pool.query("select '' as 'identifiantMetier', 'NON' as 'dechetPOP', LEFT(date1,10) as 'dateExpedition', RIGHT(nomProduit,8) as 'codeDechet',nomProduit as 'denominationUsuelle', '' as 'codeDechetBale', CAST(net AS INT)/1000.000 as 'quantite', 'T' as 'codeUnite', 'ENTREPRISE_FR' as 'producteur.type', nomClient as 'producteur.raisonSociale', siret as 'producteur.numeroIdentification', codePostalClient as 'porducteur.codePostal', villeClient as 'producteur.adresse.commune', 'FR' as 'producteur.adresse.pays', adresseClient as 'producteur.adresse.libelle', '' as 'communes.codeInsee', '' as 'communes.libelle','ENTREPRISE_FR' as 'transporteur.type', nomClient as 'transporteur.raisonSociale', siret as 'transporteur.numeroIdentification', codePostalClient as 'transporteur.adresse.codePostal', villeClient as 'tansporteur.adresse.commune', 'FR' as 'transporteur.adresse.pays', adresseClient as 'transporteur.adresse.libelle','' as 'transporteurs.numeroRecipisse', '' as 'courtier.type', '' as 'courtier.numeroRecipisse', '' as 'courtier.raisonSociale', '' as 'courtier.numeroIdentification', '' as 'ecoOrganisme.type', '' as 'ecoOrganisme.raisonSociale', '' as 'ecoOrganisme.numeroIdentification', '' AS 'destinataire.type', '' AS 'destinataire.raisonSociale', '' as 'destinataire.numeroIdentification', '' as 'destinataire.adresse.codePostal', '' as 'destinataire.adresse.commune', '' as 'destinataire.adresse.pays', '' as 'destinataire.adresse.pays', '' as 'destinataire.adresse.libelle', '' as 'destinataire.adresseDestination', 'R1' as 'codeTraitement', '' as 'codeQualification', '' as 'numeroDocument', '' as 'numeroNotification', '' as 'numeroSaisie', '' as 'etablissementOrigine.adresse.codePostal', '' as 'etablissementOrigine.adresse.commune', '' as 'etablissementOrigine.adresse.pays', '' as 'etablissementOrigine.adress.libelle', '' as 'etablissementOrigine.adressePriseEnCharge' from registre_DNDTS where CONVERT(DATE,date1,103) BETWEEN '"+req.dateDeb+"' AND '"+req.dateFin+"' and type='EXPEDITION' and idUsine ="+req.idUsine
  , (err,data) => {
    if(err) throw err;
    data = data['recordset'];
    response.json({data});
  });
});


//////////////////////////////
//    FIN Registre DNDTS    //
//////////////////////////////


//Récupérer toutes les anomalies d'une usine
//?idUsine=7
app.get("/getAllAnomalies", middleware,(request, response) => {
  const req=request.query;
  // +" and date1 >'"+req.dateDeb+"' and date1 <'"+req.dateFin+"'order by date1"
  pool.query("select z.nom, * from anomalie a join ronde r on r.id = a.rondeId join zonecontrole z on z.id = a.zoneId where r.idUsine = "+req.idUsine
  , (err,data) => {
    if(err) throw err;
    data = data['recordset'];
    response.json({data});
  });
});

//Mette à un la colonne évènement dans la table anomalie
//?idAnomalie=1
app.put("/updateAnomalieSetEvenement", middleware,(request, response) => {
  const req=request.query;
  pool.query("UPDATE anomalie SET evenement = 1 WHERE id="+req.idAnomalie
  ,(err,result) => {
      if(err) throw(err)
      else response.json("Modif de l'anomalie OK !");
  });
});

//Récupérer une anomalie
//?idAnomalie=7
app.get("/getOneAnomalie", middleware,(request, response) => {
  const req=request.query;
  // +" and date1 >'"+req.dateDeb+"' and date1 <'"+req.dateFin+"'order by date1"
  pool.query("select * from anomalie where id = "+req.idAnomalie
  , (err,data) => {
    if(err) throw err;
    data = data['recordset'];
    response.json({data});
  });
});




//////////////////////////////
//    Liens externes        //
//////////////////////////////

//Récupérer un lien externe
//?idLien=7
app.get("/getOneLienExterne", middleware,(request, response) => {
  const req=request.query;
  pool.query("select * from quart_liensExternes where id = "+req.idLien
  , (err,data) => {
    if(err) throw err;
    data = data['recordset'];
    response.json({data});
  });
});


//Récupérer tous les liens externes
//?idUsine=7
app.get("/getAllLiensExternes", middleware,(request, response) => {
  const req=request.query;
  pool.query("select * from quart_liensExternes where idUsine = "+req.idUsine
  , (err,data) => {
    if(err) throw err;
    data = data['recordset'];
    response.json({data});
  });
});

//Récupérer tous les liens externes actifs
//?idUsine=7
app.get("/getActifsLiensExternes", middleware,(request, response) => {
  const req=request.query;
  pool.query("select * from quart_liensExternes where actif = 1 and idUsine = "+req.idUsine
  , (err,data) => {
    if(err) throw err;
    data = data['recordset'];
    response.json({data});
  });
});

//Modifier un lien externe
//nom=??&url=??&idLien=2
app.put("/updateLienExterne",middleware,(request, response) => {
  const req=request.query;
  const nom = req.nom.replace(/'/g, "''");
  const url = req.url.replace(/'/g, "''");
  pool.query("UPDATE quart_liensExternes SET nom = '"+nom+"',url='"+url+"' where id="+req.idLien
  ,(err,result) => {
      if(err) throw(err)
      else response.json("Modif du lien OK !");
  });
});

//Nouveau lien externe
//nom=??&url=??&idUsine=2
app.put("/newLienExterne",middleware,(request, response) => {
  const req=request.query;
  const nom = req.nom.replace(/'/g, "''");
  const url = req.url.replace(/'/g, "''");
  pool.query("INSERT INTO quart_liensExternes(nom,url,actif,idUsine) VALUES('"+nom+"','"+url+"',0,"+req.idUsine+")"
  ,(err,result) => {
      if(err) throw(err)
      else response.json("Création du lien OK !");
  });
});

//activer un lien externe
//idLien=2
app.put("/activerLien",middleware,(request, response) => {
  const req=request.query;
  pool.query("UPDATE quart_liensExternes SET actif = 1 where id="+req.idLien
  ,(err,result) => {
      if(err) throw(err)
      else response.json("Modif du lien OK !");
  });
});

//desactiver un lien externe
//idLien=2
app.put("/desactiverLien",middleware,(request, response) => {
  const req=request.query;
  pool.query("UPDATE quart_liensExternes SET actif = 0 where id="+req.idLien
  ,(err,result) => {
      if(err) throw(err)
      else response.json("Modif du lien OK !");
  });
});

//Supprimer un lien externe
//?idLien=
app.delete("/deleteLienExterne", middleware,(request, response) => {
  const req=request.query
  pool.query("delete from quart_liensExternes where id ="+req.idLien, (err,data) => {
    if(err) throw err;
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
app.put("/historiqueEvenementCreate", middleware,(request, response) => {
  const req=request.query;
  pool.query("INSERT INTO quart_historique(idUser,dateHeure,idEvenement,creation,idUsine) VALUES("+req.idUser+",'"+req.dateHeure+"',"+req.idEvenement+",1,"+req.idUsine+")"
    ,(err,result) => {
      if(err) throw(err)
      else response.json("Ajout OK !");
  });
});

//Update d'un évènement
//?idUser=1&idEvenement=123&dateHeure=???&idUsine=1
app.put("/historiqueEvenementUpdate", middleware,(request, response) => {
  const req=request.query;
  pool.query("INSERT INTO quart_historique(idUser,dateHeure,idEvenement,edition,idUsine) VALUES("+req.idUser+",'"+req.dateHeure+"',"+req.idEvenement+",1,"+req.idUsine+")"
    ,(err,result) => {
      if(err) throw(err)
      else response.json("Ajout OK !");
  });
});

//Suppression d'un évènement
//?idUser=1&idEvenement=123&dateHeure=???&idUsine=1
app.put("/historiqueEvenementDelete", middleware,(request, response) => {
  const req=request.query;
  pool.query("INSERT INTO quart_historique(idUser,dateHeure,idEvenement,suppression,idUsine) VALUES("+req.idUser+",'"+req.dateHeure+"',"+req.idEvenement+",1,"+req.idUsine+")"
    ,(err,result) => {
      if(err) throw(err)
      else response.json("Ajout OK !");
  });
});

//Prise de quart
//?idUser=1&dateHeure=???&idUsine=1
app.put("/historiquePriseQuart", middleware,(request, response) => {
  const req=request.query;
  pool.query("INSERT INTO quart_historique(idUser,dateHeure,priseQuart,idUsine) VALUES("+req.idUser+",'"+req.dateHeure+"',1,"+req.idUsine+")"
    ,(err,result) => {
      if(err) throw(err)
      else response.json("Ajout OK !");
  });
});


//Création d'une actu
//?idUser=1&idActu=123&dateHeure=???&idUsine=1
app.put("/historiqueActuCreate", middleware,(request, response) => {
  const req=request.query;
  pool.query("INSERT INTO quart_historique(idUser,dateHeure,idActu,creation,idUsine) VALUES("+req.idUser+",'"+req.dateHeure+"',"+req.idActu+",1,"+req.idUsine+")"
    ,(err,result) => {
      if(err) throw(err)
      else response.json("Ajout OK !");
  });
});


//Update d'une actu
//?idUser=1&idActu=123&dateHeure=???&idUsine=1
app.put("/historiqueActuUpdate", middleware,(request, response) => {
  const req=request.query;
  pool.query("INSERT INTO quart_historique(idUser,dateHeure,idActu,edition,idUsine) VALUES("+req.idUser+",'"+req.dateHeure+"',"+req.idActu+",1,"+req.idUsine+")"
    ,(err,result) => {
      if(err) throw(err)
      else response.json("Ajout OK !");
  });
});

//Création d'une consigne
//?idUser=1&idConsigne=123&dateHeure=???&idUsine=1
app.put("/historiqueConsigneCreate", middleware,(request, response) => {
  const req=request.query;
  pool.query("INSERT INTO quart_historique(idUser,dateHeure,idConsigne,creation,idUsine) VALUES("+req.idUser+",'"+req.dateHeure+"',"+req.idConsigne+",1,"+req.idUsine+")"
    ,(err,result) => {
      if(err) throw(err)
      else response.json("Ajout OK !");
  });
});


//Update d'une consigne
//?idUser=1&idConsigne=123&dateHeure=???&idUsine=1
app.put("/historiqueConsigneUpdate", middleware,(request, response) => {
  const req=request.query;
  pool.query("INSERT INTO quart_historique(idUser,dateHeure,idConsigne,edition,idUsine) VALUES("+req.idUser+",'"+req.dateHeure+"',"+req.idConsigne+",1,"+req.idUsine+")"
    ,(err,result) => {
      if(err) throw(err)
      else response.json("Ajout OK !");
  });
});

//Delete d'une consigne
//?idUser=1&idConsigne=123&dateHeure=???&idUsine=1
app.put("/historiqueConsigneDelete", middleware,(request, response) => {
  const req=request.query;
  pool.query("INSERT INTO quart_historique(idUser,dateHeure,idConsigne,suppression,idUsine) VALUES("+req.idUser+",'"+req.dateHeure+"',"+req.idConsigne+",1,"+req.idUsine+")"
    ,(err,result) => {
      if(err) throw(err)
      else response.json("Ajout OK !");
  });
});


////////////////////////
////Rondier tablette////
////////////////////////

//Récupérer les actions du quart selon idUsine,le quart,
//?idUsine=1&quart=1
app.get("/actionsDuQuart/:idUsine/:quart",(request, response) => {
  const req=request.query
  pool.query("SELECT a.nom, a.id FROM [dolibarr].[dbo].[quart_calendrier] c INNER JOIN [dolibarr].[dbo].[quart_action] a ON a.id = c.idAction "
  +"WHERE c.idUsine = "+request.params.idUsine+" AND c.quart = "+request.params.quart+" AND c.termine = 0 "
  +"AND c.date_heure_debut = '"+req.date_heure_debut+"'",(err,data) => {
    if(err) throw err;
    data = data['recordset'];
    response.json({data});
  });
});

//Controler s'il y a des zones sur la ronde du quart
app.get("/recupZonesQuart/:idUsine/:quart",(request, response) => {
  const req=request.query
  pool.query("SELECT COUNT(idZone) as nombreDeZones FROM quart_calendrier c WHERE c.quart = "+request.params.quart+" AND c.idUsine = "+request.params.idUsine+" AND c.date_heure_debut = '"+req.date_heure_debut+"' AND c.idZone is NOT NULL"
  ,(err,data) => {
    if(err) throw err;
    data = data['recordset'];
    response.json(data[0].nombreDeZones);
  });
});

//a la validation de zone, on update calendrier zone sur termine = 1
//Mise à jour des information d'une zone sur le quart calendrier
//?idUsine=1&quart=1
app.put("/terminerCalendrierZone/:idUsine/:quart", (request, response) => {
  const req = request.query
  pool.query("update quart_calendrier set termine = 1, idUser = "+req.idUser+" where quart = "+request.params.quart+" AND idUsine = "+request.params.idUsine+" AND idZone = "+req.idZone+" AND date_heure_debut = '"+req.date_heure_debut+"'" , (err,data) => {
    if(err) throw err;
    response.json("Update zone du calendrier ok");
  });
});

//update des actions effectués sur le quart et passe en terminer = 1
//?idUsine=1&quart=1
app.put("/terminerCalendrierAction/:idUsine/:quart", (request, response) => {
  const req = request.query
  pool.query("update quart_calendrier set termine = 1, idUser = "+req.idUser+" where quart = "+request.params.quart+" AND idUsine = "+request.params.idUsine+" AND idAction = "+req.idAction+" AND date_heure_debut = '"+req.date_heure_debut+"'" , (err,data) => {
    if(err) throw err;
    response.json("Update action du calendrier ok");
  });
});
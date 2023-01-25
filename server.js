/**
****** SQL SERVER ******
*/

const express = require("express");
const bodyParser = require("body-parser");
//pour reécupérer les fichiers envoyés via formData
const multer = require('multer');
const upload = multer();
var cors = require('cors');
const nodemailer = require("nodemailer");
var smtpTransport = require('nodemailer-smtp-transport');
const app = express();
// parse requests of content-type: application/json
app.use(bodyParser.json({limit: '100mb'}));
// parse requests of content-type: application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true, limit: '100mb'}));
//permet les requêtes cros domain
app.use(cors({origin: "*" }));

//utilisation des variables d'environnement
require('dotenv').config();

//Tableau pour le mode hors ligne de la ronde
let BadgeAndElementsOfZone = [];


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

var pool =  new sql.ConnectionPool(sqlConfig);

pool.connect();

var server = app.listen(port, function() {
  var host = server.address().address;
  var port = server.address().port;

  console.log("API PAPREX SQL SERVER en route sur http://%s:%s",host,port);
});

// simple route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to PAPREX's API REST for SQL Server" });
});


/*EMAIL*/
var transporter = nodemailer.createTransport(smtpTransport({
  service: 'paprec',
  host: 'smtpbasic.paprec.fr',
  auth: {
    user: 'no-reply-inovex@paprec.com',
    pass: '$Inove2022**'
  }
}));

var maillist = process.env.MAIL_LIST;
//var maillist = 'nsabre@kerlan-info.fr';

// define a sendmail endpoint, which will send emails and response with the corresponding status
app.get('/sendmail/:dateDeb/:heureDeb/:duree/:typeArret/:commentaire', function(req, res) {
  const message = {
    from: 'Noreply.Inovex@paprec.com', // Sender address
    to: maillist,
    subject: '[NSL] Nouvel Arrêt Intempestif !!!', // Subject line
    html: 'ATTENTION, un arrêt intempestif vient d\'être signalé : '+req.params.typeArret+' pour une durée de '+req.params.duree+ ' heure(s) à partir du '+req.params.dateDeb+' à '+req.params.heureDeb+'. <br> Voici le commentaire : '+req.params.commentaire // Plain text body
  };
  transporter.sendMail(message, function(err, info) {
    if (err) {
      console.log(err);
      throw err;
    } else {
      console.log('Email sent: ' + info.response);
      res.json("mail OK");
    }
  });
});


/* MORAL ENTITIES*/
//get all MoralEntities where Enabled = 1
//?Code=34343
app.get("/moralEntities", (request, response) => {
    const req=request.query
    pool.query('SELECT mr.Id, mr.CreateDate, mr.LastModifiedDate, mr.Name, mr.Address, mr.Enabled, mr.Code, mr.UnitPrice, p.Id as productId, IF(LEFT(mr.Code,3) = "201","OM",IF(LEFT(mr.Code,3) = "202","DIB/DEA",IF(LEFT(mr.Code,3) = "203","DASRI",IF(LEFT(mr.Code,3) = "204","DAOM","Refus de tri")))) as produit,'+ 
    'IF(SUBSTR(mr.Code, 4, 2)="01","CALLERGIE",IF(SUBSTR(mr.Code, 4, 2)="02","INOVA",IF(SUBSTR(mr.Code, 4, 2)="03","PAPREC",IF(SUBSTR(mr.Code, 4, 2)="04","NICOLLIN",IF(SUBSTR(mr.Code, 4, 2)="05","BGV",IF(SUBSTR(mr.Code, 4, 2)="06",'+
    '"SITOMAP",IF(SUBSTR(mr.Code, 4, 2)="07","SIRTOMRA OM",IF(SUBSTR(mr.Code, 4, 2)="08","COMMUNES",IF(SUBSTR(mr.Code, 4, 2)="09","SMICTOM","SMETOM"))))))))) as collecteur FROM moralentities_new as mr '+ 
    'INNER JOIN products_new as p ON LEFT(mr.Code,5) = p.Code '+
    'WHERE mr.Enabled=1 AND mr.Code LIKE "' + req.Code + '%" ORDER BY Name ASC', (err,data) => {
      if(err) throw err;
      data = data['recordset'];
      response.json({data});
    });
});

//get all MoralEntities
//?Code=34343
app.get("/moralEntitiesAll", (request, response) => {
  const req=request.query
  pool.query('SELECT mr.Id, mr.CreateDate, mr.LastModifiedDate, mr.Name, mr.Address, mr.Enabled, mr.Code, mr.UnitPrice, p.Id as productId, IF(LEFT(mr.Code,3) = "201","OM",IF(LEFT(mr.Code,3) = "202","DIB/DEA",IF(LEFT(mr.Code,3) = "203","DASRI",IF(LEFT(mr.Code,3) = "204","DAOM","Refus de tri")))) as produit,'+ 
  'IF(SUBSTR(mr.Code, 4, 2)="01","CALLERGIE",IF(SUBSTR(mr.Code, 4, 2)="02","INOVA",IF(SUBSTR(mr.Code, 4, 2)="03","PAPREC",IF(SUBSTR(mr.Code, 4, 2)="04","NICOLLIN",IF(SUBSTR(mr.Code, 4, 2)="05","BGV",IF(SUBSTR(mr.Code, 4, 2)="06",'+
  '"SITOMAP",IF(SUBSTR(mr.Code, 4, 2)="07","SIRTOMRA OM",IF(SUBSTR(mr.Code, 4, 2)="08","COMMUNES",IF(SUBSTR(mr.Code, 4, 2)="09","SMICTOM","SMETOM"))))))))) as collecteur FROM moralentities_new as mr '+ 
  'INNER JOIN products_new as p ON LEFT(mr.Code,5) = p.Code '+
  'WHERE mr.Code LIKE "' + req.Code + '%" ORDER BY Name ASC', (err,data) => {
    if(err) throw err;
    data = data['recordset'];
      response.json({data});
  });
});

//************ICI */

//create MoralEntitie
//?Name=c&Address=d&Code=f&UnitPrice=g
//ATTENION Unit Price doit contenir un . pour les décimales
app.put("/moralEntitie", (request, response) => {
    const req=request.query
    const query="INSERT INTO moralentities_new SET ?";
    var CURRENT_TIMESTAMP = mysql.raw('now()');
    const params={CreateDate:CURRENT_TIMESTAMP,LastModifiedDate:CURRENT_TIMESTAMP,Name:req.Name,Address:req.Address,Enabled:1,Code:req.Code,UnitPrice:req.UnitPrice}
    pool.query(query,params,(err,result,fields) => {
        if(err) throw err;
        console.log("Création du client OK");
        response.json("Création du client OK");
    });
});

//get Last Code INOVEX
//?Code=29292
app.get("/moralEntitieLastCode", (request, response) => {
  const req=request.query
  pool.query("SELECT Code FROM moralentities_new WHERE CODE LIKE '" + req.Code + "%' ORDER BY Code DESC LIMIT 1", (err,data) => {
    if(err) throw err;
    data = data['recordset'];
      response.json({data});
  });
});

//get One MoralEntitie
app.get("/moralEntitie/:id", (request, response) => {
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
app.put("/moralEntitie/:id", (request, response) => {
  const req=request.query
  pool.query("UPDATE moralentities_new SET UnitPrice = " + req.UnitPrice + ", Code = " + req.Code + " WHERE Id = "+request.params.id, (err,data) => {
    if(err) throw err;
    response.json("Mise à jour du prix unitaire et code INOVEX OK")
  });
});

//UPDATE MoralEntitie, set UnitPrice
//?UnitPrice=2.3
//ATTENION Unit Price doit contenir un . pour les décimales
app.put("/moralEntitieUnitPrice/:id", (request, response) => {
  const req=request.query
  pool.query("UPDATE moralentities_new SET UnitPrice = " + req.UnitPrice + ", LastModifiedDate = NOW() WHERE Id = "+request.params.id, (err,data) => {
    if(err) throw err;
    response.json("Mise à jour du prix unitaire OK")
  });
});

//UPDATE MoralEntitie, set Code
//?Code=123
app.put("/moralEntitieCode/:id", (request, response) => {
  const req=request.query
  pool.query("UPDATE moralentities_new SET Code = " + req.Code + ", LastModifiedDate = NOW() WHERE Id = "+request.params.id, (err,data) => {
    if(err) throw err;
    response.json("Mise à jour du code OK")
  });
});

//UPDATE MoralEntitie, set Enabled
app.put("/moralEntitieEnabled/:id/:enabled", (request, response) => {
  const req=request.query
  pool.query("UPDATE moralentities_new SET Enabled = "+request.params.enabled+", LastModifiedDate = NOW() WHERE Id = "+request.params.id, (err,data) => {
    if(err) throw err;
    response.json("Changement de visibilité du client OK")
  });
});

//UPDATE MoralEntitie, set Name
//?Name=tetet
app.put("/moralEntitieName/:id", (request, response) => {
  const req=request.query
  pool.query("UPDATE moralentities_new SET Name = '"+req.Name+"', LastModifiedDate = NOW() WHERE Id = "+request.params.id, (err,data) => {
    if(err) throw err;
    response.json("Changement de nom du client OK")
  });
});

//DELETE MoralEntitie
app.delete("/moralEntitie/:id", (request, response) => {
  const req=request.query
  pool.query("DELETE FROM moralentities_new WHERE Id = "+request.params.id, (err,data) => {
    if(err) throw err;
    response.json("Suppression du client OK")
  });
});

/*CATEGORIES*/
//get ALL Categories for compteurs
app.get("/CategoriesCompteurs", (request, response) => {
    const req=request.query
    pool.query("SELECT cat.Id, cat.CreateDate, cat.LastModifieddate, cat.Name, cat.Enabled, cat.Code, cat.ParentId, cat2.Name as ParentName "+
    "FROM categories_new as cat LEFT JOIN categories_new as cat2 ON cat.ParentId = cat2.Id "+
    "WHERE cat.Enabled = 1 AND cat.Code > 1 AND LENGTH(cat.Code) > 1  AND cat.Name NOT LIKE 'Tonnage%' AND cat.Name NOT LIKE 'Cendres%' AND cat.Code NOT LIKE '701%' AND cat.Name NOT LIKE 'Mâchefers%' AND cat.Name NOT LIKE 'Arrêts%' AND cat.Name NOT LIKE 'Autres%' AND cat.Name NOT LIKE 'Analyses%' ORDER BY cat.Name ASC", (err,data) => {
      if(err) throw err;
      data = data['recordset'];
      response.json({data});
    });
});

//get ALL Categories for analyses
app.get("/CategoriesAnalyses", (request, response) => {
  const req=request.query
  pool.query("SELECT cat.Id, cat.CreateDate, cat.LastModifieddate, cat.Name, cat.Enabled, cat.Code, cat.ParentId, cat2.Name as ParentName "+
  "FROM categories_new as cat LEFT JOIN categories_new as cat2 ON cat.ParentId = cat2.Id "+
  "WHERE cat.Enabled = 1 AND cat.Code > 1 AND LENGTH(cat.Code) > 1  AND cat.Name LIKE 'Analyses%' ORDER BY cat.Name ASC", (err,data) => {
    if(err) throw err;
    data = data['recordset'];
      response.json({data});
  });
});

//get ALL Categories for sortants
app.get("/CategoriesSortants", (request, response) => {
  const req=request.query
  pool.query("SELECT cat.Id, cat.CreateDate, cat.LastModifieddate, cat.Name, cat.Enabled, cat.Code, cat.ParentId, cat2.Name as ParentName "+
  "FROM categories_new as cat LEFT JOIN categories_new as cat2 ON cat.ParentId = cat2.Id "+
  "WHERE cat.Code LIKE '50%' ORDER BY cat.Name ASC", (err,data) => {
    if(err) throw err;
    data = data['recordset'];
      response.json({data});
  });
});

//create Categorie
//?Name=c&Code=f&ParentId=g
app.put("/Category", (request, response) => {
  const req=request.query
  const query="INSERT INTO categories_new SET ?";
  var CURRENT_TIMESTAMP = mysql.raw('now()');
  const params={CreateDate:CURRENT_TIMESTAMP,LastModifiedDate:CURRENT_TIMESTAMP,Name:req.Name,Enabled:1,Code:req.Code,ParentId:req.ParentId}
  pool.query(query,params,(err,result,fields) => {
      if(err) throw err;
      response.json("Création de la catégorie OK");
  });
});

//get ONE Categorie
app.get("/Category/:Id", (request, response) => {
    const req=request.query
    pool.query("SELECT * FROM categories_new WHERE Id = "+ request.params.Id, (err,data) => {
      if(err) throw err;
      data = data['recordset'];
      response.json({data});
    
    });
});

//Get Catégories filles d'une catégorie mère
app.get("/Categories/:ParentId", (request, response) => {
    const req=request.query
    pool.query("SELECT * FROM categories_new WHERE ParentId = "+ request.params.ParentId, (err,data) => {
      if(err) throw err;
      data = data['recordset'];
      response.json({data});
    
    });
});

//get Last Code INOVEX
//?Code=29292
app.get("/productLastCode", (request, response) => {
  const req=request.query
  pool.query("SELECT Code FROM products_new WHERE CODE LIKE '" + req.Code + "%' ORDER BY Code DESC LIMIT 1", (err,data) => {
    if(err) throw err;
    data = data['recordset'];
      response.json({data});
  });
});

/*PRODUCTS*/
//get ALL Products
app.get("/Products", (request, response) => {
    const req=request.query
    pool.query("SELECT * FROM products_new", (err,data) => {
      if(err) throw err;
      data = data['recordset'];
      response.json({data});;
    });
});

//get ALL Products with type param
//?Name=dgdgd
app.get("/Products/:TypeId", (request, response) => {
  const req=request.query
  pool.query("SELECT * FROM products_new WHERE typeId = "+request.params.TypeId +" AND Name LIKE '%"+req.Name+"%' ORDER BY Name ASC", (err,data) => {
    if(err) throw err;
    data = data['recordset'];
      response.json({data});
  
  });
});

//get Container DASRI
app.get("/Container", (request, response) => {
  const req=request.query
  pool.query("SELECT * FROM products_new WHERE Code LIKE '301010201' ", (err,data) => {
    if(err) throw err;
    data = data['recordset'];
      response.json({data});
  });
});

//UPDATE Product, change Enabled
app.put("/productEnabled/:id/:enabled", (request, response) => {
  const req=request.query
  pool.query("UPDATE products_new SET Enabled = "+request.params.enabled +" , LastModifiedDate = NOW() WHERE Id = "+request.params.id, (err,data) => {
    if(err) throw err;
    response.json("Changement de visibilité du client OK")
  });
});

//UPDATE Product, change TypeId
app.put("/productType/:id/:type", (request, response) => {
  const req=request.query
  pool.query("UPDATE products_new SET TypeId = "+request.params.type +" , LastModifiedDate = NOW() WHERE Id = "+request.params.id, (err,data) => {
    if(err) throw err;
    response.json("Changement de catégorie du produit OK")
  });
});

//UPDATE Product, set Unit
//?Unit=123
app.put("/productUnit/:id", (request, response) => {
  const req=request.query
  pool.query("UPDATE products_new SET Unit = '" + req.Unit + "', LastModifiedDate = NOW() WHERE Id = "+request.params.id, (err,data) => {
    if(err) throw err;
    response.json("Mise à jour de l'unité OK")
  });
});

//get ALL Compteurs
//?Code=ddhdhhd
app.get("/Compteurs", (request, response) => {
  const req=request.query
  pool.query("SELECT * FROM products_new WHERE typeId = 4 AND Enabled = 1 AND Name NOT LIKE 'Arrêt%' AND Code NOT LIKE '701%' AND Name NOT LIKE 'Temps%' AND Code LIKE '" + req.Code + "%' ORDER BY Name", (err,data) => {
    if(err) throw err;
    data = data['recordset'];
      response.json({data});
  
  });
});

//get ALL QSE
app.get("/QSE", (request, response) => {
  const req=request.query
  pool.query("SELECT * FROM products_new WHERE Code LIKE '701%' ORDER BY Name", (err,data) => {
    if(err) throw err;
    data = data['recordset'];
      response.json({data});
  
  });
});

//get ALL Compteurs for arrêts
//?Code=ddhdhhd
app.get("/CompteursArrets", (request, response) => {
  const req=request.query
  pool.query("SELECT * FROM products_new WHERE typeId = 4 AND Name NOT LIKE 'Temps%' AND Enabled = 1 AND Code LIKE '" + req.Code + "%' ORDER BY Name", (err,data) => {
    if(err) throw err;
    data = data['recordset'];
      response.json({data});
  
  });
});

//get ALL Analyses
//?Code=ddhdhhd
app.get("/Analyses", (request, response) => {
  const req=request.query
  pool.query("SELECT * FROM products_new WHERE typeId = 6 AND Enabled = 1 AND Code LIKE '" + req.Code + "%' AND Name NOT LIKE '%1/2%' ORDER BY Name", (err,data) => {
    if(err) throw err;
    data = data['recordset'];
      response.json({data});
  
  });
});

//get Analyses/ Dépassements 1/2 heures
app.get("/AnalysesDep", (request, response) => {
  const req=request.query
  pool.query("SELECT * FROM products_new WHERE typeId = 6 AND Enabled = 1 AND Code LIKE '60104%' ORDER BY Name", (err,data) => {
    if(err) throw err;
    data = data['recordset'];
      response.json({data});
  
  });
});

//get ALL Sortants
//?Code=ddhdhhd
app.get("/Sortants", (request, response) => {
  const req=request.query
  pool.query("SELECT * FROM products_new WHERE typeId = 5 AND Enabled = 1 AND Code LIKE '" + req.Code + "%' ORDER BY Name", (err,data) => {
    if(err) throw err;
    data = data['recordset'];
      response.json({data});
  
  });
});

//get ALL conso & others
app.get("/Consos", (request, response) => {
  const req=request.query
  pool.query("SELECT * FROM products_new WHERE typeId = 2 AND Enabled = 1 AND Code NOT LIKE '801%' ORDER BY Name", (err,data) => {
    if(err) throw err;
    data = data['recordset'];
      response.json({data});
  
  });
});

//get ALL pci
app.get("/pci", (request, response) => {
  const req=request.query
  pool.query("SELECT * FROM products_new WHERE typeId = 2 AND Enabled = 1 AND Code LIKE '801%' ORDER BY Name", (err,data) => {
    if(err) throw err;
    data = data['recordset'];
      response.json({data});
  });
});

//create Product
//?Name=c&Code=f&typeId=g&Unit=j
app.put("/Product", (request, response) => {
  const req=request.query
  const query="INSERT INTO products_new SET ?";
  var CURRENT_TIMESTAMP = new Date();
  const params={CreateDate:CURRENT_TIMESTAMP,LastModifiedDate:CURRENT_TIMESTAMP,Name:req.Name,Enabled:1,Code:req.Code,typeId:req.typeId,Unit:req.Unit}
  pool.query(query,params,(err,result,fields) => {
      if(err) throw err;
      response.json("Création du produit OK");
  });
});

//get ONE Product
app.get("/Product/:Id", (request, response) => {
    const req=request.query
    pool.query("SELECT * FROM products_new WHERE Id = " + request.params.Id, (err,data) => {
      if(err) throw err;
      data = data['recordset'];
      response.json({data});
    });
});

/*FORMULAIRE*/
//create Formulaire
//?Name=j
app.put("/Formulaire", (request, response) => {
  const req=request.query
  const query="INSERT INTO Formulaire SET ?";
  const params={Name:req.Name}
  pool.query(query,params,(err,result,fields) => {
      if(err) throw err;
      response.json("Création du Formulaire OK");
  });
});

//create ProductFormulaire
//?ProductId=J&FormulaireId=K
app.put("/ProductFormulaire", (request, response) => {
  const req=request.query
  const query="INSERT INTO ProductsFormulaire SET ?";
  const params={ProductId:req.ProductId,FormulaireId:req.FormulaireId}
  pool.query(query,params,(err,result,fields) => {
      if(err) throw err;
      response.json("Création du ProductFormulaire OK");
  });
});


/*MEASURES*/
//create Measure
//?EntryDate=1&Value=1&ProductId=1&ProducerId=1
//ATTENION Value doit contenir un . pour les décimales
app.put("/Measure", (request, response) => {
  const req=request.query
  pool.query("INSERT INTO dolibarr.measures_new (CreateDate, LastModifiedDate, EntryDate, Value, ProductId, ProducerId) VALUES (NOW(), NOW(),'"+req.EntryDate+"', "+req.Value+", "+req.ProductId+", "+req.ProducerId+") "+
  "ON DUPLICATE KEY UPDATE "+
  "Value = "+req.Value+", LastModifiedDate =NOW()",(err,result,fields) => {
      if(err) throw err;
      response.json("Création du Measures OK");
  });
});

//get Entry
app.get("/Entrant/:ProductId/:ProducerId/:Date", (request, response) => {
  const req=request.query
  pool.query("SELECT Value FROM `measures_new` WHERE ProductId = " + request.params.ProductId + " AND ProducerId = " + request.params.ProducerId + " AND EntryDate LIKE '"+request.params.Date+"%'", (err,data) => {
    if(err) throw err;
    data = data['recordset'];
      response.json({data});
  });
});

//get value products
app.get("/ValuesProducts/:ProductId/:Date", (request, response) => {
  const req=request.query
  pool.query("SELECT Value FROM `measures_new` WHERE ProductId = " + request.params.ProductId + " AND EntryDate LIKE '"+request.params.Date+"%'", (err,data) => {
    if(err) throw err;
    data = data['recordset'];
      response.json({data});
  });
});

//get Total by day and Type
app.get("/TotalMeasures/:Dechet/:Date", (request, response) => {
  const req=request.query
  pool.query("SELECT COALESCE(SUM(m.Value),0) as Total FROM measures_new as m INNER JOIN products_new as p ON m.ProductId = p.Id WHERE m.EntryDate LIKE '"+request.params.Date+"%' AND m.ProducerId >1 AND p.Code LIKE '"+request.params.Dechet+"%'", (err,data) => {
    if(err) throw err;
    data = data['recordset'];
      response.json({data});
  });
});



/* SAISIE MENSUELLE */
//get value compteurs
app.get("/Compteurs/:Code/:Date", (request, response) => {
  const req=request.query
  pool.query("SELECT Value FROM `saisiemensuelle` WHERE Code = " + request.params.Code + " AND Date LIKE '"+request.params.Date+"%'", (err,data) => {
    if(err) throw err;
    data = data['recordset'];
      response.json({data});
  });
});

//create saisie compteurs
//?Date=1&Value=1&Code=aaa
//ATTENION Value doit contenir un . pour les décimales
app.put("/SaisieMensuelle", (request, response) => {
  const req=request.query
  pool.query("INSERT INTO saisiemensuelle (Date, Code, Value) VALUES ('"+req.Date+"', "+req.Code+", "+req.Value+") "+
  "ON DUPLICATE KEY UPDATE "+
  "Value = "+req.Value,(err,result,fields) => {
      if(err) throw err;
      response.json("Création du saisiemensuelle OK");
  });
});


/*DEPASSEMENT*/
//?dateDebut=dd&dateFin=dd&duree=zz&user=0&dateSaisie=zz&description=erre&productId=2
app.put("/Depassement", (request, response) => {
  const req=request.query
  pool.query("INSERT INTO depassements (date_heure_debut, date_heure_fin, duree, user, date_saisie, description, productId) VALUES ('"+req.dateDebut+"', '"+req.dateFin+"', "+req.duree+", "+req.user+", '"+req.dateSaisie+"', '"+req.description+"', "+req.productId+") "
  ,(err,result,fields) => {
      if(err) response.json("Création du DEP KO");
      else response.json("Création du DEP OK");
  });
});


//Récupérer l'historique des dépassements pour un mois
app.get("/Depassements/:dateDeb/:dateFin", (request, response) => {
  const req=request.query
  pool.query("SELECT a.Id, p.Name, DATE_FORMAT(a.date_heure_debut, '%d/%m/%Y')as dateDebut, DATE_FORMAT(a.date_heure_debut, '%H:%i')as heureDebut, DATE_FORMAT(a.date_heure_fin, '%d/%m/%Y')as dateFin, DATE_FORMAT(a.date_heure_fin, '%H:%i')as heureFin, a.duree, a.description FROM depassements a INNER JOIN products_new p ON p.Id = a.productId WHERE DATE(a.date_heure_debut) BETWEEN '"+request.params.dateDeb+"' AND '"+request.params.dateFin+"' GROUP BY a.date_heure_debut, p.Name ASC", (err,data) => {
    if(err) throw err;
    data = data['recordset'];
      response.json({data});
  });
});

//Supprimer Dépassement
app.delete("/DeleteDepassement/:id", (request, response) => {
  const req=request.query
  pool.query("DELETE FROM depassements WHERE Id = "+request.params.id, (err,data) => {
    if(err) throw err;
    response.json("Suppression du DEP OK");
  });
});

//Récupérer le total des dépassements pour ligne 1
app.get("/DepassementsSum1/:dateDeb/:dateFin", (request, response) => {
  const req=request.query
  pool.query("SELECT 'Total Ligne 1' as Name, COALESCE(SUM(a.duree),0) as Duree FROM depassements a INNER JOIN products_new p ON a.productId = p.Id WHERE DATE(a.date_heure_debut) BETWEEN '"+request.params.dateDeb+"' AND '"+request.params.dateFin+"' AND p.Code LIKE '"+601040101+"'", (err,data) => {
    if(err) throw err;
    data = data['recordset'];
      response.json({data});
  });
});

//Récupérer le total des dépassements pour ligne 2
app.get("/DepassementsSum2/:dateDeb/:dateFin", (request, response) => {
  const req=request.query
  pool.query("SELECT 'Total Ligne 2' as Name, COALESCE(SUM(a.duree),0) as Duree FROM depassements a INNER JOIN products_new p ON a.productId = p.Id WHERE DATE(a.date_heure_debut) BETWEEN '"+request.params.dateDeb+"' AND '"+request.params.dateFin+"' AND p.Code LIKE '"+601040201+"'", (err,data) => {
    if(err) throw err;
    data = data['recordset'];
      response.json({data});
  });
});

//Récupérer le total des dépassements
app.get("/DepassementsSum/:dateDeb/:dateFin", (request, response) => {
  const req=request.query
  pool.query("SELECT 'Total' as Name, COALESCE(SUM(a.duree),0) as Duree FROM depassements a WHERE DATE(a.date_heure_debut) BETWEEN '"+request.params.dateDeb+"' AND '"+request.params.dateFin+"'", (err,data) => {
    if(err) throw err;
    data = data['recordset'];
      response.json({data});
  });
});



/*ARRETS*/
//?dateDebut=dd&dateFin=dd&duree=zz&user=0&dateSaisie=zz&description=erre&productId=2
app.put("/Arrets", (request, response) => {
  const req=request.query
  pool.query("INSERT INTO arrets (date_heure_debut, date_heure_fin, duree, user, date_saisie, description, productId) VALUES ('"+req.dateDebut+"', '"+req.dateFin+"', "+req.duree+", "+req.user+", '"+req.dateSaisie+"', '"+req.description+"', "+req.productId+") "
  ,(err,result,fields) => {
      if(err) response.json("Création de l'arret KO");
      else response.json("Création de l'arret OK");
  });
});

//Récupérer l'historique des arrêts pour un mois
app.get("/Arrets/:dateDeb/:dateFin", (request, response) => {
  const req=request.query
  pool.query("SELECT a.Id, p.Name, DATE_FORMAT(a.date_heure_debut, '%d/%m/%Y')as dateDebut, DATE_FORMAT(a.date_heure_debut, '%H:%i')as heureDebut, DATE_FORMAT(a.date_heure_fin, '%d/%m/%Y')as dateFin, DATE_FORMAT(a.date_heure_fin, '%H:%i')as heureFin, a.duree, a.description FROM arrets a INNER JOIN products_new p ON p.Id = a.productId WHERE DATE(a.date_heure_debut) BETWEEN '"+request.params.dateDeb+"' AND '"+request.params.dateFin+"' GROUP BY a.date_heure_debut, p.Name ASC", (err,data) => {
    if(err) throw err;
    data = data['recordset'];
      response.json({data});
  });
});

//Supprimer Arret
app.delete("/DeleteArret/:id", (request, response) => {
  const req=request.query
  pool.query("DELETE FROM arrets WHERE Id = "+request.params.id, (err,data) => {
    if(err) throw err;
    response.json("Suppression de l'arrêt OK");
  });
});


//Récupérer le total des arrêts par groupe
app.get("/ArretsSumGroup/:dateDeb/:dateFin", (request, response) => {
  const req=request.query
  pool.query("SELECT p.Name, SUM(a.duree) as Duree FROM arrets a INNER JOIN products_new p ON p.Id = a.productId WHERE DATE(a.date_heure_debut) BETWEEN '"+request.params.dateDeb+"' AND '"+request.params.dateFin+"' GROUP BY p.Name", (err,data) => {
    if(err) throw err;
    data = data['recordset'];
      response.json({data});
  });
});


//Récupérer le total des arrêts
app.get("/ArretsSum/:dateDeb/:dateFin", (request, response) => {
  const req=request.query
  pool.query("SELECT 'Total' as Name, COALESCE(SUM(a.duree),0) as Duree FROM arrets a WHERE DATE(a.date_heure_debut) BETWEEN '"+request.params.dateDeb+"' AND '"+request.params.dateFin+"'", (err,data) => {
    if(err) throw err;
    data = data['recordset'];
      response.json({data});
  });
});

//Récupérer le total des arrêts pour four 1
app.get("/ArretsSum1/:dateDeb/:dateFin", (request, response) => {
  const req=request.query
  pool.query("SELECT 'Total Four 1' as Name, COALESCE(SUM(a.duree),0) as Duree FROM arrets a INNER JOIN products_new p ON a.productId = p.Id WHERE DATE(a.date_heure_debut) BETWEEN '"+request.params.dateDeb+"' AND '"+request.params.dateFin+"' AND p.Name LIKE '%1%'", (err,data) => {
    if(err) throw err;
    data = data['recordset'];
      response.json({data});
  });
});

//Récupérer le total des arrêts pour four 2
app.get("/ArretsSum2/:dateDeb/:dateFin", (request, response) => {
  const req=request.query
  pool.query("SELECT 'Total Four 2' as Name, COALESCE(SUM(a.duree),0) as Duree FROM arrets a INNER JOIN products_new p ON a.productId = p.Id WHERE DATE(a.date_heure_debut) BETWEEN '"+request.params.dateDeb+"' AND '"+request.params.dateFin+"' AND p.Name LIKE '%2%'", (err,data) => {
    if(err) throw err;
    data = data['recordset'];
      response.json({data});
  });
});

/*USERS*/
//?nom=dd&prenom=dd&login=zz&pwd=0&isRondier=1&isSaisie=0&isQSE=0&isRapport=0&isAdmin=0
app.put("/User", (request, response) => {
  const req=request.query
  pool.query("INSERT INTO users (Nom, Prenom, login, pwd, isRondier, isSaisie, isQSE, isRapport, isAdmin) VALUES ('"+req.nom+"', '"+req.prenom+"', '"+req.login+"', '"+req.pwd+"', "+req.isRondier+", "+req.isSaisie+", "+req.isQSE+", "+req.isRapport+", "+req.isAdmin+") "
  ,(err,result,fields) => {
      if(err) response.json("Création de l'utilisateur KO");
      else response.json("Création de l'utilisateur OK");
  });
});

//Récupérer l'ensemble des utilisateurs
//?login=aaaa
app.get("/Users", (request, response) => {
  const req=request.query
  pool.query("SELECT * FROM users WHERE login LIKE '%"+req.login+"%' ORDER BY Nom ASC", (err,data) => {
    if(err) throw err;
    data = data['recordset'];
      response.json({data});
  });
});

//Récupérer l'utilisateur qui est connecté
app.get("/User/:login/:pwd", (request, response) => {
  const req=request.query
  pool.query("SELECT * FROM users WHERE login = '"+request.params.login+"' AND pwd = '"+request.params.pwd+"'", (err,data) => {
    if(err) throw err;
    data = data['recordset'];
      response.json({data});
  });
});

//Permet de verifier si l'identifiant est déjà utilisé
app.get("/User/:login", (request, response) => {
  const req=request.query
  pool.query("SELECT * FROM users WHERE login = '"+request.params.login+"'", (err,data) => {
    if(err) throw err;
    data = data['recordset'];
    response.json({data});
  });
});


//Update du mdp utilisateur
app.put("/User/:login/:pwd", (request, response) => {
  const req=request.query
  pool.query("UPDATE users SET pwd = '" + request.params.pwd + "' WHERE login = '"+request.params.login+"'", (err,data) => {
    if(err) throw err;
    response.json("Mise à jour du mot de passe OK")
  });
});

//Update droit rondier
app.put("/UserRondier/:login/:droit", (request, response) => {
  const req=request.query
  pool.query("UPDATE users SET isRondier = '" + request.params.droit + "' WHERE login = '"+request.params.login+"'", (err,data) => {
    if(err) throw err;
    response.json("Mise à jour du droit OK")
  });
});

//Update droit saisie
app.put("/UserSaisie/:login/:droit", (request, response) => {
  const req=request.query
  pool.query("UPDATE users SET isSaisie = '" + request.params.droit + "' WHERE login = '"+request.params.login+"'", (err,data) => {
    if(err) throw err;
    response.json("Mise à jour du droit OK")
  });
});

//Update droit QSE
app.put("/UserQSE/:login/:droit", (request, response) => {
  const req=request.query
  pool.query("UPDATE users SET isQSE = '" + request.params.droit + "' WHERE login = '"+request.params.login+"'", (err,data) => {
    if(err) throw err;
    response.json("Mise à jour du droit OK")
  });
});

//Update droit rapport
app.put("/UserRapport/:login/:droit", (request, response) => {
  const req=request.query
  pool.query("UPDATE users SET isRapport = '" + request.params.droit + "' WHERE login = '"+request.params.login+"'", (err,data) => {
    if(err) throw err;
    response.json("Mise à jour du droit OK")
  });
});

//Update droit admin
app.put("/UserAdmin/:login/:droit", (request, response) => {
  const req=request.query
  pool.query('UPDATE users SET isAdmin = "' + request.params.droit + '" WHERE login = "'+request.params.login+'"', (err,data) => {
    if(err) throw err;
    response.json("Mise à jour du droit OK")
  });
});

//DELETE User
app.delete("/user/:id", (request, response) => {
  const req=request.query
  pool.query("DELETE FROM users WHERE Id = "+request.params.id, (err,data) => {
    if(err) throw err;
    response.json("Suppression du user OK")
  });
});

//Récupérer l'ensemble des users non affecté à un badge
app.get("/UsersLibre", (request, response) => {
  const req=request.query
  pool.query("SELECT * FROM users WHERE Id NOT IN (SELECT userId FROM badge WHERE userId IS NOT NULL) ORDER BY Nom ASC", (err,data) => {
    if(err) throw err;
    data = data['recordset'];
    response.json({data});
  });
});

//*********************
/*******RONDIER*******/
//*********************

/*Badge*/
//?uid=AD:123:D23
app.put("/Badge", (request, response) => {
  const req=request.query
  pool.query("INSERT INTO badge (uid) VALUES ('"+req.uid+"') "
  ,(err,result,fields) => {
      if(err) response.json("Création du badge KO");
      else response.json("Création du badge OK");
  });
});

//Récupérer le dernier ID de badge inséré
app.get("/BadgeLastId", (request, response) => {
  const req=request.query
  pool.query("SELECT DISTINCT LAST_INSERT_ID() as Id FROM badge", (err,data) => {
    console.log(data);
    if(err) throw err;
    data = data['recordset'];
    response.json({data});
  });
});

//Récupérer l'utilisateur lié au badge
app.get("/UserOfBadge/:uid", (request, response) => {
  const req=request.query
  pool.query("SELECT u.Id, u.Nom, u.Prenom, u.login, u.pwd, u.isRondier, u.isSaisie, u.isQSE, u.isRapport, u.isAdmin FROM users u INNER JOIN badge b ON b.userId = u.Id WHERE b.uid LIKE '"+request.params.uid+"'", (err,data) => {
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
app.get("/BadgesUser", (request, response) => {
  const req=request.query
  pool.query("SELECT b.Id, b.isEnabled, b.userId, b.zoneId, b.uid, u.login as affect FROM badge b INNER JOIN users u ON u.Id = b.userId", (err,data) => {
    if(err) throw err;
    data = data['recordset'];
    response.json({data});
  });
});

//Récupérer l'ensemble des badges affecté à une zone
app.get("/BadgesZone", (request, response) => {
  const req=request.query
  pool.query("SELECT b.Id, b.isEnabled, b.userId, b.zoneId, b.uid, z.nom as affect FROM badge b INNER JOIN zonecontrole z ON z.Id = b.zoneId", (err,data) => {
    if(err) throw err;
    data = data['recordset'];
    response.json({data});
  });
});

//Récupérer l'ensemble des badges non affecté
app.get("/BadgesLibre", (request, response) => {
  const req=request.query
  pool.query("SELECT * FROM badge b WHERE b.userId IS NULL AND b.zoneId IS NULL AND b.Id NOT IN (SELECT p.badgeId FROM permisfeu p WHERE p.dateHeureDeb <= NOW() AND p.dateHeureFin > NOW())", (err,data) => {
    if(err) throw err;
    data = data['recordset'];
    response.json({data});
  });
});

//Update enabled
app.put("/BadgeEnabled/:id/:enabled", (request, response) => {
  const req=request.query
  pool.query("UPDATE badge SET isEnabled = '" + request.params.enabled + "' WHERE Id = '"+request.params.id+"'", (err,data) => {
    if(err) throw err;
    response.json("Mise à jour de l'activation OK")
  });
});

//Update affectation
app.put("/BadgeAffectation/:id/:typeAffectation/:idAffectation", (request, response) => {
  const req=request.query
  pool.query("UPDATE badge SET " + request.params.typeAffectation+" = '" + request.params.idAffectation + "' WHERE Id = '"+request.params.id+"'", (err,data) => {
    if(err) throw err;
    response.json("Mise à jour de l'affectation OK")
  });
});

//Update affectation => retirer les affectations
app.put("/BadgeDeleteAffectation/:id", (request, response) => {
  const req=request.query
  pool.query("UPDATE badge SET userId = NULL, zoneId = NULL WHERE Id = '"+request.params.id+"'", (err,data) => {
    if(err) throw err;
    response.json("Mise à jour de l'affectation OK")
  });
});

/*Zone de controle*/
//?nom=dggd&commentaire=fff&four1=1&four2=0
app.put("/zone", (request, response) => {
  const req=request.query
  pool.query("INSERT INTO zonecontrole (nom, commentaire, four1, four2) VALUES ('"+req.nom+"', '"+req.commentaire+"', "+req.four1+", "+req.four2+")"
  ,(err,result,fields) => {
      if(err) response.json("Création de la zone KO");
      else response.json("Création de la zone OK");
  });
});

//Récupérer l'ensemble des zones de controle
app.get("/zones", (request, response) => {
  const req=request.query
  pool.query("SELECT * FROM zonecontrole ORDER BY nom ASC", (err,data) => {
    if(err) throw err;
    data = data['recordset'];
    response.json({data});
  });
});

//POUR MODE HORS LIGNE
//Récupérer l'ensemble des zones, le badge associé et les éléments de contrôle associé ainsi que la valeur de la ronde précédente
app.get("/BadgeAndElementsOfZone", (request, response) => {
  BadgeAndElementsOfZone = [];
  let previousId = 0;
  pool.query("SELECT z.Id as zoneId, z.nom as nomZone, z.commentaire, z.four1, z.four2, b.uid as uidBadge from zonecontrole z INNER JOIN badge b ON b.zoneId = z.Id ORDER BY z.nom ASC", async (err,data) => {
    if(err) throw err;
    else {
      //On récupère l'Id de la ronde précedente
      pool.query("SELECT Id from ronde ORDER BY Id DESC LIMIT 2", (err,data) => {
        if(err) throw err;
        else {
          if(data.length > 1){
            previousId = data[1].Id;
          } else previousId = 0;
        }
      });
      //On boucle sur chaque zone et son badge pour récupérer ses éléments
      for await (const zone of data) {
        await getElementsHorsLigne(zone,previousId);
      };
      response.json({BadgeAndElementsOfZone});
    }
  });
});

function getElementsHorsLigne(zone,previousId) {
  return new Promise((resolve) => {
    let modesOp;
    //Récupération des modesOP
    pool.query("SELECT m.nom, m.fichier FROM modeoperatoire m WHERE zoneId = "+zone.zoneId, (err,data) => {
      if(err) throw err;
      else{
        modesOp = data;
      }
    });

    pool.query("SELECT e.Id, e.zoneId, e.nom, e.valeurMin, e.valeurMax, e.typeChamp, e.unit, e.defaultValue, e.isRegulateur, e.listValues, e.isCompteur, m.value as previousValue FROM elementcontrole e LEFT JOIN mesuresrondier m ON e.Id = m.elementId AND m.rondeId = "+previousId+" WHERE e.zoneId = "+zone.zoneId + " ORDER BY e.ordre ASC", (err,data) => {
      if(err) throw err;
      else{
        let OneBadgeAndElementsOfZone = {
          zoneId : zone.zoneId,
          zone : zone.nomZone,
          commentaire : zone.commentaire,
          badge : zone.uidBadge,
          four1 : zone.four1,
          four2 : zone.four2,
          modeOP : modesOp,
          elements : data
        };
        resolve();
        BadgeAndElementsOfZone.push(OneBadgeAndElementsOfZone);
      }
    });
  });
}

//Update commentaire
app.put("/zoneCommentaire/:id/:commentaire", (request, response) => {
  const req=request.query
  pool.query("UPDATE zonecontrole SET commentaire = '" + request.params.commentaire + "' WHERE Id = '"+request.params.id+"'", (err,data) => {
    if(err) throw err;
    response.json("Mise à jour du commentaire OK")
  });
});

//Update nom
app.put("/zoneNom/:id/:nom", (request, response) => {
  const req=request.query
  pool.query("UPDATE zonecontrole SET nom = '" + request.params.nom + "' WHERE Id = '"+request.params.id+"'", (err,data) => {
    if(err) throw err;
    response.json("Mise à jour du nom OK")
  });
});

//Récupérer l'ensemble des zones non affecté à un badge
app.get("/ZonesLibre", (request, response) => {
  const req=request.query
  pool.query("SELECT * FROM zonecontrole WHERE Id NOT IN (SELECT zoneId FROM badge WHERE zoneId IS NOT NULL) ORDER BY nom ASC", (err,data) => {
    if(err) throw err;
    data = data['recordset'];
    response.json({data});
  });
});

/*Element de controle*/
//?zoneId=1&nom=ddd&valeurMin=1.4&valeurMax=2.5&typeChamp=1&unit=tonnes&defaultValue=1.7&isRegulateur=0&listValues=1 2 3&isCompteur=1&ordre=10
app.put("/element", (request, response) => {
  const req=request.query
  pool.query("INSERT INTO elementcontrole (zoneId, nom, valeurMin, valeurMax, typeChamp, unit, defaultValue, isRegulateur, listValues, isCompteur, ordre) VALUES ("+req.zoneId+", '"+req.nom+"', "+req.valeurMin+", "+req.valeurMax+", "+req.typeChamp+", '"+req.unit+"', '"+req.defaultValue+"', "+req.isRegulateur+", '"+req.listValues+"', "+req.isCompteur+", "+req.ordre+")"
  ,(err,result,fields) => {
      if(err) response.json("Création de l'élément KO");
      else response.json("Création de l'élément OK");
  });
});

//Update ordre elements
//Incrémente les ordres de 1 pour pouvoir insérer une éléments entre 2 éléments existants
//?zoneId=1&maxOrdre=2
app.put("/updateOrdreElement", (request, response) => {
  const req=request.query
  pool.query("UPDATE elementcontrole SET ordre = ordre + 1 WHERE zoneId = " + req.zoneId + " AND ordre > " + req.maxOrdre, (err,data) => {
    if(err) throw err;
    response.json("Mise à jour des ordres OK")
  });
});

//Update element
//?zoneId=1&nom=ddd&valeurMin=1.4&valeurMax=2.5&typeChamp=1&unit=tonnes&defaultValue=1.7&isRegulateur=0&listValues=1 2 3&isCompteur=1&ordre=5
app.put("/updateElement/:id", (request, response) => {
  const req=request.query
  pool.query("UPDATE elementcontrole SET zoneId = " + req.zoneId + ", nom = '"+ req.nom +"', valeurMin = "+ req.valeurMin+", valeurMax = "+ req.valeurMax +", typeChamp = "+ req.typeChamp +", unit = '"+ req.unit +"', defaultValue = '"+ req.defaultValue +"', isRegulateur = "+ req.isRegulateur +", listValues = '"+ req.listValues +"', isCompteur = "+ req.isCompteur +", ordre = "+ req.ordre +" WHERE Id = "+request.params.id, (err,data) => {
    if(err) throw err;
    response.json("Mise à jour de l'element OK")
  });
});

//Suppression element
//?id=12
app.delete("/deleteElement", (request, response) => {
  const req=request.query
  pool.query("DELETE FROM elementcontrole WHERE Id = "+ req.id, (err,data) => {
    if(err) throw err;
    response.json("Suppression de l'élément OK")
  });
});

//Récupérer l'ensemble des élements d'une zone
app.get("/elementsOfZone/:zoneId", (request, response) => {
  const req=request.query
  pool.query("SELECT * FROM elementcontrole WHERE zoneId = "+request.params.zoneId +" ORDER BY ordre ASC", (err,data) => {
    if(err) throw err;
    data = data['recordset'];
    response.json({data});
  });
});

//Récupérer l'ensemble des élements de type compteur
app.get("/elementsCompteur", (request, response) => {
  const req=request.query
  pool.query("SELECT * FROM elementcontrole WHERE isCompteur = 1 ORDER BY ordre ASC", (err,data) => {
    if(err) throw err;
    data = data['recordset'];
    response.json({data});
  });
});

//Récupérer un element 
app.get("/element/:elementId", (request, response) => {
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


/*Ronde*/
//?dateHeure=07/02/2022 08:00&quart=1&userId=1&chefQuartId=1
app.put("/ronde", (request, response) => {
  const req=request.query
  pool.query("INSERT INTO ronde (dateHeure, quart, userId, chefQuartId) VALUES ('"+req.dateHeure+"', "+req.quart+", "+req.userId+", "+req.chefQuartId+")"
  ,(err,result,fields) => {
      if(err) response.json("Création de la ronde KO");
      else response.json("Création de la ronde OK");
  });
});

//Cloture de la ronde avec ou sans commentaire/anomalie
//?commentaire=ejejejeje&image=imageAnomalie&id=1&four1=0&four2=1
app.put("/closeRonde", (request, response) => {
  const req=request.query
  pool.query("UPDATE ronde SET commentaire = '" + req.commentaire +"', image = '" + req.image +"', fonctFour1 = " + req.four1 +"", fonctFour2 = "" + req.four2 + " , isFinished = 1 WHERE id = "+ req.id, (err,data) => {
    if(err) throw err;
    response.json("Cloture de la ronde OK")
  });
});

//Cloture de la ronde encore en cours
//?id=12
app.put("/closeRondeEnCours", (request, response) => {
  const req=request.query
  pool.query("UPDATE ronde SET isFinished = 1, fonctFour1 = 1, fonctFour2 = 1 WHERE id = "+ req.id, (err,data) => {
    if(err) throw err;
    response.json("Cloture de la ronde OK")
  });
});


//Récupérer l'auteur d'une ronde
//?date=07/02/2022
app.get("/AuteurRonde/:quart", (request, response) => {
  const req=request.query
  pool.query("SELECT DISTINCT u.nom, u.prenom FROM ronde r INNER JOIN users u ON r.userId = u.Id WHERE r.dateHeure LIKE '"+req.date+"%' AND r.quart = "+request.params.quart, (err,data) => {
    if(err) throw err;
    data = data['recordset'];
    response.json({data});
  });
});

//Récupérer l'id de la dernière ronde inséré (ronde en cours)
app.get("/LastRonde", (request, response) => {
  const req=request.query
  pool.query("SELECT Id from ronde ORDER BY Id DESC LIMIT 1", (err,data) => {
    if(err) throw err;
    response.json(data[0].Id)
  });
});

//Récupérer l'id de la ronde précédente (0 si première ronde de la BDD)
app.get("/RondePrecedente", (request, response) => {
  const req=request.query
  pool.query("SELECT Id from ronde ORDER BY Id DESC LIMIT 2", (err,data) => {
    if(err) throw err;
    if(data.length>1){
      response.json(data[1].Id)
    }
    else response.json(0)
  });
});

//Récupérer la ronde encore en cours => permettre au rondier de la reprendre
app.get("/LastRondeOpen", (request, response) => {
  const req=request.query
  pool.query("SELECT * from ronde WHERE isFinished = 0 ORDER BY Id DESC LIMIT 1", (err,data) => {
    if(err) throw err;
    response.json(data[0])
  });
});

//Récupérer les rondes et leurs infos pour une date donnée
//?date=07/02/2022
app.get("/Rondes", (request, response) => {
  const req=request.query
  pool.query("SELECT r.Id, r.dateHeure, r.quart, r.commentaire, r.image, r.isFinished, r.fonctFour1, r.fonctFour2, u.Nom, u.Prenom, uChef.Nom as nomChef, uChef.Prenom as prenomChef FROM ronde r INNER JOIN users u ON u.Id = r.userId INNER JOIN users uChef ON uChef.Id = r.chefQuartId WHERE r.dateHeure LIKE '"+req.date+"%' ORDER BY r.quart ASC", (err,data) => {
    if(err) throw err;
    data = data['recordset'];
    response.json({data});
  });
});

//Suppression ronde
//?id=12
app.delete("/deleteRonde", (request, response) => {
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
app.put("/updateMesureRonde", (request, response) => {
  const req=request.query
  pool.query("UPDATE mesuresrondier SET value = '"+req.value+"' WHERE id = "+ req.id, (err,data) => {
    if(err) throw err;
    response.json("Mise à jour de la valeur OK")
  });
});

//Récupérer l'ensemble des mesures pour une ronde => reporting
app.get("/reportingRonde/:idRonde", (request, response) => {
  const req=request.query
  pool.query("SELECT e.Id as elementId, e.unit, e.typeChamp, e.valeurMin, e.valeurMax, e.defaultValue, m.Id, m.value, e.nom, m.modeRegulateur, z.nom as nomZone, r.Id as rondeId FROM mesuresrondier m INNER JOIN elementcontrole e ON m.elementId = e.Id INNER JOIN ronde r ON r.Id = m.rondeId INNER JOIN zonecontrole z ON z.Id = e.zoneId WHERE r.Id = "+request.params.idRonde+" ORDER BY z.nom ASC", (err,data) => {
    if(err) throw err;
    data = data['recordset'];
    response.json({data});
  });
});

//Récupérer la valeur pour un élément de contrôle et une date (quart de nuit => dernier de la journée)
//?id=111&date=dhdhdh
app.get("/valueElementDay", (request, response) => {
  const req=request.query
  pool.query("SELECT m.value FROM mesuresrondier m INNER JOIN ronde r ON m.rondeId = r.Id WHERE r.quart = 3 AND r.dateHeure = '"+req.date+"' AND m.elementId = "+req.id, (err,data) => {
    if(err) throw err;
    data = data['recordset'];
    response.json({data});
  });
});

/*Permis de feu et zone de consignation*/
//?dateHeureDeb=dggd&dateHeureFin=fff&badgeId=1&zone=zone&isPermisFeu=1&numero=fnjfjfj
app.put("/PermisFeu", (request, response) => {
  const req=request.query
  pool.query("INSERT INTO permisfeu (dateHeureDeb, dateHeureFin, badgeId, zone, isPermisFeu, numero) VALUES ('"+req.dateHeureDeb+"', '"+req.dateHeureFin+"', "+req.badgeId+", '"+req.zone+"', "+req.isPermisFeu+", '"+req.numero+"')"
  ,(err,result,fields) => {
      if(err) response.json("Création du permis de feu KO");
      else response.json("Création du permis de feu OK");
  });
})

//Récupérer les permis de feu en cours ou les zones de consignation
app.get("/PermisFeu", (request, response) => {
  const req=request.query
  pool.query("SELECT p.Id, DATE_FORMAT(p.dateHeureDeb, '%d/%m/%Y %H:%i:%s') as dateHeureDeb, DATE_FORMAT(p.dateHeureFin, '%d/%m/%Y %H:%i:%s') as dateHeureFin, b.uid as badge, p.badgeId, p.isPermisFeu, p.zone, p.numero FROM permisfeu p INNER JOIN badge b ON b.Id = p.badgeId WHERE p.dateHeureDeb <= NOW() AND p.dateHeureFin > NOW()", (err,data) => {
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
//?dateHeure=22/06/2022
app.get("/PermisFeuVerification", (request, response) => {
  const req=request.query
  pool.query("SELECT pf.numero, pf.zone, p.rondeId, p.dateHeure, p.userId , p.permisFeuId, p.quart FROM permisfeuvalidation p INNER JOIN permisfeu pf ON pf.Id = p.permisFeuId WHERE p.dateHeure LIKE '%"+req.dateHeure+"%'", (err,data) => {
    if(err) throw err;
    data = data['recordset'];
    response.json({data});
  });
});


/*Mode opératoire*/
//?nom=dggd&zoneId=1
//passage du fichier dans un formData portant le nom 'fichier'
app.post("/modeOP", upload.single('fichier'), (request, response) => {
  const req=request.query;
  var query = "INSERT INTO modeoperatoire SET ?";
  var values = {
      nom: req.nom,
      fichier: request.file.buffer,
      zoneId: req.zoneId
  };
  pool.query(query,values,(err,result,fields) => {
      if(err) {
        console.log(err);
        response.json("Création du modeOP KO");
      }
      else response.json("Création du modeOP OK");
  });
});

//DELETE modeOP
app.delete("/modeOP/:id", (request, response) => {
  const req=request.query
  pool.query("DELETE FROM modeoperatoire WHERE Id = "+request.params.id, (err,data) => {
    if(err) throw err;
    response.json("Suppression du modeOP OK")
  });
});

//Récupérer l'ensemble des modeOP
app.get("/modeOPs", (request, response) => {
  const req=request.query
  pool.query("SELECT m.Id, m.nom, m.fichier, z.nom as nomZone FROM modeoperatoire m INNER JOIN zonecontrole z ON z.Id = m.zoneId", (err,data) => {
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
app.put("/modeOP/:id", (request, response) => {
  const req=request.query
  pool.query("UPDATE modeoperatoire SET fichier = " + req.fichier + " WHERE Id = "+request.params.id, (err,data) => {
    if(err) throw err;
    response.json("Mise à jour du modeOP OK")
  });
});


/*Consignes*/
//?commentaire=dggd&dateFin=fff&type=1
app.put("/consigne", (request, response) => {
  const req=request.query
  pool.query("INSERT INTO consigne (commentaire, date_heure_fin, type) VALUES ('"+req.commentaire+"', '"+req.dateFin+"', "+req.type+")"
  ,(err,result,fields) => {
      if(err) response.json("Création de la consigne KO");
      else response.json("Création de la consigne OK");
  });
});

//Récupérer les consignes en cours
app.get("/consignes", (request, response) => {
  const req=request.query
  pool.query("SELECT DATE_FORMAT(date_heure_fin, '%d/%m/%Y %H:%i:%s') as dateHeureFin, commentaire, id, type FROM consigne WHERE date_heure_fin >= NOW()", (err,data) => {
    if(err) throw err;
    data = data['recordset'];
    response.json({data});
  });
});

//DELETE consigne
app.delete("/consigne/:id", (request, response) => {
  const req=request.query
  pool.query("DELETE FROM consigne WHERE id = "+request.params.id, (err,data) => {
    if(err) throw err;
    response.json("Suppression de la consigne OK")
  });
});

/*Anomalie*/
//?rondeId=1&zoneId=2&commentaire=dggd
//passage de la photo dans un formData portant le nom 'fichier'
app.put("/anomalie", upload.single('fichier'),(request, response) => {
  const req=request.query;
  //console.log(Buffer.from(request.body));
  var query = "INSERT INTO anomalie SET ?";
  var values = {
      rondeId: req.rondeId,
      zoneId: req.zoneId,
      commentaire: req.commentaire,
      photo: Buffer.from(request.body)
  };
  pool.query(query,values,(err,result,fields) => {
      if(err) {
        //console.log(err);
        response.json("Création de l'anomalie KO");
      }
      else response.json("Création de l'anomalie OK");
  });
});

//TODO : inner join avec Ronde ??? Zone ???
//Récupérer les anomalies d'une ronde
app.get("/anomalies/:id", (request, response) => {
  const req=request.query
  pool.query("SELECT * FROM anomalie WHERE rondeId = "+request.params.id, (err,data) => {
    if(err) throw err;
    data = data['recordset'];
    response.json({data});
  });
});


/*
******* SITES
*/
//Récupérer la liste des sites (pour choisir pour l'administration du superAdmin)
//sauf le global
app.get("/sites", (request, response) => {
  const req=request.query
  pool.query("SELECT * FROM site WHERE codeUsine NOT LIKE '000' ORDER BY localisation ASC", (err,data) => {
    if(err) throw err;
    data = data['recordset'];
    response.json({data});
  });
});
/*
******* FIN SITES
*/


/*
******* RAPPORTS
*/
//Récupérer la liste des rapports pour un site en question
app.get("/rapports/:id", (request, response) => {
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
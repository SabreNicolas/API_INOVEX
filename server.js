const express = require("express");
const bodyParser = require("body-parser");
var cors = require('cors');
const nodemailer = require("nodemailer");
var smtpTransport = require('nodemailer-smtp-transport');
const port = 3000;
const app = express();
// parse requests of content-type: application/json
app.use(bodyParser.json());
// parse requests of content-type: application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));
//permet les requêtes cros domain
app.use(cors({origin: "*" }));


//create mysql connection
const mysql = require('mysql');
const { response } = require("express");
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'dolibarrmysql',
    password: 'AD*201903*',
    database: 'dolibarr'
});

// set port, listen for requests
app.listen(port, () => {
    console.log("Server is running on port 3000");
});

// simple route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to INOVEX's API REST" });
});


/*EMAIL*/
var transporter = nodemailer.createTransport(smtpTransport({
  service: 'gmail',
  host: 'smtp.gmail.com',
  auth: {
    user: 'arret.inova@gmail.com',
    pass: 'AD*201903*'
  }
}));

var maillist = 'Laurent.Saintive@inova-groupe.com, raymond.gorak@inova-groupe.com, maintenance.noyelles@inova-groupe.com, Jean-loic.SOUBIGOU@inova-groupe.com';

// define a sendmail endpoint, which will send emails and response with the corresponding status
app.get('/sendmail/:dateDeb/:heureDeb/:duree/:typeArret/:commentaire', function(req, res) {
  const message = {
    from: 'arret.inova@gmail.com', // Sender address
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
    connection.query('SELECT mr.Id, mr.CreateDate, mr.LastModifiedDate, mr.Name, mr.Address, mr.Enabled, mr.Code, mr.UnitPrice, p.Id as productId, IF(LEFT(mr.Code,3) = "201","OM",IF(LEFT(mr.Code,3) = "202","DIB/DEA",IF(LEFT(mr.Code,3) = "203","DASRI",IF(LEFT(mr.Code,3) = "204","DAOM","Refus de tri")))) as produit,'+ 
    'IF(SUBSTR(mr.Code, 4, 2)="01","CALLERGIE",IF(SUBSTR(mr.Code, 4, 2)="02","INOVA",IF(SUBSTR(mr.Code, 4, 2)="03","PAPREC",IF(SUBSTR(mr.Code, 4, 2)="04","NICOLLIN",IF(SUBSTR(mr.Code, 4, 2)="05","BGV",IF(SUBSTR(mr.Code, 4, 2)="06",'+
    '"SITOMAP",IF(SUBSTR(mr.Code, 4, 2)="07","SIRTOMRA OM",IF(SUBSTR(mr.Code, 4, 2)="08","COMMUNES",IF(SUBSTR(mr.Code, 4, 2)="09","SMICTOM","SMETOM"))))))))) as collecteur FROM moralentities_new as mr '+ 
    'INNER JOIN products_new as p ON LEFT(mr.Code,5) = p.Code '+
    'WHERE mr.Enabled=1 AND mr.Code LIKE "' + req.Code + '%" ORDER BY Name ASC', (err,data) => {
      if(err) throw err;
      response.json({data})
    });
});

//get all MoralEntities
//?Code=34343
app.get("/moralEntitiesAll", (request, response) => {
  const req=request.query
  connection.query('SELECT mr.Id, mr.CreateDate, mr.LastModifiedDate, mr.Name, mr.Address, mr.Enabled, mr.Code, mr.UnitPrice, p.Id as productId, IF(LEFT(mr.Code,3) = "201","OM",IF(LEFT(mr.Code,3) = "202","DIB/DEA",IF(LEFT(mr.Code,3) = "203","DASRI",IF(LEFT(mr.Code,3) = "204","DAOM","Refus de tri")))) as produit,'+ 
  'IF(SUBSTR(mr.Code, 4, 2)="01","CALLERGIE",IF(SUBSTR(mr.Code, 4, 2)="02","INOVA",IF(SUBSTR(mr.Code, 4, 2)="03","PAPREC",IF(SUBSTR(mr.Code, 4, 2)="04","NICOLLIN",IF(SUBSTR(mr.Code, 4, 2)="05","BGV",IF(SUBSTR(mr.Code, 4, 2)="06",'+
  '"SITOMAP",IF(SUBSTR(mr.Code, 4, 2)="07","SIRTOMRA OM",IF(SUBSTR(mr.Code, 4, 2)="08","COMMUNES",IF(SUBSTR(mr.Code, 4, 2)="09","SMICTOM","SMETOM"))))))))) as collecteur FROM moralentities_new as mr '+ 
  'INNER JOIN products_new as p ON LEFT(mr.Code,5) = p.Code '+
  'WHERE mr.Code LIKE "' + req.Code + '%" ORDER BY Name ASC', (err,data) => {
    if(err) throw err;
    response.json({data})
  });
});

//create MoralEntitie
//?Name=c&Address=d&Code=f&UnitPrice=g
//ATTENION Unit Price doit contenir un . pour les décimales
app.put("/moralEntitie", (request, response) => {
    const req=request.query
    const query="INSERT INTO moralentities_new SET ?";
    var CURRENT_TIMESTAMP = mysql.raw('now()');
    const params={CreateDate:CURRENT_TIMESTAMP,LastModifiedDate:CURRENT_TIMESTAMP,Name:req.Name,Address:req.Address,Enabled:1,Code:req.Code,UnitPrice:req.UnitPrice}
    connection.query(query,params,(err,result,fields) => {
        if(err) throw err;
        console.log("Création du client OK");
        response.json("Création du client OK");
    });
});

//get Last Code INOVEX
//?Code=29292
app.get("/moralEntitieLastCode", (request, response) => {
  const req=request.query
  connection.query("SELECT Code FROM moralentities_new WHERE CODE LIKE '" + req.Code + "%' ORDER BY Code DESC LIMIT 1", (err,data) => {
    if(err) throw err;
    response.json({data})
  });
});

//get One MoralEntitie
app.get("/moralEntitie/:id", (request, response) => {
    const req=request.query
    connection.query('SELECT * FROM moralentities_new WHERE Id = '+request.params.id, (err,data) => {
      if(err) throw err;
      response.json({data})
    });
});

//UPDATE MoralEntitie, set UnitPrice & Code
//?UnitPrice=2.3&Code=1234
//ATTENION Unit Price doit contenir un . pour les décimales
app.put("/moralEntitie/:id", (request, response) => {
  const req=request.query
  connection.query('UPDATE moralentities_new SET UnitPrice = ' + req.UnitPrice + ', Code = ' + req.Code + ' WHERE Id = '+request.params.id, (err,data) => {
    if(err) throw err;
    response.json("Mise à jour du prix unitaire et code INOVEX OK")
  });
});

//UPDATE MoralEntitie, set UnitPrice
//?UnitPrice=2.3
//ATTENION Unit Price doit contenir un . pour les décimales
app.put("/moralEntitieUnitPrice/:id", (request, response) => {
  const req=request.query
  connection.query('UPDATE moralentities_new SET UnitPrice = ' + req.UnitPrice + ', LastModifiedDate = NOW() WHERE Id = '+request.params.id, (err,data) => {
    if(err) throw err;
    response.json("Mise à jour du prix unitaire OK")
  });
});

//UPDATE MoralEntitie, set Code
//?Code=123
app.put("/moralEntitieCode/:id", (request, response) => {
  const req=request.query
  connection.query('UPDATE moralentities_new SET Code = ' + req.Code + ', LastModifiedDate = NOW() WHERE Id = '+request.params.id, (err,data) => {
    if(err) throw err;
    response.json("Mise à jour du code OK")
  });
});

//UPDATE MoralEntitie, set Enabled
app.put("/moralEntitieEnabled/:id/:enabled", (request, response) => {
  const req=request.query
  connection.query('UPDATE moralentities_new SET Enabled = '+request.params.enabled+', LastModifiedDate = NOW() WHERE Id = '+request.params.id, (err,data) => {
    if(err) throw err;
    response.json("Changement de visibilité du client OK")
  });
});

//UPDATE MoralEntitie, set Name
//?Name=tetet
app.put("/moralEntitieName/:id", (request, response) => {
  const req=request.query
  connection.query('UPDATE moralentities_new SET Name = "'+req.Name+'", LastModifiedDate = NOW() WHERE Id = '+request.params.id, (err,data) => {
    if(err) throw err;
    response.json("Changement de nom du client OK")
  });
});

//DELETE MoralEntitie
app.delete("/moralEntitie/:id", (request, response) => {
  const req=request.query
  connection.query('DELETE FROM moralentities_new WHERE Id = '+request.params.id, (err,data) => {
    if(err) throw err;
    response.json("Suppression du client OK")
  });
});

/*CATEGORIES*/
//get ALL Categories for compteurs
app.get("/CategoriesCompteurs", (request, response) => {
    const req=request.query
    connection.query('SELECT cat.Id, cat.CreateDate, cat.LastModifieddate, cat.Name, cat.Enabled, cat.Code, cat.ParentId, cat2.Name as ParentName '+
    'FROM categories_new as cat LEFT JOIN categories_new as cat2 ON cat.ParentId = cat2.Id '+
    'WHERE cat.Enabled = 1 AND cat.Code > 1 AND LENGTH(cat.Code) > 1  AND cat.Name NOT LIKE "Tonnage%" AND cat.Name NOT LIKE "Cendres%" AND cat.Code NOT LIKE "701%" AND cat.Name NOT LIKE "Mâchefers%" AND cat.Name NOT LIKE "Arrêts%" AND cat.Name NOT LIKE "Autres%" AND cat.Name NOT LIKE "Analyses%" ORDER BY cat.Name ASC', (err,data) => {
      if(err) throw err;
      response.json({data})
    });
});

//get ALL Categories for analyses
app.get("/CategoriesAnalyses", (request, response) => {
  const req=request.query
  connection.query('SELECT cat.Id, cat.CreateDate, cat.LastModifieddate, cat.Name, cat.Enabled, cat.Code, cat.ParentId, cat2.Name as ParentName '+
  'FROM categories_new as cat LEFT JOIN categories_new as cat2 ON cat.ParentId = cat2.Id '+
  'WHERE cat.Enabled = 1 AND cat.Code > 1 AND LENGTH(cat.Code) > 1  AND cat.Name LIKE "Analyses%" ORDER BY cat.Name ASC', (err,data) => {
    if(err) throw err;
    response.json({data})
  });
});

//get ALL Categories for sortants
app.get("/CategoriesSortants", (request, response) => {
  const req=request.query
  connection.query('SELECT cat.Id, cat.CreateDate, cat.LastModifieddate, cat.Name, cat.Enabled, cat.Code, cat.ParentId, cat2.Name as ParentName '+
  'FROM categories_new as cat LEFT JOIN categories_new as cat2 ON cat.ParentId = cat2.Id '+
  'WHERE cat.Code LIKE "50%" ORDER BY cat.Name ASC', (err,data) => {
    if(err) throw err;
    response.json({data})
  });
});

//create Categorie
//?Name=c&Code=f&ParentId=g
app.put("/Category", (request, response) => {
  const req=request.query
  const query="INSERT INTO categories_new SET ?";
  var CURRENT_TIMESTAMP = mysql.raw('now()');
  const params={CreateDate:CURRENT_TIMESTAMP,LastModifiedDate:CURRENT_TIMESTAMP,Name:req.Name,Enabled:1,Code:req.Code,ParentId:req.ParentId}
  connection.query(query,params,(err,result,fields) => {
      if(err) throw err;
      response.json("Création de la catégorie OK");
  });
});

//get ONE Categorie
app.get("/Category/:Id", (request, response) => {
    const req=request.query
    connection.query('SELECT * FROM categories_new WHERE Id = '+ request.params.Id, (err,data) => {
      if(err) throw err;
      response.json({data})
    
    });
});

//Get Catégories filles d'une catégorie mère
app.get("/Categories/:ParentId", (request, response) => {
    const req=request.query
    connection.query('SELECT * FROM categories_new WHERE ParentId = '+ request.params.ParentId, (err,data) => {
      if(err) throw err;
      response.json({data})
    
    });
});

//get Last Code INOVEX
//?Code=29292
app.get("/productLastCode", (request, response) => {
  const req=request.query
  connection.query("SELECT Code FROM products_new WHERE CODE LIKE '" + req.Code + "%' ORDER BY Code DESC LIMIT 1", (err,data) => {
    if(err) throw err;
    response.json({data})
  });
});

/*PRODUCTS*/
//get ALL Products
app.get("/Products", (request, response) => {
    const req=request.query
    connection.query('SELECT * FROM products_new', (err,data) => {
      if(err) throw err;
      response.json({data})
    
    });
});

//get ALL Products with type param
//?Name=dgdgd
app.get("/Products/:TypeId", (request, response) => {
  const req=request.query
  connection.query('SELECT * FROM products_new WHERE typeId = '+request.params.TypeId +' AND Name LIKE "%'+req.Name+'%" ORDER BY Name ASC', (err,data) => {
    if(err) throw err;
    response.json({data})
  
  });
});

//get Container DASRI
app.get("/Container", (request, response) => {
  const req=request.query
  connection.query("SELECT * FROM products_new WHERE Code LIKE '301010201' ", (err,data) => {
    if(err) throw err;
    response.json({data})
  });
});

//UPDATE Product, change Enabled
app.put("/productEnabled/:id/:enabled", (request, response) => {
  const req=request.query
  connection.query('UPDATE products_new SET Enabled = '+request.params.enabled +' , LastModifiedDate = NOW() WHERE Id = '+request.params.id, (err,data) => {
    if(err) throw err;
    response.json("Changement de visibilité du client OK")
  });
});

//UPDATE Product, change TypeId
app.put("/productType/:id/:type", (request, response) => {
  const req=request.query
  connection.query('UPDATE products_new SET TypeId = '+request.params.type +' , LastModifiedDate = NOW() WHERE Id = '+request.params.id, (err,data) => {
    if(err) throw err;
    response.json("Changement de catégorie du produit OK")
  });
});

//UPDATE Product, set Unit
//?Unit=123
app.put("/productUnit/:id", (request, response) => {
  const req=request.query
  connection.query('UPDATE products_new SET Unit = "' + req.Unit + '", LastModifiedDate = NOW() WHERE Id = '+request.params.id, (err,data) => {
    if(err) throw err;
    response.json("Mise à jour de l'unité OK")
  });
});

//get ALL Compteurs
//?Code=ddhdhhd
app.get("/Compteurs", (request, response) => {
  const req=request.query
  connection.query("SELECT * FROM products_new WHERE typeId = 4 AND Enabled = 1 AND Name NOT LIKE 'Arrêt%' AND Code NOT LIKE '701%' AND Name NOT LIKE 'Temps%' AND Code LIKE '" + req.Code + "%' ORDER BY Name", (err,data) => {
    if(err) throw err;
    response.json({data})
  
  });
});

//get ALL QSE
app.get("/QSE", (request, response) => {
  const req=request.query
  connection.query("SELECT * FROM products_new WHERE Code LIKE '701%' ORDER BY Name", (err,data) => {
    if(err) throw err;
    response.json({data})
  
  });
});

//get ALL Compteurs for arrêts
//?Code=ddhdhhd
app.get("/CompteursArrets", (request, response) => {
  const req=request.query
  connection.query("SELECT * FROM products_new WHERE typeId = 4 AND Name NOT LIKE 'Temps%' AND Enabled = 1 AND Code LIKE '" + req.Code + "%' ORDER BY Name", (err,data) => {
    if(err) throw err;
    response.json({data})
  
  });
});

//get ALL Analyses
//?Code=ddhdhhd
app.get("/Analyses", (request, response) => {
  const req=request.query
  connection.query("SELECT * FROM products_new WHERE typeId = 6 AND Enabled = 1 AND Code LIKE '" + req.Code + "%' AND Name NOT LIKE '%1/2%' ORDER BY Name", (err,data) => {
    if(err) throw err;
    response.json({data})
  
  });
});

//get Analyses/ Dépassements 1/2 heures
app.get("/AnalysesDep", (request, response) => {
  const req=request.query
  connection.query("SELECT * FROM products_new WHERE typeId = 6 AND Enabled = 1 AND Code LIKE '60104%' ORDER BY Name", (err,data) => {
    if(err) throw err;
    response.json({data})
  
  });
});

//get ALL Sortants
//?Code=ddhdhhd
app.get("/Sortants", (request, response) => {
  const req=request.query
  connection.query("SELECT * FROM products_new WHERE typeId = 5 AND Enabled = 1 AND Code LIKE '" + req.Code + "%' ORDER BY Name", (err,data) => {
    if(err) throw err;
    response.json({data})
  
  });
});

//get ALL conso & others
app.get("/Consos", (request, response) => {
  const req=request.query
  connection.query("SELECT * FROM products_new WHERE typeId = 2 AND Enabled = 1 AND Code NOT LIKE '801%' ORDER BY Name", (err,data) => {
    if(err) throw err;
    response.json({data})
  
  });
});

//get ALL pci
app.get("/pci", (request, response) => {
  const req=request.query
  connection.query("SELECT * FROM products_new WHERE typeId = 2 AND Enabled = 1 AND Code LIKE '801%' ORDER BY Name", (err,data) => {
    if(err) throw err;
    response.json({data})
  
  });
});

//create Product
//?Name=c&Code=f&typeId=g&Unit=j
app.put("/Product", (request, response) => {
  const req=request.query
  const query="INSERT INTO products_new SET ?";
  var CURRENT_TIMESTAMP = mysql.raw('now()');
  const params={CreateDate:CURRENT_TIMESTAMP,LastModifiedDate:CURRENT_TIMESTAMP,Name:req.Name,Enabled:1,Code:req.Code,typeId:req.typeId,Unit:req.Unit}
  connection.query(query,params,(err,result,fields) => {
      if(err) throw err;
      response.json("Création du produit OK");
  });
});

//get ONE Product
app.get("/Product/:Id", (request, response) => {
    const req=request.query
    connection.query('SELECT * FROM products_new WHERE Id = ' + request.params.Id, (err,data) => {
      if(err) throw err;
      response.json({data})
    
    });
});

/*FORMULAIRE*/
//create Formulaire
//?Name=j
app.put("/Formulaire", (request, response) => {
  const req=request.query
  const query="INSERT INTO Formulaire SET ?";
  const params={Name:req.Name}
  connection.query(query,params,(err,result,fields) => {
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
  connection.query(query,params,(err,result,fields) => {
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
  connection.query("INSERT INTO dolibarr.measures_new (CreateDate, LastModifiedDate, EntryDate, Value, ProductId, ProducerId) VALUES (NOW(), NOW(),'"+req.EntryDate+"', "+req.Value+", "+req.ProductId+", "+req.ProducerId+") "+
  "ON DUPLICATE KEY UPDATE "+
  "Value = "+req.Value+", LastModifiedDate =NOW()",(err,result,fields) => {
      if(err) throw err;
      response.json("Création du Measures OK");
  });
});

//get Entry
app.get("/Entrant/:ProductId/:ProducerId/:Date", (request, response) => {
  const req=request.query
  connection.query('SELECT Value FROM `measures_new` WHERE ProductId = ' + request.params.ProductId + ' AND ProducerId = ' + request.params.ProducerId + ' AND EntryDate LIKE "'+request.params.Date+'%"', (err,data) => {
    if(err) throw err;
    response.json({data})
  });
});

//get value products
app.get("/ValuesProducts/:ProductId/:Date", (request, response) => {
  const req=request.query
  connection.query('SELECT Value FROM `measures_new` WHERE ProductId = ' + request.params.ProductId + ' AND EntryDate LIKE "'+request.params.Date+'%"', (err,data) => {
    if(err) throw err;
    response.json({data})
  });
});

//get Total by day and Type
app.get("/TotalMeasures/:Dechet/:Date", (request, response) => {
  const req=request.query
  connection.query('SELECT COALESCE(SUM(m.Value),0) as Total FROM measures_new as m INNER JOIN products_new as p ON m.ProductId = p.Id WHERE m.EntryDate LIKE "'+request.params.Date+'%" AND m.ProducerId >1 AND p.Code LIKE "'+request.params.Dechet+'%"', (err,data) => {
    if(err) throw err;
    response.json({data})
  });
});



/* SAISIE MENSUELLE */
//get value compteurs
app.get("/Compteurs/:Code/:Date", (request, response) => {
  const req=request.query
  connection.query('SELECT Value FROM `saisiemensuelle` WHERE Code = ' + request.params.Code + ' AND Date LIKE "'+request.params.Date+'%"', (err,data) => {
    if(err) throw err;
    response.json({data})
  });
});

//create saisie compteurs
//?Date=1&Value=1&Code=aaa
//ATTENION Value doit contenir un . pour les décimales
app.put("/SaisieMensuelle", (request, response) => {
  const req=request.query
  connection.query("INSERT INTO saisiemensuelle (Date, Code, Value) VALUES ('"+req.Date+"', "+req.Code+", "+req.Value+") "+
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
  connection.query("INSERT INTO depassements (date_heure_debut, date_heure_fin, duree, user, date_saisie, description, productId) VALUES ('"+req.dateDebut+"', '"+req.dateFin+"', "+req.duree+", "+req.user+", '"+req.dateSaisie+"', '"+req.description+"', "+req.productId+") "
  ,(err,result,fields) => {
      if(err) response.json("Création du DEP KO");
      else response.json("Création du DEP OK");
  });
});


//Récupérer l'historique des dépassements pour un mois
app.get("/Depassements/:dateDeb/:dateFin", (request, response) => {
  const req=request.query
  connection.query('SELECT a.Id, p.Name, DATE_FORMAT(a.date_heure_debut, "%d/%m/%Y")as dateDebut, DATE_FORMAT(a.date_heure_debut, "%H:%i")as heureDebut, DATE_FORMAT(a.date_heure_fin, "%d/%m/%Y")as dateFin, DATE_FORMAT(a.date_heure_fin, "%H:%i")as heureFin, a.duree, a.description FROM depassements a INNER JOIN products_new p ON p.Id = a.productId WHERE DATE(a.date_heure_debut) BETWEEN "'+request.params.dateDeb+'" AND "'+request.params.dateFin+'" GROUP BY a.date_heure_debut, p.Name ASC', (err,data) => {
    if(err) throw err;
    response.json({data})
  });
});

//Supprimer Dépassement
app.delete("/DeleteDepassement/:id", (request, response) => {
  const req=request.query
  connection.query('DELETE FROM depassements WHERE Id = '+request.params.id, (err,data) => {
    if(err) throw err;
    response.json("Suppression du DEP OK");
  });
});

//Récupérer le total des dépassements pour ligne 1
app.get("/DepassementsSum1/:dateDeb/:dateFin", (request, response) => {
  const req=request.query
  connection.query('SELECT "Total Ligne 1" as Name, COALESCE(SUM(a.duree),0) as Duree FROM depassements a INNER JOIN products_new p ON a.productId = p.Id WHERE DATE(a.date_heure_debut) BETWEEN "'+request.params.dateDeb+'" AND "'+request.params.dateFin+'" AND p.Code LIKE "'+601040101+'"', (err,data) => {
    if(err) throw err;
    response.json({data})
  });
});

//Récupérer le total des dépassements pour ligne 2
app.get("/DepassementsSum2/:dateDeb/:dateFin", (request, response) => {
  const req=request.query
  connection.query('SELECT "Total Ligne 2" as Name, COALESCE(SUM(a.duree),0) as Duree FROM depassements a INNER JOIN products_new p ON a.productId = p.Id WHERE DATE(a.date_heure_debut) BETWEEN "'+request.params.dateDeb+'" AND "'+request.params.dateFin+'" AND p.Code LIKE "'+601040201+'"', (err,data) => {
    if(err) throw err;
    response.json({data})
  });
});

//Récupérer le total des dépassements
app.get("/DepassementsSum/:dateDeb/:dateFin", (request, response) => {
  const req=request.query
  connection.query('SELECT "Total" as Name, COALESCE(SUM(a.duree),0) as Duree FROM depassements a WHERE DATE(a.date_heure_debut) BETWEEN "'+request.params.dateDeb+'" AND "'+request.params.dateFin+'"', (err,data) => {
    if(err) throw err;
    response.json({data})
  });
});



/*ARRETS*/
//?dateDebut=dd&dateFin=dd&duree=zz&user=0&dateSaisie=zz&description=erre&productId=2
app.put("/Arrets", (request, response) => {
  const req=request.query
  connection.query("INSERT INTO arrets (date_heure_debut, date_heure_fin, duree, user, date_saisie, description, productId) VALUES ('"+req.dateDebut+"', '"+req.dateFin+"', "+req.duree+", "+req.user+", '"+req.dateSaisie+"', '"+req.description+"', "+req.productId+") "
  ,(err,result,fields) => {
      if(err) response.json("Création de l'arret KO");
      else response.json("Création de l'arret OK");
  });
});

//Récupérer l'historique des arrêts pour un mois
app.get("/Arrets/:dateDeb/:dateFin", (request, response) => {
  const req=request.query
  connection.query('SELECT a.Id, p.Name, DATE_FORMAT(a.date_heure_debut, "%d/%m/%Y")as dateDebut, DATE_FORMAT(a.date_heure_debut, "%H:%i")as heureDebut, DATE_FORMAT(a.date_heure_fin, "%d/%m/%Y")as dateFin, DATE_FORMAT(a.date_heure_fin, "%H:%i")as heureFin, a.duree, a.description FROM arrets a INNER JOIN products_new p ON p.Id = a.productId WHERE DATE(a.date_heure_debut) BETWEEN "'+request.params.dateDeb+'" AND "'+request.params.dateFin+'" GROUP BY a.date_heure_debut, p.Name ASC', (err,data) => {
    if(err) throw err;
    response.json({data})
  });
});

//Supprimer Arret
app.delete("/DeleteArret/:id", (request, response) => {
  const req=request.query
  connection.query('DELETE FROM arrets WHERE Id = '+request.params.id, (err,data) => {
    if(err) throw err;
    response.json("Suppression de l'arrêt OK");
  });
});


//Récupérer le total des arrêts par groupe
app.get("/ArretsSumGroup/:dateDeb/:dateFin", (request, response) => {
  const req=request.query
  connection.query('SELECT p.Name, SUM(a.duree) as Duree FROM arrets a INNER JOIN products_new p ON p.Id = a.productId WHERE DATE(a.date_heure_debut) BETWEEN "'+request.params.dateDeb+'" AND "'+request.params.dateFin+'" GROUP BY p.Name', (err,data) => {
    if(err) throw err;
    response.json({data})
  });
});


//Récupérer le total des arrêts
app.get("/ArretsSum/:dateDeb/:dateFin", (request, response) => {
  const req=request.query
  connection.query('SELECT "Total" as Name, COALESCE(SUM(a.duree),0) as Duree FROM arrets a WHERE DATE(a.date_heure_debut) BETWEEN "'+request.params.dateDeb+'" AND "'+request.params.dateFin+'"', (err,data) => {
    if(err) throw err;
    response.json({data})
  });
});

//Récupérer le total des arrêts pour four 1
app.get("/ArretsSum1/:dateDeb/:dateFin", (request, response) => {
  const req=request.query
  connection.query('SELECT "Total Four 1" as Name, COALESCE(SUM(a.duree),0) as Duree FROM arrets a INNER JOIN products_new p ON a.productId = p.Id WHERE DATE(a.date_heure_debut) BETWEEN "'+request.params.dateDeb+'" AND "'+request.params.dateFin+'" AND p.Name LIKE "%1%"', (err,data) => {
    if(err) throw err;
    response.json({data})
  });
});

//Récupérer le total des arrêts pour four 2
app.get("/ArretsSum2/:dateDeb/:dateFin", (request, response) => {
  const req=request.query
  connection.query('SELECT "Total Four 2" as Name, COALESCE(SUM(a.duree),0) as Duree FROM arrets a INNER JOIN products_new p ON a.productId = p.Id WHERE DATE(a.date_heure_debut) BETWEEN "'+request.params.dateDeb+'" AND "'+request.params.dateFin+'" AND p.Name LIKE "%2%"', (err,data) => {
    if(err) throw err;
    response.json({data})
  });
});

/*USERS*/
//?nom=dd&prenom=dd&login=zz&pwd=0&isRondier=1&isSaisie=0&isQSE=0&isRapport=0&isAdmin=0
app.put("/User", (request, response) => {
  const req=request.query
  connection.query("INSERT INTO users (Nom, Prenom, login, pwd, isRondier, isSaisie, isQSE, isRapport, isAdmin) VALUES ('"+req.nom+"', '"+req.prenom+"', '"+req.login+"', '"+req.pwd+"', "+req.isRondier+", "+req.isSaisie+", "+req.isQSE+", "+req.isRapport+", "+req.isAdmin+") "
  ,(err,result,fields) => {
      if(err) response.json("Création de l'utilisateur KO");
      else response.json("Création de l'utilisateur OK");
  });
});

//Récupérer l'ensemble des utilisateurs
//?login=aaaa
app.get("/Users", (request, response) => {
  const req=request.query
  connection.query('SELECT * FROM users WHERE login LIKE "%'+req.login+'%" ORDER BY Nom ASC', (err,data) => {
    if(err) throw err;
    response.json({data})
  });
});

//Récupérer l'utilisateur qui est connecté
app.get("/User/:login/:pwd", (request, response) => {
  const req=request.query
  connection.query('SELECT * FROM users WHERE login = "'+request.params.login+'" AND pwd = "'+request.params.pwd+'"', (err,data) => {
    if(err) throw err;
    response.json({data})
  });
});

//Permet de verifier si l'identifiant est déjà utilisé
app.get("/User/:login", (request, response) => {
  const req=request.query
  connection.query('SELECT * FROM users WHERE login = "'+request.params.login+'"', (err,data) => {
    if(err) throw err;
    response.json({data})
  });
});


//Update du mdp utilisateur
app.put("/User/:login/:pwd", (request, response) => {
  const req=request.query
  connection.query('UPDATE users SET pwd = "' + request.params.pwd + '" WHERE login = "'+request.params.login+'"', (err,data) => {
    if(err) throw err;
    response.json("Mise à jour du mot de passe OK")
  });
});

//Update droit rondier
app.put("/UserRondier/:login/:droit", (request, response) => {
  const req=request.query
  connection.query('UPDATE users SET isRondier = "' + request.params.droit + '" WHERE login = "'+request.params.login+'"', (err,data) => {
    if(err) throw err;
    response.json("Mise à jour du droit OK")
  });
});

//Update droit saisie
app.put("/UserSaisie/:login/:droit", (request, response) => {
  const req=request.query
  connection.query('UPDATE users SET isSaisie = "' + request.params.droit + '" WHERE login = "'+request.params.login+'"', (err,data) => {
    if(err) throw err;
    response.json("Mise à jour du droit OK")
  });
});

//Update droit QSE
app.put("/UserQSE/:login/:droit", (request, response) => {
  const req=request.query
  connection.query('UPDATE users SET isQSE = "' + request.params.droit + '" WHERE login = "'+request.params.login+'"', (err,data) => {
    if(err) throw err;
    response.json("Mise à jour du droit OK")
  });
});

//Update droit rapport
app.put("/UserRapport/:login/:droit", (request, response) => {
  const req=request.query
  connection.query('UPDATE users SET isRapport = "' + request.params.droit + '" WHERE login = "'+request.params.login+'"', (err,data) => {
    if(err) throw err;
    response.json("Mise à jour du droit OK")
  });
});

//Update droit admin
app.put("/UserAdmin/:login/:droit", (request, response) => {
  const req=request.query
  connection.query('UPDATE users SET isAdmin = "' + request.params.droit + '" WHERE login = "'+request.params.login+'"', (err,data) => {
    if(err) throw err;
    response.json("Mise à jour du droit OK")
  });
});

//DELETE User
app.delete("/user/:id", (request, response) => {
  const req=request.query
  connection.query('DELETE FROM users WHERE Id = '+request.params.id, (err,data) => {
    if(err) throw err;
    response.json("Suppression du user OK")
  });
});


/*******RONDIER*******/

/*Badge*/
//?uid=AD:123:D23
app.put("/Badge", (request, response) => {
  const req=request.query
  connection.query("INSERT INTO badge (uid) VALUES ('"+req.uid+"') "
  ,(err,result,fields) => {
      if(err) response.json("Création du badge KO");
      else response.json("Création du badge OK");
  });
});

//Récupérer l'ensemble des badges affecté à un User
app.get("/BadgesUser", (request, response) => {
  const req=request.query
  connection.query('SELECT b.Id, b.isEnabled, b.userId, b.zoneId, b.uid, u.Nom, u.Prenom, u.login FROM badge b INNER JOIN users u ON u.Id = b.userId', (err,data) => {
    if(err) throw err;
    response.json({data})
  });
});

//Récupérer l'ensemble des badges affecté à une zone
app.get("/BadgesZone", (request, response) => {
  const req=request.query
  connection.query('SELECT b.Id, b.isEnabled, b.userId, b.zoneId, b.uid, z.nom as nomZone FROM badge b INNER JOIN zonecontrole z ON z.Id = b.zoneId', (err,data) => {
    if(err) throw err;
    response.json({data})
  });
});

//Récupérer l'ensemble des badges activé et non affecté
app.get("/BadgesLibre", (request, response) => {
  const req=request.query
  connection.query('SELECT * FROM badge WHERE isEnabled = 1 AND userId IS NULL AND zoneId IS NULL', (err,data) => {
    if(err) throw err;
    response.json({data})
  });
});

//Update enabled
app.put("/BadgeEnabled/:id/:enabled", (request, response) => {
  const req=request.query
  connection.query('UPDATE badge SET isEnabled = "' + request.params.enabled + '" WHERE Id = "'+request.params.id+'"', (err,data) => {
    if(err) throw err;
    response.json("Mise à jour de l'activation OK")
  });
});

//Update affectation
app.put("/BadgeAffectation/:id/:typeAffectation/:idAffectation", (request, response) => {
  const req=request.query
  connection.query('UPDATE badge SET ' + request.params.typeAffectation+' = "' + request.params.idAffectation + '" WHERE Id = "'+request.params.id+'"', (err,data) => {
    if(err) throw err;
    response.json("Mise à jour de l'affectation OK")
  });
});

/*Zone de controle*/
//?nom=dggd
app.put("/zone", (request, response) => {
  const req=request.query
  connection.query("INSERT INTO zonecontrole (nom) VALUES ('"+req.nom+"')"
  ,(err,result,fields) => {
      if(err) response.json("Création de la zone KO");
      else response.json("Création de la zone OK");
  });
});

//Récupérer l'ensemble des zones de controle
app.get("/zones", (request, response) => {
  const req=request.query
  connection.query('SELECT * FROM zonecontrole', (err,data) => {
    if(err) throw err;
    response.json({data})
  });
});

//Update commentaire
app.put("/zoneCommentaire/:id/:commentaire", (request, response) => {
  const req=request.query
  connection.query('UPDATE zonecontrole SET commentaire = "' + request.params.commentaire + '" WHERE Id = "'+request.params.id+'"', (err,data) => {
    if(err) throw err;
    response.json("Mise à jour du commentaire OK")
  });
});

/*Element de controle*/
//?zoneId=1&nom=ddd&valeurMin=1.4&valeurMax=2.5&typeChamp=1&isFour=0&isGlobal=1&unit=tonnes&defaultValue=1.7&isRegulateur=0
app.put("/element", (request, response) => {
  const req=request.query
  connection.query("INSERT INTO elementcontrole (zoneId, nom, valeurMin, valeurMax, typeChamp, isFour, isGlobal, unit, defaultValue, isRegulateur) VALUES ("+req.zoneId+", '"+req.nom+"', "+req.valeurMin+", "+req.valeurMax+", "+req.typeChamp+", "+req.isFour+", "+req.isGlobal+", '"+req.unit+"', "+req.defaultValue+", "+req.isRegulateur+")"
  ,(err,result,fields) => {
      if(err) response.json("Création de l'élément KO");
      else response.json("Création de l'élément OK");
  });
});

//Récupérer l'ensemble des élements d'une zone
app.get("/elementsOfZone/:zoneId", (request, response) => {
  const req=request.query
  connection.query('SELECT * FROM elementcontrole WHERE zoneId = '+request.params.zoneId, (err,data) => {
    if(err) throw err;
    response.json({data})
  });
});

//Récupérer l'ensemble des élements pour lesquelles il n'y a pas de valeur sur la ronde en cours
//?date=07/02/2022
app.get("/elementsOfRonde/:quart", (request, response) => {
  const req=request.query
  connection.query("SELECT Id FROM elementcontrole WHERE Id NOT IN (SELECT elementId FROM mesuresrondier WHERE dateHeure LIKE '"+req.date+"%' AND quart = "+request.params.quart+")", (err,data) => {
    if(err) throw err;
    response.json({data})
  });
});

/*Mesures Rondier*/
//?elementId=1&dateHeure=07/02/2022 08:00&quart=1&isFour1=1&isFour2=0&modeRegulateur=AP&value=2.4&userId=1
app.put("/mesureRondier", (request, response) => {
  const req=request.query
  connection.query("INSERT INTO mesuresrondier (elementId, dateHeure, quart, isFour1, isFour2, modeRegulateur, value, userId) VALUES ("+req.elementId+", '"+req.dateHeure+"', "+req.quart+", "+req.isFour1+", "+req.isFour2+", '"+req.modeRegulateur+"', "+req.value+", "+req.userId+")"
  ,(err,result,fields) => {
      if(err) response.json("Création de la mesure KO");
      else response.json("Création de la mesure OK");
  });
});

//Récupérer l'ensemble des mesures pour une date/quart donné
//?date=07/02/2022
app.get("/reportingRonde/:quart", (request, response) => {
  const req=request.query
  connection.query("SELECT m.value, e.nom FROM mesuresrondier m INNER JOIN elementcontrole e ON m.elementId = e.Id WHERE m.dateHeure LIKE '"+req.date+"%' AND m.quart = "+request.params.quart, (err,data) => {
    if(err) throw err;
    response.json({data})
  });
});

//Récupérer l'auteur d'une ronde
//?date=07/02/2022
app.get("/AuteurRonde/:quart", (request, response) => {
  const req=request.query
  connection.query("SELECT DISTINCT u.nom, u.prenom FROM mesuresrondier m INNER JOIN users u ON m.userId = u.Id WHERE m.dateHeure LIKE '"+req.date+"%' AND m.quart = "+request.params.quart, (err,data) => {
    if(err) throw err;
    response.json({data})
  });
});
const express = require("express");
const bodyParser = require("body-parser");
var cors = require('cors');
const port = 3000;
const app = express();
// parse requests of content-type: application/json
app.use(bodyParser.json());
// parse requests of content-type: application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));
//permet les requêtes cros domain
app.use(cors());

//create mysql connection
const mysql = require('mysql');
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


/* MORAL ENTITIES*/
//get all MoralEntities
//?Code=34343
app.get("/moralEntities", (request, response) => {
    const req=request.query
    connection.query('SELECT mr.Id, mr.CreateDate, mr.LastModifiedDate, mr.Name, mr.Address, mr.Enabled, mr.Code, mr.UnitPrice, p.Id as productId, IF(LEFT(mr.Code,3) = "201","OM",IF(LEFT(mr.Code,3) = "202","DIB/DEA",IF(LEFT(mr.Code,3) = "203","DASRI",IF(LEFT(mr.Code,3) = "204","DAOM","Refus de tri")))) as produit,'+ 
    'IF(SUBSTR(mr.Code, 4, 2)="01","INOVA",IF(SUBSTR(mr.Code, 4, 2)="02","VEOLIA",IF(SUBSTR(mr.Code, 4, 2)="03","PAPREC",IF(SUBSTR(mr.Code, 4, 2)="04","NICOLLIN",IF(SUBSTR(mr.Code, 4, 2)="05","BGV",IF(SUBSTR(mr.Code, 4, 2)="06",'+
    '"SITOMAP",IF(SUBSTR(mr.Code, 4, 2)="07","SIRTOMRA OM",IF(SUBSTR(mr.Code, 4, 2)="08","COMMUNES",IF(SUBSTR(mr.Code, 4, 2)="09","SMICTOM","SMETOM"))))))))) as collecteur FROM moralentities_new as mr '+ 
    'INNER JOIN products_new as p ON LEFT(mr.Code,5) = p.Code '+
    'WHERE mr.Enabled=1 AND mr.Code LIKE "' + req.Code + '%" ORDER BY Name ASC', (err,data) => {
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

//UPDATE MoralEntitie, set Enabled=0
app.put("/moralEntitieEnabled/:id", (request, response) => {
  const req=request.query
  connection.query('UPDATE moralentities_new SET Enabled = 0, LastModifiedDate = NOW() WHERE Id = '+request.params.id, (err,data) => {
    if(err) throw err;
    response.json("Désactivation du client OK")
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
    'WHERE cat.Enabled = 1 AND cat.Code > 1 AND LENGTH(cat.Code) > 1  AND cat.Name NOT LIKE "Tonnage%" AND cat.Name NOT LIKE "Autres%" AND cat.Name NOT LIKE "Analyses%" ORDER BY cat.Name ASC', (err,data) => {
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

//get ALL Compteurs
//?Code=ddhdhhd
app.get("/Compteurs", (request, response) => {
  const req=request.query
  connection.query("SELECT * FROM products_new WHERE typeId = 4 AND Enabled = 1 AND Code LIKE '" + req.Code + "%' ORDER BY Name", (err,data) => {
    if(err) throw err;
    response.json({data})
  
  });
});

//get ALL Analyses
//?Code=ddhdhhd
app.get("/Analyses", (request, response) => {
  const req=request.query
  connection.query("SELECT * FROM products_new WHERE typeId = 6 AND Enabled = 1 AND Code LIKE '" + req.Code + "%' ORDER BY Name", (err,data) => {
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

//TODO : 
  //-création MoralEntities ==> OK
  //-modification MoralEntities (code Inovex + Prix)
  //-delete MoralEntities

  //-création catégories ==> OK
//-modification cat
//-delete catégories

  //-création products ==> OK
//-modification product
//-delete product

  //-saisie fin de mois (add measures) ==> OK
  //-saisie tonnage (add measures) ==> OK
//-modification measure
//-delete measure

  //-insert ProductCategorie ==> OK
//-modification ProductCattegorie
//-delete ProductCattegorie

  //-création formulaire de saisie ==> OK
//-modification formulaire
//-delete formulaire

//-prevoir arret
//-prevoir productCategorie
//-prevoir productPreferred
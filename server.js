const express = require("express");
const bodyParser = require("body-parser");
const port = 3000;
const app = express();
// parse requests of content-type: application/json
app.use(bodyParser.json());
// parse requests of content-type: application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));

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
app.get("/moralEntities", (request, response) => {
    const req=request.query
    connection.query('SELECT * FROM moralentities_new', (err,data) => {
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
        response.json("Création du client OK");
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

/*CATEGORIES*/
//get ALL Categories
app.get("/Categories", (request, response) => {
    const req=request.query
    connection.query('SELECT * FROM categories_new', (err,data) => {
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

/*PRODUCTS*/
//get ALL Products
app.get("/Products", (request, response) => {
    const req=request.query
    connection.query('SELECT * FROM products_new', (err,data) => {
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

//-saisie fin de mois (add measures)
//-saisie tonnage (add measures)
//-modification measure
//-delete measure

//-insert ProductCategorie
//-modification ProductCattegorie
//-delete ProductCattegorie

  //-création formualaire de saisie ==> OK
//-modification formulaire
//-delete formulaire

//-prevoir arret
//-prevoir productCategorie
//-prevoir productPreferred
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

//get all MoralEntities
app.get("/moralEntities", (request, response) => {
    const req=request.query
    connection.query('SELECT * FROM moralentities_new', (err,data) => {
      if(err) throw err;
      response.json({data})
    
    });
});

//TODO : 
//-création MoralEntities
//-modification MoralEntities (code Inovex + Prix)
//-création catégories
//-création products
//-saisie fin de mois
//-saisie tonnage (measures)
//-création formualaire de saisie (comment stocker cela en BDD ???)
const express = require('express');
const router = express.Router();
const pool = require('../db');
const middleware = require('../token/middleware.js');
console.log(middleware)
//get all MoralEntities where Enabled = 1
//?Code=34343&idUsine=1
router.get("/", middleware,(request, response) => {
    const reqQ=request.query
    pool.query("SELECT mr.Id, mr.CreateDate, mr.LastModifiedDate, mr.Name, mr.Address, mr.Enabled, mr.Code, mr.UnitPrice, p.Id as productId, LEFT(p.Name,CHARINDEX(' ',p.Name)) as produit, SUBSTRING(p.Name,CHARINDEX(' ',p.Name),500000) as collecteur FROM moralentities_new as mr "+ 
    "INNER JOIN products_new as p ON LEFT(p.Code,5) LIKE LEFT(mr.Code,5) AND p.idUsine = mr.idUsine "+
    "WHERE mr.idUsine = "+reqQ.idUsine+" AND mr.Enabled = 1 AND p.Code = LEFT(mr.Code,LEN(p.Code)) AND mr.Code LIKE '" + reqQ.Code + "%' ORDER BY Name ASC", (err,data) => {
      if(err){
      currentLineError=currentLine(); throw err;
    }
      data = data['recordset'];
      response.json({data});
    });
});
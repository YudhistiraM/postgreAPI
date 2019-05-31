var express = require('express');
var router = express.Router();
const path = require('path');
const fileUpload = require('express-fileupload');

module.exports = function(pool){

  //Add product
  router.post('/', (req, res) => {
    let productName = req.body.productName;
    let productDesc = req.body.productDesc;
    let productEnable = req.body.productEnable;
    let categoryName = req.body.categoryName;
    let categoryEnable = req.body.categoryEnable;
    let imageEnable = req.body.imageEnable;

    let sql =
    `INSERT INTO product (name, description, enable) VALUES ('${data.productName}', '${data.productDesc}', '${data.productEnable}') RETURNING *`;
    pool.query(sql, (err, insertProduct) => {
      let sql2 = `INSERT INTO category (category_name, category_enable) VALUES ('${data.categoryName}', '${data.categoryEnable}') RETURNING *`;
      pool.query(sql2, (err, insertCategory) => {
        let sql3 = `INSERT INTO category_product (id_category, id_product) VALUES (${insertCategory.rows[0].category_id}, ${insertProduct.rows[0].id})`;
          pool.query(sql3).then(() => {
                console.log("data :", insertProduct.rows[0]);
                console.log("data :", insertCategory.rows[0]);
                res.json({
                  success : true,
                  message : "data has been added",
                  data :{
                    productName : insertProduct.rows[0].name,
                    descriptionProduct : insertProduct.rows[0].description,
                    productCategory : insertCategory.rows[0].category_name
                  }
                })
              }).catch(err => {
                res.json({
                  success: false,
                  message: "adding data has been failed",
                })
              })
            })
          })
        })
  return router;
}

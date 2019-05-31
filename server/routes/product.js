var express = require('express');
var router = express.Router();
const path = require('path');
const fileUpload = require('express-fileupload');

module.exports = function(pool){

  //Add product
  router.post('/',(req, res) => {
    let data = {
      productName: req.body.productName,
      productDesc: req.body.productDesc,
      productEnable: req.body.productEnable,
      categoryName: req.body.categoryName,
      categoryEnable: req.body.categoryEnable,
      imageEnable : req.body.imageEnable
    }

    // Upload File
    let fileImage = req.files.doc;
    let imageName = `${data.productName}` + '-' + fileImage.name;

    // console.log("File Image :", fileImage);
    // console.log("Image Name :", imageName);

    fileImage.mv(path.join(__dirname, '../public/upload/') + imageName, function(err) {
      if(err){
        console.log(err);
      }else{
        console.log("Uploaded");
      }
    });

    let sql =
    `INSERT INTO product (name, description, enable) VALUES ('${data.productName}', '${data.productDesc}', '${data.productEnable}') RETURNING *`;
    pool.query(sql, (err, insertProduct) => {
      let sql2 = `INSERT INTO category (category_name, category_enable) VALUES ('${data.categoryName}', '${data.categoryEnable}') RETURNING *`;
      pool.query(sql2, (err, insertCategory) => {
        let sql3 = `INSERT INTO category_product (id_category, id_product) VALUES (${insertCategory.rows[0].category_id}, ${insertProduct.rows[0].id})`;
        pool.query(sql3, (err) => {
          let sql4 = `INSERT INTO image (image_name, image_file, image_enable) VALUES ('${imageName}', '${fileImage.name}', '${data.imageEnable}') RETURNING *`;
          pool.query(sql4, (err, insertImage) => {
            let sql5 = `INSERT INTO product_image (product_id, image_id) VALUES (${insertProduct.rows[0].id}, ${insertImage.rows[0].id})`;
            pool.query(sql5).then(() => {
                // console.log("data :", data.rows[0]);
                res.json({
                  success : true,
                  message : "data has been added",
                  data :{
                    productName : insertProduct.rows[0].name,
                    descriptionProduct : insertProduct.rows[0].description,
                    productCategory : insertCategory.rows[0].category_name,
                    productImage : insertImage.rows[0].image_name
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
    })
  })

  // READ
  return router;
}

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
  router.get('/', (req, res) => {
    let sql =
    `SELECT product.id, product.name, product.description, category.category_name, image.image_file, image.image_name, product.enable, image.image_enable, category.category_enable
    FROM product
    INNER JOIN category_product ON category_product.id_product = product.id
    INNER JOIN category ON category.category_id = category_product.id_category
    INNER JOIN product_image ON product_image.product_id = product.id
    INNER JOIN image ON image.id = product_image.image_id`;
    pool.query(sql).then( listProduct =>{
      res.json({
        Data: listProduct.rows
      })
    }).catch(err => {
      res.json({error: true,
      message: `something went wrong : ${err.message}`
      })
    })
  })

  //UPDATE
  router.put('/:id', (req,res) =>{
    let id = req.params.id;
    let data ={
      productName : req.body.productName,
      productDesc : req.body.productDesc,
      productEnable: req.body.productEnable,
      categoryName: req.body.categoryName,
      categoryEnable: req.body.categoryEnable,
      imageEnable: req.body.imageEnable
    }

    let sql =`UPDATE product SET name='${data.productName}', description='${data.productDesc}', enable='${data.productEnable}'
    WHERE product.id = ${id} RETURNING *`;
    pool.query(sql, (err, updateProduct) => {
        let sql2 =`SELECT id_category FROM category_product WHERE id_product = ${id}`;
        pool.query(sql2, (err, listCategory) => {
          // console.log("List :", listCategory.rows[0].id_category);
          let sql3 =`UPDATE category SET category_name='${data.categoryName}', category_enable='${data.categoryEnable}'
          WHERE category.category_id = ${listCategory.rows[0].id_category} RETURNING *`;
          pool.query(sql3, (err, updateCategory) =>{
            let sql4 = `SELECT image_id FROM product_image WHERE product_id = ${id}`;
            pool.query(sql4, (err, listImage) => {
              let sql5 =`UPDATE image SET image_name='${imageName}', image_file='${fileImage.name}', image_enable= '${data.imageEnable}'
              WHERE image.id= ${listImage.rows[0].image_id}`;
              pool.query(sql5).then(() => {
                    res.json({
                      success: true,
                      message: "Data Has been updated",
                      data:{
                        productName : updateProduct.rows[0].name,
                        descriptionProduct : updateProduct.rows[0].description,
                        productCategory : updateCategory.rows[0].category_name,
                        productImage : `${fileImage.name}`
                      }
                    })
              }).catch( err => {
                res.json({
                  success: false,
                  message: "updating data has been failed",
                  data:null
                })
              })
            })
          })
        })
      })
    })
  })


  // DELETE
  router.delete('/delete/:id', (req, res) => {
      let id = req.params.id;

      let sql =`SELECT id_category FROM category_product WHERE id_product = ${id}`;
      pool.query(sql, (err, idCategory) => {
        if(idCategory.rowCount == 0){
          res.json({
            success: false,
            message: `Deleted failed id : ${id} not found`,
            data:null
          })
        }else{
          let sql2 = `SELECT image_id FROM product_image WHERE product_id = ${id}`;
          pool.query(sql2, (err, idImage) => {
            let sql3 = `DELETE FROM category_product WHERE id_product = ${id}`;
            pool.query(sql3, (err) => {
              let sql4 = `DELETE FROM product_image WHERE product_id = ${id}`;
              pool.query(sql4,(err) =>{
                let sql5 = `DELETE FROM category WHERE category_id = ${idCategory.rows[0].id_category}`;
                pool.query(sql5, (err) => {
                  let sql6 = `DELETE FROM image WHERE id = ${idImage.rows[0].image_id}`;
                  pool.query(sql6, (err) =>{
                    let sql7 = `DELETE FROM product WHERE id = ${id}`;
                    pool.query(sql7).then(() => {
                        res.json({
                            success: true,
                            message: "Data Deleted",
                          })
                      }).catch( err => {
                        res.json({
                          success: false,
                          message: "Deleted has been failed",
                        })
                      })
                    })
                  })
                })
              })
            })
          }
        })
      })

  return router;
}

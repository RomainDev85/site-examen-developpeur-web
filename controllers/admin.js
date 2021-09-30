const fileUpload = require("express-fileupload");

module.exports = {
    adminHome: async (req, res) => {
        const id = req.params.id

        try {
            const users = await query("SELECT ifnull(count(user.id), 0) AS nb_user FROM user")
            const posts = await query("SELECT ifnull(count(item.id), 0) AS nb_post FROM item")
            const categories = await query("SELECT id, title FROM category")
            const category = await query("SELECT ifnull(count(category.id), 0) AS nb_category FROM category")
            const profil = await query("SELECT  u.id, u.firstname, u.lastname, DATE_FORMAT(u.birthday, '%d/%m/%Y') AS birthday, u.email, u.image, ifnull(count(s.good) + count(s.bad), 0) AS status, ifnull((SELECT count(id) FROM item WHERE id_user = u.id GROUP BY id_user), 0) AS nb_item FROM user AS u LEFT OUTER JOIN status AS s ON s.id_user = u.id WHERE u.id = ? GROUP BY u.id", [id])
            res.render("admin-home-page", {users: users[0], posts: posts[0], category: category[0], profil: profil[0], categories, error: req.flash("error"), success: req.flash("success")})
        } catch(err) {
            res.send(err)
        }
    },
    
    // Display list user ("/admin/user")
    showAllUser: async (req, res) => {
        try {
            const users = await query(`SELECT  u.id, u.firstname, u.lastname, u.status AS status_user, DATE_FORMAT(u.birthday, "%d/%m/%Y") AS birthday, u.email, u.image, ifnull(count(s.good) + count(s.bad), 0) AS status, ifnull((SELECT count(id) FROM item WHERE id_user = u.id GROUP BY id_user), 0) AS nb_item FROM user AS u LEFT OUTER JOIN status AS s ON s.id_user = u.id GROUP BY u.id;`)
            // res.json({ users })
            res.render("admin-user-list", {users, error: req.flash("error"), success: req.flash("success")})
        } catch(err){
            res.send(err)
        }
    },
    // Switch status user block/unblock ("/admin/user/:id/status")
    statusUser: async (req, res) => {
        const id = req.params.id;

        try {
            const switchStatus = await query("SELECT status FROM user WHERE id = ?", [id])
            if(switchStatus[0].status === 0){
                await query("UPDATE user SET status = 1 WHERE id = ?", [id])
                req.flash("success", "L'utilisateur est dorénavant débloqué"),
                res.redirect(`/admin/user`)
            } else {
                await query("UPDATE user SET status = 0 WHERE id = ?", [id])
                req.flash("success", "L'utilisateur est dorénavant bloqué"),
                res.redirect(`/admin/user`)
            }
        }catch(err){
            res.send(err)
        }
    },
    // Switch status post visible/unvisible ("/admin/item/:id/status")
    statusItem: async (req, res) => {
        const id = req.params.id

        try {
            const switchStatus = await query("SELECT status FROM item WHERE id = ?", [id])
            if(switchStatus[0].status === 0){
                await query("UPDATE item SET status = 1 WHERE id = ?", [id])
                req.flash("success", "L'article est dorénavant visible"),
                res.redirect(`/admin/item`)
            } else {
                await query("UPDATE item SET status = 0 WHERE id = ?", [id])
                req.flash("success", "L'article est dorénavant invisible"),
                res.redirect(`/admin/item`)
            }
        } catch(err){
            res.send(err)
        }
    },

    // Delete one post ("/admin/delete/item/:id")
    adminDeleteItem: (req, res) => {
        const id = req.params.id
        const queryDB = "DELETE FROM item WHERE id = ?"

        connection.query(queryDB, [id], (error, results) => {
              if(error){
                  res.send(error)
              } else {
                  // res.json("L'article à bien été supprimé")
                  req.flash("success", "L'article à bien été supprimer"),
                  res.redirect(`/admin/item`)
              }
            }
        );
    },

    // Display list item ("/admin/item")
    showItem: async (req, res) => {
        try {
            const items = await query("SELECT i.id, i.status AS status_item, c.title AS category, u.firstname, u.lastname, i.title, i.content, i.image, DATE_FORMAT(i.date, '%d/%m/%Y') AS date, ifnull(count(s.bad), 0) as bad_status, ifnull(count(s.good), 0) AS good_status FROM item AS i INNER JOIN user AS u ON u.id = i.id_user INNER JOIN category AS c ON c.id = i.id_category LEFT OUTER JOIN status AS s ON s.id_item = i.id GROUP BY i.id ORDER BY i.date DESC")
            // res.json({items})
            res.render("admin-post-list", {items, error: req.flash("error"), success: req.flash("success")})
        } catch(err){
            res.send(err)
        }
    },
    // Create post ("/admin/item")
    adminCreateItem: async (req, res) => {
        const title = req.body.title
        const content = req.body.content
        const id_category = req.body.category
        const id_user = req.session.userID
        
        if(!title || !content || id_category === "null" ){
            // res.json("Remplissez tout les champs")
            req.flash("error", "Remplissez tout les champs"),
            res.redirect(`/admin/${id_user}`)
        } else {
            if(!req.files){
                // res.json("Ajouter une image a votre article")
                req.flash("error", "Ajouter une image a votre article"),
                res.redirect(`/admin/${id_user}`)
            } else {
                let imageUpload = req.files.image
                let image = `/images/${imageUpload.name}`

                if(imageUpload.mimetype === "image/jpeg" || imageUpload.mimetype === "image/jpg" || imageUpload.mimetype === "image/gif" || imageUpload.mimetype === "image/png"){
                    imageUpload.mv(`public/images/${imageUpload.name}`, async function(err){
                        if(err){
                            res.send(err)
                        }
                        try {
                            const post = await query("INSERT INTO item (title, content, image, date, id_user, id_category, status) VALUES (?, ?, ?, now(), ?, ?, 1)", [title, content, image, id_user, id_category])
                            // res.json({post})
                            req.flash("success", "L'article à bien été crée"),
                            res.redirect(`/admin/${id_user}`)
                        }catch(err){
                            res.send(err)
                        }
                    })
                } else {
                    // res.json("L'image n'a pas le format adequate")
                    req.flash("error", "L'image n'a pas le format adéquate"),
                    res.redirect(`/admin/${id_user}`)
                }
            }
        }
    },
    // Show list of comment of item ("/admin/item/:id/comment")
    getListComment: (req, res) => {
        const id = req.params.id
        const queryDB = "SELECT u.firstname, u.lastname, c.content FROM comment AS c INNER JOIN user AS u ON u.id = c.id_user WHERE c.id_item = ?"

        connection.query(queryDB, [id], (error, results) => {
            if(error){
                res.send(error)
            } else {
                console.log(results);
                res.json(results)
            }
          }
        );
    },
    // Show list of like and dislike of item ("/admin/item/:id/user-review")
    getListUserReview: async (req, res) => {
        const id = req.params.id

        try {
            const dislike = await query("SELECT i.title, u.firstname, u.lastname, s.user_review FROM status AS s INNER JOIN item AS i ON i.id = s.id_item INNER JOIN user AS u ON u.id = s.id_user WHERE s.user_review = 2 AND s.id_item = ?", [id])
            const like = await query("SELECT i.title, u.firstname, u.lastname, s.user_review FROM status AS s INNER JOIN item AS i ON i.id = s.id_item INNER JOIN user AS u ON u.id = s.id_user WHERE s.user_review = 1 AND s.id_item = ?", [id])
            res.json({dislike, like})
        } catch(err){
            res.send(err)
        }
    },
    // Admin create category ("/admin/category")
    adminCreateCategory: async (req, res) => {
        const title = req.body.title
        const content = req.body.content
        const id_user = req.session.userID
        
        if(!title || !content){
            // res.json("Remplissez tout les champs")
            req.flash("error", "Remplissez tout les champs"),
            res.redirect(`/admin/${id_user}`)
        } else {
            if(!req.files){
                // res.json("Ajouter une image a votre article")
                req.flash("error", "Ajouter une image à la categorie"),
                res.redirect(`/admin/${id_user}`)
            } else {
                let imageUpload = req.files.image
                let image = `/images/${imageUpload.name}`

                if(imageUpload.mimetype === "image/jpeg" || imageUpload.mimetype === "image/jpg" || imageUpload.mimetype === "image/gif" || imageUpload.mimetype === "image/png"){
                    imageUpload.mv(`public/images/${imageUpload.name}`, async function(err){
                        if(err){
                            res.send(err)
                        }
                        try {
                            await query("INSERT INTO category (title, content, image, date, id_user) VALUES (?, ?, ?, NOW(), ?)", [title, content, image, id_user])
                            // res.json("La categorie à bien été ajoutée")
                            req.flash("success", "La categorie à bien été ajoutée"),
                            res.redirect(`/admin/${id_user}`)
                        }catch(err){
                            res.send(err)
                        }
                    })
                } else {
                   // res.json("L'image n'a pas le format adequate")
                   req.flash("error", "L'image n'a pas le format adequate"),
                    res.redirect(`/admin/${id_user}`)
                }
            }
        }
    },
    adminDeleteCategory: (req, res) => {
        idCategory = req.params.id
        queryDB = "DELETE FROM category WHERE id = ?"

        connection.query(queryDB, [idCategory], (error) => {
            if(error){
                res.send(error)
            } else {
                res.json("La categorie à bien été supprimé")
            }
          }
        );
    },
    // Delete user ('/admin/delete/user/:id')
    adminDeleteUser: async (req, res) => {
        const id = req.params.id

        try {
            await query("DELETE FROM user WHERE id = ?", [id])
            req.flash("success", "L'utilisateur a bien été supprimé"),
            res.redirect(`/admin/user`)
        } catch(err){
            res.send(err)
        }

    },
    // Display list of category ('/admin/category')
    showCategory: async (req, res) => {
        try {
            const categories = await query("SELECT id, image, title, content FROM category")
            // res.json({categories})
            res.render("admin-category-list", {categories})
        } catch(err) {
            res.send(err)
        }
    },
    // Display page edit of category
    pageEditCategory: async (req, res) => {
        const id = req.params.id

        try {
            const category = await query("SELECT id, title, image, content FROM category WHERE id = ?", [id])
            res.render("admin-edit-category", {category: category[0], error: req.flash("error"), success: req.flash("success")})
            // res.json({category: category[0]})
        } catch(err){
            res.send(err)
        }
    },
    // Edit image of category
    editImageCategory: async (req, res) => {
        const id = req.params.id

        if (!req.files){
            req.flash("error", "Selectionner une image"),
            res.redirect(`back`)
        } else {
    
        let imageUpload = req.files.image
        // var for upload name image in mySQL
        let image = `/images/${imageUpload.name}` 
            
            
        // if the image has the correct format
        if (imageUpload.mimetype === "image/jpeg" || imageUpload.mimetype === "image/jpg" || imageUpload.mimetype === "image/gif" || imageUpload.mimetype === "image/png") {
            // Use the mv() method to place the file somewhere in NodeJS
            imageUpload.mv(`public/images/${imageUpload.name}`, async function(err) {
                if (err){
                    return res.status(500).send(err);
                }
                try{
                    await query("UPDATE category SET image = ? WHERE id = ?", [image, id])
                    req.flash("success", "L'image a bien été mis à jour"),
                    res.redirect(`back`)
                } catch(err) {
                    res.send(err)
                }
            });
        } else {
            req.flash("error", "Le format de l'image n'est pas correct"),
            res.redirect(`back`)
        }}
    },
    editContentCategory: async (req, res) => {
        const id = req.params.id
        const title = req.body.title
        const content = req.body.content

        console.log(content);
        console.log(title);

        try {
            if(!title || !content){
                req.flash("error", "Les champs doivent être rempli"),
                res.redirect(`back`)
            } else {
                await query("UPDATE category SET title = ?, content = ? WHERE id = ?", [title, content, id])
                req.flash("success", "Les informations ont bien été mis à jour"),
                res.redirect(`/admin/edit/category/${id}`)
            }
        } catch(err){
            res.send(err)
        }
    },
    // Display page edit post
    pageEditPost: async (req, res) => {
        const id = req.params.id

        try {
            const post = await query("SELECT i.id AS id_post, i.title AS title_post, i.image, c.id AS id_category, c.title AS title_category, i.content FROM item AS i INNER JOIN category AS c ON c.id = i.id_category WHERE i.id = ?", [id])
            const categories = await query("SELECT id, title FROM category")
            res.render("admin-edit-post", {post: post[0], error: req.flash("error"), success: req.flash("success"), categories})
            // res.json({post: post[0], categories})
        } catch(err){
            res.send(err)
        }
    },
    // Change image of the post 
    editImagePost: async (req, res) => {
        const id = req.params.id

        if (!req.files){
            req.flash("error", "Selectionner une image"),
            res.redirect(`back`)
        } else {
    
        let imageUpload = req.files.image
        // var for upload name image in mySQL
        let image = `/images/${imageUpload.name}` 
            
            
        // if the image has the correct format
        if (imageUpload.mimetype === "image/jpeg" || imageUpload.mimetype === "image/jpg" || imageUpload.mimetype === "image/gif" || imageUpload.mimetype === "image/png") {
            // Use the mv() method to place the file somewhere in NodeJS
            imageUpload.mv(`public/images/${imageUpload.name}`, async function(err) {
                if (err){
                    return res.status(500).send(err);
                }
                try{
                    await query("UPDATE item SET image = ? WHERE id = ?", [image, id])
                    req.flash("success", "L'image a bien été mis à jour"),
                    res.redirect(`back`)
                } catch(err) {
                    res.send(err)
                }
            });
        } else {
            req.flash("error", "Le format de l'image n'est pas correct"),
            res.redirect(`back`)
        }}
    },
    // Chnage content of the post
    editContentPost: async (req, res) => {
        const id = req.params.id
        const title = req.body.title
        const content = req.body.content
        const id_category = req.body.category

        console.log(content);
        console.log(title);

        try {
            if(!title || !content || id_category === "null"){
                req.flash("error", "Les champs doivent être rempli, n'oubliez pas de sélectionnez une catégorie"),
                res.redirect(`back`)
            } else {
                await query("UPDATE item SET title = ?, content = ?, id_category = ? WHERE id = ?", [title, content, id_category, id])
                req.flash("success", "Les informations ont bien été mis à jour"),
                res.redirect(`/admin/edit/post/${id}`)
            }
        } catch(err){
            res.send(err)
        }
    }

}
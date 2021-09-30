const bcrypt = require('bcrypt');
const fileUpload = require("express-fileupload");

module.exports = {
    // User add post ("/user/item/:id")
    createItem: async (req, res) => {
        const id = req.params.id
        const title = req.body.title
        const content = req.body.content
        const id_category = req.body.category
        const userID = req.session.userID
        
        if(!title || !content || id_category === "null" ){
            // res.json("Remplissez tout les champs")
            req.flash("error", "Remplissez tout les champs"),
                res.redirect(`/user/${userID}`)
        } else {
            if(!req.files){
                // res.json("Ajouter une image a votre article")
                req.flash("error", "Ajoutez une image à votre article"),
                res.redirect(`/user/${userID}`)
            } else {
                let imageUpload = req.files.image
                let image = `/images/${imageUpload.name}`

                if(imageUpload.mimetype === "image/jpeg" || imageUpload.mimetype === "image/jpg" || imageUpload.mimetype === "image/gif" || imageUpload.mimetype === "image/png"){
                    imageUpload.mv(`public/images/${imageUpload.name}`, async function(err){
                        if(err){
                            res.send(err)
                        }
                        try {
                            const post = await query("INSERT INTO item (title, content, image, date, id_user, id_category, status) VALUES (?, ?, ?, now(), ?, ?, 0)", [title, content, image, id, id_category])
                            // res.json("Ok")
                            req.flash("success", "L'article à bien été ajouté"),
                            res.redirect(`/user/${userID}`)
                        }catch(err){
                            res.send(err)
                        }
                    })
                } else {
                    // res.json("L'image n'a pas le format adequate")
                    req.flash("error", "L'image n'a pas le format adéquate"),
                    res.redirect(`/user/${userID}`)

                }
            }
        }
    },
    // User delete post ("/user/item/:id")
    deleteItem: async (req, res) => {
        const id = req.params.id;
        const userID = req.session.userID

        try {
            await query("DELETE FROM item WHERE id = ? AND id_user = ?", [id, userID])
            // res.json("L'article à bien été supprimé")
            req.flash("success", "L'article à bien été supprimé"),
            res.redirect(`/user/${userID}`)

        } catch(err){
            res.send(err)
        }
    },
    // User edit post ("/user/edit/item/:id")
    editItem: async (req, res) => {
        const id = req.params.id
        const title = req.body.title
        const content = req.body.content

        if(!title || !content){
            res.json("Remplissez tout les champs")
        }
        if(!req.files){
            try{
                await query("UPDATE item SET title = ?, content = ?, date = now(), status = 0 WHERE id = ?", [title, content, id])
                res.json("Article à bien été mis à jour mais pas l'image")
            } catch(err){
                res.send(err)
            }
        }
        let imageUpload = req.files.image
        let image = `/images/${imageUpload.name}`

        if (imageUpload.mimetype === "image/jpeg" || imageUpload.mimetype === "image/jpg" || imageUpload.mimetype === "image/gif" || imageUpload.mimetype === "image/png") {
            imageUpload.mv(`public/images/${imageUpload.name}`, async function(err) {
                if (err){
                    return res.status(500).send(err);
                }
                try{
                    await query("UPDATE item SET image = ?, title = ?, content = ?, date = now(), status = 0 WHERE id = ?",[image, title, content, id])
                    res.json("L'article à bien été mis a jour ainsi que l'image")
                }catch(err) {
                    res.send(err)
                }
            });
        }
    },
    // Show user page ("/user/:id")
    getUserPage: async (req, res) => {
        const id = req.params.id;

        try {
            const posts = await query("SELECT i.id AS id_post, c.title AS category ,u.id, u.firstname, u.lastname, i.title, i.content, i.image, i.date, ifnull(count(s.bad), 0) as bad_status, ifnull(count(s.good), 0) AS good_status, ifnull(count(comment.id), 0) AS comment FROM item AS i INNER JOIN user AS u ON u.id = i.id_user INNER JOIN category AS c ON c.id = i.id_category LEFT OUTER JOIN comment ON comment.id_item = i.id LEFT OUTER JOIN status AS s ON s.id_item = i.id WHERE u.id = ? GROUP BY i.id ORDER BY i.date DESC", [id])
            const profil = await query("SELECT  u.id, u.firstname, u.lastname, DATE_FORMAT(u.birthday, '%d/%m/%Y') AS birthday, u.email, u.image, ifnull(count(s.good) + count(s.bad), 0) AS status, ifnull((SELECT count(id) FROM item WHERE id_user = u.id GROUP BY id_user), 0) AS nb_item FROM user AS u LEFT OUTER JOIN status AS s ON s.id_user = u.id WHERE u.id = ? GROUP BY u.id", [id])
            const categories = await query("SELECT id, title FROM category")
            const listStatus = await query("SELECT i.id AS id_post, i.id_category, i.title, s.bad, s.good FROM status AS s INNER JOIN item AS i ON i.id = s.id_item WHERE s.id_user = ?", [id])
            const birthday = profil[0].birthday.split('')
            const day = birthday[0] + birthday[1]
            const month = birthday[3] + birthday[4]
            const year = birthday[6] + birthday[7] + birthday[8] + birthday[9]
            const birthdayDate = { day, month, year }
            
            // console.log(profil[0].birthday);
            console.log(profil);
            // console.log(birthdayDate);
            // res.json({post, profil})
            res.render("user-home-page", {categories, listStatus, profil: profil[0], posts, birthdayDate, error: req.flash("error"), success: req.flash("success")})
        } catch(err){
            res.send(err)
        }
    },
    //Delete status like/dislike
    deleteLikeOrDislike: async (req, res) => {
        const id = req.params.id;
        const userID = req.session.userID
        try {
            await query("DELETE FROM status WHERE id_item = ? AND id_user = ?", [id, userID])
            req.flash("success", "L'avis a bien été retirer"),
            res.redirect(`/user/${userID}`)
        } catch(err) {
            res.send(err)
        }
    },
    // Like post ("/like/:id")
    like : async (req, res) => {
        const idItem = req.params.id
        const userID = req.session.userID

        try {
            if(userID != undefined){
                const checkLike = await query("SELECT s.id_user, s.id_item, s.bad, s.good, i.id_category FROM status AS s INNER JOIN item AS i ON i.id = s.id_item WHERE s.id_item = ? AND s.id_user = ?", [idItem, userID])
                // console.log(checkLike.length);
                if(checkLike.length === 0){
                    const like = await query("INSERT INTO status (good, id_user, id_item) VALUES (1,?,?)", [userID, idItem])
                    // console.log(like);
                    // res.json("Vous venez de liker l'item")
                    res.redirect(`back`)
                }
                else if(checkLike[0].bad === 1){
                    const changeForLike = await query("UPDATE status SET bad = null, good = 1 WHERE status.id_item = ?  AND status.id_user = ?", [idItem, userID])
                    // console.log(changeForLike);
                    // res.json("Vous venez de liker l'item")
                    res.redirect("back")
                } else {
                    // res.json("Vous avez deja liker cette item")
                    res.redirect("back")
                }
            } else {
                req.flash("error", "Vous devez etre connecté"),
                res.redirect("/auth/login")
            }
        } catch(err){
            res.send(err)
        }
    },
    // Comment one post ("/comment/:id")
    commentItem: async (req, res) => {
        const idItem = req.params.id;
        const userID = req.session.userID
        const content = req.body.comment

        try {
            if(userID != undefined){
                const comment = await query("INSERT INTO comment (content, id_user, id_item) VALUES (?, ?, ?)", [content, userID, idItem])
                // res.json("Votre commentaire a bien été ajouté")
                res.redirect(`/user/${userID}`)
            } else {
                res.redirect("/auth/login")
            }
        } catch(err){
            res.send(err)
        }
    },
    // User delete comment ("/user/comment/:id")
    deleteComment: async (req, res) => {
        const id = req.params.id
        try {
            await query("DELETE FROM comment WHERE id = ?", [id])
            res.json("Ton commentaire est supprimé")
        } catch(err){
            res.send(err)
        }
    },
    // Dislike post ("/dislike/:id")
    dislike : async (req, res) => {
        const idItem = req.params.id
        const userID = req.session.userID
        
        try {
            if(userID != undefined){
                const checkDislike = await query("SELECT s.id_user, s.id_item, s.bad, s.good, i.id_category FROM status AS s INNER JOIN item AS i ON i.id = s.id_item  WHERE s.id_item = ? AND s.id_user = ?", [idItem, userID])
                if(checkDislike.length === 0){
                    await query("INSERT INTO status (bad, id_user, id_item) VALUES (1,?,?)", [userID, idItem])
                    // res.json("Vous venez de disliker l'item")
                    res.redirect(`back`)
                }
                else if(checkDislike[0].good === 1){
                    await query("UPDATE status SET bad = 1, good = null WHERE status.id_item = ?  AND status.id_user = ?", [idItem, userID])
                    // res.json("Vous venez de disliker l'item")
                    res.redirect(`back`)
                } else {
                    // res.json("Vous avez deja disliker l'item")
                    res.redirect(`back`)
                }
            } else {
                req.flash("error", "Vous devez etre connecté"),
                res.redirect(`/auth/login`)
            }
        } catch(err){
            // res.send(err)
            res.json("bug")
        }
    },
    // User edit profile ("/user/edit/profil/:id")
    editProfileUser: async (req, res) => {
        const id = req.params.id
        const { firstname, lastname, birthday, email } = req.body

        try{
            await query("UPDATE user SET firstname = ?, lastname = ?, email = ?, birthday = ? WHERE id = ?", [firstname, lastname, email, birthday, id])
            req.flash("success", "Les informations du profil ont bien été mis à jour"),
            res.redirect(`/user/${id}`) 
        } catch(err) {
            res.send(err)
        }
    },
    // User edit image profile ("/user/edit/profil/:id/image")
    editImageUser: async (req, res) => {
        const id = req.params.id

        if (!req.files){
            req.flash("error", "Selectionner une image"),
            res.redirect(`/user/${id}`)
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
                    await query("UPDATE user SET image = ? WHERE id = ?", [image, id])
                    req.session.image = image
                    req.flash("success", "L'image a bien été mis à jour"),
                    res.redirect(`/user/${id}`)
                } catch(err) {
                    res.send(err)
                }
            });
        } else {
            req.flash("error", "Le format de l'image n'est pas correct"),
            res.redirect(`/user/${id}`)
        }}
    },
    // User edit password ("/user/edit/profil/:id/password")
    editPasswordUser: (req, res) => {
        const id = req.params.id
        password = req.body.password
        password2 = req.body.password2

        if(!password || !password2){
            req.flash("error", "Remplissez tout les champs"),
            res.redirect(`/user/${id}`)
        } else if(password !== password2) {
            req.flash("error", "Les mots de passe ne correspondent pas"),
            res.redirect(`/user/${id}`)
        } else {
            bcrypt.hash(password, 10, async (err, hash) => {
                if(err){
                    res.send(err)
                }
                try {
                    await query("UPDATE user SET password = ? WHERE id = ?", [hash, id])
                    req.flash("success", "Le mot de passe à bien été changé"),
                    res.redirect(`/user/${id}`)
                } catch(err){
                    res.send(err)
                }
            });
        }
        
    },
    // User delete account ("/user/:id")
    userDeleteAccount: (req, res) => {
        const id = req.params.id
        const queryDB = "DELETE FROM user WHERE id = ?"

        connection.query(queryDB, [id], function (err) {
            if(err){
                res.send(err)
            } else {
                req.session.destroy()
                res.redirect("/")
            }
        });
    }
}
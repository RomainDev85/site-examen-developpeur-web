const bcrypt = require('bcrypt');
const joi = require('joi');

module.exports = {
    getLogin: (req, res) => {
        res.render("login", {error: req.flash("error"), success: req.flash("success")})
    },
    // Display register page
    getRegister: (req, res) => {
        res.render("register", {error: req.flash("error"), success: req.flash("success")})
    },
    // Register account ("/auth/register")
    register: async (req, res) => {
        // var for request form
        let firstname = req.body.firstname
        let lastname = req.body.lastname
        let birthday = req.body.birthday
        let email = req.body.email
        let password = req.body.password
        let password2 = req.body.password2

        const schema = joi.object().keys({
            joi_firstname: joi.string(),
            joi_lastname: joi.string(),
            joi_email: joi.string().email(),
        })

        const dataToValidate = {
            joi_firstname: firstname,
            joi_lastname: lastname,
            joi_email: email,
        }
        
        const result = schema.validate(dataToValidate);
        console.log(result);
        //console.log(birthday);
        
        // request SQL in const for use after
        const emailQuery = "SELECT email FROM user WHERE email = '" + email + "';"

    if (!firstname || !lastname || !birthday || !email || !password || !password2 || !req.files) {
        req.flash("error", "Remplissez tout les champs"),
        res.redirect(`/auth/register`)
        // res.json("Remplissez tout les champs")
    }
    else if(result.error){
        req.flash("error", "Les données qui ont été saisi sont erroné"),
        res.redirect(`/auth/register`)
    }
    // if password confirmation is correct
    else if(password === password2){
        try {
            const resultEmail = await query(emailQuery)
            // if the request have a result
            if(resultEmail.length > 0){
                req.flash("error", "Le compte existe deja"),
                res.redirect(`/auth/register`)
                // res.json("Le compte existe deja")
            } else {
                let imageUpload = req.files.image
                let image = `/images/${imageUpload.name}`

                imageUpload.mv(`public/images/${imageUpload.name}`, async function(err) {
                    if (err){
                        return res.status(500).send(err);
                    }
                    try{
                        // use method hash of bcrypt for hash the password in form and insert in SQL 
                        bcrypt.hash(password, 10, async (err, hash) => {
                            await query ("INSERT INTO user (??, firstname, lastname, birthday, email, password, id_role) VALUES (?, ?, ?, ?, ?, ?, 1)", ['image', image, dataToValidate.joi_firstname, dataToValidate.joi_lastname, birthday, dataToValidate.joi_email, hash]);     
                            if(!err){
                                // res.json("Vous etes enregistrer")
                                req.flash("success", "Vous etes enregistrer, connectez vous!"),
                                res.redirect(`/auth/login`) 
                            } else {
                                res.send(err)
                            }
                        })
                    }catch(err) {
                        res.send(err)
                    }
                })    
            }
        } catch(err) {
            res.send(err)
        }
    } else{
        // res.json("Les mots de passe ne sont pas identique")
        req.flash("error", "Les mots de passe ne sont pas identique"),
        res.redirect(`/auth/register`)
    }
    },
    // User login ("/auth/login")
    login: (req, res) => {
        const email = req.body.email;
        const password = req.body.password;

        // Request SQL for check if the email exists in the database
        connection.query('SELECT firstname, lastname, email, password, id_role, id, image, status FROM user WHERE email= ?', [email], (err, result) => {
            if (err || result.length === 0) {
                req.flash("error", "Vous n'etes pas inscrit"),
                res.redirect(`/auth/login`)
            } else {
                // use compare method of bcrypt for compare the password insert on the form and the password in my DB
                bcrypt.compare(password, result[0].password, (err, success) => {
                    if (err) {
                        // res.json("Mot de passe incorrect")
                        req.flash("error", "Mot de passe incorrect"),
                        res.redirect(`/auth/login`)
                    }
                    if (success) {
                        if(result[0].status === 0) {
                            console.log(result[0].status);
                            // res.json("votre compte est bloqué")
                            req.flash("error", "Votre compte à été bloqué"),
                            res.redirect(`/auth/login`)
                        } else {
                            // if email and password is correct, select this user 
                            connection.query('SELECT firstname, lastname, birthday, email, id_role, id, image FROM user WHERE email = ? AND password = ?', [email, result[0].password], function (err, results) {
                                if (results.length) {
                                    // if there is a result, insert in session:
                                    req.session.loggedin = true;
                                    req.session.userNAME = result[0].firstname;
                                    req.session.userLASTNAME = result[0].lastname;
                                    req.session.userID = result[0].id;
                                    req.session.roleID = result[0].id_role;
                                    req.session.image = result[0].image;
                                    // console.log("session",  req.session);
                                
                                    // res.json("Vous etes connecté")
                                    if(req.session.roleID == 2){
                                        res.redirect(`/admin/${req.session.userID}`)
                                    } else {
                                        res.redirect("/")
                                    }
                                
                                } else {
                                    res.send(err)
                                }
                            });
                        }
                    } else {
                        req.flash("error", "Email ou mot de passe incorrect"),
                        res.redirect(`/auth/login`)
                    }
                })
            }
        })
    },
    // Disconnect user
    // Callback for disconnect user
    logout: (req, res) => {
        req.session.destroy()
        res.redirect("/")
    }
}
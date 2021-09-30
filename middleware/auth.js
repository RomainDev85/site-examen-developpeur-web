require('../controllers/auth')

module.exports = {
    // Check if userID = id in setting URL
    checkUser: (req, res, next) => {
        // console.log("session", req.session.userID);
        // console.log("url", req.params.id);
        if(req.session.userID == req.params.id){
            next();
        } else {
            res.redirect("/")
        }
    },
    // Check if user connected
    actionUser: (req, res, next) => {
        if(req.session.userID > 0) {
            next();
        }else {
            req.flash("error", "Vous devez être connecter pour réagir"),
            res.redirect("/auth/login")
        }
    },
    // Check if the user is admin
    checkRole: (req, res, next) => {
        if(req.session.roleID == 2){
            next();
        } else {
            res.redirect("/")
        }
    }
}
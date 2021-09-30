////// Dependance ///////
const express = require('express');
const mysql = require('mysql');
const util = require('util');
const fileUpload = require('express-fileupload');
const path = require('path');
const session = require('express-session')
require('dotenv').config();
const methodOverride = require('method-override');
const flash = require('connect-flash');
const PORT = 3000;

// Express
const app = express()

// Body parser
app.use(express.json())
app.use(express.urlencoded({
    extended: false
}))

// Express static
app.use(express.static(path.join(__dirname, './public')));

// File Upload
app.use(fileUpload());

// Express session
app.use(session({
    secret: 'shut',
    resave: false,
    saveUninitialized: true,
    name: 'biscuit',
    cookie: {   maxAge: 24 * 60 * 60 * 7 * 1000 }
  }));

// MySQL
var connection = mysql.createConnection({
    host     : process.env.DB_HOST,
    user     : process.env.DB_USER,
    password : process.env.DB_PASS,
    database : process.env.DB_DATABASE
});
connection.connect(() => {
    console.log("Connectez à la base de donnée");
});

const query = util.promisify(connection.query).bind(connection);
global.connection = connection;
global.query = query;

// EJS
app.set('view engine', 'ejs');
// Method Override
app.use(methodOverride('_method'))

// Connect flash
app.use(flash());


///// Middleware ////////
const { actionUser, checkRole } = require('./middleware/auth')


////// Session //////
app.use(function(req, res, next){
    const userID = req.session.userID
    const roleID = req.session.roleID
    const userNAME = req.session.userNAME
    const userLASTNAME = req.session.userLASTNAME
    const userIMG = req.session.image
            
    res.locals.userSession = { userID, roleID, userNAME, userLASTNAME, userIMG }
    // console.log(res.locals.userSession);
    next();
})
        

/////// Routes ////////
const home = require("./routes/home") // Home space
const auth = require("./routes/auth"); // Authentification space
const user = require("./routes/user"); // User space
const admin = require("./routes/admin"); // Admin space


/////// URL ////////////
app.use("/", home)
app.use("/auth", auth) 
app.use("/user", actionUser, user)
app.use("/admin", checkRole, admin)


// Error 404
app.use(function (req, res) {
    res.status(404).render('error-404');
});


/////// Server /////////
app.listen(PORT, () => {
    console.log(`Le serveur tourne sur le port ${PORT}`);
})
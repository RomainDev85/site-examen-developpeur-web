const express = require('express');
const router = express.Router();

// Callback
const { getRegister,
    register,
    login,
    getLogin,
    logout } = require("../controllers/auth")

// Request
router.route("/register").get(getRegister).post(register) // Register action
router.route("/login").get(getLogin).post(login) //  Login action
router.route("/logout").get(logout) // Disconnect user


module.exports = router
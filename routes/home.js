const express = require('express');
const router = express.Router();

// Callback
const { homePage,
    listBySport,
    onePost 
} = require("../controllers/home")

// Request
router.route("/").get(homePage) // Show home page
router.route("/articles/:category").get(listBySport) // Show list post by sport
router.route("/articles/:category/:post").get(onePost) // Show only one post

module.exports = router
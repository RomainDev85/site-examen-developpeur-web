const express = require('express');
const router = express.Router();

// Callback
const { adminHome,
    showAllUser,
    statusUser,
    statusItem,
    adminDeleteItem,
    showItem,
    showCategory,
    adminCreateItem,
    getListComment,
    getListUserReview,
    adminCreateCategory,
    adminDeleteCategory,
    adminDeleteUser,
    pageEditCategory,
    editImageCategory,
    editContentCategory,
    pageEditPost,
    editImagePost,
    editContentPost 
} = require("../controllers/admin")


// Request
router.route("/user").get(showAllUser) // Display list user
router.route("/item").get(showItem).post(adminCreateItem) // Display list item & create item
router.route("/category").get(showCategory).post(adminCreateCategory) // Display list categories & create category
router.route("/:id").get(adminHome) // Display admin home page
router.route("/user/:id/status").get(statusUser) // Switch status user block/unblock
router.route("/item/:id/status").get(statusItem) // Switch status post visible/unvisible
router.route("/delete/item/:id").delete(adminDeleteItem) // Delete one post
router.route("/category/:id").delete(adminDeleteCategory) // Delete a category
router.route("/item/:id/comment").get(getListComment) // Show list of comment of item
router.route("/item/:id/user-review").get(getListUserReview) // Show list of like and dislike of item
router.route("/edit/category/:id").get(pageEditCategory) // Display edit page for category
router.route("/edit/category/image/:id").put(editImageCategory) // Admin update image of category
router.route("/edit/category/content/:id").put(editContentCategory) // Admin update content of category
router.route("/delete/user/:id").delete(adminDeleteUser) // Admin delete user
router.route("/edit/post/:id").get(pageEditPost) // Display edit page of post
router.route("/edit/post/image/:id").put(editImagePost) // Admin edit image of the post
router.route("/edit/post/content/:id").put(editContentPost) // Admin edit content of the post

module.exports = router;
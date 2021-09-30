const express = require('express');
const router = express.Router();

// Callback
const { createItem,
    getUserPage,
    commentItem,
    like, 
    dislike,
    deleteItem,
    deleteComment,
    editItem,
    editProfileUser,
    editImageUser,
    editPasswordUser,
    userDeleteAccount,
    deleteLikeOrDislike 
} = require("../controllers/user")

// Middleware
const { checkUser, actionUser } = require("../middleware/auth")

// Request
router.route("/:id").get(checkUser, getUserPage).delete(userDeleteAccount) // Show user page & User delete account
router.route("/item/:id").post(actionUser, createItem) // User add post
router.route("/edit/item/:id").put(actionUser, editItem) // User edit post
router.route("/edit/profil/:id").put(actionUser, editProfileUser) // User edit profile
router.route("/edit/profil/:id/image").put(actionUser, editImageUser) // User edit image profile
router.route("/edit/profil/:id/password").put(actionUser, editPasswordUser) // User edit password
router.route("/comment/:id").post(actionUser, commentItem) // Comment one post
router.route("/item/:id").delete(actionUser, deleteItem) // User delete post
router.route("/comment/:id").delete(actionUser, deleteComment) // User delete comment
router.route("/like/:id").get(actionUser, like) // Like post
router.route("/dislike/:id").get(actionUser, dislike) // Dislike post
router.route("/delete-status/:id").get(actionUser, deleteLikeOrDislike) // Delete status of this post

module.exports = router
module.exports = {
    // Show home page ("/")
    homePage : async (req, res) => {
        try {
            const posts = await query("SELECT i.id, c.title AS category, c.id AS id_category , u.firstname, u.lastname, i.title, i.content, i.image, i.date, ifnull(count(s.bad), 0) as bad_status, ifnull(count(s.good), 0) AS good_status FROM item AS i INNER JOIN user AS u ON u.id = i.id_user INNER JOIN category AS c ON c.id = i.id_category LEFT OUTER JOIN status AS s ON s.id_item = i.id WHERE i.status = 1 GROUP BY i.id ORDER BY i.date DESC LIMIT 3")
            const categories = await query("SELECT id, title, image FROM category")
            res.render("home-first-page", {categories, posts})
            // res.json({posts, categories})
        } catch(err) {
            res.send(err)
        }
    },
    // Show list post by sport ("/articles/:category")
    listBySport : async (req, res) => {
        const id = req.params.category;
        try {
            const posts = await query("SELECT i.id AS id_post, c.id AS id_category, c.image AS image_category, c.title AS category , u.firstname, u.lastname, i.title, i.content, i.image, i.date, ifnull(count(s.bad), 0) as bad_status, ifnull(count(s.good), 0) AS good_status FROM item AS i INNER JOIN user AS u ON u.id = i.id_user INNER JOIN category AS c ON c.id = i.id_category LEFT OUTER JOIN status AS s ON s.id_item = i.id WHERE c.id = ? AND i.status = 1 GROUP BY i.id ORDER BY i.date DESC", [id])
            const category = await query("SELECT id, title, image FROM category WHERE id = ?", [id])
            res.render("home-filter-category", {posts, category: category[0]})
        } catch(err){
            res.send(err)
        }
    },
    // Show only one post ("/articles/:category/:post")
    onePost: async (req, res) => {
        const category = req.params.category;
        const post = req.params.post;
        try {
            const posts = await query("SELECT i.id AS id_post, c.image AS image_category, c.title AS category, c.id AS id_category , u.firstname, u.lastname, i.title, i.content, i.image, i.date, ifnull(count(s.bad), 0) as bad_status, ifnull(count(s.good), 0) AS good_status FROM item AS i INNER JOIN user AS u ON u.id = i.id_user INNER JOIN category AS c ON c.id = i.id_category LEFT OUTER JOIN status AS s ON s.id_item = i.id WHERE c.id = ? AND i.id = ? AND i.status = 1 GROUP BY i.id ORDER BY i.date DESC", [category, post])
            const categories = await query("SELECT id, title, image FROM category WHERE id = ?", [category])
            const bad_status = await query("SELECT u.firstname, u.lastname, u.image AS image_profil FROM status AS s INNER JOIN user AS u ON u.id = s.id_user WHERE s.id_item = ? AND s.bad = 1", [post])
            const good_status = await query("SELECT u.firstname, u.lastname, u.image AS image_profil FROM status AS s INNER JOIN user AS u ON u.id = s.id_user WHERE s.id_item = ? AND s.good = 1", [post])
            res.render("home-one-post", {post: posts[0], bad_status, good_status, categories})
        } catch(err){
            res.send(err)
        }
    }
}
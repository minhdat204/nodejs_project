const express = require('express');
const router = express.Router();
const mysql = require('mysql');
const session = require('express-session'); // Để quản lý phiên đăng nhập
const multer  = require('multer');
const path = require('path');

// Cấu hình multer để lưu trữ ảnh
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function(req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });


// Cấu hình middleware để parse JSON và form data
router.use(express.json());
router.use(express.urlencoded({ extended: true }));

// Cấu hình middleware để quản lý phiên đăng nhập
router.use(session({
    secret: 'mySecretKey',
    resave: false,
    saveUninitialized: true
  }));
// Khởi tạo kết nối tới cơ sở dữ liệu MySQL
const connection = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "db"
});

/* GET users listing. */
// Route cho trang chủ
// Route cho trang chủ
router.get('/', (req, res) => {
  let sqlPostsNew = `SELECT Posts.*, images.url as image_url 
  FROM Posts inner join images on posts.post_id = images.post_id 
  WHERE status = 'published' and Posts.trangthai = 0 ORDER BY created_at DESC LIMIT 5;`;
  let sqlPostsViews = `SELECT Posts.*, images.url as image_url, views.views as posts_views
  FROM Posts inner join images on posts.post_id = images.post_id inner join views on posts.post_id = views.post_id
  WHERE status = 'published' and Posts.trangthai = 0 ORDER BY created_at DESC LIMIT 5;`
  let sqlCategories = `SELECT * FROM categories where trangthai = 0;`;
  let sqlAllPosts = `SELECT Posts.*, images.url as image_url, categories.name as category_name
  FROM Posts inner join images on posts.post_id = images.post_id inner join categories on posts.category_id = categories.category_id
  WHERE status = 'published' and Posts.trangthai = 0
  ORDER BY publish_date DESC`;
  let sqlContactInfo = `SELECT * FROM contactinfo`;
  // Thực hiện query lấy dữ liệu Posts mới nhất
  connection.query(sqlPostsNew, (err, postsnewResult) => {
    if (err) throw err;

    // Thực hiện query lấy dữ liệu Categories
    connection.query(sqlCategories, (err, categoriesResult) => {
        if (err) throw err;
        // Thực hiện query lấy tất cả dữ liệu posts
      connection.query(sqlAllPosts, (err, allpostsResult) => {
        if (err) throw err;
         // Thực hiện query lấy tất cả dữ liệu posts
        connection.query(sqlPostsViews, (err, postsviewsResult) => {
          if (err) throw err;
          // Thực hiện query lấy tất cả dữ liệu posts
          connection.query(sqlContactInfo, (err, contactinfoResult) => {
            if (err) throw err;
            // Render trang chủ với dữ liệu từ cơ sở dữ liệu
            res.render('users/layout', {
                posts: postsnewResult,
                allposts: allpostsResult,
                postsviews: postsviewsResult,
                contactinfo: contactinfoResult,
                categories: categoriesResult,
                content: 'home'
            });
          });
        });
      });
    });
  });
});
//post details
router.get('/posts/:id', (req, res) => {
  const postId = req.params.id;
  const sqlPost = `SELECT Posts.*, images.url AS image_url, categories.name AS category_name, views.views AS posts_views
                   FROM Posts 
                   INNER JOIN images ON Posts.post_id = images.post_id 
                   INNER JOIN categories ON Posts.category_id = categories.category_id
                   LEFT JOIN views ON Posts.post_id = views.post_id
                   WHERE Posts.post_id = ?`;

  const sqlPostsNew = `SELECT Posts.*, images.url AS image_url 
                        FROM Posts 
                        INNER JOIN images ON Posts.post_id = images.post_id 
                        WHERE status = 'published' AND Posts.trangthai = 0 
                        ORDER BY created_at DESC 
                        LIMIT 5`;

  const sqlPostsViews = `SELECT Posts.*, images.url AS image_url, views.views AS posts_views
                          FROM Posts 
                          INNER JOIN images ON Posts.post_id = images.post_id 
                          INNER JOIN views ON Posts.post_id = views.post_id
                          WHERE status = 'published' AND Posts.trangthai = 0 
                          ORDER BY created_at DESC 
                          LIMIT 5`;

  const sqlCategories = `SELECT * FROM categories WHERE trangthai = 0`;

  const sqlContactInfo = `SELECT * FROM contactinfo`;

  const sqlAllPosts = `SELECT Posts.*, images.url as image_url, categories.name as category_name
                        FROM Posts inner join images on posts.post_id = images.post_id inner join categories on posts.category_id = categories.category_id
                        WHERE status = 'published' and Posts.trangthai = 0
                        ORDER BY publish_date DESC`;

  const sqlUpdateViews = `INSERT INTO views (post_id, views) VALUES (?, 1)
                          ON DUPLICATE KEY UPDATE views = views + 1`;

  connection.query(sqlPost, [postId], (err, postsdetailResult) => {
    if (err) {
      console.error("Error fetching post detail:", err);
      return res.status(500).send('Có lỗi xảy ra khi lấy chi tiết bài viết.');
    }

    // Update số lượt xem của bài viết
    connection.query(sqlUpdateViews, [postId], (err, updateResult) => {
      if (err) {
        console.error("Error updating post views:", err);
      }

      connection.query(sqlPostsNew, (err, postsnewResult) => {
        if (err) {
          console.error("Error fetching new posts:", err);
          return res.status(500).send('Có lỗi xảy ra khi lấy bài viết mới.');
        }

        connection.query(sqlPostsViews, (err, postsviewsResult) => {
          if (err) {
            console.error("Error fetching popular posts:", err);
            return res.status(500).send('Có lỗi xảy ra khi lấy bài viết phổ biến.');
          }

          connection.query(sqlCategories, (err, categoriesResult) => {
            if (err) {
              console.error("Error fetching categories:", err);
              return res.status(500).send('Có lỗi xảy ra khi lấy danh mục.');
            }

            connection.query(sqlContactInfo, (err, contactinfoResult) => {
              if (err) {
                console.error("Error fetching contact info:", err);
                return res.status(500).send('Có lỗi xảy ra khi lấy thông tin liên hệ.');
              }

              connection.query(sqlAllPosts, (err, allpostsResult) => {
                if (err) {
                  console.error("Error fetching contact info:", err);
                  return res.status(500).send('Có lỗi xảy ra khi lấy tất cả bài viết');
                }

                connection.query('SELECT * FROM comments WHERE post_id = ?', [postId], (err, commentsResult) => {
                  if (err) {
                    console.error("Error fetching contact info:", err);
                    return res.status(500).send('Có lỗi xảy ra khi lấy bình luận');
                  }
                  res.render('users/layout', {
                    posts: postsnewResult,
                    postsdetail: postsdetailResult[0],
                    postsviews: postsviewsResult,
                    contactinfo: contactinfoResult,
                    allposts: allpostsResult,
                    comments: commentsResult,
                    categories: categoriesResult,
                    content: 'detail'
                  });
                });
              });
            });
          });
        });
      });
    });
  });
});
//thêm bình luận
router.post('/posts/:post_id/comments',(req, res) => {
  const post_id = req.params.post_id;
  const email = req.body.email;
  const content = req.body.content;
  connection.query('INSERT INTO comments (email, post_id, content) VALUES (?, ?, ?)', [email, post_id, content], (err, result) => {
    if (err) {
      // Xử lý lỗi nếu có
      res.status(500).send('Có lỗi xảy ra khi thêm bình luận.');
    } else {
      // Quay lại trang bài viết với bình luận mới
      res.redirect('/user/posts/' + post_id);
    }
  });
});
//tìm kiếm
router.get('/search', (req, res) => {
  const searchTerm = req.query.search;
  const searchCategory = req.query.category;

  let query = 'SELECT Posts.*, images.url AS image_url FROM Posts inner join images on posts.post_id = images.post_id WHERE title LIKE ?';
  let queryParams = [`%${searchTerm}%`];

  if (searchCategory) {
    query += ' AND category_id = ?';
    queryParams.push(searchCategory);
  }

  connection.query(query, queryParams, (error, results) => {
    if (error) throw error;
    const searchResultsCount = results.length;
    res.render('users/partials/search_results', { posts: results, count: searchResultsCount });
  });
});
//categories list
router.get('/:categoryName', (req, res) => {
  const categoryName = req.params.categoryName;
  const sqlAllPosts = `SELECT Posts.*, images.url as image_url, categories.name as category_name
                        FROM Posts INNER JOIN images ON Posts.post_id = images.post_id INNER JOIN categories ON Posts.category_id = categories.category_id
                        WHERE Posts.status = 'published' AND categories.name = ? AND Posts.trangthai = 0
                        ORDER BY Posts.publish_date DESC`;

  connection.query(sqlAllPosts, [categoryName], (err, allpostsResult) => {
    if (err) {
      console.error("Error fetching contact info:", err);
      return res.status(500).send('Có lỗi xảy ra khi lấy tất cả bài viết');
    }
    res.render('users/partials/category', {
      allposts: allpostsResult,
      categoryName: categoryName
    });
  });
});


//đăng ký
router.post('/subscribe', (req, res) => {
  const email = req.body.email;
  const sql = 'INSERT INTO newsletters (email) VALUES (?)';

  connection.query(sql, [email], (err, result) => {
    if (err) {
      // Xử lý lỗi nếu có
      console.error(err);
      res.send('Có lỗi xảy ra khi đăng ký.');
    } else {
      // Gửi thông báo thành công
      res.send('Cảm ơn bạn đã đăng ký nhận bản tin!');
    }
  });
});

//contact
router.post('/contact', (req, res) => {
  const { name, email, phone, title, message } = req.body;

  // Query để chèn dữ liệu vào bảng 'contact'
  const query = 'INSERT INTO contacts (name, email, phone, title, message) VALUES (?, ?, ?, ?, ?)';

  connection.query(query, [name, email, phone, title, message], (error, results) => {
    if (error) {
      // Xử lý lỗi nếu có
      console.error(error);
      res.status(500).send('Có lỗi xảy ra khi gửi thông tin liên hệ.');
    } else {
      // Chuyển hướng người dùng với thông báo thành công
      res.status(200).send('Thông tin liên hệ đã được gửi thành công.');
    }
  });
});


module.exports = router;

// routes/admin.js

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
const conn = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "db"
});

router.get('/admin', (req, res) => {
    const registeredSuccess = req.query.registered === 'success';

    // Render trang đăng nhập và truyền thông báo thành công
    res.render('admin/login_register', { registeredSuccess });
});
// Route đăng nhập
router.post('/login', (req, res) => {
    const { username, password } = req.body;
    const query = 'SELECT * FROM users WHERE username = ? AND password = ?';

    conn.query(query, [username, password], (err, results) => {
        if (err) {
            res.status(500).send('Error on the server.');
        } else if (results.length === 0) {
            res.status(401).send('Incorrect username or password.');
        } else {
            // Người dùng tồn tại và mật khẩu đúng, thiết lập session
            req.session.user = results[0];
            res.redirect('/dashboard');
        }
    });
});

// Route đăng xuất
router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            res.status(500).send('Error on the server.');
        } else {
            res.redirect('/user');
        }
    });
});

// Route đăng ký
router.post('/register', (req, res) => {
    const { username, email, password, confirm_password } = req.body;

    // Kiểm tra xem mật khẩu nhập lại có khớp với mật khẩu đã nhập không
    if (password !== confirm_password) {
        return res.status(400).send('Mật khẩu nhập lại không khớp.');
    }

    const query = 'INSERT INTO users (username, email, password) VALUES (?, ?, ?)';

    conn.query(query, [username, email, password], (err, results) => {
        if (err) {
            res.status(500).send('Error on the server.');
        } else {
            res.redirect('/?registered=success');
        }
    });
});


// Route dashboard
router.get('/dashboard', (req, res) => {
     // Kiểm tra xem session có tồn tại không
    if (!req.session.user) {
        // Nếu không có, chuyển hướng người dùng đến trang đăng nhập
        return res.redirect('/admin');
    }
    // Biến để lưu trữ dữ liệu động từ cơ sở dữ liệu
    let dynamicData = {};
    dynamicData.username = req.session.user.username
    // Truy vấn để lấy tổng số người dùng
    conn.query('SELECT COUNT(*) AS totalUsers FROM users', (err, results) => {
        if (err) throw err;
        dynamicData.totalUsers = results[0].totalUsers;

        // Tiếp tục truy vấn để lấy tổng số danh mục
        conn.query('SELECT COUNT(*) AS totalCategories FROM categories', (err, results) => {
            if (err) throw err;
            dynamicData.totalCategories = results[0].totalCategories;

            // Tiếp tục truy vấn để lấy tổng số bài viết
            conn.query('SELECT COUNT(*) AS totalPosts FROM posts', (err, results) => {
                if (err) throw err;
                dynamicData.totalPosts = results[0].totalPosts;

                // Render trang mainDashboard với dữ liệu động từ cơ sở dữ liệu
                dynamicData.content = 'dashboard';
                res.render('admin/layout', dynamicData);
            });
        });
    });
});


// Route categories

//hiển thị ds danh mục
router.get('/categories', (req, res) => {
    if (!req.session.user) {
        // Nếu không có, chuyển hướng người dùng đến trang đăng nhập
        return res.redirect('/admin');
    }
    conn.query('SELECT * FROM categories where trangthai = 0', (error, results) => {
        if (error) throw error;
        res.render('admin/layout', { categories: results, content: 'categories' });
    });
});

router.post('/categories', (req, res) => {
    if (!req.session.user) {
        // Nếu không có, chuyển hướng người dùng đến trang đăng nhập
        return res.redirect('/admin');
    }
    const { name } = req.body;
    conn.query('INSERT INTO categories (name) VALUES (?)', [name], (error, results) => {
    if (error) throw error;
    res.redirect('/categories');
    });
});

//xoá
router.get('/categories/delete/:id', (req, res) => {
    if (!req.session.user) {
        // Nếu không có, chuyển hướng người dùng đến trang đăng nhập
        return res.redirect('/admin');
    }
    const { id } = req.params;
    conn.query('update categories set trangthai = 1 WHERE category_id = ?', [id], (error, results) => {
      if (error) throw error;
      res.redirect('/categories');
    });
});
//sửa
router.post('/categories/update/:id', (req, res) => {
    if (!req.session.user) {
        // Nếu không có, chuyển hướng người dùng đến trang đăng nhập
        return res.redirect('/admin');
    }
    const { id } = req.params;
    const { name } = req.body;
    conn.query('UPDATE categories SET name = ? WHERE category_id = ?', [name, id], (err, result) => {
        if (err) {
            console.error('Error updating topic:', err);
            return res.status(500).send('Server error');
        }
        res.redirect('/categories');
    });
});
//route posts:

// Route Lấy Danh Sách Bài Viết
router.get('/posts', (req, res) => {
    if (!req.session.user) {
        // Nếu không có, chuyển hướng người dùng đến trang đăng nhập
        return res.redirect('/admin');
    }
    const page = parseInt(req.query.page) || 1;
    const postsPerPage = 10; // Số lượng bài viết trên mỗi trang
    const offset = (page - 1) * postsPerPage;

    let query = `
    SELECT p.post_id, p.title, p.content, p.author, p.publish_date, p.status, c.name AS category_name, i.url AS image_url
    FROM Posts p
    LEFT JOIN Categories c ON p.category_id = c.category_id
    LEFT JOIN Images i ON p.post_id = i.post_id
    where p.trangthai = 0
    ORDER BY p.publish_date DESC
    LIMIT ?, ?`;

    // Truy vấn để lấy tổng số bài viết
    conn.query('SELECT COUNT(*) AS count FROM Posts', (err, data) => {
        if (err) {
            console.error('Error fetching post count:', err);
            return res.status(500).send('Server error');
        }

        const totalPosts = data[0].count;
        const totalPages = Math.ceil(totalPosts / postsPerPage);

        // Truy vấn để lấy danh sách bài viết với phân trang
        conn.query(query, [offset, postsPerPage], (err, posts) => {
            if (err) {
                console.error('Error fetching posts:', err);
                return res.status(500).send('Server error');
            }

            res.render('admin/layout', {
                posts: posts,
                currentPage: page,
                totalPages: totalPages,
                content: 'posts'
            });
        });
    });
});



// Route để hiển thị trang chỉnh sửa bài viết
router.get('/posts/edit/:post_id', (req, res) => {
    if (!req.session.user) {
        // Nếu không có, chuyển hướng người dùng đến trang đăng nhập
        return res.redirect('/admin');
    }
    const postId = req.params.post_id;
    const query = 'SELECT * FROM Posts WHERE post_id = ?';
    conn.query(query, [postId], (err, results) => {
        if (err) throw err;
        // Lấy danh sách chủ đề
        const categoryQuery = 'SELECT * FROM categories';
        conn.query(categoryQuery, (err, categories) => {
            if (err) throw err;
            // Render trang chỉnh sửa bài viết với dữ liệu của bài viết và danh sách chủ đề và danh mục
            res.render('admin/layout', { post: results[0], categories: categories, content: 'post_edit' });
        });
    });
});

// Route xử lý cập nhật bài viết sau khi chỉnh sửa
router.post('/posts/edit/:post_id', (req, res) => {
    if (!req.session.user) {
        // Nếu không có, chuyển hướng người dùng đến trang đăng nhập
        return res.redirect('/admin');
    }
    const postId = req.params.post_id;
    
    const { title, content, author, publish_date, status, category_id} = req.body;
    const updateQuery = 'UPDATE Posts SET title = ?, content = ?, author = ?, publish_date = ?, status = ?, category_id = ? WHERE post_id = ?';
    conn.query(updateQuery, [title, content, author, publish_date, status, category_id, postId], (err, results) => {
        if (err) throw err;
        res.redirect('/posts'); // Sau khi cập nhật thành công, chuyển hướng người dùng đến trang danh sách bài viết
    });
});
// Xoá bài viết
router.get('/posts/delete/:id', (req, res) => {
    if (!req.session.user) {
        // Nếu không có, chuyển hướng người dùng đến trang đăng nhập
        return res.redirect('/admin');
    }
    let query = "update posts set trangthai = 1 WHERE post_id = ?";
    conn.query(query, [req.params.id], (err, result) => {
        if (err) throw err;
        res.redirect('/posts');
    });
});
// Route để hiển thị form thêm bài viết
router.get('/posts/add', (req, res) => {
    if (!req.session.user) {
        // Nếu không có, chuyển hướng người dùng đến trang đăng nhập
        return res.redirect('/admin');
    }
    // Lấy danh sách danh mục và chủ đề từ cơ sở dữ liệu
    conn.query('SELECT * FROM categories', (err, categories) => {
        if (err) throw err;
        res.render('admin/layout', { categories: categories, content:'post_add' });
    });
});

// Route để thêm bài viết mới
router.post('/posts/add', upload.single('image'), (req, res) => {
    if (!req.session.user) {
        // Nếu không có, chuyển hướng người dùng đến trang đăng nhập
        return res.redirect('/admin');
    }
    const { title, content, author, publish_date, status, category_id } = req.body;
    const imageUrl = '/uploads/' + req.file.filename;
    const sql = `INSERT INTO Posts (title, content, author, publish_date, status, category_id) VALUES (?, ?, ?, ?, ?, ?)`;
    conn.query(sql, [title, content, author, publish_date, status, category_id], (err, result) => {
        if (err) throw err;
        const postId = result.insertId;
        const sqlImage = `INSERT INTO Images (post_id, url) VALUES (?, ?)`;
        conn.query(sqlImage, [postId, imageUrl], (err, result) => {
            if (err) throw err;
            res.redirect('/posts');
        });
    });
});



// tìm kiếm
router.get('/posts/search', (req, res) => {
    if (!req.session.user) {
        // Nếu không có, chuyển hướng người dùng đến trang đăng nhập
        return res.redirect('/admin');
    }
    const page = parseInt(req.query.page) || 1;
    const postsPerPage = 10; // Số lượng bài viết trên mỗi trang
    const offset = (page - 1) * postsPerPage;

    const searchQuery = req.query.query;
    const sqlQuery = `
        SELECT Posts.*, Categories.name AS category_name
        FROM Posts
        JOIN Categories ON Posts.category_id = Categories.category_id
        WHERE Posts.title LIKE ? OR Posts.author LIKE ? OR Categories.name LIKE ?
        ORDER BY Posts.publish_date DESC
        LIMIT ?, ?`;

    conn.query('SELECT COUNT(*) AS count FROM Posts', (err, data) => {
        if (err) {
            console.error('Error fetching post count:', err);
            return res.status(500).send('Server error');
        }
        conn.query(sqlQuery, [`%${searchQuery}%`, `%${searchQuery}%`, `%${searchQuery}%`, offset, postsPerPage], (err, results) => {
            if (err) {
                console.error('Error during search:', err);
                return res.status(500).send('Server error');
            }
            const totalPosts = data[0].count;
            const totalPages = Math.ceil(totalPosts / postsPerPage);
    
            // Truy vấn để lấy danh sách bài viết với phân trang
    
            res.render('admin/layout', {
                posts: results,
                currentPage: page,
                totalPages: totalPages,
                content: 'posts'
            });
        });
    });
});



//route contacts
// Route hiển thị danh sách liên hệ
router.get('/contacts', (req, res) => {
    if (!req.session.user) {
        // Nếu không có, chuyển hướng người dùng đến trang đăng nhập
        return res.redirect('/admin');
    }
    conn.query('SELECT * FROM contacts where trangthai = 0 ORDER BY contact_id DESC', (err, rows) => {
        if (err) {
            console.error('Error contacts:', err);
            return res.status(500).send('Server error');
        } else {
            res.render('admin/layout', { contacts: rows, content: 'contacts'});
        }
    });
});
// Route xử lý việc xóa liên hệ
router.get('/contacts/delete/:id', (req, res) => {
    if (!req.session.user) {
        // Nếu không có, chuyển hướng người dùng đến trang đăng nhập
        return res.redirect('/admin');
    }
    const contactId = req.params.id;
    conn.query('update contacts set trangthai = 1 WHERE contact_id = ?', [contactId], (err, result) => {
        if (err) {
            console.error('Error deleting contact:', err);
            return res.status(500).send('Server error');
        }
        res.redirect('/contacts');
    });
});
// Route xử lý việc đánh dấu liên hệ đã xử lý
router.get('/contacts/process/:id', (req, res) => {
    if (!req.session.user) {
        // Nếu không có, chuyển hướng người dùng đến trang đăng nhập
        return res.redirect('/admin');
    }
    const contactId = req.params.id;
    conn.query('UPDATE contacts SET status = "processed" WHERE contact_id = ?', [contactId], (err, result) => {
        if (err) {
            console.error('Error updating contact:', err);
            return res.status(500).send('Server error');
        }
        res.redirect('/contacts');
    });
});


//routes newsletter
// Route hiển thị danh sách email trong newsletter
router.get('/newsletter', (req, res) => {
    if (!req.session.user) {
        // Nếu không có, chuyển hướng người dùng đến trang đăng nhập
        return res.redirect('/admin');
    }
    conn.query('SELECT * FROM newsletters where trangthai = 0 ORDER BY newsletter_id DESC', (err, rows) => {
        if (err) {
            console.error('Error newsletter:', err);
            return res.status(500).send('Server error');
        } else {
            res.render('admin/layout', { newsletter: rows, content: 'newsletter' });
        }
    });
});
// Route xóa email từ newsletter
router.get('/newsletter/delete/:newsletter_id', (req, res) => {
    if (!req.session.user) {
        // Nếu không có, chuyển hướng người dùng đến trang đăng nhập
        return res.redirect('/admin');
    }
    const newsletterId = req.params.newsletter_id;
    const deleteQuery = 'update newsletters set trangthai = 1 WHERE newsletter_id = ?';

    conn.query(deleteQuery, [newsletterId], (err, result) => {
        if (err) {
            // Xử lý lỗi nếu có
            console.error('Error deleting newsletter:', err);
            res.status(500).send('Có lỗi xảy ra khi xóa email');
        } else {
            // Chuyển hướng người dùng về trang danh sách sau khi xóa
            res.redirect('/newsletter');
        }
    });
});


//routes quản lý user
//hiển thi ds
router.get('/users', (req, res) => {
    if (!req.session.user) {
        // Nếu không có, chuyển hướng người dùng đến trang đăng nhập
        return res.redirect('/admin');
    }
    const query = 'SELECT * FROM users WHERE role = "user" and trangthai = 0';
    conn.query(query, (err, results) => {
        if (err) {
            // Xử lý lỗi
            res.status(500).send('Có lỗi xảy ra khi truy vấn cơ sở dữ liệu');
        } else {
            // Hiển thị trang với kết quả
            res.render('admin/layout', { users: results, content: 'users' });
        }
    });
});
//sửa
router.get('/users/update/:id', (req, res) => {
    if (!req.session.user) {
        // Nếu không có, chuyển hướng người dùng đến trang đăng nhập
        return res.redirect('/admin');
    }
    const userId = req.params.id;
    const query = 'SELECT * FROM users WHERE user_id = ?';
    conn.query(query, [userId], (err, results) => {
        if (err) {
            // Xử lý lỗi
            res.status(500).send('Có lỗi xảy ra khi truy vấn cơ sở dữ liệu');
        } else {
            // Hiển thị trang chỉnh sửa với thông tin người dùng
            res.render('edit-user', { user: results[0] });
        }
    });
});

router.post('/users/update/:id', (req, res) => {
    if (!req.session.user) {
        // Nếu không có, chuyển hướng người dùng đến trang đăng nhập
        return res.redirect('/admin');
    }
    const userId = req.params.id;
    const { username, email } = req.body;
    const query = 'UPDATE users SET username = ?, email = ? WHERE user_id = ?';
    conn.query(query, [username, email, userId], (err, results) => {
        if (err) {
            // Xử lý lỗi
            res.status(500).send('Có lỗi xảy ra khi cập nhật thông tin người dùng');
        } else {
            // Chuyển hướng về trang danh sách người dùng
            res.redirect('/users');
        }
    });
});
//xoá
router.get('/users/delete/:id', (req, res) => {
    if (!req.session.user) {
        // Nếu không có, chuyển hướng người dùng đến trang đăng nhập
        return res.redirect('/admin');
    }
    const userId = req.params.id;
    const query = 'update users set trangthai = 1 WHERE user_id = ?';
    conn.query(query, [userId], (err, results) => {
        if (err) {
            // Xử lý lỗi
            res.status(500).send('Có lỗi xảy ra khi xóa người dùng');
        } else {
            // Chuyển hướng về trang danh sách người dùng
            res.redirect('/users');
        }
    });
});



// API để lấy dữ liệu biểu đồ doanh thu
router.get('/api/revenue', (req, res) => {
    // Truy vấn dữ liệu từ bảng posts hoặc bảng nào đó chứa thông tin doanh thu
    const query = 'SELECT publish_date, COUNT(*) as revenue FROM posts GROUP BY publish_date';
    conn.query(query, (err, results) => {
        if (err) throw err;
        res.json(results);
    });
});

// API để lấy dữ liệu phân chia danh mục
router.get('/api/categories', (req, res) => {
    // Truy vấn dữ liệu từ bảng categories
    const query = 'SELECT name, (SELECT COUNT(*) FROM posts WHERE posts.category_id = categories.category_id) as value FROM categories';
    conn.query(query, (err, results) => {
        if (err) throw err;
        res.json(results);
    });
});

module.exports = router;

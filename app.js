var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var adminRouter = require('./Routes/admin');
var usersRouter = require('./Routes/users');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use('/', express.static(path.join(__dirname,'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/', adminRouter);
app.use('/user', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    if (err.status === 404) {
        res.status(404).send('Trang bạn truy cập không tồn tại.');
      } else {
        next(err);  
      }
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});
// Middleware để thiết lập locals
app.use(function(req, res, next) {
  // Thiết lập locals cho URL hiện tại
  res.locals.currentURL = req.protocol + '://' + req.get('host') + req.originalUrl;
  next();
});
module.exports = app;

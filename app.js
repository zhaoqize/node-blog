var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);
var multer = require('multer');

var routes = require('./routes/index');
var settings = require('./settings');
var flash = require('connect-flash');

//写日志到本地，调用fs
var fs = require('fs');
var accessLog = fs.createWriteStream('access.log', {flags: 'a'});
var errorLog = fs.createWriteStream('error.log', {flags: 'a'});

var app = express();


app.set('views',process.env.PORT || 3000);
// view engine setup
// __dirname ： 存储当前正在执行脚本所在的目录
app.set('views', path.join(__dirname, 'views'));
//指定使用模板引擎
app.set('view engine', 'ejs');
app.use(flash());

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
//打日志
app.use(logger('dev'));
app.use(logger({stream:accessLog}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

//设置publick文件夹为存放静态文件的目录
app.use(express.static(path.join(__dirname, 'public')));

//将回话信息存储到MongoDB中
app.use(session({
  secret : settings.cookieSecret,
  
}))

app.use(session({
  secret:settings.cookieSecret,
  key:settings.db,
  cookie:{maxAge: 1000 * 60 * 60 * 24 * 30},
  store: new MongoStore({
    db: settings.db,
    host: settings.host,
    port: settings.port
  })
}))

//使用上传模块
app.use(multer({
  dest: './public/images',
  rename: function (fieldname, filename) {
    return filename;
  }
}));


routes(app);

app.use(function (err, req, res, next) {
  var meta = '[' + new Date() + '] ' + req.url + '\n';
  errorLog.write(meta + err.stack + '\n');
  next();
});

app.listen(app.get('port'),function(){
  console.log('Express on port' + app.get('port'));
})

// catch 404 and forward to error handler
// 捕捉404错误 并 转发到错误处理器
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
// 开发环境
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
// 生产环境
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;

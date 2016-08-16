var express = require('express');
var router = express.Router();
var mongodb = require('../models/db.js');

//是Nodejs的核心模块 用来生成散列值来加密密码
var crypto = require('crypto');

//用户模型文件
var User = require('../models/user.js');

var Post = require('../models/post.js');

var Comment = require('../models/comment.js');

module.exports = function(app){

	app.get('/',function(req, res){
		mongodb.close();
		Post.getAll(null, function(err, posts){
			if(err){
				posts = [];
			} 
			
		 	res.render('index', {
		        title: '主页',
		        posts: posts,
		        user: req.session.user,
		        success: req.flash('success').toString(),
		        error: req.flash('error').toString()
		    });
		})
	})

	app.get('/reg', checkNotLogin);
	app.get('/reg',function(req, res){
		mongodb.close();
		res.render('reg',{ 
			title:'注册' ,
			user: req.session.user,
			success: req.flash('success').toString(),
			error:req.flash('error').toString()
		});
	})


	app.post('/reg', checkNotLogin);
	app.post('/reg',function(req, res){
		mongodb.close();
		var name = req.body.name,
			password = req.body.password,
			password_re = req.body['password-repeat'];
	    //检验用户两次输入的密码是否一致
	    if (password_re != password) {
	      req.flash('error', '两次输入的密码不一致!'); 
	      return res.redirect('/reg');//返回主册页 重定向
	    }

	    //生成密码的 md5 值
	    var md5 = crypto.createHash('md5'),
	        password = md5.update(req.body.password).digest('hex');


	    var newUser = new User({
	        name: req.body.name,
	        password: password,
	        email: req.body.email
	    });

	    User.get(newUser.name, function (err, user) {
	      if (user) {
	        req.flash('error', '用户已存在!');
	        return res.redirect('/reg');//返回注册页
	      }
	      //如果不存在则新增用户
	      newUser.save(function (err, user) {
	        if (err) {
	          req.flash('error', err);
	          return res.redirect('/reg');//注册失败返回主册页
	        }
	        req.session.user = user;//用户信息存入 session
	        req.flash('success', '注册成功!');
	        res.redirect('/');//注册成功后返回主页
	      });
	    });
	})


	app.get('/login',function(req, res){
		mongodb.close();
		res.render('login',{ 
			title:'登录' ,
			user: req.session.user,
			success: req.flash('success').toString(),
			error:req.flash('error').toString()
		});
	})


	app.post('/login',function(req, res){
		mongodb.close();
			//生成密码的 md5 值
	    var md5 = crypto.createHash('md5'),
	        password = md5.update(req.body.password).digest('hex');
	    //检查用户是否存在
	    User.get(req.body.name, function (err, user) {
	      if (!user) {
	        req.flash('error', '用户不存在!'); 
	        return res.redirect('/login');//用户不存在则跳转到登录页
	      }
	      //检查密码是否一致
	      if (user.password != password) {
	        req.flash('error', '密码错误!'); 
	        return res.redirect('/login');//密码错误则跳转到登录页
	      }
	      //用户名密码都匹配后，将用户信息存入 session
	      req.session.user = user;
	      req.flash('success', '登陆成功!');
	      res.redirect('/');//登陆成功后跳转到主页
	    });
	})

	app.get('/logout', checkLogin);
	app.get('/logout',function(req, res){
		mongodb.close();
		req.session.user = null;//通过设置为null，丢掉session中用户的信息，实现用户的退出。
    	req.flash('success', '登出成功!');
    	res.redirect('/');//登出成功后跳转到主页
	})


	
	app.get('/post',function(req, res){
		mongodb.close();
		res.render('post',{ 
			title:'注册' ,
			user: req.session.user,
			success: req.flash('success').toString(),
			error:req.flash('error').toString()
		});
	})

	app.post('/post', checkLogin);
	app.post('/post', function (req, res) {
		mongodb.close();
	    var currentUser = req.session.user,
	        tags = [req.body.tag1, req.body.tag2, req.body.tag3],
	        post = new Post(currentUser.name, req.body.title, tags, req.body.post);
	    post.save(function (err) {
	      if (err) {
	        req.flash('error', err); 
	        return res.redirect('/');
	      }
	      req.flash('success', '发布成功!');
	      res.redirect('/');//发表成功跳转到主页
	    });
	});

	//上传文件页面
	app.get('/upload', checkLogin);
	app.get('/upload', function (req, res) {
		mongodb.close();
	    res.render('upload', {
	      title: '文件上传',
	      user: req.session.user,
	      success: req.flash('success').toString(),
	      error: req.flash('error').toString()
	    });
	});

	//上传文件
	app.post('/upload', checkLogin);
	app.post('/upload', function (req, res) {
		mongodb.close();
	    req.flash('success', '文件上传成功!');
	    res.redirect('/upload');
	});

	app.get('/u/:name', function (req, res) {
		mongodb.close();
	    //var page = req.query.p ? parseInt(req.query.p) : 1;
	    //检查用户是否存在
	    User.get(req.params.name, function (err, user) {
	      // if (err) {
	      //   req.flash('error', err); 
	      //   return res.redirect('/');
	      // }
	      if (!user) {
	        req.flash('error', '用户不存在!'); 
	        return res.redirect('/');
	      }
	      //查询并返回该用户第 page 页的 10 篇文章
	      Post.getAll(user.name, function (err, posts, total) {
	        if (err) {
	          req.flash('error', err); 
	          return res.redirect('/');
	        }
	        res.render('user', {
	          title: user.name,
	          posts: posts,
	          //page: page,
	          //isFirstPage: (page - 1) == 0,
	          //isLastPage: ((page - 1) * 10 + posts.length) == total,
	          user: req.session.user,
	          success: req.flash('success').toString(),
	          error: req.flash('error').toString()
	        });
	      });
	    }); 
	});

	app.get('/u/:name/:day/:title', function (req, res) {
		mongodb.close();
	    Post.getOne(req.params.name, req.params.day, req.params.title, function (err, post) {
	      if (err) {
	        req.flash('error', err); 
	        return res.redirect('/');
	      }
	      res.render('article', {
	        title: req.params.title,
	        post: post,
	        user: req.session.user,
	        success: req.flash('success').toString(),
	        error: req.flash('error').toString()
	      });
	    });
	});

	app.post('/u/:name/:day/:title', function (req, res) {
		mongodb.close();
	    var date = new Date(),
	        time = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " + 
	               date.getHours() + ":" + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes());
	    var md5 = crypto.createHash('md5'),
	        email_MD5 = md5.update(req.body.email.toLowerCase()).digest('hex'),
	        head = "http://www.gravatar.com/avatar/" + email_MD5 + "?s=48"; 
	    var comment = {
	        name: req.body.name,
	        head: head,
	        email: req.body.email,
	        website: req.body.website,
	        time: time,
	        content: req.body.content
	    };
	    var newComment = new Comment(req.params.name, req.params.day, req.params.title, comment);
	    newComment.save(function (err) {
	      if (err) {
	        req.flash('error', err); 
	        return res.redirect('back');
	      }
	      req.flash('success', '留言成功!');
	      res.redirect('back');
	    });
  	});


	//编辑文章
	app.get('/edit/:name/:day/:title', checkLogin);
	  app.get('/edit/:name/:day/:title', function (req, res) {
	  	mongodb.close();
	    var currentUser = req.session.user;
	    Post.edit(currentUser.name, req.params.day, req.params.title, function (err, post) {
	      if (err) {
	        req.flash('error', err); 
	        return res.redirect('back');
	      }
	      res.render('edit', {
	        title: '编辑',
	        post: post,
	        user: req.session.user,
	        success: req.flash('success').toString(),
	        error: req.flash('error').toString()
	      });
	    });
	});

	app.post('/edit/:name/:day/:title', checkLogin);
	app.post('/edit/:name/:day/:title', function (req, res) {
		mongodb.close();
	    var currentUser = req.session.user;
	    Post.update(currentUser.name, req.params.day, req.params.title, req.body.post, function (err) {
	      var url = encodeURI('/u/' + req.params.name + '/' + req.params.day + '/' + req.params.title);
	      if (err) {
	        req.flash('error', err); 
	        return res.redirect(url);//出错！返回文章页
	      }
	      req.flash('success', '修改成功!');
	      res.redirect(url);//成功！返回文章页
	    });
	});

	//删除文章
	app.get('/remove/:name/:day/:title', checkLogin);
	app.get('/remove/:name/:day/:title', function (req, res) {
		mongodb.close();
	    var currentUser = req.session.user;
	    Post.remove(currentUser.name, req.params.day, req.params.title, function (err) {
	      if (err) {
	        req.flash('error', err); 
	        return res.redirect('back');
	      }
	      req.flash('success', '删除成功!');
	      res.redirect('/');
	    });
	});

	//在每个路径前面增加路由中间件 实现对页面权限的控制 
	//已经登陆的：不让访问注册页面
	//未登录的：不让访问其他操作界面
	function checkLogin(req, res, next) {
	    if (!req.session.user) {
	      req.flash('error', '未登录!'); 
	      return res.redirect('/login');
	    }
	    next();
	  }

    function checkNotLogin(req, res, next) {
    	if (req.session.user) {
      		req.flash('error', '已登录!'); 
      		return res.redirect('back');//返回之前的页面
    	}
    	next();
    }

}
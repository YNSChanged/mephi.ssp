var express = require('express');
var router = express.Router();
var mysql      = require('mysql');
var connection = mysql.createConnection({
    host     : 'localhost',
    user     : 'yns',
    password : '',
    database: 'test',
    insecureAuth : true
});

connection.connect();

function Prod(name, descr, href, color, price, mainImg){
    this.name = name;
    this.description = descr;
    this.href = href;
    this.color = color;
    this.price = price;
    this.mainImg = mainImg;
}

var prodList = [new Prod('Палатка МОБИ 2',"Вместимость (человек): 2; " +
    "Материалы каркаса: Fiberglass; " +
    "Конструкция: Дуговые; " +
    "Ткань тента: Poly Taffeta 190T PU 2000; " +
    "Ткань пола: Poly Taffeta 190T PU 3000; " +
    "Проклеенные швы тента; " +
    "Вес (кг): 1,76; " +
    "Водостойкость тента (мм/в.ст.): 2 000; " +
    "Водостойкость дна (мм/в.ст.): 3 000",'/product/id=1','Синий','1990','id1.jpg')]; //3 топовых товара
var basketList = prodList;

router.get('/', function(req, res) {
    if (!req.session.basket) req.session.basket = [];
    res.cookie('bla','bla', {bla: 'bla'});
    res.render('index', { admin: req.session.admin ,name: (req.session.auth) ? 'Выйти' : 'Авторизация', topProdList: prodList, basketCounter: req.session.basket.length});
}).get('/lk', function (req, res) {
    if (req.session.auth) {
        req.session.auth = false;
        res.redirect('/');
    }
    if (req.session.auth) res.redirect('/');
    else res.render('auth', {error: ""})
}).post('/auth', function (req, res) {
    console.log(req.body);
    connection.query('SELECT * FROM Users WHERE login=' + connection.escape(req.body.username) + ' AND password=' + connection.escape(req.body.password) + ';', function (err, rows) {
        if (Object.keys(rows).length > 0) {
            if (req.body.username == 'admin') req.session.admin = true;
            req.session.auth = true;
            req.session.login = req.body.username;
            res.redirect('/');
        }
        else {
            res.render('auth', { error: "Неверные данные" });
        }
    });
}).get('/registration', function (req, res) {
    res.render('register', {error: ""});
}).post('/register', function (req, res) {
    if (req.body.passwordsignup != req.body.passwordsignup_confirm) res.render('register', {error: "Пароли не совпадают"});
    else {
        connection.query("Select * From Users where login=" + connection.escape(req.body.usernamesignup) + ";", function (err, rows) {
            if (Object.keys(rows).length > 0) res.render('register', {error: "Логин занят"});
            else {
                connection.query("Select MAX(id) as id From Users;", function (err, rows) {
                    connection.query("INSERT INTO Users(`id`,`login`,`password`,`name`,`email`) " +
                        "VALUES("+(rows[0].id+1)+","+ connection.escape(req.body.usernamesignup) +","+
                        connection.escape(req.body.passwordsignup) +","+ connection.escape(req.body.name) +"," + connection.escape(req.body.emailsignup) + ");", function (err, rows) {
                    });
                });
                res.redirect('/');
            }
        });

    }
}).get('/product/:category', function (req, res) {
    if (!req.session.basket) req.session.basket = [];
    switch (req.params.category) {
        case '1':
            connection.query('Select * from Orders', function (err, rows) {
                res.writeHead(200, {"Content-Type": "application/json"});
                res.write(JSON.stringify(rows));
                res.end();
            });
            break;
        case "tents":
            var r;
            var list = [];
            connection.query('SELECT * FROM Products WHERE category="tents";', function (err, rows, fields) {
                console.log(err);
                r = rows;
                if (Object.keys(rows).length > 0) {
                    r.forEach(function (item) {
                        list.push(new Prod(item.name, item.description, "/product/id=" + item.id, item.color, item.price, "id" + item.id + ".jpg"));
                    });
                    res.render('products', {
                        name: (req.session.auth) ? 'Выйти' : 'Авторизация',
                        basketCounter: req.session.basket.length,
                        topProdList: list
                    });
                } else
                    res.render('products', {
                        name: (req.session.auth) ? 'Выйти' : 'Авторизация',
                        basketCounter: req.session.basket.length,
                        topProdList: list
                    });
                });
            break;
        default:
            if (req.params.category.toString().substring(0,4) == "buy=") {
                req.session.basket.push(parseInt(req.params.category.toString().substring(4)));
                req.session.basketCounter = req.session.basket.length;
                connection.query("Select * From Products Where id=" + parseInt(req.params.category.toString().substring(4)) + ";", function (err, rows) {
                    res.render('single', {name: (req.session.auth) ? 'Выйти' : 'Авторизация', basketCounter: req.session.basket.length, prod: rows[0], id: rows[0].id})
                });
            } else
            if (req.params.category.toString().substring(0,3) == "id=") {
                connection.query("Select * From Products Where id=" + parseInt(req.params.category.toString().substring(3)) + ";", function (err, rows) {
                    res.render('single', {name: (req.session.auth) ? 'Выйти' : 'Авторизация', basketCounter: req.session.basket.length, prod: rows[0], id: rows[0].id})
                });
            }
            else res.send("unknown");
                break;
    }
}).get('/basket', function (req, res) {
    if (!req.session.basket) req.session.basket = [];
    connection.query('Select * from Products;', function (err, rows) {
        basketList = [];
        console.log(req.session.basket);
        req.session.basket.forEach(function (item) {
            for (var i = 0; i < rows.length; i++)
                if (rows[i].id == item) basketList.push({name: rows[i].name, price: rows[i].price});
        });
        console.log(req.session.basket);
        res.render('basket', {name: (req.session.auth) ? 'Выйти' : 'Авторизация', basketCounter: req.session.basketCounter, list: basketList, auth: req.session.auth});
    });
}).get('/order', function (req, res) {
    var x = req.session.basket;
    console.log(connection.escape(req.session.login));
    connection.query("SELECT id From Users where login=" + connection.escape(req.session.login) + ";",function (err, rows1) {
        var i;
        console.log(x);
        x.forEach(function (item) {
            console.log(4);
            connection.query("Lock tables Orders write, Products write;");
            connection.query("Select MAX(id) as id from Orders;", function (err, rows) {
                console.log(err);
                if (!i) i = 0;
                i++;
                connection.query("INSERT INTO Orders(id,prodID,userID,userStatus,storeStatus) values("+ (((rows[0].id == null) ? 0 : rows[0].id) +i) + "," + item + "," + rows1[0].id + ",0,0);");
            });
            connection.query("Unlock tables;");
        });
    });
    req.session.basket = [];
    res.redirect('/');
}).get('/news', function (req, res) {
    var feedparser = require('ortoo-feedparser');
    var list = "";
    var i = 0;
    var url = "http://news.turizm.ru/news.rss?categories=537,545,518,786,559,818,772,540,555,884,515,840,550,563,774,789,483,532,482,800";
    feedparser.parseUrl(url).on('article', function (article) {
        if (i==10) res.end(list);
        else {
            list += "<a href=" + article.link + "><h4>" + article.title + "</h4><p>" + article.summary + "</p>";
            i++;
        }
    });
}).post('/checklogin',function (req, res) {
    connection.query('Select * from Users where login=' + connection.escape(req.body.login) + ';', function (err, rows) {
        console.log(rows);
        if (Object.keys(rows).length > 0) res.send('0');
        else if (req.body.pass != req.body.passcon) res.send('1');
        else {
            connection.query("Select MAX(id) as id From Users;", function (err, rows) {
                connection.query("INSERT INTO Users(`id`,`login`,`password`,`name`,`email`) " +
                    "VALUES("+(rows[0].id+1)+","+ connection.escape(req.body.login) +","+
                    connection.escape(req.body.pass) +","+ connection.escape(req.body.name) +"," + connection.escape(req.body.email) + ");", function (err, rows) {
                });
            });
            res.send('2');
        }

    });
}).get('/admin',function (req, res) {
    if (!req.session.basket) req.session.basket=[];
    connection.query('Select * from Orders;',function (err, rows) {
        res.render('basket', {name: (req.session.auth) ? 'Выйти' : 'Авторизация', basketCounter: req.session.basket.length, list: rows, auth: 'adm'});
    })
});

module.exports = router;
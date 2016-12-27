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
    res.render('index', {name: (req.session.auth) ? 'Выйти' : 'Авторизация', topProdList: prodList, basketCounter: req.session.basket.length});
}).get('/lk', function (req, res) {
    if (req.session.auth) {
        req.session.auth = false;
        res.redirect('/');
    }
    console.log(req.session.sessId);
    if (req.session.auth) res.redirect('/');
    else res.render('auth', {error: ""})
}).get('/auth', function (req, res) {
    connection.query('SELECT * FROM Users WHERE login=' + connection.escape(req.query.username) + ' AND password=' + connection.escape(req.query.password) + ';', function (err, rows) {
        console.log(err);
        if (rows) {
            req.session.auth = true;
            req.session.login = req.query.username;
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
        connection.query("Select * From Users where login=" + req.body.usernamesignup + ";", function (err, rows) {
            if (rows) res.render('register', {error: "Логин занят"});
            else {
                connection.query("Select MAX(id) as id From Users;", function (err, rows) {
                    console.log(err);
                    connection.query("Lock tables Users write;");
                    connection.query("INSERT INTO Users(`id`,`login`,`password`,`name`,`email`) " +
                        "VALUES("+(rows[0].id+1)+","+ connection.escape(req.body.usernamesignup) +","+
                        connection.escape(req.body.passwordsignup) +","+ connection.escape(req.body.name) +"," + connection.escape(req.body.emailsignup) + ");", function (err, rows) {
                        console.log(err)
                    });
                });
                connection.query("unlock tables;");
            }
        })
        //if (er) res.render('register', { error: "Что-то пошло не так. Проверьте, корректно ли заполнены поля?. Возможно этот логин уже занят."});
        //else {
            res.redirect('/');
        //}

    }
}).get('/product/:category', function (req, res) {
    if (!req.session.basket) req.session.basket = [];
    switch (req.params.category) {
        case "tents":
            var r;
            var list = [];
            console.log(1);
            connection.query('SELECT * FROM Products WHERE category="tents";', function (err, rows, fields) {
                r = rows;
                console.log(err);
                if (r) { r.forEach(function (item) {
                    console.log(1);
                    list.push(new Prod(item.name, item.description, "/product/id=" + item.id, item.color, item.price, "id" + item.id + ".jpg"));
                    res.render('products', {name: (req.session.auth) ? 'Выйти' : 'Авторизация', basketCounter: req.session.basket.length, topProdList:list})
                }) }
                res.render('products', {name: (req.session.auth) ? 'Выйти' : 'Авторизация', basketCounter: req.session.basketCounter, topProdList:[]})
            });
            break;
        default:
            if (req.params.category.toString().substring(0,4) == "buy=") {
                req.session.basket.push(parseInt(req.params.category.toString().substring(4)));
                req.session.basketCounter = req.session.basket.length;
                connection.query("Select * From Products Where id=" + parseInt(req.params.category.toString().substring(4)) + ";", function (err, rows) {
                    console.log(rows);
                    res.render('single', {name: (req.session.auth) ? 'Выйти' : 'Авторизация', basketCounter: req.session.basket.length, prod: rows[0], id: rows[0].id})
                });
            } else
            if (req.params.category.toString().substring(0,3) == "id=") {
                connection.query("Select * From Products Where id=" + parseInt(req.params.category.toString().substring(3)) + ";", function (err, rows) {
                    console.log(rows)
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
        req.session.basket.forEach(function (item) {
            for (var i = 0; i < rows.length; i++)
                if (rows[i].id == item) basketList.push({name: rows[i].name, price: rows[i].price});
        });
        console.log(req.session.auth)
        res.render('basket', {name: (req.session.auth) ? 'Выйти' : 'Авторизация', basketCounter: req.session.basketCounter, list: basketList, auth: req.session.auth});
    });
}).get('/order', function (req, res) {
    // реализовать через триггер.
    connection.query("SELECT id From Users where login='" + req.session.login + "';",function (err, rows1) {
        console.log(err)
        var i;
        req.session.basket.forEach(function (item) {
            connection.query("Lock tables Orders write, Products write;");
            connection.query("Select MAX(id) as id from Orders;", function (err, rows) {
                if (!i) i = 0;
                i++;
                connection.query("INSERT INTO Orders(id,prodID,userID,userStatus,storeStatus) values("+ (rows[0].id+i) + "," + item + "," + rows1[0].id + ",0,0);");
                connection.query("Select amount from Products where id=" + item + ";", function (err, rows2) {
                    connection.query("Update Products set amount = " + (rows2[0].amount - req.session.basket.length) + " where id=" + item + ";")
                })
            });
            connection.query("Unlock tables");
        });
    });
    req.session.basket = [];
    res.redirect('/');
});

module.exports = router;
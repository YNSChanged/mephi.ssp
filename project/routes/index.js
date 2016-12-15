var express = require('express');
var router = express.Router();
var mysql      = require('mysql');
var connection = mysql.createConnection({
    host     : 'localhost',
    user     : 'yns',
    password : '',
    database: 'mephi',
    insecureAuth : true
});

connection.connect();

function ArrNoDupe(a) {
    var temp = {};
    for (var i = 0; i < a.length; i++)
        temp[a[i]] = true;
    var r = [];
    for (var k in temp)
        r.push(k);
    return r;
}

function Prod(name, descr, href, color, price, mainImg){
    this.name = name;
    this.description = descr;
    this.href = href;
    this.color = color;
    this.price = price;
    this.mainImg = mainImg;
}

var onAuth = false;

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
var currentSessions = [0];

router.get('/', function(req, res) {
    if (req.session.sessId) {
        if (req.session.auth) res.render('index', { name: req.session.name, topProdList: prodList, basketCounter: req.session.basketCounter})
        else res.render('index', { name: 'Авторизация', topProdList: prodList, basketCounter: req.session.basketCounter});
    } else {
        var sess;
        connection.query('SELECT id FROM Sessions ORDER BY id;', function(err, rows, fields) {
            var l = [];
            if (rows) rows.forEach(function (item) {
                l.push(item.id);
            });
            currentSessions.push(l);
            currentSessions = ArrNoDupe(currentSessions);
            var i = 0;
            while (i == currentSessions[i]) i++;
            sess = i;
        });
        req.session.sessId = sess;
        currentSessions.push(sess);
        if (!req.session.basketCounter) req.session.basketCounter = 0;
        req.session.auth = false;
        res.render('index', {name: 'Авторизация', topProdList: prodList, basketCounter: 0});
    }
}).get('/lk', function (req, res) {
    if (req.session.auth) res.redirect('/');
    else res.render('auth', {error: ""})
}).get('/auth', function (req, res) {
    connection.query('SELECT * FROM USERS WHERE login=' + req.query.username + ' AND password=' + req.query.password + ';', function (err, rows) {
        if (rows) {
            req.session.auth = true;
            req.session.sessId = rows[0].sessionId;
        }
        else res.render('auth', { error: "Неверные данные" });
    });
    if (req.session.auth) connection.query('SELECT * FROM SESSIONS WHERE id=' + req.session.sessId + ';', function (err, rows) {
        req.session.basket.push(JSON.parse(rows[0].basket));
        req.session.basket = ArrNoDupe(req.session.basket).sort;
        req.session.basketCounter = req.session.basket.size();
    })
}).get('/registration', function (req, res) {
    res.render('register', {error: ""});
}).get('/register', function (req, res) {
    if (req.query.passwordsignup != req.query.passwordsignup_confirm) res.render('register', {error: "Пароли не совпадают"});
    else {
        console.log(1);
        var er=false;
        var id = 0;
        connection.query('SELECT id FROM Users ORDER BY DESC;', function (err, rows) {
            if (rows) id = rows[0].id + 1;
        })
        console.log(2);
        connection.query('INSERT INTO Users(id,sessionId,login,password,name,email) ' +
            'VALUES('+ id +','+ req.session.sessId +','+ req.query.usernamesignup +','+
            req.query.passwordsignup +','+ req.query.name +',' + req.query.emailsignup + ');', function (err, rows) {

            if (err) er = true;
            console.log(err);
        })
        console.log(3);
        if (er) res.render('register', { error: "Что-то пошло не так. Проверьте, корректно ли заполнены поля?. Возможно этот логин уже занят."});
        else {
            connection.query('INSERT INTO Sessions(id,basket) VALUES(' + req.session.sessId + ',' + JSON.stringify(req.session.basket) + ');', function (err, rows) {});
            res.redirect('/');
        }

    }
}).get('/product/:category', function (req, res) {
    switch (req.params.category) {
        case "tents":
            var r;
            connection.query('SELECT * FROM Products WHERE category="tents";', function (err, rows, fields) {
                r = rows;
            });
            var list = [];
            if (r) { r.forEach(function (item) {
                list.push(new Prod(item.name, item.description, "/product/id=" + item.id, item.color, item.price + " " + (item.sale != 0) ? "-" + item.sale + "%": "", "id" + item.id + ".jpg"));
            }) } else { list = prodList; }
            if (req.session.sessId) {
                if (req.session.auth) res.render('products', {
                    name: req.session.name,
                    basketCounter: req.session.basketCounter,
                    topProdList: list
                }); else res.render('products', {
                    name: 'Авторизация',
                    basketCounter: req.session.basketCounter,
                    topProdList: list
                });
            } else {
                var sess;
                connection.query('SELECT id FROM Sessions ORDER BY id;', function(err, rows, fields) {
                    var l = [];
                    if (rows) rows.forEach(function (item) {
                        l.push(item.id);
                    });
                    currentSessions.push(l);
                    currentSessions = ArrNoDupe(currentSessions);
                    var i = 0;
                    while (i == currentSessions[i]) i++;
                    sess = i;
                });
                req.session.sessId = sess;
                if (!req.session.basketCounter) req.session.basketCounter = 0;
                req.session.auth = false;
                res.render('products', {name: 'Авторизация', topProdList: prodList, basketCounter: req.session.basketCounter});
            }
                break;
        default:
            if (req.params.category.toString().substring(0,4) == "buy=") {
                res.render('single', {prod: prodList[0], id: 1})

            } else
            if (req.params.category.toString().substring(0,3) == "id=") res.render('single', {prod: prodList[0], id: 1})
            else res.send("unknown");
            break;
    }
}).get('/basket', function (req, res) {
    res.render('basket', {list: basketList});
});

connection.end();

module.exports = router;

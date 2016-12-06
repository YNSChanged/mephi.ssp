var express = require('express');
var router = express.Router();

function Prod(name, descr, href, color, price, mainImg, imgs){
    this.name = name;
    this.description = descr;
    this.href = href;
    this.color = color;
    this.price = price;
    this.mainImg = mainImg;
    this.img = imgs;
}

var prodList = [new Prod('Палатка МОБИ 2','Вместимость (человек): 2\nМатериалы каркаса: Fiberglass\nКонструкция: Дуговые\nТкань тента: Poly Taffeta 190T PU 2000\nТкань пола: Poly Taffeta 190T PU 3000\nПроклеенные швы тента\nВес (кг): 1,76\nВодостойкость тента (мм/в.ст.): 2 000\nВодостойкость дна (мм/в.ст.): 3 000','/product/id=1','Синий','1990','id1.jpg',['/product/id=1','/product/id=1','/product/id=1'])]; //3 топовых товара
var prod = new Prod("1","2","3","4");

router.get('/', function(req, res) {
    //получение из бд 3 топовых товаров.
    res.render('index', { topProdList: prodList });
}).get('/product/:category', function (req, res) {
    //тут получение из базы данных соответствующей категории.
    res.render('products', { topProdList: prodList });
}).get('/product/:id', function (req, res) {
    //запрос из бд
    res.render('single', {prod: prod, p: [prod, prod, prod]});
}).get('/basket', function (req, res) {
});

module.exports = router;

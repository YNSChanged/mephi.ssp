var express = require('express');
var router = express.Router();

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
var prod = new Prod("1","2","3","4");
var basketList = prodList;

router.get('/', function(req, res) {
    //получение из бд 3 топовых товаров.
    res.render('index', { topProdList: prodList, onAuth: onAuth });
}).get('/product/:category', function (req, res) {
    //тут получение из базы данных соответствующей категории.
    switch (req.params.category) {
        case "tents":
            res.render('products', { topProdList: prodList });
            break;
        default:
            if (req.params.category.toString().substring(0,3) == "id=") res.render('single', {prod: prodList[0]})
            res.send("unknown");
            break;
    }
}).get('/basket', function (req, res) {
    res.render('basket', {list: basketList});
});

module.exports = router;

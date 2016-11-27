var express = require('express');
var router = express.Router();

function Prod(name, descr, pic, href, color, price){
    this.name = name;
    this.descr = descr;
    this.pic = pic;
    this.href = href;
    this.color = color;
    this.price = price;
}

var prodList = [new Prod("1","2","3")]; //3 топовых товара

router.get('/', function(req, res) {
  res.render('index', { topProdList: prodList });
}).get('/product/:category', function (req, res) {
    //тут получение из базы данных соответствующей категории.
    res.render('products', { topProdList: prodList });
}).get('/single/:id', function (req, res) {
    //запрос из бд
    var prod;
    res.render('single', {prod: prod});
});

module.exports = router;

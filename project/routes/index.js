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
});

router.get('/product/:category', function (req, res) {
    //тут получение из базы данных соответствующей категории.
    res.render('products', { category: req.params.category })
});

module.exports = router;

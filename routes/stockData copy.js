var express = require('express');
var expressWs = require('express-ws');
var router = express.Router();
var ws = require("nodejs-websocket")
let app = require('express')()
let server = require('http').createServer(app)
let io = require('socket.io')(server)
var {
  getData,
  getIndustryData
} = require('../public/javascripts/call');
const {
  get
} = require('http');


var stockcode='600000'
io.on('connection', function (socket) { // socket相关监听都要放在这个回调里
  console.log('a user connected');
  console.log(socket.id, 'ok')
  if (io.sockets.connected[socket.id]) { //向指定用户发送消息

    /*  getData().then((data)=>{
       io.sockets.connected[socket.id].emit('msg',data)}); */
   /*  setInterval(function () {
      getData('RealTime',stockcode).then((data) => {
        console.log('ok')
        io.sockets.connected[socket.id].emit('msg', data)
      });
    }, 10000)  *///每五秒发送一次实时数据

  }
  socket.on("disconnect", function () {
    console.log("a user go out");
  });

  socket.on("msg", function (obj) {
    //延迟3s返回信息给客户端
    stockcode = obj.stockcode
    getData('RealTime',stockcode).then((data) => {
      console.log('ok')
      io.sockets.connected[socket.id].emit('msg', data)
    });
    console.log('the websokcet message is', obj);
    //socket.emit("msg", obj);
  })
})
//开启端口监听socket 不同于node启动端口
server.listen(3001)


router.post('/getDayKline', async (req, res, next) => {
  let stockType = req.body.stockType
  let stockcode=req.body.stockcode
  console.log('日Koka',req.body,stockType)
        getData(stockType,stockcode).then((data) => {
          res.send({
            code: 0,
            msg: '获取K数据成功',
            data: data
          })
          //io.sockets.connected[socket.id].emit('msg',data)});
          //每五秒发送一次实时数据
        })

  /* */
}) 

/* router.post('/getindutry', async (req, res, next) => {
  let stock = req.body.stock;
        getData(stock).then((data) => {
          res.send({
            code: 0,
            msg: '获取K数据成功',
            data: data
          })
          //io.sockets.connected[socket.id].emit('msg',data)});
          //每五秒发送一次实时数据
        })

 
})  */

router.post('/getcloselist', async (req, res, next) => {
  let industry = req.body.industry;
  getIndustryData(industry).then((data)=>{
    res.send({
      code: 0,
      msg: '获取行业数据成功',
      data: data
    })
  })
})
router.get('/', function (req, res, next) {
          res.render('index', {
            title: 'aaExpress'
          });
        })
       
        module.exports = router;
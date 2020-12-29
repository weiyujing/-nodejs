var express = require('express');
var expressWs = require('express-ws');
var router = express.Router();
var ws = require("nodejs-websocket")
let app = require('express')()
let server = require('http').createServer(app)
let io = require('socket.io')(server)
const {
  Model,IndexModel,MoneyModel
} = require('../db/index')
const {
  querySql
} = require('../db/index')
var {
  getData,
  getIndustryData,
  getIndexData
} = require('../public/javascripts/call');
const {
  get
} = require('http');


var stockcode = '600000'
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
     }, 10000)  */ //每五秒发送一次实时数据

  }
  socket.on("disconnect", function () {
    console.log("a user go out");
  });

  socket.on("msg", function (obj) {
    //延迟3s返回信息给客户端
    stockcode = obj.stockcode
    getData('RealTime', stockcode).then((data) => {

      io.sockets.connected[socket.id].emit('msg', data)
    });
    console.log('the websokcet message is', obj);
    //socket.emit("msg", obj);
  })
})
//开启端口监听socket 不同于node启动端口
server.listen(3001)



router.get('/getStockName',async(req,res,next)=>{
  result = await querySql('select concat(name,ts_code) name from stockbasic');
  res.send({
    code: 0,
    msg: '获取数据成功',
    data: result.map((item)=>{
      return item.name
    })
  })

})
//股票列表 沪深一览
router.post('/getStockList', async (req, res, next) => {
  let {
    page,
    pageSize,
    tableType,
    conceptName,
    dateValue,//龙虎榜日期
    para,//排序
  } = req.body;
  var info, result, totalCount;
  if (tableType == '沪深一览') {
    Model.countDocuments({}, function (err, count) {
      totalCount = count;

      Model.find({}, {
        data: {
          $slice: -1
        }
      }, function (err, docs) {
        let docsResult = [];
        for(let i=0;i<docs.length;i++){
          let temp={};
          let data = docs[i].data[0];
          temp.data = data;
          temp.name=docs[i].name;
          temp.ts_code=docs[i].ts_code;
          docsResult.push(temp)
        }
     
        res.send({
          code: 0,
          msg: '获取K数据成功',
          totalCount: totalCount,
          data: docsResult,
        })
      }).skip((page - 1) * pageSize).limit(pageSize)
    })

  } else if (tableType == '新股上市') {
    Count = await querySql('select count(*) num from newstock')
    result = await querySql('select * from newstock limit ' + (page - 1) * pageSize + ',' + pageSize + '')
    res.send({
      code: 0,
      msg: '获取K数据成功',
      totalCount: Count[0].num,
      data: result
    })

  } else if (tableType == '龙虎榜') {
    // dateValue = dateValue.split('-').join('');
    dateValue = '20201125'
    Count = await querySql('select count(*) num from topstock')
    result = await querySql('select * ,group_concat(reason) from topstock where trade_date=? group by ts_code limit ' + (page - 1) * pageSize + ',' + pageSize + '', [dateValue]) //同一个id不同reason合并
    res.send({
      code: 0,
      msg: '获取K数据成功',
      totalCount: Count[0].num,
      data: result
    })

  } else {
    if (tableType == '沪市A股') {

      result = await querySql('select ts_code from stockbasic where ts_code like "6%"');
    } else if (tableType == '深市A股') {
      result = await querySql(`select ts_code from stockbasic where ts_code like "0%" and market!='中小板'`)
    } else if (tableType == '科创板') {
      result = await querySql(`select ts_code from stockbasic where market='科创板'`)
    } else if (tableType == '创业板') {
      result = await querySql('select ts_code from stockbasic where ts_code like "3%"')
    } else if (tableType == '中小板') {
      result = await querySql('select ts_code from stockbasic where market="中小板"')
    } else if (tableType == '概念股') {
      result = await querySql('select ts_code from conceptstock where concept_name=?', [conceptName])
    } else if(tableType=='黄金'){
      result = await  querySql('SELECT ts_code FROM stockbasic where industry=?',[tableType] )
    }

    totalCount = result.length;

    var stockList = result.map((item) => {
      return item.ts_code
    })
    let value = 'data.'+para.property;
    let order = para.order=='ascending'?1:-1
    let SortValue ={}
    SortValue[value]=order

    Model.aggregate([
      {
        "$match": {"ts_code":{$in:stockList}}
      },
  
      {
        "$unwind": '$data'
      },
      {
        "$group": {
          "_id": "$ts_code",
          "data": {
            "$last": "$data",
          },
          "name": {
            "$last": "$name"
          },
          "ts_code": {
            "$last": "$ts_code"
          },
        }
      },
      {
        "$sort": SortValue
      },
       {
        "$skip": (page - 1) * pageSize
      },
      {
        "$limit": pageSize
      }
    ]).exec((err, docs) => {
      if (docs.length < 1) {
        res.send({
          code: -1,
          msg: '无结果',
  
        })
      } else {
        res.send({
          code: 0,
          msg: '获取数据成功',
          data: docs,
          totalCount:totalCount,
        })
      }
    });
    /* Model.find({
      'ts_code': {
        $in: stockList
      }
    }, {
      data: {
        $slice: -1
      }
    }, function (err, docs) {
      res.send({
        code: 0,
        msg: '获取K数据成功',
        totalCount: totalCount,
        data: docs,

      })
    }).skip((page - 1) * pageSize).limit(pageSize) */


  }

})

//行业股
router.post('/getIndustryStock', async (req, res, next) => {
  let {
    industry,//排序
  } = req.body;

  result = await  querySql('SELECT ts_code FROM stockbasic where industry=?',[industry] )
  let stockList = result.map((item) => {
    return item.ts_code
  })
  Model.find({
    'ts_code': {
      $in: stockList
    }
  }, {
    data: {
      $slice: -1
    }
  }, function (err, docs) {
    res.send({
      code: 0,
      msg: '获取数据成功',
      totalCount: result.length,
      data: docs,

    })
  })/* .skip((page - 1) * pageSize).limit(pageSize)  */
 /*  if (!result || result.length === 0) {
    res.send({
      msg: '无结果',
      code: -1,
    })
  } else {
    res.send({
      msg: '成功',
      code: 0,
      data: result.map((item) => {
        return item.ts_code
      })
    })
  } */
})

//概念股
router.get('/getConcetStock', async (req, res, next) => {


  result = await querySql('select distinct concept_name from conceptstock;')

  if (!result || result.length === 0) {
    res.send({
      msg: '无结果',
      code: -1,
    })
  } else {
    res.send({
      msg: '成功',
      code: 0,
      data: result.map((item) => {
        return item.concept_name
      })
    })
  }
})


//日线
router.post('/getDayKline', async (req, res, next) => {
  let stockType = req.body.stockType
  let stockcode = req.body.stockcode
  let aaa;
  await getIndexData(stockcode).then(async (data) => {
    aaa = data
  })
  await Model.find({
    'ts_code': stockcode
  }, {
    data: {
      $slice: -200
    }
  }, async function (err, docs) { // docs 此时只包含文档的部分键值})
    res.send({
      code: 0,
      msg: '获取K数据成功',
      data: docs,
      index: aaa
    })
  })

})

//添加自选股 批量插入 replace into test_tbl (id,dr) values (1,'2'),(2,'3'),...(x,'y');
router.post('/addzixuan', async (req, res, next) => {
  let {
    username,
    stockcode
  } = req.body
  try {
    let userSql = 'select id from user where username = ?'
    let user = await querySql(userSql, [username])
    let {
      id: user_id
    } = user[0]
    code = stockcode.split(',')
    let sql = 'insert into zixuan(user_id,stock_id,create_time) values'
    for (let i = 0; i < code.length - 1; i++) {
      sql += '(?,?,NOW()),'
    }
    sql += '(?,?,NOW())'
    let para = []
    for (let i = 0; i < code.length; i++) {
      para.push(user_id)
      para.push(code[i])

    }
    let result = await querySql(sql, para)
    res.send({
      code: 0,
      msg: '加自选成功',
      data: result
    })
  } catch (e) {
    console.log(e)
    next(e)
  }
})

//自选股删除
router.post('/Deletezixuan', async (req, res, next) => {
  let {
    username,
    stockcode
  } = req.body
  try {
    let userSql = 'select id from user where username = ?'
    let user = await querySql(userSql, [username])
    let {
      id: user_id
    } = user[0]

    /* let sql = 'delete from zixuan where user_id = ? and stock_id in ('
    sql+=stockcode;
    sql+=')' */

    let sql = 'delete from zixuan where user_id = ? and stock_id in (000007.SZ,000005.SZ)'

    let result = await querySql(sql, [user_id, stockcode])
    res.send({
      code: 0,
      msg: '加自选成功',
      data: result
    })
  } catch (e) {
    console.log(e)
    next(e)
  }
})

//查询自选股 子语句查询
router.post('/zixuanList', async (req, res, next) => {
  let {
    page,
    pageSize,
    username,
    para,//排序
    search,
  } = req.body
  try {
    let searchContent = search.split(',');
    console.log(searchContent,searchContent[0])
     let sql = 'select stock_id from zixuan where user_id=(select id from user where username = ?) '
    if(search!=''){
      sql = sql+'and stock_id in('+'"'+searchContent[0]+'"'
        for(let i=1;i<searchContent.length;i++){
          sql=sql+','+'"'+searchContent[i]+'"';
      }
      sql = sql+')' 
    } 
    console.log(searchContent,searchContent[0],sql)
    let result = await querySql(sql, [username])
    
     totalCount = result.length;

    var stockList = result.map((item) => {
      return item.stock_id
    })
    let value = 'data.'+para.property;
    let order = para.order=='ascending'?1:-1
    let SortValue ={}
    SortValue[value]=order

    Model.aggregate([
      {
        "$match": {"ts_code":{$in:stockList}}
      },
  
       {
        "$unwind": '$data'
      },
      {
        "$group": {
          "_id": "$ts_code",
          "data": {
            "$last": "$data",
          },
          "name": {
            "$last": "$name"
          },
          "ts_code": {
            "$last": "$ts_code"
          },
        }
      },
      {
        "$sort": SortValue
      }, 
       {
        "$skip": (page - 1) * pageSize
      },
      {
        "$limit": pageSize
      }
    ]).exec((err, docs) => {
      if (docs.length < 1) {
        res.send({
          code: -1,
          msg: '无结果',
  
        })
      } else {
        res.send({
          code: 0,
          msg: '获取数据成功',
          data: docs,
          totalCount:totalCount,
        })
      }
    })
  }catch (e) {
    console.log(e)
    next(e)
  }
    
    /*
    let stockList = result.map((item) => {
      return item.stock_id
    })
    Model.find({
      'ts_code': {
        $in: stockList
      }
    }, {
      data: {
        $slice: -1
      }
    }, function (err, docs) { // docs 此时只包含文档的部分键值})
      res.send({
        code: 0,
        msg: '获取自选股数据成功',
        data: docs
      })
    })
  } catch (e) {
    console.log(e)
    next(e)
  }*/
})

//自选股可视化
router.post('/getZixuanVisual', async (req, res, next) => {
  
  let stockName =req.body.stockName
 
  await Model.find({
    name: {$in:stockName}
  }, {
    data: {
      $slice: -200
    }
  }, async function (err, docs) { // docs 此时只包含文档的部分键值})
    res.send({
      code: 0,
      msg: '获取K数据成功',
      data: docs,
    })
  })

})
//公司信息
router.post('/companyInfo', async (req, res, next) => {

  let {
    stockcode,
    type,
  } = req.body

  try {
    switch (type) {
      case 0:
        var sql = 'select * from companybasic where ts_code=?'
        break;
      case 1:
        var sql = 'select * ,group_concat(title) from companymanager where ts_code=? group by name'; //同一个id不同reason合并'
        break;
      case 2:
        var sql = 'select * from companynotice'; //同一个id不同reason合并'
        break;
      default:
        break
    }
    let result = await querySql(sql, [stockcode])

    res.send({
      msg: '成功',
      code: 0,
      data: result
    })

  } catch (e) {
    console.log(e)
    next(e)
  }
})

//技术选股

router.post('/getSelectStock', async (req, res, next) => {

  let {
    condition,
  } = req.body
  let temp = {}
  condition.forEach(item => {
    console.log(item)
    let key = 'data.' + item.label;
    let value = {
      $gt: Number(item.min),
      $lt: Number(item.max)
    }
    temp[key] = value;
  });
  //temp['data.trade_date']='20201207'

  Model.aggregate([

    {
      "$unwind": '$data'
    },
    {
      "$group": {
        "_id": "$ts_code",
        "data": {
          "$last": "$data"
        },
        "name": {
          "$last": "$name"
        }
      }
    },
    {
      "$match": temp
    },
    {
      "$group": {
        "_id": "$_id",
        "data": {
          "$last": "$data",
        },
        "name": {
          "$last": "$name"
        },
      }
    }
  ]).exec((err, docs) => {
    if (docs.length < 1) {
      res.send({
        code: -1,
        msg: '无结果',

      })
    } else {
      res.send({
        code: 0,
        msg: '获取数据成功',
        data: docs
      })
    }
  });
})

//排行榜
router.post('/getTopList', async (req, res, next) => {
  let {
    title,tableType
  } = req.body
  let value = 'data.'
  
  let result;
  if (tableType == '沪市A股') {

    result = await querySql('select ts_code from stockbasic where ts_code like "6%"');
  } else if (tableType == '深市A股') {
    result = await querySql(`select ts_code from stockbasic where ts_code like "0%" and market!='中小板'`)
  } else if (tableType == '科创板') {
    result = await querySql(`select ts_code from stockbasic where market='科创板'`)
  } else if (tableType == '创业板') {
    result = await querySql('select ts_code from stockbasic where ts_code like "3%"')
  } else if (tableType == '中小板') {
    result = await querySql('select ts_code from stockbasic where market="中小板"')
  } 
  var stockList = result.map((item) => {
    return item.ts_code
  })
  switch (title) {
    case '涨跌幅':
      value += 'pct_chg';
      break;
    case '成交量':
      value += 'vol';
      break;
    case '成交额':
      value += 'amount';
      break;
      case '当前价':
        value += 'close';
        break;
      case '涨跌额':
        value += 'change';
        break;
      case '换手率':
        value += 'turnover_rate';
        break;
        case '量比':
        value += 'volume_ratio';
        break;
      case '市盈率':
        value += 'pe';
        break;
      case '市净率':
        value += 'pb';
        break;
        case '市销率':
        value += 'ps';
        break;
        case '总股本':
        value += 'total_share';
        break;
      case '总市值':
        value += 'total_mv';
        break;
      case '流通市值':
        value += 'circ_mv';
        break;
  }
  
  let SortValue = {}
  SortValue[value] = -1;

  //temp['data.trade_date']='20201207'

  Model.aggregate([
    {
      "$match": {"ts_code":{$in:stockList}}
    },

    {
      "$unwind": '$data'
    },
    {
      "$group": {
        "_id": "$ts_code",
        "data": {
          "$last": "$data",
        },
        "name": {
          "$last": "$name"
        },
      }
    },
    {
      "$sort": SortValue
    },
    {
      "$limit": 10
    }
  ]).exec((err, docs) => {
    if (docs.length < 1) {
      res.send({
        code: -1,
        msg: '无结果',

      })
    } else {
      res.send({
        code: 0,
        msg: '获取数据成功',
        data: docs
      })
    }
  });
})

//涨跌停
router.get('/getLimitUpDown',async(req,res,next)=>{
  try {
    let info = await querySql('select trade_date,COUNT(limitUD) num from limitupdown group by trade_date,limitUD')
    let data = await querySql('select * from limitupdown where trade_date=?',[info[info.length-1].trade_date])
    let up = [],down=[],date=[];
    for(let i=0;i<info.length;i++){
      if(i%2==0){
        date.push(info[i].trade_date)
        down.push(info[i].num)
      }else{
        up.push(info[i].num)
      }
    }
  
    Model.aggregate([
      {
        "$unwind": '$data'
      },
          
        {
        "$group": {
          "_id": "$ts_code",
          "data": {
            "$last": "$data",
          },
          "name": {
            "$last": "$name"
          },
        }
      },
      
    ]).exec((err, docs) => {
      let result =[0,0,0,0,0,0,0,0,0,0]
      docs.forEach((item)=>{
        if(item.data.pct_chg<-8){
          result[0]+=1;
        }else if(item.data.pct_chg>=-8 &&item.data.pct_chg<-6){
          result[1]+=1;
        }else if(item.data.pct_chg>=-6 &&item.data.pct_chg<-4){
          result[2]+=1;
        }else if(item.data.pct_chg>=-4 &&item.data.pct_chg<-2){
          result[3]+=1;
        }else if(item.data.pct_chg>=-2 &&item.data.pct_chg<0){
          result[4]+=1;
        }else if(item.data.pct_chg>=0 &&item.data.pct_chg<2){
          result[5]+=1;
        }else if(item.data.pct_chg>=2 &&item.data.pct_chg<4){
          result[6]+=1;
        }else if(item.data.pct_chg>=4 &&item.data.pct_chg<6){
          result[7]+=1;
        }else if(item.data.pct_chg>=6 &&item.data.pct_chg<8){
          result[8]+=1;
        }else if(item.data.pct_chg>=8){
          result[9]+=1;
        }
      })
      res.send({code:0,msg:'成功',data:data,down:down,up:up,date:date,limitdata:result})
    })
  

   //res.send({code:0,msg:'成功',data:data,down:down,up:up,date:date})
  }catch(e){
    console.log(e)
    next(e)
  } 
})


//股票详情-与板块对比
router.post('/getIndustryCompare',async(req,res,next)=>{
  let {stockcode} = req.body;
  result = await querySql('select market from stockbasic where ts_code=?',[stockcode])
  result = result[0].market
  if(result=='主板'){
    if(stockcode[stockcode.length-1]=='Z'){
      result='深证指数'
    }else{
      result='上证指数'
    }
  }
  if(result=='科创板'){
    result='上证指数'
  }
  IndexModel.find({'name':result},{'data':{$slice:-30}},function(err, docs){// docs 此时只包含文档的部分键值})
  res.send({
    code: 0,
    msg: '获取数据成功',
    data: docs[0]
  })
})

})

//大盘数据
router.get('/getIndexData',async(req,res,next)=>{
 
  IndexModel.find({},{'data.close':1,'name':1,'ts_code':1},function(err, docs){// docs 此时只包含文档的部分键值})
  res.send({
    code: 0,
    msg: '获取数据成功',
    data: docs
  })
})
})


//个股资金流向
router.post('/getMoneyFlow',async(req,res,next)=>{
  let {stockcode} = req.body;
  MoneyModel.find({'ts_code':stockcode},{data:{$slice:-5}},function(err, docs){
    let flow =[]
    docs=docs[0].data
   
    for(let i=0;i<docs.length;i++){
      let value = docs[i];
      let temp=[]
     
      let flowinto=value.buy_sm_amount+value.buy_md_amount+value.buy_lg_amount
      let flowout=flowinto-value.net_mf_amount
      temp.push(value.trade_date,flowinto,flowout)
      flow.push(temp)
    }
    res.send({
      code: 0,
      msg: '获取K数据成功',
      data: docs[docs.length-1],
      flow:flow
    })
}) 
})

//大宗交易  个股龙虎榜数据 十大股东 主营业务构成
router.post('/getTradeInfo',async(req,res,next)=>{
  let {stockcode,type,trade_date}=req.body
  let result;
  if(type==3){
  result = await querySql('select * from top10_holders where ts_code=? and end_date=?',[stockcode,trade_date])
  }else if(type==4){
    result = await querySql('select * from top10_floatholders where ts_code=? and end_date=?',[stockcode,trade_date])
  }else if(type==5){
    result = await querySql('select * from stk_holdernumber where ts_code=?',[stockcode])
  }else if(type==6){
    result = await querySql('select * from stk_holdertrade where ts_code=?',[stockcode])
  }else if(type==8){
    result = await querySql('select * from topstock where ts_code=?',[stockcode])
  }else if(type==9){
    result = await querySql('select * from block_trade where ts_code=?',[stockcode])
  }else if(type==10){
    result = await querySql('select * from forecast where ts_code=?',[stockcode])
  }else if(type==15){
    result = await querySql('select * from fina_mainbz where ts_code=?',[stockcode])
  }
 
  res.send({
    code:0,
    msg:'成功',
    data:result
  })
})

//利润表
router.post('/income',async(req,res,next)=>{
  let {stockcode}=req.body
  let rest=[]
  let result = await querySql('select * from income where ts_code=? and end_date=20200930',[stockcode])
   rest.push(result[0])
   result = await querySql('select * from income where ts_code=? and end_date=20200630',[stockcode])
   rest.push(result[0])
  result = await querySql('select * from income where ts_code=? and end_date=20200331',[stockcode])
  rest.push(result[0])
   result = await querySql('select * from income where ts_code=? and end_date=20191231',[stockcode])
  rest.push(result[0])
   result = await querySql('select * from income where ts_code=? and end_date=20190930',[stockcode])
  rest.push(result[0])
  res.send({
    code:0,
    msg:'成功',
    data:rest
  })
})
/* Model.find({'ts_code':stockcode},{data:{$slice:-200}},function(err, docs){// docs 此时只包含文档的部分键值})
        res.send({
          code: 0,
          msg: '获取K数据成功',
          data: docs
        })
        })
             */ //io.sockets.connected[socket.id].emit('msg',data)});
//每五秒发送一次实时数据
/* */


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
  getIndustryData(industry).then((data) => {
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
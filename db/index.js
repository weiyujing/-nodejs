const mysql = require('mysql')
const dbOption = require('./config')
const mongoose = require('mongoose')
var {
    getStockBsicData
  } = require('../public/javascripts/call');
//连接数据库
 mongoose.connect('mongodb://localhost/stockdata',{
    useNewUrlParser: true ,
    useUnifiedTopology: true
}).then(()=>{
    console.log('链接成功')
}).catch((e)=>{
    console.log('shibai')
}) 
//创建集合（表）

const Schema =  mongoose.Schema({
   ts_code:String,
   name:String,
   data:Array,
})

const Model = mongoose.model('dailyData',Schema,'dailyData')
const IndexModel=mongoose.model('IndexDailyData',Schema,'IndexDailyData')
const MoneyModel=mongoose.model('MoneyFlow',Schema,'MoneyFlow')
/* Model.create({
  
    
},(err,doc)=>{
    if(err){
        throw err
    }
    console.log(doc)
}) */

/* //创建文档（表中数据） 第一种方式
const doc = new Model({
    name:'eric',
    city:[1,2,3],
    sex:2
})
doc.save() */
//第二种创建文档并插入数据库中
/* Model.create({
    name:'eric',
    city:[1,2,3,'a'],
    sex:2
},(err,doc)=>{
    if(err){
        throw err
    }
    console.log(doc)
}) */
/*更新
Model.updateMany({name:'eric'},{
    $push:{city:55}
},(err)=>{
    if(err){
        console.log(err)
    }
})
*/
//查找收盘价

/* Model.find({'ts_code':'000001.SZ'},{'data.close':1},function(err, docs){// docs 此时只包含文档的部分键值})
console.log('eer',err,'dd',docs[0].data.map((item)=>{
    return item.close
})
)
}) */
//查找最后一个值
/* Model.find({'ts_code':'000001.SZ'},{data:{$slice:-1}},function(err, docs){// docs 此时只包含文档的部分键值})
console.log('eer',err,'dd',docs)
}) */
//按照日期查询
/* Model.find({'ts_code':'000001.SZ'},{data:{$elemMatch:{trade_date: '20201027'}}},function(err, docs){// docs 此时只包含文档的部分键值})
console.log('eer',err,'dd',docs[0].data)
})  */

//按日期范围查找
//大于gt,大于等于gte，小于lt 小于等于lte
/* Model.aggregate([
    {"$match": {"ts_code": '000001.SZ' }},
    {"$unwind": "$data"},
    {"$match": {"data.trade_date": { $gt:'20201120',$lt:'20201126' } }},
    {"$group":{
        "_id":"$_id",
        "myResult":{
            "$push": "$data"
        }
      }}]
).exec((err,docs)=>{
    console.log('eer',err,'dd',docs[0].myResult)
}); */



//创建连接池
const pool = mysql.createPool(dbOption)

function querySql(sql, params) {
    return new Promise((resolve, reject) => {
        //获取连接
        pool.getConnection((err, conn) => {
            if (err) {
                reject(err)
                return
            }
            //执⾏sql语句
            conn.query(sql, params, (err, result) => {
                conn.release()
                if (err) {
                    reject(err)
                    return
                }
                resolve(result)
            })
        })
    })
}
//模糊查询  3开头是创业板的代码。6开头是沪市A股的代码。0开头是深市A股的代码或中小板的代码
/* query('select * from stockbasic where ts_code like "0%" and market="中小板"' ).then((data)=>{
    console.log(data[0],data.length)
}) */
//查询某列多少不同种类
/* querySql('SELECT area,count(*) num,ts_code FROM stockbasic GROUP BY area;' ).then((data)=>{
   console.log(Array.isArray(data),data[0].ts_code,data)
  let arr=[]
  data.forEach((item) => {
      let temp={}
      temp.label=item.area
      temp.value=item.area
      arr.push(temp)
  });
  console.log(arr) 
  
}) */
//顺序:where .. group by ...having .. orderby
 //查询有员工的部门所有信息
 //select * from dept a where exists (select 1 from employee b where a.deptnu=b.deptnu);

module.exports = {querySql,Model,IndexModel,MoneyModel}
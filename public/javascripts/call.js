// call.js

var exec = require('child_process').exec;
const execSync = require('child_process').execSync;
var querystring = require('querystring');
const { rejects } = require('assert');
var arg1 = 'hello'
var arg2 = 'jzhou'

function getStockBsicData(){
    var promise =new Promise((resolve,reject)=>{
        exec('python C:\\Users\\50629\\Desktop\\firstPro\\public\\python\\getStockData.py',(error,stdout,stderr)=>{
            console.log('stockBasic')
            if(error) {
                console.log("出错啦")
                console.info('stderr : '+stderr);
                reject(error);
            }
            data2 = eval(stdout) //将输出流字符串转为数组
            resolve(data2);
    })
  })
    return promise

}
// 异步执行
function getData(stockType='RealTime',code='600000'){
    var promise =new Promise((resolve,reject)=>{
        exec('D:Python36\\python C:\\Users\\50629\\Desktop\\firstPro\\public\\python\\web.py'+' '+stockType+' '+code+' ',(error,stdout,stderr)=>{
            console.log('123')
            if(error) {
                console.log("出错啦")
                console.info('stderr : '+stderr);
                reject(error);
            }
            data2 = eval(stdout) //将输出流字符串转为数组
            resolve(data2);
    })
  })
    return promise

}

// 异步执行
function getIndexData(code){
    
    stockType = 'Index'
    var promise =new Promise((resolve,reject)=>{
        exec('D:Python36\\python C:\\Users\\50629\\Desktop\\firstPro\\public\\python\\web.py'+' '+stockType+' '+code+' ',(error,stdout,stderr)=>{
            
            if(error) {
                console.log("出错啦")
                console.info('stderr : '+stderr);
                reject(error);
            }
           
            data2 = eval(stdout) //将输出流字符串转为数组
            
            resolve(data2);
    })
  }).catch((error) =>{
    console.log("error: " + error.message);
  });
    return promise

}
console.log(1)
function getIndustryData(indutry='银行'){
    var data2='lll'

    var promise =new Promise((resolve,reject)=>{
        exec('python C:\\Users\\50629\\Desktop\\firstPro\\public\\python\\industry.py'+' '+indutry+' '+arg2+' ',(error,stdout,stderr)=>{
            if(error) {
                console.info('stderr : '+stderr);
                reject(error);
            }
            data2 = eval(stdout) //将输出流字符串转为数组
            resolve(data2);
    })
  })
    return promise

}


module.exports = {getData,getIndustryData,getStockBsicData,getIndexData};
// 同步执行
/* const output = execSync('python ../python/web.py')
console.log('啊实打实的sync: ' + output.toString())
console.log('阿三发射点发over')
 */
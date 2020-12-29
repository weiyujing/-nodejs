let dbOption
//本地数据库
/* dbOption = {
 connectionLimit: 10,
 host: 'localhost',
 user: 'root',
 password: 'weiyujing',
 port: '3306',
 database: 'user'
} */
//服务器
dbOption = {
    connectionLimit: 10,
    host: '192.168.23.128',
    user: 'root',
    password: 'weiyujing',
    port: '3306',
    database: 'user'
   } 
module.exports = dbOption
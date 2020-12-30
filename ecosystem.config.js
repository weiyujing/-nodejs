module.exports = {
  apps : [{
    name:'app',
    script: './bin/www',
    watch: true,
    instances:0,
    autorestart:true,
    max_memory_restart:'1G',
    ignore_watch: [ // 不⽤监听的⽂件
      "node_modules",
      "logs"

      ],
      "error_file": "./logs/app-err.log", // 错误⽇志⽂件
 "out_file": "./logs/app-out.log",
 "log_date_format": "YYYY-MM-DD HH:mm:ss", // 给每⾏⽇志标记⼀个时间
    env:{
      NODE_ENV:'development'
    },
    env_production:{
      NODE_ENV:'production'
    }
  }],

  deploy : {
    production : {
      user : 'root',
      host : '192.168.23.128',
      ref  : 'origin/master',
      repo : 'git@github.com:weiyujing/-nodejs.git',
      path : '/var/www/production',
      'pre-deploy-local': '',
      'post-deploy' : 'npm install && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
};

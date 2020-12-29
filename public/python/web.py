import sys
import tushare as ts
import datetime
import pandas as pd
import numpy as np
import pymongo
def getRealTime():
    """ print(sys.argv) """ # 传递的参数，第一个是文件名  ['../python/web.py', 'hello', 'jzhou']
    ts.set_token('8791d37f92f5bf4babf2be26716ead550a4226c65b47f1718daa0a84')

    pro = ts.pro_api()

    """ df = pro.daily(ts_code='000001.SZ', start_date='20180701', end_date='20180718')

    #多个股票
    df = pro.daily(ts_code='000001.SZ,600000.SH', start_date='20180701', end_date='20180718')
    close = list(df['close'])
    open = list(df['open']) """
    """ df = ts.get_realtime_quotes('000581')
    df = df[['code','name','price','time']]
    name = list(df['code'])[0]
    price = list(df['price'])[0]
    time = list(df['time'])[0]
    result=[]
    result.append(name)
    result.append(price)
    result.append(time) """
    '''
    历史（当天的）股票实时数据
    '''
    df = ts.get_today_ticks(sys.argv[2][:6])
    price = list(df['price'])
    time = list(df['time'])
    vol = list(df['vol'])
    result=[]
    result.append(time)
    result.append(price)
    result.append(vol)
    return result


def getRSI(day_num,change,close):
    rsi = []
    the_close = []
    for j in range(day_num):
        rsi.append('-')
    for i in range(day_num, len(change)):
        up = 0
        down = 0
        for j in range(i - day_num+1, i+1):
            if (change[j] > 0):
                up = up + change[j]
            else:
                down = down + abs(change[j])
        up = up / day_num
        down = down / day_num
        rsis = up / (up + down)
        rsis = rsis * 100
        rsi.append(rsis)
        the_close.append(close[i])
    return rsi

def getDayData():
  now_time = datetime.datetime.now()
  formatted_today = now_time.strftime('%y%m%d')
  today = '20'+formatted_today
  yesterday = int(formatted_today) - 1
  yesterday = '20'+str(yesterday)
  #散点图
 
  code=sys.argv[2]
  #if(len(code)>6):
#      code = code[:6]
 
  stockType = '日K'

  ts.set_token('8791d37f92f5bf4babf2be26716ead550a4226c65b47f1718daa0a84')
  pro = ts.pro_api()
  if(stockType=='分时'):
      df = ts.pro_bar(ts_code=str(code) + '.SH', start_date='20191111', freq='D', end_date=today)
      pre_close=df['close'][1]
      df = ts.pro_bar(ts_code='600000.SH', start_date='20191130', asset='E',freq='1min', end_date='20191201')
    #  df.to_csv('E:/stock_history_data/minute_data/' + code + '.csv')
      time = list(df['trade_time'])[::-1]
      close = list(df['close'])[::-1]
      vol = list(df['vol'])[::-1]
      response = {
          'pre_close':pre_close,
          'time':time,
          'close': close,
          'vol': vol,
      }
      return response
  if (stockType == '日K'):
      if(len(code)<9):
          if (code[0] == str(0) or code[0] == str(3)):
              df = ts.pro_bar(ts_code=str(code) + '.SZ', start_date='20100601', freq='D', end_date=today)
          else:
              df = ts.pro_bar(ts_code=str(code) + '.SH', start_date='20100601', freq='D', end_date=today)
      else:
         df = pro.daily(ts_code=str(code), start_date='20100601', end_date=today)
         if(len(df)==0):
             df = ts.pro_bar(ts_code=str(code), start_date='20100601', end_date=today,asset='I')

   #   df.to_csv('E:/stock_history_data/minute_data/' + str(code) + '.csv')
      close = list(df['close'])[::-1]
      time = list(df['trade_date'])[::-1]
      changes = list(df['change'])[::-1]
      open = list(df['open'])[::-1]
      high = list(df['high'])[::-1]
      low = list(df['low'])[::-1]
      vol = list(df['vol'])[::-1]
     

      #求KDJ
      low_list = pd.Series(low).rolling(9).min()
     # low_list = df['low'].rolling(9, min_periods=9).min()
      low_list.fillna(value=pd.Series(low).expanding().min(), inplace=True)
      #high_list = df['high'].rolling(9, min_periods=9).max()
      high_list = pd.Series(high).rolling(9).max()
      high_list.fillna(value=pd.Series(high).expanding().max(), inplace=True)
      rsv = (pd.Series(close) - low_list) / (high_list - low_list) * 100
      rsv.fillna(value=100, inplace=True)
      df['K'] = pd.DataFrame(rsv).ewm(com=2).mean()
      df['D'] = df['K'].ewm(com=2).mean()
      df['J'] = 3 * df['K'] - 2 * df['D']
      KDJ =[]
      KDJ.append(list(df['K'])[-dayCount:])
      KDJ.append(list(df['D'])[-dayCount:])
      KDJ.append(list(df['J'])[-dayCount:])

      # 求MACD
      E12 = pd.DataFrame.ewm(pd.Series(close), span=12).mean()
      E26 = pd.DataFrame.ewm(pd.Series(close), span=26).mean()
      dif = E12 - E26
      DEA =   pd.DataFrame.ewm(pd.Series(dif), span=9).mean()
      macd = 2*(dif - DEA)
      MACD = []
      MACD.append(list(dif)[-dayCount:])
      MACD.append(list(DEA)[-dayCount:])
      MACD.append(list(macd)[-dayCount:])

      #求布林
      # 处理数据
      BOLL=[]
      mid = pd.Series(close).rolling(20).mean()
      mid.fillna(value='-', inplace=True)
      temp = pd.Series(close).rolling(20).std()
      top = mid+2*temp
      top.fillna(value='-', inplace=True)
      bottom = mid - 2 * temp
      bottom.fillna(value='-', inplace=True)
      BOLL.append(list(mid)[-dayCount:])
      BOLL.append(list(top)[-dayCount:])
      BOLL.append(list(bottom)[-dayCount:])

      #求RSI
      RSI =[]
      RSI.append(getRSI(6,changes,close)[-dayCount:])
      RSI.append(getRSI(12, changes, close)[-dayCount:])

      #买卖点
      '''
      code = code[:6]
      f = os.popen("python zhang.py {} {}".format(code, dayCount), 'r')
      res = f.readlines()  # res接受返回结果
      f.close()
      Point = []
      print(res)
      res1 = res[1][1:-2]
      res1 = res1.split(',')
      Point.append(res1)
      res1 = res[2][1:-2]
      res1 = res1.split(',')
      Point.append(res1)
      '''
     # return jsonify(res[1])
      response=[]
      time=(time[-dayCount:])
      open=(open)[-dayCount:]
      high=(high[-dayCount:])
      low=(low[-dayCount:])
      close=(close[-dayCount:])
      vol=(vol[-dayCount:])
      KDJ=(KDJ)
      MACD=(MACD)
      BOLL=(BOLL)
      RSI=(RSI)


      gp_table=[]
      gp_table.append(time[-1])
      gp_table.append(open[-1])
      gp_table.append(close[-1])
      gp_table.append(low[-1])
      gp_table.append(high[-1])
      gp_table.append(vol[-1])
      gp_table.append(close[-2])
      


      response.append(time)
      response.append(open)
      response.append(close)
      response.append(low)
      response.append(high)
      
      
      response.append(vol)
      response.append(KDJ)
      response.append(MACD)
      response.append(BOLL)
      response.append(RSI)

      response.append(gp_table)
      
     
    
      """ response = {
          'time':(time[-dayCount:]),
          'open':(open)[-dayCount:],
          'high':(high[-dayCount:]),
          'low':(low[-dayCount:]),
          'close': (close[-dayCount:]),
          'vol': (vol[-dayCount:]),
          'KDJ':(KDJ),
          'MACD':(MACD),
          'BOLL':(BOLL),
          'RSI':(RSI),
      } """
      


      return response


dayCount = 200

def getIndexData(code):
    res=[]
    myclient = pymongo.MongoClient('mongodb://localhost:27017/')
    mydb = myclient['stockdata']
    mycol = mydb["dailyData"]
    result = mycol.find_one({"ts_code": code},{"data":{"$slice":-300},'_id':0})
    result = result["data"]
    close = []
    Open=[]
    changes = []
    high=[]
    low=[]
    for i in range(len(result)):
        close.append(result[i]['close'])
        Open.append(result[i]['open'])
        high.append(result[i]['high'])
        low.append(result[i]['low'])
        changes.append(result[i]['change'])
    #求KDJ
    low_list = pd.Series(low).rolling(9).min()
    # low_list = df['low'].rolling(9, min_periods=9).min()
    low_list.fillna(value=pd.Series(low).expanding().min(), inplace=True)
    #high_list = df['high'].rolling(9, min_periods=9).max()
    high_list = pd.Series(high).rolling(9).max()
    high_list.fillna(value=pd.Series(high).expanding().max(), inplace=True)
    rsv = (pd.Series(close) - low_list) / (high_list - low_list) * 100
    rsv.fillna(value=100, inplace=True)
    df={}
    df['K'] = pd.DataFrame.ewm(pd.Series(rsv),com=2).mean()
    #res.append(list(pd.DataFrame.ewm(pd.Series(rsv),com=2).mean()))
   
    df['D'] = df['K'].ewm(com=2).mean()
    df['J'] = 3 * df['K'] - 2 * df['D']
    KDJ =[]
    KDJ.append(list(df['K'])[-dayCount:])
    KDJ.append(list(df['D'])[-dayCount:])
    KDJ.append(list(df['J'])[-dayCount:])

    # 求MACD
    E12 = pd.DataFrame.ewm(pd.Series(close), span=12).mean()
    E26 = pd.DataFrame.ewm(pd.Series(close), span=26).mean()
    dif = E12 - E26
    DEA =   pd.DataFrame.ewm(pd.Series(dif), span=9).mean()
    macd = 2*(dif - DEA)
    MACD = []
    MACD.append(list(dif)[-dayCount:])
    MACD.append(list(DEA)[-dayCount:])
    MACD.append(list(macd)[-dayCount:])

    #求布林
    # 处理数据
    BOLL=[]
    mid = pd.Series(close).rolling(20).mean()
    mid.fillna(value='-', inplace=True)
    temp = pd.Series(close).rolling(20).std()
    top = mid+2*temp
    top.fillna(value='-', inplace=True)
    bottom = mid - 2 * temp
    bottom.fillna(value='-', inplace=True)
    BOLL.append(list(mid)[-dayCount:])
    BOLL.append(list(top)[-dayCount:])
    BOLL.append(list(bottom)[-dayCount:])

    #求RSI
    RSI =[]
    RSI.append(getRSI(6,changes,close)[-dayCount:])
    RSI.append(getRSI(12, changes, close)[-dayCount:])
    
    res.append(KDJ)
    res.append(MACD)
    res.append(BOLL)
    res.append(RSI)
    
    return res
dayCount=200
if(sys.argv[1]=='RealTime'):
 
    print(getRealTime()) 
if(sys.argv[1]=='日K'):
    
    print(getDayData())
if(sys.argv[1]=='Index'):
    
    print(getIndexData(sys.argv[2]))



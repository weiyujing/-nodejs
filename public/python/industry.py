#-*- coding: utf-8 -*-
import datetime
import pandas as pd
import tushare as ts
import numpy as np
import sys


#获取某行业走势图（求其股票平均值）

def getcloselist():
    indutry = sys.argv[1]
    #调接口
    now_time = datetime.datetime.now()
    formatted_today = now_time.strftime('%y%m%d')
    today = '20' + formatted_today

    ts.set_token('8791d37f92f5bf4babf2be26716ead550a4226c65b47f1718daa0a84')
    pro = ts.pro_api()
    df = pro.index_classify(level='L2', src='SW')
    df = np.array(df)
    indutrycode = 0
    for i in df:
        if (i[1] == str(indutry)):
            indutrycode = i[0]    #获取行业代码
            break
    df = pro.index_member(index_code=str(indutrycode))
    stocklists = list(df['con_code'])   #获取行业下所属股票代码
   # df = ts.pro_bar(ts_code=str(stocklists[0]), start_date='20190322', freq='D', end_date=today)
    #df_len = len(df)

    closelists = [0 for i in range(dayCount)]
    count = 0
    for code in stocklists:
      code = code[:6]
      #  df = ts.pro_bar(ts_code=str(code), start_date='20190322', freq='D', end_date=today)
      try:
        df = pd.read_csv('E:\stock_history_data\sh380_data\\' + code + '.csv')
      except:
        df = ts.pro_bar(ts_code=str(code), start_date='20100101', freq='D', end_date='20191112')
        df.to_csv('E:/stock_history_data/sh380_data/' + code + '.csv',
                  columns=['trade_date', 'open', 'high', 'low', 'close', 'change', 'vol', 'amount'])

      close = list(df['close'])[::-1]
      close = list(close)[-dayCount:]

      if (len(close) != dayCount):
        continue
      count += 1
      closelists += pd.Series(close)

    closelists = np.array(closelists) / count
    class A:
        def __init__(self, value):
            self. value = value
    list1 = []
    for i in range(len(stocklists)):
        temp = A(str(stocklists[i]))
        list1.append(temp.__dict__)
    res=[]
    res.append(list(list1)) 
    res.append(list(closelists))
    
    return res

#获取某行业下所有股票代码

def getindutry():
    indutry = '银行'
    ts.set_token('8791d37f92f5bf4babf2be26716ead550a4226c65b47f1718daa0a84')
    pro = ts.pro_api()
    # df = pro.daily(ts_code=str(code) + '.SH', start_date='20100101', end_date='20191112')
    df = pro.index_classify(level='L2', src='SW')
    df = np.array(df)
    indutrycode = 0
    for i in df:
        if (i[1] == str(indutry)):
            indutrycode = i[0]
            break
    df = pro.index_member(index_code=str(indutrycode))
    stocklists = list(df['con_code'])
    #数组转成json对象
    class A:
        def __init__(self, value):
            self. value = value
    list1 = []
    for i in range(len(stocklists)):
        temp = A(str(stocklists[i]))
        list1.append(temp.__dict__)
    
    return list1

dayCount = 200
print(getcloselist())


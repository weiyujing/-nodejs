import datetime
import pandas as pd
import tushare as ts
import numpy as np
import sys

def getStockList():
    pro = ts.pro_api()

#查询当前所有正常上市交易的股票列表

    data = pro.stock_basic(exchange='', list_status='L', fields='ts_code,symbol,market,name,area,industry,exchange,list_date')
    return data
print(getStockList())
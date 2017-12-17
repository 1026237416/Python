# -*- coding:utf-8 -*-
'''
Created on 2016年3月30日

@author: mu
'''

phone_book = {'Tom':123,'Jerry':456}

print(phone_book)
print(phone_book['Tom'])
print(phone_book["Jerry"])

pricelist = {"clock":12, "table":100, "xiao":100}
print(pricelist)
del pricelist["clock"]
print(pricelist)
del pricelist
#使用dict创建字典
pricelist = dict([('clock',12),("table",100),("xiao",200)])
print(pricelist)
#使用dict结合for in按规律创建字典
pricelist2 = dict([(x, 10*x) for x in [1, 2, 3]])
print(pricelist2)

#向字典添加元素
pricelist["apple"] = 12
print(pricelist)

#清除Dictionary
pricelist2.clear()
print(pricelist2)

#Dictionary拷贝
dict_a = {'one':1, "two":2, 'three':3, 'four':4}
print(dict_a)
dict_b = dict_a.copy()
print(dict_b)

dict_b['four'] = 5
print(dict_b)
print(dict_a)

dict_c = dict_a
print(dict_c)
dict_c["four"]  = 5
print(dict_c)
print(dict_a)

print(dict_c.get("four"))
print(dict_c.get("five"))
print(dict_c.get("five","fuck"))

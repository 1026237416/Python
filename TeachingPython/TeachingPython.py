'''
Created on 2016-3-29

@author: mu
'''
import os
import requests

print(os.getcwd())

r = requests.get("http://eclipse.org")

print(r.url)
print(r.encoding)
print(r.text)
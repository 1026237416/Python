import urllib2

url = "http://www.baidu.com"
user_agent = "Mozilla/5.0 (Windows NT 6.1; WOW64; rv:52.0) Gecko/20100101 Firefox/52.0"

handers = {
           'User-Agent' : user_agent
           }

req = urllib2.Request(url, headers = handers)
response = urllib2.urlopen(req)

html = response.read()
print(html)

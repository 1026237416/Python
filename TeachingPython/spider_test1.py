#coding=utf-8 
'''
Created on 2017年3月24日

@author: li
'''
import urllib2

def load_page(url):
    '''
    Send a url request
    response a html page
    '''
    user_agent = "Mozilla/5.0 (Windows NT 6.1; WOW64; rv:52.0) Gecko/20100101 Firefox/52.0"
    headers = {
               'User-Agent' : user_agent
               }
    
    req = urllib2.Request(url, headers = headers)
    response = urllib2.urlopen(req)
    html = response.read() 
    return html

def save_file(file_name, data):
    '''
    save 'data' to file
    '''
    # 1. open file
    # 2. write to file
    # 3. close file
    fs = open(file_name, 'w')
    print("Saving file.....")
    fs.write(data)
    fs.close()
    print("Save file successful")


def tieba_spider(url, begin_page, end_page):
    '''
    i = 1, pn = 0
    i = 2, pn = 50
    i = 3, pn = 100
    '''
    for i in range(begin_page, end_page + 1):
        pn = 50 * (i - 1)
        my_url = url + str(pn)
        print(my_url)
        html = load_page(my_url)
        file_name = str(i) + ".html"
        save_file(file_name, html)
        

if __name__ == "__main__":
    url = raw_input("Please input a URL:")
    begin_page = int(raw_input("Please input the begin page number:"))
    end_page = int(raw_input("Please input the end page number:"))
    
    tieba_spider(url, begin_page, end_page)
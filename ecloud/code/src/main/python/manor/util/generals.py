# coding=utf-8
import json
import subprocess
import sys
import tarfile
import traceback
import urllib2

from concurrent.futures import ThreadPoolExecutor

from manor.util import cfgutils

__author__='Sean,Gavin'

__Executor=None


def get_thread_pool():
    global __Executor
    if __Executor is None:
        __Executor=ThreadPoolExecutor(
            max_workers=cfgutils.getval('app','thread_pool'))
    return __Executor


def trace():
    exc_type,exc_value,exc_traceback=sys.exc_info()
    error_str=""
    for e in traceback.format_exception(exc_type,exc_value,exc_traceback):
        error_str+=e
    return error_str


def download_to_path(path,file_url):
    file_name=file_url.split('/')[-1]

    u=urllib2.urlopen(file_url)
    f=open(path+'/'+file_name,'wb')

    file_size_dl=0
    block_sz=8192
    while True:
        file_buffer=u.read(block_sz)
        if not file_buffer:
            break

        file_size_dl+=len(file_buffer)
        f.write(file_buffer)

    f.close()


def get_ip():
    shell=r"ifconfig | sed -En 's/127.0.0.1//;s/.*inet (addr:)?(([0-9]*\.){3}[0-9]*).*/\2/p'"
    proc=subprocess.Popen(shell,stdout=subprocess.PIPE,shell=True)
    return proc.stdout.readline().replace('\n','')


def extract_current(file_name,path=None):
    ex_path=file_name.replace('.tar.gz','')
    tfile=tarfile.open(file_name)
    if path:
        tfile.extractall(path=ex_path)
    else:
        tfile.extractall()
    tfile.close()


def gen_response(response,code=200):
    response_obj={
        "msg":"success",
        "total":1,
        "result":[],
        "success":True,
        "code":200
    }
    if type(response) is list:
        response_obj['total']=len(response)
    else:
        response_obj['total']=1
    response_obj['result']=response
    if code!=200:
        response_obj['msg']=response
        response_obj['success']=False
    response_obj['code']=code

    class Wrapper(object):
        __dict__=json.dumps(response_obj)

    return Wrapper()

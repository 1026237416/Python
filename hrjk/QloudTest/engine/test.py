# -*- coding:utf-8 -*-
import zipfile
import wx
import tempfile
import os
import shutil
import platform

ZIP_PATH_WINDOWS = u'E:\\auto_case\\case\\'
ZIP_PATH_LINUX = u''
SAVE_PATH_WINDOWS = u'E:\\auto_case\\result\\'
SAVE_PATH_LINUX = u''

def unzip(zipath, filepath):
    zipinfo = zipfile.ZipFile(zipath)
    zipinfo.extractall(filepath)
    zipinfo.close()
def create_dir():
    sysstr = platform.system()
    print sysstr
    if sysstr =="Windows":
        if not os.path.isdir(ZIP_PATH_WINDOWS):
            os.makedirs(ZIP_PATH_WINDOWS)
            os.makedirs(SAVE_PATH_WINDOWS)
    elif sysstr == "Linux" :
        if not os.path.isdir(ZIP_PATH_LINUX):
            os.makedirs(ZIP_PATH_LINUX)
            os.makedirs(SAVE_PATH_LINUX)    
if __name__ == '__main__':
    create_dir()
    
    
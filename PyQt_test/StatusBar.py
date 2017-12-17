# -*- coding:utf-8 -*-
'''
Created on 2016Äê4ÔÂ8ÈÕ

@author: liping
'''
import sys
from PyQt4 import QtGui

class MainWindows(QtGui.QMainWindow):
    def __init__(self,parent = None):
        QtGui.QMainWindow.__init__(self)
        
        self.resize(250,150)
        self.setWindowTitle('statusbar')
        self.statusBar().showMessage('Ready')
        
app = QtGui.QApplication(sys.argv)
main = MainWindows()
main.show()
sys.exit(app.exec_())
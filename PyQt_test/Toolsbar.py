# -*- coding:utf-8 -*-
'''
Created on 2016��4��8��

@author: liping
'''
import sys
from PyQt4 import QtGui,QtCore

class MainWondow(QtGui.QMainWindow):
    def __init__(self,parent = None):
        QtGui.QMainWindow.__init__(self)
        
        self.resize(250,150)
        self.setWindowTitle('ToolBar')
        
        self.exit = QtGui.QAction(QtGui.QIcon('icons/exit.png'),'Exit',self)
        self.exit.setShortcut('Ctrl+Q')
        self.connect(self.exit, QtCore.SIGNAL('triggered()'),QtGui.qApp,QtCore.SLOT('quit()'))
        self.toolbar = self.addToolBar('Exit')
        self.toolbar.addAction(self.exit)
        
app = QtGui.QApplication(sys.argv)
main = MainWondow()
main.show()
sys.exit(app.exec_())
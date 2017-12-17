# -*- coding:utf-8 -*-
'''
Created on 2016��4��8��

@author: liping
'''
import sys
from PyQt4 import QtGui
from PyQt4 import QtCore

class MainWindow(QtGui.QMainWindow):
    def __init__(self,parent = None):
        QtGui.QMainWindow.__init__(self)
        
        self.resize(350,250)
        self.setWindowTitle("mainWindow")
        
        textEdit = QtGui.QTextEdit()
        self.setCentralWidget(textEdit)
        
        exit = QtGui.QAction(QtGui.QIcon('icons/exit.png'),'Exit',self)
        exit.setShortcut('Ctrl+Q')
        exit.setStatusTip("Exit application")
        self.connect(exit,QtCore.SIGNAL('triggered()'),QtGui.qApp,QtCore.SLOT('quit()'))
        
        self.statusBar()
        
        menubar = self.menuBar()
        file = menubar.addMenu('&File')
        file.addAction(exit)
        
        toolbar = self.addToolBar('Exit')
        toolbar.addAction(exit)
        
app = QtGui.QApplication(sys.argv)
main = MainWindow()
main.show()
sys.exit(app.exec_())
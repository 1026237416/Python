# -*- coding:utf-8 -*-
'''
Created on 2016��4��8��

@author: liping
'''

import sys
from PyQt4 import QtGui,QtCore

class QuitButton(QtGui.QWidget):
    def __init__(self,parent = None):
        QtGui.QWidget.__init__(self,parent)
        
        self.setGeometry(300,300,250,150)
        self.setWindowTitle('quitButton')
        
        quit = QtGui.QPushButton('Close',self)
        quit.setGeometry(100,100,60,35)
        
        self.connect(quit, QtCore.SIGNAL('clicked()'), QtGui.qApp,QtCore.SLOT('quit()'))
        
app = QtGui.QApplication(sys.argv)
qb = QuitButton()
qb.show()
sys.exit(app.exec_())
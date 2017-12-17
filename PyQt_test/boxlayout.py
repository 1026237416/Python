# -*- coding:utf-8 -*-
'''
Created on 2016��4��10��

@author: liping
'''
import sys
from PyQt4 import QtGui

class Boxlayoutt(QtGui.QWidget):
    def __init__(self,parent = None):
        QtGui.QWidget.__init__(self)
        
        self.setWindowTitle('box layout')
        
        ok_button = QtGui.QPushButton('OK')
        cancel_button = QtGui.QPushButton('Cancel')
        
        hbox = QtGui.QHBoxLayout()
        hbox.addStretch(1)
        hbox.addWidget(ok_button)
        hbox.addWidget(cancel_button)
        
        vbox = QtGui.QVBoxLayout()
        vbox.addStretch(1)
        vbox.addLayout(hbox)
        
        self.setLayout(vbox)
        self.resize(300,150)
        
app = QtGui.QApplication(sys.argv)
qb = Boxlayoutt()
qb.show()
sys.exit(app.exec_())
# -*- coding:utf-8 -*-
'''
Created on 2016��4��8��

@author: liping
'''
import sys
from PyQt4 import QtGui
from PyQt4 import QtCore

class Tooptip(QtGui.QWidget):
    def __init__(self,parend = None):
        QtGui.QWidget.__init__(self,parend)
        
        self.setGeometry(300,300,250,150)
        self.setWindowTitle('Tooptip')
        
        self.setToolTip('This is a <b> QWidget </b> widget')
        QtGui.QToolTip.setFont(QtGui.QFont('OldEnglish',10))
        
app = QtGui.QApplication(sys.argv)
tooltip = Tooptip()
tooltip.show()
sys.exit(app.exec_())
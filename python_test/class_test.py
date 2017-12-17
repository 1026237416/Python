class TestCss:
    cssa = 'class-attribe'  
    def __init__(self):
        self.a = 0
        self.b = 20
    def info(self):
        print ('a:', self.a,'b:',self.b)
        
    def info_cssa(self):
        print ('a:', self.a,'b:',self.b,TestCss.cssa)
        
if __name__ == '__main__':
    tc = TestCss()
    tc.info()
    tc.color = "red"
    print(tc.color)
    tca = TestCss()
    tcb = TestCss()
    tca.a = 200
    tca.b = 300
    tca.info()
    tcb.info()
    
    tcc = TestCss()
    tcc.info_cssa()
    tcd = TestCss()
    tcd.info_cssa()
    TestCss.cssa = 'Test'
    tcc.info_cssa()
    tcd.info_cssa()
    
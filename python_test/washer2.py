class Washer:
    def __init__(self):
        self.water = 0
        self.scour = 0
        
    def set_water(self,water):
        self.water = water
        
    def set_scour(self,scour):
        self.scour = scour
        
    def add_water(self):
        print('Add water:',self.water)
        
    def add_scour(self):
        print('Add scour:', self.scour)
        
    def start_wash(self):
        self.add_water()
        self.add_scour()        
        print('Start wash...')
        
if __name__ == '__main__':
    w = Washer()
    w.set_water(20)
    w.set_scour(4)
    w.start_wash()
# coding:gbk

import random as ran

class Fish:
    def __init__(self):
        self.x = ran.randint(0, 10)
        self.y = ran.randint(0, 10)
        
    def move(self):
        self.x -= 1
        print("我在:", self.x, self.y)
        
class Goldfish(Fish):
    pass

class Carp(Fish):
    pass

class Salmon(Fish):
    pass

class Shark(Fish):
    def __init__(self):
        Fish.__init__(self)
        self.hungry = True
        
    def eat(self):
        if self.hungry:
            print("I want to eat !!!")
            self.hungry = False
        else:
            print("I'm full !!!")


shark = Shark()

shark.move()
shark.move()
shark.move()
shark.move()
shark.move()
shark.move()
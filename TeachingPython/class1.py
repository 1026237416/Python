class Parent:
    def hello(self):
        print("Calling parent function......")
        
class Child(Parent):
    pass

c = Child()
c.hello()
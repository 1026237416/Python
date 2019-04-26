class MyClass(object):
    a = "a"

    def __init__(self):
        print("__init__")
        self.b = "b"

    @staticmethod
    def func1():
        print("func1 static")
        print(MyClass.a)

    def func2(self):
        print("func2")
        print(self.b)

    def func3(self):
        self.func1()


my = MyClass()
my.func1()
my.func2()
my.func3()
print("************************************")
MyClass.func1()

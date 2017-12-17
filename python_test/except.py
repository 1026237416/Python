s=raw_input("Please input your age:")

if s == "":
    raise Exception("Input must no be empty.")

try:
    i = int(s)
except ValueError:
    print "Could not convert data to an integer."
except:
    print "Unknow exception!"

else:
    print "You are %d"%i, "years old"
finally:
    print "Goodbye"

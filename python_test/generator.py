def spam():
    yield"first"
    yield"second"
    yield"third"

for x in spam():
    print x

gen=spam()

print gen.next()
print gen.next()
print gen.next()


num1 = [1, 4, 5, 3, 5, 7, 5, 0, 8]

tmp = []

for each in num1:
    if each not in tmp:
        tmp.append(each)
        
print(tmp)

print(list(set(num1)))
# 将[1, 5, 4, 2, -1, 5,-6,-2]转换为[1, 5, 4, 2, 5, -1, -6, -2]
# 要求：
#     1、正数在左， 负数在又
#     2、不改变数字的相对顺序
#     3、空间复杂度为O(1)

test_list = [1, -5, 4, 2, -1, 5, -3, -2, 8, 7, -6, 3, -7, -9]

for i in range(len(test_list) - 1):
    if (test_list[i] < 0) and (test_list[i + 1] > 0):
        test_list[i], test_list[i + 1] = test_list[i + 1], test_list[i]

    print(test_list)

print("************************************")
for i in range(len(test_list)):
    if test_list[i] < 0:
        test_list.append(test_list[i])
        # test_list.remove(test_list[i])
    print(test_list)


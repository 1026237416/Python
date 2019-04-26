from threading import Thread


def func_tool(a, b):
    print("*******************************")
    print(a)
    print(b)
    print("*******************************")
    return a + b


def thread_func(func, th_id, result, *args):
    print("///////////////////////////////////////////")
    print(*args)
    res = func(*args)
    result[th_id] = res
    print("///////////////////////////////////////////")


result_old = {}
t_list = []
for i in range(5):
    t = Thread(target=thread_func, args=(func_tool, i, result_old, i + 1, i + 3))
    t.start()
    t_list.append(t)

[t.join() for t in t_list]


print(result_old)

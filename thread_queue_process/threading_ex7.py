import random
from threading import Thread


def func2(m, results, index):
    for i in range(m):
        results[index].append(random.choice([0, 1, 2, 3, 4, 5]))


def main():
    threads = [None] * 4
    results = [[] for i in range(4)]
    for i in range(4):
        threads[i] = Thread(target=func2, args=(3, results, i))
        threads[i].start()
    for i in range(4):
        threads[i].join()
    return results

print(main())

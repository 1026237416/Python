import asyncio
import itertools
import sys


@asyncio.coroutine  # 交给 asyncio 处理的协程要使用 @asyncio.coroutine 装饰
def spin(msg):
    for char in itertools.cycle('|/-\\'):
        status = char + ' ' + msg
        print(status)
        try:
            yield from asyncio.sleep(.1)  # 使用 yield from asyncio.sleep(.1) 代替 time.sleep(.1)，这样的休眠不会阻塞事件循环。
        except asyncio.CancelledError:  # 如果 spin 函数苏醒后抛出 asyncio.CancelledError 异常，其原因是发出了取消请求，因此退出循环。
            break


@asyncio.coroutine
def slow_function():  # slow_function 函数是协程，在用休眠假装进行 I/O 操作时，使用 yield from 继续执行事件循环。
    # 假装等待I/O一段时间
    yield from asyncio.sleep(3)  # yield from asyncio.sleep(3) 表达式把控制权交给主循环，在休眠结束后恢复这个协程。
    return 42


@asyncio.coroutine
def supervisor():  # supervisor 函数也是协程
    spinner = asyncio.async(spin('thinking!'))  # asyncio.async(...) 函数排定 spin 协程的运行时间，使用一个 Task 对象包装spin 协程，并立即返回。
    print('spinner object:', spinner)
    result = yield from slow_function()  # 驱动 slow_function() 函数。结束后，获取返回值。
    # 同时，事件循环继续运行，因为slow_function 函数最后使用 yield from asyncio.sleep(3) 表达式把控制权交回给了主循环。
    spinner.cancel()  # Task 对象可以取消；取消后会在协程当前暂停的 yield 处抛出 asyncio.CancelledError 异常。协程可以捕获这个异常，也可以延迟取消，甚至拒绝取消。
    return result


if __name__ == '__name__':
    loop = asyncio.get_event_loop()  # 获取事件循环的引用

    result = loop.run_until_complete(supervisor())  # 驱动 supervisor 协程，让它运行完毕；这个协程的返回值是这次调用的返回值。

    loop.close()

    print('Answer:', result)

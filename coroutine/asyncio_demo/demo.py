import asyncio
from time import sleep


@asyncio.coroutine
def hello():
    print("Hello world!")
    # 异步调用asyncio.sleep(1):
    # r = yield from asyncio.sleep(5)
    sleep(5)
    print("Hello again!")


# 获取EventLoop:
loop = asyncio.get_event_loop()
# 执行coroutine
loop.run_until_complete(hello())
print("-------------------->>>>")
loop.close()

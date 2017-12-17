from fabric.api import env, roles, run, execute

env.roledefs = {
    'server1': ['root@10.10.138.130:22', ],
    'server2': ['root@10.10.138.131:22', ]
}

env.password = 'password'


@roles('server1')
def task1():
    run('ls /home -l | wc -l')


@roles('server2')
def task2():
    run('du -sh /home')


def test():
    execute(task1)
    execute(task2)

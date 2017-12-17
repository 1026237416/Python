# -*- coding: utf-8 -*-
import re
import redis
import ldappool
from tornado import gen
from tornado_mysql import pools
from tornado_mysql.cursors import DictCursor

from easted import config
from easted.core.exception import ECloudException

__author__ = 'litao@easted.com.cn'

CONF = config.CONF
__all__ = ["init", "get_pool", "execute_commit", "update", "LOCAL_DB", "COMMON_DB", "NOVA_DB", "get_conn"]

config.register("database.db_local", secret=True)
config.register("database.db_global", secret=True)
config.register("database.db_nova", secret=True)
config.register("database.db_cinder", secret=True)
config.register("database.db_redis", secret=True)
config.register("database.db_keystone", secret=True)
config.register("database.db_glance", secret=True)
config.register("database.db_neutron", secret=True)
config.register("database.max_idle_connections", setting_type=config.TYPE_INT, default=1, secret=True)
config.register("database.max_recycle_sec", setting_type=config.TYPE_INT, default=3600, secret=True)
config.register("ldap.enable", default="False", setting_type=config.TYPE_BOOL, readonly=True)
config.register("ldap.base_dn", setting_type=config.TYPE_STR, secret=True)
config.register("ldap.auth_domain", setting_type=config.TYPE_STR, secret=True)
config.register("ldap.auth_user", setting_type=config.TYPE_STR, secret=True)
config.register("ldap.auth_pass", setting_type=config.TYPE_STR, secret=True)

__CONN_TEMPLATE = 'mysql://(?P<user>\w+):(?P<passwd>\w+)@(?P<host>\d.+):(?P<port>\d+)/(?P<db>\w+)'
__DB_POOLS = {}
__FILE_CACHE = {}

LOCAL_DB = 'ecloud_db_pool'
COMMON_DB = 'common_db_pool'
NOVA_DB = 'nova_db_pool'
CINDER_DB = 'cinder_db_pool'
REDIS_DB = 'redis_db_pool'
KEYSTONE_DB = 'keystone_db_pool'
GLANCE_DB = 'glance_db_pool'
NEUTRON_DB = 'neutron_db_pool'
E_LDAP = 'e_ldap_pool'


def init():
    ecloud_db_pool = pools.Pool(get_conn(CONF.database.db_local),
                                max_idle_connections=CONF.database.max_idle_connections,
                                max_recycle_sec=CONF.database.max_recycle_sec)
    __DB_POOLS[LOCAL_DB] = ecloud_db_pool

    common_db_pool = pools.Pool(get_conn(CONF.database.db_global),
                                max_idle_connections=CONF.database.max_idle_connections,
                                max_recycle_sec=CONF.database.max_recycle_sec)
    __DB_POOLS[COMMON_DB] = common_db_pool

    nova_db_pool = pools.Pool(get_conn(CONF.database.db_nova),
                              max_idle_connections=CONF.database.max_idle_connections,
                              max_recycle_sec=CONF.database.max_recycle_sec)
    __DB_POOLS[NOVA_DB] = nova_db_pool

    cinder_db_pool = pools.Pool(get_conn(CONF.database.db_cinder),
                                max_idle_connections=CONF.database.max_idle_connections,
                                max_recycle_sec=CONF.database.max_recycle_sec)
    __DB_POOLS[CINDER_DB] = cinder_db_pool

    keystone_db_pool = pools.Pool(get_conn(CONF.database.db_keystone),
                                  max_idle_connections=CONF.database.max_idle_connections,
                                  max_recycle_sec=CONF.database.max_recycle_sec)
    __DB_POOLS[KEYSTONE_DB] = keystone_db_pool

    glance_db_pool = pools.Pool(get_conn(CONF.database.db_glance),
                                max_idle_connections=CONF.database.max_idle_connections,
                                max_recycle_sec=CONF.database.max_recycle_sec)
    __DB_POOLS[GLANCE_DB] = glance_db_pool

    neutron_db_pool = pools.Pool(get_conn(CONF.database.db_neutron),
                                 max_idle_connections=CONF.database.max_idle_connections,
                                 max_recycle_sec=CONF.database.max_recycle_sec)
    __DB_POOLS[NEUTRON_DB] = neutron_db_pool

    redis_conn = get_conn(CONF.database.db_redis)
    redis_db_pool = redis.ConnectionPool(host=redis_conn['host'], port=redis_conn['port'], db=redis_conn['db'])

    __DB_POOLS[REDIS_DB] = redis_db_pool

    if CONF.ldap.enable:
        au = "CN=%s,%s" % (CONF.ldap.auth_user, CONF.ldap.base_dn)
        url = "ldap://%s:389" % CONF.ldap.auth_domain
        e_ldap_pool = ldappool.ConnectionManager(url, au, CONF.ldap.auth_pass, use_pool=True, size=2)
        __DB_POOLS[E_LDAP] = e_ldap_pool


def get_eldap():
    return get_pool(E_LDAP)


def get_local():
    return get_pool(LOCAL_DB)


def get_common():
    return get_pool(COMMON_DB)


def get_nova():
    return get_pool(NOVA_DB)


def get_cinder():
    return get_pool(CINDER_DB)


def get_keystone():
    return get_pool(KEYSTONE_DB)


def get_glance():
    return get_pool(GLANCE_DB)


def get_neutron():
    return get_pool(NEUTRON_DB)


def get_redis():
    return redis.Redis(connection_pool=get_pool(REDIS_DB))


def get_pool(pool_name=LOCAL_DB):
    """获取连接处对象
    :param pool_name:
    :return:
    """
    if pool_name and __DB_POOLS[pool_name] is not None:
        return __DB_POOLS[pool_name]
    raise ECloudException('cat not find db pool: ' + pool_name)


def get_conn(conn):
    """解析连接信息
    :param conn:
    :return:
    """
    connect_kwargs = __reverse_format(__CONN_TEMPLATE, conn)
    connect_kwargs['port'] = int(connect_kwargs['port'])
    connect_kwargs['charset'] = 'utf8'
    connect_kwargs['cursorclass'] = DictCursor
    return connect_kwargs


def __reverse_format(temp, res):
    """字符串反序列化
    :param temp:
    :param res:
    :return:
    """
    m = re.match(temp, res)
    if m:
        return m.groupdict()
    return False


@gen.coroutine
def execute_commit(db, sql, param=None):
    """
    该方法处理一个事务处理一个execute的业务
    :param db:
    :param sql:
    :param param:
    :return:
    """
    tx = yield db.begin()
    try:
        if param:
            cur = yield tx.execute(sql, param)
        else:
            cur = yield tx.execute(sql)
        # if cur:
        #     cur.close()
    except Exception, e:
        yield tx.rollback()
        raise e
    else:
        yield tx.commit()


@gen.coroutine
def update(db, sql, param=None):
    """
    该方法处理一个事务处理一个execute的业务
    :param db:
    :param sql:
    :param param:
    :return:
    """
    tx = yield db.begin()
    try:
        if param:
            cur = yield tx.execute(sql, param)
        else:
            cur = yield tx.execute(sql)
    except Exception, e:
        yield tx.rollback()
        raise e
    else:
        count = cur.rowcount
        # cur.close()
        yield tx.commit()
        raise gen.Return(count)

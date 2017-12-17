# coding:utf-8
import logging, datetime
from exception import *
import commands
from Crypto.Cipher import AES
from binascii import a2b_hex

from manor.util.generals import trace

LOG = logging.getLogger('system')


class License():
    def __init__(self, pri_key):
        self.iv = self.get_pri_key(pri_key)
        self.key = self.get_pub_key()
        self.mode = AES.MODE_CBC
        # self.licensePath = licensePath

    def get_pri_key(self, pri_key):
        try:
            if len(pri_key) <= 16:
                pri_key = pri_key + (16 - len(pri_key)) * "\0"
            else:
                pri_key = pri_key[0:16]
            return pri_key
        except Exception as e:
            LOG.error("get_pri_key error:%s" % e)
            LOG.error(trace())
            raise e

    def get_pub_key(self):
        try:
            # return "0a0a1a03" + (32 - len("0a0a1a03")) * "\0"
            status, hostid = commands.getstatusoutput("hostid")
            if status == 0:
                res = divmod(len(hostid), 32)
                pub_key = hostid + (32 - res[1]) * "\0"
                return pub_key
        except Exception as e:
            LOG.error("get_pub_key error:%s" % e)
            LOG.error(trace())
            raise e

    def decrypt(self, text):
        try:
            cryptor = AES.new(self.key, self.mode, self.iv)
            plain_text = cryptor.decrypt(a2b_hex(text))
            return plain_text.rstrip('\0')
        except Exception as e:
            LOG.error("decrypt error:%s" % e)
            LOG.error(trace())
            raise e

    # def get_secret(self):
    #     with open(self.licensePath, "r") as f:
    #         export = f.read()
    #     return export

    def get_hardinfo(self, export):
        try:
            # export = self.get_secret()
            context = self.decrypt(export)
            out_put = eval(context)
            return out_put
        except Exception as e:
            LOG.error("get_hardinfo error: %s" % e)
            LOG.error(trace())
            raise LicenseAnalysisError


if __name__ == '__main__':
    licensePath = "C:\work\ecloud\code\src\main\etc\downloads\license"
    pri_key = 'hardinfo3.26'

    pc = License(pri_key, licensePath)
    context = pc.get_hardinfo()
    print "context====", type(context), context

# coding:utf-8
import logging
from easted.core.rest import put, RestHandler, Response, delete, get, post
from easted.license.exception import LicenseOverdue
import easted.log as optLog
from easted.log import Type, Operator
from easted import license

LOG = logging.getLogger('system')


class Service(RestHandler):
    @post(_path="/license/upload")
    def license_upload(self):
        """
            上传凭证
        :return:
        """
        private_key = self.request.arguments.get("private_key")[0]
        result = license.license_upload(self, private_key)
        optLog.write(self.request, Type.LICENSE, "license", Operator.UPLOAD, "license")

        if result.get("date_interval") is False:
            self.response(Response(msg=LicenseOverdue.msg, success=False))
        self.response(Response(result=result))

    @get(_path="/license/details")
    def license_get(self):
        result = license.license_get()
        self.response(Response(result=result))

    @get(_path="/license/hostid")
    def hostid_get(self):
        result = license.hostid_get()
        self.response(Response(result=result))

    @get(_path="/license/private/key")
    def private_key_get(self):
        result = license.pri_key_get()
        self.response(Response(result=result))

    @post(_path="/license/private/key")
    def private_key_update(self, body):
        private_key = body.get("private_key")
        result = license.pri_key_update(private_key)
        optLog.write(self.request, Type.LICENSE, license.pri_key_get(),
                     Operator.UPDATE, private_key)
        self.response(Response())

    @get(_path="/license")
    def license_check(self):
        result = license.check_license()
        if result.get("date_interval") is False:
            self.response(Response(msg=LicenseOverdue.msg, success=False))
        self.response(Response(result=result))

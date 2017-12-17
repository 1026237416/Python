__author__ = 'musir'

import tornado.ioloop
import unittest
import mimetypes
import urllib
import simplejson as json
import tornado.httpclient
import tornado.ioloop

class FontStyle:
    STYLE = {
        'fore': {
            'black': 30, 'red': 31, 'green': 32, 'yellow': 33,
            'blue': 34, 'purple': 35, 'cyan': 36, 'white': 37,
        },
        'back': {
            'black': 40, 'red': 41, 'green': 42, 'yellow': 43,
            'blue': 44, 'purple': 45, 'cyan': 46, 'white': 47,
        },
        'mode': {
            'bold': 1, 'underline': 4, 'blink': 5, 'invert': 7,
        },
        'default': {
            'end': 0,
        }
    }

    def __init__(self):
        pass

    @staticmethod
    def font_style(str_m, mode='', fore='', back=''):
        mode = '%s' % FontStyle.STYLE['mode'][mode] if FontStyle.STYLE['mode'].has_key(mode) else ''
        fore = '%s' % FontStyle.STYLE['fore'][fore] if FontStyle.STYLE['fore'].has_key(fore) else ''
        back = '%s' % FontStyle.STYLE['back'][back] if FontStyle.STYLE['back'].has_key(back) else ''
        style = ';'.join([s for s in [mode, fore, back] if s])
        style = '\033[%sm' % style if style else ''
        end = '\033[%sm' % FontStyle.STYLE['default']['end'] if style else ''
        return '%s%s%s' % (style, str_m, end)


def encode_multipart_formdata(fields, files):
    """
    fields is a sequence of (name, value) elements for regular form fields.
    files is a sequence of (name, filename, value) elements for data to be uploaded as files
    Return (content_type, body) ready for httplib.HTTP instance
    """
    BOUNDARY = '----------ThIs_Is_tHe_bouNdaRY_$'
    CRLF = '\r\n'
    L = []
    for (key, value) in fields:
        L.append('--' + BOUNDARY)
        L.append('Content-Disposition: form-data; name="%s"' % key)
        L.append('')
        L.append(value)
    for (key, filename, value) in files:
        L.append('--' + BOUNDARY)
        L.append('Content-Disposition: form-data; name="%s"; filename="%s"' % (key, filename))
        L.append('Content-Type: %s' % get_content_type(filename))
        L.append('')
        L.append(value)
    L.append('--' + BOUNDARY + '--')
    L.append('')
    body = CRLF.join(L)
    content_type = 'multipart/form-data; boundary=%s' % BOUNDARY
    return content_type, body

def get_content_type(filename):
    return mimetypes.guess_type(filename)[0] or 'application/octet-stream'


class Response:
    def __init__(self, status_code, content, error,  request_time):
        self.status_code = status_code
        self.content = content
        self.error = error
        self.request_time = request_time


class Client:
    def __init__(self, base_url):
        self.response = ""
        self.base_url = base_url

    def handle_request(self, response):
        self.response = response
        tornado.ioloop.IOLoop.instance().stop()

    def request(self, url, method, header={}, data={}, is_from=False):
        r_url = "%s%s" % (self.base_url, url)
        if is_from:
            fields = []
            files = []
            for key, value in data.items():
                if isinstance(value, file):
                    files.append([key, value.name, value.read()])
                else:
                    fields.append([key, value])
            content_type, body = encode_multipart_formdata(fields, files)
            headers = {'Content-Type' : content_type}
            headers.update(header)
        else:
            headers = {"Content-type": "Content-Type:text/plain;charset=UTF-8;","Accept": "*/*"}
            headers.update(header)
            body = json.dumps(data)
            if method.lower() == 'get' or method.lower() == 'delete':
                if data:
                    p = urllib.urlencode(data)
                    r_url = "%s?%s"%(r_url,p)
                    body = None
                else:
                    body = None
        request = tornado.httpclient.HTTPRequest(url=r_url,
                         method=method,
                         headers=headers,
                         body=body,
                         request_timeout=600,
                         validate_cert=False)
        client = tornado.httpclient.AsyncHTTPClient()
        client.fetch(request , self.handle_request)
        tornado.ioloop.IOLoop.instance().start()

        print "-URL:%s"%r_url
        print "-Send Data:%s"%data
        if self.response.code == 200:
            body = json.loads(self.response.body)
            if body["code"] == 200 and body["success"]:
                print "Result:SUCCESS"
                print body["result"]
                print "Request Time:%s" % self.response.request_time
                print "%s" % "-" * 70
                return "ok", body["result"]
            else:
                print "%s:%s" % (FontStyle.font_style("ERROR", mode='bold', fore='red', back='green'), body["msg"])
        else:
            print "%s:%s"%(FontStyle.font_style("ERROR", mode='bold', fore='red', back='green'), self.response.error)
        print "%s" % "-" * 70
        return "error", None

    
class TestCase(unittest.TestCase):

    def _pre_setup(self, base_url):
        self.base_url = base_url

    def _post_teardown(self):
        pass
    
    def __call__(self, result=None):
        """
        Wrapper around default __call__ method to perform My test
        set up. This means that user-defined Test Cases aren't required to
        include a call to super().setUp().
        """
        self.client = Client(self.base_url)
        try:
            self._pre_setup(self.base_url)
        except (KeyboardInterrupt, SystemExit):
            raise
        except Exception:
            import sys
            result.addError(self, sys.exc_info())
            return
        super(TestCase, self).__call__(result)
        try:
            self._post_teardown()
        except (KeyboardInterrupt, SystemExit):
            raise
        except Exception:
            import sys
            result.addError(self, sys.exc_info())
            return
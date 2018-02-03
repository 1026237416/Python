from django.shortcuts import render
from django.template.loader import get_template
from django.http import HttpResponse
import datetime

# Create your views here.

def index(request, tvno="0"):
    tv_list = [
        {
            "name": "CCTV 1",
            "tvcode": "cctv1"
        },
        {
            "name": "CCTV 6",
            "tvcode": "cctv6"
        },
    ]
    template = get_template("tv_index.html")
    now = datetime.datetime.now()
    tvno = tvno

    tv = tv_list[int(tvno)]
    html = template.render(locals())

    return HttpResponse(html)

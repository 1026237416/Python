#!/usr/bin/env python
# -*- coding: utf-8 -*-
from django.http import HttpResponse
from django.http import Http404
from django.template.loader import get_template
from django.shortcuts import redirect

from datetime import datetime

from .models import Post

import random


# Create your views here.

def homepage(request):
    template = get_template("index.html")
    posts = Post.objects.all()
    now = datetime.now()
    html = template.render(locals())
    return HttpResponse(html)


def show_post(request, slug):
    template = get_template(template_name="post.html")
    try:
        post = Post.objects.get(slug=slug)
        if post is not None:
            html = template.render(locals())
            return HttpResponse(html)
    except:
        return redirect("/")


def about(request):
    template = get_template("about.html")
    quotes = [
        "今日事，今日毕",
        '知识就是力量',
        '一个人的性格决定她的命运'
    ]
    html = template.render({'quote': random.choice(quotes)})
    return HttpResponse(html)


def about2(request, author_no):
    html = """
    <h2>
        Here is Author: {}'s about page!
    </h2>
    <br>
    """.format(author_no)
    return HttpResponse(html)


def about3(request, author_no):
    html = """
    <h2>
        Here is Author: {}'s about page!
    </h2>
    <br>
    """.format(author_no)
    return HttpResponse(html)


def listing(request, list_date):
    html = """
    <h2>
        List Date is {}
    </h2>
    <hr>
    """.format(list_date)
    return HttpResponse(html)


def post(request, post_date):
    html = """
    <h2>
        Post Date is {}
    </h2>
    <hr>
    """.format(post_date)
    return HttpResponse(html)


def car_list(request, maker=0):
    car_maker = ["SAAB", "Ford", "Honda", "Mazda", "Nissan", "Toyota"]
    car_lists = [
        [],
        ["Fiesta", "Focus", "Modeo", "EcoSport", "Kuga", "Mustang"],
        ["Fit", "Odyssey", "CR-V", "City", "NSX"],
        ["Mazda3", "Mazda5", "Mazda6", "CX-3", "CX-5", "MX-5"],
        ["Tida", "March", "Livina", "Sentra", "Teana", "X-Trail", "Juke",
         "Murano"],
        ["Camry", "Altis", "Yaris", "86", "Prius", "Vios", "RAV4", "Wish"],
    ]

    maker = int(maker)
    maker_name = car_maker[maker]
    cars = car_lists[maker]
    template = get_template("car_list.html")
    html = template.render(locals())

    return HttpResponse(html)

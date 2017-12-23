from django.http import HttpResponse
from django.template.loader import get_template
from django.shortcuts import redirect

from datetime import datetime

from .models import Post


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

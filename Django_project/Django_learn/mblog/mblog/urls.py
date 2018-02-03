"""mblog URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/1.10/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  url(r'^$', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  url(r'^$', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.conf.urls import url, include
    2. Add a URL to urlpatterns:  url(r'^blog/', include('blog.urls'))
"""
from django.conf.urls import url, include
from django.contrib import admin
from mainsite import views
from tv_site.views import tv_center

info_patterns = [
    url(r"^company/$", views.about),
    url(r"^sales/$", views.about),
    url(r"^contact/$", views.about),
]

urlpatterns = [
    url(r'^admin/', admin.site.urls),
    url(r'^$', views.homepage),
    url(r'^post/(\w+)$', views.show_post),
    url(r'^about/$', views.about),
    url(r'^about2/([0|1|2|3])/$', views.about2),
    url(r"^about3/(?P<author_no>[0/1/2/3])/$", views.about3),
    url(r"^list/(?P<list_date>\d{4}/\d{1,2}/\d{1,2})$", views.listing),
    url(r"^post/(?P<post_date>\d{4}/\d{1,2}/\d{1,2}/\d{1,3})$", views.post),
    url(r"^carlist/$", views.car_list),
    url(r"^carlist/(\d{1})/$", views.car_list, name="carlist-url"),

    url(r"^info/", include(info_patterns)),
    url(r"^(?P<prod_id>[a-zA-Z0-9]{4})/",
        include(
            [
                url(r"^(?P<mode>full)/$", views.homepage),
                url(r"^(?P<mode>medium/$)", views.homepage),
                url(r"^(?P<mode>abstract/$)", views.homepage),
                url(r"^(?P<mode>edit)/$", views.homepage),
            ]
        )),
    url(r"^tv/",
        include(
            [
                url(r"^\d{1}/$", tv_center, name="tv-url")
            ]
        )),

]

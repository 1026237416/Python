#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    @version: 1.0
    @author: li
    @license: Apache Licence 
    @contact: liping19901114@163.com
    @site: 
    @software: PyCharm
    @file: orm_ex5_api.py
    @time: 2018/6/4 13:47
    @desc:
"""
from orm import orm_ex5_multi_foreignKey
from sqlalchemy.orm import sessionmaker

Session_class = sessionmaker(bind=orm_ex5_multi_foreignKey.engine)
session = Session_class()


def add_new_address(addr_infos):
    objs = []
    for addr_info in addr_infos:
        obj = orm_ex5_multi_foreignKey.Address(
            street=addr_info["street"],
            city=addr_info["city"],
            state=addr_info["state"]
        )
        objs.append(obj)
    session.add_all(objs)
    session.commit()


def add_customer_info(user_infos):
    objs = []
    for user_info in user_infos:
        obj = orm_ex5_multi_foreignKey.Customer(
            name=user_info["name"],
            billing_address=user_info["billing_address"],
            shipping_address=user_info["shipping_address"]
        )
        objs.append(obj)
    session.add_all(objs)
    session.commit()


if __name__ == '__main__':
    address_infos = [
        {"street": "TuanJie Road", "city": "xi'an", "state": "Shanxi"},
        {"street": "ZhangBa 6st Road", "city": "xi'an", "state": "Shanxi"},
        {"street": "ZhangBa 8st Road", "city": "xi'an", "state": "Shanxi"},
        {"street": "KeJi 1st Road", "city": "xi'an", "state": "Shanxi"},
        {"street": "DianZi Road", "city": "xi'an", "state": "Shanxi"},
        {"street": "Bie Street", "city": "xi'an", "state": "Shanxi"},
    ]
    user_information = [
        {"name": "Alex", "billing_address": "", "shipping_address": "" }
    ]

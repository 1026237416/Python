#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    @version: 1.0
    @author: li
    @license: Apache Licence 
    @contact: liping19901114@163.com
    @site: 
    @software: PyCharm
    @file: orm_ex3_add.py
    @time: 2018/6/3 10:07
    @desc:
"""
from sqlalchemy import create_engine
from sqlalchemy import Column, String, Integer
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

connection = "mysql+pymysql://root:password@192.168.206.200/orm?charset=utf8"
engine = create_engine(connection, encoding="utf-8", echo=False)
Base = declarative_base()
Session_class = sessionmaker(bind=engine)
Session = Session_class()


class User(Base):
    __tablename__ = "user"
    id = Column(Integer, primary_key=True)
    name = Column(String(32))
    password = Column(String(64))

    def __repr__(self):
        return "<%s %s>" % (self.id, self.name)


def create_tables():
    Base.metadata.create_all(engine)


def insert_data():
    user_obj = User(name="alex", password="alex3714")
    print(user_obj.id, user_obj.name, user_obj.password)

    Session.add(user_obj)
    Session.commit()


def get_data():
    data = Session.query(User).filter(User.id > 2).all()
    print(data)


def edit_data():
    data = Session.query(User).filter(User.id > 2).all()
    data.name = "Jack"
    data.password = "password"
    data.commit()


if __name__ == '__main__':
    edit_data()

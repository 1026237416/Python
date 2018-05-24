#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    @version: 1.0
    @author: li
    @license: Apache Licence 
    @contact: liping19901114@163.com
    @site: 
    @software: PyCharm
    @file: start1.py
    @time: 2018/5/6 13:57
"""

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import Column, Integer, String, DateTime, Boolean
from sqlalchemy.orm import sessionmaker

connect = "mysql+pymysql://root:password@192.168.206.200/news?charset=utf8"
engine = create_engine(connect)
Base = declarative_base()
Session = sessionmaker(bind=engine)


class News(Base):
    __tablename__ = "news"

    id = Column(Integer, primary_key=True)
    title = Column(String(200), nullable=False)
    content = Column(String(2000), nullable=False)
    types = Column(String(10), nullable=False)
    image = Column(String(300), )
    author = Column(String(20), )
    view_count = Column(Integer)
    created_at = Column(DateTime)
    is_valid = Column(Boolean)


class OrmTest(object):

    def __init__(self):
        self.session = Session()

    def add_one(self):
        """
        添加一条记录
        Returns:

        """
        new_obj = News(
            # title="title",
            # content="content",
            # types="1"
            title="标题",
            content="内容",
            types="分类"
        )
        self.session.add(new_obj)
        self.session.commit()

        return new_obj

    def get_one(self, key):
        """
        获取一条记录
        Args:
            key: 记录的Key

        Returns:

        """
        return self.session.query(News).get(key)



def main():
    obj = OrmTest()
    # res = obj.add_one()
    # print(res)
    rest = obj.get_one(2)
    if rest:
        print("ID:{id}==>{title}".format(id=rest.id, title=rest.title))
    else:
        print("Not exist!")


if __name__ == '__main__':
    main()

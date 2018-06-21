#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    @version: 1.0
    @author: li
    @license: Apache Licence 
    @contact: liping19901114@163.com
    @site: 
    @software: PyCharm
    @file: orm_ex5_multi_foreignKey.py
    @time: 2018/6/4 13:21
    @desc:
"""
from sqlalchemy import create_engine
from sqlalchemy import Column, String, Integer, Date
from sqlalchemy import ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship

connection = "mysql+pymysql://root:password@192.168.206.200/orm?charset=utf8"
engine = create_engine(connection, encoding="utf-8", echo=False)
Base = declarative_base()
Session_class = sessionmaker(bind=engine)
Session = Session_class()


class Customer(Base):
    __tablename__ = "customer"
    id = Column(Integer, primary_key=True)
    name = Column(String(64))

    billing_address_id = Column(Integer, ForeignKey("address.id"))
    shipping_address_id = Column(Integer, ForeignKey("address.id"))

    billing_address = relationship("Address", foreign_keys=[billing_address_id])
    shipping_address = relationship("Address",
                                    foreign_keys=[shipping_address_id])


class Address(Base):
    __tablename__ = "address"

    id = Column(Integer, primary_key=True)
    street = Column(String(64))
    city = Column(String(64))
    state = Column(String(64))


def create_tables():
    Base.metadata.create_all(engine)


if __name__ == '__main__':
    create_tables()

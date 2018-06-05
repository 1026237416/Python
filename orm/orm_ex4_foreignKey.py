#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    @version: 1.0
    @author: li
    @license: Apache Licence 
    @contact: liping19901114@163.com
    @site: 
    @software: PyCharm
    @file: orm_ex4_foreignKey.py
    @time: 2018/6/3 19:26
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


class Student(Base):
    __tablename__ = "student"
    id = Column(Integer, primary_key=True)
    name = Column(String(64), nullable=False)
    register_date = Column(Date, nullable=False)

    def __repr__(self):
        return "<%s name:%s>" % (self.id, self.name)


class StudyRecord(Base):
    __tablename__ = "study_record"
    id = Column(Integer, primary_key=True)
    day = Column(Integer)
    status = Column(String(32), nullable=False)
    stu_id = Column(Integer, ForeignKey("student.id"))

    student = relationship("Student", backref="my_study_record")

    def __repr__(self):
        return "<%s day:%s status:%s >" % (
            self.student.name, self.day, self.status)


def create_tables():
    Base.metadata.create_all(engine)


def insert_student_data(informations):
    obj = []
    for stu_info in informations:
        s = Student(
            name=stu_info["name"],
            register_date=stu_info["register_date"]
        )
        obj.append(s)
    Session.add_all(obj)
    Session.commit()


def insert_study_info(infos):
    obj = []
    for info in infos:
        s = StudyRecord(
            day=info["day"],
            status=info["status"],
            stu_id=info["stu_id"]
        )
        obj.append(s)
    Session.add_all(obj)
    Session.commit()


def get_infos():
    info = Session.query(Student).filter(Student.name == "Alex").first()
    print(info.my_study_record)


if __name__ == '__main__':
    # create_tables()
    stu_infos = [
        {"name": "Alex", "register_date": "2015-05-06"},
        {"name": "John", "register_date": "2015-07-03"},
        {"name": "Toms", "register_date": "2016-05-06"},
        {"name": "Anna", "register_date": "2018-01-06"},
        {"name": "Rain", "register_date": "2015-04-22"},
        {"name": "Eric", "register_date": "2015-09-06"},
    ]

    study_infos = [
        {"day": 1, "status": "YES", "stu_id": 1},
        {"day": 2, "status": "YES", "stu_id": 1},
        {"day": 3, "status": "NO", "stu_id": 1},
        {"day": 1, "status": "YES", "stu_id": 2},
        {"day": 1, "status": "YES", "stu_id": 2},
        {"day": 1, "status": "YES", "stu_id": 2},
        {"day": 4, "status": "NO", "stu_id": 1},
        {"day": 5, "status": "NO", "stu_id": 1},
    ]
    # insert_student_data(stu_infos)
    # insert_study_info(study_infos)
    get_infos()

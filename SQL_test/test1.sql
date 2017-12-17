SHOW DATABASES;

-- 创建数据库
CREATE DATABASE IF NOT EXISTS learn DEFAULT CHARACTER SET=utf8;

-- 查看支持的引擎
SHOW ENGINES;

-- 查看数据库版本
SELECT VERSION();

-- 查看当前时间
SELECT NOW();

-- 查看支持的存储引擎的信息；
SHOW VARIABLES LIKE 'have%';

-- 查看默认的存储引擎信息
SHOW VARIABLES LIKE 'storage_engine';

-- 使用数据库
USE learn;

-- 创建表
CREATE TABLE IF NOT EXISTS `user` (
  id SMALLINT,
  username VARCHAR(20),
  sex ENUM('男', '女', '保密'),
  emial VARCHAR(50),
  addr VARCHAR(200),
  brith YEAR,
  salary FLOAT(8, 2),
  tel INT,
  married TINYINT(1) COMMENT '0代表未婚， 非0代表已婚'
) ENGINE=INNODB CHARSET=UTF8;

-- 查看已存在的数据表
SHOW TABLES;

-- 创建课程数据表
-- 课程ID courseID
-- 课程名称 courseName
-- 课程描述 courseDesc
CREATE TABLE IF NOT EXISTS `course` (
  courseID TINYINT,
  courseName VARCHAR(50),
  courseDesc VARCHAR(200)
);

-- 新闻分类表
CREATE TABLE IF NOT EXISTS `cms_cate`(
  id TINYINT,
  cateName VARCHAR(50),
  cmsDesc VARCHAR(200)
)ENGINE=INNODB DEFAULT CHARSET=UTF8;

-- 创建新闻表
CREATE TABLE IF NOT EXISTS cms_news(
  id INT,
  title VARCHAR(50),
  content TEXT,
  pubTime INT,
  clickNum INT,
  isTop TINYINT(1) COMMENT '0代表不置顶，1代表置顶'
);
-- 查看表结构
DESC cms_news;
DESCRIBE cms_news;
SHOW COLUMNS FROM cms_news;

CREATE DATABASE IF NOT EXISTS project;
use project;
CREATE TABLE IF NOT EXISTS user(
  id SMALLINT UNSIGNED KEY AUTO_INCREMENT,
  username CHAR(20) NOT NULL UNIQUE,
  password CHAR(32) NOT NULL,
  email VARCHAR(50) NOT NULL DEFAULT '123456789@email.com',
  age TINYINT UNSIGNED DEFAULT 18,
  sex ENUM('男','女','保密') DEFAULT '保密',
  addr VARCHAR(200) NOT NULL DEFAULT '北京',
  salary FLOAT(6,2),
  regTime INT UNSIGNED,
  face CHAR(100) NOT NULL DEFAULT 'default.png'
)ENGINE=INNODB DEFAULT CHARACTER SET=UTF8;

-- 重命名表
ALTER TABLE user RENAME TO user_info;
ALTER TABLE user_info RENAME AS user;
ALTER TABLE user RENAME user_info;

RENAME TABLE user_info TO user;

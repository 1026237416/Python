CREATE TABLE manor_app_instance (
  id              BIGINT(20) PRIMARY KEY NOT NULL AUTO_INCREMENT,
  app_name        VARCHAR(100)           NOT NULL,
  app_description VARCHAR(500),
  template_name   VARCHAR(100)           NOT NULL,
  app_serial      VARCHAR(100)           NOT NULL,
  state           VARCHAR(50)            NOT NULL,
  app_id          VARCHAR(50)            NOT NULL
);

CREATE TABLE manor_stacks (
  id         BIGINT(20) PRIMARY KEY NOT NULL AUTO_INCREMENT,
  stack_id   VARCHAR(100),
  app_serial VARCHAR(100),
  group_name VARCHAR(100)
);

CREATE TABLE manor_app_group_seq
(
    id BIGINT(20) PRIMARY KEY NOT NULL AUTO_INCREMENT,
    app_serial VARCHAR(255),
    group_name VARCHAR(255),
    seq BIGINT(20),
    ip VARCHAR(50)
);


CREATE DATABASE manor;

CREATE USER 'manor'@'%'
  IDENTIFIED BY 'manor';

GRANT ALL PRIVILEGES ON manor.* TO 'manor'@'%'
IDENTIFIED BY 'manor';


SET NAMES utf8;
SET CHARACTER SET utf8;
SET character_set_connection = utf8;

ALTER TABLE manor_app_instance
  MODIFY app_name VARCHAR(255)
CHARACTER SET utf8;
ALTER TABLE manor_app_instance
  MODIFY app_description VARCHAR(255)
CHARACTER SET utf8;



CREATE DATABASE /*!32312 IF NOT EXISTS*/ `ecloud_common` /*!40100 DEFAULT CHARACTER SET utf8 */;
USE `ecloud_common`;

-- ----------------------------
-- Table structure for property
-- ----------------------------
DROP TABLE IF EXISTS `property`;
CREATE TABLE `property` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `res_id` char(36) DEFAULT NULL,
  `name` varchar(128) DEFAULT NULL,
  `value` text,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1060 DEFAULT CHARSET=utf8;

-- ----------------------------
-- Table structure for regions
-- ----------------------------
DROP TABLE IF EXISTS `regions`;
CREATE TABLE `regions` (
  `id` int(50) NOT NULL AUTO_INCREMENT,
  `region` varchar(255) NOT NULL,
  `displayname` varchar(255) DEFAULT NULL,
  `security` tinyint(1) DEFAULT '0' COMMENT '0,1,2,3 > 无,密级,机密,绝密',
  `url` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8;

-- ----------------------------
-- Table structure for resource
-- ----------------------------
DROP TABLE IF EXISTS `resource`;
CREATE TABLE `resource` (
  `id` char(36) DEFAULT NULL,
  `wo_id` char(12) DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `displayname` varchar(255) DEFAULT NULL,
  `type` tinyint(4) DEFAULT NULL,
  `status` tinyint(4) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ----------------------------
-- Table structure for sequence
-- ----------------------------
DROP TABLE IF EXISTS `sequence`;
CREATE TABLE `sequence` (
  `name` varchar(20) NOT NULL,
  `type` tinyint(4) DEFAULT '0',
  `sn` bigint(20) unsigned DEFAULT '0',
  `max_sn` bigint(20) unsigned DEFAULT '18446744073709551615',
  `step` tinyint(4) DEFAULT '1',
  `dt_updated` datetime DEFAULT NULL,
  PRIMARY KEY (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ----------------------------
-- Table structure for token
-- ----------------------------
DROP TABLE IF EXISTS `token`;
CREATE TABLE `token` (
  `token` char(32) NOT NULL DEFAULT '' COMMENT '用户token',
  `user_id` char(32) NOT NULL COMMENT '用户ID',
  PRIMARY KEY (`token`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ----------------------------
-- Table structure for work_order
-- ----------------------------
DROP TABLE IF EXISTS `work_order`;
CREATE TABLE `work_order` (
  `id` char(12) DEFAULT NULL,
  `type` tinyint(4) DEFAULT NULL,
  `num` tinyint(4) DEFAULT NULL,
  `creator` text,
  `user` text,
  `region` varchar(255) DEFAULT NULL,
  `tenant` varchar(255) DEFAULT NULL,
  `des` text,
  `commit_time` datetime DEFAULT NULL,
  `complete_time` datetime DEFAULT NULL,
  `status` tinyint(4) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

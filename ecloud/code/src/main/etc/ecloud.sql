CREATE DATABASE /*!32312 IF NOT EXISTS*/ `ecloud` /*!40100 DEFAULT CHARACTER SET utf8 */;
USE `ecloud`;

SET FOREIGN_KEY_CHECKS=0;

-- ----------------------------
-- Table structure for host_ipmi
-- ----------------------------
DROP TABLE IF EXISTS `host_ipmi`;
CREATE TABLE `host_ipmi` (
  `host_id` varchar(50) NOT NULL COMMENT '宿主机ID',
  `ipmi_user` varchar(50) DEFAULT '' COMMENT 'ipmi的用户',
  `ipmi_pass` varchar(64) DEFAULT '' COMMENT 'impi用户的密码',
  `ipmi_ip` varchar(16) DEFAULT NULL COMMENT 'ipmi的ip',
  `des` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`host_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


-- ----------------------------
-- Table structure for tenant_quotas
-- ----------------------------
DROP TABLE IF EXISTS `tenant_quotas`;
CREATE TABLE `tenant_quotas` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `tenant_id` char(32) NOT NULL COMMENT '租户ID',
  `quota_name` varchar(64) NOT NULL COMMENT '配额名称',
  `quota_limit` int NOT NULL DEFAULT '-1' COMMENT '配额上限',
  `quota_used` int NOT NULL DEFAULT '0' COMMENT '已使用的配额',
  `dt_created` datetime DEFAULT NULL,
  `dt_updated` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY(`tenant_id`, `quota_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='租户配额管理表';


-- ----------------------------
-- Table structure for vlan_hosts
-- ----------------------------
DROP TABLE IF EXISTS `vlan_hosts`;
CREATE TABLE `vlan_hosts` (
  `id` varchar(50) NOT NULL COMMENT 'uuid',
  `vlan_id` varchar(50) NOT NULL,
  `vlan_name` varchar(255) DEFAULT NULL COMMENT 'vlan名称',
  `host_id` varchar(50) NOT NULL COMMENT '主机ID',
  `des` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


-- ----------------------------
-- Table structure for alarm
-- ----------------------------
DROP TABLE IF EXISTS `alarm`;
CREATE TABLE `alarm` (
  `id` int NOT NULL AUTO_INCREMENT,
  `target` varchar(255) NOT NULL,
  `type` varchar(12) DEFAULT NULL,
  `times` int DEFAULT NULL,
  `message` text DEFAULT NULL,
  `level` varchar(12) DEFAULT NULL,
  `create_at` datetime DEFAULT NULL,
  `update_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


-- ----------------------------
-- Table structure for taskflow
-- ----------------------------
DROP TABLE IF EXISTS `taskflow`;
CREATE TABLE `taskflow` (
  `id` int(50) NOT NULL AUTO_INCREMENT,
  `task_id` varchar(50) DEFAULT NULL,
  `resource` varchar(50) DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `status` tinyint(1) NOT NULL DEFAULT '0',
  `param` text,
  `updated_at` datetime DEFAULT NULL,
  `message` text,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=28 DEFAULT CHARSET=utf8;


-- ----------------------------
-- Table structure for tenant_hosts
-- ----------------------------
DROP TABLE IF EXISTS `tenant_hosts`;
CREATE TABLE `tenant_hosts` (
  `id` varchar(50) NOT NULL ,
  `tenant_id` varchar(50) DEFAULT NULL,
  `hosts` varchar(2000) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


-- ----------------------------
-- Table structure for vlan_subnet_tenant
-- ----------------------------

DROP TABLE IF EXISTS `vlan_subnet_tenant`;
CREATE TABLE `vlan_subnet_tenant` (
  `id` varchar(50) NOT NULL ,
  `vlan_id` varchar(50) DEFAULT NULL,
  `subnet_id` varchar(50) DEFAULT NULL,
  `tenant_id` varchar(50) DEFAULT NULL,
  `ippools` text  DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
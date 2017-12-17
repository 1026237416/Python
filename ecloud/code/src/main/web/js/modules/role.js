/**
 * Created by wangahui1 on 15/11/9.
 */
define("role", ["locale"], function () {
    return {
        /**获取三员角色列表*/
        getRoleList: function ()//获取角色列表
        {
            var _lists = [];
            /*var _result = [this.sys, this.sec, this.audit, this.user];*/
            var _result = [this.sys, this.user];
            $(_result).each(function (i, il) {
                var item = {};
                item.value = il.type;
                item.label = il.label;
                _lists.push(item);
            });
            return ef.util.copyDeepProperty(_result);
        },

        /**获取所有角色列表，包括超级用户*/
        getFullRoleList: function ()//获取所有角色列表
        {
            var _lists = [];
            var _result = [this.sys, this.sec, this.audit, this.user,this.ecloud,this.tenant];
            $(_result).each(function (i, il) {
                var item = {};
                item.value = il.type;
                item.label = il.label;
                _lists.push(item);
            });
            return ef.util.copyDeepProperty(_result);
        },

        /**获取单个角色对象*/
        getRole:function(key)
        {
            if(!key||!this.hasOwnProperty(key))
            {
                return this.user;
            }
            return this[key];
        },
        /**根据角色类型获取角色*/
        getRoleByType:function(type)
        {
            if(!type)return;
            return ef.util.find(this.getFullRoleList(),function(item)
            {

                return item.type==type;
            });

        },
        user://普通用户
        {
            value: 6,
            type: "user",
            label: $.i18n.prop("role.user"),
            default: "setting.user"
        },
        sys://系统管理员
        {
            value: 8,
            type: "sys_admin",
            label: $.i18n.prop("role.sys"),
            default: "dashboard"
        },
        sec://安全管理员
        {
            value: 9,
            type: "sec_admin",
            label: $.i18n.prop("role.sec"),
            default: "setting.user"
        },
        audit://安全审计员
        {
            value: 10,
            type: "audit_admin",
            label: $.i18n.prop("role.audit"),
            default: "log"
        },
        ecloud://超级用户
        {
            value: 88,
            type: "admin",
            label: $.i18n.prop("role.ecloud"),
            default: "dashboard"
        },
        tenant:{
            value: 7,
            type: "tenant_admin",
            label: $.i18n.prop("role.tenant"),
            default: "cal.host"
        }
    }
});
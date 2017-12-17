/**
 * Created by wangahui1 on 15/11/12.
 */
define("user", ["role"], function (role) {
    return {
        getUsername://获取用户名
            function () {
                var _obj = ef.sessionStorage.get("user");
                return _obj ? _obj.user.username : "";
            },
        getDisplayname://获取用户显示名（昵称）
            function()
        {
            var _obj = ef.sessionStorage.get("user");
            return _obj ? (_obj.user.displayname ||_obj.user.username||_obj.user.name||"" ):"";
        },
        getToken:function()
        {
            var _obj = ef.sessionStorage.get("user");
            return _obj?_obj.token:"";
        },
        getId:function()
        {
            var _obj = ef.sessionStorage.get("user");
            return _obj?_obj.user.id:"";
        },
        getInfo:
            function()//获取当前用户详细信息
            {
                var _obj = ef.sessionStorage.get("user");
                return _obj;
            },
        getName://获取名称
            function () {
                var _obj = ef.sessionStorage.get("role");
                return _obj ? _obj.user.name : "";
            },
        getRole://获取角色对象,@see role
            function () {
                var user=ef.sessionStorage.get("user");
                user=user||{user:{role:{name:"user"}}};
                var _obj = user.user.role;
                var roll=false;
                if(_obj)
                {
                    roll=this._getRole(_obj.value, _obj.name);
                    roll.id=_obj.id;
                }
                return roll;
            },
        hasLimit://获取权限
            function () {
                return this.getInfo();
            },
        isSys://是否是系统管理员
            function () {
                var _role = this.getRole();
                return _role && (_role.value == role.sys.value || _role.name == role.sys.type);
            },
        isSec://是否是安全管理员
            function () {
                var _role = this.getRole();
                return _role && (_role.value == role.sec.value || _role.name == role.sec.type);
            },
        isAudit://是否是安全审计员
            function () {
                var _role = this.getRole();
                return _role && (_role.value == role.audit.value || _role.name == role.audit.type);
            },
        isSuper://是否是超级用户ecloud
            function () {
                var _role = this.getRole();
                return _role && (_role.value == role.ecloud.value || _role.name == role.ecloud.type);
            },
        isUser:function()//是否是普通用户
        {
            var _role = this.getRole();
            return _role && (_role.value == role.user.value || _role.name == role.user.type);
        },
        isTenant://是否是租户
            function () {
                var _role = this.getRole();
                return _role && (_role.value == role.tenant.value || _role.name == role.tenant.type);
            },
        token: "",
        //*********以下私有变量禁止访问*******
        //*********以下私有变量禁止访问*******
        //*********以下私有变量禁止访问*******
        __setUser://私有变量,不建议访问
            function (param) {
                //param.username=param.user.username;
                //param.name=param.user.name;
                //param.id=param.user.id;
                //this._username = param.username;
                //this._name = param.name||this._username;
                //param.name=this._name;
                this._role = this._getRole(param.user.role.value, param.user.role.name);
                if(!this._role)
                {
                    return false;
                }
                param.comment = this._role.label;
                param.default = this._role.default;
                //for(var i in param.user)
                //{
                //    param[i]=param.user[i];
                //}
                ef.sessionStorage.put("user", param);
                return true;
            },
        __revokeUser://私有变量,不建议访问
            function () {
                this._username = "";
                this._name = "";
                this._role = null;
                ef.sessionStorage.clear();
            },
        __setUserInfo://设置用户详情
            function(data)
            {
                ef.sessionStorage.put("user",data);
            },
        _username: "",
        _name: "",
        _role: null,
        _getRole://获取角色对象
            function (value, type) {
                var list=role.getFullRoleList();
                for (var i in list) {
                    var _item = list[i];
                    if (value == _item.value || type == _item.type) {
                        return _item;
                    }
                }
            }
    }
});
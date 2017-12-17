/**
 * Created by wangahui1 on 16/4/20.
 */
define("framework.sessionStorage",["exports","framework.core"],function(exports,ef)
{
    /**
     * @singleton
     * #会话存储对象#
     *
     * # 描述 #
     * **与ef.localStorage区别是页面刷新后此数据仍存在,并可跨页传递**,单例模式
     *
     * **除非关闭浏览器才可清除**
     *
     * @class ef.sessionStorage
     * */
    function SessionStorage() {

    }
    SessionStorage.isInstance=true;
    /**
     * 设置会话存储
     * @param {String} key (required) 要存储的键名
     * @param {Object} value {required} 要存储的键值对象
     * */
    SessionStorage.prototype.put = function (key, obj) {
        this._init();
        var _global = this.get();
        if(!_global)return;
        _global[key] = obj;
        var str = JSON.stringify(_global);
        ef.root.name = str;
    };
    /**
     * 获取会话存储
     * @param {String} key (required) 要获取的键名
     * @return {Object} 根据键名获取键值
     * */
    SessionStorage.prototype.get = function (key) {
        var str = ef.root.name;
        if (!str) {
            return undefined;
        }
        try {
            str = JSON.parse(str)
        }
        catch (err) {
            return undefined;
        }
        if (arguments.length) {
            str = str[key];
        }
        return str;
    };
    /**
     * @private 初始化sessionStorage
     * */
    SessionStorage.prototype._init = function () {
        var _name = ef.root.name;
        if (!_name || _name == "undefined") {
            var _global = {};
            var _globalStr = JSON.stringify(_global);
            ef.root.name = _globalStr;
        }
    };
    /**清除所有sessionStorage存储*/
    SessionStorage.prototype.clear = function () {
        ef.root.name = "";
    };
    ef.register(SessionStorage,"sessionStorage");
    return SessionStorage;
});
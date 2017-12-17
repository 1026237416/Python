/**
 * Created by wangahui1 on 16/4/20.
 */
define("framework.localStorage",["exports","framework.core"],function(exports,ef)
{
    /**
     * @singleton
     * #本地数据存储#
     *
     * # 描述 #
     * **与ef.sessionStorage区别是页面刷新后此数据将不存在**,单例模式
     *
     * @class ef.localStorage
     * */
    function LocalStorage() {

    }
    LocalStorage.isInstance=true;
    /**
     * 本地存
     * @param {String} key (Required) 要存的键名,请按规范命名,同名key将覆盖之前已经存储的数据
     * @param {Object} value (Required) 要存的键值
     *
     * 与ef.sessionStorage区别页面刷新后此数据将不存在
     * */
    LocalStorage.prototype.put = function (key, value) {
        if (!key || arguments.length != 2) {
            return;
        }
        this[key] = value;
    };
    /**
     * 本地取
     * @param {String} key (Required) 要取的键名
     *
     * 与ef.sessionStorage区别页面刷新后此数据将不存在
     * */
    LocalStorage.prototype.get = function (key) {
        return this[key];
    };
    /**
     * 删除某个key及值
     * @param {String} key (Required) 要删除的键名
     * @return {Boolean} 是否删除成功
     * */
    LocalStorage.prototype.delete = function (key) {
        if (!this.hasKey(key)) {
            return false;
        }
        delete this[key];
        return true;
    };
    /**
     * 删除所有键值
     * */
    LocalStorage.prototype.clear = function () {
        for (var key in this) {
            delete  this[key];
        }
        return this;
    };
    /**
     * 是否存在某个键
     * @param {String} key (Required) 要判断的键名
     * @return {Boolean} 是否存在某个键
     * */
    LocalStorage.prototype.hasKey = function (key) {
        return this.hasOwnProperty(key);
    };
    ef.register(LocalStorage,"localStorage");
    return LocalStorage;
});
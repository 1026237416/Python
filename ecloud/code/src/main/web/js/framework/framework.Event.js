/**
 * Created by wangahui1 on 16/4/21.
 */
define("framework.event",["exports","framework.core"],function(exports,ef)
{
    /**
     * #event全局事件#
     * {@img event.png Event示例}
     * #描述#
     * 全局事件对象,可以绑定或触发自定义事件
     *
     * @class ef.event
     * */
    function Event() {
        this._dom = $(window);
    }
    Event.isInstance=true;
    /**
     * 触发自定事件
     * @param {String} eventName 自定义事件名称
     * @param {Object} data 自定义事件需要附带的数据
     *
     * */
    Event.prototype.trigger = function (eventName, data) {
        this._dom.trigger(eventName, data);
    };
    /**
     * 侦听自定义事件
     * @param {String} eventName 要侦听的自定义事件名称
     * @param {Function} callback 要侦听的自定义事件的回调函数
     * */
    Event.prototype.on = function (eventName, callback) {
        this._dom.on(eventName, callback);
    };
    /**取消侦听自定义事件*/
    Event.prototype.off = function (eventName) {
        if (!arguments.length) {
            this._dom.off();
            return;
        }
        this._dom.off(eventName);
    };
    ef.register(Event,"event");
    return Event;
});
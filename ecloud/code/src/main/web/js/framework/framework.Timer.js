/**
 * Created by wangahui1 on 16/4/20.
 */
define("framework.timer",["exports","framework.core"],function(exports,ef)
{
    /**统一定时器
     * @param {Number} delay  定时器延迟时间(毫秒)
     * @param {Function} [callback] 选填，定时器执行的回调函数，如果不填，可以之后使用addListener重新指派
     * @param {String} moduleId 选填，定时器依赖的模块id,如果有依赖，则在该模块被卸载时候主动销毁定时器
     * @param {Boolean} isDirectStart 选填，是否直接开始定时器，此属性用于设置一开始就执行一次回调，因为定时器一般执行回调是在延迟某时间之后，如果想
     * 一开始就执行一次，请将此属性设置为true
     * @param {String} id 选填，定时器的id名，可以使用此id获取或删除定时器
     * @class ef.Timer
     *
     * **使用范例**：
     *
     *     @example
     *     var timer=new ef.Timer(200,function(count){console.log(count)});
     *     timer.start();//开始
     *     timer.stop();//停止
     *     timer.reset();//停止并重置定时器
     *     console.log(timer.runing);//获取timer是否运行中
     *     console.log(timer.count);//获取timer的计数器
     * */
    function Timer(delay, callback, moduleId, isDirectStart, id) {
        /**延迟时间，毫秒*/
        this.delay = delay ? delay : 2000;
        this.callback = callback ? callback : $.noop;
        this.interval = 0;
        /**是否处于运行中*/
        this.running = false;
        /**计数器*/
        this.count = 0;//计数器
        this.moduleId = moduleId;
        this.id = id ? id : undefined;
        this.isDirectStart = Boolean(isDirectStart);
        Timer._instances.push(this);
    }
    Timer._intervals = [];
    Timer._instances = [];
    /**@static 获取所有的计时器实例数量*/
    Timer.getCount = function () {
        return this._instances.length;
    };
    /**@static 获取所有正在运行的计时器实例数量*/
    Timer.getRuningCout = function () {
        return _.filter(this._instances, function (el) {
            return el.running = true
        });
    };
    /**@static 停止所有timer*/
    Timer.stopAll = function () {
        _.each(this._instances, function (timer) {
            timer.stop();
        });
    };
    /**@static 根据id获取定时器*/
    Timer.get = function (id) {
        if (!id)return undefined;
        return _.find(this._instances, function (timer) {
            return timer.id == id;
        });
    };
    /**@static 根据id停止idle*/
    Timer.stop = function (id) {
        if (!id)return;
        var timer = this.get(id);
        if (timer)timer.stop();

    };
    /**
     * @static 移除所有出了当前module的定时器，前提是构建timer时候设置了依赖的moduleId
     * */
    Timer.destorySiblingsByModuleId = function (id) {
        _.each(this._instances, function (timer) {
            if (timer.moduleId && id != timer.moduleId) {
                timer.destory();
            }
        });
    };
    /**@static 销毁所有的有module的定时器*/
    Timer.destoryAllHasModule = function () {
        _.each(this._instances, function (timer) {
            if (timer.moduleId) {
                timer.destory();
            }
        });
    };
    Timer._revokeAllInter = function () {
        _.each(this._intervals, function (inter) {
            clearInterval(inter);
        });
    };
    /**@static 销毁所有定时器*/
    Timer.destoryAll = function () {
        this._revokeAllInter();
        this.stopAll();
        _.each(this._instances, function (timer) {
            timer.destory();
        });
    };
    /**@private 销毁一个timer*/
    Timer._revoke = function (timer) {
        this._instances = _.without(this._instances, timer);
        timer = null;
    };
    /**重新注册回调函数*/
    Timer.prototype.addListener = function (callback) {
        this.callback = callback || this.callback;
        if (this.interval) {
            this.stop();
            this.start();
        }
    };
    /**开始定时器
     *@param {Number} frequency 整型－要执行的次数，如果不填写，则只有调用stop或destory才会停止
     * */
    Timer.prototype.start = function (frequency) {
        this.running = true;
        var _self = this;
        var arg=arguments;
        var do_inter=function()
        {
            if(arg.length&&_self.count>=frequency)
            {
                clearInterval(_self.interval);
                return;
            }
            _self.count++;
            _self.callback(_self.count);
        };
        this.interval = setInterval(do_inter, this.delay);
        if (this.isDirectStart) {
            do_inter();
        }
        Timer._intervals.push(this.interval);
    };
    /**停止定时器*/
    Timer.prototype.stop = function () {
        clearInterval(this.interval);
        this.running = false;
    };
    /**停止并重置定时器*/
    Timer.prototype.reset = function () {
        this.count = 0;
        this.stop();
    };
    /**停止并销毁自己*/
    Timer.prototype.destory = function () {
        this.reset();
        Timer._revoke(this);
    };
    ef.register(Timer,"Timer");
    return Timer;
});
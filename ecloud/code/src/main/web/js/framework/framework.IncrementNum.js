/**
 * Created by wangahui1 on 16/4/20.
 */
define("framework.incrementNum",["exports","framework.core","framework.timer"],function(exports,ef,Timer)
{
    /**
     * #自动增加数字组件#
     *
     * {@img incrementNum.png 自动增加数字组件}
     *
     * # 描述 #
     *
     * 自动增加数字组件表示随机增加或减少的数字,不包含视图
     *
     * @param {Object} data 配置该组件的参数对象
     *
     *    **使用范例**：
     *
     *     @example
     *
     *     var m1=$(".su_left").incrementNum(
     *     {
         *      oldValue:0,//原值
         *      newValue:10,//新值
         *      speed:100//速度
         *      });
     *
     *
     * @class ef.components.incrementNum
     * */
    function IncrementNum(box, data) {
        this.box = box;
        /**@readonly原值*/
        this.oldValue = 0;
        /**@readonly新值*/
        this.newValue = 0;
        this.data = data;
        /**变化的速度*/
        this.speed = 10;
        /**延迟速度*/
        this.delay = 50;
        /**是否在变化中*/
        this.isPlaying = false;
        /**总共需要运行的时间单位ms*/
        this.total = null;
        this.totalTimer = null;
        this.timer = null;
        this.play();
        return this;
    }
    IncrementNum.isDom=true;
    /**@protected 初始化*/
    IncrementNum.prototype.init = function () {
        this.box.addClass("increment-num");
        if (!this.data) {
            return;
        }
        this.oldValue = this.data.oldValue ? this.data.oldValue : 0;
        this.newValue = this.data.newValue ? this.data.newValue : 0;
        this.speed = this.data.speed ? this.data.speed : this.speed;
        this.total = this.data.total ? this.data.total : null;

    };
    /**设置重新播放，可以传新的配置参数
     * @param {Object} param 配置该组件的参数对象*/
    IncrementNum.prototype.play = function (param, isAutoSpeed) {
        if (this.isPlaying) {
            return
        }
        this.isPlaying = true;
        if(this.timer)
            this.timer.destory();
        if(this.totalTimer){
            this.totalTimer.destory();
            this.totalTimer=null;
        }
        var _self = this;
        if (param) {
            _.copyProperty(this.data, param);
            if (param.oldValue == undefined) {
                this.oldValue = this.data.oldValue = Number(this.box.find(".num").text());
            }

        }
        this.init();
        if(this.total){
            _self.step=Math.ceil((_self.newValue - _self.oldValue) / _self.delay);
            if(_self.step != 0){
                this.totalTimer = new Timer(_self.total,function(){
                    _self.totalTimer.destory();
                    _self.totalTimer = null;
                });
                this.totalTimer.start();
            }
            this.timer = new Timer(_self.delay,function(){
                var _mass = Math.ceil((_self.newValue - _self.oldValue) / _self.delay);
                _self.oldValue +=  _self.step;
                if(_self.totalTimer == null || (_self.totalTimer != null && _mass == 0)){
                    _self.oldValue = _self.newValue;
                    _self.timer.destory();
                    _self.isPlaying = false;
                }
                _self.draw();
            }, null, true);
            this.timer.start();
        }else{
            this.timer = new Timer(this.delay, function(){
                var _mass = Math.ceil((_self.newValue - _self.oldValue) / _self.speed);
                var proton=Math.ceil((_self.newValue - _self.oldValue) / _self.speed);
                _self.oldValue += proton;
                if (_mass == 0) {
                    _self.oldValue = _self.newValue;
                    _self.timer.destory();
                    _self.isPlaying = false;
                }
                _self.draw();
            }, null, true);
            this.timer.start();
        }
    };
    /**@protected 重绘新值*/
    IncrementNum.prototype.draw = function () {
        if(!this.box.find(".num").length)
        {
            this.box.append('<span class="num" style="vertical-align: middle;display: inline-block"></span>');
        }
        this.box.find(".num").text(this.oldValue);
    };
    ef.register(IncrementNum,"incrementNum");
    return IncrementNum;
});
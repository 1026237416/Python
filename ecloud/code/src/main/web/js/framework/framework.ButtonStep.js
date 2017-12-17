/**
 * Created by wangahui1 on 16/4/20.
 */
define("framework.buttonstep",["exports","framework.core"],function(exports,ef)
{
    /**
     * #ButtonStep组件#
     * {@img buttonstep.png 上下步组件}
     * # 描述#
     * 上下步组件[class ButtonStep]是一类按钮组,有第一步\中间步\最后一步,总共多少步由length属性决定,
     * 每次只显示其中一步.第一步只显示[下一步],中间步显示[上一步,下一步],最后一步显示[上一步,完成].支持显示文字的国际化.
     * 每次改变步子都触发change事件.可以通过传入参数控制按钮显示文本及length
     *
     * @param {Object} [data]
     *          data结构如下:
     *          {
         *              length:5,
         *              first:"第一步文本",
         *              prev:"上一步文本",
         *              next:"下一步文本",
         *              last:"最后一步文本"
         *          }
     *
     * **使用范例**
     *
     *     @example
     *
     *     //[html]代码
     *     <div id="buttonStepBox">
     *     </div>
     *     //[Javascript]代码
     *      var buttonStep=$("#buttonStepBox").buttonstep();
     *      buttonStep.change(function(position)
     *      {
         *          console.log(position);//输出改变后的current
         *      });
     *
     * @class ef.components.buttonstep
     * @return {ef.components.buttonstep}
     * */
    function ButtonStep(box, data) {
        this.box = box;
        this.data = data;
        this.steps = [];
        this.current = 0;
        this.container = $('<ul class="button-step"></ul>');
        this.li = $('<li></li>');
        this.template = $('<span class="btn"><a></a></span>');
        this.viewstack = null;
        this.confirmCallback = $.noop;
        this.init();
        this.draw();
        return this;
    }
    ButtonStep.isDom=true;
    /**
     * @protected 初始化
     * */
    ButtonStep.prototype.init = function () {
        this.config = {
            length: 4,
            first: _.getLocale("framework.component.buttonstep.first"),
            prev: _.getLocale("framework.component.buttonstep.prev"),
            next: _.getLocale("framework.component.buttonstep.next"),
            last: _.getLocale("framework.component.buttonstep.last"),
            enabled:true
        };
        _.copyProperty(this.config, this.data);
        if (this.config.length < 0) {
            throw new Error("Wrong with ButtonStep.length<0");
        }
    };
    /**
     * @protected 增加事件侦听
     * */
    ButtonStep.prototype.addListener = function () {
        var _self = this;
        this.container.find(".next").click(function () {
            _self.next();

        });
        this.container.find(".prev").click(function () {
            _self.prev();

        });
        this.container.find(".last").click(function () {
            if(!_self.config.enabled)return;
            _self.confirmCallback($(this));
        });
    };
    /**
     *
     * 设置确认按钮是否可用,false不可用
     * */
    ButtonStep.prototype.setEnabled=function(bool)
    {
        this.config.enabled=bool;
        if(bool)
        {
            this.container.find(".last").removeClass("disabled");
        }else
        {
            this.container.find(".last").addClass("disabled");
        }
    };
    /**
     * @event change 侦听change改变事件
     * @param {Function} fn (required)要侦听的回调函数
     *
     * **使用范例**
     *
     *     $(dom).buttonstep().change(function(position)
     *     {
         *          console.log(position);
         *     });
     *
     * @return {ef.components.buttonstep}
     * */
    ButtonStep.prototype.change = function (fn) {
        this.viewstack.change(fn);
        return this;
    };
    /**
     * @event confirm
     * 侦听点击最后一步确定后的处理事件
     * * @param {Function} fn (required)要侦听的回调函数
     *
     *  * **使用范例**
     *
     *     $(dom).buttonstep().confirm(function()
     *     {
         *          console.log("点击完成按钮");
         *     });
     *
     * @return {ef.components.buttonstep}
     *
     * */
    ButtonStep.prototype.confirm = function (fn) {
        if (fn) {
            this.confirmCallback = fn;
        }
        return this;
    };
    /**
     * @protected 渲染ButtonStep组件到dom
     * */
    ButtonStep.prototype.draw = function () {
        var _self = this;
        this.box.empty();
        this.container.empty();
        this.box.append(this.container);
        for (var i = 0; i < this.config.length; i++) {
            var _step = new _self.Step();
            _step.position = i;
            var _li = this.li.clone();
            _step.dom = _li;
            var _btn1 = this.template.clone();
            var _btn2 = this.template.clone();
            _li.append(_btn1);
            _li.append(_btn2);
            if (!i) {
                _btn1.addClass("first");
                _btn2.addClass("next");
                _btn1.find("a").text(this.config.first);
                _btn2.find("a").text(this.config.next);
                _btn1.remove();
            } else {
                _btn1.find("a").text(this.config.prev);
                _btn2.find("a").text(this.config.next);
                _btn1.addClass("prev");
                if (i == this.config.length - 1) {
                    _btn2.find("a").text(this.config.last);
                    _btn2.addClass("last");
                } else {
                    _btn2.addClass("next");
                }
            }
            this.container.append(_li);
        }
        this.addListener();
        this.viewstack = this.container.viewstack();
        this.setEnabled(this.config.enabled);
    };
    /**
     * 让ButtonStep显示哪一步,由传入step决定,step序号从0开始,不要大于length设置
     * @param {Number} step (required) 要显示的step序列号,0代表第一个
     * @return {ef.components.buttonstep} 返回ButtonStep实例
     * */
    ButtonStep.prototype.goto = function (step) {
        return this.viewstack.goto(step);
    };
    /**
     * 让ButtonStep跳到上一步
     * @return {ef.components.buttonstep} 返回ButtonStep实例
     * */
    ButtonStep.prototype.prev = function () {
        return this.viewstack.prev();
    };
    /**
     * 让ButtonStep跳到下一步
     * @return {ef.components.buttonstep} 返回ButtonStep实例
     * */
    ButtonStep.prototype.next = function () {
        return this.viewstack.next();
    };
    /**
     * 让ButtonStep跳到第一步
     * @return {ef.components.buttonstep} 返回ButtonStep实例
     * */
    ButtonStep.prototype.first = function () {
        return this.viewstack.first();
    };
    /**
     * 让ButtonStep跳到最后一步
     * @return {ef.components.buttonstep} 返回ButtonStep实例
     * */
    ButtonStep.prototype.last = function () {
        return this.viewstack.last();
    };
    /**
     * ButtonStep中的每一步Step对象，内部类
     * {@img step.png Step组件}
     * @class ef.components.buttonstep.Step
     *
     * */
    ButtonStep.prototype.Step = function () {
        /**@readonly 每一项的数据*/
        this.data = null;
        /**@readonly 每一项的dom对象*/
        this.dom = null;
        /**@readonly 每一项的位置,从零开始*/
        this.position = -1;
    };
    ef.register(ButtonStep,"buttonstep");
    return ButtonStep;
});
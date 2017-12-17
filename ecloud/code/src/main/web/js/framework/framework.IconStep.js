/**
 * Created by wangahui1 on 16/4/20.
 */
define("framework.iconstep",["exports","framework.core"],function(exports,ef)
{
    /**
     * #图标步阶组件#
     *
     * {@img iconstep.png 图标步阶组件}
     *
     * # 描述 #
     *
     *  图标步阶组件是一组带有文字和icon并有先后顺序的步阶组件
     *
     *
     * @param {Array} data (required) 要生成iconstep的配置参数
     *
     * **使用范例**：
     *
     *     @example
     *
     *     var iconstep=$(dom).iconstep(
     *     [
     *         {
         *               text:"基本信息",//显示的文本信息
         *               iconClass:"step-base-icon",//图标需正常状态要显示的css样式,使用css Sprite定义图标位置
         *               iconSelectedClass:"step-base-icon",//图标选中状态要显示的css样式
         *               //［下面两行可以直接使用图片，但不推荐使用］.请直接使用iconClass及iconSelectedClass定义
         *               //icon_up:"./theme/default/css/step-base.png",
         *               //icon_selected:"/theme/default/css/step-base-selected.png",
         *               selected:true//默认是否被选中
         *         },
     *         {
         *               text:"网络配置",
         *               iconClass:"step-network-icon",
         *               iconSelectedClass:"step-network-selected-icon",
         *               selected:true
         *         }
     *     ]);
     *
     * @class ef.components.iconstep
     * @return ef.components.iconstep
     * */
    function IconStep(box, data) {
        this.box = box;
        this.data = data;
        /**所有步子集合,里面是Step对象*/
        this.steps = [];
        /**@readonly 当前是第几步，从零开始*/
        this.current = 0;
        /**@deprecated 图标是否可点击，默认false不可点击*/
        this.isClick = false;
        this.clickCallback = $.noop;
        this.data = this.data ? this.data : [];
        /**@protected 绘制iconstep的内部dom容器*/
        this.container = $('<ul class="icon-step icon-step-svm"></ul>');
        /**每一步的dom模版*/
        this.template = $('<li><div class="bg"></div><div class="conter"><p class="icon-step-text icon-step-text-svm"></p><p class="icon-step-icon icon-step-icon-svm"><img class="hide"><i></p></div></li>');
        this.draw();
        return this;
    }
    IconStep.isDom=true;
    /**
     * @protected
     * 绘制iconstep
     * */
    IconStep.prototype.draw = function () {
        var _self = this;
        this.box.empty();
        this.container.empty();
        this.box.append(this.container);
        $(this.data).each(function (i, il) {
            var _step = new _self.Step();
            var _item = _self.template.clone(true);
            _step.dom = _item;
            _step.data = il;
            _step.position = i;
            _step.isIcon = il.icon_up && il.icon_selected;
            _item.find(".icon-step-text").text(il.text);
            if (_step.isIcon) {
                _item.find(".icon-step-icon img").show();
                _item.find(".icon-step-icon img").attr("src", _step.data.selected ? _step.data.icon_selected : _step.data.icon_up);

            } else {
                _item.find("i").addClass(_step.data.selected ? il.iconSelectedClass : il.iconClass);

            }

            _self.steps.push(_step);
            if (_step.data.selected) {
                _self.goto(i);
            }
            _item.click(function () {
                if (!_self._hasClickRight(i))return;
                _self.clickCallback(_step.position);
                _self.goto(_step.position, true);
            });
            if (!i) {
                _item.addClass("icon-step-first");
            }
            if (i == _self.data.length - 1) {
                _item.addClass("icon-step-end");
            }
            if(i && i != _self.data.length - 1){
                _item.addClass("icon-step-svm-middles");
            }
            _self.container.append(_item);
        });
    };
    /**
     * @event change 步骤切换的监听事件
     * @param {Function} callback chang事件的回调处理函数
     * */
    IconStep.prototype.change = function (callback) {
        if (!callback)return;
        this.changeCallback = callback;
        return this;
    };
    /**
     * @event click 点击图标的处理事件 取决于isClick属性是否为true
     * @param {Function} callback click事件的回调处理函数
     * */
    IconStep.prototype.click = function (callback) {
        if (!callback)return;
        this.clickCallback = callback;
        return this;
    };
    /**
     * 跳转到第几步
     * @param {Number} step 要跳转的步骤，从零开始，将触发change事件
     * @return {Boolean} 返回是否跳转成功，如果step大于其长度或小于0将返回false
     * */
    IconStep.prototype.goto = function (step, isClick) {
        if (isNaN(step) || step > this.data.length || step < 0) {
            return false;
        }
        this.current = step;
        var _self = this;
        $(this.steps).each(function (i, il) {
            il.data.selected = il.position == step;
            if (il.data.selected) {
                il.dom.addClass("current");
                if (_self.changeCallback) {
                    _self.changeCallback(il);
                }
            } else {
                il.dom.removeClass("current");
            }
            if (il.position <= step) {
                il.dom.addClass("selected");
                if (il.isIcon) {
                    il.dom.find(".icon-step-icon img").attr("src", il.data.icon_selected);
                } else {
                    il.dom.find("i").removeClass(il.data.iconClass);
                    il.dom.find("i").addClass(il.data.iconSelectedClass);
                }

            } else {
                il.data.selected = false;
                il.dom.removeClass("selected");
                if (il.isIcon) {
                    il.dom.find(".icon-step-icon img").attr("src", il.data.icon_up);
                } else {
                    il.dom.find("i").removeClass(il.data.iconSelectedClass);
                    il.dom.find("i").addClass(il.data.iconClass);
                }

            }
        });
        this._setAfterUnClick(step);
        return true;
    };
    /**
     *跳到上一步
     * @return {Boolean} 返回是否跳转成功
     * */
    IconStep.prototype.prev = function () {
        return this.goto(this.current - 1);
    };
    /**
     *跳到下一步
     * @return {Boolean} 返回是否跳转成功
     * */
    IconStep.prototype.next = function () {
        return this.goto(this.current + 1);
    };
    /**
     *跳到第一步
     * @return {Boolean} 返回是否跳转成功
     * */
    IconStep.prototype.first = function () {
        return this.goto(0);
    };
    /**
     *跳到最后一步
     * @return {Boolean} 返回是否跳转成功
     * */
    IconStep.prototype.last = function () {
        return this.goto(this.data.length - 1);
    };
    IconStep.prototype.Step = function () {
        this.data = null;
        this.dom = null;
        this.position = -1;
        this.isIcon = false;
        this.clicked = false;
    };
    /**
     * @protected  设置对应步骤是否被点击或激活
     * @param {Number}step 要设置的步子
     * */
    IconStep.prototype.setClicked = function (step, bool) {
        $(this.steps).each(function (i, il) {
            if (i == step) {
                il.clicked = bool;
            }
        });
    };
    IconStep.prototype._setAfterUnClick = function (step) {
        $(this.steps).each(function (i, il) {
            if (i > step) {
                il.clicked = false;
            }
        });
    };
    IconStep.prototype._hasClickRight = function (step) {
        return step <= this.current;
    };
    /**
     * 是否所有步子已被点击或激活
     * @return {Boolean} 返回所有的图标是否已经被点击或者触发激活过
     * */
    IconStep.prototype.isAllClicked = function () {
        var sign = 0;
        $(this.steps).each(function (i, il) {
            if (il.clicked) {
                sign++;
            }
        });
        return sign == this.steps.length;
    };
    ef.register(IconStep,"iconstep");
    return IconStep;
});
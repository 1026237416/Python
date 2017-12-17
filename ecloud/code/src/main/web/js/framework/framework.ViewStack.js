/**
 * Created by wangahui1 on 15/11/30.
 */
define("framework.viewstack",["exports","framework.core"],function(exports,core){
    /**
     * @class ef.components.viewstack
     * # ViewStack组件 #
     * {@img viewstack.png ViewStack示例}
     * # 描述 #
     * Viewstack(Class)是一组层叠的容器,类似于photoshop的层.可以通过设置让某个层显示而其它同级层隐藏
     *
     * **使用范例**
     *
     *     @example
     *
     *     //[html]代码
     *     <ul id="stackBox">
     *         <li>1</li>
     *         <li>2</li>
     *         <li>3</li>
     *     </ul>
     *     //[Javascript]代码
     *      var stack=$("#stackBox").viewstack();
     *      stack.change(function(position)
     *      {
         *          console.log(position);//输出改变后的current
         *      });
     *      stack.goto(1);//设置让第二个层显示,即2所在的li会显示,其它li将会隐藏
     * @return {ef.components.viewstack} 该viewstack实例
     */
    function ViewStack(box, data,config) {
        /**承载该组件的dom容器,即$(dom)*/
        this.box = box;
        /**使用viewStack需要配置的数据对象*/
        this.data = data;
        this.config=config;
        /**@protected 默认回调函数*/
        this._callback = $.noop;
        this.init();
        this.render();
        return this;
    }
    ViewStack.isDom=true;
    /**
     * 初始化ViewStack
     * @protected
     */
    ViewStack.prototype.init = function () {
        /**当前所显示的层的序号,默认-1(即无要显示的层)*/
        this.current = -1;
        /**获取所有层数
         * @deprecated 请通过属性children.length获取*/
        this.numchildren = 0;
        /**当前所有的层*/
        this.children = [];
        /**上次显示的层序号*/
        this.oldPos = -1;
        var that=this;
        if(_.isArray(this.data))
        {
            this.box.empty();
            $(this.data).each(function()
            {
                var li=$("<li></li>");
                if(this.content!=undefined)
                {
                    li.append(this.content);
                }else if(this.contentURL!=undefined)
                {
                    li.load(this.contentURL);
                }
                if(this.selected)
                {
                    li.addClass("selected");
                }
                that.box.append(li);
            });
        }
    };
    /**@event change 可以监听current改变*/
    ViewStack.prototype.change = function (fn) {
        this._callback = fn ? fn : this._callback;
        return this;
    };
    /**
     * 渲染ViewStack组件到dom
     * */
    ViewStack.prototype.render = function () {
        var _self = this;
        this.box.addClass("viewstack");
        this.box.children("li").addClass("viewstack-li");
        this.numchildren = this.box.children("li").length;
        this.current = this.box.children("li.selected").index();
        this.current = this.current == -1 ? 0 : this.current;
        this.box.children("li").each(function (i, il) {
            var _stack = new _self.Stack();
            _stack.dom = $(this);
            _stack.index = i;
            _self.children.push(_stack);
            if(_.isArray(_self.data))
            {
                _stack.data=_self.data[i];
            }else
            {
                _stack.data=
                {
                    content:$(this).children(),
                    selected:$(this).hasClass("selected")
                }

            }
            if ($(this).hasClass("selected")) {
                _self.current = i;
            }
        });
        if(this.config&&this.config.killAutoSelected)
        {
            return;
        }
        this.goto(this.current);
    };
    /**
     * 让ViewStack显示那个层,由层到序号决定,序号从0开始
     * @param {Number} index (required) 要显示到序列号,0代表第一个
     * @return {ef.components.viewstack} 返回ViewStack实例
     * */
    ViewStack.prototype.goto = function (index) {
        var _self = this;
        var _stack=null;
        if (index >= this.numchildren || index < 0) {
            return;
        }
        $(this.children).each(function (i, stack) {
            if (index == stack.index) {
                stack.dom.addClass("selected");
                stack.index = index;
                _self.current = index;
                _stack=stack;
                stack.selected=true;

            } else {
                stack.dom.removeClass("selected");
                stack.selected=false;
            }
        });
        if (this.current != this.oldPos) {
            this._callback(this.current,_stack);
        }
        this.oldPos = this.current;
        return this;
    };
    /**
     * 让ViewStack显示下一个层
     * @return {ef.components.viewstack} 返回ViewStack实例
     * */
    ViewStack.prototype.next = function () {
        return this.goto(this.current + 1);
    };
    /**
     * 让ViewStack显示上一个层
     * @return {ef.components.viewstack} 返回ViewStack实例
     * */
    ViewStack.prototype.prev = function () {
        return this.goto(this.current - 1);
    };
    /**
     * 让ViewStack显示第一个层
     * @return {ef.components.viewstack} 返回ViewStack实例
     * */
    ViewStack.prototype.first = function () {
        return this.goto(0);
    };
    /**
     * 让ViewStack显示最后一个层
     * @return {ef.components.viewstack} 返回ViewStack实例
     * */
    ViewStack.prototype.last = function () {
        return this.goto(this.numchildren - 1);
    };
    /**
     * ViewStack每一层对象(Stack),内部类
     * {@img stack.png Stack示例}
     * @class ef.components.viewstack.Stack
     * */
    ViewStack.prototype.Stack = function () {
        /**@readonly 存储的dom对象*/
        this.dom = null;
        /**@readonly stack的层序号，从零开始*/
        this.index = -1;
        this.data=null;
    };
    /**
     * 获取stack对象
     * */
    ViewStack.prototype.getStack=function(index)
    {
        if(!_.isNumber(index))return false;
        if(index<0)return false;
        if(index>this.children.length-1)return false;
        return this.children[index];
    };
    ef.register(ViewStack,"viewstack");
    return ViewStack;
});
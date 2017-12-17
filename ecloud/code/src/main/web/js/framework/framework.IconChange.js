/**
 * #图标步阶组件#
 *
 * {@img iconstep.png 图标步阶组件}
 *
 * # 描述 #
 *
 *  图标切换组件是一组带有文字和icon并有先后顺序的步阶组件
 *
 *
 * @param {Array} data (required) 要生成iconchange的配置参数
 *
 * **使用范例**：
 *
 *     @example
 *
 *     var iconchange=$(dom).iconchange(
 *     [
 *         {
         *               text:"基本信息",//显示的文本信息
         *               iconClass:"step-base-icon",//图标需正常状态要显示的css样式,使用css Sprite定义图标位置
         *               iconAllClass:"step-change-all-info",//全部图标出现时第n步的图标
         *               iconSelectedClass:"step-base-icon"//全部图标出现死，图标选中状态要显示的css样式
         *         },
 *         {
         *               text:"配置选择",
                         iconClass:"step-change-quota",
                         iconAllClass:"step-change-all-quota",
                         iconSelectedClass:"step-change-all-quota-select",
                         selected:false
         *         }
 *     ],1000);//需要传入的最外层dom节点的宽度(width)
 *
 * @class ef.components.inconchange
 * @return ef.components.inconchange
 * */
define("framework.iconchange",["framework.core","exports"],function(ef,exports)
{
    function IconChange(box,data,len,hei){
        this.box = box;
        this.data = data;
        this.len = len;
        this.hei=hei;
        /**所有步子集合,里面是Step对象*/
        this.steps = [];
        /**@readonly 当前是第几步，从零开始*/
        this.current = 0;
        /**@deprecated 图标是否可点击，默认false不可点击*/
        this.isClick = false;
        this.clickCallback = $.noop;
        this.data = this.data ? this.data : [];
        /**@protected 绘制iconstep的内部dom容器*/
        this.container = $('<ul class="icon-change"></ul>');
        /**所有icon出现时的dom容器*/
        this.contentAll = '<div class="iconAllRender"></div><ul class="iconChangeAll"></ul>';
        /**所有icon出现时，每一步的dom模板*/
        this.templateAll = $('<li><div class="iconChangeAll-pic"><i></i></div><p class="iconChangeAll-text"></p></li>');
        /**每一步的dom模版*/
        this.template = $('<li><div class="bg"></div><div class="iconChangeCon"><span class="icon-change-text-lateral"></span><span class="icon-change-text"></span><p class="icon-change-icon"><i></i></p></div></li>');
        this.draw();
        return this;
    }
    IconChange.isDom=true;
    /**
     * @protected
     * 绘制iconchange
     * */
    IconChange.prototype.resize = function () {
        var left = (Number($(document.body).width())-Number(this.len))/2+2;
        $(".iconChangeAll").css({width:this.len}).css({left:left+"px"});
        var wit = (Number(this.len)-140)/this.data.length;
        $(".iconChangeAll li").css({width:wit}).eq(0).css({"margin-left":"70px"});
        //var top=$(".iconChangeAll").css("top");
        //top=top-$(document.body).scrollTop();
        //$(".iconChangeAll").css({"top":top});
        var pos=this.box.offset().top;
        var _top=pos+(this.box.height()- $(this.contentAll).height()/2)/2-82;
        $(".iconChangeAll").css({"top":_top});
    };
    IconChange.prototype.draw = function () {
        var _self = this;
        this.box.empty();
        this.container.empty();
        this.box.append(this.container);
        $(document.body).append(this.contentAll);
        $(this.data).each(function (i, il) {
            var _item = _self.template.clone(true);
            var itemAll = _self.templateAll.clone(true);
            $(".icon-change").append(_item);
            $(".icon-change i").eq(i).addClass(il.iconClass);
            $(".iconChangeAll").append(itemAll);
            $(".iconChangeAll li").eq(i).attr({index:i});
            $(".iconChangeAll i").eq(i).addClass(il.iconAllClass);
            if(il.text.indexOf('[')!=-1){
                var first = il.text.indexOf('[');
                var last = il.text.indexOf(']');
                var lateralText = il.text.substring(first+1,last);
                var infeedText = il.text.substring(last+1,il.text.length);
                $(".iconChangeAll p").eq(i).text(lateralText+infeedText);
                $(".icon-change .icon-change-text-lateral").eq(i).text(lateralText);
                $(".icon-change .icon-change-text").eq(i).text(infeedText);
                return;
            }
            $(".icon-change .icon-change-text").eq(i).text(il.text);
            $(".iconChangeAll p").eq(i).text(il.text);
        });

        $(".icon-change li").eq(this.current).show();
        $(window).resize(function(){_self.resize()});
        this.resize();
        //var left = (Number($(document.body).width())-Number(this.len))/2+2;
        //$(".iconChangeAll").css({width:this.len}).css({left:left+"px"});
        //var wit = (Number(this.len)-140)/this.data.length;
        //$(".iconChangeAll li").css({width:wit}).eq(0).css({"margin-left":"70px"});
        ////var top=$(".iconChangeAll").css("top");
        ////top=top-$(document.body).scrollTop();
        ////$(".iconChangeAll").css({"top":top});
        //var pos=this.box.offset().top;
        //var _top=pos+(this.box.height()-this.container.height())/2+50;
        //console.log("height",pos,this.box.height(),this.container.height());
        //$(".iconChangeAll").css({"top":_top});
    };
    /**
     * 跳转到第几步
     * @param {Number} step 要跳转的步骤，从零开始
     * @return {Boolean} 返回是否跳转成功，如果step大于其长度或小于0将返回false
     * */
    IconChange.prototype.goto = function (step) {
        if (isNaN(step) || step > this.data.length || step < 0) {
            return false;
        }
        this.current = step;
        $(".icon-change li").eq(this.current).show().siblings().hide();
        $(this.data).each(function(i,il){
            var index = $(".iconChangeAll li").eq(i).attr("index");
            if(index<=step){

                $(".iconChangeAll li").eq(i).find('i').removeClass(il.iconAllClass).addClass(il.iconSelectedClass);
                $(".iconChangeAll li").eq(i).addClass("icon_change_useable");
            }
            else
            {

                $(".iconChangeAll li").eq(i).find('i').removeClass(il.iconSelectedClass).addClass(il.iconAllClass);
                $(".iconChangeAll li").eq(i).removeClass("icon_change_useable");
            }
        });
        return true;
    };
    /**
     *跳到第一步
     * @return {Boolean} 返回是否跳转成功
     * */
    IconChange.prototype.first = function () {
        return this.goto(0);
    };
    /**
     *跳到最后一步
     * @return {Boolean} 返回是否跳转成功
     * */
    IconChange.prototype.last = function () {
        return this.goto(this.data.length-1);
    };
    /**
     *跳到上一步
     * @return {Boolean} 返回是否跳转成功
     * */
    IconChange.prototype.prev = function () {
        return this.goto(this.current-1);
    };
    /**
     *跳到下一步
     * @return {Boolean} 返回是否跳转成功
     * */
    IconChange.prototype.next = function () {
        return this.goto(this.current+1);
    };
    /**
     * @event click 全部图标出现时，每一个图标的点击事件
     * @param {Function} callback click事件的回调处理函数
     * */
    IconChange.prototype.click = function (callback) {
        var _self = this;
        $(".iconChangeCon").hover(function(){
            $(".iconChangeAll").show();
            $(".iconAllRender").show();
        });
        $(".iconChangeAll li").click(function () {
            var index = Number($(this).attr("index"));
            if(_self.current==index){$(this).parent().hide();$(".iconAllRender").hide();}
            if(_self.current>index){
                _self.current = index;
                _self.goto(_self.current);
                $(this).parent().hide();
                $(".iconAllRender").hide();
            }
            if(callback){callback(_self.current);}
        });
        $('.iconChangeAll').hover(function () {

        }, function () {
            $(".iconChangeAll").hide();
            $(".iconAllRender").hide();
        });
    };
    /**
     * 销毁组件
     * */
    IconChange.prototype.destroy = function () {
        $(".iconChangeAll").remove();
        $(".iconAllRender").remove();
        this.box.remove();
    };
    ef.register(IconChange,"iconchange");
    return this;
});
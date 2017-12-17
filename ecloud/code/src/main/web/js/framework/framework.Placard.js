/**
 * Created by wangahui1 on 16/4/20.
 */
define("framework.placard",["exports","framework.core"],function(exports,ef)
{
    /**
     * #Placard显示提示标语横幅#
     * # 描述#
     * Placard显示提示标语横幅,支持不同icon级别显示等,并且会自动消失
     * {@img placard.png 条幅对象示例}
     *
     * **使用范例**：
     *
     *     @example
     *
     *  @class ef.components.placard
     * */
    function Placard() {
        this.name = "placard";
        /**显示图标类型：包括 warn,error,info*/
        this.type = "info";
        this.remain = 5000;
        this.tm = null;
        /**生成的组件dom模版*/
        this.dom = $('<div class="ef-placard">' +
            '<div class="ef-placard-box">' +
            '<div class="ef-placard-bg"></div>' +
            '<div class="ef-placard-cont">' +
            '<i></i>' +
            '<span></span>' +
            '    </div>' +
            '</div></div>');
        this.icon = this.dom.find(".ef-placard-cont i");
        /**条幅显示的位置 E,S,W,N四个方向(当前支持顶部N)*/
        this.position = "n";
        this.addListener();
    }
    Placard.isInstance=true;
    /**@protected 缩放居中*/
    Placard.prototype.resize = function (self) {
        self.dom.css("left", ($(ef.root).width() - self.dom.width()) / 2);
    };
    /**@protected 增加事件侦听*/
    Placard.prototype.addListener = function () {
        var _self = this;
        $(ef.root).on("resize.Placard", function () {
            _self.resize(_self);
        });
        this.dom.hover(function () {
            if (_self.tm) {
                _self.pause();
            }
        }, function () {
            _self.show();
        });
    };
    /**@protected 移除事件*/
    Placard.prototype.removeListener = function () {
        $(ef.root).off("resize.Placard");
    };
    /**@protected 重置定时器 */
    Placard.prototype.reset = function () {
        var _self = this;
        this.tm = setTimeout(function () {
            _self.hide()
        }, _self.remain);
    };
    /**@protected 暂停定时器*/
    Placard.prototype.pause = function () {
        if (this.tm)
            clearTimeout(this.tm);
    };
    /**
     * 显示条幅
     * @param {String} msg 要显示的提示文字
     * @param {String} type 要显示的图标类型（级别）,支持info,warn,error,mail
     * @param {String} position 条幅显示的位置，支持 N,S,W,E
     * @param {String} iconClass 要自定义的图标类
     *
     * */
    Placard.prototype.show = function (msg, type, position,iconClass) {
        if(!arguments.length)
        {
            msg=this.msg;
            type=this.type;
            position=this.position;
        }
        var _self = this;
        this.msg=msg;
        if(!this.msg)return;
        this.pause();
        this.type = type == undefined ? "info" : type;
        this.setType(this.type,iconClass);
        this.position = position ? position : this.position;
        this.dom.find(".ef-placard-cont span").text(this.msg);
        $(document.body).append(this.dom);
        this.dom.slideDown("slow", function () {
            _self.reset();
        });
        this.addListener();
        this.resize(this);
    };
    /**显示对勾图标信息*/
    Placard.prototype.tick = function (msg) {
        return this.show.apply(this, [msg, "tick"]);
    };
    /**显示普通信息*/
    Placard.prototype.info = function (msg) {
        return this.show.apply(this, [msg, "info"]);
    };
    /**显示告警信息*/
    Placard.prototype.warn = function (msg) {
        return this.show.apply(this, [msg, "warn"]);
    };
    /**显示错误信息*/
    Placard.prototype.error = function (msg) {
        return this.show.apply(this, [msg, "error"]);
    };
    /**显示邮件*/
    Placard.prototype.mail = function (msg) {
        return this.show.apply(this, [msg, "mail"]);
    };
    /**显示中间状态*/
    Placard.prototype.doing = function (msg) {
        return this.show.apply(this, [msg, "doing"]);
    };
    /**自定义图标*/
    Placard.prototype.custom = function (msg,position,iconClass) {
        return this.show.apply(this, [msg, "custom",position,iconClass]);
    };
    Placard.prototype.setType = function (type,iconClass) {
        type = type.toLowerCase();
        this.type = type;
        this.icon.removeClass();
        iconClass=iconClass||"icon-" + type;
        this.icon.addClass(iconClass);
    };
    /**隐藏条幅*/
    Placard.prototype.hide = function () {
        var _self = this;
        this.msg=undefined;
        this.pause();
        this.dom.slideUp("fast", function () {
            _self.dom.remove();
            _self.removeListener();
        });
    };
    ef.register(Placard,"placard");
    return Placard;
});
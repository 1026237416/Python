/**
 * Created by wangahui1 on 16/4/20.
 */
define("framework.iconmenu",["require","exports","framework.core","user"],function(require,exports,ef,user)
{
    require(["framework.togglebutton"]);
    /**
     * #纯图标按钮组组件#
     *
     * {@img iconmenu.png 纯图标按钮组组件}
     *
     * # 描述 #
     * 纯图标按钮组组件表示一组纯图标的按钮组，通过置参数可以生成。
     * @param {Array} data 配置该组件的参数对象
     * @param {Boolean} isFast 是否快速显示iconmenu组件，默认false,如果设置为true则组件生成显示时候不带动画
     *
     *    **使用范例**：
     *
     *     @exaple
     *     var _iconMenu = $(".host-icon-box").iconmenu([
     *        {
         *            iconClass:"icon-menus-icon-run",//要显示的图标css
         *            position://图标内部位置重设
         *            {
         *                x:15,
         *                y:10
         *            },
         *            id:"1",//图标的唯一标识
         *            tip:ef.util.getLocale('host.iconmenu.poweron.tip'),//图标要显示的提示文字
         *            "access":[8,88],//图标的显示权限集合，具体参见user.js和role.js
         *            click:function()//点击处理事件
         *            {
         *
         *            }
         *        },
     *        {
         *            iconClass:"icon-menus-icon-shutdown",
         *            id:"2",
         *            position:
         *            {
         *                x:15,
         *                y:10
         *            },
         *            tip:ef.util.getLocale('host.iconmenu.shutdown.tip'),//"关机",
         *            "access":[8,88],
         *            click:function()
         *            {
         *
         *            }
         *        },
     *
     * @class ef.components.iconmenu
     * */
    function IconMenu(box, data, isFast) {
        this.box = box;
        /**
         * 配置参数 请见上面范例说明
         * */
        this.data = data;
        /**@protected 内部生成dom容器*/
        this.container = $('<ul class="icon-menus"></ul>');
        /**每一个按钮的dom模版*/
        this.item = $('<li class="hide"><img  class="hide"/><i class="icon-menus-icon"></i></li>');
        this.text = $('<span class="icons-menus-text"><i data-class class="icons-menus-i"></i></span>');
        /**按钮集合*/
        this.menus = [];
        /**@readonly 是否非动画显示*/
        this.isSlow = !isFast;
        /**是否所有的按钮都没权限，默认false*/
        this.isNoRightAll = false;
        this.roleType = user.getRole().value;
        this.super = user.isSuper();
        if (!this.data || !this.data.length)return;
        this.init();
        this.addListener();
        return this;
    }
    IconMenu.isDom=true;
    /**@protected 初始化*/
    IconMenu.prototype.init = function () {
        this.menus = [];
        this.box.empty();
        if (!this.isSlow) {
            this.container.addClass("transparent");
        }
        this.box.append(this.container);
        this.draw();
    };
    /**@protected 绘制按钮组*/
    IconMenu.prototype.draw = function () {
        var _self = this;
        var _sign = 0;
        $(this.data).each(function (i, el) {
            if (el.access) {
                var _noright = _.noRight(_self.roleType, el.access, _self.super);
                if (_noright) {
                    return;
                }
            }

            _sign++;
            var _menu = new _self.Menu(_self);
            var _item = _self.item.clone(false);
            _menu.data = el;
            _menu.dom = _item;
            _self.container.append(_item);
            if(el.isToggle)
            {
                _item.empty();
                _menu=_item.togglebutton(el.data,true);
                _menu.toggle=true;
            }else
            {
                if (el.iconClass) {
                    _item.find("img").remove();
                    if(el.text){
                        _item.find("i").remove();
                        var text = _self.text.clone(false)
                            .addClass(el.iconClass)
                            .find('i')
                            .attr('data-class',el.text)
                            .end();
                        _item.append(text);
                    }else{
                        _item.find("i").addClass(el.iconClass);
                    }
                }else
                {
                    var _img = _item.find("img");
                    _img.show("fast");
                    _img.attr("src", el.icon);
                    _item.find("i").remove();
                }
                if(el.position)
                {
                    _item.css({"left":el.position.x,"top":el.position.y});
                }
                var _tool = _item.tooltip({content: el.tip});
                if (el.click) {
                    _item.click(function () {
                        if (!el.disable) {
                            el.click(_menu);
                        }
                    });
                }
                _item.fadeTo(.7);
                _item.hover(function () {
                    if (el.disable){
                        $(this).tooltip("hide");
                        return;}
                    $(this).fadeTo("fast", 1);
                }, function () {
                    if (el.disable)return;
                    $(this).fadeTo("fast",.7);
                });
                _self.setDisable(_menu,el.disable);
                if (_self.isSlow) {
                    _item.hide();
                    _item.animate({
                        height: 'toggle', opacity: 'toggle'
                    }, "slow");
                }

            }
            _self.menus.push(_menu);

        });
        this.isNoRightAll = !_sign;
    };
    IconMenu.prototype.Menu = function (owner) {
        this.data = null;
        this.dom = null;
        this.disable = false;
        this.owner = owner;
        this.tip = null;
        this.toggle=null;
    };
    /**事件侦听*/
    IconMenu.prototype.addListener = function () {
        $(this.menus).each(function (i, el) {
            if(el.toggle)return;
            $(el.dom).hover(function () {
                if (!el.tip)
                    el.tip = el.dom.tooltip("tip");
            });
            $(el.dom).mouseout(function () {
                try {
                    var _tip = $(this).tooltip('tip');
                    _tip.hide();
                } catch (err) {
                }
            });
            $(el.dom).click(function () {
                if (el.disable)return false;
                if (el.tip)
                    el.tip.hide();
            });
        });
    };
    /**设置按钮是否可用（enable|disable）
     * @param {String} id 按钮的唯一标识名
     * @param {Boolean} isEnable 设置按钮是否可用
     * */
    IconMenu.prototype.setStatus = function (id, isDisable) {
        var _self=this;
        $(this.menus).each(function (i, menu) {
            if (menu.data.id == id) {
                _self.setDisable(menu,isDisable);
            }
        });
    };
    IconMenu.prototype.setDisable=function(menu,isDisable)
    {
        menu.data.disable = Boolean(isDisable);
        menu.disable = menu.data.disable;
        menu.dom.css({display:"inline-block"});
        menu.data.disable ? (menu.dom.addClass("icon-disable")) : (menu.dom.removeClass("icon-disable"));
        if (menu.data.disable) {
            menu.dom.fadeTo(0, .2);
        } else {
            menu.dom.fadeTo(0,.7);
        }
    };
    ef.register(IconMenu,"iconmenu");
    return IconMenu;
});
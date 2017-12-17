/**
 * Created by wangahui1 on 16/4/20.
 */
define("framework.togglebutton",["require","exports","framework.core"],function(require,exports,ef){
    require(["framework.iconmenu"]);
    /**
     *
     * #ToggleButton切换多个状态组的按钮组组件#
     * {@img togglebutton.png 上下步组件}
     * # 描述#
     * toggleButton是多个状态的图标按钮组，可以进行切换，组内包含的即为对象为togggle{dom:"dom节点对象",iconmenu:"IconMenus对象"},toggle的属性 iconmenu即为IconMenus对象(参见 {@link ef.components.iconmenu} ).
     *
     * **使用范例**：
     *
     *     @example
     *
     *          var toggle = $(dom).togglebutton(
     *          [
     *              [//第一组
     *                  {
         *                          iconClass: "icon-menus-icon-edit",//显示第图标css样式
         *                          tip: ef.util.getLocale("setting.user.edit.tip"),//提示文字
         *                          id: '1',//标识的唯一id
         *                          click: function (menu) {//点击处理事件，参数返回当前的图标按钮对象，包括其自身数据、是否不可用、当前dom节点对象，所属的IconMenus对象
         *                          console.log(menu);//输出{data:{当前数据,disable:false,dom:当前生成的dom节点,owner:IconMenus对象}}
         *                          }
         *                  },
     *                  {
         *                          iconClass: "icon-menus-icon-edit",
         *                          tip: ef.util.getLocale("setting.user.edit.tip"),
         *                          id: '1',
         *                          click: function (menu) {
         *                          console.log(menu);//输出{data:{当前数据,disalbe:false,dom:当前生成的dom节点,owner:IconMenus对象}}
         *                          }
         *                  }
     *              ],
     *              [//第二组
     *                  {
         *                          iconClass: "icon-menus-icon-cancel",
         *                          tip: ef.util.getLocale("setting.user.cancel.tip"),
         *                          id: '2',
         *                          click: function (menu) {
         *
         *                          }
         *                  }
     *              ]
     *              //第n组
     *              //[]
     *         ]).setStatus('2', true);
     * @param {Object} data 配置的参数对象
     * @class ef.components.toggleButton
     * */
    function ToggleButton(box, data,isSub) {
        this.box = box;
        this.data = data;
        /**当前的状态是第几组，从零开始*/
        this.position = -1;
        /**生成的该组件的dom容器*/
        this.container = $('<ul class="toggle-button"></ul>');
        /**每一组toggle的父级模版*/
        this.template = $('<li></li>');
        this.init();
        this.draw(isSub);
        return this;
    }
    ToggleButton.isDom=true;
    /**@protected 初始化*/
    ToggleButton.prototype.init = function () {
        if (!this.data || !this.data.length) {
            throw new Error("wrong with param !ToggleButton");
        }
        this.position = 0;
        /**存储状态组的数组，每个对象都是一个toggle对象,toggle对象包含两个属性(dom和iconmenu，iconmenu属性即为IconMenus对象(ef.components.iconmenu) dom对象即为该toggle的dom对象)*/
        this.menus = [];
    };
    /**设置按钮中单个按钮的是否可用
     * @param {String} id要设置按钮状态的id
     * @param {boolean} isDisable 是否不可用，如果为true则该按钮不可用
     * @return 返回ef.components.togglebutton
     * */
    ToggleButton.prototype.setStatus = function (id, isDisable) {
        $(this.menus).each(function (i, menu) {
            menu.iconmenu.setStatus(id, isDisable);
        });
        return this;
    };
    ToggleButton.prototype.resize = function (toggle) {

       // this.box.css({"min-width":35 * toggle.iconmenu.data.length});
       var width=toggle.dom.width();
        if(!width)
        {
            width=51*toggle.iconmenu.data.length;
        }
        this.box.css({"min-width":width});
    };
    ToggleButton.prototype.getMinWidth=function(toggle)
    {
        var wid=0;

        return toggle.iconmenu.data.length;
    };
    /**@protected 渲染组件*/
    ToggleButton.prototype.draw = function (isSub) {
        this.box.empty();
        this.container.empty();
        this.box.append(this.container);
        if(isSub)
        {
            //this.container.css({"margin-top": "-3px"});
        }
        var _self = this;
        $(this.data).each(function (i, il) {
            var _li = _self.template.clone();
            var _iconMenu = _li.iconmenu(il, true);
            _iconMenu.owner = _self;
            var _toggle = new _self.Toggle();
            _self.container.append(_li);
            _toggle.dom = _li;
            _toggle.iconmenu = _iconMenu;
            _toggle.dom.find("li").css({ "text-align": "right"});
            _self.menus.push(_toggle);
            if (!i) {
                _li.show();
                _self.resize(_toggle);
            } else {
                _li.hide();
            }
        });
    };
    ToggleButton.prototype.setToggle = function (bool) {
        this.toggle = bool;
    };
    /**
     * 跳转按钮的状态
     * @param {Number} pos 要跳转的状态值，从零开始(整形)
     * */
    ToggleButton.prototype.goto = function (pos) {
        if (pos < 0 || pos > this.data.length - 1) {
            return;
        }
        this.position = pos;
        var _self = this;
        $(this.menus).each(function (i, toggle) {
            if (pos == i) {
                toggle.dom.show();
                _self.resize(toggle);
            } else {
                toggle.dom.hide();
            }
        });
    };
    /**
     * Toggle内部类,用于存储每一组Toggle对象
     * {@img toggle.png Toggle对象示例}
     * @class ef.components.toggleButton.Toggle
     * */
    ToggleButton.prototype.Toggle = function () {
        /**@readonly dom对象*/
        this.dom = null;
        /**@readonly iconmenu对象，详见ef.components.iconmenu*/
        this.iconmenu = null;
    };
    ef.register(ToggleButton,"togglebutton");
    return ToggleButton;
});
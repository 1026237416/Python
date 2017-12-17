/**
 * Created by wangahui1 on 16/4/20.
 */
define("framework.dialog",["exports","framework.core"],function(exports,ef)
{
    /**
     * #对话框组件#
     * {@img dialog.png 对话框组件示例}
     *
     * # 描述 #
     * 对话框组件为弹出的对话框层，依赖于easyui的dialog组件，并对其进行了扩展并解除了dom的限制，支持对话框的存储及关闭后的彻底清除（包括dom）.
     * 建议使用此组件替代easyui的dialog。
     *
     * **使用范例**：
     *
     *     @example
     *
     *     //[Javascript]代码
     *       var dialog=new ef.Dialog("winDialog",//唯一id
     *       {
         *           width:600,//显示宽度
         *           height:380,//显示高度
         *           closable:false,
         *           noHeader:true,//是否显示头部
         *           href:"views/testDialog.html"//加载的链接地址
         *
         *       });
     *
     *       //关闭dialog:
     *       dialog.close();
     *       //其它页面根据id关闭该dialog:
     *       ef.Dialog.close("winDialog");
     *       //或者下面方法
     *       var dialog=ef.Dialog.getDialog("winDialog");
     *       dialog.close();
     *       //关闭所有dialog
     *       ef.Dialog.closeAll();
     *
     * @param {String} id 生成dialog唯一性
     * @param {Object} param 生成dialog的配置参数
     * @class ef.Dialog
     * @return ef.Dialog实例
     * */
    function Dialog(id, param) {
        /**唯一性的id*/
        this.id = id;
        /**参数设置,其余属性同easyui的dialog配置*/
        this.param = param||{};
        /**生成dialog的一级dom对象*/
        this.dom = $('<div></div>');
        /**是否显示dialog的头部header*/
        this.noHeader = false;
        this.init();
        return this;
    }
    Dialog._dialogs = {};
    /**
     * @private
     * @static 注册dialog
     * @param {String} key 要注册键名(即dialog的id)
     * @param {Object} dialog 要注册的dialog;
     * */
    Dialog._register = function (key, dialog) {
        this._dialogs[key] = dialog;
        return dialog;
    };
    /**
     * @static 根据id获取dialog对象
     * */
    Dialog.getDialog = function (id) {
        if (this._dialogs.hasOwnProperty(id)) {
            return this._dialogs[id];
        }
    };
    /**
     * @static 获取所有dialog对象
     * */
    Dialog.getAll = function () {
        return this._dialogs;
    };
    /**
     * 关闭所有根据ef.Dialog生成的dialog
     * */
    Dialog.closeAll = function () {
        for (var i in this._dialogs) {
            var dialog = this._dialogs[i];
            dialog.close();
        }
    };
    /**
     * @private
     * @static 根据key删除dialog
     * */
    Dialog._deleteDialog = function (key) {
        delete this._dialogs[key];
    };
    /**
     * @static 根据id关闭dialog
     * @param {String} id 要关闭的dialog
     * @return {Boolean} 关闭dialog是否成功
     * */
    Dialog.close = function (id) {
        var _dialog = this.getDialog(id);
        if (_dialog) {
            _dialog.close();
            $(document.body).scrollTop(0);
            $(".tooltip").hide();
        }
        return Boolean(_dialog);
    };
    /**
     * @private 内部关闭函数
     * */
    Dialog.prototype._onClose = function (domain) {
        if (domain) {
            var _shadow = this.dialog.next(".window-shadow");
            var _mask = _shadow.next(".window-mask");
            _shadow.remove();
            _mask.remove();
            try{domain.remove()}
            catch (err) {
            }
        }
        if (!this.dialog)return;
        $(window).off("keydown." + this.id, this.keydown);
        this.dom.off();
        $("html").removeClass("auto");
        this.dom.remove();
        this.dialog.remove();
        this.closeCallback();
        Dialog._deleteDialog(this.id);
    };
    /**
     * @private dialog加载完成处理方法,内部使用
     * @param {Object} domain dialog的不同域
     * */
    Dialog.prototype._onLoad = function (domain) {
        this.loadCallback();
    };
    /**
     * @protected 初始化dialog
     * */
    Dialog.prototype.keydown = function (event) {
        if (event.keyCode == 27) {
            var id = event.data.id;
            Dialog.close(id);
        }
    };
    Dialog.prototype.init = function () {
        this.isExpand=Boolean(this.param.isExpand);
        this.expandWidth=this.param.expandWidth||0;
        $(".tooltip").hide();
        Dialog._register(this.id, this);
        this.param.modal = true;
        this.param.draggable=false;
        var _self = this;
        this.closeCallback = this.param.onClose ? this.param.onClose : $.noop;
        this.loadCallback = this.param.onLoad ? this.param.onLoad : $.noop;
        this.param.onClose = function () {
            var domain = this;
            _self._onClose(domain);
        };
        this.param.onLoad = function () {
            var domain = this;
            _self._onLoad(domain);
        };
        var _win = ef.root.top||ef.root;
        var _doc = $(_win.document.body);
        if (_doc.find("#" + this.id).length) {
            throw new Error(_.getLocale("framework.dialog.id.error,重复的dialogId，请重新命名唯一性"));
        }
        this.dom.attr("id", this.id);
        _doc.append(this.dom);
        this.dom.hide();
        this.dom.fadeIn("fast");
        this.param.width=this.param.width+(this.isExpand?this.expandWidth:-this.expandWidth);

        this.dom.dialog(this.param);
        this.dialog = this.dom.dialog("dialog");
        this.dialog.addClass("ef-dailog");
        this.noHeader = this.param.noHeader;
        if (this.noHeader) {
            this.dialog.addClass("no-header");
        }
        var _dom = this.dom;
        $(window).on("keydown." + this.id, {id: this.id}, this.keydown);
        function resize() {
            try {
                _self.dom.dialog('options');
            } catch (err) {
                return;
            }
            var _width = $(this).width();
            var _height = $(this).height();
            var _dialogWidth = _self.dom.parent().width();
            var _dialogHeight = _self.dom.parent().height();
            var _left = (_width - _dialogWidth) / 2;
            var _top = (_height - _dialogHeight) / 2;
            $("html").addClass("auto");
            _left = _left < 10 ? 10 : _left;
            _top = _top < 10 ? 10 : _top;
            _dom.dialog("move", {top: _top, left: _left});
        }
        $(document.body).resize(resize);
        $(window).resize(resize);
        resize();
    };
    Dialog.prototype.toResize = function(){
        var _self = this,
            _dom =  this.dom;
        try {
            _self.dom.dialog('options');
        } catch (err) {
            return;
        }
        var _wd=_dom.width()+(this.isExpand?this.expandWidth:-this.expandWidth);
        var header=_self.dom.parent().find(">.panel-header");
        var body=_self.dom.parent().find(">.panel-body");
        _self.dom.parent().width(_wd);
        _self.dom.parent().next(".window-shadow").width(_wd);
        header.width(_wd);
        body.width(_wd);
        $(window).resize();
    };
    Dialog.prototype.toggle=function()
    {
        this.isExpand=!this.isExpand;
        this.toResize();
    };
    Dialog.prototype.setTitle=function(title)
    {
        this.dom.dialog("setTitle",title);
    };
    /**
     * 关闭dialog实例
     * */
    Dialog.prototype.close = function () {
        this.dom.dialog("close");
    };
    ef.register(Dialog,"Dialog");
    return Dialog;
});
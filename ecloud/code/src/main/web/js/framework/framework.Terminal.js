/**
 * Created by wangahui1 on 16/4/20.
 */
define("framework.terminal",["exports","framework.core"],function(exports,ef)
{
    /**
     **
     * #Terminal控制台组件#
     *
     * {@img terminal.png 自动增加数字组件}
     *
     * # 描述 #
     * Terminal组件用于模拟控制台界面的模型
     * @extend easyui.dialog
     * @class ef.components.terminal
     * */
    function Terminal(box, data) {
        this.name = "terminal";
        this.box = box;
        /**宽度*/
        this.width = 600;
        /**高度*/
        this.height = 350;
        /**配置参数*/
        this.data = data;
        /**头部dom容器*/
        this.header = $('<h3 class="terminal_header"><a class="close"><img src="theme/default/images/messager_cancel_btn.png"/></a><span class="text"></span></h3>');
        /**主展示区的dom容器*/
        this.body = $('<div class="terminal_body"><textarea ></textarea></div>');
        /**生成的该组件的主dom容*/
        this.container = $('<div class="terminal"></div>');
        if (this.data) {
            this.width = data.width;
            this.height = data.height;
        }
        this.draw();
        this.addListener();
    }
    Terminal.isDom=true;
    /**@protected 事件侦听*/
    Terminal.prototype.addListener = function () {
        this.header.find(".close").click(function () {
            $(".dialog-box").eq(0).window('close');
        });
        $(this.container).keydown(function (event) {
            if (event.keyCode == 27) {
                $(".dialog-box").eq(0).window('close');
            }
        });
    };
    /**渲染组件*/
    Terminal.prototype.draw = function () {
        this.box.empty();
        this.body.height(this.height - this.header.height());
        this.header.find(".text").text(this.data.title);
        this.body.find("textarea").html(this.data.content);
        this.container.append(this.header);
        this.container.append(this.body);
        this.container.width(this.width);
        this.box.append(this.container);
        this.body.find("textarea").focus();
        exports.util.setCaretPosition(this.body.find("textarea")[0], this.body.find("textarea").val().length);
    };
    ef.register(Terminal,"terminal");
    return Terminal;
});
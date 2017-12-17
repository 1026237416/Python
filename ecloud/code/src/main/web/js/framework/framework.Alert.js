/**
 * Created by wangahui1 on 16/4/20.
 */
;define("framework.alert", ["exports", "framework.core"], function (exports, ef) {
    function Alert() {
        this.dom = $('<div class="ef-alert-box-" style="width: 100%;height:100%;z-index:2147483648;position:fixed;top:0;"> ' +
            '<div class="window-loading" style="width:100%;height:100%;z-index:2147483642;position: absolute;"></div>' +
            '<div class="ef-alert" style="z-index: 2147483643;"><div  class="ef-alert-box">' +
            '<div class="ef-alert-top"><span class="ef-alert-msg"></span></div>' +
            '<div class="ef-alert-bottom"><span class="ef-alert-close">close</span></div>' +
            '</div></div>' +
            '</div>');
        this.init();
        this.addListener();
        return this;
    }
    Alert.prototype.init=function()
    {
        this.dom.find(".ef-alert-close").text(_.getLocale("cal.host.switch.open"));
    };
    Alert.prototype.addListener = function () {
        var _self = this;
        this.dom.find(".ef-alert-bottom .ef-alert-close").click(function () {
            _self.hide();
        });
        $(window).keydown(function (event) {
            if (event.keyCode == 27) {
                _self.hide();
            }
        });
    };
    Alert.prototype.show = function (msg) {
        this.hide();
        $(document.body).append(this.dom);
        this.dom.find(".ef-alert-msg").text(msg);
        this.dom.fadeIn("fast");
        return msg;
    };
    Alert.prototype.hide = function () {
        $(document.body).find(".ef-alert-box-").off().remove();
    };
    ef.rewrite
    (ef.root,
        {
            "alert": Alert
        });
    return Alert;
});
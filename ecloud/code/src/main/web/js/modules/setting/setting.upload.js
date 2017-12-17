/**
 * Created by hanxf on 2016/3/22.
 */
/**
 * Created by hanxf on 2016/3/19.
 */
define(["setting.user", "api", "module", "domReady","setting.param"], function (settingUser, api, module, domReady,settingParam) {
    var implement = new ef.Interface.implement();
    implement.redraw = function () {
        domReady(function () {
            $("#cancel").text(ef.util.getLocale("global.button.cancel.label"));
            $("#ok").text(ef.util.getLocale("global.button.confirm.label"));
            $("#lic_box").upload({
                id: "file",
                url: api.getAPI("sysInfo") + "/upload",
                type: "post",
                filters:[".lic"],
                formElements: [
                    {
                        type: "textbox",
                        id: "private_key",
                        prompt: ef.util.getLocale("setting.input.license"),
                        required: true,
                        width: 320,
                        height: 26,
                        validType: 'whitelist[".a-zA-Z0-9_-","字母，数字，下划线和."]'
                    }],
                success: function (response) {
                    ef.event.trigger("sysinfo.success",
                        {

                        });
                    ef.Dialog.closeAll();
                    ef.placard.tick(ef.util.getLocale("setting.sysinfo.uploadsuc"));
                   // ef.placard.tick(ef.util.getLocale("setting.sysinfo.success"));
                },
                error: function (error) {
                    ef.placard.error("验证失败");
                }
            });
            $("#cancel").click(function () {
                ef.Dialog.closeAll();
            });
        });
    };
    implement.destroy = function () {
        require.undef(module.id);
    };
    return implement;
});
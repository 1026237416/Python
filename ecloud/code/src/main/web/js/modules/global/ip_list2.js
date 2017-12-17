define(["module"],function (module) {
    var implement=new ef.Interface.implement();
    implement.redraw=function(ipData,config) {
        if(!ipData){return;}
        var _ip=$("#bar_ip_box").ip(ef.util.copyDeepProperty(ipData),config);
        var isEdit=ef.Dialog.getDialog("getIpList").param.param.isEdit;
        if(isEdit)
        {
            $(".button-route").show();
            _ip.setMode(true);
        }else
        {
            $(".button-route").hide();
            _ip.setMode(false);
        }
        $("#ip_ok").click(function () {
            ef.event.trigger("selectIpListEvent",
                {
                    param: ef.Dialog.getDialog("getIpList").param.param,
                    data: _ip.getIps(),
                    ip:_ip,
                    dataNoDhcp:_ip.getIpsNoDhcp()
                });
            ef.Dialog.close("getIpList");
        });
    };
    implement.destroy=function()
    {
        require.undef(module.id);
    };
    return implement;
});

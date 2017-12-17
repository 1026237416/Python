/**
 * Created by wangahui1 on 16/7/7.
 */
define(["module","api","setting.user"],function(module,api,settingUser)
{
    var impl=new ef.Interface.implement();
    impl.owner=null;
    impl.redraw=function(nodeData,iconData,owner)
    {
        $(".manor_instance_detail_info .item-list-ul-first").show();
        var cover=$(".manor_instance_detail_info").coverlayer({loadingHeight:350},{opaque:true});
        impl.owner=owner;
        //$("#idField",".item-list-ul-first").textbox(
        //    {
        //        width:197,
        //        height:30,
        //        value:nodeData.data.name,
        //        readonly:true
        //    });
        var dom=$('<a class="table-link" style="font-size:16px;display: inline-block;line-height: 28px">'+nodeData.data.name+'</a>');
        $("#idField",".item-list-ul-first").html(dom);
        dom.click(function()
        {
            console.log(nodeData);
            ef.Dialog.close("manor.instance.detail.info");
            ef.nav.goto('hostDetail.html','cal.host.hostDetail',nodeData.data.vm_id,null,'cal.host');
        });
        var obj=impl.getFormatStatus(nodeData.data.status);
        var field=$("#stateField",".item-list-ul-first").textbox(
            {
                width:197,
                height:30,
                value:obj.label,
                readonly:true
            });
        field.parent().addClass(obj.color);
        $("#projectField",".item-list-ul-first").textbox(
            {
                width:197,
                height:30,
                readonly:true
            });
        $("#vlanField",".item-list-ul-first").textbox(
            {
                width:197,
                height:30,
                value:nodeData.data.network_name,
                readonly:true
            });
        $("#userField",".item-list-ul-first").textbox({
            width:197,
            height:30,
            value:"-",
            readonly:true
        });
        $("#ipField",".item-list-ul-first").textbox(
            {
                width:197,
                height:30,
                value:nodeData.data.ip,
                readonly:true
            });
        $("#backupField",".item-list-ul-first").textbox(
            {
                width:197,
                height:60,
                multiline:true,
                readonly:true,
                value:nodeData.data.des||"-"
            });
        $(".manorInfoCloseBtn").click(function()
        {
            ef.Dialog.close("manor.instance.detail.info");
        });
        impl.owner.getProjects(function(resp)
        {
            if(!resp)return;
            $("#projectField",".item-list-ul-first").textbox("setValue",resp.name);
            cover.hide();

        },impl.owner.resouceData[0].tenant);
        if(nodeData.data.user_id)
        {

            impl.getUsersByTenant(impl.owner.resouceData[0].tenant,function(rrs)
            {
                var user=ef.util.find(rrs,function(iter)
                {
                    return iter.id==nodeData.data.user_id;
                });
                $("#userField",".item-list-ul-first").textbox("setValue",user.displayname);
            });
            //settingUser.getUserInfo(nodeData.data.user_id,function(userInfo)
            //{
            //    if(userInfo)
            //    {
            //        $("#userField",".item-list-ul-first").textbox("setValue",userInfo.displayname);
            //    }
            //});
        }

    };
    impl.getUsersByTenant=function(tenantId,success,error)
    {
        ef.getJSON({
            url:"/tenant/"+tenantId+"/users",
            success:success|| $.noop,
            error:error|| $.noop
        });
    };
    impl.getFormatStatus=function(state)
    {
        return {
            label:ef.util.getLocale("apply.instance.detail.info."+state),
            color:"manor_instance_info_color_"+state
        };
    };
    impl.destroy=function()
    {
        require.undef(module.id);
    };
    return impl;
});
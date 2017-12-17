/**
 * Created by admin on 2016/1/30.
 */
/**
 * Created by 韩雪飞 on 2015/11/30.
 */
define(["module","api","cal.disk"],function (module,api,disk) {
    var implement=new ef.Interface.implement();
    implement.init = function () {
        $("#template_Name").textbox({
            required:true,
            maxlength:15,
            width:197,
            height:30/*,
            validType: 'whitelist["0-9a-zA-Z_","字母,数字和下划线"]'*/
        });
        $("#template_pwd").textbox({
           /* required:true,*/
            maxlength:15,
            width:197,
            height:30/*,
            validType: 'regx[/^(\.{8,})$/,"请输入8-15位字符"]'*/
        });
        $("#template_password").textbox({
            /*required:true,*/
            maxlength:15,
            width:197,
            height:30/*,
            validType:'regx[/^(\.{8,})$/,"请输入8-15位字符"]'*/
        });
        $("#super_user").textbox(
            {
                /*required:true,*/
                maxlength:15,
                width:197,
                height:30/*,
                validType: 'whitelist["0-9a-zA-Z_","字母,数字和下划线"]'*/
            });
    };
    implement.redraw=function()
    {
        implement.init();
        $("#addtemplatecancel").click(function () {
            ef.Dialog.close('hostDetailtemplate');
        });
        $("#addtemplateok").click(function () {
            var name = $("#template_Name").textbox('getValue');
            var des = $("#addtemplatebackup").val();
           /* if(!$("#template_Name").textbox('isValid')){
                ef.placard.warn("镜像名称输入不合法！");
                return;
            }
            if(!$("#super_user").textbox("isValid")){
                ef.placard.warn("超级用户名输入不合法！");
                return;
            }*/
            var pw1=$("#template_pwd").textbox("getValue");
            var pw2=$("#template_password").textbox('getValue');
           /* if(!pw1||!pw2)
            {
                ef.placard.warn("密码不能为空！");
                return;
            }*/
            if(pw1!=pw2)
            {
                ef.placard.warn("两次密码不一致！");
                return;
            }
            var cover=$("#hostDetailtemplate").coverlayer({loadingHeight:462});
            ef.getJSON({
                url:api.getAPI("cal.host.getHostlist")+"/"+ef.localStorage.get("hostDetail_id")+"/upload/image",
                type:'post',
                data:{
                    name:name,
                    super_user:$("#super_user").textbox('getValue'),
                    super_user_pass:pw1,
                    des:des
                },
                success: function () {
                    cover.hide();
                    ef.Dialog.close('hostDetailtemplate' );
                    ef.placard.doing(ef.util.getLocale("host.iconmenu.template.placard"));
                },
                error:function()
                {
                    cover.hide();
                }
            });
        });
    };
    implement.destroy=function()
    {
        require.undef(module.id);
    };
    return implement;
});


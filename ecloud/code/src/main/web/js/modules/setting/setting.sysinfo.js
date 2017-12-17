/**
 * Created by wangahui1 on 15/11/6.
 */
define(["module","api","upload","clientPaging","user"],function(module,api,upload,clientPaging,user)
{
    var implement=new ef.Interface.implement();
    implement.getEdition=function(success,error)
    {
        ef.getJSON(
            {
                url:api.getAPI("sysInfo"),
                useLocal:true,
                success:success,
                error:error||$.noop
            });
    };
    implement.getLicense = function () {
        ef.getJSON({
            url: api.getAPI("sysInfo") + "/private/key", //用于文件上传的服务器端请求地址
            type: 'get',
            success: function (response)  //服务器成功响应处理函数
            {
                if(response!=null){
                    $(".data_serial_number").empty().text(response);
                }
            }
        });
    };
    implement.getInfo = function () {
        ef.getJSON({
            url: api.getAPI("sysInfo") + "/details", //用于文件上传的服务器端请求地址
            type: 'get',
            success: function (response)  //服务器成功响应处理函数
            {
                var nodes;
                $(response).each(function (i,il) {
                    nodes = il.nodes;
                    il.startdate = ef.util.number2time(il.startdate,"Y-M-D h:m:s",true);
                    il.enddate = ef.util.number2time(il.enddate,"Y-M-D",true);
                    for(var j in il){
                        $(".block-list-content").find(".data_"+j).empty().text(il[j]);
                    }
                });
            }
        });
    };
    implement.setEdition=function()
    {
        this.getEdition(function(response)
        {
            for(var i in response)
            {
                var val=response[i];
                if(i=="sysright")
                {
                    val=ef.util.trimHtml(val);
                }
                $(".sysinfo").find("._data_"+i).text(val);
            }
        });
    };
    implement.getHost = function () {
        ef.getJSON({
            url:api.getAPI("sysInfo")+"/hostid", //用于文件上传的服务器端请求地址
            type: 'get',
            success: function (response)  //服务器成功响应处理函数
            {
                $(".hostid").empty().text(response);
            }
        });
    };
    implement.redraw=function() {
        $(document).ready(function () {
            implement.init();
            implement.getLicense();
            implement.getHost();
            implement.getInfo();
            implement.setEdition();
            if(user.isTenant()){
                $(".lic").hide();
            }
            $("#upload").click(function () {
                new ef.Dialog("addHostDialog",{
                    title: ef.util.getLocale("setting.sysinfo.license.upload.dialog"),
                    width:550,
                    height:300,
                    closed: false,
                    cache: false,
                    nobody:false,
                    href: 'views/upload.html',
                    modal: true,
                    onResize:function(){
                        $(this).dialog("center");//垂直居中窗口
                    },
                    onClose:function()
                    {
                        require.undef('setting.upload');
                    },
                    onLoad:function()
                    {
                        require(['setting.upload'], function (upload) {
                            upload.redraw();
                        });
                    }
                });
            });
            ef.event.on("sysinfo.success", function () {
                implement.getInfo();
            });
        })
    };
    implement.destroy=function()
    {
        require.undef(module.id);
    };
    return implement;
});
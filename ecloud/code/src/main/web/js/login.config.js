/**
 * Created by wangahui1 on 15/11/10.
 */
/**
 * Created by wangahui1 on 15/11/4.
 */
require.config(
    {
        baseUrl:"js",
        paths:
        {
            "jquery":["./libs/easyui/jquery.min"],
            "i18n":"./libs/jquery/jquery.i18n.properties-1.0.9",//国际化库,
            "locale":"locale",//本地国际化
            "underscore":"./libs/backbone/underscore-1.8.2",
            "contextmenu":'./libs/jquery/jquery-smartMenu',//右键菜单插件
            "mockjax": "./libs/mock/jquery.mockjax",//Mock拦截
            "easyui":"./libs/easyui/jquery.easyui.min",
            "clientPaging":"./libs/easyui/jquery.easyui.clientpaging",//easyui客户端分页插件
            "easyui.lang.zh":"./libs/easyui/locale/easyui-lang-zh_CN",//easyui全局中文本地化
            "echart":"./libs/echarts/echarts-all",//echart图表插件
            "domReady":"./libs/require/domReady",//view加载完毕时候调用
            "role":"./modules/role",//公用角色模块
            "user":"./modules/user",//公用用户模块
            "signature":"./modules/signature",//签署模块
            "setting.sysinfo": "./modules/setting/setting.sysinfo",//配置-系统信息
            "upload":"./libs/jquery/ajaxfileupload",
            "mousewheel":"./libs/jquery/jquery.mousewheel-3.1.12",//鼠标滚轮插件
            "framework.shell":"./framework/output/framework.min",
            "contextmenu": './libs/jquery/jquery.smartmenu',//右键菜单插件
            "mustache":"./libs/mustache/mustache"

        },
        waitSeconds:90,
        shim:
        {
            "i18n":["jquery"],
            easyui:["jquery"],
            upload:["jquery"],
            clientPaging:["jquery","easyui"],
            "easyui.lang.zh":['jquery'],
            //"framework":
            //{
            //    deps:["jquery",'locale','easyui'],
            //    exports:"ef"
            //},
            "login": {
                deps: ["framework.shell"]
            },
            "locale":["i18n"],
            "api": {
                deps: ["framework.shell","api.config","mockjax"],
                exports: "api"
            },
            "framework.shell":
            {
                deps:["jquery",'locale','easyui',"easyui.lang.zh","mockjax","underscore","contextmenu","mousewheel"],
                exports:"ef"
            }

        },
        map:
        {
            '*':
            {
                'css': 'libs/require/css'
            }
        }
    })(["login"]);

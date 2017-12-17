/**
 * Created by wangahui1 on 15/11/17.
 */
require.config(
    {
        baseUrl:"js",
        paths:
        {
            "jquery":["./libs/easyui/jquery.min"],
            "i18n":"./libs/jquery/jquery.i18n.properties-1.0.9",//国际化库,
            "locale":"locale",//本地国际化
            "backbone":"./libs/backbone/backbone",//Backbone MVC Framework
            "underscore":"./libs/backbone/underscore-1.8.2",
            "mockjax":"./libs/mock/jquery.mockjax",//Mock拦截
            "mockjson":"./libs/mock/jquery.mockjson",//Mock Json
            "contextmenu": './libs/jquery/jquery.smartmenu',//右键菜单插件
            "easyui":"./libs/easyui/jquery.easyui.min",
            "clientPaging":"./libs/easyui/jquery.easyui.clientpaging",//easyui客户端分页插件
            "easyui.lang.zh":"./libs/easyui/locale/easyui-lang-zh_CN",//easyui全局中文本地化
            "echart":"./libs/charts/echarts/echarts-all",//echart图表插件
            "domReady":"./libs/require/domReady",//view加载完毕时候调用
            //"framework": "./framework/framework",//Our Framework
            "role":"./modules/role",//公用角色模块
            "user":"./modules/user",//公用用户模块
            "signature":"./modules/signature",//签署模块
            "alarm":"./modules/alarm",
            "upload":"./libs/jquery/ajaxfileupload",
            "framework.shell":"./framework/output/framework.min",
            "codemirror":"./libs/codemirror/codemirror",
            "active-line":"./libs/codemirror/active-line",
            "shell":"./libs/codemirror/shell",
            "xml":"./libs/codemirror/xml",
            "mustache":"./libs/mustache/mustache",
            "mos":"./modules/global/mos"
        },
        shim:
        {

            "i18n":["jquery"],
            "locale":["i18n"],
            easyui:["jquery"],
            "mockjax":["jquery"],
            "mockjson":["jquery"],
            "easyui.lang.zh":['jquery'],
            "backbone":
            {
                exports:"Backbone"
            },
            "underscore":
            {
                exports:"_"
            },
            "framework.shell":
            {
                deps:["jquery",'locale','easyui',"easyui.lang.zh","mockjax","backbone","underscore","contextmenu"],
                exports:"ef"
            },
            "api": {
                deps: ["framework.shell","api.config"],
                exports: "api"
            },
            "test":
            {
                deps:["backbone","underscore","framework.shell"]
            },
            "sprite":
            {
                deps:["framework.shell"]
            }
        }
    })(["sprite"]);
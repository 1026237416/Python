/**
 * Created by yezi on 2016/11/29.
 */
define(["module","api","easyui","network.addVlan2"],function(module,api,easyui,addVlan2){
    var implement=new ef.Interface.implement();
    var    _stack = null,
        _route = null,
        currentModule = null,
        beforeIndex = -1,
        iconStep=null,
        resultList=null;
    implement.redraw=function(){
        iconStep=$(".step_wrapper").iconstep([
            {
                text:ef.util.getLocale('host.addhost.dialog.iconstep.info.text'),
                iconClass:"svm-step-base-icon",
                iconSelectedClass:"svm-step-base-icon-select",
                selected:true
            },
            {
                text:ef.util.getLocale('setting.project.detail.networkcreat.host'),
                iconClass:"net-add-host",
                iconSelectedClass:"net-add-host-select",
                selected:false
            }
        ]).click(function(step)
        {
            _route.goto(step);
            _stack.goto(step);
        });
        resultList=$("#resultBox").resultList( {
            id:"resultData",
            title:"预览",
            textField:"label",
            valueField:"value",
            groupField:"group",
            data:[
                {
                    label:"名称",
                    value:"name",
                    group:"基本信息"
                },
                {
                    label:"网络类型",
                    value:"vlan_type",
                    group:"基本信息"
                },
                {
                    label:"VLAN ID",
                    value:"vlan_id",
                    group:"基本信息"
                },
                {
                    label:"物理网络",
                    value:"phy_network",
                    group:"基本信息"
                },
                {
                    label:"宿主机",
                    value:"hosts",
                    group:"主机",
                    list: [
                        {
                            filed: 'host'
                        }
                    ]
                }
            ]
        });
        implement.utils.buttonStep();
        implement.utils.loadStep(0,_stack.children[0]);
        beforeIndex = 0;
    };
    implement.utils={
        buttonStep:function(){
            _stack = $(".viewstack-box")
                .viewstack()
                .change(function(pos,dom){
                    implement.utils.loadStep(pos,dom);
                    if(resultList)
                    {
                        resultList.goto(pos);
                    }
                });
            //缓存_stack用来保存数据
            ef.localStorage.put('network.creatnet',_stack);
            _route = $(".button-route-box")
                .buttonstep({length:2})
                .change(function(pos){
                    $(".tooltip").hide();
                    //点击下一步的时候验证数据
                    if(pos > beforeIndex){
                        if(!currentModule.utils.isValid()){
                            _route.goto(pos-1);
                            implement.utils.iconStep(pos-1);
                            return;
                        }
                    }
                    _stack.goto(pos);
                    implement.utils.iconStep(pos);
                })
                .confirm(function(){
                    ef.loading.show();
                    var isLocal=false;
                    /*var issend = ef.localStorage.get('network.creatnet').children[1].viewData.length!=0?true:false;
                    if(!issend){
                        ef.loading.hide();
                        return
                    }*/
                    /*implement.sendSeverData.getData();
                    implement.sendSeverData.sendData();*/
                    var data = ef.localStorage.get('network.creatnet').children[0].viewData;
                    data.hosts=ef.localStorage.get('network.creatnet').children[1].viewData||[];
                    data={
                        "hosts":data.hosts,
                        "name":data.name,
                        "vlan_id":data.vlan_id,
                        "phy_network":data.phy_network,
                        "vlan_type":data.vlan_type.toLowerCase()
                    };
                    ef.getJSON(
                        {
                            url:api.getAPI("order.wait.Detail.combo.ip.xx"),
                            type:"put",//get,post,put,delete
                            data:data,
                            success:function(response)
                            {
                                implement.destroy();
                                ef.Dialog.close("addnetDialog");
                                ef.nav.reload();
                                ef.loading.hide();
                                ef.placard.tick(ef.util.getLocale("network.vlan.placard.addsuccess"));
                            },error:function(error) {
                            ef.loading.hide();
                        }
                        });
                });
        },
        loadStep:function(pos,elem){
            console.log(pos,elem.dom[0]);
            var config = implement.config.buttonStep[pos],
                $elem = $(elem.dom[0]),
                loaded =  elem.loaded;
            //任何情况下最后一页都要重新加载
            if(pos == 3){
                loaded =  elem.loaded = false;
            }
            //点击上一步的时候不用重新加载页面
            //点击下一步的时候必须要重新加载页面
            if(!loaded && pos > beforeIndex){
                ef.loading.show();
                $elem.empty();
                $elem.load(config.temp,function(template){
                    require.undef(config.jsModule);
                    require([config.jsModule],function(module){
                        currentModule = module;
                        config.module = module;
                        module.redraw($elem);
                        elem.loaded = true;
                        beforeIndex = pos;
                        ef.loading.hide();
                    });
                });
            }else{
                currentModule = config.module;
                beforeIndex = pos;
            }
        },
        iconStep:function(pos){
            iconStep.goto(pos);
        }
    };
    implement.config={
        buttonStep:{
            0:{
                temp:'views/addVlan.html',
                jsModule:'network.addVlan'
            },
            1:{
                temp:'views/vlanHost.html',
                jsModule:'network.addVlan2'
            }
        },
        iconStep:[
            {
                text:ef.util.getLocale('host.addhost.dialog.iconstep.info.text'),//"基本信息",
                iconClass:"svm-step-base-icon",
                iconAllClass:"step-change-all-info",
                iconSelectedClass:"step-change-all-info-select",
                selected:true
            },
            {
                text:ef.util.getLocale('setting.project.detail.networkcreat.host'),//"网络"
                iconClass:"step-change-net",
                iconAllClass:"step-change-all-net",
                iconSelectedClass:"step-change-all-net-select",
                selected:false
            }
        ]
    };
    implement.destroy=function(){
        way.clear("resultData");
        _stack = null;
        _route = null;
        require.undef(module.id);
    };
    return implement;
});
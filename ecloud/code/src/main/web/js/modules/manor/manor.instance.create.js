/**
 * Created by lizhao on 16/5/9.
 */
define("manor.instance.create",[
    "domReady",
    "module",
    "codemirror",
    "xml",
    "active-line",
    "shell",
    "vis",
    "api",
    "user",
    "setting.param"
],function(domReady,module,CodeMirror,xml,activeLine,shell,vis,api,user,settingParam){
    // ef.localStorage.put('manor.instance.create',response);
    var isLocal = false,
        editor = null,
        network = null,
        currentTabTypeConfig = null;
    var viewstacker=null;
    var impls = new ef.Interface.implement();
    impls.viserData=null;
    impls.stacks=[];
    impls.redraw=function(){
        this.viserData=null;
        this.cover=$(".create_cover").coverlayer({loadingHeight:525,opaque:false});
        this.init();
    };
    impls.onComplte=function()
    {
        this.cover.hide();
        $(".create_cover").find(".viewstack-box-dlg").show();
    };
    impls.destroy=function(){
        require.undef(module.id);
    };
    impls.o = {
        $step:$('.instance-step-cont'),
        $stack:$('.viewstack-box-dlg'),
        $proCombox:$('#proCombox'),
        $vlanCombox:$('#vlanCombox'),
        $netCombox:$('#netCombox'),
        $subnetCombox:$('#subnetCombox'),
        $typeCombox:$('#typeCombox'),
        $visTool:$('.toggle-box'),
        $visContainer:$('#visNetwork'),
        $tabsContainer:$('#manor-instance-tabs')
    };
    impls.init = function(){
        impls.utils.initIconStep();
        impls.utils.initTextCombox();
        impls.utils.getPorComboxData();
        impls.utils.getTemplateData();
        impls.utils.nextBtnRouter();
    };
    impls.utils = {
        /**获取选中节点数据*/
        getData:function()
        {
             return impls.viserData;
        },
        getOriginData:function()
        {
            return impls.o.$visContainer.data("vis_org_data");
        },
        getSelectedNodeData:function(selectedNode)
        {
            var data=this.getData();
            if(!data||!data.nodes||!data.nodes.length)
            {
                return false;
            }
            var result=false;
            $(data.nodes).each(function(i,node)
            {
                if(node.id==selectedNode)
                {
                    result=node;
                }
            });
            return result;
        },
        getSelectedNodeDataIndex:function(selectedNode)
        {
            var index=0;
            var data=this.getData();
            if(!data||!data.nodes||!data.nodes.length)
            {
                return index;
            }
            $(data.nodes).each(function(i,node)
            {
                if(node.id==selectedNode)
                {
                    index=i;
                }
            });
            return index;
        },
        getNodeByIndex:function(index)
        {
            var _node=null;
            var data=this.getData();
            if(!data||!data.nodes||!data.nodes.length)
            {
                return false;
            }
            $(data.nodes).each(function(i,node)
            {
                if(i==index)
                {
                    _node=node;
                }
            });
            return _node;
        },
        changeView:function(selectedNode)
        {
            var index=this.getSelectedNodeDataIndex(selectedNode);
            viewstacker.goto(index);
        },
        initViewStacks:function()
        {
            impls.stacks=[];
            var _self=this;
            var data=this.getData();
            impls.o.$tabsContainer.empty();
            var _self=this;
            if(!data||!data.nodes||!data.nodes.length)return;
            $(data.nodes).each(function(i,node)
            {
                var templte=$("<li></li>");
                templte.attr("index",i);
                impls.o.$tabsContainer.append(templte);
            });
            viewstacker=impls.o.$tabsContainer.viewstack(null,{killAutoSelected:true}).change(function(index,stack)
            {
                if(!stack.isInit)
                {
                    _self.renderTabs(stack,_self.getNodeByIndex(index));
                }
            })

        },
        renderTabs:function(stack,node){
            var config=impls.config.tabTypeConfig[node.type||node.id];
            var template=config.temp;
            var jsModule=config.jsModule;
            //$(parentId).empty().show();
            console.log("renderTable");
            $(stack.dom).load(template,function(temp){
                stack.isInit=true;
                require([jsModule],function(ModeClass){
                    var mod=new ModeClass().implement;
                    mod.owner=impls;
                    mod.redraw(node.id,stack.dom);
                    impls.stacks.push(mod);
                    //$.parser.parse(stack.dom);
                });
            });
        },
        getVisData:function(selectedTemp){
            if(selectedTemp == null || selectedTemp == ''){
                return;
            }
            var $obj = impls.o,
                $visContainer = $obj.$visContainer;
            var response = ef.localStorage.get('manor.instance.create');
            var selectedAction = _.find(response,function(temp){
                return temp.name.toLowerCase() == selectedTemp.toLowerCase();
            });
            $visContainer.data('vis_org_data',selectedAction);
            impls.utils.prepareData4Vis();
        },
        prepareData4Vis:function(){
            var $visContainer = impls.o.$visContainer,
                data = {
                    nodes:null,
                    edges:null,
                    params:null
                };
            var orgData = $visContainer.data('vis_org_data');
            if(orgData.action){
                $(orgData.action).each(function(index, action){
                    if(action.type == 'deploy'){
                        var edges = action.stream_module.edges['_data'];
                        data.edges = _.toArray(edges);
                        var nodes = action.stream_module.nodes['_data'];
                        data.nodes = _.toArray(nodes);
                        data.params = ef.util.clone(action.streamlet);
                    }
                });
            }
            $visContainer.data('vis_build_data',data);
            impls.viserData=data;
            this.initViewStacks();

    },
        initVis:function(data){
            var $tool = impls.o.$visTool;
            var _self=this;
            $tool.togglebutton(impls.config.togglebuttonConfig);
            var container = $('#visNetwork');
            var data = {
                nodes: new vis.DataSet(data.nodes),
                edges: new vis.DataSet(data.edges)
            };
            var options = {};
            network = new vis.Network(container[0], data, options);
            network.on('selectNode', function(params) {
                var selectedId = params.nodes[0];
                //impls.utils.getSelectedNodeType(selectedId);
                 _self.changeView(selectedId);
            });
        },
        getSelectedNodeType:function(selectedId){
            var temp = selectedId.split('$'),
                tabTypeConfig = impls.config.tabTypeConfig;
            currentTabTypeConfig = null;
            if(temp.length && temp[0]){
                var type = temp[0];
                if(type in tabTypeConfig){
                    currentTabTypeConfig = tabTypeConfig[type];
                    impls.utils.renderTabs(
                        currentTabTypeConfig.temp,
                        currentTabTypeConfig.jsModule,
                        currentTabTypeConfig.parentId,
                        selectedId);
                }
            }
            console.log('currentTabTypeConfig-----',currentTabTypeConfig);
        },
        initIconStep:function(){
            //impls.o.$step.iconchange(impls.config.iconchangeConfig,1000);
        },
        initTextCombox:function(){
            var config = impls.config,
                object = impls.o;
            $(".instance_name").textbox(
                {
                    width:197,
                    height:30,
                    required:true,
                    maxlength:15,
                    validType: 'whitelist["\u4E00-\u9FA5A-Za-z0-9_-","'+ef.util.getLocale("global.name.invalid.tip")+'"]'
                });
            $(".instance_detail",impls.context).textbox(config.instance_detail).textbox();
            object.$proCombox.combobox(config.proComboxConfig);
            object.$vlanCombox.combobox(config.vlanComboxConfig);
            object.$netCombox.combobox(config.netComboxConfig);
            object.$subnetCombox.combobox(config.subnetComboxConfig);
            object.$typeCombox.combobox(config.typeComboxConfig);
        },
        getVlanData:function(param,callback)
        {
            var url=api.getAPI("network.vlan.datagrid_vlan");
            url=ef.util.url(url,
                {
                    tenant:param
                });
            ef.getJSON(
                {
                    url:url,
                    success:callback|| $.noop
                })
        },
        getComboxData:function(isLocal,comboxId,serverName,data,callback){
            var url  = '';
            var item = {};
            item.url = api.getAPI(serverName);
            item.type = 'get';
            if(data){
                item.data = data;
                //url = api.getAPI(serverName)+"/"+data;
            }
            if(comboxId=="proCombox"&&user.isTenant())
            {
                url="/user/"+user.getId()+"/tenants";
            }
            ef.getJSON(item).success(function(response){
                response=response.result;
                //if(comboxId=="proCombox"&&user.isTenant())
                //{
                //    response=ef.util.filter(response,function(item)
                //    {
                //        var role=user.getRole();
                //        return item.id==role.id;
                //    });
                //}
                //if(comboxId=="proCombox"&&user.isTenant())
                //{
                //    response=ef.util.map(response,function(oit)
                //    {
                //        return oit.tenant;
                //    });
                //}
                if(comboxId=="typeCombox")
                {
                    response=ef.util.filter(response,function(item)
                    {
                        return item.status==1;
                    });
                    response.reverse();
                }
                $('#'+comboxId).combobox({data:response});
                if(callback){
                    callback(response);
                }
            }).error(function(error){
                    console.log(error);
            });
        },
        getPorComboxData:function(){
            var config = impls.utils.getConfig('proCombox');
            impls.utils.getComboxData(isLocal,config.name,config.server);
        },
        getNetComboxData:function(){
            var config = impls.utils.getConfig('netCombox');
            var phyId = impls.o.$vlanCombox.combobox('getValue');
            impls.utils.getComboxData(isLocal,config.name,config.server,{phy_network:phyId});
        },
        getSubnetComboxData:function(){
            var config = impls.utils.getConfig('subnetCombox');
            var netId = impls.o.$netCombox.combobox('getValue');
            var projectId = impls.o.$proCombox.combobox('getValue');
            impls.utils.getComboxData(isLocal,config.name,config.server,{network_id:netId,tenant:projectId});
        },
        getVlanComboxData:function(){
            var config = impls.utils.getConfig('vlanCombox');
            //var projectId = impls.o.$proCombox.combobox('getValue');
            impls.utils.getComboxData(isLocal,config.name,config.server,null, function (res) {
                impls.o.$vlanCombox.combobox("loadData",res);
            });
            //impls.utils.getVlanData(projectId,function(res)
            //{
            //    impls.o.$vlanCombox.combobox("enable");
            //    impls.o.$vlanCombox.combobox("loadData",res);
            //});
        },
        isStepOneValid:function()
        {
            var object = impls.o;
            return $(".instance_name").textbox("isValid")&&object.$proCombox.combobox("isValid")&&object.$vlanCombox.combobox("isValid")&&object.$typeCombox.combobox("isValid");
        },
        getTemplateData:function(){
            var config = impls.utils.getConfig('typeCombox');
            impls.utils.getComboxData(
                isLocal,
                config.name,
                config.server,
                null,function(response){
                    response=ef.util.filter(response,function(item)
                    {
                        return item.status==1;
                    });
                    ef.localStorage.put('manor.instance.create',response);
                });
            impls.onComplte();
        },
        getConfig:function(name){
            var config = impls.config.comboxConfig;
            return _.find(config,function(item){
                return item.name == name;
            });
        },
        nextBtnRouter:function(){
            var _self=this;
            var $obj = impls.o,
                $stack = $obj.$stack,
                $visContainer = $obj.$visContainer;
            var viewstack=$stack.viewstack();
            var route=$(".button-route").buttonstep({length:2}) .change(function(pos){
               if(!impls.utils.isStepOneValid())
               {
                   route.goto(0);
                   ef.placard.warn(ef.util.getLocale("apply.instance.create.firstStep.isValid"));
                   return;
               }
                //$(viewstack.children).each(function(index, child){
                //    if(index == pos){
                //        $(child.dom[0]).show();
                //    }else{
                //        $(child.dom[0]).hide();
                //    }
                //});
                viewstack.goto(pos);
                if(pos == 1){
                    //show frame first and then render vis
                    //the node will show in middle
                    var data = impls.viserData;
                    //default select node

                    var routerConfig = impls.config.tabsRouterConfig;
                    if(data){
                       impls.utils.initVis(data);
                       // if(currentTabTypeConfig == null){
                       //     network.selectNodes(['create_nodes$167013c8-f77c-c7b0-33ed-7924f3291354'],[true]);
                       // }
                       // impls.utils.renderTabs(
                       //     routerConfig.temp,
                       //     routerConfig.jsModule,
                       //     routerConfig.parentId,
                       //'create_nodes$167013c8-f77c-c7b0-33ed-7924f3291354' );
                    }

                }

            }).confirm(function()
            {
                if(!impls.isValid())
                {
                    ef.placard.warn(ef.util.getLocale("apply.template.detail.valid.tip"));
                    return;
                }
                impls.sendData();
            });
        }
    };
    impls.sendData=function()
    {
        var result={

        };
        var data=this.utils.getData();
        $(data.nodes).each(function(i,node)
        {
            if(node.id=="start")return;
            result[node.id]=node[node.id];
        });
        var originData=this.utils.getOriginData();
        var app_name=$(".instance_name").textbox("getValue");
        var param=ef.util.dcopy(result);
        var templateName=originData.name;
        var vlanName=this.o.$vlanCombox.combobox("getValue");
        var netName=this.o.$netCombox.combobox("getValue");
        var subnetName=this.o.$subnetCombox.combobox("getValue");
        var tenantName=this.o.$proCombox.combobox("getValue");
        var app_description=$(".instance_detail",impls.context).textbox("getValue");
        var action=ef.util.filter(originData.action,function(item)
        {
            return item.type=="deploy";
        });
        var actionName=action[0].name;
        for(var i in param)
        {
            var reg=/^create_nodes\$/;
            var item=param[i];
            if(reg.test(i))
            {
                item.params.push(
                    {
                        tenant:tenantName

                    });
                item.params.push(
                    {
                        phynetwork:vlanName

                    });
                item.params.push(
                    {
                        subnet:subnetName

                    });
                item.params.push(
                    {
                        network:netName
                    })
            }

        }

        var _data=
        {
            "app_name":app_name,
            "app_description":app_description,
            "params":param
        };
        var url=api.getAPI("manor.instance.create")+templateName+"/"+actionName;
        ef.loading.show();
        ef.getJSON(
            {
                url:url,
                type:"POST",
                data:_data,
                success:function(response)
                {
                    console.log(response);
                    ef.loading.hide();
                    ef.placard.doing(ef.util.getLocale("apply.instance.create.success"));
                    ef.Dialog.close("addInstance");
                    ef.nav.reload();
                },
                error:function()
                {
                    ef.loading.hide();
                }
            })
    };
    impls.isValid=function()
    {
        return ef.util.every(this.stacks,function(stack)
        {
          return stack.isValid();
        });
    };
    impls.config = {
        tabTypeConfig:{
            start:{
                temp:'views/manor.instance.crate.startType.html',
                jsModule:'manor.instance.crate.start',
                parentId:'#manor-instance-tabs'
            },
            create_nodes:{
                temp:'views/manor.instance.crate.scriptType.html',
                jsModule:'manor.instance.crate.script',
                parentId:'#manor-instance-tabs'
            },
            execute_script:{
                temp:'views/manor.instance.crate.nodeType.html',
                jsModule:'manor.instance.crate.node',
                parentId:'#manor-instance-tabs'
            },
            reboot_node:
            {
                temp:'views/manor.instance.create.rebootType.html',
                jsModule:'manor.instance.create.reboot',
                parentId:'#manor-instance-tabs'
            }
        },
        tabsRouterConfig:{
            temp:'views/manor.instance.crate.scriptType.html',
            jsModule:'manor.instance.crate.script',
            parentId:'#manor-instance-tabs'
        },
        instance_detail:{
            multiline:true
        },
        iconchangeConfig:[{
            text: ef.util.getLocale('host.addhost.dialog.iconstep.info.text'),
            iconClass: "step-change-info",
            iconAllClass: "step-change-all-info",
            iconSelectedClass: "step-change-all-info-select",
            selected: true
        }],
        togglebuttonConfig:[
            [{
                id:"3",
                iconClass: "icon-templates-left-auto",
                tip: ef.util.getLocale("apply.template.create.auto"),
                click:function(){
                    if(network)
                    {
                        network.fit();
                    }
                }
            }]
        ],
        proComboxConfig:{
            width:197,
            height:30,
            textField:"name",
            valueField:"id",
            required:true,
            data:[],
            onSelect: function(newValue, oldValue){
                impls.o.$vlanCombox.combobox({disabled:false,width:202});
                impls.o.$netCombox.combobox('clear');
                impls.o.$subnetCombox.combobox('clear');
                impls.utils.getVlanComboxData();
            },
            filter: function(p, row){
                if(p == ""){
                    return true
                }
                var opts = $(this).combobox('options');
                return row[opts.textField].toLowerCase().indexOf(p) !== -1;
            },
            onHidePanel: function(){
                var opt = $(this).combobox('options');
                var data = opt.data;
                var val = $(this).combobox('getText');
                var index = _.findKey(data, function (item) {
                    return item.name == val
                });
                if(!index){
                    $(this).combobox('setValue', '');
                }
                if($(this).combobox('getValue') == '')$('#vlanCombox').combobox({disabled: true})
            }
        },
        vlanComboxConfig:{
            width:197,
            height:30,
            valueField:'name',
            textField:'name',
            editable:false,
            required:true,
            disabled:true,
            data:[],
            onChange: function (newVlaue) {
                impls.o.$netCombox.combobox('reset').combobox({disabled:false,width:197});
                impls.utils.getNetComboxData();
            }
        },
        netComboxConfig:{
            width:190,
            height:30,
            valueField:'id',
            textField:'name',
            editable:false,
            disabled:true,
            required:true,
            data:[],
            onChange: function (newVlaue) {
                impls.o.$subnetCombox.combobox('reset').combobox({disabled:false,width:202});
                impls.utils.getSubnetComboxData();
            }
        },
        subnetComboxConfig:{
            width:197,
            height:30,
            valueField:'id',
            textField:'name',
            editable:false,
            required:true,
            disabled:true,
            data:[]
        },
        typeComboxConfig:{
            width:197,
            height:30,
            valueField:'name',
            textField:'name',
            required:true,
            editable:false,
            data:[],
            formatter:function(row)
            {
                return row.name+"("+row.label+")";
            },
            onChange:function(newValue, oldValue){
                if(newValue == oldValue || newValue == ''){
                    return;
                }
                impls.utils.getVisData(newValue);
            }
        },
        comboxConfig:[{
            name:'proCombox',
            server:'manorProList'
        },{
            name:'vlanCombox',
            server:'phynetworks'
        },{
            name:'netCombox',
            server:'network.vlan.datagrid_vlan'
        },{
            name:'subnetCombox',
            server:'subnets'
        },{
            name:'typeCombox',
            server:'manorTempList'
        }]
    };
    impls.getCPUMemo=function(success)
    {
        settingParam.getList(true,function(list)
        {
            var cpuRange=ef.util.find(list,function(record)
            {
                return record.name=="compute.cpu_range";
            }).value;
            var memRange=ef.util.find(list,function(record)
            {
                return record.name=="compute.memory_range";
            }).value;
            success?success(String(cpuRange).split("/"),String(memRange).split("/")):null;
        });
    };
    impls.getImages=function(success,error)
    {
        ef.getJSON({
            url: api.getAPI("order.wait.Detail.combo.image"),
            type: "get",
            success: function (response) {
                var resData = [];
                $(response).each(function (i, il) {
                    if (il.status == "active" && il.type == 1) {
                        resData.push(il);
                    }
                });
                success ? success(resData) : null
            },
            error: error || $.noop
        });
    };
    return impls;
});

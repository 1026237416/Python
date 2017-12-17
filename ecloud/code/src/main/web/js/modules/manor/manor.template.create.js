/**
 * Created by wangahui1 on 16/5/9.
 */
define("manor.template.create",["domReady","module","codemirror","xml","active-line","shell","vis","api","show-hint","anyword-hint","python","shell-hint","python-hint","manor.template.create.flow.param.five"],function(domReady,module,CodeMirror,xml,activeLine,shell,vis,api,showHint,python,shellHint,pythonHint,paramFive)
{
    var TemplateCreate=function()
    {
        var editor,editorType,editorReturn,rebootContent,executeContent,createContent,deleteContent,startsContent,stopContent,chooseCode,_toggle;
        var implement=new ef.Interface.implement();
        var nodeType;//选中节点类型
        var tabReboot,tabCreate,tabScript,tabDelete,tabStart,tabStop;//选项卡
        var network;//vis图生成对象
        var templateNodesId;//选中节点ID
        var nodes;//nodes节点（dataSet数据）
        var edges;//edges关系边（dataSet数据）
        var edgesObj;//当前所有节点关系（包括from，to，id，arrows）
        var postDataAll;//新建模板post的所有数据
        var simpleVisData;//单页数据
        var script_type="shell";
        var scriptGroup=null;
        var scriptGroupName="";
        implement.chooseGroup_name = null;//组名称的checkbox对象
        implement.chooseCount = null;//数量的checkbox对象
        implement.chooseLimit = null;//最小节点数量的checkbox对象
        implement.chooseMax=null;
        implement.chooseCpu = null;//cpu的checkbox对象
        implement.chooseMemo = null;//内存的checkbox对象
        implement.chooseImage = null;//镜像的checkbox对象
        implement.chooseDisk = null;//硬盘大小的checkbox对象
        implement.paramsData = null;//脚本参数对象
        implement.cpu = null;
        implement.memory = null;
        implement.rebootChoose = null;
        implement.rebootNameChoose = null;
        implement.deleteChoose=null;
        implement.deleteNameChoose=null;
        implement.startChoose=null;
        implement.startNameChoose=null;
        implement.stopChoose=null;
        implement.stopNameChoose=null;
        implement.isMange=false;//是否是管理流程
        implement.type="flow.create";
        implement.flowName="";
        implement.flowType="";
        implement.owner=null;
        implement.isInstall=true;
        implement.group_names=[];
        var complete= $.noop;
        var oldData=null;
        var simpleData;
        implement.getGroupNames=function(isCurrent)
        {
            var reg=/^create_nodes/;
            if(!network)
            {
                return this.group_names;
            }else
            {
                if(this.getSimpleData()){
                    simpleData=this.getSimpleData();
                }else{ef.placard.hide();}
                var obj=simpleData.streamlet;
                var arrs=[];
                for(var i in obj)
                {
                    if(!isCurrent&&i==templateNodesId)
                    {
                        continue;
                    }
                    if(reg.test(i))
                    {
                        var param=obj[i].params[0];
                        arrs.push(param.group_name);
                    }
                }
                return arrs;
            }
        };
        /**是否名称冲突*/
        implement.isClash=function(groupName)
        {
            return ef.util.find(this.getGroupNames(),function(item)
            {
                return item==groupName;
            });
        };
        implement.redraw=function(cover,context,networkData,fn,isInstall)
        {
            if(this.owner&&this.owner.owner)
            {
                implement.group_names=implement.owner.owner.getGroupNames();
            }
            ef.event.on("manor.group.change",function(event,data)
            {
                var arrs=data.owner.getFlows();
                var result=[];
                $(arrs).each(function(i,il)
                {
                    if(il.isInstall)
                    {
                        result=il.getGroupNames(true);
                    }
                });
                implement.group_names=result;
            });

            if(arguments.length>2)
            {
                this.isMange=true;
                this.isInstall=Boolean(isInstall);
            }
            this.context=$(context||document.body);
            $(".tab-box-nodes-parent",this.context).hide();
            $(".tab-box-script-parent",this.context).hide();
            $(".tab-box-reboot-parent",this.context).hide();
            this.init();
            this.create();
            if(cover){cover.hide();implement.cover = cover;}
            $(".viewstack-box-dlg",implement.context).show();
            if(networkData)
            {
                implement.group_names=ef.util.uniq(networkData.group_names);
                networkData=networkData.data;
            }
            if(networkData)
            {
                implement.flowName=networkData.name;
                implement.flowType=networkData.type;
            }
            if(networkData&&networkData.stream_module){
                network = {body:{data:{nodes:{},edges:{}}}};
                network.body.data.nodes = networkData.stream_module.nodes;
                network.body.data.edges = networkData.stream_module.edges;
                oldData={body:{data:(ef.util.copyDeepProperty(networkData)).stream_module}};
            }
            if(fn)
            {
                complete=fn;
            }
        };
        implement.frontStepCheck = null;//前置步骤生成对象
        implement.frontStepCheckData = [];//前置步骤数据
        implement.disable=false;
        //显示隐藏的实现
        implement.tabThree=function()
        {
            if(this.isInstall)
            {
                $(".code_mirror_indi_checkbox",implement.context).show();
            }
            chooseCode = $(".code_mirror_indi_checkbox",implement.context).checkinfo({
                labelField:"label",
                valueField:"value",
                disabled:implement.disable,
                dataProvider:[
                    {label:ef.util.getLocale("apply.template.checkbox.data.hide"),value:"hide"}
                    //,
                    //{label:ef.util.getLocale("apply.template.checkbox.data.readOnly"),value:"readOnly"}
                ]
            });
        };
        //过滤可用前置节点
        implement.filterNodes = function (self_id) {
            implement.frontStepCheck.clear();
            var exclude = ['start', self_id];
            function calculate_parent(id) {
                _.each(edges._data, function (e) {
                    if (e.to == id) {
                        exclude.push(e.from);
                        calculate_parent(e.from);
                    }
                })
            }
            function calculate_children(id) {
                _.each(edges._data, function (e) {
                    if (e.from == id) {
                        exclude.push(e.to);
                        calculate_children(e.to);
                        calculate_parent(e.to);
                    }
                })
            }
            calculate_parent(self_id);
            calculate_children(self_id);
            var nodesIds = ef.util.dcopy(nodes._data);
            var nodesInfo = [];
            for(var i in nodesIds){
                ef.util.filter(exclude, function (data) {
                    if(data==i){
                        delete nodesIds[i];
                    }
                })
            }
            for(var i in nodesIds){
                var item = {label:"",value:""};
                item.label = nodesIds[i].label;
                item.value = nodesIds[i].value;
                nodesInfo.push(item);
            }
            implement.frontStepCheck.add(nodesInfo);
            return nodesInfo;
        };
        //初始化，包括对buttonstep和tabs
        implement.init=function()
        {
            //$(".host-step-cont",implement.context).iconchange(
            //    [
            //        {
            //            text: ef.util.getLocale('host.addhost.dialog.iconstep.info.text'),//"基本信息",
            //            iconClass: "step-change-info",
            //            iconAllClass: "step-change-all-info",
            //            iconSelectedClass: "step-change-all-info-select",
            //            selected: true
            //        }
            //    ],1000);
            $(implement.context).find(".template_name").textbox({
                required:true,
                maxlength:15,
                validType: 'whitelist["\u4E00-\u9FA5A-Za-z0-9_-","数字,字母,中文,中划线和下划线"]'
            });
            $(implement.context).find(".template_detail").textbox(
                {
                    multiline:true
                });
            var titles=["apply.template.create.title","apply.template.install.flow.title"];
            var viewstack=$(".viewstack-box-dlg",implement.context).viewstack();
            implement.viewstack=viewstack;
            var posCheck=0;
            implement.buttonStep=$(".button-route",implement.context).buttonstep({length:2}).change(function(pos)
            {
                var dialog=ef.Dialog.getDialog("addManorTemplateDialog");
                if(dialog)
                {
                    dialog.setTitle(ef.util.getLocale(titles[pos]));
                }
                viewstack.goto(pos);
                if(pos==0){
                    if(implement.visData(templateNodesId,nodeType)==false){
                        implement.buttonStep.goto(1);
                        viewstack.goto(1);
                        if(dialog)
                        {
                            dialog.setTitle(ef.util.getLocale(titles[1]));
                        }
                        return;
                    }
                    implement.visData(templateNodesId,nodeType);
                }
                if(pos==1)
                {
                    if(implement.cover&&implement.context&&!implement.isMange){
                        if($(".template_name",implement.context).textbox()){
                            if(!$(".template_name",implement.context).textbox('isValid')){
                                implement.buttonStep.goto(0);
                                viewstack.goto(0);
                                if(dialog)
                                {
                                    dialog.setTitle(ef.util.getLocale(titles[0]));
                                }
                                return;
                            }
                        }
                    }
                    if(posCheck==0){
                        rebootContent = $(".tab-box-reboot",implement.context).clone();
                        executeContent = $(".tab-box-script",implement.context).clone();
                        createContent = $(".tab-box-nodes",implement.context).clone();
                        stopContent=$(".tab-box-stop",implement.context).clone();
                        deleteContent=$(".tab-box-delete",implement.context).clone();
                        startsContent=$(".tab-box-start",implement.context).clone();
                        stopContent=$(".tab-box-stop",implement.context).clone();
                    }
                    posCheck=1;
                    implement.visJs();
                    implement.visData();
                    complete();
                }
            });
        };
        //单页数据的处理
        implement.getSimpleData = function (isCross) {
            var bool=implement.visData(templateNodesId,nodeType);
            if((bool==false&&isCross))
            {
                ef.placard.warn(ef.util.getLocale("apply.template.param.input.empty"));
                return false;
            }
            if(bool=="limit")
            {
                ef.placard.warn(ef.util.getLocale("apply.template.amount.little.limit"));
                return false;
            }
            if(bool=="max")
            {
                ef.placard.warn(ef.util.getLocale("apply.template.amount.little.max"));
                return false;
            }
            var paramObj = [],streamlet = {};
            for(var i in network.body.data.nodes._data){
                if(i!="start"){
                    var type = i.substring(0,i.indexOf("$"));
                }
                if(network.body.data.nodes._data[i][i]){
                    streamlet[''+i] = network.body.data.nodes._data[i][i];
                }
            }
            simpleVisData = {
                "name": implement.flowName,    //流程的name后台生成
                "type": implement.flowType||"deploy",
                "stream_module": {
                    "nodes": {_data:""},
                    "edges": {_data:""}
                },
                "streamlet": {

                }
            };
            simpleVisData.stream_module.nodes._data = network.body.data.nodes._data;
            simpleVisData.stream_module.edges._data = network.body.data.edges._data;
            simpleVisData.streamlet = streamlet;
            if(implement.isMange&&!implement.isInstall)
            {
                return implement.owner.getData(simpleVisData);
            }
            return simpleVisData;
        };
        //点击完成时需要给服务端发送的数据的处理
        implement.postData = function (desData) {
            postDataAll = {
                "action": [],
                "description": "",
                "name": "",
                "label":"",
                "status": 0,//offline状态
                "group_names":[]
            };
            postDataAll.action.push(implement.getSimpleData());
            postDataAll.description = desData.des;
            postDataAll.label = desData.label;
            postDataAll.group_names = ef.util.uniq(desData.group_name);
            return postDataAll;
        };
        //根据选中值判断只读和隐藏
        implement.chooseValue = function (dom,isSepc) {
            var choose = {hide:false,readOnly:false};
            if(!dom)return;
            dom.select(function (data) {
                $(data).each(function (i,il) {
                    var val = il.value;
                    if(isSepc)
                    {
                        console.log();
                    }
                    if(val=="hide"){choose.hide=true;}
                    if(val=="readOnly"){choose.readOnly=true;}
                });
                if(data.length==0){choose.hide=false;choose.readOnly=false;}
            });
            return choose;
        };
        //vis失去焦点时的数据保存
        implement.deselectVis = function () {
            network.on('deselectNode', function (params) {
                var id = params.previousSelection.nodes[0];
                var type = id.substring(0,id.indexOf("$"));
                implement.visData(id,type);
            });
        };
        //vis的数据处理（组名称等信息的填充）
        implement.visData = function (id,type) {
            if(!id||!type){return true;}
            var obj;
            if(type=="create_nodes"){
                if(this.isMange&&!this.isInstall)
                {
                    obj={
                        params:[
                            {

                            }]
                    };
                    network.body.data.nodes._data[id][id] = obj;
                    console.log("376",network.body.data.nodes._data[id][id]);
                    return true;
                };
                var group_name = $("#paramGroupName",implement.context).textbox('getValue');
                var amount = $("#paramGroupCount",implement.context).textbox('getValue');
                var limit = $("#paramNodeCount",implement.context).textbox('getValue');
                var max=$("#paramMaxCount",implement.context).textbox('getValue');
                var cores = implement.cpu.select();
                var memory = implement.memory.select();
                var image = $("#paramImage",implement.context).combobox('getValue');
                var disk_capacity = $("#paramDisk",implement.context).textbox('getValue');
                obj = {
                    params:[
                        {group_name:group_name,streamlet_params_properties_hide:implement.chooseValue(implement.chooseGroup_name).hide,streamlet_params_properties_read_only:implement.chooseValue(implement.chooseGroup_name).readOnly},
                        {amount:amount,streamlet_params_properties_hide:implement.chooseValue(implement.chooseCount).hide,streamlet_params_properties_read_only:implement.chooseValue(implement.chooseCount).readOnly},
                        {limit:limit,streamlet_params_properties_hide:implement.chooseValue(implement.chooseLimit).hide,streamlet_params_properties_read_only:implement.chooseValue(implement.chooseLimit).readOnly},
                        {cores:cores,streamlet_params_properties_hide:implement.chooseValue(implement.chooseCpu).hide,streamlet_params_properties_read_only:implement.chooseValue(implement.chooseCpu).readOnly},
                        {memory:memory,streamlet_params_properties_hide:implement.chooseValue(implement.chooseMemo).hide,streamlet_params_properties_read_only:implement.chooseValue(implement.chooseMemo).readOnly},
                        {disk_capacity:disk_capacity,streamlet_params_properties_hide:implement.chooseValue(implement.chooseDisk).hide,streamlet_params_properties_read_only:implement.chooseValue(implement.chooseDisk).readOnly},
                        {image:image,streamlet_params_properties_hide:implement.chooseValue(implement.chooseImage).hide,streamlet_params_properties_read_only:implement.chooseValue(implement.chooseImage).readOnly},
                        {
                            max:max,streamlet_params_properties_hide:implement.chooseValue(implement.chooseMax).hide,streamlet_params_properties_read_only:implement.chooseValue(implement.chooseMax).readOnly
                        }]
                    };
                network.body.data.nodes._data[id][id] = obj;
                if(Number(amount)==0||Number(limit)==0||Number(max)==0){return false;}
                if(Number(amount)!=0&&Number(limit)!=0&&Number(amount)<Number(limit)){ef.placard.warn(ef.util.getLocale("apply.template.amount.little.limit"));return "limit";}
                if(Number(amount)!=0&&Number(max)!=0&&(Number(amount)>Number(max)))
                {
                    ef.placard.warn(ef.util.getLocale("apply.template.amount.little.max"));return "max";
                }
                if(!cores){return false;}
                if(!memory){return false;}
                if(!$("#paramGroupName",implement.context).textbox('isValid')||!$("#paramGroupCount",implement.context).numberspinner('isValid')||!$("#paramNodeCount",implement.context).numberspinner('isValid')||!$("#paramImage",implement.context).combobox('isValid')||!$("#paramDisk",implement.context).numberspinner('isValid')){return false;}
            }
            if(type=="reboot_node")
            {
                var rebootGroupName = $("#paramGroupNameReboot",implement.context).textbox('getValue');
                var rebootNodeTarget = $("#paramApp",implement.context).combobox('getValue');
                if(rebootNodeTarget=="group"){
                    if(!$("#paramGroupNameReboot",implement.context).textbox('isValid')){return false;}
                }
                obj = {
                    params:[
                        {group_name:rebootGroupName,streamlet_params_properties_hide:implement.chooseValue(implement.rebootNameChoose,true).hide,streamlet_params_properties_read_only:implement.chooseValue(implement.rebootNameChoose,true).readOnly},
                        {reboot_node_target:rebootNodeTarget,streamlet_params_properties_hide:implement.chooseValue(implement.rebootChoose).hide,streamlet_params_properties_read_only:implement.chooseValue(implement.rebootChoose).readOnly}
                    ]};
                console.log(implement.chooseValue(implement.rebootNameChoose).hide,implement.rebootNameChoose);
                network.body.data.nodes._data[id][id] = obj;
                if(!$("#paramApp",implement.context).combobox('isValid')){return false;}
            }
            if(type=="execute_script"){
                var editorValue = "";
                if(editor){
                    editorValue = editor.getValue();
                }
                obj = {
                    params:[
                        {
                            group_name:scriptGroupName
                        },
                        {
                            script_params:[

                            ]
                        },
                        {
                            execute_script_content:editorValue
                        },
                        {
                            streamlet_params_properties_hide:implement.chooseValue(chooseCode)?implement.chooseValue(chooseCode).hide:false,
                            streamlet_params_properties_read_only:false,
                            script_type:script_type
                        },
                        {
                            info_return:false
                        }

                    ]};
                if(!implement.isInstall&&implement.isMange)
                {
                    obj.params[4]={
                        info_return:editorReturn.checked
                    }
                }
                if(implement.paramsData!=null){
                    obj.params[1].script_params = implement.paramsData.getAllData();
                }
                network.body.data.nodes._data[id][id] = obj;
                //if(implement.)
                if(implement.isMange&&!implement.isInstall)
                {
                    if(scriptGroupName==""&&!implement.disable){return false;}
                }
                if(editorValue==""){return false;}
            }
            if(type=="delete_node")
            {

                obj = {
                    params:[
                        {

                        }
                    ]};
                network.body.data.nodes._data[id][id] = obj;
            }
            if(type=="start_node")
            {
                var startGroupName = $("#paramGroupNameStart",implement.context).combobox('getValue');
                if(!$("#paramGroupNameStart",implement.context).textbox('isValid')){return false;}
                obj = {
                    params:[
                        {group_name:startGroupName,streamlet_params_properties_hide:implement.chooseValue(implement.chooseGroup_name).hide,streamlet_params_properties_read_only:implement.chooseValue(implement.chooseGroup_name).readOnly}
                    ]};
                network.body.data.nodes._data[id][id] = obj;
            }
            if(type=="stop_node")
            {
                var stopGroupName = $("#paramGroupNameStop",implement.context).combobox('getValue');
                if(!$("#paramGroupNameStop",implement.context).textbox('isValid')){return false;}
                obj = {
                    params:[
                        {group_name:stopGroupName,streamlet_params_properties_hide:implement.chooseValue(implement.chooseGroup_name).hide,streamlet_params_properties_read_only:implement.chooseValue(implement.chooseGroup_name).readOnly}
                    ]};
                network.body.data.nodes._data[id][id] = obj;
            }
            return true;
        };
        //根据不同节点类型对选项卡显示隐藏的控制
        implement.rebootNeedContent = function () {
            return rebootContent.clone();
        };
        implement.createNeedContent = function () {
            return createContent.clone();
        };
        implement.executeNeedContent = function () {
            return executeContent.clone();
        };
        implement.deleteNeedContent=function()
        {
            return deleteContent.clone();
        };
        implement.startNeedContent=function()
        {
            return startsContent.clone();
        };
        implement.stopNeedContent=function()
        {
            return stopContent.clone();
        };
        implement.tabControll = function (type) {
            $(".tooltip").hide();
            switch(type)
            {
                case "reboot_node":
                    $(".tab-box-nodes-parent",implement.context).hide();
                    $(".tab-box-script-parent",implement.context).hide();
                    $(".tab-box-delete-parent",implement.context).hide();
                    $(".tab-box-start-parent",implement.context).hide();
                    $(".tab-box-stop-parent",implement.context).hide();
                    $(".tab-box-reboot-parent",implement.context).show();
                    $(".noContent-parent",implement.context).hide();
                    $(".tab-box-reboot-parent",implement.context).empty();
                    $(".tab-box-reboot-parent",implement.context).append(implement.rebootNeedContent());
                    tabReboot = $(".tab-box-reboot-parent .tab-box-reboot",implement.context).tabs(
                        {
                            selected:1,
                            onSelect:function(title,index)
                            {
                                var currentTab=$(this).tabs('getSelected');
                                switch(index)
                                {
                                    case 0:
                                    {
                                        implement.visData(templateNodesId,nodeType);
                                        break;
                                    }
                                    case 1:
                                    {
                                        $(this).tabs("update",{
                                            tab:currentTab,
                                            options:
                                            {
                                                href: _.url("./views/manorTemplateFlowParamThree.html"),
                                                cache:false
                                            }
                                        });
                                        break;
                                    }
                                }
                            },
                            onLoad:function(panel) {
                                var index = $(panel).panel("options").index;
                                switch(index)
                                {
                                    case 0:
                                    {
                                        break;
                                    }
                                    case 1:
                                    {
                                        ef.i18n.parse($(".flow_param",implement.context));
                                        require(["manor.template.create.flow.param.three"],function(module)
                                        {
                                            var param = {data:network,id:templateNodesId,type:nodeType};
                                            module.redraw(param,implement,implement.context);
                                            implement.rebootChoose = module.rebootChoose;
                                            implement.rebootNameChoose = module.rebootNameChoose;
                                        });
                                        break;
                                    }
                                }
                            }
                        });
                    break;
                case "create_nodes":
                    if(!implement.isInstall&&implement.isMange)
                    {
                        $(".noContent-parent",implement.context).show();
                        $(".noContent-parent .noContent",implement.context).show();
                    }else
                    {
                        $(".tab-box-nodes-parent",implement.context).show();
                        $(".noContent-parent",implement.context).hide();
                        $(".noContent-parent .noContent",implement.context).hide();
                    }

                    $(".tab-box-script-parent",implement.context).hide();
                    $(".tab-box-reboot-parent",implement.context).hide();
                    $(".tab-box-delete-parent",implement.context).hide();
                    $(".tab-box-start-parent",implement.context).hide();
                    $(".tab-box-stop-parent",implement.context).hide();

                    $(".tab-box-nodes-parent",implement.context).empty();
                    $(".tab-box-nodes-parent",implement.context).append(implement.createNeedContent());
                    tabCreate = $(".tab-box-nodes",implement.context).tabs(
                        {
                            selected:1,
                            onSelect:function(title,index)
                            {
                                var currentTab=$(this).tabs('getSelected');
                                switch(index)
                                {
                                    case 0:
                                    {
                                        implement.tabFront();
                                        if(implement.visData(templateNodesId,nodeType)==false||implement.visData(templateNodesId,nodeType)=="limit"||implement.visData(templateNodesId,nodeType)=="max"){
                                            tabCreate.tabs('select',1);
                                            break;
                                        }
                                        implement.visData(templateNodesId,nodeType);
                                        break;
                                    }
                                    case 1:
                                    {
                                        $(this).tabs("update",{
                                            tab:currentTab,
                                            options:
                                            {
                                                href: _.url("./views/manorTemplateFlowParamTwo.html"),
                                                cache:false
                                            }
                                        });

                                        break;
                                    }
                                }
                            },
                            onLoad:function(panel) {
                                var index = $(panel).panel("options").index;
                                switch(index)
                                {
                                    case 0:
                                    {
                                        break;
                                    }
                                    case 1:
                                    {
                                        ef.i18n.parse($(".flow_param",implement.context));
                                        require(["manor.template.create.flow.param.two"],function(module)
                                        {
                                            var param = {data:network,id:templateNodesId,type:nodeType};
                                            module.redraw(param,implement,implement.context);
                                            module.setCallback(function()
                                            {
                                                implement.chooseGroup_name = module.nameChoose;
                                                implement.chooseCount = module.countChoose;
                                                implement.chooseCpu = module.cpuChoose;
                                                implement.chooseMemo = module.memoChoose;
                                                implement.chooseImage = module.imageChoose;
                                                implement.chooseLimit = module.limitChoose;
                                                implement.chooseMax=module.maxChoose;
                                                implement.chooseDisk = module.diskChoose;
                                                implement.cpu = module.param_cpu_active;
                                                implement.memory = module.param_memo_active;
                                            });

                                        });
                                        break;
                                    }
                                }
                            }
                        });
                    break;
                case "execute_script":
                    $(".noContent-parent",implement.context).hide();
                    $(".tab-box-nodes-parent",implement.context).hide();
                    $(".tab-box-script-parent",implement.context).show();
                    $(".tab-box-reboot-parent",implement.context).hide();
                    $(".tab-box-delete-parent",implement.context).hide();
                    $(".tab-box-start-parent",implement.context).hide();
                    $(".tab-box-stop-parent",implement.context).hide();
                    editor = undefined;
                    editorType=undefined;
                    editorReturn=undefined;
                    $(".tab-box-script-parent",implement.context).empty();
                    $(".tab-box-script-parent",implement.context).append(implement.executeNeedContent());
                    tabScript = $(".tab-box-script",implement.context).tabs(
                        {
                            selected:1,
                            onSelect:function(title,index)
                            {
                                var currentTab=$(this).tabs('getSelected');
                                switch(index)
                                {
                                    case 0:
                                    {
                                        if(implement.visData(templateNodesId,nodeType)==false||implement.visData(templateNodesId,nodeType)=="limit"||implement.visData(templateNodesId,nodeType)=="max"){
                                            tabScript.tabs('select',1);
                                            break;
                                        }
                                        break;
                                    }
                                    case 2:
                                    {
                                        if(implement.visData(templateNodesId,nodeType)==false||implement.visData(templateNodesId,nodeType)=="limit"||implement.visData(templateNodesId,nodeType)=="max"){
                                            tabScript.tabs('select',1);
                                            break;
                                        }
                                        $(this).tabs("update",{
                                            tab:currentTab,
                                            options:
                                            {
                                                href: _.url("./views/manorTemplateFlowParam.html"),
                                                cache:false
                                            }
                                        });
                                        break;
                                    }
                                    case 1:
                                    {
                                        implement.tabThree();
                                        var exData = network.body.data.nodes._data[templateNodesId];
                                        if(exData[templateNodesId]){
                                            if(exData[templateNodesId].params[3].streamlet_params_properties_hide==true){
                                                chooseCode.setSelect("hide");
                                            }
                                            if(exData[templateNodesId].params[3].streamlet_params_properties_read_only==true){
                                                chooseCode.setSelect("readOnly");
                                            }
                                        }
                                        $(".code_mirror_box",implement.context).show();

                                        if(implement.isInstall)
                                        {
                                            $(".code_mirror_indi_group",implement.context).hide();

                                        }
                                        function createGrouper()
                                        {
                                            var scriptGroupDatas=[];
                                            if(implement.owner&&implement.owner.owner)
                                            {
                                                implement.group_names=implement.owner.owner.getGroupNames();
                                            }
                                            $(implement.group_names).each(function(i,it){
                                                scriptGroupDatas.push(
                                                    {
                                                        label:it,
                                                        value:it
                                                    });
                                            });
                                            scriptGroup=$(".script_group_select",implement.context).combobox(
                                                {
                                                    textField:"label",
                                                    valueField:"value",
                                                    width:115,
                                                    height:30,
                                                    editable:false,
                                                    multiple:true,
                                                    disabled:implement.disable,
                                                    data:scriptGroupDatas,
                                                    formatter: function (row) {
                                                        var opts = $(this).combobox('options');
                                                        var dom='<div class="combo-check"><span><input type="checkbox" class="combobox-checkbox"></span>' +"<span>"+ row[opts.textField]+"</span></div>";
                                                        return dom;
                                                    },
                                                    onLoadSuccess: function () {
                                                        //var opts = $(this).combobox('options');
                                                        //var target = this;
                                                        //var values = $(target).combobox('getValues');
                                                        //$(values).each(function(i,value)
                                                        //{
                                                        //    var el = opts.finder.getEl(target, value);
                                                        //    el.find('input.combobox-checkbox').attr('checked', "checked");
                                                        //    console.log(el,el.parent(),opts.finder);
                                                        //});

                                                        //$.map(values, function (value) {
                                                        //    var el = opts.finder.getEl(target, value);
                                                        //    el.find('input.combobox-checkbox')._propAttr('checked', true);
                                                        //})
                                                    },
                                                    onSelect: function (row) {
                                                        var opts = $(this).combobox('options');
                                                        var el = opts.finder.getEl(this, row[opts.valueField]);
                                                        el.find("input.combobox-checkbox")._propAttr('checked', true);
                                                        el.find("input.combobox-checkbox").attr('checked',"checked");

                                                    },
                                                    onChange:function(newValue,oldValue)
                                                    {
                                                        var opts = $(this).combobox('options');
                                                        var target = this;
                                                        var values = $(target).combobox('getValues');
                                                        values=ef.util.filter(values,function(item)
                                                        {
                                                            return item!="";
                                                        });
                                                        $(values).each(function(i,value)
                                                        {
                                                            var el = opts.finder.getEl(target, value);
                                                            var parents=el.parent().parent();
                                                            parents.find(".combobox-item").each(function()
                                                            {
                                                                if($(this).hasClass("combobox-item-selected"))
                                                                {
                                                                    $(this).find("input.combobox-checkbox")._propAttr('checked', true);
                                                                    $(this).find("input.combobox-checkbox").attr('checked',"checked");
                                                                }else
                                                                {
                                                                    $(this).find("input.combobox-checkbox").removeAttr('checked');
                                                                    $(this).find("input.combobox-checkbox")._propAttr('checked', false);
                                                                }
                                                            });
                                                        });
                                                        scriptGroupName=values.join(",");
                                                        //$(values).each(function(i,value)
                                                        //{
                                                        //    var el = opts.finder.getEl(target, value);
                                                        //    el.find('input.combobox-checkbox').attr('checked', "checked");
                                                        //    if(el.parent().hasClass("combobox-item-selected"))
                                                        //});
                                                    },
                                                    onUnselect: function (row) {
                                                        var opts = $(this).combobox('options');
                                                        var el = opts.finder.getEl(this, row[opts.valueField]);
                                                        el.find("input.combobox-checkbox").removeAttr('checked');
                                                        el.find("input.combobox-checkbox")._propAttr('checked', false);
                                                    }
                                                }
                                            );
                                        }
                                        createGrouper();
                                        ef.event.on("manor.group.change",function(event,data)
                                        {
                                            var arrs=data.owner.getFlows();
                                            var result=[];
                                            $(arrs).each(function(i,il)
                                            {
                                                if(il.isInstall)
                                                {
                                                    result=il.getGroupNames(true);
                                                }
                                            });
                                            implement.group_names=result;
                                            createGrouper();

                                            $(".script_group_select",implement.context).combobox("setValues",[]);
                                        });
                                        if(!implement.isInstall&&implement.isMange)
                                        {
                                            editorReturn=$(".toggle_info_return",implement.context).switch(
                                                {
                                                    checked:false,
                                                    disabled:false,
                                                    onTip:"有返回值",
                                                    offTip:"无返回值",
                                                    onLabel:"开",
                                                    offLabel:"关"
                                                });
                                            editorReturn.setDisable(implement.disable);
                                        }
                                        editorType=$(".script_type_select",implement.context).combobox(
                                            {
                                                textField:"label",
                                                valueField:"value",
                                                width:115,
                                                height:30,
                                                editable:false,
                                                disabled:implement.disable,
                                                data:[
                                                    {
                                                        label:"shell",
                                                        value:"shell"
                                                    },
                                                    {
                                                        label:"python",
                                                        value:"python"
                                                    }
                                                ],
                                                onChange:function(newValue,oldValue)
                                                {
                                                    var lastValue;
                                                    if(editor)
                                                    {
                                                        lastValue=editor.getValue();
                                                    }
                                                    CodeMirror.commands.autocomplete = function(cm) {
                                                        cm.showHint({hint:CodeMirror.hint[newValue]});
                                                    };
                                                    $(".code_mirror_box #code",implement.context).siblings().remove();
                                                    editor=CodeMirror.fromTextArea($(".code_mirror_box #code",implement.context).get(0), {
                                                        mode: newValue,
                                                        lineNumbers: true,
                                                        lineWrapping: true,
                                                        readOnly:implement.disable?"nocursor":false,
                                                        extraKeys: {"Ctrl-/": "autocomplete"}
                                                    });
                                                    editor.setSize("100%",380);
                                                    var tool= $(".code_mirror_box",implement.context).tooltip({
                                                        content:"请按ctrl+/自动提示",position:"left"
                                                    }).tooltip("hide");

                                                    function moveTool(tmpY)
                                                    {
                                                        //var _top=$(".code_mirror_box .CodeMirror-wrap",implement.context).find(">div").css("top");
                                                        //_top=_top.replace("px","");
                                                        //var y=Number($(".code_mirror_box").offset().top)+Number(_top)-$(".right-entity").scrollTop();
                                                        //setTimeout(function()
                                                        //{
                                                        //    $(".tooltip").css({
                                                        //        top:(tmpY||y)-10
                                                        //    })
                                                        //},100);

                                                    }
                                                    editor.on("focus",function()
                                                    {
                                                        if(implement.disable)
                                                        {
                                                            $(".code_mirror_box",implement.context).tooltip("hide");
                                                            return;
                                                        }
                                                        $(".code_mirror_box",implement.context).tooltip("show");
                                                        moveTool();
                                                    });
                                                    editor.on("change",function(edt,changeObj)
                                                    {
                                                        //try{$(".code_mirror_box",implement.context).tooltip("hide")}catch(err){};
                                                        moveTool()
                                                    });
                                                    editor.on("keyup",function()
                                                    {

                                                        //$(".code_mirror_box",implement.context).tooltip("hide");
                                                        setTimeout(function()
                                                        {
                                                            CodeMirror.signal(editor,"change");
                                                        },110);


                                                    });
                                                    editor.on("mousedown",function(cod,event)
                                                    {
                                                        moveTool(event.pageY);
                                                    });

                                                    if(lastValue)
                                                    {
                                                        editor.setValue(lastValue);
                                                    }else
                                                    {
                                                        if(exData[templateNodesId]){
                                                            editor.setValue(exData[templateNodesId].params[2].execute_script_content);
                                                        }
                                                    }

                                                    $(".code_mirror_box",implement.context).hover(function()
                                                    {

                                                        if(implement.disable)
                                                        {
                                                            $(".code_mirror_box",implement.context).tooltip("hide");
                                                        }
                                                        //setTimeout(function()
                                                        //{
                                                        CodeMirror.signal(editor,"focus");
                                                        moveTool();
                                                        //},200);
                                                    },function()
                                                    {
                                                        $(".code_mirror_box",implement.context).tooltip("hide");
                                                    });
                                                    moveTool();
                                                    implement.visData(templateNodesId,nodeType);
                                                    $(".code_mirror_box",implement.context).show();
                                                    script_type=newValue;
                                                }
                                            });
                                        if(exData&&exData[templateNodesId]&&exData[templateNodesId].params[3].script_type)
                                        {
                                            script_type=exData[templateNodesId].params[3].script_type;
                                            if(exData[templateNodesId].params[0].group_name.length)
                                                scriptGroupName=exData[templateNodesId].params[0].group_name;

                                        }
                                        //editorReturn
                                        if(!implement.isInstall&&implement.isMange)
                                        {
                                            if(exData&&exData[templateNodesId]&&exData[templateNodesId].params.length>1&&exData[templateNodesId].params[4].info_return)
                                            {
                                                editorReturn.toSwitch(true);
                                            }
                                        }
                                        editorType.combobox("unselect","shell");
                                        editorType.combobox("unselect","python");
                                        editorType.combobox("select",script_type);

                                        function checkHasIn()
                                        {
                                            var bool=true;
                                            if(!String(scriptGroupName).length)
                                            {
                                                bool=false;
                                            }
                                            var arrs=String(scriptGroupName).split(",");
                                            $(arrs).each(function(i,il)
                                            {
                                                if($.inArray(il,implement.group_names)==-1)
                                                {
                                                    bool=false;
                                                }
                                            });
                                            if(bool)
                                            {
                                                bool=arrs;
                                            }
                                            return bool;
                                        }
                                        $(".script_group_select",implement.context).combobox("setValues",checkHasIn()||[]);
                                        //if(editor){
                                        //    implement.visData(templateNodesId,nodeType);
                                        //}
                                        //var val= editorType.combobox("getValue");
                                        //editorType.combobox("unselect","shell");
                                        //editorType.combobox("unselect","python");
                                        //editorType.combobox("select",val);
                                        //if(!editor){
                                        //    editor = CodeMirror.fromTextArea($(".code_mirror_box #code",implement.context).get(0), {
                                        //        mode: "shell",
                                        //        lineNumbers: true,
                                        //        lineWrapping: true,
                                        //        readOnly:implement.disable?"nocursor":false,
                                        //        extraKeys: {"Ctrl-Space": "autocomplete", globalVars: true}
                                        //    });
                                        //    editor.setSize("100%",345);
                                        //}
                                        //if(exData[templateNodesId]){
                                        //    editor.setValue(exData[templateNodesId].params[0].execute_script_content);
                                        //}
                                        //if(!implement.disable)
                                        //{
                                        //    $(".code_mirror_box",implement.context).find("textarea").attr("disabled","disabled");
                                        //    $(".code_mirror_box",implement.context).find("textarea").addClass("disabled");
                                        //}else
                                        //{
                                        //    console.log("remove");
                                        //    $(".code_mirror_box",implement.context).find("textarea").removeAttr("disabled");
                                        //    $(".code_mirror_box",implement.context).find("textarea").removeClass("disabled");
                                        //}
                                        break;
                                    }
                                }
                            },
                            onLoad:function(panel) {
                                var index = $(panel).panel("options").index;
                                switch(index)
                                {
                                    case 0:
                                    {
                                        break;
                                    }
                                    case 1:
                                    {

                                        break;
                                    }
                                    case 2:
                                    {
                                        ef.i18n.parse($(".flow_param",implement.context));
                                        require(["manor.template.create.flow.param"],function(module)
                                        {
                                            var param = {data:oldData||network,id:templateNodesId,type:nodeType};
                                            module.redraw(param,implement,implement.context);//param.data.body.data
                                            module.setCallback(function () {
                                                implement.paramsData = module.flow_param;
                                            });
                                        });
                                        break;
                                    }
                                    case 1:
                                    {
                                        break;
                                    }
                                }
                            }
                        });
                    break;
                case "delete_node":
                {
                    $(".tab-box-nodes-parent",implement.context).hide();
                    $(".tab-box-script-parent",implement.context).hide();
                    $(".tab-box-reboot-parent",implement.context).hide();
                    $(".tab-box-delete-parent",implement.context).show();
                    $(".tab-box-start-parent",implement.context).hide();
                    $(".tab-box-stop-parent",implement.context).hide();
                    $(".noContent-parent",implement.context).hide();
                    $(".tab-box-reboot-parent",implement.context).empty();
                    $(".tab-box-reboot-parent",implement.context).append(implement.deleteNeedContent());
                    tabDelete = $(".tab-box-delete-parent .tab-box-delete",implement.context).tabs(
                        {
                            selected:0,
                            onSelect:function(title,index)
                            {
                                var currentTab=$(this).tabs('getSelected');
                                switch(index)
                                {
                                    case 0:
                                    {
                                        implement.visData(templateNodesId,nodeType);
                                        break;
                                    }

                                }
                            },
                            onLoad:function(panel) {
                                var index = $(panel).panel("options").index;
                                switch(index)
                                {
                                    case 0:
                                    {
                                        break;
                                    }
                                    //case 1:
                                    //{
                                    //    ef.i18n.parse($(".flow_param",implement.context));
                                    //    require(["manor.template.create.flow.param.four"],function(module)
                                    //    {
                                    //        var param = {data:network,id:templateNodesId,type:nodeType};
                                    //        module.redraw(param,implement);
                                    //        implement.deleteChoose = module.deleteChoose;
                                    //        implement.deleteNameChoose = module.deleteNameChoose;
                                    //    });
                                    //    break;
                                    //}
                                }
                            }
                        });
                    break;
                }
                case "start_node":
                {
                    $(".tab-box-nodes-parent",implement.context).hide();
                    $(".tab-box-script-parent",implement.context).hide();
                    $(".tab-box-reboot-parent",implement.context).hide();
                    $(".tab-box-delete-parent",implement.context).hide();
                    $(".tab-box-start-parent",implement.context).show();
                    $(".tab-box-stop-parent",implement.context).hide();
                    $(".noContent-parent",implement.context).hide();
                    $(".tab-box-start-parent",implement.context).empty();
                    $(".tab-box-start-parent",implement.context).append(implement.startNeedContent());
                    tabStart = $(".tab-box-start-parent .tab-box-start",implement.context).tabs(
                        {
                            selected:1,
                            onSelect:function(title,index)
                            {
                                var currentTab=$(this).tabs('getSelected');
                                switch(index)
                                {
                                    case 0:
                                    {
                                        implement.visData(templateNodesId,nodeType);
                                        break;
                                    }
                                    case 1:
                                    {
                                        $(this).tabs("update",{
                                            tab:currentTab,
                                            options:
                                            {
                                                href: _.url("./views/manorTemplateFlowParamFive.html"),
                                                cache:false
                                            }
                                        });
                                        break;
                                    }
                                }
                            },
                            onLoad:function(panel) {
                                var index = $(panel).panel("options").index;
                                switch(index)
                                {
                                    case 0:
                                    {
                                        break;
                                    }
                                    case 1:
                                    {
                                        ef.i18n.parse($(".flow_param",implement.context));
                                        require(["manor.template.create.flow.param.five"],function(module)
                                        {
                                            var param = {data:network,id:templateNodesId,type:nodeType};
                                            module.redraw(param,implement,implement.context);
                                            implement.chooseGroup_name = module.startNameChoose;
                                            implement.startChoose=module.startChoose;
                                        });
                                        break;
                                    }
                                }
                            }
                        });
                    break;
                }
                case "stop_node":
                {
                    $(".tab-box-nodes-parent",implement.context).hide();
                    $(".tab-box-script-parent",implement.context).hide();
                    $(".tab-box-reboot-parent",implement.context).hide();
                    $(".tab-box-delete-parent",implement.context).hide();
                    $(".tab-box-start-parent",implement.context).hide();
                    $(".tab-box-stop-parent",implement.context).show();
                    $(".noContent-parent",implement.context).hide();
                    $(".tab-box-stop-parent",implement.context).empty();
                    $(".tab-box-stop-parent",implement.context).append(implement.stopNeedContent());
                    tabStart = $(".tab-box-stop-parent .tab-box-stop",implement.context).tabs(
                        {
                            selected:1,
                            onSelect:function(title,index)
                            {
                                var currentTab=$(this).tabs('getSelected');
                                switch(index)
                                {
                                    case 0:
                                    {
                                        implement.visData(templateNodesId,nodeType);
                                        break;
                                    }
                                    case 1:
                                    {
                                        $(this).tabs("update",{
                                            tab:currentTab,
                                            options:
                                            {
                                                href: _.url("./views/manorTemplateFlowParamSix.html"),
                                                cache:false
                                            }
                                        });
                                        break;
                                    }
                                }
                            },
                            onLoad:function(panel) {
                                var index = $(panel).panel("options").index;
                                switch(index)
                                {
                                    case 0:
                                    {
                                        break;
                                    }
                                    case 1:
                                    {
                                        ef.i18n.parse($(".flow_param",implement.context));
                                        require(["manor.template.create.flow.param.six"],function(module)
                                        {
                                            var param = {data:network,id:templateNodesId,type:nodeType};
                                            module.redraw(param,implement,implement.context);
                                            implement.chooseGroup_name = module.stopNameChoose;
                                            implement.stopChoose=module.stopChoose;
                                        });
                                        break;
                                    }
                                }
                            }
                        });
                    break;
                }
                default:
                {
                    console.log("[警告]:",type);
                }
            }
            implement.tabFront();
        };
        //选择开始节点的页面
        implement.startContent = function () {
            $(".tab-box-nodes-parent",implement.context).hide();
            $(".tab-box-script-parent",implement.context).hide();
            $(".tab-box-reboot-parent",implement.context).hide();
            $(".tab-box-start-parent",implement.context).hide();
            $(".tab-box-stop-parent",implement.context).hide();
            $(".tab-box-delete-parent",implement.context).hide();
            $(".noContent-parent",implement.context).show();
            $('.noContent',implement.context).show().text('开始节点');

        };
        //vis图的生成，点击事件的处理以及添加，删除，重置的功能
        implement.visJs = function () {
            var dataSet = [],dataEdges = [];
            nodes = new vis.DataSet([
                {id: "start", label: '开始'}
            ]);
            edges = new vis.DataSet([]);
            if(network){
                if(network.body.data.nodes._data.length!=0){
                    for(var i in network.body.data.nodes._data){
                        dataSet.push(network.body.data.nodes._data[i]);
                    }
                    nodes = new vis.DataSet(dataSet);
                    implement.startContent();
                }
                if(network.body.data.edges._data.length!=0){
                    for(var i in network.body.data.edges._data){
                        dataEdges.push(network.body.data.edges._data[i]);
                    }
                    edges = new vis.DataSet(dataEdges);
                }
            }
            var container = $(implement.context).find('#visNetwork')[0];
            var data = {
                nodes: nodes,
                edges: edges
            };
            var options = {};
            network = new vis.Network(container, data, options);
            network.setSelection({nodes:["start"]});
            network.on("selectEdge",function($param)
            {
                if($("#paramGroupName",implement.context)){
                    $("#paramGroupName",implement.context).siblings('span').find('.textbox-text').blur();
                }
                var finder=this.body.data.edges._data[$param.edges[0]];
                //network.selectNodes([finder.to],[true]);
                var reg=/(.*)\$(.*)/;
                implement.tabControll(String(finder.to).match(reg[0]));
                //console.log("edge",$param);
                //console.log();
                //if($param.nodes.length)return;
                //var finder=this.body.data.edges._data[$param.edges[0]];
                //console.log(finder);
                //if(!finder)return;
                //console.log(finder.to);
                //network.selectNodes([finder.to],[true]);
                //templateNodesId=finder.to;
                // network.releaseNode();
                //_toggle.setStatus(2,true);
                //_toggle.setStatus(3,true);
                //if(!templateNodesId)return;
                //
                network.setSelection({nodes:[templateNodesId||"start"]});
                implement.filterNodes(templateNodesId);
            });
            network.on('selectNode', function(params) {
                if($("#paramGroupName",implement.context)){
                    $("#paramGroupName",implement.context).siblings('span').find('.textbox-text').blur();
                }
                console.log("select",params);
                _toggle.setStatus(3,false);
                if(templateNodesId&&nodeType&&!implement.disable){
                    if(implement.visData(templateNodesId,nodeType)==false){
                        ef.placard.warn(ef.util.getLocale("apply.template.param.input.empty"));
                        network.setSelection({nodes:[templateNodesId]});
                        return;
                    }
                    if(implement.visData(templateNodesId,nodeType)=="limit"){
                        ef.placard.warn(ef.util.getLocale("apply.template.amount.little.limit"));
                        network.setSelection({nodes:[templateNodesId]});
                        return;
                    }
                    if(implement.visData(templateNodesId,nodeType)=="max"){
                        ef.placard.warn(ef.util.getLocale("apply.template.amount.little.max"));
                        network.setSelection({nodes:[templateNodesId]});
                        return;
                    }
                }
                nodeType = this.body.data.nodes._data[params.nodes[0]].type;
                templateNodesId = params.nodes[0];
                if(templateNodesId=="start"){
                    implement.startContent();
                    _toggle.setStatus(2,true);
                    _toggle.setStatus(3,true);
                }
                else{
                    if(implement.disable)
                    {
                        _toggle.setStatus(3,true);
                    }else
                    {
                        _toggle.setStatus(3,false);
                    }

                }
                implement.tabControll(nodeType);
                edgesObj = this.body.data.edges._data;
                console.log("edgesObj",edgesObj);
                //_toggle.setStatus(3,false);
                if(nodeType=="create_nodes"){
                    implement.frontStepCheck.clear();
                }else{implement.filterNodes(templateNodesId);}
                for(var i in edgesObj){
                    if(edgesObj[i].from==templateNodesId){
                        _toggle.setStatus(2,true);
                        return;
                    }
                    if(edgesObj[i].to==templateNodesId&&edgesObj[i].from=="start"){
                        _toggle.setStatus(3,true);
                    }
                }
                if(templateNodesId=="start"){_toggle.setStatus(2,true); return;}
                if(!templateNodesId){
                    _toggle.setStatus(2,true); return;
                }
                if(implement.disable)
                {
                    _toggle.setStatus(2,true);
                }else
                {
                    _toggle.setStatus(2,false);
                }

            });
            implement.deselectVis();
            _toggle=$(".toggle-box",implement.context).togglebutton([
                [
                    {
                        iconClass: "icon-template-left-add",
                        tip: ef.util.getLocale("apply.template.create.add"),
                        id:1,
                        click:function(menu)
                        {
                            if(templateNodesId&&nodeType){
                                if(implement.visData(templateNodesId,nodeType)==false){
                                    ef.placard.warn(ef.util.getLocale("apply.template.param.input.empty"));
                                    return;}
                                if(implement.visData(templateNodesId,nodeType)=="limit"){
                                    ef.placard.warn(ef.util.getLocale("apply.template.amount.little.limit"));
                                    return;
                                }
                                if(implement.visData(templateNodesId,nodeType)=="max"){
                                    ef.placard.warn(ef.util.getLocale("apply.template.amount.little.max"));
                                    return;
                                }
                            }
                            var coverLayer=$(".install-one-left",implement.context).coverlayer({contentURL:"./views/manorTemplateInstallAddFlow.html",loadingHeight:400}).onLoad(function()
                            {
                                ef.i18n.parse($(".install-one-left",implement.context));
                                require(["manor.template.create.step.set"],function(stepSet)
                                {
                                    stepSet.redraw(implement.context,!implement.isInstall);
                                    stepSet.setCallback(function(data)
                                    {
                                        if(!data)return;
                                        if(!stepSet.stepType.combobox('isValid')||!stepSet.stepName.textbox('isValid')){return;}
                                        var checkName = true;
                                        for(var i in network.body.data.nodes._data)
                                        {
                                            if(data.label==network.body.data.nodes._data[i].label){
                                                checkName=false;
                                            }
                                        }
                                        if(checkName==false){
                                            ef.placard.warn(ef.util.getLocale("apply.template.nodes.name.copy"));
                                            return false;}
                                        coverLayer.hide();
                                        nodes.add(data);
                                        edges.add({from:"start",to:data.id,arrows:'to'});
                                        network.setSelection({nodes:[data.id]});
                                        nodeType = data.type;
                                        templateNodesId = data.id;
                                        implement.tabControll(nodeType);
                                        _toggle.setStatus(2,false);
                                        if(data.type=='create_nodes'){return;}
                                        implement.filterNodes(data.id);
                                    });
                                    stepSet.setCloseCallback(function () {
                                        coverLayer.hide();
                                    });
                                });
                            });
                            _toggle.setStatus(4,false);
                        }
                    },
                    {
                        iconClass: "icon-menus-icon-delete-tem",
                        tip: ef.util.getLocale("apply.template.create.delete"),
                        id:2,
                        click:function()
                        {
                            $.messager.confirm(ef.alert.warning, ef.util.getLocale("apply.template.create.delete.click"), function (ok) {
                                if (ok) {
                                    var node = network.getSelectedNodes();
                                    var edg = network.body.data.edges._data;
                                    var overEdg = [];
                                    for(var i in edg)
                                    {
                                        if(edg[i].to==node||edg[i].from==node){
                                            overEdg.push(i);
                                        }
                                    }
                                    network.setSelection({edges:overEdg,nodes:[node]});
                                    if(!node.length)
                                    {
                                        return;
                                    }
                                    network.deleteSelected();
                                    network.setSelection({nodes:["start"]});
                                    templateNodesId = "start";
                                    nodeType = "";
                                    implement.startContent();
                                    _toggle.setStatus(2,true);
                                    _toggle.setStatus(3,true);
                                }
                            });
                        }
                    },
                    {
                        iconClass: "icon-template-refresh",
                        tip: ef.util.getLocale("apply.template.create.refresh"),
                        id:3,
                        click:function()
                        {
                            var node = network.getSelectedNodes();
                            if(!node.length)
                            {
                                return;
                            }
                            edgesObj=network.body.data.edges._data;
                            $.messager.confirm(ef.alert.warning, ef.util.getLocale("apply.template.create.refresh.click"), function (ok) {
                                if (ok) {
                                    for(var i in edgesObj){
                                        if(edgesObj[i].to==node[0]){
                                            edges.remove(i);
                                        }
                                    }
                                    implement.filterNodes(node[0]);
                                    edges.add({from:"start",to:node[0],arrows:"to"});
                                    implement.visData(node[0],nodeType);
                                    _toggle.setStatus(3,true);
                                }
                            });
                        }
                    },
                    {
                        iconClass: "icon-template-left-auto",
                        tip: ef.util.getLocale("apply.template.create.auto"),
                        id:4,
                        click:function()
                        {
                            network.fit();
                            implement.visData(templateNodesId,nodeType);
                        }
                    }
                ]
            ]);
            function state(){
                _toggle.setStatus(2,true);
                _toggle.setStatus(3,true);
                _toggle.setStatus(4,false);
            }
            state();

        };
        //tab的第一个标签，前置步骤的生成和点击事件（vis图的关系连线以及本身的刷新处理）
        implement.tabFront = function () {
            implement.frontStepCheck = $(".frontStep",implement.context).checkinfo({
                dataProvider:implement.frontStepCheckData,
                disabled:implement.disable,
                labelField:"label",
                valueField:"value"
            });
            implement.frontStepCheck.click(function (data) {
                var nodeId = network.getSelection().nodes[0];
                if(data.status){
                    var edgeId;
                    for(var i in edges._data){
                        if(edges._data[i].from=="start"&&edges._data[i].to==nodeId){
                            edgeId = i;
                        }
                    }
                    edges.remove(edgeId);
                    edges.add({from:data.value,to:nodeId,arrows:'to'});
                }
                implement.filterNodes(nodeId);
                _toggle.setStatus(3,false);
            });
        };
        //点击完成的事件处理（数据处理以及接口处理）
        implement.create = function () {
            implement.buttonStep.confirm(function () {

                if(implement.visData(templateNodesId,nodeType)==false){
                    ef.placard.warn(ef.util.getLocale("apply.template.param.input.empty"));
                    return;}
                if(implement.visData(templateNodesId,nodeType)=="limit"){
                    ef.placard.warn(ef.util.getLocale("apply.template.amount.little.limit"));
                    return;}
                if(implement.visData(templateNodesId,nodeType)=="max"){
                    ef.placard.warn(ef.util.getLocale("apply.template.amount.little.max"));
                    return;}
                ef.loading.show();
                implement.visData(templateNodesId,nodeType);
                var desData = {label:"",des:"",group_name:[]};
                desData.des = $(".template_detail",implement.context).textbox('getValue');
                desData.label = $(".template_name",implement.context).textbox('getValue');
                for(var i in implement.getSimpleData().streamlet){
                    if(i.indexOf("create_nodes$")!=-1){
                        $(implement.getSimpleData().streamlet[i].params).each(function (i,il) {
                            if(il.group_name){
                                desData.group_name.push(il.group_name);
                            }
                        });
                    }
                }
                ef.getJSON({
                    url:api.getAPI("manorTemplate")+"/template",
                    type:"put",
                    data:implement.postData(desData),
                    success: function (response) {
                        ef.loading.hide();
                        ef.Dialog.closeAll();
                        ef.nav.reload();
                    },error:function()
                    {
                        ef.loading.hide();
                    }
                });
            });
        };
        implement.setDisable=function(bool)
        {
            this.disable=bool;
            if(this.disable)
            {
                _toggle.setStatus(1,true);
                _toggle.setStatus(2,true);
                _toggle.setStatus(3,true);
                _toggle.setStatus(4,false);
                implement.startContent();
                network.setSelection({nodes:["start"]});
            }else
            {
                _toggle.setStatus(1,false);
                _toggle.setStatus(2,true);
                _toggle.setStatus(3,true);
                _toggle.setStatus(4,false);
                implement.startContent();
                network.setSelection({nodes:["start"]});
            }
        };
        implement.destroy=function()
        {
            require.undef(module.id);
        };
        implement.adjustPosition=function()
        {
            if(!_toggle)return;
            _toggle.menus[0].iconmenu.menus[3].dom.click();
        };
        this.implement=implement;
    };
    return TemplateCreate;
});

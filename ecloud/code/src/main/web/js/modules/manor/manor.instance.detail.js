/**
 * Created by thomas on 2016/5/6.
 */
define([
    'module',
    'exports',
    'domReady',
    'api'
],function(module,exports,domReady,api){
    var isLocal = true,
        app_serial = '',//selectedId
        template_name = '',//模板名称
        //easy ui 创建的对象
        global ={
            actionBar:null,
            appAction:null,
            groupNode:null,
            groupData:null,
            groupAction:null,
            nodeAction:null
        };
    var impls = new ef.Interface.implement();
    impls.socket=null;
    impls.crossData=null;
    impls.resouceData=null;
    impls.group_names=[];
    impls.groupDatas=[];
    impls.covers=[];
    impls.iconsData={
        cluster:[],
        group:[],
        node:[]
    };
    /**获取单个应用状态*/
    impls.getSingleState=function()
    {
        var _self=this;
        //已注册
        if(this.socket&&this.socket.socket.readyState==1)
        {
            this.sendMsg();
            return;
        }
        //第一次连接
        this.socket=new ef.server.Socket(api.getAPI("manor.instance.state",true),"manor.instance.state");
        this.socket.onopen=function()
        {
            _self.sendMsg();
        };
        this.socket.onmessage=function(event)
        {
            console.log("socket receive msg:",event.data);
            impls.updateSocketData(event.data)
        };
        this.socket.onerror=function()
        {
            console.log("socket error");
        };
        this.socket.onclose=function()
        {
            console.log("socket closed");
        };
    };
    impls.updateSocketData=function(socketData)
    {
        socketData=JSON.parse(socketData);
        if(!socketData)return;
        this.updateState(socketData);
    };
    impls.sendMsg=function()
    {
        this.socket.send(JSON.stringify(
            {
                app_serial:app_serial
            }
        ));
    };
    //获取创建节点参数(数组)
    impls.getCreateNodesParams=function()
    {
        var arrs=[];
        var reg=/^create_nodes\$/;
        for(var i in impls.crossData.params)
        {
            if(reg.test(i))
            {
                //var obj={};
                //obj[i]=ef.util.dcopy(impls.crossData.params[i].params);
                //arrs.push(obj);
                arrs.push(ef.util.dcopy(impls.crossData.params[i].params));
            }
        }
        return arrs;

    };
    //根据组名获取创建节点参数
    impls.getCreateNodesParamByGroupName=function(group_name)
    {
        var params=this.getCreateNodesParams();
        return ef.util.find(params,function(item)
        {
            //var obj=item[item["_key"]];
            //for(var i=0;i<obj.params.length;i++)
            //{
            //    var il=obj.params[i];
            //    if(il.group_name==group_name)
            //    {
            //        return true;
            //    }
            //}
            for(var i=0;i<item.length;i++)
            {
                var il=item[i];
                if(il.group_name==group_name)
                {
                    return true;
                }
            }

        });
    };
    impls.redraw = function(){
        ef.util.ready(function(dom){
            impls.o = {
                $actionBar:$('#js-menus-wrapper'),
                $addBtn:$('.add-node'),
                $addInput:$('.js-manor-add'),
                $group:$('.group-box'),
                $groupTemp:$(".group-wrapper").clone()
            };
            var selectedData = ef.util.getCrossData(dom);
            impls.crossData=selectedData;
            if(selectedData){
                impls.updateState({
                    status:"working",
                    msg:[]
                });
                app_serial = selectedData.app_serial;
                template_name = selectedData.template_name;
                impls.getInstanceTemplate(function(data)
                {
                    console.log(data);
                    var params=ef.util.filter(data.action,function(item)
                    {
                        return item.type=="deploy";
                    });
                    impls.crossData.params=params[0].streamlet;
                    console.log(impls.crossData);
                    impls.iconsData={
                        cluster:[],
                        group:[],
                        node:[]
                    };
                    impls.iconsData=impls.filterIconsData(data);
                    impls.utils.initDesc(selectedData);
                    impls.getResouse(function(resp){
                        impls.resouceData=resp.reverse();
                        console.log(impls.resouceData,"fff");
                        impls.updateDetail();
                        impls.getSingleState();
                    });
                });
                //impls.utils.getSelectedTempDetail(function(data){
                //    var appAction = impls.utils.prepareData(data);
                //    impls.group_names=appAction.names;
                //    impls.utils.renderPage(appAction);
                //});
            }
        });
    };
    impls.clusterClick=function(menu)
    {
        ef.messager.confirm('reminding', ef.util.getLocale("apply.instance.detail.excute.confirm",menu.data.label), null,function (ok) {
            if (ok) {
                ef.loading.show();
                impls.execute(menu.data.name,function(resp)
                {
                    ef.loading.hide();
                    console.log(resp.serial);
                });
            }
        });


    };
    impls.filterIconsData=function(data)
    {
        this.iconsData.cluster=ef.util.filter(data.action,function(item)
        {
            var bool=(item.type=="manage")&&(item.target=="cluster");
            if(bool)
            {
                item.iconClass=item.icon;
                item.tip=item.label;
                item.click=impls.clusterClick;
            }
            return bool;
        })||[];
        this.iconsData.group=ef.util.filter(data.action,function(item)
        {
            var bool=(item.type=="manage")&&(item.target=="group");
            if(bool)
            {
                item.iconClass=item.icon;
                item.tip=item.label;
                item.click=impls.groupClick;
            }
            return bool;
        })||[];
        this.iconsData.node=ef.util.filter(data.action,function(item)
        {
            var bool=(item.type=="manage")&&(item.target=="node");
            if(bool)
            {
                item.iconClass=item.icon;
                item.tip=item.label;
            }
           return bool;
        })||[];
        var defaultViewIcon={
            target:"node",
            type:"manage",
            iconClass:"icon-menus-icon-example",
            icon:"icon-menus-icon-example",
            tip:ef.util.getLocale("app.btn.info.tip"),
            label:ef.util.getLocale("app.btn.info.tip"),
            isDefault:true
        };
        this.iconsData.node=[defaultViewIcon].concat(this.iconsData.node);
        //if(this.iconsData.node.length>1)
        //{
        //    this.iconsData.node.splice(1,0,defaultViewIcon);
        //}else
        //{
        //    this.iconsData.node.push(defaultViewIcon);
        //}
        console.log(this.iconsData);
        return this.iconsData;
    };
    impls.renderBars=function(data)
    {
       this.o.$actionBar.iconmenu(this.iconsData.cluster);
        var toggle=$(".icons-insdetail").togglebutton([
            [
                {
                    iconClass: "icon-menus-icon-edit",
                    tip: ef.util.getLocale("setting.user.edit.tip"),//编辑
                    id: '1',
                    access:[6,7,8,9,88],
                    click: function (menu) {
                        toggle.goto(1);
                        $("#nameField").textbox({readonly:false});
                        $("#descript").textbox({readonly:false});
                        if($("#descript").textbox("getValue")=="-")
                        {
                            $("#descript").textbox("setValue","");
                        }
                        //$(".host-detail .textbox").css("border-bottom", "1px solid black");
                        //$(".textareass .textbox").css("border", "1px solid");
                    }
                }
            ],
            [
                {
                    iconClass: "icon-menus-icon-save",
                    tip: ef.util.getLocale("setting.user.save.tip"),//保存
                    id: "2",
                    access:[6,7,8,9,88],
                    click: function (menu) {
                       // toggle.goto(0);
                        if(!$("#nameField").textbox("isValid"))
                        {
                            ef.placard.warn(ef.util.getLocale("apply.instance.modify.instance.detail.isvalid"));
                            return;
                        }
                        ef.loading.show();
                        impls.modifyDetail(function(resp)
                        {
                            ef.loading.hide();
                            data.app_name=$("#nameField").textbox("getValue");
                            data.app_description=$("#descript").textbox("getValue")||"-";
                            $("#nameField").textbox({readonly:true});
                            $("#descript").textbox({readonly:true});
                            $("#descript").textbox("setValue",data.app_description);
                            toggle.goto(0);
                            ef.placard.tick(ef.util.getLocale("apply.instance.modify.instance.detail.success"));
                        },function()
                        {
                            $("#nameField").textbox("setValue",data.app_name);
                            $("#descript").textbox("setValue",data.app_description);
                            if(!data.app_description)
                            {
                                $("#descript").textbox("setValue","-");
                            }
                            ef.loading.hide();
                        });
                        $('.choose_cpu_memo.checkInfo').css('marginLeft', '-23px')
                    }
                },
                {
                    iconClass: "icon-menus-icon-cancel",
                    tip: ef.util.getLocale("setting.user.cancel.tip"),//取消
                    access:[6,7,8,9,88],
                    click: function () {
                        toggle.goto(0);
                        $("#nameField").textbox("setValue",data.app_name);
                        $("#descript").textbox("setValue",data.app_description);
                        $("#nameField").textbox({readonly:true});
                        $("#descript").textbox({readonly:true});
                        if(!data.app_description)
                        {
                            $("#descript").textbox("setValue","-");
                        }
                    }
                }
            ]
        ])
    };
    /**是否是添加组操作*/
    impls.checkIsAddGroup=function(data)
    {
        if(!data||!data.streamlet)return false;
        var reg=/^create_nodes\$/;
        return ef.util.findKey(data.streamlet,function(value,key)
        {
            return reg.test(key);
        });
    };
    /**是否是删除节点操作*/
    impls.checkIsDeleteNode=function(data)
    {
        if(!data||!data.streamlet)return false;
        var reg=/^delete_node\$/;
        return ef.util.findKey(data.streamlet,function(value,key)
        {
            return reg.test(key);
        });
    };
    /**是否执行节点操作*/
    impls.checkIsExecuteNode=function(data)
    {
        if(!data||!data.streamlet)return false;
        var reg=/^execute_script\$/;
        return ef.util.findKey(data.streamlet,function(value,key)
        {
            return reg.test(key);
        });
    };
    impls.groupClick=function(menu)
    {
          //增加节点
          if(impls.checkIsAddGroup(menu.data))
          {
              menu.owner.box.data("owner_data",menu.data);
              menu.owner.box.hide();
              menu.owner.box.siblings().show();

          }
    };
    impls.execute=function(manageName,success,error,param)
    {
        var data={
            app_name:this.crossData.app_serial,
            app_description:this.crossData.app_description,
            type:"manage",
            params:{}
        };
        if(param)
        {
            data.params=param;
        }
        ef.getJSON(
            {
                url:api.getAPI("manor.instance.execute")+template_name+"/"+manageName,
                type:"post",
                success:success|| $.noop,
                data:data,
                error:error|| $.noop
            });
    };
    impls.modifyDetail=function(success,error)
    {
        var desValue=$("#descript").textbox("getValue");
        desValue=(desValue=="-")?"":desValue;
        ef.getJSON(
            {
                url:api.getAPI("manor.instance.modify")+app_serial,
                type:"post",
                data:
                {
                    name:$("#nameField").textbox("getValue"),
                    description:desValue
                },
                success:success|| $.noop,
                error:error|| $.noop
            });
    };
    impls.updateDetail=function()
    {
        if(!impls.resouceData||!impls.resouceData.length)return;
        var tmp=impls.resouceData[0];
        $("#vlanField").textbox(
            {
                width:197,
                height:30,
                readonly:true,
                value:tmp.network_name
            });

        this.getProjects(function(resp)
        {
            $("#projectField").textbox(
                {
                    width:197,
                    height:30,
                    readonly:true,
                    value:resp.name
                });
        },tmp.tenant);
        this.createGroups();
        //var _self=this;
        //$(".group-wrapper").each(function(i,gw)
        //{
        //    var cover=$(gw).coverlayer({loadingHeight:170});
        //    cover.show();
        //    _self.covers.push(cover);
        //});
    };
    impls.createGroups=function(data)
    {
        this.renderGroups(data);
    };
    impls.getGroupNames=function()
    {
        var result=[];
        result=ef.util.pluck(this.resouceData,"group_name");
        result=ef.util.uniq(result);
        return result;
    };
    impls.getGroupDatas=function()
    {
        var _self=this;
        var result=[];
        if(!this.group_names||!this.group_names.length)return;
        $(this.group_names).each(function(i,groupName)
        {
            var obj={
                group_name:groupName,
                nodes:[]
            };
            obj.nodes=ef.util.filter(_self.resouceData,function(item)
            {
                return item.group_name==groupName;
            });
            result.push(obj);
        });
        return result;
    };
    impls.formatMsg=function(data)
    {
       ef.util.every(data,function(item)
        {
            item.group_name=item.group_id;

        });
        return data;
    };
    impls.renderGroups=function(data)
    {
        if(data&&data.info)
        {
            this.resouceData=data.info;
        }
        if(!this.resouceData||!this.resouceData.length)return;
        this.resouceData.reverse();
        this.group_names=this.getGroupNames();
        this.groupDatas=this.getGroupDatas();
        this.utils.renderGroupTemp();
    };
    impls.updateState=function(data)
    {
        if(data.error)
        {
            ef.placard.warn(ef.util.getLocale(data.error.msg));
        }
        this.createGroups(data);
        var dom=$('<div useformate="true">' +
            '<i class="tem_icon"></i>' +
            '<span class="hostSlave_state" style="display: inline-block;height: 25px;line-height: 14px;"></span></div>');
        dom.find("i").addClass("manor-list-state-"+data.status);
        dom.find("span").text(ef.util.getLocale("apply.instance.list.state."+data.status));
        $("#statusField").empty();
        $("#statusField").append(dom);
        this.updateGroupState(data);
        if(data.msg.length)
        {
            console.log("hide");
            $(this.covers).each(function(i,cover)
            {
                cover.hide();
            });
        }
    };
    impls.updateGroupState=function(data)
    {
        var _self=this;
        if(!data.msg||!data.msg.length)return;
        $(data.msg).each(function(i,item)
        {
            _self.findNodesByIp(item);
        });
        this.setGroupStates();
    };
    impls.setGroupStates=function()
    {
        //$("[gname='"+groupData.group_name+"']").addClass();
        var _self=this;
        $(this.groupDatas).each(function(i,groupData)
        {
            var state=_self.getGroupState(groupData);
            var $dom=$("[gname='"+groupData.group_name+"']");
            $dom.removeClass();
            $dom.addClass("group-state-"+state);
            $dom.addClass("group-wrapper");
            _self.setNodeStates(groupData);
        });

    };
    impls.setNodeStates=function(groupData)
    {
        var $dom=$("[gname='"+groupData.group_name+"']");
        $(groupData.nodes).each(function(i,node)
        {
            $dom.find(".appBlock-block[id='"+node.name+"']").removeClass().addClass("appBlock-block").addClass("node-state-"+node.status);
        });
    };
    impls.getGroupState=function(groupData)
    {
        var state="";
        var isNoraml=ef.util.every(groupData.nodes,function(node,i)
        {
            return node.status=="active";
        });
        if(isNoraml)
        {
            return "active";
        }
        var isStopped=ef.util.every(groupData.nodes,function(node,i)
        {
            return node.status=="shutoff";
        });
        if(isStopped)return "stop";

        return "part";
        //if(groupData.nodes.length>=2)
        //{
        //    var isPartActive=ef.util.find(groupData.nodes,function(i,node)
        //    {
        //        return String(node.state).toLowerCase()=="active";
        //    });
        //    var isPartDown=ef.util.find(groupData.nodes,function(i,node)
        //    {
        //        return String(node.state).toLowerCase()=="stopped";
        //    });
        //    var isPartOffline=ef.util.find(groupData.nodes,function(i,node)
        //    {
        //        return String(node.state).toLowerCase()=="offline";
        //    });
        //    if((isPartActive&&isPartDown)||(isPartActive&&isPartOffline)||(isPartDown&&isPartOffline))
        //    {
        //        return "part";
        //    }
        //}





    };

    impls.findNodesByIp=function(searchData)
    {
        var result=null;
        var _self=this;
        $(this.groupDatas).each(function(i,il)
        {
            var finder=ef.util.find(il.nodes,function(item,index)
            {
                if(item.ip==searchData.ip)
                {

                    item.status=String(searchData.status).toLowerCase();
                    item.agent_state=String(searchData.agent_state).toLowerCase();
                    if((item.status=="active")&&(item.agent_state=="offline"))
                    {
                        item.status="offline";
                    }
                }
                return searchData.ip==item.ip;
            });
            if(finder)
            {
                result=il;
            }
        });
        return result;
    };
    //查看信息
    impls.viewInfo=function(nodeData,iconData,html)
    {
        new ef.Dialog("manor.instance.detail.info",{
            title:ef.util.getLocale("apply.instance.detail.info.title"),
            width:456,
            height:331,
            closed:false,
            cache:false,
            nobody:false,
            modal:true,
            href: 'views/manor.instance.detail.info.html',
            onResize: function () {
                $(this).dialog('center');
            },
            onLoad:function(){
                ef.i18n.parse(".item-list-ul-first");
                require.undef("manor.instance.detail.info");
                require(["manor.instance.detail.info"],function(module)
                {
                    module.redraw(nodeData,iconData,impls);
                });
            },
            onClose:function()
            {
                require.undef("manor.instance.detail.info");
            }
        });
    };
    //删除节点
    impls.deleteNode=function(nodeData,iconData,html,nodes,deleteKey)
    {
        var params=this.getCreateNodesParamByGroupName(this.getGroupName(html));
        var limit=0;
        $(params).each(function(i,il)
        {
            if(il.limit!==undefined)
            {
                limit=il.limit;

            }
        });
        if(nodes.length<=limit)
        {
            ef.placard.warn("节点数不能小于"+limit);
            return;
        }
        $.messager.confirm(ef.alert.warning,ef.util.getLocale("apply.instance.delete.warn.tip",nodeData.data.name),function(ok){
            if(ok)
            {
                var delParam=ef.util.dcopy(iconData.streamlet);
                delParam[deleteKey].params[0].server_id=nodeData.data.vm_id;
                var reg=/^execute_script\$/;

                var createKey=ef.util.findKey(iconData.streamlet,function(value,key)
                {
                    return key;
                });
                var createParam=ef.util.dcopy(iconData.streamlet[createKey]);
                var delObj={
                    "type": "system_default",
                    "name": "ON_IP",
                    "value": nodeData.data.ip
                };
                var finderScriptParam=ef.util.find(createParam.params,function(scriptPaItem){
                    return scriptPaItem.script_params?scriptPaItem.script_params:{};
                });
                if(!ef.util.isEmpty(finderScriptParam)){
                    var finder=ef.util.find(finderScriptParam.script_params,function(it)
                    {
                        if(it.name=="ON_IP")
                        {
                            it.value=nodeData.data.ip;
                            delete it.description;
                            delete it.display;
                            delete it.ui
                        }
                        return it.name=="ON_IP";
                    });
                }
                if(!finder)
                {
                    finderScriptParam.script_params = [];
                    finderScriptParam.script_params.push(delObj);

                }
                //delParam[createKey].params=;
                $(delParam[createKey].params).each(function(i,dl)
                {
                    if(dl.script_params)
                    {
                        dl.script_params=finderScriptParam.script_params;
                    }
                });
                impls.execute(iconData.name,function(resp)
                {
                    console.log(resp);
                    ef.placard.doing("节点删除中");
                },null,delParam);
            }
        });
    };

    //执行脚本节点
    impls.executeNode=function(nodeData,iconData,html,nodes,executeKey)
    {
        var infoReturn=true;
        var oldParams=iconData.streamlet[executeKey].params;
        infoReturn=!!(ef.util.find(oldParams,function(item)
        {
           return item.info_return;
        }));
        var executeParam={};
        executeParam[executeKey]=
        {
            params:[
                {
                    script_params:[
                        {
                            "type": "system_default",
                            "name": "ON_IP",
                            "value":nodeData.data.ip
                        }
                    ]
                },
                {"info_return":infoReturn}
            ]
        };
        ef.loading.show();
        this.execute(iconData.name,function(resp)
        {
            console.log("execute:",resp);
            ef.loading.hide();
            if(infoReturn)
            {
                new ef.Dialog("manor.instance.view.monitor",{
                    title:ef.util.getLocale("apply.instance.view.monitor.title"),
                    width:750,
                    height:450,
                    closed:false,
                    cache:false,
                    nobody:false,
                    modal:true,
                    href: 'views/manor.instance.view.monitor.html',
                    onResize: function () {
                        $(this).dialog('center');
                    },
                    onLoad:function(){
                        var _self=this;
                        ef.i18n.parse(".instance_monitor_view");
                        require.undef("manor.instance.view.monitor");
                        require(["manor.instance.view.monitor"],function(module)
                        {
                            module.redraw(resp.info[0]);
                            _self.module=module;
                        });
                    },
                    onClose:function()
                    {
                        if(this.module)
                       this.module.destroy();
                    }
                });
            }else
            {
                ef.placard.doing(ef.util.getLocale("apply.instance.script.excute.tip"));
            }
        },function()
        {
            ef.loading.hide();
        },executeParam);
    };
    impls.nodeClick=function(nodeData,iconData,html,nodes)
    {
        //查看信息
        if(iconData.isDefault==true)
        {
            this.viewInfo(nodeData,iconData,html);
            return true;
        }
        //删除节点
        var deleteKey=this.checkIsDeleteNode(iconData);
        if(deleteKey)
        {
            this.deleteNode(nodeData,iconData,html,nodes,deleteKey);
            return true;
        }
        //查看服务状态
        console.log(arguments);
        var executeKey=this.checkIsExecuteNode(iconData);
        if(iconData)
        {
            this.executeNode(nodeData,iconData,html,nodes,executeKey);
            return true;
        }

    };
    /**获取实例所在模版*/
    impls.getInstanceTemplate=function(success,error)
    {
        ef.getJSON(
            {
                url:api.getAPI("manor.instance.template")+app_serial,
                success:success|| $.noop,
                dataType:"json",
                error:error|| $.noop
            });
    };
    impls.getGroupName=function(html)
    {
        return html.attr("gname");
    };
    impls.getCreateNodeNames=function(params,menuData)
    {
        var obj={};
        obj[this.checkIsAddGroup(menuData)]=
        {
            params:params
        };
        return obj;
    };
    impls.addGroupNode=function(nodeNum,menuData,html)
    {
        var params=this.getCreateNodesParamByGroupName(this.getGroupName(html));
        $(params).each(function(i,il)
        {
            if(il.amount!==undefined)
            {
                il.amount=nodeNum;
            }
        });

        this.execute(menuData.name,function(resp)
        {
            console.log(resp);
            ef.placard.doing("节点创建中");
        },null,this.getCreateNodeNames(params,menuData));
    };
    impls.destroy = function(){
        require.undef(module.id);
    };
    impls.init = function(){
        var that = this;
        //actionBar = this.o.$actionBar.iconmenu(this.config.actionBarConfig);
        impls.o.$addInput.textbox(impls.config.addInputConfig);
        this.o.$addBtn.each(function(index, element){
            $(element).togglebutton(that.config.addBtnConfig);
        });
        //var appData = ["1","0","0","0","0","0","1","1","1","1","0","0","2","2","2","2"];
        //this.o.$group.each(function(index, element){
        //    var app = $(element).appBlock({
        //        iconClass:["icon-menus-icon-add","icon-menus-icon-save","icon-menus-icon-cancel"],
        //        data:appData
        //    });
        //    var appdata = ["0","0","0","0","0","0","1"];
        //    app.iconClick(function (data,index) {
        //        console.log(data,index);
        //            if(index==0){
        //            app.removeBlock(data.index);
        //            //app.loadData(appData);
        //        }
        //    });
        //});
    };
    impls.getResouse=function(success,error)
    {
        ef.getJSON(
            {
                url:api.getAPI("manor.instance.resource")+app_serial,
                success:success|| $.noop,
                error:error|| $.noop
            })
    };
    impls.getProjects=function(success,projectName){
        ef.getJSON({
            url:api.getAPI('manorProList'),
            type: "get"
            })
            .success(function(response){
                var result=ef.util.find(response.result,function(item)
                {
                    return item.id==projectName;
                });
                success(result);
            })
            .error(function(error){
                console.log(error);
            })
    };
    impls.getVlanDetail=function(){
        ef.getJSON({
            url:api.getAPI('manorVlanList'),
            type: "get",
            useLocal:true})
            .success(function(response){
                var vlanArr=[],dom=$('#vlanField');
                $(response).each(function(i,il){
                    vlanArr.push(il.name);
                });
                $(vlanArr).each(function(i,il){
                    $vla=$('<span></span>');
                    $vla.text(il+',');
                    if(i==vlanArr.length-1){
                        $vla.text(il);
                    }
                    dom.append($vla);
                });
            })
            .error(function(error){
                console.log(error);
            })

    };

    impls.utils = {
        /**初始化描述*/
        initDesc:function(data)
        {
            $("#nameField").textbox(
                {
                    width:197,
                    height:30,
                    value:data.app_name,
                    required:true,
                    readonly:true,
                    maxlength:15,
                    validType: 'whitelist["\u4E00-\u9FA5A-Za-z0-9_-","'+ef.util.getLocale("global.name.invalid.tip")+'"]'
                });
            $("#tempField").textbox(
                {
                    width:197,
                    height:30,
                    value:data.template_name,
                    readonly:true
                });
            $("#projectField").textbox(
                {
                    width:197,
                    height:30,
                    value:"",
                    readonly:true
                });
            $("#descript").textbox(
                {
                    width:197,
                    height:37,
                    multiline:true,
                    value:data.app_description||"-",
                    readonly:true
                });
            impls.renderBars(data);
        },
        prepareData:function(data){
            var groupData = global.groupData = {};
            var groupNameFind = _.find(data,function(item){
                return String(item.type).toLowerCase() == 'deploy'
            });
            if(groupNameFind){
                var temp = groupNameFind.stream_module.nodes._data;
                var tempObj = _.pick(temp,function(value, key, item){
                    return String(key).indexOf('create_nodes') != -1
                });
                groupData.ids = _.keys(tempObj);
                groupData.names = _.pluck(tempObj,'label');
                var tempParamObj = groupNameFind.streamlet;
                var tempParam = _.pick(tempParamObj,function(value, key, item){
                    return String(key).indexOf('create_nodes') != -1
                });
                groupData.nums = [];
                tempParam = _.toArray(tempParam);
                $(tempParam).each(function(index, item){
                    var array = item.params;
                    var amIndex = _.findKey(array,'amount');
                    var mum = array[amIndex]['amount'];
                    groupData.nums.push(mum);
                });
                console.log('group data-----',groupData);
                return groupData;
            }
            global.groupAction = _.filter(data,function(item){
                return  String(item.type).trim().toLowerCase() == 'manage' &&
                        String(item.target).trim().toLowerCase() == 'group';
            });
            global.nodeAction = _.filter(data,function(item){
                return  String(item.type).trim().toLowerCase() == 'manage' &&
                        String(item.target).trim().toLowerCase() == 'node';
            });
            global.appAction = _.filter(data,function(item){
                return  String(item.type).trim().toLowerCase() == 'manage' &&
                    String(item.target).trim().toLowerCase() == 'app';
            });
        },
        getSelectedTempDetail:function(callback){
            var url = api.getAPI("manorTempDetail");
            if(!isLocal){
                url += app_serial;
            }
            ef.getJSON({
                url:url,
                type:'get',
                dataType:'json',
                useLocal:isLocal,
                success:function(response){
                    ef.localStorage.put('manor.instance.detail.temp',response);
                    callback(response);
                },
                error:function(error){
                    console.log(error);
                }
            });
        },
        getNodeList:function(callback){
            var url = api.getAPI("manorNodeDetail");
            if(!isLocal){
                url += app_serial;
            }
            ef.getJSON({
                url:url,
                type:'get',
                dataType:'json',
                useLocal:isLocal,
                success:function(response){
                    callback(response);
                },
                error:function(error){
                    console.log(error);
                }
            });
        },
        renderTitleBar:function(){
            var $obj = impls.o,
                config = impls.config,
                data = global.appAction,
                actionBarItem = {
                    iconClass: "icon-menus-icon-back icon-menus-back",
                    tip: ef.util.getLocale('framework.component.iconmenu.back.tip'),//"返回",
                    "access": [8, 9, 10, 88],
                    click: function (data) {
                        ef.nav.goto("manorInstance.html", "manor.instance");
                    }
                };
            config.actionBarConfig.push(actionBarItem);
            if(data&&data.length){
                $(data).each(function(index, item){
                    var newItem = $.extend({},actionBarItem);
                    newItem.iconClass= item.icon;
                    newItem.tip = item.label;
                    newItem.org = item;
                    newItem.click = function(data){
                        impls.utils.titleBarAction(data);
                    };
                    config.actionBarConfig.push(newItem);
                });
            }
            global.actionBar = $obj.$actionBar.iconmenu(config.actionBarConfig);
        },
        titleBarAction:function(value){
            var url = api.getAPI("createInstance"),
                data= value.data.org,
                action_name = data.name;
            var paramData = {
                app_name: app_serial,
                params: data.streamlet
            };
            if(!isLocal){
                url += ('/'+template_name+'/'+action_name);
            }
            ef.getJSON({
                url:url,
                type:'post',
                dataType:'json',
                useLocal:isLocal,
                data:paramData,
                success:function(response){
                    value.data.org.resp = response;
                },
                error:function(error){
                    console.log(error);
                }
            });
        },
        renderGroupTemp:function(){
            var data = impls.groupDatas;
            $('.group').empty();
            impls.covers=[];
            $(data).each(function(i,value)
            {
                var html = impls.utils.getGroupTemp().clone();
                html.removeAttr("id");
                html.show();
                html.attr("gname",value.group_name);
                $('.group').append(html);
                html.find(".data_gname").text(value.group_name);
                html.find(".data_gmount").text(value.nodes.length);
                $('.group').append(html);
                html.find(".group-right").iconmenu(impls.iconsData.group);
                impls.utils.renderGroupAddNode(html);
                impls.utils.renderGroupNode(value,html);
                var cover=html.coverlayer({loadingHeight:170});
                impls.covers.push(cover);

            });
        },
        renderGroupAddNode:function(html)
        {
            var dom=html.find(".add_group_node .addInput");
            dom.numberspinner(
                {
                    width:197,
                    height:30,
                    min:1,
                    max:99999,
                    required:true,
                    value:1
                });
            html.find(".addInputBtns").iconmenu(
                [
                    {
                        iconClass:"icon-gray-right",
                        tip:"添加",
                        click:function(menu)
                        {
                            if(!dom.numberspinner("isValid"))
                            {
                                ef.placard.warn("增加节点个数必填！");
                                return;
                            }
                            impls.addGroupNode(dom.numberspinner("getValue"),html.find(".group-right").data("owner_data"),html);
                            html.find(".group-right").show();
                            html.find(".add_group_node").hide();
                            $('.choose_cpu_memo.checkInfo').css('marginLeft', '-12px')
                        }
                    },
                    {
                        iconClass:"icon-manorTemplate-param-delete",
                        tip:"取消",
                        click:function()
                        {
                            html.find(".group-right").show();
                            html.find(".add_group_node").hide();
                        }
                    }
                ]);
        },
        renderGroupNode:function(groupData,html)
        {
            var appBlock=html.find(".group-box").appBlock({
                icon:impls.iconsData.node,
                labelField:"name",
                valueField:"ip",
                idField:"name",
                data:groupData.nodes
            });
            appBlock.iconClick(function(nodeData,iconData){
                impls.nodeClick(nodeData,iconData,html,groupData.nodes);
            });

        },
        getGroupTemp:function(){
            return impls.o.$groupTemp;
        },
        confirmInput:function(element){
            var $parent = $(element).closest('.add-node-content');
            var doms = $parent.data('addDoms');
            var $input = doms.inputSelf;
            var val = $input.textbox('getValue');
            alert(val);
            $input.textbox('reset');
            doms.inputParent.hide();
        },
        cancelInput:function(element){
            var $parent = $(element).closest('.add-node-content');
            var doms = $parent.data('addDoms');
            var $input = doms.inputSelf;
            doms.inputParent.hide();
            $input.textbox('reset');
        },
        dialog:function(){
            new ef.Dialog('manorNodeDetail',{
                title: ef.util.getLocale("apply.instance.dialog.detail.title"),
                width: 900,
                height: 545,
                closed: false,
                cache: false,
                nobody: false,
                href: 'views/manorNodeDetail.html',
                modal: true,
                onResize: function () {
                    $(this).dialog('center');
                }
            });
        }
    };
    impls.config = {
        actionBarConfig:[],
        addInputConfig:{
            prompt:ef.util.getLocale('apply.instance.detail.addbtn.title'),
            onChange:function(){

            }
        },
        toggleConfig:[{
            iconClass: "icon-manor-confirm",
            tip: ef.util.getLocale("global.button.confirm.label"),
            access: [8, 88],
            click: function (menu) {
                impls.utils.confirmInput(menu.dom);
                menu.owner.owner.goto(0);
            }
        },{
            iconClass: "icon-manor-cancel",
            tip: ef.util.getLocale("global.button.cancel.label"),
            access: [8, 88],
            click: function (menu) {
                impls.utils.cancelInput(menu.dom);
                menu.owner.owner.goto(0);
            }
        }],
        tableConfig:[{
            name:'nameField',
            server:'manorInstance'
        },{
            name:'tempField',
            server:'manorInstance'
        }],
        groupTemp:$('#temp')
    };
    return impls;
});

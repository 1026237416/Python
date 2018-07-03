/**
 * Created by wangahui1 on 16/5/13.
 */
define(["module","exports","domReady","api"],function(module,exports,domReady,api)
{
    var impl=new ef.Interface.implement();
    var addFlowBtn;
    impl.disable=true;
    impl.data=null;
    var iconMenu;
    impl.redraw=function()
    {
        ef.util.ready(function(dom)
        {
            impl.data=null;
            impl.crossData=ef.util.getCrossData(dom);
            ef.loading.show();
            impl.getDetail(function(response)
            {
                impl.crossData=response;
                impl.init();
                impl.removeListener();
                impl.addListener();
                ef.loading.hide();
            });
        });
    };
    impl.getDetail=function(callback,error)
    {
        ef.getJSON(
            {
                url :ef.util.url("/manor/templates"),
                type:"GET",
                success:function(response)
                {
                    var result=ef.util.find(response,function(item)
                    {
                        return item.name==impl.crossData.name;
                    });
                    impl.data=result;
                    callback(result);
                },error:error|| $.noop
            });
    };
    impl.removeListener=function()
    {
        ef.event.off("ManorEvent.detail.flow.create.build");
        ef.event.off("ManorEvent.detail.flow.create.close");
        ef.event.off("manor.group.change");
    };
    impl.addListener=function()
    {
        ef.event.on("ManorEvent.detail.flow.create.build",function(event,data)
        {
            if(data)
            {
                ef.Dialog.close("manor.template.detail.flow.create");
                impl.addFlowTab(data);
            }
        });
        ef.event.on("ManorEvent.detail.flow.create.close",function(event,data)
        {
            ef.Dialog.close("manor.template.detail.flow.create");
        });
    };
    impl.init=function()
    {
        ef.i18n.parse(".right-cont");
        iconMenu=$("#js-menus-wrapper").iconmenu(
            [
                {
                    isToggle:true,
                    id:"8",
                    data:[
                        [
                            {
                                iconClass: "icon-menus-icon-edit",
                                tip: ef.util.getLocale("global.button.edit.label"),
                                id: "0",
                                "access":[7,8,88],
                                click:function(menu)
                                {
                                    menu.owner.owner.goto(1);
                                    impl.beginEdit();
                                }
                            }
                        ],
                        [
                            {
                                iconClass: "icon-menus-icon-save",
                                tip: ef.util.getLocale("global.button.save.label"),
                                id: "1",
                                "access":[7,8,88],
                                click:function(menu)
                                {
                                    ef.loading.show();
                                    impl.getDetail(function(resp)
                                    {
                                        if(resp.status)
                                        {
                                            ef.placard.warn(ef.util.getLocale("apply.template.detail.edit.status.error"));
                                            ef.loading.hide();
                                            ef.nav.reload();
                                        }else
                                        {
                                            if(!impl.saveEdit())
                                            {
                                                ef.loading.hide();
                                            }
                                        }
                                    });

                                }
                            },
                            {
                                iconClass: "icon-menus-icon-cancel",
                                tip: ef.util.getLocale("global.button.cancel.label"),
                                id: "2",
                                "access":[7,8,88],
                                click:function(menu)
                                {
                                    menu.owner.owner.goto(0);
                                    impl.cancelEdit();
                                }
                            }
                        ]
                    ],
                    click: function () {
                    }
                }
                //{
                //    iconClass: "icon-menus-icon-back",
                //    tip: ef.util.getLocale("global.button.return.label"),
                //    id: "5",
                //    "access":[7,8,88],
                //    click: function () {
                //        ef.nav.goto("manorTemplate.html","manor.templates");
                //    }
                //}
            ]);
        !function(){
            impl.initDetail();
            impl.initFlows();
        }();
        addFlowBtn=$(".create_flows_right").togglebutton(
            [
                [
                    {
                        iconClass:"icon-menus-icon-add",
                        tip:ef.util.getLocale("global.button.add.label"),
                        disable:true,
                        id:0,
                        click:function()
                        {
                            if(!impl.checkCreateNodes())
                            {
                                ef.placard.warn(ef.util.getLocale("apply.template.manage.add.nocreate_nodes"));
                                return;
                            }
                            new ef.Dialog("manor.template.detail.flow.create",
                                {
                                    title: ef.util.getLocale('apply.template.detail.detail.create.title'),// '修改配置',
                                    width:500,
                                    height: 374,
                                    closed: false,
                                    cache: false,
                                    nobody: false,
                                    href: 'views/createManorFlowDialog.html',
                                    modal: true,
                                    onResize: function () {
                                        $(this).dialog("center");
                                    },
                                    onClose: function () {
                                        require.undef('manor.template.detail.flow.create');
                                    },
                                    onLoad: function () {
                                        require(['manor.template.detail.flow.create'], function (flowCreate) {
                                            flowCreate.redraw();
                                        })
                                    }
                                });
                        }

                     }
                ]
            ]);
    };
    impl.initDetail=function()
    {
        $("#tempName").textbox({readonly:true,value:this.crossData.label,width:195,height:30,required:true,maxlength:15,
            validType: 'whitelist["\u4E00-\u9FA5A-Za-z0-9_-","数字,字母,中文,中划线和下划线"]'});
        $("#tempDes").textbox({readonly:true,value:this.crossData.description,multiline:true,width:195,height:40});
        $("#tempId").textbox({readonly:true,value:this.crossData.name,width:150,height:30});
    };
    /**初始化所有流程(安装及管理流程)*/
    impl.initFlows=function()
    {
        var _self=this;
        $(".manor_template_flows").tabs({
            fit:true,
            tabPosition:"top",
            scrollDuration:0,
            onSelect:function(title,index)
            {
                var panel=$(".manor_template_flows").tabs("getTab",index);
                var option=$(panel).panel("options");
                var templateCreate=option.dataProvider;
                if(templateCreate&&templateCreate.adjustPosition)
                {
                    templateCreate.adjustPosition();
                }
            },
            onLoad:function(panel)
            {
                var option=$(panel).panel("options");
                var index = option.index;
                if(!index)
                {
                    require(["manor.template.create"],function(TemplateCreate)
                    {
                        var templateCreate=(new TemplateCreate()).implement;
                       panel.find(".viewstack-box-dlg .item-ul-one-col").remove();
                        ef.i18n.parse(".manor_template_flows");
                        templateCreate.redraw(null,panel,$(panel).panel("options").originData,function()
                        {
                            templateCreate.setDisable(impl.disable);
                        },true);
                        panel.find(".button-route").hide();
                        templateCreate.buttonStep.goto(1);
                        templateCreate.owner=impl;
                        option.dataProvider=templateCreate;
                    },true);
                }else
                {
                    require(["manor.template.detail.flow"],function(DetailFlow)
                    {
                        ef.i18n.parse(panel);
                        var detailFlow=(new DetailFlow(panel));
                        detailFlow.redraw(panel.panel("options").originData,impl);
                        detailFlow.setDisable(impl.disable);
                    });
                }
                if(_self.disable)
                {
                    $(".manor_template_flows .tabs-close").hide();
                }else
                {
                    $(".manor_template_flows .tabs-close").show();
                }
            }
        });
        impl.getDetail(function(response)
        {
            $(response.action).each(function(i,result)
            {
                if(!i)
                {
                    _self.addFistTab(result);
                }else
                {
                    _self.addFlowTab(result);
                }
            });
            $(".manor_template_flows").tabs("select",0);
            if(response.status!=0){(iconMenu.menus[0].setStatus(0,true));}
        });

    };
    /**开始详情编辑*/
    impl.beginEdit=function()
    {
        this.disable=false;
        $("#tempName").textbox({readonly:false});
        $("#tempDes").textbox({readonly:false});
        addFlowBtn.setStatus(0,false);
        this.setEdit();
    };
    impl.setEdit=function()
    {
        var _self=this;
        $(this.getFlows()).each(function(i,item)
        {
            if(ef.util.isFunction(item.setDisable))
            {
                item.setDisable(_self.disable);
            }

            if(item.owner)
            {
                item.owner.setDisable(_self.disable);
            }
        });
        if(this.disable)
        {
            $(".manor_template_flows .tabs-close").hide();
        }else
        {
            $(".manor_template_flows .tabs-close").show();
        }
    };
    /**取消编辑*/
    impl.cancelEdit=function()
    {
        this.disable=true;
        $("#tempName").textbox({readonly:true});
        $("#tempDes").textbox({readonly:true});
        addFlowBtn.setStatus(0,true);
        this.setEdit();
        ef.nav.reload();
    };
    /**保存编辑*/
    impl.saveEdit=function()
    {
        var results=[];
        var _self=this;
        var _isFull=true;
        $(this.getFlows()).each(function(i,tmp)
        {
            if(tmp.isInstall)
            {
                _self.data.group_names=tmp.getGroupNames(true);
            }
            var bool=tmp.getSimpleData(true);
            if(!bool||bool=="min"||bool=="max")
            {
                _isFull=false;
            }
            results.push(bool);
        });
        console.log("sendDta",results);
        if(!_isFull)return false;
        if(!this.checkCreateNodes())
        {
            ef.placard.warn(ef.util.getLocale("apply.template.manage.save.nocreate_nodes"));
            return;
        }

        this.disable=true;
        return this.setData(results);
    };
    impl.checkCreateNodes=function()
    {
        var arrs=[];
        var bool=true;
        var reg=/^create_nodes\$/;
        $(this.getFlows()).each(function(i,tmp)
        {
            if(tmp.isInstall)
            {
                arrs.push(tmp.getSimpleData());
            }
        });
        $(arrs).each(function(i,il)
        {
            if(!il)
            {
                bool=false;
                return;
            }
            if(!ef.util.findKey(il.streamlet,function(value,key){
                    return reg.test(key);
                }))
            {
                bool=false;
            }
        });
        return bool;
    };
    impl.getGroupNames=function()
    {
        var names=[];
        $(this.getFlows()).each(function(i,tmp)
        {
            if(tmp.isInstall)
            {
                names=tmp.getGroupNames(true);
            }
        });
        return names;
    };
    impl.setData=function(results)
    {
        var _self=this;
        if(!this.isValid())
        {
            ef.placard.warn(ef.util.getLocale("apply.template.detail.valid.tip"));
            return false;
        }
        this.data.label=$("#tempName").textbox("getValue");
        this.data.description=$("#tempDes").textbox("getValue");
        this.data.action=results;
        console.log(this.data);
        ef.getJSON(
            {
                url:api.getAPI("manorTemplateDetail"),
                type:"POST",
                data:this.data,
                success:function()
                {
                    ef.placard.tick("修改模板成功！");
                    ef.loading.hide();
                    ef.nav.reload();
                },
                error:function()
                {
                    ef.loading.hide();
                    _self.disable=false;
                    //ef.nav.reload();
                }
            });
        return true;
    };
    impl.isValid=function()
    {
        if(!$("#tempName").textbox("isValid"))
        {
            return false;
        }
        return true;
    };
    /**获取所有的安装流程及管理流程数据*/
    impl.getFlows=function()
    {
        var panels=$(".manor_template_flows").tabs("tabs");
        var arrs=[];
        $(panels).each(function(i)
        {
            arrs.push($(this).panel("options").dataProvider);
        });
       return arrs;
    };
    /**增加第一个标签页，即安装流程*/
    impl.addFistTab=function(item)
    {
        $(".manor_template_flows").tabs("add",
            {
                title:ef.util.getLocale("apply.template.detail.flows.install.title"),
                closable:false,
                originData:{data:item,group_names:impl.data.group_names},
                dataProvider:{},
                href:"./views/addManorTemplateCreate.html"
            });
    };
    /**
     * 增加单个页签
     * @param {Object} item 每一项的数据
     * */
    impl.addFlowTab=function(item)
    {
        $(".manor_template_flows").tabs("add",
            {
                title:item.label,
                closable:true,
                href:"./views/manorTemplateManaFlows.html",
                dataProvider:{},
                collapsible:false,
                originData:{data:item,group_names:impl.data.group_names}

            });
    };
    impl.destroy=function()
    {
        require.undef(module.id);
    };
    impl.setDisable= $.noop;
    return impl;
});
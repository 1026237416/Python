/**
 * Created by thomas on 2016/5/13.
 */
define([
    'module',
    'exports'
],function(module, exports){
    return function()
    {
        var impls = new ef.Interface.implement();
        impls.context=null;
        impls.owner=null;
        impls.cover=null;
        impls.redraw = function(selectedNodeId,context){
            this.selectedNodeId=selectedNodeId;
            this.context=context;
            this.cover=this.context.coverlayer({loadingHeight:430},{opaque:false});
            console.log('selectedScriptId-----',selectedNodeId);
            this.init();
        };
        impls.destroy = function(){
            require.undef(module.id);
        };
        impls.isValid=function()
        {
            if(!$("#teamName",impls.context).textbox("isValid"))
            {
                return false;
            }
            if(!$("#amount",impls.context).numberspinner("isValid"))
            {
                return false;
            }
            if(!$("#minNode",impls.context).numberspinner("isValid"))
            {
                return false;
            }
            if(!$("#maxNode",impls.context).numberspinner("isValid"))
            {
                return false;
            }
            if(!$('.sys-capacity',impls.context).numberspinner("isValid"))
            {
                return false;
            }
            if(!$('.sys-mirror',impls.context).combobox("isValid"))
            {
                return false;
            }
            var min=$("#minNode",impls.context).numberspinner("getValue");
            var max=$("#maxNode",impls.context).numberspinner("getValue");
            var count=$("#amount",impls.context).numberspinner("getValue");
            if(count<min||count>max)
            {
                return false;
            }
            return true;
        };
        impls.isAllManorAddHide=function()
        {
            $(".manor-add",this.context).each(function(i,il)
            {
                var dom=$(il);
                var bool=impls.isAllHide(dom);
                if(bool)
                {
                    $(this).hide();
                }
                var len=dom.find(".manor-add-wrapper:visible").length;
                if(len==1)
                {
                    dom.find(".manor-add-wrapper:visible").css({border:0});
                }
            });
        };
        impls.isAllHide=function(dom)
        {
            var bool=0;
            dom.children().each(function(i,il)
            {
                if(!$(il).is(":visible"))
                {
                    bool++;
                }
            });
            return bool==dom.children().length;
        };
        impls.getData=function()
        {
            return this.owner.utils.getSelectedNodeData(this.selectedNodeId);
        };
        impls.getParams=function()
        {
            var result=false;
            var data=this.getData();
            if(data)
            {
               result=data[this.selectedNodeId];
                result=result.params;
            }
            return result;
        };
        impls.init = function(){
            impls.utils = {
                noDeleteImage:function(strIamge,images)
                {
                    return ef.util.find(images,function(item)
                    {
                        return item.id==strIamge;
                    });

                },
                initTabs:function(){
                    var $root = impls.o.$node;
                    ef.i18n.parse();
                    $root.find('.tab-box',impls.context).tabs(impls.config.tabsConfig);
                },
                initCpuMemo:function(cpu,memo){
                    var params=impls.getParams();
                    impls.o.$cpu.empty();
                    var oldCpu=params[3].cores;
                    var oldMemo=params[4].memory;
                    var cpuFinder=ef.util.find(cpu,function(item)
                    {
                       return item==oldCpu;
                    });
                    var memoFinder=ef.util.find(memo,function(item)
                    {
                        return item==oldMemo;
                    });
                    if(!cpuFinder)
                    {
                        cpu.push(oldCpu);
                        ef.util.sortNum(cpu,true);
                    }
                    if(!memoFinder)
                    {
                        memo.push(oldMemo);
                        ef.util.sortNum(memo,true);
                    }

                    var cpuer=impls.o.$cpu.squire({
                        disabled:params[3].streamlet_params_properties_read_only,
                        data:cpu
                    });
                    impls.o.$memo.empty();
                    var memoer=impls.o.$memo.squire({
                        disabled:params[4].streamlet_params_properties_read_only,
                        data:memo
                    });

                    if(!params||!params.length)return;
                    cpuer.setSelect(params[3].cores);
                    memoer.setSelect(params[4].memory);
                    cpuer.click(function(val)
                    {
                        var params=impls.getParams();
                        if(!params||!params.length)return;
                        params[3].cores=val;
                    });
                    memoer.click(function(val)
                    {
                        var params=impls.getParams();
                        if(!params||!params.length)return;
                        params[4].memory=val;
                    });
                    if(params[3].streamlet_params_properties_hide)
                    {
                        $(".cpu_name_box",impls.context).hide();
                    }
                    if(params[4].streamlet_params_properties_hide)
                    {
                        $(".memo_name_box",impls.context).hide();
                    }
                },
                initParam:function(images){
                    var params=impls.getParams();
                    if(!params||!params.length)return;
                    $("#teamName",impls.context).textbox(
                        {
                            required:true,
                            validType: 'whitelist["0-9a-zA-Z_","字母,下划线和数字"]',
                            width:216,
                            height:30,
                            //readonly: params[0].streamlet_params_properties_read_only,
                            readonly:true,
                            value: params[0].group_name,
                            onChange:function(newValue,oldValue)
                            {
                                if(!newValue)return;
                                var params=impls.getParams();
                                if(!params||!params.length)return;
                                params[0].group_name=newValue;
                            }
                        });
                    if(params[0].streamlet_params_properties_hide)
                    {
                        $(".team_name_box",impls.context).hide();
                    }
                    $("#amount",impls.context).numberspinner(
                        {
                            required:true,
                            width:216,
                            height:30,
                            min:1,
                            max:99999,
                            readonly: Boolean(params[1].streamlet_params_properties_read_only),
                            value:params[1].amount,
                            onChange:function(newValue,oldValue)
                            {
                                if(!newValue)return;
                                var params=impls.getParams();
                                if(!params||!params.length)return;
                                params[1].amount=newValue;
                                console.log(impls.getData());
                            }
                        });
                    if(params[1].streamlet_params_properties_hide)
                    {
                        $(".amount_name_box",impls.context).hide();
                    }
                    $("#minNode",impls.context).numberspinner(
                        {
                            height:30,
                            width:216,
                            min:1,
                            max:99999,
                            readonly: Boolean(params[2].streamlet_params_properties_read_only),
                            value: params[2].limit,
                            onChange:function(newValue,oldValue)
                            {

                                if(!newValue)return;
                                var params=impls.getParams();
                                if(!params||!params.length)return;
                                params[2].limit=newValue;
                            }

                        });
                    if(params[2].streamlet_params_properties_hide)
                    {
                        $(".minnode_name_box",impls.context).hide();
                    }
                    $("#maxNode",impls.context).numberspinner(
                        {
                            height:30,
                            width:216,
                            min:1,
                            max:99999,
                            readonly: Boolean(params[7].streamlet_params_properties_read_only),
                            value: params[7].max,
                            onChange:function(newValue,oldValue)
                            {

                                if(!newValue)return;
                                var params=impls.getParams();
                                if(!params||!params.length)return;
                                params[7].max=newValue;
                            }

                        });
                    if(params[7].streamlet_params_properties_hide)
                    {
                        $(".maxnode_name_box",impls.context).hide();
                    }
                    $('.sys-capacity',impls.context).numberspinner({
                            height:30,
                            width:212,
                            min:1,
                            max:99999,
                            required:true,
                            readonly: Boolean(params[5].streamlet_params_properties_read_only),
                            value: params[5].disk_capacity,
                            onChange:function(newValue,oldValue)
                            {
                                if(!newValue)return;
                                var params=impls.getParams();
                                if(!params||!params.length)return;
                                params[5].disk_capacity=newValue;
                            }
                    });
                    if(params[5].streamlet_params_properties_hide)
                    {
                        $(".sys_name_box",impls.context).parent().hide();
                    }

                    $('.sys-mirror',impls.context).combobox({
                        height:30,
                        width:212,
                        textField:'name',
                        valueField:'id',
                        required:true,
                        editable:false,
                        data:images,
                        readonly:params[6].streamlet_params_properties_read_only,
                        value:impls.utils.noDeleteImage(params[6].image,images)?params[6].image:undefined,
                        onChange:function(newValue,oldValue)
                        {
                            if(!newValue)return;
                            var params=impls.getParams();
                            if(!params||!params.length)return;
                            params[6].image=newValue;
                        }
                    });
                    if(params[6].streamlet_params_properties_hide)
                    {
                        $(".image_name_box",impls.context).parent().hide();
                    }

                },
                initImage:function(){
                    ef.getJSON({
                        url:api.getAPI("manorImage"),
                        type:'get',
                        dataType:'json',
                        useLocal:isLocal
                    }).success(function(response){
                        $('#'+comboxId).combobox({
                            data:response
                        });
                        if(callback){
                            callback(response);
                        }
                    }).error(function(error){
                        console.log(error);
                    });
                }
            };
            impls.o = {
                $node:$('#node-type',impls.context),
                $cpu:$('.cpuRange',impls.context),
                $memo:$('.memRange',impls.context),
                $visTool:$('.toggle-box',impls.context),
                $sysCapacity:$('.sys-capacity',impls.context),
                $sysMirror:$('.sys-mirror',impls.context)
            };
            impls.config = {
                tabsConfig:{
                    border:false,
                    onSelect:function(title, index){

                    }
                },
                mirrorConfig:{
                    valueField:'id',
                    textField:'name'
                }
            };
            //impls.utils.initCodeMirror();
            impls.utils.initTabs();
            this.owner.getImages(function(resp)
            {
                impls.utils.initParam(resp);
                impls.isAllManorAddHide();

            });
            this.owner.getCPUMemo(function(cpu,memo)
            {
                impls.utils.initCpuMemo(cpu,memo);
                impls.cover.hide();
                impls.isAllManorAddHide();
            });

        };

        this.implement=impls;
    }
});

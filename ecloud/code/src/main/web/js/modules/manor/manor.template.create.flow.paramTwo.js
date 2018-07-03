/**
 * Created by hxf on 2016/5/13.
 */
define(["exports","module","domReady","api","setting.param"],function(exports,module,domReady,api,settingParam)
{
    var implement=new ef.Interface.implement();
    implement.param_cpu_active = null;
    implement.param_memo_active = null;
    implement.nameChoose = null;
    implement.countChoose = null;
    implement.limitChoose = null;
    implement.cpuChoose = null;
    implement.memoChoose = null;
    implement.imageChoose = null;
    implement.diskChoose = null;
    implement.maxChoose=null;
    implement.owner=null;
    implement.context=null;
    implement.callback= $.noop;
    implement.init = function () {
        var data = [{label:ef.util.getLocale("apply.template.checkbox.data.readOnly"),value:"readOnly"},{label:ef.util.getLocale("apply.template.checkbox.data.hide"),value:"hide"}];
        var data2=[{label:ef.util.getLocale("apply.template.checkbox.data.readOnly"),value:"readOnly",isAlwaysSelected:true},{label:ef.util.getLocale("apply.template.checkbox.data.hide"),value:"hide"}];//
        implement.nameChoose = $("#paramGroupChoose",implement.context).checkinfo({
            dataProvider:data2,
            disabled:implement.owner&&implement.owner.disable,
            className:"checkInfo_choose"
        });
        implement.countChoose = $("#paramCountChoose",implement.context).checkinfo({
            dataProvider:data,
            disabled:implement.owner&&implement.owner.disable,
            className:"checkInfo_choose"
        });
        implement.limitChoose = $("#paramLimitChoose",implement.context).checkinfo({
            dataProvider:data,
            disabled:implement.owner&&implement.owner.disable,
            className:"checkInfo_choose"
        });
        implement.maxChoose=$("#paramMaxChoose",implement.context).checkinfo({
            dataProvider:data,
            disabled:implement.owner&&implement.owner.disable,
            className:"checkInfo_choose"
        });
        implement.cpuChoose = $("#cpuChoose",implement.context).checkinfo({
            dataProvider:data,
            disabled:implement.owner&&implement.owner.disable,
            className:"choose_cpu_memo"
        });
        implement.memoChoose = $("#memoChoose",implement.context).checkinfo({
            dataProvider:data,
            disabled:implement.owner&&implement.owner.disable,
            className:"choose_cpu_memo"
        });
        implement.imageChoose = $("#imageChoose",implement.context).checkinfo({
            dataProvider:data,
            disabled:implement.owner&&implement.owner.disable,
            className:"choose_cpu_memo"
        });
        implement.diskChoose = $("#diskChoose",implement.context).checkinfo({
            dataProvider:data,
            disabled:implement.owner&&implement.owner.disable,
            className:"choose_cpu_memo"
        });
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
            implement.param_cpu_active = $(".param_cpu_active",implement.context).squire({
                disabled:implement.owner&&implement.owner.disable,
                data:String(cpuRange).split("/")
            });
            implement.param_memo_active = $(".param_memo_active",implement.context).squire({
                disabled:implement.owner&&implement.owner.disable,
                data:String(memRange).split("/")
            });
            implement.callback();
        });

        $("#paramGroupName",implement.context).textbox({
            height:30,
            width:220,
            required:true,
            disabled:implement.owner&&implement.owner.disable,
            validType: 'whitelist["0-9a-zA-Z_","字母,下划线和数字"]',
            onChange:function(newValue,oldValue)
                {
                    //if(oldValue!="")
                    //{
                        if(newValue!=oldValue)
                        {
                            if(implement.owner&&implement.owner.isInstall&&implement.owner.isMange)
                            {
                                ef.event.trigger("manor.group.change",implement.owner);
                            }
                        }
                    //}


                }
        });
        /*$("#paramGroupName",implement.context).siblings('span').find('.textbox-text').blur(function () {
            if(implement.owner.isClash($("#paramGroupName",implement.context).textbox('getValue')))
            {
                ef.placard.warn("组名称不能重复");
                $("#paramGroupName",implement.context).textbox("setValue","");
            }
        });*/
        $("#paramGroupName",implement.context).textbox({
            onChange: function (newValue) {
                if(implement.owner.isClash(newValue))
                {
                    ef.placard.warn("组名称不能重复");
                    $("#paramGroupName",implement.context).textbox("setValue","");
                }
            }
        });
        $("#paramGroupCount",implement.context).numberspinner({
            height:30,
            width:220,
            min:1,
            max:99999,
            disabled:implement.owner&&implement.owner.disable,
            required:true});
        $("#paramMaxCount",implement.context).numberspinner({
            height:30,
            width:220,
            min:1,
            max:99999,
            disabled:implement.owner&&implement.owner.disable,
            required:true});
        $("#paramNodeCount",implement.context).numberspinner({
            height:30,
            width:220,
            min:1,
            max:99999,
            disabled:implement.owner&&implement.owner.disable,
            required:true});
        $("#paramImage",implement.context).combobox({
            height:30,
            width:220,
            textField:'name',
            valueField:'id',
            editable:false,
            disabled:implement.owner&&implement.owner.disable,
            required:true});
        $("#paramDisk",implement.context).numberspinner({height:30,width:220,required:true,min:1,max:99999,disabled:implement.owner&&implement.owner.disable});
    };
    implement.checkSet = function (il,dom) {
        if(il.streamlet_params_properties_hide==true){dom.setSelect("hide");}
        if(il.streamlet_params_properties_read_only==true){dom.setSelect("readOnly");}
    };
    implement.redraw = function (param,owner,context) {
        this.context=context||document;
        this.owner=owner;
        this.init();
        ef.getJSON({
            url:api.getAPI("order.wait.Detail.combo.image"),
            type:"get",
            data:{type:1},
            success: function (response) {
                var resData = [];
                $(response).each(function (i,il) {
                    if(il.status=="active"){
                        resData.push(il);
                    }
                });
                $("#paramImage",implement.context).combobox({data:resData,disabled:implement.owner&&implement.owner.disable});
                if(param&&param!=undefined){
                    var useData;
                    if(param.data.body.data.nodes._data[param.id][param.id]){
                        useData = param.data.body.data.nodes._data[param.id][param.id].params;
                    }
                    if(param.type=="create_nodes"){
                        $(useData).each(function (i,il) {
                            if(il.group_name){
                                $("#paramGroupName",implement.context).textbox('setValue',il.group_name);
                                implement.checkSet(il,implement.nameChoose);
                            }
                            if(il.amount){$("#paramGroupCount",implement.context).textbox('setValue',il.amount);implement.checkSet(il,implement.countChoose);}
                            if(il.limit){$("#paramNodeCount",implement.context).textbox('setValue',il.limit);implement.checkSet(il,implement.limitChoose);}
                            if(il.max){$("#paramMaxCount",implement.context).textbox('setValue',il.max);implement.checkSet(il,implement.maxChoose);}
                            if(il.cores){implement.param_cpu_active.setSelect(il.cores);implement.checkSet(il,implement.cpuChoose);}
                            if(il.memory){implement.param_memo_active.setSelect(il.memory);implement.checkSet(il,implement.memoChoose);}
                            if(il.disk_capacity){$("#paramDisk",implement.context).numberspinner('setValue',il.disk_capacity);implement.checkSet(il,implement.diskChoose);}
                            if(il.image){
                                var image;
                                var finder=ef.util.find(response,function(itl)
                                {
                                    return itl.id==il.image;
                                });
                                if(finder)
                                {
                                    image=finder.name;
                                    $("#paramImage",implement.context).combobox('setText',image).combobox('setValue',il.image);
                                }else
                                {
                                    //image=ef.util.getLocale("apply.templates.image.noexist");
                                    //$("#paramImage",implement.context).combobox('setText',image);
                                }
                                implement.checkSet(il,implement.imageChoose);
                            }
                        });
                    }
                }
            }
        });
    };
    implement.setCallback=function(fn)
    {
        this.callback=fn|| $.noop;
    };
    implement.destroy=function()
    {
        require.undef(module.id);
    };
    return implement;
});
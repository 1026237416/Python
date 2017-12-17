/**
 * Created by 韩雪飞 on 2015/11/20.
 */
define(["easyui", "clientPaging", "echart","module","user","api","setting.param","cal.host.hostDetail"], function (eu,client,ec,module,user,api,settingParam,calHostHostDetail) {
    var implement = new ef.Interface.implement();
    var $bkspan;
    implement.init=function()
    {
        this.isForce=true;
        settingParam.getList(this.isForce,function(response)
        {
            var cpuRange=ef.util.find(response,function(record)
            {
                return record.name=="compute.cpu_range";
            }).value;
            var memRange=ef.util.find(response,function(record)
            {
                return record.name=="compute.memory_range";
            }).value;
            var cpuValue=ef.Dialog.getDialog('hostDetailquota').param.quotaData.cores;
            var memoValue=ef.Dialog.getDialog('hostDetailquota').param.quotaData.memory_mb/1024;
            cpuRange=cpuRange.split("/");
            memRange=memRange.split("/");

            $("#memoinput").empty().val(memoValue);
            $("#cpuinput").empty().val(cpuValue);
            $("#memoslider").slider(
                {
                    showTip: false,
                    rule: memRange,
                    value: memRange.indexOf(String(memoValue)),
                    min: 0,
                    max: memRange.length-1,
                    step: 1,
                    tipFormatter:function(value){
                        return Math.pow(2,value/1);
                    },
                    onComplete: function (value) {
                        $("#memoinput").empty().val(memRange[value]);
                    },
                    onChange:function(value)
                    {
                        if(value < 1 ){
                            $('.memobk').css('width',0)
                        }else{
                            implement.leftMove('memobk');
                        }
                        $("#ok").css("opacity",1);
                        $("#memoinput").empty().val(memRange[value]);
                    }
                }
            );
            $("#cpuslider").slider(
                {
                    showTip: false,
                    rule: cpuRange,
                    value:cpuRange.indexOf(String(cpuValue)),
                    min: 0,
                    max: cpuRange.length-1,
                    step: 1,
                    tipFormatter:function(value){
                        return Math.pow(2,value/1);
                    },
                    onComplete: function (value) {
                        $("#cpuinput").empty().val(cpuRange[value]);
                    },
                    onChange:function(value)
                    {
                        if(value < 1){
                            $('.cpubk').css('width',0);
                        }else{
                            implement.leftMove('cpubk',value);
                        }
                        $("#ok").css("opacity",1);
                        $("#cpuinput").empty().val(cpuRange[value]);

                    }
                }
            );
            implement.addBkColor('cpuslider','cpubk');
            implement.addBkColor('memoslider','memobk');
        });
    };
    implement.addBkColor = function(ele,clss) {
        $bkspan = $('#'+ele).next().append('<div class=\"'+clss+'\"></div>');
        var dom;
        if(ele == 'cpuslider'){dom = $('.hostDetailcpu .slider-handle')}
        else {dom = $('#hostDetailmemo .slider-handle')}
        var bkWidth = parseInt(dom.css('left'))-7+'px';
        $('.'+clss).css({
            position: 'relative',
            zIndex: 100,
            backgroundColor: '#52A5F3',
            width:bkWidth,
            height:'10px',
            borderRadius:'5px 0 0 5px',
            top:'-3px'
        })
    };
    implement.leftMove = function(ele,value){
        var eleWidth;
        if(ele == 'cpubk'){
              eleWidth = parseInt($('.hostDetailcpu .slider-handle').css('left'))-7+'px';
        }else{
              eleWidth = parseInt($('#hostDetailmemo .slider-handle').css('left'))-7+'px';
        }
        $('.'+ele)[0].style.width = eleWidth;
    };
    implement.redraw = function (){
        $(document).ready(function () {
            $("#hostDetailquota-cpu").append(ef.util.getLocale('cal.host.choose.quata.cpu'));
            $("#hostDetailquota-memo").append(ef.util.getLocale('cal.host.choose.quata.memo'));
            $("#addhostquato_cancel").append(ef.util.getLocale('global.button.cancel.label'));
            $("#addhostquato_ok").append(ef.util.getLocale('global.button.confirm.label'));
            $("#cpuunit").append(ef.util.getLocale('cal.host.util'));
            $("#memoGB").append(ef.util.getLocale('cal.host.GB'));
            var cpuValue=ef.Dialog.getDialog('hostDetailquota').param.quotaData.cores;
            var memoValue=ef.Dialog.getDialog('hostDetailquota').param.quotaData.memory_mb/1024;
            ef.localStorage.put("cpu",cpuValue);
            ef.localStorage.put("memo",memoValue);
            $("#ok").css("opacity",0.4);
            implement.init();
            $(".cpu_memo").append("配置："+cpuValue+"核"+memoValue+"GB");
            $("#addhostquato_ok").click(function(){
                if($("#ok").css("opacity")==1){
                    ef.loading.show();
                    var cpu = Number($("#cpuinput").val());
                    var memo = Number($("#memoinput").val()*1024);
                    var sendArr=[];
                        ef.getJSON({
                            url: api.getAPI("cal.host.getHostlist")+"/"+ef.localStorage.get("hostDetail_id")+"/setting",
                            type: "post",//get,post,put,delete
                            isForce: true,
                            data:{
                                "cores":cpu,
                                "memory":memo
                            },
                            success: function (response) {
                                ef.loading.hide();
                                $(".data_format").text(cpu+"核 "+memo/1024+"GB");
                                ef.Dialog.closeAll();
                                ef.nav.reload();
                            },
                            error: function (error) {
                                ef.loading.hide();
                                ef.placard.show(error.msg);
                            }
                        });
                    //}
                }
            });
            $("#addhostquato_cancel").click(function(){
                ef.Dialog.closeAll();
            });
        })
    };
    implement.destroy=function()
    {
        require.undef(module.id);
    };
    return implement;
});
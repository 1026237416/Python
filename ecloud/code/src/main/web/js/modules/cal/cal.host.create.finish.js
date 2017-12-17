/**
 * Created by yezi on 2016/5/27.
 */
define([
    'module'
],function(module){
    var impls = new ef.Interface.implement();
    impls.redraw = function(){
        impls.init();
    };
    impls.destroy = function(){
        require.undef(module.id);
    };
    impls.init=function(){
        impls.utils.renderPage(impls.utils.getData());
        impls.utils.sendData();
    };
    impls.o={
        $name:$('#overname'),
        $user:$('#overuser'),
        $os:$('#overos'),
        $switch:$('#overaddhostswitch'),
        $host:$('#overhost'),
        $config:$('#overconfig'),
        $amount:$('#overamount'),
        $project:$('#overproject'),
        $img:$('#overimage'),
        $save:$('#oversave'),
        $ip:$('#overip'),
        $vlan:$('#overvlan'),
        $vlans:$('#vlanshows'),
        $sys_volume:$('#sys_volume')
       // $lnetamount:$('#netamount')
    };
    impls.utils={
        renderPage:function(pageData){
            var obj=impls.o;
            //显示数据
            obj.$name.text(pageData.vmName);
            obj.$user.text(function(){
                if(pageData.tent==undefined){
                    return "未分配";
                }else{
                    return pageData.tent;
                }
            });
            obj.$os.text(pageData.system);
            obj.$switch.switch(impls.config.switchConfig);
            obj.$host.text(pageData.svm.name);
            obj.$config.text(pageData.cpu_range+ef.util.getLocale("cal.host.util")+pageData.memory_range+ef.util.getLocale("cal.host.GB"));
            obj.$amount.text(pageData.vmNum);
            obj.$project.text(pageData.pro);
            obj.$img.text(pageData.img);
            obj.$save.text(function(){
                return pageData.default_type.name;
                /*if(pageData.default_type==undefined){
                    return "-";
                }else{
                    return pageData.default_type;
                }*/
            });
            //obj.$ip.text(pageData.ip);
            //obj.$vlan.text(pageData.vlan);
            obj.$sys_volume.text(pageData.lsys_volume+"GB");
            //obj.$lnetamount.text(pageData.vlannum);
            $(pageData.vlans).each(function(i,il){
                var ip=il.ip.name,vlan=il.vlan.name,host=il.host.name,subnet=il.subnet.name;
                var tem='<li><span class="net vlancontent">'+host+'</span><span class="vlan vlancontent">'+vlan+'</span><span class="childnet vlancontent">'+subnet+'</span><span class="ip vlancontent">'+ip+'</span></li>';
             obj.$vlans.append(tem);
            });
            if(pageData.vlans.length>=2){
                $(".water-mark").css({"display":"none"});
            }

            //国际化
            $("#lname").append(ef.util.getLocale("cal.host.datadish.name"));
            $("#luser").append(ef.util.getLocale("cal.host.hostName"));
            $("#los").append(ef.util.getLocale("cal.host.os"));
            $("#lclosewarn").append(ef.util.getLocale("cal.host.hostDetail.hostdetaildescript.openclosefield"));
            $("#lhost").append(ef.util.getLocale("cal.host.lhost"));
            $("#lconfig").append(ef.util.getLocale("cal.host.lconfig"));
            $("#lamount").append(ef.util.getLocale("cal.host.lamount"));
            $("#1project").append(ef.util.getLocale("cal.host.lproject"));
            $("#limage").append(ef.util.getLocale("cal.host.limage"));
            $("#lsave").append(ef.util.getLocale("cal.host.saveType"));
            $("#lsys_volume").append(ef.util.getLocale("cal.host.lsys_volume"));
            //$("#lnetamount").append(ef.util.getLocale("cal.host.lnetamount"));
            $("#net").append(ef.util.getLocale("cal.host.net"));
            $("#lip").append("IP");
            $("#lvlan").append("VLAN");
        },
        getData:function(){
            var dataAll = ef.localStorage.get('cal.host.create').children;
            var data={};
            for(var i= 0;i<dataAll.length;i++){
                if(i==0){
                    data.vmName=dataAll[i].viewData.vmName;
                    data.vmNum=dataAll[i].viewData.vmNum;
                    data.pro=dataAll[i].viewData.pro.name;
                    data.tent=(function(){
                        if(dataAll[i].viewData.tent==undefined){
                            return dataAll[i].viewData.tent;
                        }else{
                            return dataAll[i].viewData.tent.displayname;
                        }
                    })();
                    data.default_type=dataAll[i].viewData.default_type;
                    data.switch_type=dataAll[i].viewData.switch_type;
                    data.system=dataAll[i].viewData.system;
                    data.img=dataAll[i].viewData.img.name;
                }
                else if(i==1){
                    data.cpu_range=dataAll[i].viewData.cpu_range;
                    data.memory_range=dataAll[i].viewData.memory_range;
                   /* data.default_type=dataAll[i].viewData.default_type;
                    data.switch_type=dataAll[i].viewData.switch_type;*/
                    data.topic=dataAll[i].viewData.topic;
                    data.lsys_volume=dataAll[i].viewData.lsys_volume;
                }
                else if(i==2){
                    //data.vlan=dataAll[i].viewData.vlan.name;
                    //data.ip=dataAll[i].viewData.ip.ip;
                    data.vlans=dataAll[i].viewData.network;
                    //data.vlannum=data.vlans.length;
                    data.svm=dataAll[i].viewData.svm;
                    data.desc=dataAll[i].viewData.desc;
                }
            }
            return data;
        },
        sendData:function(){
            var dataAll = ef.localStorage.get('cal.host.create').children;
            var overData={
                "cores":parseInt(dataAll[1].viewData.cpu_range),//虚拟机内核数
                "memory": parseInt(dataAll[1].viewData.memory_range)*1024,//虚拟机内存（MB）
                "image": dataAll[0].viewData.img.id,//虚拟机镜像ID
                "tenant": dataAll[0].viewData.pro.id,//项目id
                "host": (function(){
                        if(String(dataAll[2].viewData.svm.id).indexOf('strategy') != -1){
                                return '';
                        }else{
                            return dataAll[2].viewData.svm.name;
                        }
                })(),//宿主机名称--->1:undefined,2:策略,3：宿主机
                "num": parseInt(dataAll[0].viewData.vmNum),//云主机数量
                "size":parseInt(dataAll[1].viewData.lsys_volume),
                "network":(function(){
                    var arr=[];
                    $(dataAll[2].viewData.network).each(function(i,il){
                        var ip=String(il.ip.value).indexOf('*') > -1? "":il.ip.value;
                        var subnet=il.subnet.value;
                        var vlan=il.vlan.value;
                        arr[i]={
                            "vlan":vlan,
                            "subnet":subnet,
                            "ip":ip
                        };
                    });
                    return arr;
                })(),
                "metadata":{
                    "user":(function(){
                        if(dataAll[0].viewData.tent&&dataAll[0].viewData.tent.id){
                            return dataAll[0].viewData.tent.id
                        }else{
                            return "";
                        }
                    })(),//用户ID,
                    "extend":{
                        "des":dataAll[2].viewData.desc,//虚拟机备注
                        "displayname":dataAll[0].viewData.vmName,//虚拟机别名
                        "keepalive":(function(){
                            if(dataAll[0].viewData.switch_type){
                                return 1;
                            }else{
                                return 0;
                            }
                        })()//虚拟机关机警告
                },
                "sys_volume":{
                    "type":(function(){
                        if(dataAll[0].viewData.default_type.id== ''){
                            return '';
                        }else{
                            return dataAll[0].viewData.default_type.name;
                        }
                       /* if(dataAll[1].viewData.default_type==undefined){
                            return " ";
                        }else{
                            return dataAll[1].viewData.default_type;
                        }*/
                    })()//系统盘类别
                }
            }
        };
            dataAll[3].viewData = overData;
        }
    };
    impls.config = {
        switchConfig:{
            checked: impls.utils.getData().switch_type,
            disabled:true,
            onLabel:ef.util.getLocale('cal.create.vm.switch.on'),
            offLabel:ef.util.getLocale('cal.create.vm.switch.off')
        }
    };
    return impls;
});
/**
 * Created by thomas on 2016/5/23.
 */
define([
    'module',
    'exports',
    'api',
    'domReady',
    'setting.param'
],function(module, exports, api, domReady,settingParam){
    var isLocal = false,
        operate = null,
        sys = null,
        viewData = {},
        switchBtn = null,
        basic = ef.localStorage.get('cal.host.create');
    var impls = new ef.Interface.implement();
    impls.redraw = function(){
        domReady(function(){
            impls.utils.initSys();
            impls.utils.initText();
            impls.utils.initProCombox();
            impls.utils.initSwitch();
            impls.o.$lvmtip.text(ef.util.getLocale("cal.host.lvm.tip"));
            //init storage
            impls.utils.getParamData(function(data){
                var storage = _.find(data,function(item){
                    return item.name == 'storage.default_type';
                });
                if(storage){
                    //create default select for storage combox
                    var temp = {
                        name:ef.util.getLocale('cal.host.hostDetail.create.config'),
                        id:'',selected:true
                    };
                    if(storage.value == 'lvm'){
                        //set default type id = lvm
                        //for judge isLvm as default
                        temp.id = 'lvm';
                        impls.utils.lvmStateToggle(true);
                    }else{
                        impls.utils.lvmStateToggle(false);
                    }
                    impls.utils.initDefaultType(temp);
                }
            });
            //设置resultList 描述换行
            $('#resultBox > div > div:last > div:last > ul > li:last > span:first').css('height', '80px')
            $('#resultBox > div > div:last > div:last > ul > li:last > span:last').css({
                'word-wrap': 'break-word',
                'white-space': 'normal',
                'word-break': 'break-all',
                width: '60%',
                height: '80px'
            })
        });
    };
    impls.destroy = function(){
        require.undef(module.id);
    };
    impls.o = {
        $sys:$('#sys-list'),
        $vmName:$('#cal_vm_name'),
        $vmNum:$('#cal_vm_num'),
        $pro:$('#cal_pro'),
        $tent:$('#cal_tent'),
        $img:$('#cal_img'),
        $switch:$('#addhostswitch'),
        $default_type:$("#cal_default_type"),
        $lvmtip:$("#lvm-message")
        /* $default_type:$(".saveRange")*/
    };
    impls.clearResultList = function(type) {
        switch (type){
            case 'pro':
                way.set("resultData.ip", ' ');

        }
    };
    impls.utils = {
        initSwitch:function(){
            switchBtn = impls.o.$switch.switch(impls.config.switchConfig);  //高亮按钮
            viewData.switch = false;
            way.set("resultData.ha",viewData.switch?"开":"关");
        },
        lvmStateToggle:function(flag){
            //set number spinner could
            //not trigger number change event
            impls.config.notTriggerNumEvent = true;
            if(flag){
                $('#lvm-message').addClass('localtip').show();
                $('#cal_vm_num').numberspinner('setValue',1);
                $('#cal_vm_num').numberspinner('disable');
                switchBtn.toSwitch(false);
                switchBtn.setDisable(true);
                viewData.switch = false;
                //prepare lvm flag for net page
                ef.localStorage.put("defaulttype",'lvm');
            }else{
                $('#lvm-message').removeClass('localtip').hide();
                $('#cal_vm_num').numberspinner('enable');
                switchBtn.setDisable(false);
                //prepare lvm flag for net page
                ef.localStorage.delete("defaulttype");
            }
            impls.config.notTriggerNumEvent = false;
            way.set("resultData.ha",viewData.switch?"开":"关");
        },
        getParamData:function(callback){
            var callback = callback || $.noop;
            ef.getJSON({
                url:api.getAPI('global.param'),
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
        initDefaultType:function(firstSelect){
            impls.utils.getStorageType(function(data){
                data.unshift(firstSelect);
                //init page will not add default_type
                viewData.default_type = firstSelect;
                way.set("resultData.store",firstSelect.name);
                $("#cal_default_type")
                    .combobox({data:data});
            });
        },
        getStorageType:function(callback){
            if(!callback){
                return;
            }
            ef.getJSON({
                url:api.getAPI('volumn.type'),
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
        getComboxData:function(isLocal, serverName, option){
            var url = api.getAPI(serverName);
            var options = $.extend({},option);
            if(!options.callback){
                return;
            }
            if(!isLocal && options.param){
                url += options.param;
            }
            ef.getJSON({
                url:url,
                type:'get',
                dataType:'json',
                useLocal:isLocal,
                success:function(response){
                    options.callback(response);
                },
                error:function(error){
                    console.log(error);
                }
            });
        },
        initProCombox:function(){
            impls.utils.getComboxData(isLocal,'setting.project.datagrid_tenants',{
                callback:function(response){
                    impls.o.$pro.combobox({
                        data:response
                    });

                }
            });
        },
        initImageCombox:function(){
            if(sys == null){return;}
            impls.o.$img.combobox('clear');
            impls.utils.getComboxData(isLocal,'order.wait.Detail.combo.image',{
                param:'?'+ $.param({
                    os:sys,
                    status:'active',
                    type:0
                }),
                callback:function(response){
                    //format for ISO
                    var formatStr = '';
                    _.each(response,function(item){
                        if(item.disk_format &&
                           (formatStr = String(item.disk_format).toUpperCase()) == 'ISO'){
                            item.name =  item.name + '('+formatStr+')';
                        }
                    });
                    impls.o.$img.combobox({
                        data:response
                    });
                }
            });
        },
        initUserCombox:function(value){
            impls.utils.getComboxData(isLocal,'setting.project.datagrid_project',{
                param:'/'+value+'/users',
                callback:function(response){
                    var dataArr = [];
                    _.each(response, function(il, i){
                        if( il.displayname ){
                                dataArr.push(il)
                        }
                    });
                    dataArr.unshift({displayname:"\u672A\u5206\u914D",id:"",selected:true});
                    var userCombox = impls.o.$tent.combobox({disabled:false});
                    userCombox.combobox({
                        data:dataArr
                    });
                }
            });
        },
        initSys:function(){
            operate = impls.o.$sys.squire(impls.config.sysConfig);
            impls.o.$sys.children(':odd:not(:last)').addClass('cal-sys-right');
            operate.click(function(data,orginData){
                sys = data;
                impls.utils.initImageCombox();
                way.set("resultData.os",'<div><i class="small_icon_style s'+orginData.iconClass+'"></i>'+'<span>'+orginData.text+'</span></div>');
                if(way.get("resultData.image") != '' ) {
                    way.set("resultData.image", ' ')
                }
            });
            impls.o.$sys.children(':last').addClass('cal-sys-right');
        },
        initText:function(){
            var $obj = impls.o,
                config = impls.config;
            $obj.$vmName.textbox(config.vmNamConfig);
            $obj.$vmNum
                .numberspinner(config.vmNumConfig)
                .numberspinner('setValue',1);
            way.set("resultData.account",1);
            $obj.$pro.combobox(config.proConfig);
            $obj.$tent.combobox(config.tentConfig);
            $obj.$img.combobox(config.imageConfig);
            $obj.$default_type.combobox(config.defaultTypeConfig);
            //way.set("resultData.store",(ef.localStorage.get("defaulttype")=="lvm"||!ef.localStorage.get("defaulttype"))?"默认":ef.localStorage.get("defaulttype"));
        },
        isValid:function(){
            var isValid = false;
            var $obj = impls.o;
            var temp = [
                $obj.$vmName.textbox('isValid'),
                $obj.$pro.combobox('isValid'),
                $obj.$img.combobox('isValid'),
                $obj.$vmNum.numberspinner('isValid')
            ];
            isValid = _.find(temp,function(result){
                return result === false;
            });
            if(sys == null){
                return false;
            }
            if(isValid == null){
                impls.utils.getSelectedValue();
                return true;
            }
            return isValid;
        },
        getSelectedValue:function(){
            var temp = basic.children[0];
            var $obj = impls.o;
            var data = {
                vmName:$obj.$vmName.textbox('getValue'),
                vmNum: $obj.$vmNum.numberspinner('getValue'),
                pro:   viewData.pro,
                tent:  viewData.tent,
                img:   viewData.img,
                system: sys,
                switch_type: viewData.switch,
                default_type: viewData.default_type

            };
            temp.viewData = data;
        }
    };
    impls.config = {
        notTriggerNumEvent:false,
        switchConfig:{
            checked:false,
            disabled:true,
            onLabel:ef.util.getLocale('cal.create.vm.switch.on'),
            offLabel:ef.util.getLocale('cal.create.vm.switch.off'),
            change: function (checked){
                viewData.switch = checked;
                way.set("resultData.ha",checked?"开":"关");
            }
        },
        defaultTypeConfig:{
            textField:'name',
            valueField:'id',
            required:true,
            editable:false,
            prompt:ef.util.getLocale('order.wait.validate.default'),
            onSelect:function(value){
                if(value == null){
                    return;
                }
                if(value.name == 'lvm' || value.id == 'lvm'){
                    impls.utils.lvmStateToggle(true);
                    //lvm will effect svm filter
                    if(basic.children[2].loaded){
                        ef.event.trigger('calLvmEvent');
                    }
                }else{
                    impls.utils.lvmStateToggle(false);
                }
                viewData.default_type = value;
                way.set("resultData.store",value.name);
            },
            onChange:function()
            {
                $(".tooltip").hide();
            }
        },
        imageConfig:{
            textField:'name',
            valueField:'id',
            required:true,
            editable:false,
            prompt:ef.util.getLocale('order.wait.validate.image'),
            onSelect:function(value){
                if(value == null){
                    return;
                }
                viewData.img = value;
                $('#cal_vm_num').numberspinner('enable');
                //handle default lvm
                var storageValue = $('#cal_default_type').combobox('getValue'),
                //handle select lvm
                    storageText = $('#cal_default_type').combobox('getText');
                //prevent trigger number event
                impls.config.notTriggerNumEvent = true;
                if(storageValue == 'lvm' || storageText == 'lvm'){
                    $('#cal_vm_num').numberspinner('setValue',1)
                        .numberspinner('disable');
                }
                if(value.disk_format &&
                   String(value.disk_format).toUpperCase() == 'ISO'){
                    $('#cal_vm_num').numberspinner('setValue',1)
                        .numberspinner('disable');
                }
                impls.config.notTriggerNumEvent = false;
                if(basic.children[1].loaded){
                    ef.event.trigger('calImageEvent',value);
                }
                way.set("resultData.image",value.name);

                if($('#configSlider')[0]){
                    way.set('resultData.capability', $('#configSlider').slider('getValue'))
                }
            },
            onChange:function()
            {
                $(".tooltip").hide();
            }
        },
        tentConfig:{
            textField:'displayname',
            valueField:'id',
            editable:false,
            disabled:true,
            prompt:ef.util.getLocale('setting.user.userlist.delete.null'),
            onSelect:function(value){
                if(value == null){
                    way.set("resultData.user","未分配");
                    return;
                }
                if(value.id == ''){
                    value = (void 0);
                }
                viewData.tent = value;
                way.set("resultData.user",value&&value.displayname?value.displayname:"未分配");
            },
            filter:function(q,row){
                var opts = $(this).combobox('options');
                q= q.toLowerCase();
                return (row[opts.textField].toLowerCase()).indexOf(q)!=-1;
            },
            onHidePanel: function(){
                var opt = $(this).combobox('options');
                var data = opt.data;
                var val = $(this).combobox('getText');
                var index = _.findKey(data, function (item) {
                    return item.displayname == val
                });
                if(!index){
                    $(this).combobox('setValue', '');
                    way.set("resultData.user", ' ');

                }
            }
        },
        proConfig:{
            textField:'name',
            valueField:'id',
            required:true,
            filter:function(q,row){
                var opts = $('#cal_pro').combobox('options');
                q= q.toLowerCase();
                return (row[opts.textField].toLowerCase()).indexOf(q)!=-1;
            },
            prompt:ef.util.getLocale('network.vlan.search-item.combobox.vlan-combo'),
            onSelect:function(value){
                if(value == null){
                    return;
                }
                if(viewData.pro && viewData.pro.id != value.id){
                    basic.children[2].loaded = false;
                }
                viewData.pro = value;
                impls.utils.initUserCombox(value.id);
                way.set("resultData.project",value.name);
                way.set("resultData.user","未分配");
                way.set('resultData.nets','')
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
                    way.set("resultData.project", ' ');
                }
            }
        },
        vmNumConfig:{
            min: 1,
            max: 100,
            required:true,
            editable: true,
            onChange:function(newValue, oldValue){
                if(oldValue == '' && newValue == oldValue ||
                    !basic.children[2].loaded ||
                    impls.config.notTriggerNumEvent ){
                    impls.config.notTriggerNumEvent = false;
                    way.set("resultData.account",newValue);
                    return;
                }
                ef.event.trigger('calNumberChangeEvent',{num: newValue});
                way.set("resultData.account",newValue);
            }
        },
        vmNamConfig:{
            required:true,
            maxlength:15,
            minlength:1,
            validType: 'whitelist["\uFF08\uFF09\(\)\.\u4E00-\u9FA5A-Za-z0-9_-",ef.util.getLocale("cal.host.vmName")]',
            onChange:function(newValue,oldValue)
            {
                if(newValue == ''){
                    newValue = ' '
                }
                way.set("resultData.name",newValue);
            }
        },
        sysConfig:{
            allBackClass:"operate",
            data:[
                {
                    iconClass:"icon1",
                    text:"windows"
                },
                {
                    iconClass:"icon2",
                    text:"centos"
                },
                {
                    iconClass:"icon3",
                    text:"ubuntu"
                },
                {
                    iconClass:"icon4",
                    text:"redhat"
                },
                {
                    iconClass:"icon5",
                    text:"suse"
                },
                {
                    iconClass:"icon6",
                    text:"fedora"
                },
                {
                    iconClass:"icon7",
                    text:"debian"
                },
                {
                    iconClass:"icon8",
                    text:"neokylin"
                }
            ]
        }
    };
    return impls;
});
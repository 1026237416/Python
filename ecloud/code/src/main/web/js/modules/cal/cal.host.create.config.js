/**
 * Created by yezi on 2016/5/25.
 */
define([
    'module',
    'exports',
    "setting.param",
    "api"
],function(module, exports, settingParam,api){
    var isLocal = false,
        viewData = {},
        basic = ef.localStorage.get('cal.host.create');
    var impls = new ef.Interface.implement();
    var cpuQuota,memoQuota;
    impls.redraw = function(){
        impls.init();
    };
    impls.destroy = function(){
        require.undef(module.id);
    };
    impls.init=function(){
        impls.utils.getStorageType(function(response){
            viewData.storage = _.map(response,function(store){
                return store.name;
            });
            impls.utils.globalParam(impls.utils.prepareData);
        });
        ef.event.on("calImageEvent", function (event, value) {
            if($('#configSlider').slider('options') && value){
                var config = impls.config.sliderConfig;
                config.min = value.min_disk || 1;
                config.rule[0] = value.min_disk || 1;
                $('#configSlider')
                    .slider(config)
                    .slider('setValue',config.min);
                $('#sliderInput').textbox('setValue',config.min);
            }
        });
    };
    impls.o = {
        $cpu_range:$(".cpuRange"),
        $memory_range:$(".memoRange"),
        $slider:$('#configSlider'),
        $sliderInput:$('#sliderInput')
        /*$default_type:$(".saveRange"),
        $switch:$('#addhostswitch')*/
    };
    impls.utils = {
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
        globalParam:function(callback){
            if(!callback){
                return;
            }
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
        prepareData:function(data){
            var pageData = {};
            function formateData(data){
                if($.isArray(data)){
                    return _.sortBy(data,function(item){
                        return parseInt(item);
                    });
                }else{
                    return data;
                }
            }
            $(data).each(function(index, item){
                if(item.name == 'compute.cpu_range'){
                    pageData.cpu_range = formateData(item.value.split('/'));
                }
                if(item.name == 'compute.memory_range'){
                    pageData.memory_range = formateData(item.value.split('/'));
                }
                /*if(item.name == 'storage.default_type'){
                    pageData.default_type = item.value;/!*.split('/')*!/
                }*/
                if(item.name == 'compute.policy'){
                    viewData.topic = item.value;
                }
            });
            impls.utils.renderPage(pageData);
        },
        renderPage:function(pageData){
            var cpu_range,
                memory_range,
               /* default_type,*/
                $obj = impls.o;
            cpu_range = $obj.$cpu_range.squire({
                data:pageData.cpu_range
            });
            cpu_range.click(function(data){
                if(viewData.cpu_range == data){
                    return;
                }
                viewData.cpu_range = data;
                if(basic.children[2].loaded){
                    ef.event.trigger("calCpuMemEvent",{
                        cpu:data,
                        memo:viewData.memory_range
                    });
                }
                way.set("resultData.cpu",data);
            });
            $obj.$cpu_range.children(':first').trigger('click',[pageData.cpu_range[0]]);
            memory_range = $obj.$memory_range.squire({
                data:pageData.memory_range
            });
            memory_range.click(function(data){
                if(viewData.memory_range == data){
                    return;
                }
                viewData.memory_range = data;
                if(basic.children[2].loaded){
                    ef.event.trigger("calCpuMemEvent",{
                        cpu:viewData.cpu_range,
                        memo:data
                    });
                }
                way.set("resultData.memo",data);
            });
            $obj.$memory_range.children(':first').trigger('click',[pageData.memory_range[0]]);
            var sliderPlugin = $obj.$slider.slider(impls.config.sliderConfig);
            var inputPlugin = $obj.$sliderInput.textbox({
                validType: 'regx[/^(([1-9])|([1-9]\\d)|([1-9])(\\d{2})|(1000))$/,"'+ef.util.getLocale("cal.host.crate.config.tip")+'"]',
                required:true,
                maxlength:4
            });
            inputPlugin.textbox('setValue',sliderPlugin.slider('getValue'));
            viewData.lsys_volume=sliderPlugin.slider('getValue');
            way.set("resultData.capability",viewData.lsys_volume);
            sliderPlugin.slider({
                onChange:function(newValue){
                    if(newValue){
                        inputPlugin.textbox('setValue',newValue);
                        viewData.lsys_volume=sliderPlugin.slider('getValue');
                        way.set("resultData.capability",newValue);
                    }
                }});
            inputPlugin.textbox({
                onChange:function(newValue, oldValue){
                    if(!$('#sliderInput').textbox('isValid')){
                        return;
                    }
                    sliderPlugin.slider('setValue',newValue);
                    viewData.lsys_volume=sliderPlugin.slider('getValue');
                }});
            /*var globalStorage = pageData.default_type;//[0];
            var index = _.indexOf(viewData.storage,globalStorage);
            if(index != -1){
                viewData.storage.splice(index,1);
                viewData.storage.unshift(ef.util.getLocale('cal.host.hostDetail.create.config'));
                viewData.storage.unshift(globalStorage);
            }else{
                //�洢���͵�ֵ������ѡ����viewData.storage����������Զ����
                if(globalStorage == '' || globalStorage == null){
                    viewData.storage.unshift(ef.util.getLocale('cal.host.hostDetail.create.config'));
                }
            }
            default_type = $obj.$default_type.squire({
                data:viewData.storage
            });
            default_type.click(function(data){
                viewData.default_type = data;
            });
            $obj.$default_type.children(':first').trigger('click',[globalStorage]);*/
            /*$obj.$switch.switch(impls.config.switchConfig);
            viewData.switch = false;*/
        },
        isValid:function(){
            var isValid = false;
            var minValue = ef.localStorage.get('cal.host.create').children[0].viewData.img.min_disk;
            var textValue = parseInt($('#sliderInput').textbox('getValue'));
            if($('#sliderInput').textbox('isValid') && textValue < minValue){
                ef.placard.error(ef.util.getLocale('cal.create.vm.config.slider',minValue));
                return isValid;
            }
            if(!viewData.cpu_range || !viewData.memory_range || !impls.o.$sliderInput.numberbox('isValid')){
                return isValid;
            }
            impls.utils.getSelectedValue();
            return true;
        },
        getSelectedValue:function(){
            var basic = ef.localStorage.get('cal.host.create').children[1];
            var data = {
                cpu_range: viewData.cpu_range,
                memory_range: viewData.memory_range,
                /*default_type: viewData.default_type,*/
               /* switch_type: viewData.switch,*/
                topic:viewData.topic,
                lsys_volume:viewData.lsys_volume
            };
            basic.viewData = data;
        }
    };
    impls.config = {
       /* switchConfig:{
            checked:false,
            disabled:false,
            onLabel:ef.util.getLocale('cal.create.vm.switch.on'),
            offLabel:ef.util.getLocale('cal.create.vm.switch.off'),
            change: function (checked){
                viewData.switch = checked;
            }
        }*/
        //initslideval:function(){
        //    return ef.localStorage.get('cal.host.create').children[0].viewData.img.min_disk;
        //
        //},
        sliderConfig:{
            mode: 'h',
            value:(function(){
                return ef.localStorage.get('cal.host.create').children[0].viewData.img.min_disk;
            })(),
            min:(function(){
                return ef.localStorage.get('cal.host.create').children[0].viewData.img.min_disk;
            })(),
            max:1000,
            step:1,
            rule:(function(){
                var temp = [];
                temp.push(ef.localStorage.get('cal.host.create').children[0].viewData.img.min_disk);
                temp.push('1000');
                return temp;
            })(),
            showTip:true,
            tipFormatter: function(value){
                return value;
            }
        }
    };
    return impls;
});
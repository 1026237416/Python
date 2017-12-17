/**
 * Created by thomas on 2016/5/27.
 */
define([
    'module',
    'exports',
    'api',
    'strategy',
    'iScroll'
],function(module, exports, api, strategy,iScroll){
    var isLocal = false,
        viGlobalData = {
            template:null,
            networks:[]
        },
        viewData = {},ipData = null,deletIndex,
        tenantId = $('#cal_pro').combobox('getValue'),
        numInput = $('#cal_vm_num').numberspinner('getValue'),
        basic = ef.localStorage.get('cal.host.create'),
        networkCombox = null,
        ipCombox = null,
        desCombox = null,
        svmCombox = null;
    var impls = new ef.Interface.implement();
    impls.redraw = function(){
        impls.init();
        way.registerTransform('listTrans',function(data){
            if(data){
                window.setTimeout(function(){
                    var $wrapper = $('.ef-result-list-list-value').find('#'+data.uuid);
                    $wrapper.hover(
                        function(){
                            $(this).tooltip({
                                position: 'right',
                                content: '<span>' + '物理网络：' + data.value.pyth + '</br>'
                                + '网络：' + data.value.net + '</br>'
                                + '子网：' + data.value.subnet + '</br>'
                                + '物理地址：' + data.value.address + '</span>'
                            }).css({
                                cursor: 'default'
                            })
                                },
                        function(){
                            $.noop()
                                }
                            );
                },1000);
                return data.dom;
            }
        });

    };
    impls.destroy = function(){
        require.undef(module.id);
    };
    impls.init = function(){
        var scroll = new iScroll('scroll-wrapper',{hScrollbar:false, vScrollbar:true});
        impls.utils.initTextFiled();
        impls.utils.initHostCombox();
        ef.event.on('calNumberChangeEvent', function (event,value) {
            if(!basic.children[2].loaded){
                return;
            }
            numEventHandler();
        });
        ef.event.on("calCpuMemEvent", function (event, value) {
            svmEventHandler(event, value);
        });
        ef.event.on("calLvmEvent", function(event){
            svmEventHandler(event);
        });
        function numEventHandler(){
            var needUpdate = false;
            _.each(viGlobalData.networks,function(dataItem){
                var ipData = _.find(dataItem.data,function(dataValue){
                    return dataValue.id == 'ip-vi-data';
                });
                if(ipData && (String(ipData.value).indexOf('*') == -1) ){
                    needUpdate = true;
                    var tempArray = String(ipData.value).split('.');
                    var len = dataItem.type,dataArray = null;
                    if(len == 1){
                        dataArray = [tempArray[0],tempArray[1],tempArray[2],'*'];
                    }else if(len == 2){
                        dataArray = [tempArray[0],tempArray[1],'*','*'];
                    }
                    ipData.value = ipData.name = dataArray.join('.');
                    //$('#'+dataItem.uuid).find('.vi-item-ips').text(ipData.value);
                }
            });
            if(needUpdate){
                $("#netGrid").datagrid('loadData',[]);
                way.set("resultData.nets",[]);
                impls.utils.updateData2TableWay(viGlobalData.networks);
                //hack for table grid show nothing
                $('.cal-create-network-wrapper .datagrid-view').height('100%');
                needUpdate = false;
            }
            //ipType == -1 will show ips combox ready
            if( impls.config.ipType > -1){
                if(impls.config.ipType == 1){
                    if(impls.utils.isDHCP()){
                        $('#net-last-ip')
                            .combobox('select','*')
                            .combobox('resize',60)
                            .combobox('disable');
                    }else{
                        $('#net-last-ip').combobox('enable');
                    }
                }else if(impls.config.ipType == 2){
                    if(impls.utils.isDHCP()){
                        $('#net-third-ip')
                            .combobox('select','*')
                            .combobox('resize',60)
                            .combobox('disable');
                        $('#net-last-ip')
                            .combobox('resize',60)
                            .combobox('disable');
                    }else{
                        $('#net-third-ip').combobox('enable');
                        var thirdValue = $('#net-third-ip').combobox('getText');
                        if(thirdValue == '*'){
                            $('#net-last-ip').combobox('disable');
                        }else{
                            $('#net-last-ip').combobox('enable');
                        }
                    }
                }else{
                    console.log('cal.host.create.network.num.change');
                }
               /* if(impls.utils.isDHCP()){
                    if(impls.config.ipType == 1){
                        $('#net-last-ip')
                            .combobox('select','*')
                            .combobox('resize',60)
                            .combobox('disable');
                    }else if(impls.config.ipType == 2){
                        $('#net-third-ip')
                            .combobox('select','*')
                            .combobox('resize',60)
                            .combobox('disable');
                        $('#net-last-ip')
                            .combobox('resize',60)
                            .combobox('disable');
                    }else{
                        console.log('cal.host.create.network.num.change');
                    }
                }else{
                    if(impls.config.ipType == 1){
                        $('#net-last-ip').combobox('enable');
                    }else if(impls.config.ipType == 2){
                        var thirdValue = $('#net-third-ip').combobox('getText');
                        $('#net-third-ip').combobox('enable');
                        if(thirdValue == '*'){
                            $('#net-last-ip').combobox('disable');
                        }else{
                            $('#net-last-ip').combobox('enable');
                        }
                    }else{
                        console.log('cal.host.create.network.num.change');
                    }
                }*/
            }
        }
        function svmEventHandler(event,value){
            if(basic.children[2].loaded){
                viewData.svm = null;
                var network = impls.utils.findSubVlan();
                if(_.isString(network) && network != ''){
                    numInput = $('#cal_vm_num').numberspinner('getValue');
                    tenantId = $('#cal_pro').combobox('getValue');
                    impls.utils.initSvmCombox(network,value);
                }
            }
        }
        //resultNets样式需设置
        $('.ef-result-list-list-title').css({
            borderRight: 'none'
        });
        $('[way-scope="resultData.nets"]').css({
            borderLeft: '1px solid #e6e6e6',
            minHeight: '28px'
        });
    };
    impls.o = {
        $vlan:$('#cal_vlan'),
        $ip:$('#cal_ip'),
        $svm:$('#cal_svm'),
        $desc:$('#cal_desc'),
        $netNum:$('#net_num')
    };
    impls.utils = {
        isDHCP:function(isValue){
            var numInput = $('#cal_vm_num').numberspinner('getValue');
            if(isValue){
                return numInput;
            }else{
                return numInput > 1;
            }
        },
        initTextFiled:function(){
            var $obj = impls.o,
                config = impls.config;
            $('#net-host-host').combobox(config.netHostConfig);
            $('#net-parent-vlan').combobox(config.netVlanParentConfig);
            $('#net-child-vlan').combobox(config.netVlanChildConfig);
            $('#net-first-ip').combobox(config.netIpsConfig);
            $('#net-second-ip').combobox(config.netIpsConfig);
            $('#net-third-ip').combobox(config.netIpsConfig);
            $('#net-last-ip').combobox(config.netIpsConfig);
            svmCombox = $obj.$svm.combobox(config.svmComboxConfig);
            svmCombox.combobox('disable');
            desCombox = $obj.$desc.textbox(config.descTextConfig);
            $("#netGrid").datagrid(
                {

                    pagination:false,
                   /* onChange: function(){
                        impls.utils.getSelectedValue();
                    },*/
                    onSelect: function(index, row){
                        deletIndex = index;
                    },
                    columns:[
                        [
                            {
                                field: "delete",
                                title: "",
                                width: "7%",
                                formatter: function(val,rowData){
                                    return  '<span style="padding-left: 0"  class="vi-item-bottom vi-icon pt7">'
                                            + '<i data-id=\"'+rowData.uuid+'\" style="position: relative;top: 3px;" class="vi-reduce-icon vi-reduce-btn"></i>'
                                            + '</span>'
                                }
                            },
                            {
                                field:"pyth",
                                title:"物理网络",
                                width:"25%",
                                formatter: function(val, index){
                                    if(val){
                                        return $('<span style="margin-top: 7px; padding-left: 0;">' + val + '</span>')
                                    }
                                }
                            },
                            {
                                field:"net",
                                title:"网络",
                                width:"25%",
                                formatter: function(val, row){
                                    if(val){
                                        return $('<span style="padding-left: 0; margin-top: 6px;">' + val + '</span>')
                                    }
                                    else{
                                        return '<span>' + '-' + '</span>';
                                    }
                                }
                            },
                            {
                                field:"subnet",
                                title:"子网",
                                width:"25%",
                                formatter: function(val, row){
                                    if(val){
                                        return $('<span style="padding-left: 2px; margin-top: 6px;">' + val + '</span>')
                                    }
                                    else{
                                        return '<span>' + '-' + '</span>';
                                    }
                                }
                            },
                            {
                                field:"ip",
                                title:"IP",
                                width:"25%",
                                formatter: function(val, row){
                                    if(val){
                                        return $('<span style="padding-left: 0px; margin-top: 6px;">' + val + '</span>')
                                    }
                                    else{
                                        return '<span style="padding-left: 0px; margin-top: 6px;">' + '-' + '</span>';
                                    }
                                }
                            }/*,
                            {
                                field:"address",
                                title:"物理地址",
                                width:"32%",
                                formatter: function(val, row){
                                    if(val){
                                        return $('<span style="padding-left: 5px; margin-top: 6px;" >' + val + '</span>').tooltip({
                                            content: '<span>' + val + '</span>'
                                        })
                                    }
                                    else{
                                        return '<span style="padding-left: 5px; margin-top: 6px;" >' + '-' + '</span>';
                                    }
                                }
                            }*/
                        ]
                    ]
                });
            /*$("#hostDetailMac").textbox({
                prompt:'不指定',
                disabled: true,
                required:false,
                validType: 'regx[/^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/,"e.g. 00:26:C7:43:F5:2A"]',
                onChange: function(value) {
                    if($("#hostDetailMac").textbox('isValid')){
                        $('#vi-add-btn').addClass('vi-add-ready')
                    }else{
                        $('#vi-add-btn').removeClass('vi-add-ready')

                    }
                }
            });*/
        },
        getComboxData:function(isLocal, serverName, option){
            var url = api.getAPI(serverName);
            var options = $.extend({},option);
            if(!options.callback){
                return;
            }
            if(!isLocal && options.data){
                url += options.data;
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
        onChange:function(type,value){
            switch (type){
                case 'host':
                    impls.utils.initVlanCombox(value.name);
                    impls.utils.clearInputs({host:true});
                    break;
                case 'parent':
                    impls.utils.initChildVlanCombox(value.id);
                    impls.utils.clearInputs({host:true,parent:true});
                    break;
                case 'child':
                    impls.utils.initIpsCombox(value.id);
                    impls.utils.clearInputs({host:true,parent:true,child:true});
                    //$('#hostDetailMac').textbox({disabled: false})
                    break;
                case 'third':
                    var currentValue = String(value.id).toUpperCase();
                    //loadData
                    $('#net-last-ip')
                        .combobox('enable')
                        .combobox('resize',60);
                    if(currentValue && currentValue === '*'){
                        $('#net-last-ip').combobox({
                            required:false,
                            disabled:true,
                            data:value.children
                        })
                    }else{
                        $('#net-last-ip').combobox({
                            required:true,
                            disabled:false,
                            data:value.children
                        })
                    }
                    break;
                default :
                    console.log(type);
                    break;
            }
        },
        formatIpData:function(data){
            var ips = _.pluck(data,'ip'),
                tempIpArray = null,
                tempValue = {first:[],second:[],third:[],last:[],isDisable:false};
            //get keys for third or four combox
            var hadFormatArray = _.chain(ips)
                .map(function(value){
                    var temp = String(value).split('.');
                    return temp[2];
                }).compact().uniq().value();
            //set first and second combox data
            tempIpArray = String(ips[0]).split('.');
            tempValue.first.push({id:tempIpArray[0],name:tempIpArray[0],selected:true});
            tempValue.second.push({id:tempIpArray[1],name:tempIpArray[1],selected:true});
            if(hadFormatArray.length > 1){
                tempValue.third = getIpData(ips,hadFormatArray);
                //tempValue.last = getIpData(ips,3);
                tempValue.isDisable = false;
                impls.config.ipType = 2;
            }else{
                tempValue.third = getIpData(ips,hadFormatArray);
               /* tempValue.third.push({
                    id:tempIpArray[2],
                    name:tempIpArray[2],
                    selected:true,
                    children: getIpData(ips,hadFormatArray)
                });*/
                //tempValue.last = getIpData(ips,hadFormatArray);
                tempValue.isDisable = true;
                impls.config.ipType = 1;
            }
            return tempValue;

            function getIpData(array,keys){
                //sort keys will not sort data later
                var keys = _.sortBy(keys,function(keyValue){
                    return parseInt(keyValue);
                }),len = keys.length;
                var groupedIps = _.groupBy(array,function(value){
                    return String(value).split('.')[2];
                });
                var tempRe = {id:'',name:'',ip:''};
                return _.map(keys,function(key){
                    var ips = groupedIps[key],
                        tempObj = _.clone(tempRe);
                    if(len == 1){
                        //if third combox is disable
                        //will default select
                        tempObj.selected = true;
                    }
                    tempObj.id = tempObj.name = key;
                    tempObj.children = getIpDatas(ips,3);
                    return tempObj;
                });
            }

            function getIpDatas(array,startIndex){
                var ipTemps = [],
                    tempRe = null,
                    tempArray = null;
                _.each(array,function(value){
                    tempRe = {id:'',name:'',ip:''};
                    tempArray = String(value).split('.');
                    tempRe.ip = value;
                    _.each(tempArray,function(value,key){
                        if(key == startIndex){
                            tempRe.id = tempRe.name = value;
                            ipTemps.push(tempRe)
                        }
                    });
                });
                ipTemps = _.chain(ipTemps).compact()
                    .sortBy(function(sortValue){
                        return parseInt(sortValue.id);
                    })
                    .uniq(true,function(uValue){
                        return uValue.id;
                    }).value();
                return ipTemps;
            }
        },
        showIP:function(data){
            var values = impls.utils.formatIpData(data);
            $('#net-first-ip').combobox({
                disabled:true,
                data:values.first
            }).combobox('resize',38).parent().hide();
            $('#net-second-ip').combobox({
                disabled:true,
                data:values.second
            }).combobox('resize',38).parent().hide();
            var tempPrefix = [values.first[0].name,values.second[0].name];
            if(values.isDisable){
                $('#net-third-ip').combobox({
                    disabled:true,
                    width:60,
                    data:values.third
                }).parent().hide();
                tempPrefix.push(values.third[0].name);
                //@thomas last value
                values.last = values.third[0].children;
                var tempLast = _.clone(values.last);
                tempLast.unshift({
                    id:'*',
                    name:'*',
                    selected:true,
                    children:[]
                });
                $('#net-last-ip').combobox({
                    required:false,
                    disabled:(impls.utils.isDHCP() ? true : false),
                    width:60,
                    data:tempLast
                }).parent().show();
            }else{
                var tempThird = _.clone(values.third);
                tempThird.unshift({
                    id:'*',
                    name:'*',
                    selected:true,
                    children:[]
                });
                $('#net-third-ip').combobox({
                    required:false,
                    disabled:(impls.utils.isDHCP() ? true : false),
                    width:60,
                    data:tempThird
                }).parent().show();
                $('#net-last-ip').combobox({
                    required:false,
                    disabled:true,
                    width:60,
                    data:[]//values.last
                }).parent().show();
            }
            tempPrefix.push('');
            $('.prefix').empty().text(tempPrefix.join('.')).show()
        },
        initIpsCombox:function(subnet){
            impls.utils.getComboxData(isLocal,'order.wait.Detail.combo.ip',{
                data:'/'+subnet+'/ips?'+ $.param({
                    tenant:tenantId,
                    used:0
                }),
                callback:function(data){
                    //data=ef.util.getTotalIP(data);
                    data = ef.util.getAvailableIP(data);
                    ipData = null;
                    var num = $('#cal_vm_num').numberspinner('getValue');
                    //had not ips will show can not find ips
                    if(!data.length){
                        ipData = false;
                        ef.placard.error(ef.util.getLocale('cal.create.vm.nothing.ip'));
                        return;
                    }
                    if(data.length && parseInt(num) > data.length){
                        ipData = false;
                        ef.placard.error(ef.util.getLocale('cal.create.vm.no.ip'));
                    }else{
                        ipData = true;
                    }
                    impls.utils.showIP(data);
                    $('#vi-add-btn')
                        .addClass('vi-add-ready')
                        .on('click.vi.add',function(){
                            if(!impls.utils.getValueOrIsValid()){
                                return;
                            }
                            if(viGlobalData.networks.length > 10){
                                ef.placard.error(ef.util.getLocale('cal.create.vm.more.ip'));
                                return;
                            }
                            /*if(!$('#hostDetailMac').textbox('isValid')){
                                return
                            }*/
                            impls.utils.beforeRenderData();
                            impls.utils.renderData();
                            //impls.utils.getSelectedValue();
                            /*$('#hostDetailMac').textbox('clear');
                            $('#hostDetailMac').textbox({disabled: true})*/
                        });
                }
            });
        },
        findSubVlan:function(removeFlag){
            var vlan,tempArray = _.clone(viGlobalData.networks);
            tempArray.push({
                uuId:'',
                data:[{
                    id:'net-child-vlan',
                    name:$('#net-child-vlan').combobox('getText'),
                    value:$('#net-child-vlan').combobox('getValue')
                }]
            });
            var tempVlanArray = _.chain(tempArray)
                .pluck('data').flatten()
                .filter(function(item){
                    return item.id == 'net-child-vlan';
                })
                .pluck('value').compact()
                .uniq().value();
            if(viGlobalData.networks.length){
                return tempVlanArray.join(',');
            }else if((vlan = $('#net-child-vlan').combobox('getValue')) != '' && !removeFlag){
                return vlan;
            }else{
                console.log('error for find vlan in'+module.id);
            }
        },
        beforeRenderData:function(){
            ($('#cal-net-vi').height()+60 > 111 ? $('.water-mark').hide() : $('.water-mark').show());
            var networks = impls.utils.findSubVlan();
            impls.utils.initSvmCombox(networks);
        },
        renderData:function(){
            var uuId = -1,values;
            uuId = ef.util.getUUID();
            values = impls.utils.getValueOrIsValid(true);
            var memoryData = {
                uuid:uuId,
                type:impls.config.ipType,
                data:_.clone(values)
            };
            viGlobalData.networks.push(memoryData);
            impls.utils.updateData2TableWay([memoryData]);
            //clearInputs
            impls.utils.clearInputs();
        },
        updateData2TableWay:function(values){
            _.each(values,function(item){
                //create grid data
                var uuId = item.uuid,
                    datas = item.data;
                var gridData = _.pluck(datas,'name');
                gridData.unshift(uuId);
                //create a object must order as first array
                gridData = _.object(["uuid","pyth","net","subnet"/*,"address"*/,"ip"],gridData);
                $("#netGrid").datagrid('appendRow',gridData);
                //result list
                var list = way.get("resultData.nets")||[];
                list.push({
                    ip:{
                        uuid:'ip'+uuId,
                        dom:'<div id=\"ip'+uuId+'\">' + '<span>' + gridData.ip + '</span>' + '<i style="display: none" class="ef-result-list-list-icon"></i></div>',
                        value: gridData
                    }
                });
                way.set("resultData.nets",list);
            });
            //add remove click event
            $('.vi-reduce-icon').on('click.vi.reduce.icon',function(e){
                e.preventDefault();
                var $this = $(this),
                    id = $this.attr('data-id');
                $this.off('click.vi.reduce.icon');
                impls.utils.deleteDataFromCacheTableWayById(id);
                var networks = impls.utils.findSubVlan(true);
                if(networks){
                    impls.utils.initSvmCombox(networks);
                }
                impls.utils.clearInputs({prefix:true,host:true,parent:true,child:true,ip:true,remove:true});
            });
        },
        deleteDataFromCacheTableWayById:function(id){
            var rows = $("#netGrid").datagrid('getRows');
            var index = _.findIndex(rows,function(row){
                return row.uuid == id;
            });
            if(index > -1){
                var netIndex = _.findIndex(viGlobalData.networks,function(netValue){
                    return netValue.uuid == id;
                });
                if(netIndex > -1){
                    viGlobalData.networks.splice(netIndex,1);
                }
                var list = way.get("resultData.nets")||[];
                var listIndex = _.findIndex(list,function(listValue){
                    return listValue.ip.uuid == 'ip'+id;
                });
                if(listIndex > -1){
                    list.splice(listIndex,1);
                    way.set("resultData.nets",list);
                }
                $("#netGrid").datagrid('deleteRow',index);
                //delete data will restore parent vlan data
                var hostValue = $('#net-host-host').combobox('getValue');
                if(!!hostValue){
                    impls.utils.initVlanCombox(hostValue);
                }
            }
        },
        clearInputs:function(option){
            var basicConfig = {
                required:false,
                data:[],
                disabled:true
            };
            option = option || {};
            if(!option.remove){
                impls.config.ipType = -1;
            }
            if(!option.prefix){
                $('.prefix').empty().hide();
            }
            if(!option.host){
                $('#net-host-host').combobox('reset');
            }
            if(!option.parent){
                $('#net-parent-vlan').combobox($.extend({},basicConfig,{width:165})).parent().show();
            }
            if(!option.child){
                $('#net-child-vlan').combobox($.extend({},basicConfig,{width:150})).parent().show();
            }
            /*$('#hostDetailMac').textbox('clear');
            $('#hostDetailMac').textbox({disabled: true})*/
            if(!option.ip){
                var ips = ['net-first-ip','net-second-ip','net-third-ip','net-last-ip'];
                _.each(ips,function(ipValue){
                    $('#'+ipValue).parent().show();
                });
                $('#net-first-ip').combobox(basicConfig)
                    .combobox('resize',38).parent().show();
                $('#net-second-ip').combobox(basicConfig)
                    .combobox('resize',38).parent().show();
                $('#net-third-ip').combobox(basicConfig)
                    .combobox('resize',38).parent().show();
                $('#net-last-ip').combobox(basicConfig)
                    .combobox('resize',38).parent().show();
                $('#vi-add-btn').removeClass('vi-add-ready').off('click.vi.add');
                //$('#hostDetailMac').textbox('clear');
                $('#cal_desc').textbox('clear');
            }
            if(!viGlobalData.networks.length && option.remove){
                var  data = basic.children[1].viewData;
                var temp = {
                    "name": strategy.getStrategy(data.topic),
                    "id": 'strategy-'+data.topic
                };
                viewData.tempSvm = temp;
                $('#cal_svm').combobox({
                    disabled:false,
                    data:[temp]
                });
            }
        },
        getValueOrIsValid:function(isValue){
            var arrays = [
                'net-host-host',
                'net-parent-vlan',
                'net-child-vlan',
                'net-first-ip',
                'net-second-ip',
                'net-third-ip',
                'net-last-ip'
                //'hostDetailMac'
            ];
            if(isValue){
                var tempArray = [],
                    ipValue = {id:'ip-vi-data',value:null,name:null},
                    tempIpData = '';
                var groupData = _.chain(arrays)
                    .map(function(valueId){
                        //get mac value
                        /*if(valueId == 'hostDetailMac'){
                            return {
                                id:valueId,
                                value:$('#'+valueId).textbox('getValue'),
                                name:$('#'+valueId).textbox('getValue')
                            };
                        }*/
                        return {
                            id:valueId,
                            value:$('#'+valueId).combobox('getValue'),
                            name:$('#'+valueId).combobox('getText')
                        };
                    })
                    .groupBy(function(item){
                        return (String(item.id).indexOf('ip') > -1 ? 'isIp' : 'notIp');
                    }).value();
                if(groupData && groupData.isIp){
                    var tempIpDataArray = _.pluck(groupData.isIp,'value');
                    if(tempIpDataArray[2] === '*' &&
                        (tempIpDataArray[3] == '' || tempIpDataArray[3] == null)){
                        tempIpDataArray[3] = '*';
                    }
                    tempIpData = tempIpDataArray.join('.').toUpperCase();
                    ipValue.value = ipValue.name = tempIpData;
                }
                if(groupData && groupData.notIp){
                    tempArray = _.clone(groupData.notIp);
                    tempArray.push(ipValue);
                }
                return tempArray;
            }else{
                var isValid = _.chain(arrays)
                    .map(function(id){
                        return $('#'+id).combobox('isValid');
                    }).every(function(res){
                        return res === true;
                    }).value();
                if(isValid){
                    return true;
                }else{
                    return false;
                }
            }

        },
        initChildVlanCombox:function(id){
            impls.utils.getComboxData(isLocal,'network.vlan.datagrid_vlan_child',{
                data: '?'+$.param({
                    tenant:tenantId,
                    network_id:id
                }),
                callback:function(data){
                    $('#net-child-vlan').combobox({
                        disabled:false,
                        data:data
                    });
                }
            });
        },
        initVlanCombox:function(phy){
            impls.utils.getComboxData(isLocal,'network.vlan.datagrid_vlan',{
                data: '?'+$.param({
                    phy_network:phy,
                    tenant:basic.children[0].viewData.pro.id
                }),
                callback:function(data){
                    data = impls.utils.removeSameVlan(data);
                    //if parent comobx has value and will reselect the value
                    var parentValue = $('#net-parent-vlan').combobox('getValue');
                    if(!!parentValue){
                        var index = _.findIndex(data,function(item){
                            return item.id == parentValue;
                        });
                        if(index > -1){
                            data[index].selected = true;
                        }else{
                            impls.utils.clearInputs();
                        }
                    }
                    $('#net-parent-vlan').combobox({
                        disabled:false,
                        data:data
                    });
                }
            });
        },
        removeSameVlan:function(dataArray){
            var networks = viGlobalData.networks;
            if(!networks.length){
                return dataArray;
            }
            var ids = _.chain(networks).pluck('data').flatten()
                .filter(function(item){
                    return item.id == 'net-parent-vlan';
                }).pluck('value').value();
            if(ids.length){
                _.each(ids,function(idValue){
                    var index = _.findIndex(dataArray,function(value){
                        return value.id == idValue;
                    });
                    if(index > -1){
                        dataArray.splice(index,1);
                    }
                });
            }
            return dataArray;
        },
        initHostCombox:function(){
            impls.utils.getComboxData(isLocal,'network.host.datagrid_host',{
                callback:function(data){
                    $('#net-host-host').combobox({
                        data:data
                    });
                }
            });
        },
        isLvmStorage:function(){
            //handle default lvm
            var storageValue = $('#cal_default_type').combobox('getValue'),
            //handle select lvm
                storageText = $('#cal_default_type').combobox('getText');
            if(storageValue == 'lvm' || storageText == 'lvm'){
                return true;
            }else{
                return false;
            }
        },
        initSvmCombox:function(network,value){
            var  data = basic.children[1].viewData;
            if(value){
                data.cpu_range = value.cpu;
                data.memory_range = value.memo;
            }
            var temp = {
                num: numInput,
                tenant_id: tenantId,
                cores: data.cpu_range,
                memory: parseInt(data.memory_range)*1024,
                subnets: network
            };
            if(impls.utils.isLvmStorage()){
                temp['volume_type'] = 'lvm';
            }
            impls.utils.getComboxData(isLocal,'cal.host.create.network.svm',{
                data:'?'+ $.param(temp),
                callback:function(response){
                    /* if(!response.length){
                     ef.placard.error(ef.util.getLocale('cal.create.vm.svm'));
                     }*/
                    var temp = {
                        "name": strategy.getStrategy(data.topic),
                        "id": 'strategy-'+data.topic
                    };
                    viewData.tempSvm = temp;
                    response.unshift(temp);
                    impls.o.$svm.combobox({
                        disabled:false,
                        data:response
                    });
                }
            });
        },
        isValid:function(){
            var networks = viGlobalData.networks;
            if(!networks.length){
                ef.placard.error(ef.util.getLocale('cal.create.vm.no.vlan'));
                return false;
            }
            //had not ips will show can not find ips
            if(!desCombox.textbox('isValid') || !ipData){
                return false;
            }
            var sameValue = impls.utils.hasSameValue();
            if(sameValue){
                ef.placard.error(ef.util.getLocale('cal.create.vm.same.ip'));
                return false;
            }
            impls.utils.getSelectedValue();
            return true;
        },
        hasSameValue:function(){
            var networks = _.pluck(viGlobalData.networks,'data');
            var tempArray = [];
            _.each(networks,function(item){
                var tempItem = _.filter(item,function(itemValue){
                    return itemValue.id == 'net-host-host' ||
                        itemValue.id == 'net-parent-vlan';
                });
                var tempStr =  String(_.pluck(tempItem,'value').join('')).toUpperCase();
                if(tempStr.indexOf('*') == -1){
                    tempArray.push(tempStr);
                }
            });
            var leftValues = _.chain(tempArray).compact().uniq().value();
            if(leftValues.length == tempArray.length){
                return false;
            }else{
                return true;
            }
        },
        getSelectedValue:function(){
            var $obj = impls.o,
                stack = basic.children[2];
            if(viewData.svm == null || String(viewData.svm.id).indexOf('strategy') != -1){
                viewData.svm = viewData.tempSvm;
            }
            stack.viewData = {
                network:[],
                svm: viewData.svm,
                desc: $obj.$desc.textbox('getValue')
            };
            var result = ['host','vlan','subnet','mac','ip'];
            $(viGlobalData.networks).each(function(i,il){
                il.data.splice(3,0,{
                    id:"hostDetailMac",
                    name:"",
                    value:""
                });
            });
            //viGlobalData.networks.data
            stack.viewData.network = _.chain(viGlobalData.networks)
                .pluck('data')
                .map(function(itemArray){
                    return _.object(result,itemArray);
                }).value();
        },
        netIsRepeat: function(){
            var hostValue = $('#net-host-host').combobox('getValue'),
                parentValue= $('#net-parent-vlan').combobox('getValue');
            var networks = viGlobalData.networks;
            if(!networks.length){
                return false;
            }
            _.find(networks,function(net){
                return;
            });

        }
    };
    impls.config = {
        ipType: -1,
        netHostConfig:{
            required:false,
            textField:'name',
            valueField:'name',
            width:150,
            heigth:30,
            prompt:ef.util.getLocale('order.wait.validate.nethost'),
            editable:false,
            disabled:false,
            onSelect:function(value){
                var name = null;
                if(this.id){
                    name = String(this.id).split('-')[1];
                    impls.utils.onChange(name,value);
                }
            }
        },
        netVlanParentConfig:{
            required:false,
            textField:'name',
            valueField:'id',
            width:165,
            heigth:30,
            prompt:ef.util.getLocale('order.wait.validate.vlan'),
            editable:false,
            disabled:true,
            onSelect:function(value){
                var name = null;
                if(this.id){
                    name = String(this.id).split('-')[1];
                    impls.utils.onChange(name,value);
                }
            }
        },
        netVlanChildConfig:{
            required:false,
            textField:'name',
            valueField:'id',
            width:150,
            heigth:30,
            prompt:ef.util.getLocale('order.wait.validate.vlan.child'),
            editable:false,
            disabled:true,
            onSelect:function(value){
                var name = null;
                if(this.id){
                    name = String(this.id).split('-')[1];
                    impls.utils.onChange(name,value);
                }
               /* $("#hostDetailMac").next().find(".textbox-text").focus(function () {
                    $(this).attr({placeholder:'请输入mac地址'});
                }).blur(function () {
                    $(this).attr({placeholder:'不指定'});
                });*/
            }
        },
        netIpsConfig:{
            required:true,
            textField:'name',
            valueField:'id',
            editable:false,
            disabled:true,
            width:38,
            heigth:30,
            onSelect:function(value){
                var name = null;
                if(this.id){
                    name = String(this.id).split('-')[1];
                    impls.utils.onChange(name,value);
                }
            }
        },
        svmComboxConfig:{
            textField:'name',
            valueField:'id',
            editable:false,
            prompt:ef.util.getLocale('order.wait.Detail.prompt.host'),
            onSelect:function(value){
                if(value == null){
                    return;
                }
                viewData.svm = value;
                //impls.utils.getSelectedValue();
                way.set('resultData.vmhost', value.name)
            }
        },
        descTextConfig:{
            multiline:true,
            height:50,
            width:"100%",
            maxlength:50,
            onChange: function(value){
                value = value == '' ? ' ' : value;
                //impls.utils.getSelectedValue();
                way.set('resultData.des', value)
            }


        }
    };
    return impls;
});

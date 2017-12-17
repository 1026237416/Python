/**
 * Created by wangahui1 on 16/1/11.
 */
define(["easyui","module","domReady","api","security.group"],function(easyui,module,domReady,api,securityGroup)
{
    var implement = new ef.Interface.implement();
    implement.init=function()
    {
        var rule=null,port=null;
        $("#adddiskokall").css({opacity: 0.4});
        var param=ef.Dialog.getDialog("security.group.add").param.param;
        this.tenantId=param.tenantId;
        this.groupId=param.groupId;
        this.isForce=true;
        this.status=1;
        this.dataStatus=1;
        this.ruleDom=null;
        this.directionDom=null;
        this.portDom=null;
        $(".security_group_box input[class^='security_combox_']").combobox({editable:false,valueField:'value',
            textField:'label',onSelect: function () {
                $("#adddiskokall").css({opacity: 1});
            }});
        $(".security_group_box input[class^='security_input_']").textbox({required:true,onChange: function () {
            $("#adddiskokall").css({opacity: 1});
        }});
        this.getRuleList(function(response)
        {
            $(".security_combox_rule").combobox("loadData",response);
            implement.showRule1();
        });
        this.getDirectionList(function(response)
        {
            $(".security_combox_direction").combobox("loadData",response);
        });
        this.getPortList(function(response)
        {
            $(".security_combox_port").combobox("loadData",response);
        });
        $("#adddiskok").append(ef.util.getLocale('global.button.confirm.label'));
        $(".security_combox_rule").combobox({onSelect:implement.changeRule,
        onChange: function (newValue) {
            rule = newValue;
        }});
        $(".security_combox_port").combobox({onSelect:function(rec)
        {
            $("#adddiskokall").css({opacity: 1});
            if(rec.value==1)
            {
                $(".e_ports").show();
                $(".e_port").hide();
            }else{
                $(".e_ports").hide();
                $(".e_port").show();
            }
        },onChange: function (newValue) {
            port = newValue;
        }
            });
        $(".security_input_port").textbox({validType: 'regx[/(^[1-9]\\d{0,3}$)|(^[1-5]\\d{4}$)|(^6[0-4]\\d{3}$)|(^65[0-4]\\d{2}$)|(^655[0-2]\\d$)|(^6553[0-5]$)/,"只能输入1-65535的整数"]'});
        $(".security_input_end").textbox({validType: 'regx[/(^[1-9]\\d{0,3}$)|(^[1-5]\\d{4}$)|(^6[0-4]\\d{3}$)|(^65[0-4]\\d{2}$)|(^655[0-2]\\d$)|(^6553[0-5]$)/,"只能输入1-65535的整数"]'});
        $(".security_input_start").textbox({validType: 'regx[/(^[1-9]\\d{0,3}$)|(^[1-5]\\d{4}$)|(^6[0-4]\\d{3}$)|(^65[0-4]\\d{2}$)|(^655[0-2]\\d$)|(^6553[0-5]$)/,"只能输入1-65535的整数"]'});
        $(".security_input_protocol").textbox({
            required:false,
            validType: 'regx[/^(-1|0|1\\d{2}|2[0-5][0-5]|[1-9]\\d|\\d)$/,"只能输入-1-255的整数"]'
        });
        $(".security_input_encode").textbox({validType: 'regx[/^(-1|0|1\\d{2}|2[0-5][0-5]|[1-9]\\d|\\d)$/,"只能输入-1-255的整数"]'});
        $(".security_input_type ").textbox({validType: 'regx[/^(-1|0|1\\d{2}|2[0-5][0-5]|[1-9]\\d|\\d)$/,"只能输入-1-255的整数"]'});
        $(".security_input_cidr").textbox({
            required:false,
            prompt:'e.g. 192.168.1.0/24',
            validType:'regx[/^(\\d{1,2}|1\\d\\d|2[0-4]\\d|25[0-5])\\.(\\d{1,2}|1\\d\\d|2[0-4]\\d|25[0-5])\\.(\\d{1,2}|1\\d\\d|2[0-4]\\d|25[0-5])\\.(\\d{1,2}|1\\d\\d|2[0-4]\\d|25[0-5])\\/([0-9]|0[0-9]|[1-2][0-9]|30|31|32)$/,"cidr有效范围在0-32之间"]'
        });
        $("#adddiskok").click(function()
        {
            if(rule=="tcp"||rule=="udp"){
                if(port==0){
                    if(!$(".security_input_port").textbox('isValid') ||
                       !$(".security_input_cidr").textbox('isValid')){
                        return;
                    }
                }
               if(port==1){
                   if(!$(".security_input_start").textbox('isValid')||!$(".security_input_end").textbox('isValid')){
                       return;
                   }
                   var startInput = parseInt($(".security_input_start").textbox('getValue'));
                   var endInput = parseInt($(".security_input_end").textbox('getValue'));
                   if(endInput < startInput){
                        ef.placard.warn(ef.util.getLocale('security.group.global.create.startport.endport'));
                       return;
                   }
               }
            }
            if(rule=="icmp"){
                if(!$(".security_input_encode").textbox('isValid')||!$(".security_input_type").textbox('isValid')){
                    return;
                }
            }
            if(rule == '200'){
                if(!$(".security_input_protocol").textbox('isValid')){
                    return;
                }
            }
            implement.createRule();
        });
        $('#sec-cancel').click(function(){
            ef.Dialog.close('security.group.add');
        });
    };
    implement.showRule1=function()
    {
        $(".e_rule").show();
        $(".e_direction").show();
        $(".e_oport").show();
        $(".e_port").hide();
        $(".e_ports").hide();
        $(".e_cidr").show();
        $(".e_type").hide();
        $(".e_protocol").hide();
        $(".e_group").hide();
        $(".e_etype").hide();
        $(".security_combox_port").combobox("getValue")==1?$(".e_ports").show():$(".e_port").show();
    };
    implement.showRule2=function()
    {
        $(".e_rule").show();
        $(".e_direction").show();
        $(".e_oport").hide();
        $(".e_port").hide();
        $(".e_ports").hide();
        $(".e_cidr").show();
        $(".e_type").show();
        $(".e_protocol").hide();
        $(".e_group").hide();
        $(".e_etype").hide();

    };
    implement.showRule3=function()
    {
        $(".e_rule").show();
        $(".e_direction").show();
        $(".e_oport").hide();
        $(".e_port").hide();
        $(".e_ports").hide();
        $(".e_cidr").show();
        $(".e_type").hide();
        $(".e_protocol").show();
        $(".e_group").hide();
        $(".e_etype").hide();
    };
    implement.showRule4=function()
    {
        $(".e_rule").show();
        $(".e_direction").show();
        $(".e_oport").hide();
        $(".e_port").hide();
        $(".e_ports").hide();
        $(".e_cidr").show();
        $(".e_type").hide();
        $(".e_protocol").hide();
        $(".e_group").hide();
        $(".e_etype").hide();
    };
    implement.showRule5=function()
    {
        $(".e_rule").show();
        $(".e_direction").hide();
        $(".e_oport").hide();
        $(".e_port").hide();
        $(".e_ports").hide();
        $(".e_cidr").show();
        $(".e_type").hide();
        $(".e_protocol").hide();
        $(".e_group").hide();
        $(".e_etype").hide();
    };
    implement.getDataRule1=function()
    {
        var isDobule=$(".e_ports").is(":visible");
        var cidrValue = $(".security_input_cidr").textbox("getValue");
        if(cidrValue == '' || cidrValue == null){
            cidrValue = '0.0.0.0/0';
        }
        var obj=
        {
            "direction":$(".security_combox_direction").combobox("getValue"),
            "cidr":cidrValue,
            "protocol":$(".security_combox_rule").combobox("getValue"),
            "from_port":isDobule?$(".security_input_start").textbox("getValue"):$(".security_input_port").textbox("getValue"),
            "to_port":isDobule?$(".security_input_end").textbox("getValue"):$(".security_input_port").textbox("getValue")
        };
        return obj;
    };
    implement.getDataRule2=function()
    {
        var cidrValue = $(".security_input_cidr").textbox("getValue");
        if(cidrValue == '' || cidrValue == null){
            cidrValue = '0.0.0.0/0';
        }
        var obj=
        {
            "direction":$(".security_combox_direction").combobox("getValue"),
            "cidr":cidrValue,
            "protocol":$(".security_combox_rule").combobox("getValue"),
            "tenant_id":implement.tenantId,
            "security_group_id":implement.groupId
        };
        return obj;
    };
    implement.getDataRule3=function()
    {
        var cidrValue = $(".security_input_cidr").textbox("getValue");
        if(cidrValue == '' || cidrValue == null){
            cidrValue = '0.0.0.0/0';
        }
        var obj=
        {
            "cidr":cidrValue,
            "protocol":$(".security_combox_rule").combobox("getValue")
        };
        return obj;
    };
    implement.getDataRule4=function()
    {
        var cidrValue = $(".security_input_cidr").textbox("getValue");
        if(cidrValue == '' || cidrValue == null){
            cidrValue = '0.0.0.0/0';
        }
        var protocolValue = $(".security_combox_rule").combobox("getValue");
        if(protocolValue == 200){
            protocolValue = $('.security_input_protocol').textbox("getValue");
            if(protocolValue == '' || protocolValue == null || protocolValue === '-1'){
                protocolValue = -1;
            }
        }
        var obj=
        {
            "direction":$(".security_combox_direction").combobox("getValue"),
            "cidr":cidrValue,
            "protocol":protocolValue
        };
        return obj;
    };
    /**定制ICMP*/
    implement.getDataRule5=function()
    {
        var cidrValue = $(".security_input_cidr").textbox("getValue");
        if(cidrValue == '' || cidrValue == null){
            cidrValue = '0.0.0.0/0';
        }
        var obj=
        {
            "direction":$(".security_combox_direction").combobox("getValue"),
            "cidr":cidrValue,
            "protocol":$(".security_combox_rule").combobox("getValue"),
            "from_port":parseInt($(".security_input_type").textbox("getValue")),
            "to_port":parseInt($(".security_input_encode").textbox("getValue"))
        };
        return obj;
    };

    implement.changeRule=function(data)
    {
        $("#adddiskokall").css({opacity: 1});
        implement.status=data.group;
        implement.dataStatus=data.data;
        implement["showRule"+data.group]();
    };
    /**
     * 新建安全组*/
    implement.createRule=function()
    {
        ef.loading.show();
        ef.getJSON(
            {
                url:api.getAPI("security.group.create.global"),
                type:"put",
                isForce:implement.isForce,
                useLocal:!implement.isForce,
                data:this.getData(),
                success:function()
                {
                    securityGroup.getAndRefreshList();
                    ef.Dialog.close("security.group.add");
                    ef.loading.hide();
                    ef.placard.tick(ef.util.getLocale('security.group.create.success.tip'));
                },
                error:function(error)
                {
                    ef.placard.show(error.msg);
                    ef.loading.hide();
                }
            });
    };
    /**获取已经填好的数据*/
    implement.getData=function()
    {
        return this["getDataRule"+this.dataStatus]();
    };
    /**获取规则列表数据*/
    implement.getRuleList=function(callback)
    {
        ef.getJSON(
            {
                url:"data/security.rule.json",
                useLocal:true,
                success:function(response)
                {
                    callback?callback(response):null;
                }
            });
    };
    /**获取方向列表数据*/
    implement.getDirectionList=function(callback)
    {
        ef.getJSON(
            {
                url:"data/security.add.direction.json",
                useLocal:true,
                success:function(response)
                {
                    callback?callback(response):null;
                }
            });
    };
    /**
     * 获取端口列表数据
     * */
    implement.getPortList=function(callback)
    {
        ef.getJSON(
            {
                url:"data/security.port.json",
                useLocal:true,
                success:function(response)
                {
                    callback?callback(response):null;
                }
            });
    };

    implement.redraw=function()
    {
        domReady(function()
        {
            implement.init();
        });
    };
    implement.destroy=function()
    {
        require.undef(module.id);
    };
    return implement;
});
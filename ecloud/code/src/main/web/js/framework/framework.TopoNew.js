/**
 * Created by hxf on 2016/8/9.
 */
define("framework.topoNew",["exports","framework.core"],function(exports,ef)
{
    function TopoNew(box,data,config) {
        this.box=box;
        this.config=config;
        this.data = data.data;
        this.template = $('<div class="ef-topoNew-content"></div>');
        this.netTemplate = $('<div class="ef-topoNew-net-content">' +
            '<div class="ef-topoNew-net name"></div>' +
            '<div class="ef-topoNew-net-slice"></div>' +
            '<div class="ef-topoNew-net brige"></div>' +
            '<div class="ef-topoNew-net-slice net-slice-vlan" style="width: 50px;"></div></div>');
        this.vlanTemplate = $('<div class="ef-topoNew-vlan"></div>');
        this.vlanSimpleTem = $('<div class="ef-topoNew-vlan-content">' +
            '<div class="ef-topoNew-vlan-slice"></div>' +
            '<div class="ef-topoNew-vlan-name"></div>'+
            '<div class="ef-topoNew-host-slice-vlan"></div>'+
            '<div class="ef-topoNew-host-content">' +
            '<div class="ef-topoNew-host-slice"></div>'+
            '<div class="ef-topoNew-host name"></div>'+
            '</div>'+
            '</div>');
        this.contractTem = $('<ul class="ef-topo-contract"></ul>');
        this.contractSimpleTem = $('<li class="ef-topo-contract-li"></li>');
        this.vmTemplate = $('<div class="ef-topoNew-vm">' +
            '<div class="ef-topoNew-vm-slice-host"></div>'+
            '<div class="ef-topoNew-vm-slice"></div>'+
            '<div class="ef-topoNew-vm-name"></div>'+
            '</div>');
        this.draw();
        //this.hideClick();
        this.subnetVmDom = null;
        this.sliceArray = [];
        this.subnet = null;
        this.vlanLength = 0;
        this.index = 0;
        this.count = 0;
        this.hostCount = 0;
        this.vmCount = 0;
        this.heightValue = 0;
        this.len = 0;
        this.displayNone();
        return this;
    }
    TopoNew.isDom=true;
    //云主机hover事件
    TopoNew.prototype.vmHover = function (tmp,il,i,data) {
        var _self = this;
        var hoverData,tooltipData = [];
        tmp.children('.ef-topoNew-list-simple-content').eq(i).hover(function () {
            $(this).css({color:"#43a8dc"});
            hoverData = ef.util.map(data[i].network_info, function (num) {
                return num.name;
            });
            ef.util.map(_self.box.find(".ef-topoNew-vlan-name"), function (el) {
                $(hoverData).each(function (a, al) {
                    if (al == $(el).text()) {
                        console.log($(el).text());
                        $(el).addClass("select");
                    }
                })
            });
        }, function () {
            $(this).css({color:"black"});
            ef.util.map(_self.box.find(".ef-topoNew-vlan-name"), function (el) {
                if($(el).hasClass('select')){
                    $(el).removeClass('select');
                }
            });
        });
        tmp.children('.ef-topoNew-list-simple-content').eq(i).tooltip({
            rackMouse:true,
            //position:'left',
            content:'<div><label>名称：</label><div style="width: 75%;" class="tooltip-name-show-wordspace">'+il.displayname+'</div></div>'+
            '<div class="ef-topoNew-vmTooltip-net"><label>网卡：</label>'+'<div class="ef-topoNew-vmTooltip-net-value"></div>'+'</div>'+
            '<div><label>配置：</label>'+il.cores+'核'+Number(il.memory_mb)/1024+'GB'+'</div>'+
            '<div><label>宿主机：</label>'+il.host.name+'</div>'+
            '<div style="width: 100%;float:left;"><label>用户：</label><div class="ef-topoNew-vmTooltip-user-value"></div></div>'+
            '<div style="  height: 32px;float: left;width: 100%;"><label>项目：</label>'+il.tenant.name+'</div>'+
            '<div><label>状态：</label>'+_self.state(il.state,"vm")+'</div>',
            onShow: function(){
                $(this).tooltip('tip').addClass('topo-tooltip').addClass('vm-tooltip');
                $(".ef-topoNew-vmTooltip-user-value").text(data[i].user.display_name?data[i].user.display_name:"-");
                tooltipData.length=0;
                tooltipData = ef.util.map(data[i].network_info, function (num) {
                    return num.ip+'('+num.name+')';
                });
                $(".ef-topoNew-vmTooltip-net-value").empty();
                if(tooltipData.length==0){$(".ef-topoNew-vmTooltip-net-value").text("-");return;}
                $(tooltipData).each(function (a,al) {
                   var tt = $('<div></div>');
                    tt.text(al);
                    $(".ef-topoNew-vmTooltip-net-value").append(tt);
                });
                $(this).tooltip('reposition');
            }
        });
    };
    //子网的hover事件
    TopoNew.prototype.subnetHover = function (tmp,il,i) {
        tmp.find('.ef-topoNew-list-simple-content').eq(i).find('div').tooltip({
            content:'<div><label>名称：</label><div class="tooltip-name-show-wordspace">'+il.name+'</div></div>'+
            '<div><label>CIDR：</label>'+il.cidr+'</div>'+
            '<div><label>网关：</label>'+il.gateway+'</div>'+
            '<div><label>IP占用：</label>'+il.ip_use+"/"+il.ip_total+'</div>',
            onShow: function(){
                $(this).tooltip('tip').addClass('topo-tooltip').addClass('subnet-tooltip');
            }
        });
    };
    //子网下的云主机的显示
    TopoNew.prototype.vm = function (data,len) {
        this.vmCount = 0;
        if(data.length==0){
            this.box.find(".ef-topoNew-vm").remove();
            return;}
        this.subnetVmDom.parent().append(this.vmTemplate);
        this.vmTemplate.find(".ef-topoNew-vm-name").empty();
        var _self = this;
        var p = $('<div style="margin-left: 110px;"></div>');
        $(data).each(function (i,il) {
            var tmp = $('<div class="ef-topoNew-list-simple-content"><span>'+il.name+'</span></div>');
            p.append(tmp);
            _self.vmTemplate.find(".ef-topoNew-vm-name").append(p);
            _self.vmHover(p,il,i,data);
        });
        if(data.length==1){
            this.vmTemplate.find(".ef-topoNew-vm-slice").hide();
            this.vmTemplate.find(".ef-topoNew-list-simple-content").addClass("one");
        }
        if(data.length>1&&data.length<=8){
            this.vmTemplate.find(".ef-topoNew-vm-slice").removeClass("max-length");
            this.vmTemplate.find(".ef-topoNew-vm-slice").show();
            var hei = this.vmTemplate.find(".ef-topoNew-vm-name").css('height');
            this.vmTemplate.find(".ef-topoNew-vm-slice").css({height:hei});
            this.vmTemplate.find(".ef-topoNew-list-simple-content").removeClass("one");
        }
        if(data.length>8){
            this.vmTemplate.find(".ef-topoNew-vm-slice").show();
            this.vmTemplate.find(".ef-topoNew-vm-slice").addClass("max-length");
            this.contract(data,8,"vm").addClass("vm");
            _self.vmTemplate.find(".ef-topoNew-vm-name").empty().append(this.contract(data,8,"vm"));
            this.vmTemplate.find(".ef-topoNew-list-simple-content").removeClass("one");
        }
        this.displayNone();
        var heiDom = this.vmTemplate.parent().parent().parent().parent().parent().parent();
        var yV = this.vmTemplate.parent().position().top;
        var h = yV+len;
        var heightValue = (heiDom.css('height')).match(/[1-9][0-9]*/g);
        var heiDm = this.vmTemplate.parent().parent();
        var heiPar = (heiDm.css('height')).match(/[1-9][0-9]*/g);
        if(heiDom.prev().find(".ef-topo-contract-li").children.length>1&&_self.index%2==0&&_self.indexPar==0){
            heiDom.prev().css({"padding-bottom":"30px"});
        }
        //console.log(heiDom);
        //console.log(_self.index);
        //console.log(_self.indexPar);
        if((Number(heiPar[0])-yV)<len){
            heiDom.removeClass('show-click').css({height:h+"px"});
        }
        if(_self.heightValue!=0){return;}
        _self.heightValue = heightValue;
    };
    //子网部分的显示
    TopoNew.prototype.host = function (dom,data) {
        var _self = this;
        dom.find('.ef-topoNew-host.name').empty();
        var contractTem = this.contractTem.clone(true);
        var tmp = _self.contractSimpleTem.clone(true);
        tmp.css({display:"block",height:"120px","overflow-y":"hidden"});
        $(data).each(function (i,il) {
            tmp.append($('<div class="ef-topoNew-list-simple-content"><div class="host_simple">'+il.name+'<span class="ef-topo-con-every-none" style="display: none;">'+il.id+'</span></div></div>'));
            if(il.vm_counts>0){
                var u = il.vm_counts;
                if(u>99){u = "...";}
                tmp.append("<div class='ef-topoNew-list-simple-content-vm-count'>"+u+"</div>");
            }
            contractTem.append(tmp);
            dom.find('.ef-topoNew-host.name').append(contractTem);
            _self.subnetHover(tmp,il,i);
            if(il.status=="unavailable"){dom.find('.host_simple').eq(i).addClass('disabled');}
        });
        if(data.length==1){
            dom.find('.ef-topoNew-host-slice').hide();
            dom.find('.ef-topoNew-host-content').css({height:0});
            dom.find('.ef-topoNew-host.name').css({"margin-top":0,"margin-left":0});
            dom.find('.ef-topoNew-host-slice-vlan').addClass('hei-change');
        }
        if(data.length==2||data.length==3){
            dom.find('.ef-topoNew-host-content').css({height:"90px","margin-top":"-30px"});
            dom.find('.ef-topoNew-host-slice').css({"border-bottom":"1px solid #bfbfbf"});
        }
        if(data.length==2){
            dom.find('.ef-topoNew-host.name .ef-topoNew-list-simple-content').eq(1).css({"margin-top":"50px"});
        }
        if(data.length>3){
            dom.find(".ef-topoNew-host-content").append('<i class="icon-topo-show ef-host-btn"></i><i class="icon-topo-hide ef-host-btn" style="display: none"></i>');
        }
        if(data.length>6){
            dom.find('.ef-topoNew-host.name').empty().append(this.contract(data,6,"host"));
            dom.find(".ef-topo-contract").find('.ef-topo-con-every').addClass("host_simple");
        }
        dom.find('.ef-topoNew-host.name').children('.ef-topo-contract').addClass('subnet');
    };
    TopoNew.prototype.typeChoose = function (type) {
        return (type=='host')?this.hostCount:this.vmCount;
    };
    //翻页的点击事件
    TopoNew.prototype.contractClick = function (dom,type,d) {
        var _self = this;
        dom.children(".icon-topo-page-turn-down").click(function () {
            if(dom.hasClass('vm-content')){
                if(_self.vmCount > d.length-2){return;}
                if(_self.vmCount == d.length-2){
                    $(this).hide();
                    $(this).siblings('.icon-topo-page-turn-down-disabled').show();
                    if(type=="vm"){
                        $(this).removeClass('icon-show-down-vm');
                        $(this).siblings('.icon-topo-page-turn-down-disabled').addClass("icon-show-down-vm");
                    }
                }
                _self.vmCount++;
                dom.children('li').eq(_self.vmCount).show().siblings('li').hide();
            }else{
                if(_self.hostCount > d.length-2){return;}
                if(_self.hostCount == d.length-2){
                    $(this).hide();
                    $(this).siblings('.icon-topo-page-turn-down-disabled').show();
                    if(type=="vm"){
                        $(this).removeClass('icon-show-down-vm');
                        $(this).siblings('.icon-topo-page-turn-down-disabled').addClass("icon-show-down-vm");
                    }
                }
                _self.hostCount++;
                dom.children('li').eq(_self.hostCount).show().siblings('li').hide();
            }
            $(this).siblings('.icon-topo-page-turn-up-disabled').hide();
            $(this).siblings('.icon-topo-page-turn-up').show();
            if(type=="vm"){
                $(this).siblings('.icon-topo-page-turn-up-disabled').removeClass('icon-show-up-vm');
                $(this).siblings('.icon-topo-page-turn-up').addClass("icon-show-up-vm");
            }
        });
        dom.children(".icon-topo-page-turn-up").click(function () {
            if(dom.hasClass('vm-content')){
                if(_self.vmCount<1){return;}
                if(_self.vmCount == 1){
                    $(this).hide();
                    $(this).siblings('.icon-topo-page-turn-up-disabled').show();
                    if(type=="vm"){
                        $(this).removeClass('icon-show-up-vm');
                        $(this).siblings('.icon-topo-page-turn-up-disabled').addClass("icon-show-up-vm");
                    }
                }
                _self.vmCount--;
                dom.children('li').eq(_self.vmCount).show().siblings('li').hide();
            }else{
                if(_self.hostCount<1){return;}
                if(_self.hostCount == 1){
                    $(this).hide();
                    $(this).siblings('.icon-topo-page-turn-up-disabled').show();
                    if(type=="vm"){
                        $(this).removeClass('icon-show-up-vm');
                        $(this).siblings('.icon-topo-page-turn-up-disabled').addClass("icon-show-up-vm");
                    }
                }
                _self.hostCount--;
                dom.children('li').eq(_self.hostCount).show().siblings('li').hide();
            }
            $(this).siblings('.icon-topo-page-turn-down-disabled').hide();
            $(this).siblings('.icon-topo-page-turn-down').show();
            if(type=="vm"){
                $(this).siblings('.icon-topo-page-turn-down-disabled').removeClass('icon-show-down-vm');
                $(this).siblings('.icon-topo-page-turn-down').addClass("icon-show-down-vm");
            }
        });
    };
    //超过指定个数的数据显示和翻页
    TopoNew.prototype.contract = function (data,num,type) {
        this.hostCount = 0;
        this.vmCount = 0;
        var contractTem = this.contractTem.clone(true);
        if(type=="vm"){contractTem.addClass("vm-content");}
        else{contractTem.addClass("sunbet-content");}
        contractTem.append('<i class="icon-topo-page-turn-up-disabled" style="display: none;"></i>')
            .append('<i class="icon-topo-page-turn-up" style="display: none;"></i>');
        var _self = this;
        var d = this.getSliceArray(data,num);
        $(d).each(function (i,il) {
            var tmp = _self.contractSimpleTem.clone(true);
            $(il).each(function (e,el) {
                tmp.append('<div class="ef-topoNew-list-simple-content"><div class="ef-topo-con-every"><span>'+el.name+'</span><span class="ef-topo-con-every-none" style="display: none;">'+el.id+'</span></div></div>');
                if(type=="host"){
                    _self.subnetHover(tmp,el,e);
                    if(el.ip_use>1){
                        var u = Number(el.ip_use)-1;
                        tmp.append("<div class='ef-topoNew-list-simple-content-vm-count'>"+u+"</div>");
                    }
                }
                if(type=="vm"){
                   _self.vmHover(tmp,el,e,il);
                }
            });
            contractTem.append(tmp);
        });
        contractTem.append('<i class="icon-topo-page-turn-down" style="display: none;"></i>');
        contractTem.append('<i class="icon-topo-page-turn-down-disabled" style="display: none;"></i>');
        _self.contractClick(contractTem,type,d);
        if(type=="vm"){
            contractTem.children("li").addClass('vm-li');
            //contractTem.children(".icon-topo-page-turn-up-disabled").addClass('vm-type');
            //contractTem.children(".icon-topo-page-turn-down").addClass('vm-type');
            contractTem.children(".icon-topo-page-turn-up-disabled").addClass("icon-show-up-vm");
            contractTem.children(".icon-topo-page-turn-down").addClass("icon-show-down-vm");
        }
        return contractTem;
    };
    //对超过指定个数的数据进行分割
    TopoNew.prototype.getSliceArray = function (data,num) {
        var _self = this;
        _self.sliceArray = [];
        for(var i = 0;i<Math.ceil(data.length/num);i++){
            var start = i*num;
            var end = start + num;
            _self.sliceArray.push(data.slice(start,end));
        }
        return this.sliceArray;
    };
    //获取vlan，宿主机以及云主机的状态
    TopoNew.prototype.state = function (state,type) {
        switch (type){
            case "vlan":
                if(state=="ACTIVE"){return "<div style='color: green'>可用</div>";}
                return "<div style='color: red'>不可用</div>";
                break;
            case "vm":
                if(state=="stopped"){return "<div style='color: gray'>停止</div>";}
                if(state=="error"){return "<div style='color: red'>异常</div>";}
                if(state=="active"){return "<div style='color: green'>运行</div>";}
                if(state=="wait_create"){return "<div style='color: #d19b40'>等待创建</div>";}
                if(state=="creating"){return "<div style='color: #d19b40'>创建中</div>";}
                if(state=="building"){return "<div style='color: #d19b40'>创建中</div>";}
                if(state=="powering-on"){return "<div style='color: #d19b40'>开机中</div>";}
                if(state=="powering-off"){return "<div style='color: #d19b40'>关机中</div>";}
                if(state=="rebooting"){return "<div style='color: #d19b40'>重启中</div>";}
                if(state=="snapshoting"){return "<div style='color: #d19b40'>快照中</div>";}
                if(state=="recovering"){return "<div style='color: #d19b40'>恢复中</div>";}
                if(state=="deleting"){return "<div style='color: #d19b40'>删除中</div>";}
                if(state=="migrating"){return "<div style='color: #d19b40'>迁移中</div>";}
                if(state=="uploading"){return "<div style='color: #d19b40'>上传镜像中</div>";}
                if(state=="preparation"){return "<div style='color: #d19b40'>准备中</div>";}
                if(state=="wait_boot"){return "<div style='color: #d19b40'>等待启动</div>";}
                if(state=="wait_reboot"){return "<div style='color: #d19b40'>等待重启</div>";}
                break;
        }
    };
    TopoNew.prototype.draw = function () {
        this.box.empty();
        var _self = this;
        $(this.data).each(function (i,il) {
            var tmpAll = _self.template.clone(true);
            var netTmp = _self.netTemplate.clone(true);
            var vlanTmp = _self.vlanTemplate.clone(true);
            netTmp.find(".ef-topoNew-net.name").text(il.name);
            netTmp.find(".ef-topoNew-net.brige").text(il.brige);
            netTmp.find(".ef-topoNew-net.brige").tooltip({
                content:'<div><label>网桥：</label>'+il.brige+'</div>'+
                '<div><label>网卡：</label>'+il.nic+'</div>',
                onShow: function(){
                    $(this).tooltip('tip').addClass('topo-tooltip').addClass('brige-tooltip');
                }
            });
            tmpAll.append(netTmp);
            _self.box.append(tmpAll);
            //if(Number(sliceLength)%2!=0){
            //    tmpAll.find(".ef-topoNew-vlan").append('<div class="ef-topoNew-vlan-content" style="display: none;"></div>');
            //}
            //var sliceLength = il.vlan.length;
            if(!il.vlan||il.vlan.length==0){tmpAll.find(".net-slice-vlan").hide();return;}
            tmpAll.append(vlanTmp);
            if(il.vlan.length==2){tmpAll.find('.ef-topoNew-net-content').css({"margin-top":"50px"});}
            if(il.vlan.length>=3){tmpAll.find('.ef-topoNew-net-content').css({"margin-top":"80px"});}
            $(il.vlan).each(function (e,el) {
                var tmpVlan = _self.vlanSimpleTem.clone(true);
                tmpVlan.find(".ef-topoNew-vlan-name").text(el.name);
                if(!el.status=="UNACTIVE"){
                    tmpVlan.find(".ef-topoNew-vlan-slice").addClass("slice-disabled");
                    tmpVlan.find(".ef-topoNew-vlan-name").addClass("disabled");
                    tmpVlan.find(".ef-topoNew-host-slice-vlan").addClass("slice-disabled");
                }
                tmpVlan.find(".ef-topoNew-vlan-name").tooltip({
                    content:'<div><label>名称：</label><div class="tooltip-name-show-wordspace" style="width: 64%">'+el.name+'</div></div>'+
                    '<div><label>类型：</label>'+(el.vlan_type).toUpperCase()+'</div>'+
                    '<div><label>物理网络：</label>'+el.phy_network+'</div>'+
                    '<div><label>VLAN ID：</label>'+el.vlan_id+'</div>'+
                    '<div><label>状态：</label>'+_self.state(el.status,"vlan")+'</div>',
                    onShow: function(){
                        $(this).tooltip('tip').addClass('topo-tooltip').addClass('vlan-tooltip');
                    }
                });
                tmpAll.find(".ef-topoNew-vlan").append(tmpVlan);
                if(!el.subnets||el.subnets.length==0){
                    tmpVlan.find('.ef-topoNew-host-slice-vlan').hide();
                    tmpVlan.find(".ef-topoNew-host-content").hide();
                    return;}
                _self.host(tmpVlan,el.subnets);
            });
            //_self.box.append(tmpAll);
        });
        this.box.find('.ef-topoNew-vlan-content').each(function (i,il) {
            console.log(i,il);
            var domSlice = $(il).children(".ef-topoNew-host-slice-vlan");
            if(i%2!=0){
                domSlice.addClass('change');
                console.log(domSlice);
            }else{domSlice.css({width:"100px;"});}
        });
        this.showClick();
        this.hideClick();
    };
    //子网部分向下展开
    TopoNew.prototype.showClick = function () {
        var _self = this;
        this.box.find(".icon-topo-show").click(function () {
            _self.count = 0;
            var domParent = $(this).parent().parent();
            $(this).prev().find('li').addClass('show-click');
            $(this).prev().addClass('show-click');
            $(this).parent().addClass('show-click');
            domParent.addClass('show-click');
            $(this).hide();
            $(this).siblings('.icon-topo-hide').show();
            domParent.siblings().find(".ef-topoNew-host-content").removeClass('show-click');
            domParent.siblings().removeClass('show-click');
            domParent.siblings().find(".ef-topoNew-host.name").children('ul').children('li').removeClass('show-click');
            $(this).siblings('.ef-topoNew-host.name').children('ul').children('.icon-topo-page-turn-up-disabled').show();
            $(this).siblings('.ef-topoNew-host.name').children('ul').children('.icon-topo-page-turn-down').show();
            $(domParent.siblings().find(".ef-topoNew-host.name").children('ul')).each(function (i,il) {
                if($(il).hasClass('subnet')&&$(il).children().length>2){
                    if($(il).has('i').get(0)){
                        $(il).find('li:nth-child(3)').show().siblings().hide();
                    }
                    else{$(il).find('li:nth-child(1)').show().siblings().hide();}
                }
            });
            //隐藏其余的展开的按钮
            domParent.siblings().find(".ef-topoNew-host.name").children('ul').children('.icon-topo-page-turn-up-disabled').hide();
            domParent.siblings().find(".ef-topoNew-host.name").children('ul').children('.icon-topo-page-turn-up').hide();
            domParent.siblings().find(".ef-topoNew-host.name").children('ul').children('.icon-topo-page-turn-down-disabled').hide();
            domParent.siblings().find(".ef-topoNew-host.name").children('ul').children('.icon-topo-page-turn-down').hide();
            domParent.siblings().find(".ef-topoNew-host.name").removeClass('show-click');
            domParent.siblings().find(".icon-topo-hide").hide();
            domParent.siblings().find('.icon-topo-show').show();
            domParent.siblings().find(".host_simple").removeClass('click');
        });
    };
    //子网部分向上隐藏
    TopoNew.prototype.hideClick = function () {
        var _self = this;
        this.box.find(".icon-topo-hide").click(function () {
            //event.stopPropagation();
            ef.util.map(_self.box.find(".ef-topoNew-vlan-content"), function (il) {
                $(il).prev().css({"padding-bottom":0});
                if($(il).has(".ef-topoNew-vm").get(0)){
                    $(il).css({height:'auto'});
                }
            });
            _self.box.find(".host_simple").removeClass('click').removeClass('select');
            _self.box.find(".ef-topoNew-vm").remove();
            _self.heightValue = 0;
            _self.hostCount = 0;
            $(this).prevAll('.ef-topoNew-host.name').children('ul').children('li').removeClass('show-click');
            $(this).prevAll('.ef-topoNew-host.name').removeClass('show-click');
            $(this).parent().removeClass('show-click');
            $(this).parent().parent().removeClass('show-click');
            $(this).parent().parent().css({height:"125px"});
            //$(this).parent().find("host_simple").removeClass('click');
            $(this).hide();
            $(this).siblings('.icon-topo-show').show();
            $(this).prevAll('.ef-topoNew-host.name').children('ul').children('li').hide();
            if($(this).prevAll('.ef-topoNew-host.name').children('ul').has('i').get(0))
            {$(this).prevAll('.ef-topoNew-host.name').children('ul').children('li:nth-child(3)').show();}
            else{$(this).prevAll('.ef-topoNew-host.name').children('ul').children('li:nth-child(1)').show();}
            $(this).siblings('.ef-topoNew-host.name').children('ul').children('.icon-topo-page-turn-up-disabled').hide();
            $(this).siblings('.ef-topoNew-host.name').children('ul').children('.icon-topo-page-turn-up').hide();
            $(this).siblings('.ef-topoNew-host.name').children('ul').children('.icon-topo-page-turn-down').hide();
            $(this).siblings('.ef-topoNew-host.name').children('ul').children('.icon-topo-page-turn-down-disabled').hide();
        });
    };
    //子网的点击事件
    TopoNew.prototype.subnetClick = function (callback) {
        var _self = this;
        this.box.find(".host_simple").click(function () {
            if($(this).hasClass('click')){
                $(this).removeClass('click');
                $(this).next().remove();
                $(this).siblings().removeClass("select");
                $(this).parent().parent().parent().parent().parent().parent().css({height:'auto'});
                _self.heightValue = 0;
                return;
            }
            ef.util.map(_self.box.find(".ef-topoNew-vlan-content"), function (il) {
                $(il).prev().css({"padding-bottom":0});
                if($(il).has(".ef-topoNew-vm").get(0)){
                    $(il).css({height:"auto"});
                }
            });
            var dom = $(this);
            var domPar = dom.parent().parent().parent().parent().parent().parent();
            _self.vlanLength = Math.ceil(domPar.parent().children().length/2);
            _self.index = domPar.parent().children().index(domPar);
            _self.indexPar = $(this).parent().parent().children().index($(this).parent());
            _self.subnetVmDom = dom;
            _self.subnet = dom.children('.ef-topo-con-every-none').text();
            //dom.addClass('click');
            //dom.parent().siblings().find(".host_simple").removeClass('click');
            _self.box.find(".host_simple").removeClass('click');
            dom.addClass('click');
            callback(_self.subnet);
        })
    };
    //点击使主机消失
    TopoNew.prototype.displayNone = function () {
        var _self = this;
        this.box.find(".vm-li").find(".ef-topo-con-every").click(function (event) {
            event.stopPropagation();
        });
        this.box.find(".ef-topoNew-vm").find("i").click(function (event) {
            event.stopPropagation();
        });
        this.box.find(".ef-topoNew-vm").find(".ef-topoNew-list-simple-content").click(function (event) {
            event.stopPropagation();
        });
        this.box.find(".host_simple").click(function (event) {
            event.stopPropagation();
        });
        this.box.find(".icon-topo-hide").click(function () {
            event.stopPropagation();
        });
        $(document).bind('click',function(){
            ef.util.map(_self.box.find(".ef-topoNew-vlan-content"), function (il) {
                $(il).prev().css({"padding-bottom":0});
                if($(il).has(".ef-topoNew-vm").get(0)){
                    $(il).css({height:'auto'});
                    if($(il).find('.icon-topo-show').css('display')=='none'){
                        $(il).addClass('show-click');
                    }
                }
            });
            _self.box.find(".host_simple").removeClass('click').removeClass('select');
            _self.box.find(".ef-topoNew-vm").remove();
            _self.heightValue = 0;
        });
    };
    ef.register(TopoNew,"topoNew");
    return TopoNew;
});
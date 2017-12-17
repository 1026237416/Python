/**
 * Created by wangahui1 on 15/12/21.
 */
;
define(["order.ready","clientPaging","api","module","security"], function (orderReady,client,api,module,security) {
    var implement = new ef.Interface.implement();
    implement.detailRights = [];
    implement.getDetailRights = function (type, status) {
        var result = [];
        if (type == 0) {
            switch (Number(status)) {
                case 2://已撤销
                {
                    result = ["type", "os", "operator", "des","status"];
                    break;
                }
                case 5://已拒绝
                {
                    result = ["type", "os", "operator", "auditor", "des","status"];
                    break;
                }
                case 3://已完成
                {
                    result = ["type", "security", "region", "os", "image", "user", "tenant", "operator", "auditor", "vlan", "ip", "host", "des", "status"];
                    break;
                }
                case 1://开通失败
                {
                    result = ["type", "security", "region", "os", "image", "user", "tenant", "operator", "auditor", "vlan", "ip", "host", "des", "status"];
                    break;
                }
                case 4://开通中
                {
                    result = ["type", "security", "region", "os", "image", "user", "tenant", "operator", "auditor", "vlan", "ip", "host", "status","des"];
                    break;
                }
            }
        }
        if (type == 1) {
            switch (Number(status)) {
                case 2://已撤销
                {
                    result = ["type", "operator", "des", "status"];
                    break;
                }
                case 5://已拒绝
                {
                    result = ["type", "operator", "auditor", "des", "status"];
                    break;
                }
                case 3://已完成
                {
                    result = ["type", "security", "region", "user", "tenant", "operator", "auditor", "mount", "des","status"];
                    break;
                }
                case 1://开通失败
                {
                    result = ["type", "security", "region", "user", "tenant", "operator", "auditor", "mount", "des", "status"];
                    break;
                }
                case 4://开通中
                {
                    result = ["type", "security", "region", "user", "tenant", "operator", "auditor", "mount", "des", "status"];
                    break;
                }
            }
        }
        return result;
    };
    implement.init = function () {
        $(".readydetail-icon-box").iconmenu([{
            iconClass: "icon-menus-icon-back",
            tip: ef.util.getLocale('framework.component.iconmenu.back.tip'),//"返回",
            "access": [8, 9, 10, 88],
            click: function () {
                ef.nav.goto("order.ready.html", "order.ready");
            }
        }]);
        $("#description").text(ef.util.getLocale("order.ready.detail.info.label"));
        $("#sourceList").text(ef.util.getLocale("order.ready.detail.source.label"));

    };
    implement.getStatusStyle = function (status) {
        var cls = "";
        switch (Number(status)) {
            case 1:
            {
                return "status_stop_color";
                break;
            }
            case 2:
            {
                return "status_stop_color";
                break;
            }
            case 3:
            {
                return "status_play_color";
                break;
            }
            case 4:
            {
                return "status_exec_color";
                break;
            }
            case 5:
            {
                return "status_stop_color";
                break;
            }
            default:
            {
                cls = "plain";
            }
        }
        return cls;
    };
    implement.renderGrid=function(response)
    {
        return $("#orderReadySource").datagrid({
            data: response.resources,
            singleSelect: true,
            pagination: true,
            pageSize: 10,
            columns: [[
                {
                    field: 'type',
                    width: "20%",
                    title: ef.util.getLocale("order.ready.info.grid.head.type"),
                    formatter: orderReady.getType
                },
                {field: 'displayname', width: "20%", title: ef.util.getLocale("order.ready.info.grid.head.name")},
                {
                    field: 'size',
                    width: "20%",
                    title: ef.util.getLocale("order.ready.info.grid.head.quota"),
                    formatter:function(val,row)
                    {
                        if(row.type==0)
                        {
                            return row.cores+"核 "+ef.util.mb2gb(row.memory,2)+"GB";
                        }else
                        {
                            return row.size+"GB";
                        }

                    }
                },
                {field: 'sys_volume', width: "20%", title: ef.util.getLocale("order.ready.info.grid.head.store"),formatter:function(val,row)
                {
                    if(row.type==0)
                    {
                        return val;
                    }else
                    {
                        return row.volume_type;
                    }
                }},
                {
                    field: 'status',
                    width: "23%",
                    title: ef.util.getLocale("order.ready.info.grid.head.status"),
                    formatter: function (val, row) {
                        var $dom = $('<span class="status_icon_box"><i></i><span>' + ef.util.getLocale('host.hostdetail.blocklistlabel.description.data_status2') + '</span></span>');
                        var icon = $dom.find("i");
                        var text = $dom.find("span");
                        if (row.type == 0) {
                            switch (Number(val)) {
                                case 0:
                                {
                                    icon.addClass("icon-status-doing");//开通中
                                    text.text(ef.util.getLocale("order.ready.info.grid.status.create.doing"));
                                    break;
                                }
                                case 1:
                                {
                                    icon.addClass("icon-status-done-success");
                                    text.text(ef.util.getLocale("order.ready.info.grid.status.create.success"));
                                    break;
                                }
                                case 2:
                                {
                                    icon.addClass("icon-status-done-fail");
                                    text.text(ef.util.getLocale("order.ready.info.grid.status.create.fail"));
                                    break;
                                }
                                case -1:
                                {
                                    icon.addClass("icon-status-done-fail");//未创建
                                    text.text(ef.util.getLocale("order.ready.info.grid.status.create.undo"));
                                    break;
                                }

                            }
                        } else {
                            switch (Number(val)) {
                                case -1:
                                {
                                    icon.addClass("icon-status-done-fail");//未创建
                                    text.text(ef.util.getLocale("order.ready.info.grid.status.create.undo"));
                                    break;
                                }
                                case 0:
                                {
                                    icon.addClass("icon-status-doing");//开通中
                                    text.text(ef.util.getLocale("order.ready.info.grid.status.create.doing"));
                                    break;
                                }
                                case 1:
                                {
                                    icon.addClass("icon-status-done-success");
                                    text.text(ef.util.getLocale("order.ready.info.grid.status.create.success"));
                                    break;
                                }
                                case 2:
                                {
                                    icon.addClass("icon-status-done-fail");
                                    text.text(ef.util.getLocale("order.ready.info.grid.status.create.fail"));
                                    break;
                                }
                                case 3:
                                {
                                    icon.addClass("icon-status-done-success-disk");
                                    text.text(ef.util.getLocale("order.ready.info.grid.status.disk.success"));
                                    break;
                                }
                                case 4:
                                {
                                    icon.addClass("icon-status-done-fail-disk");
                                    text.text(ef.util.getLocale("order.ready.info.grid.status.disk.fail"));
                                    break;
                                }
                            }
                        }
                        return $dom[0].outerHTML;
                    }
                }
            ]]
        }).datagrid({data:response.resources}).datagrid("clientPaging");
    };
    implement.renderSimpleGrid=function(response)
    {
        return $("#orderReadySource").datagrid({
            singleSelect: true,
            pagination: true,
            pageSize: 10,
            columns: [[
                {
                    field: 'type',
                    width: "33%",
                    title: ef.util.getLocale("order.ready.info.grid.head.type"),
                    formatter: orderReady.getType
                },
                {field: 'displayname', width: "35%", title: ef.util.getLocale("order.ready.info.grid.head.name")},
                {
                    field: 'size',
                    width: "35%",
                    title: ef.util.getLocale("order.ready.info.grid.head.quota"),
                    formatter:function(val,row)
                    {
                        if(row.type==0)
                        {
                            return row.cores+"核 "+ef.util.mb2gb(row.memory,2)+"GB";
                        }else
                        {
                            return row.size+"GB";
                        }

                    }
                }
            ]]
        }).datagrid({data:response.resources}).datagrid("clientPaging");
    };
    implement.renderDetail = function (_data,id) {
        var _self = this;
        ef.getJSON(
            {
                url: api.getAPI("order") + "/" + id,
                type: "get",//get,post,put,delete
               isForce: true,
                success: (Number(_data.status)==2||Number(_data.status)==5)?this.renderSimpleGrid:this.renderGrid
            });
        $(".ready-detail-descript [field-name]").each(function () {
            var fieldName = $(this).attr("field-name");
            if (ef.util.contains(_self.detailRights, fieldName)) {
                var label = $(this).find("label");
                var text = $(this).find("span");
                label.text(ef.util.getLocale("order.ready.info.label." + fieldName)+"：");
                text.text(_data[fieldName]);
                if (fieldName == "type") {
                    text.text(orderReady.getType(_data.type));
                }
                if (fieldName == "tenant") {
                    var tenant;
                    $(_data).each(function (i, il) {
                        tenant = il.tenant.name;
                    })
                    text.text(tenant);
                }
                if(fieldName=="status")
                {
                    text.text(orderReady.getStatus(_data.status));
                    text.addClass(_self.getStatusStyle(_data.status));
                }
                if(fieldName=="security")
                {
                    text.text(security.getSecurityByValue(_data.security).label);
                }
                if(fieldName=="region")
                {
                    api.getDataCenter(undefined,function(response)
                    {
                        text.text(ef.util.find(response,function(item)
                        {
                            return item.region==_data.region;
                        }).displayname);
                    });
                }

            } else {
                $(this).remove();
            }
        });
        var _firstWidth=$(".ready-detail-descript .border-fisrt").height();
        var _doubleHeight=$(".ready-detail-descript .double-border").height();
        if(_doubleHeight<_firstWidth)
        {
            $(".ready-detail-descript .double-border").height(_firstWidth);
        }
    };
    implement.redraw = function () {
        var _self = this;
        this.init();
        ef.util.ready(function (dom) {
            var _data = ef.util.getCrossData(dom);
            ef.getJSON(
                {
                    url: api.getAPI("order") + "/" + _data.id,
                    type: "get",//get,post,put,delete
                    isForce: true,
                    success: function (response){
                        $(response).each(function (i,il){
                            il.os = ef.util.pluck(il.resources,"os").join("");
                            il.name = ef.util.pluck(il.resources,"displayname").join("");
                            il.operator = il.creator.displayname;
                            if(il.auditor!=null){
                                il.auditor = il.auditor.displayname;
                            }
                            if(il.user!=null){
                                il.user = il.user.displayname;
                            }
                            $(il.resources).each(function(e,el){
                                if(el.image){
                                    il.image = el.image.name;
                                }
                                if(el.vminfo){
                                    il.mount = el.vminfo.displayname;
                                }
                                if(el.host){
                                    il.host = el.host;
                                }
                                $(el.network).each(function (j,ll) {
                                   il.vlan = ll.vlan.name;
                                   il.ip = ll.ip;
                                });
                            });
                            _self.detailRights = _self.getDetailRights(il.type, il.status);
                        });
                        _self.renderDetail(response,_data.id);
                    },
                    error: function (error) {
                        console.log(error);
                   }
                });
        });
    };
    implement.destroy = function () {
        require.undef(module.id);
    };
    return implement;
});
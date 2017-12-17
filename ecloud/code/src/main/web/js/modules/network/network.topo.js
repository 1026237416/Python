/**
 * Created by wangahui1 on 15/11/6.
 */
define("network.topo",["user","domReady","api","module"],function(user,domReady,api,module)
{
    var implement=new ef.Interface.implement();
    implement.isForce=true;
    implement.getFormatTopoData=function(response,resp)
    {
        var obj={columns:[],items:[]};
        $(response).each(function(i,il)
        {
            il.location = "所在网络："+il.network_name;
            il.label=il.name;
            obj.columns.push(il);
        });
        if(resp){
            var dataArr =[];
            for(var i=0;i<resp.length;i++){
                var item=resp[i];
                resp[i].from = resp[i].from_vlan;
                resp[i].to = resp[i].to_vlan;
                ef.util.find(resp,function(data){
                    if(!data){
                        return;
                    }
                    if(resp[i].from_vlan==data.to_vlan&&data.from_vlan==resp[i].to_vlan){
                        item.twoway=true;
                        var index = resp.indexOf(data);
                        resp.splice(index,1);
                    }
                });
                obj.items = resp;
            }
        }
        return obj;
    };
    //!**获取所有vlan*!/
    /*implement.getAllVlan=function(isForce,callback)
    {
        ef.getJSON(
            {
                url: api.getAPI("network.vlan.datagrid_vlan"),
                type: "get",//get,post,put,delete
                isForce: isForce,
                success: function (response) {
                  if(callback)
                  {
                      callback(response);
                  }
                },
                error: function (err) {

                }
            });
    };
    implement.relation = function (callback) {
        ef.getJSON(
            {
                url: api.getAPI("setting.project.tenanteDetail.table"),
                type: "get",//get,post,put,delete
                isForce: true,
                success: function (response) {
                    response=ef.util.uniq(response,function(item)
                    {
                        return item.to_vlan&&item.from_vlan;
                    });
                    callback(response);
                },
                error: function () {

                }
            });
    };
    implement.refreshTopo=function()
    {
        ef.getJSON(
            {
                url: api.getAPI("network.vlan.datagrid_vlan"),
                type: "get",//get,post,put,delete
                isForce: true,
                success: function (response) {

                },
                error: function () {

                }
            }
        );
    };
    implement.addListener=function()
    {
        this._topo.click(function(event)
        {
            switch (event.targetIndex) {
                case 1:
                {
                    new ef.Dialog("getIpList",{
                        param:
                        {
                            id:event.targetIndex,
                            relation:event.data.relation,
                            isEdit:implement._topo.isEdit
                        },
                        title: ef.util.getLocale("network.topo.ip.title"),
                        width:750,
                        height:555,
                        closed: false,
                        cache: false,
                        nobody:false,
                        href: "views/ip_list2.html",
                        modal: true,
                        onResize:
                            function(){
                                $(this).dialog('center');
                            },
                        onLoad: function () {
                            require(['ip_list2'], function (ip) {
                                ef.getJSON({
                                    url:api.getAPI("order.wait.Detail.combo.ip")+"/"+event.data.id+"/ips",
                                    type:"get",
                                    success: function (response) {
                                        var result={};
                                        result.cidr=event.data.cidr;
                                        response.push({gateway:true,ip:event.data.gateway});
                                        result.ips=ef.util.copyDeepProperty(response);
                                        ip.redraw(result);
                                    }
                                });
                            })
                        },
                        onClose: function () {
                            require.undef('ip_list2');
                        }
                    });
                    break;
                }
                case 0:
                {
                    new ef.Dialog("getHostList",{
                        param:
                        {
                            id:event.targetIndex,
                            relation:event.data.relation,
                            isEdit:implement._topo.isEdit
                        },
                        title: ef.util.getLocale("network.topo.host.title"),
                        width:750,
                        height:555,
                        closed: false,
                        cache: false,
                        nobody:false,
                        href: "views/host_list2.html",
                        modal: true,
                        onResize:
                            function(){
                                $(this).dialog('center');
                            },
                        onLoad: function () {
                            require(['host_list2'], function (host) {
                                vlanDetail.getVlanHosts(event.data.id,function(response)
                                {
                                    host.redraw(response);
                                },function()
                                {

                                });
                            })
                        },
                        onClose: function () {
                            require.undef('host_list2');
                        }
                    });
                    break;
                }
            }

            //$("#hostlistBox").dialog("refresh",_href);
        });
    };
    implement._topo=null;
    implement.redraw=function()
    {
        $("#reset").click(function () {
            $("#topo_host").combobox('clear');
        });
        $(".topo-box").preload(400);
        domReady(function()
        {
            $("#topo_host").combobox({
                prompt:ef.util.getLocale("topo.combobox.prompt"),
                iconCls:'icon-search',
                iconAlign:'left',
                url: 'data/mash.json',
                method: 'get',
                valueField:'value',
                textField:'label'
            });
            var copyData;
            ef.getJSON(
                {
                    url:api.getAPI("network.vlan.datagrid_vlan"),
                    type:"get",//get,post,put,delete
                    isForce:true,
                    success:function(response)
                    {
                        implement.relation(function (resp) {
                            var vlanData = [];
                            implement._topo=$(".topo-box").topo(ef.util.dcopy(implement.getFormatTopoData(response,resp)),{isEdit:false,isDrag:false});
                            copyData = ef.util.dcopy(implement.getFormatTopoData(response,resp));
                            if(user.isSys()||user.isSuper()){
                                var _topBtns=$(".topbtns").togglebutton([
                                    [
                                        {
                                            iconClass: "icon-menus-icon-edit",
                                            tip:ef.util.getLocale("global.button.edit.label"),
                                            click:function()
                                            {
                                                implement._topo.setMode(true);
                                                implement._topo.isDrag=true;
                                                _topBtns.goto(1);
                                            }
                                        }
                                    ],
                                    [
                                        {
                                            iconClass: "icon-menus-icon-save",
                                            tip:ef.util.getLocale("global.button.save.label"),
                                            click:function()
                                            {
                                                $(implement._topo.data.items).each(function (i,il) {
                                                    if(il.twoway){
                                                        vlanData.push({"from_vlan":il.to,"to_vlan": il.from});
                                                    }
                                                    var data = {"from_vlan":"","to_vlan":""};
                                                    data.from_vlan = il.from;
                                                    data.to_vlan = il.to;
                                                    vlanData.push(data);
                                                });
                                                ef.getJSON({
                                                    url:api.getAPI("setting.project.tenanteDetail.table"),
                                                    type:"post",
                                                    data:vlanData,
                                                    success: function () {
                                                        copyData = ef.util.dcopy(implement._topo.data);
                                                        implement._topo.setMode(false);
                                                        implement._topo.update();
                                                        _topBtns.goto(0);
                                                    }
                                                });
                                            }
                                        },
                                        {
                                            iconClass: "icon-menus-icon-cancel",
                                            tip:ef.util.getLocale("global.button.cancel.label"),
                                            click:function()
                                            {
                                                implement._topo.setMode(false);
                                                implement._topo.update(ef.util.dcopy(copyData),{isEdit:false,isDrag:false});
                                                _topBtns.goto(0);
                                            }
                                        }

                                    ]
                                ]);
                            }
                            implement.addListener();
                            ef.event.on("selectHostListEvent",function(event,data)
                            {
                                console.log(data);
                            });
                        });

                    },
                    error:function(error)
                    {
                        console.log(error);
                    }
                });
        });
    };*/
    implement.getData = function (callback) {
        var data = [];
      ef.getJSON({
          url:api.getAPI("phynetworks"),
          type:"get",
          success: function (response) {
              var dataNet = [];
              data = response;
              var vlanSequence = ef.util.map(data, function (il) {
                 return {
                     url:api.getAPI("network.vlan.datagrid_vlan"),
                     type:"GET",
                     data: {phy_network: il.name},
                     success:function(respNet)
                     {
                         il.vlan = respNet[0];
                         //dataNet.push(result);
                     },
                     error:function()
                     {
                        ef.placard.warn("获取数据失败");
                     }
                 }
              });
              var sequenceV=new ef.SequenceLoader(vlanSequence).allExecuted(function(result)
              {
                  var subnetSequence = [];
                  ef.util.map(data, function (il) {
                      ef.util.map(il.vlan, function (el) {
                          subnetSequence.push({
                              url:api.getAPI("subnets"),
                              type:"GET",
                              data:{network_id:el.id},
                              success:function(respSubnet)
                              {
                                  el.subnets = respSubnet[0];
                              },
                              error:function()
                              {
                                  ef.placard.warn("获取数据失败");
                              }
                          });
                      });
                  });
                  if(subnetSequence.length==0){callback(data);return;}
                  var sequenceS=new ef.SequenceLoader(subnetSequence).allExecuted(function (result) {
                      callback(data);
                  });
              });
          }
      });
    };
    implement.redraw = function () {
        //ef.loading.show();
        domReady(function () {
            $('.cover').coverlayer({loadingHeight:'100%'},{opaque:true});
            var data = implement.getData(function (data) {
                var topoNew = $(".topo-box").topoNew({
                    data:data
                });
                $(".cover").remove();
                //ef.loading.hide();
                topoNew.subnetClick(function (id) {
                    ef.loading.show();
                    ef.getJSON({
                        url:api.getAPI("hostList"),
                        type:'get',
                        data:{subnet_id:id},
                        success: function (resp) {
                            var len;
                            if(resp.length<8){
                                len = resp.length*20+100;
                            }
                            else{len = 8*20+100;}
                            topoNew.vm(resp,len);
                            ef.loading.hide();
                        },
                        error: function () {
                            ef.loading.hide();
                            ef.placard.warn("获取信息失败！请重试！");
                        }
                    });
                });
            });
        });
    };
    implement.destroy=function()
    {
        require.undef(module.id);
    };
    return implement;
});
/**
 * Created by wangahui1 on 15/11/6.
 */
define("manor.instance.view.monitor",["domReady","api","module"],function(domReady,api,module)
{
    var implement=new ef.Interface.implement();
    implement.socket=null;
    implement.cover=null;
    implement.hasNodeData=true;
    implement.redraw=function(socketId)
    {
        this.init();
        this.initSocket(socketId);
    };
    implement.initSocket=function(socketId)
    {
        var _self=this;
        this.socket=new ef.server.Socket(api.getAPI("manor.instance.execute.socket",true),"manor.instance.execute");//manor.instance.execute
        this.socket.onopen=function()
        {
            _self.sendMsg(socketId);
        };
        this.socket.onmessage=function(event)
        {
            console.log("[script] socket receive msg:",event[0].data);
            _self.updateSocketData(event[0].data);
        };
        this.socket.onerror=function()
        {
            console.log("socket error");
        };
        this.socket.onclose=function()
        {
            console.log("socket closed");
        };
    };
    implement.sendMsg=function(socketId)
    {
        var sendData=JSON.stringify(
            {
                message_token:socketId
            }
        );
        this.socket.send(sendData);
        console.log("sendData:",sendData);
    };
    implement.getFormatTitle=function(data)
    {
        var result=[];
        var title=data.msg.title;
        if(!title||!title.length)
        {
            return;
        }
        var percenter=Math.ceil(110/title.length);
        $(title).each(function(i,il)
        {
            var title=il.label;
            if(il.key=="component_name")
            {
                title="组件名称"
            }
            if(il.key=="state")
            {
                title="当前状态";
            }
            var obj=
            {
                field:il.key,
                title:title,
                width:percenter+"%"
            };
            if(il.key=="state")
            {
                obj.formatter=function(val,row,index)
                {
                    var status="";
                    var $dom=$("<a/>");
                    if(val=="STARTED"||val=="INSTALLED"||val=="INSTALL_FAILED")
                    {
                        status=String(val).toLowerCase();
                    }else
                    {
                        status="doing";
                    }
                    $dom.text(val);
                    $dom.addClass("instance_monitor_"+status);
                    return $dom;
                }
            }
            result.push(obj);
        });
        return result;
    };
    implement.getFormatData=function(data)
    {
        return data.msg.content;
    };
    implement.updateSocketData=function(data)
    {
        data=JSON.parse(data);
        if(!data)return;
        data.msg=JSON.parse(data.msg);
        $(".grid_box",".instance_monitor_view").empty();
        var template=this.template.clone();
        $(".grid_box",".instance_monitor_view").append(template);
        template.datagrid({
            singleSelect:true,
            columns:[this.getFormatTitle(data)],
            data:this.getFormatData(data)
        });
        if(implement.cover)
        {
            implement.cover.hide();
        }
        implement.hasNodeData=false;
        clearTimeout(implement.tm);
    };
    implement.init=function()
    {
        this.template=$(".monitor_grid",".instance_monitor_view").clone();
        $(".btn.last",".instance_monitor_view").click(function()
        {
            ef.Dialog.close("manor.instance.view.monitor");
        });
        this.cover=$(".grid_box").coverlayer({loadingHeight:280});
        implement.tm=setTimeout(function()
        {
            implement.cover.hide();
            if(implement.hasNodeData)
            {
                $(".grid_box").coverlayer({content:'<div style="width:100%;height: 100%;vertical-align: middle;display: table;text-align: center"><span style="display: table-cell;vertical-align: middle">无数据返回</span></div>',loadingHeight:280},{transparent:true});
            }
        },15000);
    };
    implement.destroy=function()
    {
        require.undef(module.id);
        this.socket.close();
    };
    return implement;
});
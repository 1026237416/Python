/**
 * Created by wangahui1 on 15/11/6.
 */
define(["easyui","module"],function(easyui,module)
{
    var implement=new ef.Interface.implement();
    implement.redraw= function () {
        ef.fn['cal.snapshot.openVMDetail']=function()
        {
            $(".dialog-box").eq(0).dialog({
                title:ef.util.getLocale('cal.snapshot.openVMDetail.dialog'),//'快照',
                width:750,
                height:510,
                closed: false,
                cache: false,
                nobody:false,
                href: 'vmdetail.html',
                modal: true,
                onResize:function(){
                    $(this).dialog('center');
                }
            });
        };
        ef.formatter['idFormatter'] = function(val,row)
        {
            return '<a class="table-link" onclick="ef.fn[\'cal.snapshot.openVMDetail\']()">'+val+'</a>';
        };
        $(document).ready(function()
        {
            return;
            ef.getJSON({
                url:"data/datagrid_snapshothost.json",
                type:"get",//get,post,put,delete
                useLocal:true,
                success:function(response) {
                    $('#snapshot_host').datagrid({data:response}).datagrid('clientPaging');
                },
                error:function(error)
                {
                    console.log(error);
                }
            });
            ef.getJSON({
                url:"data/datagrid_snapshotdisk.json",
                type:"get",//get,post,put,delete
                useLocal:true,
                success:function(response) {
                    $('#snapshot_disk').datagrid({data:response}).datagrid('clientPaging');
                },
                error:function(error)
                {
                    console.log(error);
                }
            });
        });

    };
    implement.destroy=function()
    {
        require.undef(module.id);
    };
    return implement;
});
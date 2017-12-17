/**
 * Created by wangahui1 on 16/7/1.
 */
define(["module","exports"],function(module,exports)
{
    return function()
    {
        var impls=ef.Interface.implement();
        impls.owner=null;
        impls.context=null;
        impls.redraw=function(selectedNodeId,context)
        {
            this.selectedNodeId=selectedNodeId;
            this.context=context;
            this.init();
        };
        impls.getData=function()
        {
            return this.owner.utils.getSelectedNodeData(this.selectedNodeId);
        };
        impls.getParams=function()
        {
            var result=false;
            var data=this.getData();
            if(data)
            {
                result=data[this.selectedNodeId];
                result=result.params;
            }
            return result;
        };
        impls.isValid=function()
        {
            var params=impls.getParams();
            if(params[1].reboot_node_target!="group")
            {
                return true;
            }
            if(!params[0].streamlet_params_properties_hide&&!$("#paramGroupNameInput",this.context).textbox("isValid"))
            {
                return false;
            }
            return true;
        };
        impls.init=function()
        {
            var params=this.getParams();
            $("#paramGroupNameRebooter",this.context).combobox(
                {
                    width:197,
                    height:30,
                    required:true,
                    editable:false,
                    textField:"label",
                    valueField:"value",
                    readonly:params[1].streamlet_params_properties_read_only,
                    value:params[1].reboot_node_target,
                    data:[{label:"all",value:"all"},{label:"group",value:"group"}],
                    onChange:function(newValue)
                    {
                        if(!newValue)return;
                        var params=impls.getParams();
                        params[1].reboot_node_target=newValue;
                        if(newValue=="group")
                        {
                            //
                            $(".other_hide",impls.context).show();
                            if(params[0].streamlet_params_properties_hide)
                            {
                                $(".other_hide",impls.context).hide();
                            }
                        }else
                        {
                            $(".other_hide",impls.context).hide();
                        }

                    }
                });
            $("#paramGroupNameInput",this.context).textbox(
                {
                    width:197,
                    height:30,
                    required:true,
                    readonly:params[0].streamlet_params_properties_read_only,
                    onChange:function(newValue,oldVlaue)
                    {
                        if(!newValue)return;
                        var params=impls.getParams();
                        params[0].group_name=newValue;
                    }
                });

            if(params[1].streamlet_params_properties_hide)
            {
                $(".reboot_param_set",this.context).hide();
            }
            ef.i18n.parse($(".reboot_box",this.context));
            if(params[0].group_name)
            {
                $("#paramGroupNameInput",this.context).textbox("setValue",params[0].group_name);
            }
            if(params[1].reboot_node_target=="group")
            {
                $(".other_hide",impls.context).show();
                if(params[0].streamlet_params_properties_hide)
                {
                    $(".other_hide",impls.context).hide();
                }
            }

        };
        this.implement=impls;
    }
});
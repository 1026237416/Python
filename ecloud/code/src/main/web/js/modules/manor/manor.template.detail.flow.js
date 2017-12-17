/**
 * Created by wangahui1 on 16/5/13.
 */
define(["exports","module","domReady","manor.template.detail.flow.create"],function(exports,module,domReady,flowCreate)
{
    var DetailFow=function(panel)
    {
        this.panel=panel;
        this.disable=true;
        this.type="flow.install";
        this.owner=null;
        this.picker=null;
        this.init();
        return this;
    };
    DetailFow.prototype.init=function()
    {
        this.option=this.panel.panel("options");
    };
    DetailFow.prototype.redraw=function(originData,owner)
    {
        var newData=ef.util.copyDeepProperty(originData);
        originData=originData.data;
        var _self=this;
        var target=[
            {
                label:"cluster",
                value:"cluster"
            },
            {
                label:"group",
                value:"group"
            },
            {
                label:"node",
                value:"node"
            }
        ];
        this.panel.find(".manor_flow_panel #flowName").textbox({width:197,height:30,value:originData.label,readonly:true,required:true,maxlength:15,
            validType: 'whitelist["\u4E00-\u9FA5A-Za-z0-9_-","数字,字母,中文,中划线和下划线"]'});
        this.panel.find(".manor_flow_panel #flowRange").combobox({width:197,height:30,readonly:true,data:target,value:originData.target,textField:"label",valueField:"value",editable:false});
        this.panel.find(".manor_flow_panel #flowDes").textbox({width:555,height:60,value:originData.description,readonly:true,multiline:true});
        var _self=this;
        flowCreate.getIcon(function(resp)
        {
            _self.picker=_self.panel.find(".manorMangeIconPicker").picker(
                {
                    dataProvider:resp
                });
            _self.picker.setSelectByClass(originData.icon);
            _self.picker.setDisable(_self.disable);
        });
        if(owner)
        {
            _self.owner=owner;
        }
        this.panel.find(".manor_flow_innter_create").load("./views/addManorTemplateCreate.html",function()
        {
            require(["manor.template.create"],function(TemplateCreate)
            {
                _self.option.dataProvider=(new TemplateCreate()).implement;

                _self.option.dataProvider.owner=_self;
                _self.option.dataProvider.superOwner=owner;
                _self.panel.find(".viewstack-box-dlg .item-ul-one-col").remove();
                ef.i18n.parse(_self.panel.find(".manor_flow_panel"));
                _self.option.dataProvider.redraw(null,_self.panel,newData,function()
                {
                    _self.setDisable(_self.disable);
                });
                _self.option.dataProvider.buttonStep.goto(1);
                _self.panel.find(".button-route").hide();
            });
        });
    };
    DetailFow.prototype.getData=function(simpleData)
    {
        var obj={
            label:this.panel.find(".manor_flow_panel #flowName").textbox("getValue"),
            target:this.panel.find(".manor_flow_panel #flowRange").textbox("getValue"),
            description:this.panel.find(".manor_flow_panel #flowDes").textbox("getValue"),
            icon:this.picker.getSelected().data.icon
        };
        if(simpleData)
        {
            return ef.util.copy(obj,simpleData);
        }
        return obj;
    };
    DetailFow.prototype.setDisable=function(bool)
    {
        this.disable=bool;
        this.panel.find(".manor_flow_panel #flowName").textbox({readonly:Boolean(bool)});
        this.panel.find(".manor_flow_panel #flowRange").combobox({readonly:Boolean(bool)});
        this.panel.find(".manor_flow_panel #flowDes").textbox({readonly:Boolean(bool)});
        if(this.option.dataProvider.setDisable){
            this.option.dataProvider.setDisable(this.disable);
        }
        if(this.picker)this.picker.setDisable(bool);
    };
    return DetailFow;
});
/**
 * Created by wangahui1 on 16/4/20.
 */
define("framework.switch",["exports","framework.core"],function(exports,ef)
{
    /**
     * 开关按钮，用于替代Easyui的switchbutton
     * @class ef.components.Switch
     *
     * **使用范例**：
     *
     *     @example
     *     var switcher=$(".switchBox").switch(
     *      {
         *         checked:true,
         *        disabled:false,
         *        onTip:"关机",
         *        offTip:"开机",
         *        change:function(checked)
         *        {
         *            console.log("abc",this);
         *            console.log(checked);
         *        }});
     *        switcher.setDisable(true);//设置为不可用
     *        switcher.toSwitch(true);//切换为开
     *  @return switch对象
     * */
    function Switch(box,config)
    {
        this.onTip=undefined;
        this.offTip=undefined;
        this.onLabel="ON";
        this.offLabel="OFF";
        this.disabled=false;
        this.checked=true;
        this.box=box;
        this.changeCallback= $.noop;
        this.container=$('<div class="ef-switch"><div><span class="ef-switch-dot"></span><span class="ef-switch-text"></span></div></div>');
        this.init(config);
        this.addListener();
        return this;
    }
    Switch.isDom=true;
    Switch.prototype.init=function(config)
    {
        if(config)
        {
            if(config.change)
            {
                this.change(config.change);
                delete config.change;
            }
            _.copyProperty(this,config);

        }
        this.draw();
    };
    Switch.prototype.addListener=function()
    {
        this.container.off();
        var _self=this;
        this.container.click(function()
        {
            if(_self.disabled)return;
            _self.toSwitch(!_self.checked);
        });
        this.container.hover(function()
        {
            if(_self.disabled)
            {
                $(this).find("div").tooltip("hide");
            }
        });
    };
    /**侦听change事件*/
    Switch.prototype.change=function(fn)
    {
        this.changeCallback=fn;
        return this;
    };
    Switch.prototype.draw=function()
    {
        this.box.empty();
        this.box.append(this.container);
        this.toSwitch(this.checked);
        this.setDisable(this.disabled);
    };
    /**切换开关*/
    Switch.prototype.toSwitch=function(bool)
    {
        this.checked=bool;
        this.container.find("div").removeClass();
        if(bool)
        {
            this.container.find("div").addClass("ef-switch-on");
            this.container.find(".ef-switch-text").text(this.onLabel);
            this.container.find("div").append(this.container.find(".ef-switch-dot"));
        }else
        {
            this.container.find("div").addClass("ef-switch-off");
            this.container.find(".ef-switch-text").text(this.offLabel);
            this.container.find("div").prepend(this.container.find(".ef-switch-dot"));
        }
        this.changeCallback(bool);
        if(bool&&this.onTip)
        {
            this.container.find("div").tooltip({content:this.onTip});
        }
        if(!bool&&this.offTip)
        {
            this.container.find("div").tooltip({content:this.offTip});
        }
    };
    /**设置不可用*/
    Switch.prototype.setDisable=function(bool)
    {
        this.disabled=bool;
        if(bool)
        {
            this.container.find("div").addClass("ef-switch-disable");
        }else
        {
            this.container.find("div").removeClass("ef-switch-disable");
        }
        return this;
    };
    ef.register(Switch,"switch");
    return Switch;
});
/**
 * Created by wangahui1 on 16/5/10.
 */
/**弹出的覆盖半透明层
 * @class ef.components.CoverLayer
 *
 * **使用范例**：
 *     @example
 *     $(dom).coverlayer(
 *     {
 *          content:"",//模版内容
 *          contentURL:""//从外部加载模版内容
 *
 *     },{});
 * */
;define("framework.coverlayer",["exports", "framework.core","framework.preload"],function(exports,ef,Preload)
{
    function CoverLayer(box,data,config)
    {
        this.box=box;
        this.data=data||{};
        this.init();
        this.setConfig(config);
        this.render();
        return this;
    }
    CoverLayer.isDom=true;
    CoverLayer.prototype.init=function()
    {
        this.config={
            name:2
        };
        this.width=0;
        this.height=0;
        this.container=$('<div class="ef-coverlayer">' +
            '<div class="ef-coverlayer-inn">' +
            '<div class="ef-coverlayer-bg"></div><div class="ef-coverlayer-cont"><div class="ef-coverlayer-load" style="width: 100%;height:100%"></div></div>' +
            '</div></div>');
        this.loadCallback= $.noop;//加载成功回调函数
        this.errorCallback= $.noop;//加载失败回调函数
        this.preload=null;
    };
    CoverLayer.prototype.setConfig=function(config)
    {
        this.config=_.copy(this.config,config);
    };
    CoverLayer.prototype.render=function()
    {
        var older=this.box.find(".ef-coverlayer");
        if(this.config.opaque)
        {
            this.container.find(".ef-coverlayer-bg").addClass("opaque");
        }
        if(this.config.transparent)
        {
            this.container.find(".ef-coverlayer-bg").css({background:"transparent"});
        }
        this.preload=new Preload(this.container.find(".ef-coverlayer-load"),this.data.loadingHeight);
        if(older.length)
        {
            older.remove();
        }
        this.box.css({position:"relative","min-height":"36px"});
        this.box.append(this.container);
        if(this.data.contentURL)
        {
            this._load();
        }else
        {
            if(this.data.content)
            {
                this.container.find(".ef-coverlayer-cont").empty();
            }
            this.data.content?this.container.find(".ef-coverlayer-cont").append(this.data.content):null;

        }
        this.width=this.data.width||this.width;
        this.height=this.data.height||this.height;
        if(this.width)
        {
            this.container.width(this.width);
        }
        if(this.height)
        {
            this.container.height(this.height);
        }
        this.width=this.width||this.container.width();
        this.height=this.height||this.container.height();
        if(!this.data.contentURL)
        {
            this.loadCallback();
        }
        if(this.data.contentClass)
        {
            this.container.find(".ef-coverlayer-cont").addClass(this.data.contentClass);
        }
    };
    CoverLayer.prototype._load=function()
    {
        var _self=this;
        this.container.find(".ef-coverlayer-cont").load(this.data.contentURL,function(dom,state)
        {
            if(state=="success")
            {
                _self.preload.hide();
                _self.loadCallback();
            }else
            {
                $(this).text(_.getLocale("global.load.error.tip"));
                _self.errorCallback();
            }
            $(this).removeAttr("style");
        });
    };
    /**加载完毕事件处理*/
    CoverLayer.prototype.onLoad=function(fn)
    {
        this.loadCallback=fn;
        return this;
    };
    /**加载失败事件处理*/
    CoverLayer.prototype.onError=function(fn)
    {
        this.errorCallback=fn;
        return this;
    };
    CoverLayer.prototype.show=function()
    {
        this.container.show("fast");
        return this;
    };
    CoverLayer.prototype.hide=function()
    {
        this.container.hide("fast");
        return this;
    };
    ef.register(CoverLayer,"coverlayer");
    return CoverLayer;
});
/**
 * Created by wangahui1 on 16/4/20.
 */
define("framework.preload",["exports","framework.core"],function(exports,ef)
{
    /**预加载组件，通常生成实例，用在内部页面某块的loading
     * @class ef.components.Preload
     *
     * **使用范例**：
     *
     *     @example
     *      var preload=$(dom).preload();
     * */
    function Preload(box,data)
    {
        this.box=box;
        this.data=data;
        this.container=$('<div class="loading ef-preload"><span class="ef-preload-cont"><i class="inner-loading2"></i></span></div>');
        this.init();
        this.show();
        return this;
    }
    Preload.isDom=true;
    Preload.prototype.init=function()
    {
        this.box.css({position:"relative"});
        var hasPreload=this.box.find(".ef-preload");
        if(hasPreload.length)
        {
            hasPreload.remove();
        }
        this.box.append(this.container);
    };
    Preload.prototype.show=function()
    {
        this.container.css({display:"table"});
        var h=this.data||this.box.height();
        h=h>500?500:h;
        this.container.height(h);
    };
    Preload.prototype.hide=function()
    {
        this.container.hide();
    };
    ef.register(Preload,"preload");
    return Preload;
});
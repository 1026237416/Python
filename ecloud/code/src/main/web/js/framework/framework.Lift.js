/**
 * Created by ahuiwang on 2016/8/26.
 */
define("framework.lift",["framework.core","exports"],function(ef,exports)
{
    function Lift(box)
    {
        this.box=box;
        this.container=$('<div>' +
            '<a class="lift-btn-up"><i class="lift-up"></i></a>' +
            '<a class="lift-btn-down"><i class="lift-down"></i></a></div>');
        this.upBtn=this.container.find("a.lift-btn-up");
        this.downBtn=this.container.find("a.lift-btn-down");
        this.render();
    }
    Lift.prototype.render=function()
    {
        this.box.empty();
        this.box.hide();
        this.box.addClass("ef-lift");
        this.box.append(this.container);
        this.upBtn.tooltip(
            {
                content:_.getLocale("lift.up.tip"),
                position:"top"
            });
        this.downBtn.tooltip(
            {
                content:_.getLocale("lift.down.tip")
            });
        this.box.fadeIn("slow");
        this.addListener();
    };
    Lift.prototype.addListener=function()
    {
        this.upBtn.click(function()
        {
            $(document.body).scrollTop(0);
        });
        this.downBtn.click(function()
        {
            $(document.body).scrollTop($(document).height());
        });
    };
    Lift.isDom=true;
    ef.register(Lift,"lift");
    return Lift;
});
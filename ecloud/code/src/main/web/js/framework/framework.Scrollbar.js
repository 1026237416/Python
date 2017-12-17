/**
 * Created by ahuiwang on 2016/11/10.
 */
define("framework.scrollBar",["framework.core","module","exports"],function(ef,module,exports)
{
   function ScrollBar(box)
   {
       this.box=box;
        this.container=$('<div class="ef-scrollbar">' +
                '<div class="ef-scrollbar-content">' +
            '<div class="ef-scrollbar-cont"></div>' +
            '</div>' +
            '<div class="ef-scrollbar-track">' +
            '<div class="ef-scrollbar-bar"></div>' +
            '</div>'+
            '</div>');
       this.container.find(".ef-scrollbar-content").height(this.box.css("height"));
       this.container.width(Number(this.box.css("width").replace("px",""))+10);
       this.box.parent().append(this.container);
       this.box.css({"height":"auto"});
       this.container.find(".ef-scrollbar-cont").append(box);
       this.thumb=this.container.find(".ef-scrollbar-bar");
       this.box.css({"position":"absolute"});
       this.isDrag=false;
       this.ratio=0;
       this.cal();
       this.addListener();
   }
    ScrollBar.prototype.cal=function()
    {
        var A=this.box.height();
        var B=this.container.find(".ef-scrollbar-track").height();
        var distance=A-B;
        if(distance<=0)return;
        var barHeight=Math.pow(B,2)/(distance+B);
        this.ratio=((distance)/(B-barHeight));
        this.thumb.height(barHeight);
    };
    ScrollBar.prototype.addListener=function()
    {
        var that=this;
        this.thumb.draggable({axis:"v",onDrag:function(e)
        {
            var d = e.data;
            if(d.top<0)
            {
                d.top=0;
            }
            if (d.top + $(d.target).outerHeight() >= $(d.parent).height()){
                d.top = $(d.parent).height() - $(d.target).outerHeight();
            }
            that.move(d.top);
        }});
    };
    ScrollBar.prototype.move=function(delta)
    {
        var v=-delta*this.ratio;
        this.box.css({top:v});
    };
    ScrollBar.isDom=true;
    ef.register(ScrollBar,"scrollBar");
    return ScrollBar;
});
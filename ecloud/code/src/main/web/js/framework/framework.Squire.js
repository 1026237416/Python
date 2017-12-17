/**
 * Created by hxf on 2016/4/18.
 */
define("framework.squire",["framework.core","exports"],function(ef,exports)
{
    function Squire(box,data){
        this.box = box;
        this.data = data;
        this.clickCallback = $.noop;
        this.data = this.data ? this.data : [];
        this.state = true;
        this.template = $('<div class="quotaSquare"><i class="Squire-pic"></i><span class="quotaText"></span><i class="squireSel"></i></div>');
        this.draw();
        return this;
    }
    Squire.isDom=true;
    Squire.prototype.draw = function () {
        var _self = this;
        if(this.data.allBackClass){this.box.find(".quotaSquare").addClass(this.data.allBackClass);}
        $(this.data.data).each(function(i,il){
            var item = _self.template.clone(true);
            if(_self.data.disabled)
            {
                item.addClass("disabled");
            }
            if(!il.text){item.find('.quotaText').text(il);}
            else{item.find('.quotaText').text(il.text);}
            if(il.selected){
                item.addClass('quotaSquare-select').siblings().removeClass('quotaSquare-select');
            }
            _self.box.append(item);
            if(!il.iconClass){
                item.find('.Squire-pic').hide();
                $(_self.box).find(".quotaSquare span").eq(i).text(il);
                return;
            }
            item.data("squire_data",il);
            item.find('.Squire-pic').addClass(il.iconClass);
        });
        this.addListener();
    };
    Squire.prototype.addListener = function () {
        var _self = this;
        this.box.find(".quotaSquare").click(function () {
            if(_self.data.disabled)
            {
                return false;
            }
            if(_self.state==false){return;}
            $(this).addClass('quotaSquare-select').siblings().removeClass('quotaSquare-select');
            _self.clickCallback($(this).find('span').text(),$(this).data("squire_data"));
        });
    };
    Squire.prototype.setStatus = function (state) {
        var _self = this;
        this.state = state;
        if(this.state==false){
            this.template.find(".iconSquire").addClass("squireSel_disabled").removeClass("squireSel");
            this.box.find(".quotaSquare").each(function (i,il) {
                if($(il).hasClass('quotaSquare-select')){
                    $(this).addClass('quotaSquare-select-disabled');
                }
            });
        }
        if(this.state==true){
            this.template.find(".iconSquire").removeClass("squireSel_disabled").addClass("squireSel");
            this.box.find(".quotaSquare").each(function (i,il) {
                if($(il).hasClass('quotaSquare-select')){
                    $(this).removeClass('quotaSquare-select-disabled');
                }
            });
        }
    };
    Squire.prototype.click = function (callback) {
        this.clickCallback = callback;
    };
    Squire.prototype.select = function (callback) {
        var tt;
        this.box.find(".quotaSquare").each(function (i,il) {
            if($(il).hasClass('quotaSquare-select')){
                if(callback){callback($(il).text());}
                tt = $(il).text();
            }
        });
        return (tt);
    };
    Squire.prototype.setSelect = function (data) {
        this.box.find(".quotaSquare").each(function (i,il) {
            if($(il).text()==data||$(il).text==data.toString()){
                $(this).addClass('quotaSquare-select');
                $(this).siblings().removeClass('quotaSquare-select');
            }
        });
    };
    ef.register(Squire,"squire");
    return this;
});
/**
 * Created by wangahui1 on 16/6/17.
 */
define("framework.picker",["exports","framework.core"],function(exports,ef)
{
   function Picker(box,data)
   {
        this.box=box;
        this.data=data;
        this.container=$('<div class="ef-picker"></div>');
        this.template=$('<div class="ef-picker-square"><i></i></div>');
        this.popup=$('<div class="ef-picker-popup"></div>');
        this.origin=null;
        this.hasSelected=false;
        this.disable=false;
        this.squares=[];
        this.setConfig(data);
        this.draw();
        this.addListener();
   }

    Picker.prototype.setConfig = function (option) {
        if (!option) {
            return;
        }
        for (var i in option) {
            this[i] = option[i];
        }
    };
    Picker.prototype.draw=function()
    {
        var _self=this;
        this.box.css({display:"inline-block"});
        this.box.empty();
        this.box.append(this.container);
        this.origin=this.template.clone();
        this.container.append(this.origin);
        this.origin.addClass("ef-picker-origin");
        if(this.data.dataProvider&&this.dataProvider.length)
        {
            this.container.append(this.popup);
            $(this.data.dataProvider).each(function(i,item)
            {
                var square=new _self.Square();
                square.data=item;
                square.dom=_self.template.clone();
                _self.popup.append(square.dom);
                _self.squares.push(square);
                square.dom.find("i").addClass(item.icon);
            });
            if(!this.hasSelected)
            {
                this.select(this.squares[0].dom);
            }
        }
    };
    Picker.prototype.addListener=function()
    {
        var _self=this;
        this.origin.click(function()
        {
            if(_self.disable)
            {
                return false;
            }
            _self.popup.show();
        });
        this.popup.find(".ef-picker-square").click(function()
        {
            _self.popup.hide();
            _self.select($(this));
        });
        this.popup.find(".ef-picker-square").hover(function()
        {
            $(this).addClass("hover");
        },function()
        {
            $(this).removeClass("hover");
        });
        $(document).click(function(event)
        {
           var target=$(event.target);
            if(target.is(_self.popup))
            {
                return;
            }
            if(target.closest(_self.origin.find("i")).length == 0){
                _self.popup.hide();
            }
        });
    };
    Picker.prototype.select=function(dom)
    {
        var _self=this;
        var cls=dom.find("i").attr("class");
        _self.origin.find("i").removeClass();
        $(this.squares).each(function(i,item)
        {
            if(item.dom.find("i").hasClass(cls))
            {
                item.data.selected=true;
                _self.origin.find("i").addClass(cls);
                dom.addClass("selected");
                _self.hasSelected=true;
                if(_self.data.onChange)
                {
                    _self.data.onChange(item);
                }
            }else
            {
                item.data.selected=false;
                item.dom.removeClass("selected");
            }
        });
    };
    Picker.prototype.setSelectByClass=function(cls)
    {
        var filter= _.find(this.squares,function(item)
        {
            return item.dom.find("i").hasClass(cls);
        });
        if(filter)
        {
            this.select(filter.dom);
        }
    };
    Picker.prototype.getSelected=function()
    {
        return _.find(this.squares,function(item)
        {
            return item.data.selected;
        });
    };
    Picker.prototype.Square=function()
    {
        this.data=null;
        this.dom=null;
    };
    Picker.prototype.setDisable=function(bool)
    {
        this.disable=bool;
        if(bool)
        {
            this.origin.addClass("disabled");
        }else
        {
            this.origin.removeClass("disabled");
        }
    };
    Picker.isDom=true;
    ef.register(Picker,"picker");
    return this;
});
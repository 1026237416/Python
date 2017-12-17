define("framework.appBlock", ["exports", "framework.core"], function (exports, ef) {
    function AppBlock(box,data) {
        this.box = box;
        this.data = data;
        this.clickCallback = $.noop;
        this.data = this.data ? this.data : [];
        this.left = $('<div class="appBlock-left"><</div>');
        this.right = $('<div class="appBlock-right">></div>');
        this.templateAll = $('<ul class="appBlock-all"></ul>');
        this.templateRender = $('<li class="appBlock-all-render"></li>');
        this.template = $('<div class="appBlock-block"></div>');
        this.iDom = $('<i style="display: inline-block"></i>');
        this.blockData = null;
        this.liLength = 0;
        this.moveLen = 0;
        this.labelField="label";
        this.valueField="value";
        this.idField="id";
        this.arr = [];
        this.draw();
        this.args = arguments;
        return this;
    }
    AppBlock.isDom=true;
    AppBlock.prototype.resizeChange = function () {
        var _self = this;
        this.templateAll.empty();
        var reg = /[1-9][0-9]*/g;
        var wid = (this.box.css('width')).match(reg);
        this.liLength = (Math.floor((wid-40)/145))*2;
        this.moveLen = Math.ceil(this.data.data.length/this.liLength);
        for(var i = 0; i< this.liLength;i++){
            var li = _self.templateRender.clone(true);
            var str = ef.util.pluck(_self.arr,"dom");
            if(i*this.liLength>str.length){break;}
            li.append(str.slice(i*this.liLength,i*this.liLength+this.liLength));
            _self.templateAll.append(li);
        }
        this.hoverOn();
        this.move(this.moveLen);
        this.addListener();
    };
    AppBlock.prototype.draw = function () {
        var _self = this;
        _self.arr = [];
        _self.templateAll.empty();
        this.labelField=this.data.labelField||this.labelField;
        this.valueField=this.data.valueField||this.valueField;
        this.idField=this.data.idField||this.idField;
        this.box.append(this.left).append(this.right).append(this.templateAll);
        $(this.data.data).each(function (i,il) {
            var item = {
                dom:_self.template.clone(true),
                index:i,
                text:il[_self.labelField],
                data:il
            };
            item.dom.text(il[_self.labelField]);
            item.dom.attr("id",il[_self.idField]);
            _self.arr.push(item);
            item.dom.data("bdata",il);
        });
        _self.resizeChange();
        $(window).resize(function(){
            _self.resizeChange();
            _self.templateAll.find('li').eq(0).show();
        });
        _self.templateAll.find('li').eq(0).show();
        if(this.data.data.length<7)
        {
            $(".appBlock-left",this.box).hide();
            $(".appBlock-right",this.box).hide();
        }else
        {
            $(".appBlock-left",this.box).show();
            $(".appBlock-right",this.box).show();
        }
    };
    AppBlock.prototype.move = function (len) {
        var _self = this;
        var count = 0;
          $(".appBlock-left",this.box).click(function () {
              if(count==0){return;}
              count--;
              _self.templateAll.find('li').eq(count).show().siblings().hide();
          });
        $(".appBlock-right",this.box).click(function () {
            if(count==len-1){return;}
            count++;
            _self.templateAll.find('li').eq(count).show().siblings().hide();
        });
    };
    AppBlock.prototype.hoverOn = function () {
        var _self = this;
      $(".appBlock-block",this.box).hover(function () {
              _self.blockData = $(this).text();
              $(this).empty();
              for (var i = 0; i < _self.data.icon.length; i++) {
                  var dom = _self.iDom.clone(true);
                  dom.addClass(_self.data.icon[i].iconClass);
                  $(this).append(dom);
                  dom.tooltip({content:_self.data.icon[i].tip});
              }
          },function(){
              $(this).empty().text(_self.blockData);
          }
      );
    };
    AppBlock.prototype.addListener = function () {
        var _self = this;
         $(".appBlock-block",this.box).click(function (e) {
             var s = this;
             var index = $(e.target).index();
             var inNum = $(".appBlock-all div",_self.box).index($(this));
             var item = ef.util.findWhere(_self.arr, {index:inNum});
             _self.clickCallback(item,_self.data.icon[index],index);
         });
    };
    AppBlock.prototype.iconClick = function (callback) {
        this.clickCallback = callback;
    };
    AppBlock.prototype.removeBlock = function (index) {
        $(".appBlock-block",this.box).eq(index).remove();
    };
    AppBlock.prototype.loadData = function (data) {
        this.data.data = data;
        this.draw();
    };
    AppBlock.prototype.destroy = function () {};
    ef.register(AppBlock,"appBlock");
    return AppBlock;
});
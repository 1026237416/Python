/**
 * Created by Administrator on 2016/5/6.
 */
define("framework.param",["framework.core","exports"],function(ef,exports)
{
    function Param(box,data){
        this.box = box;
        this.data = data;
        this.clickCallback = $.noop;
        this.data = this.data ? this.data : [];
        this.current=null;
        this.temRender = $('<div class="ef-param"></div>');
        this.template = $('<div class="paramSquare"><span class="paramText"></span><span class="paramValue"></span></div>');
        this.draw();
        return this;
    }
    Param.isDom=true;
    Param.prototype.draw = function () {
        var _self = this;
        _self.box.empty();
        _self.temRender.empty();
        if(!this.data.labelField){this.data.labelField = "label";}
        if(!this.data.valueField){this.data.valueField = "value";}
        $(this.data.dataProvider).each(function(i,il){
            var item = _self.template.clone(true);
            item.find('.paramText').text(il[_self.data.labelField]);
            item.find('.paramValue').text(il[_self.data.valueField]);
            _self.temRender.append(item);
        });
        _self.box.append(_self.temRender);
        this.box.find(".paramSquare").addClass(this.data.allBackClass);
        this.addListener();
    };
    Param.prototype.addListener=function(){
        var _self = this;
        _self.temRender.find(".paramSquare").click(function(){
            _self.current=$(this);
            $(this).addClass('paramSquare-select').siblings().removeClass('paramSquare-select');
            var tt = $(this).find('.paramText').text();
            //var value = $(this).find('.paramValue').text();
            var returnData;
            $(_self.data.dataProvider).each(function (i,il) {
                if(il[_self.data.labelField]==tt){
                    returnData = il;
                }
            });
            _self.clickCallback(returnData);
        });
    };
    Param.prototype.click = function (callback) {
        this.clickCallback = callback;
    };
   /* Param.prototype.switch=function(callback){
        if(!callback){return;}
        else{
            $(".paramSquare").addClass("paramCom");
            if($(".paramSquare").hasClass("paramCom")){
                $(".paramSquare").removeClass("paramCom").addClass("paramConLine");
            }else{
                $(".paramSquare").addClass("paramCom");
            }
            callback($(".paramSquare").attr('class'));
        }
    };*/
    Param.prototype.addParam=function(data){
        this.data.dataProvider = this.data.dataProvider.concat(data);
        this.draw();
        //var _self=this;
        //var itm=_self.templates.clone(true);
        //itm.find(".paramText").text(data);
        //_self.box.find(".paramSquare:first").before(itm);
        //$(itm).click(function(){
        //    $(this).addClass("paramSquare-select").siblings().removeClass("paramSquare-select");
        //    _self.clickCallback($(this).find(".paramText").text());
        //});
    };
    Param.prototype.deleteParam=function(){
        var _self=this;
        var text;
        var itm=_self.template.clone(true);
        $(itm).each(function(i,il){
            text = _self.temRender.find(".paramSquare-select .paramText").text();
            _self.temRender.find(".paramSquare-select").remove();
        });
        console.log(text);
        $(this.data.dataProvider).each(function (i,il) {
            if(il[_self.data.labelField]==text){
                _self.data.dataProvider.splice(i,1);
            }
        });
        this.current=null;
    };
    Param.prototype.select= function () {
        var _self=this;
        var text,data;
        var itm=_self.template.clone(true);
        $(itm).each(function(i,il){
            text = _self.temRender.find(".paramSquare-select .paramText").text();
            _self.temRender.find(".paramSquare-select").remove();
        });
        $(this.data.dataProvider).each(function (i,il) {
            if(il[_self.data.labelField]==text){
               data = il;
            }
        });
        return data;
    };
    Param.prototype.getAllData = function () {
        console.log(this.data.dataProvider);
       return this.data.dataProvider;
    };
    Param.prototype.clear = function () {
        this.data.dataProvider = [];
        this.draw();
    };
    Param.prototype.destroy = function () {
    };
    ef.register(Param,"param");
    return this;
});

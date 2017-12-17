/**
 * Created by hxf on 2016/4/18.
 */
define("framework.checkinfo",["framework.core","exports"],function(ef,exports)
{
    function CheckInfo(box,data){
        this.box = box;
        this.data = data;
        this.clickCallback = $.noop;
        this.data = this.data ? this.data : [];
        this.template = $('<div class="checkRender"><input class="checkInfoBox" name="check"><div class="checkInfo"></div><div class="checkValue"></div></div>');
        this.clickCallback = $.noop;
        this.returnData = [];
        this.state = true;
        this.checkType = this.data.checkType ? this.data.checkType : null;
        this.draw();
        return this;
    }
    CheckInfo.isDom=true;
    CheckInfo.prototype.draw = function () {
        var _self = this;
        _self.box.empty();
        if(this.checkType=="checkbox" || this.checkType==null){
            this.template.find("input").attr({type:"checkbox"});
            this.template.find('.checkInfoBox').addClass("checkBoxCheck");
        }
        else if(this.checkType=="radio"){
            this.template.find("input").attr({type:"radio"});
            this.template.find('.checkInfoBox').addClass('checkBoxRadio');
        }
        if(!this.data.labelField){this.data.labelField = "label";}
        if(!this.data.valueField){this.data.valueField = "value";}
        $(this.data.dataProvider).each(function (i,il) {
            var item = _self.template.clone(true);
            if(_self.data.disabled)
            {
                item.addClass("disabled");
                item.find('.checkInfoBox').attr("disabled","disabled");
            }
            item.find('.checkInfo').text(il[_self.data.labelField]);
            item.find('.checkValue').text(il[_self.data.valueField]);
            if(il.selected){
                item.find('.checkInfoBox').attr("checked",true);
                item.addClass('checkInfoSelected');
            }
            if(il.isAlwaysSelected)
            {
                item.find('.checkInfoBox').attr("checked",true);
                item.find(".checkInfoBox").attr("readonly","readonly");
                item.addClass("disabled");
                item.attr("isalways",1);
                item.addClass("checkInfoSelected");
            }
            _self.box.append(item);
        });
        if(this.data.className){this.box.find('.checkRender').addClass(this.data.className);}
        this.addListener();
        //this.clickEvent();
    };
    CheckInfo.prototype.select = function (callback) {
        var _self = this;
        this.returnData.length = 0;
        var dom = $(this.box).find(".checkInfoBox");
        dom.each(function () {
            var item = {label:"",value:""};
            if($(this).is(":checked")){
                var thisLabel = $(this).next().text();
                var thisValue = $(this).next().next().text();
                item.label = thisLabel;
                item.value = thisValue;
                _self.returnData.push(item);
            }
        });
        if(callback){callback(this.returnData);}
    };
    CheckInfo.prototype.addListener = function () {
        var _self = this;
        var dom = $(this.box).find('.checkRender');

        dom.click(function () {
            if($(this).attr("isalways")){
                return false;
            }
            var input=$(this).find(".checkInfoBox");
            var info=$(this).find(".checkInfo");

            if(_self.data.disabled){return false;}
            if(_self.state==false){return;}
            var item = {label:"",value:"",status:""};
            item.label = $(this).find(".checkInfo").text();
            item.value = $(this).find(".checkValue").text();
            if(input.prop("checked")){
                $(this).removeClass('checkInfoSelected');
                input.prop({checked:false});
                item.status = false;
            }
            else{
                $(this).addClass('checkInfoSelected');
                input.prop({checked:true});
                item.status = true;
            }
            _self.clickCallback(item);
        });
    };
    CheckInfo.prototype.click = function (callback) {
        this.clickCallback = callback;
        return this;
    };
    CheckInfo.prototype.setStatus = function (state) {
        this.state = state;
    };
    CheckInfo.prototype.setSelect = function (selectData) {
        var _self = this;
        var dom = $(this.box).find(".checkRender");
        dom.each(function (i,il) {
            if($(this).find(".checkValue").text()==selectData){
                $(this).find(".checkInfoBox").prop({checked:true});
                $(this).addClass("checkInfoSelected");
            }
        });
    };
    CheckInfo.prototype.add = function (addData) {
        this.data.dataProvider = this.data.dataProvider.concat(addData);
        this.draw();
    };
    CheckInfo.prototype.clear = function () {
        this.data.dataProvider = [];
        this.draw();
    };
    CheckInfo.prototype.isChecked=function()
    {
        var bool=false;
        var dom = $(this.box).find('.checkRender');
        $(dom).each(function(i,item)
        {
            var $item=$(item);
            if($item.hasClass("checkInfoSelected"))
            {
                bool=true;
            }
        });
            return bool;
    };
    ef.register(CheckInfo,"checkinfo");
    return this;
});
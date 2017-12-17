/**
 * Created by admin on 2016/6/29.
 */
define('framework.dataCenter',[
    'exports',
    'framework.core'
],function(exports, ef){
    var _config = {
        textField:'',
        valueField:'',
        originalDatas:null,
        currentData:null,
        onSelect: $.noop
    };
    var DataCenter = function(box,data,config){
        if(!(config.textField && config.valueField)){
            throw new Error('��������ȷ������!');
        }
        this.config = $.extend({},_config,config);
        this.config.originalDatas = _.clone(data);
        this.dataItem = $('<div class="data-center-item"></div>');
        this.dataEsay = $('<div class="data-center-es">'+
                            '<input type="text" class="data-center-interface" style="width: 193px; height: 46px"/>'+
                        '</div>');
        this.dataInner = $('<div class="data-center-inner" style="display: none;"></div>');
        this.box = box;
        this.box.empty();
        this.box.append(this.dataEsay);
        this.box.append(this.dataInner);
        this.menus = [];
        this.renderPage();
        this.addListener();
    };
    DataCenter.prototype.Menu = function (owner) {
        this.data = null;
        this.dom = null;
        this.disable = false;
        this.owner = owner;
        this.tip = null;
        this.toggle=null;
    };
    DataCenter.prototype.renderPage = function(){
        var that = this;
        var dataItemClones = [];
        this.box.find('.data-center-interface').textbox({
            iconCls:'combo-arrow',
            iconAlign:'right',
            editable:false,
            disabled:true
        });
        $(this.config.originalDatas).each(function(index, item){
            var _menu = new that.Menu(that);
            var dataItemClone = that.dataItem.clone(false);
            dataItemClone.attr({id: "data-center-"+(index+1)});
            dataItemClone.text(item[that.config.textField]);
            _menu.data = item;
            _menu.dom = dataItemClone;
            that.menus.push(_menu);
            if(item.selected){
                dataItemClone.addClass('data-center-selected');
                that.setSelected(item);
            }
            dataItemClones.push(dataItemClone);
        });
        this.dataInner.append(dataItemClones);
    };
    DataCenter.prototype.setSelected = function(data){
        var that = this;
        this.box.find('.data-center-interface').textbox('setText',data[this.config.textField]);
        //this.box.find('.data-center-interface').textbox('setValue',data[this.config.valueField]);
        //test
        if(this.config.currentData){
            $(this.config.originalDatas).each(function(index, item){
                item.selected = false;
            });
        }
        var index = _.findIndex(this.config.originalDatas,function(org){
            return org[that.config.textField] == data[that.config.textField];
        });
        if(index){
            data.selected = true;
            that.config.originalDatas[index].selected = true;
            that.config.currentData = data;
        }
    };
    DataCenter.prototype.addListener = function(){
        var that = this;
        this.box.hover(
            function(){
                var $this = $(this);
                $this.find('.data-center-inner').show();
            },
            function(){
                var $this = $(this);
                $this.find('.data-center-inner').hide();
            });
        this.box.find('.data-center-item').hover(
            function(){
                var $this = $(this);
                $this.addClass('data-center-hover');
            },function(){
                var $this = $(this);
                $this.removeClass('data-center-hover');
            });
        this.box.find('.data-center-item').on('click.data.center',function(){
            var $this = $(this);
            $this.addClass('data-center-selected').siblings().removeClass('data-center-selected');
            var menu = _.find(that.menus,function(item){
                return $(item.dom).attr('id') == $this.attr('id');
            });
            if(menu){
                that.setSelected(menu.data);
                that.box.find('.data-center-inner').hide();
                that.config.onSelect(menu);
            }
        });
    };
    DataCenter.prototype.getValue = function(){
        var text = this.box.find('.data-center-interface').textbox('getText');
        if(text){
            var selected = _.find(this.config.originalDatas,function(index,item){
                return text == item[this.config.textField];
            });
            return selected ? selected[this.config.valueField] : '';
        }
        return '';
    };
    DataCenter.prototype.destroy = function () {

    };
    DataCenter.isDom=true;
    ef.register(DataCenter,"dataCenter");
    return DataCenter;
});
/**
 * Created by thomas on 2016/5/6.
 */
define('framework.dataScroll',[
    'exports',
    'framework.core'
],function(exports, ef){
    var _config = {
        total:0,
        pageNum:1,
        pageSize:6,
        originalRows:[],
        rows:[]
    };
    function DataScroll(box,data,config){
        if(!$.isArray(data)){
            throw new Error('data must be array!');
        }
        /*config.pageNum = parseInt(config.pageNum);
        config.pageSize = parseInt(config.pageSize);*/
        this.config = $.extend({},_config,config);
        this.config.originalRows = _.clone(data);
        this.config.total = Math.ceil(data.length/this.config.pageSize) || 0;
        this.box = box;
        this.appWrapper = $('<div class="clearfix app-wrapper"></div>');
        this.ctr =  $('<div class="ctr">'+
                        '<a class="ctr-item left-ctr" href="#" title data-type="0"></a>'+
                        '<a class="ctr-item right-ctr" href="#" title data-type="1"></a>'+
                    '</div>');
        this.appBlock = $('<div class="appblock"></div>');
        this.icons = $('<div class="app-utils" style="display: none;"></div>');
        this.box.empty();
        this.box.append(this.appWrapper);
        this.box.append(this.ctr);
        this.addCtrListener();
        this.template();
    }
    DataScroll.prototype.template = function(){
        this.loadData();
        this.renderPage();
        this.addListener();
        this.checkState(this.config.pageNum);
    };
    DataScroll.isDom=true;
    DataScroll.prototype.Menu = function (owner) {
        this.data = null;
        this.dom = null;
        this.disable = false;
        this.owner = owner;
        this.tip = null;
        this.toggle=null;
    };
    DataScroll.prototype.loadData = function(){
        var config = this.config,
            pageNum = config.pageNum,
            pageSize = config.pageSize,
            originalRows = config.originalRows;
        var start = (pageNum-1)*pageSize;
        var end = start+pageSize;
        this.config.rows = originalRows.slice(start, end);
    };
    DataScroll.prototype.renderPage = function(){
        console.log('render page-----');
        var that = this,
            appblock = null,
            icon = null;
        this.box.find('.app-wrapper').empty();
        $(this.config.rows).each(function(index, block){
            var _menu = new that.Menu(that);
            appblock = that.appBlock.clone(false);
            if(block.nodeClass){
                appblock.addClass(block.nodeClass);
            }
            if(block.text){
                appblock.html(block.text);
            }
            that.appWrapper.append(appblock);
            if(block.icons){
                icon = that.icons.clone(false);
                appblock.append(icon);
                icon.iconmenu(block.icons);
            }
        });
    };
    DataScroll.prototype.addListener = function(){
        var that = this;
        this.box.find('.appblock').hover(function(){
            var $this = $(this);
            $this.find('.app-utils').show();
        },function(){
            var $this = $(this);
            $this.find('.app-utils').hide();
        });

    };
    DataScroll.prototype.addCtrListener = function(){
        var that =this;
        this.box.find('.ctr-item').on('click.appDataScroll',function(){
            //check state
            var $this = $(this);
            if($this.attr('data-type') == 0){
                --(that.config.pageNum);
            }else if($this.attr('data-type') == 1){
                ++(that.config.pageNum);
            }else{
                return;
            }
            that.template();
        });
    };
    DataScroll.prototype.checkState = function(pageNum){
        var config = this.config,
            total = config.total,
            pageSize = config.pageSize;
        if(pageNum <= 1){
            this.box.find('[data-type="0"]').hide();
        }else{
            this.box.find('[data-type="0"]').show();
        }
        if(pageNum >= total){
            this.box.find('[data-type="1"]').hide();
        }else{
            this.box.find('[data-type="1"]').show();
        }
    };
    DataScroll.prototype.setSize = function(){

    };

    ef.register(DataScroll,"dataScroll");
    return DataScroll;
});
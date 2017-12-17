/**
 * Created by ahuiwang on 2016/10/13.
 */
define("framework.resultList",["framework.core","module","exports"],function(ef,module,exports)
{
    /**
     * data:
     * {
     *      title:"预览",
     *
     * }
     *
     * */
    function ResultList(box,data)
    {
        this.box=box;
        this.labelField="label";
        this.valueField="value";
        this.groupField="group";
        this.groups=[];
        this.data=data||{};
        this.container=$('<div class="ef-result-list"><h3 class="ef-result-title"></h3><div class="ef-result-cont"></div></div></div>');
        this.groupTemplate=$('<div class="ef-result-group"><h4 class="ef-result-group-title"></h4><ul class="ef-result-group-items"></ul></div>');
        this.init();
        return this;
    }
    ResultList.prototype.init=function()
    {
        this.labelField=this.data.labelField||this.labelField;
        this.valueField=this.data.valueField||this.valueField;
        this.groupField=this.data.groupField||this.groupField;
        this.box.empty();
        this.box.append(this.container);
        this.container.find(".ef-result-title").text(this.data.title);
        if(this.parse())
        {
            this.render();
        }
        this.box.attr("way-data",this.data.id);
        this.box.attr("way-writeonly",true);
        this.box.attr("way-html",true);
        var tmp=way.get(this.data.id);
        way.options.timeoutInput=0;
        if(!tmp)
        {
            way.set(this.data.id,{skills:[]});
        }
    };
    ResultList.prototype.parse=function()
    {
        var that=this;
        if(!_.isArray(this.data.data))
        {
            return false;
        }
        this.groups=_.uniq(_.pluck(this.data.data,this.groupField));
        this._parseData=_.map(this.groups,function(item){return {group:item,items:[]}});
        _.each(this.data.data,function(item)
        {
            var group=item.group;
            _.find(that._parseData,function(ea)
            {
                if(ea.group==group)
                {
                    ea.items.push(item);
                }
            });
        });
        return true;
    };
    ResultList.prototype.render=function()
    {
        var that=this;
        var content=that.container.find(".ef-result-cont");
        _.each(this._parseData,function(item,index)
        {
            var groupTempalte=that.groupTemplate.clone();
            content.append(groupTempalte);
            var title=groupTempalte.find(".ef-result-group-title");
            title.text(item.group);//bind
            title.attr({
                'id':'ef-result-list-anchor-'+index,
                'name':'ef-result-list-anchor-'+index
            });
            that._renderItems(item.items,groupTempalte.find(".ef-result-group-items"));
        });
        way.registerBindings();
    };
    ResultList.prototype.goto = function(pos){
        var id = '#ef-result-list-anchor-'+pos;
        var $target = this.container.find(id);
        if($target.is('h4')){
            //location.href=location.href.split('#')[0] + id;
            var $resultBody = this.container.find('.ef-result-cont');
            var top = $target.position().top;
            if(pos == 0){
                top = 0;
            }
            $resultBody.scrollTop(top);
        }
    };
    ResultList.prototype._renderItems=function(items,groupItems)
    {
        var that=this;
        _.each(items,function(item)
        {
            var li;
            if(!_.isArray(item.columns))
            {
                if(_.isArray(item.list)){
                    li=$('<li class="ef-result-list-grid-line"><span class="ef-result-list-list-title"></span><div class="ef-result-list-list-value"></div></li>');
                    li.find('.ef-result-list-list-title')
                        .text(item[that.labelField]);
                    that._renderList(item,li);
                }else{
                    li=$('<li><span class="ef-result-item-label"></span><span class="ef-result-item-value" way-html="true"></span></li>');
                    li.find(".ef-result-item-label").text(item[that.labelField]);
                    li.find(".ef-result-item-value").attr("way-data",that.data.id+"."+item[that.valueField]);
                }
            }else{
                li=$('<li class="ef-result-list-grid-line"></li>');
                that._renderGrid(item,li);
            }
            groupItems.append(li);
        })
    };
    ResultList.prototype._renderList = function(item,listItem){
        var tmp = $('<div class="repeat-row"></div>');
        tmp.attr("way-repeat",this.data.id+"."+item[this.valueField]);
        _.each(item.list,function(value){
            var td=$('<span class="row" way-html="true" way-transform="listTrans"></span>');
            td.attr("way-data",value.filed);
            tmp.append(td);
        });
        listItem.find('.ef-result-list-list-value').append(tmp);
    };
    ResultList.prototype._renderGrid=function(item,gridItem)
    {
        var tmp=$('<div class="ef-result-list-grid"><div class="header"></div><div class="body"><div class="repeat-row"></div></div></div>');
        var header=tmp.find(".header");
        var body=tmp.find(".body");
        body.find(".repeat-row").attr("way-repeat",this.data.id+"."+item[this.valueField]);
        _.each(item.columns,function(column)
        {
            var col=$('<span class="col"></span>');
            col.text(column.title);
            header.append(col);
            var td=$('<span class="row" way-html="true"></span>');
            td.attr("way-data",column.filed);
            body.find(".repeat-row").append(td);
        });



        gridItem.append(tmp);
    };
    ResultList.isDom=true;
    ef.register(ResultList,"resultList");
    return ResultList;
});
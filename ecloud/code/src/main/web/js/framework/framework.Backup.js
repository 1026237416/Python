/**
 * Created by wangahui1 on 16/4/20.
 */
define("framework.backup",["exports","framework.core"],function(exports,ef)
{
    /**备份组件
     * @class ef.components.Backup
     *
     * **使用范例**：
     *
     *     @example
     *     $(dom).backup([{}],{});
     * */
    function Backup(box,data, config)
    {
        this.box=box;
        this.data=data;
        if(!data)return null;
        this.container=$('<div class="ef-backup"></div>');
        this.tempalte=$('<canvas></canvas>');
        this.square=$('<div class="ef-backup-square"></div>');
        this.legendTemplate=$('<span class="ef-backup-legend-item"><i></i><label></label></span>');
        this.render(config);
        var _self=this;
        this.lastRow=null;//lastRow
        this.type="none";
        this.oldRows=null;
        $(ef.root).resize(function()
        {
            _self.render(_self.config);
        });
        return this;
    }
    Backup.isDom=true;
    /**
     * 渲染
     * */
    Backup.prototype.render=function(config)
    {
        this.init();
        _.copyProperty(this.config,config);
        this.draw();
        this.addListener();
    };
    /**
     * 点击按钮回调
     * */
    Backup.prototype.click=function(fn)
    {
        this.config.click=fn||this.config.click|| $.noop;
        return this;
    };
    Backup.prototype.init=function()
    {
        this.config=this.config||
            {
                rowHeight:130,//行高
                labelHeight:30,
                normalColor:"#bcbcbc",//正常颜色,
                normalHighlightColor:"#626262",
                selectedColor:"#0080c9",//选中颜色
                selectedHighlightColor:"#005a96",
                paddingLeft:10,//左边距
                paddingRight:10,//右边距
                paddingTop:10,//上边距
                paddingBottom:10,//下边距
                dotRadius:12,//圆半径
                dotLev1Radius:3,
                dotLev2Radius:5,
                dotOuterMargin:5,
                dotOuterRadius:16,
                isEdit:true,
                vmStates:["available","backuping","recovering","error"],
                dotState:["available","error","creating","recovering","deleting"]
            };
        if(this.rows){
            this.oldRows= this.getRows(this.rows.concat([]));
        }
        this.rows=[];
        this.config.click=this.config.click|| $.noop;
        this.config.formatter=this.config.formatter||function(data)
            {
                return data.des;
            };
        this.data.backups=this.data.backups||[];
    };
    Backup.prototype.getRowsHeight=function()
    {
        var h=0;
        h+=this.config.dotRadius*2+this.config.rowHeight*this.data.backups.length;
        return h;
    };
    Backup.prototype.draw=function()
    {
        this.width=this.box.width();
        this.height=this.config.paddingTop+this.config.paddingBottom+this.getRowsHeight()+this.config.labelHeight;
        this.contentWidth=this.width-this.config.paddingLeft-this.config.paddingRight;
        this.contentHeight=this.getRowsHeight();
        this.posX=this.config.paddingLeft;
        this.posY=this.config.paddingTop;
        this.box.empty();
        this.container.empty();
        this.container.height(this.height);
        this.tempalte.attr("width",this.width);
        this.tempalte.attr("height",this.height);
        this.baseLayer=this.tempalte.clone(false);
        this.baseContext=this.baseLayer[0].getContext("2d");
        this.tipLayer=this.tempalte.clone(false);
        this.tipContext=this.tipLayer[0].getContext("2d");
        this.iconLayer=$('<div class="backup-icon-layer"></div>');
        this.descLayer=$('<div class="backup-desc-layer"></div>');
        this.legendLayer=$('<div class="backup-legend-layer"></div>');
        this.hoverLayer=this.tempalte.clone(false);
        this.hoverContext=this.hoverLayer[0].getContext("2d");
        this.baseLayer.css({"z-index":1});
        this.descLayer.css({"z-index":7});
        this.tipLayer.css({"z-index":3});
        this.hoverLayer.css({"z-index":5});
        this.iconLayer.css({"z-index":7});
        this.legendLayer.css({"z-index":6});
        this.box.append(this.container);
        this.container.append(this.baseLayer);
        this.container.append(this.descLayer);
        this.container.append(this.tipLayer);
        this.container.append(this.hoverLayer);
        this.container.append(this.legendLayer);
        this.container.append(this.iconLayer);
        this.createRows();
        this.createLegend();
        //this.container.tooltip({
        //    content:"",
        //    trackMouse:true,
        //    showDelay:0,
        //    hideDelay:0,
        //    position:"right",
        //    showEvent:"backup.tip.show",
        //    hideEvent:"backup.tip.hide"});
    };
    Backup.prototype.createLegend=function()
    {
        var legendParent=$("<div style='float: right; margin-top: 10px;'></div>");
        var _self=this;
        $(this.config.dotState).each(function(i,status)
        {
            var span=_self.legendTemplate.clone();
            span.find("i").addClass("ef-backup-state-"+status||"available");
            span.find("label").text(_.getLocale("backup.dot.state."+status+".text"));
            legendParent.append(span);
        });
        this.legendLayer.append(legendParent);
    };
    Backup.prototype.showTip=function(row)
    {
        //this.container.trigger("backup.tip.show");
        //this.container.tooltip("update",row.data.isFirst? _.getLocale("framework.component.backup.current.tip"):this.config.formatter(row.data));
    };
    Backup.prototype.hideTip=function()
    {
        //this.container.trigger("backup.tip.hide");
    };
    Backup.prototype.hover=function(event)
    {
        var _self=this;
        var _x = event.offsetX;
        var _y = event.offsetY;
        var _offsetX = _self.box.offset().left;
        var _offsetY = _self.box.offset().top;
        var _row=_.find(_self.rows,function(row)
        {
            return _x>=row.x1&&_x<row.x2&&_y>=row.y1&&_y<row.y3;
        });
        if(_row)
        {
            _self.showTip(_row);
            if(_row.data.isFirst)
            {
                _self.container.find(".backup-btn").hide();
            }else
            {
                _self.createOverRow(_row);
                if(_self.lastRow&&(_self.lastRow!=_row))
                {
                    if(_self.lastRow.btns)_self.lastRow.btns.hide();
                }
                _row.btns?_row.btns.show():null;
            }
            _self.lastRow=_row;
        }else
        {
            _self.hideTip();
            if(_self.lastRow)
            {
                if(_self.lastRow.btns)_self.lastRow.btns.hide();
                _self.lastRow=null;
            }

        }
    };
    Backup.prototype.addListener=function()
    {
        var _self=this;
        this.hoverLayer.off();
        this.hoverLayer.hover(function(event)
        {
            _self.hover(event);
        },function()
        {
            _self.hideTip();
        });
        this.hoverLayer.mouseout(function(){
            _self.hideTip();
        });
        this.hoverLayer.click(function()
        {
            _self.hideTip();
        });
        this.hoverLayer.mousemove(function(event)
        {
            _self.hover(event);
        });
    };
    Backup.prototype.removeListener=function()
    {

    };
    Backup.prototype.createOverRow=function(row)
    {
    };
    Backup.prototype.createRows=function()
    {
        var _self=this;

        var _firstRow=new this.Row();
        _firstRow.width=this.contentWidth;
        _firstRow.height=this.config.labelHeight+this.config.dotRadius*2;
        _firstRow.data={isFirst:true,title:"selected",status:this.data.status};
        _firstRow.x=this.posX;
        _firstRow.y=this.posY;
        _firstRow.x1=_firstRow.x;
        _firstRow.y1=_firstRow.y;
        _firstRow.x2=_firstRow.x1+_firstRow.width;
        _firstRow.y2=_firstRow.y1;
        _firstRow.x3=_firstRow.x1;
        _firstRow.y3=_firstRow.y1+_firstRow.height;
        _firstRow.x4=_firstRow.x2;
        _firstRow.y4=_firstRow.y3;
        this.drawDot(this.config.selectedColor,this.config.selectedHighlightColor,this.posX+this.config.dotRadius,this.posY+this.config.dotRadius,_firstRow);
        this.rows.push(_firstRow);
        $(this.data.backups).each(function(i,rowData)
        {
            var row=new _self.Row();
            row.index=i;
            row.width=_self.contentWidth;
            row.height=_self.config.rowHeight;
            row.x=_self.posX;
            row.y=_self.posY+_self.config.dotRadius*2+_self.config.rowHeight*i+_self.config.labelHeight;
            row.data=rowData;
            row.x1=row.x;
            row.y1=row.y;
            row.x2=row.x1+row.width;
            row.y2=row.y1;
            row.x3=row.x1;
            row.y3=row.y1+row.height;
            row.x4=row.x2;
            row.y4=row.y3;
            row.index=i;
            var desc=$('<span class="backup-des"></span>');
            desc.text(row.data.des);
            desc.attr("title",row.data.des);
            desc.css(
                {
                    left:_self.contentWidth-row.x-987,
                    top:row.y+row.height-_self.config.dotOuterMargin*2-50
                });
            _self.descLayer.append(desc);
            if(_self.config.isEdit)
            {
                var btns=$('<div style="position:absolute;" class="backup-btn"></div>');
                _self.iconLayer.append(btns);
                var menu,item;
                if(_self.oldRows)
                {
                    item=_self.oldRows[i];

                }
                menu=btns.iconmenu(
                    [
                        {
                            iconClass:"ef-backup-icon-menus-icon-revert",
                            tip: _.getLocale("global.button.rever.label"),
                            type:"revert",
                            index:0,
                            disable:Boolean(item&&item.menu.menus[0].disable),
                            id:1,
                            click:function()
                            {
                                _self.config.click(rowData,this);
                            }
                        },
                        {
                            iconClass:"icon-menus-icon-edit",
                            tip: _.getLocale("global.button.edit.label"),
                            type:"edit",
                            index:2,
                            disable:Boolean(item&&item.menu.menus[2].disable),
                            id:3,
                            click:function()
                            {
                                _self.config.click(rowData,this);
                            }
                        },
                        {
                            iconClass:"ef-backup-icon-menus-icon-delete",
                            tip: _.getLocale("global.button.delete.label"),
                            type:"delete",
                            index:1,
                            disable:Boolean(item&&item.menu.menus[1].disable),
                            id:2,
                            click:function()
                            {
                                _self.config.click(rowData,this);
                            }
                        }
                    ],true);


                btns.css(
                    {
                        left:row.x+_self.config.dotRadius*2+150,
                        top:row.y+row.height-_self.config.labelHeight-_self.config.dotOuterMargin-110
                    });
                row.btns=btns;
                row.menu=menu;
                btns.hide();
            }
            _self.rows.push(row);
            _self.createRow(row);
        });
    };
    //绘制单行（包括左侧竖线和右侧横线）
    Backup.prototype.createRow=function(row) {
        //this.baseContext.translate(0.5,0.5);
        this.baseContext.lineWidth=1;
        this.baseContext.beginPath();
        this.baseContext.strokeStyle=this.config.normalColor;
        this.baseContext.moveTo(row.x+this.config.dotRadius+30.5,row.y-this.config.labelHeight+0.5);
        this.baseContext.lineTo(row.x+this.config.dotRadius+30.5,row.y+row.height-this.config.dotRadius*2-this.config.dotOuterMargin+30+0.5);
        this.baseContext.closePath();
        this.baseContext.stroke();
        //this.baseContext.arc(row.x+this.config.dotRadius,row.y+row.height-this.config.dotRadius-this.config.labelHeight, this.config.dotOuterRadius, Math.PI*1.5, Math.PI*0.25);
        this.baseContext.stroke();
        //this.baseContext.beginPath();
        this.baseContext.moveTo(0.5,row.y+row.height-this.config.labelHeight+0.5);
        this.baseContext.lineTo(row.x+row.width-this.config.dotRadius*2+0.5,row.y+row.height-this.config.labelHeight+0.5);
        this.baseContext.closePath();
        this.baseContext.stroke();
        this.drawDot(this.config.normalColor,this.config.normalHighlightColor,row.x+this.config.dotRadius,row.y+row.height-this.config.dotRadius-this.config.labelHeight,row);
        this.drawText(row);
    };
    //canvas内加入文字（名称，日期和容量）
    Backup.prototype.drawText=function(row)
    {
        this.baseContext.beginPath();
        this.baseContext.textAlign="left";
        this.baseContext.font = "14px bold 微软雅黑,Microsoft YaHei";
        this.baseContext.fillText(row.data.title,row.x+this.config.dotRadius*2+this.config.dotOuterMargin*3+22,row.y-this.config.dotOuterMargin*2+20);
        this.baseContext.closePath();
        this.baseContext.textAlign="right";
        this.baseContext.beginPath();
        this.baseContext.fillText(_.number2time(row.data.time,"Y-M-D h:m:s",true),this.contentWidth-row.x-5,row.y+row.height-this.config.dotOuterMargin*2-this.config.labelHeight);
        this.baseContext.closePath();
        this.baseContext.beginPath();
        this.baseContext.textAlign="left";
        this.baseContext.fillText(row.data.size+row.data.unit||0,row.x+this.config.dotRadius*2+this.config.dotOuterMargin*3+22,row.y+row.height-this.config.dotOuterMargin*2-this.config.labelHeight-40);
        this.baseContext.closePath();
        //this.baseContext.beginPath();
        //this.baseContext.fillText(row.data.des,this.contentWidth-row.x,row.y+row.height-this.config.dotOuterMargin*2,60);
        //this.baseContext.closePath();
    };
    //绘制左侧的状态icon
    Backup.prototype.drawDot=function(outColor,innerColor,x,y,row)
    {
        var span=$('<span class="absolute ef-backup-doti-span"><i class="ef-backup-doti"></i><label></label></span>');
        span.css({left:x+20,top:y-92});
        span.find("i").addClass((!row.data.isFirst?"ef-backup-state-":"ef-backup-vm-state-")+row.data.status||"available");
        this.legendLayer.append(span);
        if(row.data.isFirst)
        {
            span.css({left:x+20,top:y-5});
            span.find("label").text(_.getLocale("backup.vm.state."+this.data.status+".text"));
        }else
        {
            span.tooltip(
                {
                    content: _.getLocale("backup.dot.state."+row.data.status+".text")
                })
        }
        return;
        this.baseContext.beginPath();
        this.baseContext.strokeStyle=outColor;
        this.baseContext.fillStyle=outColor;
        this.baseContext.circle(x,y,this.config.dotRadius,true);
        this.baseContext.closePath();
        this.baseContext.beginPath();
        this.baseContext.strokeStyle="#ffffff";
        this.baseContext.fillStyle="#ffffff";
        this.baseContext.circle(x,y,this.config.dotLev1Radius,true);
        this.baseContext.closePath();
        this.baseContext.beginPath();
        this.baseContext.strokeStyle=innerColor;
        this.baseContext.fillStyle=innerColor;
        this.baseContext.circle(x,y,this.config.dotLev2Radius,true);
        this.baseContext.closePath();
    };
    Backup.prototype.Row=function()
    {
        this.x=0;
        this.y=0;
        this.width=0;
        this.height=0;
        this.data={};
        this.x1=0;
        this.x2=0;
        this.x3=0;
        this.x4=0;
        this.y1=0;
        this.y2=0;
        this.y3=0;
        this.y4=0;
        this.menu=null;
        this.index=-1;
    };
    /**
     * 获取所有rows
     * */
    Backup.prototype.getRows=function(rows)
    {
        rows=rows||this.rows;
        return _.filter(rows,function(item)
        {
            return item.index!=-1;
        });
    };
    ef.register(Backup,"backup");
    return Backup;
});
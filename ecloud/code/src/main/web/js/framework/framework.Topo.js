/**
 * Created by wangahui1 on 16/4/19.
 */
define("framework.topo",["exports","framework.core"],function(exports,ef)
{
    /**
     * #拓扑图组件#
     * {@img topo.jpg 拓扑图示例}
     * # 描述 #
     * 拓扑图用户用于编辑vlan之间关系、主机列表、ip列表等，并且支持浏览器缩放自动重绘
     *
     *
     * **使用范例**：
     *
     *     @example
     *       $(dom).topo(
     *
     *      {
         *          columns:[//要显示的vlan列表
         *              {label:"Vlan 130",//vlan标题
         *              id:"002",//vlan标识
         *              detail:"VLAN 130",selected:"true"//提示详细内容
         *              },
         *              {label:"Vlan 140",id:"003",detail:"VLAN 131"},
         *      ],
         *      items://已有的连线列表，连线有方向，如果起始等于终止，则连线是双向箭头
         *        [
         *            {from:"002",//连线的起始方向
         *            to:"003",//连线的终止，一般终止方向显示箭头
         *            status:"1",//状态，代表是否联通，如果联通显示绿色，否则显示红色
         *            },
         *            {from:"001",to:"003",status:"1"},
         *        ]
         *      }
     *      );
     * @class ef.components.topo
     * */
    function Topo(box, data, config) {
        /** 拓扑图宽度*/
        this.width = 0;
        /** 拓扑图高度*/
        this.height = 0;
        /**拓扑图是否可编辑，否则只能查看，不可编辑*/
        this.isEdit = false;
        /**拓扑图是否可拖拽编辑连线*/
        this.isDrag = false;
        /**拓扑图是否是可选状态，可选与isDrag互斥。如果可选，则点击行后显示选中状态*/
        this.isSelect = false;
        /**绘画的起始x轴*/
        this.posX = 0;
        /**绘画的起始y轴*/
        this.poxY = 0;
        /**所有的行(vlan)Row对象集合*/
        this.rows = [];
        /**所有的列(箭头)Col对象集合*/
        this.cols = [];
        this.box = $(box);
        /**配置参数对象*/
        this.data = data;
        this.clickX = -1;
        this.clickY = -1;
        this.lastOverRow = false;
        /**生成的组件dom主容器*/
        this.container = $('<div class="net-topo"></div>');
        /**画布对象*/
        this.canvas = $('<canvas></canvas>');
        /**CanvasRenderingContext2D对象*/
        this.context = this.canvas[0].getContext("2d");
        this.init();
        this.setConfig(config);
        this.render();
        this.clickCallback = $.noop;
        this.changeCallback = $.noop;
        this.startRow = null;
        this.endRow = null;
        var _self = this;
        $(this.box).resize(function () {
            _self._setCurrentData();
            _self.render();
        });
        return this;
    }
    Topo.isDom=true;
    /**
     * 根据新数据更新topo图
     * @param {Object}[data] 要更新的数据
     * */
    Topo.prototype.update = function (data, config) {
        if (data) {
            this.data = data;
        }
        this.init();
        this.setConfig(config);
        this.render();
        return this;
    };
    Topo.prototype._setCurrentData = function () {
        var _currentData = this.getSelectedRows();
        $(this.data.columns).each(function (i, il) {
            $(_currentData).each(function (j, jl) {
                if (jl.id == il.id) {
                    il.selected = true;
                }
            });
        });

    };
    /**渲染组件*/
    Topo.prototype.render = function () {
        this.draw();
        this.addListener();
    };
    Topo.prototype.getFormatTip = function (rowData) {
        var _name = "<p>" + _.getLocale("topo.column.name.tip") + ":" + (rowData.name || "") + " ";
        var _cidr = _.getLocale("topo.column.cidr.tip") + ":" + (rowData.cidr || "") + "" + "</p>";
        var _gateway = "<p>" + _.getLocale("topo.column.gateway.tip") + ":" + (rowData.gateway || "") + " ";
        var _ipuse = _.getLocale("topo.column.ipuse.tip") + ":" + (rowData.ip_use || 0) + "/" + (rowData.ip_total || 0) + "" + "</p>";
        var arrs = rowData.tenants || [];
        var _tentants = "<p>" + _.getLocale("framework.topo.icon.tenant.tip") + ":" + _.pluck(arrs, "name").join(",") + "</p>";
        return _name + _cidr + _gateway + _ipuse + _tentants;
    };
    Topo.prototype.removeListener = function () {
        this.hoverLayer.off();

    };
    Topo.prototype.clear = function () {
        this.removeListener();
        this.container.empty();
        this.box.empty();
        this.canvas.empty();
        this.width = this.getWidth();
        this.height = this.getHeight();
        this.posX = this.config.paddingLeft;
        this.posY = this.config.paddingTop;
        this.canvas.attr("width", this.width);
        this.canvas.attr("height", this.height);
    };
    Topo.prototype.isLastRows=function(index)
    {
        return this.rows.length>index&&this.rows.length-index<3;
    };
    /**@protected 事件侦听*/
    Topo.prototype.addListener = function () {
        var _self = this;
        this.hoverLayer.off();
        this.hoverLayer.mousemove(function (event) {
            var _x = event.offsetX;
            var _y = event.offsetY;
            var _offsetX = _self.box.offset().left;
            var _offsetY = _self.box.offset().top;
            var _row = _self.isIn(_x, _y);
            var _col = _self.isIn(_x, _y, true, true);
            if (_row ) {
                _self.createOverRow(_row);
                _self.box.addClass("hovered");
                var _tip = _self.container.tooltip('tip');
                _tip ? _tip.show() : null;
                if(_tip)
                {
                    _tip.find(".tooltip-content").html(_self.getFormatTip(_row.data));
                    var _top = _y + _offsetY + 30 - _self.box.scrollTop();
                    _tip.css(
                        {
                            left: _x + _offsetX,
                            top: _top
                        });
                }
                if (_self.lastOverRow && _row != _self.lastOverRow && !_self.lastOverRow.selected) {
                    _self.createUpRow(_self.lastOverRow);
                }
                _self.lastOverRow = _row;

            } else {
                var _tip = _self.container.tooltip('tip');
                _tip ? _tip.hide() : null;
            }
            if (_row != _self.lastOverRow) {
                _self.createUpRow(_self.lastOverRow);
                _self.box.removeClass("hovered");
                $(_self.rows).each(function (i, el) {
                    if (el.selected) {
                        _self.createOverRow(el);
                    }
                })
            }
            if (!_self.isEdit)return;
            if (_col && !_self.isSelect) {
                _self.createUpCol(_col);
            } else {
                _self.clearUpCol();
            }
            if (_self._isDragging) {
                _self.createDashCol(_x, _y);
            }
        });

        this.hoverLayer.blur(function (event) {
            var _x = event.offsetX;
            var _y = event.offsetY;
            //$(".tooltip-bottom").hide();
            if (_self.lastOverRow) {
                _self.createUpRow(_self.lastOverRow);
                _self.box.removeClass("hovered");
            }
            $(_self.rows).each(function (i, el) {
                if (el.selected) {
                    _self.createOverRow(el);
                } else {
                    _self.createUpRow(el);
                }
            });
            _self.clickX = -1;
            _self.clickY = -1;
            _self._isDragging = false;
            var _tip = _self.container.tooltip('tip');
            _tip.hide();
            //_self.draw();
        });
        this.hoverLayer.click(function (event) {
            var _tip = _self.container.tooltip('tip');
            _tip.hide();
            if (!_self.isEdit)return;
            //if(_self._isDragging)return;
            var _x = event.offsetX;
            var _y = event.offsetY;
            var _row = _self.isIn(_x, _y);
            if (_row  && _self.isSelect) {
                _row.selected = !_row.selected;
                _self.changeCallback(_row);
                if (_row.selected) {
                    _self.iconLayer.find(".layer-icon").eq(_row.index - 1).show();
                } else {
                    _self.iconLayer.find(".layer-icon").eq(_row.index - 1).hide();
                }
            }

        });
        this.hoverLayer.mousedown(function (event) {
            var _tip = _self.container.tooltip('tip');
            _tip.hide();
            var _x = event.offsetX;
            var _y = event.offsetY;
            if (!(_self.isEdit && _self.isDrag)) {
                return;
            }
            var _tip = _self.container.tooltip('tip');
            _tip.hide();
            var _col = _self.isIn(_x, _y, true, true);
            if (_col && !_self.isSelect) {
                _self.delCol(_col);
            }
            if (!_self.isSelect) {
                _self._isDragging = true;
            }
            var _x = event.offsetX;
            var _y = event.offsetY;
            var _row = _self.isIn(_x, _y);
            if (_row) {
                _self.clickX = _x;
                _self.clickY = _y;
                _self.startRow = _row;
            }
        });
        this.hoverLayer.mouseup(function (event) {

            _self.clickX = -1;
            _self.clickY = -1;
            _self._isDragging = false;
            var _x = event.offsetX;
            var _y = event.offsetY;
            var _row = _self.isIn(_x, _y);
            if (!_row && !_self.isSelect) {
                _self.clearDashCol();
                return;
            } else {
                _self.endRow = _row;
            }






            if (_self.startRow && _self.endRow && !_self.isSelect) {
                var _tip = _self.container.tooltip('tip');
                if (_tip) {
                    _tip.hide();
                }
                var obj = {};
                obj.from = _self.startRow.data.id;
                obj.to = _self.endRow.data.id;
                obj.status = 1;
                _self.redrawConn(obj, _x);
                _self.render();
                _self.startRow = null;
                _self.endRow = null;
            }
            _self.clearDashCol();
        });
        this.hoverLayer.mouseout(function (event) {
            var _tip = _self.container.tooltip('tip');
            _tip ? _tip.hide() : null;
            _self.clickX = -1;
            _self.clickY = -1;
            _self._isDragging = false;
            var _x = event.offsetX;
            var _y = event.offsetY;
            var _row = _self.isIn(_x, _y);
            if (!_row) {
                _self.clearDashCol();
            }
        });
        this.hoverLayer.mouseleave(function () {
            var _tip = _self.container.tooltip('tip');
            _tip ? _tip.hide() : null;
        });
    };
    /**在两个连线之间插入一条线
     *@param {Object} obj 新画线的起始、终止、状态对象（item）
     *@param {Number} x 当新线的x轴
     *
     * */
    Topo.prototype.betweenDraw = function (obj, x) {
        console.log(obj);
        if (this.data.items.length <= 1) {
            this.data.items.push(obj);
            return;
        }
        var _index = -1;
        for (var i = 0; i < this.cols.length; i++) {
            var _startX = this.cols[i].x;
            var _endX;
            if (i != this.cols.length - 1) {
                _endX = this.cols[i + 1].x;
            } else {
                _endX = Infinity;
            }
            if (x >= _startX && x < _endX) {
                _index = i + 1;
            }
        }
        this.data.items.splice(_index, 0, obj);
    };
    /**
     * 重绘连线
     * @param {Object} obj 新画线的起始、终止、状态对象（item）
     * @param {Number} x 当新线的x轴
     * @return {Boolean} 是否是新增一条线，如果是false则说明没有新增，只是修改了一条线的状态（单向、双向）
     * */
    Topo.prototype.redrawConn = function (obj, x) {
        var _bool = false;
        if (obj.from == obj.to) {
            _bool = true;
            return _bool;
        }
        $(this.data.items).each(function (i, il) {
            if ((obj.from == il.from) && (obj.to == il.to)) {
                if (il.twoway == 1) {
                    il.twoway = 0;
                    il.status = 1;
                }
                _bool = true;

            }
            if (obj.from == il.to && obj.to == il.from) {
                if (il.twoway == 1) {
                    il.twoway = 0;

                } else {
                    il.twoway = 1;
                }
                il.status = 1;
                _bool = true;

            }

        });
        if (!_bool) {
            this.betweenDraw(obj, x);
        }
        return _bool;
    };
    /**
     * 判断坐标是否在行(vlan)内或列(箭头)内
     * @param {Number} x 要判断的坐标x轴
     * @param {Number} y 要判断的坐标y轴
     * @param {Boolean} isVertical 是否是在垂直（列方向）判断，如果否则是在水平（行方向）判断
     * @param {Boolean} isCenterX 是否要在水平中心判断，比如列是箭头，要在列的中心点判断
     * @param {Boolean} isCenterY 是否要在垂直中心判断，比如列是箭头，要在列的中心点判断，暂时无用
     * @return {Boolean} 坐标是否在行或列内
     * */
    Topo.prototype.isIn = function (x, y, isVertical, isCenterX, isCenterY) {
        var bool = false;
        var _arrs = isVertical ? this.cols : this.rows;
        $(_arrs).each(function (i, el) {
            var _x = isCenterX ? el.x - el.width / 2 : el.x;
            var _x1 = isCenterX ? el.x1 : el.x1;
            var _y = isCenterY ? el.y : el.y;
            var _y1 = isCenterY ? el.y1 : el.y1;
            var _startX = Math.min(_x, _x1);
            var _endX = Math.max(_x, _x1);
            var _startY = Math.min(_y, _y1);
            var _endY = Math.max(_y, _y1);
            if (x >= _startX && x < _endX && y >= _startY && y < _endY) {
                bool = el;
            }
        });
        return bool;
    };
    /**@protected  初始化*/
    Topo.prototype.init = function () {
        this._isDragging = false;
        this.config =
        {
            rowHeight: 35,
            rowPadding: 35,
            paddingLeft: 10,
            paddingRight: 10,
            buttonWidth: 100,
            paddingTop: 0,
            paddingBottom: 0,
            colPadding: 62,
            colWidth: 10,
            labelWidth: 130,
            arrowRadius: 5
        };
        this.data.columns = this.data.columns || [];
        this.public = {
            "label": "Public",
            "id": "public"
        };
        var _bool = false;
        $(this.data.columns).each(function (i, il) {
            if (il.id == "public") {
                _bool = true;
            }
        });
        if (!_bool) {
            this.data.columns = [].concat(this.data.columns);
        }
        this.rows = [];
        this.cols = [];
        this.data.items = (!this.data.items || !this.data.items.length) ? [] : this.data.items;
    };
    /**
     *@protected 修改配置参数
     * */
    Topo.prototype.setConfig = function (option) {
        if (!option) {
            return;
        }
        for (var i in option) {
            this[i] = option[i];
            this.config[i] = option[i];
        }
    };
    /**获取绘画区域的实际宽度，除去padding*/
    Topo.prototype.getWidth = function () {
        var _w = 0;
        _w = this.box.width() - this.config.paddingLeft - this.config.paddingRight;
        if (_w < this.config.labelWidth + this.config.buttonWidth + 50) {
            _w = this.config.labelWidth + this.config.buttonWidth + 50;
        }
        return _w;
    };
    /**获取绘画区域的实际高度，除去padding*/
    Topo.prototype.getHeight = function () {
        var _h = 0;
        _h += this.config.paddingTop + this.config.paddingBottom;
        var _self = this;
        $(this.data.columns).each(function () {
            _h += _self.config.rowHeight + _self.config.rowPadding;
        });
        return _h;
    };
    /**@protected 重绘*/
    Topo.prototype.draw = function () {
        if (!this.data) {
            return;
        }
        this.container.empty();
        this.box.empty();
        this.canvas.empty();
        this.width = this.getWidth();
        this.height = this.getHeight();
        this.posX = this.config.paddingLeft;
        this.posY = this.config.paddingTop;
        this.canvas.attr("width", this.width);
        this.canvas.attr("height", this.height);
        /**绘制列的canvas容器*/
        this.columnLayer = this.canvas.clone();
        /**绘制列的CanvasRenderingContext2D对象*/
        this.columnContext = this.columnLayer[0].getContext("2d");
        /**文本的canvas容器*/
        this.textLayer = this.canvas.clone();
        /**绘制文本CanvasRenderingContext2D对象*/
        this.textContext = this.textLayer[0].getContext("2d");
        /**绘制按钮图标的dom容器*/
        this.iconLayer = $('<div style="position: absolute" class="icon-layer"></div>');
        this.iconLayer.width(this.width);
        this.iconLayer.height(this.height);
        /**绘制提示的canvas容器*/
        this.tipLayer = this.canvas.clone();
        this.isEdit ? this.tipLayer.show() : this.tipLayer.hide();
        /**绘制提示的绘制文本CanvasRenderingContext2D对象*/
        this.tipContext = this.tipLayer[0].getContext("2d");
        /**绘制拖拽的canvas容器,主要用于存储箭头的委托对象*/
        this.dragLayer = this.canvas.clone();
        /**绘制拖拽的CanvasRenderingContext2D对象*/
        this.dragContext = this.dragLayer[0].getContext("2d");
        /**事件侦听图层，位于顶层*/
        this.hoverLayer = this.canvas.clone();
        this.hoverContex = this.hoverLayer[0].getContext("2d");
        this.leftIcon = $('<span style="position: absolute;z-index:10;" class="layer-icon"><img src="theme/default/images/topology_selected.png"/></span>');
        /**按钮的dom模版*/
        this.button = $('<div style="position: absolute;z-index:10;" class="topo_button">' +
            '<span data-tip="' + ef.util.getLocale("framework.topo.icon.host.tip") + '" data-relation="host" class="hostlist"><img src="theme/default/images/master.png" /></span>' +
            '<span data-tip="' + ef.util.getLocale("framework.topo.icon.ip.tip") + '" data-relation="ip" class="ipclude"><img src="theme/default/images/ip_range.png" /></span>');
        //+ '<span data-tip="' + ef.util.getLocale("framework.topo.icon.tenant.tip") + '" data-relation="tenant" class="tenantclude"><img src="theme/default/images/tenant.png" /></span></div>"');
        this.box.append(this.container);
        this.container.append(this.canvas);
        this.container.append(this.columnLayer);
        this.container.append(this.textLayer);
        this.container.append(this.iconLayer);
        this.container.append(this.tipLayer);
        this.container.append(this.dragLayer);
        this.container.append(this.hoverLayer);
        ef.util.setDepths([this.canvas, this.columnLayer, this.textLayer, this.iconLayer, this.tipLayer, this.dragLayer, this.hoverLayer]);
        this.createRows();
        this.createCols();

        this.container.tooltip({
            trackMouse:true,
             onShow: function () {
                $(".tooltip-bottom").hide();
            }
        });
        this._showOrHideButton(this.isEdit);
    };
    /**根据id获取vlan
     * @param {String} id要获取的id
     * @return {Object} 返回获取的vlan行对象
     * */
    Topo.prototype.getRowById = function (id) {
        var _row = null;
        $(this.rows).each(function (i, el) {
            var _data = el.data;
            if (_data.id == id) {
                _row = el;
            }
        });
        return _row;
    };
    Topo.prototype.ClickEvent = function (param) {
        this.type = "click";
        if (param) {
            for (var i in param) {
                this[i] = param[i];
            }
        }
        return this;
    };
    /**@protected 生成所有行(vlan)*/
    Topo.prototype.createRows = function () {
        var _self = this;
        this.rows = [];
        $(this.data.columns).each(function (i, el) {
            var _row = new _self.Row();
            _row.index = i;
            _row.x = _self.posX;
            _row.y = i * (_self.config.rowHeight + _self.config.rowPadding);
            _row.width = _self.width;
            _row.height = _self.config.rowHeight;
            _row.x1 = _row.x + _row.width;
            _row.y1 = _row.y + _row.height;
            _row.id = el.id;
            _row.data = el;
            _row.selected = Boolean(_row.data.selected);
            _self.rows.push(_row);
            _self.createUpRow(_row);
            _self.createText(_row);
            _self.createEditRow(_row);
            if (_row.selected) {
                _self.createUpRow(_row);
            }
            var _button = _self.button.clone();
            _button.selected = _row.selected;
            //if (i) {
                _button.css({"left": _row.x1 - _self.config.buttonWidth, "top": _row.y1 - 40});
                _self.container.append(_button);
                _button.find("span").click(function (event) {
                    _self._setCurrentData();
                    event.stopPropagation();
                    try {
                        var _ptip = _self.container.tooltip('tip');
                        _ptip.hide();
                    } catch (err) {
                    }

                    var tip = $(this).tooltip("tip");
                    tip.hide();
                    var _event = new _self.ClickEvent();
                    _event.originalEvent = event;
                    _event.targetIndex = $(this).index();
                    _event.targetLabel = $(this).find("img").attr("title");
                    _event.target = $(this);
                    _event.data = _row.data;
                    _event.data.relation = $(this).attr("data-relation");
                    _self.clickCallback(_event);
                    return false;

                });
                _button.find("span").each(function () {
                    var _$data = $(this).attr("data-tip");
                    $(this).tooltip({content: _$data});
                });
                _button.find("span").hover(function (event) {
                    event.stopPropagation();
                    try {
                        var _ptip = _self.container.tooltip('tip');
                        _ptip.hide();
                    } catch (err) {
                    }
                    var _$data = $(this).attr("data-tip");
                    $(this).tooltip({content: _$data});
                });

            //}
            var _leftIcon = _self.leftIcon.clone();
            //if (i) {
                _leftIcon.css({"left": _row.x + 5, "top": _row.y1 - 25});
                _self.iconLayer.append(_leftIcon);
                if (_row.selected && _self.isEdit) {
                    _leftIcon.show();
                }
            //}
        });
    };
    /**@protected 生成所有列(箭头)*/
    Topo.prototype.createCols = function () {
        var _self = this;
        this.cols = [];
        var _width = this.width - this.config.paddingLeft - this.config.paddingRight - this.config.buttonWidth;
        _width = _width / this.data.items.length;
        $(this.data.items).each(function (i, el) {
            //if(!el.from||!el.to)return;
            var _col = new _self.Col();
            _self.cols.push(_col);
            var _fromRow = _self.getRowById(el.from);
            var _toRow = _self.getRowById(el.to);
            if (!_fromRow || !_toRow)return;
            _col.direction = _fromRow.y > _toRow.y ? 0 : 1;
            _col.index = i;
            _col.width = _self.config.colWidth;
            _col.x = _self.posX + _self.config.labelWidth + i * _width;
            if (!_fromRow || !_toRow) {
                throw new Exception("wrong with data");
            }
            _col.x1 = _col.x + _col.width;
            if (_col.direction) {
                _col.y = _fromRow.y + _self.config.rowHeight;
                _col.y1 = _toRow.y1 - _self.config.rowHeight;
            } else {
                _col.y = _fromRow.y;
                _col.y1 = _toRow.y1;
            }
            //_col.y = _col.direction?_fromRow.y+_self.config.rowHeight:_fromRow.y1+_self.config.rowHeight;
            //_col.y1 = _col.direction?_toRow.y1-_self.config.rowHeight:_toRow.y-_self.config.rowHeight;
            _col.height = Math.floor(_col.y1 - _col.y);
            _col.data = el;
            _self.createCol(_col);
        });
    };
    /**生成列（箭头）
     * @param {Object} col 列对象
     * @param {Object} context context2d对象
     * @param {Boolean} isClear 是否清除所绘制的
     * */
    Topo.prototype.createCol = function (col, context, isClear) {
        this.createArrowLine(col, context, isClear);
    };
    /**绘制委托列*/
    Topo.prototype.createDashCol = function (x, y) {
        if (this.clickX == -1 && this.clickY == -1) {
            return;
        }
        var _col = new this.Col();
        _col.x = this.clickX;
        _col.y = this.clickY;
        _col.x1 = this.clickX;
        _col.y1 = y;
        _col.width = this.config.colWidth;
        this.createArrowLine(_col, this.hoverContex, true, "#ff0000");
    };
    /**清除委托列*/
    Topo.prototype.clearDashCol = function () {
        this.startRow = null;
        this.endRow = null;
        this.hoverContex.clearRect(this.posX, this.posY, this.width, this.height);
    };
    Topo.prototype.createArrowLine = function (col, context, isClear, color) {
        context = context || this.columnContext;
        if (isClear) {
            context.clearRect(this.posX, this.posY, this.width, this.height);
        }
        switch (col.data.status) {
            case 0:
            {
                context.strokeStyle = "#ff0000";
                context.fillStyle = "#ff0000";
                break;
            }
            default :
            {
                context.strokeStyle = "#1d8c63";
                context.fillStyle = "#1d8c63";
            }
        }
        if (color) {
            context.strokeStyle = color;
            context.fillStyle = color;
        }
        context.beginPath();
        context.lineWidth = 3;
        context.moveTo(col.x, col.y);
        if (color) {
            context.dashedLineTo(col.x, col.y, col.x1, col.y1, 5);
        } else {
            context.lineTo(col.x, col.y1);
        }
        context.stroke();
        context.closePath();
        //start arrow
        var _isDown = col.y1 > col.y;
        var min = Math.min(col.y, col.y1);
        var max = Math.max(col.y, col.y1);
        if (col.y == col.y1)return;
        if (_isDown) {
            this.createDownArrow(col.x, col.y1, context);
            if (col.data.twoway == "1") {
                this.createUpArrow(col.x, col.y, context);
            }
        } else {
            this.createUpArrow(col.x, col.y1, context);
            if (col.data.twoway == "1") {
                this.createDownArrow(col.x, col.y, context);
            }
        }


    };
    Topo.prototype.createUpArrow = function (x, y, context) {
        context = context || this.columnContext;
        context.lineWidth = 2;
        context.beginPath();
        context.moveTo(x, y);
        context.lineTo(x - 5, y + 5);
        context.lineTo(x + 5, y + 5);
        context.lineTo(x, y);
        context.stroke();
        context.fill();
        context.closePath();
    };
    Topo.prototype.createDownArrow = function (x, y, context) {
        context = context || this.columnContext;
        context.lineWidth = 2;
        context.beginPath();
        context.moveTo(x, y);
        context.lineTo(x - 5, y - 5);
        context.lineTo(x + 5, y - 5);
        context.lineTo(x, y);
        context.stroke();
        context.fill();
        context.closePath();

    };
    Topo.prototype.createText = function (row) {
        this.textContext.fillStyle = "#333";
        this.textContext.font = "14px bold 微软雅黑,Microsoft YaHei";
        this.textContext.beginPath();
        var _x = row.x + 25;
        var _centerX=(this.width - this.config.paddingLeft - this.config.paddingRight) / 2;
        // if (!row.index) {
        //     _x = _centerX;
        // }
        this.textContext.fillText(row.data.label, _x, row.y + 23);
        if(row.data.location!=undefined)
        {
            this.textContext.fillText(row.data.location,_centerX,row.y+23);
        }
        this.textContext.closePath();
    };
    Topo.prototype.createUpRow = function (row) {
        if (!row) {
            return;
        }
        this.context.clearRect(row.x, row.y, row.width, row.height);
        this.context.fillStyle = "#e7e7e7";
       // if (!row.index) {
            //this.context.fillStyle = "#b5dca4";
        //}
        if (row.selected) {
            this.context.fillStyle = "#c1d7ff";
        }
        this.context.strokeStyle = "#fff";
        this.context.beginPath();
        this.context.moveTo(row.x, row.y);
        this.context.fillRect(row.x, row.y, row.width, row.height, 5);
        this.context.strokeRect(row.x, row.y, row.width, row.height);
        this.context.closePath();
    };
    Topo.prototype.createOverRow = function (row) {
        if (!row) {
            return;
        }
        this.context.clearRect(row.x, row.y, row.width, row.height);
        this.context.fillStyle = "#c1d7ff";
        this.context.strokeStyle = "#a0c2d4";
        this.context.beginPath();
        this.context.moveTo(row.x, row.y);
        this.context.fillRect(row.x, row.y, row.width, row.height);
        this.context.strokeRect(row.x, row.y, row.width, row.height);
        this.context.closePath();
    };
    Topo.prototype.createUpCol = function (col) {
        if (!col) {
            return;
        }
        this.dragContext.clearRect(col.x - col.width / 2, col.y, col.width, col.height);
        this.dragContext.fillStyle = "#ff1100";
        this.dragContext.globalAlpha = .2;
        this.dragContext.beginPath();
        this.dragContext.moveTo(col.x - col.width / 2, col.y);
        this.dragContext.fillRect(col.x - col.width / 2, col.y, col.width, col.height, 3);
        this.dragContext.closePath();
        this.dragContext.globalAlpha = 1;
        this.createCloseBtn(this.dragContext, col);
    };
    Topo.prototype.createCloseBtn = function (context, col) {
        context.strokeStyle = "#ff1100";
        context.circle(col.x, col.y + col.height / 2, this.config.colWidth / 2);
        context.fill();
        context.closePath();
        context.strokeStyle = "#ffffff";
        context.globalAlpha = 1;
        context.cross(col.x, col.y + col.height / 2, col.width / 2 - 2,true);
        context.stroke();
    };
    Topo.prototype.clearUpCol = function () {
        this.dragContext.clearRect(this.posX, this.posY, this.width, this.height);
    };
    Topo.prototype.createEditRow = function (row) {
        if (!row) {
            return;
        }
        this.tipContext.clearRect(row.x, row.y, row.width, row.height);
        this.tipContext.strokeStyle = "#919191";
        this.tipContext.dashStorkeRect(row.x, row.y, row.width, row.height, 3);
    };
    Topo.prototype.Row = function () {
        this.x = 0;
        this.y = 0;
        this.x1 = 0;
        this.y1 = 0;
        this.width = 0;
        this.height = 0;
        this.data = {};
        this.index = 0;
        this.selected = false;
        this.id = undefined;
    };
    Topo.prototype.Col = function () {
        this.data = {};
        this.x = 0;
        this.y = 0;
        this.x1 = 0;
        this.y1 = 0;
        this.width = 0;
        this.height = 0;
        this.index = 0;
        this.direction = 0;
    };
    Topo.prototype.addRow = function () {

    };
    Topo.prototype.delRow = function () {

    };
    Topo.prototype.addCol = function () {

    };
    Topo.prototype.delCol = function (col) {
        var _index = $.inArray(col.data, this.data.items);
        if (_index == -1)return;
        this.data.items.splice(_index, 1);
        this.render();
    };
    /*
     * @param isEdit -- default:false
     * **/
    Topo.prototype.setMode = function (isEdit) {
        this.isEdit = isEdit;
        this.isEdit ? this.tipLayer.show("fast") : this.tipLayer.hide();
        this._showOrHideButton(this.isEdit);

    };
    Topo.prototype._showOrHideButton = function (isShow) {
        this.container.find(".topo_button")[isShow ? "hide" : "show"]();
    };
    /**
     * event click
     * */
    Topo.prototype.click = function (fn) {
        if (!fn) {
            return;
        }
        this.clickCallback = fn;
        return this;
    };
    /**
     * event change
     * */
    Topo.prototype.change = function (fn) {
        if (!fn) {
            return;
        }
        this.changeCallback = fn;
        return this;
    };
    Topo.prototype.showConnectLine = function (bool) {
        this.columnContext.clearRect(this.posY, this.posY, this.width, this.height);
        if (bool) {
            this.createCols();
        }
        return this;
    };
    Topo.prototype.getIds = function (rows) {
        var arrs = [];
        rows = rows ? rows : this.rows;
        $(rows).each(function (i, il) {
            arrs.push(il.id);
        });
        return arrs;
    };
    /**
     * get selected rows
     * */
    Topo.prototype.getSelectedRows = function () {
        var _arrs = [];
        $(this.rows).each(function (i, row) {
            if (row.selected) {
                row.data.selected = true;
                _arrs.push(row.data);
            }
        });
        return _arrs;
    };
    Topo.prototype.delCircle = function (arrs, ids) {
        for (var i = 0; i < arrs.length; i++) {
            var _item = arrs[i];
            if ($.inArray(_item.from, ids) == -1 || $.inArray(_item.to, ids) == -1) {
                arrs.splice(i, 1);
                arguments.callee(arrs, ids);
                break;
            }
        }
    };
    /**
     * 获取选择的数据;
     * */
    Topo.prototype.getSelectedData = function () {
        var _rows = this.getSelectedRows();
        var _ids = this.getIds(_rows);
        this.data.columns = _rows;
        this.delCircle(this.data.items, _ids);
        return this.data;
    };
    ef.register(Topo,"topo");
    return Topo;
});
/**
 * Created by wangahui1 on 15/11/30.
 */
define("framework.ip", ["exports", "framework.core"], function (exports, ef) {
    /**
     * #IP范围选择组件#
     * {@img ip.png IP范围示例}
     * # 描述 #
     * IP范围组件依赖于ef.util.getCidr，可以渲染ip范围，并可设置dhcp独占及选择对应ip范围，获取ip列表等。
     *
     * **使用范例**：
     *
     *     @example
     *
     *
     *     var _ip=$(dom).ip({
         *      "cidr":"192.168.130.64/27",//cidr格式化字符串。
         *      "range":[70,71,72,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,91,92,93,94,95,168,169,170,175],//用户选择的ip范围
         *      "select":[//被占用的ip及详细描述
         *       {
         *         "id":70,//被占的ip
         *         "description":"租户:OPS, 云主机:运维服务"//被占ip的详细描述
         *       },
         *       {
         *         "id":78,
         *         "description":"租户:DEV, 云主机:数据分析平台"
         *       },
         *       {
         *         "id":83,
         *         "description":"租户:Monitor, 云主机:网络管理"
         *       },
         *       {
         *         "id":88,
         *         "description":"租户:DEV, 云主机:HPC-01"
         *       },
         *       {
         *         "id":93,
         *         "description":"租户:DEV, 云主机:图形处理"
         *       }
         *       ]
         *      });
     *
     *
     * @param {Object} data 配置ip组件
     * @class ef.components.ip
     * @return ef.components.ip
     * */
    function IP(box, data, config) {
        /**要生成该组件的dom容器*/
        this.box = box;
        this.legend = $('<ul class="ip-legend">' +
            '<li class="square_unselect"><span class="legend_square ip_square_unselect"></span><span class="legend_text"></span><p class="legend_count_p"><span>(</span><span class="legend_count"></span><span>)</span></p></li>' +
            '<li class="square_selected"><span class="legend_square ip_square_selected"></span><span class="legend_text"></span><p class="legend_count_p"><span>(</span><span class="legend_count"></span><span>)</span></p></li>' +
            '<li class="square_occupy_host"><span class="legend_square ip_square_occupy_host"></span><span class="legend_text"></span><p class="legend_count_p"><span>(</span><span class="legend_count"></span><span>)</span></p></li>' +
            '<li class="square_occupy"><span class="legend_square ip_square_occupy"></span><span class="legend_text"></span><p class="legend_count_p"><span>(</span><span class="legend_count"></span><span>)</span></p></li>' +
            '<li class="square_dhcp_edit"><span class="legend_square ip_square_dhcp_set"></span><span class="legend_text"></span><p class="legend_count_p"><span>(</span><span class="legend_count"></span><span>)</span></p></li>' +
            '<li class="square_dhcp"><span class="legend_square ip_square_gateway_legend"></span><span class="legend_text legend_text_gateway"></span><p class="legend_count_p"><span>(</span><span class="legend_count"></span><span>)</span></p></li>' +
            '</ul>');
        /**生成后的ip组件的主dom容器*/
        this.container = $('<div class="ip"></div>');
        /**ip范围块的dom容器*/
        this.square = $('<span class="ip_square"></span>');
        /**tooltip提示对象*/
        this.tip = $('<a class="easyui-tooltip"></a>');
        this.config = config || {isHideLengend: false};
        this.data = data;
        /**cidr范围的开始*/
        this.start = 0;
        /**cidr范围的结束*/
        this.end = 0;
        this.range = [];
        this.select = [];
        /**是否显示图例*/
        this.isHideLengend = this.config.isHideLengend;
        /**是否可编辑*/
        this.isEdit = false;
        /**是否已选dhcp*/
        this.hasDhcp = false;
        /**是否可以编辑dhcp*/
        this.isEditDhcp = false;
        /**色块集合*/
        this.squares = [];
        this.isMoving=false;
        this.isSep=false;
        this.startNum=-1;
        this.endNum=-1;
        /**是否已设网关*/
        this.hasNetgate = false;
        this.init();
        this.draw();
        this.addListener();
        return this;
    }

    IP.isDom = true;
    /**初始化*/
    IP.prototype.init = function () {
        this.start = 0;
        this.end = 0;
        this.range = [];
        this.select = [];
        this.squares = [];
        this.hasDhcp = false;
        this.isDrag = false;
        this.hasNetgate = false;
        this.startX = -1;
        this.startY = -1;
        this.lastX = -1;
        this.lastY = -1;
        this.changeCallback = $.noop;
        this.isFilter = Boolean(this.data.isFilter);
        _.copyProperty(this, this.config);
        this.cidr = _.getCidr(this.data.cidr,this.data.isAll,this.data.exclude);
        this.data.cidr = this.cidr.getIpZone();

    };
    IP.prototype.getDragSquares = function () {

    };
    IP.prototype.getSquareByPosition = function (x, y, isStart) {
        var that=this;

        if(isStart)
        {
           // console.log(x,y,this.box.scrollLeft(),this.box.scrollTop());
            if(!this.config.isSep)
            {
                x=this.isMoving?(x-this.box.scrollLeft()):(x+this.box.scrollLeft());
                y=this.isMoving?(y-this.box.scrollTop()):(y+this.box.scrollTop());
            }else
            {
                console.log("sepxxx");
                x=x-$(".right-entity").scrollLeft();
                y=y-$(".right-entity").scrollTop();
            }

        }
        return ef.util.find(this.squares, function (square) {
            var x0 = square.offset().left - 5;
            var y0 = square.offset().top - 5;
            var x1 = x0 + square.width() + 10;
            var y1 = y0 + square.height() + 10;
            //内部
            if (x > x0 && y > y0) {
                if (x < x1 && y < y1) {
                    return true;
                }
            }
            //边线
            if (x == x0 && y >= y0 && y <= y1) {
                return true;
            }
            if (x == x1 && y >= y0 && y <= y1) {
                return true;
            }
            if (y == y0 && x >= x0 && x <= x1) {
                return true;
            }
            if (y == y1 && x >= x0 && x <= x1) {
                return true;
            }
        });
    };

    /**拖动的范围是否选中了色块
     * @return {Array} 返回选中的色块
     * */
    IP.prototype.isIn = function (event) {
        var _self=this;
        var arrs = [];
       //  var results = [];
       //  var _x = event.pageX;
       //  var _y = event.pageY;
       // // console.log(_x,_y,this.isDrag);
       //  if(_x==undefined&&_y==undefined&&this.isDrag)
       //  {
       //      _x=this.lastX+this.box.scrollLeft();
       //      _y=this.lastY+this.box.scrollTop();
       //  }
       // // console.log("iii",this.startX,this.startY,_x,_y);
       //  //var _y=event.pageY;
       //  var direction = _x >= this.startX;//右边正向
       //  var _self = this;
       //  var startPoint = this.getSquareByPosition(this.startX, this.startY,true);
       //  var endPoint = this.getSquareByPosition(_x, _y);
       //  this.lastX = _x;
       //  this.lastY = _y;
       //  //console.log(startPoint,endPoint);
       //  if (!startPoint || !endPoint) {
       //      return arrs;
       //  }
       //  var startValue = this.getSquareData(startPoint);
       //  var endValue = this.getSquareData(endPoint);
       var max = _.max([this.startNum, this.endNum]);
       var min = _.min([this.startNum, this.endNum]);
        //console.log(max,min);
        $(this.squares).each(function (i, square) {
            square.removeClass("ip_square_circle");
        });
        $(this.squares).each(function (i, square) {
            if (_self.isDHCP(square) || _self.isNetgate(square) || _self.isOccupy(square))return;
            var currentValue = _self.getSquareData(square);
            if (currentValue >= min && currentValue <= max) {
                arrs.push(square);
                //_self.setSquareStatus(square, "circle");
                square.addClass("ip_square_circle");
            } else {
                //square.removeClass("ip_square_circle");
            }
            // var x0 = square.offset().left;
            // var y0 = square.offset().top;
            // var x1 = x0 + square.width();
            // var y1 = y0 + square.height();
            // //var _status = _self.getSquareStatus(square);
            // if (_self.isDHCP(square) || _self.isNetgate(square) || _self.isOccupy(square))return;
            // if (x1 >= _self.startX && y1 >= _self.startY) {
            //     if (x0 <= _x && y0 <= _y) {
            //         _self.setSquareStatus(square, "selected");
            //         arrs.push(square);
            //     } else {
            //         //_self.setSquareStatus(square, "unselect");
            //     }
            // }
        });
        return arrs;
    };
    /**@event change 获取ip的改变事件
     * @param {Function} callback 改变事件的回调函数，回调函数的参数是当前点击的square对象
     * */
    IP.prototype.change = function (callback) {
        this.changeCallback = callback || this.changeCallback;
        return this;
    };
    IP.prototype._doChange = function () {
        this.changeCallback(arguments);
        this.refreshLegend();
    };
    IP.prototype.setCirleSelected = function () {
        var _self = this;
        var arrs = [];
        $(this.squares).each(function (i, square) {
            if (square.hasClass("ip_square_circle")) {
                _self.setSquareStatus(square, "selected");
                arrs.push(square);
                square.removeClass("ip_square_circle");
            }
        });
        this._doChange(arrs);
    };
    /**事件侦听*/
    IP.prototype.addListener = function () {
        var _self = this;
        $(this.container).mousedown(function (event) {
           // console.log("down..start");
            if (event.which == 3) return false;
            if (!_self.isEdit)return false;
            // if(!_self.config.isSep)
            // {
            //     _self.startX = event.pageX -_self.box.scrollLeft();
            //     _self.startY = event.pageY -_self.box.scrollTop();
            // }else
            // {
            //     _self.startX = event.pageX -_self.box.scrollLeft()-$(".right-entity").scrollLeft();
            //     _self.startY = event.pageY -_self.box.scrollTop()-$(".right-entity").scrollTop();
            // }
            var target=$(event.target);
            if(!target.hasClass("ip_square"))
            {
                return false;
            }
            _self.startNum=_self.getSquareData(target);
            _self.isDrag = true;
            //_self.isMoving=false;
           // console.log("down..end");
        });
        // function moveS(event)
        // {
        //     //console.log("move",_self.isDrag,_self.startX,_self.startY);
        //     if (!_self.isDrag)return;
        //     var _ins = _self.isIn(event);
        //     if (_ins.length) {
        //         _self._doChange($(_ins));
        //     }
        //     $(_self.getSelectSquares()).each(function (i, square) {
        //         // _self._setDHCP(square);
        //
        //     });
        //     _self.refreshLegend();
        //
        // }
        $(this.container).mouseup(function (event) {
           // console.log("up");
            if (!_self.isEdit)return false;
            _self.isDrag = false;
            //_self.startX = -1;
           // _self.startY = -1;
            //_self.isMoving=true;
            //_self.startNum=-1;
            _self.setCirleSelected();
        });
        // $(this.box).scroll(function(event)
        // {
        //     // if(_self.isDrag)
        //     // {
        //     //    _self.startX = _self.lastX -_self.box.scrollLeft();
        //     //     _self.startY = _self.lastY -_self.box.scrollLeft();
        //     // }
        //     //$(_self.container).trigger("mousemove");
        //     //_self.isMoving=true;
        // });
        // $(this.container).mouseout(function(event)
        // {
        //     console.log(event);
        // });
        $(this.container).mousemove(function (event) {
           // moveS(event);
            if(!_self.isDrag)
            {
                return false;
            }
            var target=$(event.target);
            if(!target.hasClass("ip_square"))
            {
                return false;
            }
            _self.endNum=_self.getSquareData(target);
            var _ins = _self.isIn();
            if (_ins.length) {
                _self._doChange($(_ins));
            }
            _self.refreshLegend();

        });
        $(this.squares).each(function (i, il) {
            $(this).hover(function () {
                if ($(this).hasClass("ip_square_wait")) {
                    $(this).removeClass("ip_square_white");
                    $(this).addClass("ip_square_pink");
                }
            }, function () {
                if ($(this).hasClass("ip_square_wait")) {
                    $(this).addClass("ip_square_white");
                    $(this).removeClass("ip_square_pink");
                }
            });
            $(this).mousedown(function (event) {
                function toForbid(dom) {
                    if (event.which == 3) {
                        dom.oncontextmenu = function (evt) {
                            evt = evt || root.event;
                            evt.cancelBubble = true;
                            evt.stopPropagation();
                            return false;
                        };
                        return false;
                    }
                    return true;
                }

                if (!_self.isEdit) {
                    return toForbid(this);
                }
                if (_self.isEditDhcp) {
                    if (_self.isDHCP($(this)) || _self.isNetgate($(this))) {
                        return toForbid(this);
                    }
                    //$(this).smartMenu([[
                    //    {
                    //        text: "设为DHCP",
                    //        func: function () {
                    //            _self.setDhcp($(this), true);
                    //        }
                    //    }]]);
                } else {
                    return toForbid(this);
                }
            });

            $(this).click(function (event) {
                if (!_self.isEdit)return false;
                if (_self.isDHCP($(this)) || _self.isNetgate($(this))) {
                    return;
                }
                if (_self.isUnselect($(this))) {
                    _self.setSquareStatus($(this), "selected");
                } else if (_self.isSelected($(this))) {
                    _self.setSquareStatus($(this), "unselect");
                }
                if (!_self.hasDhcp && !_self.isOptimize) {
                    //_self.setDhcp($(this), true);
                }
                if (_self.isOccupy($(this)))return;
                _self._doChange($(this));
            });

        });
    };
    /**清除所有方块*/
    IP.prototype.clear = function () {

    };
    IP.prototype.selectAll = function () {
        var _self = this;
        $(this.getUnSelectedSquares()).each(function (i,square) {
                _self.setSquareStatus(square, "selected");
        });
    };
    IP.prototype.unSelectAll = function () {
        var _self = this;
        $(this.getSelectSquares()).each(function (i,square) {
                if(_self.getSquareStatus(square)=="selected"){
                    _self.setSquareStatus(square, "unselect");
                }
        });
    };
    IP.prototype._getFormatSelect = function () {
        var arrs = [];
        $(this.data.ips).each(function (i, item) {
            var obj =
            {
                id: _.getIpSufix(item.ip)
            };
            //if(item.used==1)
            //{
            obj.project = item.tenant && item.tenant.id ? item.tenant.name : "";
            item.vm ? obj.host = item.vm : null;
            if (obj.project.length || obj.host) {
                item.used = 1;
            }
            //}
            arrs.push(obj);
        });
        return arrs;
    };
    IP.prototype._getRange = function () {
        var arrs = [];
        var _self = this;
        $(this.data.ips).each(function (i, item) {
            arrs.push(Number(_.getIpSufix(item.ip)));
        });
        return _.sortNum(arrs, true);
    };
    IP.prototype._getNewData = function (id) {
        var result = null;
        $(this.data.ips).each(function (i, item) {
            var ip = _.getIpSufix(item.ip);
            if (ip == id) {
                result = item;
            }
        });
        return result;
    };
    /**@protected 绘制*/
    IP.prototype.draw = function () {
        var _self = this;
        this.box.empty();
        this.container.empty();
        if (!this.isHideLengend) {
            this.box.append(this.legend);

            this.legend.find(".square_unselect .legend_text").text(_.getLocale(this.isOptimize ? "framework.component.ip.status.unuse.tip" : "framework.component.ip.status.unselect.tip"));
            this.legend.find(".square_selected .legend_text").text(_.getLocale(this.isOptimize ? "framework.component.ip.status.inuse.tip" : "framework.component.ip.status.selected.tip"));
            this.legend.find(".square_occupy_host .legend_text").text(_.getLocale("framework.component.ip.host.occpuy.tip"));
            this.legend.find(".square_occupy .legend_text").text(_.getLocale("framework.component.ip.tenant.occpuy.tip"));
            this.legend.find(".square_dhcp .legend_text_dhcp").text(_.getLocale("framework.component.ip.status.dhcp.tip") + "/");
            this.legend.find(".square_dhcp .legend_text_gateway").text(_.getLocale("framework.component.ip.status.gateway.tip"));
            //this.legend.find(".square_dhcp .legend_text_noedit").text("["+_.getLocale("framework.component.ip.status.cant.edit")+"]");
            this.legend.find(".square_dhcp_edit .legend_text").text(_.getLocale("framework.component.ip.status.dhcp.tip"));
            //legend_text_noedit
            //this.isOptimize?this.legend.find(".legend_count_p").show():this.legend.find(".legend_count_p").hide();
            //this.isEditDhcp ? this.legend.find(".square_dhcp_edit").show() : this.legend.find(".square_dhcp_edit").hide();
            //this.isEditDhcp ? this.legend.find(".square_dhcp .legend_text_dhcp").hide() : null;
        }
        this.box.append(this.container);
        this.start = this.data.cidr[0];
        this.end = this.data.cidr[1];
        this.select = this._getFormatSelect();
        this.range = this._getRange();
        if (this.isFilter) {
            $(this.range).each(function (i, il) {
                var _square = _self.square.clone();
                _square.text(il);
                _square.data("id", il);
                _square.data("newdata", _self._getNewData(il));
                _self.container.append(_square);
                _self.setSquareStatus(_square, "unselect");
                _self.squares.push(_square);
            });
        } else {
            for (var i = this.start; i <= this.end; i++) {
                var _square = this.square.clone();
                _square.text(i);
                _square.data("id", i);
                _square.data("newdata", this._getNewData(i));
                this.container.append(_square);
                _self.setSquareStatus(_square, "unselect");
                this.squares.push(_square);
            }
        }

        this.setSelection();
        this.refreshLegend();
    };
    IP.prototype.refreshLegend = function () {
        this.legend.find(".square_unselect .legend_count").text(this.getUnSelectedSquares().length);
        this.legend.find(".square_selected .legend_count").text(this.getSelectedSquare().length);
        this.legend.find(".square_occupy_host .legend_count").text(this.getHostOccupySquare().length);
        this.legend.find(".square_occupy .legend_count").text(this.getTenantOccupySquare().length);
        this.legend.find(".square_dhcp .legend_count").text(this.getGatewaySquare().length);
        this.legend.find(".square_dhcp_edit .legend_count").text(this.getDhcpSuqare().length);
    };
    /**根据色块获取色块value
     *@param {Object} square要获取的色块id
     */
    IP.prototype.getSquareData = function (square) {
        return square.data("id");
    };
    /**获取色块的附加数据，内部格式化后*/
    IP.prototype.getSquareAttach = function (square) {
        return square.data("attach");
    };
    /**获取色块的附加数据，*/
    IP.prototype.getSquareNewData = function (square) {
        return square.data("newdata");
    };
    /**
     * 设置色块状态
     * @param {Object} square 要设置状态的色块
     * @param {String} status 状态枚举包括:unselect(未选中),selected(选中),occupy(占用),dhcp(DHCP)
     * @param {Object} data 色块数据
     * */
    IP.prototype.setSquareStatus = function (square, status, data, isSet) {
        var _status = ["unselect", "selected", "occupy", "dhcp", "netgate"];

        function filter() {
            return $(_status).filter(function (index) {
                return _status[index] != status;
            })
        }

        var _tip = "";
        var _self = this;
        switch (status) {
            case "unselect": {
                /*if (_self.isFilter) {
                    _tip = _.getLocale("framework.component.ip.status.unuse.tip");
                } else {*/
                    _tip = _.getLocale("framework.component.ip.status.unselect.tip");
                //}

                break;
            }
            case "selected": {
                /*if (_self.isFilter) {
                    _tip = _.getLocale("framework.component.ip.status.inuse.tip");
                } else {*/
                    _tip = _.getLocale("framework.component.ip.status.selected.tip");
               // }
                break;
            }
            case "occupy": {
                _tip = _.getLocale("network.vlan.ip.project") + data.project;
                if (data.hasOwnProperty("host")) {
                    if(data.host=="emptyvm"){
                        _tip = _.getLocale("network.vlan.ip.project") + data.project + "&nbsp;&nbsp;&nbsp;&nbsp;" + _.getLocale("network.vlan.ip.host") + "&nbsp;&nbsp;&nbsp;&nbsp;";
                    }else{
                        _tip = _.getLocale("network.vlan.ip.project") + data.project + "&nbsp;&nbsp;&nbsp;&nbsp;" + _.getLocale("network.vlan.ip.host") + data.host;
                    }
                }
                break;
            }
            case "dhcp": {
                _tip = _.getLocale("framework.component.ip.status.dhcp.tip");
                break;
            }
            case "netgate": {
                _tip = _.getLocale("framework.component.ip.status.netgate");
                break;
            }
            default: {
                throw new Error(_.getLocale("framework.component.ip.status.unknow"));
            }
        }
        square.tooltip({content: _tip});
        square.addClass("ip_square_" + status);
        if (data && data.hasOwnProperty("host")) {
            square.addClass("ip_square_" + status + "_host");
        }
        if (isSet) {
            square.addClass("ip_square_" + status + "_set");
        } else {
            square.removeClass("ip_square_" + status + "_set");
        }
        square.data("status", status);
        square.data("attach", data);
        var _filters = filter();
        $(_filters).each(function (i, il) {
            square.removeClass("ip_square_" + il);
        });
        var arg = arguments;
        if (status == "dhcp") {
            square.removeClass("pointer");
            $(square.siblings()).each(function (i, il) {
                var _il = $(il);
                _il.removeClass("ip_square_dhcp_set");
                if (_il.hasClass("ip_square_dhcp")) {
                    arg.callee(_il, "selected");
                }
            });
        }
        if (status == "netgate") {
            square.removeClass("pointer");
            $(square.siblings()).each(function (i, il) {
                var _il = $(il);
                if (_il.hasClass("ip_square_netgate")) {
                    arg.callee(_il, "unselect");
                }
            });
        }
        if (status == "occupy") {
            square.removeClass("pointer");
        }
    };
    /**获取色块状态
     * @param {Object} square 要获取状态的square对象
     * */
    IP.prototype.getSquareStatus = function (square) {
        return square.data("status");
    };
    /**渲染ip组件*/
    IP.prototype.render = function () {
        this.init();
        this.draw();
    };
    /**更新ip组件
     * @param {Object}data 要更新的数据
     * */
    IP.prototype.update = function (data, config) {
        this.clear();
        return new IP(this.box, data, config);
    };
    /**
     * @protected 设置选区
     *
     * */
    IP.prototype.setSelection = function () {
        var _self = this;
        $(this.squares).each(function (i, square) {
            var _id = square.data("id");
            if (_self.keyInArray(_id, _self.range)) {
                var _newData = square.data("newdata");
                if (_newData.gateway) {
                    _self.setNetgate(_id, true);
                    return;
                }
                if (_newData.dhcp) {
                    _self._setDHCP(square);
                    return;
                }
                if (!_self.isFilter) {
                    _self.setSquareStatus(square, "selected");
                } else {
                    if (_newData.isSelf) {
                        _self.setSquareStatus(square, "selected");
                    }
                }
                if (_newData.used) {
                    _self.setOccupy(_id, square);
                }
            }
        })
    };
    IP.prototype._setDHCP = function (square) {
        if (this.hasDhcp)return;
        if (this.isNetgate(square))return;
        this.setDhcp(square, true);
        this.hasDhcp = true;
        this.refreshLegend();
    };
    /**获取dhcp所占的ip,ip是全地址
     * @return {String}*/
    IP.prototype.getDhcp = function () {
        var _self = this;
        var _square = null;
        $(this.getSelectSquares()).each(function (i, square) {
            if (_self.isDHCP(square)) {
                _square = square;
            }
        });
        if (_square) {
            return this.cidr.prefix + "." + this.getSquareData(_square);
        }
        return null;
    };
    /**获取ip范围数组,单个ip都是全地址
     * @return {Array}*/
    IP.prototype.getIps = function () {
        var arrs = [];
        var _self = this;
        $(this.getIpRange()).each(function (i, ip) {
            arrs.push(_self.cidr.prefix + "." + ip);
        });
        return arrs;
    };
    /**获取ip范围数组，除去dhcp,返回全地址*/
    IP.prototype.getIpsNoDhcp = function () {
        var arrs = [];
        var _self = this;
        $(this.getIpRangeNoDhcp()).each(function (i, ip) {
            arrs.push(_self.cidr.prefix + "." + ip);
        });
        return arrs;
    };
    /**获取单个ip的全地址
     * @return {String}*/
    IP.prototype.getIpBySquare = function (square) {
        return this.cidr.prefix + "." + this.getSquareData(square);
    };
    /**获取ip范围数组，只有selected状态的 全地址*/
    IP.prototype.getIpsJustSelected = function () {
        var _arrs = [];
        var _self = this;
        $(this.squares).each(function (i, square) {
            if (_self.isSelected(square)) {
                _arrs.push(_self.cidr.prefix + "." + _self.getSquareData(square));
            }
        });
        return _arrs;
    };
    /**
     * 键值是否包含在数组中
     * @param {String}key 要检测的键值
     * @param {Array} arrs 要检测的数组
     * */
    IP.prototype.keyInArray = function (key, arrs) {
        var _bool = false;
        if (!arrs)return false;
        for (var i = 0; i <= arrs.length - 1; i++) {
            if (key == arrs[i]) {
                _bool = true;
            }
        }
        return _bool;
    };
    /**设置色块被被占用
     *
     * @param {String} id 被占用的id
     * @param {Object} square 被占用的色块
     * */
    IP.prototype.setOccupy = function (id, square) {
        var _self = this;
        $(this.select).each(function (i, el) {
            if (el.id == id) {
                _self.setSquareStatus(square, "occupy", el);

            }
        });
    };
    /**
     * 设置是否为可编辑
     * @param {Boolean} bool 是否可编辑,非编辑状态下只可查看，不可操作
     * @return ef.components.ip
     * */
    IP.prototype.setMode = function (bool) {
        this.isEdit = bool;//isDisablePointDom
        var _self = this;
        if (bool) {
            this.container.find(".ip_square").each(function (i, square) {
                if (!_self.isDisablePointDom($(square))) {
                    $(square).addClass("pointer");
                }
            });
        } else {
            this.container.find(".ip_square").removeClass("po" +
                "er");
        }
        return this;
    };
    /**
     * 设置为dhcp
     * @param {Object} square 要设置为dhcp的square对象
     * @param {Boolean} bool 是否设置为为dhcp,如果为false将默认设置为unselect
     *
     * */
    IP.prototype.setDhcp = function (square, bool) {
        if (this.isNetgate(square))return;
        if (bool) {
            if (this.isEditDhcp) {
                //this.setSquareStatus(square, "dhcp", null, true);
            } else {
                this.setSquareStatus(square, "dhcp");
            }
            this.hasDhcp = true;
        } else {
            this.setSquareStatus(square, "selected");
        }
    };
    /**
     * 设置网关
     * @param {Number} num 要设置的网关值
     * @param {Boolean} bool 是否要设置为网关，false则取消网关，设置为未选中
     *
     * */
    IP.prototype.setNetgate = function (num, bool) {
        var _self = this;
        var _finder = _.find(this.squares, function (item) {
            return _self.isNetgate(item);
        });
        if (_finder) {
            _self.setSquareStatus(_finder, "unselect");
        }
        $(this.squares).each(function (i, square) {
            var _data = _self.getSquareData(square);
            if (_data == num) {
                if (bool) {

                    _self.setSquareStatus(square, "netgate");
                    _self.hasNetgate = true;
                    _self.refreshLegend();
                } else {
                    _self.setSquareStatus(square, "unselect");
                    _self.hasNetgate = false;
                }

            }
        });

    };
    /**
     * @readonly 是否已经被选中（全），如果包括selected,occupy,dhcp,netgate则认为被选中，否则为为未选中
     * */
    IP.prototype.isSelect = function (square) {
        var _status = this.getSquareStatus(square);
        return (_status == "selected") || (_status == "occupy") || (_status == "dhcp");
    };
    /**@readonly 是否是dhcp*/
    IP.prototype.isDHCP = function (square) {
        var _status = this.getSquareStatus(square);
        return _status == "dhcp";
    };
    /**@readonly是否是网关*/
    IP.prototype.isNetgate = function (square) {
        var _status = this.getSquareStatus(square);
        return _status == "netgate";
    };
    /**@readonly 是否被占用*/
    IP.prototype.isOccupy = function (square) {
        var _status = this.getSquareStatus(square);
        return _status == "occupy";
    };
    /**@readonly 是否被主机占用*/
    IP.prototype.isHostOccupy = function (square) {
        var _data = square.data("newdata");
        return this.isOccupy(square) && _data.vm;
    };
    /**@readonly 是否被项目占用*/
    IP.prototype.isTenantOccupy = function (square) {
        var _data = square.data("newdata");
        return this.isOccupy(square) && !_data.vm;
    };
    /**@readonly是否被选中(独),只包含被选中的状态selected,不包含其它*/
    IP.prototype.isSelected = function (square) {
        var _status = this.getSquareStatus(square);
        return _status == "selected";
    };
    /**@readonly 是否是未占用或未分配*/
    IP.prototype.isUnselect = function (square) {
        var _status = this.getSquareStatus(square);
        return _status == "unselect";
    };
    IP.prototype.isDisablePointDom = function (square) {
        var _prefix = "ip_square_";
        return square.hasClass(_prefix + "netgate") || square.hasClass(_prefix + "dhcp") || square.hasClass(_prefix + "occupy");
    };
    /**
     * 获取ip范围的数组
     * @return {Array} 所有的ip范围集合
     * */
    IP.prototype.getIpRange = function () {
        var _arrs = [];
        var _self = this;
        $(this.squares).each(function (i, square) {
            if (_self.isSelect(square)) {
                _arrs.push(_self.getSquareData(square));
            }
        });
        return _arrs;
    };
    /**
     * 获取ip范围的数组,除去dhcp
     * @return {Array} 所有的ip范围集合
     * */
    IP.prototype.getIpRangeNoDhcp = function () {
        var _arrs = [];
        var _self = this;
        $(this.squares).each(function (i, square) {
            if (_self.isSelect(square) && !_self.isDHCP(square)) {
                _arrs.push(_self.getSquareData(square));
            }
        });
        return _arrs;
    };
    /**获取ip范围数组，只有selected状态的 全地址*/
    IP.prototype.getIpRangeJustSelected = function () {
        var _arrs = [];
        var _self = this;
        $(this.squares).each(function (i, square) {
            if (_self.isSelected(square)) {
                _arrs.push(_self.getSquareData(square));
            }
        });
        return _arrs;
    };
    /**获取所有选中色块数组，包括状态有:selected,occupy,dhcp,netgate*/
    IP.prototype.getSelectSquares = function () {
        var _arrs = [];
        var _self = this;
        $(this.squares).each(function (i, square) {
            if (_self.isSelect(square)) {
                _arrs.push(square);
            }
        });
        return _arrs;
    };
    /**获取所有未分配或未使用的色块数组 包含状态:unselect*/
    IP.prototype.getUnSelectedSquares = function () {
        var _arrs = [];
        var _self = this;
        $(this.squares).each(function (i, square) {
            if (_self.isUnselect(square)) {
                _arrs.push(square);
            }
        });
        return _arrs;
    };
    /**获取所有已分配或已使用色块数组，包含状态:selected*/
    IP.prototype.getSelectedSquare = function () {
        var _arrs = [];
        var _self = this;
        $(this.squares).each(function (i, square) {
            if (_self.isSelected(square)) {
                _arrs.push(square);
            }
        });
        return _arrs;
    };
    /**获取所有主机占用的色块数组，包含状态:occupy并且host属性不为空*/
    IP.prototype.getHostOccupySquare = function () {
        var _arrs = [];
        var _self = this;
        $(this.squares).each(function (i, square) {
            if (_self.isHostOccupy(square)) {
                _arrs.push(square);
            }
        });
        return _arrs;
    };
    /**获取所有项目占用色块数组，包含状态:occupy并且project属性不为空*/
    IP.prototype.getTenantOccupySquare = function () {
        var _arrs = [];
        var _self = this;
        $(this.squares).each(function (i, square) {
            if (_self.isTenantOccupy(square)) {
                _arrs.push(square);
            }
        });
        return _arrs;
    };
    /**获取紧紧是dhcp的色块数组*/
    IP.prototype.getDhcpSuqare = function () {
        var _arrs = [];
        var _self = this;
        $(this.squares).each(function (i, square) {
            if (_self.isDHCP(square)) {
                _arrs.push(square);
            }
        });
        return _arrs;
    };
    /**获取仅仅是网关的色块数组*/
    IP.prototype.getGatewaySquare = function () {
        var _arrs = [];
        var _self = this;
        $(this.squares).each(function (i, square) {
            if (_self.isNetgate(square)) {
                _arrs.push(square);
            }
        });
        return _arrs;
    };
    /**获取预选的色块数组*/
    IP.prototype.getPreSelectSquares = function () {
        var arrs = [];
        $(this.squares).each(function (i, square) {
            if (square.hasClass("ip_square_circle")) {
                arrs.push(square);
            }
        });
        return arrs;
    };
    ef.register(IP, "ip");
    return IP;
});
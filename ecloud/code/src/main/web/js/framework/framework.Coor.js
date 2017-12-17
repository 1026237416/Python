/**
 * Created by wangahui1 on 16/4/20.
 */
define("framework.coor",["exports","framework.core"],function(exports,ef){
    /**
     * #Coor坐标对象#
     * # 描述 #
     * 坐标对象提供图片的内部icon坐标位置,用于识别通用css sprite的图片位置，帮助用户使用css Sprite。支持右键操作
     * @class Coor
     * @param {String|Array} box 要显示图片的dom容器
     * @param {String} imgSrc 图片的地址
     *
     * */

    function Coor(box, imgSrc) {
        /**坐标的x轴*/
        this.x = 0;
        /**坐标的y轴*/
        this.y = 0;
        /**@readonly 图片的地址*/
        this.source = imgSrc;
        /**显示图片的dom容器*/
        this.box = $(box);
        this._img = null;
        this.width = 0;
        this.height = 0;
        this._isDrag = false;
        this._startX = -1;
        this._startY = -1;
        this.container = $('<div class="ef-coor-container" unselectable="on">' +
            '<canvas class="ef-coor-basement"></canvas>' +
            '<canvas class="ef-coor-dash"></canvas>' +
            '<canvas class="ef-coor-hover"></canvas>' +
            '</div>');
        this.init();
        this.addListener();
        return this;
    }
    /**@readonly 增加事件侦听*/
    Coor.prototype.addListener = function () {
        var _self = this;
        this.hoverLayer.mousemove(function (event) {
            var _tip = _self.container.tooltip("tip");
            _tip.show();
            if (_self._isDrag) {
                _self.drawRect(event.offsetX - _self._startX, event.offsetY - _self._startY);
                _self.dash.width = Math.abs(event.offsetX - _self._startX);
                _self.dash.height = Math.abs(event.offsetY - _self._startY);
            }
            _tip.css(
                {
                    left: event.pageX - _tip.width() / 2,
                    top: event.pageY - 80
                });
            _tip.find(".tooltip-content").html("x: " + (event.offsetX == 0 ? 0 : -Math.abs(event.offsetX)) + " " + "y: " + (event.offsetY == 0 ? 0 : -Math.abs(event.offsetY)) + "<div>w: " + _self.dash.width + " h: " + _self.dash.height + "</div>");
        });
        this.hoverLayer.mouseout(function () {
            var _tip = _self.container.tooltip("tip");
            _tip.hide();
            _self._isDrag = false;
            _self._startX = -1;
            _self._startY = -1;
        });
        this.hoverLayer.mousedown(function (event) {
            _self._isDrag = true;
            _self._startX = event.offsetX;
            _self._startY = event.offsetY;
            if (event.which == 3) {
                _self.container.smartMenu([[
                    {
                        text: "取消选区",
                        func: function () {
                            _self.clear();
                        }
                    },
                    {
                        text: "背景黑色",
                        func: function () {
                            _self.container.removeClass("c_black").removeClass("c_white").removeClass("c_transparent");
                            _self.container.addClass("c_black");
                        }
                    },
                    {
                        text: "背景白色",
                        func: function () {
                            _self.container.removeClass("c_black").removeClass("c_white").removeClass("c_transparent");
                            _self.container.addClass("c_white");
                        }
                    },
                    {
                        text: "背景透明",
                        func: function () {
                            _self.container.removeClass("c_black").removeClass("c_white").removeClass("c_transparent");
                            _self.container.addClass("c_transparent");
                        }
                    }
                ]]);
                return false;
            }
        });
        this.hoverLayer.mouseup(function (event) {
            _self._isDrag = false;
            _self._startX = -1;
            _self._startY = -1;
        });

    };
    Coor.prototype.drawRect = function (w, h) {
        this.clear();
        this.dashContext.strokeStyle = "#f27f37";
        this.dashContext.lineWidth = 2;
        this.dashContext.dashStorkeRect(this._startX, this._startY, w, h, 1);
    };
    /**清除矩形框*/
    Coor.prototype.clear = function () {
        this.dash.x = 0;
        this.dash.y = 0;
        this.dash.width = 0;
        this.dash.height = 0;
        this.dashContext.clearRect(0, 0, this.width, this.height);
    };
    /**@readonly 初始化*/
    Coor.prototype.init = function () {
        this.dash = new this.Dash();
        var _self = this;
        this.basementLayer = this.container.find(".ef-coor-basement");
        this.basementContext = this.basementLayer[0].getContext("2d");
        this.hoverLayer = this.container.find(".ef-coor-hover");
        this.hoverContext = this.basementLayer[0].getContext("2d");
        this.dashLayer = this.container.find(".ef-coor-dash");
        this.dashContext = this.dashLayer[0].getContext("2d");
        if (!_.isClass(this.basementContext, CanvasRenderingContext2D)) {
            throw new Error(_.getLocale("framework.component.ip.error.no2d.tip"));
            return;
        }
        this.box.empty();
        this.box.append(this.container);
        this.container.tooltip({content: "test", position: "top"});
        this._img = new Image();
        this._img.src = this.source;
        this._img.onload = function () {
            _self.width = this.width;
            _self.height = this.height;
            _self.resize();
            _self.render(this);
            _self.addListener();
        };
        this._img.onerror = function () {
            throw new Error(_.getLocale("framework.component.coor.error.img.tip") + "[" + this.src + "]");
        };
    };
    Coor.prototype.resize = function () {
        this.container.width(this.width);
        this.container.height(this.height);
        this.container.find("canvas").attr("width", this.width);
        this.container.find("canvas").attr("height", this.height);
    };
    /**@protected 渲染图片*/
    Coor.prototype.render = function (img) {
        this.basementContext.drawImage(img, 0, 0);
    };
    /**
     * 坐标对象中的每一个虚框对象，内部类
     * {@img dash.png Dash组件}
     * @class Coor.Step
     *
     * */
    Coor.prototype.Dash = function () {
        /**坐标的起始点x轴*/
        this.x = 0;
        /**坐标的起始点y轴*/
        this.y = 0;
        /**虚框的宽度*/
        this.width = 0;
        /**虚框的高度*/
        this.height = 0;
    };
    ef.register(Coor,"Coor");
    return Coor;
});
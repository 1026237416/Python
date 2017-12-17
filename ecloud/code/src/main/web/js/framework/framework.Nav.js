/**
 * Created by wangahui1 on 16/4/20.
 */
define("framework.nav",["exports","framework.core","user"],function(exports,ef,user)
{
    /**
     * #主导航组件#
     *
     * {@img nav.png 主导航组件}
     *
     * # 描述 #
     * 主导航组件为最大深度为二级的导航，类似于According组件（如果属性expandAll=true则不同于According组件）。
     *
     * **使用范例**：
     *
     *     @example
     *
     *
     *     $(dom).nav([
     *      {
         *          "src":"dashboard.html",//点击导航链接跳转地址（Ajax加载）
         *          //"icon":"theme/default/images/home.png",//要显示的图标地址,建议使用下面的iconClass
         *          "iconClass":"nav-icon-home",//要显示的图标css,推荐使用此，而不建议用icon,因为统一使用css Sprite
         *          "id":"dashboard",//menu的唯一标识id,此id用于命名要加载的module名称，在config中配置的模块要和此名称相同，(点击跳转时候自动会加载此module)详见config.js
         *          "access":[8]//该menu的权限，具体参见user及role
         *        },
     *        {
         *          "icon":"theme/default/images/Calculation.png",
         *          "iconClass":"nav-icon-cal",
         *          "id":"cal",
         *          "access":[8,9,10,11],
         *          "children":[//子菜单数组
         *            {
         *              "src":"host.html",
         *              "id":"cal.host",
         *              "access":[8,9,10,11]
         *            }
         *          ]
         *        }],function(id)//菜单转换的change事件的回调函数
     *      {
         *
         *      });
     *
     * @class ef.components.nav
     * @return ef.components.nav
     * */
    function Nav(box, data, change, prechange,limit) {
        this.box = box;
        this.box.empty();
        /**组件生成的主dom容器*/
        this.container = $('<ul class="nav"></ul>');
        /**@readonly 一级菜单dom容器*/
        this.lev0Box = $('<li class="lev0-box"></li>');
        this.lev0 = $('<div class="lev0"></div>');
        /**@readonly 二级菜单dom容器*/
        this.lev1Box = $('<ul class="lev1-box"></ul>');
        this.lev1 = $('<li class="lev1"></li>');
        this.lev0Icon = $('<div class="nav-icon"><img class="hide"><i /></div>');
        this.lev0Text = $('<div class="nav-text"></div>');
        this.lev0Right=$('<div class="nav-right-icon"><a  class="textbox-icon combo-arrow textbox-icon-disabled" icon-index="0" tabindex="-1" style="min-width: 18px; height: 52px;"></a></div>');
        this.a = $('<a></a>');
        this.data = data;
        /**是否全部展开菜单的所有子菜单，如果true则不同于传统的According组件*/
        this.expandAll = false;
        /**@readonly 展开的最小限制*/
        this.expandLimit = 3;
        this.box.append(this.container);
        this.super = false;
        /**当前用户角色类型*/
        this.roleType = !limit?user.getRole().value:null;
        this.super = user.isSuper();
        this.default = user.getRole().default;
        this.changeCallback = change ? change : $.noop;
        this.prechangeCallback = prechange ? prechange : $.noop;
        this.lastId = null;
        /**子页面默认加载的目录*/
        this.dir = "views/";
        this.init();
        this.draw();
        this.addListener();
        ef.nav = this;
        return this;
    }
    Nav.isDom=true;
    Nav.prototype.Current=function()
    {
        this.id="";
        this.src="";
        this.data=null;
        this.fn=null;
    };
    Nav.prototype.init=function()
    {
        this.current=new this.Current();
    };
    /**@event change
     * 导航跳转事件
     * @param {Function} callback 侦听事件的回调函数
     * 回调函数的参数默认返回要跳转的id
     * */
    Nav.prototype.change = function (callback) {
        this.changeCallback = callback;
    };
    /**获取完整跳转url,一般目录位于views文件夹下*/
    Nav.prototype.getUrl = function (url) {
        return this.dir + url;
    };
    /**
     * 跳转链接（Ajax跳转）
     * @param {String} url 打开链接
     * @param {String} selectedId 默认要打开的模块名称(config.json中已配置)
     * @param {Object} data 附带数据
     * @param {Function} fn 回调函数
     * @param {String} oldId 打开链接时候默认让左边导航选中的模块名。
     * @return {void}
     * */
    Nav.prototype.goto = function (url, selectedId, data, fn, oldId) {
        fn = fn ? fn : $.noop;
        if (arguments.length > 1) {
            this.setSelected(selectedId);
        }
        if (oldId) {
            this.setSelected(oldId);
        }
        if (url) {
            this.load(url, selectedId, fn, data);
        }
    };
    /**销毁临时数据*/
    Nav.prototype._revokeData = function () {
        var _dataContainer = $(".right-entity").find("._temp_data_cont___");
        _dataContainer.removeData("pageData");
        _dataContainer.removeData("pageId");
        _dataContainer.remove();
        $(".right-entity").empty();
    };
    /**注入临时数据*/
    Nav.prototype._injectData = function (id, data) {
        var _dataContainer = $('<div class="hide _temp_data_cont___"></div>');
        _dataContainer.data("pageData", data);
        _dataContainer.data("pageId", id);
        $(".right-entity").append(_dataContainer);
    };
    /**设置某个menu为选中状态
     * @param {String} id 要设置的menu的id
     * */
    Nav.prototype.setSelected = function (id) {
        if (!id)return;
        this.container.find(".lev0,.lev1").each(function (i, el) {
            if ($(this).attr("id") == id) {
                //$(this).click();
                $(this).addClass("current");
                var _parent = $(this).parent();
                if (_parent.hasClass("lev1-box") && !_parent.is(":visible")) {
                    _parent.siblings().click();
                }
            } else {
                if ($(this).hasClass("current")) {
                    $(this).removeClass("current").removeClass("selected").removeClass("hovered");
                }
            }
        });
    };
    Nav.prototype.getItemById=function(id)
    {
        var item=null;
        $(this.data).each(function(i,il)
        {
            if(il.id==id)
            {
                item=il;
                return;
            }
            if(il.children)
            {
                $(il.children).each(function(j,jl)
                {
                    if(jl.id==id)
                    {
                        item=jl;
                    }
                })
            }
        });
        return item;
    };
    /**重新加载页面*/
    Nav.prototype.reload=function(isHideLoading)
    {
        this.load(this.current.src,this.current.id,this.current.fn,this.current.data,isHideLoading);
    };
    /**根据src加载对应视图
     * @param {String} src 要加载的视图的地址
     * @param {Object} id 加载src所属的menu的id(标识)值
     * @param {Function} fn 加载完成的回调执行函数
     * @param {Object} data 加载所携带的数据
     * */
    Nav.prototype.load = function (src, id, fn, data,isHideLoading) {
        this.current.id=id;
        this.current.src=src;
        this.current.data=data;
        this.current.fn=fn;
        var _self = this;
        fn = fn ? fn : $.noop;
        if(!isHideLoading)
        {
            ef.loading.show();
        }
        this._revokeData();
        src = this.getUrl(src);
        if (id) {
            src = src + "?id=" + id;
        }
        _self.prechangeCallback(id, _self.lastId);
        $(".right-entity").removeClass("no-scroll-y");
        var currentItem=this.getItemById(id);
        if(currentItem&&currentItem.iframe)
        {
            var iframe=$('<iframe class="nav-iframe" width="100%" height="100%" frameboard="0"></iframe>');
            iframe.attr("src",_.url(src));
            $(".right-entity").html(iframe);
            $(".right-entity").addClass("no-scroll-y");
            ef.loading.hide();
            var _dataContainer = $(this).find("._temp_data_cont___");
            if (_dataContainer.length) {
                _self._revokeData();
            }
            _self.lastId = id;
            if (fn) {
                fn(data);
            }
            return;
        }
        $(".right-entity").load(src, null, function () {
            _self.changeCallback(id, _self.lastId);
            _self.lastId = id;
            var _dataContainer = $(this).find("._temp_data_cont___");
            if (_dataContainer.length) {
                _self._revokeData();
            }
            _self._injectData(id, data);
            setTimeout(function () {
                ef.loading.hide();
            }, 200);
            if (fn) {
                fn(data);
            }
        });
    };
    /**侦听事件*/
    Nav.prototype.addListener = function () {
        var _self = this;
        this.container.find(".lev0").hover(function () {
            if ($(this).hasClass("current") || $(this).parent().hasClass("not-allowed")) {
                return false;
            }
            $(this).addClass("hovered");
            _self.container.find(".lev0").not($(this)).removeClass("hovered");
            if($(this).parent().hasClass("nav-popup"))
            {
                $(this).parent().find(".lev1-box").show();
            }
        }, function (event) {
            if ($(this).hasClass("current")) {
                return;
            }
            $(this).removeClass("hovered");
            if($(this).parent().hasClass("nav-popup"))
            {
                var parents=$($(event.toElement).parents(".nav-popup"));
                if(!parents||!parents.contains(this))
                $(this).parent().find(".lev1-box").hide();
            }
        });
        this.container.find(".lev0").click(function () {
            if ($(this).parent().hasClass("not-allowed"))return false;
            if ($(this).attr("src")) {
                _self.load($(this).attr("src"), $(this).attr("id"));

            }
            var hasSub = $(this).next().length;
            if (!hasSub) {
                $(this).addClass("current");
                $(this).parent().siblings().find("li").removeClass("current");
                _self.container.find(".lev0").not($(this)).removeClass("current").removeClass("selected");
            }

            $(this).parent().siblings().find("li").removeClass("selected").removeClass("hovered");
            if (_self.expandAll) {
                return;
            }
            $(this).addClass("selected");
            _self.container.find("ul").each(function()
            {
                if(!$(this).parent().hasClass("nav-popup"))
                {
                    $(this).slideUp();
                }
            });
            _self.container.find("ul").not("selected").find("li").removeClass("selected").removeClass("hovered");
            $(this).parent().siblings().find(".lev0").removeClass("selected");
            if($(this).parent().hasClass("nav-popup"))return;
            if ($(this).siblings().is(":visible")) {
                $(this).siblings().slideUp("normal", function () {
                    $(this).siblings().removeClass("selected");
                });

            } else {
                $(this).siblings().slideDown();
            }
        });

        this.container.find("ul li").hover(function () {
            if ($(this).hasClass("selected") || $(this).hasClass("not-allowed")) {
                return false;
            }
            $(this).addClass("hovered");
            _self.container.find("ul li").not($(this)).removeClass("hoverd");
        }, function () {
            if ($(this).hasClass("selected")) {
                return;
            }
            $(this).removeClass("hovered");
        });
        this.container.find(".lev1-box").hover(function(event)
        {

        },function(event)
        {
            if(!$(this).parent().hasClass("nav-popup"))return;
            if(!$(event.toElement).parents(".nav-popup").length)
                $(this).hide();
        });
        this.container.find("ul li").click(function () {
            if ($(this).hasClass("not-allowed"))return false;
            if ($(this).attr("src")) {
                _self.load($(this).attr("src"), $(this).attr("id"));
                $(this).addClass("selected");
                $(this).addClass("current");
                _self.container.find(".lev0").removeClass("current").removeClass("selected");
                _self.container.find("ul li").not($(this)).removeClass("selected").removeClass("hovered").removeClass("current");
            }
            $(this).parent().siblings().addClass("selected");
            _self.container.find("ul.lev1-box").each(function()
            {
                if(!$(this).siblings().hasClass("selected"))
                {
                    $(this).slideUp();
                }
            })
        });
        this.container.mousewheel(function (event) {
            var h1 = _self.box.height()-_self.box.prev().height();
            var h2 = $(this).height();
            var distance = h2 - h1;
            if (h2 > h1) {
                var top = $(this).css("top");
                top = Number(top.replace("px", ""));
                top -= -event.deltaY * event.deltaFactor;
                top = top < -distance ? -distance : top;
                top = top > 0 ? 0 : top;
                top = Math.floor(top);
                $(this).css({"top": top});
            } else {
                $(this).css({"top": 0});
            }
            $(this).find(".lev0-box").each(function()
            {
                if($(this).hasClass("nav-popup"))
                {
                    $(this).find(".lev1-box").hide();
                }
            });
        });
        this.box.resize(function () {
            _self.container.css({"top": 0});
        });
    };
    /**获取所有有权限的菜单的总个数*/
    Nav.prototype.getExpandLen = function () {
        var _num = 0;
        var _self = this;
        $(this.data).each(function (i, el) {
            if (_.noRight(_self.roleType, el.access, _self.super)) {
                return;
            }
            if (el.children) {
                $(el.children).each(function (j, jl) {
                    if (_.noRight(_self.roleType, jl.access, _self.super)) {
                        return;
                    }
                    _num++;

                })
            }
            _num++;
        });
        return Infinity;
    };
    /**渲染菜单*/
    Nav.prototype.draw = function () {
        if (!this.data || !this.data.length) {
            return;
        }
        var _self = this;
        var _selected = null;
        this.expandAll = this.getExpandLen() < this.expandLimit;
        $(this.data).each(function (i, il) {
            //level 0 menu
            var _lev0Box = _self.lev0Box.clone();
            var _lev0 = _self.lev0.clone();
            var _lev0Icon = _self.lev0Icon.clone();
            var _lev0Text = _self.lev0Text.clone();
            var _lev1Box = _self.lev1Box.clone();
            var _lev0Right=_self.lev0Right.clone();
            if(il.isPopup)
            {
                //_lev0Icon.
                _lev0Box.addClass("nav-popup");
            }
            if (_selected && _selected.lev0) {
                if (_selected.lev0 == il.id) {
                    il.selected = true;
                }
            }
            if (_self.roleType) {
                if (il.id == _self.default) {
                    il.selected = true;
                }
            }
            if (il.src) {
                _lev0.attr("src", il.src);
            }
            if(il.iframe)
            {
                _lev0.attr("iframe",true);
            }
            if (il.selected) {
                _lev0.addClass("selected");
                if(!_lev0Box.hasClass("nav-popup"))
                {
                    _lev1Box.css({"display": "block"});
                }
                if (!il.children) {
                    _lev0.addClass("current");
                }
                if (il.src) {
                    _self.load(il.src, il.id);
                }
            }
            _lev0.attr("id", il.id);

            _self.container.append(_lev0Box);
            _lev0Box.append(_lev0);
            if (il.href) {
                var _levHref = _self.a.clone();
                _levHref.attr("href", il.href);
                _lev0.wrap(_levHref);
            }
            if (il.iconClass) {
                _lev0Icon.find("img").remove();
                _lev0Icon.find("i").addClass(il.iconClass);
            } else {
                _lev0Icon.find("img").show();
                _lev0Icon.find("img").attr("src", il.icon);
                _lev0Icon.find("i").remove();
            }


            _lev0Text.text(_.getLocale("framework.component.nav." + il.id + ".label"));
            _lev0.append(_lev0Text);
            _lev0.append(_lev0Icon);
            _lev0.append(_lev0Right);
            _lev0Box.append(_lev1Box);
            _lev0Box.hide();
            if (il.invisible && !_self.super) {
                _lev0Box.remove();
                return;
            }
            if (il.access && !_self.super) {
                if (_.noRight(_self.roleType, il.access, _self.super)) {
                    _lev0Box.remove();
                    return;
                }
            }
            _lev0Box.animate({
                height: 'toggle', opacity: 'toggle'
            }, "slow");
            if (!il.children || !il.children.length) {
                _lev1Box.remove();
                if (!il.src) {
                    _lev0Box.addClass("not-allowed");
                }

                return;
            }
            if (_self.expandAll) {
                _lev1Box.show();
            }
            $(il.children).each(function (j, jl) {
                if (jl.invisible && !_self.super) {

                } else {
                    if (_.noRight(_self.roleType, jl.access, _self.super)) {
                        return;
                    }
                    var _lev1 = _self.lev1.clone();

                    _lev1.text(_.getLocale("framework.component.nav." + jl.id + ".label"));
                    _lev1Box.append(_lev1);
                    if (jl.href) {
                        var _lev1Href = _self.a.clone();
                        _lev1Href.attr("href", jl.href);
                        _lev1.wrap(_lev1Href);
                    }
                    if (_selected && _selected.lev1) {
                        if (_selected.lev1 == jl.id) {
                            jl.selected = true;
                        }
                    }
                    if (_self.roleType) {
                        if (jl.id == _self.default) {
                            jl.selected = true;
                        }
                    }
                    if (jl.src) {
                        _lev1.attr("src", jl.src);
                    } else {
                        _lev1.addClass("not-allowed");
                    }
                    if(jl.iframe)
                    {
                        _lev1.attr("iframe",true);
                    }
                    if (jl.selected) {
                        _lev1.addClass("current");
                        _lev0.addClass("selected");
                        _lev1Box.show();
                        if (jl.src) {
                            _self.load(jl.src, jl.id);
                        }
                    }
                    _lev1.attr("id", jl.id);

                }
            });
        });
    };
    ef.register(Nav,"nav");
    return Nav;
});
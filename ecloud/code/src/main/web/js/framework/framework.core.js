/**
 * # 描述
 * core
 * ef是Easted Framework框架的缩写实例,使用单例模式,通过ef对象获取本实例
 *     ef对象如下:
 *
 * @author ahui.wang
 * @requires jQuery
 * @singleton
 *
 * {@img ef.png ef框架对象示例}
 *
 * @requires user
 * @requires underscore
 * @requires easyui
 * @requires components.css
 *
 * 具体包括:
 *
 *      模块实现的统一接口 {ef.Interface}  ##后续开发的模块必需继承此类!##
 *
 *      公用组件: {ef.components}        //新开发的公用组件全部再次,并扩展自$.fn
 *
 *      工具类: {ef.util}                //工具类集合,继承自underscore(_),并有很多扩展
 *
 *      重构AJAX: {ef.getJSON}
 *
 *      状态存储对象: {ef.status}
 *
 *      格式化存储对象: {ef.formatter}
 *
 *      全局配置存储对象: {ef.config}
 *
 *      回调函数存储对象: {ef.fn}
 *
 *      本地存储对象: {ef.localStorage}
 *
 *      注册组件方法: {ef.register}
 *
 * **使用范例**：
 *
 *     @example
 *     ef.[property|method];
 *
 * @class ef
 */
;
"Easted Framework Define"*function (root) {
    Object.freeze=Object.freeze||function(obj)
        {
            return obj;
        };
    return Object.freeze(root["ef"] ? root["ef"] : define("framework.core", ["user", "framework.util", "module", "exports", "signature"], function (user, _, module, exports, signature) {
        root["ef"] = this;
        /**版本号
         * @type {String}
         * @member ef
         * */
        this.version = "20.15.0.1";
        /**框架名称
         * @member ef
         * */
        this.name = "ef";
        /**
         * @member ef
         * 已开发的公用组件
         * 包含公用组件有:
         *
         * 步调按钮组: {@link ef.components.buttonstep}
         *
         * 导航容器: {@link ef.components.viewstack}
         *
         * 图标菜单组: {@link ef.components.iconmenu}
         *
         * 图标步骤组: {@link ef.components.iconstep}
         *
         * 自增数字组件: {@link ef.components.incrementNum}
         *
         * 主导航组件: {@link ef.components.nav}
         *
         * 拓扑: {@link ef.components.topo}
         *
         * */
        this.components = {
            name: "component"
        };
        /**
         * #格式化存储对象#
         * # 描述 #
         * 存储所有格式化函数的对象，存储时候请按照命名规则命名，防止同名覆盖
         *
         * **使用范例**：
         *
         *     @example
         *
         *     //[html代码]
         *     <table>
         *         <tr><th field="id" formatter='ef.formatter["cal.host.idFormatter"]'></th></tr>
         *     </table>
         *     //[javascript代码]
         *     ef.formatter["cal.host.idFormatter"]=function(){};
         *
         * @class ef.formatter
         * {@link ef.formatter}
         * */
        this.formatter =
        {
            /**@member ef.formatter 格式化名称*/
            name: "formatter"
        };
        this.alert=
        {
            warning: _.getLocale("global.messager.Warning.tip")
        };
        /**
         * #所有回调函数的存储对象#
         * # 描述 #
         * 回调函数对象用于存储各种回调的需要的公用函数,和格式化formatter处理方法类似，请按照命名规则命名
         * @class ef.fn
         */
        this.fn =
        {
            /**@member ef.fn fn默认名称*/
            name: "functions"
        };
        this.code=
        {
            "authFailed":401//验证失败code
        };
        this.msg=
        {
            "authFailed":"error.identify.auth.failed",//验证失败
            "sessionOut":"error.ecloud.dialogue.timeout"//会话超时
        };
        this.logTable=function(datas,url,isLocal)
        {
            if(this.config.isDebug&&console.table)
            {
                console.info(isLocal?"[获取的本地数据如下]:":"[服务数据如下:]",url);
                return console.table(datas);
            }else
            {

            }
        };
        this.setting=function()
        {
            if(!this.config.isDebug)
            {
                root.console=root.console||{};
                for(var i in root.console)
                {
                    root.console[i]= $.noop;
                }
            }
        };

        this.i18n=
        {
            parse:function(dom)
            {
                var $dom=null;
                if(dom)
                {
                    $dom=$(dom).find("[i18n]");
                }else
                {
                    $dom=$("[i18n]");
                }
                $dom.each(function()
                {
                    var key=$(this).attr("i18n");
                    if(!key)return;
                    var reg=/(.+)=(.+)/;
                    var result=key.match(reg);
                    var eq=/=/g;
                    var eqResult=key.match(eq);
                    if(result&&result.length==3&&eqResult&&eqResult.length==1)
                    {
                        $(this).attr(result[1], _.getLocale(result[2]));
                        $(this).removeAttr("i18n");
                        return;
                    }
                    $(this).text(_.getLocale(key));
                    $(this).removeAttr("i18n");
                });
            }
        };
        /**
         * @class ef.util
         * #util工具类#
         * # 描述 #
         * 工具类,继承自Underscore,具有underscore所有方法,并扩展了一些属性和方法
         *
         * */
        this.util = _;
        /**
         * @class ef.server
         * 服务模块
         *
         * */
        this.server={};
        /**
         * 销毁ef
         * @member ef
         * */
        this.destroy = function () {
            require.undef(module.id);
        };
        /**
         * 获取所有的表格的渲染器集合
         * @member ef
         * @return {Array}
         * */
        this.getFormatters = function () {
            var arrs = [];
            for (var i in this.formatter) {
                arrs.push(i);
            }
            return arrs;
        };
        /**
         * 获取所有回调函数集合
         * @member ef
         * @return {Array}
         * */
        this.getFns = function () {
            var arrs = [];
            for (var i in this.fn) {
                arrs.push(i);
            }
            return arrs;
        };
        this.init=function()
        {

        };
        /**
         * #状态对象#
         * # 描述 #
         * 状态对象用于存储用户登陆状态，比如是否登陆中，是否已登陆等
         * @class ef.status
         * */
        this.status = {
            /**是否登陆中 @member ef.status*/
            logining: false,
            /**是否已经登录，如果登录则此属性为true @member ef.status*/
            logined: false
        };
        /**
         * #全局配置对象#
         * # 描述 #
         * 全局配置对象用来存储全局访问服务设置（是否要进行ajax拦截），访问服务API的地址和端口等
         * @class ef.config
         * */
        this.config = {
            /** @member ef.config 是否是访问服务加载数据,如果是false则加载本地json文件，并通过Mock拦截ajax访问地址*/
            isServer: true,
            /**@member ef.config 访问服务的IP和端口*/
            webroot:"/",
            token: "",
            isTimeout:false,//是否设置网络请求超时
            isDebug:false//是否为测试状态，如果不是，则屏蔽控制台不输出
        };
        /**子类继承父类
         * @class ef.inherit
         */
        this.inherit=function(Child, Parent) {
            var F = function(){};
            F.prototype = Parent.prototype;
            Child.prototype = new F();
            Child.prototype.constructor = Child;
        };
        /**
         * #统一对外获取数据接口#
         * # 描述 #
         * ef.getJSON方法默认封装了请求restful的方法,并在request的header中设置了返回json及Token.
         * 其它类型的请求:比如put,delete等也在header中进行了传递
         *
         * @param {Object} option请求json的参数对象,同jquery的$.ajax参数,option新增参数useLocal，用来设置是否要强制使用本地数据［一般情况下不建议设置］
         *
         *   [使用范例]如下
         *
         *          ef.getJSON(
         *          {
         *              url:"test.api",//如果需要mock拦截ajax并使用本地数据,请在api.js中配置代理,并使用api.getAPI(name)获取url
         *              type:"get",//支持get,post,put,delete,option
         *              success:function(response)
         *              {
         *                  //只有response.code==200才会进入success
         *                  console.log(response);
         *              },
         *              error:function(error)
         *              {
         *                  console.log(error);
         *              }
         *          });
         *
         * @class ef.getJSON
         * @return {Object} $.ajax对象
         * */
        this.getJSON = function (option) {
            var that=this;
            var ajax;
            if (!option)return;
            option.dataType = "json";
            option.cache=false;
            var _method = (option.type ? option.type : "GET").toUpperCase();
            var _header =
            {
                "Content-Type": "application/json",
                "Ecloud-Token": user.getToken(),
                "Ecloud-Method": _method
            };
            option.headers = _header;
            option.type = _method == "GET" ? "GET" : "POST";
            //if(!option.noRandomUrl)
            //{
            //    option.url= _.url(option.url);
            //}
            if (_method == "DELETE") {
                option.type="GET";
                var _url = option.url;
                var reg = /\/$/;
                _url = reg.test(_url) ? _url : _url;
                _url = _url + exports.util.getValues(option.data).join("");
                option.url = _url;
                delete option.data;
                option.data={};
            }
            var originSuccess = option.success ? option.success : $.noop;
            var originError = option.error ? option.error : $.noop;
            //var timeFn = function () {
            //    option.overtime();
            //    if (ajax)ajax.abort("overtime");
            //    option.error({msg: "overtime"});
            //};
            //option.overtime = option.overtime || $.noop;
            //var time = setTimeout(timeFn, 10000);
            option.success = function (response) {
                // clearTimeout(time);
                if (!_.isServer(option)) {
                    //走本地
                    originSuccess(response);
                    that.logTable(response,option.url,true);
                } else {
                    //走服务
                    if (response.success && response.code == 200) {
                        originSuccess(response.result, response);//第一个返回参数内部result结果集，第二个为全部返回结果对象
                        if(that.config.isDebug)
                        {
                            that.logTable(response.result,option.url);
                        }
                    } else {
                        if (response.code == exports.code.authFailed||response.msg==exports.msg.authFailed||response.msg==exports.msg.sessionOut) {
                            signature.sessionOut(_.getLocale(response.msg));
                            return;
                        }
                        originError(response);
                        if (!option.noPlacard)
                            exports.placard.error(_.getLocale(response.msg,response.result||[]));
                    }
                }

            };
            option.error = function (errorObj) {
                //clearTimeout(time);
                if(errorObj)
                {
                    errorObj.msg=errorObj.msg|| _.getLocale("global.getjson.notfound.tip")+":"+option.url;
                }
                //session过期
                if(errorObj.msg==exports.msg.sessionOut)
                {
                    signature.sessionOut(_.getLocale(errorObj.msg));
                    return;
                }
                //断开与互联网的连接
                if ((errorObj && errorObj.readyState == 0 && errorObj.status == 0 && errorObj.statusText == "error" && errorObj.responseText == "")) {
                    signature.sessionOut(_.getLocale("signature.session.abort.message"));
                    return;
                }
                originError(arguments);
                if (_.isServer(option)) {
                    if (!option.noPlacard);
                    if (errorObj)
                        exports.placard.error(_.getLocale(errorObj.msg));
                    if (errorObj.msg == "overtime") {
                        exports.placard.warn(_.getLocale("global.getjson.overtime.tip") + ":" + option.url);
                    }
                }
            };
            if(option.isUpload)
            {
                return $.ajaxFileUpload(option);
            }
            option.data = option.type == "GET" ? option.data : JSON.stringify(option.data);
            return $.ajax(option);
        };

        /**
         * @private 给ef对象注册公用组件或方法(ef.register())
         * @param {String}[name]注册名称
         * @param {Object}[Class]注册的类名
         * @param {Boolean}[notDom]是否为dom对象,如果是则注册在该dom对象上,通过dom访问
         * @member ef
         */
        this._register = function (name, Class, notDom, isClass, domain, instance,ns) {
            if(ns)
            {
                if(isClass)
                {
                    exports[ns][name]=Class;
                }else
                {
                    exports[ns][name]=new Class();
                }
                return;
            }
            if (domain) {
                domain[name] = instance;
                return;
            }
            if (isClass) {
                exports[name] = Class;
                return;
            }
            exports.components[name] = Class;
            var obj = {};
            obj[name] = function () {
                if (arguments.length > 1) {
                    return new Class(this, arguments[0], arguments[1],arguments[2],arguments[3]);

                } else {
                    return new Class(this, arguments[0]);
                }
            };
            if (notDom) {
                exports[name] = new Class();
            } else {
                $.fn.extend(obj);
            }
        };
        /**
         * @singleton
         * #会话存储对象#
         *
         * # 描述 #
         * **与ef.localStorage区别是页面刷新后此数据仍存在,并可跨页传递**,单例模式
         *
         * **除非关闭浏览器才可清除**
         *
         * @class ef.sessionStorage
         * */
        var SessionStorage = function () {

        };
        /**
         * 设置会话存储
         * @param {String} key (required) 要存储的键名
         * @param {Object} value {required} 要存储的键值对象
         * */
        SessionStorage.prototype.put = function (key, obj) {
            this._init();
            var _global = this.get();
            if(!_global)return;
            _global[key] = obj;
            var str = JSON.stringify(_global);
            root.name = str;
        };
        /**
         * 获取会话存储
         * @param {String} key (required) 要获取的键名
         * @return {Object} 根据键名获取键值
         * */
        SessionStorage.prototype.get = function (key) {
            var str = root.name;
            if (!str) {
                return undefined;
            }
            try {
                str = JSON.parse(str)
            }
            catch (err) {
                return undefined;
            }
            if (arguments.length) {
                str = str[key];
            }
            return str;
        };
        /**
         * @private 初始化sessionStorage
         * */
        SessionStorage.prototype._init = function () {
            var _name = root.name;
            if (!_name || _name == "undefined") {
                var _global = {};
                var _globalStr = JSON.stringify(_global);
                root.name = _globalStr;
            }
        };
        /**清除所有sessionStorage存储*/
        SessionStorage.prototype.clear = function () {
            root.name = "";
        };
        (function (inject) {
            $.ajaxSetup({timeout: 999999});
            $.getJSON = function (a, b, c, d) {
                if (arguments.length > 2) {
                    switch (arguments.length) {
                        case 3:
                        {
                            if ($.isFunction(b) && $.isFunction(c)) {
                                return $.ajax(
                                    {
                                        dataType: "json",
                                        type: "GET",
                                        url: a,
                                        success: b,
                                        error: c,
                                        timeout: 90
                                    });

                            } else {
                                return $.get(a, b, c, "json");
                            }
                            break;
                        }
                        case 4:
                        {
                            if ($.isFunction(c) && $.isFunction(d)) {
                                return $.ajax(
                                    {
                                        dataType: "json",
                                        type: "GET",
                                        url: a,
                                        data: b,
                                        success: c,
                                        error: d,
                                        timeout: 90
                                    });

                            } else {
                                return $.get(a, b, c, "json");
                            }
                            break;
                        }

                        default:
                        {
                            return $.get(a, b, c, "json");
                        }
                    }
                } else {
                    return $.get(a, b, c, "json");
                }
            };
            inject.root = inject.root ? inject.root : root;
            /**
             * #CanvasRenderingContext2D绘图上下文扩展#
             * @class CanvasRenderingContext2D
             *  {@img canvas.png 绘图扩展示例}
             * # 描述 #
             * 对CanvasRenderingContext2D进行了扩展，支持画虚线、圆角矩形、圆、虚线矩形
             * （CanvasRenderingContext2D对象为html5的canvas的2d画图对象）
             *
             * **使用范例**：
             *
             *     @example
             *     *代码运行结果见上图*
             *
             *     [Html代码]
             *      <canvas width="300" height="300" id="extendCanvas" ></canvas>
             *      [Javascript]代码
             *      var extendCanvas=$("#extendCanvas")[0];//获取画布canvas的dom对象
             *      var extendContext=extendCanvas.getContext("2d");//获取CanvasRenderingContext2D对象
             *      extendContext.fillStyle="#0000ff";
             *      extendContext.strokeStyle="#ff0000";
             *      extendContext.roundRect(10,10,50,30,10,false,true);//画圆角矩形
             *      extendContext.dashedLineTo(50, 50, 120, 120, 5);//画虚线
             *      extendContext.dashStorkeRect(130,130,100,100,5,false);//画虚线矩形
             *      extendContext.circle(70,220,50,false);//画圆
             *      extendContext.cross(70,220,50);//画十字
             * */
            inject.root.CanvasRenderingContext2D = inject.root.CanvasRenderingContext2D ? inject.root.CanvasRenderingContext2D : $.noop;
            inject.root.console = inject.root.console ? inject.root.console :
            {
                log: $.noop,
                warn: $.noop,
                debug: $.noop,
                info: $.noop,
                error: $.noop,
                assert:$.noop,
                clear:$.noop,
                count:$.noop,
                dir:$.noop,
                dirxml:$.noop,
                group:$.noop,
                groupCollapsed:$.noop,
                groupEnd:$.noop,
                profile:$.noop,
                profileEnd:$.noop,
                table:$.noop,
                time:$.noop,
                timeEnd:$.noop,
                timeStamp:$.noop,
                trace:$.noop
            };
            /**扩展canvas画圆角矩形
             * @param {Number} x 要绘制的坐标的x轴
             * @param {Number} y 要绘制的坐标的y轴
             * @param {Number} width 绘制矩形宽度
             * @param {Number} height 绘制矩形高度
             * @param {Number} radius 绘制的圆角的半径
             * @param {Boolean} fill 是否自动填充
             * @param {Boolean} stroke 是否自动描边
             * */
            CanvasRenderingContext2D.prototype.roundRect =
                function (x, y, width, height, radius, fill, stroke) {
                    if (typeof stroke == "undefined") {
                        stroke = true;
                    }
                    if (typeof radius === "undefined") {
                        radius = 5;
                    }
                    this.beginPath();
                    this.moveTo(x + radius, y);
                    this.lineTo(x + width - radius, y);
                    this.quadraticCurveTo(x + width, y, x + width, y + radius);
                    this.lineTo(x + width, y + height - radius);
                    this.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
                    this.lineTo(x + radius, y + height);
                    this.quadraticCurveTo(x, y + height, x, y + height - radius);
                    this.lineTo(x, y + radius);
                    this.quadraticCurveTo(x, y, x + radius, y);
                    this.closePath();
                    if (stroke) {
                        this.stroke();
                    }
                    if (fill) {
                        this.fill();
                    }
                };
            /**扩展canvas画虚线
             * @param {Number} fromX 要绘制的起始坐标的x轴
             * @param {Number} fromY 要绘制的起始坐标的y轴
             * @param {Number} toX 要绘制的终点坐标的x轴
             * @param {Number} toY 要绘制的终点坐标的y轴
             * @param {Number} pattern 绘制虚线的间隔
             * */
            CanvasRenderingContext2D.prototype.dashedLineTo = function (fromX, fromY, toX, toY, pattern) {
                if (typeof pattern === "undefined") {
                    pattern = 5;
                }
                var dx = (toX - fromX);
                var dy = (toY - fromY);
                var distance = Math.floor(Math.sqrt(dx * dx + dy * dy));
                var dashlineInteveral = (pattern <= 0) ? distance : (distance / pattern);
                var deltay = (dy / distance) * pattern;
                var deltax = (dx / distance) * pattern;
                this.beginPath();
                for (var dl = 0; dl < dashlineInteveral; dl++) {
                    if (dl % 2) {
                        this.lineTo(fromX + dl * deltax, fromY + dl * deltay);
                    } else {
                        this.moveTo(fromX + dl * deltax, fromY + dl * deltay);
                    }
                }
                this.stroke();
            };
            /**扩展canvas画虚线描边的矩形
             * @param {Number} x 要绘制的坐标的x轴
             * @param {Number} y 要绘制的坐标的y轴
             * @param {Number} width 要绘制矩形的宽度
             * @param {Number} height 要绘制的矩形的高度
             * @param {Number} pattern 绘制虚线的间隔
             * @param {Boolean} fill 是否填充，默认false
             * */
            CanvasRenderingContext2D.prototype.dashStorkeRect = function (x, y, width, height, pattern, fill) {
                this.dashedLineTo(x, y, x + width, y, pattern);
                this.dashedLineTo(x + width, y, x + width, y + height, pattern);
                this.dashedLineTo(x + width, y + height, x, y + height, pattern);
                this.dashedLineTo(x, y + height, x, y, pattern);
                if (fill)this.fillRect(x, y, width, height);
            };
            /**扩展canvas画圆
             * @param {Number} x 要绘制的坐标x轴
             * @param {Number} y 要绘制的坐标y轴
             * @param {Number} radius 圆的半径
             * @param {Boolean} fill 是否填充，默认false
             * */
            CanvasRenderingContext2D.prototype.circle = function (x, y, radius, fill) {
                this.beginPath();
                this.arc(x, y, radius, 0, Math.PI * 2, true);
                this.stroke();
                if (fill) {
                    this.fill()
                }
                this.closePath();
            };
            /**扩展canvas 画十字
             * @param {Number} x 要绘制的十字的坐标x轴
             * @param {Number} y 要绘制的十字的坐标y轴
             * @param {Number} radius 要绘制的十字的半径
             *
             * */
            CanvasRenderingContext2D.prototype.cross = function (x, y, radius,isMinus) {
                this.beginPath();
                this.save();
                var _x1 = x + radius;
                var _y1 = y;
                var _x2 = x;
                var _y2 = y + radius;
                var _x3 = x - radius;
                var _y3 = y;
                var _x4 = x;
                var _y4 = y - radius;
                this.moveTo(x, y);
                this.lineTo(_x1, _y1);
                this.moveTo(x, y);
                if(!isMinus)
                {
                    this.lineTo(_x2, _y2);
                    this.moveTo(x, y);
                }
                this.lineTo(_x3, _y3);
                this.moveTo(x, y);
                if(!isMinus)
                {

                    this.lineTo(_x4, _y4);
                    this.moveTo(x, y);
                }
                this.closePath();
                this.stroke();
            };
            $.extend($.fn.validatebox.defaults.rules, {
                /**最小长度校验，例如:validType:'minlength[2]'*/
                minlength: {
                    validator: function (value, param) {
                        return value.length >= param[0];
                    },
                    message: inject.util.getLocale("framework.validate.minlength.message")
                }
            });
            $.extend($.fn.validatebox.defaults.rules, {
                /**白名单校验，例如:validType:'whitelist["a-z","只能包含字符:a-z"]'*/
                whitelist: {
                    validator: function (value, param) {
                        var reg=new RegExp("["+param[0]+"]","g");
                        var result=value.match(reg);
                        return result&&result.length==String(value).length;
                    },
                    message:inject.util.getLocale("framework.validate.whitelist.message")
                }
            });
            $.extend($.fn.validatebox.defaults.rules, {
                /**黑名单校验 例如validType:blacklist["$#","不能包含$,#字符"]*/
                blacklist: {
                    validator: function (value, param) {
                        var reg=new RegExp("["+param[0]+"]","g");
                        return !reg.test(value);
                    },
                    message: inject.util.getLocale("framework.validate.blacklist.message")
                }
            });
            $.extend($.fn.validatebox.defaults.rules, {
                /**正则表达式校验,里面写正则对象 例如 validType:reg[/\\d/]**/
                reg: {
                    validator: function (value, param) {
                        var reg=param[0];
                        return reg.test(value);
                    },
                    message: inject.util.getLocale("framework.validate.reg.message")
                }
            });
            $.extend($.fn.validatebox.defaults.rules, {
                /**正则表达式校验,里面写正则对象 例如 validType:reg[/\\d/],但可以自定义消息**/
                regx: {
                    validator: function (value, param) {
                        var reg=param[0];
                        return reg.test(value);
                    },
                    message: inject.util.getLocale("framework.validate.regx.message")
                }
            });
            inject._register(inject.name, null, null, false, inject.root, inject);
            inject.completeDeffers=[];
            inject.easyui={};
            inject.easyui.ready=function(fn)
            {
                if(!fn||!_.isFunction(fn))return false;
                inject.completeDeffers.push(fn);
            };
            $(root).on("easyui.complete",function(event,selector,defaultSelector){
                defaultSelector=defaultSelector||".right-entity";
                if(selector==defaultSelector)
                {
                    $(inject.completeDeffers).each(function(index,fn)
                    {
                        fn();
                    });
                }
            });
        })(this);
        /**子类结成父类*/
        Function.prototype.extend=function(Parent)
        {

        };
        /**ef对外的扩展接口
         * @class ef.extend
         * @param {Object}扩展参数为Object
         *        {
         *           name:"name",//对外使用名称，切勿重复，负责会覆盖同名扩展
         *           class:Class,//类名
         *           isDom:true,//是否为dom扩展，默认为true
         *           isInstance:false//默认无设置，如果设置了true则注册为ef的属性的实例，否则注册为ef属性的类
         *        }
         * */
        this.extend=function(param,domain)
        {
            //(name, Class, notDom, isClass, domain, instance,ns)
            if(!param)return;
            var args=[param.registerName||param.name,param.class||param];
            if(domain)
            {
                args.push(false,!param.isInstance,false,false,domain);
            }else
            {
                (!param.isDom&&param.isInstance)?(args.push(true)):null;
                ((!param.isDom)&&(!param.isInstance))?(args=args.concat([true,true])):null;
            }
            return this._register.apply(this,args);
        };
        /**重写已有方法，obj必须包含key和value的对象*/
        this.rewrite=function(target,obj)
        {
            if(!target)return;
            for(var i in obj)
            {
                target[i]=function(msg){return (new obj[i])["show"](msg)};
            }
        };
        this.inherit=function(Child)
        {
            Child.toString=function()
            {
                return "[Class "+Child.name+"]";
            }
        };
        this.register=function(Comp,nickName,domain)
        {
            if(!Comp)return;
            Comp.name=Comp.name|| _.getFunctionName(Comp);
            this.inherit(Comp);
            Comp.registerName=nickName||((Comp.isDom||Comp.isInstance)?Comp.name.toLowerCase():Comp.name);
            this.extend(Comp,domain);
        };
        $.ajaxSetup({timeout: 999999});
        return this;
    }));
}(window);
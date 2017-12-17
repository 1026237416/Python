/**
 * Created by wangahui1 on 16/3/8.
 */
define("framework.util",["require","exports","underscore","framework.cidr"],function(require,exports,_,Cidr)
{
    /**
     * @member ef.util
     * 对象是否属于某个类(class)的实例
     * @param {Object|String|Array|Number|Boolean} obj要检测的对象
     * @param {Object} class 要检测的class
     * @return {Boolean} 是否属于某个类
     * */
    _.isClass = function (obj, $class) {
        return obj instanceof $class;
    };
    /**
     * @member ef.util
     * 数组求和
     * */
    _.sum=function(arrs)
    {
        if(!this.isArray(arrs))return false;
        var result=0;
        this.each(arrs,function(val)
        {
            result+=val;
        });
        return result;
    };
    /**
     * @member ef.util
     *
     * 把参数转化成数组
     *
     * **使用范例**：
     *
     *     @example
     *
     *      var foo1=function()
     *      {
         *          console.log(ef.util.arg2arr(arguments));
         *      };
     *      foo1("test1",{a:1,b:"ss"},true);//输出 ["test1", {a: 1, b: "ss"}, true]
     * @param {Object} arg要转化为数组的对象
     * @return 转化后的数组
     * */
    _.arg2arr = function (arg) {
        if (!arg) {
            return [];
        }
        var arrs = [];
        for (var i = 0; i < arg.length; i++) {
            arrs.push(arg[i]);
        }
        return arrs;
    };
    /**是否走服务*/
    _.isServer = function (option) {
        if (!option) {
            throw new Error("wrong with param in _.isServer");
        }
        if (option.isForce) {//级别最高
            return true;
        }
        if (option.useLocal || option.isLocal || !ef.config.isServer) {//级别次之
            return false;
        }
        return ef.config.isServer;
    };
    /**
     * 拷贝对象－浅复制,只会复制第一层属性，后续属性不会复制，并且不会拷贝引用类型的副本
     *
     *
     * **使用范例**：
     *
     *     @example
     *      var dest={};
     *      var foo=
     *      {
         *          name:"test",
         *          age:3
         *      };
     *      var foo2=ef.util.copyProperty(dest,foo);
     *      console.log(foo2);//输出{name: "test", age: 3}
     *      console.log(dest==foo);//输出false
     *      console.log(dest==foo2);//返回true
     *      foo.age=15;
     *      console.log(dest.age);//输出3
     *
     * @param {Object} source需要拷贝到其属性的对象
     * @param {Object}[dest]目标对象,具有其它属性的对象
     * @return {Object}返回拷贝完的对象,既source
     * @member ef.util
     * */
    _.copyProperty = function (source, dest) {
        if (!source || !dest)return;
        for (var i in dest) {
            source[i] = dest[i];
        }
        return source;
    };
    /**复制一个对象的副本
     * @member ef.util*/
    _.copy = function (obj,dest) {
        return this.copyProperty(dest||{}, obj);
    };
    /**深复制一个对象
     * @member ef.util
     * see ef.util.copyDeepProperty*/
    _.dcopy = function (obj) {
        return this.copyDeepProperty(obj);
    };
    /**进制转换为2进制
     * @member ef.util
     */
    _.radix2=function(str)
    {
        var oldHex=2;
        return Number(str).toString(Number(oldHex));
    };
    /**进制转化为10进制
     * @member ef.util
     */
    _.radix10=function(str,oldHex)
    {
        oldHex=oldHex||2;
        return parseInt(str,oldHex);
    };
    /**
     *
     *
     * 对象深度拷贝,会拷贝所有属性，包括其内部多层的引用类型
     * @param {Object} obj 要拷贝的对象
     *
     * **使用范例**：
     *
     *     @example
     *
     *     var obj=
     *      {
         *          name:"deepCopy",
         *          contents:[1,2,3],
         *          attach:
         *          {
         *             age:2
         *          }
         *      };
     *
     *     var deepObj=ef.util.copyDeepProperty(obj);
     *      console.log(deepObj);//输出{name: "deepCopy", contents: [1, 2, 3], attach: {age: 2}}
     *      console.log(obj==deepObj)//输出false;
     *      obj.contents[1]=3;
     *      console.log(obj.contents,deepObj.contents);//输出 [1, 3, 3] ,[1,2,3]
     *      delete obj.attach;
     *      console.log(obj,deepObj);//输出 {name: "deepCopy", contents: [1, 3, 3]} ,
     *      //{name: "deepCopy", contents: [1, 2, 3], attach: {age: 2}}
     *
     * @return 拷贝后新的对象
     *
     * @member ef.util
     */
    _.copyDeepProperty = function (obj) {
        return !obj ? null : JSON.parse(JSON.stringify(obj));
    };
    /**
     *
     * 随机数初始化
     *
     * **使用范例**：
     *
     *     @example
     *
     *     console.log(ef.util.getInitRandom(10000));//输出随机整数 ，eg:5874
     * @member ef.util
     */
    _.getInitRandom = function (range) {
        return Math.floor(Math.random() * range);
    };
    /**
     *
     * 获取UUID，具有唯一性
     *
     * **使用范例**：
     *
     *     @example
     *
     *     console.log(ef.util.getUUID())//输出唯一的字符串 1449735051746_57883084
     * @member ef.util
     */
    _.getUUID = function () {
        var _date = new Date();
        var _time = _date.getTime();
        var _random = this.getInitRandom(100000000);
        return _time + "_" + _random;
    };
    /**
     *
     * 随机从数组中取一个值
     * @param {Array} arrs 要取值的数组
     *
     * **使用范例**：
     *
     *     @example
     *
     *      console.log(ef.util.getRandomArrs([1,"a",201]));//随机输出数组中的一个值，eg:a
     * @return 随机获取数组中的一个值
     * @member ef.util
     */
    _.getRandomArrs = function (arrs) {
        var nm = this.getInitRandom(arrs.length);
        if (nm == 0) {
            nm = 1;
        }
        var _arrs = arrs.concat([]);
        var _result = [];
        for (var i = 0; i < nm; i++) {
            var nm1 = this.getInitRandom(_arrs.length);
            _result.push(_arrs[nm1]);
            _arrs.splice(nm1, 1);
        }
        return _result;
    };
    _.getInterNum = function (num) {
        num = Math.abs(Math.floor(num));
        var len = String(num).length;
        if (len <= 1) {
            return num;
        }
        var left = len - 1;
        var str = String(num).substr(0, 1);
        for (var i = 0; i < left; i++) {
            str += String("0");
        }
        return Math.floor(Number(str) / 10);
    };
    /**
     *
     * 转义或编码json格式的字符串,通常用在dom传递属性中包含特殊值符号的字符串
     *
     * **使用范例**：
     *
     *     @example
     *
     *     var jsonObj={name:"abc",age:2};
     *      var str=JSON.stringify(jsonObj);
     *      console.log(str);//输出{"name":"abc","age":2}
     *      console.log(ef.util.escapeJSON(str));//输出%7B%22name%22%3A%22abc%22%2C%22age%22%3A2%7D
     *      //var dom=$('<div onclick="alert(\''+str+'\')">aaa</div>');
     *      var dom2=$('<div onclick="alert(\''+ef.util.escapeJSON(str)+'\')">aaa</div>');
     *      //$(document.body).append(dom);//点击字符串aaa后报错 ：提示SyntaxError: Unexpected EOF.意味着字符串打乱了dom结构
     *      $(document.body).append(dom2);//点击字符串aaa后弹出%7B%22name%22%3A%22abc%22%2C%22age%22%3A2%7D
     * @member ef.util
     */
    _.escapeJSON = function (jsonStr) {
        if (!jsonStr)return;
        return escape(jsonStr);
    };
    /**
     *
     * 解码escapeJSON编码后的字符串
     *
     * **使用范例**：
     *
     *     @example
     *     var str="%7B%22name%22%3A%22abc%22%2C%22age%22%3A2%7D";
     *     console.log(ef.util.unescapeJSON(str));//输出 {"name":"abc","age":2}
     * @member ef.util
     */
    _.unescapeJSON = function (str) {
        if (!str)return;
        return unescape(str);
    };

    /**
     * 格式化跨页传递数据
     * @param {Object} data 要传递的数据，请用引用类型数据
     * @return {String} 返回格式化后并且经过escapeJSON编码的数据结果字符串
     *
     * **使用范例**：
     *
     *     @example
     *
     * @member ef.util
     * */
    _.formatPageData = function (data) {
        if (!data) {
            return null;
        }
        return this.escapeJSON(JSON.stringify(data));
    };
    /**
     *
     * 在ef.uitl.ready的回调函数里获取跨页传递的数据
     * @param {Object} dom 跨页传递dom对象
     * @return {Object} 传递的对象数据
     *
     * **使用范例**：
     *
     *     @example
     *
     * @member ef.util
     * */
    _.getCrossData = function (dom) {
        var _data = dom.data("pageData");
        if (_data) {
            return JSON.parse(this.unescapeJSON(_data));
        }
        return null;
    };
    _.getCrossId = function (dom) {
        return dom.data("pageData");
    };
    _.formatComboxData=function(arrs)
    {
        return this.map(arrs,function(val,index)
        {
            return {label:val,value:val,index:index};
        });
    };
    /**
     *
     * 获取Keys
     *
     * **使用范例**：
     *
     *     @example
     * @member ef.util
     */
    _.getKeys = function (obj) {
        var result = [];
        if (!obj) {
            return result
        }
        for (var i in obj) {
            result.push(i);
        }
        return result;
    };
    /**
     * 判断浏览器类型-是否是 ie
     * @return {Boolean}
     * @member ef.util
     * */
    _.isIE = function () {
        return navigator.userAgent.indexOf("MSIE") > 0;
    };
    /**
     * 判断浏览器类型-是否是 Firefox
     * @return {Boolean}
     * @member ef.util
     * */
    _.isFirefox = function () {
        return navigator.userAgent.indexOf("Firefox") > 0;
    };
    /**
     * 判断浏览器类型-是否是 Safari
     * @return {Boolean}
     * @member ef.util
     * */
    _.isSafari = function () {
        return navigator.userAgent.indexOf("Safari") > 0 && !this.isChrome();
    };
    /**
     * 判断浏览器类型-是否是 Chrome
     * @return {Boolean}
     * @member ef.util
     * */
    _.isChrome = function () {
        return navigator.userAgent.indexOf("Chrome") > 0;
    };
    /**数据根据字段排序
     * @param {String} field 要排序的字段名
     * @param {Array} arrs 要排序的结果集
     * @param {Boolean} isDesc是否是按照倒叙排列，默认false即按照顺序排列
     * @return {Array} 返回排序后的数组
     * @member ef.util
     * */
    _.sort = function (field, arrs, isDesc) {
        if (!arrs)return;
        var result = this.sortBy(arrs, field);
        isDesc ? result.reverse() : null;
        return result;
    };
    /**
     * 根据自然数字大小排序
     * @param {Array} arrs 要排序的数组，内容是简单的值
     * @param {Boolean} isAsc 是否按照顺序排列，默认倒叙false
     * @member ef.util
     * */
    _.sortNum = function (arrs, isAsc) {
        return arrs.sort(function (a, b) {
            return isAsc ? a - b : b - a
        });
    };
    /**
     *
     * 判断值是否在一个数组起止范围内
     *
     * **使用范例**：
     *
     *     @example
     *     console.log("xxx",ef.util.valueInRange(5,[1,233]));//输出true
     *
     * @param {Number} value 要检测的值
     * @param {Array} arrs 要检测的数组范围
     * @return {Boolean} 返回是否在范围内
     * @member ef.util
     */
    _.valueInRange = function (value, arrs) {
        if (!this.isNumber(value)) {
            return false
        }
        if (!this.isArray(arrs)) {
            return false;
        }
        if (arrs.length != 2) {
            return false;
        }
        var _isNumber = true;
        $(arrs).each(function (i, il) {
            if (!_.isNumber(il)) {
                _isNumber = false;

            }
        });
        if (!_isNumber) {
            return false;
        }
        if (value >= arrs[0] && value <= arrs[1]) {
            return true;
        }
        return false;
    };
    /**
     *
     * 获取Values值
     *
     * **使用范例**：
     *
     *     @example
     * @member ef.util
     */
    _.getValues = function (obj) {
        var result = [];
        if (!obj) {
            return result
        }
        for (var i in obj) {
            result.push(obj[i]);
        }
        return result;
    };
    /**
     *
     * 用户是否有对应主菜单权限
     *
     * **使用范例**：
     *
     *     @example
     *
     * @member ef.util
     */
    _.noRight = function (roleType, roleTypes, isSuper) {
        if(!roleType)return false;
        if (isSuper) {
            return false;
        }
        return $.inArray(roleType, roleTypes) == -1;
    };
    /**
     *
     * 获取pageData
     *
     * **使用范例**：
     *
     *     @example
     * @member ef.util
     */
    _.getPageData = function (key) {
        return $("._temp_data_cont___").data(key);
    };
    _.getPageId = function () {
        return $("._temp_data_cont___").data("pageId");
    };
    /**
     *
     * 获取光标位置
     *
     * **使用范例**：
     *
     *     @example
     * @member ef.util
     */
    _.getCursortPosition = function (ctrl) {
        //获取光标位置函数
        var CaretPos = 0;
        // IE Support
        if (document.selection) {
            ctrl.focus();
            var Sel = document.selection.createRange();
            Sel.moveStart('character', -ctrl.value.length);
            CaretPos = Sel.text.length;
        }
        else if (ctrl.selectionStart || ctrl.selectionStart == '0') {
            CaretPos = ctrl.selectionStart;
            return (CaretPos);
        }
    };
    /**获取root的resize*/
    _.resize = function (fn) {
        return $(ef.root).resize(fn);
    };
    /**
     *
     * 设置光标位置
     *
     * **使用范例**：
     *
     *     @example
     * @member ef.util
     */
    _.setCaretPosition = function (ctrl, pos) {
        //设置光标位置函数
        if (ctrl.setSelectionRange) {
            ctrl.focus();
            ctrl.setSelectionRange(pos, pos);
        }
        else if (ctrl.createTextRange) {
            var range = ctrl.createTextRange();
            range.collapse(true);
            range.moveEnd('character', pos);
            range.moveStart('character', pos);
            range.select();
        }

    };
    /**
     *
     * 获取浏览器语言类型
     *
     * **使用范例**：
     *
     *     @example
     * @member ef.util
     */
    _.getBrowserLang = function () {
        return $.i18n.browserLang();
    };
    /**
     *
     * 获取浏览器类型缩写
     *
     * **使用范例**：
     *
     *     @example
     * @member ef.util
     */
    _.getBrowserLangAbbr = function () {
        return this.getBrowserLang().split("-")[0];
    };
    /**
     *
     * 获取Cidr
     * 参见 {@link Cidr}
     * @param {String} cidr cidr格式的字符串，比如192.168.1.1/24
     *
     *
     * **使用范例**：
     *
     *     @example
     * @member ef.util
     * @return {Object} 返回cidr对象
     */
    _.getCidr = function (cidr,isAll,exclude) {
        return new Cidr(cidr,null,isAll,exclude);
    };
    /**
     *
     * 获取国际化资源文件key
     * @param {String}[key]要获取国际化的key名
     *
     * **使用范例**：
     *
     *     @example
     * @member ef.util
     * */
    _.getLocale = function (key,placeHolderValues) {
        return $.i18n.prop.apply(null,this.arg2arr(arguments));
    };
    //关闭dialog,isForce为强制关闭，建议三级弹出后使用
    /**
     *
     * 强制关闭对话框
     * @deprecated 2015.12.03
     *
     * **使用范例**：
     *
     *     @example
     *     ef.util.close($(dom),true);
     * @member ef.util
     */
    _.close = function (dom, isForce) {
        var _dialog = $(dom).dialog('close');
        if (isForce) {
            _dialog.remove();
            _dialog = null;
        }
    };
    /**
     * 判断数字是否为整数
     * @param {String} num 要测试的数字
     * @return {Boolean}
     * @member ef.util
     * */
    _.isInt = function (num) {
        if (!this.isNumber(num)) {
            return false;
        }
        return num == Math.floor(num);
    };
    /**b转化kb
     * @member ef.util*/
    _.b2kb = function (num, unit, con) {
        return this.kb2mb.apply(this, arguments);
    };
    /**kb转化为b
     * @member ef.util*/
    _.kb2b = function (num, unit, con) {
        return this.mb2kb.apply(this, arguments);
    };
    /**Mb转化为Kb
     * @member ef.util*/
    _.mb2kb = function (num, unit, con) {
        if (!this.isNumber(num)) {
            return false;
        }
        con = con || 1024;
        var result = num * con;
        if (this.isInt(result)) {
            return result;
        }
        return unit ? result.toFixed(unit) : result;
    };
    /**转换G到M兆
     * @param {Number} num 要转化到数字
     * @param {Number} unit 要保留的小数位数，默认为2
     * @return {Number} 转化后的数字
     * @member ef.util
     * */
    _.gb2mb = function (num, unit, con) {
        return this.mb2kb.apply(this, arguments);
    };
    /**kb转化为mb
     * @member ef.util*/
    _.kb2mb = function (num, unit, con) {
        if (!this.isNumber(num)) {
            return false;
        }
        con = con || 1024;
        var result = num / con;
        if (this.isInt(result)) {
            return result;
        }
        return unit ? result.toFixed(unit) : result;
    };
    /**转换M兆到G
     * @param {Number} num 要转化到数字
     * @param {Number} unit 要保留的小数位数，默认为2
     * @return {Number} 转化后的数字
     * @member ef.util
     * */
    _.mb2gb = function (num, unit, con) {
        return this.kb2mb.apply(this, arguments);
    };
    /**kb转化为gb
     * @member ef.util*/
    _.kb2gb = function (num, unit, con) {
        return this.mb2gb(this.kb2mb(num, unit), unit);
    };
    /**Gb转化为KB
     * @member ef.util*/
    _.gb2kb = function (num, unit, con) {
        return this.mb2kb(this.gb2mb(num, unit), unit);
    };
    /**Gb转化为tb*/
    _.gb2tb=function(num, unit, con)
    {
        return this.kb2mb.apply(this, arguments);
    };
    _.kb2kb=function(num)
    {
        return num;
    };
    _.mb2mb=function(num)
    {
        return num;
    };
    _.gb2gb=function(num)
    {
        return num;
    };
    _.tb2tb=function(num)
    {
        return num;
    };
    /**获取数值级别是K、M、B
     * @member ef.util*/
    _.getKGM = function (max, con) {
        con = con || 1024;
        var arrs = [con, con * con,con*con*con];
        if (!this.isNumber(max)) {
            return false;
        }
        if (this.isLt(max, arrs[0])) {
            return "k";
        }
        if (this.isBetween(max, [arrs[0],arrs[1]], true)) {
            return "m";
        }
        if (this.isBetween(max, [arrs[1],arrs[2]], true)) {
            return "g";
        }
        if (this.isGt(max, arrs[2], true)) {
            return "t";
        }
    };
    _.getBKGM = function(max,con){
        con = con || 1024;
        var arrs = [con, con * con,con*con*con,con*con*con*con];
        if (!this.isNumber(max)) {
            return false;
        }
        if (this.isLt(max, arrs[0])) {
            return "b";
        }
        if (this.isBetween(max, [arrs[0],arrs[1]], true)) {
            return "k";
        }
        if (this.isBetween(max, [arrs[1],arrs[2]], true)) {
            return "m";
        }
        if (this.isBetween(max, [arrs[2],arrs[3]], true)) {
            return "g";
        }
        if (this.isGt(max, arrs[3], true)) {
            return "t";
        }
    };
    _.format1024 = function(max){
        var ranges = {
            b:1,
            k:1*1024,
            m:1*1024*1024,
            g:1*1024*1024*1024,
            t:1*1024*1024*1024*1024
        },range,con,unitText;
        range = this.getBKGM.call(this,max);
        con = ranges[range];
        if(range && con){
            if(range == 'b'){
                unitText = String(range).toUpperCase();
            }else{
                unitText = String(range).toUpperCase()+'B';
            }
            return {
                value:this.kb2mb.call(this, max,null,con),
                unit:unitText
            };
        }else{
            return false;
        }
    };
    /**k,m,g之间任意转换
     * @member ef.util*/
    _.trans = function (value, from, to, unit) {
        if (arguments.length < 3 || from == to) {
            return value;
        }
        from = from.toLowerCase();
        to = to.toLowerCase();
        switch (from) {
            case "k":
            {
                if (to == "m") {
                    return this.kb2mb.apply(this, [value, unit]);
                }
                if (to == "g") {
                    return this.kb2gb.apply(this, [value, unit]);
                }
                break;
            }
            case "m":
            {
                if (to == "k") {
                    return this.mb2kb.apply(this, [value, unit]);
                }
                if (to == "g") {
                    return this.mb2gb.apply(this, [value, unit]);
                }
                break;
            }
            case "g":
            {
                if (to == "k") {
                    return this.gb2kb.apply(this, [value, unit]);
                }
                if (to == "m") {
                    return this.gb2mb.apply(this, [value, unit]);
                }
                break;
            }
        }
        return value;
    };
    /**自动转化级别
     * @member ef.util*/
    _.toTransUnit = function (current, max, unit) {
        var level = this.getKGM(max);
        switch (level) {
            case "k":
            {
                return this.isInt(current) ? current : current.toFixed(2);
                break;
            }
            case "m":
            {
                return this.kb2mb(current, unit);
                break;
            }
            case "g":
            {
                return this.kb2gb(current, unit);
                break;
            }
            default:
            {
                return false;
            }
        }
    };
    /**是否小于当前值
     * @member ef.util*/
    _.isLt = function (current, dest, isEqual) {
        if (isEqual) {
            return current <= dest;
        }
        return current < dest;
    };
    /**是否大于当前值
     * @member ef.util*/
    _.isGt = function (current, dest, isEqual) {
        if (isEqual) {
            return current >= dest;
        }
        return current > dest;
    };
    /**是否在两个之间
     * @param {Number} current 当前值
     * @param {Array} arrs 具有最小值和最大值且长度为2的数组
     * @param {Boolean} isStartEqual 是否要>=开始值,默认false
     * @param {Boolean} isEndEqual 是否要<=结束值,默认false
     * @return {Boolean}
     * @member ef.util
     * */
    _.isBetween = function (current, arrs, isStartEqual, isEndEqual) {
        if (arguments.length < 2 || !this.isArray(arrs) || arrs.length != 2) {
            return false;
        }
        return (isStartEqual ? current >= arrs[0] : current > arrs[0]) && (isEndEqual ? current <= arrs[1] : current < arrs[1]);
    };
    /**是否是有效日期
     * @member ef.util*/
    _.isValidTime = function (str) {
        if(this.isDate(str))
        {
            return str;
        }
        var reg=/Z$/;
        if(this.isFirefox()&&!this.isNumber(str))
        {
            if(!reg.test(str)){
                str=String(str).replace(/-/g,"/");
            }
        }
        var date = new Date(str);
        if (date == "Invalid Date") {
            return false;
        }
        return date;
    };
    /**
     * 将时间格式字符串或时间对象转化为可定制的时间字符串
     * 参见 formatTime方法
     * @member ef.util*/
    _.number2time = function (num,format,isAuto) {
        return this.formatTime(num,format,isAuto);
    };
    /**将时间格式字符串或时间对象转化为可定制的时间字符串
     * @param {Object|String|Number}dateStr 要转的日期对象、或时间格式字符串、或时间毫秒
     * @param {String} format 要格式化的形式，Y为年，M为月，D为日,h为小时,m为分,s为秒,i为毫秒,w为周,t为1970至今的毫秒数,比如设置为(“Y-M-D”)将输出2015-02-05格式
     * 如果设置为 :"Y年M月D日 h时:m分:s秒 星期w" 输出 "2016年02月03日 17时:24分:54秒 星期3"
     * 如果不设置format 则format的格式为默认为:"Y-M-D h:m:s"
     * @param {Boolean} isAuto 是否自动转化时间时间，如果为true则自动将其它级别的时间（例如传入的是秒级别、分级别、时级别、天级别、月级别、年级别的数字）转化为毫秒级别正确时间
     *
     *  **使用范例**：
     *
     *     @example
     *     var date=ef.util.formatTime(new Date,"Y-M-D");
     *     console.log(date);//输出 "2016-02-03"
     *     var date=ef.util.formatTime("2015/06/07 12:12:13","Y-M-D h:m:s");
     *     console.log(date) //输出 "2015-06-07 12:12:13"
     *     var date=ef.util.formatTime(1454492368394,"Y年/M月/D日 h时:m分:s秒:i毫秒 星期w")
     *     console.log(date);//输出 "2016年/02月/03日 17时:39分:28秒:394毫秒 星期3"
     *     console.log(ef.util.formatTime(1454568829,"Y-M-D",true));//自动转换非毫秒级别的数字为正确时间格式,输出:2016-02-04
     * @return {String} 返回格式化后时间格式，如果是无效时间对象或格式，输出false
     * @member ef.util*/
    _.formatTime=function(dateStr,format,isAuto)
    {
        var date = this.isValidTime(dateStr);
        if (!date)return date;
        if(this.isNumber(dateStr)&&isAuto)
        {
            date=new Date(this.time2numberMillSecond(dateStr));
        }
        var year=date.getFullYear();
        var month=_.preppendChar(date.getMonth() + 1,"0",2);
        var day=_.preppendChar(date.getDate(),"0",2);
        var hour=_.preppendChar(date.getHours(),"0",2);
        var minu=_.preppendChar(date.getMinutes(),"0",2);
        var second=_.preppendChar(date.getSeconds(),"0",2);
        var millSecond=_.preppendChar(date.getMilliseconds(),"0",3);
        var week=date.getDay();
        var formatDate=
        {
            Y:year,
            M:month,
            D:day,
            h:hour,
            m:minu,
            s:second,
            i:millSecond,
            w:week,
            t:date.getTime()
        };
        format=format||"Y-M-D h:m:s";
        for(var i in formatDate)
        {
            var reg=new RegExp(i,"g");
            format=format.replace(reg,formatDate[i]);
        }
        return format;
    };
    /**时间转化为数字*/
    _.time2number=function(str,len)
    {
        var date=this.isValidTime(str);
        if(!date) return 0;
        var time=date.getTime();
        var timeLen=String(time).length;
        if(timeLen==len)return Number(time);
        if(timeLen>len)
        {
            return Number(String(time).substr(0,len));
        }
        return Number(this.appendChar(String(time),"0",len));
    };
    /**将时间转化为精确到秒的数字
     * @member ef.util*/
    _.time2numberSecond=function(str)
    {
        return this.time2number(str,10);
    };
    /**将时间转化为精确到毫秒的数字
     * @member ef.util*/
    _.time2numberMillSecond=function(str)
    {
        return this.time2number(str,13);
    };
    /**给字符串或数字前面补齐字符
     * @param {String} str 要补齐的字符串
     * @param {String} char 需要补齐的字符，比如"0"
     * @param {Number} resultLength 结果想要补齐的长度
     * @return 返回补齐后的字符串
     * @member ef.util
     * */
    _.preppendChar=function(str,char,resultLength)
    {
        str=String(str);
        if(str.length>=resultLength)return str;
        str=char+str;
        if(str.length<resultLength)
        {
            return arguments.callee(str,char,resultLength);
        }
        return str;
    };
    /**给字符串或数字后面补齐字符
     * @param {String} str 要补齐的字符串
     * @param {String} char 需要补齐的字符，比如"0"
     * @param {Number} resultLength 结果想要补齐的长度
     * @return 返回补齐后的字符串
     * @member ef.util
     * */
    _.appendChar=function(str,char,resultLength)
    {
        str=String(str);
        if(str.length>=resultLength)return str;
        str=str+char;
        if(str.length<resultLength)
        {
            return arguments.callee(str,char,resultLength);
        }
        return str;
    };
    /**格式化时间字符串,eg: Y-M-D h:m:s
     * @member ef.util*/
    _.formatDate = function (formatStr) {

    };
    /**
     *
     * 设置多层在页面的显示深度，既z-index
     *
     * **使用范例**：
     *
     *     @example
     * @member ef.util
     */
    _.setDepths = function (arrs) {
        if (!arrs || !arrs.length) {
            return;
        }
        $(arrs).each(function (i, el) {
            $(el).css({"z-index": i + 1});
        });
    };
    /**是否是合法ip
     * @member ef.util*/
    _.isValidIp = function (str) {
        var reg = /^(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])$/;
        return reg.test(str);
    };
    /**获取ip地址的最后一位
     * @member ef.util*/
    _.getIpSufix = function (str) {
        if (!this.isValidIp(str)) {
            return null;
        }
        var pre_reg = /^((\d{1,3}\.){2}(\d{1,3})\.)/;
        return str.replace(pre_reg, "");
    };
    /**获取ip地址的第一位
     * @member ef.util*/
    _.getIpFirst = function (str) {
        if (!this.isValidIp(str)) {
            return null;
        }
        return str.substring(0,str.indexOf("."));
    };
    /**获取ip地址的第二位
     * @member ef.util*/
    _.getIpTwo = function (str) {
        if (!this.isValidIp(str)) {
            return null;
        }
        var s = str.replace( _.getIpFirst(str),"");
        s=s.substr(1);
        return s.substring(0,s.indexOf("."));
    };
    /**获取ip地址的第三位
     * @member ef.util*/
    _.getIpThree = function (str) {
        if (!this.isValidIp(str)) {
            return null;
        }
        var s = str.replace(_.getIpFirst(str),"");
        s = s.replace(_.getIpTwo(str),"");
        return s.substring(2,s.lastIndexOf("."));
    };
    /**获取ip的前三位，不包含第三个点
     * @member ef.util*/
    _.getIpPrefix = function (str) {
        if (!this.isValidIp(str)) {
            return null;
        }
        var pre_reg = /^((\d{1,3}\.){2}(\d{1,3}))/;
        return str.match(pre_reg)[0];
    };
    _.getTablePageData= function (dom,data) {
        if(!data||data==undefined){data = {};}
        var index = [];
        var userId = [];
        var num = dom.datagrid("options").pageNumber;
        var u = dom.datagrid('getChecked');
        for(var i in data){
            if(i==num){
                delete  data[num];
                data[num] = u;
            }
            index.push(i);
        }
        if(index.indexOf(num)==-1){
            data[num] = u;
        }
        for(var j in data){
            $(data[j]).each(function (e,el) {
                userId.push(el);
            });
        }
        return userId;
    };
    _.ippoolFormat=function(ippools){
        var totalIP=[];//最后返回的所有IP段[{ip:"10.10.1.1",dhcp:false,used:0,vm:"",tenant:{}},{ip:"10.10.1.1",dhcp:false,used:0,vm:"",tenant:{id:"dsfcadfs",name:"2"}}]
        var ipthrStart="",//start前三位字符串
            ipthrEnd="",//end前三位字符串
            ipthreestart="",//start第三位数字字符串
            ipthreeend="",//end第三位数字字符串
            ipfourStart="",//start第四位字符串
            ipfourEnd="",//end前第位字符串
            iptwo="";//start与end的前两位字符串
        $(ippools).each(function(i,il){
            if(il.start==il.end){//start与end是相同IP
                totalIP.push({
                    ip:il.start,
                    dhcp:false,
                    used:0,
                    vm:"",
                    tenant:{}
                })
            }else{
                ipthrStart=il.start.slice(0,il.start.lastIndexOf("."));//"10.10.1"
                ipthrEnd=il.end.slice(0,il.end.lastIndexOf("."));//"10.10.2"
                ipfourStart=il.start.slice(il.start.lastIndexOf(".")+1);//start第四位字符串
                ipfourEnd=il.end.slice(il.end.lastIndexOf(".")+1);//end第四位字符串
                iptwo=il.start.slice(0,ipthrStart.lastIndexOf("."));//"10.10"
                ipthreestart=ipthrStart.slice(ipthrStart.lastIndexOf(".")+1);//start第三位数字符串
                ipthreeend=ipthrEnd.slice(ipthrEnd.lastIndexOf(".")+1);//end第三位数字符串
                if(ipthrStart==ipthrEnd){//前三位相同
                    for(var i=Number(ipfourStart);i<=Number(ipfourEnd);i++){
                        totalIP.push({
                            ip:ipthrStart+'.'+i,
                            dhcp:false,
                            used:0,
                            vm:"",
                            tenant:{}
                        })
                    }
                }else{//{start:"10.10.1.1",end:"10.10.2.254"}
                    if(Number(ipthreeend)-Number(ipthreestart)>1){
                        for(var a=Number(ipthreestart)+1;a<Number(ipthreeend);a++){
                            for(var b=0;b<=255;b++){
                                totalIP.push({
                                    ip:iptwo+'.'+a+"."+b,
                                    dhcp:false,
                                    used:0,
                                    vm:"",
                                    tenant:{}
                                })
                            }
                        }
                    }
                    for(var s=Number(ipfourStart);s<=255;s++){
                        totalIP.push({
                            ip:iptwo+'.'+ipthreestart+"."+s,
                            dhcp:false,
                            used:0,
                            vm:"",
                            tenant:{}
                        })
                    }
                    for(var e=0;e<=Number(ipfourEnd);e++){
                        totalIP.push({
                            ip:iptwo+'.'+ipthreeend+"."+e,
                            dhcp:false,
                            used:0,
                            vm:"",
                            tenant:{}
                        })
                    }
                }
            }
        });
        totalIP= _.uniq(totalIP);
        return totalIP;
    };
    _.getTotalIP=function(iparr){
        var ipused,tenants;
        var totalIP,tenantip;
        if(iparr.tenants){
            ipused=iparr.ipused;
            tenants=iparr.tenants;
            totalIP= _.ippoolFormat(iparr.ippools);
            $(tenants).each(function(i,il){
                tenantip= _.ippoolFormat(il.ippools);
                $(tenantip).each(function(t,tl){
                    $(totalIP).each(function(e,el){
                        if(tl.ip==el.ip){
                            el.tenant.id=il.id;
                            el.tenant.name=il.name;
                        }
                    });
                });
            });
        }else{
            ipused=iparr.ipused;
            totalIP= _.ippoolFormat(iparr.ippools);
                $(totalIP).each(function(t,tl){
                    tl.tenant.id=iparr.id;
                    tl.tenant.name=iparr.name;
                });
        }
        $(ipused).each(function(u,ul){
            _.find(totalIP,function(item){
                if(item.ip==ul.ip){
                    item.dhcp=ul.dhcp;
                    item.used=ul.used?0:1;
                    item.port=ul.port;
                    item.vm=(ul.vm==""&&!ul.dhcp)?"emptyvm":ul.vm;
                }
            })
        });
        return totalIP;
    };
    _.getAvailableIP=function(ipArray){
        var ipArray = ipArray || {};
        var tempArray = ipArray.ipavailable;
        if(!_.isArray(tempArray) || !tempArray.length){
            return [];
        }
        var availableIps = _.ippoolFormat(tempArray);
        _.each(availableIps,function (item,index) {
            item.tenant.id=ipArray.id;
            item.tenant.name=ipArray.name;
        });
        return availableIps;
    };
    _.sliceIpData = function (threeData) {
            var arg = arguments;
            var t,con = [],index,a = 0;
            for(var i = 0;i<threeData.length;i++){
                var il = threeData[i];
                $(il).each(function (e,el) {
                    if(Number(ef.util.getIpSufix(el))==254&&!il.type){
                        t = ef.util.getIpThree(el);
                        con = il;
                        index = i;
                    }
                    if(Number(ef.util.getIpThree(el)) == Number(t)+1&&index!=i){
                        if(Number(ef.util.getIpSufix(el))==1){
                            a = 1;
                            threeData[i] = con.concat(il);
                            threeData.splice(index,1);
                            arg.callee(threeData);
                            return false;
                        }
                    }
                });
                if(a==1){break;}
            }
            return threeData;
    };
    /**获取ip的分组后的数据
     * @member ef.util*/
    _.getIpGroupsData = function (ip) {
        //获取存有ip第三位的数组（去掉重复）
        var oneData = ef.util.map(ip, function (ol) {
            return ef.util.getIpThree(ol);
        });
        oneData = ef.util.uniq(oneData);
        //获取第三位相同的ip的组
        var twoData = [];
        ef.util.map(oneData, function (thl) {
            var t = ef.util.map(ip, function (tl) {
                if(thl==ef.util.getIpThree(tl)){
                    return tl;
                }
            });
            twoData.push(ef.util.without(t,undefined));
        });
        //第三位相同且第四位不连续的分组
        var threeData = [];
        $(twoData).each(function (i,il) {
            var a = [],b= [],c= [];
            $(il).each(function (e,el) {
                if(Number(ef.util.getIpSufix(il[0]))+1==Number(ef.util.getIpSufix(il[1]))){
                    a.push(il[0]);
                    a.push(il[1]);
                    c.push(il[0]);
                    c.push(il[1]);
                }else{
                    b.push(il[0]);
                    if(c.length!=0){
                        c = ef.util.uniq(c);
                        threeData.push(c);
                    }
                    c = [];
                }
                il.splice(0,1);
            });
            a = ef.util.uniq(a);
            b = ef.util.difference(b,a);
            $(b).each(function (i,il) {
                threeData.push([il]);
            });
        });
        //对第三位不同的数组的合并
        threeData =_.sliceIpData(threeData);
        var ipData = ef.util.map(threeData, function (num) {
            if(!num.type){
                return num;
            }
        });
        ipData = ef.util.without(ipData,undefined,[]);
        //返回最终的ip组
        var iplist=[];
        $(ipData).each(function(i,il){
            iplist.push({start:il[0],end:il[il.length-1]})
        });
        return iplist;
    };

    _.param=function(obj,url,isTraditional)
    {
        if(url)
        {
            var questReg=/\?{1,}/g;
            var lastQuestReq=/\?$/;
            var lastAndReg=/&$/g;
            var hasQuest=questReg.test(url);
            var hasLastQuest=lastQuestReq.test(url);
            var hasLastAnd=lastAndReg.test(url);
            if(hasQuest)
            {
                if(!hasLastQuest&&!hasLastAnd)
                {
                    url=url+"&";
                }
            }else
            {
                url=url+"?";
            }
            return url+$.param(obj,isTraditional);
        }
        return $.param(obj,isTraditional);
    };
    /**往url后面拼参数,自带随机数
     * @param {String} str 要拼的url地址
     * @param {Object} obj 要拼的参数对象，例如{name:"abc"}
     * @param isTraditional
     * @return {String} 返回拼好的url，例如http://xx.com?name=abc&_=134343434
     * @member ef.util*/
    _.url=function(url,obj,isTraditional)
    {
        return this.param({"_": (new Date()).getTime()+""+Math.floor(Math.random()*100000)},this.param(obj||{},url,isTraditional),isTraditional);
    };
    this.explore = function (Class) {
        this[name] = Class;
    };
    /**加密
     * @param {String} str 要加密的字符串
     * @member ef.util*/
    _.encrypt=function(str)
    {
        str=this.base64_encode(str);
        str=str.replace(/=/g,"EstedN");
        return str;
    };
    /**解密
     * @param {Sting} str 要解密的字符串
     * @member ef.util*/
    _.decrypt=function(str)
    {
        str=str.replace(/EstedN/g,"=");
        return this.base64_decode(str);
    };
    /**获取浏览器参数
     * @param {String} name required 要获取参数名
     * @param {String} url 如果不从浏览器获取，可以填写一个地址字符串
     * @return {Stirng} 返回获取的值，如果没有返回undefined
     * @member ef.util*/
    _.getQueryString=function (name,url)
    {
        url=String(url||ef.root.location.href);
        var reg = new RegExp("(\\?|&)"+ name +"=([^&]*)(&|$)");
        var result =url.match(reg);
        if(result&&this.isArray(result))
        {
            return decodeURIComponent(result[2]);
        }else
        {
            return undefined;
        }
    };
    _.base64_encode=function(str){
        var c1, c2, c3;
        var base64EncodeChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
        var i = 0, len= str.length, string = '';

        while (i < len){
            c1 = str.charCodeAt(i++) & 0xff;
            if (i == len){
                string += base64EncodeChars.charAt(c1 >> 2);
                string += base64EncodeChars.charAt((c1 & 0x3) << 4);
                string += "==";
                break;
            }
            c2 = str.charCodeAt(i++);
            if (i == len){
                string += base64EncodeChars.charAt(c1 >> 2);
                string += base64EncodeChars.charAt(((c1 & 0x3) << 4) | ((c2 & 0xF0) >> 4));
                string += base64EncodeChars.charAt((c2 & 0xF) << 2);
                string += "=";
                break;
            }
            c3 = str.charCodeAt(i++);
            string += base64EncodeChars.charAt(c1 >> 2);
            string += base64EncodeChars.charAt(((c1 & 0x3) << 4) | ((c2 & 0xF0) >> 4));
            string += base64EncodeChars.charAt(((c2 & 0xF) << 2) | ((c3 & 0xC0) >> 6));
            string += base64EncodeChars.charAt(c3 & 0x3F)
        }
        return string
    };
    _.base64_decode=function(str){
        var c1, c2, c3, c4;
        var base64DecodeChars = [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
            -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
            -1, -1, -1, -1, -1, -1, -1, 62, -1, -1, -1, 63, 52, 53, 54, 55, 56, 57,
            58, 59, 60, 61, -1, -1, -1, -1, -1, -1, -1, 0,  1,  2,  3,  4,  5,  6,
            7,  8,  9,  10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24,
            25, -1, -1, -1, -1, -1, -1, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36,
            37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, -1, -1, -1,
            -1, -1];
        var i=0, len = str.length, string = '';

        while (i < len){
            do{
                c1 = base64DecodeChars[str.charCodeAt(i++) & 0xff]
            } while (
            i < len && c1 == -1
                );

            if (c1 == -1) break;

            do{
                c2 = base64DecodeChars[str.charCodeAt(i++) & 0xff]
            } while (
            i < len && c2 == -1
                );

            if (c2 == -1) break;

            string += String.fromCharCode((c1 << 2) | ((c2 & 0x30) >> 4));

            do{
                c3 = str.charCodeAt(i++) & 0xff;
                if (c3 == 61)
                    return string;

                c3 = base64DecodeChars[c3]
            } while (
            i < len && c3 == -1
                );

            if (c3 == -1) break;

            string += String.fromCharCode(((c2 & 0XF) << 4) | ((c3 & 0x3C) >> 2));

            do{
                c4 = str.charCodeAt(i++) & 0xff;
                if (c4 == 61) return string;
                c4 = base64DecodeChars[c4]
            } while (
            i < len && c4 == -1
                );

            if (c4 == -1) break;

            string += String.fromCharCode(((c3 & 0x03) << 6) | c4)
        }
        return string;
    };
    /**去除html标签
     * @member ef.util*/
    _.trimHtml=function(str)
    {
        var reg=/<[^>]*>/g;
        return str.replace(reg,"");
    };
    /**
     * 去除所有脚本，中间部分也删除
     * @member ef.util
     * */
    _.trimScript=function(str)
    {
        var reg=new RegExp('\<script[^>]*?>.*?\</script\>',"g");
        return str.replace(reg,"");
    };
    /**
     * 去除去除图片
     * @member ef.util
     * */
    _.trimImg=function(str)
    {
        var reg=/<img[^>]*>/g;
        return str.replace(reg,"");
    };
    _.getFunctionName=function(fn)
    {
        var str=String(fn);
        var reg=/^function\s+(\w+)()/;
        var results=str.match(reg);
        return results?results[1]:"";
    };
    /**中文转换为unicode码
     * @member ef.util
     * */
    _.cn2unicode=function(str)
    {
        if(!str)return undefined;
        var temp=escape(str);
        return temp.replace(/%/g,"\\");
    };
    /**
     * 多条件查询,
     * data 原数据
     * param结构:
     * {
     *    key:"",
     *    value:"要过滤的值",如果不需要过滤请不要写value
     *    filterFunction:function()
     *    {
     *       回调查询函数，替换掉默认要要过滤的key及value条件
     *    }
     * }
     * */
    _.search=function(data)
    {
        var arrs=this.arg2arr(arguments);
        arrs.shift();
        var resultTmp=[];
        for(var i=0;i<arrs.length;i++)
        {
            var param=arrs[i];
            if(!i)
            {
                resultTmp=data;
            }
            resultTmp= _.filter(resultTmp,function(item)
            {
                if(param.filterFunction)
                {
                    return param.filterFunction(item);
                }
                if(String(param.value).length)
                {
                    return item[param.key]==param.value;
                }else
                {
                    return true;
                }
            });
        }
        return{
            total:resultTmp.length,
            rows:resultTmp
        };

    };
    /**
     * unicode转中文
     * @member ef.util
     * */
    _.unicode2cn=function(str)
    {
        if(!str)return undefined;
        var temp=str.replace(/\\+/g,"%");
        return unescape(temp);
    };
    /**
     * 获取ECharts 线条颜色
     * */
    _.EchartsColor={
        "setColorList":[],
        "colorList":["#e32028","#1a08b7","#7e08b7","#0899b7","#1aa100","#1ad99c","#fff000","#d7931e","#2f72e0","#f75b36","#dc88ff","#2fd1e0","#59e02f","#4e93f2","#f7b136","#89e2f5"],// 默认颜色表
        "colorCache":[{data:[{"name":"cpu",color:"#e32028"},{"name":"mem",color:"#e32028"}],
            type:"info"
        }],
        "setColor":function(arr){ //重构颜色表
            if(!_.isArray(arr)){
                return ;
            }
            this.setColorList=arr;
        },
        "clearColor":function(bool){
            if(_.isBoolean(bool)){
                if(bool){
                    this.colorCache=[{data:[{"name":"cpu",color:"#e32028"},{"name":"mem",color:"#e32028"}],
                        type:"info"
                    }]
                }
            }
        },
        "getColor":function(name,type){
            if(!name&&!type){
                return [];
            }
            var colorAll=this.colorList;
            if(this.setColorList.length>0){
                colorAll=this.setColorList;
            }
            if(this.colorCache.length>colorAll.length){
                return [];
            }
            var color=null;
            var istype=false;
            $(this.colorCache).each(function(i,il){
                if(il.type==type){
                    istype=true;
                    $(il.data).each(function(e,el){
                        if(el.name==name){
                            color=el.color;
                        }
                    })
                }
            })
            if(!istype){
                this.colorCache.push({
                    "type":type,
                    "data":[]
                })
            }
            if(!color){
                $(this.colorCache).each(function(i,il){
                    if(il.type==type){
                        var num=il.data.length;
                        il.data.push({
                            "name":name,
                            color:colorAll[num]
                        })
                        color=colorAll[num];
                    }
                })
            }
            console.log(this.colorCache,color);
            var itemdata={
                itemStyle:{
                    normal:{
                        color: color //图标颜色
                    }
                },
                lineStyle:{
                    normal:{
                        width:2,  //连线粗细
                        color: color  //连线颜色
                    }
                }
            };
            return itemdata;
        }
    };

    require(["framework.core"],function(ef)
    {
        /**
         *
         * 用在页面加载完后并且跨页传递了数据（ef.goto(a,b,data)传递了格式化数据）后通知回调函数,［建议使用ef.localStorage存储数据及获取数据替代此方法］
         * @param {Function} callback 回调执行函数
         *
         * **使用范例**：
         *
         *     @example
         *     //前页传递数据
         *     ef.goto("a","b",ef.util.formatPageData({name:"a",age:2}));
         *     //后页获取数据
         *     ef.util.ready(function (dom) {
         *          console.log(ef.util.getCrossData(dom));//输出 {name:"a",age:2}
         *     });
         * @member ef.util
         */
        _.ready = function (callback) {
            var timer=new ef.Timer(10,function () {
                var _dom = $("._temp_data_cont___");
                if (_dom.length) {
                    timer.destory();
                    callback(_dom);
                }
            },null,true);
            timer.start();
        };
        ef.register(_);
    });
    return _;
});
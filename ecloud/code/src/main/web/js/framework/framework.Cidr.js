/**
 * Created by wangahui1 on 16/4/19.
 */
define("framework.cidr",["require","exports"],function(require,exports)
{
    /**
     *
     * 获取Cidr的class 请通过ef.util.getCidr获取
     * @class Cidr
     * @param {String} config 要生成cidr字符串表达式
     * */
    function Cidr(config,defaultRange,isAll,exclude) {
        defaultRange=defaultRange||[16,28];
        /**Cidr是否有效*/
        this.isValidate = false;
        this.ip = null;
        this.isAll=isAll;
        this.exclude=exclude;
        if(defaultRange.length!=2)
        {
            return false;
        }
        /**匹配cidr合法性的正则*/
        this.reg = /^((\d{1,3}\.){3}(\d{1,3}))\/(\d{1,3})$/;
        if (!this.reg.test(config)) {
            return false
        }
        var _result = config.match(this.reg);
        if (!_.isValidIp(_result[1])) {
            return false;
        }
        if (_result[4] > defaultRange[1] || _result[4] < defaultRange[0]) {
            return false
        }
        var pre_reg = /^((\d{1,3}\.){2}(\d{1,3}))/;
        /**获取cidr中的ip*/
        this.ip = _result[1];
        /**@readonly @type {String}获取cidr前缀*/
        this.prefix = config.match(pre_reg)[0];
        this.config = config;
        this.isValidate = true;
        this.init(_result);
        return this;
    }
    /**初始化
     * @protected */
    Cidr.prototype.init = function (result) {
        this.ip = result[1].split(".");
        this.start = result[4];
        this.end = 32;
        this.mask = this.getMask10();
    };
    /**
     * 获取掩码数组
     * @return {Array} 掩码数组
     * */
    Cidr.prototype.getMask = function () {
        var _hexArrs = this.ip2hex2("255.255.255.255").join("").split("");
        var _self = this;
        $(_hexArrs).each(function (i) {
            if (i >= _self.start && i < _self.end) {
                _hexArrs[i] = 0;
            }
            if (i % 8 == 7) {
                _hexArrs[i] = _hexArrs[i] + ".";
            }
        });
        var _hexArrs = _hexArrs.join("").split(".");
        _hexArrs.length = 4;
        return _hexArrs;
    };
    /**
     * 获取非掩码数组
     * @return {Array} 非掩码数组
     * */
    Cidr.prototype.getNotMask = function () {
        var arrs = _.copyDeepProperty(this.mask);
        $(arrs).each(function (i, il) {
            arrs[i] = 255 - il;
        });
        return arrs;
    };
    /**
     * 获取广播地址
     * @return {Array}
     * */
    Cidr.prototype.getBroadAddress = function () {
        var _notMask = _.copyDeepProperty(this.getNotMask());
        var _address = this.getNetAddress();
        $(_notMask).each(function (i, il) {
            _notMask[i] = il + _address[i];
        });
        return _notMask;
    };
    /**
     * 获取ip范围,包括起始地址,广播地址
     * @return {Array}
     * */
    Cidr.prototype.getIpRange = function () {
        var _start = this.getNetAddress();
        var _end = this.getBroadAddress();
        return [_start.join("."), _end.join(".")];
    };
    /**获取起、至的ip范围，去掉第一个ip和最后一个ip*/
    Cidr.prototype.getIpZone = function () {
        var start=this.getNetAddress()[3];
        var end=this.getBroadAddress()[3];
        //console.log(start,end);
        if(!this.isAll)
        {
            start = start + 1;
            end = end - 1;
        }
        if(start==this.exclude)
        {
            start=start+1;
        }
        if(end==this.exclude)
        {
            end=end-1;
        }
        //if(start==0)
        //{
        //    start=1;
        //}else{}
        //if(end==255)
        //{
        //    end=254;
        //}else{}
        return [start, end];
    };
    Cidr.prototype.getMask10 = function () {
        var _mask = this.getMask();
        var _self = this;
        $(_mask).each(function (i, il) {
            _mask[i] = _self.getHex10(il);
        });
        return _mask;
    };
    Cidr.prototype.getHex10 = function (num) {
        return parseInt(num, 2);
    };
    Cidr.prototype.pad = function (num, n) {
        var len = num.toString().length;
        while (len < n) {
            num = "0" + num;
            len++;
        }

        return num;
    };
    Cidr.prototype.ip2hex2 = function (ip) {
        var arrs = ip.split(".");
        var _self = this;
        $(arrs).each(function (i, el) {
            var num = Number(el).toString(2);
            arrs[i] = _self.pad(num, 8);
        });
        return arrs;
    };
    Cidr.prototype.getNetAddress = function () {
        var _result = [];
        var _self = this;
        $(this.ip).each(function (i, il) {
            _result[i] = il & _self.mask[i];
        });
        return _result;
    };
    require(["framework.core"],function(ef)
    {
        ef.register(Cidr,"Cidr");
    });
    return Cidr;
});
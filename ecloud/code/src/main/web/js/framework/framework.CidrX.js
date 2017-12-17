/**
 * Created by ahuiwang on 2016/8/26.
 */
define("framework.cidrX",["require","exports"],function(require,exports)
{
    require(["framework.cidr"]);
    function CidrX(cidrString)
    {
        this.range=[16,28];
        this.ip = null;
        this.isValidate = false;
        /**匹配cidr合法性的正则*/
        this.reg = /^((\d{1,3}\.){3}(\d{1,3}))\/(\d{1,3})$/;
        if (!this.reg.test(cidrString)) {
            return false
        }
        var _result = cidrString.match(this.reg);
        if (!_.isValidIp(_result[1])) {
            return false;
        }
        if (_result[4] > this.range[1] || _result[4] < this.range[0]) {
            return false
        }
        this.pre_reg = /^((\d{1,3}\.){2}(\d{1,3}))/;
        this.ip = _result[1];
        this.ips=[];
        this.gateCount=_result[4];
        var preMatch=cidrString.match(this.pre_reg);
        this.all_reg=/(\d{1,3})/g;
        var allResults=this.ip.match(this.all_reg);
        this.pos1=allResults[0];
        this.pos2=allResults[1];
        this.pos3=allResults[2];
        this.pos4=allResults[3];
        this.cidr=cidrString;
        this.segments=[];
        this.ipSegments=[];
        this.compute();
        this.isValidate = true;
        return this;
    }
    CidrX.prototype.compute=function()
    {
        var that=this;
        this.segments=this.getIpSegments(this.pos1,this.pos2,this.pos3,this.pos4,this.gateCount);
        this.ipSegments=ef.util.map(this.segments,function(seg)
        {
            return that.spellIp(that.pos1,that.pos2,seg,that.pos4);
        });
        this.ips=this.getFullIps();
    };
    CidrX.prototype.spellIp=function()
    {
        return _.arg2arr(arguments).join(".");
    };
    /**获取ip段*/
    CidrX.prototype.getIpSegments=function(pos1,pos2,pos3,pos4,gateCount)
    {
        var arrs=[];
        if(gateCount>=24)
        {
            return [pos3];
        }
        var pos3Trans=_.radix2(pos3);
        pos3Trans=this.pad(pos3Trans,8);
        var sep=gateCount-16;
        var pos3Prefix=pos3Trans.substring(0,sep);
        var start=_.radix10(this.append(pos3Prefix,8));
        var end=_.radix10(this.append(pos3Prefix,8,1));
        arrs=_.range(start,end+1);
        return arrs;
    };
    /**前面追加字符*/
    CidrX.prototype.pad = function (str,n,char) {
        char=char||"0";
        var len = str.toString().length;
        while (len < n) {
            str = char + str;
            len++;
        }
        return str;
    };
    /**后面追加字符*/
    CidrX.prototype.append=function(str,n,char)
    {
        char=char||"0";
        var len = str.toString().length;
        while (len < n) {
            str = str+char;
            len++;
        }
        return str;
    };

    /**获取所有段下ip集合*/
    CidrX.prototype.getFullIps=function()
    {
        var that=this;
        var ips=[];
        ips=_.map(this.segments,function(item)
        {
            return that.getIpsBySegment(item);
        });
        return ips;
    };
    /**获取某个段下ips集合*/
    CidrX.prototype.getIpsBySegment=function(seg)
    {
        var that=this;
        if(!this.isInSegment(seg))
            return false;
        var cidrStr=this.getCidrBySegement(seg);
        var cidr=new ef.Cidr(cidrStr);
        var range=cidr.getIpZone();
        var ips=_.range(range[0],range[1]+1);
        return _.map(ips,function(item)
        {
            return that.spellIp(that.pos1,that.pos2,seg,item);
        });
    };
    CidrX.prototype.isInSegment=function(seg)
    {
        return _.find(this.segments,function(item){return item==seg})!=undefined;
    };
    CidrX.prototype.getCidrBySegement=function(seg)
    {
        if(!this.isInSegment(seg))
            return false;
        return this.pos1+"."+this.pos2+"."+seg+"."+this.pos3+"/"+this.gateCount;
    };
    CidrX.prototype.getCidrByIpSeg=function(seg)
    {
        if(!_.isValidIp(seg))
        {
            return false;
        }
        return seg+"/"+this.gateCount;
    };
    /**
     * 根据段获取所有cidr表达式
     * */
    CidrX.prototype.getFullCidr=function()
    {
        var that=this;
        return _.map(this.ipSegments,function(item)
        {
            return that.getCidrByIpSeg(item);
        });
    };
    require(["framework.core"],function(ef)
    {
        ef.register(CidrX,"CidrX");
    });
    return CidrX;
});
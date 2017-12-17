/**
 * Created by ahuiwang on 2016/8/23.
 */
;define("framework.cidrWidget", ["exports", "framework.core"], function (exports, ef) {
    function CidrWidget(box,data,config)
    {
        this.box=box;
        this.data=data;
        this.config=config;
        this.container=$('<div class="ef-cidr-widget">' +
            '<span class="1_pos ef-cidr-pos"><input /></span>'+
                '<sub>.</sub>'+
            '<span class="2_pos ef-cidr-pos"><input /></span>'+
                '<sub>.</sub>'+
            '<span class="3_pos ef-cidr-pos"><input /></span>'+
                '<sub>.</sub>'+
            '<span class="4_pos ef-cidr-pos"><input /></span>'+
            '<span>/</span>'+
            '<span class="0_pos ef-cidr-pos"><input/></span>' +
            '</div>');
        this.draw();
        return this;
    }
    CidrWidget.prototype.init=function()
    {
        this.isValidate=false;
        this.segments=[];
        this._changeCallback=(this.data&&this.data.onChange?this.data.onChange:null)||$.noop;
        this.gateData=_.map(_.range(16,29),function(val)
        {
            return {label:val,value:val};
        });
        this.option=
        {
            pos1:
            {
                width:40,
                height:30
            },
            pos2:
            {
                width:40,
                height:30
            },
            pos3:
            {
                width:40,
                height:30
            },
            pos4:
            {
                width:40,
                height:30
            },
            gate:
            {
                width:50,
                height:30
            }
        };
        _.copy(this.config,this.option);
    };
    CidrWidget.prototype.draw=function()
    {
        var that=this;
        this.init();
        this.box.empty();
        this.box.append(this.container);
        this.pos1=this.container.find(".1_pos input").numberbox({
            width:this.option.pos1.width||40,
            height:this.option.pos1.height||30,
            min:0,max:255,value:10,required:true});
        this.pos2=this.container.find(".2_pos input").numberbox(
            {
                width:this.option.pos2.width||40,
                height:this.option.pos2.height||30,
                min:0,max:255,value:0,required:true});
        this.pos3=this.container.find(".3_pos input").numberbox(
            {
                width:this.option.pos3.width||40,
                height:this.option.pos3.height||30,
                min:0,max:255,value:0,required:true});
        this.pos4=this.container.find(".4_pos input").numberbox(
            {
                width:this.option.pos4.width||40,
                height:this.option.pos4.height||30,
                min:0,max:255,value:0,required:true});
        this.geteCount=this.container.find(".0_pos input").combobox(
            {
                width:this.option.gate.width||50,
                height:this.option.gate.height||30,
                valueField:'value',
                textField:'label',
                editable:false,
                required:true,
                data:this.gateData
            });
        this.pos1.next().tooltip({content:_.getLocale("cidr.input.range.tip",0,255)});
        this.pos2.next().tooltip({content:_.getLocale("cidr.input.range.tip",0,255)});
        this.pos3.next().tooltip({content:_.getLocale("cidr.input.range.tip",0,255),onShow:function(e)
        {
            var readonly=that.pos3.numberbox("options").readonly;
            if(readonly)
            {
                $(this).tooltip("tip").hide();
            }
        }});
        this.pos4.next().tooltip({content:_.getLocale("cidr.input.range.tip",0,255),onShow:function(e)
        {
            var readonly=that.pos4.numberbox("options").readonly;
            if(readonly)
            {
                $(this).tooltip("tip").hide();
            }
        }});
        this.geteCount.next().tooltip({content:_.getLocale("cidr.input.range.tip",16,28)});
        this.addListener();
    };
    CidrWidget.prototype.addListener=function()
    {
        var that=this;
        this.pos1.numberbox({onChange:function()
        {
            that.compute();
        }});
        this.pos2.numberbox({onChange:function()
        {
            that.compute();
        }});
        this.pos3.numberbox({onChange:function()
        {
            that.compute();
        }});
        this.pos4.numberbox({onChange:function()
        {
            that.compute();
        }});
        this.geteCount.combobox({onChange:function()
        {
            that.compute(true);
        }});
    };
    CidrWidget.prototype.compute=function(isGateChange)
    {
        var pos1=this.pos1.numberbox("getValue");
        var pos2=this.pos2.numberbox("getValue");
        var pos3=this.pos3.numberbox("getValue");
        var pos4=this.pos4.numberbox("getValue");
        var gateCount=this.geteCount.combobox("getValue");
        var cidrString=pos1+"."+pos2+"."+pos3+"."+pos4+"/"+gateCount;
        var cidr=new ef.Cidr(cidrString,[16,28]);
        this.isValidate=cidr.isValidate;
        if(!this.isValidate)return;
        this.pos1Value=pos1;
        this.pos2Value=pos2;
        this.pos3Value=pos3;
        this.pos4Value=pos4;
        this.gateValue=gateCount;
        this.segments=this.getIpSegments(pos1,pos2,pos3,pos4,gateCount);
        if(isGateChange)
        {
            if(this.gateValue==16)
            {
                this.pos3.numberbox("setValue","0");
                this.pos4.numberbox("setValue","0");
                this.pos3.numberbox({readonly:true});
                this.pos4.numberbox({readonly:true});
            }else if(this.gateValue>16&&this.gateValue<=24)
            {
                this.pos3.numberbox({readonly:false});
                this.pos4.numberbox("setValue","0");
                this.pos4.numberbox({readonly:true});
            }else
            {
                this.pos3.numberbox({readonly:false});
                this.pos4.numberbox({readonly:false});
            }
        }
        this._changeCallback();
    };
    /**获取ip段*/
    CidrWidget.prototype.getIpSegments=function(pos1,pos2,pos3,pos4,gateCount)
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
    CidrWidget.prototype.pad = function (str,n,char) {
        char=char||"0";
        var len = str.toString().length;
        while (len < n) {
            str = char + str;
            len++;
        }
        return str;
    };
    /**后面追加字符*/
    CidrWidget.prototype.append=function(str,n,char)
    {
        char=char||"0";
        var len = str.toString().length;
        while (len < n) {
            str = str+char;
            len++;
        }
        return str;
    };
    CidrWidget.prototype.getCidrBySegement=function(seg)
    {
        return this.pos1Value+"."+this.pos2Value+"."+seg+"."+this.pos4Value+"/"+this.gateValue;
    };
    CidrWidget.prototype.setGateValue=function(value)
    {
        this.geteCount.combobox("setValue",value);
    };
    CidrWidget.isDom=true;
    ef.register(CidrWidget,"cidrWidget");
    return CidrWidget;
});
/**
 * Created by hanye on 2016/5/10.
 */
define("framework.cn2uni",["exports","framework.core"],function(exports,ef)
{
    function Cn2uni(box) {
        this.box = box;
        this.container = $('<textarea class="ef-text2Change" cols="30" rows="20" id="text"></textarea>');
        this.show = $('<textarea class="ef-text2Change" cols="30" rows="20"></textarea>');
        this.copy=$('<button type="button" class="ef-copyAll" id="copyAll"></button>');
        this.draw();
        return this;
    }
    Cn2uni.isDom=true;
    Cn2uni.prototype.cn2unicode=function(str){
        /**中文转换为unicode码
         * @member ef.util
         * */
        return _.cn2unicode(str);
    };
    Cn2uni.prototype.unicode2cn=function(str){
        /**
         * unicode转中文
         * @member ef.util
         * */
        return _.unicode2cn(str);
    };
    Cn2uni.prototype.draw=function(){
        var _self=this;
        this.container.attr("placeholder", _.getLocale("framework.component.cn2uni.textarea.text"));
        this.copy.text(_.getLocale("framework.component.cn2uni.copy.value"));
        this.box.empty();
        this.container.empty();
        this.box.append(this.container);
        this.box.append(this.show);
        this.box.append(this.copy);
        this.container.keyup(function(){
            var cn,uni,q,delblk,m,addStrr="";//cn,uni为存储转码之后的内容，q存储转码后的内容去除最后一个等号后的字符串,m为存储去除换行后的字符串的变量
            var str=$('#text').val();//获取用户输入的需转码内容
            var strr=str.split("=");//根据=分割，避免=转码unicode
            for(var i=0;i<strr.length;i++){
                if(strr[i].match(/\\+/g))
                {
                    cn=_.unicode2cn(strr[i]);
                    addStrr+=(cn+"=");
                }else
                {
                    uni=_.cn2unicode(strr[i]);
                    addStrr+=(uni+"=");
                }
            }
            q=addStrr.substring(0,addStrr.length-1);//去除字符串中最后一个=
            delblk= q.replace(/[\\][2][0]/g," ");//去除空格操作
            if(delblk.match(/[\\][0][A]/g)){//替代换行的操作
                m=delblk.replace(/[\\][0][A]/g,"\n");
                _self.show.empty().val(m);
            }else{
                _self.show.empty().val(delblk);
            }
        });
        this.copy.click(function(){
            _self.show.select();//被选中的需复制内容
            document.execCommand("Copy");//执行复制命令
        })
    };
    ef.register(Cn2uni,"cn2uni");
    return Cn2uni;
});
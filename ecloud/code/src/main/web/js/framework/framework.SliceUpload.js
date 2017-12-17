/**
 * Created by hxf on 2016/8/9.
 */
define("framework.sliceUpload",["exports","framework.core","user"],function(exports,ef,user)
{
    function SliceUpload(box,config) {
        if(!config.url)return;
        this.box=box;
        this.config=config;
        this.sliceValue = 50*1024*1024;
        this.url = null;
        this.tempalte = $('<form enctype="multipart/form-data"><input type="file" name="file" class="fileUpload"></form>');
        this.file = null;
        this.init();
        this.i = 0;
        this.suffix = null;
        this.successCallBack = $.noop;
        this.progressFun = $.noop;
        this.errorCallBack = $.noop;
        this.uploadOpt = null;
        if(config.isTrigger){ this.triggerUpload();}
        return this;
    }
    SliceUpload.isDom=true;
    SliceUpload.prototype.init = function () {
        this._header =
        {
            "Ecloud-Token": user.getToken(),
            "Ecloud-Method": "POST"
        };
        this.box.append(this.tempalte);
        if(this.config.url){this.url = this.config.url;}
        if(this.config.styleClass){this.tempalte.addClass(this.config.styleClass);}
        if(this.config.sliceValue){this.sliceValue = this.config.sliceValue;}
    };
    //SliceUpload.prototype.progress = function (e) {
    //    console.log(e);
    //    return obj = {loaded: e.loaded};
    //};
    SliceUpload.prototype.addListener = function () {
        var _self = this;
        var name = this.file.name,
            size = this.file.size,
            shardSize = this.sliceValue,
            shardCount = Math.ceil(size / shardSize);
        if(this.i >= shardCount){
            return;
        }
        var start = this.i * shardSize,
            end = Math.min(size, start + shardSize);
        var form = new FormData();
        form.append("data", this.file.slice(start,end));
        this.suffix = (this.file.name.split(".")).pop();
        form.append("filename", this.file.uuid+"."+this.suffix);

        _self.uploadOpt = $.ajax({
            url: _self.url,
            type: "POST",
            data: form,
            async: true,
            processData: false,
            contentType: false,
            headers:_self._header,
            //xhr: function(){ //获取ajaxSettings中的xhr对象，为它的upload属性绑定progress事件的处理函数
            //
            //    myXhr = $.ajaxSettings.xhr();
            //    if(myXhr.upload){ //检查upload属性是否存在
            //        //绑定progress事件的回调函数
            //        myXhr.upload.addEventListener('progress',_self.progress, false);
            //    }
            //    //return myXhr; //xhr对象返回给jQuery使用
            //},
            success: function(data){
                if(data&&data.success){
                    _self.i = _self.i+1;
                    var num = Math.ceil(_self.i*100 / shardCount);
                    _self.addListener(_self.file,_self.i);
                    if(_self.i==shardCount){
                        data.result.last = 'over';
                    }
                    _self.successCallBack(data,num);
                }
                else{
                    _self.errorCallBack();
                }
            }
        });
    };
    SliceUpload.prototype.uploadClick = function (success,error) {
        var _self = this;
        var f = this.box.find(".fileUpload");
        if($.trim(f.val())==''){ef.placard.warn("请选择上传文件");return;}
        this.file = this.box.find(".fileUpload")[0].files[0];
        this.file.uuid = ef.util.getUUID();
        //if(progressFun){
        //    progressFun(_self.progress());
        //}
        if(success){
            _self.successCallBack = success;
            _self.errorCallBack = error;
        }
        this.addListener();
    };
    SliceUpload.prototype.triggerUpload = function () {
        var _self = this;
        this.box.find(".fileUpload").change(function () {
            _self.uploadClick();
        });
    };
    SliceUpload.prototype.change = function (fun) {
        var _self = this;
        this.box.find(".fileUpload").change(function () {
            _self.file = _self.box.find(".fileUpload")[0].files[0];
            _self.suffix = (_self.file.name.split(".")).pop();
            if(fun){fun(_self.suffix);}
        });
    };
    SliceUpload.prototype.stopPost = function (callback) {
        this.uploadOpt.abort();
        if(callback){callback();}
    };
    ef.register(SliceUpload,"sliceUpload");
    return SliceUpload;
});
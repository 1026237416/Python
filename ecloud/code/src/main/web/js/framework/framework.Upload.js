/**
 * Created by wangahui1 on 16/4/20.
 */
define("framework.upload",["exports","framework.core"],function(exports,ef)
{
    /**上传组件
     * @class ef.Upload
     *
     * **使用范例**：
     *
     *     @example
     *     $(dom).upload({id:"file",url:"http://www.baidu.com",type:"put"});
     * */
    function Upload(box,config) {
        if(!config)return;
        this.box=box;
        this.config=config;
        this.label=config.label|| _.getLocale("framework.upload.label.text");
        this.filters=config.filters||["."];
        this.container=$('<div class="ef-upload">' +
            '<form>' +
            '<div class="ef-upload-elements"></div>' +
            '<div class="ef-upload-state-box"><span class="upload-state"></span><span class="ef-upload-file-span"><span class="ef-upload-file-text"><i></i></span><input type="file" class="ef-upload-file"></span></div>' +
            '</form></div>');
        this.ajax=null;
        this.state="unselect";
        this.init();
        this.addListener();
        return this;
    }
    Upload.isDom=true;
    Upload.prototype.addListener=function()
    {
        var _self=this;

        this.uploadBtn.click(function()
        {
            if(!_self.input.val())
            {
                ef.placard.warn(_.getLocale("framework.component.upload.toselect"));
                return;
            }
            if(!_self.isValid())
            {
                ef.placard.warn(_.getLocale("framework.component.upload.element.valid"));
                return;
            }
            _self.changeState("uploading");
            _self.getElementsValue();
            _self.ajax=ef.getJSON(
                {
                    isFormData:true,
                    form:_self.form,
                    async: false,
                    cache: false,
                    contentType: false,
                    processData: false,
                    url: _self.config.url,
                    type:_self.config.type,
                    isUpload:true,
                    success:function(response)
                    {
                        _self.changeState("success");
                        _self.successCallback(response);
                        _self.input.val("");
                    },
                    error:function(error)
                    {
                        _self.changeState("fail");
                        _self.failCallback(error);
                        _self.input.val("");
                    }
                });
        });
        this.cancelBtn.click(function()
        {
            if(_self.state=="uploading")
            {
                _self.ajax.abort();
            }
            _self.changeState("unselect");
        });
        this.input.change(function(event)
        {
            var val=$(this).val();
            if(!val)
            {
                _self.changeState("unselect");
                return;
            }
            if(!_self.validType())
            {
                _self.changeState("selectfail",_self.filters.join(", *"),true);
                $(this).val("");
                return;
            }
            _self.selectCallback(val);
            _self.changeState("selected",val);
        });
        this.input.click(function()
        {
            if(_self.state=="success"||_self.state=="fail")
            {
                _self.changeState("unselect");
            }
        });
        this.deleteBtn.click(function()
        {
            _self.input.change();
            _self.changeState("unselect");
        });
        this.stateDom.find("i").click(function()
        {
            if($(this).hasClass("ef-upload-icon-fail")||$(this).hasClass("ef-upload-icon-success"))
            {
                _self.changeState("unselect");
            }
        });
    };
    Upload.prototype.changeState=function(state,val)
    {
        this.state=state;
        this.stateDom.find(".upload-state").text(_.getLocale("framework.component.upload.state."+state,val));
        this.stateDom.find(".upload-state").attr("title",this.stateDom.text());
        this.stateDom.removeClass();
        this.stateDom.addClass("ef-upload-state-box").addClass("ef-upload-state-"+state);
        this.stateDom.find("i").removeClass();
        this.stateDom.find("i").addClass("ef-upload-icon-"+state);
        switch(state)
        {
            case "unselect":
            {
                this.input.val("");
                break;
            }

        }
    };
    Upload.prototype.validType=function()
    {
        var val= $.trim(this.input.val());
        if(!val.length)return false;
        var arrs=[];
        $(this.filters).each(function(i,il)
        {
            arrs.push("("+il+")");
        });
        var reg=new RegExp(arrs.join("|")+"$","g");
        return reg.test(val);
    };
    Upload.prototype.init=function()
    {
        this.elements=[];
        this.box.append(this.container);
        this.fileId=this.config.id||"file";
        this.form=this.container.find("form");
        this.input=this.form.find("input[type='file']");
        this.input.attr("name",this.fileId);
        this.input.attr("id",this.fileId);
        this.uploadBtn=this.box.next().find("span.upload_ok");
        this.cancelBtn=this.form.find("i.ef-upload-cancel");
        this.deleteBtn=this.form.find("button.ef-upload-delete");
        //this.uploadBtn.text(_.getLocale("framework.upload.btn.upload.text"));
        //this.cancelBtn.text(_.getLocale("framework.upload.btn.cancel.text"));
        //this.deleteBtn.text(_.getLocale("framework.upload.btn.delete.text"));
        if(this.config.formElements)
        {
            this.createElements(this.config.formElements);
        }
        this.selectCallback=this.config.select|| $.noop;
        this.uploadCallback=this.config.upload|| $.noop;
        this.cancelCallback=this.config.cancel|| $.noop;
        this.deleteCallback=this.config.delete|| $.noop;
        this.successCallback=this.config.success|| $.noop;
        this.failCallback=this.config.fail|| $.noop;
        this.stateDom=this.form.find(".ef-upload-state-box");
        this.changeState("unselect");
    };
    Upload.prototype.createElements=function(options)
    {
        var _self=this;
        if(!_.isArray(options))return;
        $(options).each(function(i,il)
        {
            _self.createElement(il);
        });
    };
    Upload.prototype.createElement=function(option)
    {
        var dom=$('<div class="ef-upload-element"><input class="ef-ele"><input type="hidden" class="ef-input-hidden"></div>');
        var hid=dom.find('input.ef-input-hidden:hidden');
        hid.attr("name",option.id);
        dom.find("input.ef-ele")[option.type](option);
        this.form.find(".ef-upload-elements").append(dom);
        var element=new this.Element();
        element.dom=dom.find("input.ef-ele");
        element.option=option;
        element.input=hid;
        this.elements.push(element);
    };
    Upload.prototype.Element=function()
    {
        this.dom=null;
        this.option=null;
        this.input=null;
    };
    Upload.prototype.isValid=function()
    {
        if(!this.elements.length)return true;
        var valid=true;
        $(this.elements).each(function(i,ele)
        {
            var _valid=ele.dom[ele.option.type]("isValid");
            if(!_valid)
            {
                valid=_valid;
            }
        });
        return valid;
    };
    Upload.prototype.getElementsValue=function()
    {
        var result={};
        $(this.elements).each(function(i,ele)
        {
            var value=ele.dom[ele.option.type]("getValue");
            ele.input.val(value);
            result[ele.option.id]=value;
        });
        return result;
    };
    Upload.prototype.onSelect=function(fn)
    {
        this.selectCallback=fn||this.selectCallback;
    };
    Upload.prototype.onUpload=function(fn)
    {
        this.uploadCallback=fn||this.uploadCallback;
    };
    Upload.prototype.onCancel=function(fn)
    {
        this.cancelCallback=fn||this.cancelCallback;
    };
    Upload.prototype.onDelete=function(fn)
    {
        this.deleteCallback=fn||this.deleteCallback;
    };
    Upload.prototype.onSuccess=function(fn)
    {
        this.successCallback=fn||this.successCallback;
    };
    Upload.prototype.onFail=function(fn)
    {
        this.failCallback=fn||this.failCallback;
    };
    /**上传*/
    Upload.prototype.upload=function()
    {
        this.uploadCallback();
    };
    /**取消*/
    Upload.prototype.cancel=function()
    {
        this.cancelCallback();
    };
    /**删除*/
    Upload.prototype.delete=function()
    {
        this.deleteCallback();
    };
    /**成功*/
    Upload.prototype.success=function()
    {
        this.changeState("success");
    };
    /**失败*/
    Upload.prototype.fail=function()
    {
        this.changeState("fail");
    };
    ef.register(Upload,"upload");
    return Upload;
});
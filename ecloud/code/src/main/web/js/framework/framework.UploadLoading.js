/**
 * Created by hxf on 2016/8/18.
 */
define("framework.uploadLoading",["framework.core","exports"],function(ef,exports)
{
    function UploadLoading(box,data){
        this.box = box;
        this.data = data;
        this.clickCallback = $.noop;
        this.data = this.data ? this.data : [];
        this.template = $('<div class="loading-back"><div class="loading-float"></div></div>');
        this.backWidth = 0;
        this.draw();
        return this;
    }
    UploadLoading.isDom=true;
    UploadLoading.prototype.draw = function () {
        this.box.append(this.template);
        this.backWidth = (this.box.find('.loading-back').css('width')).replace(/[^0-9]+/g, '');
        this.transform();
    };
    UploadLoading.prototype.transform = function () {
        if(this.data.value){
            var wid = (this.data.value/100)*this.backWidth;
            this.box.find('.loading-float').css({width:wid});
        }
        if(this.data.onChange)
        {
            this.data.onChange(this.data.value);
        }
    };
    UploadLoading.prototype.setValue = function (value) {
        this.data.value = value;
        this.transform();
    };
    ef.register(UploadLoading,"uploadLoading");
    return this;
});
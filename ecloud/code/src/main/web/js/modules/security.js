/**
 * Created by wangahui1 on 15/12/29.
 */
define("security", ["locale"], function () {
    return {
        //获取密级列表
        getSecurityList: function () {
            return ef.util.copyDeepProperty([this.unset,this.sct,this.cft,this.top]);
        },
        /**根据vlaue获取密级*/
        getSecurityByValue:function(value)
        {
            return ef.util.find(this.getSecurityList(),function(item)
            {
               return item.value==value;
            });
        },
        unset://未分配
        {
            value:0,
            label:$.i18n.prop("security.unset")
        },
        sct://秘密
        {
            value: 1,
            label: $.i18n.prop("security.sct")
        },
        cft://机密
        {
            value: 2,
            label: $.i18n.prop("security.cft")
        },
        top://绝密
        {
            value: 3,
            label: $.i18n.prop("security.top")
        }
    }
});
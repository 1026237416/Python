/**
 * Created by wangahui1 on 15/11/9.
 */
define("locale",function()
{
    var Locale=function()
    {
        this.name="locale language";
    };
    Locale.prototype.settting=
    {
        name:['locale',"error","server"],// 资源文件名称
        path:'../i18n/',// 资源文件所在目录路径
        mode:'map',// 模式：变量或 Map
        language:"zh",
        encoding: 'UTF-8',
        callback: function() {// 回调方法
        }
    };
    /**设置语言，如果不设置将走默认*/
    Locale.prototype.set=function(lang)
    {
        this.settting.language=lang||this.settting.language;
        this._create();
        return this;
    };
    Locale.prototype._create=function()
    {
        $.i18n.properties(this.settting);
    };
    return (new Locale).set();
});
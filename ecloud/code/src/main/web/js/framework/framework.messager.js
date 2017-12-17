/**
 * Created by thomass on 2016/10/9.
 */
define('framework.messager',[
    'exports',
    'framework.core'
],function(exports,ef){
    Messager.titles = {
        deleting:{
            title:_.getLocale("global.messager.title.deleting.tip"),
            icon:''
        },
        warning:{
            title:_.getLocale("global.messager.title.warning.tip"),
            icon:''
        },
        reminding:{
            title:_.getLocale("global.messager.title.reminding.tip"),
            icon:''
        }
    };
    function Messager(){
        this.name = 'ef-framework-messager';
    }
    Messager.prototype.alert = function(title,msg,icon,fn,closefn){
        var params = {
            width:450,
            height:'auto',
            title:Messager.titles[title].title || Messager.titles['reminding'].title,
            msg:'<span class=\"js-frame-confirm\">'+msg+'</span>',
            icon:icon,
            onClose: closefn || $.noop,
            fn:fn
        };
        $.messager.alert.call(this,params);
    };
    Messager.prototype.confirm = function(title,msg,icon,fn){
        var params = {
            width:450,
            height:'auto',
            type:title || 'reminding',
            title:Messager.titles[title].title || Messager.titles['reminding'].title,
            msg:'<span class=\"js-frame-confirm\">'+msg+'</span>',
            icon:icon,
            fn:fn
        };
        $.messager.confirm.call(this,params);
    };
    Messager.isInstance=true;
    ef.register(Messager,"messager");
    return Messager;
});
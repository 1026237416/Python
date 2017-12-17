/**
 * Created by thomas on 2016/5/20.
 */
define([
    'module',
    'exports'
],function(module, exports){
    return function()
    {
        var impls = new ef.Interface.implement();
        impls.context=null;
        impls.owner=null;
        impls.redraw = function(selectedNodeId,context){
            this.selectedNodeId=selectedNodeId;
            this.context=context;
            console.log('selectedNodeId-----',selectedNodeId);
            impls.init();
        };
        impls.destroy = function(){
            require.undef(module.id);
        };
        impls.isValid=function()
        {
            return true;
        };
        impls.getData=function()
        {

        };
        impls.init = function(){
            impls.o = {
                $tabs:$('.tab-box',impls.context)
            };
            impls.utils = {
                initTabs:function(){
                    var $tabs = impls.o.$tabs;
                    ef.i18n.parse();
                    $tabs.tabs(impls.config.tabsConfig);
                }
            };
            impls.config = {
                tabsConfig:{
                    border:false,
                    onSelect:function(title, index){

                    }
                }
            };
            impls.utils.initTabs();
        };

        this.implement=impls;
    };

});

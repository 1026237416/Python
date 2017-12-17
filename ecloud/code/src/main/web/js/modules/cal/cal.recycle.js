/**
 * Created by thomas on 2016/4/22.
 */
define([
    'module',
    'exports',
    'clientPaging'
],function(module, exports, clientPaging){
    var defaultIndex = 0;
    var impls = new ef.Interface.implement();
    //test
    impls.redraw = function(){
        this.init();
    };
    impls.destroy = function(){
        require.undef(modue.id);
    };
    impls.init = function(){
        this.o.$tags.tabs(this.config.tagConfig);
    };
    impls.utils = {
          renderTagContent:function(template,jsModule, parentId){
             $(parentId).empty();
             require.undef(jsModule);
             $(parentId).load(template,function(){
                 require([jsModule],function(tt){
                     tt.redraw();
                     $.parser.parse(parentId);
                 });

             });
          }
    };
    impls.o = {
        $tags:$('#cal-recycle-wrapper')
    };
    impls.config = {
        tagConfig:{
            border:false,
            onSelect:function(title, index){
                defaultIndex = index;
                var config = impls.config.tagContent[defaultIndex];
                impls.utils.renderTagContent(config.temp,config.jsModule,config.parentId);
            }
        },
        tagContent:{
            0:{
                temp:'views/recycleVM.html',
                jsModule:'recycle.vm',
                parentId:'#cal-recycle-vm'
            },
            1:{
                temp:'views/recycleDisk.html',
                jsModule:'recycle.disk',
                parentId:'#cal-recycle-disk'
            }
        }
    };
    return impls;
});

/**
 * Created by thomas on 2016/6/1.
 */
define([
    'module',
    'exports'
],function(module, exports){
    //1-Ëæ»ú,2-¾ùºâ,3-ÌîÂú
    var strategy = [
        {
            id: 1,
            name:ef.util.getLocale('strategy.random')
        },
        {
            id: 2,
            name:ef.util.getLocale('strategy.balance')
        },
        {
            id: 3,
            name:ef.util.getLocale('strategy.cover')
        }
    ];
    return {
        getStrategyList:function(){
            return strategy;
        },
        getStrategy:function(id){
            if(isNaN(parseFloat(id))){
                return null;
            }
            var temp =  _.find(strategy,function(item){
               return item.id == id;
            });
            if(temp){
                return temp.name;
            }
            return temp;
        }
    }
});

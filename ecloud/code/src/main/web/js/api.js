/**
 * Created by wangahui1 on 15/11/19.
 * 获取api的公用模块
 */
define("api",["api.config","module"],function(apiConfig,module)
{
    var impl=new ef.Interface.implement();
    /**根据配置名称获取api地址*/
    impl.getAPI=function(name,isSocket)
    {
        var _url="";
        for(var i in apiConfig)
        {
            var item=apiConfig[i];
            if(name==item.name)
            {
                _url=item.url;
                break;
            }
        }
        return this.getUrl(_url,isSocket);
    };
    /**根据配置url后半部分获取url全地址*/
    impl.getUrl=function(url,isSocket)
    {
        var startReg=/^(\/*)/;
        var endReg=/(\/*$)/;
        var result;
        if(isSocket)
        {
            result="wss://"+window.location.host+"/"+url.replace(startReg,"");
        }else
        {
            result=ef.config.webroot.replace(endReg,"")+"/"+url.replace(startReg,"");
        }
        return result;
    };
    impl._init=function()
    {
            for(var i in apiConfig)
            {
                var item=apiConfig[i];
                $.mockjax(
                    {
                        url:this.getUrl(item.url),
                        proxy:item.proxy,
                        responseText:null,
                        responseTime:100
                    });

            }
    };
    /**获取数据中心
     * @param {Object} param 要发送的查询参数
     * @param {Function} success 成功的回调函数
     * @param {Function} error 失败的回调函数
     * */
    impl.getDataCenter=function(param,success,error)
    {
        ef.getJSON(
            {
                url:this.getAPI("order.wait.Detail.combo.datacenter"),
                data:param,
                success:success,
                error:error
            });
    };
    impl.redraw=function()
    {

    };
    impl.destroy=function()
    {
        require.undef(module.id);
    };
    /**开始解析api配置*/
    impl.parse=function()
    {
        (impl._init)();
    };
   return impl;
});
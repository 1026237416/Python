/**
 * Created by wangahui1 on 16/1/23.
 */
define("idle",["api","signature"],function(api,signature)
{
    var impl=new ef.Interface.implement();
    impl.init=function()
    {
        this.idleTimer=new ef.Timer(1000,impl.get,null,true,"idle");
    };
    /**获取心跳服务数据*/
    impl.get=function()
    {
        ef.getJSON(
            {
                url:api.getAPI("app.idle"),
                type:"get",
                success:function()
                {

                },
                error:function()
                {
                    impl.idleTimer.stop();
                    signature.sessionOut();
                }
            });
    };
    /**开始心跳*/
    impl.start=function()
    {
        if(!this.idleTimer)
        {
            this.init();
        }
        this.idleTimer.start();
    };
    /**停止心跳*/
    impl.stop=function()
    {
        this.idleTimer.destory();
    };
    impl.redraw=function()
    {

    };
    impl.destroy=function()
    {

    };
    return impl;
});
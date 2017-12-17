/**
 * Created by wangahui1 on 16/4/20.
 */
define("framework.sequenceLoader",["exports","framework.core"],function(exports,ef)
{
    /**按顺序异步请求
     * @class ef.SequenceLoader
     * @param {Array} options多个请求的option数组
     *
     * **使用范例**：
     *
     *     @example
     *     var sequence=new ef.SequenceLoader([
     *        {
         *            url:"http://www.baidu.com",
         *            type:"GET",
         *            success:function()
         *            {
         *
         *            },
         *            error:function()
         *            {
         *
         *            }
         *        },
     *        {
         *            url:"http://www.qq.com",
         *            type:"GET",
         *            success:function()
         *            {
         *
         *            },
         *            error:function()
         *            {
         *
         *            }
         *        }]).complete(function(result)
     *        {
         *            console.log(result);
         *        });
     *        });
     * @return ef.SequenceLoader 返回一个序列请求实例
     */
    function SequenceLoader(options)
    {
        this.options=options;
        this.completeCallback= $.noop;
        this.allExecutedCallback=$.noop;
        this.start();
        return this;
    }
    /**开始加载，默认自动调用*/
    SequenceLoader.prototype.start=function()
    {
        if(!this.options||!_.isArray(this.options))
        {
            return;
        }
        /**是否所有请求已经完毕*/
        this.loaded=false;
        /**当前请求的是第几个*/
        this.index=0;
        this.load();
    };
    /**按顺序加载的每次完成回调函数，返回对象包括:
     * {
         *     success:本次请求是否成功
          *    loaded:所有请求是否完成
          *    request:本次请求的对象
          *    response:本次请求结果集
          *    index:本次请求的序号，从零开始
         * }*/
    SequenceLoader.prototype.complete=function(fn)
    {
        this.completeCallback=fn;
        return this;
    };
    SequenceLoader.prototype.load=function(sequence)
    {
        var _self=sequence||this;
        var arg=arguments;
        var option=null;
        if(_self.index<_self.options.length)
        {
            option=_self.options[_self.index];
            var success=option.success;
            var error=option.error;
            option.success=function()
            {
                _self.index++;
                _self.loaded=_self.index>=_self.options.length?true:false;
                success?success(arguments):null;
                _self.doCallback(true,arguments,option,_self.index-1);
                !_self.loaded?arg.callee(_self):_self.allExecutedCallback();
            };
            option.error=function()
            {
                _self.index++;
                _self.loaded=_self.index>=_self.options.length?true:false;
                error?error(arguments):null;
                _self.doCallback(false,arguments,option,_self.index-1);
                !_self.loaded?arg.callee(_self):_self.allExecutedCallback();
            };
            ef.getJSON(option);
        }
    };
    SequenceLoader.prototype.doCallback=function(isSuccess,response,request,index)
    {
        var result=new this.Result();
        result.success=isSuccess;
        result.loaded=this.loaded;
        result.response=response;
        result.request=request;
        result.index=index;
        this.completeCallback(result);
    };
    SequenceLoader.prototype.Result=function()
    {
        this.loaded=false;
        this.success=false;
        this.response=null;
        this.request=null;
        this.index=-1;
    };
    SequenceLoader.prototype.allExecuted=function(fn)
    {
        this.allExecutedCallback=fn;
        return this;
    };
    ef.register(SequenceLoader,"SequenceLoader");
    return SequenceLoader;
});
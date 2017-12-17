/**
 * Created by wangahui1 on 15/11/6.
 */
define(["module"],function(module)
{
    var implement=new ef.Interface.implement();
    implement.redraw=function()
    {

    };
    implement.destroy=function()
    {
        require.undef(module.id);
    };
    return implement;
});
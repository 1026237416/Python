/**
 * Created by wangahui1 on 16/4/19.
 */
define("framework.interface",["exports","framework.core"],function(exports,ef)
{
    /**
     * @abstract
     * #Interface模块接口#
     * {@img interface.png Interface示例}
     * # 描述 #
     * Interface接口用于定义开发模块必需继承的接口对象.默认有重绘和销毁接口.抽象类
     * 重绘接口(redraw)请自行实现

     *
     * **使用范例**：
     *
     *     @example
     *     define(["easyui","module"],function(easyui,module)
     *     {
         *          var implement=new ef.Interface.implement();
         *          implement.test=function()
         *          {
         *
         *          };
         *          //重绘方法,如果是通过ef.goto进行跳转或者通过导航进行页面跳转,则会自动跳用该方法进行重绘.
         *          //这样可以有效的控制界面刷新和easyui的重新解析生成.
         *          implement.redraw=function()
         *          {
         *              this.test();
         *          };
         *          //销毁该模块
         *          implement.destroy=function()
         *          {
         *               require.undef(module.id);
         *          };
         *
         *          return implement;
         *     });
     *
     * @member ef
     * @class ef.Interface
     * */
    function Interface() {
        this.name = "interface";
        this.startCode = 101;
        this.endCode = 102;
        if (!arguments.length || arguments.length != 2 || (arguments[1].charCodeAt(0) != this.startCode && arguments[1].charCodeAt(1) != this.endCode)) {
            throw new Error(this.constructor.error);
        }
    }
    Interface.error="Please use [Interface.implment()] to implement!";
    /**@static 继承此接口*/
    Interface.implement = function () {
        return new Interface("interface", ef.name);
    };
    /**
     * 初始化
     * @protected
     * */
    Interface.prototype.init = function () {

    };
    /**重绘接口*/
    Interface.prototype.redraw = function () {
        throw new Error("This function must be implement!");
    };
    /**销毁*/
    Interface.prototype.destroy = function () {
        throw new Error("This function must be implement!");
    };
    ef.register(Interface,"Interface");
    return Interface;
});
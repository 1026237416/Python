/**
 * Created by wangahui1 on 15/12/14.
 */
define("qunit.app",["domReady","module","signature","warn.host"],function(domReady,module,signature,warnhost)
{
    domReady(function()
    {
        //warnhost.destroy();
        //require(["setting.user"],function(settingUser)
        //{
        //    settingUser
        //});

        //test("ef.util.arg2arr()", function( assert ) {
        //    assert.ok(ef.util.arg2arr({length:2,0:1,1:2}),"执行无错误！");
        //    assert.equal(ef.util.arg2arr({length:2,0:1,1:2}).length,2,"good");
        //    assert.ok(ef.util.isArray(ef.util.arg2arr({length:2,0:1,1:2})),"返回结果是数组");
        //});
        start();
        test("工具类：参数转换数组[ef.util.arg2arr]",function( assert ) {
            assert.ok(ef.util.arg2arr({length:2,0:1,1:2}),"执行无错误！");
            assert.equal(ef.util.arg2arr({length:2,0:1,1:2}).length,2,"good");
            assert.ok(ef.util.isArray(ef.util.arg2arr({length:2,0:1,1:2})),"返回结果是数组");
        });
        test("工具类：unicode与中文互换[ef.util.cn2unicode|ef.util.unicode2cn]方法",function( assert ) {
            assert.equal(ef.util.cn2unicode("你好"),"\\u4F60\\u597D","中文转换成功！");
            assert.equal(ef.util.unicode2cn("\\u4F60\\u597D"),"你好","unicode转换中文成功！");
            assert.equal(ef.util.unicode2cn("\u4F60\u597D"),"你好","unicode转换中文成功！");
            assert.equal(ef.util.unicode2cn(),undefined,"参数可以为空！");
            assert.equal(ef.util.unicode2cn("%u4F60%u597D"),"你好","escape转换也可以");
            assert.equal(ef.util.unicode2cn("abc"),"abc","英文不转换");
            assert.equal(ef.util.cn2unicode("a你bc好"),"a\\u4F60bc\\u597D","混合转换成功！");
            assert.equal(ef.util.cn2unicode("abc"),"abc","英文不转换");
        });
    });
});
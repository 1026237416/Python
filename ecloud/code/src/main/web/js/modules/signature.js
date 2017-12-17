/**
 * Created by wangahui1 on 15/11/9.
 * @description --签名模块，包括安检\登入入\登出\会话超时管理
 */
define("signature", ['easyui', "user"], function (easyui, user) {
    return {
        signIn://登入
            function ($user) {
                var result=user.__setUser($user);
                if(!result)
                {
                    return this.sessionOut(ef.util.getLocale("signature.session.alert.message.norole"));
                }
                ef.status.logined = true;
                window.location.replace("index.html");
            },
        signOut://登出
            function () {
                user.__revokeUser();
                ef.status.logined = false;
                window.location.replace(ef.util.url("login.html",{}));
            },
        check://安检
            function () {
                if (!user.hasLimit()) {
                    ef.status.logined = false;
                    window.location.replace(ef.util.url("login.html",{}));
                    return false;
                }
                return true;
            },
        sessionOut://session 过期
            function (msg,noRefresh) {
                ef.loading.hide();
                ef.Timer.destoryAll();
                msg=msg?msg:ef.util.getLocale("signature.session.alert.message");
                $.messager.alert(ef.alert.warning,msg,'warning',function()
                {
                    user.__revokeUser();
                    ef.status.logined = false;
                    if(!noRefresh)
                    window.location.replace(ef.util.url("login.html",{}));
                });
            }
    };
});
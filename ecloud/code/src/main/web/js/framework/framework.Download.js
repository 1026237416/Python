/**
 * Created by wangahui1 on 16/4/20.
 */
define("framework.download",["exports","framework.core"],function(exports,ef)
{
    /**下载组件
     * @class ef.Download
     *
     * **使用范例**：
     *
     *     @example
     * */
    function Download(url) {
        this.dom = $('<div class="___download_box___"><iframe width="0" height="0" frameborder="0" scrolling="no"></iframe></div>');
        this.start(url);
        return this;
    }
    Download.prototype._init = function () {
        var finder = $(ef.root.document.body).find(".___download_box___");
        finder.remove();
        var _src= _.url(this.url);
        this.dom.find("iframe").removeAttr("src");
        this.dom.find("iframe").attr("src", _src);
        $(ef.root.document.body).append(this.dom);
        //this.dom.remove();
    };
    Download.prototype.start = function (url) {
        this.url = url;
        if (!this.url)return;
        this._init();
    };
    ef.register(Download,"Download");
    return Download;
});
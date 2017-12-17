/**
 * Created by thomas on 2016/9/13.
 */
define('framework.breadcrumbs',[
    'exports',
    'framework.core',
    'framework.nav',
    'user'
],function(exports,ef,nav,user){
    var noDashboard = false;
    function Breadcrumbs(){
        this.data = null;
        this.currentId = '';
        this.lastId = '';
        this.doms = [];
        this.dashboard = null;
        this.userValue = user.getRole().value;
    }
    Breadcrumbs.prototype.render = function(currentId,lastId,data){
        this.currentId = currentId;
        this.lastId = lastId;
        if(!this.data){
            this.data = this.filterData(data);
        }
        if(!this.dashboard && !this.noDashboard){
            this.dashboard = this.getDashboard();
            if(this.dashboard.noDashboard && this.userValue == 7){
                this.dashboard = null;
                noDashboard = true;
            }
        }
        //ef.nav.reload refresh page will meet
        //currentId == lastId
        if(currentId == lastId){
            return;
        }
        var currentDomArray = [];
        if(!noDashboard && this._isDashboard(currentId)){
            var vmWareData = ef.localStorage.get("current-datacenter");
            if(vmWareData && vmWareData.name){
                this.dashboard = $.extend({},this.dashboard,{vmText:vmWareData.name});
            }
            currentDomArray.push(this.getDom(this.dashboard,'span'));
            this.addListener(currentDomArray);
            return;
        }
        var currentDomTree = this.getCurrentById(currentId),
            DomTreeLength = currentDomTree.length;
        if(!DomTreeLength){
            return;
        }
        if(!noDashboard){
            currentDomArray.push(this.getDom(this.dashboard,'a'));
        }
        var index = _.findIndex(currentDomTree.reverse(),function(value){
            return value.isDetail;
        });
        if(index == -1){
            if(DomTreeLength == 1){
                currentDomArray.push(this.getDom(currentDomTree[0],'span'));
            }
            if(DomTreeLength == 2){
                currentDomArray.push(this.getDom(currentDomTree[0],'double'));
                currentDomArray.push(this.getDom(currentDomTree[1],'span'));
            }
            this.addListener(currentDomArray);
            return;
        }
        var that = this;
        _.each(currentDomTree,function(value,indexValue){
            if(indexValue == 0){
                currentDomArray.push(that.getDom(currentDomTree[indexValue],'double'));
                return;
            }
            if(indexValue == DomTreeLength-1){
                var tempObj = $.extend({},currentDomTree[indexValue],{
                    vmText:ef.util.getLocale('framework.breadcrumb.detail.text')
                });
                currentDomArray.push(that.getDom(tempObj,'span'));
                return;
            }
            if(indexValue >= index){
                var temp = $.extend({},currentDomTree[indexValue],{
                    vmText:that.getDetailData() || ef.util.getLocale('framework.breadcrumb.detail.text')
                });
                currentDomArray.push(that.getDom(temp,'a'));
                return;
            }
            currentDomArray.push(that.getDom(currentDomTree[indexValue],'a'));
        });
        this.addListener(currentDomArray);
        //end
    };
    Breadcrumbs.prototype.getDetailData = function(flag){
        //store cross data
        if(flag){
            if(ef.nav.current && ef.nav.current.data){
                return ef.nav.current.data;
            }else{
                return void(0);
            }
        }
        var value = void(0);
        if(ef.nav.current && ef.nav.current.data){
            var param = ef.nav.current.data;
            try{
                var jsonStr = ef.util.unescapeJSON(param);
                var jsonObj = JSON.parse(jsonStr);
                value = jsonObj.name || jsonObj.app_id || jsonObj.id;
            }catch (e){
                value = param;
            }
        }
        return value;
    };
    Breadcrumbs.prototype._isDashboard = function(id){
        return id === this.dashboard.id;
    };
    Breadcrumbs.prototype.addListener = function(newDoms){
        var $wrapper = $('.bread-items');
        $wrapper.off('click.breadcrumbs')
            .find('a').off('click.breadcrumbs')
            .end().empty();
        $wrapper.append(newDoms);
        $wrapper.on('click.breadcrumbs','a', $.proxy(
            function(event){
                event.preventDefault();
                var $target = $(event.target),
                    id = $target.attr('id'),
                    src = $target.attr('src');
                console.log('thomas----',DataStore,'thomas----',id);
                ef.nav.goto(src,id,DataStore[id]);
                var navDom = this.findNavItem($target.attr('id'));
                if(navDom){
                    navDom.trigger('click');
                }
            },this));
    };
    Breadcrumbs.prototype.findNavItem = function(id){
        if(!this.doms.length){
            var lev0DOM = $('.nav .lev0');
            var lev1DOM = $('.nav .lev1');
            var tempArray = [];
            if(lev0DOM && !lev0DOM.is('document')){
                tempArray = tempArray.concat(lev0DOM.toArray());
            }
            if(lev1DOM && !lev1DOM.is('document')){
                tempArray = tempArray.concat(lev1DOM.toArray());
            }
            this.doms = tempArray;
        }
        var targetDom = _.find(this.doms,function(dom,key){
            return $(dom).attr('id') == id;
        });
        if(targetDom){
            if($(targetDom).attr('id') && $(targetDom).attr('src')){
                return $(targetDom);
            }
        }
        return null;
    };
    Breadcrumbs.prototype.filterData = function(dataArray){
        var tempArray = [],
            accessNum = user.getRole().value;
        if(!_.isArray(dataArray) || !dataArray.length){
            return tempArray;
        }
        /**
         * only parent has invisible attribute
         */
        _.each(_.clone(dataArray),function(supValue){
            var invisible = supValue.invisible;
            if(invisible){
                var index = _.findIndex(dataArray,function(indexValue){
                    return _.contains(invisible,accessNum)
                });
                if(index > -1){
                    dataArray.splice(index,1);
                }
            }
        });
        if(user.isSuper()){
            return dataArray;
        }
        _.each(dataArray,function(dataValue){
            var access = dataValue.access;
            if(_.contains(access,accessNum)){
                var children = dataValue.children,
                    copyParent = _.clone(dataValue);
                if(children){
                    copyParent.children = _.filter(children,function(child){
                        return _.contains(child.access,accessNum);
                    });
                }
                tempArray.push(copyParent);
            }
        });
        return tempArray;
    };
    Breadcrumbs.prototype.getDashboard = function(){
        if(!ef.nav){
            require([ef.nav]);
        }
        var dashboardId = ef.nav.default;
        return this.getCurrentById(dashboardId)[0];
    };
    Breadcrumbs.prototype.getDom = function(module,domType){
        var data = {};
        if(module){
            data.id = module.id;
            data.src = module.src;
            data.text = module.vmText || ef.util.getLocale('framework.component.nav.'+module.id+'.label');
        }else{
            data.text = ef.util.getLocale('framework.breadcrumb.detail.text');
        }
        return this.getTemplate(data,domType);
    };
    var template = {
        'span':'<span>{{text}}</span>',
        'double':'<span>{{text}}</span><span>></span>',
        'a':'<a href="javascript:void(0)" id = "{{id}}" src="{{src}}">{{text}}</a><span>></span>'
    };
    Breadcrumbs.prototype.getTemplate = function(data,domType){
        _.templateSettings = {
            interpolate: /\{\{(.+?)\}\}/g
        };
        var text = template[domType];
        /*var $dom = $(_.template(text)(data));
         $dom.find('a').data(tempData);*/
        return _.template(text)(data);
    };
    //add cross data for detail page
    var DataStore = {};
    Breadcrumbs.prototype.getCurrentById = function(id){
        var result = [],resultFlag = true,that = this;
        getDomTree(id,this.data);
        //can not find resultFlag will be true
        //need to clear result
        if(resultFlag){
            result = [];
        }
        return result;
        function getDomTree(id,data){
            //if find data resultFlag will be changed to false
            //no need to find anymore
            if(!resultFlag){
                return;
            }
            var dataArray = data,
                i = 0,
                len = dataArray.length;
            while(i < len&&resultFlag){
                var currentData = dataArray[i];
                //every array item is parent item
                //every new loop will show last loop is not right
                if(currentData.isRepain){
                    result = [];
                }
                if(currentData.id == id){
                    resultFlag = false;
                    var currentDcpFind = ef.util.dcopy(currentData);
                    if(currentDcpFind.children){
                        currentDcpFind.children = null;
                    }
                    DataStore[id] = that.getDetailData(true);
                    result.push(currentDcpFind);
                }else if(currentData.children){
                    getDomTree(id,currentData.children);
                    if(!resultFlag){
                        var currentDcp = ef.util.dcopy(currentData);
                        if(currentDcp.children){
                            currentDcp.children = null;
                        }
                        result.push(currentDcp);
                    }
                }
                i++;
            }
        }
    };
    Breadcrumbs.isInstance=true;
    ef.register(Breadcrumbs,"breadcrumbs");
    return Breadcrumbs;
});

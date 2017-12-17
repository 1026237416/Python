(function($){
   /* var dgOptions=
    {
        beforePageText: '第',//页数文本框前显示的汉字
        afterPageText: '页    共 {pages} 页',
        displayMsg: '当前显示 {from} - {to} 条记录   共 {total} 条记录',
        showPageList:false,
        showRefresh:false
    };*/
    var dgOptions=
        {
            beforePageText: '第',//页数文本框前显示的汉字
            afterPageText: '页 / 共 {pages} 页',
            displayMsg: '{from} / {to},共 {total} 条',
            showPageList:false,
            showRefresh:false
        };
    var usersData = [];
    function pagerFilter(data){
        if (typeof data.length == 'number' && typeof data.splice == 'function'){
            data = {
                total: data.length,
                rows: data
            }
        }
        var dg = $(this);
        var opts = dg.datagrid('options');
        var pager = dg.datagrid('getPager').pagination(dgOptions);
        pager.pagination({
            onSelectPage:function(pageNum, pageSize){
                var u = dg.datagrid('getChecked');
                for(var i in usersData){
                    if(i==opts.pageNumber){
                        delete  usersData[opts.pageNumber];
                    }
                }
                usersData[opts.pageNumber] = u;
                dgOptions&&dgOptions.onBeforePage?dgOptions.onBeforePage(opts.pageNumber,opts.pageSize,usersData,pageNum):null;
                opts.pageNumber = pageNum;
                opts.pageSize = pageSize;
                pager.pagination('refresh',{
                    pageNumber:pageNum,
                    pageSize:pageSize
                });
                dg.datagrid('loadData',data);
                if(dg.datagrid('options').singleSelect===false){
                    var pag=[];
                    for(var a in usersData){
                        if(pageNum==a){
                            $(data.rows).each(function (i,il) {
                                $(usersData[a]).each(function (e,el) {
                                    if(il==el){
                                        pag.push(i);
                                    }
                                })
                            });
                        }
                    }
                    if(pag.length!=0){
                        for(var i=0;i<pag.length;i++){
                            dg.datagrid('selectRow',pag[i]);
                        }
                    }

                }
                dgOptions&&dgOptions.onPage?dgOptions.onPage(pageNum, pageSize):null;
                if(dg.datagrid('options').autoHeight==true){
                    var hei;
                    if($(".datagrid-wrap.panel-body").length>1){
                        var num = 0;
                        $(".datagrid-wrap.panel-body").each(function (i,il) {
                            num = num+$(il).offset().top;
                        });
                        hei = Number($(window).height())-Number(num);
                    }else{
                        hei = Number($(window).height())-Number($(".datagrid-wrap.panel-body").offset().top);
                    }
                    if((hei-30)>430){
                        dg.datagrid('resize',{height:hei-30});
                    }
                    else{
                        dg.datagrid('resize',{height:430});
                    }
                }
            }
        });
        if (!data.originalRows){
            data.originalRows = (data.rows);
        }
        var start = (opts.pageNumber-1)*parseInt(opts.pageSize);
        var end = start + parseInt(opts.pageSize);
        data.rows = (data.originalRows.slice(start, end));
        if((data.rows.length == 0)&&(data.originalRows.length>0)) {
            start = start - parseInt(opts.pageSize);
            end = start + parseInt(opts.pageSize);
            data.rows = (data.originalRows.slice(start, end));
        }
        return data;
    }

    var loadDataMethod = $.fn.datagrid.methods.loadData;
    $.extend($.fn.datagrid.methods, {
        autoData:function(jq){
            var ph=$(jq).datagrid("getPanel").height();
            var num = Math.floor(parseInt((ph-70)/36));
            num=num<10?10:num;
            $(jq).datagrid("getPager").pagination({pageSize:num});
            var pnum=$(jq).datagrid("options").pageNumber;
            $(jq).datagrid("goto",pnum);
            $(jq).datagrid("getPanel").resize(function(){
                if($(jq).length>0){
                    console.log("panel");
                    var ph=$(jq).datagrid("getPanel").height();
                    var num = Math.floor(parseInt((ph-70)/36));
                    num=num<10?10:num;
                    $(jq).datagrid("getPager").pagination({pageSize:num});
                    var pnum=$(jq).datagrid("options").pageNumber;
                    $(jq).datagrid("goto",pnum);
                }
            })
        },
        clientPaging: function(jq,arg){
            usersData.length = 0;
            return jq.each(function(){
                var dg = $(this);
                var state = dg.data('datagrid');
                var opts = state.options;
                opts.loadFilter = pagerFilter;
                var onBeforeLoad = opts.onBeforeLoad;
                opts.onBeforeLoad = function(param){
                    state.allRows = null;
                    return onBeforeLoad.call(this, param);
                };
                if(arg)
                {
                    for(var i in arg)
                    {
                        if(i!="onSelectPage")
                            dgOptions[i]=arg[i];
                    }
                }
                dg.datagrid('getPager').pagination(dgOptions);
                $(this).datagrid('loadData', state.data);
                if (opts.url){
                    $(this).datagrid('reload');
                }
            });
        },
        loadData: function(jq, data){
            jq.each(function(){
                $(this).data('datagrid').allRows = null;
            });
            return loadDataMethod.call($.fn.datagrid.methods, jq, data);
        },
        getAllRows: function(jq){
            return jq.data('datagrid').allRows;
        },
        goto:function(jq,index,data)
        {
            return jq.each(function(){
                var dg = $(this);
                var pager=dg.datagrid('getPager');
                if(pager.length){
                    var option= pager.pagination("options");
                    var data=dg.datagrid("getData");
                    option.total=data.total;
                    pager.pagination('select',index);
                    pager.pagination(option).pagination("refresh",{total:data.total,pageNumber:index});


                }
            });
        }
    })
})(jQuery);
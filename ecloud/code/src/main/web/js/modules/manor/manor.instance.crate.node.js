/**
 * Created by thomas on 2016/5/13.
 */
define([
    'module',
    'exports',
    'codemirror',
    "active-line","shell","vis","api","show-hint","anyword-hint","python","shell-hint","python-hint"
],function(module, exports, CodeMirror,activeLine,shell,vis,api,showHint,anywordHint,python,shellHint,pythonHint){
    return function()
    {
        var editor = null;
        var impls = new ef.Interface.implement();
        impls.context=null;
        impls.owner=null;
        impls.instances=[];
        impls.redraw = function(selectedNodeId,context){
            this.instance=[];
            this.selectedNodeId=selectedNodeId;
            this.context=context;
            console.log('selectedNodeId-----',selectedNodeId);
            impls.o = {
                $node:$('#node-type',impls.context),
                $codeMirror:$('#codes',impls.context),
                $tabs:$('.tab-box',impls.context),
                $paramBox:$(".script_params_setting",impls.context),
                $template:$('<div class="radio-param-wrapper"><span class="wrap_left_border"></span></div>')
            };
            impls.utils = {
                createParamTables:function(arrs)
                {
                    var _self=this;
                    $(arrs).each(function(i,item)
                    {
                        switch(item.ui)
                        {
                            case "default":
                            {
                                _self.createDefaultParam(item);
                                break;
                            }
                            case "input":
                            {
                                _self.createInputParam(item);
                                break;
                            }
                            case "select":
                            {
                                _self.createSelectParam(item);
                                break;
                            }
                            case "checkbox":
                            {
                                _self.createCheckboxParam(item);
                            }
                        }
                    });
                },
                createDefaultParam:function(data)
                {
                    return;
                    var dom=impls.o.$template.clone();
                    var title=$('<label class="param_tit"></label>');
                    dom.append(title);
                    title.text(data.name);
                    var val=$('<div class="param_infos"><span class="param_radio"></span><div class="param_des"></div></div>');
                    dom.append(val);
                    val.find(".param_radio").text(data.description);
                    impls.o.$paramBox.append(dom);

                },
                createInputParam:function(data)
                {
                    var dom=impls.o.$template.clone();
                    var title=$('<label class="param_tit"><span class="param_text"></span><span>:</span><i class="question-icon"></i></label>');
                    dom.append(title);
                    title.find(".param_text").text(data.name);
                    var val=$('<div class="param_infos"><span class="param_radio"></span><div class="param_des"></div></div>');
                    dom.append(val);
                    val.find(".param_radio").textbox(
                        {
                            width:197,
                            height:30,
                            maxlength:50,
                            required:true,
                            value:ef.util.pluck(data.ui_value,"value").join("")
                            //value:data.description
                        });
                    impls.o.$paramBox.append(dom);
                    impls.instances.push(
                        {
                            type:"textbox",
                            dom:val.find(".param_radio")
                        });
                    title.find(".question-icon").tooltip(
                        {
                            content:data.description,
                            position:"right",
                            trackMouse:true,
                            onShow: function(){
                                //$(this).tooltip('tip').css(
                                //    {
                                //        "max-width":"500px",
                                //        "white-space":"nowrap",
                                //        "word-break":"break-all"
                                //    });
                            }
                        });
                },
                createSelectParam:function(data)
                {
                    var dom=impls.o.$template.clone();
                    var title=$('<label class="param_tit"><span class="param_text"></span><span>:</span><i class="question-icon"></i></label>');
                    dom.append(title);
                    title.find(".param_text").text(data.name);
                    var val=$('<div class="param_infos"><span class="param_radio"></span><div class="param_des"></div></div>');

                    val.find(".param_radio").combobox(
                        {
                            width:197,
                            height:30,
                            textField:"label",
                            valueField:"value",
                            editable:false,
                            value:data.default_value,
                            data:data.ui_value
                        });
                    impls.o.$paramBox.append(dom);
                    impls.instances.push(
                        {
                            type:"combobox",
                            dom:val.find(".param_radio")
                        });
                    //var span=val.find(".param_des");
                    //span.textbox(
                    //    {
                    //        width:197,
                    //        height:30,
                    //        value:data.description,
                    //        readonly:true
                    //    });
                    //val.append(span);
                    dom.append(val);
                    title.find(".question-icon").tooltip(
                        {
                            content:data.description,
                            position:"right",
                            trackMouse:true,
                            onShow: function(){
                                $(this).tooltip('tip').css(
                                    {
                                        "max-width":"500px"
                                    });
                            }
                        });

                },
                createCheckboxParam:function(data)
                {
                    var dom=impls.o.$template.clone();
                    var title=$('<label class="param_tit"><span class="param_text"></span><span>:</span><i class="question-icon"></i></label>');
                    dom.append(title);
                    title.find(".param_text").text(data.name);
                    var val=$('<div class="param_infos"><span class="param_radio"></span><div class="param_des"></div></div>');

                    var newData=ef.util.dcopy(data.ui_value);
                    $(newData).each(function(i,il)
                    {
                        if(il.value==data.default_value)
                        {
                            il.selected=true;
                        }
                    });
                    var checker=val.find(".param_radio").checkinfo(
                        {
                            width:197,
                            height:30,
                            dataProvider:newData,
                            labelField:"label",
                            valueField:"value",
                            value:data.default_value
                        });
                    impls.o.$paramBox.append(dom);
                    impls.instances.push(
                        {
                            type:"checkinfo",
                            dom:checker
                        });
                    //var span=val.find(".param_des");
                    //span.textbox(
                    //    {
                    //        width:197,
                    //        height:30,
                    //        value:data.description,
                    //        readonly:true
                    //    });
                    //val.append(span);
                    dom.append(val);
                    title.find(".question-icon").tooltip(
                        {
                            content:data.description,
                            position:"right",
                            trackMouse:true,
                            onShow: function(){
                                $(this).tooltip('tip').css(
                                    {
                                        "max-width":"500px"
                                    });
                            }
                        });

                },
                initTabs:function(){
                    ef.i18n.parse();
                    impls.o.$tabs.tabs(impls.config.tabsConfig);
                    var params=impls.getParams();
                    impls.o.$paramBox.empty();
                    if(params&&params[1].script_params)
                    {
                        this.createParamTables(params[1].script_params);
                    }

                },
                initCodeMirror:function(){
                    var params=impls.getParams();
                    var code = impls.o.$codeMirror[0];
                    //editor=CodeMirror.fromTextArea(code, impls.config.codeMirrorConfig);
                    //editor.setSize("100%",420);imp
                    //editor.refresh();
                    CodeMirror.commands.autocomplete = function(cm) {
                        cm.showHint({hint:CodeMirror.hint[params.script_type]});
                    };
                    $(".code_mirror_box #codes",impls.context).siblings().remove();
                    editor=CodeMirror.fromTextArea($(".code_mirror_box #codes",impls.context).get(0), {
                        mode: params[3].script_type,
                        lineNumbers: true,
                        lineWrapping: true,
                        //readOnly:params[3].streamlet_params_properties_read_only,
                        readOnly:true,
                        extraKeys: {"Ctrl-/": "autocomplete"}
                    });
                    editor.setValue(params[2].execute_script_content);
                    editor.setSize("100%",420);
                    if(params[3].streamlet_params_properties_hide)
                    {
                        $(".code_mirror_box",impls.context).hide();
                    };
                    editor.on("change",function(edt,changeObj)
                    {
                        var val=editor.getValue();
                        if(!val)return;
                        params[2].execute_script_content=val;
                    });
                }
            };
            impls.config = {
                tabsConfig:{
                    width:"100%",
                    border:false,
                    onSelect:function(title,index){
                        console.log(index);
                        //page wrapper must be shown then codeMirror will show
                        if(index == 1){
                            impls.utils.initCodeMirror();
                        }
                    }
                },
                codeMirrorConfig:{
                    mode: "shell",
                    lineNumbers: true,
                    lineWrapping: true
                }
            };
            impls.utils.initTabs();
        };
        impls.getData=function()
        {
            return this.owner.utils.getSelectedNodeData(this.selectedNodeId);
        };
        impls.getParams=function()
        {
            var result=false;
            var data=this.getData();
            if(data)
            {
                result=data[this.selectedNodeId];
                result=result.params;
            }
            return result;
        };
        impls.destroy = function(){
            require.undef(module.id);
        };
        impls.isValid=function()
        {
            var bool=true;
            $(this.instances).each(function(i,item)
            {
                if(item.type=="checkinfo")
                {
                    console.log(item.dom.isChecked());
                    if(!item.dom.isChecked())
                    {
                        bool=false;
                    }
                }else
                {
                    if(!item.dom[item.type]("isValid"))
                    {
                        bool=false;
                    }
                }

            });
            if(editor)
            {
                var val=editor.getValue();
                if(!String(val).length)
                {
                    bool=false;
                }
            }
            return bool;
        };
        impls.getVals=function(data)
        {
            if(!data||!data.length)return false;
            return ef.util.pluck(data,"value");
        };


        this.implement=impls;
    }
});

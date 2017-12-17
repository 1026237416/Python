var gulp=require("gulp");
var jshint=require("gulp-jshint");
var concat=require("gulp-concat");
var rename=require("gulp-rename");
var uglify=require("gulp-uglify");
var del= require('del');
var log="[LOG]:";
var watcher=gulp.watch("../js/framework/output/*.js");
function getFormatTime()
{
        var date=new Date();
        return "["+date.getHours()+":"+date.getMinutes()+":"+date.getSeconds()+"]";
};
watcher.on("change",function(event)
{
        if(event.path)
        {
                this.end();
                console.log(getFormatTime(),"文件已生成，路径是:",event.path);
        }
});
gulp.task("clean",function(){
        del(["../js/framework/output/*.js"]);
        console.log(getFormatTime(),"清除原有文件");
});

gulp.task("default",["clean"],function(event)
{
        gulp.src(["../js/framework/*.js"]).pipe(concat("framework.min.js")).pipe(jshint()).pipe(gulp.dest("../js/framework/output")).pipe(uglify({mangle:true})).pipe(gulp.dest("../js/framework/output"));
        //如果需要生成framework.js，请使用下面代码，并屏蔽上面代码
        //gulp.src(["../js/framework/*.js"]).pipe(concat("framework.js")).pipe(jshint()).pipe(gulp.dest("../js/framework/output")).pipe(uglify({mangle:true})).pipe(rename("framework.min.js")).pipe(gulp.dest("../js/framework/output"));
});


/**
 * 图片移动 滚轮缩放插件
 * new ImageZoom({id:"Imgbox"});
 * ImgBox是要操作的图片ID
 */
(function($){
    window.zoomg = window.zoomg || {};
    zoomg.zoomStep = 100; //缩放尺寸
    zoomg.img = -1;
    zoomg.stepArr = [30,50,80,100,150,200,250,300];
    zoomg._hasZoomStyle = false;//是否已添加CSS样式到当前页面
    zoomg._template = '<div class="imgzoom imgzoombg"></div><div class="imgzoom imgzoomclose">x</div>'
    + '<div class="imgzoom imgzctlw"><span class="ictl rl"><span class="ic"></span></span><span class="ictl rr"><span class="ic"></span></span>'
    +'<span class="ictl zb"><span class="ic"></span></span><span class="ictl zs"><span class="ic"></span></span>'
    +'<span class="ictlbg"></span></div>'
    +'<div class="imgzoom controls zsliw"><span class="lab">缩放尺寸:</span><select class="sel_zoomstep"></select></div>'
    +'<img src="" id="imgzoomimg" class="imgzoom imgzoomimg">';
    zoomg._style = '<style>html.zoomimg,body.zoomimg{overflow: hidden;}.zoomimg img{max-width:none !important;}'
    +'.imgzoombg{position:fixed;background:black;opacity:0.7;top:0;left:0;z-index:5000;width:100%;height:100%;}'
    + '.imgzoomimg{position:absolute;left:0;top:0;height:400;display:block;z-index:5100;}'
    + '.imgzoomclose{position:fixed;top:0;right:20px;font-size:90px;font-weight:bold;color:#555;line-height:90px;'
    +'z-index:5200;font-family:"微软雅黑";cursor:pointer;}'
    + '.imgzoomimg.moving{cursor:move;}'
    + '.imgzctlw{position:fixed;bottom:30px;left:50%;margin-left:-150px;width:300px;z-index:5400;text-align:center}'
    + '.imgzctlw .ictlbg{position:absolute;display:block;width:300px;height:48px;background:black;'
    + 'left:0;top:0;opacity:0.8;border-radius:10px;}'
    + '.imgzoom .ictl{cursor:pointer;display:inline-block;position:relative;width:60px;height:48px;z-index:5500;}'
    + '.imgzoom .ic{display:block;width:32px;height:32px;margin:7px 0 0 14px;background:url("http://c.kuailingqu.com/Public/Res-manage/imgbox/style/ico_preview143422.png") no-repeat scroll 0 0 transparent;}'
    + '.imgzoom .rl .ic{background-position:-134px 0;}'
    + '.imgzoom .rr .ic{background-position:-201px 0;}'
    + '.imgzoom .zb .ic{background-position:0 0;}'
    + '.imgzoom .zs .ic{background-position:-67px 0;}'
    + '.imgzoom .ictl:hover{background:#333}'
    + '.zsliw{position:fixed;top:10px;left:30px;z-index:5500;color:white;font-size:12px;}'
    + '.zsliw .lab{color:white;display:block;float:left;height:26px;line-height:26px;margin-right:5px;}.zsliw .chzn-container .chzn-drop{background:transparent;}'
    + '.sel_zoomstep{margin-left:5px;border:0;background:transparent;color:white;font-size:12px;width:60px;z-index:5550;}'
    + '.sel_zoomstep option{border:0;color:#333;}'
    + '.zsliw .chzn-container-single .chzn-single{background:transparent;background-image:none;color:white;}'
    + '.zsliw .chzn-container-single .chzn-single-with-drop{background:transparent;background-image:none}'
    +'</style>';


    //ImageZoom类定义
    window.ImageZoom = function(options){
        this.id = ''; //要缩放操作的img  id
        this.$s = -1;  //需求缩放的图片DOM对象
        this.src = ''; //图片链接地址
        this.ow = 0; //originalWidth
        this.oh = 0; //originalHeight
        this.zImgId = 'imgzoomimg';  //弹出层图片ID
        this.zImgClass = 'imgzoom';   //弹出层图片class
        this.zImgBgClass = 'imgzoombg'; //弹出层背景
        this.$body = $("body");
        this.cw = ''; //current width
        this.ch = ''; //current height
        this.ct = ''; // current top
        this.cl = ''; // current left;
        this.margin = 10;  //弹出层图片初始边距
        this.mouseIsDown = false;
        this.mouseX = 0;//当前事件鼠标位置
        this.mouseY = 0;
        this.ww = 0; //window.width
        this.wh = 0; //window.height
        this.deg = 0;
        this.initialize(options);
    };
    ImageZoom.prototype = {
        initialize: function(options){
            var self = this;
            $.extend(this, options);
            //firefox取消图片拖拽
            document.ondragstart=function() {return false;}
            if(!zoomg._hasZoomStyle){
                $("head").append(zoomg._style);
                zoomg._hasZoomStyle = true;
            }

            self.ww = $(window).width();
            self.wh = $(window).height();

            this.events();
        },
        events: function(){
            var self = this;
            //绑定事件
            this.$body.delegate("#"+this.id, 'click', function(e){
                e.preventDefault();
                self.$s = $(this);
                self.src = self.$s.attr("src");
                var img = new Image();
                img.onload = function(){
                    if(zoomg.img!=self.src){
                        self.resetPosData();
                        zoomg.img = self.src;
                    }
                    self.ow = img.width;
                    self.oh = img.height;

                    self.addTemplate();
                    self.setCurrentData();
                    self.setImgPosition();
                    self.initSelectStep();
                    self.bindZoomEvents();
                }
                img.src = self.src;
            });
        },
        bindZoomEvents: function(){
            var self = this;
            //鼠标按下
            this.$body.delegate("#"+this.zImgId, 'mousedown', function(e){
                self.mouseIsDown = true;
                self.getImg().addClass("moving");
                self.mouseX = e.pageX; self.mouseY = e.pageY;
            });
            //鼠标放开
            this.$body.delegate("#"+this.zImgId, 'mouseup', function(e){
                self.mouseIsDown = false;
                self.getImg().removeClass("moving");
            });
            //鼠标移动
            this.$body.delegate("#"+this.zImgId, 'mousemove', function(e){
                if(!self.mouseIsDown) return; //鼠标按下状态
                self.ct += e.pageY-self.mouseY;
                self.cl += e.pageX-self.mouseX;
                self.mouseX = e.pageX;
                self.mouseY = e.pageY;
                self.setImgPosition();
            });
            //鼠标移动
            this.$body.delegate("."+this.zImgBgClass, 'mousemove', function(e){
                if(!self.mouseIsDown) return; //鼠标按下状态
                self.ct += e.pageY-self.mouseY;
                self.cl += e.pageX-self.mouseX;
                self.mouseX = e.pageX;
                self.mouseY = e.pageY;
                self.setImgPosition();
            });
            //滚轮事件
            this.$body.delegate("#"+this.zImgId, 'mousewheel', function(e){
                if(self.mouseIsDown) return;
                var delta=e.deltaY>0 ? 1 : -1;
                var rateX=0.5, rateY=0.5; //x y 缩放因子
                rateX = Math.abs(e.pageX-self.cl)/self.cw;
                rateY = Math.abs(e.pageY-self.ct)/self.ch;
                self.setDataByRate(delta, rateX, rateY);
                self.setImgPosition();
            });
            //旋转事件
            this.$body.delegate(".imgzoom .rl","click", function(){
                self.deg += 90;
                self.setImgPosition();
            });
            this.$body.delegate(".imgzoom .rr","click", function(){
                self.deg -= 90;
                self.setImgPosition();
            });
            //放大缩小按钮
            this.$body.delegate(".imgzoom .zb","click", function(){
                if(self.mouseIsDown) return;
                var delta=1;
                var rateX=0.5, rateY=0.5; //x y 缩放因子
                self.setDataByRate(delta, rateX, rateY);
                self.setImgPosition();
            });
            this.$body.delegate(".imgzoom .zs","click", function(){
                if(self.mouseIsDown) return;
                var delta=-1;
                var rateX=0.5, rateY=0.5; //x y 缩放因子
                self.setDataByRate(delta, rateX, rateY);
                self.setImgPosition();
            });
            //窗口大小改变事件
            $(window).on('resize', function(e){
                self.ww = $(window).width();
                self.wh = $(window).height();
                self.getBg().css({height:self.wh + "px", width: self.ww + "px"});
                self.setCurrentData();
                self.setImgPosition();
            });
            $(".imgzoombg").on("mousewheel", function(e){
                if(e.deltaY>0){
                    $(".imgzctlw .zb").click();
                }else{
                    $(".imgzctlw .zs").click();
                }
            });
            $(".imgzoombg").on("click", function(e){
                $(".imgzoomclose").click();
            });
            //关闭点击事件
            this.$body.delegate(".imgzoomclose", 'click',function(){self.handleClose();})

        },
        resetPosData: function(){
            this.cw = ''; //current width
            this.ch = ''; //current height
            this.ct = ''; // current top
            this.cl = ''; // current left;
        },
        setDataByRate: function(delta, rateX, rateY){
            var self = this;
            var oldcw=self.cw,oldch=self.ch;
            if(self.ww>=self.wh){
                self.ch += delta *zoomg.zoomStep;
                self.ch = self.ch<100?100:self.ch;
                self.cw = self.ow*self.ch/self.oh;
                self.ct -= delta * (Math.abs(oldch-self.ch)*rateY);
                self.cl -= delta * (Math.abs(oldcw-self.cw)*rateX);
            }else{
                self.cw += delta * zoomg.zoomStep;
                self.cw = self.cw<100?100:self.cw;
                self.ch = self.cw * self.oh/self.ow;
                self.cl += delta * (Math.abs(oldcw-self.cw)*rateX);
                self.ct += delta * (Math.abs(oldch-self.ch)*rateY);
            }
        },
        addTemplate: function(){
            var self = this;
            this.$body.find("." + this.zImgClass).remove();
            this.$body.addClass("zoomimg");
            $("html").addClass("zoomimg");
            this.$body.append(zoomg._template);
            this.getImg().attr("src",this.src);
            this.$body.find("." + this.zImgBgClass).css({height:self.wh+"px"});
        },
        //获取操作图片对象
        getImg: function(){
            return this.$body.find("#"+this.zImgId);
        },
        getBg: function(){
            return this.$body.find("."+this.zImgBgClass);
        },
        //设置当前图片 位置 大小 参数
        setCurrentData: function(){
            var ww,wh,self = this;
            ww = self.ww-this.margin*2; wh = self.wh-this.margin*2;
            if(ww >= wh){ //高小于宽 以高计算
                this.ch = this.ch=="" ? (wh<=this.oh ? wh : this.oh) : this.ch;
                this.cw = this.cw=="" ? (this.ow*this.ch/this.oh) : this.cw;
                this.ct = this.ct=="" ? ( (wh-this.ch)/2 + this.margin ) : this.ct;
                this.cl = this.cl=="" ? ( (ww-this.cw) /2 + this.margin ) : this.cl;
            }else{
                this.cw = this.cw=="" ? (ww<=this.ow ? ww : this.ow) : this.cw;
                this.ch = this.ch == "" ? (this.cw*this.oh/this.ow) : this.ch;
                this.cl =this.cl=="" ? ( (ww-this.cw) /2 + this.margin ) : this.cl;
                this.ct = this.ct=="" ? ( (wh-this.ch)/2 + this.margin ) : this.ct;
            }
            self.ct += $("body").scrollTop();
        },
        setImgPosition: function(){
            var self = this;
            this.getImg().css({top:self.ct+"px",left:self.cl+"px",width:self.cw+"px",
                height:self.ch+"px",
                transform: "rotate("+ self.deg +"deg)"
            });
        },
        handleClose: function(){
            var self = this;
            self.$body.find("." + self.zImgClass).remove();
            self.$body.removeClass("zoomimg");
            $("html").removeClass("zoomimg");
            //取消事件绑定
            self.$body.undelegate("#"+this.zImgId, 'mousedown');
            self.$body.undelegate("#"+this.zImgId, 'mouseup');
            self.$body.undelegate("#"+this.zImgId, 'mousemove');
            self.$body.undelegate("#"+this.zImgId, 'mousewheel');
            $(window).off('resize');
            self.$body.undelegate(".imgzoomclose", 'click');
            self.$body.undelegate(".imgzoom .rl","click");
            self.$body.undelegate(".imgzoom .rr","click");
            self.$body.undelegate(".imgzoom .zb","click");
            self.$body.undelegate(".imgzoom .zs","click");
            self.$body.undelegate(".sel_zoomstep","change");
            $(".imgzoombg").off("mousewheel");
            $(".imgzoombg").off("click");
            self.$body.undelegate("."+self.zImgBgClass, 'mousemove');
        },
        //初始化step下拉框
        initSelectStep: function(){
            var html = '';
            for(var i= 0,total=zoomg.stepArr.length;i<total; i++){
                if(zoomg.zoomStep == zoomg.stepArr[i]){
                    html += '<option value="'+ zoomg.stepArr[i] +'" selected>'+ zoomg.stepArr[i] +'</option>';
                }else{
                    html += '<option value="'+ zoomg.stepArr[i] +'">'+ zoomg.stepArr[i] +'</option>';
                }
            }
            $(".sel_zoomstep").html(html).chosen({disable_search_threshold: 10});
            this.$body.delegate(".sel_zoomstep","change", function(){
                zoomg.zoomStep=parseInt($(".sel_zoomstep").val());
            });
        }
    };


    //$(function(){
    //    new ImageZoom({id:"Imgbox"});
    //});
})(jQuery);
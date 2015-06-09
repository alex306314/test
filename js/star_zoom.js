/**
 * starZoom  jquery扩展
 * date: 2015-6-3
 * canvas实现 图片移动缩放 旋转 效果
 *
 * 参数可用 data-options 及 starZoom({}) 形参两种形式
 *
 * ///////
 * <div class="iamge_wrap">
 *      <img src="" class="star_zoom" data-options="{'width':400,'height':300}">
 * </div>
 *
 * $(".star_zoom").starZoom();
 * //////
 *
 */
(function($){
    var Events = {
        REDRAW: "redraw",
        MOUSE_WHEEL: "mousewheel",
        MOUSE_DOWN: "mousedown",
        MOUSE_UP: "mouseup",
        MOUSE_MOVE: "mousemove"
    };
    /**
     * 类定义
     * @param options
     * @constructor
     */
    var StarZoom = function(options){
        this.$s = -1;  //当前操作的imgDOM
        this.$wrapper = -1; this.$canvas = -1; this.$blank = -1;//appended DOM object
        this.backgroundColor = "white";//canvas background
        this.ctx = -1; //canvas context
        this.img = -1; this.ratio = 0;//image dom  image ratio
        this.width = 0;this.height = 0; //canvas width height
        this.mouseIsDown = false;
        this.ow = 0; this.oh = 0;//image original width height
        this.sx = 0; this.sy = 0; this.sw=0; this.sh=0;this.dx=0; this.dy=0;//drawImage()
        this.dw=0; this.dh=0;//drawImage()
        this.mouseX = 0; this.mouseY = 0; //mouse position
        this.zoomStep = 30;
        this.minWidth = 50;
        this.centerx = 0;this.centery = 0;
        this.olddw = 0; this.olddh = 0;
        this.degree = 0; //旋转的角度
        this.btnRotateLeft = '.btn_rotate_left';//向左转class
        this.btnRotateRight = '.btn_rotate_right';
        this.btnZoomIn = '.btn_zoom_in'; //放大按钮
        this.btnZoomOut = '.btn_zoom_out'; //缩小按钮
        this.initialize(options);
    };
    StarZoom.prototype = {
        initialize: function(options){
            var self = this;
            $.extend(this, options);
            self.img = new Image();
            self.img.onload = function(){
                self.ow = self.img.width;
                self.oh = self.img.height;
                self.initDom();//初始化所需DOM
                self.bindEvents(); //绑定相关事件

                self.ctx = self.$canvas[0].getContext("2d");
                self.initImage();//初始化图片绘制
            }
            self.img.src = this.$s.attr("src");
        },
        bindEvents: function(){
            var self = this;
            //空白层 mouse wheel down up move事件
            self.$blank.on(Events.MOUSE_WHEEL +" "+ Events.MOUSE_DOWN +" "+ Events.MOUSE_UP
            +" "+ Events.MOUSE_MOVE, function(e){
                switch(e.type) {
                    case Events.MOUSE_MOVE:
                        self.handleBlankMouseMove(e);
                        break;
                    case Events.MOUSE_DOWN:
                        self.mouseX = e.pageX;
                        self.mouseY = e.pageY;
                        self.mouseIsDown = true;
                        self.$blank.css({cursor:"move"});
                        //console.log(e.pageX - self.$canvas.offset().left);
                        break;
                    case Events.MOUSE_UP:
                        self.mouseIsDown = false;
                        self.$blank.css({cursor:"auto"});
                        break;
                    case Events.MOUSE_WHEEL:
                        e.preventDefault();
                        self.handleBlankMouseWheel(e);
                        break;
                }
            });
            //绑定重绘事件
            self.$canvas.bind(Events.REDRAW, function(){
                self.ctx.fillStyle = self.backgroundColor;
                self.ctx.fillRect(0,0,self.width,self.height); //重置背景
                self.getCenter();  //获取图片中心在canvas上的坐标值
                self.ctx.save();
                self.ctx.translate(self.centerx, self.centery);//参考点移动到图片中心
                self.ctx.rotate(self.degree*Math.PI/180);   //旋转
                self.ctx.translate(-self.centerx, -self.centery); //重置参考点
                self.ctx.drawImage(self.img, self.sx, self.sy, self.sw, self.sh,self.dx, self.dy, self.dw, self.dh);
                self.ctx.restore();
            });
            var $parent = self.$s.parent();
            $parent.find(self.btnRotateLeft).on("click", function(){
                self.degree -= 90;
                self.redraw();
            });
            $parent.find(self.btnRotateRight).on("click", function(){
                self.degree += 90;
                self.redraw();
            });
            $parent.find(self.btnZoomIn).on("click", function(){
                self.olddw = self.dw;
                self.olddh = self.dh;
                self.resizeByDelta(1, 0.5, 0.5);
                self.redraw();
            });
            $parent.find(self.btnZoomOut).on("click", function(){
                self.olddw = self.dw;
                self.olddh = self.dh;
                self.resizeByDelta(-1, 0.5, 0.5);
                self.redraw();
            });
        },
        //获取当前图片中心点坐标 相对canvas
        getCenter: function(){
            var self = this;
            self.centerx = self.dw/2 + self.dx;
            self.centery = self.dh/2 + self.dy;
        },
        //初始化图片绘制
        initImage: function(){
            var self = this;
            self.ratio = self.ow/self.oh;
            self.sh = self.oh; self.sw = self.ow;
            if(self.width >= self.height){ //显示区域宽大与高
                self.initByHeight();
                if(self.dw > self.width){
                    self.initByWidth();
                }
            }else{
                self.initByWidth();
                if(self.dh > self.height){
                    self.initByHeight();
                }
            }
            self.redraw();
            self.$canvas.stop(true,false).animate({opacity:1},1500,'linear');
        },
        //鼠标移动事件
        handleBlankMouseMove: function(e){
            var self = this;
            if(!self.mouseIsDown) return;
            self.dx += (e.pageX - self.mouseX );
            self.dy += (e.pageY - self.mouseY);
            self.mouseX = e.pageX;
            self.mouseY = e.pageY;
            self.redraw();
        },
        //滚轮事件
        handleBlankMouseWheel: function(e){
            var self = this, delta, posx,posy,deltax=0.5, deltay=0.5;
            self.olddw = self.dw;
            self.olddh = self.dh;
            if(e.deltaY > 0){delta = 1;}else{delta = -1;}

            posx = Math.abs(e.pageX - self.$canvas.offset().left - self.dx);
            posy = Math.abs(e.pageY - self.$canvas.offset().top - self.dy);
            deltax = posx/self.olddw;
            deltay = posy/self.olddh;
            self.resizeByDelta(delta, deltax, deltay);
            self.redraw();
        },
        resizeByDelta: function(delta, deltax, deltay){
            var self = this;
            self.dw += delta * self.zoomStep;
            self.dw = self.dw<self.minWidth ? self.minWidth : self.dw;
            self.dh = self.dw/self.ratio;

            self.dx -= delta*Math.abs(self.olddw-self.dw)*deltax;
            self.dy -= delta*Math.abs(self.olddh-self.dh)*deltay;
        },
        //触发重绘事件
        redraw: function(){
            this.$canvas.trigger(Events.REDRAW);
        },
        //以高为准定位图片位置
        initByHeight: function(){
            var self = this;
            self.dh = self.height;
            self.dw = self.dh * self.ratio;
            self.dy = 0;
            self.dx = (self.width-self.dw)/2;
        },
        //以宽为准定位
        initByWidth: function(){
            var self = this;
            self.dw = self.width;
            self.dh = self.dw/self.ratio;
            self.dx = 0;
            self.dy = (self.height-self.dh)/2;
        },
        //初始化所需的DOM
        initDom: function(){
            var self = this;
            self.$wrapper = $('<div class="star_zoom sw"></div>');
            self.$canvas = $('<canvas class="star_zoom sc"></canvas>');
            self.$blank = $('<div class="star_zoom sl" unselectable="on"></div>');
            self.$canvas.css({
                position:"absolute",top:0,left:0,zIndex:100, opacity:0
            }).attr({width:self.width,height:self.height}).appendTo(self.$wrapper);
            self.$blank.css({
                width:self.width + "px",height:self.height+"px",position:"absolute",top:0,left:0,zIndex:110
            }).appendTo(self.$wrapper);
            self.$wrapper.css({
                width:self.width + "px",height:self.height+"px",overflow:"hidden",position:"relative"
            }).appendTo(self.$s.css({display:"none"}).parent());
        }
    }
    ///////添加到jquery扩展
    $.fn.starZoom = function(args){
        $.each(this, function(i,n){
            var $s = $(n);
            var options = $s.data("options");
            options = !options?{}: $.parseJSON(options.replace(/'/ig, "\""));
            if(typeof(args) == "object"){
                options = $.extend(args, options);
            }
            options.$s = $s;
            new StarZoom(options);
        });
        return this;
    }
})(jQuery);
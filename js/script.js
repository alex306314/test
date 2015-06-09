(function(window){

    var color = '#0ff', size = 2, oldX, oldY, mouseIsDown=false;

    window.stage = new createjs.Stage("mycanvas");
    stage.enableDOMEvents(true);
    var label = new createjs.Text('Board','24px 微软雅黑');
    label.x = label.y = 10;

    var shape = new createjs.Shape();
    stage.addChild(label,shape);



    stage.on("stagemousedown", function(e){
        mouseIsDown = true;
        oldX = e.stageX;
        oldY = e.stageY;
    });

    stage.on("stagemouseup", function(){
        mouseIsDown = false;
    });

    stage.on('stagemousemove',function(e){
        //console.log(e);
        if(mouseIsDown){
            shape.graphics.beginStroke(color)
                .setStrokeStyle(size, 'round')
                .moveTo(oldX, oldY)
                .lineTo(e.stageX, e.stageY);
            stage.update();
            oldX = e.stageX;
            oldY = e.stageY;
        }
    });
    stage.update();
})(window);
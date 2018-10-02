/**
 * Global web page variables
 */
var canvasHeight = 500;
var sceneHeight = 375;
var sceneWidth;// = window.width*0.2;//300;
var graphWidth;// = window.width*0.6;//700;

var col1, extDiv;

var kDisp, mDisp, cDisp, xoDisp, voDisp, wnDisp, zDisp;
var kSlider, mSlider, cSlider, xoSlider, voSlider, wnSlider, zSlider;

var ampDisp, wDisp, magDisp;
var ampSlider, wSlider, magSlider;

var tNow = 0;
var running = false;
var showTransient = true;
var normalInput = true;
var newSys = false;

var allSys = [];
if (!Array.prototype.last){
    Array.prototype.last = function(){
        return this[this.length - 1];
    };
};

var case1 = {
    caseNum: 1,
    defaultParam: {k: 60, m:1, xo:0.8, vo:0, Lo:2},
    boxPosition : function(t,p) {
        return (p.C + (p.xo-p.C)*Math.cos(p.wn*t)+p.vo/p.wn*Math.sin(p.wn*t));
    },
    boxVelocity : function(t,p){
        return p.wn*(-p.xo+p.C)*Math.sin(p.wn*t)+p.vo*Math.cos(p.wn*t);
    },
    reCalc: function (p) {
        if(normalInput) p.wn = Math.sqrt(p.k/p.m);
        p.C = 0;
    }
}

var case2 = {
    caseNum: 2,
    defaultParam: {k: 60, m:1, xo:0.8, vo:0, Lo:2},
    boxPosition : function(t,p) {
        return (p.C + 1/2*(p.xo-p.C+p.vo/p.a)*Math.exp(p.a*t)+1/2*(p.xo-p.C-p.vo/p.a)*Math.exp(-p.a*t));
    },
    reCalc: function (p) {
        p.a = Math.sqrt(p.k/p.m);
        p.C = 0;
    }
}

var case3 = {
    caseNum: 3,
    defaultParam: {k: 60, c:2, m:1, xo:1, vo:0, Lo:2},
    boxPosition : function(t,p) {
        if (p.z > 1) {
            return p.C + Math.exp(-p.z * p.wn * t) *
                ((p.vo + (p.z * p.wn + p.wd) * (p.xo - p.C)) / (2 * p.wd) * Math.exp(p.wd * t) -
                (p.vo + (p.z * p.wn - p.wd) * (p.xo - p.C)) / (2 * p.wd) * Math.exp(-p.wd * t))
        } else if (p.z === 1) {
            return p.C + (p.xo - p.C + (p.vo + p.wn * (p.xo - p.C)) * t) * Math.exp(-p.wn * t);
        } else if (p.z < 1) {
            return p.C + Math.exp(-p.z * p.wn * t) * ((p.xo - p.C) * Math.cos(p.wd * t) + (p.vo + p.z * p.wn * (p.xo - p.C)) / p.wd * Math.sin(p.wd * t))
        }
    },
    boxVelocity : function(t,p){
        if(p.z > 1){
            return Math.exp(t*(-p.z*p.wn-p.wd))*
                (-p.z*p.wn*(p.vo+(p.z*p.wn+p.wd)*(p.xo-p.C))/(2*p.wd)*Math.exp(2*p.wd*t)+
                    p.wd*(p.vo+(p.z*p.wn+p.wd)*(p.xo-p.C))/(2*p.wd)*Math.exp(2*p.wd*t)+
                    p.z*p.wn*(p.vo+(p.z*p.wn-p.wd)*(p.xo-p.C))/(2*p.wd)+
                    p.wd*(p.vo+(p.z*p.wn-p.wd)*(p.xo-p.C))/(2*p.wd));
        } else if (p.z === 1){
            return Math.exp(-p.wn*t) * (-p.wn*(p.xo-p.C) -p.wn*(p.vo+p.wn*(p.xo-p.C))*t +(p.vo+p.wn*(p.xo - p.C)));
        } else if (p.z < 1){
            return Math.exp(-p.z*p.wn*t)*((-p.z*p.wn*(p.vo+p.z*p.wn*(p.xo-p.C))/p.wd-(p.xo-p.C)*p.wd)*Math.sin(p.wd*t) +
                (-p.z*p.wn*(p.xo-p.C)+(p.vo+p.z*p.wn*(p.xo-p.C)))*Math.cos(p.wd*t));
        }
    },
    reCalc : function(p){
        if(normalInput) {
            p.wn = Math.sqrt(p.k/p.m);
            p.z = p.c/(2*Math.sqrt(p.k*p.m));
        }
        p.C = 0;
        if (p.z > 1) {
            p.wd = p.wn*Math.sqrt(Math.pow(p.z,2)-1)
        } else if (p.z < 1) {
            p.wd = p.wn*Math.sqrt(1-Math.pow(p.z,2))
        }
    }

}

var case4 = {
    caseNum: 4,
    defaultParam: {k: 60, c:1, m:1, xo:0, vo:0, Lo:2, Yo: 6, w:10},
    magnitude: function(wwn,z){
        return Math.pow(Math.pow(1-Math.pow(wwn,2),2)+Math.pow(2*z*wwn,2),-1/2);
    },
    phaseShift: function(wwn,z){
        return Math.atan((-2*z*wwn)/(1-Math.pow(wwn,2)));
    },
    steadyState: function(t,p){
        return p.Xo*Math.sin(p.w*t+p.phi);
    },
    steadyStateVelocity: function(t,p){
        return p.w*p.Xo*Math.cos(p.w*t+p.phi);
    },
    transient: function(t,p){
        if (p.z > 1) {
            return Math.exp(-p.z*p.wn*t)*
                ((p.voh+(p.z*p.wn+p.wd)*(p.xoh))/(2*p.wd)*Math.exp(p.wd*t)-
                (p.voh+(p.z*p.wn-p.wd)*(p.xoh))/(2*p.wd)*Math.exp(-p.wd*t));
        } else if (p.z === 1) {
            return (p.xoh+(p.voh+p.wn*p.xoh)*t)*Math.exp(-p.wn*t);
        } else if (p.z < 1) {
            return Math.exp(-p.z*p.wn*t)*(p.xoh*Math.cos(p.wd*t)+(p.voh+p.z*p.wn*p.xoh)/p.wd*Math.sin(p.wd*t));
        }
    },
    transientVelocity: function(t,p){
        if(p.z > 1){
            return Math.exp(t*(-p.z*p.wn-p.wd))*
                (-p.z*p.wn*(p.voh+(p.z*p.wn+p.wd)*p.xoh)/(2*p.wd)*Math.exp(2*p.wd*t)+
                p.wd*(p.voh+(p.z*p.wn+p.wd)*p.xoh)/(2*p.wd)*Math.exp(2*p.wd*t)+
                p.z*p.wn*(p.voh+(p.z*p.wn-p.wd)*p.xoh)/(2*p.wd)+
                p.wd*(p.voh+(p.z*p.wn-p.wd)*p.xoh)/(2*p.wd));
        } else if (p.z === 1){
            return Math.exp(-p.wn*t) * (-p.wn*p.xoh -p.wn*(p.voh+p.wn*p.xoh)*t +(p.voh+p.wn*(p.xo - p.C)));
        } else if (p.z < 1){
            return Math.exp(-p.z*p.wn*t)*((-p.z*p.wn*(p.voh+p.z*p.wn*p.xoh)/p.wd-p.xoh*p.wd)*Math.sin(p.wd*t) +
                (-p.z*p.wn*p.xoh+(p.voh+p.z*p.wn*p.xoh))*Math.cos(p.wd*t));
        }
    },
    boxPosition: function(t,p){
        if(showTransient){
            return this.steadyState(t,p) + this.transient(t,p);
        } else {
            return this.steadyState(t,p);
        }
    },
    boxVelocity: function(t,p){
      if(showTransient){
          return this.steadyStateVelocity(t,p) + this.transientVelocity(t,p);
      }  else {
          return this.steadyStateVelocity(t,p);
      }
    },
    reCalc: function (p) {
        if(normalInput){
            p.wn = Math.sqrt(p.k/p.m);
            p.z = p.c/(2*Math.sqrt(p.k*p.m));
            p.K = 1/p.k;
        }
        p.M = this.magnitude(p.w/p.wn,p.z);

        if (p.z > 1) {
            p.wd = p.wn*Math.sqrt(Math.pow(p.z,2)-1);
        } else if (p.z < 1) {
            p.wd = p.wn*Math.sqrt(1-Math.pow(p.z,2));
        }
        p.C = 0;
        p.phi = this.phaseShift(p.w/p.wn,p.z);
        p.Xo = p.K*p.Yo*p.M;
        p.xoh = p.xo-p.C-p.Xo*Math.sin(p.phi);
        p.voh = p.vo - p.Xo*p.w*Math.cos(p.phi);
    }
};

var case5 = {
    caseNum: 5,
    defaultParam: {k: 60, c:1, m:1, xo:0, vo:0, Lo:2, Yo: 1, w:10},
    magnitude: function(wwn,z){
        return Math.pow(1+Math.pow(2*z*wwn,2),1/2)*
        Math.pow(Math.pow(1-Math.pow(wwn,2),2)+Math.pow(2*z*wwn,2),-1/2);
    },
    phaseShift: function(wwn,z){
        return Math.atan((-2*z*Math.pow(wwn,3))/(1-(1-4*z*z)*Math.pow(wwn,2)));
    },
    steadyState: function(t,p){
        return p.Xo*Math.sin(p.w*t+p.phi);
    },
    steadyStateVelocity: function(t,p){
        return p.w*p.Xo*Math.cos(p.w*t+p.phi);
    },
    transient: function(t,p){
        if (p.z > 1) {
            return Math.exp(-p.z*p.wn*t)*
                ((p.voh+(p.z*p.wn+p.wd)*(p.xoh))/(2*p.wd)*Math.exp(p.wd*t)-
                (p.voh+(p.z*p.wn-p.wd)*(p.xoh))/(2*p.wd)*Math.exp(-p.wd*t));
        } else if (p.z === 1) {
            return (p.xoh+(p.voh+p.wn*p.xoh)*t)*Math.exp(-p.wn*t);
        } else if (p.z < 1) {
            return Math.exp(-p.z*p.wn*t)*(p.xoh*Math.cos(p.wd*t)+(p.voh+p.z*p.wn*p.xoh)/p.wd*Math.sin(p.wd*t));
        }
    },
    transientVelocity: function(t,p){
        if(p.z > 1){
            return Math.exp(t*(-p.z*p.wn-p.wd))*
                (-p.z*p.wn*(p.voh+(p.z*p.wn+p.wd)*p.xoh)/(2*p.wd)*Math.exp(2*p.wd*t)+
                p.wd*(p.voh+(p.z*p.wn+p.wd)*p.xoh)/(2*p.wd)*Math.exp(2*p.wd*t)+
                p.z*p.wn*(p.voh+(p.z*p.wn-p.wd)*p.xoh)/(2*p.wd)+
                p.wd*(p.voh+(p.z*p.wn-p.wd)*p.xoh)/(2*p.wd));
        } else if (p.z === 1){
            return Math.exp(-p.wn*t) * (-p.wn*p.xoh -p.wn*(p.voh+p.wn*p.xoh)*t +(p.voh+p.wn*(p.xo - p.C)));
        } else if (p.z < 1){
            return Math.exp(-p.z*p.wn*t)*((-p.z*p.wn*(p.voh+p.z*p.wn*p.xoh)/p.wd-p.xoh*p.wd)*Math.sin(p.wd*t) +
                (-p.z*p.wn*p.xoh+(p.voh+p.z*p.wn*p.xoh))*Math.cos(p.wd*t));
        }
    },
    boxPosition: function(t,p){
        if(showTransient){
            return this.steadyState(t,p) + this.transient(t,p);
        } else {
            return this.steadyState(t,p);
        }
    },
    boxVelocity: function(t,p){
        if(showTransient){
            return this.steadyStateVelocity(t,p) + this.transientVelocity(t,p);
        }  else {
            return this.steadyStateVelocity(t,p);
        }
    },
    reCalc: function (p) {
        if(normalInput){
            p.wn = Math.sqrt(p.k/p.m);
            p.z = p.c/(2*Math.sqrt(p.k*p.m));
            p.K = 1;
        }
        p.M = this.magnitude(p.w/p.wn,p.z);

        if (p.z > 1) {
            p.wd = p.wn*Math.sqrt(Math.pow(p.z,2)-1);
        } else if (p.z < 1) {
            p.wd = p.wn*Math.sqrt(1-Math.pow(p.z,2));
        }
        p.C = 0;
        p.phi = this.phaseShift(p.w/p.wn,p.z);
        p.Xo = p.K*p.Yo*p.M;
        p.xoh = p.xo-p.C-p.Xo*Math.sin(p.phi);
        p.voh = p.vo - p.Xo*p.w*Math.cos(p.phi);
    },
    basePosition: function(t,p){
        return p.Yo*Math.sin(p.w*t)
    }
};

var case6 = {
    caseNum: 6,
    defaultParam: {k: 60, c:1, m:1, xo:0, vo:0, Lo:2, Yo: 0.8, w:10, mo: 0.05},
    magnitude: function(wwn,z){
        return Math.pow(wwn,2)* Math.pow(Math.pow(1-Math.pow(wwn,2),2)+Math.pow(2*z*wwn,2), -1/2);
    },
    phaseShift: function(wwn,z){
        return Math.atan((-2*z*wwn)/(1-Math.pow(wwn,2)));
    },
    steadyState: function(t,p){
        return p.Xo*Math.sin(p.w*t+p.phi);
    },
    steadyStateVelocity: function(t,p){
        return p.w*p.Xo*Math.cos(p.w*t+p.phi);
    },
    transient: function(t,p){
        if (p.z > 1) {
            return Math.exp(-p.z*p.wn*t)*
                ((p.voh+(p.z*p.wn+p.wd)*(p.xoh))/(2*p.wd)*Math.exp(p.wd*t)-
                (p.voh+(p.z*p.wn-p.wd)*(p.xoh))/(2*p.wd)*Math.exp(-p.wd*t));
        } else if (p.z === 1) {
            return (p.xoh+(p.voh+p.wn*p.xoh)*t)*Math.exp(-p.wn*t);
        } else if (p.z < 1) {
            return Math.exp(-p.z*p.wn*t)*(p.xoh*Math.cos(p.wd*t)+(p.voh+p.z*p.wn*p.xoh)/p.wd*Math.sin(p.wd*t));
        }
    },
    transientVelocity: function(t,p){
        if(p.z > 1){
            return Math.exp(t*(-p.z*p.wn-p.wd))*
                (-p.z*p.wn*(p.voh+(p.z*p.wn+p.wd)*p.xoh)/(2*p.wd)*Math.exp(2*p.wd*t)+
                p.wd*(p.voh+(p.z*p.wn+p.wd)*p.xoh)/(2*p.wd)*Math.exp(2*p.wd*t)+
                p.z*p.wn*(p.voh+(p.z*p.wn-p.wd)*p.xoh)/(2*p.wd)+
                p.wd*(p.voh+(p.z*p.wn-p.wd)*p.xoh)/(2*p.wd));
        } else if (p.z === 1){
            return Math.exp(-p.wn*t) * (-p.wn*p.xoh -p.wn*(p.voh+p.wn*p.xoh)*t +(p.voh+p.wn*(p.xo - p.C)));
        } else if (p.z < 1){
            return Math.exp(-p.z*p.wn*t)*((-p.z*p.wn*(p.voh+p.z*p.wn*p.xoh)/p.wd-p.xoh*p.wd)*Math.sin(p.wd*t) +
                (-p.z*p.wn*p.xoh+(p.voh+p.z*p.wn*p.xoh))*Math.cos(p.wd*t));
        }
    },
    boxPosition: function(t,p){
        if(showTransient){
            return this.steadyState(t,p) + this.transient(t,p);
        } else {
            return this.steadyState(t,p);
        }
    },
    boxVelocity: function(t,p){
        if(showTransient){
            return this.steadyStateVelocity(t,p) + this.transientVelocity(t,p);
        }  else {
            return this.steadyStateVelocity(t,p);
        }
    },
    reCalc: function (p) {
        if(normalInput){
            p.wn = Math.sqrt(p.k/(p.m+p.mo));
            p.z = p.c/(2*Math.sqrt(p.k*(p.m+p.mo)));
            p.K = p.mo/p.m;
        }
        p.M = this.magnitude(p.w/p.wn,p.z);

        if (p.z > 1) {
            p.wd = p.wn*Math.sqrt(Math.pow(p.z,2)-1);
        } else if (p.z < 1) {
            p.wd = p.wn*Math.sqrt(1-Math.pow(p.z,2));
        }
        p.C = 0;
        p.phi = this.phaseShift(p.w/p.wn,p.z);

        p.Xo = p.K*p.Yo*p.M;
        p.xoh = p.xo-p.C-p.Xo*Math.sin(p.phi);
        p.voh = p.vo - p.w*p.Xo*Math.cos(p.phi);
    },
    ballPosition: function(t,p){
        return {xPos: p.Yo*Math.cos(p.w*t),yPos: p.Yo*Math.sin(p.w*t)};
    }
};

var scene = new p5( function( s ) {

    //pixel/meter
    var scale = canvasHeight/8;
    var initBase = 1;

    //Box Object
    function Box(w,h){
        this.width = w;
        this.height = h;
        this.draw = function(){
            s.fill('white');
            s.strokeWeight(1);
            s.rect(sceneWidth/2,-scale*(this.position),this.width*scale,this.height*scale);
            if(allSys.last().caseObj.caseNum === 6){
                var ballPos = allSys.last().caseObj.ballPosition(tNow,allSys.last().param,this.position);
                s.strokeWeight(3);
                s.line(sceneWidth/2,-this.position*scale,sceneWidth/2+ballPos.xPos*scale,-(ballPos.yPos+this.position)*scale);
                s.strokeWeight(1);
                s.ellipse(sceneWidth/2+ballPos.xPos*scale,-(ballPos.yPos+this.position)*scale,20,20);
                s.fill(100);
                s.ellipse(sceneWidth/2,-this.position*scale,10,10);
            }
        };

        this.updatePosition = function(tNow){
            this.position = allSys.last().caseObj.boxPosition(tNow,allSys.last().param)+allSys.last().param.Lo + initBase;
        }
    }

    //Base Object
    function Base(h){
        this.position = initBase;
        this.updatePosition = function(tNow){
            this.position = allSys.last().caseObj.basePosition(tNow,allSys.last().param) + initBase;
        };

        this.draw = function(){
            s.stroke(0);
            s.strokeWeight(1);
            s.fill(220);

            s.rect(sceneWidth/2,-(this.position-0.2)*scale,2*scale,0.4*scale);
            // s.line(sceneWidth/2-scale/2,-this.position*scale,sceneWidth/2+scale/2,-this.position*scale);
        }
    }

    //Spring Object
    function Spring(top,bottom){
        this.topAnchor = top;
        this.bottomAnchor = bottom;
        this.draw = function(){
            var mid;
            if(allSys.last().caseObj.caseNum < 3){
                mid = sceneWidth/2
            } else {
                mid = sceneWidth/2-top.width*scale*0.3;
            }
            var l = this.topAnchor.position - this.bottomAnchor.position;
            var folds = 16;
            s.stroke(0);
            s.strokeWeight(3);
            for(i=0;i<=folds-2;i+=2){
                s.line(mid-10,-((i*l/folds+bottom.position)*scale),mid+10,-(((i+1)*l/folds+bottom.position)*scale));
                s.line(mid+10,-(((i+1)*l/folds+bottom.position)*scale),mid-10,-(((i+2)*l/folds+bottom.position)*scale));
            }
            s.strokeWeight(1);
        };
    }

    //Dashpot Object
    function Dashpot(top,bottom){
        this.topAnchor = top;
        this.bottomAnchor = bottom;
        this.draw = function(){
            var mid;
            if(allSys.last().caseObj.caseNum < 3){
                mid = sceneWidth/2
            } else {
                mid = sceneWidth/2+top.width*scale*0.3;
            }
            var l = this.topAnchor.position - this.bottomAnchor.position;
            var folds = 16;
            var staticLength = allSys.last().param.Lo;

            s.fill(200);
            s.stroke(0);
            s.strokeWeight(3);
            s.line(mid,-this.bottomAnchor.position*scale,mid,-this.topAnchor.position*scale);
            s.rect(mid,-(l/2+this.bottomAnchor.position)*scale,20,30);

        };
    }

    //System Object
    s.System = function(num){
        switch (num){
            case 1:
                this.caseObj = case1;
                this.param = case1.defaultParam;
                break;
            case 2:
                this.caseObj = case2;
                this.param = case2.defaultParam;
                break;
            case 3:
                this.caseObj = case3;
                this.param = case3.defaultParam;
                break;
            case 4:
                this.caseObj = case4;
                this.param = case4.defaultParam;
                break;
            case 5:
                this.caseObj = case5;
                this.param = case5.defaultParam;
                break;
            case 6:
                this.caseObj = case6;
                this.param = case6.defaultParam;
                break;
        }

        this.posGraph = new graph.graphObj(graphWidth/5,graphWidth/5,1);
        this.ampGraph = new graph.graphObj(graphWidth/4,canvasHeight/2,2);
        this.phaseGraph = new graph.graphObj(graphWidth/4,canvasHeight/2,3);
        this.phasePlane = new graph.graphObj(graphWidth/4,canvasHeight/2,4);

        this.box = new Box(1,1);
        this.base = new Base(0);
        this.spring = new Spring(this.box,this.base);
        this.dashpot = new Dashpot(this.box,this.base);

        this.reCalc = function(){
            this.caseObj.reCalc(this.param);
            updateUI();
        };

        this.drawSystem = function(tNow){
            this.box.updatePosition(tNow,this.param);
            if(this.caseObj.caseNum === 5){
                this.base.updatePosition(tNow,this.param);
            }

            this.base.draw();
            this.spring.draw();
            if(this.caseObj.caseNum > 2){
                this.dashpot.draw();
            }
            this.box.draw();
        }
    };

    s.setup = function() {
        sceneWidth = $("#col1").width();
        graphWidth = ($("#col1").width()+10)*3-10;
        s.createCanvas(sceneWidth, sceneHeight);
        s.rectMode(s.CENTER);
        allSys[0] = new this.System(1);
        allSys.last().caseObj.reCalc(allSys.last().param);
    };

    s.draw = function() {
        s.translate(0,sceneHeight);
        s.background(200);

        s.strokeWeight(1);
        s.fill(0);
        s.textSize(14);
        s.text("0.5 m",5,-(allSys.last().param.Lo+initBase+0.5)*scale-5);
        s.text("-0.5 m",5,-(allSys.last().param.Lo+initBase-0.5)*scale+15);

        s.stroke(100);
        s.strokeWeight(2);
        s.line(0,-(allSys.last().param.Lo+initBase+0.5)*scale,30,-(allSys.last().param.Lo+initBase+0.5)*scale);
        s.line(0,-(allSys.last().param.Lo+initBase+0.25)*scale,20,-(allSys.last().param.Lo+initBase+0.25)*scale);
        s.line(0,-(allSys.last().param.Lo+initBase)*scale,sceneWidth,-(allSys.last().param.Lo+initBase)*scale);
        s.line(0,-(allSys.last().param.Lo+initBase-0.25)*scale,20,-(allSys.last().param.Lo+initBase-0.25)*scale);
        s.line(0,-(allSys.last().param.Lo+initBase-0.5)*scale,30,-(allSys.last().param.Lo+initBase-0.5)*scale);

        s.strokeWeight(1);

        if(running && s.frameRate() > 10 && tNow < 120){
            tNow += 1/60.0;
        }
        s.stroke(0);
        s.fill(0);
        s.textSize(16);
        s.text(tNow.toFixed(2) + " s",20,-sceneHeight+40);
        allSys.last().drawSystem(tNow);

        s.fill(100);
    };

    s.restartScene = function() {
        tNow = 0;
    }

}, 'scene-holder');

var graph = new p5( function( s ) {

    //1: position, 2: amplitude, 3: phase shift, 4: phase plane
    s.graphDisp = 1;
    var dataPoints = 1000;
    var maxChanged = true;
    var xRes, yRes;

    s.graphObj = function (xResIn,yResIn,graphType){
        this.t = new Array;
        this.y = new Array;
        this.graphType = graphType;

        this.loadData = function () {
            switch (this.graphType) {
                case 1:
                    this.t.push(tNow);
                    this.y.push((allSys.last().caseObj.boxPosition(tNow,allSys.last().param)));
                    if (this.t.length === 1) {
                        this.max = Math.abs(this.y[this.y.length - 1]);
                        maxChanged = true;
                    } else {
                        if (Math.abs(this.y[this.y.length - 1]) > this.max) {
                            this.max = Math.abs(this.y[this.y.length - 1]);
                            maxChanged = true;
                        }
                    }
                    if (tNow > graphWidth / xRes && s.graphDisp === 1) {
                        maxChanged = true;
                        xRes *= 0.75;
                    }
                    if (s.graphDisp === 1) yRes = canvasHeight/(2*this.max*1.8);
                    break;
                case 2:
                    for (i = 0.01; i < graphWidth / xRes; i += (graphWidth / xRes) / dataPoints) {
                        this.t.push(i);
                        if (allSys.last().caseObj.caseNum === 6) {
                            this.y.push(allSys.last().caseObj.magnitude(i, allSys.last().param.z));
                        } else {
                            this.y.push(Math.log(allSys.last().caseObj.magnitude(i, allSys.last().param.z)) / Math.log(10));
                        }

                        if (this.t.length === 1) {
                            this.max = (this.y[this.y.length - 1]);
                        } else {
                            if (this.y.last() > this.max) {
                                this.max = this.y.last();
                            }
                        }
                    }
                    break;
                case 3:
                    for (i = 0; i < graphWidth / xRes; i += (graphWidth / xRes) / dataPoints) {
                        this.t.push(i);
                        this.y.push(allSys.last().caseObj.phaseShift(i,allSys.last().param.z));

                        if (this.t.length === 1) {
                            this.max = (this.y[this.y.length - 1]);
                        } else {
                            if (this.y[this.y.length - 1] > this.max) {
                                this.max = this.y[this.y.length - 1];
                            }
                        }
                    }
                    break;
                case 4:
                    if (this.t.length === 0) {
                        this.t.push((allSys.last().caseObj.boxPosition(0,allSys.last().param)));
                        this.y.push((allSys.last().caseObj.boxVelocity(0,allSys.last().param)));
                        this.xMax = Math.abs(this.t[this.t.length - 1]);
                        this.max = Math.abs(this.y[this.y.length - 1]);
                        maxChanged = true;
                    }
                    this.t.push((allSys.last().caseObj.boxPosition(tNow,allSys.last().param)));
                    this.y.push((allSys.last().caseObj.boxVelocity(tNow,allSys.last().param)));
                    if (Math.abs(this.y[this.y.length - 1]) > this.max) {
                        this.max = Math.abs(this.y[this.y.length - 1]);
                        maxChanged = true;
                    }
                    if (Math.abs(this.t[this.t.length - 1]) > this.xMax) {
                        this.xMax = Math.abs(this.t[this.t.length - 1]);
                        maxChanged = true;
                    }
                    if(s.graphDisp === 4) xRes = graphWidth/(2*this.xMax*1.5);
                    if (s.graphDisp === 4) yRes = canvasHeight/(2*this.max*1.8);
                    break;
            }

        };

        this.drawGraph = function () {
            s.stroke(0);
            s.strokeWeight(1.2);
            for(i = 0;i<this.t.length-1;i++){
                s.line(this.t[i]*xRes,-this.y[i]*yRes,this.t[i+1]*xRes,-this.y[i+1]*yRes);
            }
            if(this.graphType === 2){
                s.stroke('red');
                s.fill('red');
                if(allSys.last().caseObj.caseNum === 6){
                    s.ellipse((allSys.last().param.w/allSys.last().param.wn)*xRes, -(allSys.last().caseObj.magnitude(allSys.last().param.w/allSys.last().param.wn,allSys.last().param.z))*yRes,10,10);
                } else {
                    s.ellipse((allSys.last().param.w/allSys.last().param.wn)*xRes, -Math.log(allSys.last().caseObj.magnitude(allSys.last().param.w/allSys.last().param.wn,allSys.last().param.z))/Math.log(10)*yRes,10,10);
                }
                s.stroke(0);
                s.fill(0);
            } else if(this.graphType === 3){
                s.stroke('red');
                s.fill('red');
                s.ellipse((allSys.last().param.w/allSys.last().param.wn)*xRes, -(allSys.last().caseObj.phaseShift(allSys.last().param.w/allSys.last().param.wn,allSys.last().param.z))*yRes,10,10);
                s.stroke(0);
                s.fill(0);
            }
        };

        this.drawNext = function(){
            s.stroke(0);
            s.strokeWeight(1.2);
            var end = this.t.length-1;
            s.line(this.t[end-1]*xRes,-this.y[end-1]*yRes,this.t[end]*xRes,-this.y[end]*yRes);
        };

        this.drawGrid = function(){
            var inc, tickNum, tickSpaceX;

            s.stroke(200);
            s.line(0,canvasHeight/2,0,-canvasHeight/2);

            //X,Y axis
            s.text(0,0,-3);
            s.strokeWeight(3);
            s.stroke(180);
            if(this.graphType === 4){
                s.line(-graphWidth/2,0,graphWidth/2,0);
            } else {
                s.line(0,0,graphWidth,0);
            }
            s.strokeWeight(1);

            if(this.graphType === 1){
                tickSpaceX = Math.ceil((graphWidth/xRes)/6);
                for(i=tickSpaceX;i<=graphWidth;i+=tickSpaceX){
                    s.line(i*xRes,canvasHeight/2,i*xRes,-canvasHeight/2);
                    s.text((i),i*xRes+3,canvasHeight/2-3);
                }

            } else if(this.graphType === 4){

                inc = Math.round(Math.log(this.xMax)/Math.log(10));
                inc = inc - 1;
                tickSpaceX = Math.round(Math.pow(10,-inc)*canvasHeight/(2*5*xRes))*Math.pow(10,inc);
                for(j=tickSpaceX;j<=graphWidth/(2*xRes);j+=tickSpaceX){
                    s.line(j*xRes,canvasHeight/2,j*xRes,-canvasHeight/2);
                    s.line(-j*xRes,canvasHeight/2,-j*xRes,-canvasHeight/2);
                    tickNum = j.toFixed(Math.abs(inc));
                    s.text(tickNum,(j*xRes+5),-3);
                    s.text(-tickNum,-(j*xRes-5),-3);
                }
            } else {
                for(i=0;i<=graphWidth;i+=xRes){
                    s.line(i,canvasHeight/2,i,-canvasHeight/2);
                    if(i !== 0) s.text((i/xRes).toFixed(0),i+3,canvasHeight/2-3);
                }
            }


            inc = Math.round(Math.log(this.max)/Math.log(10));
            inc = inc - 1;
            var tickSpaceY = Math.round(Math.pow(10,-inc)*canvasHeight/(2*5*yRes))*Math.pow(10,inc);
            for(j=tickSpaceY;j<=canvasHeight/(2*yRes);j+=tickSpaceY){
                if(this.graphType === 4){
                    s.line(-graphWidth/2,j*yRes,graphWidth/2,j*yRes);
                    s.line(-graphWidth/2,-j*yRes,graphWidth/2,-j*yRes);
                } else {
                    s.line(0,j*yRes,graphWidth,j*yRes);
                    s.line(0,-j*yRes,graphWidth,-j*yRes);
                }
                tickNum = j.toFixed(Math.abs(inc));
                if(this.graphType === 2 && (allSys.last().caseObj.caseNum === 4 || allSys.last().caseObj.caseNum === 5)){
                    s.text("10^" + tickNum,0,-(j*yRes+3));
                    s.text("10^" + (-tickNum),0,(j*yRes-3));
                } else {
                    s.text(tickNum,0,-(j*yRes+3));
                    s.text(-tickNum,0,(j*yRes-3));
                }
            }
        }
    }

    s.setup = function() {
        //700;
        s.createCanvas(graphWidth, canvasHeight);
        xRes =  graphWidth / 5;
        yRes =  graphWidth / 5;
    };

    s.draw = function() {
        if(s.graphDisp === 4){
            s.translate(graphWidth/2,canvasHeight/2);
        } else {
            s.translate(0,canvasHeight/2);
        }
        if(running){
            allSys.last().posGraph.loadData();
            allSys.last().phasePlane.loadData();
        }
        var v;
        switch (s.graphDisp){
            case 1:
                if(maxChanged){
                    s.background(240);
                    allSys.last().posGraph.drawGrid();
                    for(v=0;v<allSys.length;v++){
                        allSys[v].posGraph.drawGraph();
                    }
                    maxChanged = false;
                } else {
                    if(running) allSys.last().posGraph.drawNext();
                }

                break;
            case 2:
                s.background(240);
                allSys.last().ampGraph.drawGrid();
                for(v=0;v<allSys.length;v++){
                    if (allSys[v].caseObj.caseNum > 3){
                        if (maxChanged){
                            allSys[v].ampGraph.loadData();
                            console.log("aa");
                            maxChanged = false;
                        }
                        allSys[v].ampGraph.drawGraph();
                    }
                }
                break;
            case 3:
                s.background(240);
                for(v=0;v<allSys.length;v++){

                }
                allSys.last().phaseGraph.drawGrid();
                allSys.last().phaseGraph.drawGraph();
                break;
            case 4:
                if(maxChanged){
                    s.background(240);
                    allSys.last().phasePlane.drawGrid();
                    for(v=0;v<allSys.length;v++){
                        allSys[v].phasePlane.drawGraph();
                    }
                    maxChanged = false;
                } else {
                    allSys.last().phasePlane.drawNext();
                }
                break;
        }
    };

    s.clear = function(){
        allSys.last().posGraph.loadData();
        allSys.last().phasePlane.loadData();
    }

    s.redrawGraph = function(){
        maxChanged = true;
        for(i=0;i<allSys.length;i++) {
            // allSys[i].posGraph = new s.graphObj(graphWidth / 5, graphWidth / 5, 1);
            // allSys[i].ampGraph = new s.graphObj(graphWidth / 4, canvasHeight / 2, 2);
            // allSys[i].phaseGraph = new s.graphObj(graphWidth / 4, canvasHeight / 2, 3);
            // allSys[i].phasePlane = new s.graphObj(graphWidth / 5, canvasHeight / 5, 4);
            if (allSys[i].caseObj.caseNum > 3) {
                allSys[i].ampGraph.loadData();
                allSys[i].phaseGraph.loadData();
            }
        }
        s.loop();
    };

    s.switchGraph = function(x){
        s.graphDisp = x;
        maxChanged = true;
    };

    s.setGraphRes = function (){
        for(i=0;i<allSys.length;i++) {
            // allSys[i].posGraph.xRes = graphWidth / 5;
            // allSys[i].posGraph.yRes = graphWidth / 5;
            // allSys[i].phasePlane.xRes = graphWidth / 5;
            // allSys[i].phasePlane.yRes = graphWidth / 5;
            maxChanged = true;
            allSys[i].ampGraph = new s.graphObj(graphWidth / 4, canvasHeight / 2, 2);
            allSys[i].phaseGraph = new s.graphObj(graphWidth / 4, canvasHeight / 2, 3);
            if (allSys[i].caseObj.caseNum > 3) {
                allSys[i].ampGraph.loadData();
                allSys[i].phaseGraph.loadData();
            }
        }
    };


}, 'graph-holder');


function updateUI(){
    kDisp.innerHTML = "Spring Stiffness: " + allSys.last().param.k.toFixed(2) + " N/m";
    kSlider.value = allSys.last().param.k.toFixed(2);

    mDisp.innerHTML = "Mass: " + allSys.last().param.m.toFixed(2) + " kg";
    mSlider.value = allSys.last().param.m.toFixed(2);

    wnDisp.innerHTML = "Natural Freq: " + allSys.last().param.wn.toFixed(3) + " rad/s";
    wnSlider.value = allSys.last().param.wn.toFixed(3);

    xoDisp.innerHTML = "Initial Position: " + allSys.last().param.xo.toFixed(2) + " m";
    xoSlider.value = allSys.last().param.xo.toFixed(2);

    voDisp.innerHTML = "Initial Velocity: " + allSys.last().param.vo.toFixed(3) + " m/s";
    voSlider.value = allSys.last().param.vo.toFixed(3);

    if(allSys.last().caseObj.caseNum > 2){
        cDisp.innerHTML = "Dashpot Coeft.: " + allSys.last().param.c.toFixed(2) + " Ns/m";
        cSlider.value = allSys.last().param.c.toFixed(2);

        zDisp.innerHTML = "Damping Coeft. ($\\zeta$): " + allSys.last().param.z.toFixed(3);
        zSlider.value = allSys.last().param.z.toFixed(2);

    } else {
        cDisp.innerHTML = "Dashpot Coeft.: N/A";
        zDisp.innerHTML = "Damping Coeft.: N/A";
    }

    if(allSys.last().caseObj.caseNum > 3) {
        ampDisp.innerHTML = "Amplification: " + allSys.last().param.K.toFixed(3);
        ampSlider.value = allSys.last().param.K.toFixed(2);

        wDisp.innerHTML = "Frequency: " + allSys.last().param.w.toFixed(2) + " rad/s";
        wSlider.value = allSys.last().param.w.toFixed(2);

        switch (allSys.last().caseObj.caseNum){
            case 4:
                magDisp.innerHTML = "Force Amplitude: " + allSys.last().param.Yo.toFixed(2) + " N";
                break;
            case 5:
                magDisp.innerHTML = "Base Amplitude: " + allSys.last().param.Yo.toFixed(2) + " m";
                break;
            case 6:
                magDisp.innerHTML = "Rotor Length: " + allSys.last().param.Yo.toFixed(2) + " m";
                break;
        }
        magSlider.value = allSys.last().param.Yo.toFixed(2);
    } else {
        ampDisp.innerHTML = "Amplification: N/A";
        wDisp.innerHTML = "Frequency: N/A";
        magDisp.innerHTML = "Magnitude: N/A";
    }

    if(normalInput){
        $("#sys_div").addClass("activeInput");
        $("#der_div").addClass("inactiveInput");

        $("#sys_div").removeClass("inactiveInput");
        $("#der_div").removeClass("activeInput");
    } else {
        $("#sys_div").addClass("inactiveInput");
        $("#der_div").addClass("activeInput");

        $("#sys_div").removeClass("activeInput");
        $("#der_div").removeClass("inactiveInput");
    }

    // MathJax.Hub.Queue(["Typeset",MathJax.Hub]);
}

function clear(){
    var current = allSys.last().caseObj.caseNum;
    allSys = [new scene.System(current)];
    allSys.last().reCalc();
    scene.restartScene();
    graph.clear();
}

function restart(){
    allSys.last().reCalc();
    scene.restartScene();
    if(allSys.last().caseObj.caseNum < 4 && (graph.graphDisp === 2 || graph.graphDisp === 3)){
        graph.switchGraph(1);
    }
    //graph.redrawGraph();
}

window.addEventListener('resize', function(event){
    graphWidth = (col1.width()+10)*3-10;
    sceneWidth = col1.width();
    graph.setGraphRes();
    graph.resizeCanvas(graphWidth,canvasHeight);
    scene.resizeCanvas(sceneWidth,sceneHeight);
});

function changeUI(){
    normalInput = true;

    if (allSys.last().caseObj.caseNum > 3){
        if(! col1.has('#ext_header').length){
            $(".ext_controls").show();
        }
        switch (allSys.last().caseObj.caseNum) {
            case 4:
                magSlider.setAttribute("max",30);
                break;
            case 5:
                magSlider.setAttribute("max",0.5);
                break;
            case 6:
                magSlider.setAttribute("max",1.5);
                break;
        }
    } else {
        $(".ext_controls").hide();
    }
}

function sliderChanged(){
    running = false;
    if(newSys) {
        allSys.push(new scene.System(allSys.last().caseObj.caseNum));
        allSys.last().param = jQuery.extend({},allSys[allSys.length-2].param);
        scene.restartScene();
    }
    newSys = false;
}

window.onload = function() {
    col1 = $("#col1");

    kDisp = document.getElementById("k_disp");
    kSlider = document.getElementById("k_slider");
    kSlider.oninput = function () {
        normalInput = true;
        sliderChanged();
        allSys.last().param.k = parseFloat(kSlider.value);
        restart();
    };

    mSlider = document.getElementById("m_slider");
    mDisp = document.getElementById("m_disp");
    mSlider.oninput = function () {
        normalInput = true;
        sliderChanged();
        allSys.last().param.m = parseFloat(mSlider.value);
        restart();
    };

    cSlider = document.getElementById("c_slider");
    cDisp = document.getElementById("c_disp");
    cSlider.oninput = function () {
        normalInput = true;
        sliderChanged();
        allSys.last().param.c = parseFloat(cSlider.value);
        restart();
    };

    xoSlider = document.getElementById("xo_slider");
    xoDisp = document.getElementById("xo_disp");
    xoSlider.oninput = function () {
        sliderChanged();
        allSys.last().param.xo = parseFloat(xoSlider.value);
        restart();
    };

    voSlider = document.getElementById("vo_slider");
    voDisp = document.getElementById("vo_disp");
    voSlider.oninput = function () {
        sliderChanged();
        allSys.last().param.vo = parseFloat(voSlider.value);
        restart();
    };

    wnSlider = document.getElementById("wn_slider");
    wnDisp = document.getElementById("wn_disp");
    wnSlider.oninput = function () {
        normalInput = false;
        sliderChanged();
        allSys.last().param.wn = parseFloat(wnSlider.value);
        restart();
    };

    zSlider = document.getElementById("z_slider");
    zDisp = document.getElementById("z_disp");
    zSlider.oninput = function () {
        normalInput = false;
        sliderChanged();
        allSys.last().param.z = parseFloat(zSlider.value);
        restart();
    };

    ampSlider = document.getElementById("amp_slider");
    ampDisp = document.getElementById("amp_disp");
    ampSlider.oninput = function () {
        normalInput = false;
        sliderChanged();
        allSys.last().param.K = parseFloat(ampSlider.value);
        restart();
    };

    wSlider = document.getElementById("w_slider");
    wDisp = document.getElementById("w_disp");
    wSlider.oninput = function () {
        sliderChanged();
        allSys.last().param.w = parseFloat(wSlider.value);
        restart();
    };

    magSlider = document.getElementById("mag_slider");
    magDisp = document.getElementById("mag_disp");
    magSlider.oninput = function () {
        sliderChanged();
        allSys.last().param.Yo = parseFloat(magSlider.value);
        restart();
    };

    document.getElementById("stop_btn").onclick = function(){
        running = false;
    };

    document.getElementById("start_btn").onclick = function(){
        newSys = true;
        running = true;
        // for(i=0;i<allSys.length;i++){
        //     console.log(allSys[i].param);
        // }
    };

    document.getElementById("reset_btn").onclick = function(){
        clear();
    }

    document.getElementById("pos_graph").onclick = function(){
        graph.switchGraph(1);
    };

    document.getElementById("amp_graph").onclick = function(){
        if(allSys.last().caseObj.caseNum > 3){
            graph.switchGraph(2);
        } else {
            window.alert("No Amplitude Graph for Case " + allSys.last().caseObj.caseNum);
        }
    };

    document.getElementById("phase_graph").onclick = function(){
        if(allSys.last().caseObj.caseNum > 3){
            graph.switchGraph(3);
        } else {
            window.alert("No Phase Shift Graph for Case " + allSys.last().caseObj.caseNum);
        }
    };

    document.getElementById("phase_plane").onclick = function(){
        graph.switchGraph(4);
    };

    document.getElementById("transient_checkbox").onclick = function(){
        showTransient = this.checked;
        restart();
    };

    document.getElementById("case1_button").onclick = function() {
        running = false;
        allSys.push(new scene.System(1));
        changeUI();
        restart();
        document.getElementById("header").innerHTML = "Case I: Free Vibration on Spring";
    };
    document.getElementById("case3_button").onclick = function(){
        running = false;
        allSys.push(new scene.System(3));
        changeUI();
        restart();
        document.getElementById("header").innerHTML = "Case III: Free Vibration on Spring and Dashpot";
    };
    document.getElementById("case4_button").onclick = function(){
        running = false;
        allSys.push(new scene.System(4));
        changeUI();
        restart();
        document.getElementById("header").innerHTML = "Case IV: Externally Forced System";
    };
    document.getElementById("case5_button").onclick = function(){
        running = false;
        allSys.push(new scene.System(5));
        changeUI();
        restart();
        document.getElementById("header").innerHTML = "Case V: Base Excited System";
    };
    document.getElementById("case6_button").onclick = function(){
        running = false;
        allSys.push(new scene.System(6));
        changeUI();
        restart();
        document.getElementById("header").innerHTML = "Case VI: Rotor Excited System";
    };
    changeUI();
    updateUI();
};



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

var sys;

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
        }
        p.M = this.magnitude(p.w/p.wn,p.z);

        if (p.z > 1) {
            p.wd = p.wn*Math.sqrt(Math.pow(p.z,2)-1);
        } else if (p.z < 1) {
            p.wd = p.wn*Math.sqrt(1-Math.pow(p.z,2));
        }
        p.C = 0;
        p.phi = this.phaseShift(p.w/p.wn,p.z);
        p.Xo = 1/p.k*p.Yo*p.M;
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
        }
        p.M = this.magnitude(p.w/p.wn,p.z);

        if (p.z > 1) {
            p.wd = p.wn*Math.sqrt(Math.pow(p.z,2)-1);
        } else if (p.z < 1) {
            p.wd = p.wn*Math.sqrt(1-Math.pow(p.z,2));
        }
        p.C = 0;
        p.phi = this.phaseShift(p.w/p.wn,p.z);
        p.Xo = p.Yo*p.M;
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
        }
        p.M = this.magnitude(p.w/p.wn,p.z);

        if (p.z > 1) {
            p.wd = p.wn*Math.sqrt(Math.pow(p.z,2)-1);
        } else if (p.z < 1) {
            p.wd = p.wn*Math.sqrt(1-Math.pow(p.z,2));
        }
        p.C = 0;
        p.phi = this.phaseShift(p.w/p.wn,p.z);

        p.Xo = p.mo/p.m*p.Yo*p.M;
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
            if(sys.caseObj.caseNum === 6){
                var ballPos = sys.caseObj.ballPosition(tNow,sys.param,this.position);
                s.strokeWeight(3);
                s.line(sceneWidth/2,-this.position*scale,sceneWidth/2+ballPos.xPos*scale,-(ballPos.yPos+this.position)*scale);
                s.strokeWeight(1);
                s.ellipse(sceneWidth/2+ballPos.xPos*scale,-(ballPos.yPos+this.position)*scale,20,20);
                s.fill(100);
                s.ellipse(sceneWidth/2,-this.position*scale,10,10);
            }
        };

        this.updatePosition = function(tNow){
            this.position = sys.caseObj.boxPosition(tNow,sys.param)+sys.param.Lo + initBase;
        }
    }

    //Base Object
    function Base(h){
        this.position = initBase;

        this.updatePosition = function(tNow){
            this.position = sys.caseObj.basePosition(tNow,sys.param) + initBase;
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
            if(sys.caseObj.caseNum < 3){
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
            if(sys.caseObj.caseNum < 3){
                mid = sceneWidth/2
            } else {
                mid = sceneWidth/2+top.width*scale*0.3;
            }
            var l = this.topAnchor.position - this.bottomAnchor.position;
            var folds = 16;
            var staticLength = sys.param.Lo;

            s.fill(200);
            s.stroke(0);
            s.strokeWeight(3);
            s.line(mid,-this.bottomAnchor.position*scale,mid,-this.topAnchor.position*scale);
            s.rect(mid,-(l/2+this.bottomAnchor.position)*scale,20,30);

            //U
            // s.line(mid-10,-bottom.position*scale,mid+10,-bottom.position*scale);
            // s.line(mid-10,-bottom.position*scale,mid-10,-(staticLength/2+bottom.position)*scale);
            // s.line(mid+10,-bottom.position*scale,mid+10,-(staticLength/2+bottom.position)*scale);
            // //T
            // s.line(mid-10,-(l-staticLength*3/4+bottom.position)*scale,mid+10,-(l-staticLength*3/4+bottom.position)*scale);
            // s.line(mid,-(-staticLength*3/4+top.position)*scale,mid,-top.position*scale);
            // s.strokeWeight(1);
        };
    }

    //System Object
    s.System = function(param,caseObj){
        this.param = param;
        this.caseObj = caseObj;

        this.box = new Box(1,1);
        this.base = new Base(0);
        this.spring = new Spring(this.box,this.base);
        this.dashpot = new Dashpot(this.box,this.base);

        this.reCalc = function(){
            caseObj.reCalc(param);
            updateUI();
        };

        this.drawSystem = function(tNow){
            this.box.updatePosition(tNow,this.param);
            if(this.caseObj.caseNum === 5){
                this.base.updatePosition(tNow,this.param);
            }

            this.base.draw();
            this.spring.draw();
            if(caseObj.caseNum > 2){
                this.dashpot.draw();
            }
            this.box.draw();
        }
    };

    s.setup = function() {
        sceneWidth = $("#col1").width();//300;
        s.createCanvas(sceneWidth, sceneHeight);
        s.rectMode(s.CENTER);
        sys = new this.System(case1.defaultParam,case1);
        sys.caseObj.reCalc(sys.param);
    };

    s.draw = function() {
        // console.log(s.frameRate());
        s.translate(0,sceneHeight);
        s.background(200);

        s.strokeWeight(1);
        s.fill(0);
        s.textSize(14);
        s.text("0.5 m",5,-(sys.param.Lo+initBase+0.5)*scale-5);
        s.text("-0.5 m",5,-(sys.param.Lo+initBase-0.5)*scale+15);

        s.stroke(100);
        s.strokeWeight(2);
        s.line(0,-(sys.param.Lo+initBase+0.5)*scale,30,-(sys.param.Lo+initBase+0.5)*scale);
        s.line(0,-(sys.param.Lo+initBase+0.25)*scale,20,-(sys.param.Lo+initBase+0.25)*scale);
        s.line(0,-(sys.param.Lo+initBase)*scale,sceneWidth,-(sys.param.Lo+initBase)*scale);
        s.line(0,-(sys.param.Lo+initBase-0.25)*scale,20,-(sys.param.Lo+initBase-0.25)*scale);
        s.line(0,-(sys.param.Lo+initBase-0.5)*scale,30,-(sys.param.Lo+initBase-0.5)*scale);

        s.strokeWeight(1);

        if(running && s.frameRate() > 10 && tNow < 120){
            // tNow += 1/s.frameRate();
            tNow += 1/60.0;
        }
        s.stroke(0);
        s.fill(0);
        s.textSize(16);
        s.text(tNow.toFixed(2) + " s",20,-sceneHeight+40);
        sys.drawSystem(tNow);

        s.fill(100);
        // s.rect(0,0,10,2*scale);
    };

    s.restartScene = function() {
        tNow = 0;
    }

}, 'scene-holder');

var graph = new p5( function( s ) {
    var posGraph;
    var ampGraph;
    var phaseGraph;
    var phasePlane;

    //1: position, 2: amplitude, 3: phase shift, 4: phase plane
    s.graphDisp = 1;
    var dataPoints = 1000;
    var maxChanged = true;

    function graphObj(xRes,yRes,graphType){
        //pixel/unit
        this.t = new Array;
        this.y = new Array;
        this.xRes = xRes;
        this.graphType = graphType;

        this.loadData = function () {
            switch (this.graphType) {
                case 1:
                    this.t.push(tNow);
                    this.y.push((sys.caseObj.boxPosition(tNow,sys.param)));
                    if (this.t.length === 1) {
                        this.max = Math.abs(this.y[this.y.length - 1]);
                        maxChanged = true;
                    } else {
                        if (Math.abs(this.y[this.y.length - 1]) > this.max) {
                            this.max = Math.abs(this.y[this.y.length - 1]);
                            maxChanged = true;
                        }
                    }
                    if (tNow > graphWidth / this.xRes) {
                        maxChanged = true;
                        this.xRes = this.xRes*0.75;
                    }
                    break;
                case 2:
                    for (i = 0.01; i < graphWidth / this.xRes; i += (graphWidth / this.xRes) / dataPoints) {
                        this.t.push(i);
                        if (sys.caseObj.caseNum === 6) {
                            this.y.push(sys.caseObj.magnitude(i, sys.param.z));
                        } else {
                            this.y.push(Math.log(sys.caseObj.magnitude(i, sys.param.z)) / Math.log(10));
                        }

                        if (this.t.length === 1) {
                            this.max = (this.y[this.y.length - 1]);
                        } else {
                            if (this.y[this.y.length - 1] > this.max) {
                                this.max = this.y[this.y.length - 1];
                            }
                        }
                    }
                    break;
                case 3:
                    for (i = 0; i < graphWidth / this.xRes; i += (graphWidth / this.xRes) / dataPoints) {
                        this.t.push(i);
                        this.y.push(sys.caseObj.phaseShift(i,sys.param.z));

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
                        this.t.push((sys.caseObj.boxPosition(0,sys.param)));
                        this.y.push((sys.caseObj.boxVelocity(0,sys.param)));
                        this.xMax = Math.abs(this.t[this.t.length - 1]);
                        this.max = Math.abs(this.y[this.y.length - 1]);
                        maxChanged = true;
                    }
                    this.t.push((sys.caseObj.boxPosition(tNow,sys.param)));
                    this.y.push((sys.caseObj.boxVelocity(tNow,sys.param)));
                    // console.log(this.y[this.y.length - 1]);
                    if (Math.abs(this.y[this.y.length - 1]) > this.max) {
                        this.max = Math.abs(this.y[this.y.length - 1]);
                        maxChanged = true;
                    }
                    if (Math.abs(this.t[this.t.length - 1]) > this.xMax) {
                        this.xMax = Math.abs(this.t[this.t.length - 1]);
                        maxChanged = true;
                    }
                    this.xRes = graphWidth/(2*this.xMax*1.5);

                    break;
            }
            this.yRes = canvasHeight/(2*this.max*1.8);
        };

        this.drawGraph = function () {
            s.stroke(0);
            s.strokeWeight(1.2);
            for(i = 0;i<this.t.length-1;i++){
                s.line(this.t[i]*this.xRes,-this.y[i]*this.yRes,this.t[i+1]*this.xRes,-this.y[i+1]*this.yRes);
            }
            if(this.graphType === 2){
                s.stroke('red');
                s.fill('red');
                if(sys.caseObj.caseNum === 6){
                    s.ellipse((sys.param.w/sys.param.wn)*this.xRes, -(sys.caseObj.magnitude(sys.param.w/sys.param.wn,sys.param.z))*this.yRes,10,10);
                } else {
                    s.ellipse((sys.param.w/sys.param.wn)*this.xRes, -Math.log(sys.caseObj.magnitude(sys.param.w/sys.param.wn,sys.param.z))/Math.log(10)*this.yRes,10,10);
                }
                s.stroke(0);
                s.fill(0);
            } else if(this.graphType === 3){
                s.stroke('red');
                s.fill('red');
                s.ellipse((sys.param.w/sys.param.wn)*this.xRes, -(sys.caseObj.phaseShift(sys.param.w/sys.param.wn,sys.param.z))*this.yRes,10,10);
                s.stroke(0);
                s.fill(0);
            }
        };

        this.drawNext = function(){
            s.stroke(0);
            s.strokeWeight(1.2);
            var end = this.t.length-1;
            s.line(this.t[end-1]*this.xRes,-this.y[end-1]*this.yRes,this.t[end]*this.xRes,-this.y[end]*this.yRes);
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
            // if(this.graphType === 4) console.log(this.xRes + " " + this.yRes + " " + this.max);

            if(this.graphType === 1){
                tickSpaceX = Math.floor((graphWidth/this.xRes)/5);
                for(i=tickSpaceX;i<=graphWidth;i+=tickSpaceX){
                    s.line(i*this.xRes,canvasHeight/2,i*this.xRes,-canvasHeight/2);
                    s.text((i),i*this.xRes+3,canvasHeight/2-3);
                }
            } else if(this.graphType === 4){
                inc = Math.round(Math.log(this.xMax)/Math.log(10));
                inc = inc - 1;
                tickSpaceX = Math.round(Math.pow(10,-inc)*canvasHeight/(2*5*this.xRes))*Math.pow(10,inc);
                for(j=tickSpaceX;j<=graphWidth/(2*this.xRes);j+=tickSpaceX){
                    s.line(j*this.xRes,canvasHeight/2,j*this.xRes,-canvasHeight/2);
                    s.line(-j*this.xRes,canvasHeight/2,-j*this.xRes,-canvasHeight/2);
                    tickNum = j.toFixed(Math.abs(inc));
                    s.text(tickNum,(j*this.xRes+5),-3);
                    s.text(-tickNum,-(j*this.xRes-5),-3);
                }
            } else {
                for(i=0;i<=graphWidth;i+=this.xRes){
                    s.line(i,canvasHeight/2,i,-canvasHeight/2);
                    if(i !== 0) s.text((i/this.xRes).toFixed(0),i+3,canvasHeight/2-3);
                }
            }


            inc = Math.round(Math.log(this.max)/Math.log(10));
            inc = inc - 1;
            var tickSpaceY = Math.round(Math.pow(10,-inc)*canvasHeight/(2*5*this.yRes))*Math.pow(10,inc);
            for(j=tickSpaceY;j<=canvasHeight/(2*this.yRes);j+=tickSpaceY){
                if(this.graphType === 4){
                    s.line(-graphWidth/2,j*this.yRes,graphWidth/2,j*this.yRes);
                    s.line(-graphWidth/2,-j*this.yRes,graphWidth/2,-j*this.yRes);
                } else {
                    s.line(0,j*this.yRes,graphWidth,j*this.yRes);
                    s.line(0,-j*this.yRes,graphWidth,-j*this.yRes);
                }
                tickNum = j.toFixed(Math.abs(inc));
                if(this.graphType === 2 && (sys.caseObj.caseNum === 4 || sys.caseObj.caseNum === 5)){
                    s.text("10^" + tickNum,0,-(j*this.yRes+3));
                    s.text("10^" + (-tickNum),0,(j*this.yRes-3));
                } else {
                    s.text(tickNum,0,-(j*this.yRes+3));
                    s.text(-tickNum,0,(j*this.yRes-3));
                }
            }
        }
    }

    s.setup = function() {
        graphWidth = ($("#col1").width()+10)*3-10;//700;
        s.createCanvas(graphWidth, canvasHeight);
        posGraph = new graphObj(graphWidth/5,graphWidth/5,1);
        ampGraph = new graphObj(graphWidth/4,canvasHeight/2,2);
        phaseGraph = new graphObj(graphWidth/4,canvasHeight/2,3);
        phasePlane = new graphObj(graphWidth/4,canvasHeight/2,4);
    };

    s.draw = function() {
        if(s.graphDisp === 4){
            s.translate(graphWidth/2,canvasHeight/2);
        } else {
            s.translate(0,canvasHeight/2);
        }
        if(running && s.frameRate()!==0){
            posGraph.loadData();
            phasePlane.loadData();
        }

        switch (s.graphDisp){
            case 1:
                if(maxChanged){
                    s.background(240);
                    console.log("draw all pos: " + posGraph.t.length);
                    posGraph.drawGrid();
                    posGraph.drawGraph();
                    maxChanged = false;
                } else {
                    posGraph.drawNext();
                }

                break;
            case 2:
                s.background(240);
                ampGraph.drawGrid();
                ampGraph.drawGraph();
                break;
            case 3:
                s.background(240);
                phaseGraph.drawGrid();
                phaseGraph.drawGraph();
                break;
            case 4:
                if(maxChanged){
                    s.background(240);
                    console.log("draw all phase: " + phasePlane.t.length);
                    phasePlane.drawGrid();
                    phasePlane.drawGraph();
                    maxChanged = false;
                } else {
                    phasePlane.drawNext();
                }
                break;
        }


    };

    s.redrawGraph = function(){
        posGraph = new graphObj(graphWidth/5,graphWidth/5,1);
        ampGraph = new graphObj(graphWidth/4,canvasHeight/2,2);
        phaseGraph = new graphObj(graphWidth/4,canvasHeight/2,3);
        phasePlane = new graphObj(graphWidth/5,canvasHeight/5,4);
        maxChanged = true;
        if(sys.caseObj.caseNum > 3){
            ampGraph.loadData();
            phaseGraph.loadData();
        }
        s.loop();
    };

    s.switchGraph = function(x){
        s.graphDisp = x;
        maxChanged = true;
    };

    s.setGraphRes = function (){
        posGraph.xRes = graphWidth/5;
        posGraph.yRes = graphWidth/5;
        phasePlane.xRes = graphWidth/5;
        phasePlane.yRes = graphWidth/5;
        maxChanged = true;
        ampGraph = new graphObj(graphWidth/4,canvasHeight/2,2);
        phaseGraph = new graphObj(graphWidth/4,canvasHeight/2,3);
        if(sys.caseObj.caseNum > 3){
            ampGraph.loadData();
            phaseGraph.loadData();
        }
    };


}, 'graph-holder');


function updateUI(){
    kDisp.innerHTML = "Spring Stiffness: " + sys.param.k.toFixed(2) + " N/m";
    kSlider.value = sys.param.k.toFixed(2);

    mDisp.innerHTML = "Mass: " + sys.param.m.toFixed(2) + " kg";
    mSlider.value = sys.param.m.toFixed(2);

    wnDisp.innerHTML = "Natural Freq: " + sys.param.wn.toFixed(3) + " rad/s";
    wnSlider.value = sys.param.wn.toFixed(3);

    xoDisp.innerHTML = "Initial Position: " + sys.param.xo.toFixed(2) + " m";
    xoSlider.value = sys.param.xo.toFixed(2);

    voDisp.innerHTML = "Initial Velocity: " + sys.param.vo.toFixed(3) + " m/s";
    voSlider.value = sys.param.vo.toFixed(3);

    if(sys.caseObj.caseNum > 2){
        cDisp.innerHTML = "Dashpot Coeft.: " + sys.param.c.toFixed(2) + " Ns/m";
        cSlider.value = sys.param.c.toFixed(2);

        zDisp.innerHTML = "Damping Coeft.: " + sys.param.z.toFixed(3);
        zSlider.value = sys.param.z.toFixed(2);

    } else {
        cDisp.innerHTML = "Dashpot Coeft.: N/A";
        zDisp.innerHTML = "Damping Coeft.: N/A";
    }

    if(sys.caseObj.caseNum > 3) {
        ampDisp.innerHTML = "Amplification: " + sys.param.M.toFixed(2) + " Ns/m";
        ampSlider.value = sys.param.M.toFixed(2);

        wDisp.innerHTML = "Frequency: " + sys.param.w.toFixed(2) + " rad/s";
        wSlider.value = sys.param.w.toFixed(2);

        switch (sys.caseObj.caseNum){
            case 4:
                magDisp.innerHTML = "Force Amplitude: " + sys.param.Yo.toFixed(2) + " N";
                break;
            case 5:
                magDisp.innerHTML = "Base Amplitude: " + sys.param.Yo.toFixed(2) + " m";
                break;
            case 6:
                magDisp.innerHTML = "Rotor Length: " + sys.param.Yo.toFixed(2) + " m";
                break;
        }
        magSlider.value = sys.param.Yo.toFixed(2);
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
}

function restart(){
    sys.reCalc();
    scene.restartScene();
    if(sys.caseObj.caseNum < 4 && (graph.graphDisp === 2 || graph.graphDisp === 3)){
        graph.switchGraph(1);
    }
    graph.redrawGraph();
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

    if (sys.caseObj.caseNum > 3){
        if(! col1.has('#ext_header').length){
            $(".ext_controls").show();
        }
    } else {
        $(".ext_controls").hide();
    }
}


window.onload = function() {
    col1 = $("#col1");

    //HTML defined nodes
    kDisp = document.getElementById("k_disp");
    kSlider = document.getElementById("k_slider");
    kSlider.oninput = function () {
        normalInput = true;
        running = false;
        sys.param.k = parseFloat(kSlider.value);
        restart();
    };

    mSlider = document.getElementById("m_slider");
    mDisp = document.getElementById("m_disp");
    mSlider.oninput = function () {
        normalInput = true;
        running = false;
        sys.param.m = parseFloat(mSlider.value);
        restart();
    };

    cSlider = document.getElementById("c_slider");
    cDisp = document.getElementById("c_disp");
    cSlider.oninput = function () {
        normalInput = true;
        running = false;
        sys.param.c = parseFloat(cSlider.value);
        restart();
    };

    xoSlider = document.getElementById("xo_slider");
    xoDisp = document.getElementById("xo_disp");
    xoSlider.oninput = function () {
        running = false;
        sys.param.xo = parseFloat(xoSlider.value);
        restart();
    };

    voSlider = document.getElementById("vo_slider");
    voDisp = document.getElementById("vo_disp");
    voSlider.oninput = function () {
        running = false;
        sys.param.vo = parseFloat(voSlider.value);
        restart();
    };

    wnSlider = document.getElementById("wn_slider");
    wnDisp = document.getElementById("wn_disp");
    wnSlider.oninput = function () {
        normalInput = false;
        running = false;
        sys.param.wn = parseFloat(wnSlider.value);
        restart();
    };

    zSlider = document.getElementById("z_slider");
    zDisp = document.getElementById("z_disp");
    zSlider.oninput = function () {
        normalInput = false;
        running = false;
        sys.param.z = parseFloat(zSlider.value);
        restart();
    };

    ampSlider = document.getElementById("amp_slider");
    ampDisp = document.getElementById("amp_disp");
    ampSlider.oninput = function () {
        normalInput = false;
        running = false;
        sys.param.M = parseFloat(ampSlider.value);
        sys.param.z = 1.0/(2*sys.param.M);
        sys.param.wn = sys.param.w;
        restart();
    };

    wSlider = document.getElementById("w_slider");
    wDisp = document.getElementById("w_disp");
    wSlider.oninput = function () {
        running = false;
        sys.param.w = parseFloat(wSlider.value);
        restart();
    };

    magSlider = document.getElementById("mag_slider");
    magDisp = document.getElementById("mag_disp");
    magSlider.oninput = function () {
        running = false;
        sys.param.Yo = parseFloat(magSlider.value);
        restart();
    };


    // document.getElementById("x_zoom").onclick = function(){
    //     graph.xRes = graphWidth/this.value;
    //     graph.redrawGraph();
    // };

    document.getElementById("stop_btn").onclick = function(){
        running = false;
    };

    document.getElementById("start_btn").onclick = function(){
        running = true;
    };

    document.getElementById("pos_graph").onclick = function(){
        graph.switchGraph(1);
    };

    document.getElementById("amp_graph").onclick = function(){
        if(sys.caseObj.caseNum > 3){
            graph.switchGraph(2);
        } else {
            window.alert("No Amplitude Graph for Case " + sys.caseObj.caseNum);
        }
    };

    document.getElementById("phase_graph").onclick = function(){
        if(sys.caseObj.caseNum > 3){
            graph.switchGraph(3);
        } else {
            window.alert("No Phase Shift Graph for Case " + sys.caseObj.caseNum);
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
        sys = new scene.System(case1.defaultParam, case1);
        changeUI();
        restart();
        document.getElementById("header").innerHTML = "Case I: Free Vibration on Spring";
    };
    document.getElementById("case3_button").onclick = function(){
        sys = new scene.System(case3.defaultParam,case3);
        changeUI();
        restart();
        document.getElementById("header").innerHTML = "Case III: Free Vibration on Spring and Dashpot";
    };
    document.getElementById("case4_button").onclick = function(){
        sys = new scene.System(case4.defaultParam,case4);
        changeUI();
        restart();
        document.getElementById("header").innerHTML = "Case IV: Externally Forced System";
    };
    document.getElementById("case5_button").onclick = function(){
        sys = new scene.System(case5.defaultParam,case5);
        changeUI();
        restart();
        document.getElementById("header").innerHTML = "Case V: Base Excited System";
    };
    document.getElementById("case6_button").onclick = function(){
        sys = new scene.System(case6.defaultParam,case6);
        changeUI();
        restart();
        document.getElementById("header").innerHTML = "Case VI: Rotor Excited System";
    };
    changeUI();
    updateUI();
};



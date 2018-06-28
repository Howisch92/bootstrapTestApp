function Odometer(Element) {
	
	var options = arguments[1] || {};
	var container = document.getElementById(Element || 'odometer');

	if (!container) throw ('No container found!');
	
	// Container CSS inspection to get computed size
	var containerStyle = TBE.GetElementComputedStyle(container);
	var width = 1;
	var h = 0;
	if (containerStyle) {
		width = parseInt(containerStyle.width);
		h = parseInt(containerStyle.height);
	}
	var height = h > 0 ? Math.min(Math.floor((width)/4), h) : Math.floor((width)/4);
//	width = height * 4;
	var curValue = 0;
	
	if (!width && !height) throw ('Cannot get container dimensions!');
	
	var noDigits = options.digits || 6;
	var colDigits = options.digitColor || 'black';
	var noDecimals = options.decimals || 0;
	var colDecimals = options.decimalColor || '#9C0B0B';
	var CurUnit  = options.unit  || "";
	var colUnit = options.unitColor || this.digitColor;
	
	var redraw = false;
	
	this.digits = function() {
		return noDigits;
	};
	this.setDigits = function(digits) {
		noDigits = digits;
	};
	this.digitColor = function() {
		return colDigit;
	};
	this.setDigitColor = function(color) {
		redraw = true;
		colDigits = color;
	};
	this.decimals = function() {
		return noDecimals;
	};
	this.setDecimals = function(decimals) {
		noDecimals = decimals;
	};
	this.decimalColor = function() {
		return colDecimals;
	};
	this.setDecimalColor = function(color) {
		redraw = true;
		colDecimals = color;
	};
	this.unit = function() {
		return CurUnit;
	};
	this.setUnit = function(unit) {
		redraw = true;
		CurUnit = unit;
	};
	this.unitColor = function() {
		return colUnit;
	};
	this.setUnitColor = function(color) {
		redraw = true;
		colUnit = color;
	};
	this.redraw = function(newW, newH) {
		redraw = true;
		if (newW) {
			width = newW;
			height = newH && newH > 0 ? Math.min(Math.floor((width)/4), newH) : Math.floor((width)/4);
		} else {
			var containerStyle = TBE.GetElementComputedStyle(container);
			var h = 0;
			if (containerStyle) {
				width = parseInt(containerStyle.width);
				h = parseInt(containerStyle.height);
			}
			height = h > 0 ? Math.min(Math.floor((width)/4), h) : Math.floor((width)/4);
		}
		this.drawNumber(curValue);
	};
	
	var canvas = TBE.CreateCanvasElement();
    
    canvas.innerHTML = notsupported;
   
    container.appendChild(canvas);
    
    var yScale = 0.8;
    var unitWidth = 0;
	var dispWidth = 0;
	var display;
	
    this.init = function() {
    	canvas.setAttribute ('width', width);
        canvas.setAttribute ('height', height);
		if (CurUnit != "") {
			unitWidth = Math.floor(height) - 10;
		} else {
			unitWidth = 0;
		}
		dispWidth = width - (unitWidth * yScale) - 10;
		display = new DigitalDisplay({
			element: canvas, 
			digits: colDigits, 
			placeholders: '#999999',
			decimals: colDecimals,
			center: true,
			width: dispWidth,
			yScale: yScale
		});
		redraw = false;
    };

    this.init();
    
    this.drawNumber = function(value) {
    	if (display == null) {
    		this.init();
    	}
    	if (redraw) {
    		this.init();
    	}
    	curValue = value;
    	display.clear();
    	var y = (height - (height * (dispWidth / width))) * 1.5;
    	var h = (height * (dispWidth / width)) - 10;
    	var off = display.drawNumber(value, noDigits, noDecimals, y, h);
    	
    	// Draw unit
    	if (CurUnit != "") {
	    	var context = TBE.GetElement2DContext(canvas);
	    	context.fillStyle = colUnit; //options.color ? options.color : 'black';
	    	context.textAlign = 'start';
//	    	context.font = Math.round(height * (dispWidth/width)) + 'px ' + 'Sans-Serif';
	    	context.font = this.calcFontSize(CurUnit, unitWidth * 0.9) + 'px ' + 'Sans-Serif';
	    	context.fillText(CurUnit, off, (y + (h * yScale)));
    	}
    }
    
    this.calcFontSize = function(text, width) {
    	var ctx = TBE.GetElement2DContext(canvas);
    	var size = 10;
    	ctx.font = size + 'px ' + 'Sans-Serif';
    	
    	while (ctx.measureText(text).width < width && ctx.measureText('M').width / yScale < (height * yScale) - 10) {
    		size++;
    		ctx.font = size + 'px ' + 'Sans-Serif';
    	}
    	return size - 1;
    }
    
    var animateCallback = null;
    this.animatedUpdate = function (value, time)
    {
      var FPS = 25, incr, odometer = this;

      if (animateCallback) {
    	  //throw ('Animated update already running!');
    	  return;
      }
      if (value == curValue || time <= 0.0) {
          //throw ('Invalid parameters (value: ' + value + ', time: ' + time + ')');
    	  odometer.drawNumber(value);
    	  return;
      }

      incr = (value - curValue) / FPS / (time/1000);

      animateCallback = function () {
    	  var done = Math.abs(odometer.value () - value) < Math.abs(incr);
    	  if (!animateCallback || done || !value) {
    		  if (animateCallback) {
    			  odometer.stopAnimation();
    		  }
	          if (done) {
	        	  odometer.drawNumber(value);
	          }
    	  }
    	  else {
    		  odometer.drawNumber(odometer.value() + incr);
    		  setTimeout (animateCallback, 1000 / FPS);
    	  }
      };
      animateCallback.call();
    }

    this.stopAnimation = function ()
    {
      animateCallback = null;
    }
    
    this.value = function ()
    {
      return curValue;
    }
}
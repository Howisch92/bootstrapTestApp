// Original code shared in the public domain on the 'net by <anonymous>
// Further work by vjt@openssl.it - http://sindro.me/
//
// Project home page: http://github.com/vjt/canvas-speedometer
//
import { TBE, notsupported } from '../tbe';
import { DigitalDisplay } from '../digitaldisplay';
import { Controls } from './controls'; 
require('../xcanvas');

function Speedometer(Element) {
  var options = arguments[1] || {};

  var Container = document.getElementById(Element || 'speedometer');

  if (!Container) throw ('No container found!'); // XXX

  // Container CSS inspection to get computed size
  var ContainerStyle = TBE.GetElementComputedStyle (Container);
  var Size = 1;
  if (ContainerStyle) {
	  Size = Math.min (
			  parseInt (ContainerStyle.width),
			  parseInt (ContainerStyle.height)
	  );
  }

  if (!Size) throw ('Cannot get container dimensions!');

  // Customization
  var MinValue = options.min   || 0.0;
  var MaxValue = options.max   || 50.0;
  var CurValue = options.value || MinValue;
  var CurUnit  = options.unit  || "";
  var noDigits = options.digits || 5;
  var colDigits = options.digitColor || 'black';
  var noDecimals = options.decimals || 0;
  var colDecimals = options.decimalColor || '#9C0B0B';
  var useColorGrade = options.colorGrade || false;
  var redThreshold = options.redThreshold || 0;
  var yellowThreshold = options.yellowThreshold || 0.5;
  var greenThreshold = options.greenThreshold || 1;

  var redraw;
	

  // Threshold
  var Threshold   = options.threshold      || 50.0;
  var ThreshPivot = options.thresholdPivot || 35.0;

  // Meter, and correct user coords (cartesian) to the canvas std plane coords
  var MeterFromAngle = (options.meterFromAngle || -135.0) - 90.0;
  var MeterToAngle   = (options.meterToAngle   ||  135.0) - 90.0;
  var MeterRimAngle  = MeterToAngle - MeterFromAngle;

  var MeterTicksCount = options.meterTicksCount || 10;
  var MeterMarksCount = options.meterMarksCount || 4;
  var MeterGapScale   = (options.meterGapScale || 10) / 100.0;
  if (MeterGapScale > 1) MeterGapScale = 1;

  // Glossy?
  var Glossy = options.glossy == undefined ? true : Boolean (options.glossy);

  // Enable digital display?
  var Display;
  var ShowDisplay = options.display == undefined ? true : Boolean (options.display);

  // Enable center rim?
  var CenterRimScale = options.centerRimScale == undefined ?
                       0.3 : Float (options.centerRimScale);
  var CenterScale    = options.center == undefined ?
                       0.25 : Float (options.centerScale);

  var x = Size * 0.05;
  var y = Size * 0.05;

  // Theming
  //if (!Speedometer.themes['default'])
  //  throw ('Default theme missing! Please load themes/default.js');
  
  var theme = {
	dial       : 'Gray',
	rim        : 'SlateGray',
	rimArc     : 'Gainsboro',
	thresh     : 'LawnGreen',
	center     : 'Black',
	nose       : 'SlateGray',
	hand       : 'Black',
	handShine  : 'SlateGray',
	handShineTo: 'Black',
	ticks      : 'Black',
	marks      : 'Black',
	strings    : 'Black',
	digits     : 'Black',
	font       : 'Sans-Serif'
  };


//  for (key in Speedometer.themes['default'])
//    if (theme[key] == undefined)
//      theme[key] = Speedometer.themes['default'][key];

  var Color = {
    dial  : theme.dial,
    rim   : theme.rim,
    rimArc: theme.rimArc,
    thresh: theme.thresh,
    center: theme.center,
    nose  : theme.nose,
    hand  : {
      main   : theme.hand,
      shine  : theme.handShine,
      shineTo: theme.handShineTo
    },
    meter : {
      ticks  : theme.ticks,
      marks  : theme.marks,
      strings: theme.strings,
      font   : theme.font
    },
    digits: theme.digits
  };

  // Private stuff.
  //
  var Canvas = {
    background: TBE.CreateSquareCanvasElement (Size),
    foreground: TBE.CreateSquareCanvasElement (Size),
    hand      : TBE.CreateSquareCanvasElement (Size),
    digits    : TBE.CreateSquareCanvasElement (Size)
  };
  
  Canvas.background.innerHTML = notsupported;

  var Context = {
    background: TBE.GetElement2DContext (Canvas.background),
    foreground: TBE.GetElement2DContext (Canvas.foreground),
    hand      : TBE.GetElement2DContext (Canvas.hand)
  };

//  if (ShowDisplay)
//  {
//	  this.initDisplay();
//  }
  this.initDisplay = function() {
	  Display = new DigitalDisplay ({
	      element: Canvas.digits,
	      digits: colDigits, 
	      placeholders: '#999999',
	      decimals: colDecimals,
	      width: Size
	    });
  };

  // Now append the canvases into the given container
  //
  Container.appendChild (Canvas.background);
  Container.appendChild (Canvas.digits);
  Container.appendChild (Canvas.hand);
  Container.appendChild (Canvas.foreground);

  //
  // Initialization done!
  
  // Redraw everything with new size
  this.redraw = function(newSize) {
	  if (newSize) {
		  Size = newSize;
	  } else {
		  var containerSize = TBE.GetElementComputedStyle(Container);
		  if (containerSize) {
			  Size = Math.min(parseInt(containerSize.width), parseInt(containerSize.height));
		  }
	  }
	  x = Size * 0.05;
	  y = Size * 0.05;
	  Canvas.background.setAttribute ('width', Size);
	  Canvas.background.setAttribute ('height', Size);
	  Canvas.digits.setAttribute ('width', Size);
	  Canvas.digits.setAttribute ('height', Size);
	  Canvas.hand.setAttribute ('width', Size);
	  Canvas.hand.setAttribute ('height', Size);
	  Canvas.foreground.setAttribute ('width', Size);
	  Canvas.foreground.setAttribute ('height', Size);
	  this.draw();
  };

  // Draw everything (still to be refactored)
  //
  this.draw = function ()
  {
    if (Context.background && Context.foreground && Context.hand)
    {
      var w = Size - x * 2;
      var h = Size - y * 2;
      
      this.clear(Canvas.background);
      this.drawBackground (x, y, w, h);
      this.clear(Canvas.hand);
      this.drawHand ((w / 2) + x, (h / 2) + y);
      this.clear(Canvas.foreground);
      this.drawCenter ((w / 2) + x, (h / 2) + y);
      this.drawGloss ();

      if (ShowDisplay) {
    	  this.initDisplay();
    	  Display.drawNumber (CurValue, noDigits, noDecimals, h / 1.2, Size / 9);
      }
    }
  }
  
  this.clear = function (element) {
	 TBE.ClearCanvas (element);
  }

  ////////////////////
  // Update functions

  // Clip the given value to max/min
  //
  function clipValue (value)
  {
    if (value >= MaxValue)
      return MaxValue;
    else if (value <= MinValue)
      return MinValue;
    else
      return value;
  }

  // Instantaneously update the speedometer to the given value
  //
  this.update = function (value)
  {
//    CurValue = clipValue (value);
	  CurValue = value;

    if (Context.hand)
    {
      var w = Size - x * 2;
      var h = Size - y * 2;

      TBE.ClearCanvas (Canvas.hand);
      this.drawHand ((w / 2) + x, (h / 2) + y);
    }

    if (ShowDisplay)
    {
    	if(Display != null) {
  	      Display.clear ();
  	      Display.drawNumber (CurValue, noDigits, noDecimals, h / 1.2, Size / 9);
      	}
    }

    return CurValue;
  }

  function dispatchAnimationEndedEvent ()
  {
	  if (typeof document.createEvent != "undefined") {
		    var evt = document.createEvent ('UIEvent');
		
		    evt.initUIEvent ('speedometer:animateend',
		                     /* bubbles = */ false,
		                     /* cancelable = */ false,
		                     /* defaultView = */ window,
		                     /* detail = */ CurValue);
		
		    Container.dispatchEvent (evt);
	  }
  }

  var listeners = {};
  this.addEventListener = function (evt, func)
  {
    if (listeners[func] == undefined)
    {
      Container.addEventListener (evt, func, false);
      listeners[func] = evt;
      return true;
    }
    return false;
  }

  this.removeEventListener = function (evt, func)
  {
    if (listeners[func])
    {
      Container.removeEventListener (evt, func, false);
      delete listeners[func];
      return true;
    }
    return false;
  }

  this.removeAllListeners = function ()
  {
    for (func in listeners)
      this.removeEventListener (listeners[func], func);
  }

  var animateCallback = null;
  this.animatedUpdate = function (value, time, callback)
  {
    var FPS = 25, incr, speedometer = this;

    if (animateCallback) {
    	//throw ('Animated update already running!');
    	return;
    }
    //value = clipValue (value);
    if (value == CurValue || time <= 0.0) {
    	//throw ('Invalid parameters (value: ' + value + ', time: ' + time + ')');
    	speedometer.update(value);
    	return;
    }

    if (callback)
      this.addEventListener ('speedometer:animateend', callback, false);

    incr = (value - CurValue) / FPS / (time/1000);

    animateCallback = function ()
    {
      var done = Math.abs (speedometer.value () - value) < Math.abs (incr);

      if (!animateCallback || done) // || !value
      {
        if (animateCallback)
          speedometer.stopAnimation ();

        if (done)
        {
          speedometer.update (value);
          dispatchAnimationEndedEvent ();
        }
      }
      else
      {
        speedometer.update (speedometer.value () + incr);
        setTimeout (animateCallback, 1000 / FPS);
      }
    };

    animateCallback.call ();
  }

  this.stopAnimation = function ()
  {
    animateCallback = null;
  }

  // Getters
  //
  this.value = function ()
  {
    return CurValue;
  }

  this.min = function ()
  {
    return MinValue;
  }
  this.setMin = function(min) {
	  MinValue = min;
  }

  this.max = function ()
  {
    return MaxValue;
  }
  
  this.setMax = function(max) {
	  MaxValue = max;
  }
  this.unit = function() {
	  return CurUnit;
  };
  this.setUnit = function(unit) {
	  CurUnit = unit;
  };
  	this.digits = function() {
		return noDigits;
  	};
	this.setDigits = function(digits) {
		noDigits = digits;
	};
	this.decimals = function() {
		return noDecimals;
	};
	this.setDecimals = function(decimals) {
		noDecimals = decimals;
	};
	this.digitColor = function() {
		return colDigit;
	};
	this.setDigitColor = function(color) {
		redraw = true;
		colDigits = color;
	};
	this.decimalColor = function() {
		return colDecimals;
	};
	this.setDecimalColor = function(color) {
		redraw = true;
		colDecimals = color;
	};
	this.useColorGrade = function(colorGrade) {
		redraw = true;
		useColorGrade = colorGrade;
	}
	this.setRedThreshold = function(threshold) {
		redraw = true;
		redThreshold = threshold;
	}
	this.setYellowThreshold = function(threshold) {
		redraw = true;
		yellowThreshold = threshold;
	}
	this.setGreenThreshold = function(threshold) {
		redraw = true;
		greenThreshold = threshold;
	}
	this.setMeterTicksCount = function(ticks) {
		redraw = true;
		MeterTicksCount = ticks;
	}
	this.setMeterMarksCount = function(marks) {
		redraw = true;
		MeterMarksCount = marks;
	}

  this.drawMeter = function (cx, cy)
  {
    var context = Context.background;

    var gap = (Size * (MeterGapScale + 0.5) * 0.03);

    var radius = (Size - gap) / 2 - gap * 5;
    var totalAngle = MeterToAngle - MeterFromAngle;

    var currentAngle, angleIncr;
    var incValue = (MaxValue - MinValue) / MeterTicksCount;

    function drawMark (angle, options)
    {
      var x0 = (cx + radius * Math.cos (angle));
      var y0 = (cy + radius * Math.sin (angle));
      var x1 = (cx + (radius - options.size) * Math.cos (angle));
      var y1 = (cy + (radius - options.size) * Math.sin (angle));

      context.strokeStyle = options.color;
      context.lineWidth = options.width;
      context.moveTo (x0, y0);
      context.lineTo (x1, y1);
    }

    function drawString (value, options)
    {
      // Draw Strings
    	var deltaOff = 5;
    	if (value > 1000 && (options.index < 4 || options.index > 6)) {
    		deltaOff += 5;
    	}
    	if (value > 10000 && (options.index < 4 || options.index > 6)) {
    		deltaOff += 5;
    	}
      var tx = cx + ((radius - options.offset) - deltaOff) * Math.cos (options.angle);
      var ty = cy + gap / 2 + (radius - options.offset) * Math.sin (options.angle);

      context.fillStyle = options.color;
      context.textAlign = 'center';

      context.font = Math.round (options.size) + 'pt ' + Color.meter.font;
      context.textAlignment = 'center';
      var pow = Math.pow(10,noDecimals);
      value = Math.round(value * pow) / pow;
      context.fillText (value, tx, ty);
    }

    angleIncr = TBE.Deg2Rad (totalAngle / MeterTicksCount);
    currentAngle = TBE.Deg2Rad (MeterFromAngle);
    context.beginPath ();
    for (var i = 0; i <= MeterTicksCount; i++)
    {
      // Draw thick mark and increment angle
      drawMark (currentAngle, {
        size: Size / 20,
        width: Size / 50,
        color: Color.meter.ticks
      });

      // Draw string and increment ruler value
      drawString (MinValue + Math.round (incValue * i*10)/10, {
    	index: i,
        angle: currentAngle,
        color: Color.meter.strings,
        offset: (Size / 10),
        size: Size / 23
      });

      currentAngle += angleIncr;
    }
    context.stroke ();

    angleIncr = TBE.Deg2Rad (totalAngle / MeterTicksCount / (MeterMarksCount + 1));
    
    // leading ticks before 0
//    currentAngle = TBE.Deg2Rad (MeterFromAngle);
//    currentAngle -= angleIncr;
//    for (i = 0; i < 3; i++) {
//    	drawMark (currentAngle, {size: Size / 50, width: Size / 100, color: Color.meter.marks});
//    	currentAngle -= angleIncr;
//    }
//    context.stroke ();
    
    currentAngle = TBE.Deg2Rad (MeterFromAngle);
    context.beginPath ();
    
    for (i = 0; i < ((MeterMarksCount + 1) * MeterTicksCount); i++)
    {
      // Draw thin mark if not overlapping a thick mark
      if (i % (MeterMarksCount + 1) != 0)
        drawMark (currentAngle, {size: Size / 50, width: Size / 100, color: Color.meter.marks});

      currentAngle += angleIncr;
    }
    context.stroke ();
    
    // trailing ticks after max
//    currentAngle += angleIncr;
//    for (i = 0; i < 3; i++) {
//    	drawMark (currentAngle, {size: Size / 50, width: Size / 100, color: Color.meter.marks});
//    	currentAngle += angleIncr;
//    }
//    context.stroke ();
  }

  this.drawGloss = function ()
  {
    if (!Glossy)
      return;

    var context = Context.foreground;

    // Draw dial glossiness
    //
    var rX = Size * 0.15;
    var rY = y + Size * 0.07;
    var rW = Size * 0.70;
    var rH = Size * 0.65;

    var g1 = context.createLinearGradient (0, 0, 0, rY+rH);
    g1.addColorStop (0, 'rgba(255,255,255,1.0)');
    g1.addColorStop (1, 'rgba(255,255,255, 0.0)');

    context.fillStyle = g1;
    context.fillEllipse (rX, rY, rW, rH);

    if (!ShowDisplay)
      return;

    // Draw display glossiness
    //
    rX = Size * 0.30;
    rY = y + Size * 0.70;
    rW = Size * 0.40;
    rH = Size * 0.15;

    var g2 = context.createLinearGradient (0, rY, 0, rY + rH);
    g2.addColorStop (0, 'rgba(255,255,255,0.0)');
    g2.addColorStop (0.25, 'rgba(255,255,255,0.0)');
    g2.addColorStop (1, 'rgba(255,255,255,1.0)');

    context.fillStyle = g2;
    context.fillEllipse (rX, rY, rW, rH);
  }

  this.drawCenter = function (cx, cy)
  {
    var context = Context.foreground;

    var shift;

    if (CenterRimScale > 0 && CenterRimScale > CenterScale)
    {
      shift = CenterRimScale * (Size / 2);

      var rX = cx - (shift / 2);
      var rY = cy - (shift / 2);
      var rW = shift;
      var rH = shift;

      var g1 = context.createLinearGradient (0, rY, 0, rY + rH);
      g1.addColorStop (0, Color.center);
      g1.addColorStop (0.5, Color.center);
      g1.addColorStop (1, Color.dial);

      context.fillStyle = g1;
      context.fillEllipse (rX, rY, rW, rH);
    }

    if (CenterScale > 0)
    {
      shift = CenterScale * (Size / 2);

      rX = cx - (shift / 2);
      rY = cy - (shift / 2);
      rW = shift;
      rH = shift;

      var g2 = context.createLinearGradient (rX, rY, rW + rX, rY + rH);
      g2.addColorStop (0, Color.nose);
      g2.addColorStop (1, Color.center);

      context.fillStyle = g2;
      context.fillEllipse (rX, rY, rW, rH);
    }
  }

  this.drawHand = function (cx, cy)
  {
    var context = Context.hand;

    var radius = Size / 2 - (Size * 0.12);

    var val = MaxValue - MinValue;
    val = (MaxValue * (CurValue - MinValue)) / val;
    val = ((MeterToAngle - MeterFromAngle) * val) / MaxValue;
    val += MeterFromAngle;

    var angle = TBE.Deg2Rad (val);
    var gradientAngle = angle;

    // Fill Polygon
    var pts = new Array(5 * 2);

    pts[0*2+0] = cx + radius * Math.cos (angle);
    pts[0*2+1] = cy + radius * Math.sin (angle);

    pts[4*2+0] = cx + radius * Math.cos (angle - 0.02);
    pts[4*2+1] = cy + radius * Math.sin (angle - 0.02);

    angle = TBE.Deg2Rad (val + 20);
    pts[1*2+0] = cx + (Size * 0.09) * Math.cos (angle);
    pts[1*2+1] = cy + (Size * 0.09) * Math.sin (angle);

    pts[2*2+0] = cx;
    pts[2*2+1] = cy;

    angle = TBE.Deg2Rad (val - 20);
    pts[3*2+0] = cx + (Size * 0.09) * Math.cos (angle);
    pts[3*2+1] = cy + (Size * 0.09) * Math.sin (angle);

    context.fillStyle = Color.hand.main;
    context.fillPolygon (pts);

    // Draw Shine
    pts = new Array (3 * 2);

    angle = TBE.Deg2Rad (val);
    pts[0*2+0] = cx + radius * Math.cos (angle);
    pts[0*2+1] = cy + radius * Math.sin (angle);

    angle = TBE.Deg2Rad (val + 20);
    pts[1*2+0] = cx + (Size * 0.09) * Math.cos (angle);
    pts[1*2+1] = cy + (Size * 0.09) * Math.sin (angle);

    pts[2*2+0] = cx;
    pts[2*2+1] = cy;

    var g1 = context.createLinearGradient (0, 0, cx, cy);
    g1.addColorStop (0, Color.hand.shine);
    g1.addColorStop (1, Color.hand.shineTo);

    context.fillStyle = g1;
    context.fillPolygon (pts);
  }

  this.drawBackground = function (x, y, w, h)
  {
    var context = Context.background;
    
    // Draw background color
    context.fillStyle = Color.dial;
    context.ellipse (x, y, w, h);
    context.globalAlpha = 0.45;
    context.fill ();

    // Draw Rim
    context.strokeStyle = Color.rim;
    context.lineWidth = w * 0.03;
    context.ellipse (x, y, w, h);
    context.globalAlpha = 1.0;
    context.stroke ();

    this.drawMeter ((w / 2) + x, (h / 2) + y);

    // Draw Colored Rim
    if (useColorGrade) {
    	var g1 = context.createLinearGradient (0, 0, Size,0);
    	g1.addColorStop (redThreshold, '#FF0000');
    	g1.addColorStop (yellowThreshold, '#FFFF00');
    	g1.addColorStop (greenThreshold, '#00FF00');
    	context.strokeStyle = g1;
    	//context.strokeStyle = Color.rimArc;
    	context.lineWidth = Size / 40;
    	var gap = Size * 0.03;
    	
    	context.strokeBoxedArc (x + gap, y + gap, w - gap * 2, h - gap * 2,
    			TBE.Deg2Rad (MeterFromAngle), TBE.Deg2Rad (MeterRimAngle),
    			/* counterclockwise = */ false);
    }

    // Draw unit
	context.fillStyle = options.color;
	context.textAlign = 'center';
	context.font = Math.round (options.size) + 'pt ' + Color.meter.font;
	context.textAlignment = 'center';
	context.fillText (CurUnit, w/1.8,h/1.25);
     
    // Draw Threshold
//    context.strokeStyle = Color.thresh;
//    context.lineWidth = Size / 50;
//
//    var val = MaxValue - MinValue
//    val = (MaxValue * (ThreshPivot - MinValue)) / val;
//    val = ((MeterToAngle - MeterFromAngle) * val) / MaxValue;
//    val += MeterFromAngle;
//
//    var stAngle = val - ((MeterRimAngle * Threshold) / MaxValue / 2);
//    if (stAngle <= MeterFromAngle)
//      stAngle = MeterFromAngle;
//
//    var sweepAngle = ((MeterRimAngle * Threshold) / MaxValue);
//    if (stAngle + sweepAngle > MeterToAngle)
//      sweepAngle = MeterToAngle - stAngle;
//
//    context.strokeBoxedArc (x + gap, y + gap, w - gap * 2, h - gap * 2,
//                            TBE.Deg2Rad (stAngle), TBE.Deg2Rad (sweepAngle),
//                            /* counterclockwise = */ false);
  }
}; // End of class

// Theming support
Speedometer.themes = {};
export { Speedometer }

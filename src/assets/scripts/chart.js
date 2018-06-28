// import {jqplot} from 'updated-jqplot';
// //import {jqplot} from '../../../node_modules/updated-jqplot/dist/jquery.jqplot'
// //import * as jqplot from '../../../node_modules/updated-jqplot'
// // import {jquery} from 'jquery';
// import {BarRenderer} from '../../../node_modules/updated-jqplot/dist/plugins/jqplot.BezierCurveRenderer';
// import {BarRenderer1} from '../../../node_modules/updated-jqplot/dist/plugins/jqplot.barRenderer';
// //import {CategoryAxisRenderer} from '../../../node_modules/updated-jqplot/dist/plugins/jqplot.categoryAxisRenderer';


import * as jqplot from './jquery.jqplot.min';
import * as barRenderer from './plugins/jqplot.barRenderer.min';
import * as categoryAxisRenderer from './plugins/jqplot.categoryAxisRenderer.min';
import * as pointLabels from './plugins/jqplot.pointLabels.min';
import * as canvasTextRenderer from './plugins/jqplot.canvasTextRenderer.min';
import * as canvasAxisLabelRenderer from './plugins/jqplot.canvasAxisLabelRenderer.min';
import * as canvasAxisTickRenderer from './plugins/jqplot.canvasAxisTickRenderer.min';
import * as highlighter from './plugins/jqplot.highlighter.min';
import * as cursor from './plugins/jqplot.cursor.min';



function Chart(elementId, type) {
	var eId = elementId;
	var width=$("#"+eId).width(),height=$("#"+eId).height();
	var xLabel, yLabel, tLabel;
	var data, additionalData;
	var labels,max,min=0,xMin=0,xMax,tooltips,additionalTooltips,ticks,xTicks,format;
	var smoothing = false;
	var color = "#2255CC";
	var additionalColor = "#5A7CCC";
	var textColor = "#666666";
	var gridColor = "#999999";
	var backgroundColor = "#FFFDF6";
	var gridLineColor = "#CCCCCC";
	var anchor = "start";
	var chart;
	var series;
	var seriesTooltips;
	var seriesColor = [color, additionalColor];
	var stackSeries = true;
	var xAngle = 0;
	var markerOptions = {};
	
	var chartType;
	var xAxisType;
	var animationDirection;
	switch (type) {
	case 'line':
		chartType = $.jqplot.LineRenderer;
		xAxisType = $.jqplot.LinearAxisRenderer;
		animationDirection = 'left';
		stackSeries = false;
		break;
	case 'bar2':
		chartType = $.jqplot.BarRenderer;
		xAxisType = $.jqplot.CategoryAxisRenderer;
		animationDirection = 'up';
		stackSeries = false;
		break;
	default:
		chartType = $.jqplot.BarRenderer;
		xAxisType = $.jqplot.CategoryAxisRenderer;
		animationDirection = 'up';
		stackSeries = true;
		break;
	}
	
	this.getChart = function() {
		return chart;
	}
	this.getTitle = function() {
		return tLabel;
	};
	this.setSmoothing = function(smooth) {
		if (smoothing != smooth) {
			smoothing = smooth;
			this.render();
		}
	};
	this.setMarkerOptions = function(opt) {
		if (markerOptions != opt) {
			markerOptions = opt;
			this.render();
		}
	};
	this.setXAxisType = function(renderer) {
		if (xAxisType != renderer) {
			xAxisType = renderer;
			this.render();
		}
	};
	this.setStackSeries = function(stack) {
		if (stackSeries != stack) {
			stackSeries = stack;
			this.render();
		}
	};
	this.setTitle = function(title) {
		if (tLabel != title) {
			tLabel = title;
			this.render();			
		}
	};
	this.setAnchor = function(a) {
		if (anchor != a) {
			anchor = a;
			this.render();
		}
	};
	this.setTooltips = function(t) {
		tooltips = t;
		seriesTooltips = [tooltips];
		this.render();
	};
	this.setData = function(d, l, t, ad, at) {
		data = d;
		series = [data];
		if(l && l.length > 20 && xAngle == 0) {
			for (var i=0;i<l.length;i++) {
				if (i % 2 == 0) {
					l[i] = "";
				}
			}
		}
		
		labels = l;
		tooltips = t;
		seriesTooltips = [tooltips];
		if (ad != null) {
			additionalData = ad;
			series.push(additionalData)
		}
		if (at != null) {
			additionalTooltips = at;
			seriesTooltips.push(additionalTooltips);
		}
		this.render();
	};
	this.setAdditionalData = function(d, t) {
		additionalData = d;
		series.push(additionalData)
		additionalTooltips = t;
		seriesTooltips.push(additionalTooltips);
		this.render();
	}
	this.setLabels = function(x,y,t) {
		var changed = false;
		if (xLabel != x) {
			xLabel = x;
			changed = true;
		}
		if (yLabel != y) {
			yLabel = y;
			changed = true;
		}
		if (tLabel != t) {
			tLabel = t;
			changed = true;
		}
		if (changed) {
			this.render();
		}
	};
	this.setXAxis = function(mi, ma, ti) {
		xMin = mi;
		xMax = ma;
		xTicks = ti;
		this.render();
	};
	this.setYAxis = function(mi, ma, ti) {
		min = mi;
		max = ma;
		ticks = ti;
		this.render();
	};
	this.getNiceRange = function(minVal, maxVal, steps) {
		var nice_steps = [1,2,2.5,3,4,5,7.5,10];
		var delta = (maxVal-minVal)/steps;
		var scale = 1.0;
		while(true) {
			var diff = Math.abs(delta - Math.floor(delta));					
			if (diff < 0.0001) {
				break;
			}
			if (scale > 1000) {
				break;
			}
			scale *= 10;
			delta *= 10;
		}
		while(delta > 10) {
			delta /= 10;
			scale /= 10;
		}
		
		var minNice = nice_steps[0];
		var maxNice = nice_steps[nice_steps.length-1];
		for (var i=0;i<nice_steps.length;i++) {
			var nice = nice_steps[i];
			var diff = Math.abs((nice/scale) - Math.floor(nice/scale));
			if ((nice/scale) > 10 || diff == 0) {
				if (delta >= nice && minNice < nice) {
					minNice = nice;
				}
				if (delta <= nice && maxNice > nice) {
					maxNice = nice;
				}
			}
		}
		
		var minDiff = delta - minNice;
		var maxDiff = delta - maxNice;
		delta = (minDiff < maxDiff) ? minNice : maxNice;
		delta /= scale;
		
		var min = minVal % delta;
		if (min > 0) {
			minVal -= min;
		} else if (min < 0) {
			minVal -= (min + delta);
		}
		var max = maxVal % delta;
		if (max > 0) {
			maxVal += delta - max;
		} else if (max < 0) {
			maxVal -= max;
		}

		var size = Math.floor(1 + (maxVal - minVal) / delta);
		var result = new Array(size);
		for(var idx = 0; idx < size; idx++) {
			result[idx] = Math.floor(minVal + (idx * delta));
		}
		
		return result;
	};
	this.setXDim = function(mi, ma) {
		var changed = false;
		var m = Math.ceil(ma);
		mi = Math.floor(mi?mi:0);
		var niceVals = this.getNiceRange(mi*100,m*100,10);
		niceMax = niceVals[niceVals.length-1]/100;
		niceMin = niceVals[0]/100;

		format = "%.0f";
		if (m < 10) {
			format = "%.2f";
		} else if (m < 100) {
			format = "%.1f";
		}
		
		if (xTicks != niceVals.length) {
			xTicks = niceVals.length;
			changed = true;
		}
		if (xMax != niceMax) {
			xMax = niceMax;
			changed = true;
		}
		if (xMin != niceMin) {
			xMin = niceMin;
			changed = true;
		}
		
		if (changed) {
			this.render();
		}
	};
	this.setMax = function(ma, mi) {
		var changed = false;
		var m = Math.ceil(ma);
		mi = Math.floor(mi?mi:0);
		var niceVals = this.getNiceRange(mi*100,m*100,10);
		var niceMax = niceVals[niceVals.length-1]/100;
		var niceMin = niceVals[0]/100;

		format = "%.0f";
		if (m < 10) {
			format = "%.2f";
		} else if (m < 100) {
			format = "%.1f";
		}
		
		if (ticks != niceVals.length) {
			ticks = niceVals.length;
			changed = true;
		}
		if (max != niceMax) {
			max = niceMax;
			changed = true;
		}
		if (min != niceMin) {
			min = niceMin;
			changed = true;
		}
		
		if (changed) {
			this.render();
		}
	};
	this.setSize = function(w, h) {
		var changed = false;
		if (width != w) {
			width = w;	
			changed = true;
		}
		if (height != h) {
			height = h;
			changed = true;
		}
		if (changed) {
			this.render();
		}
	};
	this.setColor = function(c) {
		this.setGridColor(c);
	};
	this.setChartColors = function(c) {
		this.setGridColor(c.graphColor, c.textColor, c.axisColor, c.gridColor, c.backgroundColor, c.additionalGraphColor);
	};
	this.setGridColor = function(graph, text, axis, grid, background, additionalGraph) {
		if (graph != null) {
			color = graph;
		} 
		if (text != null) {
			textColor = text;
		}
		if (axis != null) {
			gridColor = axis;			
		} 
		if (grid != null) {
			gridLineColor = grid;			
		} 
		if (background != null) {
			backgroundColor = background;			
		} 
		if (additionalGraph != null) {
			additionalColor = additionalGraph;
		}
		seriesColor = [color, additionalColor];
		this.render();
	};
	this.setSeries = function(s, l) {
		series = s;
		data = s[0];
		if (l) {
			labels = l;			
		}
		this.render();
	};
	this.setSeriesTooltips = function(t) {
		seriesTooltips = t;
		this.render();
	};
	this.setSeriesColor = function(c) {
		seriesColor = c;
		this.render();
	};
	this.setXAngle = function(a) {
		xAngle = a;
		this.render();
	};
	this.redraw = function(newW, newH) {
		if (newW) {
			width = newW;
			height = newH;
			
			$("#"+eId).css("width",width);
			$("#"+eId).css("height",height);
		} else {
			var p = $("#"+eId).parent();
			var pW = p.width();
			var pH = p.height();
			var hHeight = 0;
			if (p.children(".chart-header").is(":visible")) {
				hHeight = p.children(".chart-header").height();
			}
			var fHeight = 0;
			if (p.children(".chart-footer").is(":visible")) {
				fHeight = p.children(".chart-footer").height();
			}
			width = pW;
			height = pH - (hHeight + fHeight);
			$("#"+eId).css("width",width);
			$("#"+eId).css("height",height);
		}
		
		this.render();
	};
	this.render = function() {
		if (chart) {
			chart.destroy();
		}
		if (series && series[0]) {
			var scaleX = width / 100;
			var scaleY = height / 100;
			var barMargin = Math.max(scaleX / 2,1);
			var gridWidth = scaleX * 80;
			var barWidth = Math.min(((gridWidth / series[0].length)-barMargin), (gridWidth / 7));
			if (!stackSeries || series.length > 2) {
				var d = series.length-1;
				if (!stackSeries) {
					d++;
				}
				barWidth = barWidth /d;
			}
			var labelFontSize = scaleX * 2.5;
			var tickFontSize = scaleX * 2;
			chart = $.jqplot(eId, series, {
				//pluginLocation:'plugins/',
				enablePlugins:true,
				animate: false,
				stackSeries: stackSeries,
				title: {
					text: tLabel,
					fontSize: labelFontSize + 'pt',
	                textColor: textColor
				},
				seriesDefaults: {
					renderer:$.jqplot.BarRenderer,
					rendererOptions:{
						barPadding:0,
						barMargin:barMargin,
						barWidth:barWidth,
						animation:{
							direction:animationDirection,
							speed:1000
						},
						shadowDepth:!stackSeries || series.length > 2 ? 0 : 5,
						fillToZero: true,
						smooth: smoothing
					},
					markerOptions: markerOptions,
					pointLabels: { show: false }
					
				},
				series: [
				    {disableStack: false},
				    {disableStack: false},
				    {disableStack: true}
				],
				seriesColors: seriesColor,
				grid: {
					borderColor: gridColor,
					gridLineColor : gridLineColor,
					background: backgroundColor
				},
				axes: {
					xaxis: {
						renderer: xAxisType,
						labelRenderer: $.jqplot.CanvasAxisLabelRenderer,
						min: xMin,
						max: xMax,
						label: xLabel,
						borderColor: gridColor,
						labelOptions:{
			                fontSize: labelFontSize + 'pt',
			                textColor: textColor
			            },
						tickRenderer:$.jqplot.CanvasAxisTickRenderer,
						ticks: labels,
						numberTicks: xTicks,
						tickOptions:{
							mark:'cross',
							showGridline:false,
							angle:xAngle,
							fontSize:tickFontSize + 'pt',
							labelPosition: anchor,
							textColor: textColor
						}
					},
					yaxis: {
						labelRenderer: $.jqplot.CanvasAxisLabelRenderer,
						label: yLabel,
						borderColor: gridColor,
						labelOptions:{
			                fontSize: labelFontSize + 'pt',
							textColor: textColor
			            },
						min: min,
						max: max,
						numberTicks: ticks,
						tickOptions:{
							
							fontSize:tickFontSize + 'pt',
							textColor: textColor,
							formatString: format
						}
					}
				},
		        highlighter: {
		        	show: seriesTooltips==null?false:true,
		        	showMarker:false,
		        	tooltipLocation:'n',
		        	tooltipAxes:'y',
		        	tooltipContentEditor: function(str, seriesIndex, pointIndex) {
		        		if (seriesIndex > 1) {
		        			return (Math.round((series[seriesIndex][pointIndex])*100)/100);
		        		}
		        		if (typeof seriesTooltips != 'undefined') {
		        			return seriesTooltips[seriesIndex][pointIndex];		        			
		        		} 
		        		return "";
		        	}
		          },
		          cursor: {
		            show: true,
		            zoom: true,
		            showTooltip: false
		          }
			});
			$("#" + eId).bind('contextmenu', function() {
				chart.resetZoom(); 
				return false;
			});
		}
	};
};
export { Chart };

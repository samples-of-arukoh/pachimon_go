var detector = new AR.Detector();

var ar = function(context, imageData) {
    var markers = detector.detect(imageData);
    drawMonsters(context, markers);
    /* for debug
    drawCorners(context, markers);
    drawId(context, markers);
    */
}

var frameNum = 1;
function drawMonsters(context, markers) {
    var corners, corner, i;
    var img = document.getElementById('monster-f' + frameNum);
    if (++frameNum > 9) { frameNum = 1; };
    
    for (i = 0; i !== markers.length; ++ i) {
        corners = markers[i].corners;
        var triangles = calculateGeometry(img, corners);
        for (tri of triangles) {
    	    drawTriangle(context, img,
						 tri.p0.x, tri.p0.y,
						 tri.p1.x, tri.p1.y,
						 tri.p2.x, tri.p2.y,
						 tri.t0.u, tri.t0.v,
						 tri.t1.u, tri.t1.v,
						 tri.t2.u, tri.t2.v);
    	}
    }
}

function drawCorners(context, markers) {
    var corners, corner, i, j;
    
    context.lineWidth = 3;
    for (i = 0; i !== markers.length; ++ i) {
        corners = markers[i].corners;
        
        context.strokeStyle = "red";
        context.beginPath();
        for (j = 0; j !== corners.length; ++ j) {
            corner = corners[j];
            context.moveTo(corner.x, corner.y);
            corner = corners[(j + 1) % corners.length];
            context.lineTo(corner.x, corner.y);
        }
        context.stroke();
        context.closePath();
        
        context.strokeStyle = "green";
        context.strokeRect(corners[0].x - 2, corners[0].y - 2, 4, 4);
    }
}

function drawId(context, markers) {
    var corners, corner, x, y, i, j;
    
    context.strokeStyle = "blue";
    context.lineWidth = 1;

    for (i = 0; i !== markers.length; ++ i) {
        corners = markers[i].corners;
        
        x = Infinity;
        y = Infinity;
        for (j = 0; j !== corners.length; ++ j) {
            corner = corners[j];
            x = Math.min(x, corner.x);
            y = Math.min(y, corner.y);
        }
        context.strokeText(markers[i].id, x, y);
    }
}

var calculateGeometry = function(image, corners) {
    var triangles = [];

	var subs = 7; // vertical subdivisions
	var divs = 7; // horizontal subdivisions

	var p1 = new Point(corners[0].x, corners[0].y);
	var p2 = new Point(corners[1].x, corners[1].y);
	var p3 = new Point(corners[2].x, corners[2].y);
	var p4 = new Point(corners[3].x, corners[3].y);

	var dx1 = p4.x - p1.x;
	var dy1 = p4.y - p1.y;
	var dx2 = p3.x - p2.x;
	var dy2 = p3.y - p2.y;

	var imgW = image.naturalWidth;
	var imgH = image.naturalHeight;

	for (var sub = 0; sub < subs; ++sub) {
		var curRow = sub / subs;
		var nextRow = (sub + 1) / subs;

		var curRowX1 = p1.x + dx1 * curRow;
		var curRowY1 = p1.y + dy1 * curRow;
		
		var curRowX2 = p2.x + dx2 * curRow;
		var curRowY2 = p2.y + dy2 * curRow;

		var nextRowX1 = p1.x + dx1 * nextRow;
		var nextRowY1 = p1.y + dy1 * nextRow;
		
		var nextRowX2 = p2.x + dx2 * nextRow;
		var nextRowY2 = p2.y + dy2 * nextRow;

		for (var div = 0; div < divs; ++div) {
			var curCol = div / divs;
			var nextCol = (div + 1) / divs;

			var dCurX = curRowX2 - curRowX1;
			var dCurY = curRowY2 - curRowY1;
			var dNextX = nextRowX2 - nextRowX1;
			var dNextY = nextRowY2 - nextRowY1;

			var p1x = curRowX1 + dCurX * curCol;
			var p1y = curRowY1 + dCurY * curCol;

			var p2x = curRowX1 + (curRowX2 - curRowX1) * nextCol;
			var p2y = curRowY1 + (curRowY2 - curRowY1) * nextCol;

			var p3x = nextRowX1 + dNextX * nextCol;
			var p3y = nextRowY1 + dNextY * nextCol;

			var p4x = nextRowX1 + dNextX * curCol;
			var p4y = nextRowY1 + dNextY * curCol;

			var u1 = curCol * imgW;
			var u2 = nextCol * imgW;
			var v1 = curRow * imgH;
			var v2 = nextRow * imgH;

			var triangle1 = new Triangle(
				new Point(p1x, p1y),
				new Point(p3x, p3y),
				new Point(p4x, p4y),
				new TextCoord(u1, v1),
				new TextCoord(u2, v2),
				new TextCoord(u1, v2)
			);

			var triangle2 = new Triangle(
				new Point(p1x, p1y),
				new Point(p2x, p2y),
				new Point(p3x, p3y),
				new TextCoord(u1, v1),
				new TextCoord(u2, v1),
				new TextCoord(u2, v2)
			);

			triangles.push(triangle1);
			triangles.push(triangle2);
		}
	}
    return triangles;
};

var drawTriangle = function(ctx, im, x0, y0, x1, y1, x2, y2, sx0, sy0, sx1, sy1, sx2, sy2) {
    ctx.save();

    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.closePath();
    ctx.clip();

    var denom = sx0 * (sy2 - sy1) - sx1 * sy2 + sx2 * sy1 + (sx1 - sx2) * sy0;
    if (denom == 0) {
        return;
    }
    var m11 = -(sy0 * (x2 - x1) - sy1 * x2 + sy2 * x1 + (sy1 - sy2) * x0) / denom;
    var m12 = (sy1 * y2 + sy0 * (y1 - y2) - sy2 * y1 + (sy2 - sy1) * y0) / denom;
    var m21 = (sx0 * (x2 - x1) - sx1 * x2 + sx2 * x1 + (sx1 - sx2) * x0) / denom;
    var m22 = -(sx1 * y2 + sx0 * (y1 - y2) - sx2 * y1 + (sx2 - sx1) * y0) / denom;
    var dx = (sx0 * (sy2 * x1 - sy1 * x2) + sy0 * (sx1 * x2 - sx2 * x1) + (sx2 * sy1 - sx1 * sy2) * x0) / denom;
    var dy = (sx0 * (sy2 * y1 - sy1 * y2) + sy0 * (sx1 * y2 - sx2 * y1) + (sx2 * sy1 - sx1 * sy2) * y0) / denom;
    ctx.transform(m11, m12, m21, m22, dx, dy);

    ctx.drawImage(im, 0, 0);
    ctx.restore();
};

// point class
var Point = function(x,y) {
    this.x = x ? x : 0;
	this.y = y ? y : 0;
}

var p = Point.prototype;

p.length = function(point) {
	point = point ? point : new Point();
	var xs =0, ys =0;
	xs = point.x - this.x;
	xs = xs * xs;

	ys = point.y - this.y;
	ys = ys * ys;
	return Math.sqrt(xs + ys);
}

var TextCoord = function(u,v) {
	this.u = u ? u : 0;
	this.v = v ? v : 0;
}

var Triangle = function(p0, p1, p2, t0, t1, t2) {
	this.p0 = p0;
	this.p1 = p1;
	this.p2 = p2;

	this.t0 = t0;
	this.t1 = t1;
	this.t2 = t2;
}
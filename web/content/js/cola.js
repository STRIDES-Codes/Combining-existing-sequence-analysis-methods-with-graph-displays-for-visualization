(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.cola = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
__export(require("./src/adaptor"));
__export(require("./src/d3adaptor"));
__export(require("./src/descent"));
__export(require("./src/geom"));
__export(require("./src/gridrouter"));
__export(require("./src/handledisconnected"));
__export(require("./src/layout"));
__export(require("./src/layout3d"));
__export(require("./src/linklengths"));
__export(require("./src/powergraph"));
__export(require("./src/pqueue"));
__export(require("./src/rbtree"));
__export(require("./src/rectangle"));
__export(require("./src/shortestpaths"));
__export(require("./src/vpsc"));
__export(require("./src/batch"));

},{"./src/adaptor":2,"./src/batch":3,"./src/d3adaptor":4,"./src/descent":7,"./src/geom":8,"./src/gridrouter":9,"./src/handledisconnected":10,"./src/layout":11,"./src/layout3d":12,"./src/linklengths":13,"./src/powergraph":14,"./src/pqueue":15,"./src/rbtree":16,"./src/rectangle":17,"./src/shortestpaths":18,"./src/vpsc":19}],2:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var layout_1 = require("./layout");
var LayoutAdaptor = (function (_super) {
    __extends(LayoutAdaptor, _super);
    function LayoutAdaptor(options) {
        var _this = _super.call(this) || this;
        var self = _this;
        var o = options;
        if (o.trigger) {
            _this.trigger = o.trigger;
        }
        if (o.kick) {
            _this.kick = o.kick;
        }
        if (o.drag) {
            _this.drag = o.drag;
        }
        if (o.on) {
            _this.on = o.on;
        }
        _this.dragstart = _this.dragStart = layout_1.Layout.dragStart;
        _this.dragend = _this.dragEnd = layout_1.Layout.dragEnd;
        return _this;
    }
    LayoutAdaptor.prototype.trigger = function (e) { };
    ;
    LayoutAdaptor.prototype.kick = function () { };
    ;
    LayoutAdaptor.prototype.drag = function () { };
    ;
    LayoutAdaptor.prototype.on = function (eventType, listener) { return this; };
    ;
    return LayoutAdaptor;
}(layout_1.Layout));
exports.LayoutAdaptor = LayoutAdaptor;
function adaptor(options) {
    return new LayoutAdaptor(options);
}
exports.adaptor = adaptor;

},{"./layout":11}],3:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var layout_1 = require("./layout");
var gridrouter_1 = require("./gridrouter");
function gridify(pgLayout, nudgeGap, margin, groupMargin) {
    pgLayout.cola.start(0, 0, 0, 10, false);
    var gridrouter = route(pgLayout.cola.nodes(), pgLayout.cola.groups(), margin, groupMargin);
    return gridrouter.routeEdges(pgLayout.powerGraph.powerEdges, nudgeGap, function (e) { return e.source.routerNode.id; }, function (e) { return e.target.routerNode.id; });
}
exports.gridify = gridify;
function route(nodes, groups, margin, groupMargin) {
    nodes.forEach(function (d) {
        d.routerNode = {
            name: d.name,
            bounds: d.bounds.inflate(-margin)
        };
    });
    groups.forEach(function (d) {
        d.routerNode = {
            bounds: d.bounds.inflate(-groupMargin),
            children: (typeof d.groups !== 'undefined' ? d.groups.map(function (c) { return nodes.length + c.id; }) : [])
                .concat(typeof d.leaves !== 'undefined' ? d.leaves.map(function (c) { return c.index; }) : [])
        };
    });
    var gridRouterNodes = nodes.concat(groups).map(function (d, i) {
        d.routerNode.id = i;
        return d.routerNode;
    });
    return new gridrouter_1.GridRouter(gridRouterNodes, {
        getChildren: function (v) { return v.children; },
        getBounds: function (v) { return v.bounds; }
    }, margin - groupMargin);
}
function powerGraphGridLayout(graph, size, grouppadding) {
    var powerGraph;
    graph.nodes.forEach(function (v, i) { return v.index = i; });
    new layout_1.Layout()
        .avoidOverlaps(false)
        .nodes(graph.nodes)
        .links(graph.links)
        .powerGraphGroups(function (d) {
        powerGraph = d;
        powerGraph.groups.forEach(function (v) { return v.padding = grouppadding; });
    });
    var n = graph.nodes.length;
    var edges = [];
    var vs = graph.nodes.slice(0);
    vs.forEach(function (v, i) { return v.index = i; });
    powerGraph.groups.forEach(function (g) {
        var sourceInd = g.index = g.id + n;
        vs.push(g);
        if (typeof g.leaves !== 'undefined')
            g.leaves.forEach(function (v) { return edges.push({ source: sourceInd, target: v.index }); });
        if (typeof g.groups !== 'undefined')
            g.groups.forEach(function (gg) { return edges.push({ source: sourceInd, target: gg.id + n }); });
    });
    powerGraph.powerEdges.forEach(function (e) {
        edges.push({ source: e.source.index, target: e.target.index });
    });
    new layout_1.Layout()
        .size(size)
        .nodes(vs)
        .links(edges)
        .avoidOverlaps(false)
        .linkDistance(30)
        .symmetricDiffLinkLengths(5)
        .convergenceThreshold(1e-4)
        .start(100, 0, 0, 0, false);
    return {
        cola: new layout_1.Layout()
            .convergenceThreshold(1e-3)
            .size(size)
            .avoidOverlaps(true)
            .nodes(graph.nodes)
            .links(graph.links)
            .groupCompactness(1e-4)
            .linkDistance(30)
            .symmetricDiffLinkLengths(5)
            .powerGraphGroups(function (d) {
            powerGraph = d;
            powerGraph.groups.forEach(function (v) {
                v.padding = grouppadding;
            });
        }).start(50, 0, 100, 0, false),
        powerGraph: powerGraph
    };
}
exports.powerGraphGridLayout = powerGraphGridLayout;

},{"./gridrouter":9,"./layout":11}],4:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var d3v3 = require("./d3v3adaptor");
var d3v4 = require("./d3v4adaptor");
;
function d3adaptor(d3Context) {
    if (!d3Context || isD3V3(d3Context)) {
        return new d3v3.D3StyleLayoutAdaptor();
    }
    return new d3v4.D3StyleLayoutAdaptor(d3Context);
}
exports.d3adaptor = d3adaptor;
function isD3V3(d3Context) {
    var v3exp = /^3\./;
    return d3Context.version && d3Context.version.match(v3exp) !== null;
}

},{"./d3v3adaptor":5,"./d3v4adaptor":6}],5:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var layout_1 = require("./layout");
var D3StyleLayoutAdaptor = (function (_super) {
    __extends(D3StyleLayoutAdaptor, _super);
    function D3StyleLayoutAdaptor() {
        var _this = _super.call(this) || this;
        _this.event = d3.dispatch(layout_1.EventType[layout_1.EventType.start], layout_1.EventType[layout_1.EventType.tick], layout_1.EventType[layout_1.EventType.end]);
        var d3layout = _this;
        var drag;
        _this.drag = function () {
            if (!drag) {
                var drag = d3.behavior.drag()
                    .origin(layout_1.Layout.dragOrigin)
                    .on("dragstart.d3adaptor", layout_1.Layout.dragStart)
                    .on("drag.d3adaptor", function (d) {
                    layout_1.Layout.drag(d, d3.event);
                    d3layout.resume();
                })
                    .on("dragend.d3adaptor", layout_1.Layout.dragEnd);
            }
            if (!arguments.length)
                return drag;
            this
                .call(drag);
        };
        return _this;
    }
    D3StyleLayoutAdaptor.prototype.trigger = function (e) {
        var d3event = { type: layout_1.EventType[e.type], alpha: e.alpha, stress: e.stress };
        this.event[d3event.type](d3event);
    };
    D3StyleLayoutAdaptor.prototype.kick = function () {
        var _this = this;
        d3.timer(function () { return _super.prototype.tick.call(_this); });
    };
    D3StyleLayoutAdaptor.prototype.on = function (eventType, listener) {
        if (typeof eventType === 'string') {
            this.event.on(eventType, listener);
        }
        else {
            this.event.on(layout_1.EventType[eventType], listener);
        }
        return this;
    };
    return D3StyleLayoutAdaptor;
}(layout_1.Layout));
exports.D3StyleLayoutAdaptor = D3StyleLayoutAdaptor;
function d3adaptor() {
    return new D3StyleLayoutAdaptor();
}
exports.d3adaptor = d3adaptor;

},{"./layout":11}],6:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var layout_1 = require("./layout");
var D3StyleLayoutAdaptor = (function (_super) {
    __extends(D3StyleLayoutAdaptor, _super);
    function D3StyleLayoutAdaptor(d3Context) {
        var _this = _super.call(this) || this;
        _this.d3Context = d3Context;
        _this.event = d3Context.dispatch(layout_1.EventType[layout_1.EventType.start], layout_1.EventType[layout_1.EventType.tick], layout_1.EventType[layout_1.EventType.end]);
        var d3layout = _this;
        var drag;
        _this.drag = function () {
            if (!drag) {
                var drag = d3Context.drag()
                    .subject(layout_1.Layout.dragOrigin)
                    .on("start.d3adaptor", layout_1.Layout.dragStart)
                    .on("drag.d3adaptor", function (d) {
                    layout_1.Layout.drag(d, d3Context.event);
                    d3layout.resume();
                })
                    .on("end.d3adaptor", layout_1.Layout.dragEnd);
            }
            if (!arguments.length)
                return drag;
            arguments[0].call(drag);
        };
        return _this;
    }
    D3StyleLayoutAdaptor.prototype.trigger = function (e) {
        var d3event = { type: layout_1.EventType[e.type], alpha: e.alpha, stress: e.stress };
        this.event.call(d3event.type, d3event);
    };
    D3StyleLayoutAdaptor.prototype.kick = function () {
        var _this = this;
        var t = this.d3Context.timer(function () { return _super.prototype.tick.call(_this) && t.stop(); });
    };
    D3StyleLayoutAdaptor.prototype.on = function (eventType, listener) {
        if (typeof eventType === 'string') {
            this.event.on(eventType, listener);
        }
        else {
            this.event.on(layout_1.EventType[eventType], listener);
        }
        return this;
    };
    return D3StyleLayoutAdaptor;
}(layout_1.Layout));
exports.D3StyleLayoutAdaptor = D3StyleLayoutAdaptor;

},{"./layout":11}],7:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Locks = (function () {
    function Locks() {
        this.locks = {};
    }
    Locks.prototype.add = function (id, x) {
        this.locks[id] = x;
    };
    Locks.prototype.clear = function () {
        this.locks = {};
    };
    Locks.prototype.isEmpty = function () {
        for (var l in this.locks)
            return false;
        return true;
    };
    Locks.prototype.apply = function (f) {
        for (var l in this.locks) {
            f(Number(l), this.locks[l]);
        }
    };
    return Locks;
}());
exports.Locks = Locks;
var Descent = (function () {
    function Descent(x, D, G) {
        if (G === void 0) { G = null; }
        this.D = D;
        this.G = G;
        this.threshold = 0.0001;
        this.numGridSnapNodes = 0;
        this.snapGridSize = 100;
        this.snapStrength = 1000;
        this.scaleSnapByMaxH = false;
        this.random = new PseudoRandom();
        this.project = null;
        this.x = x;
        this.k = x.length;
        var n = this.n = x[0].length;
        this.H = new Array(this.k);
        this.g = new Array(this.k);
        this.Hd = new Array(this.k);
        this.a = new Array(this.k);
        this.b = new Array(this.k);
        this.c = new Array(this.k);
        this.d = new Array(this.k);
        this.e = new Array(this.k);
        this.ia = new Array(this.k);
        this.ib = new Array(this.k);
        this.xtmp = new Array(this.k);
        this.locks = new Locks();
        this.minD = Number.MAX_VALUE;
        var i = n, j;
        while (i--) {
            j = n;
            while (--j > i) {
                var d = D[i][j];
                if (d > 0 && d < this.minD) {
                    this.minD = d;
                }
            }
        }
        if (this.minD === Number.MAX_VALUE)
            this.minD = 1;
        i = this.k;
        while (i--) {
            this.g[i] = new Array(n);
            this.H[i] = new Array(n);
            j = n;
            while (j--) {
                this.H[i][j] = new Array(n);
            }
            this.Hd[i] = new Array(n);
            this.a[i] = new Array(n);
            this.b[i] = new Array(n);
            this.c[i] = new Array(n);
            this.d[i] = new Array(n);
            this.e[i] = new Array(n);
            this.ia[i] = new Array(n);
            this.ib[i] = new Array(n);
            this.xtmp[i] = new Array(n);
        }
    }
    Descent.createSquareMatrix = function (n, f) {
        var M = new Array(n);
        for (var i = 0; i < n; ++i) {
            M[i] = new Array(n);
            for (var j = 0; j < n; ++j) {
                M[i][j] = f(i, j);
            }
        }
        return M;
    };
    Descent.prototype.offsetDir = function () {
        var _this = this;
        var u = new Array(this.k);
        var l = 0;
        for (var i = 0; i < this.k; ++i) {
            var x = u[i] = this.random.getNextBetween(0.01, 1) - 0.5;
            l += x * x;
        }
        l = Math.sqrt(l);
        return u.map(function (x) { return x *= _this.minD / l; });
    };
    Descent.prototype.computeDerivatives = function (x) {
        var _this = this;
        var n = this.n;
        if (n < 1)
            return;
        var i;
        var d = new Array(this.k);
        var d2 = new Array(this.k);
        var Huu = new Array(this.k);
        var maxH = 0;
        for (var u_1 = 0; u_1 < n; ++u_1) {
            for (i = 0; i < this.k; ++i)
                Huu[i] = this.g[i][u_1] = 0;
            for (var v = 0; v < n; ++v) {
                if (u_1 === v)
                    continue;
                var maxDisplaces = n;
                var distanceSquared = 0;
                while (maxDisplaces--) {
                    distanceSquared = 0;
                    for (i = 0; i < this.k; ++i) {
                        var dx_1 = d[i] = x[i][u_1] - x[i][v];
                        distanceSquared += d2[i] = dx_1 * dx_1;
                    }
                    if (distanceSquared > 1e-9)
                        break;
                    var rd = this.offsetDir();
                    for (i = 0; i < this.k; ++i)
                        x[i][v] += rd[i];
                }
                var distance = Math.sqrt(distanceSquared);
                var idealDistance = this.D[u_1][v];
                var weight = this.G != null ? this.G[u_1][v] : 1;
                if (weight > 1 && distance > idealDistance || !isFinite(idealDistance)) {
                    for (i = 0; i < this.k; ++i)
                        this.H[i][u_1][v] = 0;
                    continue;
                }
                if (weight > 1) {
                    weight = 1;
                }
                var idealDistSquared = idealDistance * idealDistance, gs = 2 * weight * (distance - idealDistance) / (idealDistSquared * distance), distanceCubed = distanceSquared * distance, hs = 2 * -weight / (idealDistSquared * distanceCubed);
                if (!isFinite(gs))
                    console.log(gs);
                for (i = 0; i < this.k; ++i) {
                    this.g[i][u_1] += d[i] * gs;
                    Huu[i] -= this.H[i][u_1][v] = hs * (2 * distanceCubed + idealDistance * (d2[i] - distanceSquared));
                }
            }
            for (i = 0; i < this.k; ++i)
                maxH = Math.max(maxH, this.H[i][u_1][u_1] = Huu[i]);
        }
        var r = this.snapGridSize / 2;
        var g = this.snapGridSize;
        var w = this.snapStrength;
        var k = w / (r * r);
        var numNodes = this.numGridSnapNodes;
        for (var u = 0; u < numNodes; ++u) {
            for (i = 0; i < this.k; ++i) {
                var xiu = this.x[i][u];
                var m = xiu / g;
                var f = m % 1;
                var q = m - f;
                var a = Math.abs(f);
                var dx = (a <= 0.5) ? xiu - q * g :
                    (xiu > 0) ? xiu - (q + 1) * g : xiu - (q - 1) * g;
                if (-r < dx && dx <= r) {
                    if (this.scaleSnapByMaxH) {
                        this.g[i][u] += maxH * k * dx;
                        this.H[i][u][u] += maxH * k;
                    }
                    else {
                        this.g[i][u] += k * dx;
                        this.H[i][u][u] += k;
                    }
                }
            }
        }
        if (!this.locks.isEmpty()) {
            this.locks.apply(function (u, p) {
                for (i = 0; i < _this.k; ++i) {
                    _this.H[i][u][u] += maxH;
                    _this.g[i][u] -= maxH * (p[i] - x[i][u]);
                }
            });
        }
    };
    Descent.dotProd = function (a, b) {
        var x = 0, i = a.length;
        while (i--)
            x += a[i] * b[i];
        return x;
    };
    Descent.rightMultiply = function (m, v, r) {
        var i = m.length;
        while (i--)
            r[i] = Descent.dotProd(m[i], v);
    };
    Descent.prototype.computeStepSize = function (d) {
        var numerator = 0, denominator = 0;
        for (var i = 0; i < this.k; ++i) {
            numerator += Descent.dotProd(this.g[i], d[i]);
            Descent.rightMultiply(this.H[i], d[i], this.Hd[i]);
            denominator += Descent.dotProd(d[i], this.Hd[i]);
        }
        if (denominator === 0 || !isFinite(denominator))
            return 0;
        return 1 * numerator / denominator;
    };
    Descent.prototype.reduceStress = function () {
        this.computeDerivatives(this.x);
        var alpha = this.computeStepSize(this.g);
        for (var i = 0; i < this.k; ++i) {
            this.takeDescentStep(this.x[i], this.g[i], alpha);
        }
        return this.computeStress();
    };
    Descent.copy = function (a, b) {
        var m = a.length, n = b[0].length;
        for (var i = 0; i < m; ++i) {
            for (var j = 0; j < n; ++j) {
                b[i][j] = a[i][j];
            }
        }
    };
    Descent.prototype.stepAndProject = function (x0, r, d, stepSize) {
        Descent.copy(x0, r);
        this.takeDescentStep(r[0], d[0], stepSize);
        if (this.project)
            this.project[0](x0[0], x0[1], r[0]);
        this.takeDescentStep(r[1], d[1], stepSize);
        if (this.project)
            this.project[1](r[0], x0[1], r[1]);
        for (var i = 2; i < this.k; i++)
            this.takeDescentStep(r[i], d[i], stepSize);
    };
    Descent.mApply = function (m, n, f) {
        var i = m;
        while (i-- > 0) {
            var j = n;
            while (j-- > 0)
                f(i, j);
        }
    };
    Descent.prototype.matrixApply = function (f) {
        Descent.mApply(this.k, this.n, f);
    };
    Descent.prototype.computeNextPosition = function (x0, r) {
        var _this = this;
        this.computeDerivatives(x0);
        var alpha = this.computeStepSize(this.g);
        this.stepAndProject(x0, r, this.g, alpha);
        if (this.project) {
            this.matrixApply(function (i, j) { return _this.e[i][j] = x0[i][j] - r[i][j]; });
            var beta = this.computeStepSize(this.e);
            beta = Math.max(0.2, Math.min(beta, 1));
            this.stepAndProject(x0, r, this.e, beta);
        }
    };
    Descent.prototype.run = function (iterations) {
        var stress = Number.MAX_VALUE, converged = false;
        while (!converged && iterations-- > 0) {
            var s = this.rungeKutta();
            converged = Math.abs(stress / s - 1) < this.threshold;
            stress = s;
        }
        return stress;
    };
    Descent.prototype.rungeKutta = function () {
        var _this = this;
        this.computeNextPosition(this.x, this.a);
        Descent.mid(this.x, this.a, this.ia);
        this.computeNextPosition(this.ia, this.b);
        Descent.mid(this.x, this.b, this.ib);
        this.computeNextPosition(this.ib, this.c);
        this.computeNextPosition(this.c, this.d);
        var disp = 0;
        this.matrixApply(function (i, j) {
            var x = (_this.a[i][j] + 2.0 * _this.b[i][j] + 2.0 * _this.c[i][j] + _this.d[i][j]) / 6.0, d = _this.x[i][j] - x;
            disp += d * d;
            _this.x[i][j] = x;
        });
        return disp;
    };
    Descent.mid = function (a, b, m) {
        Descent.mApply(a.length, a[0].length, function (i, j) {
            return m[i][j] = a[i][j] + (b[i][j] - a[i][j]) / 2.0;
        });
    };
    Descent.prototype.takeDescentStep = function (x, d, stepSize) {
        for (var i = 0; i < this.n; ++i) {
            x[i] = x[i] - stepSize * d[i];
        }
    };
    Descent.prototype.computeStress = function () {
        var stress = 0;
        for (var u = 0, nMinus1 = this.n - 1; u < nMinus1; ++u) {
            for (var v = u + 1, n = this.n; v < n; ++v) {
                var l = 0;
                for (var i = 0; i < this.k; ++i) {
                    var dx = this.x[i][u] - this.x[i][v];
                    l += dx * dx;
                }
                l = Math.sqrt(l);
                var d = this.D[u][v];
                if (!isFinite(d))
                    continue;
                var rl = d - l;
                var d2 = d * d;
                stress += rl * rl / d2;
            }
        }
        return stress;
    };
    Descent.zeroDistance = 1e-10;
    return Descent;
}());
exports.Descent = Descent;
var PseudoRandom = (function () {
    function PseudoRandom(seed) {
        if (seed === void 0) { seed = 1; }
        this.seed = seed;
        this.a = 214013;
        this.c = 2531011;
        this.m = 2147483648;
        this.range = 32767;
    }
    PseudoRandom.prototype.getNext = function () {
        this.seed = (this.seed * this.a + this.c) % this.m;
        return (this.seed >> 16) / this.range;
    };
    PseudoRandom.prototype.getNextBetween = function (min, max) {
        return min + this.getNext() * (max - min);
    };
    return PseudoRandom;
}());
exports.PseudoRandom = PseudoRandom;

},{}],8:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var rectangle_1 = require("./rectangle");
var Point = (function () {
    function Point() {
    }
    return Point;
}());
exports.Point = Point;
var LineSegment = (function () {
    function LineSegment(x1, y1, x2, y2) {
        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;
    }
    return LineSegment;
}());
exports.LineSegment = LineSegment;
var PolyPoint = (function (_super) {
    __extends(PolyPoint, _super);
    function PolyPoint() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return PolyPoint;
}(Point));
exports.PolyPoint = PolyPoint;
function isLeft(P0, P1, P2) {
    return (P1.x - P0.x) * (P2.y - P0.y) - (P2.x - P0.x) * (P1.y - P0.y);
}
exports.isLeft = isLeft;
function above(p, vi, vj) {
    return isLeft(p, vi, vj) > 0;
}
function below(p, vi, vj) {
    return isLeft(p, vi, vj) < 0;
}
function ConvexHull(S) {
    var P = S.slice(0).sort(function (a, b) { return a.x !== b.x ? b.x - a.x : b.y - a.y; });
    var n = S.length, i;
    var minmin = 0;
    var xmin = P[0].x;
    for (i = 1; i < n; ++i) {
        if (P[i].x !== xmin)
            break;
    }
    var minmax = i - 1;
    var H = [];
    H.push(P[minmin]);
    if (minmax === n - 1) {
        if (P[minmax].y !== P[minmin].y)
            H.push(P[minmax]);
    }
    else {
        var maxmin, maxmax = n - 1;
        var xmax = P[n - 1].x;
        for (i = n - 2; i >= 0; i--)
            if (P[i].x !== xmax)
                break;
        maxmin = i + 1;
        i = minmax;
        while (++i <= maxmin) {
            if (isLeft(P[minmin], P[maxmin], P[i]) >= 0 && i < maxmin)
                continue;
            while (H.length > 1) {
                if (isLeft(H[H.length - 2], H[H.length - 1], P[i]) > 0)
                    break;
                else
                    H.length -= 1;
            }
            if (i != minmin)
                H.push(P[i]);
        }
        if (maxmax != maxmin)
            H.push(P[maxmax]);
        var bot = H.length;
        i = maxmin;
        while (--i >= minmax) {
            if (isLeft(P[maxmax], P[minmax], P[i]) >= 0 && i > minmax)
                continue;
            while (H.length > bot) {
                if (isLeft(H[H.length - 2], H[H.length - 1], P[i]) > 0)
                    break;
                else
                    H.length -= 1;
            }
            if (i != minmin)
                H.push(P[i]);
        }
    }
    return H;
}
exports.ConvexHull = ConvexHull;
function clockwiseRadialSweep(p, P, f) {
    P.slice(0).sort(function (a, b) { return Math.atan2(a.y - p.y, a.x - p.x) - Math.atan2(b.y - p.y, b.x - p.x); }).forEach(f);
}
exports.clockwiseRadialSweep = clockwiseRadialSweep;
function nextPolyPoint(p, ps) {
    if (p.polyIndex === ps.length - 1)
        return ps[0];
    return ps[p.polyIndex + 1];
}
function prevPolyPoint(p, ps) {
    if (p.polyIndex === 0)
        return ps[ps.length - 1];
    return ps[p.polyIndex - 1];
}
function tangent_PointPolyC(P, V) {
    var Vclosed = V.slice(0);
    Vclosed.push(V[0]);
    return { rtan: Rtangent_PointPolyC(P, Vclosed), ltan: Ltangent_PointPolyC(P, Vclosed) };
}
function Rtangent_PointPolyC(P, V) {
    var n = V.length - 1;
    var a, b, c;
    var upA, dnC;
    if (below(P, V[1], V[0]) && !above(P, V[n - 1], V[0]))
        return 0;
    for (a = 0, b = n;;) {
        if (b - a === 1)
            if (above(P, V[a], V[b]))
                return a;
            else
                return b;
        c = Math.floor((a + b) / 2);
        dnC = below(P, V[c + 1], V[c]);
        if (dnC && !above(P, V[c - 1], V[c]))
            return c;
        upA = above(P, V[a + 1], V[a]);
        if (upA) {
            if (dnC)
                b = c;
            else {
                if (above(P, V[a], V[c]))
                    b = c;
                else
                    a = c;
            }
        }
        else {
            if (!dnC)
                a = c;
            else {
                if (below(P, V[a], V[c]))
                    b = c;
                else
                    a = c;
            }
        }
    }
}
function Ltangent_PointPolyC(P, V) {
    var n = V.length - 1;
    var a, b, c;
    var dnA, dnC;
    if (above(P, V[n - 1], V[0]) && !below(P, V[1], V[0]))
        return 0;
    for (a = 0, b = n;;) {
        if (b - a === 1)
            if (below(P, V[a], V[b]))
                return a;
            else
                return b;
        c = Math.floor((a + b) / 2);
        dnC = below(P, V[c + 1], V[c]);
        if (above(P, V[c - 1], V[c]) && !dnC)
            return c;
        dnA = below(P, V[a + 1], V[a]);
        if (dnA) {
            if (!dnC)
                b = c;
            else {
                if (below(P, V[a], V[c]))
                    b = c;
                else
                    a = c;
            }
        }
        else {
            if (dnC)
                a = c;
            else {
                if (above(P, V[a], V[c]))
                    b = c;
                else
                    a = c;
            }
        }
    }
}
function tangent_PolyPolyC(V, W, t1, t2, cmp1, cmp2) {
    var ix1, ix2;
    ix1 = t1(W[0], V);
    ix2 = t2(V[ix1], W);
    var done = false;
    while (!done) {
        done = true;
        while (true) {
            if (ix1 === V.length - 1)
                ix1 = 0;
            if (cmp1(W[ix2], V[ix1], V[ix1 + 1]))
                break;
            ++ix1;
        }
        while (true) {
            if (ix2 === 0)
                ix2 = W.length - 1;
            if (cmp2(V[ix1], W[ix2], W[ix2 - 1]))
                break;
            --ix2;
            done = false;
        }
    }
    return { t1: ix1, t2: ix2 };
}
exports.tangent_PolyPolyC = tangent_PolyPolyC;
function LRtangent_PolyPolyC(V, W) {
    var rl = RLtangent_PolyPolyC(W, V);
    return { t1: rl.t2, t2: rl.t1 };
}
exports.LRtangent_PolyPolyC = LRtangent_PolyPolyC;
function RLtangent_PolyPolyC(V, W) {
    return tangent_PolyPolyC(V, W, Rtangent_PointPolyC, Ltangent_PointPolyC, above, below);
}
exports.RLtangent_PolyPolyC = RLtangent_PolyPolyC;
function LLtangent_PolyPolyC(V, W) {
    return tangent_PolyPolyC(V, W, Ltangent_PointPolyC, Ltangent_PointPolyC, below, below);
}
exports.LLtangent_PolyPolyC = LLtangent_PolyPolyC;
function RRtangent_PolyPolyC(V, W) {
    return tangent_PolyPolyC(V, W, Rtangent_PointPolyC, Rtangent_PointPolyC, above, above);
}
exports.RRtangent_PolyPolyC = RRtangent_PolyPolyC;
var BiTangent = (function () {
    function BiTangent(t1, t2) {
        this.t1 = t1;
        this.t2 = t2;
    }
    return BiTangent;
}());
exports.BiTangent = BiTangent;
var BiTangents = (function () {
    function BiTangents() {
    }
    return BiTangents;
}());
exports.BiTangents = BiTangents;
var TVGPoint = (function (_super) {
    __extends(TVGPoint, _super);
    function TVGPoint() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return TVGPoint;
}(Point));
exports.TVGPoint = TVGPoint;
var VisibilityVertex = (function () {
    function VisibilityVertex(id, polyid, polyvertid, p) {
        this.id = id;
        this.polyid = polyid;
        this.polyvertid = polyvertid;
        this.p = p;
        p.vv = this;
    }
    return VisibilityVertex;
}());
exports.VisibilityVertex = VisibilityVertex;
var VisibilityEdge = (function () {
    function VisibilityEdge(source, target) {
        this.source = source;
        this.target = target;
    }
    VisibilityEdge.prototype.length = function () {
        var dx = this.source.p.x - this.target.p.x;
        var dy = this.source.p.y - this.target.p.y;
        return Math.sqrt(dx * dx + dy * dy);
    };
    return VisibilityEdge;
}());
exports.VisibilityEdge = VisibilityEdge;
var TangentVisibilityGraph = (function () {
    function TangentVisibilityGraph(P, g0) {
        this.P = P;
        this.V = [];
        this.E = [];
        if (!g0) {
            var n = P.length;
            for (var i = 0; i < n; i++) {
                var p = P[i];
                for (var j = 0; j < p.length; ++j) {
                    var pj = p[j], vv = new VisibilityVertex(this.V.length, i, j, pj);
                    this.V.push(vv);
                    if (j > 0)
                        this.E.push(new VisibilityEdge(p[j - 1].vv, vv));
                }
                if (p.length > 1)
                    this.E.push(new VisibilityEdge(p[0].vv, p[p.length - 1].vv));
            }
            for (var i = 0; i < n - 1; i++) {
                var Pi = P[i];
                for (var j = i + 1; j < n; j++) {
                    var Pj = P[j], t = tangents(Pi, Pj);
                    for (var q in t) {
                        var c = t[q], source = Pi[c.t1], target = Pj[c.t2];
                        this.addEdgeIfVisible(source, target, i, j);
                    }
                }
            }
        }
        else {
            this.V = g0.V.slice(0);
            this.E = g0.E.slice(0);
        }
    }
    TangentVisibilityGraph.prototype.addEdgeIfVisible = function (u, v, i1, i2) {
        if (!this.intersectsPolys(new LineSegment(u.x, u.y, v.x, v.y), i1, i2)) {
            this.E.push(new VisibilityEdge(u.vv, v.vv));
        }
    };
    TangentVisibilityGraph.prototype.addPoint = function (p, i1) {
        var n = this.P.length;
        this.V.push(new VisibilityVertex(this.V.length, n, 0, p));
        for (var i = 0; i < n; ++i) {
            if (i === i1)
                continue;
            var poly = this.P[i], t = tangent_PointPolyC(p, poly);
            this.addEdgeIfVisible(p, poly[t.ltan], i1, i);
            this.addEdgeIfVisible(p, poly[t.rtan], i1, i);
        }
        return p.vv;
    };
    TangentVisibilityGraph.prototype.intersectsPolys = function (l, i1, i2) {
        for (var i = 0, n = this.P.length; i < n; ++i) {
            if (i != i1 && i != i2 && intersects(l, this.P[i]).length > 0) {
                return true;
            }
        }
        return false;
    };
    return TangentVisibilityGraph;
}());
exports.TangentVisibilityGraph = TangentVisibilityGraph;
function intersects(l, P) {
    var ints = [];
    for (var i = 1, n = P.length; i < n; ++i) {
        var int = rectangle_1.Rectangle.lineIntersection(l.x1, l.y1, l.x2, l.y2, P[i - 1].x, P[i - 1].y, P[i].x, P[i].y);
        if (int)
            ints.push(int);
    }
    return ints;
}
function tangents(V, W) {
    var m = V.length - 1, n = W.length - 1;
    var bt = new BiTangents();
    for (var i = 0; i <= m; ++i) {
        for (var j = 0; j <= n; ++j) {
            var v1 = V[i == 0 ? m : i - 1];
            var v2 = V[i];
            var v3 = V[i == m ? 0 : i + 1];
            var w1 = W[j == 0 ? n : j - 1];
            var w2 = W[j];
            var w3 = W[j == n ? 0 : j + 1];
            var v1v2w2 = isLeft(v1, v2, w2);
            var v2w1w2 = isLeft(v2, w1, w2);
            var v2w2w3 = isLeft(v2, w2, w3);
            var w1w2v2 = isLeft(w1, w2, v2);
            var w2v1v2 = isLeft(w2, v1, v2);
            var w2v2v3 = isLeft(w2, v2, v3);
            if (v1v2w2 >= 0 && v2w1w2 >= 0 && v2w2w3 < 0
                && w1w2v2 >= 0 && w2v1v2 >= 0 && w2v2v3 < 0) {
                bt.ll = new BiTangent(i, j);
            }
            else if (v1v2w2 <= 0 && v2w1w2 <= 0 && v2w2w3 > 0
                && w1w2v2 <= 0 && w2v1v2 <= 0 && w2v2v3 > 0) {
                bt.rr = new BiTangent(i, j);
            }
            else if (v1v2w2 <= 0 && v2w1w2 > 0 && v2w2w3 <= 0
                && w1w2v2 >= 0 && w2v1v2 < 0 && w2v2v3 >= 0) {
                bt.rl = new BiTangent(i, j);
            }
            else if (v1v2w2 >= 0 && v2w1w2 < 0 && v2w2w3 >= 0
                && w1w2v2 <= 0 && w2v1v2 > 0 && w2v2v3 <= 0) {
                bt.lr = new BiTangent(i, j);
            }
        }
    }
    return bt;
}
exports.tangents = tangents;
function isPointInsidePoly(p, poly) {
    for (var i = 1, n = poly.length; i < n; ++i)
        if (below(poly[i - 1], poly[i], p))
            return false;
    return true;
}
function isAnyPInQ(p, q) {
    return !p.every(function (v) { return !isPointInsidePoly(v, q); });
}
function polysOverlap(p, q) {
    if (isAnyPInQ(p, q))
        return true;
    if (isAnyPInQ(q, p))
        return true;
    for (var i = 1, n = p.length; i < n; ++i) {
        var v = p[i], u = p[i - 1];
        if (intersects(new LineSegment(u.x, u.y, v.x, v.y), q).length > 0)
            return true;
    }
    return false;
}
exports.polysOverlap = polysOverlap;

},{"./rectangle":17}],9:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var rectangle_1 = require("./rectangle");
var vpsc_1 = require("./vpsc");
var shortestpaths_1 = require("./shortestpaths");
var NodeWrapper = (function () {
    function NodeWrapper(id, rect, children) {
        this.id = id;
        this.rect = rect;
        this.children = children;
        this.leaf = typeof children === 'undefined' || children.length === 0;
    }
    return NodeWrapper;
}());
exports.NodeWrapper = NodeWrapper;
var Vert = (function () {
    function Vert(id, x, y, node, line) {
        if (node === void 0) { node = null; }
        if (line === void 0) { line = null; }
        this.id = id;
        this.x = x;
        this.y = y;
        this.node = node;
        this.line = line;
    }
    return Vert;
}());
exports.Vert = Vert;
var LongestCommonSubsequence = (function () {
    function LongestCommonSubsequence(s, t) {
        this.s = s;
        this.t = t;
        var mf = LongestCommonSubsequence.findMatch(s, t);
        var tr = t.slice(0).reverse();
        var mr = LongestCommonSubsequence.findMatch(s, tr);
        if (mf.length >= mr.length) {
            this.length = mf.length;
            this.si = mf.si;
            this.ti = mf.ti;
            this.reversed = false;
        }
        else {
            this.length = mr.length;
            this.si = mr.si;
            this.ti = t.length - mr.ti - mr.length;
            this.reversed = true;
        }
    }
    LongestCommonSubsequence.findMatch = function (s, t) {
        var m = s.length;
        var n = t.length;
        var match = { length: 0, si: -1, ti: -1 };
        var l = new Array(m);
        for (var i = 0; i < m; i++) {
            l[i] = new Array(n);
            for (var j = 0; j < n; j++)
                if (s[i] === t[j]) {
                    var v = l[i][j] = (i === 0 || j === 0) ? 1 : l[i - 1][j - 1] + 1;
                    if (v > match.length) {
                        match.length = v;
                        match.si = i - v + 1;
                        match.ti = j - v + 1;
                    }
                    ;
                }
                else
                    l[i][j] = 0;
        }
        return match;
    };
    LongestCommonSubsequence.prototype.getSequence = function () {
        return this.length >= 0 ? this.s.slice(this.si, this.si + this.length) : [];
    };
    return LongestCommonSubsequence;
}());
exports.LongestCommonSubsequence = LongestCommonSubsequence;
var GridRouter = (function () {
    function GridRouter(originalnodes, accessor, groupPadding) {
        var _this = this;
        if (groupPadding === void 0) { groupPadding = 12; }
        this.originalnodes = originalnodes;
        this.groupPadding = groupPadding;
        this.leaves = null;
        this.nodes = originalnodes.map(function (v, i) { return new NodeWrapper(i, accessor.getBounds(v), accessor.getChildren(v)); });
        this.leaves = this.nodes.filter(function (v) { return v.leaf; });
        this.groups = this.nodes.filter(function (g) { return !g.leaf; });
        this.cols = this.getGridLines('x');
        this.rows = this.getGridLines('y');
        this.groups.forEach(function (v) {
            return v.children.forEach(function (c) { return _this.nodes[c].parent = v; });
        });
        this.root = { children: [] };
        this.nodes.forEach(function (v) {
            if (typeof v.parent === 'undefined') {
                v.parent = _this.root;
                _this.root.children.push(v.id);
            }
            v.ports = [];
        });
        this.backToFront = this.nodes.slice(0);
        this.backToFront.sort(function (x, y) { return _this.getDepth(x) - _this.getDepth(y); });
        var frontToBackGroups = this.backToFront.slice(0).reverse().filter(function (g) { return !g.leaf; });
        frontToBackGroups.forEach(function (v) {
            var r = rectangle_1.Rectangle.empty();
            v.children.forEach(function (c) { return r = r.union(_this.nodes[c].rect); });
            v.rect = r.inflate(_this.groupPadding);
        });
        var colMids = this.midPoints(this.cols.map(function (r) { return r.pos; }));
        var rowMids = this.midPoints(this.rows.map(function (r) { return r.pos; }));
        var rowx = colMids[0], rowX = colMids[colMids.length - 1];
        var coly = rowMids[0], colY = rowMids[rowMids.length - 1];
        var hlines = this.rows.map(function (r) { return ({ x1: rowx, x2: rowX, y1: r.pos, y2: r.pos }); })
            .concat(rowMids.map(function (m) { return ({ x1: rowx, x2: rowX, y1: m, y2: m }); }));
        var vlines = this.cols.map(function (c) { return ({ x1: c.pos, x2: c.pos, y1: coly, y2: colY }); })
            .concat(colMids.map(function (m) { return ({ x1: m, x2: m, y1: coly, y2: colY }); }));
        var lines = hlines.concat(vlines);
        lines.forEach(function (l) { return l.verts = []; });
        this.verts = [];
        this.edges = [];
        hlines.forEach(function (h) {
            return vlines.forEach(function (v) {
                var p = new Vert(_this.verts.length, v.x1, h.y1);
                h.verts.push(p);
                v.verts.push(p);
                _this.verts.push(p);
                var i = _this.backToFront.length;
                while (i-- > 0) {
                    var node = _this.backToFront[i], r = node.rect;
                    var dx = Math.abs(p.x - r.cx()), dy = Math.abs(p.y - r.cy());
                    if (dx < r.width() / 2 && dy < r.height() / 2) {
                        p.node = node;
                        break;
                    }
                }
            });
        });
        lines.forEach(function (l, li) {
            _this.nodes.forEach(function (v, i) {
                v.rect.lineIntersections(l.x1, l.y1, l.x2, l.y2).forEach(function (intersect, j) {
                    var p = new Vert(_this.verts.length, intersect.x, intersect.y, v, l);
                    _this.verts.push(p);
                    l.verts.push(p);
                    v.ports.push(p);
                });
            });
            var isHoriz = Math.abs(l.y1 - l.y2) < 0.1;
            var delta = function (a, b) { return isHoriz ? b.x - a.x : b.y - a.y; };
            l.verts.sort(delta);
            for (var i = 1; i < l.verts.length; i++) {
                var u = l.verts[i - 1], v = l.verts[i];
                if (u.node && u.node === v.node && u.node.leaf)
                    continue;
                _this.edges.push({ source: u.id, target: v.id, length: Math.abs(delta(u, v)) });
            }
        });
    }
    GridRouter.prototype.avg = function (a) { return a.reduce(function (x, y) { return x + y; }) / a.length; };
    GridRouter.prototype.getGridLines = function (axis) {
        var columns = [];
        var ls = this.leaves.slice(0, this.leaves.length);
        while (ls.length > 0) {
            var overlapping = ls.filter(function (v) { return v.rect['overlap' + axis.toUpperCase()](ls[0].rect); });
            var col = {
                nodes: overlapping,
                pos: this.avg(overlapping.map(function (v) { return v.rect['c' + axis](); }))
            };
            columns.push(col);
            col.nodes.forEach(function (v) { return ls.splice(ls.indexOf(v), 1); });
        }
        columns.sort(function (a, b) { return a.pos - b.pos; });
        return columns;
    };
    GridRouter.prototype.getDepth = function (v) {
        var depth = 0;
        while (v.parent !== this.root) {
            depth++;
            v = v.parent;
        }
        return depth;
    };
    GridRouter.prototype.midPoints = function (a) {
        var gap = a[1] - a[0];
        var mids = [a[0] - gap / 2];
        for (var i = 1; i < a.length; i++) {
            mids.push((a[i] + a[i - 1]) / 2);
        }
        mids.push(a[a.length - 1] + gap / 2);
        return mids;
    };
    GridRouter.prototype.findLineage = function (v) {
        var lineage = [v];
        do {
            v = v.parent;
            lineage.push(v);
        } while (v !== this.root);
        return lineage.reverse();
    };
    GridRouter.prototype.findAncestorPathBetween = function (a, b) {
        var aa = this.findLineage(a), ba = this.findLineage(b), i = 0;
        while (aa[i] === ba[i])
            i++;
        return { commonAncestor: aa[i - 1], lineages: aa.slice(i).concat(ba.slice(i)) };
    };
    GridRouter.prototype.siblingObstacles = function (a, b) {
        var _this = this;
        var path = this.findAncestorPathBetween(a, b);
        var lineageLookup = {};
        path.lineages.forEach(function (v) { return lineageLookup[v.id] = {}; });
        var obstacles = path.commonAncestor.children.filter(function (v) { return !(v in lineageLookup); });
        path.lineages
            .filter(function (v) { return v.parent !== path.commonAncestor; })
            .forEach(function (v) { return obstacles = obstacles.concat(v.parent.children.filter(function (c) { return c !== v.id; })); });
        return obstacles.map(function (v) { return _this.nodes[v]; });
    };
    GridRouter.getSegmentSets = function (routes, x, y) {
        var vsegments = [];
        for (var ei = 0; ei < routes.length; ei++) {
            var route = routes[ei];
            for (var si = 0; si < route.length; si++) {
                var s = route[si];
                s.edgeid = ei;
                s.i = si;
                var sdx = s[1][x] - s[0][x];
                if (Math.abs(sdx) < 0.1) {
                    vsegments.push(s);
                }
            }
        }
        vsegments.sort(function (a, b) { return a[0][x] - b[0][x]; });
        var vsegmentsets = [];
        var segmentset = null;
        for (var i = 0; i < vsegments.length; i++) {
            var s = vsegments[i];
            if (!segmentset || Math.abs(s[0][x] - segmentset.pos) > 0.1) {
                segmentset = { pos: s[0][x], segments: [] };
                vsegmentsets.push(segmentset);
            }
            segmentset.segments.push(s);
        }
        return vsegmentsets;
    };
    GridRouter.nudgeSegs = function (x, y, routes, segments, leftOf, gap) {
        var n = segments.length;
        if (n <= 1)
            return;
        var vs = segments.map(function (s) { return new vpsc_1.Variable(s[0][x]); });
        var cs = [];
        for (var i = 0; i < n; i++) {
            for (var j = 0; j < n; j++) {
                if (i === j)
                    continue;
                var s1 = segments[i], s2 = segments[j], e1 = s1.edgeid, e2 = s2.edgeid, lind = -1, rind = -1;
                if (x == 'x') {
                    if (leftOf(e1, e2)) {
                        if (s1[0][y] < s1[1][y]) {
                            lind = j, rind = i;
                        }
                        else {
                            lind = i, rind = j;
                        }
                    }
                }
                else {
                    if (leftOf(e1, e2)) {
                        if (s1[0][y] < s1[1][y]) {
                            lind = i, rind = j;
                        }
                        else {
                            lind = j, rind = i;
                        }
                    }
                }
                if (lind >= 0) {
                    cs.push(new vpsc_1.Constraint(vs[lind], vs[rind], gap));
                }
            }
        }
        var solver = new vpsc_1.Solver(vs, cs);
        solver.solve();
        vs.forEach(function (v, i) {
            var s = segments[i];
            var pos = v.position();
            s[0][x] = s[1][x] = pos;
            var route = routes[s.edgeid];
            if (s.i > 0)
                route[s.i - 1][1][x] = pos;
            if (s.i < route.length - 1)
                route[s.i + 1][0][x] = pos;
        });
    };
    GridRouter.nudgeSegments = function (routes, x, y, leftOf, gap) {
        var vsegmentsets = GridRouter.getSegmentSets(routes, x, y);
        for (var i = 0; i < vsegmentsets.length; i++) {
            var ss = vsegmentsets[i];
            var events = [];
            for (var j = 0; j < ss.segments.length; j++) {
                var s = ss.segments[j];
                events.push({ type: 0, s: s, pos: Math.min(s[0][y], s[1][y]) });
                events.push({ type: 1, s: s, pos: Math.max(s[0][y], s[1][y]) });
            }
            events.sort(function (a, b) { return a.pos - b.pos + a.type - b.type; });
            var open = [];
            var openCount = 0;
            events.forEach(function (e) {
                if (e.type === 0) {
                    open.push(e.s);
                    openCount++;
                }
                else {
                    openCount--;
                }
                if (openCount == 0) {
                    GridRouter.nudgeSegs(x, y, routes, open, leftOf, gap);
                    open = [];
                }
            });
        }
    };
    GridRouter.prototype.routeEdges = function (edges, nudgeGap, source, target) {
        var _this = this;
        var routePaths = edges.map(function (e) { return _this.route(source(e), target(e)); });
        var order = GridRouter.orderEdges(routePaths);
        var routes = routePaths.map(function (e) { return GridRouter.makeSegments(e); });
        GridRouter.nudgeSegments(routes, 'x', 'y', order, nudgeGap);
        GridRouter.nudgeSegments(routes, 'y', 'x', order, nudgeGap);
        GridRouter.unreverseEdges(routes, routePaths);
        return routes;
    };
    GridRouter.unreverseEdges = function (routes, routePaths) {
        routes.forEach(function (segments, i) {
            var path = routePaths[i];
            if (path.reversed) {
                segments.reverse();
                segments.forEach(function (segment) {
                    segment.reverse();
                });
            }
        });
    };
    GridRouter.angleBetween2Lines = function (line1, line2) {
        var angle1 = Math.atan2(line1[0].y - line1[1].y, line1[0].x - line1[1].x);
        var angle2 = Math.atan2(line2[0].y - line2[1].y, line2[0].x - line2[1].x);
        var diff = angle1 - angle2;
        if (diff > Math.PI || diff < -Math.PI) {
            diff = angle2 - angle1;
        }
        return diff;
    };
    GridRouter.isLeft = function (a, b, c) {
        return ((b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x)) <= 0;
    };
    GridRouter.getOrder = function (pairs) {
        var outgoing = {};
        for (var i = 0; i < pairs.length; i++) {
            var p = pairs[i];
            if (typeof outgoing[p.l] === 'undefined')
                outgoing[p.l] = {};
            outgoing[p.l][p.r] = true;
        }
        return function (l, r) { return typeof outgoing[l] !== 'undefined' && outgoing[l][r]; };
    };
    GridRouter.orderEdges = function (edges) {
        var edgeOrder = [];
        for (var i = 0; i < edges.length - 1; i++) {
            for (var j = i + 1; j < edges.length; j++) {
                var e = edges[i], f = edges[j], lcs = new LongestCommonSubsequence(e, f);
                var u, vi, vj;
                if (lcs.length === 0)
                    continue;
                if (lcs.reversed) {
                    f.reverse();
                    f.reversed = true;
                    lcs = new LongestCommonSubsequence(e, f);
                }
                if ((lcs.si <= 0 || lcs.ti <= 0) &&
                    (lcs.si + lcs.length >= e.length || lcs.ti + lcs.length >= f.length)) {
                    edgeOrder.push({ l: i, r: j });
                    continue;
                }
                if (lcs.si + lcs.length >= e.length || lcs.ti + lcs.length >= f.length) {
                    u = e[lcs.si + 1];
                    vj = e[lcs.si - 1];
                    vi = f[lcs.ti - 1];
                }
                else {
                    u = e[lcs.si + lcs.length - 2];
                    vi = e[lcs.si + lcs.length];
                    vj = f[lcs.ti + lcs.length];
                }
                if (GridRouter.isLeft(u, vi, vj)) {
                    edgeOrder.push({ l: j, r: i });
                }
                else {
                    edgeOrder.push({ l: i, r: j });
                }
            }
        }
        return GridRouter.getOrder(edgeOrder);
    };
    GridRouter.makeSegments = function (path) {
        function copyPoint(p) {
            return { x: p.x, y: p.y };
        }
        var isStraight = function (a, b, c) { return Math.abs((b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x)) < 0.001; };
        var segments = [];
        var a = copyPoint(path[0]);
        for (var i = 1; i < path.length; i++) {
            var b = copyPoint(path[i]), c = i < path.length - 1 ? path[i + 1] : null;
            if (!c || !isStraight(a, b, c)) {
                segments.push([a, b]);
                a = b;
            }
        }
        return segments;
    };
    GridRouter.prototype.route = function (s, t) {
        var _this = this;
        var source = this.nodes[s], target = this.nodes[t];
        this.obstacles = this.siblingObstacles(source, target);
        var obstacleLookup = {};
        this.obstacles.forEach(function (o) { return obstacleLookup[o.id] = o; });
        this.passableEdges = this.edges.filter(function (e) {
            var u = _this.verts[e.source], v = _this.verts[e.target];
            return !(u.node && u.node.id in obstacleLookup
                || v.node && v.node.id in obstacleLookup);
        });
        for (var i = 1; i < source.ports.length; i++) {
            var u = source.ports[0].id;
            var v = source.ports[i].id;
            this.passableEdges.push({
                source: u,
                target: v,
                length: 0
            });
        }
        for (var i = 1; i < target.ports.length; i++) {
            var u = target.ports[0].id;
            var v = target.ports[i].id;
            this.passableEdges.push({
                source: u,
                target: v,
                length: 0
            });
        }
        var getSource = function (e) { return e.source; }, getTarget = function (e) { return e.target; }, getLength = function (e) { return e.length; };
        var shortestPathCalculator = new shortestpaths_1.Calculator(this.verts.length, this.passableEdges, getSource, getTarget, getLength);
        var bendPenalty = function (u, v, w) {
            var a = _this.verts[u], b = _this.verts[v], c = _this.verts[w];
            var dx = Math.abs(c.x - a.x), dy = Math.abs(c.y - a.y);
            if (a.node === source && a.node === b.node || b.node === target && b.node === c.node)
                return 0;
            return dx > 1 && dy > 1 ? 1000 : 0;
        };
        var shortestPath = shortestPathCalculator.PathFromNodeToNodeWithPrevCost(source.ports[0].id, target.ports[0].id, bendPenalty);
        var pathPoints = shortestPath.reverse().map(function (vi) { return _this.verts[vi]; });
        pathPoints.push(this.nodes[target.id].ports[0]);
        return pathPoints.filter(function (v, i) {
            return !(i < pathPoints.length - 1 && pathPoints[i + 1].node === source && v.node === source
                || i > 0 && v.node === target && pathPoints[i - 1].node === target);
        });
    };
    GridRouter.getRoutePath = function (route, cornerradius, arrowwidth, arrowheight) {
        var result = {
            routepath: 'M ' + route[0][0].x + ' ' + route[0][0].y + ' ',
            arrowpath: ''
        };
        if (route.length > 1) {
            for (var i = 0; i < route.length; i++) {
                var li = route[i];
                var x = li[1].x, y = li[1].y;
                var dx = x - li[0].x;
                var dy = y - li[0].y;
                if (i < route.length - 1) {
                    if (Math.abs(dx) > 0) {
                        x -= dx / Math.abs(dx) * cornerradius;
                    }
                    else {
                        y -= dy / Math.abs(dy) * cornerradius;
                    }
                    result.routepath += 'L ' + x + ' ' + y + ' ';
                    var l = route[i + 1];
                    var x0 = l[0].x, y0 = l[0].y;
                    var x1 = l[1].x;
                    var y1 = l[1].y;
                    dx = x1 - x0;
                    dy = y1 - y0;
                    var angle = GridRouter.angleBetween2Lines(li, l) < 0 ? 1 : 0;
                    var x2, y2;
                    if (Math.abs(dx) > 0) {
                        x2 = x0 + dx / Math.abs(dx) * cornerradius;
                        y2 = y0;
                    }
                    else {
                        x2 = x0;
                        y2 = y0 + dy / Math.abs(dy) * cornerradius;
                    }
                    var cx = Math.abs(x2 - x);
                    var cy = Math.abs(y2 - y);
                    result.routepath += 'A ' + cx + ' ' + cy + ' 0 0 ' + angle + ' ' + x2 + ' ' + y2 + ' ';
                }
                else {
                    var arrowtip = [x, y];
                    var arrowcorner1, arrowcorner2;
                    if (Math.abs(dx) > 0) {
                        x -= dx / Math.abs(dx) * arrowheight;
                        arrowcorner1 = [x, y + arrowwidth];
                        arrowcorner2 = [x, y - arrowwidth];
                    }
                    else {
                        y -= dy / Math.abs(dy) * arrowheight;
                        arrowcorner1 = [x + arrowwidth, y];
                        arrowcorner2 = [x - arrowwidth, y];
                    }
                    result.routepath += 'L ' + x + ' ' + y + ' ';
                    if (arrowheight > 0) {
                        result.arrowpath = 'M ' + arrowtip[0] + ' ' + arrowtip[1] + ' L ' + arrowcorner1[0] + ' ' + arrowcorner1[1]
                            + ' L ' + arrowcorner2[0] + ' ' + arrowcorner2[1];
                    }
                }
            }
        }
        else {
            var li = route[0];
            var x = li[1].x, y = li[1].y;
            var dx = x - li[0].x;
            var dy = y - li[0].y;
            var arrowtip = [x, y];
            var arrowcorner1, arrowcorner2;
            if (Math.abs(dx) > 0) {
                x -= dx / Math.abs(dx) * arrowheight;
                arrowcorner1 = [x, y + arrowwidth];
                arrowcorner2 = [x, y - arrowwidth];
            }
            else {
                y -= dy / Math.abs(dy) * arrowheight;
                arrowcorner1 = [x + arrowwidth, y];
                arrowcorner2 = [x - arrowwidth, y];
            }
            result.routepath += 'L ' + x + ' ' + y + ' ';
            if (arrowheight > 0) {
                result.arrowpath = 'M ' + arrowtip[0] + ' ' + arrowtip[1] + ' L ' + arrowcorner1[0] + ' ' + arrowcorner1[1]
                    + ' L ' + arrowcorner2[0] + ' ' + arrowcorner2[1];
            }
        }
        return result;
    };
    return GridRouter;
}());
exports.GridRouter = GridRouter;

},{"./rectangle":17,"./shortestpaths":18,"./vpsc":19}],10:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var packingOptions = {
    PADDING: 10,
    GOLDEN_SECTION: (1 + Math.sqrt(5)) / 2,
    FLOAT_EPSILON: 0.0001,
    MAX_INERATIONS: 100
};
function applyPacking(graphs, w, h, node_size, desired_ratio, centerGraph) {
    if (desired_ratio === void 0) { desired_ratio = 1; }
    if (centerGraph === void 0) { centerGraph = true; }
    var init_x = 0, init_y = 0, svg_width = w, svg_height = h, desired_ratio = typeof desired_ratio !== 'undefined' ? desired_ratio : 1, node_size = typeof node_size !== 'undefined' ? node_size : 0, real_width = 0, real_height = 0, min_width = 0, global_bottom = 0, line = [];
    if (graphs.length == 0)
        return;
    calculate_bb(graphs);
    apply(graphs, desired_ratio);
    if (centerGraph) {
        put_nodes_to_right_positions(graphs);
    }
    function calculate_bb(graphs) {
        graphs.forEach(function (g) {
            calculate_single_bb(g);
        });
        function calculate_single_bb(graph) {
            var min_x = Number.MAX_VALUE, min_y = Number.MAX_VALUE, max_x = 0, max_y = 0;
            graph.array.forEach(function (v) {
                var w = typeof v.width !== 'undefined' ? v.width : node_size;
                var h = typeof v.height !== 'undefined' ? v.height : node_size;
                w /= 2;
                h /= 2;
                max_x = Math.max(v.x + w, max_x);
                min_x = Math.min(v.x - w, min_x);
                max_y = Math.max(v.y + h, max_y);
                min_y = Math.min(v.y - h, min_y);
            });
            graph.width = max_x - min_x;
            graph.height = max_y - min_y;
        }
    }
    function put_nodes_to_right_positions(graphs) {
        graphs.forEach(function (g) {
            var center = { x: 0, y: 0 };
            g.array.forEach(function (node) {
                center.x += node.x;
                center.y += node.y;
            });
            center.x /= g.array.length;
            center.y /= g.array.length;
            var corner = { x: center.x - g.width / 2, y: center.y - g.height / 2 };
            var offset = { x: g.x - corner.x + svg_width / 2 - real_width / 2, y: g.y - corner.y + svg_height / 2 - real_height / 2 };
            g.array.forEach(function (node) {
                node.x += offset.x;
                node.y += offset.y;
            });
        });
    }
    function apply(data, desired_ratio) {
        var curr_best_f = Number.POSITIVE_INFINITY;
        var curr_best = 0;
        data.sort(function (a, b) { return b.height - a.height; });
        min_width = data.reduce(function (a, b) {
            return a.width < b.width ? a.width : b.width;
        });
        var left = x1 = min_width;
        var right = x2 = get_entire_width(data);
        var iterationCounter = 0;
        var f_x1 = Number.MAX_VALUE;
        var f_x2 = Number.MAX_VALUE;
        var flag = -1;
        var dx = Number.MAX_VALUE;
        var df = Number.MAX_VALUE;
        while ((dx > min_width) || df > packingOptions.FLOAT_EPSILON) {
            if (flag != 1) {
                var x1 = right - (right - left) / packingOptions.GOLDEN_SECTION;
                var f_x1 = step(data, x1);
            }
            if (flag != 0) {
                var x2 = left + (right - left) / packingOptions.GOLDEN_SECTION;
                var f_x2 = step(data, x2);
            }
            dx = Math.abs(x1 - x2);
            df = Math.abs(f_x1 - f_x2);
            if (f_x1 < curr_best_f) {
                curr_best_f = f_x1;
                curr_best = x1;
            }
            if (f_x2 < curr_best_f) {
                curr_best_f = f_x2;
                curr_best = x2;
            }
            if (f_x1 > f_x2) {
                left = x1;
                x1 = x2;
                f_x1 = f_x2;
                flag = 1;
            }
            else {
                right = x2;
                x2 = x1;
                f_x2 = f_x1;
                flag = 0;
            }
            if (iterationCounter++ > 100) {
                break;
            }
        }
        step(data, curr_best);
    }
    function step(data, max_width) {
        line = [];
        real_width = 0;
        real_height = 0;
        global_bottom = init_y;
        for (var i = 0; i < data.length; i++) {
            var o = data[i];
            put_rect(o, max_width);
        }
        return Math.abs(get_real_ratio() - desired_ratio);
    }
    function put_rect(rect, max_width) {
        var parent = undefined;
        for (var i = 0; i < line.length; i++) {
            if ((line[i].space_left >= rect.height) && (line[i].x + line[i].width + rect.width + packingOptions.PADDING - max_width) <= packingOptions.FLOAT_EPSILON) {
                parent = line[i];
                break;
            }
        }
        line.push(rect);
        if (parent !== undefined) {
            rect.x = parent.x + parent.width + packingOptions.PADDING;
            rect.y = parent.bottom;
            rect.space_left = rect.height;
            rect.bottom = rect.y;
            parent.space_left -= rect.height + packingOptions.PADDING;
            parent.bottom += rect.height + packingOptions.PADDING;
        }
        else {
            rect.y = global_bottom;
            global_bottom += rect.height + packingOptions.PADDING;
            rect.x = init_x;
            rect.bottom = rect.y;
            rect.space_left = rect.height;
        }
        if (rect.y + rect.height - real_height > -packingOptions.FLOAT_EPSILON)
            real_height = rect.y + rect.height - init_y;
        if (rect.x + rect.width - real_width > -packingOptions.FLOAT_EPSILON)
            real_width = rect.x + rect.width - init_x;
    }
    ;
    function get_entire_width(data) {
        var width = 0;
        data.forEach(function (d) { return width += d.width + packingOptions.PADDING; });
        return width;
    }
    function get_real_ratio() {
        return (real_width / real_height);
    }
}
exports.applyPacking = applyPacking;
function separateGraphs(nodes, links) {
    var marks = {};
    var ways = {};
    var graphs = [];
    var clusters = 0;
    for (var i = 0; i < links.length; i++) {
        var link = links[i];
        var n1 = link.source;
        var n2 = link.target;
        if (ways[n1.index])
            ways[n1.index].push(n2);
        else
            ways[n1.index] = [n2];
        if (ways[n2.index])
            ways[n2.index].push(n1);
        else
            ways[n2.index] = [n1];
    }
    for (var i = 0; i < nodes.length; i++) {
        var node = nodes[i];
        if (marks[node.index])
            continue;
        explore_node(node, true);
    }
    function explore_node(n, is_new) {
        if (marks[n.index] !== undefined)
            return;
        if (is_new) {
            clusters++;
            graphs.push({ array: [] });
        }
        marks[n.index] = clusters;
        graphs[clusters - 1].array.push(n);
        var adjacent = ways[n.index];
        if (!adjacent)
            return;
        for (var j = 0; j < adjacent.length; j++) {
            explore_node(adjacent[j], false);
        }
    }
    return graphs;
}
exports.separateGraphs = separateGraphs;

},{}],11:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var powergraph = require("./powergraph");
var linklengths_1 = require("./linklengths");
var descent_1 = require("./descent");
var rectangle_1 = require("./rectangle");
var shortestpaths_1 = require("./shortestpaths");
var geom_1 = require("./geom");
var handledisconnected_1 = require("./handledisconnected");
var EventType;
(function (EventType) {
    EventType[EventType["start"] = 0] = "start";
    EventType[EventType["tick"] = 1] = "tick";
    EventType[EventType["end"] = 2] = "end";
})(EventType = exports.EventType || (exports.EventType = {}));
;
function isGroup(g) {
    return typeof g.leaves !== 'undefined' || typeof g.groups !== 'undefined';
}
var Layout = (function () {
    function Layout() {
        var _this = this;
        this._canvasSize = [1, 1];
        this._linkDistance = 20;
        this._defaultNodeSize = 10;
        this._linkLengthCalculator = null;
        this._linkType = null;
        this._avoidOverlaps = false;
        this._handleDisconnected = true;
        this._running = false;
        this._nodes = [];
        this._groups = [];
        this._rootGroup = null;
        this._links = [];
        this._constraints = [];
        this._distanceMatrix = null;
        this._descent = null;
        this._directedLinkConstraints = null;
        this._threshold = 0.01;
        this._visibilityGraph = null;
        this._groupCompactness = 1e-6;
        this.event = null;
        this.linkAccessor = {
            getSourceIndex: Layout.getSourceIndex,
            getTargetIndex: Layout.getTargetIndex,
            setLength: Layout.setLinkLength,
            getType: function (l) { return typeof _this._linkType === "function" ? _this._linkType(l) : 0; }
        };
    }
    Layout.prototype.on = function (e, listener) {
        if (!this.event)
            this.event = {};
        if (typeof e === 'string') {
            this.event[EventType[e]] = listener;
        }
        else {
            this.event[e] = listener;
        }
        return this;
    };
    Layout.prototype.trigger = function (e) {
        if (this.event && typeof this.event[e.type] !== 'undefined') {
            this.event[e.type](e);
        }
    };
    Layout.prototype.kick = function () {
        while (!this.tick())
            ;
    };
    Layout.prototype.tick = function () {
        if (this._alpha < this._threshold) {
            this._running = false;
            this.trigger({ type: EventType.end, alpha: this._alpha = 0, stress: this._lastStress });
            return true;
        }
        var n = this._nodes.length, m = this._links.length;
        var o, i;
        this._descent.locks.clear();
        for (i = 0; i < n; ++i) {
            o = this._nodes[i];
            if (o.fixed) {
                if (typeof o.px === 'undefined' || typeof o.py === 'undefined') {
                    o.px = o.x;
                    o.py = o.y;
                }
                var p = [o.px, o.py];
                this._descent.locks.add(i, p);
            }
        }
        var s1 = this._descent.rungeKutta();
        if (s1 === 0) {
            this._alpha = 0;
        }
        else if (typeof this._lastStress !== 'undefined') {
            this._alpha = s1;
        }
        this._lastStress = s1;
        this.updateNodePositions();
        this.trigger({ type: EventType.tick, alpha: this._alpha, stress: this._lastStress });
        return false;
    };
    Layout.prototype.updateNodePositions = function () {
        var x = this._descent.x[0], y = this._descent.x[1];
        var o, i = this._nodes.length;
        while (i--) {
            o = this._nodes[i];
            o.x = x[i];
            o.y = y[i];
        }
    };
    Layout.prototype.nodes = function (v) {
        if (!v) {
            if (this._nodes.length === 0 && this._links.length > 0) {
                var n = 0;
                this._links.forEach(function (l) {
                    n = Math.max(n, l.source, l.target);
                });
                this._nodes = new Array(++n);
                for (var i = 0; i < n; ++i) {
                    this._nodes[i] = {};
                }
            }
            return this._nodes;
        }
        this._nodes = v;
        return this;
    };
    Layout.prototype.groups = function (x) {
        var _this = this;
        if (!x)
            return this._groups;
        this._groups = x;
        this._rootGroup = {};
        this._groups.forEach(function (g) {
            if (typeof g.padding === "undefined")
                g.padding = 1;
            if (typeof g.leaves !== "undefined") {
                g.leaves.forEach(function (v, i) {
                    if (typeof v === 'number')
                        (g.leaves[i] = _this._nodes[v]).parent = g;
                });
            }
            if (typeof g.groups !== "undefined") {
                g.groups.forEach(function (gi, i) {
                    if (typeof gi === 'number')
                        (g.groups[i] = _this._groups[gi]).parent = g;
                });
            }
        });
        this._rootGroup.leaves = this._nodes.filter(function (v) { return typeof v.parent === 'undefined'; });
        this._rootGroup.groups = this._groups.filter(function (g) { return typeof g.parent === 'undefined'; });
        return this;
    };
    Layout.prototype.powerGraphGroups = function (f) {
        var g = powergraph.getGroups(this._nodes, this._links, this.linkAccessor, this._rootGroup);
        this.groups(g.groups);
        f(g);
        return this;
    };
    Layout.prototype.avoidOverlaps = function (v) {
        if (!arguments.length)
            return this._avoidOverlaps;
        this._avoidOverlaps = v;
        return this;
    };
    Layout.prototype.handleDisconnected = function (v) {
        if (!arguments.length)
            return this._handleDisconnected;
        this._handleDisconnected = v;
        return this;
    };
    Layout.prototype.flowLayout = function (axis, minSeparation) {
        if (!arguments.length)
            axis = 'y';
        this._directedLinkConstraints = {
            axis: axis,
            getMinSeparation: typeof minSeparation === 'number' ? function () { return minSeparation; } : minSeparation
        };
        return this;
    };
    Layout.prototype.links = function (x) {
        if (!arguments.length)
            return this._links;
        this._links = x;
        return this;
    };
    Layout.prototype.constraints = function (c) {
        if (!arguments.length)
            return this._constraints;
        this._constraints = c;
        return this;
    };
    Layout.prototype.distanceMatrix = function (d) {
        if (!arguments.length)
            return this._distanceMatrix;
        this._distanceMatrix = d;
        return this;
    };
    Layout.prototype.size = function (x) {
        if (!x)
            return this._canvasSize;
        this._canvasSize = x;
        return this;
    };
    Layout.prototype.defaultNodeSize = function (x) {
        if (!x)
            return this._defaultNodeSize;
        this._defaultNodeSize = x;
        return this;
    };
    Layout.prototype.groupCompactness = function (x) {
        if (!x)
            return this._groupCompactness;
        this._groupCompactness = x;
        return this;
    };
    Layout.prototype.linkDistance = function (x) {
        if (!x) {
            return this._linkDistance;
        }
        this._linkDistance = typeof x === "function" ? x : +x;
        this._linkLengthCalculator = null;
        return this;
    };
    Layout.prototype.linkType = function (f) {
        this._linkType = f;
        return this;
    };
    Layout.prototype.convergenceThreshold = function (x) {
        if (!x)
            return this._threshold;
        this._threshold = typeof x === "function" ? x : +x;
        return this;
    };
    Layout.prototype.alpha = function (x) {
        if (!arguments.length)
            return this._alpha;
        else {
            x = +x;
            if (this._alpha) {
                if (x > 0)
                    this._alpha = x;
                else
                    this._alpha = 0;
            }
            else if (x > 0) {
                if (!this._running) {
                    this._running = true;
                    this.trigger({ type: EventType.start, alpha: this._alpha = x });
                    this.kick();
                }
            }
            return this;
        }
    };
    Layout.prototype.getLinkLength = function (link) {
        return typeof this._linkDistance === "function" ? +(this._linkDistance(link)) : this._linkDistance;
    };
    Layout.setLinkLength = function (link, length) {
        link.length = length;
    };
    Layout.prototype.getLinkType = function (link) {
        return typeof this._linkType === "function" ? this._linkType(link) : 0;
    };
    Layout.prototype.symmetricDiffLinkLengths = function (idealLength, w) {
        var _this = this;
        if (w === void 0) { w = 1; }
        this.linkDistance(function (l) { return idealLength * l.length; });
        this._linkLengthCalculator = function () { return linklengths_1.symmetricDiffLinkLengths(_this._links, _this.linkAccessor, w); };
        return this;
    };
    Layout.prototype.jaccardLinkLengths = function (idealLength, w) {
        var _this = this;
        if (w === void 0) { w = 1; }
        this.linkDistance(function (l) { return idealLength * l.length; });
        this._linkLengthCalculator = function () { return linklengths_1.jaccardLinkLengths(_this._links, _this.linkAccessor, w); };
        return this;
    };
    Layout.prototype.start = function (initialUnconstrainedIterations, initialUserConstraintIterations, initialAllConstraintsIterations, gridSnapIterations, keepRunning, centerGraph) {
        var _this = this;
        if (initialUnconstrainedIterations === void 0) { initialUnconstrainedIterations = 0; }
        if (initialUserConstraintIterations === void 0) { initialUserConstraintIterations = 0; }
        if (initialAllConstraintsIterations === void 0) { initialAllConstraintsIterations = 0; }
        if (gridSnapIterations === void 0) { gridSnapIterations = 0; }
        if (keepRunning === void 0) { keepRunning = true; }
        if (centerGraph === void 0) { centerGraph = true; }
        var i, j, n = this.nodes().length, N = n + 2 * this._groups.length, m = this._links.length, w = this._canvasSize[0], h = this._canvasSize[1];
        var x = new Array(N), y = new Array(N);
        var G = null;
        var ao = this._avoidOverlaps;
        this._nodes.forEach(function (v, i) {
            v.index = i;
            if (typeof v.x === 'undefined') {
                v.x = w / 2, v.y = h / 2;
            }
            x[i] = v.x, y[i] = v.y;
        });
        if (this._linkLengthCalculator)
            this._linkLengthCalculator();
        var distances;
        if (this._distanceMatrix) {
            distances = this._distanceMatrix;
        }
        else {
            distances = (new shortestpaths_1.Calculator(N, this._links, Layout.getSourceIndex, Layout.getTargetIndex, function (l) { return _this.getLinkLength(l); })).DistanceMatrix();
            G = descent_1.Descent.createSquareMatrix(N, function () { return 2; });
            this._links.forEach(function (l) {
                if (typeof l.source == "number")
                    l.source = _this._nodes[l.source];
                if (typeof l.target == "number")
                    l.target = _this._nodes[l.target];
            });
            this._links.forEach(function (e) {
                var u = Layout.getSourceIndex(e), v = Layout.getTargetIndex(e);
                G[u][v] = G[v][u] = e.weight || 1;
            });
        }
        var D = descent_1.Descent.createSquareMatrix(N, function (i, j) {
            return distances[i][j];
        });
        if (this._rootGroup && typeof this._rootGroup.groups !== 'undefined') {
            var i = n;
            var addAttraction = function (i, j, strength, idealDistance) {
                G[i][j] = G[j][i] = strength;
                D[i][j] = D[j][i] = idealDistance;
            };
            this._groups.forEach(function (g) {
                addAttraction(i, i + 1, _this._groupCompactness, 0.1);
                if (typeof g.bounds === 'undefined') {
                    x[i] = w / 2, y[i++] = h / 2;
                    x[i] = w / 2, y[i++] = h / 2;
                }
                else {
                    x[i] = g.bounds.x, y[i++] = g.bounds.y;
                    x[i] = g.bounds.X, y[i++] = g.bounds.Y;
                }
            });
        }
        else
            this._rootGroup = { leaves: this._nodes, groups: [] };
        var curConstraints = this._constraints || [];
        if (this._directedLinkConstraints) {
            this.linkAccessor.getMinSeparation = this._directedLinkConstraints.getMinSeparation;
            curConstraints = curConstraints.concat(linklengths_1.generateDirectedEdgeConstraints(n, this._links, this._directedLinkConstraints.axis, (this.linkAccessor)));
        }
        this.avoidOverlaps(false);
        this._descent = new descent_1.Descent([x, y], D);
        this._descent.locks.clear();
        for (var i = 0; i < n; ++i) {
            var o = this._nodes[i];
            if (o.fixed) {
                o.px = o.x;
                o.py = o.y;
                var p = [o.x, o.y];
                this._descent.locks.add(i, p);
            }
        }
        this._descent.threshold = this._threshold;
        this.initialLayout(initialUnconstrainedIterations, x, y);
        if (curConstraints.length > 0)
            this._descent.project = new rectangle_1.Projection(this._nodes, this._groups, this._rootGroup, curConstraints).projectFunctions();
        this._descent.run(initialUserConstraintIterations);
        this.separateOverlappingComponents(w, h, centerGraph);
        this.avoidOverlaps(ao);
        if (ao) {
            this._nodes.forEach(function (v, i) { v.x = x[i], v.y = y[i]; });
            this._descent.project = new rectangle_1.Projection(this._nodes, this._groups, this._rootGroup, curConstraints, true).projectFunctions();
            this._nodes.forEach(function (v, i) { x[i] = v.x, y[i] = v.y; });
        }
        this._descent.G = G;
        this._descent.run(initialAllConstraintsIterations);
        if (gridSnapIterations) {
            this._descent.snapStrength = 1000;
            this._descent.snapGridSize = this._nodes[0].width;
            this._descent.numGridSnapNodes = n;
            this._descent.scaleSnapByMaxH = n != N;
            var G0 = descent_1.Descent.createSquareMatrix(N, function (i, j) {
                if (i >= n || j >= n)
                    return G[i][j];
                return 0;
            });
            this._descent.G = G0;
            this._descent.run(gridSnapIterations);
        }
        this.updateNodePositions();
        this.separateOverlappingComponents(w, h, centerGraph);
        return keepRunning ? this.resume() : this;
    };
    Layout.prototype.initialLayout = function (iterations, x, y) {
        if (this._groups.length > 0 && iterations > 0) {
            var n = this._nodes.length;
            var edges = this._links.map(function (e) { return ({ source: e.source.index, target: e.target.index }); });
            var vs = this._nodes.map(function (v) { return ({ index: v.index }); });
            this._groups.forEach(function (g, i) {
                vs.push({ index: g.index = n + i });
            });
            this._groups.forEach(function (g, i) {
                if (typeof g.leaves !== 'undefined')
                    g.leaves.forEach(function (v) { return edges.push({ source: g.index, target: v.index }); });
                if (typeof g.groups !== 'undefined')
                    g.groups.forEach(function (gg) { return edges.push({ source: g.index, target: gg.index }); });
            });
            new Layout()
                .size(this.size())
                .nodes(vs)
                .links(edges)
                .avoidOverlaps(false)
                .linkDistance(this.linkDistance())
                .symmetricDiffLinkLengths(5)
                .convergenceThreshold(1e-4)
                .start(iterations, 0, 0, 0, false);
            this._nodes.forEach(function (v) {
                x[v.index] = vs[v.index].x;
                y[v.index] = vs[v.index].y;
            });
        }
        else {
            this._descent.run(iterations);
        }
    };
    Layout.prototype.separateOverlappingComponents = function (width, height, centerGraph) {
        var _this = this;
        if (centerGraph === void 0) { centerGraph = true; }
        if (!this._distanceMatrix && this._handleDisconnected) {
            var x_1 = this._descent.x[0], y_1 = this._descent.x[1];
            this._nodes.forEach(function (v, i) { v.x = x_1[i], v.y = y_1[i]; });
            var graphs = handledisconnected_1.separateGraphs(this._nodes, this._links);
            handledisconnected_1.applyPacking(graphs, width, height, this._defaultNodeSize, 1, centerGraph);
            this._nodes.forEach(function (v, i) {
                _this._descent.x[0][i] = v.x, _this._descent.x[1][i] = v.y;
                if (v.bounds) {
                    v.bounds.setXCentre(v.x);
                    v.bounds.setYCentre(v.y);
                }
            });
        }
    };
    Layout.prototype.resume = function () {
        return this.alpha(0.1);
    };
    Layout.prototype.stop = function () {
        return this.alpha(0);
    };
    Layout.prototype.prepareEdgeRouting = function (nodeMargin) {
        if (nodeMargin === void 0) { nodeMargin = 0; }
        this._visibilityGraph = new geom_1.TangentVisibilityGraph(this._nodes.map(function (v) {
            return v.bounds.inflate(-nodeMargin).vertices();
        }));
    };
    Layout.prototype.routeEdge = function (edge, ah, draw) {
        if (ah === void 0) { ah = 5; }
        var lineData = [];
        var vg2 = new geom_1.TangentVisibilityGraph(this._visibilityGraph.P, { V: this._visibilityGraph.V, E: this._visibilityGraph.E }), port1 = { x: edge.source.x, y: edge.source.y }, port2 = { x: edge.target.x, y: edge.target.y }, start = vg2.addPoint(port1, edge.source.index), end = vg2.addPoint(port2, edge.target.index);
        vg2.addEdgeIfVisible(port1, port2, edge.source.index, edge.target.index);
        if (typeof draw !== 'undefined') {
            draw(vg2);
        }
        var sourceInd = function (e) { return e.source.id; }, targetInd = function (e) { return e.target.id; }, length = function (e) { return e.length(); }, spCalc = new shortestpaths_1.Calculator(vg2.V.length, vg2.E, sourceInd, targetInd, length), shortestPath = spCalc.PathFromNodeToNode(start.id, end.id);
        if (shortestPath.length === 1 || shortestPath.length === vg2.V.length) {
            var route = rectangle_1.makeEdgeBetween(edge.source.innerBounds, edge.target.innerBounds, ah);
            lineData = [route.sourceIntersection, route.arrowStart];
        }
        else {
            var n = shortestPath.length - 2, p = vg2.V[shortestPath[n]].p, q = vg2.V[shortestPath[0]].p, lineData = [edge.source.innerBounds.rayIntersection(p.x, p.y)];
            for (var i = n; i >= 0; --i)
                lineData.push(vg2.V[shortestPath[i]].p);
            lineData.push(rectangle_1.makeEdgeTo(q, edge.target.innerBounds, ah));
        }
        return lineData;
    };
    Layout.getSourceIndex = function (e) {
        return typeof e.source === 'number' ? e.source : e.source.index;
    };
    Layout.getTargetIndex = function (e) {
        return typeof e.target === 'number' ? e.target : e.target.index;
    };
    Layout.linkId = function (e) {
        return Layout.getSourceIndex(e) + "-" + Layout.getTargetIndex(e);
    };
    Layout.dragStart = function (d) {
        if (isGroup(d)) {
            Layout.storeOffset(d, Layout.dragOrigin(d));
        }
        else {
            Layout.stopNode(d);
            d.fixed |= 2;
        }
    };
    Layout.stopNode = function (v) {
        v.px = v.x;
        v.py = v.y;
    };
    Layout.storeOffset = function (d, origin) {
        if (typeof d.leaves !== 'undefined') {
            d.leaves.forEach(function (v) {
                v.fixed |= 2;
                Layout.stopNode(v);
                v._dragGroupOffsetX = v.x - origin.x;
                v._dragGroupOffsetY = v.y - origin.y;
            });
        }
        if (typeof d.groups !== 'undefined') {
            d.groups.forEach(function (g) { return Layout.storeOffset(g, origin); });
        }
    };
    Layout.dragOrigin = function (d) {
        if (isGroup(d)) {
            return {
                x: d.bounds.cx(),
                y: d.bounds.cy()
            };
        }
        else {
            return d;
        }
    };
    Layout.drag = function (d, position) {
        if (isGroup(d)) {
            if (typeof d.leaves !== 'undefined') {
                d.leaves.forEach(function (v) {
                    d.bounds.setXCentre(position.x);
                    d.bounds.setYCentre(position.y);
                    v.px = v._dragGroupOffsetX + position.x;
                    v.py = v._dragGroupOffsetY + position.y;
                });
            }
            if (typeof d.groups !== 'undefined') {
                d.groups.forEach(function (g) { return Layout.drag(g, position); });
            }
        }
        else {
            d.px = position.x;
            d.py = position.y;
        }
    };
    Layout.dragEnd = function (d) {
        if (isGroup(d)) {
            if (typeof d.leaves !== 'undefined') {
                d.leaves.forEach(function (v) {
                    Layout.dragEnd(v);
                    delete v._dragGroupOffsetX;
                    delete v._dragGroupOffsetY;
                });
            }
            if (typeof d.groups !== 'undefined') {
                d.groups.forEach(Layout.dragEnd);
            }
        }
        else {
            d.fixed &= ~6;
        }
    };
    Layout.mouseOver = function (d) {
        d.fixed |= 4;
        d.px = d.x, d.py = d.y;
    };
    Layout.mouseOut = function (d) {
        d.fixed &= ~4;
    };
    return Layout;
}());
exports.Layout = Layout;

},{"./descent":7,"./geom":8,"./handledisconnected":10,"./linklengths":13,"./powergraph":14,"./rectangle":17,"./shortestpaths":18}],12:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var shortestpaths_1 = require("./shortestpaths");
var descent_1 = require("./descent");
var rectangle_1 = require("./rectangle");
var linklengths_1 = require("./linklengths");
var Link3D = (function () {
    function Link3D(source, target) {
        this.source = source;
        this.target = target;
    }
    Link3D.prototype.actualLength = function (x) {
        var _this = this;
        return Math.sqrt(x.reduce(function (c, v) {
            var dx = v[_this.target] - v[_this.source];
            return c + dx * dx;
        }, 0));
    };
    return Link3D;
}());
exports.Link3D = Link3D;
var Node3D = (function () {
    function Node3D(x, y, z) {
        if (x === void 0) { x = 0; }
        if (y === void 0) { y = 0; }
        if (z === void 0) { z = 0; }
        this.x = x;
        this.y = y;
        this.z = z;
    }
    return Node3D;
}());
exports.Node3D = Node3D;
var Layout3D = (function () {
    function Layout3D(nodes, links, idealLinkLength) {
        var _this = this;
        if (idealLinkLength === void 0) { idealLinkLength = 1; }
        this.nodes = nodes;
        this.links = links;
        this.idealLinkLength = idealLinkLength;
        this.constraints = null;
        this.useJaccardLinkLengths = true;
        this.result = new Array(Layout3D.k);
        for (var i = 0; i < Layout3D.k; ++i) {
            this.result[i] = new Array(nodes.length);
        }
        nodes.forEach(function (v, i) {
            for (var _i = 0, _a = Layout3D.dims; _i < _a.length; _i++) {
                var dim = _a[_i];
                if (typeof v[dim] == 'undefined')
                    v[dim] = Math.random();
            }
            _this.result[0][i] = v.x;
            _this.result[1][i] = v.y;
            _this.result[2][i] = v.z;
        });
    }
    ;
    Layout3D.prototype.linkLength = function (l) {
        return l.actualLength(this.result);
    };
    Layout3D.prototype.start = function (iterations) {
        var _this = this;
        if (iterations === void 0) { iterations = 100; }
        var n = this.nodes.length;
        var linkAccessor = new LinkAccessor();
        if (this.useJaccardLinkLengths)
            linklengths_1.jaccardLinkLengths(this.links, linkAccessor, 1.5);
        this.links.forEach(function (e) { return e.length *= _this.idealLinkLength; });
        var distanceMatrix = (new shortestpaths_1.Calculator(n, this.links, function (e) { return e.source; }, function (e) { return e.target; }, function (e) { return e.length; })).DistanceMatrix();
        var D = descent_1.Descent.createSquareMatrix(n, function (i, j) { return distanceMatrix[i][j]; });
        var G = descent_1.Descent.createSquareMatrix(n, function () { return 2; });
        this.links.forEach(function (_a) {
            var source = _a.source, target = _a.target;
            return G[source][target] = G[target][source] = 1;
        });
        this.descent = new descent_1.Descent(this.result, D);
        this.descent.threshold = 1e-3;
        this.descent.G = G;
        if (this.constraints)
            this.descent.project = new rectangle_1.Projection(this.nodes, null, null, this.constraints).projectFunctions();
        for (var i = 0; i < this.nodes.length; i++) {
            var v = this.nodes[i];
            if (v.fixed) {
                this.descent.locks.add(i, [v.x, v.y, v.z]);
            }
        }
        this.descent.run(iterations);
        return this;
    };
    Layout3D.prototype.tick = function () {
        this.descent.locks.clear();
        for (var i = 0; i < this.nodes.length; i++) {
            var v = this.nodes[i];
            if (v.fixed) {
                this.descent.locks.add(i, [v.x, v.y, v.z]);
            }
        }
        return this.descent.rungeKutta();
    };
    Layout3D.dims = ['x', 'y', 'z'];
    Layout3D.k = Layout3D.dims.length;
    return Layout3D;
}());
exports.Layout3D = Layout3D;
var LinkAccessor = (function () {
    function LinkAccessor() {
    }
    LinkAccessor.prototype.getSourceIndex = function (e) { return e.source; };
    LinkAccessor.prototype.getTargetIndex = function (e) { return e.target; };
    LinkAccessor.prototype.getLength = function (e) { return e.length; };
    LinkAccessor.prototype.setLength = function (e, l) { e.length = l; };
    return LinkAccessor;
}());

},{"./descent":7,"./linklengths":13,"./rectangle":17,"./shortestpaths":18}],13:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function unionCount(a, b) {
    var u = {};
    for (var i in a)
        u[i] = {};
    for (var i in b)
        u[i] = {};
    return Object.keys(u).length;
}
function intersectionCount(a, b) {
    var n = 0;
    for (var i in a)
        if (typeof b[i] !== 'undefined')
            ++n;
    return n;
}
function getNeighbours(links, la) {
    var neighbours = {};
    var addNeighbours = function (u, v) {
        if (typeof neighbours[u] === 'undefined')
            neighbours[u] = {};
        neighbours[u][v] = {};
    };
    links.forEach(function (e) {
        var u = la.getSourceIndex(e), v = la.getTargetIndex(e);
        addNeighbours(u, v);
        addNeighbours(v, u);
    });
    return neighbours;
}
function computeLinkLengths(links, w, f, la) {
    var neighbours = getNeighbours(links, la);
    links.forEach(function (l) {
        var a = neighbours[la.getSourceIndex(l)];
        var b = neighbours[la.getTargetIndex(l)];
        la.setLength(l, 1 + w * f(a, b));
    });
}
function symmetricDiffLinkLengths(links, la, w) {
    if (w === void 0) { w = 1; }
    computeLinkLengths(links, w, function (a, b) { return Math.sqrt(unionCount(a, b) - intersectionCount(a, b)); }, la);
}
exports.symmetricDiffLinkLengths = symmetricDiffLinkLengths;
function jaccardLinkLengths(links, la, w) {
    if (w === void 0) { w = 1; }
    computeLinkLengths(links, w, function (a, b) {
        return Math.min(Object.keys(a).length, Object.keys(b).length) < 1.1 ? 0 : intersectionCount(a, b) / unionCount(a, b);
    }, la);
}
exports.jaccardLinkLengths = jaccardLinkLengths;
function generateDirectedEdgeConstraints(n, links, axis, la) {
    var components = stronglyConnectedComponents(n, links, la);
    var nodes = {};
    components.forEach(function (c, i) {
        return c.forEach(function (v) { return nodes[v] = i; });
    });
    var constraints = [];
    links.forEach(function (l) {
        var ui = la.getSourceIndex(l), vi = la.getTargetIndex(l), u = nodes[ui], v = nodes[vi];
        if (u !== v) {
            constraints.push({
                axis: axis,
                left: ui,
                right: vi,
                gap: la.getMinSeparation(l)
            });
        }
    });
    return constraints;
}
exports.generateDirectedEdgeConstraints = generateDirectedEdgeConstraints;
function stronglyConnectedComponents(numVertices, edges, la) {
    var nodes = [];
    var index = 0;
    var stack = [];
    var components = [];
    function strongConnect(v) {
        v.index = v.lowlink = index++;
        stack.push(v);
        v.onStack = true;
        for (var _i = 0, _a = v.out; _i < _a.length; _i++) {
            var w = _a[_i];
            if (typeof w.index === 'undefined') {
                strongConnect(w);
                v.lowlink = Math.min(v.lowlink, w.lowlink);
            }
            else if (w.onStack) {
                v.lowlink = Math.min(v.lowlink, w.index);
            }
        }
        if (v.lowlink === v.index) {
            var component = [];
            while (stack.length) {
                w = stack.pop();
                w.onStack = false;
                component.push(w);
                if (w === v)
                    break;
            }
            components.push(component.map(function (v) { return v.id; }));
        }
    }
    for (var i = 0; i < numVertices; i++) {
        nodes.push({ id: i, out: [] });
    }
    for (var _i = 0, edges_1 = edges; _i < edges_1.length; _i++) {
        var e = edges_1[_i];
        var v_1 = nodes[la.getSourceIndex(e)], w = nodes[la.getTargetIndex(e)];
        v_1.out.push(w);
    }
    for (var _a = 0, nodes_1 = nodes; _a < nodes_1.length; _a++) {
        var v = nodes_1[_a];
        if (typeof v.index === 'undefined')
            strongConnect(v);
    }
    return components;
}
exports.stronglyConnectedComponents = stronglyConnectedComponents;

},{}],14:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var PowerEdge = (function () {
    function PowerEdge(source, target, type) {
        this.source = source;
        this.target = target;
        this.type = type;
    }
    return PowerEdge;
}());
exports.PowerEdge = PowerEdge;
var Configuration = (function () {
    function Configuration(n, edges, linkAccessor, rootGroup) {
        var _this = this;
        this.linkAccessor = linkAccessor;
        this.modules = new Array(n);
        this.roots = [];
        if (rootGroup) {
            this.initModulesFromGroup(rootGroup);
        }
        else {
            this.roots.push(new ModuleSet());
            for (var i = 0; i < n; ++i)
                this.roots[0].add(this.modules[i] = new Module(i));
        }
        this.R = edges.length;
        edges.forEach(function (e) {
            var s = _this.modules[linkAccessor.getSourceIndex(e)], t = _this.modules[linkAccessor.getTargetIndex(e)], type = linkAccessor.getType(e);
            s.outgoing.add(type, t);
            t.incoming.add(type, s);
        });
    }
    Configuration.prototype.initModulesFromGroup = function (group) {
        var moduleSet = new ModuleSet();
        this.roots.push(moduleSet);
        for (var i = 0; i < group.leaves.length; ++i) {
            var node = group.leaves[i];
            var module = new Module(node.id);
            this.modules[node.id] = module;
            moduleSet.add(module);
        }
        if (group.groups) {
            for (var j = 0; j < group.groups.length; ++j) {
                var child = group.groups[j];
                var definition = {};
                for (var prop in child)
                    if (prop !== "leaves" && prop !== "groups" && child.hasOwnProperty(prop))
                        definition[prop] = child[prop];
                moduleSet.add(new Module(-1 - j, new LinkSets(), new LinkSets(), this.initModulesFromGroup(child), definition));
            }
        }
        return moduleSet;
    };
    Configuration.prototype.merge = function (a, b, k) {
        if (k === void 0) { k = 0; }
        var inInt = a.incoming.intersection(b.incoming), outInt = a.outgoing.intersection(b.outgoing);
        var children = new ModuleSet();
        children.add(a);
        children.add(b);
        var m = new Module(this.modules.length, outInt, inInt, children);
        this.modules.push(m);
        var update = function (s, i, o) {
            s.forAll(function (ms, linktype) {
                ms.forAll(function (n) {
                    var nls = n[i];
                    nls.add(linktype, m);
                    nls.remove(linktype, a);
                    nls.remove(linktype, b);
                    a[o].remove(linktype, n);
                    b[o].remove(linktype, n);
                });
            });
        };
        update(outInt, "incoming", "outgoing");
        update(inInt, "outgoing", "incoming");
        this.R -= inInt.count() + outInt.count();
        this.roots[k].remove(a);
        this.roots[k].remove(b);
        this.roots[k].add(m);
        return m;
    };
    Configuration.prototype.rootMerges = function (k) {
        if (k === void 0) { k = 0; }
        var rs = this.roots[k].modules();
        var n = rs.length;
        var merges = new Array(n * (n - 1));
        var ctr = 0;
        for (var i = 0, i_ = n - 1; i < i_; ++i) {
            for (var j = i + 1; j < n; ++j) {
                var a = rs[i], b = rs[j];
                merges[ctr] = { id: ctr, nEdges: this.nEdges(a, b), a: a, b: b };
                ctr++;
            }
        }
        return merges;
    };
    Configuration.prototype.greedyMerge = function () {
        for (var i = 0; i < this.roots.length; ++i) {
            if (this.roots[i].modules().length < 2)
                continue;
            var ms = this.rootMerges(i).sort(function (a, b) { return a.nEdges == b.nEdges ? a.id - b.id : a.nEdges - b.nEdges; });
            var m = ms[0];
            if (m.nEdges >= this.R)
                continue;
            this.merge(m.a, m.b, i);
            return true;
        }
    };
    Configuration.prototype.nEdges = function (a, b) {
        var inInt = a.incoming.intersection(b.incoming), outInt = a.outgoing.intersection(b.outgoing);
        return this.R - inInt.count() - outInt.count();
    };
    Configuration.prototype.getGroupHierarchy = function (retargetedEdges) {
        var _this = this;
        var groups = [];
        var root = {};
        toGroups(this.roots[0], root, groups);
        var es = this.allEdges();
        es.forEach(function (e) {
            var a = _this.modules[e.source];
            var b = _this.modules[e.target];
            retargetedEdges.push(new PowerEdge(typeof a.gid === "undefined" ? e.source : groups[a.gid], typeof b.gid === "undefined" ? e.target : groups[b.gid], e.type));
        });
        return groups;
    };
    Configuration.prototype.allEdges = function () {
        var es = [];
        Configuration.getEdges(this.roots[0], es);
        return es;
    };
    Configuration.getEdges = function (modules, es) {
        modules.forAll(function (m) {
            m.getEdges(es);
            Configuration.getEdges(m.children, es);
        });
    };
    return Configuration;
}());
exports.Configuration = Configuration;
function toGroups(modules, group, groups) {
    modules.forAll(function (m) {
        if (m.isLeaf()) {
            if (!group.leaves)
                group.leaves = [];
            group.leaves.push(m.id);
        }
        else {
            var g = group;
            m.gid = groups.length;
            if (!m.isIsland() || m.isPredefined()) {
                g = { id: m.gid };
                if (m.isPredefined())
                    for (var prop in m.definition)
                        g[prop] = m.definition[prop];
                if (!group.groups)
                    group.groups = [];
                group.groups.push(m.gid);
                groups.push(g);
            }
            toGroups(m.children, g, groups);
        }
    });
}
var Module = (function () {
    function Module(id, outgoing, incoming, children, definition) {
        if (outgoing === void 0) { outgoing = new LinkSets(); }
        if (incoming === void 0) { incoming = new LinkSets(); }
        if (children === void 0) { children = new ModuleSet(); }
        this.id = id;
        this.outgoing = outgoing;
        this.incoming = incoming;
        this.children = children;
        this.definition = definition;
    }
    Module.prototype.getEdges = function (es) {
        var _this = this;
        this.outgoing.forAll(function (ms, edgetype) {
            ms.forAll(function (target) {
                es.push(new PowerEdge(_this.id, target.id, edgetype));
            });
        });
    };
    Module.prototype.isLeaf = function () {
        return this.children.count() === 0;
    };
    Module.prototype.isIsland = function () {
        return this.outgoing.count() === 0 && this.incoming.count() === 0;
    };
    Module.prototype.isPredefined = function () {
        return typeof this.definition !== "undefined";
    };
    return Module;
}());
exports.Module = Module;
function intersection(m, n) {
    var i = {};
    for (var v in m)
        if (v in n)
            i[v] = m[v];
    return i;
}
var ModuleSet = (function () {
    function ModuleSet() {
        this.table = {};
    }
    ModuleSet.prototype.count = function () {
        return Object.keys(this.table).length;
    };
    ModuleSet.prototype.intersection = function (other) {
        var result = new ModuleSet();
        result.table = intersection(this.table, other.table);
        return result;
    };
    ModuleSet.prototype.intersectionCount = function (other) {
        return this.intersection(other).count();
    };
    ModuleSet.prototype.contains = function (id) {
        return id in this.table;
    };
    ModuleSet.prototype.add = function (m) {
        this.table[m.id] = m;
    };
    ModuleSet.prototype.remove = function (m) {
        delete this.table[m.id];
    };
    ModuleSet.prototype.forAll = function (f) {
        for (var mid in this.table) {
            f(this.table[mid]);
        }
    };
    ModuleSet.prototype.modules = function () {
        var vs = [];
        this.forAll(function (m) {
            if (!m.isPredefined())
                vs.push(m);
        });
        return vs;
    };
    return ModuleSet;
}());
exports.ModuleSet = ModuleSet;
var LinkSets = (function () {
    function LinkSets() {
        this.sets = {};
        this.n = 0;
    }
    LinkSets.prototype.count = function () {
        return this.n;
    };
    LinkSets.prototype.contains = function (id) {
        var result = false;
        this.forAllModules(function (m) {
            if (!result && m.id == id) {
                result = true;
            }
        });
        return result;
    };
    LinkSets.prototype.add = function (linktype, m) {
        var s = linktype in this.sets ? this.sets[linktype] : this.sets[linktype] = new ModuleSet();
        s.add(m);
        ++this.n;
    };
    LinkSets.prototype.remove = function (linktype, m) {
        var ms = this.sets[linktype];
        ms.remove(m);
        if (ms.count() === 0) {
            delete this.sets[linktype];
        }
        --this.n;
    };
    LinkSets.prototype.forAll = function (f) {
        for (var linktype in this.sets) {
            f(this.sets[linktype], Number(linktype));
        }
    };
    LinkSets.prototype.forAllModules = function (f) {
        this.forAll(function (ms, lt) { return ms.forAll(f); });
    };
    LinkSets.prototype.intersection = function (other) {
        var result = new LinkSets();
        this.forAll(function (ms, lt) {
            if (lt in other.sets) {
                var i = ms.intersection(other.sets[lt]), n = i.count();
                if (n > 0) {
                    result.sets[lt] = i;
                    result.n += n;
                }
            }
        });
        return result;
    };
    return LinkSets;
}());
exports.LinkSets = LinkSets;
function intersectionCount(m, n) {
    return Object.keys(intersection(m, n)).length;
}
function getGroups(nodes, links, la, rootGroup) {
    var n = nodes.length, c = new Configuration(n, links, la, rootGroup);
    while (c.greedyMerge())
        ;
    var powerEdges = [];
    var g = c.getGroupHierarchy(powerEdges);
    powerEdges.forEach(function (e) {
        var f = function (end) {
            var g = e[end];
            if (typeof g == "number")
                e[end] = nodes[g];
        };
        f("source");
        f("target");
    });
    return { groups: g, powerEdges: powerEdges };
}
exports.getGroups = getGroups;

},{}],15:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var PairingHeap = (function () {
    function PairingHeap(elem) {
        this.elem = elem;
        this.subheaps = [];
    }
    PairingHeap.prototype.toString = function (selector) {
        var str = "", needComma = false;
        for (var i = 0; i < this.subheaps.length; ++i) {
            var subheap = this.subheaps[i];
            if (!subheap.elem) {
                needComma = false;
                continue;
            }
            if (needComma) {
                str = str + ",";
            }
            str = str + subheap.toString(selector);
            needComma = true;
        }
        if (str !== "") {
            str = "(" + str + ")";
        }
        return (this.elem ? selector(this.elem) : "") + str;
    };
    PairingHeap.prototype.forEach = function (f) {
        if (!this.empty()) {
            f(this.elem, this);
            this.subheaps.forEach(function (s) { return s.forEach(f); });
        }
    };
    PairingHeap.prototype.count = function () {
        return this.empty() ? 0 : 1 + this.subheaps.reduce(function (n, h) {
            return n + h.count();
        }, 0);
    };
    PairingHeap.prototype.min = function () {
        return this.elem;
    };
    PairingHeap.prototype.empty = function () {
        return this.elem == null;
    };
    PairingHeap.prototype.contains = function (h) {
        if (this === h)
            return true;
        for (var i = 0; i < this.subheaps.length; i++) {
            if (this.subheaps[i].contains(h))
                return true;
        }
        return false;
    };
    PairingHeap.prototype.isHeap = function (lessThan) {
        var _this = this;
        return this.subheaps.every(function (h) { return lessThan(_this.elem, h.elem) && h.isHeap(lessThan); });
    };
    PairingHeap.prototype.insert = function (obj, lessThan) {
        return this.merge(new PairingHeap(obj), lessThan);
    };
    PairingHeap.prototype.merge = function (heap2, lessThan) {
        if (this.empty())
            return heap2;
        else if (heap2.empty())
            return this;
        else if (lessThan(this.elem, heap2.elem)) {
            this.subheaps.push(heap2);
            return this;
        }
        else {
            heap2.subheaps.push(this);
            return heap2;
        }
    };
    PairingHeap.prototype.removeMin = function (lessThan) {
        if (this.empty())
            return null;
        else
            return this.mergePairs(lessThan);
    };
    PairingHeap.prototype.mergePairs = function (lessThan) {
        if (this.subheaps.length == 0)
            return new PairingHeap(null);
        else if (this.subheaps.length == 1) {
            return this.subheaps[0];
        }
        else {
            var firstPair = this.subheaps.pop().merge(this.subheaps.pop(), lessThan);
            var remaining = this.mergePairs(lessThan);
            return firstPair.merge(remaining, lessThan);
        }
    };
    PairingHeap.prototype.decreaseKey = function (subheap, newValue, setHeapNode, lessThan) {
        var newHeap = subheap.removeMin(lessThan);
        subheap.elem = newHeap.elem;
        subheap.subheaps = newHeap.subheaps;
        if (setHeapNode !== null && newHeap.elem !== null) {
            setHeapNode(subheap.elem, subheap);
        }
        var pairingNode = new PairingHeap(newValue);
        if (setHeapNode !== null) {
            setHeapNode(newValue, pairingNode);
        }
        return this.merge(pairingNode, lessThan);
    };
    return PairingHeap;
}());
exports.PairingHeap = PairingHeap;
var PriorityQueue = (function () {
    function PriorityQueue(lessThan) {
        this.lessThan = lessThan;
    }
    PriorityQueue.prototype.top = function () {
        if (this.empty()) {
            return null;
        }
        return this.root.elem;
    };
    PriorityQueue.prototype.push = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        var pairingNode;
        for (var i = 0, arg; arg = args[i]; ++i) {
            pairingNode = new PairingHeap(arg);
            this.root = this.empty() ?
                pairingNode : this.root.merge(pairingNode, this.lessThan);
        }
        return pairingNode;
    };
    PriorityQueue.prototype.empty = function () {
        return !this.root || !this.root.elem;
    };
    PriorityQueue.prototype.isHeap = function () {
        return this.root.isHeap(this.lessThan);
    };
    PriorityQueue.prototype.forEach = function (f) {
        this.root.forEach(f);
    };
    PriorityQueue.prototype.pop = function () {
        if (this.empty()) {
            return null;
        }
        var obj = this.root.min();
        this.root = this.root.removeMin(this.lessThan);
        return obj;
    };
    PriorityQueue.prototype.reduceKey = function (heapNode, newKey, setHeapNode) {
        if (setHeapNode === void 0) { setHeapNode = null; }
        this.root = this.root.decreaseKey(heapNode, newKey, setHeapNode, this.lessThan);
    };
    PriorityQueue.prototype.toString = function (selector) {
        return this.root.toString(selector);
    };
    PriorityQueue.prototype.count = function () {
        return this.root.count();
    };
    return PriorityQueue;
}());
exports.PriorityQueue = PriorityQueue;

},{}],16:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var TreeBase = (function () {
    function TreeBase() {
        this.findIter = function (data) {
            var res = this._root;
            var iter = this.iterator();
            while (res !== null) {
                var c = this._comparator(data, res.data);
                if (c === 0) {
                    iter._cursor = res;
                    return iter;
                }
                else {
                    iter._ancestors.push(res);
                    res = res.get_child(c > 0);
                }
            }
            return null;
        };
    }
    TreeBase.prototype.clear = function () {
        this._root = null;
        this.size = 0;
    };
    ;
    TreeBase.prototype.find = function (data) {
        var res = this._root;
        while (res !== null) {
            var c = this._comparator(data, res.data);
            if (c === 0) {
                return res.data;
            }
            else {
                res = res.get_child(c > 0);
            }
        }
        return null;
    };
    ;
    TreeBase.prototype.lowerBound = function (data) {
        return this._bound(data, this._comparator);
    };
    ;
    TreeBase.prototype.upperBound = function (data) {
        var cmp = this._comparator;
        function reverse_cmp(a, b) {
            return cmp(b, a);
        }
        return this._bound(data, reverse_cmp);
    };
    ;
    TreeBase.prototype.min = function () {
        var res = this._root;
        if (res === null) {
            return null;
        }
        while (res.left !== null) {
            res = res.left;
        }
        return res.data;
    };
    ;
    TreeBase.prototype.max = function () {
        var res = this._root;
        if (res === null) {
            return null;
        }
        while (res.right !== null) {
            res = res.right;
        }
        return res.data;
    };
    ;
    TreeBase.prototype.iterator = function () {
        return new Iterator(this);
    };
    ;
    TreeBase.prototype.each = function (cb) {
        var it = this.iterator(), data;
        while ((data = it.next()) !== null) {
            cb(data);
        }
    };
    ;
    TreeBase.prototype.reach = function (cb) {
        var it = this.iterator(), data;
        while ((data = it.prev()) !== null) {
            cb(data);
        }
    };
    ;
    TreeBase.prototype._bound = function (data, cmp) {
        var cur = this._root;
        var iter = this.iterator();
        while (cur !== null) {
            var c = this._comparator(data, cur.data);
            if (c === 0) {
                iter._cursor = cur;
                return iter;
            }
            iter._ancestors.push(cur);
            cur = cur.get_child(c > 0);
        }
        for (var i = iter._ancestors.length - 1; i >= 0; --i) {
            cur = iter._ancestors[i];
            if (cmp(data, cur.data) > 0) {
                iter._cursor = cur;
                iter._ancestors.length = i;
                return iter;
            }
        }
        iter._ancestors.length = 0;
        return iter;
    };
    ;
    return TreeBase;
}());
exports.TreeBase = TreeBase;
var Iterator = (function () {
    function Iterator(tree) {
        this._tree = tree;
        this._ancestors = [];
        this._cursor = null;
    }
    Iterator.prototype.data = function () {
        return this._cursor !== null ? this._cursor.data : null;
    };
    ;
    Iterator.prototype.next = function () {
        if (this._cursor === null) {
            var root = this._tree._root;
            if (root !== null) {
                this._minNode(root);
            }
        }
        else {
            if (this._cursor.right === null) {
                var save;
                do {
                    save = this._cursor;
                    if (this._ancestors.length) {
                        this._cursor = this._ancestors.pop();
                    }
                    else {
                        this._cursor = null;
                        break;
                    }
                } while (this._cursor.right === save);
            }
            else {
                this._ancestors.push(this._cursor);
                this._minNode(this._cursor.right);
            }
        }
        return this._cursor !== null ? this._cursor.data : null;
    };
    ;
    Iterator.prototype.prev = function () {
        if (this._cursor === null) {
            var root = this._tree._root;
            if (root !== null) {
                this._maxNode(root);
            }
        }
        else {
            if (this._cursor.left === null) {
                var save;
                do {
                    save = this._cursor;
                    if (this._ancestors.length) {
                        this._cursor = this._ancestors.pop();
                    }
                    else {
                        this._cursor = null;
                        break;
                    }
                } while (this._cursor.left === save);
            }
            else {
                this._ancestors.push(this._cursor);
                this._maxNode(this._cursor.left);
            }
        }
        return this._cursor !== null ? this._cursor.data : null;
    };
    ;
    Iterator.prototype._minNode = function (start) {
        while (start.left !== null) {
            this._ancestors.push(start);
            start = start.left;
        }
        this._cursor = start;
    };
    ;
    Iterator.prototype._maxNode = function (start) {
        while (start.right !== null) {
            this._ancestors.push(start);
            start = start.right;
        }
        this._cursor = start;
    };
    ;
    return Iterator;
}());
exports.Iterator = Iterator;
var Node = (function () {
    function Node(data) {
        this.data = data;
        this.left = null;
        this.right = null;
        this.red = true;
    }
    Node.prototype.get_child = function (dir) {
        return dir ? this.right : this.left;
    };
    ;
    Node.prototype.set_child = function (dir, val) {
        if (dir) {
            this.right = val;
        }
        else {
            this.left = val;
        }
    };
    ;
    return Node;
}());
var RBTree = (function (_super) {
    __extends(RBTree, _super);
    function RBTree(comparator) {
        var _this = _super.call(this) || this;
        _this._root = null;
        _this._comparator = comparator;
        _this.size = 0;
        return _this;
    }
    RBTree.prototype.insert = function (data) {
        var ret = false;
        if (this._root === null) {
            this._root = new Node(data);
            ret = true;
            this.size++;
        }
        else {
            var head = new Node(undefined);
            var dir = false;
            var last = false;
            var gp = null;
            var ggp = head;
            var p = null;
            var node = this._root;
            ggp.right = this._root;
            while (true) {
                if (node === null) {
                    node = new Node(data);
                    p.set_child(dir, node);
                    ret = true;
                    this.size++;
                }
                else if (RBTree.is_red(node.left) && RBTree.is_red(node.right)) {
                    node.red = true;
                    node.left.red = false;
                    node.right.red = false;
                }
                if (RBTree.is_red(node) && RBTree.is_red(p)) {
                    var dir2 = ggp.right === gp;
                    if (node === p.get_child(last)) {
                        ggp.set_child(dir2, RBTree.single_rotate(gp, !last));
                    }
                    else {
                        ggp.set_child(dir2, RBTree.double_rotate(gp, !last));
                    }
                }
                var cmp = this._comparator(node.data, data);
                if (cmp === 0) {
                    break;
                }
                last = dir;
                dir = cmp < 0;
                if (gp !== null) {
                    ggp = gp;
                }
                gp = p;
                p = node;
                node = node.get_child(dir);
            }
            this._root = head.right;
        }
        this._root.red = false;
        return ret;
    };
    ;
    RBTree.prototype.remove = function (data) {
        if (this._root === null) {
            return false;
        }
        var head = new Node(undefined);
        var node = head;
        node.right = this._root;
        var p = null;
        var gp = null;
        var found = null;
        var dir = true;
        while (node.get_child(dir) !== null) {
            var last = dir;
            gp = p;
            p = node;
            node = node.get_child(dir);
            var cmp = this._comparator(data, node.data);
            dir = cmp > 0;
            if (cmp === 0) {
                found = node;
            }
            if (!RBTree.is_red(node) && !RBTree.is_red(node.get_child(dir))) {
                if (RBTree.is_red(node.get_child(!dir))) {
                    var sr = RBTree.single_rotate(node, dir);
                    p.set_child(last, sr);
                    p = sr;
                }
                else if (!RBTree.is_red(node.get_child(!dir))) {
                    var sibling = p.get_child(!last);
                    if (sibling !== null) {
                        if (!RBTree.is_red(sibling.get_child(!last)) && !RBTree.is_red(sibling.get_child(last))) {
                            p.red = false;
                            sibling.red = true;
                            node.red = true;
                        }
                        else {
                            var dir2 = gp.right === p;
                            if (RBTree.is_red(sibling.get_child(last))) {
                                gp.set_child(dir2, RBTree.double_rotate(p, last));
                            }
                            else if (RBTree.is_red(sibling.get_child(!last))) {
                                gp.set_child(dir2, RBTree.single_rotate(p, last));
                            }
                            var gpc = gp.get_child(dir2);
                            gpc.red = true;
                            node.red = true;
                            gpc.left.red = false;
                            gpc.right.red = false;
                        }
                    }
                }
            }
        }
        if (found !== null) {
            found.data = node.data;
            p.set_child(p.right === node, node.get_child(node.left === null));
            this.size--;
        }
        this._root = head.right;
        if (this._root !== null) {
            this._root.red = false;
        }
        return found !== null;
    };
    ;
    RBTree.is_red = function (node) {
        return node !== null && node.red;
    };
    RBTree.single_rotate = function (root, dir) {
        var save = root.get_child(!dir);
        root.set_child(!dir, save.get_child(dir));
        save.set_child(dir, root);
        root.red = true;
        save.red = false;
        return save;
    };
    RBTree.double_rotate = function (root, dir) {
        root.set_child(!dir, RBTree.single_rotate(root.get_child(!dir), !dir));
        return RBTree.single_rotate(root, dir);
    };
    return RBTree;
}(TreeBase));
exports.RBTree = RBTree;

},{}],17:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var vpsc_1 = require("./vpsc");
var rbtree_1 = require("./rbtree");
function computeGroupBounds(g) {
    g.bounds = typeof g.leaves !== "undefined" ?
        g.leaves.reduce(function (r, c) { return c.bounds.union(r); }, Rectangle.empty()) :
        Rectangle.empty();
    if (typeof g.groups !== "undefined")
        g.bounds = g.groups.reduce(function (r, c) { return computeGroupBounds(c).union(r); }, g.bounds);
    g.bounds = g.bounds.inflate(g.padding);
    return g.bounds;
}
exports.computeGroupBounds = computeGroupBounds;
var Rectangle = (function () {
    function Rectangle(x, X, y, Y) {
        this.x = x;
        this.X = X;
        this.y = y;
        this.Y = Y;
    }
    Rectangle.empty = function () { return new Rectangle(Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY); };
    Rectangle.prototype.cx = function () { return (this.x + this.X) / 2; };
    Rectangle.prototype.cy = function () { return (this.y + this.Y) / 2; };
    Rectangle.prototype.overlapX = function (r) {
        var ux = this.cx(), vx = r.cx();
        if (ux <= vx && r.x < this.X)
            return this.X - r.x;
        if (vx <= ux && this.x < r.X)
            return r.X - this.x;
        return 0;
    };
    Rectangle.prototype.overlapY = function (r) {
        var uy = this.cy(), vy = r.cy();
        if (uy <= vy && r.y < this.Y)
            return this.Y - r.y;
        if (vy <= uy && this.y < r.Y)
            return r.Y - this.y;
        return 0;
    };
    Rectangle.prototype.setXCentre = function (cx) {
        var dx = cx - this.cx();
        this.x += dx;
        this.X += dx;
    };
    Rectangle.prototype.setYCentre = function (cy) {
        var dy = cy - this.cy();
        this.y += dy;
        this.Y += dy;
    };
    Rectangle.prototype.width = function () {
        return this.X - this.x;
    };
    Rectangle.prototype.height = function () {
        return this.Y - this.y;
    };
    Rectangle.prototype.union = function (r) {
        return new Rectangle(Math.min(this.x, r.x), Math.max(this.X, r.X), Math.min(this.y, r.y), Math.max(this.Y, r.Y));
    };
    Rectangle.prototype.lineIntersections = function (x1, y1, x2, y2) {
        var sides = [[this.x, this.y, this.X, this.y],
            [this.X, this.y, this.X, this.Y],
            [this.X, this.Y, this.x, this.Y],
            [this.x, this.Y, this.x, this.y]];
        var intersections = [];
        for (var i = 0; i < 4; ++i) {
            var r = Rectangle.lineIntersection(x1, y1, x2, y2, sides[i][0], sides[i][1], sides[i][2], sides[i][3]);
            if (r !== null)
                intersections.push({ x: r.x, y: r.y });
        }
        return intersections;
    };
    Rectangle.prototype.rayIntersection = function (x2, y2) {
        var ints = this.lineIntersections(this.cx(), this.cy(), x2, y2);
        return ints.length > 0 ? ints[0] : null;
    };
    Rectangle.prototype.vertices = function () {
        return [
            { x: this.x, y: this.y },
            { x: this.X, y: this.y },
            { x: this.X, y: this.Y },
            { x: this.x, y: this.Y }
        ];
    };
    Rectangle.lineIntersection = function (x1, y1, x2, y2, x3, y3, x4, y4) {
        var dx12 = x2 - x1, dx34 = x4 - x3, dy12 = y2 - y1, dy34 = y4 - y3, denominator = dy34 * dx12 - dx34 * dy12;
        if (denominator == 0)
            return null;
        var dx31 = x1 - x3, dy31 = y1 - y3, numa = dx34 * dy31 - dy34 * dx31, a = numa / denominator, numb = dx12 * dy31 - dy12 * dx31, b = numb / denominator;
        if (a >= 0 && a <= 1 && b >= 0 && b <= 1) {
            return {
                x: x1 + a * dx12,
                y: y1 + a * dy12
            };
        }
        return null;
    };
    Rectangle.prototype.inflate = function (pad) {
        return new Rectangle(this.x - pad, this.X + pad, this.y - pad, this.Y + pad);
    };
    return Rectangle;
}());
exports.Rectangle = Rectangle;
function makeEdgeBetween(source, target, ah) {
    var si = source.rayIntersection(target.cx(), target.cy()) || { x: source.cx(), y: source.cy() }, ti = target.rayIntersection(source.cx(), source.cy()) || { x: target.cx(), y: target.cy() }, dx = ti.x - si.x, dy = ti.y - si.y, l = Math.sqrt(dx * dx + dy * dy), al = l - ah;
    return {
        sourceIntersection: si,
        targetIntersection: ti,
        arrowStart: { x: si.x + al * dx / l, y: si.y + al * dy / l }
    };
}
exports.makeEdgeBetween = makeEdgeBetween;
function makeEdgeTo(s, target, ah) {
    var ti = target.rayIntersection(s.x, s.y);
    if (!ti)
        ti = { x: target.cx(), y: target.cy() };
    var dx = ti.x - s.x, dy = ti.y - s.y, l = Math.sqrt(dx * dx + dy * dy);
    return { x: ti.x - ah * dx / l, y: ti.y - ah * dy / l };
}
exports.makeEdgeTo = makeEdgeTo;
var Node = (function () {
    function Node(v, r, pos) {
        this.v = v;
        this.r = r;
        this.pos = pos;
        this.prev = makeRBTree();
        this.next = makeRBTree();
    }
    return Node;
}());
var Event = (function () {
    function Event(isOpen, v, pos) {
        this.isOpen = isOpen;
        this.v = v;
        this.pos = pos;
    }
    return Event;
}());
function compareEvents(a, b) {
    if (a.pos > b.pos) {
        return 1;
    }
    if (a.pos < b.pos) {
        return -1;
    }
    if (a.isOpen) {
        return -1;
    }
    if (b.isOpen) {
        return 1;
    }
    return 0;
}
function makeRBTree() {
    return new rbtree_1.RBTree(function (a, b) { return a.pos - b.pos; });
}
var xRect = {
    getCentre: function (r) { return r.cx(); },
    getOpen: function (r) { return r.y; },
    getClose: function (r) { return r.Y; },
    getSize: function (r) { return r.width(); },
    makeRect: function (open, close, center, size) { return new Rectangle(center - size / 2, center + size / 2, open, close); },
    findNeighbours: findXNeighbours
};
var yRect = {
    getCentre: function (r) { return r.cy(); },
    getOpen: function (r) { return r.x; },
    getClose: function (r) { return r.X; },
    getSize: function (r) { return r.height(); },
    makeRect: function (open, close, center, size) { return new Rectangle(open, close, center - size / 2, center + size / 2); },
    findNeighbours: findYNeighbours
};
function generateGroupConstraints(root, f, minSep, isContained) {
    if (isContained === void 0) { isContained = false; }
    var padding = root.padding, gn = typeof root.groups !== 'undefined' ? root.groups.length : 0, ln = typeof root.leaves !== 'undefined' ? root.leaves.length : 0, childConstraints = !gn ? []
        : root.groups.reduce(function (ccs, g) { return ccs.concat(generateGroupConstraints(g, f, minSep, true)); }, []), n = (isContained ? 2 : 0) + ln + gn, vs = new Array(n), rs = new Array(n), i = 0, add = function (r, v) { rs[i] = r; vs[i++] = v; };
    if (isContained) {
        var b = root.bounds, c = f.getCentre(b), s = f.getSize(b) / 2, open = f.getOpen(b), close = f.getClose(b), min = c - s + padding / 2, max = c + s - padding / 2;
        root.minVar.desiredPosition = min;
        add(f.makeRect(open, close, min, padding), root.minVar);
        root.maxVar.desiredPosition = max;
        add(f.makeRect(open, close, max, padding), root.maxVar);
    }
    if (ln)
        root.leaves.forEach(function (l) { return add(l.bounds, l.variable); });
    if (gn)
        root.groups.forEach(function (g) {
            var b = g.bounds;
            add(f.makeRect(f.getOpen(b), f.getClose(b), f.getCentre(b), f.getSize(b)), g.minVar);
        });
    var cs = generateConstraints(rs, vs, f, minSep);
    if (gn) {
        vs.forEach(function (v) { v.cOut = [], v.cIn = []; });
        cs.forEach(function (c) { c.left.cOut.push(c), c.right.cIn.push(c); });
        root.groups.forEach(function (g) {
            var gapAdjustment = (g.padding - f.getSize(g.bounds)) / 2;
            g.minVar.cIn.forEach(function (c) { return c.gap += gapAdjustment; });
            g.minVar.cOut.forEach(function (c) { c.left = g.maxVar; c.gap += gapAdjustment; });
        });
    }
    return childConstraints.concat(cs);
}
function generateConstraints(rs, vars, rect, minSep) {
    var i, n = rs.length;
    var N = 2 * n;
    console.assert(vars.length >= n);
    var events = new Array(N);
    for (i = 0; i < n; ++i) {
        var r = rs[i];
        var v = new Node(vars[i], r, rect.getCentre(r));
        events[i] = new Event(true, v, rect.getOpen(r));
        events[i + n] = new Event(false, v, rect.getClose(r));
    }
    events.sort(compareEvents);
    var cs = new Array();
    var scanline = makeRBTree();
    for (i = 0; i < N; ++i) {
        var e = events[i];
        var v = e.v;
        if (e.isOpen) {
            scanline.insert(v);
            rect.findNeighbours(v, scanline);
        }
        else {
            scanline.remove(v);
            var makeConstraint = function (l, r) {
                var sep = (rect.getSize(l.r) + rect.getSize(r.r)) / 2 + minSep;
                cs.push(new vpsc_1.Constraint(l.v, r.v, sep));
            };
            var visitNeighbours = function (forward, reverse, mkcon) {
                var u, it = v[forward].iterator();
                while ((u = it[forward]()) !== null) {
                    mkcon(u, v);
                    u[reverse].remove(v);
                }
            };
            visitNeighbours("prev", "next", function (u, v) { return makeConstraint(u, v); });
            visitNeighbours("next", "prev", function (u, v) { return makeConstraint(v, u); });
        }
    }
    console.assert(scanline.size === 0);
    return cs;
}
function findXNeighbours(v, scanline) {
    var f = function (forward, reverse) {
        var it = scanline.findIter(v);
        var u;
        while ((u = it[forward]()) !== null) {
            var uovervX = u.r.overlapX(v.r);
            if (uovervX <= 0 || uovervX <= u.r.overlapY(v.r)) {
                v[forward].insert(u);
                u[reverse].insert(v);
            }
            if (uovervX <= 0) {
                break;
            }
        }
    };
    f("next", "prev");
    f("prev", "next");
}
function findYNeighbours(v, scanline) {
    var f = function (forward, reverse) {
        var u = scanline.findIter(v)[forward]();
        if (u !== null && u.r.overlapX(v.r) > 0) {
            v[forward].insert(u);
            u[reverse].insert(v);
        }
    };
    f("next", "prev");
    f("prev", "next");
}
function generateXConstraints(rs, vars) {
    return generateConstraints(rs, vars, xRect, 1e-6);
}
exports.generateXConstraints = generateXConstraints;
function generateYConstraints(rs, vars) {
    return generateConstraints(rs, vars, yRect, 1e-6);
}
exports.generateYConstraints = generateYConstraints;
function generateXGroupConstraints(root) {
    return generateGroupConstraints(root, xRect, 1e-6);
}
exports.generateXGroupConstraints = generateXGroupConstraints;
function generateYGroupConstraints(root) {
    return generateGroupConstraints(root, yRect, 1e-6);
}
exports.generateYGroupConstraints = generateYGroupConstraints;
function removeOverlaps(rs) {
    var vs = rs.map(function (r) { return new vpsc_1.Variable(r.cx()); });
    var cs = generateXConstraints(rs, vs);
    var solver = new vpsc_1.Solver(vs, cs);
    solver.solve();
    vs.forEach(function (v, i) { return rs[i].setXCentre(v.position()); });
    vs = rs.map(function (r) { return new vpsc_1.Variable(r.cy()); });
    cs = generateYConstraints(rs, vs);
    solver = new vpsc_1.Solver(vs, cs);
    solver.solve();
    vs.forEach(function (v, i) { return rs[i].setYCentre(v.position()); });
}
exports.removeOverlaps = removeOverlaps;
var IndexedVariable = (function (_super) {
    __extends(IndexedVariable, _super);
    function IndexedVariable(index, w) {
        var _this = _super.call(this, 0, w) || this;
        _this.index = index;
        return _this;
    }
    return IndexedVariable;
}(vpsc_1.Variable));
exports.IndexedVariable = IndexedVariable;
var Projection = (function () {
    function Projection(nodes, groups, rootGroup, constraints, avoidOverlaps) {
        var _this = this;
        if (rootGroup === void 0) { rootGroup = null; }
        if (constraints === void 0) { constraints = null; }
        if (avoidOverlaps === void 0) { avoidOverlaps = false; }
        this.nodes = nodes;
        this.groups = groups;
        this.rootGroup = rootGroup;
        this.avoidOverlaps = avoidOverlaps;
        this.variables = nodes.map(function (v, i) {
            return v.variable = new IndexedVariable(i, 1);
        });
        if (constraints)
            this.createConstraints(constraints);
        if (avoidOverlaps && rootGroup && typeof rootGroup.groups !== 'undefined') {
            nodes.forEach(function (v) {
                if (!v.width || !v.height) {
                    v.bounds = new Rectangle(v.x, v.x, v.y, v.y);
                    return;
                }
                var w2 = v.width / 2, h2 = v.height / 2;
                v.bounds = new Rectangle(v.x - w2, v.x + w2, v.y - h2, v.y + h2);
            });
            computeGroupBounds(rootGroup);
            var i = nodes.length;
            groups.forEach(function (g) {
                _this.variables[i] = g.minVar = new IndexedVariable(i++, typeof g.stiffness !== "undefined" ? g.stiffness : 0.01);
                _this.variables[i] = g.maxVar = new IndexedVariable(i++, typeof g.stiffness !== "undefined" ? g.stiffness : 0.01);
            });
        }
    }
    Projection.prototype.createSeparation = function (c) {
        return new vpsc_1.Constraint(this.nodes[c.left].variable, this.nodes[c.right].variable, c.gap, typeof c.equality !== "undefined" ? c.equality : false);
    };
    Projection.prototype.makeFeasible = function (c) {
        var _this = this;
        if (!this.avoidOverlaps)
            return;
        var axis = 'x', dim = 'width';
        if (c.axis === 'x')
            axis = 'y', dim = 'height';
        var vs = c.offsets.map(function (o) { return _this.nodes[o.node]; }).sort(function (a, b) { return a[axis] - b[axis]; });
        var p = null;
        vs.forEach(function (v) {
            if (p) {
                var nextPos = p[axis] + p[dim];
                if (nextPos > v[axis]) {
                    v[axis] = nextPos;
                }
            }
            p = v;
        });
    };
    Projection.prototype.createAlignment = function (c) {
        var _this = this;
        var u = this.nodes[c.offsets[0].node].variable;
        this.makeFeasible(c);
        var cs = c.axis === 'x' ? this.xConstraints : this.yConstraints;
        c.offsets.slice(1).forEach(function (o) {
            var v = _this.nodes[o.node].variable;
            cs.push(new vpsc_1.Constraint(u, v, o.offset, true));
        });
    };
    Projection.prototype.createConstraints = function (constraints) {
        var _this = this;
        var isSep = function (c) { return typeof c.type === 'undefined' || c.type === 'separation'; };
        this.xConstraints = constraints
            .filter(function (c) { return c.axis === "x" && isSep(c); })
            .map(function (c) { return _this.createSeparation(c); });
        this.yConstraints = constraints
            .filter(function (c) { return c.axis === "y" && isSep(c); })
            .map(function (c) { return _this.createSeparation(c); });
        constraints
            .filter(function (c) { return c.type === 'alignment'; })
            .forEach(function (c) { return _this.createAlignment(c); });
    };
    Projection.prototype.setupVariablesAndBounds = function (x0, y0, desired, getDesired) {
        this.nodes.forEach(function (v, i) {
            if (v.fixed) {
                v.variable.weight = v.fixedWeight ? v.fixedWeight : 1000;
                desired[i] = getDesired(v);
            }
            else {
                v.variable.weight = 1;
            }
            var w = (v.width || 0) / 2, h = (v.height || 0) / 2;
            var ix = x0[i], iy = y0[i];
            v.bounds = new Rectangle(ix - w, ix + w, iy - h, iy + h);
        });
    };
    Projection.prototype.xProject = function (x0, y0, x) {
        if (!this.rootGroup && !(this.avoidOverlaps || this.xConstraints))
            return;
        this.project(x0, y0, x0, x, function (v) { return v.px; }, this.xConstraints, generateXGroupConstraints, function (v) { return v.bounds.setXCentre(x[v.variable.index] = v.variable.position()); }, function (g) {
            var xmin = x[g.minVar.index] = g.minVar.position();
            var xmax = x[g.maxVar.index] = g.maxVar.position();
            var p2 = g.padding / 2;
            g.bounds.x = xmin - p2;
            g.bounds.X = xmax + p2;
        });
    };
    Projection.prototype.yProject = function (x0, y0, y) {
        if (!this.rootGroup && !this.yConstraints)
            return;
        this.project(x0, y0, y0, y, function (v) { return v.py; }, this.yConstraints, generateYGroupConstraints, function (v) { return v.bounds.setYCentre(y[v.variable.index] = v.variable.position()); }, function (g) {
            var ymin = y[g.minVar.index] = g.minVar.position();
            var ymax = y[g.maxVar.index] = g.maxVar.position();
            var p2 = g.padding / 2;
            g.bounds.y = ymin - p2;
            ;
            g.bounds.Y = ymax + p2;
        });
    };
    Projection.prototype.projectFunctions = function () {
        var _this = this;
        return [
            function (x0, y0, x) { return _this.xProject(x0, y0, x); },
            function (x0, y0, y) { return _this.yProject(x0, y0, y); }
        ];
    };
    Projection.prototype.project = function (x0, y0, start, desired, getDesired, cs, generateConstraints, updateNodeBounds, updateGroupBounds) {
        this.setupVariablesAndBounds(x0, y0, desired, getDesired);
        if (this.rootGroup && this.avoidOverlaps) {
            computeGroupBounds(this.rootGroup);
            cs = cs.concat(generateConstraints(this.rootGroup));
        }
        this.solve(this.variables, cs, start, desired);
        this.nodes.forEach(updateNodeBounds);
        if (this.rootGroup && this.avoidOverlaps) {
            this.groups.forEach(updateGroupBounds);
            computeGroupBounds(this.rootGroup);
        }
    };
    Projection.prototype.solve = function (vs, cs, starting, desired) {
        var solver = new vpsc_1.Solver(vs, cs);
        solver.setStartingPositions(starting);
        solver.setDesiredPositions(desired);
        solver.solve();
    };
    return Projection;
}());
exports.Projection = Projection;

},{"./rbtree":16,"./vpsc":19}],18:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var pqueue_1 = require("./pqueue");
var Neighbour = (function () {
    function Neighbour(id, distance) {
        this.id = id;
        this.distance = distance;
    }
    return Neighbour;
}());
var Node = (function () {
    function Node(id) {
        this.id = id;
        this.neighbours = [];
    }
    return Node;
}());
var QueueEntry = (function () {
    function QueueEntry(node, prev, d) {
        this.node = node;
        this.prev = prev;
        this.d = d;
    }
    return QueueEntry;
}());
var Calculator = (function () {
    function Calculator(n, es, getSourceIndex, getTargetIndex, getLength) {
        this.n = n;
        this.es = es;
        this.neighbours = new Array(this.n);
        var i = this.n;
        while (i--)
            this.neighbours[i] = new Node(i);
        i = this.es.length;
        while (i--) {
            var e = this.es[i];
            var u = getSourceIndex(e), v = getTargetIndex(e);
            var d = getLength(e);
            this.neighbours[u].neighbours.push(new Neighbour(v, d));
            this.neighbours[v].neighbours.push(new Neighbour(u, d));
        }
    }
    Calculator.prototype.DistanceMatrix = function () {
        var D = new Array(this.n);
        for (var i = 0; i < this.n; ++i) {
            D[i] = this.dijkstraNeighbours(i);
        }
        return D;
    };
    Calculator.prototype.DistancesFromNode = function (start) {
        return this.dijkstraNeighbours(start);
    };
    Calculator.prototype.PathFromNodeToNode = function (start, end) {
        return this.dijkstraNeighbours(start, end);
    };
    Calculator.prototype.PathFromNodeToNodeWithPrevCost = function (start, end, prevCost) {
        var q = new pqueue_1.PriorityQueue(function (a, b) { return a.d <= b.d; }), u = this.neighbours[start], qu = new QueueEntry(u, null, 0), visitedFrom = {};
        q.push(qu);
        while (!q.empty()) {
            qu = q.pop();
            u = qu.node;
            if (u.id === end) {
                break;
            }
            var i = u.neighbours.length;
            while (i--) {
                var neighbour = u.neighbours[i], v = this.neighbours[neighbour.id];
                if (qu.prev && v.id === qu.prev.node.id)
                    continue;
                var viduid = v.id + ',' + u.id;
                if (viduid in visitedFrom && visitedFrom[viduid] <= qu.d)
                    continue;
                var cc = qu.prev ? prevCost(qu.prev.node.id, u.id, v.id) : 0, t = qu.d + neighbour.distance + cc;
                visitedFrom[viduid] = t;
                q.push(new QueueEntry(v, qu, t));
            }
        }
        var path = [];
        while (qu.prev) {
            qu = qu.prev;
            path.push(qu.node.id);
        }
        return path;
    };
    Calculator.prototype.dijkstraNeighbours = function (start, dest) {
        if (dest === void 0) { dest = -1; }
        var q = new pqueue_1.PriorityQueue(function (a, b) { return a.d <= b.d; }), i = this.neighbours.length, d = new Array(i);
        while (i--) {
            var node = this.neighbours[i];
            node.d = i === start ? 0 : Number.POSITIVE_INFINITY;
            node.q = q.push(node);
        }
        while (!q.empty()) {
            var u = q.pop();
            d[u.id] = u.d;
            if (u.id === dest) {
                var path = [];
                var v = u;
                while (typeof v.prev !== 'undefined') {
                    path.push(v.prev.id);
                    v = v.prev;
                }
                return path;
            }
            i = u.neighbours.length;
            while (i--) {
                var neighbour = u.neighbours[i];
                var v = this.neighbours[neighbour.id];
                var t = u.d + neighbour.distance;
                if (u.d !== Number.MAX_VALUE && v.d > t) {
                    v.d = t;
                    v.prev = u;
                    q.reduceKey(v.q, v, function (e, q) { return e.q = q; });
                }
            }
        }
        return d;
    };
    return Calculator;
}());
exports.Calculator = Calculator;

},{"./pqueue":15}],19:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var PositionStats = (function () {
    function PositionStats(scale) {
        this.scale = scale;
        this.AB = 0;
        this.AD = 0;
        this.A2 = 0;
    }
    PositionStats.prototype.addVariable = function (v) {
        var ai = this.scale / v.scale;
        var bi = v.offset / v.scale;
        var wi = v.weight;
        this.AB += wi * ai * bi;
        this.AD += wi * ai * v.desiredPosition;
        this.A2 += wi * ai * ai;
    };
    PositionStats.prototype.getPosn = function () {
        return (this.AD - this.AB) / this.A2;
    };
    return PositionStats;
}());
exports.PositionStats = PositionStats;
var Constraint = (function () {
    function Constraint(left, right, gap, equality) {
        if (equality === void 0) { equality = false; }
        this.left = left;
        this.right = right;
        this.gap = gap;
        this.equality = equality;
        this.active = false;
        this.unsatisfiable = false;
        this.left = left;
        this.right = right;
        this.gap = gap;
        this.equality = equality;
    }
    Constraint.prototype.slack = function () {
        return this.unsatisfiable ? Number.MAX_VALUE
            : this.right.scale * this.right.position() - this.gap
                - this.left.scale * this.left.position();
    };
    return Constraint;
}());
exports.Constraint = Constraint;
var Variable = (function () {
    function Variable(desiredPosition, weight, scale) {
        if (weight === void 0) { weight = 1; }
        if (scale === void 0) { scale = 1; }
        this.desiredPosition = desiredPosition;
        this.weight = weight;
        this.scale = scale;
        this.offset = 0;
    }
    Variable.prototype.dfdv = function () {
        return 2.0 * this.weight * (this.position() - this.desiredPosition);
    };
    Variable.prototype.position = function () {
        return (this.block.ps.scale * this.block.posn + this.offset) / this.scale;
    };
    Variable.prototype.visitNeighbours = function (prev, f) {
        var ff = function (c, next) { return c.active && prev !== next && f(c, next); };
        this.cOut.forEach(function (c) { return ff(c, c.right); });
        this.cIn.forEach(function (c) { return ff(c, c.left); });
    };
    return Variable;
}());
exports.Variable = Variable;
var Block = (function () {
    function Block(v) {
        this.vars = [];
        v.offset = 0;
        this.ps = new PositionStats(v.scale);
        this.addVariable(v);
    }
    Block.prototype.addVariable = function (v) {
        v.block = this;
        this.vars.push(v);
        this.ps.addVariable(v);
        this.posn = this.ps.getPosn();
    };
    Block.prototype.updateWeightedPosition = function () {
        this.ps.AB = this.ps.AD = this.ps.A2 = 0;
        for (var i = 0, n = this.vars.length; i < n; ++i)
            this.ps.addVariable(this.vars[i]);
        this.posn = this.ps.getPosn();
    };
    Block.prototype.compute_lm = function (v, u, postAction) {
        var _this = this;
        var dfdv = v.dfdv();
        v.visitNeighbours(u, function (c, next) {
            var _dfdv = _this.compute_lm(next, v, postAction);
            if (next === c.right) {
                dfdv += _dfdv * c.left.scale;
                c.lm = _dfdv;
            }
            else {
                dfdv += _dfdv * c.right.scale;
                c.lm = -_dfdv;
            }
            postAction(c);
        });
        return dfdv / v.scale;
    };
    Block.prototype.populateSplitBlock = function (v, prev) {
        var _this = this;
        v.visitNeighbours(prev, function (c, next) {
            next.offset = v.offset + (next === c.right ? c.gap : -c.gap);
            _this.addVariable(next);
            _this.populateSplitBlock(next, v);
        });
    };
    Block.prototype.traverse = function (visit, acc, v, prev) {
        var _this = this;
        if (v === void 0) { v = this.vars[0]; }
        if (prev === void 0) { prev = null; }
        v.visitNeighbours(prev, function (c, next) {
            acc.push(visit(c));
            _this.traverse(visit, acc, next, v);
        });
    };
    Block.prototype.findMinLM = function () {
        var m = null;
        this.compute_lm(this.vars[0], null, function (c) {
            if (!c.equality && (m === null || c.lm < m.lm))
                m = c;
        });
        return m;
    };
    Block.prototype.findMinLMBetween = function (lv, rv) {
        this.compute_lm(lv, null, function () { });
        var m = null;
        this.findPath(lv, null, rv, function (c, next) {
            if (!c.equality && c.right === next && (m === null || c.lm < m.lm))
                m = c;
        });
        return m;
    };
    Block.prototype.findPath = function (v, prev, to, visit) {
        var _this = this;
        var endFound = false;
        v.visitNeighbours(prev, function (c, next) {
            if (!endFound && (next === to || _this.findPath(next, v, to, visit))) {
                endFound = true;
                visit(c, next);
            }
        });
        return endFound;
    };
    Block.prototype.isActiveDirectedPathBetween = function (u, v) {
        if (u === v)
            return true;
        var i = u.cOut.length;
        while (i--) {
            var c = u.cOut[i];
            if (c.active && this.isActiveDirectedPathBetween(c.right, v))
                return true;
        }
        return false;
    };
    Block.split = function (c) {
        c.active = false;
        return [Block.createSplitBlock(c.left), Block.createSplitBlock(c.right)];
    };
    Block.createSplitBlock = function (startVar) {
        var b = new Block(startVar);
        b.populateSplitBlock(startVar, null);
        return b;
    };
    Block.prototype.splitBetween = function (vl, vr) {
        var c = this.findMinLMBetween(vl, vr);
        if (c !== null) {
            var bs = Block.split(c);
            return { constraint: c, lb: bs[0], rb: bs[1] };
        }
        return null;
    };
    Block.prototype.mergeAcross = function (b, c, dist) {
        c.active = true;
        for (var i = 0, n = b.vars.length; i < n; ++i) {
            var v = b.vars[i];
            v.offset += dist;
            this.addVariable(v);
        }
        this.posn = this.ps.getPosn();
    };
    Block.prototype.cost = function () {
        var sum = 0, i = this.vars.length;
        while (i--) {
            var v = this.vars[i], d = v.position() - v.desiredPosition;
            sum += d * d * v.weight;
        }
        return sum;
    };
    return Block;
}());
exports.Block = Block;
var Blocks = (function () {
    function Blocks(vs) {
        this.vs = vs;
        var n = vs.length;
        this.list = new Array(n);
        while (n--) {
            var b = new Block(vs[n]);
            this.list[n] = b;
            b.blockInd = n;
        }
    }
    Blocks.prototype.cost = function () {
        var sum = 0, i = this.list.length;
        while (i--)
            sum += this.list[i].cost();
        return sum;
    };
    Blocks.prototype.insert = function (b) {
        b.blockInd = this.list.length;
        this.list.push(b);
    };
    Blocks.prototype.remove = function (b) {
        var last = this.list.length - 1;
        var swapBlock = this.list[last];
        this.list.length = last;
        if (b !== swapBlock) {
            this.list[b.blockInd] = swapBlock;
            swapBlock.blockInd = b.blockInd;
        }
    };
    Blocks.prototype.merge = function (c) {
        var l = c.left.block, r = c.right.block;
        var dist = c.right.offset - c.left.offset - c.gap;
        if (l.vars.length < r.vars.length) {
            r.mergeAcross(l, c, dist);
            this.remove(l);
        }
        else {
            l.mergeAcross(r, c, -dist);
            this.remove(r);
        }
    };
    Blocks.prototype.forEach = function (f) {
        this.list.forEach(f);
    };
    Blocks.prototype.updateBlockPositions = function () {
        this.list.forEach(function (b) { return b.updateWeightedPosition(); });
    };
    Blocks.prototype.split = function (inactive) {
        var _this = this;
        this.updateBlockPositions();
        this.list.forEach(function (b) {
            var v = b.findMinLM();
            if (v !== null && v.lm < Solver.LAGRANGIAN_TOLERANCE) {
                b = v.left.block;
                Block.split(v).forEach(function (nb) { return _this.insert(nb); });
                _this.remove(b);
                inactive.push(v);
            }
        });
    };
    return Blocks;
}());
exports.Blocks = Blocks;
var Solver = (function () {
    function Solver(vs, cs) {
        this.vs = vs;
        this.cs = cs;
        this.vs = vs;
        vs.forEach(function (v) {
            v.cIn = [], v.cOut = [];
        });
        this.cs = cs;
        cs.forEach(function (c) {
            c.left.cOut.push(c);
            c.right.cIn.push(c);
        });
        this.inactive = cs.map(function (c) { c.active = false; return c; });
        this.bs = null;
    }
    Solver.prototype.cost = function () {
        return this.bs.cost();
    };
    Solver.prototype.setStartingPositions = function (ps) {
        this.inactive = this.cs.map(function (c) { c.active = false; return c; });
        this.bs = new Blocks(this.vs);
        this.bs.forEach(function (b, i) { return b.posn = ps[i]; });
    };
    Solver.prototype.setDesiredPositions = function (ps) {
        this.vs.forEach(function (v, i) { return v.desiredPosition = ps[i]; });
    };
    Solver.prototype.mostViolated = function () {
        var minSlack = Number.MAX_VALUE, v = null, l = this.inactive, n = l.length, deletePoint = n;
        for (var i = 0; i < n; ++i) {
            var c = l[i];
            if (c.unsatisfiable)
                continue;
            var slack = c.slack();
            if (c.equality || slack < minSlack) {
                minSlack = slack;
                v = c;
                deletePoint = i;
                if (c.equality)
                    break;
            }
        }
        if (deletePoint !== n &&
            (minSlack < Solver.ZERO_UPPERBOUND && !v.active || v.equality)) {
            l[deletePoint] = l[n - 1];
            l.length = n - 1;
        }
        return v;
    };
    Solver.prototype.satisfy = function () {
        if (this.bs == null) {
            this.bs = new Blocks(this.vs);
        }
        this.bs.split(this.inactive);
        var v = null;
        while ((v = this.mostViolated()) && (v.equality || v.slack() < Solver.ZERO_UPPERBOUND && !v.active)) {
            var lb = v.left.block, rb = v.right.block;
            if (lb !== rb) {
                this.bs.merge(v);
            }
            else {
                if (lb.isActiveDirectedPathBetween(v.right, v.left)) {
                    v.unsatisfiable = true;
                    continue;
                }
                var split = lb.splitBetween(v.left, v.right);
                if (split !== null) {
                    this.bs.insert(split.lb);
                    this.bs.insert(split.rb);
                    this.bs.remove(lb);
                    this.inactive.push(split.constraint);
                }
                else {
                    v.unsatisfiable = true;
                    continue;
                }
                if (v.slack() >= 0) {
                    this.inactive.push(v);
                }
                else {
                    this.bs.merge(v);
                }
            }
        }
    };
    Solver.prototype.solve = function () {
        this.satisfy();
        var lastcost = Number.MAX_VALUE, cost = this.bs.cost();
        while (Math.abs(lastcost - cost) > 0.0001) {
            this.satisfy();
            lastcost = cost;
            cost = this.bs.cost();
        }
        return cost;
    };
    Solver.LAGRANGIAN_TOLERANCE = -1e-4;
    Solver.ZERO_UPPERBOUND = -1e-10;
    return Solver;
}());
exports.Solver = Solver;
function removeOverlapInOneDimension(spans, lowerBound, upperBound) {
    var vs = spans.map(function (s) { return new Variable(s.desiredCenter); });
    var cs = [];
    var n = spans.length;
    for (var i = 0; i < n - 1; i++) {
        var left = spans[i], right = spans[i + 1];
        cs.push(new Constraint(vs[i], vs[i + 1], (left.size + right.size) / 2));
    }
    var leftMost = vs[0], rightMost = vs[n - 1], leftMostSize = spans[0].size / 2, rightMostSize = spans[n - 1].size / 2;
    var vLower = null, vUpper = null;
    if (lowerBound) {
        vLower = new Variable(lowerBound, leftMost.weight * 1000);
        vs.push(vLower);
        cs.push(new Constraint(vLower, leftMost, leftMostSize));
    }
    if (upperBound) {
        vUpper = new Variable(upperBound, rightMost.weight * 1000);
        vs.push(vUpper);
        cs.push(new Constraint(rightMost, vUpper, rightMostSize));
    }
    var solver = new Solver(vs, cs);
    solver.solve();
    return {
        newCenters: vs.slice(0, spans.length).map(function (v) { return v.position(); }),
        lowerBound: vLower ? vLower.position() : leftMost.position() - leftMostSize,
        upperBound: vUpper ? vUpper.position() : rightMost.position() + rightMostSize
    };
}
exports.removeOverlapInOneDimension = removeOverlapInOneDimension;

},{}]},{},[1])(1)
});

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJkaXN0L2luZGV4LmpzIiwiZGlzdC9zcmMvYWRhcHRvci5qcyIsImRpc3Qvc3JjL2JhdGNoLmpzIiwiZGlzdC9zcmMvZDNhZGFwdG9yLmpzIiwiZGlzdC9zcmMvZDN2M2FkYXB0b3IuanMiLCJkaXN0L3NyYy9kM3Y0YWRhcHRvci5qcyIsImRpc3Qvc3JjL2Rlc2NlbnQuanMiLCJkaXN0L3NyYy9nZW9tLmpzIiwiZGlzdC9zcmMvZ3JpZHJvdXRlci5qcyIsImRpc3Qvc3JjL2hhbmRsZWRpc2Nvbm5lY3RlZC5qcyIsImRpc3Qvc3JjL2xheW91dC5qcyIsImRpc3Qvc3JjL2xheW91dDNkLmpzIiwiZGlzdC9zcmMvbGlua2xlbmd0aHMuanMiLCJkaXN0L3NyYy9wb3dlcmdyYXBoLmpzIiwiZGlzdC9zcmMvcHF1ZXVlLmpzIiwiZGlzdC9zcmMvcmJ0cmVlLmpzIiwiZGlzdC9zcmMvcmVjdGFuZ2xlLmpzIiwiZGlzdC9zcmMvc2hvcnRlc3RwYXRocy5qcyIsImRpc3Qvc3JjL3Zwc2MuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2YUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcmlCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFNQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xqQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1VEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoS0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JZQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbmRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKXtmdW5jdGlvbiByKGUsbix0KXtmdW5jdGlvbiBvKGksZil7aWYoIW5baV0pe2lmKCFlW2ldKXt2YXIgYz1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlO2lmKCFmJiZjKXJldHVybiBjKGksITApO2lmKHUpcmV0dXJuIHUoaSwhMCk7dmFyIGE9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitpK1wiJ1wiKTt0aHJvdyBhLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsYX12YXIgcD1uW2ldPXtleHBvcnRzOnt9fTtlW2ldWzBdLmNhbGwocC5leHBvcnRzLGZ1bmN0aW9uKHIpe3ZhciBuPWVbaV1bMV1bcl07cmV0dXJuIG8obnx8cil9LHAscC5leHBvcnRzLHIsZSxuLHQpfXJldHVybiBuW2ldLmV4cG9ydHN9Zm9yKHZhciB1PVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmUsaT0wO2k8dC5sZW5ndGg7aSsrKW8odFtpXSk7cmV0dXJuIG99cmV0dXJuIHJ9KSgpIiwiXCJ1c2Ugc3RyaWN0XCI7XG5mdW5jdGlvbiBfX2V4cG9ydChtKSB7XG4gICAgZm9yICh2YXIgcCBpbiBtKSBpZiAoIWV4cG9ydHMuaGFzT3duUHJvcGVydHkocCkpIGV4cG9ydHNbcF0gPSBtW3BdO1xufVxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuX19leHBvcnQocmVxdWlyZShcIi4vc3JjL2FkYXB0b3JcIikpO1xuX19leHBvcnQocmVxdWlyZShcIi4vc3JjL2QzYWRhcHRvclwiKSk7XG5fX2V4cG9ydChyZXF1aXJlKFwiLi9zcmMvZGVzY2VudFwiKSk7XG5fX2V4cG9ydChyZXF1aXJlKFwiLi9zcmMvZ2VvbVwiKSk7XG5fX2V4cG9ydChyZXF1aXJlKFwiLi9zcmMvZ3JpZHJvdXRlclwiKSk7XG5fX2V4cG9ydChyZXF1aXJlKFwiLi9zcmMvaGFuZGxlZGlzY29ubmVjdGVkXCIpKTtcbl9fZXhwb3J0KHJlcXVpcmUoXCIuL3NyYy9sYXlvdXRcIikpO1xuX19leHBvcnQocmVxdWlyZShcIi4vc3JjL2xheW91dDNkXCIpKTtcbl9fZXhwb3J0KHJlcXVpcmUoXCIuL3NyYy9saW5rbGVuZ3Roc1wiKSk7XG5fX2V4cG9ydChyZXF1aXJlKFwiLi9zcmMvcG93ZXJncmFwaFwiKSk7XG5fX2V4cG9ydChyZXF1aXJlKFwiLi9zcmMvcHF1ZXVlXCIpKTtcbl9fZXhwb3J0KHJlcXVpcmUoXCIuL3NyYy9yYnRyZWVcIikpO1xuX19leHBvcnQocmVxdWlyZShcIi4vc3JjL3JlY3RhbmdsZVwiKSk7XG5fX2V4cG9ydChyZXF1aXJlKFwiLi9zcmMvc2hvcnRlc3RwYXRoc1wiKSk7XG5fX2V4cG9ydChyZXF1aXJlKFwiLi9zcmMvdnBzY1wiKSk7XG5fX2V4cG9ydChyZXF1aXJlKFwiLi9zcmMvYmF0Y2hcIikpO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9ZGF0YTphcHBsaWNhdGlvbi9qc29uO2Jhc2U2NCxleUoyWlhKemFXOXVJam96TENKbWFXeGxJam9pYVc1a1pYZ3Vhbk1pTENKemIzVnlZMlZTYjI5MElqb2lJaXdpYzI5MWNtTmxjeUk2V3lJdUxpOVhaV0pEYjJ4aEwybHVaR1Y0TG5SeklsMHNJbTVoYldWeklqcGJYU3dpYldGd2NHbHVaM01pT2lJN096czdPMEZCUVVFc2JVTkJRVFpDTzBGQlF6ZENMSEZEUVVFclFqdEJRVU12UWl4dFEwRkJOa0k3UVVGRE4wSXNaME5CUVRCQ08wRkJRekZDTEhORFFVRm5RenRCUVVOb1F5dzRRMEZCZDBNN1FVRkRlRU1zYTBOQlFUUkNPMEZCUXpWQ0xHOURRVUU0UWp0QlFVTTVRaXgxUTBGQmFVTTdRVUZEYWtNc2MwTkJRV2RETzBGQlEyaERMR3REUVVFMFFqdEJRVU0xUWl4clEwRkJORUk3UVVGRE5VSXNjVU5CUVN0Q08wRkJReTlDTEhsRFFVRnRRenRCUVVOdVF5eG5RMEZCTUVJN1FVRkRNVUlzYVVOQlFUSkNJbjA9IiwiXCJ1c2Ugc3RyaWN0XCI7XG52YXIgX19leHRlbmRzID0gKHRoaXMgJiYgdGhpcy5fX2V4dGVuZHMpIHx8IChmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGV4dGVuZFN0YXRpY3MgPSBmdW5jdGlvbiAoZCwgYikge1xuICAgICAgICBleHRlbmRTdGF0aWNzID0gT2JqZWN0LnNldFByb3RvdHlwZU9mIHx8XG4gICAgICAgICAgICAoeyBfX3Byb3RvX186IFtdIH0gaW5zdGFuY2VvZiBBcnJheSAmJiBmdW5jdGlvbiAoZCwgYikgeyBkLl9fcHJvdG9fXyA9IGI7IH0pIHx8XG4gICAgICAgICAgICBmdW5jdGlvbiAoZCwgYikgeyBmb3IgKHZhciBwIGluIGIpIGlmIChiLmhhc093blByb3BlcnR5KHApKSBkW3BdID0gYltwXTsgfTtcbiAgICAgICAgcmV0dXJuIGV4dGVuZFN0YXRpY3MoZCwgYik7XG4gICAgfTtcbiAgICByZXR1cm4gZnVuY3Rpb24gKGQsIGIpIHtcbiAgICAgICAgZXh0ZW5kU3RhdGljcyhkLCBiKTtcbiAgICAgICAgZnVuY3Rpb24gX18oKSB7IHRoaXMuY29uc3RydWN0b3IgPSBkOyB9XG4gICAgICAgIGQucHJvdG90eXBlID0gYiA9PT0gbnVsbCA/IE9iamVjdC5jcmVhdGUoYikgOiAoX18ucHJvdG90eXBlID0gYi5wcm90b3R5cGUsIG5ldyBfXygpKTtcbiAgICB9O1xufSkoKTtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciBsYXlvdXRfMSA9IHJlcXVpcmUoXCIuL2xheW91dFwiKTtcbnZhciBMYXlvdXRBZGFwdG9yID0gKGZ1bmN0aW9uIChfc3VwZXIpIHtcbiAgICBfX2V4dGVuZHMoTGF5b3V0QWRhcHRvciwgX3N1cGVyKTtcbiAgICBmdW5jdGlvbiBMYXlvdXRBZGFwdG9yKG9wdGlvbnMpIHtcbiAgICAgICAgdmFyIF90aGlzID0gX3N1cGVyLmNhbGwodGhpcykgfHwgdGhpcztcbiAgICAgICAgdmFyIHNlbGYgPSBfdGhpcztcbiAgICAgICAgdmFyIG8gPSBvcHRpb25zO1xuICAgICAgICBpZiAoby50cmlnZ2VyKSB7XG4gICAgICAgICAgICBfdGhpcy50cmlnZ2VyID0gby50cmlnZ2VyO1xuICAgICAgICB9XG4gICAgICAgIGlmIChvLmtpY2spIHtcbiAgICAgICAgICAgIF90aGlzLmtpY2sgPSBvLmtpY2s7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG8uZHJhZykge1xuICAgICAgICAgICAgX3RoaXMuZHJhZyA9IG8uZHJhZztcbiAgICAgICAgfVxuICAgICAgICBpZiAoby5vbikge1xuICAgICAgICAgICAgX3RoaXMub24gPSBvLm9uO1xuICAgICAgICB9XG4gICAgICAgIF90aGlzLmRyYWdzdGFydCA9IF90aGlzLmRyYWdTdGFydCA9IGxheW91dF8xLkxheW91dC5kcmFnU3RhcnQ7XG4gICAgICAgIF90aGlzLmRyYWdlbmQgPSBfdGhpcy5kcmFnRW5kID0gbGF5b3V0XzEuTGF5b3V0LmRyYWdFbmQ7XG4gICAgICAgIHJldHVybiBfdGhpcztcbiAgICB9XG4gICAgTGF5b3V0QWRhcHRvci5wcm90b3R5cGUudHJpZ2dlciA9IGZ1bmN0aW9uIChlKSB7IH07XG4gICAgO1xuICAgIExheW91dEFkYXB0b3IucHJvdG90eXBlLmtpY2sgPSBmdW5jdGlvbiAoKSB7IH07XG4gICAgO1xuICAgIExheW91dEFkYXB0b3IucHJvdG90eXBlLmRyYWcgPSBmdW5jdGlvbiAoKSB7IH07XG4gICAgO1xuICAgIExheW91dEFkYXB0b3IucHJvdG90eXBlLm9uID0gZnVuY3Rpb24gKGV2ZW50VHlwZSwgbGlzdGVuZXIpIHsgcmV0dXJuIHRoaXM7IH07XG4gICAgO1xuICAgIHJldHVybiBMYXlvdXRBZGFwdG9yO1xufShsYXlvdXRfMS5MYXlvdXQpKTtcbmV4cG9ydHMuTGF5b3V0QWRhcHRvciA9IExheW91dEFkYXB0b3I7XG5mdW5jdGlvbiBhZGFwdG9yKG9wdGlvbnMpIHtcbiAgICByZXR1cm4gbmV3IExheW91dEFkYXB0b3Iob3B0aW9ucyk7XG59XG5leHBvcnRzLmFkYXB0b3IgPSBhZGFwdG9yO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9ZGF0YTphcHBsaWNhdGlvbi9qc29uO2Jhc2U2NCxleUoyWlhKemFXOXVJam96TENKbWFXeGxJam9pWVdSaGNIUnZjaTVxY3lJc0luTnZkWEpqWlZKdmIzUWlPaUlpTENKemIzVnlZMlZ6SWpwYklpNHVMeTR1TDFkbFlrTnZiR0V2YzNKakwyRmtZWEIwYjNJdWRITWlYU3dpYm1GdFpYTWlPbHRkTENKdFlYQndhVzVuY3lJNklqczdPenM3T3pzN096czdPenM3TzBGQlFVRXNiVU5CUVdsRU8wRkJSVGRETzBsQlFXMURMR2xEUVVGTk8wbEJZWEpETEhWQ1FVRmhMRTlCUVU4N1VVRkJjRUlzV1VGRFNTeHBRa0ZCVHl4VFFYbENWanRSUVhKQ1J5eEpRVUZKTEVsQlFVa3NSMEZCUnl4TFFVRkpMRU5CUVVNN1VVRkRhRUlzU1VGQlNTeERRVUZETEVkQlFVY3NUMEZCVHl4RFFVRkRPMUZCUldoQ0xFbEJRVXNzUTBGQlF5eERRVUZETEU5QlFVOHNSVUZCUnp0WlFVTmlMRXRCUVVrc1EwRkJReXhQUVVGUExFZEJRVWNzUTBGQlF5eERRVUZETEU5QlFVOHNRMEZCUXp0VFFVTTFRanRSUVVWRUxFbEJRVXNzUTBGQlF5eERRVUZETEVsQlFVa3NSVUZCUlR0WlFVTlVMRXRCUVVrc1EwRkJReXhKUVVGSkxFZEJRVWNzUTBGQlF5eERRVUZETEVsQlFVa3NRMEZCUXp0VFFVTjBRanRSUVVWRUxFbEJRVXNzUTBGQlF5eERRVUZETEVsQlFVa3NSVUZCUlR0WlFVTlVMRXRCUVVrc1EwRkJReXhKUVVGSkxFZEJRVWNzUTBGQlF5eERRVUZETEVsQlFVa3NRMEZCUXp0VFFVTjBRanRSUVVWRUxFbEJRVXNzUTBGQlF5eERRVUZETEVWQlFVVXNSVUZCUlR0WlFVTlFMRXRCUVVrc1EwRkJReXhGUVVGRkxFZEJRVWNzUTBGQlF5eERRVUZETEVWQlFVVXNRMEZCUXp0VFFVTnNRanRSUVVWRUxFdEJRVWtzUTBGQlF5eFRRVUZUTEVkQlFVY3NTMEZCU1N4RFFVRkRMRk5CUVZNc1IwRkJSeXhsUVVGTkxFTkJRVU1zVTBGQlV5eERRVUZETzFGQlEyNUVMRXRCUVVrc1EwRkJReXhQUVVGUExFZEJRVWNzUzBGQlNTeERRVUZETEU5QlFVOHNSMEZCUnl4bFFVRk5MRU5CUVVNc1QwRkJUeXhEUVVGRE96dEpRVU5xUkN4RFFVRkRPMGxCY0VORUxDdENRVUZQTEVkQlFWQXNWVUZCVVN4RFFVRlJMRWxCUVVjc1EwRkJRenRKUVVGQkxFTkJRVU03U1VGRGNrSXNORUpCUVVrc1IwRkJTaXhqUVVGUkxFTkJRVU03U1VGQlFTeERRVUZETzBsQlExWXNORUpCUVVrc1IwRkJTaXhqUVVGUkxFTkJRVU03U1VGQlFTeERRVUZETzBsQlExWXNNRUpCUVVVc1IwRkJSaXhWUVVGSExGTkJRVFpDTEVWQlFVVXNVVUZCYjBJc1NVRkJWeXhQUVVGUExFbEJRVWtzUTBGQlF5eERRVUZETEVOQlFVTTdTVUZCUVN4RFFVRkRPMGxCYTBOd1JpeHZRa0ZCUXp0QlFVRkVMRU5CUVVNc1FVRjRRMFFzUTBGQmJVTXNaVUZCVFN4SFFYZERlRU03UVVGNFExa3NjME5CUVdFN1FVRTJRekZDTEZOQlFXZENMRTlCUVU4c1EwRkJSU3hQUVVGUE8wbEJRelZDTEU5QlFVOHNTVUZCU1N4aFFVRmhMRU5CUVVVc1QwRkJUeXhEUVVGRkxFTkJRVU03UVVGRGVFTXNRMEZCUXp0QlFVWkVMREJDUVVWREluMD0iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciBsYXlvdXRfMSA9IHJlcXVpcmUoXCIuL2xheW91dFwiKTtcbnZhciBncmlkcm91dGVyXzEgPSByZXF1aXJlKFwiLi9ncmlkcm91dGVyXCIpO1xuZnVuY3Rpb24gZ3JpZGlmeShwZ0xheW91dCwgbnVkZ2VHYXAsIG1hcmdpbiwgZ3JvdXBNYXJnaW4pIHtcbiAgICBwZ0xheW91dC5jb2xhLnN0YXJ0KDAsIDAsIDAsIDEwLCBmYWxzZSk7XG4gICAgdmFyIGdyaWRyb3V0ZXIgPSByb3V0ZShwZ0xheW91dC5jb2xhLm5vZGVzKCksIHBnTGF5b3V0LmNvbGEuZ3JvdXBzKCksIG1hcmdpbiwgZ3JvdXBNYXJnaW4pO1xuICAgIHJldHVybiBncmlkcm91dGVyLnJvdXRlRWRnZXMocGdMYXlvdXQucG93ZXJHcmFwaC5wb3dlckVkZ2VzLCBudWRnZUdhcCwgZnVuY3Rpb24gKGUpIHsgcmV0dXJuIGUuc291cmNlLnJvdXRlck5vZGUuaWQ7IH0sIGZ1bmN0aW9uIChlKSB7IHJldHVybiBlLnRhcmdldC5yb3V0ZXJOb2RlLmlkOyB9KTtcbn1cbmV4cG9ydHMuZ3JpZGlmeSA9IGdyaWRpZnk7XG5mdW5jdGlvbiByb3V0ZShub2RlcywgZ3JvdXBzLCBtYXJnaW4sIGdyb3VwTWFyZ2luKSB7XG4gICAgbm9kZXMuZm9yRWFjaChmdW5jdGlvbiAoZCkge1xuICAgICAgICBkLnJvdXRlck5vZGUgPSB7XG4gICAgICAgICAgICBuYW1lOiBkLm5hbWUsXG4gICAgICAgICAgICBib3VuZHM6IGQuYm91bmRzLmluZmxhdGUoLW1hcmdpbilcbiAgICAgICAgfTtcbiAgICB9KTtcbiAgICBncm91cHMuZm9yRWFjaChmdW5jdGlvbiAoZCkge1xuICAgICAgICBkLnJvdXRlck5vZGUgPSB7XG4gICAgICAgICAgICBib3VuZHM6IGQuYm91bmRzLmluZmxhdGUoLWdyb3VwTWFyZ2luKSxcbiAgICAgICAgICAgIGNoaWxkcmVuOiAodHlwZW9mIGQuZ3JvdXBzICE9PSAndW5kZWZpbmVkJyA/IGQuZ3JvdXBzLm1hcChmdW5jdGlvbiAoYykgeyByZXR1cm4gbm9kZXMubGVuZ3RoICsgYy5pZDsgfSkgOiBbXSlcbiAgICAgICAgICAgICAgICAuY29uY2F0KHR5cGVvZiBkLmxlYXZlcyAhPT0gJ3VuZGVmaW5lZCcgPyBkLmxlYXZlcy5tYXAoZnVuY3Rpb24gKGMpIHsgcmV0dXJuIGMuaW5kZXg7IH0pIDogW10pXG4gICAgICAgIH07XG4gICAgfSk7XG4gICAgdmFyIGdyaWRSb3V0ZXJOb2RlcyA9IG5vZGVzLmNvbmNhdChncm91cHMpLm1hcChmdW5jdGlvbiAoZCwgaSkge1xuICAgICAgICBkLnJvdXRlck5vZGUuaWQgPSBpO1xuICAgICAgICByZXR1cm4gZC5yb3V0ZXJOb2RlO1xuICAgIH0pO1xuICAgIHJldHVybiBuZXcgZ3JpZHJvdXRlcl8xLkdyaWRSb3V0ZXIoZ3JpZFJvdXRlck5vZGVzLCB7XG4gICAgICAgIGdldENoaWxkcmVuOiBmdW5jdGlvbiAodikgeyByZXR1cm4gdi5jaGlsZHJlbjsgfSxcbiAgICAgICAgZ2V0Qm91bmRzOiBmdW5jdGlvbiAodikgeyByZXR1cm4gdi5ib3VuZHM7IH1cbiAgICB9LCBtYXJnaW4gLSBncm91cE1hcmdpbik7XG59XG5mdW5jdGlvbiBwb3dlckdyYXBoR3JpZExheW91dChncmFwaCwgc2l6ZSwgZ3JvdXBwYWRkaW5nKSB7XG4gICAgdmFyIHBvd2VyR3JhcGg7XG4gICAgZ3JhcGgubm9kZXMuZm9yRWFjaChmdW5jdGlvbiAodiwgaSkgeyByZXR1cm4gdi5pbmRleCA9IGk7IH0pO1xuICAgIG5ldyBsYXlvdXRfMS5MYXlvdXQoKVxuICAgICAgICAuYXZvaWRPdmVybGFwcyhmYWxzZSlcbiAgICAgICAgLm5vZGVzKGdyYXBoLm5vZGVzKVxuICAgICAgICAubGlua3MoZ3JhcGgubGlua3MpXG4gICAgICAgIC5wb3dlckdyYXBoR3JvdXBzKGZ1bmN0aW9uIChkKSB7XG4gICAgICAgIHBvd2VyR3JhcGggPSBkO1xuICAgICAgICBwb3dlckdyYXBoLmdyb3Vwcy5mb3JFYWNoKGZ1bmN0aW9uICh2KSB7IHJldHVybiB2LnBhZGRpbmcgPSBncm91cHBhZGRpbmc7IH0pO1xuICAgIH0pO1xuICAgIHZhciBuID0gZ3JhcGgubm9kZXMubGVuZ3RoO1xuICAgIHZhciBlZGdlcyA9IFtdO1xuICAgIHZhciB2cyA9IGdyYXBoLm5vZGVzLnNsaWNlKDApO1xuICAgIHZzLmZvckVhY2goZnVuY3Rpb24gKHYsIGkpIHsgcmV0dXJuIHYuaW5kZXggPSBpOyB9KTtcbiAgICBwb3dlckdyYXBoLmdyb3Vwcy5mb3JFYWNoKGZ1bmN0aW9uIChnKSB7XG4gICAgICAgIHZhciBzb3VyY2VJbmQgPSBnLmluZGV4ID0gZy5pZCArIG47XG4gICAgICAgIHZzLnB1c2goZyk7XG4gICAgICAgIGlmICh0eXBlb2YgZy5sZWF2ZXMgIT09ICd1bmRlZmluZWQnKVxuICAgICAgICAgICAgZy5sZWF2ZXMuZm9yRWFjaChmdW5jdGlvbiAodikgeyByZXR1cm4gZWRnZXMucHVzaCh7IHNvdXJjZTogc291cmNlSW5kLCB0YXJnZXQ6IHYuaW5kZXggfSk7IH0pO1xuICAgICAgICBpZiAodHlwZW9mIGcuZ3JvdXBzICE9PSAndW5kZWZpbmVkJylcbiAgICAgICAgICAgIGcuZ3JvdXBzLmZvckVhY2goZnVuY3Rpb24gKGdnKSB7IHJldHVybiBlZGdlcy5wdXNoKHsgc291cmNlOiBzb3VyY2VJbmQsIHRhcmdldDogZ2cuaWQgKyBuIH0pOyB9KTtcbiAgICB9KTtcbiAgICBwb3dlckdyYXBoLnBvd2VyRWRnZXMuZm9yRWFjaChmdW5jdGlvbiAoZSkge1xuICAgICAgICBlZGdlcy5wdXNoKHsgc291cmNlOiBlLnNvdXJjZS5pbmRleCwgdGFyZ2V0OiBlLnRhcmdldC5pbmRleCB9KTtcbiAgICB9KTtcbiAgICBuZXcgbGF5b3V0XzEuTGF5b3V0KClcbiAgICAgICAgLnNpemUoc2l6ZSlcbiAgICAgICAgLm5vZGVzKHZzKVxuICAgICAgICAubGlua3MoZWRnZXMpXG4gICAgICAgIC5hdm9pZE92ZXJsYXBzKGZhbHNlKVxuICAgICAgICAubGlua0Rpc3RhbmNlKDMwKVxuICAgICAgICAuc3ltbWV0cmljRGlmZkxpbmtMZW5ndGhzKDUpXG4gICAgICAgIC5jb252ZXJnZW5jZVRocmVzaG9sZCgxZS00KVxuICAgICAgICAuc3RhcnQoMTAwLCAwLCAwLCAwLCBmYWxzZSk7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgY29sYTogbmV3IGxheW91dF8xLkxheW91dCgpXG4gICAgICAgICAgICAuY29udmVyZ2VuY2VUaHJlc2hvbGQoMWUtMylcbiAgICAgICAgICAgIC5zaXplKHNpemUpXG4gICAgICAgICAgICAuYXZvaWRPdmVybGFwcyh0cnVlKVxuICAgICAgICAgICAgLm5vZGVzKGdyYXBoLm5vZGVzKVxuICAgICAgICAgICAgLmxpbmtzKGdyYXBoLmxpbmtzKVxuICAgICAgICAgICAgLmdyb3VwQ29tcGFjdG5lc3MoMWUtNClcbiAgICAgICAgICAgIC5saW5rRGlzdGFuY2UoMzApXG4gICAgICAgICAgICAuc3ltbWV0cmljRGlmZkxpbmtMZW5ndGhzKDUpXG4gICAgICAgICAgICAucG93ZXJHcmFwaEdyb3VwcyhmdW5jdGlvbiAoZCkge1xuICAgICAgICAgICAgcG93ZXJHcmFwaCA9IGQ7XG4gICAgICAgICAgICBwb3dlckdyYXBoLmdyb3Vwcy5mb3JFYWNoKGZ1bmN0aW9uICh2KSB7XG4gICAgICAgICAgICAgICAgdi5wYWRkaW5nID0gZ3JvdXBwYWRkaW5nO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pLnN0YXJ0KDUwLCAwLCAxMDAsIDAsIGZhbHNlKSxcbiAgICAgICAgcG93ZXJHcmFwaDogcG93ZXJHcmFwaFxuICAgIH07XG59XG5leHBvcnRzLnBvd2VyR3JhcGhHcmlkTGF5b3V0ID0gcG93ZXJHcmFwaEdyaWRMYXlvdXQ7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1kYXRhOmFwcGxpY2F0aW9uL2pzb247YmFzZTY0LGV5SjJaWEp6YVc5dUlqb3pMQ0ptYVd4bElqb2lZbUYwWTJndWFuTWlMQ0p6YjNWeVkyVlNiMjkwSWpvaUlpd2ljMjkxY21ObGN5STZXeUl1TGk4dUxpOVhaV0pEYjJ4aEwzTnlZeTlpWVhSamFDNTBjeUpkTENKdVlXMWxjeUk2VzEwc0ltMWhjSEJwYm1keklqb2lPenRCUVVGQkxHMURRVUV5UXp0QlFVTXpReXd5UTBGQmRVTTdRVUZSZGtNc1UwRkJaMElzVDBGQlR5eERRVUZETEZGQlFWRXNSVUZCUlN4UlFVRm5RaXhGUVVGRkxFMUJRV01zUlVGQlJTeFhRVUZ0UWp0SlFVTnVSaXhSUVVGUkxFTkJRVU1zU1VGQlNTeERRVUZETEV0QlFVc3NRMEZCUXl4RFFVRkRMRVZCUVVVc1EwRkJReXhGUVVGRkxFTkJRVU1zUlVGQlJTeEZRVUZGTEVWQlFVVXNTMEZCU3l4RFFVRkRMRU5CUVVNN1NVRkRlRU1zU1VGQlNTeFZRVUZWTEVkQlFVY3NTMEZCU3l4RFFVRkRMRkZCUVZFc1EwRkJReXhKUVVGSkxFTkJRVU1zUzBGQlN5eEZRVUZGTEVWQlFVVXNVVUZCVVN4RFFVRkRMRWxCUVVrc1EwRkJReXhOUVVGTkxFVkJRVVVzUlVGQlJTeE5RVUZOTEVWQlFVVXNWMEZCVnl4RFFVRkRMRU5CUVVNN1NVRkRNMFlzVDBGQlR5eFZRVUZWTEVOQlFVTXNWVUZCVlN4RFFVRk5MRkZCUVZFc1EwRkJReXhWUVVGVkxFTkJRVU1zVlVGQlZTeEZRVUZGTEZGQlFWRXNSVUZCUlN4VlFVRkJMRU5CUVVNc1NVRkJSeXhQUVVGQkxFTkJRVU1zUTBGQlF5eE5RVUZOTEVOQlFVTXNWVUZCVlN4RFFVRkRMRVZCUVVVc1JVRkJkRUlzUTBGQmMwSXNSVUZCUlN4VlFVRkJMRU5CUVVNc1NVRkJSeXhQUVVGQkxFTkJRVU1zUTBGQlF5eE5RVUZOTEVOQlFVTXNWVUZCVlN4RFFVRkRMRVZCUVVVc1JVRkJkRUlzUTBGQmMwSXNRMEZCUXl4RFFVRkRPMEZCUTNoSkxFTkJRVU03UVVGS1JDd3dRa0ZKUXp0QlFVVkVMRk5CUVZNc1MwRkJTeXhEUVVGRExFdEJRVXNzUlVGQlJTeE5RVUZOTEVWQlFVVXNUVUZCWXl4RlFVRkZMRmRCUVcxQ08wbEJRemRFTEV0QlFVc3NRMEZCUXl4UFFVRlBMRU5CUVVNc1ZVRkJRU3hEUVVGRE8xRkJRMWdzUTBGQlF5eERRVUZETEZWQlFWVXNSMEZCVVR0WlFVTm9RaXhKUVVGSkxFVkJRVVVzUTBGQlF5eERRVUZETEVsQlFVazdXVUZEV2l4TlFVRk5MRVZCUVVVc1EwRkJReXhEUVVGRExFMUJRVTBzUTBGQlF5eFBRVUZQTEVOQlFVTXNRMEZCUXl4TlFVRk5MRU5CUVVNN1UwRkRjRU1zUTBGQlF6dEpRVU5PTEVOQlFVTXNRMEZCUXl4RFFVRkRPMGxCUTBnc1RVRkJUU3hEUVVGRExFOUJRVThzUTBGQlF5eFZRVUZCTEVOQlFVTTdVVUZEV2l4RFFVRkRMRU5CUVVNc1ZVRkJWU3hIUVVGUk8xbEJRMmhDTEUxQlFVMHNSVUZCUlN4RFFVRkRMRU5CUVVNc1RVRkJUU3hEUVVGRExFOUJRVThzUTBGQlF5eERRVUZETEZkQlFWY3NRMEZCUXp0WlFVTjBReXhSUVVGUkxFVkJRVVVzUTBGQlF5eFBRVUZQTEVOQlFVTXNRMEZCUXl4TlFVRk5MRXRCUVVzc1YwRkJWeXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNUVUZCVFN4RFFVRkRMRWRCUVVjc1EwRkJReXhWUVVGQkxFTkJRVU1zU1VGQlJ5eFBRVUZCTEV0QlFVc3NRMEZCUXl4TlFVRk5MRWRCUVVjc1EwRkJReXhEUVVGRExFVkJRVVVzUlVGQmJrSXNRMEZCYlVJc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eEZRVUZGTEVOQlFVTTdhVUpCUTI1R0xFMUJRVTBzUTBGQlF5eFBRVUZQTEVOQlFVTXNRMEZCUXl4TlFVRk5MRXRCUVVzc1YwRkJWeXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNUVUZCVFN4RFFVRkRMRWRCUVVjc1EwRkJReXhWUVVGQkxFTkJRVU1zU1VGQlJ5eFBRVUZCTEVOQlFVTXNRMEZCUXl4TFFVRkxMRVZCUVZBc1EwRkJUeXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVWQlFVVXNRMEZCUXp0VFFVTm9SaXhEUVVGRE8wbEJRMDRzUTBGQlF5eERRVUZETEVOQlFVTTdTVUZEU0N4SlFVRkpMR1ZCUVdVc1IwRkJSeXhMUVVGTExFTkJRVU1zVFVGQlRTeERRVUZETEUxQlFVMHNRMEZCUXl4RFFVRkRMRWRCUVVjc1EwRkJReXhWUVVGRExFTkJRVU1zUlVGQlJTeERRVUZETzFGQlEyaEVMRU5CUVVNc1EwRkJReXhWUVVGVkxFTkJRVU1zUlVGQlJTeEhRVUZITEVOQlFVTXNRMEZCUXp0UlFVTndRaXhQUVVGUExFTkJRVU1zUTBGQlF5eFZRVUZWTEVOQlFVTTdTVUZEZUVJc1EwRkJReXhEUVVGRExFTkJRVU03U1VGRFNDeFBRVUZQTEVsQlFVa3NkVUpCUVZVc1EwRkJReXhsUVVGbExFVkJRVVU3VVVGRGJrTXNWMEZCVnl4RlFVRkZMRlZCUVVNc1EwRkJUU3hKUVVGTExFOUJRVUVzUTBGQlF5eERRVUZETEZGQlFWRXNSVUZCVml4RFFVRlZPMUZCUTI1RExGTkJRVk1zUlVGQlJTeFZRVUZCTEVOQlFVTXNTVUZCU1N4UFFVRkJMRU5CUVVNc1EwRkJReXhOUVVGTkxFVkJRVklzUTBGQlVUdExRVU16UWl4RlFVRkZMRTFCUVUwc1IwRkJSeXhYUVVGWExFTkJRVU1zUTBGQlF6dEJRVU0zUWl4RFFVRkRPMEZCUlVRc1UwRkJaMElzYjBKQlFXOUNMRU5CUTJoRExFdEJRVFpETEVWQlF6ZERMRWxCUVdNc1JVRkRaQ3haUVVGdlFqdEpRVWR3UWl4SlFVRkpMRlZCUVZVc1EwRkJRenRKUVVObUxFdEJRVXNzUTBGQlF5eExRVUZMTEVOQlFVTXNUMEZCVHl4RFFVRkRMRlZCUVVNc1EwRkJReXhGUVVGRExFTkJRVU1zU1VGQlN5eFBRVUZOTEVOQlFVVXNRMEZCUXl4TFFVRkxMRWRCUVVjc1EwRkJReXhGUVVGc1FpeERRVUZyUWl4RFFVRkRMRU5CUVVNN1NVRkRha1FzU1VGQlNTeGxRVUZOTEVWQlFVVTdVMEZEVUN4aFFVRmhMRU5CUVVNc1MwRkJTeXhEUVVGRE8xTkJRM0JDTEV0QlFVc3NRMEZCUXl4TFFVRkxMRU5CUVVNc1MwRkJTeXhEUVVGRE8xTkJRMnhDTEV0QlFVc3NRMEZCUXl4TFFVRkxMRU5CUVVNc1MwRkJTeXhEUVVGRE8xTkJRMnhDTEdkQ1FVRm5RaXhEUVVGRExGVkJRVlVzUTBGQlF6dFJRVU42UWl4VlFVRlZMRWRCUVVjc1EwRkJReXhEUVVGRE8xRkJRMllzVlVGQlZTeERRVUZETEUxQlFVMHNRMEZCUXl4UFFVRlBMRU5CUVVNc1ZVRkJRU3hEUVVGRExFbEJRVWNzVDBGQlFTeERRVUZETEVOQlFVTXNUMEZCVHl4SFFVRkhMRmxCUVZrc1JVRkJlRUlzUTBGQmQwSXNRMEZCUXl4RFFVRkRPMGxCUXpWRUxFTkJRVU1zUTBGQlF5eERRVUZETzBsQlNWQXNTVUZCU1N4RFFVRkRMRWRCUVVjc1MwRkJTeXhEUVVGRExFdEJRVXNzUTBGQlF5eE5RVUZOTEVOQlFVTTdTVUZETTBJc1NVRkJTU3hMUVVGTExFZEJRVWNzUlVGQlJTeERRVUZETzBsQlEyWXNTVUZCU1N4RlFVRkZMRWRCUVVjc1MwRkJTeXhEUVVGRExFdEJRVXNzUTBGQlF5eExRVUZMTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1NVRkRPVUlzUlVGQlJTeERRVUZETEU5QlFVOHNRMEZCUXl4VlFVRkRMRU5CUVVNc1JVRkJSU3hEUVVGRExFbEJRVXNzVDBGQlRTeERRVUZGTEVOQlFVTXNTMEZCU3l4SFFVRkhMRU5CUVVNc1JVRkJiRUlzUTBGQmEwSXNRMEZCUXl4RFFVRkRPMGxCUTNwRExGVkJRVlVzUTBGQlF5eE5RVUZOTEVOQlFVTXNUMEZCVHl4RFFVRkRMRlZCUVVFc1EwRkJRenRSUVVOMlFpeEpRVUZKTEZOQlFWTXNSMEZCUnl4RFFVRkRMRU5CUVVNc1MwRkJTeXhIUVVGSExFTkJRVU1zUTBGQlF5eEZRVUZGTEVkQlFVY3NRMEZCUXl4RFFVRkRPMUZCUTI1RExFVkJRVVVzUTBGQlF5eEpRVUZKTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1VVRkRXQ3hKUVVGSkxFOUJRVThzUTBGQlF5eERRVUZETEUxQlFVMHNTMEZCU3l4WFFVRlhPMWxCUXk5Q0xFTkJRVU1zUTBGQlF5eE5RVUZOTEVOQlFVTXNUMEZCVHl4RFFVRkRMRlZCUVVFc1EwRkJReXhKUVVGSkxFOUJRVUVzUzBGQlN5eERRVUZETEVsQlFVa3NRMEZCUXl4RlFVRkZMRTFCUVUwc1JVRkJSU3hUUVVGVExFVkJRVVVzVFVGQlRTeEZRVUZGTEVOQlFVTXNRMEZCUXl4TFFVRkxMRVZCUVVVc1EwRkJReXhGUVVGc1JDeERRVUZyUkN4RFFVRkRMRU5CUVVNN1VVRkRPVVVzU1VGQlNTeFBRVUZQTEVOQlFVTXNRMEZCUXl4TlFVRk5MRXRCUVVzc1YwRkJWenRaUVVNdlFpeERRVUZETEVOQlFVTXNUVUZCVFN4RFFVRkRMRTlCUVU4c1EwRkJReXhWUVVGQkxFVkJRVVVzU1VGQlNTeFBRVUZCTEV0QlFVc3NRMEZCUXl4SlFVRkpMRU5CUVVNc1JVRkJSU3hOUVVGTkxFVkJRVVVzVTBGQlV5eEZRVUZGTEUxQlFVMHNSVUZCUlN4RlFVRkZMRU5CUVVNc1JVRkJSU3hIUVVGSExFTkJRVU1zUlVGQlJTeERRVUZETEVWQlFYQkVMRU5CUVc5RUxFTkJRVU1zUTBGQlF6dEpRVU55Uml4RFFVRkRMRU5CUVVNc1EwRkJRenRKUVVOSUxGVkJRVlVzUTBGQlF5eFZRVUZWTEVOQlFVTXNUMEZCVHl4RFFVRkRMRlZCUVVFc1EwRkJRenRSUVVNelFpeExRVUZMTEVOQlFVTXNTVUZCU1N4RFFVRkRMRVZCUVVVc1RVRkJUU3hGUVVGRkxFTkJRVU1zUTBGQlF5eE5RVUZOTEVOQlFVTXNTMEZCU3l4RlFVRkZMRTFCUVUwc1JVRkJSU3hEUVVGRExFTkJRVU1zVFVGQlRTeERRVUZETEV0QlFVc3NSVUZCUlN4RFFVRkRMRU5CUVVNN1NVRkRia1VzUTBGQlF5eERRVUZETEVOQlFVTTdTVUZIU0N4SlFVRkpMR1ZCUVUwc1JVRkJSVHRUUVVOUUxFbEJRVWtzUTBGQlF5eEpRVUZKTEVOQlFVTTdVMEZEVml4TFFVRkxMRU5CUVVNc1JVRkJSU3hEUVVGRE8xTkJRMVFzUzBGQlN5eERRVUZETEV0QlFVc3NRMEZCUXp0VFFVTmFMR0ZCUVdFc1EwRkJReXhMUVVGTExFTkJRVU03VTBGRGNFSXNXVUZCV1N4RFFVRkRMRVZCUVVVc1EwRkJRenRUUVVOb1FpeDNRa0ZCZDBJc1EwRkJReXhEUVVGRExFTkJRVU03VTBGRE0wSXNiMEpCUVc5Q0xFTkJRVU1zU1VGQlNTeERRVUZETzFOQlF6RkNMRXRCUVVzc1EwRkJReXhIUVVGSExFVkJRVVVzUTBGQlF5eEZRVUZGTEVOQlFVTXNSVUZCUlN4RFFVRkRMRVZCUVVVc1MwRkJTeXhEUVVGRExFTkJRVU03U1VGTGFFTXNUMEZCVHp0UlFVTklMRWxCUVVrc1JVRkRRU3hKUVVGSkxHVkJRVTBzUlVGQlJUdGhRVU5ZTEc5Q1FVRnZRaXhEUVVGRExFbEJRVWtzUTBGQlF6dGhRVU14UWl4SlFVRkpMRU5CUVVNc1NVRkJTU3hEUVVGRE8yRkJRMVlzWVVGQllTeERRVUZETEVsQlFVa3NRMEZCUXp0aFFVTnVRaXhMUVVGTExFTkJRVU1zUzBGQlN5eERRVUZETEV0QlFVc3NRMEZCUXp0aFFVTnNRaXhMUVVGTExFTkJRVU1zUzBGQlN5eERRVUZETEV0QlFVc3NRMEZCUXp0aFFVVnNRaXhuUWtGQlowSXNRMEZCUXl4SlFVRkpMRU5CUVVNN1lVRkRkRUlzV1VGQldTeERRVUZETEVWQlFVVXNRMEZCUXp0aFFVTm9RaXgzUWtGQmQwSXNRMEZCUXl4RFFVRkRMRU5CUVVNN1lVRkRNMElzWjBKQlFXZENMRU5CUVVNc1ZVRkJWU3hEUVVGRE8xbEJRM3BDTEZWQlFWVXNSMEZCUnl4RFFVRkRMRU5CUVVNN1dVRkRaaXhWUVVGVkxFTkJRVU1zVFVGQlRTeERRVUZETEU5QlFVOHNRMEZCUXl4VlFVRlZMRU5CUVVNN1owSkJRMnBETEVOQlFVTXNRMEZCUXl4UFFVRlBMRWRCUVVjc1dVRkJXU3hEUVVGQk8xbEJRelZDTEVOQlFVTXNRMEZCUXl4RFFVRkRPMUZCUTFBc1EwRkJReXhEUVVGRExFTkJRVU1zUzBGQlN5eERRVUZETEVWQlFVVXNSVUZCUlN4RFFVRkRMRVZCUVVVc1IwRkJSeXhGUVVGRkxFTkJRVU1zUlVGQlJTeExRVUZMTEVOQlFVTTdVVUZEYkVNc1ZVRkJWU3hGUVVGRkxGVkJRVlU3UzBGRGVrSXNRMEZCUXp0QlFVTk9MRU5CUVVNN1FVRnlSVVFzYjBSQmNVVkRJbjA9IiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgZDN2MyA9IHJlcXVpcmUoXCIuL2QzdjNhZGFwdG9yXCIpO1xudmFyIGQzdjQgPSByZXF1aXJlKFwiLi9kM3Y0YWRhcHRvclwiKTtcbjtcbmZ1bmN0aW9uIGQzYWRhcHRvcihkM0NvbnRleHQpIHtcbiAgICBpZiAoIWQzQ29udGV4dCB8fCBpc0QzVjMoZDNDb250ZXh0KSkge1xuICAgICAgICByZXR1cm4gbmV3IGQzdjMuRDNTdHlsZUxheW91dEFkYXB0b3IoKTtcbiAgICB9XG4gICAgcmV0dXJuIG5ldyBkM3Y0LkQzU3R5bGVMYXlvdXRBZGFwdG9yKGQzQ29udGV4dCk7XG59XG5leHBvcnRzLmQzYWRhcHRvciA9IGQzYWRhcHRvcjtcbmZ1bmN0aW9uIGlzRDNWMyhkM0NvbnRleHQpIHtcbiAgICB2YXIgdjNleHAgPSAvXjNcXC4vO1xuICAgIHJldHVybiBkM0NvbnRleHQudmVyc2lvbiAmJiBkM0NvbnRleHQudmVyc2lvbi5tYXRjaCh2M2V4cCkgIT09IG51bGw7XG59XG4vLyMgc291cmNlTWFwcGluZ1VSTD1kYXRhOmFwcGxpY2F0aW9uL2pzb247YmFzZTY0LGV5SjJaWEp6YVc5dUlqb3pMQ0ptYVd4bElqb2laRE5oWkdGd2RHOXlMbXB6SWl3aWMyOTFjbU5sVW05dmRDSTZJaUlzSW5OdmRYSmpaWE1pT2xzaUxpNHZMaTR2VjJWaVEyOXNZUzl6Y21NdlpETmhaR0Z3ZEc5eUxuUnpJbDBzSW01aGJXVnpJanBiWFN3aWJXRndjR2x1WjNNaU9pSTdPMEZCUVVFc2IwTkJRWEZETzBGQlEzSkRMRzlEUVVGeFF6dEJRVWRWTEVOQlFVTTdRVUUwUW1oRUxGTkJRV2RDTEZOQlFWTXNRMEZCUXl4VFFVRjNRenRKUVVNNVJDeEpRVUZKTEVOQlFVTXNVMEZCVXl4SlFVRkpMRTFCUVUwc1EwRkJReXhUUVVGVExFTkJRVU1zUlVGQlJUdFJRVU5xUXl4UFFVRlBMRWxCUVVrc1NVRkJTU3hEUVVGRExHOUNRVUZ2UWl4RlFVRkZMRU5CUVVNN1MwRkRNVU03U1VGRFJDeFBRVUZQTEVsQlFVa3NTVUZCU1N4RFFVRkRMRzlDUVVGdlFpeERRVUZETEZOQlFWTXNRMEZCUXl4RFFVRkRPMEZCUTNCRUxFTkJRVU03UVVGTVJDdzRRa0ZMUXp0QlFVVkVMRk5CUVZNc1RVRkJUU3hEUVVGRExGTkJRWFZETzBsQlEyNUVMRWxCUVUwc1MwRkJTeXhIUVVGSExFMUJRVTBzUTBGQlF6dEpRVU55UWl4UFFVRmhMRk5CUVZVc1EwRkJReXhQUVVGUExFbEJRVlVzVTBGQlZTeERRVUZETEU5QlFVOHNRMEZCUXl4TFFVRkxMRU5CUVVNc1MwRkJTeXhEUVVGRExFdEJRVXNzU1VGQlNTeERRVUZETzBGQlEzUkdMRU5CUVVNaWZRPT0iLCJcInVzZSBzdHJpY3RcIjtcbnZhciBfX2V4dGVuZHMgPSAodGhpcyAmJiB0aGlzLl9fZXh0ZW5kcykgfHwgKGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgZXh0ZW5kU3RhdGljcyA9IGZ1bmN0aW9uIChkLCBiKSB7XG4gICAgICAgIGV4dGVuZFN0YXRpY3MgPSBPYmplY3Quc2V0UHJvdG90eXBlT2YgfHxcbiAgICAgICAgICAgICh7IF9fcHJvdG9fXzogW10gfSBpbnN0YW5jZW9mIEFycmF5ICYmIGZ1bmN0aW9uIChkLCBiKSB7IGQuX19wcm90b19fID0gYjsgfSkgfHxcbiAgICAgICAgICAgIGZ1bmN0aW9uIChkLCBiKSB7IGZvciAodmFyIHAgaW4gYikgaWYgKGIuaGFzT3duUHJvcGVydHkocCkpIGRbcF0gPSBiW3BdOyB9O1xuICAgICAgICByZXR1cm4gZXh0ZW5kU3RhdGljcyhkLCBiKTtcbiAgICB9O1xuICAgIHJldHVybiBmdW5jdGlvbiAoZCwgYikge1xuICAgICAgICBleHRlbmRTdGF0aWNzKGQsIGIpO1xuICAgICAgICBmdW5jdGlvbiBfXygpIHsgdGhpcy5jb25zdHJ1Y3RvciA9IGQ7IH1cbiAgICAgICAgZC5wcm90b3R5cGUgPSBiID09PSBudWxsID8gT2JqZWN0LmNyZWF0ZShiKSA6IChfXy5wcm90b3R5cGUgPSBiLnByb3RvdHlwZSwgbmV3IF9fKCkpO1xuICAgIH07XG59KSgpO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIGxheW91dF8xID0gcmVxdWlyZShcIi4vbGF5b3V0XCIpO1xudmFyIEQzU3R5bGVMYXlvdXRBZGFwdG9yID0gKGZ1bmN0aW9uIChfc3VwZXIpIHtcbiAgICBfX2V4dGVuZHMoRDNTdHlsZUxheW91dEFkYXB0b3IsIF9zdXBlcik7XG4gICAgZnVuY3Rpb24gRDNTdHlsZUxheW91dEFkYXB0b3IoKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IF9zdXBlci5jYWxsKHRoaXMpIHx8IHRoaXM7XG4gICAgICAgIF90aGlzLmV2ZW50ID0gZDMuZGlzcGF0Y2gobGF5b3V0XzEuRXZlbnRUeXBlW2xheW91dF8xLkV2ZW50VHlwZS5zdGFydF0sIGxheW91dF8xLkV2ZW50VHlwZVtsYXlvdXRfMS5FdmVudFR5cGUudGlja10sIGxheW91dF8xLkV2ZW50VHlwZVtsYXlvdXRfMS5FdmVudFR5cGUuZW5kXSk7XG4gICAgICAgIHZhciBkM2xheW91dCA9IF90aGlzO1xuICAgICAgICB2YXIgZHJhZztcbiAgICAgICAgX3RoaXMuZHJhZyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlmICghZHJhZykge1xuICAgICAgICAgICAgICAgIHZhciBkcmFnID0gZDMuYmVoYXZpb3IuZHJhZygpXG4gICAgICAgICAgICAgICAgICAgIC5vcmlnaW4obGF5b3V0XzEuTGF5b3V0LmRyYWdPcmlnaW4pXG4gICAgICAgICAgICAgICAgICAgIC5vbihcImRyYWdzdGFydC5kM2FkYXB0b3JcIiwgbGF5b3V0XzEuTGF5b3V0LmRyYWdTdGFydClcbiAgICAgICAgICAgICAgICAgICAgLm9uKFwiZHJhZy5kM2FkYXB0b3JcIiwgZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgICAgICAgICAgICAgbGF5b3V0XzEuTGF5b3V0LmRyYWcoZCwgZDMuZXZlbnQpO1xuICAgICAgICAgICAgICAgICAgICBkM2xheW91dC5yZXN1bWUoKTtcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICAub24oXCJkcmFnZW5kLmQzYWRhcHRvclwiLCBsYXlvdXRfMS5MYXlvdXQuZHJhZ0VuZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpXG4gICAgICAgICAgICAgICAgcmV0dXJuIGRyYWc7XG4gICAgICAgICAgICB0aGlzXG4gICAgICAgICAgICAgICAgLmNhbGwoZHJhZyk7XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiBfdGhpcztcbiAgICB9XG4gICAgRDNTdHlsZUxheW91dEFkYXB0b3IucHJvdG90eXBlLnRyaWdnZXIgPSBmdW5jdGlvbiAoZSkge1xuICAgICAgICB2YXIgZDNldmVudCA9IHsgdHlwZTogbGF5b3V0XzEuRXZlbnRUeXBlW2UudHlwZV0sIGFscGhhOiBlLmFscGhhLCBzdHJlc3M6IGUuc3RyZXNzIH07XG4gICAgICAgIHRoaXMuZXZlbnRbZDNldmVudC50eXBlXShkM2V2ZW50KTtcbiAgICB9O1xuICAgIEQzU3R5bGVMYXlvdXRBZGFwdG9yLnByb3RvdHlwZS5raWNrID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICBkMy50aW1lcihmdW5jdGlvbiAoKSB7IHJldHVybiBfc3VwZXIucHJvdG90eXBlLnRpY2suY2FsbChfdGhpcyk7IH0pO1xuICAgIH07XG4gICAgRDNTdHlsZUxheW91dEFkYXB0b3IucHJvdG90eXBlLm9uID0gZnVuY3Rpb24gKGV2ZW50VHlwZSwgbGlzdGVuZXIpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBldmVudFR5cGUgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICB0aGlzLmV2ZW50Lm9uKGV2ZW50VHlwZSwgbGlzdGVuZXIpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5ldmVudC5vbihsYXlvdXRfMS5FdmVudFR5cGVbZXZlbnRUeXBlXSwgbGlzdGVuZXIpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgcmV0dXJuIEQzU3R5bGVMYXlvdXRBZGFwdG9yO1xufShsYXlvdXRfMS5MYXlvdXQpKTtcbmV4cG9ydHMuRDNTdHlsZUxheW91dEFkYXB0b3IgPSBEM1N0eWxlTGF5b3V0QWRhcHRvcjtcbmZ1bmN0aW9uIGQzYWRhcHRvcigpIHtcbiAgICByZXR1cm4gbmV3IEQzU3R5bGVMYXlvdXRBZGFwdG9yKCk7XG59XG5leHBvcnRzLmQzYWRhcHRvciA9IGQzYWRhcHRvcjtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWRhdGE6YXBwbGljYXRpb24vanNvbjtiYXNlNjQsZXlKMlpYSnphVzl1SWpvekxDSm1hV3hsSWpvaVpETjJNMkZrWVhCMGIzSXVhbk1pTENKemIzVnlZMlZTYjI5MElqb2lJaXdpYzI5MWNtTmxjeUk2V3lJdUxpOHVMaTlYWldKRGIyeGhMM055WXk5a00zWXpZV1JoY0hSdmNpNTBjeUpkTENKdVlXMWxjeUk2VzEwc0ltMWhjSEJwYm1keklqb2lPenM3T3pzN096czdPenM3T3pzN1FVRk5RU3h0UTBGQmEwUTdRVUZIT1VNN1NVRkJNRU1zZDBOQlFVMDdTVUZuUWpWRE8xRkJRVUVzV1VGRFNTeHBRa0ZCVHl4VFFYVkNWanRSUVhaRFJDeFhRVUZMTEVkQlFVY3NSVUZCUlN4RFFVRkRMRkZCUVZFc1EwRkJReXhyUWtGQlV5eERRVUZETEd0Q1FVRlRMRU5CUVVNc1MwRkJTeXhEUVVGRExFVkJRVVVzYTBKQlFWTXNRMEZCUXl4clFrRkJVeXhEUVVGRExFbEJRVWtzUTBGQlF5eEZRVUZGTEd0Q1FVRlRMRU5CUVVNc2EwSkJRVk1zUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXl4RFFVRkRPMUZCYTBKcVJ5eEpRVUZKTEZGQlFWRXNSMEZCUnl4TFFVRkpMRU5CUVVNN1VVRkRjRUlzU1VGQlNTeEpRVUZKTEVOQlFVTTdVVUZEVkN4TFFVRkpMRU5CUVVNc1NVRkJTU3hIUVVGSE8xbEJRMUlzU1VGQlNTeERRVUZETEVsQlFVa3NSVUZCUlR0blFrRkRVQ3hKUVVGSkxFbEJRVWtzUjBGQlJ5eEZRVUZGTEVOQlFVTXNVVUZCVVN4RFFVRkRMRWxCUVVrc1JVRkJSVHR4UWtGRGVFSXNUVUZCVFN4RFFVRkRMR1ZCUVUwc1EwRkJReXhWUVVGVkxFTkJRVU03Y1VKQlEzcENMRVZCUVVVc1EwRkJReXh4UWtGQmNVSXNSVUZCUlN4bFFVRk5MRU5CUVVNc1UwRkJVeXhEUVVGRE8zRkNRVU16UXl4RlFVRkZMRU5CUVVNc1owSkJRV2RDTEVWQlFVVXNWVUZCUVN4RFFVRkRPMjlDUVVOdVFpeGxRVUZOTEVOQlFVTXNTVUZCU1N4RFFVRkRMRU5CUVVNc1JVRkJUeXhGUVVGRkxFTkJRVU1zUzBGQlN5eERRVUZETEVOQlFVTTdiMEpCUXpsQ0xGRkJRVkVzUTBGQlF5eE5RVUZOTEVWQlFVVXNRMEZCUXp0blFrRkRkRUlzUTBGQlF5eERRVUZETzNGQ1FVTkVMRVZCUVVVc1EwRkJReXh0UWtGQmJVSXNSVUZCUlN4bFFVRk5MRU5CUVVNc1QwRkJUeXhEUVVGRExFTkJRVU03WVVGRGFFUTdXVUZGUkN4SlFVRkpMRU5CUVVNc1UwRkJVeXhEUVVGRExFMUJRVTA3WjBKQlFVVXNUMEZCVHl4SlFVRkpMRU5CUVVNN1dVRkhia01zU1VGQlNUdHBRa0ZGUXl4SlFVRkpMRU5CUVVNc1NVRkJTU3hEUVVGRExFTkJRVU03VVVGRGNFSXNRMEZCUXl4RFFVRkJPenRKUVVOTUxFTkJRVU03U1VGeVEwUXNjME5CUVU4c1IwRkJVQ3hWUVVGUkxFTkJRVkU3VVVGRFdpeEpRVUZKTEU5QlFVOHNSMEZCUnl4RlFVRkZMRWxCUVVrc1JVRkJSU3hyUWtGQlV5eERRVUZETEVOQlFVTXNRMEZCUXl4SlFVRkpMRU5CUVVNc1JVRkJSU3hMUVVGTExFVkJRVVVzUTBGQlF5eERRVUZETEV0QlFVc3NSVUZCUlN4TlFVRk5MRVZCUVVVc1EwRkJReXhEUVVGRExFMUJRVTBzUlVGQlJTeERRVUZETzFGQlF6VkZMRWxCUVVrc1EwRkJReXhMUVVGTExFTkJRVU1zVDBGQlR5eERRVUZETEVsQlFVa3NRMEZCUXl4RFFVRkRMRTlCUVU4c1EwRkJReXhEUVVGRE8wbEJRM1JETEVOQlFVTTdTVUZIUkN4dFEwRkJTU3hIUVVGS08xRkJRVUVzYVVKQlJVTTdVVUZFUnl4RlFVRkZMRU5CUVVNc1MwRkJTeXhEUVVGRExHTkJRVTBzVDBGQlFTeHBRa0ZCVFN4SlFVRkpMRmxCUVVVc1JVRkJXaXhEUVVGWkxFTkJRVU1zUTBGQlF6dEpRVU5xUXl4RFFVRkRPMGxCWjBORUxHbERRVUZGTEVkQlFVWXNWVUZCUnl4VFFVRTJRaXhGUVVGRkxGRkJRVzlDTzFGQlEyeEVMRWxCUVVrc1QwRkJUeXhUUVVGVExFdEJRVXNzVVVGQlVTeEZRVUZGTzFsQlF5OUNMRWxCUVVrc1EwRkJReXhMUVVGTExFTkJRVU1zUlVGQlJTeERRVUZETEZOQlFWTXNSVUZCUlN4UlFVRlJMRU5CUVVNc1EwRkJRenRUUVVOMFF6dGhRVUZOTzFsQlEwZ3NTVUZCU1N4RFFVRkRMRXRCUVVzc1EwRkJReXhGUVVGRkxFTkJRVU1zYTBKQlFWTXNRMEZCUXl4VFFVRlRMRU5CUVVNc1JVRkJSU3hSUVVGUkxFTkJRVU1zUTBGQlF6dFRRVU5xUkR0UlFVTkVMRTlCUVU4c1NVRkJTU3hEUVVGRE8wbEJRMmhDTEVOQlFVTTdTVUZEVEN3eVFrRkJRenRCUVVGRUxFTkJRVU1zUVVGdVJFUXNRMEZCTUVNc1pVRkJUU3hIUVcxRUwwTTdRVUZ1UkZrc2IwUkJRVzlDTzBGQmFVVnFReXhUUVVGblFpeFRRVUZUTzBsQlEzSkNMRTlCUVU4c1NVRkJTU3h2UWtGQmIwSXNSVUZCUlN4RFFVRkRPMEZCUTNSRExFTkJRVU03UVVGR1JDdzRRa0ZGUXlKOSIsIlwidXNlIHN0cmljdFwiO1xudmFyIF9fZXh0ZW5kcyA9ICh0aGlzICYmIHRoaXMuX19leHRlbmRzKSB8fCAoZnVuY3Rpb24gKCkge1xuICAgIHZhciBleHRlbmRTdGF0aWNzID0gZnVuY3Rpb24gKGQsIGIpIHtcbiAgICAgICAgZXh0ZW5kU3RhdGljcyA9IE9iamVjdC5zZXRQcm90b3R5cGVPZiB8fFxuICAgICAgICAgICAgKHsgX19wcm90b19fOiBbXSB9IGluc3RhbmNlb2YgQXJyYXkgJiYgZnVuY3Rpb24gKGQsIGIpIHsgZC5fX3Byb3RvX18gPSBiOyB9KSB8fFxuICAgICAgICAgICAgZnVuY3Rpb24gKGQsIGIpIHsgZm9yICh2YXIgcCBpbiBiKSBpZiAoYi5oYXNPd25Qcm9wZXJ0eShwKSkgZFtwXSA9IGJbcF07IH07XG4gICAgICAgIHJldHVybiBleHRlbmRTdGF0aWNzKGQsIGIpO1xuICAgIH07XG4gICAgcmV0dXJuIGZ1bmN0aW9uIChkLCBiKSB7XG4gICAgICAgIGV4dGVuZFN0YXRpY3MoZCwgYik7XG4gICAgICAgIGZ1bmN0aW9uIF9fKCkgeyB0aGlzLmNvbnN0cnVjdG9yID0gZDsgfVxuICAgICAgICBkLnByb3RvdHlwZSA9IGIgPT09IG51bGwgPyBPYmplY3QuY3JlYXRlKGIpIDogKF9fLnByb3RvdHlwZSA9IGIucHJvdG90eXBlLCBuZXcgX18oKSk7XG4gICAgfTtcbn0pKCk7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgbGF5b3V0XzEgPSByZXF1aXJlKFwiLi9sYXlvdXRcIik7XG52YXIgRDNTdHlsZUxheW91dEFkYXB0b3IgPSAoZnVuY3Rpb24gKF9zdXBlcikge1xuICAgIF9fZXh0ZW5kcyhEM1N0eWxlTGF5b3V0QWRhcHRvciwgX3N1cGVyKTtcbiAgICBmdW5jdGlvbiBEM1N0eWxlTGF5b3V0QWRhcHRvcihkM0NvbnRleHQpIHtcbiAgICAgICAgdmFyIF90aGlzID0gX3N1cGVyLmNhbGwodGhpcykgfHwgdGhpcztcbiAgICAgICAgX3RoaXMuZDNDb250ZXh0ID0gZDNDb250ZXh0O1xuICAgICAgICBfdGhpcy5ldmVudCA9IGQzQ29udGV4dC5kaXNwYXRjaChsYXlvdXRfMS5FdmVudFR5cGVbbGF5b3V0XzEuRXZlbnRUeXBlLnN0YXJ0XSwgbGF5b3V0XzEuRXZlbnRUeXBlW2xheW91dF8xLkV2ZW50VHlwZS50aWNrXSwgbGF5b3V0XzEuRXZlbnRUeXBlW2xheW91dF8xLkV2ZW50VHlwZS5lbmRdKTtcbiAgICAgICAgdmFyIGQzbGF5b3V0ID0gX3RoaXM7XG4gICAgICAgIHZhciBkcmFnO1xuICAgICAgICBfdGhpcy5kcmFnID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgaWYgKCFkcmFnKSB7XG4gICAgICAgICAgICAgICAgdmFyIGRyYWcgPSBkM0NvbnRleHQuZHJhZygpXG4gICAgICAgICAgICAgICAgICAgIC5zdWJqZWN0KGxheW91dF8xLkxheW91dC5kcmFnT3JpZ2luKVxuICAgICAgICAgICAgICAgICAgICAub24oXCJzdGFydC5kM2FkYXB0b3JcIiwgbGF5b3V0XzEuTGF5b3V0LmRyYWdTdGFydClcbiAgICAgICAgICAgICAgICAgICAgLm9uKFwiZHJhZy5kM2FkYXB0b3JcIiwgZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgICAgICAgICAgICAgbGF5b3V0XzEuTGF5b3V0LmRyYWcoZCwgZDNDb250ZXh0LmV2ZW50KTtcbiAgICAgICAgICAgICAgICAgICAgZDNsYXlvdXQucmVzdW1lKCk7XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAgICAgLm9uKFwiZW5kLmQzYWRhcHRvclwiLCBsYXlvdXRfMS5MYXlvdXQuZHJhZ0VuZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpXG4gICAgICAgICAgICAgICAgcmV0dXJuIGRyYWc7XG4gICAgICAgICAgICBhcmd1bWVudHNbMF0uY2FsbChkcmFnKTtcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIF90aGlzO1xuICAgIH1cbiAgICBEM1N0eWxlTGF5b3V0QWRhcHRvci5wcm90b3R5cGUudHJpZ2dlciA9IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgIHZhciBkM2V2ZW50ID0geyB0eXBlOiBsYXlvdXRfMS5FdmVudFR5cGVbZS50eXBlXSwgYWxwaGE6IGUuYWxwaGEsIHN0cmVzczogZS5zdHJlc3MgfTtcbiAgICAgICAgdGhpcy5ldmVudC5jYWxsKGQzZXZlbnQudHlwZSwgZDNldmVudCk7XG4gICAgfTtcbiAgICBEM1N0eWxlTGF5b3V0QWRhcHRvci5wcm90b3R5cGUua2ljayA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgdmFyIHQgPSB0aGlzLmQzQ29udGV4dC50aW1lcihmdW5jdGlvbiAoKSB7IHJldHVybiBfc3VwZXIucHJvdG90eXBlLnRpY2suY2FsbChfdGhpcykgJiYgdC5zdG9wKCk7IH0pO1xuICAgIH07XG4gICAgRDNTdHlsZUxheW91dEFkYXB0b3IucHJvdG90eXBlLm9uID0gZnVuY3Rpb24gKGV2ZW50VHlwZSwgbGlzdGVuZXIpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBldmVudFR5cGUgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICB0aGlzLmV2ZW50Lm9uKGV2ZW50VHlwZSwgbGlzdGVuZXIpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5ldmVudC5vbihsYXlvdXRfMS5FdmVudFR5cGVbZXZlbnRUeXBlXSwgbGlzdGVuZXIpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgcmV0dXJuIEQzU3R5bGVMYXlvdXRBZGFwdG9yO1xufShsYXlvdXRfMS5MYXlvdXQpKTtcbmV4cG9ydHMuRDNTdHlsZUxheW91dEFkYXB0b3IgPSBEM1N0eWxlTGF5b3V0QWRhcHRvcjtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWRhdGE6YXBwbGljYXRpb24vanNvbjtiYXNlNjQsZXlKMlpYSnphVzl1SWpvekxDSm1hV3hsSWpvaVpETjJOR0ZrWVhCMGIzSXVhbk1pTENKemIzVnlZMlZTYjI5MElqb2lJaXdpYzI5MWNtTmxjeUk2V3lJdUxpOHVMaTlYWldKRGIyeGhMM055WXk5a00zWTBZV1JoY0hSdmNpNTBjeUpkTENKdVlXMWxjeUk2VzEwc0ltMWhjSEJwYm1keklqb2lPenM3T3pzN096czdPenM3T3pzN1FVRkhRU3h0UTBGQmFVUTdRVUZWYWtRN1NVRkJNRU1zZDBOQlFVMDdTVUZwUWpWRExEaENRVUZ2UWl4VFFVRnZRanRSUVVGNFF5eFpRVU5KTEdsQ1FVRlBMRk5CZVVKV08xRkJNVUp0UWl4bFFVRlRMRWRCUVZRc1UwRkJVeXhEUVVGWE8xRkJSWEJETEV0QlFVa3NRMEZCUXl4TFFVRkxMRWRCUVVjc1UwRkJVeXhEUVVGRExGRkJRVkVzUTBGQlF5eHJRa0ZCVXl4RFFVRkRMR3RDUVVGVExFTkJRVU1zUzBGQlN5eERRVUZETEVWQlFVVXNhMEpCUVZNc1EwRkJReXhyUWtGQlV5eERRVUZETEVsQlFVa3NRMEZCUXl4RlFVRkZMR3RDUVVGVExFTkJRVU1zYTBKQlFWTXNRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJReXhEUVVGRE8xRkJSMnBJTEVsQlFVa3NVVUZCVVN4SFFVRkhMRXRCUVVrc1EwRkJRenRSUVVOd1FpeEpRVUZKTEVsQlFVa3NRMEZCUXp0UlFVTlVMRXRCUVVrc1EwRkJReXhKUVVGSkxFZEJRVWM3V1VGRFVpeEpRVUZKTEVOQlFVTXNTVUZCU1N4RlFVRkZPMmRDUVVOUUxFbEJRVWtzU1VGQlNTeEhRVUZITEZOQlFWTXNRMEZCUXl4SlFVRkpMRVZCUVVVN2NVSkJRM1JDTEU5QlFVOHNRMEZCUXl4bFFVRk5MRU5CUVVNc1ZVRkJWU3hEUVVGRE8zRkNRVU14UWl4RlFVRkZMRU5CUVVNc2FVSkJRV2xDTEVWQlFVVXNaVUZCVFN4RFFVRkRMRk5CUVZNc1EwRkJRenR4UWtGRGRrTXNSVUZCUlN4RFFVRkRMR2RDUVVGblFpeEZRVUZGTEZWQlFVRXNRMEZCUXp0dlFrRkRia0lzWlVGQlRTeERRVUZETEVsQlFVa3NRMEZCVFN4RFFVRkRMRVZCUVVVc1UwRkJVeXhEUVVGRExFdEJRVXNzUTBGQlF5eERRVUZETzI5Q1FVTnlReXhSUVVGUkxFTkJRVU1zVFVGQlRTeEZRVUZGTEVOQlFVTTdaMEpCUTNSQ0xFTkJRVU1zUTBGQlF6dHhRa0ZEUkN4RlFVRkZMRU5CUVVNc1pVRkJaU3hGUVVGRkxHVkJRVTBzUTBGQlF5eFBRVUZQTEVOQlFVTXNRMEZCUXp0aFFVTTFRenRaUVVWRUxFbEJRVWtzUTBGQlF5eFRRVUZUTEVOQlFVTXNUVUZCVFR0blFrRkJSU3hQUVVGUExFbEJRVWtzUTBGQlF6dFpRVXR1UXl4VFFVRlRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zU1VGQlNTeERRVUZETEVsQlFVa3NRMEZCUXl4RFFVRkRPMUZCUXpWQ0xFTkJRVU1zUTBGQlFUczdTVUZEVEN4RFFVRkRPMGxCZWtORUxITkRRVUZQTEVkQlFWQXNWVUZCVVN4RFFVRlJPMUZCUTFvc1NVRkJTU3hQUVVGUExFZEJRVWNzUlVGQlJTeEpRVUZKTEVWQlFVVXNhMEpCUVZNc1EwRkJReXhEUVVGRExFTkJRVU1zU1VGQlNTeERRVUZETEVWQlFVVXNTMEZCU3l4RlFVRkZMRU5CUVVNc1EwRkJReXhMUVVGTExFVkJRVVVzVFVGQlRTeEZRVUZGTEVOQlFVTXNRMEZCUXl4TlFVRk5MRVZCUVVVc1EwRkJRenRSUVVjMVJTeEpRVUZKTEVOQlFVTXNTMEZCU3l4RFFVRkRMRWxCUVVrc1EwRkJReXhQUVVGUExFTkJRVU1zU1VGQlNTeEZRVUZQTEU5QlFVOHNRMEZCUXl4RFFVRkRPMGxCUTJoRUxFTkJRVU03U1VGSFJDeHRRMEZCU1N4SFFVRktPMUZCUVVFc2FVSkJSVU03VVVGRVJ5eEpRVUZKTEVOQlFVTXNSMEZCUnl4SlFVRkpMRU5CUVVNc1UwRkJVeXhEUVVGRExFdEJRVXNzUTBGQlF5eGpRVUZOTEU5QlFVRXNhVUpCUVUwc1NVRkJTU3haUVVGRkxFbEJRVWtzUTBGQlF5eERRVUZETEVsQlFVa3NSVUZCUlN4RlFVRjRRaXhEUVVGM1FpeERRVUZETEVOQlFVTTdTVUZEYWtVc1EwRkJRenRKUVd0RFJDeHBRMEZCUlN4SFFVRkdMRlZCUVVjc1UwRkJOa0lzUlVGQlJTeFJRVUZ2UWp0UlFVTnNSQ3hKUVVGSkxFOUJRVThzVTBGQlV5eExRVUZMTEZGQlFWRXNSVUZCUlR0WlFVTXZRaXhKUVVGSkxFTkJRVU1zUzBGQlN5eERRVUZETEVWQlFVVXNRMEZCUXl4VFFVRlRMRVZCUVVVc1VVRkJVU3hEUVVGRExFTkJRVU03VTBGRGRFTTdZVUZCVFR0WlFVTklMRWxCUVVrc1EwRkJReXhMUVVGTExFTkJRVU1zUlVGQlJTeERRVUZETEd0Q1FVRlRMRU5CUVVNc1UwRkJVeXhEUVVGRExFVkJRVVVzVVVGQlVTeERRVUZETEVOQlFVTTdVMEZEYWtRN1VVRkRSQ3hQUVVGUExFbEJRVWtzUTBGQlF6dEpRVU5vUWl4RFFVRkRPMGxCUTB3c01rSkJRVU03UVVGQlJDeERRVUZETEVGQmRFUkVMRU5CUVRCRExHVkJRVTBzUjBGelJDOURPMEZCZEVSWkxHOUVRVUZ2UWlKOSIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIExvY2tzID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBMb2NrcygpIHtcbiAgICAgICAgdGhpcy5sb2NrcyA9IHt9O1xuICAgIH1cbiAgICBMb2Nrcy5wcm90b3R5cGUuYWRkID0gZnVuY3Rpb24gKGlkLCB4KSB7XG4gICAgICAgIHRoaXMubG9ja3NbaWRdID0geDtcbiAgICB9O1xuICAgIExvY2tzLnByb3RvdHlwZS5jbGVhciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5sb2NrcyA9IHt9O1xuICAgIH07XG4gICAgTG9ja3MucHJvdG90eXBlLmlzRW1wdHkgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGZvciAodmFyIGwgaW4gdGhpcy5sb2NrcylcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfTtcbiAgICBMb2Nrcy5wcm90b3R5cGUuYXBwbHkgPSBmdW5jdGlvbiAoZikge1xuICAgICAgICBmb3IgKHZhciBsIGluIHRoaXMubG9ja3MpIHtcbiAgICAgICAgICAgIGYoTnVtYmVyKGwpLCB0aGlzLmxvY2tzW2xdKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgcmV0dXJuIExvY2tzO1xufSgpKTtcbmV4cG9ydHMuTG9ja3MgPSBMb2NrcztcbnZhciBEZXNjZW50ID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBEZXNjZW50KHgsIEQsIEcpIHtcbiAgICAgICAgaWYgKEcgPT09IHZvaWQgMCkgeyBHID0gbnVsbDsgfVxuICAgICAgICB0aGlzLkQgPSBEO1xuICAgICAgICB0aGlzLkcgPSBHO1xuICAgICAgICB0aGlzLnRocmVzaG9sZCA9IDAuMDAwMTtcbiAgICAgICAgdGhpcy5udW1HcmlkU25hcE5vZGVzID0gMDtcbiAgICAgICAgdGhpcy5zbmFwR3JpZFNpemUgPSAxMDA7XG4gICAgICAgIHRoaXMuc25hcFN0cmVuZ3RoID0gMTAwMDtcbiAgICAgICAgdGhpcy5zY2FsZVNuYXBCeU1heEggPSBmYWxzZTtcbiAgICAgICAgdGhpcy5yYW5kb20gPSBuZXcgUHNldWRvUmFuZG9tKCk7XG4gICAgICAgIHRoaXMucHJvamVjdCA9IG51bGw7XG4gICAgICAgIHRoaXMueCA9IHg7XG4gICAgICAgIHRoaXMuayA9IHgubGVuZ3RoO1xuICAgICAgICB2YXIgbiA9IHRoaXMubiA9IHhbMF0ubGVuZ3RoO1xuICAgICAgICB0aGlzLkggPSBuZXcgQXJyYXkodGhpcy5rKTtcbiAgICAgICAgdGhpcy5nID0gbmV3IEFycmF5KHRoaXMuayk7XG4gICAgICAgIHRoaXMuSGQgPSBuZXcgQXJyYXkodGhpcy5rKTtcbiAgICAgICAgdGhpcy5hID0gbmV3IEFycmF5KHRoaXMuayk7XG4gICAgICAgIHRoaXMuYiA9IG5ldyBBcnJheSh0aGlzLmspO1xuICAgICAgICB0aGlzLmMgPSBuZXcgQXJyYXkodGhpcy5rKTtcbiAgICAgICAgdGhpcy5kID0gbmV3IEFycmF5KHRoaXMuayk7XG4gICAgICAgIHRoaXMuZSA9IG5ldyBBcnJheSh0aGlzLmspO1xuICAgICAgICB0aGlzLmlhID0gbmV3IEFycmF5KHRoaXMuayk7XG4gICAgICAgIHRoaXMuaWIgPSBuZXcgQXJyYXkodGhpcy5rKTtcbiAgICAgICAgdGhpcy54dG1wID0gbmV3IEFycmF5KHRoaXMuayk7XG4gICAgICAgIHRoaXMubG9ja3MgPSBuZXcgTG9ja3MoKTtcbiAgICAgICAgdGhpcy5taW5EID0gTnVtYmVyLk1BWF9WQUxVRTtcbiAgICAgICAgdmFyIGkgPSBuLCBqO1xuICAgICAgICB3aGlsZSAoaS0tKSB7XG4gICAgICAgICAgICBqID0gbjtcbiAgICAgICAgICAgIHdoaWxlICgtLWogPiBpKSB7XG4gICAgICAgICAgICAgICAgdmFyIGQgPSBEW2ldW2pdO1xuICAgICAgICAgICAgICAgIGlmIChkID4gMCAmJiBkIDwgdGhpcy5taW5EKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMubWluRCA9IGQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLm1pbkQgPT09IE51bWJlci5NQVhfVkFMVUUpXG4gICAgICAgICAgICB0aGlzLm1pbkQgPSAxO1xuICAgICAgICBpID0gdGhpcy5rO1xuICAgICAgICB3aGlsZSAoaS0tKSB7XG4gICAgICAgICAgICB0aGlzLmdbaV0gPSBuZXcgQXJyYXkobik7XG4gICAgICAgICAgICB0aGlzLkhbaV0gPSBuZXcgQXJyYXkobik7XG4gICAgICAgICAgICBqID0gbjtcbiAgICAgICAgICAgIHdoaWxlIChqLS0pIHtcbiAgICAgICAgICAgICAgICB0aGlzLkhbaV1bal0gPSBuZXcgQXJyYXkobik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLkhkW2ldID0gbmV3IEFycmF5KG4pO1xuICAgICAgICAgICAgdGhpcy5hW2ldID0gbmV3IEFycmF5KG4pO1xuICAgICAgICAgICAgdGhpcy5iW2ldID0gbmV3IEFycmF5KG4pO1xuICAgICAgICAgICAgdGhpcy5jW2ldID0gbmV3IEFycmF5KG4pO1xuICAgICAgICAgICAgdGhpcy5kW2ldID0gbmV3IEFycmF5KG4pO1xuICAgICAgICAgICAgdGhpcy5lW2ldID0gbmV3IEFycmF5KG4pO1xuICAgICAgICAgICAgdGhpcy5pYVtpXSA9IG5ldyBBcnJheShuKTtcbiAgICAgICAgICAgIHRoaXMuaWJbaV0gPSBuZXcgQXJyYXkobik7XG4gICAgICAgICAgICB0aGlzLnh0bXBbaV0gPSBuZXcgQXJyYXkobik7XG4gICAgICAgIH1cbiAgICB9XG4gICAgRGVzY2VudC5jcmVhdGVTcXVhcmVNYXRyaXggPSBmdW5jdGlvbiAobiwgZikge1xuICAgICAgICB2YXIgTSA9IG5ldyBBcnJheShuKTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBuOyArK2kpIHtcbiAgICAgICAgICAgIE1baV0gPSBuZXcgQXJyYXkobik7XG4gICAgICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IG47ICsraikge1xuICAgICAgICAgICAgICAgIE1baV1bal0gPSBmKGksIGopO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBNO1xuICAgIH07XG4gICAgRGVzY2VudC5wcm90b3R5cGUub2Zmc2V0RGlyID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICB2YXIgdSA9IG5ldyBBcnJheSh0aGlzLmspO1xuICAgICAgICB2YXIgbCA9IDA7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5rOyArK2kpIHtcbiAgICAgICAgICAgIHZhciB4ID0gdVtpXSA9IHRoaXMucmFuZG9tLmdldE5leHRCZXR3ZWVuKDAuMDEsIDEpIC0gMC41O1xuICAgICAgICAgICAgbCArPSB4ICogeDtcbiAgICAgICAgfVxuICAgICAgICBsID0gTWF0aC5zcXJ0KGwpO1xuICAgICAgICByZXR1cm4gdS5tYXAoZnVuY3Rpb24gKHgpIHsgcmV0dXJuIHggKj0gX3RoaXMubWluRCAvIGw7IH0pO1xuICAgIH07XG4gICAgRGVzY2VudC5wcm90b3R5cGUuY29tcHV0ZURlcml2YXRpdmVzID0gZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgdmFyIG4gPSB0aGlzLm47XG4gICAgICAgIGlmIChuIDwgMSlcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgdmFyIGk7XG4gICAgICAgIHZhciBkID0gbmV3IEFycmF5KHRoaXMuayk7XG4gICAgICAgIHZhciBkMiA9IG5ldyBBcnJheSh0aGlzLmspO1xuICAgICAgICB2YXIgSHV1ID0gbmV3IEFycmF5KHRoaXMuayk7XG4gICAgICAgIHZhciBtYXhIID0gMDtcbiAgICAgICAgZm9yICh2YXIgdV8xID0gMDsgdV8xIDwgbjsgKyt1XzEpIHtcbiAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCB0aGlzLms7ICsraSlcbiAgICAgICAgICAgICAgICBIdXVbaV0gPSB0aGlzLmdbaV1bdV8xXSA9IDA7XG4gICAgICAgICAgICBmb3IgKHZhciB2ID0gMDsgdiA8IG47ICsrdikge1xuICAgICAgICAgICAgICAgIGlmICh1XzEgPT09IHYpXG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIHZhciBtYXhEaXNwbGFjZXMgPSBuO1xuICAgICAgICAgICAgICAgIHZhciBkaXN0YW5jZVNxdWFyZWQgPSAwO1xuICAgICAgICAgICAgICAgIHdoaWxlIChtYXhEaXNwbGFjZXMtLSkge1xuICAgICAgICAgICAgICAgICAgICBkaXN0YW5jZVNxdWFyZWQgPSAwO1xuICAgICAgICAgICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgdGhpcy5rOyArK2kpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBkeF8xID0gZFtpXSA9IHhbaV1bdV8xXSAtIHhbaV1bdl07XG4gICAgICAgICAgICAgICAgICAgICAgICBkaXN0YW5jZVNxdWFyZWQgKz0gZDJbaV0gPSBkeF8xICogZHhfMTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoZGlzdGFuY2VTcXVhcmVkID4gMWUtOSlcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB2YXIgcmQgPSB0aGlzLm9mZnNldERpcigpO1xuICAgICAgICAgICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgdGhpcy5rOyArK2kpXG4gICAgICAgICAgICAgICAgICAgICAgICB4W2ldW3ZdICs9IHJkW2ldO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB2YXIgZGlzdGFuY2UgPSBNYXRoLnNxcnQoZGlzdGFuY2VTcXVhcmVkKTtcbiAgICAgICAgICAgICAgICB2YXIgaWRlYWxEaXN0YW5jZSA9IHRoaXMuRFt1XzFdW3ZdO1xuICAgICAgICAgICAgICAgIHZhciB3ZWlnaHQgPSB0aGlzLkcgIT0gbnVsbCA/IHRoaXMuR1t1XzFdW3ZdIDogMTtcbiAgICAgICAgICAgICAgICBpZiAod2VpZ2h0ID4gMSAmJiBkaXN0YW5jZSA+IGlkZWFsRGlzdGFuY2UgfHwgIWlzRmluaXRlKGlkZWFsRGlzdGFuY2UpKSB7XG4gICAgICAgICAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCB0aGlzLms7ICsraSlcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuSFtpXVt1XzFdW3ZdID0gMDtcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICh3ZWlnaHQgPiAxKSB7XG4gICAgICAgICAgICAgICAgICAgIHdlaWdodCA9IDE7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHZhciBpZGVhbERpc3RTcXVhcmVkID0gaWRlYWxEaXN0YW5jZSAqIGlkZWFsRGlzdGFuY2UsIGdzID0gMiAqIHdlaWdodCAqIChkaXN0YW5jZSAtIGlkZWFsRGlzdGFuY2UpIC8gKGlkZWFsRGlzdFNxdWFyZWQgKiBkaXN0YW5jZSksIGRpc3RhbmNlQ3ViZWQgPSBkaXN0YW5jZVNxdWFyZWQgKiBkaXN0YW5jZSwgaHMgPSAyICogLXdlaWdodCAvIChpZGVhbERpc3RTcXVhcmVkICogZGlzdGFuY2VDdWJlZCk7XG4gICAgICAgICAgICAgICAgaWYgKCFpc0Zpbml0ZShncykpXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGdzKTtcbiAgICAgICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgdGhpcy5rOyArK2kpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5nW2ldW3VfMV0gKz0gZFtpXSAqIGdzO1xuICAgICAgICAgICAgICAgICAgICBIdXVbaV0gLT0gdGhpcy5IW2ldW3VfMV1bdl0gPSBocyAqICgyICogZGlzdGFuY2VDdWJlZCArIGlkZWFsRGlzdGFuY2UgKiAoZDJbaV0gLSBkaXN0YW5jZVNxdWFyZWQpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgdGhpcy5rOyArK2kpXG4gICAgICAgICAgICAgICAgbWF4SCA9IE1hdGgubWF4KG1heEgsIHRoaXMuSFtpXVt1XzFdW3VfMV0gPSBIdXVbaV0pO1xuICAgICAgICB9XG4gICAgICAgIHZhciByID0gdGhpcy5zbmFwR3JpZFNpemUgLyAyO1xuICAgICAgICB2YXIgZyA9IHRoaXMuc25hcEdyaWRTaXplO1xuICAgICAgICB2YXIgdyA9IHRoaXMuc25hcFN0cmVuZ3RoO1xuICAgICAgICB2YXIgayA9IHcgLyAociAqIHIpO1xuICAgICAgICB2YXIgbnVtTm9kZXMgPSB0aGlzLm51bUdyaWRTbmFwTm9kZXM7XG4gICAgICAgIGZvciAodmFyIHUgPSAwOyB1IDwgbnVtTm9kZXM7ICsrdSkge1xuICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IHRoaXMuazsgKytpKSB7XG4gICAgICAgICAgICAgICAgdmFyIHhpdSA9IHRoaXMueFtpXVt1XTtcbiAgICAgICAgICAgICAgICB2YXIgbSA9IHhpdSAvIGc7XG4gICAgICAgICAgICAgICAgdmFyIGYgPSBtICUgMTtcbiAgICAgICAgICAgICAgICB2YXIgcSA9IG0gLSBmO1xuICAgICAgICAgICAgICAgIHZhciBhID0gTWF0aC5hYnMoZik7XG4gICAgICAgICAgICAgICAgdmFyIGR4ID0gKGEgPD0gMC41KSA/IHhpdSAtIHEgKiBnIDpcbiAgICAgICAgICAgICAgICAgICAgKHhpdSA+IDApID8geGl1IC0gKHEgKyAxKSAqIGcgOiB4aXUgLSAocSAtIDEpICogZztcbiAgICAgICAgICAgICAgICBpZiAoLXIgPCBkeCAmJiBkeCA8PSByKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLnNjYWxlU25hcEJ5TWF4SCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5nW2ldW3VdICs9IG1heEggKiBrICogZHg7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLkhbaV1bdV1bdV0gKz0gbWF4SCAqIGs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmdbaV1bdV0gKz0gayAqIGR4O1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5IW2ldW3VdW3VdICs9IGs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCF0aGlzLmxvY2tzLmlzRW1wdHkoKSkge1xuICAgICAgICAgICAgdGhpcy5sb2Nrcy5hcHBseShmdW5jdGlvbiAodSwgcCkge1xuICAgICAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCBfdGhpcy5rOyArK2kpIHtcbiAgICAgICAgICAgICAgICAgICAgX3RoaXMuSFtpXVt1XVt1XSArPSBtYXhIO1xuICAgICAgICAgICAgICAgICAgICBfdGhpcy5nW2ldW3VdIC09IG1heEggKiAocFtpXSAtIHhbaV1bdV0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBEZXNjZW50LmRvdFByb2QgPSBmdW5jdGlvbiAoYSwgYikge1xuICAgICAgICB2YXIgeCA9IDAsIGkgPSBhLmxlbmd0aDtcbiAgICAgICAgd2hpbGUgKGktLSlcbiAgICAgICAgICAgIHggKz0gYVtpXSAqIGJbaV07XG4gICAgICAgIHJldHVybiB4O1xuICAgIH07XG4gICAgRGVzY2VudC5yaWdodE11bHRpcGx5ID0gZnVuY3Rpb24gKG0sIHYsIHIpIHtcbiAgICAgICAgdmFyIGkgPSBtLmxlbmd0aDtcbiAgICAgICAgd2hpbGUgKGktLSlcbiAgICAgICAgICAgIHJbaV0gPSBEZXNjZW50LmRvdFByb2QobVtpXSwgdik7XG4gICAgfTtcbiAgICBEZXNjZW50LnByb3RvdHlwZS5jb21wdXRlU3RlcFNpemUgPSBmdW5jdGlvbiAoZCkge1xuICAgICAgICB2YXIgbnVtZXJhdG9yID0gMCwgZGVub21pbmF0b3IgPSAwO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuazsgKytpKSB7XG4gICAgICAgICAgICBudW1lcmF0b3IgKz0gRGVzY2VudC5kb3RQcm9kKHRoaXMuZ1tpXSwgZFtpXSk7XG4gICAgICAgICAgICBEZXNjZW50LnJpZ2h0TXVsdGlwbHkodGhpcy5IW2ldLCBkW2ldLCB0aGlzLkhkW2ldKTtcbiAgICAgICAgICAgIGRlbm9taW5hdG9yICs9IERlc2NlbnQuZG90UHJvZChkW2ldLCB0aGlzLkhkW2ldKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoZGVub21pbmF0b3IgPT09IDAgfHwgIWlzRmluaXRlKGRlbm9taW5hdG9yKSlcbiAgICAgICAgICAgIHJldHVybiAwO1xuICAgICAgICByZXR1cm4gMSAqIG51bWVyYXRvciAvIGRlbm9taW5hdG9yO1xuICAgIH07XG4gICAgRGVzY2VudC5wcm90b3R5cGUucmVkdWNlU3RyZXNzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLmNvbXB1dGVEZXJpdmF0aXZlcyh0aGlzLngpO1xuICAgICAgICB2YXIgYWxwaGEgPSB0aGlzLmNvbXB1dGVTdGVwU2l6ZSh0aGlzLmcpO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuazsgKytpKSB7XG4gICAgICAgICAgICB0aGlzLnRha2VEZXNjZW50U3RlcCh0aGlzLnhbaV0sIHRoaXMuZ1tpXSwgYWxwaGEpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzLmNvbXB1dGVTdHJlc3MoKTtcbiAgICB9O1xuICAgIERlc2NlbnQuY29weSA9IGZ1bmN0aW9uIChhLCBiKSB7XG4gICAgICAgIHZhciBtID0gYS5sZW5ndGgsIG4gPSBiWzBdLmxlbmd0aDtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBtOyArK2kpIHtcbiAgICAgICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgbjsgKytqKSB7XG4gICAgICAgICAgICAgICAgYltpXVtqXSA9IGFbaV1bal07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuICAgIERlc2NlbnQucHJvdG90eXBlLnN0ZXBBbmRQcm9qZWN0ID0gZnVuY3Rpb24gKHgwLCByLCBkLCBzdGVwU2l6ZSkge1xuICAgICAgICBEZXNjZW50LmNvcHkoeDAsIHIpO1xuICAgICAgICB0aGlzLnRha2VEZXNjZW50U3RlcChyWzBdLCBkWzBdLCBzdGVwU2l6ZSk7XG4gICAgICAgIGlmICh0aGlzLnByb2plY3QpXG4gICAgICAgICAgICB0aGlzLnByb2plY3RbMF0oeDBbMF0sIHgwWzFdLCByWzBdKTtcbiAgICAgICAgdGhpcy50YWtlRGVzY2VudFN0ZXAoclsxXSwgZFsxXSwgc3RlcFNpemUpO1xuICAgICAgICBpZiAodGhpcy5wcm9qZWN0KVxuICAgICAgICAgICAgdGhpcy5wcm9qZWN0WzFdKHJbMF0sIHgwWzFdLCByWzFdKTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDI7IGkgPCB0aGlzLms7IGkrKylcbiAgICAgICAgICAgIHRoaXMudGFrZURlc2NlbnRTdGVwKHJbaV0sIGRbaV0sIHN0ZXBTaXplKTtcbiAgICB9O1xuICAgIERlc2NlbnQubUFwcGx5ID0gZnVuY3Rpb24gKG0sIG4sIGYpIHtcbiAgICAgICAgdmFyIGkgPSBtO1xuICAgICAgICB3aGlsZSAoaS0tID4gMCkge1xuICAgICAgICAgICAgdmFyIGogPSBuO1xuICAgICAgICAgICAgd2hpbGUgKGotLSA+IDApXG4gICAgICAgICAgICAgICAgZihpLCBqKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgRGVzY2VudC5wcm90b3R5cGUubWF0cml4QXBwbHkgPSBmdW5jdGlvbiAoZikge1xuICAgICAgICBEZXNjZW50Lm1BcHBseSh0aGlzLmssIHRoaXMubiwgZik7XG4gICAgfTtcbiAgICBEZXNjZW50LnByb3RvdHlwZS5jb21wdXRlTmV4dFBvc2l0aW9uID0gZnVuY3Rpb24gKHgwLCByKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIHRoaXMuY29tcHV0ZURlcml2YXRpdmVzKHgwKTtcbiAgICAgICAgdmFyIGFscGhhID0gdGhpcy5jb21wdXRlU3RlcFNpemUodGhpcy5nKTtcbiAgICAgICAgdGhpcy5zdGVwQW5kUHJvamVjdCh4MCwgciwgdGhpcy5nLCBhbHBoYSk7XG4gICAgICAgIGlmICh0aGlzLnByb2plY3QpIHtcbiAgICAgICAgICAgIHRoaXMubWF0cml4QXBwbHkoZnVuY3Rpb24gKGksIGopIHsgcmV0dXJuIF90aGlzLmVbaV1bal0gPSB4MFtpXVtqXSAtIHJbaV1bal07IH0pO1xuICAgICAgICAgICAgdmFyIGJldGEgPSB0aGlzLmNvbXB1dGVTdGVwU2l6ZSh0aGlzLmUpO1xuICAgICAgICAgICAgYmV0YSA9IE1hdGgubWF4KDAuMiwgTWF0aC5taW4oYmV0YSwgMSkpO1xuICAgICAgICAgICAgdGhpcy5zdGVwQW5kUHJvamVjdCh4MCwgciwgdGhpcy5lLCBiZXRhKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgRGVzY2VudC5wcm90b3R5cGUucnVuID0gZnVuY3Rpb24gKGl0ZXJhdGlvbnMpIHtcbiAgICAgICAgdmFyIHN0cmVzcyA9IE51bWJlci5NQVhfVkFMVUUsIGNvbnZlcmdlZCA9IGZhbHNlO1xuICAgICAgICB3aGlsZSAoIWNvbnZlcmdlZCAmJiBpdGVyYXRpb25zLS0gPiAwKSB7XG4gICAgICAgICAgICB2YXIgcyA9IHRoaXMucnVuZ2VLdXR0YSgpO1xuICAgICAgICAgICAgY29udmVyZ2VkID0gTWF0aC5hYnMoc3RyZXNzIC8gcyAtIDEpIDwgdGhpcy50aHJlc2hvbGQ7XG4gICAgICAgICAgICBzdHJlc3MgPSBzO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBzdHJlc3M7XG4gICAgfTtcbiAgICBEZXNjZW50LnByb3RvdHlwZS5ydW5nZUt1dHRhID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICB0aGlzLmNvbXB1dGVOZXh0UG9zaXRpb24odGhpcy54LCB0aGlzLmEpO1xuICAgICAgICBEZXNjZW50Lm1pZCh0aGlzLngsIHRoaXMuYSwgdGhpcy5pYSk7XG4gICAgICAgIHRoaXMuY29tcHV0ZU5leHRQb3NpdGlvbih0aGlzLmlhLCB0aGlzLmIpO1xuICAgICAgICBEZXNjZW50Lm1pZCh0aGlzLngsIHRoaXMuYiwgdGhpcy5pYik7XG4gICAgICAgIHRoaXMuY29tcHV0ZU5leHRQb3NpdGlvbih0aGlzLmliLCB0aGlzLmMpO1xuICAgICAgICB0aGlzLmNvbXB1dGVOZXh0UG9zaXRpb24odGhpcy5jLCB0aGlzLmQpO1xuICAgICAgICB2YXIgZGlzcCA9IDA7XG4gICAgICAgIHRoaXMubWF0cml4QXBwbHkoZnVuY3Rpb24gKGksIGopIHtcbiAgICAgICAgICAgIHZhciB4ID0gKF90aGlzLmFbaV1bal0gKyAyLjAgKiBfdGhpcy5iW2ldW2pdICsgMi4wICogX3RoaXMuY1tpXVtqXSArIF90aGlzLmRbaV1bal0pIC8gNi4wLCBkID0gX3RoaXMueFtpXVtqXSAtIHg7XG4gICAgICAgICAgICBkaXNwICs9IGQgKiBkO1xuICAgICAgICAgICAgX3RoaXMueFtpXVtqXSA9IHg7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gZGlzcDtcbiAgICB9O1xuICAgIERlc2NlbnQubWlkID0gZnVuY3Rpb24gKGEsIGIsIG0pIHtcbiAgICAgICAgRGVzY2VudC5tQXBwbHkoYS5sZW5ndGgsIGFbMF0ubGVuZ3RoLCBmdW5jdGlvbiAoaSwgaikge1xuICAgICAgICAgICAgcmV0dXJuIG1baV1bal0gPSBhW2ldW2pdICsgKGJbaV1bal0gLSBhW2ldW2pdKSAvIDIuMDtcbiAgICAgICAgfSk7XG4gICAgfTtcbiAgICBEZXNjZW50LnByb3RvdHlwZS50YWtlRGVzY2VudFN0ZXAgPSBmdW5jdGlvbiAoeCwgZCwgc3RlcFNpemUpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLm47ICsraSkge1xuICAgICAgICAgICAgeFtpXSA9IHhbaV0gLSBzdGVwU2l6ZSAqIGRbaV07XG4gICAgICAgIH1cbiAgICB9O1xuICAgIERlc2NlbnQucHJvdG90eXBlLmNvbXB1dGVTdHJlc3MgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBzdHJlc3MgPSAwO1xuICAgICAgICBmb3IgKHZhciB1ID0gMCwgbk1pbnVzMSA9IHRoaXMubiAtIDE7IHUgPCBuTWludXMxOyArK3UpIHtcbiAgICAgICAgICAgIGZvciAodmFyIHYgPSB1ICsgMSwgbiA9IHRoaXMubjsgdiA8IG47ICsrdikge1xuICAgICAgICAgICAgICAgIHZhciBsID0gMDtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuazsgKytpKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBkeCA9IHRoaXMueFtpXVt1XSAtIHRoaXMueFtpXVt2XTtcbiAgICAgICAgICAgICAgICAgICAgbCArPSBkeCAqIGR4O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBsID0gTWF0aC5zcXJ0KGwpO1xuICAgICAgICAgICAgICAgIHZhciBkID0gdGhpcy5EW3VdW3ZdO1xuICAgICAgICAgICAgICAgIGlmICghaXNGaW5pdGUoZCkpXG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIHZhciBybCA9IGQgLSBsO1xuICAgICAgICAgICAgICAgIHZhciBkMiA9IGQgKiBkO1xuICAgICAgICAgICAgICAgIHN0cmVzcyArPSBybCAqIHJsIC8gZDI7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHN0cmVzcztcbiAgICB9O1xuICAgIERlc2NlbnQuemVyb0Rpc3RhbmNlID0gMWUtMTA7XG4gICAgcmV0dXJuIERlc2NlbnQ7XG59KCkpO1xuZXhwb3J0cy5EZXNjZW50ID0gRGVzY2VudDtcbnZhciBQc2V1ZG9SYW5kb20gPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIFBzZXVkb1JhbmRvbShzZWVkKSB7XG4gICAgICAgIGlmIChzZWVkID09PSB2b2lkIDApIHsgc2VlZCA9IDE7IH1cbiAgICAgICAgdGhpcy5zZWVkID0gc2VlZDtcbiAgICAgICAgdGhpcy5hID0gMjE0MDEzO1xuICAgICAgICB0aGlzLmMgPSAyNTMxMDExO1xuICAgICAgICB0aGlzLm0gPSAyMTQ3NDgzNjQ4O1xuICAgICAgICB0aGlzLnJhbmdlID0gMzI3Njc7XG4gICAgfVxuICAgIFBzZXVkb1JhbmRvbS5wcm90b3R5cGUuZ2V0TmV4dCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5zZWVkID0gKHRoaXMuc2VlZCAqIHRoaXMuYSArIHRoaXMuYykgJSB0aGlzLm07XG4gICAgICAgIHJldHVybiAodGhpcy5zZWVkID4+IDE2KSAvIHRoaXMucmFuZ2U7XG4gICAgfTtcbiAgICBQc2V1ZG9SYW5kb20ucHJvdG90eXBlLmdldE5leHRCZXR3ZWVuID0gZnVuY3Rpb24gKG1pbiwgbWF4KSB7XG4gICAgICAgIHJldHVybiBtaW4gKyB0aGlzLmdldE5leHQoKSAqIChtYXggLSBtaW4pO1xuICAgIH07XG4gICAgcmV0dXJuIFBzZXVkb1JhbmRvbTtcbn0oKSk7XG5leHBvcnRzLlBzZXVkb1JhbmRvbSA9IFBzZXVkb1JhbmRvbTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWRhdGE6YXBwbGljYXRpb24vanNvbjtiYXNlNjQsZXlKMlpYSnphVzl1SWpvekxDSm1hV3hsSWpvaVpHVnpZMlZ1ZEM1cWN5SXNJbk52ZFhKalpWSnZiM1FpT2lJaUxDSnpiM1Z5WTJWeklqcGJJaTR1THk0dUwxZGxZa052YkdFdmMzSmpMMlJsYzJObGJuUXVkSE1pWFN3aWJtRnRaWE1pT2x0ZExDSnRZWEJ3YVc1bmN5STZJanM3UVVGSlNUdEpRVUZCTzFGQlEwa3NWVUZCU3l4SFFVRTJRaXhGUVVGRkxFTkJRVU03U1VGdlEzcERMRU5CUVVNN1NVRTNRa2NzYlVKQlFVY3NSMEZCU0N4VlFVRkpMRVZCUVZVc1JVRkJSU3hEUVVGWE8xRkJTWFpDTEVsQlFVa3NRMEZCUXl4TFFVRkxMRU5CUVVNc1JVRkJSU3hEUVVGRExFZEJRVWNzUTBGQlF5eERRVUZETzBsQlEzWkNMRU5CUVVNN1NVRkpSQ3h4UWtGQlN5eEhRVUZNTzFGQlEwa3NTVUZCU1N4RFFVRkRMRXRCUVVzc1IwRkJSeXhGUVVGRkxFTkJRVU03U1VGRGNFSXNRMEZCUXp0SlFVdEVMSFZDUVVGUExFZEJRVkE3VVVGRFNTeExRVUZMTEVsQlFVa3NRMEZCUXl4SlFVRkpMRWxCUVVrc1EwRkJReXhMUVVGTE8xbEJRVVVzVDBGQlR5eExRVUZMTEVOQlFVTTdVVUZEZGtNc1QwRkJUeXhKUVVGSkxFTkJRVU03U1VGRGFFSXNRMEZCUXp0SlFVdEVMSEZDUVVGTExFZEJRVXdzVlVGQlRTeERRVUZ2UXp0UlFVTjBReXhMUVVGTExFbEJRVWtzUTBGQlF5eEpRVUZKTEVsQlFVa3NRMEZCUXl4TFFVRkxMRVZCUVVVN1dVRkRkRUlzUTBGQlF5eERRVUZETEUxQlFVMHNRMEZCUXl4RFFVRkRMRU5CUVVNc1JVRkJSU3hKUVVGSkxFTkJRVU1zUzBGQlN5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1UwRkRMMEk3U1VGRFRDeERRVUZETzBsQlEwd3NXVUZCUXp0QlFVRkVMRU5CUVVNc1FVRnlRMFFzU1VGeFEwTTdRVUZ5UTFrc2MwSkJRVXM3UVVGcFJHeENPMGxCTmtSSkxHbENRVUZaTEVOQlFXRXNSVUZCVXl4RFFVRmhMRVZCUVZNc1EwRkJiVUk3VVVGQmJrSXNhMEpCUVVFc1JVRkJRU3hSUVVGdFFqdFJRVUY2UXl4TlFVRkRMRWRCUVVRc1EwRkJReXhEUVVGWk8xRkJRVk1zVFVGQlF5eEhRVUZFTEVOQlFVTXNRMEZCYTBJN1VVRTFSSEJGTEdOQlFWTXNSMEZCVnl4TlFVRk5MRU5CUVVNN1VVRXlRek5DTEhGQ1FVRm5RaXhIUVVGWExFTkJRVU1zUTBGQlF6dFJRVU0zUWl4cFFrRkJXU3hIUVVGWExFZEJRVWNzUTBGQlF6dFJRVU16UWl4cFFrRkJXU3hIUVVGWExFbEJRVWtzUTBGQlF6dFJRVU0xUWl4dlFrRkJaU3hIUVVGWkxFdEJRVXNzUTBGQlF6dFJRVVZvUXl4WFFVRk5MRWRCUVVjc1NVRkJTU3haUVVGWkxFVkJRVVVzUTBGQlF6dFJRVVUzUWl4WlFVRlBMRWRCUVRCRUxFbEJRVWtzUTBGQlF6dFJRVmQ2UlN4SlFVRkpMRU5CUVVNc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF6dFJRVU5ZTEVsQlFVa3NRMEZCUXl4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRExFMUJRVTBzUTBGQlF6dFJRVU5zUWl4SlFVRkpMRU5CUVVNc1IwRkJSeXhKUVVGSkxFTkJRVU1zUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhOUVVGTkxFTkJRVU03VVVGRE4wSXNTVUZCU1N4RFFVRkRMRU5CUVVNc1IwRkJSeXhKUVVGSkxFdEJRVXNzUTBGQlF5eEpRVUZKTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1VVRkRNMElzU1VGQlNTeERRVUZETEVOQlFVTXNSMEZCUnl4SlFVRkpMRXRCUVVzc1EwRkJReXhKUVVGSkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTTdVVUZETTBJc1NVRkJTU3hEUVVGRExFVkJRVVVzUjBGQlJ5eEpRVUZKTEV0QlFVc3NRMEZCUXl4SlFVRkpMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU03VVVGRE5VSXNTVUZCU1N4RFFVRkRMRU5CUVVNc1IwRkJSeXhKUVVGSkxFdEJRVXNzUTBGQlF5eEpRVUZKTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1VVRkRNMElzU1VGQlNTeERRVUZETEVOQlFVTXNSMEZCUnl4SlFVRkpMRXRCUVVzc1EwRkJReXhKUVVGSkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTTdVVUZETTBJc1NVRkJTU3hEUVVGRExFTkJRVU1zUjBGQlJ5eEpRVUZKTEV0QlFVc3NRMEZCUXl4SlFVRkpMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU03VVVGRE0wSXNTVUZCU1N4RFFVRkRMRU5CUVVNc1IwRkJSeXhKUVVGSkxFdEJRVXNzUTBGQlF5eEpRVUZKTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1VVRkRNMElzU1VGQlNTeERRVUZETEVOQlFVTXNSMEZCUnl4SlFVRkpMRXRCUVVzc1EwRkJReXhKUVVGSkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTTdVVUZETTBJc1NVRkJTU3hEUVVGRExFVkJRVVVzUjBGQlJ5eEpRVUZKTEV0QlFVc3NRMEZCUXl4SlFVRkpMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU03VVVGRE5VSXNTVUZCU1N4RFFVRkRMRVZCUVVVc1IwRkJSeXhKUVVGSkxFdEJRVXNzUTBGQlF5eEpRVUZKTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1VVRkROVUlzU1VGQlNTeERRVUZETEVsQlFVa3NSMEZCUnl4SlFVRkpMRXRCUVVzc1EwRkJReXhKUVVGSkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTTdVVUZET1VJc1NVRkJTU3hEUVVGRExFdEJRVXNzUjBGQlJ5eEpRVUZKTEV0QlFVc3NSVUZCUlN4RFFVRkRPMUZCUTNwQ0xFbEJRVWtzUTBGQlF5eEpRVUZKTEVkQlFVY3NUVUZCVFN4RFFVRkRMRk5CUVZNc1EwRkJRenRSUVVNM1FpeEpRVUZKTEVOQlFVTXNSMEZCUnl4RFFVRkRMRVZCUVVVc1EwRkJReXhEUVVGRE8xRkJRMklzVDBGQlR5eERRVUZETEVWQlFVVXNSVUZCUlR0WlFVTlNMRU5CUVVNc1IwRkJSeXhEUVVGRExFTkJRVU03V1VGRFRpeFBRVUZQTEVWQlFVVXNRMEZCUXl4SFFVRkhMRU5CUVVNc1JVRkJSVHRuUWtGRFdpeEpRVUZKTEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTTdaMEpCUTJoQ0xFbEJRVWtzUTBGQlF5eEhRVUZITEVOQlFVTXNTVUZCU1N4RFFVRkRMRWRCUVVjc1NVRkJTU3hEUVVGRExFbEJRVWtzUlVGQlJUdHZRa0ZEZUVJc1NVRkJTU3hEUVVGRExFbEJRVWtzUjBGQlJ5eERRVUZETEVOQlFVTTdhVUpCUTJwQ08yRkJRMG83VTBGRFNqdFJRVU5FTEVsQlFVa3NTVUZCU1N4RFFVRkRMRWxCUVVrc1MwRkJTeXhOUVVGTkxFTkJRVU1zVTBGQlV6dFpRVUZGTEVsQlFVa3NRMEZCUXl4SlFVRkpMRWRCUVVjc1EwRkJReXhEUVVGRE8xRkJRMnhFTEVOQlFVTXNSMEZCUnl4SlFVRkpMRU5CUVVNc1EwRkJReXhEUVVGRE8xRkJRMWdzVDBGQlR5eERRVUZETEVWQlFVVXNSVUZCUlR0WlFVTlNMRWxCUVVrc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVkQlFVY3NTVUZCU1N4TFFVRkxMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU03V1VGRGVrSXNTVUZCU1N4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUjBGQlJ5eEpRVUZKTEV0QlFVc3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJRenRaUVVONlFpeERRVUZETEVkQlFVY3NRMEZCUXl4RFFVRkRPMWxCUTA0c1QwRkJUeXhEUVVGRExFVkJRVVVzUlVGQlJUdG5Ra0ZEVWl4SlFVRkpMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4SFFVRkhMRWxCUVVrc1MwRkJTeXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETzJGQlF5OUNPMWxCUTBRc1NVRkJTU3hEUVVGRExFVkJRVVVzUTBGQlF5eERRVUZETEVOQlFVTXNSMEZCUnl4SlFVRkpMRXRCUVVzc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dFpRVU14UWl4SlFVRkpMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eEhRVUZITEVsQlFVa3NTMEZCU3l4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRE8xbEJRM3BDTEVsQlFVa3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFZEJRVWNzU1VGQlNTeExRVUZMTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1dVRkRla0lzU1VGQlNTeERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1IwRkJSeXhKUVVGSkxFdEJRVXNzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0WlFVTjZRaXhKUVVGSkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4SFFVRkhMRWxCUVVrc1MwRkJTeXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETzFsQlEzcENMRWxCUVVrc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVkQlFVY3NTVUZCU1N4TFFVRkxMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU03V1VGRGVrSXNTVUZCU1N4RFFVRkRMRVZCUVVVc1EwRkJReXhEUVVGRExFTkJRVU1zUjBGQlJ5eEpRVUZKTEV0QlFVc3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJRenRaUVVNeFFpeEpRVUZKTEVOQlFVTXNSVUZCUlN4RFFVRkRMRU5CUVVNc1EwRkJReXhIUVVGSExFbEJRVWtzUzBGQlN5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRPMWxCUXpGQ0xFbEJRVWtzUTBGQlF5eEpRVUZKTEVOQlFVTXNRMEZCUXl4RFFVRkRMRWRCUVVjc1NVRkJTU3hMUVVGTExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTTdVMEZETDBJN1NVRkRUQ3hEUVVGRE8wbEJSV0VzTUVKQlFXdENMRWRCUVdoRExGVkJRV2xETEVOQlFWTXNSVUZCUlN4RFFVRnRRenRSUVVNelJTeEpRVUZKTEVOQlFVTXNSMEZCUnl4SlFVRkpMRXRCUVVzc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dFJRVU55UWl4TFFVRkxMRWxCUVVrc1EwRkJReXhIUVVGSExFTkJRVU1zUlVGQlJTeERRVUZETEVkQlFVY3NRMEZCUXl4RlFVRkZMRVZCUVVVc1EwRkJReXhGUVVGRk8xbEJRM2hDTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1IwRkJSeXhKUVVGSkxFdEJRVXNzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0WlFVTndRaXhMUVVGTExFbEJRVWtzUTBGQlF5eEhRVUZITEVOQlFVTXNSVUZCUlN4RFFVRkRMRWRCUVVjc1EwRkJReXhGUVVGRkxFVkJRVVVzUTBGQlF5eEZRVUZGTzJkQ1FVTjRRaXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRExFTkJRVU1zUlVGQlJTeERRVUZETEVOQlFVTXNRMEZCUXp0aFFVTnlRanRUUVVOS08xRkJRMFFzVDBGQlR5eERRVUZETEVOQlFVTTdTVUZEWWl4RFFVRkRPMGxCUlU4c01rSkJRVk1zUjBGQmFrSTdVVUZCUVN4cFFrRlRRenRSUVZKSExFbEJRVWtzUTBGQlF5eEhRVUZITEVsQlFVa3NTMEZCU3l4RFFVRkRMRWxCUVVrc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dFJRVU14UWl4SlFVRkpMRU5CUVVNc1IwRkJSeXhEUVVGRExFTkJRVU03VVVGRFZpeExRVUZMTEVsQlFVa3NRMEZCUXl4SFFVRkhMRU5CUVVNc1JVRkJSU3hEUVVGRExFZEJRVWNzU1VGQlNTeERRVUZETEVOQlFVTXNSVUZCUlN4RlFVRkZMRU5CUVVNc1JVRkJSVHRaUVVNM1FpeEpRVUZKTEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFZEJRVWNzU1VGQlNTeERRVUZETEUxQlFVMHNRMEZCUXl4alFVRmpMRU5CUVVNc1NVRkJTU3hGUVVGRkxFTkJRVU1zUTBGQlF5eEhRVUZITEVkQlFVY3NRMEZCUXp0WlFVTjZSQ3hEUVVGRExFbEJRVWtzUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXp0VFFVTmtPMUZCUTBRc1EwRkJReXhIUVVGSExFbEJRVWtzUTBGQlF5eEpRVUZKTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1VVRkRha0lzVDBGQlR5eERRVUZETEVOQlFVTXNSMEZCUnl4RFFVRkRMRlZCUVVFc1EwRkJReXhKUVVGSExFOUJRVUVzUTBGQlF5eEpRVUZKTEV0QlFVa3NRMEZCUXl4SlFVRkpMRWRCUVVjc1EwRkJReXhGUVVGc1FpeERRVUZyUWl4RFFVRkRMRU5CUVVNN1NVRkRla01zUTBGQlF6dEpRVWROTEc5RFFVRnJRaXhIUVVGNlFpeFZRVUV3UWl4RFFVRmhPMUZCUVhaRExHbENRU3RIUXp0UlFUbEhSeXhKUVVGTkxFTkJRVU1zUjBGQlJ5eEpRVUZKTEVOQlFVTXNRMEZCUXl4RFFVRkRPMUZCUTJwQ0xFbEJRVWtzUTBGQlF5eEhRVUZITEVOQlFVTTdXVUZCUlN4UFFVRlBPMUZCUTJ4Q0xFbEJRVWtzUTBGQlV5eERRVUZETzFGQlQyUXNTVUZCU1N4RFFVRkRMRWRCUVVjc1NVRkJTU3hMUVVGTExFTkJRVk1zU1VGQlNTeERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRPMUZCUTJ4RExFbEJRVWtzUlVGQlJTeEhRVUZITEVsQlFVa3NTMEZCU3l4RFFVRlRMRWxCUVVrc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dFJRVU51UXl4SlFVRkpMRWRCUVVjc1IwRkJSeXhKUVVGSkxFdEJRVXNzUTBGQlV5eEpRVUZKTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1VVRkRjRU1zU1VGQlNTeEpRVUZKTEVkQlFVY3NRMEZCUXl4RFFVRkRPMUZCUjJJc1MwRkJTeXhKUVVGSkxFZEJRVU1zUjBGQlJ5eERRVUZETEVWQlFVVXNSMEZCUXl4SFFVRkhMRU5CUVVNc1JVRkJSU3hGUVVGRkxFZEJRVU1zUlVGQlJUdFpRVVY0UWl4TFFVRkxMRU5CUVVNc1IwRkJSeXhEUVVGRExFVkJRVVVzUTBGQlF5eEhRVUZITEVsQlFVa3NRMEZCUXl4RFFVRkRMRVZCUVVVc1JVRkJSU3hEUVVGRE8yZENRVUZGTEVkQlFVY3NRMEZCUXl4RFFVRkRMRU5CUVVNc1IwRkJSeXhKUVVGSkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRWRCUVVNc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF6dFpRVWQyUkN4TFFVRkxMRWxCUVVrc1EwRkJReXhIUVVGSExFTkJRVU1zUlVGQlJTeERRVUZETEVkQlFVY3NRMEZCUXl4RlFVRkZMRVZCUVVVc1EwRkJReXhGUVVGRk8yZENRVU40UWl4SlFVRkpMRWRCUVVNc1MwRkJTeXhEUVVGRE8yOUNRVUZGTEZOQlFWTTdaMEpCU1hSQ0xFbEJRVWtzV1VGQldTeEhRVUZITEVOQlFVTXNRMEZCUXp0blFrRkRja0lzU1VGQlNTeGxRVUZsTEVkQlFVY3NRMEZCUXl4RFFVRkRPMmRDUVVONFFpeFBRVUZQTEZsQlFWa3NSVUZCUlN4RlFVRkZPMjlDUVVOdVFpeGxRVUZsTEVkQlFVY3NRMEZCUXl4RFFVRkRPMjlDUVVOd1FpeExRVUZMTEVOQlFVTXNSMEZCUnl4RFFVRkRMRVZCUVVVc1EwRkJReXhIUVVGSExFbEJRVWtzUTBGQlF5eERRVUZETEVWQlFVVXNSVUZCUlN4RFFVRkRMRVZCUVVVN2QwSkJRM3BDTEVsQlFVMHNTVUZCUlN4SFFVRkhMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1IwRkJReXhEUVVGRExFZEJRVWNzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRE8zZENRVU53UXl4bFFVRmxMRWxCUVVrc1JVRkJSU3hEUVVGRExFTkJRVU1zUTBGQlF5eEhRVUZITEVsQlFVVXNSMEZCUnl4SlFVRkZMRU5CUVVNN2NVSkJRM1JETzI5Q1FVTkVMRWxCUVVrc1pVRkJaU3hIUVVGSExFbEJRVWs3ZDBKQlFVVXNUVUZCVFR0dlFrRkRiRU1zU1VGQlRTeEZRVUZGTEVkQlFVY3NTVUZCU1N4RFFVRkRMRk5CUVZNc1JVRkJSU3hEUVVGRE8yOUNRVU0xUWl4TFFVRkxMRU5CUVVNc1IwRkJSeXhEUVVGRExFVkJRVVVzUTBGQlF5eEhRVUZITEVsQlFVa3NRMEZCUXl4RFFVRkRMRVZCUVVVc1JVRkJSU3hEUVVGRE8zZENRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zU1VGQlNTeEZRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN2FVSkJRMnBFTzJkQ1FVTkVMRWxCUVUwc1VVRkJVU3hIUVVGSExFbEJRVWtzUTBGQlF5eEpRVUZKTEVOQlFVTXNaVUZCWlN4RFFVRkRMRU5CUVVNN1owSkJRelZETEVsQlFVMHNZVUZCWVN4SFFVRkhMRWxCUVVrc1EwRkJReXhEUVVGRExFTkJRVU1zUjBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1owSkJTVzVETEVsQlFVa3NUVUZCVFN4SFFVRkhMRWxCUVVrc1EwRkJReXhEUVVGRExFbEJRVWtzU1VGQlNTeERRVUZETEVOQlFVTXNRMEZCUXl4SlFVRkpMRU5CUVVNc1EwRkJReXhEUVVGRExFZEJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU03WjBKQlJ5OURMRWxCUVVrc1RVRkJUU3hIUVVGSExFTkJRVU1zU1VGQlNTeFJRVUZSTEVkQlFVY3NZVUZCWVN4SlFVRkpMRU5CUVVNc1VVRkJVU3hEUVVGRExHRkJRV0VzUTBGQlF5eEZRVUZGTzI5Q1FVTndSU3hMUVVGTExFTkJRVU1zUjBGQlJ5eERRVUZETEVWQlFVVXNRMEZCUXl4SFFVRkhMRWxCUVVrc1EwRkJReXhEUVVGRExFVkJRVVVzUlVGQlJTeERRVUZETzNkQ1FVRkZMRWxCUVVrc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNSMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFZEJRVWNzUTBGQlF5eERRVUZETzI5Q1FVTnFSQ3hUUVVGVE8ybENRVU5hTzJkQ1FVZEVMRWxCUVVrc1RVRkJUU3hIUVVGSExFTkJRVU1zUlVGQlJUdHZRa0ZEV2l4TlFVRk5MRWRCUVVjc1EwRkJReXhEUVVGRE8ybENRVU5rTzJkQ1FVTkVMRWxCUVUwc1owSkJRV2RDTEVkQlFVY3NZVUZCWVN4SFFVRkhMR0ZCUVdFc1JVRkRiRVFzUlVGQlJTeEhRVUZITEVOQlFVTXNSMEZCUnl4TlFVRk5MRWRCUVVjc1EwRkJReXhSUVVGUkxFZEJRVWNzWVVGQllTeERRVUZETEVkQlFVY3NRMEZCUXl4blFrRkJaMElzUjBGQlJ5eFJRVUZSTEVOQlFVTXNSVUZETlVVc1lVRkJZU3hIUVVGSExHVkJRV1VzUjBGQlJ5eFJRVUZSTEVWQlF6RkRMRVZCUVVVc1IwRkJSeXhEUVVGRExFZEJRVWNzUTBGQlF5eE5RVUZOTEVkQlFVY3NRMEZCUXl4blFrRkJaMElzUjBGQlJ5eGhRVUZoTEVOQlFVTXNRMEZCUXp0blFrRkRNVVFzU1VGQlNTeERRVUZETEZGQlFWRXNRMEZCUXl4RlFVRkZMRU5CUVVNN2IwSkJRMklzVDBGQlR5eERRVUZETEVkQlFVY3NRMEZCUXl4RlFVRkZMRU5CUVVNc1EwRkJRenRuUWtGRGNFSXNTMEZCU3l4RFFVRkRMRWRCUVVjc1EwRkJReXhGUVVGRkxFTkJRVU1zUjBGQlJ5eEpRVUZKTEVOQlFVTXNRMEZCUXl4RlFVRkZMRVZCUVVVc1EwRkJReXhGUVVGRk8yOUNRVU42UWl4SlFVRkpMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVkQlFVTXNRMEZCUXl4SlFVRkpMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUjBGQlJ5eEZRVUZGTEVOQlFVTTdiMEpCUXpGQ0xFZEJRVWNzUTBGQlF5eERRVUZETEVOQlFVTXNTVUZCU1N4SlFVRkpMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVkQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhIUVVGSExFVkJRVVVzUjBGQlJ5eERRVUZETEVOQlFVTXNSMEZCUnl4aFFVRmhMRWRCUVVjc1lVRkJZU3hIUVVGSExFTkJRVU1zUlVGQlJTeERRVUZETEVOQlFVTXNRMEZCUXl4SFFVRkhMR1ZCUVdVc1EwRkJReXhEUVVGRExFTkJRVU03YVVKQlEzQkhPMkZCUTBvN1dVRkRSQ3hMUVVGTExFTkJRVU1zUjBGQlJ5eERRVUZETEVWQlFVVXNRMEZCUXl4SFFVRkhMRWxCUVVrc1EwRkJReXhEUVVGRExFVkJRVVVzUlVGQlJTeERRVUZETzJkQ1FVRkZMRWxCUVVrc1IwRkJSeXhKUVVGSkxFTkJRVU1zUjBGQlJ5eERRVUZETEVsQlFVa3NSVUZCUlN4SlFVRkpMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVkQlFVTXNRMEZCUXl4RFFVRkRMRWRCUVVNc1EwRkJReXhIUVVGSExFZEJRVWNzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRPMU5CUTJoR08xRkJSVVFzU1VGQlNTeERRVUZETEVkQlFVY3NTVUZCU1N4RFFVRkRMRmxCUVZrc1IwRkJReXhEUVVGRExFTkJRVU03VVVGRE5VSXNTVUZCU1N4RFFVRkRMRWRCUVVjc1NVRkJTU3hEUVVGRExGbEJRVmtzUTBGQlF6dFJRVU14UWl4SlFVRkpMRU5CUVVNc1IwRkJSeXhKUVVGSkxFTkJRVU1zV1VGQldTeERRVUZETzFGQlF6RkNMRWxCUVVrc1EwRkJReXhIUVVGSExFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNc1EwRkJRenRSUVVOd1FpeEpRVUZKTEZGQlFWRXNSMEZCUnl4SlFVRkpMRU5CUVVNc1owSkJRV2RDTEVOQlFVTTdVVUZGY2tNc1MwRkJTeXhKUVVGSkxFTkJRVU1zUjBGQlZ5eERRVUZETEVWQlFVVXNRMEZCUXl4SFFVRkhMRkZCUVZFc1JVRkJSU3hGUVVGRkxFTkJRVU1zUlVGQlJUdFpRVU4yUXl4TFFVRkxMRU5CUVVNc1IwRkJSeXhEUVVGRExFVkJRVVVzUTBGQlF5eEhRVUZITEVsQlFVa3NRMEZCUXl4RFFVRkRMRVZCUVVVc1JVRkJSU3hEUVVGRExFVkJRVVU3WjBKQlEzcENMRWxCUVVrc1IwRkJSeXhIUVVGSExFbEJRVWtzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU03WjBKQlEzWkNMRWxCUVVrc1EwRkJReXhIUVVGSExFZEJRVWNzUjBGQlJ5eERRVUZETEVOQlFVTTdaMEpCUTJoQ0xFbEJRVWtzUTBGQlF5eEhRVUZITEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNN1owSkJRMlFzU1VGQlNTeERRVUZETEVkQlFVY3NRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJRenRuUWtGRFpDeEpRVUZKTEVOQlFVTXNSMEZCUnl4SlFVRkpMRU5CUVVNc1IwRkJSeXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETzJkQ1FVTndRaXhKUVVGSkxFVkJRVVVzUjBGQlJ5eERRVUZETEVOQlFVTXNTVUZCU1N4SFFVRkhMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUjBGQlJ5eEhRVUZITEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNc1EwRkJRenR2UWtGREwwSXNRMEZCUXl4SFFVRkhMRWRCUVVjc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVkQlFVY3NSMEZCUnl4RFFVRkRMRU5CUVVNc1IwRkJSeXhEUVVGRExFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRWRCUVVjc1IwRkJSeXhEUVVGRExFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNN1owSkJRM1JFTEVsQlFVa3NRMEZCUXl4RFFVRkRMRWRCUVVjc1JVRkJSU3hKUVVGSkxFVkJRVVVzU1VGQlNTeERRVUZETEVWQlFVVTdiMEpCUTNCQ0xFbEJRVWtzU1VGQlNTeERRVUZETEdWQlFXVXNSVUZCUlR0M1FrRkRkRUlzU1VGQlNTeERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zU1VGQlNTeEpRVUZKTEVkQlFVY3NRMEZCUXl4SFFVRkhMRVZCUVVVc1EwRkJRenQzUWtGRE9VSXNTVUZCU1N4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1NVRkJTU3hKUVVGSkxFZEJRVWNzUTBGQlF5eERRVUZETzNGQ1FVTXZRanQ1UWtGQlRUdDNRa0ZEU0N4SlFVRkpMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4SlFVRkpMRU5CUVVNc1IwRkJSeXhGUVVGRkxFTkJRVU03ZDBKQlEzWkNMRWxCUVVrc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFbEJRVWtzUTBGQlF5eERRVUZETzNGQ1FVTjRRanRwUWtGRFNqdGhRVU5LTzFOQlEwbzdVVUZEUkN4SlFVRkpMRU5CUVVNc1NVRkJTU3hEUVVGRExFdEJRVXNzUTBGQlF5eFBRVUZQTEVWQlFVVXNSVUZCUlR0WlFVTjJRaXhKUVVGSkxFTkJRVU1zUzBGQlN5eERRVUZETEV0QlFVc3NRMEZCUXl4VlFVRkRMRU5CUVVNc1JVRkJSU3hEUVVGRE8yZENRVU5zUWl4TFFVRkxMRU5CUVVNc1IwRkJSeXhEUVVGRExFVkJRVVVzUTBGQlF5eEhRVUZITEV0QlFVa3NRMEZCUXl4RFFVRkRMRVZCUVVVc1JVRkJSU3hEUVVGRExFVkJRVVU3YjBKQlEzcENMRXRCUVVrc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFbEJRVWtzU1VGQlNTeERRVUZETzI5Q1FVTjRRaXhMUVVGSkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhKUVVGSkxFbEJRVWtzUjBGQlJ5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1IwRkJSeXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJRenRwUWtGRE0wTTdXVUZEVEN4RFFVRkRMRU5CUVVNc1EwRkJRenRUUVVOT08wbEJVMHdzUTBGQlF6dEpRVVZqTEdWQlFVOHNSMEZCZEVJc1ZVRkJkVUlzUTBGQlZ5eEZRVUZGTEVOQlFWYzdVVUZETTBNc1NVRkJTU3hEUVVGRExFZEJRVWNzUTBGQlF5eEZRVUZGTEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNc1RVRkJUU3hEUVVGRE8xRkJRM2hDTEU5QlFVOHNRMEZCUXl4RlFVRkZPMWxCUVVVc1EwRkJReXhKUVVGSkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU03VVVGRE4wSXNUMEZCVHl4RFFVRkRMRU5CUVVNN1NVRkRZaXhEUVVGRE8wbEJSMk1zY1VKQlFXRXNSMEZCTlVJc1ZVRkJOa0lzUTBGQllTeEZRVUZGTEVOQlFWY3NSVUZCUlN4RFFVRlhPMUZCUTJoRkxFbEJRVWtzUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXl4TlFVRk5MRU5CUVVNN1VVRkRha0lzVDBGQlR5eERRVUZETEVWQlFVVTdXVUZCUlN4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFZEJRVWNzVDBGQlR5eERRVUZETEU5QlFVOHNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFVkJRVVVzUTBGQlF5eERRVUZETEVOQlFVTTdTVUZEYUVRc1EwRkJRenRKUVV0TkxHbERRVUZsTEVkQlFYUkNMRlZCUVhWQ0xFTkJRV0U3VVVGRGFFTXNTVUZCU1N4VFFVRlRMRWRCUVVjc1EwRkJReXhGUVVGRkxGZEJRVmNzUjBGQlJ5eERRVUZETEVOQlFVTTdVVUZEYmtNc1MwRkJTeXhKUVVGSkxFTkJRVU1zUjBGQlJ5eERRVUZETEVWQlFVVXNRMEZCUXl4SFFVRkhMRWxCUVVrc1EwRkJReXhEUVVGRExFVkJRVVVzUlVGQlJTeERRVUZETEVWQlFVVTdXVUZETjBJc1UwRkJVeXhKUVVGSkxFOUJRVThzUTBGQlF5eFBRVUZQTEVOQlFVTXNTVUZCU1N4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUlVGQlJTeERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJRenRaUVVNNVF5eFBRVUZQTEVOQlFVTXNZVUZCWVN4RFFVRkRMRWxCUVVrc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVWQlFVVXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhGUVVGRkxFbEJRVWtzUTBGQlF5eEZRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJRenRaUVVOdVJDeFhRVUZYTEVsQlFVa3NUMEZCVHl4RFFVRkRMRTlCUVU4c1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVWQlFVVXNTVUZCU1N4RFFVRkRMRVZCUVVVc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETzFOQlEzQkVPMUZCUTBRc1NVRkJTU3hYUVVGWExFdEJRVXNzUTBGQlF5eEpRVUZKTEVOQlFVTXNVVUZCVVN4RFFVRkRMRmRCUVZjc1EwRkJRenRaUVVGRkxFOUJRVThzUTBGQlF5eERRVUZETzFGQlF6RkVMRTlCUVU4c1EwRkJReXhIUVVGSExGTkJRVk1zUjBGQlJ5eFhRVUZYTEVOQlFVTTdTVUZEZGtNc1EwRkJRenRKUVVWTkxEaENRVUZaTEVkQlFXNUNPMUZCUTBrc1NVRkJTU3hEUVVGRExHdENRVUZyUWl4RFFVRkRMRWxCUVVrc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dFJRVU5vUXl4SlFVRkpMRXRCUVVzc1IwRkJSeXhKUVVGSkxFTkJRVU1zWlVGQlpTeERRVUZETEVsQlFVa3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJRenRSUVVONlF5eExRVUZMTEVsQlFVa3NRMEZCUXl4SFFVRkhMRU5CUVVNc1JVRkJSU3hEUVVGRExFZEJRVWNzU1VGQlNTeERRVUZETEVOQlFVTXNSVUZCUlN4RlFVRkZMRU5CUVVNc1JVRkJSVHRaUVVNM1FpeEpRVUZKTEVOQlFVTXNaVUZCWlN4RFFVRkRMRWxCUVVrc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVWQlFVVXNTVUZCU1N4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUlVGQlJTeExRVUZMTEVOQlFVTXNRMEZCUXp0VFFVTnlSRHRSUVVORUxFOUJRVThzU1VGQlNTeERRVUZETEdGQlFXRXNSVUZCUlN4RFFVRkRPMGxCUTJoRExFTkJRVU03U1VGRll5eFpRVUZKTEVkQlFXNUNMRlZCUVc5Q0xFTkJRV0VzUlVGQlJTeERRVUZoTzFGQlF6VkRMRWxCUVVrc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF5eE5RVUZOTEVWQlFVVXNRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eE5RVUZOTEVOQlFVTTdVVUZEYkVNc1MwRkJTeXhKUVVGSkxFTkJRVU1zUjBGQlJ5eERRVUZETEVWQlFVVXNRMEZCUXl4SFFVRkhMRU5CUVVNc1JVRkJSU3hGUVVGRkxFTkJRVU1zUlVGQlJUdFpRVU40UWl4TFFVRkxMRWxCUVVrc1EwRkJReXhIUVVGSExFTkJRVU1zUlVGQlJTeERRVUZETEVkQlFVY3NRMEZCUXl4RlFVRkZMRVZCUVVVc1EwRkJReXhGUVVGRk8yZENRVU40UWl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVkQlFVY3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETzJGQlEzSkNPMU5CUTBvN1NVRkRUQ3hEUVVGRE8wbEJVVThzWjBOQlFXTXNSMEZCZEVJc1ZVRkJkVUlzUlVGQll5eEZRVUZGTEVOQlFXRXNSVUZCUlN4RFFVRmhMRVZCUVVVc1VVRkJaMEk3VVVGRGFrWXNUMEZCVHl4RFFVRkRMRWxCUVVrc1EwRkJReXhGUVVGRkxFVkJRVVVzUTBGQlF5eERRVUZETEVOQlFVTTdVVUZEY0VJc1NVRkJTU3hEUVVGRExHVkJRV1VzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRVZCUVVVc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eEZRVUZGTEZGQlFWRXNRMEZCUXl4RFFVRkRPMUZCUXpORExFbEJRVWtzU1VGQlNTeERRVUZETEU5QlFVODdXVUZCUlN4SlFVRkpMRU5CUVVNc1QwRkJUeXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVWQlFVVXNRMEZCUXl4RFFVRkRMRU5CUVVNc1JVRkJSU3hGUVVGRkxFTkJRVU1zUTBGQlF5eERRVUZETEVWQlFVVXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU03VVVGRGRFUXNTVUZCU1N4RFFVRkRMR1ZCUVdVc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVWQlFVVXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhGUVVGRkxGRkJRVkVzUTBGQlF5eERRVUZETzFGQlF6TkRMRWxCUVVrc1NVRkJTU3hEUVVGRExFOUJRVTg3V1VGQlJTeEpRVUZKTEVOQlFVTXNUMEZCVHl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNSVUZCUlN4RlFVRkZMRU5CUVVNc1EwRkJReXhEUVVGRExFVkJRVVVzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1VVRkhja1FzUzBGQlN5eEpRVUZKTEVOQlFVTXNSMEZCUnl4RFFVRkRMRVZCUVVVc1EwRkJReXhIUVVGSExFbEJRVWtzUTBGQlF5eERRVUZETEVWQlFVVXNRMEZCUXl4RlFVRkZPMWxCUXpOQ0xFbEJRVWtzUTBGQlF5eGxRVUZsTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhGUVVGRkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNSVUZCUlN4UlFVRlJMRU5CUVVNc1EwRkJRenRKUVZWdVJDeERRVUZETzBsQlJXTXNZMEZCVFN4SFFVRnlRaXhWUVVGelFpeERRVUZUTEVWQlFVVXNRMEZCVXl4RlFVRkZMRU5CUVdkRE8xRkJRM2hGTEVsQlFVa3NRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJRenRSUVVGRExFOUJRVThzUTBGQlF5eEZRVUZGTEVkQlFVY3NRMEZCUXl4RlFVRkZPMWxCUTNaQ0xFbEJRVWtzUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXp0WlFVRkRMRTlCUVU4c1EwRkJReXhGUVVGRkxFZEJRVWNzUTBGQlF6dG5Ra0ZCUlN4RFFVRkRMRU5CUVVNc1EwRkJReXhGUVVGRkxFTkJRVU1zUTBGQlF5eERRVUZETzFOQlEzUkRPMGxCUTB3c1EwRkJRenRKUVVOUExEWkNRVUZYTEVkQlFXNUNMRlZCUVc5Q0xFTkJRV2RETzFGQlEyaEVMRTlCUVU4c1EwRkJReXhOUVVGTkxFTkJRVU1zU1VGQlNTeERRVUZETEVOQlFVTXNSVUZCUlN4SlFVRkpMRU5CUVVNc1EwRkJReXhGUVVGRkxFTkJRVU1zUTBGQlF5eERRVUZETzBsQlEzUkRMRU5CUVVNN1NVRkZUeXh4UTBGQmJVSXNSMEZCTTBJc1ZVRkJORUlzUlVGQll5eEZRVUZGTEVOQlFXRTdVVUZCZWtRc2FVSkJaVU03VVVGa1J5eEpRVUZKTEVOQlFVTXNhMEpCUVd0Q0xFTkJRVU1zUlVGQlJTeERRVUZETEVOQlFVTTdVVUZETlVJc1NVRkJTU3hMUVVGTExFZEJRVWNzU1VGQlNTeERRVUZETEdWQlFXVXNRMEZCUXl4SlFVRkpMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU03VVVGRGVrTXNTVUZCU1N4RFFVRkRMR05CUVdNc1EwRkJReXhGUVVGRkxFVkJRVVVzUTBGQlF5eEZRVUZGTEVsQlFVa3NRMEZCUXl4RFFVRkRMRVZCUVVVc1MwRkJTeXhEUVVGRExFTkJRVU03VVVGTk1VTXNTVUZCU1N4SlFVRkpMRU5CUVVNc1QwRkJUeXhGUVVGRk8xbEJRMlFzU1VGQlNTeERRVUZETEZkQlFWY3NRMEZCUXl4VlFVRkRMRU5CUVVNc1JVRkJSU3hEUVVGRExFbEJRVXNzVDBGQlFTeExRVUZKTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eEhRVUZITEVWQlFVVXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFVkJRV3BETEVOQlFXbERMRU5CUVVNc1EwRkJRenRaUVVNNVJDeEpRVUZKTEVsQlFVa3NSMEZCUnl4SlFVRkpMRU5CUVVNc1pVRkJaU3hEUVVGRExFbEJRVWtzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0WlFVTjRReXhKUVVGSkxFZEJRVWNzU1VGQlNTeERRVUZETEVkQlFVY3NRMEZCUXl4SFFVRkhMRVZCUVVVc1NVRkJTU3hEUVVGRExFZEJRVWNzUTBGQlF5eEpRVUZKTEVWQlFVVXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJRenRaUVVONFF5eEpRVUZKTEVOQlFVTXNZMEZCWXl4RFFVRkRMRVZCUVVVc1JVRkJSU3hEUVVGRExFVkJRVVVzU1VGQlNTeERRVUZETEVOQlFVTXNSVUZCUlN4SlFVRkpMRU5CUVVNc1EwRkJRenRUUVVNMVF6dEpRVU5NTEVOQlFVTTdTVUZGVFN4eFFrRkJSeXhIUVVGV0xGVkJRVmNzVlVGQmEwSTdVVUZEZWtJc1NVRkJTU3hOUVVGTkxFZEJRVWNzVFVGQlRTeERRVUZETEZOQlFWTXNSVUZCUlN4VFFVRlRMRWRCUVVjc1MwRkJTeXhEUVVGRE8xRkJRMnBFTEU5QlFVOHNRMEZCUXl4VFFVRlRMRWxCUVVrc1ZVRkJWU3hGUVVGRkxFZEJRVWNzUTBGQlF5eEZRVUZGTzFsQlEyNURMRWxCUVVrc1EwRkJReXhIUVVGSExFbEJRVWtzUTBGQlF5eFZRVUZWTEVWQlFVVXNRMEZCUXp0WlFVTXhRaXhUUVVGVExFZEJRVWNzU1VGQlNTeERRVUZETEVkQlFVY3NRMEZCUXl4TlFVRk5MRWRCUVVjc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF5eEhRVUZITEVsQlFVa3NRMEZCUXl4VFFVRlRMRU5CUVVNN1dVRkRkRVFzVFVGQlRTeEhRVUZITEVOQlFVTXNRMEZCUXp0VFFVTmtPMUZCUTBRc1QwRkJUeXhOUVVGTkxFTkJRVU03U1VGRGJFSXNRMEZCUXp0SlFVVk5MRFJDUVVGVkxFZEJRV3BDTzFGQlFVRXNhVUpCWlVNN1VVRmtSeXhKUVVGSkxFTkJRVU1zYlVKQlFXMUNMRU5CUVVNc1NVRkJTU3hEUVVGRExFTkJRVU1zUlVGQlJTeEpRVUZKTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1VVRkRla01zVDBGQlR5eERRVUZETEVkQlFVY3NRMEZCUXl4SlFVRkpMRU5CUVVNc1EwRkJReXhGUVVGRkxFbEJRVWtzUTBGQlF5eERRVUZETEVWQlFVVXNTVUZCU1N4RFFVRkRMRVZCUVVVc1EwRkJReXhEUVVGRE8xRkJRM0pETEVsQlFVa3NRMEZCUXl4dFFrRkJiVUlzUTBGQlF5eEpRVUZKTEVOQlFVTXNSVUZCUlN4RlFVRkZMRWxCUVVrc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dFJRVU14UXl4UFFVRlBMRU5CUVVNc1IwRkJSeXhEUVVGRExFbEJRVWtzUTBGQlF5eERRVUZETEVWQlFVVXNTVUZCU1N4RFFVRkRMRU5CUVVNc1JVRkJSU3hKUVVGSkxFTkJRVU1zUlVGQlJTeERRVUZETEVOQlFVTTdVVUZEY2tNc1NVRkJTU3hEUVVGRExHMUNRVUZ0UWl4RFFVRkRMRWxCUVVrc1EwRkJReXhGUVVGRkxFVkJRVVVzU1VGQlNTeERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRPMUZCUXpGRExFbEJRVWtzUTBGQlF5eHRRa0ZCYlVJc1EwRkJReXhKUVVGSkxFTkJRVU1zUTBGQlF5eEZRVUZGTEVsQlFVa3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJRenRSUVVONlF5eEpRVUZKTEVsQlFVa3NSMEZCUnl4RFFVRkRMRU5CUVVNN1VVRkRZaXhKUVVGSkxFTkJRVU1zVjBGQlZ5eERRVUZETEZWQlFVTXNRMEZCUXl4RlFVRkZMRU5CUVVNN1dVRkRiRUlzU1VGQlNTeERRVUZETEVkQlFVY3NRMEZCUXl4TFFVRkpMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4SFFVRkhMRWRCUVVjc1IwRkJSeXhMUVVGSkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhIUVVGSExFZEJRVWNzUjBGQlJ5eExRVUZKTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eEhRVUZITEV0QlFVa3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNSMEZCUnl4SFFVRkhMRVZCUTJwR0xFTkJRVU1zUjBGQlJ5eExRVUZKTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXp0WlFVTjZRaXhKUVVGSkxFbEJRVWtzUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXp0WlFVTmtMRXRCUVVrc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRE8xRkJRM0pDTEVOQlFVTXNRMEZCUXl4RFFVRkRPMUZCUTBnc1QwRkJUeXhKUVVGSkxFTkJRVU03U1VGRGFFSXNRMEZCUXp0SlFVVmpMRmRCUVVjc1IwRkJiRUlzVlVGQmJVSXNRMEZCWVN4RlFVRkZMRU5CUVdFc1JVRkJSU3hEUVVGaE8xRkJRekZFTEU5QlFVOHNRMEZCUXl4TlFVRk5MRU5CUVVNc1EwRkJReXhEUVVGRExFMUJRVTBzUlVGQlJTeERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1RVRkJUU3hGUVVGRkxGVkJRVU1zUTBGQlF5eEZRVUZGTEVOQlFVTTdXVUZEZGtNc1QwRkJRU3hEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4SFFVRkhMRWRCUVVjN1VVRkJOME1zUTBGQk5rTXNRMEZCUXl4RFFVRkRPMGxCUTNaRUxFTkJRVU03U1VGRlRTeHBRMEZCWlN4SFFVRjBRaXhWUVVGMVFpeERRVUZYTEVWQlFVVXNRMEZCVnl4RlFVRkZMRkZCUVdkQ08xRkJRemRFTEV0QlFVc3NTVUZCU1N4RFFVRkRMRWRCUVVjc1EwRkJReXhGUVVGRkxFTkJRVU1zUjBGQlJ5eEpRVUZKTEVOQlFVTXNRMEZCUXl4RlFVRkZMRVZCUVVVc1EwRkJReXhGUVVGRk8xbEJRemRDTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1IwRkJSeXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVkQlFVY3NVVUZCVVN4SFFVRkhMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dFRRVU5xUXp0SlFVTk1MRU5CUVVNN1NVRkZUU3dyUWtGQllTeEhRVUZ3UWp0UlFVTkpMRWxCUVVrc1RVRkJUU3hIUVVGSExFTkJRVU1zUTBGQlF6dFJRVU5tTEV0QlFVc3NTVUZCU1N4RFFVRkRMRWRCUVVjc1EwRkJReXhGUVVGRkxFOUJRVThzUjBGQlJ5eEpRVUZKTEVOQlFVTXNRMEZCUXl4SFFVRkhMRU5CUVVNc1JVRkJSU3hEUVVGRExFZEJRVWNzVDBGQlR5eEZRVUZGTEVWQlFVVXNRMEZCUXl4RlFVRkZPMWxCUTNCRUxFdEJRVXNzU1VGQlNTeERRVUZETEVkQlFVY3NRMEZCUXl4SFFVRkhMRU5CUVVNc1JVRkJSU3hEUVVGRExFZEJRVWNzU1VGQlNTeERRVUZETEVOQlFVTXNSVUZCUlN4RFFVRkRMRWRCUVVjc1EwRkJReXhGUVVGRkxFVkJRVVVzUTBGQlF5eEZRVUZGTzJkQ1FVTjRReXhKUVVGSkxFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTTdaMEpCUTFZc1MwRkJTeXhKUVVGSkxFTkJRVU1zUjBGQlJ5eERRVUZETEVWQlFVVXNRMEZCUXl4SFFVRkhMRWxCUVVrc1EwRkJReXhEUVVGRExFVkJRVVVzUlVGQlJTeERRVUZETEVWQlFVVTdiMEpCUXpkQ0xFbEJRVWtzUlVGQlJTeEhRVUZITEVsQlFVa3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVkQlFVY3NTVUZCU1N4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0dlFrRkRja01zUTBGQlF5eEpRVUZKTEVWQlFVVXNSMEZCUnl4RlFVRkZMRU5CUVVNN2FVSkJRMmhDTzJkQ1FVTkVMRU5CUVVNc1IwRkJSeXhKUVVGSkxFTkJRVU1zU1VGQlNTeERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRPMmRDUVVOcVFpeEpRVUZKTEVOQlFVTXNSMEZCUnl4SlFVRkpMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRPMmRDUVVOeVFpeEpRVUZKTEVOQlFVTXNVVUZCVVN4RFFVRkRMRU5CUVVNc1EwRkJRenR2UWtGQlJTeFRRVUZUTzJkQ1FVTXpRaXhKUVVGSkxFVkJRVVVzUjBGQlJ5eERRVUZETEVkQlFVY3NRMEZCUXl4RFFVRkRPMmRDUVVObUxFbEJRVWtzUlVGQlJTeEhRVUZITEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNN1owSkJRMllzVFVGQlRTeEpRVUZKTEVWQlFVVXNSMEZCUnl4RlFVRkZMRWRCUVVjc1JVRkJSU3hEUVVGRE8yRkJRekZDTzFOQlEwbzdVVUZEUkN4UFFVRlBMRTFCUVUwc1EwRkJRenRKUVVOc1FpeERRVUZETzBsQmNGaGpMRzlDUVVGWkxFZEJRVmNzUzBGQlN5eERRVUZETzBsQmNWaG9SQ3hqUVVGRE8wTkJRVUVzUVVFdldVUXNTVUVyV1VNN1FVRXZXVmtzTUVKQlFVODdRVUZyV25CQ08wbEJUVWtzYzBKQlFXMUNMRWxCUVdkQ08xRkJRV2hDTEhGQ1FVRkJMRVZCUVVFc1VVRkJaMEk3VVVGQmFFSXNVMEZCU1N4SFFVRktMRWxCUVVrc1EwRkJXVHRSUVV3elFpeE5RVUZETEVkQlFWY3NUVUZCVFN4RFFVRkRPMUZCUTI1Q0xFMUJRVU1zUjBGQlZ5eFBRVUZQTEVOQlFVTTdVVUZEY0VJc1RVRkJReXhIUVVGWExGVkJRVlVzUTBGQlF6dFJRVU4yUWl4VlFVRkxMRWRCUVZjc1MwRkJTeXhEUVVGRE8wbEJSVk1zUTBGQlF6dEpRVWQ0UXl3NFFrRkJUeXhIUVVGUU8xRkJRMGtzU1VGQlNTeERRVUZETEVsQlFVa3NSMEZCUnl4RFFVRkRMRWxCUVVrc1EwRkJReXhKUVVGSkxFZEJRVWNzU1VGQlNTeERRVUZETEVOQlFVTXNSMEZCUnl4SlFVRkpMRU5CUVVNc1EwRkJReXhEUVVGRExFZEJRVWNzU1VGQlNTeERRVUZETEVOQlFVTXNRMEZCUXp0UlFVTnVSQ3hQUVVGUExFTkJRVU1zU1VGQlNTeERRVUZETEVsQlFVa3NTVUZCU1N4RlFVRkZMRU5CUVVNc1IwRkJSeXhKUVVGSkxFTkJRVU1zUzBGQlN5eERRVUZETzBsQlF6RkRMRU5CUVVNN1NVRkhSQ3h4UTBGQll5eEhRVUZrTEZWQlFXVXNSMEZCVnl4RlFVRkZMRWRCUVZjN1VVRkRia01zVDBGQlR5eEhRVUZITEVkQlFVY3NTVUZCU1N4RFFVRkRMRTlCUVU4c1JVRkJSU3hIUVVGSExFTkJRVU1zUjBGQlJ5eEhRVUZITEVkQlFVY3NRMEZCUXl4RFFVRkRPMGxCUXpsRExFTkJRVU03U1VGRFRDeHRRa0ZCUXp0QlFVRkVMRU5CUVVNc1FVRnNRa1FzU1VGclFrTTdRVUZzUWxrc2IwTkJRVmtpZlE9PSIsIlwidXNlIHN0cmljdFwiO1xudmFyIF9fZXh0ZW5kcyA9ICh0aGlzICYmIHRoaXMuX19leHRlbmRzKSB8fCAoZnVuY3Rpb24gKCkge1xuICAgIHZhciBleHRlbmRTdGF0aWNzID0gZnVuY3Rpb24gKGQsIGIpIHtcbiAgICAgICAgZXh0ZW5kU3RhdGljcyA9IE9iamVjdC5zZXRQcm90b3R5cGVPZiB8fFxuICAgICAgICAgICAgKHsgX19wcm90b19fOiBbXSB9IGluc3RhbmNlb2YgQXJyYXkgJiYgZnVuY3Rpb24gKGQsIGIpIHsgZC5fX3Byb3RvX18gPSBiOyB9KSB8fFxuICAgICAgICAgICAgZnVuY3Rpb24gKGQsIGIpIHsgZm9yICh2YXIgcCBpbiBiKSBpZiAoYi5oYXNPd25Qcm9wZXJ0eShwKSkgZFtwXSA9IGJbcF07IH07XG4gICAgICAgIHJldHVybiBleHRlbmRTdGF0aWNzKGQsIGIpO1xuICAgIH07XG4gICAgcmV0dXJuIGZ1bmN0aW9uIChkLCBiKSB7XG4gICAgICAgIGV4dGVuZFN0YXRpY3MoZCwgYik7XG4gICAgICAgIGZ1bmN0aW9uIF9fKCkgeyB0aGlzLmNvbnN0cnVjdG9yID0gZDsgfVxuICAgICAgICBkLnByb3RvdHlwZSA9IGIgPT09IG51bGwgPyBPYmplY3QuY3JlYXRlKGIpIDogKF9fLnByb3RvdHlwZSA9IGIucHJvdG90eXBlLCBuZXcgX18oKSk7XG4gICAgfTtcbn0pKCk7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgcmVjdGFuZ2xlXzEgPSByZXF1aXJlKFwiLi9yZWN0YW5nbGVcIik7XG52YXIgUG9pbnQgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIFBvaW50KCkge1xuICAgIH1cbiAgICByZXR1cm4gUG9pbnQ7XG59KCkpO1xuZXhwb3J0cy5Qb2ludCA9IFBvaW50O1xudmFyIExpbmVTZWdtZW50ID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBMaW5lU2VnbWVudCh4MSwgeTEsIHgyLCB5Mikge1xuICAgICAgICB0aGlzLngxID0geDE7XG4gICAgICAgIHRoaXMueTEgPSB5MTtcbiAgICAgICAgdGhpcy54MiA9IHgyO1xuICAgICAgICB0aGlzLnkyID0geTI7XG4gICAgfVxuICAgIHJldHVybiBMaW5lU2VnbWVudDtcbn0oKSk7XG5leHBvcnRzLkxpbmVTZWdtZW50ID0gTGluZVNlZ21lbnQ7XG52YXIgUG9seVBvaW50ID0gKGZ1bmN0aW9uIChfc3VwZXIpIHtcbiAgICBfX2V4dGVuZHMoUG9seVBvaW50LCBfc3VwZXIpO1xuICAgIGZ1bmN0aW9uIFBvbHlQb2ludCgpIHtcbiAgICAgICAgcmV0dXJuIF9zdXBlciAhPT0gbnVsbCAmJiBfc3VwZXIuYXBwbHkodGhpcywgYXJndW1lbnRzKSB8fCB0aGlzO1xuICAgIH1cbiAgICByZXR1cm4gUG9seVBvaW50O1xufShQb2ludCkpO1xuZXhwb3J0cy5Qb2x5UG9pbnQgPSBQb2x5UG9pbnQ7XG5mdW5jdGlvbiBpc0xlZnQoUDAsIFAxLCBQMikge1xuICAgIHJldHVybiAoUDEueCAtIFAwLngpICogKFAyLnkgLSBQMC55KSAtIChQMi54IC0gUDAueCkgKiAoUDEueSAtIFAwLnkpO1xufVxuZXhwb3J0cy5pc0xlZnQgPSBpc0xlZnQ7XG5mdW5jdGlvbiBhYm92ZShwLCB2aSwgdmopIHtcbiAgICByZXR1cm4gaXNMZWZ0KHAsIHZpLCB2aikgPiAwO1xufVxuZnVuY3Rpb24gYmVsb3cocCwgdmksIHZqKSB7XG4gICAgcmV0dXJuIGlzTGVmdChwLCB2aSwgdmopIDwgMDtcbn1cbmZ1bmN0aW9uIENvbnZleEh1bGwoUykge1xuICAgIHZhciBQID0gUy5zbGljZSgwKS5zb3J0KGZ1bmN0aW9uIChhLCBiKSB7IHJldHVybiBhLnggIT09IGIueCA/IGIueCAtIGEueCA6IGIueSAtIGEueTsgfSk7XG4gICAgdmFyIG4gPSBTLmxlbmd0aCwgaTtcbiAgICB2YXIgbWlubWluID0gMDtcbiAgICB2YXIgeG1pbiA9IFBbMF0ueDtcbiAgICBmb3IgKGkgPSAxOyBpIDwgbjsgKytpKSB7XG4gICAgICAgIGlmIChQW2ldLnggIT09IHhtaW4pXG4gICAgICAgICAgICBicmVhaztcbiAgICB9XG4gICAgdmFyIG1pbm1heCA9IGkgLSAxO1xuICAgIHZhciBIID0gW107XG4gICAgSC5wdXNoKFBbbWlubWluXSk7XG4gICAgaWYgKG1pbm1heCA9PT0gbiAtIDEpIHtcbiAgICAgICAgaWYgKFBbbWlubWF4XS55ICE9PSBQW21pbm1pbl0ueSlcbiAgICAgICAgICAgIEgucHVzaChQW21pbm1heF0pO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgdmFyIG1heG1pbiwgbWF4bWF4ID0gbiAtIDE7XG4gICAgICAgIHZhciB4bWF4ID0gUFtuIC0gMV0ueDtcbiAgICAgICAgZm9yIChpID0gbiAtIDI7IGkgPj0gMDsgaS0tKVxuICAgICAgICAgICAgaWYgKFBbaV0ueCAhPT0geG1heClcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgbWF4bWluID0gaSArIDE7XG4gICAgICAgIGkgPSBtaW5tYXg7XG4gICAgICAgIHdoaWxlICgrK2kgPD0gbWF4bWluKSB7XG4gICAgICAgICAgICBpZiAoaXNMZWZ0KFBbbWlubWluXSwgUFttYXhtaW5dLCBQW2ldKSA+PSAwICYmIGkgPCBtYXhtaW4pXG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB3aGlsZSAoSC5sZW5ndGggPiAxKSB7XG4gICAgICAgICAgICAgICAgaWYgKGlzTGVmdChIW0gubGVuZ3RoIC0gMl0sIEhbSC5sZW5ndGggLSAxXSwgUFtpXSkgPiAwKVxuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIEgubGVuZ3RoIC09IDE7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoaSAhPSBtaW5taW4pXG4gICAgICAgICAgICAgICAgSC5wdXNoKFBbaV0pO1xuICAgICAgICB9XG4gICAgICAgIGlmIChtYXhtYXggIT0gbWF4bWluKVxuICAgICAgICAgICAgSC5wdXNoKFBbbWF4bWF4XSk7XG4gICAgICAgIHZhciBib3QgPSBILmxlbmd0aDtcbiAgICAgICAgaSA9IG1heG1pbjtcbiAgICAgICAgd2hpbGUgKC0taSA+PSBtaW5tYXgpIHtcbiAgICAgICAgICAgIGlmIChpc0xlZnQoUFttYXhtYXhdLCBQW21pbm1heF0sIFBbaV0pID49IDAgJiYgaSA+IG1pbm1heClcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIHdoaWxlIChILmxlbmd0aCA+IGJvdCkge1xuICAgICAgICAgICAgICAgIGlmIChpc0xlZnQoSFtILmxlbmd0aCAtIDJdLCBIW0gubGVuZ3RoIC0gMV0sIFBbaV0pID4gMClcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICBILmxlbmd0aCAtPSAxO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGkgIT0gbWlubWluKVxuICAgICAgICAgICAgICAgIEgucHVzaChQW2ldKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gSDtcbn1cbmV4cG9ydHMuQ29udmV4SHVsbCA9IENvbnZleEh1bGw7XG5mdW5jdGlvbiBjbG9ja3dpc2VSYWRpYWxTd2VlcChwLCBQLCBmKSB7XG4gICAgUC5zbGljZSgwKS5zb3J0KGZ1bmN0aW9uIChhLCBiKSB7IHJldHVybiBNYXRoLmF0YW4yKGEueSAtIHAueSwgYS54IC0gcC54KSAtIE1hdGguYXRhbjIoYi55IC0gcC55LCBiLnggLSBwLngpOyB9KS5mb3JFYWNoKGYpO1xufVxuZXhwb3J0cy5jbG9ja3dpc2VSYWRpYWxTd2VlcCA9IGNsb2Nrd2lzZVJhZGlhbFN3ZWVwO1xuZnVuY3Rpb24gbmV4dFBvbHlQb2ludChwLCBwcykge1xuICAgIGlmIChwLnBvbHlJbmRleCA9PT0gcHMubGVuZ3RoIC0gMSlcbiAgICAgICAgcmV0dXJuIHBzWzBdO1xuICAgIHJldHVybiBwc1twLnBvbHlJbmRleCArIDFdO1xufVxuZnVuY3Rpb24gcHJldlBvbHlQb2ludChwLCBwcykge1xuICAgIGlmIChwLnBvbHlJbmRleCA9PT0gMClcbiAgICAgICAgcmV0dXJuIHBzW3BzLmxlbmd0aCAtIDFdO1xuICAgIHJldHVybiBwc1twLnBvbHlJbmRleCAtIDFdO1xufVxuZnVuY3Rpb24gdGFuZ2VudF9Qb2ludFBvbHlDKFAsIFYpIHtcbiAgICB2YXIgVmNsb3NlZCA9IFYuc2xpY2UoMCk7XG4gICAgVmNsb3NlZC5wdXNoKFZbMF0pO1xuICAgIHJldHVybiB7IHJ0YW46IFJ0YW5nZW50X1BvaW50UG9seUMoUCwgVmNsb3NlZCksIGx0YW46IEx0YW5nZW50X1BvaW50UG9seUMoUCwgVmNsb3NlZCkgfTtcbn1cbmZ1bmN0aW9uIFJ0YW5nZW50X1BvaW50UG9seUMoUCwgVikge1xuICAgIHZhciBuID0gVi5sZW5ndGggLSAxO1xuICAgIHZhciBhLCBiLCBjO1xuICAgIHZhciB1cEEsIGRuQztcbiAgICBpZiAoYmVsb3coUCwgVlsxXSwgVlswXSkgJiYgIWFib3ZlKFAsIFZbbiAtIDFdLCBWWzBdKSlcbiAgICAgICAgcmV0dXJuIDA7XG4gICAgZm9yIChhID0gMCwgYiA9IG47Oykge1xuICAgICAgICBpZiAoYiAtIGEgPT09IDEpXG4gICAgICAgICAgICBpZiAoYWJvdmUoUCwgVlthXSwgVltiXSkpXG4gICAgICAgICAgICAgICAgcmV0dXJuIGE7XG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgcmV0dXJuIGI7XG4gICAgICAgIGMgPSBNYXRoLmZsb29yKChhICsgYikgLyAyKTtcbiAgICAgICAgZG5DID0gYmVsb3coUCwgVltjICsgMV0sIFZbY10pO1xuICAgICAgICBpZiAoZG5DICYmICFhYm92ZShQLCBWW2MgLSAxXSwgVltjXSkpXG4gICAgICAgICAgICByZXR1cm4gYztcbiAgICAgICAgdXBBID0gYWJvdmUoUCwgVlthICsgMV0sIFZbYV0pO1xuICAgICAgICBpZiAodXBBKSB7XG4gICAgICAgICAgICBpZiAoZG5DKVxuICAgICAgICAgICAgICAgIGIgPSBjO1xuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgaWYgKGFib3ZlKFAsIFZbYV0sIFZbY10pKVxuICAgICAgICAgICAgICAgICAgICBiID0gYztcbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIGEgPSBjO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgaWYgKCFkbkMpXG4gICAgICAgICAgICAgICAgYSA9IGM7XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBpZiAoYmVsb3coUCwgVlthXSwgVltjXSkpXG4gICAgICAgICAgICAgICAgICAgIGIgPSBjO1xuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgYSA9IGM7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59XG5mdW5jdGlvbiBMdGFuZ2VudF9Qb2ludFBvbHlDKFAsIFYpIHtcbiAgICB2YXIgbiA9IFYubGVuZ3RoIC0gMTtcbiAgICB2YXIgYSwgYiwgYztcbiAgICB2YXIgZG5BLCBkbkM7XG4gICAgaWYgKGFib3ZlKFAsIFZbbiAtIDFdLCBWWzBdKSAmJiAhYmVsb3coUCwgVlsxXSwgVlswXSkpXG4gICAgICAgIHJldHVybiAwO1xuICAgIGZvciAoYSA9IDAsIGIgPSBuOzspIHtcbiAgICAgICAgaWYgKGIgLSBhID09PSAxKVxuICAgICAgICAgICAgaWYgKGJlbG93KFAsIFZbYV0sIFZbYl0pKVxuICAgICAgICAgICAgICAgIHJldHVybiBhO1xuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIHJldHVybiBiO1xuICAgICAgICBjID0gTWF0aC5mbG9vcigoYSArIGIpIC8gMik7XG4gICAgICAgIGRuQyA9IGJlbG93KFAsIFZbYyArIDFdLCBWW2NdKTtcbiAgICAgICAgaWYgKGFib3ZlKFAsIFZbYyAtIDFdLCBWW2NdKSAmJiAhZG5DKVxuICAgICAgICAgICAgcmV0dXJuIGM7XG4gICAgICAgIGRuQSA9IGJlbG93KFAsIFZbYSArIDFdLCBWW2FdKTtcbiAgICAgICAgaWYgKGRuQSkge1xuICAgICAgICAgICAgaWYgKCFkbkMpXG4gICAgICAgICAgICAgICAgYiA9IGM7XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBpZiAoYmVsb3coUCwgVlthXSwgVltjXSkpXG4gICAgICAgICAgICAgICAgICAgIGIgPSBjO1xuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgYSA9IGM7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBpZiAoZG5DKVxuICAgICAgICAgICAgICAgIGEgPSBjO1xuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgaWYgKGFib3ZlKFAsIFZbYV0sIFZbY10pKVxuICAgICAgICAgICAgICAgICAgICBiID0gYztcbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIGEgPSBjO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxufVxuZnVuY3Rpb24gdGFuZ2VudF9Qb2x5UG9seUMoViwgVywgdDEsIHQyLCBjbXAxLCBjbXAyKSB7XG4gICAgdmFyIGl4MSwgaXgyO1xuICAgIGl4MSA9IHQxKFdbMF0sIFYpO1xuICAgIGl4MiA9IHQyKFZbaXgxXSwgVyk7XG4gICAgdmFyIGRvbmUgPSBmYWxzZTtcbiAgICB3aGlsZSAoIWRvbmUpIHtcbiAgICAgICAgZG9uZSA9IHRydWU7XG4gICAgICAgIHdoaWxlICh0cnVlKSB7XG4gICAgICAgICAgICBpZiAoaXgxID09PSBWLmxlbmd0aCAtIDEpXG4gICAgICAgICAgICAgICAgaXgxID0gMDtcbiAgICAgICAgICAgIGlmIChjbXAxKFdbaXgyXSwgVltpeDFdLCBWW2l4MSArIDFdKSlcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICsraXgxO1xuICAgICAgICB9XG4gICAgICAgIHdoaWxlICh0cnVlKSB7XG4gICAgICAgICAgICBpZiAoaXgyID09PSAwKVxuICAgICAgICAgICAgICAgIGl4MiA9IFcubGVuZ3RoIC0gMTtcbiAgICAgICAgICAgIGlmIChjbXAyKFZbaXgxXSwgV1tpeDJdLCBXW2l4MiAtIDFdKSlcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIC0taXgyO1xuICAgICAgICAgICAgZG9uZSA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiB7IHQxOiBpeDEsIHQyOiBpeDIgfTtcbn1cbmV4cG9ydHMudGFuZ2VudF9Qb2x5UG9seUMgPSB0YW5nZW50X1BvbHlQb2x5QztcbmZ1bmN0aW9uIExSdGFuZ2VudF9Qb2x5UG9seUMoViwgVykge1xuICAgIHZhciBybCA9IFJMdGFuZ2VudF9Qb2x5UG9seUMoVywgVik7XG4gICAgcmV0dXJuIHsgdDE6IHJsLnQyLCB0MjogcmwudDEgfTtcbn1cbmV4cG9ydHMuTFJ0YW5nZW50X1BvbHlQb2x5QyA9IExSdGFuZ2VudF9Qb2x5UG9seUM7XG5mdW5jdGlvbiBSTHRhbmdlbnRfUG9seVBvbHlDKFYsIFcpIHtcbiAgICByZXR1cm4gdGFuZ2VudF9Qb2x5UG9seUMoViwgVywgUnRhbmdlbnRfUG9pbnRQb2x5QywgTHRhbmdlbnRfUG9pbnRQb2x5QywgYWJvdmUsIGJlbG93KTtcbn1cbmV4cG9ydHMuUkx0YW5nZW50X1BvbHlQb2x5QyA9IFJMdGFuZ2VudF9Qb2x5UG9seUM7XG5mdW5jdGlvbiBMTHRhbmdlbnRfUG9seVBvbHlDKFYsIFcpIHtcbiAgICByZXR1cm4gdGFuZ2VudF9Qb2x5UG9seUMoViwgVywgTHRhbmdlbnRfUG9pbnRQb2x5QywgTHRhbmdlbnRfUG9pbnRQb2x5QywgYmVsb3csIGJlbG93KTtcbn1cbmV4cG9ydHMuTEx0YW5nZW50X1BvbHlQb2x5QyA9IExMdGFuZ2VudF9Qb2x5UG9seUM7XG5mdW5jdGlvbiBSUnRhbmdlbnRfUG9seVBvbHlDKFYsIFcpIHtcbiAgICByZXR1cm4gdGFuZ2VudF9Qb2x5UG9seUMoViwgVywgUnRhbmdlbnRfUG9pbnRQb2x5QywgUnRhbmdlbnRfUG9pbnRQb2x5QywgYWJvdmUsIGFib3ZlKTtcbn1cbmV4cG9ydHMuUlJ0YW5nZW50X1BvbHlQb2x5QyA9IFJSdGFuZ2VudF9Qb2x5UG9seUM7XG52YXIgQmlUYW5nZW50ID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBCaVRhbmdlbnQodDEsIHQyKSB7XG4gICAgICAgIHRoaXMudDEgPSB0MTtcbiAgICAgICAgdGhpcy50MiA9IHQyO1xuICAgIH1cbiAgICByZXR1cm4gQmlUYW5nZW50O1xufSgpKTtcbmV4cG9ydHMuQmlUYW5nZW50ID0gQmlUYW5nZW50O1xudmFyIEJpVGFuZ2VudHMgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIEJpVGFuZ2VudHMoKSB7XG4gICAgfVxuICAgIHJldHVybiBCaVRhbmdlbnRzO1xufSgpKTtcbmV4cG9ydHMuQmlUYW5nZW50cyA9IEJpVGFuZ2VudHM7XG52YXIgVFZHUG9pbnQgPSAoZnVuY3Rpb24gKF9zdXBlcikge1xuICAgIF9fZXh0ZW5kcyhUVkdQb2ludCwgX3N1cGVyKTtcbiAgICBmdW5jdGlvbiBUVkdQb2ludCgpIHtcbiAgICAgICAgcmV0dXJuIF9zdXBlciAhPT0gbnVsbCAmJiBfc3VwZXIuYXBwbHkodGhpcywgYXJndW1lbnRzKSB8fCB0aGlzO1xuICAgIH1cbiAgICByZXR1cm4gVFZHUG9pbnQ7XG59KFBvaW50KSk7XG5leHBvcnRzLlRWR1BvaW50ID0gVFZHUG9pbnQ7XG52YXIgVmlzaWJpbGl0eVZlcnRleCA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gVmlzaWJpbGl0eVZlcnRleChpZCwgcG9seWlkLCBwb2x5dmVydGlkLCBwKSB7XG4gICAgICAgIHRoaXMuaWQgPSBpZDtcbiAgICAgICAgdGhpcy5wb2x5aWQgPSBwb2x5aWQ7XG4gICAgICAgIHRoaXMucG9seXZlcnRpZCA9IHBvbHl2ZXJ0aWQ7XG4gICAgICAgIHRoaXMucCA9IHA7XG4gICAgICAgIHAudnYgPSB0aGlzO1xuICAgIH1cbiAgICByZXR1cm4gVmlzaWJpbGl0eVZlcnRleDtcbn0oKSk7XG5leHBvcnRzLlZpc2liaWxpdHlWZXJ0ZXggPSBWaXNpYmlsaXR5VmVydGV4O1xudmFyIFZpc2liaWxpdHlFZGdlID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBWaXNpYmlsaXR5RWRnZShzb3VyY2UsIHRhcmdldCkge1xuICAgICAgICB0aGlzLnNvdXJjZSA9IHNvdXJjZTtcbiAgICAgICAgdGhpcy50YXJnZXQgPSB0YXJnZXQ7XG4gICAgfVxuICAgIFZpc2liaWxpdHlFZGdlLnByb3RvdHlwZS5sZW5ndGggPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBkeCA9IHRoaXMuc291cmNlLnAueCAtIHRoaXMudGFyZ2V0LnAueDtcbiAgICAgICAgdmFyIGR5ID0gdGhpcy5zb3VyY2UucC55IC0gdGhpcy50YXJnZXQucC55O1xuICAgICAgICByZXR1cm4gTWF0aC5zcXJ0KGR4ICogZHggKyBkeSAqIGR5KTtcbiAgICB9O1xuICAgIHJldHVybiBWaXNpYmlsaXR5RWRnZTtcbn0oKSk7XG5leHBvcnRzLlZpc2liaWxpdHlFZGdlID0gVmlzaWJpbGl0eUVkZ2U7XG52YXIgVGFuZ2VudFZpc2liaWxpdHlHcmFwaCA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gVGFuZ2VudFZpc2liaWxpdHlHcmFwaChQLCBnMCkge1xuICAgICAgICB0aGlzLlAgPSBQO1xuICAgICAgICB0aGlzLlYgPSBbXTtcbiAgICAgICAgdGhpcy5FID0gW107XG4gICAgICAgIGlmICghZzApIHtcbiAgICAgICAgICAgIHZhciBuID0gUC5sZW5ndGg7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG47IGkrKykge1xuICAgICAgICAgICAgICAgIHZhciBwID0gUFtpXTtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IHAubGVuZ3RoOyArK2opIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHBqID0gcFtqXSwgdnYgPSBuZXcgVmlzaWJpbGl0eVZlcnRleCh0aGlzLlYubGVuZ3RoLCBpLCBqLCBwaik7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuVi5wdXNoKHZ2KTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGogPiAwKVxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5FLnB1c2gobmV3IFZpc2liaWxpdHlFZGdlKHBbaiAtIDFdLnZ2LCB2dikpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAocC5sZW5ndGggPiAxKVxuICAgICAgICAgICAgICAgICAgICB0aGlzLkUucHVzaChuZXcgVmlzaWJpbGl0eUVkZ2UocFswXS52diwgcFtwLmxlbmd0aCAtIDFdLnZ2KSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG4gLSAxOyBpKyspIHtcbiAgICAgICAgICAgICAgICB2YXIgUGkgPSBQW2ldO1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGogPSBpICsgMTsgaiA8IG47IGorKykge1xuICAgICAgICAgICAgICAgICAgICB2YXIgUGogPSBQW2pdLCB0ID0gdGFuZ2VudHMoUGksIFBqKTtcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgcSBpbiB0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgYyA9IHRbcV0sIHNvdXJjZSA9IFBpW2MudDFdLCB0YXJnZXQgPSBQaltjLnQyXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuYWRkRWRnZUlmVmlzaWJsZShzb3VyY2UsIHRhcmdldCwgaSwgaik7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLlYgPSBnMC5WLnNsaWNlKDApO1xuICAgICAgICAgICAgdGhpcy5FID0gZzAuRS5zbGljZSgwKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBUYW5nZW50VmlzaWJpbGl0eUdyYXBoLnByb3RvdHlwZS5hZGRFZGdlSWZWaXNpYmxlID0gZnVuY3Rpb24gKHUsIHYsIGkxLCBpMikge1xuICAgICAgICBpZiAoIXRoaXMuaW50ZXJzZWN0c1BvbHlzKG5ldyBMaW5lU2VnbWVudCh1LngsIHUueSwgdi54LCB2LnkpLCBpMSwgaTIpKSB7XG4gICAgICAgICAgICB0aGlzLkUucHVzaChuZXcgVmlzaWJpbGl0eUVkZ2UodS52diwgdi52dikpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBUYW5nZW50VmlzaWJpbGl0eUdyYXBoLnByb3RvdHlwZS5hZGRQb2ludCA9IGZ1bmN0aW9uIChwLCBpMSkge1xuICAgICAgICB2YXIgbiA9IHRoaXMuUC5sZW5ndGg7XG4gICAgICAgIHRoaXMuVi5wdXNoKG5ldyBWaXNpYmlsaXR5VmVydGV4KHRoaXMuVi5sZW5ndGgsIG4sIDAsIHApKTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBuOyArK2kpIHtcbiAgICAgICAgICAgIGlmIChpID09PSBpMSlcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIHZhciBwb2x5ID0gdGhpcy5QW2ldLCB0ID0gdGFuZ2VudF9Qb2ludFBvbHlDKHAsIHBvbHkpO1xuICAgICAgICAgICAgdGhpcy5hZGRFZGdlSWZWaXNpYmxlKHAsIHBvbHlbdC5sdGFuXSwgaTEsIGkpO1xuICAgICAgICAgICAgdGhpcy5hZGRFZGdlSWZWaXNpYmxlKHAsIHBvbHlbdC5ydGFuXSwgaTEsIGkpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBwLnZ2O1xuICAgIH07XG4gICAgVGFuZ2VudFZpc2liaWxpdHlHcmFwaC5wcm90b3R5cGUuaW50ZXJzZWN0c1BvbHlzID0gZnVuY3Rpb24gKGwsIGkxLCBpMikge1xuICAgICAgICBmb3IgKHZhciBpID0gMCwgbiA9IHRoaXMuUC5sZW5ndGg7IGkgPCBuOyArK2kpIHtcbiAgICAgICAgICAgIGlmIChpICE9IGkxICYmIGkgIT0gaTIgJiYgaW50ZXJzZWN0cyhsLCB0aGlzLlBbaV0pLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfTtcbiAgICByZXR1cm4gVGFuZ2VudFZpc2liaWxpdHlHcmFwaDtcbn0oKSk7XG5leHBvcnRzLlRhbmdlbnRWaXNpYmlsaXR5R3JhcGggPSBUYW5nZW50VmlzaWJpbGl0eUdyYXBoO1xuZnVuY3Rpb24gaW50ZXJzZWN0cyhsLCBQKSB7XG4gICAgdmFyIGludHMgPSBbXTtcbiAgICBmb3IgKHZhciBpID0gMSwgbiA9IFAubGVuZ3RoOyBpIDwgbjsgKytpKSB7XG4gICAgICAgIHZhciBpbnQgPSByZWN0YW5nbGVfMS5SZWN0YW5nbGUubGluZUludGVyc2VjdGlvbihsLngxLCBsLnkxLCBsLngyLCBsLnkyLCBQW2kgLSAxXS54LCBQW2kgLSAxXS55LCBQW2ldLngsIFBbaV0ueSk7XG4gICAgICAgIGlmIChpbnQpXG4gICAgICAgICAgICBpbnRzLnB1c2goaW50KTtcbiAgICB9XG4gICAgcmV0dXJuIGludHM7XG59XG5mdW5jdGlvbiB0YW5nZW50cyhWLCBXKSB7XG4gICAgdmFyIG0gPSBWLmxlbmd0aCAtIDEsIG4gPSBXLmxlbmd0aCAtIDE7XG4gICAgdmFyIGJ0ID0gbmV3IEJpVGFuZ2VudHMoKTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8PSBtOyArK2kpIHtcbiAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPD0gbjsgKytqKSB7XG4gICAgICAgICAgICB2YXIgdjEgPSBWW2kgPT0gMCA/IG0gOiBpIC0gMV07XG4gICAgICAgICAgICB2YXIgdjIgPSBWW2ldO1xuICAgICAgICAgICAgdmFyIHYzID0gVltpID09IG0gPyAwIDogaSArIDFdO1xuICAgICAgICAgICAgdmFyIHcxID0gV1tqID09IDAgPyBuIDogaiAtIDFdO1xuICAgICAgICAgICAgdmFyIHcyID0gV1tqXTtcbiAgICAgICAgICAgIHZhciB3MyA9IFdbaiA9PSBuID8gMCA6IGogKyAxXTtcbiAgICAgICAgICAgIHZhciB2MXYydzIgPSBpc0xlZnQodjEsIHYyLCB3Mik7XG4gICAgICAgICAgICB2YXIgdjJ3MXcyID0gaXNMZWZ0KHYyLCB3MSwgdzIpO1xuICAgICAgICAgICAgdmFyIHYydzJ3MyA9IGlzTGVmdCh2MiwgdzIsIHczKTtcbiAgICAgICAgICAgIHZhciB3MXcydjIgPSBpc0xlZnQodzEsIHcyLCB2Mik7XG4gICAgICAgICAgICB2YXIgdzJ2MXYyID0gaXNMZWZ0KHcyLCB2MSwgdjIpO1xuICAgICAgICAgICAgdmFyIHcydjJ2MyA9IGlzTGVmdCh3MiwgdjIsIHYzKTtcbiAgICAgICAgICAgIGlmICh2MXYydzIgPj0gMCAmJiB2MncxdzIgPj0gMCAmJiB2MncydzMgPCAwXG4gICAgICAgICAgICAgICAgJiYgdzF3MnYyID49IDAgJiYgdzJ2MXYyID49IDAgJiYgdzJ2MnYzIDwgMCkge1xuICAgICAgICAgICAgICAgIGJ0LmxsID0gbmV3IEJpVGFuZ2VudChpLCBqKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKHYxdjJ3MiA8PSAwICYmIHYydzF3MiA8PSAwICYmIHYydzJ3MyA+IDBcbiAgICAgICAgICAgICAgICAmJiB3MXcydjIgPD0gMCAmJiB3MnYxdjIgPD0gMCAmJiB3MnYydjMgPiAwKSB7XG4gICAgICAgICAgICAgICAgYnQucnIgPSBuZXcgQmlUYW5nZW50KGksIGopO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAodjF2MncyIDw9IDAgJiYgdjJ3MXcyID4gMCAmJiB2MncydzMgPD0gMFxuICAgICAgICAgICAgICAgICYmIHcxdzJ2MiA+PSAwICYmIHcydjF2MiA8IDAgJiYgdzJ2MnYzID49IDApIHtcbiAgICAgICAgICAgICAgICBidC5ybCA9IG5ldyBCaVRhbmdlbnQoaSwgaik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmICh2MXYydzIgPj0gMCAmJiB2MncxdzIgPCAwICYmIHYydzJ3MyA+PSAwXG4gICAgICAgICAgICAgICAgJiYgdzF3MnYyIDw9IDAgJiYgdzJ2MXYyID4gMCAmJiB3MnYydjMgPD0gMCkge1xuICAgICAgICAgICAgICAgIGJ0LmxyID0gbmV3IEJpVGFuZ2VudChpLCBqKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gYnQ7XG59XG5leHBvcnRzLnRhbmdlbnRzID0gdGFuZ2VudHM7XG5mdW5jdGlvbiBpc1BvaW50SW5zaWRlUG9seShwLCBwb2x5KSB7XG4gICAgZm9yICh2YXIgaSA9IDEsIG4gPSBwb2x5Lmxlbmd0aDsgaSA8IG47ICsraSlcbiAgICAgICAgaWYgKGJlbG93KHBvbHlbaSAtIDFdLCBwb2x5W2ldLCBwKSlcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICByZXR1cm4gdHJ1ZTtcbn1cbmZ1bmN0aW9uIGlzQW55UEluUShwLCBxKSB7XG4gICAgcmV0dXJuICFwLmV2ZXJ5KGZ1bmN0aW9uICh2KSB7IHJldHVybiAhaXNQb2ludEluc2lkZVBvbHkodiwgcSk7IH0pO1xufVxuZnVuY3Rpb24gcG9seXNPdmVybGFwKHAsIHEpIHtcbiAgICBpZiAoaXNBbnlQSW5RKHAsIHEpKVxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICBpZiAoaXNBbnlQSW5RKHEsIHApKVxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICBmb3IgKHZhciBpID0gMSwgbiA9IHAubGVuZ3RoOyBpIDwgbjsgKytpKSB7XG4gICAgICAgIHZhciB2ID0gcFtpXSwgdSA9IHBbaSAtIDFdO1xuICAgICAgICBpZiAoaW50ZXJzZWN0cyhuZXcgTGluZVNlZ21lbnQodS54LCB1LnksIHYueCwgdi55KSwgcSkubGVuZ3RoID4gMClcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG59XG5leHBvcnRzLnBvbHlzT3ZlcmxhcCA9IHBvbHlzT3ZlcmxhcDtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWRhdGE6YXBwbGljYXRpb24vanNvbjtiYXNlNjQsZXlKMlpYSnphVzl1SWpvekxDSm1hV3hsSWpvaVoyVnZiUzVxY3lJc0luTnZkWEpqWlZKdmIzUWlPaUlpTENKemIzVnlZMlZ6SWpwYklpNHVMeTR1TDFkbFlrTnZiR0V2YzNKakwyZGxiMjB1ZEhNaVhTd2libUZ0WlhNaU9sdGRMQ0p0WVhCd2FXNW5jeUk2SWpzN096czdPenM3T3pzN096czdPMEZCUVVFc2VVTkJRWEZETzBGQlEycERPMGxCUVVFN1NVRkhRU3hEUVVGRE8wbEJRVVFzV1VGQlF6dEJRVUZFTEVOQlFVTXNRVUZJUkN4SlFVZERPMEZCU0Zrc2MwSkJRVXM3UVVGTGJFSTdTVUZEU1N4eFFrRkJiVUlzUlVGQlZTeEZRVUZUTEVWQlFWVXNSVUZCVXl4RlFVRlZMRVZCUVZNc1JVRkJWVHRSUVVGdVJTeFBRVUZGTEVkQlFVWXNSVUZCUlN4RFFVRlJPMUZCUVZNc1QwRkJSU3hIUVVGR0xFVkJRVVVzUTBGQlVUdFJRVUZUTEU5QlFVVXNSMEZCUml4RlFVRkZMRU5CUVZFN1VVRkJVeXhQUVVGRkxFZEJRVVlzUlVGQlJTeERRVUZSTzBsQlFVa3NRMEZCUXp0SlFVTXZSaXhyUWtGQlF6dEJRVUZFTEVOQlFVTXNRVUZHUkN4SlFVVkRPMEZCUmxrc2EwTkJRVmM3UVVGSmVFSTdTVUZCSzBJc05rSkJRVXM3U1VGQmNFTTdPMGxCUlVFc1EwRkJRenRKUVVGRUxHZENRVUZETzBGQlFVUXNRMEZCUXl4QlFVWkVMRU5CUVN0Q0xFdEJRVXNzUjBGRmJrTTdRVUZHV1N3NFFrRkJVenRCUVZWMFFpeFRRVUZuUWl4TlFVRk5MRU5CUVVNc1JVRkJVeXhGUVVGRkxFVkJRVk1zUlVGQlJTeEZRVUZUTzBsQlEyeEVMRTlCUVU4c1EwRkJReXhGUVVGRkxFTkJRVU1zUTBGQlF5eEhRVUZITEVWQlFVVXNRMEZCUXl4RFFVRkRMRU5CUVVNc1IwRkJSeXhEUVVGRExFVkJRVVVzUTBGQlF5eERRVUZETEVkQlFVY3NSVUZCUlN4RFFVRkRMRU5CUVVNc1EwRkJReXhIUVVGSExFTkJRVU1zUlVGQlJTeERRVUZETEVOQlFVTXNSMEZCUnl4RlFVRkZMRU5CUVVNc1EwRkJReXhEUVVGRExFZEJRVWNzUTBGQlF5eEZRVUZGTEVOQlFVTXNRMEZCUXl4SFFVRkhMRVZCUVVVc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dEJRVU42UlN4RFFVRkRPMEZCUmtRc2QwSkJSVU03UVVGRlJDeFRRVUZUTEV0QlFVc3NRMEZCUXl4RFFVRlJMRVZCUVVVc1JVRkJVeXhGUVVGRkxFVkJRVk03U1VGRGVrTXNUMEZCVHl4TlFVRk5MRU5CUVVNc1EwRkJReXhGUVVGRkxFVkJRVVVzUlVGQlJTeEZRVUZGTEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNN1FVRkRha01zUTBGQlF6dEJRVVZFTEZOQlFWTXNTMEZCU3l4RFFVRkRMRU5CUVZFc1JVRkJSU3hGUVVGVExFVkJRVVVzUlVGQlV6dEpRVU42UXl4UFFVRlBMRTFCUVUwc1EwRkJReXhEUVVGRExFVkJRVVVzUlVGQlJTeEZRVUZGTEVWQlFVVXNRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJRenRCUVVOcVF5eERRVUZETzBGQlUwUXNVMEZCWjBJc1ZVRkJWU3hEUVVGRExFTkJRVlU3U1VGRGFrTXNTVUZCU1N4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRExFdEJRVXNzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4SlFVRkpMRU5CUVVNc1ZVRkJReXhEUVVGRExFVkJRVVVzUTBGQlF5eEpRVUZMTEU5QlFVRXNRMEZCUXl4RFFVRkRMRU5CUVVNc1MwRkJTeXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFZEJRVWNzUTBGQlF5eERRVUZETEVOQlFVTXNSVUZCYmtNc1EwRkJiVU1zUTBGQlF5eERRVUZETzBsQlEzWkZMRWxCUVVrc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF5eE5RVUZOTEVWQlFVVXNRMEZCUXl4RFFVRkRPMGxCUTNCQ0xFbEJRVWtzVFVGQlRTeEhRVUZITEVOQlFVTXNRMEZCUXp0SlFVTm1MRWxCUVVrc1NVRkJTU3hIUVVGSExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1NVRkRiRUlzUzBGQlN5eERRVUZETEVkQlFVY3NRMEZCUXl4RlFVRkZMRU5CUVVNc1IwRkJSeXhEUVVGRExFVkJRVVVzUlVGQlJTeERRVUZETEVWQlFVVTdVVUZEY0VJc1NVRkJTU3hEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4TFFVRkxMRWxCUVVrN1dVRkJSU3hOUVVGTk8wdEJRemxDTzBsQlEwUXNTVUZCU1N4TlFVRk5MRWRCUVVjc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF6dEpRVU51UWl4SlFVRkpMRU5CUVVNc1IwRkJXU3hGUVVGRkxFTkJRVU03U1VGRGNFSXNRMEZCUXl4RFFVRkRMRWxCUVVrc1EwRkJReXhEUVVGRExFTkJRVU1zVFVGQlRTeERRVUZETEVOQlFVTXNRMEZCUXp0SlFVTnNRaXhKUVVGSkxFMUJRVTBzUzBGQlN5eERRVUZETEVkQlFVY3NRMEZCUXl4RlFVRkZPMUZCUTJ4Q0xFbEJRVWtzUTBGQlF5eERRVUZETEUxQlFVMHNRMEZCUXl4RFFVRkRMRU5CUVVNc1MwRkJTeXhEUVVGRExFTkJRVU1zVFVGQlRTeERRVUZETEVOQlFVTXNRMEZCUXp0WlFVTXpRaXhEUVVGRExFTkJRVU1zU1VGQlNTeERRVUZETEVOQlFVTXNRMEZCUXl4TlFVRk5MRU5CUVVNc1EwRkJReXhEUVVGRE8wdEJRM3BDTzFOQlFVMDdVVUZGU0N4SlFVRkpMRTFCUVUwc1JVRkJSU3hOUVVGTkxFZEJRVWNzUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXp0UlFVTXpRaXhKUVVGSkxFbEJRVWtzUjBGQlJ5eERRVUZETEVOQlFVTXNRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dFJRVU4wUWl4TFFVRkxMRU5CUVVNc1IwRkJSeXhEUVVGRExFZEJRVWNzUTBGQlF5eEZRVUZGTEVOQlFVTXNTVUZCU1N4RFFVRkRMRVZCUVVVc1EwRkJReXhGUVVGRk8xbEJRM1pDTEVsQlFVa3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUzBGQlN5eEpRVUZKTzJkQ1FVRkZMRTFCUVUwN1VVRkRMMElzVFVGQlRTeEhRVUZITEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNN1VVRkhaaXhEUVVGRExFZEJRVWNzVFVGQlRTeERRVUZETzFGQlExZ3NUMEZCVHl4RlFVRkZMRU5CUVVNc1NVRkJTU3hOUVVGTkxFVkJRVVU3V1VGRmJFSXNTVUZCU1N4TlFVRk5MRU5CUVVNc1EwRkJReXhEUVVGRExFMUJRVTBzUTBGQlF5eEZRVUZGTEVOQlFVTXNRMEZCUXl4TlFVRk5MRU5CUVVNc1JVRkJSU3hEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNTVUZCU1N4RFFVRkRMRWxCUVVrc1EwRkJReXhIUVVGSExFMUJRVTA3WjBKQlEzSkVMRk5CUVZNN1dVRkZZaXhQUVVGUExFTkJRVU1zUTBGQlF5eE5RVUZOTEVkQlFVY3NRMEZCUXl4RlFVTnVRanRuUWtGRlNTeEpRVUZKTEUxQlFVMHNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFMUJRVTBzUjBGQlJ5eERRVUZETEVOQlFVTXNSVUZCUlN4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFMUJRVTBzUjBGQlJ5eERRVUZETEVOQlFVTXNSVUZCUlN4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUjBGQlJ5eERRVUZETzI5Q1FVTnNSQ3hOUVVGTk96dHZRa0ZGVGl4RFFVRkRMRU5CUVVNc1RVRkJUU3hKUVVGSkxFTkJRVU1zUTBGQlF6dGhRVU55UWp0WlFVTkVMRWxCUVVrc1EwRkJReXhKUVVGSkxFMUJRVTA3WjBKQlFVVXNRMEZCUXl4RFFVRkRMRWxCUVVrc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0VFFVTnFRenRSUVVkRUxFbEJRVWtzVFVGQlRTeEpRVUZKTEUxQlFVMDdXVUZEYUVJc1EwRkJReXhEUVVGRExFbEJRVWtzUTBGQlF5eERRVUZETEVOQlFVTXNUVUZCVFN4RFFVRkRMRU5CUVVNc1EwRkJRenRSUVVOMFFpeEpRVUZKTEVkQlFVY3NSMEZCUnl4RFFVRkRMRU5CUVVNc1RVRkJUU3hEUVVGRE8xRkJRMjVDTEVOQlFVTXNSMEZCUnl4TlFVRk5MRU5CUVVNN1VVRkRXQ3hQUVVGUExFVkJRVVVzUTBGQlF5eEpRVUZKTEUxQlFVMHNSVUZCUlR0WlFVVnNRaXhKUVVGSkxFMUJRVTBzUTBGQlF5eERRVUZETEVOQlFVTXNUVUZCVFN4RFFVRkRMRVZCUVVVc1EwRkJReXhEUVVGRExFMUJRVTBzUTBGQlF5eEZRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhKUVVGSkxFTkJRVU1zU1VGQlNTeERRVUZETEVkQlFVY3NUVUZCVFR0blFrRkRja1FzVTBGQlV6dFpRVVZpTEU5QlFVOHNRMEZCUXl4RFFVRkRMRTFCUVUwc1IwRkJSeXhIUVVGSExFVkJRM0pDTzJkQ1FVVkpMRWxCUVVrc1RVRkJUU3hEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNUVUZCVFN4SFFVRkhMRU5CUVVNc1EwRkJReXhGUVVGRkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNUVUZCVFN4SFFVRkhMRU5CUVVNc1EwRkJReXhGUVVGRkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4SFFVRkhMRU5CUVVNN2IwSkJRMnhFTEUxQlFVMDdPMjlDUVVWT0xFTkJRVU1zUTBGQlF5eE5RVUZOTEVsQlFVa3NRMEZCUXl4RFFVRkRPMkZCUTNKQ08xbEJRMFFzU1VGQlNTeERRVUZETEVsQlFVa3NUVUZCVFR0blFrRkJSU3hEUVVGRExFTkJRVU1zU1VGQlNTeERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRE8xTkJRMnBETzB0QlEwbzdTVUZEUkN4UFFVRlBMRU5CUVVNc1EwRkJRenRCUVVOaUxFTkJRVU03UVVFNVJFUXNaME5CT0VSRE8wRkJSMFFzVTBGQlowSXNiMEpCUVc5Q0xFTkJRVU1zUTBGQlVTeEZRVUZGTEVOQlFWVXNSVUZCUlN4RFFVRnhRanRKUVVNMVJTeERRVUZETEVOQlFVTXNTMEZCU3l4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFbEJRVWtzUTBGRFdDeFZRVUZETEVOQlFVTXNSVUZCUlN4RFFVRkRMRWxCUVVzc1QwRkJRU3hKUVVGSkxFTkJRVU1zUzBGQlN5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRExFTkJRVU1zUlVGQlJTeERRVUZETEVOQlFVTXNRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUjBGQlJ5eEpRVUZKTEVOQlFVTXNTMEZCU3l4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFZEJRVWNzUTBGQlF5eERRVUZETEVOQlFVTXNSVUZCUlN4RFFVRkRMRU5CUVVNc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNSVUZCYmtVc1EwRkJiVVVzUTBGRE5VVXNRMEZCUXl4UFFVRlBMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU03UVVGRGNrSXNRMEZCUXp0QlFVcEVMRzlFUVVsRE8wRkJSVVFzVTBGQlV5eGhRVUZoTEVOQlFVTXNRMEZCV1N4RlFVRkZMRVZCUVdVN1NVRkRhRVFzU1VGQlNTeERRVUZETEVOQlFVTXNVMEZCVXl4TFFVRkxMRVZCUVVVc1EwRkJReXhOUVVGTkxFZEJRVWNzUTBGQlF6dFJRVUZGTEU5QlFVOHNSVUZCUlN4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRE8wbEJRMmhFTEU5QlFVOHNSVUZCUlN4RFFVRkRMRU5CUVVNc1EwRkJReXhUUVVGVExFZEJRVWNzUTBGQlF5eERRVUZETEVOQlFVTTdRVUZETDBJc1EwRkJRenRCUVVWRUxGTkJRVk1zWVVGQllTeERRVUZETEVOQlFWa3NSVUZCUlN4RlFVRmxPMGxCUTJoRUxFbEJRVWtzUTBGQlF5eERRVUZETEZOQlFWTXNTMEZCU3l4RFFVRkRPMUZCUVVVc1QwRkJUeXhGUVVGRkxFTkJRVU1zUlVGQlJTeERRVUZETEUxQlFVMHNSMEZCUnl4RFFVRkRMRU5CUVVNc1EwRkJRenRKUVVOb1JDeFBRVUZQTEVWQlFVVXNRMEZCUXl4RFFVRkRMRU5CUVVNc1UwRkJVeXhIUVVGSExFTkJRVU1zUTBGQlF5eERRVUZETzBGQlF5OUNMRU5CUVVNN1FVRlJSQ3hUUVVGVExHdENRVUZyUWl4RFFVRkRMRU5CUVZFc1JVRkJSU3hEUVVGVk8wbEJSelZETEVsQlFVa3NUMEZCVHl4SFFVRkhMRU5CUVVNc1EwRkJReXhMUVVGTExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTTdTVUZEZWtJc1QwRkJUeXhEUVVGRExFbEJRVWtzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJRenRKUVVWdVFpeFBRVUZQTEVWQlFVVXNTVUZCU1N4RlFVRkZMRzFDUVVGdFFpeERRVUZETEVOQlFVTXNSVUZCUlN4UFFVRlBMRU5CUVVNc1JVRkJSU3hKUVVGSkxFVkJRVVVzYlVKQlFXMUNMRU5CUVVNc1EwRkJReXhGUVVGRkxFOUJRVThzUTBGQlF5eEZRVUZGTEVOQlFVTTdRVUZETlVZc1EwRkJRenRCUVZORUxGTkJRVk1zYlVKQlFXMUNMRU5CUVVNc1EwRkJVU3hGUVVGRkxFTkJRVlU3U1VGRE4wTXNTVUZCU1N4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRExFMUJRVTBzUjBGQlJ5eERRVUZETEVOQlFVTTdTVUZIY2tJc1NVRkJTU3hEUVVGVExFVkJRVVVzUTBGQlV5eEZRVUZGTEVOQlFWTXNRMEZCUXp0SlFVTndReXhKUVVGSkxFZEJRVmtzUlVGQlJTeEhRVUZaTEVOQlFVTTdTVUZKTDBJc1NVRkJTU3hMUVVGTExFTkJRVU1zUTBGQlF5eEZRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1JVRkJSU3hEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNTVUZCU1N4RFFVRkRMRXRCUVVzc1EwRkJReXhEUVVGRExFVkJRVVVzUTBGQlF5eERRVUZETEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNc1JVRkJSU3hEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTTdVVUZEYWtRc1QwRkJUeXhEUVVGRExFTkJRVU03U1VGRllpeExRVUZMTEVOQlFVTXNSMEZCUnl4RFFVRkRMRVZCUVVVc1EwRkJReXhIUVVGSExFTkJRVU1zU1VGQlN6dFJRVU5zUWl4SlFVRkpMRU5CUVVNc1IwRkJSeXhEUVVGRExFdEJRVXNzUTBGQlF6dFpRVU5ZTEVsQlFVa3NTMEZCU3l4RFFVRkRMRU5CUVVNc1JVRkJSU3hEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVWQlFVVXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRE8yZENRVU53UWl4UFFVRlBMRU5CUVVNc1EwRkJRenM3WjBKQlJWUXNUMEZCVHl4RFFVRkRMRU5CUVVNN1VVRkZha0lzUTBGQlF5eEhRVUZITEVsQlFVa3NRMEZCUXl4TFFVRkxMRU5CUVVNc1EwRkJReXhEUVVGRExFZEJRVWNzUTBGQlF5eERRVUZETEVkQlFVY3NRMEZCUXl4RFFVRkRMRU5CUVVNN1VVRkROVUlzUjBGQlJ5eEhRVUZITEV0QlFVc3NRMEZCUXl4RFFVRkRMRVZCUVVVc1EwRkJReXhEUVVGRExFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTXNSVUZCUlN4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dFJRVU12UWl4SlFVRkpMRWRCUVVjc1NVRkJTU3hEUVVGRExFdEJRVXNzUTBGQlF5eERRVUZETEVWQlFVVXNRMEZCUXl4RFFVRkRMRU5CUVVNc1IwRkJSeXhEUVVGRExFTkJRVU1zUlVGQlJTeERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1dVRkRhRU1zVDBGQlR5eERRVUZETEVOQlFVTTdVVUZKWWl4SFFVRkhMRWRCUVVjc1MwRkJTeXhEUVVGRExFTkJRVU1zUlVGQlJTeERRVUZETEVOQlFVTXNRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJReXhGUVVGRkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRPMUZCUXk5Q0xFbEJRVWtzUjBGQlJ5eEZRVUZGTzFsQlEwd3NTVUZCU1N4SFFVRkhPMmRDUVVOSUxFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTTdhVUpCUTB3N1owSkJRMFFzU1VGQlNTeExRVUZMTEVOQlFVTXNRMEZCUXl4RlFVRkZMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUlVGQlJTeERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN2IwSkJRM0JDTEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNN08yOUNRVVZPTEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNN1lVRkRZanRUUVVOS08yRkJRMGs3V1VGRFJDeEpRVUZKTEVOQlFVTXNSMEZCUnp0blFrRkRTaXhEUVVGRExFZEJRVWNzUTBGQlF5eERRVUZETzJsQ1FVTk1PMmRDUVVORUxFbEJRVWtzUzBGQlN5eERRVUZETEVOQlFVTXNSVUZCUlN4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFVkJRVVVzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRPMjlDUVVOd1FpeERRVUZETEVkQlFVY3NRMEZCUXl4RFFVRkRPenR2UWtGRlRpeERRVUZETEVkQlFVY3NRMEZCUXl4RFFVRkRPMkZCUTJJN1UwRkRTanRMUVVOS08wRkJRMHdzUTBGQlF6dEJRVkZFTEZOQlFWTXNiVUpCUVcxQ0xFTkJRVU1zUTBGQlVTeEZRVUZGTEVOQlFWVTdTVUZETjBNc1NVRkJTU3hEUVVGRExFZEJRVWNzUTBGQlF5eERRVUZETEUxQlFVMHNSMEZCUnl4RFFVRkRMRU5CUVVNN1NVRkZja0lzU1VGQlNTeERRVUZUTEVWQlFVVXNRMEZCVXl4RlFVRkZMRU5CUVZNc1EwRkJRenRKUVVOd1F5eEpRVUZKTEVkQlFWa3NSVUZCUlN4SFFVRlpMRU5CUVVNN1NVRkpMMElzU1VGQlNTeExRVUZMTEVOQlFVTXNRMEZCUXl4RlFVRkZMRU5CUVVNc1EwRkJReXhEUVVGRExFZEJRVWNzUTBGQlF5eERRVUZETEVWQlFVVXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFbEJRVWtzUTBGQlF5eExRVUZMTEVOQlFVTXNRMEZCUXl4RlFVRkZMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUlVGQlJTeERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1VVRkRha1FzVDBGQlR5eERRVUZETEVOQlFVTTdTVUZGWWl4TFFVRkxMRU5CUVVNc1IwRkJSeXhEUVVGRExFVkJRVVVzUTBGQlF5eEhRVUZITEVOQlFVTXNTVUZCU3p0UlFVTnNRaXhKUVVGSkxFTkJRVU1zUjBGQlJ5eERRVUZETEV0QlFVc3NRMEZCUXp0WlFVTllMRWxCUVVrc1MwRkJTeXhEUVVGRExFTkJRVU1zUlVGQlJTeERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRVZCUVVVc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETzJkQ1FVTndRaXhQUVVGUExFTkJRVU1zUTBGQlF6czdaMEpCUlZRc1QwRkJUeXhEUVVGRExFTkJRVU03VVVGRmFrSXNRMEZCUXl4SFFVRkhMRWxCUVVrc1EwRkJReXhMUVVGTExFTkJRVU1zUTBGQlF5eERRVUZETEVkQlFVY3NRMEZCUXl4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRExFTkJRVU03VVVGRE5VSXNSMEZCUnl4SFFVRkhMRXRCUVVzc1EwRkJReXhEUVVGRExFVkJRVVVzUTBGQlF5eERRVUZETEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNc1JVRkJSU3hEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0UlFVTXZRaXhKUVVGSkxFdEJRVXNzUTBGQlF5eERRVUZETEVWQlFVVXNRMEZCUXl4RFFVRkRMRU5CUVVNc1IwRkJSeXhEUVVGRExFTkJRVU1zUlVGQlJTeERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1NVRkJTU3hEUVVGRExFZEJRVWM3V1VGRGFFTXNUMEZCVHl4RFFVRkRMRU5CUVVNN1VVRkpZaXhIUVVGSExFZEJRVWNzUzBGQlN5eERRVUZETEVOQlFVTXNSVUZCUlN4RFFVRkRMRU5CUVVNc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF5eEZRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRE8xRkJReTlDTEVsQlFVa3NSMEZCUnl4RlFVRkZPMWxCUTB3c1NVRkJTU3hEUVVGRExFZEJRVWM3WjBKQlEwb3NRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJRenRwUWtGRFREdG5Ra0ZEUkN4SlFVRkpMRXRCUVVzc1EwRkJReXhEUVVGRExFVkJRVVVzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RlFVRkZMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dHZRa0ZEY0VJc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF6czdiMEpCUlU0c1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF6dGhRVU5pTzFOQlEwbzdZVUZEU1R0WlFVTkVMRWxCUVVrc1IwRkJSenRuUWtGRFNDeERRVUZETEVkQlFVY3NRMEZCUXl4RFFVRkRPMmxDUVVOTU8yZENRVU5FTEVsQlFVa3NTMEZCU3l4RFFVRkRMRU5CUVVNc1JVRkJSU3hEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVWQlFVVXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRE8yOUNRVU53UWl4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRE96dHZRa0ZGVGl4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRE8yRkJRMkk3VTBGRFNqdExRVU5LTzBGQlEwd3NRMEZCUXp0QlFWTkVMRk5CUVdkQ0xHbENRVUZwUWl4RFFVRkRMRU5CUVZVc1JVRkJSU3hEUVVGVkxFVkJRVVVzUlVGQmIwTXNSVUZCUlN4RlFVRnZReXhGUVVGRkxFbEJRU3RETEVWQlFVVXNTVUZCSzBNN1NVRkRiRThzU1VGQlNTeEhRVUZYTEVWQlFVVXNSMEZCVnl4RFFVRkRPMGxCUnpkQ0xFZEJRVWNzUjBGQlJ5eEZRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhGUVVGRkxFTkJRVU1zUTBGQlF5eERRVUZETzBsQlEyeENMRWRCUVVjc1IwRkJSeXhGUVVGRkxFTkJRVU1zUTBGQlF5eERRVUZETEVkQlFVY3NRMEZCUXl4RlFVRkZMRU5CUVVNc1EwRkJReXhEUVVGRE8wbEJSM0JDTEVsQlFVa3NTVUZCU1N4SFFVRkhMRXRCUVVzc1EwRkJRenRKUVVOcVFpeFBRVUZQTEVOQlFVTXNTVUZCU1N4RlFVRkZPMUZCUTFZc1NVRkJTU3hIUVVGSExFbEJRVWtzUTBGQlF6dFJRVU5hTEU5QlFVOHNTVUZCU1N4RlFVRkZPMWxCUTFRc1NVRkJTU3hIUVVGSExFdEJRVXNzUTBGQlF5eERRVUZETEUxQlFVMHNSMEZCUnl4RFFVRkRPMmRDUVVGRkxFZEJRVWNzUjBGQlJ5eERRVUZETEVOQlFVTTdXVUZEYkVNc1NVRkJTU3hKUVVGSkxFTkJRVU1zUTBGQlF5eERRVUZETEVkQlFVY3NRMEZCUXl4RlFVRkZMRU5CUVVNc1EwRkJReXhIUVVGSExFTkJRVU1zUlVGQlJTeERRVUZETEVOQlFVTXNSMEZCUnl4SFFVRkhMRU5CUVVNc1EwRkJReXhEUVVGRE8yZENRVUZGTEUxQlFVMDdXVUZETlVNc1JVRkJSU3hIUVVGSExFTkJRVU03VTBGRFZEdFJRVU5FTEU5QlFVOHNTVUZCU1N4RlFVRkZPMWxCUTFRc1NVRkJTU3hIUVVGSExFdEJRVXNzUTBGQlF6dG5Ra0ZCUlN4SFFVRkhMRWRCUVVjc1EwRkJReXhEUVVGRExFMUJRVTBzUjBGQlJ5eERRVUZETEVOQlFVTTdXVUZEYkVNc1NVRkJTU3hKUVVGSkxFTkJRVU1zUTBGQlF5eERRVUZETEVkQlFVY3NRMEZCUXl4RlFVRkZMRU5CUVVNc1EwRkJReXhIUVVGSExFTkJRVU1zUlVGQlJTeERRVUZETEVOQlFVTXNSMEZCUnl4SFFVRkhMRU5CUVVNc1EwRkJReXhEUVVGRE8yZENRVUZGTEUxQlFVMDdXVUZETlVNc1JVRkJSU3hIUVVGSExFTkJRVU03V1VGRFRpeEpRVUZKTEVkQlFVY3NTMEZCU3l4RFFVRkRPMU5CUTJoQ08wdEJRMG83U1VGRFJDeFBRVUZQTEVWQlFVVXNSVUZCUlN4RlFVRkZMRWRCUVVjc1JVRkJSU3hGUVVGRkxFVkJRVVVzUjBGQlJ5eEZRVUZGTEVOQlFVTTdRVUZEYUVNc1EwRkJRenRCUVhoQ1JDdzRRMEYzUWtNN1FVRkZSQ3hUUVVGblFpeHRRa0ZCYlVJc1EwRkJReXhEUVVGVkxFVkJRVVVzUTBGQlZUdEpRVU4wUkN4SlFVRkpMRVZCUVVVc1IwRkJSeXh0UWtGQmJVSXNRMEZCUXl4RFFVRkRMRVZCUVVVc1EwRkJReXhEUVVGRExFTkJRVU03U1VGRGJrTXNUMEZCVHl4RlFVRkZMRVZCUVVVc1JVRkJSU3hGUVVGRkxFTkJRVU1zUlVGQlJTeEZRVUZGTEVWQlFVVXNSVUZCUlN4RlFVRkZMRU5CUVVNc1JVRkJSU3hGUVVGRkxFTkJRVU03UVVGRGNFTXNRMEZCUXp0QlFVaEVMR3RFUVVkRE8wRkJSVVFzVTBGQlowSXNiVUpCUVcxQ0xFTkJRVU1zUTBGQlZTeEZRVUZGTEVOQlFWVTdTVUZEZEVRc1QwRkJUeXhwUWtGQmFVSXNRMEZCUXl4RFFVRkRMRVZCUVVVc1EwRkJReXhGUVVGRkxHMUNRVUZ0UWl4RlFVRkZMRzFDUVVGdFFpeEZRVUZGTEV0QlFVc3NSVUZCUlN4TFFVRkxMRU5CUVVNc1EwRkJRenRCUVVNelJpeERRVUZETzBGQlJrUXNhMFJCUlVNN1FVRkZSQ3hUUVVGblFpeHRRa0ZCYlVJc1EwRkJReXhEUVVGVkxFVkJRVVVzUTBGQlZUdEpRVU4wUkN4UFFVRlBMR2xDUVVGcFFpeERRVUZETEVOQlFVTXNSVUZCUlN4RFFVRkRMRVZCUVVVc2JVSkJRVzFDTEVWQlFVVXNiVUpCUVcxQ0xFVkJRVVVzUzBGQlN5eEZRVUZGTEV0QlFVc3NRMEZCUXl4RFFVRkRPMEZCUXpOR0xFTkJRVU03UVVGR1JDeHJSRUZGUXp0QlFVVkVMRk5CUVdkQ0xHMUNRVUZ0UWl4RFFVRkRMRU5CUVZVc1JVRkJSU3hEUVVGVk8wbEJRM1JFTEU5QlFVOHNhVUpCUVdsQ0xFTkJRVU1zUTBGQlF5eEZRVUZGTEVOQlFVTXNSVUZCUlN4dFFrRkJiVUlzUlVGQlJTeHRRa0ZCYlVJc1JVRkJSU3hMUVVGTExFVkJRVVVzUzBGQlN5eERRVUZETEVOQlFVTTdRVUZETTBZc1EwRkJRenRCUVVaRUxHdEVRVVZETzBGQlJVUTdTVUZEU1N4dFFrRkJiVUlzUlVGQlZTeEZRVUZUTEVWQlFWVTdVVUZCTjBJc1QwRkJSU3hIUVVGR0xFVkJRVVVzUTBGQlVUdFJRVUZUTEU5QlFVVXNSMEZCUml4RlFVRkZMRU5CUVZFN1NVRkJTU3hEUVVGRE8wbEJRM3BFTEdkQ1FVRkRPMEZCUVVRc1EwRkJReXhCUVVaRUxFbEJSVU03UVVGR1dTdzRRa0ZCVXp0QlFVbDBRanRKUVVGQk8wbEJTMEVzUTBGQlF6dEpRVUZFTEdsQ1FVRkRPMEZCUVVRc1EwRkJReXhCUVV4RUxFbEJTME03UVVGTVdTeG5RMEZCVlR0QlFVOTJRanRKUVVFNFFpdzBRa0ZCU3p0SlFVRnVRenM3U1VGRlFTeERRVUZETzBsQlFVUXNaVUZCUXp0QlFVRkVMRU5CUVVNc1FVRkdSQ3hEUVVFNFFpeExRVUZMTEVkQlJXeERPMEZCUmxrc05FSkJRVkU3UVVGSmNrSTdTVUZEU1N3d1FrRkRWeXhGUVVGVkxFVkJRMVlzVFVGQll5eEZRVU5rTEZWQlFXdENMRVZCUTJ4Q0xFTkJRVmM3VVVGSVdDeFBRVUZGTEVkQlFVWXNSVUZCUlN4RFFVRlJPMUZCUTFZc1YwRkJUU3hIUVVGT0xFMUJRVTBzUTBGQlVUdFJRVU5rTEdWQlFWVXNSMEZCVml4VlFVRlZMRU5CUVZFN1VVRkRiRUlzVFVGQlF5eEhRVUZFTEVOQlFVTXNRMEZCVlR0UlFVVnNRaXhEUVVGRExFTkJRVU1zUlVGQlJTeEhRVUZITEVsQlFVa3NRMEZCUXp0SlFVTm9RaXhEUVVGRE8wbEJRMHdzZFVKQlFVTTdRVUZCUkN4RFFVRkRMRUZCVkVRc1NVRlRRenRCUVZSWkxEUkRRVUZuUWp0QlFWYzNRanRKUVVOSkxIZENRVU5YTEUxQlFYZENMRVZCUTNoQ0xFMUJRWGRDTzFGQlJIaENMRmRCUVUwc1IwRkJUaXhOUVVGTkxFTkJRV3RDTzFGQlEzaENMRmRCUVUwc1IwRkJUaXhOUVVGTkxFTkJRV3RDTzBsQlFVa3NRMEZCUXp0SlFVTjRReXdyUWtGQlRTeEhRVUZPTzFGQlEwa3NTVUZCU1N4RlFVRkZMRWRCUVVjc1NVRkJTU3hEUVVGRExFMUJRVTBzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4SFFVRkhMRWxCUVVrc1EwRkJReXhOUVVGTkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0UlFVTXpReXhKUVVGSkxFVkJRVVVzUjBGQlJ5eEpRVUZKTEVOQlFVTXNUVUZCVFN4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFZEJRVWNzU1VGQlNTeERRVUZETEUxQlFVMHNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRE8xRkJRek5ETEU5QlFVOHNTVUZCU1N4RFFVRkRMRWxCUVVrc1EwRkJReXhGUVVGRkxFZEJRVWNzUlVGQlJTeEhRVUZITEVWQlFVVXNSMEZCUnl4RlFVRkZMRU5CUVVNc1EwRkJRenRKUVVONFF5eERRVUZETzBsQlEwd3NjVUpCUVVNN1FVRkJSQ3hEUVVGRExFRkJWRVFzU1VGVFF6dEJRVlJaTEhkRFFVRmpPMEZCVnpOQ08wbEJSMGtzWjBOQlFXMUNMRU5CUVdVc1JVRkJSU3hGUVVGdFJEdFJRVUZ3UlN4TlFVRkRMRWRCUVVRc1EwRkJReXhEUVVGak8xRkJSbXhETEUxQlFVTXNSMEZCZFVJc1JVRkJSU3hEUVVGRE8xRkJRek5DTEUxQlFVTXNSMEZCY1VJc1JVRkJSU3hEUVVGRE8xRkJSWEpDTEVsQlFVa3NRMEZCUXl4RlFVRkZMRVZCUVVVN1dVRkRUQ3hKUVVGSkxFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTXNUVUZCVFN4RFFVRkRPMWxCUldwQ0xFdEJRVXNzU1VGQlNTeERRVUZETEVkQlFVY3NRMEZCUXl4RlFVRkZMRU5CUVVNc1IwRkJSeXhEUVVGRExFVkJRVVVzUTBGQlF5eEZRVUZGTEVWQlFVVTdaMEpCUTNoQ0xFbEJRVWtzUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJRenRuUWtGRllpeExRVUZMTEVsQlFVa3NRMEZCUXl4SFFVRkhMRU5CUVVNc1JVRkJSU3hEUVVGRExFZEJRVWNzUTBGQlF5eERRVUZETEUxQlFVMHNSVUZCUlN4RlFVRkZMRU5CUVVNc1JVRkJSVHR2UWtGREwwSXNTVUZCU1N4RlFVRkZMRWRCUVVjc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eEZRVU5VTEVWQlFVVXNSMEZCUnl4SlFVRkpMR2RDUVVGblFpeERRVUZETEVsQlFVa3NRMEZCUXl4RFFVRkRMRU5CUVVNc1RVRkJUU3hGUVVGRkxFTkJRVU1zUlVGQlJTeERRVUZETEVWQlFVVXNSVUZCUlN4RFFVRkRMRU5CUVVNN2IwSkJRM1pFTEVsQlFVa3NRMEZCUXl4RFFVRkRMRU5CUVVNc1NVRkJTU3hEUVVGRExFVkJRVVVzUTBGQlF5eERRVUZETzI5Q1FVbG9RaXhKUVVGSkxFTkJRVU1zUjBGQlJ5eERRVUZETzNkQ1FVRkZMRWxCUVVrc1EwRkJReXhEUVVGRExFTkJRVU1zU1VGQlNTeERRVUZETEVsQlFVa3NZMEZCWXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFZEJRVWNzUTBGQlF5eERRVUZETEVOQlFVTXNSVUZCUlN4RlFVRkZMRVZCUVVVc1EwRkJReXhEUVVGRExFTkJRVU03YVVKQlF5OUVPMmRDUVVWRUxFbEJRVWtzUTBGQlF5eERRVUZETEUxQlFVMHNSMEZCUnl4RFFVRkRPMjlDUVVGRkxFbEJRVWtzUTBGQlF5eERRVUZETEVOQlFVTXNTVUZCU1N4RFFVRkRMRWxCUVVrc1kwRkJZeXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RlFVRkZMRVZCUVVVc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eE5RVUZOTEVkQlFVY3NRMEZCUXl4RFFVRkRMRU5CUVVNc1JVRkJSU3hEUVVGRExFTkJRVU1zUTBGQlF6dGhRVU5zUmp0WlFVTkVMRXRCUVVzc1NVRkJTU3hEUVVGRExFZEJRVWNzUTBGQlF5eEZRVUZGTEVOQlFVTXNSMEZCUnl4RFFVRkRMRWRCUVVjc1EwRkJReXhGUVVGRkxFTkJRVU1zUlVGQlJTeEZRVUZGTzJkQ1FVTTFRaXhKUVVGSkxFVkJRVVVzUjBGQlJ5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1owSkJRMlFzUzBGQlN5eEpRVUZKTEVOQlFVTXNSMEZCUnl4RFFVRkRMRWRCUVVjc1EwRkJReXhGUVVGRkxFTkJRVU1zUjBGQlJ5eERRVUZETEVWQlFVVXNRMEZCUXl4RlFVRkZMRVZCUVVVN2IwSkJRelZDTEVsQlFVa3NSVUZCUlN4SFFVRkhMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUlVGRFZDeERRVUZETEVkQlFVY3NVVUZCVVN4RFFVRkRMRVZCUVVVc1JVRkJSU3hGUVVGRkxFTkJRVU1zUTBGQlF6dHZRa0ZEZWtJc1MwRkJTeXhKUVVGSkxFTkJRVU1zU1VGQlNTeERRVUZETEVWQlFVVTdkMEpCUTJJc1NVRkJTU3hEUVVGRExFZEJRVWNzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RlFVTlNMRTFCUVUwc1IwRkJSeXhGUVVGRkxFTkJRVU1zUTBGQlF5eERRVUZETEVWQlFVVXNRMEZCUXl4RlFVRkZMRTFCUVUwc1IwRkJSeXhGUVVGRkxFTkJRVU1zUTBGQlF5eERRVUZETEVWQlFVVXNRMEZCUXl4RFFVRkRPM2RDUVVONlF5eEpRVUZKTEVOQlFVTXNaMEpCUVdkQ0xFTkJRVU1zVFVGQlRTeEZRVUZGTEUxQlFVMHNSVUZCUlN4RFFVRkRMRVZCUVVVc1EwRkJReXhEUVVGRExFTkJRVU03Y1VKQlF5OURPMmxDUVVOS08yRkJRMG83VTBGRFNqdGhRVUZOTzFsQlEwZ3NTVUZCU1N4RFFVRkRMRU5CUVVNc1IwRkJSeXhGUVVGRkxFTkJRVU1zUTBGQlF5eERRVUZETEV0QlFVc3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJRenRaUVVOMlFpeEpRVUZKTEVOQlFVTXNRMEZCUXl4SFFVRkhMRVZCUVVVc1EwRkJReXhEUVVGRExFTkJRVU1zUzBGQlN5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRPMU5CUXpGQ08wbEJRMHdzUTBGQlF6dEpRVU5FTEdsRVFVRm5RaXhIUVVGb1FpeFZRVUZwUWl4RFFVRlhMRVZCUVVVc1EwRkJWeXhGUVVGRkxFVkJRVlVzUlVGQlJTeEZRVUZWTzFGQlF6ZEVMRWxCUVVrc1EwRkJReXhKUVVGSkxFTkJRVU1zWlVGQlpTeERRVUZETEVsQlFVa3NWMEZCVnl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFVkJRVVVzUTBGQlF5eERRVUZETEVOQlFVTXNSVUZCUlN4RFFVRkRMRU5CUVVNc1EwRkJReXhGUVVGRkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNSVUZCUlN4RlFVRkZMRVZCUVVVc1JVRkJSU3hEUVVGRExFVkJRVVU3V1VGRGNFVXNTVUZCU1N4RFFVRkRMRU5CUVVNc1EwRkJReXhKUVVGSkxFTkJRVU1zU1VGQlNTeGpRVUZqTEVOQlFVTXNRMEZCUXl4RFFVRkRMRVZCUVVVc1JVRkJSU3hEUVVGRExFTkJRVU1zUlVGQlJTeERRVUZETEVOQlFVTXNRMEZCUXp0VFFVTXZRenRKUVVOTUxFTkJRVU03U1VGRFJDeDVRMEZCVVN4SFFVRlNMRlZCUVZNc1EwRkJWeXhGUVVGRkxFVkJRVlU3VVVGRE5VSXNTVUZCU1N4RFFVRkRMRWRCUVVjc1NVRkJTU3hEUVVGRExFTkJRVU1zUTBGQlF5eE5RVUZOTEVOQlFVTTdVVUZEZEVJc1NVRkJTU3hEUVVGRExFTkJRVU1zUTBGQlF5eEpRVUZKTEVOQlFVTXNTVUZCU1N4blFrRkJaMElzUTBGQlF5eEpRVUZKTEVOQlFVTXNRMEZCUXl4RFFVRkRMRTFCUVUwc1JVRkJSU3hEUVVGRExFVkJRVVVzUTBGQlF5eEZRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1VVRkRNVVFzUzBGQlN5eEpRVUZKTEVOQlFVTXNSMEZCUnl4RFFVRkRMRVZCUVVVc1EwRkJReXhIUVVGSExFTkJRVU1zUlVGQlJTeEZRVUZGTEVOQlFVTXNSVUZCUlR0WlFVTjRRaXhKUVVGSkxFTkJRVU1zUzBGQlN5eEZRVUZGTzJkQ1FVRkZMRk5CUVZNN1dVRkRka0lzU1VGQlNTeEpRVUZKTEVkQlFVY3NTVUZCU1N4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUlVGRGFFSXNRMEZCUXl4SFFVRkhMR3RDUVVGclFpeERRVUZETEVOQlFVTXNSVUZCUlN4SlFVRkpMRU5CUVVNc1EwRkJRenRaUVVOd1F5eEpRVUZKTEVOQlFVTXNaMEpCUVdkQ0xFTkJRVU1zUTBGQlF5eEZRVUZGTEVsQlFVa3NRMEZCUXl4RFFVRkRMRU5CUVVNc1NVRkJTU3hEUVVGRExFVkJRVVVzUlVGQlJTeEZRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRPMWxCUXpsRExFbEJRVWtzUTBGQlF5eG5Ra0ZCWjBJc1EwRkJReXhEUVVGRExFVkJRVVVzU1VGQlNTeERRVUZETEVOQlFVTXNRMEZCUXl4SlFVRkpMRU5CUVVNc1JVRkJSU3hGUVVGRkxFVkJRVVVzUTBGQlF5eERRVUZETEVOQlFVTTdVMEZEYWtRN1VVRkRSQ3hQUVVGUExFTkJRVU1zUTBGQlF5eEZRVUZGTEVOQlFVTTdTVUZEYUVJc1EwRkJRenRKUVVOUExHZEVRVUZsTEVkQlFYWkNMRlZCUVhkQ0xFTkJRV01zUlVGQlJTeEZRVUZWTEVWQlFVVXNSVUZCVlR0UlFVTXhSQ3hMUVVGTExFbEJRVWtzUTBGQlF5eEhRVUZITEVOQlFVTXNSVUZCUlN4RFFVRkRMRWRCUVVjc1NVRkJTU3hEUVVGRExFTkJRVU1zUTBGQlF5eE5RVUZOTEVWQlFVVXNRMEZCUXl4SFFVRkhMRU5CUVVNc1JVRkJSU3hGUVVGRkxFTkJRVU1zUlVGQlJUdFpRVU16UXl4SlFVRkpMRU5CUVVNc1NVRkJTU3hGUVVGRkxFbEJRVWtzUTBGQlF5eEpRVUZKTEVWQlFVVXNTVUZCU1N4VlFVRlZMRU5CUVVNc1EwRkJReXhGUVVGRkxFbEJRVWtzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhOUVVGTkxFZEJRVWNzUTBGQlF5eEZRVUZGTzJkQ1FVTXpSQ3hQUVVGUExFbEJRVWtzUTBGQlF6dGhRVU5tTzFOQlEwbzdVVUZEUkN4UFFVRlBMRXRCUVVzc1EwRkJRenRKUVVOcVFpeERRVUZETzBsQlEwd3NOa0pCUVVNN1FVRkJSQ3hEUVVGRExFRkJhRVZFTEVsQlowVkRPMEZCYUVWWkxIZEVRVUZ6UWp0QlFXdEZia01zVTBGQlV5eFZRVUZWTEVOQlFVTXNRMEZCWXl4RlFVRkZMRU5CUVZVN1NVRkRNVU1zU1VGQlNTeEpRVUZKTEVkQlFVY3NSVUZCUlN4RFFVRkRPMGxCUTJRc1MwRkJTeXhKUVVGSkxFTkJRVU1zUjBGQlJ5eERRVUZETEVWQlFVVXNRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJReXhOUVVGTkxFVkJRVVVzUTBGQlF5eEhRVUZITEVOQlFVTXNSVUZCUlN4RlFVRkZMRU5CUVVNc1JVRkJSVHRSUVVOMFF5eEpRVUZKTEVkQlFVY3NSMEZCUnl4eFFrRkJVeXhEUVVGRExHZENRVUZuUWl4RFFVTm9ReXhEUVVGRExFTkJRVU1zUlVGQlJTeEZRVUZGTEVOQlFVTXNRMEZCUXl4RlFVRkZMRVZCUTFZc1EwRkJReXhEUVVGRExFVkJRVVVzUlVGQlJTeERRVUZETEVOQlFVTXNSVUZCUlN4RlFVTldMRU5CUVVNc1EwRkJReXhEUVVGRExFZEJRVWNzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RlFVRkZMRU5CUVVNc1EwRkJReXhEUVVGRExFZEJRVWNzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RlFVTjBRaXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RlFVRkZMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlEySXNRMEZCUXp0UlFVTk9MRWxCUVVrc1IwRkJSenRaUVVGRkxFbEJRVWtzUTBGQlF5eEpRVUZKTEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNN1MwRkRNMEk3U1VGRFJDeFBRVUZQTEVsQlFVa3NRMEZCUXp0QlFVTm9RaXhEUVVGRE8wRkJSVVFzVTBGQlowSXNVVUZCVVN4RFFVRkRMRU5CUVZVc1JVRkJSU3hEUVVGVk8wbEJSVE5ETEVsQlFVa3NRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJReXhOUVVGTkxFZEJRVWNzUTBGQlF5eEZRVUZGTEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNc1RVRkJUU3hIUVVGSExFTkJRVU1zUTBGQlF6dEpRVU4yUXl4SlFVRkpMRVZCUVVVc1IwRkJSeXhKUVVGSkxGVkJRVlVzUlVGQlJTeERRVUZETzBsQlF6RkNMRXRCUVVzc1NVRkJTU3hEUVVGRExFZEJRVWNzUTBGQlF5eEZRVUZGTEVOQlFVTXNTVUZCU1N4RFFVRkRMRVZCUVVVc1JVRkJSU3hEUVVGRExFVkJRVVU3VVVGRGVrSXNTMEZCU3l4SlFVRkpMRU5CUVVNc1IwRkJSeXhEUVVGRExFVkJRVVVzUTBGQlF5eEpRVUZKTEVOQlFVTXNSVUZCUlN4RlFVRkZMRU5CUVVNc1JVRkJSVHRaUVVONlFpeEpRVUZKTEVWQlFVVXNSMEZCUnl4RFFVRkRMRU5CUVVNc1EwRkJReXhKUVVGSkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFZEJRVWNzUTBGQlF5eERRVUZETEVOQlFVTTdXVUZETDBJc1NVRkJTU3hGUVVGRkxFZEJRVWNzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRPMWxCUTJRc1NVRkJTU3hGUVVGRkxFZEJRVWNzUTBGQlF5eERRVUZETEVOQlFVTXNTVUZCU1N4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJReXhEUVVGRE8xbEJReTlDTEVsQlFVa3NSVUZCUlN4SFFVRkhMRU5CUVVNc1EwRkJReXhEUVVGRExFbEJRVWtzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTXNRMEZCUXp0WlFVTXZRaXhKUVVGSkxFVkJRVVVzUjBGQlJ5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1dVRkRaQ3hKUVVGSkxFVkJRVVVzUjBGQlJ5eERRVUZETEVOQlFVTXNRMEZCUXl4SlFVRkpMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRExFTkJRVU03V1VGREwwSXNTVUZCU1N4TlFVRk5MRWRCUVVjc1RVRkJUU3hEUVVGRExFVkJRVVVzUlVGQlJTeEZRVUZGTEVWQlFVVXNSVUZCUlN4RFFVRkRMRU5CUVVNN1dVRkRhRU1zU1VGQlNTeE5RVUZOTEVkQlFVY3NUVUZCVFN4RFFVRkRMRVZCUVVVc1JVRkJSU3hGUVVGRkxFVkJRVVVzUlVGQlJTeERRVUZETEVOQlFVTTdXVUZEYUVNc1NVRkJTU3hOUVVGTkxFZEJRVWNzVFVGQlRTeERRVUZETEVWQlFVVXNSVUZCUlN4RlFVRkZMRVZCUVVVc1JVRkJSU3hEUVVGRExFTkJRVU03V1VGRGFFTXNTVUZCU1N4TlFVRk5MRWRCUVVjc1RVRkJUU3hEUVVGRExFVkJRVVVzUlVGQlJTeEZRVUZGTEVWQlFVVXNSVUZCUlN4RFFVRkRMRU5CUVVNN1dVRkRhRU1zU1VGQlNTeE5RVUZOTEVkQlFVY3NUVUZCVFN4RFFVRkRMRVZCUVVVc1JVRkJSU3hGUVVGRkxFVkJRVVVzUlVGQlJTeERRVUZETEVOQlFVTTdXVUZEYUVNc1NVRkJTU3hOUVVGTkxFZEJRVWNzVFVGQlRTeERRVUZETEVWQlFVVXNSVUZCUlN4RlFVRkZMRVZCUVVVc1JVRkJSU3hEUVVGRExFTkJRVU03V1VGRGFFTXNTVUZCU1N4TlFVRk5MRWxCUVVrc1EwRkJReXhKUVVGSkxFMUJRVTBzU1VGQlNTeERRVUZETEVsQlFVa3NUVUZCVFN4SFFVRkhMRU5CUVVNN2JVSkJRM0pETEUxQlFVMHNTVUZCU1N4RFFVRkRMRWxCUVVrc1RVRkJUU3hKUVVGSkxFTkJRVU1zU1VGQlNTeE5RVUZOTEVkQlFVY3NRMEZCUXl4RlFVRkZPMmRDUVVONlF5eEZRVUZGTEVOQlFVTXNSVUZCUlN4SFFVRkhMRWxCUVVrc1UwRkJVeXhEUVVGRExFTkJRVU1zUlVGQlJTeERRVUZETEVOQlFVTXNRMEZCUXp0aFFVTnVRenRwUWtGQlRTeEpRVUZKTEUxQlFVMHNTVUZCU1N4RFFVRkRMRWxCUVVrc1RVRkJUU3hKUVVGSkxFTkJRVU1zU1VGQlNTeE5RVUZOTEVkQlFVY3NRMEZCUXp0dFFrRkROVU1zVFVGQlRTeEpRVUZKTEVOQlFVTXNTVUZCU1N4TlFVRk5MRWxCUVVrc1EwRkJReXhKUVVGSkxFMUJRVTBzUjBGQlJ5eERRVUZETEVWQlFVVTdaMEpCUTNwRExFVkJRVVVzUTBGQlF5eEZRVUZGTEVkQlFVY3NTVUZCU1N4VFFVRlRMRU5CUVVNc1EwRkJReXhGUVVGRkxFTkJRVU1zUTBGQlF5eERRVUZETzJGQlEyNURPMmxDUVVGTkxFbEJRVWtzVFVGQlRTeEpRVUZKTEVOQlFVTXNTVUZCU1N4TlFVRk5MRWRCUVVjc1EwRkJReXhKUVVGSkxFMUJRVTBzU1VGQlNTeERRVUZETzIxQ1FVTTFReXhOUVVGTkxFbEJRVWtzUTBGQlF5eEpRVUZKTEUxQlFVMHNSMEZCUnl4RFFVRkRMRWxCUVVrc1RVRkJUU3hKUVVGSkxFTkJRVU1zUlVGQlJUdG5Ra0ZEZWtNc1JVRkJSU3hEUVVGRExFVkJRVVVzUjBGQlJ5eEpRVUZKTEZOQlFWTXNRMEZCUXl4RFFVRkRMRVZCUVVVc1EwRkJReXhEUVVGRExFTkJRVU03WVVGRGJrTTdhVUpCUVUwc1NVRkJTU3hOUVVGTkxFbEJRVWtzUTBGQlF5eEpRVUZKTEUxQlFVMHNSMEZCUnl4RFFVRkRMRWxCUVVrc1RVRkJUU3hKUVVGSkxFTkJRVU03YlVKQlF6VkRMRTFCUVUwc1NVRkJTU3hEUVVGRExFbEJRVWtzVFVGQlRTeEhRVUZITEVOQlFVTXNTVUZCU1N4TlFVRk5MRWxCUVVrc1EwRkJReXhGUVVGRk8yZENRVU42UXl4RlFVRkZMRU5CUVVNc1JVRkJSU3hIUVVGSExFbEJRVWtzVTBGQlV5eERRVUZETEVOQlFVTXNSVUZCUlN4RFFVRkRMRU5CUVVNc1EwRkJRenRoUVVOdVF6dFRRVU5LTzB0QlEwbzdTVUZEUkN4UFFVRlBMRVZCUVVVc1EwRkJRenRCUVVOa0xFTkJRVU03UVVGc1EwUXNORUpCYTBORE8wRkJSVVFzVTBGQlV5eHBRa0ZCYVVJc1EwRkJReXhEUVVGUkxFVkJRVVVzU1VGQllUdEpRVU01UXl4TFFVRkxMRWxCUVVrc1EwRkJReXhIUVVGSExFTkJRVU1zUlVGQlJTeERRVUZETEVkQlFVY3NTVUZCU1N4RFFVRkRMRTFCUVUwc1JVRkJSU3hEUVVGRExFZEJRVWNzUTBGQlF5eEZRVUZGTEVWQlFVVXNRMEZCUXp0UlFVTjJReXhKUVVGSkxFdEJRVXNzUTBGQlF5eEpRVUZKTEVOQlFVTXNRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJReXhGUVVGRkxFbEJRVWtzUTBGQlF5eERRVUZETEVOQlFVTXNSVUZCUlN4RFFVRkRMRU5CUVVNN1dVRkJSU3hQUVVGUExFdEJRVXNzUTBGQlF6dEpRVU55UkN4UFFVRlBMRWxCUVVrc1EwRkJRenRCUVVOb1FpeERRVUZETzBGQlJVUXNVMEZCVXl4VFFVRlRMRU5CUVVNc1EwRkJWU3hGUVVGRkxFTkJRVlU3U1VGRGNrTXNUMEZCVHl4RFFVRkRMRU5CUVVNc1EwRkJReXhMUVVGTExFTkJRVU1zVlVGQlFTeERRVUZETEVsQlFVa3NUMEZCUVN4RFFVRkRMR2xDUVVGcFFpeERRVUZETEVOQlFVTXNSVUZCUlN4RFFVRkRMRU5CUVVNc1JVRkJlRUlzUTBGQmQwSXNRMEZCUXl4RFFVRkRPMEZCUTI1RUxFTkJRVU03UVVGRlJDeFRRVUZuUWl4WlFVRlpMRU5CUVVNc1EwRkJWU3hGUVVGRkxFTkJRVlU3U1VGREwwTXNTVUZCU1N4VFFVRlRMRU5CUVVNc1EwRkJReXhGUVVGRkxFTkJRVU1zUTBGQlF6dFJRVUZGTEU5QlFVOHNTVUZCU1N4RFFVRkRPMGxCUTJwRExFbEJRVWtzVTBGQlV5eERRVUZETEVOQlFVTXNSVUZCUlN4RFFVRkRMRU5CUVVNN1VVRkJSU3hQUVVGUExFbEJRVWtzUTBGQlF6dEpRVU5xUXl4TFFVRkxMRWxCUVVrc1EwRkJReXhIUVVGSExFTkJRVU1zUlVGQlJTeERRVUZETEVkQlFVY3NRMEZCUXl4RFFVRkRMRTFCUVUwc1JVRkJSU3hEUVVGRExFZEJRVWNzUTBGQlF5eEZRVUZGTEVWQlFVVXNRMEZCUXl4RlFVRkZPMUZCUTNSRExFbEJRVWtzUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1JVRkJSU3hEUVVGRExFZEJRVWNzUTBGQlF5eERRVUZETEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNc1EwRkJRenRSUVVNelFpeEpRVUZKTEZWQlFWVXNRMEZCUXl4SlFVRkpMRmRCUVZjc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eEZRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRMRVZCUVVVc1EwRkJReXhEUVVGRExFTkJRVU1zUlVGQlJTeERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRVZCUVVVc1EwRkJReXhEUVVGRExFTkJRVU1zVFVGQlRTeEhRVUZITEVOQlFVTTdXVUZCUlN4UFFVRlBMRWxCUVVrc1EwRkJRenRMUVVOc1JqdEpRVU5FTEU5QlFVOHNTMEZCU3l4RFFVRkRPMEZCUTJwQ0xFTkJRVU03UVVGU1JDeHZRMEZSUXlKOSIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIHJlY3RhbmdsZV8xID0gcmVxdWlyZShcIi4vcmVjdGFuZ2xlXCIpO1xudmFyIHZwc2NfMSA9IHJlcXVpcmUoXCIuL3Zwc2NcIik7XG52YXIgc2hvcnRlc3RwYXRoc18xID0gcmVxdWlyZShcIi4vc2hvcnRlc3RwYXRoc1wiKTtcbnZhciBOb2RlV3JhcHBlciA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gTm9kZVdyYXBwZXIoaWQsIHJlY3QsIGNoaWxkcmVuKSB7XG4gICAgICAgIHRoaXMuaWQgPSBpZDtcbiAgICAgICAgdGhpcy5yZWN0ID0gcmVjdDtcbiAgICAgICAgdGhpcy5jaGlsZHJlbiA9IGNoaWxkcmVuO1xuICAgICAgICB0aGlzLmxlYWYgPSB0eXBlb2YgY2hpbGRyZW4gPT09ICd1bmRlZmluZWQnIHx8IGNoaWxkcmVuLmxlbmd0aCA9PT0gMDtcbiAgICB9XG4gICAgcmV0dXJuIE5vZGVXcmFwcGVyO1xufSgpKTtcbmV4cG9ydHMuTm9kZVdyYXBwZXIgPSBOb2RlV3JhcHBlcjtcbnZhciBWZXJ0ID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBWZXJ0KGlkLCB4LCB5LCBub2RlLCBsaW5lKSB7XG4gICAgICAgIGlmIChub2RlID09PSB2b2lkIDApIHsgbm9kZSA9IG51bGw7IH1cbiAgICAgICAgaWYgKGxpbmUgPT09IHZvaWQgMCkgeyBsaW5lID0gbnVsbDsgfVxuICAgICAgICB0aGlzLmlkID0gaWQ7XG4gICAgICAgIHRoaXMueCA9IHg7XG4gICAgICAgIHRoaXMueSA9IHk7XG4gICAgICAgIHRoaXMubm9kZSA9IG5vZGU7XG4gICAgICAgIHRoaXMubGluZSA9IGxpbmU7XG4gICAgfVxuICAgIHJldHVybiBWZXJ0O1xufSgpKTtcbmV4cG9ydHMuVmVydCA9IFZlcnQ7XG52YXIgTG9uZ2VzdENvbW1vblN1YnNlcXVlbmNlID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBMb25nZXN0Q29tbW9uU3Vic2VxdWVuY2UocywgdCkge1xuICAgICAgICB0aGlzLnMgPSBzO1xuICAgICAgICB0aGlzLnQgPSB0O1xuICAgICAgICB2YXIgbWYgPSBMb25nZXN0Q29tbW9uU3Vic2VxdWVuY2UuZmluZE1hdGNoKHMsIHQpO1xuICAgICAgICB2YXIgdHIgPSB0LnNsaWNlKDApLnJldmVyc2UoKTtcbiAgICAgICAgdmFyIG1yID0gTG9uZ2VzdENvbW1vblN1YnNlcXVlbmNlLmZpbmRNYXRjaChzLCB0cik7XG4gICAgICAgIGlmIChtZi5sZW5ndGggPj0gbXIubGVuZ3RoKSB7XG4gICAgICAgICAgICB0aGlzLmxlbmd0aCA9IG1mLmxlbmd0aDtcbiAgICAgICAgICAgIHRoaXMuc2kgPSBtZi5zaTtcbiAgICAgICAgICAgIHRoaXMudGkgPSBtZi50aTtcbiAgICAgICAgICAgIHRoaXMucmV2ZXJzZWQgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMubGVuZ3RoID0gbXIubGVuZ3RoO1xuICAgICAgICAgICAgdGhpcy5zaSA9IG1yLnNpO1xuICAgICAgICAgICAgdGhpcy50aSA9IHQubGVuZ3RoIC0gbXIudGkgLSBtci5sZW5ndGg7XG4gICAgICAgICAgICB0aGlzLnJldmVyc2VkID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBMb25nZXN0Q29tbW9uU3Vic2VxdWVuY2UuZmluZE1hdGNoID0gZnVuY3Rpb24gKHMsIHQpIHtcbiAgICAgICAgdmFyIG0gPSBzLmxlbmd0aDtcbiAgICAgICAgdmFyIG4gPSB0Lmxlbmd0aDtcbiAgICAgICAgdmFyIG1hdGNoID0geyBsZW5ndGg6IDAsIHNpOiAtMSwgdGk6IC0xIH07XG4gICAgICAgIHZhciBsID0gbmV3IEFycmF5KG0pO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG07IGkrKykge1xuICAgICAgICAgICAgbFtpXSA9IG5ldyBBcnJheShuKTtcbiAgICAgICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgbjsgaisrKVxuICAgICAgICAgICAgICAgIGlmIChzW2ldID09PSB0W2pdKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciB2ID0gbFtpXVtqXSA9IChpID09PSAwIHx8IGogPT09IDApID8gMSA6IGxbaSAtIDFdW2ogLSAxXSArIDE7XG4gICAgICAgICAgICAgICAgICAgIGlmICh2ID4gbWF0Y2gubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBtYXRjaC5sZW5ndGggPSB2O1xuICAgICAgICAgICAgICAgICAgICAgICAgbWF0Y2guc2kgPSBpIC0gdiArIDE7XG4gICAgICAgICAgICAgICAgICAgICAgICBtYXRjaC50aSA9IGogLSB2ICsgMTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICA7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgbFtpXVtqXSA9IDA7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG1hdGNoO1xuICAgIH07XG4gICAgTG9uZ2VzdENvbW1vblN1YnNlcXVlbmNlLnByb3RvdHlwZS5nZXRTZXF1ZW5jZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubGVuZ3RoID49IDAgPyB0aGlzLnMuc2xpY2UodGhpcy5zaSwgdGhpcy5zaSArIHRoaXMubGVuZ3RoKSA6IFtdO1xuICAgIH07XG4gICAgcmV0dXJuIExvbmdlc3RDb21tb25TdWJzZXF1ZW5jZTtcbn0oKSk7XG5leHBvcnRzLkxvbmdlc3RDb21tb25TdWJzZXF1ZW5jZSA9IExvbmdlc3RDb21tb25TdWJzZXF1ZW5jZTtcbnZhciBHcmlkUm91dGVyID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBHcmlkUm91dGVyKG9yaWdpbmFsbm9kZXMsIGFjY2Vzc29yLCBncm91cFBhZGRpbmcpIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgaWYgKGdyb3VwUGFkZGluZyA9PT0gdm9pZCAwKSB7IGdyb3VwUGFkZGluZyA9IDEyOyB9XG4gICAgICAgIHRoaXMub3JpZ2luYWxub2RlcyA9IG9yaWdpbmFsbm9kZXM7XG4gICAgICAgIHRoaXMuZ3JvdXBQYWRkaW5nID0gZ3JvdXBQYWRkaW5nO1xuICAgICAgICB0aGlzLmxlYXZlcyA9IG51bGw7XG4gICAgICAgIHRoaXMubm9kZXMgPSBvcmlnaW5hbG5vZGVzLm1hcChmdW5jdGlvbiAodiwgaSkgeyByZXR1cm4gbmV3IE5vZGVXcmFwcGVyKGksIGFjY2Vzc29yLmdldEJvdW5kcyh2KSwgYWNjZXNzb3IuZ2V0Q2hpbGRyZW4odikpOyB9KTtcbiAgICAgICAgdGhpcy5sZWF2ZXMgPSB0aGlzLm5vZGVzLmZpbHRlcihmdW5jdGlvbiAodikgeyByZXR1cm4gdi5sZWFmOyB9KTtcbiAgICAgICAgdGhpcy5ncm91cHMgPSB0aGlzLm5vZGVzLmZpbHRlcihmdW5jdGlvbiAoZykgeyByZXR1cm4gIWcubGVhZjsgfSk7XG4gICAgICAgIHRoaXMuY29scyA9IHRoaXMuZ2V0R3JpZExpbmVzKCd4Jyk7XG4gICAgICAgIHRoaXMucm93cyA9IHRoaXMuZ2V0R3JpZExpbmVzKCd5Jyk7XG4gICAgICAgIHRoaXMuZ3JvdXBzLmZvckVhY2goZnVuY3Rpb24gKHYpIHtcbiAgICAgICAgICAgIHJldHVybiB2LmNoaWxkcmVuLmZvckVhY2goZnVuY3Rpb24gKGMpIHsgcmV0dXJuIF90aGlzLm5vZGVzW2NdLnBhcmVudCA9IHY7IH0pO1xuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5yb290ID0geyBjaGlsZHJlbjogW10gfTtcbiAgICAgICAgdGhpcy5ub2Rlcy5mb3JFYWNoKGZ1bmN0aW9uICh2KSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIHYucGFyZW50ID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgIHYucGFyZW50ID0gX3RoaXMucm9vdDtcbiAgICAgICAgICAgICAgICBfdGhpcy5yb290LmNoaWxkcmVuLnB1c2godi5pZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2LnBvcnRzID0gW107XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLmJhY2tUb0Zyb250ID0gdGhpcy5ub2Rlcy5zbGljZSgwKTtcbiAgICAgICAgdGhpcy5iYWNrVG9Gcm9udC5zb3J0KGZ1bmN0aW9uICh4LCB5KSB7IHJldHVybiBfdGhpcy5nZXREZXB0aCh4KSAtIF90aGlzLmdldERlcHRoKHkpOyB9KTtcbiAgICAgICAgdmFyIGZyb250VG9CYWNrR3JvdXBzID0gdGhpcy5iYWNrVG9Gcm9udC5zbGljZSgwKS5yZXZlcnNlKCkuZmlsdGVyKGZ1bmN0aW9uIChnKSB7IHJldHVybiAhZy5sZWFmOyB9KTtcbiAgICAgICAgZnJvbnRUb0JhY2tHcm91cHMuZm9yRWFjaChmdW5jdGlvbiAodikge1xuICAgICAgICAgICAgdmFyIHIgPSByZWN0YW5nbGVfMS5SZWN0YW5nbGUuZW1wdHkoKTtcbiAgICAgICAgICAgIHYuY2hpbGRyZW4uZm9yRWFjaChmdW5jdGlvbiAoYykgeyByZXR1cm4gciA9IHIudW5pb24oX3RoaXMubm9kZXNbY10ucmVjdCk7IH0pO1xuICAgICAgICAgICAgdi5yZWN0ID0gci5pbmZsYXRlKF90aGlzLmdyb3VwUGFkZGluZyk7XG4gICAgICAgIH0pO1xuICAgICAgICB2YXIgY29sTWlkcyA9IHRoaXMubWlkUG9pbnRzKHRoaXMuY29scy5tYXAoZnVuY3Rpb24gKHIpIHsgcmV0dXJuIHIucG9zOyB9KSk7XG4gICAgICAgIHZhciByb3dNaWRzID0gdGhpcy5taWRQb2ludHModGhpcy5yb3dzLm1hcChmdW5jdGlvbiAocikgeyByZXR1cm4gci5wb3M7IH0pKTtcbiAgICAgICAgdmFyIHJvd3ggPSBjb2xNaWRzWzBdLCByb3dYID0gY29sTWlkc1tjb2xNaWRzLmxlbmd0aCAtIDFdO1xuICAgICAgICB2YXIgY29seSA9IHJvd01pZHNbMF0sIGNvbFkgPSByb3dNaWRzW3Jvd01pZHMubGVuZ3RoIC0gMV07XG4gICAgICAgIHZhciBobGluZXMgPSB0aGlzLnJvd3MubWFwKGZ1bmN0aW9uIChyKSB7IHJldHVybiAoeyB4MTogcm93eCwgeDI6IHJvd1gsIHkxOiByLnBvcywgeTI6IHIucG9zIH0pOyB9KVxuICAgICAgICAgICAgLmNvbmNhdChyb3dNaWRzLm1hcChmdW5jdGlvbiAobSkgeyByZXR1cm4gKHsgeDE6IHJvd3gsIHgyOiByb3dYLCB5MTogbSwgeTI6IG0gfSk7IH0pKTtcbiAgICAgICAgdmFyIHZsaW5lcyA9IHRoaXMuY29scy5tYXAoZnVuY3Rpb24gKGMpIHsgcmV0dXJuICh7IHgxOiBjLnBvcywgeDI6IGMucG9zLCB5MTogY29seSwgeTI6IGNvbFkgfSk7IH0pXG4gICAgICAgICAgICAuY29uY2F0KGNvbE1pZHMubWFwKGZ1bmN0aW9uIChtKSB7IHJldHVybiAoeyB4MTogbSwgeDI6IG0sIHkxOiBjb2x5LCB5MjogY29sWSB9KTsgfSkpO1xuICAgICAgICB2YXIgbGluZXMgPSBobGluZXMuY29uY2F0KHZsaW5lcyk7XG4gICAgICAgIGxpbmVzLmZvckVhY2goZnVuY3Rpb24gKGwpIHsgcmV0dXJuIGwudmVydHMgPSBbXTsgfSk7XG4gICAgICAgIHRoaXMudmVydHMgPSBbXTtcbiAgICAgICAgdGhpcy5lZGdlcyA9IFtdO1xuICAgICAgICBobGluZXMuZm9yRWFjaChmdW5jdGlvbiAoaCkge1xuICAgICAgICAgICAgcmV0dXJuIHZsaW5lcy5mb3JFYWNoKGZ1bmN0aW9uICh2KSB7XG4gICAgICAgICAgICAgICAgdmFyIHAgPSBuZXcgVmVydChfdGhpcy52ZXJ0cy5sZW5ndGgsIHYueDEsIGgueTEpO1xuICAgICAgICAgICAgICAgIGgudmVydHMucHVzaChwKTtcbiAgICAgICAgICAgICAgICB2LnZlcnRzLnB1c2gocCk7XG4gICAgICAgICAgICAgICAgX3RoaXMudmVydHMucHVzaChwKTtcbiAgICAgICAgICAgICAgICB2YXIgaSA9IF90aGlzLmJhY2tUb0Zyb250Lmxlbmd0aDtcbiAgICAgICAgICAgICAgICB3aGlsZSAoaS0tID4gMCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgbm9kZSA9IF90aGlzLmJhY2tUb0Zyb250W2ldLCByID0gbm9kZS5yZWN0O1xuICAgICAgICAgICAgICAgICAgICB2YXIgZHggPSBNYXRoLmFicyhwLnggLSByLmN4KCkpLCBkeSA9IE1hdGguYWJzKHAueSAtIHIuY3koKSk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChkeCA8IHIud2lkdGgoKSAvIDIgJiYgZHkgPCByLmhlaWdodCgpIC8gMikge1xuICAgICAgICAgICAgICAgICAgICAgICAgcC5ub2RlID0gbm9kZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgICBsaW5lcy5mb3JFYWNoKGZ1bmN0aW9uIChsLCBsaSkge1xuICAgICAgICAgICAgX3RoaXMubm9kZXMuZm9yRWFjaChmdW5jdGlvbiAodiwgaSkge1xuICAgICAgICAgICAgICAgIHYucmVjdC5saW5lSW50ZXJzZWN0aW9ucyhsLngxLCBsLnkxLCBsLngyLCBsLnkyKS5mb3JFYWNoKGZ1bmN0aW9uIChpbnRlcnNlY3QsIGopIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHAgPSBuZXcgVmVydChfdGhpcy52ZXJ0cy5sZW5ndGgsIGludGVyc2VjdC54LCBpbnRlcnNlY3QueSwgdiwgbCk7XG4gICAgICAgICAgICAgICAgICAgIF90aGlzLnZlcnRzLnB1c2gocCk7XG4gICAgICAgICAgICAgICAgICAgIGwudmVydHMucHVzaChwKTtcbiAgICAgICAgICAgICAgICAgICAgdi5wb3J0cy5wdXNoKHApO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB2YXIgaXNIb3JpeiA9IE1hdGguYWJzKGwueTEgLSBsLnkyKSA8IDAuMTtcbiAgICAgICAgICAgIHZhciBkZWx0YSA9IGZ1bmN0aW9uIChhLCBiKSB7IHJldHVybiBpc0hvcml6ID8gYi54IC0gYS54IDogYi55IC0gYS55OyB9O1xuICAgICAgICAgICAgbC52ZXJ0cy5zb3J0KGRlbHRhKTtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAxOyBpIDwgbC52ZXJ0cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIHZhciB1ID0gbC52ZXJ0c1tpIC0gMV0sIHYgPSBsLnZlcnRzW2ldO1xuICAgICAgICAgICAgICAgIGlmICh1Lm5vZGUgJiYgdS5ub2RlID09PSB2Lm5vZGUgJiYgdS5ub2RlLmxlYWYpXG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIF90aGlzLmVkZ2VzLnB1c2goeyBzb3VyY2U6IHUuaWQsIHRhcmdldDogdi5pZCwgbGVuZ3RoOiBNYXRoLmFicyhkZWx0YSh1LCB2KSkgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBHcmlkUm91dGVyLnByb3RvdHlwZS5hdmcgPSBmdW5jdGlvbiAoYSkgeyByZXR1cm4gYS5yZWR1Y2UoZnVuY3Rpb24gKHgsIHkpIHsgcmV0dXJuIHggKyB5OyB9KSAvIGEubGVuZ3RoOyB9O1xuICAgIEdyaWRSb3V0ZXIucHJvdG90eXBlLmdldEdyaWRMaW5lcyA9IGZ1bmN0aW9uIChheGlzKSB7XG4gICAgICAgIHZhciBjb2x1bW5zID0gW107XG4gICAgICAgIHZhciBscyA9IHRoaXMubGVhdmVzLnNsaWNlKDAsIHRoaXMubGVhdmVzLmxlbmd0aCk7XG4gICAgICAgIHdoaWxlIChscy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICB2YXIgb3ZlcmxhcHBpbmcgPSBscy5maWx0ZXIoZnVuY3Rpb24gKHYpIHsgcmV0dXJuIHYucmVjdFsnb3ZlcmxhcCcgKyBheGlzLnRvVXBwZXJDYXNlKCldKGxzWzBdLnJlY3QpOyB9KTtcbiAgICAgICAgICAgIHZhciBjb2wgPSB7XG4gICAgICAgICAgICAgICAgbm9kZXM6IG92ZXJsYXBwaW5nLFxuICAgICAgICAgICAgICAgIHBvczogdGhpcy5hdmcob3ZlcmxhcHBpbmcubWFwKGZ1bmN0aW9uICh2KSB7IHJldHVybiB2LnJlY3RbJ2MnICsgYXhpc10oKTsgfSkpXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgY29sdW1ucy5wdXNoKGNvbCk7XG4gICAgICAgICAgICBjb2wubm9kZXMuZm9yRWFjaChmdW5jdGlvbiAodikgeyByZXR1cm4gbHMuc3BsaWNlKGxzLmluZGV4T2YodiksIDEpOyB9KTtcbiAgICAgICAgfVxuICAgICAgICBjb2x1bW5zLnNvcnQoZnVuY3Rpb24gKGEsIGIpIHsgcmV0dXJuIGEucG9zIC0gYi5wb3M7IH0pO1xuICAgICAgICByZXR1cm4gY29sdW1ucztcbiAgICB9O1xuICAgIEdyaWRSb3V0ZXIucHJvdG90eXBlLmdldERlcHRoID0gZnVuY3Rpb24gKHYpIHtcbiAgICAgICAgdmFyIGRlcHRoID0gMDtcbiAgICAgICAgd2hpbGUgKHYucGFyZW50ICE9PSB0aGlzLnJvb3QpIHtcbiAgICAgICAgICAgIGRlcHRoKys7XG4gICAgICAgICAgICB2ID0gdi5wYXJlbnQ7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGRlcHRoO1xuICAgIH07XG4gICAgR3JpZFJvdXRlci5wcm90b3R5cGUubWlkUG9pbnRzID0gZnVuY3Rpb24gKGEpIHtcbiAgICAgICAgdmFyIGdhcCA9IGFbMV0gLSBhWzBdO1xuICAgICAgICB2YXIgbWlkcyA9IFthWzBdIC0gZ2FwIC8gMl07XG4gICAgICAgIGZvciAodmFyIGkgPSAxOyBpIDwgYS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgbWlkcy5wdXNoKChhW2ldICsgYVtpIC0gMV0pIC8gMik7XG4gICAgICAgIH1cbiAgICAgICAgbWlkcy5wdXNoKGFbYS5sZW5ndGggLSAxXSArIGdhcCAvIDIpO1xuICAgICAgICByZXR1cm4gbWlkcztcbiAgICB9O1xuICAgIEdyaWRSb3V0ZXIucHJvdG90eXBlLmZpbmRMaW5lYWdlID0gZnVuY3Rpb24gKHYpIHtcbiAgICAgICAgdmFyIGxpbmVhZ2UgPSBbdl07XG4gICAgICAgIGRvIHtcbiAgICAgICAgICAgIHYgPSB2LnBhcmVudDtcbiAgICAgICAgICAgIGxpbmVhZ2UucHVzaCh2KTtcbiAgICAgICAgfSB3aGlsZSAodiAhPT0gdGhpcy5yb290KTtcbiAgICAgICAgcmV0dXJuIGxpbmVhZ2UucmV2ZXJzZSgpO1xuICAgIH07XG4gICAgR3JpZFJvdXRlci5wcm90b3R5cGUuZmluZEFuY2VzdG9yUGF0aEJldHdlZW4gPSBmdW5jdGlvbiAoYSwgYikge1xuICAgICAgICB2YXIgYWEgPSB0aGlzLmZpbmRMaW5lYWdlKGEpLCBiYSA9IHRoaXMuZmluZExpbmVhZ2UoYiksIGkgPSAwO1xuICAgICAgICB3aGlsZSAoYWFbaV0gPT09IGJhW2ldKVxuICAgICAgICAgICAgaSsrO1xuICAgICAgICByZXR1cm4geyBjb21tb25BbmNlc3RvcjogYWFbaSAtIDFdLCBsaW5lYWdlczogYWEuc2xpY2UoaSkuY29uY2F0KGJhLnNsaWNlKGkpKSB9O1xuICAgIH07XG4gICAgR3JpZFJvdXRlci5wcm90b3R5cGUuc2libGluZ09ic3RhY2xlcyA9IGZ1bmN0aW9uIChhLCBiKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIHZhciBwYXRoID0gdGhpcy5maW5kQW5jZXN0b3JQYXRoQmV0d2VlbihhLCBiKTtcbiAgICAgICAgdmFyIGxpbmVhZ2VMb29rdXAgPSB7fTtcbiAgICAgICAgcGF0aC5saW5lYWdlcy5mb3JFYWNoKGZ1bmN0aW9uICh2KSB7IHJldHVybiBsaW5lYWdlTG9va3VwW3YuaWRdID0ge307IH0pO1xuICAgICAgICB2YXIgb2JzdGFjbGVzID0gcGF0aC5jb21tb25BbmNlc3Rvci5jaGlsZHJlbi5maWx0ZXIoZnVuY3Rpb24gKHYpIHsgcmV0dXJuICEodiBpbiBsaW5lYWdlTG9va3VwKTsgfSk7XG4gICAgICAgIHBhdGgubGluZWFnZXNcbiAgICAgICAgICAgIC5maWx0ZXIoZnVuY3Rpb24gKHYpIHsgcmV0dXJuIHYucGFyZW50ICE9PSBwYXRoLmNvbW1vbkFuY2VzdG9yOyB9KVxuICAgICAgICAgICAgLmZvckVhY2goZnVuY3Rpb24gKHYpIHsgcmV0dXJuIG9ic3RhY2xlcyA9IG9ic3RhY2xlcy5jb25jYXQodi5wYXJlbnQuY2hpbGRyZW4uZmlsdGVyKGZ1bmN0aW9uIChjKSB7IHJldHVybiBjICE9PSB2LmlkOyB9KSk7IH0pO1xuICAgICAgICByZXR1cm4gb2JzdGFjbGVzLm1hcChmdW5jdGlvbiAodikgeyByZXR1cm4gX3RoaXMubm9kZXNbdl07IH0pO1xuICAgIH07XG4gICAgR3JpZFJvdXRlci5nZXRTZWdtZW50U2V0cyA9IGZ1bmN0aW9uIChyb3V0ZXMsIHgsIHkpIHtcbiAgICAgICAgdmFyIHZzZWdtZW50cyA9IFtdO1xuICAgICAgICBmb3IgKHZhciBlaSA9IDA7IGVpIDwgcm91dGVzLmxlbmd0aDsgZWkrKykge1xuICAgICAgICAgICAgdmFyIHJvdXRlID0gcm91dGVzW2VpXTtcbiAgICAgICAgICAgIGZvciAodmFyIHNpID0gMDsgc2kgPCByb3V0ZS5sZW5ndGg7IHNpKyspIHtcbiAgICAgICAgICAgICAgICB2YXIgcyA9IHJvdXRlW3NpXTtcbiAgICAgICAgICAgICAgICBzLmVkZ2VpZCA9IGVpO1xuICAgICAgICAgICAgICAgIHMuaSA9IHNpO1xuICAgICAgICAgICAgICAgIHZhciBzZHggPSBzWzFdW3hdIC0gc1swXVt4XTtcbiAgICAgICAgICAgICAgICBpZiAoTWF0aC5hYnMoc2R4KSA8IDAuMSkge1xuICAgICAgICAgICAgICAgICAgICB2c2VnbWVudHMucHVzaChzKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdnNlZ21lbnRzLnNvcnQoZnVuY3Rpb24gKGEsIGIpIHsgcmV0dXJuIGFbMF1beF0gLSBiWzBdW3hdOyB9KTtcbiAgICAgICAgdmFyIHZzZWdtZW50c2V0cyA9IFtdO1xuICAgICAgICB2YXIgc2VnbWVudHNldCA9IG51bGw7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdnNlZ21lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgcyA9IHZzZWdtZW50c1tpXTtcbiAgICAgICAgICAgIGlmICghc2VnbWVudHNldCB8fCBNYXRoLmFicyhzWzBdW3hdIC0gc2VnbWVudHNldC5wb3MpID4gMC4xKSB7XG4gICAgICAgICAgICAgICAgc2VnbWVudHNldCA9IHsgcG9zOiBzWzBdW3hdLCBzZWdtZW50czogW10gfTtcbiAgICAgICAgICAgICAgICB2c2VnbWVudHNldHMucHVzaChzZWdtZW50c2V0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHNlZ21lbnRzZXQuc2VnbWVudHMucHVzaChzKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdnNlZ21lbnRzZXRzO1xuICAgIH07XG4gICAgR3JpZFJvdXRlci5udWRnZVNlZ3MgPSBmdW5jdGlvbiAoeCwgeSwgcm91dGVzLCBzZWdtZW50cywgbGVmdE9mLCBnYXApIHtcbiAgICAgICAgdmFyIG4gPSBzZWdtZW50cy5sZW5ndGg7XG4gICAgICAgIGlmIChuIDw9IDEpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIHZhciB2cyA9IHNlZ21lbnRzLm1hcChmdW5jdGlvbiAocykgeyByZXR1cm4gbmV3IHZwc2NfMS5WYXJpYWJsZShzWzBdW3hdKTsgfSk7XG4gICAgICAgIHZhciBjcyA9IFtdO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG47IGkrKykge1xuICAgICAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBuOyBqKyspIHtcbiAgICAgICAgICAgICAgICBpZiAoaSA9PT0gailcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgdmFyIHMxID0gc2VnbWVudHNbaV0sIHMyID0gc2VnbWVudHNbal0sIGUxID0gczEuZWRnZWlkLCBlMiA9IHMyLmVkZ2VpZCwgbGluZCA9IC0xLCByaW5kID0gLTE7XG4gICAgICAgICAgICAgICAgaWYgKHggPT0gJ3gnKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChsZWZ0T2YoZTEsIGUyKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHMxWzBdW3ldIDwgczFbMV1beV0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsaW5kID0gaiwgcmluZCA9IGk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsaW5kID0gaSwgcmluZCA9IGo7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChsZWZ0T2YoZTEsIGUyKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHMxWzBdW3ldIDwgczFbMV1beV0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsaW5kID0gaSwgcmluZCA9IGo7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsaW5kID0gaiwgcmluZCA9IGk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGxpbmQgPj0gMCkge1xuICAgICAgICAgICAgICAgICAgICBjcy5wdXNoKG5ldyB2cHNjXzEuQ29uc3RyYWludCh2c1tsaW5kXSwgdnNbcmluZF0sIGdhcCkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB2YXIgc29sdmVyID0gbmV3IHZwc2NfMS5Tb2x2ZXIodnMsIGNzKTtcbiAgICAgICAgc29sdmVyLnNvbHZlKCk7XG4gICAgICAgIHZzLmZvckVhY2goZnVuY3Rpb24gKHYsIGkpIHtcbiAgICAgICAgICAgIHZhciBzID0gc2VnbWVudHNbaV07XG4gICAgICAgICAgICB2YXIgcG9zID0gdi5wb3NpdGlvbigpO1xuICAgICAgICAgICAgc1swXVt4XSA9IHNbMV1beF0gPSBwb3M7XG4gICAgICAgICAgICB2YXIgcm91dGUgPSByb3V0ZXNbcy5lZGdlaWRdO1xuICAgICAgICAgICAgaWYgKHMuaSA+IDApXG4gICAgICAgICAgICAgICAgcm91dGVbcy5pIC0gMV1bMV1beF0gPSBwb3M7XG4gICAgICAgICAgICBpZiAocy5pIDwgcm91dGUubGVuZ3RoIC0gMSlcbiAgICAgICAgICAgICAgICByb3V0ZVtzLmkgKyAxXVswXVt4XSA9IHBvcztcbiAgICAgICAgfSk7XG4gICAgfTtcbiAgICBHcmlkUm91dGVyLm51ZGdlU2VnbWVudHMgPSBmdW5jdGlvbiAocm91dGVzLCB4LCB5LCBsZWZ0T2YsIGdhcCkge1xuICAgICAgICB2YXIgdnNlZ21lbnRzZXRzID0gR3JpZFJvdXRlci5nZXRTZWdtZW50U2V0cyhyb3V0ZXMsIHgsIHkpO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHZzZWdtZW50c2V0cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyIHNzID0gdnNlZ21lbnRzZXRzW2ldO1xuICAgICAgICAgICAgdmFyIGV2ZW50cyA9IFtdO1xuICAgICAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBzcy5zZWdtZW50cy5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgICAgIHZhciBzID0gc3Muc2VnbWVudHNbal07XG4gICAgICAgICAgICAgICAgZXZlbnRzLnB1c2goeyB0eXBlOiAwLCBzOiBzLCBwb3M6IE1hdGgubWluKHNbMF1beV0sIHNbMV1beV0pIH0pO1xuICAgICAgICAgICAgICAgIGV2ZW50cy5wdXNoKHsgdHlwZTogMSwgczogcywgcG9zOiBNYXRoLm1heChzWzBdW3ldLCBzWzFdW3ldKSB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGV2ZW50cy5zb3J0KGZ1bmN0aW9uIChhLCBiKSB7IHJldHVybiBhLnBvcyAtIGIucG9zICsgYS50eXBlIC0gYi50eXBlOyB9KTtcbiAgICAgICAgICAgIHZhciBvcGVuID0gW107XG4gICAgICAgICAgICB2YXIgb3BlbkNvdW50ID0gMDtcbiAgICAgICAgICAgIGV2ZW50cy5mb3JFYWNoKGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICAgICAgaWYgKGUudHlwZSA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICBvcGVuLnB1c2goZS5zKTtcbiAgICAgICAgICAgICAgICAgICAgb3BlbkNvdW50Kys7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBvcGVuQ291bnQtLTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKG9wZW5Db3VudCA9PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIEdyaWRSb3V0ZXIubnVkZ2VTZWdzKHgsIHksIHJvdXRlcywgb3BlbiwgbGVmdE9mLCBnYXApO1xuICAgICAgICAgICAgICAgICAgICBvcGVuID0gW107XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIEdyaWRSb3V0ZXIucHJvdG90eXBlLnJvdXRlRWRnZXMgPSBmdW5jdGlvbiAoZWRnZXMsIG51ZGdlR2FwLCBzb3VyY2UsIHRhcmdldCkge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICB2YXIgcm91dGVQYXRocyA9IGVkZ2VzLm1hcChmdW5jdGlvbiAoZSkgeyByZXR1cm4gX3RoaXMucm91dGUoc291cmNlKGUpLCB0YXJnZXQoZSkpOyB9KTtcbiAgICAgICAgdmFyIG9yZGVyID0gR3JpZFJvdXRlci5vcmRlckVkZ2VzKHJvdXRlUGF0aHMpO1xuICAgICAgICB2YXIgcm91dGVzID0gcm91dGVQYXRocy5tYXAoZnVuY3Rpb24gKGUpIHsgcmV0dXJuIEdyaWRSb3V0ZXIubWFrZVNlZ21lbnRzKGUpOyB9KTtcbiAgICAgICAgR3JpZFJvdXRlci5udWRnZVNlZ21lbnRzKHJvdXRlcywgJ3gnLCAneScsIG9yZGVyLCBudWRnZUdhcCk7XG4gICAgICAgIEdyaWRSb3V0ZXIubnVkZ2VTZWdtZW50cyhyb3V0ZXMsICd5JywgJ3gnLCBvcmRlciwgbnVkZ2VHYXApO1xuICAgICAgICBHcmlkUm91dGVyLnVucmV2ZXJzZUVkZ2VzKHJvdXRlcywgcm91dGVQYXRocyk7XG4gICAgICAgIHJldHVybiByb3V0ZXM7XG4gICAgfTtcbiAgICBHcmlkUm91dGVyLnVucmV2ZXJzZUVkZ2VzID0gZnVuY3Rpb24gKHJvdXRlcywgcm91dGVQYXRocykge1xuICAgICAgICByb3V0ZXMuZm9yRWFjaChmdW5jdGlvbiAoc2VnbWVudHMsIGkpIHtcbiAgICAgICAgICAgIHZhciBwYXRoID0gcm91dGVQYXRoc1tpXTtcbiAgICAgICAgICAgIGlmIChwYXRoLnJldmVyc2VkKSB7XG4gICAgICAgICAgICAgICAgc2VnbWVudHMucmV2ZXJzZSgpO1xuICAgICAgICAgICAgICAgIHNlZ21lbnRzLmZvckVhY2goZnVuY3Rpb24gKHNlZ21lbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgc2VnbWVudC5yZXZlcnNlKCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH07XG4gICAgR3JpZFJvdXRlci5hbmdsZUJldHdlZW4yTGluZXMgPSBmdW5jdGlvbiAobGluZTEsIGxpbmUyKSB7XG4gICAgICAgIHZhciBhbmdsZTEgPSBNYXRoLmF0YW4yKGxpbmUxWzBdLnkgLSBsaW5lMVsxXS55LCBsaW5lMVswXS54IC0gbGluZTFbMV0ueCk7XG4gICAgICAgIHZhciBhbmdsZTIgPSBNYXRoLmF0YW4yKGxpbmUyWzBdLnkgLSBsaW5lMlsxXS55LCBsaW5lMlswXS54IC0gbGluZTJbMV0ueCk7XG4gICAgICAgIHZhciBkaWZmID0gYW5nbGUxIC0gYW5nbGUyO1xuICAgICAgICBpZiAoZGlmZiA+IE1hdGguUEkgfHwgZGlmZiA8IC1NYXRoLlBJKSB7XG4gICAgICAgICAgICBkaWZmID0gYW5nbGUyIC0gYW5nbGUxO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBkaWZmO1xuICAgIH07XG4gICAgR3JpZFJvdXRlci5pc0xlZnQgPSBmdW5jdGlvbiAoYSwgYiwgYykge1xuICAgICAgICByZXR1cm4gKChiLnggLSBhLngpICogKGMueSAtIGEueSkgLSAoYi55IC0gYS55KSAqIChjLnggLSBhLngpKSA8PSAwO1xuICAgIH07XG4gICAgR3JpZFJvdXRlci5nZXRPcmRlciA9IGZ1bmN0aW9uIChwYWlycykge1xuICAgICAgICB2YXIgb3V0Z29pbmcgPSB7fTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBwYWlycy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyIHAgPSBwYWlyc1tpXTtcbiAgICAgICAgICAgIGlmICh0eXBlb2Ygb3V0Z29pbmdbcC5sXSA9PT0gJ3VuZGVmaW5lZCcpXG4gICAgICAgICAgICAgICAgb3V0Z29pbmdbcC5sXSA9IHt9O1xuICAgICAgICAgICAgb3V0Z29pbmdbcC5sXVtwLnJdID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKGwsIHIpIHsgcmV0dXJuIHR5cGVvZiBvdXRnb2luZ1tsXSAhPT0gJ3VuZGVmaW5lZCcgJiYgb3V0Z29pbmdbbF1bcl07IH07XG4gICAgfTtcbiAgICBHcmlkUm91dGVyLm9yZGVyRWRnZXMgPSBmdW5jdGlvbiAoZWRnZXMpIHtcbiAgICAgICAgdmFyIGVkZ2VPcmRlciA9IFtdO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGVkZ2VzLmxlbmd0aCAtIDE7IGkrKykge1xuICAgICAgICAgICAgZm9yICh2YXIgaiA9IGkgKyAxOyBqIDwgZWRnZXMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgICAgICB2YXIgZSA9IGVkZ2VzW2ldLCBmID0gZWRnZXNbal0sIGxjcyA9IG5ldyBMb25nZXN0Q29tbW9uU3Vic2VxdWVuY2UoZSwgZik7XG4gICAgICAgICAgICAgICAgdmFyIHUsIHZpLCB2ajtcbiAgICAgICAgICAgICAgICBpZiAobGNzLmxlbmd0aCA9PT0gMClcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgaWYgKGxjcy5yZXZlcnNlZCkge1xuICAgICAgICAgICAgICAgICAgICBmLnJldmVyc2UoKTtcbiAgICAgICAgICAgICAgICAgICAgZi5yZXZlcnNlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIGxjcyA9IG5ldyBMb25nZXN0Q29tbW9uU3Vic2VxdWVuY2UoZSwgZik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICgobGNzLnNpIDw9IDAgfHwgbGNzLnRpIDw9IDApICYmXG4gICAgICAgICAgICAgICAgICAgIChsY3Muc2kgKyBsY3MubGVuZ3RoID49IGUubGVuZ3RoIHx8IGxjcy50aSArIGxjcy5sZW5ndGggPj0gZi5sZW5ndGgpKSB7XG4gICAgICAgICAgICAgICAgICAgIGVkZ2VPcmRlci5wdXNoKHsgbDogaSwgcjogaiB9KTtcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChsY3Muc2kgKyBsY3MubGVuZ3RoID49IGUubGVuZ3RoIHx8IGxjcy50aSArIGxjcy5sZW5ndGggPj0gZi5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgdSA9IGVbbGNzLnNpICsgMV07XG4gICAgICAgICAgICAgICAgICAgIHZqID0gZVtsY3Muc2kgLSAxXTtcbiAgICAgICAgICAgICAgICAgICAgdmkgPSBmW2xjcy50aSAtIDFdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdSA9IGVbbGNzLnNpICsgbGNzLmxlbmd0aCAtIDJdO1xuICAgICAgICAgICAgICAgICAgICB2aSA9IGVbbGNzLnNpICsgbGNzLmxlbmd0aF07XG4gICAgICAgICAgICAgICAgICAgIHZqID0gZltsY3MudGkgKyBsY3MubGVuZ3RoXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKEdyaWRSb3V0ZXIuaXNMZWZ0KHUsIHZpLCB2aikpIHtcbiAgICAgICAgICAgICAgICAgICAgZWRnZU9yZGVyLnB1c2goeyBsOiBqLCByOiBpIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgZWRnZU9yZGVyLnB1c2goeyBsOiBpLCByOiBqIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gR3JpZFJvdXRlci5nZXRPcmRlcihlZGdlT3JkZXIpO1xuICAgIH07XG4gICAgR3JpZFJvdXRlci5tYWtlU2VnbWVudHMgPSBmdW5jdGlvbiAocGF0aCkge1xuICAgICAgICBmdW5jdGlvbiBjb3B5UG9pbnQocCkge1xuICAgICAgICAgICAgcmV0dXJuIHsgeDogcC54LCB5OiBwLnkgfTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgaXNTdHJhaWdodCA9IGZ1bmN0aW9uIChhLCBiLCBjKSB7IHJldHVybiBNYXRoLmFicygoYi54IC0gYS54KSAqIChjLnkgLSBhLnkpIC0gKGIueSAtIGEueSkgKiAoYy54IC0gYS54KSkgPCAwLjAwMTsgfTtcbiAgICAgICAgdmFyIHNlZ21lbnRzID0gW107XG4gICAgICAgIHZhciBhID0gY29weVBvaW50KHBhdGhbMF0pO1xuICAgICAgICBmb3IgKHZhciBpID0gMTsgaSA8IHBhdGgubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBiID0gY29weVBvaW50KHBhdGhbaV0pLCBjID0gaSA8IHBhdGgubGVuZ3RoIC0gMSA/IHBhdGhbaSArIDFdIDogbnVsbDtcbiAgICAgICAgICAgIGlmICghYyB8fCAhaXNTdHJhaWdodChhLCBiLCBjKSkge1xuICAgICAgICAgICAgICAgIHNlZ21lbnRzLnB1c2goW2EsIGJdKTtcbiAgICAgICAgICAgICAgICBhID0gYjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gc2VnbWVudHM7XG4gICAgfTtcbiAgICBHcmlkUm91dGVyLnByb3RvdHlwZS5yb3V0ZSA9IGZ1bmN0aW9uIChzLCB0KSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIHZhciBzb3VyY2UgPSB0aGlzLm5vZGVzW3NdLCB0YXJnZXQgPSB0aGlzLm5vZGVzW3RdO1xuICAgICAgICB0aGlzLm9ic3RhY2xlcyA9IHRoaXMuc2libGluZ09ic3RhY2xlcyhzb3VyY2UsIHRhcmdldCk7XG4gICAgICAgIHZhciBvYnN0YWNsZUxvb2t1cCA9IHt9O1xuICAgICAgICB0aGlzLm9ic3RhY2xlcy5mb3JFYWNoKGZ1bmN0aW9uIChvKSB7IHJldHVybiBvYnN0YWNsZUxvb2t1cFtvLmlkXSA9IG87IH0pO1xuICAgICAgICB0aGlzLnBhc3NhYmxlRWRnZXMgPSB0aGlzLmVkZ2VzLmZpbHRlcihmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgdmFyIHUgPSBfdGhpcy52ZXJ0c1tlLnNvdXJjZV0sIHYgPSBfdGhpcy52ZXJ0c1tlLnRhcmdldF07XG4gICAgICAgICAgICByZXR1cm4gISh1Lm5vZGUgJiYgdS5ub2RlLmlkIGluIG9ic3RhY2xlTG9va3VwXG4gICAgICAgICAgICAgICAgfHwgdi5ub2RlICYmIHYubm9kZS5pZCBpbiBvYnN0YWNsZUxvb2t1cCk7XG4gICAgICAgIH0pO1xuICAgICAgICBmb3IgKHZhciBpID0gMTsgaSA8IHNvdXJjZS5wb3J0cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyIHUgPSBzb3VyY2UucG9ydHNbMF0uaWQ7XG4gICAgICAgICAgICB2YXIgdiA9IHNvdXJjZS5wb3J0c1tpXS5pZDtcbiAgICAgICAgICAgIHRoaXMucGFzc2FibGVFZGdlcy5wdXNoKHtcbiAgICAgICAgICAgICAgICBzb3VyY2U6IHUsXG4gICAgICAgICAgICAgICAgdGFyZ2V0OiB2LFxuICAgICAgICAgICAgICAgIGxlbmd0aDogMFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgZm9yICh2YXIgaSA9IDE7IGkgPCB0YXJnZXQucG9ydHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciB1ID0gdGFyZ2V0LnBvcnRzWzBdLmlkO1xuICAgICAgICAgICAgdmFyIHYgPSB0YXJnZXQucG9ydHNbaV0uaWQ7XG4gICAgICAgICAgICB0aGlzLnBhc3NhYmxlRWRnZXMucHVzaCh7XG4gICAgICAgICAgICAgICAgc291cmNlOiB1LFxuICAgICAgICAgICAgICAgIHRhcmdldDogdixcbiAgICAgICAgICAgICAgICBsZW5ndGg6IDBcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIHZhciBnZXRTb3VyY2UgPSBmdW5jdGlvbiAoZSkgeyByZXR1cm4gZS5zb3VyY2U7IH0sIGdldFRhcmdldCA9IGZ1bmN0aW9uIChlKSB7IHJldHVybiBlLnRhcmdldDsgfSwgZ2V0TGVuZ3RoID0gZnVuY3Rpb24gKGUpIHsgcmV0dXJuIGUubGVuZ3RoOyB9O1xuICAgICAgICB2YXIgc2hvcnRlc3RQYXRoQ2FsY3VsYXRvciA9IG5ldyBzaG9ydGVzdHBhdGhzXzEuQ2FsY3VsYXRvcih0aGlzLnZlcnRzLmxlbmd0aCwgdGhpcy5wYXNzYWJsZUVkZ2VzLCBnZXRTb3VyY2UsIGdldFRhcmdldCwgZ2V0TGVuZ3RoKTtcbiAgICAgICAgdmFyIGJlbmRQZW5hbHR5ID0gZnVuY3Rpb24gKHUsIHYsIHcpIHtcbiAgICAgICAgICAgIHZhciBhID0gX3RoaXMudmVydHNbdV0sIGIgPSBfdGhpcy52ZXJ0c1t2XSwgYyA9IF90aGlzLnZlcnRzW3ddO1xuICAgICAgICAgICAgdmFyIGR4ID0gTWF0aC5hYnMoYy54IC0gYS54KSwgZHkgPSBNYXRoLmFicyhjLnkgLSBhLnkpO1xuICAgICAgICAgICAgaWYgKGEubm9kZSA9PT0gc291cmNlICYmIGEubm9kZSA9PT0gYi5ub2RlIHx8IGIubm9kZSA9PT0gdGFyZ2V0ICYmIGIubm9kZSA9PT0gYy5ub2RlKVxuICAgICAgICAgICAgICAgIHJldHVybiAwO1xuICAgICAgICAgICAgcmV0dXJuIGR4ID4gMSAmJiBkeSA+IDEgPyAxMDAwIDogMDtcbiAgICAgICAgfTtcbiAgICAgICAgdmFyIHNob3J0ZXN0UGF0aCA9IHNob3J0ZXN0UGF0aENhbGN1bGF0b3IuUGF0aEZyb21Ob2RlVG9Ob2RlV2l0aFByZXZDb3N0KHNvdXJjZS5wb3J0c1swXS5pZCwgdGFyZ2V0LnBvcnRzWzBdLmlkLCBiZW5kUGVuYWx0eSk7XG4gICAgICAgIHZhciBwYXRoUG9pbnRzID0gc2hvcnRlc3RQYXRoLnJldmVyc2UoKS5tYXAoZnVuY3Rpb24gKHZpKSB7IHJldHVybiBfdGhpcy52ZXJ0c1t2aV07IH0pO1xuICAgICAgICBwYXRoUG9pbnRzLnB1c2godGhpcy5ub2Rlc1t0YXJnZXQuaWRdLnBvcnRzWzBdKTtcbiAgICAgICAgcmV0dXJuIHBhdGhQb2ludHMuZmlsdGVyKGZ1bmN0aW9uICh2LCBpKSB7XG4gICAgICAgICAgICByZXR1cm4gIShpIDwgcGF0aFBvaW50cy5sZW5ndGggLSAxICYmIHBhdGhQb2ludHNbaSArIDFdLm5vZGUgPT09IHNvdXJjZSAmJiB2Lm5vZGUgPT09IHNvdXJjZVxuICAgICAgICAgICAgICAgIHx8IGkgPiAwICYmIHYubm9kZSA9PT0gdGFyZ2V0ICYmIHBhdGhQb2ludHNbaSAtIDFdLm5vZGUgPT09IHRhcmdldCk7XG4gICAgICAgIH0pO1xuICAgIH07XG4gICAgR3JpZFJvdXRlci5nZXRSb3V0ZVBhdGggPSBmdW5jdGlvbiAocm91dGUsIGNvcm5lcnJhZGl1cywgYXJyb3d3aWR0aCwgYXJyb3doZWlnaHQpIHtcbiAgICAgICAgdmFyIHJlc3VsdCA9IHtcbiAgICAgICAgICAgIHJvdXRlcGF0aDogJ00gJyArIHJvdXRlWzBdWzBdLnggKyAnICcgKyByb3V0ZVswXVswXS55ICsgJyAnLFxuICAgICAgICAgICAgYXJyb3dwYXRoOiAnJ1xuICAgICAgICB9O1xuICAgICAgICBpZiAocm91dGUubGVuZ3RoID4gMSkge1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCByb3V0ZS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIHZhciBsaSA9IHJvdXRlW2ldO1xuICAgICAgICAgICAgICAgIHZhciB4ID0gbGlbMV0ueCwgeSA9IGxpWzFdLnk7XG4gICAgICAgICAgICAgICAgdmFyIGR4ID0geCAtIGxpWzBdLng7XG4gICAgICAgICAgICAgICAgdmFyIGR5ID0geSAtIGxpWzBdLnk7XG4gICAgICAgICAgICAgICAgaWYgKGkgPCByb3V0ZS5sZW5ndGggLSAxKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChNYXRoLmFicyhkeCkgPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB4IC09IGR4IC8gTWF0aC5hYnMoZHgpICogY29ybmVycmFkaXVzO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgeSAtPSBkeSAvIE1hdGguYWJzKGR5KSAqIGNvcm5lcnJhZGl1cztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXN1bHQucm91dGVwYXRoICs9ICdMICcgKyB4ICsgJyAnICsgeSArICcgJztcbiAgICAgICAgICAgICAgICAgICAgdmFyIGwgPSByb3V0ZVtpICsgMV07XG4gICAgICAgICAgICAgICAgICAgIHZhciB4MCA9IGxbMF0ueCwgeTAgPSBsWzBdLnk7XG4gICAgICAgICAgICAgICAgICAgIHZhciB4MSA9IGxbMV0ueDtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHkxID0gbFsxXS55O1xuICAgICAgICAgICAgICAgICAgICBkeCA9IHgxIC0geDA7XG4gICAgICAgICAgICAgICAgICAgIGR5ID0geTEgLSB5MDtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGFuZ2xlID0gR3JpZFJvdXRlci5hbmdsZUJldHdlZW4yTGluZXMobGksIGwpIDwgMCA/IDEgOiAwO1xuICAgICAgICAgICAgICAgICAgICB2YXIgeDIsIHkyO1xuICAgICAgICAgICAgICAgICAgICBpZiAoTWF0aC5hYnMoZHgpID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgeDIgPSB4MCArIGR4IC8gTWF0aC5hYnMoZHgpICogY29ybmVycmFkaXVzO1xuICAgICAgICAgICAgICAgICAgICAgICAgeTIgPSB5MDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHgyID0geDA7XG4gICAgICAgICAgICAgICAgICAgICAgICB5MiA9IHkwICsgZHkgLyBNYXRoLmFicyhkeSkgKiBjb3JuZXJyYWRpdXM7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgdmFyIGN4ID0gTWF0aC5hYnMoeDIgLSB4KTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGN5ID0gTWF0aC5hYnMoeTIgLSB5KTtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0LnJvdXRlcGF0aCArPSAnQSAnICsgY3ggKyAnICcgKyBjeSArICcgMCAwICcgKyBhbmdsZSArICcgJyArIHgyICsgJyAnICsgeTIgKyAnICc7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB2YXIgYXJyb3d0aXAgPSBbeCwgeV07XG4gICAgICAgICAgICAgICAgICAgIHZhciBhcnJvd2Nvcm5lcjEsIGFycm93Y29ybmVyMjtcbiAgICAgICAgICAgICAgICAgICAgaWYgKE1hdGguYWJzKGR4KSA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHggLT0gZHggLyBNYXRoLmFicyhkeCkgKiBhcnJvd2hlaWdodDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFycm93Y29ybmVyMSA9IFt4LCB5ICsgYXJyb3d3aWR0aF07XG4gICAgICAgICAgICAgICAgICAgICAgICBhcnJvd2Nvcm5lcjIgPSBbeCwgeSAtIGFycm93d2lkdGhdO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgeSAtPSBkeSAvIE1hdGguYWJzKGR5KSAqIGFycm93aGVpZ2h0O1xuICAgICAgICAgICAgICAgICAgICAgICAgYXJyb3djb3JuZXIxID0gW3ggKyBhcnJvd3dpZHRoLCB5XTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFycm93Y29ybmVyMiA9IFt4IC0gYXJyb3d3aWR0aCwgeV07XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0LnJvdXRlcGF0aCArPSAnTCAnICsgeCArICcgJyArIHkgKyAnICc7XG4gICAgICAgICAgICAgICAgICAgIGlmIChhcnJvd2hlaWdodCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdC5hcnJvd3BhdGggPSAnTSAnICsgYXJyb3d0aXBbMF0gKyAnICcgKyBhcnJvd3RpcFsxXSArICcgTCAnICsgYXJyb3djb3JuZXIxWzBdICsgJyAnICsgYXJyb3djb3JuZXIxWzFdXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKyAnIEwgJyArIGFycm93Y29ybmVyMlswXSArICcgJyArIGFycm93Y29ybmVyMlsxXTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHZhciBsaSA9IHJvdXRlWzBdO1xuICAgICAgICAgICAgdmFyIHggPSBsaVsxXS54LCB5ID0gbGlbMV0ueTtcbiAgICAgICAgICAgIHZhciBkeCA9IHggLSBsaVswXS54O1xuICAgICAgICAgICAgdmFyIGR5ID0geSAtIGxpWzBdLnk7XG4gICAgICAgICAgICB2YXIgYXJyb3d0aXAgPSBbeCwgeV07XG4gICAgICAgICAgICB2YXIgYXJyb3djb3JuZXIxLCBhcnJvd2Nvcm5lcjI7XG4gICAgICAgICAgICBpZiAoTWF0aC5hYnMoZHgpID4gMCkge1xuICAgICAgICAgICAgICAgIHggLT0gZHggLyBNYXRoLmFicyhkeCkgKiBhcnJvd2hlaWdodDtcbiAgICAgICAgICAgICAgICBhcnJvd2Nvcm5lcjEgPSBbeCwgeSArIGFycm93d2lkdGhdO1xuICAgICAgICAgICAgICAgIGFycm93Y29ybmVyMiA9IFt4LCB5IC0gYXJyb3d3aWR0aF07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB5IC09IGR5IC8gTWF0aC5hYnMoZHkpICogYXJyb3doZWlnaHQ7XG4gICAgICAgICAgICAgICAgYXJyb3djb3JuZXIxID0gW3ggKyBhcnJvd3dpZHRoLCB5XTtcbiAgICAgICAgICAgICAgICBhcnJvd2Nvcm5lcjIgPSBbeCAtIGFycm93d2lkdGgsIHldO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmVzdWx0LnJvdXRlcGF0aCArPSAnTCAnICsgeCArICcgJyArIHkgKyAnICc7XG4gICAgICAgICAgICBpZiAoYXJyb3doZWlnaHQgPiAwKSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0LmFycm93cGF0aCA9ICdNICcgKyBhcnJvd3RpcFswXSArICcgJyArIGFycm93dGlwWzFdICsgJyBMICcgKyBhcnJvd2Nvcm5lcjFbMF0gKyAnICcgKyBhcnJvd2Nvcm5lcjFbMV1cbiAgICAgICAgICAgICAgICAgICAgKyAnIEwgJyArIGFycm93Y29ybmVyMlswXSArICcgJyArIGFycm93Y29ybmVyMlsxXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH07XG4gICAgcmV0dXJuIEdyaWRSb3V0ZXI7XG59KCkpO1xuZXhwb3J0cy5HcmlkUm91dGVyID0gR3JpZFJvdXRlcjtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWRhdGE6YXBwbGljYXRpb24vanNvbjtiYXNlNjQsZXlKMlpYSnphVzl1SWpvekxDSm1hV3hsSWpvaVozSnBaSEp2ZFhSbGNpNXFjeUlzSW5OdmRYSmpaVkp2YjNRaU9pSWlMQ0p6YjNWeVkyVnpJanBiSWk0dUx5NHVMMWRsWWtOdmJHRXZjM0pqTDJkeWFXUnliM1YwWlhJdWRITWlYU3dpYm1GdFpYTWlPbHRkTENKdFlYQndhVzVuY3lJNklqczdRVUZEUVN4NVEwRkJjVU03UVVGRGNrTXNLMEpCUVcxRU8wRkJRMjVFTEdsRVFVRXdRenRCUVV0MFF6dEpRVWxKTEhGQ1FVRnRRaXhGUVVGVkxFVkJRVk1zU1VGQlpTeEZRVUZUTEZGQlFXdENPMUZCUVRkRUxFOUJRVVVzUjBGQlJpeEZRVUZGTEVOQlFWRTdVVUZCVXl4VFFVRkpMRWRCUVVvc1NVRkJTU3hEUVVGWE8xRkJRVk1zWVVGQlVTeEhRVUZTTEZGQlFWRXNRMEZCVlR0UlFVTTFSU3hKUVVGSkxFTkJRVU1zU1VGQlNTeEhRVUZITEU5QlFVOHNVVUZCVVN4TFFVRkxMRmRCUVZjc1NVRkJTU3hSUVVGUkxFTkJRVU1zVFVGQlRTeExRVUZMTEVOQlFVTXNRMEZCUXp0SlFVTjZSU3hEUVVGRE8wbEJRMHdzYTBKQlFVTTdRVUZCUkN4RFFVRkRMRUZCVUVRc1NVRlBRenRCUVZCWkxHdERRVUZYTzBGQlVYaENPMGxCUTBrc1kwRkJiVUlzUlVGQlZTeEZRVUZUTEVOQlFWRXNSVUZCVXl4RFFVRlRMRVZCUVZNc1NVRkJkMElzUlVGQlV5eEpRVUZYTzFGQlFUVkRMSEZDUVVGQkxFVkJRVUVzVjBGQmQwSTdVVUZCVXl4eFFrRkJRU3hGUVVGQkxGZEJRVmM3VVVGQmJFY3NUMEZCUlN4SFFVRkdMRVZCUVVVc1EwRkJVVHRSUVVGVExFMUJRVU1zUjBGQlJDeERRVUZETEVOQlFVODdVVUZCVXl4TlFVRkRMRWRCUVVRc1EwRkJReXhEUVVGUk8xRkJRVk1zVTBGQlNTeEhRVUZLTEVsQlFVa3NRMEZCYjBJN1VVRkJVeXhUUVVGSkxFZEJRVW9zU1VGQlNTeERRVUZQTzBsQlFVY3NRMEZCUXp0SlFVTTNTQ3hYUVVGRE8wRkJRVVFzUTBGQlF5eEJRVVpFTEVsQlJVTTdRVUZHV1N4dlFrRkJTVHRCUVVscVFqdEpRVXRKTEd0RFFVRnRRaXhEUVVGTkxFVkJRVk1zUTBGQlRUdFJRVUZ5UWl4TlFVRkRMRWRCUVVRc1EwRkJReXhEUVVGTE8xRkJRVk1zVFVGQlF5eEhRVUZFTEVOQlFVTXNRMEZCU3p0UlFVTndReXhKUVVGSkxFVkJRVVVzUjBGQlJ5eDNRa0ZCZDBJc1EwRkJReXhUUVVGVExFTkJRVU1zUTBGQlF5eEZRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRPMUZCUTJ4RUxFbEJRVWtzUlVGQlJTeEhRVUZITEVOQlFVTXNRMEZCUXl4TFFVRkxMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zVDBGQlR5eEZRVUZGTEVOQlFVTTdVVUZET1VJc1NVRkJTU3hGUVVGRkxFZEJRVWNzZDBKQlFYZENMRU5CUVVNc1UwRkJVeXhEUVVGRExFTkJRVU1zUlVGQlJTeEZRVUZGTEVOQlFVTXNRMEZCUXp0UlFVTnVSQ3hKUVVGSkxFVkJRVVVzUTBGQlF5eE5RVUZOTEVsQlFVa3NSVUZCUlN4RFFVRkRMRTFCUVUwc1JVRkJSVHRaUVVONFFpeEpRVUZKTEVOQlFVTXNUVUZCVFN4SFFVRkhMRVZCUVVVc1EwRkJReXhOUVVGTkxFTkJRVU03V1VGRGVFSXNTVUZCU1N4RFFVRkRMRVZCUVVVc1IwRkJSeXhGUVVGRkxFTkJRVU1zUlVGQlJTeERRVUZETzFsQlEyaENMRWxCUVVrc1EwRkJReXhGUVVGRkxFZEJRVWNzUlVGQlJTeERRVUZETEVWQlFVVXNRMEZCUXp0WlFVTm9RaXhKUVVGSkxFTkJRVU1zVVVGQlVTeEhRVUZITEV0QlFVc3NRMEZCUXp0VFFVTjZRanRoUVVGTk8xbEJRMGdzU1VGQlNTeERRVUZETEUxQlFVMHNSMEZCUnl4RlFVRkZMRU5CUVVNc1RVRkJUU3hEUVVGRE8xbEJRM2hDTEVsQlFVa3NRMEZCUXl4RlFVRkZMRWRCUVVjc1JVRkJSU3hEUVVGRExFVkJRVVVzUTBGQlF6dFpRVU5vUWl4SlFVRkpMRU5CUVVNc1JVRkJSU3hIUVVGSExFTkJRVU1zUTBGQlF5eE5RVUZOTEVkQlFVY3NSVUZCUlN4RFFVRkRMRVZCUVVVc1IwRkJSeXhGUVVGRkxFTkJRVU1zVFVGQlRTeERRVUZETzFsQlEzWkRMRWxCUVVrc1EwRkJReXhSUVVGUkxFZEJRVWNzU1VGQlNTeERRVUZETzFOQlEzaENPMGxCUTB3c1EwRkJRenRKUVVOakxHdERRVUZUTEVkQlFYaENMRlZCUVRSQ0xFTkJRVTBzUlVGQlJTeERRVUZOTzFGQlEzUkRMRWxCUVVrc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF5eE5RVUZOTEVOQlFVTTdVVUZEYWtJc1NVRkJTU3hEUVVGRExFZEJRVWNzUTBGQlF5eERRVUZETEUxQlFVMHNRMEZCUXp0UlFVTnFRaXhKUVVGSkxFdEJRVXNzUjBGQlJ5eEZRVUZGTEUxQlFVMHNSVUZCUlN4RFFVRkRMRVZCUVVVc1JVRkJSU3hGUVVGRkxFTkJRVU1zUTBGQlF5eEZRVUZGTEVWQlFVVXNSVUZCUlN4RFFVRkRMRU5CUVVNc1JVRkJSU3hEUVVGRE8xRkJRekZETEVsQlFVa3NRMEZCUXl4SFFVRkhMRWxCUVVrc1MwRkJTeXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETzFGQlEzSkNMRXRCUVVzc1NVRkJTU3hEUVVGRExFZEJRVWNzUTBGQlF5eEZRVUZGTEVOQlFVTXNSMEZCUnl4RFFVRkRMRVZCUVVVc1EwRkJReXhGUVVGRkxFVkJRVVU3V1VGRGVFSXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhIUVVGSExFbEJRVWtzUzBGQlN5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRPMWxCUTNCQ0xFdEJRVXNzU1VGQlNTeERRVUZETEVkQlFVY3NRMEZCUXl4RlFVRkZMRU5CUVVNc1IwRkJSeXhEUVVGRExFVkJRVVVzUTBGQlF5eEZRVUZGTzJkQ1FVTjBRaXhKUVVGSkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNTMEZCU3l4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFVkJRVVU3YjBKQlEyWXNTVUZCU1N4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJReXhMUVVGTExFTkJRVU1zU1VGQlNTeERRVUZETEV0QlFVc3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1IwRkJSeXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVkQlFVY3NRMEZCUXl4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRE8yOUNRVU5xUlN4SlFVRkpMRU5CUVVNc1IwRkJSeXhMUVVGTExFTkJRVU1zVFVGQlRTeEZRVUZGTzNkQ1FVTnNRaXhMUVVGTExFTkJRVU1zVFVGQlRTeEhRVUZITEVOQlFVTXNRMEZCUXp0M1FrRkRha0lzUzBGQlN5eERRVUZETEVWQlFVVXNSMEZCUnl4RFFVRkRMRWRCUVVjc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF6dDNRa0ZEY2tJc1MwRkJTeXhEUVVGRExFVkJRVVVzUjBGQlJ5eERRVUZETEVkQlFVY3NRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJRenR4UWtGRGVFSTdiMEpCUVVFc1EwRkJRenRwUWtGRFREczdiMEpCUVUwc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJRenRUUVVNeFFqdFJRVU5FTEU5QlFVOHNTMEZCU3l4RFFVRkRPMGxCUTJwQ0xFTkJRVU03U1VGRFJDdzRRMEZCVnl4SFFVRllPMUZCUTBrc1QwRkJUeXhKUVVGSkxFTkJRVU1zVFVGQlRTeEpRVUZKTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1NVRkJTU3hEUVVGRExFTkJRVU1zUTBGQlF5eExRVUZMTEVOQlFVTXNTVUZCU1N4RFFVRkRMRVZCUVVVc1JVRkJSU3hKUVVGSkxFTkJRVU1zUlVGQlJTeEhRVUZITEVsQlFVa3NRMEZCUXl4TlFVRk5MRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUlVGQlJTeERRVUZETzBsQlEyaEdMRU5CUVVNN1NVRkRUQ3dyUWtGQlF6dEJRVUZFTEVOQlFVTXNRVUV6UTBRc1NVRXlRME03UVVFelExa3NORVJCUVhkQ08wRkJhVVJ5UXp0SlFYTkVTU3h2UWtGQmJVSXNZVUZCY1VJc1JVRkJSU3hSUVVFMFFpeEZRVUZUTEZsQlFYbENPMUZCUVhoSExHbENRV3RJUXp0UlFXeElPRVVzTmtKQlFVRXNSVUZCUVN4cFFrRkJlVUk3VVVGQmNrWXNhMEpCUVdFc1IwRkJZaXhoUVVGaExFTkJRVkU3VVVGQmRVTXNhVUpCUVZrc1IwRkJXaXhaUVVGWkxFTkJRV0U3VVVGeVJIaEhMRmRCUVUwc1IwRkJhMElzU1VGQlNTeERRVUZETzFGQmMwUjZRaXhKUVVGSkxFTkJRVU1zUzBGQlN5eEhRVUZITEdGQlFXRXNRMEZCUXl4SFFVRkhMRU5CUVVNc1ZVRkJReXhEUVVGRExFVkJRVVVzUTBGQlF5eEpRVUZMTEU5QlFVRXNTVUZCU1N4WFFVRlhMRU5CUVVNc1EwRkJReXhGUVVGRkxGRkJRVkVzUTBGQlF5eFRRVUZUTEVOQlFVTXNRMEZCUXl4RFFVRkRMRVZCUVVVc1VVRkJVU3hEUVVGRExGZEJRVmNzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RlFVRnNSU3hEUVVGclJTeERRVUZETEVOQlFVTTdVVUZETjBjc1NVRkJTU3hEUVVGRExFMUJRVTBzUjBGQlJ5eEpRVUZKTEVOQlFVTXNTMEZCU3l4RFFVRkRMRTFCUVUwc1EwRkJReXhWUVVGQkxFTkJRVU1zU1VGQlJ5eFBRVUZCTEVOQlFVTXNRMEZCUXl4SlFVRkpMRVZCUVU0c1EwRkJUU3hEUVVGRExFTkJRVU03VVVGRE5VTXNTVUZCU1N4RFFVRkRMRTFCUVUwc1IwRkJSeXhKUVVGSkxFTkJRVU1zUzBGQlN5eERRVUZETEUxQlFVMHNRMEZCUXl4VlFVRkJMRU5CUVVNc1NVRkJSeXhQUVVGQkxFTkJRVU1zUTBGQlF5eERRVUZETEVsQlFVa3NSVUZCVUN4RFFVRlBMRU5CUVVNc1EwRkJRenRSUVVNM1F5eEpRVUZKTEVOQlFVTXNTVUZCU1N4SFFVRkhMRWxCUVVrc1EwRkJReXhaUVVGWkxFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTTdVVUZEYmtNc1NVRkJTU3hEUVVGRExFbEJRVWtzUjBGQlJ5eEpRVUZKTEVOQlFVTXNXVUZCV1N4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRE8xRkJSMjVETEVsQlFVa3NRMEZCUXl4TlFVRk5MRU5CUVVNc1QwRkJUeXhEUVVGRExGVkJRVUVzUTBGQlF6dFpRVU5xUWl4UFFVRkJMRU5CUVVNc1EwRkJReXhSUVVGUkxFTkJRVU1zVDBGQlR5eERRVUZETEZWQlFVRXNRMEZCUXl4SlFVRkhMRTlCUVVFc1MwRkJTU3hEUVVGRExFdEJRVXNzUTBGQlV5eERRVUZETEVOQlFVTXNRMEZCUXl4TlFVRk5MRWRCUVVjc1EwRkJReXhGUVVGb1F5eERRVUZuUXl4RFFVRkRPMUZCUVhoRUxFTkJRWGRFTEVOQlFVTXNRMEZCUXp0UlFVYzVSQ3hKUVVGSkxFTkJRVU1zU1VGQlNTeEhRVUZITEVWQlFVVXNVVUZCVVN4RlFVRkZMRVZCUVVVc1JVRkJSU3hEUVVGRE8xRkJRemRDTEVsQlFVa3NRMEZCUXl4TFFVRkxMRU5CUVVNc1QwRkJUeXhEUVVGRExGVkJRVUVzUTBGQlF6dFpRVU5vUWl4SlFVRkpMRTlCUVU4c1EwRkJReXhEUVVGRExFMUJRVTBzUzBGQlN5eFhRVUZYTEVWQlFVVTdaMEpCUTJwRExFTkJRVU1zUTBGQlF5eE5RVUZOTEVkQlFVY3NTMEZCU1N4RFFVRkRMRWxCUVVrc1EwRkJRenRuUWtGRGNrSXNTMEZCU1N4RFFVRkRMRWxCUVVrc1EwRkJReXhSUVVGUkxFTkJRVU1zU1VGQlNTeERRVUZETEVOQlFVTXNRMEZCUXl4RlFVRkZMRU5CUVVNc1EwRkJRenRoUVVOcVF6dFpRVTlFTEVOQlFVTXNRMEZCUXl4TFFVRkxMRWRCUVVjc1JVRkJSU3hEUVVGQk8xRkJRMmhDTEVOQlFVTXNRMEZCUXl4RFFVRkRPMUZCUjBnc1NVRkJTU3hEUVVGRExGZEJRVmNzUjBGQlJ5eEpRVUZKTEVOQlFVTXNTMEZCU3l4RFFVRkRMRXRCUVVzc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dFJRVU4yUXl4SlFVRkpMRU5CUVVNc1YwRkJWeXhEUVVGRExFbEJRVWtzUTBGQlF5eFZRVUZETEVOQlFVTXNSVUZCUlN4RFFVRkRMRWxCUVVzc1QwRkJRU3hMUVVGSkxFTkJRVU1zVVVGQlVTeERRVUZETEVOQlFVTXNRMEZCUXl4SFFVRkhMRXRCUVVrc1EwRkJReXhSUVVGUkxFTkJRVU1zUTBGQlF5eERRVUZETEVWQlFXNURMRU5CUVcxRExFTkJRVU1zUTBGQlF6dFJRVXR5UlN4SlFVRkpMR2xDUVVGcFFpeEhRVUZITEVsQlFVa3NRMEZCUXl4WFFVRlhMRU5CUVVNc1MwRkJTeXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEU5QlFVOHNSVUZCUlN4RFFVRkRMRTFCUVUwc1EwRkJReXhWUVVGQkxFTkJRVU1zU1VGQlJ5eFBRVUZCTEVOQlFVTXNRMEZCUXl4RFFVRkRMRWxCUVVrc1JVRkJVQ3hEUVVGUExFTkJRVU1zUTBGQlF6dFJRVU5vUml4cFFrRkJhVUlzUTBGQlF5eFBRVUZQTEVOQlFVTXNWVUZCUVN4RFFVRkRPMWxCUTNaQ0xFbEJRVWtzUTBGQlF5eEhRVUZITEhGQ1FVRlRMRU5CUVVNc1MwRkJTeXhGUVVGRkxFTkJRVU03V1VGRE1VSXNRMEZCUXl4RFFVRkRMRkZCUVZFc1EwRkJReXhQUVVGUExFTkJRVU1zVlVGQlFTeERRVUZETEVsQlFVY3NUMEZCUVN4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRExFdEJRVXNzUTBGQlF5eExRVUZKTEVOQlFVTXNTMEZCU3l4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFbEJRVWtzUTBGQlF5eEZRVUV2UWl4RFFVRXJRaXhEUVVGRExFTkJRVU03V1VGRGVFUXNRMEZCUXl4RFFVRkRMRWxCUVVrc1IwRkJSeXhEUVVGRExFTkJRVU1zVDBGQlR5eERRVUZETEV0QlFVa3NRMEZCUXl4WlFVRlpMRU5CUVVNc1EwRkJRenRSUVVNeFF5eERRVUZETEVOQlFVTXNRMEZCUXp0UlFVVklMRWxCUVVrc1QwRkJUeXhIUVVGSExFbEJRVWtzUTBGQlF5eFRRVUZUTEVOQlFVTXNTVUZCU1N4RFFVRkRMRWxCUVVrc1EwRkJReXhIUVVGSExFTkJRVU1zVlVGQlFTeERRVUZETEVsQlFVY3NUMEZCUVN4RFFVRkRMRU5CUVVNc1IwRkJSeXhGUVVGTUxFTkJRVXNzUTBGQlF5eERRVUZETEVOQlFVTTdVVUZEZGtRc1NVRkJTU3hQUVVGUExFZEJRVWNzU1VGQlNTeERRVUZETEZOQlFWTXNRMEZCUXl4SlFVRkpMRU5CUVVNc1NVRkJTU3hEUVVGRExFZEJRVWNzUTBGQlF5eFZRVUZCTEVOQlFVTXNTVUZCUnl4UFFVRkJMRU5CUVVNc1EwRkJReXhIUVVGSExFVkJRVXdzUTBGQlN5eERRVUZETEVOQlFVTXNRMEZCUXp0UlFVZDJSQ3hKUVVGSkxFbEJRVWtzUjBGQlJ5eFBRVUZQTEVOQlFVTXNRMEZCUXl4RFFVRkRMRVZCUVVVc1NVRkJTU3hIUVVGSExFOUJRVThzUTBGQlF5eFBRVUZQTEVOQlFVTXNUVUZCVFN4SFFVRkhMRU5CUVVNc1EwRkJReXhEUVVGRE8xRkJRekZFTEVsQlFVa3NTVUZCU1N4SFFVRkhMRTlCUVU4c1EwRkJReXhEUVVGRExFTkJRVU1zUlVGQlJTeEpRVUZKTEVkQlFVY3NUMEZCVHl4RFFVRkRMRTlCUVU4c1EwRkJReXhOUVVGTkxFZEJRVWNzUTBGQlF5eERRVUZETEVOQlFVTTdVVUZITVVRc1NVRkJTU3hOUVVGTkxFZEJRVWNzU1VGQlNTeERRVUZETEVsQlFVa3NRMEZCUXl4SFFVRkhMRU5CUVVNc1ZVRkJRU3hEUVVGRExFbEJRVWNzVDBGQlFTeERRVUZMTEVWQlFVVXNSVUZCUlN4RlFVRkZMRWxCUVVrc1JVRkJSU3hGUVVGRkxFVkJRVVVzU1VGQlNTeEZRVUZGTEVWQlFVVXNSVUZCUlN4RFFVRkRMRU5CUVVNc1IwRkJSeXhGUVVGRkxFVkJRVVVzUlVGQlJTeERRVUZETEVOQlFVTXNSMEZCUnl4RlFVRkZMRU5CUVVFc1JVRkJha1FzUTBGQmFVUXNRMEZCUXp0aFFVTTFSU3hOUVVGTkxFTkJRVU1zVDBGQlR5eERRVUZETEVkQlFVY3NRMEZCUXl4VlFVRkJMRU5CUVVNc1NVRkJSeXhQUVVGQkxFTkJRVXNzUlVGQlJTeEZRVUZGTEVWQlFVVXNTVUZCU1N4RlFVRkZMRVZCUVVVc1JVRkJSU3hKUVVGSkxFVkJRVVVzUlVGQlJTeEZRVUZGTEVOQlFVTXNSVUZCUlN4RlFVRkZMRVZCUVVVc1EwRkJReXhGUVVGRkxFTkJRVUVzUlVGQmVrTXNRMEZCZVVNc1EwRkJReXhEUVVGRExFTkJRVU03VVVGSGVFVXNTVUZCU1N4TlFVRk5MRWRCUVVjc1NVRkJTU3hEUVVGRExFbEJRVWtzUTBGQlF5eEhRVUZITEVOQlFVTXNWVUZCUVN4RFFVRkRMRWxCUVVjc1QwRkJRU3hEUVVGTExFVkJRVVVzUlVGQlJTeEZRVUZGTEVOQlFVTXNRMEZCUXl4SFFVRkhMRVZCUVVVc1JVRkJSU3hGUVVGRkxFTkJRVU1zUTBGQlF5eEhRVUZITEVWQlFVVXNSVUZCUlN4RlFVRkZMRWxCUVVrc1JVRkJSU3hGUVVGRkxFVkJRVVVzU1VGQlNTeEZRVUZGTEVOQlFVRXNSVUZCYWtRc1EwRkJhVVFzUTBGQlF6dGhRVU0xUlN4TlFVRk5MRU5CUVVNc1QwRkJUeXhEUVVGRExFZEJRVWNzUTBGQlF5eFZRVUZCTEVOQlFVTXNTVUZCUnl4UFFVRkJMRU5CUVVzc1JVRkJSU3hGUVVGRkxFVkJRVVVzUTBGQlF5eEZRVUZGTEVWQlFVVXNSVUZCUlN4RFFVRkRMRVZCUVVVc1JVRkJSU3hGUVVGRkxFbEJRVWtzUlVGQlJTeEZRVUZGTEVWQlFVVXNTVUZCU1N4RlFVRkZMRU5CUVVFc1JVRkJla01zUTBGQmVVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1VVRkhlRVVzU1VGQlNTeExRVUZMTEVkQlFVY3NUVUZCVFN4RFFVRkRMRTFCUVUwc1EwRkJReXhOUVVGTkxFTkJRVU1zUTBGQlF6dFJRVWRzUXl4TFFVRkxMRU5CUVVNc1QwRkJUeXhEUVVGRExGVkJRVUVzUTBGQlF5eEpRVUZITEU5QlFVRXNRMEZCUXl4RFFVRkRMRXRCUVVzc1IwRkJSeXhGUVVGRkxFVkJRVm9zUTBGQldTeERRVUZETEVOQlFVTTdVVUZIYUVNc1NVRkJTU3hEUVVGRExFdEJRVXNzUjBGQlJ5eEZRVUZGTEVOQlFVTTdVVUZEYUVJc1NVRkJTU3hEUVVGRExFdEJRVXNzUjBGQlJ5eEZRVUZGTEVOQlFVTTdVVUZIYUVJc1RVRkJUU3hEUVVGRExFOUJRVThzUTBGQlF5eFZRVUZCTEVOQlFVTTdXVUZEV2l4UFFVRkJMRTFCUVUwc1EwRkJReXhQUVVGUExFTkJRVU1zVlVGQlFTeERRVUZETzJkQ1FVTmFMRWxCUVVrc1EwRkJReXhIUVVGSExFbEJRVWtzU1VGQlNTeERRVUZETEV0QlFVa3NRMEZCUXl4TFFVRkxMRU5CUVVNc1RVRkJUU3hGUVVGRkxFTkJRVU1zUTBGQlF5eEZRVUZGTEVWQlFVVXNRMEZCUXl4RFFVRkRMRVZCUVVVc1EwRkJReXhEUVVGRE8yZENRVU5vUkN4RFFVRkRMRU5CUVVNc1MwRkJTeXhEUVVGRExFbEJRVWtzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0blFrRkRhRUlzUTBGQlF5eERRVUZETEV0QlFVc3NRMEZCUXl4SlFVRkpMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU03WjBKQlEyaENMRXRCUVVrc1EwRkJReXhMUVVGTExFTkJRVU1zU1VGQlNTeERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRPMmRDUVVkdVFpeEpRVUZKTEVOQlFVTXNSMEZCUnl4TFFVRkpMRU5CUVVNc1YwRkJWeXhEUVVGRExFMUJRVTBzUTBGQlF6dG5Ra0ZEYUVNc1QwRkJUeXhEUVVGRExFVkJRVVVzUjBGQlJ5eERRVUZETEVWQlFVVTdiMEpCUTFvc1NVRkJTU3hKUVVGSkxFZEJRVWNzUzBGQlNTeERRVUZETEZkQlFWY3NRMEZCUXl4RFFVRkRMRU5CUVVNc1JVRkRNVUlzUTBGQlF5eEhRVUZITEVsQlFVa3NRMEZCUXl4SlFVRkpMRU5CUVVNN2IwSkJRMnhDTEVsQlFVa3NSVUZCUlN4SFFVRkhMRWxCUVVrc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNc1JVRkJSU3hGUVVGRkxFTkJRVU1zUlVGRE0wSXNSVUZCUlN4SFFVRkhMRWxCUVVrc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNc1JVRkJSU3hGUVVGRkxFTkJRVU1zUTBGQlF6dHZRa0ZEYUVNc1NVRkJTU3hGUVVGRkxFZEJRVWNzUTBGQlF5eERRVUZETEV0QlFVc3NSVUZCUlN4SFFVRkhMRU5CUVVNc1NVRkJTU3hGUVVGRkxFZEJRVWNzUTBGQlF5eERRVUZETEUxQlFVMHNSVUZCUlN4SFFVRkhMRU5CUVVNc1JVRkJSVHQzUWtGRGNrTXNRMEZCUlN4RFFVRkRMRWxCUVVrc1IwRkJSeXhKUVVGSkxFTkJRVU03ZDBKQlEzSkNMRTFCUVUwN2NVSkJRMVE3YVVKQlEwbzdXVUZEVEN4RFFVRkRMRU5CUVVNN1VVRnNRa1lzUTBGclFrVXNRMEZEUkN4RFFVRkRPMUZCUlU0c1MwRkJTeXhEUVVGRExFOUJRVThzUTBGQlF5eFZRVUZETEVOQlFVTXNSVUZCUlN4RlFVRkZPMWxCUldoQ0xFdEJRVWtzUTBGQlF5eExRVUZMTEVOQlFVTXNUMEZCVHl4RFFVRkRMRlZCUVVNc1EwRkJReXhGUVVGRkxFTkJRVU03WjBKQlEzQkNMRU5CUVVNc1EwRkJReXhKUVVGSkxFTkJRVU1zYVVKQlFXbENMRU5CUVVNc1EwRkJReXhEUVVGRExFVkJRVVVzUlVGQlJTeERRVUZETEVOQlFVTXNSVUZCUlN4RlFVRkZMRU5CUVVNc1EwRkJReXhGUVVGRkxFVkJRVVVzUTBGQlF5eERRVUZETEVWQlFVVXNRMEZCUXl4RFFVRkRMRTlCUVU4c1EwRkJReXhWUVVGRExGTkJRVk1zUlVGQlJTeERRVUZETzI5Q1FVVnNSU3hKUVVGSkxFTkJRVU1zUjBGQlJ5eEpRVUZKTEVsQlFVa3NRMEZCUXl4TFFVRkpMRU5CUVVNc1MwRkJTeXhEUVVGRExFMUJRVTBzUlVGQlJTeFRRVUZUTEVOQlFVTXNRMEZCUXl4RlFVRkZMRk5CUVZNc1EwRkJReXhEUVVGRExFVkJRVVVzUTBGQlF5eEZRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRPMjlDUVVOd1JTeExRVUZKTEVOQlFVTXNTMEZCU3l4RFFVRkRMRWxCUVVrc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dHZRa0ZEYmtJc1EwRkJReXhEUVVGRExFdEJRVXNzUTBGQlF5eEpRVUZKTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN2IwSkJRMmhDTEVOQlFVTXNRMEZCUXl4TFFVRkxMRU5CUVVNc1NVRkJTU3hEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETzJkQ1FVTndRaXhEUVVGRExFTkJRVU1zUTBGQlF6dFpRVU5RTEVOQlFVTXNRMEZCUXl4RFFVRkRPMWxCUjBnc1NVRkJTU3hQUVVGUExFZEJRVWNzU1VGQlNTeERRVUZETEVkQlFVY3NRMEZCUXl4RFFVRkRMRU5CUVVNc1JVRkJSU3hIUVVGSExFTkJRVU1zUTBGQlF5eEZRVUZGTEVOQlFVTXNSMEZCUnl4SFFVRkhMRU5CUVVNN1dVRkRNVU1zU1VGQlNTeExRVUZMTEVkQlFVY3NWVUZCUXl4RFFVRkRMRVZCUVVVc1EwRkJReXhKUVVGTExFOUJRVUVzVDBGQlR5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFZEJRVWNzUTBGQlF5eERRVUZETEVOQlFVTXNSVUZCTDBJc1EwRkJLMElzUTBGQlF6dFpRVU4wUkN4RFFVRkRMRU5CUVVNc1MwRkJTeXhEUVVGRExFbEJRVWtzUTBGQlF5eExRVUZMTEVOQlFVTXNRMEZCUXp0WlFVTndRaXhMUVVGTExFbEJRVWtzUTBGQlF5eEhRVUZITEVOQlFVTXNSVUZCUlN4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRExFdEJRVXNzUTBGQlF5eE5RVUZOTEVWQlFVVXNRMEZCUXl4RlFVRkZMRVZCUVVVN1owSkJRM0pETEVsQlFVa3NRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJReXhMUVVGTExFTkJRVU1zUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXl4RlFVRkZMRU5CUVVNc1IwRkJSeXhEUVVGRExFTkJRVU1zUzBGQlN5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRPMmRDUVVOMlF5eEpRVUZKTEVOQlFVTXNRMEZCUXl4SlFVRkpMRWxCUVVrc1EwRkJReXhEUVVGRExFbEJRVWtzUzBGQlN5eERRVUZETEVOQlFVTXNTVUZCU1N4SlFVRkpMRU5CUVVNc1EwRkJReXhKUVVGSkxFTkJRVU1zU1VGQlNUdHZRa0ZCUlN4VFFVRlRPMmRDUVVONlJDeExRVUZKTEVOQlFVTXNTMEZCU3l4RFFVRkRMRWxCUVVrc1EwRkJReXhGUVVGRkxFMUJRVTBzUlVGQlJTeERRVUZETEVOQlFVTXNSVUZCUlN4RlFVRkZMRTFCUVUwc1JVRkJSU3hEUVVGRExFTkJRVU1zUlVGQlJTeEZRVUZGTEUxQlFVMHNSVUZCUlN4SlFVRkpMRU5CUVVNc1IwRkJSeXhEUVVGRExFdEJRVXNzUTBGQlF5eERRVUZETEVWQlFVVXNRMEZCUXl4RFFVRkRMRU5CUVVNc1JVRkJSU3hEUVVGRExFTkJRVU03WVVGRGJFWTdVVUZEVEN4RFFVRkRMRU5CUVVNc1EwRkJRenRKUVVsUUxFTkJRVU03U1VFMVNrOHNkMEpCUVVjc1IwRkJXQ3hWUVVGWkxFTkJRVU1zU1VGQlNTeFBRVUZQTEVOQlFVTXNRMEZCUXl4TlFVRk5MRU5CUVVNc1ZVRkJReXhEUVVGRExFVkJRVVVzUTBGQlF5eEpRVUZMTEU5QlFVRXNRMEZCUXl4SFFVRkhMRU5CUVVNc1JVRkJUQ3hEUVVGTExFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTXNUVUZCVFN4RFFVRkJMRU5CUVVNc1EwRkJRenRKUVVsMFJDeHBRMEZCV1N4SFFVRndRaXhWUVVGeFFpeEpRVUZKTzFGQlEzSkNMRWxCUVVrc1QwRkJUeXhIUVVGSExFVkJRVVVzUTBGQlF6dFJRVU5xUWl4SlFVRkpMRVZCUVVVc1IwRkJSeXhKUVVGSkxFTkJRVU1zVFVGQlRTeERRVUZETEV0QlFVc3NRMEZCUXl4RFFVRkRMRVZCUVVVc1NVRkJTU3hEUVVGRExFMUJRVTBzUTBGQlF5eE5RVUZOTEVOQlFVTXNRMEZCUXp0UlFVTnNSQ3hQUVVGUExFVkJRVVVzUTBGQlF5eE5RVUZOTEVkQlFVY3NRMEZCUXl4RlFVRkZPMWxCUld4Q0xFbEJRVWtzVjBGQlZ5eEhRVUZITEVWQlFVVXNRMEZCUXl4TlFVRk5MRU5CUVVNc1ZVRkJRU3hEUVVGRExFbEJRVWNzVDBGQlFTeERRVUZETEVOQlFVTXNTVUZCU1N4RFFVRkRMRk5CUVZNc1IwRkJSeXhKUVVGSkxFTkJRVU1zVjBGQlZ5eEZRVUZGTEVOQlFVTXNRMEZCUXl4RlFVRkZMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zU1VGQlNTeERRVUZETEVWQlFXeEVMRU5CUVd0RUxFTkJRVU1zUTBGQlF6dFpRVU53Uml4SlFVRkpMRWRCUVVjc1IwRkJSenRuUWtGRFRpeExRVUZMTEVWQlFVVXNWMEZCVnp0blFrRkRiRUlzUjBGQlJ5eEZRVUZGTEVsQlFVa3NRMEZCUXl4SFFVRkhMRU5CUVVNc1YwRkJWeXhEUVVGRExFZEJRVWNzUTBGQlF5eFZRVUZCTEVOQlFVTXNTVUZCUnl4UFFVRkJMRU5CUVVNc1EwRkJReXhKUVVGSkxFTkJRVU1zUjBGQlJ5eEhRVUZITEVsQlFVa3NRMEZCUXl4RlFVRkZMRVZCUVhCQ0xFTkJRVzlDTEVOQlFVTXNRMEZCUXp0aFFVTXpSQ3hEUVVGRE8xbEJRMFlzVDBGQlR5eERRVUZETEVsQlFVa3NRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJRenRaUVVOc1FpeEhRVUZITEVOQlFVTXNTMEZCU3l4RFFVRkRMRTlCUVU4c1EwRkJReXhWUVVGQkxFTkJRVU1zU1VGQlJ5eFBRVUZCTEVWQlFVVXNRMEZCUXl4TlFVRk5MRU5CUVVNc1JVRkJSU3hEUVVGRExFOUJRVThzUTBGQlF5eERRVUZETEVOQlFVTXNSVUZCUlN4RFFVRkRMRU5CUVVNc1JVRkJNMElzUTBGQk1rSXNRMEZCUXl4RFFVRkRPMU5CUTNSRU8xRkJRMFFzVDBGQlR5eERRVUZETEVsQlFVa3NRMEZCUXl4VlFVRkRMRU5CUVVNc1JVRkJSU3hEUVVGRExFbEJRVXNzVDBGQlFTeERRVUZETEVOQlFVTXNSMEZCUnl4SFFVRkhMRU5CUVVNc1EwRkJReXhIUVVGSExFVkJRV0lzUTBGQllTeERRVUZETEVOQlFVRTdVVUZEY2tNc1QwRkJUeXhQUVVGUExFTkJRVU03U1VGRGJrSXNRMEZCUXp0SlFVZFBMRFpDUVVGUkxFZEJRV2hDTEZWQlFXbENMRU5CUVVNN1VVRkRaQ3hKUVVGSkxFdEJRVXNzUjBGQlJ5eERRVUZETEVOQlFVTTdVVUZEWkN4UFFVRlBMRU5CUVVNc1EwRkJReXhOUVVGTkxFdEJRVXNzU1VGQlNTeERRVUZETEVsQlFVa3NSVUZCUlR0WlFVTXpRaXhMUVVGTExFVkJRVVVzUTBGQlF6dFpRVU5TTEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNc1RVRkJUU3hEUVVGRE8xTkJRMmhDTzFGQlEwUXNUMEZCVHl4TFFVRkxMRU5CUVVNN1NVRkRha0lzUTBGQlF6dEpRVWRQTERoQ1FVRlRMRWRCUVdwQ0xGVkJRV3RDTEVOQlFVTTdVVUZEWml4SlFVRkpMRWRCUVVjc1IwRkJSeXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVkQlFVY3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRE8xRkJRM1JDTEVsQlFVa3NTVUZCU1N4SFFVRkhMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eEhRVUZITEVkQlFVY3NSMEZCUnl4RFFVRkRMRU5CUVVNc1EwRkJRenRSUVVNMVFpeExRVUZMTEVsQlFVa3NRMEZCUXl4SFFVRkhMRU5CUVVNc1JVRkJSU3hEUVVGRExFZEJRVWNzUTBGQlF5eERRVUZETEUxQlFVMHNSVUZCUlN4RFFVRkRMRVZCUVVVc1JVRkJSVHRaUVVNdlFpeEpRVUZKTEVOQlFVTXNTVUZCU1N4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXl4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRExFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTXNRMEZCUXp0VFFVTndRenRSUVVORUxFbEJRVWtzUTBGQlF5eEpRVUZKTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhOUVVGTkxFZEJRVWNzUTBGQlF5eERRVUZETEVkQlFVY3NSMEZCUnl4SFFVRkhMRU5CUVVNc1EwRkJReXhEUVVGRE8xRkJRM0pETEU5QlFVOHNTVUZCU1N4RFFVRkRPMGxCUTJoQ0xFTkJRVU03U1VGMVNFOHNaME5CUVZjc1IwRkJia0lzVlVGQmIwSXNRMEZCUXp0UlFVTnFRaXhKUVVGSkxFOUJRVThzUjBGQlJ5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRPMUZCUTJ4Q0xFZEJRVWM3V1VGRFF5eERRVUZETEVkQlFVY3NRMEZCUXl4RFFVRkRMRTFCUVUwc1EwRkJRenRaUVVOaUxFOUJRVThzUTBGQlF5eEpRVUZKTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1UwRkRia0lzVVVGQlVTeERRVUZETEV0QlFVc3NTVUZCU1N4RFFVRkRMRWxCUVVrc1JVRkJSVHRSUVVNeFFpeFBRVUZQTEU5QlFVOHNRMEZCUXl4UFFVRlBMRVZCUVVVc1EwRkJRenRKUVVNM1FpeERRVUZETzBsQlIwOHNORU5CUVhWQ0xFZEJRUzlDTEZWQlFXZERMRU5CUVVNc1JVRkJSU3hEUVVGRE8xRkJRMmhETEVsQlFVa3NSVUZCUlN4SFFVRkhMRWxCUVVrc1EwRkJReXhYUVVGWExFTkJRVU1zUTBGQlF5eERRVUZETEVWQlFVVXNSVUZCUlN4SFFVRkhMRWxCUVVrc1EwRkJReXhYUVVGWExFTkJRVU1zUTBGQlF5eERRVUZETEVWQlFVVXNRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJRenRSUVVNNVJDeFBRVUZQTEVWQlFVVXNRMEZCUXl4RFFVRkRMRU5CUVVNc1MwRkJTeXhGUVVGRkxFTkJRVU1zUTBGQlF5eERRVUZETzFsQlFVVXNRMEZCUXl4RlFVRkZMRU5CUVVNN1VVRkZOVUlzVDBGQlR5eEZRVUZGTEdOQlFXTXNSVUZCUlN4RlFVRkZMRU5CUVVNc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF5eEZRVUZGTEZGQlFWRXNSVUZCUlN4RlFVRkZMRU5CUVVNc1MwRkJTeXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEUxQlFVMHNRMEZCUXl4RlFVRkZMRU5CUVVNc1MwRkJTeXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVWQlFVVXNRMEZCUXp0SlFVTndSaXhEUVVGRE8wbEJTVVFzY1VOQlFXZENMRWRCUVdoQ0xGVkJRV2xDTEVOQlFVTXNSVUZCUlN4RFFVRkRPMUZCUVhKQ0xHbENRVmRETzFGQlZrY3NTVUZCU1N4SlFVRkpMRWRCUVVjc1NVRkJTU3hEUVVGRExIVkNRVUYxUWl4RFFVRkRMRU5CUVVNc1JVRkJSU3hEUVVGRExFTkJRVU1zUTBGQlF6dFJRVU01UXl4SlFVRkpMR0ZCUVdFc1IwRkJSeXhGUVVGRkxFTkJRVU03VVVGRGRrSXNTVUZCU1N4RFFVRkRMRkZCUVZFc1EwRkJReXhQUVVGUExFTkJRVU1zVlVGQlFTeERRVUZETEVsQlFVY3NUMEZCUVN4aFFVRmhMRU5CUVVNc1EwRkJReXhEUVVGRExFVkJRVVVzUTBGQlF5eEhRVUZITEVWQlFVVXNSVUZCZUVJc1EwRkJkMElzUTBGQlF5eERRVUZETzFGQlEzQkVMRWxCUVVrc1UwRkJVeXhIUVVGSExFbEJRVWtzUTBGQlF5eGpRVUZqTEVOQlFVTXNVVUZCVVN4RFFVRkRMRTFCUVUwc1EwRkJReXhWUVVGQkxFTkJRVU1zU1VGQlJ5eFBRVUZCTEVOQlFVTXNRMEZCUXl4RFFVRkRMRWxCUVVrc1lVRkJZU3hEUVVGRExFVkJRWEpDTEVOQlFYRkNMRU5CUVVNc1EwRkJRenRSUVVVdlJTeEpRVUZKTEVOQlFVTXNVVUZCVVR0aFFVTlNMRTFCUVUwc1EwRkJReXhWUVVGQkxFTkJRVU1zU1VGQlJ5eFBRVUZCTEVOQlFVTXNRMEZCUXl4TlFVRk5MRXRCUVVzc1NVRkJTU3hEUVVGRExHTkJRV01zUlVGQmFFTXNRMEZCWjBNc1EwRkJRenRoUVVNMVF5eFBRVUZQTEVOQlFVTXNWVUZCUVN4RFFVRkRMRWxCUVVjc1QwRkJRU3hUUVVGVExFZEJRVWNzVTBGQlV5eERRVUZETEUxQlFVMHNRMEZCUXl4RFFVRkRMRU5CUVVNc1RVRkJUU3hEUVVGRExGRkJRVkVzUTBGQlF5eE5RVUZOTEVOQlFVTXNWVUZCUVN4RFFVRkRMRWxCUVVjc1QwRkJRU3hEUVVGRExFdEJRVXNzUTBGQlF5eERRVUZETEVWQlFVVXNSVUZCVml4RFFVRlZMRU5CUVVNc1EwRkJReXhGUVVGMFJTeERRVUZ6UlN4RFFVRkRMRU5CUVVNN1VVRkZla1lzVDBGQlR5eFRRVUZUTEVOQlFVTXNSMEZCUnl4RFFVRkRMRlZCUVVFc1EwRkJReXhKUVVGSExFOUJRVUVzUzBGQlNTeERRVUZETEV0QlFVc3NRMEZCUXl4RFFVRkRMRU5CUVVNc1JVRkJZaXhEUVVGaExFTkJRVU1zUTBGQlF6dEpRVU0xUXl4RFFVRkRPMGxCU1Uwc2VVSkJRV01zUjBGQmNrSXNWVUZCYzBJc1RVRkJUU3hGUVVGRkxFTkJRVU1zUlVGQlJTeERRVUZETzFGQlJUbENMRWxCUVVrc1UwRkJVeXhIUVVGSExFVkJRVVVzUTBGQlF6dFJRVU51UWl4TFFVRkxMRWxCUVVrc1JVRkJSU3hIUVVGSExFTkJRVU1zUlVGQlJTeEZRVUZGTEVkQlFVY3NUVUZCVFN4RFFVRkRMRTFCUVUwc1JVRkJSU3hGUVVGRkxFVkJRVVVzUlVGQlJUdFpRVU4yUXl4SlFVRkpMRXRCUVVzc1IwRkJSeXhOUVVGTkxFTkJRVU1zUlVGQlJTeERRVUZETEVOQlFVTTdXVUZEZGtJc1MwRkJTeXhKUVVGSkxFVkJRVVVzUjBGQlJ5eERRVUZETEVWQlFVVXNSVUZCUlN4SFFVRkhMRXRCUVVzc1EwRkJReXhOUVVGTkxFVkJRVVVzUlVGQlJTeEZRVUZGTEVWQlFVVTdaMEpCUTNSRExFbEJRVWtzUTBGQlF5eEhRVUZSTEV0QlFVc3NRMEZCUXl4RlFVRkZMRU5CUVVNc1EwRkJRenRuUWtGRGRrSXNRMEZCUXl4RFFVRkRMRTFCUVUwc1IwRkJSeXhGUVVGRkxFTkJRVU03WjBKQlEyUXNRMEZCUXl4RFFVRkRMRU5CUVVNc1IwRkJSeXhGUVVGRkxFTkJRVU03WjBKQlExUXNTVUZCU1N4SFFVRkhMRWRCUVVjc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0blFrRkROVUlzU1VGQlNTeEpRVUZKTEVOQlFVTXNSMEZCUnl4RFFVRkRMRWRCUVVjc1EwRkJReXhIUVVGSExFZEJRVWNzUlVGQlJUdHZRa0ZEY2tJc1UwRkJVeXhEUVVGRExFbEJRVWtzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0cFFrRkRja0k3WVVGRFNqdFRRVU5LTzFGQlEwUXNVMEZCVXl4RFFVRkRMRWxCUVVrc1EwRkJReXhWUVVGRExFTkJRVU1zUlVGQlJTeERRVUZETEVsQlFVc3NUMEZCUVN4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVkQlFVY3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eEZRVUZxUWl4RFFVRnBRaXhEUVVGRExFTkJRVU03VVVGSE5VTXNTVUZCU1N4WlFVRlpMRWRCUVVjc1JVRkJSU3hEUVVGRE8xRkJRM1JDTEVsQlFVa3NWVUZCVlN4SFFVRkhMRWxCUVVrc1EwRkJRenRSUVVOMFFpeExRVUZMTEVsQlFVa3NRMEZCUXl4SFFVRkhMRU5CUVVNc1JVRkJSU3hEUVVGRExFZEJRVWNzVTBGQlV5eERRVUZETEUxQlFVMHNSVUZCUlN4RFFVRkRMRVZCUVVVc1JVRkJSVHRaUVVOMlF5eEpRVUZKTEVOQlFVTXNSMEZCUnl4VFFVRlRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU03V1VGRGNrSXNTVUZCU1N4RFFVRkRMRlZCUVZVc1NVRkJTU3hKUVVGSkxFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUjBGQlJ5eFZRVUZWTEVOQlFVTXNSMEZCUnl4RFFVRkRMRWRCUVVjc1IwRkJSeXhGUVVGRk8yZENRVU42UkN4VlFVRlZMRWRCUVVjc1JVRkJSU3hIUVVGSExFVkJRVVVzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhGUVVGRkxGRkJRVkVzUlVGQlJTeEZRVUZGTEVWQlFVVXNRMEZCUXp0blFrRkROVU1zV1VGQldTeERRVUZETEVsQlFVa3NRMEZCUXl4VlFVRlZMRU5CUVVNc1EwRkJRenRoUVVOcVF6dFpRVU5FTEZWQlFWVXNRMEZCUXl4UlFVRlJMRU5CUVVNc1NVRkJTU3hEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETzFOQlF5OUNPMUZCUTBRc1QwRkJUeXhaUVVGWkxFTkJRVU03U1VGRGVFSXNRMEZCUXp0SlFWTk5MRzlDUVVGVExFZEJRV2hDTEZWQlFXbENMRU5CUVZNc1JVRkJSU3hEUVVGVExFVkJRVVVzVFVGQlRTeEZRVUZGTEZGQlFWRXNSVUZCUlN4TlFVRk5MRVZCUVVVc1IwRkJWenRSUVVONFJTeEpRVUZKTEVOQlFVTXNSMEZCUnl4UlFVRlJMRU5CUVVNc1RVRkJUU3hEUVVGRE8xRkJRM2hDTEVsQlFVa3NRMEZCUXl4SlFVRkpMRU5CUVVNN1dVRkJSU3hQUVVGUE8xRkJRMjVDTEVsQlFVa3NSVUZCUlN4SFFVRkhMRkZCUVZFc1EwRkJReXhIUVVGSExFTkJRVU1zVlVGQlFTeERRVUZETEVsQlFVa3NUMEZCUVN4SlFVRkpMR1ZCUVZFc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1JVRkJja0lzUTBGQmNVSXNRMEZCUXl4RFFVRkRPMUZCUTJ4RUxFbEJRVWtzUlVGQlJTeEhRVUZITEVWQlFVVXNRMEZCUXp0UlFVTmFMRXRCUVVzc1NVRkJTU3hEUVVGRExFZEJRVWNzUTBGQlF5eEZRVUZGTEVOQlFVTXNSMEZCUnl4RFFVRkRMRVZCUVVVc1EwRkJReXhGUVVGRkxFVkJRVVU3V1VGRGVFSXNTMEZCU3l4SlFVRkpMRU5CUVVNc1IwRkJSeXhEUVVGRExFVkJRVVVzUTBGQlF5eEhRVUZITEVOQlFVTXNSVUZCUlN4RFFVRkRMRVZCUVVVc1JVRkJSVHRuUWtGRGVFSXNTVUZCU1N4RFFVRkRMRXRCUVVzc1EwRkJRenR2UWtGQlJTeFRRVUZUTzJkQ1FVTjBRaXhKUVVGSkxFVkJRVVVzUjBGQlJ5eFJRVUZSTEVOQlFVTXNRMEZCUXl4RFFVRkRMRVZCUTJoQ0xFVkJRVVVzUjBGQlJ5eFJRVUZSTEVOQlFVTXNRMEZCUXl4RFFVRkRMRVZCUTJoQ0xFVkJRVVVzUjBGQlJ5eEZRVUZGTEVOQlFVTXNUVUZCVFN4RlFVTmtMRVZCUVVVc1IwRkJSeXhGUVVGRkxFTkJRVU1zVFVGQlRTeEZRVU5rTEVsQlFVa3NSMEZCUnl4RFFVRkRMRU5CUVVNc1JVRkRWQ3hKUVVGSkxFZEJRVWNzUTBGQlF5eERRVUZETEVOQlFVTTdaMEpCVFdRc1NVRkJTU3hEUVVGRExFbEJRVWtzUjBGQlJ5eEZRVUZGTzI5Q1FVTldMRWxCUVVrc1RVRkJUU3hEUVVGRExFVkJRVVVzUlVGQlJTeEZRVUZGTEVOQlFVTXNSVUZCUlR0M1FrRkZhRUlzU1VGQlNTeEZRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFZEJRVWNzUlVGQlJTeERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhGUVVGRk96UkNRVU55UWl4SlFVRkpMRWRCUVVjc1EwRkJReXhGUVVGRkxFbEJRVWtzUjBGQlJ5eERRVUZETEVOQlFVTTdlVUpCUTNSQ096WkNRVUZOT3pSQ1FVTklMRWxCUVVrc1IwRkJSeXhEUVVGRExFVkJRVVVzU1VGQlNTeEhRVUZITEVOQlFVTXNRMEZCUXp0NVFrRkRkRUk3Y1VKQlEwbzdhVUpCUTBvN2NVSkJRVTA3YjBKQlEwZ3NTVUZCU1N4TlFVRk5MRU5CUVVNc1JVRkJSU3hGUVVGRkxFVkJRVVVzUTBGQlF5eEZRVUZGTzNkQ1FVTm9RaXhKUVVGSkxFVkJRVVVzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1IwRkJSeXhGUVVGRkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRVZCUVVVN05FSkJRM0pDTEVsQlFVa3NSMEZCUnl4RFFVRkRMRVZCUVVVc1NVRkJTU3hIUVVGSExFTkJRVU1zUTBGQlF6dDVRa0ZEZEVJN05rSkJRVTA3TkVKQlEwZ3NTVUZCU1N4SFFVRkhMRU5CUVVNc1JVRkJSU3hKUVVGSkxFZEJRVWNzUTBGQlF5eERRVUZETzNsQ1FVTjBRanR4UWtGRFNqdHBRa0ZEU2p0blFrRkRSQ3hKUVVGSkxFbEJRVWtzU1VGQlNTeERRVUZETEVWQlFVVTdiMEpCUlZnc1JVRkJSU3hEUVVGRExFbEJRVWtzUTBGQlF5eEpRVUZKTEdsQ1FVRlZMRU5CUVVNc1JVRkJSU3hEUVVGRExFbEJRVWtzUTBGQlF5eEZRVUZGTEVWQlFVVXNRMEZCUXl4SlFVRkpMRU5CUVVNc1JVRkJSU3hIUVVGSExFTkJRVU1zUTBGQlF5eERRVUZETzJsQ1FVTndSRHRoUVVOS08xTkJRMG83VVVGRFJDeEpRVUZKTEUxQlFVMHNSMEZCUnl4SlFVRkpMR0ZCUVUwc1EwRkJReXhGUVVGRkxFVkJRVVVzUlVGQlJTeERRVUZETEVOQlFVTTdVVUZEYUVNc1RVRkJUU3hEUVVGRExFdEJRVXNzUlVGQlJTeERRVUZETzFGQlEyWXNSVUZCUlN4RFFVRkRMRTlCUVU4c1EwRkJReXhWUVVGRExFTkJRVU1zUlVGQlJTeERRVUZETzFsQlExb3NTVUZCU1N4RFFVRkRMRWRCUVVjc1VVRkJVU3hEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETzFsQlEzQkNMRWxCUVVrc1IwRkJSeXhIUVVGSExFTkJRVU1zUTBGQlF5eFJRVUZSTEVWQlFVVXNRMEZCUXp0WlFVTjJRaXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4SFFVRkhMRWRCUVVjc1EwRkJRenRaUVVONFFpeEpRVUZKTEV0QlFVc3NSMEZCUnl4TlFVRk5MRU5CUVVNc1EwRkJReXhEUVVGRExFMUJRVTBzUTBGQlF5eERRVUZETzFsQlF6ZENMRWxCUVVrc1EwRkJReXhEUVVGRExFTkJRVU1zUjBGQlJ5eERRVUZETzJkQ1FVRkZMRXRCUVVzc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eEhRVUZITEVkQlFVY3NRMEZCUXp0WlFVTjRReXhKUVVGSkxFTkJRVU1zUTBGQlF5eERRVUZETEVkQlFVY3NTMEZCU3l4RFFVRkRMRTFCUVUwc1IwRkJSeXhEUVVGRE8yZENRVUZGTEV0QlFVc3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhIUVVGSExFZEJRVWNzUTBGQlF6dFJRVU16UkN4RFFVRkRMRU5CUVVNc1EwRkJRenRKUVVOUUxFTkJRVU03U1VGRlRTeDNRa0ZCWVN4SFFVRndRaXhWUVVGeFFpeE5RVUZOTEVWQlFVVXNRMEZCVXl4RlFVRkZMRU5CUVZNc1JVRkJSU3hOUVVFeVF5eEZRVUZGTEVkQlFWYzdVVUZEZGtjc1NVRkJTU3haUVVGWkxFZEJRVWNzVlVGQlZTeERRVUZETEdOQlFXTXNRMEZCUXl4TlFVRk5MRVZCUVVVc1EwRkJReXhGUVVGRkxFTkJRVU1zUTBGQlF5eERRVUZETzFGQlJUTkVMRXRCUVVzc1NVRkJTU3hEUVVGRExFZEJRVWNzUTBGQlF5eEZRVUZGTEVOQlFVTXNSMEZCUnl4WlFVRlpMRU5CUVVNc1RVRkJUU3hGUVVGRkxFTkJRVU1zUlVGQlJTeEZRVUZGTzFsQlF6RkRMRWxCUVVrc1JVRkJSU3hIUVVGSExGbEJRVmtzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0WlFVTjZRaXhKUVVGSkxFMUJRVTBzUjBGQlJ5eEZRVUZGTEVOQlFVTTdXVUZEYUVJc1MwRkJTeXhKUVVGSkxFTkJRVU1zUjBGQlJ5eERRVUZETEVWQlFVVXNRMEZCUXl4SFFVRkhMRVZCUVVVc1EwRkJReXhSUVVGUkxFTkJRVU1zVFVGQlRTeEZRVUZGTEVOQlFVTXNSVUZCUlN4RlFVRkZPMmRDUVVONlF5eEpRVUZKTEVOQlFVTXNSMEZCUnl4RlFVRkZMRU5CUVVNc1VVRkJVU3hEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETzJkQ1FVTjJRaXhOUVVGTkxFTkJRVU1zU1VGQlNTeERRVUZETEVWQlFVVXNTVUZCU1N4RlFVRkZMRU5CUVVNc1JVRkJSU3hEUVVGRExFVkJRVVVzUTBGQlF5eEZRVUZGTEVkQlFVY3NSVUZCUlN4SlFVRkpMRU5CUVVNc1IwRkJSeXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1JVRkJSU3hEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1JVRkJSU3hEUVVGRExFTkJRVU03WjBKQlEyaEZMRTFCUVUwc1EwRkJReXhKUVVGSkxFTkJRVU1zUlVGQlJTeEpRVUZKTEVWQlFVVXNRMEZCUXl4RlFVRkZMRU5CUVVNc1JVRkJSU3hEUVVGRExFVkJRVVVzUjBGQlJ5eEZRVUZGTEVsQlFVa3NRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RlFVRkZMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RlFVRkZMRU5CUVVNc1EwRkJRenRoUVVOdVJUdFpRVU5FTEUxQlFVMHNRMEZCUXl4SlFVRkpMRU5CUVVNc1ZVRkJReXhEUVVGRExFVkJRVVVzUTBGQlF5eEpRVUZMTEU5QlFVRXNRMEZCUXl4RFFVRkRMRWRCUVVjc1IwRkJSeXhEUVVGRExFTkJRVU1zUjBGQlJ5eEhRVUZITEVOQlFVTXNRMEZCUXl4SlFVRkpMRWRCUVVjc1EwRkJReXhEUVVGRExFbEJRVWtzUlVGQkwwSXNRMEZCSzBJc1EwRkJReXhEUVVGRE8xbEJRM1pFTEVsQlFVa3NTVUZCU1N4SFFVRkhMRVZCUVVVc1EwRkJRenRaUVVOa0xFbEJRVWtzVTBGQlV5eEhRVUZITEVOQlFVTXNRMEZCUXp0WlFVTnNRaXhOUVVGTkxFTkJRVU1zVDBGQlR5eERRVUZETEZWQlFVRXNRMEZCUXp0blFrRkRXaXhKUVVGSkxFTkJRVU1zUTBGQlF5eEpRVUZKTEV0QlFVc3NRMEZCUXl4RlFVRkZPMjlDUVVOa0xFbEJRVWtzUTBGQlF5eEpRVUZKTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRE8yOUNRVU5tTEZOQlFWTXNSVUZCUlN4RFFVRkRPMmxDUVVObU8zRkNRVUZOTzI5Q1FVTklMRk5CUVZNc1JVRkJSU3hEUVVGRE8ybENRVU5tTzJkQ1FVTkVMRWxCUVVrc1UwRkJVeXhKUVVGSkxFTkJRVU1zUlVGQlJUdHZRa0ZEYUVJc1ZVRkJWU3hEUVVGRExGTkJRVk1zUTBGQlF5eERRVUZETEVWQlFVVXNRMEZCUXl4RlFVRkZMRTFCUVUwc1JVRkJSU3hKUVVGSkxFVkJRVVVzVFVGQlRTeEZRVUZGTEVkQlFVY3NRMEZCUXl4RFFVRkRPMjlDUVVOMFJDeEpRVUZKTEVkQlFVY3NSVUZCUlN4RFFVRkRPMmxDUVVOaU8xbEJRMHdzUTBGQlF5eERRVUZETEVOQlFVTTdVMEZEVGp0SlFVTk1MRU5CUVVNN1NVRlRSQ3dyUWtGQlZTeEhRVUZXTEZWQlFXbENMRXRCUVdFc1JVRkJSU3hSUVVGblFpeEZRVUZGTEUxQlFUSkNMRVZCUVVVc1RVRkJNa0k3VVVGQk1VY3NhVUpCVVVNN1VVRlFSeXhKUVVGSkxGVkJRVlVzUjBGQlJ5eExRVUZMTEVOQlFVTXNSMEZCUnl4RFFVRkRMRlZCUVVFc1EwRkJReXhKUVVGSExFOUJRVUVzUzBGQlNTeERRVUZETEV0QlFVc3NRMEZCUXl4TlFVRk5MRU5CUVVNc1EwRkJReXhEUVVGRExFVkJRVVVzVFVGQlRTeERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRVZCUVdoRExFTkJRV2RETEVOQlFVTXNRMEZCUXp0UlFVTnFSU3hKUVVGSkxFdEJRVXNzUjBGQlJ5eFZRVUZWTEVOQlFVTXNWVUZCVlN4RFFVRkRMRlZCUVZVc1EwRkJReXhEUVVGRE8xRkJRemxETEVsQlFVa3NUVUZCVFN4SFFVRkhMRlZCUVZVc1EwRkJReXhIUVVGSExFTkJRVU1zVlVGQlZTeERRVUZETEVsQlFVa3NUMEZCVHl4VlFVRlZMRU5CUVVNc1dVRkJXU3hEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1VVRkRha1lzVlVGQlZTeERRVUZETEdGQlFXRXNRMEZCUXl4TlFVRk5MRVZCUVVVc1IwRkJSeXhGUVVGRkxFZEJRVWNzUlVGQlJTeExRVUZMTEVWQlFVVXNVVUZCVVN4RFFVRkRMRU5CUVVNN1VVRkROVVFzVlVGQlZTeERRVUZETEdGQlFXRXNRMEZCUXl4TlFVRk5MRVZCUVVVc1IwRkJSeXhGUVVGRkxFZEJRVWNzUlVGQlJTeExRVUZMTEVWQlFVVXNVVUZCVVN4RFFVRkRMRU5CUVVNN1VVRkROVVFzVlVGQlZTeERRVUZETEdOQlFXTXNRMEZCUXl4TlFVRk5MRVZCUVVVc1ZVRkJWU3hEUVVGRExFTkJRVU03VVVGRE9VTXNUMEZCVHl4TlFVRk5MRU5CUVVNN1NVRkRiRUlzUTBGQlF6dEpRVWxOTEhsQ1FVRmpMRWRCUVhKQ0xGVkJRWE5DTEUxQlFVMHNSVUZCUlN4VlFVRlZPMUZCUTNCRExFMUJRVTBzUTBGQlF5eFBRVUZQTEVOQlFVTXNWVUZCUXl4UlFVRlJMRVZCUVVVc1EwRkJRenRaUVVOMlFpeEpRVUZKTEVsQlFVa3NSMEZCUnl4VlFVRlZMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU03V1VGRGVrSXNTVUZCVlN4SlFVRkxMRU5CUVVNc1VVRkJVU3hGUVVGRk8yZENRVU4wUWl4UlFVRlJMRU5CUVVNc1QwRkJUeXhGUVVGRkxFTkJRVU03WjBKQlEyNUNMRkZCUVZFc1EwRkJReXhQUVVGUExFTkJRVU1zVlVGQlZTeFBRVUZQTzI5Q1FVTTVRaXhQUVVGUExFTkJRVU1zVDBGQlR5eEZRVUZGTEVOQlFVTTdaMEpCUTNSQ0xFTkJRVU1zUTBGQlF5eERRVUZETzJGQlEwNDdVVUZEVEN4RFFVRkRMRU5CUVVNc1EwRkJRenRKUVVOUUxFTkJRVU03U1VGRlRTdzJRa0ZCYTBJc1IwRkJla0lzVlVGQk1FSXNTMEZCWXl4RlFVRkZMRXRCUVdNN1VVRkRjRVFzU1VGQlNTeE5RVUZOTEVkQlFVY3NTVUZCU1N4RFFVRkRMRXRCUVVzc1EwRkJReXhMUVVGTExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4SFFVRkhMRXRCUVVzc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVWQlF6TkRMRXRCUVVzc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVkQlFVY3NTMEZCU3l4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETzFGQlF6ZENMRWxCUVVrc1RVRkJUU3hIUVVGSExFbEJRVWtzUTBGQlF5eExRVUZMTEVOQlFVTXNTMEZCU3l4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUjBGQlJ5eExRVUZMTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhGUVVNelF5eExRVUZMTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhIUVVGSExFdEJRVXNzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJRenRSUVVNM1FpeEpRVUZKTEVsQlFVa3NSMEZCUnl4TlFVRk5MRWRCUVVjc1RVRkJUU3hEUVVGRE8xRkJRek5DTEVsQlFVa3NTVUZCU1N4SFFVRkhMRWxCUVVrc1EwRkJReXhGUVVGRkxFbEJRVWtzU1VGQlNTeEhRVUZITEVOQlFVTXNTVUZCU1N4RFFVRkRMRVZCUVVVc1JVRkJSVHRaUVVOdVF5eEpRVUZKTEVkQlFVY3NUVUZCVFN4SFFVRkhMRTFCUVUwc1EwRkJRenRUUVVNeFFqdFJRVU5FTEU5QlFVOHNTVUZCU1N4RFFVRkRPMGxCUTJoQ0xFTkJRVU03U1VGSFl5eHBRa0ZCVFN4SFFVRnlRaXhWUVVGelFpeERRVUZETEVWQlFVVXNRMEZCUXl4RlFVRkZMRU5CUVVNN1VVRkRla0lzVDBGQlR5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1IwRkJSeXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVkQlFVY3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFZEJRVWNzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1NVRkJTU3hEUVVGRExFTkJRVU03U1VGRGVFVXNRMEZCUXp0SlFVbGpMRzFDUVVGUkxFZEJRWFpDTEZWQlFYZENMRXRCUVdsRE8xRkJRM0pFTEVsQlFVa3NVVUZCVVN4SFFVRkhMRVZCUVVVc1EwRkJRenRSUVVOc1FpeExRVUZMTEVsQlFVa3NRMEZCUXl4SFFVRkhMRU5CUVVNc1JVRkJSU3hEUVVGRExFZEJRVWNzUzBGQlN5eERRVUZETEUxQlFVMHNSVUZCUlN4RFFVRkRMRVZCUVVVc1JVRkJSVHRaUVVOdVF5eEpRVUZKTEVOQlFVTXNSMEZCUnl4TFFVRkxMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU03V1VGRGFrSXNTVUZCU1N4UFFVRlBMRkZCUVZFc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEV0QlFVc3NWMEZCVnp0blFrRkJSU3hSUVVGUkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4SFFVRkhMRVZCUVVVc1EwRkJRenRaUVVNM1JDeFJRVUZSTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNSMEZCUnl4SlFVRkpMRU5CUVVNN1UwRkROMEk3VVVGRFJDeFBRVUZQTEZWQlFVTXNRMEZCUXl4RlFVRkZMRU5CUVVNc1NVRkJTeXhQUVVGQkxFOUJRVThzVVVGQlVTeERRVUZETEVOQlFVTXNRMEZCUXl4TFFVRkxMRmRCUVZjc1NVRkJTU3hSUVVGUkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRVZCUVhCRUxFTkJRVzlFTEVOQlFVTTdTVUZETVVVc1EwRkJRenRKUVVsTkxIRkNRVUZWTEVkQlFXcENMRlZCUVd0Q0xFdEJRVXM3VVVGRGJrSXNTVUZCU1N4VFFVRlRMRWRCUVVjc1JVRkJSU3hEUVVGRE8xRkJRMjVDTEV0QlFVc3NTVUZCU1N4RFFVRkRMRWRCUVVjc1EwRkJReXhGUVVGRkxFTkJRVU1zUjBGQlJ5eExRVUZMTEVOQlFVTXNUVUZCVFN4SFFVRkhMRU5CUVVNc1JVRkJSU3hEUVVGRExFVkJRVVVzUlVGQlJUdFpRVU4yUXl4TFFVRkxMRWxCUVVrc1EwRkJReXhIUVVGSExFTkJRVU1zUjBGQlJ5eERRVUZETEVWQlFVVXNRMEZCUXl4SFFVRkhMRXRCUVVzc1EwRkJReXhOUVVGTkxFVkJRVVVzUTBGQlF5eEZRVUZGTEVWQlFVVTdaMEpCUTNaRExFbEJRVWtzUTBGQlF5eEhRVUZITEV0QlFVc3NRMEZCUXl4RFFVRkRMRU5CUVVNc1JVRkRXaXhEUVVGRExFZEJRVWNzUzBGQlN5eERRVUZETEVOQlFVTXNRMEZCUXl4RlFVTmFMRWRCUVVjc1IwRkJSeXhKUVVGSkxIZENRVUYzUWl4RFFVRkRMRU5CUVVNc1JVRkJSU3hEUVVGRExFTkJRVU1zUTBGQlF6dG5Ra0ZETjBNc1NVRkJTU3hEUVVGRExFVkJRVVVzUlVGQlJTeEZRVUZGTEVWQlFVVXNRMEZCUXp0blFrRkRaQ3hKUVVGSkxFZEJRVWNzUTBGQlF5eE5RVUZOTEV0QlFVc3NRMEZCUXp0dlFrRkRhRUlzVTBGQlV6dG5Ra0ZEWWl4SlFVRkpMRWRCUVVjc1EwRkJReXhSUVVGUkxFVkJRVVU3YjBKQlIyUXNRMEZCUXl4RFFVRkRMRTlCUVU4c1JVRkJSU3hEUVVGRE8yOUNRVU5hTEVOQlFVTXNRMEZCUXl4UlFVRlJMRWRCUVVjc1NVRkJTU3hEUVVGRE8yOUNRVU5zUWl4SFFVRkhMRWRCUVVjc1NVRkJTU3gzUWtGQmQwSXNRMEZCUXl4RFFVRkRMRVZCUVVVc1EwRkJReXhEUVVGRExFTkJRVU03YVVKQlF6VkRPMmRDUVVORUxFbEJRVWtzUTBGQlF5eEhRVUZITEVOQlFVTXNSVUZCUlN4SlFVRkpMRU5CUVVNc1NVRkJTU3hIUVVGSExFTkJRVU1zUlVGQlJTeEpRVUZKTEVOQlFVTXNRMEZCUXp0dlFrRkROVUlzUTBGQlF5eEhRVUZITEVOQlFVTXNSVUZCUlN4SFFVRkhMRWRCUVVjc1EwRkJReXhOUVVGTkxFbEJRVWtzUTBGQlF5eERRVUZETEUxQlFVMHNTVUZCU1N4SFFVRkhMRU5CUVVNc1JVRkJSU3hIUVVGSExFZEJRVWNzUTBGQlF5eE5RVUZOTEVsQlFVa3NRMEZCUXl4RFFVRkRMRTFCUVUwc1EwRkJReXhGUVVGRk8yOUNRVVYwUlN4VFFVRlRMRU5CUVVNc1NVRkJTU3hEUVVGRExFVkJRVVVzUTBGQlF5eEZRVUZGTEVOQlFVTXNSVUZCUlN4RFFVRkRMRVZCUVVVc1EwRkJReXhGUVVGRkxFTkJRVU1zUTBGQlF6dHZRa0ZETDBJc1UwRkJVenRwUWtGRFdqdG5Ra0ZEUkN4SlFVRkpMRWRCUVVjc1EwRkJReXhGUVVGRkxFZEJRVWNzUjBGQlJ5eERRVUZETEUxQlFVMHNTVUZCU1N4RFFVRkRMRU5CUVVNc1RVRkJUU3hKUVVGSkxFZEJRVWNzUTBGQlF5eEZRVUZGTEVkQlFVY3NSMEZCUnl4RFFVRkRMRTFCUVUwc1NVRkJTU3hEUVVGRExFTkJRVU1zVFVGQlRTeEZRVUZGTzI5Q1FVMXdSU3hEUVVGRExFZEJRVWNzUTBGQlF5eERRVUZETEVkQlFVY3NRMEZCUXl4RlFVRkZMRWRCUVVjc1EwRkJReXhEUVVGRExFTkJRVU03YjBKQlEyeENMRVZCUVVVc1IwRkJSeXhEUVVGRExFTkJRVU1zUjBGQlJ5eERRVUZETEVWQlFVVXNSMEZCUnl4RFFVRkRMRU5CUVVNc1EwRkJRenR2UWtGRGJrSXNSVUZCUlN4SFFVRkhMRU5CUVVNc1EwRkJReXhIUVVGSExFTkJRVU1zUlVGQlJTeEhRVUZITEVOQlFVTXNRMEZCUXl4RFFVRkRPMmxDUVVOMFFqdHhRa0ZCVFR0dlFrRkRTQ3hEUVVGRExFZEJRVWNzUTBGQlF5eERRVUZETEVkQlFVY3NRMEZCUXl4RlFVRkZMRWRCUVVjc1IwRkJSeXhEUVVGRExFMUJRVTBzUjBGQlJ5eERRVUZETEVOQlFVTXNRMEZCUXp0dlFrRkRMMElzUlVGQlJTeEhRVUZITEVOQlFVTXNRMEZCUXl4SFFVRkhMRU5CUVVNc1JVRkJSU3hIUVVGSExFZEJRVWNzUTBGQlF5eE5RVUZOTEVOQlFVTXNRMEZCUXp0dlFrRkROVUlzUlVGQlJTeEhRVUZITEVOQlFVTXNRMEZCUXl4SFFVRkhMRU5CUVVNc1JVRkJSU3hIUVVGSExFZEJRVWNzUTBGQlF5eE5RVUZOTEVOQlFVTXNRMEZCUXp0cFFrRkRMMEk3WjBKQlEwUXNTVUZCU1N4VlFVRlZMRU5CUVVNc1RVRkJUU3hEUVVGRExFTkJRVU1zUlVGQlJTeEZRVUZGTEVWQlFVVXNSVUZCUlN4RFFVRkRMRVZCUVVVN2IwSkJRemxDTEZOQlFWTXNRMEZCUXl4SlFVRkpMRU5CUVVNc1JVRkJSU3hEUVVGRExFVkJRVVVzUTBGQlF5eEZRVUZGTEVOQlFVTXNSVUZCUlN4RFFVRkRMRVZCUVVVc1EwRkJReXhEUVVGRE8ybENRVU5zUXp0eFFrRkJUVHR2UWtGRFNDeFRRVUZUTEVOQlFVTXNTVUZCU1N4RFFVRkRMRVZCUVVVc1EwRkJReXhGUVVGRkxFTkJRVU1zUlVGQlJTeERRVUZETEVWQlFVVXNRMEZCUXl4RlFVRkZMRU5CUVVNc1EwRkJRenRwUWtGRGJFTTdZVUZEU2p0VFFVTktPMUZCUlVRc1QwRkJUeXhWUVVGVkxFTkJRVU1zVVVGQlVTeERRVUZETEZOQlFWTXNRMEZCUXl4RFFVRkRPMGxCUXpGRExFTkJRVU03U1VGTFRTeDFRa0ZCV1N4SFFVRnVRaXhWUVVGdlFpeEpRVUZoTzFGQlF6ZENMRk5CUVZNc1UwRkJVeXhEUVVGRExFTkJRVkU3V1VGRGRrSXNUMEZCWXl4RlFVRkZMRU5CUVVNc1JVRkJSU3hEUVVGRExFTkJRVU1zUTBGQlF5eEZRVUZGTEVOQlFVTXNSVUZCUlN4RFFVRkRMRU5CUVVNc1EwRkJReXhGUVVGRkxFTkJRVU03VVVGRGNrTXNRMEZCUXp0UlFVTkVMRWxCUVVrc1ZVRkJWU3hIUVVGSExGVkJRVU1zUTBGQlF5eEZRVUZGTEVOQlFVTXNSVUZCUlN4RFFVRkRMRWxCUVVzc1QwRkJRU3hKUVVGSkxFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1IwRkJSeXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVkQlFVY3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFZEJRVWNzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1IwRkJSeXhMUVVGTExFVkJRWFpGTEVOQlFYVkZMRU5CUVVNN1VVRkRkRWNzU1VGQlNTeFJRVUZSTEVkQlFVY3NSVUZCUlN4RFFVRkRPMUZCUTJ4Q0xFbEJRVWtzUTBGQlF5eEhRVUZITEZOQlFWTXNRMEZCUXl4SlFVRkpMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dFJRVU16UWl4TFFVRkxMRWxCUVVrc1EwRkJReXhIUVVGSExFTkJRVU1zUlVGQlJTeERRVUZETEVkQlFVY3NTVUZCU1N4RFFVRkRMRTFCUVUwc1JVRkJSU3hEUVVGRExFVkJRVVVzUlVGQlJUdFpRVU5zUXl4SlFVRkpMRU5CUVVNc1IwRkJSeXhUUVVGVExFTkJRVU1zU1VGQlNTeERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRVZCUVVVc1EwRkJReXhIUVVGSExFTkJRVU1zUjBGQlJ5eEpRVUZKTEVOQlFVTXNUVUZCVFN4SFFVRkhMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zU1VGQlNTeERRVUZETEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zU1VGQlNTeERRVUZETzFsQlEzcEZMRWxCUVVrc1EwRkJReXhEUVVGRExFbEJRVWtzUTBGQlF5eFZRVUZWTEVOQlFVTXNRMEZCUXl4RlFVRkZMRU5CUVVNc1JVRkJSU3hEUVVGRExFTkJRVU1zUlVGQlJUdG5Ra0ZETlVJc1VVRkJVU3hEUVVGRExFbEJRVWtzUTBGQlF5eERRVUZETEVOQlFVTXNSVUZCUlN4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRE8yZENRVU4wUWl4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRE8yRkJRMVE3VTBGRFNqdFJRVU5FTEU5QlFVOHNVVUZCVVN4RFFVRkRPMGxCUTNCQ0xFTkJRVU03U1VGSlJDd3dRa0ZCU3l4SFFVRk1MRlZCUVUwc1EwRkJVeXhGUVVGRkxFTkJRVk03VVVGQk1VSXNhVUpCTkVSRE8xRkJNMFJITEVsQlFVa3NUVUZCVFN4SFFVRkhMRWxCUVVrc1EwRkJReXhMUVVGTExFTkJRVk1zUTBGQlF5eERRVUZETEVWQlFVVXNUVUZCVFN4SFFVRkhMRWxCUVVrc1EwRkJReXhMUVVGTExFTkJRVk1zUTBGQlF5eERRVUZETEVOQlFVTTdVVUZEYmtVc1NVRkJTU3hEUVVGRExGTkJRVk1zUjBGQlJ5eEpRVUZKTEVOQlFVTXNaMEpCUVdkQ0xFTkJRVU1zVFVGQlRTeEZRVUZGTEUxQlFVMHNRMEZCUXl4RFFVRkRPMUZCUlhaRUxFbEJRVWtzWTBGQll5eEhRVUZITEVWQlFVVXNRMEZCUXp0UlFVTjRRaXhKUVVGSkxFTkJRVU1zVTBGQlV5eERRVUZETEU5QlFVOHNRMEZCUXl4VlFVRkJMRU5CUVVNc1NVRkJTU3hQUVVGQkxHTkJRV01zUTBGQlF5eERRVUZETEVOQlFVTXNSVUZCUlN4RFFVRkRMRWRCUVVjc1EwRkJReXhGUVVGNFFpeERRVUYzUWl4RFFVRkRMRU5CUVVNN1VVRkRkRVFzU1VGQlNTeERRVUZETEdGQlFXRXNSMEZCUnl4SlFVRkpMRU5CUVVNc1MwRkJTeXhEUVVGRExFMUJRVTBzUTBGQlF5eFZRVUZCTEVOQlFVTTdXVUZEY0VNc1NVRkJTU3hEUVVGRExFZEJRVWNzUzBGQlNTeERRVUZETEV0QlFVc3NRMEZCUXl4RFFVRkRMRU5CUVVNc1RVRkJUU3hEUVVGRExFVkJRM2hDTEVOQlFVTXNSMEZCUnl4TFFVRkpMRU5CUVVNc1MwRkJTeXhEUVVGRExFTkJRVU1zUTBGQlF5eE5RVUZOTEVOQlFVTXNRMEZCUXp0WlFVTTNRaXhQUVVGUExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNTVUZCU1N4SlFVRkpMRU5CUVVNc1EwRkJReXhKUVVGSkxFTkJRVU1zUlVGQlJTeEpRVUZKTEdOQlFXTTdiVUpCUTNaRExFTkJRVU1zUTBGQlF5eEpRVUZKTEVsQlFVa3NRMEZCUXl4RFFVRkRMRWxCUVVrc1EwRkJReXhGUVVGRkxFbEJRVWtzWTBGQll5eERRVUZETEVOQlFVTTdVVUZEYkVRc1EwRkJReXhEUVVGRExFTkJRVU03VVVGSFNDeExRVUZMTEVsQlFVa3NRMEZCUXl4SFFVRkhMRU5CUVVNc1JVRkJSU3hEUVVGRExFZEJRVWNzVFVGQlRTeERRVUZETEV0QlFVc3NRMEZCUXl4TlFVRk5MRVZCUVVVc1EwRkJReXhGUVVGRkxFVkJRVVU3V1VGRE1VTXNTVUZCU1N4RFFVRkRMRWRCUVVjc1RVRkJUU3hEUVVGRExFdEJRVXNzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RlFVRkZMRU5CUVVNN1dVRkRNMElzU1VGQlNTeERRVUZETEVkQlFVY3NUVUZCVFN4RFFVRkRMRXRCUVVzc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eEZRVUZGTEVOQlFVTTdXVUZETTBJc1NVRkJTU3hEUVVGRExHRkJRV0VzUTBGQlF5eEpRVUZKTEVOQlFVTTdaMEpCUTNCQ0xFMUJRVTBzUlVGQlJTeERRVUZETzJkQ1FVTlVMRTFCUVUwc1JVRkJSU3hEUVVGRE8yZENRVU5VTEUxQlFVMHNSVUZCUlN4RFFVRkRPMkZCUTFvc1EwRkJReXhEUVVGRE8xTkJRMDQ3VVVGRFJDeExRVUZMTEVsQlFVa3NRMEZCUXl4SFFVRkhMRU5CUVVNc1JVRkJSU3hEUVVGRExFZEJRVWNzVFVGQlRTeERRVUZETEV0QlFVc3NRMEZCUXl4TlFVRk5MRVZCUVVVc1EwRkJReXhGUVVGRkxFVkJRVVU3V1VGRE1VTXNTVUZCU1N4RFFVRkRMRWRCUVVjc1RVRkJUU3hEUVVGRExFdEJRVXNzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RlFVRkZMRU5CUVVNN1dVRkRNMElzU1VGQlNTeERRVUZETEVkQlFVY3NUVUZCVFN4RFFVRkRMRXRCUVVzc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eEZRVUZGTEVOQlFVTTdXVUZETTBJc1NVRkJTU3hEUVVGRExHRkJRV0VzUTBGQlF5eEpRVUZKTEVOQlFVTTdaMEpCUTNCQ0xFMUJRVTBzUlVGQlJTeERRVUZETzJkQ1FVTlVMRTFCUVUwc1JVRkJSU3hEUVVGRE8yZENRVU5VTEUxQlFVMHNSVUZCUlN4RFFVRkRPMkZCUTFvc1EwRkJReXhEUVVGRE8xTkJRMDQ3VVVGRlJDeEpRVUZKTEZOQlFWTXNSMEZCUnl4VlFVRkJMRU5CUVVNc1NVRkJSeXhQUVVGQkxFTkJRVU1zUTBGQlF5eE5RVUZOTEVWQlFWSXNRMEZCVVN4RlFVTjRRaXhUUVVGVExFZEJRVWNzVlVGQlFTeERRVUZETEVsQlFVY3NUMEZCUVN4RFFVRkRMRU5CUVVNc1RVRkJUU3hGUVVGU0xFTkJRVkVzUlVGRGVFSXNVMEZCVXl4SFFVRkhMRlZCUVVFc1EwRkJReXhKUVVGSExFOUJRVUVzUTBGQlF5eERRVUZETEUxQlFVMHNSVUZCVWl4RFFVRlJMRU5CUVVNN1VVRkZOMElzU1VGQlNTeHpRa0ZCYzBJc1IwRkJSeXhKUVVGSkxEQkNRVUZWTEVOQlFVTXNTVUZCU1N4RFFVRkRMRXRCUVVzc1EwRkJReXhOUVVGTkxFVkJRVVVzU1VGQlNTeERRVUZETEdGQlFXRXNSVUZCUlN4VFFVRlRMRVZCUVVVc1UwRkJVeXhGUVVGRkxGTkJRVk1zUTBGQlF5eERRVUZETzFGQlEzQklMRWxCUVVrc1YwRkJWeXhIUVVGSExGVkJRVU1zUTBGQlF5eEZRVUZGTEVOQlFVTXNSVUZCUlN4RFFVRkRPMWxCUTNSQ0xFbEJRVWtzUTBGQlF5eEhRVUZITEV0QlFVa3NRMEZCUXl4TFFVRkxMRU5CUVVNc1EwRkJReXhEUVVGRExFVkJRVVVzUTBGQlF5eEhRVUZITEV0QlFVa3NRMEZCUXl4TFFVRkxMRU5CUVVNc1EwRkJReXhEUVVGRExFVkJRVVVzUTBGQlF5eEhRVUZITEV0QlFVa3NRMEZCUXl4TFFVRkxMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU03V1VGRE5VUXNTVUZCU1N4RlFVRkZMRWRCUVVjc1NVRkJTU3hEUVVGRExFZEJRVWNzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUlVGQlJTeEZRVUZGTEVkQlFVY3NTVUZCU1N4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJRenRaUVVWMlJDeEpRVUZKTEVOQlFVTXNRMEZCUXl4SlFVRkpMRXRCUVVzc1RVRkJUU3hKUVVGSkxFTkJRVU1zUTBGQlF5eEpRVUZKTEV0QlFVc3NRMEZCUXl4RFFVRkRMRWxCUVVrc1NVRkJTU3hEUVVGRExFTkJRVU1zU1VGQlNTeExRVUZMTEUxQlFVMHNTVUZCU1N4RFFVRkRMRU5CUVVNc1NVRkJTU3hMUVVGTExFTkJRVU1zUTBGQlF5eEpRVUZKTzJkQ1FVTm9SaXhQUVVGUExFTkJRVU1zUTBGQlF6dFpRVU5pTEU5QlFVOHNSVUZCUlN4SFFVRkhMRU5CUVVNc1NVRkJTU3hGUVVGRkxFZEJRVWNzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4SlFVRkpMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dFJRVU4yUXl4RFFVRkRMRU5CUVVNN1VVRkhSaXhKUVVGSkxGbEJRVmtzUjBGQlJ5eHpRa0ZCYzBJc1EwRkJReXc0UWtGQk9FSXNRMEZEY0VVc1RVRkJUU3hEUVVGRExFdEJRVXNzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RlFVRkZMRVZCUVVVc1RVRkJUU3hEUVVGRExFdEJRVXNzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RlFVRkZMRVZCUTNSRExGZEJRVmNzUTBGQlF5eERRVUZETzFGQlIycENMRWxCUVVrc1ZVRkJWU3hIUVVGSExGbEJRVmtzUTBGQlF5eFBRVUZQTEVWQlFVVXNRMEZCUXl4SFFVRkhMRU5CUVVNc1ZVRkJRU3hGUVVGRkxFbEJRVWtzVDBGQlFTeExRVUZKTEVOQlFVTXNTMEZCU3l4RFFVRkRMRVZCUVVVc1EwRkJReXhGUVVGa0xFTkJRV01zUTBGQlF5eERRVUZETzFGQlEyeEZMRlZCUVZVc1EwRkJReXhKUVVGSkxFTkJRVU1zU1VGQlNTeERRVUZETEV0QlFVc3NRMEZCUXl4TlFVRk5MRU5CUVVNc1JVRkJSU3hEUVVGRExFTkJRVU1zUzBGQlN5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1VVRkhhRVFzVDBGQlR5eFZRVUZWTEVOQlFVTXNUVUZCVFN4RFFVRkRMRlZCUVVNc1EwRkJReXhGUVVGRkxFTkJRVU03V1VGRE1VSXNUMEZCUVN4RFFVRkRMRU5CUVVNc1EwRkJReXhIUVVGSExGVkJRVlVzUTBGQlF5eE5RVUZOTEVkQlFVY3NRMEZCUXl4SlFVRkpMRlZCUVZVc1EwRkJReXhEUVVGRExFZEJRVWNzUTBGQlF5eERRVUZETEVOQlFVTXNTVUZCU1N4TFFVRkxMRTFCUVUwc1NVRkJTU3hEUVVGRExFTkJRVU1zU1VGQlNTeExRVUZMTEUxQlFVMDdiVUpCUXpsRkxFTkJRVU1zUjBGQlJ5eERRVUZETEVsQlFVa3NRMEZCUXl4RFFVRkRMRWxCUVVrc1MwRkJTeXhOUVVGTkxFbEJRVWtzVlVGQlZTeERRVUZETEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNc1EwRkJReXhKUVVGSkxFdEJRVXNzVFVGQlRTeERRVUZETzFGQlJIWkZMRU5CUTNWRkxFTkJRVU1zUTBGQlF6dEpRVU5xUml4RFFVRkRPMGxCUlUwc2RVSkJRVmtzUjBGQmJrSXNWVUZCYjBJc1MwRkJaMElzUlVGQlJTeFpRVUZ2UWl4RlFVRkZMRlZCUVd0Q0xFVkJRVVVzVjBGQmJVSTdVVUZETDBZc1NVRkJTU3hOUVVGTkxFZEJRVWM3V1VGRFZDeFRRVUZUTEVWQlFVVXNTVUZCU1N4SFFVRkhMRXRCUVVzc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRWRCUVVjc1IwRkJSeXhIUVVGSExFdEJRVXNzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFZEJRVWNzUjBGQlJ6dFpRVU16UkN4VFFVRlRMRVZCUVVVc1JVRkJSVHRUUVVOb1FpeERRVUZETzFGQlEwWXNTVUZCU1N4TFFVRkxMRU5CUVVNc1RVRkJUU3hIUVVGSExFTkJRVU1zUlVGQlJUdFpRVU5zUWl4TFFVRkxMRWxCUVVrc1EwRkJReXhIUVVGSExFTkJRVU1zUlVGQlJTeERRVUZETEVkQlFVY3NTMEZCU3l4RFFVRkRMRTFCUVUwc1JVRkJSU3hEUVVGRExFVkJRVVVzUlVGQlJUdG5Ra0ZEYmtNc1NVRkJTU3hGUVVGRkxFZEJRVWNzUzBGQlN5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRPMmRDUVVOc1FpeEpRVUZKTEVOQlFVTXNSMEZCUnl4RlFVRkZMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eEZRVUZGTEVOQlFVTXNSMEZCUnl4RlFVRkZMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETzJkQ1FVTTNRaXhKUVVGSkxFVkJRVVVzUjBGQlJ5eERRVUZETEVkQlFVY3NSVUZCUlN4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dG5Ra0ZEY2tJc1NVRkJTU3hGUVVGRkxFZEJRVWNzUTBGQlF5eEhRVUZITEVWQlFVVXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU03WjBKQlEzSkNMRWxCUVVrc1EwRkJReXhIUVVGSExFdEJRVXNzUTBGQlF5eE5RVUZOTEVkQlFVY3NRMEZCUXl4RlFVRkZPMjlDUVVOMFFpeEpRVUZKTEVsQlFVa3NRMEZCUXl4SFFVRkhMRU5CUVVNc1JVRkJSU3hEUVVGRExFZEJRVWNzUTBGQlF5eEZRVUZGTzNkQ1FVTnNRaXhEUVVGRExFbEJRVWtzUlVGQlJTeEhRVUZITEVsQlFVa3NRMEZCUXl4SFFVRkhMRU5CUVVNc1JVRkJSU3hEUVVGRExFZEJRVWNzV1VGQldTeERRVUZETzNGQ1FVTjZRenQ1UWtGQlRUdDNRa0ZEU0N4RFFVRkRMRWxCUVVrc1JVRkJSU3hIUVVGSExFbEJRVWtzUTBGQlF5eEhRVUZITEVOQlFVTXNSVUZCUlN4RFFVRkRMRWRCUVVjc1dVRkJXU3hEUVVGRE8zRkNRVU42UXp0dlFrRkRSQ3hOUVVGTkxFTkJRVU1zVTBGQlV5eEpRVUZKTEVsQlFVa3NSMEZCUnl4RFFVRkRMRWRCUVVjc1IwRkJSeXhIUVVGSExFTkJRVU1zUjBGQlJ5eEhRVUZITEVOQlFVTTdiMEpCUXpkRExFbEJRVWtzUTBGQlF5eEhRVUZITEV0QlFVc3NRMEZCUXl4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRExFTkJRVU03YjBKQlEzSkNMRWxCUVVrc1JVRkJSU3hIUVVGSExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRVZCUVVVc1JVRkJSU3hIUVVGSExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN2IwSkJRemRDTEVsQlFVa3NSVUZCUlN4SFFVRkhMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTTdiMEpCUTJoQ0xFbEJRVWtzUlVGQlJTeEhRVUZITEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU03YjBKQlEyaENMRVZCUVVVc1IwRkJSeXhGUVVGRkxFZEJRVWNzUlVGQlJTeERRVUZETzI5Q1FVTmlMRVZCUVVVc1IwRkJSeXhGUVVGRkxFZEJRVWNzUlVGQlJTeERRVUZETzI5Q1FVTmlMRWxCUVVrc1MwRkJTeXhIUVVGSExGVkJRVlVzUTBGQlF5eHJRa0ZCYTBJc1EwRkJReXhGUVVGRkxFVkJRVVVzUTBGQlF5eERRVUZETEVkQlFVY3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0dlFrRkZOMFFzU1VGQlNTeEZRVUZGTEVWQlFVVXNSVUZCUlN4RFFVRkRPMjlDUVVOWUxFbEJRVWtzU1VGQlNTeERRVUZETEVkQlFVY3NRMEZCUXl4RlFVRkZMRU5CUVVNc1IwRkJSeXhEUVVGRExFVkJRVVU3ZDBKQlEyeENMRVZCUVVVc1IwRkJSeXhGUVVGRkxFZEJRVWNzUlVGQlJTeEhRVUZITEVsQlFVa3NRMEZCUXl4SFFVRkhMRU5CUVVNc1JVRkJSU3hEUVVGRExFZEJRVWNzV1VGQldTeERRVUZETzNkQ1FVTXpReXhGUVVGRkxFZEJRVWNzUlVGQlJTeERRVUZETzNGQ1FVTllPM2xDUVVGTk8zZENRVU5JTEVWQlFVVXNSMEZCUnl4RlFVRkZMRU5CUVVNN2QwSkJRMUlzUlVGQlJTeEhRVUZITEVWQlFVVXNSMEZCUnl4RlFVRkZMRWRCUVVjc1NVRkJTU3hEUVVGRExFZEJRVWNzUTBGQlF5eEZRVUZGTEVOQlFVTXNSMEZCUnl4WlFVRlpMRU5CUVVNN2NVSkJRemxETzI5Q1FVTkVMRWxCUVVrc1JVRkJSU3hIUVVGSExFbEJRVWtzUTBGQlF5eEhRVUZITEVOQlFVTXNSVUZCUlN4SFFVRkhMRU5CUVVNc1EwRkJReXhEUVVGRE8yOUNRVU14UWl4SlFVRkpMRVZCUVVVc1IwRkJSeXhKUVVGSkxFTkJRVU1zUjBGQlJ5eERRVUZETEVWQlFVVXNSMEZCUnl4RFFVRkRMRU5CUVVNc1EwRkJRenR2UWtGRE1VSXNUVUZCVFN4RFFVRkRMRk5CUVZNc1NVRkJTU3hKUVVGSkxFZEJRVWNzUlVGQlJTeEhRVUZITEVkQlFVY3NSMEZCUnl4RlFVRkZMRWRCUVVjc1QwRkJUeXhIUVVGSExFdEJRVXNzUjBGQlJ5eEhRVUZITEVkQlFVY3NSVUZCUlN4SFFVRkhMRWRCUVVjc1IwRkJSeXhGUVVGRkxFZEJRVWNzUjBGQlJ5eERRVUZETzJsQ1FVTXhSanR4UWtGQlRUdHZRa0ZEU0N4SlFVRkpMRkZCUVZFc1IwRkJSeXhEUVVGRExFTkJRVU1zUlVGQlJTeERRVUZETEVOQlFVTXNRMEZCUXp0dlFrRkRkRUlzU1VGQlNTeFpRVUZaTEVWQlFVVXNXVUZCV1N4RFFVRkRPMjlDUVVNdlFpeEpRVUZKTEVsQlFVa3NRMEZCUXl4SFFVRkhMRU5CUVVNc1JVRkJSU3hEUVVGRExFZEJRVWNzUTBGQlF5eEZRVUZGTzNkQ1FVTnNRaXhEUVVGRExFbEJRVWtzUlVGQlJTeEhRVUZITEVsQlFVa3NRMEZCUXl4SFFVRkhMRU5CUVVNc1JVRkJSU3hEUVVGRExFZEJRVWNzVjBGQlZ5eERRVUZETzNkQ1FVTnlReXhaUVVGWkxFZEJRVWNzUTBGQlF5eERRVUZETEVWQlFVVXNRMEZCUXl4SFFVRkhMRlZCUVZVc1EwRkJReXhEUVVGRE8zZENRVU51UXl4WlFVRlpMRWRCUVVjc1EwRkJReXhEUVVGRExFVkJRVVVzUTBGQlF5eEhRVUZITEZWQlFWVXNRMEZCUXl4RFFVRkRPM0ZDUVVOMFF6dDVRa0ZCVFR0M1FrRkRTQ3hEUVVGRExFbEJRVWtzUlVGQlJTeEhRVUZITEVsQlFVa3NRMEZCUXl4SFFVRkhMRU5CUVVNc1JVRkJSU3hEUVVGRExFZEJRVWNzVjBGQlZ5eERRVUZETzNkQ1FVTnlReXhaUVVGWkxFZEJRVWNzUTBGQlF5eERRVUZETEVkQlFVY3NWVUZCVlN4RlFVRkZMRU5CUVVNc1EwRkJReXhEUVVGRE8zZENRVU51UXl4WlFVRlpMRWRCUVVjc1EwRkJReXhEUVVGRExFZEJRVWNzVlVGQlZTeEZRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRPM0ZDUVVOMFF6dHZRa0ZEUkN4TlFVRk5MRU5CUVVNc1UwRkJVeXhKUVVGSkxFbEJRVWtzUjBGQlJ5eERRVUZETEVkQlFVY3NSMEZCUnl4SFFVRkhMRU5CUVVNc1IwRkJSeXhIUVVGSExFTkJRVU03YjBKQlF6ZERMRWxCUVVrc1YwRkJWeXhIUVVGSExFTkJRVU1zUlVGQlJUdDNRa0ZEYWtJc1RVRkJUU3hEUVVGRExGTkJRVk1zUjBGQlJ5eEpRVUZKTEVkQlFVY3NVVUZCVVN4RFFVRkRMRU5CUVVNc1EwRkJReXhIUVVGSExFZEJRVWNzUjBGQlJ5eFJRVUZSTEVOQlFVTXNRMEZCUXl4RFFVRkRMRWRCUVVjc1MwRkJTeXhIUVVGSExGbEJRVmtzUTBGQlF5eERRVUZETEVOQlFVTXNSMEZCUnl4SFFVRkhMRWRCUVVjc1dVRkJXU3hEUVVGRExFTkJRVU1zUTBGQlF6czRRa0ZEZWtjc1MwRkJTeXhIUVVGSExGbEJRVmtzUTBGQlF5eERRVUZETEVOQlFVTXNSMEZCUnl4SFFVRkhMRWRCUVVjc1dVRkJXU3hEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETzNGQ1FVTnlSRHRwUWtGRFNqdGhRVU5LTzFOQlEwbzdZVUZCVFR0WlFVTklMRWxCUVVrc1JVRkJSU3hIUVVGSExFdEJRVXNzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0WlFVTnNRaXhKUVVGSkxFTkJRVU1zUjBGQlJ5eEZRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhGUVVGRkxFTkJRVU1zUjBGQlJ5eEZRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRE8xbEJRemRDTEVsQlFVa3NSVUZCUlN4SFFVRkhMRU5CUVVNc1IwRkJSeXhGUVVGRkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRPMWxCUTNKQ0xFbEJRVWtzUlVGQlJTeEhRVUZITEVOQlFVTXNSMEZCUnl4RlFVRkZMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETzFsQlEzSkNMRWxCUVVrc1VVRkJVU3hIUVVGSExFTkJRVU1zUTBGQlF5eEZRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRPMWxCUTNSQ0xFbEJRVWtzV1VGQldTeEZRVUZGTEZsQlFWa3NRMEZCUXp0WlFVTXZRaXhKUVVGSkxFbEJRVWtzUTBGQlF5eEhRVUZITEVOQlFVTXNSVUZCUlN4RFFVRkRMRWRCUVVjc1EwRkJReXhGUVVGRk8yZENRVU5zUWl4RFFVRkRMRWxCUVVrc1JVRkJSU3hIUVVGSExFbEJRVWtzUTBGQlF5eEhRVUZITEVOQlFVTXNSVUZCUlN4RFFVRkRMRWRCUVVjc1YwRkJWeXhEUVVGRE8yZENRVU55UXl4WlFVRlpMRWRCUVVjc1EwRkJReXhEUVVGRExFVkJRVVVzUTBGQlF5eEhRVUZITEZWQlFWVXNRMEZCUXl4RFFVRkRPMmRDUVVOdVF5eFpRVUZaTEVkQlFVY3NRMEZCUXl4RFFVRkRMRVZCUVVVc1EwRkJReXhIUVVGSExGVkJRVlVzUTBGQlF5eERRVUZETzJGQlEzUkRPMmxDUVVGTk8yZENRVU5JTEVOQlFVTXNTVUZCU1N4RlFVRkZMRWRCUVVjc1NVRkJTU3hEUVVGRExFZEJRVWNzUTBGQlF5eEZRVUZGTEVOQlFVTXNSMEZCUnl4WFFVRlhMRU5CUVVNN1owSkJRM0pETEZsQlFWa3NSMEZCUnl4RFFVRkRMRU5CUVVNc1IwRkJSeXhWUVVGVkxFVkJRVVVzUTBGQlF5eERRVUZETEVOQlFVTTdaMEpCUTI1RExGbEJRVmtzUjBGQlJ5eERRVUZETEVOQlFVTXNSMEZCUnl4VlFVRlZMRVZCUVVVc1EwRkJReXhEUVVGRExFTkJRVU03WVVGRGRFTTdXVUZEUkN4TlFVRk5MRU5CUVVNc1UwRkJVeXhKUVVGSkxFbEJRVWtzUjBGQlJ5eERRVUZETEVkQlFVY3NSMEZCUnl4SFFVRkhMRU5CUVVNc1IwRkJSeXhIUVVGSExFTkJRVU03V1VGRE4wTXNTVUZCU1N4WFFVRlhMRWRCUVVjc1EwRkJReXhGUVVGRk8yZENRVU5xUWl4TlFVRk5MRU5CUVVNc1UwRkJVeXhIUVVGSExFbEJRVWtzUjBGQlJ5eFJRVUZSTEVOQlFVTXNRMEZCUXl4RFFVRkRMRWRCUVVjc1IwRkJSeXhIUVVGSExGRkJRVkVzUTBGQlF5eERRVUZETEVOQlFVTXNSMEZCUnl4TFFVRkxMRWRCUVVjc1dVRkJXU3hEUVVGRExFTkJRVU1zUTBGQlF5eEhRVUZITEVkQlFVY3NSMEZCUnl4WlFVRlpMRU5CUVVNc1EwRkJReXhEUVVGRE8zTkNRVU42Unl4TFFVRkxMRWRCUVVjc1dVRkJXU3hEUVVGRExFTkJRVU1zUTBGQlF5eEhRVUZITEVkQlFVY3NSMEZCUnl4WlFVRlpMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU03WVVGRGNrUTdVMEZEU2p0UlFVTkVMRTlCUVU4c1RVRkJUU3hEUVVGRE8wbEJRMnhDTEVOQlFVTTdTVUZEVEN4cFFrRkJRenRCUVVGRUxFTkJRVU1zUVVGNmJFSkVMRWxCZVd4Q1F6dEJRWHBzUWxrc1owTkJRVlVpZlE9PSIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIHBhY2tpbmdPcHRpb25zID0ge1xuICAgIFBBRERJTkc6IDEwLFxuICAgIEdPTERFTl9TRUNUSU9OOiAoMSArIE1hdGguc3FydCg1KSkgLyAyLFxuICAgIEZMT0FUX0VQU0lMT046IDAuMDAwMSxcbiAgICBNQVhfSU5FUkFUSU9OUzogMTAwXG59O1xuZnVuY3Rpb24gYXBwbHlQYWNraW5nKGdyYXBocywgdywgaCwgbm9kZV9zaXplLCBkZXNpcmVkX3JhdGlvLCBjZW50ZXJHcmFwaCkge1xuICAgIGlmIChkZXNpcmVkX3JhdGlvID09PSB2b2lkIDApIHsgZGVzaXJlZF9yYXRpbyA9IDE7IH1cbiAgICBpZiAoY2VudGVyR3JhcGggPT09IHZvaWQgMCkgeyBjZW50ZXJHcmFwaCA9IHRydWU7IH1cbiAgICB2YXIgaW5pdF94ID0gMCwgaW5pdF95ID0gMCwgc3ZnX3dpZHRoID0gdywgc3ZnX2hlaWdodCA9IGgsIGRlc2lyZWRfcmF0aW8gPSB0eXBlb2YgZGVzaXJlZF9yYXRpbyAhPT0gJ3VuZGVmaW5lZCcgPyBkZXNpcmVkX3JhdGlvIDogMSwgbm9kZV9zaXplID0gdHlwZW9mIG5vZGVfc2l6ZSAhPT0gJ3VuZGVmaW5lZCcgPyBub2RlX3NpemUgOiAwLCByZWFsX3dpZHRoID0gMCwgcmVhbF9oZWlnaHQgPSAwLCBtaW5fd2lkdGggPSAwLCBnbG9iYWxfYm90dG9tID0gMCwgbGluZSA9IFtdO1xuICAgIGlmIChncmFwaHMubGVuZ3RoID09IDApXG4gICAgICAgIHJldHVybjtcbiAgICBjYWxjdWxhdGVfYmIoZ3JhcGhzKTtcbiAgICBhcHBseShncmFwaHMsIGRlc2lyZWRfcmF0aW8pO1xuICAgIGlmIChjZW50ZXJHcmFwaCkge1xuICAgICAgICBwdXRfbm9kZXNfdG9fcmlnaHRfcG9zaXRpb25zKGdyYXBocyk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGNhbGN1bGF0ZV9iYihncmFwaHMpIHtcbiAgICAgICAgZ3JhcGhzLmZvckVhY2goZnVuY3Rpb24gKGcpIHtcbiAgICAgICAgICAgIGNhbGN1bGF0ZV9zaW5nbGVfYmIoZyk7XG4gICAgICAgIH0pO1xuICAgICAgICBmdW5jdGlvbiBjYWxjdWxhdGVfc2luZ2xlX2JiKGdyYXBoKSB7XG4gICAgICAgICAgICB2YXIgbWluX3ggPSBOdW1iZXIuTUFYX1ZBTFVFLCBtaW5feSA9IE51bWJlci5NQVhfVkFMVUUsIG1heF94ID0gMCwgbWF4X3kgPSAwO1xuICAgICAgICAgICAgZ3JhcGguYXJyYXkuZm9yRWFjaChmdW5jdGlvbiAodikge1xuICAgICAgICAgICAgICAgIHZhciB3ID0gdHlwZW9mIHYud2lkdGggIT09ICd1bmRlZmluZWQnID8gdi53aWR0aCA6IG5vZGVfc2l6ZTtcbiAgICAgICAgICAgICAgICB2YXIgaCA9IHR5cGVvZiB2LmhlaWdodCAhPT0gJ3VuZGVmaW5lZCcgPyB2LmhlaWdodCA6IG5vZGVfc2l6ZTtcbiAgICAgICAgICAgICAgICB3IC89IDI7XG4gICAgICAgICAgICAgICAgaCAvPSAyO1xuICAgICAgICAgICAgICAgIG1heF94ID0gTWF0aC5tYXgodi54ICsgdywgbWF4X3gpO1xuICAgICAgICAgICAgICAgIG1pbl94ID0gTWF0aC5taW4odi54IC0gdywgbWluX3gpO1xuICAgICAgICAgICAgICAgIG1heF95ID0gTWF0aC5tYXgodi55ICsgaCwgbWF4X3kpO1xuICAgICAgICAgICAgICAgIG1pbl95ID0gTWF0aC5taW4odi55IC0gaCwgbWluX3kpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBncmFwaC53aWR0aCA9IG1heF94IC0gbWluX3g7XG4gICAgICAgICAgICBncmFwaC5oZWlnaHQgPSBtYXhfeSAtIG1pbl95O1xuICAgICAgICB9XG4gICAgfVxuICAgIGZ1bmN0aW9uIHB1dF9ub2Rlc190b19yaWdodF9wb3NpdGlvbnMoZ3JhcGhzKSB7XG4gICAgICAgIGdyYXBocy5mb3JFYWNoKGZ1bmN0aW9uIChnKSB7XG4gICAgICAgICAgICB2YXIgY2VudGVyID0geyB4OiAwLCB5OiAwIH07XG4gICAgICAgICAgICBnLmFycmF5LmZvckVhY2goZnVuY3Rpb24gKG5vZGUpIHtcbiAgICAgICAgICAgICAgICBjZW50ZXIueCArPSBub2RlLng7XG4gICAgICAgICAgICAgICAgY2VudGVyLnkgKz0gbm9kZS55O1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBjZW50ZXIueCAvPSBnLmFycmF5Lmxlbmd0aDtcbiAgICAgICAgICAgIGNlbnRlci55IC89IGcuYXJyYXkubGVuZ3RoO1xuICAgICAgICAgICAgdmFyIGNvcm5lciA9IHsgeDogY2VudGVyLnggLSBnLndpZHRoIC8gMiwgeTogY2VudGVyLnkgLSBnLmhlaWdodCAvIDIgfTtcbiAgICAgICAgICAgIHZhciBvZmZzZXQgPSB7IHg6IGcueCAtIGNvcm5lci54ICsgc3ZnX3dpZHRoIC8gMiAtIHJlYWxfd2lkdGggLyAyLCB5OiBnLnkgLSBjb3JuZXIueSArIHN2Z19oZWlnaHQgLyAyIC0gcmVhbF9oZWlnaHQgLyAyIH07XG4gICAgICAgICAgICBnLmFycmF5LmZvckVhY2goZnVuY3Rpb24gKG5vZGUpIHtcbiAgICAgICAgICAgICAgICBub2RlLnggKz0gb2Zmc2V0Lng7XG4gICAgICAgICAgICAgICAgbm9kZS55ICs9IG9mZnNldC55O1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBmdW5jdGlvbiBhcHBseShkYXRhLCBkZXNpcmVkX3JhdGlvKSB7XG4gICAgICAgIHZhciBjdXJyX2Jlc3RfZiA9IE51bWJlci5QT1NJVElWRV9JTkZJTklUWTtcbiAgICAgICAgdmFyIGN1cnJfYmVzdCA9IDA7XG4gICAgICAgIGRhdGEuc29ydChmdW5jdGlvbiAoYSwgYikgeyByZXR1cm4gYi5oZWlnaHQgLSBhLmhlaWdodDsgfSk7XG4gICAgICAgIG1pbl93aWR0aCA9IGRhdGEucmVkdWNlKGZ1bmN0aW9uIChhLCBiKSB7XG4gICAgICAgICAgICByZXR1cm4gYS53aWR0aCA8IGIud2lkdGggPyBhLndpZHRoIDogYi53aWR0aDtcbiAgICAgICAgfSk7XG4gICAgICAgIHZhciBsZWZ0ID0geDEgPSBtaW5fd2lkdGg7XG4gICAgICAgIHZhciByaWdodCA9IHgyID0gZ2V0X2VudGlyZV93aWR0aChkYXRhKTtcbiAgICAgICAgdmFyIGl0ZXJhdGlvbkNvdW50ZXIgPSAwO1xuICAgICAgICB2YXIgZl94MSA9IE51bWJlci5NQVhfVkFMVUU7XG4gICAgICAgIHZhciBmX3gyID0gTnVtYmVyLk1BWF9WQUxVRTtcbiAgICAgICAgdmFyIGZsYWcgPSAtMTtcbiAgICAgICAgdmFyIGR4ID0gTnVtYmVyLk1BWF9WQUxVRTtcbiAgICAgICAgdmFyIGRmID0gTnVtYmVyLk1BWF9WQUxVRTtcbiAgICAgICAgd2hpbGUgKChkeCA+IG1pbl93aWR0aCkgfHwgZGYgPiBwYWNraW5nT3B0aW9ucy5GTE9BVF9FUFNJTE9OKSB7XG4gICAgICAgICAgICBpZiAoZmxhZyAhPSAxKSB7XG4gICAgICAgICAgICAgICAgdmFyIHgxID0gcmlnaHQgLSAocmlnaHQgLSBsZWZ0KSAvIHBhY2tpbmdPcHRpb25zLkdPTERFTl9TRUNUSU9OO1xuICAgICAgICAgICAgICAgIHZhciBmX3gxID0gc3RlcChkYXRhLCB4MSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZmxhZyAhPSAwKSB7XG4gICAgICAgICAgICAgICAgdmFyIHgyID0gbGVmdCArIChyaWdodCAtIGxlZnQpIC8gcGFja2luZ09wdGlvbnMuR09MREVOX1NFQ1RJT047XG4gICAgICAgICAgICAgICAgdmFyIGZfeDIgPSBzdGVwKGRhdGEsIHgyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGR4ID0gTWF0aC5hYnMoeDEgLSB4Mik7XG4gICAgICAgICAgICBkZiA9IE1hdGguYWJzKGZfeDEgLSBmX3gyKTtcbiAgICAgICAgICAgIGlmIChmX3gxIDwgY3Vycl9iZXN0X2YpIHtcbiAgICAgICAgICAgICAgICBjdXJyX2Jlc3RfZiA9IGZfeDE7XG4gICAgICAgICAgICAgICAgY3Vycl9iZXN0ID0geDE7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZl94MiA8IGN1cnJfYmVzdF9mKSB7XG4gICAgICAgICAgICAgICAgY3Vycl9iZXN0X2YgPSBmX3gyO1xuICAgICAgICAgICAgICAgIGN1cnJfYmVzdCA9IHgyO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGZfeDEgPiBmX3gyKSB7XG4gICAgICAgICAgICAgICAgbGVmdCA9IHgxO1xuICAgICAgICAgICAgICAgIHgxID0geDI7XG4gICAgICAgICAgICAgICAgZl94MSA9IGZfeDI7XG4gICAgICAgICAgICAgICAgZmxhZyA9IDE7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICByaWdodCA9IHgyO1xuICAgICAgICAgICAgICAgIHgyID0geDE7XG4gICAgICAgICAgICAgICAgZl94MiA9IGZfeDE7XG4gICAgICAgICAgICAgICAgZmxhZyA9IDA7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoaXRlcmF0aW9uQ291bnRlcisrID4gMTAwKSB7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgc3RlcChkYXRhLCBjdXJyX2Jlc3QpO1xuICAgIH1cbiAgICBmdW5jdGlvbiBzdGVwKGRhdGEsIG1heF93aWR0aCkge1xuICAgICAgICBsaW5lID0gW107XG4gICAgICAgIHJlYWxfd2lkdGggPSAwO1xuICAgICAgICByZWFsX2hlaWdodCA9IDA7XG4gICAgICAgIGdsb2JhbF9ib3R0b20gPSBpbml0X3k7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZGF0YS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyIG8gPSBkYXRhW2ldO1xuICAgICAgICAgICAgcHV0X3JlY3QobywgbWF4X3dpZHRoKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gTWF0aC5hYnMoZ2V0X3JlYWxfcmF0aW8oKSAtIGRlc2lyZWRfcmF0aW8pO1xuICAgIH1cbiAgICBmdW5jdGlvbiBwdXRfcmVjdChyZWN0LCBtYXhfd2lkdGgpIHtcbiAgICAgICAgdmFyIHBhcmVudCA9IHVuZGVmaW5lZDtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsaW5lLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBpZiAoKGxpbmVbaV0uc3BhY2VfbGVmdCA+PSByZWN0LmhlaWdodCkgJiYgKGxpbmVbaV0ueCArIGxpbmVbaV0ud2lkdGggKyByZWN0LndpZHRoICsgcGFja2luZ09wdGlvbnMuUEFERElORyAtIG1heF93aWR0aCkgPD0gcGFja2luZ09wdGlvbnMuRkxPQVRfRVBTSUxPTikge1xuICAgICAgICAgICAgICAgIHBhcmVudCA9IGxpbmVbaV07XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgbGluZS5wdXNoKHJlY3QpO1xuICAgICAgICBpZiAocGFyZW50ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHJlY3QueCA9IHBhcmVudC54ICsgcGFyZW50LndpZHRoICsgcGFja2luZ09wdGlvbnMuUEFERElORztcbiAgICAgICAgICAgIHJlY3QueSA9IHBhcmVudC5ib3R0b207XG4gICAgICAgICAgICByZWN0LnNwYWNlX2xlZnQgPSByZWN0LmhlaWdodDtcbiAgICAgICAgICAgIHJlY3QuYm90dG9tID0gcmVjdC55O1xuICAgICAgICAgICAgcGFyZW50LnNwYWNlX2xlZnQgLT0gcmVjdC5oZWlnaHQgKyBwYWNraW5nT3B0aW9ucy5QQURESU5HO1xuICAgICAgICAgICAgcGFyZW50LmJvdHRvbSArPSByZWN0LmhlaWdodCArIHBhY2tpbmdPcHRpb25zLlBBRERJTkc7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICByZWN0LnkgPSBnbG9iYWxfYm90dG9tO1xuICAgICAgICAgICAgZ2xvYmFsX2JvdHRvbSArPSByZWN0LmhlaWdodCArIHBhY2tpbmdPcHRpb25zLlBBRERJTkc7XG4gICAgICAgICAgICByZWN0LnggPSBpbml0X3g7XG4gICAgICAgICAgICByZWN0LmJvdHRvbSA9IHJlY3QueTtcbiAgICAgICAgICAgIHJlY3Quc3BhY2VfbGVmdCA9IHJlY3QuaGVpZ2h0O1xuICAgICAgICB9XG4gICAgICAgIGlmIChyZWN0LnkgKyByZWN0LmhlaWdodCAtIHJlYWxfaGVpZ2h0ID4gLXBhY2tpbmdPcHRpb25zLkZMT0FUX0VQU0lMT04pXG4gICAgICAgICAgICByZWFsX2hlaWdodCA9IHJlY3QueSArIHJlY3QuaGVpZ2h0IC0gaW5pdF95O1xuICAgICAgICBpZiAocmVjdC54ICsgcmVjdC53aWR0aCAtIHJlYWxfd2lkdGggPiAtcGFja2luZ09wdGlvbnMuRkxPQVRfRVBTSUxPTilcbiAgICAgICAgICAgIHJlYWxfd2lkdGggPSByZWN0LnggKyByZWN0LndpZHRoIC0gaW5pdF94O1xuICAgIH1cbiAgICA7XG4gICAgZnVuY3Rpb24gZ2V0X2VudGlyZV93aWR0aChkYXRhKSB7XG4gICAgICAgIHZhciB3aWR0aCA9IDA7XG4gICAgICAgIGRhdGEuZm9yRWFjaChmdW5jdGlvbiAoZCkgeyByZXR1cm4gd2lkdGggKz0gZC53aWR0aCArIHBhY2tpbmdPcHRpb25zLlBBRERJTkc7IH0pO1xuICAgICAgICByZXR1cm4gd2lkdGg7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGdldF9yZWFsX3JhdGlvKCkge1xuICAgICAgICByZXR1cm4gKHJlYWxfd2lkdGggLyByZWFsX2hlaWdodCk7XG4gICAgfVxufVxuZXhwb3J0cy5hcHBseVBhY2tpbmcgPSBhcHBseVBhY2tpbmc7XG5mdW5jdGlvbiBzZXBhcmF0ZUdyYXBocyhub2RlcywgbGlua3MpIHtcbiAgICB2YXIgbWFya3MgPSB7fTtcbiAgICB2YXIgd2F5cyA9IHt9O1xuICAgIHZhciBncmFwaHMgPSBbXTtcbiAgICB2YXIgY2x1c3RlcnMgPSAwO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGlua3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIGxpbmsgPSBsaW5rc1tpXTtcbiAgICAgICAgdmFyIG4xID0gbGluay5zb3VyY2U7XG4gICAgICAgIHZhciBuMiA9IGxpbmsudGFyZ2V0O1xuICAgICAgICBpZiAod2F5c1tuMS5pbmRleF0pXG4gICAgICAgICAgICB3YXlzW24xLmluZGV4XS5wdXNoKG4yKTtcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgd2F5c1tuMS5pbmRleF0gPSBbbjJdO1xuICAgICAgICBpZiAod2F5c1tuMi5pbmRleF0pXG4gICAgICAgICAgICB3YXlzW24yLmluZGV4XS5wdXNoKG4xKTtcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgd2F5c1tuMi5pbmRleF0gPSBbbjFdO1xuICAgIH1cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IG5vZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciBub2RlID0gbm9kZXNbaV07XG4gICAgICAgIGlmIChtYXJrc1tub2RlLmluZGV4XSlcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICBleHBsb3JlX25vZGUobm9kZSwgdHJ1ZSk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGV4cGxvcmVfbm9kZShuLCBpc19uZXcpIHtcbiAgICAgICAgaWYgKG1hcmtzW24uaW5kZXhdICE9PSB1bmRlZmluZWQpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIGlmIChpc19uZXcpIHtcbiAgICAgICAgICAgIGNsdXN0ZXJzKys7XG4gICAgICAgICAgICBncmFwaHMucHVzaCh7IGFycmF5OiBbXSB9KTtcbiAgICAgICAgfVxuICAgICAgICBtYXJrc1tuLmluZGV4XSA9IGNsdXN0ZXJzO1xuICAgICAgICBncmFwaHNbY2x1c3RlcnMgLSAxXS5hcnJheS5wdXNoKG4pO1xuICAgICAgICB2YXIgYWRqYWNlbnQgPSB3YXlzW24uaW5kZXhdO1xuICAgICAgICBpZiAoIWFkamFjZW50KVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IGFkamFjZW50Lmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICBleHBsb3JlX25vZGUoYWRqYWNlbnRbal0sIGZhbHNlKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZ3JhcGhzO1xufVxuZXhwb3J0cy5zZXBhcmF0ZUdyYXBocyA9IHNlcGFyYXRlR3JhcGhzO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9ZGF0YTphcHBsaWNhdGlvbi9qc29uO2Jhc2U2NCxleUoyWlhKemFXOXVJam96TENKbWFXeGxJam9pYUdGdVpHeGxaR2x6WTI5dWJtVmpkR1ZrTG1weklpd2ljMjkxY21ObFVtOXZkQ0k2SWlJc0luTnZkWEpqWlhNaU9sc2lMaTR2TGk0dlYyVmlRMjlzWVM5emNtTXZhR0Z1Wkd4bFpHbHpZMjl1Ym1WamRHVmtMblJ6SWwwc0ltNWhiV1Z6SWpwYlhTd2liV0Z3Y0dsdVozTWlPaUk3TzBGQlFVa3NTVUZCU1N4alFVRmpMRWRCUVVjN1NVRkRha0lzVDBGQlR5eEZRVUZGTEVWQlFVVTdTVUZEV0N4alFVRmpMRVZCUVVVc1EwRkJReXhEUVVGRExFZEJRVWNzU1VGQlNTeERRVUZETEVsQlFVa3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhIUVVGSExFTkJRVU03U1VGRGRFTXNZVUZCWVN4RlFVRkZMRTFCUVUwN1NVRkRja0lzWTBGQll5eEZRVUZGTEVkQlFVYzdRMEZEZEVJc1EwRkJRenRCUVVkR0xGTkJRV2RDTEZsQlFWa3NRMEZCUXl4TlFVRnBRaXhGUVVGRkxFTkJRVU1zUlVGQlJTeERRVUZETEVWQlFVVXNVMEZCVXl4RlFVRkZMR0ZCUVdsQ0xFVkJRVVVzVjBGQmEwSTdTVUZCY2tNc09FSkJRVUVzUlVGQlFTeHBRa0ZCYVVJN1NVRkJSU3cwUWtGQlFTeEZRVUZCTEd0Q1FVRnJRanRKUVVWc1J5eEpRVUZKTEUxQlFVMHNSMEZCUnl4RFFVRkRMRVZCUTFZc1RVRkJUU3hIUVVGSExFTkJRVU1zUlVGRlZpeFRRVUZUTEVkQlFVY3NRMEZCUXl4RlFVTmlMRlZCUVZVc1IwRkJSeXhEUVVGRExFVkJSV1FzWVVGQllTeEhRVUZITEU5QlFVOHNZVUZCWVN4TFFVRkxMRmRCUVZjc1EwRkJReXhEUVVGRExFTkJRVU1zWVVGQllTeERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRVZCUTNoRkxGTkJRVk1zUjBGQlJ5eFBRVUZQTEZOQlFWTXNTMEZCU3l4WFFVRlhMRU5CUVVNc1EwRkJReXhEUVVGRExGTkJRVk1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RlFVVTFSQ3hWUVVGVkxFZEJRVWNzUTBGQlF5eEZRVU5rTEZkQlFWY3NSMEZCUnl4RFFVRkRMRVZCUTJZc1UwRkJVeXhIUVVGSExFTkJRVU1zUlVGRllpeGhRVUZoTEVkQlFVY3NRMEZCUXl4RlFVTnFRaXhKUVVGSkxFZEJRVWNzUlVGQlJTeERRVUZETzBsQlJXUXNTVUZCU1N4TlFVRk5MRU5CUVVNc1RVRkJUU3hKUVVGSkxFTkJRVU03VVVGRGJFSXNUMEZCVHp0SlFWVllMRmxCUVZrc1EwRkJReXhOUVVGTkxFTkJRVU1zUTBGQlF6dEpRVU55UWl4TFFVRkxMRU5CUVVNc1RVRkJUU3hGUVVGRkxHRkJRV0VzUTBGQlF5eERRVUZETzBsQlF6ZENMRWxCUVVjc1YwRkJWeXhGUVVGRk8xRkJRMW9zTkVKQlFUUkNMRU5CUVVNc1RVRkJUU3hEUVVGRExFTkJRVU03UzBGRGVFTTdTVUZIUkN4VFFVRlRMRmxCUVZrc1EwRkJReXhOUVVGTk8xRkJSWGhDTEUxQlFVMHNRMEZCUXl4UFFVRlBMRU5CUVVNc1ZVRkJWU3hEUVVGRE8xbEJRM1JDTEcxQ1FVRnRRaXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZCTzFGQlF6RkNMRU5CUVVNc1EwRkJReXhEUVVGRE8xRkJSVWdzVTBGQlV5eHRRa0ZCYlVJc1EwRkJReXhMUVVGTE8xbEJRemxDTEVsQlFVa3NTMEZCU3l4SFFVRkhMRTFCUVUwc1EwRkJReXhUUVVGVExFVkJRVVVzUzBGQlN5eEhRVUZITEUxQlFVMHNRMEZCUXl4VFFVRlRMRVZCUTJ4RUxFdEJRVXNzUjBGQlJ5eERRVUZETEVWQlFVVXNTMEZCU3l4SFFVRkhMRU5CUVVNc1EwRkJRenRaUVVWNlFpeExRVUZMTEVOQlFVTXNTMEZCU3l4RFFVRkRMRTlCUVU4c1EwRkJReXhWUVVGVkxFTkJRVU03WjBKQlF6TkNMRWxCUVVrc1EwRkJReXhIUVVGSExFOUJRVThzUTBGQlF5eERRVUZETEV0QlFVc3NTMEZCU3l4WFFVRlhMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eExRVUZMTEVOQlFVTXNRMEZCUXl4RFFVRkRMRk5CUVZNc1EwRkJRenRuUWtGRE4wUXNTVUZCU1N4RFFVRkRMRWRCUVVjc1QwRkJUeXhEUVVGRExFTkJRVU1zVFVGQlRTeExRVUZMTEZkQlFWY3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFMUJRVTBzUTBGQlF5eERRVUZETEVOQlFVTXNVMEZCVXl4RFFVRkRPMmRDUVVNdlJDeERRVUZETEVsQlFVa3NRMEZCUXl4RFFVRkRPMmRDUVVOUUxFTkJRVU1zU1VGQlNTeERRVUZETEVOQlFVTTdaMEpCUTFBc1MwRkJTeXhIUVVGSExFbEJRVWtzUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1IwRkJSeXhEUVVGRExFVkJRVVVzUzBGQlN5eERRVUZETEVOQlFVTTdaMEpCUTJwRExFdEJRVXNzUjBGQlJ5eEpRVUZKTEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFZEJRVWNzUTBGQlF5eEZRVUZGTEV0QlFVc3NRMEZCUXl4RFFVRkRPMmRDUVVOcVF5eExRVUZMTEVkQlFVY3NTVUZCU1N4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eEhRVUZITEVOQlFVTXNSVUZCUlN4TFFVRkxMRU5CUVVNc1EwRkJRenRuUWtGRGFrTXNTMEZCU3l4SFFVRkhMRWxCUVVrc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNSMEZCUnl4RFFVRkRMRVZCUVVVc1MwRkJTeXhEUVVGRExFTkJRVU03V1VGRGNrTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1dVRkZTQ3hMUVVGTExFTkJRVU1zUzBGQlN5eEhRVUZITEV0QlFVc3NSMEZCUnl4TFFVRkxMRU5CUVVNN1dVRkROVUlzUzBGQlN5eERRVUZETEUxQlFVMHNSMEZCUnl4TFFVRkxMRWRCUVVjc1MwRkJTeXhEUVVGRE8xRkJRMnBETEVOQlFVTTdTVUZEVEN4RFFVRkRPMGxCZFVORUxGTkJRVk1zTkVKQlFUUkNMRU5CUVVNc1RVRkJUVHRSUVVONFF5eE5RVUZOTEVOQlFVTXNUMEZCVHl4RFFVRkRMRlZCUVZVc1EwRkJRenRaUVVWMFFpeEpRVUZKTEUxQlFVMHNSMEZCUnl4RlFVRkZMRU5CUVVNc1JVRkJSU3hEUVVGRExFVkJRVVVzUTBGQlF5eEZRVUZGTEVOQlFVTXNSVUZCUlN4RFFVRkRPMWxCUlRWQ0xFTkJRVU1zUTBGQlF5eExRVUZMTEVOQlFVTXNUMEZCVHl4RFFVRkRMRlZCUVZVc1NVRkJTVHRuUWtGRE1VSXNUVUZCVFN4RFFVRkRMRU5CUVVNc1NVRkJTU3hKUVVGSkxFTkJRVU1zUTBGQlF5eERRVUZETzJkQ1FVTnVRaXhOUVVGTkxFTkJRVU1zUTBGQlF5eEpRVUZKTEVsQlFVa3NRMEZCUXl4RFFVRkRMRU5CUVVNN1dVRkRka0lzUTBGQlF5eERRVUZETEVOQlFVTTdXVUZGU0N4TlFVRk5MRU5CUVVNc1EwRkJReXhKUVVGSkxFTkJRVU1zUTBGQlF5eExRVUZMTEVOQlFVTXNUVUZCVFN4RFFVRkRPMWxCUXpOQ0xFMUJRVTBzUTBGQlF5eERRVUZETEVsQlFVa3NRMEZCUXl4RFFVRkRMRXRCUVVzc1EwRkJReXhOUVVGTkxFTkJRVU03V1VGSE0wSXNTVUZCU1N4TlFVRk5MRWRCUVVjc1JVRkJSU3hEUVVGRExFVkJRVVVzVFVGQlRTeERRVUZETEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNc1MwRkJTeXhIUVVGSExFTkJRVU1zUlVGQlJTeERRVUZETEVWQlFVVXNUVUZCVFN4RFFVRkRMRU5CUVVNc1IwRkJSeXhEUVVGRExFTkJRVU1zVFVGQlRTeEhRVUZITEVOQlFVTXNSVUZCUlN4RFFVRkRPMWxCUTNaRkxFbEJRVWtzVFVGQlRTeEhRVUZITEVWQlFVVXNRMEZCUXl4RlFVRkZMRU5CUVVNc1EwRkJReXhEUVVGRExFZEJRVWNzVFVGQlRTeERRVUZETEVOQlFVTXNSMEZCUnl4VFFVRlRMRWRCUVVjc1EwRkJReXhIUVVGSExGVkJRVlVzUjBGQlJ5eERRVUZETEVWQlFVVXNRMEZCUXl4RlFVRkZMRU5CUVVNc1EwRkJReXhEUVVGRExFZEJRVWNzVFVGQlRTeERRVUZETEVOQlFVTXNSMEZCUnl4VlFVRlZMRWRCUVVjc1EwRkJReXhIUVVGSExGZEJRVmNzUjBGQlJ5eERRVUZETEVWQlFVTXNRMEZCUXp0WlFVZDZTQ3hEUVVGRExFTkJRVU1zUzBGQlN5eERRVUZETEU5QlFVOHNRMEZCUXl4VlFVRlZMRWxCUVVrN1owSkJRekZDTEVsQlFVa3NRMEZCUXl4RFFVRkRMRWxCUVVrc1RVRkJUU3hEUVVGRExFTkJRVU1zUTBGQlF6dG5Ra0ZEYmtJc1NVRkJTU3hEUVVGRExFTkJRVU1zU1VGQlNTeE5RVUZOTEVOQlFVTXNRMEZCUXl4RFFVRkRPMWxCUTNaQ0xFTkJRVU1zUTBGQlF5eERRVUZETzFGQlExQXNRMEZCUXl4RFFVRkRMRU5CUVVNN1NVRkRVQ3hEUVVGRE8wbEJTVVFzVTBGQlV5eExRVUZMTEVOQlFVTXNTVUZCU1N4RlFVRkZMR0ZCUVdFN1VVRkRPVUlzU1VGQlNTeFhRVUZYTEVkQlFVY3NUVUZCVFN4RFFVRkRMR2xDUVVGcFFpeERRVUZETzFGQlF6TkRMRWxCUVVrc1UwRkJVeXhIUVVGSExFTkJRVU1zUTBGQlF6dFJRVU5zUWl4SlFVRkpMRU5CUVVNc1NVRkJTU3hEUVVGRExGVkJRVlVzUTBGQlF5eEZRVUZGTEVOQlFVTXNTVUZCU1N4UFFVRlBMRU5CUVVNc1EwRkJReXhOUVVGTkxFZEJRVWNzUTBGQlF5eERRVUZETEUxQlFVMHNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRE8xRkJSVE5FTEZOQlFWTXNSMEZCUnl4SlFVRkpMRU5CUVVNc1RVRkJUU3hEUVVGRExGVkJRVlVzUTBGQlF5eEZRVUZGTEVOQlFVTTdXVUZEYkVNc1QwRkJUeXhEUVVGRExFTkJRVU1zUzBGQlN5eEhRVUZITEVOQlFVTXNRMEZCUXl4TFFVRkxMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eExRVUZMTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhMUVVGTExFTkJRVU03VVVGRGFrUXNRMEZCUXl4RFFVRkRMRU5CUVVNN1VVRkZTQ3hKUVVGSkxFbEJRVWtzUjBGQlJ5eEZRVUZGTEVkQlFVY3NVMEZCVXl4RFFVRkRPMUZCUXpGQ0xFbEJRVWtzUzBGQlN5eEhRVUZITEVWQlFVVXNSMEZCUnl4blFrRkJaMElzUTBGQlF5eEpRVUZKTEVOQlFVTXNRMEZCUXp0UlFVTjRReXhKUVVGSkxHZENRVUZuUWl4SFFVRkhMRU5CUVVNc1EwRkJRenRSUVVWNlFpeEpRVUZKTEVsQlFVa3NSMEZCUnl4TlFVRk5MRU5CUVVNc1UwRkJVeXhEUVVGRE8xRkJRelZDTEVsQlFVa3NTVUZCU1N4SFFVRkhMRTFCUVUwc1EwRkJReXhUUVVGVExFTkJRVU03VVVGRE5VSXNTVUZCU1N4SlFVRkpMRWRCUVVjc1EwRkJReXhEUVVGRExFTkJRVU03VVVGSFpDeEpRVUZKTEVWQlFVVXNSMEZCUnl4TlFVRk5MRU5CUVVNc1UwRkJVeXhEUVVGRE8xRkJRekZDTEVsQlFVa3NSVUZCUlN4SFFVRkhMRTFCUVUwc1EwRkJReXhUUVVGVExFTkJRVU03VVVGRk1VSXNUMEZCVHl4RFFVRkRMRVZCUVVVc1IwRkJSeXhUUVVGVExFTkJRVU1zU1VGQlNTeEZRVUZGTEVkQlFVY3NZMEZCWXl4RFFVRkRMR0ZCUVdFc1JVRkJSVHRaUVVVeFJDeEpRVUZKTEVsQlFVa3NTVUZCU1N4RFFVRkRMRVZCUVVVN1owSkJRMWdzU1VGQlNTeEZRVUZGTEVkQlFVY3NTMEZCU3l4SFFVRkhMRU5CUVVNc1MwRkJTeXhIUVVGSExFbEJRVWtzUTBGQlF5eEhRVUZITEdOQlFXTXNRMEZCUXl4alFVRmpMRU5CUVVNN1owSkJRMmhGTEVsQlFVa3NTVUZCU1N4SFFVRkhMRWxCUVVrc1EwRkJReXhKUVVGSkxFVkJRVVVzUlVGQlJTeERRVUZETEVOQlFVTTdZVUZETjBJN1dVRkRSQ3hKUVVGSkxFbEJRVWtzU1VGQlNTeERRVUZETEVWQlFVVTdaMEpCUTFnc1NVRkJTU3hGUVVGRkxFZEJRVWNzU1VGQlNTeEhRVUZITEVOQlFVTXNTMEZCU3l4SFFVRkhMRWxCUVVrc1EwRkJReXhIUVVGSExHTkJRV01zUTBGQlF5eGpRVUZqTEVOQlFVTTdaMEpCUXk5RUxFbEJRVWtzU1VGQlNTeEhRVUZITEVsQlFVa3NRMEZCUXl4SlFVRkpMRVZCUVVVc1JVRkJSU3hEUVVGRExFTkJRVU03WVVGRE4wSTdXVUZGUkN4RlFVRkZMRWRCUVVjc1NVRkJTU3hEUVVGRExFZEJRVWNzUTBGQlF5eEZRVUZGTEVkQlFVY3NSVUZCUlN4RFFVRkRMRU5CUVVNN1dVRkRka0lzUlVGQlJTeEhRVUZITEVsQlFVa3NRMEZCUXl4SFFVRkhMRU5CUVVNc1NVRkJTU3hIUVVGSExFbEJRVWtzUTBGQlF5eERRVUZETzFsQlJUTkNMRWxCUVVrc1NVRkJTU3hIUVVGSExGZEJRVmNzUlVGQlJUdG5Ra0ZEY0VJc1YwRkJWeXhIUVVGSExFbEJRVWtzUTBGQlF6dG5Ra0ZEYmtJc1UwRkJVeXhIUVVGSExFVkJRVVVzUTBGQlF6dGhRVU5zUWp0WlFVVkVMRWxCUVVrc1NVRkJTU3hIUVVGSExGZEJRVmNzUlVGQlJUdG5Ra0ZEY0VJc1YwRkJWeXhIUVVGSExFbEJRVWtzUTBGQlF6dG5Ra0ZEYmtJc1UwRkJVeXhIUVVGSExFVkJRVVVzUTBGQlF6dGhRVU5zUWp0WlFVVkVMRWxCUVVrc1NVRkJTU3hIUVVGSExFbEJRVWtzUlVGQlJUdG5Ra0ZEWWl4SlFVRkpMRWRCUVVjc1JVRkJSU3hEUVVGRE8yZENRVU5XTEVWQlFVVXNSMEZCUnl4RlFVRkZMRU5CUVVNN1owSkJRMUlzU1VGQlNTeEhRVUZITEVsQlFVa3NRMEZCUXp0blFrRkRXaXhKUVVGSkxFZEJRVWNzUTBGQlF5eERRVUZETzJGQlExbzdhVUpCUVUwN1owSkJRMGdzUzBGQlN5eEhRVUZITEVWQlFVVXNRMEZCUXp0blFrRkRXQ3hGUVVGRkxFZEJRVWNzUlVGQlJTeERRVUZETzJkQ1FVTlNMRWxCUVVrc1IwRkJSeXhKUVVGSkxFTkJRVU03WjBKQlExb3NTVUZCU1N4SFFVRkhMRU5CUVVNc1EwRkJRenRoUVVOYU8xbEJSVVFzU1VGQlNTeG5Ra0ZCWjBJc1JVRkJSU3hIUVVGSExFZEJRVWNzUlVGQlJUdG5Ra0ZETVVJc1RVRkJUVHRoUVVOVU8xTkJRMG83VVVGRlJDeEpRVUZKTEVOQlFVTXNTVUZCU1N4RlFVRkZMRk5CUVZNc1EwRkJReXhEUVVGRE8wbEJRekZDTEVOQlFVTTdTVUZKUkN4VFFVRlRMRWxCUVVrc1EwRkJReXhKUVVGSkxFVkJRVVVzVTBGQlV6dFJRVU42UWl4SlFVRkpMRWRCUVVjc1JVRkJSU3hEUVVGRE8xRkJRMVlzVlVGQlZTeEhRVUZITEVOQlFVTXNRMEZCUXp0UlFVTm1MRmRCUVZjc1IwRkJSeXhEUVVGRExFTkJRVU03VVVGRGFFSXNZVUZCWVN4SFFVRkhMRTFCUVUwc1EwRkJRenRSUVVWMlFpeExRVUZMTEVsQlFVa3NRMEZCUXl4SFFVRkhMRU5CUVVNc1JVRkJSU3hEUVVGRExFZEJRVWNzU1VGQlNTeERRVUZETEUxQlFVMHNSVUZCUlN4RFFVRkRMRVZCUVVVc1JVRkJSVHRaUVVOc1F5eEpRVUZKTEVOQlFVTXNSMEZCUnl4SlFVRkpMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU03V1VGRGFFSXNVVUZCVVN4RFFVRkRMRU5CUVVNc1JVRkJSU3hUUVVGVExFTkJRVU1zUTBGQlF6dFRRVU14UWp0UlFVVkVMRTlCUVU4c1NVRkJTU3hEUVVGRExFZEJRVWNzUTBGQlF5eGpRVUZqTEVWQlFVVXNSMEZCUnl4aFFVRmhMRU5CUVVNc1EwRkJRenRKUVVOMFJDeERRVUZETzBsQlIwUXNVMEZCVXl4UlFVRlJMRU5CUVVNc1NVRkJTU3hGUVVGRkxGTkJRVk03VVVGSE4wSXNTVUZCU1N4TlFVRk5MRWRCUVVjc1UwRkJVeXhEUVVGRE8xRkJSWFpDTEV0QlFVc3NTVUZCU1N4RFFVRkRMRWRCUVVjc1EwRkJReXhGUVVGRkxFTkJRVU1zUjBGQlJ5eEpRVUZKTEVOQlFVTXNUVUZCVFN4RlFVRkZMRU5CUVVNc1JVRkJSU3hGUVVGRk8xbEJRMnhETEVsQlFVa3NRMEZCUXl4SlFVRkpMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zVlVGQlZTeEpRVUZKTEVsQlFVa3NRMEZCUXl4TlFVRk5MRU5CUVVNc1NVRkJTU3hEUVVGRExFbEJRVWtzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRWRCUVVjc1NVRkJTU3hEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEV0QlFVc3NSMEZCUnl4SlFVRkpMRU5CUVVNc1MwRkJTeXhIUVVGSExHTkJRV01zUTBGQlF5eFBRVUZQTEVkQlFVY3NVMEZCVXl4RFFVRkRMRWxCUVVrc1kwRkJZeXhEUVVGRExHRkJRV0VzUlVGQlJUdG5Ra0ZEZEVvc1RVRkJUU3hIUVVGSExFbEJRVWtzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0blFrRkRha0lzVFVGQlRUdGhRVU5VTzFOQlEwbzdVVUZGUkN4SlFVRkpMRU5CUVVNc1NVRkJTU3hEUVVGRExFbEJRVWtzUTBGQlF5eERRVUZETzFGQlJXaENMRWxCUVVrc1RVRkJUU3hMUVVGTExGTkJRVk1zUlVGQlJUdFpRVU4wUWl4SlFVRkpMRU5CUVVNc1EwRkJReXhIUVVGSExFMUJRVTBzUTBGQlF5eERRVUZETEVkQlFVY3NUVUZCVFN4RFFVRkRMRXRCUVVzc1IwRkJSeXhqUVVGakxFTkJRVU1zVDBGQlR5eERRVUZETzFsQlF6RkVMRWxCUVVrc1EwRkJReXhEUVVGRExFZEJRVWNzVFVGQlRTeERRVUZETEUxQlFVMHNRMEZCUXp0WlFVTjJRaXhKUVVGSkxFTkJRVU1zVlVGQlZTeEhRVUZITEVsQlFVa3NRMEZCUXl4TlFVRk5MRU5CUVVNN1dVRkRPVUlzU1VGQlNTeERRVUZETEUxQlFVMHNSMEZCUnl4SlFVRkpMRU5CUVVNc1EwRkJReXhEUVVGRE8xbEJRM0pDTEUxQlFVMHNRMEZCUXl4VlFVRlZMRWxCUVVrc1NVRkJTU3hEUVVGRExFMUJRVTBzUjBGQlJ5eGpRVUZqTEVOQlFVTXNUMEZCVHl4RFFVRkRPMWxCUXpGRUxFMUJRVTBzUTBGQlF5eE5RVUZOTEVsQlFVa3NTVUZCU1N4RFFVRkRMRTFCUVUwc1IwRkJSeXhqUVVGakxFTkJRVU1zVDBGQlR5eERRVUZETzFOQlEzcEVPMkZCUVUwN1dVRkRTQ3hKUVVGSkxFTkJRVU1zUTBGQlF5eEhRVUZITEdGQlFXRXNRMEZCUXp0WlFVTjJRaXhoUVVGaExFbEJRVWtzU1VGQlNTeERRVUZETEUxQlFVMHNSMEZCUnl4alFVRmpMRU5CUVVNc1QwRkJUeXhEUVVGRE8xbEJRM1JFTEVsQlFVa3NRMEZCUXl4RFFVRkRMRWRCUVVjc1RVRkJUU3hEUVVGRE8xbEJRMmhDTEVsQlFVa3NRMEZCUXl4TlFVRk5MRWRCUVVjc1NVRkJTU3hEUVVGRExFTkJRVU1zUTBGQlF6dFpRVU55UWl4SlFVRkpMRU5CUVVNc1ZVRkJWU3hIUVVGSExFbEJRVWtzUTBGQlF5eE5RVUZOTEVOQlFVTTdVMEZEYWtNN1VVRkZSQ3hKUVVGSkxFbEJRVWtzUTBGQlF5eERRVUZETEVkQlFVY3NTVUZCU1N4RFFVRkRMRTFCUVUwc1IwRkJSeXhYUVVGWExFZEJRVWNzUTBGQlF5eGpRVUZqTEVOQlFVTXNZVUZCWVR0WlFVRkZMRmRCUVZjc1IwRkJSeXhKUVVGSkxFTkJRVU1zUTBGQlF5eEhRVUZITEVsQlFVa3NRMEZCUXl4TlFVRk5MRWRCUVVjc1RVRkJUU3hEUVVGRE8xRkJRM0JJTEVsQlFVa3NTVUZCU1N4RFFVRkRMRU5CUVVNc1IwRkJSeXhKUVVGSkxFTkJRVU1zUzBGQlN5eEhRVUZITEZWQlFWVXNSMEZCUnl4RFFVRkRMR05CUVdNc1EwRkJReXhoUVVGaE8xbEJRVVVzVlVGQlZTeEhRVUZITEVsQlFVa3NRMEZCUXl4RFFVRkRMRWRCUVVjc1NVRkJTU3hEUVVGRExFdEJRVXNzUjBGQlJ5eE5RVUZOTEVOQlFVTTdTVUZEY0Vnc1EwRkJRenRKUVVGQkxFTkJRVU03U1VGRlJpeFRRVUZUTEdkQ1FVRm5RaXhEUVVGRExFbEJRVWs3VVVGRE1VSXNTVUZCU1N4TFFVRkxMRWRCUVVjc1EwRkJReXhEUVVGRE8xRkJRMlFzU1VGQlNTeERRVUZETEU5QlFVOHNRMEZCUXl4VlFVRlZMRU5CUVVNc1NVRkJTU3hQUVVGUExFdEJRVXNzU1VGQlNTeERRVUZETEVOQlFVTXNTMEZCU3l4SFFVRkhMR05CUVdNc1EwRkJReXhQUVVGUExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0UlFVTnFSaXhQUVVGUExFdEJRVXNzUTBGQlF6dEpRVU5xUWl4RFFVRkRPMGxCUlVRc1UwRkJVeXhqUVVGak8xRkJRMjVDTEU5QlFVOHNRMEZCUXl4VlFVRlZMRWRCUVVjc1YwRkJWeXhEUVVGRExFTkJRVU03U1VGRGRFTXNRMEZCUXp0QlFVTk1MRU5CUVVNN1FVRXhVRVFzYjBOQk1GQkRPMEZCVFVRc1UwRkJaMElzWTBGQll5eERRVUZETEV0QlFVc3NSVUZCUlN4TFFVRkxPMGxCUTNaRExFbEJRVWtzUzBGQlN5eEhRVUZITEVWQlFVVXNRMEZCUXp0SlFVTm1MRWxCUVVrc1NVRkJTU3hIUVVGSExFVkJRVVVzUTBGQlF6dEpRVU5rTEVsQlFVa3NUVUZCVFN4SFFVRkhMRVZCUVVVc1EwRkJRenRKUVVOb1FpeEpRVUZKTEZGQlFWRXNSMEZCUnl4RFFVRkRMRU5CUVVNN1NVRkZha0lzUzBGQlN5eEpRVUZKTEVOQlFVTXNSMEZCUnl4RFFVRkRMRVZCUVVVc1EwRkJReXhIUVVGSExFdEJRVXNzUTBGQlF5eE5RVUZOTEVWQlFVVXNRMEZCUXl4RlFVRkZMRVZCUVVVN1VVRkRia01zU1VGQlNTeEpRVUZKTEVkQlFVY3NTMEZCU3l4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRE8xRkJRM0JDTEVsQlFVa3NSVUZCUlN4SFFVRkhMRWxCUVVrc1EwRkJReXhOUVVGTkxFTkJRVU03VVVGRGNrSXNTVUZCU1N4RlFVRkZMRWRCUVVjc1NVRkJTU3hEUVVGRExFMUJRVTBzUTBGQlF6dFJRVU55UWl4SlFVRkpMRWxCUVVrc1EwRkJReXhGUVVGRkxFTkJRVU1zUzBGQlN5eERRVUZETzFsQlEyUXNTVUZCU1N4RFFVRkRMRVZCUVVVc1EwRkJReXhMUVVGTExFTkJRVU1zUTBGQlF5eEpRVUZKTEVOQlFVTXNSVUZCUlN4RFFVRkRMRU5CUVVNN08xbEJSWGhDTEVsQlFVa3NRMEZCUXl4RlFVRkZMRU5CUVVNc1MwRkJTeXhEUVVGRExFZEJRVWNzUTBGQlF5eEZRVUZGTEVOQlFVTXNRMEZCUXp0UlFVVXhRaXhKUVVGSkxFbEJRVWtzUTBGQlF5eEZRVUZGTEVOQlFVTXNTMEZCU3l4RFFVRkRPMWxCUTJRc1NVRkJTU3hEUVVGRExFVkJRVVVzUTBGQlF5eExRVUZMTEVOQlFVTXNRMEZCUXl4SlFVRkpMRU5CUVVNc1JVRkJSU3hEUVVGRExFTkJRVU03TzFsQlJYaENMRWxCUVVrc1EwRkJReXhGUVVGRkxFTkJRVU1zUzBGQlN5eERRVUZETEVkQlFVY3NRMEZCUXl4RlFVRkZMRU5CUVVNc1EwRkJRenRMUVVNM1FqdEpRVVZFTEV0QlFVc3NTVUZCU1N4RFFVRkRMRWRCUVVjc1EwRkJReXhGUVVGRkxFTkJRVU1zUjBGQlJ5eExRVUZMTEVOQlFVTXNUVUZCVFN4RlFVRkZMRU5CUVVNc1JVRkJSU3hGUVVGRk8xRkJRMjVETEVsQlFVa3NTVUZCU1N4SFFVRkhMRXRCUVVzc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dFJRVU53UWl4SlFVRkpMRXRCUVVzc1EwRkJReXhKUVVGSkxFTkJRVU1zUzBGQlN5eERRVUZETzFsQlFVVXNVMEZCVXp0UlFVTm9ReXhaUVVGWkxFTkJRVU1zU1VGQlNTeEZRVUZGTEVsQlFVa3NRMEZCUXl4RFFVRkRPMHRCUXpWQ08wbEJSVVFzVTBGQlV5eFpRVUZaTEVOQlFVTXNRMEZCUXl4RlFVRkZMRTFCUVUwN1VVRkRNMElzU1VGQlNTeExRVUZMTEVOQlFVTXNRMEZCUXl4RFFVRkRMRXRCUVVzc1EwRkJReXhMUVVGTExGTkJRVk03V1VGQlJTeFBRVUZQTzFGQlEzcERMRWxCUVVrc1RVRkJUU3hGUVVGRk8xbEJRMUlzVVVGQlVTeEZRVUZGTEVOQlFVTTdXVUZEV0N4TlFVRk5MRU5CUVVNc1NVRkJTU3hEUVVGRExFVkJRVVVzUzBGQlN5eEZRVUZGTEVWQlFVVXNSVUZCUlN4RFFVRkRMRU5CUVVNN1UwRkRPVUk3VVVGRFJDeExRVUZMTEVOQlFVTXNRMEZCUXl4RFFVRkRMRXRCUVVzc1EwRkJReXhIUVVGSExGRkJRVkVzUTBGQlF6dFJRVU14UWl4TlFVRk5MRU5CUVVNc1VVRkJVU3hIUVVGSExFTkJRVU1zUTBGQlF5eERRVUZETEV0QlFVc3NRMEZCUXl4SlFVRkpMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU03VVVGRGJrTXNTVUZCU1N4UlFVRlJMRWRCUVVjc1NVRkJTU3hEUVVGRExFTkJRVU1zUTBGQlF5eExRVUZMTEVOQlFVTXNRMEZCUXp0UlFVTTNRaXhKUVVGSkxFTkJRVU1zVVVGQlVUdFpRVUZGTEU5QlFVODdVVUZGZEVJc1MwRkJTeXhKUVVGSkxFTkJRVU1zUjBGQlJ5eERRVUZETEVWQlFVVXNRMEZCUXl4SFFVRkhMRkZCUVZFc1EwRkJReXhOUVVGTkxFVkJRVVVzUTBGQlF5eEZRVUZGTEVWQlFVVTdXVUZEZEVNc1dVRkJXU3hEUVVGRExGRkJRVkVzUTBGQlF5eERRVUZETEVOQlFVTXNSVUZCUlN4TFFVRkxMRU5CUVVNc1EwRkJRenRUUVVOd1F6dEpRVU5NTEVOQlFVTTdTVUZGUkN4UFFVRlBMRTFCUVUwc1EwRkJRenRCUVVOc1FpeERRVUZETzBGQk5VTkVMSGREUVRSRFF5SjkiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciBwb3dlcmdyYXBoID0gcmVxdWlyZShcIi4vcG93ZXJncmFwaFwiKTtcbnZhciBsaW5rbGVuZ3Roc18xID0gcmVxdWlyZShcIi4vbGlua2xlbmd0aHNcIik7XG52YXIgZGVzY2VudF8xID0gcmVxdWlyZShcIi4vZGVzY2VudFwiKTtcbnZhciByZWN0YW5nbGVfMSA9IHJlcXVpcmUoXCIuL3JlY3RhbmdsZVwiKTtcbnZhciBzaG9ydGVzdHBhdGhzXzEgPSByZXF1aXJlKFwiLi9zaG9ydGVzdHBhdGhzXCIpO1xudmFyIGdlb21fMSA9IHJlcXVpcmUoXCIuL2dlb21cIik7XG52YXIgaGFuZGxlZGlzY29ubmVjdGVkXzEgPSByZXF1aXJlKFwiLi9oYW5kbGVkaXNjb25uZWN0ZWRcIik7XG52YXIgRXZlbnRUeXBlO1xuKGZ1bmN0aW9uIChFdmVudFR5cGUpIHtcbiAgICBFdmVudFR5cGVbRXZlbnRUeXBlW1wic3RhcnRcIl0gPSAwXSA9IFwic3RhcnRcIjtcbiAgICBFdmVudFR5cGVbRXZlbnRUeXBlW1widGlja1wiXSA9IDFdID0gXCJ0aWNrXCI7XG4gICAgRXZlbnRUeXBlW0V2ZW50VHlwZVtcImVuZFwiXSA9IDJdID0gXCJlbmRcIjtcbn0pKEV2ZW50VHlwZSA9IGV4cG9ydHMuRXZlbnRUeXBlIHx8IChleHBvcnRzLkV2ZW50VHlwZSA9IHt9KSk7XG47XG5mdW5jdGlvbiBpc0dyb3VwKGcpIHtcbiAgICByZXR1cm4gdHlwZW9mIGcubGVhdmVzICE9PSAndW5kZWZpbmVkJyB8fCB0eXBlb2YgZy5ncm91cHMgIT09ICd1bmRlZmluZWQnO1xufVxudmFyIExheW91dCA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gTGF5b3V0KCkge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICB0aGlzLl9jYW52YXNTaXplID0gWzEsIDFdO1xuICAgICAgICB0aGlzLl9saW5rRGlzdGFuY2UgPSAyMDtcbiAgICAgICAgdGhpcy5fZGVmYXVsdE5vZGVTaXplID0gMTA7XG4gICAgICAgIHRoaXMuX2xpbmtMZW5ndGhDYWxjdWxhdG9yID0gbnVsbDtcbiAgICAgICAgdGhpcy5fbGlua1R5cGUgPSBudWxsO1xuICAgICAgICB0aGlzLl9hdm9pZE92ZXJsYXBzID0gZmFsc2U7XG4gICAgICAgIHRoaXMuX2hhbmRsZURpc2Nvbm5lY3RlZCA9IHRydWU7XG4gICAgICAgIHRoaXMuX3J1bm5pbmcgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5fbm9kZXMgPSBbXTtcbiAgICAgICAgdGhpcy5fZ3JvdXBzID0gW107XG4gICAgICAgIHRoaXMuX3Jvb3RHcm91cCA9IG51bGw7XG4gICAgICAgIHRoaXMuX2xpbmtzID0gW107XG4gICAgICAgIHRoaXMuX2NvbnN0cmFpbnRzID0gW107XG4gICAgICAgIHRoaXMuX2Rpc3RhbmNlTWF0cml4ID0gbnVsbDtcbiAgICAgICAgdGhpcy5fZGVzY2VudCA9IG51bGw7XG4gICAgICAgIHRoaXMuX2RpcmVjdGVkTGlua0NvbnN0cmFpbnRzID0gbnVsbDtcbiAgICAgICAgdGhpcy5fdGhyZXNob2xkID0gMC4wMTtcbiAgICAgICAgdGhpcy5fdmlzaWJpbGl0eUdyYXBoID0gbnVsbDtcbiAgICAgICAgdGhpcy5fZ3JvdXBDb21wYWN0bmVzcyA9IDFlLTY7XG4gICAgICAgIHRoaXMuZXZlbnQgPSBudWxsO1xuICAgICAgICB0aGlzLmxpbmtBY2Nlc3NvciA9IHtcbiAgICAgICAgICAgIGdldFNvdXJjZUluZGV4OiBMYXlvdXQuZ2V0U291cmNlSW5kZXgsXG4gICAgICAgICAgICBnZXRUYXJnZXRJbmRleDogTGF5b3V0LmdldFRhcmdldEluZGV4LFxuICAgICAgICAgICAgc2V0TGVuZ3RoOiBMYXlvdXQuc2V0TGlua0xlbmd0aCxcbiAgICAgICAgICAgIGdldFR5cGU6IGZ1bmN0aW9uIChsKSB7IHJldHVybiB0eXBlb2YgX3RoaXMuX2xpbmtUeXBlID09PSBcImZ1bmN0aW9uXCIgPyBfdGhpcy5fbGlua1R5cGUobCkgOiAwOyB9XG4gICAgICAgIH07XG4gICAgfVxuICAgIExheW91dC5wcm90b3R5cGUub24gPSBmdW5jdGlvbiAoZSwgbGlzdGVuZXIpIHtcbiAgICAgICAgaWYgKCF0aGlzLmV2ZW50KVxuICAgICAgICAgICAgdGhpcy5ldmVudCA9IHt9O1xuICAgICAgICBpZiAodHlwZW9mIGUgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICB0aGlzLmV2ZW50W0V2ZW50VHlwZVtlXV0gPSBsaXN0ZW5lcjtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuZXZlbnRbZV0gPSBsaXN0ZW5lcjtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIExheW91dC5wcm90b3R5cGUudHJpZ2dlciA9IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgIGlmICh0aGlzLmV2ZW50ICYmIHR5cGVvZiB0aGlzLmV2ZW50W2UudHlwZV0gIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICB0aGlzLmV2ZW50W2UudHlwZV0oZSk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIExheW91dC5wcm90b3R5cGUua2ljayA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgd2hpbGUgKCF0aGlzLnRpY2soKSlcbiAgICAgICAgICAgIDtcbiAgICB9O1xuICAgIExheW91dC5wcm90b3R5cGUudGljayA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKHRoaXMuX2FscGhhIDwgdGhpcy5fdGhyZXNob2xkKSB7XG4gICAgICAgICAgICB0aGlzLl9ydW5uaW5nID0gZmFsc2U7XG4gICAgICAgICAgICB0aGlzLnRyaWdnZXIoeyB0eXBlOiBFdmVudFR5cGUuZW5kLCBhbHBoYTogdGhpcy5fYWxwaGEgPSAwLCBzdHJlc3M6IHRoaXMuX2xhc3RTdHJlc3MgfSk7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgbiA9IHRoaXMuX25vZGVzLmxlbmd0aCwgbSA9IHRoaXMuX2xpbmtzLmxlbmd0aDtcbiAgICAgICAgdmFyIG8sIGk7XG4gICAgICAgIHRoaXMuX2Rlc2NlbnQubG9ja3MuY2xlYXIoKTtcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IG47ICsraSkge1xuICAgICAgICAgICAgbyA9IHRoaXMuX25vZGVzW2ldO1xuICAgICAgICAgICAgaWYgKG8uZml4ZWQpIHtcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIG8ucHggPT09ICd1bmRlZmluZWQnIHx8IHR5cGVvZiBvLnB5ID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgICAgICBvLnB4ID0gby54O1xuICAgICAgICAgICAgICAgICAgICBvLnB5ID0gby55O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB2YXIgcCA9IFtvLnB4LCBvLnB5XTtcbiAgICAgICAgICAgICAgICB0aGlzLl9kZXNjZW50LmxvY2tzLmFkZChpLCBwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB2YXIgczEgPSB0aGlzLl9kZXNjZW50LnJ1bmdlS3V0dGEoKTtcbiAgICAgICAgaWYgKHMxID09PSAwKSB7XG4gICAgICAgICAgICB0aGlzLl9hbHBoYSA9IDA7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAodHlwZW9mIHRoaXMuX2xhc3RTdHJlc3MgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICB0aGlzLl9hbHBoYSA9IHMxO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX2xhc3RTdHJlc3MgPSBzMTtcbiAgICAgICAgdGhpcy51cGRhdGVOb2RlUG9zaXRpb25zKCk7XG4gICAgICAgIHRoaXMudHJpZ2dlcih7IHR5cGU6IEV2ZW50VHlwZS50aWNrLCBhbHBoYTogdGhpcy5fYWxwaGEsIHN0cmVzczogdGhpcy5fbGFzdFN0cmVzcyB9KTtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH07XG4gICAgTGF5b3V0LnByb3RvdHlwZS51cGRhdGVOb2RlUG9zaXRpb25zID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgeCA9IHRoaXMuX2Rlc2NlbnQueFswXSwgeSA9IHRoaXMuX2Rlc2NlbnQueFsxXTtcbiAgICAgICAgdmFyIG8sIGkgPSB0aGlzLl9ub2Rlcy5sZW5ndGg7XG4gICAgICAgIHdoaWxlIChpLS0pIHtcbiAgICAgICAgICAgIG8gPSB0aGlzLl9ub2Rlc1tpXTtcbiAgICAgICAgICAgIG8ueCA9IHhbaV07XG4gICAgICAgICAgICBvLnkgPSB5W2ldO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBMYXlvdXQucHJvdG90eXBlLm5vZGVzID0gZnVuY3Rpb24gKHYpIHtcbiAgICAgICAgaWYgKCF2KSB7XG4gICAgICAgICAgICBpZiAodGhpcy5fbm9kZXMubGVuZ3RoID09PSAwICYmIHRoaXMuX2xpbmtzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICB2YXIgbiA9IDA7XG4gICAgICAgICAgICAgICAgdGhpcy5fbGlua3MuZm9yRWFjaChmdW5jdGlvbiAobCkge1xuICAgICAgICAgICAgICAgICAgICBuID0gTWF0aC5tYXgobiwgbC5zb3VyY2UsIGwudGFyZ2V0KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB0aGlzLl9ub2RlcyA9IG5ldyBBcnJheSgrK24pO1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbjsgKytpKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX25vZGVzW2ldID0ge307XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX25vZGVzO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX25vZGVzID0gdjtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICBMYXlvdXQucHJvdG90eXBlLmdyb3VwcyA9IGZ1bmN0aW9uICh4KSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIGlmICgheClcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9ncm91cHM7XG4gICAgICAgIHRoaXMuX2dyb3VwcyA9IHg7XG4gICAgICAgIHRoaXMuX3Jvb3RHcm91cCA9IHt9O1xuICAgICAgICB0aGlzLl9ncm91cHMuZm9yRWFjaChmdW5jdGlvbiAoZykge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBnLnBhZGRpbmcgPT09IFwidW5kZWZpbmVkXCIpXG4gICAgICAgICAgICAgICAgZy5wYWRkaW5nID0gMTtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgZy5sZWF2ZXMgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgICAgICAgICBnLmxlYXZlcy5mb3JFYWNoKGZ1bmN0aW9uICh2LCBpKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgdiA9PT0gJ251bWJlcicpXG4gICAgICAgICAgICAgICAgICAgICAgICAoZy5sZWF2ZXNbaV0gPSBfdGhpcy5fbm9kZXNbdl0pLnBhcmVudCA9IGc7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodHlwZW9mIGcuZ3JvdXBzICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgICAgICAgICAgZy5ncm91cHMuZm9yRWFjaChmdW5jdGlvbiAoZ2ksIGkpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBnaSA9PT0gJ251bWJlcicpXG4gICAgICAgICAgICAgICAgICAgICAgICAoZy5ncm91cHNbaV0gPSBfdGhpcy5fZ3JvdXBzW2dpXSkucGFyZW50ID0gZztcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuX3Jvb3RHcm91cC5sZWF2ZXMgPSB0aGlzLl9ub2Rlcy5maWx0ZXIoZnVuY3Rpb24gKHYpIHsgcmV0dXJuIHR5cGVvZiB2LnBhcmVudCA9PT0gJ3VuZGVmaW5lZCc7IH0pO1xuICAgICAgICB0aGlzLl9yb290R3JvdXAuZ3JvdXBzID0gdGhpcy5fZ3JvdXBzLmZpbHRlcihmdW5jdGlvbiAoZykgeyByZXR1cm4gdHlwZW9mIGcucGFyZW50ID09PSAndW5kZWZpbmVkJzsgfSk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgTGF5b3V0LnByb3RvdHlwZS5wb3dlckdyYXBoR3JvdXBzID0gZnVuY3Rpb24gKGYpIHtcbiAgICAgICAgdmFyIGcgPSBwb3dlcmdyYXBoLmdldEdyb3Vwcyh0aGlzLl9ub2RlcywgdGhpcy5fbGlua3MsIHRoaXMubGlua0FjY2Vzc29yLCB0aGlzLl9yb290R3JvdXApO1xuICAgICAgICB0aGlzLmdyb3VwcyhnLmdyb3Vwcyk7XG4gICAgICAgIGYoZyk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgTGF5b3V0LnByb3RvdHlwZS5hdm9pZE92ZXJsYXBzID0gZnVuY3Rpb24gKHYpIHtcbiAgICAgICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKVxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2F2b2lkT3ZlcmxhcHM7XG4gICAgICAgIHRoaXMuX2F2b2lkT3ZlcmxhcHMgPSB2O1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIExheW91dC5wcm90b3R5cGUuaGFuZGxlRGlzY29ubmVjdGVkID0gZnVuY3Rpb24gKHYpIHtcbiAgICAgICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKVxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2hhbmRsZURpc2Nvbm5lY3RlZDtcbiAgICAgICAgdGhpcy5faGFuZGxlRGlzY29ubmVjdGVkID0gdjtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICBMYXlvdXQucHJvdG90eXBlLmZsb3dMYXlvdXQgPSBmdW5jdGlvbiAoYXhpcywgbWluU2VwYXJhdGlvbikge1xuICAgICAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpXG4gICAgICAgICAgICBheGlzID0gJ3knO1xuICAgICAgICB0aGlzLl9kaXJlY3RlZExpbmtDb25zdHJhaW50cyA9IHtcbiAgICAgICAgICAgIGF4aXM6IGF4aXMsXG4gICAgICAgICAgICBnZXRNaW5TZXBhcmF0aW9uOiB0eXBlb2YgbWluU2VwYXJhdGlvbiA9PT0gJ251bWJlcicgPyBmdW5jdGlvbiAoKSB7IHJldHVybiBtaW5TZXBhcmF0aW9uOyB9IDogbWluU2VwYXJhdGlvblxuICAgICAgICB9O1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIExheW91dC5wcm90b3R5cGUubGlua3MgPSBmdW5jdGlvbiAoeCkge1xuICAgICAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fbGlua3M7XG4gICAgICAgIHRoaXMuX2xpbmtzID0geDtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICBMYXlvdXQucHJvdG90eXBlLmNvbnN0cmFpbnRzID0gZnVuY3Rpb24gKGMpIHtcbiAgICAgICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKVxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2NvbnN0cmFpbnRzO1xuICAgICAgICB0aGlzLl9jb25zdHJhaW50cyA9IGM7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgTGF5b3V0LnByb3RvdHlwZS5kaXN0YW5jZU1hdHJpeCA9IGZ1bmN0aW9uIChkKSB7XG4gICAgICAgIGlmICghYXJndW1lbnRzLmxlbmd0aClcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9kaXN0YW5jZU1hdHJpeDtcbiAgICAgICAgdGhpcy5fZGlzdGFuY2VNYXRyaXggPSBkO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIExheW91dC5wcm90b3R5cGUuc2l6ZSA9IGZ1bmN0aW9uICh4KSB7XG4gICAgICAgIGlmICgheClcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9jYW52YXNTaXplO1xuICAgICAgICB0aGlzLl9jYW52YXNTaXplID0geDtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICBMYXlvdXQucHJvdG90eXBlLmRlZmF1bHROb2RlU2l6ZSA9IGZ1bmN0aW9uICh4KSB7XG4gICAgICAgIGlmICgheClcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9kZWZhdWx0Tm9kZVNpemU7XG4gICAgICAgIHRoaXMuX2RlZmF1bHROb2RlU2l6ZSA9IHg7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgTGF5b3V0LnByb3RvdHlwZS5ncm91cENvbXBhY3RuZXNzID0gZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgaWYgKCF4KVxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2dyb3VwQ29tcGFjdG5lc3M7XG4gICAgICAgIHRoaXMuX2dyb3VwQ29tcGFjdG5lc3MgPSB4O1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIExheW91dC5wcm90b3R5cGUubGlua0Rpc3RhbmNlID0gZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgaWYgKCF4KSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fbGlua0Rpc3RhbmNlO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX2xpbmtEaXN0YW5jZSA9IHR5cGVvZiB4ID09PSBcImZ1bmN0aW9uXCIgPyB4IDogK3g7XG4gICAgICAgIHRoaXMuX2xpbmtMZW5ndGhDYWxjdWxhdG9yID0gbnVsbDtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICBMYXlvdXQucHJvdG90eXBlLmxpbmtUeXBlID0gZnVuY3Rpb24gKGYpIHtcbiAgICAgICAgdGhpcy5fbGlua1R5cGUgPSBmO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIExheW91dC5wcm90b3R5cGUuY29udmVyZ2VuY2VUaHJlc2hvbGQgPSBmdW5jdGlvbiAoeCkge1xuICAgICAgICBpZiAoIXgpXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fdGhyZXNob2xkO1xuICAgICAgICB0aGlzLl90aHJlc2hvbGQgPSB0eXBlb2YgeCA9PT0gXCJmdW5jdGlvblwiID8geCA6ICt4O1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIExheW91dC5wcm90b3R5cGUuYWxwaGEgPSBmdW5jdGlvbiAoeCkge1xuICAgICAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fYWxwaGE7XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgeCA9ICt4O1xuICAgICAgICAgICAgaWYgKHRoaXMuX2FscGhhKSB7XG4gICAgICAgICAgICAgICAgaWYgKHggPiAwKVxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9hbHBoYSA9IHg7XG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9hbHBoYSA9IDA7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmICh4ID4gMCkge1xuICAgICAgICAgICAgICAgIGlmICghdGhpcy5fcnVubmluZykge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9ydW5uaW5nID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50cmlnZ2VyKHsgdHlwZTogRXZlbnRUeXBlLnN0YXJ0LCBhbHBoYTogdGhpcy5fYWxwaGEgPSB4IH0pO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmtpY2soKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuICAgIH07XG4gICAgTGF5b3V0LnByb3RvdHlwZS5nZXRMaW5rTGVuZ3RoID0gZnVuY3Rpb24gKGxpbmspIHtcbiAgICAgICAgcmV0dXJuIHR5cGVvZiB0aGlzLl9saW5rRGlzdGFuY2UgPT09IFwiZnVuY3Rpb25cIiA/ICsodGhpcy5fbGlua0Rpc3RhbmNlKGxpbmspKSA6IHRoaXMuX2xpbmtEaXN0YW5jZTtcbiAgICB9O1xuICAgIExheW91dC5zZXRMaW5rTGVuZ3RoID0gZnVuY3Rpb24gKGxpbmssIGxlbmd0aCkge1xuICAgICAgICBsaW5rLmxlbmd0aCA9IGxlbmd0aDtcbiAgICB9O1xuICAgIExheW91dC5wcm90b3R5cGUuZ2V0TGlua1R5cGUgPSBmdW5jdGlvbiAobGluaykge1xuICAgICAgICByZXR1cm4gdHlwZW9mIHRoaXMuX2xpbmtUeXBlID09PSBcImZ1bmN0aW9uXCIgPyB0aGlzLl9saW5rVHlwZShsaW5rKSA6IDA7XG4gICAgfTtcbiAgICBMYXlvdXQucHJvdG90eXBlLnN5bW1ldHJpY0RpZmZMaW5rTGVuZ3RocyA9IGZ1bmN0aW9uIChpZGVhbExlbmd0aCwgdykge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICBpZiAodyA9PT0gdm9pZCAwKSB7IHcgPSAxOyB9XG4gICAgICAgIHRoaXMubGlua0Rpc3RhbmNlKGZ1bmN0aW9uIChsKSB7IHJldHVybiBpZGVhbExlbmd0aCAqIGwubGVuZ3RoOyB9KTtcbiAgICAgICAgdGhpcy5fbGlua0xlbmd0aENhbGN1bGF0b3IgPSBmdW5jdGlvbiAoKSB7IHJldHVybiBsaW5rbGVuZ3Roc18xLnN5bW1ldHJpY0RpZmZMaW5rTGVuZ3RocyhfdGhpcy5fbGlua3MsIF90aGlzLmxpbmtBY2Nlc3Nvciwgdyk7IH07XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgTGF5b3V0LnByb3RvdHlwZS5qYWNjYXJkTGlua0xlbmd0aHMgPSBmdW5jdGlvbiAoaWRlYWxMZW5ndGgsIHcpIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgaWYgKHcgPT09IHZvaWQgMCkgeyB3ID0gMTsgfVxuICAgICAgICB0aGlzLmxpbmtEaXN0YW5jZShmdW5jdGlvbiAobCkgeyByZXR1cm4gaWRlYWxMZW5ndGggKiBsLmxlbmd0aDsgfSk7XG4gICAgICAgIHRoaXMuX2xpbmtMZW5ndGhDYWxjdWxhdG9yID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gbGlua2xlbmd0aHNfMS5qYWNjYXJkTGlua0xlbmd0aHMoX3RoaXMuX2xpbmtzLCBfdGhpcy5saW5rQWNjZXNzb3IsIHcpOyB9O1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIExheW91dC5wcm90b3R5cGUuc3RhcnQgPSBmdW5jdGlvbiAoaW5pdGlhbFVuY29uc3RyYWluZWRJdGVyYXRpb25zLCBpbml0aWFsVXNlckNvbnN0cmFpbnRJdGVyYXRpb25zLCBpbml0aWFsQWxsQ29uc3RyYWludHNJdGVyYXRpb25zLCBncmlkU25hcEl0ZXJhdGlvbnMsIGtlZXBSdW5uaW5nLCBjZW50ZXJHcmFwaCkge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICBpZiAoaW5pdGlhbFVuY29uc3RyYWluZWRJdGVyYXRpb25zID09PSB2b2lkIDApIHsgaW5pdGlhbFVuY29uc3RyYWluZWRJdGVyYXRpb25zID0gMDsgfVxuICAgICAgICBpZiAoaW5pdGlhbFVzZXJDb25zdHJhaW50SXRlcmF0aW9ucyA9PT0gdm9pZCAwKSB7IGluaXRpYWxVc2VyQ29uc3RyYWludEl0ZXJhdGlvbnMgPSAwOyB9XG4gICAgICAgIGlmIChpbml0aWFsQWxsQ29uc3RyYWludHNJdGVyYXRpb25zID09PSB2b2lkIDApIHsgaW5pdGlhbEFsbENvbnN0cmFpbnRzSXRlcmF0aW9ucyA9IDA7IH1cbiAgICAgICAgaWYgKGdyaWRTbmFwSXRlcmF0aW9ucyA9PT0gdm9pZCAwKSB7IGdyaWRTbmFwSXRlcmF0aW9ucyA9IDA7IH1cbiAgICAgICAgaWYgKGtlZXBSdW5uaW5nID09PSB2b2lkIDApIHsga2VlcFJ1bm5pbmcgPSB0cnVlOyB9XG4gICAgICAgIGlmIChjZW50ZXJHcmFwaCA9PT0gdm9pZCAwKSB7IGNlbnRlckdyYXBoID0gdHJ1ZTsgfVxuICAgICAgICB2YXIgaSwgaiwgbiA9IHRoaXMubm9kZXMoKS5sZW5ndGgsIE4gPSBuICsgMiAqIHRoaXMuX2dyb3Vwcy5sZW5ndGgsIG0gPSB0aGlzLl9saW5rcy5sZW5ndGgsIHcgPSB0aGlzLl9jYW52YXNTaXplWzBdLCBoID0gdGhpcy5fY2FudmFzU2l6ZVsxXTtcbiAgICAgICAgdmFyIHggPSBuZXcgQXJyYXkoTiksIHkgPSBuZXcgQXJyYXkoTik7XG4gICAgICAgIHZhciBHID0gbnVsbDtcbiAgICAgICAgdmFyIGFvID0gdGhpcy5fYXZvaWRPdmVybGFwcztcbiAgICAgICAgdGhpcy5fbm9kZXMuZm9yRWFjaChmdW5jdGlvbiAodiwgaSkge1xuICAgICAgICAgICAgdi5pbmRleCA9IGk7XG4gICAgICAgICAgICBpZiAodHlwZW9mIHYueCA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICB2LnggPSB3IC8gMiwgdi55ID0gaCAvIDI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB4W2ldID0gdi54LCB5W2ldID0gdi55O1xuICAgICAgICB9KTtcbiAgICAgICAgaWYgKHRoaXMuX2xpbmtMZW5ndGhDYWxjdWxhdG9yKVxuICAgICAgICAgICAgdGhpcy5fbGlua0xlbmd0aENhbGN1bGF0b3IoKTtcbiAgICAgICAgdmFyIGRpc3RhbmNlcztcbiAgICAgICAgaWYgKHRoaXMuX2Rpc3RhbmNlTWF0cml4KSB7XG4gICAgICAgICAgICBkaXN0YW5jZXMgPSB0aGlzLl9kaXN0YW5jZU1hdHJpeDtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGRpc3RhbmNlcyA9IChuZXcgc2hvcnRlc3RwYXRoc18xLkNhbGN1bGF0b3IoTiwgdGhpcy5fbGlua3MsIExheW91dC5nZXRTb3VyY2VJbmRleCwgTGF5b3V0LmdldFRhcmdldEluZGV4LCBmdW5jdGlvbiAobCkgeyByZXR1cm4gX3RoaXMuZ2V0TGlua0xlbmd0aChsKTsgfSkpLkRpc3RhbmNlTWF0cml4KCk7XG4gICAgICAgICAgICBHID0gZGVzY2VudF8xLkRlc2NlbnQuY3JlYXRlU3F1YXJlTWF0cml4KE4sIGZ1bmN0aW9uICgpIHsgcmV0dXJuIDI7IH0pO1xuICAgICAgICAgICAgdGhpcy5fbGlua3MuZm9yRWFjaChmdW5jdGlvbiAobCkge1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgbC5zb3VyY2UgPT0gXCJudW1iZXJcIilcbiAgICAgICAgICAgICAgICAgICAgbC5zb3VyY2UgPSBfdGhpcy5fbm9kZXNbbC5zb3VyY2VdO1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgbC50YXJnZXQgPT0gXCJudW1iZXJcIilcbiAgICAgICAgICAgICAgICAgICAgbC50YXJnZXQgPSBfdGhpcy5fbm9kZXNbbC50YXJnZXRdO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB0aGlzLl9saW5rcy5mb3JFYWNoKGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICAgICAgdmFyIHUgPSBMYXlvdXQuZ2V0U291cmNlSW5kZXgoZSksIHYgPSBMYXlvdXQuZ2V0VGFyZ2V0SW5kZXgoZSk7XG4gICAgICAgICAgICAgICAgR1t1XVt2XSA9IEdbdl1bdV0gPSBlLndlaWdodCB8fCAxO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIEQgPSBkZXNjZW50XzEuRGVzY2VudC5jcmVhdGVTcXVhcmVNYXRyaXgoTiwgZnVuY3Rpb24gKGksIGopIHtcbiAgICAgICAgICAgIHJldHVybiBkaXN0YW5jZXNbaV1bal07XG4gICAgICAgIH0pO1xuICAgICAgICBpZiAodGhpcy5fcm9vdEdyb3VwICYmIHR5cGVvZiB0aGlzLl9yb290R3JvdXAuZ3JvdXBzICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgdmFyIGkgPSBuO1xuICAgICAgICAgICAgdmFyIGFkZEF0dHJhY3Rpb24gPSBmdW5jdGlvbiAoaSwgaiwgc3RyZW5ndGgsIGlkZWFsRGlzdGFuY2UpIHtcbiAgICAgICAgICAgICAgICBHW2ldW2pdID0gR1tqXVtpXSA9IHN0cmVuZ3RoO1xuICAgICAgICAgICAgICAgIERbaV1bal0gPSBEW2pdW2ldID0gaWRlYWxEaXN0YW5jZTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICB0aGlzLl9ncm91cHMuZm9yRWFjaChmdW5jdGlvbiAoZykge1xuICAgICAgICAgICAgICAgIGFkZEF0dHJhY3Rpb24oaSwgaSArIDEsIF90aGlzLl9ncm91cENvbXBhY3RuZXNzLCAwLjEpO1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgZy5ib3VuZHMgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgICAgIHhbaV0gPSB3IC8gMiwgeVtpKytdID0gaCAvIDI7XG4gICAgICAgICAgICAgICAgICAgIHhbaV0gPSB3IC8gMiwgeVtpKytdID0gaCAvIDI7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB4W2ldID0gZy5ib3VuZHMueCwgeVtpKytdID0gZy5ib3VuZHMueTtcbiAgICAgICAgICAgICAgICAgICAgeFtpXSA9IGcuYm91bmRzLlgsIHlbaSsrXSA9IGcuYm91bmRzLlk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgdGhpcy5fcm9vdEdyb3VwID0geyBsZWF2ZXM6IHRoaXMuX25vZGVzLCBncm91cHM6IFtdIH07XG4gICAgICAgIHZhciBjdXJDb25zdHJhaW50cyA9IHRoaXMuX2NvbnN0cmFpbnRzIHx8IFtdO1xuICAgICAgICBpZiAodGhpcy5fZGlyZWN0ZWRMaW5rQ29uc3RyYWludHMpIHtcbiAgICAgICAgICAgIHRoaXMubGlua0FjY2Vzc29yLmdldE1pblNlcGFyYXRpb24gPSB0aGlzLl9kaXJlY3RlZExpbmtDb25zdHJhaW50cy5nZXRNaW5TZXBhcmF0aW9uO1xuICAgICAgICAgICAgY3VyQ29uc3RyYWludHMgPSBjdXJDb25zdHJhaW50cy5jb25jYXQobGlua2xlbmd0aHNfMS5nZW5lcmF0ZURpcmVjdGVkRWRnZUNvbnN0cmFpbnRzKG4sIHRoaXMuX2xpbmtzLCB0aGlzLl9kaXJlY3RlZExpbmtDb25zdHJhaW50cy5heGlzLCAodGhpcy5saW5rQWNjZXNzb3IpKSk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5hdm9pZE92ZXJsYXBzKGZhbHNlKTtcbiAgICAgICAgdGhpcy5fZGVzY2VudCA9IG5ldyBkZXNjZW50XzEuRGVzY2VudChbeCwgeV0sIEQpO1xuICAgICAgICB0aGlzLl9kZXNjZW50LmxvY2tzLmNsZWFyKCk7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbjsgKytpKSB7XG4gICAgICAgICAgICB2YXIgbyA9IHRoaXMuX25vZGVzW2ldO1xuICAgICAgICAgICAgaWYgKG8uZml4ZWQpIHtcbiAgICAgICAgICAgICAgICBvLnB4ID0gby54O1xuICAgICAgICAgICAgICAgIG8ucHkgPSBvLnk7XG4gICAgICAgICAgICAgICAgdmFyIHAgPSBbby54LCBvLnldO1xuICAgICAgICAgICAgICAgIHRoaXMuX2Rlc2NlbnQubG9ja3MuYWRkKGksIHApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHRoaXMuX2Rlc2NlbnQudGhyZXNob2xkID0gdGhpcy5fdGhyZXNob2xkO1xuICAgICAgICB0aGlzLmluaXRpYWxMYXlvdXQoaW5pdGlhbFVuY29uc3RyYWluZWRJdGVyYXRpb25zLCB4LCB5KTtcbiAgICAgICAgaWYgKGN1ckNvbnN0cmFpbnRzLmxlbmd0aCA+IDApXG4gICAgICAgICAgICB0aGlzLl9kZXNjZW50LnByb2plY3QgPSBuZXcgcmVjdGFuZ2xlXzEuUHJvamVjdGlvbih0aGlzLl9ub2RlcywgdGhpcy5fZ3JvdXBzLCB0aGlzLl9yb290R3JvdXAsIGN1ckNvbnN0cmFpbnRzKS5wcm9qZWN0RnVuY3Rpb25zKCk7XG4gICAgICAgIHRoaXMuX2Rlc2NlbnQucnVuKGluaXRpYWxVc2VyQ29uc3RyYWludEl0ZXJhdGlvbnMpO1xuICAgICAgICB0aGlzLnNlcGFyYXRlT3ZlcmxhcHBpbmdDb21wb25lbnRzKHcsIGgsIGNlbnRlckdyYXBoKTtcbiAgICAgICAgdGhpcy5hdm9pZE92ZXJsYXBzKGFvKTtcbiAgICAgICAgaWYgKGFvKSB7XG4gICAgICAgICAgICB0aGlzLl9ub2Rlcy5mb3JFYWNoKGZ1bmN0aW9uICh2LCBpKSB7IHYueCA9IHhbaV0sIHYueSA9IHlbaV07IH0pO1xuICAgICAgICAgICAgdGhpcy5fZGVzY2VudC5wcm9qZWN0ID0gbmV3IHJlY3RhbmdsZV8xLlByb2plY3Rpb24odGhpcy5fbm9kZXMsIHRoaXMuX2dyb3VwcywgdGhpcy5fcm9vdEdyb3VwLCBjdXJDb25zdHJhaW50cywgdHJ1ZSkucHJvamVjdEZ1bmN0aW9ucygpO1xuICAgICAgICAgICAgdGhpcy5fbm9kZXMuZm9yRWFjaChmdW5jdGlvbiAodiwgaSkgeyB4W2ldID0gdi54LCB5W2ldID0gdi55OyB9KTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9kZXNjZW50LkcgPSBHO1xuICAgICAgICB0aGlzLl9kZXNjZW50LnJ1bihpbml0aWFsQWxsQ29uc3RyYWludHNJdGVyYXRpb25zKTtcbiAgICAgICAgaWYgKGdyaWRTbmFwSXRlcmF0aW9ucykge1xuICAgICAgICAgICAgdGhpcy5fZGVzY2VudC5zbmFwU3RyZW5ndGggPSAxMDAwO1xuICAgICAgICAgICAgdGhpcy5fZGVzY2VudC5zbmFwR3JpZFNpemUgPSB0aGlzLl9ub2Rlc1swXS53aWR0aDtcbiAgICAgICAgICAgIHRoaXMuX2Rlc2NlbnQubnVtR3JpZFNuYXBOb2RlcyA9IG47XG4gICAgICAgICAgICB0aGlzLl9kZXNjZW50LnNjYWxlU25hcEJ5TWF4SCA9IG4gIT0gTjtcbiAgICAgICAgICAgIHZhciBHMCA9IGRlc2NlbnRfMS5EZXNjZW50LmNyZWF0ZVNxdWFyZU1hdHJpeChOLCBmdW5jdGlvbiAoaSwgaikge1xuICAgICAgICAgICAgICAgIGlmIChpID49IG4gfHwgaiA+PSBuKVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gR1tpXVtqXTtcbiAgICAgICAgICAgICAgICByZXR1cm4gMDtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgdGhpcy5fZGVzY2VudC5HID0gRzA7XG4gICAgICAgICAgICB0aGlzLl9kZXNjZW50LnJ1bihncmlkU25hcEl0ZXJhdGlvbnMpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMudXBkYXRlTm9kZVBvc2l0aW9ucygpO1xuICAgICAgICB0aGlzLnNlcGFyYXRlT3ZlcmxhcHBpbmdDb21wb25lbnRzKHcsIGgsIGNlbnRlckdyYXBoKTtcbiAgICAgICAgcmV0dXJuIGtlZXBSdW5uaW5nID8gdGhpcy5yZXN1bWUoKSA6IHRoaXM7XG4gICAgfTtcbiAgICBMYXlvdXQucHJvdG90eXBlLmluaXRpYWxMYXlvdXQgPSBmdW5jdGlvbiAoaXRlcmF0aW9ucywgeCwgeSkge1xuICAgICAgICBpZiAodGhpcy5fZ3JvdXBzLmxlbmd0aCA+IDAgJiYgaXRlcmF0aW9ucyA+IDApIHtcbiAgICAgICAgICAgIHZhciBuID0gdGhpcy5fbm9kZXMubGVuZ3RoO1xuICAgICAgICAgICAgdmFyIGVkZ2VzID0gdGhpcy5fbGlua3MubWFwKGZ1bmN0aW9uIChlKSB7IHJldHVybiAoeyBzb3VyY2U6IGUuc291cmNlLmluZGV4LCB0YXJnZXQ6IGUudGFyZ2V0LmluZGV4IH0pOyB9KTtcbiAgICAgICAgICAgIHZhciB2cyA9IHRoaXMuX25vZGVzLm1hcChmdW5jdGlvbiAodikgeyByZXR1cm4gKHsgaW5kZXg6IHYuaW5kZXggfSk7IH0pO1xuICAgICAgICAgICAgdGhpcy5fZ3JvdXBzLmZvckVhY2goZnVuY3Rpb24gKGcsIGkpIHtcbiAgICAgICAgICAgICAgICB2cy5wdXNoKHsgaW5kZXg6IGcuaW5kZXggPSBuICsgaSB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgdGhpcy5fZ3JvdXBzLmZvckVhY2goZnVuY3Rpb24gKGcsIGkpIHtcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGcubGVhdmVzICE9PSAndW5kZWZpbmVkJylcbiAgICAgICAgICAgICAgICAgICAgZy5sZWF2ZXMuZm9yRWFjaChmdW5jdGlvbiAodikgeyByZXR1cm4gZWRnZXMucHVzaCh7IHNvdXJjZTogZy5pbmRleCwgdGFyZ2V0OiB2LmluZGV4IH0pOyB9KTtcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGcuZ3JvdXBzICE9PSAndW5kZWZpbmVkJylcbiAgICAgICAgICAgICAgICAgICAgZy5ncm91cHMuZm9yRWFjaChmdW5jdGlvbiAoZ2cpIHsgcmV0dXJuIGVkZ2VzLnB1c2goeyBzb3VyY2U6IGcuaW5kZXgsIHRhcmdldDogZ2cuaW5kZXggfSk7IH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBuZXcgTGF5b3V0KClcbiAgICAgICAgICAgICAgICAuc2l6ZSh0aGlzLnNpemUoKSlcbiAgICAgICAgICAgICAgICAubm9kZXModnMpXG4gICAgICAgICAgICAgICAgLmxpbmtzKGVkZ2VzKVxuICAgICAgICAgICAgICAgIC5hdm9pZE92ZXJsYXBzKGZhbHNlKVxuICAgICAgICAgICAgICAgIC5saW5rRGlzdGFuY2UodGhpcy5saW5rRGlzdGFuY2UoKSlcbiAgICAgICAgICAgICAgICAuc3ltbWV0cmljRGlmZkxpbmtMZW5ndGhzKDUpXG4gICAgICAgICAgICAgICAgLmNvbnZlcmdlbmNlVGhyZXNob2xkKDFlLTQpXG4gICAgICAgICAgICAgICAgLnN0YXJ0KGl0ZXJhdGlvbnMsIDAsIDAsIDAsIGZhbHNlKTtcbiAgICAgICAgICAgIHRoaXMuX25vZGVzLmZvckVhY2goZnVuY3Rpb24gKHYpIHtcbiAgICAgICAgICAgICAgICB4W3YuaW5kZXhdID0gdnNbdi5pbmRleF0ueDtcbiAgICAgICAgICAgICAgICB5W3YuaW5kZXhdID0gdnNbdi5pbmRleF0ueTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5fZGVzY2VudC5ydW4oaXRlcmF0aW9ucyk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIExheW91dC5wcm90b3R5cGUuc2VwYXJhdGVPdmVybGFwcGluZ0NvbXBvbmVudHMgPSBmdW5jdGlvbiAod2lkdGgsIGhlaWdodCwgY2VudGVyR3JhcGgpIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgaWYgKGNlbnRlckdyYXBoID09PSB2b2lkIDApIHsgY2VudGVyR3JhcGggPSB0cnVlOyB9XG4gICAgICAgIGlmICghdGhpcy5fZGlzdGFuY2VNYXRyaXggJiYgdGhpcy5faGFuZGxlRGlzY29ubmVjdGVkKSB7XG4gICAgICAgICAgICB2YXIgeF8xID0gdGhpcy5fZGVzY2VudC54WzBdLCB5XzEgPSB0aGlzLl9kZXNjZW50LnhbMV07XG4gICAgICAgICAgICB0aGlzLl9ub2Rlcy5mb3JFYWNoKGZ1bmN0aW9uICh2LCBpKSB7IHYueCA9IHhfMVtpXSwgdi55ID0geV8xW2ldOyB9KTtcbiAgICAgICAgICAgIHZhciBncmFwaHMgPSBoYW5kbGVkaXNjb25uZWN0ZWRfMS5zZXBhcmF0ZUdyYXBocyh0aGlzLl9ub2RlcywgdGhpcy5fbGlua3MpO1xuICAgICAgICAgICAgaGFuZGxlZGlzY29ubmVjdGVkXzEuYXBwbHlQYWNraW5nKGdyYXBocywgd2lkdGgsIGhlaWdodCwgdGhpcy5fZGVmYXVsdE5vZGVTaXplLCAxLCBjZW50ZXJHcmFwaCk7XG4gICAgICAgICAgICB0aGlzLl9ub2Rlcy5mb3JFYWNoKGZ1bmN0aW9uICh2LCBpKSB7XG4gICAgICAgICAgICAgICAgX3RoaXMuX2Rlc2NlbnQueFswXVtpXSA9IHYueCwgX3RoaXMuX2Rlc2NlbnQueFsxXVtpXSA9IHYueTtcbiAgICAgICAgICAgICAgICBpZiAodi5ib3VuZHMpIHtcbiAgICAgICAgICAgICAgICAgICAgdi5ib3VuZHMuc2V0WENlbnRyZSh2LngpO1xuICAgICAgICAgICAgICAgICAgICB2LmJvdW5kcy5zZXRZQ2VudHJlKHYueSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIExheW91dC5wcm90b3R5cGUucmVzdW1lID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5hbHBoYSgwLjEpO1xuICAgIH07XG4gICAgTGF5b3V0LnByb3RvdHlwZS5zdG9wID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5hbHBoYSgwKTtcbiAgICB9O1xuICAgIExheW91dC5wcm90b3R5cGUucHJlcGFyZUVkZ2VSb3V0aW5nID0gZnVuY3Rpb24gKG5vZGVNYXJnaW4pIHtcbiAgICAgICAgaWYgKG5vZGVNYXJnaW4gPT09IHZvaWQgMCkgeyBub2RlTWFyZ2luID0gMDsgfVxuICAgICAgICB0aGlzLl92aXNpYmlsaXR5R3JhcGggPSBuZXcgZ2VvbV8xLlRhbmdlbnRWaXNpYmlsaXR5R3JhcGgodGhpcy5fbm9kZXMubWFwKGZ1bmN0aW9uICh2KSB7XG4gICAgICAgICAgICByZXR1cm4gdi5ib3VuZHMuaW5mbGF0ZSgtbm9kZU1hcmdpbikudmVydGljZXMoKTtcbiAgICAgICAgfSkpO1xuICAgIH07XG4gICAgTGF5b3V0LnByb3RvdHlwZS5yb3V0ZUVkZ2UgPSBmdW5jdGlvbiAoZWRnZSwgYWgsIGRyYXcpIHtcbiAgICAgICAgaWYgKGFoID09PSB2b2lkIDApIHsgYWggPSA1OyB9XG4gICAgICAgIHZhciBsaW5lRGF0YSA9IFtdO1xuICAgICAgICB2YXIgdmcyID0gbmV3IGdlb21fMS5UYW5nZW50VmlzaWJpbGl0eUdyYXBoKHRoaXMuX3Zpc2liaWxpdHlHcmFwaC5QLCB7IFY6IHRoaXMuX3Zpc2liaWxpdHlHcmFwaC5WLCBFOiB0aGlzLl92aXNpYmlsaXR5R3JhcGguRSB9KSwgcG9ydDEgPSB7IHg6IGVkZ2Uuc291cmNlLngsIHk6IGVkZ2Uuc291cmNlLnkgfSwgcG9ydDIgPSB7IHg6IGVkZ2UudGFyZ2V0LngsIHk6IGVkZ2UudGFyZ2V0LnkgfSwgc3RhcnQgPSB2ZzIuYWRkUG9pbnQocG9ydDEsIGVkZ2Uuc291cmNlLmluZGV4KSwgZW5kID0gdmcyLmFkZFBvaW50KHBvcnQyLCBlZGdlLnRhcmdldC5pbmRleCk7XG4gICAgICAgIHZnMi5hZGRFZGdlSWZWaXNpYmxlKHBvcnQxLCBwb3J0MiwgZWRnZS5zb3VyY2UuaW5kZXgsIGVkZ2UudGFyZ2V0LmluZGV4KTtcbiAgICAgICAgaWYgKHR5cGVvZiBkcmF3ICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgZHJhdyh2ZzIpO1xuICAgICAgICB9XG4gICAgICAgIHZhciBzb3VyY2VJbmQgPSBmdW5jdGlvbiAoZSkgeyByZXR1cm4gZS5zb3VyY2UuaWQ7IH0sIHRhcmdldEluZCA9IGZ1bmN0aW9uIChlKSB7IHJldHVybiBlLnRhcmdldC5pZDsgfSwgbGVuZ3RoID0gZnVuY3Rpb24gKGUpIHsgcmV0dXJuIGUubGVuZ3RoKCk7IH0sIHNwQ2FsYyA9IG5ldyBzaG9ydGVzdHBhdGhzXzEuQ2FsY3VsYXRvcih2ZzIuVi5sZW5ndGgsIHZnMi5FLCBzb3VyY2VJbmQsIHRhcmdldEluZCwgbGVuZ3RoKSwgc2hvcnRlc3RQYXRoID0gc3BDYWxjLlBhdGhGcm9tTm9kZVRvTm9kZShzdGFydC5pZCwgZW5kLmlkKTtcbiAgICAgICAgaWYgKHNob3J0ZXN0UGF0aC5sZW5ndGggPT09IDEgfHwgc2hvcnRlc3RQYXRoLmxlbmd0aCA9PT0gdmcyLlYubGVuZ3RoKSB7XG4gICAgICAgICAgICB2YXIgcm91dGUgPSByZWN0YW5nbGVfMS5tYWtlRWRnZUJldHdlZW4oZWRnZS5zb3VyY2UuaW5uZXJCb3VuZHMsIGVkZ2UudGFyZ2V0LmlubmVyQm91bmRzLCBhaCk7XG4gICAgICAgICAgICBsaW5lRGF0YSA9IFtyb3V0ZS5zb3VyY2VJbnRlcnNlY3Rpb24sIHJvdXRlLmFycm93U3RhcnRdO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdmFyIG4gPSBzaG9ydGVzdFBhdGgubGVuZ3RoIC0gMiwgcCA9IHZnMi5WW3Nob3J0ZXN0UGF0aFtuXV0ucCwgcSA9IHZnMi5WW3Nob3J0ZXN0UGF0aFswXV0ucCwgbGluZURhdGEgPSBbZWRnZS5zb3VyY2UuaW5uZXJCb3VuZHMucmF5SW50ZXJzZWN0aW9uKHAueCwgcC55KV07XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gbjsgaSA+PSAwOyAtLWkpXG4gICAgICAgICAgICAgICAgbGluZURhdGEucHVzaCh2ZzIuVltzaG9ydGVzdFBhdGhbaV1dLnApO1xuICAgICAgICAgICAgbGluZURhdGEucHVzaChyZWN0YW5nbGVfMS5tYWtlRWRnZVRvKHEsIGVkZ2UudGFyZ2V0LmlubmVyQm91bmRzLCBhaCkpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBsaW5lRGF0YTtcbiAgICB9O1xuICAgIExheW91dC5nZXRTb3VyY2VJbmRleCA9IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgIHJldHVybiB0eXBlb2YgZS5zb3VyY2UgPT09ICdudW1iZXInID8gZS5zb3VyY2UgOiBlLnNvdXJjZS5pbmRleDtcbiAgICB9O1xuICAgIExheW91dC5nZXRUYXJnZXRJbmRleCA9IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgIHJldHVybiB0eXBlb2YgZS50YXJnZXQgPT09ICdudW1iZXInID8gZS50YXJnZXQgOiBlLnRhcmdldC5pbmRleDtcbiAgICB9O1xuICAgIExheW91dC5saW5rSWQgPSBmdW5jdGlvbiAoZSkge1xuICAgICAgICByZXR1cm4gTGF5b3V0LmdldFNvdXJjZUluZGV4KGUpICsgXCItXCIgKyBMYXlvdXQuZ2V0VGFyZ2V0SW5kZXgoZSk7XG4gICAgfTtcbiAgICBMYXlvdXQuZHJhZ1N0YXJ0ID0gZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgaWYgKGlzR3JvdXAoZCkpIHtcbiAgICAgICAgICAgIExheW91dC5zdG9yZU9mZnNldChkLCBMYXlvdXQuZHJhZ09yaWdpbihkKSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBMYXlvdXQuc3RvcE5vZGUoZCk7XG4gICAgICAgICAgICBkLmZpeGVkIHw9IDI7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIExheW91dC5zdG9wTm9kZSA9IGZ1bmN0aW9uICh2KSB7XG4gICAgICAgIHYucHggPSB2Lng7XG4gICAgICAgIHYucHkgPSB2Lnk7XG4gICAgfTtcbiAgICBMYXlvdXQuc3RvcmVPZmZzZXQgPSBmdW5jdGlvbiAoZCwgb3JpZ2luKSB7XG4gICAgICAgIGlmICh0eXBlb2YgZC5sZWF2ZXMgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICBkLmxlYXZlcy5mb3JFYWNoKGZ1bmN0aW9uICh2KSB7XG4gICAgICAgICAgICAgICAgdi5maXhlZCB8PSAyO1xuICAgICAgICAgICAgICAgIExheW91dC5zdG9wTm9kZSh2KTtcbiAgICAgICAgICAgICAgICB2Ll9kcmFnR3JvdXBPZmZzZXRYID0gdi54IC0gb3JpZ2luLng7XG4gICAgICAgICAgICAgICAgdi5fZHJhZ0dyb3VwT2Zmc2V0WSA9IHYueSAtIG9yaWdpbi55O1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHR5cGVvZiBkLmdyb3VwcyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIGQuZ3JvdXBzLmZvckVhY2goZnVuY3Rpb24gKGcpIHsgcmV0dXJuIExheW91dC5zdG9yZU9mZnNldChnLCBvcmlnaW4pOyB9KTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgTGF5b3V0LmRyYWdPcmlnaW4gPSBmdW5jdGlvbiAoZCkge1xuICAgICAgICBpZiAoaXNHcm91cChkKSkge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICB4OiBkLmJvdW5kcy5jeCgpLFxuICAgICAgICAgICAgICAgIHk6IGQuYm91bmRzLmN5KClcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gZDtcbiAgICAgICAgfVxuICAgIH07XG4gICAgTGF5b3V0LmRyYWcgPSBmdW5jdGlvbiAoZCwgcG9zaXRpb24pIHtcbiAgICAgICAgaWYgKGlzR3JvdXAoZCkpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgZC5sZWF2ZXMgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgZC5sZWF2ZXMuZm9yRWFjaChmdW5jdGlvbiAodikge1xuICAgICAgICAgICAgICAgICAgICBkLmJvdW5kcy5zZXRYQ2VudHJlKHBvc2l0aW9uLngpO1xuICAgICAgICAgICAgICAgICAgICBkLmJvdW5kcy5zZXRZQ2VudHJlKHBvc2l0aW9uLnkpO1xuICAgICAgICAgICAgICAgICAgICB2LnB4ID0gdi5fZHJhZ0dyb3VwT2Zmc2V0WCArIHBvc2l0aW9uLng7XG4gICAgICAgICAgICAgICAgICAgIHYucHkgPSB2Ll9kcmFnR3JvdXBPZmZzZXRZICsgcG9zaXRpb24ueTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0eXBlb2YgZC5ncm91cHMgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgZC5ncm91cHMuZm9yRWFjaChmdW5jdGlvbiAoZykgeyByZXR1cm4gTGF5b3V0LmRyYWcoZywgcG9zaXRpb24pOyB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGQucHggPSBwb3NpdGlvbi54O1xuICAgICAgICAgICAgZC5weSA9IHBvc2l0aW9uLnk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIExheW91dC5kcmFnRW5kID0gZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgaWYgKGlzR3JvdXAoZCkpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgZC5sZWF2ZXMgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgZC5sZWF2ZXMuZm9yRWFjaChmdW5jdGlvbiAodikge1xuICAgICAgICAgICAgICAgICAgICBMYXlvdXQuZHJhZ0VuZCh2KTtcbiAgICAgICAgICAgICAgICAgICAgZGVsZXRlIHYuX2RyYWdHcm91cE9mZnNldFg7XG4gICAgICAgICAgICAgICAgICAgIGRlbGV0ZSB2Ll9kcmFnR3JvdXBPZmZzZXRZO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHR5cGVvZiBkLmdyb3VwcyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICBkLmdyb3Vwcy5mb3JFYWNoKExheW91dC5kcmFnRW5kKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGQuZml4ZWQgJj0gfjY7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIExheW91dC5tb3VzZU92ZXIgPSBmdW5jdGlvbiAoZCkge1xuICAgICAgICBkLmZpeGVkIHw9IDQ7XG4gICAgICAgIGQucHggPSBkLngsIGQucHkgPSBkLnk7XG4gICAgfTtcbiAgICBMYXlvdXQubW91c2VPdXQgPSBmdW5jdGlvbiAoZCkge1xuICAgICAgICBkLmZpeGVkICY9IH40O1xuICAgIH07XG4gICAgcmV0dXJuIExheW91dDtcbn0oKSk7XG5leHBvcnRzLkxheW91dCA9IExheW91dDtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWRhdGE6YXBwbGljYXRpb24vanNvbjtiYXNlNjQsZXlKMlpYSnphVzl1SWpvekxDSm1hV3hsSWpvaWJHRjViM1YwTG1weklpd2ljMjkxY21ObFVtOXZkQ0k2SWlJc0luTnZkWEpqWlhNaU9sc2lMaTR2TGk0dlYyVmlRMjlzWVM5emNtTXZiR0Y1YjNWMExuUnpJbDBzSW01aGJXVnpJanBiWFN3aWJXRndjR2x1WjNNaU9pSTdPMEZCUVVFc2VVTkJRVEJETzBGQlF6RkRMRFpEUVVFclNEdEJRVU12U0N4eFEwRkJhVU03UVVGRGFrTXNlVU5CUVRoRk8wRkJRemxGTEdsRVFVRXdRenRCUVVNeFF5d3JRa0ZCZFVRN1FVRkRka1FzTWtSQlFXbEZPMEZCVHpkRUxFbEJRVmtzVTBGQk9FSTdRVUZCTVVNc1YwRkJXU3hUUVVGVE8wbEJRVWNzTWtOQlFVc3NRMEZCUVR0SlFVRkZMSGxEUVVGSkxFTkJRVUU3U1VGQlJTeDFRMEZCUnl4RFFVRkJPMEZCUVVNc1EwRkJReXhGUVVFNVFpeFRRVUZUTEVkQlFWUXNhVUpCUVZNc1MwRkJWQ3hwUWtGQlV5eFJRVUZ4UWp0QlFVRkJMRU5CUVVNN1FVRXJRek5ETEZOQlFWTXNUMEZCVHl4RFFVRkRMRU5CUVUwN1NVRkRia0lzVDBGQlR5eFBRVUZQTEVOQlFVTXNRMEZCUXl4TlFVRk5MRXRCUVVzc1YwRkJWeXhKUVVGSkxFOUJRVThzUTBGQlF5eERRVUZETEUxQlFVMHNTMEZCU3l4WFFVRlhMRU5CUVVNN1FVRkRPVVVzUTBGQlF6dEJRWGRDUkR0SlFVRkJPMUZCUVVFc2FVSkJkWGxDUXp0UlFYUjVRbGNzWjBKQlFWY3NSMEZCUnl4RFFVRkRMRU5CUVVNc1JVRkJSU3hEUVVGRExFTkJRVU1zUTBGQlF6dFJRVU55UWl4clFrRkJZU3hIUVVGNVF5eEZRVUZGTEVOQlFVTTdVVUZEZWtRc2NVSkJRV2RDTEVkQlFWY3NSVUZCUlN4RFFVRkRPMUZCUXpsQ0xEQkNRVUZ4UWl4SFFVRkhMRWxCUVVrc1EwRkJRenRSUVVNM1FpeGpRVUZUTEVkQlFVY3NTVUZCU1N4RFFVRkRPMUZCUTJwQ0xHMUNRVUZqTEVkQlFVY3NTMEZCU3l4RFFVRkRPMUZCUTNaQ0xIZENRVUZ0UWl4SFFVRkhMRWxCUVVrc1EwRkJRenRSUVVjelFpeGhRVUZSTEVkQlFVY3NTMEZCU3l4RFFVRkRPMUZCUTJwQ0xGZEJRVTBzUjBGQlJ5eEZRVUZGTEVOQlFVTTdVVUZEV2l4WlFVRlBMRWRCUVVjc1JVRkJSU3hEUVVGRE8xRkJRMklzWlVGQlZTeEhRVUZITEVsQlFVa3NRMEZCUXp0UlFVTnNRaXhYUVVGTkxFZEJRVEJDTEVWQlFVVXNRMEZCUXp0UlFVTnVReXhwUWtGQldTeEhRVUZITEVWQlFVVXNRMEZCUXp0UlFVTnNRaXh2UWtGQlpTeEhRVUZITEVsQlFVa3NRMEZCUXp0UlFVTjJRaXhoUVVGUkxFZEJRVmtzU1VGQlNTeERRVUZETzFGQlEzcENMRFpDUVVGM1FpeEhRVUZITEVsQlFVa3NRMEZCUXp0UlFVTm9ReXhsUVVGVkxFZEJRVWNzU1VGQlNTeERRVUZETzFGQlEyeENMSEZDUVVGblFpeEhRVUZITEVsQlFVa3NRMEZCUXp0UlFVTjRRaXh6UWtGQmFVSXNSMEZCUnl4SlFVRkpMRU5CUVVNN1VVRkhka0lzVlVGQlN5eEhRVUZITEVsQlFVa3NRMEZCUXp0UlFXdFdka0lzYVVKQlFWa3NSMEZCTWtJN1dVRkRia01zWTBGQll5eEZRVUZGTEUxQlFVMHNRMEZCUXl4alFVRmpPMWxCUTNKRExHTkJRV01zUlVGQlJTeE5RVUZOTEVOQlFVTXNZMEZCWXp0WlFVTnlReXhUUVVGVExFVkJRVVVzVFVGQlRTeERRVUZETEdGQlFXRTdXVUZETDBJc1QwRkJUeXhGUVVGRkxGVkJRVUVzUTBGQlF5eEpRVUZKTEU5QlFVRXNUMEZCVHl4TFFVRkpMRU5CUVVNc1UwRkJVeXhMUVVGTExGVkJRVlVzUTBGQlF5eERRVUZETEVOQlFVTXNTMEZCU1N4RFFVRkRMRk5CUVZNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RlFVRTFSQ3hEUVVFMFJEdFRRVU0zUlN4RFFVRkRPMGxCZDJKT0xFTkJRVU03U1VFemQwSlZMRzFDUVVGRkxFZEJRVlFzVlVGQlZTeERRVUZ4UWl4RlFVRkZMRkZCUVdsRE8xRkJSVGxFTEVsQlFVa3NRMEZCUXl4SlFVRkpMRU5CUVVNc1MwRkJTenRaUVVGRkxFbEJRVWtzUTBGQlF5eExRVUZMTEVkQlFVY3NSVUZCUlN4RFFVRkRPMUZCUTJwRExFbEJRVWtzVDBGQlR5eERRVUZETEV0QlFVc3NVVUZCVVN4RlFVRkZPMWxCUTNaQ0xFbEJRVWtzUTBGQlF5eExRVUZMTEVOQlFVTXNVMEZCVXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFZEJRVWNzVVVGQlVTeERRVUZETzFOQlEzWkRPMkZCUVUwN1dVRkRTQ3hKUVVGSkxFTkJRVU1zUzBGQlN5eERRVUZETEVOQlFVTXNRMEZCUXl4SFFVRkhMRkZCUVZFc1EwRkJRenRUUVVNMVFqdFJRVU5FTEU5QlFVOHNTVUZCU1N4RFFVRkRPMGxCUTJoQ0xFTkJRVU03U1VGSlV5eDNRa0ZCVHl4SFFVRnFRaXhWUVVGclFpeERRVUZSTzFGQlEzUkNMRWxCUVVrc1NVRkJTU3hEUVVGRExFdEJRVXNzU1VGQlNTeFBRVUZQTEVsQlFVa3NRMEZCUXl4TFFVRkxMRU5CUVVNc1EwRkJReXhEUVVGRExFbEJRVWtzUTBGQlF5eExRVUZMTEZkQlFWY3NSVUZCUlR0WlFVTjZSQ3hKUVVGSkxFTkJRVU1zUzBGQlN5eERRVUZETEVOQlFVTXNRMEZCUXl4SlFVRkpMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dFRRVU42UWp0SlFVTk1MRU5CUVVNN1NVRkxVeXh4UWtGQlNTeEhRVUZrTzFGQlEwa3NUMEZCVHl4RFFVRkRMRWxCUVVrc1EwRkJReXhKUVVGSkxFVkJRVVU3V1VGQlF5eERRVUZETzBsQlEzcENMRU5CUVVNN1NVRkxVeXh4UWtGQlNTeEhRVUZrTzFGQlEwa3NTVUZCU1N4SlFVRkpMRU5CUVVNc1RVRkJUU3hIUVVGSExFbEJRVWtzUTBGQlF5eFZRVUZWTEVWQlFVVTdXVUZETDBJc1NVRkJTU3hEUVVGRExGRkJRVkVzUjBGQlJ5eExRVUZMTEVOQlFVTTdXVUZEZEVJc1NVRkJTU3hEUVVGRExFOUJRVThzUTBGQlF5eEZRVUZGTEVsQlFVa3NSVUZCUlN4VFFVRlRMRU5CUVVNc1IwRkJSeXhGUVVGRkxFdEJRVXNzUlVGQlJTeEpRVUZKTEVOQlFVTXNUVUZCVFN4SFFVRkhMRU5CUVVNc1JVRkJSU3hOUVVGTkxFVkJRVVVzU1VGQlNTeERRVUZETEZkQlFWY3NSVUZCUlN4RFFVRkRMRU5CUVVNN1dVRkRlRVlzVDBGQlR5eEpRVUZKTEVOQlFVTTdVMEZEWmp0UlFVTkVMRWxCUVUwc1EwRkJReXhIUVVGSExFbEJRVWtzUTBGQlF5eE5RVUZOTEVOQlFVTXNUVUZCVFN4RlFVTjBRaXhEUVVGRExFZEJRVWNzU1VGQlNTeERRVUZETEUxQlFVMHNRMEZCUXl4TlFVRk5MRU5CUVVNN1VVRkROMElzU1VGQlNTeERRVUZETEVWQlFVVXNRMEZCUXl4RFFVRkRPMUZCUlZRc1NVRkJTU3hEUVVGRExGRkJRVkVzUTBGQlF5eExRVUZMTEVOQlFVTXNTMEZCU3l4RlFVRkZMRU5CUVVNN1VVRkROVUlzUzBGQlN5eERRVUZETEVkQlFVY3NRMEZCUXl4RlFVRkZMRU5CUVVNc1IwRkJSeXhEUVVGRExFVkJRVVVzUlVGQlJTeERRVUZETEVWQlFVVTdXVUZEY0VJc1EwRkJReXhIUVVGSExFbEJRVWtzUTBGQlF5eE5RVUZOTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1dVRkRia0lzU1VGQlNTeERRVUZETEVOQlFVTXNTMEZCU3l4RlFVRkZPMmRDUVVOVUxFbEJRVWtzVDBGQlR5eERRVUZETEVOQlFVTXNSVUZCUlN4TFFVRkxMRmRCUVZjc1NVRkJTU3hQUVVGUExFTkJRVU1zUTBGQlF5eEZRVUZGTEV0QlFVc3NWMEZCVnl4RlFVRkZPMjlDUVVNMVJDeERRVUZETEVOQlFVTXNSVUZCUlN4SFFVRkhMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU03YjBKQlExZ3NRMEZCUXl4RFFVRkRMRVZCUVVVc1IwRkJSeXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETzJsQ1FVTmtPMmRDUVVORUxFbEJRVWtzUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXl4RFFVRkRMRVZCUVVVc1JVRkJSU3hEUVVGRExFTkJRVU1zUlVGQlJTeERRVUZETEVOQlFVTTdaMEpCUTNKQ0xFbEJRVWtzUTBGQlF5eFJRVUZSTEVOQlFVTXNTMEZCU3l4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRExFVkJRVVVzUTBGQlF5eERRVUZETEVOQlFVTTdZVUZEYWtNN1UwRkRTanRSUVVWRUxFbEJRVWtzUlVGQlJTeEhRVUZITEVsQlFVa3NRMEZCUXl4UlFVRlJMRU5CUVVNc1ZVRkJWU3hGUVVGRkxFTkJRVU03VVVGRmNFTXNTVUZCU1N4RlFVRkZMRXRCUVVzc1EwRkJReXhGUVVGRk8xbEJRMVlzU1VGQlNTeERRVUZETEUxQlFVMHNSMEZCUnl4RFFVRkRMRU5CUVVNN1UwRkRia0k3WVVGQlRTeEpRVUZKTEU5QlFVOHNTVUZCU1N4RFFVRkRMRmRCUVZjc1MwRkJTeXhYUVVGWExFVkJRVVU3V1VGRGFFUXNTVUZCU1N4RFFVRkRMRTFCUVUwc1IwRkJSeXhGUVVGRkxFTkJRVU03VTBGRGNFSTdVVUZEUkN4SlFVRkpMRU5CUVVNc1YwRkJWeXhIUVVGSExFVkJRVVVzUTBGQlF6dFJRVVYwUWl4SlFVRkpMRU5CUVVNc2JVSkJRVzFDTEVWQlFVVXNRMEZCUXp0UlFVVXpRaXhKUVVGSkxFTkJRVU1zVDBGQlR5eERRVUZETEVWQlFVVXNTVUZCU1N4RlFVRkZMRk5CUVZNc1EwRkJReXhKUVVGSkxFVkJRVVVzUzBGQlN5eEZRVUZGTEVsQlFVa3NRMEZCUXl4TlFVRk5MRVZCUVVVc1RVRkJUU3hGUVVGRkxFbEJRVWtzUTBGQlF5eFhRVUZYTEVWQlFVVXNRMEZCUXl4RFFVRkRPMUZCUTNKR0xFOUJRVThzUzBGQlN5eERRVUZETzBsQlEycENMRU5CUVVNN1NVRkhUeXh2UTBGQmJVSXNSMEZCTTBJN1VVRkRTU3hKUVVGTkxFTkJRVU1zUjBGQlJ5eEpRVUZKTEVOQlFVTXNVVUZCVVN4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUlVGQlJTeERRVUZETEVkQlFVY3NTVUZCU1N4RFFVRkRMRkZCUVZFc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTTdVVUZEY2tRc1NVRkJTU3hEUVVGRExFVkJRVVVzUTBGQlF5eEhRVUZITEVsQlFVa3NRMEZCUXl4TlFVRk5MRU5CUVVNc1RVRkJUU3hEUVVGRE8xRkJRemxDTEU5QlFVOHNRMEZCUXl4RlFVRkZMRVZCUVVVN1dVRkRVaXhEUVVGRExFZEJRVWNzU1VGQlNTeERRVUZETEUxQlFVMHNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJRenRaUVVOdVFpeERRVUZETEVOQlFVTXNRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dFpRVU5ZTEVOQlFVTXNRMEZCUXl4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETzFOQlEyUTdTVUZEVEN4RFFVRkRPMGxCVjBRc2MwSkJRVXNzUjBGQlRDeFZRVUZOTEVOQlFVODdVVUZEVkN4SlFVRkpMRU5CUVVNc1EwRkJReXhGUVVGRk8xbEJRMG9zU1VGQlNTeEpRVUZKTEVOQlFVTXNUVUZCVFN4RFFVRkRMRTFCUVUwc1MwRkJTeXhEUVVGRExFbEJRVWtzU1VGQlNTeERRVUZETEUxQlFVMHNRMEZCUXl4TlFVRk5MRWRCUVVjc1EwRkJReXhGUVVGRk8yZENRVWR3UkN4SlFVRkpMRU5CUVVNc1IwRkJSeXhEUVVGRExFTkJRVU03WjBKQlExWXNTVUZCU1N4RFFVRkRMRTFCUVUwc1EwRkJReXhQUVVGUExFTkJRVU1zVlVGQlZTeERRVUZETzI5Q1FVTXpRaXhEUVVGRExFZEJRVWNzU1VGQlNTeERRVUZETEVkQlFVY3NRMEZCUXl4RFFVRkRMRVZCUVZVc1EwRkJReXhEUVVGRExFMUJRVTBzUlVGQlZTeERRVUZETEVOQlFVTXNUVUZCVFN4RFFVRkRMRU5CUVVNN1owSkJRM2hFTEVOQlFVTXNRMEZCUXl4RFFVRkRPMmRDUVVOSUxFbEJRVWtzUTBGQlF5eE5RVUZOTEVkQlFVY3NTVUZCU1N4TFFVRkxMRU5CUVVNc1JVRkJSU3hEUVVGRExFTkJRVU1zUTBGQlF6dG5Ra0ZETjBJc1MwRkJTeXhKUVVGSkxFTkJRVU1zUjBGQlJ5eERRVUZETEVWQlFVVXNRMEZCUXl4SFFVRkhMRU5CUVVNc1JVRkJSU3hGUVVGRkxFTkJRVU1zUlVGQlJUdHZRa0ZEZUVJc1NVRkJTU3hEUVVGRExFMUJRVTBzUTBGQlF5eERRVUZETEVOQlFVTXNSMEZCUnl4RlFVRkZMRU5CUVVNN2FVSkJRM1pDTzJGQlEwbzdXVUZEUkN4UFFVRlBMRWxCUVVrc1EwRkJReXhOUVVGTkxFTkJRVU03VTBGRGRFSTdVVUZEUkN4SlFVRkpMRU5CUVVNc1RVRkJUU3hIUVVGSExFTkJRVU1zUTBGQlF6dFJRVU5vUWl4UFFVRlBMRWxCUVVrc1EwRkJRenRKUVVOb1FpeERRVUZETzBsQlUwUXNkVUpCUVUwc1IwRkJUaXhWUVVGUExFTkJRV2RDTzFGQlFYWkNMR2xDUVhWQ1F6dFJRWFJDUnl4SlFVRkpMRU5CUVVNc1EwRkJRenRaUVVGRkxFOUJRVThzU1VGQlNTeERRVUZETEU5QlFVOHNRMEZCUXp0UlFVTTFRaXhKUVVGSkxFTkJRVU1zVDBGQlR5eEhRVUZITEVOQlFVTXNRMEZCUXp0UlFVTnFRaXhKUVVGSkxFTkJRVU1zVlVGQlZTeEhRVUZITEVWQlFVVXNRMEZCUXp0UlFVTnlRaXhKUVVGSkxFTkJRVU1zVDBGQlR5eERRVUZETEU5QlFVOHNRMEZCUXl4VlFVRkJMRU5CUVVNN1dVRkRiRUlzU1VGQlNTeFBRVUZQTEVOQlFVTXNRMEZCUXl4UFFVRlBMRXRCUVVzc1YwRkJWenRuUWtGRGFFTXNRMEZCUXl4RFFVRkRMRTlCUVU4c1IwRkJSeXhEUVVGRExFTkJRVU03V1VGRGJFSXNTVUZCU1N4UFFVRlBMRU5CUVVNc1EwRkJReXhOUVVGTkxFdEJRVXNzVjBGQlZ5eEZRVUZGTzJkQ1FVTnFReXhEUVVGRExFTkJRVU1zVFVGQlRTeERRVUZETEU5QlFVOHNRMEZCUXl4VlFVRkRMRU5CUVVNc1JVRkJSU3hEUVVGRE8yOUNRVU5zUWl4SlFVRkpMRTlCUVU4c1EwRkJReXhMUVVGTExGRkJRVkU3ZDBKQlEzSkNMRU5CUVVNc1EwRkJReXhEUVVGRExFMUJRVTBzUTBGQlF5eERRVUZETEVOQlFVTXNSMEZCUnl4TFFVRkpMRU5CUVVNc1RVRkJUU3hEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNUVUZCVFN4SFFVRkhMRU5CUVVNc1EwRkJRVHRuUWtGRGFrUXNRMEZCUXl4RFFVRkRMRU5CUVVNN1lVRkRUanRaUVVORUxFbEJRVWtzVDBGQlR5eERRVUZETEVOQlFVTXNUVUZCVFN4TFFVRkxMRmRCUVZjc1JVRkJSVHRuUWtGRGFrTXNRMEZCUXl4RFFVRkRMRTFCUVUwc1EwRkJReXhQUVVGUExFTkJRVU1zVlVGQlF5eEZRVUZGTEVWQlFVVXNRMEZCUXp0dlFrRkRia0lzU1VGQlNTeFBRVUZQTEVWQlFVVXNTMEZCU3l4UlFVRlJPM2RDUVVOMFFpeERRVUZETEVOQlFVTXNRMEZCUXl4TlFVRk5MRU5CUVVNc1EwRkJReXhEUVVGRExFZEJRVWNzUzBGQlNTeERRVUZETEU5QlFVOHNRMEZCUXl4RlFVRkZMRU5CUVVNc1EwRkJReXhEUVVGRExFMUJRVTBzUjBGQlJ5eERRVUZETEVOQlFVRTdaMEpCUTI1RUxFTkJRVU1zUTBGQlF5eERRVUZETzJGQlEwNDdVVUZEVEN4RFFVRkRMRU5CUVVNc1EwRkJRenRSUVVOSUxFbEJRVWtzUTBGQlF5eFZRVUZWTEVOQlFVTXNUVUZCVFN4SFFVRkhMRWxCUVVrc1EwRkJReXhOUVVGTkxFTkJRVU1zVFVGQlRTeERRVUZETEZWQlFVRXNRMEZCUXl4SlFVRkpMRTlCUVVFc1QwRkJUeXhEUVVGRExFTkJRVU1zVFVGQlRTeExRVUZMTEZkQlFWY3NSVUZCTDBJc1EwRkJLMElzUTBGQlF5eERRVUZETzFGQlEyeEdMRWxCUVVrc1EwRkJReXhWUVVGVkxFTkJRVU1zVFVGQlRTeEhRVUZITEVsQlFVa3NRMEZCUXl4UFFVRlBMRU5CUVVNc1RVRkJUU3hEUVVGRExGVkJRVUVzUTBGQlF5eEpRVUZKTEU5QlFVRXNUMEZCVHl4RFFVRkRMRU5CUVVNc1RVRkJUU3hMUVVGTExGZEJRVmNzUlVGQkwwSXNRMEZCSzBJc1EwRkJReXhEUVVGRE8xRkJRMjVHTEU5QlFVOHNTVUZCU1N4RFFVRkRPMGxCUTJoQ0xFTkJRVU03U1VGRlJDeHBRMEZCWjBJc1IwRkJhRUlzVlVGQmFVSXNRMEZCVnp0UlFVTjRRaXhKUVVGSkxFTkJRVU1zUjBGQlJ5eFZRVUZWTEVOQlFVTXNVMEZCVXl4RFFVRkRMRWxCUVVrc1EwRkJReXhOUVVGTkxFVkJRVVVzU1VGQlNTeERRVUZETEUxQlFVMHNSVUZCUlN4SlFVRkpMRU5CUVVNc1dVRkJXU3hGUVVGRkxFbEJRVWtzUTBGQlF5eFZRVUZWTEVOQlFVTXNRMEZCUXp0UlFVTXpSaXhKUVVGSkxFTkJRVU1zVFVGQlRTeERRVUZETEVOQlFVTXNRMEZCUXl4TlFVRk5MRU5CUVVNc1EwRkJRenRSUVVOMFFpeERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1VVRkRUQ3hQUVVGUExFbEJRVWtzUTBGQlF6dEpRVU5vUWl4RFFVRkRPMGxCVlVRc09FSkJRV0VzUjBGQllpeFZRVUZqTEVOQlFWYzdVVUZEY2tJc1NVRkJTU3hEUVVGRExGTkJRVk1zUTBGQlF5eE5RVUZOTzFsQlFVVXNUMEZCVHl4SlFVRkpMRU5CUVVNc1kwRkJZeXhEUVVGRE8xRkJRMnhFTEVsQlFVa3NRMEZCUXl4alFVRmpMRWRCUVVjc1EwRkJReXhEUVVGRE8xRkJRM2hDTEU5QlFVOHNTVUZCU1N4RFFVRkRPMGxCUTJoQ0xFTkJRVU03U1VGWlJDeHRRMEZCYTBJc1IwRkJiRUlzVlVGQmJVSXNRMEZCVnp0UlFVTXhRaXhKUVVGSkxFTkJRVU1zVTBGQlV5eERRVUZETEUxQlFVMDdXVUZCUlN4UFFVRlBMRWxCUVVrc1EwRkJReXh0UWtGQmJVSXNRMEZCUXp0UlFVTjJSQ3hKUVVGSkxFTkJRVU1zYlVKQlFXMUNMRWRCUVVjc1EwRkJReXhEUVVGRE8xRkJRemRDTEU5QlFVOHNTVUZCU1N4RFFVRkRPMGxCUTJoQ0xFTkJRVU03U1VGUlJDd3lRa0ZCVlN4SFFVRldMRlZCUVZjc1NVRkJXU3hGUVVGRkxHRkJRWGRETzFGQlF6ZEVMRWxCUVVrc1EwRkJReXhUUVVGVExFTkJRVU1zVFVGQlRUdFpRVUZGTEVsQlFVa3NSMEZCUnl4SFFVRkhMRU5CUVVNN1VVRkRiRU1zU1VGQlNTeERRVUZETEhkQ1FVRjNRaXhIUVVGSE8xbEJRelZDTEVsQlFVa3NSVUZCUlN4SlFVRkpPMWxCUTFZc1owSkJRV2RDTEVWQlFVVXNUMEZCVHl4aFFVRmhMRXRCUVVzc1VVRkJVU3hEUVVGRExFTkJRVU1zUTBGQlF5eGpRVUZqTEU5QlFVOHNZVUZCWVN4RFFVRkJMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eGhRVUZoTzFOQlF6ZEhMRU5CUVVNN1VVRkRSaXhQUVVGUExFbEJRVWtzUTBGQlF6dEpRVU5vUWl4RFFVRkRPMGxCVTBRc2MwSkJRVXNzUjBGQlRDeFZRVUZOTEVOQlFUUkNPMUZCUXpsQ0xFbEJRVWtzUTBGQlF5eFRRVUZUTEVOQlFVTXNUVUZCVFR0WlFVRkZMRTlCUVU4c1NVRkJTU3hEUVVGRExFMUJRVTBzUTBGQlF6dFJRVU14UXl4SlFVRkpMRU5CUVVNc1RVRkJUU3hIUVVGSExFTkJRVU1zUTBGQlF6dFJRVU5vUWl4UFFVRlBMRWxCUVVrc1EwRkJRenRKUVVOb1FpeERRVUZETzBsQlZVUXNORUpCUVZjc1IwRkJXQ3hWUVVGWkxFTkJRV003VVVGRGRFSXNTVUZCU1N4RFFVRkRMRk5CUVZNc1EwRkJReXhOUVVGTk8xbEJRVVVzVDBGQlR5eEpRVUZKTEVOQlFVTXNXVUZCV1N4RFFVRkRPMUZCUTJoRUxFbEJRVWtzUTBGQlF5eFpRVUZaTEVkQlFVY3NRMEZCUXl4RFFVRkRPMUZCUTNSQ0xFOUJRVThzU1VGQlNTeERRVUZETzBsQlEyaENMRU5CUVVNN1NVRlhSQ3dyUWtGQll5eEhRVUZrTEZWQlFXVXNRMEZCVHp0UlFVTnNRaXhKUVVGSkxFTkJRVU1zVTBGQlV5eERRVUZETEUxQlFVMDdXVUZCUlN4UFFVRlBMRWxCUVVrc1EwRkJReXhsUVVGbExFTkJRVU03VVVGRGJrUXNTVUZCU1N4RFFVRkRMR1ZCUVdVc1IwRkJSeXhEUVVGRExFTkJRVU03VVVGRGVrSXNUMEZCVHl4SlFVRkpMRU5CUVVNN1NVRkRhRUlzUTBGQlF6dEpRVlZFTEhGQ1FVRkpMRWRCUVVvc1ZVRkJTeXhEUVVGcFFqdFJRVU5zUWl4SlFVRkpMRU5CUVVNc1EwRkJRenRaUVVGRkxFOUJRVThzU1VGQlNTeERRVUZETEZkQlFWY3NRMEZCUXp0UlFVTm9ReXhKUVVGSkxFTkJRVU1zVjBGQlZ5eEhRVUZITEVOQlFVTXNRMEZCUXp0UlFVTnlRaXhQUVVGUExFbEJRVWtzUTBGQlF6dEpRVU5vUWl4RFFVRkRPMGxCVTBRc1owTkJRV1VzUjBGQlppeFZRVUZuUWl4RFFVRlBPMUZCUTI1Q0xFbEJRVWtzUTBGQlF5eERRVUZETzFsQlFVVXNUMEZCVHl4SlFVRkpMRU5CUVVNc1owSkJRV2RDTEVOQlFVTTdVVUZEY2tNc1NVRkJTU3hEUVVGRExHZENRVUZuUWl4SFFVRkhMRU5CUVVNc1EwRkJRenRSUVVNeFFpeFBRVUZQTEVsQlFVa3NRMEZCUXp0SlFVTm9RaXhEUVVGRE8wbEJVMFFzYVVOQlFXZENMRWRCUVdoQ0xGVkJRV2xDTEVOQlFVODdVVUZEY0VJc1NVRkJTU3hEUVVGRExFTkJRVU03V1VGQlJTeFBRVUZQTEVsQlFVa3NRMEZCUXl4cFFrRkJhVUlzUTBGQlF6dFJRVU4wUXl4SlFVRkpMRU5CUVVNc2FVSkJRV2xDTEVkQlFVY3NRMEZCUXl4RFFVRkRPMUZCUXpOQ0xFOUJRVThzU1VGQlNTeERRVUZETzBsQlEyaENMRU5CUVVNN1NVRlRSQ3cyUWtGQldTeEhRVUZhTEZWQlFXRXNRMEZCVHp0UlFVTm9RaXhKUVVGSkxFTkJRVU1zUTBGQlF5eEZRVUZGTzFsQlEwb3NUMEZCVHl4SlFVRkpMRU5CUVVNc1lVRkJZU3hEUVVGRE8xTkJRemRDTzFGQlEwUXNTVUZCU1N4RFFVRkRMR0ZCUVdFc1IwRkJSeXhQUVVGUExFTkJRVU1zUzBGQlN5eFZRVUZWTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTTdVVUZEZEVRc1NVRkJTU3hEUVVGRExIRkNRVUZ4UWl4SFFVRkhMRWxCUVVrc1EwRkJRenRSUVVOc1F5eFBRVUZQTEVsQlFVa3NRMEZCUXp0SlFVTm9RaXhEUVVGRE8wbEJSVVFzZVVKQlFWRXNSMEZCVWl4VlFVRlRMRU5CUVc5Q08xRkJRM3BDTEVsQlFVa3NRMEZCUXl4VFFVRlRMRWRCUVVjc1EwRkJReXhEUVVGRE8xRkJRMjVDTEU5QlFVOHNTVUZCU1N4RFFVRkRPMGxCUTJoQ0xFTkJRVU03U1VGSlJDeHhRMEZCYjBJc1IwRkJjRUlzVlVGQmNVSXNRMEZCVlR0UlFVTXpRaXhKUVVGSkxFTkJRVU1zUTBGQlF6dFpRVUZGTEU5QlFVOHNTVUZCU1N4RFFVRkRMRlZCUVZVc1EwRkJRenRSUVVNdlFpeEpRVUZKTEVOQlFVTXNWVUZCVlN4SFFVRkhMRTlCUVU4c1EwRkJReXhMUVVGTExGVkJRVlVzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dFJRVU51UkN4UFFVRlBMRWxCUVVrc1EwRkJRenRKUVVOb1FpeERRVUZETzBsQlNVUXNjMEpCUVVzc1IwRkJUQ3hWUVVGTkxFTkJRVlU3VVVGRFdpeEpRVUZKTEVOQlFVTXNVMEZCVXl4RFFVRkRMRTFCUVUwN1dVRkJSU3hQUVVGUExFbEJRVWtzUTBGQlF5eE5RVUZOTEVOQlFVTTdZVUZEY2tNN1dVRkRSQ3hEUVVGRExFZEJRVWNzUTBGQlF5eERRVUZETEVOQlFVTTdXVUZEVUN4SlFVRkpMRWxCUVVrc1EwRkJReXhOUVVGTkxFVkJRVVU3WjBKQlEySXNTVUZCU1N4RFFVRkRMRWRCUVVjc1EwRkJRenR2UWtGQlJTeEpRVUZKTEVOQlFVTXNUVUZCVFN4SFFVRkhMRU5CUVVNc1EwRkJRenM3YjBKQlEzUkNMRWxCUVVrc1EwRkJReXhOUVVGTkxFZEJRVWNzUTBGQlF5eERRVUZETzJGQlEzaENPMmxDUVVGTkxFbEJRVWtzUTBGQlF5eEhRVUZITEVOQlFVTXNSVUZCUlR0blFrRkRaQ3hKUVVGSkxFTkJRVU1zU1VGQlNTeERRVUZETEZGQlFWRXNSVUZCUlR0dlFrRkRhRUlzU1VGQlNTeERRVUZETEZGQlFWRXNSMEZCUnl4SlFVRkpMRU5CUVVNN2IwSkJRM0pDTEVsQlFVa3NRMEZCUXl4UFFVRlBMRU5CUVVNc1JVRkJSU3hKUVVGSkxFVkJRVVVzVTBGQlV5eERRVUZETEV0QlFVc3NSVUZCUlN4TFFVRkxMRVZCUVVVc1NVRkJTU3hEUVVGRExFMUJRVTBzUjBGQlJ5eERRVUZETEVWQlFVTXNRMEZCUXl4RFFVRkRPMjlDUVVNdlJDeEpRVUZKTEVOQlFVTXNTVUZCU1N4RlFVRkZMRU5CUVVNN2FVSkJRMlk3WVVGRFNqdFpRVU5FTEU5QlFVOHNTVUZCU1N4RFFVRkRPMU5CUTJZN1NVRkRUQ3hEUVVGRE8wbEJSVVFzT0VKQlFXRXNSMEZCWWl4VlFVRmpMRWxCUVhsQ08xRkJRMjVETEU5QlFVOHNUMEZCVHl4SlFVRkpMRU5CUVVNc1lVRkJZU3hMUVVGTExGVkJRVlVzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRXJRaXhKUVVGSkxFTkJRVU1zWVVGQll5eERRVUZETEVsQlFVa3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGVExFbEJRVWtzUTBGQlF5eGhRVUZoTEVOQlFVTTdTVUZET1Vrc1EwRkJRenRKUVVWTkxHOUNRVUZoTEVkQlFYQkNMRlZCUVhGQ0xFbEJRWFZDTEVWQlFVVXNUVUZCWXp0UlFVTjRSQ3hKUVVGSkxFTkJRVU1zVFVGQlRTeEhRVUZITEUxQlFVMHNRMEZCUXp0SlFVTjZRaXhEUVVGRE8wbEJSVVFzTkVKQlFWY3NSMEZCV0N4VlFVRlpMRWxCUVhsQ08xRkJRMnBETEU5QlFVOHNUMEZCVHl4SlFVRkpMRU5CUVVNc1UwRkJVeXhMUVVGTExGVkJRVlVzUTBGQlF5eERRVUZETEVOQlFVTXNTVUZCU1N4RFFVRkRMRk5CUVZNc1EwRkJReXhKUVVGSkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRPMGxCUXpORkxFTkJRVU03U1VGdFFrUXNlVU5CUVhkQ0xFZEJRWGhDTEZWQlFYbENMRmRCUVcxQ0xFVkJRVVVzUTBGQllUdFJRVUV6UkN4cFFrRkpRenRSUVVvMlF5eHJRa0ZCUVN4RlFVRkJMRXRCUVdFN1VVRkRka1FzU1VGQlNTeERRVUZETEZsQlFWa3NRMEZCUXl4VlFVRkJMRU5CUVVNc1NVRkJTU3hQUVVGQkxGZEJRVmNzUjBGQlJ5eERRVUZETEVOQlFVTXNUVUZCVFN4RlFVRjBRaXhEUVVGelFpeERRVUZETEVOQlFVTTdVVUZETDBNc1NVRkJTU3hEUVVGRExIRkNRVUZ4UWl4SFFVRkhMR05CUVUwc1QwRkJRU3h6UTBGQmQwSXNRMEZCUXl4TFFVRkpMRU5CUVVNc1RVRkJUU3hGUVVGRkxFdEJRVWtzUTBGQlF5eFpRVUZaTEVWQlFVVXNRMEZCUXl4RFFVRkRMRVZCUVRORUxFTkJRVEpFTEVOQlFVTTdVVUZETDBZc1QwRkJUeXhKUVVGSkxFTkJRVU03U1VGRGFFSXNRMEZCUXp0SlFWbEVMRzFEUVVGclFpeEhRVUZzUWl4VlFVRnRRaXhYUVVGdFFpeEZRVUZGTEVOQlFXRTdVVUZCY2tRc2FVSkJTVU03VVVGS2RVTXNhMEpCUVVFc1JVRkJRU3hMUVVGaE8xRkJRMnBFTEVsQlFVa3NRMEZCUXl4WlFVRlpMRU5CUVVNc1ZVRkJRU3hEUVVGRExFbEJRVWtzVDBGQlFTeFhRVUZYTEVkQlFVY3NRMEZCUXl4RFFVRkRMRTFCUVUwc1JVRkJkRUlzUTBGQmMwSXNRMEZCUXl4RFFVRkRPMUZCUXk5RExFbEJRVWtzUTBGQlF5eHhRa0ZCY1VJc1IwRkJSeXhqUVVGTkxFOUJRVUVzWjBOQlFXdENMRU5CUVVNc1MwRkJTU3hEUVVGRExFMUJRVTBzUlVGQlJTeExRVUZKTEVOQlFVTXNXVUZCV1N4RlFVRkZMRU5CUVVNc1EwRkJReXhGUVVGeVJDeERRVUZ4UkN4RFFVRkRPMUZCUTNwR0xFOUJRVThzU1VGQlNTeERRVUZETzBsQlEyaENMRU5CUVVNN1NVRlpSQ3h6UWtGQlN5eEhRVUZNTEZWQlEwa3NPRUpCUVRCRExFVkJRekZETEN0Q1FVRXlReXhGUVVNelF5d3JRa0ZCTWtNc1JVRkRNME1zYTBKQlFUaENMRVZCUXpsQ0xGZEJRV3RDTEVWQlEyeENMRmRCUVd0Q08xRkJUblJDTEdsQ1FUSktRenRSUVRGS1J5d3JRMEZCUVN4RlFVRkJMR3REUVVFd1F6dFJRVU14UXl4blJFRkJRU3hGUVVGQkxHMURRVUV5UXp0UlFVTXpReXhuUkVGQlFTeEZRVUZCTEcxRFFVRXlRenRSUVVNelF5eHRRMEZCUVN4RlFVRkJMSE5DUVVFNFFqdFJRVU01UWl3MFFrRkJRU3hGUVVGQkxHdENRVUZyUWp0UlFVTnNRaXcwUWtGQlFTeEZRVUZCTEd0Q1FVRnJRanRSUVVWc1FpeEpRVUZKTEVOQlFWTXNSVUZEVkN4RFFVRlRMRVZCUTFRc1EwRkJReXhIUVVGblFpeEpRVUZKTEVOQlFVTXNTMEZCU3l4RlFVRkhMRU5CUVVNc1RVRkJUU3hGUVVOeVF5eERRVUZETEVkQlFVY3NRMEZCUXl4SFFVRkhMRU5CUVVNc1IwRkJSeXhKUVVGSkxFTkJRVU1zVDBGQlR5eERRVUZETEUxQlFVMHNSVUZETDBJc1EwRkJReXhIUVVGSExFbEJRVWtzUTBGQlF5eE5RVUZOTEVOQlFVTXNUVUZCVFN4RlFVTjBRaXhEUVVGRExFZEJRVWNzU1VGQlNTeERRVUZETEZkQlFWY3NRMEZCUXl4RFFVRkRMRU5CUVVNc1JVRkRka0lzUTBGQlF5eEhRVUZITEVsQlFVa3NRMEZCUXl4WFFVRlhMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU03VVVGRk5VSXNTVUZCU1N4RFFVRkRMRWRCUVVjc1NVRkJTU3hMUVVGTExFTkJRVU1zUTBGQlF5eERRVUZETEVWQlFVVXNRMEZCUXl4SFFVRkhMRWxCUVVrc1MwRkJTeXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETzFGQlJYWkRMRWxCUVVrc1EwRkJReXhIUVVGSExFbEJRVWtzUTBGQlF6dFJRVVZpTEVsQlFVa3NSVUZCUlN4SFFVRkhMRWxCUVVrc1EwRkJReXhqUVVGakxFTkJRVU03VVVGRk4wSXNTVUZCU1N4RFFVRkRMRTFCUVUwc1EwRkJReXhQUVVGUExFTkJRVU1zVlVGQlF5eERRVUZETEVWQlFVVXNRMEZCUXp0WlFVTnlRaXhEUVVGRExFTkJRVU1zUzBGQlN5eEhRVUZITEVOQlFVTXNRMEZCUXp0WlFVTmFMRWxCUVVrc1QwRkJUeXhEUVVGRExFTkJRVU1zUTBGQlF5eExRVUZMTEZkQlFWY3NSVUZCUlR0blFrRkROVUlzUTBGQlF5eERRVUZETEVOQlFVTXNSMEZCUnl4RFFVRkRMRWRCUVVjc1EwRkJReXhGUVVGRkxFTkJRVU1zUTBGQlF5eERRVUZETEVkQlFVY3NRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJRenRoUVVNMVFqdFpRVU5FTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1IwRkJSeXhEUVVGRExFTkJRVU1zUTBGQlF5eEZRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1IwRkJSeXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETzFGQlF6TkNMRU5CUVVNc1EwRkJReXhEUVVGRE8xRkJSVWdzU1VGQlNTeEpRVUZKTEVOQlFVTXNjVUpCUVhGQ08xbEJRVVVzU1VGQlNTeERRVUZETEhGQ1FVRnhRaXhGUVVGRkxFTkJRVU03VVVGTE4wUXNTVUZCU1N4VFFVRlRMRU5CUVVNN1VVRkRaQ3hKUVVGSkxFbEJRVWtzUTBGQlF5eGxRVUZsTEVWQlFVVTdXVUZGZEVJc1UwRkJVeXhIUVVGSExFbEJRVWtzUTBGQlF5eGxRVUZsTEVOQlFVTTdVMEZEY0VNN1lVRkJUVHRaUVVWSUxGTkJRVk1zUjBGQlJ5eERRVUZETEVsQlFVa3NNRUpCUVZVc1EwRkJReXhEUVVGRExFVkJRVVVzU1VGQlNTeERRVUZETEUxQlFVMHNSVUZCUlN4TlFVRk5MRU5CUVVNc1kwRkJZeXhGUVVGRkxFMUJRVTBzUTBGQlF5eGpRVUZqTEVWQlFVVXNWVUZCUVN4RFFVRkRMRWxCUVVjc1QwRkJRU3hMUVVGSkxFTkJRVU1zWVVGQllTeERRVUZETEVOQlFVTXNRMEZCUXl4RlFVRnlRaXhEUVVGeFFpeERRVUZETEVOQlFVTXNRMEZCUXl4alFVRmpMRVZCUVVVc1EwRkJRenRaUVVsMlNTeERRVUZETEVkQlFVY3NhVUpCUVU4c1EwRkJReXhyUWtGQmEwSXNRMEZCUXl4RFFVRkRMRVZCUVVVc1kwRkJUU3hQUVVGQkxFTkJRVU1zUlVGQlJDeERRVUZETEVOQlFVTXNRMEZCUXp0WlFVTXpReXhKUVVGSkxFTkJRVU1zVFVGQlRTeERRVUZETEU5QlFVOHNRMEZCUXl4VlFVRkJMRU5CUVVNN1owSkJRMnBDTEVsQlFVa3NUMEZCVHl4RFFVRkRMRU5CUVVNc1RVRkJUU3hKUVVGSkxGRkJRVkU3YjBKQlFVVXNRMEZCUXl4RFFVRkRMRTFCUVUwc1IwRkJSeXhMUVVGSkxFTkJRVU1zVFVGQlRTeERRVUZUTEVOQlFVTXNRMEZCUXl4TlFVRk5MRU5CUVVNc1EwRkJRenRuUWtGRE1VVXNTVUZCU1N4UFFVRlBMRU5CUVVNc1EwRkJReXhOUVVGTkxFbEJRVWtzVVVGQlVUdHZRa0ZCUlN4RFFVRkRMRU5CUVVNc1RVRkJUU3hIUVVGSExFdEJRVWtzUTBGQlF5eE5RVUZOTEVOQlFWTXNRMEZCUXl4RFFVRkRMRTFCUVUwc1EwRkJReXhEUVVGRE8xbEJRemxGTEVOQlFVTXNRMEZCUXl4RFFVRkRPMWxCUTBnc1NVRkJTU3hEUVVGRExFMUJRVTBzUTBGQlF5eFBRVUZQTEVOQlFVTXNWVUZCUVN4RFFVRkRPMmRDUVVOcVFpeEpRVUZOTEVOQlFVTXNSMEZCUnl4TlFVRk5MRU5CUVVNc1kwRkJZeXhEUVVGRExFTkJRVU1zUTBGQlF5eEZRVUZGTEVOQlFVTXNSMEZCUnl4TlFVRk5MRU5CUVVNc1kwRkJZeXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETzJkQ1FVTnFSU3hEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJReXhOUVVGTkxFbEJRVWtzUTBGQlF5eERRVUZETzFsQlEzUkRMRU5CUVVNc1EwRkJReXhEUVVGRE8xTkJRMDQ3VVVGRlJDeEpRVUZKTEVOQlFVTXNSMEZCUnl4cFFrRkJUeXhEUVVGRExHdENRVUZyUWl4RFFVRkRMRU5CUVVNc1JVRkJSU3hWUVVGVkxFTkJRVU1zUlVGQlJTeERRVUZETzFsQlEyaEVMRTlCUVU4c1UwRkJVeXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRPMUZCUXpOQ0xFTkJRVU1zUTBGQlF5eERRVUZETzFGQlJVZ3NTVUZCU1N4SlFVRkpMRU5CUVVNc1ZVRkJWU3hKUVVGSkxFOUJRVThzU1VGQlNTeERRVUZETEZWQlFWVXNRMEZCUXl4TlFVRk5MRXRCUVVzc1YwRkJWeXhGUVVGRk8xbEJRMnhGTEVsQlFVa3NRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJRenRaUVVOV0xFbEJRVWtzWVVGQllTeEhRVUZITEZWQlFVTXNRMEZCUXl4RlFVRkZMRU5CUVVNc1JVRkJSU3hSUVVGUkxFVkJRVVVzWVVGQllUdG5Ra0ZET1VNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNSMEZCUnl4UlFVRlJMRU5CUVVNN1owSkJRemRDTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFZEJRVWNzWVVGQllTeERRVUZETzFsQlEzUkRMRU5CUVVNc1EwRkJRenRaUVVOR0xFbEJRVWtzUTBGQlF5eFBRVUZQTEVOQlFVTXNUMEZCVHl4RFFVRkRMRlZCUVVFc1EwRkJRenRuUWtGRGJFSXNZVUZCWVN4RFFVRkRMRU5CUVVNc1JVRkJSU3hEUVVGRExFZEJRVWNzUTBGQlF5eEZRVUZGTEV0QlFVa3NRMEZCUXl4cFFrRkJhVUlzUlVGQlJTeEhRVUZITEVOQlFVTXNRMEZCUXp0blFrRnBRbkpFTEVsQlFVa3NUMEZCVHl4RFFVRkRMRU5CUVVNc1RVRkJUU3hMUVVGTExGZEJRVmNzUlVGQlJUdHZRa0ZEYWtNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eEhRVUZITEVOQlFVTXNSMEZCUnl4RFFVRkRMRVZCUVVVc1EwRkJReXhEUVVGRExFTkJRVU1zUlVGQlJTeERRVUZETEVkQlFVY3NRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJRenR2UWtGRE4wSXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhIUVVGSExFTkJRVU1zUjBGQlJ5eERRVUZETEVWQlFVVXNRMEZCUXl4RFFVRkRMRU5CUVVNc1JVRkJSU3hEUVVGRExFZEJRVWNzUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXp0cFFrRkRhRU03Y1VKQlFVMDdiMEpCUTBnc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXl4TlFVRk5MRU5CUVVNc1EwRkJReXhGUVVGRkxFTkJRVU1zUTBGQlF5eERRVUZETEVWQlFVVXNRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJReXhOUVVGTkxFTkJRVU1zUTBGQlF5eERRVUZETzI5Q1FVTjJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVkQlFVY3NRMEZCUXl4RFFVRkRMRTFCUVUwc1EwRkJReXhEUVVGRExFVkJRVVVzUTBGQlF5eERRVUZETEVOQlFVTXNSVUZCUlN4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRExFMUJRVTBzUTBGQlF5eERRVUZETEVOQlFVTTdhVUpCUXpGRE8xbEJRMHdzUTBGQlF5eERRVUZETEVOQlFVTTdVMEZEVGpzN1dVRkJUU3hKUVVGSkxFTkJRVU1zVlVGQlZTeEhRVUZITEVWQlFVVXNUVUZCVFN4RlFVRkZMRWxCUVVrc1EwRkJReXhOUVVGTkxFVkJRVVVzVFVGQlRTeEZRVUZGTEVWQlFVVXNSVUZCUlN4RFFVRkRPMUZCUlRkRUxFbEJRVWtzWTBGQll5eEhRVUZITEVsQlFVa3NRMEZCUXl4WlFVRlpMRWxCUVVrc1JVRkJSU3hEUVVGRE8xRkJRemRETEVsQlFVa3NTVUZCU1N4RFFVRkRMSGRDUVVGM1FpeEZRVUZGTzFsQlEzcENMRWxCUVVrc1EwRkJReXhaUVVGaExFTkJRVU1zWjBKQlFXZENMRWRCUVVjc1NVRkJTU3hEUVVGRExIZENRVUYzUWl4RFFVRkRMR2RDUVVGblFpeERRVUZETzFsQlF6TkdMR05CUVdNc1IwRkJSeXhqUVVGakxFTkJRVU1zVFVGQlRTeERRVUZETERaRFFVRXJRaXhEUVVGRExFTkJRVU1zUlVGQlJTeEpRVUZKTEVOQlFVTXNUVUZCVFN4RlFVRkZMRWxCUVVrc1EwRkJReXgzUWtGQmQwSXNRMEZCUXl4SlFVRkpMRVZCUVU4c1EwRkJReXhKUVVGSkxFTkJRVU1zV1VGQldTeERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRPMU5CUjNwS08xRkJSVVFzU1VGQlNTeERRVUZETEdGQlFXRXNRMEZCUXl4TFFVRkxMRU5CUVVNc1EwRkJRenRSUVVNeFFpeEpRVUZKTEVOQlFVTXNVVUZCVVN4SFFVRkhMRWxCUVVrc2FVSkJRVThzUTBGQlF5eERRVUZETEVOQlFVTXNSVUZCUlN4RFFVRkRMRU5CUVVNc1JVRkJSU3hEUVVGRExFTkJRVU1zUTBGQlF6dFJRVVYyUXl4SlFVRkpMRU5CUVVNc1VVRkJVU3hEUVVGRExFdEJRVXNzUTBGQlF5eExRVUZMTEVWQlFVVXNRMEZCUXp0UlFVTTFRaXhMUVVGTExFbEJRVWtzUTBGQlF5eEhRVUZITEVOQlFVTXNSVUZCUlN4RFFVRkRMRWRCUVVjc1EwRkJReXhGUVVGRkxFVkJRVVVzUTBGQlF5eEZRVUZGTzFsQlEzaENMRWxCUVVrc1EwRkJReXhIUVVGSExFbEJRVWtzUTBGQlF5eE5RVUZOTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1dVRkRka0lzU1VGQlNTeERRVUZETEVOQlFVTXNTMEZCU3l4RlFVRkZPMmRDUVVOVUxFTkJRVU1zUTBGQlF5eEZRVUZGTEVkQlFVY3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJRenRuUWtGRFdDeERRVUZETEVOQlFVTXNSVUZCUlN4SFFVRkhMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU03WjBKQlExZ3NTVUZCU1N4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eEZRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJRenRuUWtGRGJrSXNTVUZCU1N4RFFVRkRMRkZCUVZFc1EwRkJReXhMUVVGTExFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTXNSVUZCUlN4RFFVRkRMRU5CUVVNc1EwRkJRenRoUVVOcVF6dFRRVU5LTzFGQlEwUXNTVUZCU1N4RFFVRkRMRkZCUVZFc1EwRkJReXhUUVVGVExFZEJRVWNzU1VGQlNTeERRVUZETEZWQlFWVXNRMEZCUXp0UlFVc3hReXhKUVVGSkxFTkJRVU1zWVVGQllTeERRVUZETERoQ1FVRTRRaXhGUVVGRkxFTkJRVU1zUlVGQlJTeERRVUZETEVOQlFVTXNRMEZCUXp0UlFVZDZSQ3hKUVVGSkxHTkJRV01zUTBGQlF5eE5RVUZOTEVkQlFVY3NRMEZCUXp0WlFVRkZMRWxCUVVrc1EwRkJReXhSUVVGUkxFTkJRVU1zVDBGQlR5eEhRVUZITEVsQlFVa3NjMEpCUVZVc1EwRkJReXhKUVVGSkxFTkJRVU1zVFVGQlRTeEZRVUZGTEVsQlFVa3NRMEZCUXl4UFFVRlBMRVZCUVVVc1NVRkJTU3hEUVVGRExGVkJRVlVzUlVGQlJTeGpRVUZqTEVOQlFVTXNRMEZCUXl4blFrRkJaMElzUlVGQlJTeERRVUZETzFGQlEzSktMRWxCUVVrc1EwRkJReXhSUVVGUkxFTkJRVU1zUjBGQlJ5eERRVUZETEN0Q1FVRXJRaXhEUVVGRExFTkJRVU03VVVGRGJrUXNTVUZCU1N4RFFVRkRMRFpDUVVFMlFpeERRVUZETEVOQlFVTXNSVUZCUlN4RFFVRkRMRVZCUVVVc1YwRkJWeXhEUVVGRExFTkJRVU03VVVGSGRFUXNTVUZCU1N4RFFVRkRMR0ZCUVdFc1EwRkJReXhGUVVGRkxFTkJRVU1zUTBGQlF6dFJRVU4yUWl4SlFVRkpMRVZCUVVVc1JVRkJSVHRaUVVOS0xFbEJRVWtzUTBGQlF5eE5RVUZOTEVOQlFVTXNUMEZCVHl4RFFVRkRMRlZCUVZVc1EwRkJReXhGUVVGRkxFTkJRVU1zU1VGQlNTeERRVUZETEVOQlFVTXNRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUlVGQlJTeERRVUZETEVOQlFVTXNRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRPMWxCUTJwRkxFbEJRVWtzUTBGQlF5eFJRVUZSTEVOQlFVTXNUMEZCVHl4SFFVRkhMRWxCUVVrc2MwSkJRVlVzUTBGQlF5eEpRVUZKTEVOQlFVTXNUVUZCVFN4RlFVRkZMRWxCUVVrc1EwRkJReXhQUVVGUExFVkJRVVVzU1VGQlNTeERRVUZETEZWQlFWVXNSVUZCUlN4alFVRmpMRVZCUVVVc1NVRkJTU3hEUVVGRExFTkJRVU1zWjBKQlFXZENMRVZCUVVVc1EwRkJRenRaUVVNMVNDeEpRVUZKTEVOQlFVTXNUVUZCVFN4RFFVRkRMRTlCUVU4c1EwRkJReXhWUVVGVkxFTkJRVU1zUlVGQlJTeERRVUZETEVsQlFVa3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF5eERRVUZETEVWQlFVVXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJRenRUUVVOd1JUdFJRVWRFTEVsQlFVa3NRMEZCUXl4UlFVRlJMRU5CUVVNc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF6dFJRVU53UWl4SlFVRkpMRU5CUVVNc1VVRkJVU3hEUVVGRExFZEJRVWNzUTBGQlF5d3JRa0ZCSzBJc1EwRkJReXhEUVVGRE8xRkJSVzVFTEVsQlFVa3NhMEpCUVd0Q0xFVkJRVVU3V1VGRGNFSXNTVUZCU1N4RFFVRkRMRkZCUVZFc1EwRkJReXhaUVVGWkxFZEJRVWNzU1VGQlNTeERRVUZETzFsQlEyeERMRWxCUVVrc1EwRkJReXhSUVVGUkxFTkJRVU1zV1VGQldTeEhRVUZITEVsQlFVa3NRMEZCUXl4TlFVRk5MRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUzBGQlN5eERRVUZETzFsQlEyeEVMRWxCUVVrc1EwRkJReXhSUVVGUkxFTkJRVU1zWjBKQlFXZENMRWRCUVVjc1EwRkJReXhEUVVGRE8xbEJRMjVETEVsQlFVa3NRMEZCUXl4UlFVRlJMRU5CUVVNc1pVRkJaU3hIUVVGSExFTkJRVU1zU1VGQlNTeERRVUZETEVOQlFVTTdXVUZEZGtNc1NVRkJTU3hGUVVGRkxFZEJRVWNzYVVKQlFVOHNRMEZCUXl4clFrRkJhMElzUTBGQlF5eERRVUZETEVWQlFVTXNWVUZCUXl4RFFVRkRMRVZCUVVVc1EwRkJRenRuUWtGRGRrTXNTVUZCU1N4RFFVRkRMRWxCUVVrc1EwRkJReXhKUVVGSkxFTkJRVU1zU1VGQlNTeERRVUZETzI5Q1FVRkZMRTlCUVU4c1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRPMmRDUVVOeVF5eFBRVUZQTEVOQlFVTXNRMEZCUVR0WlFVTmFMRU5CUVVNc1EwRkJReXhEUVVGRE8xbEJRMGdzU1VGQlNTeERRVUZETEZGQlFWRXNRMEZCUXl4RFFVRkRMRWRCUVVjc1JVRkJSU3hEUVVGRE8xbEJRM0pDTEVsQlFVa3NRMEZCUXl4UlFVRlJMRU5CUVVNc1IwRkJSeXhEUVVGRExHdENRVUZyUWl4RFFVRkRMRU5CUVVNN1UwRkRla003VVVGRlJDeEpRVUZKTEVOQlFVTXNiVUpCUVcxQ0xFVkJRVVVzUTBGQlF6dFJRVU16UWl4SlFVRkpMRU5CUVVNc05rSkJRVFpDTEVOQlFVTXNRMEZCUXl4RlFVRkZMRU5CUVVNc1JVRkJSU3hYUVVGWExFTkJRVU1zUTBGQlF6dFJRVU4wUkN4UFFVRlBMRmRCUVZjc1EwRkJReXhEUVVGRExFTkJRVU1zU1VGQlNTeERRVUZETEUxQlFVMHNSVUZCUlN4RFFVRkRMRU5CUVVNc1EwRkJReXhKUVVGSkxFTkJRVU03U1VGRE9VTXNRMEZCUXp0SlFVVlBMRGhDUVVGaExFZEJRWEpDTEZWQlFYTkNMRlZCUVd0Q0xFVkJRVVVzUTBGQlZ5eEZRVUZGTEVOQlFWYzdVVUZET1VRc1NVRkJTU3hKUVVGSkxFTkJRVU1zVDBGQlR5eERRVUZETEUxQlFVMHNSMEZCUnl4RFFVRkRMRWxCUVVrc1ZVRkJWU3hIUVVGSExFTkJRVU1zUlVGQlJUdFpRVWN6UXl4SlFVRkpMRU5CUVVNc1IwRkJSeXhKUVVGSkxFTkJRVU1zVFVGQlRTeERRVUZETEUxQlFVMHNRMEZCUXp0WlFVTXpRaXhKUVVGSkxFdEJRVXNzUjBGQlJ5eEpRVUZKTEVOQlFVTXNUVUZCVFN4RFFVRkRMRWRCUVVjc1EwRkJReXhWUVVGQkxFTkJRVU1zU1VGQlNTeFBRVUZCTEVOQlFVc3NSVUZCUlN4TlFVRk5MRVZCUVZNc1EwRkJReXhEUVVGRExFMUJRVThzUTBGQlF5eExRVUZMTEVWQlFVVXNUVUZCVFN4RlFVRlRMRU5CUVVNc1EwRkJReXhOUVVGUExFTkJRVU1zUzBGQlN5eEZRVUZGTEVOQlFVRXNSVUZCZGtVc1EwRkJkVVVzUTBGQlF5eERRVUZETzFsQlF6RkhMRWxCUVVrc1JVRkJSU3hIUVVGSExFbEJRVWtzUTBGQlF5eE5RVUZOTEVOQlFVTXNSMEZCUnl4RFFVRkRMRlZCUVVFc1EwRkJReXhKUVVGSkxFOUJRVUVzUTBGQlN5eEZRVUZGTEV0QlFVc3NSVUZCUlN4RFFVRkRMRU5CUVVNc1MwRkJTeXhGUVVGRkxFTkJRVUVzUlVGQmRrSXNRMEZCZFVJc1EwRkJReXhEUVVGRE8xbEJRM1pFTEVsQlFVa3NRMEZCUXl4UFFVRlBMRU5CUVVNc1QwRkJUeXhEUVVGRExGVkJRVU1zUTBGQlF5eEZRVUZGTEVOQlFVTTdaMEpCUTNSQ0xFVkJRVVVzUTBGQlF5eEpRVUZKTEVOQlFVMHNSVUZCUlN4TFFVRkxMRVZCUVVVc1EwRkJReXhEUVVGRExFdEJRVXNzUjBGQlJ5eERRVUZETEVkQlFVY3NRMEZCUXl4RlFVRkZMRU5CUVVNc1EwRkJRenRaUVVNM1F5eERRVUZETEVOQlFVTXNRMEZCUXp0WlFVTklMRWxCUVVrc1EwRkJReXhQUVVGUExFTkJRVU1zVDBGQlR5eERRVUZETEZWQlFVTXNRMEZCUXl4RlFVRkZMRU5CUVVNN1owSkJRM1JDTEVsQlFVa3NUMEZCVHl4RFFVRkRMRU5CUVVNc1RVRkJUU3hMUVVGTExGZEJRVmM3YjBKQlF5OUNMRU5CUVVNc1EwRkJReXhOUVVGTkxFTkJRVU1zVDBGQlR5eERRVUZETEZWQlFVRXNRMEZCUXl4SlFVRkpMRTlCUVVFc1MwRkJTeXhEUVVGRExFbEJRVWtzUTBGQlF5eEZRVUZGTEUxQlFVMHNSVUZCUlN4RFFVRkRMRU5CUVVNc1MwRkJTeXhGUVVGRkxFMUJRVTBzUlVGQlJTeERRVUZETEVOQlFVTXNTMEZCU3l4RlFVRkZMRU5CUVVNc1JVRkJhRVFzUTBGQlowUXNRMEZCUXl4RFFVRkRPMmRDUVVNMVJTeEpRVUZKTEU5QlFVOHNRMEZCUXl4RFFVRkRMRTFCUVUwc1MwRkJTeXhYUVVGWE8yOUNRVU12UWl4RFFVRkRMRU5CUVVNc1RVRkJUU3hEUVVGRExFOUJRVThzUTBGQlF5eFZRVUZCTEVWQlFVVXNTVUZCU1N4UFFVRkJMRXRCUVVzc1EwRkJReXhKUVVGSkxFTkJRVU1zUlVGQlJTeE5RVUZOTEVWQlFVVXNRMEZCUXl4RFFVRkRMRXRCUVVzc1JVRkJSU3hOUVVGTkxFVkJRVVVzUlVGQlJTeERRVUZETEV0QlFVc3NSVUZCUlN4RFFVRkRMRVZCUVdwRUxFTkJRV2xFTEVOQlFVTXNRMEZCUXp0WlFVTnNSaXhEUVVGRExFTkJRVU1zUTBGQlF6dFpRVWRJTEVsQlFVa3NUVUZCVFN4RlFVRkZPMmxDUVVOUUxFbEJRVWtzUTBGQlF5eEpRVUZKTEVOQlFVTXNTVUZCU1N4RlFVRkZMRU5CUVVNN2FVSkJRMnBDTEV0QlFVc3NRMEZCUXl4RlFVRkZMRU5CUVVNN2FVSkJRMVFzUzBGQlN5eERRVUZETEV0QlFVc3NRMEZCUXp0cFFrRkRXaXhoUVVGaExFTkJRVU1zUzBGQlN5eERRVUZETzJsQ1FVTndRaXhaUVVGWkxFTkJRVU1zU1VGQlNTeERRVUZETEZsQlFWa3NSVUZCUlN4RFFVRkRPMmxDUVVOcVF5eDNRa0ZCZDBJc1EwRkJReXhEUVVGRExFTkJRVU03YVVKQlF6TkNMRzlDUVVGdlFpeERRVUZETEVsQlFVa3NRMEZCUXp0cFFrRkRNVUlzUzBGQlN5eERRVUZETEZWQlFWVXNSVUZCUlN4RFFVRkRMRVZCUVVVc1EwRkJReXhGUVVGRkxFTkJRVU1zUlVGQlJTeExRVUZMTEVOQlFVTXNRMEZCUXp0WlFVVjJReXhKUVVGSkxFTkJRVU1zVFVGQlRTeERRVUZETEU5QlFVOHNRMEZCUXl4VlFVRkJMRU5CUVVNN1owSkJRMnBDTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1MwRkJTeXhEUVVGRExFZEJRVWNzUlVGQlJTeERRVUZETEVOQlFVTXNRMEZCUXl4TFFVRkxMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU03WjBKQlF6TkNMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUzBGQlN5eERRVUZETEVkQlFVY3NSVUZCUlN4RFFVRkRMRU5CUVVNc1EwRkJReXhMUVVGTExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTTdXVUZETDBJc1EwRkJReXhEUVVGRExFTkJRVU03VTBGRFRqdGhRVUZOTzFsQlEwZ3NTVUZCU1N4RFFVRkRMRkZCUVZFc1EwRkJReXhIUVVGSExFTkJRVU1zVlVGQlZTeERRVUZETEVOQlFVTTdVMEZEYWtNN1NVRkRUQ3hEUVVGRE8wbEJSMDhzT0VOQlFUWkNMRWRCUVhKRExGVkJRWE5ETEV0QlFXRXNSVUZCUlN4TlFVRmpMRVZCUVVVc1YwRkJNa0k3VVVGQmFFY3NhVUpCWlVNN1VVRm1iMFVzTkVKQlFVRXNSVUZCUVN4clFrRkJNa0k3VVVGRk5VWXNTVUZCU1N4RFFVRkRMRWxCUVVrc1EwRkJReXhsUVVGbExFbEJRVWtzU1VGQlNTeERRVUZETEcxQ1FVRnRRaXhGUVVGRk8xbEJRMjVFTEVsQlFVa3NSMEZCUXl4SFFVRkhMRWxCUVVrc1EwRkJReXhSUVVGUkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RlFVRkZMRWRCUVVNc1IwRkJSeXhKUVVGSkxFTkJRVU1zVVVGQlVTeERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJRenRaUVVOdVJDeEpRVUZKTEVOQlFVTXNUVUZCVFN4RFFVRkRMRTlCUVU4c1EwRkJReXhWUVVGVkxFTkJRVU1zUlVGQlJTeERRVUZETEVsQlFVa3NRMEZCUXl4RFFVRkRMRU5CUVVNc1IwRkJSeXhIUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVWQlFVVXNRMEZCUXl4RFFVRkRMRU5CUVVNc1IwRkJSeXhIUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJRenRaUVVOcVJTeEpRVUZKTEUxQlFVMHNSMEZCUnl4dFEwRkJZeXhEUVVGRExFbEJRVWtzUTBGQlF5eE5RVUZOTEVWQlFVVXNTVUZCU1N4RFFVRkRMRTFCUVUwc1EwRkJReXhEUVVGRE8xbEJRM1JFTEdsRFFVRlpMRU5CUVVNc1RVRkJUU3hGUVVGRkxFdEJRVXNzUlVGQlJTeE5RVUZOTEVWQlFVVXNTVUZCU1N4RFFVRkRMR2RDUVVGblFpeEZRVUZGTEVOQlFVTXNSVUZCUlN4WFFVRlhMRU5CUVVNc1EwRkJRenRaUVVNelJTeEpRVUZKTEVOQlFVTXNUVUZCVFN4RFFVRkRMRTlCUVU4c1EwRkJReXhWUVVGRExFTkJRVU1zUlVGQlJTeERRVUZETzJkQ1FVTnlRaXhMUVVGSkxFTkJRVU1zVVVGQlVTeERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTXNRMEZCUXl4RlFVRkZMRXRCUVVrc1EwRkJReXhSUVVGUkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTTdaMEpCUTNwRUxFbEJRVWtzUTBGQlF5eERRVUZETEUxQlFVMHNSVUZCUlR0dlFrRkRWaXhEUVVGRExFTkJRVU1zVFVGQlRTeERRVUZETEZWQlFWVXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU03YjBKQlEzcENMRU5CUVVNc1EwRkJReXhOUVVGTkxFTkJRVU1zVlVGQlZTeERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJRenRwUWtGRE5VSTdXVUZEVEN4RFFVRkRMRU5CUVVNc1EwRkJRenRUUVVOT08wbEJRMHdzUTBGQlF6dEpRVVZFTEhWQ1FVRk5MRWRCUVU0N1VVRkRTU3hQUVVGUExFbEJRVWtzUTBGQlF5eExRVUZMTEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNN1NVRkRNMElzUTBGQlF6dEpRVVZFTEhGQ1FVRkpMRWRCUVVvN1VVRkRTU3hQUVVGUExFbEJRVWtzUTBGQlF5eExRVUZMTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1NVRkRla0lzUTBGQlF6dEpRVWxFTEcxRFFVRnJRaXhIUVVGc1FpeFZRVUZ0UWl4VlFVRnpRanRSUVVGMFFpd3lRa0ZCUVN4RlFVRkJMR05CUVhOQ08xRkJRM0pETEVsQlFVa3NRMEZCUXl4blFrRkJaMElzUjBGQlJ5eEpRVUZKTERaQ1FVRnpRaXhEUVVNNVF5eEpRVUZKTEVOQlFVTXNUVUZCVFN4RFFVRkRMRWRCUVVjc1EwRkJReXhWUVVGVkxFTkJRVU03V1VGRGRrSXNUMEZCVHl4RFFVRkRMRU5CUVVNc1RVRkJUU3hEUVVGRExFOUJRVThzUTBGQlF5eERRVUZETEZWQlFWVXNRMEZCUXl4RFFVRkRMRkZCUVZFc1JVRkJSU3hEUVVGRE8xRkJRM0JFTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1NVRkRXaXhEUVVGRE8wbEJWMFFzTUVKQlFWTXNSMEZCVkN4VlFVRlZMRWxCUVVrc1JVRkJSU3hGUVVGakxFVkJRVVVzU1VGQlNUdFJRVUZ3UWl4dFFrRkJRU3hGUVVGQkxFMUJRV003VVVGRE1VSXNTVUZCU1N4UlFVRlJMRWRCUVVjc1JVRkJSU3hEUVVGRE8xRkJTV3hDTEVsQlFVa3NSMEZCUnl4SFFVRkhMRWxCUVVrc05rSkJRWE5DTEVOQlFVTXNTVUZCU1N4RFFVRkRMR2RDUVVGblFpeERRVUZETEVOQlFVTXNSVUZCUlN4RlFVRkZMRU5CUVVNc1JVRkJSU3hKUVVGSkxFTkJRVU1zWjBKQlFXZENMRU5CUVVNc1EwRkJReXhGUVVGRkxFTkJRVU1zUlVGQlJTeEpRVUZKTEVOQlFVTXNaMEpCUVdkQ0xFTkJRVU1zUTBGQlF5eEZRVUZGTEVOQlFVTXNSVUZEY2tnc1MwRkJTeXhIUVVGaExFVkJRVVVzUTBGQlF5eEZRVUZGTEVsQlFVa3NRMEZCUXl4TlFVRk5MRU5CUVVNc1EwRkJReXhGUVVGRkxFTkJRVU1zUlVGQlJTeEpRVUZKTEVOQlFVTXNUVUZCVFN4RFFVRkRMRU5CUVVNc1JVRkJSU3hGUVVONFJDeExRVUZMTEVkQlFXRXNSVUZCUlN4RFFVRkRMRVZCUVVVc1NVRkJTU3hEUVVGRExFMUJRVTBzUTBGQlF5eERRVUZETEVWQlFVVXNRMEZCUXl4RlFVRkZMRWxCUVVrc1EwRkJReXhOUVVGTkxFTkJRVU1zUTBGQlF5eEZRVUZGTEVWQlEzaEVMRXRCUVVzc1IwRkJSeXhIUVVGSExFTkJRVU1zVVVGQlVTeERRVUZETEV0QlFVc3NSVUZCUlN4SlFVRkpMRU5CUVVNc1RVRkJUU3hEUVVGRExFdEJRVXNzUTBGQlF5eEZRVU01UXl4SFFVRkhMRWRCUVVjc1IwRkJSeXhEUVVGRExGRkJRVkVzUTBGQlF5eExRVUZMTEVWQlFVVXNTVUZCU1N4RFFVRkRMRTFCUVUwc1EwRkJReXhMUVVGTExFTkJRVU1zUTBGQlF6dFJRVU5xUkN4SFFVRkhMRU5CUVVNc1owSkJRV2RDTEVOQlFVTXNTMEZCU3l4RlFVRkZMRXRCUVVzc1JVRkJSU3hKUVVGSkxFTkJRVU1zVFVGQlRTeERRVUZETEV0QlFVc3NSVUZCUlN4SlFVRkpMRU5CUVVNc1RVRkJUU3hEUVVGRExFdEJRVXNzUTBGQlF5eERRVUZETzFGQlEzcEZMRWxCUVVrc1QwRkJUeXhKUVVGSkxFdEJRVXNzVjBGQlZ5eEZRVUZGTzFsQlF6ZENMRWxCUVVrc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF6dFRRVU5pTzFGQlEwUXNTVUZCU1N4VFFVRlRMRWRCUVVjc1ZVRkJRU3hEUVVGRExFbEJRVWtzVDBGQlFTeERRVUZETEVOQlFVTXNUVUZCVFN4RFFVRkRMRVZCUVVVc1JVRkJXQ3hEUVVGWExFVkJRVVVzVTBGQlV5eEhRVUZITEZWQlFVRXNRMEZCUXl4SlFVRkpMRTlCUVVFc1EwRkJReXhEUVVGRExFMUJRVTBzUTBGQlF5eEZRVUZGTEVWQlFWZ3NRMEZCVnl4RlFVRkZMRTFCUVUwc1IwRkJSeXhWUVVGQkxFTkJRVU1zU1VGQlNTeFBRVUZCTEVOQlFVTXNRMEZCUXl4TlFVRk5MRVZCUVVVc1JVRkJWaXhEUVVGVkxFVkJRM0JHTEUxQlFVMHNSMEZCUnl4SlFVRkpMREJDUVVGVkxFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTXNRMEZCUXl4TlFVRk5MRVZCUVVVc1IwRkJSeXhEUVVGRExFTkJRVU1zUlVGQlJTeFRRVUZUTEVWQlFVVXNVMEZCVXl4RlFVRkZMRTFCUVUwc1EwRkJReXhGUVVNeFJTeFpRVUZaTEVkQlFVY3NUVUZCVFN4RFFVRkRMR3RDUVVGclFpeERRVUZETEV0QlFVc3NRMEZCUXl4RlFVRkZMRVZCUVVVc1IwRkJSeXhEUVVGRExFVkJRVVVzUTBGQlF5eERRVUZETzFGQlF5OUVMRWxCUVVrc1dVRkJXU3hEUVVGRExFMUJRVTBzUzBGQlN5eERRVUZETEVsQlFVa3NXVUZCV1N4RFFVRkRMRTFCUVUwc1MwRkJTeXhIUVVGSExFTkJRVU1zUTBGQlF5eERRVUZETEUxQlFVMHNSVUZCUlR0WlFVTnVSU3hKUVVGSkxFdEJRVXNzUjBGQlJ5d3lRa0ZCWlN4RFFVRkRMRWxCUVVrc1EwRkJReXhOUVVGTkxFTkJRVU1zVjBGQlZ5eEZRVUZGTEVsQlFVa3NRMEZCUXl4TlFVRk5MRU5CUVVNc1YwRkJWeXhGUVVGRkxFVkJRVVVzUTBGQlF5eERRVUZETzFsQlEyeEdMRkZCUVZFc1IwRkJSeXhEUVVGRExFdEJRVXNzUTBGQlF5eHJRa0ZCYTBJc1JVRkJSU3hMUVVGTExFTkJRVU1zVlVGQlZTeERRVUZETEVOQlFVTTdVMEZETTBRN1lVRkJUVHRaUVVOSUxFbEJRVWtzUTBGQlF5eEhRVUZITEZsQlFWa3NRMEZCUXl4TlFVRk5MRWRCUVVjc1EwRkJReXhGUVVNelFpeERRVUZETEVkQlFVY3NSMEZCUnl4RFFVRkRMRU5CUVVNc1EwRkJReXhaUVVGWkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRVZCUXpWQ0xFTkJRVU1zUjBGQlJ5eEhRVUZITEVOQlFVTXNRMEZCUXl4RFFVRkRMRmxCUVZrc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNSVUZETlVJc1VVRkJVU3hIUVVGSExFTkJRVU1zU1VGQlNTeERRVUZETEUxQlFVMHNRMEZCUXl4WFFVRlhMRU5CUVVNc1pVRkJaU3hEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVWQlFVVXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU03V1VGRGJrVXNTMEZCU3l4SlFVRkpMRU5CUVVNc1IwRkJSeXhEUVVGRExFVkJRVVVzUTBGQlF5eEpRVUZKTEVOQlFVTXNSVUZCUlN4RlFVRkZMRU5CUVVNN1owSkJRM1pDTEZGQlFWRXNRMEZCUXl4SlFVRkpMRU5CUVVNc1IwRkJSeXhEUVVGRExFTkJRVU1zUTBGQlF5eFpRVUZaTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dFpRVU0xUXl4UlFVRlJMRU5CUVVNc1NVRkJTU3hEUVVGRExITkNRVUZWTEVOQlFVTXNRMEZCUXl4RlFVRkZMRWxCUVVrc1EwRkJReXhOUVVGTkxFTkJRVU1zVjBGQlZ5eEZRVUZGTEVWQlFVVXNRMEZCUXl4RFFVRkRMRU5CUVVNN1UwRkROMFE3VVVGaFJDeFBRVUZQTEZGQlFWRXNRMEZCUXp0SlFVTndRaXhEUVVGRE8wbEJSMDBzY1VKQlFXTXNSMEZCY2tJc1ZVRkJjMElzUTBGQmMwSTdVVUZEZUVNc1QwRkJUeXhQUVVGUExFTkJRVU1zUTBGQlF5eE5RVUZOTEV0QlFVc3NVVUZCVVN4RFFVRkRMRU5CUVVNc1EwRkJVeXhEUVVGRExFTkJRVU1zVFVGQlRTeERRVUZETEVOQlFVTXNRMEZCVVN4RFFVRkRMRU5CUVVNc1RVRkJUeXhEUVVGRExFdEJRVXNzUTBGQlF6dEpRVU53Uml4RFFVRkRPMGxCUjAwc2NVSkJRV01zUjBGQmNrSXNWVUZCYzBJc1EwRkJjMEk3VVVGRGVFTXNUMEZCVHl4UFFVRlBMRU5CUVVNc1EwRkJReXhOUVVGTkxFdEJRVXNzVVVGQlVTeERRVUZETEVOQlFVTXNRMEZCVXl4RFFVRkRMRU5CUVVNc1RVRkJUU3hEUVVGRExFTkJRVU1zUTBGQlVTeERRVUZETEVOQlFVTXNUVUZCVHl4RFFVRkRMRXRCUVVzc1EwRkJRenRKUVVOd1JpeERRVUZETzBsQlIwMHNZVUZCVFN4SFFVRmlMRlZCUVdNc1EwRkJjMEk3VVVGRGFFTXNUMEZCVHl4TlFVRk5MRU5CUVVNc1kwRkJZeXhEUVVGRExFTkJRVU1zUTBGQlF5eEhRVUZITEVkQlFVY3NSMEZCUnl4TlFVRk5MRU5CUVVNc1kwRkJZeXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETzBsQlEzSkZMRU5CUVVNN1NVRk5UU3huUWtGQlV5eEhRVUZvUWl4VlFVRnBRaXhEUVVGbE8xRkJRelZDTEVsQlFVa3NUMEZCVHl4RFFVRkRMRU5CUVVNc1EwRkJReXhGUVVGRk8xbEJRMW9zVFVGQlRTeERRVUZETEZkQlFWY3NRMEZCUXl4RFFVRkRMRVZCUVVVc1RVRkJUU3hEUVVGRExGVkJRVlVzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRPMU5CUXk5RE8yRkJRVTA3V1VGRFNDeE5RVUZOTEVOQlFVTXNVVUZCVVN4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRE8xbEJRMjVDTEVOQlFVTXNRMEZCUXl4TFFVRkxMRWxCUVVrc1EwRkJReXhEUVVGRE8xTkJRMmhDTzBsQlEwd3NRMEZCUXp0SlFVbGpMR1ZCUVZFc1IwRkJka0lzVlVGQmQwSXNRMEZCVHp0UlFVTnlRaXhEUVVGRkxFTkJRVU1zUlVGQlJTeEhRVUZITEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1VVRkRXaXhEUVVGRkxFTkJRVU1zUlVGQlJTeEhRVUZITEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1NVRkRkRUlzUTBGQlF6dEpRVWxqTEd0Q1FVRlhMRWRCUVRGQ0xGVkJRVEpDTEVOQlFWRXNSVUZCUlN4TlFVRm5RenRSUVVOcVJTeEpRVUZKTEU5QlFVOHNRMEZCUXl4RFFVRkRMRTFCUVUwc1MwRkJTeXhYUVVGWExFVkJRVVU3V1VGRGFrTXNRMEZCUXl4RFFVRkRMRTFCUVUwc1EwRkJReXhQUVVGUExFTkJRVU1zVlVGQlFTeERRVUZETzJkQ1FVTmtMRU5CUVVNc1EwRkJReXhMUVVGTExFbEJRVWtzUTBGQlF5eERRVUZETzJkQ1FVTmlMRTFCUVUwc1EwRkJReXhSUVVGUkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTTdaMEpCUTJJc1EwRkJSU3hEUVVGRExHbENRVUZwUWl4SFFVRkhMRU5CUVVNc1EwRkJReXhEUVVGRExFZEJRVWNzVFVGQlRTeERRVUZETEVOQlFVTXNRMEZCUXp0blFrRkRkRU1zUTBGQlJTeERRVUZETEdsQ1FVRnBRaXhIUVVGSExFTkJRVU1zUTBGQlF5eERRVUZETEVkQlFVY3NUVUZCVFN4RFFVRkRMRU5CUVVNc1EwRkJRenRaUVVOb1JDeERRVUZETEVOQlFVTXNRMEZCUXp0VFFVTk9PMUZCUTBRc1NVRkJTU3hQUVVGUExFTkJRVU1zUTBGQlF5eE5RVUZOTEV0QlFVc3NWMEZCVnl4RlFVRkZPMWxCUTJwRExFTkJRVU1zUTBGQlF5eE5RVUZOTEVOQlFVTXNUMEZCVHl4RFFVRkRMRlZCUVVFc1EwRkJReXhKUVVGSkxFOUJRVUVzVFVGQlRTeERRVUZETEZkQlFWY3NRMEZCUXl4RFFVRkRMRVZCUVVVc1RVRkJUU3hEUVVGRExFVkJRVGRDTEVOQlFUWkNMRU5CUVVNc1EwRkJRenRUUVVONFJEdEpRVU5NTEVOQlFVTTdTVUZIVFN4cFFrRkJWU3hIUVVGcVFpeFZRVUZyUWl4RFFVRmxPMUZCUXpkQ0xFbEJRVWtzVDBGQlR5eERRVUZETEVOQlFVTXNRMEZCUXl4RlFVRkZPMWxCUTFvc1QwRkJUenRuUWtGRFNDeERRVUZETEVWQlFVVXNRMEZCUXl4RFFVRkRMRTFCUVUwc1EwRkJReXhGUVVGRkxFVkJRVVU3WjBKQlEyaENMRU5CUVVNc1JVRkJSU3hEUVVGRExFTkJRVU1zVFVGQlRTeERRVUZETEVWQlFVVXNSVUZCUlR0aFFVTnVRaXhEUVVGRE8xTkJRMHc3WVVGQlRUdFpRVU5JTEU5QlFVOHNRMEZCUXl4RFFVRkRPMU5CUTFvN1NVRkRUQ3hEUVVGRE8wbEJTVTBzVjBGQlNTeEhRVUZZTEZWQlFWa3NRMEZCWlN4RlFVRkZMRkZCUVd0RE8xRkJRek5FTEVsQlFVa3NUMEZCVHl4RFFVRkRMRU5CUVVNc1EwRkJReXhGUVVGRk8xbEJRMW9zU1VGQlNTeFBRVUZQTEVOQlFVTXNRMEZCUXl4TlFVRk5MRXRCUVVzc1YwRkJWeXhGUVVGRk8yZENRVU5xUXl4RFFVRkRMRU5CUVVNc1RVRkJUU3hEUVVGRExFOUJRVThzUTBGQlF5eFZRVUZCTEVOQlFVTTdiMEpCUTJRc1EwRkJReXhEUVVGRExFMUJRVTBzUTBGQlF5eFZRVUZWTEVOQlFVTXNVVUZCVVN4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRE8yOUNRVU5vUXl4RFFVRkRMRU5CUVVNc1RVRkJUU3hEUVVGRExGVkJRVlVzUTBGQlF5eFJRVUZSTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN2IwSkJRekZDTEVOQlFVVXNRMEZCUXl4RlFVRkZMRWRCUVZNc1EwRkJSU3hEUVVGRExHbENRVUZwUWl4SFFVRkhMRkZCUVZFc1EwRkJReXhEUVVGRExFTkJRVU03YjBKQlEyaEVMRU5CUVVVc1EwRkJReXhGUVVGRkxFZEJRVk1zUTBGQlJTeERRVUZETEdsQ1FVRnBRaXhIUVVGSExGRkJRVkVzUTBGQlF5eERRVUZETEVOQlFVTTdaMEpCUXpGRUxFTkJRVU1zUTBGQlF5eERRVUZETzJGQlEwNDdXVUZEUkN4SlFVRkpMRTlCUVU4c1EwRkJReXhEUVVGRExFMUJRVTBzUzBGQlN5eFhRVUZYTEVWQlFVVTdaMEpCUTJwRExFTkJRVU1zUTBGQlF5eE5RVUZOTEVOQlFVTXNUMEZCVHl4RFFVRkRMRlZCUVVFc1EwRkJReXhKUVVGSkxFOUJRVUVzVFVGQlRTeERRVUZETEVsQlFVa3NRMEZCUXl4RFFVRkRMRVZCUVVVc1VVRkJVU3hEUVVGRExFVkJRWGhDTEVOQlFYZENMRU5CUVVNc1EwRkJRenRoUVVOdVJEdFRRVU5LTzJGQlFVMDdXVUZEUnl4RFFVRkZMRU5CUVVNc1JVRkJSU3hIUVVGSExGRkJRVkVzUTBGQlF5eERRVUZETEVOQlFVTTdXVUZEYmtJc1EwRkJSU3hEUVVGRExFVkJRVVVzUjBGQlJ5eFJRVUZSTEVOQlFVTXNRMEZCUXl4RFFVRkRPMU5CUXpWQ08wbEJRMHdzUTBGQlF6dEpRVWxOTEdOQlFVOHNSMEZCWkN4VlFVRmxMRU5CUVVNN1VVRkRXaXhKUVVGSkxFOUJRVThzUTBGQlF5eERRVUZETEVOQlFVTXNSVUZCUlR0WlFVTmFMRWxCUVVrc1QwRkJUeXhEUVVGRExFTkJRVU1zVFVGQlRTeExRVUZMTEZkQlFWY3NSVUZCUlR0blFrRkRha01zUTBGQlF5eERRVUZETEUxQlFVMHNRMEZCUXl4UFFVRlBMRU5CUVVNc1ZVRkJRU3hEUVVGRE8yOUNRVU5rTEUxQlFVMHNRMEZCUXl4UFFVRlBMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU03YjBKQlEyeENMRTlCUVdFc1EwRkJSU3hEUVVGRExHbENRVUZwUWl4RFFVRkRPMjlDUVVOc1F5eFBRVUZoTEVOQlFVVXNRMEZCUXl4cFFrRkJhVUlzUTBGQlF6dG5Ra0ZEZEVNc1EwRkJReXhEUVVGRExFTkJRVU03WVVGRFRqdFpRVU5FTEVsQlFVa3NUMEZCVHl4RFFVRkRMRU5CUVVNc1RVRkJUU3hMUVVGTExGZEJRVmNzUlVGQlJUdG5Ra0ZEYWtNc1EwRkJReXhEUVVGRExFMUJRVTBzUTBGQlF5eFBRVUZQTEVOQlFVTXNUVUZCVFN4RFFVRkRMRTlCUVU4c1EwRkJReXhEUVVGRE8yRkJRM0JETzFOQlEwbzdZVUZCVFR0WlFVTklMRU5CUVVNc1EwRkJReXhMUVVGTExFbEJRVWtzUTBGQlF5eERRVUZETEVOQlFVTTdVMEZGYWtJN1NVRkRUQ3hEUVVGRE8wbEJSMDBzWjBKQlFWTXNSMEZCYUVJc1ZVRkJhVUlzUTBGQlF6dFJRVU5rTEVOQlFVTXNRMEZCUXl4TFFVRkxMRWxCUVVrc1EwRkJReXhEUVVGRE8xRkJRMklzUTBGQlF5eERRVUZETEVWQlFVVXNSMEZCUnl4RFFVRkRMRU5CUVVNc1EwRkJReXhGUVVGRkxFTkJRVU1zUTBGQlF5eEZRVUZGTEVkQlFVY3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJRenRKUVVNelFpeERRVUZETzBsQlIwMHNaVUZCVVN4SFFVRm1MRlZCUVdkQ0xFTkJRVU03VVVGRFlpeERRVUZETEVOQlFVTXNTMEZCU3l4SlFVRkpMRU5CUVVNc1EwRkJReXhEUVVGRE8wbEJRMnhDTEVOQlFVTTdTVUZEVEN4aFFVRkRPMEZCUVVRc1EwRkJReXhCUVhaNVFrUXNTVUYxZVVKRE8wRkJkbmxDV1N4M1FrRkJUU0o5IiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgc2hvcnRlc3RwYXRoc18xID0gcmVxdWlyZShcIi4vc2hvcnRlc3RwYXRoc1wiKTtcbnZhciBkZXNjZW50XzEgPSByZXF1aXJlKFwiLi9kZXNjZW50XCIpO1xudmFyIHJlY3RhbmdsZV8xID0gcmVxdWlyZShcIi4vcmVjdGFuZ2xlXCIpO1xudmFyIGxpbmtsZW5ndGhzXzEgPSByZXF1aXJlKFwiLi9saW5rbGVuZ3Roc1wiKTtcbnZhciBMaW5rM0QgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIExpbmszRChzb3VyY2UsIHRhcmdldCkge1xuICAgICAgICB0aGlzLnNvdXJjZSA9IHNvdXJjZTtcbiAgICAgICAgdGhpcy50YXJnZXQgPSB0YXJnZXQ7XG4gICAgfVxuICAgIExpbmszRC5wcm90b3R5cGUuYWN0dWFsTGVuZ3RoID0gZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgcmV0dXJuIE1hdGguc3FydCh4LnJlZHVjZShmdW5jdGlvbiAoYywgdikge1xuICAgICAgICAgICAgdmFyIGR4ID0gdltfdGhpcy50YXJnZXRdIC0gdltfdGhpcy5zb3VyY2VdO1xuICAgICAgICAgICAgcmV0dXJuIGMgKyBkeCAqIGR4O1xuICAgICAgICB9LCAwKSk7XG4gICAgfTtcbiAgICByZXR1cm4gTGluazNEO1xufSgpKTtcbmV4cG9ydHMuTGluazNEID0gTGluazNEO1xudmFyIE5vZGUzRCA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gTm9kZTNEKHgsIHksIHopIHtcbiAgICAgICAgaWYgKHggPT09IHZvaWQgMCkgeyB4ID0gMDsgfVxuICAgICAgICBpZiAoeSA9PT0gdm9pZCAwKSB7IHkgPSAwOyB9XG4gICAgICAgIGlmICh6ID09PSB2b2lkIDApIHsgeiA9IDA7IH1cbiAgICAgICAgdGhpcy54ID0geDtcbiAgICAgICAgdGhpcy55ID0geTtcbiAgICAgICAgdGhpcy56ID0gejtcbiAgICB9XG4gICAgcmV0dXJuIE5vZGUzRDtcbn0oKSk7XG5leHBvcnRzLk5vZGUzRCA9IE5vZGUzRDtcbnZhciBMYXlvdXQzRCA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gTGF5b3V0M0Qobm9kZXMsIGxpbmtzLCBpZGVhbExpbmtMZW5ndGgpIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgaWYgKGlkZWFsTGlua0xlbmd0aCA9PT0gdm9pZCAwKSB7IGlkZWFsTGlua0xlbmd0aCA9IDE7IH1cbiAgICAgICAgdGhpcy5ub2RlcyA9IG5vZGVzO1xuICAgICAgICB0aGlzLmxpbmtzID0gbGlua3M7XG4gICAgICAgIHRoaXMuaWRlYWxMaW5rTGVuZ3RoID0gaWRlYWxMaW5rTGVuZ3RoO1xuICAgICAgICB0aGlzLmNvbnN0cmFpbnRzID0gbnVsbDtcbiAgICAgICAgdGhpcy51c2VKYWNjYXJkTGlua0xlbmd0aHMgPSB0cnVlO1xuICAgICAgICB0aGlzLnJlc3VsdCA9IG5ldyBBcnJheShMYXlvdXQzRC5rKTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBMYXlvdXQzRC5rOyArK2kpIHtcbiAgICAgICAgICAgIHRoaXMucmVzdWx0W2ldID0gbmV3IEFycmF5KG5vZGVzLmxlbmd0aCk7XG4gICAgICAgIH1cbiAgICAgICAgbm9kZXMuZm9yRWFjaChmdW5jdGlvbiAodiwgaSkge1xuICAgICAgICAgICAgZm9yICh2YXIgX2kgPSAwLCBfYSA9IExheW91dDNELmRpbXM7IF9pIDwgX2EubGVuZ3RoOyBfaSsrKSB7XG4gICAgICAgICAgICAgICAgdmFyIGRpbSA9IF9hW19pXTtcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHZbZGltXSA9PSAndW5kZWZpbmVkJylcbiAgICAgICAgICAgICAgICAgICAgdltkaW1dID0gTWF0aC5yYW5kb20oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIF90aGlzLnJlc3VsdFswXVtpXSA9IHYueDtcbiAgICAgICAgICAgIF90aGlzLnJlc3VsdFsxXVtpXSA9IHYueTtcbiAgICAgICAgICAgIF90aGlzLnJlc3VsdFsyXVtpXSA9IHYuejtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIDtcbiAgICBMYXlvdXQzRC5wcm90b3R5cGUubGlua0xlbmd0aCA9IGZ1bmN0aW9uIChsKSB7XG4gICAgICAgIHJldHVybiBsLmFjdHVhbExlbmd0aCh0aGlzLnJlc3VsdCk7XG4gICAgfTtcbiAgICBMYXlvdXQzRC5wcm90b3R5cGUuc3RhcnQgPSBmdW5jdGlvbiAoaXRlcmF0aW9ucykge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICBpZiAoaXRlcmF0aW9ucyA9PT0gdm9pZCAwKSB7IGl0ZXJhdGlvbnMgPSAxMDA7IH1cbiAgICAgICAgdmFyIG4gPSB0aGlzLm5vZGVzLmxlbmd0aDtcbiAgICAgICAgdmFyIGxpbmtBY2Nlc3NvciA9IG5ldyBMaW5rQWNjZXNzb3IoKTtcbiAgICAgICAgaWYgKHRoaXMudXNlSmFjY2FyZExpbmtMZW5ndGhzKVxuICAgICAgICAgICAgbGlua2xlbmd0aHNfMS5qYWNjYXJkTGlua0xlbmd0aHModGhpcy5saW5rcywgbGlua0FjY2Vzc29yLCAxLjUpO1xuICAgICAgICB0aGlzLmxpbmtzLmZvckVhY2goZnVuY3Rpb24gKGUpIHsgcmV0dXJuIGUubGVuZ3RoICo9IF90aGlzLmlkZWFsTGlua0xlbmd0aDsgfSk7XG4gICAgICAgIHZhciBkaXN0YW5jZU1hdHJpeCA9IChuZXcgc2hvcnRlc3RwYXRoc18xLkNhbGN1bGF0b3IobiwgdGhpcy5saW5rcywgZnVuY3Rpb24gKGUpIHsgcmV0dXJuIGUuc291cmNlOyB9LCBmdW5jdGlvbiAoZSkgeyByZXR1cm4gZS50YXJnZXQ7IH0sIGZ1bmN0aW9uIChlKSB7IHJldHVybiBlLmxlbmd0aDsgfSkpLkRpc3RhbmNlTWF0cml4KCk7XG4gICAgICAgIHZhciBEID0gZGVzY2VudF8xLkRlc2NlbnQuY3JlYXRlU3F1YXJlTWF0cml4KG4sIGZ1bmN0aW9uIChpLCBqKSB7IHJldHVybiBkaXN0YW5jZU1hdHJpeFtpXVtqXTsgfSk7XG4gICAgICAgIHZhciBHID0gZGVzY2VudF8xLkRlc2NlbnQuY3JlYXRlU3F1YXJlTWF0cml4KG4sIGZ1bmN0aW9uICgpIHsgcmV0dXJuIDI7IH0pO1xuICAgICAgICB0aGlzLmxpbmtzLmZvckVhY2goZnVuY3Rpb24gKF9hKSB7XG4gICAgICAgICAgICB2YXIgc291cmNlID0gX2Euc291cmNlLCB0YXJnZXQgPSBfYS50YXJnZXQ7XG4gICAgICAgICAgICByZXR1cm4gR1tzb3VyY2VdW3RhcmdldF0gPSBHW3RhcmdldF1bc291cmNlXSA9IDE7XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLmRlc2NlbnQgPSBuZXcgZGVzY2VudF8xLkRlc2NlbnQodGhpcy5yZXN1bHQsIEQpO1xuICAgICAgICB0aGlzLmRlc2NlbnQudGhyZXNob2xkID0gMWUtMztcbiAgICAgICAgdGhpcy5kZXNjZW50LkcgPSBHO1xuICAgICAgICBpZiAodGhpcy5jb25zdHJhaW50cylcbiAgICAgICAgICAgIHRoaXMuZGVzY2VudC5wcm9qZWN0ID0gbmV3IHJlY3RhbmdsZV8xLlByb2plY3Rpb24odGhpcy5ub2RlcywgbnVsbCwgbnVsbCwgdGhpcy5jb25zdHJhaW50cykucHJvamVjdEZ1bmN0aW9ucygpO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMubm9kZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciB2ID0gdGhpcy5ub2Rlc1tpXTtcbiAgICAgICAgICAgIGlmICh2LmZpeGVkKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5kZXNjZW50LmxvY2tzLmFkZChpLCBbdi54LCB2LnksIHYuel0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHRoaXMuZGVzY2VudC5ydW4oaXRlcmF0aW9ucyk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgTGF5b3V0M0QucHJvdG90eXBlLnRpY2sgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuZGVzY2VudC5sb2Nrcy5jbGVhcigpO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMubm9kZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciB2ID0gdGhpcy5ub2Rlc1tpXTtcbiAgICAgICAgICAgIGlmICh2LmZpeGVkKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5kZXNjZW50LmxvY2tzLmFkZChpLCBbdi54LCB2LnksIHYuel0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzLmRlc2NlbnQucnVuZ2VLdXR0YSgpO1xuICAgIH07XG4gICAgTGF5b3V0M0QuZGltcyA9IFsneCcsICd5JywgJ3onXTtcbiAgICBMYXlvdXQzRC5rID0gTGF5b3V0M0QuZGltcy5sZW5ndGg7XG4gICAgcmV0dXJuIExheW91dDNEO1xufSgpKTtcbmV4cG9ydHMuTGF5b3V0M0QgPSBMYXlvdXQzRDtcbnZhciBMaW5rQWNjZXNzb3IgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIExpbmtBY2Nlc3NvcigpIHtcbiAgICB9XG4gICAgTGlua0FjY2Vzc29yLnByb3RvdHlwZS5nZXRTb3VyY2VJbmRleCA9IGZ1bmN0aW9uIChlKSB7IHJldHVybiBlLnNvdXJjZTsgfTtcbiAgICBMaW5rQWNjZXNzb3IucHJvdG90eXBlLmdldFRhcmdldEluZGV4ID0gZnVuY3Rpb24gKGUpIHsgcmV0dXJuIGUudGFyZ2V0OyB9O1xuICAgIExpbmtBY2Nlc3Nvci5wcm90b3R5cGUuZ2V0TGVuZ3RoID0gZnVuY3Rpb24gKGUpIHsgcmV0dXJuIGUubGVuZ3RoOyB9O1xuICAgIExpbmtBY2Nlc3Nvci5wcm90b3R5cGUuc2V0TGVuZ3RoID0gZnVuY3Rpb24gKGUsIGwpIHsgZS5sZW5ndGggPSBsOyB9O1xuICAgIHJldHVybiBMaW5rQWNjZXNzb3I7XG59KCkpO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9ZGF0YTphcHBsaWNhdGlvbi9qc29uO2Jhc2U2NCxleUoyWlhKemFXOXVJam96TENKbWFXeGxJam9pYkdGNWIzVjBNMlF1YW5NaUxDSnpiM1Z5WTJWU2IyOTBJam9pSWl3aWMyOTFjbU5sY3lJNld5SXVMaTh1TGk5WFpXSkRiMnhoTDNOeVl5OXNZWGx2ZFhRelpDNTBjeUpkTENKdVlXMWxjeUk2VzEwc0ltMWhjSEJwYm1keklqb2lPenRCUVVGQkxHbEVRVUV3UXp0QlFVTXhReXh4UTBGQmFVTTdRVUZEYWtNc2VVTkJRVFJFTzBGQlJUVkVMRFpEUVVGdlJUdEJRVVZ3UlR0SlFVVlJMR2RDUVVGdFFpeE5RVUZqTEVWQlFWTXNUVUZCWXp0UlFVRnlReXhYUVVGTkxFZEJRVTRzVFVGQlRTeERRVUZSTzFGQlFWTXNWMEZCVFN4SFFVRk9MRTFCUVUwc1EwRkJVVHRKUVVGSkxFTkJRVU03U1VGRE4wUXNOa0pCUVZrc1IwRkJXaXhWUVVGaExFTkJRV0U3VVVGQk1VSXNhVUpCVFVNN1VVRk1SeXhQUVVGUExFbEJRVWtzUTBGQlF5eEpRVUZKTEVOQlExb3NRMEZCUXl4RFFVRkRMRTFCUVUwc1EwRkJReXhWUVVGRExFTkJRVk1zUlVGQlJTeERRVUZYTzFsQlF6VkNMRWxCUVUwc1JVRkJSU3hIUVVGSExFTkJRVU1zUTBGQlF5eExRVUZKTEVOQlFVTXNUVUZCVFN4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRExFdEJRVWtzUTBGQlF5eE5RVUZOTEVOQlFVTXNRMEZCUXp0WlFVTXpReXhQUVVGUExFTkJRVU1zUjBGQlJ5eEZRVUZGTEVkQlFVY3NSVUZCUlN4RFFVRkRPMUZCUTNaQ0xFTkJRVU1zUlVGQlJTeERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRPMGxCUTJZc1EwRkJRenRKUVVOTUxHRkJRVU03UVVGQlJDeERRVUZETEVGQlZrd3NTVUZWU3p0QlFWWlJMSGRDUVVGTk8wRkJWMlk3U1VGVFNTeG5Ra0ZEVnl4RFFVRmhMRVZCUTJJc1EwRkJZU3hGUVVOaUxFTkJRV0U3VVVGR1lpeHJRa0ZCUVN4RlFVRkJMRXRCUVdFN1VVRkRZaXhyUWtGQlFTeEZRVUZCTEV0QlFXRTdVVUZEWWl4clFrRkJRU3hGUVVGQkxFdEJRV0U3VVVGR1lpeE5RVUZETEVkQlFVUXNRMEZCUXl4RFFVRlpPMUZCUTJJc1RVRkJReXhIUVVGRUxFTkJRVU1zUTBGQldUdFJRVU5pTEUxQlFVTXNSMEZCUkN4RFFVRkRMRU5CUVZrN1NVRkJTU3hEUVVGRE8wbEJRMnBETEdGQlFVTTdRVUZCUkN4RFFVRkRMRUZCWWtRc1NVRmhRenRCUVdKWkxIZENRVUZOTzBGQlkyNUNPMGxCVFVrc2EwSkJRVzFDTEV0QlFXVXNSVUZCVXl4TFFVRmxMRVZCUVZNc1pVRkJNa0k3VVVGQk9VWXNhVUpCWVVNN1VVRmlhMFVzWjBOQlFVRXNSVUZCUVN4dFFrRkJNa0k3VVVGQk0wVXNWVUZCU3l4SFFVRk1MRXRCUVVzc1EwRkJWVHRSUVVGVExGVkJRVXNzUjBGQlRDeExRVUZMTEVOQlFWVTdVVUZCVXl4dlFrRkJaU3hIUVVGbUxHVkJRV1VzUTBGQldUdFJRVVk1Uml4blFrRkJWeXhIUVVGVkxFbEJRVWtzUTBGQlF6dFJRWEZDTVVJc01FSkJRWEZDTEVkQlFWa3NTVUZCU1N4RFFVRkRPMUZCYkVKc1F5eEpRVUZKTEVOQlFVTXNUVUZCVFN4SFFVRkhMRWxCUVVrc1MwRkJTeXhEUVVGRExGRkJRVkVzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0UlFVTndReXhMUVVGTExFbEJRVWtzUTBGQlF5eEhRVUZITEVOQlFVTXNSVUZCUlN4RFFVRkRMRWRCUVVjc1VVRkJVU3hEUVVGRExFTkJRVU1zUlVGQlJTeEZRVUZGTEVOQlFVTXNSVUZCUlR0WlFVTnFReXhKUVVGSkxFTkJRVU1zVFVGQlRTeERRVUZETEVOQlFVTXNRMEZCUXl4SFFVRkhMRWxCUVVrc1MwRkJTeXhEUVVGRExFdEJRVXNzUTBGQlF5eE5RVUZOTEVOQlFVTXNRMEZCUXp0VFFVTTFRenRSUVVORUxFdEJRVXNzUTBGQlF5eFBRVUZQTEVOQlFVTXNWVUZCUXl4RFFVRkRMRVZCUVVVc1EwRkJRenRaUVVObUxFdEJRV2RDTEZWQlFXRXNSVUZCWWl4TFFVRkJMRkZCUVZFc1EwRkJReXhKUVVGSkxFVkJRV0lzWTBGQllTeEZRVUZpTEVsQlFXRXNSVUZCUlR0blFrRkJNVUlzU1VGQlNTeEhRVUZITEZOQlFVRTdaMEpCUTFJc1NVRkJTU3hQUVVGUExFTkJRVU1zUTBGQlF5eEhRVUZITEVOQlFVTXNTVUZCU1N4WFFVRlhPMjlDUVVGRkxFTkJRVU1zUTBGQlF5eEhRVUZITEVOQlFVTXNSMEZCUnl4SlFVRkpMRU5CUVVNc1RVRkJUU3hGUVVGRkxFTkJRVU03WVVGRE5VUTdXVUZEUkN4TFFVRkpMRU5CUVVNc1RVRkJUU3hEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU03V1VGRGVFSXNTMEZCU1N4RFFVRkRMRTFCUVUwc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRE8xbEJRM2hDTEV0QlFVa3NRMEZCUXl4TlFVRk5MRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVkQlFVY3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJRenRSUVVNMVFpeERRVUZETEVOQlFVTXNRMEZCUXp0SlFVTlFMRU5CUVVNN1NVRkJRU3hEUVVGRE8wbEJSVVlzTmtKQlFWVXNSMEZCVml4VlFVRlhMRU5CUVZNN1VVRkRhRUlzVDBGQlR5eERRVUZETEVOQlFVTXNXVUZCV1N4RFFVRkRMRWxCUVVrc1EwRkJReXhOUVVGTkxFTkJRVU1zUTBGQlF6dEpRVU4yUXl4RFFVRkRPMGxCUzBRc2QwSkJRVXNzUjBGQlRDeFZRVUZOTEZWQlFYZENPMUZCUVRsQ0xHbENRWFZEUXp0UlFYWkRTeXd5UWtGQlFTeEZRVUZCTEdkQ1FVRjNRanRSUVVNeFFpeEpRVUZOTEVOQlFVTXNSMEZCUnl4SlFVRkpMRU5CUVVNc1MwRkJTeXhEUVVGRExFMUJRVTBzUTBGQlF6dFJRVVUxUWl4SlFVRkpMRmxCUVZrc1IwRkJSeXhKUVVGSkxGbEJRVmtzUlVGQlJTeERRVUZETzFGQlJYUkRMRWxCUVVrc1NVRkJTU3hEUVVGRExIRkNRVUZ4UWp0WlFVTXhRaXhuUTBGQmEwSXNRMEZCUXl4SlFVRkpMRU5CUVVNc1MwRkJTeXhGUVVGRkxGbEJRVmtzUlVGQlJTeEhRVUZITEVOQlFVTXNRMEZCUXp0UlFVVjBSQ3hKUVVGSkxFTkJRVU1zUzBGQlN5eERRVUZETEU5QlFVOHNRMEZCUXl4VlFVRkJMRU5CUVVNc1NVRkJTU3hQUVVGQkxFTkJRVU1zUTBGQlF5eE5RVUZOTEVsQlFVa3NTMEZCU1N4RFFVRkRMR1ZCUVdVc1JVRkJhRU1zUTBGQlowTXNRMEZCUXl4RFFVRkRPMUZCUnpGRUxFbEJRVTBzWTBGQll5eEhRVUZITEVOQlFVTXNTVUZCU1N3d1FrRkJWU3hEUVVGRExFTkJRVU1zUlVGQlJTeEpRVUZKTEVOQlFVTXNTMEZCU3l4RlFVTm9SQ3hWUVVGQkxFTkJRVU1zU1VGQlJ5eFBRVUZCTEVOQlFVTXNRMEZCUXl4TlFVRk5MRVZCUVZJc1EwRkJVU3hGUVVGRkxGVkJRVUVzUTBGQlF5eEpRVUZITEU5QlFVRXNRMEZCUXl4RFFVRkRMRTFCUVUwc1JVRkJVaXhEUVVGUkxFVkJRVVVzVlVGQlFTeERRVUZETEVsQlFVa3NUMEZCUVN4RFFVRkRMRU5CUVVNc1RVRkJUU3hGUVVGU0xFTkJRVkVzUTBGQlF5eERRVUZETEVOQlFVTXNZMEZCWXl4RlFVRkZMRU5CUVVNN1VVRkZha1VzU1VGQlRTeERRVUZETEVkQlFVY3NhVUpCUVU4c1EwRkJReXhyUWtGQmEwSXNRMEZCUXl4RFFVRkRMRVZCUVVVc1ZVRkJReXhEUVVGRExFVkJRVVVzUTBGQlF5eEpRVUZMTEU5QlFVRXNZMEZCWXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eEZRVUZ3UWl4RFFVRnZRaXhEUVVGRExFTkJRVU03VVVGSmVFVXNTVUZCU1N4RFFVRkRMRWRCUVVjc2FVSkJRVThzUTBGQlF5eHJRa0ZCYTBJc1EwRkJReXhEUVVGRExFVkJRVVVzWTBGQll5eFBRVUZQTEVOQlFVTXNRMEZCUVN4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRE8xRkJRMmhGTEVsQlFVa3NRMEZCUXl4TFFVRkxMRU5CUVVNc1QwRkJUeXhEUVVGRExGVkJRVU1zUlVGQmEwSTdaMEpCUVdoQ0xHdENRVUZOTEVWQlFVVXNhMEpCUVUwN1dVRkJUeXhQUVVGQkxFTkJRVU1zUTBGQlF5eE5RVUZOTEVOQlFVTXNRMEZCUXl4TlFVRk5MRU5CUVVNc1IwRkJSeXhEUVVGRExFTkJRVU1zVFVGQlRTeERRVUZETEVOQlFVTXNUVUZCVFN4RFFVRkRMRWRCUVVjc1EwRkJRenRSUVVGNlF5eERRVUY1UXl4RFFVRkRMRU5CUVVNN1VVRkZkRVlzU1VGQlNTeERRVUZETEU5QlFVOHNSMEZCUnl4SlFVRkpMR2xDUVVGUExFTkJRVU1zU1VGQlNTeERRVUZETEUxQlFVMHNSVUZCUlN4RFFVRkRMRU5CUVVNc1EwRkJRenRSUVVNelF5eEpRVUZKTEVOQlFVTXNUMEZCVHl4RFFVRkRMRk5CUVZNc1IwRkJSeXhKUVVGSkxFTkJRVU03VVVGRE9VSXNTVUZCU1N4RFFVRkRMRTlCUVU4c1EwRkJReXhEUVVGRExFZEJRVWNzUTBGQlF5eERRVUZETzFGQlNXNUNMRWxCUVVrc1NVRkJTU3hEUVVGRExGZEJRVmM3V1VGRGFFSXNTVUZCU1N4RFFVRkRMRTlCUVU4c1EwRkJReXhQUVVGUExFZEJRVWNzU1VGQlNTeHpRa0ZCVlN4RFFVRmpMRWxCUVVrc1EwRkJReXhMUVVGTExFVkJRVVVzU1VGQlNTeEZRVUZGTEVsQlFVa3NSVUZCUlN4SlFVRkpMRU5CUVVNc1YwRkJWeXhEUVVGRExFTkJRVU1zWjBKQlFXZENMRVZCUVVVc1EwRkJRenRSUVVWd1NDeExRVUZMTEVsQlFVa3NRMEZCUXl4SFFVRkhMRU5CUVVNc1JVRkJSU3hEUVVGRExFZEJRVWNzU1VGQlNTeERRVUZETEV0QlFVc3NRMEZCUXl4TlFVRk5MRVZCUVVVc1EwRkJReXhGUVVGRkxFVkJRVVU3V1VGRGVFTXNTVUZCU1N4RFFVRkRMRWRCUVVjc1NVRkJTU3hEUVVGRExFdEJRVXNzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0WlFVTjBRaXhKUVVGSkxFTkJRVU1zUTBGQlF5eExRVUZMTEVWQlFVVTdaMEpCUTFRc1NVRkJTU3hEUVVGRExFOUJRVThzUTBGQlF5eExRVUZMTEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNc1JVRkJSU3hEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVWQlFVVXNRMEZCUXl4RFFVRkRMRU5CUVVNc1JVRkJSU3hEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0aFFVTTVRenRUUVVOS08xRkJSVVFzU1VGQlNTeERRVUZETEU5QlFVOHNRMEZCUXl4SFFVRkhMRU5CUVVNc1ZVRkJWU3hEUVVGRExFTkJRVU03VVVGRE4wSXNUMEZCVHl4SlFVRkpMRU5CUVVNN1NVRkRhRUlzUTBGQlF6dEpRVVZFTEhWQ1FVRkpMRWRCUVVvN1VVRkRTU3hKUVVGSkxFTkJRVU1zVDBGQlR5eERRVUZETEV0QlFVc3NRMEZCUXl4TFFVRkxMRVZCUVVVc1EwRkJRenRSUVVNelFpeExRVUZMTEVsQlFVa3NRMEZCUXl4SFFVRkhMRU5CUVVNc1JVRkJSU3hEUVVGRExFZEJRVWNzU1VGQlNTeERRVUZETEV0QlFVc3NRMEZCUXl4TlFVRk5MRVZCUVVVc1EwRkJReXhGUVVGRkxFVkJRVVU3V1VGRGVFTXNTVUZCU1N4RFFVRkRMRWRCUVVjc1NVRkJTU3hEUVVGRExFdEJRVXNzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0WlFVTjBRaXhKUVVGSkxFTkJRVU1zUTBGQlF5eExRVUZMTEVWQlFVVTdaMEpCUTFRc1NVRkJTU3hEUVVGRExFOUJRVThzUTBGQlF5eExRVUZMTEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNc1JVRkJSU3hEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVWQlFVVXNRMEZCUXl4RFFVRkRMRU5CUVVNc1JVRkJSU3hEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0aFFVTTVRenRUUVVOS08xRkJRMFFzVDBGQlR5eEpRVUZKTEVOQlFVTXNUMEZCVHl4RFFVRkRMRlZCUVZVc1JVRkJSU3hEUVVGRE8wbEJRM0pETEVOQlFVTTdTVUUzUlUwc1lVRkJTU3hIUVVGSExFTkJRVU1zUjBGQlJ5eEZRVUZGTEVkQlFVY3NSVUZCUlN4SFFVRkhMRU5CUVVNc1EwRkJRenRKUVVOMlFpeFZRVUZETEVkQlFVY3NVVUZCVVN4RFFVRkRMRWxCUVVrc1EwRkJReXhOUVVGTkxFTkJRVU03U1VFMlJYQkRMR1ZCUVVNN1EwRkJRU3hCUVM5RlJDeEpRU3RGUXp0QlFTOUZXU3cwUWtGQlVUdEJRV2xHY2tJN1NVRkJRVHRKUVV0QkxFTkJRVU03U1VGS1J5eHhRMEZCWXl4SFFVRmtMRlZCUVdVc1EwRkJUU3hKUVVGWkxFOUJRVThzUTBGQlF5eERRVUZETEUxQlFVMHNRMEZCUXl4RFFVRkRMRU5CUVVNN1NVRkRia1FzY1VOQlFXTXNSMEZCWkN4VlFVRmxMRU5CUVUwc1NVRkJXU3hQUVVGUExFTkJRVU1zUTBGQlF5eE5RVUZOTEVOQlFVTXNRMEZCUXl4RFFVRkRPMGxCUTI1RUxHZERRVUZUTEVkQlFWUXNWVUZCVlN4RFFVRk5MRWxCUVZrc1QwRkJUeXhEUVVGRExFTkJRVU1zVFVGQlRTeERRVUZETEVOQlFVTXNRMEZCUXp0SlFVTTVReXhuUTBGQlV5eEhRVUZVTEZWQlFWVXNRMEZCVFN4RlFVRkZMRU5CUVZNc1NVRkJTU3hEUVVGRExFTkJRVU1zVFVGQlRTeEhRVUZITEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1NVRkRiRVFzYlVKQlFVTTdRVUZCUkN4RFFVRkRMRUZCVEVRc1NVRkxReUo5IiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5mdW5jdGlvbiB1bmlvbkNvdW50KGEsIGIpIHtcbiAgICB2YXIgdSA9IHt9O1xuICAgIGZvciAodmFyIGkgaW4gYSlcbiAgICAgICAgdVtpXSA9IHt9O1xuICAgIGZvciAodmFyIGkgaW4gYilcbiAgICAgICAgdVtpXSA9IHt9O1xuICAgIHJldHVybiBPYmplY3Qua2V5cyh1KS5sZW5ndGg7XG59XG5mdW5jdGlvbiBpbnRlcnNlY3Rpb25Db3VudChhLCBiKSB7XG4gICAgdmFyIG4gPSAwO1xuICAgIGZvciAodmFyIGkgaW4gYSlcbiAgICAgICAgaWYgKHR5cGVvZiBiW2ldICE9PSAndW5kZWZpbmVkJylcbiAgICAgICAgICAgICsrbjtcbiAgICByZXR1cm4gbjtcbn1cbmZ1bmN0aW9uIGdldE5laWdoYm91cnMobGlua3MsIGxhKSB7XG4gICAgdmFyIG5laWdoYm91cnMgPSB7fTtcbiAgICB2YXIgYWRkTmVpZ2hib3VycyA9IGZ1bmN0aW9uICh1LCB2KSB7XG4gICAgICAgIGlmICh0eXBlb2YgbmVpZ2hib3Vyc1t1XSA9PT0gJ3VuZGVmaW5lZCcpXG4gICAgICAgICAgICBuZWlnaGJvdXJzW3VdID0ge307XG4gICAgICAgIG5laWdoYm91cnNbdV1bdl0gPSB7fTtcbiAgICB9O1xuICAgIGxpbmtzLmZvckVhY2goZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgdmFyIHUgPSBsYS5nZXRTb3VyY2VJbmRleChlKSwgdiA9IGxhLmdldFRhcmdldEluZGV4KGUpO1xuICAgICAgICBhZGROZWlnaGJvdXJzKHUsIHYpO1xuICAgICAgICBhZGROZWlnaGJvdXJzKHYsIHUpO1xuICAgIH0pO1xuICAgIHJldHVybiBuZWlnaGJvdXJzO1xufVxuZnVuY3Rpb24gY29tcHV0ZUxpbmtMZW5ndGhzKGxpbmtzLCB3LCBmLCBsYSkge1xuICAgIHZhciBuZWlnaGJvdXJzID0gZ2V0TmVpZ2hib3VycyhsaW5rcywgbGEpO1xuICAgIGxpbmtzLmZvckVhY2goZnVuY3Rpb24gKGwpIHtcbiAgICAgICAgdmFyIGEgPSBuZWlnaGJvdXJzW2xhLmdldFNvdXJjZUluZGV4KGwpXTtcbiAgICAgICAgdmFyIGIgPSBuZWlnaGJvdXJzW2xhLmdldFRhcmdldEluZGV4KGwpXTtcbiAgICAgICAgbGEuc2V0TGVuZ3RoKGwsIDEgKyB3ICogZihhLCBiKSk7XG4gICAgfSk7XG59XG5mdW5jdGlvbiBzeW1tZXRyaWNEaWZmTGlua0xlbmd0aHMobGlua3MsIGxhLCB3KSB7XG4gICAgaWYgKHcgPT09IHZvaWQgMCkgeyB3ID0gMTsgfVxuICAgIGNvbXB1dGVMaW5rTGVuZ3RocyhsaW5rcywgdywgZnVuY3Rpb24gKGEsIGIpIHsgcmV0dXJuIE1hdGguc3FydCh1bmlvbkNvdW50KGEsIGIpIC0gaW50ZXJzZWN0aW9uQ291bnQoYSwgYikpOyB9LCBsYSk7XG59XG5leHBvcnRzLnN5bW1ldHJpY0RpZmZMaW5rTGVuZ3RocyA9IHN5bW1ldHJpY0RpZmZMaW5rTGVuZ3RocztcbmZ1bmN0aW9uIGphY2NhcmRMaW5rTGVuZ3RocyhsaW5rcywgbGEsIHcpIHtcbiAgICBpZiAodyA9PT0gdm9pZCAwKSB7IHcgPSAxOyB9XG4gICAgY29tcHV0ZUxpbmtMZW5ndGhzKGxpbmtzLCB3LCBmdW5jdGlvbiAoYSwgYikge1xuICAgICAgICByZXR1cm4gTWF0aC5taW4oT2JqZWN0LmtleXMoYSkubGVuZ3RoLCBPYmplY3Qua2V5cyhiKS5sZW5ndGgpIDwgMS4xID8gMCA6IGludGVyc2VjdGlvbkNvdW50KGEsIGIpIC8gdW5pb25Db3VudChhLCBiKTtcbiAgICB9LCBsYSk7XG59XG5leHBvcnRzLmphY2NhcmRMaW5rTGVuZ3RocyA9IGphY2NhcmRMaW5rTGVuZ3RocztcbmZ1bmN0aW9uIGdlbmVyYXRlRGlyZWN0ZWRFZGdlQ29uc3RyYWludHMobiwgbGlua3MsIGF4aXMsIGxhKSB7XG4gICAgdmFyIGNvbXBvbmVudHMgPSBzdHJvbmdseUNvbm5lY3RlZENvbXBvbmVudHMobiwgbGlua3MsIGxhKTtcbiAgICB2YXIgbm9kZXMgPSB7fTtcbiAgICBjb21wb25lbnRzLmZvckVhY2goZnVuY3Rpb24gKGMsIGkpIHtcbiAgICAgICAgcmV0dXJuIGMuZm9yRWFjaChmdW5jdGlvbiAodikgeyByZXR1cm4gbm9kZXNbdl0gPSBpOyB9KTtcbiAgICB9KTtcbiAgICB2YXIgY29uc3RyYWludHMgPSBbXTtcbiAgICBsaW5rcy5mb3JFYWNoKGZ1bmN0aW9uIChsKSB7XG4gICAgICAgIHZhciB1aSA9IGxhLmdldFNvdXJjZUluZGV4KGwpLCB2aSA9IGxhLmdldFRhcmdldEluZGV4KGwpLCB1ID0gbm9kZXNbdWldLCB2ID0gbm9kZXNbdmldO1xuICAgICAgICBpZiAodSAhPT0gdikge1xuICAgICAgICAgICAgY29uc3RyYWludHMucHVzaCh7XG4gICAgICAgICAgICAgICAgYXhpczogYXhpcyxcbiAgICAgICAgICAgICAgICBsZWZ0OiB1aSxcbiAgICAgICAgICAgICAgICByaWdodDogdmksXG4gICAgICAgICAgICAgICAgZ2FwOiBsYS5nZXRNaW5TZXBhcmF0aW9uKGwpXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiBjb25zdHJhaW50cztcbn1cbmV4cG9ydHMuZ2VuZXJhdGVEaXJlY3RlZEVkZ2VDb25zdHJhaW50cyA9IGdlbmVyYXRlRGlyZWN0ZWRFZGdlQ29uc3RyYWludHM7XG5mdW5jdGlvbiBzdHJvbmdseUNvbm5lY3RlZENvbXBvbmVudHMobnVtVmVydGljZXMsIGVkZ2VzLCBsYSkge1xuICAgIHZhciBub2RlcyA9IFtdO1xuICAgIHZhciBpbmRleCA9IDA7XG4gICAgdmFyIHN0YWNrID0gW107XG4gICAgdmFyIGNvbXBvbmVudHMgPSBbXTtcbiAgICBmdW5jdGlvbiBzdHJvbmdDb25uZWN0KHYpIHtcbiAgICAgICAgdi5pbmRleCA9IHYubG93bGluayA9IGluZGV4Kys7XG4gICAgICAgIHN0YWNrLnB1c2godik7XG4gICAgICAgIHYub25TdGFjayA9IHRydWU7XG4gICAgICAgIGZvciAodmFyIF9pID0gMCwgX2EgPSB2Lm91dDsgX2kgPCBfYS5sZW5ndGg7IF9pKyspIHtcbiAgICAgICAgICAgIHZhciB3ID0gX2FbX2ldO1xuICAgICAgICAgICAgaWYgKHR5cGVvZiB3LmluZGV4ID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgIHN0cm9uZ0Nvbm5lY3Qodyk7XG4gICAgICAgICAgICAgICAgdi5sb3dsaW5rID0gTWF0aC5taW4odi5sb3dsaW5rLCB3Lmxvd2xpbmspO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAody5vblN0YWNrKSB7XG4gICAgICAgICAgICAgICAgdi5sb3dsaW5rID0gTWF0aC5taW4odi5sb3dsaW5rLCB3LmluZGV4KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAodi5sb3dsaW5rID09PSB2LmluZGV4KSB7XG4gICAgICAgICAgICB2YXIgY29tcG9uZW50ID0gW107XG4gICAgICAgICAgICB3aGlsZSAoc3RhY2subGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgdyA9IHN0YWNrLnBvcCgpO1xuICAgICAgICAgICAgICAgIHcub25TdGFjayA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIGNvbXBvbmVudC5wdXNoKHcpO1xuICAgICAgICAgICAgICAgIGlmICh3ID09PSB2KVxuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbXBvbmVudHMucHVzaChjb21wb25lbnQubWFwKGZ1bmN0aW9uICh2KSB7IHJldHVybiB2LmlkOyB9KSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBudW1WZXJ0aWNlczsgaSsrKSB7XG4gICAgICAgIG5vZGVzLnB1c2goeyBpZDogaSwgb3V0OiBbXSB9KTtcbiAgICB9XG4gICAgZm9yICh2YXIgX2kgPSAwLCBlZGdlc18xID0gZWRnZXM7IF9pIDwgZWRnZXNfMS5sZW5ndGg7IF9pKyspIHtcbiAgICAgICAgdmFyIGUgPSBlZGdlc18xW19pXTtcbiAgICAgICAgdmFyIHZfMSA9IG5vZGVzW2xhLmdldFNvdXJjZUluZGV4KGUpXSwgdyA9IG5vZGVzW2xhLmdldFRhcmdldEluZGV4KGUpXTtcbiAgICAgICAgdl8xLm91dC5wdXNoKHcpO1xuICAgIH1cbiAgICBmb3IgKHZhciBfYSA9IDAsIG5vZGVzXzEgPSBub2RlczsgX2EgPCBub2Rlc18xLmxlbmd0aDsgX2ErKykge1xuICAgICAgICB2YXIgdiA9IG5vZGVzXzFbX2FdO1xuICAgICAgICBpZiAodHlwZW9mIHYuaW5kZXggPT09ICd1bmRlZmluZWQnKVxuICAgICAgICAgICAgc3Ryb25nQ29ubmVjdCh2KTtcbiAgICB9XG4gICAgcmV0dXJuIGNvbXBvbmVudHM7XG59XG5leHBvcnRzLnN0cm9uZ2x5Q29ubmVjdGVkQ29tcG9uZW50cyA9IHN0cm9uZ2x5Q29ubmVjdGVkQ29tcG9uZW50cztcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWRhdGE6YXBwbGljYXRpb24vanNvbjtiYXNlNjQsZXlKMlpYSnphVzl1SWpvekxDSm1hV3hsSWpvaWJHbHVhMnhsYm1kMGFITXVhbk1pTENKemIzVnlZMlZTYjI5MElqb2lJaXdpYzI5MWNtTmxjeUk2V3lJdUxpOHVMaTlYWldKRGIyeGhMM055WXk5c2FXNXJiR1Z1WjNSb2N5NTBjeUpkTENKdVlXMWxjeUk2VzEwc0ltMWhjSEJwYm1keklqb2lPenRCUVZWSkxGTkJRVk1zVlVGQlZTeERRVUZETEVOQlFVMHNSVUZCUlN4RFFVRk5PMGxCUXpsQ0xFbEJRVWtzUTBGQlF5eEhRVUZITEVWQlFVVXNRMEZCUXp0SlFVTllMRXRCUVVzc1NVRkJTU3hEUVVGRExFbEJRVWtzUTBGQlF6dFJRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1IwRkJSeXhGUVVGRkxFTkJRVU03U1VGRE0wSXNTMEZCU3l4SlFVRkpMRU5CUVVNc1NVRkJTU3hEUVVGRE8xRkJRVVVzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4SFFVRkhMRVZCUVVVc1EwRkJRenRKUVVNelFpeFBRVUZQTEUxQlFVMHNRMEZCUXl4SlFVRkpMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zVFVGQlRTeERRVUZETzBGQlEycERMRU5CUVVNN1FVRkhSQ3hUUVVGVExHbENRVUZwUWl4RFFVRkRMRU5CUVZjc1JVRkJSU3hEUVVGWE8wbEJReTlETEVsQlFVa3NRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJRenRKUVVOV0xFdEJRVXNzU1VGQlNTeERRVUZETEVsQlFVa3NRMEZCUXp0UlFVRkZMRWxCUVVrc1QwRkJUeXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEV0QlFVc3NWMEZCVnp0WlFVRkZMRVZCUVVVc1EwRkJReXhEUVVGRE8wbEJRM1JFTEU5QlFVOHNRMEZCUXl4RFFVRkRPMEZCUTJJc1EwRkJRenRCUVVWRUxGTkJRVk1zWVVGQllTeERRVUZQTEV0QlFXRXNSVUZCUlN4RlFVRnpRanRKUVVNNVJDeEpRVUZKTEZWQlFWVXNSMEZCUnl4RlFVRkZMRU5CUVVNN1NVRkRjRUlzU1VGQlNTeGhRVUZoTEVkQlFVY3NWVUZCUXl4RFFVRkRMRVZCUVVVc1EwRkJRenRSUVVOeVFpeEpRVUZKTEU5QlFVOHNWVUZCVlN4RFFVRkRMRU5CUVVNc1EwRkJReXhMUVVGTExGZEJRVmM3V1VGRGNFTXNWVUZCVlN4RFFVRkRMRU5CUVVNc1EwRkJReXhIUVVGSExFVkJRVVVzUTBGQlF6dFJRVU4yUWl4VlFVRlZMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVkQlFVY3NSVUZCUlN4RFFVRkRPMGxCUXpGQ0xFTkJRVU1zUTBGQlF6dEpRVU5HTEV0QlFVc3NRMEZCUXl4UFFVRlBMRU5CUVVNc1ZVRkJRU3hEUVVGRE8xRkJRMWdzU1VGQlNTeERRVUZETEVkQlFVY3NSVUZCUlN4RFFVRkRMR05CUVdNc1EwRkJReXhEUVVGRExFTkJRVU1zUlVGQlJTeERRVUZETEVkQlFVY3NSVUZCUlN4RFFVRkRMR05CUVdNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dFJRVU4yUkN4aFFVRmhMRU5CUVVNc1EwRkJReXhGUVVGRkxFTkJRVU1zUTBGQlF5eERRVUZETzFGQlEzQkNMR0ZCUVdFc1EwRkJReXhEUVVGRExFVkJRVVVzUTBGQlF5eERRVUZETEVOQlFVTTdTVUZEZUVJc1EwRkJReXhEUVVGRExFTkJRVU03U1VGRFNDeFBRVUZQTEZWQlFWVXNRMEZCUXp0QlFVTjBRaXhEUVVGRE8wRkJSMFFzVTBGQlV5eHJRa0ZCYTBJc1EwRkJUeXhMUVVGaExFVkJRVVVzUTBGQlV5eEZRVUZGTEVOQlFUWkNMRVZCUVVVc1JVRkJORUk3U1VGRGJrZ3NTVUZCU1N4VlFVRlZMRWRCUVVjc1lVRkJZU3hEUVVGRExFdEJRVXNzUlVGQlJTeEZRVUZGTEVOQlFVTXNRMEZCUXp0SlFVTXhReXhMUVVGTExFTkJRVU1zVDBGQlR5eERRVUZETEZWQlFVRXNRMEZCUXp0UlFVTllMRWxCUVVrc1EwRkJReXhIUVVGSExGVkJRVlVzUTBGQlF5eEZRVUZGTEVOQlFVTXNZMEZCWXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU03VVVGRGVrTXNTVUZCU1N4RFFVRkRMRWRCUVVjc1ZVRkJWU3hEUVVGRExFVkJRVVVzUTBGQlF5eGpRVUZqTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJRenRSUVVONlF5eEZRVUZGTEVOQlFVTXNVMEZCVXl4RFFVRkRMRU5CUVVNc1JVRkJSU3hEUVVGRExFZEJRVWNzUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXl4RFFVRkRMRVZCUVVVc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dEpRVU55UXl4RFFVRkRMRU5CUVVNc1EwRkJRenRCUVVOUUxFTkJRVU03UVVGTFJDeFRRVUZuUWl4M1FrRkJkMElzUTBGQlR5eExRVUZoTEVWQlFVVXNSVUZCTkVJc1JVRkJSU3hEUVVGaE8wbEJRV0lzYTBKQlFVRXNSVUZCUVN4TFFVRmhPMGxCUTNKSExHdENRVUZyUWl4RFFVRkRMRXRCUVVzc1JVRkJSU3hEUVVGRExFVkJRVVVzVlVGQlF5eERRVUZETEVWQlFVVXNRMEZCUXl4SlFVRkxMRTlCUVVFc1NVRkJTU3hEUVVGRExFbEJRVWtzUTBGQlF5eFZRVUZWTEVOQlFVTXNRMEZCUXl4RlFVRkZMRU5CUVVNc1EwRkJReXhIUVVGSExHbENRVUZwUWl4RFFVRkRMRU5CUVVNc1JVRkJSU3hEUVVGRExFTkJRVU1zUTBGQlF5eEZRVUZ5UkN4RFFVRnhSQ3hGUVVGRkxFVkJRVVVzUTBGQlF5eERRVUZETzBGQlEzUkhMRU5CUVVNN1FVRkdSQ3cwUkVGRlF6dEJRVXRFTEZOQlFXZENMR3RDUVVGclFpeERRVUZQTEV0QlFXRXNSVUZCUlN4RlFVRTBRaXhGUVVGRkxFTkJRV0U3U1VGQllpeHJRa0ZCUVN4RlFVRkJMRXRCUVdFN1NVRkRMMFlzYTBKQlFXdENMRU5CUVVNc1MwRkJTeXhGUVVGRkxFTkJRVU1zUlVGQlJTeFZRVUZETEVOQlFVTXNSVUZCUlN4RFFVRkRPMUZCUXpsQ0xFOUJRVUVzU1VGQlNTeERRVUZETEVkQlFVY3NRMEZCUXl4TlFVRk5MRU5CUVVNc1NVRkJTU3hEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEUxQlFVMHNSVUZCUlN4TlFVRk5MRU5CUVVNc1NVRkJTU3hEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEUxQlFVMHNRMEZCUXl4SFFVRkhMRWRCUVVjc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4cFFrRkJhVUlzUTBGQlF5eERRVUZETEVWQlFVVXNRMEZCUXl4RFFVRkRMRWRCUVVjc1ZVRkJWU3hEUVVGRExFTkJRVU1zUlVGQlJTeERRVUZETEVOQlFVTTdTVUZCTjBjc1EwRkJOa2NzUlVGRE0wY3NSVUZCUlN4RFFVRkRMRU5CUVVNN1FVRkRaQ3hEUVVGRE8wRkJTa1FzWjBSQlNVTTdRVUZ2UWtRc1UwRkJaMElzSzBKQlFTdENMRU5CUVU4c1EwRkJVeXhGUVVGRkxFdEJRV0VzUlVGQlJTeEpRVUZaTEVWQlEzaEdMRVZCUVhsQ08wbEJSWHBDTEVsQlFVa3NWVUZCVlN4SFFVRkhMREpDUVVFeVFpeERRVUZETEVOQlFVTXNSVUZCUlN4TFFVRkxMRVZCUVVVc1JVRkJSU3hEUVVGRExFTkJRVU03U1VGRE0wUXNTVUZCU1N4TFFVRkxMRWRCUVVjc1JVRkJSU3hEUVVGRE8wbEJRMllzVlVGQlZTeERRVUZETEU5QlFVOHNRMEZCUXl4VlFVRkRMRU5CUVVNc1JVRkJReXhEUVVGRE8xRkJRMjVDTEU5QlFVRXNRMEZCUXl4RFFVRkRMRTlCUVU4c1EwRkJReXhWUVVGQkxFTkJRVU1zU1VGQlNTeFBRVUZCTEV0QlFVc3NRMEZCUXl4RFFVRkRMRU5CUVVNc1IwRkJSeXhEUVVGRExFVkJRVm9zUTBGQldTeERRVUZETzBsQlFUVkNMRU5CUVRSQ0xFTkJReTlDTEVOQlFVTTdTVUZEUml4SlFVRkpMRmRCUVZjc1IwRkJWU3hGUVVGRkxFTkJRVU03U1VGRE5VSXNTMEZCU3l4RFFVRkRMRTlCUVU4c1EwRkJReXhWUVVGQkxFTkJRVU03VVVGRFdDeEpRVUZKTEVWQlFVVXNSMEZCUnl4RlFVRkZMRU5CUVVNc1kwRkJZeXhEUVVGRExFTkJRVU1zUTBGQlF5eEZRVUZGTEVWQlFVVXNSMEZCUnl4RlFVRkZMRU5CUVVNc1kwRkJZeXhEUVVGRExFTkJRVU1zUTBGQlF5eEZRVU53UkN4RFFVRkRMRWRCUVVjc1MwRkJTeXhEUVVGRExFVkJRVVVzUTBGQlF5eEZRVUZGTEVOQlFVTXNSMEZCUnl4TFFVRkxMRU5CUVVNc1JVRkJSU3hEUVVGRExFTkJRVU03VVVGRGFrTXNTVUZCU1N4RFFVRkRMRXRCUVVzc1EwRkJReXhGUVVGRk8xbEJRMVFzVjBGQlZ5eERRVUZETEVsQlFVa3NRMEZCUXp0blFrRkRZaXhKUVVGSkxFVkJRVVVzU1VGQlNUdG5Ra0ZEVml4SlFVRkpMRVZCUVVVc1JVRkJSVHRuUWtGRFVpeExRVUZMTEVWQlFVVXNSVUZCUlR0blFrRkRWQ3hIUVVGSExFVkJRVVVzUlVGQlJTeERRVUZETEdkQ1FVRm5RaXhEUVVGRExFTkJRVU1zUTBGQlF6dGhRVU01UWl4RFFVRkRMRU5CUVVNN1UwRkRUanRKUVVOTUxFTkJRVU1zUTBGQlF5eERRVUZETzBsQlEwZ3NUMEZCVHl4WFFVRlhMRU5CUVVNN1FVRkRka0lzUTBGQlF6dEJRWFJDUkN3d1JVRnpRa003UVVGUlJDeFRRVUZuUWl3eVFrRkJNa0lzUTBGQlR5eFhRVUZ0UWl4RlFVRkZMRXRCUVdFc1JVRkJSU3hGUVVGelFqdEpRVU40Unl4SlFVRkpMRXRCUVVzc1IwRkJSeXhGUVVGRkxFTkJRVU03U1VGRFppeEpRVUZKTEV0QlFVc3NSMEZCUnl4RFFVRkRMRU5CUVVNN1NVRkRaQ3hKUVVGSkxFdEJRVXNzUjBGQlJ5eEZRVUZGTEVOQlFVTTdTVUZEWml4SlFVRkpMRlZCUVZVc1IwRkJSeXhGUVVGRkxFTkJRVU03U1VGRGNFSXNVMEZCVXl4aFFVRmhMRU5CUVVNc1EwRkJRenRSUVVWd1FpeERRVUZETEVOQlFVTXNTMEZCU3l4SFFVRkhMRU5CUVVNc1EwRkJReXhQUVVGUExFZEJRVWNzUzBGQlN5eEZRVUZGTEVOQlFVTTdVVUZET1VJc1MwRkJTeXhEUVVGRExFbEJRVWtzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0UlFVTmtMRU5CUVVNc1EwRkJReXhQUVVGUExFZEJRVWNzU1VGQlNTeERRVUZETzFGQlIycENMRXRCUVdNc1ZVRkJTeXhGUVVGTUxFdEJRVUVzUTBGQlF5eERRVUZETEVkQlFVY3NSVUZCVEN4alFVRkxMRVZCUVV3c1NVRkJTeXhGUVVGRk8xbEJRV2hDTEVsQlFVa3NRMEZCUXl4VFFVRkJPMWxCUTA0c1NVRkJTU3hQUVVGUExFTkJRVU1zUTBGQlF5eExRVUZMTEV0QlFVc3NWMEZCVnl4RlFVRkZPMmRDUVVWb1F5eGhRVUZoTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1owSkJRMnBDTEVOQlFVTXNRMEZCUXl4UFFVRlBMRWRCUVVjc1NVRkJTU3hEUVVGRExFZEJRVWNzUTBGQlF5eERRVUZETEVOQlFVTXNUMEZCVHl4RlFVRkZMRU5CUVVNc1EwRkJReXhQUVVGUExFTkJRVU1zUTBGQlF6dGhRVU01UXp0cFFrRkJUU3hKUVVGSkxFTkJRVU1zUTBGQlF5eFBRVUZQTEVWQlFVVTdaMEpCUld4Q0xFTkJRVU1zUTBGQlF5eFBRVUZQTEVkQlFVY3NTVUZCU1N4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRExFTkJRVU1zVDBGQlR5eEZRVUZGTEVOQlFVTXNRMEZCUXl4TFFVRkxMRU5CUVVNc1EwRkJRenRoUVVNMVF6dFRRVU5LTzFGQlIwUXNTVUZCU1N4RFFVRkRMRU5CUVVNc1QwRkJUeXhMUVVGTExFTkJRVU1zUTBGQlF5eExRVUZMTEVWQlFVVTdXVUZGZGtJc1NVRkJTU3hUUVVGVExFZEJRVWNzUlVGQlJTeERRVUZETzFsQlEyNUNMRTlCUVU4c1MwRkJTeXhEUVVGRExFMUJRVTBzUlVGQlJUdG5Ra0ZEYWtJc1EwRkJReXhIUVVGSExFdEJRVXNzUTBGQlF5eEhRVUZITEVWQlFVVXNRMEZCUXp0blFrRkRhRUlzUTBGQlF5eERRVUZETEU5QlFVOHNSMEZCUnl4TFFVRkxMRU5CUVVNN1owSkJSV3hDTEZOQlFWTXNRMEZCUXl4SlFVRkpMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU03WjBKQlEyeENMRWxCUVVrc1EwRkJReXhMUVVGTExFTkJRVU03YjBKQlFVVXNUVUZCVFR0aFFVTjBRanRaUVVWRUxGVkJRVlVzUTBGQlF5eEpRVUZKTEVOQlFVTXNVMEZCVXl4RFFVRkRMRWRCUVVjc1EwRkJReXhWUVVGQkxFTkJRVU1zU1VGQlNTeFBRVUZCTEVOQlFVTXNRMEZCUXl4RlFVRkZMRVZCUVVvc1EwRkJTU3hEUVVGRExFTkJRVU1zUTBGQlF6dFRRVU0zUXp0SlFVTk1MRU5CUVVNN1NVRkRSQ3hMUVVGTExFbEJRVWtzUTBGQlF5eEhRVUZITEVOQlFVTXNSVUZCUlN4RFFVRkRMRWRCUVVjc1YwRkJWeXhGUVVGRkxFTkJRVU1zUlVGQlJTeEZRVUZGTzFGQlEyeERMRXRCUVVzc1EwRkJReXhKUVVGSkxFTkJRVU1zUlVGQlF5eEZRVUZGTEVWQlFVVXNRMEZCUXl4RlFVRkZMRWRCUVVjc1JVRkJSU3hGUVVGRkxFVkJRVU1zUTBGQlF5eERRVUZETzB0QlEyaERPMGxCUTBRc1MwRkJZeXhWUVVGTExFVkJRVXdzWlVGQlN5eEZRVUZNTEcxQ1FVRkxMRVZCUVV3c1NVRkJTeXhGUVVGRk8xRkJRV2hDTEVsQlFVa3NRMEZCUXl4alFVRkJPMUZCUTA0c1NVRkJTU3hIUVVGRExFZEJRVWNzUzBGQlN5eERRVUZETEVWQlFVVXNRMEZCUXl4alFVRmpMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUlVGREwwSXNRMEZCUXl4SFFVRkhMRXRCUVVzc1EwRkJReXhGUVVGRkxFTkJRVU1zWTBGQll5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1VVRkRjRU1zUjBGQlF5eERRVUZETEVkQlFVY3NRMEZCUXl4SlFVRkpMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU03UzBGRGFrSTdTVUZEUkN4TFFVRmpMRlZCUVVzc1JVRkJUQ3hsUVVGTExFVkJRVXdzYlVKQlFVc3NSVUZCVEN4SlFVRkxPMUZCUVdRc1NVRkJTU3hEUVVGRExHTkJRVUU3VVVGQlZ5eEpRVUZKTEU5QlFVOHNRMEZCUXl4RFFVRkRMRXRCUVVzc1MwRkJTeXhYUVVGWE8xbEJRVVVzWVVGQllTeERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRPMHRCUVVFN1NVRkRNVVVzVDBGQlR5eFZRVUZWTEVOQlFVTTdRVUZEZEVJc1EwRkJRenRCUVdoRVJDeHJSVUZuUkVNaWZRPT0iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciBQb3dlckVkZ2UgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIFBvd2VyRWRnZShzb3VyY2UsIHRhcmdldCwgdHlwZSkge1xuICAgICAgICB0aGlzLnNvdXJjZSA9IHNvdXJjZTtcbiAgICAgICAgdGhpcy50YXJnZXQgPSB0YXJnZXQ7XG4gICAgICAgIHRoaXMudHlwZSA9IHR5cGU7XG4gICAgfVxuICAgIHJldHVybiBQb3dlckVkZ2U7XG59KCkpO1xuZXhwb3J0cy5Qb3dlckVkZ2UgPSBQb3dlckVkZ2U7XG52YXIgQ29uZmlndXJhdGlvbiA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gQ29uZmlndXJhdGlvbihuLCBlZGdlcywgbGlua0FjY2Vzc29yLCByb290R3JvdXApIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgdGhpcy5saW5rQWNjZXNzb3IgPSBsaW5rQWNjZXNzb3I7XG4gICAgICAgIHRoaXMubW9kdWxlcyA9IG5ldyBBcnJheShuKTtcbiAgICAgICAgdGhpcy5yb290cyA9IFtdO1xuICAgICAgICBpZiAocm9vdEdyb3VwKSB7XG4gICAgICAgICAgICB0aGlzLmluaXRNb2R1bGVzRnJvbUdyb3VwKHJvb3RHcm91cCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnJvb3RzLnB1c2gobmV3IE1vZHVsZVNldCgpKTtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbjsgKytpKVxuICAgICAgICAgICAgICAgIHRoaXMucm9vdHNbMF0uYWRkKHRoaXMubW9kdWxlc1tpXSA9IG5ldyBNb2R1bGUoaSkpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuUiA9IGVkZ2VzLmxlbmd0aDtcbiAgICAgICAgZWRnZXMuZm9yRWFjaChmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgdmFyIHMgPSBfdGhpcy5tb2R1bGVzW2xpbmtBY2Nlc3Nvci5nZXRTb3VyY2VJbmRleChlKV0sIHQgPSBfdGhpcy5tb2R1bGVzW2xpbmtBY2Nlc3Nvci5nZXRUYXJnZXRJbmRleChlKV0sIHR5cGUgPSBsaW5rQWNjZXNzb3IuZ2V0VHlwZShlKTtcbiAgICAgICAgICAgIHMub3V0Z29pbmcuYWRkKHR5cGUsIHQpO1xuICAgICAgICAgICAgdC5pbmNvbWluZy5hZGQodHlwZSwgcyk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBDb25maWd1cmF0aW9uLnByb3RvdHlwZS5pbml0TW9kdWxlc0Zyb21Hcm91cCA9IGZ1bmN0aW9uIChncm91cCkge1xuICAgICAgICB2YXIgbW9kdWxlU2V0ID0gbmV3IE1vZHVsZVNldCgpO1xuICAgICAgICB0aGlzLnJvb3RzLnB1c2gobW9kdWxlU2V0KTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBncm91cC5sZWF2ZXMubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgIHZhciBub2RlID0gZ3JvdXAubGVhdmVzW2ldO1xuICAgICAgICAgICAgdmFyIG1vZHVsZSA9IG5ldyBNb2R1bGUobm9kZS5pZCk7XG4gICAgICAgICAgICB0aGlzLm1vZHVsZXNbbm9kZS5pZF0gPSBtb2R1bGU7XG4gICAgICAgICAgICBtb2R1bGVTZXQuYWRkKG1vZHVsZSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGdyb3VwLmdyb3Vwcykge1xuICAgICAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBncm91cC5ncm91cHMubGVuZ3RoOyArK2opIHtcbiAgICAgICAgICAgICAgICB2YXIgY2hpbGQgPSBncm91cC5ncm91cHNbal07XG4gICAgICAgICAgICAgICAgdmFyIGRlZmluaXRpb24gPSB7fTtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBwcm9wIGluIGNoaWxkKVxuICAgICAgICAgICAgICAgICAgICBpZiAocHJvcCAhPT0gXCJsZWF2ZXNcIiAmJiBwcm9wICE9PSBcImdyb3Vwc1wiICYmIGNoaWxkLmhhc093blByb3BlcnR5KHByb3ApKVxuICAgICAgICAgICAgICAgICAgICAgICAgZGVmaW5pdGlvbltwcm9wXSA9IGNoaWxkW3Byb3BdO1xuICAgICAgICAgICAgICAgIG1vZHVsZVNldC5hZGQobmV3IE1vZHVsZSgtMSAtIGosIG5ldyBMaW5rU2V0cygpLCBuZXcgTGlua1NldHMoKSwgdGhpcy5pbml0TW9kdWxlc0Zyb21Hcm91cChjaGlsZCksIGRlZmluaXRpb24pKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbW9kdWxlU2V0O1xuICAgIH07XG4gICAgQ29uZmlndXJhdGlvbi5wcm90b3R5cGUubWVyZ2UgPSBmdW5jdGlvbiAoYSwgYiwgaykge1xuICAgICAgICBpZiAoayA9PT0gdm9pZCAwKSB7IGsgPSAwOyB9XG4gICAgICAgIHZhciBpbkludCA9IGEuaW5jb21pbmcuaW50ZXJzZWN0aW9uKGIuaW5jb21pbmcpLCBvdXRJbnQgPSBhLm91dGdvaW5nLmludGVyc2VjdGlvbihiLm91dGdvaW5nKTtcbiAgICAgICAgdmFyIGNoaWxkcmVuID0gbmV3IE1vZHVsZVNldCgpO1xuICAgICAgICBjaGlsZHJlbi5hZGQoYSk7XG4gICAgICAgIGNoaWxkcmVuLmFkZChiKTtcbiAgICAgICAgdmFyIG0gPSBuZXcgTW9kdWxlKHRoaXMubW9kdWxlcy5sZW5ndGgsIG91dEludCwgaW5JbnQsIGNoaWxkcmVuKTtcbiAgICAgICAgdGhpcy5tb2R1bGVzLnB1c2gobSk7XG4gICAgICAgIHZhciB1cGRhdGUgPSBmdW5jdGlvbiAocywgaSwgbykge1xuICAgICAgICAgICAgcy5mb3JBbGwoZnVuY3Rpb24gKG1zLCBsaW5rdHlwZSkge1xuICAgICAgICAgICAgICAgIG1zLmZvckFsbChmdW5jdGlvbiAobikge1xuICAgICAgICAgICAgICAgICAgICB2YXIgbmxzID0gbltpXTtcbiAgICAgICAgICAgICAgICAgICAgbmxzLmFkZChsaW5rdHlwZSwgbSk7XG4gICAgICAgICAgICAgICAgICAgIG5scy5yZW1vdmUobGlua3R5cGUsIGEpO1xuICAgICAgICAgICAgICAgICAgICBubHMucmVtb3ZlKGxpbmt0eXBlLCBiKTtcbiAgICAgICAgICAgICAgICAgICAgYVtvXS5yZW1vdmUobGlua3R5cGUsIG4pO1xuICAgICAgICAgICAgICAgICAgICBiW29dLnJlbW92ZShsaW5rdHlwZSwgbik7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcbiAgICAgICAgdXBkYXRlKG91dEludCwgXCJpbmNvbWluZ1wiLCBcIm91dGdvaW5nXCIpO1xuICAgICAgICB1cGRhdGUoaW5JbnQsIFwib3V0Z29pbmdcIiwgXCJpbmNvbWluZ1wiKTtcbiAgICAgICAgdGhpcy5SIC09IGluSW50LmNvdW50KCkgKyBvdXRJbnQuY291bnQoKTtcbiAgICAgICAgdGhpcy5yb290c1trXS5yZW1vdmUoYSk7XG4gICAgICAgIHRoaXMucm9vdHNba10ucmVtb3ZlKGIpO1xuICAgICAgICB0aGlzLnJvb3RzW2tdLmFkZChtKTtcbiAgICAgICAgcmV0dXJuIG07XG4gICAgfTtcbiAgICBDb25maWd1cmF0aW9uLnByb3RvdHlwZS5yb290TWVyZ2VzID0gZnVuY3Rpb24gKGspIHtcbiAgICAgICAgaWYgKGsgPT09IHZvaWQgMCkgeyBrID0gMDsgfVxuICAgICAgICB2YXIgcnMgPSB0aGlzLnJvb3RzW2tdLm1vZHVsZXMoKTtcbiAgICAgICAgdmFyIG4gPSBycy5sZW5ndGg7XG4gICAgICAgIHZhciBtZXJnZXMgPSBuZXcgQXJyYXkobiAqIChuIC0gMSkpO1xuICAgICAgICB2YXIgY3RyID0gMDtcbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIGlfID0gbiAtIDE7IGkgPCBpXzsgKytpKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBqID0gaSArIDE7IGogPCBuOyArK2opIHtcbiAgICAgICAgICAgICAgICB2YXIgYSA9IHJzW2ldLCBiID0gcnNbal07XG4gICAgICAgICAgICAgICAgbWVyZ2VzW2N0cl0gPSB7IGlkOiBjdHIsIG5FZGdlczogdGhpcy5uRWRnZXMoYSwgYiksIGE6IGEsIGI6IGIgfTtcbiAgICAgICAgICAgICAgICBjdHIrKztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbWVyZ2VzO1xuICAgIH07XG4gICAgQ29uZmlndXJhdGlvbi5wcm90b3R5cGUuZ3JlZWR5TWVyZ2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5yb290cy5sZW5ndGg7ICsraSkge1xuICAgICAgICAgICAgaWYgKHRoaXMucm9vdHNbaV0ubW9kdWxlcygpLmxlbmd0aCA8IDIpXG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB2YXIgbXMgPSB0aGlzLnJvb3RNZXJnZXMoaSkuc29ydChmdW5jdGlvbiAoYSwgYikgeyByZXR1cm4gYS5uRWRnZXMgPT0gYi5uRWRnZXMgPyBhLmlkIC0gYi5pZCA6IGEubkVkZ2VzIC0gYi5uRWRnZXM7IH0pO1xuICAgICAgICAgICAgdmFyIG0gPSBtc1swXTtcbiAgICAgICAgICAgIGlmIChtLm5FZGdlcyA+PSB0aGlzLlIpXG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB0aGlzLm1lcmdlKG0uYSwgbS5iLCBpKTtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBDb25maWd1cmF0aW9uLnByb3RvdHlwZS5uRWRnZXMgPSBmdW5jdGlvbiAoYSwgYikge1xuICAgICAgICB2YXIgaW5JbnQgPSBhLmluY29taW5nLmludGVyc2VjdGlvbihiLmluY29taW5nKSwgb3V0SW50ID0gYS5vdXRnb2luZy5pbnRlcnNlY3Rpb24oYi5vdXRnb2luZyk7XG4gICAgICAgIHJldHVybiB0aGlzLlIgLSBpbkludC5jb3VudCgpIC0gb3V0SW50LmNvdW50KCk7XG4gICAgfTtcbiAgICBDb25maWd1cmF0aW9uLnByb3RvdHlwZS5nZXRHcm91cEhpZXJhcmNoeSA9IGZ1bmN0aW9uIChyZXRhcmdldGVkRWRnZXMpIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgdmFyIGdyb3VwcyA9IFtdO1xuICAgICAgICB2YXIgcm9vdCA9IHt9O1xuICAgICAgICB0b0dyb3Vwcyh0aGlzLnJvb3RzWzBdLCByb290LCBncm91cHMpO1xuICAgICAgICB2YXIgZXMgPSB0aGlzLmFsbEVkZ2VzKCk7XG4gICAgICAgIGVzLmZvckVhY2goZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgIHZhciBhID0gX3RoaXMubW9kdWxlc1tlLnNvdXJjZV07XG4gICAgICAgICAgICB2YXIgYiA9IF90aGlzLm1vZHVsZXNbZS50YXJnZXRdO1xuICAgICAgICAgICAgcmV0YXJnZXRlZEVkZ2VzLnB1c2gobmV3IFBvd2VyRWRnZSh0eXBlb2YgYS5naWQgPT09IFwidW5kZWZpbmVkXCIgPyBlLnNvdXJjZSA6IGdyb3Vwc1thLmdpZF0sIHR5cGVvZiBiLmdpZCA9PT0gXCJ1bmRlZmluZWRcIiA/IGUudGFyZ2V0IDogZ3JvdXBzW2IuZ2lkXSwgZS50eXBlKSk7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gZ3JvdXBzO1xuICAgIH07XG4gICAgQ29uZmlndXJhdGlvbi5wcm90b3R5cGUuYWxsRWRnZXMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBlcyA9IFtdO1xuICAgICAgICBDb25maWd1cmF0aW9uLmdldEVkZ2VzKHRoaXMucm9vdHNbMF0sIGVzKTtcbiAgICAgICAgcmV0dXJuIGVzO1xuICAgIH07XG4gICAgQ29uZmlndXJhdGlvbi5nZXRFZGdlcyA9IGZ1bmN0aW9uIChtb2R1bGVzLCBlcykge1xuICAgICAgICBtb2R1bGVzLmZvckFsbChmdW5jdGlvbiAobSkge1xuICAgICAgICAgICAgbS5nZXRFZGdlcyhlcyk7XG4gICAgICAgICAgICBDb25maWd1cmF0aW9uLmdldEVkZ2VzKG0uY2hpbGRyZW4sIGVzKTtcbiAgICAgICAgfSk7XG4gICAgfTtcbiAgICByZXR1cm4gQ29uZmlndXJhdGlvbjtcbn0oKSk7XG5leHBvcnRzLkNvbmZpZ3VyYXRpb24gPSBDb25maWd1cmF0aW9uO1xuZnVuY3Rpb24gdG9Hcm91cHMobW9kdWxlcywgZ3JvdXAsIGdyb3Vwcykge1xuICAgIG1vZHVsZXMuZm9yQWxsKGZ1bmN0aW9uIChtKSB7XG4gICAgICAgIGlmIChtLmlzTGVhZigpKSB7XG4gICAgICAgICAgICBpZiAoIWdyb3VwLmxlYXZlcylcbiAgICAgICAgICAgICAgICBncm91cC5sZWF2ZXMgPSBbXTtcbiAgICAgICAgICAgIGdyb3VwLmxlYXZlcy5wdXNoKG0uaWQpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdmFyIGcgPSBncm91cDtcbiAgICAgICAgICAgIG0uZ2lkID0gZ3JvdXBzLmxlbmd0aDtcbiAgICAgICAgICAgIGlmICghbS5pc0lzbGFuZCgpIHx8IG0uaXNQcmVkZWZpbmVkKCkpIHtcbiAgICAgICAgICAgICAgICBnID0geyBpZDogbS5naWQgfTtcbiAgICAgICAgICAgICAgICBpZiAobS5pc1ByZWRlZmluZWQoKSlcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgcHJvcCBpbiBtLmRlZmluaXRpb24pXG4gICAgICAgICAgICAgICAgICAgICAgICBnW3Byb3BdID0gbS5kZWZpbml0aW9uW3Byb3BdO1xuICAgICAgICAgICAgICAgIGlmICghZ3JvdXAuZ3JvdXBzKVxuICAgICAgICAgICAgICAgICAgICBncm91cC5ncm91cHMgPSBbXTtcbiAgICAgICAgICAgICAgICBncm91cC5ncm91cHMucHVzaChtLmdpZCk7XG4gICAgICAgICAgICAgICAgZ3JvdXBzLnB1c2goZyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0b0dyb3VwcyhtLmNoaWxkcmVuLCBnLCBncm91cHMpO1xuICAgICAgICB9XG4gICAgfSk7XG59XG52YXIgTW9kdWxlID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBNb2R1bGUoaWQsIG91dGdvaW5nLCBpbmNvbWluZywgY2hpbGRyZW4sIGRlZmluaXRpb24pIHtcbiAgICAgICAgaWYgKG91dGdvaW5nID09PSB2b2lkIDApIHsgb3V0Z29pbmcgPSBuZXcgTGlua1NldHMoKTsgfVxuICAgICAgICBpZiAoaW5jb21pbmcgPT09IHZvaWQgMCkgeyBpbmNvbWluZyA9IG5ldyBMaW5rU2V0cygpOyB9XG4gICAgICAgIGlmIChjaGlsZHJlbiA9PT0gdm9pZCAwKSB7IGNoaWxkcmVuID0gbmV3IE1vZHVsZVNldCgpOyB9XG4gICAgICAgIHRoaXMuaWQgPSBpZDtcbiAgICAgICAgdGhpcy5vdXRnb2luZyA9IG91dGdvaW5nO1xuICAgICAgICB0aGlzLmluY29taW5nID0gaW5jb21pbmc7XG4gICAgICAgIHRoaXMuY2hpbGRyZW4gPSBjaGlsZHJlbjtcbiAgICAgICAgdGhpcy5kZWZpbml0aW9uID0gZGVmaW5pdGlvbjtcbiAgICB9XG4gICAgTW9kdWxlLnByb3RvdHlwZS5nZXRFZGdlcyA9IGZ1bmN0aW9uIChlcykge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICB0aGlzLm91dGdvaW5nLmZvckFsbChmdW5jdGlvbiAobXMsIGVkZ2V0eXBlKSB7XG4gICAgICAgICAgICBtcy5mb3JBbGwoZnVuY3Rpb24gKHRhcmdldCkge1xuICAgICAgICAgICAgICAgIGVzLnB1c2gobmV3IFBvd2VyRWRnZShfdGhpcy5pZCwgdGFyZ2V0LmlkLCBlZGdldHlwZSkpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH07XG4gICAgTW9kdWxlLnByb3RvdHlwZS5pc0xlYWYgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNoaWxkcmVuLmNvdW50KCkgPT09IDA7XG4gICAgfTtcbiAgICBNb2R1bGUucHJvdG90eXBlLmlzSXNsYW5kID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5vdXRnb2luZy5jb3VudCgpID09PSAwICYmIHRoaXMuaW5jb21pbmcuY291bnQoKSA9PT0gMDtcbiAgICB9O1xuICAgIE1vZHVsZS5wcm90b3R5cGUuaXNQcmVkZWZpbmVkID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdHlwZW9mIHRoaXMuZGVmaW5pdGlvbiAhPT0gXCJ1bmRlZmluZWRcIjtcbiAgICB9O1xuICAgIHJldHVybiBNb2R1bGU7XG59KCkpO1xuZXhwb3J0cy5Nb2R1bGUgPSBNb2R1bGU7XG5mdW5jdGlvbiBpbnRlcnNlY3Rpb24obSwgbikge1xuICAgIHZhciBpID0ge307XG4gICAgZm9yICh2YXIgdiBpbiBtKVxuICAgICAgICBpZiAodiBpbiBuKVxuICAgICAgICAgICAgaVt2XSA9IG1bdl07XG4gICAgcmV0dXJuIGk7XG59XG52YXIgTW9kdWxlU2V0ID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBNb2R1bGVTZXQoKSB7XG4gICAgICAgIHRoaXMudGFibGUgPSB7fTtcbiAgICB9XG4gICAgTW9kdWxlU2V0LnByb3RvdHlwZS5jb3VudCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIE9iamVjdC5rZXlzKHRoaXMudGFibGUpLmxlbmd0aDtcbiAgICB9O1xuICAgIE1vZHVsZVNldC5wcm90b3R5cGUuaW50ZXJzZWN0aW9uID0gZnVuY3Rpb24gKG90aGVyKSB7XG4gICAgICAgIHZhciByZXN1bHQgPSBuZXcgTW9kdWxlU2V0KCk7XG4gICAgICAgIHJlc3VsdC50YWJsZSA9IGludGVyc2VjdGlvbih0aGlzLnRhYmxlLCBvdGhlci50YWJsZSk7XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfTtcbiAgICBNb2R1bGVTZXQucHJvdG90eXBlLmludGVyc2VjdGlvbkNvdW50ID0gZnVuY3Rpb24gKG90aGVyKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmludGVyc2VjdGlvbihvdGhlcikuY291bnQoKTtcbiAgICB9O1xuICAgIE1vZHVsZVNldC5wcm90b3R5cGUuY29udGFpbnMgPSBmdW5jdGlvbiAoaWQpIHtcbiAgICAgICAgcmV0dXJuIGlkIGluIHRoaXMudGFibGU7XG4gICAgfTtcbiAgICBNb2R1bGVTZXQucHJvdG90eXBlLmFkZCA9IGZ1bmN0aW9uIChtKSB7XG4gICAgICAgIHRoaXMudGFibGVbbS5pZF0gPSBtO1xuICAgIH07XG4gICAgTW9kdWxlU2V0LnByb3RvdHlwZS5yZW1vdmUgPSBmdW5jdGlvbiAobSkge1xuICAgICAgICBkZWxldGUgdGhpcy50YWJsZVttLmlkXTtcbiAgICB9O1xuICAgIE1vZHVsZVNldC5wcm90b3R5cGUuZm9yQWxsID0gZnVuY3Rpb24gKGYpIHtcbiAgICAgICAgZm9yICh2YXIgbWlkIGluIHRoaXMudGFibGUpIHtcbiAgICAgICAgICAgIGYodGhpcy50YWJsZVttaWRdKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgTW9kdWxlU2V0LnByb3RvdHlwZS5tb2R1bGVzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgdnMgPSBbXTtcbiAgICAgICAgdGhpcy5mb3JBbGwoZnVuY3Rpb24gKG0pIHtcbiAgICAgICAgICAgIGlmICghbS5pc1ByZWRlZmluZWQoKSlcbiAgICAgICAgICAgICAgICB2cy5wdXNoKG0pO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHZzO1xuICAgIH07XG4gICAgcmV0dXJuIE1vZHVsZVNldDtcbn0oKSk7XG5leHBvcnRzLk1vZHVsZVNldCA9IE1vZHVsZVNldDtcbnZhciBMaW5rU2V0cyA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gTGlua1NldHMoKSB7XG4gICAgICAgIHRoaXMuc2V0cyA9IHt9O1xuICAgICAgICB0aGlzLm4gPSAwO1xuICAgIH1cbiAgICBMaW5rU2V0cy5wcm90b3R5cGUuY291bnQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm47XG4gICAgfTtcbiAgICBMaW5rU2V0cy5wcm90b3R5cGUuY29udGFpbnMgPSBmdW5jdGlvbiAoaWQpIHtcbiAgICAgICAgdmFyIHJlc3VsdCA9IGZhbHNlO1xuICAgICAgICB0aGlzLmZvckFsbE1vZHVsZXMoZnVuY3Rpb24gKG0pIHtcbiAgICAgICAgICAgIGlmICghcmVzdWx0ICYmIG0uaWQgPT0gaWQpIHtcbiAgICAgICAgICAgICAgICByZXN1bHQgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9O1xuICAgIExpbmtTZXRzLnByb3RvdHlwZS5hZGQgPSBmdW5jdGlvbiAobGlua3R5cGUsIG0pIHtcbiAgICAgICAgdmFyIHMgPSBsaW5rdHlwZSBpbiB0aGlzLnNldHMgPyB0aGlzLnNldHNbbGlua3R5cGVdIDogdGhpcy5zZXRzW2xpbmt0eXBlXSA9IG5ldyBNb2R1bGVTZXQoKTtcbiAgICAgICAgcy5hZGQobSk7XG4gICAgICAgICsrdGhpcy5uO1xuICAgIH07XG4gICAgTGlua1NldHMucHJvdG90eXBlLnJlbW92ZSA9IGZ1bmN0aW9uIChsaW5rdHlwZSwgbSkge1xuICAgICAgICB2YXIgbXMgPSB0aGlzLnNldHNbbGlua3R5cGVdO1xuICAgICAgICBtcy5yZW1vdmUobSk7XG4gICAgICAgIGlmIChtcy5jb3VudCgpID09PSAwKSB7XG4gICAgICAgICAgICBkZWxldGUgdGhpcy5zZXRzW2xpbmt0eXBlXTtcbiAgICAgICAgfVxuICAgICAgICAtLXRoaXMubjtcbiAgICB9O1xuICAgIExpbmtTZXRzLnByb3RvdHlwZS5mb3JBbGwgPSBmdW5jdGlvbiAoZikge1xuICAgICAgICBmb3IgKHZhciBsaW5rdHlwZSBpbiB0aGlzLnNldHMpIHtcbiAgICAgICAgICAgIGYodGhpcy5zZXRzW2xpbmt0eXBlXSwgTnVtYmVyKGxpbmt0eXBlKSk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIExpbmtTZXRzLnByb3RvdHlwZS5mb3JBbGxNb2R1bGVzID0gZnVuY3Rpb24gKGYpIHtcbiAgICAgICAgdGhpcy5mb3JBbGwoZnVuY3Rpb24gKG1zLCBsdCkgeyByZXR1cm4gbXMuZm9yQWxsKGYpOyB9KTtcbiAgICB9O1xuICAgIExpbmtTZXRzLnByb3RvdHlwZS5pbnRlcnNlY3Rpb24gPSBmdW5jdGlvbiAob3RoZXIpIHtcbiAgICAgICAgdmFyIHJlc3VsdCA9IG5ldyBMaW5rU2V0cygpO1xuICAgICAgICB0aGlzLmZvckFsbChmdW5jdGlvbiAobXMsIGx0KSB7XG4gICAgICAgICAgICBpZiAobHQgaW4gb3RoZXIuc2V0cykge1xuICAgICAgICAgICAgICAgIHZhciBpID0gbXMuaW50ZXJzZWN0aW9uKG90aGVyLnNldHNbbHRdKSwgbiA9IGkuY291bnQoKTtcbiAgICAgICAgICAgICAgICBpZiAobiA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0LnNldHNbbHRdID0gaTtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0Lm4gKz0gbjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH07XG4gICAgcmV0dXJuIExpbmtTZXRzO1xufSgpKTtcbmV4cG9ydHMuTGlua1NldHMgPSBMaW5rU2V0cztcbmZ1bmN0aW9uIGludGVyc2VjdGlvbkNvdW50KG0sIG4pIHtcbiAgICByZXR1cm4gT2JqZWN0LmtleXMoaW50ZXJzZWN0aW9uKG0sIG4pKS5sZW5ndGg7XG59XG5mdW5jdGlvbiBnZXRHcm91cHMobm9kZXMsIGxpbmtzLCBsYSwgcm9vdEdyb3VwKSB7XG4gICAgdmFyIG4gPSBub2Rlcy5sZW5ndGgsIGMgPSBuZXcgQ29uZmlndXJhdGlvbihuLCBsaW5rcywgbGEsIHJvb3RHcm91cCk7XG4gICAgd2hpbGUgKGMuZ3JlZWR5TWVyZ2UoKSlcbiAgICAgICAgO1xuICAgIHZhciBwb3dlckVkZ2VzID0gW107XG4gICAgdmFyIGcgPSBjLmdldEdyb3VwSGllcmFyY2h5KHBvd2VyRWRnZXMpO1xuICAgIHBvd2VyRWRnZXMuZm9yRWFjaChmdW5jdGlvbiAoZSkge1xuICAgICAgICB2YXIgZiA9IGZ1bmN0aW9uIChlbmQpIHtcbiAgICAgICAgICAgIHZhciBnID0gZVtlbmRdO1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBnID09IFwibnVtYmVyXCIpXG4gICAgICAgICAgICAgICAgZVtlbmRdID0gbm9kZXNbZ107XG4gICAgICAgIH07XG4gICAgICAgIGYoXCJzb3VyY2VcIik7XG4gICAgICAgIGYoXCJ0YXJnZXRcIik7XG4gICAgfSk7XG4gICAgcmV0dXJuIHsgZ3JvdXBzOiBnLCBwb3dlckVkZ2VzOiBwb3dlckVkZ2VzIH07XG59XG5leHBvcnRzLmdldEdyb3VwcyA9IGdldEdyb3Vwcztcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWRhdGE6YXBwbGljYXRpb24vanNvbjtiYXNlNjQsZXlKMlpYSnphVzl1SWpvekxDSm1hV3hsSWpvaWNHOTNaWEpuY21Gd2FDNXFjeUlzSW5OdmRYSmpaVkp2YjNRaU9pSWlMQ0p6YjNWeVkyVnpJanBiSWk0dUx5NHVMMWRsWWtOdmJHRXZjM0pqTDNCdmQyVnlaM0poY0dndWRITWlYU3dpYm1GdFpYTWlPbHRkTENKdFlYQndhVzVuY3lJNklqczdRVUZQU1R0SlFVTkpMRzFDUVVOWExFMUJRVmNzUlVGRFdDeE5RVUZYTEVWQlExZ3NTVUZCV1R0UlFVWmFMRmRCUVUwc1IwRkJUaXhOUVVGTkxFTkJRVXM3VVVGRFdDeFhRVUZOTEVkQlFVNHNUVUZCVFN4RFFVRkxPMUZCUTFnc1UwRkJTU3hIUVVGS0xFbEJRVWtzUTBGQlVUdEpRVUZKTEVOQlFVTTdTVUZEYUVNc1owSkJRVU03UVVGQlJDeERRVUZETEVGQlRFUXNTVUZMUXp0QlFVeFpMRGhDUVVGVE8wRkJUM1JDTzBsQlUwa3NkVUpCUVZrc1EwRkJVeXhGUVVGRkxFdEJRV0VzUlVGQlZTeFpRVUZ2UXl4RlFVRkZMRk5CUVdsQ08xRkJRWEpITEdsQ1FXdENRenRSUVd4Q05rTXNhVUpCUVZrc1IwRkJXaXhaUVVGWkxFTkJRWGRDTzFGQlF6bEZMRWxCUVVrc1EwRkJReXhQUVVGUExFZEJRVWNzU1VGQlNTeExRVUZMTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1VVRkROVUlzU1VGQlNTeERRVUZETEV0QlFVc3NSMEZCUnl4RlFVRkZMRU5CUVVNN1VVRkRhRUlzU1VGQlNTeFRRVUZUTEVWQlFVVTdXVUZEV0N4SlFVRkpMRU5CUVVNc2IwSkJRVzlDTEVOQlFVTXNVMEZCVXl4RFFVRkRMRU5CUVVNN1UwRkRlRU03WVVGQlRUdFpRVU5JTEVsQlFVa3NRMEZCUXl4TFFVRkxMRU5CUVVNc1NVRkJTU3hEUVVGRExFbEJRVWtzVTBGQlV5eEZRVUZGTEVOQlFVTXNRMEZCUXp0WlFVTnFReXhMUVVGTExFbEJRVWtzUTBGQlF5eEhRVUZITEVOQlFVTXNSVUZCUlN4RFFVRkRMRWRCUVVjc1EwRkJReXhGUVVGRkxFVkJRVVVzUTBGQlF6dG5Ra0ZEZEVJc1NVRkJTU3hEUVVGRExFdEJRVXNzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4SFFVRkhMRU5CUVVNc1NVRkJTU3hEUVVGRExFOUJRVThzUTBGQlF5eERRVUZETEVOQlFVTXNSMEZCUnl4SlFVRkpMRTFCUVUwc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETzFOQlF6RkVPMUZCUTBRc1NVRkJTU3hEUVVGRExFTkJRVU1zUjBGQlJ5eExRVUZMTEVOQlFVTXNUVUZCVFN4RFFVRkRPMUZCUTNSQ0xFdEJRVXNzUTBGQlF5eFBRVUZQTEVOQlFVTXNWVUZCUVN4RFFVRkRPMWxCUTFnc1NVRkJTU3hEUVVGRExFZEJRVWNzUzBGQlNTeERRVUZETEU5QlFVOHNRMEZCUXl4WlFVRlpMRU5CUVVNc1kwRkJZeXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVWQlEyaEVMRU5CUVVNc1IwRkJSeXhMUVVGSkxFTkJRVU1zVDBGQlR5eERRVUZETEZsQlFWa3NRMEZCUXl4alFVRmpMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUlVGRGFFUXNTVUZCU1N4SFFVRkhMRmxCUVZrc1EwRkJReXhQUVVGUExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTTdXVUZEYmtNc1EwRkJReXhEUVVGRExGRkJRVkVzUTBGQlF5eEhRVUZITEVOQlFVTXNTVUZCU1N4RlFVRkZMRU5CUVVNc1EwRkJReXhEUVVGRE8xbEJRM2hDTEVOQlFVTXNRMEZCUXl4UlFVRlJMRU5CUVVNc1IwRkJSeXhEUVVGRExFbEJRVWtzUlVGQlJTeERRVUZETEVOQlFVTXNRMEZCUXp0UlFVTTFRaXhEUVVGRExFTkJRVU1zUTBGQlF6dEpRVU5RTEVOQlFVTTdTVUZGVHl3MFEwRkJiMElzUjBGQk5VSXNWVUZCTmtJc1MwRkJTenRSUVVNNVFpeEpRVUZKTEZOQlFWTXNSMEZCUnl4SlFVRkpMRk5CUVZNc1JVRkJSU3hEUVVGRE8xRkJRMmhETEVsQlFVa3NRMEZCUXl4TFFVRkxMRU5CUVVNc1NVRkJTU3hEUVVGRExGTkJRVk1zUTBGQlF5eERRVUZETzFGQlF6TkNMRXRCUVVzc1NVRkJTU3hEUVVGRExFZEJRVWNzUTBGQlF5eEZRVUZGTEVOQlFVTXNSMEZCUnl4TFFVRkxMRU5CUVVNc1RVRkJUU3hEUVVGRExFMUJRVTBzUlVGQlJTeEZRVUZGTEVOQlFVTXNSVUZCUlR0WlFVTXhReXhKUVVGSkxFbEJRVWtzUjBGQlJ5eExRVUZMTEVOQlFVTXNUVUZCVFN4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRE8xbEJRek5DTEVsQlFVa3NUVUZCVFN4SFFVRkhMRWxCUVVrc1RVRkJUU3hEUVVGRExFbEJRVWtzUTBGQlF5eEZRVUZGTEVOQlFVTXNRMEZCUXp0WlFVTnFReXhKUVVGSkxFTkJRVU1zVDBGQlR5eERRVUZETEVsQlFVa3NRMEZCUXl4RlFVRkZMRU5CUVVNc1IwRkJSeXhOUVVGTkxFTkJRVU03V1VGREwwSXNVMEZCVXl4RFFVRkRMRWRCUVVjc1EwRkJReXhOUVVGTkxFTkJRVU1zUTBGQlF6dFRRVU42UWp0UlFVTkVMRWxCUVVrc1MwRkJTeXhEUVVGRExFMUJRVTBzUlVGQlJUdFpRVU5rTEV0QlFVc3NTVUZCU1N4RFFVRkRMRWRCUVVjc1EwRkJReXhGUVVGRkxFTkJRVU1zUjBGQlJ5eExRVUZMTEVOQlFVTXNUVUZCVFN4RFFVRkRMRTFCUVUwc1JVRkJSU3hGUVVGRkxFTkJRVU1zUlVGQlJUdG5Ra0ZETVVNc1NVRkJTU3hMUVVGTExFZEJRVWNzUzBGQlN5eERRVUZETEUxQlFVMHNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJRenRuUWtGRk5VSXNTVUZCU1N4VlFVRlZMRWRCUVVjc1JVRkJSU3hEUVVGRE8yZENRVU53UWl4TFFVRkxMRWxCUVVrc1NVRkJTU3hKUVVGSkxFdEJRVXM3YjBKQlEyeENMRWxCUVVrc1NVRkJTU3hMUVVGTExGRkJRVkVzU1VGQlNTeEpRVUZKTEV0QlFVc3NVVUZCVVN4SlFVRkpMRXRCUVVzc1EwRkJReXhqUVVGakxFTkJRVU1zU1VGQlNTeERRVUZETzNkQ1FVTndSU3hWUVVGVkxFTkJRVU1zU1VGQlNTeERRVUZETEVkQlFVY3NTMEZCU3l4RFFVRkRMRWxCUVVrc1EwRkJReXhEUVVGRE8yZENRVVYyUXl4VFFVRlRMRU5CUVVNc1IwRkJSeXhEUVVGRExFbEJRVWtzVFVGQlRTeERRVUZETEVOQlFVTXNRMEZCUXl4SFFVRkRMRU5CUVVNc1JVRkJSU3hKUVVGSkxGRkJRVkVzUlVGQlJTeEZRVUZGTEVsQlFVa3NVVUZCVVN4RlFVRkZMRVZCUVVVc1NVRkJTU3hEUVVGRExHOUNRVUZ2UWl4RFFVRkRMRXRCUVVzc1EwRkJReXhGUVVGRkxGVkJRVlVzUTBGQlF5eERRVUZETEVOQlFVTTdZVUZEYWtnN1UwRkRTanRSUVVORUxFOUJRVThzVTBGQlV5eERRVUZETzBsQlEzQkNMRU5CUVVNN1NVRkhSaXcyUWtGQlN5eEhRVUZNTEZWQlFVMHNRMEZCVXl4RlFVRkZMRU5CUVZNc1JVRkJSU3hEUVVGaE8xRkJRV0lzYTBKQlFVRXNSVUZCUVN4TFFVRmhPMUZCUTNKRExFbEJRVWtzUzBGQlN5eEhRVUZITEVOQlFVTXNRMEZCUXl4UlFVRlJMRU5CUVVNc1dVRkJXU3hEUVVGRExFTkJRVU1zUTBGQlF5eFJRVUZSTEVOQlFVTXNSVUZETTBNc1RVRkJUU3hIUVVGSExFTkJRVU1zUTBGQlF5eFJRVUZSTEVOQlFVTXNXVUZCV1N4RFFVRkRMRU5CUVVNc1EwRkJReXhSUVVGUkxFTkJRVU1zUTBGQlF6dFJRVU5xUkN4SlFVRkpMRkZCUVZFc1IwRkJSeXhKUVVGSkxGTkJRVk1zUlVGQlJTeERRVUZETzFGQlF5OUNMRkZCUVZFc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTTdVVUZEYUVJc1VVRkJVU3hEUVVGRExFZEJRVWNzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0UlFVTm9RaXhKUVVGSkxFTkJRVU1zUjBGQlJ5eEpRVUZKTEUxQlFVMHNRMEZCUXl4SlFVRkpMRU5CUVVNc1QwRkJUeXhEUVVGRExFMUJRVTBzUlVGQlJTeE5RVUZOTEVWQlFVVXNTMEZCU3l4RlFVRkZMRkZCUVZFc1EwRkJReXhEUVVGRE8xRkJRMnBGTEVsQlFVa3NRMEZCUXl4UFFVRlBMRU5CUVVNc1NVRkJTU3hEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETzFGQlEzSkNMRWxCUVVrc1RVRkJUU3hIUVVGSExGVkJRVU1zUTBGQlZ5eEZRVUZGTEVOQlFWTXNSVUZCUlN4RFFVRlRPMWxCUXpORExFTkJRVU1zUTBGQlF5eE5RVUZOTEVOQlFVTXNWVUZCUXl4RlFVRkZMRVZCUVVVc1VVRkJVVHRuUWtGRGJFSXNSVUZCUlN4RFFVRkRMRTFCUVUwc1EwRkJReXhWUVVGQkxFTkJRVU03YjBKQlExQXNTVUZCU1N4SFFVRkhMRWRCUVdFc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETzI5Q1FVTjZRaXhIUVVGSExFTkJRVU1zUjBGQlJ5eERRVUZETEZGQlFWRXNSVUZCUlN4RFFVRkRMRU5CUVVNc1EwRkJRenR2UWtGRGNrSXNSMEZCUnl4RFFVRkRMRTFCUVUwc1EwRkJReXhSUVVGUkxFVkJRVVVzUTBGQlF5eERRVUZETEVOQlFVTTdiMEpCUTNoQ0xFZEJRVWNzUTBGQlF5eE5RVUZOTEVOQlFVTXNVVUZCVVN4RlFVRkZMRU5CUVVNc1EwRkJReXhEUVVGRE8yOUNRVU5pTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVVc1EwRkJReXhOUVVGTkxFTkJRVU1zVVVGQlVTeEZRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRPMjlDUVVNeFFpeERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkZMRU5CUVVNc1RVRkJUU3hEUVVGRExGRkJRVkVzUlVGQlJTeERRVUZETEVOQlFVTXNRMEZCUXp0blFrRkRla01zUTBGQlF5eERRVUZETEVOQlFVTTdXVUZEVUN4RFFVRkRMRU5CUVVNc1EwRkJRenRSUVVOUUxFTkJRVU1zUTBGQlF6dFJRVU5HTEUxQlFVMHNRMEZCUXl4TlFVRk5MRVZCUVVVc1ZVRkJWU3hGUVVGRkxGVkJRVlVzUTBGQlF5eERRVUZETzFGQlEzWkRMRTFCUVUwc1EwRkJReXhMUVVGTExFVkJRVVVzVlVGQlZTeEZRVUZGTEZWQlFWVXNRMEZCUXl4RFFVRkRPMUZCUTNSRExFbEJRVWtzUTBGQlF5eERRVUZETEVsQlFVa3NTMEZCU3l4RFFVRkRMRXRCUVVzc1JVRkJSU3hIUVVGSExFMUJRVTBzUTBGQlF5eExRVUZMTEVWQlFVVXNRMEZCUXp0UlFVTjZReXhKUVVGSkxFTkJRVU1zUzBGQlN5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRTFCUVUwc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dFJRVU40UWl4SlFVRkpMRU5CUVVNc1MwRkJTeXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEUxQlFVMHNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJRenRSUVVONFFpeEpRVUZKTEVOQlFVTXNTMEZCU3l4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFZEJRVWNzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0UlFVTnlRaXhQUVVGUExFTkJRVU1zUTBGQlF6dEpRVU5pTEVOQlFVTTdTVUZGVHl4clEwRkJWU3hIUVVGc1FpeFZRVUZ0UWl4RFFVRmhPMUZCUVdJc2EwSkJRVUVzUlVGQlFTeExRVUZoTzFGQlRUVkNMRWxCUVVrc1JVRkJSU3hIUVVGSExFbEJRVWtzUTBGQlF5eExRVUZMTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1QwRkJUeXhGUVVGRkxFTkJRVU03VVVGRGFrTXNTVUZCU1N4RFFVRkRMRWRCUVVjc1JVRkJSU3hEUVVGRExFMUJRVTBzUTBGQlF6dFJRVU5zUWl4SlFVRkpMRTFCUVUwc1IwRkJSeXhKUVVGSkxFdEJRVXNzUTBGQlF5eERRVUZETEVkQlFVY3NRMEZCUXl4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dFJRVU53UXl4SlFVRkpMRWRCUVVjc1IwRkJSeXhEUVVGRExFTkJRVU03VVVGRFdpeExRVUZMTEVsQlFVa3NRMEZCUXl4SFFVRkhMRU5CUVVNc1JVRkJSU3hGUVVGRkxFZEJRVWNzUTBGQlF5eEhRVUZITEVOQlFVTXNSVUZCUlN4RFFVRkRMRWRCUVVjc1JVRkJSU3hGUVVGRkxFVkJRVVVzUTBGQlF5eEZRVUZGTzFsQlEzSkRMRXRCUVVzc1NVRkJTU3hEUVVGRExFZEJRVWNzUTBGQlF5eEhRVUZETEVOQlFVTXNSVUZCUlN4RFFVRkRMRWRCUVVjc1EwRkJReXhGUVVGRkxFVkJRVVVzUTBGQlF5eEZRVUZGTzJkQ1FVTXhRaXhKUVVGSkxFTkJRVU1zUjBGQlJ5eEZRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRMRVZCUVVVc1EwRkJReXhIUVVGSExFVkJRVVVzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0blFrRkRla0lzVFVGQlRTeERRVUZETEVkQlFVY3NRMEZCUXl4SFFVRkhMRVZCUVVVc1JVRkJSU3hGUVVGRkxFZEJRVWNzUlVGQlJTeE5RVUZOTEVWQlFVVXNTVUZCU1N4RFFVRkRMRTFCUVUwc1EwRkJReXhEUVVGRExFVkJRVVVzUTBGQlF5eERRVUZETEVWQlFVVXNRMEZCUXl4RlFVRkZMRU5CUVVNc1JVRkJSU3hEUVVGRExFVkJRVVVzUTBGQlF5eEZRVUZGTEVOQlFVTTdaMEpCUTJwRkxFZEJRVWNzUlVGQlJTeERRVUZETzJGQlExUTdVMEZEU2p0UlFVTkVMRTlCUVU4c1RVRkJUU3hEUVVGRE8wbEJRMnhDTEVOQlFVTTdTVUZGUkN4dFEwRkJWeXhIUVVGWU8xRkJRMGtzUzBGQlN5eEpRVUZKTEVOQlFVTXNSMEZCUnl4RFFVRkRMRVZCUVVVc1EwRkJReXhIUVVGSExFbEJRVWtzUTBGQlF5eExRVUZMTEVOQlFVTXNUVUZCVFN4RlFVRkZMRVZCUVVVc1EwRkJReXhGUVVGRk8xbEJSWGhETEVsQlFVa3NTVUZCU1N4RFFVRkRMRXRCUVVzc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eFBRVUZQTEVWQlFVVXNRMEZCUXl4TlFVRk5MRWRCUVVjc1EwRkJRenRuUWtGQlJTeFRRVUZUTzFsQlIycEVMRWxCUVVrc1JVRkJSU3hIUVVGSExFbEJRVWtzUTBGQlF5eFZRVUZWTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1NVRkJTU3hEUVVGRExGVkJRVU1zUTBGQlF5eEZRVUZGTEVOQlFVTXNTVUZCU3l4UFFVRkJMRU5CUVVNc1EwRkJReXhOUVVGTkxFbEJRVWtzUTBGQlF5eERRVUZETEUxQlFVMHNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFVkJRVVVzUjBGQlJ5eERRVUZETEVOQlFVTXNSVUZCUlN4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zVFVGQlRTeEhRVUZITEVOQlFVTXNRMEZCUXl4TlFVRk5MRVZCUVhoRUxFTkJRWGRFTEVOQlFVTXNRMEZCUXp0WlFVTnlSeXhKUVVGSkxFTkJRVU1zUjBGQlJ5eEZRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1dVRkRaQ3hKUVVGSkxFTkJRVU1zUTBGQlF5eE5RVUZOTEVsQlFVa3NTVUZCU1N4RFFVRkRMRU5CUVVNN1owSkJRVVVzVTBGQlV6dFpRVU5xUXl4SlFVRkpMRU5CUVVNc1MwRkJTeXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVWQlFVVXNRMEZCUXl4RFFVRkRMRU5CUVVNc1JVRkJSU3hEUVVGRExFTkJRVU1zUTBGQlF6dFpRVU40UWl4UFFVRlBMRWxCUVVrc1EwRkJRenRUUVVObU8wbEJRMHdzUTBGQlF6dEpRVVZQTERoQ1FVRk5MRWRCUVdRc1ZVRkJaU3hEUVVGVExFVkJRVVVzUTBGQlV6dFJRVU12UWl4SlFVRkpMRXRCUVVzc1IwRkJSeXhEUVVGRExFTkJRVU1zVVVGQlVTeERRVUZETEZsQlFWa3NRMEZCUXl4RFFVRkRMRU5CUVVNc1VVRkJVU3hEUVVGRExFVkJRek5ETEUxQlFVMHNSMEZCUnl4RFFVRkRMRU5CUVVNc1VVRkJVU3hEUVVGRExGbEJRVmtzUTBGQlF5eERRVUZETEVOQlFVTXNVVUZCVVN4RFFVRkRMRU5CUVVNN1VVRkRha1FzVDBGQlR5eEpRVUZKTEVOQlFVTXNRMEZCUXl4SFFVRkhMRXRCUVVzc1EwRkJReXhMUVVGTExFVkJRVVVzUjBGQlJ5eE5RVUZOTEVOQlFVTXNTMEZCU3l4RlFVRkZMRU5CUVVNN1NVRkRia1FzUTBGQlF6dEpRVVZFTEhsRFFVRnBRaXhIUVVGcVFpeFZRVUZyUWl4bFFVRTBRanRSUVVFNVF5eHBRa0ZsUXp0UlFXUkhMRWxCUVVrc1RVRkJUU3hIUVVGSExFVkJRVVVzUTBGQlF6dFJRVU5vUWl4SlFVRkpMRWxCUVVrc1IwRkJSeXhGUVVGRkxFTkJRVU03VVVGRFpDeFJRVUZSTEVOQlFVTXNTVUZCU1N4RFFVRkRMRXRCUVVzc1EwRkJReXhEUVVGRExFTkJRVU1zUlVGQlJTeEpRVUZKTEVWQlFVVXNUVUZCVFN4RFFVRkRMRU5CUVVNN1VVRkRkRU1zU1VGQlNTeEZRVUZGTEVkQlFVY3NTVUZCU1N4RFFVRkRMRkZCUVZFc1JVRkJSU3hEUVVGRE8xRkJRM3BDTEVWQlFVVXNRMEZCUXl4UFFVRlBMRU5CUVVNc1ZVRkJRU3hEUVVGRE8xbEJRMUlzU1VGQlNTeERRVUZETEVkQlFVY3NTMEZCU1N4RFFVRkRMRTlCUVU4c1EwRkJReXhEUVVGRExFTkJRVU1zVFVGQlRTeERRVUZETEVOQlFVTTdXVUZETDBJc1NVRkJTU3hEUVVGRExFZEJRVWNzUzBGQlNTeERRVUZETEU5QlFVOHNRMEZCUXl4RFFVRkRMRU5CUVVNc1RVRkJUU3hEUVVGRExFTkJRVU03V1VGREwwSXNaVUZCWlN4RFFVRkRMRWxCUVVrc1EwRkJReXhKUVVGSkxGTkJRVk1zUTBGRE9VSXNUMEZCVHl4RFFVRkRMRU5CUVVNc1IwRkJSeXhMUVVGTExGZEJRVmNzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRTFCUVUwc1EwRkJReXhEUVVGRExFTkJRVU1zVFVGQlRTeERRVUZETEVOQlFVTXNRMEZCUXl4SFFVRkhMRU5CUVVNc1JVRkRka1FzVDBGQlR5eERRVUZETEVOQlFVTXNSMEZCUnl4TFFVRkxMRmRCUVZjc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEUxQlFVMHNRMEZCUXl4RFFVRkRMRU5CUVVNc1RVRkJUU3hEUVVGRExFTkJRVU1zUTBGQlF5eEhRVUZITEVOQlFVTXNSVUZEZGtRc1EwRkJReXhEUVVGRExFbEJRVWtzUTBGRFZDeERRVUZETEVOQlFVTTdVVUZEVUN4RFFVRkRMRU5CUVVNc1EwRkJRenRSUVVOSUxFOUJRVThzVFVGQlRTeERRVUZETzBsQlEyeENMRU5CUVVNN1NVRkZSQ3huUTBGQlVTeEhRVUZTTzFGQlEwa3NTVUZCU1N4RlFVRkZMRWRCUVVjc1JVRkJSU3hEUVVGRE8xRkJRMW9zWVVGQllTeERRVUZETEZGQlFWRXNRMEZCUXl4SlFVRkpMRU5CUVVNc1MwRkJTeXhEUVVGRExFTkJRVU1zUTBGQlF5eEZRVUZGTEVWQlFVVXNRMEZCUXl4RFFVRkRPMUZCUXpGRExFOUJRVThzUlVGQlJTeERRVUZETzBsQlEyUXNRMEZCUXp0SlFVVk5MSE5DUVVGUkxFZEJRV1lzVlVGQlowSXNUMEZCYTBJc1JVRkJSU3hGUVVGbE8xRkJReTlETEU5QlFVOHNRMEZCUXl4TlFVRk5MRU5CUVVNc1ZVRkJRU3hEUVVGRE8xbEJRMW9zUTBGQlF5eERRVUZETEZGQlFWRXNRMEZCUXl4RlFVRkZMRU5CUVVNc1EwRkJRenRaUVVObUxHRkJRV0VzUTBGQlF5eFJRVUZSTEVOQlFVTXNRMEZCUXl4RFFVRkRMRkZCUVZFc1JVRkJSU3hGUVVGRkxFTkJRVU1zUTBGQlF6dFJRVU16UXl4RFFVRkRMRU5CUVVNc1EwRkJRenRKUVVOUUxFTkJRVU03U1VGRFRDeHZRa0ZCUXp0QlFVRkVMRU5CUVVNc1FVRjRTa1FzU1VGM1NrTTdRVUY0U2xrc2MwTkJRV0U3UVVFd1NqRkNMRk5CUVZNc1VVRkJVU3hEUVVGRExFOUJRV3RDTEVWQlFVVXNTMEZCU3l4RlFVRkZMRTFCUVUwN1NVRkRMME1zVDBGQlR5eERRVUZETEUxQlFVMHNRMEZCUXl4VlFVRkJMRU5CUVVNN1VVRkRXaXhKUVVGSkxFTkJRVU1zUTBGQlF5eE5RVUZOTEVWQlFVVXNSVUZCUlR0WlFVTmFMRWxCUVVrc1EwRkJReXhMUVVGTExFTkJRVU1zVFVGQlRUdG5Ra0ZCUlN4TFFVRkxMRU5CUVVNc1RVRkJUU3hIUVVGSExFVkJRVVVzUTBGQlF6dFpRVU55UXl4TFFVRkxMRU5CUVVNc1RVRkJUU3hEUVVGRExFbEJRVWtzUTBGQlF5eERRVUZETEVOQlFVTXNSVUZCUlN4RFFVRkRMRU5CUVVNN1UwRkRNMEk3WVVGQlRUdFpRVU5JTEVsQlFVa3NRMEZCUXl4SFFVRkhMRXRCUVVzc1EwRkJRenRaUVVOa0xFTkJRVU1zUTBGQlF5eEhRVUZITEVkQlFVY3NUVUZCVFN4RFFVRkRMRTFCUVUwc1EwRkJRenRaUVVOMFFpeEpRVUZKTEVOQlFVTXNRMEZCUXl4RFFVRkRMRkZCUVZFc1JVRkJSU3hKUVVGSkxFTkJRVU1zUTBGQlF5eFpRVUZaTEVWQlFVVXNSVUZCUlR0blFrRkRia01zUTBGQlF5eEhRVUZITEVWQlFVVXNSVUZCUlN4RlFVRkZMRU5CUVVNc1EwRkJReXhIUVVGSExFVkJRVVVzUTBGQlF6dG5Ra0ZEYkVJc1NVRkJTU3hEUVVGRExFTkJRVU1zV1VGQldTeEZRVUZGTzI5Q1FVVm9RaXhMUVVGTExFbEJRVWtzU1VGQlNTeEpRVUZKTEVOQlFVTXNRMEZCUXl4VlFVRlZPM2RDUVVONlFpeERRVUZETEVOQlFVTXNTVUZCU1N4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRExGVkJRVlVzUTBGQlF5eEpRVUZKTEVOQlFVTXNRMEZCUXp0blFrRkRja01zU1VGQlNTeERRVUZETEV0QlFVc3NRMEZCUXl4TlFVRk5PMjlDUVVGRkxFdEJRVXNzUTBGQlF5eE5RVUZOTEVkQlFVY3NSVUZCUlN4RFFVRkRPMmRDUVVOeVF5eExRVUZMTEVOQlFVTXNUVUZCVFN4RFFVRkRMRWxCUVVrc1EwRkJReXhEUVVGRExFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTTdaMEpCUTNwQ0xFMUJRVTBzUTBGQlF5eEpRVUZKTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1lVRkRiRUk3V1VGRFJDeFJRVUZSTEVOQlFVTXNRMEZCUXl4RFFVRkRMRkZCUVZFc1JVRkJSU3hEUVVGRExFVkJRVVVzVFVGQlRTeERRVUZETEVOQlFVTTdVMEZEYmtNN1NVRkRUQ3hEUVVGRExFTkJRVU1zUTBGQlF6dEJRVU5RTEVOQlFVTTdRVUZGUkR0SlFVZEpMR2RDUVVOWExFVkJRVlVzUlVGRFZpeFJRVUZ0UXl4RlFVTnVReXhSUVVGdFF5eEZRVU51UXl4UlFVRnhReXhGUVVOeVF5eFZRVUZuUWp0UlFVaG9RaXg1UWtGQlFTeEZRVUZCTEdWQlFYbENMRkZCUVZFc1JVRkJSVHRSUVVOdVF5eDVRa0ZCUVN4RlFVRkJMR1ZCUVhsQ0xGRkJRVkVzUlVGQlJUdFJRVU51UXl4NVFrRkJRU3hGUVVGQkxHVkJRVEJDTEZOQlFWTXNSVUZCUlR0UlFVaHlReXhQUVVGRkxFZEJRVVlzUlVGQlJTeERRVUZSTzFGQlExWXNZVUZCVVN4SFFVRlNMRkZCUVZFc1EwRkJNa0k3VVVGRGJrTXNZVUZCVVN4SFFVRlNMRkZCUVZFc1EwRkJNa0k3VVVGRGJrTXNZVUZCVVN4SFFVRlNMRkZCUVZFc1EwRkJOa0k3VVVGRGNrTXNaVUZCVlN4SFFVRldMRlZCUVZVc1EwRkJUVHRKUVVGSkxFTkJRVU03U1VGRmFFTXNlVUpCUVZFc1IwRkJVaXhWUVVGVExFVkJRV1U3VVVGQmVFSXNhVUpCVFVNN1VVRk1SeXhKUVVGSkxFTkJRVU1zVVVGQlVTeERRVUZETEUxQlFVMHNRMEZCUXl4VlFVRkRMRVZCUVVVc1JVRkJSU3hSUVVGUk8xbEJRemxDTEVWQlFVVXNRMEZCUXl4TlFVRk5MRU5CUVVNc1ZVRkJRU3hOUVVGTk8yZENRVU5hTEVWQlFVVXNRMEZCUXl4SlFVRkpMRU5CUVVNc1NVRkJTU3hUUVVGVExFTkJRVU1zUzBGQlNTeERRVUZETEVWQlFVVXNSVUZCUlN4TlFVRk5MRU5CUVVNc1JVRkJSU3hGUVVGRkxGRkJRVkVzUTBGQlF5eERRVUZETEVOQlFVTTdXVUZEZWtRc1EwRkJReXhEUVVGRExFTkJRVU03VVVGRFVDeERRVUZETEVOQlFVTXNRMEZCUXp0SlFVTlFMRU5CUVVNN1NVRkZSQ3gxUWtGQlRTeEhRVUZPTzFGQlEwa3NUMEZCVHl4SlFVRkpMRU5CUVVNc1VVRkJVU3hEUVVGRExFdEJRVXNzUlVGQlJTeExRVUZMTEVOQlFVTXNRMEZCUXp0SlFVTjJReXhEUVVGRE8wbEJSVVFzZVVKQlFWRXNSMEZCVWp0UlFVTkpMRTlCUVU4c1NVRkJTU3hEUVVGRExGRkJRVkVzUTBGQlF5eExRVUZMTEVWQlFVVXNTMEZCU3l4RFFVRkRMRWxCUVVrc1NVRkJTU3hEUVVGRExGRkJRVkVzUTBGQlF5eExRVUZMTEVWQlFVVXNTMEZCU3l4RFFVRkRMRU5CUVVNN1NVRkRkRVVzUTBGQlF6dEpRVVZFTERaQ1FVRlpMRWRCUVZvN1VVRkRTU3hQUVVGUExFOUJRVThzU1VGQlNTeERRVUZETEZWQlFWVXNTMEZCU3l4WFFVRlhMRU5CUVVNN1NVRkRiRVFzUTBGQlF6dEpRVU5NTEdGQlFVTTdRVUZCUkN4RFFVRkRMRUZCTjBKRUxFbEJOa0pETzBGQk4wSlpMSGRDUVVGTk8wRkJLMEp1UWl4VFFVRlRMRmxCUVZrc1EwRkJReXhEUVVGTkxFVkJRVVVzUTBGQlRUdEpRVU5vUXl4SlFVRkpMRU5CUVVNc1IwRkJSeXhGUVVGRkxFTkJRVU03U1VGRFdDeExRVUZMTEVsQlFVa3NRMEZCUXl4SlFVRkpMRU5CUVVNN1VVRkJSU3hKUVVGSkxFTkJRVU1zU1VGQlNTeERRVUZETzFsQlFVVXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0SlFVTjZReXhQUVVGUExFTkJRVU1zUTBGQlF6dEJRVU5pTEVOQlFVTTdRVUZGUkR0SlFVRkJPMUZCUTBrc1ZVRkJTeXhIUVVGUkxFVkJRVVVzUTBGQlF6dEpRV3REY0VJc1EwRkJRenRKUVdwRFJ5eDVRa0ZCU3l4SFFVRk1PMUZCUTBrc1QwRkJUeXhOUVVGTkxFTkJRVU1zU1VGQlNTeERRVUZETEVsQlFVa3NRMEZCUXl4TFFVRkxMRU5CUVVNc1EwRkJReXhOUVVGTkxFTkJRVU03U1VGRE1VTXNRMEZCUXp0SlFVTkVMR2REUVVGWkxFZEJRVm9zVlVGQllTeExRVUZuUWp0UlFVTjZRaXhKUVVGSkxFMUJRVTBzUjBGQlJ5eEpRVUZKTEZOQlFWTXNSVUZCUlN4RFFVRkRPMUZCUXpkQ0xFMUJRVTBzUTBGQlF5eExRVUZMTEVkQlFVY3NXVUZCV1N4RFFVRkRMRWxCUVVrc1EwRkJReXhMUVVGTExFVkJRVVVzUzBGQlN5eERRVUZETEV0QlFVc3NRMEZCUXl4RFFVRkRPMUZCUTNKRUxFOUJRVThzVFVGQlRTeERRVUZETzBsQlEyeENMRU5CUVVNN1NVRkRSQ3h4UTBGQmFVSXNSMEZCYWtJc1ZVRkJhMElzUzBGQlowSTdVVUZET1VJc1QwRkJUeXhKUVVGSkxFTkJRVU1zV1VGQldTeERRVUZETEV0QlFVc3NRMEZCUXl4RFFVRkRMRXRCUVVzc1JVRkJSU3hEUVVGRE8wbEJRelZETEVOQlFVTTdTVUZEUkN3MFFrRkJVU3hIUVVGU0xGVkJRVk1zUlVGQlZUdFJRVU5tTEU5QlFVOHNSVUZCUlN4SlFVRkpMRWxCUVVrc1EwRkJReXhMUVVGTExFTkJRVU03U1VGRE5VSXNRMEZCUXp0SlFVTkVMSFZDUVVGSExFZEJRVWdzVlVGQlNTeERRVUZUTzFGQlExUXNTVUZCU1N4RFFVRkRMRXRCUVVzc1EwRkJReXhEUVVGRExFTkJRVU1zUlVGQlJTeERRVUZETEVkQlFVY3NRMEZCUXl4RFFVRkRPMGxCUTNwQ0xFTkJRVU03U1VGRFJDd3dRa0ZCVFN4SFFVRk9MRlZCUVU4c1EwRkJVenRSUVVOYUxFOUJRVThzU1VGQlNTeERRVUZETEV0QlFVc3NRMEZCUXl4RFFVRkRMRU5CUVVNc1JVRkJSU3hEUVVGRExFTkJRVU03U1VGRE5VSXNRMEZCUXp0SlFVTkVMREJDUVVGTkxFZEJRVTRzVlVGQlR5eERRVUZ6UWp0UlFVTjZRaXhMUVVGTExFbEJRVWtzUjBGQlJ5eEpRVUZKTEVsQlFVa3NRMEZCUXl4TFFVRkxMRVZCUVVVN1dVRkRlRUlzUTBGQlF5eERRVUZETEVsQlFVa3NRMEZCUXl4TFFVRkxMRU5CUVVNc1IwRkJSeXhEUVVGRExFTkJRVU1zUTBGQlF6dFRRVU4wUWp0SlFVTk1MRU5CUVVNN1NVRkRSQ3d5UWtGQlR5eEhRVUZRTzFGQlEwa3NTVUZCU1N4RlFVRkZMRWRCUVVjc1JVRkJSU3hEUVVGRE8xRkJRMW9zU1VGQlNTeERRVUZETEUxQlFVMHNRMEZCUXl4VlFVRkJMRU5CUVVNN1dVRkRWQ3hKUVVGSkxFTkJRVU1zUTBGQlF5eERRVUZETEZsQlFWa3NSVUZCUlR0blFrRkRha0lzUlVGQlJTeERRVUZETEVsQlFVa3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJRenRSUVVOdVFpeERRVUZETEVOQlFVTXNRMEZCUXp0UlFVTklMRTlCUVU4c1JVRkJSU3hEUVVGRE8wbEJRMlFzUTBGQlF6dEpRVU5NTEdkQ1FVRkRPMEZCUVVRc1EwRkJReXhCUVc1RFJDeEpRVzFEUXp0QlFXNURXU3c0UWtGQlV6dEJRWEZEZEVJN1NVRkJRVHRSUVVOSkxGTkJRVWtzUjBGQlVTeEZRVUZGTEVOQlFVTTdVVUZEWml4TlFVRkRMRWRCUVZjc1EwRkJReXhEUVVGRE8wbEJaMFJzUWl4RFFVRkRPMGxCTDBOSExIZENRVUZMTEVkQlFVdzdVVUZEU1N4UFFVRlBMRWxCUVVrc1EwRkJReXhEUVVGRExFTkJRVU03U1VGRGJFSXNRMEZCUXp0SlFVTkVMREpDUVVGUkxFZEJRVklzVlVGQlV5eEZRVUZWTzFGQlEyWXNTVUZCU1N4TlFVRk5MRWRCUVVjc1MwRkJTeXhEUVVGRE8xRkJRMjVDTEVsQlFVa3NRMEZCUXl4aFFVRmhMRU5CUVVNc1ZVRkJRU3hEUVVGRE8xbEJRMmhDTEVsQlFVa3NRMEZCUXl4TlFVRk5MRWxCUVVrc1EwRkJReXhEUVVGRExFVkJRVVVzU1VGQlNTeEZRVUZGTEVWQlFVVTdaMEpCUTNaQ0xFMUJRVTBzUjBGQlJ5eEpRVUZKTEVOQlFVTTdZVUZEYWtJN1VVRkRUQ3hEUVVGRExFTkJRVU1zUTBGQlF6dFJRVU5JTEU5QlFVOHNUVUZCVFN4RFFVRkRPMGxCUTJ4Q0xFTkJRVU03U1VGRFJDeHpRa0ZCUnl4SFFVRklMRlZCUVVrc1VVRkJaMElzUlVGQlJTeERRVUZUTzFGQlF6TkNMRWxCUVVrc1EwRkJReXhIUVVGakxGRkJRVkVzU1VGQlNTeEpRVUZKTEVOQlFVTXNTVUZCU1N4RFFVRkRMRU5CUVVNc1EwRkJReXhKUVVGSkxFTkJRVU1zU1VGQlNTeERRVUZETEZGQlFWRXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhKUVVGSkxFTkJRVU1zU1VGQlNTeERRVUZETEZGQlFWRXNRMEZCUXl4SFFVRkhMRWxCUVVrc1UwRkJVeXhGUVVGRkxFTkJRVU03VVVGRGRrY3NRMEZCUXl4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dFJRVU5VTEVWQlFVVXNTVUZCU1N4RFFVRkRMRU5CUVVNc1EwRkJRenRKUVVOaUxFTkJRVU03U1VGRFJDeDVRa0ZCVFN4SFFVRk9MRlZCUVU4c1VVRkJaMElzUlVGQlJTeERRVUZUTzFGQlF6bENMRWxCUVVrc1JVRkJSU3hIUVVGakxFbEJRVWtzUTBGQlF5eEpRVUZKTEVOQlFVTXNVVUZCVVN4RFFVRkRMRU5CUVVNN1VVRkRlRU1zUlVGQlJTeERRVUZETEUxQlFVMHNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJRenRSUVVOaUxFbEJRVWtzUlVGQlJTeERRVUZETEV0QlFVc3NSVUZCUlN4TFFVRkxMRU5CUVVNc1JVRkJSVHRaUVVOc1FpeFBRVUZQTEVsQlFVa3NRMEZCUXl4SlFVRkpMRU5CUVVNc1VVRkJVU3hEUVVGRExFTkJRVU03VTBGRE9VSTdVVUZEUkN4RlFVRkZMRWxCUVVrc1EwRkJReXhEUVVGRExFTkJRVU03U1VGRFlpeERRVUZETzBsQlEwUXNlVUpCUVUwc1IwRkJUaXhWUVVGUExFTkJRVFJETzFGQlF5OURMRXRCUVVzc1NVRkJTU3hSUVVGUkxFbEJRVWtzU1VGQlNTeERRVUZETEVsQlFVa3NSVUZCUlR0WlFVTTFRaXhEUVVGRExFTkJRVmtzU1VGQlNTeERRVUZETEVsQlFVa3NRMEZCUXl4UlFVRlJMRU5CUVVNc1JVRkJSU3hOUVVGTkxFTkJRVU1zVVVGQlVTeERRVUZETEVOQlFVTXNRMEZCUXp0VFFVTjJSRHRKUVVOTUxFTkJRVU03U1VGRFJDeG5RMEZCWVN4SFFVRmlMRlZCUVdNc1EwRkJjMEk3VVVGRGFFTXNTVUZCU1N4RFFVRkRMRTFCUVUwc1EwRkJReXhWUVVGRExFVkJRVVVzUlVGQlJTeEZRVUZGTEVsQlFVc3NUMEZCUVN4RlFVRkZMRU5CUVVNc1RVRkJUU3hEUVVGRExFTkJRVU1zUTBGQlF5eEZRVUZhTEVOQlFWa3NRMEZCUXl4RFFVRkRPMGxCUXpGRExFTkJRVU03U1VGRFJDd3JRa0ZCV1N4SFFVRmFMRlZCUVdFc1MwRkJaVHRSUVVONFFpeEpRVUZKTEUxQlFVMHNSMEZCWVN4SlFVRkpMRkZCUVZFc1JVRkJSU3hEUVVGRE8xRkJRM1JETEVsQlFVa3NRMEZCUXl4TlFVRk5MRU5CUVVNc1ZVRkJReXhGUVVGRkxFVkJRVVVzUlVGQlJUdFpRVU5tTEVsQlFVa3NSVUZCUlN4SlFVRkpMRXRCUVVzc1EwRkJReXhKUVVGSkxFVkJRVVU3WjBKQlEyeENMRWxCUVVrc1EwRkJReXhIUVVGSExFVkJRVVVzUTBGQlF5eFpRVUZaTEVOQlFVTXNTMEZCU3l4RFFVRkRMRWxCUVVrc1EwRkJReXhGUVVGRkxFTkJRVU1zUTBGQlF5eEZRVU51UXl4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRExFdEJRVXNzUlVGQlJTeERRVUZETzJkQ1FVTnNRaXhKUVVGSkxFTkJRVU1zUjBGQlJ5eERRVUZETEVWQlFVVTdiMEpCUTFBc1RVRkJUU3hEUVVGRExFbEJRVWtzUTBGQlF5eEZRVUZGTEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNN2IwSkJRM0JDTEUxQlFVMHNRMEZCUXl4RFFVRkRMRWxCUVVrc1EwRkJReXhEUVVGRE8ybENRVU5xUWp0aFFVTktPMUZCUTB3c1EwRkJReXhEUVVGRExFTkJRVU03VVVGRFNDeFBRVUZQTEUxQlFVMHNRMEZCUXp0SlFVTnNRaXhEUVVGRE8wbEJRMHdzWlVGQlF6dEJRVUZFTEVOQlFVTXNRVUZzUkVRc1NVRnJSRU03UVVGc1JGa3NORUpCUVZFN1FVRnZSSEpDTEZOQlFWTXNhVUpCUVdsQ0xFTkJRVU1zUTBGQlRTeEZRVUZGTEVOQlFVMDdTVUZEY2tNc1QwRkJUeXhOUVVGTkxFTkJRVU1zU1VGQlNTeERRVUZETEZsQlFWa3NRMEZCUXl4RFFVRkRMRVZCUVVVc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eE5RVUZOTEVOQlFVRTdRVUZEYWtRc1EwRkJRenRCUVVWRUxGTkJRV2RDTEZOQlFWTXNRMEZCVHl4TFFVRlpMRVZCUVVVc1MwRkJZU3hGUVVGRkxFVkJRVEJDTEVWQlFVVXNVMEZCYVVJN1NVRkRkRWNzU1VGQlNTeERRVUZETEVkQlFVY3NTMEZCU3l4RFFVRkRMRTFCUVUwc1JVRkRhRUlzUTBGQlF5eEhRVUZITEVsQlFVa3NZVUZCWVN4RFFVRkRMRU5CUVVNc1JVRkJSU3hMUVVGTExFVkJRVVVzUlVGQlJTeEZRVUZGTEZOQlFWTXNRMEZCUXl4RFFVRkRPMGxCUTI1RUxFOUJRVThzUTBGQlF5eERRVUZETEZkQlFWY3NSVUZCUlR0UlFVRkRMRU5CUVVNN1NVRkRlRUlzU1VGQlNTeFZRVUZWTEVkQlFXZENMRVZCUVVVc1EwRkJRenRKUVVOcVF5eEpRVUZKTEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNc2FVSkJRV2xDTEVOQlFVTXNWVUZCVlN4RFFVRkRMRU5CUVVNN1NVRkRlRU1zVlVGQlZTeERRVUZETEU5QlFVOHNRMEZCUXl4VlFVRlZMRU5CUVVNN1VVRkRNVUlzU1VGQlNTeERRVUZETEVkQlFVY3NWVUZCUXl4SFFVRkhPMWxCUTFJc1NVRkJTU3hEUVVGRExFZEJRVWNzUTBGQlF5eERRVUZETEVkQlFVY3NRMEZCUXl4RFFVRkRPMWxCUTJZc1NVRkJTU3hQUVVGUExFTkJRVU1zU1VGQlNTeFJRVUZSTzJkQ1FVRkZMRU5CUVVNc1EwRkJReXhIUVVGSExFTkJRVU1zUjBGQlJ5eExRVUZMTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1VVRkRhRVFzUTBGQlF5eERRVUZETzFGQlEwWXNRMEZCUXl4RFFVRkRMRkZCUVZFc1EwRkJReXhEUVVGRE8xRkJRMW9zUTBGQlF5eERRVUZETEZGQlFWRXNRMEZCUXl4RFFVRkRPMGxCUTJoQ0xFTkJRVU1zUTBGQlF5eERRVUZETzBsQlEwZ3NUMEZCVHl4RlFVRkZMRTFCUVUwc1JVRkJSU3hEUVVGRExFVkJRVVVzVlVGQlZTeEZRVUZGTEZWQlFWVXNSVUZCUlN4RFFVRkRPMEZCUTJwRUxFTkJRVU03UVVGbVJDdzRRa0ZsUXlKOSIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIFBhaXJpbmdIZWFwID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBQYWlyaW5nSGVhcChlbGVtKSB7XG4gICAgICAgIHRoaXMuZWxlbSA9IGVsZW07XG4gICAgICAgIHRoaXMuc3ViaGVhcHMgPSBbXTtcbiAgICB9XG4gICAgUGFpcmluZ0hlYXAucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24gKHNlbGVjdG9yKSB7XG4gICAgICAgIHZhciBzdHIgPSBcIlwiLCBuZWVkQ29tbWEgPSBmYWxzZTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLnN1YmhlYXBzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICB2YXIgc3ViaGVhcCA9IHRoaXMuc3ViaGVhcHNbaV07XG4gICAgICAgICAgICBpZiAoIXN1YmhlYXAuZWxlbSkge1xuICAgICAgICAgICAgICAgIG5lZWRDb21tYSA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKG5lZWRDb21tYSkge1xuICAgICAgICAgICAgICAgIHN0ciA9IHN0ciArIFwiLFwiO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc3RyID0gc3RyICsgc3ViaGVhcC50b1N0cmluZyhzZWxlY3Rvcik7XG4gICAgICAgICAgICBuZWVkQ29tbWEgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIGlmIChzdHIgIT09IFwiXCIpIHtcbiAgICAgICAgICAgIHN0ciA9IFwiKFwiICsgc3RyICsgXCIpXCI7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuICh0aGlzLmVsZW0gPyBzZWxlY3Rvcih0aGlzLmVsZW0pIDogXCJcIikgKyBzdHI7XG4gICAgfTtcbiAgICBQYWlyaW5nSGVhcC5wcm90b3R5cGUuZm9yRWFjaCA9IGZ1bmN0aW9uIChmKSB7XG4gICAgICAgIGlmICghdGhpcy5lbXB0eSgpKSB7XG4gICAgICAgICAgICBmKHRoaXMuZWxlbSwgdGhpcyk7XG4gICAgICAgICAgICB0aGlzLnN1YmhlYXBzLmZvckVhY2goZnVuY3Rpb24gKHMpIHsgcmV0dXJuIHMuZm9yRWFjaChmKTsgfSk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIFBhaXJpbmdIZWFwLnByb3RvdHlwZS5jb3VudCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZW1wdHkoKSA/IDAgOiAxICsgdGhpcy5zdWJoZWFwcy5yZWR1Y2UoZnVuY3Rpb24gKG4sIGgpIHtcbiAgICAgICAgICAgIHJldHVybiBuICsgaC5jb3VudCgpO1xuICAgICAgICB9LCAwKTtcbiAgICB9O1xuICAgIFBhaXJpbmdIZWFwLnByb3RvdHlwZS5taW4gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmVsZW07XG4gICAgfTtcbiAgICBQYWlyaW5nSGVhcC5wcm90b3R5cGUuZW1wdHkgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmVsZW0gPT0gbnVsbDtcbiAgICB9O1xuICAgIFBhaXJpbmdIZWFwLnByb3RvdHlwZS5jb250YWlucyA9IGZ1bmN0aW9uIChoKSB7XG4gICAgICAgIGlmICh0aGlzID09PSBoKVxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5zdWJoZWFwcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgaWYgKHRoaXMuc3ViaGVhcHNbaV0uY29udGFpbnMoaCkpXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH07XG4gICAgUGFpcmluZ0hlYXAucHJvdG90eXBlLmlzSGVhcCA9IGZ1bmN0aW9uIChsZXNzVGhhbikge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICByZXR1cm4gdGhpcy5zdWJoZWFwcy5ldmVyeShmdW5jdGlvbiAoaCkgeyByZXR1cm4gbGVzc1RoYW4oX3RoaXMuZWxlbSwgaC5lbGVtKSAmJiBoLmlzSGVhcChsZXNzVGhhbik7IH0pO1xuICAgIH07XG4gICAgUGFpcmluZ0hlYXAucHJvdG90eXBlLmluc2VydCA9IGZ1bmN0aW9uIChvYmosIGxlc3NUaGFuKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm1lcmdlKG5ldyBQYWlyaW5nSGVhcChvYmopLCBsZXNzVGhhbik7XG4gICAgfTtcbiAgICBQYWlyaW5nSGVhcC5wcm90b3R5cGUubWVyZ2UgPSBmdW5jdGlvbiAoaGVhcDIsIGxlc3NUaGFuKSB7XG4gICAgICAgIGlmICh0aGlzLmVtcHR5KCkpXG4gICAgICAgICAgICByZXR1cm4gaGVhcDI7XG4gICAgICAgIGVsc2UgaWYgKGhlYXAyLmVtcHR5KCkpXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgZWxzZSBpZiAobGVzc1RoYW4odGhpcy5lbGVtLCBoZWFwMi5lbGVtKSkge1xuICAgICAgICAgICAgdGhpcy5zdWJoZWFwcy5wdXNoKGhlYXAyKTtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgaGVhcDIuc3ViaGVhcHMucHVzaCh0aGlzKTtcbiAgICAgICAgICAgIHJldHVybiBoZWFwMjtcbiAgICAgICAgfVxuICAgIH07XG4gICAgUGFpcmluZ0hlYXAucHJvdG90eXBlLnJlbW92ZU1pbiA9IGZ1bmN0aW9uIChsZXNzVGhhbikge1xuICAgICAgICBpZiAodGhpcy5lbXB0eSgpKVxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHJldHVybiB0aGlzLm1lcmdlUGFpcnMobGVzc1RoYW4pO1xuICAgIH07XG4gICAgUGFpcmluZ0hlYXAucHJvdG90eXBlLm1lcmdlUGFpcnMgPSBmdW5jdGlvbiAobGVzc1RoYW4pIHtcbiAgICAgICAgaWYgKHRoaXMuc3ViaGVhcHMubGVuZ3RoID09IDApXG4gICAgICAgICAgICByZXR1cm4gbmV3IFBhaXJpbmdIZWFwKG51bGwpO1xuICAgICAgICBlbHNlIGlmICh0aGlzLnN1YmhlYXBzLmxlbmd0aCA9PSAxKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5zdWJoZWFwc1swXTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHZhciBmaXJzdFBhaXIgPSB0aGlzLnN1YmhlYXBzLnBvcCgpLm1lcmdlKHRoaXMuc3ViaGVhcHMucG9wKCksIGxlc3NUaGFuKTtcbiAgICAgICAgICAgIHZhciByZW1haW5pbmcgPSB0aGlzLm1lcmdlUGFpcnMobGVzc1RoYW4pO1xuICAgICAgICAgICAgcmV0dXJuIGZpcnN0UGFpci5tZXJnZShyZW1haW5pbmcsIGxlc3NUaGFuKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgUGFpcmluZ0hlYXAucHJvdG90eXBlLmRlY3JlYXNlS2V5ID0gZnVuY3Rpb24gKHN1YmhlYXAsIG5ld1ZhbHVlLCBzZXRIZWFwTm9kZSwgbGVzc1RoYW4pIHtcbiAgICAgICAgdmFyIG5ld0hlYXAgPSBzdWJoZWFwLnJlbW92ZU1pbihsZXNzVGhhbik7XG4gICAgICAgIHN1YmhlYXAuZWxlbSA9IG5ld0hlYXAuZWxlbTtcbiAgICAgICAgc3ViaGVhcC5zdWJoZWFwcyA9IG5ld0hlYXAuc3ViaGVhcHM7XG4gICAgICAgIGlmIChzZXRIZWFwTm9kZSAhPT0gbnVsbCAmJiBuZXdIZWFwLmVsZW0gIT09IG51bGwpIHtcbiAgICAgICAgICAgIHNldEhlYXBOb2RlKHN1YmhlYXAuZWxlbSwgc3ViaGVhcCk7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHBhaXJpbmdOb2RlID0gbmV3IFBhaXJpbmdIZWFwKG5ld1ZhbHVlKTtcbiAgICAgICAgaWYgKHNldEhlYXBOb2RlICE9PSBudWxsKSB7XG4gICAgICAgICAgICBzZXRIZWFwTm9kZShuZXdWYWx1ZSwgcGFpcmluZ05vZGUpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzLm1lcmdlKHBhaXJpbmdOb2RlLCBsZXNzVGhhbik7XG4gICAgfTtcbiAgICByZXR1cm4gUGFpcmluZ0hlYXA7XG59KCkpO1xuZXhwb3J0cy5QYWlyaW5nSGVhcCA9IFBhaXJpbmdIZWFwO1xudmFyIFByaW9yaXR5UXVldWUgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIFByaW9yaXR5UXVldWUobGVzc1RoYW4pIHtcbiAgICAgICAgdGhpcy5sZXNzVGhhbiA9IGxlc3NUaGFuO1xuICAgIH1cbiAgICBQcmlvcml0eVF1ZXVlLnByb3RvdHlwZS50b3AgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICh0aGlzLmVtcHR5KCkpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzLnJvb3QuZWxlbTtcbiAgICB9O1xuICAgIFByaW9yaXR5UXVldWUucHJvdG90eXBlLnB1c2ggPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBhcmdzID0gW107XG4gICAgICAgIGZvciAodmFyIF9pID0gMDsgX2kgPCBhcmd1bWVudHMubGVuZ3RoOyBfaSsrKSB7XG4gICAgICAgICAgICBhcmdzW19pXSA9IGFyZ3VtZW50c1tfaV07XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHBhaXJpbmdOb2RlO1xuICAgICAgICBmb3IgKHZhciBpID0gMCwgYXJnOyBhcmcgPSBhcmdzW2ldOyArK2kpIHtcbiAgICAgICAgICAgIHBhaXJpbmdOb2RlID0gbmV3IFBhaXJpbmdIZWFwKGFyZyk7XG4gICAgICAgICAgICB0aGlzLnJvb3QgPSB0aGlzLmVtcHR5KCkgP1xuICAgICAgICAgICAgICAgIHBhaXJpbmdOb2RlIDogdGhpcy5yb290Lm1lcmdlKHBhaXJpbmdOb2RlLCB0aGlzLmxlc3NUaGFuKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcGFpcmluZ05vZGU7XG4gICAgfTtcbiAgICBQcmlvcml0eVF1ZXVlLnByb3RvdHlwZS5lbXB0eSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuICF0aGlzLnJvb3QgfHwgIXRoaXMucm9vdC5lbGVtO1xuICAgIH07XG4gICAgUHJpb3JpdHlRdWV1ZS5wcm90b3R5cGUuaXNIZWFwID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5yb290LmlzSGVhcCh0aGlzLmxlc3NUaGFuKTtcbiAgICB9O1xuICAgIFByaW9yaXR5UXVldWUucHJvdG90eXBlLmZvckVhY2ggPSBmdW5jdGlvbiAoZikge1xuICAgICAgICB0aGlzLnJvb3QuZm9yRWFjaChmKTtcbiAgICB9O1xuICAgIFByaW9yaXR5UXVldWUucHJvdG90eXBlLnBvcCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKHRoaXMuZW1wdHkoKSkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIG9iaiA9IHRoaXMucm9vdC5taW4oKTtcbiAgICAgICAgdGhpcy5yb290ID0gdGhpcy5yb290LnJlbW92ZU1pbih0aGlzLmxlc3NUaGFuKTtcbiAgICAgICAgcmV0dXJuIG9iajtcbiAgICB9O1xuICAgIFByaW9yaXR5UXVldWUucHJvdG90eXBlLnJlZHVjZUtleSA9IGZ1bmN0aW9uIChoZWFwTm9kZSwgbmV3S2V5LCBzZXRIZWFwTm9kZSkge1xuICAgICAgICBpZiAoc2V0SGVhcE5vZGUgPT09IHZvaWQgMCkgeyBzZXRIZWFwTm9kZSA9IG51bGw7IH1cbiAgICAgICAgdGhpcy5yb290ID0gdGhpcy5yb290LmRlY3JlYXNlS2V5KGhlYXBOb2RlLCBuZXdLZXksIHNldEhlYXBOb2RlLCB0aGlzLmxlc3NUaGFuKTtcbiAgICB9O1xuICAgIFByaW9yaXR5UXVldWUucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24gKHNlbGVjdG9yKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJvb3QudG9TdHJpbmcoc2VsZWN0b3IpO1xuICAgIH07XG4gICAgUHJpb3JpdHlRdWV1ZS5wcm90b3R5cGUuY291bnQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJvb3QuY291bnQoKTtcbiAgICB9O1xuICAgIHJldHVybiBQcmlvcml0eVF1ZXVlO1xufSgpKTtcbmV4cG9ydHMuUHJpb3JpdHlRdWV1ZSA9IFByaW9yaXR5UXVldWU7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1kYXRhOmFwcGxpY2F0aW9uL2pzb247YmFzZTY0LGV5SjJaWEp6YVc5dUlqb3pMQ0ptYVd4bElqb2ljSEYxWlhWbExtcHpJaXdpYzI5MWNtTmxVbTl2ZENJNklpSXNJbk52ZFhKalpYTWlPbHNpTGk0dkxpNHZWMlZpUTI5c1lTOXpjbU12Y0hGMVpYVmxMblJ6SWwwc0ltNWhiV1Z6SWpwYlhTd2liV0Z3Y0dsdVozTWlPaUk3TzBGQlEwRTdTVUZKU1N4eFFrRkJiVUlzU1VGQlR6dFJRVUZRTEZOQlFVa3NSMEZCU2l4SlFVRkpMRU5CUVVjN1VVRkRkRUlzU1VGQlNTeERRVUZETEZGQlFWRXNSMEZCUnl4RlFVRkZMRU5CUVVNN1NVRkRka0lzUTBGQlF6dEpRVVZOTERoQ1FVRlJMRWRCUVdZc1ZVRkJaMElzVVVGQlVUdFJRVU53UWl4SlFVRkpMRWRCUVVjc1IwRkJSeXhGUVVGRkxFVkJRVVVzVTBGQlV5eEhRVUZITEV0QlFVc3NRMEZCUXp0UlFVTm9ReXhMUVVGTExFbEJRVWtzUTBGQlF5eEhRVUZITEVOQlFVTXNSVUZCUlN4RFFVRkRMRWRCUVVjc1NVRkJTU3hEUVVGRExGRkJRVkVzUTBGQlF5eE5RVUZOTEVWQlFVVXNSVUZCUlN4RFFVRkRMRVZCUVVVN1dVRkRNME1zU1VGQlNTeFBRVUZQTEVkQlFXMUNMRWxCUVVrc1EwRkJReXhSUVVGUkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTTdXVUZETDBNc1NVRkJTU3hEUVVGRExFOUJRVThzUTBGQlF5eEpRVUZKTEVWQlFVVTdaMEpCUTJZc1UwRkJVeXhIUVVGSExFdEJRVXNzUTBGQlF6dG5Ra0ZEYkVJc1UwRkJVenRoUVVOYU8xbEJRMFFzU1VGQlNTeFRRVUZUTEVWQlFVVTdaMEpCUTFnc1IwRkJSeXhIUVVGSExFZEJRVWNzUjBGQlJ5eEhRVUZITEVOQlFVTTdZVUZEYmtJN1dVRkRSQ3hIUVVGSExFZEJRVWNzUjBGQlJ5eEhRVUZITEU5QlFVOHNRMEZCUXl4UlFVRlJMRU5CUVVNc1VVRkJVU3hEUVVGRExFTkJRVU03V1VGRGRrTXNVMEZCVXl4SFFVRkhMRWxCUVVrc1EwRkJRenRUUVVOd1FqdFJRVU5FTEVsQlFVa3NSMEZCUnl4TFFVRkxMRVZCUVVVc1JVRkJSVHRaUVVOYUxFZEJRVWNzUjBGQlJ5eEhRVUZITEVkQlFVY3NSMEZCUnl4SFFVRkhMRWRCUVVjc1EwRkJRenRUUVVONlFqdFJRVU5FTEU5QlFVOHNRMEZCUXl4SlFVRkpMRU5CUVVNc1NVRkJTU3hEUVVGRExFTkJRVU1zUTBGQlF5eFJRVUZSTEVOQlFVTXNTVUZCU1N4RFFVRkRMRWxCUVVrc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eEZRVUZGTEVOQlFVTXNSMEZCUnl4SFFVRkhMRU5CUVVNN1NVRkRlRVFzUTBGQlF6dEpRVVZOTERaQ1FVRlBMRWRCUVdRc1ZVRkJaU3hEUVVGRE8xRkJRMW9zU1VGQlNTeERRVUZETEVsQlFVa3NRMEZCUXl4TFFVRkxMRVZCUVVVc1JVRkJSVHRaUVVObUxFTkJRVU1zUTBGQlF5eEpRVUZKTEVOQlFVTXNTVUZCU1N4RlFVRkZMRWxCUVVrc1EwRkJReXhEUVVGRE8xbEJRMjVDTEVsQlFVa3NRMEZCUXl4UlFVRlJMRU5CUVVNc1QwRkJUeXhEUVVGRExGVkJRVUVzUTBGQlF5eEpRVUZKTEU5QlFVRXNRMEZCUXl4RFFVRkRMRTlCUVU4c1EwRkJReXhEUVVGRExFTkJRVU1zUlVGQldpeERRVUZaTEVOQlFVTXNRMEZCUXp0VFFVTTFRenRKUVVOTUxFTkJRVU03U1VGRlRTd3lRa0ZCU3l4SFFVRmFPMUZCUTBrc1QwRkJUeXhKUVVGSkxFTkJRVU1zUzBGQlN5eEZRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eEhRVUZITEVsQlFVa3NRMEZCUXl4UlFVRlJMRU5CUVVNc1RVRkJUU3hEUVVGRExGVkJRVU1zUTBGQlV5eEZRVUZGTEVOQlFXbENPMWxCUXpWRkxFOUJRVThzUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXl4TFFVRkxMRVZCUVVVc1EwRkJRenRSUVVONlFpeERRVUZETEVWQlFVVXNRMEZCUXl4RFFVRkRMRU5CUVVNN1NVRkRWaXhEUVVGRE8wbEJSVTBzZVVKQlFVY3NSMEZCVmp0UlFVTkpMRTlCUVU4c1NVRkJTU3hEUVVGRExFbEJRVWtzUTBGQlF6dEpRVU55UWl4RFFVRkRPMGxCUlUwc01rSkJRVXNzUjBGQldqdFJRVU5KTEU5QlFVOHNTVUZCU1N4RFFVRkRMRWxCUVVrc1NVRkJTU3hKUVVGSkxFTkJRVU03U1VGRE4wSXNRMEZCUXp0SlFVVk5MRGhDUVVGUkxFZEJRV1lzVlVGQlowSXNRMEZCYVVJN1VVRkROMElzU1VGQlNTeEpRVUZKTEV0QlFVc3NRMEZCUXp0WlFVRkZMRTlCUVU4c1NVRkJTU3hEUVVGRE8xRkJRelZDTEV0QlFVc3NTVUZCU1N4RFFVRkRMRWRCUVVjc1EwRkJReXhGUVVGRkxFTkJRVU1zUjBGQlJ5eEpRVUZKTEVOQlFVTXNVVUZCVVN4RFFVRkRMRTFCUVUwc1JVRkJSU3hEUVVGRExFVkJRVVVzUlVGQlJUdFpRVU16UXl4SlFVRkpMRWxCUVVrc1EwRkJReXhSUVVGUkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNVVUZCVVN4RFFVRkRMRU5CUVVNc1EwRkJRenRuUWtGQlJTeFBRVUZQTEVsQlFVa3NRMEZCUXp0VFFVTnFSRHRSUVVORUxFOUJRVThzUzBGQlN5eERRVUZETzBsQlEycENMRU5CUVVNN1NVRkZUU3cwUWtGQlRTeEhRVUZpTEZWQlFXTXNVVUZCYVVNN1VVRkJMME1zYVVKQlJVTTdVVUZFUnl4UFFVRlBMRWxCUVVrc1EwRkJReXhSUVVGUkxFTkJRVU1zUzBGQlN5eERRVUZETEZWQlFVRXNRMEZCUXl4SlFVRkhMRTlCUVVFc1VVRkJVU3hEUVVGRExFdEJRVWtzUTBGQlF5eEpRVUZKTEVWQlFVVXNRMEZCUXl4RFFVRkRMRWxCUVVrc1EwRkJReXhKUVVGSkxFTkJRVU1zUTBGQlF5eE5RVUZOTEVOQlFVTXNVVUZCVVN4RFFVRkRMRVZCUVdwRUxFTkJRV2xFTEVOQlFVTXNRMEZCUXp0SlFVTjBSaXhEUVVGRE8wbEJSVTBzTkVKQlFVMHNSMEZCWWl4VlFVRmpMRWRCUVU4c1JVRkJSU3hSUVVGUk8xRkJRek5DTEU5QlFVOHNTVUZCU1N4RFFVRkRMRXRCUVVzc1EwRkJReXhKUVVGSkxGZEJRVmNzUTBGQlNTeEhRVUZITEVOQlFVTXNSVUZCUlN4UlFVRlJMRU5CUVVNc1EwRkJRenRKUVVONlJDeERRVUZETzBsQlJVMHNNa0pCUVVzc1IwRkJXaXhWUVVGaExFdEJRWEZDTEVWQlFVVXNVVUZCVVR0UlFVTjRReXhKUVVGSkxFbEJRVWtzUTBGQlF5eExRVUZMTEVWQlFVVTdXVUZCUlN4UFFVRlBMRXRCUVVzc1EwRkJRenRoUVVNeFFpeEpRVUZKTEV0QlFVc3NRMEZCUXl4TFFVRkxMRVZCUVVVN1dVRkJSU3hQUVVGUExFbEJRVWtzUTBGQlF6dGhRVU12UWl4SlFVRkpMRkZCUVZFc1EwRkJReXhKUVVGSkxFTkJRVU1zU1VGQlNTeEZRVUZGTEV0QlFVc3NRMEZCUXl4SlFVRkpMRU5CUVVNc1JVRkJSVHRaUVVOMFF5eEpRVUZKTEVOQlFVTXNVVUZCVVN4RFFVRkRMRWxCUVVrc1EwRkJReXhMUVVGTExFTkJRVU1zUTBGQlF6dFpRVU14UWl4UFFVRlBMRWxCUVVrc1EwRkJRenRUUVVObU8yRkJRVTA3V1VGRFNDeExRVUZMTEVOQlFVTXNVVUZCVVN4RFFVRkRMRWxCUVVrc1EwRkJReXhKUVVGSkxFTkJRVU1zUTBGQlF6dFpRVU14UWl4UFFVRlBMRXRCUVVzc1EwRkJRenRUUVVOb1FqdEpRVU5NTEVOQlFVTTdTVUZGVFN3clFrRkJVeXhIUVVGb1FpeFZRVUZwUWl4UlFVRnBRenRSUVVNNVF5eEpRVUZKTEVsQlFVa3NRMEZCUXl4TFFVRkxMRVZCUVVVN1dVRkJSU3hQUVVGUExFbEJRVWtzUTBGQlF6czdXVUZEZWtJc1QwRkJUeXhKUVVGSkxFTkJRVU1zVlVGQlZTeERRVUZETEZGQlFWRXNRMEZCUXl4RFFVRkRPMGxCUXpGRExFTkJRVU03U1VGRlRTeG5RMEZCVlN4SFFVRnFRaXhWUVVGclFpeFJRVUZwUXp0UlFVTXZReXhKUVVGSkxFbEJRVWtzUTBGQlF5eFJRVUZSTEVOQlFVTXNUVUZCVFN4SlFVRkpMRU5CUVVNN1dVRkJSU3hQUVVGUExFbEJRVWtzVjBGQlZ5eERRVUZKTEVsQlFVa3NRMEZCUXl4RFFVRkRPMkZCUXpGRUxFbEJRVWtzU1VGQlNTeERRVUZETEZGQlFWRXNRMEZCUXl4TlFVRk5MRWxCUVVrc1EwRkJReXhGUVVGRk8xbEJRVVVzVDBGQlR5eEpRVUZKTEVOQlFVTXNVVUZCVVN4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRE8xTkJRVVU3WVVGRE0wUTdXVUZEUkN4SlFVRkpMRk5CUVZNc1IwRkJSeXhKUVVGSkxFTkJRVU1zVVVGQlVTeERRVUZETEVkQlFVY3NSVUZCUlN4RFFVRkRMRXRCUVVzc1EwRkJReXhKUVVGSkxFTkJRVU1zVVVGQlVTeERRVUZETEVkQlFVY3NSVUZCUlN4RlFVRkZMRkZCUVZFc1EwRkJReXhEUVVGRE8xbEJRM3BGTEVsQlFVa3NVMEZCVXl4SFFVRkhMRWxCUVVrc1EwRkJReXhWUVVGVkxFTkJRVU1zVVVGQlVTeERRVUZETEVOQlFVTTdXVUZETVVNc1QwRkJUeXhUUVVGVExFTkJRVU1zUzBGQlN5eERRVUZETEZOQlFWTXNSVUZCUlN4UlFVRlJMRU5CUVVNc1EwRkJRenRUUVVNdlF6dEpRVU5NTEVOQlFVTTdTVUZEVFN4cFEwRkJWeXhIUVVGc1FpeFZRVUZ0UWl4UFFVRjFRaXhGUVVGRkxGRkJRVmNzUlVGQlJTeFhRVUUwUXl4RlFVRkZMRkZCUVdsRE8xRkJRM0JKTEVsQlFVa3NUMEZCVHl4SFFVRkhMRTlCUVU4c1EwRkJReXhUUVVGVExFTkJRVU1zVVVGQlVTeERRVUZETEVOQlFVTTdVVUZGTVVNc1QwRkJUeXhEUVVGRExFbEJRVWtzUjBGQlJ5eFBRVUZQTEVOQlFVTXNTVUZCU1N4RFFVRkRPMUZCUXpWQ0xFOUJRVThzUTBGQlF5eFJRVUZSTEVkQlFVY3NUMEZCVHl4RFFVRkRMRkZCUVZFc1EwRkJRenRSUVVOd1F5eEpRVUZKTEZkQlFWY3NTMEZCU3l4SlFVRkpMRWxCUVVrc1QwRkJUeXhEUVVGRExFbEJRVWtzUzBGQlN5eEpRVUZKTEVWQlFVVTdXVUZETDBNc1YwRkJWeXhEUVVGRExFOUJRVThzUTBGQlF5eEpRVUZKTEVWQlFVVXNUMEZCVHl4RFFVRkRMRU5CUVVNN1UwRkRkRU03VVVGRFJDeEpRVUZKTEZkQlFWY3NSMEZCUnl4SlFVRkpMRmRCUVZjc1EwRkJReXhSUVVGUkxFTkJRVU1zUTBGQlF6dFJRVU0xUXl4SlFVRkpMRmRCUVZjc1MwRkJTeXhKUVVGSkxFVkJRVVU3V1VGRGRFSXNWMEZCVnl4RFFVRkRMRkZCUVZFc1JVRkJSU3hYUVVGWExFTkJRVU1zUTBGQlF6dFRRVU4wUXp0UlFVTkVMRTlCUVU4c1NVRkJTU3hEUVVGRExFdEJRVXNzUTBGQlF5eFhRVUZYTEVWQlFVVXNVVUZCVVN4RFFVRkRMRU5CUVVNN1NVRkROME1zUTBGQlF6dEpRVU5NTEd0Q1FVRkRPMEZCUVVRc1EwRkJReXhCUVhwSFJDeEpRWGxIUXp0QlFYcEhXU3hyUTBGQlZ6dEJRVGhIZUVJN1NVRkZTU3gxUWtGQmIwSXNVVUZCYVVNN1VVRkJha01zWVVGQlVTeEhRVUZTTEZGQlFWRXNRMEZCZVVJN1NVRkJTU3hEUVVGRE8wbEJTMjVFTERKQ1FVRkhMRWRCUVZZN1VVRkRTU3hKUVVGSkxFbEJRVWtzUTBGQlF5eExRVUZMTEVWQlFVVXNSVUZCUlR0WlFVRkZMRTlCUVU4c1NVRkJTU3hEUVVGRE8xTkJRVVU3VVVGRGJFTXNUMEZCVHl4SlFVRkpMRU5CUVVNc1NVRkJTU3hEUVVGRExFbEJRVWtzUTBGQlF6dEpRVU14UWl4RFFVRkRPMGxCUzAwc05FSkJRVWtzUjBGQldEdFJRVUZaTEdOQlFWazdZVUZCV2l4VlFVRlpMRVZCUVZvc2NVSkJRVmtzUlVGQldpeEpRVUZaTzFsQlFWb3NlVUpCUVZrN08xRkJRM0JDTEVsQlFVa3NWMEZCVnl4RFFVRkRPMUZCUTJoQ0xFdEJRVXNzU1VGQlNTeERRVUZETEVkQlFVY3NRMEZCUXl4RlFVRkZMRWRCUVVjc1JVRkJSU3hIUVVGSExFZEJRVU1zU1VGQlNTeERRVUZETEVOQlFVTXNRMEZCUXl4RlFVRkZMRVZCUVVVc1EwRkJReXhGUVVGRk8xbEJRMjVETEZkQlFWY3NSMEZCUnl4SlFVRkpMRmRCUVZjc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF6dFpRVU51UXl4SlFVRkpMRU5CUVVNc1NVRkJTU3hIUVVGSExFbEJRVWtzUTBGQlF5eExRVUZMTEVWQlFVVXNRMEZCUXl4RFFVRkRPMmRDUVVOMFFpeFhRVUZYTEVOQlFVTXNRMEZCUXl4RFFVRkRMRWxCUVVrc1EwRkJReXhKUVVGSkxFTkJRVU1zUzBGQlN5eERRVUZETEZkQlFWY3NSVUZCUlN4SlFVRkpMRU5CUVVNc1VVRkJVU3hEUVVGRExFTkJRVU03VTBGRGFrVTdVVUZEUkN4UFFVRlBMRmRCUVZjc1EwRkJRenRKUVVOMlFpeERRVUZETzBsQlMwMHNOa0pCUVVzc1IwRkJXanRSUVVOSkxFOUJRVThzUTBGQlF5eEpRVUZKTEVOQlFVTXNTVUZCU1N4SlFVRkpMRU5CUVVNc1NVRkJTU3hEUVVGRExFbEJRVWtzUTBGQlF5eEpRVUZKTEVOQlFVTTdTVUZEZWtNc1EwRkJRenRKUVV0TkxEaENRVUZOTEVkQlFXSTdVVUZEU1N4UFFVRlBMRWxCUVVrc1EwRkJReXhKUVVGSkxFTkJRVU1zVFVGQlRTeERRVUZETEVsQlFVa3NRMEZCUXl4UlFVRlJMRU5CUVVNc1EwRkJRenRKUVVNelF5eERRVUZETzBsQlMwMHNLMEpCUVU4c1IwRkJaQ3hWUVVGbExFTkJRVU03VVVGRFdpeEpRVUZKTEVOQlFVTXNTVUZCU1N4RFFVRkRMRTlCUVU4c1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dEpRVU42UWl4RFFVRkRPMGxCU1Uwc01rSkJRVWNzUjBGQlZqdFJRVU5KTEVsQlFVa3NTVUZCU1N4RFFVRkRMRXRCUVVzc1JVRkJSU3hGUVVGRk8xbEJRMlFzVDBGQlR5eEpRVUZKTEVOQlFVTTdVMEZEWmp0UlFVTkVMRWxCUVVrc1IwRkJSeXhIUVVGSExFbEJRVWtzUTBGQlF5eEpRVUZKTEVOQlFVTXNSMEZCUnl4RlFVRkZMRU5CUVVNN1VVRkRNVUlzU1VGQlNTeERRVUZETEVsQlFVa3NSMEZCUnl4SlFVRkpMRU5CUVVNc1NVRkJTU3hEUVVGRExGTkJRVk1zUTBGQlF5eEpRVUZKTEVOQlFVTXNVVUZCVVN4RFFVRkRMRU5CUVVNN1VVRkRMME1zVDBGQlR5eEhRVUZITEVOQlFVTTdTVUZEWml4RFFVRkRPMGxCU1Uwc2FVTkJRVk1zUjBGQmFFSXNWVUZCYVVJc1VVRkJkMElzUlVGQlJTeE5RVUZUTEVWQlFVVXNWMEZCYlVRN1VVRkJia1FzTkVKQlFVRXNSVUZCUVN4clFrRkJiVVE3VVVGRGNrY3NTVUZCU1N4RFFVRkRMRWxCUVVrc1IwRkJSeXhKUVVGSkxFTkJRVU1zU1VGQlNTeERRVUZETEZkQlFWY3NRMEZCUXl4UlFVRlJMRVZCUVVVc1RVRkJUU3hGUVVGRkxGZEJRVmNzUlVGQlJTeEpRVUZKTEVOQlFVTXNVVUZCVVN4RFFVRkRMRU5CUVVNN1NVRkRjRVlzUTBGQlF6dEpRVU5OTEdkRFFVRlJMRWRCUVdZc1ZVRkJaMElzVVVGQlVUdFJRVU53UWl4UFFVRlBMRWxCUVVrc1EwRkJReXhKUVVGSkxFTkJRVU1zVVVGQlVTeERRVUZETEZGQlFWRXNRMEZCUXl4RFFVRkRPMGxCUTNoRExFTkJRVU03U1VGTFRTdzJRa0ZCU3l4SFFVRmFPMUZCUTBrc1QwRkJUeXhKUVVGSkxFTkJRVU1zU1VGQlNTeERRVUZETEV0QlFVc3NSVUZCUlN4RFFVRkRPMGxCUXpkQ0xFTkJRVU03U1VGRFRDeHZRa0ZCUXp0QlFVRkVMRU5CUVVNc1FVRjRSVVFzU1VGM1JVTTdRVUY0UlZrc2MwTkJRV0VpZlE9PSIsIlwidXNlIHN0cmljdFwiO1xudmFyIF9fZXh0ZW5kcyA9ICh0aGlzICYmIHRoaXMuX19leHRlbmRzKSB8fCAoZnVuY3Rpb24gKCkge1xuICAgIHZhciBleHRlbmRTdGF0aWNzID0gZnVuY3Rpb24gKGQsIGIpIHtcbiAgICAgICAgZXh0ZW5kU3RhdGljcyA9IE9iamVjdC5zZXRQcm90b3R5cGVPZiB8fFxuICAgICAgICAgICAgKHsgX19wcm90b19fOiBbXSB9IGluc3RhbmNlb2YgQXJyYXkgJiYgZnVuY3Rpb24gKGQsIGIpIHsgZC5fX3Byb3RvX18gPSBiOyB9KSB8fFxuICAgICAgICAgICAgZnVuY3Rpb24gKGQsIGIpIHsgZm9yICh2YXIgcCBpbiBiKSBpZiAoYi5oYXNPd25Qcm9wZXJ0eShwKSkgZFtwXSA9IGJbcF07IH07XG4gICAgICAgIHJldHVybiBleHRlbmRTdGF0aWNzKGQsIGIpO1xuICAgIH07XG4gICAgcmV0dXJuIGZ1bmN0aW9uIChkLCBiKSB7XG4gICAgICAgIGV4dGVuZFN0YXRpY3MoZCwgYik7XG4gICAgICAgIGZ1bmN0aW9uIF9fKCkgeyB0aGlzLmNvbnN0cnVjdG9yID0gZDsgfVxuICAgICAgICBkLnByb3RvdHlwZSA9IGIgPT09IG51bGwgPyBPYmplY3QuY3JlYXRlKGIpIDogKF9fLnByb3RvdHlwZSA9IGIucHJvdG90eXBlLCBuZXcgX18oKSk7XG4gICAgfTtcbn0pKCk7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgVHJlZUJhc2UgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIFRyZWVCYXNlKCkge1xuICAgICAgICB0aGlzLmZpbmRJdGVyID0gZnVuY3Rpb24gKGRhdGEpIHtcbiAgICAgICAgICAgIHZhciByZXMgPSB0aGlzLl9yb290O1xuICAgICAgICAgICAgdmFyIGl0ZXIgPSB0aGlzLml0ZXJhdG9yKCk7XG4gICAgICAgICAgICB3aGlsZSAocmVzICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgdmFyIGMgPSB0aGlzLl9jb21wYXJhdG9yKGRhdGEsIHJlcy5kYXRhKTtcbiAgICAgICAgICAgICAgICBpZiAoYyA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICBpdGVyLl9jdXJzb3IgPSByZXM7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBpdGVyO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgaXRlci5fYW5jZXN0b3JzLnB1c2gocmVzKTtcbiAgICAgICAgICAgICAgICAgICAgcmVzID0gcmVzLmdldF9jaGlsZChjID4gMCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH07XG4gICAgfVxuICAgIFRyZWVCYXNlLnByb3RvdHlwZS5jbGVhciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5fcm9vdCA9IG51bGw7XG4gICAgICAgIHRoaXMuc2l6ZSA9IDA7XG4gICAgfTtcbiAgICA7XG4gICAgVHJlZUJhc2UucHJvdG90eXBlLmZpbmQgPSBmdW5jdGlvbiAoZGF0YSkge1xuICAgICAgICB2YXIgcmVzID0gdGhpcy5fcm9vdDtcbiAgICAgICAgd2hpbGUgKHJlcyAhPT0gbnVsbCkge1xuICAgICAgICAgICAgdmFyIGMgPSB0aGlzLl9jb21wYXJhdG9yKGRhdGEsIHJlcy5kYXRhKTtcbiAgICAgICAgICAgIGlmIChjID09PSAwKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlcy5kYXRhO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgcmVzID0gcmVzLmdldF9jaGlsZChjID4gMCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfTtcbiAgICA7XG4gICAgVHJlZUJhc2UucHJvdG90eXBlLmxvd2VyQm91bmQgPSBmdW5jdGlvbiAoZGF0YSkge1xuICAgICAgICByZXR1cm4gdGhpcy5fYm91bmQoZGF0YSwgdGhpcy5fY29tcGFyYXRvcik7XG4gICAgfTtcbiAgICA7XG4gICAgVHJlZUJhc2UucHJvdG90eXBlLnVwcGVyQm91bmQgPSBmdW5jdGlvbiAoZGF0YSkge1xuICAgICAgICB2YXIgY21wID0gdGhpcy5fY29tcGFyYXRvcjtcbiAgICAgICAgZnVuY3Rpb24gcmV2ZXJzZV9jbXAoYSwgYikge1xuICAgICAgICAgICAgcmV0dXJuIGNtcChiLCBhKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcy5fYm91bmQoZGF0YSwgcmV2ZXJzZV9jbXApO1xuICAgIH07XG4gICAgO1xuICAgIFRyZWVCYXNlLnByb3RvdHlwZS5taW4gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciByZXMgPSB0aGlzLl9yb290O1xuICAgICAgICBpZiAocmVzID09PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICB3aGlsZSAocmVzLmxlZnQgIT09IG51bGwpIHtcbiAgICAgICAgICAgIHJlcyA9IHJlcy5sZWZ0O1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXMuZGF0YTtcbiAgICB9O1xuICAgIDtcbiAgICBUcmVlQmFzZS5wcm90b3R5cGUubWF4ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgcmVzID0gdGhpcy5fcm9vdDtcbiAgICAgICAgaWYgKHJlcyA9PT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgd2hpbGUgKHJlcy5yaWdodCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgcmVzID0gcmVzLnJpZ2h0O1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXMuZGF0YTtcbiAgICB9O1xuICAgIDtcbiAgICBUcmVlQmFzZS5wcm90b3R5cGUuaXRlcmF0b3IgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBuZXcgSXRlcmF0b3IodGhpcyk7XG4gICAgfTtcbiAgICA7XG4gICAgVHJlZUJhc2UucHJvdG90eXBlLmVhY2ggPSBmdW5jdGlvbiAoY2IpIHtcbiAgICAgICAgdmFyIGl0ID0gdGhpcy5pdGVyYXRvcigpLCBkYXRhO1xuICAgICAgICB3aGlsZSAoKGRhdGEgPSBpdC5uZXh0KCkpICE9PSBudWxsKSB7XG4gICAgICAgICAgICBjYihkYXRhKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgO1xuICAgIFRyZWVCYXNlLnByb3RvdHlwZS5yZWFjaCA9IGZ1bmN0aW9uIChjYikge1xuICAgICAgICB2YXIgaXQgPSB0aGlzLml0ZXJhdG9yKCksIGRhdGE7XG4gICAgICAgIHdoaWxlICgoZGF0YSA9IGl0LnByZXYoKSkgIT09IG51bGwpIHtcbiAgICAgICAgICAgIGNiKGRhdGEpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICA7XG4gICAgVHJlZUJhc2UucHJvdG90eXBlLl9ib3VuZCA9IGZ1bmN0aW9uIChkYXRhLCBjbXApIHtcbiAgICAgICAgdmFyIGN1ciA9IHRoaXMuX3Jvb3Q7XG4gICAgICAgIHZhciBpdGVyID0gdGhpcy5pdGVyYXRvcigpO1xuICAgICAgICB3aGlsZSAoY3VyICE9PSBudWxsKSB7XG4gICAgICAgICAgICB2YXIgYyA9IHRoaXMuX2NvbXBhcmF0b3IoZGF0YSwgY3VyLmRhdGEpO1xuICAgICAgICAgICAgaWYgKGMgPT09IDApIHtcbiAgICAgICAgICAgICAgICBpdGVyLl9jdXJzb3IgPSBjdXI7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGl0ZXI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpdGVyLl9hbmNlc3RvcnMucHVzaChjdXIpO1xuICAgICAgICAgICAgY3VyID0gY3VyLmdldF9jaGlsZChjID4gMCk7XG4gICAgICAgIH1cbiAgICAgICAgZm9yICh2YXIgaSA9IGl0ZXIuX2FuY2VzdG9ycy5sZW5ndGggLSAxOyBpID49IDA7IC0taSkge1xuICAgICAgICAgICAgY3VyID0gaXRlci5fYW5jZXN0b3JzW2ldO1xuICAgICAgICAgICAgaWYgKGNtcChkYXRhLCBjdXIuZGF0YSkgPiAwKSB7XG4gICAgICAgICAgICAgICAgaXRlci5fY3Vyc29yID0gY3VyO1xuICAgICAgICAgICAgICAgIGl0ZXIuX2FuY2VzdG9ycy5sZW5ndGggPSBpO1xuICAgICAgICAgICAgICAgIHJldHVybiBpdGVyO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGl0ZXIuX2FuY2VzdG9ycy5sZW5ndGggPSAwO1xuICAgICAgICByZXR1cm4gaXRlcjtcbiAgICB9O1xuICAgIDtcbiAgICByZXR1cm4gVHJlZUJhc2U7XG59KCkpO1xuZXhwb3J0cy5UcmVlQmFzZSA9IFRyZWVCYXNlO1xudmFyIEl0ZXJhdG9yID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBJdGVyYXRvcih0cmVlKSB7XG4gICAgICAgIHRoaXMuX3RyZWUgPSB0cmVlO1xuICAgICAgICB0aGlzLl9hbmNlc3RvcnMgPSBbXTtcbiAgICAgICAgdGhpcy5fY3Vyc29yID0gbnVsbDtcbiAgICB9XG4gICAgSXRlcmF0b3IucHJvdG90eXBlLmRhdGEgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9jdXJzb3IgIT09IG51bGwgPyB0aGlzLl9jdXJzb3IuZGF0YSA6IG51bGw7XG4gICAgfTtcbiAgICA7XG4gICAgSXRlcmF0b3IucHJvdG90eXBlLm5leHQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICh0aGlzLl9jdXJzb3IgPT09IG51bGwpIHtcbiAgICAgICAgICAgIHZhciByb290ID0gdGhpcy5fdHJlZS5fcm9vdDtcbiAgICAgICAgICAgIGlmIChyb290ICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fbWluTm9kZShyb290KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGlmICh0aGlzLl9jdXJzb3IucmlnaHQgPT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICB2YXIgc2F2ZTtcbiAgICAgICAgICAgICAgICBkbyB7XG4gICAgICAgICAgICAgICAgICAgIHNhdmUgPSB0aGlzLl9jdXJzb3I7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLl9hbmNlc3RvcnMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9jdXJzb3IgPSB0aGlzLl9hbmNlc3RvcnMucG9wKCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9jdXJzb3IgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IHdoaWxlICh0aGlzLl9jdXJzb3IucmlnaHQgPT09IHNhdmUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fYW5jZXN0b3JzLnB1c2godGhpcy5fY3Vyc29yKTtcbiAgICAgICAgICAgICAgICB0aGlzLl9taW5Ob2RlKHRoaXMuX2N1cnNvci5yaWdodCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMuX2N1cnNvciAhPT0gbnVsbCA/IHRoaXMuX2N1cnNvci5kYXRhIDogbnVsbDtcbiAgICB9O1xuICAgIDtcbiAgICBJdGVyYXRvci5wcm90b3R5cGUucHJldiA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKHRoaXMuX2N1cnNvciA9PT0gbnVsbCkge1xuICAgICAgICAgICAgdmFyIHJvb3QgPSB0aGlzLl90cmVlLl9yb290O1xuICAgICAgICAgICAgaWYgKHJvb3QgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9tYXhOb2RlKHJvb3QpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgaWYgKHRoaXMuX2N1cnNvci5sZWZ0ID09PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgdmFyIHNhdmU7XG4gICAgICAgICAgICAgICAgZG8ge1xuICAgICAgICAgICAgICAgICAgICBzYXZlID0gdGhpcy5fY3Vyc29yO1xuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5fYW5jZXN0b3JzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fY3Vyc29yID0gdGhpcy5fYW5jZXN0b3JzLnBvcCgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fY3Vyc29yID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSB3aGlsZSAodGhpcy5fY3Vyc29yLmxlZnQgPT09IHNhdmUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fYW5jZXN0b3JzLnB1c2godGhpcy5fY3Vyc29yKTtcbiAgICAgICAgICAgICAgICB0aGlzLl9tYXhOb2RlKHRoaXMuX2N1cnNvci5sZWZ0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcy5fY3Vyc29yICE9PSBudWxsID8gdGhpcy5fY3Vyc29yLmRhdGEgOiBudWxsO1xuICAgIH07XG4gICAgO1xuICAgIEl0ZXJhdG9yLnByb3RvdHlwZS5fbWluTm9kZSA9IGZ1bmN0aW9uIChzdGFydCkge1xuICAgICAgICB3aGlsZSAoc3RhcnQubGVmdCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgdGhpcy5fYW5jZXN0b3JzLnB1c2goc3RhcnQpO1xuICAgICAgICAgICAgc3RhcnQgPSBzdGFydC5sZWZ0O1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX2N1cnNvciA9IHN0YXJ0O1xuICAgIH07XG4gICAgO1xuICAgIEl0ZXJhdG9yLnByb3RvdHlwZS5fbWF4Tm9kZSA9IGZ1bmN0aW9uIChzdGFydCkge1xuICAgICAgICB3aGlsZSAoc3RhcnQucmlnaHQgIT09IG51bGwpIHtcbiAgICAgICAgICAgIHRoaXMuX2FuY2VzdG9ycy5wdXNoKHN0YXJ0KTtcbiAgICAgICAgICAgIHN0YXJ0ID0gc3RhcnQucmlnaHQ7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fY3Vyc29yID0gc3RhcnQ7XG4gICAgfTtcbiAgICA7XG4gICAgcmV0dXJuIEl0ZXJhdG9yO1xufSgpKTtcbmV4cG9ydHMuSXRlcmF0b3IgPSBJdGVyYXRvcjtcbnZhciBOb2RlID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBOb2RlKGRhdGEpIHtcbiAgICAgICAgdGhpcy5kYXRhID0gZGF0YTtcbiAgICAgICAgdGhpcy5sZWZ0ID0gbnVsbDtcbiAgICAgICAgdGhpcy5yaWdodCA9IG51bGw7XG4gICAgICAgIHRoaXMucmVkID0gdHJ1ZTtcbiAgICB9XG4gICAgTm9kZS5wcm90b3R5cGUuZ2V0X2NoaWxkID0gZnVuY3Rpb24gKGRpcikge1xuICAgICAgICByZXR1cm4gZGlyID8gdGhpcy5yaWdodCA6IHRoaXMubGVmdDtcbiAgICB9O1xuICAgIDtcbiAgICBOb2RlLnByb3RvdHlwZS5zZXRfY2hpbGQgPSBmdW5jdGlvbiAoZGlyLCB2YWwpIHtcbiAgICAgICAgaWYgKGRpcikge1xuICAgICAgICAgICAgdGhpcy5yaWdodCA9IHZhbDtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMubGVmdCA9IHZhbDtcbiAgICAgICAgfVxuICAgIH07XG4gICAgO1xuICAgIHJldHVybiBOb2RlO1xufSgpKTtcbnZhciBSQlRyZWUgPSAoZnVuY3Rpb24gKF9zdXBlcikge1xuICAgIF9fZXh0ZW5kcyhSQlRyZWUsIF9zdXBlcik7XG4gICAgZnVuY3Rpb24gUkJUcmVlKGNvbXBhcmF0b3IpIHtcbiAgICAgICAgdmFyIF90aGlzID0gX3N1cGVyLmNhbGwodGhpcykgfHwgdGhpcztcbiAgICAgICAgX3RoaXMuX3Jvb3QgPSBudWxsO1xuICAgICAgICBfdGhpcy5fY29tcGFyYXRvciA9IGNvbXBhcmF0b3I7XG4gICAgICAgIF90aGlzLnNpemUgPSAwO1xuICAgICAgICByZXR1cm4gX3RoaXM7XG4gICAgfVxuICAgIFJCVHJlZS5wcm90b3R5cGUuaW5zZXJ0ID0gZnVuY3Rpb24gKGRhdGEpIHtcbiAgICAgICAgdmFyIHJldCA9IGZhbHNlO1xuICAgICAgICBpZiAodGhpcy5fcm9vdCA9PT0gbnVsbCkge1xuICAgICAgICAgICAgdGhpcy5fcm9vdCA9IG5ldyBOb2RlKGRhdGEpO1xuICAgICAgICAgICAgcmV0ID0gdHJ1ZTtcbiAgICAgICAgICAgIHRoaXMuc2l6ZSsrO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdmFyIGhlYWQgPSBuZXcgTm9kZSh1bmRlZmluZWQpO1xuICAgICAgICAgICAgdmFyIGRpciA9IGZhbHNlO1xuICAgICAgICAgICAgdmFyIGxhc3QgPSBmYWxzZTtcbiAgICAgICAgICAgIHZhciBncCA9IG51bGw7XG4gICAgICAgICAgICB2YXIgZ2dwID0gaGVhZDtcbiAgICAgICAgICAgIHZhciBwID0gbnVsbDtcbiAgICAgICAgICAgIHZhciBub2RlID0gdGhpcy5fcm9vdDtcbiAgICAgICAgICAgIGdncC5yaWdodCA9IHRoaXMuX3Jvb3Q7XG4gICAgICAgICAgICB3aGlsZSAodHJ1ZSkge1xuICAgICAgICAgICAgICAgIGlmIChub2RlID09PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIG5vZGUgPSBuZXcgTm9kZShkYXRhKTtcbiAgICAgICAgICAgICAgICAgICAgcC5zZXRfY2hpbGQoZGlyLCBub2RlKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zaXplKys7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKFJCVHJlZS5pc19yZWQobm9kZS5sZWZ0KSAmJiBSQlRyZWUuaXNfcmVkKG5vZGUucmlnaHQpKSB7XG4gICAgICAgICAgICAgICAgICAgIG5vZGUucmVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgbm9kZS5sZWZ0LnJlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICBub2RlLnJpZ2h0LnJlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoUkJUcmVlLmlzX3JlZChub2RlKSAmJiBSQlRyZWUuaXNfcmVkKHApKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBkaXIyID0gZ2dwLnJpZ2h0ID09PSBncDtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG5vZGUgPT09IHAuZ2V0X2NoaWxkKGxhc3QpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBnZ3Auc2V0X2NoaWxkKGRpcjIsIFJCVHJlZS5zaW5nbGVfcm90YXRlKGdwLCAhbGFzdCkpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgZ2dwLnNldF9jaGlsZChkaXIyLCBSQlRyZWUuZG91YmxlX3JvdGF0ZShncCwgIWxhc3QpKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB2YXIgY21wID0gdGhpcy5fY29tcGFyYXRvcihub2RlLmRhdGEsIGRhdGEpO1xuICAgICAgICAgICAgICAgIGlmIChjbXAgPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGxhc3QgPSBkaXI7XG4gICAgICAgICAgICAgICAgZGlyID0gY21wIDwgMDtcbiAgICAgICAgICAgICAgICBpZiAoZ3AgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgZ2dwID0gZ3A7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGdwID0gcDtcbiAgICAgICAgICAgICAgICBwID0gbm9kZTtcbiAgICAgICAgICAgICAgICBub2RlID0gbm9kZS5nZXRfY2hpbGQoZGlyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuX3Jvb3QgPSBoZWFkLnJpZ2h0O1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX3Jvb3QucmVkID0gZmFsc2U7XG4gICAgICAgIHJldHVybiByZXQ7XG4gICAgfTtcbiAgICA7XG4gICAgUkJUcmVlLnByb3RvdHlwZS5yZW1vdmUgPSBmdW5jdGlvbiAoZGF0YSkge1xuICAgICAgICBpZiAodGhpcy5fcm9vdCA9PT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIHZhciBoZWFkID0gbmV3IE5vZGUodW5kZWZpbmVkKTtcbiAgICAgICAgdmFyIG5vZGUgPSBoZWFkO1xuICAgICAgICBub2RlLnJpZ2h0ID0gdGhpcy5fcm9vdDtcbiAgICAgICAgdmFyIHAgPSBudWxsO1xuICAgICAgICB2YXIgZ3AgPSBudWxsO1xuICAgICAgICB2YXIgZm91bmQgPSBudWxsO1xuICAgICAgICB2YXIgZGlyID0gdHJ1ZTtcbiAgICAgICAgd2hpbGUgKG5vZGUuZ2V0X2NoaWxkKGRpcikgIT09IG51bGwpIHtcbiAgICAgICAgICAgIHZhciBsYXN0ID0gZGlyO1xuICAgICAgICAgICAgZ3AgPSBwO1xuICAgICAgICAgICAgcCA9IG5vZGU7XG4gICAgICAgICAgICBub2RlID0gbm9kZS5nZXRfY2hpbGQoZGlyKTtcbiAgICAgICAgICAgIHZhciBjbXAgPSB0aGlzLl9jb21wYXJhdG9yKGRhdGEsIG5vZGUuZGF0YSk7XG4gICAgICAgICAgICBkaXIgPSBjbXAgPiAwO1xuICAgICAgICAgICAgaWYgKGNtcCA9PT0gMCkge1xuICAgICAgICAgICAgICAgIGZvdW5kID0gbm9kZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICghUkJUcmVlLmlzX3JlZChub2RlKSAmJiAhUkJUcmVlLmlzX3JlZChub2RlLmdldF9jaGlsZChkaXIpKSkge1xuICAgICAgICAgICAgICAgIGlmIChSQlRyZWUuaXNfcmVkKG5vZGUuZ2V0X2NoaWxkKCFkaXIpKSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgc3IgPSBSQlRyZWUuc2luZ2xlX3JvdGF0ZShub2RlLCBkaXIpO1xuICAgICAgICAgICAgICAgICAgICBwLnNldF9jaGlsZChsYXN0LCBzcik7XG4gICAgICAgICAgICAgICAgICAgIHAgPSBzcjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAoIVJCVHJlZS5pc19yZWQobm9kZS5nZXRfY2hpbGQoIWRpcikpKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBzaWJsaW5nID0gcC5nZXRfY2hpbGQoIWxhc3QpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoc2libGluZyAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFSQlRyZWUuaXNfcmVkKHNpYmxpbmcuZ2V0X2NoaWxkKCFsYXN0KSkgJiYgIVJCVHJlZS5pc19yZWQoc2libGluZy5nZXRfY2hpbGQobGFzdCkpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcC5yZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzaWJsaW5nLnJlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9kZS5yZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGRpcjIgPSBncC5yaWdodCA9PT0gcDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoUkJUcmVlLmlzX3JlZChzaWJsaW5nLmdldF9jaGlsZChsYXN0KSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZ3Auc2V0X2NoaWxkKGRpcjIsIFJCVHJlZS5kb3VibGVfcm90YXRlKHAsIGxhc3QpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoUkJUcmVlLmlzX3JlZChzaWJsaW5nLmdldF9jaGlsZCghbGFzdCkpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdwLnNldF9jaGlsZChkaXIyLCBSQlRyZWUuc2luZ2xlX3JvdGF0ZShwLCBsYXN0KSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBncGMgPSBncC5nZXRfY2hpbGQoZGlyMik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZ3BjLnJlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9kZS5yZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdwYy5sZWZ0LnJlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdwYy5yaWdodC5yZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoZm91bmQgIT09IG51bGwpIHtcbiAgICAgICAgICAgIGZvdW5kLmRhdGEgPSBub2RlLmRhdGE7XG4gICAgICAgICAgICBwLnNldF9jaGlsZChwLnJpZ2h0ID09PSBub2RlLCBub2RlLmdldF9jaGlsZChub2RlLmxlZnQgPT09IG51bGwpKTtcbiAgICAgICAgICAgIHRoaXMuc2l6ZS0tO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX3Jvb3QgPSBoZWFkLnJpZ2h0O1xuICAgICAgICBpZiAodGhpcy5fcm9vdCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgdGhpcy5fcm9vdC5yZWQgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZm91bmQgIT09IG51bGw7XG4gICAgfTtcbiAgICA7XG4gICAgUkJUcmVlLmlzX3JlZCA9IGZ1bmN0aW9uIChub2RlKSB7XG4gICAgICAgIHJldHVybiBub2RlICE9PSBudWxsICYmIG5vZGUucmVkO1xuICAgIH07XG4gICAgUkJUcmVlLnNpbmdsZV9yb3RhdGUgPSBmdW5jdGlvbiAocm9vdCwgZGlyKSB7XG4gICAgICAgIHZhciBzYXZlID0gcm9vdC5nZXRfY2hpbGQoIWRpcik7XG4gICAgICAgIHJvb3Quc2V0X2NoaWxkKCFkaXIsIHNhdmUuZ2V0X2NoaWxkKGRpcikpO1xuICAgICAgICBzYXZlLnNldF9jaGlsZChkaXIsIHJvb3QpO1xuICAgICAgICByb290LnJlZCA9IHRydWU7XG4gICAgICAgIHNhdmUucmVkID0gZmFsc2U7XG4gICAgICAgIHJldHVybiBzYXZlO1xuICAgIH07XG4gICAgUkJUcmVlLmRvdWJsZV9yb3RhdGUgPSBmdW5jdGlvbiAocm9vdCwgZGlyKSB7XG4gICAgICAgIHJvb3Quc2V0X2NoaWxkKCFkaXIsIFJCVHJlZS5zaW5nbGVfcm90YXRlKHJvb3QuZ2V0X2NoaWxkKCFkaXIpLCAhZGlyKSk7XG4gICAgICAgIHJldHVybiBSQlRyZWUuc2luZ2xlX3JvdGF0ZShyb290LCBkaXIpO1xuICAgIH07XG4gICAgcmV0dXJuIFJCVHJlZTtcbn0oVHJlZUJhc2UpKTtcbmV4cG9ydHMuUkJUcmVlID0gUkJUcmVlO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9ZGF0YTphcHBsaWNhdGlvbi9qc29uO2Jhc2U2NCxleUoyWlhKemFXOXVJam96TENKbWFXeGxJam9pY21KMGNtVmxMbXB6SWl3aWMyOTFjbU5sVW05dmRDSTZJaUlzSW5OdmRYSmpaWE1pT2xzaUxpNHZMaTR2VjJWaVEyOXNZUzl6Y21NdmNtSjBjbVZsTG5SeklsMHNJbTVoYldWeklqcGJYU3dpYldGd2NHbHVaM01pT2lJN096czdPenM3T3pzN096czdPenRCUVhWQ1NUdEpRVUZCTzFGQk5FSkpMR0ZCUVZFc1IwRkJSeXhWUVVGVkxFbEJRVWs3V1VGRGNrSXNTVUZCU1N4SFFVRkhMRWRCUVVjc1NVRkJTU3hEUVVGRExFdEJRVXNzUTBGQlF6dFpRVU55UWl4SlFVRkpMRWxCUVVrc1IwRkJSeXhKUVVGSkxFTkJRVU1zVVVGQlVTeEZRVUZGTEVOQlFVTTdXVUZGTTBJc1QwRkJUeXhIUVVGSExFdEJRVXNzU1VGQlNTeEZRVUZGTzJkQ1FVTnFRaXhKUVVGSkxFTkJRVU1zUjBGQlJ5eEpRVUZKTEVOQlFVTXNWMEZCVnl4RFFVRkRMRWxCUVVrc1JVRkJSU3hIUVVGSExFTkJRVU1zU1VGQlNTeERRVUZETEVOQlFVTTdaMEpCUTNwRExFbEJRVWtzUTBGQlF5eExRVUZMTEVOQlFVTXNSVUZCUlR0dlFrRkRWQ3hKUVVGSkxFTkJRVU1zVDBGQlR5eEhRVUZITEVkQlFVY3NRMEZCUXp0dlFrRkRia0lzVDBGQlR5eEpRVUZKTEVOQlFVTTdhVUpCUTJZN2NVSkJRMGs3YjBKQlEwUXNTVUZCU1N4RFFVRkRMRlZCUVZVc1EwRkJReXhKUVVGSkxFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTTdiMEpCUXpGQ0xFZEJRVWNzUjBGQlJ5eEhRVUZITEVOQlFVTXNVMEZCVXl4RFFVRkRMRU5CUVVNc1IwRkJSeXhEUVVGRExFTkJRVU1zUTBGQlF6dHBRa0ZET1VJN1lVRkRTanRaUVVWRUxFOUJRVThzU1VGQlNTeERRVUZETzFGQlEyaENMRU5CUVVNc1EwRkJRenRKUVN0R1RpeERRVUZETzBsQmRrbEhMSGRDUVVGTExFZEJRVXc3VVVGRFNTeEpRVUZKTEVOQlFVTXNTMEZCU3l4SFFVRkhMRWxCUVVrc1EwRkJRenRSUVVOc1FpeEpRVUZKTEVOQlFVTXNTVUZCU1N4SFFVRkhMRU5CUVVNc1EwRkJRenRKUVVOc1FpeERRVUZETzBsQlFVRXNRMEZCUXp0SlFVZEdMSFZDUVVGSkxFZEJRVW9zVlVGQlN5eEpRVUZKTzFGQlEwd3NTVUZCU1N4SFFVRkhMRWRCUVVjc1NVRkJTU3hEUVVGRExFdEJRVXNzUTBGQlF6dFJRVVZ5UWl4UFFVRlBMRWRCUVVjc1MwRkJTeXhKUVVGSkxFVkJRVVU3V1VGRGFrSXNTVUZCU1N4RFFVRkRMRWRCUVVjc1NVRkJTU3hEUVVGRExGZEJRVmNzUTBGQlF5eEpRVUZKTEVWQlFVVXNSMEZCUnl4RFFVRkRMRWxCUVVrc1EwRkJReXhEUVVGRE8xbEJRM3BETEVsQlFVa3NRMEZCUXl4TFFVRkxMRU5CUVVNc1JVRkJSVHRuUWtGRFZDeFBRVUZQTEVkQlFVY3NRMEZCUXl4SlFVRkpMRU5CUVVNN1lVRkRia0k3YVVKQlEwazdaMEpCUTBRc1IwRkJSeXhIUVVGSExFZEJRVWNzUTBGQlF5eFRRVUZUTEVOQlFVTXNRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJReXhEUVVGRE8yRkJRemxDTzFOQlEwbzdVVUZGUkN4UFFVRlBMRWxCUVVrc1EwRkJRenRKUVVOb1FpeERRVUZETzBsQlFVRXNRMEZCUXp0SlFYVkNSaXcyUWtGQlZTeEhRVUZXTEZWQlFWY3NTVUZCU1R0UlFVTllMRTlCUVU4c1NVRkJTU3hEUVVGRExFMUJRVTBzUTBGQlF5eEpRVUZKTEVWQlFVVXNTVUZCU1N4RFFVRkRMRmRCUVZjc1EwRkJReXhEUVVGRE8wbEJReTlETEVOQlFVTTdTVUZCUVN4RFFVRkRPMGxCUjBZc05rSkJRVlVzUjBGQlZpeFZRVUZYTEVsQlFVazdVVUZEV0N4SlFVRkpMRWRCUVVjc1IwRkJSeXhKUVVGSkxFTkJRVU1zVjBGQlZ5eERRVUZETzFGQlJUTkNMRk5CUVZNc1YwRkJWeXhEUVVGRExFTkJRVU1zUlVGQlJTeERRVUZETzFsQlEzSkNMRTlCUVU4c1IwRkJSeXhEUVVGRExFTkJRVU1zUlVGQlJTeERRVUZETEVOQlFVTXNRMEZCUXp0UlFVTnlRaXhEUVVGRE8xRkJSVVFzVDBGQlR5eEpRVUZKTEVOQlFVTXNUVUZCVFN4RFFVRkRMRWxCUVVrc1JVRkJSU3hYUVVGWExFTkJRVU1zUTBGQlF6dEpRVU14UXl4RFFVRkRPMGxCUVVFc1EwRkJRenRKUVVkR0xITkNRVUZITEVkQlFVZzdVVUZEU1N4SlFVRkpMRWRCUVVjc1IwRkJSeXhKUVVGSkxFTkJRVU1zUzBGQlN5eERRVUZETzFGQlEzSkNMRWxCUVVrc1IwRkJSeXhMUVVGTExFbEJRVWtzUlVGQlJUdFpRVU5rTEU5QlFVOHNTVUZCU1N4RFFVRkRPMU5CUTJZN1VVRkZSQ3hQUVVGUExFZEJRVWNzUTBGQlF5eEpRVUZKTEV0QlFVc3NTVUZCU1N4RlFVRkZPMWxCUTNSQ0xFZEJRVWNzUjBGQlJ5eEhRVUZITEVOQlFVTXNTVUZCU1N4RFFVRkRPMU5CUTJ4Q08xRkJSVVFzVDBGQlR5eEhRVUZITEVOQlFVTXNTVUZCU1N4RFFVRkRPMGxCUTNCQ0xFTkJRVU03U1VGQlFTeERRVUZETzBsQlIwWXNjMEpCUVVjc1IwRkJTRHRSUVVOSkxFbEJRVWtzUjBGQlJ5eEhRVUZITEVsQlFVa3NRMEZCUXl4TFFVRkxMRU5CUVVNN1VVRkRja0lzU1VGQlNTeEhRVUZITEV0QlFVc3NTVUZCU1N4RlFVRkZPMWxCUTJRc1QwRkJUeXhKUVVGSkxFTkJRVU03VTBGRFpqdFJRVVZFTEU5QlFVOHNSMEZCUnl4RFFVRkRMRXRCUVVzc1MwRkJTeXhKUVVGSkxFVkJRVVU3V1VGRGRrSXNSMEZCUnl4SFFVRkhMRWRCUVVjc1EwRkJReXhMUVVGTExFTkJRVU03VTBGRGJrSTdVVUZGUkN4UFFVRlBMRWRCUVVjc1EwRkJReXhKUVVGSkxFTkJRVU03U1VGRGNFSXNRMEZCUXp0SlFVRkJMRU5CUVVNN1NVRkpSaXd5UWtGQlVTeEhRVUZTTzFGQlEwa3NUMEZCVHl4SlFVRkpMRkZCUVZFc1EwRkJReXhKUVVGSkxFTkJRVU1zUTBGQlF6dEpRVU01UWl4RFFVRkRPMGxCUVVFc1EwRkJRenRKUVVkR0xIVkNRVUZKTEVkQlFVb3NWVUZCU3l4RlFVRkZPMUZCUTBnc1NVRkJTU3hGUVVGRkxFZEJRVWNzU1VGQlNTeERRVUZETEZGQlFWRXNSVUZCUlN4RlFVRkZMRWxCUVVrc1EwRkJRenRSUVVNdlFpeFBRVUZQTEVOQlFVTXNTVUZCU1N4SFFVRkhMRVZCUVVVc1EwRkJReXhKUVVGSkxFVkJRVVVzUTBGQlF5eExRVUZMTEVsQlFVa3NSVUZCUlR0WlFVTm9ReXhGUVVGRkxFTkJRVU1zU1VGQlNTeERRVUZETEVOQlFVTTdVMEZEV2p0SlFVTk1MRU5CUVVNN1NVRkJRU3hEUVVGRE8wbEJSMFlzZDBKQlFVc3NSMEZCVEN4VlFVRk5MRVZCUVVVN1VVRkRTaXhKUVVGSkxFVkJRVVVzUjBGQlJ5eEpRVUZKTEVOQlFVTXNVVUZCVVN4RlFVRkZMRVZCUVVVc1NVRkJTU3hEUVVGRE8xRkJReTlDTEU5QlFVOHNRMEZCUXl4SlFVRkpMRWRCUVVjc1JVRkJSU3hEUVVGRExFbEJRVWtzUlVGQlJTeERRVUZETEV0QlFVc3NTVUZCU1N4RlFVRkZPMWxCUTJoRExFVkJRVVVzUTBGQlF5eEpRVUZKTEVOQlFVTXNRMEZCUXp0VFFVTmFPMGxCUTB3c1EwRkJRenRKUVVGQkxFTkJRVU03U1VGSFJpeDVRa0ZCVFN4SFFVRk9MRlZCUVU4c1NVRkJTU3hGUVVGRkxFZEJRVWM3VVVGRFdpeEpRVUZKTEVkQlFVY3NSMEZCUnl4SlFVRkpMRU5CUVVNc1MwRkJTeXhEUVVGRE8xRkJRM0pDTEVsQlFVa3NTVUZCU1N4SFFVRkhMRWxCUVVrc1EwRkJReXhSUVVGUkxFVkJRVVVzUTBGQlF6dFJRVVV6UWl4UFFVRlBMRWRCUVVjc1MwRkJTeXhKUVVGSkxFVkJRVVU3V1VGRGFrSXNTVUZCU1N4RFFVRkRMRWRCUVVjc1NVRkJTU3hEUVVGRExGZEJRVmNzUTBGQlF5eEpRVUZKTEVWQlFVVXNSMEZCUnl4RFFVRkRMRWxCUVVrc1EwRkJReXhEUVVGRE8xbEJRM3BETEVsQlFVa3NRMEZCUXl4TFFVRkxMRU5CUVVNc1JVRkJSVHRuUWtGRFZDeEpRVUZKTEVOQlFVTXNUMEZCVHl4SFFVRkhMRWRCUVVjc1EwRkJRenRuUWtGRGJrSXNUMEZCVHl4SlFVRkpMRU5CUVVNN1lVRkRaanRaUVVORUxFbEJRVWtzUTBGQlF5eFZRVUZWTEVOQlFVTXNTVUZCU1N4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRE8xbEJRekZDTEVkQlFVY3NSMEZCUnl4SFFVRkhMRU5CUVVNc1UwRkJVeXhEUVVGRExFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTXNRMEZCUXp0VFFVTTVRanRSUVVWRUxFdEJRVXNzU1VGQlNTeERRVUZETEVkQlFVY3NTVUZCU1N4RFFVRkRMRlZCUVZVc1EwRkJReXhOUVVGTkxFZEJRVWNzUTBGQlF5eEZRVUZGTEVOQlFVTXNTVUZCU1N4RFFVRkRMRVZCUVVVc1JVRkJSU3hEUVVGRExFVkJRVVU3V1VGRGJFUXNSMEZCUnl4SFFVRkhMRWxCUVVrc1EwRkJReXhWUVVGVkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTTdXVUZEZWtJc1NVRkJTU3hIUVVGSExFTkJRVU1zU1VGQlNTeEZRVUZGTEVkQlFVY3NRMEZCUXl4SlFVRkpMRU5CUVVNc1IwRkJSeXhEUVVGRExFVkJRVVU3WjBKQlEzcENMRWxCUVVrc1EwRkJReXhQUVVGUExFZEJRVWNzUjBGQlJ5eERRVUZETzJkQ1FVTnVRaXhKUVVGSkxFTkJRVU1zVlVGQlZTeERRVUZETEUxQlFVMHNSMEZCUnl4RFFVRkRMRU5CUVVNN1owSkJRek5DTEU5QlFVOHNTVUZCU1N4RFFVRkRPMkZCUTJZN1UwRkRTanRSUVVWRUxFbEJRVWtzUTBGQlF5eFZRVUZWTEVOQlFVTXNUVUZCVFN4SFFVRkhMRU5CUVVNc1EwRkJRenRSUVVNelFpeFBRVUZQTEVsQlFVa3NRMEZCUXp0SlFVTm9RaXhEUVVGRE8wbEJRVUVzUTBGQlF6dEpRVU5PTEdWQlFVTTdRVUZCUkN4RFFVRkRMRUZCTlVsRUxFbEJORWxETzBGQk5VbFpMRFJDUVVGUk8wRkJOa2x5UWp0SlFVbEpMR3RDUVVGWkxFbEJRVWs3VVVGRFdpeEpRVUZKTEVOQlFVTXNTMEZCU3l4SFFVRkhMRWxCUVVrc1EwRkJRenRSUVVOc1FpeEpRVUZKTEVOQlFVTXNWVUZCVlN4SFFVRkhMRVZCUVVVc1EwRkJRenRSUVVOeVFpeEpRVUZKTEVOQlFVTXNUMEZCVHl4SFFVRkhMRWxCUVVrc1EwRkJRenRKUVVONFFpeERRVUZETzBsQlJVUXNkVUpCUVVrc1IwRkJTanRSUVVOSkxFOUJRVThzU1VGQlNTeERRVUZETEU5QlFVOHNTMEZCU3l4SlFVRkpMRU5CUVVNc1EwRkJReXhEUVVGRExFbEJRVWtzUTBGQlF5eFBRVUZQTEVOQlFVTXNTVUZCU1N4RFFVRkRMRU5CUVVNc1EwRkJReXhKUVVGSkxFTkJRVU03U1VGRE5VUXNRMEZCUXp0SlFVRkJMRU5CUVVNN1NVRkpSaXgxUWtGQlNTeEhRVUZLTzFGQlEwa3NTVUZCU1N4SlFVRkpMRU5CUVVNc1QwRkJUeXhMUVVGTExFbEJRVWtzUlVGQlJUdFpRVU4yUWl4SlFVRkpMRWxCUVVrc1IwRkJSeXhKUVVGSkxFTkJRVU1zUzBGQlN5eERRVUZETEV0QlFVc3NRMEZCUXp0WlFVTTFRaXhKUVVGSkxFbEJRVWtzUzBGQlN5eEpRVUZKTEVWQlFVVTdaMEpCUTJZc1NVRkJTU3hEUVVGRExGRkJRVkVzUTBGQlF5eEpRVUZKTEVOQlFVTXNRMEZCUXp0aFFVTjJRanRUUVVOS08yRkJRMGs3V1VGRFJDeEpRVUZKTEVsQlFVa3NRMEZCUXl4UFFVRlBMRU5CUVVNc1MwRkJTeXhMUVVGTExFbEJRVWtzUlVGQlJUdG5Ra0ZITjBJc1NVRkJTU3hKUVVGSkxFTkJRVU03WjBKQlExUXNSMEZCUnp0dlFrRkRReXhKUVVGSkxFZEJRVWNzU1VGQlNTeERRVUZETEU5QlFVOHNRMEZCUXp0dlFrRkRjRUlzU1VGQlNTeEpRVUZKTEVOQlFVTXNWVUZCVlN4RFFVRkRMRTFCUVUwc1JVRkJSVHQzUWtGRGVFSXNTVUZCU1N4RFFVRkRMRTlCUVU4c1IwRkJSeXhKUVVGSkxFTkJRVU1zVlVGQlZTeERRVUZETEVkQlFVY3NSVUZCUlN4RFFVRkRPM0ZDUVVONFF6dDVRa0ZEU1R0M1FrRkRSQ3hKUVVGSkxFTkJRVU1zVDBGQlR5eEhRVUZITEVsQlFVa3NRMEZCUXp0M1FrRkRjRUlzVFVGQlRUdHhRa0ZEVkR0cFFrRkRTaXhSUVVGUkxFbEJRVWtzUTBGQlF5eFBRVUZQTEVOQlFVTXNTMEZCU3l4TFFVRkxMRWxCUVVrc1JVRkJSVHRoUVVONlF6dHBRa0ZEU1R0blFrRkZSQ3hKUVVGSkxFTkJRVU1zVlVGQlZTeERRVUZETEVsQlFVa3NRMEZCUXl4SlFVRkpMRU5CUVVNc1QwRkJUeXhEUVVGRExFTkJRVU03WjBKQlEyNURMRWxCUVVrc1EwRkJReXhSUVVGUkxFTkJRVU1zU1VGQlNTeERRVUZETEU5QlFVOHNRMEZCUXl4TFFVRkxMRU5CUVVNc1EwRkJRenRoUVVOeVF6dFRRVU5LTzFGQlEwUXNUMEZCVHl4SlFVRkpMRU5CUVVNc1QwRkJUeXhMUVVGTExFbEJRVWtzUTBGQlF5eERRVUZETEVOQlFVTXNTVUZCU1N4RFFVRkRMRTlCUVU4c1EwRkJReXhKUVVGSkxFTkJRVU1zUTBGQlF5eERRVUZETEVsQlFVa3NRMEZCUXp0SlFVTTFSQ3hEUVVGRE8wbEJRVUVzUTBGQlF6dEpRVWxHTEhWQ1FVRkpMRWRCUVVvN1VVRkRTU3hKUVVGSkxFbEJRVWtzUTBGQlF5eFBRVUZQTEV0QlFVc3NTVUZCU1N4RlFVRkZPMWxCUTNaQ0xFbEJRVWtzU1VGQlNTeEhRVUZITEVsQlFVa3NRMEZCUXl4TFFVRkxMRU5CUVVNc1MwRkJTeXhEUVVGRE8xbEJRelZDTEVsQlFVa3NTVUZCU1N4TFFVRkxMRWxCUVVrc1JVRkJSVHRuUWtGRFppeEpRVUZKTEVOQlFVTXNVVUZCVVN4RFFVRkRMRWxCUVVrc1EwRkJReXhEUVVGRE8yRkJRM1pDTzFOQlEwbzdZVUZEU1R0WlFVTkVMRWxCUVVrc1NVRkJTU3hEUVVGRExFOUJRVThzUTBGQlF5eEpRVUZKTEV0QlFVc3NTVUZCU1N4RlFVRkZPMmRDUVVNMVFpeEpRVUZKTEVsQlFVa3NRMEZCUXp0blFrRkRWQ3hIUVVGSE8yOUNRVU5ETEVsQlFVa3NSMEZCUnl4SlFVRkpMRU5CUVVNc1QwRkJUeXhEUVVGRE8yOUNRVU53UWl4SlFVRkpMRWxCUVVrc1EwRkJReXhWUVVGVkxFTkJRVU1zVFVGQlRTeEZRVUZGTzNkQ1FVTjRRaXhKUVVGSkxFTkJRVU1zVDBGQlR5eEhRVUZITEVsQlFVa3NRMEZCUXl4VlFVRlZMRU5CUVVNc1IwRkJSeXhGUVVGRkxFTkJRVU03Y1VKQlEzaERPM2xDUVVOSk8zZENRVU5FTEVsQlFVa3NRMEZCUXl4UFFVRlBMRWRCUVVjc1NVRkJTU3hEUVVGRE8zZENRVU53UWl4TlFVRk5PM0ZDUVVOVU8ybENRVU5LTEZGQlFWRXNTVUZCU1N4RFFVRkRMRTlCUVU4c1EwRkJReXhKUVVGSkxFdEJRVXNzU1VGQlNTeEZRVUZGTzJGQlEzaERPMmxDUVVOSk8yZENRVU5FTEVsQlFVa3NRMEZCUXl4VlFVRlZMRU5CUVVNc1NVRkJTU3hEUVVGRExFbEJRVWtzUTBGQlF5eFBRVUZQTEVOQlFVTXNRMEZCUXp0blFrRkRia01zU1VGQlNTeERRVUZETEZGQlFWRXNRMEZCUXl4SlFVRkpMRU5CUVVNc1QwRkJUeXhEUVVGRExFbEJRVWtzUTBGQlF5eERRVUZETzJGQlEzQkRPMU5CUTBvN1VVRkRSQ3hQUVVGUExFbEJRVWtzUTBGQlF5eFBRVUZQTEV0QlFVc3NTVUZCU1N4RFFVRkRMRU5CUVVNc1EwRkJReXhKUVVGSkxFTkJRVU1zVDBGQlR5eERRVUZETEVsQlFVa3NRMEZCUXl4RFFVRkRMRU5CUVVNc1NVRkJTU3hEUVVGRE8wbEJRelZFTEVOQlFVTTdTVUZCUVN4RFFVRkRPMGxCUlVZc01rSkJRVkVzUjBGQlVpeFZRVUZUTEV0QlFVczdVVUZEVml4UFFVRlBMRXRCUVVzc1EwRkJReXhKUVVGSkxFdEJRVXNzU1VGQlNTeEZRVUZGTzFsQlEzaENMRWxCUVVrc1EwRkJReXhWUVVGVkxFTkJRVU1zU1VGQlNTeERRVUZETEV0QlFVc3NRMEZCUXl4RFFVRkRPMWxCUXpWQ0xFdEJRVXNzUjBGQlJ5eExRVUZMTEVOQlFVTXNTVUZCU1N4RFFVRkRPMU5CUTNSQ08xRkJRMFFzU1VGQlNTeERRVUZETEU5QlFVOHNSMEZCUnl4TFFVRkxMRU5CUVVNN1NVRkRla0lzUTBGQlF6dEpRVUZCTEVOQlFVTTdTVUZGUml3eVFrRkJVU3hIUVVGU0xGVkJRVk1zUzBGQlN6dFJRVU5XTEU5QlFVOHNTMEZCU3l4RFFVRkRMRXRCUVVzc1MwRkJTeXhKUVVGSkxFVkJRVVU3V1VGRGVrSXNTVUZCU1N4RFFVRkRMRlZCUVZVc1EwRkJReXhKUVVGSkxFTkJRVU1zUzBGQlN5eERRVUZETEVOQlFVTTdXVUZETlVJc1MwRkJTeXhIUVVGSExFdEJRVXNzUTBGQlF5eExRVUZMTEVOQlFVTTdVMEZEZGtJN1VVRkRSQ3hKUVVGSkxFTkJRVU1zVDBGQlR5eEhRVUZITEV0QlFVc3NRMEZCUXp0SlFVTjZRaXhEUVVGRE8wbEJRVUVzUTBGQlF6dEpRVU5PTEdWQlFVTTdRVUZCUkN4RFFVRkRMRUZCT1VaRUxFbEJPRVpETzBGQk9VWlpMRFJDUVVGUk8wRkJaMGR5UWp0SlFVdEpMR05CUVZrc1NVRkJTVHRSUVVOYUxFbEJRVWtzUTBGQlF5eEpRVUZKTEVkQlFVY3NTVUZCU1N4RFFVRkRPMUZCUTJwQ0xFbEJRVWtzUTBGQlF5eEpRVUZKTEVkQlFVY3NTVUZCU1N4RFFVRkRPMUZCUTJwQ0xFbEJRVWtzUTBGQlF5eExRVUZMTEVkQlFVY3NTVUZCU1N4RFFVRkRPMUZCUTJ4Q0xFbEJRVWtzUTBGQlF5eEhRVUZITEVkQlFVY3NTVUZCU1N4RFFVRkRPMGxCUTNCQ0xFTkJRVU03U1VGRlJDeDNRa0ZCVXl4SFFVRlVMRlZCUVZVc1IwRkJSenRSUVVOVUxFOUJRVThzUjBGQlJ5eERRVUZETEVOQlFVTXNRMEZCUXl4SlFVRkpMRU5CUVVNc1MwRkJTeXhEUVVGRExFTkJRVU1zUTBGQlF5eEpRVUZKTEVOQlFVTXNTVUZCU1N4RFFVRkRPMGxCUTNoRExFTkJRVU03U1VGQlFTeERRVUZETzBsQlJVWXNkMEpCUVZNc1IwRkJWQ3hWUVVGVkxFZEJRVWNzUlVGQlJTeEhRVUZITzFGQlEyUXNTVUZCU1N4SFFVRkhMRVZCUVVVN1dVRkRUQ3hKUVVGSkxFTkJRVU1zUzBGQlN5eEhRVUZITEVkQlFVY3NRMEZCUXp0VFFVTndRanRoUVVOSk8xbEJRMFFzU1VGQlNTeERRVUZETEVsQlFVa3NSMEZCUnl4SFFVRkhMRU5CUVVNN1UwRkRia0k3U1VGRFRDeERRVUZETzBsQlFVRXNRMEZCUXp0SlFVTk9MRmRCUVVNN1FVRkJSQ3hEUVVGRExFRkJlRUpFTEVsQmQwSkRPMEZCUlVRN1NVRkJLMElzTUVKQlFWRTdTVUZMYmtNc1owSkJRVmtzVlVGQmEwTTdVVUZCT1VNc1dVRkRTU3hwUWtGQlR5eFRRVWxXTzFGQlNFY3NTMEZCU1N4RFFVRkRMRXRCUVVzc1IwRkJSeXhKUVVGSkxFTkJRVU03VVVGRGJFSXNTMEZCU1N4RFFVRkRMRmRCUVZjc1IwRkJSeXhWUVVGVkxFTkJRVU03VVVGRE9VSXNTMEZCU1N4RFFVRkRMRWxCUVVrc1IwRkJSeXhEUVVGRExFTkJRVU03TzBsQlEyeENMRU5CUVVNN1NVRkhSQ3gxUWtGQlRTeEhRVUZPTEZWQlFVOHNTVUZCU1R0UlFVTlFMRWxCUVVrc1IwRkJSeXhIUVVGSExFdEJRVXNzUTBGQlF6dFJRVVZvUWl4SlFVRkpMRWxCUVVrc1EwRkJReXhMUVVGTExFdEJRVXNzU1VGQlNTeEZRVUZGTzFsQlJYSkNMRWxCUVVrc1EwRkJReXhMUVVGTExFZEJRVWNzU1VGQlNTeEpRVUZKTEVOQlFVTXNTVUZCU1N4RFFVRkRMRU5CUVVNN1dVRkROVUlzUjBGQlJ5eEhRVUZITEVsQlFVa3NRMEZCUXp0WlFVTllMRWxCUVVrc1EwRkJReXhKUVVGSkxFVkJRVVVzUTBGQlF6dFRRVU5tTzJGQlEwazdXVUZEUkN4SlFVRkpMRWxCUVVrc1IwRkJSeXhKUVVGSkxFbEJRVWtzUTBGQlF5eFRRVUZUTEVOQlFVTXNRMEZCUXp0WlFVVXZRaXhKUVVGSkxFZEJRVWNzUjBGQlJ5eExRVUZMTEVOQlFVTTdXVUZEYUVJc1NVRkJTU3hKUVVGSkxFZEJRVWNzUzBGQlN5eERRVUZETzFsQlIycENMRWxCUVVrc1JVRkJSU3hIUVVGSExFbEJRVWtzUTBGQlF6dFpRVU5rTEVsQlFVa3NSMEZCUnl4SFFVRkhMRWxCUVVrc1EwRkJRenRaUVVObUxFbEJRVWtzUTBGQlF5eEhRVUZITEVsQlFVa3NRMEZCUXp0WlFVTmlMRWxCUVVrc1NVRkJTU3hIUVVGSExFbEJRVWtzUTBGQlF5eExRVUZMTEVOQlFVTTdXVUZEZEVJc1IwRkJSeXhEUVVGRExFdEJRVXNzUjBGQlJ5eEpRVUZKTEVOQlFVTXNTMEZCU3l4RFFVRkRPMWxCUjNaQ0xFOUJRVThzU1VGQlNTeEZRVUZGTzJkQ1FVTlVMRWxCUVVrc1NVRkJTU3hMUVVGTExFbEJRVWtzUlVGQlJUdHZRa0ZGWml4SlFVRkpMRWRCUVVjc1NVRkJTU3hKUVVGSkxFTkJRVU1zU1VGQlNTeERRVUZETEVOQlFVTTdiMEpCUTNSQ0xFTkJRVU1zUTBGQlF5eFRRVUZUTEVOQlFVTXNSMEZCUnl4RlFVRkZMRWxCUVVrc1EwRkJReXhEUVVGRE8yOUNRVU4yUWl4SFFVRkhMRWRCUVVjc1NVRkJTU3hEUVVGRE8yOUNRVU5ZTEVsQlFVa3NRMEZCUXl4SlFVRkpMRVZCUVVVc1EwRkJRenRwUWtGRFpqdHhRa0ZEU1N4SlFVRkpMRTFCUVUwc1EwRkJReXhOUVVGTkxFTkJRVU1zU1VGQlNTeERRVUZETEVsQlFVa3NRMEZCUXl4SlFVRkpMRTFCUVUwc1EwRkJReXhOUVVGTkxFTkJRVU1zU1VGQlNTeERRVUZETEV0QlFVc3NRMEZCUXl4RlFVRkZPMjlDUVVVMVJDeEpRVUZKTEVOQlFVTXNSMEZCUnl4SFFVRkhMRWxCUVVrc1EwRkJRenR2UWtGRGFFSXNTVUZCU1N4RFFVRkRMRWxCUVVrc1EwRkJReXhIUVVGSExFZEJRVWNzUzBGQlN5eERRVUZETzI5Q1FVTjBRaXhKUVVGSkxFTkJRVU1zUzBGQlN5eERRVUZETEVkQlFVY3NSMEZCUnl4TFFVRkxMRU5CUVVNN2FVSkJRekZDTzJkQ1FVZEVMRWxCUVVrc1RVRkJUU3hEUVVGRExFMUJRVTBzUTBGQlF5eEpRVUZKTEVOQlFVTXNTVUZCU1N4TlFVRk5MRU5CUVVNc1RVRkJUU3hEUVVGRExFTkJRVU1zUTBGQlF5eEZRVUZGTzI5Q1FVTjZReXhKUVVGSkxFbEJRVWtzUjBGQlJ5eEhRVUZITEVOQlFVTXNTMEZCU3l4TFFVRkxMRVZCUVVVc1EwRkJRenR2UWtGRk5VSXNTVUZCU1N4SlFVRkpMRXRCUVVzc1EwRkJReXhEUVVGRExGTkJRVk1zUTBGQlF5eEpRVUZKTEVOQlFVTXNSVUZCUlR0M1FrRkROVUlzUjBGQlJ5eERRVUZETEZOQlFWTXNRMEZCUXl4SlFVRkpMRVZCUVVVc1RVRkJUU3hEUVVGRExHRkJRV0VzUTBGQlF5eEZRVUZGTEVWQlFVVXNRMEZCUXl4SlFVRkpMRU5CUVVNc1EwRkJReXhEUVVGRE8zRkNRVU40UkR0NVFrRkRTVHQzUWtGRFJDeEhRVUZITEVOQlFVTXNVMEZCVXl4RFFVRkRMRWxCUVVrc1JVRkJSU3hOUVVGTkxFTkJRVU1zWVVGQllTeERRVUZETEVWQlFVVXNSVUZCUlN4RFFVRkRMRWxCUVVrc1EwRkJReXhEUVVGRExFTkJRVU03Y1VKQlEzaEVPMmxDUVVOS08yZENRVVZFTEVsQlFVa3NSMEZCUnl4SFFVRkhMRWxCUVVrc1EwRkJReXhYUVVGWExFTkJRVU1zU1VGQlNTeERRVUZETEVsQlFVa3NSVUZCUlN4SlFVRkpMRU5CUVVNc1EwRkJRenRuUWtGSE5VTXNTVUZCU1N4SFFVRkhMRXRCUVVzc1EwRkJReXhGUVVGRk8yOUNRVU5ZTEUxQlFVMDdhVUpCUTFRN1owSkJSVVFzU1VGQlNTeEhRVUZITEVkQlFVY3NRMEZCUXp0blFrRkRXQ3hIUVVGSExFZEJRVWNzUjBGQlJ5eEhRVUZITEVOQlFVTXNRMEZCUXp0blFrRkhaQ3hKUVVGSkxFVkJRVVVzUzBGQlN5eEpRVUZKTEVWQlFVVTdiMEpCUTJJc1IwRkJSeXhIUVVGSExFVkJRVVVzUTBGQlF6dHBRa0ZEV2p0blFrRkRSQ3hGUVVGRkxFZEJRVWNzUTBGQlF5eERRVUZETzJkQ1FVTlFMRU5CUVVNc1IwRkJSeXhKUVVGSkxFTkJRVU03WjBKQlExUXNTVUZCU1N4SFFVRkhMRWxCUVVrc1EwRkJReXhUUVVGVExFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTTdZVUZET1VJN1dVRkhSQ3hKUVVGSkxFTkJRVU1zUzBGQlN5eEhRVUZITEVsQlFVa3NRMEZCUXl4TFFVRkxMRU5CUVVNN1UwRkRNMEk3VVVGSFJDeEpRVUZKTEVOQlFVTXNTMEZCU3l4RFFVRkRMRWRCUVVjc1IwRkJSeXhMUVVGTExFTkJRVU03VVVGRmRrSXNUMEZCVHl4SFFVRkhMRU5CUVVNN1NVRkRaaXhEUVVGRE8wbEJRVUVzUTBGQlF6dEpRVWRHTEhWQ1FVRk5MRWRCUVU0c1ZVRkJUeXhKUVVGSk8xRkJRMUFzU1VGQlNTeEpRVUZKTEVOQlFVTXNTMEZCU3l4TFFVRkxMRWxCUVVrc1JVRkJSVHRaUVVOeVFpeFBRVUZQTEV0QlFVc3NRMEZCUXp0VFFVTm9RanRSUVVWRUxFbEJRVWtzU1VGQlNTeEhRVUZITEVsQlFVa3NTVUZCU1N4RFFVRkRMRk5CUVZNc1EwRkJReXhEUVVGRE8xRkJReTlDTEVsQlFVa3NTVUZCU1N4SFFVRkhMRWxCUVVrc1EwRkJRenRSUVVOb1FpeEpRVUZKTEVOQlFVTXNTMEZCU3l4SFFVRkhMRWxCUVVrc1EwRkJReXhMUVVGTExFTkJRVU03VVVGRGVFSXNTVUZCU1N4RFFVRkRMRWRCUVVjc1NVRkJTU3hEUVVGRE8xRkJRMklzU1VGQlNTeEZRVUZGTEVkQlFVY3NTVUZCU1N4RFFVRkRPMUZCUTJRc1NVRkJTU3hMUVVGTExFZEJRVWNzU1VGQlNTeERRVUZETzFGQlEycENMRWxCUVVrc1IwRkJSeXhIUVVGSExFbEJRVWtzUTBGQlF6dFJRVVZtTEU5QlFVOHNTVUZCU1N4RFFVRkRMRk5CUVZNc1EwRkJReXhIUVVGSExFTkJRVU1zUzBGQlN5eEpRVUZKTEVWQlFVVTdXVUZEYWtNc1NVRkJTU3hKUVVGSkxFZEJRVWNzUjBGQlJ5eERRVUZETzFsQlIyWXNSVUZCUlN4SFFVRkhMRU5CUVVNc1EwRkJRenRaUVVOUUxFTkJRVU1zUjBGQlJ5eEpRVUZKTEVOQlFVTTdXVUZEVkN4SlFVRkpMRWRCUVVjc1NVRkJTU3hEUVVGRExGTkJRVk1zUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXp0WlFVVXpRaXhKUVVGSkxFZEJRVWNzUjBGQlJ5eEpRVUZKTEVOQlFVTXNWMEZCVnl4RFFVRkRMRWxCUVVrc1JVRkJSU3hKUVVGSkxFTkJRVU1zU1VGQlNTeERRVUZETEVOQlFVTTdXVUZGTlVNc1IwRkJSeXhIUVVGSExFZEJRVWNzUjBGQlJ5eERRVUZETEVOQlFVTTdXVUZIWkN4SlFVRkpMRWRCUVVjc1MwRkJTeXhEUVVGRExFVkJRVVU3WjBKQlExZ3NTMEZCU3l4SFFVRkhMRWxCUVVrc1EwRkJRenRoUVVOb1FqdFpRVWRFTEVsQlFVa3NRMEZCUXl4TlFVRk5MRU5CUVVNc1RVRkJUU3hEUVVGRExFbEJRVWtzUTBGQlF5eEpRVUZKTEVOQlFVTXNUVUZCVFN4RFFVRkRMRTFCUVUwc1EwRkJReXhKUVVGSkxFTkJRVU1zVTBGQlV5eERRVUZETEVkQlFVY3NRMEZCUXl4RFFVRkRMRVZCUVVVN1owSkJRemRFTEVsQlFVa3NUVUZCVFN4RFFVRkRMRTFCUVUwc1EwRkJReXhKUVVGSkxFTkJRVU1zVTBGQlV5eERRVUZETEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNc1JVRkJSVHR2UWtGRGNrTXNTVUZCU1N4RlFVRkZMRWRCUVVjc1RVRkJUU3hEUVVGRExHRkJRV0VzUTBGQlF5eEpRVUZKTEVWQlFVVXNSMEZCUnl4RFFVRkRMRU5CUVVNN2IwSkJRM3BETEVOQlFVTXNRMEZCUXl4VFFVRlRMRU5CUVVNc1NVRkJTU3hGUVVGRkxFVkJRVVVzUTBGQlF5eERRVUZETzI5Q1FVTjBRaXhEUVVGRExFZEJRVWNzUlVGQlJTeERRVUZETzJsQ1FVTldPM0ZDUVVOSkxFbEJRVWtzUTBGQlF5eE5RVUZOTEVOQlFVTXNUVUZCVFN4RFFVRkRMRWxCUVVrc1EwRkJReXhUUVVGVExFTkJRVU1zUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXl4RlFVRkZPMjlDUVVNelF5eEpRVUZKTEU5QlFVOHNSMEZCUnl4RFFVRkRMRU5CUVVNc1UwRkJVeXhEUVVGRExFTkJRVU1zU1VGQlNTeERRVUZETEVOQlFVTTdiMEpCUTJwRExFbEJRVWtzVDBGQlR5eExRVUZMTEVsQlFVa3NSVUZCUlR0M1FrRkRiRUlzU1VGQlNTeERRVUZETEUxQlFVMHNRMEZCUXl4TlFVRk5MRU5CUVVNc1QwRkJUeXhEUVVGRExGTkJRVk1zUTBGQlF5eERRVUZETEVsQlFVa3NRMEZCUXl4RFFVRkRMRWxCUVVrc1EwRkJReXhOUVVGTkxFTkJRVU1zVFVGQlRTeERRVUZETEU5QlFVOHNRMEZCUXl4VFFVRlRMRU5CUVVNc1NVRkJTU3hEUVVGRExFTkJRVU1zUlVGQlJUczBRa0ZGY2tZc1EwRkJReXhEUVVGRExFZEJRVWNzUjBGQlJ5eExRVUZMTEVOQlFVTTdORUpCUTJRc1QwRkJUeXhEUVVGRExFZEJRVWNzUjBGQlJ5eEpRVUZKTEVOQlFVTTdORUpCUTI1Q0xFbEJRVWtzUTBGQlF5eEhRVUZITEVkQlFVY3NTVUZCU1N4RFFVRkRPM2xDUVVOdVFqczJRa0ZEU1RzMFFrRkRSQ3hKUVVGSkxFbEJRVWtzUjBGQlJ5eEZRVUZGTEVOQlFVTXNTMEZCU3l4TFFVRkxMRU5CUVVNc1EwRkJRenMwUWtGRk1VSXNTVUZCU1N4TlFVRk5MRU5CUVVNc1RVRkJUU3hEUVVGRExFOUJRVThzUTBGQlF5eFRRVUZUTEVOQlFVTXNTVUZCU1N4RFFVRkRMRU5CUVVNc1JVRkJSVHRuUTBGRGVFTXNSVUZCUlN4RFFVRkRMRk5CUVZNc1EwRkJReXhKUVVGSkxFVkJRVVVzVFVGQlRTeERRVUZETEdGQlFXRXNRMEZCUXl4RFFVRkRMRVZCUVVVc1NVRkJTU3hEUVVGRExFTkJRVU1zUTBGQlF6czJRa0ZEY2tRN2FVTkJRMGtzU1VGQlNTeE5RVUZOTEVOQlFVTXNUVUZCVFN4RFFVRkRMRTlCUVU4c1EwRkJReXhUUVVGVExFTkJRVU1zUTBGQlF5eEpRVUZKTEVOQlFVTXNRMEZCUXl4RlFVRkZPMmREUVVNNVF5eEZRVUZGTEVOQlFVTXNVMEZCVXl4RFFVRkRMRWxCUVVrc1JVRkJSU3hOUVVGTkxFTkJRVU1zWVVGQllTeERRVUZETEVOQlFVTXNSVUZCUlN4SlFVRkpMRU5CUVVNc1EwRkJReXhEUVVGRE96WkNRVU55UkRzMFFrRkhSQ3hKUVVGSkxFZEJRVWNzUjBGQlJ5eEZRVUZGTEVOQlFVTXNVMEZCVXl4RFFVRkRMRWxCUVVrc1EwRkJReXhEUVVGRE96UkNRVU0zUWl4SFFVRkhMRU5CUVVNc1IwRkJSeXhIUVVGSExFbEJRVWtzUTBGQlF6czBRa0ZEWml4SlFVRkpMRU5CUVVNc1IwRkJSeXhIUVVGSExFbEJRVWtzUTBGQlF6czBRa0ZEYUVJc1IwRkJSeXhEUVVGRExFbEJRVWtzUTBGQlF5eEhRVUZITEVkQlFVY3NTMEZCU3l4RFFVRkRPelJDUVVOeVFpeEhRVUZITEVOQlFVTXNTMEZCU3l4RFFVRkRMRWRCUVVjc1IwRkJSeXhMUVVGTExFTkJRVU03ZVVKQlEzcENPM0ZDUVVOS08ybENRVU5LTzJGQlEwbzdVMEZEU2p0UlFVZEVMRWxCUVVrc1MwRkJTeXhMUVVGTExFbEJRVWtzUlVGQlJUdFpRVU5vUWl4TFFVRkxMRU5CUVVNc1NVRkJTU3hIUVVGSExFbEJRVWtzUTBGQlF5eEpRVUZKTEVOQlFVTTdXVUZEZGtJc1EwRkJReXhEUVVGRExGTkJRVk1zUTBGQlF5eERRVUZETEVOQlFVTXNTMEZCU3l4TFFVRkxMRWxCUVVrc1JVRkJSU3hKUVVGSkxFTkJRVU1zVTBGQlV5eERRVUZETEVsQlFVa3NRMEZCUXl4SlFVRkpMRXRCUVVzc1NVRkJTU3hEUVVGRExFTkJRVU1zUTBGQlF6dFpRVU5zUlN4SlFVRkpMRU5CUVVNc1NVRkJTU3hGUVVGRkxFTkJRVU03VTBGRFpqdFJRVWRFTEVsQlFVa3NRMEZCUXl4TFFVRkxMRWRCUVVjc1NVRkJTU3hEUVVGRExFdEJRVXNzUTBGQlF6dFJRVU40UWl4SlFVRkpMRWxCUVVrc1EwRkJReXhMUVVGTExFdEJRVXNzU1VGQlNTeEZRVUZGTzFsQlEzSkNMRWxCUVVrc1EwRkJReXhMUVVGTExFTkJRVU1zUjBGQlJ5eEhRVUZITEV0QlFVc3NRMEZCUXp0VFFVTXhRanRSUVVWRUxFOUJRVThzUzBGQlN5eExRVUZMTEVsQlFVa3NRMEZCUXp0SlFVTXhRaXhEUVVGRE8wbEJRVUVzUTBGQlF6dEpRVVZMTEdGQlFVMHNSMEZCWWl4VlFVRmpMRWxCUVVrN1VVRkRaQ3hQUVVGUExFbEJRVWtzUzBGQlN5eEpRVUZKTEVsQlFVa3NTVUZCU1N4RFFVRkRMRWRCUVVjc1EwRkJRenRKUVVOeVF5eERRVUZETzBsQlJVMHNiMEpCUVdFc1IwRkJjRUlzVlVGQmNVSXNTVUZCU1N4RlFVRkZMRWRCUVVjN1VVRkRNVUlzU1VGQlNTeEpRVUZKTEVkQlFVY3NTVUZCU1N4RFFVRkRMRk5CUVZNc1EwRkJReXhEUVVGRExFZEJRVWNzUTBGQlF5eERRVUZETzFGQlJXaERMRWxCUVVrc1EwRkJReXhUUVVGVExFTkJRVU1zUTBGQlF5eEhRVUZITEVWQlFVVXNTVUZCU1N4RFFVRkRMRk5CUVZNc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF5eERRVUZETzFGQlF6RkRMRWxCUVVrc1EwRkJReXhUUVVGVExFTkJRVU1zUjBGQlJ5eEZRVUZGTEVsQlFVa3NRMEZCUXl4RFFVRkRPMUZCUlRGQ0xFbEJRVWtzUTBGQlF5eEhRVUZITEVkQlFVY3NTVUZCU1N4RFFVRkRPMUZCUTJoQ0xFbEJRVWtzUTBGQlF5eEhRVUZITEVkQlFVY3NTMEZCU3l4RFFVRkRPMUZCUldwQ0xFOUJRVThzU1VGQlNTeERRVUZETzBsQlEyaENMRU5CUVVNN1NVRkZUU3h2UWtGQllTeEhRVUZ3UWl4VlFVRnhRaXhKUVVGSkxFVkJRVVVzUjBGQlJ6dFJRVU14UWl4SlFVRkpMRU5CUVVNc1UwRkJVeXhEUVVGRExFTkJRVU1zUjBGQlJ5eEZRVUZGTEUxQlFVMHNRMEZCUXl4aFFVRmhMRU5CUVVNc1NVRkJTU3hEUVVGRExGTkJRVk1zUTBGQlF5eERRVUZETEVkQlFVY3NRMEZCUXl4RlFVRkZMRU5CUVVNc1IwRkJSeXhEUVVGRExFTkJRVU1zUTBGQlF6dFJRVU4yUlN4UFFVRlBMRTFCUVUwc1EwRkJReXhoUVVGaExFTkJRVU1zU1VGQlNTeEZRVUZGTEVkQlFVY3NRMEZCUXl4RFFVRkRPMGxCUXpORExFTkJRVU03U1VGRFRDeGhRVUZETzBGQlFVUXNRMEZCUXl4QlFYSk5SQ3hEUVVFclFpeFJRVUZSTEVkQmNVMTBRenRCUVhKTldTeDNRa0ZCVFNKOSIsIlwidXNlIHN0cmljdFwiO1xudmFyIF9fZXh0ZW5kcyA9ICh0aGlzICYmIHRoaXMuX19leHRlbmRzKSB8fCAoZnVuY3Rpb24gKCkge1xuICAgIHZhciBleHRlbmRTdGF0aWNzID0gZnVuY3Rpb24gKGQsIGIpIHtcbiAgICAgICAgZXh0ZW5kU3RhdGljcyA9IE9iamVjdC5zZXRQcm90b3R5cGVPZiB8fFxuICAgICAgICAgICAgKHsgX19wcm90b19fOiBbXSB9IGluc3RhbmNlb2YgQXJyYXkgJiYgZnVuY3Rpb24gKGQsIGIpIHsgZC5fX3Byb3RvX18gPSBiOyB9KSB8fFxuICAgICAgICAgICAgZnVuY3Rpb24gKGQsIGIpIHsgZm9yICh2YXIgcCBpbiBiKSBpZiAoYi5oYXNPd25Qcm9wZXJ0eShwKSkgZFtwXSA9IGJbcF07IH07XG4gICAgICAgIHJldHVybiBleHRlbmRTdGF0aWNzKGQsIGIpO1xuICAgIH07XG4gICAgcmV0dXJuIGZ1bmN0aW9uIChkLCBiKSB7XG4gICAgICAgIGV4dGVuZFN0YXRpY3MoZCwgYik7XG4gICAgICAgIGZ1bmN0aW9uIF9fKCkgeyB0aGlzLmNvbnN0cnVjdG9yID0gZDsgfVxuICAgICAgICBkLnByb3RvdHlwZSA9IGIgPT09IG51bGwgPyBPYmplY3QuY3JlYXRlKGIpIDogKF9fLnByb3RvdHlwZSA9IGIucHJvdG90eXBlLCBuZXcgX18oKSk7XG4gICAgfTtcbn0pKCk7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgdnBzY18xID0gcmVxdWlyZShcIi4vdnBzY1wiKTtcbnZhciByYnRyZWVfMSA9IHJlcXVpcmUoXCIuL3JidHJlZVwiKTtcbmZ1bmN0aW9uIGNvbXB1dGVHcm91cEJvdW5kcyhnKSB7XG4gICAgZy5ib3VuZHMgPSB0eXBlb2YgZy5sZWF2ZXMgIT09IFwidW5kZWZpbmVkXCIgP1xuICAgICAgICBnLmxlYXZlcy5yZWR1Y2UoZnVuY3Rpb24gKHIsIGMpIHsgcmV0dXJuIGMuYm91bmRzLnVuaW9uKHIpOyB9LCBSZWN0YW5nbGUuZW1wdHkoKSkgOlxuICAgICAgICBSZWN0YW5nbGUuZW1wdHkoKTtcbiAgICBpZiAodHlwZW9mIGcuZ3JvdXBzICE9PSBcInVuZGVmaW5lZFwiKVxuICAgICAgICBnLmJvdW5kcyA9IGcuZ3JvdXBzLnJlZHVjZShmdW5jdGlvbiAociwgYykgeyByZXR1cm4gY29tcHV0ZUdyb3VwQm91bmRzKGMpLnVuaW9uKHIpOyB9LCBnLmJvdW5kcyk7XG4gICAgZy5ib3VuZHMgPSBnLmJvdW5kcy5pbmZsYXRlKGcucGFkZGluZyk7XG4gICAgcmV0dXJuIGcuYm91bmRzO1xufVxuZXhwb3J0cy5jb21wdXRlR3JvdXBCb3VuZHMgPSBjb21wdXRlR3JvdXBCb3VuZHM7XG52YXIgUmVjdGFuZ2xlID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBSZWN0YW5nbGUoeCwgWCwgeSwgWSkge1xuICAgICAgICB0aGlzLnggPSB4O1xuICAgICAgICB0aGlzLlggPSBYO1xuICAgICAgICB0aGlzLnkgPSB5O1xuICAgICAgICB0aGlzLlkgPSBZO1xuICAgIH1cbiAgICBSZWN0YW5nbGUuZW1wdHkgPSBmdW5jdGlvbiAoKSB7IHJldHVybiBuZXcgUmVjdGFuZ2xlKE51bWJlci5QT1NJVElWRV9JTkZJTklUWSwgTnVtYmVyLk5FR0FUSVZFX0lORklOSVRZLCBOdW1iZXIuUE9TSVRJVkVfSU5GSU5JVFksIE51bWJlci5ORUdBVElWRV9JTkZJTklUWSk7IH07XG4gICAgUmVjdGFuZ2xlLnByb3RvdHlwZS5jeCA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuICh0aGlzLnggKyB0aGlzLlgpIC8gMjsgfTtcbiAgICBSZWN0YW5nbGUucHJvdG90eXBlLmN5ID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gKHRoaXMueSArIHRoaXMuWSkgLyAyOyB9O1xuICAgIFJlY3RhbmdsZS5wcm90b3R5cGUub3ZlcmxhcFggPSBmdW5jdGlvbiAocikge1xuICAgICAgICB2YXIgdXggPSB0aGlzLmN4KCksIHZ4ID0gci5jeCgpO1xuICAgICAgICBpZiAodXggPD0gdnggJiYgci54IDwgdGhpcy5YKVxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuWCAtIHIueDtcbiAgICAgICAgaWYgKHZ4IDw9IHV4ICYmIHRoaXMueCA8IHIuWClcbiAgICAgICAgICAgIHJldHVybiByLlggLSB0aGlzLng7XG4gICAgICAgIHJldHVybiAwO1xuICAgIH07XG4gICAgUmVjdGFuZ2xlLnByb3RvdHlwZS5vdmVybGFwWSA9IGZ1bmN0aW9uIChyKSB7XG4gICAgICAgIHZhciB1eSA9IHRoaXMuY3koKSwgdnkgPSByLmN5KCk7XG4gICAgICAgIGlmICh1eSA8PSB2eSAmJiByLnkgPCB0aGlzLlkpXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5ZIC0gci55O1xuICAgICAgICBpZiAodnkgPD0gdXkgJiYgdGhpcy55IDwgci5ZKVxuICAgICAgICAgICAgcmV0dXJuIHIuWSAtIHRoaXMueTtcbiAgICAgICAgcmV0dXJuIDA7XG4gICAgfTtcbiAgICBSZWN0YW5nbGUucHJvdG90eXBlLnNldFhDZW50cmUgPSBmdW5jdGlvbiAoY3gpIHtcbiAgICAgICAgdmFyIGR4ID0gY3ggLSB0aGlzLmN4KCk7XG4gICAgICAgIHRoaXMueCArPSBkeDtcbiAgICAgICAgdGhpcy5YICs9IGR4O1xuICAgIH07XG4gICAgUmVjdGFuZ2xlLnByb3RvdHlwZS5zZXRZQ2VudHJlID0gZnVuY3Rpb24gKGN5KSB7XG4gICAgICAgIHZhciBkeSA9IGN5IC0gdGhpcy5jeSgpO1xuICAgICAgICB0aGlzLnkgKz0gZHk7XG4gICAgICAgIHRoaXMuWSArPSBkeTtcbiAgICB9O1xuICAgIFJlY3RhbmdsZS5wcm90b3R5cGUud2lkdGggPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLlggLSB0aGlzLng7XG4gICAgfTtcbiAgICBSZWN0YW5nbGUucHJvdG90eXBlLmhlaWdodCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuWSAtIHRoaXMueTtcbiAgICB9O1xuICAgIFJlY3RhbmdsZS5wcm90b3R5cGUudW5pb24gPSBmdW5jdGlvbiAocikge1xuICAgICAgICByZXR1cm4gbmV3IFJlY3RhbmdsZShNYXRoLm1pbih0aGlzLngsIHIueCksIE1hdGgubWF4KHRoaXMuWCwgci5YKSwgTWF0aC5taW4odGhpcy55LCByLnkpLCBNYXRoLm1heCh0aGlzLlksIHIuWSkpO1xuICAgIH07XG4gICAgUmVjdGFuZ2xlLnByb3RvdHlwZS5saW5lSW50ZXJzZWN0aW9ucyA9IGZ1bmN0aW9uICh4MSwgeTEsIHgyLCB5Mikge1xuICAgICAgICB2YXIgc2lkZXMgPSBbW3RoaXMueCwgdGhpcy55LCB0aGlzLlgsIHRoaXMueV0sXG4gICAgICAgICAgICBbdGhpcy5YLCB0aGlzLnksIHRoaXMuWCwgdGhpcy5ZXSxcbiAgICAgICAgICAgIFt0aGlzLlgsIHRoaXMuWSwgdGhpcy54LCB0aGlzLlldLFxuICAgICAgICAgICAgW3RoaXMueCwgdGhpcy5ZLCB0aGlzLngsIHRoaXMueV1dO1xuICAgICAgICB2YXIgaW50ZXJzZWN0aW9ucyA9IFtdO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IDQ7ICsraSkge1xuICAgICAgICAgICAgdmFyIHIgPSBSZWN0YW5nbGUubGluZUludGVyc2VjdGlvbih4MSwgeTEsIHgyLCB5Miwgc2lkZXNbaV1bMF0sIHNpZGVzW2ldWzFdLCBzaWRlc1tpXVsyXSwgc2lkZXNbaV1bM10pO1xuICAgICAgICAgICAgaWYgKHIgIT09IG51bGwpXG4gICAgICAgICAgICAgICAgaW50ZXJzZWN0aW9ucy5wdXNoKHsgeDogci54LCB5OiByLnkgfSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGludGVyc2VjdGlvbnM7XG4gICAgfTtcbiAgICBSZWN0YW5nbGUucHJvdG90eXBlLnJheUludGVyc2VjdGlvbiA9IGZ1bmN0aW9uICh4MiwgeTIpIHtcbiAgICAgICAgdmFyIGludHMgPSB0aGlzLmxpbmVJbnRlcnNlY3Rpb25zKHRoaXMuY3goKSwgdGhpcy5jeSgpLCB4MiwgeTIpO1xuICAgICAgICByZXR1cm4gaW50cy5sZW5ndGggPiAwID8gaW50c1swXSA6IG51bGw7XG4gICAgfTtcbiAgICBSZWN0YW5nbGUucHJvdG90eXBlLnZlcnRpY2VzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gW1xuICAgICAgICAgICAgeyB4OiB0aGlzLngsIHk6IHRoaXMueSB9LFxuICAgICAgICAgICAgeyB4OiB0aGlzLlgsIHk6IHRoaXMueSB9LFxuICAgICAgICAgICAgeyB4OiB0aGlzLlgsIHk6IHRoaXMuWSB9LFxuICAgICAgICAgICAgeyB4OiB0aGlzLngsIHk6IHRoaXMuWSB9XG4gICAgICAgIF07XG4gICAgfTtcbiAgICBSZWN0YW5nbGUubGluZUludGVyc2VjdGlvbiA9IGZ1bmN0aW9uICh4MSwgeTEsIHgyLCB5MiwgeDMsIHkzLCB4NCwgeTQpIHtcbiAgICAgICAgdmFyIGR4MTIgPSB4MiAtIHgxLCBkeDM0ID0geDQgLSB4MywgZHkxMiA9IHkyIC0geTEsIGR5MzQgPSB5NCAtIHkzLCBkZW5vbWluYXRvciA9IGR5MzQgKiBkeDEyIC0gZHgzNCAqIGR5MTI7XG4gICAgICAgIGlmIChkZW5vbWluYXRvciA9PSAwKVxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIHZhciBkeDMxID0geDEgLSB4MywgZHkzMSA9IHkxIC0geTMsIG51bWEgPSBkeDM0ICogZHkzMSAtIGR5MzQgKiBkeDMxLCBhID0gbnVtYSAvIGRlbm9taW5hdG9yLCBudW1iID0gZHgxMiAqIGR5MzEgLSBkeTEyICogZHgzMSwgYiA9IG51bWIgLyBkZW5vbWluYXRvcjtcbiAgICAgICAgaWYgKGEgPj0gMCAmJiBhIDw9IDEgJiYgYiA+PSAwICYmIGIgPD0gMSkge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICB4OiB4MSArIGEgKiBkeDEyLFxuICAgICAgICAgICAgICAgIHk6IHkxICsgYSAqIGR5MTJcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfTtcbiAgICBSZWN0YW5nbGUucHJvdG90eXBlLmluZmxhdGUgPSBmdW5jdGlvbiAocGFkKSB7XG4gICAgICAgIHJldHVybiBuZXcgUmVjdGFuZ2xlKHRoaXMueCAtIHBhZCwgdGhpcy5YICsgcGFkLCB0aGlzLnkgLSBwYWQsIHRoaXMuWSArIHBhZCk7XG4gICAgfTtcbiAgICByZXR1cm4gUmVjdGFuZ2xlO1xufSgpKTtcbmV4cG9ydHMuUmVjdGFuZ2xlID0gUmVjdGFuZ2xlO1xuZnVuY3Rpb24gbWFrZUVkZ2VCZXR3ZWVuKHNvdXJjZSwgdGFyZ2V0LCBhaCkge1xuICAgIHZhciBzaSA9IHNvdXJjZS5yYXlJbnRlcnNlY3Rpb24odGFyZ2V0LmN4KCksIHRhcmdldC5jeSgpKSB8fCB7IHg6IHNvdXJjZS5jeCgpLCB5OiBzb3VyY2UuY3koKSB9LCB0aSA9IHRhcmdldC5yYXlJbnRlcnNlY3Rpb24oc291cmNlLmN4KCksIHNvdXJjZS5jeSgpKSB8fCB7IHg6IHRhcmdldC5jeCgpLCB5OiB0YXJnZXQuY3koKSB9LCBkeCA9IHRpLnggLSBzaS54LCBkeSA9IHRpLnkgLSBzaS55LCBsID0gTWF0aC5zcXJ0KGR4ICogZHggKyBkeSAqIGR5KSwgYWwgPSBsIC0gYWg7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgc291cmNlSW50ZXJzZWN0aW9uOiBzaSxcbiAgICAgICAgdGFyZ2V0SW50ZXJzZWN0aW9uOiB0aSxcbiAgICAgICAgYXJyb3dTdGFydDogeyB4OiBzaS54ICsgYWwgKiBkeCAvIGwsIHk6IHNpLnkgKyBhbCAqIGR5IC8gbCB9XG4gICAgfTtcbn1cbmV4cG9ydHMubWFrZUVkZ2VCZXR3ZWVuID0gbWFrZUVkZ2VCZXR3ZWVuO1xuZnVuY3Rpb24gbWFrZUVkZ2VUbyhzLCB0YXJnZXQsIGFoKSB7XG4gICAgdmFyIHRpID0gdGFyZ2V0LnJheUludGVyc2VjdGlvbihzLngsIHMueSk7XG4gICAgaWYgKCF0aSlcbiAgICAgICAgdGkgPSB7IHg6IHRhcmdldC5jeCgpLCB5OiB0YXJnZXQuY3koKSB9O1xuICAgIHZhciBkeCA9IHRpLnggLSBzLngsIGR5ID0gdGkueSAtIHMueSwgbCA9IE1hdGguc3FydChkeCAqIGR4ICsgZHkgKiBkeSk7XG4gICAgcmV0dXJuIHsgeDogdGkueCAtIGFoICogZHggLyBsLCB5OiB0aS55IC0gYWggKiBkeSAvIGwgfTtcbn1cbmV4cG9ydHMubWFrZUVkZ2VUbyA9IG1ha2VFZGdlVG87XG52YXIgTm9kZSA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gTm9kZSh2LCByLCBwb3MpIHtcbiAgICAgICAgdGhpcy52ID0gdjtcbiAgICAgICAgdGhpcy5yID0gcjtcbiAgICAgICAgdGhpcy5wb3MgPSBwb3M7XG4gICAgICAgIHRoaXMucHJldiA9IG1ha2VSQlRyZWUoKTtcbiAgICAgICAgdGhpcy5uZXh0ID0gbWFrZVJCVHJlZSgpO1xuICAgIH1cbiAgICByZXR1cm4gTm9kZTtcbn0oKSk7XG52YXIgRXZlbnQgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIEV2ZW50KGlzT3BlbiwgdiwgcG9zKSB7XG4gICAgICAgIHRoaXMuaXNPcGVuID0gaXNPcGVuO1xuICAgICAgICB0aGlzLnYgPSB2O1xuICAgICAgICB0aGlzLnBvcyA9IHBvcztcbiAgICB9XG4gICAgcmV0dXJuIEV2ZW50O1xufSgpKTtcbmZ1bmN0aW9uIGNvbXBhcmVFdmVudHMoYSwgYikge1xuICAgIGlmIChhLnBvcyA+IGIucG9zKSB7XG4gICAgICAgIHJldHVybiAxO1xuICAgIH1cbiAgICBpZiAoYS5wb3MgPCBiLnBvcykge1xuICAgICAgICByZXR1cm4gLTE7XG4gICAgfVxuICAgIGlmIChhLmlzT3Blbikge1xuICAgICAgICByZXR1cm4gLTE7XG4gICAgfVxuICAgIGlmIChiLmlzT3Blbikge1xuICAgICAgICByZXR1cm4gMTtcbiAgICB9XG4gICAgcmV0dXJuIDA7XG59XG5mdW5jdGlvbiBtYWtlUkJUcmVlKCkge1xuICAgIHJldHVybiBuZXcgcmJ0cmVlXzEuUkJUcmVlKGZ1bmN0aW9uIChhLCBiKSB7IHJldHVybiBhLnBvcyAtIGIucG9zOyB9KTtcbn1cbnZhciB4UmVjdCA9IHtcbiAgICBnZXRDZW50cmU6IGZ1bmN0aW9uIChyKSB7IHJldHVybiByLmN4KCk7IH0sXG4gICAgZ2V0T3BlbjogZnVuY3Rpb24gKHIpIHsgcmV0dXJuIHIueTsgfSxcbiAgICBnZXRDbG9zZTogZnVuY3Rpb24gKHIpIHsgcmV0dXJuIHIuWTsgfSxcbiAgICBnZXRTaXplOiBmdW5jdGlvbiAocikgeyByZXR1cm4gci53aWR0aCgpOyB9LFxuICAgIG1ha2VSZWN0OiBmdW5jdGlvbiAob3BlbiwgY2xvc2UsIGNlbnRlciwgc2l6ZSkgeyByZXR1cm4gbmV3IFJlY3RhbmdsZShjZW50ZXIgLSBzaXplIC8gMiwgY2VudGVyICsgc2l6ZSAvIDIsIG9wZW4sIGNsb3NlKTsgfSxcbiAgICBmaW5kTmVpZ2hib3VyczogZmluZFhOZWlnaGJvdXJzXG59O1xudmFyIHlSZWN0ID0ge1xuICAgIGdldENlbnRyZTogZnVuY3Rpb24gKHIpIHsgcmV0dXJuIHIuY3koKTsgfSxcbiAgICBnZXRPcGVuOiBmdW5jdGlvbiAocikgeyByZXR1cm4gci54OyB9LFxuICAgIGdldENsb3NlOiBmdW5jdGlvbiAocikgeyByZXR1cm4gci5YOyB9LFxuICAgIGdldFNpemU6IGZ1bmN0aW9uIChyKSB7IHJldHVybiByLmhlaWdodCgpOyB9LFxuICAgIG1ha2VSZWN0OiBmdW5jdGlvbiAob3BlbiwgY2xvc2UsIGNlbnRlciwgc2l6ZSkgeyByZXR1cm4gbmV3IFJlY3RhbmdsZShvcGVuLCBjbG9zZSwgY2VudGVyIC0gc2l6ZSAvIDIsIGNlbnRlciArIHNpemUgLyAyKTsgfSxcbiAgICBmaW5kTmVpZ2hib3VyczogZmluZFlOZWlnaGJvdXJzXG59O1xuZnVuY3Rpb24gZ2VuZXJhdGVHcm91cENvbnN0cmFpbnRzKHJvb3QsIGYsIG1pblNlcCwgaXNDb250YWluZWQpIHtcbiAgICBpZiAoaXNDb250YWluZWQgPT09IHZvaWQgMCkgeyBpc0NvbnRhaW5lZCA9IGZhbHNlOyB9XG4gICAgdmFyIHBhZGRpbmcgPSByb290LnBhZGRpbmcsIGduID0gdHlwZW9mIHJvb3QuZ3JvdXBzICE9PSAndW5kZWZpbmVkJyA/IHJvb3QuZ3JvdXBzLmxlbmd0aCA6IDAsIGxuID0gdHlwZW9mIHJvb3QubGVhdmVzICE9PSAndW5kZWZpbmVkJyA/IHJvb3QubGVhdmVzLmxlbmd0aCA6IDAsIGNoaWxkQ29uc3RyYWludHMgPSAhZ24gPyBbXVxuICAgICAgICA6IHJvb3QuZ3JvdXBzLnJlZHVjZShmdW5jdGlvbiAoY2NzLCBnKSB7IHJldHVybiBjY3MuY29uY2F0KGdlbmVyYXRlR3JvdXBDb25zdHJhaW50cyhnLCBmLCBtaW5TZXAsIHRydWUpKTsgfSwgW10pLCBuID0gKGlzQ29udGFpbmVkID8gMiA6IDApICsgbG4gKyBnbiwgdnMgPSBuZXcgQXJyYXkobiksIHJzID0gbmV3IEFycmF5KG4pLCBpID0gMCwgYWRkID0gZnVuY3Rpb24gKHIsIHYpIHsgcnNbaV0gPSByOyB2c1tpKytdID0gdjsgfTtcbiAgICBpZiAoaXNDb250YWluZWQpIHtcbiAgICAgICAgdmFyIGIgPSByb290LmJvdW5kcywgYyA9IGYuZ2V0Q2VudHJlKGIpLCBzID0gZi5nZXRTaXplKGIpIC8gMiwgb3BlbiA9IGYuZ2V0T3BlbihiKSwgY2xvc2UgPSBmLmdldENsb3NlKGIpLCBtaW4gPSBjIC0gcyArIHBhZGRpbmcgLyAyLCBtYXggPSBjICsgcyAtIHBhZGRpbmcgLyAyO1xuICAgICAgICByb290Lm1pblZhci5kZXNpcmVkUG9zaXRpb24gPSBtaW47XG4gICAgICAgIGFkZChmLm1ha2VSZWN0KG9wZW4sIGNsb3NlLCBtaW4sIHBhZGRpbmcpLCByb290Lm1pblZhcik7XG4gICAgICAgIHJvb3QubWF4VmFyLmRlc2lyZWRQb3NpdGlvbiA9IG1heDtcbiAgICAgICAgYWRkKGYubWFrZVJlY3Qob3BlbiwgY2xvc2UsIG1heCwgcGFkZGluZyksIHJvb3QubWF4VmFyKTtcbiAgICB9XG4gICAgaWYgKGxuKVxuICAgICAgICByb290LmxlYXZlcy5mb3JFYWNoKGZ1bmN0aW9uIChsKSB7IHJldHVybiBhZGQobC5ib3VuZHMsIGwudmFyaWFibGUpOyB9KTtcbiAgICBpZiAoZ24pXG4gICAgICAgIHJvb3QuZ3JvdXBzLmZvckVhY2goZnVuY3Rpb24gKGcpIHtcbiAgICAgICAgICAgIHZhciBiID0gZy5ib3VuZHM7XG4gICAgICAgICAgICBhZGQoZi5tYWtlUmVjdChmLmdldE9wZW4oYiksIGYuZ2V0Q2xvc2UoYiksIGYuZ2V0Q2VudHJlKGIpLCBmLmdldFNpemUoYikpLCBnLm1pblZhcik7XG4gICAgICAgIH0pO1xuICAgIHZhciBjcyA9IGdlbmVyYXRlQ29uc3RyYWludHMocnMsIHZzLCBmLCBtaW5TZXApO1xuICAgIGlmIChnbikge1xuICAgICAgICB2cy5mb3JFYWNoKGZ1bmN0aW9uICh2KSB7IHYuY091dCA9IFtdLCB2LmNJbiA9IFtdOyB9KTtcbiAgICAgICAgY3MuZm9yRWFjaChmdW5jdGlvbiAoYykgeyBjLmxlZnQuY091dC5wdXNoKGMpLCBjLnJpZ2h0LmNJbi5wdXNoKGMpOyB9KTtcbiAgICAgICAgcm9vdC5ncm91cHMuZm9yRWFjaChmdW5jdGlvbiAoZykge1xuICAgICAgICAgICAgdmFyIGdhcEFkanVzdG1lbnQgPSAoZy5wYWRkaW5nIC0gZi5nZXRTaXplKGcuYm91bmRzKSkgLyAyO1xuICAgICAgICAgICAgZy5taW5WYXIuY0luLmZvckVhY2goZnVuY3Rpb24gKGMpIHsgcmV0dXJuIGMuZ2FwICs9IGdhcEFkanVzdG1lbnQ7IH0pO1xuICAgICAgICAgICAgZy5taW5WYXIuY091dC5mb3JFYWNoKGZ1bmN0aW9uIChjKSB7IGMubGVmdCA9IGcubWF4VmFyOyBjLmdhcCArPSBnYXBBZGp1c3RtZW50OyB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIHJldHVybiBjaGlsZENvbnN0cmFpbnRzLmNvbmNhdChjcyk7XG59XG5mdW5jdGlvbiBnZW5lcmF0ZUNvbnN0cmFpbnRzKHJzLCB2YXJzLCByZWN0LCBtaW5TZXApIHtcbiAgICB2YXIgaSwgbiA9IHJzLmxlbmd0aDtcbiAgICB2YXIgTiA9IDIgKiBuO1xuICAgIGNvbnNvbGUuYXNzZXJ0KHZhcnMubGVuZ3RoID49IG4pO1xuICAgIHZhciBldmVudHMgPSBuZXcgQXJyYXkoTik7XG4gICAgZm9yIChpID0gMDsgaSA8IG47ICsraSkge1xuICAgICAgICB2YXIgciA9IHJzW2ldO1xuICAgICAgICB2YXIgdiA9IG5ldyBOb2RlKHZhcnNbaV0sIHIsIHJlY3QuZ2V0Q2VudHJlKHIpKTtcbiAgICAgICAgZXZlbnRzW2ldID0gbmV3IEV2ZW50KHRydWUsIHYsIHJlY3QuZ2V0T3BlbihyKSk7XG4gICAgICAgIGV2ZW50c1tpICsgbl0gPSBuZXcgRXZlbnQoZmFsc2UsIHYsIHJlY3QuZ2V0Q2xvc2UocikpO1xuICAgIH1cbiAgICBldmVudHMuc29ydChjb21wYXJlRXZlbnRzKTtcbiAgICB2YXIgY3MgPSBuZXcgQXJyYXkoKTtcbiAgICB2YXIgc2NhbmxpbmUgPSBtYWtlUkJUcmVlKCk7XG4gICAgZm9yIChpID0gMDsgaSA8IE47ICsraSkge1xuICAgICAgICB2YXIgZSA9IGV2ZW50c1tpXTtcbiAgICAgICAgdmFyIHYgPSBlLnY7XG4gICAgICAgIGlmIChlLmlzT3Blbikge1xuICAgICAgICAgICAgc2NhbmxpbmUuaW5zZXJ0KHYpO1xuICAgICAgICAgICAgcmVjdC5maW5kTmVpZ2hib3Vycyh2LCBzY2FubGluZSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBzY2FubGluZS5yZW1vdmUodik7XG4gICAgICAgICAgICB2YXIgbWFrZUNvbnN0cmFpbnQgPSBmdW5jdGlvbiAobCwgcikge1xuICAgICAgICAgICAgICAgIHZhciBzZXAgPSAocmVjdC5nZXRTaXplKGwucikgKyByZWN0LmdldFNpemUoci5yKSkgLyAyICsgbWluU2VwO1xuICAgICAgICAgICAgICAgIGNzLnB1c2gobmV3IHZwc2NfMS5Db25zdHJhaW50KGwudiwgci52LCBzZXApKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICB2YXIgdmlzaXROZWlnaGJvdXJzID0gZnVuY3Rpb24gKGZvcndhcmQsIHJldmVyc2UsIG1rY29uKSB7XG4gICAgICAgICAgICAgICAgdmFyIHUsIGl0ID0gdltmb3J3YXJkXS5pdGVyYXRvcigpO1xuICAgICAgICAgICAgICAgIHdoaWxlICgodSA9IGl0W2ZvcndhcmRdKCkpICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIG1rY29uKHUsIHYpO1xuICAgICAgICAgICAgICAgICAgICB1W3JldmVyc2VdLnJlbW92ZSh2KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgdmlzaXROZWlnaGJvdXJzKFwicHJldlwiLCBcIm5leHRcIiwgZnVuY3Rpb24gKHUsIHYpIHsgcmV0dXJuIG1ha2VDb25zdHJhaW50KHUsIHYpOyB9KTtcbiAgICAgICAgICAgIHZpc2l0TmVpZ2hib3VycyhcIm5leHRcIiwgXCJwcmV2XCIsIGZ1bmN0aW9uICh1LCB2KSB7IHJldHVybiBtYWtlQ29uc3RyYWludCh2LCB1KTsgfSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgY29uc29sZS5hc3NlcnQoc2NhbmxpbmUuc2l6ZSA9PT0gMCk7XG4gICAgcmV0dXJuIGNzO1xufVxuZnVuY3Rpb24gZmluZFhOZWlnaGJvdXJzKHYsIHNjYW5saW5lKSB7XG4gICAgdmFyIGYgPSBmdW5jdGlvbiAoZm9yd2FyZCwgcmV2ZXJzZSkge1xuICAgICAgICB2YXIgaXQgPSBzY2FubGluZS5maW5kSXRlcih2KTtcbiAgICAgICAgdmFyIHU7XG4gICAgICAgIHdoaWxlICgodSA9IGl0W2ZvcndhcmRdKCkpICE9PSBudWxsKSB7XG4gICAgICAgICAgICB2YXIgdW92ZXJ2WCA9IHUuci5vdmVybGFwWCh2LnIpO1xuICAgICAgICAgICAgaWYgKHVvdmVydlggPD0gMCB8fCB1b3ZlcnZYIDw9IHUuci5vdmVybGFwWSh2LnIpKSB7XG4gICAgICAgICAgICAgICAgdltmb3J3YXJkXS5pbnNlcnQodSk7XG4gICAgICAgICAgICAgICAgdVtyZXZlcnNlXS5pbnNlcnQodik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodW92ZXJ2WCA8PSAwKSB7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuICAgIGYoXCJuZXh0XCIsIFwicHJldlwiKTtcbiAgICBmKFwicHJldlwiLCBcIm5leHRcIik7XG59XG5mdW5jdGlvbiBmaW5kWU5laWdoYm91cnModiwgc2NhbmxpbmUpIHtcbiAgICB2YXIgZiA9IGZ1bmN0aW9uIChmb3J3YXJkLCByZXZlcnNlKSB7XG4gICAgICAgIHZhciB1ID0gc2NhbmxpbmUuZmluZEl0ZXIodilbZm9yd2FyZF0oKTtcbiAgICAgICAgaWYgKHUgIT09IG51bGwgJiYgdS5yLm92ZXJsYXBYKHYucikgPiAwKSB7XG4gICAgICAgICAgICB2W2ZvcndhcmRdLmluc2VydCh1KTtcbiAgICAgICAgICAgIHVbcmV2ZXJzZV0uaW5zZXJ0KHYpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBmKFwibmV4dFwiLCBcInByZXZcIik7XG4gICAgZihcInByZXZcIiwgXCJuZXh0XCIpO1xufVxuZnVuY3Rpb24gZ2VuZXJhdGVYQ29uc3RyYWludHMocnMsIHZhcnMpIHtcbiAgICByZXR1cm4gZ2VuZXJhdGVDb25zdHJhaW50cyhycywgdmFycywgeFJlY3QsIDFlLTYpO1xufVxuZXhwb3J0cy5nZW5lcmF0ZVhDb25zdHJhaW50cyA9IGdlbmVyYXRlWENvbnN0cmFpbnRzO1xuZnVuY3Rpb24gZ2VuZXJhdGVZQ29uc3RyYWludHMocnMsIHZhcnMpIHtcbiAgICByZXR1cm4gZ2VuZXJhdGVDb25zdHJhaW50cyhycywgdmFycywgeVJlY3QsIDFlLTYpO1xufVxuZXhwb3J0cy5nZW5lcmF0ZVlDb25zdHJhaW50cyA9IGdlbmVyYXRlWUNvbnN0cmFpbnRzO1xuZnVuY3Rpb24gZ2VuZXJhdGVYR3JvdXBDb25zdHJhaW50cyhyb290KSB7XG4gICAgcmV0dXJuIGdlbmVyYXRlR3JvdXBDb25zdHJhaW50cyhyb290LCB4UmVjdCwgMWUtNik7XG59XG5leHBvcnRzLmdlbmVyYXRlWEdyb3VwQ29uc3RyYWludHMgPSBnZW5lcmF0ZVhHcm91cENvbnN0cmFpbnRzO1xuZnVuY3Rpb24gZ2VuZXJhdGVZR3JvdXBDb25zdHJhaW50cyhyb290KSB7XG4gICAgcmV0dXJuIGdlbmVyYXRlR3JvdXBDb25zdHJhaW50cyhyb290LCB5UmVjdCwgMWUtNik7XG59XG5leHBvcnRzLmdlbmVyYXRlWUdyb3VwQ29uc3RyYWludHMgPSBnZW5lcmF0ZVlHcm91cENvbnN0cmFpbnRzO1xuZnVuY3Rpb24gcmVtb3ZlT3ZlcmxhcHMocnMpIHtcbiAgICB2YXIgdnMgPSBycy5tYXAoZnVuY3Rpb24gKHIpIHsgcmV0dXJuIG5ldyB2cHNjXzEuVmFyaWFibGUoci5jeCgpKTsgfSk7XG4gICAgdmFyIGNzID0gZ2VuZXJhdGVYQ29uc3RyYWludHMocnMsIHZzKTtcbiAgICB2YXIgc29sdmVyID0gbmV3IHZwc2NfMS5Tb2x2ZXIodnMsIGNzKTtcbiAgICBzb2x2ZXIuc29sdmUoKTtcbiAgICB2cy5mb3JFYWNoKGZ1bmN0aW9uICh2LCBpKSB7IHJldHVybiByc1tpXS5zZXRYQ2VudHJlKHYucG9zaXRpb24oKSk7IH0pO1xuICAgIHZzID0gcnMubWFwKGZ1bmN0aW9uIChyKSB7IHJldHVybiBuZXcgdnBzY18xLlZhcmlhYmxlKHIuY3koKSk7IH0pO1xuICAgIGNzID0gZ2VuZXJhdGVZQ29uc3RyYWludHMocnMsIHZzKTtcbiAgICBzb2x2ZXIgPSBuZXcgdnBzY18xLlNvbHZlcih2cywgY3MpO1xuICAgIHNvbHZlci5zb2x2ZSgpO1xuICAgIHZzLmZvckVhY2goZnVuY3Rpb24gKHYsIGkpIHsgcmV0dXJuIHJzW2ldLnNldFlDZW50cmUodi5wb3NpdGlvbigpKTsgfSk7XG59XG5leHBvcnRzLnJlbW92ZU92ZXJsYXBzID0gcmVtb3ZlT3ZlcmxhcHM7XG52YXIgSW5kZXhlZFZhcmlhYmxlID0gKGZ1bmN0aW9uIChfc3VwZXIpIHtcbiAgICBfX2V4dGVuZHMoSW5kZXhlZFZhcmlhYmxlLCBfc3VwZXIpO1xuICAgIGZ1bmN0aW9uIEluZGV4ZWRWYXJpYWJsZShpbmRleCwgdykge1xuICAgICAgICB2YXIgX3RoaXMgPSBfc3VwZXIuY2FsbCh0aGlzLCAwLCB3KSB8fCB0aGlzO1xuICAgICAgICBfdGhpcy5pbmRleCA9IGluZGV4O1xuICAgICAgICByZXR1cm4gX3RoaXM7XG4gICAgfVxuICAgIHJldHVybiBJbmRleGVkVmFyaWFibGU7XG59KHZwc2NfMS5WYXJpYWJsZSkpO1xuZXhwb3J0cy5JbmRleGVkVmFyaWFibGUgPSBJbmRleGVkVmFyaWFibGU7XG52YXIgUHJvamVjdGlvbiA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gUHJvamVjdGlvbihub2RlcywgZ3JvdXBzLCByb290R3JvdXAsIGNvbnN0cmFpbnRzLCBhdm9pZE92ZXJsYXBzKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIGlmIChyb290R3JvdXAgPT09IHZvaWQgMCkgeyByb290R3JvdXAgPSBudWxsOyB9XG4gICAgICAgIGlmIChjb25zdHJhaW50cyA9PT0gdm9pZCAwKSB7IGNvbnN0cmFpbnRzID0gbnVsbDsgfVxuICAgICAgICBpZiAoYXZvaWRPdmVybGFwcyA9PT0gdm9pZCAwKSB7IGF2b2lkT3ZlcmxhcHMgPSBmYWxzZTsgfVxuICAgICAgICB0aGlzLm5vZGVzID0gbm9kZXM7XG4gICAgICAgIHRoaXMuZ3JvdXBzID0gZ3JvdXBzO1xuICAgICAgICB0aGlzLnJvb3RHcm91cCA9IHJvb3RHcm91cDtcbiAgICAgICAgdGhpcy5hdm9pZE92ZXJsYXBzID0gYXZvaWRPdmVybGFwcztcbiAgICAgICAgdGhpcy52YXJpYWJsZXMgPSBub2Rlcy5tYXAoZnVuY3Rpb24gKHYsIGkpIHtcbiAgICAgICAgICAgIHJldHVybiB2LnZhcmlhYmxlID0gbmV3IEluZGV4ZWRWYXJpYWJsZShpLCAxKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGlmIChjb25zdHJhaW50cylcbiAgICAgICAgICAgIHRoaXMuY3JlYXRlQ29uc3RyYWludHMoY29uc3RyYWludHMpO1xuICAgICAgICBpZiAoYXZvaWRPdmVybGFwcyAmJiByb290R3JvdXAgJiYgdHlwZW9mIHJvb3RHcm91cC5ncm91cHMgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICBub2Rlcy5mb3JFYWNoKGZ1bmN0aW9uICh2KSB7XG4gICAgICAgICAgICAgICAgaWYgKCF2LndpZHRoIHx8ICF2LmhlaWdodCkge1xuICAgICAgICAgICAgICAgICAgICB2LmJvdW5kcyA9IG5ldyBSZWN0YW5nbGUodi54LCB2LngsIHYueSwgdi55KTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB2YXIgdzIgPSB2LndpZHRoIC8gMiwgaDIgPSB2LmhlaWdodCAvIDI7XG4gICAgICAgICAgICAgICAgdi5ib3VuZHMgPSBuZXcgUmVjdGFuZ2xlKHYueCAtIHcyLCB2LnggKyB3Miwgdi55IC0gaDIsIHYueSArIGgyKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgY29tcHV0ZUdyb3VwQm91bmRzKHJvb3RHcm91cCk7XG4gICAgICAgICAgICB2YXIgaSA9IG5vZGVzLmxlbmd0aDtcbiAgICAgICAgICAgIGdyb3Vwcy5mb3JFYWNoKGZ1bmN0aW9uIChnKSB7XG4gICAgICAgICAgICAgICAgX3RoaXMudmFyaWFibGVzW2ldID0gZy5taW5WYXIgPSBuZXcgSW5kZXhlZFZhcmlhYmxlKGkrKywgdHlwZW9mIGcuc3RpZmZuZXNzICE9PSBcInVuZGVmaW5lZFwiID8gZy5zdGlmZm5lc3MgOiAwLjAxKTtcbiAgICAgICAgICAgICAgICBfdGhpcy52YXJpYWJsZXNbaV0gPSBnLm1heFZhciA9IG5ldyBJbmRleGVkVmFyaWFibGUoaSsrLCB0eXBlb2YgZy5zdGlmZm5lc3MgIT09IFwidW5kZWZpbmVkXCIgPyBnLnN0aWZmbmVzcyA6IDAuMDEpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgUHJvamVjdGlvbi5wcm90b3R5cGUuY3JlYXRlU2VwYXJhdGlvbiA9IGZ1bmN0aW9uIChjKSB7XG4gICAgICAgIHJldHVybiBuZXcgdnBzY18xLkNvbnN0cmFpbnQodGhpcy5ub2Rlc1tjLmxlZnRdLnZhcmlhYmxlLCB0aGlzLm5vZGVzW2MucmlnaHRdLnZhcmlhYmxlLCBjLmdhcCwgdHlwZW9mIGMuZXF1YWxpdHkgIT09IFwidW5kZWZpbmVkXCIgPyBjLmVxdWFsaXR5IDogZmFsc2UpO1xuICAgIH07XG4gICAgUHJvamVjdGlvbi5wcm90b3R5cGUubWFrZUZlYXNpYmxlID0gZnVuY3Rpb24gKGMpIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgaWYgKCF0aGlzLmF2b2lkT3ZlcmxhcHMpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIHZhciBheGlzID0gJ3gnLCBkaW0gPSAnd2lkdGgnO1xuICAgICAgICBpZiAoYy5heGlzID09PSAneCcpXG4gICAgICAgICAgICBheGlzID0gJ3knLCBkaW0gPSAnaGVpZ2h0JztcbiAgICAgICAgdmFyIHZzID0gYy5vZmZzZXRzLm1hcChmdW5jdGlvbiAobykgeyByZXR1cm4gX3RoaXMubm9kZXNbby5ub2RlXTsgfSkuc29ydChmdW5jdGlvbiAoYSwgYikgeyByZXR1cm4gYVtheGlzXSAtIGJbYXhpc107IH0pO1xuICAgICAgICB2YXIgcCA9IG51bGw7XG4gICAgICAgIHZzLmZvckVhY2goZnVuY3Rpb24gKHYpIHtcbiAgICAgICAgICAgIGlmIChwKSB7XG4gICAgICAgICAgICAgICAgdmFyIG5leHRQb3MgPSBwW2F4aXNdICsgcFtkaW1dO1xuICAgICAgICAgICAgICAgIGlmIChuZXh0UG9zID4gdltheGlzXSkge1xuICAgICAgICAgICAgICAgICAgICB2W2F4aXNdID0gbmV4dFBvcztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBwID0gdjtcbiAgICAgICAgfSk7XG4gICAgfTtcbiAgICBQcm9qZWN0aW9uLnByb3RvdHlwZS5jcmVhdGVBbGlnbm1lbnQgPSBmdW5jdGlvbiAoYykge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICB2YXIgdSA9IHRoaXMubm9kZXNbYy5vZmZzZXRzWzBdLm5vZGVdLnZhcmlhYmxlO1xuICAgICAgICB0aGlzLm1ha2VGZWFzaWJsZShjKTtcbiAgICAgICAgdmFyIGNzID0gYy5heGlzID09PSAneCcgPyB0aGlzLnhDb25zdHJhaW50cyA6IHRoaXMueUNvbnN0cmFpbnRzO1xuICAgICAgICBjLm9mZnNldHMuc2xpY2UoMSkuZm9yRWFjaChmdW5jdGlvbiAobykge1xuICAgICAgICAgICAgdmFyIHYgPSBfdGhpcy5ub2Rlc1tvLm5vZGVdLnZhcmlhYmxlO1xuICAgICAgICAgICAgY3MucHVzaChuZXcgdnBzY18xLkNvbnN0cmFpbnQodSwgdiwgby5vZmZzZXQsIHRydWUpKTtcbiAgICAgICAgfSk7XG4gICAgfTtcbiAgICBQcm9qZWN0aW9uLnByb3RvdHlwZS5jcmVhdGVDb25zdHJhaW50cyA9IGZ1bmN0aW9uIChjb25zdHJhaW50cykge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICB2YXIgaXNTZXAgPSBmdW5jdGlvbiAoYykgeyByZXR1cm4gdHlwZW9mIGMudHlwZSA9PT0gJ3VuZGVmaW5lZCcgfHwgYy50eXBlID09PSAnc2VwYXJhdGlvbic7IH07XG4gICAgICAgIHRoaXMueENvbnN0cmFpbnRzID0gY29uc3RyYWludHNcbiAgICAgICAgICAgIC5maWx0ZXIoZnVuY3Rpb24gKGMpIHsgcmV0dXJuIGMuYXhpcyA9PT0gXCJ4XCIgJiYgaXNTZXAoYyk7IH0pXG4gICAgICAgICAgICAubWFwKGZ1bmN0aW9uIChjKSB7IHJldHVybiBfdGhpcy5jcmVhdGVTZXBhcmF0aW9uKGMpOyB9KTtcbiAgICAgICAgdGhpcy55Q29uc3RyYWludHMgPSBjb25zdHJhaW50c1xuICAgICAgICAgICAgLmZpbHRlcihmdW5jdGlvbiAoYykgeyByZXR1cm4gYy5heGlzID09PSBcInlcIiAmJiBpc1NlcChjKTsgfSlcbiAgICAgICAgICAgIC5tYXAoZnVuY3Rpb24gKGMpIHsgcmV0dXJuIF90aGlzLmNyZWF0ZVNlcGFyYXRpb24oYyk7IH0pO1xuICAgICAgICBjb25zdHJhaW50c1xuICAgICAgICAgICAgLmZpbHRlcihmdW5jdGlvbiAoYykgeyByZXR1cm4gYy50eXBlID09PSAnYWxpZ25tZW50JzsgfSlcbiAgICAgICAgICAgIC5mb3JFYWNoKGZ1bmN0aW9uIChjKSB7IHJldHVybiBfdGhpcy5jcmVhdGVBbGlnbm1lbnQoYyk7IH0pO1xuICAgIH07XG4gICAgUHJvamVjdGlvbi5wcm90b3R5cGUuc2V0dXBWYXJpYWJsZXNBbmRCb3VuZHMgPSBmdW5jdGlvbiAoeDAsIHkwLCBkZXNpcmVkLCBnZXREZXNpcmVkKSB7XG4gICAgICAgIHRoaXMubm9kZXMuZm9yRWFjaChmdW5jdGlvbiAodiwgaSkge1xuICAgICAgICAgICAgaWYgKHYuZml4ZWQpIHtcbiAgICAgICAgICAgICAgICB2LnZhcmlhYmxlLndlaWdodCA9IHYuZml4ZWRXZWlnaHQgPyB2LmZpeGVkV2VpZ2h0IDogMTAwMDtcbiAgICAgICAgICAgICAgICBkZXNpcmVkW2ldID0gZ2V0RGVzaXJlZCh2KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHYudmFyaWFibGUud2VpZ2h0ID0gMTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciB3ID0gKHYud2lkdGggfHwgMCkgLyAyLCBoID0gKHYuaGVpZ2h0IHx8IDApIC8gMjtcbiAgICAgICAgICAgIHZhciBpeCA9IHgwW2ldLCBpeSA9IHkwW2ldO1xuICAgICAgICAgICAgdi5ib3VuZHMgPSBuZXcgUmVjdGFuZ2xlKGl4IC0gdywgaXggKyB3LCBpeSAtIGgsIGl5ICsgaCk7XG4gICAgICAgIH0pO1xuICAgIH07XG4gICAgUHJvamVjdGlvbi5wcm90b3R5cGUueFByb2plY3QgPSBmdW5jdGlvbiAoeDAsIHkwLCB4KSB7XG4gICAgICAgIGlmICghdGhpcy5yb290R3JvdXAgJiYgISh0aGlzLmF2b2lkT3ZlcmxhcHMgfHwgdGhpcy54Q29uc3RyYWludHMpKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB0aGlzLnByb2plY3QoeDAsIHkwLCB4MCwgeCwgZnVuY3Rpb24gKHYpIHsgcmV0dXJuIHYucHg7IH0sIHRoaXMueENvbnN0cmFpbnRzLCBnZW5lcmF0ZVhHcm91cENvbnN0cmFpbnRzLCBmdW5jdGlvbiAodikgeyByZXR1cm4gdi5ib3VuZHMuc2V0WENlbnRyZSh4W3YudmFyaWFibGUuaW5kZXhdID0gdi52YXJpYWJsZS5wb3NpdGlvbigpKTsgfSwgZnVuY3Rpb24gKGcpIHtcbiAgICAgICAgICAgIHZhciB4bWluID0geFtnLm1pblZhci5pbmRleF0gPSBnLm1pblZhci5wb3NpdGlvbigpO1xuICAgICAgICAgICAgdmFyIHhtYXggPSB4W2cubWF4VmFyLmluZGV4XSA9IGcubWF4VmFyLnBvc2l0aW9uKCk7XG4gICAgICAgICAgICB2YXIgcDIgPSBnLnBhZGRpbmcgLyAyO1xuICAgICAgICAgICAgZy5ib3VuZHMueCA9IHhtaW4gLSBwMjtcbiAgICAgICAgICAgIGcuYm91bmRzLlggPSB4bWF4ICsgcDI7XG4gICAgICAgIH0pO1xuICAgIH07XG4gICAgUHJvamVjdGlvbi5wcm90b3R5cGUueVByb2plY3QgPSBmdW5jdGlvbiAoeDAsIHkwLCB5KSB7XG4gICAgICAgIGlmICghdGhpcy5yb290R3JvdXAgJiYgIXRoaXMueUNvbnN0cmFpbnRzKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB0aGlzLnByb2plY3QoeDAsIHkwLCB5MCwgeSwgZnVuY3Rpb24gKHYpIHsgcmV0dXJuIHYucHk7IH0sIHRoaXMueUNvbnN0cmFpbnRzLCBnZW5lcmF0ZVlHcm91cENvbnN0cmFpbnRzLCBmdW5jdGlvbiAodikgeyByZXR1cm4gdi5ib3VuZHMuc2V0WUNlbnRyZSh5W3YudmFyaWFibGUuaW5kZXhdID0gdi52YXJpYWJsZS5wb3NpdGlvbigpKTsgfSwgZnVuY3Rpb24gKGcpIHtcbiAgICAgICAgICAgIHZhciB5bWluID0geVtnLm1pblZhci5pbmRleF0gPSBnLm1pblZhci5wb3NpdGlvbigpO1xuICAgICAgICAgICAgdmFyIHltYXggPSB5W2cubWF4VmFyLmluZGV4XSA9IGcubWF4VmFyLnBvc2l0aW9uKCk7XG4gICAgICAgICAgICB2YXIgcDIgPSBnLnBhZGRpbmcgLyAyO1xuICAgICAgICAgICAgZy5ib3VuZHMueSA9IHltaW4gLSBwMjtcbiAgICAgICAgICAgIDtcbiAgICAgICAgICAgIGcuYm91bmRzLlkgPSB5bWF4ICsgcDI7XG4gICAgICAgIH0pO1xuICAgIH07XG4gICAgUHJvamVjdGlvbi5wcm90b3R5cGUucHJvamVjdEZ1bmN0aW9ucyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgcmV0dXJuIFtcbiAgICAgICAgICAgIGZ1bmN0aW9uICh4MCwgeTAsIHgpIHsgcmV0dXJuIF90aGlzLnhQcm9qZWN0KHgwLCB5MCwgeCk7IH0sXG4gICAgICAgICAgICBmdW5jdGlvbiAoeDAsIHkwLCB5KSB7IHJldHVybiBfdGhpcy55UHJvamVjdCh4MCwgeTAsIHkpOyB9XG4gICAgICAgIF07XG4gICAgfTtcbiAgICBQcm9qZWN0aW9uLnByb3RvdHlwZS5wcm9qZWN0ID0gZnVuY3Rpb24gKHgwLCB5MCwgc3RhcnQsIGRlc2lyZWQsIGdldERlc2lyZWQsIGNzLCBnZW5lcmF0ZUNvbnN0cmFpbnRzLCB1cGRhdGVOb2RlQm91bmRzLCB1cGRhdGVHcm91cEJvdW5kcykge1xuICAgICAgICB0aGlzLnNldHVwVmFyaWFibGVzQW5kQm91bmRzKHgwLCB5MCwgZGVzaXJlZCwgZ2V0RGVzaXJlZCk7XG4gICAgICAgIGlmICh0aGlzLnJvb3RHcm91cCAmJiB0aGlzLmF2b2lkT3ZlcmxhcHMpIHtcbiAgICAgICAgICAgIGNvbXB1dGVHcm91cEJvdW5kcyh0aGlzLnJvb3RHcm91cCk7XG4gICAgICAgICAgICBjcyA9IGNzLmNvbmNhdChnZW5lcmF0ZUNvbnN0cmFpbnRzKHRoaXMucm9vdEdyb3VwKSk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5zb2x2ZSh0aGlzLnZhcmlhYmxlcywgY3MsIHN0YXJ0LCBkZXNpcmVkKTtcbiAgICAgICAgdGhpcy5ub2Rlcy5mb3JFYWNoKHVwZGF0ZU5vZGVCb3VuZHMpO1xuICAgICAgICBpZiAodGhpcy5yb290R3JvdXAgJiYgdGhpcy5hdm9pZE92ZXJsYXBzKSB7XG4gICAgICAgICAgICB0aGlzLmdyb3Vwcy5mb3JFYWNoKHVwZGF0ZUdyb3VwQm91bmRzKTtcbiAgICAgICAgICAgIGNvbXB1dGVHcm91cEJvdW5kcyh0aGlzLnJvb3RHcm91cCk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIFByb2plY3Rpb24ucHJvdG90eXBlLnNvbHZlID0gZnVuY3Rpb24gKHZzLCBjcywgc3RhcnRpbmcsIGRlc2lyZWQpIHtcbiAgICAgICAgdmFyIHNvbHZlciA9IG5ldyB2cHNjXzEuU29sdmVyKHZzLCBjcyk7XG4gICAgICAgIHNvbHZlci5zZXRTdGFydGluZ1Bvc2l0aW9ucyhzdGFydGluZyk7XG4gICAgICAgIHNvbHZlci5zZXREZXNpcmVkUG9zaXRpb25zKGRlc2lyZWQpO1xuICAgICAgICBzb2x2ZXIuc29sdmUoKTtcbiAgICB9O1xuICAgIHJldHVybiBQcm9qZWN0aW9uO1xufSgpKTtcbmV4cG9ydHMuUHJvamVjdGlvbiA9IFByb2plY3Rpb247XG4vLyMgc291cmNlTWFwcGluZ1VSTD1kYXRhOmFwcGxpY2F0aW9uL2pzb247YmFzZTY0LGV5SjJaWEp6YVc5dUlqb3pMQ0ptYVd4bElqb2ljbVZqZEdGdVoyeGxMbXB6SWl3aWMyOTFjbU5sVW05dmRDSTZJaUlzSW5OdmRYSmpaWE1pT2xzaUxpNHZMaTR2VjJWaVEyOXNZUzl6Y21NdmNtVmpkR0Z1WjJ4bExuUnpJbDBzSW01aGJXVnpJanBiWFN3aWJXRndjR2x1WjNNaU9pSTdPenM3T3pzN096czdPenM3T3p0QlFVRkJMQ3RDUVVGdFJEdEJRVU51UkN4dFEwRkJLMEk3UVVGclFqTkNMRk5CUVdkQ0xHdENRVUZyUWl4RFFVRkRMRU5CUVd0Q08wbEJRMnBFTEVOQlFVTXNRMEZCUXl4TlFVRk5MRWRCUVVjc1QwRkJUeXhEUVVGRExFTkJRVU1zVFVGQlRTeExRVUZMTEZkQlFWY3NRMEZCUXl4RFFVRkRPMUZCUTNoRExFTkJRVU1zUTBGQlF5eE5RVUZOTEVOQlFVTXNUVUZCVFN4RFFVRkRMRlZCUVVNc1EwRkJXU3hGUVVGRkxFTkJRVU1zU1VGQlN5eFBRVUZCTEVOQlFVTXNRMEZCUXl4TlFVRk5MRU5CUVVNc1MwRkJTeXhEUVVGRExFTkJRVU1zUTBGQlF5eEZRVUZxUWl4RFFVRnBRaXhGUVVGRkxGTkJRVk1zUTBGQlF5eExRVUZMTEVWQlFVVXNRMEZCUXl4RFFVRkRMRU5CUVVNN1VVRkROVVVzVTBGQlV5eERRVUZETEV0QlFVc3NSVUZCUlN4RFFVRkRPMGxCUTNSQ0xFbEJRVWtzVDBGQlR5eERRVUZETEVOQlFVTXNUVUZCVFN4TFFVRkxMRmRCUVZjN1VVRkRMMElzUTBGQlF5eERRVUZETEUxQlFVMHNSMEZCWXl4RFFVRkRMRU5CUVVNc1RVRkJUU3hEUVVGRExFMUJRVTBzUTBGQlF5eFZRVUZETEVOQlFWa3NSVUZCUlN4RFFVRkRMRWxCUVVzc1QwRkJRU3hyUWtGQmEwSXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhMUVVGTExFTkJRVU1zUTBGQlF5eERRVUZETEVWQlFUbENMRU5CUVRoQ0xFVkJRVVVzUTBGQlF5eERRVUZETEUxQlFVMHNRMEZCUXl4RFFVRkRPMGxCUTNwSExFTkJRVU1zUTBGQlF5eE5RVUZOTEVkQlFVY3NRMEZCUXl4RFFVRkRMRTFCUVUwc1EwRkJReXhQUVVGUExFTkJRVU1zUTBGQlF5eERRVUZETEU5QlFVOHNRMEZCUXl4RFFVRkRPMGxCUTNaRExFOUJRVThzUTBGQlF5eERRVUZETEUxQlFVMHNRMEZCUXp0QlFVTndRaXhEUVVGRE8wRkJVa1FzWjBSQlVVTTdRVUZGUkR0SlFVTkpMRzFDUVVOWExFTkJRVk1zUlVGRFZDeERRVUZUTEVWQlExUXNRMEZCVXl4RlFVTlVMRU5CUVZNN1VVRklWQ3hOUVVGRExFZEJRVVFzUTBGQlF5eERRVUZSTzFGQlExUXNUVUZCUXl4SFFVRkVMRU5CUVVNc1EwRkJVVHRSUVVOVUxFMUJRVU1zUjBGQlJDeERRVUZETEVOQlFWRTdVVUZEVkN4TlFVRkRMRWRCUVVRc1EwRkJReXhEUVVGUk8wbEJRVWtzUTBGQlF6dEpRVVZzUWl4bFFVRkxMRWRCUVZvc1kwRkJORUlzVDBGQlR5eEpRVUZKTEZOQlFWTXNRMEZCUXl4TlFVRk5MRU5CUVVNc2FVSkJRV2xDTEVWQlFVVXNUVUZCVFN4RFFVRkRMR2xDUVVGcFFpeEZRVUZGTEUxQlFVMHNRMEZCUXl4cFFrRkJhVUlzUlVGQlJTeE5RVUZOTEVOQlFVTXNhVUpCUVdsQ0xFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTTdTVUZGTTBvc2MwSkJRVVVzUjBGQlJpeGpRVUZsTEU5QlFVOHNRMEZCUXl4SlFVRkpMRU5CUVVNc1EwRkJReXhIUVVGSExFbEJRVWtzUTBGQlF5eERRVUZETEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRE8wbEJSVGxETEhOQ1FVRkZMRWRCUVVZc1kwRkJaU3hQUVVGUExFTkJRVU1zU1VGQlNTeERRVUZETEVOQlFVTXNSMEZCUnl4SlFVRkpMRU5CUVVNc1EwRkJReXhEUVVGRExFZEJRVWNzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0SlFVVTVReXcwUWtGQlVTeEhRVUZTTEZWQlFWTXNRMEZCV1R0UlFVTnFRaXhKUVVGSkxFVkJRVVVzUjBGQlJ5eEpRVUZKTEVOQlFVTXNSVUZCUlN4RlFVRkZMRVZCUVVVc1JVRkJSU3hIUVVGSExFTkJRVU1zUTBGQlF5eEZRVUZGTEVWQlFVVXNRMEZCUXp0UlFVTm9ReXhKUVVGSkxFVkJRVVVzU1VGQlNTeEZRVUZGTEVsQlFVa3NRMEZCUXl4RFFVRkRMRU5CUVVNc1IwRkJSeXhKUVVGSkxFTkJRVU1zUTBGQlF6dFpRVUZGTEU5QlFVOHNTVUZCU1N4RFFVRkRMRU5CUVVNc1IwRkJSeXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETzFGQlEyeEVMRWxCUVVrc1JVRkJSU3hKUVVGSkxFVkJRVVVzU1VGQlNTeEpRVUZKTEVOQlFVTXNRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJReXhEUVVGRE8xbEJRVVVzVDBGQlR5eERRVUZETEVOQlFVTXNRMEZCUXl4SFFVRkhMRWxCUVVrc1EwRkJReXhEUVVGRExFTkJRVU03VVVGRGJFUXNUMEZCVHl4RFFVRkRMRU5CUVVNN1NVRkRZaXhEUVVGRE8wbEJSVVFzTkVKQlFWRXNSMEZCVWl4VlFVRlRMRU5CUVZrN1VVRkRha0lzU1VGQlNTeEZRVUZGTEVkQlFVY3NTVUZCU1N4RFFVRkRMRVZCUVVVc1JVRkJSU3hGUVVGRkxFVkJRVVVzUjBGQlJ5eERRVUZETEVOQlFVTXNSVUZCUlN4RlFVRkZMRU5CUVVNN1VVRkRhRU1zU1VGQlNTeEZRVUZGTEVsQlFVa3NSVUZCUlN4SlFVRkpMRU5CUVVNc1EwRkJReXhEUVVGRExFZEJRVWNzU1VGQlNTeERRVUZETEVOQlFVTTdXVUZCUlN4UFFVRlBMRWxCUVVrc1EwRkJReXhEUVVGRExFZEJRVWNzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0UlFVTnNSQ3hKUVVGSkxFVkJRVVVzU1VGQlNTeEZRVUZGTEVsQlFVa3NTVUZCU1N4RFFVRkRMRU5CUVVNc1IwRkJSeXhEUVVGRExFTkJRVU1zUTBGQlF6dFpRVUZGTEU5QlFVOHNRMEZCUXl4RFFVRkRMRU5CUVVNc1IwRkJSeXhKUVVGSkxFTkJRVU1zUTBGQlF5eERRVUZETzFGQlEyeEVMRTlCUVU4c1EwRkJReXhEUVVGRE8wbEJRMklzUTBGQlF6dEpRVVZFTERoQ1FVRlZMRWRCUVZZc1ZVRkJWeXhGUVVGVk8xRkJRMnBDTEVsQlFVa3NSVUZCUlN4SFFVRkhMRVZCUVVVc1IwRkJSeXhKUVVGSkxFTkJRVU1zUlVGQlJTeEZRVUZGTEVOQlFVTTdVVUZEZUVJc1NVRkJTU3hEUVVGRExFTkJRVU1zU1VGQlNTeEZRVUZGTEVOQlFVTTdVVUZEWWl4SlFVRkpMRU5CUVVNc1EwRkJReXhKUVVGSkxFVkJRVVVzUTBGQlF6dEpRVU5xUWl4RFFVRkRPMGxCUlVRc09FSkJRVlVzUjBGQlZpeFZRVUZYTEVWQlFWVTdVVUZEYWtJc1NVRkJTU3hGUVVGRkxFZEJRVWNzUlVGQlJTeEhRVUZITEVsQlFVa3NRMEZCUXl4RlFVRkZMRVZCUVVVc1EwRkJRenRSUVVONFFpeEpRVUZKTEVOQlFVTXNRMEZCUXl4SlFVRkpMRVZCUVVVc1EwRkJRenRSUVVOaUxFbEJRVWtzUTBGQlF5eERRVUZETEVsQlFVa3NSVUZCUlN4RFFVRkRPMGxCUTJwQ0xFTkJRVU03U1VGRlJDeDVRa0ZCU3l4SFFVRk1PMUZCUTBrc1QwRkJUeXhKUVVGSkxFTkJRVU1zUTBGQlF5eEhRVUZITEVsQlFVa3NRMEZCUXl4RFFVRkRMRU5CUVVNN1NVRkRNMElzUTBGQlF6dEpRVVZFTERCQ1FVRk5MRWRCUVU0N1VVRkRTU3hQUVVGUExFbEJRVWtzUTBGQlF5eERRVUZETEVkQlFVY3NTVUZCU1N4RFFVRkRMRU5CUVVNc1EwRkJRenRKUVVNelFpeERRVUZETzBsQlJVUXNlVUpCUVVzc1IwRkJUQ3hWUVVGTkxFTkJRVms3VVVGRFpDeFBRVUZQTEVsQlFVa3NVMEZCVXl4RFFVRkRMRWxCUVVrc1EwRkJReXhIUVVGSExFTkJRVU1zU1VGQlNTeERRVUZETEVOQlFVTXNSVUZCUlN4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFVkJRVVVzU1VGQlNTeERRVUZETEVkQlFVY3NRMEZCUXl4SlFVRkpMRU5CUVVNc1EwRkJReXhGUVVGRkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNSVUZCUlN4SlFVRkpMRU5CUVVNc1IwRkJSeXhEUVVGRExFbEJRVWtzUTBGQlF5eERRVUZETEVWQlFVVXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhGUVVGRkxFbEJRVWtzUTBGQlF5eEhRVUZITEVOQlFVTXNTVUZCU1N4RFFVRkRMRU5CUVVNc1JVRkJSU3hEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0SlFVTnlTQ3hEUVVGRE8wbEJWMFFzY1VOQlFXbENMRWRCUVdwQ0xGVkJRV3RDTEVWQlFWVXNSVUZCUlN4RlFVRlZMRVZCUVVVc1JVRkJWU3hGUVVGRkxFVkJRVlU3VVVGRE5VUXNTVUZCU1N4TFFVRkxMRWRCUVVjc1EwRkJReXhEUVVGRExFbEJRVWtzUTBGQlF5eERRVUZETEVWQlFVVXNTVUZCU1N4RFFVRkRMRU5CUVVNc1JVRkJSU3hKUVVGSkxFTkJRVU1zUTBGQlF5eEZRVUZGTEVsQlFVa3NRMEZCUXl4RFFVRkRMRU5CUVVNN1dVRkRja01zUTBGQlF5eEpRVUZKTEVOQlFVTXNRMEZCUXl4RlFVRkZMRWxCUVVrc1EwRkJReXhEUVVGRExFVkJRVVVzU1VGQlNTeERRVUZETEVOQlFVTXNSVUZCUlN4SlFVRkpMRU5CUVVNc1EwRkJReXhEUVVGRE8xbEJRMmhETEVOQlFVTXNTVUZCU1N4RFFVRkRMRU5CUVVNc1JVRkJSU3hKUVVGSkxFTkJRVU1zUTBGQlF5eEZRVUZGTEVsQlFVa3NRMEZCUXl4RFFVRkRMRVZCUVVVc1NVRkJTU3hEUVVGRExFTkJRVU1zUTBGQlF6dFpRVU53UXl4RFFVRkRMRWxCUVVrc1EwRkJReXhEUVVGRExFVkJRVVVzU1VGQlNTeERRVUZETEVOQlFVTXNSVUZCUlN4SlFVRkpMRU5CUVVNc1EwRkJReXhGUVVGRkxFbEJRVWtzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRPMUZCUTNSRExFbEJRVWtzWVVGQllTeEhRVUZITEVWQlFVVXNRMEZCUXp0UlFVTjJRaXhMUVVGTExFbEJRVWtzUTBGQlF5eEhRVUZITEVOQlFVTXNSVUZCUlN4RFFVRkRMRWRCUVVjc1EwRkJReXhGUVVGRkxFVkJRVVVzUTBGQlF5eEZRVUZGTzFsQlEzaENMRWxCUVVrc1EwRkJReXhIUVVGSExGTkJRVk1zUTBGQlF5eG5Ra0ZCWjBJc1EwRkJReXhGUVVGRkxFVkJRVVVzUlVGQlJTeEZRVUZGTEVWQlFVVXNSVUZCUlN4RlFVRkZMRVZCUVVVc1MwRkJTeXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RlFVRkZMRXRCUVVzc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNSVUZCUlN4TFFVRkxMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVWQlFVVXNTMEZCU3l4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTTdXVUZEZGtjc1NVRkJTU3hEUVVGRExFdEJRVXNzU1VGQlNUdG5Ra0ZCUlN4aFFVRmhMRU5CUVVNc1NVRkJTU3hEUVVGRExFVkJRVVVzUTBGQlF5eEZRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRMRVZCUVVVc1EwRkJReXhGUVVGRkxFTkJRVU1zUTBGQlF5eERRVUZETEVWQlFVVXNRMEZCUXl4RFFVRkRPMU5CUXpGRU8xRkJRMFFzVDBGQlR5eGhRVUZoTEVOQlFVTTdTVUZEZWtJc1EwRkJRenRKUVZWRUxHMURRVUZsTEVkQlFXWXNWVUZCWjBJc1JVRkJWU3hGUVVGRkxFVkJRVlU3VVVGRGJFTXNTVUZCU1N4SlFVRkpMRWRCUVVjc1NVRkJTU3hEUVVGRExHbENRVUZwUWl4RFFVRkRMRWxCUVVrc1EwRkJReXhGUVVGRkxFVkJRVVVzUlVGQlJTeEpRVUZKTEVOQlFVTXNSVUZCUlN4RlFVRkZMRVZCUVVVc1JVRkJSU3hGUVVGRkxFVkJRVVVzUTBGQlF5eERRVUZETzFGQlEyaEZMRTlCUVU4c1NVRkJTU3hEUVVGRExFMUJRVTBzUjBGQlJ5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRWxCUVVrc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNTVUZCU1N4RFFVRkRPMGxCUXpWRExFTkJRVU03U1VGRlJDdzBRa0ZCVVN4SFFVRlNPMUZCUTBrc1QwRkJUenRaUVVOSUxFVkJRVVVzUTBGQlF5eEZRVUZGTEVsQlFVa3NRMEZCUXl4RFFVRkRMRVZCUVVVc1EwRkJReXhGUVVGRkxFbEJRVWtzUTBGQlF5eERRVUZETEVWQlFVVTdXVUZEZUVJc1JVRkJSU3hEUVVGRExFVkJRVVVzU1VGQlNTeERRVUZETEVOQlFVTXNSVUZCUlN4RFFVRkRMRVZCUVVVc1NVRkJTU3hEUVVGRExFTkJRVU1zUlVGQlJUdFpRVU40UWl4RlFVRkZMRU5CUVVNc1JVRkJSU3hKUVVGSkxFTkJRVU1zUTBGQlF5eEZRVUZGTEVOQlFVTXNSVUZCUlN4SlFVRkpMRU5CUVVNc1EwRkJReXhGUVVGRk8xbEJRM2hDTEVWQlFVVXNRMEZCUXl4RlFVRkZMRWxCUVVrc1EwRkJReXhEUVVGRExFVkJRVVVzUTBGQlF5eEZRVUZGTEVsQlFVa3NRMEZCUXl4RFFVRkRMRVZCUVVVN1UwRkJReXhEUVVGRE8wbEJRMnhETEVOQlFVTTdTVUZGVFN3d1FrRkJaMElzUjBGQmRrSXNWVUZEU1N4RlFVRlZMRVZCUVVVc1JVRkJWU3hGUVVOMFFpeEZRVUZWTEVWQlFVVXNSVUZCVlN4RlFVTjBRaXhGUVVGVkxFVkJRVVVzUlVGQlZTeEZRVU4wUWl4RlFVRlZMRVZCUVVVc1JVRkJWVHRSUVVOMFFpeEpRVUZKTEVsQlFVa3NSMEZCUnl4RlFVRkZMRWRCUVVjc1JVRkJSU3hGUVVGRkxFbEJRVWtzUjBGQlJ5eEZRVUZGTEVkQlFVY3NSVUZCUlN4RlFVTTVRaXhKUVVGSkxFZEJRVWNzUlVGQlJTeEhRVUZITEVWQlFVVXNSVUZCUlN4SlFVRkpMRWRCUVVjc1JVRkJSU3hIUVVGSExFVkJRVVVzUlVGRE9VSXNWMEZCVnl4SFFVRkhMRWxCUVVrc1IwRkJSeXhKUVVGSkxFZEJRVWNzU1VGQlNTeEhRVUZITEVsQlFVa3NRMEZCUXp0UlFVTTFReXhKUVVGSkxGZEJRVmNzU1VGQlNTeERRVUZETzFsQlFVVXNUMEZCVHl4SlFVRkpMRU5CUVVNN1VVRkRiRU1zU1VGQlNTeEpRVUZKTEVkQlFVY3NSVUZCUlN4SFFVRkhMRVZCUVVVc1JVRkJSU3hKUVVGSkxFZEJRVWNzUlVGQlJTeEhRVUZITEVWQlFVVXNSVUZET1VJc1NVRkJTU3hIUVVGSExFbEJRVWtzUjBGQlJ5eEpRVUZKTEVkQlFVY3NTVUZCU1N4SFFVRkhMRWxCUVVrc1JVRkRhRU1zUTBGQlF5eEhRVUZITEVsQlFVa3NSMEZCUnl4WFFVRlhMRVZCUTNSQ0xFbEJRVWtzUjBGQlJ5eEpRVUZKTEVkQlFVY3NTVUZCU1N4SFFVRkhMRWxCUVVrc1IwRkJSeXhKUVVGSkxFVkJRMmhETEVOQlFVTXNSMEZCUnl4SlFVRkpMRWRCUVVjc1YwRkJWeXhEUVVGRE8xRkJRek5DTEVsQlFVa3NRMEZCUXl4SlFVRkpMRU5CUVVNc1NVRkJTU3hEUVVGRExFbEJRVWtzUTBGQlF5eEpRVUZKTEVOQlFVTXNTVUZCU1N4RFFVRkRMRWxCUVVrc1EwRkJReXhKUVVGSkxFTkJRVU1zUlVGQlJUdFpRVU4wUXl4UFFVRlBPMmRDUVVOSUxFTkJRVU1zUlVGQlJTeEZRVUZGTEVkQlFVY3NRMEZCUXl4SFFVRkhMRWxCUVVrN1owSkJRMmhDTEVOQlFVTXNSVUZCUlN4RlFVRkZMRWRCUVVjc1EwRkJReXhIUVVGSExFbEJRVWs3WVVGRGJrSXNRMEZCUXp0VFFVTk1PMUZCUTBRc1QwRkJUeXhKUVVGSkxFTkJRVU03U1VGRGFFSXNRMEZCUXp0SlFVVkVMREpDUVVGUExFZEJRVkFzVlVGQlVTeEhRVUZYTzFGQlEyWXNUMEZCVHl4SlFVRkpMRk5CUVZNc1EwRkJReXhKUVVGSkxFTkJRVU1zUTBGQlF5eEhRVUZITEVkQlFVY3NSVUZCUlN4SlFVRkpMRU5CUVVNc1EwRkJReXhIUVVGSExFZEJRVWNzUlVGQlJTeEpRVUZKTEVOQlFVTXNRMEZCUXl4SFFVRkhMRWRCUVVjc1JVRkJSU3hKUVVGSkxFTkJRVU1zUTBGQlF5eEhRVUZITEVkQlFVY3NRMEZCUXl4RFFVRkRPMGxCUTJwR0xFTkJRVU03U1VGRFRDeG5Ra0ZCUXp0QlFVRkVMRU5CUVVNc1FVRjRTRVFzU1VGM1NFTTdRVUY0U0Zrc09FSkJRVk03UVVGeFNYUkNMRk5CUVdkQ0xHVkJRV1VzUTBGQlF5eE5RVUZwUWl4RlFVRkZMRTFCUVdsQ0xFVkJRVVVzUlVGQlZUdEpRVVUxUlN4SlFVRk5MRVZCUVVVc1IwRkJSeXhOUVVGTkxFTkJRVU1zWlVGQlpTeERRVUZETEUxQlFVMHNRMEZCUXl4RlFVRkZMRVZCUVVVc1JVRkJSU3hOUVVGTkxFTkJRVU1zUlVGQlJTeEZRVUZGTEVOQlFVTXNTVUZCU1N4RlFVRkZMRU5CUVVNc1JVRkJSU3hOUVVGTkxFTkJRVU1zUlVGQlJTeEZRVUZGTEVWQlFVVXNRMEZCUXl4RlFVRkZMRTFCUVUwc1EwRkJReXhGUVVGRkxFVkJRVVVzUlVGQlJTeEZRVU0zUml4RlFVRkZMRWRCUVVjc1RVRkJUU3hEUVVGRExHVkJRV1VzUTBGQlF5eE5RVUZOTEVOQlFVTXNSVUZCUlN4RlFVRkZMRVZCUVVVc1RVRkJUU3hEUVVGRExFVkJRVVVzUlVGQlJTeERRVUZETEVsQlFVa3NSVUZCUlN4RFFVRkRMRVZCUVVVc1RVRkJUU3hEUVVGRExFVkJRVVVzUlVGQlJTeEZRVUZGTEVOQlFVTXNSVUZCUlN4TlFVRk5MRU5CUVVNc1JVRkJSU3hGUVVGRkxFVkJRVVVzUlVGRE0wWXNSVUZCUlN4SFFVRkhMRVZCUVVVc1EwRkJReXhEUVVGRExFZEJRVWNzUlVGQlJTeERRVUZETEVOQlFVTXNSVUZEYUVJc1JVRkJSU3hIUVVGSExFVkJRVVVzUTBGQlF5eERRVUZETEVkQlFVY3NSVUZCUlN4RFFVRkRMRU5CUVVNc1JVRkRhRUlzUTBGQlF5eEhRVUZITEVsQlFVa3NRMEZCUXl4SlFVRkpMRU5CUVVNc1JVRkJSU3hIUVVGSExFVkJRVVVzUjBGQlJ5eEZRVUZGTEVkQlFVY3NSVUZCUlN4RFFVRkRMRVZCUVVVc1JVRkJSU3hIUVVGSExFTkJRVU1zUjBGQlJ5eEZRVUZGTEVOQlFVTTdTVUZEYkVRc1QwRkJUenRSUVVOSUxHdENRVUZyUWl4RlFVRkZMRVZCUVVVN1VVRkRkRUlzYTBKQlFXdENMRVZCUVVVc1JVRkJSVHRSUVVOMFFpeFZRVUZWTEVWQlFVVXNSVUZCUlN4RFFVRkRMRVZCUVVVc1JVRkJSU3hEUVVGRExFTkJRVU1zUjBGQlJ5eEZRVUZGTEVkQlFVY3NSVUZCUlN4SFFVRkhMRU5CUVVNc1JVRkJSU3hEUVVGRExFVkJRVVVzUlVGQlJTeERRVUZETEVOQlFVTXNSMEZCUnl4RlFVRkZMRWRCUVVjc1JVRkJSU3hIUVVGSExFTkJRVU1zUlVGQlJUdExRVU12UkN4RFFVRkJPMEZCUTB3c1EwRkJRenRCUVZwRUxEQkRRVmxETzBGQlYwUXNVMEZCWjBJc1ZVRkJWU3hEUVVGRExFTkJRVEpDTEVWQlFVVXNUVUZCYVVJc1JVRkJSU3hGUVVGVk8wbEJRMnBHTEVsQlFVa3NSVUZCUlN4SFFVRkhMRTFCUVUwc1EwRkJReXhsUVVGbExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNSVUZCUlN4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU03U1VGRE1VTXNTVUZCU1N4RFFVRkRMRVZCUVVVN1VVRkJSU3hGUVVGRkxFZEJRVWNzUlVGQlJTeERRVUZETEVWQlFVVXNUVUZCVFN4RFFVRkRMRVZCUVVVc1JVRkJSU3hGUVVGRkxFTkJRVU1zUlVGQlJTeE5RVUZOTEVOQlFVTXNSVUZCUlN4RlFVRkZMRVZCUVVVc1EwRkJRenRKUVVOcVJDeEpRVUZKTEVWQlFVVXNSMEZCUnl4RlFVRkZMRU5CUVVNc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF5eERRVUZETEVWQlEyWXNSVUZCUlN4SFFVRkhMRVZCUVVVc1EwRkJReXhEUVVGRExFZEJRVWNzUTBGQlF5eERRVUZETEVOQlFVTXNSVUZEWml4RFFVRkRMRWRCUVVjc1NVRkJTU3hEUVVGRExFbEJRVWtzUTBGQlF5eEZRVUZGTEVkQlFVY3NSVUZCUlN4SFFVRkhMRVZCUVVVc1IwRkJSeXhGUVVGRkxFTkJRVU1zUTBGQlF6dEpRVU55UXl4UFFVRlBMRVZCUVVVc1EwRkJReXhGUVVGRkxFVkJRVVVzUTBGQlF5eERRVUZETEVkQlFVY3NSVUZCUlN4SFFVRkhMRVZCUVVVc1IwRkJSeXhEUVVGRExFVkJRVVVzUTBGQlF5eEZRVUZGTEVWQlFVVXNRMEZCUXl4RFFVRkRMRWRCUVVjc1JVRkJSU3hIUVVGSExFVkJRVVVzUjBGQlJ5eERRVUZETEVWQlFVVXNRMEZCUXp0QlFVTTFSQ3hEUVVGRE8wRkJVRVFzWjBOQlQwTTdRVUZGUkR0SlFVbEpMR05CUVcxQ0xFTkJRVmNzUlVGQlV5eERRVUZaTEVWQlFWTXNSMEZCVnp0UlFVRndSQ3hOUVVGRExFZEJRVVFzUTBGQlF5eERRVUZWTzFGQlFWTXNUVUZCUXl4SFFVRkVMRU5CUVVNc1EwRkJWenRSUVVGVExGRkJRVWNzUjBGQlNDeEhRVUZITEVOQlFWRTdVVUZEYmtVc1NVRkJTU3hEUVVGRExFbEJRVWtzUjBGQlJ5eFZRVUZWTEVWQlFVVXNRMEZCUXp0UlFVTjZRaXhKUVVGSkxFTkJRVU1zU1VGQlNTeEhRVUZITEZWQlFWVXNSVUZCUlN4RFFVRkRPMGxCUXpkQ0xFTkJRVU03U1VGRFRDeFhRVUZETzBGQlFVUXNRMEZCUXl4QlFWSkVMRWxCVVVNN1FVRkZSRHRKUVVOSkxHVkJRVzFDTEUxQlFXVXNSVUZCVXl4RFFVRlBMRVZCUVZNc1IwRkJWenRSUVVGdVJDeFhRVUZOTEVkQlFVNHNUVUZCVFN4RFFVRlRPMUZCUVZNc1RVRkJReXhIUVVGRUxFTkJRVU1zUTBGQlRUdFJRVUZUTEZGQlFVY3NSMEZCU0N4SFFVRkhMRU5CUVZFN1NVRkJSeXhEUVVGRE8wbEJRemxGTEZsQlFVTTdRVUZCUkN4RFFVRkRMRUZCUmtRc1NVRkZRenRCUVVWRUxGTkJRVk1zWVVGQllTeERRVUZETEVOQlFWRXNSVUZCUlN4RFFVRlJPMGxCUTNKRExFbEJRVWtzUTBGQlF5eERRVUZETEVkQlFVY3NSMEZCUnl4RFFVRkRMRU5CUVVNc1IwRkJSeXhGUVVGRk8xRkJRMllzVDBGQlR5eERRVUZETEVOQlFVTTdTMEZEV2p0SlFVTkVMRWxCUVVrc1EwRkJReXhEUVVGRExFZEJRVWNzUjBGQlJ5eERRVUZETEVOQlFVTXNSMEZCUnl4RlFVRkZPMUZCUTJZc1QwRkJUeXhEUVVGRExFTkJRVU1zUTBGQlF6dExRVU5pTzBsQlEwUXNTVUZCU1N4RFFVRkRMRU5CUVVNc1RVRkJUU3hGUVVGRk8xRkJSVllzVDBGQlR5eERRVUZETEVOQlFVTXNRMEZCUXp0TFFVTmlPMGxCUTBRc1NVRkJTU3hEUVVGRExFTkJRVU1zVFVGQlRTeEZRVUZGTzFGQlJWWXNUMEZCVHl4RFFVRkRMRU5CUVVNN1MwRkRXanRKUVVORUxFOUJRVThzUTBGQlF5eERRVUZETzBGQlEySXNRMEZCUXp0QlFVVkVMRk5CUVZNc1ZVRkJWVHRKUVVObUxFOUJRVThzU1VGQlNTeGxRVUZOTEVOQlFVOHNWVUZCUXl4RFFVRkRMRVZCUVVVc1EwRkJReXhKUVVGTExFOUJRVUVzUTBGQlF5eERRVUZETEVkQlFVY3NSMEZCUnl4RFFVRkRMRU5CUVVNc1IwRkJSeXhGUVVGaUxFTkJRV0VzUTBGQlF5eERRVUZETzBGQlEzSkVMRU5CUVVNN1FVRlhSQ3hKUVVGSkxFdEJRVXNzUjBGQmEwSTdTVUZEZGtJc1UwRkJVeXhGUVVGRkxGVkJRVUVzUTBGQlF5eEpRVUZITEU5QlFVRXNRMEZCUXl4RFFVRkRMRVZCUVVVc1JVRkJSU3hGUVVGT0xFTkJRVTA3U1VGRGNrSXNUMEZCVHl4RlFVRkZMRlZCUVVFc1EwRkJReXhKUVVGSExFOUJRVUVzUTBGQlF5eERRVUZETEVOQlFVTXNSVUZCU0N4RFFVRkhPMGxCUTJoQ0xGRkJRVkVzUlVGQlJTeFZRVUZCTEVOQlFVTXNTVUZCUnl4UFFVRkJMRU5CUVVNc1EwRkJReXhEUVVGRExFVkJRVWdzUTBGQlJ6dEpRVU5xUWl4UFFVRlBMRVZCUVVVc1ZVRkJRU3hEUVVGRExFbEJRVWNzVDBGQlFTeERRVUZETEVOQlFVTXNTMEZCU3l4RlFVRkZMRVZCUVZRc1EwRkJVenRKUVVOMFFpeFJRVUZSTEVWQlFVVXNWVUZCUXl4SlFVRkpMRVZCUVVVc1MwRkJTeXhGUVVGRkxFMUJRVTBzUlVGQlJTeEpRVUZKTEVsQlFVc3NUMEZCUVN4SlFVRkpMRk5CUVZNc1EwRkJReXhOUVVGTkxFZEJRVWNzU1VGQlNTeEhRVUZITEVOQlFVTXNSVUZCUlN4TlFVRk5MRWRCUVVjc1NVRkJTU3hIUVVGSExFTkJRVU1zUlVGQlJTeEpRVUZKTEVWQlFVVXNTMEZCU3l4RFFVRkRMRVZCUVdoRkxFTkJRV2RGTzBsQlEzcEhMR05CUVdNc1JVRkJSU3hsUVVGbE8wTkJRMnhETEVOQlFVTTdRVUZGUml4SlFVRkpMRXRCUVVzc1IwRkJhMEk3U1VGRGRrSXNVMEZCVXl4RlFVRkZMRlZCUVVFc1EwRkJReXhKUVVGSExFOUJRVUVzUTBGQlF5eERRVUZETEVWQlFVVXNSVUZCUlN4RlFVRk9MRU5CUVUwN1NVRkRja0lzVDBGQlR5eEZRVUZGTEZWQlFVRXNRMEZCUXl4SlFVRkhMRTlCUVVFc1EwRkJReXhEUVVGRExFTkJRVU1zUlVGQlNDeERRVUZITzBsQlEyaENMRkZCUVZFc1JVRkJSU3hWUVVGQkxFTkJRVU1zU1VGQlJ5eFBRVUZCTEVOQlFVTXNRMEZCUXl4RFFVRkRMRVZCUVVnc1EwRkJSenRKUVVOcVFpeFBRVUZQTEVWQlFVVXNWVUZCUVN4RFFVRkRMRWxCUVVjc1QwRkJRU3hEUVVGRExFTkJRVU1zVFVGQlRTeEZRVUZGTEVWQlFWWXNRMEZCVlR0SlFVTjJRaXhSUVVGUkxFVkJRVVVzVlVGQlF5eEpRVUZKTEVWQlFVVXNTMEZCU3l4RlFVRkZMRTFCUVUwc1JVRkJSU3hKUVVGSkxFbEJRVXNzVDBGQlFTeEpRVUZKTEZOQlFWTXNRMEZCUXl4SlFVRkpMRVZCUVVVc1MwRkJTeXhGUVVGRkxFMUJRVTBzUjBGQlJ5eEpRVUZKTEVkQlFVY3NRMEZCUXl4RlFVRkZMRTFCUVUwc1IwRkJSeXhKUVVGSkxFZEJRVWNzUTBGQlF5eERRVUZETEVWQlFXaEZMRU5CUVdkRk8wbEJRM3BITEdOQlFXTXNSVUZCUlN4bFFVRmxPME5CUTJ4RExFTkJRVU03UVVGRlJpeFRRVUZUTEhkQ1FVRjNRaXhEUVVGRExFbEJRWEZDTEVWQlFVVXNRMEZCWjBJc1JVRkJSU3hOUVVGakxFVkJRVVVzVjBGQk5FSTdTVUZCTlVJc05FSkJRVUVzUlVGQlFTeHRRa0ZCTkVJN1NVRkZia2dzU1VGQlNTeFBRVUZQTEVkQlFVY3NTVUZCU1N4RFFVRkRMRTlCUVU4c1JVRkRkRUlzUlVGQlJTeEhRVUZITEU5QlFVOHNTVUZCU1N4RFFVRkRMRTFCUVUwc1MwRkJTeXhYUVVGWExFTkJRVU1zUTBGQlF5eERRVUZETEVsQlFVa3NRMEZCUXl4TlFVRk5MRU5CUVVNc1RVRkJUU3hEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVWQlEyaEZMRVZCUVVVc1IwRkJSeXhQUVVGUExFbEJRVWtzUTBGQlF5eE5RVUZOTEV0QlFVc3NWMEZCVnl4RFFVRkRMRU5CUVVNc1EwRkJReXhKUVVGSkxFTkJRVU1zVFVGQlRTeERRVUZETEUxQlFVMHNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhGUVVOb1JTeG5Ra0ZCWjBJc1IwRkJhVUlzUTBGQlF5eEZRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRMRVZCUVVVN1VVRkRla01zUTBGQlF5eERRVUZETEVsQlFVa3NRMEZCUXl4TlFVRk5MRU5CUVVNc1RVRkJUU3hEUVVGRExGVkJRVU1zUjBGQmFVSXNSVUZCUlN4RFFVRkRMRWxCUVVzc1QwRkJRU3hIUVVGSExFTkJRVU1zVFVGQlRTeERRVUZETEhkQ1FVRjNRaXhEUVVGRExFTkJRVU1zUlVGQlJTeERRVUZETEVWQlFVVXNUVUZCVFN4RlFVRkZMRWxCUVVrc1EwRkJReXhEUVVGRExFVkJRWGhFTEVOQlFYZEVMRVZCUVVVc1JVRkJSU3hEUVVGRExFVkJRelZITEVOQlFVTXNSMEZCUnl4RFFVRkRMRmRCUVZjc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1IwRkJSeXhGUVVGRkxFZEJRVWNzUlVGQlJTeEZRVU51UXl4RlFVRkZMRWRCUVdVc1NVRkJTU3hMUVVGTExFTkJRVU1zUTBGQlF5eERRVUZETEVWQlF6ZENMRVZCUVVVc1IwRkJaMElzU1VGQlNTeExRVUZMTEVOQlFVTXNRMEZCUXl4RFFVRkRMRVZCUXpsQ0xFTkJRVU1zUjBGQlJ5eERRVUZETEVWQlEwd3NSMEZCUnl4SFFVRkhMRlZCUVVNc1EwRkJReXhGUVVGRkxFTkJRVU1zU1VGQlR5eEZRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRExFTkJRVU1zUlVGQlJTeERRVUZETEVOQlFVTXNSVUZCUlN4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGQkxFTkJRVU1zUTBGQlF5eERRVUZETzBsQlF5OURMRWxCUVVrc1YwRkJWeXhGUVVGRk8xRkJSV0lzU1VGQlNTeERRVUZETEVkQlFXTXNTVUZCU1N4RFFVRkRMRTFCUVUwc1JVRkRNVUlzUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXl4VFFVRlRMRU5CUVVNc1EwRkJReXhEUVVGRExFVkJRVVVzUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXl4UFFVRlBMRU5CUVVNc1EwRkJReXhEUVVGRExFZEJRVWNzUTBGQlF5eEZRVU40UXl4SlFVRkpMRWRCUVVjc1EwRkJReXhEUVVGRExFOUJRVThzUTBGQlF5eERRVUZETEVOQlFVTXNSVUZCUlN4TFFVRkxMRWRCUVVjc1EwRkJReXhEUVVGRExGRkJRVkVzUTBGQlF5eERRVUZETEVOQlFVTXNSVUZETVVNc1IwRkJSeXhIUVVGSExFTkJRVU1zUjBGQlJ5eERRVUZETEVkQlFVY3NUMEZCVHl4SFFVRkhMRU5CUVVNc1JVRkJSU3hIUVVGSExFZEJRVWNzUTBGQlF5eEhRVUZITEVOQlFVTXNSMEZCUnl4UFFVRlBMRWRCUVVjc1EwRkJReXhEUVVGRE8xRkJRM3BFTEVsQlFVa3NRMEZCUXl4TlFVRk5MRU5CUVVNc1pVRkJaU3hIUVVGSExFZEJRVWNzUTBGQlF6dFJRVU5zUXl4SFFVRkhMRU5CUVVNc1EwRkJReXhEUVVGRExGRkJRVkVzUTBGQlF5eEpRVUZKTEVWQlFVVXNTMEZCU3l4RlFVRkZMRWRCUVVjc1JVRkJSU3hQUVVGUExFTkJRVU1zUlVGQlJTeEpRVUZKTEVOQlFVTXNUVUZCVFN4RFFVRkRMRU5CUVVNN1VVRkRlRVFzU1VGQlNTeERRVUZETEUxQlFVMHNRMEZCUXl4bFFVRmxMRWRCUVVjc1IwRkJSeXhEUVVGRE8xRkJRMnhETEVkQlFVY3NRMEZCUXl4RFFVRkRMRU5CUVVNc1VVRkJVU3hEUVVGRExFbEJRVWtzUlVGQlJTeExRVUZMTEVWQlFVVXNSMEZCUnl4RlFVRkZMRTlCUVU4c1EwRkJReXhGUVVGRkxFbEJRVWtzUTBGQlF5eE5RVUZOTEVOQlFVTXNRMEZCUXp0TFFVTXpSRHRKUVVORUxFbEJRVWtzUlVGQlJUdFJRVUZGTEVsQlFVa3NRMEZCUXl4TlFVRk5MRU5CUVVNc1QwRkJUeXhEUVVGRExGVkJRVUVzUTBGQlF5eEpRVUZKTEU5QlFVRXNSMEZCUnl4RFFVRkRMRU5CUVVNc1EwRkJReXhOUVVGTkxFVkJRVVVzUTBGQlF5eERRVUZETEZGQlFWRXNRMEZCUXl4RlFVRjZRaXhEUVVGNVFpeERRVUZETEVOQlFVTTdTVUZETlVRc1NVRkJTU3hGUVVGRk8xRkJRVVVzU1VGQlNTeERRVUZETEUxQlFVMHNRMEZCUXl4UFFVRlBMRU5CUVVNc1ZVRkJRU3hEUVVGRE8xbEJRM3BDTEVsQlFVa3NRMEZCUXl4SFFVRmpMRU5CUVVNc1EwRkJReXhOUVVGTkxFTkJRVU03V1VGRE5VSXNSMEZCUnl4RFFVRkRMRU5CUVVNc1EwRkJReXhSUVVGUkxFTkJRVU1zUTBGQlF5eERRVUZETEU5QlFVOHNRMEZCUXl4RFFVRkRMRU5CUVVNc1JVRkJSU3hEUVVGRExFTkJRVU1zVVVGQlVTeERRVUZETEVOQlFVTXNRMEZCUXl4RlFVRkZMRU5CUVVNc1EwRkJReXhUUVVGVExFTkJRVU1zUTBGQlF5eERRVUZETEVWQlFVVXNRMEZCUXl4RFFVRkRMRTlCUVU4c1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eEZRVUZGTEVOQlFVTXNRMEZCUXl4TlFVRk5MRU5CUVVNc1EwRkJRenRSUVVONlJpeERRVUZETEVOQlFVTXNRMEZCUXp0SlFVTklMRWxCUVVrc1JVRkJSU3hIUVVGSExHMUNRVUZ0UWl4RFFVRkRMRVZCUVVVc1JVRkJSU3hGUVVGRkxFVkJRVVVzUTBGQlF5eEZRVUZGTEUxQlFVMHNRMEZCUXl4RFFVRkRPMGxCUTJoRUxFbEJRVWtzUlVGQlJTeEZRVUZGTzFGQlEwb3NSVUZCUlN4RFFVRkRMRTlCUVU4c1EwRkJReXhWUVVGQkxFTkJRVU1zU1VGQlRTeERRVUZETEVOQlFVTXNTVUZCU1N4SFFVRkhMRVZCUVVVc1JVRkJSU3hEUVVGRExFTkJRVU1zUjBGQlJ5eEhRVUZITEVWQlFVVXNRMEZCUVN4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRE8xRkJRemRETEVWQlFVVXNRMEZCUXl4UFFVRlBMRU5CUVVNc1ZVRkJRU3hEUVVGRExFbEJRVTBzUTBGQlF5eERRVUZETEVsQlFVa3NRMEZCUXl4SlFVRkpMRU5CUVVNc1NVRkJTU3hEUVVGRExFTkJRVU1zUTBGQlF5eEZRVUZGTEVOQlFVTXNRMEZCUXl4TFFVRkxMRU5CUVVNc1IwRkJSeXhEUVVGRExFbEJRVWtzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUVN4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRE8xRkJRemxFTEVsQlFVa3NRMEZCUXl4TlFVRk5MRU5CUVVNc1QwRkJUeXhEUVVGRExGVkJRVUVzUTBGQlF6dFpRVU5xUWl4SlFVRkpMR0ZCUVdFc1IwRkJSeXhEUVVGRExFTkJRVU1zUTBGQlF5eFBRVUZQTEVkQlFVY3NRMEZCUXl4RFFVRkRMRTlCUVU4c1EwRkJReXhEUVVGRExFTkJRVU1zVFVGQlRTeERRVUZETEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNN1dVRkRNVVFzUTBGQlF5eERRVUZETEUxQlFVMHNRMEZCUXl4SFFVRkhMRU5CUVVNc1QwRkJUeXhEUVVGRExGVkJRVUVzUTBGQlF5eEpRVUZKTEU5QlFVRXNRMEZCUXl4RFFVRkRMRWRCUVVjc1NVRkJTU3hoUVVGaExFVkJRWFJDTEVOQlFYTkNMRU5CUVVNc1EwRkJRenRaUVVOc1JDeERRVUZETEVOQlFVTXNUVUZCVFN4RFFVRkRMRWxCUVVrc1EwRkJReXhQUVVGUExFTkJRVU1zVlVGQlFTeERRVUZETEVsQlFVMHNRMEZCUXl4RFFVRkRMRWxCUVVrc1IwRkJSeXhEUVVGRExFTkJRVU1zVFVGQlRTeERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRWRCUVVjc1NVRkJTU3hoUVVGaExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0UlFVTXZSU3hEUVVGRExFTkJRVU1zUTBGQlF6dExRVU5PTzBsQlEwUXNUMEZCVHl4blFrRkJaMElzUTBGQlF5eE5RVUZOTEVOQlFVTXNSVUZCUlN4RFFVRkRMRU5CUVVNN1FVRkRka01zUTBGQlF6dEJRVVZFTEZOQlFWTXNiVUpCUVcxQ0xFTkJRVU1zUlVGQlpTeEZRVUZGTEVsQlFXZENMRVZCUXpGRUxFbEJRVzFDTEVWQlFVVXNUVUZCWXp0SlFVVnVReXhKUVVGSkxFTkJRVU1zUlVGQlJTeERRVUZETEVkQlFVY3NSVUZCUlN4RFFVRkRMRTFCUVUwc1EwRkJRenRKUVVOeVFpeEpRVUZKTEVOQlFVTXNSMEZCUnl4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRE8wbEJRMlFzVDBGQlR5eERRVUZETEUxQlFVMHNRMEZCUXl4SlFVRkpMRU5CUVVNc1RVRkJUU3hKUVVGSkxFTkJRVU1zUTBGQlF5eERRVUZETzBsQlEycERMRWxCUVVrc1RVRkJUU3hIUVVGSExFbEJRVWtzUzBGQlN5eERRVUZSTEVOQlFVTXNRMEZCUXl4RFFVRkRPMGxCUTJwRExFdEJRVXNzUTBGQlF5eEhRVUZITEVOQlFVTXNSVUZCUlN4RFFVRkRMRWRCUVVjc1EwRkJReXhGUVVGRkxFVkJRVVVzUTBGQlF5eEZRVUZGTzFGQlEzQkNMRWxCUVVrc1EwRkJReXhIUVVGSExFVkJRVVVzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0UlFVTmtMRWxCUVVrc1EwRkJReXhIUVVGSExFbEJRVWtzU1VGQlNTeERRVUZETEVsQlFVa3NRMEZCUXl4RFFVRkRMRU5CUVVNc1JVRkJSU3hEUVVGRExFVkJRVVVzU1VGQlNTeERRVUZETEZOQlFWTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRE8xRkJRMmhFTEUxQlFVMHNRMEZCUXl4RFFVRkRMRU5CUVVNc1IwRkJSeXhKUVVGSkxFdEJRVXNzUTBGQlF5eEpRVUZKTEVWQlFVVXNRMEZCUXl4RlFVRkZMRWxCUVVrc1EwRkJReXhQUVVGUExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0UlFVTm9SQ3hOUVVGTkxFTkJRVU1zUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXl4SFFVRkhMRWxCUVVrc1MwRkJTeXhEUVVGRExFdEJRVXNzUlVGQlJTeERRVUZETEVWQlFVVXNTVUZCU1N4RFFVRkRMRkZCUVZFc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETzB0QlEzcEVPMGxCUTBRc1RVRkJUU3hEUVVGRExFbEJRVWtzUTBGQlF5eGhRVUZoTEVOQlFVTXNRMEZCUXp0SlFVTXpRaXhKUVVGSkxFVkJRVVVzUjBGQlJ5eEpRVUZKTEV0QlFVc3NSVUZCWXl4RFFVRkRPMGxCUTJwRExFbEJRVWtzVVVGQlVTeEhRVUZITEZWQlFWVXNSVUZCUlN4RFFVRkRPMGxCUXpWQ0xFdEJRVXNzUTBGQlF5eEhRVUZITEVOQlFVTXNSVUZCUlN4RFFVRkRMRWRCUVVjc1EwRkJReXhGUVVGRkxFVkJRVVVzUTBGQlF5eEZRVUZGTzFGQlEzQkNMRWxCUVVrc1EwRkJReXhIUVVGSExFMUJRVTBzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0UlFVTnNRaXhKUVVGSkxFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRPMUZCUTFvc1NVRkJTU3hEUVVGRExFTkJRVU1zVFVGQlRTeEZRVUZGTzFsQlExWXNVVUZCVVN4RFFVRkRMRTFCUVUwc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dFpRVU51UWl4SlFVRkpMRU5CUVVNc1kwRkJZeXhEUVVGRExFTkJRVU1zUlVGQlJTeFJRVUZSTEVOQlFVTXNRMEZCUXp0VFFVTndRenRoUVVGTk8xbEJSVWdzVVVGQlVTeERRVUZETEUxQlFVMHNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJRenRaUVVOdVFpeEpRVUZKTEdOQlFXTXNSMEZCUnl4VlFVRkRMRU5CUVVNc1JVRkJSU3hEUVVGRE8yZENRVU4wUWl4SlFVRkpMRWRCUVVjc1IwRkJSeXhEUVVGRExFbEJRVWtzUTBGQlF5eFBRVUZQTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhIUVVGSExFbEJRVWtzUTBGQlF5eFBRVUZQTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFZEJRVWNzUTBGQlF5eEhRVUZITEUxQlFVMHNRMEZCUXp0blFrRkRMMFFzUlVGQlJTeERRVUZETEVsQlFVa3NRMEZCUXl4SlFVRkpMR2xDUVVGVkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNSVUZCUlN4RFFVRkRMRU5CUVVNc1EwRkJReXhGUVVGRkxFZEJRVWNzUTBGQlF5eERRVUZETEVOQlFVTTdXVUZETTBNc1EwRkJReXhEUVVGRE8xbEJRMFlzU1VGQlNTeGxRVUZsTEVkQlFVY3NWVUZCUXl4UFFVRlBMRVZCUVVVc1QwRkJUeXhGUVVGRkxFdEJRVXM3WjBKQlF6RkRMRWxCUVVrc1EwRkJReXhGUVVGRkxFVkJRVVVzUjBGQlJ5eERRVUZETEVOQlFVTXNUMEZCVHl4RFFVRkRMRU5CUVVNc1VVRkJVU3hGUVVGRkxFTkJRVU03WjBKQlEyeERMRTlCUVU4c1EwRkJReXhEUVVGRExFZEJRVWNzUlVGQlJTeERRVUZETEU5QlFVOHNRMEZCUXl4RlFVRkZMRU5CUVVNc1MwRkJTeXhKUVVGSkxFVkJRVVU3YjBKQlEycERMRXRCUVVzc1EwRkJReXhEUVVGRExFVkJRVVVzUTBGQlF5eERRVUZETEVOQlFVTTdiMEpCUTFvc1EwRkJReXhEUVVGRExFOUJRVThzUTBGQlF5eERRVUZETEUxQlFVMHNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJRenRwUWtGRGVFSTdXVUZEVEN4RFFVRkRMRU5CUVVNN1dVRkRSaXhsUVVGbExFTkJRVU1zVFVGQlRTeEZRVUZGTEUxQlFVMHNSVUZCUlN4VlFVRkRMRU5CUVVNc1JVRkJSU3hEUVVGRExFbEJRVXNzVDBGQlFTeGpRVUZqTEVOQlFVTXNRMEZCUXl4RlFVRkZMRU5CUVVNc1EwRkJReXhGUVVGd1FpeERRVUZ2UWl4RFFVRkRMRU5CUVVNN1dVRkRhRVVzWlVGQlpTeERRVUZETEUxQlFVMHNSVUZCUlN4TlFVRk5MRVZCUVVVc1ZVRkJReXhEUVVGRExFVkJRVVVzUTBGQlF5eEpRVUZMTEU5QlFVRXNZMEZCWXl4RFFVRkRMRU5CUVVNc1JVRkJSU3hEUVVGRExFTkJRVU1zUlVGQmNFSXNRMEZCYjBJc1EwRkJReXhEUVVGRE8xTkJRMjVGTzB0QlEwbzdTVUZEUkN4UFFVRlBMRU5CUVVNc1RVRkJUU3hEUVVGRExGRkJRVkVzUTBGQlF5eEpRVUZKTEV0QlFVc3NRMEZCUXl4RFFVRkRMRU5CUVVNN1NVRkRjRU1zVDBGQlR5eEZRVUZGTEVOQlFVTTdRVUZEWkN4RFFVRkRPMEZCUlVRc1UwRkJVeXhsUVVGbExFTkJRVU1zUTBGQlR5eEZRVUZGTEZGQlFYTkNPMGxCUTNCRUxFbEJRVWtzUTBGQlF5eEhRVUZITEZWQlFVTXNUMEZCVHl4RlFVRkZMRTlCUVU4N1VVRkRja0lzU1VGQlNTeEZRVUZGTEVkQlFVY3NVVUZCVVN4RFFVRkRMRkZCUVZFc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dFJRVU01UWl4SlFVRkpMRU5CUVVNc1EwRkJRenRSUVVOT0xFOUJRVThzUTBGQlF5eERRVUZETEVkQlFVY3NSVUZCUlN4RFFVRkRMRTlCUVU4c1EwRkJReXhGUVVGRkxFTkJRVU1zUzBGQlN5eEpRVUZKTEVWQlFVVTdXVUZEYWtNc1NVRkJTU3hQUVVGUExFZEJRVWNzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4UlFVRlJMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETzFsQlEyaERMRWxCUVVrc1QwRkJUeXhKUVVGSkxFTkJRVU1zU1VGQlNTeFBRVUZQTEVsQlFVa3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhSUVVGUkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RlFVRkZPMmRDUVVNNVF5eERRVUZETEVOQlFVTXNUMEZCVHl4RFFVRkRMRU5CUVVNc1RVRkJUU3hEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETzJkQ1FVTnlRaXhEUVVGRExFTkJRVU1zVDBGQlR5eERRVUZETEVOQlFVTXNUVUZCVFN4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRE8yRkJRM2hDTzFsQlEwUXNTVUZCU1N4UFFVRlBMRWxCUVVrc1EwRkJReXhGUVVGRk8yZENRVU5rTEUxQlFVMDdZVUZEVkR0VFFVTktPMGxCUTB3c1EwRkJReXhEUVVGQk8wbEJRMFFzUTBGQlF5eERRVUZETEUxQlFVMHNSVUZCUlN4TlFVRk5MRU5CUVVNc1EwRkJRenRKUVVOc1FpeERRVUZETEVOQlFVTXNUVUZCVFN4RlFVRkZMRTFCUVUwc1EwRkJReXhEUVVGRE8wRkJRM1JDTEVOQlFVTTdRVUZGUkN4VFFVRlRMR1ZCUVdVc1EwRkJReXhEUVVGUExFVkJRVVVzVVVGQmMwSTdTVUZEY0VRc1NVRkJTU3hEUVVGRExFZEJRVWNzVlVGQlF5eFBRVUZQTEVWQlFVVXNUMEZCVHp0UlFVTnlRaXhKUVVGSkxFTkJRVU1zUjBGQlJ5eFJRVUZSTEVOQlFVTXNVVUZCVVN4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFOUJRVThzUTBGQlF5eEZRVUZGTEVOQlFVTTdVVUZEZUVNc1NVRkJTU3hEUVVGRExFdEJRVXNzU1VGQlNTeEpRVUZKTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1VVRkJVU3hEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNSMEZCUnl4RFFVRkRMRVZCUVVVN1dVRkRja01zUTBGQlF5eERRVUZETEU5QlFVOHNRMEZCUXl4RFFVRkRMRTFCUVUwc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dFpRVU55UWl4RFFVRkRMRU5CUVVNc1QwRkJUeXhEUVVGRExFTkJRVU1zVFVGQlRTeERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRPMU5CUTNoQ08wbEJRMHdzUTBGQlF5eERRVUZCTzBsQlEwUXNRMEZCUXl4RFFVRkRMRTFCUVUwc1JVRkJSU3hOUVVGTkxFTkJRVU1zUTBGQlF6dEpRVU5zUWl4RFFVRkRMRU5CUVVNc1RVRkJUU3hGUVVGRkxFMUJRVTBzUTBGQlF5eERRVUZETzBGQlEzUkNMRU5CUVVNN1FVRkZSQ3hUUVVGblFpeHZRa0ZCYjBJc1EwRkJReXhGUVVGbExFVkJRVVVzU1VGQlowSTdTVUZEYkVVc1QwRkJUeXh0UWtGQmJVSXNRMEZCUXl4RlFVRkZMRVZCUVVVc1NVRkJTU3hGUVVGRkxFdEJRVXNzUlVGQlJTeEpRVUZKTEVOQlFVTXNRMEZCUXp0QlFVTjBSQ3hEUVVGRE8wRkJSa1FzYjBSQlJVTTdRVUZGUkN4VFFVRm5RaXh2UWtGQmIwSXNRMEZCUXl4RlFVRmxMRVZCUVVVc1NVRkJaMEk3U1VGRGJFVXNUMEZCVHl4dFFrRkJiVUlzUTBGQlF5eEZRVUZGTEVWQlFVVXNTVUZCU1N4RlFVRkZMRXRCUVVzc1JVRkJSU3hKUVVGSkxFTkJRVU1zUTBGQlF6dEJRVU4wUkN4RFFVRkRPMEZCUmtRc2IwUkJSVU03UVVGRlJDeFRRVUZuUWl4NVFrRkJlVUlzUTBGQlF5eEpRVUZ4UWp0SlFVTXpSQ3hQUVVGUExIZENRVUYzUWl4RFFVRkRMRWxCUVVrc1JVRkJSU3hMUVVGTExFVkJRVVVzU1VGQlNTeERRVUZETEVOQlFVTTdRVUZEZGtRc1EwRkJRenRCUVVaRUxEaEVRVVZETzBGQlJVUXNVMEZCWjBJc2VVSkJRWGxDTEVOQlFVTXNTVUZCY1VJN1NVRkRNMFFzVDBGQlR5eDNRa0ZCZDBJc1EwRkJReXhKUVVGSkxFVkJRVVVzUzBGQlN5eEZRVUZGTEVsQlFVa3NRMEZCUXl4RFFVRkRPMEZCUTNaRUxFTkJRVU03UVVGR1JDdzRSRUZGUXp0QlFVVkVMRk5CUVdkQ0xHTkJRV01zUTBGQlF5eEZRVUZsTzBsQlF6RkRMRWxCUVVrc1JVRkJSU3hIUVVGSExFVkJRVVVzUTBGQlF5eEhRVUZITEVOQlFVTXNWVUZCUVN4RFFVRkRMRWxCUVVrc1QwRkJRU3hKUVVGSkxHVkJRVkVzUTBGQlF5eERRVUZETEVOQlFVTXNSVUZCUlN4RlFVRkZMRU5CUVVNc1JVRkJjRUlzUTBGQmIwSXNRMEZCUXl4RFFVRkRPMGxCUXpORExFbEJRVWtzUlVGQlJTeEhRVUZITEc5Q1FVRnZRaXhEUVVGRExFVkJRVVVzUlVGQlJTeEZRVUZGTEVOQlFVTXNRMEZCUXp0SlFVTjBReXhKUVVGSkxFMUJRVTBzUjBGQlJ5eEpRVUZKTEdGQlFVMHNRMEZCUXl4RlFVRkZMRVZCUVVVc1JVRkJSU3hEUVVGRExFTkJRVU03U1VGRGFFTXNUVUZCVFN4RFFVRkRMRXRCUVVzc1JVRkJSU3hEUVVGRE8wbEJRMllzUlVGQlJTeERRVUZETEU5QlFVOHNRMEZCUXl4VlFVRkRMRU5CUVVNc1JVRkJSU3hEUVVGRExFbEJRVXNzVDBGQlFTeEZRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1ZVRkJWU3hEUVVGRExFTkJRVU1zUTBGQlF5eFJRVUZSTEVWQlFVVXNRMEZCUXl4RlFVRTVRaXhEUVVFNFFpeERRVUZETEVOQlFVTTdTVUZEY2tRc1JVRkJSU3hIUVVGSExFVkJRVVVzUTBGQlF5eEhRVUZITEVOQlFVTXNWVUZCUVN4RFFVRkRMRWxCUVVjc1QwRkJRU3hKUVVGSkxHVkJRVkVzUTBGQlF5eERRVUZETEVOQlFVTXNSVUZCUlN4RlFVRkZMRU5CUVVNc1JVRkJjRUlzUTBGQmIwSXNRMEZCUXl4RFFVRkRPMGxCUTNSRExFVkJRVVVzUjBGQlJ5eHZRa0ZCYjBJc1EwRkJReXhGUVVGRkxFVkJRVVVzUlVGQlJTeERRVUZETEVOQlFVTTdTVUZEYkVNc1RVRkJUU3hIUVVGSExFbEJRVWtzWVVGQlRTeERRVUZETEVWQlFVVXNSVUZCUlN4RlFVRkZMRU5CUVVNc1EwRkJRenRKUVVNMVFpeE5RVUZOTEVOQlFVTXNTMEZCU3l4RlFVRkZMRU5CUVVNN1NVRkRaaXhGUVVGRkxFTkJRVU1zVDBGQlR5eERRVUZETEZWQlFVTXNRMEZCUXl4RlFVRkZMRU5CUVVNc1NVRkJTeXhQUVVGQkxFVkJRVVVzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4VlFVRlZMRU5CUVVNc1EwRkJReXhEUVVGRExGRkJRVkVzUlVGQlJTeERRVUZETEVWQlFUbENMRU5CUVRoQ0xFTkJRVU1zUTBGQlF6dEJRVU42UkN4RFFVRkRPMEZCV0VRc2QwTkJWME03UVVGaFJEdEpRVUZ4UXl4dFEwRkJVVHRKUVVONlF5eDVRa0ZCYlVJc1MwRkJZU3hGUVVGRkxFTkJRVk03VVVGQk0wTXNXVUZEU1N4clFrRkJUU3hEUVVGRExFVkJRVVVzUTBGQlF5eERRVUZETEZOQlEyUTdVVUZHYTBJc1YwRkJTeXhIUVVGTUxFdEJRVXNzUTBGQlVUczdTVUZGYUVNc1EwRkJRenRKUVVOTUxITkNRVUZETzBGQlFVUXNRMEZCUXl4QlFVcEVMRU5CUVhGRExHVkJRVkVzUjBGSk5VTTdRVUZLV1N3d1EwRkJaVHRCUVUwMVFqdEpRVXRKTEc5Q1FVRnZRaXhMUVVGclFpeEZRVU14UWl4TlFVRjVRaXhGUVVONlFpeFRRVUZwUXl4RlFVTjZReXhYUVVGM1FpeEZRVU5vUWl4aFFVRTRRanRSUVVveFF5eHBRa0U0UWtNN1VVRTFRbGNzTUVKQlFVRXNSVUZCUVN4blFrRkJhVU03VVVGRGVrTXNORUpCUVVFc1JVRkJRU3hyUWtGQmQwSTdVVUZEYUVJc09FSkJRVUVzUlVGQlFTeHhRa0ZCT0VJN1VVRktkRUlzVlVGQlN5eEhRVUZNTEV0QlFVc3NRMEZCWVR0UlFVTXhRaXhYUVVGTkxFZEJRVTRzVFVGQlRTeERRVUZ0UWp0UlFVTjZRaXhqUVVGVExFZEJRVlFzVTBGQlV5eERRVUYzUWp0UlFVVnFReXhyUWtGQllTeEhRVUZpTEdGQlFXRXNRMEZCYVVJN1VVRkZkRU1zU1VGQlNTeERRVUZETEZOQlFWTXNSMEZCUnl4TFFVRkxMRU5CUVVNc1IwRkJSeXhEUVVGRExGVkJRVU1zUTBGQlF5eEZRVUZGTEVOQlFVTTdXVUZETlVJc1QwRkJUeXhEUVVGRExFTkJRVU1zVVVGQlVTeEhRVUZITEVsQlFVa3NaVUZCWlN4RFFVRkRMRU5CUVVNc1JVRkJSU3hEUVVGRExFTkJRVU1zUTBGQlF6dFJRVU5zUkN4RFFVRkRMRU5CUVVNc1EwRkJRenRSUVVWSUxFbEJRVWtzVjBGQlZ6dFpRVUZGTEVsQlFVa3NRMEZCUXl4cFFrRkJhVUlzUTBGQlF5eFhRVUZYTEVOQlFVTXNRMEZCUXp0UlFVVnlSQ3hKUVVGSkxHRkJRV0VzU1VGQlNTeFRRVUZUTEVsQlFVa3NUMEZCVHl4VFFVRlRMRU5CUVVNc1RVRkJUU3hMUVVGTExGZEJRVmNzUlVGQlJUdFpRVU4yUlN4TFFVRkxMRU5CUVVNc1QwRkJUeXhEUVVGRExGVkJRVUVzUTBGQlF6dG5Ra0ZETVVJc1NVRkJTU3hEUVVGRExFTkJRVU1zUTBGQlF5eExRVUZMTEVsQlFVa3NRMEZCUXl4RFFVRkRMRU5CUVVNc1RVRkJUU3hGUVVONlFqdHZRa0ZGUXl4RFFVRkRMRU5CUVVNc1RVRkJUU3hIUVVGSExFbEJRVWtzVTBGQlV5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRVZCUVVVc1EwRkJReXhEUVVGRExFTkJRVU1zUlVGQlJTeERRVUZETEVOQlFVTXNRMEZCUXl4RlFVRkZMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dHZRa0ZETjBNc1QwRkJUenRwUWtGRFVEdG5Ra0ZEWXl4SlFVRkpMRVZCUVVVc1IwRkJSeXhEUVVGRExFTkJRVU1zUzBGQlN5eEhRVUZITEVOQlFVTXNSVUZCUlN4RlFVRkZMRWRCUVVjc1EwRkJReXhEUVVGRExFMUJRVTBzUjBGQlJ5eERRVUZETEVOQlFVTTdaMEpCUTNoRExFTkJRVU1zUTBGQlF5eE5RVUZOTEVkQlFVY3NTVUZCU1N4VFFVRlRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUjBGQlJ5eEZRVUZGTEVWQlFVVXNRMEZCUXl4RFFVRkRMRU5CUVVNc1IwRkJSeXhGUVVGRkxFVkJRVVVzUTBGQlF5eERRVUZETEVOQlFVTXNSMEZCUnl4RlFVRkZMRVZCUVVVc1EwRkJReXhEUVVGRExFTkJRVU1zUjBGQlJ5eEZRVUZGTEVOQlFVTXNRMEZCUXp0WlFVTnlSU3hEUVVGRExFTkJRVU1zUTBGQlF6dFpRVU5JTEd0Q1FVRnJRaXhEUVVGRExGTkJRVk1zUTBGQlF5eERRVUZETzFsQlF6bENMRWxCUVVrc1EwRkJReXhIUVVGSExFdEJRVXNzUTBGQlF5eE5RVUZOTEVOQlFVTTdXVUZEY2tJc1RVRkJUU3hEUVVGRExFOUJRVThzUTBGQlF5eFZRVUZCTEVOQlFVTTdaMEpCUTFvc1MwRkJTU3hEUVVGRExGTkJRVk1zUTBGQlF5eERRVUZETEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNc1RVRkJUU3hIUVVGSExFbEJRVWtzWlVGQlpTeERRVUZETEVOQlFVTXNSVUZCUlN4RlFVRkZMRTlCUVU4c1EwRkJReXhEUVVGRExGTkJRVk1zUzBGQlN5eFhRVUZYTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhUUVVGVExFTkJRVU1zUTBGQlF5eERRVUZETEVsQlFVa3NRMEZCUXl4RFFVRkRPMmRDUVVOcVNDeExRVUZKTEVOQlFVTXNVMEZCVXl4RFFVRkRMRU5CUVVNc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF5eE5RVUZOTEVkQlFVY3NTVUZCU1N4bFFVRmxMRU5CUVVNc1EwRkJReXhGUVVGRkxFVkJRVVVzVDBGQlR5eERRVUZETEVOQlFVTXNVMEZCVXl4TFFVRkxMRmRCUVZjc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEZOQlFWTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1NVRkJTU3hEUVVGRExFTkJRVU03V1VGRGNrZ3NRMEZCUXl4RFFVRkRMRU5CUVVNN1UwRkRUanRKUVVOTUxFTkJRVU03U1VGSFR5eHhRMEZCWjBJc1IwRkJlRUlzVlVGQmVVSXNRMEZCVFR0UlFVTXpRaXhQUVVGUExFbEJRVWtzYVVKQlFWVXNRMEZEYWtJc1NVRkJTU3hEUVVGRExFdEJRVXNzUTBGQlF5eERRVUZETEVOQlFVTXNTVUZCU1N4RFFVRkRMRU5CUVVNc1VVRkJVU3hGUVVNelFpeEpRVUZKTEVOQlFVTXNTMEZCU3l4RFFVRkRMRU5CUVVNc1EwRkJReXhMUVVGTExFTkJRVU1zUTBGQlF5eFJRVUZSTEVWQlF6VkNMRU5CUVVNc1EwRkJReXhIUVVGSExFVkJRMHdzVDBGQlR5eERRVUZETEVOQlFVTXNVVUZCVVN4TFFVRkxMRmRCUVZjc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEZGQlFWRXNRMEZCUXl4RFFVRkRMRU5CUVVNc1MwRkJTeXhEUVVGRExFTkJRVU03U1VGRGFFVXNRMEZCUXp0SlFVZFBMR2xEUVVGWkxFZEJRWEJDTEZWQlFYRkNMRU5CUVUwN1VVRkJNMElzYVVKQmFVSkRPMUZCYUVKSExFbEJRVWtzUTBGQlF5eEpRVUZKTEVOQlFVTXNZVUZCWVR0WlFVRkZMRTlCUVU4N1VVRkZhRU1zU1VGQlNTeEpRVUZKTEVkQlFVY3NSMEZCUnl4RlFVRkZMRWRCUVVjc1IwRkJSeXhQUVVGUExFTkJRVU03VVVGRE9VSXNTVUZCU1N4RFFVRkRMRU5CUVVNc1NVRkJTU3hMUVVGTExFZEJRVWM3V1VGQlJTeEpRVUZKTEVkQlFVY3NSMEZCUnl4RlFVRkZMRWRCUVVjc1IwRkJSeXhSUVVGUkxFTkJRVU03VVVGREwwTXNTVUZCU1N4RlFVRkZMRWRCUVdkQ0xFTkJRVU1zUTBGQlF5eFBRVUZQTEVOQlFVTXNSMEZCUnl4RFFVRkRMRlZCUVVFc1EwRkJReXhKUVVGSkxFOUJRVUVzUzBGQlNTeERRVUZETEV0QlFVc3NRMEZCUXl4RFFVRkRMRU5CUVVNc1NVRkJTU3hEUVVGRExFVkJRV3hDTEVOQlFXdENMRU5CUVVNc1EwRkJReXhKUVVGSkxFTkJRVU1zVlVGQlF5eERRVUZETEVWQlFVVXNRMEZCUXl4SlFVRkxMRTlCUVVFc1EwRkJReXhEUVVGRExFbEJRVWtzUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXl4SlFVRkpMRU5CUVVNc1JVRkJha0lzUTBGQmFVSXNRMEZCUXl4RFFVRkRPMUZCUXk5R0xFbEJRVWtzUTBGQlF5eEhRVUZqTEVsQlFVa3NRMEZCUXp0UlFVTjRRaXhGUVVGRkxFTkJRVU1zVDBGQlR5eERRVUZETEZWQlFVRXNRMEZCUXp0WlFVVlNMRWxCUVVrc1EwRkJReXhGUVVGRk8yZENRVU5JTEVsQlFVa3NUMEZCVHl4SFFVRkhMRU5CUVVNc1EwRkJReXhKUVVGSkxFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNN1owSkJReTlDTEVsQlFVa3NUMEZCVHl4SFFVRkhMRU5CUVVNc1EwRkJReXhKUVVGSkxFTkJRVU1zUlVGQlJUdHZRa0ZEYmtJc1EwRkJReXhEUVVGRExFbEJRVWtzUTBGQlF5eEhRVUZITEU5QlFVOHNRMEZCUXp0cFFrRkRja0k3WVVGRFNqdFpRVU5FTEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNN1VVRkRWaXhEUVVGRExFTkJRVU1zUTBGQlF6dEpRVU5RTEVOQlFVTTdTVUZGVHl4dlEwRkJaU3hIUVVGMlFpeFZRVUYzUWl4RFFVRk5PMUZCUVRsQ0xHbENRVkZETzFGQlVFY3NTVUZCU1N4RFFVRkRMRWRCUVVjc1NVRkJTU3hEUVVGRExFdEJRVXNzUTBGQlF5eERRVUZETEVOQlFVTXNUMEZCVHl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFbEJRVWtzUTBGQlF5eERRVUZETEZGQlFWRXNRMEZCUXp0UlFVTXZReXhKUVVGSkxFTkJRVU1zV1VGQldTeERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRPMUZCUTNKQ0xFbEJRVWtzUlVGQlJTeEhRVUZITEVOQlFVTXNRMEZCUXl4SlFVRkpMRXRCUVVzc1IwRkJSeXhEUVVGRExFTkJRVU1zUTBGQlF5eEpRVUZKTEVOQlFVTXNXVUZCV1N4RFFVRkRMRU5CUVVNc1EwRkJReXhKUVVGSkxFTkJRVU1zV1VGQldTeERRVUZETzFGQlEyaEZMRU5CUVVNc1EwRkJReXhQUVVGUExFTkJRVU1zUzBGQlN5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRTlCUVU4c1EwRkJReXhWUVVGQkxFTkJRVU03V1VGRGVFSXNTVUZCU1N4RFFVRkRMRWRCUVVjc1MwRkJTU3hEUVVGRExFdEJRVXNzUTBGQlF5eERRVUZETEVOQlFVTXNTVUZCU1N4RFFVRkRMRU5CUVVNc1VVRkJVU3hEUVVGRE8xbEJRM0JETEVWQlFVVXNRMEZCUXl4SlFVRkpMRU5CUVVNc1NVRkJTU3hwUWtGQlZTeERRVUZETEVOQlFVTXNSVUZCUlN4RFFVRkRMRVZCUVVVc1EwRkJReXhEUVVGRExFMUJRVTBzUlVGQlJTeEpRVUZKTEVOQlFVTXNRMEZCUXl4RFFVRkRPMUZCUTJ4RUxFTkJRVU1zUTBGQlF5eERRVUZETzBsQlExQXNRMEZCUXp0SlFVVlBMSE5EUVVGcFFpeEhRVUY2UWl4VlFVRXdRaXhYUVVGclFqdFJRVUUxUXl4cFFrRlhRenRSUVZaSExFbEJRVWtzUzBGQlN5eEhRVUZITEZWQlFVRXNRMEZCUXl4SlFVRkpMRTlCUVVFc1QwRkJUeXhEUVVGRExFTkJRVU1zU1VGQlNTeExRVUZMTEZkQlFWY3NTVUZCU1N4RFFVRkRMRU5CUVVNc1NVRkJTU3hMUVVGTExGbEJRVmtzUlVGQmVFUXNRMEZCZDBRc1EwRkJRenRSUVVNeFJTeEpRVUZKTEVOQlFVTXNXVUZCV1N4SFFVRkhMRmRCUVZjN1lVRkRNVUlzVFVGQlRTeERRVUZETEZWQlFVRXNRMEZCUXl4SlFVRkpMRTlCUVVFc1EwRkJReXhEUVVGRExFbEJRVWtzUzBGQlN5eEhRVUZITEVsQlFVa3NTMEZCU3l4RFFVRkRMRU5CUVVNc1EwRkJReXhGUVVFeFFpeERRVUV3UWl4RFFVRkRPMkZCUTNaRExFZEJRVWNzUTBGQlF5eFZRVUZCTEVOQlFVTXNTVUZCU1N4UFFVRkJMRXRCUVVrc1EwRkJReXhuUWtGQlowSXNRMEZCUXl4RFFVRkRMRU5CUVVNc1JVRkJlRUlzUTBGQmQwSXNRMEZCUXl4RFFVRkRPMUZCUTNoRExFbEJRVWtzUTBGQlF5eFpRVUZaTEVkQlFVY3NWMEZCVnp0aFFVTXhRaXhOUVVGTkxFTkJRVU1zVlVGQlFTeERRVUZETEVsQlFVa3NUMEZCUVN4RFFVRkRMRU5CUVVNc1NVRkJTU3hMUVVGTExFZEJRVWNzU1VGQlNTeExRVUZMTEVOQlFVTXNRMEZCUXl4RFFVRkRMRVZCUVRGQ0xFTkJRVEJDTEVOQlFVTTdZVUZEZGtNc1IwRkJSeXhEUVVGRExGVkJRVUVzUTBGQlF5eEpRVUZKTEU5QlFVRXNTMEZCU1N4RFFVRkRMR2RDUVVGblFpeERRVUZETEVOQlFVTXNRMEZCUXl4RlFVRjRRaXhEUVVGM1FpeERRVUZETEVOQlFVTTdVVUZEZUVNc1YwRkJWenRoUVVOT0xFMUJRVTBzUTBGQlF5eFZRVUZCTEVOQlFVTXNTVUZCU1N4UFFVRkJMRU5CUVVNc1EwRkJReXhKUVVGSkxFdEJRVXNzVjBGQlZ5eEZRVUYwUWl4RFFVRnpRaXhEUVVGRE8yRkJRMjVETEU5QlFVOHNRMEZCUXl4VlFVRkJMRU5CUVVNc1NVRkJTU3hQUVVGQkxFdEJRVWtzUTBGQlF5eGxRVUZsTEVOQlFVTXNRMEZCUXl4RFFVRkRMRVZCUVhaQ0xFTkJRWFZDTEVOQlFVTXNRMEZCUXp0SlFVTXZReXhEUVVGRE8wbEJSVThzTkVOQlFYVkNMRWRCUVM5Q0xGVkJRV2RETEVWQlFWa3NSVUZCUlN4RlFVRlpMRVZCUVVVc1QwRkJhVUlzUlVGQlJTeFZRVUZ2UXp0UlFVTXZSeXhKUVVGSkxFTkJRVU1zUzBGQlN5eERRVUZETEU5QlFVOHNRMEZCUXl4VlFVRkRMRU5CUVVNc1JVRkJSU3hEUVVGRE8xbEJRM0JDTEVsQlFVa3NRMEZCUXl4RFFVRkRMRXRCUVVzc1JVRkJSVHRuUWtGRFZDeERRVUZETEVOQlFVTXNVVUZCVVN4RFFVRkRMRTFCUVUwc1IwRkJSeXhEUVVGRExFTkJRVU1zVjBGQlZ5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNc1YwRkJWeXhEUVVGRExFTkJRVU1zUTBGQlF5eEpRVUZKTEVOQlFVTTdaMEpCUTNwRUxFOUJRVThzUTBGQlF5eERRVUZETEVOQlFVTXNSMEZCUnl4VlFVRlZMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU03WVVGRE9VSTdhVUpCUVUwN1owSkJRMGdzUTBGQlF5eERRVUZETEZGQlFWRXNRMEZCUXl4TlFVRk5MRWRCUVVjc1EwRkJReXhEUVVGRE8yRkJRM3BDTzFsQlEwUXNTVUZCU1N4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRExFTkJRVU1zUzBGQlN5eEpRVUZKTEVOQlFVTXNRMEZCUXl4SFFVRkhMRU5CUVVNc1JVRkJSU3hEUVVGRExFZEJRVWNzUTBGQlF5eERRVUZETEVOQlFVTXNUVUZCVFN4SlFVRkpMRU5CUVVNc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF6dFpRVU53UkN4SlFVRkpMRVZCUVVVc1IwRkJSeXhGUVVGRkxFTkJRVU1zUTBGQlF5eERRVUZETEVWQlFVVXNSVUZCUlN4SFFVRkhMRVZCUVVVc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dFpRVU16UWl4RFFVRkRMRU5CUVVNc1RVRkJUU3hIUVVGSExFbEJRVWtzVTBGQlV5eERRVUZETEVWQlFVVXNSMEZCUnl4RFFVRkRMRVZCUVVVc1JVRkJSU3hIUVVGSExFTkJRVU1zUlVGQlJTeEZRVUZGTEVkQlFVY3NRMEZCUXl4RlFVRkZMRVZCUVVVc1IwRkJSeXhEUVVGRExFTkJRVU1zUTBGQlF6dFJRVU0zUkN4RFFVRkRMRU5CUVVNc1EwRkJRenRKUVVOUUxFTkJRVU03U1VGRlJDdzJRa0ZCVVN4SFFVRlNMRlZCUVZNc1JVRkJXU3hGUVVGRkxFVkJRVmtzUlVGQlJTeERRVUZYTzFGQlF6VkRMRWxCUVVrc1EwRkJReXhKUVVGSkxFTkJRVU1zVTBGQlV5eEpRVUZKTEVOQlFVTXNRMEZCUXl4SlFVRkpMRU5CUVVNc1lVRkJZU3hKUVVGSkxFbEJRVWtzUTBGQlF5eFpRVUZaTEVOQlFVTTdXVUZCUlN4UFFVRlBPMUZCUXpGRkxFbEJRVWtzUTBGQlF5eFBRVUZQTEVOQlFVTXNSVUZCUlN4RlFVRkZMRVZCUVVVc1JVRkJSU3hGUVVGRkxFVkJRVVVzUTBGQlF5eEZRVUZGTEZWQlFVRXNRMEZCUXl4SlFVRkhMRTlCUVVFc1EwRkJReXhEUVVGRExFVkJRVVVzUlVGQlNpeERRVUZKTEVWQlFVVXNTVUZCU1N4RFFVRkRMRmxCUVZrc1JVRkJSU3g1UWtGQmVVSXNSVUZET1VVc1ZVRkJRU3hEUVVGRExFbEJRVWtzVDBGQlFTeERRVUZETEVOQlFVTXNUVUZCVFN4RFFVRkRMRlZCUVZVc1EwRkJReXhEUVVGRExFTkJRVzFDTEVOQlFVTXNRMEZCUXl4UlFVRlRMRU5CUVVNc1MwRkJTeXhEUVVGRExFZEJRVWNzUTBGQlF5eERRVUZETEZGQlFWRXNRMEZCUXl4UlFVRlJMRVZCUVVVc1EwRkJReXhGUVVGdVJpeERRVUZ0Uml4RlFVTjRSaXhWUVVGQkxFTkJRVU03V1VGRFJ5eEpRVUZKTEVsQlFVa3NSMEZCUnl4RFFVRkRMRU5CUVcxQ0xFTkJRVU1zUTBGQlF5eE5RVUZQTEVOQlFVTXNTMEZCU3l4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRExFMUJRVTBzUTBGQlF5eFJRVUZSTEVWQlFVVXNRMEZCUXp0WlFVTjBSU3hKUVVGSkxFbEJRVWtzUjBGQlJ5eERRVUZETEVOQlFXMUNMRU5CUVVNc1EwRkJReXhOUVVGUExFTkJRVU1zUzBGQlN5eERRVUZETEVkQlFVY3NRMEZCUXl4RFFVRkRMRTFCUVUwc1EwRkJReXhSUVVGUkxFVkJRVVVzUTBGQlF6dFpRVU4wUlN4SlFVRkpMRVZCUVVVc1IwRkJSeXhEUVVGRExFTkJRVU1zVDBGQlR5eEhRVUZITEVOQlFVTXNRMEZCUXp0WlFVTjJRaXhEUVVGRExFTkJRVU1zVFVGQlRTeERRVUZETEVOQlFVTXNSMEZCUnl4SlFVRkpMRWRCUVVjc1JVRkJSU3hEUVVGRE8xbEJRM1pDTEVOQlFVTXNRMEZCUXl4TlFVRk5MRU5CUVVNc1EwRkJReXhIUVVGSExFbEJRVWtzUjBGQlJ5eEZRVUZGTEVOQlFVTTdVVUZETTBJc1EwRkJReXhEUVVGRExFTkJRVU03U1VGRFdDeERRVUZETzBsQlJVUXNOa0pCUVZFc1IwRkJVaXhWUVVGVExFVkJRVmtzUlVGQlJTeEZRVUZaTEVWQlFVVXNRMEZCVnp0UlFVTTFReXhKUVVGSkxFTkJRVU1zU1VGQlNTeERRVUZETEZOQlFWTXNTVUZCU1N4RFFVRkRMRWxCUVVrc1EwRkJReXhaUVVGWk8xbEJRVVVzVDBGQlR6dFJRVU5zUkN4SlFVRkpMRU5CUVVNc1QwRkJUeXhEUVVGRExFVkJRVVVzUlVGQlJTeEZRVUZGTEVWQlFVVXNSVUZCUlN4RlFVRkZMRU5CUVVNc1JVRkJSU3hWUVVGQkxFTkJRVU1zU1VGQlJ5eFBRVUZCTEVOQlFVTXNRMEZCUXl4RlFVRkZMRVZCUVVvc1EwRkJTU3hGUVVGRkxFbEJRVWtzUTBGQlF5eFpRVUZaTEVWQlFVVXNlVUpCUVhsQ0xFVkJRemxGTEZWQlFVRXNRMEZCUXl4SlFVRkpMRTlCUVVFc1EwRkJReXhEUVVGRExFMUJRVTBzUTBGQlF5eFZRVUZWTEVOQlFVTXNRMEZCUXl4RFFVRnRRaXhEUVVGRExFTkJRVU1zVVVGQlV5eERRVUZETEV0QlFVc3NRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJReXhSUVVGUkxFTkJRVU1zVVVGQlVTeEZRVUZGTEVOQlFVTXNSVUZCYmtZc1EwRkJiVVlzUlVGRGVFWXNWVUZCUVN4RFFVRkRPMWxCUTBjc1NVRkJTU3hKUVVGSkxFZEJRVWNzUTBGQlF5eERRVUZ0UWl4RFFVRkRMRU5CUVVNc1RVRkJUeXhEUVVGRExFdEJRVXNzUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXl4TlFVRk5MRU5CUVVNc1VVRkJVU3hGUVVGRkxFTkJRVU03V1VGRGRFVXNTVUZCU1N4SlFVRkpMRWRCUVVjc1EwRkJReXhEUVVGdFFpeERRVUZETEVOQlFVTXNUVUZCVHl4RFFVRkRMRXRCUVVzc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF5eE5RVUZOTEVOQlFVTXNVVUZCVVN4RlFVRkZMRU5CUVVNN1dVRkRkRVVzU1VGQlNTeEZRVUZGTEVkQlFVY3NRMEZCUXl4RFFVRkRMRTlCUVU4c1IwRkJSeXhEUVVGRExFTkJRVU03V1VGRGRrSXNRMEZCUXl4RFFVRkRMRTFCUVUwc1EwRkJReXhEUVVGRExFZEJRVWNzU1VGQlNTeEhRVUZITEVWQlFVVXNRMEZCUXp0WlFVRkJMRU5CUVVNN1dVRkRlRUlzUTBGQlF5eERRVUZETEUxQlFVMHNRMEZCUXl4RFFVRkRMRWRCUVVjc1NVRkJTU3hIUVVGSExFVkJRVVVzUTBGQlF6dFJRVU16UWl4RFFVRkRMRU5CUVVNc1EwRkJRenRKUVVOWUxFTkJRVU03U1VGRlJDeHhRMEZCWjBJc1IwRkJhRUk3VVVGQlFTeHBRa0ZMUXp0UlFVcEhMRTlCUVU4N1dVRkRTQ3hWUVVGRExFVkJRVVVzUlVGQlJTeEZRVUZGTEVWQlFVVXNRMEZCUXl4SlFVRkxMRTlCUVVFc1MwRkJTU3hEUVVGRExGRkJRVkVzUTBGQlF5eEZRVUZGTEVWQlFVVXNSVUZCUlN4RlFVRkZMRU5CUVVNc1EwRkJReXhGUVVGNFFpeERRVUYzUWp0WlFVTjJReXhWUVVGRExFVkJRVVVzUlVGQlJTeEZRVUZGTEVWQlFVVXNRMEZCUXl4SlFVRkxMRTlCUVVFc1MwRkJTU3hEUVVGRExGRkJRVkVzUTBGQlF5eEZRVUZGTEVWQlFVVXNSVUZCUlN4RlFVRkZMRU5CUVVNc1EwRkJReXhGUVVGNFFpeERRVUYzUWp0VFFVTXhReXhEUVVGRE8wbEJRMDRzUTBGQlF6dEpRVVZQTERSQ1FVRlBMRWRCUVdZc1ZVRkJaMElzUlVGQldTeEZRVUZGTEVWQlFWa3NSVUZCUlN4TFFVRmxMRVZCUVVVc1QwRkJhVUlzUlVGRE1VVXNWVUZCYjBNc1JVRkRjRU1zUlVGQlowSXNSVUZEYUVJc2JVSkJRWGxFTEVWQlEzcEVMR2RDUVVGMVF5eEZRVU4yUXl4cFFrRkJPRU03VVVGRk9VTXNTVUZCU1N4RFFVRkRMSFZDUVVGMVFpeERRVUZETEVWQlFVVXNSVUZCUlN4RlFVRkZMRVZCUVVVc1QwRkJUeXhGUVVGRkxGVkJRVlVzUTBGQlF5eERRVUZETzFGQlF6RkVMRWxCUVVrc1NVRkJTU3hEUVVGRExGTkJRVk1zU1VGQlNTeEpRVUZKTEVOQlFVTXNZVUZCWVN4RlFVRkZPMWxCUTNSRExHdENRVUZyUWl4RFFVRkRMRWxCUVVrc1EwRkJReXhUUVVGVExFTkJRVU1zUTBGQlF6dFpRVU51UXl4RlFVRkZMRWRCUVVjc1JVRkJSU3hEUVVGRExFMUJRVTBzUTBGQlF5eHRRa0ZCYlVJc1EwRkJReXhKUVVGSkxFTkJRVU1zVTBGQlV5eERRVUZETEVOQlFVTXNRMEZCUXp0VFFVTjJSRHRSUVVORUxFbEJRVWtzUTBGQlF5eExRVUZMTEVOQlFVTXNTVUZCU1N4RFFVRkRMRk5CUVZNc1JVRkJSU3hGUVVGRkxFVkJRVVVzUzBGQlN5eEZRVUZGTEU5QlFVOHNRMEZCUXl4RFFVRkRPMUZCUXk5RExFbEJRVWtzUTBGQlF5eExRVUZMTEVOQlFVTXNUMEZCVHl4RFFVRkRMR2RDUVVGblFpeERRVUZETEVOQlFVTTdVVUZEY2tNc1NVRkJTU3hKUVVGSkxFTkJRVU1zVTBGQlV5eEpRVUZKTEVsQlFVa3NRMEZCUXl4aFFVRmhMRVZCUVVVN1dVRkRkRU1zU1VGQlNTeERRVUZETEUxQlFVMHNRMEZCUXl4UFFVRlBMRU5CUVVNc2FVSkJRV2xDTEVOQlFVTXNRMEZCUXp0WlFVTjJReXhyUWtGQmEwSXNRMEZCUXl4SlFVRkpMRU5CUVVNc1UwRkJVeXhEUVVGRExFTkJRVU03VTBGRGRFTTdTVUZEVEN4RFFVRkRPMGxCUlU4c01FSkJRVXNzUjBGQllpeFZRVUZqTEVWQlFXTXNSVUZCUlN4RlFVRm5RaXhGUVVGRkxGRkJRV3RDTEVWQlFVVXNUMEZCYVVJN1VVRkRha1lzU1VGQlNTeE5RVUZOTEVkQlFVY3NTVUZCU1N4aFFVRk5MRU5CUVVNc1JVRkJSU3hGUVVGRkxFVkJRVVVzUTBGQlF5eERRVUZETzFGQlEyaERMRTFCUVUwc1EwRkJReXh2UWtGQmIwSXNRMEZCUXl4UlFVRlJMRU5CUVVNc1EwRkJRenRSUVVOMFF5eE5RVUZOTEVOQlFVTXNiVUpCUVcxQ0xFTkJRVU1zVDBGQlR5eERRVUZETEVOQlFVTTdVVUZEY0VNc1RVRkJUU3hEUVVGRExFdEJRVXNzUlVGQlJTeERRVUZETzBsQlEyNUNMRU5CUVVNN1NVRkRUQ3hwUWtGQlF6dEJRVUZFTEVOQlFVTXNRVUZzUzBRc1NVRnJTME03UVVGc1Mxa3NaME5CUVZVaWZRPT0iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciBwcXVldWVfMSA9IHJlcXVpcmUoXCIuL3BxdWV1ZVwiKTtcbnZhciBOZWlnaGJvdXIgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIE5laWdoYm91cihpZCwgZGlzdGFuY2UpIHtcbiAgICAgICAgdGhpcy5pZCA9IGlkO1xuICAgICAgICB0aGlzLmRpc3RhbmNlID0gZGlzdGFuY2U7XG4gICAgfVxuICAgIHJldHVybiBOZWlnaGJvdXI7XG59KCkpO1xudmFyIE5vZGUgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIE5vZGUoaWQpIHtcbiAgICAgICAgdGhpcy5pZCA9IGlkO1xuICAgICAgICB0aGlzLm5laWdoYm91cnMgPSBbXTtcbiAgICB9XG4gICAgcmV0dXJuIE5vZGU7XG59KCkpO1xudmFyIFF1ZXVlRW50cnkgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIFF1ZXVlRW50cnkobm9kZSwgcHJldiwgZCkge1xuICAgICAgICB0aGlzLm5vZGUgPSBub2RlO1xuICAgICAgICB0aGlzLnByZXYgPSBwcmV2O1xuICAgICAgICB0aGlzLmQgPSBkO1xuICAgIH1cbiAgICByZXR1cm4gUXVldWVFbnRyeTtcbn0oKSk7XG52YXIgQ2FsY3VsYXRvciA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gQ2FsY3VsYXRvcihuLCBlcywgZ2V0U291cmNlSW5kZXgsIGdldFRhcmdldEluZGV4LCBnZXRMZW5ndGgpIHtcbiAgICAgICAgdGhpcy5uID0gbjtcbiAgICAgICAgdGhpcy5lcyA9IGVzO1xuICAgICAgICB0aGlzLm5laWdoYm91cnMgPSBuZXcgQXJyYXkodGhpcy5uKTtcbiAgICAgICAgdmFyIGkgPSB0aGlzLm47XG4gICAgICAgIHdoaWxlIChpLS0pXG4gICAgICAgICAgICB0aGlzLm5laWdoYm91cnNbaV0gPSBuZXcgTm9kZShpKTtcbiAgICAgICAgaSA9IHRoaXMuZXMubGVuZ3RoO1xuICAgICAgICB3aGlsZSAoaS0tKSB7XG4gICAgICAgICAgICB2YXIgZSA9IHRoaXMuZXNbaV07XG4gICAgICAgICAgICB2YXIgdSA9IGdldFNvdXJjZUluZGV4KGUpLCB2ID0gZ2V0VGFyZ2V0SW5kZXgoZSk7XG4gICAgICAgICAgICB2YXIgZCA9IGdldExlbmd0aChlKTtcbiAgICAgICAgICAgIHRoaXMubmVpZ2hib3Vyc1t1XS5uZWlnaGJvdXJzLnB1c2gobmV3IE5laWdoYm91cih2LCBkKSk7XG4gICAgICAgICAgICB0aGlzLm5laWdoYm91cnNbdl0ubmVpZ2hib3Vycy5wdXNoKG5ldyBOZWlnaGJvdXIodSwgZCkpO1xuICAgICAgICB9XG4gICAgfVxuICAgIENhbGN1bGF0b3IucHJvdG90eXBlLkRpc3RhbmNlTWF0cml4ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgRCA9IG5ldyBBcnJheSh0aGlzLm4pO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMubjsgKytpKSB7XG4gICAgICAgICAgICBEW2ldID0gdGhpcy5kaWprc3RyYU5laWdoYm91cnMoaSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIEQ7XG4gICAgfTtcbiAgICBDYWxjdWxhdG9yLnByb3RvdHlwZS5EaXN0YW5jZXNGcm9tTm9kZSA9IGZ1bmN0aW9uIChzdGFydCkge1xuICAgICAgICByZXR1cm4gdGhpcy5kaWprc3RyYU5laWdoYm91cnMoc3RhcnQpO1xuICAgIH07XG4gICAgQ2FsY3VsYXRvci5wcm90b3R5cGUuUGF0aEZyb21Ob2RlVG9Ob2RlID0gZnVuY3Rpb24gKHN0YXJ0LCBlbmQpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZGlqa3N0cmFOZWlnaGJvdXJzKHN0YXJ0LCBlbmQpO1xuICAgIH07XG4gICAgQ2FsY3VsYXRvci5wcm90b3R5cGUuUGF0aEZyb21Ob2RlVG9Ob2RlV2l0aFByZXZDb3N0ID0gZnVuY3Rpb24gKHN0YXJ0LCBlbmQsIHByZXZDb3N0KSB7XG4gICAgICAgIHZhciBxID0gbmV3IHBxdWV1ZV8xLlByaW9yaXR5UXVldWUoZnVuY3Rpb24gKGEsIGIpIHsgcmV0dXJuIGEuZCA8PSBiLmQ7IH0pLCB1ID0gdGhpcy5uZWlnaGJvdXJzW3N0YXJ0XSwgcXUgPSBuZXcgUXVldWVFbnRyeSh1LCBudWxsLCAwKSwgdmlzaXRlZEZyb20gPSB7fTtcbiAgICAgICAgcS5wdXNoKHF1KTtcbiAgICAgICAgd2hpbGUgKCFxLmVtcHR5KCkpIHtcbiAgICAgICAgICAgIHF1ID0gcS5wb3AoKTtcbiAgICAgICAgICAgIHUgPSBxdS5ub2RlO1xuICAgICAgICAgICAgaWYgKHUuaWQgPT09IGVuZCkge1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIGkgPSB1Lm5laWdoYm91cnMubGVuZ3RoO1xuICAgICAgICAgICAgd2hpbGUgKGktLSkge1xuICAgICAgICAgICAgICAgIHZhciBuZWlnaGJvdXIgPSB1Lm5laWdoYm91cnNbaV0sIHYgPSB0aGlzLm5laWdoYm91cnNbbmVpZ2hib3VyLmlkXTtcbiAgICAgICAgICAgICAgICBpZiAocXUucHJldiAmJiB2LmlkID09PSBxdS5wcmV2Lm5vZGUuaWQpXG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIHZhciB2aWR1aWQgPSB2LmlkICsgJywnICsgdS5pZDtcbiAgICAgICAgICAgICAgICBpZiAodmlkdWlkIGluIHZpc2l0ZWRGcm9tICYmIHZpc2l0ZWRGcm9tW3ZpZHVpZF0gPD0gcXUuZClcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgdmFyIGNjID0gcXUucHJldiA/IHByZXZDb3N0KHF1LnByZXYubm9kZS5pZCwgdS5pZCwgdi5pZCkgOiAwLCB0ID0gcXUuZCArIG5laWdoYm91ci5kaXN0YW5jZSArIGNjO1xuICAgICAgICAgICAgICAgIHZpc2l0ZWRGcm9tW3ZpZHVpZF0gPSB0O1xuICAgICAgICAgICAgICAgIHEucHVzaChuZXcgUXVldWVFbnRyeSh2LCBxdSwgdCkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHZhciBwYXRoID0gW107XG4gICAgICAgIHdoaWxlIChxdS5wcmV2KSB7XG4gICAgICAgICAgICBxdSA9IHF1LnByZXY7XG4gICAgICAgICAgICBwYXRoLnB1c2gocXUubm9kZS5pZCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHBhdGg7XG4gICAgfTtcbiAgICBDYWxjdWxhdG9yLnByb3RvdHlwZS5kaWprc3RyYU5laWdoYm91cnMgPSBmdW5jdGlvbiAoc3RhcnQsIGRlc3QpIHtcbiAgICAgICAgaWYgKGRlc3QgPT09IHZvaWQgMCkgeyBkZXN0ID0gLTE7IH1cbiAgICAgICAgdmFyIHEgPSBuZXcgcHF1ZXVlXzEuUHJpb3JpdHlRdWV1ZShmdW5jdGlvbiAoYSwgYikgeyByZXR1cm4gYS5kIDw9IGIuZDsgfSksIGkgPSB0aGlzLm5laWdoYm91cnMubGVuZ3RoLCBkID0gbmV3IEFycmF5KGkpO1xuICAgICAgICB3aGlsZSAoaS0tKSB7XG4gICAgICAgICAgICB2YXIgbm9kZSA9IHRoaXMubmVpZ2hib3Vyc1tpXTtcbiAgICAgICAgICAgIG5vZGUuZCA9IGkgPT09IHN0YXJ0ID8gMCA6IE51bWJlci5QT1NJVElWRV9JTkZJTklUWTtcbiAgICAgICAgICAgIG5vZGUucSA9IHEucHVzaChub2RlKTtcbiAgICAgICAgfVxuICAgICAgICB3aGlsZSAoIXEuZW1wdHkoKSkge1xuICAgICAgICAgICAgdmFyIHUgPSBxLnBvcCgpO1xuICAgICAgICAgICAgZFt1LmlkXSA9IHUuZDtcbiAgICAgICAgICAgIGlmICh1LmlkID09PSBkZXN0KSB7XG4gICAgICAgICAgICAgICAgdmFyIHBhdGggPSBbXTtcbiAgICAgICAgICAgICAgICB2YXIgdiA9IHU7XG4gICAgICAgICAgICAgICAgd2hpbGUgKHR5cGVvZiB2LnByZXYgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgICAgIHBhdGgucHVzaCh2LnByZXYuaWQpO1xuICAgICAgICAgICAgICAgICAgICB2ID0gdi5wcmV2O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gcGF0aDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGkgPSB1Lm5laWdoYm91cnMubGVuZ3RoO1xuICAgICAgICAgICAgd2hpbGUgKGktLSkge1xuICAgICAgICAgICAgICAgIHZhciBuZWlnaGJvdXIgPSB1Lm5laWdoYm91cnNbaV07XG4gICAgICAgICAgICAgICAgdmFyIHYgPSB0aGlzLm5laWdoYm91cnNbbmVpZ2hib3VyLmlkXTtcbiAgICAgICAgICAgICAgICB2YXIgdCA9IHUuZCArIG5laWdoYm91ci5kaXN0YW5jZTtcbiAgICAgICAgICAgICAgICBpZiAodS5kICE9PSBOdW1iZXIuTUFYX1ZBTFVFICYmIHYuZCA+IHQpIHtcbiAgICAgICAgICAgICAgICAgICAgdi5kID0gdDtcbiAgICAgICAgICAgICAgICAgICAgdi5wcmV2ID0gdTtcbiAgICAgICAgICAgICAgICAgICAgcS5yZWR1Y2VLZXkodi5xLCB2LCBmdW5jdGlvbiAoZSwgcSkgeyByZXR1cm4gZS5xID0gcTsgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBkO1xuICAgIH07XG4gICAgcmV0dXJuIENhbGN1bGF0b3I7XG59KCkpO1xuZXhwb3J0cy5DYWxjdWxhdG9yID0gQ2FsY3VsYXRvcjtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWRhdGE6YXBwbGljYXRpb24vanNvbjtiYXNlNjQsZXlKMlpYSnphVzl1SWpvekxDSm1hV3hsSWpvaWMyaHZjblJsYzNSd1lYUm9jeTVxY3lJc0luTnZkWEpqWlZKdmIzUWlPaUlpTENKemIzVnlZMlZ6SWpwYklpNHVMeTR1TDFkbFlrTnZiR0V2YzNKakwzTm9iM0owWlhOMGNHRjBhSE11ZEhNaVhTd2libUZ0WlhNaU9sdGRMQ0p0WVhCd2FXNW5jeUk2SWpzN1FVRkJRU3h0UTBGQmJVUTdRVUZGYmtRN1NVRkRTU3h0UWtGQmJVSXNSVUZCVlN4RlFVRlRMRkZCUVdkQ08xRkJRVzVETEU5QlFVVXNSMEZCUml4RlFVRkZMRU5CUVZFN1VVRkJVeXhoUVVGUkxFZEJRVklzVVVGQlVTeERRVUZSTzBsQlFVa3NRMEZCUXp0SlFVTXZSQ3huUWtGQlF6dEJRVUZFTEVOQlFVTXNRVUZHUkN4SlFVVkRPMEZCUlVRN1NVRkRTU3hqUVVGdFFpeEZRVUZWTzFGQlFWWXNUMEZCUlN4SFFVRkdMRVZCUVVVc1EwRkJVVHRSUVVONlFpeEpRVUZKTEVOQlFVTXNWVUZCVlN4SFFVRkhMRVZCUVVVc1EwRkJRenRKUVVONlFpeERRVUZETzBsQlMwd3NWMEZCUXp0QlFVRkVMRU5CUVVNc1FVRlNSQ3hKUVZGRE8wRkJSVVE3U1VGRFNTeHZRa0ZCYlVJc1NVRkJWU3hGUVVGVExFbEJRV2RDTEVWQlFWTXNRMEZCVXp0UlFVRnlSQ3hUUVVGSkxFZEJRVW9zU1VGQlNTeERRVUZOTzFGQlFWTXNVMEZCU1N4SFFVRktMRWxCUVVrc1EwRkJXVHRSUVVGVExFMUJRVU1zUjBGQlJDeERRVUZETEVOQlFWRTdTVUZCUnl4RFFVRkRPMGxCUTJoR0xHbENRVUZETzBGQlFVUXNRMEZCUXl4QlFVWkVMRWxCUlVNN1FVRlRSRHRKUVVkSkxHOUNRVUZ0UWl4RFFVRlRMRVZCUVZNc1JVRkJWU3hGUVVGRkxHTkJRVzFETEVWQlFVVXNZMEZCYlVNc1JVRkJSU3hUUVVFNFFqdFJRVUYwU1N4TlFVRkRMRWRCUVVRc1EwRkJReXhEUVVGUk8xRkJRVk1zVDBGQlJTeEhRVUZHTEVWQlFVVXNRMEZCVVR0UlFVTXpReXhKUVVGSkxFTkJRVU1zVlVGQlZTeEhRVUZITEVsQlFVa3NTMEZCU3l4RFFVRkRMRWxCUVVrc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dFJRVU53UXl4SlFVRkpMRU5CUVVNc1IwRkJSeXhKUVVGSkxFTkJRVU1zUTBGQlF5eERRVUZETzFGQlFVTXNUMEZCVHl4RFFVRkRMRVZCUVVVN1dVRkJSU3hKUVVGSkxFTkJRVU1zVlVGQlZTeERRVUZETEVOQlFVTXNRMEZCUXl4SFFVRkhMRWxCUVVrc1NVRkJTU3hEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETzFGQlJUZEVMRU5CUVVNc1IwRkJSeXhKUVVGSkxFTkJRVU1zUlVGQlJTeERRVUZETEUxQlFVMHNRMEZCUXp0UlFVRkRMRTlCUVU4c1EwRkJReXhGUVVGRkxFVkJRVVU3V1VGRE5VSXNTVUZCU1N4RFFVRkRMRWRCUVVjc1NVRkJTU3hEUVVGRExFVkJRVVVzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0WlFVTnVRaXhKUVVGSkxFTkJRVU1zUjBGQlZ5eGpRVUZqTEVOQlFVTXNRMEZCUXl4RFFVRkRMRVZCUVVVc1EwRkJReXhIUVVGWExHTkJRV01zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0WlFVTnFSU3hKUVVGSkxFTkJRVU1zUjBGQlJ5eFRRVUZUTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1dVRkRja0lzU1VGQlNTeERRVUZETEZWQlFWVXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhWUVVGVkxFTkJRVU1zU1VGQlNTeERRVUZETEVsQlFVa3NVMEZCVXl4RFFVRkRMRU5CUVVNc1JVRkJSU3hEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETzFsQlEzaEVMRWxCUVVrc1EwRkJReXhWUVVGVkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNWVUZCVlN4RFFVRkRMRWxCUVVrc1EwRkJReXhKUVVGSkxGTkJRVk1zUTBGQlF5eERRVUZETEVWQlFVVXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJRenRUUVVNelJEdEpRVU5NTEVOQlFVTTdTVUZWUkN4dFEwRkJZeXhIUVVGa08xRkJRMGtzU1VGQlNTeERRVUZETEVkQlFVY3NTVUZCU1N4TFFVRkxMRU5CUVVNc1NVRkJTU3hEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETzFGQlF6RkNMRXRCUVVzc1NVRkJTU3hEUVVGRExFZEJRVWNzUTBGQlF5eEZRVUZGTEVOQlFVTXNSMEZCUnl4SlFVRkpMRU5CUVVNc1EwRkJReXhGUVVGRkxFVkJRVVVzUTBGQlF5eEZRVUZGTzFsQlF6ZENMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUjBGQlJ5eEpRVUZKTEVOQlFVTXNhMEpCUVd0Q0xFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTTdVMEZEY2tNN1VVRkRSQ3hQUVVGUExFTkJRVU1zUTBGQlF6dEpRVU5pTEVOQlFVTTdTVUZSUkN4elEwRkJhVUlzUjBGQmFrSXNWVUZCYTBJc1MwRkJZVHRSUVVNelFpeFBRVUZQTEVsQlFVa3NRMEZCUXl4clFrRkJhMElzUTBGQlF5eExRVUZMTEVOQlFVTXNRMEZCUXp0SlFVTXhReXhEUVVGRE8wbEJSVVFzZFVOQlFXdENMRWRCUVd4Q0xGVkJRVzFDTEV0QlFXRXNSVUZCUlN4SFFVRlhPMUZCUTNwRExFOUJRVThzU1VGQlNTeERRVUZETEd0Q1FVRnJRaXhEUVVGRExFdEJRVXNzUlVGQlJTeEhRVUZITEVOQlFVTXNRMEZCUXp0SlFVTXZReXhEUVVGRE8wbEJTMFFzYlVSQlFUaENMRWRCUVRsQ0xGVkJRMGtzUzBGQllTeEZRVU5pTEVkQlFWY3NSVUZEV0N4UlFVRTRRenRSUVVVNVF5eEpRVUZKTEVOQlFVTXNSMEZCUnl4SlFVRkpMSE5DUVVGaExFTkJRV0VzVlVGQlF5eERRVUZETEVWQlFVVXNRMEZCUXl4SlFVRkxMRTlCUVVFc1EwRkJReXhEUVVGRExFTkJRVU1zU1VGQlNTeERRVUZETEVOQlFVTXNRMEZCUXl4RlFVRldMRU5CUVZVc1EwRkJReXhGUVVOMlJDeERRVUZETEVkQlFWTXNTVUZCU1N4RFFVRkRMRlZCUVZVc1EwRkJReXhMUVVGTExFTkJRVU1zUlVGRGFFTXNSVUZCUlN4SFFVRmxMRWxCUVVrc1ZVRkJWU3hEUVVGRExFTkJRVU1zUlVGQlF5eEpRVUZKTEVWQlFVTXNRMEZCUXl4RFFVRkRMRVZCUTNwRExGZEJRVmNzUjBGQlJ5eEZRVUZGTEVOQlFVTTdVVUZEY2tJc1EwRkJReXhEUVVGRExFbEJRVWtzUTBGQlF5eEZRVUZGTEVOQlFVTXNRMEZCUXp0UlFVTllMRTlCUVUwc1EwRkJReXhEUVVGRExFTkJRVU1zUzBGQlN5eEZRVUZGTEVWQlFVVTdXVUZEWkN4RlFVRkZMRWRCUVVjc1EwRkJReXhEUVVGRExFZEJRVWNzUlVGQlJTeERRVUZETzFsQlEySXNRMEZCUXl4SFFVRkhMRVZCUVVVc1EwRkJReXhKUVVGSkxFTkJRVU03V1VGRFdpeEpRVUZKTEVOQlFVTXNRMEZCUXl4RlFVRkZMRXRCUVVzc1IwRkJSeXhGUVVGRk8yZENRVU5rTEUxQlFVMDdZVUZEVkR0WlFVTkVMRWxCUVVrc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF5eFZRVUZWTEVOQlFVTXNUVUZCVFN4RFFVRkRPMWxCUVVNc1QwRkJUeXhEUVVGRExFVkJRVVVzUlVGQlJUdG5Ra0ZEY2tNc1NVRkJTU3hUUVVGVExFZEJRVWNzUTBGQlF5eERRVUZETEZWQlFWVXNRMEZCUXl4RFFVRkRMRU5CUVVNc1JVRkRNMElzUTBGQlF5eEhRVUZITEVsQlFVa3NRMEZCUXl4VlFVRlZMRU5CUVVNc1UwRkJVeXhEUVVGRExFVkJRVVVzUTBGQlF5eERRVUZETzJkQ1FVZDBReXhKUVVGSkxFVkJRVVVzUTBGQlF5eEpRVUZKTEVsQlFVa3NRMEZCUXl4RFFVRkRMRVZCUVVVc1MwRkJTeXhGUVVGRkxFTkJRVU1zU1VGQlNTeERRVUZETEVsQlFVa3NRMEZCUXl4RlFVRkZPMjlDUVVGRkxGTkJRVk03WjBKQlNXeEVMRWxCUVVrc1RVRkJUU3hIUVVGSExFTkJRVU1zUTBGQlF5eEZRVUZGTEVkQlFVY3NSMEZCUnl4SFFVRkhMRU5CUVVNc1EwRkJReXhGUVVGRkxFTkJRVU03WjBKQlF5OUNMRWxCUVVjc1RVRkJUU3hKUVVGSkxGZEJRVmNzU1VGQlNTeFhRVUZYTEVOQlFVTXNUVUZCVFN4RFFVRkRMRWxCUVVrc1JVRkJSU3hEUVVGRExFTkJRVU03YjBKQlEyNUVMRk5CUVZNN1owSkJSV0lzU1VGQlNTeEZRVUZGTEVkQlFVY3NSVUZCUlN4RFFVRkRMRWxCUVVrc1EwRkJReXhEUVVGRExFTkJRVU1zVVVGQlVTeERRVUZETEVWQlFVVXNRMEZCUXl4SlFVRkpMRU5CUVVNc1NVRkJTU3hEUVVGRExFVkJRVVVzUlVGQlJTeERRVUZETEVOQlFVTXNSVUZCUlN4RlFVRkZMRU5CUVVNc1EwRkJReXhGUVVGRkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RlFVTjRSQ3hEUVVGRExFZEJRVWNzUlVGQlJTeERRVUZETEVOQlFVTXNSMEZCUnl4VFFVRlRMRU5CUVVNc1VVRkJVU3hIUVVGSExFVkJRVVVzUTBGQlF6dG5Ra0ZIZGtNc1YwRkJWeXhEUVVGRExFMUJRVTBzUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXp0blFrRkRlRUlzUTBGQlF5eERRVUZETEVsQlFVa3NRMEZCUXl4SlFVRkpMRlZCUVZVc1EwRkJReXhEUVVGRExFVkJRVVVzUlVGQlJTeEZRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1lVRkRjRU03VTBGRFNqdFJRVU5FTEVsQlFVa3NTVUZCU1N4SFFVRlpMRVZCUVVVc1EwRkJRenRSUVVOMlFpeFBRVUZQTEVWQlFVVXNRMEZCUXl4SlFVRkpMRVZCUVVVN1dVRkRXaXhGUVVGRkxFZEJRVWNzUlVGQlJTeERRVUZETEVsQlFVa3NRMEZCUXp0WlFVTmlMRWxCUVVrc1EwRkJReXhKUVVGSkxFTkJRVU1zUlVGQlJTeERRVUZETEVsQlFVa3NRMEZCUXl4RlFVRkZMRU5CUVVNc1EwRkJRenRUUVVONlFqdFJRVU5FTEU5QlFVOHNTVUZCU1N4RFFVRkRPMGxCUTJoQ0xFTkJRVU03U1VGRlR5eDFRMEZCYTBJc1IwRkJNVUlzVlVGQk1rSXNTMEZCWVN4RlFVRkZMRWxCUVdsQ08xRkJRV3BDTEhGQ1FVRkJMRVZCUVVFc1VVRkJaMElzUTBGQlF6dFJRVU4yUkN4SlFVRkpMRU5CUVVNc1IwRkJSeXhKUVVGSkxITkNRVUZoTEVOQlFVOHNWVUZCUXl4RFFVRkRMRVZCUVVVc1EwRkJReXhKUVVGTExFOUJRVUVzUTBGQlF5eERRVUZETEVOQlFVTXNTVUZCU1N4RFFVRkRMRU5CUVVNc1EwRkJReXhGUVVGV0xFTkJRVlVzUTBGQlF5eEZRVU5xUkN4RFFVRkRMRWRCUVVjc1NVRkJTU3hEUVVGRExGVkJRVlVzUTBGQlF5eE5RVUZOTEVWQlF6RkNMRU5CUVVNc1IwRkJZU3hKUVVGSkxFdEJRVXNzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0UlFVTXZRaXhQUVVGUExFTkJRVU1zUlVGQlJTeEZRVUZGTzFsQlExSXNTVUZCU1N4SlFVRkpMRWRCUVZNc1NVRkJTU3hEUVVGRExGVkJRVlVzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0WlFVTndReXhKUVVGSkxFTkJRVU1zUTBGQlF5eEhRVUZITEVOQlFVTXNTMEZCU3l4TFFVRkxMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNUVUZCVFN4RFFVRkRMR2xDUVVGcFFpeERRVUZETzFsQlEzQkVMRWxCUVVrc1EwRkJReXhEUVVGRExFZEJRVWNzUTBGQlF5eERRVUZETEVsQlFVa3NRMEZCUXl4SlFVRkpMRU5CUVVNc1EwRkJRenRUUVVONlFqdFJRVU5FTEU5QlFVOHNRMEZCUXl4RFFVRkRMRU5CUVVNc1MwRkJTeXhGUVVGRkxFVkJRVVU3V1VGRlppeEpRVUZKTEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNc1IwRkJSeXhGUVVGRkxFTkJRVU03V1VGRGFFSXNRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhGUVVGRkxFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRPMWxCUTJRc1NVRkJTU3hEUVVGRExFTkJRVU1zUlVGQlJTeExRVUZMTEVsQlFVa3NSVUZCUlR0blFrRkRaaXhKUVVGSkxFbEJRVWtzUjBGQllTeEZRVUZGTEVOQlFVTTdaMEpCUTNoQ0xFbEJRVWtzUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXp0blFrRkRWaXhQUVVGUExFOUJRVThzUTBGQlF5eERRVUZETEVsQlFVa3NTMEZCU3l4WFFVRlhMRVZCUVVVN2IwSkJRMnhETEVsQlFVa3NRMEZCUXl4SlFVRkpMRU5CUVVNc1EwRkJReXhEUVVGRExFbEJRVWtzUTBGQlF5eEZRVUZGTEVOQlFVTXNRMEZCUXp0dlFrRkRja0lzUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXl4SlFVRkpMRU5CUVVNN2FVSkJRMlE3WjBKQlEwUXNUMEZCVHl4SlFVRkpMRU5CUVVNN1lVRkRaanRaUVVORUxFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTXNWVUZCVlN4RFFVRkRMRTFCUVUwc1EwRkJRenRaUVVGRExFOUJRVThzUTBGQlF5eEZRVUZGTEVWQlFVVTdaMEpCUTJwRExFbEJRVWtzVTBGQlV5eEhRVUZITEVOQlFVTXNRMEZCUXl4VlFVRlZMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU03WjBKQlEyaERMRWxCUVVrc1EwRkJReXhIUVVGSExFbEJRVWtzUTBGQlF5eFZRVUZWTEVOQlFVTXNVMEZCVXl4RFFVRkRMRVZCUVVVc1EwRkJReXhEUVVGRE8yZENRVU4wUXl4SlFVRkpMRU5CUVVNc1IwRkJSeXhEUVVGRExFTkJRVU1zUTBGQlF5eEhRVUZITEZOQlFWTXNRMEZCUXl4UlFVRlJMRU5CUVVNN1owSkJRMnBETEVsQlFVa3NRMEZCUXl4RFFVRkRMRU5CUVVNc1MwRkJTeXhOUVVGTkxFTkJRVU1zVTBGQlV5eEpRVUZKTEVOQlFVTXNRMEZCUXl4RFFVRkRMRWRCUVVjc1EwRkJReXhGUVVGRk8yOUNRVU55UXl4RFFVRkRMRU5CUVVNc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF6dHZRa0ZEVWl4RFFVRkRMRU5CUVVNc1NVRkJTU3hIUVVGSExFTkJRVU1zUTBGQlF6dHZRa0ZEV0N4RFFVRkRMRU5CUVVNc1UwRkJVeXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVWQlFVVXNRMEZCUXl4RlFVRkZMRlZCUVVNc1EwRkJReXhGUVVGRExFTkJRVU1zU1VGQlJ5eFBRVUZCTEVOQlFVTXNRMEZCUXl4RFFVRkRMRWRCUVVjc1EwRkJReXhGUVVGUUxFTkJRVThzUTBGQlF5eERRVUZETzJsQ1FVTjJRenRoUVVOS08xTkJRMG83VVVGRFJDeFBRVUZQTEVOQlFVTXNRMEZCUXp0SlFVTmlMRU5CUVVNN1NVRkRUQ3hwUWtGQlF6dEJRVUZFTEVOQlFVTXNRVUZxU1VRc1NVRnBTVU03UVVGcVNWa3NaME5CUVZVaWZRPT0iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciBQb3NpdGlvblN0YXRzID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBQb3NpdGlvblN0YXRzKHNjYWxlKSB7XG4gICAgICAgIHRoaXMuc2NhbGUgPSBzY2FsZTtcbiAgICAgICAgdGhpcy5BQiA9IDA7XG4gICAgICAgIHRoaXMuQUQgPSAwO1xuICAgICAgICB0aGlzLkEyID0gMDtcbiAgICB9XG4gICAgUG9zaXRpb25TdGF0cy5wcm90b3R5cGUuYWRkVmFyaWFibGUgPSBmdW5jdGlvbiAodikge1xuICAgICAgICB2YXIgYWkgPSB0aGlzLnNjYWxlIC8gdi5zY2FsZTtcbiAgICAgICAgdmFyIGJpID0gdi5vZmZzZXQgLyB2LnNjYWxlO1xuICAgICAgICB2YXIgd2kgPSB2LndlaWdodDtcbiAgICAgICAgdGhpcy5BQiArPSB3aSAqIGFpICogYmk7XG4gICAgICAgIHRoaXMuQUQgKz0gd2kgKiBhaSAqIHYuZGVzaXJlZFBvc2l0aW9uO1xuICAgICAgICB0aGlzLkEyICs9IHdpICogYWkgKiBhaTtcbiAgICB9O1xuICAgIFBvc2l0aW9uU3RhdHMucHJvdG90eXBlLmdldFBvc24gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiAodGhpcy5BRCAtIHRoaXMuQUIpIC8gdGhpcy5BMjtcbiAgICB9O1xuICAgIHJldHVybiBQb3NpdGlvblN0YXRzO1xufSgpKTtcbmV4cG9ydHMuUG9zaXRpb25TdGF0cyA9IFBvc2l0aW9uU3RhdHM7XG52YXIgQ29uc3RyYWludCA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gQ29uc3RyYWludChsZWZ0LCByaWdodCwgZ2FwLCBlcXVhbGl0eSkge1xuICAgICAgICBpZiAoZXF1YWxpdHkgPT09IHZvaWQgMCkgeyBlcXVhbGl0eSA9IGZhbHNlOyB9XG4gICAgICAgIHRoaXMubGVmdCA9IGxlZnQ7XG4gICAgICAgIHRoaXMucmlnaHQgPSByaWdodDtcbiAgICAgICAgdGhpcy5nYXAgPSBnYXA7XG4gICAgICAgIHRoaXMuZXF1YWxpdHkgPSBlcXVhbGl0eTtcbiAgICAgICAgdGhpcy5hY3RpdmUgPSBmYWxzZTtcbiAgICAgICAgdGhpcy51bnNhdGlzZmlhYmxlID0gZmFsc2U7XG4gICAgICAgIHRoaXMubGVmdCA9IGxlZnQ7XG4gICAgICAgIHRoaXMucmlnaHQgPSByaWdodDtcbiAgICAgICAgdGhpcy5nYXAgPSBnYXA7XG4gICAgICAgIHRoaXMuZXF1YWxpdHkgPSBlcXVhbGl0eTtcbiAgICB9XG4gICAgQ29uc3RyYWludC5wcm90b3R5cGUuc2xhY2sgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnVuc2F0aXNmaWFibGUgPyBOdW1iZXIuTUFYX1ZBTFVFXG4gICAgICAgICAgICA6IHRoaXMucmlnaHQuc2NhbGUgKiB0aGlzLnJpZ2h0LnBvc2l0aW9uKCkgLSB0aGlzLmdhcFxuICAgICAgICAgICAgICAgIC0gdGhpcy5sZWZ0LnNjYWxlICogdGhpcy5sZWZ0LnBvc2l0aW9uKCk7XG4gICAgfTtcbiAgICByZXR1cm4gQ29uc3RyYWludDtcbn0oKSk7XG5leHBvcnRzLkNvbnN0cmFpbnQgPSBDb25zdHJhaW50O1xudmFyIFZhcmlhYmxlID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBWYXJpYWJsZShkZXNpcmVkUG9zaXRpb24sIHdlaWdodCwgc2NhbGUpIHtcbiAgICAgICAgaWYgKHdlaWdodCA9PT0gdm9pZCAwKSB7IHdlaWdodCA9IDE7IH1cbiAgICAgICAgaWYgKHNjYWxlID09PSB2b2lkIDApIHsgc2NhbGUgPSAxOyB9XG4gICAgICAgIHRoaXMuZGVzaXJlZFBvc2l0aW9uID0gZGVzaXJlZFBvc2l0aW9uO1xuICAgICAgICB0aGlzLndlaWdodCA9IHdlaWdodDtcbiAgICAgICAgdGhpcy5zY2FsZSA9IHNjYWxlO1xuICAgICAgICB0aGlzLm9mZnNldCA9IDA7XG4gICAgfVxuICAgIFZhcmlhYmxlLnByb3RvdHlwZS5kZmR2ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gMi4wICogdGhpcy53ZWlnaHQgKiAodGhpcy5wb3NpdGlvbigpIC0gdGhpcy5kZXNpcmVkUG9zaXRpb24pO1xuICAgIH07XG4gICAgVmFyaWFibGUucHJvdG90eXBlLnBvc2l0aW9uID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gKHRoaXMuYmxvY2sucHMuc2NhbGUgKiB0aGlzLmJsb2NrLnBvc24gKyB0aGlzLm9mZnNldCkgLyB0aGlzLnNjYWxlO1xuICAgIH07XG4gICAgVmFyaWFibGUucHJvdG90eXBlLnZpc2l0TmVpZ2hib3VycyA9IGZ1bmN0aW9uIChwcmV2LCBmKSB7XG4gICAgICAgIHZhciBmZiA9IGZ1bmN0aW9uIChjLCBuZXh0KSB7IHJldHVybiBjLmFjdGl2ZSAmJiBwcmV2ICE9PSBuZXh0ICYmIGYoYywgbmV4dCk7IH07XG4gICAgICAgIHRoaXMuY091dC5mb3JFYWNoKGZ1bmN0aW9uIChjKSB7IHJldHVybiBmZihjLCBjLnJpZ2h0KTsgfSk7XG4gICAgICAgIHRoaXMuY0luLmZvckVhY2goZnVuY3Rpb24gKGMpIHsgcmV0dXJuIGZmKGMsIGMubGVmdCk7IH0pO1xuICAgIH07XG4gICAgcmV0dXJuIFZhcmlhYmxlO1xufSgpKTtcbmV4cG9ydHMuVmFyaWFibGUgPSBWYXJpYWJsZTtcbnZhciBCbG9jayA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gQmxvY2sodikge1xuICAgICAgICB0aGlzLnZhcnMgPSBbXTtcbiAgICAgICAgdi5vZmZzZXQgPSAwO1xuICAgICAgICB0aGlzLnBzID0gbmV3IFBvc2l0aW9uU3RhdHModi5zY2FsZSk7XG4gICAgICAgIHRoaXMuYWRkVmFyaWFibGUodik7XG4gICAgfVxuICAgIEJsb2NrLnByb3RvdHlwZS5hZGRWYXJpYWJsZSA9IGZ1bmN0aW9uICh2KSB7XG4gICAgICAgIHYuYmxvY2sgPSB0aGlzO1xuICAgICAgICB0aGlzLnZhcnMucHVzaCh2KTtcbiAgICAgICAgdGhpcy5wcy5hZGRWYXJpYWJsZSh2KTtcbiAgICAgICAgdGhpcy5wb3NuID0gdGhpcy5wcy5nZXRQb3NuKCk7XG4gICAgfTtcbiAgICBCbG9jay5wcm90b3R5cGUudXBkYXRlV2VpZ2h0ZWRQb3NpdGlvbiA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5wcy5BQiA9IHRoaXMucHMuQUQgPSB0aGlzLnBzLkEyID0gMDtcbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIG4gPSB0aGlzLnZhcnMubGVuZ3RoOyBpIDwgbjsgKytpKVxuICAgICAgICAgICAgdGhpcy5wcy5hZGRWYXJpYWJsZSh0aGlzLnZhcnNbaV0pO1xuICAgICAgICB0aGlzLnBvc24gPSB0aGlzLnBzLmdldFBvc24oKTtcbiAgICB9O1xuICAgIEJsb2NrLnByb3RvdHlwZS5jb21wdXRlX2xtID0gZnVuY3Rpb24gKHYsIHUsIHBvc3RBY3Rpb24pIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgdmFyIGRmZHYgPSB2LmRmZHYoKTtcbiAgICAgICAgdi52aXNpdE5laWdoYm91cnModSwgZnVuY3Rpb24gKGMsIG5leHQpIHtcbiAgICAgICAgICAgIHZhciBfZGZkdiA9IF90aGlzLmNvbXB1dGVfbG0obmV4dCwgdiwgcG9zdEFjdGlvbik7XG4gICAgICAgICAgICBpZiAobmV4dCA9PT0gYy5yaWdodCkge1xuICAgICAgICAgICAgICAgIGRmZHYgKz0gX2RmZHYgKiBjLmxlZnQuc2NhbGU7XG4gICAgICAgICAgICAgICAgYy5sbSA9IF9kZmR2O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgZGZkdiArPSBfZGZkdiAqIGMucmlnaHQuc2NhbGU7XG4gICAgICAgICAgICAgICAgYy5sbSA9IC1fZGZkdjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHBvc3RBY3Rpb24oYyk7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gZGZkdiAvIHYuc2NhbGU7XG4gICAgfTtcbiAgICBCbG9jay5wcm90b3R5cGUucG9wdWxhdGVTcGxpdEJsb2NrID0gZnVuY3Rpb24gKHYsIHByZXYpIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgdi52aXNpdE5laWdoYm91cnMocHJldiwgZnVuY3Rpb24gKGMsIG5leHQpIHtcbiAgICAgICAgICAgIG5leHQub2Zmc2V0ID0gdi5vZmZzZXQgKyAobmV4dCA9PT0gYy5yaWdodCA/IGMuZ2FwIDogLWMuZ2FwKTtcbiAgICAgICAgICAgIF90aGlzLmFkZFZhcmlhYmxlKG5leHQpO1xuICAgICAgICAgICAgX3RoaXMucG9wdWxhdGVTcGxpdEJsb2NrKG5leHQsIHYpO1xuICAgICAgICB9KTtcbiAgICB9O1xuICAgIEJsb2NrLnByb3RvdHlwZS50cmF2ZXJzZSA9IGZ1bmN0aW9uICh2aXNpdCwgYWNjLCB2LCBwcmV2KSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIGlmICh2ID09PSB2b2lkIDApIHsgdiA9IHRoaXMudmFyc1swXTsgfVxuICAgICAgICBpZiAocHJldiA9PT0gdm9pZCAwKSB7IHByZXYgPSBudWxsOyB9XG4gICAgICAgIHYudmlzaXROZWlnaGJvdXJzKHByZXYsIGZ1bmN0aW9uIChjLCBuZXh0KSB7XG4gICAgICAgICAgICBhY2MucHVzaCh2aXNpdChjKSk7XG4gICAgICAgICAgICBfdGhpcy50cmF2ZXJzZSh2aXNpdCwgYWNjLCBuZXh0LCB2KTtcbiAgICAgICAgfSk7XG4gICAgfTtcbiAgICBCbG9jay5wcm90b3R5cGUuZmluZE1pbkxNID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgbSA9IG51bGw7XG4gICAgICAgIHRoaXMuY29tcHV0ZV9sbSh0aGlzLnZhcnNbMF0sIG51bGwsIGZ1bmN0aW9uIChjKSB7XG4gICAgICAgICAgICBpZiAoIWMuZXF1YWxpdHkgJiYgKG0gPT09IG51bGwgfHwgYy5sbSA8IG0ubG0pKVxuICAgICAgICAgICAgICAgIG0gPSBjO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIG07XG4gICAgfTtcbiAgICBCbG9jay5wcm90b3R5cGUuZmluZE1pbkxNQmV0d2VlbiA9IGZ1bmN0aW9uIChsdiwgcnYpIHtcbiAgICAgICAgdGhpcy5jb21wdXRlX2xtKGx2LCBudWxsLCBmdW5jdGlvbiAoKSB7IH0pO1xuICAgICAgICB2YXIgbSA9IG51bGw7XG4gICAgICAgIHRoaXMuZmluZFBhdGgobHYsIG51bGwsIHJ2LCBmdW5jdGlvbiAoYywgbmV4dCkge1xuICAgICAgICAgICAgaWYgKCFjLmVxdWFsaXR5ICYmIGMucmlnaHQgPT09IG5leHQgJiYgKG0gPT09IG51bGwgfHwgYy5sbSA8IG0ubG0pKVxuICAgICAgICAgICAgICAgIG0gPSBjO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIG07XG4gICAgfTtcbiAgICBCbG9jay5wcm90b3R5cGUuZmluZFBhdGggPSBmdW5jdGlvbiAodiwgcHJldiwgdG8sIHZpc2l0KSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIHZhciBlbmRGb3VuZCA9IGZhbHNlO1xuICAgICAgICB2LnZpc2l0TmVpZ2hib3VycyhwcmV2LCBmdW5jdGlvbiAoYywgbmV4dCkge1xuICAgICAgICAgICAgaWYgKCFlbmRGb3VuZCAmJiAobmV4dCA9PT0gdG8gfHwgX3RoaXMuZmluZFBhdGgobmV4dCwgdiwgdG8sIHZpc2l0KSkpIHtcbiAgICAgICAgICAgICAgICBlbmRGb3VuZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgdmlzaXQoYywgbmV4dCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gZW5kRm91bmQ7XG4gICAgfTtcbiAgICBCbG9jay5wcm90b3R5cGUuaXNBY3RpdmVEaXJlY3RlZFBhdGhCZXR3ZWVuID0gZnVuY3Rpb24gKHUsIHYpIHtcbiAgICAgICAgaWYgKHUgPT09IHYpXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgdmFyIGkgPSB1LmNPdXQubGVuZ3RoO1xuICAgICAgICB3aGlsZSAoaS0tKSB7XG4gICAgICAgICAgICB2YXIgYyA9IHUuY091dFtpXTtcbiAgICAgICAgICAgIGlmIChjLmFjdGl2ZSAmJiB0aGlzLmlzQWN0aXZlRGlyZWN0ZWRQYXRoQmV0d2VlbihjLnJpZ2h0LCB2KSlcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfTtcbiAgICBCbG9jay5zcGxpdCA9IGZ1bmN0aW9uIChjKSB7XG4gICAgICAgIGMuYWN0aXZlID0gZmFsc2U7XG4gICAgICAgIHJldHVybiBbQmxvY2suY3JlYXRlU3BsaXRCbG9jayhjLmxlZnQpLCBCbG9jay5jcmVhdGVTcGxpdEJsb2NrKGMucmlnaHQpXTtcbiAgICB9O1xuICAgIEJsb2NrLmNyZWF0ZVNwbGl0QmxvY2sgPSBmdW5jdGlvbiAoc3RhcnRWYXIpIHtcbiAgICAgICAgdmFyIGIgPSBuZXcgQmxvY2soc3RhcnRWYXIpO1xuICAgICAgICBiLnBvcHVsYXRlU3BsaXRCbG9jayhzdGFydFZhciwgbnVsbCk7XG4gICAgICAgIHJldHVybiBiO1xuICAgIH07XG4gICAgQmxvY2sucHJvdG90eXBlLnNwbGl0QmV0d2VlbiA9IGZ1bmN0aW9uICh2bCwgdnIpIHtcbiAgICAgICAgdmFyIGMgPSB0aGlzLmZpbmRNaW5MTUJldHdlZW4odmwsIHZyKTtcbiAgICAgICAgaWYgKGMgIT09IG51bGwpIHtcbiAgICAgICAgICAgIHZhciBicyA9IEJsb2NrLnNwbGl0KGMpO1xuICAgICAgICAgICAgcmV0dXJuIHsgY29uc3RyYWludDogYywgbGI6IGJzWzBdLCByYjogYnNbMV0gfTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9O1xuICAgIEJsb2NrLnByb3RvdHlwZS5tZXJnZUFjcm9zcyA9IGZ1bmN0aW9uIChiLCBjLCBkaXN0KSB7XG4gICAgICAgIGMuYWN0aXZlID0gdHJ1ZTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIG4gPSBiLnZhcnMubGVuZ3RoOyBpIDwgbjsgKytpKSB7XG4gICAgICAgICAgICB2YXIgdiA9IGIudmFyc1tpXTtcbiAgICAgICAgICAgIHYub2Zmc2V0ICs9IGRpc3Q7XG4gICAgICAgICAgICB0aGlzLmFkZFZhcmlhYmxlKHYpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMucG9zbiA9IHRoaXMucHMuZ2V0UG9zbigpO1xuICAgIH07XG4gICAgQmxvY2sucHJvdG90eXBlLmNvc3QgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBzdW0gPSAwLCBpID0gdGhpcy52YXJzLmxlbmd0aDtcbiAgICAgICAgd2hpbGUgKGktLSkge1xuICAgICAgICAgICAgdmFyIHYgPSB0aGlzLnZhcnNbaV0sIGQgPSB2LnBvc2l0aW9uKCkgLSB2LmRlc2lyZWRQb3NpdGlvbjtcbiAgICAgICAgICAgIHN1bSArPSBkICogZCAqIHYud2VpZ2h0O1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBzdW07XG4gICAgfTtcbiAgICByZXR1cm4gQmxvY2s7XG59KCkpO1xuZXhwb3J0cy5CbG9jayA9IEJsb2NrO1xudmFyIEJsb2NrcyA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gQmxvY2tzKHZzKSB7XG4gICAgICAgIHRoaXMudnMgPSB2cztcbiAgICAgICAgdmFyIG4gPSB2cy5sZW5ndGg7XG4gICAgICAgIHRoaXMubGlzdCA9IG5ldyBBcnJheShuKTtcbiAgICAgICAgd2hpbGUgKG4tLSkge1xuICAgICAgICAgICAgdmFyIGIgPSBuZXcgQmxvY2sodnNbbl0pO1xuICAgICAgICAgICAgdGhpcy5saXN0W25dID0gYjtcbiAgICAgICAgICAgIGIuYmxvY2tJbmQgPSBuO1xuICAgICAgICB9XG4gICAgfVxuICAgIEJsb2Nrcy5wcm90b3R5cGUuY29zdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIHN1bSA9IDAsIGkgPSB0aGlzLmxpc3QubGVuZ3RoO1xuICAgICAgICB3aGlsZSAoaS0tKVxuICAgICAgICAgICAgc3VtICs9IHRoaXMubGlzdFtpXS5jb3N0KCk7XG4gICAgICAgIHJldHVybiBzdW07XG4gICAgfTtcbiAgICBCbG9ja3MucHJvdG90eXBlLmluc2VydCA9IGZ1bmN0aW9uIChiKSB7XG4gICAgICAgIGIuYmxvY2tJbmQgPSB0aGlzLmxpc3QubGVuZ3RoO1xuICAgICAgICB0aGlzLmxpc3QucHVzaChiKTtcbiAgICB9O1xuICAgIEJsb2Nrcy5wcm90b3R5cGUucmVtb3ZlID0gZnVuY3Rpb24gKGIpIHtcbiAgICAgICAgdmFyIGxhc3QgPSB0aGlzLmxpc3QubGVuZ3RoIC0gMTtcbiAgICAgICAgdmFyIHN3YXBCbG9jayA9IHRoaXMubGlzdFtsYXN0XTtcbiAgICAgICAgdGhpcy5saXN0Lmxlbmd0aCA9IGxhc3Q7XG4gICAgICAgIGlmIChiICE9PSBzd2FwQmxvY2spIHtcbiAgICAgICAgICAgIHRoaXMubGlzdFtiLmJsb2NrSW5kXSA9IHN3YXBCbG9jaztcbiAgICAgICAgICAgIHN3YXBCbG9jay5ibG9ja0luZCA9IGIuYmxvY2tJbmQ7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIEJsb2Nrcy5wcm90b3R5cGUubWVyZ2UgPSBmdW5jdGlvbiAoYykge1xuICAgICAgICB2YXIgbCA9IGMubGVmdC5ibG9jaywgciA9IGMucmlnaHQuYmxvY2s7XG4gICAgICAgIHZhciBkaXN0ID0gYy5yaWdodC5vZmZzZXQgLSBjLmxlZnQub2Zmc2V0IC0gYy5nYXA7XG4gICAgICAgIGlmIChsLnZhcnMubGVuZ3RoIDwgci52YXJzLmxlbmd0aCkge1xuICAgICAgICAgICAgci5tZXJnZUFjcm9zcyhsLCBjLCBkaXN0KTtcbiAgICAgICAgICAgIHRoaXMucmVtb3ZlKGwpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgbC5tZXJnZUFjcm9zcyhyLCBjLCAtZGlzdCk7XG4gICAgICAgICAgICB0aGlzLnJlbW92ZShyKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgQmxvY2tzLnByb3RvdHlwZS5mb3JFYWNoID0gZnVuY3Rpb24gKGYpIHtcbiAgICAgICAgdGhpcy5saXN0LmZvckVhY2goZik7XG4gICAgfTtcbiAgICBCbG9ja3MucHJvdG90eXBlLnVwZGF0ZUJsb2NrUG9zaXRpb25zID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLmxpc3QuZm9yRWFjaChmdW5jdGlvbiAoYikgeyByZXR1cm4gYi51cGRhdGVXZWlnaHRlZFBvc2l0aW9uKCk7IH0pO1xuICAgIH07XG4gICAgQmxvY2tzLnByb3RvdHlwZS5zcGxpdCA9IGZ1bmN0aW9uIChpbmFjdGl2ZSkge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICB0aGlzLnVwZGF0ZUJsb2NrUG9zaXRpb25zKCk7XG4gICAgICAgIHRoaXMubGlzdC5mb3JFYWNoKGZ1bmN0aW9uIChiKSB7XG4gICAgICAgICAgICB2YXIgdiA9IGIuZmluZE1pbkxNKCk7XG4gICAgICAgICAgICBpZiAodiAhPT0gbnVsbCAmJiB2LmxtIDwgU29sdmVyLkxBR1JBTkdJQU5fVE9MRVJBTkNFKSB7XG4gICAgICAgICAgICAgICAgYiA9IHYubGVmdC5ibG9jaztcbiAgICAgICAgICAgICAgICBCbG9jay5zcGxpdCh2KS5mb3JFYWNoKGZ1bmN0aW9uIChuYikgeyByZXR1cm4gX3RoaXMuaW5zZXJ0KG5iKTsgfSk7XG4gICAgICAgICAgICAgICAgX3RoaXMucmVtb3ZlKGIpO1xuICAgICAgICAgICAgICAgIGluYWN0aXZlLnB1c2godik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH07XG4gICAgcmV0dXJuIEJsb2Nrcztcbn0oKSk7XG5leHBvcnRzLkJsb2NrcyA9IEJsb2NrcztcbnZhciBTb2x2ZXIgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIFNvbHZlcih2cywgY3MpIHtcbiAgICAgICAgdGhpcy52cyA9IHZzO1xuICAgICAgICB0aGlzLmNzID0gY3M7XG4gICAgICAgIHRoaXMudnMgPSB2cztcbiAgICAgICAgdnMuZm9yRWFjaChmdW5jdGlvbiAodikge1xuICAgICAgICAgICAgdi5jSW4gPSBbXSwgdi5jT3V0ID0gW107XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLmNzID0gY3M7XG4gICAgICAgIGNzLmZvckVhY2goZnVuY3Rpb24gKGMpIHtcbiAgICAgICAgICAgIGMubGVmdC5jT3V0LnB1c2goYyk7XG4gICAgICAgICAgICBjLnJpZ2h0LmNJbi5wdXNoKGMpO1xuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5pbmFjdGl2ZSA9IGNzLm1hcChmdW5jdGlvbiAoYykgeyBjLmFjdGl2ZSA9IGZhbHNlOyByZXR1cm4gYzsgfSk7XG4gICAgICAgIHRoaXMuYnMgPSBudWxsO1xuICAgIH1cbiAgICBTb2x2ZXIucHJvdG90eXBlLmNvc3QgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmJzLmNvc3QoKTtcbiAgICB9O1xuICAgIFNvbHZlci5wcm90b3R5cGUuc2V0U3RhcnRpbmdQb3NpdGlvbnMgPSBmdW5jdGlvbiAocHMpIHtcbiAgICAgICAgdGhpcy5pbmFjdGl2ZSA9IHRoaXMuY3MubWFwKGZ1bmN0aW9uIChjKSB7IGMuYWN0aXZlID0gZmFsc2U7IHJldHVybiBjOyB9KTtcbiAgICAgICAgdGhpcy5icyA9IG5ldyBCbG9ja3ModGhpcy52cyk7XG4gICAgICAgIHRoaXMuYnMuZm9yRWFjaChmdW5jdGlvbiAoYiwgaSkgeyByZXR1cm4gYi5wb3NuID0gcHNbaV07IH0pO1xuICAgIH07XG4gICAgU29sdmVyLnByb3RvdHlwZS5zZXREZXNpcmVkUG9zaXRpb25zID0gZnVuY3Rpb24gKHBzKSB7XG4gICAgICAgIHRoaXMudnMuZm9yRWFjaChmdW5jdGlvbiAodiwgaSkgeyByZXR1cm4gdi5kZXNpcmVkUG9zaXRpb24gPSBwc1tpXTsgfSk7XG4gICAgfTtcbiAgICBTb2x2ZXIucHJvdG90eXBlLm1vc3RWaW9sYXRlZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIG1pblNsYWNrID0gTnVtYmVyLk1BWF9WQUxVRSwgdiA9IG51bGwsIGwgPSB0aGlzLmluYWN0aXZlLCBuID0gbC5sZW5ndGgsIGRlbGV0ZVBvaW50ID0gbjtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBuOyArK2kpIHtcbiAgICAgICAgICAgIHZhciBjID0gbFtpXTtcbiAgICAgICAgICAgIGlmIChjLnVuc2F0aXNmaWFibGUpXG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB2YXIgc2xhY2sgPSBjLnNsYWNrKCk7XG4gICAgICAgICAgICBpZiAoYy5lcXVhbGl0eSB8fCBzbGFjayA8IG1pblNsYWNrKSB7XG4gICAgICAgICAgICAgICAgbWluU2xhY2sgPSBzbGFjaztcbiAgICAgICAgICAgICAgICB2ID0gYztcbiAgICAgICAgICAgICAgICBkZWxldGVQb2ludCA9IGk7XG4gICAgICAgICAgICAgICAgaWYgKGMuZXF1YWxpdHkpXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChkZWxldGVQb2ludCAhPT0gbiAmJlxuICAgICAgICAgICAgKG1pblNsYWNrIDwgU29sdmVyLlpFUk9fVVBQRVJCT1VORCAmJiAhdi5hY3RpdmUgfHwgdi5lcXVhbGl0eSkpIHtcbiAgICAgICAgICAgIGxbZGVsZXRlUG9pbnRdID0gbFtuIC0gMV07XG4gICAgICAgICAgICBsLmxlbmd0aCA9IG4gLSAxO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB2O1xuICAgIH07XG4gICAgU29sdmVyLnByb3RvdHlwZS5zYXRpc2Z5ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAodGhpcy5icyA9PSBudWxsKSB7XG4gICAgICAgICAgICB0aGlzLmJzID0gbmV3IEJsb2Nrcyh0aGlzLnZzKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmJzLnNwbGl0KHRoaXMuaW5hY3RpdmUpO1xuICAgICAgICB2YXIgdiA9IG51bGw7XG4gICAgICAgIHdoaWxlICgodiA9IHRoaXMubW9zdFZpb2xhdGVkKCkpICYmICh2LmVxdWFsaXR5IHx8IHYuc2xhY2soKSA8IFNvbHZlci5aRVJPX1VQUEVSQk9VTkQgJiYgIXYuYWN0aXZlKSkge1xuICAgICAgICAgICAgdmFyIGxiID0gdi5sZWZ0LmJsb2NrLCByYiA9IHYucmlnaHQuYmxvY2s7XG4gICAgICAgICAgICBpZiAobGIgIT09IHJiKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5icy5tZXJnZSh2KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGlmIChsYi5pc0FjdGl2ZURpcmVjdGVkUGF0aEJldHdlZW4odi5yaWdodCwgdi5sZWZ0KSkge1xuICAgICAgICAgICAgICAgICAgICB2LnVuc2F0aXNmaWFibGUgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdmFyIHNwbGl0ID0gbGIuc3BsaXRCZXR3ZWVuKHYubGVmdCwgdi5yaWdodCk7XG4gICAgICAgICAgICAgICAgaWYgKHNwbGl0ICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYnMuaW5zZXJ0KHNwbGl0LmxiKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5icy5pbnNlcnQoc3BsaXQucmIpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmJzLnJlbW92ZShsYik7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuaW5hY3RpdmUucHVzaChzcGxpdC5jb25zdHJhaW50KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHYudW5zYXRpc2ZpYWJsZSA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAodi5zbGFjaygpID49IDApIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5pbmFjdGl2ZS5wdXNoKHYpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5icy5tZXJnZSh2KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuICAgIFNvbHZlci5wcm90b3R5cGUuc29sdmUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuc2F0aXNmeSgpO1xuICAgICAgICB2YXIgbGFzdGNvc3QgPSBOdW1iZXIuTUFYX1ZBTFVFLCBjb3N0ID0gdGhpcy5icy5jb3N0KCk7XG4gICAgICAgIHdoaWxlIChNYXRoLmFicyhsYXN0Y29zdCAtIGNvc3QpID4gMC4wMDAxKSB7XG4gICAgICAgICAgICB0aGlzLnNhdGlzZnkoKTtcbiAgICAgICAgICAgIGxhc3Rjb3N0ID0gY29zdDtcbiAgICAgICAgICAgIGNvc3QgPSB0aGlzLmJzLmNvc3QoKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gY29zdDtcbiAgICB9O1xuICAgIFNvbHZlci5MQUdSQU5HSUFOX1RPTEVSQU5DRSA9IC0xZS00O1xuICAgIFNvbHZlci5aRVJPX1VQUEVSQk9VTkQgPSAtMWUtMTA7XG4gICAgcmV0dXJuIFNvbHZlcjtcbn0oKSk7XG5leHBvcnRzLlNvbHZlciA9IFNvbHZlcjtcbmZ1bmN0aW9uIHJlbW92ZU92ZXJsYXBJbk9uZURpbWVuc2lvbihzcGFucywgbG93ZXJCb3VuZCwgdXBwZXJCb3VuZCkge1xuICAgIHZhciB2cyA9IHNwYW5zLm1hcChmdW5jdGlvbiAocykgeyByZXR1cm4gbmV3IFZhcmlhYmxlKHMuZGVzaXJlZENlbnRlcik7IH0pO1xuICAgIHZhciBjcyA9IFtdO1xuICAgIHZhciBuID0gc3BhbnMubGVuZ3RoO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbiAtIDE7IGkrKykge1xuICAgICAgICB2YXIgbGVmdCA9IHNwYW5zW2ldLCByaWdodCA9IHNwYW5zW2kgKyAxXTtcbiAgICAgICAgY3MucHVzaChuZXcgQ29uc3RyYWludCh2c1tpXSwgdnNbaSArIDFdLCAobGVmdC5zaXplICsgcmlnaHQuc2l6ZSkgLyAyKSk7XG4gICAgfVxuICAgIHZhciBsZWZ0TW9zdCA9IHZzWzBdLCByaWdodE1vc3QgPSB2c1tuIC0gMV0sIGxlZnRNb3N0U2l6ZSA9IHNwYW5zWzBdLnNpemUgLyAyLCByaWdodE1vc3RTaXplID0gc3BhbnNbbiAtIDFdLnNpemUgLyAyO1xuICAgIHZhciB2TG93ZXIgPSBudWxsLCB2VXBwZXIgPSBudWxsO1xuICAgIGlmIChsb3dlckJvdW5kKSB7XG4gICAgICAgIHZMb3dlciA9IG5ldyBWYXJpYWJsZShsb3dlckJvdW5kLCBsZWZ0TW9zdC53ZWlnaHQgKiAxMDAwKTtcbiAgICAgICAgdnMucHVzaCh2TG93ZXIpO1xuICAgICAgICBjcy5wdXNoKG5ldyBDb25zdHJhaW50KHZMb3dlciwgbGVmdE1vc3QsIGxlZnRNb3N0U2l6ZSkpO1xuICAgIH1cbiAgICBpZiAodXBwZXJCb3VuZCkge1xuICAgICAgICB2VXBwZXIgPSBuZXcgVmFyaWFibGUodXBwZXJCb3VuZCwgcmlnaHRNb3N0LndlaWdodCAqIDEwMDApO1xuICAgICAgICB2cy5wdXNoKHZVcHBlcik7XG4gICAgICAgIGNzLnB1c2gobmV3IENvbnN0cmFpbnQocmlnaHRNb3N0LCB2VXBwZXIsIHJpZ2h0TW9zdFNpemUpKTtcbiAgICB9XG4gICAgdmFyIHNvbHZlciA9IG5ldyBTb2x2ZXIodnMsIGNzKTtcbiAgICBzb2x2ZXIuc29sdmUoKTtcbiAgICByZXR1cm4ge1xuICAgICAgICBuZXdDZW50ZXJzOiB2cy5zbGljZSgwLCBzcGFucy5sZW5ndGgpLm1hcChmdW5jdGlvbiAodikgeyByZXR1cm4gdi5wb3NpdGlvbigpOyB9KSxcbiAgICAgICAgbG93ZXJCb3VuZDogdkxvd2VyID8gdkxvd2VyLnBvc2l0aW9uKCkgOiBsZWZ0TW9zdC5wb3NpdGlvbigpIC0gbGVmdE1vc3RTaXplLFxuICAgICAgICB1cHBlckJvdW5kOiB2VXBwZXIgPyB2VXBwZXIucG9zaXRpb24oKSA6IHJpZ2h0TW9zdC5wb3NpdGlvbigpICsgcmlnaHRNb3N0U2l6ZVxuICAgIH07XG59XG5leHBvcnRzLnJlbW92ZU92ZXJsYXBJbk9uZURpbWVuc2lvbiA9IHJlbW92ZU92ZXJsYXBJbk9uZURpbWVuc2lvbjtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWRhdGE6YXBwbGljYXRpb24vanNvbjtiYXNlNjQsZXlKMlpYSnphVzl1SWpvekxDSm1hV3hsSWpvaWRuQnpZeTVxY3lJc0luTnZkWEpqWlZKdmIzUWlPaUlpTENKemIzVnlZMlZ6SWpwYklpNHVMeTR1TDFkbFlrTnZiR0V2YzNKakwzWndjMk11ZEhNaVhTd2libUZ0WlhNaU9sdGRMQ0p0WVhCd2FXNW5jeUk2SWpzN1FVRkJTVHRKUVV0SkxIVkNRVUZ0UWl4TFFVRmhPMUZCUVdJc1ZVRkJTeXhIUVVGTUxFdEJRVXNzUTBGQlVUdFJRVXBvUXl4UFFVRkZMRWRCUVZjc1EwRkJReXhEUVVGRE8xRkJRMllzVDBGQlJTeEhRVUZYTEVOQlFVTXNRMEZCUXp0UlFVTm1MRTlCUVVVc1IwRkJWeXhEUVVGRExFTkJRVU03U1VGRmIwSXNRMEZCUXp0SlFVVndReXh0UTBGQlZ5eEhRVUZZTEZWQlFWa3NRMEZCVnp0UlFVTnVRaXhKUVVGSkxFVkJRVVVzUjBGQlJ5eEpRVUZKTEVOQlFVTXNTMEZCU3l4SFFVRkhMRU5CUVVNc1EwRkJReXhMUVVGTExFTkJRVU03VVVGRE9VSXNTVUZCU1N4RlFVRkZMRWRCUVVjc1EwRkJReXhEUVVGRExFMUJRVTBzUjBGQlJ5eERRVUZETEVOQlFVTXNTMEZCU3l4RFFVRkRPMUZCUXpWQ0xFbEJRVWtzUlVGQlJTeEhRVUZITEVOQlFVTXNRMEZCUXl4TlFVRk5MRU5CUVVNN1VVRkRiRUlzU1VGQlNTeERRVUZETEVWQlFVVXNTVUZCU1N4RlFVRkZMRWRCUVVjc1JVRkJSU3hIUVVGSExFVkJRVVVzUTBGQlF6dFJRVU40UWl4SlFVRkpMRU5CUVVNc1JVRkJSU3hKUVVGSkxFVkJRVVVzUjBGQlJ5eEZRVUZGTEVkQlFVY3NRMEZCUXl4RFFVRkRMR1ZCUVdVc1EwRkJRenRSUVVOMlF5eEpRVUZKTEVOQlFVTXNSVUZCUlN4SlFVRkpMRVZCUVVVc1IwRkJSeXhGUVVGRkxFZEJRVWNzUlVGQlJTeERRVUZETzBsQlF6VkNMRU5CUVVNN1NVRkZSQ3dyUWtGQlR5eEhRVUZRTzFGQlEwa3NUMEZCVHl4RFFVRkRMRWxCUVVrc1EwRkJReXhGUVVGRkxFZEJRVWNzU1VGQlNTeERRVUZETEVWQlFVVXNRMEZCUXl4SFFVRkhMRWxCUVVrc1EwRkJReXhGUVVGRkxFTkJRVU03U1VGRGVrTXNRMEZCUXp0SlFVTk1MRzlDUVVGRE8wRkJRVVFzUTBGQlF5eEJRVzVDUkN4SlFXMUNRenRCUVc1Q1dTeHpRMEZCWVR0QlFYRkNNVUk3U1VGTFNTeHZRa0ZCYlVJc1NVRkJZeXhGUVVGVExFdEJRV1VzUlVGQlV5eEhRVUZYTEVWQlFWTXNVVUZCZVVJN1VVRkJla0lzZVVKQlFVRXNSVUZCUVN4blFrRkJlVUk3VVVGQk5VWXNVMEZCU1N4SFFVRktMRWxCUVVrc1EwRkJWVHRSUVVGVExGVkJRVXNzUjBGQlRDeExRVUZMTEVOQlFWVTdVVUZCVXl4UlFVRkhMRWRCUVVnc1IwRkJSeXhEUVVGUk8xRkJRVk1zWVVGQlVTeEhRVUZTTEZGQlFWRXNRMEZCYVVJN1VVRklMMGNzVjBGQlRTeEhRVUZaTEV0QlFVc3NRMEZCUXp0UlFVTjRRaXhyUWtGQllTeEhRVUZaTEV0QlFVc3NRMEZCUXp0UlFVY3pRaXhKUVVGSkxFTkJRVU1zU1VGQlNTeEhRVUZITEVsQlFVa3NRMEZCUXp0UlFVTnFRaXhKUVVGSkxFTkJRVU1zUzBGQlN5eEhRVUZITEV0QlFVc3NRMEZCUXp0UlFVTnVRaXhKUVVGSkxFTkJRVU1zUjBGQlJ5eEhRVUZITEVkQlFVY3NRMEZCUXp0UlFVTm1MRWxCUVVrc1EwRkJReXhSUVVGUkxFZEJRVWNzVVVGQlVTeERRVUZETzBsQlF6ZENMRU5CUVVNN1NVRkZSQ3d3UWtGQlN5eEhRVUZNTzFGQlEwa3NUMEZCVHl4SlFVRkpMRU5CUVVNc1lVRkJZU3hEUVVGRExFTkJRVU1zUTBGQlF5eE5RVUZOTEVOQlFVTXNVMEZCVXp0WlFVTjRReXhEUVVGRExFTkJRVU1zU1VGQlNTeERRVUZETEV0QlFVc3NRMEZCUXl4TFFVRkxMRWRCUVVjc1NVRkJTU3hEUVVGRExFdEJRVXNzUTBGQlF5eFJRVUZSTEVWQlFVVXNSMEZCUnl4SlFVRkpMRU5CUVVNc1IwRkJSenRyUWtGRGJrUXNTVUZCU1N4RFFVRkRMRWxCUVVrc1EwRkJReXhMUVVGTExFZEJRVWNzU1VGQlNTeERRVUZETEVsQlFVa3NRMEZCUXl4UlFVRlJMRVZCUVVVc1EwRkJRenRKUVVOcVJDeERRVUZETzBsQlEwd3NhVUpCUVVNN1FVRkJSQ3hEUVVGRExFRkJha0pFTEVsQmFVSkRPMEZCYWtKWkxHZERRVUZWTzBGQmJVSjJRanRKUVUxSkxHdENRVUZ0UWl4bFFVRjFRaXhGUVVGVExFMUJRV3RDTEVWQlFWTXNTMEZCYVVJN1VVRkJOVU1zZFVKQlFVRXNSVUZCUVN4VlFVRnJRanRSUVVGVExITkNRVUZCTEVWQlFVRXNVMEZCYVVJN1VVRkJOVVVzYjBKQlFXVXNSMEZCWml4bFFVRmxMRU5CUVZFN1VVRkJVeXhYUVVGTkxFZEJRVTRzVFVGQlRTeERRVUZaTzFGQlFWTXNWVUZCU3l4SFFVRk1MRXRCUVVzc1EwRkJXVHRSUVV3dlJpeFhRVUZOTEVkQlFWY3NRMEZCUXl4RFFVRkRPMGxCU3l0RkxFTkJRVU03U1VGRmJrY3NkVUpCUVVrc1IwRkJTanRSUVVOSkxFOUJRVThzUjBGQlJ5eEhRVUZITEVsQlFVa3NRMEZCUXl4TlFVRk5MRWRCUVVjc1EwRkJReXhKUVVGSkxFTkJRVU1zVVVGQlVTeEZRVUZGTEVkQlFVY3NTVUZCU1N4RFFVRkRMR1ZCUVdVc1EwRkJReXhEUVVGRE8wbEJRM2hGTEVOQlFVTTdTVUZGUkN3eVFrRkJVU3hIUVVGU08xRkJRMGtzVDBGQlR5eERRVUZETEVsQlFVa3NRMEZCUXl4TFFVRkxMRU5CUVVNc1JVRkJSU3hEUVVGRExFdEJRVXNzUjBGQlJ5eEpRVUZKTEVOQlFVTXNTMEZCU3l4RFFVRkRMRWxCUVVrc1IwRkJSeXhKUVVGSkxFTkJRVU1zVFVGQlRTeERRVUZETEVkQlFVY3NTVUZCU1N4RFFVRkRMRXRCUVVzc1EwRkJRenRKUVVNNVJTeERRVUZETzBsQlIwUXNhME5CUVdVc1IwRkJaaXhWUVVGblFpeEpRVUZqTEVWQlFVVXNRMEZCTUVNN1VVRkRkRVVzU1VGQlNTeEZRVUZGTEVkQlFVY3NWVUZCUXl4RFFVRkRMRVZCUVVVc1NVRkJTU3hKUVVGTExFOUJRVUVzUTBGQlF5eERRVUZETEUxQlFVMHNTVUZCU1N4SlFVRkpMRXRCUVVzc1NVRkJTU3hKUVVGSkxFTkJRVU1zUTBGQlF5eERRVUZETEVWQlFVVXNTVUZCU1N4RFFVRkRMRVZCUVhaRExFTkJRWFZETEVOQlFVTTdVVUZET1VRc1NVRkJTU3hEUVVGRExFbEJRVWtzUTBGQlF5eFBRVUZQTEVOQlFVTXNWVUZCUVN4RFFVRkRMRWxCUVVjc1QwRkJRU3hGUVVGRkxFTkJRVU1zUTBGQlF5eEZRVUZGTEVOQlFVTXNRMEZCUXl4TFFVRkxMRU5CUVVNc1JVRkJaQ3hEUVVGakxFTkJRVU1zUTBGQlF6dFJRVU4wUXl4SlFVRkpMRU5CUVVNc1IwRkJSeXhEUVVGRExFOUJRVThzUTBGQlF5eFZRVUZCTEVOQlFVTXNTVUZCUnl4UFFVRkJMRVZCUVVVc1EwRkJReXhEUVVGRExFVkJRVVVzUTBGQlF5eERRVUZETEVsQlFVa3NRMEZCUXl4RlFVRmlMRU5CUVdFc1EwRkJReXhEUVVGRE8wbEJRM2hETEVOQlFVTTdTVUZEVEN4bFFVRkRPMEZCUVVRc1EwRkJReXhCUVhSQ1JDeEpRWE5DUXp0QlFYUkNXU3cwUWtGQlVUdEJRWGRDY2tJN1NVRk5TU3hsUVVGWkxFTkJRVmM3VVVGTWRrSXNVMEZCU1N4SFFVRmxMRVZCUVVVc1EwRkJRenRSUVUxc1FpeERRVUZETEVOQlFVTXNUVUZCVFN4SFFVRkhMRU5CUVVNc1EwRkJRenRSUVVOaUxFbEJRVWtzUTBGQlF5eEZRVUZGTEVkQlFVY3NTVUZCU1N4aFFVRmhMRU5CUVVNc1EwRkJReXhEUVVGRExFdEJRVXNzUTBGQlF5eERRVUZETzFGQlEzSkRMRWxCUVVrc1EwRkJReXhYUVVGWExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTTdTVUZEZUVJc1EwRkJRenRKUVVWUExESkNRVUZYTEVkQlFXNUNMRlZCUVc5Q0xFTkJRVmM3VVVGRE0wSXNRMEZCUXl4RFFVRkRMRXRCUVVzc1IwRkJSeXhKUVVGSkxFTkJRVU03VVVGRFppeEpRVUZKTEVOQlFVTXNTVUZCU1N4RFFVRkRMRWxCUVVrc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dFJRVU5zUWl4SlFVRkpMRU5CUVVNc1JVRkJSU3hEUVVGRExGZEJRVmNzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0UlFVTjJRaXhKUVVGSkxFTkJRVU1zU1VGQlNTeEhRVUZITEVsQlFVa3NRMEZCUXl4RlFVRkZMRU5CUVVNc1QwRkJUeXhGUVVGRkxFTkJRVU03U1VGRGJFTXNRMEZCUXp0SlFVZEVMSE5EUVVGelFpeEhRVUYwUWp0UlFVTkpMRWxCUVVrc1EwRkJReXhGUVVGRkxFTkJRVU1zUlVGQlJTeEhRVUZITEVsQlFVa3NRMEZCUXl4RlFVRkZMRU5CUVVNc1JVRkJSU3hIUVVGSExFbEJRVWtzUTBGQlF5eEZRVUZGTEVOQlFVTXNSVUZCUlN4SFFVRkhMRU5CUVVNc1EwRkJRenRSUVVONlF5eExRVUZMTEVsQlFVa3NRMEZCUXl4SFFVRkhMRU5CUVVNc1JVRkJSU3hEUVVGRExFZEJRVWNzU1VGQlNTeERRVUZETEVsQlFVa3NRMEZCUXl4TlFVRk5MRVZCUVVVc1EwRkJReXhIUVVGSExFTkJRVU1zUlVGQlJTeEZRVUZGTEVOQlFVTTdXVUZETlVNc1NVRkJTU3hEUVVGRExFVkJRVVVzUTBGQlF5eFhRVUZYTEVOQlFVTXNTVUZCU1N4RFFVRkRMRWxCUVVrc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETzFGQlEzUkRMRWxCUVVrc1EwRkJReXhKUVVGSkxFZEJRVWNzU1VGQlNTeERRVUZETEVWQlFVVXNRMEZCUXl4UFFVRlBMRVZCUVVVc1EwRkJRenRKUVVOc1F5eERRVUZETzBsQlJVOHNNRUpCUVZVc1IwRkJiRUlzVlVGQmJVSXNRMEZCVnl4RlFVRkZMRU5CUVZjc1JVRkJSU3hWUVVGcFF6dFJRVUU1UlN4cFFrRmpRenRSUVdKSExFbEJRVWtzU1VGQlNTeEhRVUZITEVOQlFVTXNRMEZCUXl4SlFVRkpMRVZCUVVVc1EwRkJRenRSUVVOd1FpeERRVUZETEVOQlFVTXNaVUZCWlN4RFFVRkRMRU5CUVVNc1JVRkJSU3hWUVVGRExFTkJRVU1zUlVGQlJTeEpRVUZKTzFsQlEzcENMRWxCUVVrc1MwRkJTeXhIUVVGSExFdEJRVWtzUTBGQlF5eFZRVUZWTEVOQlFVTXNTVUZCU1N4RlFVRkZMRU5CUVVNc1JVRkJSU3hWUVVGVkxFTkJRVU1zUTBGQlF6dFpRVU5xUkN4SlFVRkpMRWxCUVVrc1MwRkJTeXhEUVVGRExFTkJRVU1zUzBGQlN5eEZRVUZGTzJkQ1FVTnNRaXhKUVVGSkxFbEJRVWtzUzBGQlN5eEhRVUZITEVOQlFVTXNRMEZCUXl4SlFVRkpMRU5CUVVNc1MwRkJTeXhEUVVGRE8yZENRVU0zUWl4RFFVRkRMRU5CUVVNc1JVRkJSU3hIUVVGSExFdEJRVXNzUTBGQlF6dGhRVU5vUWp0cFFrRkJUVHRuUWtGRFNDeEpRVUZKTEVsQlFVa3NTMEZCU3l4SFFVRkhMRU5CUVVNc1EwRkJReXhMUVVGTExFTkJRVU1zUzBGQlN5eERRVUZETzJkQ1FVTTVRaXhEUVVGRExFTkJRVU1zUlVGQlJTeEhRVUZITEVOQlFVTXNTMEZCU3l4RFFVRkRPMkZCUTJwQ08xbEJRMFFzVlVGQlZTeERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRPMUZCUTJ4Q0xFTkJRVU1zUTBGQlF5eERRVUZETzFGQlEwZ3NUMEZCVHl4SlFVRkpMRWRCUVVjc1EwRkJReXhEUVVGRExFdEJRVXNzUTBGQlF6dEpRVU14UWl4RFFVRkRPMGxCUlU4c2EwTkJRV3RDTEVkQlFURkNMRlZCUVRKQ0xFTkJRVmNzUlVGQlJTeEpRVUZqTzFGQlFYUkVMR2xDUVUxRE8xRkJURWNzUTBGQlF5eERRVUZETEdWQlFXVXNRMEZCUXl4SlFVRkpMRVZCUVVVc1ZVRkJReXhEUVVGRExFVkJRVVVzU1VGQlNUdFpRVU0xUWl4SlFVRkpMRU5CUVVNc1RVRkJUU3hIUVVGSExFTkJRVU1zUTBGQlF5eE5RVUZOTEVkQlFVY3NRMEZCUXl4SlFVRkpMRXRCUVVzc1EwRkJReXhEUVVGRExFdEJRVXNzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNN1dVRkROMFFzUzBGQlNTeERRVUZETEZkQlFWY3NRMEZCUXl4SlFVRkpMRU5CUVVNc1EwRkJRenRaUVVOMlFpeExRVUZKTEVOQlFVTXNhMEpCUVd0Q0xFTkJRVU1zU1VGQlNTeEZRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRPMUZCUTNKRExFTkJRVU1zUTBGQlF5eERRVUZETzBsQlExQXNRMEZCUXp0SlFVZEVMSGRDUVVGUkxFZEJRVklzVlVGQlV5eExRVUUyUWl4RlFVRkZMRWRCUVZVc1JVRkJSU3hEUVVFd1FpeEZRVUZGTEVsQlFXMUNPMUZCUVc1SExHbENRVXRETzFGQlRHMUVMR3RDUVVGQkxFVkJRVUVzU1VGQll5eEpRVUZKTEVOQlFVTXNTVUZCU1N4RFFVRkRMRU5CUVVNc1EwRkJRenRSUVVGRkxIRkNRVUZCTEVWQlFVRXNWMEZCYlVJN1VVRkRMMFlzUTBGQlF5eERRVUZETEdWQlFXVXNRMEZCUXl4SlFVRkpMRVZCUVVVc1ZVRkJReXhEUVVGRExFVkJRVVVzU1VGQlNUdFpRVU0xUWl4SFFVRkhMRU5CUVVNc1NVRkJTU3hEUVVGRExFdEJRVXNzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRPMWxCUTI1Q0xFdEJRVWtzUTBGQlF5eFJRVUZSTEVOQlFVTXNTMEZCU3l4RlFVRkZMRWRCUVVjc1JVRkJSU3hKUVVGSkxFVkJRVVVzUTBGQlF5eERRVUZETEVOQlFVTTdVVUZEZGtNc1EwRkJReXhEUVVGRExFTkJRVU03U1VGRFVDeERRVUZETzBsQlMwUXNlVUpCUVZNc1IwRkJWRHRSUVVOSkxFbEJRVWtzUTBGQlF5eEhRVUZsTEVsQlFVa3NRMEZCUXp0UlFVTjZRaXhKUVVGSkxFTkJRVU1zVlVGQlZTeERRVUZETEVsQlFVa3NRMEZCUXl4SlFVRkpMRU5CUVVNc1EwRkJReXhEUVVGRExFVkJRVVVzU1VGQlNTeEZRVUZGTEZWQlFVRXNRMEZCUXp0WlFVTnFReXhKUVVGSkxFTkJRVU1zUTBGQlF5eERRVUZETEZGQlFWRXNTVUZCU1N4RFFVRkRMRU5CUVVNc1MwRkJTeXhKUVVGSkxFbEJRVWtzUTBGQlF5eERRVUZETEVWQlFVVXNSMEZCUnl4RFFVRkRMRU5CUVVNc1JVRkJSU3hEUVVGRE8yZENRVUZGTEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNN1VVRkRNVVFzUTBGQlF5eERRVUZETEVOQlFVTTdVVUZEU0N4UFFVRlBMRU5CUVVNc1EwRkJRenRKUVVOaUxFTkJRVU03U1VGRlR5eG5RMEZCWjBJc1IwRkJlRUlzVlVGQmVVSXNSVUZCV1N4RlFVRkZMRVZCUVZrN1VVRkRMME1zU1VGQlNTeERRVUZETEZWQlFWVXNRMEZCUXl4RlFVRkZMRVZCUVVVc1NVRkJTU3hGUVVGRkxHTkJRVThzUTBGQlF5eERRVUZETEVOQlFVTTdVVUZEY0VNc1NVRkJTU3hEUVVGRExFZEJRVWNzU1VGQlNTeERRVUZETzFGQlEySXNTVUZCU1N4RFFVRkRMRkZCUVZFc1EwRkJReXhGUVVGRkxFVkJRVVVzU1VGQlNTeEZRVUZGTEVWQlFVVXNSVUZCUlN4VlFVRkRMRU5CUVVNc1JVRkJSU3hKUVVGSk8xbEJRMmhETEVsQlFVa3NRMEZCUXl4RFFVRkRMRU5CUVVNc1VVRkJVU3hKUVVGSkxFTkJRVU1zUTBGQlF5eExRVUZMTEV0QlFVc3NTVUZCU1N4SlFVRkpMRU5CUVVNc1EwRkJReXhMUVVGTExFbEJRVWtzU1VGQlNTeERRVUZETEVOQlFVTXNSVUZCUlN4SFFVRkhMRU5CUVVNc1EwRkJReXhGUVVGRkxFTkJRVU03WjBKQlFVVXNRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJRenRSUVVNNVJTeERRVUZETEVOQlFVTXNRMEZCUXp0UlFVTklMRTlCUVU4c1EwRkJReXhEUVVGRE8wbEJRMklzUTBGQlF6dEpRVVZQTEhkQ1FVRlJMRWRCUVdoQ0xGVkJRV2xDTEVOQlFWY3NSVUZCUlN4SlFVRmpMRVZCUVVVc1JVRkJXU3hGUVVGRkxFdEJRVEpETzFGQlFYWkhMR2xDUVZWRE8xRkJWRWNzU1VGQlNTeFJRVUZSTEVkQlFVY3NTMEZCU3l4RFFVRkRPMUZCUTNKQ0xFTkJRVU1zUTBGQlF5eGxRVUZsTEVOQlFVTXNTVUZCU1N4RlFVRkZMRlZCUVVNc1EwRkJReXhGUVVGRkxFbEJRVWs3V1VGRE5VSXNTVUZCU1N4RFFVRkRMRkZCUVZFc1NVRkJTU3hEUVVGRExFbEJRVWtzUzBGQlN5eEZRVUZGTEVsQlFVa3NTMEZCU1N4RFFVRkRMRkZCUVZFc1EwRkJReXhKUVVGSkxFVkJRVVVzUTBGQlF5eEZRVUZGTEVWQlFVVXNSVUZCUlN4TFFVRkxMRU5CUVVNc1EwRkJReXhGUVVOdVJUdG5Ra0ZEU1N4UlFVRlJMRWRCUVVjc1NVRkJTU3hEUVVGRE8yZENRVU5vUWl4TFFVRkxMRU5CUVVNc1EwRkJReXhGUVVGRkxFbEJRVWtzUTBGQlF5eERRVUZETzJGQlEyeENPMUZCUTB3c1EwRkJReXhEUVVGRExFTkJRVU03VVVGRFNDeFBRVUZQTEZGQlFWRXNRMEZCUXp0SlFVTndRaXhEUVVGRE8wbEJTVVFzTWtOQlFUSkNMRWRCUVROQ0xGVkJRVFJDTEVOQlFWY3NSVUZCUlN4RFFVRlhPMUZCUTJoRUxFbEJRVWtzUTBGQlF5eExRVUZMTEVOQlFVTTdXVUZCUlN4UFFVRlBMRWxCUVVrc1EwRkJRenRSUVVONlFpeEpRVUZKTEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNc1NVRkJTU3hEUVVGRExFMUJRVTBzUTBGQlF6dFJRVU4wUWl4UFFVRk5MRU5CUVVNc1JVRkJSU3hGUVVGRk8xbEJRMUFzU1VGQlNTeERRVUZETEVkQlFVY3NRMEZCUXl4RFFVRkRMRWxCUVVrc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dFpRVU5zUWl4SlFVRkpMRU5CUVVNc1EwRkJReXhOUVVGTkxFbEJRVWtzU1VGQlNTeERRVUZETERKQ1FVRXlRaXhEUVVGRExFTkJRVU1zUTBGQlF5eExRVUZMTEVWQlFVVXNRMEZCUXl4RFFVRkRPMmRDUVVONFJDeFBRVUZQTEVsQlFVa3NRMEZCUXp0VFFVTnVRanRSUVVORUxFOUJRVThzUzBGQlN5eERRVUZETzBsQlEycENMRU5CUVVNN1NVRkhUU3hYUVVGTExFZEJRVm9zVlVGQllTeERRVUZoTzFGQlMzUkNMRU5CUVVNc1EwRkJReXhOUVVGTkxFZEJRVWNzUzBGQlN5eERRVUZETzFGQlEycENMRTlCUVU4c1EwRkJReXhMUVVGTExFTkJRVU1zWjBKQlFXZENMRU5CUVVNc1EwRkJReXhEUVVGRExFbEJRVWtzUTBGQlF5eEZRVUZGTEV0QlFVc3NRMEZCUXl4blFrRkJaMElzUTBGQlF5eERRVUZETEVOQlFVTXNTMEZCU3l4RFFVRkRMRU5CUVVNc1EwRkJRenRKUVVNM1JTeERRVUZETzBsQlJXTXNjMEpCUVdkQ0xFZEJRUzlDTEZWQlFXZERMRkZCUVd0Q08xRkJRemxETEVsQlFVa3NRMEZCUXl4SFFVRkhMRWxCUVVrc1MwRkJTeXhEUVVGRExGRkJRVkVzUTBGQlF5eERRVUZETzFGQlF6VkNMRU5CUVVNc1EwRkJReXhyUWtGQmEwSXNRMEZCUXl4UlFVRlJMRVZCUVVVc1NVRkJTU3hEUVVGRExFTkJRVU03VVVGRGNrTXNUMEZCVHl4RFFVRkRMRU5CUVVNN1NVRkRZaXhEUVVGRE8wbEJSMFFzTkVKQlFWa3NSMEZCV2l4VlFVRmhMRVZCUVZrc1JVRkJSU3hGUVVGWk8xRkJTMjVETEVsQlFVa3NRMEZCUXl4SFFVRkhMRWxCUVVrc1EwRkJReXhuUWtGQlowSXNRMEZCUXl4RlFVRkZMRVZCUVVVc1JVRkJSU3hEUVVGRExFTkJRVU03VVVGRGRFTXNTVUZCU1N4RFFVRkRMRXRCUVVzc1NVRkJTU3hGUVVGRk8xbEJRMW9zU1VGQlNTeEZRVUZGTEVkQlFVY3NTMEZCU3l4RFFVRkRMRXRCUVVzc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF6dFpRVU40UWl4UFFVRlBMRVZCUVVVc1ZVRkJWU3hGUVVGRkxFTkJRVU1zUlVGQlJTeEZRVUZGTEVWQlFVVXNSVUZCUlN4RFFVRkRMRU5CUVVNc1EwRkJReXhGUVVGRkxFVkJRVVVzUlVGQlJTeEZRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRMRVZCUVVVc1EwRkJRenRUUVVOc1JEdFJRVVZFTEU5QlFVOHNTVUZCU1N4RFFVRkRPMGxCUTJoQ0xFTkJRVU03U1VGRlJDd3lRa0ZCVnl4SFFVRllMRlZCUVZrc1EwRkJVU3hGUVVGRkxFTkJRV0VzUlVGQlJTeEpRVUZaTzFGQlF6ZERMRU5CUVVNc1EwRkJReXhOUVVGTkxFZEJRVWNzU1VGQlNTeERRVUZETzFGQlEyaENMRXRCUVVzc1NVRkJTU3hEUVVGRExFZEJRVWNzUTBGQlF5eEZRVUZGTEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNc1NVRkJTU3hEUVVGRExFMUJRVTBzUlVGQlJTeERRVUZETEVkQlFVY3NRMEZCUXl4RlFVRkZMRVZCUVVVc1EwRkJReXhGUVVGRk8xbEJRek5ETEVsQlFVa3NRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJReXhKUVVGSkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTTdXVUZEYkVJc1EwRkJReXhEUVVGRExFMUJRVTBzU1VGQlNTeEpRVUZKTEVOQlFVTTdXVUZEYWtJc1NVRkJTU3hEUVVGRExGZEJRVmNzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0VFFVTjJRanRSUVVORUxFbEJRVWtzUTBGQlF5eEpRVUZKTEVkQlFVY3NTVUZCU1N4RFFVRkRMRVZCUVVVc1EwRkJReXhQUVVGUExFVkJRVVVzUTBGQlF6dEpRVU5zUXl4RFFVRkRPMGxCUlVRc2IwSkJRVWtzUjBGQlNqdFJRVU5KTEVsQlFVa3NSMEZCUnl4SFFVRkhMRU5CUVVNc1JVRkJSU3hEUVVGRExFZEJRVWNzU1VGQlNTeERRVUZETEVsQlFVa3NRMEZCUXl4TlFVRk5MRU5CUVVNN1VVRkRiRU1zVDBGQlR5eERRVUZETEVWQlFVVXNSVUZCUlR0WlFVTlNMRWxCUVVrc1EwRkJReXhIUVVGSExFbEJRVWtzUTBGQlF5eEpRVUZKTEVOQlFVTXNRMEZCUXl4RFFVRkRMRVZCUTJoQ0xFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTXNVVUZCVVN4RlFVRkZMRWRCUVVjc1EwRkJReXhEUVVGRExHVkJRV1VzUTBGQlF6dFpRVU42UXl4SFFVRkhMRWxCUVVrc1EwRkJReXhIUVVGSExFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTXNUVUZCVFN4RFFVRkRPMU5CUXpOQ08xRkJRMFFzVDBGQlR5eEhRVUZITEVOQlFVTTdTVUZEWml4RFFVRkRPMGxCVTB3c1dVRkJRenRCUVVGRUxFTkJRVU1zUVVGc1MwUXNTVUZyUzBNN1FVRnNTMWtzYzBKQlFVczdRVUZ2UzJ4Q08wbEJSMGtzWjBKQlFXMUNMRVZCUVdNN1VVRkJaQ3hQUVVGRkxFZEJRVVlzUlVGQlJTeERRVUZaTzFGQlF6ZENMRWxCUVVrc1EwRkJReXhIUVVGSExFVkJRVVVzUTBGQlF5eE5RVUZOTEVOQlFVTTdVVUZEYkVJc1NVRkJTU3hEUVVGRExFbEJRVWtzUjBGQlJ5eEpRVUZKTEV0QlFVc3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJRenRSUVVONlFpeFBRVUZQTEVOQlFVTXNSVUZCUlN4RlFVRkZPMWxCUTFJc1NVRkJTU3hEUVVGRExFZEJRVWNzU1VGQlNTeExRVUZMTEVOQlFVTXNSVUZCUlN4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRExFTkJRVU03V1VGRGVrSXNTVUZCU1N4RFFVRkRMRWxCUVVrc1EwRkJReXhEUVVGRExFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTTdXVUZEYWtJc1EwRkJReXhEUVVGRExGRkJRVkVzUjBGQlJ5eERRVUZETEVOQlFVTTdVMEZEYkVJN1NVRkRUQ3hEUVVGRE8wbEJSVVFzY1VKQlFVa3NSMEZCU2p0UlFVTkpMRWxCUVVrc1IwRkJSeXhIUVVGSExFTkJRVU1zUlVGQlJTeERRVUZETEVkQlFVY3NTVUZCU1N4RFFVRkRMRWxCUVVrc1EwRkJReXhOUVVGTkxFTkJRVU03VVVGRGJFTXNUMEZCVHl4RFFVRkRMRVZCUVVVN1dVRkJSU3hIUVVGSExFbEJRVWtzU1VGQlNTeERRVUZETEVsQlFVa3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhKUVVGSkxFVkJRVVVzUTBGQlF6dFJRVU4yUXl4UFFVRlBMRWRCUVVjc1EwRkJRenRKUVVObUxFTkJRVU03U1VGRlJDeDFRa0ZCVFN4SFFVRk9MRlZCUVU4c1EwRkJVVHRSUVVsWUxFTkJRVU1zUTBGQlF5eFJRVUZSTEVkQlFVY3NTVUZCU1N4RFFVRkRMRWxCUVVrc1EwRkJReXhOUVVGTkxFTkJRVU03VVVGRE9VSXNTVUZCU1N4RFFVRkRMRWxCUVVrc1EwRkJReXhKUVVGSkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTTdTVUZMZEVJc1EwRkJRenRKUVVWRUxIVkNRVUZOTEVkQlFVNHNWVUZCVHl4RFFVRlJPMUZCUzFnc1NVRkJTU3hKUVVGSkxFZEJRVWNzU1VGQlNTeERRVUZETEVsQlFVa3NRMEZCUXl4TlFVRk5MRWRCUVVjc1EwRkJReXhEUVVGRE8xRkJRMmhETEVsQlFVa3NVMEZCVXl4SFFVRkhMRWxCUVVrc1EwRkJReXhKUVVGSkxFTkJRVU1zU1VGQlNTeERRVUZETEVOQlFVTTdVVUZEYUVNc1NVRkJTU3hEUVVGRExFbEJRVWtzUTBGQlF5eE5RVUZOTEVkQlFVY3NTVUZCU1N4RFFVRkRPMUZCUTNoQ0xFbEJRVWtzUTBGQlF5eExRVUZMTEZOQlFWTXNSVUZCUlR0WlFVTnFRaXhKUVVGSkxFTkJRVU1zU1VGQlNTeERRVUZETEVOQlFVTXNRMEZCUXl4UlFVRlJMRU5CUVVNc1IwRkJSeXhUUVVGVExFTkJRVU03V1VGRGJFTXNVMEZCVXl4RFFVRkRMRkZCUVZFc1IwRkJSeXhEUVVGRExFTkJRVU1zVVVGQlVTeERRVUZETzFOQlNXNURPMGxCUTB3c1EwRkJRenRKUVVsRUxITkNRVUZMTEVkQlFVd3NWVUZCVFN4RFFVRmhPMUZCUTJZc1NVRkJTU3hEUVVGRExFZEJRVWNzUTBGQlF5eERRVUZETEVsQlFVa3NRMEZCUXl4TFFVRkxMRVZCUVVVc1EwRkJReXhIUVVGSExFTkJRVU1zUTBGQlF5eExRVUZMTEVOQlFVTXNTMEZCU3l4RFFVRkRPMUZCU1hoRExFbEJRVWtzU1VGQlNTeEhRVUZITEVOQlFVTXNRMEZCUXl4TFFVRkxMRU5CUVVNc1RVRkJUU3hIUVVGSExFTkJRVU1zUTBGQlF5eEpRVUZKTEVOQlFVTXNUVUZCVFN4SFFVRkhMRU5CUVVNc1EwRkJReXhIUVVGSExFTkJRVU03VVVGRGJFUXNTVUZCU1N4RFFVRkRMRU5CUVVNc1NVRkJTU3hEUVVGRExFMUJRVTBzUjBGQlJ5eERRVUZETEVOQlFVTXNTVUZCU1N4RFFVRkRMRTFCUVUwc1JVRkJSVHRaUVVNdlFpeERRVUZETEVOQlFVTXNWMEZCVnl4RFFVRkRMRU5CUVVNc1JVRkJSU3hEUVVGRExFVkJRVVVzU1VGQlNTeERRVUZETEVOQlFVTTdXVUZETVVJc1NVRkJTU3hEUVVGRExFMUJRVTBzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0VFFVTnNRanRoUVVGTk8xbEJRMGdzUTBGQlF5eERRVUZETEZkQlFWY3NRMEZCUXl4RFFVRkRMRVZCUVVVc1EwRkJReXhGUVVGRkxFTkJRVU1zU1VGQlNTeERRVUZETEVOQlFVTTdXVUZETTBJc1NVRkJTU3hEUVVGRExFMUJRVTBzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0VFFVTnNRanRKUVV0TUxFTkJRVU03U1VGRlJDeDNRa0ZCVHl4SFFVRlFMRlZCUVZFc1EwRkJaME03VVVGRGNFTXNTVUZCU1N4RFFVRkRMRWxCUVVrc1EwRkJReXhQUVVGUExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTTdTVUZEZWtJc1EwRkJRenRKUVVkRUxIRkRRVUZ2UWl4SFFVRndRanRSUVVOSkxFbEJRVWtzUTBGQlF5eEpRVUZKTEVOQlFVTXNUMEZCVHl4RFFVRkRMRlZCUVVFc1EwRkJReXhKUVVGSExFOUJRVUVzUTBGQlF5eERRVUZETEhOQ1FVRnpRaXhGUVVGRkxFVkJRVEZDTEVOQlFUQkNMRU5CUVVNc1EwRkJRenRKUVVOMFJDeERRVUZETzBsQlIwUXNjMEpCUVVzc1IwRkJUQ3hWUVVGTkxGRkJRWE5DTzFGQlFUVkNMR2xDUVdWRE8xRkJaRWNzU1VGQlNTeERRVUZETEc5Q1FVRnZRaXhGUVVGRkxFTkJRVU03VVVGRE5VSXNTVUZCU1N4RFFVRkRMRWxCUVVrc1EwRkJReXhQUVVGUExFTkJRVU1zVlVGQlFTeERRVUZETzFsQlEyWXNTVUZCU1N4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRExGTkJRVk1zUlVGQlJTeERRVUZETzFsQlEzUkNMRWxCUVVrc1EwRkJReXhMUVVGTExFbEJRVWtzU1VGQlNTeERRVUZETEVOQlFVTXNSVUZCUlN4SFFVRkhMRTFCUVUwc1EwRkJReXh2UWtGQmIwSXNSVUZCUlR0blFrRkRiRVFzUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXl4SlFVRkpMRU5CUVVNc1MwRkJTeXhEUVVGRE8yZENRVU5xUWl4TFFVRkxMRU5CUVVNc1MwRkJTeXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEU5QlFVOHNRMEZCUXl4VlFVRkJMRVZCUVVVc1NVRkJSU3hQUVVGQkxFdEJRVWtzUTBGQlF5eE5RVUZOTEVOQlFVTXNSVUZCUlN4RFFVRkRMRVZCUVdZc1EwRkJaU3hEUVVGRExFTkJRVU03WjBKQlF6VkRMRXRCUVVrc1EwRkJReXhOUVVGTkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTTdaMEpCUTJZc1VVRkJVU3hEUVVGRExFbEJRVWtzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0aFFVdHdRanRSUVVOTUxFTkJRVU1zUTBGQlF5eERRVUZETzBsQlExQXNRMEZCUXp0SlFXOUNUQ3hoUVVGRE8wRkJRVVFzUTBGQlF5eEJRV3hJUkN4SlFXdElRenRCUVd4SVdTeDNRa0ZCVFR0QlFXOUlia0k3U1VGUFNTeG5Ra0ZCYlVJc1JVRkJZeXhGUVVGVExFVkJRV2RDTzFGQlFYWkRMRTlCUVVVc1IwRkJSaXhGUVVGRkxFTkJRVms3VVVGQlV5eFBRVUZGTEVkQlFVWXNSVUZCUlN4RFFVRmpPMUZCUTNSRUxFbEJRVWtzUTBGQlF5eEZRVUZGTEVkQlFVY3NSVUZCUlN4RFFVRkRPMUZCUTJJc1JVRkJSU3hEUVVGRExFOUJRVThzUTBGQlF5eFZRVUZCTEVOQlFVTTdXVUZEVWl4RFFVRkRMRU5CUVVNc1IwRkJSeXhIUVVGSExFVkJRVVVzUlVGQlJTeERRVUZETEVOQlFVTXNTVUZCU1N4SFFVRkhMRVZCUVVVc1EwRkJRenRSUVVrMVFpeERRVUZETEVOQlFVTXNRMEZCUXp0UlFVTklMRWxCUVVrc1EwRkJReXhGUVVGRkxFZEJRVWNzUlVGQlJTeERRVUZETzFGQlEySXNSVUZCUlN4RFFVRkRMRTlCUVU4c1EwRkJReXhWUVVGQkxFTkJRVU03V1VGRFVpeERRVUZETEVOQlFVTXNTVUZCU1N4RFFVRkRMRWxCUVVrc1EwRkJReXhKUVVGSkxFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTTdXVUZEY0VJc1EwRkJReXhEUVVGRExFdEJRVXNzUTBGQlF5eEhRVUZITEVOQlFVTXNTVUZCU1N4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRE8xRkJTWGhDTEVOQlFVTXNRMEZCUXl4RFFVRkRPMUZCUTBnc1NVRkJTU3hEUVVGRExGRkJRVkVzUjBGQlJ5eEZRVUZGTEVOQlFVTXNSMEZCUnl4RFFVRkRMRlZCUVVFc1EwRkJReXhKUVVGTExFTkJRVU1zUTBGQlF5eE5RVUZOTEVkQlFVY3NTMEZCU3l4RFFVRkRMRU5CUVVNc1QwRkJUeXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXp0UlFVTTFSQ3hKUVVGSkxFTkJRVU1zUlVGQlJTeEhRVUZITEVsQlFVa3NRMEZCUXp0SlFVTnVRaXhEUVVGRE8wbEJSVVFzY1VKQlFVa3NSMEZCU2p0UlFVTkpMRTlCUVU4c1NVRkJTU3hEUVVGRExFVkJRVVVzUTBGQlF5eEpRVUZKTEVWQlFVVXNRMEZCUXp0SlFVTXhRaXhEUVVGRE8wbEJTVVFzY1VOQlFXOUNMRWRCUVhCQ0xGVkJRWEZDTEVWQlFWazdVVUZETjBJc1NVRkJTU3hEUVVGRExGRkJRVkVzUjBGQlJ5eEpRVUZKTEVOQlFVTXNSVUZCUlN4RFFVRkRMRWRCUVVjc1EwRkJReXhWUVVGQkxFTkJRVU1zU1VGQlN5eERRVUZETEVOQlFVTXNUVUZCVFN4SFFVRkhMRXRCUVVzc1EwRkJReXhEUVVGRExFOUJRVThzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVNN1VVRkRha1VzU1VGQlNTeERRVUZETEVWQlFVVXNSMEZCUnl4SlFVRkpMRTFCUVUwc1EwRkJReXhKUVVGSkxFTkJRVU1zUlVGQlJTeERRVUZETEVOQlFVTTdVVUZET1VJc1NVRkJTU3hEUVVGRExFVkJRVVVzUTBGQlF5eFBRVUZQTEVOQlFVTXNWVUZCUXl4RFFVRkRMRVZCUVVVc1EwRkJReXhKUVVGTExFOUJRVUVzUTBGQlF5eERRVUZETEVsQlFVa3NSMEZCUnl4RlFVRkZMRU5CUVVNc1EwRkJReXhEUVVGRExFVkJRV1FzUTBGQll5eERRVUZETEVOQlFVTTdTVUZET1VNc1EwRkJRenRKUVVWRUxHOURRVUZ0UWl4SFFVRnVRaXhWUVVGdlFpeEZRVUZaTzFGQlF6VkNMRWxCUVVrc1EwRkJReXhGUVVGRkxFTkJRVU1zVDBGQlR5eERRVUZETEZWQlFVTXNRMEZCUXl4RlFVRkZMRU5CUVVNc1NVRkJTeXhQUVVGQkxFTkJRVU1zUTBGQlF5eGxRVUZsTEVkQlFVY3NSVUZCUlN4RFFVRkRMRU5CUVVNc1EwRkJReXhGUVVGNlFpeERRVUY1UWl4RFFVRkRMRU5CUVVNN1NVRkRla1FzUTBGQlF6dEpRVEpDVHl3MlFrRkJXU3hIUVVGd1FqdFJRVU5KTEVsQlFVa3NVVUZCVVN4SFFVRkhMRTFCUVUwc1EwRkJReXhUUVVGVExFVkJRek5DTEVOQlFVTXNSMEZCWlN4SlFVRkpMRVZCUTNCQ0xFTkJRVU1zUjBGQlJ5eEpRVUZKTEVOQlFVTXNVVUZCVVN4RlFVTnFRaXhEUVVGRExFZEJRVWNzUTBGQlF5eERRVUZETEUxQlFVMHNSVUZEV2l4WFFVRlhMRWRCUVVjc1EwRkJReXhEUVVGRE8xRkJRM0JDTEV0QlFVc3NTVUZCU1N4RFFVRkRMRWRCUVVjc1EwRkJReXhGUVVGRkxFTkJRVU1zUjBGQlJ5eERRVUZETEVWQlFVVXNSVUZCUlN4RFFVRkRMRVZCUVVVN1dVRkRlRUlzU1VGQlNTeERRVUZETEVkQlFVY3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJReXhEUVVGRE8xbEJRMklzU1VGQlNTeERRVUZETEVOQlFVTXNZVUZCWVR0blFrRkJSU3hUUVVGVE8xbEJRemxDTEVsQlFVa3NTMEZCU3l4SFFVRkhMRU5CUVVNc1EwRkJReXhMUVVGTExFVkJRVVVzUTBGQlF6dFpRVU4wUWl4SlFVRkpMRU5CUVVNc1EwRkJReXhSUVVGUkxFbEJRVWtzUzBGQlN5eEhRVUZITEZGQlFWRXNSVUZCUlR0blFrRkRhRU1zVVVGQlVTeEhRVUZITEV0QlFVc3NRMEZCUXp0blFrRkRha0lzUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXp0blFrRkRUaXhYUVVGWExFZEJRVWNzUTBGQlF5eERRVUZETzJkQ1FVTm9RaXhKUVVGSkxFTkJRVU1zUTBGQlF5eFJRVUZSTzI5Q1FVRkZMRTFCUVUwN1lVRkRla0k3VTBGRFNqdFJRVU5FTEVsQlFVa3NWMEZCVnl4TFFVRkxMRU5CUVVNN1dVRkRha0lzUTBGQlF5eFJRVUZSTEVkQlFVY3NUVUZCVFN4RFFVRkRMR1ZCUVdVc1NVRkJTU3hEUVVGRExFTkJRVU1zUTBGQlF5eE5RVUZOTEVsQlFVa3NRMEZCUXl4RFFVRkRMRkZCUVZFc1EwRkJReXhGUVVOc1JUdFpRVU5KTEVOQlFVTXNRMEZCUXl4WFFVRlhMRU5CUVVNc1IwRkJSeXhEUVVGRExFTkJRVU1zUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXl4RFFVRkRPMWxCUXpGQ0xFTkJRVU1zUTBGQlF5eE5RVUZOTEVkQlFVY3NRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJRenRUUVVOd1FqdFJRVU5FTEU5QlFVOHNRMEZCUXl4RFFVRkRPMGxCUTJJc1EwRkJRenRKUVVsRUxIZENRVUZQTEVkQlFWQTdVVUZEU1N4SlFVRkpMRWxCUVVrc1EwRkJReXhGUVVGRkxFbEJRVWtzU1VGQlNTeEZRVUZGTzFsQlEycENMRWxCUVVrc1EwRkJReXhGUVVGRkxFZEJRVWNzU1VGQlNTeE5RVUZOTEVOQlFVTXNTVUZCU1N4RFFVRkRMRVZCUVVVc1EwRkJReXhEUVVGRE8xTkJRMnBETzFGQlNVUXNTVUZCU1N4RFFVRkRMRVZCUVVVc1EwRkJReXhMUVVGTExFTkJRVU1zU1VGQlNTeERRVUZETEZGQlFWRXNRMEZCUXl4RFFVRkRPMUZCUXpkQ0xFbEJRVWtzUTBGQlF5eEhRVUZsTEVsQlFVa3NRMEZCUXp0UlFVTjZRaXhQUVVGUExFTkJRVU1zUTBGQlF5eEhRVUZITEVsQlFVa3NRMEZCUXl4WlFVRlpMRVZCUVVVc1EwRkJReXhKUVVGSkxFTkJRVU1zUTBGQlF5eERRVUZETEZGQlFWRXNTVUZCU1N4RFFVRkRMRU5CUVVNc1MwRkJTeXhGUVVGRkxFZEJRVWNzVFVGQlRTeERRVUZETEdWQlFXVXNTVUZCU1N4RFFVRkRMRU5CUVVNc1EwRkJReXhOUVVGTkxFTkJRVU1zUlVGQlJUdFpRVU5xUnl4SlFVRkpMRVZCUVVVc1IwRkJSeXhEUVVGRExFTkJRVU1zU1VGQlNTeERRVUZETEV0QlFVc3NSVUZCUlN4RlFVRkZMRWRCUVVjc1EwRkJReXhEUVVGRExFdEJRVXNzUTBGQlF5eExRVUZMTEVOQlFVTTdXVUZOTVVNc1NVRkJTU3hGUVVGRkxFdEJRVXNzUlVGQlJTeEZRVUZGTzJkQ1FVTllMRWxCUVVrc1EwRkJReXhGUVVGRkxFTkJRVU1zUzBGQlN5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRPMkZCUTNCQ08ybENRVUZOTzJkQ1FVTklMRWxCUVVrc1JVRkJSU3hEUVVGRExESkNRVUV5UWl4RFFVRkRMRU5CUVVNc1EwRkJReXhMUVVGTExFVkJRVVVzUTBGQlF5eERRVUZETEVsQlFVa3NRMEZCUXl4RlFVRkZPMjlDUVVWcVJDeERRVUZETEVOQlFVTXNZVUZCWVN4SFFVRkhMRWxCUVVrc1EwRkJRenR2UWtGRGRrSXNVMEZCVXp0cFFrRkRXanRuUWtGRlJDeEpRVUZKTEV0QlFVc3NSMEZCUnl4RlFVRkZMRU5CUVVNc1dVRkJXU3hEUVVGRExFTkJRVU1zUTBGQlF5eEpRVUZKTEVWQlFVVXNRMEZCUXl4RFFVRkRMRXRCUVVzc1EwRkJReXhEUVVGRE8yZENRVU0zUXl4SlFVRkpMRXRCUVVzc1MwRkJTeXhKUVVGSkxFVkJRVVU3YjBKQlEyaENMRWxCUVVrc1EwRkJReXhGUVVGRkxFTkJRVU1zVFVGQlRTeERRVUZETEV0QlFVc3NRMEZCUXl4RlFVRkZMRU5CUVVNc1EwRkJRenR2UWtGRGVrSXNTVUZCU1N4RFFVRkRMRVZCUVVVc1EwRkJReXhOUVVGTkxFTkJRVU1zUzBGQlN5eERRVUZETEVWQlFVVXNRMEZCUXl4RFFVRkRPMjlDUVVONlFpeEpRVUZKTEVOQlFVTXNSVUZCUlN4RFFVRkRMRTFCUVUwc1EwRkJReXhGUVVGRkxFTkJRVU1zUTBGQlF6dHZRa0ZEYmtJc1NVRkJTU3hEUVVGRExGRkJRVkVzUTBGQlF5eEpRVUZKTEVOQlFVTXNTMEZCU3l4RFFVRkRMRlZCUVZVc1EwRkJReXhEUVVGRE8ybENRVU40UXp0eFFrRkJUVHR2UWtGSlNDeERRVUZETEVOQlFVTXNZVUZCWVN4SFFVRkhMRWxCUVVrc1EwRkJRenR2UWtGRGRrSXNVMEZCVXp0cFFrRkRXanRuUWtGRFJDeEpRVUZKTEVOQlFVTXNRMEZCUXl4TFFVRkxMRVZCUVVVc1NVRkJTU3hEUVVGRExFVkJRVVU3YjBKQlMyaENMRWxCUVVrc1EwRkJReXhSUVVGUkxFTkJRVU1zU1VGQlNTeERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRPMmxDUVVONlFqdHhRa0ZCVFR0dlFrRkpTQ3hKUVVGSkxFTkJRVU1zUlVGQlJTeERRVUZETEV0QlFVc3NRMEZCUXl4RFFVRkRMRU5CUVVNc1EwRkJRenRwUWtGRGNFSTdZVUZEU2p0VFFVMUtPMGxCU1V3c1EwRkJRenRKUVVkRUxITkNRVUZMTEVkQlFVdzdVVUZEU1N4SlFVRkpMRU5CUVVNc1QwRkJUeXhGUVVGRkxFTkJRVU03VVVGRFppeEpRVUZKTEZGQlFWRXNSMEZCUnl4TlFVRk5MRU5CUVVNc1UwRkJVeXhGUVVGRkxFbEJRVWtzUjBGQlJ5eEpRVUZKTEVOQlFVTXNSVUZCUlN4RFFVRkRMRWxCUVVrc1JVRkJSU3hEUVVGRE8xRkJRM1pFTEU5QlFVOHNTVUZCU1N4RFFVRkRMRWRCUVVjc1EwRkJReXhSUVVGUkxFZEJRVWNzU1VGQlNTeERRVUZETEVkQlFVY3NUVUZCVFN4RlFVRkZPMWxCUTNaRExFbEJRVWtzUTBGQlF5eFBRVUZQTEVWQlFVVXNRMEZCUXp0WlFVTm1MRkZCUVZFc1IwRkJSeXhKUVVGSkxFTkJRVU03V1VGRGFFSXNTVUZCU1N4SFFVRkhMRWxCUVVrc1EwRkJReXhGUVVGRkxFTkJRVU1zU1VGQlNTeEZRVUZGTEVOQlFVTTdVMEZEZWtJN1VVRkRSQ3hQUVVGUExFbEJRVWtzUTBGQlF6dEpRVU5vUWl4RFFVRkRPMGxCY0V0TkxESkNRVUZ2UWl4SFFVRkhMRU5CUVVNc1NVRkJTU3hEUVVGRE8wbEJRemRDTEhOQ1FVRmxMRWRCUVVjc1EwRkJReXhMUVVGTExFTkJRVU03U1VGdlMzQkRMR0ZCUVVNN1EwRkJRU3hCUVhwTFJDeEpRWGxMUXp0QlFYcExXU3gzUWtGQlRUdEJRV2xNYmtJc1UwRkJaMElzTWtKQlFUSkNMRU5CUVVNc1MwRkJaMFFzUlVGQlJTeFZRVUZ0UWl4RlFVRkZMRlZCUVcxQ08wbEJSMnhKTEVsQlFVMHNSVUZCUlN4SFFVRmxMRXRCUVVzc1EwRkJReXhIUVVGSExFTkJRVU1zVlVGQlFTeERRVUZETEVsQlFVa3NUMEZCUVN4SlFVRkpMRkZCUVZFc1EwRkJReXhEUVVGRExFTkJRVU1zWVVGQllTeERRVUZETEVWQlFUZENMRU5CUVRaQ0xFTkJRVU1zUTBGQlF6dEpRVU55UlN4SlFVRk5MRVZCUVVVc1IwRkJhVUlzUlVGQlJTeERRVUZETzBsQlF6VkNMRWxCUVUwc1EwRkJReXhIUVVGSExFdEJRVXNzUTBGQlF5eE5RVUZOTEVOQlFVTTdTVUZEZGtJc1MwRkJTeXhKUVVGSkxFTkJRVU1zUjBGQlJ5eERRVUZETEVWQlFVVXNRMEZCUXl4SFFVRkhMRU5CUVVNc1IwRkJSeXhEUVVGRExFVkJRVVVzUTBGQlF5eEZRVUZGTEVWQlFVVTdVVUZETlVJc1NVRkJUU3hKUVVGSkxFZEJRVWNzUzBGQlN5eERRVUZETEVOQlFVTXNRMEZCUXl4RlFVRkZMRXRCUVVzc1IwRkJSeXhMUVVGTExFTkJRVU1zUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXl4RFFVRkRPMUZCUXpWRExFVkJRVVVzUTBGQlF5eEpRVUZKTEVOQlFVTXNTVUZCU1N4VlFVRlZMRU5CUVVNc1JVRkJSU3hEUVVGRExFTkJRVU1zUTBGQlF5eEZRVUZGTEVWQlFVVXNRMEZCUXl4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRExFVkJRVVVzUTBGQlF5eEpRVUZKTEVOQlFVTXNTVUZCU1N4SFFVRkhMRXRCUVVzc1EwRkJReXhKUVVGSkxFTkJRVU1zUjBGQlJ5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkRPMHRCUXpORk8wbEJRMFFzU1VGQlRTeFJRVUZSTEVkQlFVY3NSVUZCUlN4RFFVRkRMRU5CUVVNc1EwRkJReXhGUVVOc1FpeFRRVUZUTEVkQlFVY3NSVUZCUlN4RFFVRkRMRU5CUVVNc1IwRkJSeXhEUVVGRExFTkJRVU1zUlVGRGNrSXNXVUZCV1N4SFFVRkhMRXRCUVVzc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eEpRVUZKTEVkQlFVY3NRMEZCUXl4RlFVTm9ReXhoUVVGaExFZEJRVWNzUzBGQlN5eERRVUZETEVOQlFVTXNSMEZCUnl4RFFVRkRMRU5CUVVNc1EwRkJReXhKUVVGSkxFZEJRVWNzUTBGQlF5eERRVUZETzBsQlF6RkRMRWxCUVVrc1RVRkJUU3hIUVVGaExFbEJRVWtzUlVGQlJTeE5RVUZOTEVkQlFXRXNTVUZCU1N4RFFVRkRPMGxCUTNKRUxFbEJRVWtzVlVGQlZTeEZRVUZGTzFGQlExb3NUVUZCVFN4SFFVRkhMRWxCUVVrc1VVRkJVU3hEUVVGRExGVkJRVlVzUlVGQlJTeFJRVUZSTEVOQlFVTXNUVUZCVFN4SFFVRkhMRWxCUVVrc1EwRkJReXhEUVVGRE8xRkJRekZFTEVWQlFVVXNRMEZCUXl4SlFVRkpMRU5CUVVNc1RVRkJUU3hEUVVGRExFTkJRVU03VVVGRGFFSXNSVUZCUlN4RFFVRkRMRWxCUVVrc1EwRkJReXhKUVVGSkxGVkJRVlVzUTBGQlF5eE5RVUZOTEVWQlFVVXNVVUZCVVN4RlFVRkZMRmxCUVZrc1EwRkJReXhEUVVGRExFTkJRVU03UzBGRE0wUTdTVUZEUkN4SlFVRkpMRlZCUVZVc1JVRkJSVHRSUVVOYUxFMUJRVTBzUjBGQlJ5eEpRVUZKTEZGQlFWRXNRMEZCUXl4VlFVRlZMRVZCUVVVc1UwRkJVeXhEUVVGRExFMUJRVTBzUjBGQlJ5eEpRVUZKTEVOQlFVTXNRMEZCUXp0UlFVTXpSQ3hGUVVGRkxFTkJRVU1zU1VGQlNTeERRVUZETEUxQlFVMHNRMEZCUXl4RFFVRkRPMUZCUTJoQ0xFVkJRVVVzUTBGQlF5eEpRVUZKTEVOQlFVTXNTVUZCU1N4VlFVRlZMRU5CUVVNc1UwRkJVeXhGUVVGRkxFMUJRVTBzUlVGQlJTeGhRVUZoTEVOQlFVTXNRMEZCUXl4RFFVRkRPMHRCUXpkRU8wbEJRMFFzU1VGQlNTeE5RVUZOTEVkQlFVY3NTVUZCU1N4TlFVRk5MRU5CUVVNc1JVRkJSU3hGUVVGRkxFVkJRVVVzUTBGQlF5eERRVUZETzBsQlEyaERMRTFCUVUwc1EwRkJReXhMUVVGTExFVkJRVVVzUTBGQlF6dEpRVU5tTEU5QlFVODdVVUZEU0N4VlFVRlZMRVZCUVVVc1JVRkJSU3hEUVVGRExFdEJRVXNzUTBGQlF5eERRVUZETEVWQlFVVXNTMEZCU3l4RFFVRkRMRTFCUVUwc1EwRkJReXhEUVVGRExFZEJRVWNzUTBGQlF5eFZRVUZCTEVOQlFVTXNTVUZCU1N4UFFVRkJMRU5CUVVNc1EwRkJReXhSUVVGUkxFVkJRVVVzUlVGQldpeERRVUZaTEVOQlFVTTdVVUZETlVRc1ZVRkJWU3hGUVVGRkxFMUJRVTBzUTBGQlF5eERRVUZETEVOQlFVTXNUVUZCVFN4RFFVRkRMRkZCUVZFc1JVRkJSU3hEUVVGRExFTkJRVU1zUTBGQlF5eFJRVUZSTEVOQlFVTXNVVUZCVVN4RlFVRkZMRWRCUVVjc1dVRkJXVHRSUVVNelJTeFZRVUZWTEVWQlFVVXNUVUZCVFN4RFFVRkRMRU5CUVVNc1EwRkJReXhOUVVGTkxFTkJRVU1zVVVGQlVTeEZRVUZGTEVOQlFVTXNRMEZCUXl4RFFVRkRMRk5CUVZNc1EwRkJReXhSUVVGUkxFVkJRVVVzUjBGQlJ5eGhRVUZoTzB0QlEyaEdMRU5CUVVNN1FVRkRUaXhEUVVGRE8wRkJhRU5FTEd0RlFXZERReUo5Il19

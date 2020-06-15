/**
 * Created by Samuel Gratzl on 08.10.2014.
 */
import { AppContext, BaseUtils } from 'phovea_core';
import { SelectionUtils } from 'phovea_core';
import { AVisInstance } from 'phovea_core';
import { ShapeUtils } from 'phovea_core';
import * as d3 from 'd3';
export class D3Utils {
    static transform(x = 0, y = 0, rotate = 0, scaleX = 1, scaleY = 1) {
        const t = d3.transform(null);
        t.translate = [x, y];
        t.rotate = rotate;
        t.scale = [scaleX, scaleY];
        return t;
    }
    /**
     * utility function to handle selections
     * @param data
     * @param $data
     * @param selector what type of object are the data bound ot
     * @returns {function(any, any): undefined} the click handler
     */
    static selectionUtil(data, $data, selector) {
        const l = function (event, type, selected) {
            const all = $data.selectAll(selector);
            all.classed('phovea-select-' + type, false);
            const sub = selected.filter(all[0]);
            if (sub.length > 0) {
                d3.selectAll(sub).classed('phovea-select-' + type, true);
            }
        };
        data.on('select', l);
        AppContext.getInstance().onDOMNodeRemoved($data.node(), function () {
            data.off('select', l);
        });
        data.selections().then(function (selected) {
            l(null, 'selected', selected);
        });
        return (d, i) => {
            data.select(0, [i], SelectionUtils.toSelectOperation(d3.event));
        };
    }
    static defineVis(name, defaultOptions, initialSize, build, functions) {
        BaseUtils.extendClass(VisTechnique, AVisInstance);
        function VisTechnique(data, parent, options) {
            AVisInstance.call(this, data, parent, options);
            this.data = data;
            this.name = name;
            this.$parent = d3.select(parent);
            this.initialSize = d3.functor(initialSize);
            this.options = BaseUtils.mixin({}, d3.functor(defaultOptions).call(this, data, options || {}), options);
            if (typeof (this.init) === 'function') {
                this.init(data);
            }
            this.$node = build.call(this, this.$parent, this.data, this.size);
            this.$node.datum(data);
            this.$node.node().__vis__ = this;
        }
        VisTechnique.prototype.toString = () => name;
        VisTechnique.prototype.option = function (name, value) {
            if (arguments.length === 1) {
                return this.options[name];
            }
            else {
                const b = this.options[name];
                if (b === value) { // no change
                    return b;
                }
                this.fire('option', name, value, b);
                this.fire('option.' + name, value, b);
                this.options[name] = value;
                this.updatedOption(name, value);
                return b;
            }
        };
        VisTechnique.prototype.updatedOption = function (name, value) {
            //dummy
        };
        VisTechnique.prototype.transform = function (scale, rotate) {
            const bak = {
                scale: this.options.scale || [1, 1],
                rotate: this.options.rotate || 0
            };
            if (arguments.length === 0) {
                return bak;
            }
            const size = this.rawSize;
            if (this.node.tagName.toLowerCase() === 'svg') {
                this.$node.attr({
                    width: size[0] * scale[0],
                    height: size[1] * scale[1]
                }).style('transform', 'rotate(' + rotate + 'deg)');
                this.$node.select('g').attr('transform', 'scale(' + scale[0] + ',' + scale[1] + ')');
            }
            else {
                this.$node.style('transform', `rotate(${rotate}deg)scale(${scale[0]},${scale[1]})`);
            }
            const act = {
                scale,
                rotate
            };
            this.fire('transform', act, bak);
            this.options.scale = scale;
            this.options.rotate = rotate;
            return act;
        };
        VisTechnique.prototype.locateImpl = function (range) {
            const r = this.locateIt(range);
            if (!r) {
                return null;
            }
            return r.then((shape) => {
                shape = ShapeUtils.wrapToShape(shape);
                return shape ? shape.transform(this.options.scale || [1, 1], this.options.rotate || 0) : shape;
            });
        };
        VisTechnique.prototype.locateIt = function () {
            return null;
        };
        Object.defineProperty(VisTechnique.prototype, 'node', {
            get() {
                return this.$node.node();
            },
            enumerable: true
        });
        Object.defineProperty(VisTechnique.prototype, 'rawSize', {
            get() {
                return this.initialSize(this.data);
            },
            enumerable: true
        });
        Object.keys(functions || {}).forEach((f) => {
            VisTechnique.prototype[f] = functions[f];
        });
        return VisTechnique;
    }
}
//# sourceMappingURL=D3Utils.js.map
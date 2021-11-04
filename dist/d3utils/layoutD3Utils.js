/**
 * Created by sam on 04.02.2015.
 */
import * as d3 from 'd3';
import { ALayoutElem } from 'tdp_core';
import { Rect } from 'tdp_core';
export class SVGTransformLayoutElem extends ALayoutElem {
    constructor($elem, rawWidth, rawHeight, options = {}) {
        super(options);
        this.$elem = $elem;
        this.rawWidth = rawWidth;
        this.rawHeight = rawHeight;
    }
    setBounds(x, y, w, h) {
        const t = d3.transform(this.$elem.attr('transform'));
        t.translate[0] = x;
        t.translate[1] = y;
        t.scale[0] = w / this.rawWidth;
        t.scale[1] = h / this.rawHeight;
        this.$elem.attr('transform', t.toString());
        return null;
    }
    getBounds() {
        const t = d3.transform(this.$elem.attr('transform'));
        return Rect.rect(t.translate[0], t.translate[1], this.rawWidth * t.scale[0], this.rawHeight * t.scale[1]);
    }
    static wrapSVGTransform($elem, rawWidth, rawHeight, options = {}) {
        return new SVGTransformLayoutElem($elem, rawWidth, rawHeight, options);
    }
}
export class SVGRectLayoutElem extends ALayoutElem {
    constructor($elem, options = {}) {
        super(options);
        this.$elem = $elem;
    }
    setBounds(x, y, w, h) {
        this.$elem.attr({
            x,
            y,
            width: w,
            height: h
        });
        return null;
    }
    getBounds() {
        return Rect.rect(parseFloat(this.$elem.attr('x')), parseFloat(this.$elem.attr('y')), parseFloat(this.$elem.attr('width')), parseFloat(this.$elem.attr('height')));
    }
    static wrapSVGRect($elem, options = {}) {
        return new SVGRectLayoutElem($elem, options);
    }
}
export class HTMLLayoutElem extends ALayoutElem {
    constructor(node, options = {}) {
        super(options);
        this.targetBounds = null;
        this.$node = d3.select(node);
    }
    setBounds(x, y, w, h) {
        const unit = this.layoutOption('unit', 'px'), doAnimate = this.layoutOption('animate', false);
        const targetBounds = Rect.rect(x, y, w, h);
        const extra = this.layoutOption('set-call', null);
        const duration = this.layoutOption('animationDuration', this.layoutOption('animation-duration', 200));
        const t = doAnimate && duration > 0 ? this.$node.transition().duration(duration) : this.$node;
        t.style({
            left: x + unit,
            top: y + unit,
            width: w + unit,
            height: h + unit
        });
        if (extra) {
            t.call(extra);
        }
        const onSetBounds = this.layoutOption('onSetBounds', null);
        if (doAnimate) {
            this.targetBounds = targetBounds;
            //the transition.end event didn't work in all cases
            const d = new Promise((resolve) => {
                setTimeout(() => {
                    this.targetBounds = null;
                    if (onSetBounds) {
                        onSetBounds();
                    }
                    resolve(null);
                }, duration);
            });
            return d;
        }
        if (onSetBounds) {
            onSetBounds();
        }
        return Promise.resolve(null);
    }
    getBounds() {
        if (this.targetBounds) { //in an animation
            return this.targetBounds;
        }
        const unit = this.layoutOption('unit', 'px'), style = this.$node.node().style;
        function v(f) {
            if (f.length >= unit.length && f.substring(f.length - unit.length) === unit) {
                f = f.substring(0, f.length - unit.length);
                return parseFloat(f);
            }
            return 0;
        }
        return Rect.rect(v(style.left), v(style.top), v(style.width), v(style.height));
    }
    static wrapDom(elem, options = {}) {
        return new HTMLLayoutElem(elem, options);
    }
}
//# sourceMappingURL=layoutD3Utils.js.map
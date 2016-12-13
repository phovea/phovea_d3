/**
 * Created by sam on 04.02.2015.
 */
import * as d3 from 'd3';
import {ILayoutElem, ALayoutElem} from 'phovea_core/src/layout';
import {rect, Rect} from 'phovea_core/src/geom';

class SVGTransformLayoutElem extends ALayoutElem implements ILayoutElem {
  constructor(private $elem: d3.Selection<any>, private rawWidth: number, private rawHeight: number, options:any = {}) {
    super(options);
  }

  setBounds(x:number, y:number, w:number, h:number) {
    var t = d3.transform(this.$elem.attr('transform'));
    t.translate[0] = x;
    t.translate[1] = y;
    t.scale[0] = w / this.rawWidth;
    t.scale[1] = h / this.rawHeight;
    this.$elem.attr('transform', t.toString());
    return null;
  }

  getBounds() {
    var t = d3.transform(this.$elem.attr('transform'));
    return rect(t.translate[0], t.translate[1], this.rawWidth * t.scale[0], this.rawHeight * t.scale[1]);
  }
}

class SVGRectLayoutElem extends ALayoutElem implements ILayoutElem {
  constructor(private $elem: d3.Selection<any>, options:any = {}) {
    super(options);
  }

  setBounds(x:number, y:number, w:number, h:number) {
    this.$elem.attr({
      x : x,
      y: y,
      width: w,
      height: h
    });
    return null;
  }

  getBounds() {
    return rect(parseFloat(this.$elem.attr('x')), parseFloat(this.$elem.attr('y')), parseFloat(this.$elem.attr('width')), parseFloat(this.$elem.attr('height')));
  }
}


class HTMLLayoutElem extends ALayoutElem implements ILayoutElem {
  private $node : d3.Selection<any>;
  private targetBounds : Rect = null;

  constructor(node:HTMLElement, options:any = {}) {
    super(options);
    this.$node = d3.select(node);
  }

  setBounds(x:number, y:number, w:number, h:number) {
    const unit = this.layoutOption('unit', 'px'),
      doAnimate = this.layoutOption('animate', false);

    const targetBounds =  rect(x,y,w,h);
    var extra = this.layoutOption('set-call',null);

    const duration = this.layoutOption('animation-duration',200);

    var t : any = doAnimate && duration > 0? this.$node.transition().duration(duration) : this.$node;
    t.style({
      left : x + unit,
      top : y + unit,
      width: w + unit,
      height: h + unit
    });
    if (extra) {
      t.call(extra);
    }
    extra = this.layoutOption('onSetBounds', null);
    if (doAnimate) {
      this.targetBounds = targetBounds;
      //the transition.end event didn't work in all cases
      var d : Promise<void> = new Promise<void>((resolve) => {
        setTimeout(() => {
          this.targetBounds = null;
          if (extra) {
            extra();
          }
          resolve(null);
        }, duration);
      });
      return d;
    }
    if (extra) {
      extra();
    }
    return Promise.resolve(null);
  }

  getBounds() {
    if (this.targetBounds) { //in an animation
      return this.targetBounds;
    }
    var unit = this.layoutOption('unit', 'px'),
      style = (<HTMLElement>this.$node.node()).style;
    function v(f: string) {
      if (f.length >= unit.length && f.substring(f.length-unit.length) === unit) {
        f = f.substring(0, f.length-unit.length);
        return parseFloat(f);
      }
      return 0;
    }
    return rect(v(style.left),v(style.top), v(style.width),v(style.height));
  }
}

export function wrapSVGTransform($elem: d3.Selection<any>, rawWidth: number, rawHeight: number, options:any = {}) {
  return new SVGTransformLayoutElem($elem, rawWidth, rawHeight, options);
}
export function wrapSVGRect($elem: d3.Selection<any>, options:any = {}) {
  return new SVGRectLayoutElem($elem, options);
}
export function wrapDom(elem: HTMLElement, options:any = {}) {
  return new HTMLLayoutElem(elem, options);
}

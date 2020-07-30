/**
 * Created by sam on 04.02.2015.
 */
import * as d3 from 'd3';
import {ILayoutElem, ALayoutElem, ILayoutOptions} from 'phovea_core';
import {Rect} from 'phovea_core';

export class SVGTransformLayoutElem extends ALayoutElem implements ILayoutElem {
  constructor(private readonly $elem: d3.Selection<any>, private rawWidth: number, private rawHeight: number, options: ILayoutOptions = {}) {
    super(options);
  }

  setBounds(x: number, y: number, w: number, h: number): Promise<void>|null {
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

  static wrapSVGTransform($elem: d3.Selection<any>, rawWidth: number, rawHeight: number, options: ILayoutOptions = {}) {
    return new SVGTransformLayoutElem($elem, rawWidth, rawHeight, options);
  }
}

export class SVGRectLayoutElem extends ALayoutElem implements ILayoutElem {
  constructor(private readonly $elem: d3.Selection<any>, options: ILayoutOptions = {}) {
    super(options);
  }

  setBounds(x: number, y: number, w: number, h: number): Promise<void>|null {
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

  static wrapSVGRect($elem: d3.Selection<any>, options: ILayoutOptions = {}) {
    return new SVGRectLayoutElem($elem, options);
  }
}

export interface IHTMLLayoutOptions extends ILayoutOptions {
  /**
   * unit to set
   * @default px
   */
  unit?: string;
  /**
   * use animation
   * @default false
   */
  animate?: boolean;
  /**
   * additional call
   * @param item
   */
  'set-call'?(item: d3.Selection<any>): void;
  /**
   * animation duration
   * @deprecated use animationDuration
   */
  'animation-duration'?: number;
  /**
   * @default 200
   */
  animationDuration?: number;
  /**
   * callback after everything is done
   */
  onSetBounds?(): void;
}

export class HTMLLayoutElem extends ALayoutElem implements ILayoutElem {
  private readonly $node: d3.Selection<any>;
  private targetBounds: Rect = null;

  constructor(node: HTMLElement, options: IHTMLLayoutOptions = {}) {
    super(options);
    this.$node = d3.select(node);
  }

  setBounds(x: number, y: number, w: number, h: number) {
    const unit = this.layoutOption('unit', 'px'),
      doAnimate = this.layoutOption('animate', false);

    const targetBounds = Rect.rect(x, y, w, h);
    const extra = this.layoutOption('set-call', null);

    const duration = this.layoutOption('animationDuration', this.layoutOption('animation-duration', 200));

    const t: any = doAnimate && duration > 0 ? this.$node.transition().duration(duration) : this.$node;
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
      const d = new Promise<void>((resolve) => {
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
    const unit = this.layoutOption('unit', 'px'),
      style = (<HTMLElement>this.$node.node()).style;

    function v(f: string) {
      if (f.length >= unit.length && f.substring(f.length - unit.length) === unit) {
        f = f.substring(0, f.length - unit.length);
        return parseFloat(f);
      }
      return 0;
    }

    return Rect.rect(v(style.left), v(style.top), v(style.width), v(style.height));
  }
  static wrapDom(elem: HTMLElement, options: IHTMLLayoutOptions = {}) {
    return new HTMLLayoutElem(elem, options);
  }
}

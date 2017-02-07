/**
 * Created by Samuel Gratzl on 15.12.2014.
 */

import './style.scss';
import {select, event as d3event, Selection, mouse} from 'd3';
import {hasDnDType, updateDropEffect, mixin} from 'phovea_core/src';
import {list as listData, tree as treeData, get as getData, INode} from 'phovea_core/src/data';
import {EventHandler} from 'phovea_core/src/event';
import {IDataType} from 'phovea_core/src/datatype';

export interface IDataBrowserOptions {
  /**
   * layout: 'tree' or 'list'
   * @default tree
   */
  layout?: string;
  /**
   * should items be draggable
   * @default true
   */
  draggable?: boolean;
  /**
   * optional filter to filter the datasets
   */
  filter?: ({[key: string]: string})|((d: IDataType) => boolean);
}

export class DataBrowser extends EventHandler {
  private $node: Selection<any>;

  constructor(parent: Element, private options: IDataBrowserOptions = {}) {
    super();
    this.options = mixin({
      layout: 'tree',
      draggable: true,
      filter: () => true
    }, options);

    this.$node = this.build(parent);
  }

  private build(parent: Element): Selection<any> {
    if (this.options.layout === 'tree') {
      return this.buildTree(parent);
    } else if (this.options.layout === 'list') {
      return this.buildList(parent);
    }
    return select(parent);
  }

  private buildTree(parent: Element) {
    const $node = select(parent).append('ul').classed('phovea-databrowser', true).classed('fa-ul', true);
    const that = this;

    function buildLevel($level: d3.Selection<INode>) {
      const $childs= $level.selectAll('li').data((d: INode) => d.children);
      const $childsEnter = $childs.enter().append('li').classed('collapsed', true);

      const $label = $childsEnter.append('span')
        .on('click', function (this: Element, d) {
          if (d.children.length > 0) {
            const $parent = select(this.parentNode);
            const collapse = !$parent.classed('collapsed');
            $parent.classed('collapsed', collapse);
            that.fire('toggleCollapse', d, collapse);
            $parent.select('i').classed('fa-chevron-down', !collapse).classed('fa-chevron-right', collapse);
          } else {
            that.fire('select', d.data);
          }
        })
        .call(makeDraggable, (d: INode) => d.data);

      $label.append('i').attr('class', 'fa-li fa');
      $label.append('span');
      $childsEnter.append('ul').classed('fa-ul', true);
      $childs.select('i')
        .classed('fa-chevron-right', (d) => d.children.length > 0)
        .classed('fa-file-o', (d) => d.children.length === 0);

      $childs.select('span').attr('draggable', (d) => d.data !== null && that.options.draggable);
      $childs.select('span span').text((d) => {
        let r = d.name;
        if (d.children.length > 0) {
          r = r + ` (${d.children.length})`;
        }
        if (d.data !== null) {
          r = r + ` [${d.data.dim.join(',')}]`;
        }
        return r;
      });
      $childs.each(function (this: Element, d) {
        if (d.children.length > 0) {
          buildLevel(select(this).select('ul'));
        }
      });
      $childs.exit().remove();
    }

    treeData(this.options.filter).then((root) => {
      $node.datum(root);
      buildLevel($node);
    });

    return $node;
  }

  private buildList(parent: Element) {
    const $node = select(parent).append('ul').classed('phovea-databrowser', true).classed('fa-ul', true);
    listData(this.options.filter).then((list: IDataType[]) => {
      const $li = $node.selectAll('li').data(list);
      const $liEnter = $li.enter().append('li').append('span')
        .call(makeDraggable);
      $liEnter.append('i').attr('class', 'fa-li fa fa-file-o');
      $liEnter.append('span');
      $li.select('span span')
        .text((d) => d.desc.name);
      $li.exit().remove();
    });

    return $node;
  }
}

export interface IDropDataItemHandlerOptions {
  /**
   * data types (matrix, vector, ...) to filter
   * @default [] = all
   */
  types?: string[];
}

export declare type IDropHandler = (d: IDataType, op: string, pos: {x: number, y: number}) => void;

export class DropDataItemHandler extends EventHandler {
  private options: IDropDataItemHandlerOptions = {
    types: []
  };

  constructor(elem: Element, private handler?: IDropHandler, options: IDropDataItemHandlerOptions = {}) {
    super();
    mixin(this.options, options);
    this.register(select(elem));
  }

  private checkType(e: any) {
    if (this.options.types.length === 0) {
      return hasDnDType(e, 'application/phovea-data-item');
    }
    return this.options.types.some((t) => hasDnDType(e, 'application/phovea-data-' + t));
  }

  private register($node: d3.Selection<any>) {
    $node.on('dragenter', () => {
      const e = <DragEvent>d3event;
      const xy = mouse($node.node());
      if (this.checkType(e)) {
        e.preventDefault();
        this.fire('enter', {x: xy[0], y: xy[1]});
        return false;
      }
      return undefined;
    }).on('dragover', () => {
      const e = <DragEvent>d3event;
      const xy = mouse($node.node());
      if (this.checkType(e)) {
        e.preventDefault();
        updateDropEffect(e);
        this.fire('over', {x: xy[0], y: xy[1]});
        return false;
      }
      return undefined;
    }).on('dragleave', () => {
      this.fire('leave');
    }).on('drop', () => {
      const e = <DragEvent>(<any>d3event);
      e.preventDefault();
      const xy = mouse($node.node());
      if (hasDnDType(e, 'application/phovea-data-item')) {
        const id = JSON.parse(e.dataTransfer.getData('application/phovea-data-item'));
        getData(id).then((d) => {
          this.fire('drop', d, e.dataTransfer.dropEffect, {x: xy[0], y: xy[1]});
          if (this.handler) {
            this.handler(d, e.dataTransfer.dropEffect, {x: xy[0], y: xy[1]});
          }
        });
        return false;
      }
      return undefined;
    });
  }
}

export function makeDropable(elem: Element, onDrop?: IDropHandler, options: IDropDataItemHandlerOptions = {}) {
  return new DropDataItemHandler(elem, onDrop, options);
}

export function makeDraggable<T>(sel: d3.Selection<T>, dataGetter: (d: T) => IDataType = (d: any) => d) {
  sel
    .attr('draggable', true)
    .on('dragstart', function (d) {
      const e = <DragEvent>(<any>d3event);
      const data = dataGetter(d);
      if (data) {
        e.dataTransfer.effectAllowed = 'copy'; //none, copy, copyLink, copyMove, link, linkMove, move, all
        e.dataTransfer.setData('text/plain', data.desc.name);
        e.dataTransfer.setData('application/json', JSON.stringify(data.desc));
        const p = JSON.stringify(data.persist());
        //generic variant
        e.dataTransfer.setData('application/phovea-data-item', p);
        //variant with the type encoded
        e.dataTransfer.setData('application/phovea-data-' + data.desc.type, p);
        //encode the id in the mime type
        e.dataTransfer.setData('application/phovea-data-item-' + p, p);
      }
    });
}


export function create(parent: HTMLElement, options: IDataBrowserOptions = {}) {
  return new DataBrowser(parent, options);
}

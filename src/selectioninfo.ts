/**
 * Created by Samuel Gratzl on 15.12.2014.
 */
import * as d3 from 'd3';
import {on as globalOn, off as globalOff} from 'phovea_core/src/event';
import {
  IDType,
  defaultSelectionType,
  hoverSelectionType,
  list as listIDTypes,
  EVENT_REGISTER_IDTYPE
} from 'phovea_core/src/idtype';
import {Range} from 'phovea_core/src/range';
import {mixin, onDOMNodeRemoved} from 'phovea_core/src';

export interface ISelectionIDTypeOptions {
  /**
   * show the names instead of the ids
   * @default false
   */
  useNames?: boolean;
  /**
   * add clear button
   * @default true
   */
  addClear?: true;

  /**
   * selection types to show
   * @default select, hovered
   */
  selectionTypes?: string[];

  /**
   * filter function to filter selection types
   * @default constant true
   */
  filterSelectionTypes?(selectionType: string): boolean;
}

export class SelectionIDType {
  private readonly l = (event, type: string, selection: Range) => {
    this.update(type, selection);
  }
  private readonly $div: d3.Selection<any>;
  private readonly $ul: d3.Selection<any>;

  private readonly options: ISelectionIDTypeOptions = {
    useNames: false,
    addClear: true,
    selectionTypes: [defaultSelectionType, hoverSelectionType],
    filterSelectionTypes: <(selectionType: string) => boolean>(() => true)
  };

  constructor(public readonly idType: IDType, parent: d3.Selection<any>, options: ISelectionIDTypeOptions = {}) {
    mixin(this.options, options);
    idType.on(IDType.EVENT_SELECT, this.l);
    this.$div = parent.append('div');
    this.$div.append('span').text(idType.name);
    if (this.options.addClear) {
      this.$div.append('span').text(' (clear)').style('cursor', 'pointer').attr('title', 'click to clear selection').on('click', () => {
        this.options.selectionTypes.forEach((s) => idType.clear(s));
      });
    }
    this.$ul = this.$div.append('div');

    this.options.selectionTypes.forEach((s) => this.update(s, idType.selections(s)));
  }

  private update(type: string, selection: Range) {
    if (!this.options.filterSelectionTypes(type)) {
      return;
    }

    this.$div.classed('no-selection-' + type, selection.isNone);
    let elem = this.$ul.select('span.phovea-select-' + type);
    if (selection.isNone) {
      elem.remove();
      return;
    }

    if (elem.empty()) {
      elem = this.$ul.append('span').classed('phovea-select-' + type, true);
    }
    if (this.options.useNames && this.idType.id.charAt(0) !== '_' && !this.idType.internal) {
      this.idType.unmap(selection).then((names) => {
        elem.text(names.join(', '));
      });
    } else {
      const ids = selection.dim(0).asList();
      elem.text(ids.join(', '));
    }
  }

  destroy() {
    this.idType.off(IDType.EVENT_SELECT, this.l);
  }
}

export interface ISelectionInfoOptions extends ISelectionIDTypeOptions {
  /**
   * filter function to filter idtypes
   * @default constant true
   */
  filter?(idtype: IDType): boolean;
}

/**
 * selection info shows a div for each id type and a list of all selected ids in it
 */
export class SelectionInfo {
  private $div: d3.Selection<any>;
  private handler: SelectionIDType[] = [];
  private listener = (event, idtype) => {
    if (idtype instanceof IDType && this.options.filter(idtype)) {
      this.handler.push(new SelectionIDType(idtype, this.$div, this.options));
    }
  }

  private options: ISelectionInfoOptions = {
    useNames: false,
    addClear: true,
    selectionTypes: [defaultSelectionType, hoverSelectionType],
    filterSelectionTypes: <(selectionType: string) => boolean>(() => true),
    filter: <(idtype: IDType) => boolean>(() => true)
  };

  constructor(public readonly parent: HTMLElement, options: ISelectionInfoOptions = {}) {
    mixin(this.options, options);
    this.build(d3.select(parent));
  }


  private build(parent: d3.Selection<any>) {
    const $div = this.$div = parent.append('div').classed('selectioninfo', true);
    onDOMNodeRemoved(<Element>$div.node(), this.destroy, this);

    globalOn(EVENT_REGISTER_IDTYPE, this.listener);
    listIDTypes().forEach((d) => {
      this.listener(null, d);
    });
  }

  private destroy() {
    globalOff(EVENT_REGISTER_IDTYPE, this.listener);
    this.handler.forEach((h) => h.destroy());
    this.handler.length = 0;
  }
}

export function createFor(idtype: IDType, parent: HTMLElement, options: ISelectionIDTypeOptions) {
  return new SelectionIDType(idtype, d3.select(parent), options);
}

export function create(parent: HTMLElement, options: ISelectionInfoOptions = {}) {
  return new SelectionInfo(parent, options);
}

/**
 * Created by Samuel Gratzl on 15.12.2014.
 */
import d3 = require('d3');
import events = require('../caleydo_core/event');
import idtypes = require('../caleydo_core/idtype');
import ranges = require('../caleydo_core/range');
import C = require('../caleydo_core/main');

export class SelectionIDType {
  private l = (event, type: string, selection: ranges.Range) => {
    this.update(type, selection);
  };
  private $div: d3.Selection<any>;
  private $ul : d3.Selection<any>;

  private options = {
    useNames: false,
    addClear: true,
    selectionTypes: [ idtypes.defaultSelectionType, idtypes.hoverSelectionType],
    filterSelectionTypes : <(selectionType: string) => boolean>C.constantTrue
  };

  constructor(public idType: idtypes.IDType, parent: d3.Selection<any>, options : any = {}) {
    C.mixin(this.options, options);
    idType.on('select', this.l);
    this.$div = parent.append('div');
    this.$div.append('span').text(idType.name);
    if (this.options.addClear) {
      this.$div.append('span').text(' (clear)').style('cursor','pointer').attr('title','click to clear selection').on('click', () => {
        this.options.selectionTypes.forEach((s) => idType.clear(s));
      });
    }
    this.$ul = this.$div.append('div');

    this.options.selectionTypes.forEach((s) => this.update(s, idType.selections(s)));
  }

  private update(type: string, selection: ranges.Range) {
    if (!this.options.filterSelectionTypes(type)) {
      return;
    }

    this.$div.classed('no-selection-' + type, selection.isNone);
    var elem = this.$ul.select('span.caleydo-select-'+type);
    if (selection.isNone) {
      elem.remove();
      return;
    }

    if (elem.empty()) {
      elem = this.$ul.append('span').classed('caleydo-select-'+type,true);
    }
    if (this.options.useNames && this.idType.id.charAt(0) !== '_' && !this.idType.internal) {
      this.idType.unmap(selection).then((names) => {
        elem.text(names.join(', '));
      });
    } else {
      var ids = selection.dim(0).asList();
      elem.text(ids.join(', '));
    }
  }

  destroy() {
    this.idType.off('select', this.l);
  }
}

/**
 * selection info shows a div for each id type and a list of all selected ids in it
 */
export class SelectionInfo {
  private $div : d3.Selection<any>;
  private handler : SelectionIDType[] = [];
  private listener = (event, idtype) => {
    if (idtype instanceof idtypes.IDType && this.options.filter(idtype)) {
      this.handler.push(new SelectionIDType(idtype, this.$div, this.options));
    }
  };

  private options = {
    useNames: false,
    addClear : true,
    selectionTypes: [ idtypes.defaultSelectionType, idtypes.hoverSelectionType],
    filterSelectionTypes : <(selectionType: string) => boolean>C.constantTrue,
    filter : <(idtype: idtypes.IDType) => boolean>C.constantTrue
  };

  constructor(public parent:HTMLElement, options = {}) {
    C.mixin(this.options, options);
    this.build(d3.select(parent));
  }


  private build(parent:d3.Selection<any>) {
    var $div = this.$div = parent.append('div').classed('selectioninfo', true);
    C.onDOMNodeRemoved(<Element>$div.node(), this.destroy, this);

    events.on('register.idtype', this.listener);
    idtypes.list().forEach((d) => {
      this.listener(null, d);
    });
  }

  private destroy() {
    events.off('register.idtype', this.listener);
    this.handler.forEach((h) => h.destroy());
    this.handler.length = 0;
  }
}

export function createFor(idtype: idtypes.IDType, parent, options) {
  return new SelectionIDType(idtype, d3.select(parent), options);
}

export function create(parent, options = {}) {
  return new SelectionInfo(parent, options);
}

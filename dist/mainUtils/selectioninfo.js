/**
 * Created by Samuel Gratzl on 15.12.2014.
 */
import * as d3 from 'd3';
import { GlobalEventHandler } from 'tdp_core';
import { IDType, SelectionUtils, IDTypeManager } from 'tdp_core';
import { BaseUtils, AppContext } from 'tdp_core';
export class SelectionIDType {
    constructor(idType, parent, options = {}) {
        this.idType = idType;
        this.l = (event, type, selection) => {
            this.update(type, selection);
        };
        this.options = {
            useNames: false,
            addClear: true,
            selectionTypes: [SelectionUtils.defaultSelectionType, SelectionUtils.hoverSelectionType],
            filterSelectionTypes: (() => true)
        };
        BaseUtils.mixin(this.options, options);
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
    update(type, selection) {
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
        }
        else {
            const ids = selection.dim(0).asList();
            elem.text(ids.join(', '));
        }
    }
    destroy() {
        this.idType.off(IDType.EVENT_SELECT, this.l);
    }
    static createFor(idtype, parent, options) {
        return new SelectionIDType(idtype, d3.select(parent), options);
    }
}
/**
 * selection info shows a div for each id type and a list of all selected ids in it
 */
export class SelectionInfo {
    constructor(parent, options = {}) {
        this.parent = parent;
        this.handler = [];
        this.listener = (event, idtype) => {
            if (idtype instanceof IDType && this.options.filter(idtype)) {
                this.handler.push(new SelectionIDType(idtype, this.$div, this.options));
            }
        };
        this.options = {
            useNames: false,
            addClear: true,
            selectionTypes: [SelectionUtils.defaultSelectionType, SelectionUtils.hoverSelectionType],
            filterSelectionTypes: (() => true),
            filter: (() => true)
        };
        BaseUtils.mixin(this.options, options);
        this.build(d3.select(parent));
    }
    build(parent) {
        const $div = this.$div = parent.append('div').classed('selectioninfo', true);
        AppContext.getInstance().onDOMNodeRemoved($div.node(), this.destroy, this);
        GlobalEventHandler.getInstance().on(IDTypeManager.EVENT_REGISTER_IDTYPE, this.listener);
        IDTypeManager.getInstance().listIdTypes().forEach((d) => {
            this.listener(null, d);
        });
    }
    destroy() {
        GlobalEventHandler.getInstance().off(IDTypeManager.EVENT_REGISTER_IDTYPE, this.listener);
        this.handler.forEach((h) => h.destroy());
        this.handler.length = 0;
    }
    static create(parent, options = {}) {
        return new SelectionInfo(parent, options);
    }
}
//# sourceMappingURL=selectioninfo.js.map
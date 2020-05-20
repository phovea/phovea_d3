/**
 * Created by sam on 16.02.2015.
 */

import {IBandContext, IVisWrapper, ILink} from './link';
import {wrap, AShape, Rect} from 'phovea_core/src/geom';
import {all, Range1D, Range, asUngrouped, CompositeRange1D, Range1DGroup, list as rlist} from 'phovea_core/src/range';


interface IGroup {
  g: Range1DGroup;
  len: number;
  loc: Rect;
}

export class LinkRepresentation {

  static createBlockRep(context: IBandContext, a: IVisWrapper, aa: Rect, b: IVisWrapper, bb: Rect): Promise<ILink[]> {
    const adim = a.dimOf(context.idtype),
      bdim = b.dimOf(context.idtype);
    return Promise.all([a.ids(), b.ids()]).then((ids) => {
      const ida = ids[0].dim(adim);
      const idb = ids[1].dim(bdim);
      return context.createBand(aa, bb, ida, idb, ida.intersect(idb), 'block', 'rel-block');
    });
  }

  static toArray(a: any) {
    if (!Array.isArray(a)) {
      return [a];
    }
    return a;
  }


  static createGroupRep(context: IBandContext, a: IVisWrapper, aa: Rect, b: IVisWrapper, bb: Rect): Promise<ILink[]> {
    const adim = a.dimOf(context.idtype),
      bdim = b.dimOf(context.idtype);

    function toGroups(ids: Range1D) {
      if (ids instanceof CompositeRange1D) {
        return (<CompositeRange1D>ids).groups;
      } else {
        return [asUngrouped(ids)];
      }
    }

    return Promise.all([a.ids(), b.ids()]).then((ids) => {
      const groupa: Range1DGroup[] = toGroups(ids[0].dim(adim));
      const groupb: Range1DGroup[] = toGroups(ids[1].dim(bdim));

      const ars = groupa.map((group) => {
        const r = all();
        r.dims[adim] = group;
        return r;
      });
      const brs = groupb.map((group) => {
        const r = all();
        r.dims[bdim] = group;
        return r;
      });
      return Promise.all([Promise.resolve({
        groupa,
        groupb
      }), a.locateById.apply(a, ars), b.locateById.apply(b, brs)]);
    }).then((data) => {
      function more(locs: AShape[]) {
        return (g: Range1DGroup, i: number) => {
          return {
            g,
            len: g.length,
            loc: locs[i] ? locs[i].aabb() : null
          };
        };
      }

      const groupa: IGroup[] = (<any>data[0]).groupa.map(more(this.toArray(data[1])));
      const groupb: IGroup[] = (<any>data[0]).groupb.map(more(this.toArray(data[2])));
      const r: ILink[] = [];
      groupa.forEach((ga) => {
        groupb.forEach((gb) => {
          const int = ga.g.intersect(gb.g);
          const l = int.length;
          if (l === 0) {
            return;
          }
          const id = ga.g.name + '-' + gb.g.name;
          if (ga.loc && gb.loc) {
            r.push.apply(r, context.createBand(ga.loc, gb.loc, ga.g, gb.g, int, id, 'rel-group'));
            //shift the location for attaching
            ga.loc.y += ga.loc.h * (l / ga.len);
            gb.loc.y += gb.loc.h * (l / gb.len);
          }
        });
      });
      return r;
    });
  }

  selectCorners(a: AShape, b: AShape) {
    const ac = a.aabb(),
      bc = b.aabb();
    if (ac.cx > bc.cx) {
      return ['w', 'e'];
    } else {
      return ['e', 'w'];
    }
    // TODO better
  }


  static createItemRep(context: IBandContext, a: IVisWrapper, aa: Rect, b: IVisWrapper, bb: Rect): Promise<ILink[]> {
    const adim = a.dimOf(context.idtype),
      bdim = b.dimOf(context.idtype),
      amulti = a.data.dim.length > 1,
      bmulti = b.data.dim.length > 1;

    function toPoint(loc: AShape, other: AShape, multi: boolean) {
      if (!multi) {
        return loc.center;
      }
      const c = this.selectCorners(loc, other);
      return loc.corner(c[0]);
    }

    return Promise.all([a.ids(), b.ids()]).then((ids) => {
      const ida: Range1D = ids[0].dim(adim);
      const idb: Range1D = ids[1].dim(bdim);
      const union: Range1D = ida.intersect(idb);
      const ars: Range[]= [], brs: Range[] = [];
      union.forEach((index) => {
        const r = all();
        r.dim(adim).setList([index]);
        ars.push(r);

        const r2 = all();
        r2.dim(bdim).setList([index]);
        brs.push(r2);
      });
      return Promise.all<Range1D>([Promise.resolve(union), a.locateById.apply(a, ars), b.locateById.apply(b, brs)]);
    }).then((locations) => {
      const union = locations[0],
        loca = this.toArray(locations[1]),
        locb = this.toArray(locations[2]);
      const r: ILink[] = [];
      context.line.interpolate('linear');
      const selections = context.idtype.selections().dim(0);
      union.forEach((id, i) => {
        const la = wrap(loca[i]);
        const lb = wrap(locb[i]);
        if (la && lb) {
          r.push({
            clazz: 'rel-item' + (selections.contains(id) ? ' phovea-select-selected' : ''),
            id: String(id),
            d: context.line([toPoint(la, lb, amulti), toPoint(lb, la, bmulti)]),
            range: rlist([id])
          });
        } //TODO optimize use the native select to just update the classes and not recreate them
      });
      return r;
    });
  }
}

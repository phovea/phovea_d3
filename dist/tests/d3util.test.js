/// <reference types="jest" />
import { D3Utils } from '../src/d3util';
describe('transform', () => {
    it('empty', () => {
        expect(D3Utils.transform().toString()).toEqual('translate(0,0)rotate(0)skewX(0)scale(1,1)');
    });
    it('with parameters', () => {
        expect(D3Utils.transform(1, 2, 3, 4, 5).toString()).toEqual('translate(1,2)rotate(3)skewX(0)scale(4,5)');
    });
});
//# sourceMappingURL=d3util.test.js.map
const test = require('node:test');
const assert = require('node:assert/strict');
const { calculateTraditionalSale } = require('./dist/sale-simulator.js');
const { calculateCommission } = require('./dist/commission.js');

const example = { price: 100000, negotiation: 10, rate: 5, vat: 23, basis: 'sale', months: 14, holding: 4000, preparation: 1500 };

test('deducts negotiation once and calculates commission on the sale price', () => {
  assert.deepEqual(calculateTraditionalSale(example), {
    asking: 10000000, discount: 1000000, sale: 9000000, commissionBase: 9000000,
    commission: 553500, holding: 400000, preparation: 150000, net: 7896500
  });
});
test('supports a commission contract based on the advertised price', () => {
  const result = calculateTraditionalSale({ ...example, basis: 'asking', negotiation: 8, months: 12, holding: 2000, preparation: 2000 });
  assert.equal(result.commission, 615000);
  assert.equal(result.net, 8185000);
});
test('no negotiation or other costs agrees with the existing calculator', () => {
  assert.equal(calculateTraditionalSale({ ...example, negotiation: 0, holding: 0, preparation: 0 }).net, calculateCommission(example.price, example.rate, example.vat).remaining);
});
test('zero costs do not force a discount or commission', () => {
  assert.equal(calculateTraditionalSale({ ...example, negotiation: 0, rate: 0, holding: 0, preparation: 0, months: 0 }).net, 10000000);
});
test('no additional VAT avoids double-counting inclusive commissions', () => {
  assert.equal(calculateTraditionalSale({ ...example, vat: 0 }).commission, 450000);
});
test('supports different VAT assumptions', () => {
  assert.equal(calculateTraditionalSale({ ...example, vat: 22 }).commission, 549000);
  assert.equal(calculateTraditionalSale({ ...example, vat: 16 }).commission, 522000);
});
test('rounds money to cents and keeps negative results visible', () => {
  const result = calculateTraditionalSale({ ...example, price: 100.01, negotiation: 8.25, rate: 2.5, holding: 100, preparation: 1.23 });
  assert.equal(result.sale, 9176);
  assert.equal(result.commission, 282);
  assert.equal(result.net, -1229);
});
test('zero price is valid, with no percentage-based deductions', () => {
  const result = calculateTraditionalSale({ ...example, price: 0, holding: 0, preparation: 0 });
  assert.equal(result.net, 0);
  assert.equal(result.commission, 0);
});
test('waiting costs are an explicit period total, not silently multiplied', () => {
  assert.equal(calculateTraditionalSale({ ...example, months: 24 }).holding, 400000);
});
test('accepts exact supported boundaries', () => {
  assert.ok(calculateTraditionalSale({ ...example, price: 100000000, negotiation: 100, rate: 100, months: 120 }));
});
for (const key of ['price', 'negotiation', 'rate', 'vat', 'months', 'holding', 'preparation']) {
  test(`rejects missing, infinite and negative ${key}`, () => {
    for (const value of [NaN, Infinity, undefined, -1]) assert.equal(calculateTraditionalSale({ ...example, [key]: value }), null);
  });
}
test('rejects out-of-range assumptions', () => {
  for (const key of ['price', 'holding', 'preparation']) assert.equal(calculateTraditionalSale({ ...example, [key]: 100000001 }), null);
  for (const key of ['negotiation', 'rate', 'vat']) assert.equal(calculateTraditionalSale({ ...example, [key]: 101 }), null);
  assert.equal(calculateTraditionalSale({ ...example, months: 1.5 }), null);
  assert.equal(calculateTraditionalSale({ ...example, months: 121 }), null);
  assert.equal(calculateTraditionalSale({ ...example, basis: 'unknown' }), null);
});

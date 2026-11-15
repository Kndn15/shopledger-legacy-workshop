var test = require('node:test');
var assert = require('node:assert/strict');
var invoice = require('../lib/invoice');
var pricing = require('../lib/pricing');

test('invoice uses the billed HSN slab and matches the recorded order totals', function () {
  var order = {
    items: [{ name: 'Rice', hsn: '1006', price: 100, qty: 1 }]
  };

  var billed = pricing.computeTotals(order.items, '');
  var printed = invoice.computeInvoiceFigures(order);

  assert.equal(billed.tax, 5);
  assert.equal(billed.total, 105);
  assert.equal(printed.tax, billed.tax);
  assert.equal(printed.cgst, billed.cgst);
  assert.equal(printed.sgst, billed.sgst);
  assert.equal(printed.total, billed.total);
  assert.equal(printed.rows[0].gstPercent, 5);
});

test('invoice accepts decimal gstRate values using pricing tax semantics', function () {
  var figures = invoice.computeInvoiceFigures({
    items: [{ name: 'Rice', gstRate: 0.05, price: 100, qty: 1 }]
  });

  assert.equal(figures.tax, 5);
  assert.equal(figures.rows[0].gstPercent, 5);
});

test('invoice matches the billed coupon discount, tax, and total', function () {
  var order = {
    coupon: 'SAVE10',
    items: [{ name: 'Goods', price: 3000, qty: 1 }]
  };

  var billed = pricing.computeTotals(order.items, order.coupon);
  var printed = invoice.computeInvoiceFigures(order);

  assert.equal(billed.discount, 150);
  assert.equal(billed.total, 3363);
  assert.equal(printed.discount, billed.discount);
  assert.equal(printed.tax, billed.tax);
  assert.equal(printed.total, billed.total);
});

test('invoice rendering shows billed figures without a false ledger mismatch', function () {
  var html = invoice.render({
    id: 42,
    date: '2026-11-15',
    total: 105,
    items: [{ name: 'Rice', hsn: '1006', price: 100, qty: 1 }]
  });

  assert.match(html, /Invoice Total/);
  assert.match(html, /₹105\.00/);
  assert.match(html, /<td>CGST<\/td><td class="r">₹2\.50<\/td>/);
  assert.match(html, /<td>SGST<\/td><td class="r">₹2\.50<\/td>/);
  assert.doesNotMatch(html, /differs from Order Ledger/);
});

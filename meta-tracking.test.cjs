const test = require('node:test');
const assert = require('node:assert/strict');
const conversionsHandler = require('./api/conversions.js');

function getHighestFormValue(data) {
  if (!data) return 0;
  const candidates = [
    Number(data.precoPedido),
    Number(data.valorMinimoAbsoluto),
    Number(data.melhorProposta)
  ].filter(v => Number.isFinite(v) && v > 0);
  return candidates.length > 0 ? Math.max(...candidates) : 0;
}

test('getHighestFormValue picks precoPedido when it is the highest', () => {
  const data = {
    precoPedido: '280000',
    valorMinimoAbsoluto: '220000',
    melhorProposta: '200000'
  };
  assert.equal(getHighestFormValue(data), 280000);
});

test('getHighestFormValue picks valorMinimoAbsoluto when precoPedido is not specified', () => {
  const data = {
    precoPedido: '',
    valorMinimoAbsoluto: '175000',
    melhorProposta: ''
  };
  assert.equal(getHighestFormValue(data), 175000);
});

test('getHighestFormValue picks melhorProposta when it exceeds others', () => {
  const data = {
    precoPedido: '150000',
    valorMinimoAbsoluto: '120000',
    melhorProposta: '160000'
  };
  assert.equal(getHighestFormValue(data), 160000);
});

test('getHighestFormValue returns 0 when no values provided', () => {
  assert.equal(getHighestFormValue({}), 0);
  assert.equal(getHighestFormValue(null), 0);
});

test('conversions API handler handles valid lead request', async () => {
  const mockReq = {
    method: 'POST',
    headers: {
      'user-agent': 'Unit Test Agent',
      'x-forwarded-for': '127.0.0.1'
    },
    body: {
      eventName: 'Lead',
      eventId: 'test_lead_' + Date.now(),
      value: 300000,
      currency: 'EUR',
      name: 'João Silva',
      phone: '912345678',
      testEventCode: 'TEST12345'
    }
  };

  let statusCode = null;
  let responseData = null;

  const mockRes = {
    setHeader: () => {},
    status: (code) => {
      statusCode = code;
      return {
        json: (data) => {
          responseData = data;
        },
        end: () => {}
      };
    }
  };

  await conversionsHandler(mockReq, mockRes);
  assert.equal(statusCode, 200);
  assert.equal(responseData.success, true);
  assert.equal(responseData.result.events_received, 1);
});

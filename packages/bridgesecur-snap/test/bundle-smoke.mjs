import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { assertJSXElement } from '@metamask/snaps-sdk/jsx';
import { is } from '@metamask/superstruct';
import { JsonStruct } from '@metamask/utils';

const calls = [];
const sandbox = vm.createContext({
  module: { exports: {} },
  console,
  snap: { request: async request => {
    calls.push(request);
    assert(is(JSON.parse(JSON.stringify(request)), JsonStruct), 'RPC must be JSON');
    assertJSXElement(JSON.parse(JSON.stringify(request.params.ui)));
    if (request.method === 'snap_createInterface') return `insight-${calls.length}`;
    assert.equal(request.method, 'snap_updateInterface');
    return null;
  } },
});
vm.runInContext(readFileSync(new URL('../dist/bundle.js', import.meta.url), 'utf8'), sandbox, { timeout: 10000 });
const { onTransaction, onUserInput } = sandbox.module.exports;
const recipient = '0xdead000000000000000000000000000000000001';
const result = await onTransaction({ transaction: { to: recipient }, chainId: 'eip155:11155111' });
assert.equal(result.id, 'insight-1');
assert.equal(result.severity, 'critical');
assert.match(JSON.stringify(calls[0].params.ui), /CRITICAL SECURITY ALERT/);
for (const name of ['analysis', 'details', 'why', 'warning']) {
  const context = calls.at(-1).params.context;
  await onUserInput({ id: result.id, context, event: { type: 'ButtonClickEvent', name } });
  assert.equal(calls.at(-1).params.id, result.id);
  assert.equal(JSON.parse(calls.at(-1).params.context.payload).recipient, recipient);
}
await onUserInput({ id: result.id, context: calls.at(-1).params.context, event: { type: 'FormSubmitEvent', name: 'consult', value: { question: 'Show similar cases' } } });
assert.match(JSON.parse(calls.at(-1).params.context.payload).answer, /No verified case data/);
console.log('Built bundle smoke passed: native create, 3 views, questions, JSON and SDK UI schemas.');

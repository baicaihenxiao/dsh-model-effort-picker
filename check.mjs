/**
 * Smoke check for the client bundle: it must register one factory under the
 * package id, return a plugin the harness can use, and wire both seats when
 * applied. Run: node check.mjs
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('./client.js', import.meta.url), 'utf8');
const loads = [];

globalThis.window = { __ModuleLoader__: { load: (spec) => loads.push(spec) } };
globalThis.document = {
  createElement: () => ({ dataset: {}, remove() {}, textContent: '' }),
  head: { append() {} },
};

new Function(source)();

assert.equal(loads.length, 1, 'exactly one module registration');
assert.equal(loads[0].id, 'dsh-model-effort-picker', 'factory id is the package name');

const React = {
  createElement: (type, props, ...children) => ({ type, props, children }),
  Fragment: Symbol('Fragment'),
  useEffect: () => {},
  useId: () => 'id',
  useMemo: (compute) => compute(),
  useRef: () => ({ current: null }),
  useState: () => [undefined, () => {}],
  useSyncExternalStore: () => undefined,
};

const plugin = loads[0].factory((name) => {
  if (name !== 'react') throw new Error(`unexpected runtime import: ${name}`);
  return React;
});

assert.equal(typeof plugin.apply, 'function', 'client half returns an apply');
assert.deepEqual(plugin.inject, [
  'slots',
  'locale',
  'modelDirectories',
  'sessions',
  'remote',
  'remote.settings',
]);

const registered = [];
const services = {
  modelDirectories: {
    directoryFor: () => ({
      store: {},
      load: () => Promise.resolve(),
      select: () => Promise.resolve({ ok: true }),
    }),
  },
  sessions: { subagentAddress: () => undefined },
  remote: {
    settings: {
      describe: () => Promise.resolve({ ok: true, value: { writable: true, namespaces: [] } }),
      update: () => Promise.resolve({ ok: true }),
    },
    $on: () => () => {},
  },
};

plugin.apply({
  effect: (callback) => {
    const off = callback();
    return typeof off === 'function' ? off : () => {};
  },
  get: (name) => services[name],
  locale: { register: () => () => {} },
  slots: {
    inject: (_key, create) => create(),
    register: (options, component) => {
      registered.push({ options, component });
      return () => {};
    },
  },
});

assert.deepEqual(
  registered.map(({ options }) => ({
    name: options.name,
    id: options.id ?? null,
    order: options.order ?? null,
    priority: options.priority ?? null,
  })),
  [
    { name: 'conversation.input.model', id: null, order: null, priority: -20 },
    { name: 'conversation.input.activity', id: null, order: null, priority: null },
  ],
  'both seats are registered with the winning model priority',
);

console.log('client bundle loads and wires the model seat plus the effort slider');

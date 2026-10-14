# dsh-model-effort-picker

A DeepSeek Harness (DSH) Web profile bundle that
replaces the composer's model control and puts reasoning effort on a slider.

[中文说明](README.zh.md)

- **Model list first.** Clicking the model control opens the provider-grouped
  model list itself, with search — no intermediate "Select model" row.
- **Reasoning effort on a slider.** The current model's levels become discrete
  stops with a tick and a name under each one, right next to the model control.
  Drag and release to switch; you never open a menu for it.
- **Provider settings are honoured, not duplicated.** If the
  [`dsh-codex-subscription`](https://github.com/WSL043/dsh-codex-subscription)
  bundle is installed, this picker reads its `disabledModels` preference (hidden
  models stay hidden) and offers its speed tiers, writing back through the same
  settings entry that plugin uses.

The composer: the model menu open on the provider-grouped list, and the effort
slider — a tick and a name per level — beside the model control.

![Composer with the model menu open and the effort slider](docs/composer.webp)

## Install

This is a **profile bundle**: installing it affects every session in the profile
you install it into. Nothing is published to npm — install it from this
repository.

Ask your DSH agent to install it:

```
install the DSH bundle github:baicaihenxiao/dsh-model-effort-picker
```

The agent runs the `plugin_manager` `install_bundle` action, which adds the
package to your profile and selects the bundle. Then reload the Web page (or
restart `dsh web`).

From a checkout instead:

```sh
git clone https://github.com/baicaihenxiao/dsh-model-effort-picker
```

```
install the DSH bundle at /absolute/path/to/dsh-model-effort-picker
```

To remove it again, ask the agent to remove the bundle
`dsh-model-effort-picker`, or disable it on DSH's Plugins page.

## Requirements

- A DSH Web profile. The bundle extends `conversation.input.model` and
  `conversation.input.activity`, both declared by
  `@deepseek-ai/dsh-client-ui-conversation`, and reads the per-session model
  directory from `@deepseek-ai/dsh-client-ui-model-selection` — both ship with
  DSH, so the bundle declares no dependencies of its own.
- The browser module table provides `react`; this bundle imports nothing else.

## Behaviour and limits

- **Seat priority.** The model control is a shadowable seat. This bundle claims
  it at priority `-20`, below the shipped selector (`0`) and below
  `dsh-codex-subscription`'s override (`-10`), so exactly one renders. Another
  plugin can still take it by using a lower priority. While this bundle holds
  the seat, other plugins' own composer model menus do not render.
- **Slider visibility.** The slider appears only when the current model
  advertises at least two reasoning levels; models without reasoning metadata
  show no slider. An adapter that leaves the default level open gets an extra
  "provider default" stop.
- **Speed tiers.** The provider's fast tier is offered for models its own
  fallback predicate marks as fast-capable; ultra-fast appears only when it is
  already the current tier, because only the provider's Host half knows which
  models advertise it. Output verbosity is not offered here — it stays on the
  provider's own settings page.
- **Fixed geometry.** The slider is a fixed 150px track; the tick labels are
  drawn by this bundle, so switching tiers never resizes the control.

## Development

Plain JavaScript, no build step. `client.js` is the browser half and is loaded
directly; `index.js` is an empty Host half.

```sh
node check.mjs   # loads the bundle, then asserts the seats it registers
```

Because the profile installs this directory as a symlink, edits to `client.js`
take effect after the page reloads the module.

## License

[MIT](LICENSE)

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

- Plugin `1.1.1` is tested with DeepSeek Harness `0.2.0-rc.2`. That version is
  what `peerDependencies` pins, so DSH refuses to install or activate this bundle
  on a host it has not been verified against — see
  [Requirements](#requirements) for the exact packages.

## Updating

Installing from GitHub pins the commit resolved at install time in your
profile's `pnpm-lock.yaml`, so **a new commit upstream does not arrive by
itself**. How you update depends on how you installed it:

| Installed as | Update with |
|---|---|
| `github:baicaihenxiao/dsh-model-effort-picker` | `dsh plugin --profile <profile> update dsh-model-effort-picker`, or remove the bundle and install it again |
| a local checkout | `git pull` in the checkout — the profile links the directory |
| a tag or commit | install the revision you want: `github:baicaihenxiao/dsh-model-effort-picker#v1.1.1` |

Points worth knowing:

- Re-running the install with the **same** spec keeps the pinned commit;
  `pnpm update` is what re-resolves it to the branch head.
- `plugin_manager`'s `install_bundle` both installs the package and selects the
  bundle. The `dsh plugin` CLI path only installs the package, so re-select the
  bundle afterwards if you use it.
- Reload the Web page (or restart `dsh web`) after updating.
- Pin a release by tag — `#v1.1.1`. A branch name works too. A commit SHA must
  be the full 40 characters: pnpm cannot resolve an abbreviated one.
- To see what you have installed, read the version in your profile:

  ```sh
  cat ~/.dsh/profiles/<profile>/node_modules/dsh-model-effort-picker/package.json
  ```

## Requirements

- A DSH Web profile. The bundle extends `conversation.input.model` and
  `conversation.input.activity`, both declared by
  `@deepseek-ai/dsh-client-ui-conversation`, and reads the per-session model
  directory from `@deepseek-ai/dsh-client-ui-model-selection` — both ship with
  DSH, so the bundle declares no dependencies of its own.
- A DSH version this bundle was verified against. `peerDependencies` pins the
  three host packages it uses — `@deepseek-ai/dsh-client-locale`,
  `@deepseek-ai/dsh-client-ui-conversation` and
  `@deepseek-ai/dsh-client-ui-model-selection` — to `0.2.0-rc.2 || 0.2.1-rc.2`, and `engines`
  matches the host's Node range (`^22.19.0 || >=24.0.0`). DSH's plugin manager
  evaluates every `@deepseek-ai/dsh*` peer range **against the DSH runtime
  version** and rejects installation or activation when one does not match, so an
  untested host fails loudly instead of rendering a broken composer. A newer host
  version is added here once it has been checked; anyone who needs to run ahead
  of that can grant an exact-version exemption with `dsh plugin allow-version`
  (or the plugin manager), which accepts the risk explicitly.
- The browser module table provides `react`; this bundle imports nothing else.

## Behaviour and limits

- **Seat priority.** The model control is a shadowable seat. This bundle claims
  it at priority `-20`, below the shipped selector (`0`) and below
  `dsh-codex-subscription`'s override (`-10`), so exactly one renders. Another
  plugin can still take it by using a lower priority. While this bundle holds
  the seat, other plugins' own composer model menus do not render.
- **Slider visibility.** The slider appears only when the current model
  advertises at least two reasoning levels; models without reasoning metadata
  show no slider, and neither does metadata that carries no level list — that
  case renders nothing rather than failing. An adapter that leaves the default
  level open gets an extra "provider default" stop.
- **Speed tiers.** The provider's fast tier is offered for models its own
  fallback predicate marks as fast-capable; ultra-fast appears only when it is
  already the current tier, because only the provider's Host half knows which
  models advertise it. Output verbosity is not offered here — it stays on the
  provider's own settings page.
- **Fixed geometry.** The level names sit in a 14px row under the track — its
  mark, a 2px gap, then the name — and
  both the track and the tick labels are drawn by this bundle, so switching
  tiers never resizes this block.
- **Trigger width.** The effort caption in the model button is sized by its
  content, as the shipped control's is, so a background painted on it by another
  plugin hugs the text instead of stretching to a reserved width. The tool row is
  right-anchored, so a longer caption widens the button leftwards and leaves the
  slider and the submit button where they are; the model name gives up that space
  first and ellipsises sooner.
- **Stop spacing.** Each stop is centred on its own offset, ends included — the
  ends used to be anchored to the box edges, which made the gaps uneven as soon
  as a model had more than four levels. The track also widens as levels are
  added (150px for four stops, then +26px per stop, capped at 230px) and the end
  labels get 14px of reserved room, so the names keep their distance instead of
  crowding.
- **Thin bar.** The bar is painted by the bundle (3px track, 9px thumb) rather
  than left to the native range control, whose track and thumb keep their own
  size — a shorter box would only clip them. The filled part ends at the thumb's
  centre, since the track is inset by the thumb's radius at both ends, and the
  part past the selected level uses a quieter tone than the labels so the fill
  reads as the only active part.
- **Level tint.** The level labels are tinted along a fixed six-color ramp from
  the lowest level to the highest, set by `TINT_RAMP` in `client.js`:

  | # | Color | Ramp position |
  |---|---|---|
  | 1 | `#475569` | slate, lowest level |
  | 2 | `#2563EB` | blue |
  | 3 | `#4F46E5` | indigo |
  | 4 | `#6D28D9` | violet |
  | 5 | `#7E22CE` | purple |
  | 6 | `#86198F` | magenta, highest level |

  The labels are **interpolated** across the ramp, so any level count is covered
  rather than repeating a color: a model with exactly six levels lands each label
  on one of these colors, in order, and a model with fewer samples the ramp
  evenly (`node check.mjs` asserts this for 4, 6 and 8 levels plus the exact
  palette at six).

  `TINT_STRENGTH` (100 by default) is the purity/contrast lever: at 100 each
  label is exactly its ramp color, which is the most visible on the light
  palette; lower it to pull every stop toward the label color — the value to
  reach for if the labels look dim against a dark background, where the darker
  end of this palette would otherwise sit too close to the surface.

  The labels are 10px at weight 500 for the same reason: at hairline weights the
  antialiasing of small text lightens a mid-tone hex until it reads as a tint of
  the surrounding text rather than as its own color.

## Development

Plain JavaScript, no build step. `client.js` is the browser half and is loaded
directly; `index.js` is an empty Host half.

```sh
node check.mjs   # loads the bundle, then asserts the seats it registers
```

Because the profile installs this directory as a symlink, edits to `client.js`
take effect after the page reloads the module.

### Releasing

Bump `version` in `package.json`, add an entry to [CHANGELOG.md](CHANGELOG.md),
then tag and publish:

```sh
git tag -a vX.Y.Z -m "vX.Y.Z"
git push origin main --follow-tags
gh release create vX.Y.Z --title vX.Y.Z --notes-from-tag
```

## License

[MIT](LICENSE)

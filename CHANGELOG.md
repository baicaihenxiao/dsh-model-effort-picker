# Changelog

All notable changes to this bundle are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow
[semantic versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- DeepSeek Harness `0.2.1-rc.5` support beside `0.2.0-rc.2` and `0.2.1-rc.2`:
  the three host peers accept `0.2.0-rc.2 || 0.2.1-rc.2 || 0.2.1-rc.5`. The
  model seat and the effort slider were seen in a browser on `0.2.1-rc.5`.

## [1.1.5] - 2026-10-30

### Fixed

- A cut tick label such as `Medi…` showed its full name only through the
  browser's title tooltip, which waits for a still pointer, so hovering straight
  onto it usually showed nothing. Hovering a cut label now opens its full name
  in place at once, over its neighbours; an end label opens inward, over the
  track rather than the controls beside it.

## [1.1.4] - 2026-10-30

### Fixed

- A long level name ran into its neighbours under the effort slider, such as
  `dsh-codex-subscription`'s `Ultra (DSH parallel · xhigh)` over `Max`. Each
  tick label is now cut with an ellipsis to the gap between two stops, and
  hovering it shows the full name. From six stops on that gap is under 39px, so
  `Medium` is cut as well.

## [1.1.3] - 2026-10-25

### Fixed

- The Speed submenu offered only Standard for models the bundle's mirrored
  fast-mode list does not name, such as `gpt-6.1-sol`. The seat now reads the
  `fastModels` and `ultrafastModels` lists `dsh-codex-subscription` builds from
  its live model catalog (over its `preferences/status` channel, re-read when
  the menu opens), so Fast and Ultrafast appear wherever the provider's own menu
  shows them. The mirrored predicate remains only as the fallback until that
  list arrives, and the Speed row names the tier actually in effect.

## [1.1.2] - 2026-10-17

### Added

- DeepSeek Harness `0.2.1-rc.2` support beside `0.2.0-rc.2`: the three host
  peers accept `0.2.0-rc.2 || 0.2.1-rc.2`, both checked in a browser.

### Fixed

- The model seat and the effort slider crashed on DSH `0.2.1-rc.2` ("cannot get
  property remote.session without inject") and the host's own selector rendered
  instead. From cordis 4.0.5 a service method runs under the caller's inject, and
  `modelDirectories.directoryFor` reads `remote.session`, so the client half now
  injects it; `check.mjs` asserts the inject list.
- Closing the model menu threw `ReferenceError: setEffortOpen is not defined`,
  which skipped resetting the speed submenu and returning focus to the trigger.

## [1.1.1] - 2026-10-15

### Added

- Host compatibility is declared rather than assumed, so the version this bundle
  was verified against is enforced rather than described. `peerDependencies` pins
  the three host packages it uses to `0.2.0-rc.2` and `engines` matches the host's
  Node range. DSH evaluates every `@deepseek-ai/dsh*` peer range against its
  runtime version and refuses installation or activation on a mismatch — an
  exact-version exemption is the documented way to run ahead — so an untested
  host fails loudly instead of rendering a broken composer. Both READMEs state
  the tested version, and `check.mjs` asserts every client `inject` entry is
  pinned, so adding a host package without pinning it fails the check.

## [1.1.0] - 2026-10-15

### Fixed

- Reasoning metadata without a level list no longer throws during render: the
  slider simply does not appear for that model, the same as a model that
  advertises no levels. `check.mjs` covers a missing, null, non-array and empty
  `efforts` field.
- Cramped, uneven tick labels on models with six or more levels. The end labels
  were anchored to the block's edges while the rest were centred, so the gaps
  differed and the marks sat off their stops; every stop is now centred on its
  own offset, the track widens with the level count (150px base, +26px per extra
  stop, capped at 230px) and the ends have reserved room.

### Changed

- Thinner effort bar. The track and thumb are drawn by the bundle (3px track,
  9px thumb, filled up to the thumb's centre) instead of coming from the native
  range control, whose own track and thumb size cannot be reduced by shrinking
  its box. The label row is 14px: the mark, a 2px gap, then the name.
- The track past the selected level is drawn in the quieter label tone
  (`--dsw-alias-label-caption`) rather than the label color, so the filled part
  up to the thumb is the only strong element.
- The level labels carry their ramp color plainly: `TINT_STRENGTH` is 100 (the
  palette hex itself, no longer mixed toward the label color) and the text is
  10px at weight 500, so the color survives 9px-style antialiasing instead of
  reading as a tint of the surrounding text.
- The effort caption in the model button is sized by its content again, as the
  shipped control sizes it, instead of a fixed `4.5em` box with right-aligned
  text. A chip painted on that label by another plugin now hugs the text and
  stays centred; in exchange the button's left edge follows the caption's length,
  which the right-anchored tool row absorbs, and the model name ellipsises
  sooner when the caption is long.

### Added

- Level labels are tinted from the lowest level to the highest along a fixed
  six-color ramp — `#475569`, `#2563EB`, `#4F46E5`, `#6D28D9`, `#7E22CE`,
  `#86198F` — set by `TINT_RAMP`. The labels interpolate across it, so any level
  count is covered rather than a color repeating, and six levels land one label
  on each color in order.
- Every tint mixes toward the label color by `TINT_STRENGTH`, which is what keeps
  these hex hues readable in both palettes; `check.mjs` asserts one distinct tint
  per level at 4, 6 and 8 levels, and the exact palette at six.

## [1.0.0] - 2026-10-15

### Added

- The composer's model control opens the provider-grouped model list directly as
  the menu's first level: check mark on the current model, the catalog
  description under a model that has one, search once the catalog holds more
  than four models, and <kbd>↑</kbd>/<kbd>↓</kbd> plus <kbd>Esc</kbd> navigation
  (`conversation.input.model`, shadowing priority `-20`).
- Reasoning effort as a slider on the model control's right
  (`conversation.input.activity`): one tick and one name per level the current
  model advertises, a fixed 150px track with no reflow when the level changes,
  and one submission per gesture. Hidden for models without reasoning metadata
  or with a single level.
- The provider's speed tiers are offered in the same menu, read from and written
  to the settings entry the provider plugin itself uses.
- The provider plugin's `disabledModels` preference is honoured, so models it
  hides stay hidden, and edits made there follow without a page reload.
- `node check.mjs`: a smoke check that loads the bundle and asserts its module
  registration id, inject contract, and both seat registrations.

[Unreleased]: https://github.com/baicaihenxiao/dsh-model-effort-picker/commits/main
[1.1.5]: https://github.com/baicaihenxiao/dsh-model-effort-picker/releases/tag/v1.1.5
[1.1.4]: https://github.com/baicaihenxiao/dsh-model-effort-picker/releases/tag/v1.1.4
[1.1.3]: https://github.com/baicaihenxiao/dsh-model-effort-picker/releases/tag/v1.1.3
[1.1.2]: https://github.com/baicaihenxiao/dsh-model-effort-picker/releases/tag/v1.1.2
[1.1.1]: https://github.com/baicaihenxiao/dsh-model-effort-picker/releases/tag/v1.1.1
[1.1.0]: https://github.com/baicaihenxiao/dsh-model-effort-picker/releases/tag/v1.1.0
[1.0.0]: https://github.com/baicaihenxiao/dsh-model-effort-picker/releases/tag/v1.0.0

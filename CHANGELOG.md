# Changelog

All notable changes to this bundle are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow
[semantic versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
[1.0.0]: https://github.com/baicaihenxiao/dsh-model-effort-picker/releases/tag/v1.0.0

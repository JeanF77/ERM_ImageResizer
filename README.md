# ERM Image Resizer

ERM Image Resizer is a JavaScript/jQuery widget for IBM Engineering Requirements Management (ERM, DOORS Next) that resizes, in one click, the images embedded in the rich text of the artifacts selected in a module.

In ERM, an image pasted into a requirement keeps its original size, or the size it was given by hand, image by image. When a module contains dozens of screenshots or diagrams, giving them a uniform width means opening and editing each artifact. This widget applies a single width to every embedded image of the selected artifacts, and computes the matching height so that the images keep their proportions.

| | |
|---|---|
| Version | v2026d |
| Target application | ERM (DOORS Next) with the RM Extensions API (`com.ibm.rdm.rm.api`) |
| Browsers | Chrome, Edge |

## Features

- **Module awareness** — the widget follows the artifact opened in ERM and displays the module identifier and name; it stays disabled when the opened artifact is not a module.
- **Configuration context** — when a module is opened, the widget reads the current configuration with `RM.Client.getCurrentConfigurationContext`. The change set is used if there is one, otherwise the stream. In a **baseline**, which cannot be modified, the buttons stay disabled and the message "Baseline can not be modified !" is displayed. They also stay disabled, with a message, if the configuration cannot be read or is neither a stream nor a change set.
- **Selection-based** — it processes the artifacts selected in the module (up to 200 at a time). The **Resize Image** and **Reset Image** buttons are enabled only when a module is open in a change set or a stream and the selection is valid, and are disabled while a run is in progress.
- **Image width** — width in pixels entered in the widget (integer, default 200). A value below 20 or above 1000 is replaced by the nearest limit, with a message under the button.
- **Proportional height** — for each image, the widget downloads the image resource in the current configuration (the `src` URL completed with `oslc_config.context=<change set or stream>`, without which ERM answers HTTP 410), checks that its `Content-Type` is `image/*`, reads its natural size and sets `height = round(width × natural height / natural width)`. Each image is downloaded only once per run, even if it appears in several artifacts. If the size cannot be read (HTTP error, resource that is not an image), only `width` is written, and the browser keeps the ratio when displaying the image.
- **Reset Image** — second button, under **Resize Image**: removes the size of the embedded images (`width` and `height` attributes, and `width` / `height` in the `style` attribute), so that they are displayed again at their original size. Artifacts whose images have no size are not modified, and the width field is ignored.
- **Report** — number of artifacts analyzed and modified, first and last artifact of the selection, and a success / failure indicator. Details of each step are written to the browser console.

### What is modified

Only artifacts in **Text** format are processed. In their Primary Text, an image is considered embedded when it has the attribute `alt="Embedded Image"` (case-insensitive), or when its `src` is an image stored in ERM (`/wrappedResources/`). Images from other sites are left unchanged. The size of an image can take several forms:

```html
<!-- No size set -->
<img alt="Embedded Image" id="_1778079980440" src="https://<server>/rm/wrappedResources/WR_...?accept=none&private"/>

<!-- Size set by attributes ("width" alone, or "width" and "height") -->
<img alt="Embedded Image" height="225" id="_1778079980440" src="https://<server>/rm/wrappedResources/WR_...?accept=none&private" width="180"/>

<!-- Size set in the style -->
<img alt="" id="_4749167364120770" src="https://<server>/rm/wrappedResources/WR_...?accept=none&private" style="width: 161px; height: 103px;"/>
```

In every case, **Resize Image** writes the size with the `width` and `height` attributes only: `width` and `height` are removed from the `style` attribute, whose other properties are kept, and the `style` attribute is removed if it becomes empty. **Reset Image** removes the size in every form. All other content of the artifact is left unchanged.

An artifact is **skipped** when:

- its format is not Text (modules, collections, wrapped files…);
- its Primary Text contains no embedded image;
- its Primary Text contains an *embedded resource decorator* (CSS class `com-ibm-rdm-editor-embeddedresourcedecorator`, case-insensitive), so that embedded artifacts are never altered.

Modified artifacts are saved through the RM API in batches of 3. If a batch fails, the update stops and an error message is displayed.

## Tech stack

- [jQuery 3.7.1](https://jquery.com/) (MIT), bundled in `js/jquery/`
- [Bootstrap 5.3.3](https://getbootstrap.com/) + [Bootstrap Icons 1.13.1](https://icons.getbootstrap.com/) (MIT), **not bundled**: loaded from the shared library `../ELM_sharedLib/` of the hosting server
- [RM Extensions API](https://jazz.net/wiki/bin/view/Main/RMExtensions6061) (`RM.Data`, `RM.Event`, `RM.Client`), provided by ERM
- Packaged as an [OpenSocial](https://opensocial.github.io/spec/2.5.1/Core-Gadget.xml.html) gadget (`main.xml`) for deployment inside an ERM dashboard

## Project structure

```
main.xml               OpenSocial gadget declaration (requires com.ibm.rdm.rm.api, no UserPref)
main.html              Widget markup
css/widget.css         Styles
js/
  AGS_main.js            Entry point
  AGS_view.js            ERM events, image resizing logic, batch update, GUI wiring
  AGS_guiUtils.js        Button and progress indicator helpers
  AGS_utils.js           Generic helpers (console log, templates, sorting)
  jquery/                jQuery 3.7.1
resources/             Widget icon and status icons
widget_spec.txt        Original functional specification (in French)
```

## Deployment

1. Copy the widget folder next to `ELM_sharedLib/` on the server, so that `../ELM_sharedLib/bootstrap/5.3.3/` and `../ELM_sharedLib/bootstrap-icons/1.13.1/` resolve from `main.html`.
2. Register `main.xml` as an OpenSocial gadget in ERM and add it to a dashboard (for example the mini dashboard of the project).

The widget reads each image with `fetch` and the user's session (`credentials: "include"`). The widget must therefore be served from the same origin as ERM, or the ERM server must allow that origin, with credentials, in its CORS policy.

## Usage

1. In ERM, open the module, in the configuration (stream or change set) where the changes must be made. In a baseline, the widget is read-only.
2. Select the artifacts whose images must be resized (up to 200).
3. Enter the **Image Width** in pixels (not needed for **Reset Image**).
4. Click **Resize Image**, and wait for the success indicator. To go back to the original size of the images, click **Reset Image** instead.
5. Check the result in the module. Every change is a normal artifact update, visible in the artifact history.

## Limitations

- The width is the same for every image of the selection; there is no "only reduce larger images" mode.
- Images inside an artifact that contains an embedded resource decorator are not resized.
- The configuration context is read when the module is opened. If the configuration is changed without reopening the module, reopen it before running the widget.

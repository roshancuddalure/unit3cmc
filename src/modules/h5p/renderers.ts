import type { IEditorModel, IPlayerModel } from "@lumieducation/h5p-server";

const H5P_ASSET_VERSION = "2026-04-16-upload-tab-fix";

function normalizeAssetUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch (_error) {
    return url;
  }
}

function withAssetVersion(url: string): string {
  const normalizedUrl = normalizeAssetUrl(url);
  const separator = normalizedUrl.includes("?") ? "&" : "?";
  return `${normalizedUrl}${separator}v=${H5P_ASSET_VERSION}`;
}

function renderStyles(styles: string[]): string {
  return styles.map((style) => `<link rel="stylesheet" href="${withAssetVersion(style)}">`).join("\n");
}

function renderScripts(scripts: string[]): string {
  return scripts.map((script) => `<script src="${withAssetVersion(script)}"></script>`).join("\n");
}

export function renderEditorFrame(model: IEditorModel): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>H5P Composer</title>
  <script>window.H5PIntegration = parent.H5PIntegration || ${JSON.stringify(model.integration, null, 2)};</script>
  <script>
    (function() {
      var version = '${H5P_ASSET_VERSION}';
      var normalizeUrl = function(url) {
        if (!url) {
          return url;
        }
        try {
          var parsed = new URL(url, window.location.origin);
          return parsed.pathname + parsed.search + parsed.hash;
        } catch (_error) {
          return url;
        }
      };
      var addVersion = function(url) {
        if (!url) {
          return url;
        }
        var normalizedUrl = normalizeUrl(url);
        return normalizedUrl + (normalizedUrl.indexOf('?') === -1 ? '?' : '&') + 'v=' + version;
      };
      var normalizeEditorUrlFields = function(editorConfig) {
        if (!editorConfig) {
          return;
        }
        editorConfig.ajaxPath = normalizeUrl(editorConfig.ajaxPath);
        editorConfig.filesPath = normalizeUrl(editorConfig.filesPath);
        editorConfig.libraryUrl = normalizeUrl(editorConfig.libraryUrl);
      };
      if (window.H5PIntegration) {
        window.H5PIntegration.ajaxPath = normalizeUrl(window.H5PIntegration.ajaxPath);
        window.H5PIntegration.baseUrl = '';
        normalizeEditorUrlFields(window.H5PIntegration.editor);
      }
      if (window.H5PIntegration && window.H5PIntegration.editor && window.H5PIntegration.editor.assets) {
        window.H5PIntegration.editor.assets = {
          css: (window.H5PIntegration.editor.assets.css || []).map(addVersion),
          js: (window.H5PIntegration.editor.assets.js || []).map(addVersion)
        };
      }
    })();
  </script>
  ${renderStyles(model.styles)}
  ${renderScripts(model.scripts)}
  <style>
    body { margin: 0; font-family: Arial, sans-serif; background: #f5f7fb; color: #102042; }
    .studio-shell { max-width: 1200px; margin: 0 auto; padding: 24px; }
    .studio-header { display: grid; gap: 10px; margin-bottom: 20px; }
    .studio-header h1 { margin: 0; font-size: 28px; }
    .studio-header p { margin: 0; color: #52617f; max-width: 70ch; }
    .studio-meta { display: grid; gap: 14px; margin-bottom: 18px; padding: 18px; background: white; border: 1px solid #d8dfef; border-radius: 18px; }
    .studio-meta-grid { display: grid; gap: 14px; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); }
    .studio-meta label { display: grid; gap: 8px; font-weight: 700; }
    .studio-meta input, .studio-meta textarea { width: 100%; padding: 12px 14px; border: 1px solid #c4cde2; border-radius: 12px; font: inherit; }
    .studio-meta textarea { min-height: 96px; resize: vertical; }
    .studio-meta small { color: #52617f; font-weight: 500; }
    .h5p-create { background: white; border: 1px solid #d8dfef; border-radius: 18px; padding: 20px; }
    .h5p-create-note { margin: 0 0 14px; color: #52617f; font-size: 14px; }
    #save-h5p { margin-top: 18px; border: 0; border-radius: 999px; background: #1d48d6; color: white; font-weight: 700; padding: 12px 20px; cursor: pointer; }
    .studio-note { color: #52617f; font-size: 14px; }
  </style>
</head>
<body>
  <div class="studio-shell">
    <div class="studio-header">
      <p class="studio-note">H5P Composer</p>
      <h1>Build interactive learning content</h1>
      <p>Save the H5P activity itself here, and the platform will automatically sync a linked learning-library item so faculty can organize and learners can open it from the main workspace.</p>
    </div>
    <form method="post" enctype="multipart/form-data" id="h5p-content-form">
      <section class="studio-meta">
        <div class="studio-meta-grid">
          <label>
            <span>Activity title</span>
            <input id="h5p-title" type="text" name="title" placeholder="Interactive haemodynamics quiz" required>
          </label>
          <label>
            <span>Publish into learning library</span>
            <input type="hidden" name="createResource" value="true">
            <small>The linked learning resource stays in sync with this H5P item.</small>
          </label>
        </div>
        <label>
          <span>Short description</span>
          <textarea id="h5p-description" name="description" placeholder="A short summary used in the learning library and H5P studio cards."></textarea>
        </label>
      </section>
      <div class="h5p-create">
        <p class="h5p-create-note">Choose an activity type, open its details, then press <strong>Use</strong> to start authoring. You can also switch to <strong>Upload</strong> to import a .h5p package.</p>
        <div class="h5p-editor"></div>
      </div>
      <input id="save-h5p" type="submit" value="Save interactive lesson">
    </form>
  </div>
  <script>
  var ns = H5PEditor;
  (function($) {
    H5PEditor.init = function() {
      H5PEditor.$ = H5P.jQuery;
      H5PEditor.basePath = H5PIntegration.editor.libraryUrl;
      H5PEditor.fileIcon = H5PIntegration.editor.fileIcon;
      H5PEditor.ajaxPath = H5PIntegration.editor.ajaxPath;
      H5PEditor.filesPath = H5PIntegration.editor.filesPath;
      H5PEditor.apiVersion = H5PIntegration.editor.apiVersion;
      H5PEditor.contentLanguage = H5PIntegration.editor.language;
      H5PEditor.copyrightSemantics = H5PIntegration.editor.copyrightSemantics;
      H5PEditor.metadataSemantics = H5PIntegration.editor.metadataSemantics;
      H5PEditor.assets = H5PIntegration.editor.assets;
      H5PEditor.baseUrl = '';
      if (H5PIntegration.editor.nodeVersionId !== undefined) {
        H5PEditor.contentId = H5PIntegration.editor.nodeVersionId;
      }

      var h5peditor;
      var $editor = $('.h5p-editor');
      var titleInput = document.getElementById('h5p-title');
      var descriptionInput = document.getElementById('h5p-description');
      var fallbackSaveError = 'The H5P item could not be saved. Please review the activity and try again.';

      var getSaveErrorMessage = function(jqXHR) {
        if (jqXHR && jqXHR.responseJSON && typeof jqXHR.responseJSON.error === 'string' && jqXHR.responseJSON.error) {
          return jqXHR.responseJSON.error;
        }

        if (jqXHR && typeof jqXHR.responseText === 'string' && jqXHR.responseText) {
          try {
            var parsed = JSON.parse(jqXHR.responseText);
            if (parsed && typeof parsed.error === 'string' && parsed.error) {
              return parsed.error;
            }
          } catch (_error) {
          }
        }

        return fallbackSaveError;
      };

      var unwrapEditorParams = function(value) {
        if (
          value &&
          typeof value === 'object' &&
          !Array.isArray(value) &&
          Object.prototype.hasOwnProperty.call(value, 'params') &&
          Object.prototype.hasOwnProperty.call(value, 'metadata')
        ) {
          return value.params;
        }

        return value;
      };

      var createEditor = function(res) {
        if (res && res.library && res.params) {
          h5peditor = new ns.Editor(res.library, JSON.stringify(res.params), $editor[0]);
          if (res.h5p) {
            if (titleInput && res.h5p.title) titleInput.value = res.h5p.title;
            if (descriptionInput && res.h5p.metaDescription) descriptionInput.value = res.h5p.metaDescription;
          }
          return;
        }
        h5peditor = new ns.Editor(undefined, undefined, $editor[0]);
      };

      if (H5PEditor.contentId) {
        $.ajax({
          type: 'GET',
          url: '${model.urlGenerator.parameters()}/' + H5PEditor.contentId + window.location.search,
          success: function(res) { createEditor(res); },
          error: function() { createEditor(); }
        });
      } else {
        createEditor();
      }

      var formIsSubmitting = false;
      $('#h5p-content-form').submit(function(event) {
        if (h5peditor === undefined || formIsSubmitting) {
          return;
        }

        var params = h5peditor.getParams();
        if (params.params === undefined) {
          return event.preventDefault();
        }

        h5peditor.getContent(function(content) {
          var parsedContentParams = JSON.parse(content.params);
          formIsSubmitting = true;
          $.ajax({
            data: JSON.stringify({
              library: content.library,
              params: unwrapEditorParams(parsedContentParams),
              metadata: {
                title: titleInput ? titleInput.value : '',
                metaDescription: descriptionInput ? descriptionInput.value : ''
              },
              createResource: true
            }),
            headers: { 'Content-Type': 'application/json' },
            type: 'POST'
          }).then(function(result) {
            var parsedResult = typeof result === 'string' ? JSON.parse(result) : result;
            if (parsedResult.contentId) {
              window.location.href = '/h5p/studio';
            }
          }).catch(function(jqXHR) {
            formIsSubmitting = false;
            window.alert(getSaveErrorMessage(jqXHR));
          });
        });

        return event.preventDefault();
      });
    };

    H5PEditor.getAjaxUrl = function(action, parameters) {
      var url = H5PIntegration.editor.ajaxPath + action;
      if (parameters !== undefined) {
        for (var property in parameters) {
          if (parameters.hasOwnProperty(property)) {
            url += '&' + property + '=' + parameters[property];
          }
        }
      }
      url += window.location.search.replace(/\\?/g, '&');
      return url;
    };

    H5PEditor.enableContentHub = H5PIntegration.editor.enableContentHub || false;
    $(document).ready(H5PEditor.init);
  })(H5P.jQuery);
  </script>
</body>
</html>`;
}

export function renderPlayerFrame(model: IPlayerModel, contentId: string, xapiUrl: string): string {
  return `<!doctype html>
<html class="h5p-iframe" lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  ${renderStyles(model.styles)}
  ${renderScripts(model.scripts)}
  <script>window.H5PIntegration = ${JSON.stringify(model.integration, null, 2)};</script>
  <script>
    (function() {
      var version = '${H5P_ASSET_VERSION}';
      var normalizeUrl = function(url) {
        if (!url) {
          return url;
        }
        try {
          var parsed = new URL(url, window.location.origin);
          return parsed.pathname + parsed.search + parsed.hash;
        } catch (_error) {
          return url;
        }
      };
      if (window.H5PIntegration) {
        window.H5PIntegration.ajaxPath = normalizeUrl(window.H5PIntegration.ajaxPath);
        window.H5PIntegration.baseUrl = '';
      }
      var addVersion = function(url) {
        if (!url) {
          return url;
        }
        var normalizedUrl = normalizeUrl(url);
        return normalizedUrl + (normalizedUrl.indexOf('?') === -1 ? '?' : '&') + 'v=' + version;
      };
      if (window.H5PIntegration) {
        window.H5PIntegration.core = (window.H5PIntegration.core || {}).map ? window.H5PIntegration.core.map(addVersion) : window.H5PIntegration.core;
      }
    })();
  </script>
  <style>
    :root {
      color-scheme: light;
      --player-bg: #edf1fc;
      --player-bg-strong: #e2e8f8;
      --player-surface: rgba(255, 255, 255, 0.92);
      --player-surface-strong: #ffffff;
      --player-surface-soft: rgba(255, 255, 255, 0.7);
      --player-line: rgba(22, 44, 130, 0.12);
      --player-line-strong: rgba(22, 44, 130, 0.22);
      --player-shadow: 0 14px 38px rgba(8, 16, 60, 0.08), 0 34px 80px rgba(12, 23, 80, 0.09);
      --player-shadow-soft: 0 8px 20px rgba(12, 23, 80, 0.08);
      --player-muted: #59668a;
      --player-ink: #0c1736;
      --player-accent: #2344cc;
      --player-accent-deep: #162ea6;
      --player-accent-soft: #eaedff;
      --player-accent-glow: rgba(35, 68, 204, 0.16);
      --player-success: #0e6b47;
      --player-success-soft: #edfaf4;
      --player-danger: #9b2d35;
      --player-danger-soft: #fff0f1;
      --player-warning-soft: #fef9ec;
      --player-radius-xl: 30px;
      --player-radius-lg: 22px;
      --player-radius-md: 16px;
      --player-radius-sm: 12px;
      --player-font-display: "Georgia", "Times New Roman", serif;
      --player-font-body: "Aptos", "Segoe UI", "Helvetica Neue", Arial, sans-serif;
    }
    * { box-sizing: border-box; }
    html {
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      text-rendering: optimizeLegibility;
    }
    body {
      margin: 0;
      min-height: 100vh;
      color: var(--player-ink);
      font-family: var(--player-font-body);
      background:
        radial-gradient(circle at top left, rgba(35, 68, 204, 0.16), transparent 34%),
        radial-gradient(circle at 85% 18%, rgba(79, 122, 255, 0.16), transparent 22%),
        radial-gradient(circle at bottom right, rgba(35, 68, 204, 0.08), transparent 30%),
        linear-gradient(180deg, #f6f8ff 0%, var(--player-bg) 48%, #f8faff 100%);
      background-attachment: fixed;
    }
    .player-shell {
      width: min(1120px, calc(100% - 24px));
      margin: 0 auto;
      padding: clamp(18px, 3vw, 34px) 0;
    }
    .player-card {
      overflow: hidden;
      position: relative;
      border: 1px solid var(--player-line);
      border-radius: var(--player-radius-xl);
      background: var(--player-surface);
      box-shadow: var(--player-shadow);
      backdrop-filter: blur(18px);
      -webkit-backdrop-filter: blur(18px);
    }
    .player-card::before {
      content: "";
      position: absolute;
      inset: 0 0 auto;
      height: 10px;
      background: linear-gradient(90deg, var(--player-accent-deep) 0%, var(--player-accent) 46%, #6e94ff 100%);
    }
    .player-header {
      display: grid;
      gap: 14px;
      padding: 26px 26px 0;
    }
    .player-header-main {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 16px;
      flex-wrap: wrap;
    }
    .player-kicker {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      color: var(--player-accent);
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.16em;
      text-transform: uppercase;
    }
    .player-kicker::before {
      content: "";
      width: 8px;
      height: 8px;
      border-radius: 999px;
      background: linear-gradient(135deg, var(--player-accent) 0%, #7fa1ff 100%);
      box-shadow: 0 0 0 6px var(--player-accent-glow);
    }
    .player-heading {
      display: grid;
      gap: 8px;
      max-width: 760px;
    }
    .player-heading h1 {
      margin: 0;
      font-family: var(--player-font-display);
      font-size: clamp(2rem, 3.4vw, 3.1rem);
      line-height: 0.96;
      letter-spacing: -0.04em;
      color: var(--player-ink);
    }
    .player-heading p {
      margin: 0;
      color: var(--player-muted);
      font-size: 15px;
      line-height: 1.7;
      max-width: 62ch;
    }
    .player-badges {
      display: flex;
      flex-wrap: wrap;
      justify-content: flex-end;
      gap: 10px;
      align-self: flex-start;
    }
    .player-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      min-height: 40px;
      padding: 10px 14px;
      border: 1px solid var(--player-line);
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.75);
      box-shadow: var(--player-shadow-soft);
      color: var(--player-ink);
      font-size: 13px;
      font-weight: 700;
    }
    .player-badge strong {
      color: var(--player-accent-deep);
    }
    .player-badge::before {
      content: "";
      width: 8px;
      height: 8px;
      border-radius: 999px;
      background: linear-gradient(135deg, var(--player-accent-deep) 0%, var(--player-accent) 100%);
    }
    .player-summary {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 12px;
    }
    .player-summary-card {
      padding: 14px 16px;
      border: 1px solid var(--player-line);
      border-radius: var(--player-radius-md);
      background:
        linear-gradient(180deg, rgba(255, 255, 255, 0.94), rgba(250, 252, 255, 0.86)),
        linear-gradient(135deg, rgba(35, 68, 204, 0.03), rgba(79, 122, 255, 0.08));
    }
    .player-summary-card span {
      display: block;
      color: var(--player-accent);
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      margin-bottom: 6px;
    }
    .player-summary-card strong {
      display: block;
      margin: 0;
      font-size: 18px;
      line-height: 1.2;
      color: var(--player-ink);
    }
    .player-stage {
      padding: 20px;
    }
    .h5p-content {
      min-height: 160px;
      border-radius: var(--player-radius-lg);
      background:
        linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 255, 0.96));
      border: 1px solid rgba(22, 44, 130, 0.07);
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.9);
      overflow: hidden;
    }

    .h5p-content .h5p-question,
    .h5p-content .intro-page,
    .h5p-content .questionset-results,
    .h5p-content .questionset {
      background: transparent;
    }

    .h5p-content .intro-page {
      padding: clamp(28px, 4vw, 42px);
      background:
        radial-gradient(circle at top right, rgba(79, 122, 255, 0.12), transparent 28%),
        linear-gradient(135deg, rgba(35, 68, 204, 0.03), rgba(255, 255, 255, 0.9) 42%, rgba(255, 255, 255, 0.96) 100%);
    }
    .h5p-content .intro-page .title {
      text-align: left;
      font-family: var(--player-font-display);
      font-size: clamp(2rem, 3vw, 2.8rem);
      font-weight: 700;
      line-height: 0.96;
      letter-spacing: -0.04em;
      margin-bottom: 18px;
    }
    .h5p-content .intro-page .title > span,
    .h5p-content .intro-page .introduction {
      background: transparent;
      padding: 0;
    }
    .h5p-content .intro-page .introduction {
      margin: 0;
      color: var(--player-muted);
      font-size: 16px;
      line-height: 1.75;
      max-width: 62ch;
    }
    .h5p-content .intro-page .buttons {
      margin: 30px 0 0;
      text-align: left;
    }

    .h5p-content .questionset {
      padding: 18px;
    }
    .h5p-content .question-container {
      border: 1px solid var(--player-line);
      border-radius: var(--player-radius-lg);
      background:
        linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 255, 0.98));
      box-shadow: var(--player-shadow-soft);
      overflow: hidden;
    }
    .h5p-content .h5p-question {
      margin: 0;
      border: 0;
      border-radius: 0;
      box-shadow: none;
      background: transparent;
    }
    .h5p-content .h5p-question-content,
    .h5p-content .h5p-question-introduction,
    .h5p-content .h5p-question-scorebar.h5p-question-visible,
    .h5p-content .h5p-question-feedback.h5p-question-visible,
    .h5p-content .h5p-question-buttons.h5p-question-visible {
      margin-left: 24px;
      margin-right: 24px;
    }
    .h5p-content .h5p-question-introduction {
      margin-top: 24px;
      font-size: 17px;
      line-height: 1.7;
      color: var(--player-muted);
    }
    .h5p-content .h5p-question-content {
      margin-top: 0;
      margin-bottom: 22px;
    }
    .h5p-content .h5p-question-image-wrap {
      overflow: hidden;
      border-radius: 18px;
      box-shadow: var(--player-shadow-soft);
    }

    .h5p-content .h5p-multichoice h2 {
      margin: 0 0 10px;
      font-family: var(--player-font-display);
      font-size: clamp(1.55rem, 2.2vw, 2rem);
      font-weight: 700;
      line-height: 1.08;
      letter-spacing: -0.03em;
      color: var(--player-ink);
    }
    .h5p-content .h5p-multichoice .h5p-answer {
      margin: 10px 0;
    }
    .h5p-content .h5p-multichoice .h5p-alternative-container {
      padding: 16px 18px 16px 56px;
      border-radius: 18px;
      border: 1px solid rgba(22, 44, 130, 0.1);
      background: linear-gradient(180deg, #ffffff 0%, #f7f9ff 100%);
      box-shadow: none;
      text-indent: 0;
      line-height: 1.55;
      transition: transform 160ms ease, border-color 160ms ease, box-shadow 160ms ease, background-color 160ms ease;
    }
    .h5p-content .h5p-multichoice .h5p-answer .h5p-alternative-container:before {
      left: 20px;
      top: 50%;
      transform: translateY(-50%);
      width: 20px;
      height: 20px;
      color: var(--player-accent-deep);
    }
    .h5p-content .h5p-multichoice .h5p-answer:not([aria-disabled="true"]):hover .h5p-alternative-container {
      transform: translateY(-1px);
      border-color: rgba(35, 68, 204, 0.2);
      background: linear-gradient(180deg, #ffffff 0%, #f3f6ff 100%);
      box-shadow: 0 10px 24px rgba(35, 68, 204, 0.08);
    }
    .h5p-content .h5p-multichoice .h5p-answer[aria-checked="true"] .h5p-alternative-container {
      color: var(--player-accent-deep);
      background: linear-gradient(180deg, #f6f8ff 0%, #eaf0ff 100%);
      border-color: rgba(35, 68, 204, 0.26);
      box-shadow: 0 12px 24px rgba(35, 68, 204, 0.1);
    }
    .h5p-content .h5p-multichoice .h5p-answer.h5p-correct .h5p-alternative-container,
    .h5p-content .h5p-multichoice .h5p-answer.h5p-correct:hover .h5p-alternative-container {
      background: linear-gradient(180deg, #f5fcf8 0%, var(--player-success-soft) 100%);
      border-color: rgba(14, 107, 71, 0.2);
      color: var(--player-success);
      box-shadow: 0 10px 22px rgba(14, 107, 71, 0.08);
    }
    .h5p-content .h5p-multichoice .h5p-answer.h5p-wrong .h5p-alternative-container,
    .h5p-content .h5p-multichoice .h5p-answer.h5p-wrong:hover .h5p-alternative-container {
      background: linear-gradient(180deg, #fff7f8 0%, var(--player-danger-soft) 100%);
      border-color: rgba(155, 45, 53, 0.22);
      color: var(--player-danger);
      box-shadow: 0 10px 22px rgba(155, 45, 53, 0.08);
    }
    .h5p-content .h5p-multichoice .feedback-text,
    .h5p-content .h5p-question-feedback {
      color: var(--player-accent-deep);
    }

    .h5p-content .h5p-joubelui-button,
    .h5p-content .h5p-button {
      min-height: 46px;
      padding: 12px 18px;
      border: 1px solid transparent;
      border-radius: 999px;
      background: linear-gradient(135deg, var(--player-accent-deep) 0%, var(--player-accent) 100%);
      box-shadow: 0 10px 24px rgba(35, 68, 204, 0.24);
      color: #fff;
      font-weight: 800;
      letter-spacing: 0.01em;
      transition: transform 160ms ease, box-shadow 160ms ease, filter 160ms ease;
    }
    .h5p-content .h5p-joubelui-button:hover,
    .h5p-content .h5p-button:hover {
      transform: translateY(-1px);
      filter: saturate(1.03);
      box-shadow: 0 14px 28px rgba(35, 68, 204, 0.26);
    }
    .h5p-content .h5p-question .h5p-question-prev,
    .h5p-content .questionset-results button.h5p-button.qs-solutionbutton,
    .h5p-content .questionset-results button.h5p-button.qs-retrybutton {
      background: linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(245, 248, 255, 0.98));
      border-color: rgba(22, 44, 130, 0.12);
      box-shadow: none;
      color: var(--player-accent-deep);
    }
    .h5p-content .h5p-question .h5p-question-prev:hover,
    .h5p-content .questionset-results button.h5p-button.qs-solutionbutton:hover,
    .h5p-content .questionset-results button.h5p-button.qs-retrybutton:hover {
      box-shadow: 0 10px 20px rgba(12, 23, 80, 0.08);
    }

    .h5p-content .qs-footer {
      margin-top: 18px;
      padding: 16px 18px 4px;
    }
    .h5p-content .qs-progress {
      text-align: left;
    }
    .h5p-content .dots-container {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
      justify-content: flex-start;
      padding: 0;
      margin: 0;
    }
    .h5p-content .progress-item {
      display: inline-flex;
    }
    .h5p-content .progress-dot {
      width: 13px;
      height: 13px;
      margin: 0;
      border: 2px solid rgba(35, 68, 204, 0.12);
      background: rgba(140, 151, 188, 0.25);
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.8);
      transition: transform 160ms ease, background-color 160ms ease, border-color 160ms ease, box-shadow 160ms ease;
    }
    .h5p-content .progress-dot:not(.disabled):hover {
      transform: scale(1.08);
      box-shadow: 0 0 0 8px rgba(35, 68, 204, 0.08);
    }
    .h5p-content .progress-dot.answered {
      background: linear-gradient(135deg, #7d9dff 0%, var(--player-accent) 100%);
      border-color: rgba(35, 68, 204, 0.26);
    }
    .h5p-content .progress-dot.current {
      background: linear-gradient(135deg, var(--player-accent-deep) 0%, var(--player-accent) 100%);
      border-color: transparent;
      box-shadow: 0 0 0 8px rgba(35, 68, 204, 0.12);
    }

    .h5p-content .questionset-results {
      margin: 18px;
      padding: clamp(28px, 4vw, 42px);
      border: 1px solid var(--player-line);
      border-radius: calc(var(--player-radius-lg) + 2px);
      background:
        radial-gradient(circle at top right, rgba(79, 122, 255, 0.12), transparent 28%),
        linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(246, 249, 255, 0.98));
      box-shadow: var(--player-shadow-soft);
      text-align: left;
    }
    .h5p-content .questionset-results .greeting {
      margin: 0 0 10px;
      color: var(--player-accent);
      font-size: 12px;
      font-weight: 800;
      letter-spacing: 0.14em;
      text-transform: uppercase;
    }
    .h5p-content .questionset-results .result-header,
    .h5p-content .questionset-results h2 {
      margin: 0 0 12px;
      font-family: var(--player-font-display);
      font-size: clamp(2rem, 3.2vw, 2.8rem);
      line-height: 0.98;
      letter-spacing: -0.04em;
      color: var(--player-ink);
    }
    .h5p-content .questionset-results .result-text,
    .h5p-content .questionset-results .feedback-section .feedback-text {
      margin: 0;
      color: var(--player-muted);
      font-size: 17px;
      line-height: 1.7;
      font-weight: 600;
    }
    .h5p-content .questionset-results .feedback-section {
      margin: 0 0 18px;
      padding: 18px;
      border: 1px solid rgba(22, 44, 130, 0.08);
      border-radius: 18px;
      background: rgba(255, 255, 255, 0.8);
    }
    .h5p-content .questionset-results .buttons {
      margin: 28px 0 0;
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
    }

    .h5p-content .h5p-joubelui-score-bar {
      overflow: hidden;
      border-radius: 999px;
      background: rgba(22, 44, 130, 0.08);
    }
    .h5p-content .h5p-joubelui-score-bar .h5p-joubelui-score-bar-progress {
      border-radius: 999px;
      background: linear-gradient(90deg, var(--player-accent-deep) 0%, var(--player-accent) 100%);
    }
    .h5p-content .h5p-joubelui-tip-container {
      border-radius: 14px;
      border: 1px solid rgba(22, 44, 130, 0.08);
      background: var(--player-warning-soft);
    }

    body[data-h5p-library="H5P.QuestionSet"] .player-card {
      background:
        linear-gradient(180deg, rgba(255, 255, 255, 0.95), rgba(247, 249, 255, 0.94));
    }

    @media (max-width: 860px) {
      .player-summary {
        grid-template-columns: 1fr;
      }
      .player-badges {
        justify-content: flex-start;
      }
    }
    @media (max-width: 720px) {
      .player-card { border-radius: 22px; }
      .player-header { padding: 22px 16px 0; }
      .player-stage { padding: 14px; }
      .player-heading h1 {
        font-size: clamp(1.7rem, 8vw, 2.35rem);
      }
      .player-heading p {
        font-size: 14px;
      }
      .player-summary-card {
        padding: 12px 14px;
      }
      .h5p-content {
        border-radius: 18px;
      }
      .h5p-content .intro-page,
      .h5p-content .questionset-results {
        padding: 22px 18px;
      }
      .h5p-content .questionset {
        padding: 12px;
      }
      .h5p-content .h5p-question-content,
      .h5p-content .h5p-question-introduction,
      .h5p-content .h5p-question-scorebar.h5p-question-visible,
      .h5p-content .h5p-question-feedback.h5p-question-visible,
      .h5p-content .h5p-question-buttons.h5p-question-visible {
        margin-left: 18px;
        margin-right: 18px;
      }
      .h5p-content .h5p-multichoice .h5p-alternative-container {
        padding: 14px 14px 14px 52px;
        border-radius: 16px;
      }
      .h5p-content .qs-footer {
        padding-left: 12px;
        padding-right: 12px;
      }
    }
  </style>
</head>
<body>
  <main class="player-shell">
    <section class="player-card">
      <header class="player-header">
        <div class="player-header-main">
          <div class="player-heading">
            <span class="player-kicker">Interactive activity</span>
            <h1 id="player-title">Premium learning experience</h1>
            <p id="player-description">Complete the interactive activity below. Progress and xAPI events are synced back into the Unit 3 learning workflow.</p>
          </div>
          <div class="player-badges" id="player-badges">
            <div class="player-badge"><strong id="player-library">Interactive</strong></div>
          </div>
        </div>
        <div class="player-summary">
          <div class="player-summary-card">
            <span>Format</span>
            <strong id="player-format">Interactive module</strong>
          </div>
          <div class="player-summary-card">
            <span>Question count</span>
            <strong id="player-question-count">Live</strong>
          </div>
          <div class="player-summary-card">
            <span>Pass target</span>
            <strong id="player-pass-target">Auto-calculated</strong>
          </div>
        </div>
      </header>
      <div class="player-stage">
        <div class="h5p-content" data-content-id="${contentId}"></div>
      </div>
    </section>
  </main>
  <script>
    (function() {
      var getContentConfig = function() {
        if (!window.H5PIntegration || !window.H5PIntegration.contents) {
          return null;
        }

        return window.H5PIntegration.contents['cid-${contentId}'] || null;
      };

      var prettifyLibraryName = function(library) {
        if (!library) {
          return 'Interactive';
        }

        return String(library)
          .replace(/^H5P\\./, '')
          .replace(/\\s+\\d+\\.\\d+$/, '')
          .replace(/([a-z])([A-Z])/g, '$1 $2');
      };

      var updatePlayerChrome = function() {
        var config = getContentConfig();
        if (!config) {
          return;
        }

        var library = String(config.library || '');
        var metadata = config.metadata || {};
        var title = metadata.title || 'Interactive activity';
        var description = metadata.description || metadata.metaDescription || 'Complete the activity below. Progress and xAPI events are synced back into the Unit 3 learning workflow.';
        var format = prettifyLibraryName(library);
        var questionCount = 'Adaptive';
        var passTarget = 'Practice mode';
        var parsedJson = null;

        try {
          parsedJson = config.jsonContent ? JSON.parse(config.jsonContent) : null;
        } catch (_error) {
        }

        if (parsedJson && Array.isArray(parsedJson.questions)) {
          questionCount = String(parsedJson.questions.length);
        }

        if (parsedJson && typeof parsedJson.passPercentage === 'number' && parsedJson.passPercentage > 0) {
          passTarget = parsedJson.passPercentage + '%';
        }

        document.body.setAttribute('data-h5p-library', library.replace(/\\s+\\d+\\.\\d+$/, ''));

        var titleNode = document.getElementById('player-title');
        var descriptionNode = document.getElementById('player-description');
        var libraryNode = document.getElementById('player-library');
        var formatNode = document.getElementById('player-format');
        var countNode = document.getElementById('player-question-count');
        var passNode = document.getElementById('player-pass-target');
        var badgesNode = document.getElementById('player-badges');

        if (titleNode) {
          titleNode.textContent = title;
        }
        if (descriptionNode) {
          descriptionNode.textContent = description;
        }
        if (libraryNode) {
          libraryNode.textContent = format;
        }
        if (formatNode) {
          formatNode.textContent = format;
        }
        if (countNode) {
          countNode.textContent = questionCount;
        }
        if (passNode) {
          passNode.textContent = passTarget;
        }
        if (badgesNode && badgesNode.childElementCount === 1 && library.replace(/^H5P\\./, '').indexOf('QuestionSet') === 0) {
          var badge = document.createElement('div');
          badge.className = 'player-badge';
          badge.innerHTML = '<strong>Question Set</strong>';
          badgesNode.appendChild(badge);
        }
      };

      var sendHeight = function() {
        var nextHeight = Math.max(
          document.body ? document.body.scrollHeight : 0,
          document.documentElement ? document.documentElement.scrollHeight : 0,
          320
        );
        if (window.parent && window.parent !== window) {
          window.parent.postMessage({ type: 'unit3:h5p-resize', contentId: '${contentId}', height: nextHeight }, '*');
        }
      };

      var academyItemId = (function() {
        try {
          return new URLSearchParams(window.location.search).get('academyItemId') || '';
        } catch (_error) {
          return '';
        }
      })();

      var postXapi = function(payload) {
        try {
          fetch('${xapiUrl}', {
            method: 'POST',
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
        } catch (_error) {
        }
      };

      var subscribe = function() {
        if (!window.H5P || !H5P.externalDispatcher || typeof H5P.externalDispatcher.on !== 'function') {
          window.setTimeout(subscribe, 250);
          return;
        }

        H5P.externalDispatcher.on('xAPI', function(event) {
          var statement = event && event.data && event.data.statement ? event.data.statement : (event && event.statement ? event.statement : null);
          var verbId = statement && statement.verb ? statement.verb.id : '';
          var verbDisplay = statement && statement.verb && statement.verb.display
            ? (statement.verb.display['en-US'] || statement.verb.display.en || verbId)
            : verbId;

          postXapi({
            contentId: '${contentId}',
            academyItemId: academyItemId,
            verb: verbDisplay || verbId || 'unknown',
            statement: statement || {},
            result: statement && statement.result ? statement.result : {}
          });
          sendHeight();
        });

        H5P.externalDispatcher.on('resize', sendHeight);
        H5P.externalDispatcher.on('domChanged', sendHeight);
        sendHeight();
      };

      updatePlayerChrome();
      new MutationObserver(sendHeight).observe(document.body, { childList: true, subtree: true, attributes: true });
      window.addEventListener('load', sendHeight);
      window.addEventListener('resize', sendHeight);
      window.setInterval(sendHeight, 1500);
      subscribe();
    })();
  </script>
</body>
</html>`;
}

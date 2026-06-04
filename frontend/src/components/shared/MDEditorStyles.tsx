export function MDEditorStyles() {
  return (
    <style>{`
      .playdex-editor .w-md-editor {
        background-color: #1A1A1A !important;
        border: 1px solid #4B5563 !important;
        border-radius: 6px !important;
        color: #F0F0F0 !important;
        box-shadow: none !important;
        min-height: 500px !important;
      }
      .playdex-editor .w-md-editor-toolbar {
        background-color: #2D2D2D !important;
        border-bottom: 1px solid #4B5563 !important;
        padding: 4px 8px !important;
      }
      .playdex-editor .w-md-editor-toolbar li button {
        color: #9CA3AF !important;
      }
      .playdex-editor .w-md-editor-toolbar li button:hover {
        color: #F0F0F0 !important;
        background-color: #374151 !important;
      }
      .playdex-editor .w-md-editor-toolbar-divider {
        background-color: #4B5563 !important;
      }
      .playdex-editor .w-md-editor-text-textarea,
      .playdex-editor .w-md-editor-text-pre > code,
      .playdex-editor .w-md-editor-text {
        background-color: #1A1A1A !important;
        color: #F0F0F0 !important;
        font-size: 14px !important;
        caret-color: #F0F0F0 !important;
      }
      .playdex-editor .w-md-editor-preview {
        background-color: #1A1A1A !important;
        color: #F0F0F0 !important;
        border-left: 1px solid #4B5563 !important;
      }
      .playdex-editor .w-md-editor-preview .wmde-markdown {
        background-color: transparent !important;
        color: #F0F0F0 !important;
        font-size: 14px !important;
      }
      .playdex-editor .w-md-editor-preview .wmde-markdown a {
        color: #7173FF !important;
      }
      .playdex-editor .w-md-editor-preview .wmde-markdown code {
        background-color: #2D2D2D !important;
        color: #F0F0F0 !important;
      }
      .playdex-editor .w-md-editor-preview .wmde-markdown blockquote {
        border-left-color: #4D40FF !important;
        color: #9CA3AF !important;
      }
      .playdex-editor .w-md-editor:focus-within {
        border-color: #4D40FF !important;
      }
    `}</style>
  );
}

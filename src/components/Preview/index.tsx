import { useMemo, useRef } from "react";

const genIframeTemplate = (props: {
  importmap: any;
  code: string;
  componentName: string;
}) => {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Document</title>
    <script type="importmap">
      ${JSON.stringify(props.importmap)}
    </script>
  </head>
  <body>
    <div id="root"></div>
    <script type="module">
      import {createRoot} from "react-dom/client";
      ${props.code}
      const root = createRoot(document.getElementById("root"));
      root.render(React.createElement(${props.componentName}, null));
    </script>
  </body>
</html>
`;
};

export interface PreviewProps {
  importmap: {
    imports: Record<string, string>;
  };
  code: string;
  componentName: string;
}
export const Preview: React.FC<PreviewProps> = (props) => {
  const { importmap, code, componentName } = props;
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const iframeUrl = useMemo(() => {
    return URL.createObjectURL(
      new Blob([genIframeTemplate({ importmap, code, componentName })], {
        type: "text/html",
      })
    );
  }, [importmap, code]);

  return (
    <>
      <iframe
        key="preview-iframe"
        ref={iframeRef}
        src={iframeUrl}
        style={{
          width: "100%",
          height: "100%",
          padding: 0,
          border: "none",
        }}
        sandbox="allow-popups-to-escape-sandbox allow-scripts allow-popups allow-forms allow-pointer-lock allow-top-navigation allow-modals allow-same-origin"
      />
    </>
  );
};

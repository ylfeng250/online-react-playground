import { useMemo, useRef, useEffect } from "react";
import { debounce } from "lodash";

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
    <style>
      * {
        transition: all 0.2s ease-in-out;
      }
    </style>
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
  const prevUrlRef = useRef<string>();

  const updateIframe = useMemo(
    () =>
      debounce((content: string) => {
        if (iframeRef.current?.contentWindow) {
          const blob = new Blob([content], { type: "text/html" });
          const url = URL.createObjectURL(blob);
          
          if (prevUrlRef.current) {
            URL.revokeObjectURL(prevUrlRef.current);
          }
          
          iframeRef.current.src = url;
          prevUrlRef.current = url;
        }
      }, 300),
    []
  );

  useEffect(() => {
    const content = genIframeTemplate({ importmap, code, componentName });
    updateIframe(content);
  }, [importmap, code, componentName, updateIframe]);

  useEffect(() => {
    return () => {
      if (prevUrlRef.current) {
        URL.revokeObjectURL(prevUrlRef.current);
      }
    };
  }, []);

  return (
    <>
      <iframe
        ref={iframeRef}
        style={{
          width: "100%",
          height: "100%",
          padding: 0,
          border: "none",
          transition: "opacity 0.2s ease-in-out",
        }}
        sandbox="allow-popups-to-escape-sandbox allow-scripts allow-popups allow-forms allow-pointer-lock allow-top-navigation allow-modals allow-same-origin"
      />
    </>
  );
};

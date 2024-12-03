import { useMemo, useRef, useEffect } from "react";
import { debounce } from "lodash";

const genIframeTemplate = (code: string) => {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>React Playground</title>
    <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
    <style>
      * {
        transition: all 0.2s ease-in-out;
      }
    </style>
  </head>
  <body>
    <div id="root"></div>
    <script type="module">
      ${code}
    </script>
  </body>
</html>
`;
};

export interface PreviewProps {
  code: string;
}

export const Preview: React.FC<PreviewProps> = ({ code }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const prevUrlRef = useRef<string>();
console.log(code);
  const updateIframe = useMemo(
    () =>
      debounce(() => {
        if (iframeRef.current) {
          const template = genIframeTemplate(code);
          const blob = new Blob([template], { type: "text/html" });
          const url = URL.createObjectURL(blob);
          
          if (prevUrlRef.current) {
            URL.revokeObjectURL(prevUrlRef.current);
          }
          
          prevUrlRef.current = url;
          iframeRef.current.src = url;
        }
      }, 1000),
    [code]
  );

  useEffect(() => {
    updateIframe();
    return () => {
      updateIframe.cancel();
      if (prevUrlRef.current) {
        URL.revokeObjectURL(prevUrlRef.current);
      }
    };
  }, [updateIframe]);

  return (
    <iframe
      ref={iframeRef}
      style={{
        width: "100%",
        height: "100%",
        border: "none",
        backgroundColor: "white",
      }}
      title="preview"
      sandbox="allow-scripts allow-same-origin"
    />
  );
};

import { useState } from "react";
import "./Component.css";
import { Button } from "antd";

function Component() {
  const [count, setCount] = useState(0);

  return (
    <>
      <h1>Hello World</h1>
      <div className="card">
        <Button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </Button>
      </div>
    </>
  );
}

export default Component;

import { useState } from "react";
import "./CustomButton.css";
import { Button } from "antd";

function CustomButton() {
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

export default CustomButton;

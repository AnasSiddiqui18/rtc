import { Receiver } from "./receiver";
import { Sender } from "./sender";
import { useSearchParams } from "react-router-dom";

function App() {
  const [searcParams] = useSearchParams();

  if (searcParams.get("label") === "sender") return <Sender />;
  if (searcParams.get("label") === "receiver") return <Receiver />;

  return <>Please specify a label</>;
}

export default App;

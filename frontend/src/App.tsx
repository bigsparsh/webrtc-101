import { BrowserRouter, Route, Routes } from "react-router-dom";
import Lobby from "./components/Lobby";

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Lobby />} />
      </Routes>
    </BrowserRouter>
  );
};
export default App;

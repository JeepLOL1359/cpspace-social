import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainLayout from "./pages/mainLayout";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Wrap everything with MainLayout */}
        <Route path="/*" element={<MainLayout />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

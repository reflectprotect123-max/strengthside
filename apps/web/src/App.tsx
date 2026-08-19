import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Bench } from './Bench';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/bench" element={<Bench />} />
        <Route path="*" element={<Navigate to="/bench" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

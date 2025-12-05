import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Terminal from './components/Terminal';
import RoomScene from './components/RoomScene';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Terminal />} />
        <Route path="/old" element={<RoomScene />} />
      </Routes>
    </BrowserRouter>
  );
}

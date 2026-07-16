import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './layouts/DashboardLayout';
import Dashboard from './pages/Dashboard';
import UploadPDF from './pages/UploadPDF';
import ProcessingQueue from './pages/ProcessingQueue';
import ImportedPDFs from './pages/ImportedPDFs';
import VoterList from './pages/VoterList';
import VoterDetails from './pages/VoterDetails';
import TemplateEditor from './pages/TemplateEditor';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="upload" element={<UploadPDF />} />
          <Route path="queue" element={<ProcessingQueue />} />
          <Route path="pdfs" element={<ImportedPDFs />} />
          <Route path="voters" element={<VoterList />} />
          <Route path="voters/:id" element={<VoterDetails />} />
          <Route path="settings" element={<TemplateEditor />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;

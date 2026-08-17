import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';
import Dashboard from './pages/Dashboard';
import UploadPDF from './pages/UploadPDF';
import ProcessingQueue from './pages/ProcessingQueue';
import ImportedPDFs from './pages/ImportedPDFs';
import VoterList from './pages/VoterList';
import VoterDetails from './pages/VoterDetails';
import TemplateEditor from './pages/TemplateEditor';
import Login from './pages/Login';
import CreateEmployee from './pages/CreateEmployee';
import EmployeeDashboard from './pages/EmployeeDashboard';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          {/* Admin Routes */}
          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route path="/" element={<DashboardLayout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="upload" element={<UploadPDF />} />
              <Route path="queue" element={<ProcessingQueue />} />
              <Route path="pdfs" element={<ImportedPDFs />} />
              <Route path="voters" element={<VoterList />} />
              <Route path="voters/:id" element={<VoterDetails />} />
              <Route path="settings" element={<TemplateEditor />} />
              <Route path="create-employee" element={<CreateEmployee />} />
            </Route>
          </Route>

          {/* Employee Routes */}
          <Route element={<ProtectedRoute allowedRoles={['employee']} />}>
            <Route path="/employee-dashboard" element={<EmployeeDashboard />} />
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

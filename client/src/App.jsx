import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';
import Dashboard from './pages/Dashboard';
import DataExtraction from './pages/DataExtraction';
import VoterList from './pages/VoterList';
import VoterDetails from './pages/VoterDetails';
import TemplateEditor from './pages/TemplateEditor';
import Login from './pages/Login';
import EmployeeManagement from './pages/EmployeeManagement';
import EmployeeDashboard from './pages/EmployeeDashboard';
import HierarchyManager from './pages/HierarchyManager';

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
              <Route path="extraction" element={<DataExtraction />} />
              <Route path="voters" element={<VoterList />} />
              <Route path="voters/:id" element={<VoterDetails />} />
              {/* <Route path="settings" element={<TemplateEditor />} /> */}
              <Route path="employees" element={<EmployeeManagement />} />
              <Route path="hierarchy" element={<HierarchyManager />} />
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

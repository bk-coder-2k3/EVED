import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';
import EmployeeLayout from './layouts/EmployeeLayout';
import Dashboard from './pages/admin/Dashboard';
import DataExtraction from './pages/admin/DataExtraction';
import VoterList from './pages/admin/VoterList';
import VoterDetails from './pages/admin/VoterDetails';
import TemplateEditor from './pages/admin/TemplateEditor';
import Login from './pages/Login';
import EmployeeManagement from './pages/admin/EmployeeManagement';
import HierarchyManager from './pages/admin/HierarchyManager';
import Profile from './pages/admin/Profile';
import EmployeeDashboard from './pages/employee/EmployeeDashboard';
import EmployeeVoters from './pages/employee/EmployeeVoters';
import EmployeeProfile from './pages/employee/EmployeeProfile';

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
              <Route path="employees" element={<EmployeeManagement />} />
              <Route path="hierarchy" element={<HierarchyManager />} />
              <Route path="profile" element={<Profile />} />
            </Route>
          </Route>

          {/* Employee Routes */}
          <Route element={<ProtectedRoute allowedRoles={['employee']} />}>
            <Route path="/" element={<EmployeeLayout />}>
              <Route path="employee-dashboard" element={<EmployeeDashboard />} />
              <Route path="employee-voters" element={<EmployeeVoters />} />
              <Route path="employee-profile" element={<EmployeeProfile />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

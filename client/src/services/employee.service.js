import { api } from '../api.js';

export const employeeService = {
  // Get all employees for the current tenant
  async getEmployees() {
    return await api('/api/employees');
  },

  // Create a new employee
  async createEmployee(employeeData) {
    return await api('/api/employees', {
      method: 'POST',
      body: JSON.stringify(employeeData),
    });
  },

  // Update an employee
  async updateEmployee(employeeId, employeeData) {
    return await api(`/api/employees/${employeeId}`, {
      method: 'PUT',
      body: JSON.stringify(employeeData),
    });
  },

  // Delete an employee
  async deleteEmployee(employeeId) {
    return await api(`/api/employees/${employeeId}`, {
      method: 'DELETE',
    });
  },

  // Get employee by ID
  async getEmployeeById(employeeId) {
    return await api(`/api/employees/${employeeId}`);
  }
};

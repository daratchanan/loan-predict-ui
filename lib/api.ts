// ============================================
// lib/api.ts
// ไฟล์สำหรับจัดการ API calls
// ============================================

const API_BASE_URL = 'http://127.0.0.1:8000';

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface User {
  username: string;
  id: number;
  is_active: boolean;
  roles: Array<{
    name: string;
    description: string;
    id: number;
  }>;
}

export interface LoanApplication {
  credit_policy: number;
  purpose: string;
  int_rate: number;
  installment: number;
  log_annual_inc: number;
  dti: number;
  fico: number;
  days_with_cr_line: number;
  revol_bal: number;
  revol_util: number;
  inq_last_6mths: number;
  delinq_2yrs: number;
  pub_rec: number;
}

export interface PredictionResponse {
  prediction: string;
  probability: number;
  fico_score: number;
  interest_rate: number;
  explanation: Record<string, number>;
}

export const api = {
  async login(credentials: LoginCredentials): Promise<TokenResponse> {
    const formData = new URLSearchParams();
    formData.append('username', credentials.username);
    formData.append('password', credentials.password);

    const response = await fetch(`${API_BASE_URL}/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
    }

    return response.json();
  },

  async getCurrentUser(token: string): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/users/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('ไม่สามารถดึงข้อมูลผู้ใช้ได้');
    }

    return response.json();
  },

  async submitApplication(token: string, data: LoanApplication): Promise<PredictionResponse> {
    const response = await fetch(`${API_BASE_URL}/applications`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('ไม่สามารถส่งใบสมัครได้');
    }

    return response.json();
  },

  async getDashboard(token: string, params?: Record<string, any>) {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    const response = await fetch(`${API_BASE_URL}/dashboard${queryString}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('ไม่สามารถดึงข้อมูล Dashboard ได้');
    }

    return response.json();
  },

  async retrainModel(token: string) {
    const response = await fetch(`${API_BASE_URL}/retrain`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('ไม่สามารถเริ่ม Retrain Model ได้');
    }

    return response.json();
  },

  async getModelPerformance(token: string) {
    const response = await fetch(`${API_BASE_URL}/model-performance`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('ไม่สามารถดึงข้อมูล Model Performance ได้');
    }

    return response.json();
  },
};
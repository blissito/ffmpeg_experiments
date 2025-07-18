// Legacy interfaces - use schemas from ../schemas/user.ts for validation
export interface User {
  id: string;
  email: string;
  createdAt: Date;
  subscription: "free" | "premium";
  usageQuota: {
    videosProcessed: number;
    monthlyLimit: number;
    resetDate: Date;
  };
}

export interface UserRegistration {
  email: string;
  password: string;
}

export interface UserLogin {
  email: string;
  password: string;
}

// Common types used throughout the application

export type PropertyType =
  | 'mansion'      // 1棟マンション
  | 'apartment'    // 1棟アパート
  | 'building'     // 1棟ビル
  | 'condominium'  // 区分マンション
  | 'house'        // 戸建て
  | 'terrace';     // テラスハウス

export type SubscriptionPlan = 'free' | 'standard' | 'premium';

export interface User {
  id: string;
  email: string;
  name?: string;
  subscriptionPlan: SubscriptionPlan;
  createdAt: Date;
  updatedAt: Date;
}

export interface Property {
  id: string;
  userId: string;
  propertyType: PropertyType;
  address: string;
  price: number;
  size: number;
  landSize?: number;
  buildingAge?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CalculationResult {
  id: string;
  propertyId: string;
  grossYield: number;      // 表面利回り
  netYield: number;        // 実質利回り
  cashFlow: number;        // キャッシュフロー
  ccr?: number;            // 自己資金配当率
  propertyTax?: number;    // 固定資産税
  createdAt: Date;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: unknown;
}

export interface ApiResponse<T> {
  data?: T;
  error?: ApiError;
  success: boolean;
}

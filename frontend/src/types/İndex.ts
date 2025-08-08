export * from './User';
export * from './Product';
export * from './Cart';
export * from './Order';
export * from './Category';

export interface ApiResponse<T> {
    success: boolean;
    count?: number;
    total?: number;
    pagination?: any;
    data: T;
}
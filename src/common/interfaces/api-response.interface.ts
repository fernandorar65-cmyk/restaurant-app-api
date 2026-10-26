export interface ApiResponse<T = unknown> {
  success: boolean;
  statusCode: number;
  /** Only on errors: stable code such as PRODUCT_NOT_ORDERABLE. */
  errorCode?: string;
  message: string;
  data: T;
  timestamp: string;
  path: string;
}

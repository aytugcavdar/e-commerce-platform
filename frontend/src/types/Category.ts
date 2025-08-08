export interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  parent?: string | null;
  user: string;
  createdAt: string;
  updatedAt: string;
}
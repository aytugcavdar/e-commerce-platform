export interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  images: {
    public_id: string;
    url: string;
  }[];
  category: {
    _id: string;
    name: string;
    slug: string;
  };
  stock: number;
  averageRating: number;
  createdAt: string;
  updatedAt: string;
}
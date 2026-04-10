import { collection, addDoc, Timestamp, getDocs, query, where } from 'firebase/firestore';
import { db } from './firebase';

const demoCategories = [
  { name: 'Smartphones', slug: 'smartphones' },
  { name: 'Laptops', slug: 'laptops' },
  { name: 'Accessories', slug: 'accessories' },
  { name: 'Audio', slug: 'audio' }
];

const demoBrands = [
  { name: 'Apple', slug: 'apple' },
  { name: 'Samsung', slug: 'samsung' },
  { name: 'Sony', slug: 'sony' },
  { name: 'Dell', slug: 'dell' }
];

const demoProducts = [
  {
    name: 'iPhone 15 Pro',
    description: 'The latest iPhone with titanium design and A17 Pro chip.',
    price: 999,
    image: 'https://picsum.photos/seed/iphone15/800/800',
    category: 'Smartphones',
    brand: 'Apple',
    is_featured: true
  },
  {
    name: 'Galaxy S24 Ultra',
    description: 'Powerful Android smartphone with AI features and S-Pen.',
    price: 1199,
    image: 'https://picsum.photos/seed/s24ultra/800/800',
    category: 'Smartphones',
    brand: 'Samsung',
    is_featured: true
  },
  {
    name: 'MacBook Pro 14"',
    description: 'M3 chip powered laptop for professionals.',
    price: 1599,
    image: 'https://picsum.photos/seed/macbook/800/800',
    category: 'Laptops',
    brand: 'Apple',
    is_featured: true
  },
  {
    name: 'Sony WH-1000XM5',
    description: 'Industry-leading noise cancelling headphones.',
    price: 349,
    image: 'https://picsum.photos/seed/sonyheadphones/800/800',
    category: 'Audio',
    brand: 'Sony',
    is_featured: false
  },
  {
    name: 'Dell XPS 15',
    description: 'Stunning display and powerful performance in a compact design.',
    price: 1299,
    image: 'https://picsum.photos/seed/dellxps/800/800',
    category: 'Laptops',
    brand: 'Dell',
    is_featured: false
  }
];

const demoShippingAreas = [
  { name: 'Dhaka City', cost: 60 },
  { name: 'Outside Dhaka', cost: 120 }
];

export const seedDemoData = async () => {
  console.log('Starting demo data seeding...');

  try {
    // 1. Seed Categories
    const catSnap = await getDocs(collection(db, 'categories'));
    if (catSnap.empty) {
      for (const cat of demoCategories) {
        await addDoc(collection(db, 'categories'), { ...cat, created_at: Timestamp.now() });
      }
      console.log('Categories seeded.');
    }

    // 2. Seed Brands
    const brandSnap = await getDocs(collection(db, 'brands'));
    if (brandSnap.empty) {
      for (const brand of demoBrands) {
        await addDoc(collection(db, 'brands'), { ...brand, created_at: Timestamp.now() });
      }
      console.log('Brands seeded.');
    }

    // 3. Seed Products
    const prodSnap = await getDocs(collection(db, 'products'));
    if (prodSnap.empty) {
      for (const prod of demoProducts) {
        await addDoc(collection(db, 'products'), { ...prod, created_at: Timestamp.now() });
      }
      console.log('Products seeded.');
    }

    // 4. Seed Shipping Areas
    const shipSnap = await getDocs(collection(db, 'shipping_areas'));
    if (shipSnap.empty) {
      for (const area of demoShippingAreas) {
        await addDoc(collection(db, 'shipping_areas'), { ...area, created_at: Timestamp.now() });
      }
      console.log('Shipping areas seeded.');
    }

    console.log('Demo data seeding completed successfully.');
  } catch (error) {
    console.error('Error seeding demo data:', error);
  }
};

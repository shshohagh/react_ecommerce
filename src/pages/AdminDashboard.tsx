import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Papa from 'papaparse';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, listAll, deleteObject, getMetadata } from 'firebase/storage';
import { db, storage } from '../firebase';
import { Product, Order, Review, Category, Brand, Attribute, AttributeValue, ProductVariation, ShippingArea } from '../types';
import { formatPrice } from '../lib/utils';
import {
  Plus,
  Package,
  ClipboardList,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  Truck,
  X,
  LayoutDashboard,
  Star,
  Search,
  Filter,
  LogOut,
  Menu,
  ChevronRight,
  ChevronDown,
  Upload,
  Image as ImageIcon,
  File,
  HardDrive,
  Copy,
  ExternalLink,
  Tags,
  Globe
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { motion, AnimatePresence } from 'motion/react';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'products' | 'orders' | 'reviews' | 'file-manager' | 'categories' | 'brands' | 'attributes' | 'shipping-areas'>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isDashboardSubMenuOpen, setIsDashboardSubMenuOpen] = useState(false);
  const [isProductsSubMenuOpen, setIsProductsSubMenuOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [reviews, setReviews] = useState<(Review & { product_name?: string })[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [attributeValues, setAttributeValues] = useState<AttributeValue[]>([]);
  const [shippingAreas, setShippingAreas] = useState<ShippingArea[]>([]);
  const [variations, setVariations] = useState<ProductVariation[]>([]);
  const [files, setFiles] = useState<{ name: string; size: number; created_at: string; url: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<'basic' | 'variations'>('basic');
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);
  const [isAttributeModalOpen, setIsAttributeModalOpen] = useState(false);
  const [isAttributeValueModalOpen, setIsAttributeValueModalOpen] = useState(false);
  const [isShippingAreaModalOpen, setIsShippingAreaModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [editingAttribute, setEditingAttribute] = useState<Attribute | null>(null);
  const [editingShippingArea, setEditingShippingArea] = useState<ShippingArea | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { user, firebaseUser, logout, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/admin/login');
    }
  }, [user, authLoading, navigate]);

  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    image: '',
    category: 'Uncategorized',
    brand: 'No Brand',
    attributes: {} as Record<string, string>,
    is_featured: false
  });

  const [categoryForm, setCategoryForm] = useState({
    name: '',
    slug: ''
  });

  const [brandForm, setBrandForm] = useState({
    name: '',
    slug: ''
  });

  const [shippingAreaForm, setShippingAreaForm] = useState({
    name: '',
    cost: ''
  });

  const [attributeForm, setAttributeForm] = useState({
    name: '',
    slug: ''
  });

  const [attributeValueForm, setAttributeValueForm] = useState({
    attribute_id: '',
    value: ''
  });
  const [variationForm, setVariationForm] = useState({
    attributes: {} as Record<string, string>,
    quantity: ''
  });

  const fetchVariations = async (productId: string) => {
    try {
      const q = query(collection(db, 'product_variations'), orderBy('created_at', 'desc'));
      const snap = await getDocs(q);
      const allVariations = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ProductVariation));
      setVariations(allVariations.filter(v => v.product_id === productId));
    } catch (err) {
      console.error('Failed to fetch variations:', err);
    }
  };

  const handleVariationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    try {
      await addDoc(collection(db, 'product_variations'), {
        product_id: editingProduct.id,
        attributes: JSON.stringify(variationForm.attributes),
        quantity: parseInt(variationForm.quantity as string),
        created_at: Timestamp.now()
      });
      setVariationForm({ attributes: {}, quantity: '' });
      fetchVariations(editingProduct.id);
    } catch (err) {
      console.error(err);
    }
  };

  const deleteVariation = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this variation?')) return;
    try {
      await deleteDoc(doc(db, 'product_variations', id));
      if (editingProduct) fetchVariations(editingProduct.id);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchFiles = async () => {
    try {
      const storageRef = ref(storage, 'uploads');
      const res = await listAll(storageRef);
      const fileData = await Promise.all(
        res.items.map(async (item) => {
          const url = await getDownloadURL(item);
          const metadata = await getMetadata(item);
          return {
            name: item.name,
            size: metadata.size,
            created_at: metadata.timeCreated,
            url: url
          };
        })
      );
      setFiles(fileData.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
    } catch (err) {
      console.error('Failed to fetch files:', err);
    }
  };

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [prodSnap, orderSnap, reviewSnap, catSnap, brandSnap, attrSnap, attrValSnap, shipSnap] = await Promise.all([
        getDocs(query(collection(db, 'products'), orderBy('created_at', 'desc'))),
        getDocs(query(collection(db, 'orders'), orderBy('created_at', 'desc'))),
        getDocs(query(collection(db, 'reviews'), orderBy('created_at', 'desc'))),
        getDocs(query(collection(db, 'categories'), orderBy('created_at', 'desc'))),
        getDocs(query(collection(db, 'brands'), orderBy('created_at', 'desc'))),
        getDocs(query(collection(db, 'attributes'), orderBy('created_at', 'desc'))),
        getDocs(query(collection(db, 'attribute_values'), orderBy('created_at', 'desc'))),
        getDocs(query(collection(db, 'shipping_areas'), orderBy('name', 'asc')))
      ]);

      setProducts(prodSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
      setOrders(orderSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order)));
      setReviews(reviewSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review)));
      setCategories(catSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category)));
      setBrands(brandSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Brand)));
      setAttributes(attrSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Attribute)));
      setAttributeValues(attrValSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as AttributeValue)));
      setShippingAreas(shipSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ShippingArea)));
      
      await fetchFiles();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleShippingAreaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        name: shippingAreaForm.name,
        cost: parseFloat(shippingAreaForm.cost)
      };

      if (editingShippingArea) {
        await updateDoc(doc(db, 'shipping_areas', editingShippingArea.id), data);
      } else {
        await addDoc(collection(db, 'shipping_areas'), data);
      }
      setIsShippingAreaModalOpen(false);
      setEditingShippingArea(null);
      setShippingAreaForm({ name: '', cost: '' });
      fetchAll();
    } catch (err) {
      console.error(err);
      alert('Failed to save shipping area');
    }
  };

  const deleteShippingArea = async (id: string) => {
    if (!confirm('Are you sure you want to delete this shipping area?')) return;
    try {
      await deleteDoc(doc(db, 'shipping_areas', id));
      fetchAll();
    } catch (err) {
      console.error(err);
      alert('Failed to delete shipping area');
    }
  };

  const openShippingAreaModal = (area?: ShippingArea) => {
    if (area) {
      setEditingShippingArea(area);
      setShippingAreaForm({ name: area.name, cost: area.cost.toString() });
    } else {
      setEditingShippingArea(null);
      setShippingAreaForm({ name: '', cost: '' });
    }
    setIsShippingAreaModalOpen(true);
  };

  useEffect(() => {
    if (user) {
      fetchAll();
    }
  }, [user]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB');
      return;
    }

    try {
      const storageRef = ref(storage, `products/${Date.now()}-${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setProductForm({ ...productForm, image: url });
    } catch (err) {
      console.error('Image upload failed:', err);
      alert('Image upload failed');
    }
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.image) {
      alert('Please upload a product image');
      return;
    }
    const method = editingProduct ? 'PUT' : 'POST';
    const url = editingProduct
      ? `/api/admin/products/${editingProduct.id}`
      : '/api/admin/products';

    try {
      if (editingProduct) {
        await updateDoc(doc(db, 'products', editingProduct.id), {
          ...productForm,
          price: parseFloat(productForm.price as string),
          attributes: JSON.stringify(productForm.attributes)
        });
      } else {
        await addDoc(collection(db, 'products'), {
          ...productForm,
          price: parseFloat(productForm.price as string),
          attributes: JSON.stringify(productForm.attributes),
          created_at: Timestamp.now()
        });
      }

      setIsModalOpen(false);
      setEditingProduct(null);
      setProductForm({ 
        name: '', 
        description: '', 
        price: '', 
        image: '', 
        category: 'Uncategorized', 
        brand: 'No Brand',
        attributes: {},
        is_featured: false 
      });
      fetchAll();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteReview = async (id: string) => {
    if (!confirm('Are you sure you want to delete this review?')) return;
    try {
      await deleteDoc(doc(db, 'reviews', id));
      fetchAll();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteCategory = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    try {
      await deleteDoc(doc(db, 'categories', id));
      fetchAll();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteBrand = async (id: string) => {
    if (!confirm('Are you sure you want to delete this brand?')) return;
    try {
      await deleteDoc(doc(db, 'brands', id));
      fetchAll();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteAttribute = async (id: string) => {
    if (!confirm('Are you sure you want to delete this attribute?')) return;
    try {
      await deleteDoc(doc(db, 'attributes', id));
      fetchAll();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteAttributeValue = async (id: string) => {
    if (!confirm('Are you sure you want to delete this value?')) return;
    try {
      await deleteDoc(doc(db, 'attribute_values', id));
      fetchAll();
    } catch (err) {
      console.error(err);
    }
  };

  const openCategoryModal = (category: Category | null = null) => {
    if (category) {
      setEditingCategory(category);
      setCategoryForm({
        name: category.name,
        slug: category.slug
      });
    } else {
      setEditingCategory(null);
      setCategoryForm({
        name: '',
        slug: ''
      });
    }
    setIsCategoryModalOpen(true);
  };

  const openBrandModal = (brand: Brand | null = null) => {
    if (brand) {
      setEditingBrand(brand);
      setBrandForm({
        name: brand.name,
        slug: brand.slug
      });
    } else {
      setEditingBrand(null);
      setBrandForm({
        name: '',
        slug: ''
      });
    }
    setIsBrandModalOpen(true);
  };

  const openAttributeModal = (attribute: Attribute | null = null) => {
    if (attribute) {
      setEditingAttribute(attribute);
      setAttributeForm({
        name: attribute.name,
        slug: attribute.slug
      });
    } else {
      setEditingAttribute(null);
      setAttributeForm({
        name: '',
        slug: ''
      });
    }
    setIsAttributeModalOpen(true);
  };

  const openAttributeValueModal = (attributeId: string) => {
    setAttributeValueForm({
      attribute_id: attributeId,
      value: ''
    });
    setIsAttributeValueModalOpen(true);
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await updateDoc(doc(db, 'categories', editingCategory.id), categoryForm);
      } else {
        await addDoc(collection(db, 'categories'), {
          ...categoryForm,
          created_at: Timestamp.now()
        });
      }
      setIsCategoryModalOpen(false);
      setEditingCategory(null);
      setCategoryForm({ name: '', slug: '' });
      fetchAll();
    } catch (err) {
      console.error(err);
    }
  };

  const handleBrandSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingBrand) {
        await updateDoc(doc(db, 'brands', editingBrand.id), brandForm);
      } else {
        await addDoc(collection(db, 'brands'), {
          ...brandForm,
          created_at: Timestamp.now()
        });
      }
      setIsBrandModalOpen(false);
      setEditingBrand(null);
      setBrandForm({ name: '', slug: '' });
      fetchAll();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAttributeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingAttribute) {
        await updateDoc(doc(db, 'attributes', editingAttribute.id), attributeForm);
      } else {
        await addDoc(collection(db, 'attributes'), {
          ...attributeForm,
          created_at: Timestamp.now()
        });
      }
      setIsAttributeModalOpen(false);
      setEditingAttribute(null);
      setAttributeForm({ name: '', slug: '' });
      fetchAll();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAttributeValueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'attribute_values'), {
        ...attributeValueForm,
        created_at: Timestamp.now()
      });
      setIsAttributeValueModalOpen(false);
      setAttributeValueForm({ attribute_id: '', value: '' });
      fetchAll();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteFile = async (filename: string) => {
    if (!confirm('Are you sure you want to delete this file?')) return;
    try {
      const fileRef = ref(storage, `uploads/${filename}`);
      await deleteObject(fileRef);
      await fetchFiles();
    } catch (err) {
      console.error('Failed to delete file:', err);
      alert('Failed to delete file');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const storageRef = ref(storage, `uploads/${Date.now()}-${file.name}`);
      await uploadBytes(storageRef, file);
      await fetchFiles();
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Upload failed');
    }
  };

  const deleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      await deleteDoc(doc(db, 'products', id));
      fetchAll();
    } catch (err) {
      console.error(err);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedProductIds.length === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedProductIds.length} products?`)) return;

    try {
      await Promise.all(selectedProductIds.map(id => deleteDoc(doc(db, 'products', id))));
      setSelectedProductIds([]);
      fetchAll();
    } catch (err) {
      console.error(err);
      alert('An error occurred during bulk deletion.');
    }
  };

  const toggleProductSelection = (id: string) => {
    setSelectedProductIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleAllProducts = () => {
    if (selectedProductIds.length === filteredProducts.length) {
      setSelectedProductIds([]);
    } else {
      setSelectedProductIds(filteredProducts.map(p => p.id));
    }
  };

  const updateOrderStatus = async (id: string, status: string) => {
    try {
      await updateDoc(doc(db, 'orders', id), { status });
      fetchAll();
    } catch (err) {
      console.error(err);
    }
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setModalTab('basic');
    fetchVariations(product.id);
    let parsedAttributes = {};
    try {
      if (product.attributes) {
        parsedAttributes = typeof product.attributes === 'string' ? JSON.parse(product.attributes) : product.attributes;
      }
    } catch (e) {
      console.error("Failed to parse attributes", e);
    }

    setProductForm({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      image: product.image,
      category: product.category || 'Uncategorized',
      brand: product.brand || 'No Brand',
      attributes: parsedAttributes,
      is_featured: product.is_featured
    });
    setIsModalOpen(true);
  };

  const handleCsvImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const importedData = results.data.map((row: any) => ({
          name: row.name,
          description: row.description,
          price: parseFloat(row.price),
          image: row.image,
          category: row.category || 'Uncategorized',
          brand: row.brand || 'No Brand',
          is_featured: row.is_featured === 'true' || row.is_featured === '1',
          created_at: Timestamp.now()
        }));

        const validData = importedData.filter((p: any) => p.name && !isNaN(p.price));

        if (validData.length === 0) {
          alert('No valid products found in CSV.');
          return;
        }

        try {
          await Promise.all(validData.map(p => addDoc(collection(db, 'products'), p)));
          alert(`Successfully imported ${validData.length} products!`);
          fetchAll();
        } catch (err) {
          console.error(err);
          alert('An error occurred during import.');
        }
      }
    });
    
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || product.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categoryOptions = ['All', ...Array.from(new Set(products.map(p => p.category || 'Uncategorized')))];

  const stockImages = [
    { name: 'Electronics', url: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=800&q=80' },
    { name: 'Fashion', url: 'https://images.unsplash.com/photo-1445205170230-053b830c6050?w=800&q=80' },
    { name: 'Home', url: 'https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=800&q=80' },
    { name: 'Accessories', url: 'https://images.unsplash.com/photo-1547949003-9792a18a2601?w=800&q=80' },
    { name: 'Gadgets', url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80' },
    { name: 'Shoes', url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80' },
    { name: 'Watch', url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80' },
    { name: 'Camera', url: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&q=80' },
    { name: 'Headphones', url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80' },
    { name: 'Backpack', url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80' },
  ];

  const totalRevenue = orders
    .filter(o => o.status === 'delivered')
    .reduce((acc, o) => acc + (o.product_price || 0), 0);

  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-40 bg-white border-r border-gray-200 transition-all duration-300 ease-in-out shadow-sm ${
          isSidebarOpen ? 'w-72' : 'w-20'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="h-20 px-6 flex items-center justify-between border-b border-gray-50">
            {isSidebarOpen && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-3"
              >
                <div className="h-10 w-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
                  <Package className="h-6 w-6 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-900 tracking-tight">SwiftCart</span>
              </motion.div>
            )}
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className={`p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors ${!isSidebarOpen ? 'mx-auto' : ''}`}
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>

          {/* Sidebar Nav */}
          <div className="flex-grow py-8 px-4 space-y-1 overflow-y-auto">
            <div className={`px-4 mb-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest ${!isSidebarOpen ? 'text-center' : ''}`}>
              {isSidebarOpen ? 'Main Menu' : '•••'}
            </div>
            
            <div>
              <button
                onClick={() => {
                  if (activeTab !== 'dashboard' && activeTab !== 'categories') {
                    setActiveTab('dashboard');
                  }
                  setIsDashboardSubMenuOpen(!isDashboardSubMenuOpen);
                }}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all duration-300 ${
                  (activeTab === 'dashboard' || activeTab === 'categories') ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <LayoutDashboard className="h-5 w-5" />
                  {isSidebarOpen && <span className="font-bold">Dashboard</span>}
                </div>
                {isSidebarOpen && (
                  <motion.div
                    animate={{ rotate: isDashboardSubMenuOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </motion.div>
                )}
              </button>
              
              <AnimatePresence>
                {isDashboardSubMenuOpen && isSidebarOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden ml-4 mt-2 space-y-1"
                  >
                    <button
                      onClick={() => setActiveTab('dashboard')}
                      className={`w-full flex items-center gap-3 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                        activeTab === 'dashboard' ? 'text-indigo-600 bg-indigo-50' : 'text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      Overview
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            <div>
              <button
                onClick={() => {
                  if (activeTab !== 'products' && activeTab !== 'categories' && activeTab !== 'brands' && activeTab !== 'attributes') {
                    setActiveTab('products');
                  }
                  setIsProductsSubMenuOpen(!isProductsSubMenuOpen);
                }}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all duration-300 ${
                  (activeTab === 'products' || activeTab === 'categories' || activeTab === 'brands' || activeTab === 'attributes') ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Package className="h-5 w-5" />
                  {isSidebarOpen && <span className="font-bold">Products</span>}
                </div>
                {isSidebarOpen && (
                  <motion.div
                    animate={{ rotate: isProductsSubMenuOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </motion.div>
                )}
              </button>
              
              <AnimatePresence>
                {isProductsSubMenuOpen && isSidebarOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden ml-4 mt-2 space-y-1"
                  >
                    <button
                      onClick={() => setActiveTab('products')}
                      className={`w-full flex items-center gap-3 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                        activeTab === 'products' ? 'text-indigo-600 bg-indigo-50' : 'text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      <Package className="h-4 w-4" />
                      Products List
                    </button>
                    <button
                      onClick={() => setActiveTab('categories')}
                      className={`w-full flex items-center gap-3 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                        activeTab === 'categories' ? 'text-indigo-600 bg-indigo-50' : 'text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      <Tags className="h-4 w-4" />
                      Category
                    </button>
                    <button
                      onClick={() => setActiveTab('brands')}
                      className={`w-full flex items-center gap-3 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                        activeTab === 'brands' ? 'text-indigo-600 bg-indigo-50' : 'text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      <Star className="h-4 w-4" />
                      Brand
                    </button>
                    <button
                      onClick={() => setActiveTab('attributes')}
                      className={`w-full flex items-center gap-3 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                        activeTab === 'attributes' ? 'text-indigo-600 bg-indigo-50' : 'text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      <File className="h-4 w-4" />
                      Attributes
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            <SidebarItem 
              active={activeTab === 'orders'} 
              onClick={() => setActiveTab('orders')}
              icon={<ClipboardList className="h-5 w-5" />}
              label="Orders"
              isOpen={isSidebarOpen}
            />

            <div className={`px-4 mt-8 mb-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest ${!isSidebarOpen ? 'text-center' : ''}`}>
              {isSidebarOpen ? 'System' : '•••'}
            </div>

            <SidebarItem 
              active={activeTab === 'reviews'} 
              onClick={() => setActiveTab('reviews')}
              icon={<Star className="h-5 w-5" />}
              label="Reviews"
              isOpen={isSidebarOpen}
            />

            <SidebarItem 
              active={activeTab === 'file-manager'} 
              onClick={() => setActiveTab('file-manager')}
              icon={<HardDrive className="h-5 w-5" />}
              label="File Manager"
              isOpen={isSidebarOpen}
            />

            <SidebarItem 
              active={activeTab === 'shipping-areas'} 
              onClick={() => setActiveTab('shipping-areas')}
              icon={<Truck className="h-5 w-5" />}
              label="Shipping Areas"
              isOpen={isSidebarOpen}
            />
          </div>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-gray-100">
            <button
              onClick={handleLogout}
              className={`w-full flex items-center p-3 rounded-xl text-red-500 hover:bg-red-50 transition-all group ${!isSidebarOpen ? 'justify-center' : ''}`}
            >
              <LogOut className={`h-5 w-5 ${isSidebarOpen ? 'mr-3' : ''} group-hover:scale-110 transition-transform`} />
              {isSidebarOpen && <span className="font-bold">Logout</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-grow transition-all duration-300 ${isSidebarOpen ? 'ml-72' : 'ml-20'}`}>
        {/* Top Header */}
        <header className="h-20 bg-white border-b border-gray-200 flex items-center justify-between px-8 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-gray-900">
              {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 hover:text-indigo-600 transition-all flex items-center gap-2"
              title="Go to Website"
            >
              <Globe className="h-5 w-5" />
              <span className="text-sm font-bold hidden sm:inline">View Site</span>
            </button>
            <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold border-2 border-white shadow-sm">
              AD
            </div>
          </div>
        </header>

        <div className="p-8 lg:p-12 max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'dashboard' && (
                <div className="space-y-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard 
                      title="Total Revenue" 
                      value={formatPrice(totalRevenue)} 
                      icon={<Truck className="h-6 w-6 text-green-600" />}
                      trend="+12.5%"
                      color="green"
                    />
                    <StatCard 
                      title="Total Orders" 
                      value={orders.length.toString()} 
                      icon={<ClipboardList className="h-6 w-6 text-blue-600" />}
                      trend="+5.2%"
                      color="blue"
                    />
                    <StatCard 
                      title="Total Products" 
                      value={products.length.toString()} 
                      icon={<Package className="h-6 w-6 text-indigo-600" />}
                      trend="+2 new"
                      color="indigo"
                    />
                    <StatCard 
                      title="Featured Items" 
                      value={products.filter(p => p.is_featured).length.toString()} 
                      icon={<Star className="h-6 w-6 text-amber-600" />}
                      trend="Stable"
                      color="amber"
                    />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Recent Orders */}
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                      <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                        <h3 className="font-bold text-gray-900">Recent Orders</h3>
                        <button 
                          onClick={() => setActiveTab('orders')}
                          className="text-sm font-bold text-indigo-600 hover:text-indigo-700"
                        >
                          View All
                        </button>
                      </div>
                      <div className="divide-y divide-gray-50">
                        {recentOrders.map(order => (
                          <div key={order.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold">
                                {order.customer_name.charAt(0)}
                              </div>
                              <div>
                                <p className="text-sm font-bold text-gray-900">{order.customer_name}</p>
                                <p className="text-xs text-gray-500">{order.product_name}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold text-gray-900">{formatPrice(order.product_price || 0)}</p>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                order.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                                order.status === 'confirmed' ? 'bg-blue-100 text-blue-700' :
                                'bg-green-100 text-green-700'
                              }`}>
                                {order.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Top Categories */}
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
                      <h3 className="font-bold text-gray-900 mb-6">Inventory by Category</h3>
                      <div className="space-y-4">
                        {categoryOptions.filter(c => c !== 'All').map(cat => {
                          const count = products.filter(p => p.category === cat).length;
                          const percentage = products.length > 0 ? (count / products.length) * 100 : 0;
                          return (
                            <div key={cat} className="space-y-1">
                              <div className="flex justify-between text-sm">
                                <span className="font-medium text-gray-700">{cat}</span>
                                <span className="text-gray-500">{count} items</span>
                              </div>
                              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-indigo-600 rounded-full" 
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'products' && (
                <div className="space-y-6">
                  {/* Products Header */}
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">Products Catalog</h2>
                      <p className="text-gray-500 text-sm">Manage your inventory and product listings.</p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-bold rounded-xl hover:bg-gray-50 transition-colors"
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        Import CSV
                      </button>
                      {selectedProductIds.length > 0 && (
                        <button
                          onClick={handleBulkDelete}
                          className="inline-flex items-center px-4 py-2 bg-red-50 text-red-600 text-sm font-bold rounded-xl hover:bg-red-100 transition-colors"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete ({selectedProductIds.length})
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setEditingProduct(null);
                          setProductForm({ 
                            name: '', 
                            description: '', 
                            price: '', 
                            image: '', 
                            category: 'Uncategorized', 
                            brand: 'No Brand',
                            attributes: {},
                            is_featured: false 
                          });
                          setModalTab('basic');
                          setIsModalOpen(true);
                        }}
                        className="inline-flex items-center px-6 py-2 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/25"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Product
                      </button>
                    </div>
                  </div>

                  {/* Filters */}
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-grow">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search by name or description..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-white"
                      />
                    </div>
                    <div className="relative w-full md:w-64">
                      <Filter className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all appearance-none bg-white font-medium text-gray-700"
                      >
                        {categoryOptions.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Products Table */}
                  <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50/50 border-b border-gray-100">
                          <tr>
                            <th className="px-6 py-4 w-10">
                              <input
                                type="checkbox"
                                checked={selectedProductIds.length === filteredProducts.length && filteredProducts.length > 0}
                                onChange={toggleAllProducts}
                                className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded-lg cursor-pointer"
                              />
                            </th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Product</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Category</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Price</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Status</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {filteredProducts.length > 0 ? (
                            filteredProducts.map(product => (
                              <tr key={product.id} className={`group hover:bg-gray-50/50 transition-colors ${selectedProductIds.includes(product.id) ? 'bg-indigo-50/30' : ''}`}>
                                <td className="px-6 py-4">
                                  <input
                                    type="checkbox"
                                    checked={selectedProductIds.includes(product.id)}
                                    onChange={() => toggleProductSelection(product.id)}
                                    className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded-lg cursor-pointer"
                                  />
                                </td>
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-4">
                                    <div className="h-14 w-14 rounded-2xl overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-100">
                                      <img
                                        src={product.image}
                                        alt=""
                                        className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500"
                                        referrerPolicy="no-referrer"
                                      />
                                    </div>
                                    <div>
                                      <div className="text-sm font-bold text-gray-900">{product.name}</div>
                                      <div className="text-xs text-gray-400 line-clamp-1 max-w-xs">{product.description}</div>
                                      {product.attributes && (
                                        <div className="flex flex-wrap gap-1 mt-1">
                                          {Object.entries(JSON.parse(product.attributes)).map(([key, value]) => (
                                            <span key={key} className="text-[10px] px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded-md font-bold border border-indigo-100">
                                              {key}: {value as string}
                                            </span>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600">
                                    {product.category || 'Uncategorized'}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-sm font-bold text-gray-900">
                                  {formatPrice(product.price)}
                                </td>
                                <td className="px-6 py-4">
                                  {product.is_featured ? (
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-600 border border-amber-100">
                                      <Star className="h-3 w-3 mr-1.5 fill-current" />
                                      Featured
                                    </span>
                                  ) : (
                                    <span className="text-xs font-bold text-gray-300">Regular</span>
                                  )}
                                </td>
                                <td className="px-6 py-4 text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <button
                                      onClick={() => openEditModal(product)}
                                      className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                                      title="Edit Product"
                                    >
                                      <Edit className="h-5 w-5" />
                                    </button>
                                    <button
                                      onClick={() => deleteProduct(product.id)}
                                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                      title="Delete Product"
                                    >
                                      <Trash2 className="h-5 w-5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={6} className="px-6 py-20 text-center">
                                <div className="max-w-xs mx-auto">
                                  <Search className="h-12 w-12 text-gray-200 mx-auto mb-4" />
                                  <h3 className="text-lg font-bold text-gray-900">No products found</h3>
                                  <p className="text-gray-500 text-sm">Try adjusting your search or category filter.</p>
                                </div>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'orders' && (
                <div className="space-y-6">
                  {/* Orders Header */}
                  <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">Order Management</h2>
                      <p className="text-gray-500 text-sm">Track shipments and update delivery statuses.</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="px-4 py-2 bg-indigo-50 rounded-xl text-indigo-600 text-sm font-bold">
                        {orders.length} Total Orders
                      </div>
                    </div>
                  </div>

                  {/* Orders Table */}
                  <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50/50 border-b border-gray-100">
                          <tr>
                            <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Customer</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Product</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Status</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Est. Delivery</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Update Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {orders.map(order => (
                            <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold">
                                    {order.customer_name.charAt(0)}
                                  </div>
                                  <div>
                                    <div className="text-sm font-bold text-gray-900">{order.customer_name}</div>
                                    <div className="text-xs text-gray-500">{order.email || order.phone}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-sm font-bold text-gray-900">{order.product_name}</div>
                                <div className="text-xs font-bold text-indigo-600">{formatPrice(order.product_price || 0)}</div>
                                {order.attributes && (
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {Object.entries(JSON.parse(order.attributes)).map(([key, value]) => (
                                      <span key={key} className="text-[10px] px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded-md font-bold border border-indigo-100">
                                        {key}: {value as string}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </td>
                              <td className="px-6 py-4">
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${
                                  order.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                  order.status === 'confirmed' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                  'bg-green-50 text-green-700 border-green-100'
                                }`}>
                                  {order.status === 'pending' && <Clock className="h-3 w-3 mr-1.5" />}
                                  {order.status === 'confirmed' && <CheckCircle className="h-3 w-3 mr-1.5" />}
                                  {order.status === 'delivered' && <Truck className="h-3 w-3 mr-1.5" />}
                                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-sm font-medium text-gray-600">
                                {order.estimated_delivery ? new Date(order.estimated_delivery).toLocaleDateString() : 'N/A'}
                              </td>
                              <td className="px-6 py-4 text-right">
                                <select
                                  value={order.status}
                                  onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                                  className="text-sm font-bold text-gray-700 bg-gray-50 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none px-3 py-2 transition-all cursor-pointer"
                                >
                                  <option value="pending">Pending</option>
                                  <option value="confirmed">Confirmed</option>
                                  <option value="shipped">Shipped</option>
                                  <option value="delivered">Delivered</option>
                                </select>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'reviews' && (
                <div className="space-y-6">
                  {/* Reviews Header */}
                  <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">Customer Reviews</h2>
                      <p className="text-gray-500 text-sm">Monitor and manage feedback from your customers.</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="px-4 py-2 bg-indigo-50 rounded-xl text-indigo-600 text-sm font-bold">
                        {reviews.length} Total Reviews
                      </div>
                    </div>
                  </div>

                  {/* Reviews Table */}
                  <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50/50 border-b border-gray-100">
                          <tr>
                            <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Customer</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Product</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Rating</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Comment</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Date</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {reviews.length > 0 ? (
                            reviews.map(review => (
                              <tr key={review.id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold">
                                      {review.customer_name.charAt(0)}
                                    </div>
                                    <div className="text-sm font-bold text-gray-900">{review.customer_name}</div>
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="text-sm font-bold text-gray-900">{review.product_name}</div>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="flex">
                                    {[...Array(5)].map((_, i) => (
                                      <Star
                                        key={i}
                                        className={`h-3 w-3 ${
                                          i < review.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200'
                                        }`}
                                      />
                                    ))}
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="text-sm text-gray-600 line-clamp-2 max-w-md">{review.comment}</div>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500">
                                  {new Date(review.created_at).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 text-right">
                                  <button
                                    onClick={() => deleteReview(review.id)}
                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                    title="Delete Review"
                                  >
                                    <Trash2 className="h-5 w-5" />
                                  </button>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={6} className="px-6 py-20 text-center">
                                <div className="max-w-xs mx-auto">
                                  <Star className="h-12 w-12 text-gray-200 mx-auto mb-4" />
                                  <h3 className="text-lg font-bold text-gray-900">No reviews yet</h3>
                                  <p className="text-gray-500 text-sm">Customer feedback will appear here once they start reviewing products.</p>
                                </div>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'file-manager' && (
                <div className="space-y-6">
                  {/* File Manager Header */}
                  <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">File Manager</h2>
                      <p className="text-gray-500 text-sm">Upload and manage images and assets for your products.</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <label className="inline-flex items-center px-6 py-2 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/25 cursor-pointer">
                        <Upload className="mr-2 h-4 w-4" />
                        Upload File
                        <input type="file" className="hidden" onChange={handleFileUpload} />
                      </label>
                    </div>
                  </div>

                  {/* Files Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {files.length > 0 ? (
                      files.map((file) => (
                        <div key={file.name} className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col">
                          <div className="aspect-square bg-gray-50 flex items-center justify-center relative overflow-hidden">
                            {file.name.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i) ? (
                              <img src={file.url} alt={file.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" referrerPolicy="no-referrer" />
                            ) : (
                              <File className="h-12 w-12 text-gray-300" />
                            )}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              <button 
                                onClick={() => {
                                  navigator.clipboard.writeText(window.location.origin + file.url);
                                  alert('URL copied to clipboard!');
                                }}
                                className="p-2 bg-white rounded-lg text-gray-900 hover:bg-gray-100 transition-colors"
                                title="Copy URL"
                              >
                                <Copy className="h-4 w-4" />
                              </button>
                              <a 
                                href={file.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="p-2 bg-white rounded-lg text-gray-900 hover:bg-gray-100 transition-colors"
                                title="View Full"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </a>
                              <button 
                                onClick={() => deleteFile(file.name)}
                                className="p-2 bg-red-500 rounded-lg text-white hover:bg-red-600 transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                          <div className="p-4">
                            <p className="text-sm font-bold text-gray-900 truncate" title={file.name}>{file.name}</p>
                            <div className="flex justify-between items-center mt-1">
                              <p className="text-xs text-gray-400">{(file.size / 1024).toFixed(1)} KB</p>
                              <p className="text-xs text-gray-400">{new Date(file.created_at).toLocaleDateString()}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-full bg-white rounded-3xl border border-gray-100 p-20 text-center">
                        <HardDrive className="h-16 w-16 text-gray-200 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-gray-900">No files uploaded</h3>
                        <p className="text-gray-500">Upload images to use them in your products.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

                  {activeTab === 'categories' && (
                    <div className="space-y-6">
                      {/* Categories Header */}
                      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                          <h2 className="text-2xl font-bold text-gray-900">Category Management</h2>
                          <p className="text-gray-500 text-sm">Organize your products into meaningful categories.</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => openCategoryModal()}
                            className="inline-flex items-center px-6 py-2 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/25"
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Add Category
                          </button>
                        </div>
                      </div>

                      {/* Categories Table */}
                      <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                            <thead className="bg-gray-50/50 border-b border-gray-100">
                              <tr>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Name</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Slug</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Created At</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                              {categories.map(category => (
                                <tr key={category.id} className="hover:bg-gray-50/50 transition-colors">
                                  <td className="px-6 py-4">
                                    <div className="text-sm font-bold text-gray-900">{category.name}</div>
                                  </td>
                                  <td className="px-6 py-4">
                                    <div className="text-sm text-gray-500">{category.slug}</div>
                                  </td>
                                  <td className="px-6 py-4 text-sm text-gray-500">
                                    {new Date(category.created_at).toLocaleDateString()}
                                  </td>
                                  <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                      <button
                                        onClick={() => openCategoryModal(category)}
                                        className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                                        title="Edit Category"
                                      >
                                        <Edit className="h-5 w-5" />
                                      </button>
                                      <button
                                        onClick={() => deleteCategory(category.id)}
                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                        title="Delete Category"
                                      >
                                        <Trash2 className="h-5 w-5" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'brands' && (
                    <div className="space-y-6">
                      {/* Brands Header */}
                      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                          <h2 className="text-2xl font-bold text-gray-900">Brand Management</h2>
                          <p className="text-gray-500 text-sm">Manage your product brands.</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => openBrandModal()}
                            className="inline-flex items-center px-6 py-2 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/25"
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Add Brand
                          </button>
                        </div>
                      </div>

                      {/* Brands Table */}
                      <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                            <thead className="bg-gray-50/50 border-b border-gray-100">
                              <tr>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Name</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Slug</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Created At</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                              {brands.map(brand => (
                                <tr key={brand.id} className="hover:bg-gray-50/50 transition-colors">
                                  <td className="px-6 py-4">
                                    <div className="text-sm font-bold text-gray-900">{brand.name}</div>
                                  </td>
                                  <td className="px-6 py-4">
                                    <div className="text-sm text-gray-500">{brand.slug}</div>
                                  </td>
                                  <td className="px-6 py-4 text-sm text-gray-500">
                                    {new Date(brand.created_at).toLocaleDateString()}
                                  </td>
                                  <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                      <button
                                        onClick={() => openBrandModal(brand)}
                                        className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                                        title="Edit Brand"
                                      >
                                        <Edit className="h-5 w-5" />
                                      </button>
                                      <button
                                        onClick={() => deleteBrand(brand.id)}
                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                        title="Delete Brand"
                                      >
                                        <Trash2 className="h-5 w-5" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'attributes' && (
                    <div className="space-y-6">
                      {/* Attributes Header */}
                      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                          <h2 className="text-2xl font-bold text-gray-900">Attribute Management</h2>
                          <p className="text-gray-500 text-sm">Manage product attributes like Color, Size, etc.</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => openAttributeModal()}
                            className="inline-flex items-center px-6 py-2 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/25"
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Add Attribute
                          </button>
                        </div>
                      </div>

                      {/* Attributes Table */}
                      <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                            <thead className="bg-gray-50/50 border-b border-gray-100">
                              <tr>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Name</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Slug</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Created At</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Items</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                              {attributes.map(attr => (
                                <tr key={attr.id} className="hover:bg-gray-50/50 transition-colors">
                                  <td className="px-6 py-4">
                                    <div className="text-sm font-bold text-gray-900">{attr.name}</div>
                                  </td>
                                  <td className="px-6 py-4">
                                    <div className="text-sm text-gray-500">{attr.slug}</div>
                                  </td>
                                  <td className="px-6 py-4 text-sm text-gray-500">
                                    {new Date(attr.created_at).toLocaleDateString()}
                                  </td>
                                  <td className="px-6 py-4">
                                    <div className="flex flex-wrap gap-2 items-center">
                                      {attributeValues
                                        .filter(v => v.attribute_id === attr.id)
                                        .map(v => (
                                          <span key={v.id} className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 text-xs font-bold rounded-lg group">
                                            {v.value}
                                            <button 
                                              onClick={() => deleteAttributeValue(v.id)}
                                              className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all"
                                            >
                                              <X className="h-3 w-3" />
                                            </button>
                                          </span>
                                        ))}
                                      <button
                                        onClick={() => openAttributeValueModal(attr.id)}
                                        className="inline-flex items-center px-2 py-1 border border-dashed border-gray-300 text-gray-400 text-xs font-bold rounded-lg hover:border-indigo-500 hover:text-indigo-500 transition-all"
                                      >
                                        <Plus className="h-3 w-3 mr-1" />
                                        Add Item
                                      </button>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                      <button
                                        onClick={() => openAttributeModal(attr)}
                                        className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                                        title="Edit Attribute"
                                      >
                                        <Edit className="h-5 w-5" />
                                      </button>
                                      <button
                                        onClick={() => deleteAttribute(attr.id)}
                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                        title="Delete Attribute"
                                      >
                                        <Trash2 className="h-5 w-5" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'shipping-areas' && (
                    <div className="space-y-6">
                      {/* Shipping Areas Header */}
                      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                          <h2 className="text-2xl font-bold text-gray-900">Shipping Area Management</h2>
                          <p className="text-gray-500 text-sm">Manage shipping costs for different areas.</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => {
                              setEditingShippingArea(null);
                              setShippingAreaForm({ name: '', cost: '' });
                              setIsShippingAreaModalOpen(true);
                            }}
                            className="inline-flex items-center px-6 py-2 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/25"
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Add Shipping Area
                          </button>
                        </div>
                      </div>

                      {/* Shipping Areas Table */}
                      <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                            <thead className="bg-gray-50/50 border-b border-gray-100">
                              <tr>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Area Name</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Cost (BDT)</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Created At</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                              {shippingAreas.map(area => (
                                <tr key={area.id} className="hover:bg-gray-50/50 transition-colors">
                                  <td className="px-6 py-4">
                                    <div className="text-sm font-bold text-gray-900">{area.name}</div>
                                  </td>
                                  <td className="px-6 py-4">
                                    <div className="text-sm font-bold text-indigo-600">BDT {area.cost}</div>
                                  </td>
                                  <td className="px-6 py-4 text-sm text-gray-500">
                                    {new Date(area.created_at).toLocaleDateString()}
                                  </td>
                                  <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                      <button
                                        onClick={() => {
                                          setEditingShippingArea(area);
                                          setShippingAreaForm({ name: area.name, cost: area.cost.toString() });
                                          setIsShippingAreaModalOpen(true);
                                        }}
                                        className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                                        title="Edit Area"
                                      >
                                        <Edit className="h-5 w-5" />
                                      </button>
                                      <button
                                        onClick={() => deleteShippingArea(area.id)}
                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                        title="Delete Area"
                                      >
                                        <Trash2 className="h-5 w-5" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Shipping Area Modal */}
      {isShippingAreaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">
                {editingShippingArea ? 'Edit Shipping Area' : 'Add New Shipping Area'}
              </h3>
              <button onClick={() => setIsShippingAreaModalOpen(false)} className="text-gray-400 hover:text-gray-500">
                <X className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleShippingAreaSubmit} className="p-8 space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Area Name</label>
                <input
                  required
                  type="text"
                  value={shippingAreaForm.name}
                  onChange={e => setShippingAreaForm({ ...shippingAreaForm, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="e.g. Inside Dhaka"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Shipping Cost (BDT)</label>
                <input
                  required
                  type="number"
                  step="0.01"
                  value={shippingAreaForm.cost}
                  onChange={e => setShippingAreaForm({ ...shippingAreaForm, cost: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="e.g. 80"
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setIsShippingAreaModalOpen(false)}
                  className="flex-1 px-6 py-3 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/25"
                >
                  {editingShippingArea ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">
                {editingCategory ? 'Edit Category' : 'Add New Category'}
              </h3>
              <button onClick={() => setIsCategoryModalOpen(false)} className="text-gray-400 hover:text-gray-500">
                <X className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleCategorySubmit} className="p-8 space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Category Name</label>
                <input
                  required
                  type="text"
                  value={categoryForm.name}
                  onChange={e => {
                    const name = e.target.value;
                    const slug = name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
                    setCategoryForm({ ...categoryForm, name, slug });
                  }}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="e.g. Electronics"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Slug</label>
                <input
                  required
                  type="text"
                  value={categoryForm.slug}
                  onChange={e => setCategoryForm({ ...categoryForm, slug: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="e.g. electronics"
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="flex-1 px-6 py-3 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/25"
                >
                  {editingCategory ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Brand Modal */}
      {isBrandModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">
                {editingBrand ? 'Edit Brand' : 'Add New Brand'}
              </h3>
              <button onClick={() => setIsBrandModalOpen(false)} className="text-gray-400 hover:text-gray-500">
                <X className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleBrandSubmit} className="p-8 space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Brand Name</label>
                <input
                  required
                  type="text"
                  value={brandForm.name}
                  onChange={e => {
                    const name = e.target.value;
                    const slug = name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
                    setBrandForm({ ...brandForm, name, slug });
                  }}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="e.g. Sony"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Slug</label>
                <input
                  required
                  type="text"
                  value={brandForm.slug}
                  onChange={e => setBrandForm({ ...brandForm, slug: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="e.g. sony"
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setIsBrandModalOpen(false)}
                  className="flex-1 px-6 py-3 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/25"
                >
                  {editingBrand ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Attribute Modal */}
      {isAttributeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">
                {editingAttribute ? 'Edit Attribute' : 'Add New Attribute'}
              </h3>
              <button onClick={() => setIsAttributeModalOpen(false)} className="text-gray-400 hover:text-gray-500">
                <X className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleAttributeSubmit} className="p-8 space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Attribute Name</label>
                <input
                  required
                  type="text"
                  value={attributeForm.name}
                  onChange={e => {
                    const name = e.target.value;
                    const slug = name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
                    setAttributeForm({ ...attributeForm, name, slug });
                  }}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="e.g. Color"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Slug</label>
                <input
                  required
                  type="text"
                  value={attributeForm.slug}
                  onChange={e => setAttributeForm({ ...attributeForm, slug: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="e.g. color"
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setIsAttributeModalOpen(false)}
                  className="flex-1 px-6 py-3 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/25"
                >
                  {editingAttribute ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Attribute Value Modal */}
      {isAttributeValueModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">
                Add Attribute Value
              </h3>
              <button onClick={() => setIsAttributeValueModalOpen(false)} className="text-gray-400 hover:text-gray-500">
                <X className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleAttributeValueSubmit} className="p-8 space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Value</label>
                <input
                  required
                  autoFocus
                  type="text"
                  value={attributeValueForm.value}
                  onChange={e => setAttributeValueForm({ ...attributeValueForm, value: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="e.g. Red, XL, Cotton"
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setIsAttributeValueModalOpen(false)}
                  className="flex-1 px-6 py-3 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/25"
                >
                  Add
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl">
            <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-500">
                <X className="h-6 w-6" />
              </button>
            </div>

            {editingProduct && (
              <div className="px-8 pt-4 flex gap-4 border-b border-gray-100">
                <button
                  onClick={() => setModalTab('basic')}
                  className={`pb-4 text-sm font-bold transition-all border-b-2 ${
                    modalTab === 'basic' ? 'text-indigo-600 border-indigo-600' : 'text-gray-400 border-transparent hover:text-gray-600'
                  }`}
                >
                  Basic Info
                </button>
                <button
                  onClick={() => setModalTab('variations')}
                  className={`pb-4 text-sm font-bold transition-all border-b-2 ${
                    modalTab === 'variations' ? 'text-indigo-600 border-indigo-600' : 'text-gray-400 border-transparent hover:text-gray-600'
                  }`}
                >
                  Variations & Stock
                </button>
              </div>
            )}

            {modalTab === 'basic' ? (
              <form onSubmit={handleProductSubmit} className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-2">Product Name</label>
                  <input
                    required
                    type="text"
                    value={productForm.name}
                    onChange={e => setProductForm({ ...productForm, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Price (৳)</label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    value={productForm.price}
                    onChange={e => setProductForm({ ...productForm, price: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div className="flex items-center pt-8">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={productForm.is_featured}
                      onChange={e => setProductForm({ ...productForm, is_featured: e.target.checked })}
                      className="h-5 w-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                    <span className="ml-2 text-sm font-bold text-gray-700">Feature on Homepage</span>
                  </label>
                </div>
                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Category</label>
                    <select
                      required
                      value={productForm.category}
                      onChange={e => setProductForm({ ...productForm, category: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                    >
                      <option value="">Select Category</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.name}>{cat.name}</option>
                      ))}
                      <option value="Uncategorized">Uncategorized</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Brand</label>
                    <select
                      required
                      value={productForm.brand}
                      onChange={e => setProductForm({ ...productForm, brand: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                    >
                      <option value="">Select Brand</option>
                      {brands.map(brand => (
                        <option key={brand.id} value={brand.name}>{brand.name}</option>
                      ))}
                      <option value="No Brand">No Brand</option>
                    </select>
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-2">Product Image</label>
                  <div className="flex items-center gap-6">
                    <div className="h-32 w-32 rounded-2xl border-2 border-gray-100 overflow-hidden flex items-center justify-center bg-gray-50 flex-shrink-0">
                      {productForm.image ? (
                        <img 
                          src={productForm.image} 
                          alt="Preview" 
                          className="h-full w-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <ImageIcon className="h-12 w-12 text-gray-300" />
                      )}
                    </div>
                    <div className="flex-grow space-y-3">
                      <div className="flex gap-3">
                        <label className="flex-grow flex flex-col items-center justify-center px-4 py-4 border-2 border-dashed border-gray-200 rounded-2xl hover:border-indigo-500 hover:bg-indigo-50 transition-all cursor-pointer group">
                          <Upload className="h-6 w-6 text-gray-400 group-hover:text-indigo-600 mb-1" />
                          <span className="text-xs font-bold text-gray-500 group-hover:text-indigo-600">
                            {productForm.image ? 'Change' : 'Upload'}
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => setIsLibraryOpen(true)}
                          className="flex-grow flex flex-col items-center justify-center px-4 py-4 border-2 border-gray-100 rounded-2xl hover:border-indigo-500 hover:bg-indigo-50 transition-all group"
                        >
                          <ImageIcon className="h-6 w-6 text-gray-400 group-hover:text-indigo-600 mb-1" />
                          <span className="text-xs font-bold text-gray-500 group-hover:text-indigo-600">Library</span>
                        </button>
                      </div>
                      <p className="text-xs text-gray-400">Recommended: Square image, max 2MB</p>
                    </div>
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-4">Product Attributes</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    {attributes.map(attr => (
                      <div key={attr.id}>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">{attr.name}</label>
                        <select
                          value={(productForm.attributes && productForm.attributes[attr.name]) || ''}
                          onChange={e => {
                            const newAttrs = { ...(productForm.attributes || {}) };
                            if (e.target.value) {
                              newAttrs[attr.name] = e.target.value;
                            } else {
                              delete newAttrs[attr.name];
                            }
                            setProductForm({ ...productForm, attributes: newAttrs });
                          }}
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-sm"
                        >
                          <option value="">None</option>
                          {attributeValues
                            .filter(v => v.attribute_id === attr.id)
                            .map(v => (
                              <option key={v.id} value={v.value}>{v.value}</option>
                            ))}
                        </select>
                      </div>
                    ))}
                    {attributes.length === 0 && (
                      <p className="md:col-span-2 text-center text-sm text-gray-400 py-2">No attributes defined yet.</p>
                    )}
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-2">Description</label>
                  <textarea
                    required
                    rows={4}
                    value={productForm.description}
                    onChange={e => setProductForm({ ...productForm, description: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-4 mt-8">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-3 text-sm font-bold text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/25"
                >
                  {editingProduct ? 'Save Changes' : 'Add Product'}
                </button>
              </div>
            </form>
            ) : (
              <div className="p-8 space-y-8 max-h-[60vh] overflow-y-auto">
                {/* Variation Form */}
                <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                  <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center">
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Variation
                  </h4>
                  <form onSubmit={handleVariationSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {attributes.map(attr => (
                      <div key={attr.id}>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">{attr.name}</label>
                        <select
                          required
                          value={variationForm.attributes[attr.name] || ''}
                          onChange={e => setVariationForm({
                            ...variationForm,
                            attributes: { ...variationForm.attributes, [attr.name]: e.target.value }
                          })}
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-sm"
                        >
                          <option value="">Select {attr.name}</option>
                          {attributeValues
                            .filter(v => v.attribute_id === attr.id)
                            .map(v => (
                              <option key={v.id} value={v.value}>{v.value}</option>
                            ))}
                        </select>
                      </div>
                    ))}
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Quantity</label>
                      <input
                        required
                        type="number"
                        min="0"
                        value={variationForm.quantity}
                        onChange={e => setVariationForm({ ...variationForm, quantity: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                      />
                    </div>
                    <div className="md:col-span-3 flex justify-end">
                      <button
                        type="submit"
                        className="px-6 py-2 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-md shadow-indigo-500/20"
                      >
                        Add Variation
                      </button>
                    </div>
                  </form>
                </div>

                {/* Variations List */}
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-gray-900 flex items-center">
                    <ClipboardList className="h-4 w-4 mr-2" />
                    Existing Variations
                  </h4>
                  <div className="border border-gray-100 rounded-2xl overflow-hidden">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                          <th className="px-4 py-3 font-bold text-gray-700">Attributes</th>
                          <th className="px-4 py-3 font-bold text-gray-700">Stock Qty</th>
                          <th className="px-4 py-3 font-bold text-gray-700 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {variations.map(variation => {
                          const parsedAttrs = JSON.parse(variation.attributes);
                          return (
                            <tr key={variation.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-4 py-3">
                                <div className="flex flex-wrap gap-1">
                                  {Object.entries(parsedAttrs).map(([key, val]) => (
                                    <span key={key} className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded text-[10px] font-bold">
                                      {key}: {val as string}
                                    </span>
                                  ))}
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <span className={`font-bold ${variation.quantity <= 5 ? 'text-red-500' : 'text-gray-900'}`}>
                                  {variation.quantity}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right">
                                <button
                                  onClick={() => deleteVariation(variation.id)}
                                  className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                        {variations.length === 0 && (
                          <tr>
                            <td colSpan={3} className="px-4 py-8 text-center text-gray-400 italic">
                              No variations added yet.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {/* Image Library Modal */}
      {isLibraryOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl">
            <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">Stock Image Library</h3>
              <button onClick={() => setIsLibraryOpen(false)} className="text-gray-400 hover:text-gray-500">
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-8">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-[60vh] overflow-y-auto pr-2">
                {stockImages.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setProductForm({ ...productForm, image: img.url });
                      setIsLibraryOpen(false);
                    }}
                    className="group relative aspect-square rounded-xl overflow-hidden border-2 border-transparent hover:border-indigo-600 transition-all"
                  >
                    <img 
                      src={img.url} 
                      alt={img.name} 
                      className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-white text-xs font-bold px-2 py-1 bg-indigo-600 rounded-lg">Select</span>
                    </div>
                    <div className="absolute bottom-0 inset-x-0 p-2 bg-gradient-to-t from-black/60 to-transparent">
                      <p className="text-[10px] font-bold text-white truncate">{img.name}</p>
                    </div>
                  </button>
                ))}
              </div>
              <div className="flex justify-end mt-8">
                <button
                  type="button"
                  onClick={() => setIsLibraryOpen(false)}
                  className="px-6 py-2 text-sm font-bold text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SidebarItem({ active, onClick, icon, label, isOpen, disabled = false }: { 
  active: boolean, 
  onClick: () => void, 
  icon: React.ReactNode, 
  label: string, 
  isOpen: boolean,
  disabled?: boolean
}) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={`w-full flex items-center p-3 rounded-xl transition-all group relative ${
        active 
          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' 
          : disabled 
            ? 'opacity-40 cursor-not-allowed text-gray-400'
            : 'text-gray-500 hover:bg-gray-50 hover:text-indigo-600'
      }`}
    >
      <div className={`${isOpen ? 'mr-3' : 'mx-auto'} transition-all group-hover:scale-110`}>
        {icon}
      </div>
      {isOpen && <span className="font-bold text-sm">{label}</span>}
      {isOpen && active && (
        <motion.div 
          layoutId="active-pill"
          className="ml-auto h-1.5 w-1.5 rounded-full bg-white" 
        />
      )}
      {!isOpen && active && (
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-indigo-600 rounded-l-full" />
      )}
    </button>
  );
}

function StatCard({ title, value, icon, trend, color }: { 
  title: string, 
  value: string, 
  icon: React.ReactNode, 
  trend: string,
  color: 'green' | 'blue' | 'indigo' | 'amber'
}) {
  const colors = {
    green: 'bg-green-50 text-green-600',
    blue: 'bg-blue-50 text-blue-600',
    indigo: 'bg-indigo-50 text-indigo-600',
    amber: 'bg-amber-50 text-amber-600'
  };

  return (
    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-2xl ${colors[color]}`}>
          {icon}
        </div>
        <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${
          trend.startsWith('+') ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-500'
        }`}>
          {trend}
        </span>
      </div>
      <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider">{title}</h3>
      <p className="text-3xl font-black text-gray-900 mt-1">{value}</p>
    </div>
  );
}

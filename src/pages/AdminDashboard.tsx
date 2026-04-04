import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Papa from 'papaparse';
import { Product, Order } from '../types';
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
  Upload,
  Image as ImageIcon
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { motion, AnimatePresence } from 'motion/react';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'products' | 'orders'>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { token, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    image: '',
    category: 'Uncategorized',
    is_featured: false
  });

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [prodRes, orderRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/admin/orders', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (prodRes.status === 401 || orderRes.status === 401) {
        logout();
        navigate('/admin/login');
        return;
      }

      const prodData = await prodRes.json();
      const orderData = await orderRes.json();

      setProducts(prodData);
      setOrders(orderData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      navigate('/admin/login');
      return;
    }
    fetchAll();
  }, [token]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Image size must be less than 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setProductForm({ ...productForm, image: reader.result as string });
    };
    reader.readAsDataURL(file);
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
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...productForm,
          price: parseFloat(productForm.price as string)
        })
      });

      if (res.ok) {
        setIsModalOpen(false);
        setEditingProduct(null);
        setProductForm({ name: '', description: '', price: '', image: '', category: 'Uncategorized', is_featured: false });
        fetchAll();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const deleteProduct = async (id: number) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      await fetch(`/api/admin/products/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchAll();
    } catch (err) {
      console.error(err);
    }
  };

  const updateOrderStatus = async (id: number, status: string) => {
    try {
      await fetch(`/api/admin/orders/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      fetchAll();
    } catch (err) {
      console.error(err);
    }
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      image: product.image,
      category: product.category || 'Uncategorized',
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
          is_featured: row.is_featured === 'true' || row.is_featured === '1'
        }));

        // Basic validation
        const validData = importedData.filter(p => p.name && !isNaN(p.price));

        if (validData.length === 0) {
          alert('No valid products found in CSV. Please check the format (name, description, price, image, category, is_featured).');
          return;
        }

        try {
          const res = await fetch('/api/admin/products/bulk', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(validData)
          });

          if (res.ok) {
            alert(`Successfully imported ${validData.length} products!`);
            fetchAll();
          } else {
            const err = await res.json();
            alert(`Import failed: ${err.error}`);
          }
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

  const categories = ['All', ...Array.from(new Set(products.map(p => p.category || 'Uncategorized')))];

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
        className={`fixed inset-y-0 left-0 z-40 bg-white border-r border-gray-200 transition-all duration-300 ease-in-out ${
          isSidebarOpen ? 'w-64' : 'w-20'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="p-6 flex items-center justify-between">
            {isSidebarOpen && (
              <span className="text-xl font-bold text-gray-900 tracking-tight">SwiftCart Admin</span>
            )}
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>

          {/* Sidebar Nav */}
          <nav className="flex-grow px-4 space-y-2 mt-4">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center p-3 rounded-xl transition-all ${
                activeTab === 'dashboard' 
                  ? 'bg-indigo-50 text-indigo-600' 
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <LayoutDashboard className={`h-5 w-5 ${isSidebarOpen ? 'mr-3' : 'mx-auto'}`} />
              {isSidebarOpen && <span className="font-bold">Dashboard</span>}
              {isSidebarOpen && activeTab === 'dashboard' && <ChevronRight className="ml-auto h-4 w-4" />}
            </button>

            <button
              onClick={() => setActiveTab('products')}
              className={`w-full flex items-center p-3 rounded-xl transition-all ${
                activeTab === 'products' 
                  ? 'bg-indigo-50 text-indigo-600' 
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Package className={`h-5 w-5 ${isSidebarOpen ? 'mr-3' : 'mx-auto'}`} />
              {isSidebarOpen && <span className="font-bold">Products</span>}
              {isSidebarOpen && activeTab === 'products' && <ChevronRight className="ml-auto h-4 w-4" />}
            </button>

            <button
              onClick={() => setActiveTab('orders')}
              className={`w-full flex items-center p-3 rounded-xl transition-all ${
                activeTab === 'orders' 
                  ? 'bg-indigo-50 text-indigo-600' 
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <ClipboardList className={`h-5 w-5 ${isSidebarOpen ? 'mr-3' : 'mx-auto'}`} />
              {isSidebarOpen && <span className="font-bold">Orders</span>}
              {isSidebarOpen && activeTab === 'orders' && <ChevronRight className="ml-auto h-4 w-4" />}
            </button>
          </nav>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-gray-100">
            <button
              onClick={handleLogout}
              className="w-full flex items-center p-3 rounded-xl text-red-500 hover:bg-red-50 transition-all"
            >
              <LogOut className={`h-5 w-5 ${isSidebarOpen ? 'mr-3' : 'mx-auto'}`} />
              {isSidebarOpen && <span className="font-bold">Logout</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-grow transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-20'}`}>
        <div className="p-8 lg:p-12">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                {activeTab === 'dashboard' ? (
                  <>
                    <LayoutDashboard className="mr-3 h-8 w-8 text-indigo-600" />
                    Dashboard Overview
                  </>
                ) : activeTab === 'products' ? (
                  <>
                    <Package className="mr-3 h-8 w-8 text-indigo-600" />
                    Products Management
                  </>
                ) : (
                  <>
                    <ClipboardList className="mr-3 h-8 w-8 text-indigo-600" />
                    Order Management
                  </>
                )}
              </h1>
              <p className="text-gray-500 mt-1">
                {activeTab === 'dashboard'
                  ? 'Overview of your store performance and statistics.'
                  : activeTab === 'products' 
                  ? 'Manage your store inventory and product details.' 
                  : 'Track and update customer orders.'}
              </p>
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'dashboard' ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 bg-indigo-50 rounded-xl">
                        <Package className="h-6 w-6 text-indigo-600" />
                      </div>
                      <span className="text-xs font-bold text-green-500 bg-green-50 px-2 py-1 rounded-lg">Active</span>
                    </div>
                    <h3 className="text-gray-500 text-sm font-medium">Total Products</h3>
                    <p className="text-3xl font-bold text-gray-900 mt-1">{products.length}</p>
                  </div>

                  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 bg-blue-50 rounded-xl">
                        <ClipboardList className="h-6 w-6 text-blue-600" />
                      </div>
                      <span className="text-xs font-bold text-blue-500 bg-blue-50 px-2 py-1 rounded-lg">Orders</span>
                    </div>
                    <h3 className="text-gray-500 text-sm font-medium">Total Orders</h3>
                    <p className="text-3xl font-bold text-gray-900 mt-1">{orders.length}</p>
                  </div>

                  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 bg-green-50 rounded-xl">
                        <Star className="h-6 w-6 text-green-600" />
                      </div>
                      <span className="text-xs font-bold text-amber-500 bg-amber-50 px-2 py-1 rounded-lg">Featured</span>
                    </div>
                    <h3 className="text-gray-500 text-sm font-medium">Featured Products</h3>
                    <p className="text-3xl font-bold text-gray-900 mt-1">
                      {products.filter(p => p.is_featured).length}
                    </p>
                  </div>
                </div>
              ) : activeTab === 'products' ? (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h2 className="text-xl font-bold text-gray-900">Inventory ({filteredProducts.length})</h2>
                    
                    <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                      <div className="relative flex-grow sm:w-48">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <select
                          value={categoryFilter}
                          onChange={(e) => setCategoryFilter(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-all appearance-none bg-white"
                        >
                          {categories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>

                      <div className="relative flex-grow sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search products..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-all"
                        />
                      </div>
                      
                      <input
                        type="file"
                        accept=".csv"
                        ref={fileInputRef}
                        onChange={handleCsvImport}
                        className="hidden"
                      />

                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-bold rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap"
                      >
                        Import CSV
                      </button>

                      <button
                        onClick={() => {
                          setEditingProduct(null);
                          setProductForm({ name: '', description: '', price: '', image: '', category: 'Uncategorized', is_featured: false });
                          setIsModalOpen(true);
                        }}
                        className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700 transition-colors whitespace-nowrap"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Product
                      </button>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                    <table className="w-full text-left">
                      <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                          <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Product</th>
                          <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Category</th>
                          <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Price</th>
                          <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {filteredProducts.length > 0 ? (
                          filteredProducts.map(product => (
                            <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-6 py-4">
                                <div className="flex items-center">
                                  <img
                                    src={product.image}
                                    alt=""
                                    className="h-10 w-10 rounded-lg object-cover mr-3"
                                    referrerPolicy="no-referrer"
                                  />
                                  <div>
                                    <div className="text-sm font-bold text-gray-900">{product.name}</div>
                                    <div className="text-xs text-gray-500 line-clamp-1 max-w-xs">{product.description}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <span className="text-sm text-gray-600">{product.category || 'Uncategorized'}</span>
                              </td>
                              <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                {formatPrice(product.price)}
                              </td>
                              <td className="px-6 py-4">
                                {product.is_featured ? (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                                    <Star className="h-3 w-3 mr-1 fill-current" />
                                    Featured
                                  </span>
                                ) : (
                                  <span className="text-xs text-gray-400">Regular</span>
                                )}
                              </td>
                              <td className="px-6 py-4 text-right space-x-2">
                                <button
                                  onClick={() => openEditModal(product)}
                                  className="p-2 text-gray-400 hover:text-indigo-600 transition-colors"
                                >
                                  <Edit className="h-5 w-5" />
                                </button>
                                <button
                                  onClick={() => deleteProduct(product.id)}
                                  className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                                >
                                  <Trash2 className="h-5 w-5" />
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                              No products found matching your search.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-gray-900">Recent Orders ({orders.length})</h2>
                  <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                    <table className="w-full text-left">
                      <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                          <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Customer</th>
                          <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Product</th>
                          <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Update Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {orders.map(order => (
                          <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="text-sm font-bold text-gray-900">{order.customer_name}</div>
                              <div className="text-xs text-gray-500">{order.phone}</div>
                              <div className="text-xs text-gray-400 mt-1">{order.address}</div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm font-medium text-gray-900">{order.product_name}</div>
                              <div className="text-xs text-indigo-600">{formatPrice(order.product_price || 0)}</div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                order.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                                order.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                                {order.status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
                                {order.status === 'confirmed' && <CheckCircle className="h-3 w-3 mr-1" />}
                                {order.status === 'delivered' && <Truck className="h-3 w-3 mr-1" />}
                                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <select
                                value={order.status}
                                onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                                className="text-sm border-gray-200 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                              >
                                <option value="pending">Pending</option>
                                <option value="confirmed">Confirmed</option>
                                <option value="delivered">Delivered</option>
                              </select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

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
                  <label className="block text-sm font-bold text-gray-700 mb-2">Price ($)</label>
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
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-2">Category</label>
                  <input
                    required
                    type="text"
                    value={productForm.category}
                    onChange={e => setProductForm({ ...productForm, category: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="e.g. Electronics, Fashion"
                  />
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
                    <div className="flex-grow">
                      <label className="flex flex-col items-center justify-center px-4 py-6 border-2 border-dashed border-gray-200 rounded-2xl hover:border-indigo-500 hover:bg-indigo-50 transition-all cursor-pointer group">
                        <Upload className="h-8 w-8 text-gray-400 group-hover:text-indigo-600 mb-2" />
                        <span className="text-sm font-bold text-gray-500 group-hover:text-indigo-600">
                          {productForm.image ? 'Change Image' : 'Upload Image'}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </label>
                      <p className="text-xs text-gray-400 mt-2">Recommended: Square image, max 2MB</p>
                    </div>
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
          </div>
        </div>
      )}
    </div>
  );
}

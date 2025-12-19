import { useState, useEffect, useMemo } from 'react'
import { Plus, Package } from 'lucide-react'
import { useDebounce } from '../hooks/useDebounce'
import DashboardLayout from '../components/DashboardLayout'
import Button from '../components/Button'
import Card from '../components/Card'
import ProductCard from '../components/ProductCard'
import ProductTable from '../components/ProductTable'
import ProductFilters from '../components/ProductFilters'
import ViewToggle from '../components/ViewToggle'
import EmptyState from '../components/EmptyState'
import AddProductModal from '../components/AddProductModal'
import EditProductModal from '../components/EditProductModal'
import DeleteConfirmation from '../components/DeleteConfirmation'
import { useProductStore } from '../store/productStore'
import { useAuth } from '../hooks/useAuth'
import { toast } from 'react-hot-toast'

export default function Products() {
  const { user, profile, isOwner } = useAuth()
  const {
    products,
    loading,
    error,
    searchQuery,
    categoryFilter,
    viewMode,
    loadProducts,
    setSearchQuery,
    setCategoryFilter,
    setViewMode,
    clearFilters,
    removeProduct,
  } = useProductStore()

  const [addModalOpen, setAddModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [deleting, setDeleting] = useState(false)

  // Debounce search query
  const debouncedSearch = useDebounce(searchQuery, 300)

  // Load products on mount and when filters change
  useEffect(() => {
    if (user && isOwner) {
      loadProducts(user)
    }
  }, [user, isOwner, debouncedSearch, categoryFilter])

  // Filter products client-side for instant feedback
  const filteredProducts = useMemo(() => {
    let filtered = [...products]

    if (debouncedSearch.trim()) {
      filtered = filtered.filter((p) =>
        p.name.toLowerCase().includes(debouncedSearch.toLowerCase())
      )
    }

    if (categoryFilter && categoryFilter !== 'all') {
      filtered = filtered.filter((p) => p.category === categoryFilter)
    }

    return filtered
  }, [products, debouncedSearch, categoryFilter])

  const handleEdit = (product) => {
    setSelectedProduct(product)
    setEditModalOpen(true)
  }

  const handleDelete = (product) => {
    setSelectedProduct(product)
    setDeleteModalOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!selectedProduct) return

    setDeleting(true)
    try {
      await removeProduct(selectedProduct.id)
      toast.success('Product deleted successfully')
      setDeleteModalOpen(false)
      setSelectedProduct(null)
    } catch (error) {
      toast.error(error.message || 'Failed to delete product')
    } finally {
      setDeleting(false)
    }
  }

  const handleAddSuccess = () => {
    setAddModalOpen(false)
    if (user) {
      loadProducts(user.id)
    }
  }

  const handleEditSuccess = () => {
    setEditModalOpen(false)
    setSelectedProduct(null)
    if (user) {
      loadProducts(user.id)
    }
  }

  // Loading skeleton
  if (loading && products.length === 0) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-50">
              Products
            </h1>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="card p-4 animate-pulse"
              >
                <div className="aspect-square bg-gray-200 dark:bg-slate-700 rounded-lg mb-3" />
                <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded mb-2" />
                <div className="h-6 bg-gray-200 dark:bg-slate-700 rounded w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-50">
            Products
          </h1>
          {isOwner && (
            <Button onClick={() => setAddModalOpen(true)}>
              <Plus className="w-5 h-5 mr-2" />
              Add Product
            </Button>
          )}
        </div>

        {/* Filters */}
        {isOwner && (
        <ProductFilters
          searchQuery={searchQuery}
          categoryFilter={categoryFilter}
          onSearchChange={setSearchQuery}
          onCategoryChange={setCategoryFilter}
          onClearFilters={clearFilters}
        />
        )}

        {/* View Toggle and Stats */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600 dark:text-slate-400">
            {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''}
          </div>
          {isOwner && (
            <ViewToggle viewMode={viewMode} onViewChange={setViewMode} />
          )}
        </div>

        {/* Error State */}
        {error && (
          <Card className="p-4 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
            <p className="text-sm text-red-800 dark:text-red-400">{error}</p>
          </Card>
        )}

        {/* Products Display */}
        {filteredProducts.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No products yet"
            description={
              isOwner
                ? "Add your first product to get started with inventory management."
                : "No products available."
            }
            actionLabel={isOwner ? "Add Product" : null}
            onAction={isOwner ? () => setAddModalOpen(true) : null}
          />
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onEdit={handleEdit}
                onDelete={handleDelete}
                isOwner={isOwner}
              />
            ))}
          </div>
        ) : (
          <Card className="p-0 overflow-hidden">
            <ProductTable
              products={filteredProducts}
              onEdit={handleEdit}
              onDelete={handleDelete}
              isOwner={isOwner}
            />
          </Card>
        )}

        {/* Modals */}
        {isOwner && (
          <>
            <AddProductModal
              isOpen={addModalOpen}
              onClose={() => setAddModalOpen(false)}
            />
            <EditProductModal
              isOpen={editModalOpen}
              onClose={() => {
                setEditModalOpen(false)
                setSelectedProduct(null)
              }}
              product={selectedProduct}
            />
            <DeleteConfirmation
              isOpen={deleteModalOpen}
              onClose={() => {
                setDeleteModalOpen(false)
                setSelectedProduct(null)
              }}
              product={selectedProduct}
              onConfirm={handleConfirmDelete}
              loading={deleting}
            />
          </>
        )}
      </div>
    </DashboardLayout>
  )
}


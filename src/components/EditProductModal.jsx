import { useState, useEffect } from 'react'
import { DollarSign, Hash } from 'lucide-react'
import Modal from './Modal'
import Input from './Input'
import Button from './Button'
import ImageUpload from './ImageUpload'
import { useProductStore } from '../store/productStore'
import { useAuth } from '../hooks/useAuth'
import { useProductCategories } from '../hooks/useProductCategories'
import { toast } from 'react-hot-toast'
import { productsService } from '../services/products.service'

export default function EditProductModal({ isOpen, onClose, product }) {
  const { user } = useAuth()
  const { updateProduct, loadProducts } = useProductStore()
  const { categories, loading: categoriesLoading } = useProductCategories()
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    price: '',
    quantity: '0',
    imageUrl: null,
  })

  useEffect(() => {
    if (product) {
      // Use product's existing category if it exists in available categories, otherwise use first available
      const validCategory = categories.includes(product.category) 
        ? product.category 
        : (categories[0] || 'Other')
      
      setFormData({
        name: product.name || '',
        category: validCategory,
        price: product.price?.toString() || '',
        quantity: product.quantity?.toString() || '0',
        imageUrl: product.image_url || null,
      })
    }
  }, [product, categories])

  const validate = () => {
    const newErrors = {}
    if (!formData.name.trim() || formData.name.trim().length < 2) {
      newErrors.name = 'Product name must be at least 2 characters'
    }
    if (!formData.price || Number(formData.price) <= 0) {
      newErrors.price = 'Price must be greater than 0'
    }
    if (formData.quantity === '' || Number(formData.quantity) < 0) {
      newErrors.quantity = 'Quantity must be 0 or greater'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    try {
      const updates = {
        name: formData.name,
        category: formData.category,
        price: Number(formData.price),
        quantity: Number(formData.quantity),
        image_url: formData.imageUrl,
      }

      await updateProduct(product.id, updates)
      await loadProducts(user.id)

      toast.success('Product updated successfully!')
      handleClose()
    } catch (error) {
      toast.error(error.message || 'Failed to update product')
    } finally {
      setLoading(false)
    }
  }

  const handleImageChange = async (value) => {
    if (!value) {
      setFormData({ ...formData, imageUrl: null })
      return
    }

    // If value is already a URL string, ImageUpload already uploaded it
    // (this happens in edit mode when productId is provided)
    if (typeof value === 'string') {
      // Delete old image if it's different from the new one
      if (formData.imageUrl && formData.imageUrl !== value) {
        try {
          await productsService.deleteProductImage(formData.imageUrl)
        } catch (error) {
          console.error('Error deleting old image:', error)
          // Don't block the update if deletion fails
        }
      }
      setFormData({ ...formData, imageUrl: value })
      return
    }

    // If value is a File object (shouldn't happen in edit mode, but handle it anyway)
    try {
      setLoading(true)
      // Delete old image if exists
      if (formData.imageUrl) {
        try {
          await productsService.deleteProductImage(formData.imageUrl)
        } catch (error) {
          console.error('Error deleting old image:', error)
        }
      }

      // Upload new image
      const imageUrl = await productsService.uploadProductImage(value, product.id)
      setFormData({ ...formData, imageUrl })
    } catch (error) {
      toast.error('Failed to upload image')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setErrors({})
    onClose()
  }

  if (!product) return null

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg" title="Edit Product">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Product Name"
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          error={errors.name}
          placeholder="Enter product name"
          required
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
            Category *
          </label>
          {categoriesLoading ? (
            <div className="input-field bg-gray-100 dark:bg-slate-700 animate-pulse text-gray-500 dark:text-slate-400">
              Loading categories...
            </div>
          ) : (
            <select
              value={formData.category}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value })
              }
              className="input-field"
              required
              disabled={categories.length === 0}
            >
              {categories.length === 0 ? (
                <option value="">No categories available</option>
              ) : (
                <>
                  <option value="">Select a category</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </>
              )}
            </select>
          )}
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
            Categories are based on your business type
          </p>
        </div>

        <Input
          label="Price (UGX)"
          type="number"
          value={formData.price}
          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
          error={errors.price}
          leadingIcon={DollarSign}
          placeholder="0.00"
          min="0"
          step="0.01"
          required
        />

        <Input
          label="Quantity"
          type="number"
          value={formData.quantity}
          onChange={(e) =>
            setFormData({ ...formData, quantity: e.target.value })
          }
          error={errors.quantity}
          leadingIcon={Hash}
          placeholder="0"
          min="0"
          required
        />

        <ImageUpload
          value={formData.imageUrl}
          onChange={handleImageChange}
          productId={product.id}
        />

        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="secondary"
            fullWidth
            onClick={handleClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" fullWidth loading={loading}>
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  )
}


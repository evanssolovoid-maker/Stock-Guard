import { useState, useEffect } from 'react'
import { X, DollarSign, Hash, Package } from 'lucide-react'
import Modal from './Modal'
import Input from './Input'
import Button from './Button'
import ImageUpload from './ImageUpload'
import { useProductStore } from '../store/productStore'
import { useAuth } from '../hooks/useAuth'
import { useProductCategories } from '../hooks/useProductCategories'
import { toast } from 'react-hot-toast'
import { productsService } from '../services/products.service'

export default function AddProductModal({ isOpen, onClose }) {
  const { user } = useAuth()
  const { addProduct, loadProducts } = useProductStore()
  const { categories, loading: categoriesLoading, getDefaultCategory } = useProductCategories()
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    product_type: 'single',
    items_per_unit: '12',
    price: '',
    quantity: '0',
    image: null,
    imageUrl: null,
  })

  // Set default category when categories are loaded
  useEffect(() => {
    if (categories.length > 0 && !formData.category) {
      setFormData(prev => ({ ...prev, category: getDefaultCategory() }))
    }
  }, [categories, getDefaultCategory])

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
    if (formData.product_type === 'box' && (!formData.items_per_unit || Number(formData.items_per_unit) < 1)) {
      newErrors.items_per_unit = 'Items per box must be at least 1'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const calculatePricePerItem = () => {
    if (!formData.price || !formData.items_per_unit) return 0
    
    const price = parseFloat(formData.price) || 0
    const itemsPerUnit = parseInt(formData.items_per_unit) || 1

    if (formData.product_type === 'box') {
      return itemsPerUnit > 0 ? price / itemsPerUnit : price
    } else if (formData.product_type === 'pair') {
      return price / 2
    } else {
      return price
    }
  }

  const getQuantityLabel = () => {
    if (formData.product_type === 'box') {
      const quantity = parseInt(formData.quantity) || 0
      const itemsPerUnit = parseInt(formData.items_per_unit) || 1
      return `${quantity} boxes (${quantity * itemsPerUnit} items)`
    } else if (formData.product_type === 'pair') {
      const quantity = parseInt(formData.quantity) || 0
      return `${quantity} pairs (${quantity * 2} items)`
    } else {
      return `${formData.quantity} items`
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    try {
      let imageUrl = formData.imageUrl

      // Upload image if a new file was selected
      if (formData.image && formData.image instanceof File) {
        // Create a temporary product to get an ID for image upload
        const tempProduct = await addProduct({
          owner_id: user.id,
          name: formData.name,
          category: formData.category,
          product_type: formData.product_type,
          items_per_unit: formData.product_type === 'box' ? parseInt(formData.items_per_unit) : 1,
          price: Number(formData.price),
          price_per_unit: Number(formData.price),
          quantity: Number(formData.quantity),
          image_url: null,
        }, user)

        // Upload image with product ID
        imageUrl = await productsService.uploadProductImage(
          formData.image,
          tempProduct.id
        )

        // Update product with image URL
        await productsService.updateProduct(tempProduct.id, {
          image_url: imageUrl,
        })

        // Reload products
        await loadProducts(user)
      } else {
        // No image, just create product
        await addProduct({
          owner_id: user.id,
          name: formData.name,
          category: formData.category,
          product_type: formData.product_type,
          items_per_unit: formData.product_type === 'box' ? parseInt(formData.items_per_unit) : 1,
          price: Number(formData.price),
          price_per_unit: Number(formData.price),
          quantity: Number(formData.quantity),
          image_url: imageUrl,
        }, user)
        // Reload products
        await loadProducts(user)
      }

      toast.success('Product added successfully!')
      handleClose()
    } catch (error) {
      toast.error(error.message || 'Failed to add product')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setFormData({
      name: '',
      category: getDefaultCategory() || '',
      product_type: 'single',
      items_per_unit: '12',
      price: '',
      quantity: '0',
      image: null,
      imageUrl: null,
    })
    setErrors({})
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg" title="Add New Product">
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

        {/* Product Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
            Product Type
          </label>
          <select
            value={formData.product_type}
            onChange={(e) => {
              const newType = e.target.value
              setFormData({
                ...formData,
                product_type: newType,
                items_per_unit: newType === 'box' ? formData.items_per_unit : '1'
              })
            }}
            className="input-field"
            required
          >
            <option value="single">Single Item</option>
            <option value="pair">Pair (e.g., shoes, socks)</option>
            <option value="box">Box/Package</option>
          </select>
        </div>

        {/* Items per Box */}
        {formData.product_type === 'box' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
              Items per Box
            </label>
            <select
              value={formData.items_per_unit}
              onChange={(e) => setFormData({ ...formData, items_per_unit: e.target.value })}
              className="input-field"
              required
            >
              <option value="12">12 items</option>
              <option value="24">24 items</option>
              <option value="36">36 items</option>
              <option value="48">48 items</option>
              <option value="custom">Custom</option>
            </select>
            {formData.items_per_unit === 'custom' && (
              <Input
                type="number"
                value={formData.items_per_unit === 'custom' ? formData.items_per_unit : ''}
                onChange={(e) => setFormData({ ...formData, items_per_unit: e.target.value })}
                placeholder="Enter number of items"
                min="1"
                className="mt-2"
              />
            )}
          </div>
        )}

        {/* Price Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
            {formData.product_type === 'single' && 'Price per Item (UGX)'}
            {formData.product_type === 'pair' && 'Price per Pair (UGX)'}
            {formData.product_type === 'box' && 'Price per Box (UGX)'}
          </label>
          <Input
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
          {formData.product_type === 'box' && formData.price && (
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
              Price per item: UGX {calculatePricePerItem().toFixed(2)}
            </p>
          )}
          {formData.product_type === 'pair' && formData.price && (
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
              Price per item: UGX {(parseFloat(formData.price) / 2).toFixed(2)}
            </p>
          )}
        </div>

        {/* Quantity Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
            Quantity in Stock
          </label>
          <Input
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
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
            {getQuantityLabel()}
          </p>
        </div>

        <ImageUpload
          value={formData.imageUrl}
          onChange={(fileOrUrl) => {
            if (fileOrUrl instanceof File) {
              setFormData({ ...formData, image: fileOrUrl, imageUrl: null })
            } else {
              setFormData({ ...formData, imageUrl: fileOrUrl, image: null })
            }
          }}
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
            Add Product
          </Button>
        </div>
      </form>
    </Modal>
  )
}

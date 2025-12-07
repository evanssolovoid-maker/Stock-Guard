import { useState, useEffect, useMemo } from 'react'
import { ShoppingCart, Search, Plus, Minus, Check, X, Trash2 } from 'lucide-react'
import { Combobox, Transition } from '@headlessui/react'
import DashboardLayout from '../components/DashboardLayout'
import Card from '../components/Card'
import Button from '../components/Button'
import { useAuth } from '../hooks/useAuth'
import { salesService } from '../services/sales.service'
import { useProductStore } from '../store/productStore'
import { toast } from 'react-hot-toast'

export default function LogSale() {
  const { user, profile } = useAuth()
  const { products, loadProducts } = useProductStore()
  const [cart, setCart] = useState([]) // Array of {product, quantity}
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [saleData, setSaleData] = useState(null)
  const [ownerId, setOwnerId] = useState(null)
  const [ownerSettings, setOwnerSettings] = useState(null)
  const [amountGiven, setAmountGiven] = useState('')

  // Get owner ID and load products
  useEffect(() => {
    const fetchOwnerId = async () => {
      if (!user || !profile) return;
      
      if (profile.role === 'worker') {
        try {
          const id = await salesService.getOwnerIdForWorker(user.id)
          if (id) {
            setOwnerId(id)
            await loadProducts(id)
            await loadOwnerSettings(id)
          } else {
            toast.error('You are not linked to any business. Please contact your business owner.')
          }
        } catch (error) {
          console.error('Error fetching owner ID:', error)
          toast.error(error.message || 'Failed to load products')
        }
      } else if (profile.role === 'owner' || profile.role === 'manager') {
        setOwnerId(user.id)
        try {
          await loadProducts(user.id)
          await loadOwnerSettings(user.id)
        } catch (error) {
          console.error('Error loading products:', error)
          toast.error('Failed to load products')
        }
      }
    }
    fetchOwnerId()
  }, [user, profile, loadProducts])

  const loadOwnerSettings = async (ownerId) => {
    try {
      const settings = await salesService.getOwnerSettings(ownerId)
      setOwnerSettings(settings)
    } catch (error) {
      console.error('Error loading owner settings:', error)
    }
  }

  // Filter products with stock > 0
  const availableProducts = useMemo(() => {
    return products.filter((p) => p.quantity > 0)
  }, [products])

  // Filter products by search query
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return availableProducts

    return availableProducts.filter((product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [availableProducts, searchQuery])

  // Calculate totals
  const subtotal = useMemo(() => {
    return cart.reduce((total, item) => {
      const pricePerUnit = item.product.price_per_unit || item.product.price || 0
      return total + (pricePerUnit * item.quantity)
    }, 0)
  }, [cart])

  const discount = useMemo(() => {
    if (!ownerSettings?.discount_enabled) return 0
    if (subtotal < (ownerSettings.discount_threshold || 0)) return 0
    return subtotal * ((ownerSettings.discount_percentage || 0) / 100)
  }, [subtotal, ownerSettings])

  const finalTotal = subtotal - discount

  // Calculate change
  const change = useMemo(() => {
    const given = parseFloat(amountGiven) || 0
    const total = finalTotal
    return given >= total ? given - total : 0
  }, [amountGiven, finalTotal])

  const isAmountSufficient = useMemo(() => {
    const given = parseFloat(amountGiven) || 0
    return given >= finalTotal
  }, [amountGiven, finalTotal])

  // Add product to cart
  const addToCart = () => {
    if (!selectedProduct || quantity <= 0) {
      toast.error('Please select a product and quantity')
      return
    }

    if (quantity > selectedProduct.quantity) {
      toast.error(`Only ${selectedProduct.quantity} units available`)
      return
    }

    const existingIndex = cart.findIndex(item => item.product.id === selectedProduct.id)

    if (existingIndex >= 0) {
      // Update quantity
      const newCart = [...cart]
      const newQuantity = newCart[existingIndex].quantity + quantity
      
      if (newQuantity > selectedProduct.quantity) {
        toast.error(`Only ${selectedProduct.quantity} total units available`)
        return
      }

      newCart[existingIndex].quantity = newQuantity
      setCart(newCart)
      toast.success('Quantity updated in cart')
    } else {
      // Add new item
      setCart([...cart, { product: selectedProduct, quantity }])
      toast.success('Product added to cart')
    }

    // Reset
    setSelectedProduct(null)
    setQuantity(1)
    setSearchQuery('')
  }

  // Remove from cart
  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.product.id !== productId))
    toast.success('Item removed from cart')
  }

  // Update quantity in cart
  const updateCartQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId)
      return
    }

    const item = cart.find(item => item.product.id === productId)
    if (!item) return

    if (newQuantity > item.product.quantity) {
      toast.error(`Only ${item.product.quantity} units available`)
      return
    }

    setCart(cart.map(item => 
      item.product.id === productId 
        ? { ...item, quantity: newQuantity }
        : item
    ))
  }

  // Submit sale
  const submitSale = async () => {
    if (cart.length === 0) {
      toast.error('Cart is empty')
      return
    }

    if (!ownerId) {
      toast.error('Owner ID not found. Please refresh the page.')
      return
    }

    if (!user) {
      toast.error('User not found. Please log in again.')
      return
    }

    setSubmitting(true)
    try {
      const items = cart.map(item => ({
        productId: item.product.id,
        quantity: item.quantity
      }))

      const sale = await salesService.logMultiItemSale({
        ownerId,
        workerId: user.id,
        items
      })

      setSaleData(sale)
      setSuccess(true)
      toast.success('Sale logged successfully!')

      // Auto-reset after 5 seconds
      setTimeout(() => {
        handleReset()
      }, 5000)
    } catch (error) {
      console.error('Error logging sale:', error)
      toast.error(error.message || 'Failed to log sale')
    } finally {
      setSubmitting(false)
    }
  }

  const handleReset = () => {
    setCart([])
    setSelectedProduct(null)
    setQuantity(1)
    setSearchQuery('')
    setSuccess(false)
    setSaleData(null)
    setAmountGiven('')
    // Reload products to get updated quantities
    if (ownerId) {
      loadProducts(ownerId)
    }
  }


  const getProductTypeLabel = (product) => {
    if (product.product_type === 'box') {
      return `Box of ${product.items_per_unit || 1}`
    } else if (product.product_type === 'pair') {
      return 'Pair'
    } else {
      return 'Single'
    }
  }

  const getPriceLabel = (product) => {
    const price = product.price_per_unit || product.price || 0
    if (product.product_type === 'box') {
      const perItem = product.price_per_item || (price / (product.items_per_unit || 1))
      return `UGX ${price.toLocaleString()} (UGX ${perItem.toFixed(2)}/item)`
    } else if (product.product_type === 'pair') {
      const perItem = product.price_per_item || (price / 2)
      return `UGX ${price.toLocaleString()} (UGX ${perItem.toFixed(2)}/item)`
    } else {
      return `UGX ${price.toLocaleString()}`
    }
  }

  // Success screen
  if (success && saleData) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto">
          <Card className="p-8 text-center">
            <div className="mb-6 flex justify-center">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <Check className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>
            </div>

            <h2 className="text-3xl font-bold text-gray-900 dark:text-slate-50 mb-2">
              Sale Logged Successfully!
            </h2>

            <div className="mt-8 p-6 rounded-lg border-2 border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-left">
              <div className="space-y-3">
                <div className="flex justify-between border-b border-gray-200 dark:border-slate-700 pb-2">
                  <span className="text-sm text-gray-600 dark:text-slate-400">Date:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-slate-50">
                    {new Date(saleData.sale_date || saleData.created_at).toLocaleString()}
                  </span>
                </div>
                {saleData.subtotal && (
                  <div className="flex justify-between border-b border-gray-200 dark:border-slate-700 pb-2">
                    <span className="text-sm text-gray-600 dark:text-slate-400">Subtotal:</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-slate-50">
                      UGX {parseFloat(saleData.subtotal).toLocaleString()}
                    </span>
                  </div>
                )}
                {saleData.discount_amount > 0 && (
                  <div className="flex justify-between border-b border-gray-200 dark:border-slate-700 pb-2">
                    <span className="text-sm text-gray-600 dark:text-slate-400">Discount:</span>
                    <span className="text-sm font-medium text-green-600 dark:text-green-400">
                      -UGX {parseFloat(saleData.discount_amount).toLocaleString()}
                    </span>
                  </div>
                )}
                <div className="flex justify-between pt-2">
                  <span className="text-sm text-gray-600 dark:text-slate-400">Final Total:</span>
                  <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                    UGX {parseFloat(saleData.final_total || saleData.subtotal || 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <Button onClick={handleReset} className="mt-6" fullWidth>
              Log Another Sale
            </Button>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 dark:from-purple-600 dark:to-purple-700 p-8 text-white">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-white/20 backdrop-blur-sm">
              <ShoppingCart className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Log a Sale</h1>
              <p className="text-blue-100 dark:text-purple-100 mt-1">
                Add multiple products to cart
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: Product Selection */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-50 mb-4">
              1. Add Products
            </h2>

            <Combobox value={selectedProduct} onChange={setSelectedProduct}>
              <div className="relative mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Combobox.Input
                    className="input-field pl-10"
                    placeholder="Search for a product..."
                    displayValue={(product) => product?.name || ''}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <Transition
                  leave="transition ease-in duration-100"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg">
                    {filteredProducts.length === 0 ? (
                      <div className="px-4 py-8 text-center text-gray-500 dark:text-slate-400">
                        {searchQuery ? 'No products found' : 'No products available'}
                      </div>
                    ) : (
                      filteredProducts.map((product) => (
                        <Combobox.Option
                          key={product.id}
                          value={product}
                          className={({ active }) =>
                            `relative cursor-pointer select-none p-4 ${
                              active
                                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-900 dark:text-blue-100'
                                : 'text-gray-900 dark:text-slate-50'
                            }`
                          }
                        >
                          <div className="flex items-center gap-3">
                            {product.image_url && (
                              <img
                                src={product.image_url}
                                alt={product.name}
                                className="w-12 h-12 rounded-lg object-cover"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{product.name}</p>
                              <div className="flex items-center gap-3 mt-1">
                                <span className="text-sm text-blue-600 dark:text-blue-400 font-semibold">
                                  {getPriceLabel(product)}
                                </span>
                                <span className="text-xs text-gray-500 dark:text-slate-400">
                                  {product.quantity} available
                                </span>
                              </div>
                            </div>
                          </div>
                        </Combobox.Option>
                      ))
                    )}
                  </Combobox.Options>
                </Transition>
              </div>
            </Combobox>

            {selectedProduct && (
              <div className="space-y-4">
                <div className="p-4 rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800">
                  <div className="flex items-center gap-4">
                    {selectedProduct.image_url && (
                      <img
                        src={selectedProduct.image_url}
                        alt={selectedProduct.name}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-slate-50">
                        {selectedProduct.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-slate-400">
                        {getPriceLabel(selectedProduct)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-slate-400">
                        Type: {getProductTypeLabel(selectedProduct)} | Stock: {selectedProduct.quantity}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                    Quantity
                  </label>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                      className="p-2 rounded-full bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Minus className="w-5 h-5" />
                    </button>
                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      min="1"
                      max={selectedProduct.quantity}
                      className="flex-1 text-center text-lg font-bold text-gray-900 dark:text-slate-300 bg-white dark:bg-slate-800 border-2 border-gray-300 dark:border-slate-600 rounded-lg px-4 py-2"
                    />
                    <button
                      onClick={() => setQuantity(Math.min(selectedProduct.quantity, quantity + 1))}
                      disabled={quantity >= selectedProduct.quantity}
                      className="p-2 rounded-full bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <Button onClick={addToCart} fullWidth>
                  Add to Cart
                </Button>
              </div>
            )}

            {/* Products Grid */}
            {!selectedProduct && availableProducts.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-3">
                  Available Products ({availableProducts.length})
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-2 gap-6 max-h-[600px] overflow-y-auto">
                  {filteredProducts.map((product) => (
                    <button
                      key={product.id}
                      onClick={() => setSelectedProduct(product)}
                      className="card p-4 hover:shadow-md transition-all duration-200 hover:scale-105 text-left"
                    >
                      {/* Image */}
                      <div className="aspect-square w-full rounded-lg overflow-hidden bg-gray-100 dark:bg-slate-700 mb-3">
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.name || 'Product'}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-slate-500">
                            <span className="text-sm">No Image</span>
                          </div>
                        )}
                      </div>

                      {/* Product Info */}
                      <div className="space-y-2">
                        <h3 className="font-semibold text-gray-900 dark:text-slate-50 truncate">
                          {product.name || 'Unnamed Product'}
                        </h3>
                        <p className="text-lg font-bold text-blue-500 dark:text-purple-500">
                          {getPriceLabel(product)}
                        </p>
                        <div className="flex items-center justify-between">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              product.quantity >= 10
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                                : product.quantity >= 5
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                            }`}
                          >
                            {product.quantity} in stock
                          </span>
                          {product.category && (
                            <span className="text-xs text-gray-500 dark:text-slate-400 capitalize">
                              {product.category}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </Card>

          {/* Right Column: Cart & Summary */}
          <div className="space-y-6">
            {/* Shopping Cart */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-50 mb-4">
                2. Review Cart ({cart.length} {cart.length === 1 ? 'item' : 'items'})
              </h2>

              {cart.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingCart className="w-12 h-12 text-gray-400 dark:text-slate-500 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-slate-400">Cart is empty</p>
                  <p className="text-sm text-gray-400 dark:text-slate-500 mt-1">
                    Add products from the left panel
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {cart.map((item) => (
                    <div
                      key={item.product.id}
                      className="p-4 rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800"
                    >
                      <div className="flex items-start gap-3">
                        {item.product.image_url && (
                          <img
                            src={item.product.image_url}
                            alt={item.product.name}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 dark:text-slate-50 truncate">
                            {item.product.name}
                          </h4>
                          <p className="text-xs text-gray-500 dark:text-slate-400">
                            {getProductTypeLabel(item.product)}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <button
                              onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                              className="p-1 rounded bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="text-sm font-medium w-8 text-center">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                              disabled={item.quantity >= item.product.quantity}
                              className="p-1 rounded bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 disabled:opacity-50"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                            <span className="text-sm text-gray-500 dark:text-slate-400 ml-auto">
                              UGX {((item.product.price_per_unit || item.product.price || 0) * item.quantity).toLocaleString()}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Total Summary */}
            {cart.length > 0 && (
              <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-slate-800 dark:to-purple-900">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-50 mb-4">
                  3. Confirm Sale
                </h2>

                <div className="space-y-3">
                  <div className="flex justify-between text-lg">
                    <span className="text-gray-700 dark:text-slate-300">Subtotal:</span>
                    <span className="font-medium text-gray-900 dark:text-slate-50">
                      UGX {subtotal.toLocaleString()}
                    </span>
                  </div>

                  {discount > 0 && ownerSettings && (
                    <div className="flex justify-between text-lg text-green-600 dark:text-green-400">
                      <span>Discount ({ownerSettings.discount_percentage}%):</span>
                      <span>-UGX {discount.toLocaleString()}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-3xl font-bold text-blue-600 dark:text-blue-400 border-t border-gray-300 dark:border-slate-600 pt-3">
                    <span>Final Total:</span>
                    <span>UGX {finalTotal.toLocaleString()}</span>
                  </div>
                </div>

                {/* Amount Given & Change */}
                <div className="mt-6 space-y-4 pt-4 border-t border-gray-300 dark:border-slate-600">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                      Amount Given
                    </label>
                    <input
                      type="number"
                      value={amountGiven}
                      onChange={(e) => setAmountGiven(e.target.value)}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-50 text-lg font-semibold focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                    />
                  </div>

                  {amountGiven && (
                    <div className="space-y-2">
                      {!isAmountSufficient && (
                        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                          <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                            Insufficient amount! Need UGX {(finalTotal - parseFloat(amountGiven || 0)).toLocaleString()} more.
                          </p>
                        </div>
                      )}
                      
                      {isAmountSufficient && change > 0 && (
                        <div className="flex justify-between items-center p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-700">
                          <span className="text-lg font-semibold text-gray-900 dark:text-slate-50">
                            Change:
                          </span>
                          <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                            UGX {change.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                      )}

                      {isAmountSufficient && change === 0 && (
                        <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                          <p className="text-sm text-blue-600 dark:text-blue-400 font-medium text-center">
                            Exact amount - No change needed
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <Button
                  onClick={submitSale}
                  fullWidth
                  loading={submitting}
                  disabled={!isAmountSufficient}
                  className="mt-6 py-4 text-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Check className="w-5 h-5 mr-2" />
                  Confirm Sale
                </Button>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}


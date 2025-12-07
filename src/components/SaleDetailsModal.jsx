import { X } from 'lucide-react'
import Modal from './Modal'

export default function SaleDetailsModal({ sale, isOpen, onClose }) {
  if (!sale) return null

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatCurrency = (amount) => {
    return `UGX ${parseFloat(amount || 0).toLocaleString()}`
  }

  // Handle multi-item sales
  const saleItems = sale.items || []
  const totalQuantity = saleItems.reduce((sum, item) => sum + (item.quantity_sold || 0), 0)

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-50">
              Sale Details
            </h2>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 font-mono">
              ID: {sale.id}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Timestamp */}
        <div className="mb-6 p-3 rounded-lg bg-gray-50 dark:bg-slate-800">
          <p className="text-sm text-gray-600 dark:text-slate-400">
            {formatDate(sale.sale_date || sale.created_at)}
          </p>
        </div>

        {/* Products Information */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-3 uppercase tracking-wide">
            Products ({saleItems.length})
          </h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {saleItems.length > 0 ? (
              saleItems.map((item, index) => (
                <div
                  key={item.id || index}
                  className="flex items-start gap-4 p-4 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                >
                  {item.product?.image_url && (
                    <img
                      src={item.product.image_url}
                      alt={item.product.name}
                      className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-lg font-bold text-gray-900 dark:text-slate-50 mb-1">
                      {item.product?.name || 'Unknown Product'}
                    </h4>
                    {item.product?.category && (
                      <span className="inline-block px-2 py-1 text-xs font-medium rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 mb-2">
                        {item.product.category}
                      </span>
                    )}
                    <div className="grid grid-cols-2 gap-3 mt-3">
                      <div>
                        <p className="text-xs text-gray-500 dark:text-slate-400">Quantity</p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-slate-50">
                          {item.quantity_sold || 0} units
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-slate-400">Unit Price</p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-slate-50">
                          {formatCurrency(item.unit_price || 0)}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-xs text-gray-500 dark:text-slate-400">Line Total</p>
                        <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                          {formatCurrency(item.line_total || 0)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-center">
                <p className="text-sm text-gray-500 dark:text-slate-400">No products found</p>
              </div>
            )}
          </div>
        </div>

        {/* Sale Summary */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-3 uppercase tracking-wide">
            Sale Summary
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 rounded-lg bg-gray-50 dark:bg-slate-800">
              <span className="text-sm text-gray-600 dark:text-slate-400">
                Total Quantity
              </span>
              <span className="text-sm font-semibold text-gray-900 dark:text-slate-50">
                {totalQuantity} units
              </span>
            </div>
            {sale.subtotal && (
              <div className="flex justify-between items-center p-3 rounded-lg bg-gray-50 dark:bg-slate-800">
                <span className="text-sm text-gray-600 dark:text-slate-400">
                  Subtotal
                </span>
                <span className="text-sm font-semibold text-gray-900 dark:text-slate-50">
                  {formatCurrency(sale.subtotal)}
                </span>
              </div>
            )}
            {sale.discount_amount > 0 && (
              <div className="flex justify-between items-center p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
                <span className="text-sm text-emerald-700 dark:text-emerald-400">
                  Discount ({sale.discount_percentage || 0}%)
                </span>
                <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                  -{formatCurrency(sale.discount_amount)}
                </span>
              </div>
            )}
            <div className="flex justify-between items-center p-4 rounded-lg bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/10 border-2 border-blue-200 dark:border-blue-700">
              <span className="text-base font-semibold text-gray-900 dark:text-slate-50">
                Final Total
              </span>
              <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {formatCurrency(sale.final_total || sale.subtotal || 0)}
              </span>
            </div>
          </div>
        </div>

        {/* Worker Information */}
        {sale.worker && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-3 uppercase tracking-wide">
              Worker Information
            </h3>
            <div className="p-4 rounded-lg border border-gray-200 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <span className="text-blue-600 dark:text-blue-400 font-semibold">
                    {sale.worker.business_name?.[0]?.toUpperCase() ||
                      sale.worker.username?.[0]?.toUpperCase() ||
                      'W'}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 dark:text-slate-50">
                    {sale.worker.business_name || sale.worker.username || 'Unknown Worker'}
                  </p>
                  {sale.worker.phone_number && (
                    <p className="text-sm text-gray-600 dark:text-slate-400">
                      {sale.worker.phone_number}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-slate-700">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  )
}

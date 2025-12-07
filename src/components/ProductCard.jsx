import { Edit, Trash2 } from 'lucide-react'
import Button from './Button'

export default function ProductCard({ product, onEdit, onDelete, isOwner = true }) {
  const getQuantityColor = (quantity) => {
    if (quantity >= 10) return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
    if (quantity >= 5) return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
    return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
  }

  return (
    <div className="card p-4 hover:shadow-md transition-all duration-200 hover:scale-105">
      {/* Image */}
      <div className="aspect-square w-full rounded-lg overflow-hidden bg-gray-100 dark:bg-slate-700 mb-3">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
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
          {product.name}
        </h3>
        <p className="text-lg font-bold text-blue-500 dark:text-purple-500">
          UGX {Number(product.price).toLocaleString()}
        </p>
        <div className="flex items-center justify-between">
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${getQuantityColor(
              product.quantity
            )}`}
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

      {/* Actions */}
      {isOwner && (
        <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-slate-700">
          <Button
            variant="secondary"
            size="sm"
            fullWidth
            onClick={() => onEdit(product)}
          >
            <Edit className="w-4 h-4 mr-1" />
            Edit
          </Button>
          <Button
            variant="danger"
            size="sm"
            fullWidth
            onClick={() => onDelete(product)}
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Delete
          </Button>
        </div>
      )}
    </div>
  )
}


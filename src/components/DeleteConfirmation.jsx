import { AlertTriangle } from 'lucide-react'
import Modal from './Modal'
import Button from './Button'

export default function DeleteConfirmation({
  isOpen,
  onClose,
  product,
  onConfirm,
  loading = false,
}) {
  if (!product) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm" title="">
      <div className="space-y-4">
        <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 dark:bg-red-900/30 rounded-full">
          <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
        </div>

        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-50 mb-2">
            Delete Product?
          </h3>
          <p className="text-sm text-gray-600 dark:text-slate-400">
            Are you sure you want to delete <strong>{product.name}</strong>?
          </p>
          <p className="text-xs text-gray-500 dark:text-slate-500 mt-1">
            This action cannot be undone.
          </p>
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            variant="secondary"
            fullWidth
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            fullWidth
            onClick={onConfirm}
            loading={loading}
          >
            Yes, Delete
          </Button>
        </div>
      </div>
    </Modal>
  )
}


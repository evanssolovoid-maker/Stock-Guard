import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import Modal from './Modal'
import Button from './Button'

export default function RemoveWorkerConfirmation({
  isOpen,
  onClose,
  worker,
  onConfirm,
  loading = false,
}) {
  const [confirmed, setConfirmed] = useState(false)

  const handleClose = () => {
    setConfirmed(false)
    onClose()
  }

  const handleConfirm = () => {
    if (confirmed && onConfirm) {
      onConfirm()
    }
  }

  const workerName = worker?.worker?.business_name || worker?.worker?.email || worker?.email || 'this worker'

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="sm" title="">
      <div className="p-6">
        <div className="text-center mb-6">
          <div className="mx-auto w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-slate-50 mb-2">
            Remove {workerName}?
          </h3>
          <p className="text-sm text-gray-600 dark:text-slate-400">
            This worker will lose access to your business. Their sales history will be preserved.
          </p>
        </div>

        <div className="mb-6">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="mt-1 w-4 h-4 text-blue-600 dark:text-blue-400 border-gray-300 dark:border-slate-600 rounded focus:ring-blue-500 dark:focus:ring-blue-400"
            />
            <span className="text-sm text-gray-700 dark:text-slate-300">
              I understand this action and want to proceed
            </span>
          </label>
        </div>

        <div className="flex gap-3">
          <Button variant="secondary" onClick={handleClose} fullWidth disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            fullWidth
            disabled={!confirmed || loading}
            loading={loading}
            className="bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 text-white"
          >
            Remove Worker
          </Button>
        </div>
      </div>
    </Modal>
  )
}




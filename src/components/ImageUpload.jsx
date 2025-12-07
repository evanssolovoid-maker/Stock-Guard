import { useState, useRef } from 'react'
import { Upload, X, Loader2, Camera, Image as ImageIcon } from 'lucide-react'
import { productsService } from '../services/products.service'

export default function ImageUpload({ value, onChange, productId, error }) {
  const [preview, setPreview] = useState(value || null)
  const [uploading, setUploading] = useState(false)
  const [showOptions, setShowOptions] = useState(false)
  const fileInputRef = useRef(null)
  const cameraInputRef = useRef(null)

  const handleFileSelect = async (file) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    // Validate file size (20MB)
    if (file.size > 20 * 1024 * 1024) {
      alert('Image size must be less than 20MB')
      return
    }

    // Validate file extension
    const validExtensions = ['jpg', 'jpeg', 'png']
    const fileExt = file.name.split('.').pop().toLowerCase()
    if (!validExtensions.includes(fileExt)) {
      alert('Please select a PNG or JPG image')
      return
    }

    setUploading(true)

    try {
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result)
      }
      reader.readAsDataURL(file)

      // Upload to Supabase if productId exists (for edit mode)
      if (productId) {
        const imageUrl = await productsService.uploadProductImage(file, productId)
        onChange(imageUrl)
      } else {
        // For new products, store file temporarily
        onChange(file)
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert('Failed to upload image. Please try again.')
      setPreview(null)
    } finally {
      setUploading(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    const file = e.dataTransfer.files[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDragOver = (e) => {
    // Only prevent default if event is cancelable (not passive)
    if (e.cancelable) {
      e.preventDefault()
    }
  }

  const handleRemove = () => {
    setPreview(null)
    onChange(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    if (cameraInputRef.current) {
      cameraInputRef.current.value = ''
    }
    setShowOptions(false)
  }

  const handleGalleryClick = () => {
    fileInputRef.current?.click()
    setShowOptions(false)
  }

  const handleCameraClick = () => {
    cameraInputRef.current?.click()
    setShowOptions(false)
  }

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
        Product Image
      </label>

      {preview ? (
        <div className="relative">
          <div className="relative w-full h-48 rounded-lg overflow-hidden border border-gray-200 dark:border-slate-700">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-full object-cover"
            />
            {uploading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-white animate-spin" />
              </div>
            )}
            <button
              type="button"
              onClick={handleRemove}
              disabled={uploading}
              className="absolute top-2 right-2 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors disabled:opacity-50 shadow-lg"
              aria-label="Remove image"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Hidden file inputs */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/jpg"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleFileSelect(file)
            }}
            className="hidden"
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/jpeg,image/png,image/jpg"
            capture="environment"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleFileSelect(file)
            }}
            className="hidden"
          />

          {/* Upload area */}
          {!showOptions ? (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => {
                // On mobile, show options. On desktop, open file picker directly
                if (window.innerWidth <= 768) {
                  setShowOptions(true)
                } else {
                  fileInputRef.current?.click()
                }
              }}
              className="relative border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-lg p-6 sm:p-8 bg-gray-50 dark:bg-slate-800 hover:border-blue-500 dark:hover:border-purple-500 active:border-blue-600 dark:active:border-purple-600 transition-colors cursor-pointer touch-manipulation"
            >
              <div className="flex flex-col items-center justify-center text-center">
                <Upload className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 dark:text-slate-500 mb-3 sm:mb-4" />
                <p className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Tap to upload image
                </p>
                <p className="text-xs text-gray-500 dark:text-slate-400">
                  PNG, JPG up to 20MB
                </p>
                <p className="text-xs text-gray-400 dark:text-slate-500 mt-1 sm:hidden">
                  Camera or Gallery
                </p>
              </div>
            </div>
          ) : (
            /* Mobile options menu */
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleCameraClick}
                  className="flex flex-col items-center justify-center p-6 border-2 border-blue-500 dark:border-purple-500 rounded-lg bg-blue-50 dark:bg-purple-900/20 hover:bg-blue-100 dark:hover:bg-purple-900/30 active:bg-blue-200 dark:active:bg-purple-900/40 transition-colors touch-manipulation"
                >
                  <Camera className="w-8 h-8 text-blue-600 dark:text-purple-400 mb-2" />
                  <span className="text-sm font-medium text-blue-700 dark:text-purple-300">
                    Take Photo
                  </span>
                </button>
                <button
                  type="button"
                  onClick={handleGalleryClick}
                  className="flex flex-col items-center justify-center p-6 border-2 border-blue-500 dark:border-purple-500 rounded-lg bg-blue-50 dark:bg-purple-900/20 hover:bg-blue-100 dark:hover:bg-purple-900/30 active:bg-blue-200 dark:active:bg-purple-900/40 transition-colors touch-manipulation"
                >
                  <ImageIcon className="w-8 h-8 text-blue-600 dark:text-purple-400 mb-2" />
                  <span className="text-sm font-medium text-blue-700 dark:text-purple-300">
                    Choose from Gallery
                  </span>
                </button>
              </div>
              <button
                type="button"
                onClick={() => setShowOptions(false)}
                className="w-full py-2 text-sm text-gray-600 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </>
      )}

      {error && (
        <p className="mt-1 text-sm text-red-500 dark:text-red-400">{error}</p>
      )}
    </div>
  )
}


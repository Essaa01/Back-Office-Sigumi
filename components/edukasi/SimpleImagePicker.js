import React, { useRef, useState } from 'react'
import { Image as ImageIcon, X, Upload } from 'lucide-react'

export default function SimpleImagePicker({ value, onChange, onFileSelect }) {
  const fileInputRef = useRef(null)
  const [preview, setPreview] = useState(value || null)

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Format file tidak didukung. Harap pilih gambar (JPG/PNG).')
        return
      }
      onFileSelect(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result)
        onChange(reader.result) // Temporarily set to base64 preview
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemove = () => {
    setPreview(null)
    onChange('')
    onFileSelect(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
        Cover Gambar Edukasi (JPG/PNG)
      </label>
      
      <div className="mt-2">
        {preview ? (
          <div className="relative inline-block border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-800">
            <img 
              src={preview} 
              alt="Preview" 
              className="max-h-[300px] w-auto object-contain"
            />
            <button
              type="button"
              onClick={handleRemove}
              className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-1.5 rounded-full transition-colors shadow-md"
              title="Hapus gambar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 bg-gray-50 hover:bg-blue-50 dark:bg-gray-800/50 dark:hover:bg-blue-900/20 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors text-center"
          >
            <div className="bg-white dark:bg-gray-900 p-3 rounded-full shadow-sm mb-3">
              <Upload className="w-6 h-6 text-gray-500 dark:text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Klik untuk memilih cover gambar
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Format yang didukung: JPG, JPEG, PNG
            </p>
          </div>
        )}
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/png, image/jpeg, image/jpg"
        className="hidden"
      />
    </div>
  )
}

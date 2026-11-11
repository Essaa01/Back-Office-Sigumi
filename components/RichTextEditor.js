"use client"

import React, { useRef, useState, useEffect, useCallback } from 'react'
import { Editor } from '@tinymce/tinymce-react'
import { uploadMedia } from '@/services/uploadService'
import { useTheme } from 'next-themes'
import { toast } from 'sonner'
import { ImagePlus, Loader2 } from 'lucide-react'

function escapeHtmlAttr(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

export default function RichTextEditor({ value, onChange, placeholder }) {
  const editorRef = useRef(null)
  const fileInputRef = useRef(null)
  const currentContentRef = useRef(value || '')
  const [initialContent] = useState(() => value || '')
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const { theme } = useTheme()

  // Sinkronisasi konten saat `value` berubah dari LUAR (misal: fetch API / reset form)
  useEffect(() => {
    if (!editorRef.current) return

    const normalizedValue = value ?? ''

    // Jika perubahan berasal dari ketikan user di dalam TinyMCE, jangan setContent
    // agar cursor tidak lari ke atas dan stack undo/redo tidak terhapus
    if (normalizedValue === currentContentRef.current) {
      return
    }

    // Jika nilai dari parent memang berbeda dengan isi DOM editor saat ini
    const currentEditorContent = editorRef.current.getContent()
    if (normalizedValue !== currentEditorContent) {
      currentContentRef.current = normalizedValue
      editorRef.current.setContent(normalizedValue)
      editorRef.current.undoManager?.clear()
      editorRef.current.undoManager?.add()
    }
  }, [value])

  const handleEditorChange = useCallback((newContent) => {
    currentContentRef.current = newContent
    if (onChange) {
      onChange(newContent)
    }
  }, [onChange])

  const handleImageUpload = async (blobInfo) => {
    try {
      const file = blobInfo.blob()
      if (!file.name && typeof blobInfo.filename === 'function') {
        file.name = blobInfo.filename()
      }
      const url = await uploadMedia(file)
      return url
    } catch (error) {
      console.error("Image upload failed:", error)
      throw new Error('Image upload failed')
    }
  }

  const handleFilePicker = (callback, _value, meta) => {
    const input = document.createElement('input')
    input.setAttribute('type', 'file')
    input.setAttribute(
      'accept',
      meta?.filetype === 'media'
        ? 'video/mp4,video/webm,image/*'
        : 'image/png,image/jpeg,image/jpg,image/webp,image/gif,image/svg+xml'
    )

    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return

      const loadingToast = toast.loading('Mengunggah gambar ke storage...')
      try {
        setIsUploadingImage(true)
        const url = await uploadMedia(file)
        toast.dismiss(loadingToast)
        toast.success('Gambar berhasil diunggah')
        callback(url, { alt: file.name, title: file.name })
      } catch (err) {
        console.error('File picker upload failed:', err)
        toast.dismiss(loadingToast)
        toast.error('Gagal mengunggah gambar')
      } finally {
        setIsUploadingImage(false)
      }
    }

    input.click()
  }

  const handleDirectImageInsert = async (e) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    const validFiles = files.filter((f) => f.type.startsWith('image/'))
    if (validFiles.length === 0) {
      toast.error('Format file tidak didukung. Pilih gambar (JPG, PNG, WEBP, GIF, SVG).')
      e.target.value = ''
      return
    }

    const loadingToast = toast.loading(
      validFiles.length > 1
        ? `Mengunggah ${validFiles.length} gambar ke deskripsi...`
        : 'Mengunggah gambar ke deskripsi...'
    )

    try {
      setIsUploadingImage(true)

      for (const file of validFiles) {
        const publicUrl = await uploadMedia(file)
        const safeUrl = escapeHtmlAttr(publicUrl)
        const safeAlt = escapeHtmlAttr(file.name.replace(/\.[^/.]+$/, ''))
        const imgHtml = `<p><img src="${safeUrl}" alt="${safeAlt}" style="max-width: 100%; height: auto; border-radius: 8px;" /></p>`

        if (editorRef.current) {
          editorRef.current.focus()
          editorRef.current.insertContent(imgHtml)
          const updated = editorRef.current.getContent()
          currentContentRef.current = updated
          if (onChange) onChange(updated)
        } else {
          const updated = `${currentContentRef.current || ''}${imgHtml}`
          currentContentRef.current = updated
          if (onChange) onChange(updated)
        }
      }

      toast.dismiss(loadingToast)
      toast.success('Gambar berhasil ditambahkan ke deskripsi')
    } catch (err) {
      console.error('Direct image insert failed:', err)
      toast.dismiss(loadingToast)
      toast.error('Gagal mengunggah gambar ke deskripsi')
    } finally {
      setIsUploadingImage(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  return (
    <div className="space-y-2">
      {/* Quick Upload Image Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-lg bg-blue-50/70 dark:bg-blue-950/20 border border-blue-200/70 dark:border-blue-800/40">
        <span className="text-xs text-gray-600 dark:text-gray-300">
          Sisipkan gambar penjelasan ke dalam isi deskripsi (otomatis tersimpan di bucket &amp; tampil di aplikasi mobile):
        </span>
        <button
          type="button"
          disabled={isUploadingImage}
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-xs cursor-pointer"
        >
          {isUploadingImage ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <ImagePlus className="w-3.5 h-3.5" />
          )}
          <span>{isUploadingImage ? 'Mengunggah...' : 'Tambah Gambar ke Deskripsi'}</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/png,image/jpeg,image/jpg,image/webp,image/gif,image/svg+xml"
          onChange={handleDirectImageInsert}
          className="hidden"
        />
      </div>

      <div className={`overflow-hidden rounded-lg border border-gray-300 dark:border-gray-700 ${theme === 'dark' ? 'dark-editor' : ''}`}>
        <Editor
          apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY || "vmhieg4i35y0m1crryeb6vwexsua04kf9vw023l6o4zhc8sl"}
          onInit={(evt, editor) => {
            editorRef.current = editor
            const contentToSet = value ?? initialContent ?? ''
            if (contentToSet && editor.getContent() !== contentToSet) {
              editor.setContent(contentToSet)
              currentContentRef.current = contentToSet
              editor.undoManager?.clear()
              editor.undoManager?.add()
            }
          }}
          initialValue={initialContent}
          onEditorChange={handleEditorChange}
          init={{
            height: 500,
            menubar: false,
            plugins: [
              'advlist', 'lists', 'link', 'image', 'charmap', 'preview',
              'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
              'insertdatetime', 'media', 'table', 'help', 'wordcount'
            ],
            toolbar: 'undo redo | blocks | ' +
              'bold italic forecolor | alignleft aligncenter ' +
              'alignright alignjustify | bullist numlist outdent indent | ' +
              'removeformat | link image media | help',
            content_style: 'body { font-family:Inter,Helvetica,Arial,sans-serif; font-size:14px; } img { max-width: 100%; height: auto; border-radius: 8px; }',
            images_upload_handler: handleImageUpload,
            file_picker_types: 'image media',
            file_picker_callback: handleFilePicker,
            automatic_uploads: true,
            paste_data_images: true,
            relative_urls: false,
            remove_script_host: false,
            convert_urls: true,
            smart_paste: false,
            paste_postprocess: (plugin, args) => {
              if (args.node) {
                const links = args.node.querySelectorAll('a')
                links.forEach(link => {
                  while (link.firstChild) {
                    link.parentNode.insertBefore(link.firstChild, link)
                  }
                  link.remove()
                })
                // Hapus gambar dengan src lokal file:/// dari copy-paste MS Word yang tidak bisa diakses mobile
                const imgs = args.node.querySelectorAll('img')
                imgs.forEach(img => {
                  const src = img.getAttribute('src') || ''
                  if (src.startsWith('file://')) {
                    img.remove()
                  }
                })
              }
            },
            skin: theme === 'dark' ? 'oxide-dark' : 'oxide',
            content_css: theme === 'dark' ? 'dark' : 'default',
            placeholder: placeholder || 'Tuliskan konten lengkap di sini...',
            license_key: 'gpl',
          }}
        />
      </div>
    </div>
  )
}

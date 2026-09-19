"use client"

import React, { useRef } from 'react'
import { Editor } from '@tinymce/tinymce-react'
import { uploadMedia } from '@/services/uploadService'
import { useTheme } from 'next-themes'

export default function RichTextEditor({ value, onChange, placeholder }) {
  const editorRef = useRef(null)
  const { theme } = useTheme()

  const handleImageUpload = async (blobInfo, progress) => {
    try {
      const file = blobInfo.blob()
      const url = await uploadMedia(file)
      return url
    } catch (error) {
      console.error("Image upload failed:", error)
      throw new Error('Image upload failed')
    }
  }

  return (
    <div className={`overflow-hidden rounded-lg border border-gray-300 dark:border-gray-700 ${theme === 'dark' ? 'dark-editor' : ''}`}>
      <Editor
        apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY || "vmhieg4i35y0m1crryeb6vwexsua04kf9vw023l6o4zhc8sl"}
        onInit={(evt, editor) => editorRef.current = editor}
        value={value}
        onEditorChange={onChange}
        init={{
          height: 500,
          menubar: false,
          plugins: [
            'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
            'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
            'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount'
          ],
          toolbar: 'undo redo | blocks | ' +
            'bold italic forecolor | alignleft aligncenter ' +
            'alignright alignjustify | bullist numlist outdent indent | ' +
            'removeformat | image media | help',
          content_style: 'body { font-family:Inter,Helvetica,Arial,sans-serif; font-size:14px; }',
          images_upload_handler: handleImageUpload,
          automatic_uploads: true,
          skin: theme === 'dark' ? 'oxide-dark' : 'oxide',
          content_css: theme === 'dark' ? 'dark' : 'default',
          placeholder: placeholder || 'Tuliskan materi edukasi lengkap di sini...',
          license_key: 'gpl',
        }}
      />
    </div>
  )
}

"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { supabase } from "@/lib/supabase/client"
import Link from "next/link"
import { ArrowLeft, Clock, Calendar, BookOpen, Edit } from "lucide-react"
import EducationalMediaViewer from "@/components/edukasi/EducationalMediaViewer"

const categoryColors = {
  "Siaga 1": "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
  "Siaga 2": "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20",
  "Siaga 3": "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20",
  "Siaga 4": "bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20",
}

const audienceColors = {
  "Umum": "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20",
  "Anak-Anak": "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20",
  "Difabel": "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-500/10 dark:text-teal-400 dark:border-teal-500/20",
}

export default function DetailEdukasi() {
  const { id } = useParams()

  const [edukasi, setEdukasi] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase
        .from("educations")
        .select("*")
        .eq("id", id)
        .single()

      if (error) {
        console.error(error)
        return
      }

      setEdukasi(data)
    }

    if (id) fetchData()
  }, [id])

  if (!edukasi) {
    return (
      <div className="min-h-screen p-6 md:p-10 flex items-center justify-center font-sans">
        <div className="flex items-center gap-3 text-gray-500">
          <div className="w-5 h-5 border-2 border-gray-300 dark:border-gray-600 border-t-blue-500 rounded-full animate-spin"></div>
          <span className="text-sm font-medium">Memuat konten edukasi...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-6 md:p-10 font-sans max-w-4xl mx-auto">

      {/* Top Header Navigation & Action */}
      <div className="flex items-center justify-between mb-6">
        <Link
          href="/edukasi"
          className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Katalog Edukasi
        </Link>

        <Link
          href={`/edukasi/${edukasi.id}/edit`}
          className="inline-flex items-center gap-2 text-xs font-semibold px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-sm"
        >
          <Edit className="w-3.5 h-3.5" />
          Revisi / Ubah Animasi
        </Link>
      </div>

      <article className="bg-white dark:bg-[#1a1a2e] rounded-xl shadow-sm border border-gray-200 dark:border-white/10 overflow-hidden">

        {/* Animated Banner Media */}
        {edukasi.image_url ? (
          <div className="w-full aspect-video md:aspect-[21/9] bg-gray-950 border-b border-gray-200 dark:border-white/10 relative overflow-hidden">
            <EducationalMediaViewer
              src={edukasi.image_url}
              alt={edukasi.title}
              showBadge={true}
              objectFit="cover"
            />
          </div>
        ) : (
          <div className="w-full aspect-video md:aspect-[21/9] bg-indigo-50/50 dark:bg-indigo-900/10 border-b border-gray-200 dark:border-white/10 flex items-center justify-center">
            <BookOpen className="w-16 h-16 text-indigo-300/50 dark:text-indigo-400/20" />
          </div>
        )}


        {/* Content Body */}
        <div className="p-6 md:p-10">
          {/* Header Metadata */}
          <div className="flex flex-wrap items-center gap-3 mb-4 text-xs font-medium text-gray-500 dark:text-gray-400">
            {edukasi.audience && (
              <span className={`px-2.5 py-1 rounded-md border font-semibold ${audienceColors[edukasi.audience] || "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20"}`}>
                Audiens: {edukasi.audience}
              </span>
            )}
            {edukasi.category && (
              <span className={`px-2.5 py-1 rounded-md border font-semibold ${categoryColors[edukasi.category] || "bg-gray-50 text-gray-600 border-gray-200 dark:bg-white/5 dark:text-gray-400 dark:border-white/10"}`}>
                {edukasi.category}
              </span>
            )}
            <span className="px-2.5 py-1 rounded-md border font-semibold bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20">
              Wilayah: {edukasi.lokasi || "Semua Wilayah"}
            </span>
            {edukasi.created_at && (
              <span className="flex items-center gap-1.5 bg-gray-100 dark:bg-white/5 px-2.5 py-1 rounded-md border border-gray-200 dark:border-white/5">
                <Calendar className="w-3.5 h-3.5" />
                Publikasi: {new Date(edukasi.created_at).toLocaleDateString("id-ID", {
                  day: "numeric", month: "long", year: "numeric",
                })}
              </span>
            )}
            {edukasi.updated_at && edukasi.updated_at !== edukasi.created_at && (
              <span className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-500 px-2.5 py-1 rounded-md border border-amber-200 dark:border-amber-500/20">
                <Clock className="w-3.5 h-3.5" />
                Revisi: {new Date(edukasi.updated_at).toLocaleDateString("id-ID", {
                  day: "numeric", month: "long", year: "numeric"
                })}
              </span>
            )}
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white leading-tight mb-8 tracking-tight">
            {edukasi.title}
          </h1>

          {/* Prose */}
          <div 
            className="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 leading-loose text-base md:text-[1.05rem]"
            dangerouslySetInnerHTML={{ __html: edukasi.content }}
          />
        </div>

      </article>

      {/* Footer Meta */}
      <div className="mt-6 flex justify-between items-center text-xs text-gray-400 font-mono">
        <span>Sys_ID: {edukasi.id}</span>
      </div>
    </div>
  )
}

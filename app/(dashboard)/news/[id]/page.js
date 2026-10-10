"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase/client"
import Link from "next/link"
import { ArrowLeft, Clock, Calendar, Newspaper } from "lucide-react"

export default function DetailNews() {
  const { id } = useParams()
  const router = useRouter()

  const [news, setNews] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase
        .from("news")
        .select("*")
        .eq("id", id)
        .single()

      if (error) {
        console.error(error)
        return
      }

      setNews(data)
    }

    if (id) fetchData()
  }, [id])

  if (!news) {
    return (
      <div className="min-h-screen p-6 md:p-10 flex items-center justify-center font-sans">
        <div className="flex items-center gap-3 text-gray-500">
          <div className="w-5 h-5 border-2 border-gray-300 dark:border-gray-600 border-t-blue-500 rounded-full animate-spin"></div>
          <span className="text-sm font-medium">Memuat publikasi...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-6 md:p-10 font-sans max-w-4xl mx-auto">
      
      {/* Back Navigation */}
      <Link
        href="/news"
        className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Katalog Berita
      </Link>

      <article className="bg-white dark:bg-[#1a1a2e] rounded-xl shadow-sm border border-gray-200 dark:border-white/10 overflow-hidden">
        
        {/* Banner Image */}
        {news.image_url ? (
            <div className="w-full aspect-video md:aspect-[21/9] bg-gray-100 dark:bg-white/5 border-b border-gray-200 dark:border-white/10 relative">
                <img
                    src={news.image_url}
                    alt={news.title}
                    className="w-full h-full object-cover"
                />
            </div>
        ) : (
            <div className="w-full aspect-video md:aspect-[21/9] bg-indigo-50/50 dark:bg-indigo-900/10 border-b border-gray-200 dark:border-white/10 flex items-center justify-center">
                <Newspaper className="w-16 h-16 text-indigo-300/50 dark:text-indigo-400/20" />
            </div>
        )}

        {/* Content Body */}
        <div className="p-6 md:p-10">
            {/* Header Metadata */}
            <div className="flex flex-wrap items-center gap-4 mb-4 text-xs font-medium text-gray-500 dark:text-gray-400">
                {news.created_at && (
                    <span className="flex items-center gap-1.5 bg-gray-100 dark:bg-white/5 px-2.5 py-1 rounded-md border border-gray-200 dark:border-white/5">
                        <Calendar className="w-3.5 h-3.5" />
                        Publikasi: {new Date(news.created_at).toLocaleDateString("id-ID", {
                            day: "numeric", month: "long", year: "numeric",
                        })}
                    </span>
                )}
                {news.updated_at && news.updated_at !== news.created_at && (
                    <span className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-500 px-2.5 py-1 rounded-md border border-amber-200 dark:border-amber-500/20">
                        <Clock className="w-3.5 h-3.5" />
                        Revisi: {new Date(news.updated_at).toLocaleDateString("id-ID", {
                            day: "numeric", month: "long", year: "numeric"
                        })}
                    </span>
                )}
            </div>

            {/* Title */}
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white leading-tight mb-8 tracking-tight">
                {news.title}
            </h1>

            {/* Prose */}
            <div className="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300">
              {news.content && /<[a-z][\s\S]*>/i.test(news.content) ? (
                <div
                  className="leading-loose text-base md:text-[1.05rem]"
                  dangerouslySetInnerHTML={{ __html: news.content }}
                />
              ) : (
                <p className="whitespace-pre-line leading-loose text-base md:text-[1.05rem]">
                  {news.content}
                </p>
              )}
            </div>
        </div>

      </article>
      
      {/* Footer Meta */}
      <div className="mt-6 flex justify-between items-center text-xs text-gray-400 font-mono">
          <span>Sys_ID: {news.id}</span>
      </div>
    </div>
  )
}
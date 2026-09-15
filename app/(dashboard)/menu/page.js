"use client"

import Link from "next/link"
import { Newspaper, Building2, Map, Tent, MessageSquare, Users, BookOpen } from "lucide-react"

const modules = [
    {
        title: "News",
        description: "Manajemen rilis berita, pengumuman, dan artikel.",
        icon: Newspaper,
        href: "/news",
        available: true,
    },
    {
        title: "Edukasi",
        description: "Kelola materi edukasi kebencanaan untuk aplikasi mobile.",
        icon: BookOpen,
        href: "/edukasi",
        available: true,
    },
    {
        title: "Titik Evakuasi",
        description: "Kelola data operasional posko dan barak evakuasi.",
        icon: Tent,
        href: "/shelters",
        available: true,
    },
    {
        title: "Destinasi Wisata",
        description: "Manajemen katalog pariwisata teritorial.",
        icon: Map,
        href: "/tourism",
        available: true,
    },
    {
        title: "Pelaporan Warga",
        description: "Monitoring dan verifikasi laporan insiden warga.",
        icon: MessageSquare,
        href: "/pelaporan",
        available: true,
    },
    {
        title: "Manajemen User",
        description: "Manajemen hak akses dan informasi akun pengguna.",
        icon: Users,
        href: "/users",
        available: true,
    },
    {
        title: "CCTV Gunung",
        description: "Pemantauan pantauan visual CCTV realtime.",
        icon: Building2,
        href: "#",
        available: false,
    },
]

export default function MenuPage() {
    return (
        <div className="min-h-screen p-6 md:p-10 max-w-7xl mx-auto font-sans">
            {/* Header */}
            <div className="mb-10">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">
                    Menu Utama
                </h1>
            </div>

            {/* Module Cards Grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {modules.map((mod) => (
                    <ModuleCard key={mod.title} module={mod} />
                ))}
            </div>
        </div>
    )
}

function ModuleCard({ module }) {
    const Wrapper = module.available ? Link : "div"
    const wrapperProps = module.available ? { href: module.href } : {}
    const IconComponent = module.icon

    return (
        <Wrapper
            {...wrapperProps}
            className={`group relative flex flex-col p-6 rounded-2xl border
                ${module.available
                    ? "bg-white dark:bg-[#1a1a2e] border-gray-200 dark:border-white/10 hover:border-blue-500/50 dark:hover:border-blue-500/50 hover:shadow-md cursor-pointer transition-all duration-300"
                    : "bg-gray-50/50 dark:bg-black/20 border border-gray-100 dark:border-white/5 opacity-70 cursor-not-allowed"
                }
            `}
        >
            <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-xl border ${module.available
                    ? "bg-blue-50 border-blue-100 text-blue-600 dark:bg-blue-500/10 dark:border-blue-500/20 dark:text-blue-400 group-hover:scale-110 transition-transform duration-300"
                    : "bg-gray-100 border-gray-200 text-gray-500 dark:bg-white/5 dark:border-white/10 dark:text-gray-500"
                    }`}>
                    <IconComponent className="w-6 h-6" />
                </div>

                {!module.available && (
                    <span className="px-2 py-1 bg-gray-200 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-[10px] font-bold uppercase tracking-widest rounded">
                        Soon
                    </span>
                )}
            </div>

            <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1.5">
                    {module.title}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                    {module.description}
                </p>
            </div>

            {module.available && (
                <div className="mt-6 flex items-center justify-between text-sm font-medium text-gray-400 dark:text-gray-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    <span>Akses Modul</span>
                    <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                </div>
            )}
        </Wrapper>
    )
}

"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import brandConfig from "@/config/brand.json";
import { Tabs, TabsList, TabsTrigger } from "@shared/ui/tabs";
import { Menu, X } from "lucide-react";

const navTabs = [
    { id: "value-props", label: "Giá trị" },
    { id: "products", label: "Sản phẩm" },
    // { id: "traceability", label: "Truy xuất" },
    { id: "coto-story", label: "Cô Tô" },
    { id: "sustainability", label: "Bền vững" },
    // { id: "testimonials", label: "Đánh giá" },
    { id: "csr", label: "CSR" },
    { id: "contact", label: "Liên hệ" },
];

export default function Header() {
    const [activeTab, setActiveTab] = useState("");
    const [manualActive, setManualActive] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const handleTabClick = (tabId: string) => {
        setActiveTab(tabId);
        setManualActive(true);
        setTimeout(() => setManualActive(false), 1000); // Reset sau 1s

        const element = document.getElementById(tabId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                let maxVisible = 0;
                let activeId = "";

                entries.forEach((entry) => {
                    if (entry.isIntersecting && entry.intersectionRatio > maxVisible) {
                        maxVisible = entry.intersectionRatio;
                        activeId = entry.target.id;
                    }
                });

                // Nếu không có section nào visible nhiều, kiểm tra scroll position
                if ((!activeId || maxVisible < 0.05) && !manualActive) {
                    const scrollY = window.scrollY + window.innerHeight / 2;
                    const sections = navTabs.map(tab => ({
                        id: tab.id,
                        top: document.getElementById(tab.id)?.offsetTop || 0
                    })).sort((a, b) => a.top - b.top);

                    for (let i = sections.length - 1; i >= 0; i--) {
                        if (scrollY >= sections[i].top) {
                            activeId = sections[i].id;
                            break;
                        }
                    }
                }

                if (activeId && !manualActive) setActiveTab(activeId);
            },
            {
                threshold: 0.1,
                rootMargin: "-80px 0px -20% 0px"
            }
        );

        navTabs.forEach((tab) => {
            const element = document.getElementById(tab.id);
            if (element) observer.observe(element);
        });

        return () => observer.disconnect();
    }, [manualActive]);

    // Close mobile menu when resizing to desktop
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 1024) { // lg breakpoint
                setIsMobileMenuOpen(false);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200">
            <nav className="container mx-auto px-8 md:px-12 lg:px-16 py-2 flex items-center justify-between">
                <button
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    className="flex items-center gap-4 hover:opacity-80 transition-opacity"
                >
                    <div className="relative shrink-0" style={{ width: '52px', height: '52px' }}>
                        <Image
                            src="/logo-short.svg"
                            alt={brandConfig.brand.shortName}
                            fill
                            className="relative z-10 object-contain"
                            style={{
                                // boxShadow: '0 0 30px rgba(243, 174, 0, 0.95), 0 0 50px rgba(255,255,255,0.4)',
                                // filter: 'drop-shadow(0 0 12px rgba(243, 174, 0, 0.8))',
                                transform: 'scale(1.05)',
                                animation: 'glowPulse 3s ease-in-out infinite alternate',
                                animationDelay: '1.5s',
                            }}
                        />
                    </div>
                    <div className="flex flex-col items-start text-left h-full">
                        <span
                            className="text-brand-crystal text-base font-semibold text-shadow-2xs"
                            style={{
                                filter: 'drop-shadow(0 2px 4px rgba(250,204,21,0.3))'
                            }}
                        >
                            HẢI SẢN CÔ TÔ
                        </span>
                        <span
                            className="text-brand-golden animate-pulse text-2xl font-bold text-shadow-2xs m"
                        >
                            NGÀY MỚI
                        </span>
                    </div>
                </button>
                {/* <div className="hidden lg:flex items-center gap-2">
                    <span className="px-1 py-1 text-blue-600 text-xs font-medium">#HảiSảnTươi</span>
                    <span className="px-1 py-1 text-green-600 text-xs font-medium">#AnToàn</span>
                    <span className="px-1 py-1 text-cyan-600 text-xs font-medium">#BềnVững</span>
                </div> */}
                {/* Mobile Menu Button */}
                <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    aria-label="Toggle mobile menu"
                >
                    {isMobileMenuOpen ? (
                        <X className="w-6 h-6 text-gray-700" />
                    ) : (
                        <Menu className="w-6 h-6 text-gray-700" />
                    )}
                </button>
                <div className="hidden lg:flex items-center gap-8">
                    <Tabs value={activeTab} className="w-auto">
                        <TabsList className="bg-transparent h-auto p-0 gap-2">
                            {navTabs.map((tab) => (
                                <TabsTrigger
                                    key={tab.id}
                                    value={tab.id}
                                    className={`${tab.id === 'contact'
                                        ? 'bg-yellow-500 text-gray-900 hover:bg-yellow-400 shadow-md hover:shadow-lg'
                                        : 'data-[state=active]:bg-blue-100 data-[state=active]:text-blue-800 hover:bg-blue-50 text-gray-700'
                                        } px-4 py-2 rounded-full transition-colors border-0 cursor-pointer`}
                                    onClick={() => handleTabClick(tab.id)}
                                >
                                    {tab.label}
                                </TabsTrigger>
                            ))}
                        </TabsList>
                    </Tabs>
                </div>
            </nav>

            {/* Mobile Menu Dropdown */}
            {isMobileMenuOpen && (
                <div className="lg:hidden bg-white border-t border-gray-200 shadow-lg">
                    <div className="container mx-auto px-8 md:px-12 py-4">
                        <div className="flex flex-col space-y-2">
                            {navTabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => {
                                        handleTabClick(tab.id);
                                        setIsMobileMenuOpen(false); // Close menu after click
                                    }}
                                    className={`text-left px-4 py-3 rounded-lg transition-colors ${activeTab === tab.id
                                        ? 'bg-blue-50 text-blue-800 font-medium'
                                        : 'text-gray-700 hover:bg-gray-50'
                                        }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                        <div className="mt-6 pt-4 border-t border-gray-200">
                            <div className="flex flex-wrap gap-2">
                                <span className="px-2 py-1 text-blue-600 text-xs font-medium bg-blue-50 rounded">#HảiSảnTươi</span>
                                <span className="px-2 py-1 text-green-600 text-xs font-medium bg-green-50 rounded">#AnToàn</span>
                                <span className="px-2 py-1 text-cyan-600 text-xs font-medium bg-cyan-50 rounded">#BềnVững</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
}

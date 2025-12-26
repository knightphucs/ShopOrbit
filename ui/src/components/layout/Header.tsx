"use client";

import Link from "next/link";
import { Search, ShoppingBag, User, Menu } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

const Header = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState("");

  // Đồng bộ ô search với URL (nếu user reload trang)
  useEffect(() => {
    setSearchTerm(searchParams.get("search") || "");
  }, [searchParams]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchTerm.trim())}`);
    } else {
      router.push("/products");
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          className="text-2xl font-extrabold text-black tracking-tight flex items-center gap-1"
        >
          ShopOrbit<span className="text-blue-600">.</span>
        </Link>

        {/* Navigation - Desktop */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
          <Link href="/" className="hover:text-black transition-colors">
            Home
          </Link>
          <Link href="/products" className="hover:text-black transition-colors">
            Products
          </Link>
          <Link href="/about" className="hover:text-black transition-colors">
            About
          </Link>
        </nav>

        {/* Action Icons */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Search Bar */}
          <form
            onSubmit={handleSearch}
            className="hidden sm:flex items-center bg-gray-100 px-3 py-1.5 rounded-full border border-transparent focus-within:border-gray-300 focus-within:bg-white transition-all"
          >
            <Search size={16} className="text-gray-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search..."
              className="bg-transparent border-none focus:outline-none text-sm ml-2 w-24 lg:w-48 text-gray-900 placeholder:text-gray-500"
            />
          </form>

          {/* Cart */}
          <button className="relative p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ShoppingBag size={20} className="text-gray-900" />
            <span className="absolute top-0 right-0 h-4 w-4 bg-black text-white text-[10px] font-bold flex items-center justify-center rounded-full">
              3
            </span>
          </button>

          {/* User */}
          <button className="hidden sm:block p-2 hover:bg-gray-100 rounded-full transition-colors">
            <User size={20} className="text-gray-900" />
          </button>

          {/* Mobile Menu Button (Placeholder) */}
          <button className="sm:hidden p-2 hover:bg-gray-100 rounded-full">
            <Menu size={20} className="text-gray-900" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;

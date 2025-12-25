import Link from "next/link";
import { Search, ShoppingBag, User } from "lucide-react";

const Header = () => {
  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          className="text-2xl font-bold text-indigo-600 tracking-tighter"
        >
          ShopOrbit
        </Link>

        {/* Navigation - Desktop */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
          <Link href="/" className="hover:text-indigo-600 transition-colors">
            Home
          </Link>
          <Link
            href="/products"
            className="hover:text-indigo-600 transition-colors"
          >
            Products
          </Link>
          <Link
            href="/about"
            className="hover:text-indigo-600 transition-colors"
          >
            About
          </Link>
        </nav>

        {/* Action Icons */}
        <div className="flex items-center gap-4">
          {/* Search Bar giả */}
          <div className="hidden sm:flex items-center bg-gray-100 px-3 py-1.5 rounded-full">
            <Search size={18} className="text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              className="bg-transparent border-none focus:outline-none text-sm ml-2 w-32"
            />
          </div>

          <button className="relative p-2 hover:bg-gray-100 rounded-full">
            <ShoppingBag size={24} className="text-gray-700" />
            <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full">
              3
            </span>
          </button>

          <button className="p-2 hover:bg-gray-100 rounded-full">
            <User size={24} className="text-gray-700" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;

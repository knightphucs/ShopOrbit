import Link from "next/link";
import { Facebook, Instagram, Twitter, Mail } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-black">ShopOrbit.</h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              Premium electronics and lifestyle products. Quality redefined for
              the modern workspace.
            </p>
            <div className="flex gap-4">
              <a
                href="#"
                className="text-gray-400 hover:text-black transition-colors"
              >
                <Facebook size={20} />
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-black transition-colors"
              >
                <Instagram size={20} />
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-black transition-colors"
              >
                <Twitter size={20} />
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-bold text-gray-900 mb-4">Shop</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li>
                <Link href="/products" className="hover:text-black">
                  All Products
                </Link>
              </li>
              <li>
                <Link
                  href="/products?sort=dateDesc"
                  className="hover:text-black"
                >
                  New Arrivals
                </Link>
              </li>
              <li>
                <Link href="/products" className="hover:text-black">
                  Featured
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-gray-900 mb-4">Support</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li>
                <a href="#" className="hover:text-black">
                  FAQ
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-black">
                  Shipping & Returns
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-black">
                  Contact Us
                </a>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="font-bold text-gray-900 mb-4">Stay Updated</h4>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Email address"
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-black"
              />
              <button className="px-3 py-2 bg-black text-white rounded-md hover:bg-gray-800">
                <Mail size={16} />
              </button>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-gray-400">
          <p>© 2025 ShopOrbit Inc. All rights reserved.</p>
          <div className="flex gap-6 mt-4 md:mt-0">
            <a href="#" className="hover:text-black">
              Privacy Policy
            </a>
            <a href="#" className="hover:text-black">
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

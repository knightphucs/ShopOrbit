import Header from "@/components/layout/Header";
import ProductCard, {
  Product,
} from "@/features/catalog/components/ProductCard";

// 1. Dữ liệu giả (Mock Data) - Sau này bạn sẽ thay bằng await callApi()
const MOCK_PRODUCTS: Product[] = [
  {
    id: "1",
    name: "Sony WH-1000XM5",
    price: 349,
    description: "Tai nghe chống ồn hàng đầu thế giới với chất âm tuyệt hảo.",
    imageUrl:
      "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
  },
  {
    id: "2",
    name: "MacBook Air M2",
    price: 1199,
    description: "Siêu mỏng, siêu nhẹ, sức mạnh vượt trội từ chip M2.",
    imageUrl:
      "https://images.unsplash.com/photo-1517336714731-489689fd1ca4?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
  },
  {
    id: "3",
    name: "Mechanical Keyboard",
    price: 89,
    description: "Bàn phím cơ Custom layout 75% với switch linear mượt mà.",
    imageUrl:
      "https://images.unsplash.com/photo-1595225476474-87563907a212?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
  },
  {
    id: "4",
    name: "Gaming Mouse Pro",
    price: 59,
    description: "Chuột chơi game không dây độ trễ thấp, cảm biến quang học.",
    imageUrl:
      "https://images.unsplash.com/photo-1527814050087-3793815479db?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <Header />

      <main>
        {/* HERO SECTION */}
        <section className="bg-indigo-900 text-white py-20">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">
              Công nghệ trong tầm tay
            </h1>
            <p className="text-indigo-200 text-xl mb-8 max-w-2xl mx-auto">
              Khám phá các sản phẩm công nghệ mới nhất với mức giá tốt nhất tại
              ShopOrbit.
            </p>
            <button className="bg-white text-indigo-900 px-8 py-3 rounded-full font-bold hover:bg-indigo-50 transition-colors">
              Mua sắm ngay
            </button>
          </div>
        </section>

        {/* FEATURED PRODUCTS SECTION */}
        <section className="container mx-auto px-4 py-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-gray-900">
              Sản phẩm nổi bật
            </h2>
            <a
              href="/products"
              className="text-indigo-600 font-semibold hover:underline"
            >
              Xem tất cả &rarr;
            </a>
          </div>

          {/* Grid Layout cho sản phẩm */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {MOCK_PRODUCTS.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      </main>

      {/* Footer đơn giản */}
      <footer className="bg-white border-t border-gray-200 py-8 mt-12 text-center text-gray-500 text-sm">
        <p>© 2024 ShopOrbit. Built with .NET Microservices & Next.js</p>
      </footer>
    </div>
  );
}

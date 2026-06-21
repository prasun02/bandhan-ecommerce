import { ProductCard } from "@/components/product-card";
import { categories, collections, type Product } from "@/data/catalog";
import { databaseUnavailableCopy, isCatalogDatabaseError } from "@/lib/database-errors";
import { getPublishedProducts } from "@/lib/services/catalog";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function valueOf(input: string | string[] | undefined) {
  return Array.isArray(input) ? input[0] : input;
}

export default async function ShopPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const filters = {
    q: valueOf(params.q),
    category: valueOf(params.category),
    collection: valueOf(params.collection),
    fabric: valueOf(params.fabric),
    size: valueOf(params.size),
    color: valueOf(params.color),
    stitched: valueOf(params.stitched),
    inStock: valueOf(params.inStock),
    sort: valueOf(params.sort)
  };
  const result: Product[] | null = await getPublishedProducts(filters).catch((error: unknown) => {
    if (isCatalogDatabaseError(error)) return null;
    throw error;
  });
  if (!result) return <ShopDatabaseUnavailable />;

  return (
    <main className="container py-8">
      <section className="mb-8 rounded-md bg-blush p-8 shadow-card">
        <p className="text-sm font-bold text-warmgrey">Home / Shop</p>
        <h1 className="mt-2 font-display text-5xl font-black text-rosewood">Shop Bandhan</h1>
        <p className="mt-3 max-w-2xl text-warmgrey">Search, sort, and filter sarees, salwar kameez, lehengas, kurtis, gowns, fabrics, bridal edits, and accessories.</p>
      </section>
      <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
        <aside className="h-fit rounded-md bg-white p-5 shadow-card lg:sticky lg:top-32">
          <h2 className="text-xl font-black">Filters</h2>
          <form className="mt-5 grid gap-4">
            <input name="q" defaultValue={filters.q} placeholder="Search products" className="h-11 rounded-md border border-ink/15 px-3" />
            <select name="category" defaultValue={filters.category} className="h-11 rounded-md border border-ink/15 px-3">
              <option value="">All categories</option>
              {categories.map((item) => <option key={item}>{item}</option>)}
            </select>
            <select name="collection" defaultValue={filters.collection} className="h-11 rounded-md border border-ink/15 px-3">
              <option value="">All collections</option>
              {collections.map((item) => <option key={item}>{item}</option>)}
            </select>
            <select name="sort" defaultValue={filters.sort} className="h-11 rounded-md border border-ink/15 px-3">
              <option value="">Newest</option>
              <option value="price-asc">Price low to high</option>
              <option value="price-desc">Price high to low</option>
              <option value="rating">Best rated</option>
              <option value="discount">Highest discount</option>
            </select>
            <div className="grid grid-cols-2 gap-3">
              <select name="size" defaultValue={filters.size} className="h-11 rounded-md border border-ink/15 px-3">
                <option value="">Size</option>
                {["S", "M", "L", "XL", "XXL", "Free Size"].map((item) => <option key={item}>{item}</option>)}
              </select>
              <select name="color" defaultValue={filters.color} className="h-11 rounded-md border border-ink/15 px-3">
                <option value="">Color</option>
                {["Maroon", "Red", "Pink", "Green", "Emerald", "Navy", "Black", "Gold", "Beige", "White", "Purple", "Blue"].map((item) => <option key={item}>{item}</option>)}
              </select>
            </div>
            <input name="fabric" defaultValue={filters.fabric} placeholder="Fabric" className="h-11 rounded-md border border-ink/15 px-3" />
            <label className="flex items-center gap-2 text-sm">
              <input name="inStock" value="true" type="checkbox" defaultChecked={filters.inStock === "true"} /> In stock only
            </label>
            <button className="h-11 rounded-md bg-ink font-bold text-white">Apply filters</button>
            <a href="/shop" className="text-center text-sm font-bold text-rosewood">Clear filters</a>
          </form>
        </aside>
        <section>
          <div className="flex items-center justify-between">
            <p className="font-semibold">{result.length} products found</p>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
            {result.map((product: Product) => <ProductCard key={product.id} product={product} />)}
          </div>
          {result.length === 0 ? <div className="mt-5 rounded-md bg-white p-8 text-center text-warmgrey shadow-card">No products match these filters.</div> : null}
        </section>
      </div>
    </main>
  );
}

function ShopDatabaseUnavailable() {
  return (
    <main className="container py-14">
      <div className="rounded-md bg-white p-8 shadow-card">
        <h1 className="font-display text-3xl font-black text-rosewood">Shop temporarily unavailable</h1>
        <p className="mt-3 max-w-2xl leading-7 text-ink/70">{databaseUnavailableCopy()}</p>
      </div>
    </main>
  );
}

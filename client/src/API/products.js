const API_URL = import.meta.env.VITE_APP_BACKEND_URL || "";

function checkBackendUrl() {
  if (!API_URL || API_URL === "undefined") {
    throw new Error("VITE_APP_BACKEND_URL is not set. Add it in Vercel project env.");
  }
}

export async function getProducts({ category, ...params }) {
  checkBackendUrl();
  const search = new URLSearchParams(params);
  const reqUrl =
    category && category !== "all"
      ? `${API_URL}/products?category=${category}&${search.toString()}`
      : `${API_URL}/products?${search.toString()}`;

  const response = await fetch(reqUrl);
  if (!response.ok) throw new Error(`Products: ${response.status}`);
  const data = await response.json();
  return data;
}

export async function getCategories() {
  checkBackendUrl();
  const response = await fetch(`${API_URL}/products/categories`);
  if (!response.ok) throw new Error(`Categories: ${response.status}`);
  const data = await response.json();
  return data;
}

export async function getProduct(id) {
  checkBackendUrl();
  const response = await fetch(`${API_URL}/products/${id}`);
  if (!response.ok) throw new Error(`Product: ${response.status}`);
  const data = await response.json();
  return data;
}

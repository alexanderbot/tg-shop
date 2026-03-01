import { useEffect, useState } from "react";
import { getCategories, getProducts } from "../API/products";

const initialState = {
  products: [],
  categories: ["all"],
  activeCategory: "all",
  error: null,
};

const useProducts = () => {
  const [state, setState] = useState(initialState);
  const { products, categories, activeCategory, error } = state;

  useEffect(() => {
    getCategories()
      .then((result) => {
        setState((prev) => ({ ...prev, categories: Array.isArray(result) ? result : ["all", ...(result || [])], error: null }));
      })
      .catch((err) => {
        setState((prev) => ({ ...prev, error: err.message || "Failed to load categories" }));
      });
  }, []);

  useEffect(() => {
    getProducts({ category: activeCategory, limit: 20 })
      .then((result) => {
        setState((prev) => ({ ...prev, products: result?.products || [], error: null }));
      })
      .catch((err) => {
        setState((prev) => ({ ...prev, products: [], error: err.message || "Failed to load products" }));
      });
  }, [activeCategory]);

  const setCategory = (category) => {
    setState((prev) => ({ ...prev, activeCategory: category }));
  };

  return {
    setCategory,
    products,
    categories,
    activeCategory,
    error,
  };
};

export default useProducts;

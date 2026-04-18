import { useMemo, useState } from "react";
import { PlusIcon, PencilIcon, Trash2Icon, XIcon, ImageIcon } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { catalogApi, productApi } from "../lib/api";
import { getStockStatusBadge } from "../lib/utils";

const createDefaultSpecs = (specTemplate = {}, existingSpecs = {}) => {
  return Object.entries(specTemplate).reduce((acc, [key, rule]) => {
    if (existingSpecs[key] !== undefined) {
      acc[key] = existingSpecs[key];
      return acc;
    }
    acc[key] = rule.default;
    return acc;
  }, {});
};

const normalize = (value) => String(value || "").trim().toLowerCase();

function ProductsPage() {
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    subcategory: "",
    price: "",
    stock: "",
    description: "",
    specs: {},
  });
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);

  const queryClient = useQueryClient();

  // fetch some data
  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: productApi.getAll,
  });

  const { data: catalogMeta } = useQuery({
    queryKey: ["catalog-meta"],
    queryFn: catalogApi.getMeta,
  });

  const categories = useMemo(() => catalogMeta?.categories ?? [], [catalogMeta]);

  const selectedCategory = useMemo(() => {
    return (
      categories.find((category) => {
        return normalize(category.name) === normalize(formData.category);
      }) || null
    );
  }, [categories, formData.category]);

  const subcategories = useMemo(() => selectedCategory?.subcategories ?? [], [selectedCategory]);

  const selectedSubcategory = useMemo(() => {
    return (
      subcategories.find((subcategory) => {
        return normalize(subcategory.name) === normalize(formData.subcategory);
      }) || null
    );
  }, [subcategories, formData.subcategory]);

  const selectedSpecsTemplate = selectedSubcategory?.specs ?? {};

  // creating, update, deleting
  const createProductMutation = useMutation({
    mutationFn: productApi.create,
    onSuccess: () => {
      closeModal();
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: productApi.update,
    onSuccess: () => {
      closeModal();
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: productApi.delete,
    onSuccess: () => {
      closeModal();
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });

  const closeModal = () => {
    // reset the state
    setShowModal(false);
    setEditingProduct(null);
    setFormData({
      name: "",
      category: "",
      subcategory: "",
      price: "",
      stock: "",
      description: "",
      specs: {},
    });
    setImages([]);
    setImagePreviews([]);
  };

  const handleEdit = (product) => {
    const matchedCategory =
      categories.find((category) => normalize(category.name) === normalize(product.category)) || null;
    const matchedSubcategory =
      matchedCategory?.subcategories.find(
        (subcategory) => normalize(subcategory.name) === normalize(product.subcategory)
      ) || matchedCategory?.subcategories?.[0];
    const initialSpecs = createDefaultSpecs(matchedSubcategory?.specs || {}, product.specs || {});

    setEditingProduct(product);
    setFormData({
      name: product.name,
      category: product.category,
      subcategory: matchedSubcategory?.name || product.subcategory || "",
      price: product.price.toString(),
      stock: product.stock.toString(),
      description: product.description,
      specs: initialSpecs,
    });
    setImagePreviews(product.images);
    setShowModal(true);
  };

  const handleCategoryChange = (categoryName) => {
    const category =
      categories.find((item) => normalize(item.name) === normalize(categoryName)) || null;
    const nextSubcategory = category?.subcategories?.[0] || null;

    setFormData((prev) => ({
      ...prev,
      category: categoryName,
      subcategory: nextSubcategory?.name || "",
      specs: createDefaultSpecs(nextSubcategory?.specs || {}, {}),
    }));
  };

  const handleSubcategoryChange = (subcategoryName) => {
    const nextSubcategory =
      subcategories.find((item) => normalize(item.name) === normalize(subcategoryName)) || null;

    setFormData((prev) => ({
      ...prev,
      subcategory: subcategoryName,
      specs: createDefaultSpecs(nextSubcategory?.specs || {}, prev.specs),
    }));
  };

  const updateSpecValue = (key, value) => {
    setFormData((prev) => ({
      ...prev,
      specs: {
        ...prev.specs,
        [key]: value,
      },
    }));
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 3) return alert("Maximum 3 images allowed");

    // revoke previous blob URLs to free memory
    imagePreviews.forEach((url) => {
      if (url.startsWith("blob:")) URL.revokeObjectURL(url);
    });

    setImages(files);
    setImagePreviews(files.map((file) => URL.createObjectURL(file)));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // for new products, require images
    if (!editingProduct && imagePreviews.length === 0) {
      return alert("Please upload at least one image");
    }

    const formDataToSend = new FormData();
    formDataToSend.append("name", formData.name);
    formDataToSend.append("description", formData.description);
    formDataToSend.append("price", formData.price);
    formDataToSend.append("stock", formData.stock);
    formDataToSend.append("category", formData.category);
    formDataToSend.append("subcategory", formData.subcategory);
    formDataToSend.append("specs", JSON.stringify(formData.specs || {}));

    // only append new images if they were selected
    if (images.length > 0) images.forEach((image) => formDataToSend.append("images", image));

    if (editingProduct) {
      updateProductMutation.mutate({ id: editingProduct._id, formData: formDataToSend });
    } else {
      createProductMutation.mutate(formDataToSend);
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Products</h1>
          <p className="text-base-content/70 mt-1">Manage your product inventory</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn btn-primary gap-2">
          <PlusIcon className="w-5 h-5" />
          Add Product
        </button>
      </div>

      {/* PRODUCTS GRID */}
      <div className="grid grid-cols-1 gap-4">
        {products?.map((product) => {
          const status = getStockStatusBadge(product.stock);

          return (
            <div key={product._id} className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <div className="flex items-center gap-6">
                  <div className="avatar">
                    <div className="w-20 rounded-xl">
                      <img src={product.images[0]} alt={product.name} />
                    </div>
                  </div>

                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="card-title">{product.name}</h3>
                        <p className="text-base-content/70 text-sm">
                          {product.category}
                          {product.subcategory ? ` / ${product.subcategory}` : ""}
                        </p>
                      </div>
                      <div className={`badge ${status.class}`}>{status.text}</div>
                    </div>
                    <div className="flex items-center gap-6 mt-4">
                      <div>
                        <p className="text-xs text-base-content/70">Price</p>
                        <p className="font-bold text-lg">${product.price}</p>
                      </div>
                      <div>
                        <p className="text-xs text-base-content/70">Stock</p>
                        <p className="font-bold text-lg">{product.stock} units</p>
                      </div>
                    </div>
                  </div>

                  <div className="card-actions">
                    <button
                      className="btn btn-square btn-ghost"
                      onClick={() => handleEdit(product)}
                    >
                      <PencilIcon className="w-5 h-5" />
                    </button>
                    <button
                      className="btn btn-square btn-ghost text-error"
                      onClick={() => deleteProductMutation.mutate(product._id)}
                    >
                      {deleteProductMutation.isPending ? (
                        <span className="loading loading-spinner"></span>
                      ) : (
                        <Trash2Icon className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ADD/EDIT PRODUCT MODAL */}

      <input type="checkbox" className="modal-toggle" checked={showModal} />

      <div className="modal">
        <div className="modal-box max-w-2xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-2xl">
              {editingProduct ? "Edit Product" : "Add New Product"}
            </h3>

            <button onClick={closeModal} className="btn btn-sm btn-circle btn-ghost">
              <XIcon className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label">
                  <span>Product Name</span>
                </label>

                <input
                  type="text"
                  placeholder="Enter product name"
                  className="input input-bordered"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span>Category</span>
                </label>
                <select
                  className="select select-bordered"
                  value={formData.category}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  required
                >
                  <option value="">Select category</option>
                  {categories.map((category) => (
                    <option key={category.slug} value={category.name}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label">
                  <span>Subcategory</span>
                </label>
                <select
                  className="select select-bordered"
                  value={formData.subcategory}
                  onChange={(e) => handleSubcategoryChange(e.target.value)}
                  required
                  disabled={!selectedCategory}
                >
                  <option value="">Select subcategory</option>
                  {subcategories.map((subcategory) => (
                    <option key={subcategory.slug} value={subcategory.name}>
                      {subcategory.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label">
                  <span>Price ($)</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  className="input input-bordered"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span>Stock</span>
                </label>
                <input
                  type="number"
                  placeholder="0"
                  className="input input-bordered"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-control flex flex-col gap-2">
              <label className="label">
                <span>Description</span>
              </label>
              <textarea
                className="textarea textarea-bordered h-24 w-full"
                placeholder="Enter product description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
              />
            </div>

            {selectedSubcategory && (
              <div className="form-control flex flex-col gap-2">
                <label className="label">
                  <span className="font-semibold">Specifications</span>
                </label>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(selectedSpecsTemplate).map(([key, rule]) => {
                    const value = formData.specs[key];
                    const label = key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase());

                    if (rule.type === "boolean") {
                      return (
                        <label key={key} className="label cursor-pointer justify-start gap-3 p-3 rounded-lg bg-base-200">
                          <input
                            type="checkbox"
                            className="toggle toggle-primary"
                            checked={Boolean(value)}
                            onChange={(e) => updateSpecValue(key, e.target.checked)}
                          />
                          <span>{label}</span>
                        </label>
                      );
                    }

                    if (rule.type === "enum") {
                      return (
                        <div key={key} className="form-control">
                          <label className="label">
                            <span>{label}</span>
                          </label>
                          <select
                            className="select select-bordered"
                            value={value ?? rule.default ?? ""}
                            onChange={(e) => updateSpecValue(key, e.target.value)}
                            required={Boolean(rule.required)}
                          >
                            {rule.options?.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        </div>
                      );
                    }

                    if (rule.type === "number") {
                      return (
                        <div key={key} className="form-control">
                          <label className="label">
                            <span>{label}</span>
                          </label>
                          <input
                            type="number"
                            step="any"
                            className="input input-bordered"
                            value={value ?? rule.default ?? ""}
                            onChange={(e) => updateSpecValue(key, e.target.value)}
                            required={Boolean(rule.required)}
                          />
                        </div>
                      );
                    }

                    if (rule.type === "string[]" || rule.type === "number[]") {
                      return (
                        <div key={key} className="form-control">
                          <label className="label">
                            <span>{label}</span>
                          </label>
                          <input
                            type="text"
                            className="input input-bordered"
                            placeholder="comma,separated,values"
                            value={Array.isArray(value) ? value.join(", ") : value ?? ""}
                            onChange={(e) => updateSpecValue(key, e.target.value)}
                            required={Boolean(rule.required)}
                          />
                        </div>
                      );
                    }

                    return (
                      <div key={key} className="form-control">
                        <label className="label">
                          <span>{label}</span>
                        </label>
                        <input
                          type="text"
                          className="input input-bordered"
                          value={value ?? rule.default ?? ""}
                          onChange={(e) => updateSpecValue(key, e.target.value)}
                          required={Boolean(rule.required)}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold text-base flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  Product Images
                </span>
                <span className="label-text-alt text-xs opacity-60">Max 3 images</span>
              </label>

              <div className="bg-base-200 rounded-xl p-4 border-2 border-dashed border-base-300 hover:border-primary transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  className="file-input file-input-bordered file-input-primary w-full"
                  required={!editingProduct}
                />

                {editingProduct && (
                  <p className="text-xs text-base-content/60 mt-2 text-center">
                    Leave empty to keep current images
                  </p>
                )}
              </div>

              {imagePreviews.length > 0 && (
                <div className="flex gap-2 mt-2">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="avatar">
                      <div className="w-20 rounded-lg">
                        <img src={preview} alt={`Preview ${index + 1}`} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="modal-action">
              <button
                type="button"
                onClick={closeModal}
                className="btn"
                disabled={createProductMutation.isPending || updateProductMutation.isPending}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={createProductMutation.isPending || updateProductMutation.isPending}
              >
                {createProductMutation.isPending || updateProductMutation.isPending ? (
                  <span className="loading loading-spinner"></span>
                ) : editingProduct ? (
                  "Update Product"
                ) : (
                  "Add Product"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ProductsPage;

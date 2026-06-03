const z = require("zod");

// Auth schemas
const registerSchema = z.object({
    body: z.object({
        name: z.string().min(2, "Name must be at least 2 characters"),
        email: z.string().email("Invalid email address"),
        password: z.string().min(6, "Password must be at least 6 characters"),
        role: z.enum(["admin"]).optional()
    })
});

const loginSchema = z.object({
    body: z.object({
        email: z.string().email("Invalid email address"),
        password: z.string().min(1, "Password is required"),
        shopIdentifier: z.string().optional()
    })
});

// Shop schemas
const createShopSchema = z.object({
    body: z.object({
        shopName: z.string().min(2, "Shop name must be at least 2 characters").optional(),
        name: z.string().min(2, "Shop name must be at least 2 characters").optional(),
        businessType: z.string().optional(),
        address: z.string().optional(),
        phone: z.string().optional()
    }).refine(data => data.shopName || data.name, {
        message: "Shop name or name is required",
        path: ["shopName"]
    })
});

const updateShopSchema = z.object({
    params: z.object({
        id: z.string().uuid("Invalid shop ID format")
    }),
    body: z.object({
        shopName: z.string().min(2, "Shop name must be at least 2 characters").optional(),
        name: z.string().min(2, "Shop name must be at least 2 characters").optional(),
        businessType: z.string().optional(),
        address: z.string().optional(),
        phone: z.string().optional()
    })
});

// Category schemas
const createCategorySchema = z.object({
    body: z.object({
        shopId: z.string().uuid("Invalid shop ID format"),
        name: z.string().min(1, "Category name is required"),
        image: z.string().optional(),
        imageUrl: z.string().optional()
    })
});

const getByIdSchema = z.object({
    params: z.object({
        id: z.string().uuid("Invalid ID format")
    })
});

const updateCategorySchema = z.object({
    params: z.object({
        id: z.string().uuid("Invalid category ID format")
    }),
    body: z.object({
        name: z.string().min(1, "Category name is required").optional(),
        image: z.string().optional(),
        imageUrl: z.string().optional()
    })
});

// Product schemas
const createProductSchema = z.object({
    body: z.object({
        shopId: z.string().uuid("Invalid shop ID format"),
        categoryId: z.string().uuid("Invalid category ID format"),
        name: z.string().min(1, "Product name is required"),
        description: z.string().optional(),
        skuCode: z.string().min(1, "SKU code is required").optional(),
        barcodes: z.string().optional(),
        image: z.any().optional(),
        imageUrl: z.string().optional(),
        purchasePrice: z.number().nonnegative("Purchase price must be positive").optional(),
        sellingPrice: z.number().nonnegative("Selling price must be positive").optional(),
        currentStock: z.number().nonnegative("Current stock must be positive").optional(),
        minimumStock: z.number().nonnegative("Minimum stock must be positive").optional(),
        isActive: z.boolean().optional()
    })
});

const updateProductSchema = z.object({
    params: z.object({
        id: z.string().uuid("Invalid product ID format")
    }),
    body: z.object({
        name: z.string().min(1, "Product name must be at least 1 character").optional(),
        description: z.string().optional(),
        skuCode: z.string().min(1, "SKU code must be at least 1 character").optional(),
        barcodes: z.string().optional(),
        image: z.any().optional(),
        imageUrl: z.string().optional(),
        purchasePrice: z.number().nonnegative("Purchase price must be positive").optional(),
        sellingPrice: z.number().nonnegative("Selling price must be positive").optional(),
        currentStock: z.number().nonnegative("Current stock must be positive").optional(),
        minimumStock: z.number().nonnegative("Minimum stock must be positive").optional(),
        isActive: z.boolean().optional()
    })
});

// Purchase schemas
const createPurchaseSchema = z.object({
    body: z.object({
        shopId: z.string().uuid("Invalid shop ID format"),
        supplierName: z.string().optional(),
        items: z.array(z.object({
            productId: z.string().uuid("Invalid product ID format"),
            quantity: z.number().positive("Quantity must be positive"),
            purchasePrice: z.number().positive("Purchase price must be positive")
        })).min(1, "At least one purchase item is required")
    })
});

const getByProductSchema = z.object({
    params: z.object({
        productId: z.string().uuid("Invalid product ID format")
    })
});

// Sale schemas
const createSaleSchema = z.object({
    body: z.object({
        shopId: z.string().uuid("Invalid shop ID format"),
        customerName: z.string().optional(),
        paymentMethod: z.string().optional(),
        items: z.array(z.object({
            productId: z.string().uuid("Invalid product ID format"),
            quantity: z.number().positive("Quantity must be positive"),
            sellingPrice: z.number().positive("Selling price must be positive").optional(),
            unitPrice: z.number().positive("Unit price must be positive").optional()
        }).refine(data => data.sellingPrice !== undefined || data.unitPrice !== undefined, {
            message: "Selling price or unit price must be positive",
            path: ["sellingPrice"]
        })).min(1, "At least one sale item is required")
    })
});

// Stock adjustment schema
const adjustStockSchema = z.object({
    body: z.object({
        shopId: z.string().uuid("Invalid shop ID format").optional(),
        productId: z.string().uuid("Invalid product ID format"),
        type: z.enum(["addition", "reduction"]),
        quantity: z.number().positive("Quantity must be positive"),
        reason: z.string().optional(),
        referenceType: z.string().optional(),
        referenceId: z.string().optional()
    })
});

// Stock receiving schema (operational batch receiving)
const receiveStockSchema = z.object({
    body: z.object({
        shopId: z.string().uuid("Invalid shop ID format").optional(),
        supplierName: z.string().optional(),
        deliveryNote: z.string().optional(),
        items: z.array(z.object({
            productId: z.string().uuid("Invalid product ID format"),
            quantity: z.number().positive("Quantity must be positive")
        })).min(1, "At least one item is required"),
        note: z.string().optional()
    })
});

// User schemas
const createUserSchema = z.object({
    body: z.object({
        name: z.string().min(2, "Name must be at least 2 characters"),
        email: z.string().email("Invalid email address"),
        password: z.string().min(6, "Password must be at least 6 characters"),
        role: z.enum(["admin", "staff", "manager", "cashier"]).optional(),
        shopId: z.string().uuid("Invalid shop ID format")
    })
});

const updateUserSchema = z.object({
    params: z.object({
        id: z.string().uuid("Invalid user ID format")
    }),
    body: z.object({
        name: z.string().min(2, "Name must be at least 2 characters").optional(),
        email: z.string().email("Invalid email address").optional(),
        password: z.string().min(6, "Password must be at least 6 characters").optional(),
        role: z.enum(["admin", "staff", "manager", "cashier"]).optional(),
        isActive: z.boolean().optional()
    })
});

// Dashboard and Report schemas
const dashboardSummarySchema = z.object({
    query: z.object({
        shopId: z.string().uuid("Invalid shop ID format").optional()
    })
});

const salesSummaryReportSchema = z.object({
    query: z.object({
        interval: z.enum(["daily", "weekly", "monthly", "yearly"], {
            errorMap: () => ({ message: "Interval must be daily, weekly, monthly, or yearly" })
        }),
        shopId: z.string().uuid("Invalid shop ID format").optional()
    })
});

const reportFilterSchema = z.object({
    query: z.object({
        shopId: z.string().uuid("Invalid shop ID format").optional()
    })
});

// Product Request schemas
const createProductRequestSchema = z.object({
    body: z.object({
        name: z.string().min(1, "Product name is required"),
        description: z.string().optional(),
        barcodes: z.string().optional(),
        suggestedPrice: z.number().nonnegative("Price must be non-negative").optional(),
        categoryHint: z.string().optional(),
        quantity: z.number().positive("Quantity must be positive").optional(),
        supplierHint: z.string().optional(),
    })
});

const approveProductRequestSchema = z.object({
    params: z.object({
        id: z.string().uuid("Invalid request ID format")
    }),
    body: z.object({
        categoryId: z.string().uuid("Invalid category ID format"),
        skuCode: z.string().min(1, "SKU code is required"),
        purchasePrice: z.number().nonnegative("Purchase price must be non-negative").optional(),
        sellingPrice: z.number().nonnegative("Selling price must be non-negative").optional(),
        minimumStock: z.number().nonnegative("Minimum stock must be non-negative").optional(),
        currentStock: z.number().nonnegative("Current stock must be non-negative").optional(),
        reviewNote: z.string().optional(),
    })
});

const rejectProductRequestSchema = z.object({
    params: z.object({
        id: z.string().uuid("Invalid request ID format")
    }),
    body: z.object({
        reviewNote: z.string().min(1, "A rejection reason is required"),
    })
});

module.exports = {
    registerSchema,
    loginSchema,
    createShopSchema,
    updateShopSchema,
    createCategorySchema,
    updateCategorySchema,
    getByIdSchema,
    createProductSchema,
    updateProductSchema,
    createPurchaseSchema,
    getByProductSchema,
    createSaleSchema,
    adjustStockSchema,
    receiveStockSchema,
    createUserSchema,
    updateUserSchema,
    dashboardSummarySchema,
    salesSummaryReportSchema,
    reportFilterSchema,
    createProductRequestSchema,
    approveProductRequestSchema,
    rejectProductRequestSchema,
};


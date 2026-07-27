/**
 * Central product catalog for The Discipleship Journey book series.
 * Prices are in USD cents. Update these when you create matching
 * Stripe Products/Prices in the dashboard.
 */
export const PRODUCTS = {
  belong: {
    key: "belong",
    title: "BELONG",
    subtitle: "Book 1 — You Are Welcomed",
    description: "Discover your identity in Christ, overcome the guilt of your past, and find your place in the family of God.",
    priceCents: 99,          // $0.99 launch price
    regularPriceCents: 399,  // $3.99
    tag: "LAUNCH PRICE",
    /** Relative path inside /home/ubuntu/discipleship/books_pdf/ — served via S3 after purchase */
    downloadFile: "BELONG.pdf",
  },
  grow: {
    key: "grow",
    title: "GROW",
    subtitle: "Book 2 — You Are Transformed",
    description: "Deepen your roots in prayer, Scripture, and community. Learn to hear God's voice and bear lasting fruit.",
    priceCents: 499,
    regularPriceCents: null,
    tag: "AVAILABLE NOW",
    downloadFile: "GROW.pdf",
  },
  go: {
    key: "go",
    title: "GO",
    subtitle: "Book 3 — You Are Sent",
    description: "Step into your calling as a witness. Learn to share your faith naturally and make disciples.",
    priceCents: 499,
    regularPriceCents: null,
    tag: "AVAILABLE NOW",
    downloadFile: "GO.pdf",
  },
  bundle: {
    key: "bundle",
    title: "Complete 3-Book Bundle",
    subtitle: "BELONG + GROW + GO",
    description: "All three books for one complete discipleship journey — from welcome to witness.",
    priceCents: 999,         // $9.99 vs $13.97 separately
    regularPriceCents: 1397,
    tag: "BEST VALUE",
    downloadFile: null,      // bundle unlocks all three books
  },
} as const;

export type ProductKey = keyof typeof PRODUCTS;
export const PRODUCT_KEYS = Object.keys(PRODUCTS) as ProductKey[];

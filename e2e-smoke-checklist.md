# E2E Smoke Checklist — Vinnys Vogue

> Run each item manually (or automate later with Cypress/Playwright) before every production deploy.

## 1. Public Pages
- [ ] **Homepage** loads → hero, categories, featured products, craftsmanship, newsletter, footer visible
- [ ] **Products page** loads → product grid renders, category filters work
- [ ] **Product detail** page loads → image, title, price, variant selector visible
- [ ] **About page** loads → craftsmanship content and images render
- [ ] Static pages render: `/privacy-policy`, `/terms-of-service`, `/shipping-returns`, `/size-guide`, `/sustainability`

## 2. Authentication
- [ ] Sign in via email/phone works
- [ ] Google OAuth sign-in works
- [ ] Redirect to `/login` when accessing protected page unauthenticated
- [ ] Sign out clears session

## 3. Cart & Checkout
- [ ] Add product to cart → count badge updates
- [ ] Update quantity in cart → total recalculates
- [ ] Remove item from cart → item disappears
- [ ] Proceed to checkout → shipping form renders
- [ ] Submit checkout → order created, redirected to order page

## 4. Payments
- [ ] Pay Now button initiates Razorpay → Razorpay checkout modal opens
- [ ] Successful payment → order status updates to "confirmed" / "paid"
- [ ] Failed payment → order remains "unpaid"

## 5. Wishlist
- [ ] Add product to wishlist → heart icon toggles
- [ ] View wishlist page → all saved products listed
- [ ] Remove from wishlist → item removed

## 6. User Account
- [ ] `/account/orders` shows all user orders
- [ ] Click order → redirects to order detail page

## 7. Admin Panel
- [ ] `/admin` dashboard loads for admin users
- [ ] Non-admin users redirected away
- [ ] Product create/edit/delete works
- [ ] Order management works
- [ ] Homepage content editing works

## 8. SEO & Meta
- [ ] `/robots.txt` returns valid content
- [ ] `/sitemap.xml` returns valid XML with product URLs
- [ ] Product pages have OG / Twitter Card meta tags (inspect `<head>`)

## 9. Mobile
- [ ] Mobile hamburger menu appears on small screens
- [ ] Slide-in drawer opens/closes correctly
- [ ] All nav links in drawer work
- [ ] Body scroll locks when drawer is open

## 10. Newsletter
- [ ] Enter email → subscribe → success message appears
- [ ] Submit empty/invalid email → error message

## 11. Performance
- [ ] Homepage loads within 3 seconds on 4G throttle
- [ ] Images are served via `_next/image` (not raw URLs)
- [ ] No console errors in production build

## 12. Security
- [ ] Security headers present (check `X-Frame-Options`, `HSTS`, etc. in response headers)
- [ ] API rate limiting works (send 10+ rapid requests → 429 response)

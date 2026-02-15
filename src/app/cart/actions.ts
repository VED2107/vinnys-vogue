"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// ---------------------------------------------------------------------------
// addToCart
// ---------------------------------------------------------------------------

export async function addToCart(productId: string, variantId?: string) {
  const supabase = createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be logged in to add items to your cart." };
  }

  // Get or create the user's cart
  let cartId: string;
  const { data: existingCart } = await supabase
    .from("carts")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingCart) {
    cartId = existingCart.id;
  } else {
    const { data: newCart, error: cartError } = await supabase
      .from("carts")
      .insert({ user_id: user.id })
      .select("id")
      .single();

    if (cartError || !newCart) {
      return { error: cartError?.message ?? "Failed to create cart." };
    }
    cartId = newCart.id;
  }

  // Call RPC with actual signature:
  // increment_cart_item(p_cart_id uuid, p_product_id uuid, p_quantity integer, p_variant_id uuid DEFAULT NULL)
  const rpcParams: {
    p_cart_id: string;
    p_product_id: string;
    p_quantity: number;
    p_variant_id?: string;
  } = {
    p_cart_id: cartId,
    p_product_id: productId,
    p_quantity: 1,
  };

  if (variantId) {
    rpcParams.p_variant_id = variantId;
  }

  const { error } = await supabase.rpc("increment_cart_item", rpcParams);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/cart");
  return { error: null };
}

// ---------------------------------------------------------------------------
// updateCartItemQuantity
// ---------------------------------------------------------------------------

export async function updateCartItemQuantity(
  cartItemId: string,
  quantity: number,
) {
  if (!Number.isInteger(quantity) || quantity < 0) {
    return { error: "Quantity must be a non-negative integer." };
  }

  const supabase = createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be logged in." };
  }

  if (quantity === 0) {
    // Delete the item (RLS ensures ownership)
    const { error } = await supabase
      .from("cart_items")
      .delete()
      .eq("id", cartItemId);

    if (error) {
      return { error: error.message };
    }
  } else {
    const { error } = await supabase
      .from("cart_items")
      .update({ quantity })
      .eq("id", cartItemId);

    if (error) {
      return { error: error.message };
    }
  }

  revalidatePath("/cart");
  return { error: null };
}

// ---------------------------------------------------------------------------
// removeCartItem
// ---------------------------------------------------------------------------

export async function removeCartItem(cartItemId: string) {
  const supabase = createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be logged in." };
  }

  const { error } = await supabase
    .from("cart_items")
    .delete()
    .eq("id", cartItemId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/cart");
  return { error: null };
}

// ---------------------------------------------------------------------------
// buyNow — add to cart + redirect to checkout in one action
// ---------------------------------------------------------------------------

export async function buyNow(productId: string, variantId?: string) {
  const result = await addToCart(productId, variantId);
  if (result?.error) {
    return result;
  }
  redirect("/checkout");
}

// ---------------------------------------------------------------------------
// checkout
// ---------------------------------------------------------------------------

export async function checkout(formData: FormData) {
  const supabase = createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/checkout");
  }

  // Extract shipping fields
  const fullName = formData.get("full_name") as string;
  const phone = formData.get("phone") as string;
  const addressLine1 = formData.get("address_line1") as string;
  const addressLine2 = formData.get("address_line2") as string;
  const postalCode = formData.get("postal_code") as string;
  const city = formData.get("city") as string;
  const state = formData.get("state") as string;
  const country = formData.get("country") as string;

  if (!fullName || !phone || !addressLine1 || !postalCode || !city || !state) {
    throw new Error("Missing required shipping fields.");
  }

  // Create the order via the atomic RPC
  const { data, error } = await supabase.rpc("checkout_cart", {
    p_user_id: user.id,
  });

  if (error) {
    throw new Error(error.message);
  }

  const orderId = data as string;

  // Update order with shipping details
  const { error: updateError } = await supabase
    .from("orders")
    .update({
      full_name: fullName,
      phone,
      address_line1: addressLine1,
      address_line2: addressLine2 || null,
      postal_code: postalCode,
      city,
      state,
      country: country || "India",
    })
    .eq("id", orderId);

  if (updateError) {
    throw new Error(updateError.message);
  }

  redirect(`/order/${orderId}`);
}

<script setup>
const { t, locale } = useI18n();
const supabase = useSupabaseClient();
const { data: products } = await supabase.from("products").select();
const { data: productOptions } = await supabase
  .from("product_options")
  .select();
const { data: order, error: noOrder } = await supabase
  .from("orders")
  .select("id")
  .eq("date", new Date().toISOString().split("T")[0])
  .single();

const columns = [
  {
    key: "product_name",
    label: t("form.product"),
  },
  {
    key: "option_name",
    label: t("form.extra"),
  },
  {
    key: "quantity",
    label: "#",
  },
  {
    key: "price",
    label: "€",
  },
];

const state = reactive({
  rows: [],
  loading: true,
});

if (!noOrder) {
  const { data: orderDetails, error } = await supabase
    .from("order_details")
    .select()
    .eq("order_id", order.id);

  if (!error && orderDetails.length > 0) {
    orderDetails.forEach((detail) => {
      const product = products.find(
        (product) => product.id == detail.product_id
      );
      const option =
        detail.product_option_id == null
          ? null
          : productOptions.find(
              (option) => option.id == detail.product_option_id
            );
      const existingRowIndex = state.rows.findIndex(
        (item) => item.product_id == product.id && item.option_id == option.id
      );

      if (existingRowIndex != -1) {
        state.rows[existingRowIndex].quantity += detail.quantity;
        state.rows[existingRowIndex].price +=
          option == null
            ? detail.quantity * product.price
            : (product.price + option.price) * detail.quantity;
      } else {
        state.rows.push({
          product_name:
            locale == "en" ? product.english_name : product.dutch_name,
          option_name:
            option == null
              ? null
              : locale == "en"
              ? option.english_name
              : option.dutch_name,
          product_id: product.id,
          option_id: option != null ? option.id : null,
          quantity: detail.quantity,
          price:
            option == null
              ? detail.quantity * product.price
              : (product.price + option.price) * detail.quantity,
        });
      }

      state.loading = false;
    });
  }
}
</script>

<template>
  <div class="component order-over mt-16">
    <h2 class="text-2xl text-center font-sans-2 text-green-2">
      {{ noOrder ? "No order has been started yet!" : $t("form.order-so-far") }}
    </h2>

    <UTable
      v-if="!noOrder"
      :columns="columns"
      :rows="state.rows"
      class="mt-5 w-full bg-white rounded-xl"
    >
      <template #empty-state>
        <div class="flex flex-col items-center justify-center py-6">
          <span class="text-sm">Geen producten!</span>
        </div>
      </template>
    </UTable>
  </div>
</template>

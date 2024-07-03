<script setup>
const { t, locale } = useI18n();
const supabase = useSupabaseClient();
const { data: products } = await supabase.from("products").select();
const { data: productOptions } = await supabase
  .from("product_options")
  .select();

const state = reactive({
  employee_id: null,
  employee: { id: 0, first_name: "", last_name: "" },
  pageIndex: 0,
  orderDetails: [],
  selectedProductId: 1,
  selectedOptionId: null,
});
const tableColumns = [
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
  {
    key: "actions",
    label: t("form.options"),
  },
];

watch(
  () => [state.selectedProductId, state.orderDetails],
  () => {
    state.selectedOptionId = null;
  }
);

async function getEmployee() {
  const { data: employee, error } = await supabase
    .from("employees")
    .select()
    .eq("id", state.employee_id)
    .single();

  if (!error) {
    state.employee = employee;
    await loadExistingOrder(employee.id);
    state.pageIndex++;
  }
}

async function loadExistingOrder(employeeId) {
  const { data: existingOrder, error: noExistingOrder } = await supabase
    .from("orders")
    .select()
    .eq("date", new Date().toISOString().split("T")[0])
    .single();

  if (!noExistingOrder) {
    const { data: orderDetails, error } = await supabase
      .from("order_details")
      .select()
      .eq("employee_id", employeeId)
      .eq("order_id", existingOrder.id);

    state.orderDetails = orderDetails.map((detail) => {
      const product = products.find(
        (product) => product.id == detail.product_id
      );

      if (detail.product_option_id != null) {
        const productOption = productOptions.find(
          (option) => option.id == detail.product_option_id
        );

        return {
          product_id: product.id,
          option_id: productOption.id,
          product_name:
            locale == "en" ? product.english_name : product.dutch_name,
          option_name:
            locale == "en"
              ? productOption.english_name
              : productOption.dutch_name,
          quantity: detail.quantity,
          price: (product.price + productOption.price) * detail.quantity,
        };
      } else {
        return {
          product_id: product.id,
          option_id: null,
          product_name:
            locale == "en" ? product.english_name : product.dutch_name,
          option_name: null,
          quantity: detail.quantity,
          price: product.price * detail.quantity,
        };
      }
    });

    return true;
  } else {
    return false;
  }
}

function addProduct(productId, optionId = null) {
  const selectedItem = products.find((product) => product.id == productId);
  const selectedOption =
    optionId != null
      ? productOptions.find((option) => option.id == optionId)
      : null;
  const existingOrderDetailIndex = state.orderDetails.findIndex(
    (item) => item.product_id == productId && item.option_id == optionId
  );

  if (existingOrderDetailIndex != -1) {
    state.orderDetails[existingOrderDetailIndex].quantity++;
    state.orderDetails[existingOrderDetailIndex].price += selectedItem.price;

    if (selectedOption != null) {
      state.orderDetails[existingOrderDetailIndex].price +=
        selectedOption.price;
    }
  } else {
    if (selectedOption != null) {
      state.orderDetails = [
        ...state.orderDetails,
        {
          product_id: selectedItem.id,
          option_id: selectedOption.id,
          product_name:
            locale == "en"
              ? selectedItem.english_name
              : selectedItem.dutch_name,
          option_name:
            locale == "en"
              ? selectedOption.english_name
              : selectedOption.dutch_name,
          quantity: 1,
          price: selectedItem.price + selectedOption.price,
        },
      ];
    } else {
      state.orderDetails = [
        ...state.orderDetails,
        {
          product_id: selectedItem.id,
          option_id: null,
          product_name:
            locale == "en"
              ? selectedItem.english_name
              : selectedItem.dutch_name,
          option_name: null,
          quantity: 1,
          price: selectedItem.price,
        },
      ];
    }
  }
}

function lessenProduct(productId, optionId) {
  const relatedProduct = products.find((product) => product.id == productId);
  const relatedOption = productOptions.find((option) => option.id == optionId);
  const orderDetailIndex = state.orderDetails.findIndex(
    (item) => item.product_id == productId && item.option_id == optionId
  );

  if (state.orderDetails[orderDetailIndex].quantity == 1) {
    state.orderDetails.splice(orderDetailIndex, 1);
  } else {
    state.orderDetails[orderDetailIndex].quantity--;
    state.orderDetails[orderDetailIndex].price -= relatedProduct.price;

    if (relatedOption != undefined) {
      state.orderDetails[orderDetailIndex].price -= relatedOption.price;
    }
  }
}

async function onSubmit(event) {
  let orderId = 0;

  const { data: existingOrder, error: noExistingOrder } = await supabase
    .from("orders")
    .select()
    .eq("date", new Date().toISOString().split("T")[0])
    .single();

  if (noExistingOrder) {
    const { data: newOrder, error } = await supabase
      .from("orders")
      .insert({ date: new Date().toISOString().split("T")[0] })
      .select("id")
      .single();

    orderId = newOrder.id;

    if (error) throw new Error("Something went wrong while creating new order");
  } else {
    orderId = existingOrder.id;

    // Delete existing order details to overwrite
    const { error } = await supabase
      .from("order_details")
      .delete()
      .eq("order_id", orderId)
      .eq("employee_id", event.data.employee.id);
  }

  const { error } = await supabase.from("order_details").insert(
    event.data.orderDetails.map((detail) => {
      if (detail.option_id != null) {
        return {
          order_id: orderId,
          employee_id: event.data.employee.id,
          product_id: detail.product_id,
          product_option_id: detail.option_id,
          quantity: detail.quantity,
        };
      } else {
        return {
          order_id: orderId,
          employee_id: event.data.employee.id,
          product_id: detail.product_id,
          quantity: detail.quantity,
        };
      }
    })
  );

  if (error)
    throw new Error("Something went wrong while creating order details");

  state.pageIndex--;
}
</script>

<template>
  <div class="component order-form mt-10">
    <UForm :state="state" class="max-w-xl mx-auto space-y-4" @submit="onSubmit">
      <UFormGroup
        :label="$t(`form.employee-id`)"
        name="employee_id"
        :class="
          state.pageIndex == 0
            ? 'grid grid-cols-1 gap-5 items-center [&_label]:text-lg lg:grid-cols-[auto,1fr]'
            : 'hidden'
        "
      >
        <div class="flex gap-2.5 items-center">
          <UInput v-model="state.employee_id" type="number" class="grow" />
          <UButton
            type="button"
            class="bg-green-2 hover:bg-green-2 disabled:bg-green-2 disabled:grayscale hover:opacity-75 transition-opacity"
            @click="getEmployee()"
            :disabled="!state.employee_id"
            >{{ $t("form.next") }}</UButton
          >
        </div>
      </UFormGroup>

      <div
        :class="
          state.pageIndex == 1 ? 'flex flex-col items-center gap-5' : 'hidden'
        "
      >
        <h3 class="text-2xl text-center text-green-2 mb-5">
          {{ $t("form.order-of") }}
          <span class="font-medium">{{
            ` ${state.employee.first_name} ${state.employee.last_name}`
          }}</span>
        </h3>

        <UTable
          :columns="tableColumns"
          :rows="state.orderDetails"
          class="w-full bg-white rounded-xl [&_th:last-of-type]:w-4"
        >
          <template #name-data="{ row }">
            <span>{{ row.name }}</span>
          </template>

          <template #actions-data="{ row }">
            <div class="flex gap-2">
              <button
                class="p-1 transition-colors hover:bg-gray-200 rounded-xl"
                type="button"
                @click="lessenProduct(row.product_id, row.option_id)"
              >
                <MdiIcon icon="mdiMinus" class="text-2xl !h-6 text-gray-500" />
              </button>
              <button
                class="p-1 transition-colors hover:bg-gray-200 rounded-xl"
                type="button"
                @click="addProduct(row.product_id, row.option_id)"
              >
                <MdiIcon icon="mdiPlus" class="text-2xl !h-6 text-gray-500" />
              </button>
            </div>
          </template>

          <template #empty-state>
            <div class="flex flex-col items-center justify-center py-6">
              <span class="text-sm">Geen producten!</span>
            </div>
          </template>
        </UTable>

        <div class="flex w-full lg:w-1/2 gap-2.5 items-center">
          <USelect
            class="grow [&_select]:py-2"
            :options="products"
            :option-attribute="locale == 'en' ? 'english_name' : 'dutch_name'"
            value-attribute="id"
            v-model="state.selectedProductId"
          />

          <USelect
            v-if="
              productOptions.filter(
                (option) => option.product_id == state.selectedProductId
              ).length > 0
            "
            class="grow [&_select]:py-2"
            :options="
              productOptions.filter(
                (option) => option.product_id == state.selectedProductId
              )
            "
            :option-attribute="locale == 'en' ? 'english_name' : 'dutch_name'"
            value-attribute="id"
            v-model="state.selectedOptionId"
          />

          <UButton
            type="button"
            class="bg-green-2 hover:bg-green-2 disabled:bg-green-2 disabled:grayscale hover:opacity-75 transition-opacity"
            @click="addProduct(state.selectedProductId, state.selectedOptionId)"
          >
            <MdiIcon icon="mdiPlus" class="text-2xl !h-6" />
          </UButton>
        </div>

        <div class="flex justify-between w-full">
          <UButton
            type="button"
            class="bg-green-2 hover:bg-green-2 hover:opacity-75 transition-opacity"
            @click="state.pageIndex--"
            >{{ $t("form.back") }}</UButton
          >

          <UButton
            type="submit"
            class="bg-green-2 hover:bg-green-2 hover:opacity-75 transition-opacity"
            >{{ $t("form.order") }}</UButton
          >
        </div>
      </div>
    </UForm>

    <Suspense v-if="state.pageIndex == 0">
      <OrderOverview />

      <template #fallback>
        <USkeleton class="h-[300px] w-full mt-16 rounded-xl" />
      </template>
    </Suspense>
  </div>
</template>

<style scoped>
label {
  @apply text-2xl;
}
</style>

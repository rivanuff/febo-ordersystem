<script setup>
const { locale, setLocale } = useI18n();
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
    label: "Product",
  },
  {
    key: "option_name",
    label: "Extra",
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
    label: "Options",
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
    state.pageIndex++;
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
  console.log(event.data);
}
</script>

<template>
  <div class="component order-form mt-10">
    <UForm :state="state" class="max-w-xl mx-auto space-y-4" @submit="onSubmit">
      <UFormGroup
        label="What's your employee ID?"
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
            >Next</UButton
          >
        </div>
      </UFormGroup>

      <div
        :class="
          state.pageIndex == 1 ? 'flex flex-col items-center gap-5' : 'hidden'
        "
      >
        <h3 class="text-2xl text-center text-green-2 mb-5">
          Bestelling van
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
            >Go back</UButton
          >

          <UButton
            type="submit"
            class="bg-green-2 hover:bg-green-2 hover:opacity-75 transition-opacity"
            >Order</UButton
          >
        </div>
      </div>
    </UForm>
  </div>
</template>

<style scoped>
label {
  @apply text-2xl;
}
</style>
